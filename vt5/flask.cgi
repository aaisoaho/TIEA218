#!/usr/bin/python
# -*- coding: utf-8 -*-

from wsgiref.handlers import CGIHandler
from vuokraamo import app as application

if __name__ == '__main__':
   CGIHandler().run(application)