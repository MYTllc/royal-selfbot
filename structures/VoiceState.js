// src/structures/VoiceState.js
const Base = require('./Base');

/**
 * Represents a user's voice connection status.
 * @extends {Base}
 */
class VoiceState extends Base {
    /**
     * @param {Client} client The instantiating client
     * @param {object} data The raw voice state data from the WebSocket
     */
    constructor(client, data) {
        super(client);

        /**
         * The guild this voice state is for.
         * Populated by looking up data.guild_id in the client's guild cache.
         * @type {?Guild}
         */
        this.guild = data.guild_id ? this.client.guilds.resolve(data.guild_id) : null;

        /**
         * The user ID this voice state is for.
         * @type {string}
         */
        this.userId = data.user_id; // We might not have the full User object readily available here

        this._patch(data);
    }

    /**
     * Updates this voice state with new data.
     * @param {object} data The raw voice state data
     * @protected
     */
    _patch(data) {
        /**
         * The unique session ID for this voice state.
         * @type {string}
         */
        this.sessionId = data.session_id ?? this.sessionId;

        /**
         * The ID of the voice channel this user is in. Null if not in a channel.
         * @type {?string}
         */
        this.channelId = data.channel_id ?? this.channelId; // Can be null if leaving

        /**
         * Whether this user is deafened by the server.
         * @type {boolean}
         */
        this.serverDeaf = data.deaf ?? this.serverDeaf ?? false;

        /**
         * Whether this user is muted by the server.
         * @type {boolean}
         */
        this.serverMute = data.mute ?? this.serverMute ?? false;

        /**
         * Whether this user is locally deafened (self-deafened).
         * Note: Self-bots typically cannot control this reliably via API.
         * @type {boolean}
         */
        this.selfDeaf = data.self_deaf ?? this.selfDeaf ?? false;

        /**
         * Whether this user is locally muted (self-muted).
         * Note: Self-bots typically cannot control this reliably via API.
         * @type {boolean}
         */
        this.selfMute = data.self_mute ?? this.selfMute ?? false;

        /**
         * Whether this user's camera is enabled.
         * @type {boolean}
         */
        this.selfVideo = data.self_video ?? this.selfVideo ?? false;

        /**
         * Whether this user is streaming using "Go Live".
         * @type {boolean}
         */
        this.selfStream = data.self_stream ?? this.selfStream ?? false;

        /**
         * Whether this user is muted by the current user (suppressed).
         * @type {boolean}
         */
        this.suppress = data.suppress ?? this.suppress ?? false; // If the client user has muted this user

        /**
         * The time at which the user requested to speak.
         * Only applicable for Stage channels.
         * @type {?Date}
         */
        this.requestToSpeakTimestamp = data.request_to_speak_timestamp
            ? new Date(Date.parse(data.request_to_speak_timestamp))
            : this.requestToSpeakTimestamp;

        // Guild Member data might be included, patch the member if available
        if (data.member && this.guild) {
             // Assuming Guild structure has a members manager or similar
             // this.guild.members?._add(data.member); // Example conceptual update
        }

        return this;
    }

    /**
     * The channel the user is connected to.
     * Resolved by looking up `channelId` in the guild's channel cache.
     * @type {?VoiceChannel} // Or a more generic Channel type
     * @readonly
     */
    get channel() {
        return this.guild?.channels.resolve(this.channelId) ?? null;
    }

    /**
     * The member associated with this voice state.
     * Requires member caching to be effective.
     * @type {?GuildMember}
     * @readonly
     */
    get member() {
        return this.guild?.members.resolve(this.userId) ?? null; // Assuming Guild has a members manager
    }

     /**
      * The user associated with this voice state.
      * Resolved by looking up `userId` in the client's user cache.
      * @type {?User}
      * @readonly
      */
     get user() {
         return this.client.users.resolve(this.userId) ?? null;
     }

    /**
     * Whether the user is currently speaking (no standard reliable property, depends on external factors or potential future API additions).
     * Placeholder for potential future use or custom implementation.
     * @type {boolean}
     * @readonly
     */
    get speaking() {
        // Discord doesn't reliably provide a 'speaking' boolean in the VoiceStateUpdate event.
        // Speaking state is typically handled by the voice connection itself (e.g., @discordjs/voice).
        return false; // Placeholder
    }

    /**
     * Checks if the user is currently connected to a voice channel.
     * @returns {boolean}
     */
    get connection() {
        // Placeholder: In a full library, this might link to the actual @discordjs/voice connection object
        // if this VoiceState belongs to the client user. For now, just checks if in a channel.
        return !!this.channelId;
    }

    // --- Actions (Potentially limited/risky for Self-bots) ---

    /**
     * Mutes/unmutes the user (requires permissions).
     * Less reliable/useful for self-bots targeting themselves.
     * @param {boolean} [mute=true] Whether the user should be muted
     * @param {string} [reason] Audit log reason
     * @returns {Promise<GuildMember>} The updated member // Requires GuildMember structure
     */
    async setMute(mute = true, reason) {
        if (!this.member) throw new Error('GuildMember not found for this VoiceState.');
        // Delegate to GuildMember.edit() or a direct REST call
        // return this.member.edit({ mute }, reason); // Conceptual
        await this.client.rest.request(
            'PATCH',
            `/guilds/${this.guild.id}/members/${this.userId}`,
            { mute: Boolean(mute) },
            { reason }
        );
        // Note: Must return the correct structure expected by the caller
        return this.member; // May be outdated, fetch might be needed
    }

     /**
      * Deafens/undeafens the user (requires permissions).
      * Less reliable/useful for self-bots targeting themselves.
      * @param {boolean} [deaf=true] Whether the user should be deafened
      * @param {string} [reason] Audit log reason
      * @returns {Promise<GuildMember>} The updated member // Requires GuildMember structure
      */
     async setDeaf(deaf = true, reason) {
         if (!this.member) throw new Error('GuildMember not found for this VoiceState.');
         // Delegate to GuildMember.edit() or a direct REST call
         // return this.member.edit({ deaf }, reason); // Conceptual
         await this.client.rest.request(
             'PATCH',
             `/guilds/${this.guild.id}/members/${this.userId}`,
             { deaf: Boolean(deaf) },
             { reason }
         );
         return this.member; // May be outdated, fetch might be needed
     }

     /**
      * Kicks the user from the voice channel (requires permissions).
      * @param {string} [reason] Audit log reason
      * @returns {Promise<GuildMember>} The updated member // Requires GuildMember structure
      */
     async disconnect(reason) {
         if (!this.member) throw new Error('GuildMember not found for this VoiceState.');
          // Setting channel_id to null disconnects the user
         // return this.member.edit({ channel: null }, reason); // Conceptual
         await this.client.rest.request(
             'PATCH',
             `/guilds/${this.guild.id}/members/${this.userId}`,
             { channel_id: null },
             { reason }
         );
         return this.member; // May be outdated, fetch might be needed
     }

    toJSON() {
        return {
            user_id: this.userId,
            session_id: this.sessionId,
            channel_id: this.channelId,
            guild_id: this.guild?.id ?? null,
            deaf: this.serverDeaf,
            mute: this.serverMute,
            self_deaf: this.selfDeaf,
            self_mute: this.selfMute,
            self_video: this.selfVideo,
            self_stream: this.selfStream,
            suppress: this.suppress,
            request_to_speak_timestamp: this.requestToSpeakTimestamp?.toISOString() ?? null,
        };
    }
}

module.exports = VoiceState;
