chrome.runtime.onInstalled.addListener(function(details){
    if(details.reason == "install"){
        const key = 'myKey';
        const value = { name: 'my value' };

        chrome.storage.local.set({key: value}, () => {
        console.log('Stored name: ' + value.name);
        });
    }
});
console.log("HERE");