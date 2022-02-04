const {channelPrompt} = require('./prompts');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bracket')
		.setDescription('Start the bracket creation process'),
	async execute(interaction) {
		await interaction.reply({ content: "Check your direct messages for the following steps to create a bracket", ephemeral: true });
		if(!interaction.user.dmChannel) await interaction.user.createDM();
		let dmChannel = interaction.user.dmChannel;
		let channel;
		try{
			channel = await channelPrompt(dmChannel, interaction.channel, interaction.guild.channels);
		} catch(e){
			console.log(e);
			if(e === 'exit') await dmChannel.send('Bracket has been canceled')
			else await dmChannel.send('You took too long to respond. Try again later.')
			return
		}
		
	},
};