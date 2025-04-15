// src/managers/UserManager.js

const BaseManager = require('./BaseManager');
const User = require('../structures/User'); // Requires the User structure

/**
 * Manages API methods for Users and stores their cache.
 * @extends {BaseManager}
 */
class UserManager extends BaseManager {
    /**
     * @param {Client} client The instantiating client
     */
    constructor(client) {
        // Pass the client and the User constructor
        super(client, User);
    }

    /**
     * Adds or updates a user in the cache.
     * @param {object} data The raw user data from the API or WebSocket.
     * @param {boolean} [cache=true] Whether to cache the user.
     * @returns {User} The created or updated User instance.
     * @override
     * @protected
     */
    _add(data, cache = true) {
        return super._add(data, cache); // Use base logic
    }

    /**
     * Resolves a UserResolvable to a User object.
     * @param {User|Snowflake} userResolvable The user resolvable to resolve.
     * @returns {?User} The resolved User or null if not found.
     * @override
     */
    resolve(userResolvable) {
        const user = super.resolve(userResolvable); // Use BaseManager's resolve
        if (user) return user;

        if (typeof userResolvable === 'string' && this.cache.has(userResolvable)) {
            return this.cache.get(userResolvable);
        }
        return null;
    }

    /**
     * Resolves a UserResolvable to a User ID string.
     * @param {User|Snowflake} userResolvable The user resolvable to resolve.
     * @returns {?Snowflake} The resolved user ID or null if not found.
     * @override
     */
    resolveId(userResolvable) {
        const id = super._resolveId(userResolvable); // Use BaseManager's resolveId
        if (id) return id;

        if (typeof userResolvable === 'string') {
            return userResolvable;
        }
        return null;
    }

    /**
     * Fetches a user from Discord, even if it's not cached.
     * @param {Snowflake} id The ID of the user to fetch.
     * @param {object} [options={}] Options for fetching.
     * @param {boolean} [options.cache=true] Whether to cache the fetched user.
     * @param {boolean} [options.force=false] Whether to skip checking the cache and fetch directly.
     * @returns {Promise<User>}
     */
    async fetch(id, { cache = true, force = false } = {}) {
        if (!force) {
            const existing = this.cache.get(id);
            if (existing) return existing;
        }

        try {
            const data = await this.client.rest.request('GET', `/users/${id}`);
            // _add handles caching if cache=true
            return this._add(data, cache);
        } catch (error) {
            console.error(`[UserManager Fetch Error] Failed to fetch user ${id}:`, error.response?.data || error.message);
            if (error.response?.status === 404) {
                 if (cache) this.cache.delete(id);
                 return null;
            }
            throw error; // Rethrow other errors
        }
    }

    // Note: Bots have a `fetchMe` method, but for a self-bot, client.user should
    // be populated by the READY event from the WebSocketManager.
    // You could add a `fetchMe` for completeness if needed, but it might just
    // return client.user or fetch client.user.id if client.user is not yet set.
}

module.exports = UserManager;
