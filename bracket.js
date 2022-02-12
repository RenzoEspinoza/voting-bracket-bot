const prompts = require('./prompts');
const fetchContestants = require('./fetchContestants');
const {fetchImages} = require('./fetchImages')
const { SlashCommandBuilder } = require('@discordjs/builders');
const {v4: uuidv4} = require('uuid');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bracket')
		.setDescription('Start the bracket creation process'),
	async execute(interaction) {
		await interaction.reply({ content: "Check your direct messages for the following steps to create a bracket", ephemeral: true });
		if(!interaction.user.dmChannel) await interaction.user.createDM();
		let dmChannel = interaction.user.dmChannel;
		let bracketChannel, title, numContestants, bracketSize, contestants, bracketId;
		try{
			bracketChannel = await prompts.channelPrompt(dmChannel, interaction.channel, interaction.guild.channels);
			title = await prompts.titlePrompt(dmChannel);
			[numContestants, bracketSize] = await prompts.amountPrompt(dmChannel);
			contestants = await fetchContestants.randomBracket(dmChannel, numContestants);
			console.log(contestants);
			bracketId = uuidv4();
			console.log(bracketId);
			await fetchImages(contestants, bracketId, dmChannel);
		} catch(e){
			console.log(e);
			if(e === '!exit') await dmChannel.send('Bracket has been canceled')
			else await dmChannel.send('You took too long to respond. Try again later.')
			return
		}
		
	},
};