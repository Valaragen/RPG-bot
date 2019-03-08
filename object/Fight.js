const config = require('../config.json')

fightnames = ['Froggy', 'Wolf', 'The mighty doggo', 'Tommy the cat', 'Shaaawn the thief', 'Rat', 'Wyvern', 'Bat',
'Mercenary', 'Hobo']



module.exports = class Fight {

  constructor(message, zone){
    this.zone = zone;
    this.level = Math.floor(Math.random() * (10 - 1) + 1);
    this.name = fightnames[Math.floor(Math.random() * (fightnames.length - 1))];
    this.hp = Math.floor((100 + this.level) * 1.3);
  }

  detail(mention){
    return `${(mention ? mention : ' ')}
      You fight against ${this.name}
      HP : ${this.hp}
      lvl : ${this.level}
      `;
  }

  fight(){

  }


}
