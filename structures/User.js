// src/structures/User.js
const Base = require('./Base');
// const Util = require('../util/Util'); // Optional: For utility functions like getting avatar URLs

/**
 * Represents a Discord user.
 * @extends {Base}
 */
class User extends Base {
    /**
     * @param {Client} client The instantiating client
     * @param {object} data The raw data for the user
     */
    constructor(client, data) {
        super(client);

        /**
         * The ID of the user.
         * @type {string}
         */
        this.id = data.id;

        this._patch(data);
    }

    /**
     * Updates this user structure with new data.
     * @param {object} data The raw data for the user
     * @protected
     */
    _patch(data) {
        if (data.username !== undefined) {
            /**
             * The username of the user.
             * @type {string}
             */
            this.username = data.username;
        }

        if (data.discriminator !== undefined) {
            /**
             * The discriminator of the user. '0' if the user has migrated to unique usernames.
             * @type {string}
             */
            this.discriminator = data.discriminator;
        }

        if (data.avatar !== undefined) {
            /**
             * The user's avatar hash.
             * @type {?string}
             */
            this.avatar = data.avatar;
        }

        if (data.bot !== undefined) {
            /**
             * Whether the user is a bot.
             * Should always be `false` for self-bots, but included for completeness
             * when representing other users/bots encountered.
             * @type {boolean}
             */
            this.bot = Boolean(data.bot);
        }

        if (data.system !== undefined) {
            /**
             * Whether the user is an Official Discord System user (part of the urgent message system).
             * @type {boolean}
             */
            this.system = Boolean(data.system);
        }

        // Add other user properties as needed:
        // if (data.banner !== undefined) this.banner = data.banner;
        // if (data.accent_color !== undefined) this.accentColor = data.accent_color;
        // if (data.flags !== undefined) this.flags = data.flags; // User flags (needs parsing)
        // if (data.public_flags !== undefined) this.publicFlags = data.public_flags; // Public user flags
    }

    /**
     * The tag of the user (Username#Discriminator).
     * Returns only the username if the discriminator is '0'.
     * @type {string}
     * @readonly
     */
    get tag() {
        return typeof this.username === 'string'
            ? this.discriminator && this.discriminator !== '0'
                ? `${this.username}#${this.discriminator}`
                : this.username
            : null;
    }

    /**
     * The time the user was created at.
     * Calculated from the user's ID (Discord snowflake).
     * @type {Date}
     * @readonly
     */
    get createdAt() {
        // Discord epoch (2015-01-01T00:00:00.000Z)
        const DISCORD_EPOCH = 1420070400000;
        // Extract timestamp bits from snowflake
        const timestamp = (BigInt(this.id) >> 22n) + BigInt(DISCORD_EPOCH);
        return new Date(Number(timestamp)); // Convert BigInt timestamp to Number for Date constructor
    }

    /**
     * The timestamp the user was created at.
     * @type {number}
     * @readonly
     */
    get createdTimestamp() {
        return this.createdAt.getTime();
    }

    /**
     * A link to the user's avatar.
     * @param {object} [options={}] Options for the avatar URL.
     * @param {string} [options.format='webp'] The format of the avatar ('webp', 'png', 'jpg', 'jpeg', 'gif').
     * @param {number} [options.size=128] The size of the avatar (power of 2, between 16 and 4096).
     * @param {boolean} [options.dynamic=false] If true, returns a GIF avatar if the user has one set.
     * @returns {?string} The avatar URL, or null if the user has no avatar.
     */
    displayAvatarURL({ format = 'webp', size = 128, dynamic = false } = {}) {
        if (!this.avatar) {
            // Return default avatar URL based on discriminator
            // Note: With unique usernames, the default calculation might change.
            // This uses the classic modulo 5 calculation.
             const defaultAvatarIndex = parseInt(this.discriminator || '0', 10) % 5;
             return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
        }

        // Basic validation (more robust validation could be added)
        const allowedFormats = ['webp', 'png', 'jpg', 'jpeg', 'gif'];
        const allowedSizes = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096];

        format = String(format).toLowerCase();
        if (!allowedFormats.includes(format)) format = 'webp';
        if (!allowedSizes.includes(size)) size = 128;

        // Check for animated avatar
        const isAnimated = this.avatar.startsWith('a_');
        if (dynamic && isAnimated) format = 'gif';

        return `https://cdn.discordapp.com/avatars/${this.id}/${this.avatar}.${format}?size=${size}`;
    }

    // Alias for displayAvatarURL
    avatarURL(options) {
        return this.displayAvatarURL(options);
    }

    /**
     * Creates a mention for the user.
     * @returns {string} `<@USER_ID>`
     */
    toString() {
        return `<@${this.id}>`;
    }

    /**
     * Creates a JSON representation of the user.
     * @returns {object}
     */
    toJSON() {
        return {
            id: this.id,
            username: this.username,
            discriminator: this.discriminator,
            avatar: this.avatar,
            bot: this.bot,
            system: this.system,
            tag: this.tag,
            // Add other fields if needed
        };
    }

    // --- Potential Future Methods ---
    // async createDM() { /* Logic to create/fetch DM channel */ }
    // async fetch() { /* Logic to force-fetch/update user data */ }
}

module.exports = User;
