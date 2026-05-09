const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'UniHiveChangeMePleaseReplaceThisInProduction';
const JWT_EXPIRES_IN = '12h';

function generateAuthToken(user) {
  if (!user || !user.id) {
    throw new Error('Invalid user for token generation');
  }

  const payload = {
    id: user.id,
    role: user.role || 'student'
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyAuthToken(token) {
  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function getAuthTokenFromHeaders(headers = {}) {
  const authorization = headers.authorization || headers.Authorization || headers['authorization'] || headers['Authorization'];
  if (!authorization || typeof authorization !== 'string') {
    return null;
  }

  const normalized = authorization.trim();
  if (!normalized.toLowerCase().startsWith('bearer ')) {
    return null;
  }

  return normalized.slice(7).trim();
}

function getRequestAuth(req) {
  const token = getAuthTokenFromHeaders(req.headers || {});
  return verifyAuthToken(token);
}

module.exports = {
  generateAuthToken,
  verifyAuthToken,
  getRequestAuth
};
