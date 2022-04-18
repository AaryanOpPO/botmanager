//IMPORTING NPM PACKAGES
const Discord = require('discord.js');
const fs = require('fs')
const ms = require("ms");
const moment = require("moment")
const Path = require("path");
const {
    MessageActionRow,
    MessageSelectMenu,
    MessageButton
} = require("discord.js");

const {
    Client
} = require('ssh2');
const sourcebin = require('sourcebin');

const { Roles } = require("../settings.json");

const {
    isValidTicket,
    GetBot,
    GetUser,
    duration,
    isvalidurl,
    delay,
    theDB,
    create_transcript_buffer,
    swap_pages2,
    logAction
} = require("./utilfunctions");
const translate = require("translatte");
const config = require("../config.json")
const {
    readdirSync
} = require("fs");


/**
 * STARTING THE MODULE WHILE EXPORTING THE CLIENT INTO IT
 * @param {*} client 
 */
module.exports = async(client) => {
        //Loading Commands
        try {
            let amount = 0;
            readdirSync("./modules/commands/").forEach((dir) => {
                const commands = readdirSync(`./modules/commands/${dir}/`).filter((file) => file.endsWith(".js"));
                for (let file of commands) {
                    let pull = require(`../modules/commands/${dir}/${file}`);
                    if (pull.name) {
                        client.commands.set(pull.name, pull);
                        amount++;
                    } else {
                        console.log(file, `error -> missing a help.name, or help.name is not a string.`.brightRed);
                        continue;
                    }
                    if (pull.aliases && Array.isArray(pull.aliases)) pull.aliases.forEach((alias) => client.aliases.set(alias, pull.name));
                }
            });
            console.log(`${amount} Commands Loaded`.brightGreen);
        } catch (e) {
            console.log(String(e.stack).bgRed)
        }


        //Executing commands
        client.on("messageCreate", async(message) => {
            if (!message.guild || !message.channel || message.author.bot) return;
            const prefix = config.prefix;
            const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(prefix)})`);
            if (!prefixRegex.test(message.content)) return;
            const [, mPrefix] = message.content.match(prefixRegex);
            const args = message.content.slice(mPrefix.length).trim().split(/ +/).filter(Boolean);
            const cmd = args.length > 0 ? args.shift().toLowerCase() : null;
            if (!cmd || cmd.length == 0) {
                if (mPrefix.includes(client.user.id)) {
                    return message.reply({
                        embeds: [new Discord.MessageEmbed().setColor(client.config.color)
                            .setTitle(`<a:check:939238439826640957> | **My Prefix is \`${prefix}\`**`)
                        ]
                    })
                }
                return;
            }
            let command = client.commands.get(cmd);
            if (!command) command = client.commands.get(client.aliases.get(cmd));
            if (command) {
                if (onCoolDown(message, command)) {
                    return message.reply({
                        embeds: [
                            new Discord.MessageEmbed()
                            .setColor("RED")
                            .setTitle(`❌ Please wait \`${onCoolDown(message, command)}\` more Second(s) before reusing the \`${command.name}\` command.`)
                        ]
                    });
                }
                try {
                    command.run(client, message, args, prefix);
                } catch (error) {
                    console.warn(error)
                }
            }
        })


        client.setups.ensure("todelete", { tickets: [] })
            /**
             * COMMANDS SYSTEM
             */


        client.on('messageCreate', async message => {
                    if (!message.guild || message.author.bot || message.guild.id != "934213686468423780") return;
                    const args = message.content.slice(client.config.prefix.length).trim().split(/ +/g);
                    if (!message.content.startsWith(client.config.prefix)) return
                    const cmd = args.shift().toLowerCase();

                    /**
                     * SETUP TICKET / ORDER / FEATURE SYSTEM
                     */
                    if (cmd == "setupticket") {
                        if (message.member.permissions.has("ADMINISTRATOR")) {
                            let allmembers = await message.guild.members.fetch().catch(() => {}) || false;
                            let onlinesupporters = [...allmembers.filter(m => !m.user.bot && m.roles.highest.rawPosition >= message.guild.roles.cache.get(Roles.SupporterRoleId).rawPosition && m.roles.highest.id != "934221436564930610" && m.presence).values()];
                            let embed = new Discord.MessageEmbed()
                                .setTitle("Create a Ticket / Application / Partnership")
                                .setDescription(`<:arrow:936667980237000834> **If you __need help__, want to __apply__ or if you are having __questions__, then please open a Ticket!**\n\n<:arrow:936667980237000834> ***To open a Ticket click on the Selection down below!***`)
                                .setColor(client.config.color)
                            let menuoptions = require("../settings.json").ticketsystem;
                            //define the selection
                            let Selection = new MessageSelectMenu()
                                .setCustomId('TicketSupportSelection')
                                .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
                                .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                                .setPlaceholder('Click me to Open a Ticket for Support / Applies / Others') //message in the content placeholder
                                .addOptions(menuoptions.map(option => {
                                    let Obj = {}
                                    Obj.label = option.label ? option.label.substring(0, 25) : option.value.substring(0, 25)
                                    Obj.value = option.value.substring(0, 25)
                                    Obj.description = option.description.substring(0, 50)
                                    if (option.emoji) Obj.emoji = option.emoji;
                                    return Obj;
                                }))

                            let PingButton = new MessageButton().setStyle('PRIMARY')
                                .setLabel('Ping Me BEFORE!')
                                .setEmoji('📶')
                                .setCustomId('PINGMEBEFORE');
                            let SuggestFeatures = new MessageButton().setStyle('LINK')
                                .setURL('https://discord.gg/cPJa9ZawKf')
                                .setLabel('Suggest Features')
                                .setEmoji('🎊');
                            let ReportBugs = new MessageButton().setStyle('LINK')
                                .setURL('https://discord.gg/fGmAZB52wR')
                                .setLabel('Report Bugs')
                                .setEmoji('💢');

                            let row1 = new MessageActionRow().addComponents([PingButton, SuggestFeatures, ReportBugs])
                            let row2 = new MessageActionRow().addComponents([Selection])

                            message.channel.send({
                                embeds: [embed],
                                components: [row1, row2]
                            });
                        } else {
                            message.reply("no Valid Permissions")
                        }
                    } else if (cmd == "setupfeatures") {
                        if (message.member.permissions.has("ADMINISTRATOR")) {
                            let embed = new Discord.MessageEmbed()
                                .setTitle("Bot Features")
                                .setDescription(`**__You want to know which Features the Bot(s) have?__**\n> *Click on the Menu down below, and select of what Bot you want to view the Features!*\n> *You'll also be able to see their Prices!*\n\n**__Where to Order a Bot?__**\n> Go to <#936392309065523221> and select the Bot you want to order!`)
                                .setColor(client.config.color)
                                .setImage('https://cdn.discordapp.com/attachments/937470079896002590/943517576942739476/standard_2.gif')
                                .setFooter("Kooje Development | Bot-Features", "https://cdn.discordapp.com/attachments/936985190016897055/938911526683811860/LOGOTRANSPARENT.png")
                            let menuoptions = require("../settings.json").createbot;
                            //define the selection
                            let Selection = new MessageSelectMenu()
                                .setCustomId('ViewTheFeatures')
                                .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
                                .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                                .setPlaceholder('Click me to view the Features') //message in the content placeholder
                                .addOptions(menuoptions.map(option => {
                                    let Obj = {}
                                    Obj.label = option.label ? option.label.substring(0, 25) : option.value.substring(0, 25)
                                    Obj.value = option.value.substring(0, 25)
                                    Obj.description = option.description.substring(0, 50)
                                    if (option.emoji) Obj.emoji = option.emoji;
                                    return Obj;
                                }))
                            let row = new MessageActionRow().addComponents([Selection])
                            message.channel.send({
                                embeds: [embed],
                                components: [row]
                            });
                        } else {



                            message.reply("no Valid Permissions")
                        }
                        //
                    } else if (cmd === "setuporder") {
                        //eval let channel = message.guild.channels.cache.get("936392309065523221");
                        if (message.member.permissions.has("ADMINISTRATOR")) {
                            let id = args[0],
                                themessage_ = false;
                            if (id) {
                                themessage_ = await message.channel.messages.fetch(id).catch(() => {}) || false;
                            }
                            let embed = new Discord.MessageEmbed()
                                .setTitle("Order a Discord Bot")
                                .setImage('https://cdn.discordapp.com/attachments/937470079896002590/943517576942739476/standard_2.gif')
                                .setDescription(`<:arrow:936667980237000834> **You wan't to Order a BOT** --> Open a \`ORDER-TICKET\` :muscle:
                
<:arrow:936667980237000834> **Please take a Look at our [PRICES](https://discord.com/channels/934213686468423780/936392309065523221/944276114988220477) as well as at our [Payment Options](https://discord.com/channels/934213686468423780/936392309065523221/944952969961553970)**

**__Possible Bot Templates to Order | HOSTING INCLUDED!__**
> **__System__ Bot** 🤖 | <#936392558312058880>
> 
> **__24/7__ Music Bot** / **__24/7__ Radio Bot** :notes: | <#936392558312058880>
> 
> **__Music__ Bot** 🎵 | <#936392558312058880>
> 
> **__Mod Mail__ Bot** 📨 | <#936392558312058880>
> 
> **__Waitingroom__ Bot**  / **Radio Bot** 📻 | <#936392558312058880>

<:arrow:936667980237000834> ***To open a Order-Ticket click on the Selection down below!***`)
                                .setColor(client.config.color)
                                .setFooter("Click the 'Ping me' Button, before ordering a Bot!", "https://cdn.discordapp.com/attachments/936985190016897055/938911526683811860/LOGOTRANSPARENT.png")
                            let menuoptions = require("../settings.json").ordersystem;
                            //define the selection
                            let Selection = new MessageSelectMenu()
                                .setCustomId('OrderSystemSelection')
                                .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
                                .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                                .setPlaceholder('Click me to Order a Bot') //message in the content placeholder
                                .addOptions(menuoptions.map(option => {
                                    let Obj = {}
                                    Obj.label = option.label ? option.label.substring(0, 25) : option.value.substring(0, 25)
                                    Obj.value = option.value.substring(0, 25)
                                    Obj.description = option.description.substring(0, 50)
                                    if (option.emoji) Obj.emoji = option.emoji;
                                    return Obj;
                                }))
                            let PingButton = new MessageButton().setStyle("PRIMARY").setEmoji("📶")
                                .setLabel("Ping Me BEFORE!")
                                .setCustomId("PINGMEBEFORE");
                            let CheckPrices = new MessageButton().setStyle('LINK')
                                .setURL('https://discord.com/channels/934213686468423780/936392309065523221/944276114988220477')
                                .setLabel('Check the Prices')
                                .setEmoji("<a:money:939201650395058237>");
                            let row1 = new MessageActionRow().addComponents([PingButton, CheckPrices])
                            let row2 = new MessageActionRow().addComponents([Selection])
                            if (id && themessage_) {
                                return themessage_.edit({
                                    embeds: [embed],
                                    components: [row1, row2]
                                });
                            }
                            message.channel.send({
                                embeds: [embed],
                                components: [row1, row2]
                            });
                        } else {
                            message.reply("no Valid Permissions")
                        }
                    }


                    /**
                     * STAFF RANKING SYSTEM
                     */
                    else if (cmd === "lb" || cmd == "leaderboard") {
                        if (message.member.roles.highest.rawPosition >= message.guild.roles.cache.get("935689526586790028").rawPosition) {
                            //got only the ranking points from THIS GUILD
                            let ids = client.staffrank.keyArray();
                            let filtered = [];
                            let days = Number(args[0]);
                            if (isNaN(days)) days = 30;
                            if (days <= 0) days = 30;
                            for (const id of ids) {
                                let data = client.staffrank.get(id)
                                if (!data) {
                                    continue;
                                }

                                function getArraySum(a) {
                                    var total = 0;
                                    for (var i in a) {
                                        total += a[i];
                                    }
                                    return total;
                                }
                                let Obj = {};
                                Obj.id = id;
                                Obj.createdbots = data.createdbots.filter(d => (days * 86400000) - (Date.now() - d) >= 0).length;
                                Obj.messages = data.messages.filter(d => (days * 86400000) - (Date.now() - d) >= 0).length;
                                Obj.tickets = data.tickets.filter(d => (days * 86400000) - (Date.now() - d) >= 0).length;
                                Obj.actualtickets = getArraySum(data.actualtickets.map(d => d.messages.filter(d => (days * 86400000) - (Date.now() - d) >= 0).length));
                                filtered.push(Obj)
                            }
                            let topsize = Math.floor(filtered.length / 2);
                            if (topsize > 10) topsize = 10;

                            let messages = filtered.sort((a, b) => b.messages - a.messages);
                            let embed1 = new Discord.MessageEmbed()
                                .setColor(client.config.color)
                                .setAuthor(message.guild.name, message.guild.iconURL({
                                    dynamic: true
                                }))
                                .setThumbnail("https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/285/speech-balloon_1f4ac.png")
                                .setTitle("💬 Messages Sent")
                                .addField(`**Top ${topsize}:**`, `\`\`\`${messages.slice(0, topsize).map(d => String(message.guild.members.cache.get(d.id) ? message.guild.members.cache.get(d.id).user.username : d.id) + " | " + d.messages).join("\n")}\`\`\``, true)
                                .addField(`**Last ${topsize}:**`, `\`\`\`${messages.slice(Math.max(messages.length - topsize, 0)).map(d => String(message.guild.members.cache.get(d.id) ? message.guild.members.cache.get(d.id).user.username : d.id) + " | " + d.messages).join("\n")}\`\`\``, true)

                            let tickets = filtered.sort((a, b) => b.tickets - a.tickets);
                            let embed2 = new Discord.MessageEmbed()
                                .setColor("GREEN")
                                .setTitle("🔒 Tickets Closed")
                                .setThumbnail("https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/282/locked_1f512.png")
                                .addField(`**Top ${topsize}:**`, `\`\`\`${tickets.slice(0, topsize).map(d => String(message.guild.members.cache.get(d.id) ? message.guild.members.cache.get(d.id).user.username : d.id) + " | " + d.tickets).join("\n")}\`\`\``, true)
                                .addField(`**Last ${topsize}:**`, `\`\`\`${tickets.slice(Math.max(tickets.length - topsize, 0)).map(d => String(message.guild.members.cache.get(d.id) ? message.guild.members.cache.get(d.id).user.username : d.id) + " | " + d.tickets).join("\n")}\`\`\``, true)

                            let createdBots = filtered.sort((a, b) => b.createdbots - a.createdbots);
                            let embed3 = new Discord.MessageEmbed()
                                .setColor("BLURPLE")
                                .setTitle("🤖 Created Bots")
                                .setThumbnail("https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/285/robot_1f916.png")
                                .addField(`**Top ${topsize}:**`, `\`\`\`${createdBots.slice(0, topsize).map(d => String(message.guild.members.cache.get(d.id) ? message.guild.members.cache.get(d.id).user.username : d.id) + " | " + d.createdbots).join("\n")}\`\`\``, true)
                                .addField(`**Last ${topsize}:**`, `\`\`\`${createdBots.slice(Math.max(createdBots.length - topsize, 0)).map(d => String(message.guild.members.cache.get(d.id) ? message.guild.members.cache.get(d.id).user.username : d.id) + " | " + d.createdbots).join("\n")}\`\`\``, true)

                            let actualtickets = filtered.sort((a, b) => b.actualtickets - a.actualtickets);
                            let embed4 = new Discord.MessageEmbed()
                                .setColor("RED")
                                .setFooter(message.guild.name + ` Staff Rank of the last ${duration(ms(days + "d")).join(", ")}`, message.guild.iconURL({
                                    dynamic: true
                                }))
                                .setTitle("👻 Messages in the Tickets")
                                .setThumbnail("https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/285/ghost_1f47b.png")
                                .addField(`**Top ${topsize}:**`, `\`\`\`${actualtickets.slice(0, topsize).map(d => String(message.guild.members.cache.get(d.id) ? message.guild.members.cache.get(d.id).user.username : d.id) + " | " + d.actualtickets).join("\n")}\`\`\``, true)
                                .addField(`**Last ${topsize}:**`, `\`\`\`${actualtickets.slice(Math.max(actualtickets.length - topsize, 0)).map(d => String(message.guild.members.cache.get(d.id) ? message.guild.members.cache.get(d.id).user.username : d.id) + " | " + d.actualtickets).join("\n")}\`\`\``, true)
                            message.reply({
                                        content: `Staff Rank Leaderboard of: **${message.guild.name}**\n>  Staff Rank of the last ${duration(ms(days + "d")).map(i => `\`${i}\``).join(", ")}\n> \`,leaderboard [DAYSAMOUNT]\` to change the amount of Days to show!`,
                    embeds: [embed1, embed2, embed3, embed4]
                })
            } else {
                message.reply("<a:crossred:939238440359321600> **You are not allowed to execute this Command!** You need to be a part of the STAFF TEAM!")
            }
        } else if (cmd === "rank") {
            if (message.member.roles.highest.rawPosition >= message.guild.roles.cache.get("935689526586790028").rawPosition) {
                let member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
                let user = member.user;
                client.staffrank.ensure(user.id, {
                    createdbots: [ /* Date.now() */ ], //show how many bots he creates per command per X Time
                    messages: [ /* Date.now() */ ], //Shows how many general messages he sent
                    tickets: [ /* Date.now() */ ], //shows how many messages he sent in a ticket
                    actualtickets: [ /* { id: "channelid", messages: []}*/ ] //Each managed ticket where they send a message
                });

                function getArraySum(a) {
                    var total = 0;
                    for (var i in a) {
                        total += a[i];
                    }
                    return total;
                }
                let data = client.staffrank.get(user.id)
                let embed1 = new Discord.MessageEmbed()
                    .setColor(client.config.color)
                    .setAuthor(user.username, user.displayAvatarURL({
                        dynamic: true
                    }))
                    .setThumbnail("https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/285/speech-balloon_1f4ac.png")
                    .setTitle("💬 Messages Sent")
                    .addField(`**All Time:**`, `\`\`\`${data.messages.length}\`\`\``, true)
                    .addField(`**Last 24 Hours:**`, `\`\`\`${data.messages.filter(d => (1 * 86400000) - (Date.now() - d) >= 0).length}\`\`\``, true)
                    .addField(`**Last 5 Days:**`, `\`\`\`${data.messages.filter(d => (5 * 86400000) - (Date.now() - d) >= 0).length}\`\`\``, true)

                    .addField(`**Last 7 Days:**`, `\`\`\`${data.messages.filter(d => (7 * 86400000) - (Date.now() - d) >= 0).length}\`\`\``, true)
                    .addField(`**Last 14 Days:**`, `\`\`\`${data.messages.filter(d => (14 * 86400000) - (Date.now() - d) >= 0).length}\`\`\``, true)
                    .addField(`**Last 30 Days:**`, `\`\`\`${data.messages.filter(d => (30 * 86400000) - (Date.now() - d) >= 0).length}\`\`\``, true)
                let embed2 = new Discord.MessageEmbed()
                    .setColor("BLURPLE")
                    .setTitle("🔒 Tickets Closed")
                    .setThumbnail("https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/282/locked_1f512.png")
                    .addField(`**All Time:**`, `\`\`\`${data.tickets.length}\`\`\``, true)
                    .addField(`**Last 24 Hours:**`, `\`\`\`${data.tickets.filter(d => (1 * 86400000) - (Date.now() - d) >= 0).length}\`\`\``, true)
                    .addField(`**Last 5 Days:**`, `\`\`\`${data.tickets.filter(d => (5 * 86400000) - (Date.now() - d) >= 0).length}\`\`\``, true)

                    .addField(`**Last 7 Days:**`, `\`\`\`${data.tickets.filter(d => (7 * 86400000) - (Date.now() - d) >= 0).length}\`\`\``, true)
                    .addField(`**Last 14 Days:**`, `\`\`\`${data.tickets.filter(d => (14 * 86400000) - (Date.now() - d) >= 0).length}\`\`\``, true)
                    .addField(`**Last 30 Days:**`, `\`\`\`${data.tickets.filter(d => (30 * 86400000) - (Date.now() - d) >= 0).length}\`\`\``, true)
                let embed3 = new Discord.MessageEmbed()
                    .setColor("BLURPLE")
                    .setTitle("🤖 Created Bots")
                    .setThumbnail("https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/285/robot_1f916.png")
                    .addField(`**All Time:**`, `\`\`\`${data.createdbots.length}\`\`\``, true)
                    .addField(`**Last 24 Hours:**`, `\`\`\`${data.createdbots.filter(d => (1 * 86400000) - (Date.now() - d) >= 0).length}\`\`\``, true)
                    .addField(`**Last 5 Days:**`, `\`\`\`${data.createdbots.filter(d => (5 * 86400000) - (Date.now() - d) >= 0).length}\`\`\``, true)

                    .addField(`**Last 7 Days:**`, `\`\`\`${data.createdbots.filter(d => (7 * 86400000) - (Date.now() - d) >= 0).length}\`\`\``, true)
                    .addField(`**Last 14 Days:**`, `\`\`\`${data.createdbots.filter(d => (14 * 86400000) - (Date.now() - d) >= 0).length}\`\`\``, true)
                    .addField(`**Last 30 Days:**`, `\`\`\`${data.createdbots.filter(d => (30 * 86400000) - (Date.now() - d) >= 0).length}\`\`\``, true)
                let embed4 = new Discord.MessageEmbed()
                    .setColor("BLURPLE")
                    .setFooter(user.username, user.displayAvatarURL({
                        dynamic: true
                    }))
                    .setTitle("👻 Messages in the Tickets")
                    .setThumbnail("https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/285/ghost_1f47b.png")
                    .addField(`**All Time:**`, `\`\`\`${getArraySum(data.actualtickets.map(d => d.messages.length))}\`\`\``, true)
                    .addField(`**Last 24 Hours:**`, `\`\`\`${getArraySum(data.actualtickets.map(d => d.messages.filter(d => (1 * 86400000) - (Date.now() - d) >= 0).length))}\`\`\``, true)
                    .addField(`**Last 5 Days:**`, `\`\`\`${getArraySum(data.actualtickets.map(d => d.messages.filter(d => (5 * 86400000) - (Date.now() - d) >= 0).length))}\`\`\``, true)

                    .addField(`**Last 7 Days:**`, `\`\`\`${getArraySum(data.actualtickets.map(d => d.messages.filter(d => (7 * 86400000) - (Date.now() - d) >= 0).length))}\`\`\``, true)
                    .addField(`**Last 14 Days:**`, `\`\`\`${getArraySum(data.actualtickets.map(d => d.messages.filter(d => (14 * 86400000) - (Date.now() - d) >= 0).length))}\`\`\``, true)
                    .addField(`**Last 30 Days:**`, `\`\`\`${getArraySum(data.actualtickets.map(d => d.messages.filter(d => (30 * 86400000) - (Date.now() - d) >= 0).length))}\`\`\``, true)
                message.reply({
                    content: `Staff Rank of: **${user.tag}**`,
                    embeds: [embed1, embed2, embed3, embed4]
                })
            } else {
                message.reply("<a:crossred:939238440359321600> **You are not allowed to execute this Command!** You need to be a part of the STAFF TEAM!")
            }
        } 
        

        else if (cmd === "say") {
            if (message.member.permissions.has("ADMINISTRATOR")) {
                message.channel.send(args.join(" "));
                message.delete()
            } else {
                message.reply("no Valid Permissions")
            }
        } else if (cmd === "cancelcreation"){
            if (!message.member.permissions.has("ADMINISTRATOR") && !message.member.roles.cache.has(Roles.BotCreatorRoleId) && !message.member.roles.cache.has(Roles.OwnerRoleId) && !message.member.roles.cache.has(Roles.ChiefBotCreatorRoleId)) return message.reply("**<a:crossred:939238440359321600> You are not allowed to execute this cmd**");
            if(!client.createingbotmap.has("Creating")) return message.reply(`> <a:crossred:939238440359321600> **Nobody is creating a Bot atm**`);
            if(Date.now() - client.createingbotmap.get("CreatingTime") < 2*60*1000) return message.reply(`> <a:crossred:939238440359321600> **You can only cancel a Bot-Creation, if it's taking longer then 30 Seconds!**`)
            client.createingbotmap.delete("Creating")
            client.createingbotmap.delete("CreatingTime")
            message.reply("**Success!**")
        } else if (cmd === "createbot") {
            if (!message.member.permissions.has("ADMINISTRATOR") && !message.member.roles.cache.has(Roles.BotCreatorRoleId) && !message.member.roles.cache.has(Roles.OwnerRoleId) && !message.member.roles.cache.has(Roles.ChiefBotCreatorRoleId)) return message.reply("**<a:crossred:939238440359321600> You are not allowed to execute this cmd**");
            if(client.createingbotmap.has("Creating")) return message.reply(`> **Im Creating for ${duration((Date.now() - client.createingbotmap.get("CreatingTime"))).map(i => `\`${i}\``).join(", ")} the Bot in:** <#${client.createingbotmap.get("Creating")}>\n> **Try again later!**`)
            //COMMAND HANDLER FRIENDLY, just a REALLY BASIC example
            let cmduser = message.author;
            let menuoptions = require("../settings.json").createbot
            //define the selection
            let Selection = new MessageSelectMenu()
                .setCustomId('MenuSelection')
                .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
                .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                .setPlaceholder('Click me, to select a Bot') //message in the content placeholder
                .addOptions(menuoptions.map(option => {
                    let Obj = {}
                    Obj.label = option.label ? option.label.substring(0, 25) : option.value.substring(0, 25)
                    Obj.value = option.value.substring(0, 25)
                    Obj.description = option.description.substring(0, 50)
                    if (option.emoji) Obj.emoji = option.emoji;
                    return Obj;
                }))
            //define the embed
            let MenuEmbed = new Discord.MessageEmbed()
                .setColor(client.config.color)
                .setAuthor("Bot Creation - " + message.author.tag, message.author.displayAvatarURL({
                    dynamic: true
                }))
                .setDescription("***Select what type of Bot you want to create in the Selection down below!***")
            //send the menu message
            let menumessage = await message.channel.send({
                embeds: [MenuEmbed],
                components: [new MessageActionRow().addComponents([Selection])]
            })
            //function to handle the menuselection
            async function menuselection(interaction) {
                let menuoptiondata = menuoptions.find(v => v.value == interaction.values[0])
                console.log(menuoptions)
                console.log(menuoptiondata)
                let BotDir = menuoptiondata.bottype;
                let errrored = false;
                try {
                    interaction.deferUpdate()
                        .then(console.log)
                        .catch(console.error);
                } catch {}
                let BotType = "Default";
                if (BotDir === "SYSTEMBOTS") {
                    BotType = "System Bot";
                    if (!message.channel.parent || message.channel.parentId != "938418981197451294") {
                        errrored = true;
                        interaction.message.edit({
                            components: [],
                            embeds: [new Discord.MessageEmbed().setAuthor("Bot Creation - " + message.author.tag, message.author.displayAvatarURL({
                                dynamic: true
                            })).setColor("RED").setTitle("**<a:crossred:939238440359321600> You are not allowed to create this Bot in here**")]
                        })
                    }
                }

                if (BotDir === "MusicBots") {
                    BotType = "Music Bot";
                    if (!message.channel.parent || message.channel.parentId != "938439892638257172") {
                        errrored = true;
                        interaction.message.edit({
                            components: [],
                            embeds: [new Discord.MessageEmbed().setAuthor("Bot Creation - " + message.author.tag, message.author.displayAvatarURL({
                                dynamic: true
                            })).setColor("RED").setTitle("**<a:crossred:939238440359321600> You are not allowed to create this Bot in here**")]
                        })
                    }
                }


                if (errrored) return;
                client.createingbotmap.set("CreatingTime", Date.now());
                client.createingbotmap.set("Creating", message.channel.id);
                interaction.message.edit({
                    components: [],
                    embeds: [new Discord.MessageEmbed().setAuthor("Bot Creation - " + message.author.tag, message.author.displayAvatarURL({
                        dynamic: true
                    })).setColor(client.config.color).setTitle(`Now Starting the Bot Creation Process for a **\`${menuoptiondata.value}\`** in your **DIRECT MESSAGES**\n> *If not then retry and enable your DMS!*`)]
                });
                try {
                    message.delete();
                } catch (e) {
                    console.log(e.stack ? String(e.stack).grey : String(e).grey)
                }
                ///////////////////////////////////////
                ///////////////////////////////////////
                ///////////////////////////////////////
                ///////////////////////////////////////
                ///////////////////////////////////////
                ///////////////////////////////////////

                var filenum, Files = [];
                async function ThroughDirectory(Directory) {
                    fs.readdirSync(Directory).forEach(File => {
                        const Absolute = Path.join(Directory, File);
                        if (fs.statSync(Absolute).isDirectory()) return ThroughDirectory(Absolute);
                        else return Files.push(Absolute);
                    });
                }
                ThroughDirectory(`/home/servicebots/${BotDir}/template/`);
                filenum = Files.length;
                try {
                    const ch = message.author;
                    async function validate(result) {
                        return new Promise(async (res, rej) => {
                            let button_close = new MessageButton().setStyle('DANGER').setCustomId('validate_no').setLabel('No, I wanna edit the Message!').setEmoji("<a:crossred:939238440359321600>")
                            let button_delete = new MessageButton().setStyle('SUCCESS').setCustomId('validate_yes').setLabel("Yes, continue please!").setEmoji("<a:check:939238439826640957>")
                            let qu_1 = await ch.send({
                                components: [new MessageActionRow().addComponents([button_close, button_delete])],
                                embeds: [new Discord.MessageEmbed().setColor("BLURPLE").setTitle("Are you sure you want to use that as the Answer for the Parameter-Question?")
                                    .setDescription(`**Your Answer:**\n>>> \`\`\`${result.substr(0, 2000)}\`\`\``)
                                    .setFooter("Please react within 60 Seconds", ch.displayAvatarURL({
                                        dynamic: true
                                    }))
                                ]
                            }).catch((e) => {
                                console.log(e.stack ? String(e.stack).grey : String(e).grey)
                            })


                            //create a collector for the thinggy
                            const collector = qu_1.createMessageComponentCollector({
                                filter: button => button.isButton(),
                                time: 60e3
                            }); //collector for 5 seconds
                            //array of all embeds, here simplified just 10 embeds with numbers 0 - 9
                            collector.on('collect', async b => {
                                if (b.customId == "validate_yes") {
                                    try {
                                        qu_1.edit({
                                            content: `Validated!`,
                                            components: [new MessageActionRow().addComponents([button_close.setDisabled(true), button_delete.setDisabled(true)])],
                                            embeds: [qu_1.embeds[0]]
                                        }).catch((e) => {
                                            console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                        })
                                    } catch (e) {
                                        console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                    }
                                    await b.deferUpdate();
                                    return res(true)
                                } else if (b.customId == "validate_no") {
                                    try {
                                        qu_1.edit({
                                            content: `CANCELLED!`,
                                            components: [new MessageActionRow().addComponents([button_close.setDisabled(true), button_delete.setDisabled(true)])],
                                            embeds: [qu_1.embeds[0]]
                                        }).catch((e) => {
                                            console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                        })
                                    } catch (e) {
                                        console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                    }
                                    await b.deferUpdate();
                                    return res(false)
                                }

                            });
                            let edited = false;
                            collector.on('end', collected => {
                                edited = true;
                                try {
                                    qu_1.edit({
                                        content: `Time has ended!`,
                                        components: [new MessageActionRow().addComponents([button_close.setDisabled(true), button_delete.setDisabled(true)])],
                                        embeds: [qu_1.embeds[0]]
                                    }).catch((e) => {
                                        console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                    })
                                } catch (e) {
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                }
                                return rej(false);
                            });
                            setTimeout(() => {
                                if (!edited) {
                                    try {
                                        qu_1.edit({
                                            content: `Time has ended!`,
                                            components: [new MessageActionRow().addComponents([button_close.setDisabled(true), button_delete.setDisabled(true)])],
                                            embeds: [qu_1.embeds[0]]
                                        }).catch((e) => {
                                            console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                        })
                                    } catch (e) {
                                        console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                    }
                                    return rej(false);
                                }
                            }, 60e3 + 150)
                        })

                    }
                    async function ask_question(Question) {
                        return new Promise(async (res, rej) => {
                            let index = Questions.findIndex(v => v.toLowerCase() == Question.toLowerCase())
                            let sendData = {
                                content: `<@${ch.id}>`,
                                embeds: [new Discord.MessageEmbed().setColor("#6861fe").setTitle(`**Here is my ${index + 1}. Parameter-Question!**`)
                                    .setDescription(`**\`\`\`bash\n${Question}\`\`\`**\n\n> *You have 3 Minutes to answer this Parameter-Question, if you don't then your Bot Creation will get cancelled!*`)
                                    .setFooter(`Please answer it carefully! | Question: ${index + 1} / ${Questions.length}`, ch.displayAvatarURL({
                                        dynamic: true
                                    }))
                                ]
                            };
                            if(Question.includes("STATUSTYPE")){
                                sendData.components = [new MessageActionRow().addComponents([
                                    new MessageSelectMenu()
                                    .setPlaceholder('Select Status Type').setCustomId('MenuSelection') 
                                    .setMaxValues(1).setMinValues(1)
                                    .addOptions([
                                        {
                                            label: "PLAYING",
                                            value: `PLAYING`,
                                            emoji: '🏃',
                                            description: `Playing ${answers[answers.length - 1]}`.substr(0, 50),
                                        },
                                        {
                                            label: "WATCHING",
                                            value: `WATCHING`,
                                            emoji: '📺',
                                            description: `Watching ${answers[answers.length - 1]}`.substr(0, 50),
                                        },
                                        {
                                            label: "LISTENING",
                                            value: `LISTENING`,
                                            emoji: '🎧',
                                            description: `Listening to ${answers[answers.length - 1]}`.substr(0, 50),
                                        },
                                        {
                                            label: "STREAMING",
                                            value: `STREAMING`,
                                            emoji: '💻',
                                            description: `Streaming ${answers[answers.length - 1]}`.substr(0, 50),
                                        },
                                        {
                                            label: "COMPETING",
                                            value: `COMPETING`,
                                            emoji: '⚔️',
                                            description: `Competing in ${answers[answers.length - 1]}`.substr(0, 50),
                                        },
                                    ])
                                ])];
                            }
                            let qu__ = await ch.send(sendData).catch((e) => {
                                console.log(e.stack ? String(e.stack).grey : String(e).grey)
                            })
                            if (!qu__) return rej("NO MESSAGE");
                            if(sendData.components && sendData.components.length > 0){
                                let collected1 = await qu__.channel.awaitMessageComponent({
                                    filter: m => m.user.id == ch.id,
                                    max: 1,
                                    time: 180e3,
                                    errors: ["time"]
                                })
                                if (!collected1) {
                                    try {
                                        ch.send("**<a:crossred:939238440359321600> I've stopped the Bot Creation, because u didn't answer within 3 Minutes!**")
                                    } catch (e) {
                                        console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                    }
                                    return rej(false);
                                }
                                try{
                                    collected1.deferUpdate();
                                }catch (e){
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                }
                                return res(collected1.values[0]);
                            } else {
                                let collected1 = await qu__.channel.awaitMessages({
                                    filter: m => m.author.id == ch.id,
                                    max: 1,
                                    time: 180e3,
                                    errors: ["time"]
                                })
                                if (!collected1) {
                                    try {
                                        ch.send("**<a:crossred:939238440359321600> I've stopped the Bot Creation, because u didn't answer within 3 Minutes!**")
                                    } catch (e) {
                                        console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                    }
                                    return rej(false);
                                }
                                if (message.attachments.size > 1) {
                                    if (message.attachments.first().url.toLowerCase().endsWith("png")) {
                                        return res(message.attachments.first().url)
                                    }
                                    if (message.attachments.first().url.toLowerCase().endsWith("jpg")) {
                                        return res(message.attachments.first().url)
                                    }
                                    if (message.attachments.first().url.toLowerCase().endsWith("gif")) {
                                        return res(message.attachments.first().url)
                                    }
                                }
                                return res(collected1.first().content);
                            }
                        })
                    }
                    let answers = [];
                    let Questions = [
                        `What should be the PREFIX? | Its For the ${menuoptiondata.value}!\nExample: "!"`,
                        `What should be the STATUS? | Its For the ${menuoptiondata.value}!\nExample: "discord.gg/kooje"`,
                        `What should be the STATUSTYPE? | Its For the before Status, example: "PLAYING" or "LISTENING ... TO"`,
                        `What should be the TOKEN? | Its For the ${menuoptiondata.value}!\nExample: "NzQ4MDg3OTA3NTE2MTUzODg5.X0YVJw.Shmvprj9eW_yfApntj7QUM0sZ_Y"`,
                        `Who is the OWNER? | Its For the ${menuoptiondata.value}!\nExample: "717416034478456925"`,
                        `What should be the AVATAR? | Its For the ${menuoptiondata.value}!\nExample: "https://cdn.discordapp.com/attachments/936985190016897055/938497637060079706/LogoKooJE.png"`,
                        `What should be the FOOTER TEXT? | Its For the ${menuoptiondata.value}!\nExample: "BOTNAME"`,
                        `What should be the HEX-COLOR? | Its For the ${menuoptiondata.value}!\nExample: "#6861fe"`,
                        `What should be the FILE-NAME? | Its For the ${menuoptiondata.value}!\nExample: "BOT_NAME" (replace "Spaces" with "_")`,
                        `What is the BOT ID? | Its For the ${menuoptiondata.value}!\nExample: "938176229918531604"`,
                    ];

                    for (const Question of Questions) {
                        await ask_question(Question).then(async result => {
                            await validate(result).then(async res => {
                                if (res) {
                                    answers.push(result);
                                } else {
                                    await ask_question(Question).then(async result => {
                                        answers.push(result);
                                    }).catch((e) => {
                                        client.createingbotmap.delete("Creating")
                                        client.createingbotmap.delete("CreatingTime")
                                        console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                        return;
                                    })
                                }
                            }).catch((e) => {
                                client.createingbotmap.delete("Creating")
                                client.createingbotmap.delete("CreatingTime")
                                console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                return;
                            })
                        }).catch((e) => {
                            client.createingbotmap.delete("Creating")
                            client.createingbotmap.delete("CreatingTime")
                            console.log(e.stack ? String(e.stack).grey : String(e).grey)
                            return;
                        })
                    }

                    let cancel = false;
                    await areyousure().then(async res => {
                        if (!res) {
                            client.createingbotmap.delete("Creating")
                            client.createingbotmap.delete("CreatingTime")
                            cancel = true;
                            return ch.send("CANCELLED!");
                        }
                    }).catch(e => {
                        client.createingbotmap.delete("Creating")
                        client.createingbotmap.delete("CreatingTime")
                        cancel = true;
                        return ch.send(`${e.message ? e.message : e}`.substr(0, 1900), {
                            code: "js"
                        });
                    })
                    async function areyousure(result) {
                        return new Promise(async (res, rej) => {
                            let button_close = new MessageButton().setStyle('DANGER').setCustomId('validate_no').setLabel('No, Cancel!').setEmoji("<a:crossred:939238440359321600>")
                            let button_delete = new MessageButton().setStyle('SUCCESS').setCustomId('validate_yes').setLabel("Yes, create it!").setEmoji("<a:check:939238439826640957>")
                            let qu_1 = await ch.send({
                                components: [new MessageActionRow().addComponents([button_close, button_delete])],
                                embeds: [new Discord.MessageEmbed().setColor("BLURPLE").setTitle("Are you sure you want to use those Settings for the Bot?")
                                    .addField("**Prefix:**", `\`\`\`${answers[0]}\`\`\``)
                                    .addField("**Status:**", `\`\`\`${answers[1]}\`\`\``)
                                    .addField("**Status Type:**", `\`\`\`${answers[2]}\`\`\``)
                                    .addField("**Token:**", `\`\`\`${answers[3]}\`\`\``)
                                    .addField("**Owner ID:**", `\`\`\`${answers[4]}\`\`\``)
                                    .addField("**Avatar:**", `\`\`\`${answers[5]}\`\`\``)
                                    .addField("**Footertext:**", `\`\`\`${answers[6]}\`\`\``)
                                    .addField("**Color:**", `\`\`\`${answers[7]}\`\`\``)
                                    .addField("**Filename:**", `\`\`\`${answers[8]}\`\`\``)
                                    .addField("**Bot-ID:**", `\`\`\`${answers[9]}\`\`\``)
                                    .setFooter("Please react within 60 Seconds", ch.displayAvatarURL({
                                        dynamic: true
                                    }))
                                ]
                            }).catch((e) => {
                                console.log(e.stack ? String(e.stack).grey : String(e).grey)
                            })


                            //create a collector for the thinggy
                            const collector = qu_1.createMessageComponentCollector({
                                filter: button => button.isButton(),
                                time: 60e3
                            }); //collector for 5 seconds
                            //array of all embeds, here simplified just 10 embeds with numbers 0 - 9
                            collector.on('collect', async b => {
                                if (b.customId == "validate_yes") {
                                    try {
                                        qu_1.edit({
                                            content: `Validated!`,
                                            components: [new MessageActionRow().addComponents([button_close.setDisabled(true), button_delete.setDisabled(true)])],
                                            embeds: [qu_1.embeds[0]]
                                        }).catch((e) => {
                                            console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                        })
                                    } catch (e) {
                                        console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                    }
                                    await b.deferUpdate();
                                    return res(true)
                                } else if (b.customId == "validate_no") {
                                    try {
                                        qu_1.edit({
                                            content: `CANCELLED!`,
                                            components: [new MessageActionRow().addComponents([button_close.setDisabled(true), button_delete.setDisabled(true)])],
                                            embeds: [qu_1.embeds[0]]
                                        }).catch((e) => {
                                            console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                        })
                                    } catch (e) {
                                        console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                    }
                                    await b.deferUpdate();
                                    return res(false)
                                }

                            });
                            let edited = false;
                            collector.on('end', collected => {
                                edited = true;
                                try {
                                    qu_1.edit({
                                        content: `Time has ended!`,
                                        components: [new MessageActionRow().addComponents([button_close.setDisabled(true), button_delete.setDisabled(true)])],
                                        embeds: [qu_1.embeds[0]]
                                    }).catch((e) => {
                                        console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                    })
                                } catch (e) {
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                }
                                return res(false);
                            });
                            setTimeout(() => {
                                if (!edited) {
                                    try {
                                        qu_1.edit({
                                            content: `Time has ended!`,
                                            components: [new MessageActionRow().addComponents([button_close.setDisabled(true), button_delete.setDisabled(true)])],
                                            embeds: [qu_1.embeds[0]]
                                        }).catch((e) => {
                                            console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                        })
                                    } catch (e) {
                                        console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                    }
                                    return res(false);
                                }
                            }, 60e3 + 150)
                        })

                    }
                    if (cancel) return;
                    let prefix = answers[0];
                    let status = answers[1];
                    let statustype = answers[2];
                    let token = answers[3];
                    let owner = answers[4];
                    let avatar = answers[5];
                    let footertext = answers[6];
                    let color = answers[7];
                    let filenama = answers[8];
                    let botid = answers[9];
                    let statusurl = false;
                    filenama = filenama.split(" ").join("_");
                    filenama = filenama.replace(/[&\/\\#!,+()$~%.'\s":*?<>{}]/g, '_');
                    avatar = avatar.split(" ").join("");
                    token = token.split(" ").join("");
                    color = color.split(" ").join("");
                    botid = botid.split(" ").join("");
                    prefix = prefix.split(" ").join("");
                    owner = owner.split(" ").join("");
                    //update the db for the staff person
                    client.staffrank.push(message.author.id, Date.now(), "createdbots")
                    //send informational data
                    client.channels.fetch("938914282333147257").then(channel => {
                        try {
                            client.users.fetch(owner).then(user => {
                                channel.send({
                                    embeds: [new Discord.MessageEmbed().setColor("GREEN").setFooter(message.author.tag + " | ID: " + message.author.id, message.author.displayAvatarURL({
                                        dynamic: true
                                    })).setDescription(`🤖 <@${message.author.id}> Executed: \`${cmd}\`, for: ${user}, \`SYSTEM_BOT${filenama}\`, BOT: <@${botid}>`)]
                                })
                            }).catch(e => {
                                channel.send({
                                    embeds: [new Discord.MessageEmbed().setColor("GREEN").setFooter(message.author.tag + " | ID: " + message.author.id, message.author.displayAvatarURL({
                                        dynamic: true
                                    })).setDescription(`🤖 <@${message.author.id}> Executed: \`${cmd}\`, for: ${owner}, \`SYSTEM_BOT${filenama}\`, BOT: <@${botid}>`)]
                                })
                            })
                        } catch {
                            channel.send({
                                embeds: [new Discord.MessageEmbed().setColor("GREEN").setFooter(message.author.tag + " | ID: " + message.author.id, message.author.displayAvatarURL({
                                    dynamic: true
                                })).setDescription(`🤖 <@${message.author.id}> Executed: \`${cmd}\`, for: ${owner}, \`SYSTEM_BOT${filenama}\`, BOT: <@${botid}>`)]
                            })
                        }
                    }).catch(console.log)
                    if (owner.length < 17 || owner.length > 19) return ch.send("Invalid Owner ID, that would be a valid example: `717416034478456925`")
                    if (botid.length < 17 || botid.length > 19) return ch.send("Invalid Bot ID, that would be a valid example: `938176229918531604`")
                    client.bots.ensure(owner, {
                        "bots": []
                    });
                    //if (client.bots.get(owner, "bots").includes(botid)) return ch.send("<a:crossred:939238440359321600> He already has that bot!")
                    if (token.length != "NzQ4MDg3OTA3NTE2MTUzODg5.X0YVJw.Shmvprj9eW_yfApntj7QUM0sZ_Y".length) return ch.send("INVALID TOKEN")
                    if (color.length != 7 || !color.includes("#")) return ch.send("NOT A VALID HEX COLOR, That would be a valid COLOR `#ffee33`")
                    let validurl = isvalidurl(avatar)
                    if (!validurl) return ch.send("Not a Valid Image, That would be a valid image: `https://cdn.discordapp.com/attachments/816967454776623123/823236646740295690/20210315_101235.png`")



                    var tempmsfg = await ch.send({
                        embeds: [new Discord.MessageEmbed()
                            .setColor(client.config.color)
                            .setAuthor("Progress ...", "https://images-ext-1.discordapp.net/external/ANU162U1fDdmQhim_BcbQ3lf4dLaIQl7p0HcqzD5wJA/https/cdn.discordapp.com/emojis/756773010123522058.gif", "https://kooje.eu")
                            .addField("<a:loading:938899148927827979> Changing Configuration Settings", "\u200b")
                            .addField("🔲 Changing Embed Settings", "\u200b")
                            .addField(`🔲 Copying ${filenum} Files`, "\u200b")
                            .addField("🔲 Starting Bot...", "\u200b")
                            .addField("🔲 Adding Finished Role", "\u200b")
                            .addField("🔲 Writing Database", "\u200b")
                        ]
                    })

                    let config = require(`/home/servicebots/${BotDir}/template/botconfig/config.json`);
                    let embed = require(`/home/servicebots/${BotDir}/template/botconfig/embed.json`);
                    config.status.text = status;
                    config.status.type = statustype ? statustype : "PLAYING";
                    config.status.url = statusurl ? statusurl : "https://twitch.tv/#";
                    config.ownerIDS = ["717416034478456925"];
                    config.ownerIDS.push(owner);
                    config.prefix = prefix;
                    config.token = token;
                    var globerror = false;

                    await fs.writeFile(`/home/servicebots/${BotDir}/template/botconfig/config.json`, JSON.stringify(config, null, 3), async (e) => {
                        if (e) {
                            console.log(e.stack ? String(e.stack).grey : String(e).grey);
                            globerror = true;
                            tempmsfg.embeds[0].fields[0].name = "<a:crossred:939238440359321600> Changing Configuration Settings"
                            tempmsfg.embeds[0].fields[1].name = "<a:crossred:939238440359321600> Changing Embed Settings"
                            tempmsfg.embeds[0].fields[2].name = `<a:crossred:939238440359321600> Copying ${filenum} Files`
                            tempmsfg.embeds[0].fields[3].name = "<a:crossred:939238440359321600> Starting Bot..."
                            tempmsfg.embeds[0].fields[4].name = "<a:crossred:939238440359321600> Adding Finished Role"
                            tempmsfg.embeds[0].fields[5].name = "<a:crossred:939238440359321600> Writing Database"
                            return await tempmsfg.edit({
                                embeds: [tempmsfg.embeds[0]]
                            }).catch((e) => {
                                console.log(e.stack ? String(e.stack).grey : String(e).grey)
                            })
                        }
                        tempmsfg.embeds[0].fields[0].name = "<a:check:939238439826640957> Changing Configuration Settings"
                        tempmsfg.embeds[0].fields[1].name = "<a:loading:938899148927827979> Changing Embed Settings"
                        await tempmsfg.edit({
                            embeds: [tempmsfg.embeds[0]]
                        }).catch((e) => {
                            console.log(e.stack ? String(e.stack).grey : String(e).grey)
                        })
                    });
                    embed.color = color;
                    embed.footertext = footertext;
                    embed.footericon = avatar;
                    await fs.writeFile(`/home/servicebots/${BotDir}/template/botconfig/embed.json`, JSON.stringify(embed, null, 3), async (e) => {
                        if (e) {
                            client.createingbotmap.delete("CreatingTime");
                            client.createingbotmap.delete("Creating");
                            console.log(e.stack ? String(e.stack).grey : String(e).grey);
                            globerror = true;
                            tempmsfg.embeds[0].fields[1].name = "<a:crossred:939238440359321600> Changing Embed Settings"
                            tempmsfg.embeds[0].fields[2].name = `<a:crossred:939238440359321600> Copying ${filenum} Files`
                            tempmsfg.embeds[0].fields[3].name = "<a:crossred:939238440359321600> Starting Bot..."
                            tempmsfg.embeds[0].fields[4].name = "<a:crossred:939238440359321600> Adding Finished Role"
                            tempmsfg.embeds[0].fields[5].name = "<a:crossred:939238440359321600> Writing Database"
                            return await tempmsfg.edit({
                                embeds: [tempmsfg.embeds[0]]
                            }).catch((e) => {
                                console.log(e.stack ? String(e.stack).grey : String(e).grey)
                            })
                        }
                        tempmsfg.embeds[0].fields[1].name = "<a:check:939238439826640957> Changing Embed Settings"
                        tempmsfg.embeds[0].fields[2].name = `<a:loading:938899148927827979> Copying ${filenum} Files`
                        await tempmsfg.edit({
                            embeds: [tempmsfg.embeds[0]]
                        }).catch((e) => {
                            console.log(e.stack ? String(e.stack).grey : String(e).grey)
                        })
                    });
                    if (globerror) return;
                    setTimeout(async () => {

                        const fse = require('fs-extra');

                        tempmsfg.embeds[0].fields[1].name = "<a:check:939238439826640957> Changing Embed Settings"


                        const srcDir = `/home/servicebots/${BotDir}/template`;
                        const destDir = `/home/servicebots/${BotDir}/${filenama}`;
                        // Async with promises:
                        fse.copy(srcDir, destDir, {
                                overwrite: true
                            })
                            .then(async () => {
                                tempmsfg.embeds[0].fields[2].name = `<a:check:939238439826640957> Copying ${filenum} Files`
                                tempmsfg.embeds[0].fields[3].name = "<a:loading:938899148927827979> Starting Bot..."
                                await tempmsfg.edit({
                                    embeds: [tempmsfg.embeds[0]]
                                }).catch((e) => {
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                })
                                require("child_process").exec(`pm2 start ecosystem.config.js`, {
                                    cwd: destDir
                                })
                                tempmsfg.embeds[0].fields[3].name = `<a:check:939238439826640957> Starting Bot...`
                                tempmsfg.embeds[0].fields[4].name = "<a:loading:938899148927827979> Adding Finished Role"
                                await tempmsfg.edit({
                                    embeds: [tempmsfg.embeds[0]]
                                }).catch((e) => {
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                })

                                try {
                                    message.guild.members.fetch(owner).then(member => {
                                        member.roles.add("937130001495646328").catch(() => {})
                                        if(member.roles.cache.has("947130196253868062")) {
                                            member.roles.remove("947130196253868062").catch(() => {})
                                            tempmsfg.embeds[0].fields[4].name = `<a:check:939238439826640957> Adding Finished Role & Removed recover Role`
                                            tempmsfg.embeds[0].fields[5].name = "<a:loading:938899148927827979> Writing Database"
                                        } else {
                                            tempmsfg.embeds[0].fields[4].name = `<a:check:939238439826640957> Adding Finished Role`
                                            tempmsfg.embeds[0].fields[5].name = "<a:loading:938899148927827979> Writing Database"
                                        }
                                    })
                                    await tempmsfg.edit({
                                        embeds: [tempmsfg.embeds[0]]
                                    }).catch((e) => {
                                        console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                    })
                                } catch {
                                    tempmsfg.embeds[0].fields[4].name = `<a:crossred:939238440359321600> Adding Finished Role`
                                    tempmsfg.embeds[0].fields[5].name = "<a:loading:938899148927827979> Writing Database"
                                    await tempmsfg.edit({
                                        embeds: [tempmsfg.embeds[0]]
                                    }).catch((e) => {
                                        console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                    })
                                }

                                tempmsfg.embeds[0].fields[5].name = `<a:check:939238439826640957> Writing Database`
                                var botuser = await client.users.fetch(botid);
                                tempmsfg.embeds[0].author.name = `<a:check:939238439826640957> SUCCESS | ${BotType.toUpperCase()} CREATION`
                                tempmsfg.embeds[0].author.iconURL = botuser.displayAvatarURL();
                                await tempmsfg.edit({
                                    embeds: [tempmsfg.embeds[0]]
                                }).catch((e) => {
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                })
                                try {
                                    client.users.fetch(owner).then(user => {
                                        user.send({
                                            content: `***IF YOU ARE HAVING PROBLEMS, or need a restart, or something else! THEN SEND US THIS INFORMATION!!!***\n> This includes: \`BotChanges\`, \`Restarts\`, \`Deletions\`, \`Adjustments & Upgrades\`\n> *This message is also a proof, that you are the original Owner of this BOT*`,
                                            embeds: [new Discord.MessageEmbed().setColor(client.config.color).setDescription(`> **Path:**\n\`\`\`yml\n${destDir}\n\`\`\`\n> **Server:**\n\`\`\`yml\n${String(Object.values(require('os').networkInterfaces()).reduce((r, list) => r.concat(list.reduce((rr, i) => rr.concat(i.family === 'IPv4' && !i.internal && i.address || []), [])), [])).split(".")[3].split(",")[0]}\n\`\`\`\n> **Command:**\n\`\`\`yml\npm2 list | grep "${filenama}" --ignore-case\n\`\`\`\n> **Application Information:**\n\`\`\`yml\nLink: https://discord.com/developers/applications/${botid}\nName: ${botuser ? `${botuser.tag}\nIcon: ${botuser.displayAvatarURL()}` : `>>${filenama}<<`}\nOriginalOwner: ${client.users.cache.get(owner) ? client.users.cache.get(owner).tag + `(${client.users.cache.get(owner).id})` : owner}\`\`\``).setThumbnail(botuser.displayAvatarURL())]
                                        }).catch(e => {
                                            console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                            message.channel.send({
                                                content: `<@${user.id}> PLEASE SAVE THIS MESSAGE, YOUR DMS ARE DISABLED! (via aScreenshot for example)\n***IF YOU ARE HAVING PROBLEMS, or need a restart, or something else! THEN SEND US THIS INFORMATION!!!***\n> This includes: \`BotChanges\`, \`Restarts\`, \`Deletions\`, \`Adjustments & Upgrades\`\n> *This message is also a proof, that you are the original Owner of this BOT*`,
                                                embeds: [new Discord.MessageEmbed().setColor(client.config.color).setDescription(`> **Path:**\n\`\`\`yml\n${destDir}\n\`\`\`\n> **Server:**\n\`\`\`yml\n${String(Object.values(require('os').networkInterfaces()).reduce((r, list) => r.concat(list.reduce((rr, i) => rr.concat(i.family === 'IPv4' && !i.internal && i.address || []), [])), [])).split(".")[3].split(",")[0]}\n\`\`\`\n> **Command:**\n\`\`\`yml\npm2 list | grep "${filenama}" --ignore-case\n\`\`\`\n> **Application Information:**\n\`\`\`yml\nLink: https://discord.com/developers/applications/${botid}\nName: ${botuser ? `${botuser.tag}\nIcon: ${botuser.displayAvatarURL()}` : `>>${filenama}<<`}\nOriginalOwner: ${client.users.cache.get(owner) ? client.users.cache.get(owner).tag + `(${client.users.cache.get(owner).id})` : owner}\`\`\``).setThumbnail(botuser.displayAvatarURL())]
                                            }).catch(e => {
                                                console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                            }).then(message => {
                                                message.pin().catch(e => {
                                                    console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                                })
                                            })
                                        }).then(message => {
                                            message.pin().catch(e => {
                                                console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                            })
                                        })
                                        user.send({
                                            content: `<@${owner}> | **Created by: <@${message.author.id}> (\`${message.author.tag}\` | \`${message.author.id}\`)**`,
                                            embeds: [new Discord.MessageEmbed().setColor(client.config.color).addField("📯 Invite link: ", `> [Click here](https://discord.com/oauth2/authorize?client_id=${botuser.id}&scope=bot&permissions=8)`)
                                                .addField("💛 Support us", `> **Please give us <#937678247011954738> and stop at <#941439058629001246> so that we can continue hosting Bots!**`).setTitle(`\`${botuser.tag}\` is online and ready 2 be used!`).setDescription(`<@${botuser.id}> is a **${BotType}** and got added to: <@${owner}> Wallet!\nTo get started Type: \`${prefix}help\``).setThumbnail(botuser.displayAvatarURL())
                                            ]
                                        }).catch(e => {
                                            console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                        });
                                    }).catch(e => {
                                        console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                    });
                                } catch (e) {
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                }
                                message.channel.send({
                                    content: `<@${owner}> | **Created by: <@${message.author.id}> (\`${message.author.tag}\` | \`${message.author.id}\`)**`,
                                    embeds: [new Discord.MessageEmbed().setColor(client.config.color).addField("📯 Invite link: ", `> [Click here](https://discord.com/oauth2/authorize?client_id=${botuser.id}&scope=bot&permissions=8)`)
                                        .addField("💛 Support us", `> **Please give us <#937678247011954738> and stop at <#941439058629001246> so that we can continue hosting Bots!**`).setTitle(`\`${botuser.tag}\` is online and ready 2 be used!`).setDescription(`<@${botuser.id}> is a **${BotType}** and got added to: <@${owner}> Wallet!\nTo get started Type: \`${prefix}help\``).setThumbnail(botuser.displayAvatarURL())
                                        .addField("Rate us on TRUSTPILOT", `> ***We would love it, if you could give us a __HONEST__ Rating on [Trustpilot](https://de.trustpilot.com/review/kooje.eu)*** <3`)
                                    ]
                                })
                                ch.send({
                                    content: `<a:check:939238439826640957> ***BOT CREATION WAS SUCCESSFUL***\n\n> Here is just the Bot Creation Information, if the Bot User needs Support etc. so that you have access to it!\n\n> **Go back**: <#${message.channel.id}>`,
                                    embeds: [new Discord.MessageEmbed().setColor(client.config.color).setDescription(`> **Path:**\n\`\`\`yml\n${destDir}\n\`\`\`\n> **Server:**\n\`\`\`yml\n${String(Object.values(require('os').networkInterfaces()).reduce((r, list) => r.concat(list.reduce((rr, i) => rr.concat(i.family === 'IPv4' && !i.internal && i.address || []), [])), [])).split(".")[3].split(",")[0]}\n\`\`\`\n> **Command:**\n\`\`\`yml\npm2 list | grep "${filenama}" --ignore-case\n\`\`\`\n> **Application Information:**\n\`\`\`yml\nLink: https://discord.com/developers/applications/${botid}\nName: ${botuser ? `${botuser.tag}\nIcon: ${botuser.displayAvatarURL()}` : `>>${filenama}<<`}\nOriginalOwner: ${client.users.cache.get(owner) ? client.users.cache.get(owner).tag + `(${client.users.cache.get(owner).id})` : owner}\`\`\``).setThumbnail(botuser.displayAvatarURL())]
                                }).catch(e => {

                                })
                                client.bots.ensure(owner, {
                                    bots: []
                                })
                                client.bots.push(owner, botid, "bots")
                                client.bots.set(botid, BotType, "type")
                                client.bots.set(botid, `> **Path:**\n\`\`\`yml\n${destDir}\n\`\`\`\n> **Server:**\n\`\`\`yml\n${String(Object.values(require('os').networkInterfaces()).reduce((r, list) => r.concat(list.reduce((rr, i) => rr.concat(i.family === 'IPv4' && !i.internal && i.address || []), [])), [])).split(".")[3].split(",")[0]}\n\`\`\`\n> **Command:**\n\`\`\`yml\npm2 list | grep "${filenama}" --ignore-case\n\`\`\`\n> **Application Information:**\n\`\`\`yml\nLink: https://discord.com/developers/applications/${botid}\nName: ${botuser ? `${botuser.tag}\nIcon: ${botuser.displayAvatarURL()}` : `>>${filenama}<<`}\nOriginalOwner: ${client.users.cache.get(owner) ? client.users.cache.get(owner).tag + `(${client.users.cache.get(owner).id})` : owner}\`\`\``, "info")
                                require("child_process").exec(`pm2 save`)
                                client.createingbotmap.delete("CreatingTime");
                                client.createingbotmap.delete("Creating");
                                try {
                                    message.channel.permissionOverwrites.edit(botuser.id, {
                                        SEND_MESSAGES: true,
                                        EMBED_LINKS: true,
                                        VIEW_CHANNEL: true,
                                        READ_MESSAGE_HISTORY: true,
                                        ATTACH_FILES: true,
                                        ADD_REACTIONS: true
                                    })
                                } catch {}
                            })
                            .catch(async err => {
                                client.createingbotmap.delete("CreatingTime");
                                client.createingbotmap.delete("Creating");
                                tempmsfg.embeds[0].fields[2].name = `<a:crossred:939238440359321600> Copying ${filenum} Files`
                                tempmsfg.embeds[0].fields[3].name = "<a:crossred:939238440359321600> Starting Bot..."
                                tempmsfg.embeds[0].fields[4].name = "<a:crossred:939238440359321600> Adding Finished Role"
                                tempmsfg.embeds[0].fields[5].name = "<a:crossred:939238440359321600> Writing Database"
                                await tempmsfg.edit({
                                    embeds: [tempmsfg.embeds[0]]
                                }).catch((e) => {
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                })
                                ch.send("SOMETHING WENT WRONG:\n```" + err.message ? err.message.toString().substr(0, 1900) : err.toString().substr(0, 1900) + "```")
                            });
                    }, 100)
                } catch (e) {
                    console.log(e.stack ? String(e.stack).grey : String(e).grey)
                }


                ///////////////////////////////////////
                ///////////////////////////////////////
                ///////////////////////////////////////
                ///////////////////////////////////////
                ///////////////////////////////////////
                ///////////////////////////////////////
            }
            //Event
            client.on('interactionCreate', async interaction => {
                if (!interaction.isSelectMenu()) return;
                if (interaction.message.id === menumessage.id) {
                    if (interaction.user.id === cmduser.id) menuselection(interaction);
                    else return interaction.reply({
                        content: `Only <@${message.author.id}> is allowed to create a Bot (because he executed the COMMAND)`,
                        ephemeral: true
                    })
                }
            });
        } 
        
        /**
         * TICKET SYSTEM
         */
        else if (cmd === "addticket") {
            if(!isValidTicket(message.channel)) return message.reply("<a:crossred:939238440359321600> This Channel is not a Ticket!");
            
            if (message.member.roles.highest.rawPosition < message.guild.roles.cache.get(Roles.SupporterRoleId).rawPosition) {
                return message.reply("<a:crossred:939238440359321600> **You are not allowed to execute this Command!** Only Supporters or Higher!").then(m => m.delete({
                    timeout: 3500
                }).catch(console.error)).catch(console.error);
            }
            let member = message.mentions.members.filter(m => m.guild.id == message.guild.id).first() || await message.guild.members.fetch(args[0])
            if (!member || !member.user) return message.reply("<a:crossred:939238440359321600> **You forgot to Ping a MEMBER**\nUsage: `,addticket @USER/@BOT`");
            let user = member.user;
            if(message.channel.permissionOverwrites.cache.has(user.id)) return message.reply("<a:crossred:939238440359321600> **This User is already added to this Ticket!**")
            
            message.channel.permissionOverwrites.edit(user, {
                SEND_MESSAGES: true,
                EMBED_LINKS: true,
                READ_MESSAGE_HISTORY: true,
                ATTACH_FILES: true,
                VIEW_CHANNEL: true,
            }).catch(e => {
                console.log(e.stack ? String(e.stack).grey : String(e).grey)
            }).then(() => {
                message.channel.send(`<a:check:939238439826640957> Successfully Added <@${user.id}> to this Ticket`);
            })
        } else if (cmd === "removeticket") {
            if(!isValidTicket(message.channel)) return message.reply("<a:crossred:939238440359321600> This Channel is not a Ticket!");
            if (message.member.roles.highest.rawPosition < message.guild.roles.cache.get(Roles.SupporterRoleId).rawPosition) {
                return message.reply("<a:crossred:939238440359321600> **You are not allowed to execute this Command!** Only Supporters or Higher!").then(m => m.delete({
                    timeout: 3500
                }).catch(console.error)).catch(console.error);
            }
            let member = message.mentions.members.filter(m => m.guild.id == message.guild.id).first() || await message.guild.members.fetch(args[0])
            if (!member || !member.user) return message.reply("<a:crossred:939238440359321600> **You forgot to Ping a MEMBER**\nUsage: `,removeticket @USER/@BOT`");
            let user = member.user;
            if(!message.channel.permissionOverwrites.cache.has(user.id)) return message.reply("<a:crossred:939238440359321600> **This User is not added to this Ticket!**")
            message.channel.permissionOverwrites.delete(user).catch(e => {
                message.channel.send(`<a:crossred:939238440359321600> Failed to remove <@${user.id}> from this Ticket`);
            }).then(() => {
                message.channel.send(`<a:check:939238439826640957> Successfully Removed <@${user.id}> from this Ticket`);
            })
        } else if (cmd === "close") {
            if (!message.member.permissions.has("ADMINISTRATOR") && !message.member.roles.cache.has(Roles.SupporterRoleId) && !message.member.roles.cache.has(Roles.OwnerRoleId) && !message.member.roles.cache.has(Roles.ChiefBotCreatorRoleId)) return message.reply("You are not allowed to close the TICKET!")
            let verifybutton1 = new MessageButton().setStyle("DANGER").setLabel("Close").setCustomId("close").setEmoji("🔒")
            let verifybutton2 = new MessageButton().setStyle("SUCCESS").setLabel("Don't Close").setCustomId("dont_close").setEmoji("🔓")
            let allbuttons = [new MessageActionRow().addComponents([verifybutton1, verifybutton2])]
            if(!isValidTicket(message.channel)) return message.reply("<a:crossred:939238440359321600> This Channel is not a Ticket!");
            let tmp = await message.reply({
                embeds: [new Discord.MessageEmbed()
                    .setColor(client.config.color)
                    .setTitle("Are you sure that You want to close the Ticket?")
                ],
                components: allbuttons
            });
            let userid = false;
            const collector = tmp.channel.createMessageComponentCollector({
                filter: button => button.isButton() && !button.user.bot,
                time: 30000
            })
            collector.on('collect', async i => {
                if (i.customId === 'close') {
                    //update the db for the staff person
                    client.staffrank.push(message.author.id, Date.now(), "tickets")
                    //defer update
                    await i.update({
                        embeds: [new Discord.MessageEmbed().setColor("RED").setTitle("Closing the Ticket...")],
                        components: []
                    });

                    try {
                        if(client.setups.has(message.channel.id)) {
                            userid = client.setups.get(message.channel.id, "user");
                            client.setups.delete(message.channel.id);
                        }
                        if (!userid && message.channel.parent && message.channel.parent.id == "938439935361433691")
                            userid = client.setups.findKey(user => user.ticketid == message.channel.id)
                        if (!userid && message.channel.parent && message.channel.parent.id == "938914282333147257")
                            userid = client.setups.findKey(user => user.ticketid2 == message.channel.id)
                        if (!userid && message.channel.parent && message.channel.parent.id == "938439892638257172")
                            userid = client.setups.findKey(user => user.ticketid3 == message.channel.id)
                        if (!userid && message.channel.parent && message.channel.parent.id == "938462240984674305")
                            userid = client.setups.findKey(user => user.ticketid4 == message.channel.id)
                        if (!userid && message.channel.parent && message.channel.parent.id == "938466109923942442")
                            userid = client.setups.findKey(user => user.ticketid5 == message.channel.id)
                        if (!userid && message.channel.parent && message.channel.parent.id == "938439935361433691")
                            userid = client.setups.findKey(user => user.ticketid6 == message.channel.id)
                        if(userid.length < 5) {
                            userid = client.setups.findKey(user => user.ticketid == message.channel.id 
                                || user.ticketid1 == message.channel.id
                                || user.ticketid2 == message.channel.id
                                || user.ticketid3 == message.channel.id
                                || user.ticketid4 == message.channel.id
                                || user.ticketid5 == message.channel.id
                                || user.ticketid6 == message.channel.id
                                || user.ticketid7 == message.channel.id
                                || user.ticketid8 == message.channel.id
                                || user.ticketid9 == message.channel.id
                                || user.ticketid0 == message.channel.id
                                || user.ticketid10 == message.channel.id)
                        }
                    } catch (e) {
                        //console.log(e.stack ? String(e.stack).grey : String(e).grey)
                    }
                    client.ticketdata.ensure(message.channel.id, {
                        supporters: [ /* { id: "", messages: 0} */ ]
                    })


                    let parent1 = message.guild.channels.cache.get("938874521476292629");
                    let parent2 = message.guild.channels.cache.get("938874561338961940")
                    if(parent1 && parent1.size > 50 && parent2 && parent2.size > 50)
                     return message.reply("<a:crossred:939238440359321600> **BOTH CLOSED TICKET CATEGORIES are FULL**!\nUse `,closeall` before you can close a ticket...")


                    let ticketdata = client.ticketdata.get(message.channel.id, "supporters")
                    ticketdata = ticketdata.map(d => `<@${d.id}> | \`${d.messages} Messages\``)


                    try {

                        var messagelimit = 1000;
                        //The text content collection
                        let messageCollection = new Discord.Collection(); //make a new collection
                        let channelMessages = await message.channel.messages.fetch({ //fetch the last 100 messages
                            limit: 100
                        }).catch(() => {}); //catch any error
                        messageCollection = messageCollection.concat(channelMessages); //add them to the Collection
                        let tomanymessages = 1; //some calculation for the messagelimit
                        if (Number(messagelimit) === 0) messagelimit = 100; //if its 0 set it to 100
                        messagelimit = Number(messagelimit) / 100; //devide it by 100 to get a counter
                        if (messagelimit < 1) messagelimit = 1; //set the counter to 1 if its under 1
                        while (channelMessages.size === 100) { //make a loop if there are more then 100 messages in this channel to fetch
                            if (tomanymessages === messagelimit) break; //if the counter equals to the limit stop the loop
                            tomanymessages += 1; //add 1 to the counter
                            let lastMessageId = channelMessages.lastKey(); //get key of the already fetched messages above
                            channelMessages = await message.channel.messages.fetch({
                                limit: 100,
                                before: lastMessageId
                            }).catch(() => {}); //Fetch again, 100 messages above the already fetched messages
                            if (channelMessages) //if its true
                                messageCollection = messageCollection.concat(channelMessages); //add them to the collection
                        }
                        //reverse the array to have it listed like the discord chat
                        create_transcript_buffer([...messageCollection.values()], message.channel, message.guild).then(async path => {
                            try { // try to send the file
                                const attachment = new Discord.MessageAttachment(path); //send it as an attachment
                                await client.channels.fetch("938793626497056828").then(async channel => {
                                    try {
                                        client.users.fetch(userid).then(async user => {
                                            await channel.send({
                                                embeds: [new Discord.MessageEmbed()
                                                    .addField("Supporters:", `> ${ticketdata.join("\n")}`.substr(0, 1024))
                                                    .setColor("BLURPLE").setFooter(message.author.tag + " | ID: " + message.author.id+"\nTicketLog is attached to the Message!", message.author.displayAvatarURL({
                                                        dynamic: true
                                                    })).setDescription(`> 🔒 <@${message.author.id}> Executed: \`close\`\n> **For: ${user} \`${user.tag}\` (${userid})**\n> **Channel: \`${message.channel.name}\` (\`${message.channel.id}\`)**\n> **Category: \`${message.channel.parent?.name}\` (\`${message.channel.parentId}\`)**`)
                                                ], files: [attachment]
                                            })
                                        }).catch(async e => {
                                            console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                            await channel.send({
                                                embeds: [new Discord.MessageEmbed()
                                                    .addField("Supporters:", `> ${ticketdata && ticketdata.length > 0 ? ticketdata.join("\n") : "None"}`.substr(0, 1024))
                                                    .setColor("BLURPLE").setFooter(message.author.tag + " | ID: " + message.author.id+"\nTicketLog is attached to the Message!", message.author.displayAvatarURL({
                                                        dynamic: true
                                                    })).setDescription(`> 🔒 <@${message.author.id}> Executed: \`close\`\n> **For: ${userid}**\n> **Channel: \`${message.channel.name}\` (\`${message.channel.id}\`)**\n> **Category: \`${message.channel.parent?.name}\` (\`${message.channel.parentId}\`)**`)
                                                ], files: [attachment]
                                            })
                                        })
                                    } catch (e) {
                                        console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                        await channel.send({
                                            embeds: [new Discord.MessageEmbed()
                                                .addField("Supporters:", `> ${ticketdata.join("\n")}`.substr(0, 1024))
                                                .setColor("BLURPLE").setFooter(message.author.tag + " | ID: " + message.author.id+"\nTicketLog is attached to the Message!", message.author.displayAvatarURL({
                                                    dynamic: true
                                                })).setDescription(`> 🔒 <@${message.author.id}> Executed: \`close\`\n> **Channel: \`${message.channel.name}\` (\`${message.channel.id}\`)**\n> **Category: \`${message.channel.parent?.name}\` (\`${message.channel.parentId}\`)**`)
                                            ], files: [attachment]
                                        })
                                    }
                                }).catch(e => console.log(e.stack ? String(e.stack).grey : String(e).grey))
            
                                if (userid && userid.length > 2) {
                                    try {
                                        await client.users.fetch(userid).then(async user => {
                                            try {
                                                if (message.channel.parent && message.channel.parent.id == "938439935361433691")
                                                    client.setups.remove("TICKETS", user.id, "tickets");
                                                if (message.channel.parent && message.channel.parent.id == "938914282333147257")
                                                    client.setups.remove("TICKETS", user.id, "tickets2");
                                                if (message.channel.parent && message.channel.parent.id == "938439892638257172")
                                                    client.setups.remove("TICKETS", user.id, "tickets3");
                                                if (message.channel.parent && message.channel.parent.id == "938462240984674305")
                                                    client.setups.remove("TICKETS", user.id, "tickets4");
                                                if (message.channel.parent && message.channel.parent.id == "938466109923942442")
                                                    client.setups.remove("TICKETS", user.id, "tickets5");
                                                if (message.channel.parent && message.channel.parent.id == "938439935361433691")
                                                    client.setups.remove("TICKETS", user.id, "tickets6");
                                            } catch (e) {
                                                console.log(e.stack ? String(e.stack).grey : String(e).grey)
                                            }
                                            await user.send({
                                                embeds: [new Discord.MessageEmbed()
                                                    .setColor(client.config.color)
                                                    .setTitle(`\`${message.channel.name}\``)
                                                    .addField(`🔒 CLOSED BY:`, `${message.author.tag} | <@${message.author.id}>`)
                                                    .setFooter(message.author.tag + " | ID: " + message.author.id+"\nTicketLog is attached to the Message!", message.author.displayAvatarURL({
                                                        dynamic: true
                                                    }))
                                                    .addField(`♨️ TYPE:`, `${message.channel.parent ? message.channel.parent.name : "UNKOWN"}`)
                                                ], files: [attachment]
                                            }).catch(console.log)
                                        })
                                    } catch {
            
                                    }
                                }
                                setTimeout(async () => {
                                    await fs.unlinkSync(path)
                                }, 300)
                            } catch (error) { //if the file is to big to be sent, then catch it!
                                console.log(error)
                            }
                        }).catch(e => {
                            console.log(String(e).grey)
                        })
                    }catch (e){
                        console.log(e)
                    }
                    await message.channel.send({
                        embeds: [new Discord.MessageEmbed()
                            .setColor(client.config.color)
                            .setTitle(`\`${message.channel.name}\``)
                            .addField(`🔒 CLOSED BY:`, `${message.author.tag} | <@${message.author.id}>`)
                            .addField(`♨️ TYPE:`, `${message.channel.parent ? message.channel.parent.name : "UNKOWN"}`)
                        ]
                    }).catch(console.log)
                    if(parent1 && parent1.children.size < 50) {
                        await message.channel.setParent(parent1.id, {lockPermissions:false}).catch(()=>{});
                    } else {
                        console.log("PARENT 1 is full, using next parent")
                        await message.channel.setParent(parent2.id, {lockPermissions:false}).catch(()=>{});
                    }
                    await message.channel.permissionOverwrites.set([
                        {id: message.guild.id, deny: [Discord.Permissions.FLAGS.VIEW_CHANNEL,Discord.Permissions.FLAGS.SEND_MESSAGES,Discord.Permissions.FLAGS.VIEW_CHANNEL]}
                    ]).catch(()=>{});
                    
                } else {
                    await i.update({
                        embeds: [new Discord.MessageEmbed().setColor(client.config.color).setTitle("Keeping the Ticket open!")],
                        components: []
                    });

                }
            });
        } else if (cmd === "closeall") {
            if (message.member.roles.highest.rawPosition < message.guild.roles.cache.get(Roles.CoOwnerRoleId).rawPosition)
                return message.reply("<a:crossred:939238440359321600> You are not allowed to execute this Command!");

            let verifybutton1 = new MessageButton().setStyle("DANGER").setLabel("Close").setCustomId("close").setEmoji("🔒")
            let verifybutton2 = new MessageButton().setStyle("SUCCESS").setLabel("Don't Close").setCustomId("dont_close").setEmoji("🔓")
            let allbuttons = [new MessageActionRow().addComponents([verifybutton1, verifybutton2])]
            let tmp = await message.reply({
                embeds: [new Discord.MessageEmbed()
                    .setColor(client.config.color)
                    .setTitle("Are you sure that You want to close the Ticket?")
                ],
                components: allbuttons
            });
            let userid = "0";
            const collector = tmp.channel.createMessageComponentCollector({
                filter: button => button.isButton() && !button.user.bot,
                time: 30000
            })
            collector.on('collect', async i => {
                let amount = message.guild.channels.cache.get("938874521476292629").children.map(ch => ch.id).length + message.guild.channels.cache.get("938874561338961940").children.map(ch => ch.id).length;

                if (i.customId === 'close') {
                    if (amount == 0) {
                        await i.update({
                            embeds: [new Discord.MessageEmbed().setColor("RED").setTitle(`No Tickets available to get deleted!!`)],
                            components: []
                        });
                    } else {
                        await i.update({
                            embeds: [new Discord.MessageEmbed().setColor("RED").setTitle(`Deleting ${amount} Tickets...`)],
                            components: []
                        });

                        client.channels.fetch("938874521476292629").then(async channel => {
                            let channels = channel.children.map(ch => ch.id)
                            for (const channel of channels) {
                                await new Promise((res) => {
                                    setTimeout(async () => {
                                        res(2)
                                    }, 1000)
                                })
                                client.channels.fetch(channel).then(channel => {
                                    channel.delete().catch(e => console.log(e.stack ? String(e.stack).grey : String(e).grey))
                                })
                            }
                        }).catch(console.log)
                        client.channels.fetch("938874561338961940").then(async channel => {
                            let channels = channel.children.map(ch => ch.id)
                            for (const channel of channels) {
                                await new Promise((res) => {
                                    setTimeout(async () => {
                                        res(2)
                                    }, 1000)
                                })
                                client.channels.fetch(channel).then(channel => {
                                    channel.delete().catch(e => console.log(e.stack ? String(e.stack).grey : String(e).grey))
                                })
                            }
                        }).catch(e => console.log(e.stack ? String(e.stack).grey : String(e).grey))
                    }
                } else {
                    await i.update({
                        embeds: [new Discord.MessageEmbed().setColor(client.config.color).setTitle(`Keeping ${amount} Tickets closed!`)],
                        components: []
                    });

                }
            })

        } else if (cmd === "setprotyo") {
            if(!isValidTicket(message.channel)) return message.reply("<a:crossred:939238440359321600> This Channel is not a Ticket!");
            if (message.member.roles.highest.rawPosition < message.guild.roles.cache.get(Roles.SupporterRoleId).rawPosition) {
                return message.reply("<a:crossred:939238440359321600> **You are not allowed to execute this Command!** Only Supporters or Higher!").then(m => m.delete({
                    timeout: 3500
                }).catch(console.error)).catch(console.error);
            }
            message.channel.setParent("938466109923942442").then(() => {
                var { name } = message.channel;
                var emoji = "👑";
                if(name.includes(emoji)) return message.reply(`<a:crossred:939238440359321600> **This Channel is already defined as \`${cmd}\`**`)
                message.delete().catch(()=>{});
                message.channel.send(`**Pinging Protyo, and changing Channel Permissions...**\n> <@717416034478456925>`).then(async m => {
                    const notallowed = [Roles.SupporterRoleId, Roles.NewSupporterRoleId, Roles.ModRoleId, Roles.BotCreatorRoleId, Roles.ChiefBotCreatorRoleId, Roles.ChiefSupporterRoleId];
                    for(const id of message.channel.permissionOverwrites.cache.filter(p => p.type == "member" && p.allow.has("SEND_MESSAGES")).map(m => m.id).filter(m=> {
                        let member = message.guild.members.cache.get(m)
                        //filter only members who are not SUPPORTERS
                        if(member && 
                        member.roles.highest.rawPosition >= message.guild.roles.cache.get(Roles.NewSupporterRoleId).rawPosition && 
                        notallowed.some(id => member.roles.highest.rawPosition <= message.guild.roles.cache.get(id).rawPosition)
                        ) {
                            if(client.setups.has(message.channel.id) && client.setups.get(message.channel.id, "user") == m) return false;
                            else return m;
                        }
                        else return false;
                    }).filter(Boolean)) {
                        await message.channel.permissionOverwrites.edit(id, {
                            SEND_MESSAGES: false,
                        }).catch(() => {});
                        //wait a bit
                        await delay(client.ws.ping);
                    }
                    //Send Approve Message
                    m.edit(`👍 **Protyo is contacted, let's wait for his Response!**`)
                })
                message.channel.setName(`${name.slice(0, name.indexOf("᚛") - 1)}${emoji}${name.slice(name.indexOf("᚛"))}`).catch((e) => {
                    message.reply("<a:crossred:939238440359321600> **Something went wrong, maybe ratelimited..**").then(m => {
                    setTimeout(() => m.delete().catch(() => {}), 3000);
                })
                }).catch((e) => {
                    console.log(e);
                    message.reply("<a:crossred:939238440359321600> **Could not rename the Channel...**").then(m => {
                    setTimeout(() => m.delete().catch(() => {}), 3000);
                })
                })
            }).catch(e => {
                message.channel.send(`${e.message ? e.message : e}`.substr(0, 1900), {
                    code: "js"
                })
            })
        } else if (cmd === "setowner") {
            if(!isValidTicket(message.channel)) return message.reply("<a:crossred:939238440359321600> This Channel is not a Ticket!");
            if (message.member.roles.highest.rawPosition < message.guild.roles.cache.get(Roles.SupporterRoleId).rawPosition) {
                return message.reply("<a:crossred:939238440359321600> **You are not allowed to execute this Command!** Only Supporters or Higher!").then(m => m.delete({
                    timeout: 3500
                }).catch(console.error)).catch(console.error);
            }
            var { name } = message.channel;
            var emoji = "💎";
            if(name.includes(emoji)) return message.reply(`<a:crossred:939238440359321600> **This Channel is already defined as \`${cmd}\`**`)
            message.delete().catch(()=>{});
            message.channel.send(`**Pinging the Co-Owners & Owners, and changing Channel Permissions...**\n> <@&${Roles.OwnerRoleId}> / <@&${Roles.CoOwnerRoleId}> / <@&${Roles.FounderId}>`).then(async m => {
                const notallowed = [Roles.SupporterRoleId, Roles.NewSupporterRoleId, Roles.ModRoleId, Roles.BotCreatorRoleId, Roles.ChiefBotCreatorRoleId, Roles.ChiefSupporterRoleId];
                for(const id of message.channel.permissionOverwrites.cache.filter(p => p.type == "member" && p.allow.has("SEND_MESSAGES")).map(m => m.id).filter(m=> {
                    let member = message.guild.members.cache.get(m)
                    //filter only members who are not SUPPORTERS
                    if(member && 
                       member.roles.highest.rawPosition >= message.guild.roles.cache.get(Roles.NewSupporterRoleId).rawPosition && 
                       notallowed.some(id => member.roles.highest.rawPosition <= message.guild.roles.cache.get(id).rawPosition)
                    ) {
                        if(client.setups.has(message.channel.id) && client.setups.get(message.channel.id, "user") == m) return false;
                        else return m;
                    }
                    else return false;
                }).filter(Boolean)) {
                    await message.channel.permissionOverwrites.edit(id, {
                        SEND_MESSAGES: false,
                    }).catch(() => {});
                    //wait a bit
                    await delay(client.ws.ping);
                }
                //Send Approve Message
                m.edit(`👍 **Co-Owners & Owners are contacted, let's wait for their Response!**`)
            })
            message.channel.setName(`${name.slice(0, name.indexOf("᚛") - 1)}${emoji}${name.slice(name.indexOf("᚛"))}`).catch((e) => {
                message.reply("<a:crossred:939238440359321600> **Something went wrong, maybe ratelimited..**").then(m => {
                    setTimeout(() => m.delete().catch(() => {}), 3000);
                })
            }).catch((e) => {
                console.log(e);
                message.reply("<a:crossred:939238440359321600> **Could not rename the Channel...**").then(m => {
                    setTimeout(() => m.delete().catch(() => {}), 3000);
                })
            })
        } else if (cmd === "setmod") {
            if(!isValidTicket(message.channel)) return message.reply("<a:crossred:939238440359321600> This Channel is not a Ticket!");
            if (message.member.roles.highest.rawPosition < message.guild.roles.cache.get(Roles.SupporterRoleId).rawPosition) {
                return message.reply("<a:crossred:939238440359321600> **You are not allowed to execute this Command!** Only Supporters or Higher!").then(m => m.delete({
                    timeout: 3500
                }).catch(console.error)).catch(console.error);
            }
            var { name } = message.channel;
            var emoji = "💠";
            if(name.includes(emoji)) return message.reply(`<a:crossred:939238440359321600> **This Channel is already defined as \`${cmd}\`**`)
            message.delete().catch(()=>{});
            message.channel.send(`**Pinging the Mods & Admins, and changing Channel Permissions...**\n> <@&${Roles.ModRoleId}> / <@&${Roles.AdminRoleId}>`).then(async m => {
                const notallowed = [Roles.SupporterRoleId, Roles.NewSupporterRoleId, Roles.BotCreatorRoleId, Roles.ChiefBotCreatorRoleId, Roles.ChiefSupporterRoleId];
                for(const id of message.channel.permissionOverwrites.cache.filter(p => p.type == "member" && p.allow.has("SEND_MESSAGES")).map(m => m.id).filter(m=> {
                    let member = message.guild.members.cache.get(m)
                    //filter only members who are not SUPPORTERS
                    if(member && 
                       member.roles.highest.rawPosition >= message.guild.roles.cache.get(Roles.NewSupporterRoleId).rawPosition && 
                       notallowed.some(id => member.roles.highest.rawPosition <= message.guild.roles.cache.get(id).rawPosition)
                    ) {
                        if(client.setups.has(message.channel.id) && client.setups.get(message.channel.id, "user") == m) return false;
                        else return m;
                    }
                    else return false;
                }).filter(Boolean)) {
                    await message.channel.permissionOverwrites.edit(id, {
                        SEND_MESSAGES: false,
                    }).catch(() => {});
                    //wait a bit
                    await delay(client.ws.ping);
                }
                await message.channel.permissionOverwrites.edit(Roles.ModRoleId, {
                    SEND_MESSAGES: true,
                }).catch(() => {});
                //Send Approve Message
                m.edit(`👍 **Mods & Admins are contacted, let's wait for their Response!**`)
            })
            message.channel.setName(`${name.slice(0, name.indexOf("᚛") - 1)}${emoji}${name.slice(name.indexOf("᚛"))}`).catch((e) => {
                message.reply("<a:crossred:939238440359321600> **Something went wrong, maybe ratelimited..**").then(m => {
                    setTimeout(() => m.delete().catch(() => {}), 3000);
                })
            }).catch((e) => {
                console.log(e);
                message.reply("<a:crossred:939238440359321600> **Could not rename the Channel...**").then(m => {
                    setTimeout(() => m.delete().catch(() => {}), 3000);
                })
            })
        } else if (cmd === "setimportant") {
            if(!isValidTicket(message.channel)) return message.reply("<a:crossred:939238440359321600> This Channel is not a Ticket!");
            if (message.member.roles.highest.rawPosition < message.guild.roles.cache.get(Roles.SupporterRoleId).rawPosition) {
                return message.reply("<a:crossred:939238440359321600> **You are not allowed to execute this Command!** Only Supporters or Higher!").then(m => m.delete({
                    timeout: 3500
                }).catch(console.error)).catch(console.error);
            }
            var { name } = message.channel;
            var emoji = "❗";
            if(name.includes(emoji)) return message.reply(`<a:crossred:939238440359321600> **This Channel is already defined as \`${cmd}\`**`)
            message.delete().catch(()=>{});
            message.channel.send(`**Pinging the Mods & Admins, and changing Channel Permissions...**\n> <@&${Roles.ModRoleId}> / <@&${Roles.AdminRoleId}>`).then(async m => {
                const notallowed = [Roles.SupporterRoleId, Roles.NewSupporterRoleId, Roles.BotCreatorRoleId, Roles.ChiefBotCreatorRoleId, Roles.ChiefSupporterRoleId];
                for(const id of message.channel.permissionOverwrites.cache.filter(p => p.type == "member" && p.allow.has("SEND_MESSAGES")).map(m => m.id).filter(m=> {
                    let member = message.guild.members.cache.get(m)
                    //filter only members who are not SUPPORTERS
                    if(member && 
                       member.roles.highest.rawPosition >= message.guild.roles.cache.get(Roles.NewSupporterRoleId).rawPosition && 
                       notallowed.some(id => member.roles.highest.rawPosition <= message.guild.roles.cache.get(id).rawPosition)
                    ) {
                        if(client.setups.has(message.channel.id) && client.setups.get(message.channel.id, "user") == m) return false;
                        else return m;
                    }
                    else return false;
                }).filter(Boolean)) {
                    await message.channel.permissionOverwrites.edit(id, {
                        SEND_MESSAGES: false,
                    }).catch(() => {});
                    //wait a bit
                    await delay(client.ws.ping);
                }
                await message.channel.permissionOverwrites.edit(Roles.ModRoleId, {
                    SEND_MESSAGES: true,
                }).catch(() => {});
                //Send Approve Message
                m.edit(`👍 **Mods & Admins are contacted, let's wait for their Response!**`)
            })
            message.channel.setName(`${name.slice(0, name.indexOf("᚛") - 1)}${emoji}${name.slice(name.indexOf("᚛"))}`).catch((e) => {
                message.reply("<a:crossred:939238440359321600> **Something went wrong, maybe ratelimited..**").then(m => {
                    setTimeout(() => m.delete().catch(() => {}), 3000);
                })
            }).catch((e) => {
                console.log(e);
                message.reply("<a:crossred:939238440359321600> **Could not rename the Channel...**").then(m => {
                    setTimeout(() => m.delete().catch(() => {}), 3000);
                })
            })
        } else if (cmd === "setwaiting") {
            if(!isValidTicket(message.channel)) return message.reply("<a:crossred:939238440359321600> This Channel is not a Ticket!");
            if (message.member.roles.highest.rawPosition < message.guild.roles.cache.get(Roles.SupporterRoleId).rawPosition) {
                return message.reply("<a:crossred:939238440359321600> **You are not allowed to execute this Command!** Only Supporters or Higher!").then(m => m.delete({
                    timeout: 3500
                }).catch(console.error)).catch(console.error);
            }
            var { name } = message.channel;
            var emoji = "⏳";
            if(name.includes(emoji)) return message.reply(`<a:crossred:939238440359321600> **This Channel is already defined as \`${cmd}\`**`)
            if(!client.setups.has(message.channel.id)) return message.reply("<a:crossred:939238440359321600> **Could not find the Ticket Opener in the Database**");
            let id = client.setups.get(message.channel.id, "user")
            
            message.delete().catch(()=>{});
            message.channel.send(`**Hello <@${id}>!**\n\n> *Could you please answer until <t:${Math.floor((Date.now() + 8.64e7) / 1000)}:F> then this Ticket will automatically be closed!*\n\n**Kind Regards,**\n> Kooje Development`)
            client.setups.push("todelete", {
                channel: message.channel.id,
                timestamp: Date.now(),
                time: 8.64e7,
            }, "tickets");

            message.channel.setName(`${name.slice(0, name.indexOf("᚛") - 1)}${emoji}${name.slice(name.indexOf("᚛"))}`).catch((e) => {
                message.reply("<a:crossred:939238440359321600> **Something went wrong, maybe ratelimited..**").then(m => {
                    setTimeout(() => m.delete().catch(() => {}), 3000);
                })
            }).catch((e) => {
                console.log(e);
                message.reply("<a:crossred:939238440359321600> **Could not rename the Channel...**").then(m => {
                    setTimeout(() => m.delete().catch(() => {}), 3000);
                })
            })
        } else if (cmd === "setfinished") {
            if(!isValidTicket(message.channel)) return message.reply("<a:crossred:939238440359321600> This Channel is not a Ticket!");
            if (message.member.roles.highest.rawPosition < message.guild.roles.cache.get(Roles.SupporterRoleId).rawPosition) {
                return message.reply("<a:crossred:939238440359321600> **You are not allowed to execute this Command!** Only Supporters or Higher!").then(m => m.delete({
                    timeout: 3500
                }).catch(console.error)).catch(console.error);
            }
            var { name } = message.channel;
            var emoji = "✅";
            if(name.includes(emoji)) return message.reply(`<a:crossred:939238440359321600> **This Channel is already defined as \`${cmd}\`**`)
            if(!client.setups.has(message.channel.id)) return message.reply("<a:crossred:939238440359321600> **Could not find the Ticket Opener in the Database**");
            let id = client.setups.get(message.channel.id, "user")
            
            message.delete().catch(()=>{});
            message.channel.send({
                components: [
                    new MessageActionRow().addComponents([
                        new MessageButton().setStyle("SUCCESS").setLabel("Close the Ticket").setCustomId("closeticket").setEmoji("<a:check:939238439826640957>"),
                        new MessageButton().setStyle("DANGER").setLabel("Keep it open!").setCustomId("dontcloseticket").setEmoji("<a:crossred:939238440359321600>"),
                    ])
                ],
                content:`**Hello <@${id}>!**\n\n> *Our Task is done! If you want to close/not close this Ticket, simply react to this message, otherwise it will automatically be closed at <t:${Math.floor((Date.now() + 12.96e7) / 1000)}:F> !*\n\n**Kind Regards,**\n> KooJe Development`})
            client.setups.push("todelete", {
                channel: message.channel.id,
                timestamp: Date.now(),
                time: 12.96e7,
            }, "tickets");

            message.channel.setName(`${name.slice(0, name.indexOf("᚛") - 1)}${emoji}${name.slice(name.indexOf("᚛"))}`).catch((e) => {
                message.reply("<a:crossred:939238440359321600> **Something went wrong, maybe ratelimited..**").then(m => {
                    setTimeout(() => m.delete().catch(() => {}), 3000);
                })
            }).catch((e) => {
                console.log(e);
                message.reply("<a:crossred:939238440359321600> **Could not rename the Channel...**").then(m => {
                    setTimeout(() => m.delete().catch(() => {}), 3000);
                })
            })
        } else if (cmd === "setbot") {
            if(!isValidTicket(message.channel)) return message.reply("<a:crossred:939238440359321600> This Channel is not a Ticket!");
            if (message.member.roles.highest.rawPosition < message.guild.roles.cache.get(Roles.SupporterRoleId).rawPosition) {
                return message.reply("<a:crossred:939238440359321600> **You are not allowed to execute this Command!** Only Supporters or Higher!").then(m => m.delete({
                    timeout: 3500
                }).catch(console.error)).catch(console.error);
            }
            var { name } = message.channel;
            var emoji = "🤖";
            if(name.includes(emoji)) return message.reply(`<a:crossred:939238440359321600> **This Channel is already defined as \`${cmd}\`**`)
            console.log("SETBOT");
            message.reply(`👍 **Dear <@&${Roles.BotCreatorRoleId}>!**\n> *The Customer wanted the Bot to be created! Please do it as fast as possible!*`)
            message.channel.setName(`${name.slice(0, name.indexOf("᚛") - 1)}${emoji}${name.slice(name.indexOf("᚛"))}`).catch((e) => {
                message.reply("<a:crossred:939238440359321600> **Something went wrong, maybe ratelimited..**").then(m => {
                    setTimeout(() => m.delete().catch(() => {}), 3000);
                })
            }).catch((e) => {
                console.log(e);
                message.reply("<a:crossred:939238440359321600> **Could not rename the Channel...**").then(m => {
                    setTimeout(() => m.delete().catch(() => {}), 3000);
                })
            })
        } 
        
        /**
         * BOT / SERVER MANAGEMENT COMMANDS
         */
        else if (cmd === "botmanagement" || cmd == "bm") {
            if (message.member.roles.highest.rawPosition < message.guild.roles.cache.get(Roles.CoOwnerRoleId).rawPosition)
                return message.reply("<a:crossred:939238440359321600> You are not allowed to execute this Command! (Only OWNERS)");
                let {
                    servers,
                    usernames,
                    passwords
                } = client.config;
            let serverid = String(args[0])?.split(",")[0];
            if(serverid == 234) serverid = 234;
            let option1 = String(args[1]);
            let option2 = String(args[2]);
            if (!option1 || !serverid) return message.reply(`> <a:crossred:939238440359321600> Usage: \`,botmanagement <serverid> <start/restart/stop/delete/show/list / startall/stopall/search> [BOTID/BOTNAME]\`\n\n> [BOTID] ... is for start, stop, restart, **e.g:** \`,botmanagement 9 restart 69\`\n\n> [BOTNAME] ... is for search, **e.g:** \`,botmanagement search wing\`\n\n> Possible serverids are: ${Object.keys(servers).sort((a, b) => b - a).map(d => `\`${d}\``).join(", ")}`)
            option1 = option1.toLowerCase();
            if (option2.toLowerCase() == `all`) return message.reply(`> <a:crossred:939238440359321600> **BOTID/BOTNAME may not be \`ALL\`**`)

            if (serverid != `search` && ![`start`, `restart`, `stop`, `show`, `list`, `startall`, `stopall`, `delete`].includes(option1)) return message.reply(`> <a:crossred:939238440359321600> Usage: \`,botmanagement <serverid> <start/restart/stop/show/list / startall/stopall/search> [BOTID/BOTNAME]\`\n\n> [BOTID] ... is for start, stop, restart, **e.g:** \`,botmanagement 9 restart 69\`\n\n> [BOTNAME] ... is for search, **e.g:** \`,botmanagement search wing\`\n\n> Possible serverids are: ${Object.keys(servers).sort((a, b) => b - a).map(d => `\`${d}\``).join(", ")}`)


            let theserver = servers[String(serverid)];
            let theusername = usernames[String(serverid)];
            let thepassword = passwords[String(serverid)];
            if (serverid != `search` && (!theserver || !theusername || !thepassword)) return message.reply(`<a:crossred:939238440359321600> **Invalid Server Id added**!\n> Possible serverids are: ${Object.keys(servers).sort((a, b) => b - a).map(d => `\`${d}\``).join(", ")}`)
            let consolecmd = `pm2 ${option1}${option2 ? ` ` + option2 : ``}`;
            if ([`start`, `restart`, `stop`, `show`, `delete`].includes(option1) && !option2) return message.reply(`> <a:crossred:939238440359321600> **Missing the BOT ID / NAME** Usage: \`,botmanagement <serverid> <start/restart/stop/show/list / startall/stopall/search> [BOTID/BOTNAME]\`\n\n> [BOTID] ... is for start, stop, restart, **e.g:** \`,botmanagement 9 restart 69\`\n\n> [BOTNAME] ... is for search, **e.g:** \`,botmanagement search wing\`\n\n> Possible serverids are: ${Object.keys(servers).sort((a, b) => b - a).map(d => `\`${d}\``).join(", ")}`)
            if (option1 == `startall`) consolecmd = `node /home/startall.js`;
            if (option1 == `stopall`) consolecmd = `pm2 stop all`;
            let tmpmessage = await message.reply(`<a:loading:938899148927827979> **LOADING...**`);
            if (serverid != `search`) {
                const conn = new Client();
                try {
                    conn.on('ready', () => {
                        conn.exec(consolecmd, (err, stream) => {
                            if (err) throw err;
                            let showdata = ``;
                            let suboption = ``;
                            let counter = 0;
                            stream.on('close', (code, signal) => {
                                setTimeout(() => {
                                    sourcebin.create([{
                                        content: String(showdata),
                                        language: 'text',
                                    }], {
                                        title: 'Console Output',
                                        description: `Console Output, by ${message.author.tag}`,
                                    }).then(haste => {
                                        tmpmessage.edit(`<a:check:939238439826640957> **SUCCESSFULLY OUTPUT:**\n> ${haste.short ? haste.short : haste.url}`)
                                    }).catch(e => {
                                        tmpmessage.edit(`<a:crossred:939238440359321600> \`\`\`js` + `${e.message ? e.message : e}`.substr(0, 1900) + `\`\`\``)
                                        console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                    });
                                    conn.exec("pm2 save", (err, stream) => {
                                        if (err) throw err;
                                        stream.on('close', (code, signal) => {
                                            conn.end();
                                        }).on('data', (data) => { 

                                        }).stderr.on('data', (data) => {

                                        });
                                    })
                                }, 350)
                            }).on('data', (data) => {
                                if (option1 == "startall") {
                                    counter++;
                                    suboption += data + "\n";
                                }
                                if (counter == 2 && option1 == "startall") {
                                    tmpmessage.reply(`\`\`\`${String(suboption).substr(0, 1900)}\`\`\``);
                                    suboption = "";
                                    counter = 0;
                                }
                                showdata += data + "\n";
                            }).stderr.on('data', (data) => {
                                showdata += "{ERROR}  ::  " + data.split("\n").join("\n{ERROR}  ::  ") + "\n";
                            });
                        });
                    }).connect({
                        host: theserver,
                        port: 22,
                        username: theusername,
                        password: thepassword
                    });
                } catch (e) {
                    tmpmessage.edit(`<a:crossred:939238440359321600> \`\`\`js` + `${e.message ? e.message : e}`.substr(0, 1900) + `\`\`\``)
                }
            } else {
                try {
                    let alldata = "";
                    let counter = 0;
                    for (const [key, value] of Object.entries(servers)) {
                        try {
                            await connect(key, value);
                            await delay(100);
                        } catch (e){
                            message.reply(`<a:crossred:939238440359321600> **Failed on Host: \`${key}\`!** \`\`\`js` + `${e.message ? e.message : e}`.substr(0, 1900) + `\`\`\``)
                        }
                        counter++;
                        if (counter == Object.keys(servers).length) break;
                    }
                    async function connect(key, value) {
                        return new Promise((res, rej) => {
                            try {
                                const conn = new Client();
                                conn.on('ready', () => {
                                    conn.exec(`pm2 list`, (err, stream) => {
                                        if (err) throw err;
                                        let showdata = "";
                                        stream.on('close', (code, signal) => {
                                            for (let d of String(showdata).split("\n")) {
                                                d = d
                                                    .replace("│ fork    │", "").replace("fork", "")
                                                    .replace("│ default     │", "").replace("default", "")
                                                    .replace("│ disabled |", "").replace("disabled", "")
                                                    .replace("│ root     |", "").replace("root", "")
                                                    .replace("│ Protyo   |", "").replace("Protyo", "")
                                                    .replace("│  │", "").replace("5.0.2", "").split("│").map(i => String(i).trim());
                                                alldata += `SERVER: #${key != 155 ? key : 204} | BOTID: #${d[1]} | NAME: ${String(d[2]).split(" ")[String(d[2]).split(" ").findIndex(d => d.includes("_"))]} | STATE: ${d[5]}\n`;
                                            }
                                            conn.end();
                                            res(true);
                                        }).on('data', (data) => {
                                            showdata += data + "\n";
                                        }).stderr.on('data', (data) => {
                                            showdata += "{ERROR}  ::  " + data.split("\n").join("\n{ERROR}  ::  ") + "\n";
                                        });
                                    });
                                }).on("error", (e) => {
                                    rej(e)
                                })
                                .connect({
                                    host: value,
                                    port: 22,
                                    username: usernames[key],
                                    password: passwords[key]
                                })
                            } catch (e){
                                rej(e);
                            }
                        })
                    }
                    let result = "";
                    for (let data of String(alldata).split("\n")) {
                        if (data.toLowerCase().includes(option1.toLowerCase())) {
                            result += `${data}\n`;
                        }
                    }
                    if (!result || result.length < 1) {
                        result = "> <a:crossred:939238440359321600> **NOTHING FOUND FOR:**" + option1.toLowerCase();
                        sourcebin.create([{
                            content: String(alldata),
                            language: 'text',
                        }], {
                            title: 'Console Output',
                            description: `Console Output, by ${message.author.tag}`,
                        }).then(haste => {
                            tmpmessage.edit(`${result}\n\n> <a:check:939238439826640957> **COMPELETE OUTPUT:**\n> ${haste.short ? haste.short : haste.url}`)
                        }).catch(e => {
                            tmpmessage.edit(`${result}\n\n> <a:crossred:939238440359321600> \`\`\`js` + `${e.message ? e.message : e}`.substr(0, 1900) + `\`\`\``)
                            console.log(e.stack ? String(e.stack).grey : String(e).grey);
                        });
                    } else {
                        sourcebin.create([{
                            content: String(result),
                            language: 'text',
                        }], {
                            title: 'Console Output',
                            description: `Console Output, by ${message.author.tag}`,
                        }).then(haste => {
                            tmpmessage.edit(`<a:check:939238439826640957> **SEARCH SUCCESSFULL (LOOK ATTACHMENT)**\n\n> <a:check:939238439826640957> **SEARCH RESULT OUTPUT:**\n> ${haste.short ? haste.short : haste.url}`)
                        }).catch(e => {
                            // Handle error
                            tmpmessage.edit(`<a:check:939238439826640957> **SEARCH SUCCESSFULL (LOOK ATTACHMENT)**\n\n> <a:crossred:939238440359321600> \`\`\`js` + `${e.message ? e.message : e}`.substr(0, 1900) + `\`\`\``)
                            console.log(e.stack ? String(e.stack).grey : String(e).grey);
                        });
                    }

                } catch (e) {
                    tmpmessage.edit(`<a:crossred:939238440359321600> \`\`\`js` + `${e.message ? e.message : e}`.substr(0, 1900) + `\`\`\``)
                }
            }
        } else if (cmd === "recoverbothost") {
            if (message.member.roles.highest.rawPosition < message.guild.roles.cache.get(Roles.AdminRoleId).rawPosition)
                return message.reply("<a:crossred:939238440359321600> You are not allowed to execute this Command! (Only OWNERS & Co-Owners)");
            try {
                var user;
                try {
                    user = await GetBot(message, args);
                } catch (e) {
                    console.log(e.stack ? String(e.stack).grey : String(e).grey)
                    return message.reply("ERROR:" + e)
                }
                if (!user || !user.id) return message.reply("<a:crossred:939238440359321600> Did not find the User ... ERROR")
                client.bots.ensure(user.id, {
                    info: "No Info available",
                    type: "Default"
                })
                let data = client.bots.get(user.id, "info");
                if (!data || data.type == "Default") throw "E";
                let server = data.split("\n")[6].split(",")[0];
                let path = data.split("\n")[2];
                let {
                    servers,
                    usernames,
                    passwords
                } = client.config;
                let theserver = servers[server];
                
                if(!theserver) return message.reply("<a:crossred:939238440359321600> Could not find the Server");
                let theusername = usernames[server];
                let thepassword = passwords[server];
                let failed = false;
                const conn = new Client();
                
                try {
                    conn.on('ready', () => {
                        console.log(`cd '${path}'`);
                        conn.exec(`cd '${path}'; pm2 start ecosystem.config.js`, (err, stream) => {
                            if (err) return console.log(err);
                            if(failed){
                                console.log(err);
                                return conn.end();
                            }
                            stream.on('close', (code, signal) => {
                                if(failed){
                                    return conn.end();
                                }
                                setTimeout(() => {
                                    conn.exec("pm2 save", (err, stream) => {
                                        if (err) return console.log(err);
                                        stream.on('close', (code, signal) => {
                                            message.reply(`👍 **Recovered the Bot:** ${user} | ${user.tag} (\`${user.id}\`)\n**Path:** \`${path}\`\n**Host:** \`${server}\``);
                                            conn.end();
                                        }).on('data', (data) => { 

                                        }).stderr.on('data', (data) => {

                                        });
                                    })
                                }, 250);
                            }).on('data', (data) => { 

                            }).stderr.on('data', (data) => {
                                if(data && data.toString().length > 1){
                                    console.log(data.toString());
                                    failed = true;
                                    return message.reply("<a:crossred:939238440359321600> This Bot Path is not existing")
                                }
                            });
                        })
                    }).connect({
                        host: theserver,
                        port: 22,
                        username: theusername,
                        password: thepassword
                    });
                } catch (e) {
                    tmpmessage.edit(`<a:crossred:939238440359321600> \`\`\`js` + `${e.message ? e.message : e}`.substr(0, 1900) + `\`\`\``)
                }
            } catch (e) {
                console.log(e.stack ? String(e.stack).grey : String(e).grey)
                return message.reply("<a:crossred:939238440359321600> There is no detail Data about this Bot :c")
            }
        } else if (cmd === "removebothost") {
            if (message.member.roles.highest.rawPosition < message.guild.roles.cache.get(Roles.CoOwnerRoleId).rawPosition)
                return message.reply("<a:crossred:939238440359321600> You are not allowed to execute this Command! (Only OWNERS)");
            try {
                var user;
                try {
                    user = await GetBot(message, args);
                } catch (e) {
                    console.log(e.stack ? String(e.stack).grey : String(e).grey)
                    return message.reply("ERROR:" + e)
                }
                if (!user || !user.id) return message.reply("<a:crossred:939238440359321600> Did not find the BOT ... ERROR")
                client.bots.ensure(user.id, {
                    info: "No Info available",
                    type: "Default"
                })
                let data = client.bots.get(user.id, "info");
                if (!data || data.type == "Default") throw "E";
                let server = data.split("\n")[6].split(",")[0];
                let path = data.split("\n")[2];
                let BotFileName = path.split("/")[path.split("/").length - 1]
                let {
                    servers,
                    usernames,
                    passwords
                } = client.config;
                let theserver = servers[server];
                if(!theserver) return message.reply("<a:crossred:939238440359321600> Could not find the Server");
                let alldata = false;
                const conn = new Client();
                conn.on('ready', () => {
                    conn.exec(`pm2 list | grep '${BotFileName}' --ignore-case`, (err, stream) => {
                        if (err) throw err;
                        let showdata = "";
                        stream.on('close', (code, signal) => {
                            setTimeout(()=>{
                                if(!showdata || showdata.length < 2) return message.reply("<a:crossred:939238440359321600> **Could not find the Bot as a hosted bot!**");
                                alldata = showdata.split(" ")[1]
                                if(alldata){
                                    let botid = parseInt(alldata)

                                    logAction(client, "botmanagement", message.author, `RED`, `https://cdn.discordapp.com/emojis/774628197370560532.gif`, `👍 **Removed the Bot-Host of:** ${user} | ${user.tag} (\`${user.id}\`)\n**Path:** \`${path}\`\n**Host:** \`${server}\``)
                                    
                                    conn.exec(`pm2 delete ${botid}`, (err, stream) => {
                                        if (err) throw err;
                                        stream.on('close', (code, signal) => {
                                            setTimeout(() => {
                                                conn.exec("pm2 save", (err, stream) => {
                                                    stream.on('close', (code, signal) => {
                                                        message.reply(`👍 **Removed the Bot-Host of:** ${user} | ${user.tag} (\`${user.id}\`)\n**Path:** \`${path}\`\n**Host:** \`${server}\``)
                                                        conn.end();
                                                    }).on('data', (data) => {
                                                    }).stderr.on('data', (data) => {
                                                        if(data && data.toString().length > 2) {
                                                            console.log(data.toString());
                                                            message.reply(`<a:crossred:939238440359321600> **Something went wrong!**\n\`\`\`${data.toString().substr(0, 1800)}\`\`\``)
                                                        }
                                                    });
                                                })
                                            })
                                        }).on('data', (data) => {
                                        }).stderr.on('data', (data) => {
                                            if(data && data.toString().length > 2) {
                                                console.log(data.toString());
                                                message.reply(`<a:crossred:939238440359321600> **Something went wrong!**\n\`\`\`${data.toString().substr(0, 1800)}\`\`\``)
                                            }
                                        });
                                    });
                                } else {
                                    return message.reply(`<a:crossred:939238440359321600> **Unable to remove the Bot from the Hosting the Bot:** ${bot.user} | ${bot.user.tag} (\`${bot.user.id}\`)`)
                                }
                            }, 300)
                        }).on('data', (data) => {
                            showdata += data + "\n";
                        }).stderr.on('data', (data) => {
                            showdata += "{ERROR}  ::  " + data.split("\n").join("\n{ERROR}  ::  ") + "\n";
                        });
                    });
                }).connect({
                    host: theserver,
                    port: 22,
                    username: usernames[server],
                    password: passwords[server]
                });
            } catch (e) {
                console.log(e.stack ? String(e.stack).grey : String(e).grey)
                return message.reply("<a:crossred:939238440359321600> There is no detail Data about this Bot :c")
            }
        } 
        
        else if (cmd === "startbot") {
            if (message.member.roles.highest.rawPosition < message.guild.roles.cache.get(Roles.AdminRoleId).rawPosition)
                return message.reply("<a:crossred:939238440359321600> You are not allowed to execute this Command! (Only OWNERS & Co-Owners)");
            try {
                var user;
                try {
                    user = await GetBot(message, args);
                } catch (e) {
                    console.log(e.stack ? String(e.stack).grey : String(e).grey)
                    return message.reply("ERROR:" + e)
                }
                if (!user || !user.id) return message.reply("<a:crossred:939238440359321600> Did not find the BOT ... ERROR")
                client.bots.ensure(user.id, {
                    info: "No Info available",
                    type: "Default"
                })
                let data = client.bots.get(user.id, "info");
                if (!data || data.type == "Default") throw "E";
                let server = data.split("\n")[6].split(",")[0];
                let path = data.split("\n")[2];
                let BotFileName = path.split("/")[path.split("/").length - 1]
                let {
                    servers,
                    usernames,
                    passwords
                } = client.config;
                let theserver = servers[server];
                if(!theserver) return message.reply("<a:crossred:939238440359321600> Could not find the Server");
                let alldata = false;
                const conn = new Client();
                conn.on('ready', () => {
                    conn.exec(`pm2 list | grep '${BotFileName}' --ignore-case`, (err, stream) => {
                        if (err) throw err;
                        let showdata = "";
                        stream.on('close', (code, signal) => {
                            setTimeout(()=>{
                                if(!showdata || showdata.length < 2) return message.reply("<a:crossred:939238440359321600> **Could not find the Bot as a hosted bot!**");
                                if(showdata.includes("online")) return message.reply("<a:crossred:939238440359321600> **This Bot is already started/online!**");
                                if(showdata.includes("errored")) return message.reply("<a:crossred:939238440359321600> **This Bot has got an error while hosting!**");
                                alldata = showdata.split(" ")[1]
                                if(alldata){
                                    let botid = parseInt(alldata);

                                    logAction(client, "botmanagement", message.author, `GREEN`, `https://cdn.discordapp.com/emojis/862306785007632385.png`, `👍 **Started the Bot:** ${user} | ${user.tag} (\`${user.id}\`)\n**Path:** \`${path}\`\n**Host:** \`${server}\``)
                                    
                                    conn.exec(`pm2 start ${botid}`, (err, stream) => {
                                        if (err) throw err;
                                        stream.on('close', (code, signal) => {
                                            setTimeout(() => {
                                                conn.exec("pm2 save", (err, stream) => {
                                                    stream.on('close', (code, signal) => {
                                                        message.reply(`👍 **Started the Bot:** ${user} | ${user.tag} (\`${user.id}\`)\n**Path:** \`${path}\`\n**Host:** \`${server}\``)
                                                        conn.end();
                                                    }).on('data', (data) => {
                                                    }).stderr.on('data', (data) => {
                                                        if(data && data.toString().length > 2) {
                                                            console.log(data.toString());
                                                            message.reply(`<a:crossred:939238440359321600> **Something went wrong!**\n\`\`\`${data.toString().substr(0, 1800)}\`\`\``)
                                                        }
                                                    });
                                                })
                                            })
                                        }).on('data', (data) => {
                                        }).stderr.on('data', (data) => {
                                            if(data && data.toString().length > 2) {
                                                console.log(data.toString());
                                                message.reply(`<a:crossred:939238440359321600> **Something went wrong!**\n\`\`\`${data.toString().substr(0, 1800)}\`\`\``)
                                            }
                                        });
                                    });
                                } else {
                                    return message.reply(`<a:crossred:939238440359321600> **Unable to Start the Bot:** ${bot.user} | ${bot.user.tag} (\`${bot.user.id}\`)`)
                                }
                            }, 300)
                        }).on('data', (data) => {
                            showdata += data + "\n";
                        }).stderr.on('data', (data) => {
                            showdata += "{ERROR}  ::  " + data.split("\n").join("\n{ERROR}  ::  ") + "\n";
                        });
                    });
                }).connect({
                    host: theserver,
                    port: 22,
                    username: usernames[server],
                    password: passwords[server]
                });
            } catch (e) {
                console.log(e.stack ? String(e.stack).grey : String(e).grey)
                return message.reply("<a:crossred:939238440359321600> There is no detail Data about this Bot :c")
            }
        } else if (cmd === "forcestartbot") {
            if (message.member.roles.highest.rawPosition < message.guild.roles.cache.get(Roles.CoOwnerRoleId).rawPosition)
                return message.reply("<a:crossred:939238440359321600> You are not allowed to execute this Command! (Only OWNERS)");
            try {
                var user;
                try {
                    user = await GetBot(message, args);
                } catch (e) {
                    console.log(e.stack ? String(e.stack).grey : String(e).grey)
                    return message.reply("ERROR:" + e)
                }
                if (!user || !user.id) return message.reply("<a:crossred:939238440359321600> Did not find the BOT ... ERROR")
                client.bots.ensure(user.id, {
                    info: "No Info available",
                    type: "Default"
                })
                let data = client.bots.get(user.id, "info");
                console.log(data)
                if (!data || data.type == "Default") throw "E";
                let server = data.split("\n")[6].split(",")[0];
                let path = data.split("\n")[2];
                let BotFileName = path.split("/")[path.split("/").length - 1]
                let {
                    servers,
                    usernames,
                    passwords
                } = client.config;
                let theserver = servers[server];
                if(!theserver) return message.reply("<a:crossred:939238440359321600> Could not find the Server");
                let alldata = false;
                const conn = new Client();
                conn.on('ready', () => {
                    conn.exec(`pm2 list | grep ${BotFileName}' --ignore-case`, (err, stream) => {
                        if (err) throw err;
                        let showdata = "";
                        stream.on('close', (code, signal) => {
                            setTimeout(()=>{
                                if(!showdata || showdata.length < 2) return message.reply("<a:crossred:939238440359321600> **Could not find the Bot as a hosted bot!**");
                                //if(showdata.includes("online")) return message.reply("<a:crossred:939238440359321600> **This Bot is already started/online!**");
                                //if(showdata.includes("errored")) return message.reply("<a:crossred:939238440359321600> **This Bot has got an error while hosting!**");
                                alldata = showdata.split(" ")[1]
                                if(alldata){
                                    let botid = parseInt(alldata);

                                    logAction(client, "botmanagement", message.author, `GREEN`, `https://cdn.discordapp.com/emojis/862306785007632385.png`, `👍 **Force-Started the Bot:** ${user} | ${user.tag} (\`${user.id}\`)\n**Path:** \`${path}\`\n**Host:** \`${server}\``)
                                    
                                    conn.exec(`pm2 start ${botid}`, (err, stream) => {
                                        if (err) throw err;
                                        stream.on('close', (code, signal) => {
                                            setTimeout(() => {
                                                conn.exec("pm2 save", (err, stream) => {
                                                    stream.on('close', (code, signal) => {
                                                        message.reply(`👍 **Force-Started the Bot:** ${user} | ${user.tag} (\`${user.id}\`)\n**Path:** \`${path}\`\n**Host:** \`${server}\``)
                                                        conn.end();
                                                    }).on('data', (data) => {
                                                    }).stderr.on('data', (data) => {
                                                        if(data && data.toString().length > 2) {
                                                            console.log(data.toString());
                                                            message.reply(`<a:crossred:939238440359321600> **Something went wrong!**\n\`\`\`${data.toString().substr(0, 1800)}\`\`\``)
                                                        }
                                                    });
                                                })
                                            })
                                        }).on('data', (data) => {
                                        }).stderr.on('data', (data) => {
                                            if(data && data.toString().length > 2) {
                                                console.log(data.toString());
                                                message.reply(`<a:crossred:939238440359321600> **Something went wrong!**\n\`\`\`${data.toString().substr(0, 1800)}\`\`\``)
                                            }
                                        });
                                    });
                                } else {
                                    return message.reply(`<a:crossred:939238440359321600> **Unable to Force-Start the Bot:** ${bot.user} | ${bot.user.tag} (\`${bot.user.id}\`)`)
                                }
                            }, 300)
                        }).on('data', (data) => {
                            showdata += data + "\n";
                        }).stderr.on('data', (data) => {
                            showdata += "{ERROR}  ::  " + data.split("\n").join("\n{ERROR}  ::  ") + "\n";
                        });
                    });
                }).connect({
                    host: theserver,
                    port: 22,
                    username: usernames[server],
                    password: passwords[server]
                });
            } catch (e) {
                console.log(e.stack ? String(e.stack).grey : String(e).grey)
                return message.reply("<a:crossred:939238440359321600> There is no detail Data about this Bot :c")
            }
        } else if (cmd === "restartbot") {
            if (message.member.roles.highest.rawPosition < message.guild.roles.cache.get(Roles.AdminRoleId).rawPosition)
                return message.reply("<a:crossred:939238440359321600> You are not allowed to execute this Command! (Only OWNERS & Co-Owners)");
            try {
                var user;
                try {
                    user = await GetBot(message, args);
                } catch (e) {
                    console.log(e.stack ? String(e.stack).grey : String(e).grey)
                    return message.reply("ERROR:" + e)
                }
                if (!user || !user.id) return message.reply("<a:crossred:939238440359321600> Did not find the BOT ... ERROR")
                client.bots.ensure(user.id, {
                    info: "No Info available",
                    type: "Default"
                })
                let data = client.bots.get(user.id, "info");
                if (!data || data.type == "Default") throw "E";
                let server = data.split("\n")[6].split(",")[0];
                let path = data.split("\n")[2];
                let BotFileName = path.split("/")[path.split("/").length - 1]
                let {
                    servers,
                    usernames,
                    passwords
                } = client.config;
                let theserver = servers[server];
                if(!theserver) return message.reply("<a:crossred:939238440359321600> Could not find the Server");
                let alldata = false;
                const conn = new Client();
                conn.on('ready', () => {
                    conn.exec(`pm2 list | grep '${BotFileName}' --ignore-case`, (err, stream) => {
                        if (err) throw err;
                        let showdata = "";
                        stream.on('close', (code, signal) => {
                            setTimeout(()=>{
                                if(!showdata || showdata.length < 2) return message.reply("<a:crossred:939238440359321600> **Could not find the Bot as a hosted bot!**");
                                if(!showdata.includes("online")) return message.reply("<a:crossred:939238440359321600> **This Bot is not started/online!**");
                                if(showdata.includes("errored")) return message.reply("<a:crossred:939238440359321600> **This Bot has got an error while hosting!**");
                                alldata = showdata.split(" ")[1]
                                if(alldata){
                                    let botid = parseInt(alldata);

                                    logAction(client, "botmanagement", message.author, `BLURPLE`, `https://cdn.discordapp.com/emojis/870013191965519942.png`, `👍 **Re-Started the Bot:** ${user} | ${user.tag} (\`${user.id}\`)\n**Path:** \`${path}\`\n**Host:** \`${server}\``)
                                    
                                    conn.exec(`pm2 restart ${botid}`, (err, stream) => {
                                        if (err) throw err;
                                        stream.on('close', (code, signal) => {
                                            setTimeout(() => {
                                                conn.exec("pm2 save", (err, stream) => {
                                                    stream.on('close', (code, signal) => {
                                                        message.reply(`👍 **Re-Started the Bot:** ${user} | ${user.tag} (\`${user.id}\`)\n**Path:** \`${path}\`\n**Host:** \`${server}\``)
                                                        conn.end();
                                                    }).on('data', (data) => {
                                                    }).stderr.on('data', (data) => {
                                                        if(data && data.toString().length > 2) {
                                                            console.log(data.toString());
                                                            message.reply(`<a:crossred:939238440359321600> **Something went wrong!**\n\`\`\`${data.toString().substr(0, 1800)}\`\`\``)
                                                        }
                                                    });
                                                })
                                            })
                                        }).on('data', (data) => {
                                        }).stderr.on('data', (data) => {
                                            if(data && data.toString().length > 2) {
                                                console.log(data.toString());
                                                message.reply(`<a:crossred:939238440359321600> **Something went wrong!**\n\`\`\`${data.toString().substr(0, 1800)}\`\`\``)
                                            }
                                        });
                                    });
                                } else {
                                    return message.reply(`<a:crossred:939238440359321600> **Unable to Re-Start the Bot:** ${bot.user} | ${bot.user.tag} (\`${bot.user.id}\`)`)
                                }
                            }, 300)
                        }).on('data', (data) => {
                            showdata += data + "\n";
                        }).stderr.on('data', (data) => {
                            showdata += "{ERROR}  ::  " + data.split("\n").join("\n{ERROR}  ::  ") + "\n";
                        });
                    });
                }).connect({
                    host: theserver,
                    port: 22,
                    username: usernames[server],
                    password: passwords[server]
                });
            } catch (e) {
                console.log(e.stack ? String(e.stack).grey : String(e).grey)
                return message.reply("<a:crossred:939238440359321600> There is no detail Data about this Bot :c")
            }
        } else if (cmd === "forcerestartbot") {
            if (message.member.roles.highest.rawPosition < message.guild.roles.cache.get(Roles.CoOwnerRoleId).rawPosition)
                return message.reply("<a:crossred:939238440359321600> You are not allowed to execute this Command! (Only OWNERS)");
            try {
                var user;
                try {
                    user = await GetBot(message, args);
                } catch (e) {
                    console.log(e.stack ? String(e.stack).grey : String(e).grey)
                    return message.reply("ERROR:" + e)
                }
                if (!user || !user.id) return message.reply("<a:crossred:939238440359321600> Did not find the BOT ... ERROR")
                client.bots.ensure(user.id, {
                    info: "No Info available",
                    type: "Default"
                })
                let data = client.bots.get(user.id, "info");
                if (!data || data.type == "Default") throw "E";
                let server = data.split("\n")[6].split(",")[0];
                let path = data.split("\n")[2];
                let BotFileName = path.split("/")[path.split("/").length - 1]
                let {
                    servers,
                    usernames,
                    passwords
                } = client.config;
                let theserver = servers[server];
                if(!theserver) return message.reply("<a:crossred:939238440359321600> Could not find the Server");
                let alldata = false;
                const conn = new Client();
                conn.on('ready', () => {
                    conn.exec(`pm2 list | grep '${BotFileName}' --ignore-case`, (err, stream) => {
                        if (err) throw err;
                        let showdata = "";
                        stream.on('close', (code, signal) => {
                            setTimeout(()=>{
                                if(!showdata || showdata.length < 2) return message.reply("<a:crossred:939238440359321600> **Could not find the Bot as a hosted bot!**");
                                //if(!showdata.includes("online")) return message.reply("<a:crossred:939238440359321600> **This Bot is not started/online!**");
                                //if(showdata.includes("errored")) return message.reply("<a:crossred:939238440359321600> **This Bot has got an error while hosting!**");
                                alldata = showdata.split(" ")[1]
                                if(alldata){
                                    let botid = parseInt(alldata);

                                    logAction(client, "botmanagement", message.author, `BLURPLE`, `https://cdn.discordapp.com/emojis/870013191965519942.png`, `👍 **Force-Re-Started the Bot:** ${user} | ${user.tag} (\`${user.id}\`)\n**Path:** \`${path}\`\n**Host:** \`${server}\``)
                                    
                                    conn.exec(`pm2 restart ${botid}`, (err, stream) => {
                                        if (err) throw err;
                                        stream.on('close', (code, signal) => {
                                            setTimeout(() => {
                                                conn.exec("pm2 save", (err, stream) => {
                                                    stream.on('close', (code, signal) => {
                                                        message.reply(`👍 **Force-Re-Started the Bot:** ${user} | ${user.tag} (\`${user.id}\`)\n**Path:** \`${path}\`\n**Host:** \`${server}\``)
                                                        conn.end();
                                                    }).on('data', (data) => {
                                                    }).stderr.on('data', (data) => {
                                                        if(data && data.toString().length > 2) {
                                                            console.log(data.toString());
                                                            message.reply(`<a:crossred:939238440359321600> **Something went wrong!**\n\`\`\`${data.toString().substr(0, 1800)}\`\`\``)
                                                        }
                                                    });
                                                })
                                            })
                                        }).on('data', (data) => {
                                        }).stderr.on('data', (data) => {
                                            if(data && data.toString().length > 2) {
                                                console.log(data.toString());
                                                message.reply(`<a:crossred:939238440359321600> **Something went wrong!**\n\`\`\`${data.toString().substr(0, 1800)}\`\`\``)
                                            }
                                        });
                                    });
                                } else {
                                    return message.reply(`<a:crossred:939238440359321600> **Unable to Force-Re-Start the Bot:** ${bot.user} | ${bot.user.tag} (\`${bot.user.id}\`)`)
                                }
                            }, 300)
                        }).on('data', (data) => {
                            showdata += data + "\n";
                        }).stderr.on('data', (data) => {
                            showdata += "{ERROR}  ::  " + data.split("\n").join("\n{ERROR}  ::  ") + "\n";
                        });
                    });
                }).connect({
                    host: theserver,
                    port: 22,
                    username: usernames[server],
                    password: passwords[server]
                });
            } catch (e) {
                console.log(e.stack ? String(e.stack).grey : String(e).grey)
                return message.reply("<a:crossred:939238440359321600> There is no detail Data about this Bot :c")
            }
        } else if (cmd === "stopbot") {
            if (message.member.roles.highest.rawPosition < message.guild.roles.cache.get(Roles.AdminRoleId).rawPosition)
                return message.reply("<a:crossred:939238440359321600> You are not allowed to execute this Command! (Only OWNERS & Co-Owners)");
            try {
                var user;
                try {
                    user = await GetBot(message, args);
                } catch (e) {
                    console.log(e.stack ? String(e.stack).grey : String(e).grey)
                    return message.reply("ERROR:" + e)
                }
                if (!user || !user.id) return message.reply("<a:crossred:939238440359321600> Did not find the BOT ... ERROR")
                client.bots.ensure(user.id, {
                    info: "No Info available",
                    type: "Default"
                })
                let data = client.bots.get(user.id, "info");
                if (!data || data.type == "Default") throw "E";
                let server = data.split("\n")[6].split(",")[0];
                let path = data.split("\n")[2];
                let BotFileName = path.split("/")[path.split("/").length - 1]
                let {
                    servers,
                    usernames,
                    passwords
                } = client.config;
                let theserver = servers[server];
                if(!theserver) return message.reply("<a:crossred:939238440359321600> Could not find the Server");
                let alldata = false;
                const conn = new Client();
                conn.on('ready', () => {
                    conn.exec(`pm2 list | grep '${BotFileName}' --ignore-case`, (err, stream) => {
                        if (err) throw err;
                        let showdata = "";
                        stream.on('close', (code, signal) => {
                            setTimeout(()=>{
                                if(!showdata || showdata.length < 2) return message.reply("<a:crossred:939238440359321600> **Could not find the Bot as a hosted bot!**");
                                if(showdata.includes("stopped")) return message.reply("<a:crossred:939238440359321600> **This Bot is already stopped!**");
                                if(showdata.includes("errored")) return message.reply("<a:crossred:939238440359321600> **This Bot has got an error while hosting!**");
                                alldata = showdata.split(" ")[1]
                                if(alldata){
                                    let botid = parseInt(alldata)

                                    logAction(client, "botmanagement", message.author, `#00001`, `https://cdn.discordapp.com/emojis/862306785133592636.png`, `👍 **Stopped the Bot:** ${user} | ${user.tag} (\`${user.id}\`)\n**Path:** \`${path}\`\n**Host:** \`${server}\``)
                                    
                                    conn.exec(`pm2 stop ${botid}`, (err, stream) => {
                                        if (err) throw err;
                                        stream.on('close', (code, signal) => {
                                            setTimeout(() => {
                                                conn.exec("pm2 save", (err, stream) => {
                                                    stream.on('close', (code, signal) => {
                                                        message.reply(`👍 **Stopped the Bot:** ${user} | ${user.tag} (\`${user.id}\`)\n**Path:** \`${path}\`\n**Host:** \`${server}\``)
                                                        conn.end();
                                                    }).on('data', (data) => {
                                                    }).stderr.on('data', (data) => {
                                                        if(data && data.toString().length > 2) {
                                                            console.log(data.toString());
                                                            message.reply(`<a:crossred:939238440359321600> **Something went wrong!**\n\`\`\`${data.toString().substr(0, 1800)}\`\`\``)
                                                        }
                                                    });
                                                })
                                            })
                                        }).on('data', (data) => {
                                        }).stderr.on('data', (data) => {
                                            if(data && data.toString().length > 2) {
                                                console.log(data.toString());
                                                message.reply(`<a:crossred:939238440359321600> **Something went wrong!**\n\`\`\`${data.toString().substr(0, 1800)}\`\`\``)
                                            }
                                        });
                                    });
                                } else {
                                    return message.reply(`<a:crossred:939238440359321600> **Unable to Stop the Bot:** ${bot.user} | ${bot.user.tag} (\`${bot.user.id}\`)`)
                                }
                            }, 300)
                        }).on('data', (data) => {
                            showdata += data + "\n";
                        }).stderr.on('data', (data) => {
                            showdata += "{ERROR}  ::  " + data.split("\n").join("\n{ERROR}  ::  ") + "\n";
                        });
                    });
                }).connect({
                    host: theserver,
                    port: 22,
                    username: usernames[server],
                    password: passwords[server]
                });
            } catch (e) {
                console.log(e.stack ? String(e.stack).grey : String(e).grey)
                return message.reply("<a:crossred:939238440359321600> There is no detail Data about this Bot :c")
            }
        } else if (cmd === "forcestopbot") {
            if (message.member.roles.highest.rawPosition < message.guild.roles.cache.get(Roles.CoOwnerRoleId).rawPosition)
                return message.reply("<a:crossred:939238440359321600> You are not allowed to execute this Command! (Only OWNERS)");
            try {
                var user;
                try {
                    user = await GetBot(message, args);
                } catch (e) {
                    console.log(e.stack ? String(e.stack).grey : String(e).grey)
                    return message.reply("ERROR:" + e)
                }
                if (!user || !user.id) return message.reply("<a:crossred:939238440359321600> Did not find the BOT ... ERROR")
                client.bots.ensure(user.id, {
                    info: "No Info available",
                    type: "Default"
                })
                let data = client.bots.get(user.id, "info");
                if (!data || data.type == "Default") throw "E";
                let server = data.split("\n")[6].split(",")[0];
                let path = data.split("\n")[2];
                let BotFileName = path.split("/")[path.split("/").length - 1]
                let {
                    servers,
                    usernames,
                    passwords
                } = client.config;
                let theserver = servers[server];
                if(!theserver) return message.reply("<a:crossred:939238440359321600> Could not find the Server");
                let alldata = false;
                const conn = new Client();
                conn.on('ready', () => {
                    conn.exec(`pm2 list | grep '${BotFileName}' --ignore-case`, (err, stream) => {
                        if (err) throw err;
                        let showdata = "";
                        stream.on('close', (code, signal) => {
                            setTimeout(()=>{
                                if(!showdata || showdata.length < 2) return message.reply("<a:crossred:939238440359321600> **Could not find the Bot as a hosted bot!**");
                                //if(showdata.includes("stopped")) return message.reply("<a:crossred:939238440359321600> **This Bot is already stopped!**");
                                //if(showdata.includes("errored")) return message.reply("<a:crossred:939238440359321600> **This Bot has got an error while hosting!**");
                                alldata = showdata.split(" ")[1]
                                if(alldata){
                                    let botid = parseInt(alldata)

                                    logAction(client, "botmanagement", message.author, `#00001`, `https://cdn.discordapp.com/emojis/862306785133592636.png`, `👍 **Force-Stopped the Bot:** ${user} | ${user.tag} (\`${user.id}\`)\n**Path:** \`${path}\`\n**Host:** \`${server}\``)
                                    
                                    conn.exec(`pm2 stop ${botid}`, (err, stream) => {
                                        if (err) throw err;
                                        stream.on('close', (code, signal) => {
                                            setTimeout(() => {
                                                conn.exec("pm2 save", (err, stream) => {
                                                    stream.on('close', (code, signal) => {
                                                        message.reply(`👍 **Force-Stopped the Bot:** ${user} | ${user.tag} (\`${user.id}\`)\n**Path:** \`${path}\`\n**Host:** \`${server}\``)
                                                        conn.end();
                                                    }).on('data', (data) => {
                                                    }).stderr.on('data', (data) => {
                                                        if(data && data.toString().length > 2) {
                                                            console.log(data.toString());
                                                            message.reply(`<a:crossred:939238440359321600> **Something went wrong!**\n\`\`\`${data.toString().substr(0, 1800)}\`\`\``)
                                                        }
                                                    });
                                                })
                                            })
                                        }).on('data', (data) => {
                                        }).stderr.on('data', (data) => {
                                            if(data && data.toString().length > 2) {
                                                console.log(data.toString());
                                                message.reply(`<a:crossred:939238440359321600> **Something went wrong!**\n\`\`\`${data.toString().substr(0, 1800)}\`\`\``)
                                            }
                                        });
                                    });
                                } else {
                                    return message.reply(`<a:crossred:939238440359321600> **Unable to Force-Stop the Bot:** ${bot.user} | ${bot.user.tag} (\`${bot.user.id}\`)`)
                                }
                            }, 300)
                        }).on('data', (data) => {
                            showdata += data + "\n";
                        }).stderr.on('data', (data) => {
                            showdata += "{ERROR}  ::  " + data.split("\n").join("\n{ERROR}  ::  ") + "\n";
                        });
                    });
                }).connect({
                    host: theserver,
                    port: 22,
                    username: usernames[server],
                    password: passwords[server]
                });
            } catch (e) {
                console.log(e.stack ? String(e.stack).grey : String(e).grey)
                return message.reply("<a:crossred:939238440359321600> There is no detail Data about this Bot :c")
            }
        } 
        
        /**
         * OWNER BOT DATABASING COMMANDS
         */
        else if (cmd === "bots") {
            var user;
            try {
                user = await GetUser(message, args);
            } catch (e) {
                return message.reply(e)
            }
            if (!user || !user.id) return message.reply("<a:crossred:939238440359321600> Did not find the User ... ERROR")
            client.bots.ensure(user.id, {
                bots: []
            })
            var bots = client.bots.get(user.id, "bots")
            message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                    .setColor(client.config.color)
                    .setAuthor(`${user.username}'s Bots`, user.displayAvatarURL({
                        dynamic: true
                    }), "https://kooje.eu")
                    .setDescription(bots.length > 0 ? bots.map(bot => `**${client.bots.get(bot, "type")}** | <@${bot}> | [Invite](https://discord.com/oauth2/authorize?client_id=${bot}&scope=bot&permissions=8)`).join("\n") : "He has no Bots yet!")
                    .setTimestamp()
                ]
            })
        } else if (cmd === "botdetails" || cmd === "botdetail" || cmd == "botinfo") {
            try {
                var user;
                try {
                    user = await GetBot(message, args);
                } catch (e) {
                    console.log(e.stack ? String(e.stack).grey : String(e).grey)
                    return message.reply("ERROR:" + e)
                }
                if (!user || !user.id) return message.reply("<a:crossred:939238440359321600> Did not find the Bot ... ERROR")
                client.bots.ensure(user.id, {
                    info: "No Info available",
                    type: "Default"
                })
                let data = client.bots.get(user.id, "info");
                if (!data) throw "E";
                if (!String(data).endsWith("`")) data += "```";
                if (!String(data).startsWith("`") && !String(data).startsWith(">")) data = "```" + data;
                message.channel.send(data);
            } catch (e) {
                console.log(e.stack ? String(e.stack).grey : String(e).grey)
                return message.reply("<a:crossred:939238440359321600> There is no detail Data about this Bot :c")
            }
        } else if (cmd === "setneworiginalbot" || cmd == "setbotdetails") {
           if (message.member.roles.highest.rawPosition < message.guild.roles.cache.get(Roles.CoOwnerRoleId).rawPosition)
           return message.reply("<a:crossred:939238440359321600> You are not allowed to execute this Command!");
           let Bot = message.mentions.members.filter(m => m.user.bot).first();
            if (!Bot) return message.reply("Usage: `,setneworiginalbot @BOT <message>`")
            client.bots.set(Bot.id, args.slice(1).join(" "), "info")
            message.channel.send("SUCCESS!")
        } else if (cmd === "owner" || cmd === "ownerof") {
            var bot;
            try {
                bot = await GetBot(message, args);
            } catch (e) {
                console.log(e.stack ? String(e.stack).grey : String(e).grey)
                return message.reply("ERROR:" + e)
            }
            if (!bot || !bot.id || !bot.bot) return message.reply("<a:crossred:939238440359321600> Did not find the BOT ... ERROR / user is not a bot")
            var userid = client.bots.findKey(valu => valu.bots?.includes(bot.id))
            if (!userid) return message.reply("<a:crossred:939238440359321600> **No one Owns this Bot yet!**")
            var user = await client.users.fetch(userid).catch(() => {})
            if (!user) return message.reply(`<a:crossred:939238440359321600> **Could not find the User of this Bot in here ... this is his/her ID: \`${userid}\`**`)
            client.bots.ensure(user.id, {
                bots: []
            })
            var bots = client.bots.get(user.id, "bots")
            let embed = new Discord.MessageEmbed()
                .setColor(client.config.color)
                .setAuthor(`${user.username} owns this bot and: `, user.displayAvatarURL({
                    dynamic: true
                }), "https://kooje.eu")
                .setDescription(bots.length > 0 ? bots.map(bot => `**${client.bots.get(bot, "type")}** | <@${bot}> | [Invite](https://discord.com/oauth2/authorize?client_id=${bot}&scope=bot&permissions=8)`).join("\n") : "He has no Bots yet!")
                .setTimestamp().setFooter("ID: " + user.id, user.displayAvatarURL({
                    dynamic: true
                }));
            message.reply({
                content: "OWNER INFORMATION",
                embeds: [embed]
            })
        } else if (cmd === "addbot") {
            if (message.member.roles.highest.rawPosition < message.guild.roles.cache.get(Roles.ChiefBotCreatorRoleId).rawPosition) return message.reply("You are not allowed to execute that Command!")
            var user;
            try {
                user = await GetUser(message, args);
            } catch (e) {
                return message.reply(e)
            }
            if (!user || !user.id) return message.reply("<a:crossred:939238440359321600> Did not find the USER ... ERROR | Usage: `,addbot @USER @BOT BOTTYPE`")
            var bot = message.mentions.users.last();
            if (!bot || !bot.id || !bot.bot) return message.reply("<a:crossred:939238440359321600> Did not find the Bot ... ERROR / Pinged User is not a BOT | Usage: `,addbot @USER @BOT BOTTYPE`")
            if (!args[2]) return message.reply("<a:crossred:939238440359321600> You forgot to add the BOTTYPE (System Bot, Waitingroom Bot ....) | Usage: `,addbot @USER @BOT BOTTYPE`")
            client.bots.ensure(user.id, {
                bots: []
            })

            //if (client.bots.get(user.id, "bots").includes(bot.id)) return message.reply("<a:crossred:939238440359321600> He already has that bot!")
            client.bots.set(bot.id, args.slice(2).join(" "), "type")
            var bots = client.bots.push(user.id, bot.id, "bots")

            message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                    .setColor(client.config.color)
                    .setAuthor(`SUCCESS!`, user.displayAvatarURL({
                        dynamic: true
                    }), "https://kooje.eu")
                    .setDescription(`Added: <@${bot.id}> | [Invite](https://discord.com/oauth2/authorize?client_id=${bot.id}&scope=bot&permissions=8) to <@${user.id}>`)
                    .setTimestamp()
                ]
            })
        } else if (cmd === "changebot") {
            if (message.member.roles.highest.rawPosition < message.guild.roles.cache.get(Roles.ChiefBotCreatorRoleId).rawPosition) return message.reply("You are not allowed to execute that Command!")
            var user;
            try {
                user = await GetUser(message, args);
            } catch (e) {
                return message.reply(e)
            }
            if (!user || !user.id) return message.reply("<a:crossred:939238440359321600> Did not find the USER ... ERROR | Usage: `,changebot @USER @BOT BOTTYPE`")
            var bot = message.mentions.users.last();
            if (!bot || !bot.id || !bot.bot) return message.reply("<a:crossred:939238440359321600> Did not find the Bot ... ERROR / Pinged User is not a BOT | Usage: `,changebot @USER @BOT BOTTYPE`")
            if (!args[2]) return message.reply("<a:crossred:939238440359321600> You forgot to add the BOTTYPE (System Bot, Waitingroom Bot ....) | Usage: `,changebot @USER @BOT BOTTYPE`")
            client.bots.ensure(user.id, {
                bots: []
            })
            var olduser = false;
            try {
                var userid = client.bots.findKey(valu => valu.bots?.includes(bot.id))
                olduser = await client.users.fetch(userid)
                client.bots.ensure(olduser.id, {
                    bots: []
                })
                client.bots.remove(olduser.id, bot.id, "bots")
            } catch (E) {
                olduser = false;
                client.bots.ensure(user.id, {
                    bots: []
                })
            }

            client.bots.set(bot.id, args.slice(2).join(" "), "type")
            var bots = client.bots.push(user.id, bot.id, "bots")

            message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                    .setColor(client.config.color)
                    .setAuthor(`SUCCESS!`, user.displayAvatarURL({
                        dynamic: true
                    }), "https://kooje.eu")
                    .setDescription(`Changed: <@${bot.id}> | [Invite](https://discord.com/oauth2/authorize?client_id=${bot.id}&scope=bot&permissions=8) to <@${user.id}> ${olduser ? olduser.id != user.id ? `from <@${olduser.id}>` : "" : ""}`)
                    .setTimestamp()
                ]
            })
        } else if (cmd === "removebot") {
            if (message.member.roles.highest.rawPosition < message.guild.roles.cache.get(Roles.ChiefBotCreatorRoleId).rawPosition) return message.reply("You are not allowed to execute that Command!")
            var user;
            try {
                user = await GetUser(message, args);
            } catch (e) {
                return message.reply(e)
            }
            if (!user || !user.id) return message.reply("<a:crossred:939238440359321600> Did not find the Bot ... ERROR | Usage: `,removebot @USER @BOT`")
            var bot = message.mentions.users.last();
            if (!bot || !bot.id || !bot.bot) return message.reply("<a:crossred:939238440359321600> Did not find the Bot ... ERROR / Pinged User is not a BOT | Usage: `,removebot @USER @BOT`")
            client.bots.ensure(user.id, {
                bots: []
            })
            if (!client.bots.get(user.id, "bots").includes(bot.id)) return message.reply("<a:crossred:939238440359321600> He does not have that bot yet!")
            var bots = client.bots.remove(user.id, bot.id, "bots")

            message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                    .setColor(client.config.color)
                    .setAuthor(`SUCCESS!`, user.displayAvatarURL({
                        dynamic: true
                    }), "https://kooje.eu")
                    .setDescription(`Removed: <@${bot.id}> from <@${user.id}>`)
                    .setTimestamp()
                ]
            })
        } 
        
        /**
         * INFORMATION COMMANDS
         */
        else if (cmd === "howtoorder") {
            message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                    .setColor(client.config.color)
                    .setAuthor("Kooje | Bot Shop | How to Order", message.guild.iconURL({dynamic: true}), "https://kooje.eu")
                    .setDescription(`***1.*** Read throug the channel in <#936392309065523221>\n\n***2.*** React to the message of <@938176229918531604> with the right Emoji\n\n***3.*** Answer the Questions in the Ticket\n\n***4.*** Wait a few Minutes :wink:`)
.setFooter({text: `KooJe.eu | Order Bots NOW`, iconURL:  "https://cdn.discordapp.com/attachments/936985190016897055/938497637060079706/LogoKooJE.png"})
                ]
            })
        } else if (cmd === "modifybot") {
            message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                    .setColor(client.config.color)
                    .setAuthor("How to Change your Bot?", message.guild.iconURL({dynamic: true}), "https://kooje.eu")
                    .setDescription(`**There are several options:**\n> To change the Embed Design, you need to use the command\n> \`!setup-embed\`\n\n> To change the Avatar, Name, etc. you need to use the:\n> \`changename\`, \`changeavatar\`, \`changestatus\`, \`prefix\``)
.setFooter({text: `KooJe.eu | Order Bots NOW`, iconURL:  "https://cdn.discordapp.com/attachments/936985190016897055/938497637060079706/LogoKooJE.png"})
                ]
            })
        } else if (cmd === "sendmessage") {
            message.reply({
                content: `This embed can be created via this Command: \`\`\`,embed To send a message there are several options!++All available Commands:\n\`embed\`, \`esay\`, \`say\`, \`imgembed\`, \`image\`\n\nYou always need to add Paramters, for example the embed: \`embed TITLE ++ DESCRIPTION\` it is important to add the "++"!\nthe esay: \`esay TEXT\`\n\n**You can also edit, copy and update messages with**\n\`editembed <ID>++<TITLE>++<DESCRIPTION>\`\n\`editimgembed <ID>++<TITLE>++<IMG-LINK>++<DESCRIPTION>\`\n\`updatemessage #chat <ID>\`\n\`copymessage #chat <ID>\`!\`\`\``,
                embeds: [new Discord.MessageEmbed()
                    .setColor(client.config.color)
                    .setTitle("To send a message there are several options!")
                    .setDescription(`All available Commands:\n\`embed\`, \`esay\`, \`say\`, \`imgembed\`, \`image\`\n\nYou always need to add Paramters, for example the embed: \`embed TITLE ++ DESCRIPTION\` it is important to add the "++"!\nthe esay: \`esay TEXT\`\n\n**You can also edit, copy and update messages with**\n\`editembed <ID>++<TITLE>++<DESCRIPTION>\`\n\`editimgembed <ID>++<TITLE>++<IMG-LINK>++<DESCRIPTION>\`\n\`updatemessage #chat <ID>\`\n\`copymessage #chat <ID>\`!`)
.setFooter({text: `KooJe.eu | Order Bots NOW`, iconURL:  "https://cdn.discordapp.com/attachments/936985190016897055/938497637060079706/LogoKooJE.png"})
                ]
            })
        } else if (cmd === "translate" || cmd === "tr") {
            if (!args[0]) return message.channel.send("<a:crossred:939238440359321600> Error | Unknown Command Usage! `,translate <from> <to> <Text>`\nExample: `,translate en de Hello World`")

            if (!args[1]) return message.channel.send("<a:crossred:939238440359321600> Error | Unknown Command Usage! `,translate <from> <to> <Text>`\nExample: `translate en de Hello World`")

            if (!args[2]) return message.channel.send("<a:crossred:939238440359321600> Error | Unknown Command Usage! `,translate <from> <to> <Text>`\nExample: `,translate en de Hello World`")

            translate(args.slice(2).join(" "), {
                from: args[0],
                to: args[1]
            }).then(res => {
                let embed = new Discord.MessageEmbed()
                    .setColor(client.config.color)
                    .setAuthor(`Translated to: ${args[1]}`, "https://imgur.com/0DQuCgg.png", "https://kooje.eu")
                    .setFooter(`Translated from: ${args[0]}`, message.author.displayAvatarURL({
                        dynamic: true
                    }))
                    .setDescription("```" + res.text.substr(0, 2000) + "```")
                message.channel.send({
                    embeds: [embed]
                })
            }).catch(async err => {
                let embed = new Discord.MessageEmbed()
                    .setColor(client.config.color)
                    .setTitle("<a:crossred:939238440359321600> Error | Something went wrong")
                    .setDescription(String("```" + err.stack + "```").substr(0, 2000))
                message.channel.send({
                    embeds: [embed]
                })
                console.log(err);
            });
        } else if (cmd === "ping") {
            message.reply({
                embeds: [new Discord.MessageEmbed()
                    .setColor(client.config.color)
                    .setTitle(`📶 Ping: \`${Math.round(Date.now() - message.createdTimestamp)}ms\`\n\n📶Api Latency: \`${Math.round(client.ws.ping)}ms\``),
                    new Discord.MessageEmbed()
                    .setColor(client.config.color)
                    .setTitle(`:white_check_mark: **${client.user.username}** is since ${duration(client.uptime).map(i => `\`${i}\``).join(" ")} online`)
                ]
            })
        } else if (cmd === "uptime") {
            message.reply({
                embeds: [new Discord.MessageEmbed()
                    .setColor(client.config.color)
                    .setTitle(`:white_check_mark: **${client.user.username}** is since ${duration(client.uptime).map(i => `\`${i}\``).join(" ")} online`),
                    new Discord.MessageEmbed()
                    .setColor(client.config.color)
                    .setTitle(`📶 Ping: \`${Math.round(Date.now() - message.createdTimestamp)}ms\`\n\n📶Api Latency: \`${Math.round(client.ws.ping)}ms\``)
                ]
            })
        
        } else if (cmd === "invite") {
            if (!args[0]) return message.reply({
                embeds: [new Discord.MessageEmbed().setColor(client.config.color)
                    .setFooter("Kooje | Free Bots | ORDER NOW", message.guild.iconURL({dynamic: true}))
                    .setThumbnail(message.guild.iconURL({dynamic: true}))
                    .setTitle("<a:crossred:939238440359321600> Invalid Usage")
                    .setDescription("To get the invite Link of one of your Bots simply type: `,invite @YOURBOT`\n\nExample: ,invite <@939584484431503362>\nWill give: https://discord.com/oauth2/authorize?client_id=734513783338434591&scope=bot&permissions=8\n\nWebsite Generator: https://invite.kooje.eu")
                ]
            })
            else {
                var user;
                try {
                    user = await GetBot(message, args);
                } catch (e) {
                    return message.reply("ERROR: " + e)
                }
                if (!user || !user.id) return message.reply("<a:crossred:939238440359321600> Did not find the BOT ... ERROR | Usage: `,invite @Bot` / `,invite BOT NAME` / `,invite BOT ID`")
                message.reply({
                    embeds: [new Discord.MessageEmbed()
                        .setColor(client.config.color)
                        .setAuthor(`Invite link for: ${user.tag}`, user.displayAvatarURL(), `https://discord.com/oauth2/authorize?client_id=${user.id}&scope=bot&permissions`)
                        .setThumbnail(user.displayAvatarURL())
                        .setFooter(`ID: ${user.id}`)
                        .addField("📯 Invite link: ", `> [Click here](https://discord.com/oauth2/authorize?client_id=${user.id}&scope=bot&permissions=8)\n\nGenerated through: https://invite.Kooje.eu`)
                    ]
                })
            }
        } 
        
        /**
         * DEVELOPER COMMAND
         */
        else if (cmd === "eval"){
            if(message.author.id != "717416034478456925") return message.reply("<a:crossred:939238440359321600> Only **Protyo** is allowed to execute this Command");
            const { inspect } = require(`util`);
            let evaled;
            try {
                evaled = await eval(args.join(` `));
                let string = inspect(evaled);
                message.channel.send({content :`\`\`\`\n${String(string).substr(0, 1950)}\n\`\`\``});
            } catch (e) {
                console.log(e)
                return message.channel.send({embeds :[new Discord.MessageEmbed()
                    .setColor("RED")
                    .setTitle("Something went wrong")
                    .setDescription(`\`\`\`\n${String(e.message ? e.message : e).substr(0, 1950)}\n\`\`\``)
                ]});
            }
        } 
        
        /**
         * MANAGE PAYMENT SYSTEM OF THE BOTS
         */
        else if(cmd === "removepayment"){
            if (message.member.roles.highest.rawPosition < message.guild.roles.cache.get(Roles.ChiefBotCreatorRoleId).rawPosition) {
                return message.reply("<a:crossred:939238440359321600> **You are not allowed to execute this Command!** Only FCO or higher!").then(m => m.delete({
                    timeout: 3500
                }).catch(console.error)).catch(console.error);
            }
            let bot = message.mentions.members.filter(u => u.user.bot).first() || message.guild.members.cache.get(args[0]);
            if (!bot || !bot.user || !bot.user.bot) {
                return message.reply("<a:crossred:939238440359321600> **Please ping a __BOT__**");
            }
            bot = bot.user;
            let normaldata = client.payments.get("payments", "users");
            let invitedata = client.payments.get("invitepayments", "users");
            let boostdata = client.payments.get("boostpayments", "users");
            if(normaldata.find(d => d.bot == bot.id)) client.payments.set("payments", normaldata.filter(d => d.bot !== bot.id), "users")
            if(invitedata.find(d => d.bot == bot.id)) client.payments.set("invitepayments", invitedata.filter(d => d.bot !== bot.id), "users")
            if(boostdata.find(d => d.bot == bot.id)) client.payments.set("boostpayments", boostdata.filter(d => d.bot !== bot.id), "users")
            message.reply(`**Successfully removed all Payments of <@${bot.id}> !**`);
        } else if (cmd === "paymentinfo") {
            let bot = message.mentions.members.filter(u => u.user.bot).first() || message.guild.members.cache.get(args[0]);
            if (!bot || !bot.user || !bot.user.bot) {
                return message.reply("<a:crossred:939238440359321600> **Please ping a __BOT__**");
            }
            bot = bot.user;
            let normaldata = client.payments.get("payments", "users");
            let invitedata = client.payments.get("invitepayments", "users");
            let boostdata = client.payments.get("boostpayments", "users");
            normaldata = normaldata.find(d => d.bot == bot.id);
            invitedata = invitedata.find(d => d.bot == bot.id);
            boostdata = boostdata.find(d => d.bot == bot.id);
            let userid = client.bots.findKey(v => v?.bots?.includes(bot.id));
            message.reply({
                embeds: [
                    new Discord.MessageEmbed().setColor(client.config.color)
                    .setAuthor(bot.tag, bot.displayAvatarURL())
                    .setTitle(`<:like:938142052087124008> **Payments of this Bot**`)
                    .setDescription(`Ordered by: <@${userid}>`)
                    .addField("<a:money:939201650395058237> **MONEY** Payment", `${normaldata ? `**Payed at:**\n> \`${moment(normaldata.timestamp).format("DD:MM:YYYY | HH:MM")}\`\n**Payed for:**\n> ${duration(normaldata.time).map(i => `\`${i}\``).join(", ")}\n**Next Payment in:**\n> ${duration(normaldata.time - (Date.now() - normaldata.timestamp)).map(i => `\`${i}\``).join(", ")}` : "<a:crossred:939238440359321600> **`Not payed via this Payment`**"}`)
                    .addField("<:join:938142051768348693> **INVITE** Payment", `${invitedata ? `**Payed at:**\n> \`${moment(invitedata.timestamp).format("DD:MM:YYYY | HH:MM")}\`\n**Payed for:**\n> ${duration(invitedata.time).map(i => `\`${i}\``).join(", ")}\n**Next Payment in:**\n> ${duration(invitedata.time - (Date.now() - invitedata.timestamp)).map(i => `\`${i}\``).join(", ")}` : "<a:crossred:939238440359321600> **`Not payed via this Payment`**"}`)
                    .addField("<a:boost_gif:937111627155771413> **BOOST** Payment", `${boostdata ? `**Payed at:**\n> \`${moment(boostdata.timestamp).format("DD:MM:YYYY | HH:MM")}\`\n**Payed for:**\n> ${duration(boostdata.time).map(i => `\`${i}\``).join(", ")}\n**Next Payment in:**\n> ${duration(boostdata.time - (Date.now() - boostdata.timestamp)).map(i => `\`${i}\``).join(", ")}` : "<a:crossred:939238440359321600> **`Not payed via this Payment`**"}`)
                    .setFooter(`ID: ${bot.id}`, bot.displayAvatarURL())
                ]
            });
        } else if (cmd === "payment") {
            if (message.member.roles.highest.rawPosition < message.guild.roles.cache.get(Roles.ChiefBotCreatorRoleId).rawPosition) {
                return message.reply("<a:crossred:939238440359321600> **You are not allowed to execute this Command!** Only FCO or higher!").then(m => m.delete({
                    timeout: 3500
                }).catch(console.error)).catch(console.error);
            }
            try {
                if (!args[0]) return message.reply("<a:crossred:939238440359321600> **You forgot to add a VALID TIME!**\nUsage: `,payment 30d <@USER> <@BOT>`");
                let time = ms(args[0])
                if (!time || isNaN(time)) return message.reply("<a:crossred:939238440359321600> **You forgot to add a VALID TIME!**\nUsage: `,payment 30d <@USER> <@BOT>`");
                args.shift();
                let member = message.mentions.members.filter(m => m.guild.id == message.guild.id).first() || await message.guild.members.fetch(args[0])
                if (!member || !member.user || member.user.bot) return message.reply("<a:crossred:939238440359321600> **You forgot to Ping a MEMBER**\nUsage: `,payment 30d <@USER> <@BOT>`");
                let user = member.user;
                args.shift()
                let bot = message.mentions.members.filter(m => m.guild.id == message.guild.id && m.user.bot).first() || await message.guild.members.fetch(args[0])
                if (!bot || !bot.user || !bot.user.bot) return message.reply("<a:crossred:939238440359321600> **You forgot to Ping a BOT**\nUsage: `,payment 30d <@USER> <@BOT>`");
                client.bots.ensure(bot.id, {
                    info: "No Info available",
                    type: "Default"
                })
                let data = client.bots.get(bot.id, "info");
                if (!data) return message.reply("<a:crossred:939238440359321600> **The Bot does not have botdetails yet!**\nUsage: `,payment 30d <@USER> <@BOT>`");
                if (!String(data).endsWith("`")) data += "```";
                let normaldata = client.payments.get("payments", "users");
                let invitedata = client.payments.get("invitepayments", "users");
                let boostdata = client.payments.get("boostpayments", "users");
                if(normaldata.find(d => d.bot == bot.id) || invitedata.find(d => d.bot == bot.id) || boostdata.find(d => d.bot == bot.id))
                  return message.reply("<a:crossred:939238440359321600> This bot is already payed! Use: `,removepayment <@Bot>` first!")
                client.payments.push("payments", {
                        timestamp: Date.now(),
                        time: time,
                        bot: bot.id,
                        guild: message.guild.id,
                        id: user.id,
                        data: data
                    },
                "users");
                try {
                    message.delete();
                } catch {}
                message.channel.send(`<a:check:939238439826640957> **Successfully Noted this Payment for ${duration(time).map(i => `\`${i}\``).join(" ")} until <t:${Math.floor((Date.now() + time) / 1000)}>, after that I will notify <@${user.id}> to pay for ${bot.user} again!**`);
                client.channels.fetch("939205602574467122").then(ch => {
                    ch.send(`${user} payed for ${duration(time).map(i => `\`${i}\``).join(" ")} until <t:${Math.floor((Date.now() + time) / 1000)}> for: **${client.bots.get(bot.id, "type")}** ${bot}`)
                })
            } catch (e) {
                message.channel.send(`${e.message ? e.message : e}`.substr(0, 1900), {
                    code: "js"
                })
            }
        } else if (cmd === "invitepayment") {
            if (message.member.roles.highest.rawPosition < message.guild.roles.cache.get(Roles.ChiefBotCreatorRoleId).rawPosition) {
                return message.reply("<a:crossred:939238440359321600> **You are not allowed to execute this Command!** Only FCO or higher!").then(m => m.delete({
                    timeout: 3500
                }).catch(console.error)).catch(console.error);
            }
            try {
                if (!args[0]) return message.reply("<a:crossred:939238440359321600> **You forgot to add a VALID TIME!**\nUsage: `,invitepayment 30d @USER @BOT`");
                let time = ms(args[0])
                if (!time || isNaN(time)) return message.reply("<a:crossred:939238440359321600> **You forgot to add a VALID TIME!**\nUsage: `,invitepayment 30d @USER @BOT`");
                args.shift();
                let member = message.mentions.members.filter(m => m.guild.id == message.guild.id).first() || await message.guild.members.fetch(args[0])
                if (!member || !member.user || member.user.bot) return message.reply("<a:crossred:939238440359321600> **You forgot to Ping a MEMBER**\nUsage: `,invitepayment 30d @USER @BOT`");
                let user = member.user;
                args.shift()
                let bot = message.mentions.members.filter(m => m.guild.id == message.guild.id && m.user.bot).first() || await message.guild.members.fetch(args[0])
                if (!bot || !bot.user || !bot.user.bot) return message.reply("<a:crossred:939238440359321600> **You forgot to Ping a BOT**\nUsage: `,invitepayment 30d @USER @BOT`");
                client.bots.ensure(bot.id, {
                    info: "No Info available",
                    type: "Default"
                })
                let data = client.bots.get(bot.id, "info");
                if (!data) return message.reply("<a:crossred:939238440359321600> **The Bot does not have botdetails yet!**\nUsage: `,invitepayment 30d @USER @BOT`");
                if (!String(data).endsWith("`")) data += "```";
                let normaldata = client.payments.get("payments", "users");
                let invitedata = client.payments.get("invitepayments", "users");
                let boostdata = client.payments.get("boostpayments", "users");
                if(normaldata.find(d => d.bot == bot.id) || invitedata.find(d => d.bot == bot.id) || boostdata.find(d => d.bot == bot.id))
                  return message.reply("<a:crossred:939238440359321600> This bot is already payed! Use: `,removepayment @Bot` first!")
                client.payments.push("invitepayments", {
                        timestamp: Date.now(),
                        time: time,
                        bot: bot.id,
                        guild: message.guild.id,
                        id: user.id,
                        data: data
                    },
                    "users");

                try {
                    message.delete();
                } catch {}
                message.channel.send(`<a:check:939238439826640957> **Successfully Noted this INVITEPayment for ${duration(time).map(i => `\`${i}\``).join(" ")} until <t:${Math.floor((Date.now() + time) / 1000)}>, after that I will notify <@${user.id}> to pay for ${bot.user} again!**`);
                client.channels.fetch("939205602574467122").then(ch => {
                    ch.send(`${user} invite-payed for ${duration(time).map(i => `\`${i}\``).join(" ")} until <t:${Math.floor((Date.now() + time) / 1000)}> for: **${client.bots.get(bot.id, "type")}** ${bot}`)
                })
            } catch (e) {
                message.channel.send(`${e.message ? e.message : e}`.substr(0, 1900), {
                    code: "js"
                })
            }
        } else if (cmd === "boostpayment") {
            if (message.member.roles.highest.rawPosition < message.guild.roles.cache.get(Roles.ChiefBotCreatorRoleId).rawPosition) {
                return message.reply("<a:crossred:939238440359321600> **You are not allowed to execute this Command!** Only FCO or higher!").then(m => m.delete({
                    timeout: 3500
                }).catch(console.error)).catch(console.error);
            }
            try {
                if (!args[0]) return message.reply("<a:crossred:939238440359321600> **You forgot to add a VALID TIME!**\nUsage: `,invitepayment 30d @USER @BOT`");
                let time = ms(args[0])
                if (!time || isNaN(time)) return message.reply("<a:crossred:939238440359321600> **You forgot to add a VALID TIME!**\nUsage: `,invitepayment 30d @USER @BOT`");
                args.shift();
                let member = message.mentions.members.filter(m => m.guild.id == message.guild.id).first() || await message.guild.members.fetch(args[0])
                if (!member || !member.user || member.user.bot) return message.reply("<a:crossred:939238440359321600> **You forgot to Ping a MEMBER**\nUsage: `,invitepayment 30d @USER @BOT`");
                if (!member.roles.cache.has("937343250740682752")) return message.reply("<a:crossred:939238440359321600> **He is not boosting this Server!**");
                let user = member.user;
                args.shift()
                let bot = message.mentions.members.filter(m => m.guild.id == message.guild.id && m.user.bot).first() || await message.guild.members.fetch(args[0])
                if (!bot || !bot.user || !bot.user.bot) return message.reply("<a:crossred:939238440359321600> **You forgot to Ping a BOT**\nUsage: `,invitepayment 30d @USER @BOT`");
                client.bots.ensure(bot.id, {
                    info: "No Info available",
                    type: "Default"
                })
                let data = client.bots.get(bot.id, "info");
                if (!data) return message.reply("<a:crossred:939238440359321600> **The Bot does not have botdetails yet!**\nUsage: `,invitepayment 30d @USER @BOT`");
                if (!String(data).endsWith("`")) data += "```";
                let normaldata = client.payments.get("payments", "users");
                let invitedata = client.payments.get("invitepayments", "users");
                let boostdata = client.payments.get("boostpayments", "users");
                if(normaldata.find(d => d.bot == bot.id) || invitedata.find(d => d.bot == bot.id) || boostdata.find(d => d.bot == bot.id))
                  return message.reply("<a:crossred:939238440359321600> This bot is already payed! Use: `,removepayment @Bot` first!")
                client.payments.push("boostpayments", {
                        timestamp: Date.now(),
                        time: time,
                        bot: bot.id,
                        guild: message.guild.id,
                        id: user.id,
                        data: data
                    },
                    "users");
                try {
                    message.delete();
                } catch {}
                message.channel.send(`<a:check:939238439826640957> **Successfully Noted this BOOSTPayment for ${duration(time).map(i => `\`${i}\``).join(" ")} until <t:${Math.floor((Date.now() + time) / 1000)}>, after that I will notify <@${user.id}> to pay for ${bot.user} again!**`);
                client.channels.fetch("939205602574467122").then(ch => {
                    ch.send(`${user} boost-payed for ${duration(time).map(i => `\`${i}\``).join(" ")} until <t:${Math.floor((Date.now() + time) / 1000)}> for: **${client.bots.get(bot.id, "type")}** ${bot}`)
                })
            } catch (e) {
                message.channel.send(`${e.message ? e.message : e}`.substr(0, 1900), {
                    code: "js"
                })
            }
        } 
    });

    //SET WAITING
    client.on("messageCreate", async message => {
        if (!message.guild || message.author.bot || message.guild.id != "934213686468423780") return;
        if(!isValidTicket(message.channel)) return
        if(client.setups.has(message.channel.id)) {
            let user = client.setups.get(message.channel.id, "user");
            if(message.author.id == user && client.setups.get("todelete","tickets").find(t => t.channel == message.channel.id)) {
                client.setups.remove("todelete", ch => ch.channel == message.channel.id, "tickets")
                message.reply(`**Thanks for your Response!**\n> The Staff Team (<@&${Roles.SupporterRoleId}>) will soon answer you!`)
            }
        }
    })


    client.on("messageCreate", message => {
        if (!message.guild || message.author.bot) return;
        let allowedcats = ["938409498371031062", "938439935361433691", "938914282333147257", "938439892638257172", "938439892638257172", "938439991577706610", "938439935361433691", "938462240984674305", "938462240984674305", "938466109923942442", "938466109923942442", "938466151200063540", "938876148765556796", "938502127695831050", "941718876016767047", "940698649518833674"];
        if (message.member.roles.highest.rawPosition >= message.guild.roles.cache.get("935689526586790028").rawPosition) {
            if (!client.staffrank.has(message.author.id))
                client.staffrank.ensure(message.author.id, {
                    createdbots: [ /* Date.now() */ ], //show how many bots he creates per command per X Time
                    messages: [ /* Date.now() */ ], //Shows how many general messages he sent
                    tickets: [ /* Date.now() */ ], //shows how many messages he sent in a ticket
                    actualtickets: [ /* { id: "channelid", messages: []}*/ ] //Each managed ticket where they send a message
                })
            if (allowedcats.includes(message.channel.parentId)) {

                //only count Messages, which are no commands
                if (!message.content.trim().startsWith(client.config.prefix)) {
                    if (!client.ticketdata.has(message.channel.id))
                        client.ticketdata.ensure(message.channel.id, {
                            supporters: [ /* { id: "", messages: 0} */ ]
                        })

                    let data1 = client.ticketdata.get(message.channel.id, "supporters");
                    let theTicket1 = data1.find(d => d.id == message.author.id);
                    let theTicketDataIndex1 = data1.findIndex(d => d.id == message.author.id);
                    //ensure it
                    if (!theTicket1) {
                        theTicket1 = {
                            id: message.author.id,
                            messages: 0,
                        }
                    }
                    theTicket1.messages += 1;
                    //add the ticket information
                    if (theTicketDataIndex1 >= 0) data1[theTicketDataIndex1] = theTicket1;
                    else data1.push(theTicket1);
                    //update the db
                    client.ticketdata.set(message.channel.id, data1, "actualtickets");

                    //get datas and indexes
                    let data = client.staffrank.get(message.author.id, "actualtickets");
                    let theTicket = data.find(d => d.id == message.channel.id);
                    let theTicketDataIndex = data.findIndex(d => d.id == message.channel.id);
                    //ensure it
                    if (!theTicket) {
                        theTicket = {
                            id: message.channel.id,
                            messages: [],
                        }
                    }
                    theTicket.messages.push(Date.now());
                    //add the ticket information
                    if (theTicketDataIndex >= 0) data[theTicketDataIndex] = theTicket;
                    else data.push(theTicket);
                    //update the db
                    client.staffrank.set(message.author.id, data, "actualtickets");
                }
            } else {
                //update the db for the staff person
                client.staffrank.push(message.author.id, Date.now(), "messages")
            }
        }
    })
    
}
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, `\\$&`);
}
function onCoolDown(message, command) {
    const client = message.client;
    if (!client.cooldowns.has(command.name)) {
      client.cooldowns.set(command.name, new Discord.Collection());
    }
    const now = Date.now();
    const timestamps = client.cooldowns.get(command.name); 
    const cooldownAmount = (command.cooldown || 1) * 1000; 
    if (timestamps.has(message.member.id)) { 
      const expirationTime = timestamps.get(message.member.id) + cooldownAmount;
      if (now < expirationTime) { 
        const timeLeft = (expirationTime - now) / 1000; 
        return timeLeft
      }
      else {
        timestamps.set(message.member.id, now); 
        setTimeout(() => timestamps.delete(message.member.id), cooldownAmount); 
        return false;
      }
    }
    else {
      timestamps.set(message.member.id, now); 
      setTimeout(() => timestamps.delete(message.member.id), cooldownAmount); 
      return false;
    }
}