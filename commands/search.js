const Discord = require('discord.js');
const config = require('../config.json')
const Fight = require('../object/Fight.js')
const Item = require('../object/Item.js')
const Player = require('../object/Player.js')
const Weapon = require('../object/Weapon.js')
const Armor = require('../object/Armor.js')


module.exports = {
  name: 'search',
  description: 'Search for loot, it could be dangerous...',
  usage: '<zone_number>',
  aliases: ['s'],

  async execute (message, args) {
    if(args.length){
      if(!Item.zoneAvailable(args[0])){
        message.channel.send(`${message.author} -> This zone is not available`);
        return;
      }
      const p = new Player();
      await p.getFromDb(message.author.id);
      if(p.ERR){
        if(p.ERR === config.ERR_DATABASEQUERY){
          message.channel.send(`${message.author} -> Database error !`);
          return;
        }
        if(p.ERR === config.ERR_QUERYNORESULT){
          message.channel.send(`${message.author} -> You have to create a character first, with ${config.prefix}start`);
          return;
        }
      }

      if(Math.random() < 1){
        const i = Weapon.generateItem();
        i.init(args[0], p.level);
        i.dbSave(p.player_id);
        message.channel.send(`${message.author} -> `, i.detail(message.author, true));
      }else{
        const f = new Fight(args[0], p.level);
        message.channel.send(f.detail(message.author));
      }
    }else{
      //TODO Make a choice based on reaction
      let descr = '';
      const embed = new Discord.RichEmbed()
      .setColor(0x96070b)
      .setTitle('Available zones:');
      await Promise.all(Item.zonesCollection().map(async (zone, key, map) => {
        descr += `\n${key}. ${zone.name} -> Level ${zone.minLvl}-${zone.maxLvl} Drop: T${zone.tier}`;
      }));
      embed.setDescription(descr);
      message.channel.send(`${message.author} - >`, embed);
    }
  },
}
