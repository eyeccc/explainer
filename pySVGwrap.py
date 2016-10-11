# -*- coding: utf-8 -*-
"""
Created on Thu Jun 19 07:56:54 2014

@author: Mike Gleicher

Provides a thin wrapper around pySVG in order to make the various objects it creates
easier to manage.

basically, it adds size member variables (boxheight and boxwidth) to svg elements, allowing
them to be stacked, composed, ...
note that this is NOT the complete bounding box - just a bound on size

this file is JUST the calls from pySVG, so that you can import this
and someday, maybe we'll replace it so it doesn't need pySVG

for this reason, its best to route all calls to pysvg through here - just to keep track of what
we're using

another issue:
browsers are much better at SVG than illustrator/inkscape - especially for text
so we have some "global" variables to switch to simpler modes that are more likely
to work
"""

# the pysvg pieces that we need
import pysvg
from pysvg import structure
from pysvg import shape
import pysvg.text
import pysvg.builders
import pysvg.gradient

# we include this
import svghelpers

# switches for browser
browserMode = False

### generally, this is just the SVG calls - but these are useful for making those calls
def boxheight(e):
    """
    access box height - but return 0 if it doesn't have it
    :param e:
    :return:
    """
    try:
        return e.boxheight
    except:
        return 0
def boxwidth(e):
    """
    access box height - but return 0 if it doesn't have it
    :param e:
    :return:
    """
    try:
        return e.boxwidth
    except:
        return 0

## apply pySVG parameters to box measurements
def applyBox(e, x,y,w,h):
    def nint(i):
        try:
            return int(i)
        except:
            return 0
    e.boxwidth = nint(x) + nint(w)
    e.boxheight = nint(y) + nint(h)

def ex0(fun):
    def wrapper(*arg, **kwargs):
        try:
            return float(fun(*arg,**kwargs))
        except:
            return 0
    return wrapper

## a better way, use a decorator - note that this requires the object to have the methods for getting
## the sizes (which G doesn't, but most shapes to)
## this is designed to be a decorator
def wrapBox(func):
    def wrapper(*arg,**karg):
        @ex0
        def x(e):
            return float(e.get_x())
        @ex0
        def y(e):
            return float(e.get_y())
        @ex0
        def height(e):
            return float(e.get_height())
        @ex0
        def width(e):
            return float(e.get_width())
        ret = func(*arg,**karg)
        ret.boxwidth = x(ret) + width(ret)
        ret.boxheight = y(ret) + height(ret)
        return ret
    return wrapper

# a decorator for functions that just need to get a null box
def nullBox(func):
    def wrapper(*arg, **karg):
        ret = func(*arg,**karg)
        ret.boxwidth = 0
        ret.boxheight = 0
        return ret
    return wrapper

###############################################################################
### the actual functions that we wrap
###
### structure
def g():
    """
    creates a new G element
    :return: a G element
    """
    g = structure.G()
    g.boxheight = 0
    g.boxwidth = 0
    g.defs = []
    return g

def defs():
    return pysvg.structure.Defs()

@wrapBox
def svg(x=None, y=None, width=None, height=None, **kwargs):
    """
    creates the outer-layer SVG element
    :return:
    """
    s = structure.Svg(x,y,width,height, **kwargs)
    return s

from pysvg.structure import Title
from pysvg.structure import BaseElement


### shapes
Rect = wrapBox(pysvg.shape.Rect)
Line = wrapBox(pysvg.shape.Line)
Path = nullBox(pysvg.shape.Path)
Polygon = nullBox(pysvg.shape.Polygon)
Polyline = nullBox(pysvg.shape.Polyline)

def Circle(cx,cy,r,**kw):
    c = pysvg.shape.Circle(cx,cy,r,**kw)
    c.boxwidth = cx+r
    c.boxheight = cy+r
    return c


### make some text
def text(str,x0,y0,bwidth=0,bheight=0,fontsize=10,fontfamily="Arial",textanchor="start",
         rotate = 0,
         baseline=None,
         fill=None):
    style = ""
    style += "font-size:%d;"   % fontsize
    style += "font-family:%s;" % fontfamily
    style += "text-anchor:%s;" % textanchor
    if fill is not None:
        style += "fill:%s;" % fill

    y0i = y0 # in case we hack the baseline, we need to use the original for rotation
    if baseline != None:
        if browserMode:
            style += "dominant-baseline:%s;" % baseline
        else:
            # beware! total hack to fake baselines
            if baseline == "middle" or baseline=="central":
                y0 += fontsize/2
            elif baseline == "text-before-edge":
                y0 += fontsize
            else:
                print "Unknown baseline to SVG.text! (%s)" % baseline
    te = pysvg.text.Text(svghelpers.safeText(str,maxlen=200),x0,y0)
    if rotate != 0:
        te.set_transform("rotate(%g %g %g)" % (rotate,x0,y0i))
    te.set_style(style)
    te.boxheight = max(y0,bheight)
    te.boxwidth  = max(x0,bwidth)
    return te

def textf(str,x0,y0,bwidth=0,bheight=0,style="font-size:10; font-family:Arial; fill=black"):
    te = pysvg.text.Text(svghelpers.safeText(str,maxlen=200),x0,y0)
    te.set_style(style)
    te.boxheight = max(y0,bheight)
    te.boxwidth  = max(x0,bwidth)
    return te


###
###
### create gradients
### we'll keep track of how many we create so we can make unique ids
gradientCount = 0
def gradient(*args,**kwargs):
    global gradientCount
    gradientCount += 1
    a = pysvg.gradient.LinearGradient(*args,**kwargs)
    if a.get_id() == None:
        a.set_id("grad%d" % gradientCount)
    return a

def stop(*args,**kwargs):
    a = pysvg.gradient.Stop(*args,**kwargs)
    return a


### Clipping Paths
###
clippathCount = 0
def clippath(*args,**kwargs):
    """
    creates a clip path object - kindof like a group
    be sure to add it to your defs!
    :param args:
    :param kwargs:
    :return:
    """
    global clippathCount
    clippathCount += 1
    a = structure.ClipPath(*args,**kwargs)
    if a.get_id() == None:
        a.set_id("clippath%d" % clippathCount)
    return a

def setClipRectangle(object, x,y,w,h):
    """
    An easy way to do the most common clipping operation
    :param object:
    :param x: for the clip rectangle
    :param y:
    :param w: remember, rectangles are x,y,w,h!
    :param h:
    :return: nothing: the clip is added to the object
    """
    c = clippath()
    c.addElement(Rect(x,y,w,h))
    object.defs.append(c)
    object.set_clip_path("url(#%s)"%c.get_id())
    return object