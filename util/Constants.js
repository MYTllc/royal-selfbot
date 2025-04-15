// src/util/Constants.js

// Basic constants - A real implementation needs many more
module.exports = {
    REST_API_VERSION: '9', // Or 10, check Discord's current version
    get API_BASE_URL() {
        return `https://discord.com/api/v${this.REST_API_VERSION}`;
    },

    Gateway: {
        VERSION: '9', // Or 10
        get GATEWAY_URL() {
            // In a real scenario, you fetch this from /gateway/bot endpoint,
            // but self-bots might need to hardcode or discover differently.
            // This is a major hurdle. Let's assume 'wss://gateway.discord.gg'
            // Explicitly request zlib-stream compression
            return `wss://gateway.discord.gg/?v=${this.VERSION}&encoding=json&compress=zlib-stream`;
        },
        OpCodes: {
            DISPATCH: 0, // Receive | An event was dispatched.
            HEARTBEAT: 1, // Send/Receive | Fired periodically by the client to keep the connection alive.
            IDENTIFY: 2, // Send | Starts a new session during the initial handshake.
            PRESENCE_UPDATE: 3, // Send | Update the client's presence.
            VOICE_STATE_UPDATE: 4, // Send | Used to join/leave or move between voice channels.
            RESUME: 6, // Send | Resume a previous session that was disconnected.
            RECONNECT: 7, // Receive | You should attempt to reconnect and resume immediately.
            REQUEST_GUILD_MEMBERS: 8, // Send | Request information about offline guild members in a large guild. (Limited for self-bots)
            INVALID_SESSION: 9, // Receive | The session has been invalidated. You should reconnect and identify/resume accordingly.
            HELLO: 10, // Receive | Sent immediately after connecting, contains heartbeat interval and server debug information.
            HEARTBEAT_ACK: 11, // Receive/Send | Sent in response to receiving a heartbeat to acknowledge that it has been received.
        },
        Events: {
            // Internal library events
            READY: 'ready', // Custom event emitted by the library when ready
            ERROR: 'error', // Custom event for library/WebSocket errors

            // Discord Gateway Dispatch Events (examples, many more exist)
            // Session Events
            RESUMED: 'resumed', // Indicates a successful resume

            // Guild Events
            GUILD_CREATE: 'guildCreate',
            GUILD_UPDATE: 'guildUpdate',
            GUILD_DELETE: 'guildDelete',
            // Guild Member Events (often require privileged intents/chunking - difficult for self-bots)
            GUILD_MEMBER_ADD: 'guildMemberAdd',
            GUILD_MEMBER_UPDATE: 'guildMemberUpdate',
            GUILD_MEMBER_REMOVE: 'guildMemberRemove',
            GUILD_MEMBERS_CHUNK: 'guildMembersChunk',
            // Channel Events
            CHANNEL_CREATE: 'channelCreate',
            CHANNEL_UPDATE: 'channelUpdate',
            CHANNEL_DELETE: 'channelDelete',
            CHANNEL_PINS_UPDATE: 'channelPinsUpdate',
            // Thread Events
            THREAD_CREATE: 'threadCreate',
            THREAD_UPDATE: 'threadUpdate',
            THREAD_DELETE: 'threadDelete',
            THREAD_LIST_SYNC: 'threadListSync',
            THREAD_MEMBER_UPDATE: 'threadMemberUpdate',
            THREAD_MEMBERS_UPDATE: 'threadMembersUpdate',
             // Message Events
            MESSAGE_CREATE: 'messageCreate',
            MESSAGE_UPDATE: 'messageUpdate',
            MESSAGE_DELETE: 'messageDelete',
            MESSAGE_DELETE_BULK: 'messageDeleteBulk',
            MESSAGE_REACTION_ADD: 'messageReactionAdd',
            MESSAGE_REACTION_REMOVE: 'messageReactionRemove',
            MESSAGE_REACTION_REMOVE_ALL: 'messageReactionRemoveAll',
            MESSAGE_REACTION_REMOVE_EMOJI: 'messageReactionRemoveEmoji',
            // Presence Events (Limited usefulness/reliability for self-bots reading others' presence)
            PRESENCE_UPDATE: 'presenceUpdate',
            TYPING_START: 'typingStart',
            // User Events
            USER_UPDATE: 'userUpdate', // Fired when client user's settings change
            // Voice Events
            VOICE_STATE_UPDATE: 'voiceStateUpdate',
            VOICE_SERVER_UPDATE: 'voiceServerUpdate',
            // Interaction Events (Self-bots typically cannot receive interactions)
            INTERACTION_CREATE: 'interactionCreate',
             // Stage Instance Events
             STAGE_INSTANCE_CREATE: 'stageInstanceCreate',
             STAGE_INSTANCE_UPDATE: 'stageInstanceUpdate',
             STAGE_INSTANCE_DELETE: 'stageInstanceDelete',
             // Other Events... Guild Ban, Emojis Update, Integrations, Invites, Webhooks etc.
        },
        CloseCodes: {
            UNKNOWN_ERROR: 4000,
            UNKNOWN_OPCODE: 4001,
            DECODE_ERROR: 4002,
            NOT_AUTHENTICATED: 4003,
            AUTHENTICATION_FAILED: 4004, // Invalid token
            ALREADY_AUTHENTICATED: 4005,
            INVALID_SEQUENCE: 4007, // Invalid sequence number for resume/heartbeat
            RATE_LIMITED: 4008,
            SESSION_TIMED_OUT: 4009, // Session timed out, reconnect and start new session
            INVALID_SHARD: 4010,
            SHARDING_REQUIRED: 4011,
            INVALID_API_VERSION: 4012,
            INVALID_INTENTS: 4013, // Not applicable to self-bots usually
            DISALLOWED_INTENTS: 4014, // Not applicable to self-bots usually
            // Custom codes can be defined here too
        }
    },

    // Mimic browser properties for IDENTIFY payload - VERY FRAGILE and subject to change/detection
    IdentifyProperties: {
        // Values below mimic a standard Windows Chrome browser session
        // Discord actively checks these, using generic values might get flagged easier.
        // Inspecting network requests from a real client is the best way to get current values.
        $os: 'windows', // Should match common OS values ('windows', 'macos', 'linux', 'android', 'ios')
        $browser: 'chrome', // Should match common browser values ('chrome', 'firefox', 'safari', 'discord client')
        $device: '', // Often empty for desktop browsers, might have model for mobile
        // --- Additional properties sometimes seen ---
        // system_locale: 'en-US', // e.g., from navigator.language
        // browser_user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36', // Example, match current browser UAs
        // browser_version: '110.0.0.0', // Example
        // os_version: '10', // Example for Windows 10
        // referrer: '', // Usually empty or previous discord domain
        // referring_domain: '', // Usually empty or previous discord domain
        // release_channel: 'stable', // Discord client release channel
        // client_build_number: 170000, // Example, changes frequently
        // client_event_source: null, // Usually null
    },

    // Other constants can be added here: Permissions, Channel Types, Message Types, Intent Flags (though not used for self-bots), API Endpoints, CDN URLs etc.
    Endpoints: {
        // Example
        CDN_URL: 'https://cdn.discordapp.com',
        // getAvatar: (userId, avatarHash) => `/avatars/${userId}/${avatarHash}`,
    }
};
