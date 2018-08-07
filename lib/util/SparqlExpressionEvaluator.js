/*! @license MIT ©2014-2016 Ruben Verborgh, Ghent University - imec */

var N3Util = require('n3').Util,
  createErrorType = require('./CustomError');

var mediaFragmentExtractor = require('./MediafragmentExtractor.js');
var spatialFunctions = require('./spatialFunctions.js');
var temporalFunctions = require('./temporalFunctions.js');
var XSD = 'http://www.w3.org/2001/XMLSchema#',
  XSD_INTEGER = XSD + 'integer',
  XSD_DOUBLE = XSD + 'double',
  XSD_BOOLEAN = XSD + 'boolean',
  XSD_TRUE = '"true"^^' + XSD_BOOLEAN,
  XSD_FALSE = '"false"^^' + XSD_BOOLEAN;

var evaluators, operators,
  UnsupportedExpressionError, UnsupportedOperatorError, InvalidArgumentsNumberError;

var isLiteral = N3Util.isLiteral,
  literalValue = N3Util.getLiteralValue;

/**
 * Creates a function that evaluates the given SPARQL expression.
 * @constructor
 * @param expression a SPARQL expression
 * @returns {Function} a function that evaluates the SPARQL expression.
 */
function SparqlExpressionEvaluator(expression) {
  if (!expression) return noop;
  var expressionType = expression && expression.type || typeof expression,
    evaluator = evaluators[expressionType];
  if (!evaluator) throw new UnsupportedExpressionError(expressionType);
  return evaluator(expression);
}

// Evaluates the expression with the given bindings
SparqlExpressionEvaluator.evaluate = function (expression, bindings) {
  return new SparqlExpressionEvaluator(expression)(bindings);
};

// The null operation
function noop() { }

// Evaluators for each of the expression types
evaluators = {
  // Does nothing
  null: function () { return noop; },

  // Evaluates an IRI, literal, or variable
  string: function (expression) {
    // Evaluate a IRIs or literal to its own value
    if (expression[0] !== '?')
      return function () { return expression; };
    // Evaluate a variable to its value
    else
      return function (bindings) { return bindings && bindings[expression]; };
  },

  // Evaluates an operation
  operation: function (expression) {
    // Find the operator and check the number of arguments matches the expression
    var operatorName = expression.operator || expression.function,
      operator = operators[operatorName];
    if (!operator)
      throw new UnsupportedOperatorError(operatorName);
    if (operator.length !== expression.args.length)
      throw new InvalidArgumentsNumberError(operatorName, expression.args.length, operator.length);

    // Special case: some operators accept expressions instead of evaluated expressions
    if (operator.acceptsExpressions) {
      return (function (operator, args) {
        return function (bindings) {
          return operator.apply(bindings, args);
        };
      })(operator, expression.args);
    }

    // Parse the expressions for each of the arguments
    var argumentExpressions = new Array(expression.args.length);
    for (var i = 0; i < expression.args.length; i++)
      argumentExpressions[i] = new SparqlExpressionEvaluator(expression.args[i]);

    // Create a function that evaluates the operator with the arguments and bindings
    return (function (operator, argumentExpressions) {
      return function (bindings) {
        // Evaluate the arguments
        var args = new Array(argumentExpressions.length),
          origArgs = new Array(argumentExpressions.length);
        for (var i = 0; i < argumentExpressions.length; i++) {
          var arg = args[i] = origArgs[i] = argumentExpressions[i](bindings);
          // If any argument is undefined, the result is undefined
          if (arg === undefined) return;
          // Convert the arguments if necessary
          switch (operator.type) {
            case 'numeric':
              args[i] = parseFloat(literalValue(arg));
              break;
            case 'boolean':
              args[i] = arg !== XSD_FALSE &&
                (!isLiteral(arg) || literalValue(arg) !== '0');
              break;
          }
        }
        // Call the operator on the evaluated arguments
        var result = operator.apply(null, args);
        // Convert result if necessary
        switch (operator.resultType) {
          case 'numeric':
            // TODO: determine type instead of taking the type of the first argument
            var type = N3Util.getLiteralType(origArgs[0]) || XSD_INTEGER;
            return '"' + result + '"^^' + type;
          case 'boolean':
            return result ? XSD_TRUE : XSD_FALSE;
          default:
            return result;
        }
      };
    })(operator, argumentExpressions);
  },
};
evaluators.functionCall = evaluators.operation;

// Operators for each of the operator types
operators = {
  '+': function (a, b) { return a + b; },
  '-': function (a, b) { return a - b; },
  '*': function (a, b) { return a * b; },
  '/': function (a, b) { return a / b; },
  '=': function (a, b) { return a === b; },
  '!=': function (a, b) { return a !== b; },
  '<': function (a, b) { return a < b; },
  '<=': function (a, b) { return a <= b; },
  '>': function (a, b) { return a > b; },
  '>=': function (a, b) { return a >= b; },
  '!': function (a) { return !a; },
  '&&': function (a, b) { return a && b; },
  '||': function (a, b) { return a || b; },
  'lang': function (a) {
    return '"' + N3Util.getLiteralLanguage(a).toLowerCase() + '"';
  },
  'langmatches': function (langTag, langRange) {
    // Implements https://tools.ietf.org/html/rfc4647#section-3.3.1
    langTag = langTag.toLowerCase();
    langRange = langRange.toLowerCase();
    return langTag === langRange ||
      (langRange = literalValue(langRange)) === '*' ||
      langTag.substr(1, langRange.length + 1) === langRange + '-';
  },
  'contains': function (string, substring) {
    substring = literalValue(substring);
    string = literalValue(string);
    return string.indexOf(substring) >= 0;
  },
  'regex': function (subject, pattern) {
    if (isLiteral(subject))
      subject = literalValue(subject);
    return new RegExp(literalValue(pattern)).test(subject);
  },
  'str': function (a) {
    return isLiteral(a) ? a : '"' + a + '"';
  },
  'http://www.w3.org/2001/XMLSchema#integer': function (a) {
    return '"' + Math.floor(a) + '"^^http://www.w3.org/2001/XMLSchema#integer';
  },
  'http://www.w3.org/2001/XMLSchema#double': function (a) {
    a = a.toFixed();
    if (a.indexOf('.') < 0) a += '.0';
    return '"' + a + '"^^http://www.w3.org/2001/XMLSchema#double';
  },

  /**
   * Start of SPARQL-MM spatial relation functions
   */
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#rightBeside': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "spatial" || url_obj_a.type === "combined") && (url_obj_b.type === "spatial" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base){
      if ((url_obj_a.subtype === "percent" && url_obj_b.subtype === "percent") || (url_obj_a.subtype === "pixel" && url_obj_b.subtype === "pixel"))
        return spatialFunctions.rightBeside(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
      else
        return XSD_FALSE;
    }else{
      return XSD_FALSE;
    }
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#leftBeside': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "spatial" || url_obj_a.type === "combined") && (url_obj_b.type === "spatial" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base){
      if ((url_obj_a.subtype === "percent" && url_obj_b.subtype === "percent") || (url_obj_a.subtype === "pixel" && url_obj_b.subtype === "pixel"))
        return spatialFunctions.leftBeside(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
      else
        return XSD_FALSE;
    }else{
      return XSD_FALSE;
    }
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#above': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "spatial" || url_obj_a.type === "combined") && (url_obj_b.type === "spatial" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base){
      if ((url_obj_a.subtype === "percent" && url_obj_b.subtype === "percent") || (url_obj_a.subtype === "pixel" && url_obj_b.subtype === "pixel"))
        return spatialFunctions.above(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
      else
        return XSD_FALSE;
    }else{
      return XSD_FALSE;
    }
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#below': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "spatial" || url_obj_a.type === "combined") && (url_obj_b.type === "spatial" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base){
      if ((url_obj_a.subtype === "percent" && url_obj_b.subtype === "percent") || (url_obj_a.subtype === "pixel" && url_obj_b.subtype === "pixel"))
        return spatialFunctions.below(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
      else
        return XSD_FALSE;
    }else{
      return XSD_FALSE;
    }
  
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#leftAbove': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "spatial" || url_obj_a.type === "combined") && (url_obj_b.type === "spatial" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base){
      if ((url_obj_a.subtype === "percent" && url_obj_b.subtype === "percent") || (url_obj_a.subtype === "pixel" && url_obj_b.subtype === "pixel"))
        return spatialFunctions.leftAbove(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
      else
        return XSD_FALSE;
    }else{
      return XSD_FALSE;
    }
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#rightAbove': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "spatial" || url_obj_a.type === "combined") && (url_obj_b.type === "spatial" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base){
      if ((url_obj_a.subtype === "percent" && url_obj_b.subtype === "percent") || (url_obj_a.subtype === "pixel" && url_obj_b.subtype === "pixel"))
        return spatialFunctions.rightAbove(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
      else
        return XSD_FALSE;
    }else{
      return XSD_FALSE;
    }
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#leftBelow': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "spatial" || url_obj_a.type === "combined") && (url_obj_b.type === "spatial" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base){
      if ((url_obj_a.subtype === "percent" && url_obj_b.subtype === "percent") || (url_obj_a.subtype === "pixel" && url_obj_b.subtype === "pixel"))
        return spatialFunctions.leftBelow(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
      else
        return XSD_FALSE;

      }else{
      return XSD_FALSE;
    }
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#rightBelow': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "spatial" || url_obj_a.type === "combined") && (url_obj_b.type === "spatial" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base){
      if ((url_obj_a.subtype === "percent" && url_obj_b.subtype === "percent") || (url_obj_a.subtype === "pixel" && url_obj_b.subtype === "pixel"))
        return spatialFunctions.rightBelow(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
      else
        return XSD_FALSE;
    }else{
      return XSD_FALSE;
    }
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#spatialEquals': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "spatial" || url_obj_a.type === "combined") && (url_obj_b.type === "spatial" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base){
      if ((url_obj_a.subtype === "percent" && url_obj_b.subtype === "percent") || (url_obj_a.subtype === "pixel" && url_obj_b.subtype === "pixel"))
        return spatialFunctions.equals(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
      else
        return XSD_FALSE;
    }else{
      return XSD_FALSE;
    }
  
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#spatialDisjoint': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "spatial" || url_obj_a.type === "combined") && (url_obj_b.type === "spatial" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base){
      if ((url_obj_a.subtype === "percent" && url_obj_b.subtype === "percent") || (url_obj_a.subtype === "pixel" && url_obj_b.subtype === "pixel"))
        return spatialFunctions.disjoint(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
      else
        return XSD_FALSE;
    }else{
      return XSD_FALSE;
    }
  
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#spatialContains': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "spatial" || url_obj_a.type === "combined") && (url_obj_b.type === "spatial" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base){
      if ((url_obj_a.subtype === "percent" && url_obj_b.subtype === "percent") || (url_obj_a.subtype === "pixel" && url_obj_b.subtype === "pixel"))
        return spatialFunctions.contains(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
      else
        return XSD_FALSE;
    }else{
      return XSD_FALSE;
    }
  
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#covers': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "spatial" || url_obj_a.type === "combined") && (url_obj_b.type === "spatial" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base){
      if ((url_obj_a.subtype === "percent" && url_obj_b.subtype === "percent") || (url_obj_a.subtype === "pixel" && url_obj_b.subtype === "pixel"))
        return spatialFunctions.covers(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
      else
        return XSD_FALSE;
    }else{
      return XSD_FALSE;
    }
  
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#intersects': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "spatial" || url_obj_a.type === "combined") && (url_obj_b.type === "spatial" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base){
      if ((url_obj_a.subtype === "percent" && url_obj_b.subtype === "percent") || (url_obj_a.subtype === "pixel" && url_obj_b.subtype === "pixel"))
        return spatialFunctions.intersects(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
      else
        return XSD_FALSE;
    }else{
      return XSD_FALSE;
    }
  
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#within': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "spatial" || url_obj_a.type === "combined") && (url_obj_b.type === "spatial" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base){
      if ((url_obj_a.subtype === "percent" && url_obj_b.subtype === "percent") || (url_obj_a.subtype === "pixel" && url_obj_b.subtype === "pixel"))
        return spatialFunctions.within(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
      else
        return XSD_FALSE;
    }else{
      return XSD_FALSE;
    }
  
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#coveredBy': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "spatial" || url_obj_a.type === "combined") && (url_obj_b.type === "spatial" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base){
      if ((url_obj_a.subtype === "percent" && url_obj_b.subtype === "percent") || (url_obj_a.subtype === "pixel" && url_obj_b.subtype === "pixel"))
        return spatialFunctions.coveredBy(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
      else
        return XSD_FALSE;
    }else{
      return XSD_FALSE;
    }
  
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#crosses': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "spatial" || url_obj_a.type === "combined") && (url_obj_b.type === "spatial" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base){
      if ((url_obj_a.subtype === "percent" && url_obj_b.subtype === "percent") || (url_obj_a.subtype === "pixel" && url_obj_b.subtype === "pixel"))
        return spatialFunctions.crosses(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
      else
        return XSD_FALSE;
    }else{
      return XSD_FALSE;
    }
  
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#spatialOverlaps': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "spatial" || url_obj_a.type === "combined") && (url_obj_b.type === "spatial" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base){
      if ((url_obj_a.subtype === "percent" && url_obj_b.subtype === "percent") || (url_obj_a.subtype === "pixel" && url_obj_b.subtype === "pixel"))
        return spatialFunctions.overlaps(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
      else
        return XSD_FALSE;
    }else{
      return XSD_FALSE;
    }
  
  },

  /**
   *  Accessor functions for spatial domain SPARQL-MM. These functions will always return literals as they are used to answer to functions defined in the SELECT variables
   * */
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#area': function (a) {
    var url_obj = mediaFragmentExtractor.toObject(a);
    if (url_obj.type === "spatial" || url_obj.type === "combined") {
      var area = url_obj.box.area();
      // If the spatial coordinates are all given as percentual values, the percentual area will be returned
      if (url_obj.subtype === "percent")
        area = area / 100.0;
      return "" + area + "";
    } else {
      return "";
    }
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#center': function (a) {
    var url_obj = mediaFragmentExtractor.toObject(a);

    if (url_obj.type === "spatial" || url_obj.type === "combined") {
      var center = url_obj.box.center();
      return "(" + center.x + "," + center.y + ")";
    } else
      return "";
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#height': function (a) {
    var url_obj = mediaFragmentExtractor.toObject(a);
    if (url_obj.type === "spatial" || url_obj.type === "combined")
      return "" + url_obj.box.h + "";
    return ""
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#width': function (a) {
    var url_obj = mediaFragmentExtractor.toObject(a);
    if (url_obj.type === "spatial" || url_obj.type === "combined")
      return "" + url_obj.box.w + "";
    return ""
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#xy': function (a) {
    var url_obj = mediaFragmentExtractor.toObject(a);
    if (url_obj.type === "spatial" || url_obj.type === "combined")
      return "(" + url_obj.box.x + "," + url_obj.box.y + ")";
    else
      return "";
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#spatialFragment': function (a) {
    var url_obj = mediaFragmentExtractor.toObject(a);
    if (url_obj.type === "spatial" || url_obj.type === "combined")
      return "xywh=" + url_obj.subtype + ":" + url_obj.box.x + "," + url_obj.box.y + "," + url_obj.box.w + "," + url_obj.box.h + "";
    else
      return "";
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#hasSpatialFragment': function (a) {
    var url_obj = mediaFragmentExtractor.toObject(a);
    return (url_obj.type === "spatial") || (url_obj.type === "combined") ? XSD_TRUE : XSD_FALSE;
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#spatialBoundingBox': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "spatial" || url_obj_a.type === "combined") && (url_obj_b.type === "spatial" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base) {
      if ((url_obj_a.subtype === "percent" && url_obj_b.subtype === "percent") || (url_obj_a.subtype === "pixel" && url_obj_b.subtype === "pixel")) {
        values = {
          x: Math.min(url_obj_a.box.x, url_obj_b.box.x),
          y: Math.min(url_obj_a.box.y, url_obj_b.box.y),
          w: Math.max(url_obj_a.box.w, url_obj_b.box.w),
          h: Math.max(url_obj_a.box.h, url_obj_b.box.h)
        };
        return mediaFragmentExtractor.toString(url_obj_a.base, "spatial", url_obj_a.subtype, values);
      } else {
        throw new Error('Could not aggregate two spatial fragments with different formatting: ' + a + ", " + b);
      }
    } else {
      throw new Error('Could not aggregate the provided media fragments with given URI: ' + a + ", " + b);
    }
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#spatialIntersection': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "spatial" || url_obj_a.type === "combined") && (url_obj_b.type === "spatial" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base) {
      if ((url_obj_a.subtype === "percent" && url_obj_b.subtype === "percent") || (url_obj_a.subtype === "pixel" && url_obj_b.subtype === "pixel")) {
        var intersection = url_obj_a.box.intersection(url_obj_b.box);
        if (intersection !== null)
          return mediaFragmentExtractor.toString(url_obj_a.base, "spatial", url_obj_a.subtype, intersection);
        else
          return "No intersection";
      } else {
        throw new Error('Could not aggregate two spatial fragments with different formatting: ' + a + ", " + b);
      }
    } else {
      throw new Error('Could not calculate the intersection of the provided media fragments with given URI: ' + a + ", " + b);
    }
  },

  /**
   * Start of SPARQL-MM temporal relation functions
   */
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#temporalOverlaps': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "temporal" || url_obj_a.type === "combined") && (url_obj_b.type === "temporal" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base)
      return temporalFunctions.overlaps(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
    else
      return XSD_FALSE;
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#overlappedBy': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "temporal" || url_obj_a.type === "combined") && (url_obj_b.type === "temporal" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base)
      return temporalFunctions.overlappedBy(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
    else
      return XSD_FALSE;
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#precedes': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "temporal" || url_obj_a.type === "combined") && (url_obj_b.type === "temporal" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base)
      return temporalFunctions.precedes(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
    else
      return XSD_FALSE;
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#precededBy': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "temporal" || url_obj_a.type === "combined") && (url_obj_b.type === "temporal" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base)
      return temporalFunctions.precededBy(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
    else
      return XSD_FALSE;
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#after': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "temporal" || url_obj_a.type === "combined") && (url_obj_b.type === "temporal" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base)
      return temporalFunctions.precededBy(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
    else
      return XSD_FALSE;
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#during': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "temporal" || url_obj_a.type === "combined") && (url_obj_b.type === "temporal" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base)
      return temporalFunctions.during(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
    else
      return XSD_FALSE;
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#finishedBy': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "temporal" || url_obj_a.type === "combined") && (url_obj_b.type === "temporal" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base)
      return temporalFunctions.finishedBy(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
    else
      return XSD_FALSE;
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#finishes': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "temporal" || url_obj_a.type === "combined") && (url_obj_b.type === "temporal" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base)
      return temporalFunctions.finishes(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
    else
      return XSD_FALSE;
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#temporalMeets': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "temporal" || url_obj_a.type === "combined") && (url_obj_b.type === "temporal" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base)
      return temporalFunctions.meets(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
    else
      return XSD_FALSE;
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#metBy': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "temporal" || url_obj_a.type === "combined") && (url_obj_b.type === "temporal" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base)
      return temporalFunctions.metBy(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
    else
      return XSD_FALSE;
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#startedBy': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "temporal" || url_obj_a.type === "combined") && (url_obj_b.type === "temporal" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base)
      return temporalFunctions.startedBy(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
    else
      return XSD_FALSE;
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#starts': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "temporal" || url_obj_a.type === "combined") && (url_obj_b.type === "temporal" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base)
      return temporalFunctions.starts(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
    else
      return XSD_FALSE;
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#startedBy': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "temporal" || url_obj_a.type === "combined") && (url_obj_b.type === "temporal" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base)
      return temporalFunctions.startedBy(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
    else
      return XSD_FALSE;
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#temporalContains': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "temporal" || url_obj_a.type === "combined") && (url_obj_b.type === "temporal" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base)
      return temporalFunctions.contains(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
    else
      return XSD_FALSE;
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#temporalEquals': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "temporal" || url_obj_a.type === "combined") && (url_obj_b.type === "temporal" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base)
      return temporalFunctions.equals(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
    else
      return XSD_FALSE;
  },

  /**
   * Start of temporal aggregation and accessor functions
   */
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#temporalIntermediate': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "temporal" || url_obj_a.type === "combined") && (url_obj_b.type === "temporal" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base) {
      values = temporalFunctions.intermediate(url_obj_a, url_obj_b);
      if (typeof values === "object")
        return mediaFragmentExtractor.toString(url_obj_a.base, "temporal", "", values);
      else
        return "No intermediate";
    }
    else {
      throw new Error('Could not create temporal intersection of the provided media fragments with given URI: ' + a + ", " + b);
    }
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#temporalBoundingBox': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "temporal" || url_obj_a.type === "combined") && (url_obj_b.type === "temporal" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base) {
      if(url_obj_a.start && url_obj_a.end && url_obj_b.start && url_obj_b.end)
        return mediaFragmentExtractor.toString(url_obj_a.base, "temporal", "", { start: Math.min(url_obj_a.start, url_obj_b.start), end: Math.max(url_obj_a.end, url_obj_b.end) });
      else
        return "No temporal bounding box"
    }
    else {
      throw new Error('Could not create temporal intersection of the provided media fragments with given URI: ' + a + ", " + b);
    }
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#temporalIntersection': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if ((url_obj_a.type === "temporal" || url_obj_a.type === "combined") && (url_obj_b.type === "temporal" || url_obj_b.type === "combined") && url_obj_a.base === url_obj_b.base) {
      values = temporalFunctions.intersection(url_obj_a, url_obj_b);
      if (typeof values === "object")
        return mediaFragmentExtractor.toString(url_obj_a.base, "temporal", "", values)
      else
        return "No intersection";
    }
    else {
      throw new Error('Could not create temporal intersection of the provided media fragments with given URI: ' + a + ", " + b);
    }
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#duration': function (a) {
    var url_obj = mediaFragmentExtractor.toObject(a);
    if (url_obj.type === "temporal" || url_obj.type === "combined")
      if(url_obj.start && url_obj.end)
        return (url_obj.end - url_obj.start).toString();

    return "";
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#end': function (a) {
    var url_obj = mediaFragmentExtractor.toObject(a);
    if (url_obj.type === "temporal" || url_obj.type === "combined")
      if(url_obj.start && url_obj.end)
        return url_obj.end.toString();
    return "";
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#start': function (a) {
    var url_obj = mediaFragmentExtractor.toObject(a);
    if (url_obj.type === "temporal" || url_obj.type === "combined")
      if(url_obj.start && url_obj.end)
        return url_obj.start.toString();
    return "";
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#temporalFragment': function (a) {
    var url_obj = mediaFragmentExtractor.toObject(a);
    if (url_obj.type === "temporal" || url_obj.type === "combined")
      if(url_obj.start && url_obj.end)
        return "t=" + url_obj.start + "," + url_obj.end;
    return "";
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#hasTemporalFragment': function (a) {
    var url_obj = mediaFragmentExtractor.toObject(a);
    return ((url_obj.type === "temporal" || url_obj.type === "combined") && url_obj.start && url_obj.end ) ? XSD_TRUE : XSD_FALSE;
  },

  /**
   * Start of spatiotemporal fragments functions
   */
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#contains': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);
    if (url_obj_a.type === "combined" && url_obj_b.type === "combined") {
      if ((url_obj_a.subtype === "percent" && url_obj_b.subtype === "percent") || (url_obj_a.subtype === "pixel" && url_obj_b.subtype === "pixel"))
        return spatialFunctions.contains(url_obj_a, url_obj_b) && temporalFunctions.contains(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
    }
    return XSD_FALSE;
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#equals': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if (url_obj_a.type === "combined" && url_obj_b.type === "combined") {
      if ((url_obj_a.subtype === "percent" && url_obj_b.subtype === "percent") || (url_obj_a.subtype === "pixel" && url_obj_b.subtype === "pixel"))
        return spatialFunctions.equals(url_obj_a, url_obj_b) && temporalFunctions.equals(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
    }
    return XSD_FALSE;
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#overlaps': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);

    if (url_obj_a.type === "combined" && url_obj_b.type === "combined") {
      if ((url_obj_a.subtype === "percent" && url_obj_b.subtype === "percent") || (url_obj_a.subtype === "pixel" && url_obj_b.subtype === "pixel"))
        return spatialFunctions.overlaps(url_obj_a, url_obj_b) && temporalFunctions.overlaps(url_obj_a, url_obj_b) ? XSD_TRUE : XSD_FALSE;
    }
    return XSD_FALSE;
  },
  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#boundingBox': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);
    var values;
    if (url_obj_a.type === "combined" && url_obj_b.type === "combined") {
      if ((url_obj_a.subtype === "percent" && url_obj_b.subtype === "percent") || (url_obj_a.subtype === "pixel" && url_obj_b.subtype === "pixel")) {
        values = {
          x: Math.min(url_obj_a.box.x, url_obj_b.box.x),
          y: Math.min(url_obj_a.box.y, url_obj_b.box.y),
          w: Math.max(url_obj_a.box.w, url_obj_b.box.w),
          h: Math.max(url_obj_a.box.h, url_obj_b.box.h)
        };
      } else {
        throw new Error('Could not aggregate two spatial fragments with different formatting: ' + a + ", " + b);
      }

      values.start = Math.min(url_obj_a.start, url_obj_b.start);
      values.end = Math.max(url_obj_a.end, url_obj_b.end);

      return mediaFragmentExtractor.toString(url_obj_a.base, "combined", url_obj_a.subtype, values);
    } else {
      return "Could not aggregate two media fragments";
    }
  },

  'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#intersection': function (a, b) {
    var url_obj_a = mediaFragmentExtractor.toObject(a);
    var url_obj_b = mediaFragmentExtractor.toObject(b);
    var values;

    // Take spatial intersection
    if (url_obj_a.type === "combined" && url_obj_b.type === "combined") {
      if ((url_obj_a.subtype === "percent" && url_obj_b.subtype === "percent") || (url_obj_a.subtype === "pixel" && url_obj_b.subtype === "pixel")) {
        values = url_obj_a.box.intersection(url_obj_b.box);
        if(values == null)
          return "No intersection can be made: no spatial intersection";
      } else {
        throw new Error('Could not aggregate two spatial fragments with different formatting: ' + a + ", " + b);
      }

      // Take temporal intersection
      var temporal_intersection = temporalFunctions.intersection(url_obj_a, url_obj_b);
      if(temporal_intersection === "No intersection")
        return "No intersection can be made: no temporal intersection";
      values.start = temporal_intersection.start;
      values.end = temporal_intersection.end;
      return mediaFragmentExtractor.toString(url_obj_a.base, "combined", url_obj_a.subtype, values);
    } else {
      return "Could not aggregate two media fragments: " + a + ", " + b;
    }
  },

  'bound': function (a) {
    if (a[0] !== '?')
      throw new Error('BOUND expects a variable but got: ' + a);
    return a in this ? true : false;
  },

};

// Tag all operators that expect their arguments to be numeric
// TODO: Comparison operators can take simple literals and strings as well
[
  '+', '-', '*', '/', '<', '<=', '>', '>=',
  XSD_INTEGER, XSD_DOUBLE,
].forEach(function (operatorName) {
  operators[operatorName].type = 'numeric';
});

// Tag all operators that expect their arguments to be boolean
[
  '!', '&&', '||',
].forEach(function (operatorName) {
  operators[operatorName].type = 'boolean';
});

// Tag all operators that have numeric results
[
  '+', '-', '*', '/'
].forEach(function (operatorName) {
  operators[operatorName].resultType = 'numeric';
});

// Tag all operators that have boolean results
[
  '!', '&&', '||', '=', '!=', '<', '<=', '>', '>=',
  'langmatches', 'contains', 'regex',
].forEach(function (operatorName) {
  operators[operatorName].resultType = 'boolean';
});

// Tag all operators that take expressions instead of evaluated expressions
operators.bound.acceptsExpressions = true;



UnsupportedExpressionError = createErrorType('UnsupportedExpressionError', function (expressionType) {
  this.message = 'Unsupported expression type: ' + expressionType + '.';
});

UnsupportedOperatorError = createErrorType('UnsupportedExpressionError', function (operatorName) {
  this.message = 'Unsupported operator: ' + operatorName + '.';
});

InvalidArgumentsNumberError = createErrorType('InvalidArgumentsNumberError',
  function (operatorName, actualNumber, expectedNumber) {
    this.message = 'Invalid number of arguments for ' + operatorName + ': ' +
      actualNumber + ' (expected: ' + expectedNumber + ').';
  });



module.exports = SparqlExpressionEvaluator;
module.exports.UnsupportedExpressionError = UnsupportedExpressionError;
module.exports.UnsupportedOperatorError = UnsupportedOperatorError;
module.exports.InvalidArgumentsNumberError = InvalidArgumentsNumberError;
