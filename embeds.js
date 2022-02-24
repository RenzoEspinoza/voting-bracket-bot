const { MessageEmbed } = require('discord.js');

const embed = (title, description, footer='') => {
	return new MessageEmbed()
		.setColor('#6867AC')
		.setTitle(title)
		.setDescription(description)
		.setFooter(footer);
}

const promptEmbed = (title, description, footer='') => {
	const exitFooter = footer + "Type '!exit' to cancel the bracket";
	return(embed(title, description, exitFooter));
}

const votingEmbed = (left, right, votingTime) => {
	const date = new Date();
	date.setMilliseconds(date.getMilliseconds() + votingTime)
	const displayUrl = (contestant) =>{
		if(contestant.youtube) return contestant.link;
		else return '';
	}
	return new MessageEmbed()
		.setColor('#6867AC')
		.setTitle('Matchup Vote')
		.setDescription(`Vote to decide the winner. Voting ends at ${date}\n\n🔵 :\n**${left.name}**\n${displayUrl(left)} \n\n🟠 :\n**${right.name}**\n${displayUrl(right)}`)
		.addFields(
			{name: `🔵 ( 0 )`, value:'Voters:\n', inline: true},
			{name: `🟠 ( 0 )`, value:'Voters:\n', inline: true}
		)
}

module.exports = {
	embed,
    promptEmbed,
	votingEmbed,
}