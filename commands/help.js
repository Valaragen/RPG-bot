const config = require('../config.json')

module.exports = {
  name: 'help',
  description: 'Show all commands or a command details',
  usage: '<command>',
  cooldown:5,

  async execute (message, args) {
    const data = [];
    const { commands } = message.client;

    if (!args.length) {
      data.push('Here\'s a list of all my commands:');
      data.push(commands.map(command => command.name).join(', '));
      data.push(`\nYou can send \`${config.prefix}help [command name]\` to get info on a specific command!`);

      return message.channel.send(data, { split: true })

    }

    const name = args[0].toLowerCase();
    const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

    if (!command) {
      return message.reply('that\'s not a valid command!');
    }

    data.push(`**Name:** ${command.name}`);

    if (command.aliases) data.push(`**Aliases:** ${command.aliases.join(', ')}`);
    if (command.description) data.push(`**Description:** ${command.description}`);
    if (command.usage) data.push(`**Usage:** ${config.prefix}${command.name} ${command.usage}`);

    data.push(`**Cooldown:** ${command.cooldown || config.defaultcd} second(s)`);

    message.channel.send(data, { split: true });


    //old code
    //   message.reply({embed: {
    //     color: 0x96070b,
    //     author: {
    //       name: bot.user.username,
    //       icon_url: bot.user.avatarURL
    //     },
    //     title: "***Commands:***",
    //     fields: [{
    //       name:`${config.prefix}start [character_name]`,
    //       value:"Create your character"
    //     },
    //     {
    //       name:`${config.prefix}profile [@mention]`,
    //       value:"Check the mentioned profile, your profile by default"
    //     }]
    // }})

  },
}
