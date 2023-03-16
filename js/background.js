console.log("background running2");
addToLinks();

function onHover() {
    console.log("hover");
}

function addToLinks() {
    // $('#main').on('mouseenter', '#img', function() {
    //     $('#img').attr('src', 'http://www.example.com/new-img.jpg');
    // })
    // $("body").hover(onHover);
    console.log("adding to links");
    $( "p" ).on( "mouseenter", function() {
        onHover();
    });
}

