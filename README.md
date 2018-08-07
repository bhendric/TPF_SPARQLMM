# TPF with SPARQL-MM compatibility
This repo contains a proof-of-concept implementation for enabling the TPF client with SPARQL-MM functionality. This is an addition to the existing Triple Pattern Fragments Client. The altered client can resolve SPARQL-MM queries without having to alter them.

The SPARQL-MM enabled client has an added optional flags that can be passed when executing the client. When the `-o` flag is passed, the client will use the Media Fragments URI standard to optimise the query execution and perform query rewriting before execution. This way, the performance of the TPF client is improved. If the flag is not passed, the SPARQL-MM query will be solved without using the optimisations.

The server implementation of TPF needs no alteration to provide SPARQL-MM support. One requirement however is how the media data is defined in the RDF document as SPARQL-MM makes use of the Media Fragments URI standard. An example of how media and media fragments need to be defined can be found in the following example:

```
@prefix ns1: <http://purl.org/dc/elements/1.1/> .
@prefix ns2: <http://xmlns.com/foaf/0.1/> .
@prefix ns3: <http://www.w3.org/ns/ma-ont#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xml: <http://www.w3.org/XML/1998/namespace> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

<https://c1.staticflickr.com/1/10/11682923_79c2315639_o.jpg> a ns2:Image ;
    ns1:creator "Rocco Lucia" ;
    ns1:title "[What do you expect from Windows?]" ;
    ns3:hasFragment <https://c1.staticflickr.com/1/10/11682923_79c2315639_o.jpg#xywh=percent:1,0,99,100> .

<https://c1.staticflickr.com/1/10/11682923_79c2315639_o.jpg#xywh=percent:1,0,99,100> a ns3:MediaFragment ;
    ns1:description "Computer monitor" ;
    ns2:depicts <http://rdf.freebase.com/ns/m.02522> .

<https://c1.staticflickr.com/1/119/299164606_39e9159460_o.jpg> a ns2:Image ;
    ns1:creator "Alex Indigo" ;
    ns1:title "Dragon boat" ;
    ns3:hasFragment <https://c1.staticflickr.com/1/119/299164606_39e9159460_o.jpg#xywh=percent:12,38,63,30>,
        <https://c1.staticflickr.com/1/119/299164606_39e9159460_o.jpg#xywh=percent:5,50,88,30>,
        <https://c1.staticflickr.com/1/119/299164606_39e9159460_o.jpg#xywh=percent:8,49,55,21> .

<https://c1.staticflickr.com/1/119/299164606_39e9159460_o.jpg#xywh=percent:12,38,63,30> a ns3:MediaFragment ;
    ns1:description "Person" ;
    ns2:depicts <http://rdf.freebase.com/ns/m.01g317> .

<https://c1.staticflickr.com/1/119/299164606_39e9159460_o.jpg#xywh=percent:5,50,88,30> a ns3:MediaFragment ;
    ns1:description "Canoe" ;
    ns2:depicts <http://rdf.freebase.com/ns/m.0ph39> .

<https://c1.staticflickr.com/1/119/299164606_39e9159460_o.jpg#xywh=percent:8,49,55,21> a ns3:MediaFragment ;
    ns1:description "Paddle" ;
    ns2:depicts <http://rdf.freebase.com/ns/m.014y4n> .
```

The base media file must use the `http://www.w3.org/ns/ma-ont#hasFragment` predicate to indicate which fragments are present in the media file. Each of these fragments also needs to be defined on its own and indicate that it is a fragment with the `http://www.w3.org/ns/ma-ont#MediaFragment` URI. Next to this, the user is completely free to add triples containing more information about the media files.

## Installation

In order to install the latest version from GitHub:
```bash
git clone git@github.com:bhendric/TPF_SPARQLMM.git
cd TPF_SPARQLMM
npm install
```
This will install the SPARQL-MM enabled TPF client
