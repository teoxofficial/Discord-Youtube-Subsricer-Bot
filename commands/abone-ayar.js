const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('abone-ayar')
    .setDescription('Abone sistem ayarlarını yapılandırır (Sadece Yöneticiler)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option.setName('kanal')
        .setDescription('Abone ekran görüntülerinin paylaşılacağı kanal')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('rol')
        .setDescription('Abonelere verilecek rol')
        .setRequired(true))
    .addChannelOption(option =>
      option.setName('log-kanal')
        .setDescription('Abone kayıtlarının tutulacağı kanal')
        .setRequired(false)),
  async execute(interaction) {
    const channel = interaction.options.getChannel('kanal');
    const role = interaction.options.getRole('rol');
    const logChannel = interaction.options.getChannel('log-kanal');
    
    // Config güncelleme
    interaction.client.config.channelId = channel.id;
    interaction.client.config.roleId = role.id;
    
    if (logChannel) {
      interaction.client.config.logChannelId = logChannel.id;
    }
    
    // Config dosyasını güncelle
    const fs = require('fs');
    fs.writeFileSync('./config.json', JSON.stringify(interaction.client.config, null, 2));
    
    await interaction.reply({ 
      content: `✅ Abone sistemi ayarları güncellendi!\n- Abone Kanalı: ${channel}\n- Abone Rolü: ${role}\n- Log Kanalı: ${logChannel || 'Ayarlanmadı'}`,
      ephemeral: true 
    });
  },
};