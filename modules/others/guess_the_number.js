
/**
 * STARTING THE MODULE WHILE EXPORTING THE CLIENT INTO IT
 * @param {*} client 
 */
 module.exports = async (client) => {

    //GUESS THE NUMBER
    client.on("messageCreate", async (message) => {
        
        let channelID = "939206154523934751" //873209073225592842
        let hostID = "717416034478456925" //717416034478456925
        let accessRoleID = "939205995593355314" // 873208791963951125

        if(message.guild && message.channel.id == channelID){
            if(parseInt(message.content) == 8492){
                await message.channel.permissionOverwrites.edit(accessRoleID, {
                    SEND_MESSAGES: false,
                    VIEW_CHANNEL: false,
                }).catch(e => {console.warn(e.stack ? String(e.stack).grey : String(e).grey)});
                await message.pin().then(s=>{}).catch(e => {console.warn(e.stack ? String(e.stack).grey : String(e).grey)});
                await message.react("<a:yes:935673435844132874>").catch(() => {});             
                await message.react("<a:doggy_wink:943551646422691891>").catch(() => {});
                await message.react("<a:kekboom:943551729021120613>").catch(() => {});
                await message.react("<:stonks:943551791394619442>").catch(() => {});
                await message.react("<:like:938142052087124008>").catch(() => {});
                await message.channel.send(`> <@&${accessRoleID}> **The Event ended!**\n> ${message.author} **__${message.author.tag}__ is the Winner!**\n> The number was **__8492__**`).catch(e => {console.warn(e.stack ? String(e.stack).grey : String(e).grey)});
            }
        }
    })
}
