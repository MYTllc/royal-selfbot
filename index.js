module.exports = {
    Client: require('./Client'),
    // Structures
    Base: require('./structures/Base'),
    Guild: require('./structures/Guild'),
    Channel: require('./structures/Channel'), // Might need specific channel types exported
    User: require('./structures/User'),
    Message: require('./structures/Message'),
    VoiceState: require('./structures/VoiceState'),
    // Managers (optional export)
    // BaseManager: require('./managers/BaseManager'),
    // GuildManager: require('./managers/GuildManager'),
    // Util
    Constants: require('./util/Constants'),
    Util: require('./util/Util'), // If you create utility functions
    version: require('../package.json').version,
};

// You might want to export specific channel types if you implement them:
// module.exports.TextChannel = require('./structures/TextChannel');
// module.exports.VoiceChannel = require('./structures/VoiceChannel');
// module.exports.CategoryChannel = require('./structures/CategoryChannel');
