var map;
var geocoder = new google.maps.Geocoder();
var sijainti = 'Jyväskylä';

window.onload = function() {
	    // Jyväskylän koordinaatit
	var latlng = new google.maps.LatLng(62.24, 25.75);
	// asetetaan kartan asetukset ja keskipisteeksi Jyväskylä
	var myOptions = {
		zoom: 13,
		center: latlng,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	var map = new google.maps.Map(document.getElementById("map"), myOptions);
	document.getElementById('root').getElementsByTagName('select')[0].addEventListener('change',sijainninmuutos);
};
function sijainninmuutos() {
	sijainti = this.options[this.selectedIndex].text;
	var kartta_sijainti;
	switch(sijainti) {
		case 'Jyväskylä':
			kartta_sijainti = new google.maps.LatLng(62.24,25.75);
			break;
		case 'Kuopio':
			kartta_sijainti = new google.maps.LatLng(62.89,27.68);
			break;
		case 'Tampere':
			kartta_sijainti = new google.maps.LatLng(61.50,23.79);
			break;
		default:
			kartta_sijainti = new google.maps.LatLng(62.89,27.68);
			break;
	}
	
	var myOptions = {
		zoom: 13,
		center: kartta_sijainti,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	var map = new google.maps.Map(document.getElementById("map"), myOptions);
};