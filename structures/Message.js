// src/structures/Message.js
const Base = require('./Base');
const User = require('./User'); // Requires User.js structure to be created

/**
 * Represents a message on Discord.
 * @extends {Base}
 */
class Message extends Base {
    /**
     * @param {Client} client The instantiating client
     * @param {object} data The raw message data from the API or WebSocket
     * @param {Channel} channel The channel the message was sent in
     */
    constructor(client, data, channel) {
        super(client);

        /**
         * The channel that the message was sent in.
         * @type {Channel}
         */
        this.channel = channel;

        /**
         * The ID of the message.
         * @type {string}
         */
        this.id = data.id;

        // Apply initial data
        this._patch(data);
    }

    /**
     * Updates the message structure with new data.
     * @param {object} data The raw data for the message
     * @protected
     */
    _patch(data) {
        /**
         * The content of the message.
         * @type {string}
         */
        this.content = data.content ?? this.content ?? ''; // Handle potential missing content on updates

        /**
         * The user who sent the message.
         * @type {User}
         */
        // Create/update User structure from author data
        // Assumes client.users is the UserManager instance and _add handles caching
        if (data.author) {
             this.author = this.client.users._add(data.author);
        } else if (!this.author) {
             // Handle cases where author might be missing unexpectedly (e.g., webhook message patch?)
             this.author = null; // Or a placeholder User object
        }
        // Note: If only partial data is received (e.g., message update event), 'author' might not be present.

        /**
         * The timestamp the message was sent at.
         * @type {number}
         */
        if (data.timestamp) {
            this.createdTimestamp = Date.parse(data.timestamp);
        }

        /**
         * The guild the message was sent in (if applicable).
         * Should be fetched from the channel if not directly provided.
         * @type {?Guild}
         */
        this.guild = this.channel?.guild ?? null; // Access guild through channel

        /**
         * The ID of the guild the message was sent in (if applicable).
         * @type {?string}
         */
        // Prefer guild_id from data if available, otherwise fallback to channel's guild id
        this.guildId = data.guild_id ?? this.guild?.id ?? null;

         /**
          * The ID of the channel the message was sent in.
          * Should be consistent with this.channel.id
          * @type {string}
          */
         this.channelId = data.channel_id ?? this.channel.id;


        // Add other message properties as needed, checking if they exist in `data`:
        if (data.attachments !== undefined) this.attachments = new Map(data.attachments?.map(att => [att.id, att]));
        if (data.embeds !== undefined) this.embeds = data.embeds ?? [];
        // TODO: Implement proper mention parsing if needed
        // if (data.mentions !== undefined) this.mentions = parseMentions(data.mentions);
        if (data.edited_timestamp !== undefined) this.editedTimestamp = data.edited_timestamp ? Date.parse(data.edited_timestamp) : null;
        if (data.tts !== undefined) this.tts = data.tts ?? false;
        if (data.pinned !== undefined) this.pinned = data.pinned ?? false;
        if (data.type !== undefined) this.type = data.type; // Message type (Default, Reply, etc.)
        if (data.message_reference !== undefined) this.reference = data.message_reference; // For replies
        // ... and many more potential fields like flags, components, stickers, reactions, etc.
    }

    /**
     * The time the message was sent at.
     * @type {Date}
     * @readonly
     */
    get createdAt() {
        return new Date(this.createdTimestamp);
    }

    /**
     * The time the message was last edited at (if applicable).
     * @type {?Date}
     * @readonly
     */
    get editedAt() {
        return this.editedTimestamp ? new Date(this.editedTimestamp) : null;
    }

    /**
     * Sends a reply to the message.
     * @param {string|object} contentOrOptions The content or options for the reply. Can be a string for simple content,
     * or an object matching Discord API params (content, embeds, components, allowed_mentions etc.)
     * @param {object} [options.allowed_mentions] Options for mentions in the reply. Defaults to mentioning the replied user.
     * @param {boolean} [options.failIfNotExists=true] Whether the reply should fail if the original message was deleted.
     * @returns {Promise<Message>} The reply message.
     */
    async reply(contentOrOptions) {
        let payload = {};
        if (typeof contentOrOptions === 'string') {
            payload.content = contentOrOptions;
        } else {
             payload = { ...contentOrOptions }; // Shallow copy options object
        }

        // Add message reference for reply
        payload.message_reference = {
            message_id: this.id,
            channel_id: this.channelId, // Use channelId directly
            guild_id: this.guildId, // Use guildId directly
            fail_if_not_exists: payload.failIfNotExists ?? true, // Default fail if original message deleted
        };
        // Remove custom option if it exists on the payload root
        delete payload.failIfNotExists;

        // Ensure allowed_mentions exists if needed, default to allowing replied user ping
         if (payload.allowed_mentions === undefined) {
             payload.allowed_mentions = { replied_user: true };
         } else if (payload.allowed_mentions.replied_user === undefined) {
             payload.allowed_mentions.replied_user = true;
         }

        // Delegate sending to the channel's send method
        return this.channel.send(payload);
    }

    /**
     * Edits the content of the message.
     * Self-bots can only edit their own messages.
     * @param {string|object} contentOrOptions The new content or options for the message.
     * @returns {Promise<Message>} The updated message.
     */
    async edit(contentOrOptions) {
        // Check if the author is the client user - crucial for self-bots
        if (this.author?.id !== this.client.user?.id) {
            return Promise.reject(new Error('Self-bots can only edit their own messages.'));
        }

        let payload = {};
        if (typeof contentOrOptions === 'string') {
            payload.content = contentOrOptions;
        } else {
            payload = { ...contentOrOptions }; // Copy options (e.g., embeds, components, flags)
        }

        try {
            const updatedData = await this.client.rest.request(
                'PATCH',
                `/channels/${this.channelId}/messages/${this.id}`,
                payload
            );
            // Update this message instance with the new data
            this._patch(updatedData);
            return this;
        } catch (error) {
            console.error(`[Message Edit Error] Failed to edit message ${this.id}:`, error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Deletes the message.
     * @param {object} [options={}] Options for deletion.
     * @param {number} [options.timeout=0] How long to wait to delete the message (in milliseconds).
     * @param {string} [options.reason] Audit log reason (less relevant for self-bots but good practice).
     * @returns {Promise<Message>} This message instance (marked as deleted).
     */
    async delete({ timeout = 0, reason } = {}) {
        if (timeout <= 0) {
            try {
                await this.client.rest.request('DELETE', `/channels/${this.channelId}/messages/${this.id}`, { reason });
                // Optionally mark this instance as deleted, e.g., this.deleted = true;
                return this; // Return the message instance
            } catch (error) {
                 console.error(`[Message Delete Error] Failed to delete message ${this.id}:`, error.response?.data || error.message);
                 throw error;
            }
        } else {
            // Wait for the specified timeout then delete
            await new Promise(resolve => setTimeout(resolve, timeout));
            return this.delete({ timeout: 0, reason }); // Call delete again without timeout
        }
    }

    /**
     * Creates a JSON representation of the message.
     * @returns {object}
     */
    toJSON() {
        // Include essential properties, potentially call toJSON on nested structures
        return {
            id: this.id,
            channel_id: this.channelId,
            guild_id: this.guildId ?? null,
            author: this.author?.toJSON(), // Assuming User structure has toJSON
            content: this.content,
            timestamp: this.createdAt?.toISOString(), // Use optional chaining
            edited_timestamp: this.editedAt?.toISOString() ?? null,
            tts: this.tts,
            pinned: this.pinned,
            type: this.type,
            attachments: this.attachments ? Array.from(this.attachments.values()) : [],
            embeds: this.embeds ?? [],
            // Add other properties like mentions, reactions, components etc. if needed
        };
    }

    /**
     * Returns the message content.
     * @returns {string}
     */
    toString() {
        return this.content;
    }
}

module.exports = Message;
