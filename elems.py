# -*- coding: utf-8 -*-
"""
Created on Thu Jun 19 07:56:54 2014

@author: Mike Gleicher

Provides a thin wrapper around pySVG in order to make the various objects it creates
easier to manage.

basically, it adds size member variables (boxheight and boxwidth) to svg elements, allowing
them to be stacked, composed, ...
note that this is NOT the complete bounding box - just a bound on size

an element also can have a list of things that need to go into the defs section of the resulting
SVG. this needs to be percolated up to the top of the resulting SVG that uses the element.

when things are written out to a file, these definitions are gathered - but not recursively.
so when things are grouped (by elembox, for example, all the child defs need to be gathered)

originally, defs were a dict to avoid redundancy (based on name collisions). now, we
use lists and let the user worry about it

"""

# standard libraries
import types
import datetime

# other parts of my libraries
import svghelpers
from svghelpers import translateGroup
import pySVGwrap as SVG

# generally, I prefer not to pollute the namespace, but these are useful shorthand
from pySVGwrap import boxheight, boxwidth

### thin wrappers around py

### take a bunch of elements and set them left to right
def elemBox(*args, **kwargs):
    """
    takes a list of elements (either as a list, or as arguments) and sets them next to each other
    note: this is why we have elements (with the box width/height)
    if an element doesn't have an box width/height, we assume it's zero

    note: each element gets put in a group, even if it already is a group, so this might create an
    extra layer of nesting

    this uses **kwargs because we want to accept a variable number of regular
    arguments, and you cannot have keyword args after variable args

    we gather all the definitions and make a new dict with those

    :param args:
    :return: a group element
    """
    kwargs.setdefault("vert",False)
    kwargs.setdefault("spacer", 0)

    if kwargs["vert"]:
        kwargs.setdefault("horiz", False)

    kwargs.setdefault("horiz",True)
    kwargs.setdefault("pile",False)
    if kwargs["pile"]:
        kwargs["horiz"] = False
        kwargs["vert"] = False
        piling = True
    else:
        piling = False

    kwargs.setdefault("pad",0)
    kwargs.setdefault("padtop",0)

    # gather all the definitions from everything
    defs = []

    # the group everything goes into
    g = SVG.g()

    g.widthTrans  = kwargs["pad"]
    g.heightTrans = kwargs["pad"] + kwargs["padtop"]

    # add an element - done this way so we can look, recurse, ...
    def addElem(e):
        if hasattr(e,"defs"):
            for a in e.defs:
                defs.append(a)
        if isinstance(e,types.ListType):
            for a in e:
                addElem(a)
        elif isinstance(e,types.IntType):
            if kwargs["vert"]: g.heightTrans += e
            if kwargs["horiz"]: g.widthTrans += e
        else:
            ig = SVG.g()
            ig.addElement(e)
            translateGroup(ig,g.widthTrans,g.heightTrans)
            g.addElement(ig)
            ig.mbox = (g.widthTrans,g.heightTrans, boxwidth(e), boxheight(e))

            if g.boxheight < (boxheight(e) + g.heightTrans):
                g.boxheight = boxheight(e) + g.heightTrans
            if g.boxwidth < (boxwidth(e) + g.widthTrans):
                g.boxwidth = boxwidth(e) + g.widthTrans

            if kwargs["vert"]:
                g.heightTrans += boxheight(e) + kwargs["spacer"]
            if kwargs["horiz"]:
                g.widthTrans += boxwidth(e) + kwargs["spacer"]

    for a in args:
        addElem(a)

    # I don't know why this used to be "max(g.boxwidth, g.widthTrans)"
    g.boxwidth  = g.boxwidth   + kwargs["pad"]
    g.boxheight = g.boxheight  + kwargs["pad"]
    g.defs = defs

    return g

#############################################################################
### write out things to a file
### this used to be magical and specific, but now its simple
### in the future, the complexity will need to be brought back
###
### this tries to gather all the definitions to put in the beginning of the SVG
t1defaults = {
    "dir" : "SVG",
    "htmltitle" : "HTML Page",
    "objs" : [],
    "vert" : True,
    "doD3" : False,
    "date" : False
}

def nowString():
    tt = datetime.datetime.now().timetuple()
    return "%02d%02d%02d-%02d%02d" % (tt[0]%100,tt[1],tt[2],tt[3],tt[4])

def t1(*args,**kwargs):
    """
    write an elembox out to a file

    if the first argument is a string, it's taken to be the filename
    otherwise, everything is sent to elembox and then saved to a file

    this takes some keyword arguments (that we do in a silly way since its
    hard to mix keyword and non keyword arguments

    see the t1defaults to see what the parameters are
    """

    for i in t1defaults:
        kwargs.setdefault(i,t1defaults[i])

    fn = "t1.svg"
    if isinstance(args[0],types.StringType):
        fn = args[0]
        args = args[1:]

    dirName = kwargs["dir"]

    # get rid of .svg - and then re-add it
    if fn[-4:]==".svg" or fn[-4:]==".SVG":
        fn = fn[:-4]
    if kwargs["date"]:
        fn += "-" + nowString()
    fn += ".svg"

    s = SVG.svg()
    sdefs = SVG.defs()

    ti = SVG.Title()
    ti.appendTextContent(svghelpers.safeText(kwargs["htmltitle"],50))

    # note we make 1 elembox first - that gathers all the defs
    elem = elemBox(*args, **kwargs)

    # now put all the defs in the SVG first
    for i in kwargs["objs"]:
        sdefs.addElement(i)
    for k in elem.defs:
        sdefs.addElement(k)
    s.addElement(sdefs)

    # now actually put the element in (after the defs)
    s.addElement(elem)

    # we have the SVG ready to go - now just set its properties
    if hasattr(elem,"boxheight"):
        s.set_height(elem.boxheight)
    if hasattr(elem,"boxwidth"):
        s.set_width(elem.boxwidth)

    if kwargs["doD3"]:
        sc = SVG.BaseElement("script")
        sc.setAttribute("type","text/ecmascript")
        d3 = kwargs["localD3"] if kwargs["localD3"] else "http://d3js.org/d3.v3.min.js"
        sc.setAttribute("xlink:href",d3)
        s.addElement(sc)

        #sd = structure.BaseElement("script")
        #sd.setAttribute("type","text/ecmascript")
        #s.addElement(sd)

        sd = SVG.BaseElement("script")
        sd.setAttribute("type","text/ecmascript")
        if kwargs["noembed"]:
            sd.setAttribute("xlink:href","../DataToys/Vis/JS/mouseover-highlights.js")
        else:
            with open("DataToys/Vis/JS/mouseover-highlights.js") as codefile:
                code = codefile.read()
                code = " <![CDATA[\n" + code + "\n]]>\n"
                sd.appendTextContent(code)
        s.addElement(sd)

        se = SVG.BaseElement("script")
        se.setAttribute("type","text/ecmascript")
        se.appendTextContent("""
            <![CDATA[
                addMouseovers("abox");      // no longer on rectelem
            ]]>
        """)
        s.addElement(se)

    s.save(kwargs["dir"]+"/"+fn, encoding="utf-8")
    print "Wrote file ",fn

###################################################################
## rotate an elem box by 90 degrees, counter clockwise and shift downward
## so that top corner is the same
def rotVert(box):
    box.set_transform("translate(0 %d) rotate(-90,0,0)" % box.boxwidth)
    return box