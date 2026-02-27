const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { insertProfit, getConfig } = require('../db/database');
const { convertToUSD } = require('../utils/convert');

const data = new SlashCommandBuilder()
  .setName('logprofit')
  .setDescription('Log a profit to Nifty Workshop')
  .addStringOption((option) =>
    option
      .setName('currency')
      .setDescription('Profit currency')
      .setRequired(true)
      .addChoices(
        { name: 'USD', value: 'USD' },
        { name: 'ETH', value: 'ETH' },
        { name: 'SOL', value: 'SOL' }
      )
  )
  .addNumberOption((option) =>
    option.setName('amount').setDescription('Profit amount').setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName('collection')
      .setDescription('Collection name')
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName('share')
      .setDescription('Share this trade publicly?')
      .setRequired(true)
      .addChoices({ name: 'Yes', value: 'Yes' }, { name: 'No', value: 'No' })
  );

async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const username = interaction.user.username;
    const userId = interaction.user.id;
    const currency = interaction.options.getString('currency', true);
    const amount = interaction.options.getNumber('amount', true);
    const collection = interaction.options.getString('collection', true);
    const shareOption = interaction.options.getString('share', true);
    const share = shareOption === 'Yes' ? 1 : 0;

    const amountUsd = await convertToUSD(amount, currency);

    insertProfit({
      user_id: userId,
      username,
      currency,
      amount,
      amount_usd: amountUsd,
      collection,
      share,
    });

    if (shareOption === 'Yes') {
      const announceChannel = getConfig('announce_channel');

      if (announceChannel && announceChannel.trim()) {
        const channel = await interaction.client.channels.fetch(announceChannel.trim());

        if (channel && typeof channel.send === 'function') {
          const embed = new EmbedBuilder()
            .setTitle('Profit Logged! 💰')
            .setDescription('Log your profits using /logprofit')
            .addFields(
              { name: 'User', value: `<@${userId}>`, inline: true },
              { name: 'Collection', value: collection, inline: true },
              { name: 'Profit', value: `${amount} ${currency}`, inline: true },
              {
                name: 'Converted Profits',
                value: `$${amountUsd.toFixed(2)} USD`,
                inline: true,
              }
            )
            .setFooter({ text: 'Brought to you by Nifty Workshop' })
            .setColor(0x00ff88)
            .setTimestamp(new Date());

          await channel.send({ embeds: [embed] });
        }
      }
    }

    await interaction.editReply(`✅ Profit logged! ${amount} ${currency} = $${amountUsd.toFixed(2)} USD`);
  } catch (error) {
    console.error('Failed to log profit:', error);
    await interaction.editReply('❌ Could not log profit right now. Please try again.');
  }
}

module.exports = {
  data,
  execute,
};
