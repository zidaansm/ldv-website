const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');

const envPath = path.resolve(__dirname, '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1]] = match[2].trim().replace(/^"|"$/g, '');
  }
});

const url = env['NEXT_PUBLIC_SUPABASE_URL'] + '/rest/v1/?apikey=' + env['SUPABASE_SERVICE_ROLE_KEY'];

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const openapi = JSON.parse(data);
      const tableDef = openapi.definitions['admin_tasks'];
      console.log(JSON.stringify(tableDef, null, 2));
    } catch (e) {
      console.log(e);
    }
  });
});
