const config = require('../config.json')

module.exports = {
  name: 'profile',
  aliases: ['p'],
  description: 'Check the @mentioned profile, your profile by default',
  usage: '<@mention>',

  async execute (message, args) {
    let m = await message.channel.send(`${message.author} -> Searching...`);

    if(!args.length){
      var user = message.author;
      var errormsg = `${message.author} -> You have to create a character first, with ${config.prefix}start`;
    }else{
      if(!message.mentions.users.first()){
        m.edit(`${message.author} -> You have to @mention someone in order to see his profile`);
        return;
      }
      var user = message.mentions.users.first();
      var errormsg = `${message.author} -> No character found for this player`;
    }

    let query =
    `SELECT name, max_health, level, exp
    FROM player
    WHERE player_id = '${user.id}'`
    let res = await bot.dbquery(query);
    if(!res){
      m.edit(`${message.author} -> Database error !`);
      return;
    }
    if(res.rows.length){
      m.edit({embed: {
        color: 0x96070b,
        author: {
          name: `${user.tag}'s profile :`,
          icon_url: user.avatarURL
        },
        title: "**Stats:**",
        fields: [{
          name:"Name",
          value:`${res.rows[0]['name']}`
        },
        {
          name:`Health`,
          value:`${res.rows[0]['max_health']} ${bot.emojis.get("457557425634017282")} `
        },
        {
          name:"Level",
          value:`${res.rows[0]['level']}`
        },
        {
          name:"Exp",
          value:`${res.rows[0]['exp']}`
        }]
      }})
    }else{
      m.edit(errormsg);
    }
  },
}
