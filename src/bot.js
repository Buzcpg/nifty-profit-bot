require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
} = require('discord.js');
const logProfitCommand = require('./commands/logprofit');

const token = process.env.DISCORD_TOKEN;

if (!token) {
  throw new Error('DISCORD_TOKEN is required to start the bot');
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log('✅ Nifty Workshop Bot online as', client.user.tag);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  if (interaction.commandName === 'logprofit') {
    await logProfitCommand.execute(interaction);
  }
});

client.login(token);
