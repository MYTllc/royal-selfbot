# Royal Code SelfBot

<div align="center">

<!-- Custom Banner (SVG) -->
<img src="https://svgshare.com/i/14kA.svg" alt="Royal Code SelfBot Banner" width="80%" />

<br /><br />

<a href="https://www.npmjs.com/package/royal-selfbot">
    <img src="https://img.shields.io/npm/v/royal-selfbot?color=blue&style=for-the-badge" alt="npm version" />
</a>
&nbsp;
<img src="https://img.shields.io/badge/Node.js-%3E=20.0.0-green?style=for-the-badge" alt="Node.js v20+" />
&nbsp;
<a href="https://github.com/MYTllc/royal-selfbot/stargazers">
    <img src="https://img.shields.io/github/stars/MYTllc/royal-selfbot?style=for-the-badge" alt="GitHub stars" />
</a>
&nbsp;
<a href="https://github.com/MYTllc/royal-selfbot/issues">
    <img src="https://img.shields.io/github/issues/MYTllc/royal-selfbot?style=for-the-badge" alt="GitHub issues" />
</a>

</div>

---

> ⚠️ **EXTREME WARNING: USE AT YOUR OWN RISK!**  
> Using self-bots violates Discord's Terms of Service and can lead to the **permanent suspension** of your Discord account.  
> This project is for **educational purposes only** to demonstrate API interactions.  
> **DO NOT USE THIS FOR MALICIOUS PURPOSES OR TO VIOLATE DISCORD'S TOS.**  
> The maintainers are not responsible for any action taken against your account.

---

Royal Code SelfBot is an experimental Node.js library for interacting with the Discord API using a user account (self-bot).  
It provides a familiar structure to libraries like discord.js, but adapted for user tokens.  
Includes support for `@discordjs/voice` (with limitations).

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install royal-selfbot @discordjs/voice ws axios dotenv libsodium-wrappers
# or
yarn add royal-selfbot @discordjs/voice ws axios dotenv libsodium-wrappers
```

> **Requires Node.js v20 or newer**

---

### 2. Set Up Your Token

Create a `.env` file in your project root:

```env
DISCORD_USER_TOKEN=YOUR_DISCORD_USER_TOKEN_HERE
```

> **Never share your token!** It grants full access to your account.

---

### 3. Basic Usage Example

```js
// example.js
require('dotenv').config();
const { Client } = require('royal-selfbot');

const client = new Client();

client.on('ready', (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}!`);
    console.log(`Watching ${readyClient.guilds.cache.size} guilds.`);
});

client.on('messageCreate', async (message) => {
    if (message.author?.id === client.user?.id) return;

    // Simple ping command
    if (message.content.toLowerCase() === '!selfping') {
        await message.reply('Pong!');
    }

    // Example: Get user info
    if (message.content.toLowerCase() === '!myinfo') {
        await message.channel.send(`Your Tag: ${message.author.tag}\nYour ID: ${message.author.id}`);
    }
});

client.on('error', (error) => {
    console.error('[Client Error]', error);
});

client.login(process.env.DISCORD_USER_TOKEN);
```

---

## 🔊 Voice Usage (Experimental)

> **Note:** Joining voice channels with user tokens is blocked by Discord and will likely fail.

The library includes a `voiceAdapterCreator` for `@discordjs/voice` integration, but this is mostly for reference.

---

## ✨ Features

- **Event Handling:** Listen for Discord gateway events (Ready, Message Create, etc.)
- **Messaging:** Send, edit, and manage messages
- **REST API:** Fetch users, guilds, channels
- **Voice Integration:** Adapter for `@discordjs/voice` (limited for user tokens)
- **Caching:** Basic caching for guilds, channels, users

---

## 📖 API Reference

### Client

- **constructor(options?)**  
  Create a new selfbot client.

- **.login(token: string): Promise<void>**  
  Log in with your Discord user token.

- **Events:**  
  - `ready`: Emitted when logged in and ready.
  - `messageCreate`: Emitted on every message received.
  - `error`: Emitted on error.

### Message

- **.reply(content: string): Promise<Message>**  
  Reply to a message.

- **.edit(content: string): Promise<Message>**  
  Edit a message.

### Guild

- **.fetch(): Promise<Guild>**  
  Fetch guild info.

### Channel

- **.send(content: string): Promise<Message>**  
  Send a message to a channel.

---

## 💡 Examples

### Ping Command

```js
client.on('messageCreate', async (message) => {
    if (message.content === '!ping') {
        await message.reply('Pong!');
    }
});
```

### User Info Command

```js
client.on('messageCreate', async (message) => {
    if (message.content === '!myinfo') {
        await message.channel.send(`Your Tag: ${message.author.tag}\nYour ID: ${message.author.id}`);
    }
});
```

---

## ❓ FAQ

**Q: Is this safe to use?**  
A: No. Self-bots are against Discord's ToS and can get your account banned.

**Q: Can I use this for moderation or automation?**  
A: No. Use a bot account for legitimate automation.

**Q: Will voice features work?**  
A: Voice is experimental and likely blocked for user tokens.

**Q: Where can I get help?**  
A: Join the [Royal Discord](https://discord.gg/royal0) for discussion and limited support.

---

## 🤝 Community & Support

Join the Royal community Discord server for discussions, help (within reasonable limits respecting ToS), and updates:  
[![Join Royal Discord](https://img.shields.io/discord/royal0?label=Join%20Royal%20Discord&logo=discord&style=for-the-badge)](https://discord.gg/royal0)

> Self-botting is risky, and support is limited regarding actions that violate Discord's ToS.

---

## ⚖️ Disclaimer

This project is experimental and intended for educational purposes. Use of this library is entirely at your own risk.  
The developers are not responsible for any consequences resulting from its use, including but not limited to account suspension or termination by Discord.  
**Always adhere to Discord's Terms of Service and Community Guidelines.**

---

<div align="center">

<a href="https://github.com/MYTllc/royal-selfbot">
    <img src="https://img.shields.io/github/stars/MYTllc/royal-selfbot?style=social" alt="GitHub stars" />
</a>
&nbsp;•&nbsp;
<a href="https://github.com/MYTllc/royal-selfbot/issues">
    <img src="https://img.shields.io/github/issues/MYTllc/royal-selfbot?style=flat-square" alt="GitHub issues" />
</a>
<br /><br />
<sub>Banner designed with SVG. Made by <b>code</b>.</sub>
</div>
