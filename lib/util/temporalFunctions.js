// Set the export
var temporalFunctions = module.exports = {};

/**
 * Start of temporal relation functions
 **/

/**
 * Check if end frag1 is before start frag2
 * 
 * @param {Media fragment object} frag1 
 * @param {Media fragment object} frag2 
 * @returns {boolean}
 */
temporalFunctions.precedes = function (frag1, frag2) {
  if (frag1.base === frag2.base) {
    return frag1.end < frag2.start ? true : false;
  }
  return false;
};

/**
 * Check if end frag2 is before start frag1
 * 
 * @param {Media fragment object} frag1 
 * @param {Media fragment object} frag2 
 * @returns {boolean}
 */
temporalFunctions.precededBy = function (frag1, frag2) {
  if (frag1.base === frag2.base) {
    return temporalFunctions.precedes(frag2, frag1)
  }
  return false;
};

/**
 * Check if fragment 1 overlaps with fragment 2
 * 
 * @param {Media fragment object} frag1 
 * @param {Media fragment object} frag2 
 * @returns {boolean}
 */
temporalFunctions.overlaps = function (frag1, frag2) {
  if (frag1.base === frag2.base) {
    return (frag1.start < frag2.start) && (frag2.start < frag1.end) && (frag1.end < frag2.end) ? true : false;
  }
  return false;
};

/**
 * Check if fragment 2 overlaps with fragment 1
 * 
 * @param {Media fragment object} frag1 
 * @param {Media fragment object} frag2 
 * @returns {boolean}
 */
temporalFunctions.overlappedBy = function (frag1, frag2) {
  if (frag1.base === frag2.base) {
    return temporalFunctions.overlaps(frag2, frag1)
  }
  return false;
};

/**
 * Check if fragment 1 meets with fragment 2
 * 
 * @param {Media fragment object} frag1 
 * @param {Media fragment object} frag2 
 * @returns {boolean}
 */
temporalFunctions.meets = function (frag1, frag2) {
  if (frag1.base === frag2.base) {
    return frag1.end === frag2.start ? true : false;
  }
  return false;
};

/**
 * Check if fragment 2 meets with fragment 1
 * 
 * @param {Media fragment object} frag1 
 * @param {Media fragment object} frag2 
 * @returns {boolean}
 */
temporalFunctions.metBy = function (frag1, frag2) {
  if (frag1.base === frag2.base) {
    return temporalFunctions.meets(frag2, frag1)
  }
  return false;
};

/**
 * Check if fragment 2 finishes at the same time as fragment 1
 * 
 * @param {Media fragment object} frag1 
 * @param {Media fragment object} frag2 
 * @returns {boolean}
 */
temporalFunctions.finishes = function (frag1, frag2) {
  if (frag1.base === frag2.base) {
    return frag1.end === frag2.end && frag1.start > frag2.start ? true : false;
  }
  return false;
};

/**
 * Check if fragment 1 finishes as the same time as fragment 2
 * 
 * @param {Media fragment object} frag1 
 * @param {Media fragment object} frag2 
 * @returns {boolean}
 */
temporalFunctions.finishedBy = function (frag1, frag2) {
  if (frag1.base === frag2.base) {
    return temporalFunctions.finishes(frag2, frag1)
  }
  return false;
};

/**
 * Check if fragment 1 contains fragment 2
 * 
 * @param {Media fragment object} frag1 
 * @param {Media fragment object} frag2 
 * @returns {boolean}
 */
temporalFunctions.contains = function (frag1, frag2) {
  if (frag1.base === frag2.base) {
    return (frag1.start < frag2.start) && (frag1.end > frag2.end) ? true : false;
  }
  return false;
};

/**
 * Check if fragment 2 is situated during fragment 1
 * 
 * @param {Media fragment object} frag1 
 * @param {Media fragment object} frag2 
 * @returns {boolean}
 */
temporalFunctions.during = function (frag1, frag2) {
  if (frag1.base === frag2.base) {
    return (frag2.start < frag1.start) && (frag1.end < frag2.end) ? true : false
  }
  return false;
};

/**
 * Check if fragment 2 starts at the same time as fragment 1
 * 
 * @param {Media fragment object} frag1 
 * @param {Media fragment object} frag2 
 * @returns {boolean}
 */
temporalFunctions.starts = function (frag1, frag2) {
  if (frag1.base === frag2.base) {
    return frag1.start === frag2.start && frag1.end < frag2.end ? true : false;
  }
  return false;
};

/**
 * Check if fragment 1 starts at the same time as fragment 2
 * 
 * @param {Media fragment object} frag1 
 * @param {Media fragment object} frag2 
 * @returns {boolean}
 */
temporalFunctions.startedBy = function (frag1, frag2) {
  if (frag1.base === frag2.base) {
    return temporalFunctions.starts(frag2, frag1)
  }
  return false;
};

/**
 * Check if fragment 1 and fragment 2 have the same start and end time
 * 
 * @param {Media fragment object} frag1 
 * @param {Media fragment object} frag2 
 * @returns {boolean}
 */
temporalFunctions.equals = function (frag1, frag2) {
  if (frag1.base === frag2.base) {
    return (frag1.start === frag2.start) && (frag1.end === frag2.end) ? true : false;
  }
  return false;
};

/**
 * Start of temporal aggregation functions
 */

/**
* get the intermediate of the two fragments
* 
* @param {Media fragment object} frag1 
* @param {Media fragment object} frag2 
* @returns {boolean}
*/
temporalFunctions.intermediate = function (frag1, frag2) {
  if (frag1.base === frag2.base) {
    if (temporalFunctions.precededBy(frag1, frag2)) {
      return { start: frag2.end, end: frag1.start };
    } else if (temporalFunctions.precededBy(frag2, frag1)) {
      return { start: frag1.end, end: frag2.start };
    } else {
      return "No intermediate";
    }
  }
  return false;
};

/**
 * get the intersection of the two fragments
 * 
 * @param {Media fragment object} frag1 
 * @param {Media fragment object} frag2 
 * @returns {boolean}
 */
temporalFunctions.intersection = function (frag1, frag2) {
  if (frag1.base === frag2.base) {
    if (temporalFunctions.overlaps(frag1, frag2) || temporalFunctions.overlappedBy(frag1, frag2)) {
      return { start: Math.max(frag1.start, frag2.start), end: Math.min(frag1.end, frag2.end) };
    } else {
      return "No intersection";
    }
  }
  return false;
};