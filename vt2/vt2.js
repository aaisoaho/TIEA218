//vt2.js

"use strict"; // estää pahimpia virheitä

/* Globaalit muuttujat
* -------------------------------------------------------------------
*	valittu = valittu ruutu ruudukosta
*	valittu_vari = valitun ruudun alkuperäinen väri
*/
var valittu = "-1";
var valittu_vari = "-1";
var hyppy_flag = false;

/*	window.onload = function()
* -------------------------------------------------------------------
*	Halma-peli
*/
window.onload = function() {
	/* ensin luodaan taulu ja lisätään sitten nappulat, oletuskokoisina*/
	luoTaulu(16);
	lisaaNappulat(16,21,"nw_to_se");
	
	document.getElementsByTagName("h1")[0].textContent = "Halma";
	document.getElementsByTagName("p")[0].textContent = "Anna Halman asetukset";
	document.getElementsByName("x")[0].value = "16";
	
	document.getElementById("luo").addEventListener('click',muutaTaulukko,false);
	var alertLabel = document.createElement("span");
	alertLabel.setAttribute("class","hidden_msg");
	alertLabel.setAttribute("id","error_msg");
	alertLabel.textContent = "";
	document.getElementsByTagName("label")[0].appendChild(alertLabel);
	var origFieldset = document.getElementsByTagName("fieldset")[0];
	var radioField = document.createElement("fieldset");
	radioField.setAttribute("name","nappula_lkm_valinta");
	var rF_legend = document.createElement("legend");
	rF_legend.textContent = "Nappuloiden määrä";
	radioField.appendChild(rF_legend);
	var radioluku = 3;
	var lisattava = 3;
	for (var i=0; i<5; i++) {
		var radioButton = document.createElement("input");
		radioButton.setAttribute("type","radio");
		radioButton.setAttribute("name","nappula_lkm");
		radioButton.setAttribute("value",radioluku);
		var buttonTeksti = document.createTextNode(radioluku);
		radioField.appendChild(radioButton);
		radioField.appendChild(buttonTeksti);
		radioField.appendChild(document.createElement("br"));
		radioluku+=lisattava;
		lisattava++;
	}
	origFieldset.appendChild(radioField);
	
	var pelisuunta = document.createElement("fieldset");
	var pelisuunta_legend = document.createElement("legend");
	pelisuunta_legend.textContent = "Pelisuunta";
	pelisuunta.appendChild(pelisuunta_legend);
	var pelisuuntabutton = document.createElement("input");
	pelisuuntabutton.setAttribute("type","radio");
	pelisuuntabutton.setAttribute("name","pelisuunta");
	pelisuuntabutton.setAttribute("value","nw_to_se");
	pelisuuntabutton.setAttribute("checked","checked");
	/*TÄHÄN HAVAINNOLLISTAVA KUVA*/
	buttonTeksti = document.createTextNode("Ylävasemmasta alaoikeaan");
	pelisuunta.appendChild(pelisuuntabutton);
	pelisuunta.appendChild(buttonTeksti);
	pelisuunta.appendChild(document.createElement("br"));
	
	pelisuuntabutton = document.createElement("input");
	pelisuuntabutton.setAttribute("type","radio");
	pelisuuntabutton.setAttribute("name","pelisuunta");
	pelisuuntabutton.setAttribute("value","sw_to_ne");
	/*TÄHÄN HAVAINNOLLISTAVA KUVA*/
	buttonTeksti = document.createTextNode("Alavasemmasta yläoikeaan");
	pelisuunta.appendChild(pelisuuntabutton);
	pelisuunta.appendChild(buttonTeksti);
	pelisuunta.appendChild(document.createElement("br"));
	
	origFieldset.appendChild(pelisuunta);
	
	document.getElementsByName("nappula_lkm")[4].setAttribute("checked","checked");
	
	var vuorotiedote = document.createElement("span");
	vuorotiedote.textContent = "Sinisen vuoro";
	vuorotiedote.setAttribute("id","vuorotiedote");
	vuorotiedote.setAttribute("class","turn-blue");
	
	var vuoronvaihto = document.createElement("input");
	vuoronvaihto.setAttribute("id","vuoronvaihto");
	vuoronvaihto.setAttribute("type","submit");
	vuoronvaihto.setAttribute("value","Vaihda vuoroa");
	vuoronvaihto.setAttribute("class","hidden");
	
	vuoronvaihto.addEventListener('click',vaihdaVuoro,false);
	document.getElementById("ruudukko").getElementsByTagName("p")[1].appendChild(vuorotiedote);
	document.getElementById("ruudukko").getElementsByTagName("p")[1].appendChild(vuoronvaihto);
	
	
	resize();
	window.addEventListener('resize',resize,false);
};

/* vaihdaVuoroa()
* -------------------------------------------------------------------
*	Pakota vuoronvaihdos
*/
function vaihdaVuoro(e) {
	e.preventDefault();
	hyppy_flag = false;
	
	var vuoro = document.getElementById("vuorotiedote").getAttribute("class");
	if (vuoro == "turn-red") {
		document.getElementById("vuorotiedote").textContent = "Sinisen vuoro";
		document.getElementById("vuorotiedote").setAttribute("class","turn-blue");
		document.getElementById("vuoronvaihto").setAttribute("class","hidden");
		var alkuperainen = document.getElementsByClassName("green")[0];
		alkuperainen.removeChild(alkuperainen.getElementsByTagName("svg")[0]);
		alkuperainen.appendChild(piirraYmpyra("red"));
		resize();
	}
	if (vuoro == "turn-blue") {
		document.getElementById("vuorotiedote").textContent = "Punaisen vuoro";
		document.getElementById("vuorotiedote").setAttribute("class","turn-red");
		document.getElementById("vuoronvaihto").setAttribute("class","hidden");
		var alkuperainen = document.getElementsByClassName("green")[0];
		alkuperainen.removeChild(alkuperainen.getElementsByTagName("svg")[0]);
		alkuperainen.appendChild(piirraYmpyra("blue"));
		resize();
	}
};

/* resize()
* -------------------------------------------------------------------
*	muuta taulun koko vastaamaan jäljelle jäävää kokoa
*/
function resize() {
	var table = document.getElementsByTagName("table")[0];
	var uusi_korkeus = document.getElementsByTagName("html")[0].scrollHeight;
	uusi_korkeus -= document.getElementById("ruudukko").offsetHeight;
	uusi_korkeus -=  document.getElementsByTagName("h1")[0].offsetHeight;
	uusi_korkeus -= document.getElementsByTagName("p")[0].offsetHeight;
	uusi_korkeus -= 75;
	if (uusi_korkeus>document.getElementsByTagName("html")[0].scrollWidth) {
		uusi_korkeus= document.getElementsByTagName("html")[0].scrollWidth;
	}
	table.setAttribute("height", 0);
	table.setAttribute("width", 0);
	var toisto = document.getElementsByTagName("tr").length;
	uusi_korkeus-=2;
	var svgt = document.getElementsByTagName("svg");
	for (var i=0; i<svgt.length; i++) {
		svgt[i].setAttribute("width",Math.floor(uusi_korkeus/toisto) + "px");
		svgt[i].setAttribute("height",Math.floor(uusi_korkeus/toisto) + "px");
		svgt[i].getElementsByTagName("circle")[0].setAttribute("cx",Math.floor(0.5 * uusi_korkeus/toisto) + "px");
		svgt[i].getElementsByTagName("circle")[0].setAttribute("cy",Math.floor(0.5 * uusi_korkeus/toisto) + "px");
		svgt[i].getElementsByTagName("circle")[0].setAttribute("r",Math.floor(0.4 * uusi_korkeus/toisto)  + "px");
	}
	var tds = document.getElementsByTagName("td");
	for (var i=0; i<tds.length; i++) {
		tds[i].setAttribute("width",Math.floor(uusi_korkeus/toisto) + "px");
		//tds[i].setAttribute("height",uusi_korkeus/toisto + "px");
	}
	var trs = document.getElementsByTagName("tr");
	for (var i=0; i<trs.length; i++) {
		trs[i].setAttribute("height",Math.floor(uusi_korkeus/toisto) + "px");
		//trs[i].setAttribute("width",uusi_korkeus/toisto + "px");
	}
};

/* luoTaulu(koko)
* -------------------------------------------------------------------
*	koko = taulun kanta, taulun pinta-ala: (koko * koko)
* -------------------------------------------------------------------
*	Luodaan koko * koko -kokoinen taulukko
*/
function luoTaulu(koko) {
	/*Tyhjennetään taulu, jotta voidaan täyttää se*/
		var table = document.getElementsByTagName("tbody")[0];
		var rivit = table.getElementsByTagName("tr");
		var rivimaara = rivit.length;
		
		for (var i=rivimaara-1; i>=0; i--) {
			table.deleteRow(rivit[i]);
		}
		
		/*
		*	Käydään läpi tr:t ja tr:n sisällä käydään läpi td:t
		*/
		for (var i=0; i<koko; i++) {
			var tr = document.createElement("tr");
			tr.setAttribute("height",Math.floor(100/koko)+"%");
			var td;
			for (var j=0; j<koko; j++) {
				td = document.createElement("td");
				td.setAttribute("width",Math.floor(100/koko)+"%");
				td.setAttribute("class","x"+j+" "+"y"+i);
				td.addEventListener('click',siirraNappulaa,false);
				tr.appendChild(td);
			}
			
			table.appendChild(tr);
		}
};

/* lisaaNappulat(koko,lkm)
* -------------------------------------------------------------------
*	koko = pelilaudan koko 
*	lkm = nappuloiden lukumäärä
* -------------------------------------------------------------------
*	Lisätään vaadittu määrä nappuloita halutun kokoiseen lautaan.
*/
function lisaaNappulat(koko,lkm,suunta) {
	/* Lasketaan sopiva määrä nappuloita sijoitettavaksi */
	var valinta = 3;
	var erotus = 2;
	if (suunta == "sw_to_ne") {
		for (var i=0; i<5; i++) {
			if (valinta == lkm) {
				break;
			}
			erotus++;
			valinta+=erotus;
		}
		for (var j=0; j<erotus; j++) {
			for (var k=0; k<=j; k++) {
				var muutettava = document.getElementsByClassName("x"+k+" y"+(koko-(erotus-j)))[0];
				muutettava.setAttribute("class","x"+k+" y"+(koko-(erotus-j))+" blue");
				muutettava.appendChild(piirraYmpyra("blue"));
				muutettava = document.getElementsByClassName("x"+(koko-(erotus-j))+" y"+k)[0];
				muutettava.setAttribute("class","x"+(koko-(erotus-j))+" y"+k+" red");
				muutettava.appendChild(piirraYmpyra("red"));
			}
		}
	};
	if (suunta == "nw_to_se") {
		for (var i=0; i<5; i++) {
			if (valinta == lkm) {
				break;
			}
			erotus++;
			valinta+=erotus;
		}
		for (var j=0; j<erotus; j++) {
			for (var k=0; k<=j; k++) {
				var muutettava = document.getElementsByClassName("x"+k+" y"+(erotus-j-1))[0];
				muutettava.setAttribute("class","x"+k+" y"+(erotus-j-1)+" blue");
				muutettava.appendChild(piirraYmpyra("blue"));
				muutettava = document.getElementsByClassName("x"+(koko-(erotus-j))+" y"+(koko-(1-(k-j))))[0];
				muutettava.setAttribute("class","x"+(koko-(erotus-j))+" y"+(koko-(1-(k-j)))+" red");
				muutettava.appendChild(piirraYmpyra("#f00"));
			}
		}
	}
};

/* 	muutaTaulukko(e)
* -------------------------------------------------------------------
*	e = tapahtuma, joka tulee korvata taulun muutoksella
* -------------------------------------------------------------------
*	Muuttaa taulukon tekstityyppisen inputin arvoon, jos arvo on 
* 	numero väliltä 8-16 muuten näyttää virheilmoituksen (span 
*	-elementin joka on luotu ensimmäiseen label -elementtiin)
*	HUOM: näyttää virheilmoituksen myös, jos nappuloiden määrää ei ole 
*	valittu.
*/
function muutaTaulukko(e) {
	e.preventDefault();
	
	valittu = "-1";
	valittu_vari = "-1";
	
	var radioButtons = document.getElementsByName('nappula_lkm');
	var nappula_lkm = -1;
	for (var i = 0; i<radioButtons.length; i++) {
		if (radioButtons[i].checked) {
			nappula_lkm = radioButtons[i].value;
		}
	}
	var suuntanapit = document.getElementsByName('pelisuunta');
	var suunta = "nw_to_se";
	for (var i = 0; i<suuntanapit.length; i++) {
		if (suuntanapit[i].checked) {
			suunta = suuntanapit[i].value;
		}
	}
	/* Tarkistetaan oikeinkirjoitus */
	var size = document.getElementsByName("x")[0].value;
	if (isNaN(size) || (size<8 || size>16)) {
		 document.getElementsByName("x")[0].setAttribute("class","error");	
		document.getElementsByName("nappula_lkm_valinta")[0].removeAttribute("class");
		 var error_msg = document.getElementById("error_msg");
		 error_msg.textContent = "ERR: Arvon pitää olla kokonaisluku väliltä 8-16!";
		 error_msg.setAttribute("class","visible_msg");
	};
	if (nappula_lkm == -1) {
		document.getElementsByName("x")[0].removeAttribute("class");
		document.getElementsByName("nappula_lkm_valinta")[0].setAttribute("class","error");	
		var error_msg = document.getElementById("error_msg");
		error_msg.textContent = "ERR: Valitse nappuloiden lukumäärä!";
		error_msg.setAttribute("class","visible_msg");
	}
	if (!isNaN(size) && (size>=8 && size<=16) && (nappula_lkm != -1)) {
		document.getElementsByName("x")[0].removeAttribute("class");
		document.getElementsByName("nappula_lkm_valinta")[0].removeAttribute("class");
		var error_msg = document.getElementById("error_msg");
		error_msg.setAttribute("class","hidden_msg");
		
		luoTaulu(size);
		
		lisaaNappulat(size,nappula_lkm,suunta);
		resize();
	}
};

/* siirraNappulaa(e)
* -------------------------------------------------------------------
*	e = tapahtuma, joka tulee korvata taulun muutoksella
* -------------------------------------------------------------------
*	1. 	Valitse hiirellä nappula
*	2. 	Valittu nappula muuttaa värinsä vihreäksi
*	3. 	Valitse hiirellä tyhjä ruutu johon haluat nappulan siirtää.
*	4. 	Jos valitsetkin ruudun jossa jo on nappula niin tästä
*	 	nappulasta tulee valittu nappula ja aiemmin valittuna ollut
* 		nappula palaa alkuperäisen väriseksi. Siirry kohtaan 2.
*	5. 	Nappula siirtyy valittuun tyhjään ruutuun ja sen väri palaa 
*		alkuperäiseksi
*/
function siirraNappulaa(e) {
	e.preventDefault();
	
	var vuoro = document.getElementById("vuorotiedote").getAttribute("class");
	var classit = this.getAttribute("class").split(' ');
	
	if (vuoro=="turn-blue") {
		//jos jotain on valittu ja klikataan tyhjää ruutua
		if (valittu!="-1" && classit.length==2) {
			var koords = valittu.split(' ');
			var xFrom = parseInt(koords[0].replace(/\D/g,''));
			var yFrom = parseInt(koords[1].replace(/\D/g,''));
			var xTo = parseInt(classit[0].replace(/\D/g,''));
			var yTo = parseInt(classit[1].replace(/\D/g,''));
			
			var distance = Math.sqrt((xTo-xFrom)*(xTo-xFrom)+(yTo-yFrom)*(yTo-yFrom));
			//laillinen vuoron päättävä siirto tyhjään ruutuun
			if (Math.abs(xTo-xFrom) <= 1 && Math.abs(yTo-yFrom) <= 1 && !hyppy_flag) {
					this.setAttribute("class",classit[0]+" "+classit[1]+" "+valittu_vari);
					this.appendChild(piirraYmpyra(valittu_vari));
					var alkuperainen = document.getElementsByClassName(valittu)[0];
					alkuperainen.setAttribute("class",valittu);
					alkuperainen.removeChild(alkuperainen.getElementsByTagName("svg")[0]);
					valittu = "-1";
					valittu_vari = "-1";
					document.getElementById("vuorotiedote").textContent="Punaisen vuoro";
					document.getElementById("vuorotiedote").setAttribute("class","turn-red");
//resize();
			}
			else if (Math.abs(xTo-xFrom) <= 2 && Math.abs(yTo-yFrom) <= 2) {
					var valissa = document.getElementsByClassName("x"+((xTo+xFrom)/2)+" y"+((yTo+yFrom)/2));
					if (valissa.length==1 && valissa[0].getAttribute("class").split(' ').length==3) {
						this.setAttribute("class",classit[0]+" "+classit[1]+" "+"green");
						this.appendChild(piirraYmpyra("#0f0"));
						var alkuperainen = document.getElementsByClassName(valittu)[0];
						alkuperainen.setAttribute("class",valittu);
						alkuperainen.removeChild(alkuperainen.getElementsByTagName("svg")[0]);
						valittu = classit[0]+" "+classit[1];
						valittu_vari = "blue";
						hyppy_flag = true;
						document.getElementById("vuoronvaihto").setAttribute("class","");
						//resize();
					}
			}
			
		}
		//jos jotain on valittu ja klikataan sinistä ympyrää
		if (valittu!="-1" && classit.length==3 && classit[2]=="blue" && !hyppy_flag) {
			var alkuperainen = document.getElementsByClassName(valittu)[0];
			alkuperainen.setAttribute("class",valittu+" "+valittu_vari);
			alkuperainen.removeChild(alkuperainen.getElementsByTagName("svg")[0]);
			alkuperainen.appendChild(piirraYmpyra(valittu_vari));
			valittu = classit[0] + " " + classit[1];
			valittu_vari = classit[2];
			this.setAttribute("class",valittu+" green");
			this.removeChild(this.getElementsByTagName("svg")[0]);
			this.appendChild(piirraYmpyra("#0f0"));
			//resize();
		}
		//jos mitään ei ole valittu ja klikataan sinistä ympyrää
		if (valittu == "-1" && classit.length==3 && classit[2]=="blue") {
			valittu = classit[0] + " " + classit[1];
			valittu_vari = "blue";
			this.setAttribute("class",valittu+" green");
			this.removeChild(this.getElementsByTagName("svg")[0]);
			this.appendChild(piirraYmpyra("#0f0"));
			//resize();
		}
		resize();
	}
	
	if (vuoro=="turn-red") {
				//jos jotain on valittu ja klikataan tyhjää ruutua
		if (valittu!="-1" && classit.length==2) {
			var koords = valittu.split(' ');
			var xFrom = parseInt(koords[0].replace(/\D/g,''));
			var yFrom = parseInt(koords[1].replace(/\D/g,''));
			var xTo = parseInt(classit[0].replace(/\D/g,''));
			var yTo = parseInt(classit[1].replace(/\D/g,''));
			
			var distance = Math.sqrt((xTo-xFrom)*(xTo-xFrom)+(yTo-yFrom)*(yTo-yFrom));
			//laillinen vuoron päättävä siirto tyhjään ruutuun
			if (Math.abs(xTo-xFrom) <= 1 && Math.abs(yTo-yFrom) <= 1 && !hyppy_flag) {
					this.setAttribute("class",classit[0]+" "+classit[1]+" "+valittu_vari);
					this.appendChild(piirraYmpyra(valittu_vari));
					var alkuperainen = document.getElementsByClassName(valittu)[0];
					alkuperainen.setAttribute("class",valittu);
					alkuperainen.removeChild(alkuperainen.getElementsByTagName("svg")[0]);
					valittu = "-1";
					valittu_vari = "-1";
					document.getElementById("vuorotiedote").textContent="Sinisen vuoro";
					document.getElementById("vuorotiedote").setAttribute("class","turn-blue");
					//resize();
			}
			else if (Math.abs(xTo-xFrom) <= 2 && Math.abs(yTo-yFrom) <= 2) {
					var valissa = document.getElementsByClassName("x"+((xTo+xFrom)/2)+" y"+((yTo+yFrom)/2));
					if (valissa.length==1 && valissa[0].getAttribute("class").split(' ').length==3) {
						this.setAttribute("class",classit[0]+" "+classit[1]+" "+"green");
						this.appendChild(piirraYmpyra("#0f0"));
						var alkuperainen = document.getElementsByClassName(valittu)[0];
						alkuperainen.setAttribute("class",valittu);
						alkuperainen.removeChild(alkuperainen.getElementsByTagName("svg")[0]);
						valittu = classit[0]+" "+classit[1];
						valittu_vari = "red";
						hyppy_flag = true;
						document.getElementById("vuoronvaihto").setAttribute("class","");
						//resize();
					}
			}
			
		}
		//jos jotain on valittu ja klikataan sinistä ympyrää
		if (valittu!="-1" && classit.length==3 && classit[2]=="red" && !hyppy_flag) {
			var alkuperainen = document.getElementsByClassName(valittu)[0];
			alkuperainen.setAttribute("class",valittu+" "+valittu_vari);
			alkuperainen.removeChild(alkuperainen.getElementsByTagName("svg")[0]);
			alkuperainen.appendChild(piirraYmpyra(valittu_vari));
			valittu = classit[0] + " " + classit[1];
			valittu_vari = classit[2];
			this.setAttribute("class",valittu+" green");
			this.removeChild(this.getElementsByTagName("svg")[0]);
			this.appendChild(piirraYmpyra("#0f0"));
			//resize();
		}
		//jos mitään ei ole valittu ja klikataan sinistä ympyrää
		if (valittu == "-1" && classit.length==3 && classit[2]=="red") {
			valittu = classit[0] + " " + classit[1];
			valittu_vari = "red";
			this.setAttribute("class",valittu+" green");
			this.removeChild(this.getElementsByTagName("svg")[0]);
			this.appendChild(piirraYmpyra("#0f0"));
			//resize();
		}
		resize();
	}
};

/* piirraYmpyra(vari)
* -------------------------------------------------------------------
*	vari = Ympyrän väri
* -------------------------------------------------------------------
*	piirtää SVG-grafiikkana halutun värisen ympyrän
* -------------------------------------------------------------------
*	@return = palauttaa svg-elementin, jossa on ympyrä.
*/
function piirraYmpyra(vari) {
	var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttributeNS(null,"width","0");
	svg.setAttributeNS(null, "height", "0");
	var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
	circle.setAttributeNS(null, "cx","0");
	circle.setAttributeNS(null, "cy","0");
	circle.setAttributeNS(null, "r","0");
	circle.setAttributeNS(null, "stroke","black");
	circle.setAttributeNS(null, "stroke-width","2");
	circle.setAttributeNS(null, "fill",vari);
	svg.appendChild(circle);
	return svg;
}