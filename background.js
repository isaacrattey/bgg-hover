// background.js

// helper: read token from storage
async function getToken() {
  const data = await chrome.storage.local.get(['bgg_token']);
  return data.bgg_token || null;
}

async function fetchBGGThings(ids) {
  const token = await getToken();
  if (!token) throw new Error('No BGG token configured. Please set it in the extension popup.');

  const url = 'https://boardgamegeek.com/xmlapi2/thing?id=' + ids.join(',');

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/xml'
    }
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`BGG API error ${res.status}: ${text}`);
  }

  const xmlText = await res.text();
  // parse and convert to JS objects — you'll implement parseBGGThingXML
  const items = parseBGGThingXML(xmlText);
  return items;
}

// receive messages from content script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'bggFetch') {
    // msg.ids is an array of ids (<=20)
    fetchBGGThings(msg.ids)
      .then(items => sendResponse({ ok: true, items }))
      .catch(err => sendResponse({ ok: false, error: err.message }));

    // return true to indicate we'll respond asynchronously
    return true;
  }

  if (msg.type === 'bgg_token_updated') {
    // token changed in popup; service worker may handle cache invalidation here
    // no-op for now
    return;
  }
});

// Example parse function stub — replace with your parser implementation
function parseBGGThingXML(xmlText) {
  // Basic XML parsing using DOMParser.
  // Convert XML <item> elements into Game objects.

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  const itemNodes = doc.querySelectorAll('item');
  const games = [];

  itemNodes.forEach(item => {
    const id = item.getAttribute('id');
    const nameNode = item.querySelector('name[type="primary"]') || item.querySelector('name');
    const name = nameNode ? nameNode.getAttribute('value') : '';

    const year = item.querySelector('yearpublished')?.getAttribute('value') || '';

    const minplayers = item.querySelector('minplayers')?.getAttribute('value') || '';
    const maxplayers = item.querySelector('maxplayers')?.getAttribute('value') || '';
    const recommendedplayers = item.querySelector('suggested_numplayers')?.getAttribute('value') || '';

    const minplaytime = item.querySelector('minplaytime')?.getAttribute('value') || '';
    const maxplaytime = item.querySelector('maxplaytime')?.getAttribute('value') || '';
    const playtime = item.querySelector('playingtime')?.getAttribute('value') || '';

    const image = item.querySelector('image')?.textContent || '';

    const stats = item.querySelector('statistics ratings');
    const rating = stats ? stats.querySelector('average')?.getAttribute('value') || '' : '';
    const weight = stats ? stats.querySelector('averageweight')?.getAttribute('value') || '' : '';

    // designers & artists: collect from link elements
    const designers = Array.from(item.querySelectorAll('link[type="boardgamedesigner"]')).map(n => n.getAttribute('value'));
    const artists = Array.from(item.querySelectorAll('link[type="boardgameartist"]')).map(n => n.getAttribute('value'));

    // Create a plain JS object — you can also `new Game(...)` if Game is available in this scope
    const g = {
      id, name, minplayers, maxplayers, recommendedplayers,
      minplaytime, maxplaytime, playtime, imagelink: image,
      rating, weight, year, designers, artists
    };

    games.push(g);
  });

  return games;
}