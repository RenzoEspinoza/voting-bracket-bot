const {embed, promptEmbed} = require('./embeds');
const {WAIT_TIME} = require('./config');
const ms = require('ms');

async function awaitMessage(dmChannel, condition, errMsg){
	let msgs;
	msgs = await dmChannel.awaitMessages({max: 1, time:WAIT_TIME, errors: ['time']});
	while(condition(msgs.first().content) && msgs.first().content != '!exit'){
        await dmChannel.send(errMsg)
		msgs = await dmChannel.awaitMessages({max: 1, time:WAIT_TIME, errors: ['time']});
	}
    if(msgs.first().content === '!exit'){
        throw '!exit';
    }
    return msgs.first().content;
}

async function channelPrompt(dmChannel, intChannel, guildChannels) {
	const title = 'Where would you like to post this bracket?';
	const description = `**1**: in the current channel, ${intChannel}\n**2**: in another channel`;
	const footer = 'Enter a number to choose.\n';
    const embed = promptEmbed(title, description, footer);
    const channels = await guildChannels.fetch();
	await dmChannel.send({embeds: [embed]});
	const result = await awaitMessage(dmChannel, oneTwo, oneTwoError);
    if(result === '1'){
        return intChannel;
    }
    else if(result === '2'){
        const anotherChannel = promptEmbed('Enter the name of the channel', 'Channel must be from the server you sent the slash command from.');
        await dmChannel.send({embeds: [anotherChannel]});
        function channelExists(msg){
            return !channels.some(channel => channel.type==='GUILD_TEXT' && channel.name===msg);
        }
        const newChannel = await awaitMessage(dmChannel, channelExists, 'Channel does not exist. Try typing the channel name again with no typos.');
        return channels.find(channel => channel.type==='GUILD_TEXT' && channel.name===newChannel);
    }
}

async function titlePrompt(dmChannel){
    const embedTitle = 'Enter the title of the bracket';
	const description = 'Up to 32 characters permitted.';
    const embed = promptEmbed(embedTitle, description);
    await dmChannel.send({embeds: [embed]});
    const longerThan = (msg) =>{
        return msg.length > 32;
    }
    const title = await awaitMessage(dmChannel, longerThan, 'The title you entered contains more than 32 characters. Try again.');
    return title;
}

async function amountPrompt(dmChannel){
    const title = 'How many contestants?';
	const description = '2 to 8 contestants are permitted.\nIdeally 2, 4, or 8 to avoid byes.';
    const embed = promptEmbed(title,description);
    const twoToEight = (msg) => {
        const num = Number(msg);
        if(!num) return true;
        return num < 2 || num > 8;
    }
    let retry = '2', continueMessage, numContestants, bracketSize;
    while(retry === '2'){
        await dmChannel.send({embeds: [embed]});
        numContestants = await awaitMessage(dmChannel, twoToEight, 'Your entry was invalid. Enter a number between 2 and 8.');
        bracketSize = Math.pow(2, (Math.ceil(Math.log2(numContestants))));
        continueMessage = promptEmbed(`Bracket size will be ${bracketSize} entries`, 
        `There will be ${bracketSize - numContestants} byes. Would you like to
        **1**: Continue
        **2**: Enter a new amount of contestants`,
        'A bye is an automatic win for the opposing contestant. Byes are used to fill up a bracket where the number of participants is not a power of 2\n');
        await dmChannel.send({embeds: [continueMessage]});
        retry = await awaitMessage(dmChannel, oneTwo, oneTwoError);
    }
    return [Number(numContestants), bracketSize];
}

async function proceedPrompt(dmChannel, bracketId, bracketChannel){
    const title = 'Bracket created.';
	const description = `The bracket is displayed below. Would you like to proceed and have the voting phase begin in ${bracketChannel}? Or would you like to cancel this bracket?
    **1**: Proceed
    **2**: Cancel bracket`;
    const displayBracketEmbed = embed(title,description);
    displayBracketEmbed.setImage('attachment://bracket.png')
    await dmChannel.send({embeds: [displayBracketEmbed], files: [`./images/${bracketId}/bracket.png`]});
    const answer = await awaitMessage(dmChannel, oneTwo, oneTwoError);
    if(answer==='1'){
        await dmChannel.send(`Bracket will appear in ${bracketChannel} shortly`);
        return
    }
    throw '!exit';
}

const oneTwo = (msg) =>{
    return msg != '1' && msg !='2';
}
const oneTwoError = 'Your entry was invalid. Type one of the two numbers shown above.';

async function votingTimePrompt(dmChannel){
    const title = 'Enter the amount of time the users will have to place their votes for each matchup'
    const description = "The maximum amount of time to vote is 1 hour, and the minimum is 30 seconds\nSuppose you wanted to set the voting time to 1 minute, you could type '1 minute', '1m', '60 seconds', or '60s'"
    const timeEmbed = embed(title, description);
    const isntCorrectTime = (msg) => {
        const toTime = ms(msg);
        console.log(toTime);
        if(!toTime){
            return true
        }
        return toTime < 30000 || toTime > 3600000;
    }
    const incorrectTimeError = 'The time you entered is invalid. Try again and make sure it is at least 30 seconds and at max 1 hour.';
    await dmChannel.send({embeds: [timeEmbed]});
    const waitTime = await awaitMessage(dmChannel, isntCorrectTime, incorrectTimeError);
    return ms(waitTime);
}

module.exports = {
    channelPrompt,
    titlePrompt,
    amountPrompt,
    proceedPrompt,
    votingTimePrompt
}