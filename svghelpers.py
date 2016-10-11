# -*- coding: utf-8 -*-
"""
Created on Thu Jun 19 07:56:54 2014

@author: Mike Gleicher

various utility functions useful in creating SVG and HTML code

might be broken up some day, but for now it includes:
- string handling (to make safe strings)
- transforms

note that this does not include the wrappers, since they use this file
"""

from xml.sax.saxutils import escape

import pysvg
import pysvg.builders
from pysvg import structure

# given a string, make sure its OK for SVG
#Sources:
#http://wiki.python.org/moin/EscapingHtml
#http://stackoverflow.com/a/2657467
def webify(the_str):
    """
    :param the_str: a string that needs to be made web safe
    :return: safe version of the string
    """
    str = "".join([c for c in escape(the_str) if c<chr(128)])
    return str.encode('ascii', 'xmlcharrefreplace')

def safeText(str, maxlen=40):
    """
    :param str: string to be turned into a title
    :return: a websafe string of bounded length
    """
    return webify(str[:maxlen])

def addTitle(svgObject,str):
    """
    adds a title (a popop tooltip) to an SVG object
    note: this works by wrapping the object inside of another element
    (which is required since only anchors reliably can have tooltips)
    :param svgObject:
    :param str:
    :return:
    """
    co = structure.BaseElement("a")
    # i think that the XML writer does the right thing, so we don't need to webify
    # otherwise, > -> &amp;gt;
    co.setAttribute("xlink:title",str) # webify(str))
    co.addElement(svgObject)
    if hasattr(svgObject,'boxheight'):
        co.boxheight = svgObject.boxheight
    if hasattr(svgObject,'boxwidth'):
        co.boxwidth = svgObject.boxwidth
    if hasattr(svgObject,'defs'):
        co.defs = svgObject.defs
    return co

##################################################################
### transformations

def translateGroup(g,x,y):
    """
    SETS the transformation of a group to be a given translation
    does not do composition

    :param g: the group to have its transform set
    :param x: translation
    :param y:
    :return: g
    """
    tb = pysvg.builders.TransformBuilder()
    tb.transform_dict["translate"] = 'translate(%g %g)' % (x,y)
    g.set_transform(tb.getTransform())
    return g
def rotTranslateGroup(g,a,x,y):
    """
    SETS the transformation of a group to be a given translation
    does not do composition

    :param g: the group to have its transform set
    :param x: translation
    :param y:
    :return: g
    """
    tb = pysvg.builders.TransformBuilder()
    tb.transform_dict["translate"] = 'translate(%g %g)' % (x,y)
    g.set_transform(tb.getTransform())
    return g

#################################################################
### make a path string
def makeLinePath(points):
    """
    given a list of points, return a path string
    :param points:
    :return: string for a path
    """
    str = ""
    for i,p in enumerate(points):
        str += "%s %f,%f " % ("L" if i else "M", p[0],p[1])
    return str
    
def makeBezierPath(points):
    str = "M%f,%f " % (points[0][0],points[0][1])
    pl = points[1:]
    while len(pl):        
        if len(pl) >= 3:
            str += "C%f,%f,%f,%f,%f,%f " % (pl[0][0],pl[0][1],pl[1][0],pl[1][1],pl[2][0],pl[2][1])
            pl = pl[3:]
        elif len(pl) >= 2:
            str += "Q%f,%f,%f,%f " % (pl[0][0],pl[0][1],pl[1][0],pl[1][1])
            pl = pl[2:]
        else:
            str += "L%f,%f " % (pl[0][0],pl[0][1])
            pl = pl[1:]
    return str
            
def makePointList(points):
    """
    polyline and polygone want a string in a weird way
    :param points:
    :return:
    """
    str = ""
    for p in points:
        str += "%g,%g " % (p[0],p[1])
    return str