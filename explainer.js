(function(window){
    'use strict';
    function define_library(){
		var explainer = function explainer() {
			//this.abc = 123;
			this.svgW = 100;
			this.svgH = 100;
			this.binNum = 0;
			this.isCustomBinNum = false;
			this.pathVisibility = true;
			this.histVisibility = true;
			this.boxplotVisibility = true;
			this.filename = "";
		}

		// helper function to draw lines/paths
		var diagonal = d3.svg.diagonal()
			.source(function(d) {return {"x":d[0].y, "y":d[0].x}; })            
			.target(function(d) {return {"x":d[1].y, "y":d[1].x}; })
			.projection(function(d) { return [d.y, d.x]; });
		
		// default genre colors
		explainer.colors = [
			"#8dd3c7",
			"#ffffb3",
			"#bebada",
			"#fb8072",
			"#80b1d3",
			"#fdb462",
			"#b3de69",
			"#fccde5",
			"#d9d9d9",
			"#bc80bd",
			"#ccebc5",
			"#ffed6f"
		];

		explainer.prototype.appendSVG = function(w, h) {
			this.svgW = w;
			this.svgH = h;
		}
		
		explainer.prototype.setPathInvisible = function() {
			this.pathVisibility = false;
		}
		
		explainer.prototype.setHistInvisible = function() {
			this.histVisibility = false;
		}
		
		explainer.prototype.setBoxplotInvisible = function() {
			this.boxplotVisibility = false;
		}
		
		explainer.prototype.setCSV = function(name) {
			this.filename = name;
		}
		
		explainer.prototype.setHistBinNum = function(num) {
			this.binNum = num;
			this.isCustomBinNum = true;
		}

		// box size for each element
		var height = 20;
		var width = 20;
		d3.selection.prototype.moveToFront = function() {  
			  return this.each(function(){
				this.parentNode.appendChild(this);
			  });
			};

		// helper function to sort the dataset by its explainer value
		function compare(a,b) {
		  var last = a.length - 2;
		  if (Number(a[last]) > Number(b[last]))
			return -1;
		  if (Number(a[last]) < Number(b[last]))
			return 1;
		  return 0;
		}
		
		// helper function to clone obj
		function clone(obj) {
			if (null == obj || "object" != typeof obj) return obj;
			var copy = obj.constructor();
			for (var attr in obj) {
				if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
			}
			return copy;
		}
		
		function stackbox(
			svg,
			dataset,
			x_position,
			genreColor,
			min,
			max,
			h1,
			h2,
			pathVisibility
		) {
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
						   var c = "." + d3.select(this).attr("class");
						   var c1 = ".t" + d3.select(this).attr("class");
						   d3.selectAll(c)
							 .attr("stroke","red")
							 .attr("stroke-width","4px");
						   d3.selectAll(c1)
							 .moveToFront()
							 .style("visibility","visible");
						})
					   .on("mouseout", function() {
						   var c = "." + d3.select(this).attr("class");
						   var c1 = ".t" + d3.select(this).attr("class");
						   var idd = "#" + d3.select(this).attr("id");
						   var col = d3.select(this).attr("fill");
						   d3.selectAll(c)
							 .attr("stroke",col)
							 .attr("stroke-width","1px");
						   d3.selectAll(c1)
							 .style("visibility","hidden");
						   d3.selectAll(idd)
							 .attr("stroke","black")
							 .attr("stroke-width","1px");
						})
					// lines connecting small boxes and histogram
					if (pathVisibility) {
						var y_new = (Number(dataset[j+k][last]) - min) / h1 * h2;
			   
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
					}

					// tooltip to show item name
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
		
		function histogramplot(
			svg,
			dataset,
			x_position,
			genreColor,
			maxWidth,
			min,
			max,
			h1,
			h2,
			isSetBin,
			inputBinNum
		) {
			var box_w = maxWidth / dataset.length;
			var bin_num = isSetBin
				? inputBinNum
				: Math.floor(Math.sqrt(dataset.length-1)-1);
			// bottom axis of the histogram
			svg.append("line")
			   .attr("x1",x_position)
			   .attr("y1",0)
			   .attr("x2",x_position)
			   .attr("y2",h2)
			   .attr("stroke-width", 1)
			   .attr("stroke", "black")
			// num of bins, might need to change it to user input
			var box_h = h2 / bin_num; 
			var st = clone(genreColor);
			for(var prop in st) {
				st[prop] = 0;
			}
			var count = 1;
			var last = dataset[0].length - 2;
			// max to min
			for (var j = dataset.length -1; j >= -1; j--) {
				if (
					j >= 0 && 
					Number(dataset[j][last]) <= max + Math.abs(h1*count / bin_num)
				) {
					st[dataset[j][1]] += 1;
				} else {
					var u = 0;
					var l = 0;
					for(var prop in st) {
						svg.append("rect")
						   .attr("x", x_position + u*box_w) 
						   .attr("y", (bin_num-(count))*box_h)
						   .attr("width", st[prop]*box_w)
						   .attr("height", box_h)
						   .attr("stroke","black")
						   .attr("fill", explainer.colors[l]);
						u += st[prop];
						l++;
				   }
				   for(var prop in st) {
						st[prop] = 0;
				   }
				   if (j == -1) {
					   break;
				   }
				   count++;
				   j++;
			   }
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

		function boxdata(svg, dataset,x_pos, pred, min, max, h1, h2) {
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
				boxplot(svg, explainer.colors[0], p_info, x_pos+65, h1, h2, max, min);
				var n_info = {
					max_val: n1[0],
					Q3: n1[Math.floor(n1.length * 1 / 4)],
					Q2: n1[Math.floor(n1.length * 1 / 2)],
					Q1: n1[Math.floor(n1.length * 3 / 4)],
					min_val: n1[n1.length -1],
				};
				boxplot(svg, explainer.colors[2], n_info, x_pos+35, h1, h2, max, min);
			}
			
			var a1 = all_val.map(Number);
			var a_info = {
				max_val: a1[0],
				Q3: a1[Math.floor(a1.length * 1 / 4)],
				Q2: a1[Math.floor(a1.length * 1 / 2)],
				Q1: a1[Math.floor(a1.length * 3 / 4)],
				min_val: a1[a1.length -1],
			};
			boxplot(svg, explainer.colors[1], a_info, x_pos+5, h1, h2, max, min);
		}
		
		explainer.prototype.draw = function () {
			// since we cannot read 'this' inside d3.csv
			var svg = d3.select("body")
						.append("svg")
						.attr("width", this.svgW)
						.attr("height", this.svgH);
			var isBinNumSet = this.isCustomBinNum;
			var binNumC = this.binNum;
			var histVisibility = this.histVisibility;
			var boxplotVisibility = this.boxplotVisibility;
			var pathVisibility = this.pathVisibility;
			d3.csv(this.filename, function(data) {
			   // get column name
				var dataset = [];
				var genreColor = {};
				var dataValues = d3.values(data)[0];
				var exp = [];
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
						exp.push(col_names[i]);
					}
				}
				// get genre-color mapping
				var k = 0;
				var genres = data.map(function(d) { return  d[genre]; });
				for (var j = 0; j < genres.length; j++) {
					if (!(genres[j] in genreColor)) {
					   genreColor[genres[j]] = explainer.colors[k];
					   k++;
					}
				}

				var x_position = 0;
				for (var i = 0; i < exp.length; i++) {
					if (predicate !== "") {
						dataset =
							data.map(function(d,idx) { 
								return [d[item], 
										d[genre], 
										d[predicate],
										d[exp[i]],
										"d" + idx];
							});
					} else {
						dataset = 
							data.map(function(d,idx) { 
								return [d[item], d[genre], d[exp[i]], "d" + idx];
							});
					}

					var last = dataset[0].length - 2;
					dataset.sort(compare);
					var max = Number(dataset[dataset.length-1][last]);
					var min = Number(dataset[0][last]);
					var h1 = max - min;
					var data_height = 
						Math.ceil(dataset.length / Math.ceil(dataset.length / 30));
					var h2 = data_height < 30 ? 
						 height * data_height: height * 30;
					// stack box and lines
					stackbox(
						svg, dataset, x_position,
						genreColor, min, max, h1, h2, pathVisibility
					);
					x_position += Math.ceil(dataset.length / 30) * width + 100;
					// histogram
					if (histVisibility) {
						var maxWidth = 400; // this should be a parameter
						var bin_num = isBinNumSet
							? binNumC 
							: Math.floor(Math.sqrt(dataset.length-1)-1);
						histogramplot(
							svg, dataset, x_position, genreColor, maxWidth,
							min, max, h1, h2, isBinNumSet, binNumC
						);
						// assume max num is around half of the width
						x_position += maxWidth / (bin_num * 0.3); 
					}
					
					// box
					if (boxplotVisibility) {
						boxdata(svg, dataset, x_position, pred, min, max, h1, h2);
						x_position += 80;
					}
					
					// clean up
					dataset = [];
				}
			});
		}
		
        return explainer;
    }
    //define globally if it doesn't already exist
    if(typeof(explainer) === 'undefined'){
        window.explainer = define_library();
    }
    else{
        console.log("Library already defined.");
    }
})(window);
