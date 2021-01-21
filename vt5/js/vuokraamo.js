//vuokraamo.js

"use strict"; // estää pahimpia virheitä

/* ajax_latauslista on array, johon kerätään kaikkien aliohjelmien 
* tunniste, jotka ovat lähettäneet ajax-kutsun, kutsun päätyttyä 
* kyseenomaisen ohjelman tunniste poistetaan listalta.
*/
var ajax_latauslista = [];

/*	window.onload = function()
* -------------------------------------------------------------------
*	Elokuvavuokraamo
*/
window.onload = function() {
	onko_ok();
	hae_vuokraukset();
	hae_vuokraajat();
	hae_elokuvat();
	hae_lajityypit();
	
	$( '#vuokrausPVM' ).on("change", tarkistaVPVM);
	$( '#palautusPVM' ).on("change", tarkistaPPVM);
	$( '#summa' ).on("change", tarkistaSumma);
	$( '#laheta' ).on("click", laheta_tiedot);
	$( '#kirjaudu' ).on("click", kirjaudu);
	$( '#lisaa_e' ).on("click", lisaa_elokuva);
	$( '#poista_e' ).on("click", poista_elokuva);
	olenko_kirjautunut();
};

/* hae_lajityypit()
* -------------------------------------------------------------------
*    Haetaan ajaxilla python-skriptiltä tiedot lajityypeistä.
*/
function hae_lajityypit() {
	ajax_latauslista.push('lajityyppi_haku');
	$( '#Loader' ).removeClass("hidden");
	$.ajax({
		async: true,
		url: "/~aakaneis/cgi-bin/vt5/flask.cgi/hae_lajityypit",
		type: "GET",
		dataType: "json",
		success: lisaa_lajityypit,
		error: ajax_virhe
	});
};
/* poista_latauslistalta(hakusana)
* -------------------------------------------------------------------
*    "Poistetaan" ajaxin latauslistalta hakusana, eli korvataan se tyhjällä
*    merkkijonolla, sekä tarkistetaan, onko latauslistalla ladattavaa.
*    Jos on, niin näytetään latausikoni, muuten piilotetaan se.
*/
function poista_latauslistalta(hakusana) {
	var ladattavia = false;
	var poistettu = false;
	for (var i = 0; i<ajax_latauslista.length; i++)
	{
		if (ajax_latauslista[i] == hakusana && !poistettu)
		{
			poistettu = true;
			ajax_latauslista[i] = '';
		}
		if (ajax_latauslista[i] != '')
			ladattavia = true;
	}
	if (ladattavia)
		$( '#Loader' ).removeClass("hidden");
	else
		$( '#Loader' ).attr("class","hidden");
}

/* lisaa_lajityypit(data, textStatus, request)
* -------------------------------------------------------------------
*    Lisätään ajaxilla saadut lajityyppitiedot verkkosivun lomakkeen
*    select-elementtiin
*/
function lisaa_lajityypit(data, textStatus, request) {
	poista_latauslistalta('lajityyppi_haku');
	var lajityyppi = $( '#lajityyppi' );
	for (var i=0; i<data.length; i++) {
		lajityyppi.append( $("<option value=\"" + data[i].lid + "\">" + data[i].Nimi + "</option>") );
	}
};

/* olenko_kirjautunut()
* -------------------------------------------------------------------
*    Tarkistetaan Ajaxilla, onko käyttäjä kirjautunut. 
*/
function olenko_kirjautunut() {
	$( '#Loader' ).removeClass("hidden");
	ajax_latauslista.push('olenko_kirjautunut');
	$.ajax({
		async: true,
		url: "/~aakaneis/cgi-bin/vt5/flask.cgi/auth",
		type: 'GET',
		dataType: 'json',
		success: kirjautumisen_varmistus,
		error: ajax_virhe
	});
};

/* kirjaudu()
* -------------------------------------------------------------------
*    Toimitetaan ajaxilla pythonille kirjautumistiedot tarkistettavaksi.
*/
function kirjaudu(e) {
	ajax_latauslista.push('olenko_kirjautunut');
	$( '#Loader' ).removeClass("hidden");
	e.preventDefault();
	var postForm = {
			'ssana' : $( '#ssana' ).val(),
			'ktun' 	: $( '#ktun' ).val()
		};
		
		$.ajax({
			async: true,
			type	: 'POST',
			url		: "/~aakaneis/cgi-bin/vt5/flask.cgi/kirjaudu",
			data	: postForm,
			dataType: 'json',
			success: kirjautumisen_varmistus,
			error: ajax_virhe
		});
};

/* kirjautumisen_varmistus(data, textStatus, request)
* -------------------------------------------------------------------
*    Varmistetaan pythonin palauttamasta datasta että ollaan kirjauduttu
*    oikein, muuten näytetään virheet ja ei päästetä jatkamaan.
*/
function kirjautumisen_varmistus(data, textStatus, request) {
	poista_latauslistalta('olenko_kirjautunut');
	if (data.length == 0) {
		$( 'header' ).attr("class","hidden");
		$( '#Main' ).removeClass("hidden");
		$( '#Kirjaudu' ).attr("class","hidden");
	}
	else {
		$( 'header' ).removeClass("hidden");
		var virhe_UL = $( "header > ul" );
		virhe_UL.empty();
		for (var i=0; i<data.length; i++) {
			var virhe = $('<li>');
			virhe.append(data[i]);
			virhe_UL.append(virhe);
		}
	}
};

/* hae_vuokraajat()
* -------------------------------------------------------------------
*    Haetaan ajaxilla vuokraajat
*/
function hae_vuokraajat() {
	ajax_latauslista.push('vuokraaja_haku');
	$( '#Loader' ).removeClass("hidden");
	$.ajax({
		async: true,
		url: "/~aakaneis/cgi-bin/vt5/flask.cgi/hae_vuokraajat",
		type: "GET",
		dataType: "json",
		success: lisaa_vuokraajat,
		error: ajax_virhe
	});
};

/* lisaa_vuokraajat(data, textStatus, request)
* -------------------------------------------------------------------
*    Lisätään ajaxilla saadut vuokraajien tiedot verkkosivun lomakkeen
*    select -elementtiin
*/
function lisaa_vuokraajat(data, textStatus, request) {
	poista_latauslistalta('vuokraaja_haku');
	var vuokraaja = $( '#vuokraaja' );
	for (var i=0; i<data.length; i++) {
		vuokraaja.append( $("<option value=\"" + data[i].jid + "\">" + data[i].Nimi + "</option>") );
	}
};

/* hae_elokuvat()
* -------------------------------------------------------------------
*    Haetaan ajaxilla elokuvista tiedot
*/
function hae_elokuvat() {
	ajax_latauslista.push('elokuva_haku');
	$( '#Loader' ).removeClass("hidden");
	$.ajax({
		async: true,
		url: "/~aakaneis/cgi-bin/vt5/flask.cgi/hae_elokuvat",
		type: "GET",
		dataType: "json",
		success: lisaa_elokuvat,
		error: ajax_virhe
	});
};

/* lisaa_elokuvat(data, textStatus, request)
* -------------------------------------------------------------------
*    Lisätään ajaxilla saadut elokuvatiedot verkkosivun lomakkeen
*    select-elementtiin
*/
function lisaa_elokuvat(data, textStatus, request) {
	poista_latauslistalta('elokuva_haku');
	var elokuva = $( '#elokuva' );
	var elokuva_poistettava = $( '#elokuva_poista' );
	elokuva.empty();
	elokuva_poistettava.empty();
	for (var i=0; i<data.length; i++) {
		elokuva.append( $("<option value=\"" + data[i].eid + "\">" + data[i].Nimi + "</option>") );
		elokuva_poistettava.append( $("<option value=\"" + data[i].eid + "\">" + data[i].Nimi + "</option>") );
	}
};

/* hae_vuokraukset()
* -------------------------------------------------------------------
*    Hakee ajaxina vuokraukset tietokannasta.
*/
function hae_vuokraukset() {
	ajax_latauslista.push('vuokraus_haku');
	$( '#Loader' ).removeClass("hidden");
	$.ajax({
		async: true,
		url: "/~aakaneis/cgi-bin/vt5/flask.cgi/hae_vuokraukset",
		type: "GET",
		dataType: "json",
		success: lisaa_vuokraukset,
		error: ajax_virhe
	});
};

/* lisaa_vuokraukset(data, textStatus, request)
* -------------------------------------------------------------------
*    Muodostetaan ajaxilla saadusta datasta kaksitasoinen lista 
*    vuokrauksista.
*/
function lisaa_vuokraukset(data, textStatus, request) {
	poista_latauslistalta('vuokraus_haku');
	var main_ul = $( '#vuokrauslistaus' );
	main_ul.empty();
	var tiedot = data;
	for ( var i=0; i<tiedot.length; i++) {
		var vuokraajan_tiedot = tiedot[i];
		var vuokraaja_id = vuokraajan_tiedot.jid;
		var vuokraaja = vuokraajan_tiedot.Nimi;
		var lista_elementti = $('<li>');
		lista_elementti.append(vuokraaja);
		var vuokralista = $('<ul>');
		var vuokraukset = vuokraajan_tiedot.vuokraukset;
		for (var j=0;j<vuokraukset.length; j++) {
			var vuokraus = $('<li>');
			vuokraus.append( $("<a href=\"\">" + vuokraukset[j].elokuva + "</a>") );
			vuokraus.find( "a" ).on("click", { jid: vuokraaja_id, eid: vuokraukset[j].eid, vpvm: vuokraukset[j].vpvm, ppvm: vuokraukset[j].ppvm, summa: vuokraukset[j].summa } ,valmistele_muokkaus);
			vuokraus.append($('<label>').append(vuokraukset[j].vpvm));
			vuokraus.append($('<label>').append(vuokraukset[j].ppvm));
			vuokraus.append($('<label>').append(vuokraukset[j].summa));
			vuokralista.append(vuokraus);
		}
		lista_elementti.append(vuokralista);
		main_ul.append( lista_elementti );
	}
};

/* valmistele_muokkaus(e)
* -------------------------------------------------------------------
*    Muuttaa hieman vuokrauksenlisäys lomaketta, jotta se toimisi
*    vuokrauksen muokkaukseen.
*/
function valmistele_muokkaus(e) {
	e.preventDefault();
	$( '#laheta' ).attr("value","Muokkaa");
	$( '#muokattavan_eid' ).val( e.data.eid ).change();
	$( '#muokattavan_jid' ).val(e.data.jid ).change();
	$( '#muokattavan_vpvm' ).val(e.data.vpvm ).change();
	$( '#summa' ).val(e.data.summa ).change();
	$( '#vuokrausPVM' ).val(e.data.vpvm ).change();
	$( '#palautusPVM' ).val(e.data.ppvm ).change();
	$( '#vuokraaja' ).val(e.data.jid).change();
	$( '#elokuva' ).val(e.data.eid).change();
};

/* ajax_virhe(xhr, status, error)
* -------------------------------------------------------------------
*    Lokitetaan consoliin ajaxin antama virhe. 
*/
function ajax_virhe(xhr, status, error) {
	console.log( "Error: " + error );
	console.log( "Status: " + status );
	console.log( xhr );
	
	$( '#Loader' ).attr("class","hidden");
};

/* tarkistaPVM()
* -------------------------------------------------------------------
*   Tarkistaa onko vuokrauspäivämäärä annettu varmasti oikein.
*/
function tarkistaPPVM() {
	var apuid = $(this).attr("id");
	if ($(this).val() == "" || Date.parse($(this).val())) {
		$( '#' + apuid + "_req" ).attr("class", "hidden");
	}
	else {
		$( '#' + apuid + "_req" ).removeClass("hidden");
	}
	onko_ok();
};

/* poista_elokuva(e)
* -------------------------------------------------------------------
*    Ajaxilla kertoo pythonille, mikä elokuva tulisi poistaa listalta.
*/
function poista_elokuva(e) {
	ajax_latauslista.push('tiedon_lahetys');
	$( '#Loader' ).removeClass("hidden");
	e.preventDefault();
	var postForm = {
		'eid': $( '#elokuva_poista' ).val()
	};
	
	$.ajax({
		async: true,
		type: 'POST',
		url	: "/~aakaneis/cgi-bin/vt5/flask.cgi/poista_elokuva",
		data	: postForm,
		dataType: 'json',
		success: tiedot_lahetetty,
		error: ajax_virhe
	});
};

/* lisaa_elokuva(e)
* -------------------------------------------------------------------
*    Ajaxilla kertoo pythonille, millainen elokuva lisätään tietokantaan.
*/
function lisaa_elokuva(e) {
	ajax_latauslista.push('tiedon_lahetys');
	$( '#Loader' ).removeClass("hidden");
	e.preventDefault();
	var postForm = {
		'nimi'	: $( '#e_nimi' ).val(),
		'julkaisuvuosi' : $( '#julkaisuvuosi' ).val(),
		'hinta' : $( '#hinta' ).val(),
		'arvio' : $( '#arvio' ).val(),
		'lajityyppi' : $( '#lajityyppi' ).val()
	}
	$.ajax({
		async: true,
		type: 'POST',
		url	: "/~aakaneis/cgi-bin/vt5/flask.cgi/lisaa_elokuva",
		data	: postForm,
		dataType: 'json',
		success: tiedot_lahetetty,
		error: ajax_virhe
	});
};

/* laheta_tiedot(e) 
* -------------------------------------------------------------------
*    Lähetetään lomakkeen tiedot python skriptiin
*/
function laheta_tiedot(e) {
	ajax_latauslista.push('tiedon_lahetys');
	$( '#Loader' ).removeClass("hidden");
	e.preventDefault();
	if (onko_ok()) {
		var postForm = {
			'jid' 	: $( '#vuokraaja' ).val(),
			'eid' 	: $( '#elokuva' ).val(),
			'vpvm' 	: $( '#vuokrausPVM' ).val(),
			'ppvm' 	: $( '#palautusPVM' ).val(),
			'summa' : $( '#summa' ).val(),
			'jid_old'	: $( '#muokattavan_jid' ).val(),
			'eid_old'	: $( '#muokattavan_eid' ).val(),
			'vpvm_old'	: $( '#muokattavan_vpvm' ).val()
		};
		
		$.ajax({
			async: true,
			type	: 'POST',
			url		: "/~aakaneis/cgi-bin/vt5/flask.cgi/lisaa_vuokraaja",
			data	: postForm,
			dataType: 'json',
			success: tiedot_lahetetty,
			error: ajax_virhe
		});
		
	}
};

/* tiedot_lahetetty(data, textStatus, request)
* -------------------------------------------------------------------
*    Käsitellään palautunut data. data[0].success kertoo, onko 
*    tiedot käsitelty onnistuneesti, data[0].virheet sisältää taulun 
*    ilmenneistä ongelmista. 
*/
function tiedot_lahetetty(data, textStatus, request) {
	poista_latauslistalta('tiedon_lahetys');
	$( '#Loader' ).removeClass("hidden");
	if (data[0].success)
	{
		$( 'header' ).attr("class","hidden");
		$( '#muokattavan_eid' ).attr("value","");
		$( '#muokattavan_jid' ).attr("value","");
		$( '#muokattavan_vpvm' ).attr("value","");
		$( '#laheta' ).attr("value","Vuokraa!");
		hae_vuokraukset();
		hae_elokuvat();
	}
	else
	{
		$( 'header' ).removeClass("hidden");
		var virhe_UL = $( "header > ul" );
		virhe_UL.empty();
		for (var i=0; i<data[0].errors.length; i++) {
			var virhe = $('<li>');
			virhe.append(data[0].errors[i]);
			virhe_UL.append(virhe);
		}
	}
};

/* tarkistaPVM()
* -------------------------------------------------------------------
*   Tarkistaa onko vuokrauspäivämäärä annettu varmasti oikein.
*/
function tarkistaVPVM() {
	var apuid = $(this).attr("id");
	if (Date.parse($(this).val())) {
		$( '#' + apuid + "_req" ).attr("class", "hidden");
	}
	else {
		$( '#' + apuid + "_req" ).removeClass("hidden");
	}
	onko_ok();
};

/* tarkistaSumma()
* -------------------------------------------------------------------
*   Tarkistaa, onko annettu summa varmasti oikein.
*/
function tarkistaSumma() {
	var apuid = $(this).attr("id");
	var summa = parseInt($(this).val());
	if (!isNaN(summa) && summa >= 0 ) {
		$( '#' + apuid + "_req" ).attr("class", "hidden");
	}
	else {
		$( '#' + apuid + "_req" ).removeClass("hidden");
	}
	onko_ok();
}
/* onko_ok()
* -------------------------------------------------------------------
*   Katsoo, onko virheitä lomakkeessa ja tarvittaessa vaihtaa lähetä-
*   painikkeen pois käytöstä (ja vice versa)
*/
function onko_ok() {
	var span = $( "span" );
	for (var i=0; i<span.length; i++) {
		if ($(span[i]).attr("class") != "hidden") {
			$('#laheta').attr("disabled","disabled");
			return false;
		}
	}
	$('#laheta').removeAttr("disabled");
	return true;
}