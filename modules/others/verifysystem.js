const { MessageEmbed, MessageActionRow, MessageButton, MessageSelectMenu } = require("discord.js");
module.exports = async (client) => {
    const rulesChannel = "940262682068664370";
    const verifiedRoleId = "937049846093840465"
    client.on("interactionCreate", async (interaction) => {
        if(!interaction?.isButton()) return;
        const { member, channel, message } = interaction;
        if(channel.id == rulesChannel && interaction?.customId == "KooJeverify") {
            if(member.roles.cache.has(verifiedRoleId)) {
                return interaction?.reply({
                    ephemeral: true,
                    content: "❌ You are already Verified"
                }).catch(() => {});
            }
            interaction?.reply({
                ephemeral: true,
                content: "**I will now ask you 5 Questions, please answer them CORRECTLY (Read the RULES) In Order to get ACCESS to this SERVER!**\n> *Keep in Mind that Capitalization might be important sometimes!*",
                components: [
                    new MessageActionRow().addComponents([
                        new MessageButton().setLabel("Okay, Go ahead!").setStyle("DANGER").setCustomId("okay-go-ahead"),
                        new MessageButton().setLabel("No Sorry, No verification").setStyle("SUCCESS").setCustomId("no-verification"),
                    ])
                ]
            }).catch(() => {});
        }
        // ASK FIRST QUESTION
        if(channel.id == rulesChannel && interaction?.customId == "okay-go-ahead") {
            interaction?.update({
                ephemeral: true,
                content: "**First Question:**\n> What is the __Keyword__ inside of the RULES?",
                components: [
                    new MessageActionRow().addComponents([
                        new MessageButton().setLabel("Key2022KooJe").setStyle("SECONDARY").setCustomId("Key2022KooJe"),
                        new MessageButton().setLabel("KeyKooJe2022").setStyle("SECONDARY").setCustomId("KeyKooJe2022"),
                        new MessageButton().setLabel("KeyKooJe2021").setStyle("SECONDARY").setCustomId("KeyKooJe2021"),
                        new MessageButton().setLabel("Key2021KooJe").setStyle("SECONDARY").setCustomId("Key2021KooJe"),
                        new MessageButton().setLabel("KeyOfKooJe").setStyle("SECONDARY").setCustomId("KeyOfKooJe"),
                    ]),
                    new MessageActionRow().addComponents([
                        new MessageButton().setLabel("Cancel Verification").setStyle("DANGER").setCustomId("Cancel_Verify")
                    ]),
                ]
            }).catch(() => {});
        }
        
        if(channel.id == rulesChannel && interaction?.customId.startsWith("Ping")) {
            if(interaction?.customId == "PingNo" || interaction?.customId == "PingTickets2") {
                member.roles.add(verifiedRoleId).then(() => {
                    interaction?.update({
                        ephemeral: true,
                        content: "👍 **Good Job!**\n> You successfully Verified yourself and I granted access to you for **KooJe Development**\n> :wave: Enjoy! Just incase you need to know something check out <#924696982264610846>",
                        components: [],
                    }).catch(() => {});
                }).catch((e) => {
                    console.log(e)
                    interaction?.update({
                        ephemeral: true,
                        content: "❌ Something went terrible Wrong I'm Sorry please check out <#924718628732031026>\n> **Please send a SCREENSHOT of this MESSAGE too**, so that we know you should have succesfully solved the Verification!",
                        components: [],
                    }).catch(() => {});
                });
            } else {
                interaction?.update({
                    ephemeral: true,
                    content: ":x: **WRONG ANSWER**\n> Verification Cancelled, Make sure to Read the RULES AGAIN!\n> Tipp: ||Check Rule **§005** __very carefully__!||",
                    components: [
                        new MessageActionRow().addComponents([
                            new MessageButton().setLabel("Yes, I am").setStyle("DANGER").setCustomId("PingYes").setDisabled(),
                            new MessageButton().setLabel("Only in Tickets").setStyle("DANGER").setCustomId("PingTickets").setDisabled(),
                            new MessageButton().setLabel("No, I am not").setStyle("SUCCESS").setCustomId("PingNo").setDisabled(),
                            new MessageButton().setLabel("In Tickets if no Response").setStyle("SUCCESS").setCustomId("PingTickets2").setDisabled(),
                            new MessageButton().setLabel("Only when it's urgent").setStyle("DANGER").setCustomId("PingUrgent").setDisabled(),
                        ]),
                    ]
                }).catch(() => {});
            }
        }
        
        if(channel.id == rulesChannel && interaction?.customId.startsWith("Key")) {
            if(interaction?.customId == "Key2022KooJe") {
                interaction?.update({
                    ephemeral: true,
                    content: "**SECOND Question:**\n> Am I allowed to ping People?",
                    components: [
                        new MessageActionRow().addComponents([
                            new MessageButton().setLabel("Yes, I am").setStyle("SECONDARY").setCustomId("PingYes"),
                            new MessageButton().setLabel("No, I am not").setStyle("SECONDARY").setCustomId("PingNo"),
                            new MessageButton().setLabel("Only in Tickets").setStyle("SECONDARY").setCustomId("PingTickets"),
                            new MessageButton().setLabel("Only In Ticket if Respons").setStyle("SECONDARY").setCustomId("PingTickets2"),
                            new MessageButton().setLabel("Only when it's urgent").setStyle("SECONDARY").setCustomId("PingUrgent"),
                        ]),
                        new MessageActionRow().addComponents([
                            new MessageButton().setLabel("Cancel Verification").setStyle("DANGER").setCustomId("Cancel_Verify")
                        ]),
                    ]
                }).catch(() => {});
            } else {
                interaction?.update({
                    ephemeral: true,
                    content: ":x: **WRONG KEYWORD**\n> Verification Cancelled, Make sure to Read the RULES AGAIN!\n> Tipp: ||Check my very first message!||",
                    components: [
                        new MessageActionRow().addComponents([
                            new MessageButton().setLabel("Key2021KooJe").setStyle("DANGER").setCustomId("Key2021KooJe").setDisabled(),
                            new MessageButton().setLabel("KeyKooJe2022").setStyle("DANGER").setCustomId("KeyKooJe2022").setDisabled(),
                            new MessageButton().setLabel("KeyKooJe2021").setStyle("DANGER").setCustomId("KeyKooJe2021").setDisabled(),
                            new MessageButton().setLabel("Key2022KooJe").setStyle("SUCCESS").setCustomId("Key2022KooJe").setDisabled(),
                            new MessageButton().setLabel("KeyOfKooJe").setStyle("DANGER").setCustomId("KeyOfKooJe").setDisabled(),
                        ])
                    ]
                }).catch(() => {});
            }
        }

        if(channel.id == rulesChannel && interaction?.customId == "Cancel_Verify"){
            interaction?.update({
                ephemeral: true,
                content: "👌 **Cancelled the Verification Process!**",
                components: []
            }).catch(() => {});
        }
        // CANCEL 
        if(channel.id == rulesChannel && interaction?.customId == "no-verification") {
            interaction?.reply({
                ephemeral: true,
                content: "👌 **Cancelled the Verification Process!**"
            }).catch(() => {});
        }
    })
}