# Discord YouTube Abone Doğrulama Botu

![Discord.js](https://img.shields.io/badge/Discord.js-14.14.1-blue.svg)  
![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)  
![License](https://img.shields.io/badge/License-MIT-yellow.svg)  

**Türkçe | English**

Discord sunucunuzda **YouTube kanalınıza abone olan kullanıcıları** otomatik olarak doğrulayan ve onlara özel roller veren gelişmiş bir Discord botu.

---

## ✨ Özellikler
- ✅ YouTube aboneliklerini otomatik doğrulama  
- 📸 Ekran görüntüsü **OCR (metin tanıma)** teknolojisi  
- 🎯 Otomatik rol verme sistemi  
- 📊 Detaylı loglama ve raporlama  
- ⚡ Slash komut desteği  
- 🔧 Kolay yapılandırma  
- 🛡️ Yetki ve güvenlik kontrolleri  

---

## 🚀 Kurulum

### Gereksinimler
- Node.js **16.0.0** veya üzeri  
- Discord hesabı ve sunucusu  
- YouTube API anahtarı   

### Adım Adım Kurulum
1. **Botu indirin ve kurun**
   ```bash
   git clone https://github.com/kullanici-adin/discord-abone-bot.git
   cd discord-abone-bot
   npm install
   ```

2. **Yapılandırma dosyasını düzenleyin**
   ```json
   {
     "token": "BOT_TOKENINIZ",
     "clientId": "BOT_CLIENT_ID",
     "guildId": "SUNUCU_ID",
     "channelId": "ABONE_KANAL_ID",
     "roleId": "ABONE_ROL_ID",
     "logChannelId": "LOG_KANAL_ID",
     "youtubeApiKey": "YOUTUBE_API_ANAHTARINIZ",
     "youtubeChannelId": "YOUTUBE_KANAL_ID",
     "allowedFormats": [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"],
     "maxFileSize": 10,
     "cooldownTime": 30
   }
   ```

3. **Slash komutlarını kaydedin**
   ```bash
   node deploy-commands.js
   ```

4. **Botu başlatın**
   ```bash
   node index.js
   ```

---

## ⚙️ Yapılandırma

### Gerekli Bilgiler
- **Discord Bot Token**: [Discord Developer Portal](https://discord.com/developers/applications) üzerinden alınır  
- **YouTube API Key**: [Google Cloud Console](https://console.cloud.google.com/) üzerinden alınır  
- **Kanal ID'leri**: Discord geliştirici modu açıkken alınır  

### YouTube API Kurulumu
1. Google Cloud Console'da proje oluşturun  
2. **YouTube Data API v3**'ü etkinleştirin  
3. API anahtarı oluşturun  
4. Anahtarı `config.json` dosyasına ekleyin  

---

## 🎮 Kullanım

### Kullanıcılar İçin
- Botun belirlediği kanala **YouTube aboneliğinizin ekran görüntüsünü** atın  
- Bot otomatik olarak ekran görüntüsünü doğrular  
- Başarılı olursa size **otomatik olarak rol verilir**  

### Yöneticiler İçin

#### Slash Komutları
- `/abone-durum` → Abone durumunuzu kontrol eder  
- `/abone-ayar` → Abone sistem ayarlarını yapılandırır *(Yöneticiler)*  
- `/format-ayar` → İzin verilen dosya formatlarını ayarlar *(Yöneticiler)*  

---

## 🛠️ Geliştirme

### Komut Ekleme
Yeni slash komutları eklemek için:  
- `commands` klasörüne yeni bir `.js` dosyası oluşturun  
- Şu şablonu kullanın:

```javascript
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('komut-adi')
    .setDescription('Komut açıklaması'),
  async execute(interaction) {
    // Komut işlemleri
  },
};
```

- Komutları yeniden deploy edin:
  ```bash
  node deploy-commands.js
  ```

### Özelleştirme
- **index.js** → Ana bot mantığı  
- **config.json** → Yapılandırma ayarları  
- **commands/** → Slash komutları  

---

## ❗ Sorun Giderme

- **"Botun rol verme yetkisi yok" hatası**  
  ➝ Botun rolünü en üste taşıyın ve "Rolleri Yönet" yetkisi verin  

- **OCR doğrulama çalışmıyor**  
  ➝ Ekran görüntüsünün net ve okunaklı olduğundan emin olun  

- **Slash komutlar görünmüyor**  
  ➝ `node deploy-commands.js` komutunu tekrar çalıştırın  

---

## 📞 Destek
- GitHub Issues bölümünü kullanabilirsiniz  
- Discord : [sterzaofficial]  

---

## 🤝 Katkıda Bulunma
1. Bu repoyu **fork** edin  
2. Feature branch oluşturun  
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. Değişikliklerinizi commit edin  
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. Branch'inizi push edin  
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Pull Request** açın  
