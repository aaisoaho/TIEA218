#!/usr/bin/python
# -*- coding: utf-8 -*-

import cgitb
cgitb.enable()
import cgi
import os
import simplejson as json
from jinja2 import Template, Environment, FileSystemLoader

print """Content-type: text/html; charset=UTF-8\n""" 

class Pallo:
	''' Palloluokka taulukkoa varten 
	'''
	
	tunniste = 1
	def __init__(self, x=0, y=0, nimi=0):
		self.x=x
		self.y=y
		self.nimi=nimi
		self.id = Pallo.tunniste
		Pallo.tunniste = Pallo.tunniste + 1
	def __repr__(self):
		return str({"Pallo": True, "Id":self.id, "X":self.x, "Y":self.y, "Nimi":self.nimi})
	def __str__(self):
		return "Id\t"+ self.id + "\tX\t" + str(self.x) + "\tY\t" + str(self.y) + "\tNimi\t" + str(self.nimi)

# oma pallon enkoodaus
def encode_pallo(o):
	if isinstance(o, Pallo):
		return {"Pallo": True, "X": o.x, "Y": o.y, "Nimi": o.nimi }
	raise TypeError(repr(o) + " is not JSON serializable")

def as_pallo(o):
	if 'Pallo' in o:
		return Pallo(o["X"], o["Y"],o["Nimi"])
	return o

# rakennetaan polkua jinja2 templateen
tmpl_path = os.path.join(os.path.dirname(os.environ['SCRIPT_FILENAME']), 'templates')

# koitetaan löytää jinja2 template
try:
    env = Environment(autoescape=True, loader=FileSystemLoader(tmpl_path), extensions=['jinja2.ext.autoescape'])
except:
    env = Environment(autoescape=True, loader=FileSystemLoader(tmpl_path))
template = env.get_template('jinja.html')

# availlaan fieldStorage
form = cgi.FieldStorage()

# correct -muuttuja kertoo, onko taulukon koko annettu oikein, mutta alustetaan se nyt True:ksi
correct = True

# luetaan teksti
teksti = form.getfirst("teksti", "").decode("UTF-8")

pallo = form.getfirst("pallo", "").decode("UTF-8")
try:
	x = int(form.getfirst("x", 1).decode("UTF-8"))
except:
	x = 1
	
try:
	y = int(form.getfirst("y", 1).decode("UTF-8"))
except:
	y = 1

# Koitetaan, onko kyseessä numero, jos ei ole, niin palautetaan -1,
# Nimi tulee siitä, että alunperin tämä palautti 8, jos annettiin virheellinen data
def int_or_8(var):
   try:
         return int(var)
   except Exception:
      return -1

# koitetaan saada taulukon koko tietoon
koko = int_or_8(form.getfirst("x", ""))

# Testaillaan saatiinko oikeaa kokoa ja tallennetaan errMsg-muuttujaan tieto siitä, 
# miten onnistuttiin. Muutetaan correct -muuttujan arvoa tarpeiden mukaan
if correct==True and koko>-1 and (koko<8 or koko>16):
   koko = 8
   errMsg = u"ERR: Luku ei ollut välillä 8-16"
   correct = False
elif koko == -1:
   errMsg = u"ERR: Kyseessä ei ollut numero"
   correct = False

# muutetaan koko 0:ksi, jos oltiin annettu virheellistä dataa
if correct == False:
   koko = 0
else:
   errMsg = u""

# muodostetaan lista, jossa on pallojen instanssit
try:
	pallot = form.getfirst("pallot", []).decode("UTF-8")
except:
	pallot = []
	
try:
	if len(pallot):
		pallot = json.loads( pallot, object_hook=as_pallo)
except: 
	pallot = []

# Jos pallolistan pituus on 0, niin voidaan olettaa, että taulukko on juuri luotu, joten täytetään se
# Täydennystapa: kelataan 0-> koko+1, jokaisessa stepissä kelataan 0->kohta-jossa-ollaan +1, jossa lisätään
# pallo, jonka x = i, y = j ja nimi on 1+i*koko+j.
if len(pallot) == 0:
	if correct==True:
		for i in range(0, koko+1):
			for j in range(0,i+1):
				pallot.append( Pallo(i,j,1+i*koko+j) )

# Koitetaan katsoa, löytyykö meiltä poista dataa				
try:
	poista = int(form.getfirst("poista", 0))
except:
	poista = 0

# Jos löytyi, niin poistetaan poista-muuttujan arvon kanssa saman niminen pallo listalta
if poista:
	for p in pallot:
		if p.nimi == poista:
			pallot.remove(p)

# Tallennetaan lista tallenna -muuttujaan
tallenna = json.dumps( pallot, default=encode_pallo)

# Annetaan jinjalle tiedot
print template.render(usertext=teksti, koko=koko, correct = correct, errMsg = errMsg, pallo=pallo, pallot=pallot, tallenna=tallenna).encode("UTF-8")
