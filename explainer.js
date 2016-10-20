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
  var last = a.length - 1;
  if (Number(a[last]) > Number(b[last]))
    return -1;
  if (Number(a[last]) < Number(b[last]))
    return 1;
  return 0;
}

function stackbox(svg, dataset, x_position) {
	var last = dataset[0].length - 1;
	for(var j = 0; j < dataset.length; j++) {
	   svg.append("rect")
	   .attr("height",height)
	   .attr("width",width)
	   .attr("fill",genreColor[dataset[j][1]])
	   .attr("id","sq"+j)
	   .attr("stroke","black")
	   .attr("class", "w"+j)
	   .attr("x",x_position)
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
		   col = d3.select(this).attr("fill");
		   d3.selectAll(c)
			 .attr("stroke",col)
			 .attr("stroke-width","1px")
		   d3.select(this)
		     .attr("stroke","black")
			 .attr("stroke-width","1px")
	   })
	   
	   svg.append("text")
		  .attr("x",x_position + 5)
		  .attr("y",15+j*height)
		  .text(dataset[j][0])
		  .style("font-size","12px");
	   
	   // this part is the lines
	   y_new = (Number(dataset[j][last]) - min) / h1 * h2;
	   
	   var curveData = [ {x:x_position+width,y:j*height+0.5*height},{x:x_position+300,  y:y_new}];
		svg.append("path")
		   .datum(curveData)
		   .attr("class", "w"+j)
		   .attr("id",dataset[j][1])
		   .attr("d", diagonal)
		   .attr("stroke", genreColor[dataset[j][1]])
		   .attr("fill","none")
   }
}

function histogramplot(svg, dataset, x_position) {
   var box_h = h2 / 7; // num of bins, might need to change it to user input
   var st = genreColor;
   for(var prop in st) {
	   st[prop] = 0;
   }
   var count = 1;
   var last = dataset[0].length - 1;
   // max to min
   for (var j = dataset.length -1; j >= 0; j--) {
	   if (Number(dataset[j][last]) <= max + Math.abs(h1*count / 7) ) {
		   st[dataset[j][1]] += 1;
	   } else {
		   var u = 0;
		   var l = 0;
		   for(var prop in st) {
			   svg.append("rect")
				.attr("x", x_position+300 + u*10) // fixed position for now
				.attr("y", (7-(count))*box_h)
				.attr("width", st[prop]*10)
				.attr("height", box_h)
				.attr("stroke","green")
				.attr("fill", colors[l]);
				u += st[prop];
				l++;
		   }
		   for(var prop in st) {
			   st[prop] = 0;
		   }
		   count++;
		   j++;
	   }
   }
   // ugly...
   var u = 0;
   var l = 0;
	for(var prop in st) {
		svg.append("rect")
			.attr("x", x_position+300 + u*10) // fixed position for now
			.attr("y", (7-(count))*box_h)
			.attr("width", st[prop]*10)
			.attr("height", box_h)
			.attr("stroke","green")
			.attr("fill", colors[l]);
			u += st[prop];
			l++;
	}
}

function boxplot(svg, color, info, x_pos, h1, h2, max, min) {
	svg.append("rect")
	   .attr("height",Math.abs((info.Q3 - info.Q2)/ h1 * h2))
	   .attr("width",20)
	   .attr("fill",color)
	   .attr("stroke","black")
	   .attr("x",x_pos)
	   .attr("y",h2 - ((info.Q3 - max)/ (-h1) * h2)) 
	svg.append("rect")
	   .attr("height",Math.abs((info.Q2 - info.Q1)/ h1 * h2))
	   .attr("width",20)
	   .attr("fill",color)
	   .attr("stroke","black")
	   .attr("x",x_pos)
	   .attr("y",h2 - ((info.Q2 - max)/ (-h1) * h2))
	svg.append("line")
	   .attr("x1",x_pos)
	   .attr("y1",h2 - ((info.min_val - max)/ (-h1) * h2))
	   .attr("x2",x_pos + 20)
	   .attr("y2",h2 - ((info.min_val - max)/ (-h1) * h2))
	   .attr("stroke-width", 2)
       .attr("stroke", "black")
	svg.append("line")
	   .attr("x1",x_pos)
	   .attr("y1",h2-((info.max_val - max)/ (-h1) * h2))
	   .attr("x2",x_pos+20)
	   .attr("y2",h2-((info.max_val - max)/ (-h1) * h2))
	   .attr("stroke-width", 2)
       .attr("stroke", "black")
	svg.append("line")
	   .attr("x1",x_pos+10)
	   .attr("y1",h2 - ((info.max_val - max)/ (-h1) * h2))
	   .attr("x2",x_pos+10)
	   .attr("y2",h2 - ((info.max_val - max)/ (-h1) * h2) + Math.abs((info.max_val - info.Q3)/ h1 * h2))
	   .attr("stroke-width", 1)
       .attr("stroke", "black")
	svg.append("line")
	   .attr("x1",x_pos+10)
	   .attr("y1",h2 - ((info.Q1 - max)/ (-h1) * h2))
	   .attr("x2",x_pos+10)
	   .attr("y2",h2 - ((info.Q1 - max)/ (-h1) * h2) + Math.abs((info.Q1 - info.min_val)/ h1 * h2))
	   .attr("stroke-width", 1)
       .attr("stroke", "black")
}

function boxdata(svg, dataset,x_position, pred) {
	var positive = [];
	var negative = [];
	var all_val = [];
	var last = dataset[0].length -1;
	for (var j = 0;j < dataset.length; j++) {
		if (pred > 0) {
			if (Number(dataset[j][2]) > 0) {
			positive.push(dataset[j][last]);
			} else {
				negative.push(dataset[j][last]);
			}
		}
		all_val.push(dataset[j][last]);
	}
	if (pred > 0) {
		var p1 = positive.map(Number);
		var n1 = negative.map(Number);
		
		// this part is ugly...
		var p_info = {
			max_val: p1[0],
			Q3: p1[Math.floor(p1.length * 1 / 4)],
			Q2: p1[Math.floor(p1.length * 1 / 2)],
			Q1: p1[Math.floor(p1.length * 3 / 4)],
			min_val: p1[p1.length - 1],
		};
		boxplot(svg, colors[0], p_info, x_position+500, h1, h2, max, min);
		var n_info = {
			max_val: n1[0],
			Q3: n1[Math.floor(n1.length * 1 / 4)],
			Q2: n1[Math.floor(n1.length * 1 / 2)],
			Q1: n1[Math.floor(n1.length * 3 / 4)],
			min_val: n1[n1.length -1],
		};
		boxplot(svg, colors[2], n_info, x_position+470, h1, h2, max, min);
	}
	
	var a1 = all_val.map(Number);
	var a_info = {
		max_val: a1[0],
		Q3: a1[Math.floor(a1.length * 1 / 4)],
		Q2: a1[Math.floor(a1.length * 1 / 2)],
		Q1: a1[Math.floor(a1.length * 3 / 4)],
		min_val: a1[a1.length -1],
	};
	boxplot(svg, colors[1], a_info, x_position+440, h1, h2, max, min);
}

// main function
d3.csv("00-comedies.csv", function(data) {
   // get column name
   var dataValues = d3.values(data)[0];
   var explainer = [];
   var predicate = "";
   var item = "";
   var genre = "";
   var pred = 0;
   // know the indices of different column we want
   var col_names = Object.keys(dataValues);
   for(var i = 0; i < col_names.length; i++) {
	   var str = col_names[i].toLowerCase();
	   if (str === "predicate") {
		   predicate = col_names[i];
	   } else if (str === "item") {
		   item = col_names[i];
	   } else if (str === "genre") {
		   genre = col_names[i];
	   } else {		   
		   explainer.push(col_names[i]);
	   }
   }
   // get genre-color mapping
   k = 0;
   var genres = data.map(function(d) { return  d[genre]; });
   //console.log(genres);
   for (var j = 0; j < genres.length; j++) {
	   if (!(genres[j] in genreColor)) {
		   genreColor[genres[j]] = colors[k];
		   k++;
	   }
   }
   //console.log(genreColor);
   var x_position = 0;
	if (predicate !== "") {
		pred = 1;
	   for (var i = 0; i < explainer.length; i++) {
		   // TODO: need to give x value as input
		  dataset = data.map(function(d) { return  [d[item], d[genre], d[predicate], d[explainer[i]]]; });
		  // sort
		  dataset.sort(compare);
		  max = Number(dataset[dataset.length-1][3]);
		  min = Number(dataset[0][3]);
		  h1 = max - min;
		  h2 = height * dataset.length;
		  // stack box and lines
		  stackbox(svg, dataset, x_position);
		  // histogram
		  histogramplot(svg, dataset, x_position);
		  // box
		  boxdata(svg, dataset, x_position, pred);
		  // clean up
		  dataset = [];
		  x_position += 530; // might need to adjust the value if user choose to not showing some of the plot
	   }
	} else {
		console.log("here");
		pred = 0;
	   for (var i = 0; i < explainer.length; i++) {
		  dataset = data.map(function(d) { return  [d[item], d[genre], d[explainer[i]]]; });
		  dataset.sort(compare);
		  max = Number(dataset[dataset.length-1][2]);
		  min = Number(dataset[0][2]);
		  h1 = max - min;
		  h2 = height * dataset.length;
		  // stack box and lines
		  stackbox(svg, dataset, x_position);
		  // histogram
		  histogramplot(svg, dataset, x_position);
		  // box
		  boxdata(svg, dataset, x_position, pred);
		  // clean up
		  dataset = [];
		  x_position += 530; // might need to adjust the value if user choose to not showing some of the plot
	   }
	}
});