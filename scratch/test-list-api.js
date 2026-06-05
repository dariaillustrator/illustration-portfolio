import handler from '../api/list-portfolio.js';
import fs from 'fs';

// Read .env manually
const env = {};
try {
  const content = fs.readFileSync('.env', 'utf8');
  content.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  });
} catch (e) {
  console.error('Failed to read .env', e);
}

// Inject env variables to process.env
Object.assign(process.env, env);

const req = {
  method: 'GET',
  headers: {
    authorization: `Bearer ${process.env.ADMIN_API_SECRET || '090516'}`
  }
};

const res = {
  setHeader: () => {},
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    console.log('Status code:', this.statusCode);
    console.log('Response files count:', data.files ? data.files.length : 0);
    console.log('Response:', data);
    return this;
  }
};

handler(req, res);
