// src/managers/MessageManager.js

const BaseManager = require('./BaseManager');
const Message = require('../structures/Message'); // Requires Message.js structure

/**
 * Manages API methods for Messages and stores their cache.
 * Typically instantiated per channel.
 * @extends {BaseManager}
 */
class MessageManager extends BaseManager {
    /**
     * @param {Client} client The instantiating client
     * @param {Channel} channel The channel that this manager belongs to
     */
    constructor(client, channel) {
        // Pass the client and the Message structure constructor
        super(client, Message);

        /**
         * The channel that this manager belongs to.
         * @type {Channel}
         */
        this.channel = channel;

        // Optional: Limit the cache size for messages
        // This simple example doesn't implement automatic eviction based on size/time.
        // You might want to add LRU (Least Recently Used) caching logic here.
        // this.cacheLimit = options.messageCacheMaxSize ?? 50; // Example limit
    }

    /**
     * Adds or updates a message in the cache.
     * @param {object} data The raw message data from the API or WebSocket.
     * @param {boolean} [cache=true] Whether to cache the message.
     * @returns {Message} The created or updated Message instance.
     * @override
     * @protected
     */
    _add(data, cache = true) {
        // Pass the channel as an extra argument to the Message constructor
        return super._add(data, cache, { extras: [this.channel] });
    }

    /**
     * Resolves a MessageResolvable to a Message object.
     * @param {Message|Snowflake} messageResolvable The message resolvable to resolve.
     * @returns {?Message} The resolved Message or null if not found.
     * @override
     */
    resolve(messageResolvable) {
        const message = super.resolve(messageResolvable); // Use BaseManager's resolve
        if (message) return message;

        if (typeof messageResolvable === 'string' && this.cache.has(messageResolvable)) {
            return this.cache.get(messageResolvable);
        }
        return null;
    }

    /**
     * Resolves a MessageResolvable to a Message ID string.
     * @param {Message|Snowflake} messageResolvable The message resolvable to resolve.
     * @returns {?Snowflake} The resolved message ID or null if not found.
     * @override
     */
    resolveId(messageResolvable) {
        const id = super._resolveId(messageResolvable); // Use BaseManager's resolveId
        if (id) return id;

        if (typeof messageResolvable === 'string') {
            return messageResolvable;
        }
        return null;
    }

    /**
     * Fetches a single message from this channel from Discord.
     * @param {Snowflake} messageId The ID of the message to fetch.
     * @param {object} [options={}] Options for fetching.
     * @param {boolean} [options.cache=true] Whether to cache the fetched message.
     * @param {boolean} [options.force=false] Whether to skip checking the cache and fetch directly.
     * @returns {Promise<Message>}
     */
    async fetch(messageId, { cache = true, force = false } = {}) {
        if (!force) {
            const existing = this.cache.get(messageId);
            if (existing) return existing;
        }

        try {
            const data = await this.client.rest.request('GET', `/channels/${this.channel.id}/messages/${messageId}`);
            // _add handles caching
            return this._add(data, cache);
        } catch (error) {
            console.error(`[MessageManager Fetch Error] Failed to fetch message ${messageId} in channel ${this.channel.id}:`, error.response?.data || error.message);
            if (error.response?.status === 404) {
                 if (cache) this.cache.delete(messageId);
                 return null;
            }
            throw error;
        }
    }

    /**
     * Fetches multiple messages from this channel from Discord.
     * @param {object} [options={}] Options for fetching messages.
     * @param {number} [options.limit=50] The maximum number of messages to fetch (max 100).
     * @param {Snowflake} [options.before] Get messages before this message ID.
     * @param {Snowflake} [options.after] Get messages after this message ID.
     * @param {Snowflake} [options.around] Get messages around this message ID.
     * @param {boolean} [options.cache=true] Whether to cache the fetched messages.
     * @returns {Promise<Map<Snowflake, Message>>} A map of message IDs to Message objects.
     */
    async fetchMany({ limit = 50, before, after, around, cache = true } = {}) {
        const queryParams = { limit: Math.min(limit, 100) }; // Ensure limit is within Discord's bounds
        if (before) queryParams.before = before;
        if (after) queryParams.after = after;
        if (around) queryParams.around = around;

        try {
            const messagesData = await this.client.rest.request('GET', `/channels/${this.channel.id}/messages`, queryParams);
            const fetchedMessages = new Map();
            for (const messageData of messagesData) {
                const message = this._add(messageData, cache);
                fetchedMessages.set(message.id, message);
            }
            return fetchedMessages;
        } catch (error) {
            console.error(`[MessageManager FetchMany Error] Failed to fetch messages in channel ${this.channel.id}:`, error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Sends a message to this channel. (This is often placed on the Channel structure itself for convenience).
     * @param {string|object} contentOrOptions The content or options for the message.
     * @returns {Promise<Message>} The sent message.
     * @deprecated Prefer using `channel.send()`
     */
    async send(contentOrOptions) {
        console.warn("[MessageManager.send] Deprecated: Use channel.send() instead.");
        return this.channel.send(contentOrOptions);
    }

     /**
      * Deletes a message from this channel.
      * Requires MANAGE_MESSAGES permission for other users' messages,
      * self-bots can typically delete their own messages.
      * @param {Message|Snowflake} messageResolvable The message or ID to delete.
      * @param {string} [reason] Audit log reason (if applicable).
      * @returns {Promise<void>}
      */
     async delete(messageResolvable, reason) {
         const messageId = this.resolveId(messageResolvable);
         if (!messageId) throw new Error('Could not resolve message ID for deletion.');

         try {
             await this.client.rest.request('DELETE', `/channels/${this.channel.id}/messages/${messageId}`, { reason });
             // Optionally remove from cache
             this.cache.delete(messageId);
         } catch (error) {
              console.error(`[MessageManager Delete Error] Failed to delete message ${messageId} in channel ${this.channel.id}:`, error.response?.data || error.message);
              throw error;
         }
     }

    // Add methods for pinning, reactions, editing etc. as needed.
}

module.exports = MessageManager;
