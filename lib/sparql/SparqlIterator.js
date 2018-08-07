/*! @license MIT ©2014-2016 Ruben Verborgh, Ghent University - imec */
/* A SparqlIterator returns the results of a SPARQL query. */

var SparqlParser = require('sparqljs').Parser,
    AsyncIterator = require('asynciterator'),
    OptimizedGraphPatternIterator = require('../triple-pattern-fragments/OptimizedGraphPatternIterator')
    TransformIterator = AsyncIterator.TransformIterator,
    ReorderingGraphPatternIterator = require('../triple-pattern-fragments/ReorderingGraphPatternIterator'),
    UnionIterator = require('./UnionIterator'),
    SortIterator = require('./SortIterator'),
    DistinctIterator = require('./DistinctIterator'),
    SparqlExpressionEvaluator = require('../util/SparqlExpressionEvaluator'),
    _ = require('lodash'),
    rdf = require('../util/RdfUtil'),
    createErrorType = require('../util/CustomError');

var queryConstructors = {
  SELECT: SparqlSelectIterator,
  CONSTRUCT: SparqlConstructIterator,
  DESCRIBE: SparqlDescribeIterator,
  ASK: SparqlAskIterator,
};

// Creates an iterator from a SPARQL query
function SparqlIterator(source, query, options) {
  // Set argument defaults
  if (typeof source.read !== 'function')
    options = query, query = source, source = null;
  options = options || {};
  source = source || AsyncIterator.single({});

  // Transform the query into a cascade of iterators
  try {
    // Parse the query if needed
    if (typeof query === 'string')
      query = new SparqlParser(options.prefixes).parse(query);

    // Create an iterator that projects the bindings according to the query type
    var queryIterator, QueryConstructor = queryConstructors[query.queryType];
    if (!QueryConstructor)
      throw new Error('No iterator available for query type: ' + query.queryType);
    queryIterator = new QueryConstructor(null, query, options);
    // Create an iterator for bindings of the query's graph pattern

    // TODO: Maybe change the graphIterator and check here for sparql-mm filter. If so, we need a different execution order
    // First check the unbound variables that need to be filtered, then solve these variables and then continue rest of query
    var graphIterator = new SparqlGroupsIterator(source,
                              queryIterator.patterns || query.where, options);
    
    // Create iterators for each order
    for (var i = query.order && (query.order.length - 1); i >= 0; i--) {
      var order = new SparqlExpressionEvaluator(query.order[i].expression),
          ascending = !query.order[i].descending;
      graphIterator = new SortIterator(graphIterator, function (a, b) {
        var orderA = '', orderB = '';
        try { orderA = order(a); }
        catch (error) { /* ignore order error */ }
        try { orderB = order(b); }
        catch (error) { /* ignore order error */ }
        if (orderA < orderB) return ascending ? -1 :  1;
        if (orderA > orderB) return ascending ?  1 : -1;
        return 0;
      }, options);
    }
    queryIterator.source = graphIterator;

    // Create iterators for modifiers
    if (query.distinct)
      queryIterator = new DistinctIterator(queryIterator, options);
    // Add offsets and limits if requested
    if ('offset' in query || 'limit' in query)
      queryIterator = queryIterator.transform({ offset: query.offset, limit: query.limit });
    queryIterator.queryType = query.queryType;
    return queryIterator;
  }
  catch (error) {
    if (/Parse error/.test(error.message))
      error = new InvalidQueryError(query, error);
    else
      error = new UnsupportedQueryError(query, error);
    throw error;
  }
}
TransformIterator.subclass(SparqlIterator);



// Creates an iterator for a parsed SPARQL SELECT query
function SparqlSelectIterator(source, query, options) {
  TransformIterator.call(this, source, options);
  this.setProperty('variables', query.variables);
}
SparqlIterator.subclass(SparqlSelectIterator);

// Executes the SELECT projection
SparqlSelectIterator.prototype._transform = function (bindings, done) {
  this._push(this.getProperty('variables').reduce(function (row, variable) {
    // Project a simple variable by copying its value
    if (variable !== '*'){
      if (typeof variable === "object"){
        row[variable.variable] = valueOf(variable);
      }else{
        row[variable] = valueOf(variable);
      }
    }
    // Project a star selector by copying all variable bindings
    else {
      for (variable in bindings) {
        if (rdf.isVariable(variable))
          row[variable] = valueOf(variable);
      }
    }
    return row;
  }, Object.create(null)));
  done();
  
  function valueOf(variable) {
    if (typeof variable === "object"){
      var evaluate = new SparqlExpressionEvaluator(variable.expression);
      value = evaluate(bindings);

      // We need a workaround for hasSpatialFragment and hasTemporalFragment accessor functions in SPARQL-MM as these can also be used as a filter function
      if( value.indexOf("XML") > -1 ){
        if (value === "\"true\"^^http://www.w3.org/2001/XMLSchema#boolean")
          value = "true";
        else
          value = "false;";
      }
    }else{
      value = bindings[variable];
    }
    return typeof value === 'string' ? rdf.deskolemize(value) : null;
  }
};



// Creates an iterator for a parsed SPARQL CONSTRUCT query
function SparqlConstructIterator(source, query, options) {
  TransformIterator.call(this, source, options);

  // Push constant triple patterns only once
  this._template = query.template.filter(function (triplePattern) {
    return rdf.hasVariables(triplePattern) || this._push(triplePattern);
  }, this);
  this._blankNodeId = 0;
}
SparqlIterator.subclass(SparqlConstructIterator);

// Executes the CONSTRUCT projection
SparqlConstructIterator.prototype._transform = function (bindings, done) {
  var blanks = Object.create(null);
  this._template.forEach(function (triplePattern) {
    // Apply the result bindings to the triple pattern, ensuring no variables are left
    var s = triplePattern.subject, p = triplePattern.predicate, o = triplePattern.object,
        s0 = s[0], p0 = p[0], o0 = o[0];
    if (s0 === '?') { if ((s = rdf.deskolemize(bindings[s])) === undefined) return; }
    else if (s0 === '_') s = blanks[s] || (blanks[s] = '_:b' + this._blankNodeId++);
    if (p0 === '?') { if ((p = rdf.deskolemize(bindings[p])) === undefined) return; }
    else if (p0 === '_') p = blanks[p] || (blanks[p] = '_:b' + this._blankNodeId++);
    if (o0 === '?') { if ((o = rdf.deskolemize(bindings[o])) === undefined) return; }
    else if (o0 === '_') o = blanks[o] || (blanks[o] = '_:b' + this._blankNodeId++);
    this._push({ subject: s, predicate: p, object: o });
  }, this);
  done();
};



// Creates an iterator for a parsed SPARQL DESCRIBE query
function SparqlDescribeIterator(source, query, options) {
  // Create a template with `?var ?p ?o` patterns for each variable
  var variables = query.variables, template = query.template = [];
  for (var i = 0, l = variables.length; i < l; i++)
    template.push(rdf.triple(variables[i], '?__predicate' + i, '?__object' + i));
  query.where = query.where.concat({ type: 'bgp', triples: template });
  SparqlConstructIterator.call(this, source, query, options);
}
SparqlConstructIterator.subclass(SparqlDescribeIterator);

// Creates an iterator for a parsed SPARQL ASK query
function SparqlAskIterator(source, query, options) {
  TransformIterator.call(this, source, options);
  this._result = false;
}
SparqlIterator.subclass(SparqlAskIterator);

// If an answer to the query exists, output true and end the iterator
SparqlAskIterator.prototype._transform = function (bindings, done) {
  this._result = true, this.close(), done();
};

// If no answer was received, output false
SparqlAskIterator.prototype._flush = function (done) {
  this._push(this._result), done();
};


function SparqlGroupsIterator(source, groups, options) {

  // Check if we have a filter and a bgp
  var filters = []
  for(var i = 0; i < groups.length; i++){
    if (groups[i].type === "filter")
      if (options.optimize)
        filters.push(groups[i]);
    if(groups[i].type === "bgp")
      if (options.optimize)
          bgp = groups[i];
  }
  if(options.optimize)
    insertTriplePatterns(filters, bgp);
  // Chain iterators for each of the graphs in the group
  var test = groups.reduce(function (source, group) {
    return new SparqlGroupIterator(source, group, options);
  }, source);
  return test;
}
AsyncIterator.subclass(SparqlGroupsIterator);


function insertTriplePatterns(filters, bgp){
  for (i = 0; i < filters.length ; i++){
    // Check if we have a filter using the function definition
    if(filters[i].expression.function.includes("sparql-mm")){
      // If we have a filter using sparql-mm, we check for each argument if the bgp contains the triple ?image ma:hasFragment filter argument. 
      // If not, we will add this triple as it will optimize the execution. This one has the least number of matches
      founds = [];
      for(j = 0; j < filters[i].expression.args.length; j++){
        found = false;
        for(k = 0; k < bgp.triples.length; k++){
          if(bgp.triples[k].predicate === "http://www.w3.org/ns/ma-ont#hasFragment" && bgp.triples[k].object === filters[i].expression.args[j])
            found = true;
        }
        founds.push(found);
      }

      //If we have at least one false (1 argument does not follow the pattern), then we need to add the triple pattern
      //We do however need to check if the other argument of the filter already has this entry. If so, we need to use the same subject variable
      if(founds.indexOf(false) > -1){
        if(founds[0] == false && founds[1] == false){
          bgp.triples.push({subject: "?subject" + i.toString(), predicate: "http://www.w3.org/ns/ma-ont#hasFragment", object: filters[i].expression.args[0]});
          bgp.triples.push({subject: "?subject" + i.toString(), predicate: "http://www.w3.org/ns/ma-ont#hasFragment", object: filters[i].expression.args[1]});
        }else{
          subject = "";
          for (j = 0; j < bgp.triples.length; j++){
            if(bgp.triples[j].predicate === "http://www.w3.org/ns/ma-ont#hasFragment" && bgp.triples[j].object === filters[i].expression.args[founds.indexOf(true)]){
              subject = bgp.triples[j].subject;
            }
          }
          bgp.triples.push({subject: subject, predicate: "http://www.w3.org/ns/ma-ont#hasFragment", object: filters[i].expression.args[founds.indexOf(false)]});
        }
      }
    }
  }
}

// Creates an iterator for a SPARQL group
function SparqlGroupIterator(source, group, options) {
  // Reset flags on the options for child iterators
  var childOptions = options.optional ? _.create(options, { optional: false }) : options;

  switch (group.type) {
  case 'bgp':
    if (options.optimize === true)
      return new OptimizedGraphPatternIterator(source, group.triples, options);
    else
      return new ReorderingGraphPatternIterator(source, group.triples, options);
  case 'group':
    return new SparqlGroupsIterator(source, group.patterns, childOptions);
  case 'optional':
    childOptions = _.create(options, { optional: true });
    return new SparqlGroupsIterator(source, group.patterns, childOptions);
  case 'union':
    return new UnionIterator(group.patterns.map(function (patternToken) {
      return new SparqlGroupIterator(source.clone(), patternToken, childOptions);
    }), options);
  case 'filter':
    // A set of bindings does not match the filter
    // if it evaluates to 0/false, or errors
    var evaluate = new SparqlExpressionEvaluator(group.expression);
    return source.filter(function (bindings) {
      try { return !/^"false"|^"0"/.test(evaluate(bindings)); }
      catch (error) { return false; }
    });
  default:
    throw new Error('Unsupported group type: ' + group.type);
  }
}
AsyncIterator.subclass(SparqlGroupIterator);


// Error thrown when the query has a syntax error
var InvalidQueryError = createErrorType('InvalidQueryError', function (query, cause) {
  this.message = 'Syntax error in query\n' + cause.message;
});

// Error thrown when no combination of iterators can solve the query
var UnsupportedQueryError = createErrorType('UnsupportedQueryError', function (query, cause) {
  this.message = 'The query is not yet supported\n' + cause.message;
});


module.exports = SparqlIterator;
SparqlIterator.InvalidQueryError = InvalidQueryError;
SparqlIterator.UnsupportedQueryError = UnsupportedQueryError;
