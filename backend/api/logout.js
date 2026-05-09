/**
 * Logout API
 * POST /api/logout
 */

function logoutHandler(req, res) {
    // In a cookie-based session, we'd destroy the session here
    // Since this API uses token-based auth (localStorage), just return success
    res.json({
        status: 'success',
        message: 'Logged out'
    });
}

module.exports = logoutHandler;
