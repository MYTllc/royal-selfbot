# Royal-Selfbot

**⚠️ EXTREME WARNING: USE AT YOUR OWN RISK! ⚠️**

Using self-bots violates Discord's Terms of Service and can lead to the **permanent suspension** of your Discord account without warning. This project is provided for **educational purposes only** to demonstrate API interactions.

**DO NOT USE THIS FOR MALICIOUS PURPOSES OR TO VIOLATE DISCORD'S TOS.** The maintainers of this project are not responsible for any action taken against your account.

---

Royal-Selfbot is an experimental Node.js library for interacting with the Discord API using a user account (self-bot). It aims to provide a familiar structure similar to libraries like discord.js, but adapted for user tokens. Includes support for `@discordjs/voice`.

**Again, this is highly unstable and likely to break due to Discord API changes aimed at preventing self-bots.**

## Features (Conceptual)

*   Event handling for common Discord gateway events (Ready, Message Create, etc.)
*   Sending and managing messages
*   Basic REST API interaction (fetching users, guilds, channels)
*   Integration with `@discordjs/voice` for joining voice channels and potentially playing audio.
*   Basic caching for guilds, channels, users.

## Installation

```bash
npm install royal-selfbot @discordjs/voice ws axios dotenv libsodium-wrappers
# or
yarn add royal-selfbot @discordjs/voice ws axios dotenv libsodium-wrappers