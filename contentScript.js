// Make an object for storing game data
function Game(id, name, minplayers, maxplayers, recommendedplayers, minplaytime, maxplaytime, playtime, imagelink, rating, weight, year, designers, artists) {
    this.id = id;
    this.name = name;
    this.minplayers = minplayers;
    this.maxplayers = maxplayers;
    this.recommendedplayers = recommendedplayers;
    this.minplaytime = minplaytime;
    this.maxplaytime = maxplaytime;
    this.playtime = playtime;
    this.imagelink = imagelink;
    this.rating = rating;
    this.weight = weight;
    this.year = year;
    this.designers = designers;
    this.artists = artists;
}

// These are used for keeping the window frozen when Ctrl is held
var hovering = false;
var target;

var hoverWindowMargin = 10;

// Make the display box and give it some style
var div = document.createElement('div');
div.classList.add("bggHoverWindow");
div.id = "floatWindow";
div.style.border = '2px solid black';
div.style.position = 'absolute';
div.style.background = 'rgb(214, 214, 214)';
div.style.zIndex = '100000000';
div.style.margin = hoverWindowMargin + 'px';
div.style.display = 'none';
div.style.width = 'max-content';
const newContent = document.createTextNode("Shouldn't see this text.");
div.appendChild(newContent);
document.body.appendChild(div);
$(document).ready(function(){
    $('.bggHoverWindow').load(chrome.runtime.getURL("html/hoverWindow.html"));
});

const gameInfoStorage = new Map();

regex = /\/(boardgame|boardgameexpansion)\/(\d+)\/?/

// var game_list = Array.from(document.querySelectorAll('a:not(.bggHoverLink)')).filter(a => regex.test(a.getAttribute('href')));

// Get a list of all of the game/expansion IDs
const game_ids = [...new Set(Array.from(document.querySelectorAll('a:not(.bggHoverLink)'))
  .map(a => {
    const match = a.href.match(regex);
    return match ? match[2] : null; // match[1] is the captured number
  })
  .filter(Boolean))];

// Promise helper for messaging background
function bg(msg) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(msg, (resp) => {
            const err = chrome.runtime.lastError;
            if (err) reject(err);
            else resolve(resp);
        });
    });
}

// Utility: chunk an array into smaller arrays of size n
function batchArray(arr, size) {
  const batches = [];
  for (let i = 0; i < arr.length; i += size) {
    batches.push(arr.slice(i, i + size));
  }
  return batches;
}

async function fetchGamesByIds(allIds) {
  const batches = batchArray(allIds, 20);
  const results = [];

  for (const b of batches) {
    const resp = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'bggFetch', ids: b }, resolve);
    });

    if (resp && resp.ok) {
      results.push(...resp.items);
    } else {
      console.error('BGG fetch failed for batch', b, resp && resp.error);
      // decide how to handle errors (retry, abort, continue)
    }
  }

  // results is array of plain objects representing games
  return results;
}

// Turn parsed API data into Game objects and add to Set
async function loadGames(ids) {
    const parsedItems = await fetchGamesByIds(ids);

    parsedItems.forEach(item => {
        const game = new Game(
            item.id,
            item.name,
            item.minplayers,
            item.maxplayers,
            item.recommendedplayers,
            item.minplaytime,
            item.maxplaytime,
            item.playtime,
            item.imagelink,
            item.rating,
            item.weight,
            item.year,
            item.designers,
            item.artists
        );
        gameSet.add(game);
    });

    console.log("Loaded games:", gameSet);
}


/*
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////

 BEGIN HOVER POSITIONING

////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
//  */

// For when the mouse enters an <a.bggHoverLink> element
function onEnter(e) {
    if(e.ctrlKey && document.querySelector('.bggHoverWindow').style.display == "inline") {
        return;
    }
    target = e;
    queryUrl = matchUrl(e.target.href);
    if(queryUrl) { //if it is a boardgame link
        e.target.addEventListener("mouseleave", onLeave);
        document.addEventListener('mousemove', onMove);
        insertToFloatWindow(queryUrl, e.target.href);
    }
    hovering = true;
}

// For when the mouse leaves an <a.bggHoverLink> element
function onLeave(e) {
    console
    hovering = false;
    if(e.ctrlKey) {
        return;
    }
    
    document.querySelector('.bggHoverWindow').style.display = 'none';
    
    target.target.removeEventListener("mouseleave", onLeave);
    document.removeEventListener("mousemove", onMove);
}

// For when the mouse moves after entering an <a.bggHoverLink> element
function onMove(e) {
    if(e.ctrlKey) {
        return;
    }
    if(!overElementOrChildren(target.target, e.target)) {// e.target != target.target && e.target != target.relatedTarget
        onLeave(target);
    }
    document.querySelector('.bggHoverWindow').style.left = e.pageX + 'px';
    document.querySelector('.bggHoverWindow').style.top = e.pageY + 'px';

    //if it is going to go off the screen at the bottom or left
    if(e.clientX + $('.bggHoverWindow').width() + hoverWindowMargin*2 > $(window).width()) {
        document.querySelector('.bggHoverWindow').style.left = (e.pageX - $('.bggHoverWindow').width() - 2*hoverWindowMargin) + 'px';
    }
    if(e.clientY + $('.bggHoverWindow').height() + hoverWindowMargin > $(window).height()) {
        document.querySelector('.bggHoverWindow').style.top = ((e.pageY - e.clientY) + $(window).height() - $('.bggHoverWindow').height() - hoverWindowMargin*2) + 'px';
    }
}

// Check if the mouse is still over the original target (or one of that target's children)
// Return true if the mouse is still over the original target or one of its children
function overElementOrChildren(originalTarget, currentTarget) {
    if(originalTarget == currentTarget) {
        return true;
    }
    var children = originalTarget.children;
    for (var i = 0; i < children.length; i++) {
        if(overElementOrChildren(children[i], currentTarget)) {
            return true;
        }
    }
    return false;
}
/*
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////

 END HOVER POSITIONING

////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
//  */