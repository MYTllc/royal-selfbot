// src/Client.js

const EventEmitter = require('events');
const RESTManager = require('./rest/RESTManager');
const WebSocketManager = require('./gateway/WebSocketManager');
const GuildManager = require('./managers/GuildManager');
const ChannelManager = require('./managers/ChannelManager');
const UserManager = require('./managers/UserManager');
const MessageManager = require('./managers/MessageManager'); // Global message cache (optional, usually per-channel)
const User = require('./structures/User'); // For client.user
const { VoiceManager } = require('./voice/VoiceManager'); // Import the class
const { Gateway } = require('./util/Constants');


/**
 * The main hub for interacting with the Discord API.
 * @extends {EventEmitter}
 */
class Client extends EventEmitter {
    /**
     * @param {object} [options={}] Options for the client. (Currently unused, placeholder)
     * @param {number[]} [options.disabledEvents=[]] Optional array of gateway events to disable handling for.
     */
    constructor(options = {}) {
        super();

        /**
         * The options the client was instantiated with.
         * @type {object}
         */
        this.options = options; // Store options if needed later

        /**
         * The Discord user token used for authentication.
         * @type {?string}
         */
        this.token = null;

        /**
         * The user account that the client is logged in as.
         * Populated after the READY event.
         * @type {?User}
         */
        this.user = null; // Client user info, populated on READY

        /**
         * The session ID for the current gateway session.
         * Populated after the READY event. Null if not connected.
         * @type {?string}
         */
        this.sessionId = null;

        // --- Managers ---
        /**
         * Manages the guilds the client is in.
         * @type {GuildManager}
         */
        this.guilds = new GuildManager(this);

        /**
         * Manages all channels the client has access to (guild channels and DMs).
         * @type {ChannelManager}
         */
        this.channels = new ChannelManager(this); // Global channel manager

        /**
         * Manages user objects encountered by the client.
         * @type {UserManager}
         */
        this.users = new UserManager(this);

        /**
         * Manages messages, often used more effectively per-channel.
         * This top-level one could be a limited global cache if desired, or removed.
         * @type {MessageManager}
         */
        // Consider if a global message manager is truly useful or if it should only exist per-channel.
        // For simplicity, we instantiate one here, but its use might be limited.
        this.messages = new MessageManager(this, null); // Pass null for channel as it's global

        /**
         * Manages voice connections and adapters via @discordjs/voice.
         * @type {VoiceManager}
         */
        this.voice = new VoiceManager(this); // Initialize Voice Manager


        // --- Core Components ---
        /**
         * The REST manager for handling API requests.
         * @type {RESTManager}
         */
        this.rest = new RESTManager(this);

        /**
         * The WebSocket manager for handling the gateway connection.
         * @type {WebSocketManager}
         */
        this.ws = new WebSocketManager(this);


        // --- Event Binding ---
        this._bindWSEvents();

        // Add a handler for process exit signals for graceful shutdown
        this._setupCleanup();
    }

    /**
     * Binds essential internal event listeners from the WebSocketManager.
     * @private
     */
    _bindWSEvents() {
        // Listen for the internal 'ready' event from WebSocketManager *after* patching
        this.ws.on(Gateway.Events.READY, () => {
            // The 'ready' event listeners added by the user (`client.on('ready', ...)`)
            // will fire *after* this internal handler completes.
            console.log('[Client] Client is ready!');
            // Emit the public 'ready' event, passing the client instance itself
            this.emit('ready', this);
        });

        // Forward WebSocket errors to the client's error event
        this.ws.on(Gateway.Events.ERROR, (error) => {
            console.error('[Client] Received WebSocket Error:', error);
            this.emit(Gateway.Events.ERROR, error); // Forward the error
        });

        // Optional: Listen for other WS states if needed (e.g., reconnecting, resumed)
        // this.ws.on('reconnecting', () => { console.log('[Client] WebSocket is reconnecting...'); });
        // this.ws.on(Gateway.Events.RESUMED, () => { console.log('[Client] Session resumed.'); });
    }

    /**
     * Patches the client state with data received from the READY gateway event.
     * Called internally by WebSocketManager.
     * @param {object} data The data payload from the READY event.
     * @protected
     */
    _patch(data) {
        if (!data) return;

        // Patch client user
        if (data.user) {
            // Use the UserManager's _add method which creates/updates and caches
            this.user = this.users._add(data.user);
            // console.debug('[Client Patch] Patched client user:', this.user.tag);
        }

        // Update session ID
        if (data.session_id) {
             this.sessionId = data.session_id;
             // console.debug('[Client Patch] Session ID set:', this.sessionId);
        }

        // Handle initial guilds - GuildManager's _add method handles structure creation & patching
        if (data.guilds) {
             // console.debug(`[Client Patch] Receiving ${data.guilds.length} initial guilds.`);
             data.guilds.forEach(guildData => {
                 // Ensure unavailable is properly handled if GUILD_CREATE comes for an initially unavailable guild
                 const existing = this.guilds.cache.get(guildData.id);
                 if (existing && existing.unavailable) {
                     guildData.unavailable = false; // Mark as available now
                 }
                 this.guilds._add(guildData); // _add handles creation/patching
             });
        }

         // Handle initial private channels (DMs)
         if (data.private_channels) {
             // console.debug(`[Client Patch] Receiving ${data.private_channels.length} initial DMs.`);
             data.private_channels.forEach(dmData => {
                 this.channels._add(dmData); // Use the global ChannelManager
             });
         }

         // Handle unavailable guilds if any (these guilds didn't fire GUILD_CREATE yet)
         // Note: 'unavailable_guilds' is less common in READY now, guilds array usually contains { id: ..., unavailable: true }
         if (data.unavailable_guilds) {
             // console.debug(`[Client Patch] Receiving ${data.unavailable_guilds.length} unavailable guilds.`);
             data.unavailable_guilds.forEach(guildData => {
                 if (!this.guilds.cache.has(guildData.id)) {
                     this.guilds._add({ id: guildData.id, unavailable: true });
                 }
             });
         }
         // console.debug(`[Client Patch] Guild cache size after READY: ${this.guilds.cache.size}`);
    }

    /**
     * Logs in to Discord.
     * @param {string} token The Discord user token. **Using user tokens is against Discord ToS.**
     * @returns {Promise<string>} The token used.
     */
    async login(token) {
        if (!token || typeof token !== 'string') {
            throw new Error('A valid token must be provided.');
        }
        // Basic token format check (doesn't guarantee validity or type)
        if (!/^[A-Za-z0-9._-]+$/.test(token)) {
             console.warn("Token format looks potentially invalid. Ensure you're using the correct token.");
        }

        this.token = token;
        console.log('[Client] Logging in with token...');

        try {
            // Initiate connection - WS manager handles identify/resume/ready
            this.ws.connect(this.token);

            // Return a promise that resolves when the 'ready' event is emitted by the client
            await new Promise((resolve, reject) => {
                const cleanup = () => {
                    this.off('ready', onReady);
                    this.off(Gateway.Events.ERROR, onError);
                };
                const onReady = () => {
                    cleanup();
                    resolve(); // Resolve promise when client is ready
                };
                const onError = (err) => {
                    cleanup();
                    this.destroy(); // Clean up client state on login failure
                    reject(err); // Reject promise on error
                };

                this.once('ready', onReady); // Listen for the public ready event
                this.once(Gateway.Events.ERROR, onError); // Listen for any connection/auth errors
            });

            return this.token; // Return token on successful login/ready
        } catch (error) {
             console.error("[Client Login Error]", error);
             this.destroy(); // Ensure cleanup on error during login process
             throw error; // Re-throw error for external handling
        }
    }

    /**
     * Destroys the client, closing the WebSocket connection and cleaning up.
     */
    destroy() {
        console.log('[Client] Destroying client...');

        // Destroy WebSocket connection (sends close frame)
        this.ws.destroy({ reason: 'Client destroyed' });

        // Clean up voice connections (important!)
        // Iterate through active adapters and tell associated connections to disconnect/destroy
        if (this.voice && this.voice.adapters.size > 0) {
            console.log(`[Client Destroy] Cleaning up ${this.voice.adapters.size} voice adapter(s)...`);
             try {
                 // Requires access to @discordjs/voice's getVoiceConnection function
                 const { getVoiceConnection } = require('@discordjs/voice');
                 for (const guildId of this.voice.adapters.keys()) {
                     const connection = getVoiceConnection(guildId);
                     if (connection) {
                         connection.destroy();
                     }
                 }
                 this.voice.adapters.clear(); // Clear the adapters map
             } catch (e) {
                  console.error("[Client Destroy] Error cleaning up voice connections (is @discordjs/voice installed?):", e);
             }
        }

        // Clear caches (optional, depends if you want state after destroy)
        this.guilds.cache.clear();
        this.channels.cache.clear();
        this.users.cache.clear();
        this.messages.cache.clear();

        // Reset client state
        this.token = null;
        this.user = null;
        this.sessionId = null;

        // Remove all listeners to prevent memory leaks
        this.removeAllListeners();

        // Remove process exit listeners if added
        this._cleanupProcessListeners();

        console.log('[Client] Destroyed.');
    }

    /**
     * Sets up listeners for process exit signals for graceful shutdown.
     * @private
     */
    _setupCleanup() {
        // Store bound listeners so they can be removed later
        this._boundProcessExit = this._gracefulShutdown.bind(this, 'processExit');
        this._boundSigInt = this._gracefulShutdown.bind(this, 'SIGINT');
        this._boundSigTerm = this._gracefulShutdown.bind(this, 'SIGTERM');

        process.on('exit', this._boundProcessExit); // Doesn't allow async, best effort cleanup
        process.on('SIGINT', this._boundSigInt); // Ctrl+C
        process.on('SIGTERM', this._boundSigTerm); // Kill command
    }

    /**
     * Removes process exit listeners.
     * @private
     */
    _cleanupProcessListeners() {
        if (this._boundProcessExit) process.removeListener('exit', this._boundProcessExit);
        if (this._boundSigInt) process.removeListener('SIGINT', this._boundSigInt);
        if (this._boundSigTerm) process.removeListener('SIGTERM', this._boundSigTerm);
    }

    /**
     * Handles graceful shutdown on process exit signals.
     * @param {string} signal The signal received.
     * @private
     */
    _gracefulShutdown(signal) {
        console.log(`[Client] Received ${signal}. Initiating graceful shutdown...`);
        this.destroy();
        // In SIGINT/SIGTERM, we might have a small window for async ops, but exit handlers don't.
        // For SIGINT/SIGTERM, explicitly exit after cleanup attempt
        if (signal !== 'processExit') {
             // Give a very short moment for WS close frame to potentially send
             // setTimeout(() => process.exit(0), 500);
             process.exit(0); // Exit immediately after calling destroy
        }
    }

}

module.exports = Client;
