const Discord = require('discord.js')
const Postgre = require("pg")
const config = require('./config.json')
const fs = require('fs');
const pgpool = new Postgre.Pool(config.db)

bot = new Discord.Client()

const cooldowns = new Discord.Collection();


//Create a collection for the bot commands
bot.commands = new Discord.Collection();

//Get all the bot commands
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  // set a new item in the Collection
  // with the key as the command name and the value as the exported module
  bot.commands.set(command.name, command);
}


//Add a fonction to the bot client that connect to the database and execute the query in async mode
bot.dbquery = async (query, args) => {
  let pgclient
  try {
    // console.log(query);
    // console.log(args);
    pgclient = await pgpool.connect();
    console.log("Client created");
  } catch(e) {
    console.error(e.stack);
  }
  console.log(`=============== Executing query ===============`);
  let res = false;
  await pgclient.query('BEGIN')
  .then( async () => {
    res = await pgclient.query(query, args)
    .then((result) => {
      pgclient.query('COMMIT');
      console.log("QUERY WORKED");
      return result;
    })
    .catch((err) => {
      pgclient.query('ROLLBACK');
      console.error(err.stack);
      console.log("QUERY ERROR");
      return false;
    })
  })
  .catch((err) =>{
    console.log(err.stack);
    console.log("BEGIN ERROR");
  })
  .then(() => {
    pgclient.release();
    console.log("Client released");
  })
  console.log(`============= Query execution end =============`)
  return res
}


//Is executed when the bot as successfully log-on
bot.on('ready', function(){

  //Define bot's 'game' and icon

  //bot.user.setAvatar('./images/items/unique_shield.png').catch(console.error)
  //bot.user.setActivity(`Est inutile sur ${bot.guilds.size} serveur`).catch(console.error)

  //Liste les id des serveurs ou se trouve le bot
  bot.guilds.forEach(function(element){
    console.log(element.id);
  })
  console.log('ready');
})

bot.on('error', function(err){
  console.log('error' + err);
})

bot.on('message', function(message){
  //Check if the message is a command send by a valid user
  if(!message.content.startsWith(config.prefix) || message.author.bot) return;

  //Get the command name and the argument(s)
  const args = message.content.slice(config.prefix.length).split(/ +/);
  const commandName = args.shift().toLowerCase();

  //Check if the command or the aliases exists
  const command = bot.commands.get(commandName)
  || bot.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

  if (!command) return;


  //Check if the command need an argument
  if (command.args && !args.length) {
    let reply = `You didn't provide any arguments, ${message.author}!`;

    if (command.usage) {
      reply += `\nThe proper usage would be: \`${config.prefix}${command.name} ${command.usage}\``;
    }
    return message.channel.send(reply);
  }

  //Check if the command is usable in DMs
  if (command.guildOnly && message.channel.type !== 'text') {
    return message.reply('I can\'t execute that command inside DMs!');
  }

  //Check if the cooldowns Collection has the command set in it yet.
  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Discord.Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || config.defaultcd) * 1000;

  if (!timestamps.has(message.author.id)) {
    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
  }
  else {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
    }

    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
  }

  try {
    command.execute(message, args);
  }
  catch (error) {
    console.error(error)
    message.reply('there was an error trying to execute that command!')
  }

})




bot.login(config.login)
