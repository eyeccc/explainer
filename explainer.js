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
var genreColor = {};

// box size for each element
var height = 20;
var width = 150;

function compare(a,b) {
  if (Number(a[3]) > Number(b[3]))
    return -1;
  if (Number(a[3]) < Number(b[3]))
    return 1;
  return 0;
}

d3.csv("00-comedies.csv", function(data) {
   dataset = data.map(function(d) { return  [d["Item"], d["genre"], d["predicate"], d["explainer1"]]; });
   dataset.sort(compare);
   max = Number(dataset[dataset.length-1][3]);
   min = Number(dataset[0][3]);
   h1 = max - min;
   h2 = height * dataset.length;
   // 0 -- map to max
   // height * dataset.length -- map to min
   //console.log(dataset);
   k = 0;
   for (var j = 0; j < dataset.length; j++) {
	   //console.log(dataset[j][1]);
	   if (!(dataset[j][1] in genreColor)) {
		   genreColor[dataset[j][1]] = colors[k];
		   //console.log(dataset[j][1]);
		   k++;
	   }
   }
   // sort data by p1 and p2
   for(var j = 0; j < dataset.length; j++) {
	   svg.append("rect")
	   .attr("height",height)
	   .attr("width",width)
	   .attr("fill",genreColor[dataset[j][1]])
	   .attr("id","sq"+j)
	   .attr("stroke","black")
	   .attr("class", "w"+j)
	   .attr("x",10)
	   .attr("y",j*height)
	   .attr("rx",5)
	   .attr("ry",5)
	   .on("mouseover", function() {
		   c = "." + d3.select(this).attr("class");
		   d3.selectAll(c)
			 .attr("stroke","red")
			 .attr("stroke-width","4px")
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
		  .attr("x",10 + 5)
		  .attr("y",15+j*height)
		  .text(dataset[j][0])
		  .style("font-size","12px");
	   
	   // this part is the lines
	   y_new = (Number(dataset[j][3]) - min) / h1 * h2;
	   var curveData = [ {x:10+width,y:j*height+0.5*height},{x:300,  y:y_new}];
		svg.append("path")
		   .datum(curveData)
		   .attr("class", "w"+j)
		   .attr("id",dataset[j][1])
		   .attr("d", diagonal)
		   .attr("stroke", genreColor[dataset[j][1]])
		   .attr("fill","none")
   }
   /*var y = d3.scale.ordinal()
    .rangeRoundBands([height, 0], .1); // y becomes ordinal

	var x = d3.scale.linear()
		.rangeRound([0, width]); // x becomes linear

	// change state group to be positioned in the y now instead of x
	var state = svg.selectAll(".state")
		  .data(data)
		  .enter().append("g")
		  .attr("class", "g")
		  .attr("transform", function(d) { return "translate(0," + y(d.State) + ")"; });

	// rect calculations become
	 state.selectAll("rect")
		.data(function(d) { return d.ages; })
		.enter().append("rect")
		.attr("height", y.rangeBand()) // height in now the rangeband
		.attr("x", function(d) { return x(d.y0); }) // this is the horizontal position in the stack
		.attr("width", function(d) { return x(d.y1) - x(d.y0); }) // this is the horizontal "height" of the bar
		.style("fill", function(d) { return color(d.name); });*/
});
