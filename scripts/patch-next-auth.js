const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'node_modules', 'next-auth', 'react', 'index.js');

if (!fs.existsSync(targetFile)) {
  console.log('[patch-next-auth] target file not found, skipping:', targetFile);
  process.exit(0);
}

let content = fs.readFileSync(targetFile, 'utf8');

if (content.includes('var _nextauth_env =')) {
  console.log('[patch-next-auth] already patched.');
  process.exit(0);
}

const targetBlock = `var __NEXTAUTH = {
  baseUrl: (0, _parseUrl.default)((_process$env$NEXTAUTH = process.env.NEXTAUTH_URL) !== null && _process$env$NEXTAUTH !== void 0 ? _process$env$NEXTAUTH : process.env.VERCEL_URL).origin,
  basePath: (0, _parseUrl.default)(process.env.NEXTAUTH_URL).path,
  baseUrlServer: (0, _parseUrl.default)((_ref = (_process$env$NEXTAUTH2 = process.env.NEXTAUTH_URL_INTERNAL) !== null && _process$env$NEXTAUTH2 !== void 0 ? _process$env$NEXTAUTH2 : process.env.NEXTAUTH_URL) !== null && _ref !== void 0 ? _ref : process.env.VERCEL_URL).origin,
  basePathServer: (0, _parseUrl.default)((_process$env$NEXTAUTH3 = process.env.NEXTAUTH_URL_INTERNAL) !== null && _process$env$NEXTAUTH3 !== void 0 ? _process$env$NEXTAUTH3 : process.env.NEXTAUTH_URL).path,
  _lastSync: 0,
  _session: undefined,
  _getSession: function _getSession() {}
};`;

const replacementBlock = `var _nextauth_env = (typeof process !== "undefined" && process && process.env) || (typeof window !== "undefined" && window.process && window.process.env) || (typeof globalThis !== "undefined" && globalThis.process && globalThis.process.env) || {};
var __NEXTAUTH = {
  baseUrl: (0, _parseUrl.default)((_process$env$NEXTAUTH = _nextauth_env.NEXTAUTH_URL) !== null && _process$env$NEXTAUTH !== void 0 ? _process$env$NEXTAUTH : _nextauth_env.VERCEL_URL).origin,
  basePath: (0, _parseUrl.default)(_nextauth_env.NEXTAUTH_URL).path,
  baseUrlServer: (0, _parseUrl.default)((_ref = (_process$env$NEXTAUTH2 = _nextauth_env.NEXTAUTH_URL_INTERNAL) !== null && _process$env$NEXTAUTH2 !== void 0 ? _process$env$NEXTAUTH2 : _nextauth_env.NEXTAUTH_URL) !== null && _ref !== void 0 ? _ref : _nextauth_env.VERCEL_URL).origin,
  basePathServer: (0, _parseUrl.default)((_process$env$NEXTAUTH3 = _nextauth_env.NEXTAUTH_URL_INTERNAL) !== null && _process$env$NEXTAUTH3 !== void 0 ? _process$env$NEXTAUTH3 : _nextauth_env.NEXTAUTH_URL).path,
  _lastSync: 0,
  _session: undefined,
  _getSession: function _getSession() {}
};`;

if (content.includes(targetBlock)) {
  content = content.replace(targetBlock, replacementBlock);
} else {
  // Fallback regex replacement if formatting slightly differs
  content = content.replace(/var __NEXTAUTH = \{[\s\S]*?_getSession: function _getSession\(\) \{\}\s*\};/, replacementBlock);
}

content = content.replace('if (!value && process.env.NODE_ENV !== "production")', 'if (!value && _nextauth_env.NODE_ENV !== "production")');

fs.writeFileSync(targetFile, content, 'utf8');
console.log('[patch-next-auth] Successfully patched next-auth/react/index.js');
