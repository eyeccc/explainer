# explainer
implement explainer: http://graphics.cs.wisc.edu/Vis/Explainers/

## Input csv restriction
The expected input should have a name, a category, a predicate (optional), 
and multiple columns of explainer values.

Column name must be: 
- "item" (for name)
- "genre" (for category)
- "predicate" (for predicate)
- any names for explainer values

Uppercase / lowercase does not matter.

This could support at most 12 genres in the data (due to the restriction of
colors).

## Usage
Please make sure to have `<body>` in your html file.

```
var obj1 = new explainer();
obj1.setPathInvisible(); // there won't be lines between small boxes and histogram
obj1.setBoxplotInvisible(); // there won't be box plot
obj1.setHistInvisible(); // there won't be histogram
obj1.setCSV("heyImCSVfile.csv"); // your csv file
obj1.setSVGSize(500,300); // append a svg canvas with width = 500, height = 300, only work when we create a new SVG
obj1.unsetNewSVG(); // use existing svg instead of creating a new one
obj1.setHistBinNum(20); // set number of histogram bins as 20
obj1.setGenreBoxplotInvisible(); // boxplot by genre will not show up
obj1.setMaxRows(5); // the max number of rows for the stacked boxes will be 5

// please set all your preference before drawing
obj1.draw();

```

Please see `explainer_prac.html` for simple example.

## Note
1. The default number of bins in the histogram is calculated by `sqrt(N-1)-1`, where
N is the number of data in the file.

2. Default svg size is width = 100 and height = 100. By default, it will create a new SVG canvas.

3. Default max row number is 30.

4. Different object will create different SVG canvas.

5. If there is predicate, for the box plots green (`#a1d76a`) will be positive,
pink (`#e9a3c9`) for negative, and white (`#f7f7f7`) for all.

## Demo
![ScreenShot](https://github.com/eyeccc/explainer/blob/master/explainer.png)
