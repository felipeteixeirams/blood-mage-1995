/**
 * PixelLab MCP & REST API Client for Blood Mage 1995 Vibe Coding
 * 
 * Supports:
 * - balance: Check remaining credits & trial generations
 * - list: List characters & assets
 * - get <character_id>: Get character status, rotation URLs, and animation frames
 * - download <character_id> [output_dir]: Download and extract full asset bundle
 * - create-character --description "<text>" --directions <4|8>: Generate character
 * - animate --character-id "<id>" --template "<anim>": Generate animation
 */

const fs = require('fs');
const path = require('path');

const PIXELLAB_MCP_URL = 'https://api.pixellab.ai/mcp';
const DEFAULT_TOKEN = 'b61c5242-4893-43c9-a2b9-38ba1312d2d4';

function getAuthToken() {
  return process.env.PIXELLAB_API_KEY || DEFAULT_TOKEN;
}

async function callMcpTool(toolName, args = {}) {
  const token = getAuthToken();
  const res = await fetch(PIXELLAB_MCP_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`MCP Error ${res.status}: ${txt}`);
  }

  const rawText = await res.text();
  // MCP returns event: message \n data: { ... } or plain json
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Invalid JSON response: ${rawText}`);
  }

  const data = JSON.parse(jsonMatch[0]);
  if (data.error) {
    throw new Error(`MCP Tool Error: ${JSON.stringify(data.error)}`);
  }

  return data.result;
}

async function downloadZip(url, destPath) {
  const token = getAuthToken();
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Download failed with status ${res.status}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(destPath, buffer);
  return buffer.length;
}

async function main() {
  const command = process.argv[2];

  if (!command || command === 'help') {
    console.log(`
PixelLab MCP Client
Usage:
  node scripts/pixellab_client.cjs balance
  node scripts/pixellab_client.cjs list
  node scripts/pixellab_client.cjs get <character_id>
  node scripts/pixellab_client.cjs download <character_id> [target_dir]
  node scripts/pixellab_client.cjs create-character --description "<desc>" --directions 8
  node scripts/pixellab_client.cjs animate --character-id <id> --template <anim_name>
    `);
    process.exit(0);
  }

  try {
    if (command === 'balance') {
      const result = await callMcpTool('get_balance', {});
      const text = result?.content?.[0]?.text || JSON.stringify(result);
      console.log('--- PixelLab Account Balance ---');
      console.log(text);
    } else if (command === 'list') {
      const result = await callMcpTool('list_characters', {});
      const text = result?.content?.[0]?.text || JSON.stringify(result);
      console.log('--- PixelLab Characters ---');
      console.log(text);
    } else if (command === 'get') {
      const charId = process.argv[3];
      if (!charId) throw new Error('Missing character_id argument.');
      const result = await callMcpTool('get_character', { character_id: charId });
      const text = result?.content?.[0]?.text || JSON.stringify(result);
      console.log(`--- Character Details (${charId}) ---`);
      console.log(text);
    } else if (command === 'download') {
      const charId = process.argv[3];
      const targetDir = process.argv[4] || `sprites_importados/${charId}`;
      if (!charId) throw new Error('Missing character_id argument.');

      const downloadUrl = `https://api.pixellab.ai/mcp/characters/${charId}/download`;
      const tempZip = path.resolve(process.cwd(), `/tmp/pixellab_${charId}.zip`);
      console.log(`[PixelLab] Downloading bundle for ${charId}...`);
      const bytes = await downloadZip(downloadUrl, tempZip);
      console.log(`[PixelLab] Downloaded ${bytes} bytes to ${tempZip}`);

      const resolvedTarget = path.resolve(process.cwd(), targetDir);
      if (!fs.existsSync(resolvedTarget)) {
        fs.mkdirSync(resolvedTarget, { recursive: true });
      }

      console.log(`[PixelLab] Extracting to ${resolvedTarget}...`);
      const { execSync } = require('child_process');
      execSync(`unzip -o "${tempZip}" -d "${resolvedTarget}"`);
      console.log(`[PixelLab] Successfully extracted assets to ${resolvedTarget}`);
    } else if (command === 'create-character') {
      let description = '';
      let n_directions = 8;
      for (let i = 3; i < process.argv.length; i++) {
        if (process.argv[i] === '--description' && process.argv[i + 1]) description = process.argv[i + 1];
        if (process.argv[i] === '--directions' && process.argv[i + 1]) n_directions = parseInt(process.argv[i + 1], 10);
      }
      if (!description) throw new Error('Missing --description argument.');
      console.log(`[PixelLab] Creating ${n_directions}-directional character: "${description}"...`);
      const result = await callMcpTool('create_character', { description, n_directions });
      console.log(result?.content?.[0]?.text || JSON.stringify(result));
    } else if (command === 'animate') {
      let character_id = '';
      let template_animation_id = 'walking';
      for (let i = 3; i < process.argv.length; i++) {
        if (process.argv[i] === '--character-id' && process.argv[i + 1]) character_id = process.argv[i + 1];
        if (process.argv[i] === '--template' && process.argv[i + 1]) template_animation_id = process.argv[i + 1];
      }
      if (!character_id) throw new Error('Missing --character-id argument.');
      console.log(`[PixelLab] Generating animation "${template_animation_id}" for character ${character_id}...`);
      const result = await callMcpTool('animate_character', { character_id, template_animation_id });
      console.log(result?.content?.[0]?.text || JSON.stringify(result));
    } else {
      console.error(`Unknown command: ${command}`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`[PixelLab Error]`, err.message);
    process.exit(1);
  }
}

main();
