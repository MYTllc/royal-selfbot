// src/structures/Base.js

/**
 * Represents a basic structure provided by the Discord API.
 * All structures that represent Discord objects, such as Guilds,
 * Channels, Users, etc., should extend this class.
 */
class Base {
    /**
     * @param {Client} client The instantiating client
     */
    constructor(client) {
        /**
         * The client that instantiated this structure
         * @name Base#client
         * @type {Client}
         * @readonly
         */
        Object.defineProperty(this, 'client', { value: client });
    }

    /**
     * Method for updating the structure's properties with new data.
     * This is intended to be implemented by extending classes.
     * @param {*} data The data to patch the structure with
     * @protected - Should be used internally by managers or the client.
     * @abstract
     */
    _patch(data) {
        // Base classes might not need patching, but subclasses will implement this.
        // Example: In Guild.js, this method updates guild.name, guild.icon, etc.
        // In User.js, this method updates user.username, user.discriminator, etc.
        // Throwing an error here encourages implementation in subclasses.
        // However, for simplicity, we can leave it empty.
        // throw new Error(`_patch not implemented on ${this.constructor.name}`);
    }

    /**
     * Clones the structure.
     * Creates a new instance of the structure and shallow copies the properties.
     * @returns {Base} The cloned structure
     * @abstract - Subclasses should implement this if deep cloning or specific
     *             property handling is needed.
     */
    _clone() {
        // Creates a new instance of the same class and copies properties.
        return Object.assign(Object.create(this), this);
    }

    /**
     * Checks if this structure is equal to another.
     * The base implementation checks for strict equality (same instance).
     * Subclasses might override this for deep equality checks based on ID or properties.
     * @param {Base} other The structure to compare with.
     * @returns {boolean}
     */
    equals(other) {
        return this === other;
    }

    /**
     * Basic JSON representation of the structure.
     * Subclasses should override this to include relevant properties.
     * Often includes the 'id' property.
     * @returns {object}
     * @abstract
     */
    toJSON() {
        // Base implementation returns an empty object or could throw.
        // Subclasses like Guild, User, etc., will return their relevant data.
        // Example for a structure with an ID: return { id: this.id };
        return {};
    }

    /**
     * Basic string representation of the structure.
     * Subclasses might override this to provide a more meaningful string,
     * e.g., `<Guild: Guild Name (Guild ID)>` or `<User: Username#Discriminator (User ID)>`.
     * @returns {string}
     */
    toString() {
        return `[${this.constructor.name}]`;
    }
}

module.exports = Base;
