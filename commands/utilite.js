module.exports = {
  name: 'utilite',
  aliases: ['u', 'usage'],
  description: 'Just a dumb command',
  usage: '<random string>',
  args: true,
  guildOnly:true,
  async execute(message, args) {
    let m = await message.reply(`You said '${args[0]}' ${bot.emojis.get("457557425634017282")}`)
    m.react('👍').then(() => m.react('👎'));

    const filter = (reaction, user) => {
        return ['👍', '👎'].includes(reaction.emoji.name) && user.id === message.author.id;
    };

    m.awaitReactions(filter, { max: 1, time: 10000, errors: ['time'] })
        .then(collected => {
            const reaction = collected.first();

            if (reaction.emoji.name === '👍') {
                message.reply('Yeah, I know, i\'m pretty usefull.');
            }
            else {
                message.reply('You did say that 😠.');
            }
        })
        .catch(collected => {
            console.log(`After a minute, only ${collected.size} out of 4 reacted.`);
            message.reply('you didn\'t react with neither a thumbs up, nor a thumbs down.');
        });
  },
}
