// helper function to draw lines/paths
var diagonal = d3.svg.diagonal()
    .source(function(d) {return {"x":d[0].y, "y":d[0].x}; })            
    .target(function(d) {return {"x":d[1].y, "y":d[1].x}; })
    .projection(function(d) { return [d.y, d.x]; });

var colors = ["#8dd3c7","#ffffb3","#bebada","#fb8072"]; // if we only have 4 genres.
// might need to let user choose how many genres they have

var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height"),
    g = svg.append("g").attr("transform", "translate(32," + (height / 2) + ")");

var dataset = [];

// box size for each element
var height = 30;
var width = 100;

d3.csv("shak-exp.csv", function(data) {
   dataset = data.map(function(d) { return  [d["Title"], d["Genre"], d["P1"], d["P2"]]; });
   // console.log(dataset);
   // sort data by p1 and p2
   for(var j = 0; j < dataset.length; j++) {
	   svg.append("rect")
	   .attr("height",height)
	   .attr("width",width)
	   .attr("fill",colors[0])
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
		   d3.selectAll(c)
			 .attr("stroke","black")
			 .attr("stroke-width","1px")
	   })
	   //var t = wrap(dataset[j][0],width);
	   //console.log(t);
	   svg.append("text")
	   .attr("x",100 + 10)
	   .attr("y",10+j*height + 20)
	   .text(dataset[j][0])
	   .style("font-size","12px");
	   
	   // this part is the lines
	   /*var curveData = [ {x:100+width,y:10+j*height+0.5*height},{x:300,  y:10+j*height}];
		svg.append("path")
		   .datum(curveData)
		   .attr("class", "w"+j)
		   .attr("id","link1")
		   .attr("d", diagonal)
		   .attr("stroke", colors[0])
		   .attr("fill","none")*/
   }
   
});



/*
console.log(dataset);

for (var j = 0; j < dataset.length; j++) {
	svg.append("rect")
	   .attr("height",height)
	   .attr("width",width)
	   .attr("fill",colors[0])
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

	/*var curveData = [ {x:100+width,y:10+j*height+0.5*height},{x:300,  y:10+j*height}];
	svg.append("path")
	   .datum(curveData)
	   .attr("class", "w"+j)
	   .attr("id","link1")
	   .attr("d", diagonal)
	   .attr("stroke", "#444")
	   .attr("fill","none")
}*/
