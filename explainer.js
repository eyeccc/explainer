explainer = function(inputfilename) {
	// helper function to draw lines/paths
	var diagonal = d3.svg.diagonal()
		.source(function(d) {return {"x":d[0].y, "y":d[0].x}; })            
		.target(function(d) {return {"x":d[1].y, "y":d[1].x}; })
		.projection(function(d) { return [d.y, d.x]; });

	// might need to let user choose how many genres they have
	// if we only have 4 genres.
	var colors = ["#8dd3c7","#ffffb3","#bebada","#fb8072"]; 

	// main svg canvas
	var svg = d3.select("svg"),
		width = +svg.attr("width"),
		height = +svg.attr("height"),
		g = svg.append("g").attr(
			    "transform", 
				"translate(32," + (height / 2) + ")"
			);

	// box size for each element
	var height = 20;
	var width = 20;
	d3.selection.prototype.moveToFront = function() {  
		  return this.each(function(){
			this.parentNode.appendChild(this);
		  });
		};

	// helper function to sort the dataset by its p value
	function compare(a,b) {
	  var last = a.length - 2;
	  if (Number(a[last]) > Number(b[last]))
		return -1;
	  if (Number(a[last]) < Number(b[last]))
		return 1;
	  return 0;
	}

	function clone(obj) {
		if (null == obj || "object" != typeof obj) return obj;
		var copy = obj.constructor();
		for (var attr in obj) {
			if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
		}
		return copy;
	}
	
	function stackbox(svg, dataset, x_position, genreColor) {
		var last = dataset[0].length - 2;
		var colsInRow = Math.ceil(dataset.length / 30); // max rows = 30
		for(var j = 0; j < dataset.length; j++) {
			for(var k = 0; k < colsInRow; k++) {
				if (j+k >= dataset.length) {
					break;
				}
				var cname = dataset[j+k][last+1];
				svg.append("rect")
				   .attr("height",height)
				   .attr("width",width)
				   .attr("fill",genreColor[dataset[j+k][1]])
				   .attr("id","sq")
				   .attr("stroke","black")
				   .attr("class", cname)
				   .attr("x",x_position + k*width)
				   .attr("y",Math.floor(j/colsInRow)*height)
				   .attr("rx",5)
				   .attr("ry",5)
				   .on("mouseover", function() {
					   c = "." + d3.select(this).attr("class");
					   c1 = ".t" + d3.select(this).attr("class");
					   d3.selectAll(c)
						 .attr("stroke","red")
						 .attr("stroke-width","4px");
					   d3.selectAll(c1)
						 .moveToFront()
						 .style("visibility","visible");
					})
				   .on("mouseout", function() {
					   c = "." + d3.select(this).attr("class");
					   c1 = ".t" + d3.select(this).attr("class");
					   idd = "#" + d3.select(this).attr("id");
					   col = d3.select(this).attr("fill");
					   d3.selectAll(c)
						 .attr("stroke",col)
						 .attr("stroke-width","1px");
					   d3.selectAll(c1)
						 .style("visibility","hidden");
					   d3.selectAll(idd)
						 .attr("stroke","black")
						 .attr("stroke-width","1px");
					})
				// lines connectin small boxes and histogram
				y_new = (Number(dataset[j+k][last]) - min) / h1 * h2;
		   
				var curveData = [
					{x:x_position+width*colsInRow,
					 y:Math.floor(j/colsInRow)*height+0.5*height
					},
					{x:x_position+width*colsInRow+100,  y:y_new}
				];
				svg.append("path")
				   .datum(curveData)
				   .attr("class", cname)
				   .attr("id",dataset[j+k][1])
				   .attr("d", diagonal)
				   .attr("stroke", genreColor[dataset[j+k][1]])
				   .attr("fill","none")
				// tooltip
				svg.append("rect")
				   .attr("height",18)
				   .attr("width",dataset[j+k][0].length * 8)
				   .attr("fill","#e3e7ed")
				   .attr("rx",5)
				   .attr("ry",5)
				   .attr("class", "t" + cname)
				   .attr("x",x_position + k*width + 10)
				   .attr("y",Math.floor(j/colsInRow)*height+2 + 5)
				   .style("opacity", 0.7)
				   .style("visibility","hidden");
				svg.append("text")
				   .attr("class", "t" + cname)
				   .attr("x",x_position + k*width + 5 + 10)
				   .attr("y",15+Math.floor(j/colsInRow)*height + 5)
				   .text(dataset[j+k][0])
				   .style("font-size","12px")
				   .style("visibility","hidden");
			}
			j+= colsInRow-1;
	   }
	}
	
	function histogramplot(svg, dataset, x_position, genreColor, maxWidth) {
		var box_w = maxWidth / dataset.length;
		// bottom axis of the histogram
		svg.append("line")
		   .attr("x1",x_position)
		   .attr("y1",0)
		   .attr("x2",x_position)
		   .attr("y2",h2)
		   .attr("stroke-width", 1)
		   .attr("stroke", "green")
		// num of bins, might need to change it to user input
		var box_h = h2 / 7; 
		var st = clone(genreColor);
		for(var prop in st) {
			st[prop] = 0;
		}
		var count = 1;
		var last = dataset[0].length - 2;
		// max to min
		for (var j = dataset.length -1; j >= 0; j--) {
			if (Number(dataset[j][last]) <= max + Math.abs(h1*count / 7) ) {
				st[dataset[j][1]] += 1;
			} else {
				var u = 0;
				var l = 0;
				for(var prop in st) {
					svg.append("rect")
					   .attr("x", x_position + u*box_w) 
					   .attr("y", (7-(count))*box_h)
					   .attr("width", st[prop]*box_w)
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
			   .attr("x", x_position + u*box_w) 
			   .attr("y", (7-(count))*box_h)
			   .attr("width", st[prop]*box_w)
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
		   .attr("y2",
				 h2 - ((info.max_val - max)/ (-h1) * h2)
				 + Math.abs((info.max_val - info.Q3)/ h1 * h2)
				)
		   .attr("stroke-width", 1)
		   .attr("stroke", "black")
		svg.append("line")
		   .attr("x1",x_pos+10)
		   .attr("y1",h2 - ((info.Q1 - max)/ (-h1) * h2))
		   .attr("x2",x_pos+10)
		   .attr("y2",
				 h2 - ((info.Q1 - max)/ (-h1) * h2)
				 + Math.abs((info.Q1 - info.min_val)/ h1 * h2)
				)
		   .attr("stroke-width", 1)
		   .attr("stroke", "black")
	}

	function boxdata(svg, dataset,x_position, pred) {
		var positive = [];
		var negative = [];
		var all_val = [];
		var last = dataset[0].length -2;
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
			boxplot(svg, colors[0], p_info, x_position+70, h1, h2, max, min);
			var n_info = {
				max_val: n1[0],
				Q3: n1[Math.floor(n1.length * 1 / 4)],
				Q2: n1[Math.floor(n1.length * 1 / 2)],
				Q1: n1[Math.floor(n1.length * 3 / 4)],
				min_val: n1[n1.length -1],
			};
			boxplot(svg, colors[2], n_info, x_position+40, h1, h2, max, min);
		}
		
		var a1 = all_val.map(Number);
		var a_info = {
			max_val: a1[0],
			Q3: a1[Math.floor(a1.length * 1 / 4)],
			Q2: a1[Math.floor(a1.length * 1 / 2)],
			Q1: a1[Math.floor(a1.length * 3 / 4)],
			min_val: a1[a1.length -1],
		};
		boxplot(svg, colors[1], a_info, x_position+10, h1, h2, max, min);
	}

	// main function
	d3.csv(inputfilename, function(data) {
	   // get column name
		var dataset = [];
		var genreColor = {};
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
				pred = 1;
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
		for (var j = 0; j < genres.length; j++) {
			if (!(genres[j] in genreColor)) {
			   genreColor[genres[j]] = colors[k];
			   k++;
			}
		}

		var x_position = 0;
		for (var i = 0; i < explainer.length; i++) {
			if (predicate !== "") {
				dataset =
					data.map(function(d,idx) { 
						return [d[item], 
								d[genre], 
								d[predicate],
								d[explainer[i]],
								"d" + idx];
					});
			} else {
				dataset = 
					data.map(function(d,idx) { 
						return  [d[item], d[genre], d[explainer[i]], "d" + idx];
					});
			}

			last = dataset[0].length - 2;
			dataset.sort(compare);
			max = Number(dataset[dataset.length-1][last]);
			min = Number(dataset[0][last]);
			h1 = max - min;
			data_height = 
				Math.ceil(dataset.length / Math.ceil(dataset.length / 30));
			h2 = data_height < 30 ? 
				 height * data_height: height * 30;
			// stack box and lines
			stackbox(svg, dataset, x_position, genreColor);
			// histogram
			var maxWidth = 500; // this should be a parameter
			x_position += Math.ceil(dataset.length / 30) * width + 100;
			histogramplot(svg, dataset, x_position, genreColor, maxWidth);
			// box
			// assume max num is around half of the width
			x_position += maxWidth / 7 * 3; 
			boxdata(svg, dataset, x_position, pred);
			// clean up
			dataset = [];
			// might need to adjust the value 
			// if user choose to not showing some of the plot
			x_position += 80; 
		}
	});
}

