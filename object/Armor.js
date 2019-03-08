const config = require('../config.json');
const Discord = require('discord.js');
const Item = require('./Item.js');

const armorSlot = new Discord.Collection();
armorSlot.set('Head', {name:'Helmet'})
.set('Body', {name:'Armor'})
.set('Feet', {name:'Shoes'})
.set('Hands', {name:'Gloves'})
.set('Shoulders', {name:'Shoulderpads'})
.set('Left_hand', {name:'Shield'});

adjective = ['Ominous', 'Divine', 'Imminent', 'Broken', 'Cursed', 'Haunted', 'Fallen', 'Twisted',
'Doomed', 'Hellish'];

noun = ['Kings', 'Ancestors', 'Whispers', 'Souls', 'Dreams', 'Torment', 'Misery', 'Power',
'Hope', 'Memories'];



module.exports = class Armor extends Item {

  init(zone, playerLvl){
    super.init(zone, playerLvl);
    this.slot = armorSlot.randomKey();
    this.description = armorSlot.get(this.slot).name;
    this.name = `${this.rarity} ${this.description} of ${adjective[Math.floor(Math.random() * (adjective.length))]} ${noun[Math.floor(Math.random() * (noun.length))]}`;
    this.stat = setDefStat();
    this.statType = 'Magical_def';
  }

  setDefStat(){
    let stat = Math.floor((5 + this.level) * rarityMod.get(this.rarity).mod);
    return stat;
  }


}
