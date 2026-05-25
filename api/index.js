// CommonJS entry point for Vercel Serverless Functions.
// The api/package.json file forces CommonJS mode for files inside the /api folder.
const app = require('../backend/server.js');
module.exports = app;
