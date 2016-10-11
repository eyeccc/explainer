
var diagonal = d3.svg.diagonal()
    .source(function(d) {return {"x":d[0].y, "y":d[0].x}; })            
    .target(function(d) {return {"x":d[1].y, "y":d[1].x}; })
    .projection(function(d) { return [d.y, d.x]; });
var textData = ["yeah"];

var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height"),
    g = svg.append("g").attr("transform", "translate(32," + (height / 2) + ")");
var dataset = []
d3.csv("rca.csv", function(data) {
   dataset = data.map(function(d) { return  [d["Title"], d["Genre"], d["P1"], d["P2"]]; });
   console.log(dataset)
});
var height = 30;
var width = 100;



for (var j = 0; j < 10; j++) {
	//var str = ".w" + j;
	svg.append("rect")
	   .attr("height",height)
	   .attr("width",width)
	   .attr("fill","#ccc")
	   .attr("id","rect1")
	   .attr("stroke","black")
	   .attr("class", "w"+j)
	   .attr("x",100)
	   .attr("y",10+j*height)
	   .attr("rx",5)
	   .attr("ry",5)
	   .on("mouseover", function() {
		   c = "." + d3.select(this).attr("class");
		   d3.selectAll(c)
			 .attr("stroke","red")
			 .attr("stroke-width","2px")
	   })
	   .on("mouseout", function() {
		   c = "." + d3.select(this).attr("class");
		   //console.log(c);
		   d3.selectAll(c)
			 .attr("stroke","black")
			 .attr("stroke-width","1px")
	   })
	svg.append("text")
	   .data(textData)
	   .attr("x",100 + 10)
	   .attr("y",10+j*height + 20)
	   .text(function(d) { return d; })
	   .style("font-size","12px");

	/*svg.append("rect")
	   .attr("height",height)
	   .attr("width",width)
	   .attr("fill","#ccc")
	   .attr("id","rect2")
	   .attr("class","w"+j)
	   .attr("stroke","black")
	   .attr("x",300)
	   .attr("y",10+j*height)
	   .attr("rx",5)
	   .attr("ry",5)
	   .on("mouseover", function() {
		   c = "." + d3.select(this).attr("class");
		   d3.selectAll(c)
			 .attr("stroke","red")
			 .attr("stroke-width","2px")
	   })
	   .on("mouseout", function() {
		   c = "." + d3.select(this).attr("class");
		   d3.selectAll(c)
			 .attr("stroke","black")
			 .attr("stroke-width","1px")
	   })*/

	var curveData = [ {x:100+width,y:10+j*height+0.5*height},{x:300,  y:10+j*height}];
	svg.append("path")
	   .datum(curveData)
	   .attr("class", "w"+j)
	   .attr("id","link1")
	   .attr("d", diagonal)
	   .attr("stroke", "#444")
	   .attr("fill","none")
}
