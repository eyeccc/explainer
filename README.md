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
Please include d3.js and explainer.js and 
make sure to have `<body>` or `<svg>` in your html file.

`setPathInvisible()` : set the lines between small boxes and histogram invisible

`setBoxplotInvisible()`: set box plot invisible

`setHistInvisible()` : set histogram invisible

`setCSV("heyImCSVfile.csv")` : set the input csv file name

`setItemColName("yourTitle")` : set the item / title column name

`setGenreColName("yourGenre")`: set the genre column name

`setExplainerColNames(["P1","P2"])` : set the explainer values column names

`setSVGSize(width,height)` : set the size of new SVG if you would like to create one

`unsetNewSVG()` : use existing svg instead of creating a new one

`setHistBinNum(number)` : set number of histogram bins

`setGenreBoxplotInvisible()` : set boxplot of each genre invisible

`setMaxRows(number)`: set max number of rows for the stacked boxes

`setStartingCoord(x_position, y_position)` : set the starting point to draw

Please set all your preference before drawing

`draw()` : draw everything

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
