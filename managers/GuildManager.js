// src/managers/GuildManager.js

const BaseManager = require('./BaseManager');
const Guild = require('../structures/Guild'); // Make sure this path is correct

/**
 * Manages API methods for Guilds and stores their cache.
 * @extends {BaseManager}
 */
class GuildManager extends BaseManager {
    /**
     * @param {Client} client The instantiating client
     */
    constructor(client) {
        // Pass the client and the constructor of the structure this manager holds (Guild)
        super(client, Guild);
    }

    /**
     * Adds or updates a guild in the cache.
     * This method is typically called internally when processing GUILD_CREATE or similar events.
     * @param {object} data The raw guild data from the API or WebSocket.
     * @param {boolean} [cache=true] Whether to cache the guild.
     * @returns {Guild} The created or updated Guild instance.
     * @override - Overrides BaseManager._add for potentially guild-specific logic if needed later
     * @protected
     */
    _add(data, cache = true) {
        return super._add(data, cache); // Use the base _add logic for now
    }

    /**
     * Resolves a GuildResolvable to a Guild object.
     * @param {Guild|Snowflake} guildResolvable The guild resolvable to resolve.
     * @returns {?Guild} The resolved Guild or null if not found.
     * @override
     */
    resolve(guildResolvable) {
        // The 'guildResolvable' could be a Guild object itself or just an ID (string)
        const guild = super.resolve(guildResolvable); // Use BaseManager's resolve for basic ID lookup
        if (guild) return guild;

        // If it's just an ID string, try finding it in the cache again (redundant but safe)
        if (typeof guildResolvable === 'string' && this.cache.has(guildResolvable)) {
            return this.cache.get(guildResolvable);
        }
        return null;
    }

    /**
     * Resolves a GuildResolvable to a Guild ID string.
     * @param {Guild|Snowflake} guildResolvable The guild resolvable to resolve.
     * @returns {?Snowflake} The resolved guild ID or null if not found.
     * @override
     */
    resolveId(guildResolvable) {
        // The 'guildResolvable' could be a Guild object itself or just an ID (string)
        const id = super._resolveId(guildResolvable); // Use BaseManager's resolveId
        if (id) return id;

         // If it's just an ID string
         if (typeof guildResolvable === 'string') {
             return guildResolvable;
         }

        return null;
    }

    /**
     * Fetches a guild from Discord, even if it's not cached.
     * NOTE: Self-bots usually receive all guilds on READY, so direct fetching might be less common
     * or have different API endpoints/permissions compared to bots. This is a conceptual example.
     * @param {Snowflake} id The ID of the guild to fetch.
     * @param {object} [options={}] Options for fetching.
     * @param {boolean} [options.cache=true] Whether to cache the fetched guild.
     * @param {boolean} [options.force=false] Whether to skip checking the cache and fetch directly.
     * @returns {Promise<Guild>}
     */
    async fetch(id, { cache = true, force = false } = {}) {
        if (!force) {
            const existing = this.cache.get(id);
            if (existing) return existing;
        }

        // Using the RESTManager to make the API call
        // Replace '/guilds/{id}' with the correct endpoint if different for user accounts
        try {
             const data = await this.client.rest.request('GET', `/guilds/${id}`);
             // Create a Guild instance from the fetched data
             // The _add method handles caching if 'cache' is true
             return this._add(data, cache);
        } catch (error) {
             console.error(`[GuildManager Fetch Error] Failed to fetch guild ${id}:`, error.response?.data || error.message);
             throw error; // Rethrow the error for the caller to handle
        }
    }

    // You can add more methods specific to guilds here, e.g.:
    // async leave(id) { ... }
    // async create(options) { ... } // Note: Creating guilds via API is typically bot-only
}

module.exports = GuildManager;
