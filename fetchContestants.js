const {embed} = require('./embeds');
const {Contestant} = require('./Bracket');
const {WAIT_TIME} = require('./config');

async function randomBracket(dmChannel, numContestants) {
    const ask = embed(`Enter ${numContestants} contestants.`, randomExplanation);
    await dmChannel.send({embeds: [ask]});
    const regex = /^"([^\n"]{1,20})" *(\(([\w\S]+)\))?$/i;
    const entries = await getContestants(dmChannel, regex, numContestants);
    dmChannel.send('Bracket entries saved. Please wait while the bracket is being generated...')
    return entries;
}

async function getContestants(dmChannel, regex, numEntries){
	let msgs = new Array(numEntries);
    for(let i=0; i<numEntries; i++){
        let msg = await dmChannel.awaitMessages({max: 1, time:WAIT_TIME, errors:['time']});
        while(!regex.test(msg.first().content)){
            await dmChannel.send(entryErrorMessage);
            msg = await dmChannel.awaitMessages({max: 1, time:WAIT_TIME, errors:['time']});
        }
        let match = regex.exec(msg.first().content);
        msgs[i] = new Contestant(i, match[1], match[3]);
        await dmChannel.send(`Entry accepted. ${numEntries-i-1} more to go.`);
    }
    return msgs;
}


module.exports = {
    randomBracket,
}

const randomExplanation = `Enter each contestant in a separate message one-by-one in this format:

> "*contestantName*" (*link*)

Names must be in quotation marks and less than 20 characters.
Links must be in parentheses and can either be a direct link to an image or a Youtube video link.
For YouTube links, the thumbnail of the video will be displayed in the bracket and the video will be shared in chat come voting time.
For image links, the url must link to a picture, not a webpage containing a picture.
For example, https://en.wikipedia.org/wiki/Cat#/media/File:Cat_poster_1.jpg would not work, but https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Cat_poster_1.jpg/1920px-Cat_poster_1.jpg would

Links are optional but recommended, if you would like no image to be displayed in the bracket then just type the name of the contestant.

For example:

> "Fat Cat" (exampleurl.com/pictureoffatcat.jpg)

or just:

> "Fat Cat"`;

const entryErrorMessage = `Your entry was invalid, try again. The name cannot be empty and must be less than 20 characters. The title must also be between double quatation marks, use single quation marks if your title contains a quote.
The link must be in parentheses and cannot contain whitespace. If you don't want to enter an image or video then just type the title.`