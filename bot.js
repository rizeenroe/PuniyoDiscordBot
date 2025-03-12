require('dotenv').config();

const { 
   Client, 
   GatewayIntentBits, 
   SlashCommandBuilder,
   Collection, 
   MessageEmbed, 
   MessageAttachment,
   EmbedBuilder
} = require("discord.js");

const client = new Client({
   intents: [
       GatewayIntentBits.Guilds,
       GatewayIntentBits.GuildMembers,
       GatewayIntentBits.GuildMessages,
       GatewayIntentBits.MessageContent
   ],
});
client.commands = new Collection();

const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');

//load commands
const commandFiles = fs.readdirSync(path.join(__dirname, "commands")).filter(file => file.endsWith(".js"));
for(const file of commandFiles){
   const command = require(`./commands/${file}`);
   client.commands.set(command.data.name, command);
}

//load events
const eventFiles = fs.readdirSync(path.join(__dirname, "events")).filter(file => file.endsWith(".js"));
for(const file of eventFiles){
   const event = require(`./events/${file}`);
   client.on(event.name, (...args) => event.execute(client, ...args));
}

const minuteCode = require("./functions/scheduledCodes/minuteCode");
const minutes = 1;

const jobMinute = schedule.scheduleJob(`*/${minutes} * * * *`, () => {
   minuteCode(client); 

});

//login to discord
client.login(process.env.DISCORD_TOKEN).catch((error) => {
   console.error('Failed to log in:', error);
});
