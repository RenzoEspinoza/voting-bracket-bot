const {embed} = require('./embeds');

async function randomBracket(dmChannel, numContestants) {
    const ask = embed(`Enter ${numContestants} contestants.`, randomExplanation);
    await dmChannel.send({embeds: [ask]});
    const regex = /^"([^\n"]{1,32})" *(\(([\w\S]+)\))?$/i;
    const entries = await getContestants(dmChannel, regex, numContestants);
    return entries;
}

async function getContestants(dmChannel, regex, numEntries){
	let msgs = new Array(numEntries);
    for(let i=0; i<numEntries; i++){
        let msg = await dmChannel.awaitMessages({max: 1, time:15000, errors:['time']});
        while(!regex.test(msg.first().content)){
            await dmChannel.send(entryErrorMessage);
            msg = await dmChannel.awaitMessages({max: 1, time:15000, errors:['time']});
        }
        let match = regex.exec(msg.first().content);
        msgs[i] = {title: match[1], link: match[3]};
        await dmChannel.send(`Entry accepted. ${numEntries-i-1} more to go.`);
    }
    return msgs;
}


module.exports = {
    randomBracket,
}

const randomExplanation = `Enter each contestant in a separate message one-by-one in this format:

> "*contestantName*" (*link*)

Links can either be a direct link to an image or a Youtube video link.
For YouTube links, the thumbnail of the video will be displayed in the bracket and the video will be shared in chat come voting time.
Links are optional, if you would like no image to be displayed in the bracket then just type the name of the contestant.

For example:

> "Fat Cat" (exampleurl.com/pictureoffatcat.jpg)

or just:

> "Fat Cat"`;

const entryErrorMessage = `Your entry was invalid, try again. The title cannot be empty and must be less than 32 characters. The title must also be between double quatation marks, use single quation marks if your title contains a quote.
The link must be in parentheses and cannot contain whitespace. If you don't want to enter an image or video then just type the title.`