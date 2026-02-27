require('dotenv').config();

const { REST, Routes } = require('discord.js');
const logProfitCommand = require('./logprofit');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

if (!token) {
  throw new Error('DISCORD_TOKEN is required to register commands');
}

if (!clientId) {
  throw new Error('DISCORD_CLIENT_ID is required to register commands');
}

const rest = new REST({ version: '10' }).setToken(token);
const commands = [logProfitCommand.data.toJSON()];

async function registerCommands() {
  await rest.put(Routes.applicationCommands(clientId), { body: commands });
  console.log('✅ Registered global slash commands');
}

registerCommands().catch((error) => {
  console.error('❌ Failed to register slash commands:', error);
  process.exitCode = 1;
});
