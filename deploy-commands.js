const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const {DISCORD_TOKEN, CLIENT_ID, GUILD_ID} = require('./config');
const bracket = require('./bracketCommand');
const about = require('./about');

const commands = [];
commands.push(bracket.data.toJSON());
commands.push(about.data.toJSON());

const rest = new REST({version: '9'}).setToken(DISCORD_TOKEN);

// used for testing commands
/*
rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);
*/

(async () => {
	try {
		console.log('Started refreshing application (/) commands.');
		
		await rest.put(
			Routes.applicationCommands(CLIENT_ID),
			{ body: commands },
		);

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();