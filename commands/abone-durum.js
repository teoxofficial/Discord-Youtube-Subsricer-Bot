const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('abone-durum')
    .setDescription('Abone durumunuzu kontrol eder'),
  async execute(interaction) {
    const member = interaction.member;
    const aboneRolu = interaction.guild.roles.cache.get(interaction.client.config.roleId);
    
    if (member.roles.cache.has(aboneRolu.id)) {
      await interaction.reply({ content: '✅ Zaten abone rolünüz bulunuyor!', ephemeral: true });
    } else {
      await interaction.reply({ 
        content: '❌ Henüz abone rolünüz yok. Lütfen YouTube kanalımıza abone olun ve ekran görüntüsünü ilgili kanala gönderin.', 
        ephemeral: true 
      });
    }
  },
};
