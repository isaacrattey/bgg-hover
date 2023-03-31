addToLinks();

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

// For when the mouse enters an <a.bggHoverLink> element
function onEnter(e) {
    if(e.ctrlKey && document.querySelector('.bggHoverWindow').style.display == "inline") {
        return;
    }
    target = e.target;
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
    hovering = false;
    if(e.ctrlKey) {
        return;
    }
    
    document.querySelector('.bggHoverWindow').style.display = 'none';
    
    target.removeEventListener("mouseleave", onLeave);
    document.removeEventListener("mousemove", onMove);
}

// For when the mouse moves after entering an <a.bggHoverLink> element
function onMove(e) {
    if(e.ctrlKey) {
        return;
    }
    if(e.target != target) {
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

// For adding listeners to <a> boardgamegeek.com links
function addToLinks() {
    var a_list = document.querySelectorAll('a[href*="boardgame"]:not(.bggHoverLink)'); // returns NodeList
    var a_array = [...a_list]; // converts NodeList to Array
    // console.log("Adding to: " + a_array.length + " links");
    a_array.forEach(a => {

        a.addEventListener("mouseenter", onEnter);
        a.classList.add("bggHoverLink")

    });
    // });
    setTimeout(validateLoad, 5000);
}

// Check that there aren't any new boardgamegeek.com links(just in case more of the page was loaded)
// Run every 5 seconds
function validateLoad() {
    var a_list = document.querySelectorAll('a[href*="boardgame"]:not(.bggHoverLink)'); // returns NodeList
    var a_array = [...a_list]; // converts NodeList to Array
    if(a_array.length == 0) {
        // console.log("Validated successfully: " + a_array.length + " links left");
        setTimeout(validateLoad, 5000);
    } else {
        // console.log("Validated unsuccessfully: " + a_array.length + " links left");
        addToLinks();
    }
}

// For capturing the boardgame ID from the URL
function matchUrl(url) {
    const re = /https:\/\/boardgamegeek.com\/(boardgame|boardgameexpansion)\/(\d+)\/[^\/]+$/;
    groups = url.match(re);
    if(groups) {
        return "https://boardgamegeek.com/xmlapi2/thing?id=" + groups[2] + "&stats=1";
    } else {
        return null;
    }
}

// For updating the hover window and displaying it
async function insertToFloatWindow(queryUrl, originalUrl) {
    if(location.href == originalUrl) {
        return;
    }
    await fetch (queryUrl).then((response) => {
        if (response.ok) {
            return response.text();
        }
            throw new Error('Something went wrong');
        })
        .then((record) => {
            parser = new DOMParser();
            xmlDoc = parser.parseFromString(record,"text/xml");
            thumbnail = xmlDoc.getElementsByTagName("thumbnail")[0].childNodes[0].nodeValue;
            gameName = xmlDoc.getElementsByTagName("name")[0].getAttribute("value");
            // The [... turns the NodeList into a regular array
            // The querySelect gets all the designers/artists
            // The map gets the value(designer/artist name) for each designer
            // The join() combines them into one string if necessary
            formatDesigners([...xmlDoc.querySelectorAll("[type=\"boardgamedesigner\"]")].map(sel => sel.getAttribute("value")), [...xmlDoc.querySelectorAll("[type=\"boardgamedesigner\"]")].map(sel => sel.getAttribute("id")), originalUrl);
            formatArtists([...xmlDoc.querySelectorAll("[type=\"boardgameartist\"]")].map(sel => sel.getAttribute("value")), [...xmlDoc.querySelectorAll("[type=\"boardgameartist\"]")].map(sel => sel.getAttribute("id")), originalUrl);
            rating = Math.round(xmlDoc.getElementsByTagName("ratings")[0].getElementsByTagName("average")[0].getAttribute("value")*10)/10;
            weight = Math.round(xmlDoc.getElementsByTagName("ratings")[0].getElementsByTagName("averageweight")[0].getAttribute("value")*100)/100;
            minPlayers = xmlDoc.getElementsByTagName("minplayers")[0].getAttribute("value");
            maxPlayers = xmlDoc.getElementsByTagName("maxplayers")[0].getAttribute("value");
            minTime = xmlDoc.getElementsByTagName("minplaytime")[0].getAttribute("value");
            maxTime = xmlDoc.getElementsByTagName("maxplaytime")[0].getAttribute("value");
            year = xmlDoc.getElementsByTagName("yearpublished")[0].getAttribute("value");
            formatPlayerCount(minPlayers, maxPlayers);
            formatTime(minTime, maxTime);
            document.getElementById("bgg-float-extension-thumb").src=thumbnail;
            formatTitle(gameName);
            formatRating(rating, originalUrl);
            formatWeight(weight);
            document.getElementById("bgg-hover-year").innerHTML="(" + year + ")";
            if(hovering) {
                document.querySelector('.bggHoverWindow').style.display = 'inline';
            }
        }).catch(error => {
            document.getElementById("bgg-float-extension-name").innerHTML="Failed to reach BGG API";
            console.log(error)
            if(hovering) {
                document.querySelector('.bggHoverWindow').style.display = 'inline';
            }
    });

// Update the rating and color of the rating hexagon based on the average rating
async function formatRating(rating, url) {
    $('.bgg-hover-rating-block').removeClass("bgg-hover-has-rating-3 bgg-hover-has-rating-5 bgg-hover-has-rating-7 bgg-hover-has-rating-8 bgg-hover-has-rating-9 bgg-hover-has-rating-10");
    if(rating < 3) {
        $('.bgg-hover-rating-block').addClass('bgg-hover-has-rating-3');
    } else if(rating < 5) {
        $('.bgg-hover-rating-block').addClass('bgg-hover-has-rating-5');
    } else if(rating < 7) {
        $('.bgg-hover-rating-block').addClass('bgg-hover-has-rating-7');
    } else if(rating < 8) {
        $('.bgg-hover-rating-block').addClass('bgg-hover-has-rating-8');
    } else if(rating < 9) {
        $('.bgg-hover-rating-block').addClass('bgg-hover-has-rating-9');
    } else {
        $('.bgg-hover-rating-block').addClass('bgg-hover-has-rating-10');
    }
    document.getElementById("bgg-hover-rating-link").href = url + "/ratings?rated=1&comment=1";
    document.getElementById("bgg-float-extension-rating").innerHTML = rating.toFixed(1);
}

// Update the title
async function formatTitle(title) {
    document.getElementById("bgg-float-extension-name").innerHTML=gameName;
}

// Commented out portion is for updating the color of the weight text(but it didn't look great)
async function formatWeight(weight) {
    document.getElementById("bgg-hover-weight").innerHTML=weight.toFixed(2);
    // if(weight < 3) {
    //     document.getElementById("bgg-hover-weight").style.color = "#5bda98";
    // } else if(weight < 4) {
    //     document.getElementById("bgg-hover-weight").style.color = "#ff6b26";
    // } else {
    //     document.getElementById("bgg-hover-weight").style.color = "#df4751";
    // }
}

// Format designer names and add hyperlinks
// Display one or two names normally. Display more than two names as "First Designer + more"
async function formatDesigners(names, ids, url) {
    if(names.length == 0) {
        document.getElementById("bgg-hover-designer-plural").style.display = "none";
        document.getElementById("bgg-hover-designer-1").innerHTML="None";
        document.getElementById("bgg-hover-designer-1").href=url + "/credits";
        document.getElementById("bgg-hover-designer-comma").style.display="none";
        document.getElementById("bgg-hover-designer-2").style.display="none";
        document.getElementById("bgg-hover-designer-more").style.display="none";
    } else if(names.length == 1) {
        document.getElementById("bgg-hover-designer-plural").style.display = "none";
        document.getElementById("bgg-hover-designer-1").innerHTML=names[0];
        document.getElementById("bgg-hover-designer-1").href="https://boardgamegeek.com/boardgamedesigner/" + ids[0];
        document.getElementById("bgg-hover-designer-comma").style.display="none";
        document.getElementById("bgg-hover-designer-2").style.display="none";
        document.getElementById("bgg-hover-designer-more").style.display="none";
    } else if(names.length == 2) {
        document.getElementById("bgg-hover-designer-plural").style.display = "inline";
        document.getElementById("bgg-hover-designer-1").innerHTML=names[0];
        document.getElementById("bgg-hover-designer-1").href="https://boardgamegeek.com/boardgamedesigner/" + ids[0];
        document.getElementById("bgg-hover-designer-comma").style.display="inline";
        document.getElementById("bgg-hover-designer-2").innerHTML=names[1];
        document.getElementById("bgg-hover-designer-2").href="https://boardgamegeek.com/boardgamedesigner/" + ids[1];
        document.getElementById("bgg-hover-designer-2").style.display="inline";
        document.getElementById("bgg-hover-designer-more").style.display="none";
    } else {
        document.getElementById("bgg-hover-designer-plural").style.display = "inline";
        document.getElementById("bgg-hover-designer-1").innerHTML=names[0];
        document.getElementById("bgg-hover-designer-1").href="https://boardgamegeek.com/boardgamedesigner/" + ids[0];
        document.getElementById("bgg-hover-designer-comma").style.display="none";
        document.getElementById("bgg-hover-designer-2").style.display="none";
        document.getElementById("bgg-hover-designer-more").innerHTML=" + " + (names.length - 1) + " more";
        document.getElementById("bgg-hover-designer-more").href=url + "/credits";
        document.getElementById("bgg-hover-designer-more").style.display="inline";
    }
}

// Same as above, but for Artist instead of designers
async function formatArtists(names, ids, url) {
    if(names.length == 0) {
        document.getElementById("bgg-hover-artist-plural").style.display = "none";
        document.getElementById("bgg-hover-artist-1").innerHTML="None";
        document.getElementById("bgg-hover-artist-1").href=url + "/credits";
        document.getElementById("bgg-hover-artist-comma").style.display="none";
        document.getElementById("bgg-hover-artist-2").style.display="none";
        document.getElementById("bgg-hover-artist-more").style.display="none";
    } else if(names.length == 1) {
        document.getElementById("bgg-hover-artist-plural").style.display = "none";
        document.getElementById("bgg-hover-artist-1").innerHTML=names[0];
        document.getElementById("bgg-hover-artist-1").href="https://boardgamegeek.com/boardgameartist/" + ids[0];
        document.getElementById("bgg-hover-artist-comma").style.display="none";
        document.getElementById("bgg-hover-artist-2").style.display="none";
        document.getElementById("bgg-hover-artist-more").style.display="none";
    } else if(names.length == 2) {
        document.getElementById("bgg-hover-artist-plural").style.display = "inline";
        document.getElementById("bgg-hover-artist-1").innerHTML=names[0];
        document.getElementById("bgg-hover-artist-1").href="https://boardgamegeek.com/boardgameartist/" + ids[0];
        document.getElementById("bgg-hover-artist-comma").style.display="inline";
        document.getElementById("bgg-hover-artist-2").innerHTML=names[1];
        document.getElementById("bgg-hover-artist-2").href="https://boardgamegeek.com/boardgameartist/" + ids[1];
        document.getElementById("bgg-hover-artist-2").style.display="inline";
        document.getElementById("bgg-hover-artist-more").style.display="none";
    } else {
        document.getElementById("bgg-hover-artist-plural").style.display = "inline";
        document.getElementById("bgg-hover-artist-1").innerHTML=names[0];
        document.getElementById("bgg-hover-artist-1").href="https://boardgamegeek.com/boardgameartist/" + ids[0];
        document.getElementById("bgg-hover-artist-comma").style.display="none";
        document.getElementById("bgg-hover-artist-2").style.display="none";
        document.getElementById("bgg-hover-artist-more").innerHTML=" + " + (names.length - 1) + " more";
        document.getElementById("bgg-hover-artist-more").href=url + "/credits";
        document.getElementById("bgg-hover-artist-more").style.display="inline";
    }
}

// Format player count based on whether it is a range or a single player count
async function formatPlayerCount(min, max) {
    var out = "";
    if(min == max) {
        if(min == 1) {
            out = "1 player";
        } else {
            out = min + " players";
        }
    }  else {
        out = min+"-"+max;
    }
    document.getElementById("bgg-float-extension-numplayers").innerHTML="# Players: " + out;
}

// Similar to player count but for playing time
async function formatTime(min, max) {
    var out = "";
    if(min == max) {
        out = min + " Min";
    }  else {
        out = min + "–" + max + " Min";
    }
    document.getElementById("bgg-float-extension-time").innerHTML=out;
}
    
}