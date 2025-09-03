const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
    console.log(`✅ ${file} komutu yüklendi`);
  } else {
    console.log(`❌ ${file} komutunda "data" veya "execute" özelliği eksik`);
  }
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`📋 ${commands.length} adet slash komutu kaydediliyor...`);

    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );

    console.log(`✅ ${data.length} adet slash komutu başarıyla kaydedildi!`);
    
    // Komutları listele
    data.forEach((cmd, index) => {
      console.log(`${index + 1}. /${cmd.name} - ${cmd.description}`);
    });
    
  } catch (error) {
    console.error('❌ Komutlar kaydedilirken hata oluştu:', error);
  }
})();