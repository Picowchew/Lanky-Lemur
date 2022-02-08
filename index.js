const { Client, Intents, MessageEmbed } = require('discord.js');
const { PREFIX, TOKEN, GUILD_ID, USER_ID, CLOCK, CODING, CROSSMARK } = require('./config.json');
const fs = require('fs');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

function time_str_from_millisec(millisec) {
  const days = Math.floor(millisec / 86400000);
  const hours = Math.floor(millisec / 3600000) % 24;
  const minutes = Math.floor(millisec / 60000) % 60;
  const seconds = Math.floor(millisec / 1000) % 60;
  let msg = `${seconds}s`;
  if (minutes || hours || days) {
    msg = `${minutes}m, ` + msg;
    if (hours || days) {
      msg = `${hours}h, ` + msg;
      if (days) {
        msg = `${days}d, ` + msg;
      }
    }
  }
  return msg;
}

client.once('ready', async () => {
  console.log(`${client.user.tag}\n${client.user.id}\n${Date()}\n===== Logged in successfully =====`);
  client.user.setActivity(`you | ${PREFIX}list`, { type: 'WATCHING' });
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  const msg = message.content.toLowerCase();
  const author_id_str = message.author.id.toString();
  let data = JSON.parse(fs.readFileSync('data.json'));

  if (!(message.channel.type === 'dm' || msg.startsWith(PREFIX))) {
    if (msg.startsWith('pls ')) {
      const arg = msg.split(' ')[1];
      if (!Object.keys(data['default']).includes(arg)) return;
      const now = Date.now();
      if (!Object.keys(data).includes(author_id_str)) {
        data[author_id_str] = JSON.parse(JSON.stringify(data['default']));
        for (const key in data[author_id_str]) {
          data[author_id_str][key] = key === arg ? now : 0;
        }
        fs.writeFile('data.json', JSON.stringify(data, null, '  '), err => {
          if (err) console.error(err);
        });
      } else if (!(data[author_id_str][arg] && now - data[author_id_str][arg] < data['default'][arg] * 1000)) {
        data[author_id_str][arg] = now;
        fs.writeFile('data.json', JSON.stringify(data, null, '  '), err => {
          if (err) console.error(err);
        });
      }
    }
    return;
  }

  const command = msg.startsWith(PREFIX) ? msg.slice(PREFIX.length) : msg;

  if ((command.startsWith('clear ') || command.startsWith('clearf')) && !(message.channel.type === 'dm') && message.guild.id === GUILD_ID && USER_ID.includes(author_id_str)) {
    const clear_split = msg.split(' ');
    if (clear_split.length === 2) {
      const num = clear_split[1];
      if (isNaN(num)) {
        await message.channel.send(`${CROSSMARK} Not a valid number.`);
      } else if (num < 1) {
        await message.channel.send(`${CROSSMARK} Number must be at least 1.`);
      } else {
        if (num >= 100) messages_limit = 100;
        else messages_limit = parseInt(num, 10) + 1;
        if (command.startsWith('clear ')) {
          await message.channel.bulkDelete(messages_limit, true).catch(err => console.error(err));
        } else {
          const msgs = await message.channel.messages.fetch({limit: messages_limit});
          for (const msg of msgs) {
            await msg[1].delete();
          }
        }
      }
    } else {
      await message.channel.send(`${CROSSMARK} Too many arguments provided.`);
    }
  } else if (['available', 'a'].includes(command)) {
    let embed = new MessageEmbed()
      .setColor('#1cb2fc') // Blue
      .setTitle('Available Commands');
    if (!Object.keys(data).includes(author_id_str)) {
      embed.setDescription('Information will be ready soon!');
    } else {
      let available = []
      const now = Date.now();
      for (const key in data[author_id_str]) {
        if (data[author_id_str][key] && now - data[author_id_str][key] >= data['default'][key] * 1000) {
          available.push(key)
        }
      }
      if (available.length) {
        embed.setDescription(`\`${available.join('`, `')}\``)
      } else {
        embed.setDescription('Information will be ready soon!');
      }
    }
    await message.channel.send({ embeds: [embed] });
  } else if (command === 'all') {
    let embed = new MessageEmbed()
      .setColor('#bd52f7') // Purple
      .setTitle('All Commands');
    if (!Object.keys(data).includes(author_id_str)) {
      embed.setDescription('Information will be ready soon!');
    } else {
      const now = Date.now();
      for (const key in data[author_id_str]) {
        if (!data[author_id_str][key]) {
          embed.addField(key, 'Information will be ready soon!', true);
        } else if (now - data[author_id_str][key] < data['default'][key] * 1000) {
          embed.addField(key, time_str_from_millisec(data['default'][key] * 1000 - (now - data[author_id_str][key])), true);
        } else {
          embed.addField(key, 'Available!', true);
        }
      }
    }
    await message.channel.send({ embeds: [embed] });
  } else if (['github', 'git'].includes(command)) {
    await message.channel.send(`${CODING} GitHub repository URL is <https://github.com/Picowchew/Lanky-Lemur>.`);
  } else if (command === 'list') {
    const list_embed = new MessageEmbed()
      .setColor('#4fde1f') // Green
      .setDescription(`Prefix is \`${PREFIX}\`.`)
      .addFields(
        { name: 'List of Commands', value: 'all, available/a, clear, clearf, github/git, list, uptime' }
      );
    await message.channel.send({ embeds: [list_embed] });
  } else if (command === 'uptime') {
    await message.channel.send(`${CLOCK} Uptime is **` + time_str_from_millisec(client.uptime) + '**.');
  }
});

client.login(TOKEN);
