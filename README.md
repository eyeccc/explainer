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
Please pre-allocate a svg canvas with enough space for your data. 
Then, type `explainer(yourCSVFileName)` in your javascript code.

## Note
1. The number of bins in the histogram is calculated by `sqrt(N-1)-1`, where
N is the number of data in the file.

2. Currently not giving users freedom to not showing some of the plot.

## Demo
![ScreenShot](https://github.com/eyeccc/explainer/blob/master/explainer.png)
