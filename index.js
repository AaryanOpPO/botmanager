//IMPORTING NPM PACKAGES
const Discord = require('discord.js');
const colors = require("colors");
const fs = require("fs");
const Enmap = require("enmap");

//Create the bot client
const client = new Discord.Client({
    allowedMentions: { 
		parse: [ "roles", "users" ],
      	repliedUser: false,
    },
	failIfNotExists: false,
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
	intents: [ 
		Discord.Intents.FLAGS.GUILDS,
		Discord.Intents.FLAGS.GUILD_MEMBERS,
		Discord.Intents.FLAGS.GUILD_VOICE_STATES,
		Discord.Intents.FLAGS.GUILD_PRESENCES,
		Discord.Intents.FLAGS.GUILD_MESSAGES,
		Discord.Intents.FLAGS.DIRECT_MESSAGES,
	],
});


client.on("warn", e => console.log(e.stack ? String(e.stack).grey : String(e).grey))
client.on("debug", e => console.log(e.stack ? String(e.stack).grey : String(e).grey))
client.on("rateLimit", e => console.log(JSON.stringify(e).grey))
client.config = require("./config.json");
client.createingbotmap = new Discord.Collection();
client.cooldowns = new Discord.Collection();
client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
client.setups = new Enmap({name: "setups",dataDir: "./dbs/others"});
client.bots = new Enmap({name: "bots",dataDir: "./dbs/bots"});
client.payments = new Enmap({name: "payments", dataDir: "./dbs/payments"});
client.payments.ensure("payments", {users: []});
client.payments.ensure("invitepayments", {users: []});
client.staffrank = new Enmap({name: "staffrank",dataDir: "./dbs/others"});
client.ticketdata = new Enmap({name: "ticketdata",dataDir: "./dbs/others"});


require("./modules/commands")(client)
require("./modules/tickets/OrderSystem")(client)
require("./modules/tickets/TicketSystem")(client)
require("./modules/others/payment_system")(client)
require('./index_other_tasks')


client.login(client.config.token);
