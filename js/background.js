if (window.jQuery) {  
    console.log("Jquery undefined");
  } else {
    console.log("Jquery defined");
}
addToLinks();

function onHover(e) {
    console.log(e);
}

function addToLinks() {
    // $('#main').on('mouseenter', '#img', function() {
    //     $('#img').attr('src', 'http://www.example.com/new-img.jpg');
    // })
    // $("body").hover(onHover);
    console.log("adding to links");
    $( "a" ).on( "mouseenter mouseleave mouseup mousein mousemove", onHover);

}

