const Discord = require('discord.js');
const Base62 = require('base62/lib/ascii');
const config = require('../config.json');
const Fight = require('../object/Fight.js');
const Item = require('../object/Item.js');
const Player = require('../object/Player.js');

module.exports = {
  name: 'inventory',
  description: `
  Check your inventory
  You can @mention a player to see his inventory
  You can specify a slot to show only 1 type of item
  `,
  usage: '<slot> <@mention>',
  aliases: ['i', 'inv'],

  async execute (message, args) {
    //let m = await message.channel.send(`${message.author} -> Searching...`);
    let maxItemShowed = 6;
    let user = message.author;
    let errormsg = `${message.author} -> You have to create a character first, with ${config.prefix}start`;
    let queryArgs = new Array();
    queryArgs.push(user.id);
    let selectedSlot;
    let queryParams = '';
    if(args.length){
      if(args.length > 7){
        message.channel.send(`${message.author} -> Too many arguments`);
        return;
      }
      if(message.mentions.users.first()){
        user = message.mentions.users.first();
        errormsg = `${message.author} -> No character found for this player`;
      }
      // if(!message.mentions.users.first()){
      //   message.channel.send(`${message.author} -> You have to @mention someone in order to see his inventory`);
      //   return;
      // }

      //status 0 -- no match
      //status 1 -- bad match
      //status 2 -- ok match
      //status 3 -- pertinent match
      let status = 0;
      let i = 2;
      availableSlots = Item.availableSlotsCollection();
      await Promise.all(args.map(async (arg) => {
        //TODO change the regex to match only characters
        if(arg.match(/^[0-9A-Za-z]+$/)){
          let strRegex = new RegExp(arg, 'i');
          let beginRegex = new RegExp(`^${arg}`, 'i');
          let letterRegex = new RegExp(`[${arg}]{3}`, 'i')
          //let pRegex = new RegExp(`^${arg}$`, 'i');
          availableSlots.map(async (value, key, map) => {
            if(status !== 3 && key.match(strRegex)){
              if(key.match(beginRegex)){
                status = 3;
              }else{
                status = 2;
              }
              selectedSlot = key;
            }
            if(status === 0 && key.match(letterRegex)){
              status = 1;
              selectedSlot = key;
            }
          });
          if(selectedSlot){
            queryParams += `, $${i}`;
            queryArgs.push(selectedSlot);
            status = 0;
            selectedSlot = '';
            i++;
          }
        }
      }));
      if(queryParams){
        queryParams = `AND i.slot IN (${queryParams.slice(2)})`
        maxItemShowed = 100;
        console.log(queryParams)
      }
    }


    //TODO toLower with sql request cf : LOWER(column) AS ....
    //TODO Raise the max number of item showed and count the number of charater showned in order to setup pages and never exceed the field limit
    let query =`
    SELECT p.player_id, i.item_id, i.slot, i.rarity, i.description, i.level, i.stat, i.stattype, e.item_id AS equipped, e.slot AS equippedslot
    FROM player p
    LEFT JOIN item i ON p.player_id = i.player_id
    LEFT JOIN rarities r ON i.rarity = r.rarity_id
    LEFT JOIN slots s ON i.slot = s.slot_id
    LEFT JOIN equipment e ON i.item_id = e.item_id
    WHERE p.player_id = $1
    ${queryParams}
    ORDER BY (e.item_id IS NULL), s.slotorder, i.level DESC, r.rarityorder, i.description
    `
    let res = await bot.dbquery(query, queryArgs);
    if(!res){
      message.channel.send(`${message.author} -> Database error !`);
      return;
    }
    if(res.rows.length){
      const embed = new Discord.RichEmbed()
      .setAuthor(`${user.tag}'s inventory`, user.avatarURL)
      .setColor(0x96070b)

      if(!res.rows[0]['item_id']){
        embed.setDescription('*This inventory is empty...*')
      }else{
        let itemType = new Discord.Collection();
        itemType.set('Magical_def', {name:'Magical defense', value:0, emoji:bot.emojis.get('491048119664902158')})
        .set('Magical_dmg', {name:'Magical damages', value:0, emoji:bot.emojis.get('491048119903977473')})
        .set('Physical_def', {name:'Physical defense', value:0, emoji:bot.emojis.get('477198437499142144')})
        .set('Physical_dmg', {name:'Physical damages', value:0, emoji:bot.emojis.get('477198437776097290')});

        let lastItem = res.rows[0];
        let fieldValue = '';
        let itemLine = '';
        if(lastItem['equipped']){
          embed.setTitle('**EQUIPMENT**');
          embed.setDescription('--------------------');
        }
        let n = 0;
        let itemShowed = 0;
        //TODO Pagination ! 25 field max
        await Promise.all(res.rows.map(async (item) => {
          itemLine = `\n${bot.emojis.find('name', `${item['rarity'].toLowerCase().replace("-", "")}_${item['description'].toLowerCase()}`)}\`LVL:${item['level']}\`\t\`${item['stat']}\`${bot.emojis.find('name', item['stattype'].toLowerCase())} *#${Base62.encode(item['item_id'])}*`;
          if(item['equipped']){
            if(item['equippedslot'] == 'Right_hand'){fieldValue+='\n__Right hand__';}
            else if(item['equippedslot'] == 'Left_hand'){fieldValue+='\n__Left hand__';}
            else if(item['equippedslot'] == 'Dual_wield'){fieldValue+='\n__Dual wield__';}
            else if(!n){fieldValue+='\n__Armor__';n++;}
            fieldValue += itemLine;
            itemType.get(item['stattype']).value += item['stat'];

          }else if(lastItem['equipped']){
            embed.addField('Equipped items', fieldValue+'\n\u200b', true);
            let statsField = '';
            itemType.map(async (type, key, map) => {
              if(type.value != 0){
                statsField += `\n${type.value} ${type.emoji}`;
              }
            });
            embed.addField('Stats', statsField, true);
            embed.addField('**INVENTORY**','--------------------');
            fieldValue = itemLine;
            itemShowed = 0;
          }else{
            if(!lastItem['equipped'] && lastItem['slot'] == item['slot']){
              if(itemShowed < maxItemShowed){
                if((fieldValue.length + itemLine.length) < 1024){
                  fieldValue += itemLine;
                }else{
                  embed.addField(lastItem['slot'].replace('_', ' '), fieldValue, true);
                  fieldValue = itemLine;
                  itemShowed = 0;
                }
              }
            }else{
              if(itemShowed > maxItemShowed) fieldValue += `\n *${itemShowed-maxItemShowed} more...*`;
              embed.addField(lastItem['slot'].replace('_', ' '), fieldValue+'\n\u200b', true);
              fieldValue = itemLine;
              itemShowed = 0;
            }
          }
          lastItem = item;
          itemShowed++;
        }))
        embed.addField(lastItem['slot'].replace('_', ' '), fieldValue, true);

      }
      message.channel.send(`${message.author} - >`, embed);
    }else{
      message.channel.send(errormsg);
    }
  },
}
