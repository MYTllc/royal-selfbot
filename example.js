// example.js - STABLE VERSION (Force Voice Join Enabled for Testing with Payload Fix)

const TARGET_GUILD_ID = '  ';      // Your Server ID
const TARGET_VOICE_CHANNEL_ID = '  '; // Your Voice Channel ID

console.log("Starting Royal-Selfbot Example... (Force Voice Join Enabled)");
console.warn("--- WARNING: Running a self-bot violates Discord's Terms of Service and can result in account termination. Use at your own risk. ---");
console.warn("--- WARNING: Forcing voice join on a self-bot is not supported by Discord and may lead to errors or account termination. ---");

require('dotenv').config(); // Load token from .env file
const { Client } = require('./src'); // Use the local client source code (includes VoiceManager)
const { joinVoiceChannel, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const WebSocket = require('ws');

// --- Environment Variable Check ---
if (!process.env.DISCORD_USER_TOKEN) {
    console.error("ERROR: DISCORD_USER_TOKEN not found in .env file.");
    process.exit(1);
}
if (!TARGET_VOICE_CHANNEL_ID || TARGET_VOICE_CHANNEL_ID === 'YOUR_VOICE_CHANNEL_ID_HERE') {
    console.error("ERROR: TARGET_VOICE_CHANNEL_ID is not set correctly.");
    process.exit(1);
}
if (!TARGET_GUILD_ID || TARGET_GUILD_ID === 'YOUR_SERVER_ID_HERE') {
    console.error("ERROR: TARGET_GUILD_ID is not set correctly.");
    process.exit(1);
}

// --- Create Client Instance ---
const client = new Client();

// --- Force Voice Adapter Override ---
// Override the createVoiceDispatch function so that the payload sent is fixed.
// This version checks if the incoming payload already has an op and d structure.
// If so, we update only the inner d object; otherwise, we wrap the payload.
if (client.voice && typeof client.voice.createVoiceDispatch === 'function') {
    client.voice.createVoiceDispatch = (guildId) => {
        return (methods) => {
            client.voice.adapters.set(guildId, methods);
            return {
                sendPayload: (payload) => {
                    const wsManager = client.ws;
                    let updatedPayload;

                    // Check if the payload is already structured with op and d
                    if (payload && typeof payload === 'object' && 'op' in payload && 'd' in payload) {
                        // Update only the inner payload (payload.d)
                        const newD = { ...payload.d, self_mute: null, self_deaf: null };
                        updatedPayload = { op: payload.op, d: newD };
                    } else {
                        // Assume payload is a plain object and wrap it
                        const newPayload = { ...payload, self_mute: null, self_deaf: null };
                        updatedPayload = { op: 4, d: newPayload };
                    }

                    console.error("!!! Attempting to send OP 4 Payload (Forced):", JSON.stringify(updatedPayload));
                    
                    if (wsManager && wsManager.ws && wsManager.ws.readyState === WebSocket.OPEN) {
                        wsManager.send(updatedPayload);
                        return true;
                    }
                    
                    console.warn(`[VoiceManager] Tried to send voice payload for Guild ${payload.guild_id} while WebSocket not ready.`);
                    return false;
                },
                destroy: () => {
                    client.voice.adapters.delete(guildId);
                }
            };
        };
    };
} else {
    console.error("VoiceManager not found on client. Cannot force voice join.");
}

// --- Client Event Handlers ---
client.once('ready', async (readyClient) => {
    console.log(`Logged in as ${readyClient.user?.tag}!`);
    console.log(`Client ready. Found ${readyClient.guilds.cache.size} guild(s) in cache.`);

    try {
        // Resolve the target guild and voice channel
        const targetGuild = readyClient.guilds.resolve(TARGET_GUILD_ID);
        if (!targetGuild) {
            console.error(`Target guild with ID ${TARGET_GUILD_ID} not found in client's cache.`);
            return;
        }
        const targetChannel = targetGuild.channels.resolve(TARGET_VOICE_CHANNEL_ID);
        if (!targetChannel || !targetChannel.isVoice()) {
            console.error(`Target channel is either not found or not a valid voice channel in Guild '${targetGuild.name}'.`);
            return;
        }

        console.log(`[Ready] Target Guild '${targetGuild.name}' and VC '${targetChannel.name}' found. Attempting to join VC...`);

        // Attempt to join the voice channel using @discordjs/voice with our forced adapter
        const connection = joinVoiceChannel({
            channelId: TARGET_VOICE_CHANNEL_ID,
            guildId: TARGET_GUILD_ID,
            adapterCreator: readyClient.voice.createVoiceDispatch(TARGET_GUILD_ID),
        });

        // Wait up to 30 seconds for the connection to reach the Ready status
        try {
            await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
            console.log(`[Voice] Successfully connected to voice channel '${targetChannel.name}'.`);
        } catch (error) {
            console.error(`[Voice] Failed to join voice channel within 30 seconds:`, error);
            connection.destroy();
        }
    } catch (err) {
        console.error("[Ready] Error during voice join attempt:", err);
    }

});

client.on('error', (error) => {
    console.error('[Client Error]', error);
});

// --- Login and Process Handling ---
console.log("Logging in...");
client.login(process.env.DISCORD_USER_TOKEN)
    .then(() => {
        console.log("Login process successfully initiated. Waiting for 'ready' event...");
    })
    .catch(error => {
        console.error("Login failed:", error);
        process.exit(1);
    });

console.log("Script setup complete. Process will stay alive while connected.");

// --- Graceful Shutdown Handling ---
const cleanup = () => {
    console.log("Initiating graceful shutdown...");
    client.destroy(); // Internal cleanup routines
};
process.on('SIGINT', () => { console.log("SIGINT received."); cleanup(); });
process.on('SIGTERM', () => { console.log("SIGTERM received."); cleanup(); });
