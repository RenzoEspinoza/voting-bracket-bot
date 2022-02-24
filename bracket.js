const { createCanvas, loadImage } = require('canvas');
const {votingEmbed} = require('./embeds');
const { MessageActionRow, MessageButton, MessageEmbed} = require('discord.js');
const fs = require('fs');
const wait = require('util').promisify(setTimeout);

async function test(bracketChannel, dmChannel){
    let entries = contestants.slice(0,3);
    const bracketSize = 4;
    const votingRoundAmount = Math.log2(bracketSize);
    const votingTime = await votingTimePrompt(dmChannel);
    const bracket = new Bracket(213,'This title should be 32 characte', entries, votingTime, bracketChannel, bracketSize);
    await bracket.resizeContestantImages();
    await bracket.initializeImage();
    await proceedPrompt(dmChannel, bracket.id, bracket.channel);
    const commenceMessage = new MessageEmbed()
        .setColor('#6867AC')
        .setTitle(`"${bracket.title}" Tournament has commenced`)
        .setDescription('Members of this server will vote to decide the winner of each matchup.\n The first round of voting will begin shortly!')
        .setImage('attachment://bracket.png')
    await bracket.channel.send({embeds: [commenceMessage], files: [`./images/${bracket.id}/bracket.png`]});
    await wait(10000)
    for(let i=0; i<votingRoundAmount; i++){
        await bracket.roundOfVoting();
        await wait(10000);
    }
    console.log(bracket);
}

class Contestant{
    constructor(id, name, link, youtube=false){
        this.id = id;
        this.name = name;
        this.link = link;
        this.youtube = youtube;
    }
}

class Matchup{
    constructor(left, right, winner=null){
        this.left = left;
        this.right = right;
        this.winner = winner;
    }
}

class Bracket {
    constructor(id, title, contestants, votingTime, channel, bracketSize){
        this.id = id;
        this.title = title;
        this.votingTime = votingTime;
        this.channel = channel;
        this.canvas = createCanvas();
        this.ctx = this.canvas.getContext('2d');
        this.contestants = Array.from(contestants);
        this.bracketSize = bracketSize;
        for(let i=0; i < bracketSize - contestants.length; i++){
            contestants.push(new Contestant('bye','BYE',''));
        } 
        switch (bracketSize){
            case 2:
                this.canvas.width = 1600;
                this.canvas.height = 900;
                this.cardWidth = 436;
                this.cardHeight = 245.25;
                this.imagePositions = Array.from(two);
                this.scorePositions = Array.from(twoScores);
                break;
            case 4:
                this.canvas.width = 1920;
                this.canvas.height = 1080;
                this.cardWidth = 352;
                this.cardHeight = 198;
                this.imagePositions = Array.from(four);
                this.scorePositions = Array.from(fourScores);
                break;
            case 8:
                this.canvas.width = 1920;
                this.canvas.height = 2160;
                this.cardWidth = 396;
                this.cardHeight = 222.75;
                this.imagePositions = Array.from(eight);
                this.scorePositions = Array.from(eightScores);
                break;
        }
        this.final = assignMatchups(contestants);
    }

    async resizeContestantImages(){
        const canvas = createCanvas(this.cardWidth, this.cardHeight);
        const ctx = canvas.getContext('2d');
        for(let c of this.contestants){
            if(!c.link) continue;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let image = await loadImage(`./images/${this.id}/${c.id}.png`);
            let dimensions = calculateAspectRatioFit(image.width, image.height, this.cardWidth, this.cardHeight);
            ctx.drawImage(image, this.cardWidth/2 - dimensions.width/2, 0, dimensions.width, dimensions.height);
            const buffer = canvas.toBuffer("image/png");
            fs.writeFileSync(`./images/${this.id}/${c.id}.png`, buffer);
        }
    }

    async initializeImage(){
        let image = await loadImage(`./assets/${this.bracketSize}template.png`);
        this.ctx.drawImage(image, 0, 0, this.canvas.width, this.canvas.height);
        this.ctx.font = '900 52px Sans';
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.title, this.canvas.width/2, 75);
        
        this.ctx.font = '500 36px Sans';
        this.ctx.fillStyle = 'rgb(15, 15, 15)'

        let queue = [], current = this.final;
        queue.push(current);
        while(queue.length){
            current = queue.shift();
            if (current.left instanceof Contestant){
                await this.updateImage(current.left);
                await this.updateImage(current.right)
            }
            else{
                queue.push(current.left);
                queue.push(current.right);
            }
        }
        this.writeImage();
    }
    
    writeImage(){
        const buffer = this.canvas.toBuffer("image/png");
        fs.writeFileSync(`./images/${this.id}/bracket.png`, buffer);
    }

    async roundOfVoting(){
        let queue = [], current = this.final, isFinalRound=false;
        queue.push(current);
        while(queue.length){

            current = queue.shift();
            if (current.left instanceof Contestant){
                let winner = await this.holdVote(current.left, current.right);
                if(current == this.final){
                    this.cardWidth *= 1.25;
                    this.cardHeight *= 1.25;
                    isFinalRound = true;
                }
                await this.updateImage(winner)
                if(!isFinalRound) await this.channel.send(`**${winner.name}** advances to the next round!`)
                current.winner = winner;
            }
            else{
                if(current.left.winner){
                    let winner = await this.holdVote(current.left.winner, current.right.winner);
                    if(current == this.final){
                        this.cardWidth *= 1.25;
                        this.cardHeight *= 1.25;
                        isFinalRound = true;
                    }
                    await this.updateImage(winner);
                    if(!isFinalRound) await this.channel.send(`**${winner.name}** advances to the next round!`)
                    current.winner = winner;
                }
                else{
                    queue.push(current.left);
                    queue.push(current.right);
                }
            }
        }
        this.writeImage();
        const embed = new MessageEmbed().setColor('#6867AC').setImage('attachment://bracket.png');
        if(isFinalRound){
            embed
                .setTitle(`Bracket "${this.title}" has ended`)
                .setDescription(`**${this.final.winner.name}** is the winner!`)
        }
        else{
            embed
                .setTitle(`The round of voting has ended`)
                .setDescription('The next round of voting will begin shortly.\nHere is how the bracket currently stands:')
        }
        await this.channel.send({embeds: [embed], files: [`./images/${this.id}/bracket.png`]});
    }

    async holdVote(left, right){
        if(left.id==='bye' || right.id==='bye'){
            await this.drawResults(0,0);
            if(left.id==='bye' && right.id==='bye'){
                return left;
            }
            if(left.id==='bye') return right;
            else return left;
        }

        await this.createMatchupImage(left, right);
        const row = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('left')
					.setLabel(`🔵`)
					.setStyle('SECONDARY'),
                new MessageButton()
					.setCustomId('right')
					.setLabel(`🟠`)
					.setStyle('SECONDARY'),
		);
        const embed = votingEmbed(left, right, this.votingTime);
        const voteMessage = await this.channel.send({embeds: [embed], 
            components: [row],
        });
        await this.channel.send({files: [`./images/${this.id}/currentMatchup.png`]})
        const collector = voteMessage.createMessageComponentCollector({time: this.votingTime});
        const pressedLeft = [], pressedRight = [];
        collector.on('collect', async i => {
            if (i.customId === 'left'){
                const embed = i.message.embeds[0];
                if(pressedLeft.indexOf(i.user.id) > -1){
                    console.log('left voter already voted for left');
                    pressedLeft.splice(pressedLeft.indexOf(i.user.id), 1);
                    embed.fields[0] = {name: `🔵 (${pressedLeft.length})`, value:embed.fields[0].value.replace(`\n${i.user.username}`,''), inline: true};
                    await voteMessage.edit({embeds: [embed]});
                    await i.deferUpdate();
                    return;
                }
                if(pressedRight.indexOf(i.user.id) > -1){
                    console.log('left voter voted for right before');
                    pressedRight.splice(pressedRight.indexOf(i.user.id), 1);
                    embed.fields[1] = {name: `🟠 (${pressedRight.length})`, value:embed.fields[1].value.replace(`\n${i.user.username}`,''), inline: true};
                }
                pressedLeft.push(i.user.id);
                embed.fields[0] = {name: `🔵 (${pressedLeft.length})`, value:embed.fields[0].value+`\n${i.user.username}`, inline: true};
                console.log(pressedLeft);
                console.log(pressedRight);
                await voteMessage.edit({embeds: [embed]});
                await i.deferUpdate();
            }
            if (i.customId === 'right'){
                console.log(pressedLeft);
                console.log(pressedRight);
                const embed = i.message.embeds[0];
                if(pressedRight.indexOf(i.user.id) > -1){
                    console.log('right voter already voted for right');
                    pressedRight.splice(pressedRight.indexOf(i.user.id), 1);
                    embed.fields[1] = {name: `🟠 (${pressedRight.length})`, value:embed.fields[1].value.replace(`\n${i.user.username}`,''), inline: true};
                    await voteMessage.edit({embeds: [embed]});
                    await i.deferUpdate();
                    return;
                }
                if(pressedLeft.indexOf(i.user.id) > -1){
                    console.log('right voter voted for left before');
                    pressedLeft.splice(pressedLeft.indexOf(i.user.id), 1);
                    embed.fields[0] = {name: `🔵 (${pressedRight.length})`, value:embed.fields[0].value.replace(`\n${i.user.username}`,''), inline: true};
                }
                pressedRight.push(i.user.id);
                embed.fields[1] = {name: `🟠 (${pressedRight.length})`, value:embed.fields[1].value+`\n${i.user.username}`, inline: true};
                console.log(pressedLeft);
                console.log(pressedRight);
                await voteMessage.edit({embeds: [embed]});
                await i.deferUpdate();
            }
        })
        await wait(this.votingTime);
        const leftScore = pressedLeft.length;
        const rightScore = pressedRight.length;
        this.drawResults(leftScore, rightScore);
        if(leftScore === rightScore){
            await this.channel.send('The voting phase has resulted in a draw, the winner will be decided randomly...');
            const randomWinner = Math.random() < 0.5 ? left : right;
            return randomWinner;
        }
        return leftScore > rightScore ? left : right;
    }

    async drawResults(leftScore, rightScore){
        this.ctx.font = '700 40px Sans';
        this.ctx.fillStyle = 'white';
        let position = this.scorePositions.shift();
        this.ctx.fillText(leftScore, position.x, position.y);
        position = this.scorePositions.shift();
        this.ctx.fillText(rightScore, position.x, position.y);
        this.ctx.font = '500 36px Sans';
        this.ctx.fillStyle = 'rgb(15, 15, 15)';
    }

    async createMatchupImage(left, right){
        const canvas = createCanvas(1280, 400);
        const ctx = canvas.getContext('2d');
        ctx.font = '500 42px Sans';
        ctx.fillStyle = 'rgb(15, 15, 15)';
        ctx.textAlign = 'center';

        let image = await loadImage(`./assets/versustemplate.png`);
        ctx.drawImage(image, 0, 0);
        if(left.link){
            image = await loadImage(`./images/${this.id}/${left.id}.png`);
            ctx.drawImage(image, 0, 0, 575, 323);
        }
        ctx.fillText(left.name, 286, 378)
        if(right.link){
            image = await loadImage(`./images/${this.id}/${right.id}.png`);
            ctx.drawImage(image, 705, 0, 575, 323);
        }
        ctx.fillText(right.name, 992.5, 378)
        const buffer = canvas.toBuffer("image/png");
        fs.writeFileSync(`./images/${this.id}/currentMatchup.png`, buffer);
    }
    
    async updateImage(contestant){
        let position = this.imagePositions.shift();
        console.log(contestant);
        if(contestant.link){
            let image = await loadImage(`./images/${this.id}/${contestant.id}.png`);
            this.ctx.drawImage(image, position.x, position.y, this.cardWidth, this.cardHeight);
        }
        this.ctx.fillText(contestant.name, position.x + this.cardWidth/2, position.y+this.cardHeight + 46);
    }
    
}

function assignMatchups(arr) {
    if(arr.length === 1) return arr[0]
    let bracket = [];
    while(arr.length > 0){
        let matchup = new Matchup(getRandomItem(arr), getRandomItem(arr));
        bracket.push(matchup);
    }
    return assignMatchups(bracket);
}

function getRandomItem(arr){
    let randomIndex = Math.floor(Math.random()*arr.length);
    let randomItem = arr.splice(randomIndex,1);
    return randomItem[0];
}

function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
    let ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
    return { width: srcWidth*ratio, height: srcHeight*ratio };
 }

const contestants = [
    new Contestant(1, '16 characters lo', 'https://www.youtube.com/watch?v=rwgwSomR0B8', true),
    new Contestant(2, '20 characters long m', 'image url'),
    new Contestant(3, '24 characters long 24242', '3'),
    new Contestant(4, 'cow', '4'),
    new Contestant(5, 'pig', '5'),
    new Contestant(6, 'bird', '6'),
    new Contestant(7, 'fox', '7'),
    new Contestant(8, 'duck', '8'),
]

const two = [
    {x: 20, y: 391},
    {x: 1144, y: 391},
    {x: 527, y: 358},
]

const twoScores = [
    {x: 491.5, y: 530},
    {x: 1108, y: 530}
]

const four = [
    {x: 25, y: 25},
    {x: 25, y: 795},
    {x: 1543, y: 25},
    {x: 1534, y: 795},
    {x: 260.5, y: 410.5},
    {x: 1307.5, y: 410.5},
    {x: 742.26, y: 385.75}
]

const fourScores = [
    {x: 412, y: 127},
    {x: 412, y: 939},
    {x: 1508, y: 127},
    {x: 1508, y: 939},
    {x: 677, y: 533},
    {x: 1245, y: 533}
]

const eight = [
    {x: 25, y: 25}, {x: 25, y: 801}, {x: 1500, y: 25}, {x: 1500, y: 801},
    {x: 25, y: 1114}, {x: 25, y: 1842}, {x: 1500, y: 1114}, {x: 1500, y: 1842},
    {x: 260, y: 398}, {x: 1265, y: 398}, {x: 260, y: 1474}, {x: 1265, y: 1474},
    {x: 761, y: 398}, {x: 761, y: 1474},
    {x: 715, y: 905}
]

const eightScores = [
    {x: 445.5, y: 124}, {x: 445.5, y: 939},
    {x: 1475, y: 124},{x: 1475, y: 939},
    {x: 445.5, y: 1202}, {x: 445.5, y: 2016},
    {x: 1475, y: 1202},{x: 1475, y: 2016},

    {x: 707.5, y: 532.5}, {x: 1210, y: 532.5},
    {x: 707.5, y: 1609},{x: 1210, y: 1609},

    {x: 960, y: 393}, {x: 960, y: 1767},
]

module.exports = {
    Bracket,
    Contestant,
};