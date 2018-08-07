var rectangle = require('rectangle-node');

/**
 * Function to check the URI if it matches the Media Fragment URI standard using a regex
 * @param {*} uri 
 */
function isMediaFragment(uri){
  return uri.match(/^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/);
}

module.exports = {
  toObject: function(url) {
    if (!isMediaFragment(url)){
      throw new Error("Could not create media fragment object. Given URI is not a valid media fragment URI");
    }

    var obj = {
      base : url.split('#')[0]
    };
    var selector = url.split('#')[1];
    // Check if the selector function is a spatial media fragment selector
    if((selector.indexOf("xywh") >= 0) && (selector.indexOf("t=") < 0)) {
      obj.type = "spatial";
      // Check if we have a percentual selector or pixel selector
      if(selector.indexOf("percent") > -1) {
        obj.subtype = "percent";
        // We need to check whether the last value is followed by and & meaning that there is also a temporal fragment defined.
        var values = selector.split("percent:")[1].split(",").map(val => {return val.includes("&") ? Number(val.split("&")[0]) : Number(val)});
        obj.box = new rectangle(values[0], values[1], values[2], values[3]);
      }else{
        obj.subtype = "pixel";
        if(selector.indexOf("pixel") > -1){
          var values = selector.split("pixel:")[1].split(",").map(val => {return val.includes("&") ? Number(val.split("&")[0]) : Number(val)});
        }else{
          var values = selector.split("xywh=")[1].split(",").map(val => {return val.includes("&") ? Number(val.split("&")[0]) : Number(val)});
        }
        obj.box = new rectangle(values[0], values[1], values[2], values[3]);
      }
    
    // If we have a combined media fragments uri, we need to define extra attributes to the object and change type
    }else if ( selector.includes("xywh") && selector.includes("t=") ){
      obj.type = "combined";

      /**
       * Parsing the spatial portion of the media fragments uri
       */

      // Check if we have a percentual selector or pixel selector
      if(selector.indexOf("percent") > -1) {
        obj.subtype = "percent";
        // We need to check whether the last value is followed by and & meaning that there is also a temporal fragment defined.
        var values = selector.split("percent:")[1].split(",").map(val => {return val.includes("&") ? Number(val.split("&")[0]) : Number(val)});
        obj.box = new rectangle(values[0], values[1], values[2], values[3]);
      }else{
        obj.subtype = "pixel";
        if(selector.indexOf("pixel") > -1){
          var values = selector.split("pixel:")[1].split(",").map(val => {return val.includes("&") ? Number(val.split("&")[0]) : Number(val)});
        }else{
          var values = selector.split("xywh=")[1].split(",").map(val => {return val.includes("&") ? Number(val.split("&")[0]) : Number(val)});
        }
        obj.box = new rectangle(values[0], values[1], values[2], values[3]);
      }

      /**
       * Parsing the temporal portion of the media fragments uri
       */

      var temporalValues = selector.split("t=")[1].split(",").map(val => {return val.includes("&") ? Number(val.split("&")[0]) : Number(val)});
      if (temporalValues[0] < temporalValues[1]){
        obj.start = temporalValues[0];
        obj.end = temporalValues[1];
      }

    // If we have a temporal media fragments uri, we just need a start and end without
    }else if (!selector.includes("xywh") && selector.includes("t=")){
      obj.type = "temporal";
      var temporalValues = selector.split("t=")[1].split(",").map(val => {return val.includes("&") ? Number(val.split("&")[0]) : Number(val)});
      if (temporalValues[0] < temporalValues[1]){
        obj.start = temporalValues[0];
        obj.end = temporalValues[1];
      }
    }

    return obj;
  },

  // Function that will take a Media fragment and create a new Media Fragment URI given the values
  toString: function(base, type, subtype, values){
    if(type === "spatial"){
      return "" + base + "#xywh=" + subtype + ":" + values.x + "," + values.y + "," + values.w + "," + values.h;
    }else if(type === "temporal"){
      return "" + base + "#t=" + values.start + "," + values.end;
    }else{
      return "" + base + "#xywh=" + subtype + ":" + values.x + "," + values.y + "," + values.w + "," + values.h + "&t=" + values.start + "," + values.end;
    }
  }
};