const config = require('./config');
const {Client, Collection, Intents} = require('discord.js');
const bracketCommand = require('./bracketCommand');
const about = require('./about');

const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES]});
client.commands = new Collection();
client.commands.set(bracketCommand.data.name, bracketCommand);
client.commands.set(about.data.name, about);

client.once('ready', () => {
    console.log('Client is ready');
})

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()){
		console.log('not a command');
		return;
	} 
	const command = client.commands.get(interaction.commandName);
	if (!command) return;
	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

client.login(config.DISCORD_TOKEN);
