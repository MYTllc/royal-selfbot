const axios = require('axios');
const { API_BASE_URL } = require('../util/Constants');
const { version } = require('../../package.json'); // Get library version

class RESTManager {
    constructor(client) {
        this.client = client;
        this.axios = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'User-Agent': `DiscordBot (Royal-Selfbot, ${version})`, // Needs careful crafting for self-bot
                'Content-Type': 'application/json',
            },
        });

        // Add Authorization header dynamically when token is available
        this.axios.interceptors.request.use(config => {
            if (this.client.token) {
                // USER tokens DO NOT start with "Bot "
                config.headers.Authorization = this.client.token;
            } else {
                 console.warn('[REST] Request made before token was available.');
                 // Optionally cancel request or queue it
            }
            // TODO: Implement proper sequential request queue and rate limit handling
            return config;
        });

         // TODO: Add response interceptors for error handling and rate limits (429)
         this.axios.interceptors.response.use(
             response => response,
             error => {
                 console.error('[REST Error]', error.response?.status, error.response?.data);
                 // Handle rate limits (Retry-After header)
                 return Promise.reject(error);
             }
         );
    }

    // Example request method
    async request(method, endpoint, data = {}) {
        try {
            const response = await this.axios({
                method: method.toUpperCase(),
                url: endpoint,
                data: method.toUpperCase() !== 'GET' ? data : undefined, // Send data only for non-GET requests
                params: method.toUpperCase() === 'GET' ? data : undefined, // Send data as query params for GET
            });
            return response.data;
        } catch (error) {
            // Error is already logged by interceptor, rethrow or handle specifically
            throw error;
        }
    }

    // --- Specific API methods ---
    async createMessage(channelId, content) {
        // Basic implementation, needs proper payload structure
        if (typeof content === 'string') {
            content = { content: content };
        }
        return this.request('POST', `/channels/${channelId}/messages`, content);
    }

    async getUser(userId) {
        return this.request('GET', `/users/${userId}`);
    }

    // ... Add methods for all needed REST endpoints
}

module.exports = RESTManager;
