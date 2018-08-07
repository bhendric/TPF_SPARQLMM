// Set the export
var spatialFunctions = module.exports = {};
var _ = require('lodash');
/**
 * Start of spatial relation functions
 * We use a bounding box model. 
 **/

/**
 * Check if the left most x-coordinate of fragment 1 bigger than the right most x-coordinate of fragment 2.
 * This follows the bounding box model
 * 
 * @param {Media fragment object} frag1 
 * @param {Media fragment object} frag2 
 * @returns {boolean}
 */
spatialFunctions.rightBeside = function(frag1, frag2){
  if (frag1.base === frag2.base){
    return frag1.box.left() > frag2.box.right() ? true : false;
  }
  return false;
}

/**
 * Check if the right most x-coordinate of fragment 1 smaller than the left most x-coordinate of fragment 2.
 * This follows the bounding box model
 * 
 * @param {Media fragment object} frag1 
 * @param {Media fragment object} frag2 
 * @returns {boolean}
 */
spatialFunctions.leftBeside = function(frag1, frag2){
  if (frag1.base === frag2.base){
    return frag1.box.right() < frag2.box.left() ? true : false;
  }
  return false;
}

/**
 * Check if y-coordinate of fragment 1 is bigger than the y-coordinate of fragment 2 + height
 * This follows the bounding box model
 * 
 * @param {Media fragment object} frag1 
 * @param {Media fragment object} frag2 
 * @returns {boolean}
 */
spatialFunctions.below = function(frag1, frag2){
  if (frag1.base === frag2.base){
    return frag1.box.top() > frag2.box.bottom() ? true : false;
  }
  return false;
}

/**
 * Check if y-coordinate of fragment 1 + height is smaller than the y-coordinate of fragment 2
 * This follows the bounding box model
 * 
 * @param {Media fragment object} frag1 
 * @param {Media fragment object} frag2 
 * @returns {boolean}
 */
spatialFunctions.above = function(frag1, frag2){
  if (frag1.base === frag2.base){
    return frag1.box.bottom() < frag2.box.top() ? true : false;
  }
  return false;
}

spatialFunctions.leftAbove = function(frag1, frag2){
  return (spatialFunctions.leftBeside(frag1, frag2) && spatialFunctions.above(frag1, frag2)) ? true : false;
}

spatialFunctions.rightAbove = function(frag1, frag2){
  return (spatialFunctions.rightBeside(frag1, frag2) && spatialFunctions.above(frag1, frag2)) ? true : false;
}

spatialFunctions.leftBelow = function(frag1, frag2){
  return (spatialFunctions.leftBeside(frag1, frag2) && spatialFunctions.below(frag1, frag2)) ? true : false;
}

spatialFunctions.rightBelow = function(frag1, frag2){
  return (spatialFunctions.rightBeside(frag1, frag2) && spatialFunctions.below(frag1, frag2)) ? true : false;
}

/**
 * Implementing spatial topological functions
 * equals, disjoint, contains, covers, intersects, within, coveredBy, crosses, overlaps
 */

 /**
  * Use the equivalent function of rectangle-node to check for equal bounding boxes
  */
 spatialFunctions.equals = function(frag1, frag2){
   return frag1.box.equivalent(frag2.box);
 }

 /**
  * Use the intersection function of the rectangle-node module and check if it returns null.
  * @param {Media fragment object} frag1 
  * @param {Media fragment object} frag2 
  */
 spatialFunctions.disjoint = function(frag1, frag2){
   return frag1.box.intersection(frag2.box) == null;
 }

 /**
  * Function that will check if the bounding box of fragment 2 can be contained in the bounding box of fragment 1
  * @param {Media fragment object} frag1 
  * @param {Media fragment object} frag2 
  */
 spatialFunctions.contains = function(frag1, frag2){
  return frag1.box.intersection(frag2.box) !== null;
 }

 /**
  * This function will see if fragment 1 completely covers fragment 2
  * @param {Media fragment object} frag1 
  * @param {Media fragment object} frag2 
  */
 spatialFunctions.covers = function(frag1, frag2){
  if(frag1.box.left() <= frag2.box.left()){
    if(frag1.box.top() <= frag2.box.top()){
      if(frag1.box.right() >= frag2.box.right()){
        if(frag1.box.bottom() >= frag2.box.bottom()){
          return true;
        }
      }
    }
  }
  return false;
 }

 spatialFunctions.intersects = function(frag1, frag2){
  return frag1.box.intersection(frag2.box) !== null;
 }

 /**
  * In order to check if fragment 1 is within fragment 2, we need to check if fragment 2 covers fragment 1
  * @param {Media fragment object} frag1 
  * @param {Media fragment object} frag2 
  */
 spatialFunctions.within = function(frag1, frag2){
  return spatialFunctions.covers(frag2, frag1)
 }

 /**
  * Check if fragment 1 is covered by fragment 2
  * @param {Media fragment object} frag1 
  * @param {Media fragment object} frag2 
  */
 spatialFunctions.coveredBy = function(frag1, frag2){
  return spatialFunctions.covers(frag2, frag1)
 }

 spatialFunctions.crosses = function(frag1, frag2){
   return frag1.box.intersection(frag2.box) !== null;
 }

 spatialFunctions.overlaps = function(frag1, frag2){
   return (frag1.box.intersection(frag2.box) !== null && _.isEqual(frag1.box,frag2.box) !== true)
 }