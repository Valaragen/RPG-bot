const config = require('../config.json')

module.exports =  {
  name: 'prefixe',
  description: 'Show the server prefix',
  usage: '<> or <new prefix>',
  async execute (message, args) {
    if(args.length){
      config.prefix = args[0]
      message.reply(`The server's new prefix is : ${config.prefix}`)
    }else{
      message.reply("The server's actual prefix is : " + config.prefix)
    }
  },
}
