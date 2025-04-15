# Royal-Selfbot

> **⚠️ EXTREME WARNING: USE AT YOUR OWN RISK! ⚠️**  
> Using self-bots violates Discord's Terms of Service and can lead to the **permanent suspension** of your Discord account without warning. This project is for **educational purposes only** to demonstrate API interactions.  
> **DO NOT USE THIS FOR MALICIOUS PURPOSES OR TO VIOLATE DISCORD'S TOS.**  
> The maintainers are not responsible for any action taken against your account.

---

<div align="center">

<img src="https://img.shields.io/npm/v/royal-selfbot?color=blue&style=flat-square" alt="npm version" />
<img src="https://img.shields.io/github/license/royal-selfbot/royal-selfbot?style=flat-square" alt="license" />
<img src="https://img.shields.io/badge/Node.js-%3E=16.0.0-green?style=flat-square" alt="node version" />

</div>

---

<div align="center">

<img src="https://user-images.githubusercontent.com/royal-selfbot/banner.png" alt="Royal Selfbot Banner" width="80%" />

</div>

---

Royal-Selfbot is an experimental Node.js library for interacting with the Discord API using a user account (self-bot). It aims to provide a familiar structure similar to libraries like discord.js, but adapted for user tokens. Includes support for `@discordjs/voice`.

---

## 🚀 Setup

### ⚠️ Obtain Your User Token

This is the riskiest step. You typically need to extract it from the Discord web client's developer tools (Network or Application > Local Storage tab).  
**NEVER SHARE YOUR TOKEN.** It grants full access to your account.

---

### 1. Create a `.env` file

In your project's root directory, add your token:

```env
# .env
DISCORD_USER_TOKEN=YOUR_DISCORD_USER_TOKEN_HERE
```

---

## 📦 Installation

```bash
npm install royal-selfbot @discordjs/voice ws axios dotenv libsodium-wrappers
# or
yarn add royal-selfbot @discordjs/voice ws axios dotenv libsodium-wrappers
```

---

## 🛠️ Basic Usage Example

```js
// example.js
require('dotenv').config();
const { Client } = require('royal-self'); // Use the actual package name if installed

const client = new Client();

client.on('ready', (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}!`);
    console.log(`Watching ${readyClient.guilds.cache.size} guilds.`);
});

client.on('messageCreate', async (message) => {
    // Ignore messages from self
    if (message.author?.id === client.user?.id) return;

    console.log(`[${message.guild?.name || 'DM'}] #${message.channel?.name || 'DM'}: ${message.author?.tag}: ${message.content}`);

    // Simple ping command
    if (message.content.toLowerCase() === '!selfping') {
        try {
            const replyMsg = await message.reply('Pong!');
            console.log(`Sent reply: "${replyMsg.content}"`);
        } catch (err) {
            console.error("Failed to send reply:", err);
        }
    }

    // Example: Get user info
    if (message.content.toLowerCase() === '!myinfo') {
         try {
             await message.channel.send(`Your Tag: ${message.author.tag}\nYour ID: ${message.author.id}`);
         } catch (err) {
             console.error("Failed to send user info:", err);
         }
    }
});

client.on('error', (error) => {
    console.error('[Client Error]', error);
});

console.log("Logging in...");
client.login(process.env.DISCORD_USER_TOKEN)
    .then(() => {
        console.log("Login successful, client is ready.");
    })
    .catch(error => {
        console.error("Login failed:", error);
        process.exit(1);
    });
```

---

## 🔊 Voice Usage (Limited for User Tokens)

> **Note:** Programmatically joining voice channels using `joinVoiceChannel` is **blocked by Discord for user tokens** and will likely fail or cause errors if enabled in `VoiceManager`.

The library includes the necessary `voiceAdapterCreator` for `@discordjs/voice` integration if you were using a bot token or if you find alternative (likely unsupported/risky) methods to establish the voice connection.

**Conceptual Example (will likely fail with user tokens):**

```js
// --- THIS WILL LIKELY FAIL WITH USER TOKENS DUE TO DISCORD RESTRICTIONS ---
// const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
// const TARGET_GUILD_ID = 'YOUR_GUILD_ID';
// const TARGET_VOICE_CHANNEL_ID = 'YOUR_VC_ID';

// client.on('ready', async (readyClient) => {
//   console.log(`Logged in as ${readyClient.user.tag}!`);
//   const guild = readyClient.guilds.cache.get(TARGET_GUILD_ID);
//   const channel = guild?.channels.cache.get(TARGET_VOICE_CHANNEL_ID);

//   if (guild && channel && channel.isVoice()) { // Assuming isVoice() method exists
//     try {
//       console.log(`Attempting to join voice channel ${channel.name}...`);
//       const connection = joinVoiceChannel({
//         channelId: channel.id,
//         guildId: guild.id,
//         adapterCreator: guild.voiceAdapterCreator, // Uses the library's adapter
//       });

//       connection.on(VoiceConnectionStatus.Ready, () => {
//         console.log(`Voice connection Ready in ${channel.name}!`);
//         // Example: Play silence or audio
//         // const player = createAudioPlayer();
//         // connection.subscribe(player);
//         // const resource = createAudioResource(/* ... */);
//         // player.play(resource);
//       });

//       connection.on('error', console.error);
//       // Add other state handlers (Connecting, Disconnected, Destroyed)

//     } catch (error) {
//       console.error(`Failed to join voice channel:`, error);
//     }
//   } else {
//     console.error('Target guild or voice channel not found or invalid.');
//   }
// });
// --- END OF CONCEPTUAL EXAMPLE ---
```

---

## ✨ Features

- **Event Handling:** Listen for Discord gateway events (Ready, Message Create, etc.)
- **Messaging:** Send, edit, and manage messages
- **REST API:** Fetch users, guilds, channels
- **Voice Integration:** Adapter for `@discordjs/voice` (limited for user tokens)
- **Caching:** Basic caching for guilds, channels, users

---

## 📚 Documentation

- [API Reference](https://github.com/royal-selfbot/royal-selfbot/wiki)
- [Examples](https://github.com/royal-selfbot/royal-selfbot/tree/main/examples)
- [FAQ](https://github.com/royal-selfbot/royal-selfbot/wiki/FAQ)

---

## 🤝 Community & Support

Join the Royal community Discord server for discussions, help (within reasonable limits respecting ToS), and updates:  
[![Join Royal Discord](https://img.shields.io/discord/royal0?label=Join%20Royal%20Discord&logo=discord&style=for-the-badge)](https://discord.gg/royal0)

> Please remember that self-botting is risky, and support might be limited regarding actions that directly violate Discord's ToS.

---

## ⚖️ Disclaimer

This project is experimental and intended for educational purposes. Use of this library is entirely at your own risk. The developers are not responsible for any consequences resulting from its use, including but not limited to account suspension or termination by Discord.  
**Always adhere to Discord's Terms of Service and Community Guidelines.**

**Again, this is highly unstable and likely to break due to Discord API changes aimed at preventing self-bots.**

---

<div align="center">

<a href="https://github.com/royal-selfbot/royal-selfbot">
  <img src="https://img.shields.io/github/stars/royal-selfbot/royal-selfbot?style=social" alt="GitHub stars" />
</a>
&nbsp;•&nbsp;
<a href="https://github.com/royal-selfbot/royal-selfbot/issues">
  <img src="https://img.shields.io/github/issues/royal-selfbot/royal-selfbot?style=flat-square" alt="GitHub issues" />
</a>
&nbsp;•&nbsp;
<a href="https://github.com/royal-selfbot/royal-selfbot/blob/main/LICENSE">
  <img src="https://img.shields.io/github/license/royal-selfbot/royal-selfbot?style=flat-square" alt="License" />
</a>

</div>
