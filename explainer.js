
var diagonal = d3.svg.diagonal()
    .source(function(d) {return {"x":d[0].y, "y":d[0].x}; })            
    .target(function(d) {return {"x":d[1].y, "y":d[1].x}; })
    .projection(function(d) { return [d.y, d.x]; });
var textData = ["yeah"];

var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height"),
    g = svg.append("g").attr("transform", "translate(32," + (height / 2) + ")");
var height = 50;
var width = 100;
svg.append("rect")
   .attr("height",height)
   .attr("width",width)
   .attr("fill","#ccc")
   .attr("id","rect1")
   .attr("stroke","black")
   .attr("class", "w1")
   .attr("x",100)
   .attr("y",100)
   .attr("rx",15)
   .attr("ry",15)
   .on("mouseover", function(d,i) {
	   d3.selectAll(".w1")
		 .attr("stroke","red")
		 .attr("stroke-width","2px")
   })
   .on("mouseout", function(d,i) {
	   d3.selectAll(".w1")
	     .attr("stroke","black")
		 .attr("stroke-width","1px")
   })
svg.append("text")
   .data(textData)
   .attr("x",100 + 10)
   .attr("y",100 + 20)
   .text(function(d) { return d; })
   .style("font-size","12px");
   
/*var xx = d3.select("#rect1").attr("x");
var yy = d3.select("#rect1").attr("y");
var x1 = d3.select("#rect2").attr("x");
var y1 = d3.select("#rect2").attr("y");
var curveData = [{x: xx,y:yy},{x:x1,y:y1}];*/



svg.append("rect")
   .attr("height",height)
   .attr("width",width)
   .attr("fill","#ccc")
   .attr("id","rect2")
   .attr("class","w1")
   .attr("stroke","black")
   .attr("x",300)
   .attr("y",200)
   .attr("rx",15)
   .attr("ry",15)
   .on("mouseover", function(d,i) {
	   d3.selectAll(".w1")
		 .attr("stroke","red")
		 .attr("stroke-width","2px")
   })
   .on("mouseout", function(d,i) {
	   d3.selectAll(".w1")
	     .attr("stroke","black")
		 .attr("stroke-width","1px")
   })

var curveData = [ {x:190,y:100},{x:360,  y:150}];
svg.append("path")
   .datum(curveData)
   .attr("class", "w1")
   .attr("id","link1")
   .attr("d", diagonal)
   .attr("stroke", "#444")
   .attr("fill","none")