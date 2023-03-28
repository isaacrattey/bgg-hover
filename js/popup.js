


document.getElementById('bgg-hover-allowlist-checkbox').onclick = onCheckboxChanged;

var activeUrl;
setActiveUrl();

async function setActiveUrl() {
    activeUrl = await getCurrentUrl();
}

async function onCheckboxChanged() {
    // key = "allowlist"
    const key = 'myKey';
    chrome.storage.local.get([key], (result) => {
    console.log('Retrieved name: ' + result.myKey.name);
    });
}

async function getCurrentUrl() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab.url;
}

// chrome.storage.local.set({ key: value }).then(() => {
//     console.log("Value is set to " + value);
// });

// chrome.storage.local.get(["key"]).then((result) => {
//     console.log("Value currently is " + result.key);
// });