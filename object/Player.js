const config = require('../config.json');
const Discord = require('discord.js')

module.exports = class Player {

  constructor(name, hp, lvl){

  }

  async getFromDb(player_id){
    if(!player_id){
      console.log('PLAYER CONSTRUCTOR ERROR : player_id is undefined');
      return false;
    }
    let query =
    `SELECT name, max_health, level, exp
    FROM player
    WHERE player_id = $1`;
    let res = await bot.dbquery(query, [player_id]);
    if(!res){
      console.log('PLAYER CONSTRUCTOR ERROR : Database query error!')
      this.ERR = config.ERR_DATABASEQUERY;
      return this;
    }
    if(res.rows.length){
      this.player_id = player_id;
      this.name = res.rows[0]['name'];
      this.max_health = res.rows[0]['max_health'];
      this.current_health = this.max_health;
      this.level = res.rows[0]['level'];
      this.exp = res.rows[0]['exp'];
      return this;
    }else{
      console.log(`PLAYER CONSTRUCTOR ERROR : Can't find a player with the id -> ${player_id}`);
      this.ERR = config.ERR_QUERYNORESULT;
      return this;
    };
    return this;
  }


}
