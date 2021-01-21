#!/usr/bin/python
# -*- coding: utf-8 -*-

from flask import Flask, jsonify, redirect, escape, request, Response, make_response, session
import sqlite3
import logging
import os
import sys
# korjaa tähän polku oikeaan paikkaan. lokia ei saa tehdä cgi-bin-kansion alaisuuteen
# varmista, että piilo-kansioon on kaikilla kirjoitusoikeus
# älä luo kansioita windowsin kautta vaan vain ja ainoastaan unix-komentoriviltä
logging.basicConfig(filename=os.path.abspath('../../piilo/vuokraamo.log'),level=logging.DEBUG)
app = Flask(__name__) 
app.secret_key = b'h6\x99\xd8Uq\x99i\x98\xcb\xf5\xf5-\x8d\xf1\xa0\xbc\xb8\xc6^|"\xf4\x98'
app.debug = True

# Koitetaan, löytyykö simplejsonia, jos ei niin lisätään json, jossa tietääkseni on oikeat 
# (tai siis ohjelman vaatimat) metodit.
try:
    import simplejson as json
except Exception as e:
    logging.debug("Simplejsonia ei löytynyt")
    logging.debug(str(e))
    try:
        import json
    except Exception as e:
        logging.debug("jsonia ei löytynyt")
        logging.debug(str(e))

# Kirjautumissivu
@app.route('/kirjaudu', methods=['POST', 'GET'])
def kirjaudu():
    # virheet -listaan kerätään ilmenneitä virheitä, jotka palautetaan sitten.
    # krypt_* tarkoittaa vain kryptattua muotoa tiedosta
    virheet = []
    krypt_salasana = b'\x18}P?+k[ g[\x90\x1f\xe5\x08\x9c%\xc6{\xff\x12\xd8\x9ec\xbf\x87\x8b\xdf\xc4\x89\x1e\xd4y\x04\xcf\x166\xda\xcb\x18\xcf]\xbc\x94\xd9\x97Ex\x11G& \x81\x18\xba\xdf\x99\x97\xfa\t\x0e2\x10\x8a&'
    krypt_tunnus = b'F\xf8Q\t\x90\xf5\xa3@\x96Dp\x91\xfd\x06\xc7\x8c9V\xf2!\xad\xf8\xf5\x96\xfdOD\xb2\xe0\xed\x1a\x97\xd5\xa1l\x12l\x95\xdd&3/\x80\xef0]\xce\xed\x945]"a\xd4\\y-\xba\x99N\x83#Z\xc4'
    # Kirjautuminen pähkinänkuoressa: suolataan s ja t, sha415:lla vedetään annettu
    # tunnus ja salasana ja verrataan sitten kryptattuihin arvoihin. 
    try:
        import hashlib
        s = hashlib.sha512()
        t = hashlib.sha512()
        s.update(app.secret_key)
        t.update(app.secret_key)
        try:
            salasana = request.form.get("ssana").encode('utf-8')
            tunnus = request.form.get("ktun").encode('utf-8')
        except:
            salasana = b""
            tunnus = b""
        s.update(salasana)
        t.update(tunnus)
        if t.digest() == krypt_tunnus and s.digest() == krypt_salasana:
            session['kirjautunut'] = "ok"
        else:
            virheet.append(u'Käyttäjätunnus ja/tai salasana oli väärin.')
    except Exception as e:
        logging.debug("Kirjautumishäikkä")
        logging.debug(str(e))
        virheet.append(u"Kirjautuminen oli hankalaa")
    resp = make_response(json.dumps(virheet), 200)
    resp.mimetype = "application/json"
    return resp

# kirjautumisen tarkistus
@app.route('/auth')
def auth():
    # Tämä on aika yksiselitteinen pätkä jo itsessään, onko sessionissa 'kirjautunut'
    # tietoa vai ei ja toimenpiteet sen mukaan.
    virheet = []
    try:
        if not 'kirjautunut' in session:
            virheet.append(u'Et ole kirjautunut sisään.')
    except:
        virheet.append(u'Et ole kirjautunut sisään.')
    resp = make_response(json.dumps(virheet), 200)
    resp.mimetype="application/json"
    return resp

# Hakee vuokraajat ja tulostaa ne JSON muodossa
@app.route('/hae_vuokraajat')
def hae_vuokraajat():
    try:
        vuokraajat = []
        con = yhdista_kantaan()
        cur = con.cursor()
        cur.execute("""SELECT JasenID, Nimi
        FROM Jasen
        """)
        # J tulee Jäsen -sanasta, olisi voinut käyttää myös v eli vuokraaja.
        # lisäillään vaan selectin tuottama tavara vuokraajat-listaan ja lähetetään eteenpäin.
        for j in cur:
            vuokraajat.append({"jid":j['JasenID'],"Nimi":j['Nimi']})
        resp = make_response(json.dumps(vuokraajat), 200)
        #resp.charset = "UTF-8"
        resp.mimetype = "application/json"
        con.close()
        return resp
    except Exception as e:
        logging.debug("Jokin meni hakiessa kummallisesti:")
        logging.debug(str(e))

# Hakee elokuvat ja tulostaa ne JSON muodossa
@app.route('/hae_elokuvat')
def hae_elokuvat():
    try:
        elokuvat = []
        con = yhdista_kantaan()
        cur = con.cursor()
        cur.execute("""SELECT ElokuvaID, Nimi
        FROM Elokuva
        """)
        for e in cur:
            elokuvat.append({"eid":e['ElokuvaID'],"Nimi":e['Nimi']})
        resp = make_response(json.dumps(elokuvat), 200)
        #resp.charset = "UTF-8"
        resp.mimetype = "application/json"
        return resp
        con.close()
    except Exception as e:
        logging.debug("Jokin meni hakiessa kummallisesti:")
        logging.debug(str(e))

# Hakee elokuvalistauksen
@app.route('/hae_vuokraukset')
def hae_vuokraukset():
    vuokraajat = []
    vuokraukset = []
    logging.debug("Löysin vuokrauksiin")
    try:
        con = yhdista_kantaan()
        cur = con.cursor()
        cur.execute("""SELECT JasenID, Nimi
        FROM Jasen
        ORDER BY Nimi
        """)
        henkilot = cur.fetchall()
        # j tulee Jäsen -sanasta, olisi voinut käyttää selkeämpääkin muuttujaa.
        # Tässä seuraa vain seuraavaa:
        # rullataan selectillä haetut jäsenet, haetaan heidän JasenID:llä vuokraukset,
        # lisätään vuokraajan vuokraukset listaan ja laitetaan vuokraajat listaan sitten
        # Nimi, JasenID ja vuokraukset.
        for j in henkilot:
            vuokraukset = []
            try:
               sql = ''' SELECT v.JasenID as jid, v.ElokuvaID as eid, v.VuokrausPVM as vpvm, e.Nimi as elokuva, v.PalautusPVM as ppvm, v.Maksettu as summa
               FROM Vuokraus v, Elokuva e
               WHERE e.ElokuvaID = v.ElokuvaID
               AND v.JasenID = :jid
               ORDER BY v.VuokrausPVM DESC
               '''
               cur.execute(sql, {"jid": j["JasenID"]})
            except:
               logging.debug("En saanut jäsenen tietoa")
               logging.debug(sys.excinfo()[0])
            for v in cur:
                vuokraukset.append({"eid":v['eid'],"vpvm":v['vpvm'],"elokuva":v['elokuva'],"ppvm":v['ppvm'],"summa":v['summa']})
            vuokraajat.append({"jid":j['JasenID'],"Nimi":j['Nimi'],"vuokraukset":vuokraukset})
        con.close()
    except Exception as e:
        logging.debug("Jokin meni hassusti")
        logging.debug(str(e))
    resp = make_response(json.dumps(vuokraajat), 200)
    #resp.charset = "UTF-8"
    resp.mimetype = "application/json"
    return resp
    
# Lajityyppien haku
@app.route('/hae_lajityypit')
def hae_lajityypit():
    try:
        lajityypit = []
        con = yhdista_kantaan()
        cur = con.cursor()
        cur.execute("""SELECT LajityyppiID, Tyypinnimi
        FROM Lajityyppi
        """)
        # l tarkoittaa lajityyppiä. Ei pitäisi tämän koodin olla kovin epäselvä.
        for l in cur:
            lajityypit.append({"lid":l['LajityyppiID'],"Nimi":l['Tyypinnimi']})
        resp = make_response(json.dumps(lajityypit), 200)
        #resp.charset = "UTF-8"
        resp.mimetype = "application/json"
        return resp
        con.close()
    except Exception as e:
        logging.debug("Jokin meni hakiessa kummallisesti:")
        logging.debug(str(e))
        
# Lisää vuokraaja
@app.route('/lisaa_vuokraaja', methods=['POST', 'GET'])
def lisaa_vuokraaja():
    # virhelistan alustus, tähän kerätään ilmenneet virheet.
    # Tarkistetaan heti aluksi jo, että ollaanko kirjauduttu, ettei tätä 
    # voisi käyttää ilman kirjautumista.
    virheet = []
    try:
        if not 'kirjautunut' in session:
            virheet.append(u'Et ole kirjautunut sisään.')
    except:
        virheet.append(u'Et ole kirjautunut sisään.')
    try:
        con = yhdista_kantaan()
        cur = con.cursor()
        try:
            # Tarkastetaan, onko muokkaukseen vaadittavia tietoja, jos ei ole niin silloin lisätään data.
            if request.form.get("jid_old")=='' or request.form.get("eid_old")=='' or request.form.get('vpvm_old')=='':
                sql= '''INSERT INTO Vuokraus (JasenID,ElokuvaID,VuokrausPVM,PalautusPVM,Maksettu)
                VALUES (:jid,:eid,:vpvm,:ppvm,:summa)
                '''
                # Ei executeta, ellei olla kirjautuneita
                if 'kirjautunut' in session:
                    cur.execute(sql, {"jid": request.form.get("jid"), "eid": request.form.get("eid"), "vpvm": request.form.get("vpvm"), "ppvm": request.form.get("ppvm"), "summa": request.form.get("summa")})
            # Muuten päivitetään olemassa olevaa.
            else:
                sql = '''UPDATE vuokraus
                SET JasenID = :jid,
                ElokuvaID = :eid,
                VuokrausPVM = :vpvm,
                PalautusPVM = :ppvm,
                Maksettu = :summa
                WHERE JasenID = :jid_old
                AND ElokuvaID = :eid_old
                AND VuokrausPVM = :vpvm_old
                '''
                # Taas ei ajeta käskyä ilman, että ollaan kirjautuneita.
                if 'kirjautunut' in session:
                    cur.execute(sql,  {"jid": request.form.get("jid"), "eid": request.form.get("eid"), "vpvm": request.form.get("vpvm"), "ppvm": request.form.get("ppvm"), "summa": request.form.get("summa"), "jid_old": request.form.get("jid_old"), "eid_old": request.form.get("eid_old"), "vpvm_old": request.form.get("vpvm_old")})
        except Exception as e:
            logging.debug("insert ei toiminut.")
            logging.debug(str(e))
            con.rollback()
            virheet.append(u"Annetuissa tiedoissa oli virhe. Esim. Vastaava syöte löytyy jo tietokannasta tai tiedot olivat virheellisiä (mm. Vuokrauspäivämäärä ennen palautuspäivämäärää)")
        con.commit()
        con.close()
    except Exception as e:
        logging.debug("En saanut yhteyttä kantaan.")
        logging.debug(str(e))
        virheet.append(u"Tietokanta ei auennut.")
    # Kerätään data-listaan onnistuiko ja laitetaan perään vielä ilmenneet virheet.
    data = []
    data.append({"success": len(virheet) == 0, "errors": virheet})
    resp = make_response(json.dumps(data), 200)
    resp.mimetype = "application/json"
    return resp

# Lisää elokuva
@app.route('/lisaa_elokuva', methods=['POST', 'GET'])
def lisaa_elokuva():
    # virheet -listan alustus
    virheet=[]
    
    # Tarkistetaan kirjautuminen
    try:
        if not 'kirjautunut' in session:
            virheet.append(u'Et ole kirjautunut sisään.')
    except:
        virheet.append(u'Et ole kirjautunut sisään.')
    try:
        con = yhdista_kantaan()
        cur = con.cursor()
        try: 
            # Luodaan uusi elokuva, jos tiedot on tulleet oikein
            sql= '''
            INSERT INTO Elokuva (Nimi, Julkaisuvuosi, Vuokrahinta, Arvio, LajityyppiID)
            VALUES (:nimi, :julkaisuvuosi, :hinta, :arvio, :lajityyppi)
            '''
            # Ajetaan execute vain, jos ollaan kirjautuneita
            if 'kirjautunut' in session:
                cur.execute(sql, {"nimi": request.form.get("nimi"), "julkaisuvuosi": request.form.get("julkaisuvuosi"), "hinta": request.form.get("hinta"), "arvio": request.form.get("arvio"), "lajityyppi": request.form.get("lajityyppi")})
        except Exception as e:
            logging.debug("En saanut elokuvaa lisättyä.")
            logging.debug(str(e))
            con.rollback()
            virheet.append(u"Elokuvaa ei kyetty lisäämään. Virheellinen syöte?")
        con.commit()
        con.close()
    except Exception as e:
        logging.debug("En saanut yhteyttä kantaan.")
        logging.debug(str(e))
        virheet.append(u'Tietokanta ei aukea.')
    # Sama palautus kuin edellisessä.
    data = []
    data.append({"success": len(virheet) == 0, "errors": virheet})
    resp = make_response(json.dumps(data), 200)
    resp.mimetype = "application/json"
    return resp

# Poista annettu elokuva
@app.route('/poista_elokuva', methods=['POST', 'GET'])
def poista_elokuva():
    virheet=[]
    
    try:
        con = yhdista_kantaan()
        cur = con.cursor()
        try:
            # Poistetaan eka kaikki vuokraukset, joissa kys. om. elokuva mainitaan
            sql = ''' DELETE FROM Vuokraus
            WHERE ElokuvaID = :eid
            '''
            if 'kirjautunut' in session:
                cur.execute(sql, {"eid": request.form.get("eid")})
            # Poistetaan sitten elokuva, kun tiedetään ettei muut voi viitata elokuvaID:hen
            sql = ''' DELETE FROM Elokuva
            WHERE ElokuvaID = :eid
            '''
            if 'kirjautunut' in session:
                cur.execute(sql, {"eid": request.form.get("eid")})
        except Exception as e:
            logging.debug("En saanut elokuvaa poistettua.")
            logging.debug(str(e))
            con.rollback()
            virheet.append(u"Elokuvaa ei kyetty poistamaan.")
        con.commit()
        con.close()
    except Exception as e:
        logging.debug("En saanut yhteyttä kantaan.")
        logging.debug(str(e))
        virheet.append(u'Tietokanta ei aukea')
    
    data = []
    data.append({"success": len(virheet) == 0, "errors": virheet})
    resp = make_response(json.dumps(data), 200)
    resp.mimetype = "application/json"
    return resp

# Yhdistää tietokantaan
def yhdista_kantaan():
    # sqlite haluaa absoluuttisen polun
    try:
        con = sqlite3.connect(os.path.abspath('../../piilo/video'))
        con.row_factory = sqlite3.Row
        return con;
    except Exception as e:
        logging.debug("jotain meni pieleen")
        logging.debug(str(e))


if __name__ == '__main__':
    app.debug = True
    app.run(debug=True)