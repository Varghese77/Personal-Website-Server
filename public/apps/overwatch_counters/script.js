// Stores counter hero and description information of heros
var hero_data;

// Gets JSON data from address addr and loads it into obj
function loadJSON(addr) { 
		var jsonData;

    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType('application/json');
    xobj.open('GET', addr, false);
    xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == '200') {
            jsonData = JSON.parse(xobj.responseText);
          }
    };
    xobj.send(null);
		return jsonData;
}

// loads hero data if needed
var stored = localStorage['hero_data'];
if (stored) {
	hero_data = JSON.parse(stored);
} else {
	hero_data = loadJSON('https://varghese77.github.io/apps/overwatch_counters/hero_data.json');
	localStorage['hero_data'] = JSON.stringify(hero_data);
}

// Array of hero icon buttons in the HTML document
var heros = document.getElementsByClassName('hero');

// Gets hero description paragraph element. Note that getElementByID doesn't
// work in firefox for the nested paragraph
var heroDescriptionParagraph = document.getElementsByClassName('hero_descr_text');

// Highlights selected and counter heros and loads description
function heroClick(clickedId){
	var counters = hero_data[clickedId].counters;
	
	// itereates through icon imgs
	for (var i = 0; i < heros.length; i++){
		var heroId = heros[i].id;
		var hero = heros[i];

		// iterates though specific hero counters (guarenteed to be
		// less than 10)
		function isCounter(heroName, heroCounters) {
			for (var k = 0; k < heroCounters.length; k++){
				if (heroCounters[k] == heroName){
					return true;
				}
			}
			return false;
		}

		// stylize icons	
		var isCounterHero = isCounter(heroId, counters);
		if (isCounterHero || clickedId == heroId){
			hero.style.opacity = '1.0';
			hero.style.filter  = 'alpha(opacity=100)' //IE8 fallback;
			hero.style.boxShadow = '3px 5px 20px 3px #000000';
			
			if (isCounterHero) {
				hero.style.border = '5px solid green';
			} else {
				hero.style.border = '5px solid red';
			}
		} else {
			hero.style.opacity = '0.50';
			hero.style.filter  = 'alpha(opacity=50)' //IE8 fallback;
			hero.style.boxShadow = 'none';
			hero.style.border = 'none';
		}
	}

	// load hero description
  heroDescriptionParagraph[0].innerText = hero_data[clickedId].description;
}
