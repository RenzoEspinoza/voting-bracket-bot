const {embedPrompt} = require('./embeds');
const {WAIT_TIME} = require('./config');

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
    const embed = embedPrompt(title, description, footer);
    const channels = await guildChannels.fetch();
	await dmChannel.send({embeds: [embed]});
	const result = await awaitMessage(dmChannel, oneTwo, oneTwoError);
    if(result === '1'){
        return intChannel;
    }
    else if(result === '2'){
        const anotherChannel = embedPrompt('Enter the name of the channel', 'Channel must be from the server you sent the slash command from.');
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
    const embed = embedPrompt(embedTitle, description);
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
    const embed = embedPrompt(title,description);
    const twoToEight = (msg) => {
        const num = Number(msg);
        return num < 2 || num > 8;
    }
    let retry = '2', continueMessage, numContestants, bracketSize;
    while(retry === '2'){
        await dmChannel.send({embeds: [embed]});
        numContestants = await awaitMessage(dmChannel, twoToEight, 'Your entry was invalid. Enter a number between 2 and 8.');
        bracketSize = Math.pow(2, (Math.ceil(Math.log2(numContestants))));
        continueMessage = embedPrompt(`Bracket size will be ${bracketSize} entries`, 
        `There will be ${bracketSize - numContestants} byes. Would you like to
        **1**: Continue
        **2**: Enter a new amount of contestants`,
        'A bye is an automatic win for the opposing contestant. Byes are used to fill up a bracket where the number of participants is not a power of 2\n');
        await dmChannel.send({embeds: [continueMessage]});
        retry = await awaitMessage(dmChannel, oneTwo, oneTwoError);
    }
    return [Number(numContestants), bracketSize];
}

const oneTwo = (msg) =>{
    return msg != '1' && msg !='2';
}
const oneTwoError = 'Your entry was invalid. Type one of the two numbers shown above.';

module.exports = {
    channelPrompt,
    titlePrompt,
    amountPrompt,
}