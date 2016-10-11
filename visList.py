# -*- coding: utf-8 -*-
"""
Created on Mon Feb 04 21:01:51 2013

direct generation of SVG pictures of ranked points
this is a simplification and generalization of the old texty

@author: gleicher
"""

from pysvg import structure
from pysvg import shape
from pysvg import text
from pysvg import builders
from pysvg import gradient

import types

import numpy as N
from xml.sax.saxutils import escape

from .. import axis
from MikesToys import cbrewer

# annoying, at some point pySVG changed to uppercase?
structure.g = structure.G
shape.rect = shape.Rect
structure.title = structure.Title
text.text = text.Text
shape.path = shape.Path
shape.line = shape.Line
structure.svg = structure.Svg

allArgs = [
    # rectedText
    "roundness", "bordsp", "fontsize", "fontfamily", "textwidth", "fillcolor", "strokecolor",
    "strokewidth", "addTitle", "noText", "headroom",
    # note that you cannot specify url - it is set by rectedTextCol
    "urlprefix","urlsuffix",    # most likely 1 per column, so set by classpicture
    # rectedTextCol
    "shuffle", "vertSpacing", "horizSpacing", "fillcolors", "strokecolors", "perRow",
    "urls",
    # dataTextCol
    "fillcolors", "strokecolors",
    # parallels
    "width", "bezflat", "linecolors",
    # dataParallel
    "linecolors", "scaleBorder", "rang", "splay",
    # boxplot
    "height", "boxplot_width", "scaleBorder", "boxplot_stroke_color", "boxplot_fill_color",
    # boxplot set
    "boxplot_width", "spacing", "doAll", "boxfills", "boxstrokes", "boxplot_labels",
    # histogram
    "histogram_width", "bins","scaleBorder", "selectors", "histogram_colors",
    # class picture
    "nameText","baselinesep","doHistogram","histSelectors","histColors","doHist"
    # used in T1
    "htmltitle"
    ]

## helpers
def paramToLambda(param,default):
    """allow a function to take: a string (or int), a list, or a closure
        converts everything to a closure
    """
    if isinstance(param,types.StringType):
        return lambda x: param
    elif isinstance(param,types.ListType):
        return lambda x: param[x]
    elif isinstance(param,types.LambdaType):
        return param
    elif type(param) == type(default):
        return param
    else:
        return lambda x: default

def translateGroup(g,x,y):
    tb = builders.TransformBuilder()
    tb.transform_dict["translate"] = 'translate(%g %g)' % (x,y)
    g.set_transform(tb.getTransform())
    
def makeLinearScale(min,max,top,bottom):
    if max-min>0:
        return lambda y: (float(y-min) / float(max-min))*float(bottom-top) + top
    else:
        print "WARNING: zero linear scale to draw!"
        return lambda y: (min+max)/2
# given a string, make sure its OK for SVG
#Sources:
#http://wiki.python.org/moin/EscapingHtml
#http://stackoverflow.com/a/2657467
def webify(the_str):
    str = "".join([c for c in escape(the_str) if c<chr(128)])
    return str.encode('ascii', 'xmlcharrefreplace')


def safeTitle(str):
    return webify(str[:50])
def safeText(str):
    return webify(str[:40])

# replace "get_class" with "_attributes.get('class')" since get_class isn't defined on base elem
def addClass(elem,str):
    if elem._attributes.get('class'):
        ncl = elem._attributes.get('class')
    else:
        ncl = ""
    if isinstance(str,types.StringType):
        ncl += " "+str
    elif isinstance(str,types.ListType):
        for s in str:
            ncl += " " + s
    elem._attributes['class'] = ncl

## build up some of the elements that we might care about
def rectedText(content,
               roundness = 5, bordsp = 2, 
               fontsize = 10,
               fontfamily = "Arial",
               textwidth = 120,
               fillcolor = "#FFFFFF",
               strokecolor = "#000000",
               strokewidth = 1,
               addTitle = False,
               noText = False,
               classes = [],
               headroom = 0,
               url = "",
               urlprefix = "",
               urlsuffix = "",
               **kwargs):   
    """generates an SVG element with text in a box
        places it at the origin

        if notext is an integer, it overrides fontsize and textwidth

        returns the SVG element (a group) and the height
        if there is either an url or a title to add, then the G contains an A
    """
    if noText>0:
        fontsize = noText
        textwidth = noText
    boxheight = fontsize  + 2*roundness + 2*bordsp + headroom
    boxwidth =  textwidth + 2*roundness + 2*bordsp
    
    # text position in local coordinates
    x0 = roundness+bordsp
    y0 = roundness+bordsp+fontsize+headroom

    # create the objects
    g = structure.g()

    # always put the outer "A" element - even if there is not title or url
    outer =  structure.BaseElement("a")
    g.addElement(outer)
    addClass(outer,"abox")

    re = shape.rect(0,0,boxwidth,boxheight,roundness,roundness)
    outer.addElement(re)

    re.set_fill(fillcolor)
    if strokewidth>0:
        re.set_stroke(strokecolor)
        re.set_stroke_width(strokewidth)

    if addTitle != False:
        # ti = structure.title()
        if isinstance(addTitle,types.StringType):
            outer.setAttribute("xlink:title",safeTitle(addTitle))
            #ti.appendTextContent(safeTitle(addTitle))
        else:
            outer.setAttribute("xlink:title",safeTitle(content))
            #ti.appendTextContent(safeTitle(content))
        # g.addElement(ti)

    if url != "":
        outer.setAttribute("xlink:href",urlprefix+url+urlsuffix)

    addClass(re,"rectelem")
    addClass(re,classes)
    addClass(outer,classes)

    if fontsize>0 and noText==False:
        t = text.text(safeText(content), x=x0, y=y0)
        sb = builders.StyleBuilder()
        sb.setFontSize(fontsize)
        sb.setFontFamily(fontfamily)
        t.set_style(sb.getStyle())
        outer.addElement(t)

    # stick info into the group
    g.boxwidth  = boxwidth
    g.boxheight = boxheight
    return g
    
def rectedTextCol(strings, urls=False,
                  shuffle = None,
                  vertSpacing = 0, horizSpacing = 0,
                  fillcolors = None, strokecolors = None,
                  perRow =1,
                  **kwargs):
    """
    draws a stack of rected text, placed at the origin

    re-written so that you can have multiple per row
    """
    if shuffle is None:
        shuffle = [i for i in range(len(strings))]

    g = structure.g()
    # keep track of the bounding box    
    bottom = 0
    right = 0
    boxList = []

    # handle the different ways we might pass the stroke colors
    scc = paramToLambda(strokecolors,"black")
    fcc = paramToLambda(fillcolors,"white")
        

    for rowst in range(0,len(strings),perRow):
        # create 1 row
        rg = structure.g()
        rowBottom = 0
        rowRight = 0
        for indx in range(rowst,min(len(strings),rowst+perRow)):
            ist = shuffle[indx]
            fc = fcc(ist)
            sc = scc(ist)
            rt = rectedText(strings[ist], url=urls[ist] if urls!=False else "", fillcolor=fc, strokecolor=sc, classes = ["item%04d" % ist], **kwargs)
            # put space between elements - only in the middle
            if ist != rowst:
                rowRight += horizSpacing
            translateGroup(rt,rowRight,0)
            rg.addElement(rt)
            if rt.boxheight > rowBottom:
                rowBottom = rt.boxheight
            rowRight += rt.boxwidth
        rg.boxwidth = rowRight
        rg.boxheight = rowBottom

        # put this group where it should go
        if rowst >0:
            bottom += vertSpacing
        translateGroup(rg,0,bottom)
        # note: the boxlist gets the entire row!
        # so we couldn't do this until we finished the row
        for ist in range(rowst,min(len(strings),rowst+perRow)):
            boxList.append( (0,bottom,rg.boxwidth,bottom+rg.boxheight,ist-rowst) )

        bottom += rg.boxheight
        if rg.boxwidth>right:
            right = rg.boxwidth
        
        g.addElement(rg)
        
    g.boxwidth = right
    g.boxheight = bottom
    g.boxlist = boxList        
        
    return g


def dataParamToLambda(param,data,idx,default):
    """like paramToLambda, note that we don't do the shuffle!"""
    if isinstance(param,types.LambdaType):
        return [param(data,i) for i in range(len(idx))]
    else: # list, string, or none
        return  param
    
def dataTextCol(data, vector, fillcolors=None, strokecolors=None, **kwargs):
    """given a data set, and a vector (one value per data row), draw a text stack"""
    names = data.textCol(data.keyCol)
    idx = N.argsort(vector)
    
    # deal with the ways colors may be passed
    # note - this builds things shuffled!
    cols = dataParamToLambda(fillcolors,data,idx,"white")
    scols = dataParamToLambda(strokecolors,data,idx,"black")
        
    # we need to shuffle appropriately
    return rectedTextCol(names, shuffle=idx, fillcolors=cols, strokecolors=scols, **kwargs)

def parallels(leftColVec, rightColVec, idx, width=100, bezflat=.5, linecolors=None, **kwargs):
    """this creates the parallel lines between boxes and a scale
        (or between two parallel axes)
    """
    scc = paramToLambda(linecolors, "black")    
    
    g = structure.g()
    for i in range(len(leftColVec)):
        ly = int(leftColVec[i])
        ry = int(rightColVec[i])
        bf = int(bezflat*width)
        # e = shape.line(0,leftColVec[i],width,rightColVec[i])
        e = shape.path(pathData="M %d %d C %d %d %d %d %d %d" % 
                       (0,ly, bf,ly,  width-bf,ry,   width,ry)
                       )
        addClass(e,"item%04d" % idx[i])
        e.set_stroke(scc(i))
        e.set_fill("none")
        g.addElement(e)
        
    g.boxwidth = width
    g.boxheight = max(N.max(leftColVec),N.max(rightColVec))
    return g

def dataParallel(data, textcol, vec, linecolors=None, scaleBorder=5, rang=False,
                 splay = False, splayDist = 2, splayOffset = -5,
                 **kwargs):
    """
    draw the lines between a list of boxes and an axis
    :param data:
    :param textcol:
    :param vec:
    :param linecolors:
    :param scaleBorder:
    :param rang:
    :param splay: should we do splaying?
    :param splayDist:
    :param splayOffset:
    :param kwargs:
    :return:
    """
    idx = N.argsort(vec)
    rmi = min(rang) if rang != False else min(vec)
    rma = max(rang) if rang != False else max(vec)
    
    ls = makeLinearScale(rmi,rma,scaleBorder,textcol.boxheight-scaleBorder)
        
    y1 = [((b[1]+b[3])/2)+ ((b[4]*2 + splayOffset) if splay else 0) for b in textcol.boxlist ]
    y2 = [ls(vec[i]) for i in idx]
    
    # deal with the ways colors may be passed
    # note - this builds things shuffled!
    if isinstance(linecolors,types.LambdaType):
        cols = [linecolors(data,i) for i in idx]
    elif isinstance(linecolors,types.ListType):
        cols = [linecolors[i] for i in idx]
    else: # list, string, or none
        cols = linecolors

    return parallels(y1,y2,idx=idx,linecolors=cols,**kwargs)
    
    
## Draw a BoxPlot
def boxplot(vector,height,boxplot_width=20,scaleBorder=5,rang=False,boxplot_stroke_color="black",
            boxplot_fill_color="#EEEEEE",
            boxplot_label="BoxPlot", boxplot_fontsize = 10, boxplot_fontfamily="Arial",
            **kwargs):
    """draw a boxplot. if you don't give the range, it computes it"""
    vs = N.sort(vector)
    mi = vs[0]
    ma = vs[-1]
    rmi = min(rang) if rang != False else mi
    rma = max(rang) if rang != False else ma
    n = len(vector)
    med = vs[n/2]
    q1 = vs[n/4]
    q2 = vs[3*n/4]
    ls = makeLinearScale(rmi,rma,scaleBorder,height-scaleBorder)

    s = structure.g()
    center = boxplot_width/2
    def sline(x1,y1,x2,y2):
        l = shape.line(x1,y1,x2,y2)
        l.set_stroke(boxplot_stroke_color)
        l.set_stroke_width(1)
        return l
    s.addElement(sline(center-5,ls(mi),center+5,ls(mi)))
    s.addElement(sline(center-5,ls(ma),center+5,ls(ma)))
    s.addElement(sline(center,ls(mi),center,ls(ma)))
    r = shape.rect(0,ls(q1),boxplot_width,ls(q2)-ls(q1))
    r.set_fill(boxplot_fill_color)
    r.set_stroke(boxplot_stroke_color)
    r.set_stroke_width(1)
    s.addElement(r)
    s.addElement(sline(0,ls(med),boxplot_width,ls(med)))

    #add the text
    if boxplot_label:
        t = text.text(safeText(boxplot_label), x=0, y=0)
        sb = builders.StyleBuilder()
        sb.setFontSize(boxplot_fontsize)
        sb.setFontFamily(boxplot_fontfamily)
        t.set_style(sb.getStyle())

        tb = builders.TransformBuilder()
        tb.setRotation(-90)
        tb.transform_dict["translate"] = 'translate(%g %g)' % (center-1,ls(ma)-1)
        #tb.setTranslation(center+4,ls(ma))
        t.set_transform(tb.getTransform())

        s.addElement(t)


    return s      
    
## draw a set of boxplots
def boxplotset(vector, selectors, height, boxplot_width=20, spacing=5, doAll=True, rang=False,
               boxfills = None, boxstrokes=None,
               boxplot_labels = None,
               **kwargs):
    """
    draw a set - give it either a binary vector or a predicate
    :param boxplot_labels: label for each boxplot - DO NOT INCLUDE ALL!
    :param vector:
    :param selectors:
    :param height:
    :param boxplot_width:
    :param spacing:
    :param doAll: create a boxplot for the list of "all" data elements
    :param rang:
    :param boxfills: note: do NOT include "all" - just do it for the selectors
    :param boxstrokes: note: do NOT include "all" - just do it for the selectors
    :param kwargs:
    :return: an svg group element (that is a box)
    """
    if rang==False:
        rang = (min(vector),max(vector))
        
    x = 0
    s = structure.g()
    
    if doAll:
        s.addElement(boxplot(vector,height, boxplot_width=boxplot_width,rang=rang,
                             boxplot_label = None if boxplot_labels==None else "All",
                             **kwargs))

        x += boxplot_width + spacing
        
    for si,se in enumerate(selectors):
        if isinstance(se,types.ListType):
            sv = N.array(se,dtype=bool)
        elif isinstance(se,types.LambdaType):
            sv = N.array([se(i) for i in range(len(vector))])
        else:
            raise TypeError("Don't know how to use %s as selector" % str(type(se)))
        sv_ = vector[sv]
        if len(sv_)>3:
            label = None
            try:
                label = boxplot_labels[si]
            except:
                pass
            bp = boxplot(sv_,height, boxplot_width=boxplot_width,rang=rang,
                         boxplot_fill_color = boxfills[si] if boxfills!=None else "#EEEEEE",
                         boxplot_stroke_color = boxstrokes[si] if boxstrokes!=None else "black",
                         boxplot_label = label,
                         **kwargs)
            translateGroup(bp,x,0)
            s.addElement(bp)
            x += boxplot_width + spacing
        
    s.boxheight = height
    s.boxwidth = x+boxplot_width
    return s

titlefontsize = 14
titlefontfamily = "Arial"

## draw a histogram
def histogram(vector, height, histogram_width, bins=20,scaleBorder=5, selectors=[], histogram_colors=[], **kwargs):
    counts,edges = N.histogram(vector,bins)
    mc = max(counts)
    ls = makeLinearScale(edges[0],edges[-1],scaleBorder,height-scaleBorder)

    if len(selectors)==0:
        selectors = [ [True for i in range(len(vector))] ]

    hists = []
    for se in selectors:
        if isinstance(se,types.ListType):
            sv = N.array(se,dtype=bool)
        elif isinstance(se,types.LambdaType):
            sv = N.array([bool(se(i)) for i in range(len(vector))])
        else:
            raise TypeError("Don't know how to use %s as selector" % str(type(se)))
        selVec = vector[sv]
        hists.append(N.histogram(selVec,bins,range=(edges[0],edges[-1]))[0])

    totsel = sum([sum(h) for h in hists])
    assert totsel <= sum(counts)

    def xv(v):
        return float(v) * float(histogram_width) / float(mc)

    s=structure.g()
    # left edge (axis)
    le = shape.Line(0,scaleBorder,0,height-scaleBorder)
    le.set_stroke("black")
    le.set_stroke_width(1)
    s.addElement(le)
    for i in range(bins):
        rightEdge = 0
        bar = structure.g()
        # draw a gray box just in case the others don't add up
        re = shape.rect(rightEdge,0,xv(counts[i]),ls(edges[i+1])-ls(edges[i]))
        re.set_fill("#F0F0F0")
        re.set_stroke("black")
        bar.addElement(re)
        for j,se in enumerate(selectors):
            bw = xv(hists[j][i])
            re = shape.rect(rightEdge,0,bw,ls(edges[i+1])-ls(edges[i]))
            rightEdge += bw
            re.set_fill(histogram_colors[j] if j<len(histogram_colors) else "#F0F0F0")
            re.set_stroke("black")
            bar.addElement(re)
        translateGroup(bar,0,ls(edges[i]))
        s.addElement(bar)
    s.boxheight = height
    s.boxwidth = histogram_width
    return s

### draw the set of things for a classifier
def classPicture(data,vecOrAxis,fun,nameText=[],baselinesep=2,
                 boxSelectors="fun",                    # fun means generate from function
                 histSelectors="fun",histColors=[],     # fun means use boxselectors
                 doHist = True, doBoxPlot=True,
                 listVars = True,
                 fillcolors=None,
                 flip = False,
                 stopAfter = 200,
                 rightPad = 0,
                 **kwargs):
    """
    draw a picture of the classifier results
    vec: is the classifier output (or the classifier)
    fun: is the predicate
    """
    for k in kwargs:
        if k not in allArgs:
            print "WARNING: bad keyword (%s) to classPicture" % k

    if hasattr(vecOrAxis,"vals"):
        vec = vecOrAxis.vals(data)
    else:
        vec = vecOrAxis

    if len(vec) != data.rows():
        print "Problem in class picture - vector is not the number of rows! (%d != %d)" % (len(vec),data.rows())
        if len(vec) == len(data.dataColNames):
            try:
                vec = axis.applyAxis(vec,data)
            except:
                raise TypeError("Bad Axis to Class Picture")

    if flip:
        vec = vec * -1


    if isinstance(fun,types.LambdaType):
        fv = [fun(data,i) for i in range(data.rows())]
    else:
        fv = fun

    st = N.unique(fv)
    fl = [ [i==j for i in fv] for j in st]

    if fillcolors==None:
        fillcolors = ["#D0D0E0" if fv[i]==1 else ("#E0F0E0" if fv[i]==-1 else "white") for i in range(len(vec))]

    s = structure.g()
    rc = dataTextCol(data,vec, fillcolors=fillcolors, **kwargs)
    s.addElement(rc)
    right = rc.boxwidth

    pl = dataParallel(data,rc,vec,**kwargs)
    translateGroup(pl,right,0)
    s.addElement(pl)
    right += pl.boxwidth

    if doHist:
        if histSelectors=="fun" or histSelectors=="class":
            histSelectors = fl
        # we used to auto color if we were doing a histogram based on FL - now we decide it's a bad idea
        # ["#E0F0E0","#D0D0E0"] ["#E0F0E0","white","#D0D0E0"]
        hg = histogram(vec,height=rc.boxheight, histogram_width=100,selectors=histSelectors, histogram_colors=histColors, **kwargs)
        translateGroup(hg,right,0)
        right += hg.boxwidth + 10
        s.addElement(hg)

    if doBoxPlot:
        if boxSelectors=="fun":
            boxSelectors = fl
        bp = boxplotset(vec, boxSelectors, rc.boxheight, **kwargs)
        translateGroup(bp,right,0)
        right += bp.boxwidth
        s.addElement(bp)

    s.boxheight = rc.boxheight
    s.boxwidth = right + rightPad

    addNameText(s,data,nameText=nameText,listVars=listVars,vecOrAxis=vecOrAxis, stopAfter=stopAfter)

    return s

def addNameText(svgObj,data,vecOrAxis,nameText=False,baselinesep=2,listVars=True):
    """
    This adds the name of a classifier to the bottom of a classifier picture
    if there is no name, it is made up from the accuracy

    :param svgObj:
    :param data:
    :param vecOrAxis:
    :param nameText:
    :param baselinesep:
    :param listVars:
    :return:
    """
    if nameText==False:
        nameText = "nth:%5.3g mcc:%5.2g" % (vecOrAxis.nth(),vecOrAxis.mcc())
    if nameText:
        if not(isinstance(nameText,types.ListType)):
            nameText = [nameText]
        # carefull... we are about to tweak the list!
    nameText = [c for c in nameText]
    if listVars and hasattr(vecOrAxis,"ax"):
        vl = axis.nonZeroCols(vecOrAxis.ax)
        for v in vl:
            nameText.append("%s:%g" % (data.dataColNames[v],N.round(axis.getAxis(vecOrAxis)[v],2)))

    if nameText != False:
        for nt in nameText:
            t = text.text(nt, x=svgObj.boxwidth/2, y=svgObj.boxheight + titlefontsize)
            sb = builders.StyleBuilder()
            sb.setFontSize(titlefontsize)
            sb.setFontFamily(titlefontfamily)
            sb.setTextAnchor("middle")
            t.set_style(sb.getStyle())
            svgObj.addElement(t)
            svgObj.boxheight += titlefontsize + baselinesep

### take a bunch of elements and set them left to right
def elemBox(*args):
    g = structure.g()
    g.boxheight = 0
    g.boxwidth = 0
    
    def addElem(e):
        ig = structure.g()
        ig.addElement(e)
        translateGroup(ig,g.boxwidth,0)
        g.addElement(ig)
        if hasattr(e,"boxwidth"):
            g.boxwidth += e.boxwidth
        if hasattr(e,"boxheight"):
            if g.boxheight < e.boxheight:
                g.boxheight = e.boxheight
    
    for a in args:
        if isinstance(a,types.ListType):
            for aa in a:
                addElem(aa)
        else:
            addElem(a)

    return g

def velemBox(*args):
    g = structure.g()
    g.boxheight = 0
    g.boxwidth = 0

    def addElem(e):
        ig = structure.g()
        ig.addElement(e)
        translateGroup(ig,0,g.boxheight)
        g.addElement(ig)
        if hasattr(e,"boxheight"):
            g.boxheight += e.boxheight
        if hasattr(e,"boxwidth"):
            if g.boxwidth < e.boxwidth:
                g.boxwidth = e.boxwidth

    for a in args:
        if isinstance(a,types.ListType):
            for aa in a:
                addElem(aa)
        else:
            addElem(a)

    return g


def parCoords(vecs, colors="#888", width=600,height=600, sides=10, makeLast=[], highlight=[],
              nameText=False,baselinesep=2, fontsize=titlefontsize,
              topMarg=10,bottomMarg=10):
    s = structure.G()
    s.boxwidth = width
    s.boxheight = height

    n = len(vecs)
    m = len(vecs[0])

    if isinstance(colors,types.StringType):
        colors = [colors for i in range(m)]

    top = topMarg
    bottom = height-bottomMarg

    xp = [ sides + (width-2.0*sides) * float(i) / float(n-1) for i in range(n) ]

    for i in range(n):
        ln = shape.Line(xp[i],top,xp[i],bottom)
        ln.set_stroke_width(2)
        ln.set_stroke("black")
        s.addElement(ln)

    transforms = [makeLinearScale(min(v),max(v),top,bottom) for v in vecs]

    for i in range(m):
        str = ""
        for j in range(n):
            str += "%g,%g  " % (xp[j], transforms[j](vecs[j][i]))
        ln = shape.Polyline(points=str,stroke=colors[i],fill="none")
        ln.set_stroke_width(2 if i in highlight else 1)
        s.addElement(ln)
    for i in makeLast:
        str = ""
        for j in range(n):
            str += "%g,%g  " % (xp[j], transforms[j](vecs[j][i]))
        ln = shape.Polyline(points=str,stroke=colors[i],fill="none")
        ln.set_stroke_width(2 if i in highlight else 1)
        s.addElement(ln)

    if nameText != False:
        for i,nt in enumerate(nameText):
            newheight=height
            for tr in nt:
                t = text.text(tr, x=xp[i], y=newheight + fontsize)
                sb = builders.StyleBuilder()
                sb.setFontSize(fontsize)
                sb.setFontFamily(titlefontfamily)
                sb.setTextAnchor("middle")
                t.set_style(sb.getStyle())
                s.addElement(t)
                newheight += fontsize + baselinesep
                if s.boxheight < newheight:
                    s.boxheight = newheight

    return s

def pcFromClassList(ds, classes, colors="#888", width=600,height=600, sides=10, makeLast=[], highlight=[],
                    doNames=True,baselinesep=2, fontsize=titlefontsize, flip=False,
                    topMarg=10,bottomMarg=10):
    vecs = [i.vals(ds)*-1 if flip else i.vals(ds) for i in classes]
    if doNames:
        nameText=[]
        for cl in classes:
            t = []
            t.append("nth:%5.3g mcc:%5.2g" % (cl.nth(),cl.mcc()))
            ax = axis.getAxis(cl)
            vl = axis.nonZeroCols(ax)
            for v in vl:
                t.append("%s:%g" % (ds.dataColNames[v],N.round(axis.getAxis(cl)[v],2)))
            nameText.append(t)
    else:
        nameText=False
    return parCoords(vecs,colors,width=width,height=height,sides=sides,makeLast=makeLast,highlight=highlight,
                           nameText=nameText,baselinesep=baselinesep,fontsize=fontsize,topMarg=topMarg,bottomMarg=bottomMarg)


def addNameText(s,data,vecOrAxis,nameText=False,baselinesep=2,listVars=True,stopAfter=100):
    if nameText==False or nameText==[]:
        if hasattr(vecOrAxis,"nth"):
            nameText = "nth:%5.3g mcc:%5.2g" % (vecOrAxis.nth(),vecOrAxis.mcc())
        else:
            nameText = "(no correctness info)"
    if nameText:
        if not(isinstance(nameText,types.ListType)):
            nameText = [nameText]
            # carefull... we are about to tweak the list!
    nameText = [c for c in nameText]
    if listVars and hasattr(vecOrAxis,"ax"):
        vl = axis.nonZeroCols(vecOrAxis.ax)
        for i,v in enumerate(vl):
            if i>=stopAfter:
                nameText.append("and %d others..." % (len(vl)-stopAfter))
                break
            nameText.append("%s:%g" % (data.dataColNames[v],N.round(axis.getAxis(vecOrAxis)[v],2)))

    if nameText != False:
        for nt in nameText:
            t = text.text(nt, x=s.boxwidth/2, y=s.boxheight + titlefontsize)
            sb = builders.StyleBuilder()
            sb.setFontSize(titlefontsize)
            sb.setFontFamily(titlefontfamily)
            sb.setTextAnchor("middle")
            t.set_style(sb.getStyle())
            s.addElement(t)
            s.boxheight += titlefontsize + baselinesep

# these are set as a global variable such that a driver can tune them
t1defaults = {
    "dir" :         "SVGOut",
    "htmltitle":   "Explainers Output",
    "doD3":        True,
    "localD3":     False,           # otherwise, give it a string
    "noembed":     False,
    "vert":        False,
    "objs":        []               # list of elements to add before picture (like patterns)
}


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

    s = structure.svg()

    ti = structure.title()
    ti.appendTextContent(safeTitle(kwargs["htmltitle"]))

    for i in kwargs["objs"]:
        s.addElement(i)

    if kwargs["vert"]:
        elem = velemBox(*args)
    else:
        elem = elemBox(*args)
    s.addElement(elem)
    if hasattr(elem,"boxheight"):
        s.set_height(elem.boxheight)
    if hasattr(elem,"boxwidth"):
        s.set_width(elem.boxwidth)

    if kwargs["doD3"]:
        sc = structure.BaseElement("script")
        sc.setAttribute("type","text/ecmascript")
        d3 = kwargs["localD3"] if kwargs["localD3"] else "http://d3js.org/d3.v3.min.js"
        sc.setAttribute("xlink:href",d3)
        s.addElement(sc)

        #sd = structure.BaseElement("script")
        #sd.setAttribute("type","text/ecmascript")
        #s.addElement(sd)

        sd = structure.BaseElement("script")
        sd.setAttribute("type","text/ecmascript")
        if kwargs["noembed"]:
            sd.setAttribute("xlink:href","../DataToys/Vis/JS/mouseover-highlights.js")
        else:
            with open("DataToys/Vis/JS/mouseover-highlights.js") as codefile:
                code = codefile.read()
                code = " <![CDATA[\n" + code + "\n]]>\n"
                sd.appendTextContent(code)
        s.addElement(sd)

        se = structure.BaseElement("script")
        se.setAttribute("type","text/ecmascript")
        se.appendTextContent("""
            <![CDATA[
                addMouseovers("abox");      // no longer on rectelem
            ]]>
        """)
        s.addElement(se)

    s.save(kwargs["dir"]+"/"+fn, encoding="utf-8")
    print "Wrote file ",fn

def t0(*args,**kwargs):
    """
    like t0, but it doesn't add the D3 stuff
    
    if the first argument is a string, it's taken to be the filename
    otherwise, everything is sent to elembox and then saved to a file
    """
    fn = "t0.svg"
    if isinstance(args[0],types.StringType):
        fn = args[0]
        args = args[1:]

    t1(fn,*args,doD3=False,**kwargs)

def writeCSV(fname, ds, *cols):
    """
    write out classifiers -  but gives a general way to put arbitrary columns

    :param fname: filename (uses default t1 directory)
    :param ds: datastore (used for names)
    :param cols: a thing to write - or the column name, and the data to write
    :return:
    """
    # turn the list into colnames and cols
    colnames = []
    goodcols = []
    cols = list(cols)
    while cols:
        nm="col%02d" % len(colnames)
        if isinstance(cols[0],str):
            nm = cols[0]
            cols.pop(0)
        # maybe it's a classifier?
        if hasattr(cols[0],"vals"):
            cols[0] = cols[0].vals(ds)
        # ducktype check tomake sure its a good column...
        if len(cols[0]) != ds.rows():
            print "writeCSV: Column ", len(colnames)+1, "has the wrong number of items!"
        colnames.append(nm)
        goodcols.append(cols[0])
        cols.pop(0)


    with open("%s/%s" % (t1defaults["dir"],fname), "w") as fo:
        # header row
        fo.write("Item")
        for s in colnames:
            fo.write(", " + s)
        fo.write("\n")

        names = ds.textCol(ds.keyCol)
        for i in range(ds.rows()):
            fo.write(names[i])
            for j in goodcols:
                fo.write(", " + str(j[i]))
            fo.write("\n")

# <script xlink:href="../DataToys/Vis/D3/d3.js" type="text/ecmascript" />
# <script xlink:href="svg_test.js" type="text/ecmascript" />

##################################
def colorfield(vals, titles=False,
               scheme = "div",
               leftLabelWidth = 50, leftLabels=True,
               fontfamily = "Arial", fontsize=7,
               boxPerRow=5,
               boxWidth=10, boxHeight=10, boxSpace = 1,
               roundness=2, strokecolor=None,
               urls = False,
               urlprefix = "", urlsuffix=""):
    """
    set leftLabels to true to use the titles, otherwise give a list

    the modes:
    - continuous ramp (min to max)
    - split ramp (diverging scale)
    - quartile ramp
    """
    vmin = vals.min()
    vmax = vals.max()

    if scheme=="seq":
        ramp = cbrewer.getScheme("YlOrBr",7,"seq")
        map = makeLinearScale(vmin,vmax, 0,1)
        colorRamp = lambda v: cbrewer.rgb_to_hex(cbrewer.lerpScheme(map(v),ramp))
    elif scheme=="div":
        ramp1 = cbrewer.getScheme("Greens",5,"seq")
        ramp2 = cbrewer.getScheme("Purples",5,"seq")
        map1 = makeLinearScale(0,vmax,0,1)
        map2 = makeLinearScale(vmin,0,1,0)
        colorRamp = lambda v: cbrewer.rgb_to_hex(cbrewer.lerpScheme(map1(v),ramp1)
                                                 if v>0 else
                                                 cbrewer.lerpScheme(map2(v),ramp2)
                                                )
    else:
        raise NameError("Unknown Scheme (%s)" % scheme)

    g = structure.G()
    cursorX = 0
    cursorY = 0
    right = 0
    bottom = 0

    for i,v in enumerate(vals):
        # if this is the start of a row, then put a left label
        if i%boxPerRow ==0 and leftLabels != False:
            ll = titles[i] if leftLabels==True else leftLabels[i]
            t = text.text(safeText(ll), x=cursorX+leftLabelWidth, y=cursorY + fontsize)
            sb = builders.StyleBuilder()
            sb.setFontSize(fontsize)
            sb.setFontFamily(fontfamily)
            sb.setTextAnchor("end")
            t.set_style(sb.getStyle())
            g.addElement(t)
            cursorX += leftLabelWidth
        # make the box
        r = shape.Rect(cursorX,cursorY, boxWidth, boxHeight, roundness, roundness)
        r.set_fill(colorRamp(v))
        r.set_stroke(strokecolor)
        right = max(right, cursorX + boxWidth)
        bottom= max(bottom,cursorY + boxHeight)
        if urls!=False or titles != False:
            outer = structure.BaseElement("a")
            if titles!=False:
                outer.setAttribute("xlink:title",safeTitle(titles[i]))
            if urls != False:
                outer.setAttribute("xlink:href",urlprefix+urls[i]+urlsuffix)
            outer.addElement(r)
            r = outer
        g.addElement(r)
        cursorX += boxWidth + boxSpace
        if (i+1) % boxPerRow == 0:
            cursorX = 0
            cursorY += boxHeight + boxSpace

    g.boxwidth = right
    g.boxheight = bottom

    return g


########################################################################
def makeHtmlTagColors(ds,cl):
    """
    Utility function: make the URL string for coloring a set of tags from a vector
    :param ds: the datastore
    :param cl: the sparseClassifier
    :return:
    """
    vl = axis.nonZeroCols(cl)
    ve = axis.getAxis(cl)
    vv = [ int(ve[v]) for v in vl ]

    pramp = cbrewer.getHexScheme("Greens",7,"seq")
    nramp = cbrewer.getHexScheme("Purples",7,"seq")

    st = ""
    for i,v in enumerate(vl):
        st += ("&" if i>0 else "?")
        colName = ds.dataColNames[v]
        if colName[:10]=="Docuscope.":
            colName = colName[10:]
        st += colName
        st += "="
        if vv[i]>0:
            if vv[i]<4:
                col = pramp[vv[i]]
            else:
                col = pramp[5]
        elif vv[i] < 0:
            if vv[i] > -4:
                col = nramp[-vv[i]]
            else:
                col = nramp[5]
        else:
            print "Warning: zero non-zero column (?)"
            col = "white"
        st += col

    return st


#############################################################################
### make some textures for various colors
def makeStripePattern(icolor):
    color = icolor[1:] if icolor[0]=="#" else icolor
    p = gradient.Pattern(0,0,10,10,patternUnits="userSpaceOnUse",patternContentUnits="userSpaceOnUse")
    p.addElement(shape.Line( 0, 0,10,10,stroke="#"+color))
    p.addElement(shape.Line( 5, 0,10, 5,stroke="#"+color))
    p.addElement(shape.Line( 0, 5, 5,10,stroke="#"+color))
    p.set_id("stripe_"+color)
    return p
def makeCrossPattern(icolor):
    color = icolor[1:] if icolor[0]=="#" else icolor
    p = gradient.Pattern(0,0,10,10,patternUnits="userSpaceOnUse",patternContentUnits="userSpaceOnUse")
    p.addElement(shape.Line( 0, 0,10,10,stroke="#"+color))
    p.addElement(shape.Line( 5, 0,10, 5,stroke="#"+color))
    p.addElement(shape.Line( 0, 5, 5,10,stroke="#"+color))
    p.addElement(shape.Line(10, 0, 0,10,stroke="#"+color))
    p.addElement(shape.Line( 5, 0, 0, 5,stroke="#"+color))
    p.addElement(shape.Line(10, 5, 5,10,stroke="#"+color))
    p.set_id("cross_"+color)
    return p
def makeSquarePattern(icolor):
    color = icolor[1:] if icolor[0]=="#" else icolor
    p = gradient.Pattern(0,0,12,12,patternUnits="userSpaceOnUse",patternContentUnits="userSpaceOnUse")
    p.addElement(shape.Rect(3,3,6,6,fill="#"+color,stroke=None,stroke_width=0))
    p.set_id("square_"+color)
    return p
def makeCheckPattern(icolor,checkSize=3):
    color = icolor[1:] if icolor[0]=="#" else icolor
    p = gradient.Pattern(0,0,2*checkSize,2*checkSize,patternUnits="userSpaceOnUse",patternContentUnits="userSpaceOnUse")
    p.addElement(shape.Rect(0,0,checkSize,checkSize,fill="#"+color,stroke=None,stroke_width=0))
    p.addElement(shape.Rect(checkSize,checkSize,checkSize,checkSize,fill="#"+color,stroke=None,stroke_width=0))
    p.set_id("check_"+color)
    return p

def textureNameFromColor(icolor,texture="check"):
    color = icolor[1:] if icolor[0]=="#" else icolor
    return "url(#%s_%s)" % (texture,color)