console.log("popup.js loaded");

// popup.js — saves token to chrome.storage.local and shows status

const tokenEl = document.getElementById('token');
const saveBtn = document.getElementById('save');
const clearBtn = document.getElementById('clear');
const statusEl = document.getElementById('status');

async function showStatus(msg, ok = true) {
  statusEl.textContent = msg;
  statusEl.style.color = ok ? '#0a0' : '#c33';
}

// Load token on open
chrome.storage.local.get(['bgg_token']).then(result => {
  if (result.bgg_token) tokenEl.value = result.bgg_token;
});


saveBtn.addEventListener('click', async () => {
  const token = tokenEl.value.trim();
  if (!token) {
    await chrome.storage.local.remove('bgg_token');
    showStatus('Token removed', true);
    // inform background that token cleared
    chrome.runtime.sendMessage({type: 'bgg_token_updated'});
    return;
  }

  await chrome.storage.local.set({ bgg_token: token });
  showStatus('Token saved', true);
  // optionally notify background to refresh cached token
  chrome.runtime.sendMessage({type: 'bgg_token_updated'});
});

clearBtn.addEventListener('click', async () => {
  tokenEl.value = '';
  await chrome.storage.local.remove('bgg_token');
  showStatus('Token cleared', true);
  chrome.runtime.sendMessage({type: 'bgg_token_updated'});
});

// optional: show feedback on input change
tokenEl.addEventListener('input', () => {
  statusEl.textContent = '';
});