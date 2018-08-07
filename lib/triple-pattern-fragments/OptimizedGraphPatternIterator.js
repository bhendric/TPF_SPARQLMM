/*! @license MIT ©2014-2016 Ruben Verborgh, Ghent University - imec */
/* A ReorderingGraphPatternIterator builds bindings by reading matches for a basic graph pattern. */

var AsyncIterator = require('asynciterator'),
    TransformIterator = AsyncIterator.TransformIterator,
    MultiTransformIterator = AsyncIterator.MultiTransformIterator,
    rdf = require('../util/RdfUtil'),
    _ = require('lodash'),
    Logger = require('../util/ExecutionLogger')('ReorderingGraphPatternIterator');

var TriplePatternIterator = require('./TriplePatternIterator');

// Creates a new ReorderingGraphPatternIterator
function OptimizedGraphPatternIterator(parent, pattern, options) {
  // Empty patterns have no effect
  if (!pattern || !pattern.length)
    return new TransformIterator(parent, options);
  // A one-element pattern can be solved by a triple pattern iterator
  if (pattern.length === 1){
    return new TriplePatternIterator(parent, pattern[0], options);
  }
  // For length two or more, construct a ReorderingGraphPatternIterator
  if (!(this instanceof OptimizedGraphPatternIterator)){
    console.log("test")
    return new OptimizedGraphPatternIterator(parent, pattern, options);
  }
  MultiTransformIterator.call(this, parent, options);

  this._pattern = pattern;
  this._options = options || (options = {});
  this._client = options.fragmentsClient;
}
MultiTransformIterator.subclass(OptimizedGraphPatternIterator);

// Creates a pipeline with triples matching the binding of the iterator's graph pattern
OptimizedGraphPatternIterator.prototype._createTransformer = function (bindings) {

  // Array containing the inedexes of the triples that have been manually updates
  var updatedIndexes = [];

  // Check if binding contains fragment URI and update the bindings given the current pattern
  if (Object.keys(bindings).length > 0) {
    if (checkMediaFragmentURI(Object.values(bindings)))
      returnObject = updateBindings(bindings, this._pattern);
      bindings = returnObject.bindings;
      updatedIndexes = returnObject.indexes;
  }

  // Apply the context bindings to the iterator's graph pattern
  var boundPattern = rdf.applyBindings(bindings, this._pattern), options = this._options;

  // Before calculating the smallest connected subpattern, we have to remove the manually updated triples from the BGP. 
  // Otherwise, these will still be considered to be requested from the server
  updatedIndexes.forEach(function(index){
    boundPattern.splice(index,1);
  });


  // Select the smallest connected subpattern with the least number of unique variables in the resulting pattern
  var subPatterns = _.sortBy(rdf.findConnectedPatterns(boundPattern), function (patterns) {
        var distinctVariableCount = _.union.apply(_, patterns.map(rdf.getVariables)).length;
        return -(boundPattern.length * distinctVariableCount + patterns.length);
      }),
      subPattern = subPatterns.pop(), remainingPatterns = subPattern.length, pipeline;

  // If this subpattern has only one triple pattern, use it to create the pipeline
  if (remainingPatterns === 1)
    return createPipeline(subPattern.pop());

  // Otherwise, we must first find the best triple pattern to start the pipeline
  pipeline = new TransformIterator();
  // Retrieve and inspect the triple patterns' metadata to decide which has least matches
  var bestIndex = 0, minMatches = Infinity;
  subPattern.forEach(function (triplePattern, index) {
    var fragment = this._client.getFragmentByPattern(triplePattern);
    fragment.getProperty('metadata', function (metadata) {
      // We don't need more data from the fragment
      fragment.close();
      // If this triple pattern has no matches, the entire graph pattern has no matches
      // totalTriples can either be 0 (no matches) or undefined (no count in fragment)
      if (!metadata.totalTriples)
        return pipeline.close();
      // This triple pattern is the best if it has the lowest number of matches
      if (metadata.totalTriples < minMatches)
        bestIndex = index, minMatches = metadata.totalTriples;
      // After all patterns were checked, create the pipeline from the best pattern
      if (--remainingPatterns === 0)
        pipeline.source = createPipeline(subPattern.splice(bestIndex, 1)[0]);
    });
    // If the fragment errors, pretend it was empty
    fragment.on('error', function (error) {
      Logger.warning(error.message);
      if (!fragment.getProperty('metadata'))
        fragment.setProperty('metadata', { totalTriples: 0 });
    });
  }, this);
  return pipeline;

  // Creates the pipeline of iterators for the bound graph pattern,
  // starting with a TriplePatternIterator for the triple pattern,
  // then a ReorderingGraphPatternIterator for the remainder of the subpattern,
  // and finally, ReorderingGraphPatternIterators for the remaining subpatterns.
  function createPipeline(triplePattern) {
    // Create the iterator for the triple pattern
    var startIterator = AsyncIterator.single(bindings),
        pipeline = new TriplePatternIterator(startIterator, triplePattern, options);
    // If the chosen subpattern has more triples, create a ReorderingGraphPatternIterator for it
    if (subPattern && subPattern.length !== 0)
      pipeline = new OptimizedGraphPatternIterator(pipeline, subPattern, options);
    // Create ReorderingGraphPatternIterators for all interconnected subpatterns
    while (subPattern = subPatterns.pop())
      pipeline = new OptimizedGraphPatternIterator(pipeline, subPattern, options);
    return pipeline;
  }
};

// Function that will take an array with the binding values in bindings 
// and check if it contains a media fragment URI.
function checkMediaFragmentURI(array){

  var found = false;
  array.forEach(function(element){

    // Check if the element is a media fragment URI using a strict regex
    if (/^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/.test(element))
      found =  true;
  });
  return found;
}

// Function that will take the current bindings and check if media fragment URI information can be used to create some bindings without havind to request a tpf
function updateBindings(bindings, pattern){
  var indexes = [];
  for (var i = 0; i < pattern.length; i++){
    if( pattern[i].predicate === "http://www.w3.org/ns/ma-ont#hasFragment" &&  Object.keys(bindings).indexOf(pattern[i].object) > -1 && pattern[i].subject.indexOf("http://") === -1){
      indexes.push(i);
      var base = pattern[i].subject;
      index = Object.keys(bindings).indexOf(pattern[i].object)
      bindings[base] = extractBaseUri(Object.values(bindings)[index]);
    }
  }
  return {bindings: bindings, indexes: indexes};
}

function extractBaseUri(mediaFragmentURI){
  return mediaFragmentURI.split('#')[0];
}


// Generates a textual representation of the iterator
OptimizedGraphPatternIterator.prototype.toString = function () {
  return '[' + this.constructor.name +
         ' {' + this._pattern.map(rdf.toQuickString).join(' ') + '}]' +
         '\n  <= ' + this.getSourceString();
};

module.exports = OptimizedGraphPatternIterator;
