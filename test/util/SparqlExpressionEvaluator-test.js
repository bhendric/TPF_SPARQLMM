/*! @license MIT ©2014-2016 Ruben Verborgh, Ghent University - imec */
var SparqlExpressionEvaluator = require('../../lib/util/SparqlExpressionEvaluator');

var TRUE =  '"true"^^http://www.w3.org/2001/XMLSchema#boolean';
var FALSE = '"false"^^http://www.w3.org/2001/XMLSchema#boolean';

describe('SparqlExpressionEvaluator', function () {
  describe('The SparqlExpressionEvaluator module', function () {
    it('should be a function', function () {
      SparqlExpressionEvaluator.should.be.a('function');
    });
  });

  describe('A SparqlExpressionEvaluator', function () {
    describe('of a falsy value', function () {
      it('should return undefined', function () {
        expect(SparqlExpressionEvaluator()()).to.be.undefined;
      });
    });

    describe('of a literal', function () {
      var evaluator = SparqlExpressionEvaluator('"abc"');
      it('should return the literal value', function () {
        evaluator({ '?a': 'a' }).should.equal('"abc"');
      });
    });

    describe('of a numeric literal', function () {
      var evaluator = SparqlExpressionEvaluator('"43"^^http://www.w3.org/2001/XMLSchema#integer');
      it('should return the literal value', function () {
        evaluator({ '?a': 'a' }).should.equal('"43"^^http://www.w3.org/2001/XMLSchema#integer');
      });
    });

    describe('of a variable', function () {
      var evaluator = SparqlExpressionEvaluator('?a');
      it('should return the variable\'s value if it is bound', function () {
        evaluator({ '?a': '"x"' }).should.equal('"x"');
      });
      it('should return undefined if the variable is not bound', function () {
        expect(evaluator({ '?b': 'b' })).to.be.undefined;
      });
    });

    describe('of a sum', function () {
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: '+',
        args: [
          '?a',
          '"2"^^http://www.w3.org/2001/XMLSchema#integer',
        ],
      });
      it('should return the sum of the expressions', function () {
        evaluator({ '?a': '"3"^^http://www.w3.org/2001/XMLSchema#integer' })
          .should.equal('"5"^^http://www.w3.org/2001/XMLSchema#integer');
      });
    });

    describe('of a difference', function () {
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: '-',
        args: [
          '"5"^^http://www.w3.org/2001/XMLSchema#integer',
          '?a',
        ],
      });
      it('should return the difference of the expressions', function () {
        evaluator({ '?a': '"3"^^http://www.w3.org/2001/XMLSchema#integer' })
          .should.equal('"2"^^http://www.w3.org/2001/XMLSchema#integer');
      });
    });

    describe('of a product', function () {
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: '*',
        args: [
          '?a',
          '"2"^^http://www.w3.org/2001/XMLSchema#integer',
        ],
      });
      it('should return the product of the expressions', function () {
        evaluator({ '?a': '"3"^^http://www.w3.org/2001/XMLSchema#integer' })
          .should.equal('"6"^^http://www.w3.org/2001/XMLSchema#integer');
      });
    });

    describe('of a quotient', function () {
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: '/',
        args: [
          '"6"^^http://www.w3.org/2001/XMLSchema#integer',
          '?a',
        ],
      });
      it('should return the quotient of the expressions', function () {
        evaluator({ '?a': '"2"^^http://www.w3.org/2001/XMLSchema#integer' })
          .should.equal('"3"^^http://www.w3.org/2001/XMLSchema#integer');
      });
    });

    describe('of an equality comparison', function () {
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: '=',
        args: ['?a', '"b"'],
      });

      it('should return true if the arguments match', function () {
        evaluator({ '?a': '"b"' }).should.equal.true;
      });

      it("should return false if the arguments don't match", function () {
        evaluator({ '?a': '"c"' }).should.equal.false;
      });
    });

    describe('of a non-equality comparison', function () {
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: '=',
        args: ['?a', '"b"'],
      });

      it('should return false if the arguments match', function () {
        evaluator({ '?a': '"b"' }).should.equal.false;
      });

      it("should return true if the arguments don't match", function () {
        evaluator({ '?a': '"c"' }).should.equal.true;
      });
    });

    describe('of a less-than comparison', function () {
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: '<',
        args: [
          '?a',
          '"20"^^http://www.w3.org/2001/XMLSchema#integer',
        ],
      });

      it('should return true if a < b', function () {
        evaluator({ '?a': '"3"^^http://www.w3.org/2001/XMLSchema#integer' }).should.equal(TRUE);
      });

      it('should return false if a == b', function () {
        evaluator({ '?a': '"20"^^http://www.w3.org/2001/XMLSchema#integer' }).should.equal('"false"^^http://www.w3.org/2001/XMLSchema#boolean');
      });

      it('should return false if a > b', function () {
        evaluator({ '?a': '"120"^^http://www.w3.org/2001/XMLSchema#integer' }).should.equal('"false"^^http://www.w3.org/2001/XMLSchema#boolean');
      });
    });

    describe('of a less-or-equal-than comparison', function () {
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: '<=',
        args: [
          '?a',
          '"20"^^http://www.w3.org/2001/XMLSchema#integer',
        ],
      });

      it('should return true if a < b', function () {
        evaluator({ '?a': '"3"^^http://www.w3.org/2001/XMLSchema#integer' }).should.equal(TRUE);
      });

      it('should return true if a == b', function () {
        evaluator({ '?a': '"20"^^http://www.w3.org/2001/XMLSchema#integer' }).should.equal(TRUE);
      });

      it('should return false if a > b', function () {
        evaluator({ '?a': '"120"^^http://www.w3.org/2001/XMLSchema#integer' }).should.equal('"false"^^http://www.w3.org/2001/XMLSchema#boolean');
      });
    });

    describe('of a greater-than comparison', function () {
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: '>',
        args: [
          '?a',
          '"20"^^http://www.w3.org/2001/XMLSchema#integer',
        ],
      });

      it('should return false if a < b', function () {
        evaluator({ '?a': '"3"^^http://www.w3.org/2001/XMLSchema#integer' }).should.equal(FALSE);
      });

      it('should return false if a == b', function () {
        evaluator({ '?a': '"20"^^http://www.w3.org/2001/XMLSchema#integer' }).should.equal('"false"^^http://www.w3.org/2001/XMLSchema#boolean');
      });

      it('should return true if a > b', function () {
        evaluator({ '?a': '"120"^^http://www.w3.org/2001/XMLSchema#integer' }).should.equal('"true"^^http://www.w3.org/2001/XMLSchema#boolean');
      });
    });

    describe('of a greater-or-equal-than comparison', function () {
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: '>=',
        args: [
          '?a',
          '"20"^^http://www.w3.org/2001/XMLSchema#integer',
        ],
      });

      it('should return false if a < b', function () {
        evaluator({ '?a': '"3"^^http://www.w3.org/2001/XMLSchema#integer' }).should.equal(FALSE);
      });

      it('should return true if a == b', function () {
        evaluator({ '?a': '"20"^^http://www.w3.org/2001/XMLSchema#integer' }).should.equal(TRUE);
      });

      it('should return true if a > b', function () {
        evaluator({ '?a': '"120"^^http://www.w3.org/2001/XMLSchema#integer' }).should.equal('"true"^^http://www.w3.org/2001/XMLSchema#boolean');
      });
    });

    describe('of the not operator', function () {
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: '!',
        args: [
          {
            type: 'operation',
            operator: '=',
            args: ['?a', '"a"'],
          },
        ],
      });

      it('should return false if the child expression is true', function () {
        evaluator({ '?a': '"a"' }).should.equal(FALSE);
      });

      it('should return true if the child expression is false', function () {
        evaluator({ '?a': '"b"' }).should.equal(TRUE);
      });

      it('should return false on non-boolean arguments', function () {
        var evaluator = SparqlExpressionEvaluator({
          type: 'operation',
          operator: '!',
          args: ['"3"^^http://www.w3.org/2001/XMLSchema#integer'],
        });
        evaluator({ '?a': '"a"' }).should.equal(FALSE);
      });
    });

    describe('of the and operator', function () {
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: '&&',
        args: ['?a', '?b'],
      });

      it('should return false with arguments false, false', function () {
        evaluator({ '?a': FALSE, '?b': FALSE }).should.equal(FALSE);
      });


      it('should return false with arguments true, false', function () {
        evaluator({ '?a': TRUE,  '?b': FALSE }).should.equal(FALSE);
      });


      it('should return false with arguments false, true', function () {
        evaluator({ '?a': FALSE, '?b': TRUE  }).should.equal(FALSE);
      });


      it('should return true with arguments true, true', function () {
        evaluator({ '?a': TRUE,  '?b': TRUE  }).should.equal(TRUE);
      });

      it('should treat the first argument as true if it is non-boolean', function () {
        evaluator({ '?a': 'a', '?b': TRUE }).should.equal(TRUE);
      });

      it('should treat the second argument as true if it is non-boolean', function () {
        evaluator({ '?a': TRUE, '?b': 'a' }).should.equal(TRUE);
      });
    });

    describe('of the or operator', function () {
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: '||',
        args: ['?a', '?b'],
      });

      it('should return false with arguments false, false', function () {
        evaluator({ '?a': FALSE, '?b': FALSE }).should.equal(FALSE);
      });


      it('should return true with arguments true, false', function () {
        evaluator({ '?a': TRUE,  '?b': FALSE }).should.equal(TRUE);
      });


      it('should return true with arguments false, true', function () {
        evaluator({ '?a': FALSE, '?b': TRUE  }).should.equal(TRUE);
      });


      it('should return true with arguments true, true', function () {
        evaluator({ '?a': TRUE,  '?b': TRUE  }).should.equal(TRUE);
      });

      it('should treat the first argument as true if it is non-boolean', function () {
        evaluator({ '?a': 'a', '?b': FALSE }).should.equal(TRUE);
      });

      it('should treat the second argument as true if it is non-boolean', function () {
        evaluator({ '?a': FALSE, '?b': 'a' }).should.equal(TRUE);
      });
    });

    describe('of the lang operator', function () {
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'lang',
        args: ['?a'],
      });

      it('should return the lowercase language of a string', function () {
        evaluator({ '?a': '"hello"@EN' }).should.equal('"en"');
      });
    });

    describe('of the langmatches operator', function () {
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'langmatches',
        args: ['"de-DE-1996"', '?l'],
      });

      it('should return true if the language is equal', function () {
        evaluator({ '?l': '"de-de-1996"' }).should.equal(TRUE);
      });

      it('should return true if the language has the same prefix', function () {
        evaluator({ '?l': '"de"' }).should.equal(TRUE);
        evaluator({ '?l': '"de-DE"' }).should.equal(TRUE);
      });

      it('should return true on *', function () {
        evaluator({ '?l': '"de-de-1996"' }).should.equal(TRUE);
      });

      it("should return false if the language doesn't match", function () {
        evaluator({ '?l': '"fr"' }).should.equal(FALSE);
      });
    });

    describe('of the CONTAINS operator', function () {
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'contains',
        args: [
          '"defgh"',
          '?a',
        ],
      });

      it('should return true if the substring is part of the string', function () {
        evaluator({ '?a': '"efg"' }).should.equal(TRUE);
      });

      it('should return true if the substring is equal to the string', function () {
        evaluator({ '?a': '"defgh"^^<urn:type>' }).should.equal(TRUE);
      });

      it('should return false if the substring is not part of the string', function () {
        evaluator({ '?a': '"abc"' }).should.equal(FALSE);
      });
    });

    describe('of the regex operator', function () {
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'regex',
        args: ['?a', '"a+b"'],
      });

      it('should return true if the argument matches the regular expression', function () {
        evaluator({ '?a': '"aaaaaab"' }).should.equal(TRUE);
      });

      it("should return false if the argument doesn't match the regular expression", function () {
        evaluator({ '?a': '"bbbb"' }).should.equal(FALSE);
      });
    });

    describe('of the str operator', function () {
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'str',
        args: ['?a'],
      });

      it('should return the literal if passed a literal', function () {
        evaluator({ '?a': '"a"' }).should.equal('"a"');
      });

      it('should return a stringified version if passed a number', function () {
        evaluator({ '?a': '"3"^^http://www.w3.org/2001/XMLSchema#double' })
          .should.equal('"3"^^http://www.w3.org/2001/XMLSchema#double');
      });
    });

    describe('of the xsd:integer function', function () {
      var evaluator = SparqlExpressionEvaluator({
        type: 'functionCall',
        operator: 'http://www.w3.org/2001/XMLSchema#integer',
        args: ['"123.67"'],
      });

      it('should return the literal as an integer', function () {
        evaluator({}).should.equal('"123"^^http://www.w3.org/2001/XMLSchema#integer');
      });
    });

    describe('of the xsd:double function', function () {
      var evaluator = SparqlExpressionEvaluator({
        type: 'functionCall',
        operator: 'http://www.w3.org/2001/XMLSchema#double',
        args: ['"123"'],
      });

      it('should return the literal as a double', function () {
        evaluator({}).should.equal('"123.0"^^http://www.w3.org/2001/XMLSchema#double');
      });
    });

    describe('of the bound operator', function () {
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'bound',
        args: ['?a'],
      });

      it('should return true if the variable is bound', function () {
        evaluator({ '?a': 'a' }).should.be.true;
      });

      it('should return false if the variable is not bound', function () {
        evaluator({ '?b': 'b' }).should.be.false;
      });

      it('should throw an error if the argument is not a variable', function () {
        var evaluator = SparqlExpressionEvaluator({
          type: 'operation',
          operator: 'bound',
          args: ['"a"'],
        });
        (function () { evaluator({ '?a': 'a' }); })
          .should.throw('BOUND expects a variable but got: "a"');
      });
    });

    describe('of an unsuppported expression type', function () {
      it('should throw an error', function () {
        (function () { SparqlExpressionEvaluator({ type: 'invalid' }); })
        .should.throw('Unsupported expression type: invalid');
      });
    });

    describe('of an unsupported operator', function () {
      it('should throw an error', function () {
        (function () { SparqlExpressionEvaluator({ type: 'operation', operator: 'invalid' }); })
          .should.throw('Unsupported operator: invalid.');
      });
    });

    describe('of an operator with an incorrect number of arguments', function () {
      it('should throw an error', function () {
        (function () { SparqlExpressionEvaluator({ type: 'operation', operator: 'regex', args: [1] }); })
          .should.throw('Invalid number of arguments for regex: 1 (expected: 2).');
      });
    });

    describe('of an operator with an invalid number of arguments', function () {
      it('should throw an error', function () {
        (function () {
          SparqlExpressionEvaluator({
            type: 'operation',
            operator: '+',
            args: ['"a"', '"b"', '"c"'],
          });
        })
        .should.throw('Invalid number of arguments for +: 3 (expected: 2).');
      });
    });

    /** 
     * Start of SPARQL-MM spatial relational function tests 
     * */

    describe('of a SPARQL-MM rightBeside operation', function(){
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#rightBeside',
        args: [
          '?a',
          'https://example.org/image#xywh=percent:1,5,2,10',
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:5,5,10,10'}).should.equal(TRUE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:0,5,10,10'}).should.equal(FALSE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:0?,5,10,10'}).should.equal(FALSE);
      })

      var evaluator_1 = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#rightBeside',
        args: [
          '?a',
          'https://example.org/image#xywh=1,5,2,10',
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=5,5,10,10'}).should.equal(TRUE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=0,5,10,10'}).should.equal(FALSE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=0?,5,10,10'}).should.equal(FALSE);
      })

      it('should return an XSD false when combined percentual and pixel URI is used', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=percent:0,5,10,10'}).should.equal(FALSE);
      })
    });

    describe('of a SPARQL-MM leftBeside operation', function(){
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#leftBeside',
        args: [
          'https://example.org/image#xywh=percent:1,5,2,10',
          '?a',
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:5,5,10,10'}).should.equal(TRUE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:0,5,10,10'}).should.equal(FALSE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:0?,5,10,10'}).should.equal(FALSE);
      })

      var evaluator_1 = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#leftBeside',
        args: [
          'https://example.org/image#xywh=1,5,2,10',
          '?a',
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=5,5,10,10'}).should.equal(TRUE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=0,5,10,10'}).should.equal(FALSE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=0?,5,10,10'}).should.equal(FALSE);
      })

      it('should return an XSD false when combined percentual and pixel URI is used', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=percent:0,5,10,10'}).should.equal(FALSE);
      })
    });

    describe('of a SPARQL-MM above operation', function(){
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#above',
        args: [
          '?a',
          'https://example.org/image#xywh=percent:1,5,2,10',
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:5,0,10,2'}).should.equal(TRUE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:0,5,10,10'}).should.equal(FALSE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:0?,5,10,10'}).should.equal(FALSE);
      })

      var evaluator_1 = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#above',
        args: [
          'https://example.org/image#xywh=1,5,2,10',
          '?a',
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=5,17,10,2'}).should.equal(TRUE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=0,5,10,10'}).should.equal(FALSE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=0?,5,10,10'}).should.equal(FALSE);
      })

      it('should return an XSD false when combined percentual and pixel URI is used', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=percent:0,5,10,10'}).should.equal(FALSE);
      })
    });

    describe('of a SPARQL-MM below operation', function(){
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#below',
        args: [
          '?a',
          'https://example.org/image#xywh=percent:1,5,2,10',
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:5,0,10,2'}).should.equal(FALSE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:0,20,10,10'}).should.equal(TRUE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:0?,5,10,10'}).should.equal(FALSE);
      })

      var evaluator_1 = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#below',
        args: [
          'https://example.org/image#xywh=1,5,2,10',
          '?a',
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=5,17,10,2'}).should.equal(FALSE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=0,0,10,1'}).should.equal(TRUE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=0?,5,10,10'}).should.equal(FALSE);
      })

      it('should return an XSD false when combined percentual and pixel URI is used', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=percent:0,7,10,10'}).should.equal(FALSE);
      })
    });

    describe('of a SPARQL-MM rightAbove operation', function(){
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#rightAbove',
        args: [
          '?a',
          'https://example.org/image#xywh=percent:1,5,2,10',
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:12,0,10,2'}).should.equal(TRUE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:0,20,10,10'}).should.equal(FALSE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:0?,5,10,10'}).should.equal(FALSE);
      })

      var evaluator_1 = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#rightAbove',
        args: [
          '?a',
          'https://example.org/image#xywh=1,5,2,10',
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=12,0,10,2'}).should.equal(TRUE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=0,0,10,1'}).should.equal(FALSE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=0?,5,10,10'}).should.equal(FALSE);
      })

      it('should return an XSD false when combined percentual and pixel URI is used', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=percent:0,7,10,10'}).should.equal(FALSE);
      })
    });

    describe('of a SPARQL-MM rightBelow operation', function(){
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#rightBelow',
        args: [
          '?a',
          'https://example.org/image#xywh=percent:1,5,2,10',
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:12,17,10,2'}).should.equal(TRUE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:0,20,10,10'}).should.equal(FALSE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:0?,5,10,10'}).should.equal(FALSE);
      })

      var evaluator_1 = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#rightBelow',
        args: [
          '?a',
          'https://example.org/image#xywh=1,5,2,10',
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=12,17,10,2'}).should.equal(TRUE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=0,0,10,1'}).should.equal(FALSE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=12?,17,10,10'}).should.equal(FALSE);
      })

      it('should return an XSD false when combined percentual and pixel URI is used', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=percent:12,17,10,10'}).should.equal(FALSE);
      })
    });

    describe('of a SPARQL-MM leftBelow operation', function(){
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#leftBelow',
        args: [
          '?a',
          'https://example.org/image#xywh=percent:15,5,2,10',
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:12,17,2,2'}).should.equal(TRUE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:0,0,10,10'}).should.equal(FALSE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator({'?a': 'https://example.org/image#xwhy=percent:12?,17,2,2'}).should.equal(FALSE);
      })

      var evaluator_1 = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#leftBelow',
        args: [
          '?a',
          'https://example.org/image#xywh=15,5,2,10',
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=12,17,2,2'}).should.equal(TRUE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=0,0,10,1'}).should.equal(FALSE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator_1({'?a': 'https://example.org/image#xwhy=12?,17,2,2'}).should.equal(FALSE);
      })

      it('should return an XSD false when combined percentual and pixel URI is used', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=percent:12,17,2,2'}).should.equal(FALSE);
      })
    });

    describe('of a SPARQL-MM leftAbove operation', function(){
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#leftAbove',
        args: [
          '?a',
          'https://example.org/image#xywh=percent:15,5,2,10',
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:12,0,2,2'}).should.equal(TRUE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:0,0,10,10'}).should.equal(FALSE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator({'?a': 'https://example.org/image#xwhy=percent:12?,0,2,2'}).should.equal(FALSE);
      })

      var evaluator_1 = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#leftAbove',
        args: [
          '?a',
          'https://example.org/image#xywh=15,5,2,10',
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=12,0,2,2'}).should.equal(TRUE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=0,12,10,1'}).should.equal(FALSE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator_1({'?a': 'https://example.org/image#xwhy=12?,0,2,2'}).should.equal(FALSE);
      })

      it('should return an XSD false when combined percentual and pixel URI is used', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=percent:12,0,2,2'}).should.equal(FALSE);
      })
    });

    describe('of a SPARQL-MM spatial Equals operation', function(){
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#spatialEquals',
        args: [
          '?a',
          'https://example.org/image#xywh=percent:15,5,2,10',
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:15,5,2,10'}).should.equal(TRUE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:0,0,10,10'}).should.equal(FALSE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator({'?a': 'https://example.org/image#xwhy=percent:15,5,2,10'}).should.equal(FALSE);
      })

      var evaluator_1 = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#spatialEquals',
        args: [
          '?a',
          'https://example.org/image#xywh=15,5,2,10',
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=15,5,2,10'}).should.equal(TRUE);
      })

      it('should return an XSD true value when relation is met with spatiotemporal fragments', function(){
        evaluator_1({'?a': 'https://example.org/image#t=10,20&xywh=15,5,2,10'}).should.equal(TRUE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=0,0,10,1'}).should.equal(FALSE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator_1({'?a': 'https://example.org/image#xwhy=15?,5,2,10'}).should.equal(FALSE);
      })

      it('should return an XSD false when combined percentual and pixel URI is used', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=percent:15,5,2,10'}).should.equal(FALSE);
      })
    });

    describe('of a SPARQL-MM spatial Disjoint operation', function(){
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#spatialDisjoint',
        args: [
          '?a',
          'https://example.org/image#xywh=percent:15,5,2,10',
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:0,0,2,3'}).should.equal(TRUE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:8,3,10,10'}).should.equal(FALSE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator({'?a': 'https://example.org/image#xwhy=percent:0,0,2,3'}).should.equal(FALSE);
      })

      var evaluator_1 = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#spatialDisjoint',
        args: [
          '?a',
          'https://example.org/image#xywh=15,5,2,10',
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=0,0,2,3'}).should.equal(TRUE);
      })
      it('should return an XSD true value when relation is met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=0,0,2,3&t=10,20'}).should.equal(TRUE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=8,3,10,10'}).should.equal(FALSE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator_1({'?a': 'https://example.org/image#xwhy=0?,0,2,3'}).should.equal(FALSE);
      })

      it('should return an XSD false when combined percentual and pixel URI is used', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=percent:0,0,2,3'}).should.equal(FALSE);
      })
    });

    describe('of a SPARQL-MM spatial Contains operation', function(){
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#spatialContains',
        args: [
          '?a',
          'https://example.org/image#xywh=percent:15,5,2,10',
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:10,4,7,3'}).should.equal(TRUE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:30,17,10,10'}).should.equal(FALSE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator({'?a': 'https://example.org/image#xwhy=percent:10,4,7,3'}).should.equal(FALSE);
      })

      var evaluator_1 = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#spatialContains',
        args: [
          '?a',
          'https://example.org/image#xywh=15,5,2,10',
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=10,4,7,3'}).should.equal(TRUE);
      })
      it('should return an XSD true value when relation is met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=10,4,7,3&t=10,20'}).should.equal(TRUE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=30,17,10,10'}).should.equal(FALSE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator_1({'?a': 'https://example.org/image#xwhy=10?,4,7,3'}).should.equal(FALSE);
      })

      it('should return an XSD false when combined percentual and pixel URI is used', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=percent:10,4,7,3'}).should.equal(FALSE);
      })
    });

    describe('of a SPARQL-MM spatial covers operation', function(){
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#covers',
        args: [
          '?a',
          'https://example.org/image#xywh=percent:15,5,2,10',
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:10,4,10,15'}).should.equal(TRUE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:10,4,10,2'}).should.equal(FALSE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator({'?a': 'https://example.org/image#xwhy=percent:10,4,10,15'}).should.equal(FALSE);
      })

      var evaluator_1 = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#covers',
        args: [
          '?a',
          'https://example.org/image#xywh=15,5,2,10',
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=10,4,10,15'}).should.equal(TRUE);
      })
      it('should return an XSD true value when relation is met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=10,4,10,15&t=10,20'}).should.equal(TRUE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=10,4,4,2'}).should.equal(FALSE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator_1({'?a': 'https://example.org/image#xwhy=10?,4,10,15'}).should.equal(FALSE);
      })

      it('should return an XSD false when combined percentual and pixel URI is used', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=percent:10,4,10,15'}).should.equal(FALSE);
      })
    });

    describe('of a SPARQL-MM spatial intersects operation', function(){
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#intersects',
        args: [
          '?a',
          'https://example.org/image#xywh=percent:15,5,2,10',
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:10,4,10,15'}).should.equal(TRUE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:0,0,1,1'}).should.equal(FALSE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator({'?a': 'https://example.org/image#xwhy=percent:10,4,10,15'}).should.equal(FALSE);
      })

      var evaluator_1 = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#intersects',
        args: [
          '?a',
          'https://example.org/image#xywh=15,5,2,10',
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=10,4,10,15'}).should.equal(TRUE);
      })
      it('should return an XSD true value when relation is met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=10,4,10,15&t=10,20'}).should.equal(TRUE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=0,0,1,1'}).should.equal(FALSE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator_1({'?a': 'https://example.org/image#xwhy=10?,4,10,15'}).should.equal(FALSE);
      })

      it('should return an XSD false when combined percentual and pixel URI is used', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=percent:10,4,10,15'}).should.equal(FALSE);
      })
    });

    describe('of a SPARQL-MM spatial within operation', function(){
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#within',
        args: [
          'https://example.org/image#xywh=percent:15,5,2,10',
          '?a',
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:10,4,10,15'}).should.equal(TRUE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:10,4,10,2'}).should.equal(FALSE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator({'?a': 'https://example.org/image#xwhy=percent:10,4,10,15'}).should.equal(FALSE);
      })

      var evaluator_1 = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#within',
        args: [
          'https://example.org/image#xywh=15,5,2,10',
          '?a',
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=10,4,10,15'}).should.equal(TRUE);
      })
      it('should return an XSD true value when relation is met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=10,4,10,15&t=10,20'}).should.equal(TRUE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=10,4,4,2'}).should.equal(FALSE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator_1({'?a': 'https://example.org/image#xwhy=10?,4,10,15'}).should.equal(FALSE);
      })

      it('should return an XSD false when combined percentual and pixel URI is used', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=percent:10,4,10,15'}).should.equal(FALSE);
      })
    });

    describe('of a SPARQL-MM spatial coveredBy operation', function(){
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#coveredBy',
        args: [
          'https://example.org/image#xywh=percent:15,5,2,10',
          '?a',
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:10,4,10,15'}).should.equal(TRUE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:10,4,10,2'}).should.equal(FALSE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator({'?a': 'https://example.org/image#xwhy=percent:10,4,10,15'}).should.equal(FALSE);
      })

      var evaluator_1 = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#coveredBy',
        args: [
          'https://example.org/image#xywh=15,5,2,10',
          '?a',
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=10,4,10,15'}).should.equal(TRUE);
      })
      it('should return an XSD true value when relation is met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=10,4,10,15&t=10,20'}).should.equal(TRUE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=10,4,4,2'}).should.equal(FALSE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator_1({'?a': 'https://example.org/image#xwhy=10?,4,10,15'}).should.equal(FALSE);
      })

      it('should return an XSD false when combined percentual and pixel URI is used', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=percent:10,4,10,15'}).should.equal(FALSE);
      })
    });

    describe('of a SPARQL-MM spatial crosses operation', function(){
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#crosses',
        args: [
          '?a',
          'https://example.org/image#xywh=percent:15,5,2,10',
          
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:14,4,21,32'}).should.equal(TRUE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:10,3,1,1'}).should.equal(FALSE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator({'?a': 'https://example.org/image#xwhy=percent:10,4,10,15'}).should.equal(FALSE);
      })

      var evaluator_1 = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#crosses',
        args: [
          'https://example.org/image#xywh=15,5,2,10',
          '?a',
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=14,4,21,32'}).should.equal(TRUE);
      })
      it('should return an XSD true value when relation is met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=14,4,21,32&t=10,20'}).should.equal(TRUE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=10,3,1,1'}).should.equal(FALSE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator_1({'?a': 'https://example.org/image#xwhy=14?,4,21,32'}).should.equal(FALSE);
      })

      it('should return an XSD false when combined percentual and pixel URI is used', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=percent:14,4,21,32'}).should.equal(FALSE);
      })
    });

    describe('of a SPARQL-MM spatial overlaps operation', function(){
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#spatialOverlaps',
        args: [
          '?a',
          'https://example.org/image#xywh=percent:15,5,2,10',
          
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:14,4,21,32'}).should.equal(TRUE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:15,5,2,10'}).should.equal(FALSE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator({'?a': 'https://example.org/image#xwhy=percent:10,4,10,15'}).should.equal(FALSE);
      })

      var evaluator_1 = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#spatialOverlaps',
        args: [
          'https://example.org/image#xywh=15,5,2,10',
          '?a',
        ],
      });
      it('should return an XSD true value when relation is met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=14,4,21,32'}).should.equal(TRUE);
      })
      it('should return an XSD true value when relation is met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=14,4,21,32&t=10,20'}).should.equal(TRUE);
      })

      it('should return an XSD false value when relation is not met', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=11,1,2,3'}).should.equal(FALSE);
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator_1({'?a': 'https://example.org/image#xwhy=14?,4,21,32'}).should.equal(FALSE);
      })

      it('should return an XSD false when combined percentual and pixel URI is used', function(){
        evaluator_1({'?a': 'https://example.org/image#xywh=percent:14,4,21,32'}).should.equal(FALSE);
      })
    });

    /**
     * Start of SPARQL-MM spatial accessor/aggregation functions tests
     */

    describe('of a SPARQL-MM spatial area operation', function(){
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#area',
        args: [
          '?a',
        ],
      });
      it('should return the area of the spatial fragment provided to it', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:14,4,21,32'}).should.equal("6.72");
      })

      it('should return an empty value of no valid spatial fragment is entered', function(){
        evaluator({'?a': 'https://example.org/image#xwhy=percent:10,4,10,15'}).should.equal("");
      })

      it('should return an empty value of no valid spatial fragment is entered', function(){
        evaluator({'?a': 'https://example.org/image#t=10,4'}).should.equal("");
      })

      var evaluator_1 = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#area',
        args: [
          '?a',
        ],
      });
      it('should return the area of the spatial fragment provided to it', function(){
        evaluator({'?a': 'https://example.org/image#xywh=14,4,21,32'}).should.equal("672");
      })

      it('should return an empty value of no valid spatial fragment is entered', function(){
        evaluator({'?a': 'https://example.org/image#xwhy=10,-1,10,15'}).should.equal("");
      })

      it('should return an empty value of no valid spatial fragment is entered', function(){
        evaluator({'?a': 'https://example.org/image#t=10,4'}).should.equal("");
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator_1({'?a': 'https://example.org/image#xwhy=14?,4,21,32'}).should.equal("");
      })
    });

    describe('of a SPARQL-MM spatial center operation', function(){
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#center',
        args: [
          '?a',
        ],
      });
      it('should return the center of the spatial fragment provided to it', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:10,10,10,10'}).should.equal("(15,15)");
      })

      it('should return an empty value of no valid spatial fragment is entered', function(){
        evaluator({'?a': 'https://example.org/image#xwhy=percent:10,4,10,15'}).should.equal("");
      })

      it('should return an empty value of no valid spatial fragment is entered', function(){
        evaluator({'?a': 'https://example.org/image#t=10,4'}).should.equal("");
      })

      var evaluator_1 = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#center',
        args: [
          '?a',
        ],
      });
      it('should return the area of the spatial fragment provided to it', function(){
        evaluator({'?a': 'https://example.org/image#xywh=10,10,10,10'}).should.equal("(15,15)");
      })

      it('should return the area of the spatial fragment provided to it with spatiotemporal fragments', function(){
        evaluator({'?a': 'https://example.org/image#xywh=10,10,10,10&t=10,20'}).should.equal("(15,15)");
      })

      it('should return an empty value of no valid spatial fragment is entered', function(){
        evaluator({'?a': 'https://example.org/image#xwhy=10,10,10,10'}).should.equal("");
      })

      it('should return an empty value of no valid spatial fragment is entered', function(){
        evaluator({'?a': 'https://example.org/image#t=10,4'}).should.equal("");
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator_1({'?a': 'https://example.org/image#xwhy=14?,4,21,32'}).should.equal("");
      })
    });

    describe('of a SPARQL-MM spatial height operation', function(){
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#height',
        args: [
          '?a',
        ],
      });
      it('should return the center of the spatial fragment provided to it', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:10,10,10,10'}).should.equal("10");
      })

      it('should return an empty value of no valid spatial fragment is entered', function(){
        evaluator({'?a': 'https://example.org/image#xwhy=percent:10,4,10,15'}).should.equal("");
      })

      it('should return an empty value of no valid spatial fragment is entered', function(){
        evaluator({'?a': 'https://example.org/image#t=10,4'}).should.equal("");
      })

      var evaluator_1 = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#height',
        args: [
          '?a',
        ],
      });
      it('should return the area of the spatial fragment provided to it', function(){
        evaluator({'?a': 'https://example.org/image#xywh=10,10,10,10'}).should.equal("10");
      })

      it('should return the area of the spatial fragment provided to it with spatiotemporal fragments', function(){
        evaluator({'?a': 'https://example.org/image#xywh=10,10,10,10&t=10,20'}).should.equal("10");
      })

      it('should return an empty value of no valid spatial fragment is entered', function(){
        evaluator({'?a': 'https://example.org/image#xwhy=10,10,10,10'}).should.equal("");
      })

      it('should return an empty value of no valid spatial fragment is entered', function(){
        evaluator({'?a': 'https://example.org/image#t=10,4'}).should.equal("");
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator_1({'?a': 'https://example.org/image#xwhy=14?,4,21,32'}).should.equal("");
      })
    });

    describe('of a SPARQL-MM spatial width operation', function(){
      var evaluator = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#width',
        args: [
          '?a',
        ],
      });
      it('should return the center of the spatial fragment provided to it', function(){
        evaluator({'?a': 'https://example.org/image#xywh=percent:10,10,10,10'}).should.equal("10");
      })

      it('should return an empty value of no valid spatial fragment is entered', function(){
        evaluator({'?a': 'https://example.org/image#xwhy=percent:10,4,10,15'}).should.equal("");
      })

      it('should return an empty value of no valid spatial fragment is entered', function(){
        evaluator({'?a': 'https://example.org/image#t=10,4'}).should.equal("");
      })

      var evaluator_1 = SparqlExpressionEvaluator({
        type: 'operation',
        operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#width',
        args: [
          '?a',
        ],
      });
      it('should return the area of the spatial fragment provided to it', function(){
        evaluator({'?a': 'https://example.org/image#xywh=10,10,10,10'}).should.equal("10");
      })

      it('should return the area of the spatial fragment provided to it with spatiotemporal fragments', function(){
        evaluator({'?a': 'https://example.org/image#xywh=10,10,10,10&t=10,20'}).should.equal("10");
      })

      it('should return an empty value of no valid spatial fragment is entered', function(){
        evaluator({'?a': 'https://example.org/image#xwhy=10,10,10,10'}).should.equal("");
      })

      it('should return an empty value of no valid spatial fragment is entered', function(){
        evaluator({'?a': 'https://example.org/image#t=10,4'}).should.equal("");
      })

      it('should return an XSD false when not valid media fragment URI is passed', function(){
        evaluator_1({'?a': 'https://example.org/image#xwhy=14?,4,21,32'}).should.equal("");
      })
    });
  });

  describe('of a SPARQL-MM spatial xy operation', function(){
    var evaluator = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#xy',
      args: [
        '?a',
      ],
    });
    it('should return the center of the spatial fragment provided to it', function(){
      evaluator({'?a': 'https://example.org/image#xywh=percent:10,10,10,10'}).should.equal("(10,10)");
    })

    it('should return an empty value of no valid spatial fragment is entered', function(){
      evaluator({'?a': 'https://example.org/image#xwhy=percent:10,4,10,15'}).should.equal("");
    })

    it('should return an empty value of no valid spatial fragment is entered', function(){
      evaluator({'?a': 'https://example.org/image#t=10,4'}).should.equal("");
    })

    var evaluator_1 = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#width',
      args: [
        '?a',
      ],
    });
    it('should return the area of the spatial fragment provided to it', function(){
      evaluator({'?a': 'https://example.org/image#xywh=10,10,10,10'}).should.equal("(10,10)");
    })

    it('should return the area of the spatial fragment provided to it with spatiotemporal fragments', function(){
      evaluator({'?a': 'https://example.org/image#xywh=10,10,10,10&t=10,20'}).should.equal("(10,10)");
    })

    it('should return an empty value of no valid spatial fragment is entered', function(){
      evaluator({'?a': 'https://example.org/image#xwhy=10,10,10,10'}).should.equal("");
    })

    it('should return an empty value of no valid spatial fragment is entered', function(){
      evaluator({'?a': 'https://example.org/image#t=10,4'}).should.equal("");
    })

    it('should return an XSD false when not valid media fragment URI is passed', function(){
      evaluator_1({'?a': 'https://example.org/image#xwhy=14?,4,21,32'}).should.equal("");
    })
  });

  describe('of a SPARQL-MM spatialFragment operation', function(){
    var evaluator = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#spatialFragment',
      args: [
        '?a',
      ],
    });
    it('should return the center of the spatial fragment provided to it', function(){
      evaluator({'?a': 'https://example.org/image#xywh=percent:10,10,10,10'}).should.equal("xywh=percent:10,10,10,10");
    })

    it('should return an empty value of no valid spatial fragment is entered', function(){
      evaluator({'?a': 'https://example.org/image#xwhy=percent:10,4,10,15'}).should.equal("");
    })

    it('should return an empty value of no valid spatial fragment is entered', function(){
      evaluator({'?a': 'https://example.org/image#t=10,4'}).should.equal("");
    })

    var evaluator_1 = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#spatialFragment',
      args: [
        '?a',
      ],
    });
    it('should return the area of the spatial fragment provided to it', function(){
      evaluator({'?a': 'https://example.org/image#xywh=10,10,10,10'}).should.equal("xywh=pixel:10,10,10,10");
    })

    it('should return the area of the spatial fragment provided to it with spatiotemporal fragments', function(){
      evaluator({'?a': 'https://example.org/image#xywh=10,10,10,10&t=10,20'}).should.equal("xywh=pixel:10,10,10,10");
    })

    it('should return an empty value of no valid spatial fragment is entered', function(){
      evaluator({'?a': 'https://example.org/image#xwhy=10,10,10,10'}).should.equal("");
    })

    it('should return an empty value of no valid spatial fragment is entered', function(){
      evaluator({'?a': 'https://example.org/image#t=10,4'}).should.equal("");
    })

    it('should return an XSD false when not valid media fragment URI is passed', function(){
      evaluator_1({'?a': 'https://example.org/image#xwhy=14?,4,21,32'}).should.equal("");
    })
  });

  describe('of a SPARQL-MM spatialFragment operation', function(){
    var evaluator = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#hasSpatialFragment',
      args: [
        '?a',
      ],
    });
    it('should return the center of the spatial fragment provided to it', function(){
      evaluator({'?a': 'https://example.org/image#xywh=percent:10,10,10,10'}).should.equal(TRUE);
    })

    it('should return an empty value of no valid spatial fragment is entered', function(){
      evaluator({'?a': 'https://example.org/image#xwhy=percent:10,4,10,15'}).should.equal(FALSE);
    })

    it('should return an empty value of no valid spatial fragment is entered', function(){
      evaluator({'?a': 'https://example.org/image#t=10,4'}).should.equal(FALSE);
    })

    var evaluator_1 = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#hasSpatialFragment',
      args: [
        '?a',
      ],
    });
    it('should return the area of the spatial fragment provided to it', function(){
      evaluator({'?a': 'https://example.org/image#xywh=10,10,10,10'}).should.equal(TRUE);
    })

    it('should return the area of the spatial fragment provided to it with spatiotemporal fragments', function(){
      evaluator({'?a': 'https://example.org/image#xywh=10,10,10,10&t=10,20'}).should.equal(TRUE);
    })

    it('should return an empty value of no valid spatial fragment is entered', function(){
      evaluator({'?a': 'https://example.org/image#xwhy=10,10,10,10'}).should.equal(FALSE);
    })

    it('should return an empty value of no valid spatial fragment is entered', function(){
      evaluator({'?a': 'https://example.org/image#t=10,4'}).should.equal(FALSE);
    })

    it('should return an XSD false when not valid media fragment URI is passed', function(){
      evaluator_1({'?a': 'https://example.org/image#xwhy=14?,4,21,32'}).should.equal(FALSE);
    })
  });

  describe('of a SPARQL-MM spatialBoundingBox operation', function(){
    var evaluator = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#spatialBoundingBox',
      args: [
        '?a',
        'https://example.org/image#xywh=percent:15,5,2,10',
      ],
    });
    it('should return the bounding box containing both spatial fragments provided', function(){
      evaluator({'?a': 'https://example.org/image#xywh=percent:10,10,10,10'}).should.equal("https://example.org/image#xywh=percent:10,5,10,10");
    })

    it('should return an empty value of no valid spatial fragment is entered', function(){
      expect(function(){evaluator({'?a': 'https://example.org/image#xwhy=percent:10,4,10,15'})}).to.throw("Could not aggregate the provided media fragments with given URI: https://example.org/image#xwhy=percent:10,4,10,15, https://example.org/image#xywh=percent:15,5,2,10")
    })

    it('should return an empty value of no valid spatial fragment is entered', function(){
      expect(function(){evaluator({'?a': 'https://example.org/image#t=10,4'})}).to.throw("Could not aggregate the provided media fragments with given URI: https://example.org/image#t=10,4, https://example.org/image#xywh=percent:15,5,2,10")
    })

    var evaluator_1 = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#spatialBoundingBox',
      args: [
        '?a',
        'https://example.org/image#xywh=15,5,2,10',
      ],
    });
    
    it('should return the area of the spatial fragment provided to it', function(){
      evaluator_1({'?a': 'https://example.org/image#xywh=10,10,10,10'}).should.equal("https://example.org/image#xywh=pixel:10,5,10,10");
    })

    it('should return the area of the spatial fragment provided to it with spatiotemporal fragments', function(){
      evaluator_1({'?a': 'https://example.org/image#xywh=10,10,10,10&t=10,20'}).should.equal("https://example.org/image#xywh=pixel:10,5,10,10");
    })

    it('should return an empty value of no valid spatial fragment is entered', function(){
      expect(function(){evaluator_1({'?a': 'https://example.org/image#xwhy=10,10,10,10'})}).to.throw("Could not aggregate the provided media fragments with given URI: https://example.org/image#xwhy=10,10,10,10, https://example.org/image#xywh=15,5,2,10")
    })

    it('should return an empty value of no valid spatial fragment is entered', function(){
      expect(function(){evaluator_1({'?a': 'https://example.org/image#t=10,4'})}).to.throw("Could not aggregate the provided media fragments with given URI: https://example.org/image#t=10,4, https://example.org/image#xywh=15,5,2,10")
    })

    it('should return an XSD false when not valid media fragment URI is passed', function(){
      expect(function(){evaluator_1({'?a': 'https://example.org/image#xwhy=14?,4,21,32'})}).to.throw("Could not aggregate the provided media fragments with given URI: https://example.org/image#xwhy=14?,4,21,32, https://example.org/image#xywh=15,5,2,10")
    })
  });

  describe('of a SPARQL-MM spatialIntersection operation', function(){
    var evaluator = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#spatialIntersection',
      args: [
        '?a',
        'https://example.org/image#xywh=percent:15,5,2,10',
      ],
    });
    it('should return the bounding box containing both spatial fragments provided', function(){
      evaluator({'?a': 'https://example.org/image#xywh=percent:10,10,10,10'}).should.equal("https://example.org/image#xywh=percent:15,10,2,5");
    })

    it('should return an empty value of no valid spatial fragment is entered', function(){
      expect(function(){evaluator({'?a': 'https://example.org/image#xwhy=percent:10,4,10,15'})}).to.throw("Could not calculate the intersection of the provided media fragments with given URI: https://example.org/image#xwhy=percent:10,4,10,15, https://example.org/image#xywh=percent:15,5,2,10")
    })

    it('should return an empty value of no valid spatial fragment is entered', function(){
      expect(function(){evaluator({'?a': 'https://example.org/image#t=10,4'})}).to.throw("Could not calculate the intersection of the provided media fragments with given URI: https://example.org/image#t=10,4, https://example.org/image#xywh=percent:15,5,2,10")
    })

    var evaluator_1 = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#spatialIntersection',
      args: [
        '?a',
        'https://example.org/image#xywh=15,5,2,10',
      ],
    });
    
    it('should return the area of the spatial fragment provided to it', function(){
      evaluator_1({'?a': 'https://example.org/image#xywh=10,10,10,10'}).should.equal("https://example.org/image#xywh=pixel:15,10,2,5");
    })

    it('should return the area of the spatial fragment provided to it with spatiotemporal fragments', function(){
      evaluator_1({'?a': 'https://example.org/image#xywh=10,10,10,10&t=10,20'}).should.equal("https://example.org/image#xywh=pixel:15,10,2,5");
    })

    it('should return an empty value of no valid spatial fragment is entered', function(){
      expect(function(){evaluator_1({'?a': 'https://example.org/image#xwhy=10,10,10,10'})}).to.throw("Could not calculate the intersection of the provided media fragments with given URI: https://example.org/image#xwhy=10,10,10,10, https://example.org/image#xywh=15,5,2,10")
    })

    it('should return an empty value of no valid spatial fragment is entered', function(){
      expect(function(){evaluator_1({'?a': 'https://example.org/image#t=10,4'})}).to.throw("Could not calculate the intersection of the provided media fragments with given URI: https://example.org/image#t=10,4, https://example.org/image#xywh=15,5,2,10")
    })

    it('should return an XSD false when not valid media fragment URI is passed', function(){
      expect(function(){evaluator_1({'?a': 'https://example.org/image#xwhy=14?,4,21,32'})}).to.throw("Could not calculate the intersection of the provided media fragments with given URI: https://example.org/image#xwhy=14?,4,21,32, https://example.org/image#xywh=15,5,2,10")
    })
  });

  /**
   * Start of SPARQL-MM temporal realtional functions
   */

  describe('of a SPARQL-MM temporal overlaps operation', function(){
    var evaluator = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#temporalOverlaps',
      args: [
        '?a',
        'https://example.org/image#t=10,20',
      ],
    });
    it('should return an XSD true value when relation is met', function(){
      evaluator({'?a': 'https://example.org/image#t=5,15'}).should.equal(TRUE);
    })

    it('should return an XSD false value when relation is not met', function(){
      evaluator({'?a': 'https://example.org/image#t=5,25'}).should.equal(FALSE);
    })

    it('should return an XSD false value when relation is not met', function(){
      evaluator({'?a': 'https://example.org/image#t=15,17'}).should.equal(FALSE);
    })

    it('should return an XSD false when not valid media fragment URI is passed', function(){
      evaluator({'?a': 'https://example.org/image#t=11,5'}).should.equal(FALSE);
    })
  });

  describe('of a SPARQL-MM temporal overlapped by operation', function(){
    var evaluator = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#overlappedBy',
      args: [
        'https://example.org/image#t=10,20',
        '?a',
      ],
    });
    it('should return an XSD true value when relation is met', function(){
      evaluator({'?a': 'https://example.org/image#t=5,15'}).should.equal(TRUE);
    })

    it('should return an XSD false value when relation is not met', function(){
      evaluator({'?a': 'https://example.org/image#t=5,25'}).should.equal(FALSE);
    })

    it('should return an XSD false value when relation is not met', function(){
      evaluator({'?a': 'https://example.org/image#t=15,17'}).should.equal(FALSE);
    })

    it('should return an XSD false when not valid media fragment URI is passed', function(){
      evaluator({'?a': 'https://example.org/image#t=11,5'}).should.equal(FALSE);
    })
  });

  describe('of a SPARQL-MM temporal precedes by operation', function(){
    var evaluator = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#precedes',
      args: [
        '?a',
        'https://example.org/image#t=10,20',
      ],
    });
    it('should return an XSD true value when relation is met', function(){
      evaluator({'?a': 'https://example.org/image#t=5,9'}).should.equal(TRUE);
    })

    it('should return an XSD false value when relation is not met', function(){
      evaluator({'?a': 'https://example.org/image#t=5,25'}).should.equal(FALSE);
    })

    it('should return an XSD false value when relation is not met', function(){
      evaluator({'?a': 'https://example.org/image#t=15,17'}).should.equal(FALSE);
    })

    it('should return an XSD false when not valid media fragment URI is passed', function(){
      evaluator({'?a': 'https://example.org/image#t=11,5'}).should.equal(FALSE);
    })
  });

  describe('of a SPARQL-MM temporal precededBy by operation', function(){
    var evaluator = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#precededBy',
      args: [
        'https://example.org/image#t=10,20',
        '?a',
      ],
    });
    it('should return an XSD true value when relation is met', function(){
      evaluator({'?a': 'https://example.org/image#t=5,9'}).should.equal(TRUE);
    })

    it('should return an XSD false value when relation is not met', function(){
      evaluator({'?a': 'https://example.org/image#t=5,25'}).should.equal(FALSE);
    })

    it('should return an XSD false value when relation is not met', function(){
      evaluator({'?a': 'https://example.org/image#t=15,17'}).should.equal(FALSE);
    })

    it('should return an XSD false when not valid media fragment URI is passed', function(){
      evaluator({'?a': 'https://example.org/image#t=11,5'}).should.equal(FALSE);
    })
  });

  describe('of a SPARQL-MM temporal after by operation', function(){
    var evaluator = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#after',
      args: [
        '?a',
        'https://example.org/image#t=10,20',
      ],
    });
    it('should return an XSD true value when relation is met', function(){
      evaluator({'?a': 'https://example.org/image#t=21,50'}).should.equal(TRUE);
    })

    it('should return an XSD false value when relation is not met', function(){
      evaluator({'?a': 'https://example.org/image#t=5,25'}).should.equal(FALSE);
    })

    it('should return an XSD false when not valid media fragment URI is passed', function(){
      evaluator({'?a': 'https://example.org/image#t=21,5'}).should.equal(FALSE);
    })
  });

  describe('of a SPARQL-MM temporal during by operation', function(){
    var evaluator = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#during',
      args: [
        '?a',
        'https://example.org/image#t=10,20',
      ],
    });
    it('should return an XSD true value when relation is met', function(){
      evaluator({'?a': 'https://example.org/image#t=11,17'}).should.equal(TRUE);
    })

    it('should return an XSD false value when relation is not met', function(){
      evaluator({'?a': 'https://example.org/image#t=5,25'}).should.equal(FALSE);
    })

    it('should return an XSD false when not valid media fragment URI is passed', function(){
      evaluator({'?a': 'https://example.org/image#t=17,11'}).should.equal(FALSE);
    })
  });

  describe('of a SPARQL-MM temporal finishes by operation', function(){
    var evaluator = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#finishes',
      args: [
        '?a',
        'https://example.org/image#t=10,20',
      ],
    });
    it('should return an XSD true value when relation is met', function(){
      evaluator({'?a': 'https://example.org/image#t=11,20'}).should.equal(TRUE);
    })

    it('should return an XSD false value when relation is not met', function(){
      evaluator({'?a': 'https://example.org/image#t=11,19'}).should.equal(FALSE);
    })

    it('should return an XSD false when not valid media fragment URI is passed', function(){
      evaluator({'?a': 'https://example.org/image#t=20,11'}).should.equal(FALSE);
    })
  });

  describe('of a SPARQL-MM temporal finishedBy operation', function(){
    var evaluator = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#finishedBy',
      args: [
        'https://example.org/image#t=10,20',
        '?a',
      ],
    });
    it('should return an XSD true value when relation is met', function(){
      evaluator({'?a': 'https://example.org/image#t=11,20'}).should.equal(TRUE);
    })

    it('should return an XSD false value when relation is not met', function(){
      evaluator({'?a': 'https://example.org/image#t=11,19'}).should.equal(FALSE);
    })

    it('should return an XSD false when not valid media fragment URI is passed', function(){
      evaluator({'?a': 'https://example.org/image#t=20,11'}).should.equal(FALSE);
    })
  });

  describe('of a SPARQL-MM temporal meets operation', function(){
    var evaluator = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#temporalMeets',
      args: [
        '?a',
        'https://example.org/image#t=10,20',
      ],
    });
    it('should return an XSD true value when relation is met', function(){
      evaluator({'?a': 'https://example.org/image#t=5,10'}).should.equal(TRUE);
    })

    it('should return an XSD false value when relation is not met', function(){
      evaluator({'?a': 'https://example.org/image#t=5,11'}).should.equal(FALSE);
    })

    it('should return an XSD false when not valid media fragment URI is passed', function(){
      evaluator({'?a': 'https://example.org/image#t=10,5'}).should.equal(FALSE);
    })
  });

  describe('of a SPARQL-MM temporal metBy operation', function(){
    var evaluator = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#metBy',
      args: [
        'https://example.org/image#t=10,20',
        '?a', 
      ],
    });
    it('should return an XSD true value when relation is met', function(){
      evaluator({'?a': 'https://example.org/image#t=5,10'}).should.equal(TRUE);
    })

    it('should return an XSD false value when relation is not met', function(){
      evaluator({'?a': 'https://example.org/image#t=5,11'}).should.equal(FALSE);
    })

    it('should return an XSD false when not valid media fragment URI is passed', function(){
      evaluator({'?a': 'https://example.org/image#t=10,5'}).should.equal(FALSE);
    })
  });

  describe('of a SPARQL-MM temporal starts operation', function(){
    var evaluator = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#starts',
      args: [
        '?a',
        'https://example.org/image#t=10,20',
      ],
    });
    it('should return an XSD true value when relation is met', function(){
      evaluator({'?a': 'https://example.org/image#t=10,15'}).should.equal(TRUE);
    })

    it('should return an XSD false value when relation is not met', function(){
      evaluator({'?a': 'https://example.org/image#t=1,11'}).should.equal(FALSE);
    })

    it('should return an XSD false when not valid media fragment URI is passed', function(){
      evaluator({'?a': 'https://example.org/image#t=10,5'}).should.equal(FALSE);
    })
  });

  describe('of a SPARQL-MM temporal starts operation', function(){
    var evaluator = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#startedBy',
      args: [
        
        'https://example.org/image#t=10,20',
        '?a',
      ],
    });
    it('should return an XSD true value when relation is met', function(){
      evaluator({'?a': 'https://example.org/image#t=10,15'}).should.equal(TRUE);
    })

    it('should return an XSD false value when relation is not met', function(){
      evaluator({'?a': 'https://example.org/image#t=1,11'}).should.equal(FALSE);
    })

    it('should return an XSD false when not valid media fragment URI is passed', function(){
      evaluator({'?a': 'https://example.org/image#t=10,5'}).should.equal(FALSE);
    })
  });

  describe('of a SPARQL-MM temporal contains operation', function(){
    var evaluator = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#temporalContains',
      args: [
        '?a',
        'https://example.org/image#t=10,20',
      ],
    });
    it('should return an XSD true value when relation is met', function(){
      evaluator({'?a': 'https://example.org/image#t=8,21'}).should.equal(TRUE);
    })

    it('should return an XSD false value when relation is not met', function(){
      evaluator({'?a': 'https://example.org/image#t=5,11'}).should.equal(FALSE);
    })

    it('should return an XSD false when not valid media fragment URI is passed', function(){
      evaluator({'?a': 'https://example.org/image#t=21,8'}).should.equal(FALSE);
    })
  });

  describe('of a SPARQL-MM temporal equals operation', function(){
    var evaluator = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#temporalEquals',
      args: [
        '?a',
        'https://example.org/image#t=10,20',
      ],
    });
    it('should return an XSD true value when relation is met', function(){
      evaluator({'?a': 'https://example.org/image#t=10,20'}).should.equal(TRUE);
    })

    it('should return an XSD false value when relation is not met', function(){
      evaluator({'?a': 'https://example.org/image#t=9,21'}).should.equal(FALSE);
    })

    it('should return an XSD false when not valid media fragment URI is passed', function(){
      evaluator({'?a': 'https://example.org/image#t=20,10'}).should.equal(FALSE);
    })
  });

  /**
   * Start of SPRAQL-MM temporal accessor and aggregation functions
   */

  describe('of a SPARQL-MM temporal intermediate operation', function(){
    var evaluator = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#temporalIntermediate',
      args: [
        '?a',
        'https://example.org/image#t=10,20',
      ],
    });
    it('should return the intermediate fragment when two temporal fragments are passed', function(){
      evaluator({'?a': 'https://example.org/image#t=5,9'}).should.equal("https://example.org/image#t=9,10");
    })

    it('should return the intermediate fragment when two temporal fragments are passed', function(){
      evaluator({'?a': 'https://example.org/image#t=5,9&xywh=5,5,10,10'}).should.equal("https://example.org/image#t=9,10");
    })

    it('should "No intermediate" if the two temporal fragments have no intermediate', function(){
      evaluator({'?a': 'https://example.org/image#t=8,12'}).should.equal("No intermediate");
    })

    it('should return error not valid media fragment URI is passed', function(){
      evaluator({'?a': 'https://example.org/image#t=20,10'}).should.equal("No intermediate");
    })
  });

  describe('of a SPARQL-MM temporal boundingbox operation', function(){
    var evaluator = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#temporalBoundingBox',
      args: [
        '?a',
        'https://example.org/image#t=10,20',
      ],
    });
    it('should return the bounding box fragment when two temporal fragments are passed', function(){
      evaluator({'?a': 'https://example.org/image#t=5,9'}).should.equal("https://example.org/image#t=5,20");
    })

    it('should return the bounding box fragment when two temporal fragments are passed', function(){
      evaluator({'?a': 'https://example.org/image#t=5,9&xywh=5,5,10,10'}).should.equal("https://example.org/image#t=5,20");
    })

    it('should return error not valid media fragment URI is passed', function(){
      evaluator({'?a': 'https://example.org/image#t=20,10'}).should.equal("No temporal bounding box");
    })
  });

  describe('of a SPARQL-MM temporal intersection operation', function(){
    var evaluator = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#temporalIntersection',
      args: [
        '?a',
        'https://example.org/image#t=10,20',
      ],
    });
    it('should return the intersection fragment when two temporal fragments are passed', function(){
      evaluator({'?a': 'https://example.org/image#t=8,15'}).should.equal("https://example.org/image#t=10,15");
    })

    it('should return the intersection fragment when two temporal fragments are passed', function(){
      evaluator({'?a': 'https://example.org/image#t=9,16&xywh=5,5,10,10'}).should.equal("https://example.org/image#t=10,16");
    })

    it('should return "no intersection" when none is found', function(){
      evaluator({'?a': 'https://example.org/image#t=7,9&xywh=5,5,10,10'}).should.equal("No intersection");
    })

    it('should "no intersection" when not valid media fragment URI is passed', function(){
      evaluator({'?a': 'https://example.org/image#t=20,10'}).should.equal("No intersection");
    })
  });

  describe('of a SPARQL-MM temporal duration operation', function(){
    var evaluator = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#duration',
      args: [
        '?a',
      ],
    });
    it('should return the duration of the fragment', function(){
      evaluator({'?a': 'https://example.org/image#t=8,15'}).should.equal("7");
    })

    it('should return duration of the fragment', function(){
      evaluator({'?a': 'https://example.org/image#t=9,16&xywh=5,5,10,10'}).should.equal("7");
    })


    it('should "" when not valid media fragment URI is passed', function(){
      evaluator({'?a': 'https://example.org/image#t=20,10'}).should.equal("");
    })
  });

  describe('of a SPARQL-MM temporal end operation', function(){
    var evaluator = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#end',
      args: [
        '?a',
      ],
    });
    it('should return the duration of the fragment', function(){
      evaluator({'?a': 'https://example.org/image#t=8,15'}).should.equal("15");
    })

    it('should return duration of the fragment', function(){
      evaluator({'?a': 'https://example.org/image#t=9,16&xywh=5,5,10,10'}).should.equal("16");
    })


    it('should "" when not valid media fragment URI is passed', function(){
      evaluator({'?a': 'https://example.org/image#t=20,10'}).should.equal("");
    })
  });

  describe('of a SPARQL-MM temporal start operation', function(){
    var evaluator = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#start',
      args: [
        '?a',
      ],
    });
    it('should return the duration of the fragment', function(){
      evaluator({'?a': 'https://example.org/image#t=8,15'}).should.equal("8");
    })

    it('should return duration of the fragment', function(){
      evaluator({'?a': 'https://example.org/image#t=9,16&xywh=5,5,10,10'}).should.equal("9");
    })


    it('should "" when not valid media fragment URI is passed', function(){
      evaluator({'?a': 'https://example.org/image#t=20,10'}).should.equal("");
    })
  });

  describe('of a SPARQL-MM temporal fragment operation', function(){
    var evaluator = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#temporalFragment',
      args: [
        '?a',
      ],
    });
    it('should return the duration of the fragment', function(){
      evaluator({'?a': 'https://example.org/image#t=8,15'}).should.equal("t=8,15");
    })

    it('should return duration of the fragment', function(){
      evaluator({'?a': 'https://example.org/image#t=9,16&xywh=5,5,10,10'}).should.equal("t=9,16");
    })


    it('should "" when not valid media fragment URI is passed', function(){
      evaluator({'?a': 'https://example.org/image#t=20,10'}).should.equal("");
    })
  });

  describe('of a SPARQL-MM has temporal fragment operation', function(){
    var evaluator = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#hasTemporalFragment',
      args: [
        '?a',
      ],
    });
    it('should return the duration of the fragment', function(){
      evaluator({'?a': 'https://example.org/image#t=8,15'}).should.equal(TRUE);
    })

    it('should return duration of the fragment', function(){
      evaluator({'?a': 'https://example.org/image#t=9,16&xywh=5,5,10,10'}).should.equal(TRUE);
    })


    it('should "" when not valid media fragment URI is passed', function(){
      evaluator({'?a': 'https://example.org/image#t=20,10'}).should.equal(FALSE);
    })
  });

  /**
   * Begin of SPARQL-MM spatiotemporal functions
   */
  describe('of a SPARQL-MM spatiotemporal contains operation', function(){
    var evaluator = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#contains',
      args: [
        '?a',
        'https://example.org/image#t=10,20&xywh=10,10,10,10',
      ],
    });
    it('should return an XSD true value when relation is met', function(){
      evaluator({'?a': 'https://example.org/image#t=9,21&xywh=9,9,12,12'}).should.equal(TRUE);
    })

    it('should return an XSD false value when relation is not met', function(){
      evaluator({'?a': 'https://example.org/image#t=1,11&xywh=15,15,2,2'}).should.equal(FALSE);
    })

    it('should return an XSD false value when relation is not met', function(){
      evaluator({'?a': 'https://example.org/image#t=10,15&xywh=1,1,2,2'}).should.equal(FALSE);
    })

    it('should return an XSD false when not valid media fragment URI is passed', function(){
      evaluator({'?a': 'https://example.org/image#t=10,5'}).should.equal(FALSE);
    })
  });

  describe('of a SPARQL-MM spatiotemporal equals operation', function(){
    var evaluator = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#equals',
      args: [
        '?a',
        'https://example.org/image#t=10,20&xywh=10,10,10,10',
      ],
    });
    it('should return an XSD true value when relation is met', function(){
      evaluator({'?a': 'https://example.org/image#t=10,20&xywh=10,10,10,10'}).should.equal(TRUE);
    })

    it('should return an XSD false value when relation is not met', function(){
      evaluator({'?a': 'https://example.org/image#t=1,11&xywh=15,15,2,2'}).should.equal(FALSE);
    })

    it('should return an XSD false value when relation is not met', function(){
      evaluator({'?a': 'https://example.org/image#t=10,15&xywh=1,1,2,2'}).should.equal(FALSE);
    })

    it('should return an XSD false when not valid media fragment URI is passed', function(){
      evaluator({'?a': 'https://example.org/image#t=10,5'}).should.equal(FALSE);
    })
  });

  describe('of a SPARQL-MM spatiotemporal overlaps operation', function(){
    var evaluator = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#overlaps',
      args: [
        '?a',
        'https://example.org/image#t=10,20&xywh=15,5,2,10',
      ],
    });
    it('should return an XSD true value when relation is met', function(){
      evaluator({'?a': 'https://example.org/image#t=5,15&xywh=14,4,21,32'}).should.equal(TRUE);
    })

    it('should return an XSD false value when relation is not met', function(){
      evaluator({'?a': 'https://example.org/image#t=8,9&xywh=1,1,2,2'}).should.equal(FALSE);
    })

    it('should return an XSD false when not valid media fragment URI is passed', function(){
      evaluator({'?a': 'https://example.org/image#t=10,5'}).should.equal(FALSE);
    })
  });

  describe('of a SPARQL-MM spatiotemporal boundingbox operation', function(){
    var evaluator = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#boundingBox',
      args: [
        '?a',
        'https://example.org/image#t=10,20&xywh=15,5,2,10',
      ],
    });
    it('should return spatiotemporal bounding box', function(){
      evaluator({'?a': 'https://example.org/image#t=5,15&xywh=14,4,21,32'}).should.equal('https://example.org/image#xywh=pixel:14,4,21,32&t=5,20');
    })

    it('should return an error when not valid media fragment URI is passed', function(){
      evaluator({'?a': 'https://example.org/image#t=10,5'}).should.equal("Could not aggregate two media fragments");
    })
  });

  describe('of a SPARQL-MM spatiotemporal intersection operation', function(){
    var evaluator = SparqlExpressionEvaluator({
      type: 'operation',
      operator: 'http://linkedmultimedia.org/sparql-mm/ns/2.0.0/function#intersection',
      args: [
        '?a',
        'https://example.org/image#t=10,20&xywh=15,5,2,10',
      ],
    });
    it('should return spatiotemporal intersection', function(){
      evaluator({'?a': 'https://example.org/image#t=9,15&xywh=14,4,21,32'}).should.equal('https://example.org/image#xywh=pixel:15,5,2,10&t=10,15');
    })

    it('should return error when no temporal intersection found', function(){
      evaluator({'?a': 'https://example.org/image#t=11,15&xywh=14,4,21,32'}).should.equal('No intersection can be made: no temporal intersection');
    })

    it('should return error when no spatial intersection found', function(){
      evaluator({'?a': 'https://example.org/image#t=9,15&xywh=1,1,1,1'}).should.equal('No intersection can be made: no spatial intersection');
    })

    it('should return an error when not valid media fragment URI is passed', function(){
      evaluator({'?a': 'https://example.org/image#t=10,5'}).should.equal("Could not aggregate two media fragments: https://example.org/image#t=10,5, https://example.org/image#t=10,20&xywh=15,5,2,10");
    })
  });

});

describe('SparqlExpressionEvaluator.evaluate', function () {
  it('should return the evaluation of an expression for the given bindings', function () {
    SparqlExpressionEvaluator.evaluate({
      type: 'operation',
      operator: '+',
      args: ['?a', '?b'],
    }, {
      '?a': '"1"^^http://www.w3.org/2001/XMLSchema#integer',
      '?b': '"2"^^http://www.w3.org/2001/XMLSchema#integer',
    })
    .should.equal('"3"^^http://www.w3.org/2001/XMLSchema#integer');
  });

  it('should return undefined when not all bindings are present', function () {
    expect(SparqlExpressionEvaluator.evaluate({
      type: 'operation',
      operator: '+',
      args: ['?a', '?b'],
    }, {
      '?a': '"1"^^http://www.w3.org/2001/XMLSchema#integer',
    }))
    .to.be.undefined;
  });
});
