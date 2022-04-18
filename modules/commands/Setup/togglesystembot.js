const Discord = require("discord.js");
const { swap_pages2 } = require("../../utilfunctions")
const { Roles } = require("../../../settings.json");
module.exports = {
    name: require("path").parse(__filename).name, 
    category: "Setup", 
    aliases: [  ], 
    description: "", 
    run: async (client, message, args, prefix) => {
        if (message.member.roles.highest.rawPosition < message.guild.roles.cache.get(Roles.OwnerRoleId).rawPosition)
            return message.reply("<:no:935673265245028382> You are not allowed to execute this Command!");
        client.setups.set(message.guild.id, !client.setups.get(message.guild.id, "ticketsystem3.enabled"), "ticketsystem3.enabled")
        await message.react("<:like:938142052087124008>").catch(() => {});
        return message.reply(`> <a:check:939238439826640957> **The System BOT ORDER SYSTEM is now: \`${client.setups.get(message.guild.id, "ticketsystem3.enabled") ? "Enabled" : "Disabled"}\`**`)
    }
}