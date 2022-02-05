require('dotenv').config();

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const WAIT_TIME = process.env.WAIT_TIME;

module.exports = {
    DISCORD_TOKEN,
    CLIENT_ID,
    GUILD_ID,
    WAIT_TIME
}