// scratch/test_join.js
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const USER_DATA = path.join(__dirname, 'edge-profile');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log('🚀 Launching Headless Edge...');
  const edgeProc = spawn(EDGE_PATH, [
    '--remote-debugging-port=9222',
    '--headless=new',
    `--user-data-dir=${USER_DATA}`,
    '--disable-gpu',
    '--no-sandbox',
    'https://jueguitosvue.netlify.app/'
  ]);

  edgeProc.on('error', (err) => console.error('Edge Proc Error:', err));

  await sleep(3000);

  console.log('📡 Fetching CDP endpoints...');
  let pages;
  for (let i = 0; i < 5; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/list');
      pages = await res.json();
      if (pages && pages.length > 0) break;
    } catch (e) {
      await sleep(1000);
    }
  }

  if (!pages || pages.length === 0) {
    console.error('❌ Could not find CDP page');
    edgeProc.kill();
    return;
  }

  const targetPage = pages.find(p => p.url.includes('jueguitosvue') || p.type === 'page') || pages[0];
  console.log('🎯 Target Page:', targetPage.url, targetPage.webSocketDebuggerUrl);

  const ws = new WebSocket(targetPage.webSocketDebuggerUrl);

  let msgId = 1;
  const callbacks = new Map();

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      callbacks.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onopen = async () => {
    console.log('✅ Connected to CDP WebSocket');
    await send('Runtime.enable');
    await send('Console.enable');
    await send('Page.enable');

    console.log('⏳ Waiting for page to load completely...');
    await sleep(4000);

    // Evaluate JS to click on Valorant 3D game and join room 8RVRH9
    console.log('🔍 Executing Game navigation and Join Room script in browser...');
    const evalRes = await send('Runtime.evaluate', {
      expression: `(async () => {
        const results = [];
        results.push('Current URL: ' + window.location.href);

        // Find Valorant 3D button or game in navbar
        const buttons = Array.from(document.querySelectorAll('button, a, .nav-btn, .game-card'));
        const v3dBtn = buttons.find(b => (b.innerText || '').toLowerCase().includes('valorant 3d') || (b.innerText || '').toLowerCase().includes('3d'));
        if (v3dBtn) {
          results.push('Clicking Valorant 3D button: ' + v3dBtn.innerText);
          v3dBtn.click();
        } else {
          results.push('No specific 3D nav button found, checking if already on page');
        }

        await new Promise(r => setTimeout(r, 2000));

        // Find Join Code Input
        const inputs = Array.from(document.querySelectorAll('input'));
        const codeInput = inputs.find(i => (i.placeholder || '').toUpperCase().includes('CÓDIGO') || (i.className || '').includes('code-input') || (i.className || '').includes('mp-input'));
        
        if (codeInput) {
          results.push('Found Code Input! Entering 8RVRH9');
          codeInput.value = '8RVRH9';
          codeInput.dispatchEvent(new Event('input', { bubbles: true }));
          codeInput.dispatchEvent(new Event('change', { bubbles: true }));

          await new Promise(r => setTimeout(r, 500));

          // Find UNIRSE button
          const joinBtn = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').trim().toUpperCase() === 'UNIRSE' || (b.innerText || '').toUpperCase().includes('UNIRSE'));
          if (joinBtn) {
            results.push('Clicking UNIRSE button!');
            joinBtn.click();
          } else {
            results.push('Could not find UNIRSE button');
          }
        } else {
          results.push('Could not find Code Input field. Inputs found: ' + inputs.map(i => i.placeholder || i.className).join(', '));
        }

        return results.join(' | ');
      })()`,
      awaitPromise: true,
      returnByValue: true
    });

    console.log('📝 Execution Result:', evalRes?.result?.value);

    console.log('⏳ Observing connection and lobby status for 10 seconds...');
    for (let s = 1; s <= 5; s++) {
      await sleep(2000);
      const statusCheck = await send('Runtime.evaluate', {
        expression: `(() => {
          const lobby = document.querySelector('.mp-lobby-overlay');
          const netBadge = document.querySelector('.net-badge');
          const players = Array.from(document.querySelectorAll('.player-lobby-badge, .p-name')).map(el => el.innerText.trim());
          const codeVal = document.querySelector('.code-val')?.innerText;
          return {
            inLobby: !!lobby,
            netBadge: netBadge?.innerText,
            roomCode: codeVal,
            playersFound: players
          };
        })()`,
        returnByValue: true
      });
      console.log(`⏱️ [${s * 2}s] Lobby State:`, JSON.stringify(statusCheck?.result?.value));
    }

    console.log('🏁 Test completed. Closing browser...');
    ws.close();
    edgeProc.kill();
    process.exit(0);
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && callbacks.has(data.id)) {
      callbacks.get(data.id)(data.result);
      callbacks.delete(data.id);
    }
    if (data.method === 'Runtime.consoleAPICalled') {
      const args = data.params.args.map(a => a.value || a.description).join(' ');
      console.log('🖥️ [BROWSER CONSOLE]:', args);
    }
  };
}

run().catch(console.error);
