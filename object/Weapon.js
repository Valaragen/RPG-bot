const config = require('../config.json');
const Discord = require('discord.js');
const Item = require('./Item.js');
const Armor = require('./Armor.js');


const oneHandedWeapons = new Discord.Collection();
oneHandedWeapons.set('Sword', {mod:1})
.set('Dagger', {mod:1})
.set('Spear', {mod:1})
.set('Rapier', {mod:1})
.set('Hammer', {mod:1})
.set('Axe', {mod:1})
.set('Wand', {mod:1});

const twoHandedWeapons = new Discord.Collection();
twoHandedWeapons.set('Halberd', {mod:2})
.set('Sword', {mod:2})
.set('Spear', {mod:2})
.set('Hammer', {mod:2})
.set('Axe', {mod:2})
.set('Staff', {mod:2});

const weaponSlot = new Discord.Collection();
weaponSlot.set('One_handed', oneHandedWeapons).set('Two_handed', twoHandedWeapons);

adjective = ['Ominous', 'Divine', 'Imminent', 'Broken', 'Cursed', 'Haunted', 'Fallen', 'Twisted',
'Doomed', 'Hellish'];

noun = ['Kings', 'Ancestors', 'Whispers', 'Souls', 'Dreams', 'Torment', 'Misery', 'Power',
'Hope', 'Memories'];



module.exports = class Weapon extends Item {

  constructor(){
    super();
  }

  static generateItem(wDroprate = 0.2){
    var i;
    (Math.random() < wDroprate) ? i = new Weapon : i = new Armor();
    return i;
  }

  init(zone, playerLvl){
    super.init(zone, playerLvl);
    this.slot = weaponSlot.randomKey();
    this.description = weaponSlot.get(this.slot).randomKey();
    this.name = `${this.rarity} ${this.description} of ${adjective[Math.floor(Math.random() * (adjective.length))]} ${noun[Math.floor(Math.random() * (noun.length))]}`;
    this.stat = setAtkStat();
    this.statType = "Magical_dmg";
  }

  setAtkStat(){
    let stat = Math.floor((5 + this.level) * rarityMod.get(this.rarity).mod * weaponSlot.get(this.slot).get(this.description).mod);
    return stat;
  }

}
