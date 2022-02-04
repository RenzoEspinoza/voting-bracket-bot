const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('about')
		.setDescription('What this bot does and where to find the source code'),
	async execute(interaction) {
		await interaction.reply('Voting Bracket Bot is a simple bot used for creating a tournament bracket where the members of a server vote to decide the winner. You can find the source code at https://github.com/RenzoEspinoza/voting-bracket-bot');
	},
};