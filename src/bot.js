require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
} = require('discord.js');
const logProfitCommand = require('./commands/logprofit');
const { getAllStats, getConfig } = require('./db/database');

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

  const updateProfitNickname = async () => {
    const enabled = getConfig('profit_name_enabled') === 'true';
    const guildId = getConfig('profit_name_guild_id');

    if (!enabled || !guildId) {
      return;
    }

    try {
      const stats = getAllStats();
      const nickname = `💰 $${stats.total_profit_usd.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} total`;
      const guild = await client.guilds.fetch(guildId);

      if (!guild.members.me) {
        await guild.members.fetchMe();
      }

      if (!guild.members.me) {
        console.error('Could not resolve bot member for guild', guildId);
        return;
      }

      await guild.members.me.setNickname(nickname);
    } catch (error) {
      console.error('Failed to update profit name nickname:', error);
    }
  };

  updateProfitNickname();
  setInterval(updateProfitNickname, 6 * 60 * 1000);
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
