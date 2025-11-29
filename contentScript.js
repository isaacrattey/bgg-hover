const gameInfoStorage = new Map();

regex = /\/(boardgame|boardgameexpansion)\/(\d+)\/?/

var game_list = Array.from(document.querySelectorAll('a:not(.bggHoverLink)')).filter(a => regex.test(a.getAttribute('href')));

