#!/usr/bin/python
# -*- coding: utf-8 -*-

import cgitb
cgitb.enable()
import cgi

# das kommentti
print """Content-type: text/html; charset=UTF-8
""" 

import os
from jinja2 import Template, Environment, FileSystemLoader

tmpl_path = os.path.join(os.path.dirname(os.environ['SCRIPT_FILENAME']), 'templates')

try:
    env = Environment(autoescape=True, loader=FileSystemLoader(tmpl_path), extensions=['jinja2.ext.autoescape'])
except:
    env = Environment(autoescape=True, loader=FileSystemLoader(tmpl_path))
template = env.get_template('jinja.html')

form = cgi.FieldStorage()

teksti = form.getfirst("teksti", "").decode("UTF-8")

def int_or_8(var):
   try:
         return int(var)
   except Exception:
      return 8

koko = int_or_8(form.getfirst("x", ""))

if koko<8 or koko>16:
   koko = 8

print template.render(usertext=teksti, koko=koko).encode("UTF-8")
