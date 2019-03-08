const config = require('../config.json');
const Discord = require('discord.js')

//slot reminder : head, body, feet, hands, shoulder, one_handed, two_handed, shield, right_hand, left_hand

//A collection with the rarity and the stat modifier ratio
const rarityMod = new Discord.Collection();
rarityMod.set('Common', {mod:1, color:0xc6c6c6})
.set('Uncommon', {mod:1.1, color:0x858585})
.set('Rare', {mod:1.3, color:0x00bfff})
.set('Ultra-rare', {mod:1.5, color:0x0062ff})
.set('Incredible', {mod:1.6,color:0xdd00ff})
.set('Epic', {mod:1.6, color:0x9500ff})
.set('Legendary', {mod:1.7, color:0xff5e00})
.set('Unique', {mod:2, color:0xff0000});

const availableSlots = new Discord.Collection();
availableSlots.set('One_handed', {})
.set('Two_handed', {})
.set('Right_hand', {})
.set('Left_hand', {})
.set('Dual_wield', {})
.set('Shield', {})
.set('Head', {})
.set('Body', {})
.set('Feet', {})
.set('Hands', {})
.set('Shoulders', {});

//set('zone_number', [minlevelDrop, maxlevelDrop])
const zones = new Discord.Collection();
zones.set('1', {name:'Forest', minLvl:1, maxLvl:10, tier:1})
.set('2', {name:'Cave', minLvl:11, maxLvl:20, tier:2})
.set('3', {name:'Hell', minLvl:21, maxLvl:30, tier:3});

module.exports = class Item {

  constructor(){

  }

  init(zone, playerLvl){
    this.zone = zone;
    this.playerLvl = playerLvl;
    this.level = this.setLevel();
    this.rarity = this.setRarity();
  }

  static zoneAvailable(zone){
    if(zones.has(zone)) return true;
    return false;
  }

  static availableSlotsCollection(){
    return availableSlots;
  }

  static zonesCollection(){
    return zones;
  }

  setLevel(){
    let lvlGap = 3;
    let lvl = Math.floor(Math.random() * (2 * lvlGap + 1) - (lvlGap) + this.playerLvl);
    if(lvl < zones.get(this.zone).minLvl) lvl = zones.get(this.zone).minLvl;
    if(lvl > zones.get(this.zone).maxLvl) lvl = zones.get(this.zone).maxLvl;
    return lvl;
  }

  setRarity(){
    var roll = Math.random() * 100;
    if(roll < 1)
    return 'Unique';
    if(roll < 5)
    return 'Legendary';
    if(roll < 12)
    return 'Epic';
    if(roll < 25)
    return 'Incredible';
    if(roll < 38)
    return 'Ultra-rare';
    if(roll < 55)
    return 'Rare';
    if(roll < 80)
    return 'Uncommon';
    return 'Common';
  }

  async dbSave(player_id){
    if(!player_id){
      console.log('PLAYER CONSTRUCTOR ERROR : player_id is undefined');
      return false;
    }
    let query =
    `INSERT INTO item(player_id, name, slot, rarity, description, level, stat, stattype)
    VALUES(${player_id}, '${this.name}', '${this.slot}', '${this.rarity}', '${this.description}', ${this.level}, ${this.stat}, '${this.statType}')`;
    let res = await bot.dbquery(query);
    if(!res){
      console.log('PLAYER CONSTRUCTOR ERROR : Database query error!')
      this.ERR = config.ERR_DATABASEQUERY;
      return this;
    }
    return this;
  }

  detail(user = null, embed = false){
    if(embed && user){
      const embed = new Discord.RichEmbed()
      .setTitle(`You got :
        **${this.name}**`)
        .setAuthor(user.tag, user.avatarURL)
        /*
        * Alternatively, use "#00AE86", [0, 174, 134] or an integer number.
        */
        .setColor(rarityMod.get(this.rarity).color)
        .setDescription(`*${this.slot} ${this.description}*`)
        //.setFooter("This is the footer text, it can hold 2048 characters", "http://i.imgur.com/w1vhFSR.png")
        //.setImage(`http://valaragen.alwaysdata.net/${this.rarity.toLowerCase()}_${this.description.toLowerCase()}.png`)
        .setThumbnail(`http://valaragen.alwaysdata.net/${this.rarity.toLowerCase()}_${this.description.toLowerCase()}.png`)

        .addField('Level', this.level, true)
        .addField(this.statType, this.stat, true);
        return embed;
      }else{
        return `${user}
        You dropped **${this.name}**
        ${bot.emojis.find('name', `${this.rarity.toLowerCase()}_${this.description.toLowerCase()}`)}
        Level : ${this.level}
        ${this.statType} : ${this.stat}
        Description: **${this.slot} ${this.description}**
        `;
      }
      console.log('Error: detail function in Weapon class');
      return 0;
    }

  }
