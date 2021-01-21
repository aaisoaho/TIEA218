# -*- coding: utf-8 -*-
"""
Created on Mon Feb 27 15:49:45 2017

@author: Aaron Isoaho
"""
from flask import Flask, session, redirect, url_for, request, render_template
from datetime import datetime
import sqlite3
import os
import sys
app = Flask(__name__)
app.secret_key = 'h6\x99\xd8Uq\x99i\x98\xcb\xf5\xf5-\x8d\xf1\xa0\xbc\xb8\xc6^|"\xf4\x98'

import logging
logging.basicConfig(filename=os.path.abspath('../piilo/flask.log'),level=logging.DEBUG)

def onkoPVM(pvm):
    try:
        if pvm != datetime.strptime(pvm, "%Y-%m-%d").strftime('%Y-%m-%d'):
            raise ValueError
        return True
    except Exception as e:
        logging.debug(str(e))
        return False

# Etusivu
@app.route('/')
def Empty_page():
   try:
       # sqlite haluaa absoluuttisen polun
       con = sqlite3.connect(os.path.abspath('../piilo/video'))
       con.row_factory = sqlite3.Row
       cur = con.cursor()
       #try:
       #         cur.execute("""
       #         SELECT e.Nimi as elokuva, j.Nimi as vuokraaja, v.VuokrausPVM as vuokrausPVM, v.PalautusPVM as palautusPVM, v.Maksettu as summa
       #         FROM Elokuva e, Jasen j, Vuokraus v
       #         WHERE e.ElokuvaID = v.ElokuvaID
       #         AND j.JasenID = v.JasenID
       #         """)
       #except:
       #         logging.debug("En osaa listata")
       #         logging.debug(sys.exc_info()[0])
       #vuokraukset = []
       #for v in cur:
       #    vuokraukset.append( {"elokuva":v["elokuva"], "vuokraaja":v["vuokraaja"], "vuokrausPVM":v["vuokrausPVM"], "palautusPVM":v["palautusPVM"], "summa":v["summa"]})
       #con.close()
       try: 
           cur.execute("""
           SELECT JasenID, Nimi
           FROM Jasen
           ORDER BY Nimi
           """)
       except:
           logging.debug("En saanut jäseniä")
           logging.debug(sys.exc_info()[0])
       fetchi = cur.fetchall()
       kayttajat = []
       nimet = []
       for j in fetchi:
           # Koitetaan katsoa listaa vuokrauksista
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
           vuokraukset = []
           tiedot = cur.fetchall()
           if len(tiedot) != 0:
               nimet.append({"Nimi":j["Nimi"],"uid":j["JasenID"]})
               for t in tiedot:
                   vuokraukset.append({"jid":t["jid"], "eid":t["eid"], "vpvm":t["vpvm"],"elokuva":t["elokuva"],"ppvm":t["ppvm"],"summa":t["summa"]})
               kayttajat.append(vuokraukset)
       con.close()
   except Exception as e:
       logging.debug("Kanta ei aukea")
       # sqliten antama virheilmoitus:
       logging.debug(str(e))
       
   return render_template('listaus.html', kayttajat=kayttajat,nimet=nimet)


# Vuokraus-sivu
@app.route('/vuokraus', methods=['POST', 'GET']) 
def vuokraus():
    if (request.form.get("laheta","") == ""):
        try:
            # sqlite haluaa absoluuttisen polun
            con = sqlite3.connect(os.path.abspath('../piilo/video'))
            con.row_factory = sqlite3.Row
            cur = con.cursor()
            try:
                cur.execute("""
                SELECT DISTINCT e.ElokuvaID as id, e.Nimi as nimi
                FROM Elokuva e
                """)
            except:
                logging.debug("En osaa listata")
                logging.debug(sys.exc_info()[0])
            elokuvat = []
            for e in cur:
                elokuvat.append( {"id":e["id"], "nimi":e["nimi"]})
            try:
                cur.execute("""
                SELECT DISTINCT j.JasenID as id, j.Nimi
                FROM Jasen j
                """)
            except:
                logging.debug("En osaa listata")
                logging.debug(sys.exc_info()[0])
            nimet = []
            for n in cur:
                nimet.append( {"id":n["id"], "nimi":n["nimi"]})
            con.close()
        except Exception as e:
            logging.debug("Kanta ei aukea")
            # sqliten antama virheilmoitus:
            logging.debug(str(e))    
        return render_template('vuokraus.html',nimet=nimet,elokuvat=elokuvat,virheet=[])
    else:
        virheet = []
        if not onkoPVM(request.form.get("vuokrauspvm","")):
            virheet.append(u"Vuokrauspäivämäärä oli väärin.")
        if not onkoPVM(request.form.get("palautuspvm","")):
            virheet.append(u"Palautuspäivämäärä oli väärin.")
        con = sqlite3.connect(os.path.abspath('../piilo/video'))
        con.row_factory = sqlite3.Row
        cur = con.cursor()
        try:
            sql= '''SELECT Vuokrahinta
            FROM Elokuva
            WHERE ElokuvaID = :elokuva
            '''
            cur.execute(sql, {"elokuva":request.form.get("Elokuva",0)})
            try:
                annettu = int(request.form.get("summa"))
            except Exception as e:
                annettu = 0
                logging.debug(str(e))
                virheet.append(u'Annettu luku ei ollut kokonaisluku.')
            try:
                haku = cur.fetchone()[0]
                haettu = int(haku)
            except Exception as e:
                haettu = 0
                logging.debug(str(e))
                virheet.append(u'Haetun elokuvan hintaa ei löytynyt.')
            if not (haettu == annettu):
                virheet.append(u'Summa ei täsmää hintaan.')
        except Exception as e:
            logging.debug("Kanta ei aukea")
            logging.debug(str(e))
        con.close()
        if len(virheet) == 0:
            # suolletaan tietokantaan uusi sisältö ja uudelleenohjataan etusivule
            con = sqlite3.connect(os.path.abspath('../piilo/video'))
            con.row_factory = sqlite3.Row
            cur = con.cursor()
            try:
                sql= '''INSERT INTO Vuokraus (JasenID,ElokuvaID,VuokrausPVM,PalautusPVM,Maksettu)
                VALUES (:jid,:eid,:vpvm,:ppvm,:summa)
                '''
                cur.execute(sql, {"jid": request.form.get("Vuokraaja"), "eid": request.form.get("Elokuva"), "vpvm": request.form.get("vuokrauspvm"), "ppvm": request.form.get("palautuspvm"), "summa": request.form.get("summa")})
            except Exception as e:
                logging.debug("insert ei toiminut.")
                logging.debug(str(e))
                con.rollback()
            con.commit()
            return redirect(url_for('Empty_page'))
        else:
            try:
                # sqlite haluaa absoluuttisen polun
                con = sqlite3.connect(os.path.abspath('../piilo/video'))
                con.row_factory = sqlite3.Row
                cur = con.cursor()
                try:
                    cur.execute("""
                                SELECT DISTINCT e.ElokuvaID as id, e.Nimi as nimi
                                FROM Elokuva e
                                """)
                except:
                    logging.debug("En osaa listata")
                    logging.debug(sys.exc_info()[0])
                elokuvat = []
                for e in cur:
                    elokuvat.append( {"id":e["id"], "nimi":e["nimi"]})
                try:
                    cur.execute("""
                                SELECT DISTINCT j.JasenID as id, j.Nimi
                                FROM Jasen j
                                """)
                except:
                    logging.debug("En osaa listata")
                    logging.debug(sys.exc_info()[0])
                nimet = []
                for n in cur:
                    nimet.append( {"id":n["id"], "nimi":n["nimi"]})
                con.close()
            except Exception as e:
                logging.debug("Kanta ei aukea")
                # sqliten antama virheilmoitus:
                logging.debug(str(e))    
            return render_template('vuokraus.html',nimet=nimet,elokuvat=elokuvat,virheet=virheet)

# vuokrauksen muokkaussivu
@app.route('/muokkaa', methods=['POST', 'GET'])
def muokkaa():
    #Katsotaan aluksi, saadaanko GET-metodilla mitään ja saadaanko kelpaavaa dataa
    onnistuneetargsit = True
    try:
        jid = request.args.get("jid")
        eid = request.args.get("eid")
        vpvm = request.args.get("vpvm")
        elokuvat = []
        nimet = []
        virheet = []
        ppvm = u""
        summa = 0
    except Exception:
        onnistuneetargsit = False
    if (jid is None or eid is None or vpvm is None or not onkoPVM(vpvm)):
        onnistuneetargsit = False
    
    if not onnistuneetargsit: #Jos yritetään muokata sivua, jonka GET-argumentit ovat pielessä
        return redirect(url_for('Empty_page'))
    else: # GET-argumentit ovat kunnossa
        try:
            con = sqlite3.connect(os.path.abspath('../piilo/video'))
            con.row_factory = sqlite3.Row
            cur = con.cursor()
            try:
                sql= """SELECT PalautusPVM, Maksettu
                FROM Vuokraus
                WHERE JasenID = :jid
                AND ElokuvaID = :eid
                AND VuokrausPVM = :vpvm
                """
                cur.execute(sql, {"jid":jid,"eid":eid,"vpvm":vpvm})
                for i in cur:
                    ppvm = i["PalautusPVM"]
                    summa = i["Maksettu"]
            except Exception as e:
                logging.debug(u"En saanut palautuspäivämäärää ja maksettua summaa")
                logging.debug(str(e))
        except Exception as e:
                logging.debug(u"En saanut yhteyttä kantaan")
                logging.debug(str(e))
        if (request.form.get("poista","") == "" and request.form.get("laheta","") == ""): 
            #Jos tullaan sivulle ekaa kertaa niin listataan tiedot ilman tarkistuksia
            try:
                #Yhdistetään tietokantaan
                con = sqlite3.connect(os.path.abspath('../piilo/video'))
                con.row_factory = sqlite3.Row
                cur = con.cursor()
                # Haetaan elokuvista lista
                try:
                    cur.execute("""
                    SELECT DISTINCT e.ElokuvaID as id, e.Nimi as nimi
                    FROM Elokuva e
                    """)
                except:
                    logging.debug("En saanut listattua elokuvia")
                    logging.debug(sys.exc_info()[0])
                elokuvat = []
                for e in cur:
                    elokuvat.append({"id":e["id"], "nimi":e["nimi"]})
                # Haetaan käyttäjistä lista
                try: 
                    cur.execute("""
                    SELECT DISTINCT j.JasenID as id, j.Nimi
                    FROM Jasen j
                    """)
                except:
                    logging.debug("En saanut listaa jäsenistä")
                    logging.debug(sys.exc_info()[0])
                nimet = []
                for n in cur:
                    nimet.append({"id":n["id"], "nimi":n["nimi"]})
                con.close()
            except Exception as e:
                logging.debug("Kanta ei aukea")
                logging.debug(str(e))
        if (request.form.get("poista","") != ""):
            try:
                con = sqlite3.connect(os.path.abspath('../piilo/video'))
                con.row_factory = sqlite3.Row
                cur = con.cursor()
                
                sql = '''DELETE FROM vuokraus 
                WHERE ElokuvaID = :eid
                AND JasenID = :jid
                AND VuokrausPVM = :vpvm
                '''
                try:
                    cur.execute(sql, {"jid":jid, "eid":eid, "vpvm":vpvm} )
                except Exception as e:
                    logging.debug("En saanut poistettua tietoa")
                    logging.debug(sys.exc_info()[0])
                    con.rollback()
                con.commit()
                con.close()
                return redirect(url_for('Empty_page'))
            except Exception as e:
                logging.debug("Kanta ei aukea")
                logging.debug(str(e))
        if (request.form.get("laheta","") != ""):
            # toiminta mietitään myöhemmin
            if not onkoPVM(request.form.get("vuokrauspvm")):
                virheet.append(u"Vuokrauspäivämäärä on annettu virheellisenä!")
            if not onkoPVM(request.form.get("palautuspvm")):
                virheet.append(u"Palautuspäivämäärä on annettu virheellisenä!")
            con = sqlite3.connect(os.path.abspath('../piilo/video'))
            con.row_factory = sqlite3.Row
            cur = con.cursor()
            try:
                sql= '''SELECT Vuokrahinta
                FROM Elokuva
                WHERE ElokuvaID = :elokuva
                '''
                cur.execute(sql, {"elokuva":request.form.get("Elokuva",0)})
                try:
                    annettu = int(request.form.get("summa"))
                except Exception as e:
                    annettu = 0
                    logging.debug(str(e))
                    virheet.append(u'Annettu luku ei ollut kokonaisluku.')
                try:
                    haku = cur.fetchone()[0]
                    haettu = int(haku)
                except Exception as e:
                    haettu = 0
                    logging.debug(str(e))
                    virheet.append(u'Haetun elokuvan hintaa ei löytynyt.')
                if not (haettu == annettu):
                    virheet.append(u'Summa ei täsmää hintaan.')
            except Exception as e:
                logging.debug("Kanta ei aukea")
                logging.debug(str(e))
            if len(virheet) == 0:
                sql = '''UPDATE vuokraus
                SET JasenID = :jid_uusi,
                ElokuvaID = :eid_uusi,
                VuokrausPVM = :vpvm_uusi,
                PalautusPVM = :ppvm_uusi,
                Maksettu = :summa_uusi
                WHERE JasenID = :jid
                AND ElokuvaID = :eid
                AND VuokrausPVM = :vpvm
                '''
                try:
                    cur.execute(sql, {"jid_uusi":request.form.get("Vuokraaja"), "eid_uusi":request.form.get("Elokuva"), "vpvm_uusi":request.form.get("vuokrauspvm"), "ppvm_uusi":request.form.get("palautuspvm"), "summa_uusi":request.form.get("summa"),"jid":jid,"eid":eid,"vpvm":vpvm})
                except Exception as e:
                    logging.debug("Päivitys epäonnistui")
                    logging.debug(str(e))
                    con.rollback()
                con.commit()
                con.close()
                return redirect(url_for('Empty_page'))
            con.close()
        return render_template('muokkaa.html',summa=summa,ppvm=ppvm,jid=jid,eid=eid,vpvm=vpvm,elokuvat=elokuvat,nimet=nimet,virheet=virheet)
    
# Elokuvalistaus-sivu
@app.route('/elokuvat')
def elokuvalista():
    # Napataan lajittelutapa, jos evästettä ei ole, niin alustetaan nollaksi ja koitetaan saada lajittelutapa
    # Oletus 0
    # Lajittelutavat:
    # 0 = nimen mukaan,
    # 1 = vuoden mukaan,
    # 2 = hinnan mukaan,
    # 3 = arvion mukaan,
    # 4 = lajityypin mukaan
    elokuvat = []
    try: 
        evaste = session['elokuva_sort']
    except Exception as e:
        logging.debug("en saa sessiomuuttujaa")
        logging.debug(str(e))
        evaste = 0
        session['elokuva_sort'] = 0
    try:
        lajittelu = request.args.get("sort",evaste)
    except:
        lajittelu = evaste
    try:
        lajittelu = int(lajittelu)
    except:
        logging.debug("Lajittelu ei ollut INT")
        lajittelu = 0
    if lajittelu>4:
        lajittelu = 0
    session['elokuva_sort'] = lajittelu
    try: 
        con = sqlite3.connect(os.path.abspath('../piilo/video'))
        con.row_factory = sqlite3.Row
        cur = con.cursor()
        try:
            if lajittelu == 0:
                sql = '''SELECT e.Nimi as nimi, e.Julkaisuvuosi as vuosi, e.Vuokrahinta as hinta, e.Arvio as arvio, l.Tyypinnimi as genre
                FROM Elokuva e, Lajityyppi l
                WHERE l.LajityyppiID = e.LajityyppiID
                ORDER BY e.Nimi
                '''
            if lajittelu == 1:
                sql = '''SELECT e.Nimi as nimi, e.Julkaisuvuosi as vuosi, e.Vuokrahinta as hinta, e.Arvio as arvio, l.Tyypinnimi as genre
                FROM Elokuva e, Lajityyppi l
                WHERE l.LajityyppiID = e.LajityyppiID
                ORDER BY e.Julkaisuvuosi
                '''
            if lajittelu == 2:
                sql = '''SELECT e.Nimi as nimi, e.Julkaisuvuosi as vuosi, e.Vuokrahinta as hinta, e.Arvio as arvio, l.Tyypinnimi as genre
                FROM Elokuva e, Lajityyppi l
                WHERE l.LajityyppiID = e.LajityyppiID
                ORDER BY e.Vuokrahinta
                '''
            if lajittelu == 3:
                sql = '''SELECT e.Nimi as nimi, e.Julkaisuvuosi as vuosi, e.Vuokrahinta as hinta, e.Arvio as arvio, l.Tyypinnimi as genre
                FROM Elokuva e, Lajityyppi l
                WHERE l.LajityyppiID = e.LajityyppiID
                ORDER BY e.Arvio
                '''
            if lajittelu == 4:
                sql = '''SELECT e.Nimi as nimi, e.Julkaisuvuosi as vuosi, e.Vuokrahinta as hinta, e.Arvio as arvio, l.Tyypinnimi as genre
                FROM Elokuva e, Lajityyppi l
                WHERE l.LajityyppiID = e.LajityyppiID
                ORDER BY l.Tyypinnimi
                '''
            cur.execute(sql)
            for e in cur:
                elokuvat.append({"nimi":e['nimi'], "vuosi":e['vuosi'], "hinta":e['hinta'], "arvio":e['arvio'], "genre":e['genre']})
            con.close()
        except Exception as e:
            logging.debug("en saanut elokuvatietoja")
            logging.debug(str(e))
    except Exception as e:
        logging.debug("Kanta ei aukea")
        logging.debug(str(e))
    return render_template('elokuvat.html',elokuvat=elokuvat)
# uloskirjautumissivu
@app.route('/logout')
def kirjaudu_ulos():
    session.pop('vuokraaja',None)
    return redirect(url_for('vuokraus'))

if __name__ == '__main__':
    app.debug = True
    app.run(debug=True)