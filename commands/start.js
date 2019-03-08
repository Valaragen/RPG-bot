const config = require('../config.json')

module.exports = {
  name: 'start',
  description: 'Join the adventure by creating your character',
  usage: '<character_name>',
  args: true,

  async execute (message, args) {
    if(args[0].length > 15){message.channel.send(`${message.author} -> You must choose à valid name : 15 characters max`); return;}
    let m = await message.channel.send(`${message.author} -> Creating ${args[0]}...`)
    let query =
    `INSERT INTO player(player_id, name)
    VALUES ('${message.author.id}', $1)`
    let res = await bot.dbquery(query, [args[0]])
    if(res){
      m.edit(`${message.author} -> ${args[0]} has been created !`)
    }else{
      m.edit(`${message.author} -> You already have a character ! You should use ${config.prefix}profile`)
    }
  },
}
