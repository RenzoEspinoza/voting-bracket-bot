const prompts = require('./prompts');
const fetchContestants = require('./fetchContestants');
const {Bracket} = require('./Bracket');
const {fetchImages} = require('./fetchImages');
const {v4: uuidv4} = require('uuid');
const {MessageEmbed} = require('discord.js')
const {SlashCommandBuilder} = require('@discordjs/builders');
const wait = require('util').promisify(setTimeout);
const {proceedPrompt, votingTimePrompt} = require('./prompts');
const fs = require('fs');


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
			const votingRoundAmount = Math.log2(bracketSize);
			const votingTime = await votingTimePrompt(dmChannel);
			contestants = await fetchContestants.randomBracket(dmChannel, numContestants);
			bracketId = uuidv4();
			fs.mkdir(`./images/${bracketId}/`, {recursive: true}, (err) => {
				if(err) throw Error('file system error');
			})
			await fetchImages(contestants, bracketId, dmChannel);
			const bracket = new Bracket(bracketId, title, contestants, votingTime, bracketChannel, bracketSize);
			await bracket.resizeContestantImages();
			await bracket.initializeImage();
			await proceedPrompt(dmChannel, bracket.id, bracket.channel);
			const thread = await bracket.channel.threads.create({
				name: bracket.title,
				autoArchiveDuration: 60,
				reason: `New tournament created by ${interaction.user.username}`
			})
			bracket.channel = thread;
			const commenceMessage = new MessageEmbed()
				.setColor('#6867AC')
				.setTitle(`"${bracket.title}" Tournament has commenced`)
				.setDescription('Members of this server will vote to decide the winner of each matchup.\n The first round of voting will begin shortly!')
				.setImage('attachment://bracket.png')
			await bracket.channel.send({embeds: [commenceMessage], files: [`./images/${bracket.id}/bracket.png`]});
			await wait(10000);
			for(let i=0; i<votingRoundAmount; i++){
				await bracket.roundOfVoting();
				await wait(10000);
    		}
		} catch(e){
			console.log(e);
			if(e === '!exit'){
				await dmChannel.send('Bracket has been canceled');
				return;
			}
			if(e instanceof Map) await dmChannel.send('You took too long to respond. Try again later.');
			else await dmChannel.send('There was an unexpected error. Please try again later.')
			return
		}
	},
};