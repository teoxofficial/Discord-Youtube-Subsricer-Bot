const { Client, GatewayIntentBits, Collection, EmbedBuilder, PermissionsBitField } = require('discord.js');
const config = require('./config.json');
const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions
  ]
});

// Config'i client'a ekle
client.config = config;

// Komutları yükle
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// Doğrulama yapılan kullanıcıları saklamak için
const verifiedUsers = new Set();
// Cooldown için
const cooldown = new Set();
// Doğrulama süreçleri için
const verificationProcesses = new Map();

// Doğrulama geçmişini yükle
try {
  const data = fs.readFileSync('verifiedUsers.json', 'utf8');
  const parsedData = JSON.parse(data);
  parsedData.forEach(userId => verifiedUsers.add(userId));
  console.log(`Geçmişte doğrulanmış ${parsedData.length} kullanıcı yüklendi.`);
} catch (error) {
  console.log('Doğrulama geçmişi dosyası bulunamadı, yeni oluşturulacak.');
}

client.once('ready', () => {
  console.log(`✅ ${client.user.tag} olarak giriş yapıldı!`);
  console.log(`📺 Abone kanalı: ${config.channelId}`);
  console.log(`🎯 Verilecek rol: ${config.roleId}`);
  console.log(`📷 İzin verilen formatlar: ${config.allowedFormats.join(', ')}`);
  
  // Botun yetkilerini kontrol et
  const guild = client.guilds.cache.get(config.guildId);
  if (guild) {
    const botMember = guild.members.cache.get(client.user.id);
    if (botMember) {
      console.log(`🔐 Bot yetkileri: ${botMember.permissions.toArray().join(', ')}`);
      
      // Rol verme yetkisi kontrolü
      if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        console.log('❌ Botun rol yönetme yetkisi yok!');
      } else {
        console.log('✅ Botun rol yönetme yetkisi var.');
      }
    }
  }
});

// Slash komut işleyici
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ 
      content: '❌ Bu komutu çalıştırırken bir hata oluştu!', 
      ephemeral: true 
    });
  }
});

// YouTube abonelik doğrulama fonksiyonu
async function verifyYouTubeSubscription(userId, youtubeChannelId) {
  try {
    // API anahtarı yoksa geçici olarak true döndür
    if (!config.youtubeApiKey || config.youtubeApiKey === "YOUTUBE_API_ANAHTARINIZ") {
      console.log("YouTube API anahtarı bulunamadı, geçici olarak doğrulama atlanıyor");
      return true;
    }
    
    // Gerçek API entegrasyonu burada olacak
    // Şimdilik her zaman true döndürüyoruz
    return true;
  } catch (error) {
    console.error('YouTube API hatası:', error);
    return false;
  }
}

// OCR ile ekran görüntüsünden metin çıkarma
async function extractTextFromImage(imageUrl) {
  try {
    console.log('OCR işlemi başlatılıyor:', imageUrl);
    
    const { data: { text } } = await Tesseract.recognize(
      imageUrl,
      'tur+eng', // Türkçe ve İngilizce
      { logger: m => console.log('OCR Durumu:', m.status) }
    );
    
    console.log('OCR ile çıkarılan metin:', text.substring(0, 100) + '...');
    return text.toLowerCase();
  } catch (error) {
    console.error('OCR hatası:', error);
    return '';
  }
}

// Ekran görüntüsünü doğrula
async function validateScreenshot(imageUrl, userId) {
  try {
    // OCR ile metni çıkar
    const extractedText = await extractTextFromImage(imageUrl);
    
    // Doğrulama kriterleri - daha esnek hale getirildi
    const youtubeChannelName = ""; // KENDİ KANAL ADINIZI BURAYA YAZIN
    const hasSubscribeButton = extractedText.includes('abone ol') || 
                              extractedText.includes('subscribe') ||
                              extractedText.includes('abone') ||
                              extractedText.includes('subscriber');
    
    const hasSubscriberCount = (/\d+/.test(extractedText) && 
                              (extractedText.includes('abone') || 
                               extractedText.includes('subscriber')));
    
    const hasChannelName = extractedText.includes(youtubeChannelName.toLowerCase()) ||
                          extractedText.includes('') || // Kısmi eşleşme
                          extractedText.includes('');   // Kısmi eşleşme
    
    // YouTube API ile abonelik doğrulama
    const isSubscribed = await verifyYouTubeSubscription(userId, config.youtubeChannelId);
    
    return {
      isValid: hasSubscribeButton && hasSubscriberCount && hasChannelName && isSubscribed,
      details: {
        hasSubscribeButton,
        hasSubscriberCount,
        hasChannelName,
        isSubscribed,
        extractedText: extractedText.substring(0, 200) + '...' // İlk 200 karakter
      }
    };
  } catch (error) {
    console.error('Doğrulama hatası:', error);
    return { isValid: false, details: { error: error.message } };
  }
}

client.on('messageCreate', async (message) => {
  // Bot mesajlarını ve belirlenmemiş kanallardaki mesajları yoksay
  if (message.author.bot || message.channel.id !== config.channelId) return;

  // Cooldown kontrolü
  if (cooldown.has(message.author.id)) {
    const reply = await message.reply(`⏰ Çok hızlı gönderi yapıyorsunuz. Lütfen ${config.cooldownTime} saniye bekleyin.`);
    setTimeout(() => {
      message.delete().catch(error => {
        if (error.code !== 10008) console.error('Mesaj silme hatası:', error);
      });
      reply.delete().catch(error => {
        if (error.code !== 10008) console.error('Mesaj silme hatası:', error);
      });
    }, 5000);
    return;
  }

  // Cooldown ekle
  cooldown.add(message.author.id);
  setTimeout(() => {
    cooldown.delete(message.author.id);
  }, config.cooldownTime * 1000);

  // Kullanıcı zaten doğrulanmış mı kontrol et
  if (verifiedUsers.has(message.author.id)) {
    try {
      const reply = await message.reply('❌ Zaten abone olduğunuz doğrulanmış. Tekrar göndermenize gerek yok.');
      setTimeout(() => {
        message.delete().catch(error => {
          if (error.code !== 10008) console.error('Mesaj silme hatası:', error);
        });
        reply.delete().catch(error => {
          if (error.code !== 10008) console.error('Mesaj silme hatası:', error);
        });
      }, 5000);
    } catch (error) {
      console.error('Mesaj silme hatası:', error);
    }
    return;
  }

  // Mesajda ekran görüntüsü var mı kontrol et
  if (message.attachments.size > 0) {
    let hasValidScreenshot = false;
    let invalidReasons = [];

    for (const attachment of message.attachments.values()) {
      // Dosya boyutu kontrolü (MB cinsinden)
      const fileSizeMB = attachment.size / (1024 * 1024);
      if (fileSizeMB > config.maxFileSize) {
        invalidReasons.push(`Dosya boyutu çok büyük (${fileSizeMB.toFixed(2)}MB). Maksimum: ${config.maxFileSize}MB`);
        continue;
      }

      // Dosya uzantısı kontrolü
      const fileExtension = path.extname(attachment.name).toLowerCase();
      if (!config.allowedFormats.includes(fileExtension)) {
        invalidReasons.push(`Geçersiz dosya formatı: ${fileExtension}. İzin verilen formatlar: ${config.allowedFormats.join(', ')}`);
        continue;
      }

      // Eğer buraya geldiyse, geçerli bir ekran görüntüsü var
      hasValidScreenshot = true;
      
      // Doğrulama sürecini başlat
      const processingMessage = await message.reply('🔍 Ekran görüntüsü doğrulanıyor, lütfen bekleyin... Bu işlem biraz zaman alabilir.');
      verificationProcesses.set(message.author.id, true);
      
      try {
        // Ekran görüntüsünü doğrula
        const validationResult = await validateScreenshot(attachment.url, message.author.id);
        
        if (validationResult.isValid) {
          // Kullanıcıya rol ver
          const role = message.guild.roles.cache.get(config.roleId);
          if (role) {
            try {
              // Botun yetkilerini kontrol et
              const botMember = message.guild.members.cache.get(client.user.id);
              if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
                throw new Error('Botun rol yönetme yetkisi yok');
              }
              
              // Rol hiyerarşisini kontrol et
              const botHighestRole = botMember.roles.highest;
              if (botHighestRole.position <= role.position) {
                throw new Error('Botun rolü, vermek istediği rolden daha düşük veya eşit');
              }
              
              await message.member.roles.add(role);
              
              // Doğrulama başarılı
              verifiedUsers.add(message.author.id);
              
              // verifiedUsers.json dosyasını güncelle
              fs.writeFileSync('verifiedUsers.json', JSON.stringify(Array.from(verifiedUsers), null, 2));
              
              await message.react('✅');
              await processingMessage.edit('✅ Aboneliğiniz başarıyla doğrulandı! Rol verildi.');
              
              const successEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('Abonelik Doğrulandı')
                .setDescription(`${message.author} YouTube aboneliği başarıyla doğrulandı!`)
                .addFields(
                  { name: 'Kullanıcı', value: `${message.author.tag} (${message.author.id})`, inline: true },
                  { name: 'Tarih', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setThumbnail(message.author.displayAvatarURL())
                .setFooter({ text: 'Abone Sistemi', iconURL: client.user.displayAvatarURL() });
              
              // Log kanalına embed gönder
              if (config.logChannelId) {
                const logChannel = message.guild.channels.cache.get(config.logChannelId);
                if (logChannel) {
                  await logChannel.send({ embeds: [successEmbed] });
                }
              }
              
              // Kullanıcıya özel mesaj gönder
              try {
                const dmEmbed = new EmbedBuilder()
                  .setColor(0x00FF00)
                  .setTitle('Abonelik Doğrulandı')
                  .setDescription('YouTube aboneliğiniz başarıyla doğrulandı!')
                  .addFields(
                    { name: 'Sunucu', value: message.guild.name, inline: true },
                    { name: 'Verilen Rol', value: role.name, inline: true }
                  )
                  .setFooter({ text: 'Teşekkür ederiz!', iconURL: message.guild.iconURL() });
                
                await message.author.send({ embeds: [dmEmbed] });
              } catch (dmError) {
                console.log('Kullanıcıya DM gönderilemedi:', dmError);
              }
            } catch (roleError) {
              console.error('Rol verme hatası:', roleError);
              
              let errorMessage = '❌ Rol verilirken bir hata oluştu. Lütfen bir yöneticiyle iletişime geçin.';
              
              if (roleError.code === 50013 || roleError.message.includes('yetkisi yok')) {
                errorMessage = '❌ Botun rol verme yetkisi yok. Lütfen sunucu ayarlarını kontrol edin.';
              } else if (roleError.code === 10011 || roleError.message.includes('bulunamadı')) {
                errorMessage = '❌ Rol bulunamadı. Lütfen yöneticilere bildirin.';
              } else if (roleError.message.includes('düşük veya eşit')) {
                errorMessage = '❌ Botun rolü, vermek istediği rolden daha düşük. Lütfen botun rolünü yükseltin.';
              }
              
              await processingMessage.edit(errorMessage);
              
              // Hata detaylarını log kanalına gönder
              if (config.logChannelId) {
                try {
                  const logChannel = message.guild.channels.cache.get(config.logChannelId);
                  if (logChannel) {
                    const errorEmbed = new EmbedBuilder()
                      .setColor(0xFF0000)
                      .setTitle('Rol Verme Hatası')
                      .setDescription(`Kullanıcı: ${message.author.tag} (${message.author.id})`)
                      .addFields(
                        { name: 'Hata Kodu', value: roleError.code || 'Bilinmiyor', inline: true },
                        { name: 'Hata Mesajı', value: roleError.message || 'Bilinmiyor', inline: true },
                        { name: 'Rol', value: role?.name || 'Bilinmiyor', inline: true }
                      )
                      .setFooter({ text: 'Abone Sistemi Hatası', iconURL: client.user.displayAvatarURL() });
                    
                    await logChannel.send({ embeds: [errorEmbed] });
                  }
                } catch (logError) {
                  console.error('Log kanalına yazma hatası:', logError);
                }
              }
            }
          } else {
            await processingMessage.edit('❌ Abone rolü bulunamadı. Lütfen bir yöneticiyle iletişime geçin.');
          }
        } else {
          // Daha ayrıntılı hata mesajı
          const errorDetails = `
❌ Geçerli bir YouTube aboneliği ekran görüntüsü değil. 

**Lütfen şunları kontrol edin:**
1. 📷 Ekran görüntüsü net ve okunaklı olmalı
2. 📺 Kanal adı görünür olmalı: "Sumeci Yine Pethak"
3. 🔔 "Abone Ol" butonu görünmeli
4. 👥 Abone sayısı görünmeli

**Doğrulama detayları:**
- Kanal adı: ${validationResult.details.hasChannelName ? '✅' : '❌'}
- Abone butonu: ${validationResult.details.hasSubscribeButton ? '✅' : '❌'} 
- Abone sayısı: ${validationResult.details.hasSubscriberCount ? '✅' : '❌'}
- YouTube API doğrulama: ${validationResult.details.isSubscribed ? '✅' : '❌'}

Ekran görüntüsü örneği için: [örnek görüntü linki ekleyin]
          `;
          
          await processingMessage.edit(errorDetails);
          
          // Hata detaylarını logla
          console.log('Doğrulama başarısız:', validationResult.details);
        }
      } catch (error) {
        console.error('Doğrulama hatası:', error);
        await processingMessage.edit('❌ Doğrulama sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      } finally {
        verificationProcesses.delete(message.author.id);
        // İşlem mesajını 30 saniye sonra sil (hata kontrolü ile)
        setTimeout(async () => {
          try {
            await processingMessage.delete();
          } catch (deleteError) {
            if (deleteError.code !== 10008) { // Unknown Message hatası değilse
              console.error('Mesaj silme hatası:', deleteError);
            }
            // Unknown Message hatasını görmezden gel
          }
        }, 30000);
      }
      
      break; // Sadece ilk geçerli ekran görüntüsünü işle
    }

    if (!hasValidScreenshot) {
      const errorMessage = invalidReasons.length > 0 
        ? `❌ Geçersiz ekran görüntüsü:\n- ${invalidReasons.join('\n- ')}\n\nİzin verilen formatlar: ${config.allowedFormats.join(', ')}\nMaksimum dosya boyutu: ${config.maxFileSize}MB`
        : '❌ Lütfen geçerli bir ekran görüntüsü paylaşın.';
      
      const warning = await message.reply(errorMessage);
      setTimeout(() => {
        message.delete().catch(error => {
          if (error.code !== 10008) console.error('Mesaj silme hatası:', error);
        });
        warning.delete().catch(error => {
          if (error.code !== 10008) console.error('Mesaj silme hatası:', error);
        });
      }, 10000);
    }
  } else {
    const warning = await message.reply('❌ Lütfen YouTube aboneliğinizin ekran görüntüsünü paylaşın.');
    setTimeout(() => {
      message.delete().catch(error => {
        if (error.code !== 10008) console.error('Mesaj silme hatası:', error);
      });
      warning.delete().catch(error => {
        if (error.code !== 10008) console.error('Mesaj silme hatası:', error);
      });
    }, 5000);
  }
});

// Botu çalıştır
client.login(config.token).catch(console.error);

// Hata yönetimi
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});