// src/voice/VoiceManager.js

// Required by the adapter creator logic, even if not directly used here otherwise.
const { GatewayVoiceServerUpdateDispatchData, GatewayVoiceStateUpdateDispatchData } = require('@discordjs/voice');
const WebSocket = require('ws'); // Needed for WebSocket.OPEN check

/**
 * Manages voice connections and adapters for the client.
 * Acts as a bridge between the main WebSocket connection and @discordjs/voice.
 */
class VoiceManager {
    /**
     * @param {Client} client The instantiating client
     */
    constructor(client) {
        /**
         * The client that instantiated this Manager
         * @type {Client}
         * @readonly
         */
        this.client = client;

        /**
         * A map storing the active voice adapters provided by @discordjs/voice, keyed by guild ID.
         * The value contains methods like `onVoiceStateUpdate` and `onVoiceServerUpdate` provided by the voice connection instance.
         * @type {Map<string, { onVoiceStateUpdate: Function, onVoiceServerUpdate: Function, destroy: Function }>}
         */
        this.adapters = new Map();
    }

    /**
     * Creates the adapter function required by @discordjs/voice's joinVoiceChannel.
     * This function is called by @discordjs/voice for a specific guild when joining.
     * It registers the necessary handlers provided by @discordjs/voice and provides
     * methods for @discordjs/voice to send voice state updates and destroy the adapter.
     *
     * For user tokens (which do not have a "Bot " prefix) the voice join functionality
     * is disabled to prevent a 4002 error loop – a dummy adapter is returned instead.
     *
     * @param {string} guildId The ID of the guild the adapter is for.
     * @returns {import('@discordjs/voice').DiscordGatewayAdapterCreator}
     */
    createVoiceDispatch(guildId) {
        // If the token does not start with "Bot ", assume it's a user token and disable voice functionality.
        if (!this.client.token || !this.client.token.startsWith("Bot ")) {
            console.warn(`[VoiceManager] Voice join functionality is disabled for user tokens. Guild ${guildId} will not join voice.`);
            return () => ({
                sendPayload: (payload) => {
                    console.warn(`[VoiceManager] Skipped sending payload for Guild ${payload.guild_id} because voice functionality is disabled for user tokens.`);
                    return false;
                },
                destroy: () => {
                    console.log(`[VoiceManager] Dummy adapter destroy called for Guild ${guildId}`);
                }
            });
        }

        // For bot tokens (or when voice join is allowed), return the normal adapter.
        return (methods) => {
            // Store the methods provided by @discordjs/voice's connection instance
            this.adapters.set(guildId, methods);
            // console.debug(`[VoiceManager] Adapter registered for Guild ${guildId}`);

            // Return the interface needed by @discordjs/voice
            return {
                /**
                 * Sends a Voice State Update payload (OpCode 4) via the main WebSocket.
                 * @param {object} payload The payload data (usually includes guild_id, channel_id, self_mute, self_deaf)
                 * @returns {boolean} True if the payload was sent, false otherwise.
                 */
                sendPayload: (payload) => {
                    const wsManager = this.client.ws; // Get WebSocketManager instance

                    // --- Logging the original payload ---
                    console.error("!!! Attempting to send OP 4 Payload:", JSON.stringify(payload));
                    // --- End Logging ---

                    // Check if the WebSocketManager and its underlying ws connection are open
                    if (wsManager?.ws?.readyState === WebSocket.OPEN) {
                        // Create a shallow copy to avoid modifying the original payload.
                        const modifiedPayload = { ...payload };

                        // Set mute/deaf to null as user accounts likely cannot set these via Gateway Op 4.
                        modifiedPayload.self_mute = null;
                        modifiedPayload.self_deaf = null;

                        // Optionally, you can delete these properties if null is not accepted:
                        // delete modifiedPayload.self_mute;
                        // delete modifiedPayload.self_deaf;

                        // Use the send method on WebSocketManager
                        wsManager.send({ op: 4, d: modifiedPayload });
                        return true;
                    }
                    console.warn(`[VoiceManager] Tried to send voice payload for Guild ${payload.guild_id} while WebSocket not ready.`);
                    return false;
                },
                /**
                 * Cleans up the adapter when the voice connection is destroyed.
                 */
                destroy: () => {
                    // console.debug(`[VoiceManager] Adapter destroyed for Guild ${guildId}`);
                    this.adapters.delete(guildId);
                },
            };
        };
    }

    /**
     * Handles VOICE_STATE_UPDATE dispatch events received from the main WebSocket.
     * Called by WebSocketManager's handleDispatch method.
     * Forwards the update to the corresponding @discordjs/voice adapter if it exists.
     * @param {GatewayVoiceStateUpdateDispatchData} data The raw voice state update data.
     * @protected - This method is intended for internal use by WebSocketManager
     */
    onVoiceStateUpdate(data) {
        if (!data.guild_id) return;
        const adapter = this.adapters.get(data.guild_id);
        if (adapter && typeof adapter.onVoiceStateUpdate === 'function') {
            adapter.onVoiceStateUpdate(data);
        }
    }

    /**
     * Handles VOICE_SERVER_UPDATE dispatch events received from the main WebSocket.
     * Called by WebSocketManager's handleDispatch method.
     * Forwards the update to the corresponding @discordjs/voice adapter if it exists.
     * @param {GatewayVoiceServerUpdateDispatchData} data The raw voice server update data (contains token and endpoint).
     * @protected - This method is intended for internal use by WebSocketManager
     */
    onVoiceServerUpdate(data) {
        if (!data.guild_id) return;
        const adapter = this.adapters.get(data.guild_id);
        if (adapter && typeof adapter.onVoiceServerUpdate === 'function') {
            adapter.onVoiceServerUpdate(data);
        }
    }
}

/**
 * Helper function exported for use in Guild.js's voiceAdapterCreator getter.
 * Ensures the VoiceManager exists on the client before creating the dispatch function.
 * @param {Client} client The client instance.
 * @param {string} guildId The guild ID for the adapter.
 * @returns {import('@discordjs/voice').DiscordGatewayAdapterCreator}
 * @throws {Error} If VoiceManager is not initialized on the client.
 */
function createVoiceDispatch(client, guildId) {
    if (!client.voice || !(client.voice instanceof VoiceManager)) {
        throw new Error('Client#voice is not initialized or is not an instance of VoiceManager. Ensure VoiceManager is required and instantiated correctly in Client.js.');
    }
    return client.voice.createVoiceDispatch(guildId);
}

module.exports = { VoiceManager, createVoiceDispatch };
