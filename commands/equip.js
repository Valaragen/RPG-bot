const Discord = require('discord.js');
const Base62 = require('base62/lib/ascii');
const config = require('../config.json');
const Item = require('../object/Item.js');
const Player = require('../object/Player.js');


const base62Regexp = "^[0-9A-Za-z]+$";


module.exports = {
  name: 'equip',
  description: 'Equip one or multiple Items',
  usage: '<#Item ID> (<#Item ID>) (<#Item ID>)...',
  aliases: ['e', 'eq'],
  args: true,

  async execute (message, args) {

    let errormsg = `${message.author} -> You have to create a character first, with ${config.prefix}start`;
    if(args.length > 7){
      message.channel.send(`${message.author} -> You can't equip more than 7 items simunalteously`);
      return;
    }

    //Get the weapons equipped by the player
    //LEFT join to get at last 1 row and 0 if the player do not exist
    let query =`
    SELECT p.player_id, e.item_id, e.slot, i.slot AS itemslot, i.rarity, i.description, i.stat, i.stattype, i.level
    FROM player p
    LEFT JOIN equipment e ON p.player_id = e.player_id
    LEFT JOIN item i ON e.item_id = i.item_id
    WHERE p.player_id = $1
    ORDER BY i.slot = 'Left_hand' DESC
    `
    let res = await bot.dbquery(query, [message.author.id]);
    if(!res){
      message.channel.send(`${message.author} -> Database error !`);
      return;
    }
    if(res.rows.length){

      //This list must be updated if a slot is added
      let equipmentPieces = new Discord.Collection();
      equipmentPieces.set('One_handed', {})
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

      // let stats = new Discord.Collection();

      //reset the slot collection
      // await Promise.all(equipmentPieces.map(async (value, key, map) => {
      //   equipmentPieces.set(key, {});
      // }))

      //Prepare query n°2
      let pointer;
      let query2Params = '';
      let query2Orderby = '';
      let query2Args = new Array();
      query2Args.push(message.author.id);
      let i = 2;

      //If the player don't have equipped items
      //Then just prepare the second query
      if(!res.rows[0]['item_id']){
        await Promise.all(args.map(async (arg) => {
          arg = arg.replace("#", "");
          if(arg.match(base62Regexp) && !query2Args.includes(Base62.decode(arg))){
            query2Params += `, $${i}`;
            query2Orderby += `,item_id=$${i} DESC`;
            query2Args.push(Base62.decode(arg));
            i++;
          }
        }));
        //If the player have equipped items
        //Then prepare the second query
        //And set his equipment in the equipmentPieces collection
      }else{
        await Promise.all([res.rows.map(async (item) => {
          pointer = equipmentPieces.get(item['slot']);
          pointer.currentId = item['item_id'];
          pointer.currentEmote = `${item['rarity'].toLowerCase().replace("-", "")}_${item['description'].toLowerCase()}`;
          pointer.currentStat = item['stat'];
          pointer.currentStattype = `${item['stattype'].toLowerCase()}`;
          pointer.currentLevel = item['level'];
          pointer.currentSlot = item['slot'];
        }),args.map(async (arg) => {
          arg = arg.replace("#", "");
          if(arg.match(base62Regexp) && !query2Args.includes(Base62.decode(arg))){
            query2Params += `, $${i}`;
            query2Orderby += `,item_id=$${i} DESC`;
            query2Args.push(Base62.decode(arg));
            i++;
          }
        })]);
      }

      //If the player has a left_hand only item equipped then set it in the collection
      if(res.rows[0]['itemslot'] == 'Left_hand'){
        equipmentPieces.get('Left_hand').isLeftHandOnly = true;
      }

      query2Params = query2Params.slice(2);
      // console.log(query2Params);
      // console.log(query2Args);

      //If no valid arguments has been typed
      //Then send an error message, and cancel the command
      if(query2Args.length < 2){
        message.channel.send(`${message.author} -> No weapons has been found, maybe you misspelled the ids !`);
        return;
      }

      //Search for items set in the command arguments -> query2Args
      //Duplicate and invalid Id's has been filtered
      //ALready equiped items are returned too
      let query2 =
      `SELECT i.player_id, i.item_id , i.slot, i.rarity, i.description, i.stat, i.stattype, i.level
      FROM item i
      WHERE i.item_id IN (${query2Params})
      AND i.player_id = $1
      ORDER BY player_id ${query2Orderby}
      `

      let res2 = await bot.dbquery(query2, query2Args);
      if(res2.rows.length){
        //Set all the valid new item ids in the collection on the associed slot
        //If one_handed weapons are equiped set the first one to the right
        //and the others one to the left hand.
        let oHWToEquip = 0;
        await Promise.all(res2.rows.map(async (item) => {
          if(item['slot'] == 'One_handed'){
            if(!oHWToEquip){
              pointer = equipmentPieces.get('Right_hand');
              pointer.newSlot = 'Right_hand';
              oHWToEquip++;
            }else{
              pointer = equipmentPieces.get('Left_hand');
              pointer.newSlot = 'Left_hand';
              oHWToEquip++;
            }
          }else if(item['slot'] == 'Two_handed'){
            pointer = equipmentPieces.get('Dual_wield');
            pointer.newSlot = 'Dual_wield';
          }else{
            pointer = equipmentPieces.get(item['slot'])
          }
          pointer.newId = item['item_id'];
          pointer.newEmote = `${item['rarity'].toLowerCase().replace("-", "")}_${item['description'].toLowerCase()}`;
          pointer.newStat = `${item['stat']}`;
          pointer.newStattype = `${item['stattype'].toLowerCase()}`;
          pointer.newLevel = item['level'];
        }));
        //TODO Add 'right hand' 'left hand' 'dual wield' 'armor' to improve the clarity
        //Declare the third query
        let query3 = '';
        let oldFieldValue = '';
        let newFieldValue = '';
        let first = 0;

        //Dual_wield Right_hand/Left_hand DELETE exceptions

        //If the player want to equip a two_handed weapon clear the right/left hand equip request
        //And delete the already equipped left/right hand items
        if(equipmentPieces.get('Dual_wield').newId){
          equipmentPieces.get('Right_hand').newId = null;
          equipmentPieces.get('Left_hand').newId = null;
          if(equipmentPieces.get('Right_hand').currentId){
            query3 += `
            DELETE
            FROM equipment
            WHERE slot = 'Right_hand'
            AND player_id = ${message.author.id};
            `;
            pointer = equipmentPieces.get('Right_hand');
            oldFieldValue += `\n__Right hand__\n${bot.emojis.find('name', `${pointer.currentEmote}`)}\`LVL:${pointer.currentLevel}\` \`${pointer.currentStat}\`${bot.emojis.find('name', `${pointer.currentStattype}`)} *#${Base62.encode(pointer.currentId)}*`;
            pointer.currentId = null;
          }
          if(equipmentPieces.get('Left_hand').currentId){
            query3 += `
            DELETE
            FROM equipment
            WHERE slot = 'Left_hand'
            AND player_id = ${message.author.id};
            `;
            pointer = equipmentPieces.get('Left_hand');
            oldFieldValue += `\n__Left hand__\n${bot.emojis.find('name', `${pointer.currentEmote}`)}\`LVL:${pointer.currentLevel}\` \`${pointer.currentStat}\`${bot.emojis.find('name', `${pointer.currentStattype}`)} *#${Base62.encode(pointer.currentId)}*`;
            pointer.currentId = null;
          }

        }
        //If the player equip an item in right or left hand slots
        else if(equipmentPieces.get('Right_hand').newId || equipmentPieces.get('Left_hand').newId)
        {
          //If the player already have a dual_wield weapon
          //Then delete it
          if(equipmentPieces.get('Dual_wield').currentId){
            query3 += `
            DELETE
            FROM equipment
            WHERE slot = 'Dual_wield'
            AND player_id = ${message.author.id};
            `;
            pointer = equipmentPieces.get('Dual_wield');
            oldFieldValue += `\n__Dual_wield__\n${bot.emojis.find('name', `${pointer.currentEmote}`)}\`LVL:${pointer.currentLevel}\` \`${pointer.currentStat}\`${bot.emojis.find('name', `${pointer.currentStattype}`)} *#${Base62.encode(pointer.currentId)}*`;
            pointer.currentId = null;
          }

          //If the player only equip 1 weapon (different than his current one) as he already have a right hand item
          //and he have a free left hand or a weapon in his left hand
          //Then we switch the currently equipped weapon in his left hand and equip the new one in the right hand
          if(oHWToEquip == 1 && equipmentPieces.get('Right_hand').newId != equipmentPieces.get('Right_hand').currentId && !equipmentPieces.get('Left_hand').newId && equipmentPieces.get('Right_hand').currentId && (!equipmentPieces.get('Left_hand').currentId || !equipmentPieces.get('Left_hand').isLeftHandOnly)){
            pointer = equipmentPieces.get('Left_hand');
            pointer.newId = equipmentPieces.get('Right_hand').currentId;
            pointer.newEmote = equipmentPieces.get('Right_hand').currentEmote;
            pointer.newStat = equipmentPieces.get('Right_hand').currentStat;
            pointer.newStattype = equipmentPieces.get('Right_hand').currentStattype;
            pointer.newLevel = equipmentPieces.get('Right_hand').currentLevel;
            pointer.newSlot = 'Left_hand';
          }
        }

          //Prepare Query n°3
          //In order to set the new equipment in the database
          i = 2;
          let oI = 0;
          let nI = 0;
          await Promise.all(equipmentPieces.map(async (value, key, map) => {

            if(value.newId && value.newId != value.currentId){
              if(value.newSlot == 'Right_hand'){newFieldValue+='\n__Right hand__';}
              else if(value.newSlot == 'Left_hand'){newFieldValue+='\n__Left hand__';}
              else if(value.newSlot == 'Dual_wield'){newFieldValue+='\n__Dual wield__';}
              else if(!nI){newFieldValue+='\n__Armor__';nI++;}
              if(value.currentId){
                query3 += `
                UPDATE equipment
                SET item_id = ${value.newId}
                WHERE slot = '${key}'
                AND player_id = ${message.author.id};
                `
                if(value.currentSlot == 'Right_hand'){oldFieldValue+='\n__Right hand__';}
                else if(value.currentSlot == 'Left_hand'){oldFieldValue+='\n__Left hand__';}
                else if(value.currentSlot == 'Dual_wield'){oldFieldValue+='\n__Dual wield__';}
                else if(!oI){oldFieldValue+='\n__Armor__';oI++;}

                oldFieldValue += `\n${bot.emojis.find('name', `${value.currentEmote}`)}\`LVL:${value.currentLevel}\` \`${value.currentStat}\`${bot.emojis.find('name', `${value.currentStattype}`)} *#${Base62.encode(value.currentId)}*`;
                newFieldValue += `\n${bot.emojis.find('name', `${value.newEmote}`)}\`LVL:${value.newLevel}\` \`${value.newStat}\`${bot.emojis.find('name', `${value.newStattype}`)} *#${Base62.encode(value.newId)}*`;
              }else{
                query3 += `
                INSERT INTO equipment(player_id, item_id, slot)
                VALUES(${message.author.id}, ${value.newId}, '${key}');
                `
                newFieldValue += `\n${bot.emojis.find('name', `${value.newEmote}`)}\`LVL:${value.newLevel}\` \`${value.newStat}\`${bot.emojis.find('name', `${value.newStattype}`)} *#${Base62.encode(value.newId)}*`;
              }
            }

          }))

          if(!oldFieldValue){
            oldFieldValue = '*No item was equiped*';
          }
          if(!newFieldValue){
            newFieldValue = '*No item has been equiped*';
          }

          const embed = new Discord.RichEmbed()
          .setAuthor(`${message.author.tag}'s equipment`, message.author.avatarURL)
          .setColor(0x96070b)
          .setTitle('Equipment changes:')
          //.setdescr all equipment has been changed/ ID ID not find blabla
          .addField('**Unequiped**', oldFieldValue, true)
          .addField('---->', '---->', true)
          .addField('**Equiped**', newFieldValue, true);


          console.log(query3);
          let res3 = await bot.dbquery(query3);
          if(!res3){
            message.channel.send(`${message.author} ->Holy... An unhandled error has occured`);
            return;
          }
          if(res3.rowCount){
            message.channel.send(`${message.author} ->`, embed);
          }else{
            message.channel.send(`${message.author} -> No item has been equiped`);
          }

        }else{
          message.channel.send(`${message.author} -> No weapons has been found, maybe you misspelled the ids !`);
        }


      }else{
        message.channel.send(errormsg);
      }


      //----------TODO-------------
      //PLayer can't equip high level items
      //Improve the command by showing the differences of stats
  },
}
