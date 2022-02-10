const { MessageEmbed } = require('discord.js');

const embed = (title, description, footer='') => {
	return new MessageEmbed()
		.setColor('#FF4040')
		.setTitle(title)
		.setDescription(description)
		.setFooter(footer);
}

const embedPrompt =(title, description, footer='') => {
	const exitFooter = footer + "Type '!exit' to cancel the bracket";
	return(embed(title, description, exitFooter));
}

module.exports = {
	embed,
    embedPrompt,

}