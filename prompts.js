const { MessageEmbed } = require('discord.js');

function createEmbed(title, description, footer='') {
	const defaultFooter = footer + "Type 'exit' to cancel the bracket";
	return new MessageEmbed()
		.setColor('#FF4040')
		.setTitle(title)
		.setDescription(description)
		.setFooter(defaultFooter)
}

async function awaitMessage(dmChannel, condition, errMsg){
	let msgs;
	msgs = await dmChannel.awaitMessages({max: 1, time:5000, errors: ['time']});
	while(condition(msgs.first().content) && msgs.first().content != 'exit'){
        await dmChannel.send(errMsg)
		msgs = await dmChannel.awaitMessages({max: 1, time:5000, errors: ['time']});
	}
    if(msgs.first().content === 'exit'){
        throw 'exit';
    }
    return msgs.first().content;
}

async function channelPrompt(dmChannel, intChannel, guildChannels) {
	const title = 'Where would you like to post this bracket?';
	const description = `**1**: in the current channel, ${intChannel}\n**2**: in another channel`;
	const footer = 'Enter a number to choose\n';
    const embed = createEmbed(title, description, footer)
    const channels = await guildChannels.fetch();
	await dmChannel.send({embeds: [embed]})
	const result = await awaitMessage(dmChannel, oneTwo, oneTwoError);
    if(result === '1'){
        return intChannel;
    }
    else if(result === '2'){
        const anotherChannel = createEmbed('Enter the name of the channel', 'Channel must be from the server you sent the slash command from');
        await dmChannel.send({embeds: [anotherChannel]})
        function channelExists(msg){
            return !channels.some(channel => channel.type==='GUILD_TEXT' && channel.name===msg);
        }
        const newChannel = await awaitMessage(dmChannel, channelExists, 'Channel does not exist. Try typing the channel name again with no typos');
        return channels.find(channel => channel.type==='GUILD_TEXT' && channel.name===newChannel);
    }
}

const oneTwo = (msg) =>{
    return msg != '1' && msg !='2'
}
const oneTwoError = 'Your entry was invalid. Type one of the two numbers shown above.';

module.exports = {
    channelPrompt,
}