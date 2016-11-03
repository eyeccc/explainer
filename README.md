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
obj1.appendSVG(500,300); // append a svg canvas with width = 500, height = 300
obj1.setHistBinNum(20); // set number of histogram bins as 20

// please set all your preference before drawing
obj1.draw();

```

Please see `explainer_prac.html` for simple example.

## Note
1. The default number of bins in the histogram is calculated by `sqrt(N-1)-1`, where
N is the number of data in the file.

2. Default svg size is width = 100 and height = 100.

## Demo
![ScreenShot](https://github.com/eyeccc/explainer/blob/master/explainer.png)
