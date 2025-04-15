// src/util/Util.js

/**
 * Contains various utility functions.
 */
class Util {
    /**
     * This class is not intended to be instantiated.
     * @throws {Error}
     */
    constructor() {
        throw new Error(`The ${this.constructor.name} class may not be instantiated.`);
    }

    /**
     * Parses a Discord snowflake ID to extract the timestamp.
     * @param {string|bigint} snowflake The snowflake ID to parse.
     * @returns {number} The timestamp (in milliseconds since the Discord epoch) encoded in the snowflake.
     */
    static getTimestampFromSnowflake(snowflake) {
        const DISCORD_EPOCH = 1420070400000;
        try {
            const id = BigInt(snowflake);
            return Number(id >> 22n) + DISCORD_EPOCH;
        } catch (e) {
            console.error(`[Util] Failed to parse snowflake: ${snowflake}`, e);
            return 0; // Or throw an error, depending on desired behavior
        }
    }

    /**
     * Parses a Discord snowflake ID to extract the Date object.
     * @param {string|bigint} snowflake The snowflake ID to parse.
     * @returns {Date} The Date object representing when the snowflake was created.
     */
    static getDateFromSnowflake(snowflake) {
        return new Date(Util.getTimestampFromSnowflake(snowflake));
    }

    /**
     * Splits a string into multiple chunks at a designated character, respecting code blocks and quotes.
     * Useful for splitting long messages.
     * (Example utility, can be expanded)
     * @param {string} text The text to split.
     * @param {object} [options={}] Options for splitting.
     * @param {number} [options.maxLength=2000] Maximum length of each chunk.
     * @param {string} [options.char='\n'] Character to split at.
     * @param {string} [options.prepend=''] Text to prepend to subsequent chunks.
     * @param {string} [options.append=''] Text to append to previous chunks.
     * @returns {string[]} An array of strings.
     */
    static splitMessage(text, { maxLength = 2000, char = '\n', prepend = '', append = '' } = {}) {
        if (text.length <= maxLength) return [text];
        let splitText = [text];
        if (Array.isArray(char)) {
            while (char.length > 0 && splitText.some(elem => elem.length > maxLength)) {
                const currentChar = char.shift();
                if (currentChar instanceof RegExp) {
                     splitText = splitText.flatMap(chunk => chunk.match(currentChar));
                } else {
                    splitText = splitText.flatMap(chunk => chunk.split(currentChar));
                }
            }
        } else {
             splitText = text.split(char);
        }
        if (splitText.some(elem => elem.length > maxLength)) throw new RangeError('SPLIT_MAX_LEN');
        const messages = [];
        let msg = '';
        for (const chunk of splitText) {
            if (msg && (msg + char + chunk + append).length > maxLength) {
                messages.push(msg + append);
                msg = prepend;
            }
            msg += (msg && msg !== prepend ? char : '') + chunk;
        }
        messages.push(msg); // Push the last remaining message
        return messages;
    }

    /**
     * Escapes Markdown characters in a string.
     * @param {string} text The text to escape.
     * @param {object} [options={}] Options for escaping.
     * @param {boolean} [options.codeBlock=true] Whether to escape code blocks.
     * @param {boolean} [options.inlineCode=true] Whether to escape inline code.
     * @param {boolean} [options.bold=true] Whether to escape bold text.
     * @param {boolean} [options.italic=true] Whether to escape italic text.
     * @param {boolean} [options.underline=true] Whether to escape underline text.
     * @param {boolean} [options.strikethrough=true] Whether to escape strikethrough text.
     * @param {boolean} [options.spoiler=true] Whether to escape spoiler text.
     * @param {boolean} [options.codeBlockContent=true] Whether to escape text within code blocks.
     * @param {boolean} [options.inlineCodeContent=true] Whether to escape text within inline code.
     * @returns {string} The escaped text.
     */
    static escapeMarkdown(
        text, {
        codeBlock = true,
        inlineCode = true,
        bold = true,
        italic = true,
        underline = true,
        strikethrough = true,
        spoiler = true,
        codeBlockContent = true,
        inlineCodeContent = true,
        } = {},
    ) {
        if (!codeBlockContent) {
             return text
                 .split('```')
                 .map((subString, index, array) => {
                      if (index % 2 && index !== array.length - 1) return subString;
                      return Util.escapeMarkdown(subString, {
                          codeBlock,
                          inlineCode,
                          bold,
                          italic,
                          underline,
                          strikethrough,
                          spoiler,
                          inlineCodeContent,
                      });
                 })
                 .join(codeBlock ? '\\`\\`\\`' : '```');
        }
        if (!inlineCodeContent) {
            return text
                .split(/(?<=^|[^`])`(?=[^`]|$)/g)
                .map((subString, index, array) => {
                    if (index % 2 && index !== array.length - 1) return subString;
                    return Util.escapeMarkdown(subString, {
                        codeBlock,
                        inlineCode,
                        bold,
                        italic,
                        underline,
                        strikethrough,
                        spoiler,
                    });
                })
                .join(inlineCode ? '\\`' : '`');
        }
        if (inlineCode) text = Util.escapeInlineCode(text);
        if (codeBlock) text = Util.escapeCodeBlock(text);
        if (italic) text = Util.escapeItalic(text);
        if (bold) text = Util.escapeBold(text);
        if (underline) text = Util.escapeUnderline(text);
        if (strikethrough) text = Util.escapeStrikethrough(text);
        if (spoiler) text = Util.escapeSpoiler(text);
        return text;
    }

     // Helper methods for escapeMarkdown (can be made private with symbols or conventions if desired)
     static escapeInlineCode(text) { return text.replace(/(?<=^|[^`])`(?=[^`]|$)/g, '\\`'); }
     static escapeCodeBlock(text) { return text.replace(/```/g, '\\`\\`\\`'); }
     static escapeItalic(text) { return text.replace(/(?<=^|[^_])_(?=[^_]|$)/g, '\\_').replace(/(?<=^|[^*])\*(?=[^*]|$)/g, '\\*'); }
     static escapeBold(text) { return text.replace(/\*\*/g, '\\*\\*'); }
     static escapeUnderline(text) { return text.replace(/__/g, '\\_\\_'); }
     static escapeStrikethrough(text) { return text.replace(/~~/g, '\\~\\~'); }
     static escapeSpoiler(text) { return text.replace(/\|\|/g, '\\|\\|'); }


    // Add more utility functions as needed...
    // e.g., sleep(ms), deepClone(obj), cleanContent(text, channel), etc.

}

module.exports = Util;
