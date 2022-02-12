const fs = require('fs');
const fetch = require('node-fetch');
const getDirName = require('path').dirname;

async function fetchImages(contestants, bracketId, dmChannel) {
    const youtube = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    for(let c of contestants){
        if(!c.link) continue;
        let url = c.link, maxTries = 4, count=0;
        while(true) {
            let isYoutubeVideo = youtube.exec(url);
            try{
                if(isYoutubeVideo){
                    await getImage(`https://img.youtube.com/vi/${isYoutubeVideo[1]}/hqdefault.jpg`, c.id, bracketId);
                }
                else {
                    await getImage(url, c.id, bracketId);
                }
                break;
            }
            catch (e) {
                console.log(e);
                count++;
                if(count === maxTries){
                    dmChannel.send(`You've reached your limit of tries, no image will be shown for the contestant "${c.name}`)
                    break;
                }
                let tryAgain = 
                `The url you entered for the contestant "${c.name}" is not valid. Try entering a new url, without parentheses, and make sure that it is a direct link to a YouTube video or an image.\nFor images, the url should end with '.png', '.jpg', or '.jpeg'.\nYou have ${maxTries - count} tries left.\nIf you would like no image then enter '!none'`;
                await dmChannel.send(tryAgain);
                let msg = await dmChannel.awaitMessages({max: 1, time:30000, errors:['time']})
                url = msg.first().content;
                if(url === '!none'){
                    break;
                }
            }
        }
    }
}

async function getImage(url, contestantId, bracketId) {
    const res = await fetch(url);
    const blob = await res.blob();
    if(blob.type.startsWith('image/')) {
        let buffer = await blob.arrayBuffer();
        buffer = Buffer.from(buffer);
        let path = `./images/${bracketId}/${contestantId}.${blob.type.split('/').pop()}`;
        fs.mkdir(getDirName(path), {recursive: true}, (err) => {
            if(err) throw Error('file system error');
            fs.writeFileSync(path, buffer);
        })
    }
    else{
        throw Error('not an image');
    }
}

module.exports = {
    fetchImages,
}