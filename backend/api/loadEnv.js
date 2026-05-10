/**
 * Environment Variable Loader for Node.js
 * Reads .env file and loads into process.env
 */

const fs = require('fs');
const path = require('path');

function loadEnv(envPath = path.join(__dirname, '../../.env')) {
    if (!fs.existsSync(envPath)) {
        // .env not found — env vars expected from Render environment
        return;
    }

    const lines = fs.readFileSync(envPath, 'utf-8')
        .split('\n')
        .filter(line => line.trim() !== '' && !line.trim().startsWith('#'));

    lines.forEach(line => {
        const equalPos = line.indexOf('=');
        if (equalPos === -1) return;

        const key = line.substring(0, equalPos).trim();
        let value = line.substring(equalPos + 1).trim();

        // Remove surrounding quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        process.env[key] = value;
    });
}

// Auto-load on inclusion
loadEnv();

module.exports = { loadEnv };
