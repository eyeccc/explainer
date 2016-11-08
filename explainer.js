(function(window){
    'use strict';
    function define_library(){
		var explainer = function explainer() {
			this.svgW = 100;
			this.svgH = 100;
			this.binNum = 0;
			this.rows = 30;
			this.xpos = 0;
			this.ypos = 0;
			this.isCustomBinNum = false;
			this.pathVisibility = true;
			this.histVisibility = true;
			this.boxplotVisibility = true;
			this.genreBoxplotVisibility = true;
			this.filename = "";
			this.createSVG = true;
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

		explainer.prototype.setSVGSize = function(w, h) {
			this.svgW = w;
			this.svgH = h;
		}
		
		explainer.prototype.setStartingCoord = function(x,y) {
			this.xpos = x;
			this.ypos = y;
		}
		
		explainer.prototype.unsetNewSVG = function(w, h) {
			this.createSVG = false;
		}
		
		explainer.prototype.setMaxRows = function(n) {
			this.rows = n;
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
		
		explainer.prototype.setGenreBoxplotInvisible = function() {
			this.genreBoxplotVisibility = false;
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
			y_pos,
			genreColor,
			min,
			max,
			h1,
			h2,
			pathVisibility,
			maxRows
		) {
			var last = dataset[0].length - 2;
			var lineSet = 0;
			var colsInRow = Math.ceil(dataset.length / maxRows); 
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
					   .attr("y",y_pos+Math.floor(j/colsInRow)*height)
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
						lineSet = 1;
						var curveData = [
							{x:x_position+width*colsInRow,
							 y:y_pos+Math.floor(j/colsInRow)*height+0.5*height
							},
							{x:x_position+width*colsInRow+100,  y:y_pos+y_new}
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
					   .attr("width",dataset[j+k][0].length * 8) // should fix this
					   .attr("fill","#e3e7ed")
					   .attr("rx",5)
					   .attr("ry",5)
					   .attr("class", "t" + cname)
					   .attr("x",x_position + k*width + 10)
					   .attr("y",y_pos+Math.floor(j/colsInRow)*height+2 + 5)
					   .style("opacity", 0.7)
					   .style("visibility","hidden");
					svg.append("text")
					   .attr("class", "t" + cname)
					   .attr("x",x_position + k*width + 5 + 10)
					   .attr("y",y_pos+15+Math.floor(j/colsInRow)*height + 5)
					   .text(dataset[j+k][0])
					   .style("font-size","12px")
					   .style("visibility","hidden");
				}
				j+= colsInRow-1;
		   }
		   return x_position + colsInRow * width + lineSet*100;
		}
		
		function histogramplot(
			svg,
			dataset,
			x_position,
			y_pos,
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
			   .attr("y1",y_pos+0)
			   .attr("x2",x_position)
			   .attr("y2",y_pos+h2)
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
			var binEleNum = 0;
			var maxNum = 0;
			// max to min
			for (var j = dataset.length -1; j >= -1; j--) {
				if (
					j >= 0 && 
					Number(dataset[j][last]) <= max + Math.abs(h1*count / bin_num)
				) {
					st[dataset[j][1]] += 1;
					binEleNum++;
				} else {
					if (maxNum < binEleNum) {
						maxNum = binEleNum;
					}
					binEleNum = 0;
					var u = 0;
					var l = 0;
					for(var prop in st) {
						svg.append("rect")
						   .attr("x", x_position + u*box_w) 
						   .attr("y", y_pos+(bin_num-(count))*box_h)
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
			return x_position + maxNum * box_w + 10;
		}

		function boxplot(svg, color, info, x_pos, y_pos, h1, h2, max, min) {
			svg.append("rect")
			   .attr("height",Math.abs((info.Q3 - info.Q2)/ h1 * h2))
			   .attr("width",20)
			   .attr("fill",color)
			   .attr("stroke","black")
			   .attr("x",x_pos)
			   .attr("y",y_pos+h2 - ((info.Q3 - max)/ (-h1) * h2)) 
			svg.append("rect")
			   .attr("height",Math.abs((info.Q2 - info.Q1)/ h1 * h2))
			   .attr("width",20)
			   .attr("fill",color)
			   .attr("stroke","black")
			   .attr("x",x_pos)
			   .attr("y",y_pos+h2 - ((info.Q2 - max)/ (-h1) * h2))
			svg.append("line")
			   .attr("x1",x_pos)
			   .attr("y1",y_pos+h2 - ((info.min_val - max)/ (-h1) * h2))
			   .attr("x2",x_pos + 20)
			   .attr("y2",y_pos+h2 - ((info.min_val - max)/ (-h1) * h2))
			   .attr("stroke-width", 1)
			   .attr("stroke", "black")
			svg.append("line")
			   .attr("x1",x_pos)
			   .attr("y1",y_pos+h2-((info.max_val - max)/ (-h1) * h2))
			   .attr("x2",x_pos+20)
			   .attr("y2",y_pos+h2-((info.max_val - max)/ (-h1) * h2))
			   .attr("stroke-width", 1)
			   .attr("stroke", "black")
			svg.append("line")
			   .attr("x1",x_pos+10)
			   .attr("y1",y_pos+h2 - ((info.max_val - max)/ (-h1) * h2))
			   .attr("x2",x_pos+10)
			   .attr("y2",
					 y_pos+h2 - ((info.max_val - max)/ (-h1) * h2)
					 + Math.abs((info.max_val - info.Q3)/ h1 * h2)
					)
			   .attr("stroke-width", 1)
			   .attr("stroke", "black")
			svg.append("line")
			   .attr("x1",x_pos+10)
			   .attr("y1",y_pos+h2 - ((info.Q1 - max)/ (-h1) * h2))
			   .attr("x2",x_pos+10)
			   .attr("y2",
					 y_pos+h2 - ((info.Q1 - max)/ (-h1) * h2)
					 + Math.abs((info.Q1 - info.min_val)/ h1 * h2)
					)
			   .attr("stroke-width", 1)
			   .attr("stroke", "black")
		}

		function boxdata(
			svg, 
			dataset,
			x_pos, 
			y_pos,
			pred, 
			min, 
			max, 
			h1, 
			h2, 
			genreColor, 
			numGenre,
			genreBoxplotVisibility
		) {
			var positive = [];
			var negative = [];
			var all_val = [];
			var genre_val = [];
			var last = dataset[0].length -2;
			var st = clone(genreColor);
			var c = 0;
			var colors = [];
			for(var prop in st) {
				st[prop] = c;
				colors.push(genreColor[prop]);
				genre_val.push([]);
				c++;
			}
			for (var j = 0;j < dataset.length; j++) {
				if (pred > 0) {
					if (Number(dataset[j][2]) > 0) {
						positive.push(dataset[j][last]);
					} else {
						negative.push(dataset[j][last]);
					}
				}
				genre_val[st[dataset[j][1]]].push(dataset[j][last]);
				all_val.push(dataset[j][last]);
			}
			
			// plot box plot by genre
			if (genreBoxplotVisibility) {
				for (var m = 0; m < numGenre; m++) {
					var tmp = genre_val[m].map(Number);
					var info = {
						max_val: tmp[0],
						Q3: tmp[Math.floor(tmp.length * 1 / 4)],
						Q2: tmp[Math.floor(tmp.length * 1 / 2)],
						Q1: tmp[Math.floor(tmp.length * 3 / 4)],
						min_val: tmp[tmp.length -1],
					};
					boxplot(svg, colors[m], info, x_pos+5, y_pos, h1, h2, max, min);
					x_pos += 30;
				}
				// to separate genres and aggregated boxplot
				x_pos += 15;
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
				boxplot(svg, "#a1d76a", p_info, x_pos, y_pos, h1, h2, max, min);
				x_pos += 30;
				var n_info = {
					max_val: n1[0],
					Q3: n1[Math.floor(n1.length * 1 / 4)],
					Q2: n1[Math.floor(n1.length * 1 / 2)],
					Q1: n1[Math.floor(n1.length * 3 / 4)],
					min_val: n1[n1.length -1],
				};
				boxplot(svg, "#e9a3c9", n_info, x_pos, y_pos, h1, h2, max, min);
				x_pos += 30;
			}
			
			var a1 = all_val.map(Number);
			var a_info = {
				max_val: a1[0],
				Q3: a1[Math.floor(a1.length * 1 / 4)],
				Q2: a1[Math.floor(a1.length * 1 / 2)],
				Q1: a1[Math.floor(a1.length * 3 / 4)],
				min_val: a1[a1.length -1],
			};
			boxplot(svg, "#f7f7f7", a_info, x_pos, y_pos, h1, h2, max, min);
			x_pos += 30;
			return x_pos;
		}
		
		explainer.prototype.draw = function () {
			// since we cannot read 'this' inside d3.csv
			// TODO: should separate d3.csv and other function
			var svg = this.createSVG 
				? d3.select("body")
					.append("svg")
					.attr("width", this.svgW)
					.attr("height", this.svgH)
				: d3.select("svg");
			var isBinNumSet = this.isCustomBinNum;
			var binNumC = this.binNum;
			var histVisibility = this.histVisibility;
			var boxplotVisibility = this.boxplotVisibility;
			var genreBoxplotVisibility = this.genreBoxplotVisibility;
			var pathVisibility = this.pathVisibility;
			var maxRows = this.rows;
			var x_position = this.xpos;
			var y_position = this.ypos;
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
				var k = 0; // number of genre
				var genres = data.map(function(d) { return  d[genre]; });
				for (var j = 0; j < genres.length; j++) {
					if (!(genres[j] in genreColor)) {
					   genreColor[genres[j]] = explainer.colors[k];
					   k++;
					}
				}

				
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
						Math.ceil(
							dataset.length / Math.ceil(dataset.length / maxRows)
						);
					var h2 = data_height < maxRows ? 
						 height * data_height: height * maxRows;
					// stack box and lines
					x_position = stackbox(
						svg, dataset, x_position, y_position,
						genreColor, min, max, h1, h2, 
						pathVisibility, maxRows
					);

					// histogram
					if (histVisibility) {
						var maxWidth = 400; // this should be a parameter
						var bin_num = isBinNumSet
							? binNumC 
							: Math.floor(Math.sqrt(dataset.length-1)-1);
						x_position = histogramplot(
							svg, dataset, x_position, y_position,
							genreColor, maxWidth, min, max, h1, h2, 
							isBinNumSet, binNumC
						);
					}
					
					// box
					if (boxplotVisibility) {
						x_position = boxdata(
							svg, dataset, x_position, y_position, 
							pred, min, max, 
							h1, h2, genreColor, k, // number of genre
							genreBoxplotVisibility
						);
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
