// src/structures/Channel.js

const Base = require('./Base');
const MessageManager = require('../managers/MessageManager');

// Define channel types based on Discord's API values.
const CHANNEL_TYPES = {
  GUILD_TEXT: 0,
  DM: 1,
  GUILD_VOICE: 2,
  GROUP_DM: 3,
  GUILD_CATEGORY: 4,
  GUILD_NEWS: 5,
  GUILD_STORE: 6,
  GUILD_NEWS_THREAD: 10,
  GUILD_PUBLIC_THREAD: 11,
  GUILD_PRIVATE_THREAD: 12,
  GUILD_STAGE_VOICE: 13,
  GUILD_DIRECTORY: 14,
  GUILD_FORUM: 15
};

class Channel extends Base {
  /**
   * @param {Client} client The client instance.
   * @param {object} data The raw channel data from Discord.
   * @param {Guild|null} guild The guild this channel belongs to, if any.
   */
  constructor(client, data, guild = null) {
    super(client);
    this.id = data.id;
    this.guild = guild; // The guild the channel belongs to, if any
    this.messages = new MessageManager(client, this); // Each channel gets its own message manager/cache
    this._patch(data);
  }

  /**
   * Patches the channel object with new data.
   * It now stores a friendly type name based on the CHANNEL_TYPES mapping.
   * @param {object} data Raw data from Discord.
   */
  _patch(data) {
    this.type = typeof data.type !== 'undefined' ? data.type : this.type;
    this.name = data.name ?? this.name;
    // Lookup the friendly type name from our CHANNEL_TYPES mapping.
    this.typeName = Object.keys(CHANNEL_TYPES).find(key => CHANNEL_TYPES[key] === this.type) || "UNKNOWN";
    // Add additional common channel properties if needed (e.g., topic, lastMessageId, etc.).
  }

  /**
   * Sends a message to the channel.
   * @param {string|object} content The message content or options.
   * @returns {Promise<object>} The created message data.
   */
  async send(content) {
    if (!this.client.token) throw new Error('Client not logged in or token unavailable.');
    if (!this.id) throw new Error('Channel ID is missing.');
    try {
      const messageData = await this.client.rest.createMessage(this.id, content);
      // If you have a Message class and want to add caching, you could call:
      // return this.messages._add(messageData);
      return messageData;
    } catch (error) {
      console.error(`[Channel Send Error] Failed to send message to channel ${this.id}:`, error);
      throw error;
    }
  }

  /**
   * Checks if the channel is a voice channel.
   * Note that Guild Forum channels (type 15) are not voice channels.
   * @returns {boolean} True if the channel supports voice, false otherwise.
   */
  isVoice() {
    return this.type === CHANNEL_TYPES.GUILD_VOICE || this.type === CHANNEL_TYPES.GUILD_STAGE_VOICE;
  }

  /**
   * Returns a JSON representation of the channel.
   * @returns {object}
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      typeName: this.typeName,
      name: this.name,
      guild_id: this.guild ? this.guild.id : null,
    };
  }

  /**
   * Returns a string representation of the channel.
   * @returns {string}
   */
  toString() {
    return `<#${this.id}>`;
  }
}

module.exports = Channel;
