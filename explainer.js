// helper function to draw lines/paths
var diagonal = d3.svg.diagonal()
    .source(function(d) {return {"x":d[0].y, "y":d[0].x}; })            
    .target(function(d) {return {"x":d[1].y, "y":d[1].x}; })
    .projection(function(d) { return [d.y, d.x]; });

// might need to let user choose how many genres they have
var colors = ["#8dd3c7","#ffffb3","#bebada","#fb8072"]; // if we only have 4 genres.

// main svg canvas
var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height"),
    g = svg.append("g").attr("transform", "translate(32," + (height / 2) + ")");

var dataset = [];
var genreColor = {};

// box size for each element
var height = 20;
var width = 150;

// helper function to sort the dataset by its p value
function compare(a,b) {
  if (Number(a[3]) > Number(b[3]))
    return -1;
  if (Number(a[3]) < Number(b[3]))
    return 1;
  return 0;
}

d3.csv("00-comedies.csv", function(data) {
   dataset = data.map(function(d) { return  [d["Item"], d["genre"], d["predicate"], d["explainer1"]]; });
   // sort data by p value
   dataset.sort(compare);
   max = Number(dataset[dataset.length-1][3]);
   min = Number(dataset[0][3]);
   h1 = max - min;
   h2 = height * dataset.length;
   // 0 -- map to max
   // height * dataset.length -- map to min

   // get genre-color mapping
   k = 0;
   for (var j = 0; j < dataset.length; j++) {
	   if (!(dataset[j][1] in genreColor)) {
		   genreColor[dataset[j][1]] = colors[k];
		   k++;
	   }
   }
   
   // plot squares for each item
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
   
   // draw histogram
   // looks incorrect...
   var box_h = h2 / 7; // num of bins, might need to change it to user input
   histData = data.map(function(i){ return i.explainer1; });
   var histogram = d3.layout.histogram()
					 .bins(7)(histData);
   
   var bars = svg.selectAll(".bar")
				 .data(histogram)
				 .enter()
				 .append("g")
	bars.append("rect")
		.attr("x", function(d){ return 300; }) // fixed position for now
		.attr("y", function(d,i){ return i*box_h; })
		.attr("width", function(d){ return d.y*5 })
		.attr("height", box_h)
		.attr("fill", "steelblue")
		
	// draw box plot, +1 / -1 / all
	var positive = [];
	var negative = [];
	var all_val = [];
	for (var j = 0;j<dataset.length; j++) {
		if (Number(dataset[j][2]) > 0) {
			positive.push(Number(dataset[j][3]));
		} else {
			negative.push(Number(dataset[j][3]));
		}
		all_val.push(Number(dataset[j][3]));
	}
	positive.sort();
	negative.sort();
	all_val.sort();
	// from small to large
	//console.log(positive);
	var p_info = {
		max_val: positive[positive.length -1],
		Q3: positive[Math.floor(positive.length * 3 / 4)],
		Q2: positive[Math.floor(positive.length * 1 / 2)],
		Q1: positive[Math.floor(positive.length * 1 / 4)],
		min_val: positive[0],
	};
	//console.log(p_info);
	var n_info = {
		max_val: negative[negative.length -1],
		Q3: negative[Math.floor(negative.length * 3 / 4)],
		Q2: negative[Math.floor(negative.length * 1 / 2)],
		Q1: negative[Math.floor(negative.length * 1 / 4)],
		min_val: negative[0],
	};
	var all_info = {
		max_val: all_val[all_val.length -1],
		Q3: all_val[Math.floor(all_val.length * 3 / 4)],
		Q2: all_val[Math.floor(all_val.length * 1 / 2)],
		Q1: all_val[Math.floor(all_val.length * 1 / 4)],
		min_val: all_val[0],
	};
    // let's start from x = 400
	// coordinate transformation is wrong...
	svg.append("rect")
	   .attr("height",Math.abs((p_info.Q3 - p_info.Q2)/ h1 * h2))
	   .attr("width",20)
	   .attr("fill","blue")
	   .attr("stroke","black")
	   .attr("x",400)
	   .attr("y",(p_info.Q3 - min)/ h1 * h2) //(p_info.Q3 - min)/ h1 * h2
	svg.append("rect")
	   .attr("height",Math.abs((p_info.Q2 - p_info.Q1)/ h1 * h2))
	   .attr("width",20)
	   .attr("fill","blue")
	   .attr("stroke","black")
	   .attr("x",400)
	   .attr("y",(p_info.Q2 - min)/ h1 * h2)
	svg.append("rect")
	   .attr("height",1)
	   .attr("width",20)
	   .attr("fill","blue")
	   .attr("stroke","black")
	   .attr("x",400)
	   .attr("y",(p_info.min_val - min)/ h1 * h2)
	svg.append("rect")
	   .attr("height",1)
	   .attr("width",20)
	   .attr("fill","blue")
	   .attr("stroke","black")
	   .attr("x",400)
	   .attr("y",(p_info.max_val - min)/ h1 * h2)

});