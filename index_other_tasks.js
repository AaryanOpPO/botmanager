//IMPORTING NPM PACKAGES
const Discord = require('discord.js');
const colors = require("colors");
const Enmap = require("enmap");
const config = require("./config.json")

const client = new Discord.Client({
	
    allowedMentions: {
      parse: [ "roles", "users" ],
      repliedUser: false,
    },
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
	intents: [ 
		Discord.Intents.FLAGS.GUILDS,
		Discord.Intents.FLAGS.GUILD_MEMBERS,
		Discord.Intents.FLAGS.GUILD_VOICE_STATES,
		Discord.Intents.FLAGS.GUILD_PRESENCES,
		Discord.Intents.FLAGS.GUILD_MESSAGES,
		Discord.Intents.FLAGS.DIRECT_MESSAGES,
	]
});

client.on("warn", e => console.log(e.stack ? String(e.stack).grey : String(e).grey))
client.on("debug", e => console.log(e.stack ? String(e.stack).grey : String(e).grey))
client.on("rateLimit", e => console.log(JSON.stringify(e).grey))

client.config = require("./config.json");

client.ticketdata = new Enmap({name: "ticketdata",dataDir: "./dbs/others"});


require("./modules/events/guildMemberAdd")(client)
require("./modules/events/guildMemberUpdate")(client)
require("./modules/events/ready")(client)
require("./modules/events/threadCreate")(client)
require("./modules/others/feedback_system")(client)
require("./modules/others/verifysystem")(client)
require("./modules/others/guess_the_number")(client)
require("./modules/others/status_role_system")(client)
require("./modules/others/ticket_updatemsg")(client)
require("./modules/others/features")(client)
require("./modules/others/autodelete")(client)
require("./modules/others/validcode")(client)


client.on("messageCreate",(message)=>{require("./modules/others/suggest")(client, message)});
client.on("messageCreate",(message)=>{require("./modules/others/chatbot")(client, message)});


client.login(client.config.token);
