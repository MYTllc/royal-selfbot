// src/structures/Guild.js

const Base = require('./Base');
const ChannelManager = require('../managers/ChannelManager');
const VoiceState = require('./VoiceState'); // Required for handling voice states
const { createVoiceDispatch } = require('../voice/VoiceManager'); // Required for voice adapter

/**
 * Represents a Guild (Server) on Discord.
 * @extends {Base}
 */
class Guild extends Base {
    /**
     * @param {Client} client The instantiating client
     * @param {object} data The raw guild data from the API or WebSocket
     */
    constructor(client, data) {
        super(client);

        /**
         * The ID of the guild.
         * @type {string}
         */
        this.id = data.id;

        /**
         * The channel manager for this guild, holding its channels.
         * @type {ChannelManager}
         */
        this.channels = new ChannelManager(client, this); // Pass guild for filtering

        /**
         * A manager or cache for guild members. (Basic Map for now).
         * Requires privileged intents (usually unavailable to self-bots) or manual fetching/chunking for full population.
         * @type {Map<string, object>} // Replace 'object' with actual GuildMember structure later
         */
        this.members = new Map(); // Placeholder for member cache

        /**
         * A map of user IDs to their voice states in this guild.
         * @type {Map<string, VoiceState>}
         */
        this.voiceStates = new Map(); // Store voice states keyed by user ID

        /**
         * The cached voice adapter creator function for this guild.
         * @type {?Function}
         * @private
         */
        this._voiceAdapterCreator = null;

        /**
         * Whether the guild is unavailable (e.g., due to an outage or loading).
         * @type {boolean}
         */
        this.unavailable = data.unavailable ?? false; // Track if guild is unavailable

        // Initial patch if data is provided on construction and guild is available
        if (!this.unavailable) {
             this._patch(data);
        } else {
            // Set properties to indicate unavailability if needed
            this.name = undefined;
        }
    }

    /**
     * Updates the guild structure with new data.
     * @param {object} data The raw data for the guild
     * @protected
     */
    _patch(data) {
        // Handle availability changes first
        if (data.unavailable !== undefined && data.unavailable !== this.unavailable) {
             this.unavailable = data.unavailable;
             if (this.unavailable) {
                 console.warn(`[Guild] Guild ${this.id} (${this.name || 'Name Unknown'}) became unavailable.`);
                 // Consider clearing some properties when becoming unavailable
                 return this; // Stop patching if unavailable now
             } else {
                 console.log(`[Guild] Guild ${this.id} (${data.name || 'Name Pending'}) became available.`);
                 // Need to re-request data or wait for subsequent updates if coming back from unavailable
             }
        }
        // Don't patch further if still marked as unavailable
        if (this.unavailable) return this;

        // Patch regular properties
        if (data.name !== undefined) this.name = data.name;
        if (data.icon !== undefined) this.icon = data.icon;
        if (data.owner_id !== undefined) this.ownerId = data.owner_id;
        if (data.member_count !== undefined) this.memberCount = data.member_count;
        if (data.splash !== undefined) this.splash = data.splash;
        if (data.banner !== undefined) this.banner = data.banner;
        if (data.description !== undefined) this.description = data.description;
        // ... patch other relevant guild properties ...
        // e.g., region (deprecated), afk_channel_id, afk_timeout, verification_level, features, etc.


        // Handle nested structures if present in data (e.g., from GUILD_CREATE)
        if (data.channels) {
            // It might be safer to clear existing channels managed by this guild
            // before adding the new set, depending on how updates are handled.
            // this.channels.cache.clear(); // Optional: Clear cache before repopulating
            data.channels.forEach(channelData => {
                 // Ensure the channel data includes guild_id if not already present
                 if (!channelData.guild_id) channelData.guild_id = this.id;
                 this.channels._add(channelData);
             });
        }

        if (data.threads) {
             // Also process thread channels if included
             data.threads.forEach(threadData => {
                 if (!threadData.guild_id) threadData.guild_id = this.id;
                 this.channels._add(threadData); // Use the same channel manager
             });
        }

        // Handle voice states if present
        if (data.voice_states) {
            // Usually, the initial GUILD_CREATE voice_states represents the current state.
            // Clear existing states for this guild before adding new ones? Or merge?
            this.voiceStates.clear(); // Clear cache on initial load/resync
            data.voice_states.forEach(vsData => {
                // Use the imported VoiceState constructor
                // Ensure guild_id is passed correctly
                const vs = new VoiceState(this.client, { ...vsData, guild_id: this.id });
                this.voiceStates.set(vs.userId, vs);
            });
        }

         // Handle members if present (less likely for self-bots without chunking)
         if (data.members) {
             data.members.forEach(memberData => {
                 // Add to a MemberManager or directly cache basic info
                 // Example: Assuming a MemberManager exists on the guild or client
                 // this.client.members._add({ guild_id: this.id, ...memberData }); // Requires member manager
             });
         }

         // Handle presences if present (even less likely/useful for self-bots)
         // if (data.presences) { ... }

         return this; // Return this for chaining if needed
    }

    /**
     * Updates a specific voice state for a user within this guild.
     * Called internally by WebSocketManager on VOICE_STATE_UPDATE dispatch.
     * @param {object} vsData Raw voice state data from the dispatch event.
     * @protected
     */
    _updateVoiceState(vsData) {
         if (!vsData || !vsData.user_id) return; // Need user_id to update
         if (vsData.guild_id !== this.id) return; // Ensure it's for this guild

         const existing = this.voiceStates.get(vsData.user_id);

         if (vsData.channel_id === null) {
             // User left voice channel in this guild
             if (existing) {
                 this.voiceStates.delete(vsData.user_id);
                 // console.debug(`[Guild ${this.id}] User ${vsData.user_id} left voice channel ${existing.channelId}.`);
             }
         } else {
             // User joined or moved voice channel, or updated state (mute, deaf, etc.)
             if (existing) {
                  existing._patch(vsData); // Update existing state object
                  // console.debug(`[Guild ${this.id}] Updated voice state for user ${vsData.user_id} in channel ${vsData.channel_id}.`);
             } else {
                 // Create new state if user wasn't previously tracked in voice for this guild
                 const vs = new VoiceState(this.client, { ...vsData, guild_id: this.id });
                 this.voiceStates.set(vs.userId, vs);
                 // console.debug(`[Guild ${this.id}] Added new voice state for user ${vsData.user_id} in channel ${vsData.channel_id}.`);
             }
         }
    }


    /**
     * Crucial for @discordjs/voice: Creates an adapter interface for voice connections in this guild.
     * It provides methods for @discordjs/voice to send voice state updates via the client's WebSocket
     * and registers callbacks for @discordjs/voice to receive voice server/state updates from the Gateway.
     * @type {import('@discordjs/voice').DiscordGatewayAdapterCreator}
     * @readonly
     */
    get voiceAdapterCreator() {
        // Cache the adapter creator function per guild instance
        if (!this._voiceAdapterCreator) {
            // Use the imported helper function from VoiceManager
            // This function needs access to the client and guild ID to work correctly.
            try {
                this._voiceAdapterCreator = createVoiceDispatch(this.client, this.id);
            } catch (error) {
                 console.error(`[Guild ${this.id}] Failed to create voice adapter creator:`, error);
                 // Return a dummy function or throw to indicate failure
                 return () => { throw new Error('Voice adapter creation failed.'); };
            }
        }
        return this._voiceAdapterCreator;
    }

    /**
     * Fetches channels for this guild from the API.
     * @param {boolean} [cache=true] Whether to cache the fetched channels.
     * @returns {Promise<ChannelManager>} The ChannelManager containing the fetched channels.
     */
    async fetchChannels(cache = true) {
        // Assuming ChannelManager has a method like fetchGuildChannels
        await this.channels.fetchGuildChannels(cache);
        return this.channels;
    }

    /**
     * Gets the client user's GuildMember object in this guild.
     * Requires member caching or fetching, which is often limited for self-bots.
     * @type {?GuildMember} // Replace 'object' with actual GuildMember structure when created
     * @readonly
     */
    get me() {
        if (!this.client.user) return null;
        // This requires a proper GuildMember structure and member cache/manager
        // return this.members.resolve(this.client.user.id); // Example if members manager exists
        console.warn("[Guild.me] Member caching/fetching not fully implemented. Returning null.");
        return null; // Placeholder - implement member handling later
    }

    /**
     * Leaves the guild.
     * @returns {Promise<Guild>} The guild instance (now left).
     */
    async leave() {
        await this.client.rest.request('DELETE', `/users/@me/guilds/${this.id}`);
        // Client should receive GUILD_DELETE event, which should remove/mark guild as unavailable
        return this;
    }

    // Add other guild-specific methods as needed:
    // fetchMember(userId), fetchMembers(), fetchBans(), createChannel(), etc.
    // Be mindful of API limitations for user accounts.

    /**
     * Creates a JSON representation of the guild.
     * @returns {object}
     */
     toJSON() {
         return {
             id: this.id,
             name: this.name,
             icon: this.icon,
             owner_id: this.ownerId,
             member_count: this.memberCount,
             unavailable: this.unavailable,
             // Include other relevant properties based on what's patched
         };
     }

     /**
      * Returns the guild's name.
      * @returns {string}
      */
     toString() {
         return this.name || `Guild (${this.id})`;
     }
}

module.exports = Guild;
