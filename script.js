async function fetchData() {
    const res=await fetch ("https://boardgamegeek.com/xmlapi2/thing?id=42&stats=1");
    const record=await res.text();
    parser = new DOMParser();
    xmlDoc = parser.parseFromString(record,"text/xml");
    thumbnail = xmlDoc.getElementsByTagName("thumbnail")[0].childNodes[0].nodeValue;
    gameName = xmlDoc.getElementsByTagName("name")[0].getAttribute("value");
    // The [... turns the NodeList into a regular array
    // The querySelect gets all the designers/artists
    // The map gets the value(designer/artist name) for each designer
    // The join() combines them into one string if necessary
    designer = [...xmlDoc.querySelectorAll("[type=\"boardgamedesigner\"]")].map(sel => sel.getAttribute("value")).join(', ');
    artist = [...xmlDoc.querySelectorAll("[type=\"boardgameartist\"]")].map(sel => sel.getAttribute("value")).join(', ');
    rating = Math.round(xmlDoc.getElementsByTagName("ratings")[0].getElementsByTagName("average")[0].getAttribute("value")*10)/10;
    weight = Math.round(xmlDoc.getElementsByTagName("ratings")[0].getElementsByTagName("averageweight")[0].getAttribute("value")*10)/10;
    minPlayers = xmlDoc.getElementsByTagName("minplayers")[0].getAttribute("value");
    maxPlayers = xmlDoc.getElementsByTagName("maxplayers")[0].getAttribute("value");
    document.getElementById("thumb").src=thumbnail;
    document.getElementById("name").innerHTML="Game: " + gameName;
    document.getElementById("designer").innerHTML="Designer: " + designer;
    document.getElementById("artist").innerHTML="Artist: " + artist;
    document.getElementById("rating").innerHTML="Rating: " + rating;
    document.getElementById("weight").innerHTML="Weight: " + weight;
    document.getElementById("numplayers").innerHTML="# Players: " + minPlayers+"-"+maxPlayers;
    console.log("Name" + thumbnail);
}
fetchData();