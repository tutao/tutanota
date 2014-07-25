

/*
 * Copyright 2009 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


/**
 * @fileoverview
 * Provides the namespaces and necessary function to enable migration to the
 * Google JsCompiler.
 *
 * @author Cory Smith (corbinrsmith@gmail.com)
 */

var jstestdriver = {};
jstestdriver.plugins = {};
jstestdriver.plugins.async = {};

var goog = window.goog || {
  provide : function(symbol){},
  require : function(symbol){}
};

/*
 * Copyright 2009 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


jstestdriver.convertToJson = function(delegate) {
  var serialize = jstestdriver.parameterSerialize
  return function(url, data, callback, type) {
    delegate(url, serialize(data), callback, type);
  };
};


jstestdriver.parameterSerialize = function(data) {
  var modifiedData = {};
  for (var key in data) {
    modifiedData[key] = JSON.stringify(data[key]);
  }
  return modifiedData;
};


jstestdriver.bind = function(context, func) {
  function bound() {
    return func.apply(context, arguments);
  };
  bound.toString = function() {
    return "bound: " + context + " to: " + func;
  }
  return bound;
};


jstestdriver.extractId = function(url) {
  return url.match(/\/id\/(\d+)\//)[1];
};


jstestdriver.createPath = function(basePath, path) {
  var prefix = basePath.match(/^(.*)\/(slave|runner|bcr)\//)[1];
  return prefix + path;
};


jstestdriver.getBrowserFriendlyName = function() {
  if (jstestdriver.jQuery.browser.safari) {
    if (navigator.userAgent.indexOf('Chrome') != -1) {
      return 'Chrome';
    }
    return 'Safari';
  } else if (jstestdriver.jQuery.browser.opera) {
    return 'Opera';
  } else if (jstestdriver.jQuery.browser.msie) {
    return 'Internet Explorer';
  } else if (jstestdriver.jQuery.browser.mozilla) {
    if (navigator.userAgent.indexOf('Firefox') != -1) {
      return 'Firefox';
    }
    return 'Mozilla';
  }
};


jstestdriver.getBrowserFriendlyVersion = function() {
  if (jstestdriver.jQuery.browser.msie) {
    if (typeof XDomainRequest != 'undefined') {
      return '8.0';
    } 
  } else if (jstestdriver.jQuery.browser.safari) {
    if (navigator.appVersion.indexOf('Chrome/') != -1) {
      return navigator.appVersion.match(/Chrome\/(.*)\s/)[1];
    }
  }
  return jstestdriver.jQuery.browser.version;
};

jstestdriver.trim = function(str) {
  return str.replace(/(^\s*)|(\s*$)/g,'');
};


/**
 * Renders an html string as a dom nodes.
 * @param {string} htmlString The string to be rendered as html.
 * @param {Document} owningDocument The window that should own the html.
 */
jstestdriver.toHtml = function(htmlString, owningDocument) {
  var fragment = owningDocument.createDocumentFragment();
  var wrapper = owningDocument.createElement('div');
  wrapper.innerHTML = jstestdriver.trim(jstestdriver.stripHtmlComments(htmlString));
  while(wrapper.firstChild) {
    fragment.appendChild(wrapper.firstChild);
  }
  var ret =  fragment.childNodes.length > 1 ? fragment : fragment.firstChild;
  return ret;
};


jstestdriver.stripHtmlComments = function(htmlString) {
  var stripped = [];
  function getCommentIndices(offset) {
    var start = htmlString.indexOf('<!--', offset);
    var stop = htmlString.indexOf('-->', offset) + '-->'.length;
    if (start == -1) {
      return null;
    }
    return {
      'start' : start,
      'stop' : stop
    };
  }
  var offset = 0;
  while(true) {
    var comment = getCommentIndices(offset);
    if (!comment) {
      stripped.push(htmlString.slice(offset));
      break;
    }
    var frag = htmlString.slice(offset, comment.start);
    stripped.push(frag);
    offset = comment.stop;
  }
  return stripped.join('');
}


/**
 * Appends html string to the body.
 * @param {string} htmlString The string to be rendered as html.
 * @param {Document} owningDocument The window that should own the html.
 */
jstestdriver.appendHtml = function(htmlString, owningDocument) {
  var node = jstestdriver.toHtml(htmlString, owningDocument);
  jstestdriver.jQuery(owningDocument.body).append(node);
};


/**
 * @return {Number} The ms since the epoch.
 */
jstestdriver.now = function() { return new Date().getTime();}


/**
 * Creates a wrapper for jQuery.ajax that make a synchronous post
 * @param {jQuery} jQuery
 * @return {function(url, data):null}
 */
jstestdriver.createSynchPost = function(jQuery) {
  return jstestdriver.convertToJson(function(url, data) {
    return jQuery.ajax({
      'async' : false,
      'data' : data,
      'type' : 'POST',
      'url' : url
    });
  });
};

jstestdriver.utils = {};

/**
 * Checks to see if an object is a a certain native type.
 * @param instance An instance to check.
 * @param nativeType A string of the type expected.
 * @returns True if of that type.
 */
jstestdriver.utils.isNative = function(instance, nativeType) {
  try {
    var typeString = String(Object.prototype.toString.apply(instance));
    return typeString.toLowerCase().indexOf(nativeType.toLowerCase()) != -1;
  } catch (e) {
    return false;
  }
};

jstestdriver.utils.serializeErrors = function(errors) {
  var out = [];
  out.push('[');
  for (var i = 0; i < errors.length; ++i) {
    jstestdriver.utils.serializeErrorToArray(errors[i], out);
    if (i < errors.length - 1) {
      out.push(',');
    }
  }
  out.push(']');
  return out.join('');
};

jstestdriver.utils.serializeErrorToArray = function(error, out) {
  if (jstestdriver.utils.isNative(error, 'Error')) {
    out.push('{');
    out.push('"message":');
    this.serializeObjectToArray(error.message, out);
    this.serializePropertyOnObject('name', error, out);
    this.serializePropertyOnObject('description', error, out);
    this.serializePropertyOnObject('fileName', error, out);
    this.serializePropertyOnObject('lineNumber', error, out);
    this.serializePropertyOnObject('number', error, out);
    this.serializePropertyOnObject('stack', error, out);
    out.push('}');
  } else {
    out.push(jstestdriver.utils.serializeObject(error));
  }
};

jstestdriver.utils.serializeObject = function(obj) {
  var out = [];
  jstestdriver.utils.serializeObjectToArray(obj, out);
  return out.join('');
};


jstestdriver.utils.serializeObjectToArray =
   function(obj, opt_out){
  var out = opt_out || out;
  if (jstestdriver.utils.isNative(obj, 'Array')) {
    out.push('[');
    var arr = /** @type {Array.<Object>} */ obj;
    for ( var i = 0; i < arr.length; i++) {
      this.serializeObjectToArray(arr[i], out);
      if (i < arr.length - 1) {
        out.push(',');
      }
    }
    out.push(']');
  } else {
    var serial = jstestdriver.angular.toJson(obj);
    if (!serial.length) {
      serial = '["Bad serialization of ' + String(obj) + ':' +
          Object.prototype.toString.call(obj) + '"]';
    }
    out.push(serial);
  }
  return out;
};


jstestdriver.utils.serializePropertyOnObject = function(name, obj, out) {
  if (name in obj) {
    out.push(',');
    out.push('"' + name + '":');
    this.serializeObjectToArray(obj[name], out);
  }
};
/*
 * Copyright 2009 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

goog.provide('jstestdriver.Console');


jstestdriver.JSON = window['JSON'] || {};
jstestdriver.JSON.stringify = window['JSON'] ? window['JSON']['stringify'] :
    function(msg, opt_args) {};


// TODO(corysmith): Separate this into a Utils namespace that can loaded earlier.
jstestdriver.FORMAT_MAPPINGS = {
  's' : function(arg) {
    if (arg == undefined) {
      return '';
    }
    return String(arg);
  },
  'd' : Number,
  'i' : parseInt,
  'f' : parseFloat,
  'o' : jstestdriver.JSON.stringify
};


jstestdriver.formatString = function(str) {
  var formatArgs = arguments;
  var idx = 1;
  var formatted = String(str).replace(/%([sdifo])/g,
      function(fullmatch, groupOne) {
    var value = formatArgs[idx++];
    if (!jstestdriver.FORMAT_MAPPINGS[groupOne]) {
      throw new Error(groupOne + 'is not a proper format.');
    }
    if (value === undefined || value === null) {
      return value;
    }
    return jstestdriver.FORMAT_MAPPINGS[groupOne](value);
  })
  while (idx < formatArgs.length) {
    var currentArg = formatArgs[idx++]
    if (typeof currentArg == 'object') {
      currentArg = jstestdriver.JSON.stringify(currentArg);
    }
    formatted += " " + currentArg;
  }
  return formatted;
};


/**
 * @constructor
 */
jstestdriver.Console = function() {
  this.log_ = [];
};


jstestdriver.Console.prototype.log = function() {
  this.logStatement('[LOG]', jstestdriver.formatString.apply(this, arguments));
};


jstestdriver.Console.prototype.debug = function() {
  this.logStatement('[DEBUG]', jstestdriver.formatString.apply(this, arguments));
};


jstestdriver.Console.prototype.info = function() {
  this.logStatement('[INFO]', jstestdriver.formatString.apply(this, arguments));
};


jstestdriver.Console.prototype.warn = function() {
  this.logStatement('[WARN]', jstestdriver.formatString.apply(this, arguments));
};


jstestdriver.Console.prototype.error = function() {
  this.logStatement('[ERROR]', jstestdriver.formatString.apply(this, arguments));
};


jstestdriver.Console.prototype.logStatement = function(level, statement) {
  this.log_.push(level + ' ' + statement);
};


jstestdriver.Console.prototype.getLog = function() {
  var log = this.log_;
  return log.join('\n');
};


jstestdriver.Console.prototype.getAndResetLog = function() {
  var log = this.getLog();
  this.log_ = [];
  return log;
};
/*
 * Copyright 2010 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

/**
 * @fileoverview
 * Provides the base jstestdriver environment constants and functions.
 */

goog.provide('jstestdriver');
goog.provide('jstestdriver.setTimeout');

goog.require('jstestdriver.Console');
goog.require('jstestdriver.runConfig');


jstestdriver.global = this;
jstestdriver.console = null;
jstestdriver.console = new jstestdriver.Console();

jstestdriver.SERVER_URL = "/query/";

jstestdriver.HEARTBEAT_URL = "/heartbeat";

if (!window['console']) window['console'] = {};
if (typeof window['console']['log'] == 'undefined') window['console']['log'] = function(msg) {};
if (typeof window['console']['debug'] == 'undefined') window['console']['debug'] = function(msg) {};
if (typeof ['console']['info'] == 'undefined') window['console']['info'] = function(msg) {};
if (typeof ['console']['warn'] == 'undefined') window['console']['warn'] = function(msg) {};
if (typeof ['console']['error'] == 'undefined') window['console']['error'] = function(msg) {};

jstestdriver.globalSetTimeout = window.setTimeout;
jstestdriver.setTimeout = function() {
  if (jstestdriver.globalSetTimeout.apply) {
    return jstestdriver.globalSetTimeout.apply(window, arguments);
  }
  return jstestdriver.globalSetTimeout(arguments[0], arguments[1]);
};

jstestdriver.globalClearTimeout = clearTimeout;
jstestdriver.clearTimeout = function() {
  if (jstestdriver.globalClearTimeout.apply) {
    return jstestdriver.globalClearTimeout.apply(window, arguments);
  }
  return jstestdriver.globalClearTimeout(arguments[0]);
};

jstestdriver.globalSetInterval = setInterval;
jstestdriver.setInterval = function() {
  if (jstestdriver.globalSetInterval.apply) {
    return jstestdriver.globalSetInterval.apply(window, arguments);
  }
  return jstestdriver.globalSetInterval(arguments[0], arguments[1]);
};


jstestdriver.globalClearInterval = clearInterval;
jstestdriver.clearInterval = function() {
  if (jstestdriver.globalClearInterval.apply) {
    return jstestdriver.globalClearInterval.apply(window, arguments);
  }
  return jstestdriver.globalClearInterval(arguments[0]);
};


jstestdriver.browserLogger = {
  log : function(src, lvl, msg) {},
  debug : function(src, msg) {},
  info : function(src, msg) {},
  warn : function(src, msg) {},
  error : function(src, msg) {}
};


jstestdriver.log = function(message) {
  if (jstestdriver.runConfig && jstestdriver.runConfig.debug) {
    jstestdriver.browserLogger.debug('log', message);
  }
}

document.write = function(str) {
  //jstestdriver.console.error('Illegal call to document.write.');
};


var noop = jstestdriver.EMPTY_FUNC = function() {};

// TODO(corysmith): We need to be able to log early for debugging,
// but this really doesn't belong here. Need to reorg the js.
/**
 * A log message.
 * Corresponds with the com.google.jstestdriver.protocol.BrowserLog.
 * @param {String} source
 * @param {number} level
 * @param {String} message
 * @param {Object} browser The browser info object.
 * @param {String} stack Stack of where this was logged.
 * @param {String} timestamp
 * @constructor
 */
jstestdriver.BrowserLog = function(source, level, message, browser, stack, timestamp) {
  this.source = source;
  this.level = level;
  this.message = message;
  this.browser = browser
  this.stack = stack;
  this.timestamp = timestamp;
};
/*
 * Copyright 2010 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

/**
 * This is a simple logger implementation, that posts messages to the server.
 * Will most likely be expanded later.
 * @param {Function} sendToServer Function to send information to the server,
 *     of signature function(logs):void
 * @param {number} 
 */
jstestdriver.BrowserLogger = function(sendToServer, id) {
  this.sendToServer_ = sendToServer;
  this.id_ = id;
};


/**
 * 
 * @param location String location of the browser.
 * @param ajax jQuery ajax function.
 * @returns jstestdriver.BrowserLogger.
 */
jstestdriver.BrowserLogger.create = function(location, ajax) {
  var id = parseInt(jstestdriver.extractId(location));
  var prefix = location.match(/^(.*)\/(slave|runner|bcr)\//)[1];
  var url = prefix + '/log';
  return new jstestdriver.BrowserLogger(function(logs) {
    ajax({
        'async' : true,
        'data' : 'logs=' + JSON.stringify(logs),
        'type' : 'POST',
        'url' : url
    });
  }, id);
};

jstestdriver.BrowserLogger.prototype.isEnabled_ = function() {
  // TODO(corysmith): Refactor to allow the runConfig to be available before
  // load.
  var enabled = jstestdriver.runConfig && jstestdriver.runConfig.debug;
  this.isEnabled_ = function () {
    return enabled;
  };
  return enabled;
};


/**
 * Logs a message to the server.
 * @param {String} source The source of the log event.
 * @param {jstestdriver.BrowserLogger.LEVEL} level The level of the message.
 * @param {String} message The log message.
 */
jstestdriver.BrowserLogger.prototype.log = function(source, level, message) {
  if (this.isEnabled_()) {
    // TODO(corysmith): replace with a cross browser stack methodology.
    var traceError = new Error();
    var stack = traceError.stack ? traceError.stack.split('\n') : [];

    var smallStack = [];

    for (var i = 0; stack[i]; i++) {
      var end = stack[i].indexOf('(');
      if (end > -1) {
        smallStack.push(stack[i].substr(0,end).trim());
      }
    }
    smallStack = smallStack.length ? smallStack : ['No stack available'];
    this.sendToServer_([
          new jstestdriver.BrowserLog(
              source,
              level,
              encodeURI(message),
              {"id": this.id_},
              encodeURI(smallStack.toString()),
              new Date())
        ]);
  }
};


jstestdriver.BrowserLogger.prototype.debug = function(source, message) {
  this.log(source, jstestdriver.BrowserLogger.LEVEL.DEBUG, message);
};


jstestdriver.BrowserLogger.prototype.info = function(source, message) {
  this.log(source, jstestdriver.BrowserLogger.LEVEL.INFO, message);
};


jstestdriver.BrowserLogger.prototype.warn = function(source, message) {
  this.log(source, jstestdriver.BrowserLogger.LEVEL.WARN, message);
};


jstestdriver.BrowserLogger.prototype.error = function(source, message) {
  this.log(source, jstestdriver.BrowserLogger.LEVEL.ERROR, message);
};


/**
 * Acceptable logging levels.
 * @enum
 */
jstestdriver.BrowserLogger.LEVEL = {
  TRACE : 1,
  DEBUG : 2,
  INFO : 3,
  WARN : 4,
  ERROR : 5
};

jstestdriver.browserLogger = jstestdriver.BrowserLogger.create("/id/1/slave/".toString(),
    function() {jstestdriver.jQuery.ajax.apply(jstestdriver.jQuery,
        arguments)});


/*
    http://www.JSON.org/json2.js
    2008-11-19

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html

    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the object holding the key.

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.

    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.
*/

/*jslint evil: true */

/*global JSON */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/

// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (!this.JSON) {
    JSON = {};
}
(function () {

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return this.getUTCFullYear()   + '-' +
                 f(this.getUTCMonth() + 1) + '-' +
                 f(this.getUTCDate())      + 'T' +
                 f(this.getUTCHours())     + ':' +
                 f(this.getUTCMinutes())   + ':' +
                 f(this.getUTCSeconds())   + 'Z';
        };

        String.prototype.toJSON =
        Number.prototype.toJSON =
        Boolean.prototype.toJSON = function (key) {
            return this.valueOf();
        };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ?
            '"' + string.replace(escapable, function (a) {
                var c = meta[a];
                return typeof c === 'string' ? c :
                    '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }) + '"' :
            '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function' &&
                Object.prototype.toString.apply(value) !== '[object Array]') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0 ? '[]' :
                    gap ? '[\n' + gap +
                            partial.join(',\n' + gap) + '\n' +
                                mind + ']' :
                          '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0 ? '{}' :
                gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' +
                        mind + '}' : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                     typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/.
test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').
replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function' ?
                    walk({'': j}, '') : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
})();


// Copyright (C) 2008 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Parses a string of well-formed JSON text.
 *
 * If the input is not well-formed, then behavior is undefined, but it is
 * deterministic and is guaranteed not to modify any object other than its
 * return value.
 *
 * This does not use `eval` so is less likely to have obscure security bugs than
 * json2.js.
 * It is optimized for speed, so is much faster than json_parse.js.
 *
 * This library should be used whenever security is a concern (when JSON may
 * come from an untrusted source), speed is a concern, and erroring on malformed
 * JSON is *not* a concern.
 *
 *                      Pros                   Cons
 *                    +-----------------------+-----------------------+
 * json_sans_eval.js  | Fast, secure          | Not validating        |
 *                    +-----------------------+-----------------------+
 * json_parse.js      | Validating, secure    | Slow                  |
 *                    +-----------------------+-----------------------+
 * json2.js           | Fast, some validation | Potentially insecure  |
 *                    +-----------------------+-----------------------+
 *
 * json2.js is very fast, but potentially insecure since it calls `eval` to
 * parse JSON data, so an attacker might be able to supply strange JS that
 * looks like JSON, but that executes arbitrary javascript.
 * If you do have to use json2.js with untrusted data, make sure you keep
 * your version of json2.js up to date so that you get patches as they're
 * released.
 *
 * @param {string} json per RFC 4627
 * @param {function} opt_reviver optional function that reworks JSON objects
 *     post-parse per Chapter 15.12 of EcmaScript3.1.
 *     If supplied, the function is called with a string key, and a value.
 *     The value is the property of 'this'.  The reviver should return
 *     the value to use in its place.  So if dates were serialized as
 *     {@code { "type": "Date", "time": 1234 }}, then a reviver might look like
 *     {@code
 *     function (key, value) {
 *       if (value && typeof value === 'object' && 'Date' === value.type) {
 *         return new Date(value.time);
 *       } else {
 *         return value;
 *       }
 *     }}.
 *     If the reviver returns {@code undefined} then the property named by key
 *     will be deleted from its container.
 *     {@code this} is bound to the object containing the specified property.
 * @return {Object|Array}
 * @author Mike Samuel <mikesamuel@gmail.com>
 */
var jsonParse = (function () {
  var number
      = '(?:-?\\b(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?(?:[eE][+-]?[0-9]+)?\\b)';
  var oneChar = '(?:[^\\0-\\x08\\x0a-\\x1f\"\\\\]'
      + '|\\\\(?:[\"/\\\\bfnrt]|u[0-9A-Fa-f]{4}))';
  var string = '(?:\"' + oneChar + '*\")';

  // Will match a value in a well-formed JSON file.
  // If the input is not well-formed, may match strangely, but not in an unsafe
  // way.
  // Since this only matches value tokens, it does not match whitespace, colons,
  // or commas.
  var jsonToken = new RegExp(
      '(?:false|true|null|[\\{\\}\\[\\]]'
      + '|' + number
      + '|' + string
      + ')', 'g');

  // Matches escape sequences in a string literal
  var escapeSequence = new RegExp('\\\\(?:([^u])|u(.{4}))', 'g');

  // Decodes escape sequences in object literals
  var escapes = {
    '"': '"',
    '/': '/',
    '\\': '\\',
    'b': '\b',
    'f': '\f',
    'n': '\n',
    'r': '\r',
    't': '\t'
  };
  function unescapeOne(_, ch, hex) {
    return ch ? escapes[ch] : String.fromCharCode(parseInt(hex, 16));
  }

  // A non-falsy value that coerces to the empty string when used as a key.
  var EMPTY_STRING = new String('');
  var SLASH = '\\';

  // Constructor to use based on an open token.
  var firstTokenCtors = { '{': Object, '[': Array };

  var hop = Object.hasOwnProperty;

  return function (json, opt_reviver) {
    // Split into tokens
    var toks = json.match(jsonToken);
    // Construct the object to return
    var result;
    var tok = toks[0];
    if ('{' === tok) {
      result = {};
    } else if ('[' === tok) {
      result = [];
    } else {
      throw new Error(tok);
    }

    // If undefined, the key in an object key/value record to use for the next
    // value parsed.
    var key;
    // Loop over remaining tokens maintaining a stack of uncompleted objects and
    // arrays.
    var stack = [result];
    for (var i = 1, n = toks.length; i < n; ++i) {
      tok = toks[i];

      var cont;
      switch (tok.charCodeAt(0)) {
        default:  // sign or digit
          cont = stack[0];
          cont[key || cont.length] = +(tok);
          key = void 0;
          break;
        case 0x22:  // '"'
          tok = tok.substring(1, tok.length - 1);
          if (tok.indexOf(SLASH) !== -1) {
            tok = tok.replace(escapeSequence, unescapeOne);
          }
          cont = stack[0];
          if (!key) {
            if (cont instanceof Array) {
              key = cont.length;
            } else {
              key = tok || EMPTY_STRING;  // Use as key for next value seen.
              break;
            }
          }
          cont[key] = tok;
          key = void 0;
          break;
        case 0x5b:  // '['
          cont = stack[0];
          stack.unshift(cont[key || cont.length] = []);
          key = void 0;
          break;
        case 0x5d:  // ']'
          stack.shift();
          break;
        case 0x66:  // 'f'
          cont = stack[0];
          cont[key || cont.length] = false;
          key = void 0;
          break;
        case 0x6e:  // 'n'
          cont = stack[0];
          cont[key || cont.length] = null;
          key = void 0;
          break;
        case 0x74:  // 't'
          cont = stack[0];
          cont[key || cont.length] = true;
          key = void 0;
          break;
        case 0x7b:  // '{'
          cont = stack[0];
          stack.unshift(cont[key || cont.length] = {});
          key = void 0;
          break;
        case 0x7d:  // '}'
          stack.shift();
          break;
      }
    }
    // Fail if we've got an uncompleted object.
    if (stack.length) { throw new Error(); }

    if (opt_reviver) {
      // Based on walk as implemented in http://www.json.org/json2.js
      var walk = function (holder, key) {
        var value = holder[key];
        if (value && typeof value === 'object') {
          var toDelete = null;
          for (var k in value) {
            if (hop.call(value, k) && value !== holder) {
              // Recurse to properties first.  This has the effect of causing
              // the reviver to be called on the object graph depth-first.

              // Since 'this' is bound to the holder of the property, the
              // reviver can access sibling properties of k including ones
              // that have not yet been revived.

              // The value returned by the reviver is used in place of the
              // current value of property k.
              // If it returns undefined then the property is deleted.
              var v = walk(value, k);
              if (v !== void 0) {
                value[k] = v;
              } else {
                // Deleting properties inside the loop has vaguely defined
                // semantics in ES3 and ES3.1.
                if (!toDelete) { toDelete = []; }
                toDelete.push(k);
              }
            }
          }
          if (toDelete) {
            for (var i = toDelete.length; --i >= 0;) {
              delete value[toDelete[i]];
            }
          }
        }
        return opt_reviver.call(holder, key, value);
      };
      result = walk({ '': result }, '');
    }

    return result;
  };
})();


/*!
 * jQuery JavaScript Library v1.4.3
 * http://jquery.com/
 *
 * Copyright 2010, John Resig
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 * Copyright 2010, The Dojo Foundation
 * Released under the MIT, BSD, and GPL Licenses.
 *
 * Date: Thu Oct 14 23:10:06 2010 -0400
 */
(function(E,A){function U(){return false}function ba(){return true}function ja(a,b,d){d[0].type=a;return c.event.handle.apply(b,d)}function Ga(a){var b,d,e=[],f=[],h,k,l,n,s,v,B,D;k=c.data(this,this.nodeType?"events":"__events__");if(typeof k==="function")k=k.events;if(!(a.liveFired===this||!k||!k.live||a.button&&a.type==="click")){if(a.namespace)D=RegExp("(^|\\.)"+a.namespace.split(".").join("\\.(?:.*\\.)?")+"(\\.|$)");a.liveFired=this;var H=k.live.slice(0);for(n=0;n<H.length;n++){k=H[n];k.origType.replace(X,
"")===a.type?f.push(k.selector):H.splice(n--,1)}f=c(a.target).closest(f,a.currentTarget);s=0;for(v=f.length;s<v;s++){B=f[s];for(n=0;n<H.length;n++){k=H[n];if(B.selector===k.selector&&(!D||D.test(k.namespace))){l=B.elem;h=null;if(k.preType==="mouseenter"||k.preType==="mouseleave"){a.type=k.preType;h=c(a.relatedTarget).closest(k.selector)[0]}if(!h||h!==l)e.push({elem:l,handleObj:k,level:B.level})}}}s=0;for(v=e.length;s<v;s++){f=e[s];if(d&&f.level>d)break;a.currentTarget=f.elem;a.data=f.handleObj.data;
a.handleObj=f.handleObj;D=f.handleObj.origHandler.apply(f.elem,arguments);if(D===false||a.isPropagationStopped()){d=f.level;if(D===false)b=false}}return b}}function Y(a,b){return(a&&a!=="*"?a+".":"")+b.replace(Ha,"`").replace(Ia,"&")}function ka(a,b,d){if(c.isFunction(b))return c.grep(a,function(f,h){return!!b.call(f,h,f)===d});else if(b.nodeType)return c.grep(a,function(f){return f===b===d});else if(typeof b==="string"){var e=c.grep(a,function(f){return f.nodeType===1});if(Ja.test(b))return c.filter(b,
e,!d);else b=c.filter(b,e)}return c.grep(a,function(f){return c.inArray(f,b)>=0===d})}function la(a,b){var d=0;b.each(function(){if(this.nodeName===(a[d]&&a[d].nodeName)){var e=c.data(a[d++]),f=c.data(this,e);if(e=e&&e.events){delete f.handle;f.events={};for(var h in e)for(var k in e[h])c.event.add(this,h,e[h][k],e[h][k].data)}}})}function Ka(a,b){b.src?c.ajax({url:b.src,async:false,dataType:"script"}):c.globalEval(b.text||b.textContent||b.innerHTML||"");b.parentNode&&b.parentNode.removeChild(b)}
function ma(a,b,d){var e=b==="width"?a.offsetWidth:a.offsetHeight;if(d==="border")return e;c.each(b==="width"?La:Ma,function(){d||(e-=parseFloat(c.css(a,"padding"+this))||0);if(d==="margin")e+=parseFloat(c.css(a,"margin"+this))||0;else e-=parseFloat(c.css(a,"border"+this+"Width"))||0});return e}function ca(a,b,d,e){if(c.isArray(b)&&b.length)c.each(b,function(f,h){d||Na.test(a)?e(a,h):ca(a+"["+(typeof h==="object"||c.isArray(h)?f:"")+"]",h,d,e)});else if(!d&&b!=null&&typeof b==="object")c.isEmptyObject(b)?
e(a,""):c.each(b,function(f,h){ca(a+"["+f+"]",h,d,e)});else e(a,b)}function S(a,b){var d={};c.each(na.concat.apply([],na.slice(0,b)),function(){d[this]=a});return d}function oa(a){if(!da[a]){var b=c("<"+a+">").appendTo("body"),d=b.css("display");b.remove();if(d==="none"||d==="")d="block";da[a]=d}return da[a]}function ea(a){return c.isWindow(a)?a:a.nodeType===9?a.defaultView||a.parentWindow:false}var u=E.document,c=function(){function a(){if(!b.isReady){try{u.documentElement.doScroll("left")}catch(i){setTimeout(a,
1);return}b.ready()}}var b=function(i,r){return new b.fn.init(i,r)},d=E.jQuery,e=E.$,f,h=/^(?:[^<]*(<[\w\W]+>)[^>]*$|#([\w\-]+)$)/,k=/\S/,l=/^\s+/,n=/\s+$/,s=/\W/,v=/\d/,B=/^<(\w+)\s*\/?>(?:<\/\1>)?$/,D=/^[\],:{}\s]*$/,H=/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,w=/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,G=/(?:^|:|,)(?:\s*\[)+/g,M=/(webkit)[ \/]([\w.]+)/,g=/(opera)(?:.*version)?[ \/]([\w.]+)/,j=/(msie) ([\w.]+)/,o=/(mozilla)(?:.*? rv:([\w.]+))?/,m=navigator.userAgent,p=false,
q=[],t,x=Object.prototype.toString,C=Object.prototype.hasOwnProperty,P=Array.prototype.push,N=Array.prototype.slice,R=String.prototype.trim,Q=Array.prototype.indexOf,L={};b.fn=b.prototype={init:function(i,r){var y,z,F;if(!i)return this;if(i.nodeType){this.context=this[0]=i;this.length=1;return this}if(i==="body"&&!r&&u.body){this.context=u;this[0]=u.body;this.selector="body";this.length=1;return this}if(typeof i==="string")if((y=h.exec(i))&&(y[1]||!r))if(y[1]){F=r?r.ownerDocument||r:u;if(z=B.exec(i))if(b.isPlainObject(r)){i=
[u.createElement(z[1])];b.fn.attr.call(i,r,true)}else i=[F.createElement(z[1])];else{z=b.buildFragment([y[1]],[F]);i=(z.cacheable?z.fragment.cloneNode(true):z.fragment).childNodes}return b.merge(this,i)}else{if((z=u.getElementById(y[2]))&&z.parentNode){if(z.id!==y[2])return f.find(i);this.length=1;this[0]=z}this.context=u;this.selector=i;return this}else if(!r&&!s.test(i)){this.selector=i;this.context=u;i=u.getElementsByTagName(i);return b.merge(this,i)}else return!r||r.jquery?(r||f).find(i):b(r).find(i);
else if(b.isFunction(i))return f.ready(i);if(i.selector!==A){this.selector=i.selector;this.context=i.context}return b.makeArray(i,this)},selector:"",jquery:"1.4.3",length:0,size:function(){return this.length},toArray:function(){return N.call(this,0)},get:function(i){return i==null?this.toArray():i<0?this.slice(i)[0]:this[i]},pushStack:function(i,r,y){var z=b();b.isArray(i)?P.apply(z,i):b.merge(z,i);z.prevObject=this;z.context=this.context;if(r==="find")z.selector=this.selector+(this.selector?" ":
"")+y;else if(r)z.selector=this.selector+"."+r+"("+y+")";return z},each:function(i,r){return b.each(this,i,r)},ready:function(i){b.bindReady();if(b.isReady)i.call(u,b);else q&&q.push(i);return this},eq:function(i){return i===-1?this.slice(i):this.slice(i,+i+1)},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},slice:function(){return this.pushStack(N.apply(this,arguments),"slice",N.call(arguments).join(","))},map:function(i){return this.pushStack(b.map(this,function(r,y){return i.call(r,
y,r)}))},end:function(){return this.prevObject||b(null)},push:P,sort:[].sort,splice:[].splice};b.fn.init.prototype=b.fn;b.extend=b.fn.extend=function(){var i=arguments[0]||{},r=1,y=arguments.length,z=false,F,I,K,J,fa;if(typeof i==="boolean"){z=i;i=arguments[1]||{};r=2}if(typeof i!=="object"&&!b.isFunction(i))i={};if(y===r){i=this;--r}for(;r<y;r++)if((F=arguments[r])!=null)for(I in F){K=i[I];J=F[I];if(i!==J)if(z&&J&&(b.isPlainObject(J)||(fa=b.isArray(J)))){if(fa){fa=false;clone=K&&b.isArray(K)?K:[]}else clone=
K&&b.isPlainObject(K)?K:{};i[I]=b.extend(z,clone,J)}else if(J!==A)i[I]=J}return i};b.extend({noConflict:function(i){E.$=e;if(i)E.jQuery=d;return b},isReady:false,readyWait:1,ready:function(i){i===true&&b.readyWait--;if(!b.readyWait||i!==true&&!b.isReady){if(!u.body)return setTimeout(b.ready,1);b.isReady=true;if(!(i!==true&&--b.readyWait>0)){if(q){for(var r=0;i=q[r++];)i.call(u,b);q=null}b.fn.triggerHandler&&b(u).triggerHandler("ready")}}},bindReady:function(){if(!p){p=true;if(u.readyState==="complete")return setTimeout(b.ready,
1);if(u.addEventListener){u.addEventListener("DOMContentLoaded",t,false);E.addEventListener("load",b.ready,false)}else if(u.attachEvent){u.attachEvent("onreadystatechange",t);E.attachEvent("onload",b.ready);var i=false;try{i=E.frameElement==null}catch(r){}u.documentElement.doScroll&&i&&a()}}},isFunction:function(i){return b.type(i)==="function"},isArray:Array.isArray||function(i){return b.type(i)==="array"},isWindow:function(i){return i&&typeof i==="object"&&"setInterval"in i},isNaN:function(i){return i==
null||!v.test(i)||isNaN(i)},type:function(i){return i==null?String(i):L[x.call(i)]||"object"},isPlainObject:function(i){if(!i||b.type(i)!=="object"||i.nodeType||b.isWindow(i))return false;if(i.constructor&&!C.call(i,"constructor")&&!C.call(i.constructor.prototype,"isPrototypeOf"))return false;for(var r in i);return r===A||C.call(i,r)},isEmptyObject:function(i){for(var r in i)return false;return true},error:function(i){throw i;},parseJSON:function(i){if(typeof i!=="string"||!i)return null;i=b.trim(i);
if(D.test(i.replace(H,"@").replace(w,"]").replace(G,"")))return E.JSON&&E.JSON.parse?E.JSON.parse(i):(new Function("return "+i))();else b.error("Invalid JSON: "+i)},noop:function(){},globalEval:function(i){if(i&&k.test(i)){var r=u.getElementsByTagName("head")[0]||u.documentElement,y=u.createElement("script");y.type="text/javascript";if(b.support.scriptEval)y.appendChild(u.createTextNode(i));else y.text=i;r.insertBefore(y,r.firstChild);r.removeChild(y)}},nodeName:function(i,r){return i.nodeName&&i.nodeName.toUpperCase()===
r.toUpperCase()},each:function(i,r,y){var z,F=0,I=i.length,K=I===A||b.isFunction(i);if(y)if(K)for(z in i){if(r.apply(i[z],y)===false)break}else for(;F<I;){if(r.apply(i[F++],y)===false)break}else if(K)for(z in i){if(r.call(i[z],z,i[z])===false)break}else for(y=i[0];F<I&&r.call(y,F,y)!==false;y=i[++F]);return i},trim:R?function(i){return i==null?"":R.call(i)}:function(i){return i==null?"":i.toString().replace(l,"").replace(n,"")},makeArray:function(i,r){var y=r||[];if(i!=null){var z=b.type(i);i.length==
null||z==="string"||z==="function"||z==="regexp"||b.isWindow(i)?P.call(y,i):b.merge(y,i)}return y},inArray:function(i,r){if(r.indexOf)return r.indexOf(i);for(var y=0,z=r.length;y<z;y++)if(r[y]===i)return y;return-1},merge:function(i,r){var y=i.length,z=0;if(typeof r.length==="number")for(var F=r.length;z<F;z++)i[y++]=r[z];else for(;r[z]!==A;)i[y++]=r[z++];i.length=y;return i},grep:function(i,r,y){var z=[],F;y=!!y;for(var I=0,K=i.length;I<K;I++){F=!!r(i[I],I);y!==F&&z.push(i[I])}return z},map:function(i,
r,y){for(var z=[],F,I=0,K=i.length;I<K;I++){F=r(i[I],I,y);if(F!=null)z[z.length]=F}return z.concat.apply([],z)},guid:1,proxy:function(i,r,y){if(arguments.length===2)if(typeof r==="string"){y=i;i=y[r];r=A}else if(r&&!b.isFunction(r)){y=r;r=A}if(!r&&i)r=function(){return i.apply(y||this,arguments)};if(i)r.guid=i.guid=i.guid||r.guid||b.guid++;return r},access:function(i,r,y,z,F,I){var K=i.length;if(typeof r==="object"){for(var J in r)b.access(i,J,r[J],z,F,y);return i}if(y!==A){z=!I&&z&&b.isFunction(y);
for(J=0;J<K;J++)F(i[J],r,z?y.call(i[J],J,F(i[J],r)):y,I);return i}return K?F(i[0],r):A},now:function(){return(new Date).getTime()},uaMatch:function(i){i=i.toLowerCase();i=M.exec(i)||g.exec(i)||j.exec(i)||i.indexOf("compatible")<0&&o.exec(i)||[];return{browser:i[1]||"",version:i[2]||"0"}},browser:{}});b.each("Boolean Number String Function Array Date RegExp Object".split(" "),function(i,r){L["[object "+r+"]"]=r.toLowerCase()});m=b.uaMatch(m);if(m.browser){b.browser[m.browser]=true;b.browser.version=
m.version}if(b.browser.webkit)b.browser.safari=true;if(Q)b.inArray=function(i,r){return Q.call(r,i)};if(!/\s/.test("\u00a0")){l=/^[\s\xA0]+/;n=/[\s\xA0]+$/}f=b(u);if(u.addEventListener)t=function(){u.removeEventListener("DOMContentLoaded",t,false);b.ready()};else if(u.attachEvent)t=function(){if(u.readyState==="complete"){u.detachEvent("onreadystatechange",t);b.ready()}};return E.jQuery=E.$=b}();(function(){c.support={};var a=u.documentElement,b=u.createElement("script"),d=u.createElement("div"),
e="script"+c.now();d.style.display="none";d.innerHTML="   <link/><table></table><a href='/a' style='color:red;float:left;opacity:.55;'>a</a><input type='checkbox'/>";var f=d.getElementsByTagName("*"),h=d.getElementsByTagName("a")[0],k=u.createElement("select"),l=k.appendChild(u.createElement("option"));if(!(!f||!f.length||!h)){c.support={leadingWhitespace:d.firstChild.nodeType===3,tbody:!d.getElementsByTagName("tbody").length,htmlSerialize:!!d.getElementsByTagName("link").length,style:/red/.test(h.getAttribute("style")),
hrefNormalized:h.getAttribute("href")==="/a",opacity:/^0.55$/.test(h.style.opacity),cssFloat:!!h.style.cssFloat,checkOn:d.getElementsByTagName("input")[0].value==="on",optSelected:l.selected,optDisabled:false,checkClone:false,scriptEval:false,noCloneEvent:true,boxModel:null,inlineBlockNeedsLayout:false,shrinkWrapBlocks:false,reliableHiddenOffsets:true};k.disabled=true;c.support.optDisabled=!l.disabled;b.type="text/javascript";try{b.appendChild(u.createTextNode("window."+e+"=1;"))}catch(n){}a.insertBefore(b,
a.firstChild);if(E[e]){c.support.scriptEval=true;delete E[e]}a.removeChild(b);if(d.attachEvent&&d.fireEvent){d.attachEvent("onclick",function s(){c.support.noCloneEvent=false;d.detachEvent("onclick",s)});d.cloneNode(true).fireEvent("onclick")}d=u.createElement("div");d.innerHTML="<input type='radio' name='radiotest' checked='checked'/>";a=u.createDocumentFragment();a.appendChild(d.firstChild);c.support.checkClone=a.cloneNode(true).cloneNode(true).lastChild.checked;c(function(){var s=u.createElement("div");
s.style.width=s.style.paddingLeft="1px";u.body.appendChild(s);c.boxModel=c.support.boxModel=s.offsetWidth===2;if("zoom"in s.style){s.style.display="inline";s.style.zoom=1;c.support.inlineBlockNeedsLayout=s.offsetWidth===2;s.style.display="";s.innerHTML="<div style='width:4px;'></div>";c.support.shrinkWrapBlocks=s.offsetWidth!==2}s.innerHTML="<table><tr><td style='padding:0;display:none'></td><td>t</td></tr></table>";var v=s.getElementsByTagName("td");c.support.reliableHiddenOffsets=v[0].offsetHeight===
0;v[0].style.display="";v[1].style.display="none";c.support.reliableHiddenOffsets=c.support.reliableHiddenOffsets&&v[0].offsetHeight===0;s.innerHTML="";u.body.removeChild(s).style.display="none"});a=function(s){var v=u.createElement("div");s="on"+s;var B=s in v;if(!B){v.setAttribute(s,"return;");B=typeof v[s]==="function"}return B};c.support.submitBubbles=a("submit");c.support.changeBubbles=a("change");a=b=d=f=h=null}})();c.props={"for":"htmlFor","class":"className",readonly:"readOnly",maxlength:"maxLength",
cellspacing:"cellSpacing",rowspan:"rowSpan",colspan:"colSpan",tabindex:"tabIndex",usemap:"useMap",frameborder:"frameBorder"};var pa={},Oa=/^(?:\{.*\}|\[.*\])$/;c.extend({cache:{},uuid:0,expando:"jQuery"+c.now(),noData:{embed:true,object:"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",applet:true},data:function(a,b,d){if(c.acceptData(a)){a=a==E?pa:a;var e=a.nodeType,f=e?a[c.expando]:null,h=c.cache;if(!(e&&!f&&typeof b==="string"&&d===A)){if(e)f||(a[c.expando]=f=++c.uuid);else h=a;if(typeof b==="object")if(e)h[f]=
c.extend(h[f],b);else c.extend(h,b);else if(e&&!h[f])h[f]={};a=e?h[f]:h;if(d!==A)a[b]=d;return typeof b==="string"?a[b]:a}}},removeData:function(a,b){if(c.acceptData(a)){a=a==E?pa:a;var d=a.nodeType,e=d?a[c.expando]:a,f=c.cache,h=d?f[e]:e;if(b){if(h){delete h[b];d&&c.isEmptyObject(h)&&c.removeData(a)}}else if(d&&c.support.deleteExpando)delete a[c.expando];else if(a.removeAttribute)a.removeAttribute(c.expando);else if(d)delete f[e];else for(var k in a)delete a[k]}},acceptData:function(a){if(a.nodeName){var b=
c.noData[a.nodeName.toLowerCase()];if(b)return!(b===true||a.getAttribute("classid")!==b)}return true}});c.fn.extend({data:function(a,b){if(typeof a==="undefined")return this.length?c.data(this[0]):null;else if(typeof a==="object")return this.each(function(){c.data(this,a)});var d=a.split(".");d[1]=d[1]?"."+d[1]:"";if(b===A){var e=this.triggerHandler("getData"+d[1]+"!",[d[0]]);if(e===A&&this.length){e=c.data(this[0],a);if(e===A&&this[0].nodeType===1){e=this[0].getAttribute("data-"+a);if(typeof e===
"string")try{e=e==="true"?true:e==="false"?false:e==="null"?null:!c.isNaN(e)?parseFloat(e):Oa.test(e)?c.parseJSON(e):e}catch(f){}else e=A}}return e===A&&d[1]?this.data(d[0]):e}else return this.each(function(){var h=c(this),k=[d[0],b];h.triggerHandler("setData"+d[1]+"!",k);c.data(this,a,b);h.triggerHandler("changeData"+d[1]+"!",k)})},removeData:function(a){return this.each(function(){c.removeData(this,a)})}});c.extend({queue:function(a,b,d){if(a){b=(b||"fx")+"queue";var e=c.data(a,b);if(!d)return e||
[];if(!e||c.isArray(d))e=c.data(a,b,c.makeArray(d));else e.push(d);return e}},dequeue:function(a,b){b=b||"fx";var d=c.queue(a,b),e=d.shift();if(e==="inprogress")e=d.shift();if(e){b==="fx"&&d.unshift("inprogress");e.call(a,function(){c.dequeue(a,b)})}}});c.fn.extend({queue:function(a,b){if(typeof a!=="string"){b=a;a="fx"}if(b===A)return c.queue(this[0],a);return this.each(function(){var d=c.queue(this,a,b);a==="fx"&&d[0]!=="inprogress"&&c.dequeue(this,a)})},dequeue:function(a){return this.each(function(){c.dequeue(this,
a)})},delay:function(a,b){a=c.fx?c.fx.speeds[a]||a:a;b=b||"fx";return this.queue(b,function(){var d=this;setTimeout(function(){c.dequeue(d,b)},a)})},clearQueue:function(a){return this.queue(a||"fx",[])}});var qa=/[\n\t]/g,ga=/\s+/,Pa=/\r/g,Qa=/^(?:href|src|style)$/,Ra=/^(?:button|input)$/i,Sa=/^(?:button|input|object|select|textarea)$/i,Ta=/^a(?:rea)?$/i,ra=/^(?:radio|checkbox)$/i;c.fn.extend({attr:function(a,b){return c.access(this,a,b,true,c.attr)},removeAttr:function(a){return this.each(function(){c.attr(this,
a,"");this.nodeType===1&&this.removeAttribute(a)})},addClass:function(a){if(c.isFunction(a))return this.each(function(s){var v=c(this);v.addClass(a.call(this,s,v.attr("class")))});if(a&&typeof a==="string")for(var b=(a||"").split(ga),d=0,e=this.length;d<e;d++){var f=this[d];if(f.nodeType===1)if(f.className){for(var h=" "+f.className+" ",k=f.className,l=0,n=b.length;l<n;l++)if(h.indexOf(" "+b[l]+" ")<0)k+=" "+b[l];f.className=c.trim(k)}else f.className=a}return this},removeClass:function(a){if(c.isFunction(a))return this.each(function(n){var s=
c(this);s.removeClass(a.call(this,n,s.attr("class")))});if(a&&typeof a==="string"||a===A)for(var b=(a||"").split(ga),d=0,e=this.length;d<e;d++){var f=this[d];if(f.nodeType===1&&f.className)if(a){for(var h=(" "+f.className+" ").replace(qa," "),k=0,l=b.length;k<l;k++)h=h.replace(" "+b[k]+" "," ");f.className=c.trim(h)}else f.className=""}return this},toggleClass:function(a,b){var d=typeof a,e=typeof b==="boolean";if(c.isFunction(a))return this.each(function(f){var h=c(this);h.toggleClass(a.call(this,
f,h.attr("class"),b),b)});return this.each(function(){if(d==="string")for(var f,h=0,k=c(this),l=b,n=a.split(ga);f=n[h++];){l=e?l:!k.hasClass(f);k[l?"addClass":"removeClass"](f)}else if(d==="undefined"||d==="boolean"){this.className&&c.data(this,"__className__",this.className);this.className=this.className||a===false?"":c.data(this,"__className__")||""}})},hasClass:function(a){a=" "+a+" ";for(var b=0,d=this.length;b<d;b++)if((" "+this[b].className+" ").replace(qa," ").indexOf(a)>-1)return true;return false},
val:function(a){if(!arguments.length){var b=this[0];if(b){if(c.nodeName(b,"option")){var d=b.attributes.value;return!d||d.specified?b.value:b.text}if(c.nodeName(b,"select")){var e=b.selectedIndex;d=[];var f=b.options;b=b.type==="select-one";if(e<0)return null;var h=b?e:0;for(e=b?e+1:f.length;h<e;h++){var k=f[h];if(k.selected&&(c.support.optDisabled?!k.disabled:k.getAttribute("disabled")===null)&&(!k.parentNode.disabled||!c.nodeName(k.parentNode,"optgroup"))){a=c(k).val();if(b)return a;d.push(a)}}return d}if(ra.test(b.type)&&
!c.support.checkOn)return b.getAttribute("value")===null?"on":b.value;return(b.value||"").replace(Pa,"")}return A}var l=c.isFunction(a);return this.each(function(n){var s=c(this),v=a;if(this.nodeType===1){if(l)v=a.call(this,n,s.val());if(v==null)v="";else if(typeof v==="number")v+="";else if(c.isArray(v))v=c.map(v,function(D){return D==null?"":D+""});if(c.isArray(v)&&ra.test(this.type))this.checked=c.inArray(s.val(),v)>=0;else if(c.nodeName(this,"select")){var B=c.makeArray(v);c("option",this).each(function(){this.selected=
c.inArray(c(this).val(),B)>=0});if(!B.length)this.selectedIndex=-1}else this.value=v}})}});c.extend({attrFn:{val:true,css:true,html:true,text:true,data:true,width:true,height:true,offset:true},attr:function(a,b,d,e){if(!a||a.nodeType===3||a.nodeType===8)return A;if(e&&b in c.attrFn)return c(a)[b](d);e=a.nodeType!==1||!c.isXMLDoc(a);var f=d!==A;b=e&&c.props[b]||b;if(a.nodeType===1){var h=Qa.test(b);if((b in a||a[b]!==A)&&e&&!h){if(f){b==="type"&&Ra.test(a.nodeName)&&a.parentNode&&c.error("type property can't be changed");
if(d===null)a.nodeType===1&&a.removeAttribute(b);else a[b]=d}if(c.nodeName(a,"form")&&a.getAttributeNode(b))return a.getAttributeNode(b).nodeValue;if(b==="tabIndex")return(b=a.getAttributeNode("tabIndex"))&&b.specified?b.value:Sa.test(a.nodeName)||Ta.test(a.nodeName)&&a.href?0:A;return a[b]}if(!c.support.style&&e&&b==="style"){if(f)a.style.cssText=""+d;return a.style.cssText}f&&a.setAttribute(b,""+d);if(!a.attributes[b]&&a.hasAttribute&&!a.hasAttribute(b))return A;a=!c.support.hrefNormalized&&e&&
h?a.getAttribute(b,2):a.getAttribute(b);return a===null?A:a}}});var X=/\.(.*)$/,ha=/^(?:textarea|input|select)$/i,Ha=/\./g,Ia=/ /g,Ua=/[^\w\s.|`]/g,Va=function(a){return a.replace(Ua,"\\/*REPLACE*/")},sa={focusin:0,focusout:0};c.event={add:function(a,b,d,e){if(!(a.nodeType===3||a.nodeType===8)){if(c.isWindow(a)&&a!==E&&!a.frameElement)a=E;if(d===false)d=U;var f,h;if(d.handler){f=d;d=f.handler}if(!d.guid)d.guid=c.guid++;if(h=c.data(a)){var k=a.nodeType?"events":"__events__",l=h[k],n=h.handle;if(typeof l===
"function"){n=l.handle;l=l.events}else if(!l){a.nodeType||(h[k]=h=function(){});h.events=l={}}if(!n)h.handle=n=function(){return typeof c!=="undefined"&&!c.event.triggered?c.event.handle.apply(n.elem,arguments):A};n.elem=a;b=b.split(" ");for(var s=0,v;k=b[s++];){h=f?c.extend({},f):{handler:d,data:e};if(k.indexOf(".")>-1){v=k.split(".");k=v.shift();h.namespace=v.slice(0).sort().join(".")}else{v=[];h.namespace=""}h.type=k;if(!h.guid)h.guid=d.guid;var B=l[k],D=c.event.special[k]||{};if(!B){B=l[k]=[];
if(!D.setup||D.setup.call(a,e,v,n)===false)if(a.addEventListener)a.addEventListener(k,n,false);else a.attachEvent&&a.attachEvent("on"+k,n)}if(D.add){D.add.call(a,h);if(!h.handler.guid)h.handler.guid=d.guid}B.push(h);c.event.global[k]=true}a=null}}},global:{},remove:function(a,b,d,e){if(!(a.nodeType===3||a.nodeType===8)){if(d===false)d=U;var f,h,k=0,l,n,s,v,B,D,H=a.nodeType?"events":"__events__",w=c.data(a),G=w&&w[H];if(w&&G){if(typeof G==="function"){w=G;G=G.events}if(b&&b.type){d=b.handler;b=b.type}if(!b||
typeof b==="string"&&b.charAt(0)==="."){b=b||"";for(f in G)c.event.remove(a,f+b)}else{for(b=b.split(" ");f=b[k++];){v=f;l=f.indexOf(".")<0;n=[];if(!l){n=f.split(".");f=n.shift();s=RegExp("(^|\\.)"+c.map(n.slice(0).sort(),Va).join("\\.(?:.*\\.)?")+"(\\.|$)")}if(B=G[f])if(d){v=c.event.special[f]||{};for(h=e||0;h<B.length;h++){D=B[h];if(d.guid===D.guid){if(l||s.test(D.namespace)){e==null&&B.splice(h--,1);v.remove&&v.remove.call(a,D)}if(e!=null)break}}if(B.length===0||e!=null&&B.length===1){if(!v.teardown||
v.teardown.call(a,n)===false)c.removeEvent(a,f,w.handle);delete G[f]}}else for(h=0;h<B.length;h++){D=B[h];if(l||s.test(D.namespace)){c.event.remove(a,v,D.handler,h);B.splice(h--,1)}}}if(c.isEmptyObject(G)){if(b=w.handle)b.elem=null;delete w.events;delete w.handle;if(typeof w==="function")c.removeData(a,H);else c.isEmptyObject(w)&&c.removeData(a)}}}}},trigger:function(a,b,d,e){var f=a.type||a;if(!e){a=typeof a==="object"?a[c.expando]?a:c.extend(c.Event(f),a):c.Event(f);if(f.indexOf("!")>=0){a.type=
f=f.slice(0,-1);a.exclusive=true}if(!d){a.stopPropagation();c.event.global[f]&&c.each(c.cache,function(){this.events&&this.events[f]&&c.event.trigger(a,b,this.handle.elem)})}if(!d||d.nodeType===3||d.nodeType===8)return A;a.result=A;a.target=d;b=c.makeArray(b);b.unshift(a)}a.currentTarget=d;(e=d.nodeType?c.data(d,"handle"):(c.data(d,"__events__")||{}).handle)&&e.apply(d,b);e=d.parentNode||d.ownerDocument;try{if(!(d&&d.nodeName&&c.noData[d.nodeName.toLowerCase()]))if(d["on"+f]&&d["on"+f].apply(d,b)===
false){a.result=false;a.preventDefault()}}catch(h){}if(!a.isPropagationStopped()&&e)c.event.trigger(a,b,e,true);else if(!a.isDefaultPrevented()){e=a.target;var k,l=f.replace(X,""),n=c.nodeName(e,"a")&&l==="click",s=c.event.special[l]||{};if((!s._default||s._default.call(d,a)===false)&&!n&&!(e&&e.nodeName&&c.noData[e.nodeName.toLowerCase()])){try{if(e[l]){if(k=e["on"+l])e["on"+l]=null;c.event.triggered=true;e[l]()}}catch(v){}if(k)e["on"+l]=k;c.event.triggered=false}}},handle:function(a){var b,d,e;
d=[];var f,h=c.makeArray(arguments);a=h[0]=c.event.fix(a||E.event);a.currentTarget=this;b=a.type.indexOf(".")<0&&!a.exclusive;if(!b){e=a.type.split(".");a.type=e.shift();d=e.slice(0).sort();e=RegExp("(^|\\.)"+d.join("\\.(?:.*\\.)?")+"(\\.|$)")}a.namespace=a.namespace||d.join(".");f=c.data(this,this.nodeType?"events":"__events__");if(typeof f==="function")f=f.events;d=(f||{})[a.type];if(f&&d){d=d.slice(0);f=0;for(var k=d.length;f<k;f++){var l=d[f];if(b||e.test(l.namespace)){a.handler=l.handler;a.data=
l.data;a.handleObj=l;l=l.handler.apply(this,h);if(l!==A){a.result=l;if(l===false){a.preventDefault();a.stopPropagation()}}if(a.isImmediatePropagationStopped())break}}}return a.result},props:"altKey attrChange attrName bubbles button cancelable charCode clientX clientY ctrlKey currentTarget data detail eventPhase fromElement handler keyCode layerX layerY metaKey newValue offsetX offsetY pageX pageY prevValue relatedNode relatedTarget screenX screenY shiftKey srcElement target toElement view wheelDelta which".split(" "),
fix:function(a){if(a[c.expando])return a;var b=a;a=c.Event(b);for(var d=this.props.length,e;d;){e=this.props[--d];a[e]=b[e]}if(!a.target)a.target=a.srcElement||u;if(a.target.nodeType===3)a.target=a.target.parentNode;if(!a.relatedTarget&&a.fromElement)a.relatedTarget=a.fromElement===a.target?a.toElement:a.fromElement;if(a.pageX==null&&a.clientX!=null){b=u.documentElement;d=u.body;a.pageX=a.clientX+(b&&b.scrollLeft||d&&d.scrollLeft||0)-(b&&b.clientLeft||d&&d.clientLeft||0);a.pageY=a.clientY+(b&&b.scrollTop||
d&&d.scrollTop||0)-(b&&b.clientTop||d&&d.clientTop||0)}if(a.which==null&&(a.charCode!=null||a.keyCode!=null))a.which=a.charCode!=null?a.charCode:a.keyCode;if(!a.metaKey&&a.ctrlKey)a.metaKey=a.ctrlKey;if(!a.which&&a.button!==A)a.which=a.button&1?1:a.button&2?3:a.button&4?2:0;return a},guid:1E8,proxy:c.proxy,special:{ready:{setup:c.bindReady,teardown:c.noop},live:{add:function(a){c.event.add(this,Y(a.origType,a.selector),c.extend({},a,{handler:Ga,guid:a.handler.guid}))},remove:function(a){c.event.remove(this,
Y(a.origType,a.selector),a)}},beforeunload:{setup:function(a,b,d){if(c.isWindow(this))this.onbeforeunload=d},teardown:function(a,b){if(this.onbeforeunload===b)this.onbeforeunload=null}}}};c.removeEvent=u.removeEventListener?function(a,b,d){a.removeEventListener&&a.removeEventListener(b,d,false)}:function(a,b,d){a.detachEvent&&a.detachEvent("on"+b,d)};c.Event=function(a){if(!this.preventDefault)return new c.Event(a);if(a&&a.type){this.originalEvent=a;this.type=a.type}else this.type=a;this.timeStamp=
c.now();this[c.expando]=true};c.Event.prototype={preventDefault:function(){this.isDefaultPrevented=ba;var a=this.originalEvent;if(a)if(a.preventDefault)a.preventDefault();else a.returnValue=false},stopPropagation:function(){this.isPropagationStopped=ba;var a=this.originalEvent;if(a){a.stopPropagation&&a.stopPropagation();a.cancelBubble=true}},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=ba;this.stopPropagation()},isDefaultPrevented:U,isPropagationStopped:U,isImmediatePropagationStopped:U};
var ta=function(a){var b=a.relatedTarget;try{for(;b&&b!==this;)b=b.parentNode;if(b!==this){a.type=a.data;c.event.handle.apply(this,arguments)}}catch(d){}},ua=function(a){a.type=a.data;c.event.handle.apply(this,arguments)};c.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(a,b){c.event.special[a]={setup:function(d){c.event.add(this,b,d&&d.selector?ua:ta,a)},teardown:function(d){c.event.remove(this,b,d&&d.selector?ua:ta)}}});if(!c.support.submitBubbles)c.event.special.submit={setup:function(){if(this.nodeName.toLowerCase()!==
"form"){c.event.add(this,"click.specialSubmit",function(a){var b=a.target,d=b.type;if((d==="submit"||d==="image")&&c(b).closest("form").length){a.liveFired=A;return ja("submit",this,arguments)}});c.event.add(this,"keypress.specialSubmit",function(a){var b=a.target,d=b.type;if((d==="text"||d==="password")&&c(b).closest("form").length&&a.keyCode===13){a.liveFired=A;return ja("submit",this,arguments)}})}else return false},teardown:function(){c.event.remove(this,".specialSubmit")}};if(!c.support.changeBubbles){var V,
va=function(a){var b=a.type,d=a.value;if(b==="radio"||b==="checkbox")d=a.checked;else if(b==="select-multiple")d=a.selectedIndex>-1?c.map(a.options,function(e){return e.selected}).join("-"):"";else if(a.nodeName.toLowerCase()==="select")d=a.selectedIndex;return d},Z=function(a,b){var d=a.target,e,f;if(!(!ha.test(d.nodeName)||d.readOnly)){e=c.data(d,"_change_data");f=va(d);if(a.type!=="focusout"||d.type!=="radio")c.data(d,"_change_data",f);if(!(e===A||f===e))if(e!=null||f){a.type="change";a.liveFired=
A;return c.event.trigger(a,b,d)}}};c.event.special.change={filters:{focusout:Z,beforedeactivate:Z,click:function(a){var b=a.target,d=b.type;if(d==="radio"||d==="checkbox"||b.nodeName.toLowerCase()==="select")return Z.call(this,a)},keydown:function(a){var b=a.target,d=b.type;if(a.keyCode===13&&b.nodeName.toLowerCase()!=="textarea"||a.keyCode===32&&(d==="checkbox"||d==="radio")||d==="select-multiple")return Z.call(this,a)},beforeactivate:function(a){a=a.target;c.data(a,"_change_data",va(a))}},setup:function(){if(this.type===
"file")return false;for(var a in V)c.event.add(this,a+".specialChange",V[a]);return ha.test(this.nodeName)},teardown:function(){c.event.remove(this,".specialChange");return ha.test(this.nodeName)}};V=c.event.special.change.filters;V.focus=V.beforeactivate}u.addEventListener&&c.each({focus:"focusin",blur:"focusout"},function(a,b){function d(e){e=c.event.fix(e);e.type=b;return c.event.trigger(e,null,e.target)}c.event.special[b]={setup:function(){sa[b]++===0&&u.addEventListener(a,d,true)},teardown:function(){--sa[b]===
0&&u.removeEventListener(a,d,true)}}});c.each(["bind","one"],function(a,b){c.fn[b]=function(d,e,f){if(typeof d==="object"){for(var h in d)this[b](h,e,d[h],f);return this}if(c.isFunction(e)||e===false){f=e;e=A}var k=b==="one"?c.proxy(f,function(n){c(this).unbind(n,k);return f.apply(this,arguments)}):f;if(d==="unload"&&b!=="one")this.one(d,e,f);else{h=0;for(var l=this.length;h<l;h++)c.event.add(this[h],d,k,e)}return this}});c.fn.extend({unbind:function(a,b){if(typeof a==="object"&&!a.preventDefault)for(var d in a)this.unbind(d,
a[d]);else{d=0;for(var e=this.length;d<e;d++)c.event.remove(this[d],a,b)}return this},delegate:function(a,b,d,e){return this.live(b,d,e,a)},undelegate:function(a,b,d){return arguments.length===0?this.unbind("live"):this.die(b,null,d,a)},trigger:function(a,b){return this.each(function(){c.event.trigger(a,b,this)})},triggerHandler:function(a,b){if(this[0]){var d=c.Event(a);d.preventDefault();d.stopPropagation();c.event.trigger(d,b,this[0]);return d.result}},toggle:function(a){for(var b=arguments,d=
1;d<b.length;)c.proxy(a,b[d++]);return this.click(c.proxy(a,function(e){var f=(c.data(this,"lastToggle"+a.guid)||0)%d;c.data(this,"lastToggle"+a.guid,f+1);e.preventDefault();return b[f].apply(this,arguments)||false}))},hover:function(a,b){return this.mouseenter(a).mouseleave(b||a)}});var wa={focus:"focusin",blur:"focusout",mouseenter:"mouseover",mouseleave:"mouseout"};c.each(["live","die"],function(a,b){c.fn[b]=function(d,e,f,h){var k,l=0,n,s,v=h||this.selector;h=h?this:c(this.context);if(typeof d===
"object"&&!d.preventDefault){for(k in d)h[b](k,e,d[k],v);return this}if(c.isFunction(e)){f=e;e=A}for(d=(d||"").split(" ");(k=d[l++])!=null;){n=X.exec(k);s="";if(n){s=n[0];k=k.replace(X,"")}if(k==="hover")d.push("mouseenter"+s,"mouseleave"+s);else{n=k;if(k==="focus"||k==="blur"){d.push(wa[k]+s);k+=s}else k=(wa[k]||k)+s;if(b==="live"){s=0;for(var B=h.length;s<B;s++)c.event.add(h[s],"live."+Y(k,v),{data:e,selector:v,handler:f,origType:k,origHandler:f,preType:n})}else h.unbind("live."+Y(k,v),f)}}return this}});
c.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error".split(" "),function(a,b){c.fn[b]=function(d,e){if(e==null){e=d;d=null}return arguments.length>0?this.bind(b,d,e):this.trigger(b)};if(c.attrFn)c.attrFn[b]=true});E.attachEvent&&!E.addEventListener&&c(E).bind("unload",function(){for(var a in c.cache)if(c.cache[a].handle)try{c.event.remove(c.cache[a].handle.elem)}catch(b){}});
(function(){function a(g,j,o,m,p,q){p=0;for(var t=m.length;p<t;p++){var x=m[p];if(x){x=x[g];for(var C=false;x;){if(x.sizcache===o){C=m[x.sizset];break}if(x.nodeType===1&&!q){x.sizcache=o;x.sizset=p}if(x.nodeName.toLowerCase()===j){C=x;break}x=x[g]}m[p]=C}}}function b(g,j,o,m,p,q){p=0;for(var t=m.length;p<t;p++){var x=m[p];if(x){x=x[g];for(var C=false;x;){if(x.sizcache===o){C=m[x.sizset];break}if(x.nodeType===1){if(!q){x.sizcache=o;x.sizset=p}if(typeof j!=="string"){if(x===j){C=true;break}}else if(l.filter(j,
[x]).length>0){C=x;break}}x=x[g]}m[p]=C}}}var d=/((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,e=0,f=Object.prototype.toString,h=false,k=true;[0,0].sort(function(){k=false;return 0});var l=function(g,j,o,m){o=o||[];var p=j=j||u;if(j.nodeType!==1&&j.nodeType!==9)return[];if(!g||typeof g!=="string")return o;var q=[],t,x,C,P,N=true,R=l.isXML(j),Q=g,L;do{d.exec("");if(t=d.exec(Q)){Q=t[3];q.push(t[1]);if(t[2]){P=t[3];
break}}}while(t);if(q.length>1&&s.exec(g))if(q.length===2&&n.relative[q[0]])x=M(q[0]+q[1],j);else for(x=n.relative[q[0]]?[j]:l(q.shift(),j);q.length;){g=q.shift();if(n.relative[g])g+=q.shift();x=M(g,x)}else{if(!m&&q.length>1&&j.nodeType===9&&!R&&n.match.ID.test(q[0])&&!n.match.ID.test(q[q.length-1])){t=l.find(q.shift(),j,R);j=t.expr?l.filter(t.expr,t.set)[0]:t.set[0]}if(j){t=m?{expr:q.pop(),set:D(m)}:l.find(q.pop(),q.length===1&&(q[0]==="~"||q[0]==="+")&&j.parentNode?j.parentNode:j,R);x=t.expr?l.filter(t.expr,
t.set):t.set;if(q.length>0)C=D(x);else N=false;for(;q.length;){t=L=q.pop();if(n.relative[L])t=q.pop();else L="";if(t==null)t=j;n.relative[L](C,t,R)}}else C=[]}C||(C=x);C||l.error(L||g);if(f.call(C)==="[object Array]")if(N)if(j&&j.nodeType===1)for(g=0;C[g]!=null;g++){if(C[g]&&(C[g]===true||C[g].nodeType===1&&l.contains(j,C[g])))o.push(x[g])}else for(g=0;C[g]!=null;g++)C[g]&&C[g].nodeType===1&&o.push(x[g]);else o.push.apply(o,C);else D(C,o);if(P){l(P,p,o,m);l.uniqueSort(o)}return o};l.uniqueSort=function(g){if(w){h=
k;g.sort(w);if(h)for(var j=1;j<g.length;j++)g[j]===g[j-1]&&g.splice(j--,1)}return g};l.matches=function(g,j){return l(g,null,null,j)};l.matchesSelector=function(g,j){return l(j,null,null,[g]).length>0};l.find=function(g,j,o){var m;if(!g)return[];for(var p=0,q=n.order.length;p<q;p++){var t=n.order[p],x;if(x=n.leftMatch[t].exec(g)){var C=x[1];x.splice(1,1);if(C.substr(C.length-1)!=="\\"){x[1]=(x[1]||"").replace(/\\/g,"");m=n.find[t](x,j,o);if(m!=null){g=g.replace(n.match[t],"");break}}}}m||(m=j.getElementsByTagName("*"));
return{set:m,expr:g}};l.filter=function(g,j,o,m){for(var p=g,q=[],t=j,x,C,P=j&&j[0]&&l.isXML(j[0]);g&&j.length;){for(var N in n.filter)if((x=n.leftMatch[N].exec(g))!=null&&x[2]){var R=n.filter[N],Q,L;L=x[1];C=false;x.splice(1,1);if(L.substr(L.length-1)!=="\\"){if(t===q)q=[];if(n.preFilter[N])if(x=n.preFilter[N](x,t,o,q,m,P)){if(x===true)continue}else C=Q=true;if(x)for(var i=0;(L=t[i])!=null;i++)if(L){Q=R(L,x,i,t);var r=m^!!Q;if(o&&Q!=null)if(r)C=true;else t[i]=false;else if(r){q.push(L);C=true}}if(Q!==
A){o||(t=q);g=g.replace(n.match[N],"");if(!C)return[];break}}}if(g===p)if(C==null)l.error(g);else break;p=g}return t};l.error=function(g){throw"Syntax error, unrecognized expression: "+g;};var n=l.selectors={order:["ID","NAME","TAG"],match:{ID:/#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,CLASS:/\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,NAME:/\[name=['"]*((?:[\w\u00c0-\uFFFF\-]|\\.)+)['"]*\]/,ATTR:/\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/,TAG:/^((?:[\w\u00c0-\uFFFF\*\-]|\\.)+)/,CHILD:/:(only|nth|last|first)-child(?:\((even|odd|[\dn+\-]*)\))?/,
POS:/:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^\-]|$)/,PSEUDO:/:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/},leftMatch:{},attrMap:{"class":"className","for":"htmlFor"},attrHandle:{href:function(g){return g.getAttribute("href")}},relative:{"+":function(g,j){var o=typeof j==="string",m=o&&!/\W/.test(j);o=o&&!m;if(m)j=j.toLowerCase();m=0;for(var p=g.length,q;m<p;m++)if(q=g[m]){for(;(q=q.previousSibling)&&q.nodeType!==1;);g[m]=o||q&&q.nodeName.toLowerCase()===
j?q||false:q===j}o&&l.filter(j,g,true)},">":function(g,j){var o=typeof j==="string",m,p=0,q=g.length;if(o&&!/\W/.test(j))for(j=j.toLowerCase();p<q;p++){if(m=g[p]){o=m.parentNode;g[p]=o.nodeName.toLowerCase()===j?o:false}}else{for(;p<q;p++)if(m=g[p])g[p]=o?m.parentNode:m.parentNode===j;o&&l.filter(j,g,true)}},"":function(g,j,o){var m=e++,p=b,q;if(typeof j==="string"&&!/\W/.test(j)){q=j=j.toLowerCase();p=a}p("parentNode",j,m,g,q,o)},"~":function(g,j,o){var m=e++,p=b,q;if(typeof j==="string"&&!/\W/.test(j)){q=
j=j.toLowerCase();p=a}p("previousSibling",j,m,g,q,o)}},find:{ID:function(g,j,o){if(typeof j.getElementById!=="undefined"&&!o)return(g=j.getElementById(g[1]))&&g.parentNode?[g]:[]},NAME:function(g,j){if(typeof j.getElementsByName!=="undefined"){for(var o=[],m=j.getElementsByName(g[1]),p=0,q=m.length;p<q;p++)m[p].getAttribute("name")===g[1]&&o.push(m[p]);return o.length===0?null:o}},TAG:function(g,j){return j.getElementsByTagName(g[1])}},preFilter:{CLASS:function(g,j,o,m,p,q){g=" "+g[1].replace(/\\/g,
"")+" ";if(q)return g;q=0;for(var t;(t=j[q])!=null;q++)if(t)if(p^(t.className&&(" "+t.className+" ").replace(/[\t\n]/g," ").indexOf(g)>=0))o||m.push(t);else if(o)j[q]=false;return false},ID:function(g){return g[1].replace(/\\/g,"")},TAG:function(g){return g[1].toLowerCase()},CHILD:function(g){if(g[1]==="nth"){var j=/(-?)(\d*)n((?:\+|-)?\d*)/.exec(g[2]==="even"&&"2n"||g[2]==="odd"&&"2n+1"||!/\D/.test(g[2])&&"0n+"+g[2]||g[2]);g[2]=j[1]+(j[2]||1)-0;g[3]=j[3]-0}g[0]=e++;return g},ATTR:function(g,j,o,
m,p,q){j=g[1].replace(/\\/g,"");if(!q&&n.attrMap[j])g[1]=n.attrMap[j];if(g[2]==="~=")g[4]=" "+g[4]+" ";return g},PSEUDO:function(g,j,o,m,p){if(g[1]==="not")if((d.exec(g[3])||"").length>1||/^\w/.test(g[3]))g[3]=l(g[3],null,null,j);else{g=l.filter(g[3],j,o,true^p);o||m.push.apply(m,g);return false}else if(n.match.POS.test(g[0])||n.match.CHILD.test(g[0]))return true;return g},POS:function(g){g.unshift(true);return g}},filters:{enabled:function(g){return g.disabled===false&&g.type!=="hidden"},disabled:function(g){return g.disabled===
true},checked:function(g){return g.checked===true},selected:function(g){return g.selected===true},parent:function(g){return!!g.firstChild},empty:function(g){return!g.firstChild},has:function(g,j,o){return!!l(o[3],g).length},header:function(g){return/h\d/i.test(g.nodeName)},text:function(g){return"text"===g.type},radio:function(g){return"radio"===g.type},checkbox:function(g){return"checkbox"===g.type},file:function(g){return"file"===g.type},password:function(g){return"password"===g.type},submit:function(g){return"submit"===
g.type},image:function(g){return"image"===g.type},reset:function(g){return"reset"===g.type},button:function(g){return"button"===g.type||g.nodeName.toLowerCase()==="button"},input:function(g){return/input|select|textarea|button/i.test(g.nodeName)}},setFilters:{first:function(g,j){return j===0},last:function(g,j,o,m){return j===m.length-1},even:function(g,j){return j%2===0},odd:function(g,j){return j%2===1},lt:function(g,j,o){return j<o[3]-0},gt:function(g,j,o){return j>o[3]-0},nth:function(g,j,o){return o[3]-
0===j},eq:function(g,j,o){return o[3]-0===j}},filter:{PSEUDO:function(g,j,o,m){var p=j[1],q=n.filters[p];if(q)return q(g,o,j,m);else if(p==="contains")return(g.textContent||g.innerText||l.getText([g])||"").indexOf(j[3])>=0;else if(p==="not"){j=j[3];o=0;for(m=j.length;o<m;o++)if(j[o]===g)return false;return true}else l.error("Syntax error, unrecognized expression: "+p)},CHILD:function(g,j){var o=j[1],m=g;switch(o){case "only":case "first":for(;m=m.previousSibling;)if(m.nodeType===1)return false;if(o===
"first")return true;m=g;case "last":for(;m=m.nextSibling;)if(m.nodeType===1)return false;return true;case "nth":o=j[2];var p=j[3];if(o===1&&p===0)return true;var q=j[0],t=g.parentNode;if(t&&(t.sizcache!==q||!g.nodeIndex)){var x=0;for(m=t.firstChild;m;m=m.nextSibling)if(m.nodeType===1)m.nodeIndex=++x;t.sizcache=q}m=g.nodeIndex-p;return o===0?m===0:m%o===0&&m/o>=0}},ID:function(g,j){return g.nodeType===1&&g.getAttribute("id")===j},TAG:function(g,j){return j==="*"&&g.nodeType===1||g.nodeName.toLowerCase()===
j},CLASS:function(g,j){return(" "+(g.className||g.getAttribute("class"))+" ").indexOf(j)>-1},ATTR:function(g,j){var o=j[1];o=n.attrHandle[o]?n.attrHandle[o](g):g[o]!=null?g[o]:g.getAttribute(o);var m=o+"",p=j[2],q=j[4];return o==null?p==="!=":p==="="?m===q:p==="*="?m.indexOf(q)>=0:p==="~="?(" "+m+" ").indexOf(q)>=0:!q?m&&o!==false:p==="!="?m!==q:p==="^="?m.indexOf(q)===0:p==="$="?m.substr(m.length-q.length)===q:p==="|="?m===q||m.substr(0,q.length+1)===q+"-":false},POS:function(g,j,o,m){var p=n.setFilters[j[2]];
if(p)return p(g,o,j,m)}}},s=n.match.POS,v=function(g,j){return"\\"+(j-0+1)},B;for(B in n.match){n.match[B]=RegExp(n.match[B].source+/(?![^\[]*\])(?![^\(]*\))/.source);n.leftMatch[B]=RegExp(/(^(?:.|\r|\n)*?)/.source+n.match[B].source.replace(/\\(\d+)/g,v))}var D=function(g,j){g=Array.prototype.slice.call(g,0);if(j){j.push.apply(j,g);return j}return g};try{Array.prototype.slice.call(u.documentElement.childNodes,0)}catch(H){D=function(g,j){var o=j||[],m=0;if(f.call(g)==="[object Array]")Array.prototype.push.apply(o,
g);else if(typeof g.length==="number")for(var p=g.length;m<p;m++)o.push(g[m]);else for(;g[m];m++)o.push(g[m]);return o}}var w,G;if(u.documentElement.compareDocumentPosition)w=function(g,j){if(g===j){h=true;return 0}if(!g.compareDocumentPosition||!j.compareDocumentPosition)return g.compareDocumentPosition?-1:1;return g.compareDocumentPosition(j)&4?-1:1};else{w=function(g,j){var o=[],m=[],p=g.parentNode,q=j.parentNode,t=p;if(g===j){h=true;return 0}else if(p===q)return G(g,j);else if(p){if(!q)return 1}else return-1;
for(;t;){o.unshift(t);t=t.parentNode}for(t=q;t;){m.unshift(t);t=t.parentNode}p=o.length;q=m.length;for(t=0;t<p&&t<q;t++)if(o[t]!==m[t])return G(o[t],m[t]);return t===p?G(g,m[t],-1):G(o[t],j,1)};G=function(g,j,o){if(g===j)return o;for(g=g.nextSibling;g;){if(g===j)return-1;g=g.nextSibling}return 1}}l.getText=function(g){for(var j="",o,m=0;g[m];m++){o=g[m];if(o.nodeType===3||o.nodeType===4)j+=o.nodeValue;else if(o.nodeType!==8)j+=l.getText(o.childNodes)}return j};(function(){var g=u.createElement("div"),
j="script"+(new Date).getTime();g.innerHTML="<a name='"+j+"'/>";var o=u.documentElement;o.insertBefore(g,o.firstChild);if(u.getElementById(j)){n.find.ID=function(m,p,q){if(typeof p.getElementById!=="undefined"&&!q)return(p=p.getElementById(m[1]))?p.id===m[1]||typeof p.getAttributeNode!=="undefined"&&p.getAttributeNode("id").nodeValue===m[1]?[p]:A:[]};n.filter.ID=function(m,p){var q=typeof m.getAttributeNode!=="undefined"&&m.getAttributeNode("id");return m.nodeType===1&&q&&q.nodeValue===p}}o.removeChild(g);
o=g=null})();(function(){var g=u.createElement("div");g.appendChild(u.createComment(""));if(g.getElementsByTagName("*").length>0)n.find.TAG=function(j,o){var m=o.getElementsByTagName(j[1]);if(j[1]==="*"){for(var p=[],q=0;m[q];q++)m[q].nodeType===1&&p.push(m[q]);m=p}return m};g.innerHTML="<a href='#'></a>";if(g.firstChild&&typeof g.firstChild.getAttribute!=="undefined"&&g.firstChild.getAttribute("href")!=="#")n.attrHandle.href=function(j){return j.getAttribute("href",2)};g=null})();u.querySelectorAll&&
function(){var g=l,j=u.createElement("div");j.innerHTML="<p class='TEST'></p>";if(!(j.querySelectorAll&&j.querySelectorAll(".TEST").length===0)){l=function(m,p,q,t){p=p||u;if(!t&&!l.isXML(p))if(p.nodeType===9)try{return D(p.querySelectorAll(m),q)}catch(x){}else if(p.nodeType===1&&p.nodeName.toLowerCase()!=="object"){var C=p.id,P=p.id="__sizzle__";try{return D(p.querySelectorAll("#"+P+" "+m),q)}catch(N){}finally{if(C)p.id=C;else p.removeAttribute("id")}}return g(m,p,q,t)};for(var o in g)l[o]=g[o];
j=null}}();(function(){var g=u.documentElement,j=g.matchesSelector||g.mozMatchesSelector||g.webkitMatchesSelector||g.msMatchesSelector,o=false;try{j.call(u.documentElement,":sizzle")}catch(m){o=true}if(j)l.matchesSelector=function(p,q){try{if(o||!n.match.PSEUDO.test(q))return j.call(p,q)}catch(t){}return l(q,null,null,[p]).length>0}})();(function(){var g=u.createElement("div");g.innerHTML="<div class='test e'></div><div class='test'></div>";if(!(!g.getElementsByClassName||g.getElementsByClassName("e").length===
0)){g.lastChild.className="e";if(g.getElementsByClassName("e").length!==1){n.order.splice(1,0,"CLASS");n.find.CLASS=function(j,o,m){if(typeof o.getElementsByClassName!=="undefined"&&!m)return o.getElementsByClassName(j[1])};g=null}}})();l.contains=u.documentElement.contains?function(g,j){return g!==j&&(g.contains?g.contains(j):true)}:function(g,j){return!!(g.compareDocumentPosition(j)&16)};l.isXML=function(g){return(g=(g?g.ownerDocument||g:0).documentElement)?g.nodeName!=="HTML":false};var M=function(g,
j){for(var o=[],m="",p,q=j.nodeType?[j]:j;p=n.match.PSEUDO.exec(g);){m+=p[0];g=g.replace(n.match.PSEUDO,"")}g=n.relative[g]?g+"*":g;p=0;for(var t=q.length;p<t;p++)l(g,q[p],o);return l.filter(m,o)};c.find=l;c.expr=l.selectors;c.expr[":"]=c.expr.filters;c.unique=l.uniqueSort;c.text=l.getText;c.isXMLDoc=l.isXML;c.contains=l.contains})();var Wa=/Until$/,Xa=/^(?:parents|prevUntil|prevAll)/,Ya=/,/,Ja=/^.[^:#\[\.,]*$/,Za=Array.prototype.slice,$a=c.expr.match.POS;c.fn.extend({find:function(a){for(var b=this.pushStack("",
"find",a),d=0,e=0,f=this.length;e<f;e++){d=b.length;c.find(a,this[e],b);if(e>0)for(var h=d;h<b.length;h++)for(var k=0;k<d;k++)if(b[k]===b[h]){b.splice(h--,1);break}}return b},has:function(a){var b=c(a);return this.filter(function(){for(var d=0,e=b.length;d<e;d++)if(c.contains(this,b[d]))return true})},not:function(a){return this.pushStack(ka(this,a,false),"not",a)},filter:function(a){return this.pushStack(ka(this,a,true),"filter",a)},is:function(a){return!!a&&c.filter(a,this).length>0},closest:function(a,
b){var d=[],e,f,h=this[0];if(c.isArray(a)){var k={},l,n=1;if(h&&a.length){e=0;for(f=a.length;e<f;e++){l=a[e];k[l]||(k[l]=c.expr.match.POS.test(l)?c(l,b||this.context):l)}for(;h&&h.ownerDocument&&h!==b;){for(l in k){e=k[l];if(e.jquery?e.index(h)>-1:c(h).is(e))d.push({selector:l,elem:h,level:n})}h=h.parentNode;n++}}return d}k=$a.test(a)?c(a,b||this.context):null;e=0;for(f=this.length;e<f;e++)for(h=this[e];h;)if(k?k.index(h)>-1:c.find.matchesSelector(h,a)){d.push(h);break}else{h=h.parentNode;if(!h||
!h.ownerDocument||h===b)break}d=d.length>1?c.unique(d):d;return this.pushStack(d,"closest",a)},index:function(a){if(!a||typeof a==="string")return c.inArray(this[0],a?c(a):this.parent().children());return c.inArray(a.jquery?a[0]:a,this)},add:function(a,b){var d=typeof a==="string"?c(a,b||this.context):c.makeArray(a),e=c.merge(this.get(),d);return this.pushStack(!d[0]||!d[0].parentNode||d[0].parentNode.nodeType===11||!e[0]||!e[0].parentNode||e[0].parentNode.nodeType===11?e:c.unique(e))},andSelf:function(){return this.add(this.prevObject)}});
c.each({parent:function(a){return(a=a.parentNode)&&a.nodeType!==11?a:null},parents:function(a){return c.dir(a,"parentNode")},parentsUntil:function(a,b,d){return c.dir(a,"parentNode",d)},next:function(a){return c.nth(a,2,"nextSibling")},prev:function(a){return c.nth(a,2,"previousSibling")},nextAll:function(a){return c.dir(a,"nextSibling")},prevAll:function(a){return c.dir(a,"previousSibling")},nextUntil:function(a,b,d){return c.dir(a,"nextSibling",d)},prevUntil:function(a,b,d){return c.dir(a,"previousSibling",
d)},siblings:function(a){return c.sibling(a.parentNode.firstChild,a)},children:function(a){return c.sibling(a.firstChild)},contents:function(a){return c.nodeName(a,"iframe")?a.contentDocument||a.contentWindow.document:c.makeArray(a.childNodes)}},function(a,b){c.fn[a]=function(d,e){var f=c.map(this,b,d);Wa.test(a)||(e=d);if(e&&typeof e==="string")f=c.filter(e,f);f=this.length>1?c.unique(f):f;if((this.length>1||Ya.test(e))&&Xa.test(a))f=f.reverse();return this.pushStack(f,a,Za.call(arguments).join(","))}});
c.extend({filter:function(a,b,d){if(d)a=":not("+a+")";return b.length===1?c.find.matchesSelector(b[0],a)?[b[0]]:[]:c.find.matches(a,b)},dir:function(a,b,d){var e=[];for(a=a[b];a&&a.nodeType!==9&&(d===A||a.nodeType!==1||!c(a).is(d));){a.nodeType===1&&e.push(a);a=a[b]}return e},nth:function(a,b,d){b=b||1;for(var e=0;a;a=a[d])if(a.nodeType===1&&++e===b)break;return a},sibling:function(a,b){for(var d=[];a;a=a.nextSibling)a.nodeType===1&&a!==b&&d.push(a);return d}});var xa=/ jQuery\d+="(?:\d+|null)"/g,
$=/^\s+/,ya=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,za=/<([\w:]+)/,ab=/<tbody/i,bb=/<|&#?\w+;/,Aa=/<(?:script|object|embed|option|style)/i,Ba=/checked\s*(?:[^=]|=\s*.checked.)/i,cb=/\=([^="'>\s]+\/)>/g,O={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],
area:[1,"<map>","</map>"],_default:[0,"",""]};O.optgroup=O.option;O.tbody=O.tfoot=O.colgroup=O.caption=O.thead;O.th=O.td;if(!c.support.htmlSerialize)O._default=[1,"div<div>","</div>"];c.fn.extend({text:function(a){if(c.isFunction(a))return this.each(function(b){var d=c(this);d.text(a.call(this,b,d.text()))});if(typeof a!=="object"&&a!==A)return this.empty().append((this[0]&&this[0].ownerDocument||u).createTextNode(a));return c.text(this)},wrapAll:function(a){if(c.isFunction(a))return this.each(function(d){c(this).wrapAll(a.call(this,
d))});if(this[0]){var b=c(a,this[0].ownerDocument).eq(0).clone(true);this[0].parentNode&&b.insertBefore(this[0]);b.map(function(){for(var d=this;d.firstChild&&d.firstChild.nodeType===1;)d=d.firstChild;return d}).append(this)}return this},wrapInner:function(a){if(c.isFunction(a))return this.each(function(b){c(this).wrapInner(a.call(this,b))});return this.each(function(){var b=c(this),d=b.contents();d.length?d.wrapAll(a):b.append(a)})},wrap:function(a){return this.each(function(){c(this).wrapAll(a)})},
unwrap:function(){return this.parent().each(function(){c.nodeName(this,"body")||c(this).replaceWith(this.childNodes)}).end()},append:function(){return this.domManip(arguments,true,function(a){this.nodeType===1&&this.appendChild(a)})},prepend:function(){return this.domManip(arguments,true,function(a){this.nodeType===1&&this.insertBefore(a,this.firstChild)})},before:function(){if(this[0]&&this[0].parentNode)return this.domManip(arguments,false,function(b){this.parentNode.insertBefore(b,this)});else if(arguments.length){var a=
c(arguments[0]);a.push.apply(a,this.toArray());return this.pushStack(a,"before",arguments)}},after:function(){if(this[0]&&this[0].parentNode)return this.domManip(arguments,false,function(b){this.parentNode.insertBefore(b,this.nextSibling)});else if(arguments.length){var a=this.pushStack(this,"after",arguments);a.push.apply(a,c(arguments[0]).toArray());return a}},remove:function(a,b){for(var d=0,e;(e=this[d])!=null;d++)if(!a||c.filter(a,[e]).length){if(!b&&e.nodeType===1){c.cleanData(e.getElementsByTagName("*"));
c.cleanData([e])}e.parentNode&&e.parentNode.removeChild(e)}return this},empty:function(){for(var a=0,b;(b=this[a])!=null;a++)for(b.nodeType===1&&c.cleanData(b.getElementsByTagName("*"));b.firstChild;)b.removeChild(b.firstChild);return this},clone:function(a){var b=this.map(function(){if(!c.support.noCloneEvent&&!c.isXMLDoc(this)){var d=this.outerHTML,e=this.ownerDocument;if(!d){d=e.createElement("div");d.appendChild(this.cloneNode(true));d=d.innerHTML}return c.clean([d.replace(xa,"").replace(cb,'="$1">').replace($,
"")],e)[0]}else return this.cloneNode(true)});if(a===true){la(this,b);la(this.find("*"),b.find("*"))}return b},html:function(a){if(a===A)return this[0]&&this[0].nodeType===1?this[0].innerHTML.replace(xa,""):null;else if(typeof a==="string"&&!Aa.test(a)&&(c.support.leadingWhitespace||!$.test(a))&&!O[(za.exec(a)||["",""])[1].toLowerCase()]){a=a.replace(ya,"<$1></$2>");try{for(var b=0,d=this.length;b<d;b++)if(this[b].nodeType===1){c.cleanData(this[b].getElementsByTagName("*"));this[b].innerHTML=a}}catch(e){this.empty().append(a)}}else c.isFunction(a)?
this.each(function(f){var h=c(this);h.html(a.call(this,f,h.html()))}):this.empty().append(a);return this},replaceWith:function(a){if(this[0]&&this[0].parentNode){if(c.isFunction(a))return this.each(function(b){var d=c(this),e=d.html();d.replaceWith(a.call(this,b,e))});if(typeof a!=="string")a=c(a).detach();return this.each(function(){var b=this.nextSibling,d=this.parentNode;c(this).remove();b?c(b).before(a):c(d).append(a)})}else return this.pushStack(c(c.isFunction(a)?a():a),"replaceWith",a)},detach:function(a){return this.remove(a,
true)},domManip:function(a,b,d){var e,f,h=a[0],k=[],l;if(!c.support.checkClone&&arguments.length===3&&typeof h==="string"&&Ba.test(h))return this.each(function(){c(this).domManip(a,b,d,true)});if(c.isFunction(h))return this.each(function(s){var v=c(this);a[0]=h.call(this,s,b?v.html():A);v.domManip(a,b,d)});if(this[0]){e=h&&h.parentNode;e=c.support.parentNode&&e&&e.nodeType===11&&e.childNodes.length===this.length?{fragment:e}:c.buildFragment(a,this,k);l=e.fragment;if(f=l.childNodes.length===1?l=l.firstChild:
l.firstChild){b=b&&c.nodeName(f,"tr");f=0;for(var n=this.length;f<n;f++)d.call(b?c.nodeName(this[f],"table")?this[f].getElementsByTagName("tbody")[0]||this[f].appendChild(this[f].ownerDocument.createElement("tbody")):this[f]:this[f],f>0||e.cacheable||this.length>1?l.cloneNode(true):l)}k.length&&c.each(k,Ka)}return this}});c.buildFragment=function(a,b,d){var e,f,h;b=b&&b[0]?b[0].ownerDocument||b[0]:u;if(a.length===1&&typeof a[0]==="string"&&a[0].length<512&&b===u&&!Aa.test(a[0])&&(c.support.checkClone||
!Ba.test(a[0]))){f=true;if(h=c.fragments[a[0]])if(h!==1)e=h}if(!e){e=b.createDocumentFragment();c.clean(a,b,e,d)}if(f)c.fragments[a[0]]=h?e:1;return{fragment:e,cacheable:f}};c.fragments={};c.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(a,b){c.fn[a]=function(d){var e=[];d=c(d);var f=this.length===1&&this[0].parentNode;if(f&&f.nodeType===11&&f.childNodes.length===1&&d.length===1){d[b](this[0]);return this}else{f=0;for(var h=
d.length;f<h;f++){var k=(f>0?this.clone(true):this).get();c(d[f])[b](k);e=e.concat(k)}return this.pushStack(e,a,d.selector)}}});c.extend({clean:function(a,b,d,e){b=b||u;if(typeof b.createElement==="undefined")b=b.ownerDocument||b[0]&&b[0].ownerDocument||u;for(var f=[],h=0,k;(k=a[h])!=null;h++){if(typeof k==="number")k+="";if(k){if(typeof k==="string"&&!bb.test(k))k=b.createTextNode(k);else if(typeof k==="string"){k=k.replace(ya,"<$1></$2>");var l=(za.exec(k)||["",""])[1].toLowerCase(),n=O[l]||O._default,
s=n[0],v=b.createElement("div");for(v.innerHTML=n[1]+k+n[2];s--;)v=v.lastChild;if(!c.support.tbody){s=ab.test(k);l=l==="table"&&!s?v.firstChild&&v.firstChild.childNodes:n[1]==="<table>"&&!s?v.childNodes:[];for(n=l.length-1;n>=0;--n)c.nodeName(l[n],"tbody")&&!l[n].childNodes.length&&l[n].parentNode.removeChild(l[n])}!c.support.leadingWhitespace&&$.test(k)&&v.insertBefore(b.createTextNode($.exec(k)[0]),v.firstChild);k=v.childNodes}if(k.nodeType)f.push(k);else f=c.merge(f,k)}}if(d)for(h=0;f[h];h++)if(e&&
c.nodeName(f[h],"script")&&(!f[h].type||f[h].type.toLowerCase()==="text/javascript"))e.push(f[h].parentNode?f[h].parentNode.removeChild(f[h]):f[h]);else{f[h].nodeType===1&&f.splice.apply(f,[h+1,0].concat(c.makeArray(f[h].getElementsByTagName("script"))));d.appendChild(f[h])}return f},cleanData:function(a){for(var b,d,e=c.cache,f=c.event.special,h=c.support.deleteExpando,k=0,l;(l=a[k])!=null;k++)if(!(l.nodeName&&c.noData[l.nodeName.toLowerCase()]))if(d=l[c.expando]){if((b=e[d])&&b.events)for(var n in b.events)f[n]?
c.event.remove(l,n):c.removeEvent(l,n,b.handle);if(h)delete l[c.expando];else l.removeAttribute&&l.removeAttribute(c.expando);delete e[d]}}});var Ca=/alpha\([^)]*\)/i,db=/opacity=([^)]*)/,eb=/-([a-z])/ig,fb=/([A-Z])/g,Da=/^-?\d+(?:px)?$/i,gb=/^-?\d/,hb={position:"absolute",visibility:"hidden",display:"block"},La=["Left","Right"],Ma=["Top","Bottom"],W,ib=u.defaultView&&u.defaultView.getComputedStyle,jb=function(a,b){return b.toUpperCase()};c.fn.css=function(a,b){if(arguments.length===2&&b===A)return this;
return c.access(this,a,b,true,function(d,e,f){return f!==A?c.style(d,e,f):c.css(d,e)})};c.extend({cssHooks:{opacity:{get:function(a,b){if(b){var d=W(a,"opacity","opacity");return d===""?"1":d}else return a.style.opacity}}},cssNumber:{zIndex:true,fontWeight:true,opacity:true,zoom:true,lineHeight:true},cssProps:{"float":c.support.cssFloat?"cssFloat":"styleFloat"},style:function(a,b,d,e){if(!(!a||a.nodeType===3||a.nodeType===8||!a.style)){var f,h=c.camelCase(b),k=a.style,l=c.cssHooks[h];b=c.cssProps[h]||
h;if(d!==A){if(!(typeof d==="number"&&isNaN(d)||d==null)){if(typeof d==="number"&&!c.cssNumber[h])d+="px";if(!l||!("set"in l)||(d=l.set(a,d))!==A)try{k[b]=d}catch(n){}}}else{if(l&&"get"in l&&(f=l.get(a,false,e))!==A)return f;return k[b]}}},css:function(a,b,d){var e,f=c.camelCase(b),h=c.cssHooks[f];b=c.cssProps[f]||f;if(h&&"get"in h&&(e=h.get(a,true,d))!==A)return e;else if(W)return W(a,b,f)},swap:function(a,b,d){var e={},f;for(f in b){e[f]=a.style[f];a.style[f]=b[f]}d.call(a);for(f in b)a.style[f]=
e[f]},camelCase:function(a){return a.replace(eb,jb)}});c.curCSS=c.css;c.each(["height","width"],function(a,b){c.cssHooks[b]={get:function(d,e,f){var h;if(e){if(d.offsetWidth!==0)h=ma(d,b,f);else c.swap(d,hb,function(){h=ma(d,b,f)});return h+"px"}},set:function(d,e){if(Da.test(e)){e=parseFloat(e);if(e>=0)return e+"px"}else return e}}});if(!c.support.opacity)c.cssHooks.opacity={get:function(a,b){return db.test((b&&a.currentStyle?a.currentStyle.filter:a.style.filter)||"")?parseFloat(RegExp.$1)/100+"":
b?"1":""},set:function(a,b){var d=a.style;d.zoom=1;var e=c.isNaN(b)?"":"alpha(opacity="+b*100+")",f=d.filter||"";d.filter=Ca.test(f)?f.replace(Ca,e):d.filter+" "+e}};if(ib)W=function(a,b,d){var e;d=d.replace(fb,"-$1").toLowerCase();if(!(b=a.ownerDocument.defaultView))return A;if(b=b.getComputedStyle(a,null)){e=b.getPropertyValue(d);if(e===""&&!c.contains(a.ownerDocument.documentElement,a))e=c.style(a,d)}return e};else if(u.documentElement.currentStyle)W=function(a,b){var d,e,f=a.currentStyle&&a.currentStyle[b],
h=a.style;if(!Da.test(f)&&gb.test(f)){d=h.left;e=a.runtimeStyle.left;a.runtimeStyle.left=a.currentStyle.left;h.left=b==="fontSize"?"1em":f||0;f=h.pixelLeft+"px";h.left=d;a.runtimeStyle.left=e}return f};if(c.expr&&c.expr.filters){c.expr.filters.hidden=function(a){var b=a.offsetHeight;return a.offsetWidth===0&&b===0||!c.support.reliableHiddenOffsets&&(a.style.display||c.css(a,"display"))==="none"};c.expr.filters.visible=function(a){return!c.expr.filters.hidden(a)}}var kb=c.now(),lb=/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
mb=/^(?:select|textarea)/i,nb=/^(?:color|date|datetime|email|hidden|month|number|password|range|search|tel|text|time|url|week)$/i,ob=/^(?:GET|HEAD|DELETE)$/,Na=/\[\]$/,T=/\=\?(&|$)/,ia=/\?/,pb=/([?&])_=[^&]*/,qb=/^(\w+:)?\/\/([^\/?#]+)/,rb=/%20/g,sb=/#.*$/,Ea=c.fn.load;c.fn.extend({load:function(a,b,d){if(typeof a!=="string"&&Ea)return Ea.apply(this,arguments);else if(!this.length)return this;var e=a.indexOf(" ");if(e>=0){var f=a.slice(e,a.length);a=a.slice(0,e)}e="GET";if(b)if(c.isFunction(b)){d=
b;b=null}else if(typeof b==="object"){b=c.param(b,c.ajaxSettings.traditional);e="POST"}var h=this;c.ajax({url:a,type:e,dataType:"html",data:b,complete:function(k,l){if(l==="success"||l==="notmodified")h.html(f?c("<div>").append(k.responseText.replace(lb,"")).find(f):k.responseText);d&&h.each(d,[k.responseText,l,k])}});return this},serialize:function(){return c.param(this.serializeArray())},serializeArray:function(){return this.map(function(){return this.elements?c.makeArray(this.elements):this}).filter(function(){return this.name&&
!this.disabled&&(this.checked||mb.test(this.nodeName)||nb.test(this.type))}).map(function(a,b){var d=c(this).val();return d==null?null:c.isArray(d)?c.map(d,function(e){return{name:b.name,value:e}}):{name:b.name,value:d}}).get()}});c.each("ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split(" "),function(a,b){c.fn[b]=function(d){return this.bind(b,d)}});c.extend({get:function(a,b,d,e){if(c.isFunction(b)){e=e||d;d=b;b=null}return c.ajax({type:"GET",url:a,data:b,success:d,dataType:e})},
getScript:function(a,b){return c.get(a,null,b,"script")},getJSON:function(a,b,d){return c.get(a,b,d,"json")},post:function(a,b,d,e){if(c.isFunction(b)){e=e||d;d=b;b={}}return c.ajax({type:"POST",url:a,data:b,success:d,dataType:e})},ajaxSetup:function(a){c.extend(c.ajaxSettings,a)},ajaxSettings:{url:location.href,global:true,type:"GET",contentType:"application/x-www-form-urlencoded",processData:true,async:true,xhr:function(){return new E.XMLHttpRequest},accepts:{xml:"application/xml, text/xml",html:"text/html",
script:"text/javascript, application/javascript",json:"application/json, text/javascript",text:"text/plain",_default:"*/*"}},ajax:function(a){var b=c.extend(true,{},c.ajaxSettings,a),d,e,f,h=b.type.toUpperCase(),k=ob.test(h);b.url=b.url.replace(sb,"");b.context=a&&a.context!=null?a.context:b;if(b.data&&b.processData&&typeof b.data!=="string")b.data=c.param(b.data,b.traditional);if(b.dataType==="jsonp"){if(h==="GET")T.test(b.url)||(b.url+=(ia.test(b.url)?"&":"?")+(b.jsonp||"callback")+"=?");else if(!b.data||
!T.test(b.data))b.data=(b.data?b.data+"&":"")+(b.jsonp||"callback")+"=?";b.dataType="json"}if(b.dataType==="json"&&(b.data&&T.test(b.data)||T.test(b.url))){d=b.jsonpCallback||"jsonp"+kb++;if(b.data)b.data=(b.data+"").replace(T,"="+d+"$1");b.url=b.url.replace(T,"="+d+"$1");b.dataType="script";var l=E[d];E[d]=function(m){f=m;c.handleSuccess(b,w,e,f);c.handleComplete(b,w,e,f);if(c.isFunction(l))l(m);else{E[d]=A;try{delete E[d]}catch(p){}}v&&v.removeChild(B)}}if(b.dataType==="script"&&b.cache===null)b.cache=
false;if(b.cache===false&&h==="GET"){var n=c.now(),s=b.url.replace(pb,"$1_="+n);b.url=s+(s===b.url?(ia.test(b.url)?"&":"?")+"_="+n:"")}if(b.data&&h==="GET")b.url+=(ia.test(b.url)?"&":"?")+b.data;b.global&&c.active++===0&&c.event.trigger("ajaxStart");n=(n=qb.exec(b.url))&&(n[1]&&n[1]!==location.protocol||n[2]!==location.host);if(b.dataType==="script"&&h==="GET"&&n){var v=u.getElementsByTagName("head")[0]||u.documentElement,B=u.createElement("script");if(b.scriptCharset)B.charset=b.scriptCharset;B.src=
b.url;if(!d){var D=false;B.onload=B.onreadystatechange=function(){if(!D&&(!this.readyState||this.readyState==="loaded"||this.readyState==="complete")){D=true;c.handleSuccess(b,w,e,f);c.handleComplete(b,w,e,f);B.onload=B.onreadystatechange=null;v&&B.parentNode&&v.removeChild(B)}}}v.insertBefore(B,v.firstChild);return A}var H=false,w=b.xhr();if(w){b.username?w.open(h,b.url,b.async,b.username,b.password):w.open(h,b.url,b.async);try{if(b.data!=null&&!k||a&&a.contentType)w.setRequestHeader("Content-Type",
b.contentType);if(b.ifModified){c.lastModified[b.url]&&w.setRequestHeader("If-Modified-Since",c.lastModified[b.url]);c.etag[b.url]&&w.setRequestHeader("If-None-Match",c.etag[b.url])}n||w.setRequestHeader("X-Requested-With","XMLHttpRequest");w.setRequestHeader("Accept",b.dataType&&b.accepts[b.dataType]?b.accepts[b.dataType]+", */*; q=0.01":b.accepts._default)}catch(G){}if(b.beforeSend&&b.beforeSend.call(b.context,w,b)===false){b.global&&c.active--===1&&c.event.trigger("ajaxStop");w.abort();return false}b.global&&
c.triggerGlobal(b,"ajaxSend",[w,b]);var M=w.onreadystatechange=function(m){if(!w||w.readyState===0||m==="abort"){H||c.handleComplete(b,w,e,f);H=true;if(w)w.onreadystatechange=c.noop}else if(!H&&w&&(w.readyState===4||m==="timeout")){H=true;w.onreadystatechange=c.noop;e=m==="timeout"?"timeout":!c.httpSuccess(w)?"error":b.ifModified&&c.httpNotModified(w,b.url)?"notmodified":"success";var p;if(e==="success")try{f=c.httpData(w,b.dataType,b)}catch(q){e="parsererror";p=q}if(e==="success"||e==="notmodified")d||
c.handleSuccess(b,w,e,f);else c.handleError(b,w,e,p);d||c.handleComplete(b,w,e,f);m==="timeout"&&w.abort();if(b.async)w=null}};try{var g=w.abort;w.abort=function(){w&&g.call&&g.call(w);M("abort")}}catch(j){}b.async&&b.timeout>0&&setTimeout(function(){w&&!H&&M("timeout")},b.timeout);try{w.send(k||b.data==null?null:b.data)}catch(o){c.handleError(b,w,null,o);c.handleComplete(b,w,e,f)}b.async||M();return w}},param:function(a,b){var d=[],e=function(h,k){k=c.isFunction(k)?k():k;d[d.length]=encodeURIComponent(h)+
"="+encodeURIComponent(k)};if(b===A)b=c.ajaxSettings.traditional;if(c.isArray(a)||a.jquery)c.each(a,function(){e(this.name,this.value)});else for(var f in a)ca(f,a[f],b,e);return d.join("&").replace(rb,"+")}});c.extend({active:0,lastModified:{},etag:{},handleError:function(a,b,d,e){a.error&&a.error.call(a.context,b,d,e);a.global&&c.triggerGlobal(a,"ajaxError",[b,a,e])},handleSuccess:function(a,b,d,e){a.success&&a.success.call(a.context,e,d,b);a.global&&c.triggerGlobal(a,"ajaxSuccess",[b,a])},handleComplete:function(a,
b,d){a.complete&&a.complete.call(a.context,b,d);a.global&&c.triggerGlobal(a,"ajaxComplete",[b,a]);a.global&&c.active--===1&&c.event.trigger("ajaxStop")},triggerGlobal:function(a,b,d){(a.context&&a.context.url==null?c(a.context):c.event).trigger(b,d)},httpSuccess:function(a){try{return!a.status&&location.protocol==="file:"||a.status>=200&&a.status<300||a.status===304||a.status===1223}catch(b){}return false},httpNotModified:function(a,b){var d=a.getResponseHeader("Last-Modified"),e=a.getResponseHeader("Etag");
if(d)c.lastModified[b]=d;if(e)c.etag[b]=e;return a.status===304},httpData:function(a,b,d){var e=a.getResponseHeader("content-type")||"",f=b==="xml"||!b&&e.indexOf("xml")>=0;a=f?a.responseXML:a.responseText;f&&a.documentElement.nodeName==="parsererror"&&c.error("parsererror");if(d&&d.dataFilter)a=d.dataFilter(a,b);if(typeof a==="string")if(b==="json"||!b&&e.indexOf("json")>=0)a=c.parseJSON(a);else if(b==="script"||!b&&e.indexOf("javascript")>=0)c.globalEval(a);return a}});if(E.ActiveXObject)c.ajaxSettings.xhr=
function(){if(E.location.protocol!=="file:")try{return new E.XMLHttpRequest}catch(a){}try{return new E.ActiveXObject("Microsoft.XMLHTTP")}catch(b){}};c.support.ajax=!!c.ajaxSettings.xhr();var da={},tb=/^(?:toggle|show|hide)$/,ub=/^([+\-]=)?([\d+.\-]+)(.*)$/,aa,na=[["height","marginTop","marginBottom","paddingTop","paddingBottom"],["width","marginLeft","marginRight","paddingLeft","paddingRight"],["opacity"]];c.fn.extend({show:function(a,b,d){if(a||a===0)return this.animate(S("show",3),a,b,d);else{a=
0;for(b=this.length;a<b;a++){if(!c.data(this[a],"olddisplay")&&this[a].style.display==="none")this[a].style.display="";this[a].style.display===""&&c.css(this[a],"display")==="none"&&c.data(this[a],"olddisplay",oa(this[a].nodeName))}for(a=0;a<b;a++)this[a].style.display=c.data(this[a],"olddisplay")||"";return this}},hide:function(a,b,d){if(a||a===0)return this.animate(S("hide",3),a,b,d);else{a=0;for(b=this.length;a<b;a++){d=c.css(this[a],"display");d!=="none"&&c.data(this[a],"olddisplay",d)}for(a=
0;a<b;a++)this[a].style.display="none";return this}},_toggle:c.fn.toggle,toggle:function(a,b,d){var e=typeof a==="boolean";if(c.isFunction(a)&&c.isFunction(b))this._toggle.apply(this,arguments);else a==null||e?this.each(function(){var f=e?a:c(this).is(":hidden");c(this)[f?"show":"hide"]()}):this.animate(S("toggle",3),a,b,d);return this},fadeTo:function(a,b,d,e){return this.filter(":hidden").css("opacity",0).show().end().animate({opacity:b},a,d,e)},animate:function(a,b,d,e){var f=c.speed(b,d,e);if(c.isEmptyObject(a))return this.each(f.complete);
return this[f.queue===false?"each":"queue"](function(){var h=c.extend({},f),k,l=this.nodeType===1,n=l&&c(this).is(":hidden"),s=this;for(k in a){var v=c.camelCase(k);if(k!==v){a[v]=a[k];delete a[k];k=v}if(a[k]==="hide"&&n||a[k]==="show"&&!n)return h.complete.call(this);if(l&&(k==="height"||k==="width")){h.overflow=[this.style.overflow,this.style.overflowX,this.style.overflowY];if(c.css(this,"display")==="inline"&&c.css(this,"float")==="none")if(c.support.inlineBlockNeedsLayout)if(oa(this.nodeName)===
"inline")this.style.display="inline-block";else{this.style.display="inline";this.style.zoom=1}else this.style.display="inline-block"}if(c.isArray(a[k])){(h.specialEasing=h.specialEasing||{})[k]=a[k][1];a[k]=a[k][0]}}if(h.overflow!=null)this.style.overflow="hidden";h.curAnim=c.extend({},a);c.each(a,function(B,D){var H=new c.fx(s,h,B);if(tb.test(D))H[D==="toggle"?n?"show":"hide":D](a);else{var w=ub.exec(D),G=H.cur(true)||0;if(w){var M=parseFloat(w[2]),g=w[3]||"px";if(g!=="px"){c.style(s,B,(M||1)+g);
G=(M||1)/H.cur(true)*G;c.style(s,B,G+g)}if(w[1])M=(w[1]==="-="?-1:1)*M+G;H.custom(G,M,g)}else H.custom(G,D,"")}});return true})},stop:function(a,b){var d=c.timers;a&&this.queue([]);this.each(function(){for(var e=d.length-1;e>=0;e--)if(d[e].elem===this){b&&d[e](true);d.splice(e,1)}});b||this.dequeue();return this}});c.each({slideDown:S("show",1),slideUp:S("hide",1),slideToggle:S("toggle",1),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"}},function(a,b){c.fn[a]=function(d,e,f){return this.animate(b,
d,e,f)}});c.extend({speed:function(a,b,d){var e=a&&typeof a==="object"?c.extend({},a):{complete:d||!d&&b||c.isFunction(a)&&a,duration:a,easing:d&&b||b&&!c.isFunction(b)&&b};e.duration=c.fx.off?0:typeof e.duration==="number"?e.duration:e.duration in c.fx.speeds?c.fx.speeds[e.duration]:c.fx.speeds._default;e.old=e.complete;e.complete=function(){e.queue!==false&&c(this).dequeue();c.isFunction(e.old)&&e.old.call(this)};return e},easing:{linear:function(a,b,d,e){return d+e*a},swing:function(a,b,d,e){return(-Math.cos(a*
Math.PI)/2+0.5)*e+d}},timers:[],fx:function(a,b,d){this.options=b;this.elem=a;this.prop=d;if(!b.orig)b.orig={}}});c.fx.prototype={update:function(){this.options.step&&this.options.step.call(this.elem,this.now,this);(c.fx.step[this.prop]||c.fx.step._default)(this)},cur:function(){if(this.elem[this.prop]!=null&&(!this.elem.style||this.elem.style[this.prop]==null))return this.elem[this.prop];var a=parseFloat(c.css(this.elem,this.prop));return a&&a>-1E4?a:0},custom:function(a,b,d){function e(h){return f.step(h)}
this.startTime=c.now();this.start=a;this.end=b;this.unit=d||this.unit||"px";this.now=this.start;this.pos=this.state=0;var f=this;a=c.fx;e.elem=this.elem;if(e()&&c.timers.push(e)&&!aa)aa=setInterval(a.tick,a.interval)},show:function(){this.options.orig[this.prop]=c.style(this.elem,this.prop);this.options.show=true;this.custom(this.prop==="width"||this.prop==="height"?1:0,this.cur());c(this.elem).show()},hide:function(){this.options.orig[this.prop]=c.style(this.elem,this.prop);this.options.hide=true;
this.custom(this.cur(),0)},step:function(a){var b=c.now(),d=true;if(a||b>=this.options.duration+this.startTime){this.now=this.end;this.pos=this.state=1;this.update();this.options.curAnim[this.prop]=true;for(var e in this.options.curAnim)if(this.options.curAnim[e]!==true)d=false;if(d){if(this.options.overflow!=null&&!c.support.shrinkWrapBlocks){var f=this.elem,h=this.options;c.each(["","X","Y"],function(l,n){f.style["overflow"+n]=h.overflow[l]})}this.options.hide&&c(this.elem).hide();if(this.options.hide||
this.options.show)for(var k in this.options.curAnim)c.style(this.elem,k,this.options.orig[k]);this.options.complete.call(this.elem)}return false}else{a=b-this.startTime;this.state=a/this.options.duration;b=this.options.easing||(c.easing.swing?"swing":"linear");this.pos=c.easing[this.options.specialEasing&&this.options.specialEasing[this.prop]||b](this.state,a,0,1,this.options.duration);this.now=this.start+(this.end-this.start)*this.pos;this.update()}return true}};c.extend(c.fx,{tick:function(){for(var a=
c.timers,b=0;b<a.length;b++)a[b]()||a.splice(b--,1);a.length||c.fx.stop()},interval:13,stop:function(){clearInterval(aa);aa=null},speeds:{slow:600,fast:200,_default:400},step:{opacity:function(a){c.style(a.elem,"opacity",a.now)},_default:function(a){if(a.elem.style&&a.elem.style[a.prop]!=null)a.elem.style[a.prop]=(a.prop==="width"||a.prop==="height"?Math.max(0,a.now):a.now)+a.unit;else a.elem[a.prop]=a.now}}});if(c.expr&&c.expr.filters)c.expr.filters.animated=function(a){return c.grep(c.timers,function(b){return a===
b.elem}).length};var vb=/^t(?:able|d|h)$/i,Fa=/^(?:body|html)$/i;c.fn.offset="getBoundingClientRect"in u.documentElement?function(a){var b=this[0],d;if(a)return this.each(function(k){c.offset.setOffset(this,a,k)});if(!b||!b.ownerDocument)return null;if(b===b.ownerDocument.body)return c.offset.bodyOffset(b);try{d=b.getBoundingClientRect()}catch(e){}var f=b.ownerDocument,h=f.documentElement;if(!d||!c.contains(h,b))return d||{top:0,left:0};b=f.body;f=ea(f);return{top:d.top+(f.pageYOffset||c.support.boxModel&&
h.scrollTop||b.scrollTop)-(h.clientTop||b.clientTop||0),left:d.left+(f.pageXOffset||c.support.boxModel&&h.scrollLeft||b.scrollLeft)-(h.clientLeft||b.clientLeft||0)}}:function(a){var b=this[0];if(a)return this.each(function(s){c.offset.setOffset(this,a,s)});if(!b||!b.ownerDocument)return null;if(b===b.ownerDocument.body)return c.offset.bodyOffset(b);c.offset.initialize();var d=b.offsetParent,e=b.ownerDocument,f,h=e.documentElement,k=e.body;f=(e=e.defaultView)?e.getComputedStyle(b,null):b.currentStyle;
for(var l=b.offsetTop,n=b.offsetLeft;(b=b.parentNode)&&b!==k&&b!==h;){if(c.offset.supportsFixedPosition&&f.position==="fixed")break;f=e?e.getComputedStyle(b,null):b.currentStyle;l-=b.scrollTop;n-=b.scrollLeft;if(b===d){l+=b.offsetTop;n+=b.offsetLeft;if(c.offset.doesNotAddBorder&&!(c.offset.doesAddBorderForTableAndCells&&vb.test(b.nodeName))){l+=parseFloat(f.borderTopWidth)||0;n+=parseFloat(f.borderLeftWidth)||0}d=b.offsetParent}if(c.offset.subtractsBorderForOverflowNotVisible&&f.overflow!=="visible"){l+=
parseFloat(f.borderTopWidth)||0;n+=parseFloat(f.borderLeftWidth)||0}f=f}if(f.position==="relative"||f.position==="static"){l+=k.offsetTop;n+=k.offsetLeft}if(c.offset.supportsFixedPosition&&f.position==="fixed"){l+=Math.max(h.scrollTop,k.scrollTop);n+=Math.max(h.scrollLeft,k.scrollLeft)}return{top:l,left:n}};c.offset={initialize:function(){var a=u.body,b=u.createElement("div"),d,e,f,h=parseFloat(c.css(a,"marginTop"))||0;c.extend(b.style,{position:"absolute",top:0,left:0,margin:0,border:0,width:"1px",
height:"1px",visibility:"hidden"});b.innerHTML="<div style='position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;'><div></div></div><table style='position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;' cellpadding='0' cellspacing='0'><tr><td></td></tr></table>";a.insertBefore(b,a.firstChild);d=b.firstChild;e=d.firstChild;f=d.nextSibling.firstChild.firstChild;this.doesNotAddBorder=e.offsetTop!==5;this.doesAddBorderForTableAndCells=
f.offsetTop===5;e.style.position="fixed";e.style.top="20px";this.supportsFixedPosition=e.offsetTop===20||e.offsetTop===15;e.style.position=e.style.top="";d.style.overflow="hidden";d.style.position="relative";this.subtractsBorderForOverflowNotVisible=e.offsetTop===-5;this.doesNotIncludeMarginInBodyOffset=a.offsetTop!==h;a.removeChild(b);c.offset.initialize=c.noop},bodyOffset:function(a){var b=a.offsetTop,d=a.offsetLeft;c.offset.initialize();if(c.offset.doesNotIncludeMarginInBodyOffset){b+=parseFloat(c.css(a,
"marginTop"))||0;d+=parseFloat(c.css(a,"marginLeft"))||0}return{top:b,left:d}},setOffset:function(a,b,d){var e=c.css(a,"position");if(e==="static")a.style.position="relative";var f=c(a),h=f.offset(),k=c.css(a,"top"),l=c.css(a,"left"),n=e==="absolute"&&c.inArray("auto",[k,l])>-1;e={};var s={};if(n)s=f.position();k=n?s.top:parseInt(k,10)||0;l=n?s.left:parseInt(l,10)||0;if(c.isFunction(b))b=b.call(a,d,h);if(b.top!=null)e.top=b.top-h.top+k;if(b.left!=null)e.left=b.left-h.left+l;"using"in b?b.using.call(a,
e):f.css(e)}};c.fn.extend({position:function(){if(!this[0])return null;var a=this[0],b=this.offsetParent(),d=this.offset(),e=Fa.test(b[0].nodeName)?{top:0,left:0}:b.offset();d.top-=parseFloat(c.css(a,"marginTop"))||0;d.left-=parseFloat(c.css(a,"marginLeft"))||0;e.top+=parseFloat(c.css(b[0],"borderTopWidth"))||0;e.left+=parseFloat(c.css(b[0],"borderLeftWidth"))||0;return{top:d.top-e.top,left:d.left-e.left}},offsetParent:function(){return this.map(function(){for(var a=this.offsetParent||u.body;a&&!Fa.test(a.nodeName)&&
c.css(a,"position")==="static";)a=a.offsetParent;return a})}});c.each(["Left","Top"],function(a,b){var d="scroll"+b;c.fn[d]=function(e){var f=this[0],h;if(!f)return null;if(e!==A)return this.each(function(){if(h=ea(this))h.scrollTo(!a?e:c(h).scrollLeft(),a?e:c(h).scrollTop());else this[d]=e});else return(h=ea(f))?"pageXOffset"in h?h[a?"pageYOffset":"pageXOffset"]:c.support.boxModel&&h.document.documentElement[d]||h.document.body[d]:f[d]}});c.each(["Height","Width"],function(a,b){var d=b.toLowerCase();
c.fn["inner"+b]=function(){return this[0]?parseFloat(c.css(this[0],d,"padding")):null};c.fn["outer"+b]=function(e){return this[0]?parseFloat(c.css(this[0],d,e?"margin":"border")):null};c.fn[d]=function(e){var f=this[0];if(!f)return e==null?null:this;if(c.isFunction(e))return this.each(function(h){var k=c(this);k[d](e.call(this,h,k[d]()))});return c.isWindow(f)?f.document.compatMode==="CSS1Compat"&&f.document.documentElement["client"+b]||f.document.body["client"+b]:f.nodeType===9?Math.max(f.documentElement["client"+
b],f.body["scroll"+b],f.documentElement["scroll"+b],f.body["offset"+b],f.documentElement["offset"+b]):e===A?parseFloat(c.css(f,d)):this.css(d,typeof e==="string"?e:e+"px")}})})(window);
jstestdriver.jQuery = jQuery.noConflict(true);

/*
 * Copyright 2011 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
/**
 * The first half of the angular json wrapper.
 * @author corbinrsmith@gmail.com (Cory Smith)
 */

jstestdriver.angular = (function (angular, JSON, jQuery) {
  angular = angular || {};
  var _null = null;
  var $null = 'null';
  var _undefined;
  var $undefined = 'undefined';
  var $function = 'function';
  
  // library functions for angular.
  var isNumber = function (obj) {
    return (typeof obj).toLowerCase() == 'number' || obj instanceof Number;
  };
  
  var isObject = function (obj) {
    return obj != null && (typeof obj).toLowerCase() == 'object';
  };

  var isString = function (obj) {
    return (typeof obj).toLowerCase() == 'string' || obj instanceof String;
  };

  var isArray = function (obj) {
    return obj instanceof Array;
  };

  var isFunction = function (obj) {
    return (typeof obj).toLowerCase() == 'function';
  }

  var isBoolean = function (obj) {
    return (typeof obj).toLowerCase() == 'boolean' || obj instanceof Boolean;
  };

  var isUndefined = function (obj) {
    return (typeof obj).toLowerCase() == 'undefined';
  };

  var isDate = function (obj) {
    return obj instanceof Date;
  };

  var forEach = function (coll, callback) {
    jQuery.each(coll, function (index, value){
      return callback(value, index);
    });
  }

  function includes(arr, obj) {
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] === obj) {
        return true;
      }
    }
    return false;
  }

  // extracted from https://github.com/angular/angular.js/blob/master/src/filters.js
  // Lines 106..129, 
  function padNumber(num, digits, trim) {
    var neg = '';
    if (num < 0) {
      neg =  '-';
      num = -num;
    }
    num = '' + num;
    while(num.length < digits) num = '0' + num;
    if (trim)
      num = num.substr(num.length - digits);
    return neg + num;
  }
  
  // extracted from https://github.com/angular/angular.js/blob/master/src/apis.js
  // Lines 721..782, 
  var R_ISO8061_STR = /^(\d{4})-(\d\d)-(\d\d)(?:T(\d\d)(?:\:(\d\d)(?:\:(\d\d)(?:\.(\d{3}))?)?)?Z)?$/;

  angular['String'] = {
    'quote':function(string) {
      return '"' + string.replace(/\\/g, '\\\\').
                          replace(/"/g, '\\"').
                          replace(/\n/g, '\\n').
                          replace(/\f/g, '\\f').
                          replace(/\r/g, '\\r').
                          replace(/\t/g, '\\t').
                          replace(/\v/g, '\\v') +
               '"';
    },
    'quoteUnicode':function(string) {
      var str = angular['String']['quote'](string);
      var chars = [];
      for ( var i = 0; i < str.length; i++) {
        var ch = str.charCodeAt(i);
        if (ch < 128) {
          chars.push(str.charAt(i));
        } else {
          var encode = "000" + ch.toString(16);
          chars.push("\\u" + encode.substring(encode.length - 4));
        }
      }
      return chars.join('');
    },

    /**
     * Tries to convert input to date and if successful returns the date, otherwise returns the input.
     * @param {string} string
     * @return {(Date|string)}
     */
    'toDate':function(string){
      var match;
      if (isString(string) && (match = string.match(R_ISO8061_STR))){
        var date = new Date(0);
        date.setUTCFullYear(match[1], match[2] - 1, match[3]);
        date.setUTCHours(match[4]||0, match[5]||0, match[6]||0, match[7]||0);
        return date;
      }
      return string;
    }
  };

  angular['Date'] = {
      'toString':function(date){
        return !date ?
                  date :
                  date.toISOString ?
                    date.toISOString() :
                    padNumber(date.getUTCFullYear(), 4) + '-' +
                    padNumber(date.getUTCMonth() + 1, 2) + '-' +
                    padNumber(date.getUTCDate(), 2) + 'T' +
                    padNumber(date.getUTCHours(), 2) + ':' +
                    padNumber(date.getUTCMinutes(), 2) + ':' +
                    padNumber(date.getUTCSeconds(), 2) + '.' +
                    padNumber(date.getUTCMilliseconds(), 3) + 'Z';
      }
    };
  /*The MIT License

Copyright (c) 2010 Adam Abrons and Misko Hevery http://getangular.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.*/

var array = [].constructor;

/**
 * @workInProgress
 * @ngdoc function
 * @name angular.toJson
 * @function
 *
 * @description
 * Serializes the input into a JSON formated string.
 *
 * @param {Object|Array|Date|string|number} obj Input to jsonify.
 * @param {boolean=} pretty If set to true, the JSON output will contain newlines and whitespace.
 * @returns {string} Jsonified string representing `obj`.
 */
function toJson(obj, pretty) {
  var buf = [];
  toJsonArray(buf, obj, pretty ? "\n  " : _null, []);
  return buf.join('');
}

/**
 * @workInProgress
 * @ngdoc function
 * @name angular.fromJson
 * @function
 *
 * @description
 * Deserializes a string in the JSON format.
 *
 * @param {string} json JSON string to deserialize.
 * @param {boolean} [useNative=false] Use native JSON parser if available
 * @returns {Object|Array|Date|string|number} Deserialized thingy.
 */
function fromJson(json, useNative) {
  if (!isString(json)) return json;

  var obj, p, expression;

  try {
    if (useNative && JSON && JSON.parse) {
      obj = JSON.parse(json);
      return transformDates(obj);
    }

    p = parser(json, true);
    expression =  p.primary();
    p.assertAllConsumed();
    return expression();

  } catch (e) {
    error("fromJson error: ", json, e);
    throw e;
  }

  // TODO make forEach optionally recursive and remove this function
  function transformDates(obj) {
    if (isString(obj) && obj.length === DATE_ISOSTRING_LN) {
      return angularString.toDate(obj);
    } else if (isArray(obj) || isObject(obj)) {
      forEach(obj, function(val, name) {
        obj[name] = transformDates(val);
      });
    }
    return obj;
  }
}

angular['toJson'] = toJson;
angular['fromJson'] = fromJson;

function toJsonArray(buf, obj, pretty, stack) {
  if (isObject(obj)) {
    if (obj === window) {
      buf.push(angular['String']['quote']('WINDOW'));
      return;
    }

    if (obj === document) {
      buf.push(angular['String']['quote']('DOCUMENT'));
      return;
    }

    if (includes(stack, obj)) {
      buf.push(angular['String']['quote']('RECURSION'));
      return;
    }
    stack.push(obj);
  }
  if (obj === _null) {
    buf.push($null);
  } else if (obj instanceof RegExp) {
    buf.push(angular['String']['quoteUnicode'](obj.toString()));
  } else if (isFunction(obj)) {
    return;
  } else if (isBoolean(obj)) {
    buf.push('' + obj);
  } else if (isNumber(obj)) {
    if (isNaN(obj)) {
      buf.push($null);
    } else {
      buf.push('' + obj);
    }
  } else if (isString(obj)) {
    return buf.push(angular['String']['quoteUnicode'](obj));
  } else if (isObject(obj)) {
    if (isArray(obj)) {
      buf.push("[");
      var len = obj.length;
      var sep = false;
      for(var i=0; i<len; i++) {
        var item = obj[i];
        if (sep) buf.push(",");
        if (!(item instanceof RegExp) && (isFunction(item) || isUndefined(item))) {
          buf.push($null);
        } else {
          toJsonArray(buf, item, pretty, stack);
        }
        sep = true;
      }
      buf.push("]");
    } else if (isDate(obj)) {
      buf.push(angular['String']['quoteUnicode'](angular['Date']['toString'](obj)));
    } else {
      buf.push("{");
      if (pretty) buf.push(pretty);
      var comma = false;
      var childPretty = pretty ? pretty + "  " : false;
      var keys = [];
      for(var k in obj) {
        if (obj[k] === _undefined)
          continue;
        keys.push(k);
      }
      keys.sort();
      for ( var keyIndex = 0; keyIndex < keys.length; keyIndex++) {
        var key = keys[keyIndex];
        var value = obj[key];
        if (typeof value != $function) {
          if (comma) {
            buf.push(",");
            if (pretty) buf.push(pretty);
          }
          buf.push(angular['String']['quote'](key));
          buf.push(":");
          toJsonArray(buf, value, childPretty, stack);
          comma = true;
        }
      }
      buf.push("}");
    }
  }
  if (isObject(obj)) {
    stack.pop();
  }
}
/*
 * Copyright 2011 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
/**
 * The second half of the angular json wrapper.
 * @author corbinrsmith@gmail.com (Cory Smith)
 */

  angular.toJson = toJson;
  angular.fromJson = fromJson;
  return angular;
})(jstestdriver.angular, jstestdriver.JSON, jstestdriver.jQuery);
/*
 * Copyright 2009 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

/**
 * A simple Signal object used for communication of state.
 * @param {Object} initial value.
 * @constructor
 */
jstestdriver.Signal = function(initial) {
  /**
   * @type {Object}
   */
  this.value_ = initial;
}


jstestdriver.Signal.prototype.get = function() {
  return this.value_;
}


jstestdriver.Signal.prototype.set = function(value) {
  this.value_ = value;
}
/*
 * Copyright 2010 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

/**
 * Watches for unauthorized unload events, such as a script calling reload,
 * or navigating to another page.
 *
 * @constructor
 * @param {jstestdriver.StreamingService} streamingService
 *     Used for server communication.
 * @param {function():jstestdriver.BrowserInfo} getBrowserInfo A function that 
 *     returns the browser information.
 * @param {function():String} getCommand Provides current command.
 * @param {jstestdriver.Signal} unloadSignal Signals if the unload command is expected.
 */
jstestdriver.PageUnloadHandler =
    function(streamingService, getBrowserInfo, getCommand, unloadSignal) {
  this.streamingService_ = streamingService;
  this.getBrowserInfo_ = getBrowserInfo;
  this.getCommand_ = getCommand
  this.unloadSignal_ = unloadSignal;
};


jstestdriver.PageUnloadHandler.prototype.onUnload = function(e) {
  if (!this.unloadSignal_.get()) {
    var type;
    try {
      type = e.type;
    } catch (e) {
      type = '[error while trying to get event type: ' + e + ']';
    }
    this.streamingService_.synchClose(
        new jstestdriver.Response(
            jstestdriver.RESPONSE_TYPES.BROWSER_PANIC,
            "Page reloaded unexpectedly during or after " + this.getCommand_() +
            " triggered by " + type,
            this.getBrowserInfo_(),
            false));
  }
};
/*
 * Copyright 2010 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


/**
 * Resets the javascript state by reloading or replacing current window.
 * @param {window.location} location The location object.
 * @param {jstestdriver.Signal} signal Signals that the window will be reloaded.
 * @param {function():Number} now Returns the current time in ms.
 */
jstestdriver.ResetCommand = function(location, signal, now) {
  /**
   * @type {window.location}
   * @private
   */
  this.location_ = location;

  /**
   * @type {window.location}
   * @private
   */
  this.signal_ = signal;

  /**
   * @type {function():Number}
   * @private
   */
  this.now_ = now;
};


/**
 * @param {string} loadType method of loading: "load" or "preload", default: "preload"
 * @param {string} testCaseId id of the test case to be run.
 */
jstestdriver.ResetCommand.prototype.reset = function(args) {
  this.signal_.set(true);
  var loadType = args[0] ? args[0] : 'preload';
  var testCaseId = args[1];
  if (!testCaseId) {
    loadType = 'load'
  }

  var now = this.now_();
  var hostPrefixPageAndPath = this.location_.href.match(/^(.*)\/(slave|runner|bcr)\/(.*)/);
  var hostAndPrefix = hostPrefixPageAndPath[1];
  var page = hostPrefixPageAndPath[2];
  var urlParts = hostPrefixPageAndPath[3].split('/');
  var newUrlParts = [hostAndPrefix, page];
  for (var i = 0; urlParts[i]; i++) {
    if (urlParts[i]=='testcase_id' ||
            urlParts[i]=='refresh' ||
            urlParts[i] == 'load_type') {
      i++; //skip the value
      continue;
    }
    newUrlParts.push(urlParts[i]);
  }
  newUrlParts.push('refresh');
  newUrlParts.push(now);
  newUrlParts.push('load_type');
  newUrlParts.push(loadType);
  if (testCaseId) {
    newUrlParts.push('testcase_id');
    newUrlParts.push(testCaseId);
  }
  var newUrl = newUrlParts.join('/');
  jstestdriver.log('Replacing ' + newUrl);
  this.location_.replace(newUrl);
};
/*
 * Copyright 2010 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

/**
 * A command that does nothing but contact the server and return a response.
 * Used to retrieve new commands from the server.
 * 
 * @constructor
 * 
 * @author corbinrsmith@gmail.com (Cory Smith)
 */
jstestdriver.NoopCommand = function(streamStop, getBrowserInfo) {
  /**
   * Function used to contact the server.
   * @type {function(jstestdriver.Response):null}
   */
  this.streamStop_ = streamStop;
  /**
   * Function used to retrieve the jstestdriver.BrowserInfo.
   * @type {function():jstestdriver.BrowserInfo}
   */
  this.streamStop_ = streamStop;
  this.getBrowserInfo_ = getBrowserInfo;
};

jstestdriver.NoopCommand.prototype.sendNoop = function() {
  
  this.streamStop_(
      new jstestdriver.Response(
          jstestdriver.RESPONSE_TYPES.NOOP,
          '{}',
          this.getBrowserInfo_()));
}

/*
 * Copyright 2010 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
/**
 * @fileoverview A series of constants to correlate to the type of responses
 * between the browser and the server.
 * 
 * See com.google.jstestdriver.Response.GSON_TYPES.
 * @author corbinrsmith@gmail.com (Cory Smith)
 */

/**
 * @enum {string}
 */
jstestdriver.RESPONSE_TYPES = {
  FILE_LOAD_RESULT: 'FILE_LOAD_RESULT',
  REGISTER_RESULT: 'REGISTER_RESULT',
  TEST_RESULT: 'TEST_RESULT',
  TEST_QUERY_RESULT: 'TEST_QUERY_RESULT',
  RESET_RESULT: 'RESET_RESULT',
  COMMAND_RESULT: 'COMMAND_RESULT',
  BROWSER_READY: 'BROWSER_READY',
  BROWSER_PANIC: 'BROWSER_PANIC',
  NOOP: 'NOOP',
  LOG: 'LOG'
};


/**
 * Contains the state of a response.
 * This is the javascript twin to com.google.jstestdriver.Response.
 * 
 * @param {jstestdriver.RESPONSE_TYPES} type The type of the response.
 * @param {String} response The serialized contents of the response.
 * @param {jstestdriver.BrowserInfo} browser The browser information. 
 * @param {Boolean} start Is this the first response from the browser.
 * @constructor
 */
jstestdriver.Response = function(type, response, browser, start) {
  this.type = type;
  this.response = response;
  this.browser = browser;
  if (start) {
    this.start = true;
  }
};


jstestdriver.Response.prototype.toString = function() {
  return 'Response(\nresponse=' + this.response + ',\ntype' + this.type + ',\n browser=' + this.browser + ')';
};


/**
 * @param {String} done Indicates if this is the last streamed message.
 * @param {jstestdriver.Response} response The response.
 * @constructor
 */
jstestdriver.CommandResponse = function (done, response) {
  this.done = done;
  this.response = response;
};


/**
 * Represents the information about the browser.
 * @param {Number} id The unique id of this browser.
 * @constructor
 */
jstestdriver.BrowserInfo = function(id) {
  this.id = id;
};
/*
 * Copyright 2009 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
function expectAsserts(count) {
  jstestdriver.expectedAssertCount = count;
}


var fail = function fail(msg) {
  var err = new Error(msg);
  err.name = 'AssertError';

  if (!err.message) {
    err.message = msg;
  }

  throw err;
};


function isBoolean_(bool) {
  if (typeof(bool) != 'boolean') {
    fail('Not a boolean: ' + prettyPrintEntity_(bool));
  }
}


var isElement_ = (function () {
  var div = document.createElement('div');

  function isNode(obj) {
    try {
      div.appendChild(obj);
      div.removeChild(obj);
    } catch (e) {
      return false;
    }

    return true;
  }

  return function isElement(obj) {
    return obj && obj.nodeType === 1 && isNode(obj);
  };
}());


function formatElement_(el) {
  var tagName;

  try {
    tagName = el.tagName.toLowerCase();
    var str = '<' + tagName;
    var attrs = el.attributes, attribute;

    for (var i = 0, l = attrs.length; i < l; i++) {
      attribute = attrs.item(i);

      if (!!attribute.nodeValue) {
        str += ' ' + attribute.nodeName + '=\"' + attribute.nodeValue + '\"';
      }
    }

    return str + '>...</' + tagName + '>';
  } catch (e) {
    return '[Element]' + (!!tagName ? ' ' + tagName : '');
  }
}


function prettyPrintEntity_(entity) {
  if (isElement_(entity)) {
    return formatElement_(entity);
  }

  var str;

  if (typeof entity == 'function') {
    try {
      str = entity.toString().match(/(function [^\(]+\(\))/)[1];
    } catch (e) {}

    return str || '[function]';
  }

  try {
    str = JSON.stringify(entity);
  } catch (e) {}

  return str || '[' + typeof entity + ']';
}


function argsWithOptionalMsg_(args, length) {
  var copyOfArgs = [];
  // make copy because it's bad practice to change a passed in mutable
  // And to ensure we aren't working with an arguments array. IE gets bitchy.
  for(var i = 0; i < args.length; i++) {
    copyOfArgs.push(args[i]);
  }
  var min = length - 1;

  if (args.length < min) {
    fail('expected at least ' + min + ' arguments, got ' + args.length);
  } else if (args.length == length) {
    copyOfArgs[0] += ' ';
  } else {
    copyOfArgs.unshift('');
  }
  return copyOfArgs;
}


function assertTrue(msg, actual) {
  var args = argsWithOptionalMsg_(arguments, 2);
  jstestdriver.assertCount++;

  isBoolean_(args[1]);
  if (args[1] != true) {
    fail(args[0] + 'expected true but was ' + prettyPrintEntity_(args[1]));
  }
  return true;
}


function assertFalse(msg, actual) {
  var args = argsWithOptionalMsg_(arguments, 2);
  jstestdriver.assertCount++;

  isBoolean_(args[1]);
  if (args[1] != false) {
    fail(args[0] + 'expected false but was ' + prettyPrintEntity_(args[1]));
  }
  return true;
}


function assertEquals(msg, expected, actual) {
  var args = argsWithOptionalMsg_(arguments, 3);
  jstestdriver.assertCount++;
  msg = args[0];
  expected = args[1];
  actual = args[2];

  if (!compare_(expected, actual)) {
    fail(msg + 'expected ' + prettyPrintEntity_(expected) + ' but was ' +
        prettyPrintEntity_(actual) + '');
  }
  return true;
}


function compare_(expected, actual) {
  if (expected === actual) {
    return true;
  }

  if (typeof expected != 'object' ||
      typeof actual != 'object' ||
      !expected || !actual) {
    return expected == actual;
  }

  if (isElement_(expected) || isElement_(actual)) {
    return false;
  }

  var key = null;
  var actualLength   = 0;
  var expectedLength = 0;

  try {
    // If an array is expected the length of actual should be simple to
    // determine. If it is not it is undefined.
    if (jstestdriver.jQuery.isArray(actual)) {
      actualLength = actual.length;
    } else {
      // In case it is an object it is a little bit more complicated to
      // get the length.
      for (key in actual) {
        if (actual.hasOwnProperty(key)) {
          ++actualLength;
        }
      }
    }

    // Arguments object
    if (actualLength == 0 && typeof actual.length == 'number') {
      actualLength = actual.length;

      for (var i = 0, l = actualLength; i < l; i++) {
        if (!(i in actual)) {
          actualLength = 0;
          break;
        }
      }
    }

    for (key in expected) {
      if (expected.hasOwnProperty(key)) {
        if (!compare_(expected[key], actual[key])) {
          return false;
        }

        ++expectedLength;
      }
    }

    if (expectedLength != actualLength) {
      return false;
    }

    return expectedLength == 0 ? expected.toString() == actual.toString() : true;
  } catch (e) {
    return false;
  }
}


function assertNotEquals(msg, expected, actual) {
  try {
    assertEquals.apply(this, arguments);
  } catch (e) {
    if (e.name == 'AssertError') {
      return true;
    }

    throw e;
  }

  var args = argsWithOptionalMsg_(arguments, 3);

  fail(args[0] + 'expected ' + prettyPrintEntity_(args[1]) +
      ' not to be equal to ' + prettyPrintEntity_(args[2]));
}


function assertSame(msg, expected, actual) {
  var args = argsWithOptionalMsg_(arguments, 3);
  jstestdriver.assertCount++;

  if (!isSame_(args[2], args[1])) {
    fail(args[0] + 'expected ' + prettyPrintEntity_(args[1]) + ' but was ' +
        prettyPrintEntity_(args[2]));
  }
  return true;
}


function assertNotSame(msg, expected, actual) {
  var args = argsWithOptionalMsg_(arguments, 3);
  jstestdriver.assertCount++;

  if (isSame_(args[2], args[1])) {
    fail(args[0] + 'expected not same as ' + prettyPrintEntity_(args[1]) +
        ' but was ' + prettyPrintEntity_(args[2]));
  }
  return true;
}


function isSame_(expected, actual) {
  return actual === expected;
}


function assertNull(msg, actual) {
  var args = argsWithOptionalMsg_(arguments, 2);
  jstestdriver.assertCount++;

  if (args[1] !== null) {
    fail(args[0] + 'expected null but was ' + prettyPrintEntity_(args[1]));
  }
  return true;
}


function assertNotNull(msg, actual) {
  var args = argsWithOptionalMsg_(arguments, 2);
  jstestdriver.assertCount++;

  if (args[1] === null) {
    fail(args[0] + 'expected not null but was null');
  }

  return true;
}


function assertUndefined(msg, actual) {
  var args = argsWithOptionalMsg_(arguments, 2);
  jstestdriver.assertCount++;

  if (typeof args[1] != 'undefined') {
    fail(args[2] + 'expected undefined but was ' + prettyPrintEntity_(args[1]));
  }
  return true;
}


function assertNotUndefined(msg, actual) {
  var args = argsWithOptionalMsg_(arguments, 2);
  jstestdriver.assertCount++;

  if (typeof args[1] == 'undefined') {
    fail(args[0] + 'expected not undefined but was undefined');
  }
  return true;
}


function assertNaN(msg, actual) {
  var args = argsWithOptionalMsg_(arguments, 2);
  jstestdriver.assertCount++;

  if (!isNaN(args[1])) {
    fail(args[0] + 'expected to be NaN but was ' + args[1]);
  }

  return true;
}


function assertNotNaN(msg, actual) {
  var args = argsWithOptionalMsg_(arguments, 2);
  jstestdriver.assertCount++;

  if (isNaN(args[1])) {
    fail(args[0] + 'expected not to be NaN');
  }

  return true;
}


function assertException(msg, callback, error) {
  if (arguments.length == 1) {
    // assertThrows(callback)
    callback = msg;
    msg = '';
  } else if (arguments.length == 2) {
    if (typeof callback != 'function') {
      // assertThrows(callback, type)
      error = callback;
      callback = msg;
      msg = '';
    } else {
      // assertThrows(msg, callback)
      msg += ' ';
    }
  } else {
    // assertThrows(msg, callback, type)
    msg += ' ';
  }

  jstestdriver.assertCount++;

  try {
    callback();
  } catch(e) {
    if (e.name == 'AssertError') {
      throw e;
    }

    if (error && e.name != error) {
      fail(msg + 'expected to throw ' + error + ' but threw ' + e.name);
    }

    return true;
  }

  fail(msg + 'expected to throw exception');
}


function assertNoException(msg, callback) {
  var args = argsWithOptionalMsg_(arguments, 2);
  jstestdriver.assertCount++;

  try {
    args[1]();
  } catch(e) {
    fail(args[0] + 'expected not to throw exception, but threw ' + e.name +
        ' (' + e.message + ')');
  }
}


function assertArray(msg, actual) {
  var args = argsWithOptionalMsg_(arguments, 2);
  jstestdriver.assertCount++;

  if (!jstestdriver.jQuery.isArray(args[1])) {
    fail(args[0] + 'expected to be array, but was ' +
        prettyPrintEntity_(args[1]));
  }
}


function assertTypeOf(msg, expected, value) {
  var args = argsWithOptionalMsg_(arguments, 3);
  jstestdriver.assertCount++;
  var actual = typeof args[2];

  if (actual != args[1]) {
    fail(args[0] + 'expected to be ' + args[1] + ' but was ' + actual);
  }

  return true;
}


function assertBoolean(msg, actual) {
  var args = argsWithOptionalMsg_(arguments, 2);
  return assertTypeOf(args[0], 'boolean', args[1]);
}


function assertFunction(msg, actual) {
  var args = argsWithOptionalMsg_(arguments, 2);
  return assertTypeOf(args[0], 'function', args[1]);
}


function assertObject(msg, actual) {
  var args = argsWithOptionalMsg_(arguments, 2);
  return assertTypeOf(args[0], 'object', args[1]);
}


function assertNumber(msg, actual) {
  var args = argsWithOptionalMsg_(arguments, 2);
  return assertTypeOf(args[0], 'number', args[1]);
}


function assertString(msg, actual) {
  var args = argsWithOptionalMsg_(arguments, 2);
  return assertTypeOf(args[0], 'string', args[1]);
}


function assertMatch(msg, regexp, actual) {
  var args = argsWithOptionalMsg_(arguments, 3);
  var isUndef = typeof args[2] == 'undefined';
  jstestdriver.assertCount++;
  var _undef;

  if (isUndef || !args[1].test(args[2])) {
    actual = (isUndef ? _undef : prettyPrintEntity_(args[2]));
    fail(args[0] + 'expected ' + actual + ' to match ' + args[1]);
  }

  return true;
}


function assertNoMatch(msg, regexp, actual) {
  var args = argsWithOptionalMsg_(arguments, 3);
  jstestdriver.assertCount++;

  if (args[1].test(args[2])) {
    fail(args[0] + 'expected ' + prettyPrintEntity_(args[2]) +
        ' not to match ' + args[1]);
  }

  return true;
}


function assertTagName(msg, tagName, element) {
  var args = argsWithOptionalMsg_(arguments, 3);
  var actual = args[2] && args[2].tagName;

  if (String(actual).toUpperCase() != args[1].toUpperCase()) {
    fail(args[0] + 'expected tagName to be ' + args[1] + ' but was ' + actual);
  }
  return true;
}


function assertClassName(msg, className, element) {
  var args = argsWithOptionalMsg_(arguments, 3);
  var actual = args[2] && args[2].className;
  var regexp = new RegExp('(^|\\s)' + args[1] + '(\\s|$)');

  try {
    assertMatch(args[0], regexp, actual);
  } catch (e) {
    actual = prettyPrintEntity_(actual);
    fail(args[0] + 'expected class name to include ' +
        prettyPrintEntity_(args[1]) + ' but was ' + actual);
  }

  return true;
}


function assertElementId(msg, id, element) {
  var args = argsWithOptionalMsg_(arguments, 3);
  var actual = args[2] && args[2].id;
  jstestdriver.assertCount++;

  if (actual !== args[1]) {
    fail(args[0] + 'expected id to be ' + args[1] + ' but was ' + actual);
  }

  return true;
}


function assertInstanceOf(msg, constructor, actual) {
  jstestdriver.assertCount++;
  var args = argsWithOptionalMsg_(arguments, 3);
  var pretty = prettyPrintEntity_(args[2]);
  var expected = args[1] && args[1].name || args[1];

  if (args[2] == null) {
    fail(args[0] + 'expected ' + pretty + ' to be instance of ' + expected);
  }

  if (!(Object(args[2]) instanceof args[1])) {
    fail(args[0] + 'expected ' + pretty + ' to be instance of ' + expected);
  }

  return true;
}


function assertNotInstanceOf(msg, constructor, actual) {
  var args = argsWithOptionalMsg_(arguments, 3);
  jstestdriver.assertCount++;

  if (Object(args[2]) instanceof args[1]) {
    var expected = args[1] && args[1].name || args[1];
    var pretty = prettyPrintEntity_(args[2]);
    fail(args[0] + 'expected ' + pretty + ' not to be instance of ' + expected);
  }

  return true;
}

/**
 * Asserts that two doubles, or the elements of two arrays of doubles,
 * are equal to within a positive delta.
 */
function assertEqualsDelta(msg, expected, actual, epsilon) {
  var args = this.argsWithOptionalMsg_(arguments, 4);
  jstestdriver.assertCount++;
  msg = args[0];
  expected = args[1];
  actual = args[2];
  epsilon = args[3];

  if (!compareDelta_(expected, actual, epsilon)) {
    this.fail(msg + 'expected ' + epsilon + ' within ' +
              this.prettyPrintEntity_(expected) +
              ' but was ' + this.prettyPrintEntity_(actual) + '');
  }
  return true;
};

function compareDelta_(expected, actual, epsilon) {
  var compareDouble = function(e,a,d) {
    return Math.abs(e - a) <= d;
  }
  if (expected === actual) {
    return true;
  }

  if (typeof expected == "number" ||
      typeof actual == "number" ||
      !expected || !actual) {
    return compareDouble(expected, actual, epsilon);
  }

  if (isElement_(expected) || isElement_(actual)) {
    return false;
  }

  var key = null;
  var actualLength   = 0;
  var expectedLength = 0;

  try {
    // If an array is expected the length of actual should be simple to
    // determine. If it is not it is undefined.
    if (jstestdriver.jQuery.isArray(actual)) {
      actualLength = actual.length;
    } else {
      // In case it is an object it is a little bit more complicated to
      // get the length.
      for (key in actual) {
        if (actual.hasOwnProperty(key)) {
          ++actualLength;
        }
      }
    }

    // Arguments object
    if (actualLength == 0 && typeof actual.length == "number") {
      actualLength = actual.length;

      for (var i = 0, l = actualLength; i < l; i++) {
        if (!(i in actual)) {
          actualLength = 0;
          break;
        }
      }
    }

    for (key in expected) {
      if (expected.hasOwnProperty(key)) {
        if (!compareDelta_(expected[key], actual[key], epsilon)) {
          return false;
        }

        ++expectedLength;
      }
    }

    if (expectedLength != actualLength) {
      return false;
    }

    return expectedLength == 0 ? expected.toString() == actual.toString() : true;
  } catch (e) {
    return false;
  }
};

var assert = assertTrue;
/*
 * Copyright 2010 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

/**
 * Service for streaming information to the server.
 * @param {string} url The server url.
 * @param {function():Number} now Returns the current time in ms.
 * @param {function(String, Object, function():null)} post Posts to the server.
 * @param {function(String, Object)} synchPost Posts synchronously to the server.
 * @param {function(Function, Number)} The setTimeout for asynch xhrs.
 * @param {jstestdriver.Signal} unloadSignal
 * @constructor
 */
// TODO(corysmith): Separate the state from the service.
jstestdriver.StreamingService = function(url, now, post, synchPost, setTimeout, unloadSignal) {
  this.url_ = url;
  this.now_ = now;
  this.post_ = post;
  this.activeResponses_ = {};
  this.finishedResponses_ = {};
  this.completeFinalResponse = null;
  this.synchPost_ = synchPost;
  this.setTimeout_ = setTimeout;
  this.unloadSignal_ = unloadSignal;
};


jstestdriver.StreamingService.prototype.synchClose = function(response) {
  var data = new jstestdriver.CommandResponse(true, response);
  this.synchPost_(this.url_, data);
  this.unloadSignal_.set(true);
};


jstestdriver.StreamingService.prototype.stream = function(response, callback) {
  this.streamResponse(response, false, callback);
};


jstestdriver.StreamingService.prototype.streamResponse = function(response,
                                                                  done,
                                                                  callback) {
  var data = new jstestdriver.CommandResponse(done, response);
  if (!done && response != null) {
    data.responseId = this.now_();
    // no ack expected after the final response, and no ack expected on no response
    this.activeResponses_[data.responseId] = data;
  }
  var context = this;
  this.setTimeout_(function() {
    context.post_(context.url_, data, callback, 'text/plain');
  }, 1);
};


/**
 * Callback command for the stream acknowledge to a streamed responses.
 * @param {Array.<string>} received A list of received ids for the currently open stream.
 */
jstestdriver.StreamingService.prototype.streamAcknowledged = function(received) {
  for (var i = 0; received && received[i]; i++) {
    if (this.activeResponses_[received[i]]) {
      // cut down on memory goof ups....
      this.activeResponses_[received[i]] = null;
      delete this.activeResponses_[received[i]];
      this.finishedResponses_[received[i]] = true;
    }
  }

  // TODO(corysmith): This causes a extra traffic on close, as the service tries
  // to verify the received responses. Setup a timeout to reduce the queries to 
  // the server.
  if (this.completeFinalResponse) {
    this.completeFinalResponse()
  }
};


/**
 * Closes the current streaming session, sending the final response after all
 * other Responses are finished.
 * @param {!jstestdriver.Response} finalResponse The final response to send.
 * @param {!Function} callback The callback when the post is finished.
 */
jstestdriver.StreamingService.prototype.close =
    function(finalResponse, callback) {
  var context = this;
  this.completeFinalResponse = function() {
    if (context.hasOpenResponses()) {
      // have to query again, because these may be lost responses from a debug session.
      context.streamResponse(null, false, callback);
    } else {
      context.completeFinalResponse = null;
      context.activeResponses_ = {};
      context.finishedResponses_ = {};
      context.streamResponse(finalResponse, true, callback);
      this.unloadSignal_.set(true);
    }
  };

  this.completeFinalResponse();
};


/**
 * Indicates if there are currently open streamed response.
 * @return {Boolean} True for open responses, otherwise false.
 */
jstestdriver.StreamingService.prototype.hasOpenResponses = function() {
  for (var responseId in this.activeResponses_) {
    if (this.activeResponses_.hasOwnProperty(responseId)) {
      return true;
    }
  }
  return false;
};
/*
 * Copyright 2009 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

/**
 * @param fileSrc
 * @param timestamp
 * @param basePath
 * @constructor
 */
jstestdriver.FileSource = function(fileSrc, timestamp, basePath) {
  this.fileSrc = fileSrc;
  this.timestamp = timestamp;
  this.basePath = basePath;
};
/*
 * Copyright 2009 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

/**
 * @param file
 * @param success
 * @param message
 * @param elapsed
 * @constructor
 */
jstestdriver.FileResult = function(file, success, message, elapsed) {
  this.file = file;
  this.success = success;
  this.message = message;
  this.elapsed = elapsed
};

jstestdriver.FileResult.prototype.toString = function() {
  return ["FileResult(", this.file.fileSrc, this.success, this.message, ")"].join("");
}
/*
 * Copyright 2009 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
/**
 * The PluginRegistrar allows developers to load their own plugins to perform certain actions.
 * A plugin must define methods with specific names in order for it to be used.
 * A plugin must define a name, by defining a property name.
 * 
 * A simple plugin supporting the loadSource method for example could look as follow:
 * 
 * var myPlugin = {
 *   name: 'myPlugin',
 *   loadSource: function(file, onSourceLoad) {
 *     // do some cool stuff
 *   }
 * };
 * 
 * To then register it one needs to call:
 * 
 * jstestdriver.pluginRegistrar.register(myPlugin);
 * 
 * The list of supported methods is:
 * - loadSource
 * - runTestConfiguration
 * 
 * For more information regarding the supported method just read the documentation for the method
 * in this class.
 * @constructor
 */
jstestdriver.PluginRegistrar = function() {
  this.plugins_ = [];
};


jstestdriver.PluginRegistrar.PROCESS_TEST_RESULT = 'processTestResult';


jstestdriver.PluginRegistrar.LOAD_SOURCE = 'loadSource';


jstestdriver.PluginRegistrar.RUN_TEST = 'runTestConfiguration';


jstestdriver.PluginRegistrar.IS_FAILURE = 'isFailure';


jstestdriver.PluginRegistrar.GET_TEST_RUN_CONFIGURATIONS = 'getTestRunsConfigurationFor';


jstestdriver.PluginRegistrar.ON_TESTS_START = 'onTestsStart';

jstestdriver.PluginRegistrar.ON_TESTS_FINISH = 'onTestsFinish';


jstestdriver.PluginRegistrar.prototype.register = function(plugin) {
  if (!plugin.name) {
    throw new Error("Plugins must define a name.");
  }
  var index = this.getIndexOfPlugin_(plugin.name);
  var howMany = 1;

  if (index == -1) {
    index = this.plugins_.length - 1;
    howMany = 0;
  }
  this.plugins_.splice(index, howMany, plugin);
};


jstestdriver.PluginRegistrar.prototype.unregister = function(plugin) {
  var index = this.getIndexOfPlugin_(plugin.name);

  if (index != -1) {
    this.plugins_.splice(index, 1);
  }
};


jstestdriver.PluginRegistrar.prototype.getPlugin = function(name) {
  var index = this.getIndexOfPlugin_(name);

  return index != -1 ? this.plugins_[index] : null;
};


jstestdriver.PluginRegistrar.prototype.getNumberOfRegisteredPlugins = function() {
  return this.plugins_.length;
};


jstestdriver.PluginRegistrar.prototype.dispatch_ = function(method, parameters) {
  var size = this.plugins_.length;

  for (var i = 0; i < size; i++) {
    var plugin = this.plugins_[i];

    if (plugin[method]) {
      if (plugin[method].apply(plugin, parameters)) {
        return true;
      }
    }
  }
  return false;
};


jstestdriver.PluginRegistrar.prototype.getIndexOfPlugin_ = function(name) {
  var size = this.plugins_.length;

  for (var i = 0; i < size; i++) {
    var plugin = this.plugins_[i];

    if (plugin.name == name) {
      return i;
    }
  }
  return -1;
};


/**
 * loadSource
 * 
 * By defining the method loadSource a plugin can implement its own way of loading certain types of
 * files.
 * 
 * loadSource takes 2 parameters:
 *  - file: A file object defined as -> { fileSrc: string, timestamp: number, basePath: string }
 *    fileSrc is the name of the file
 *    timestamp is the last modified date of the file
 *    basePath is defined if the file is a URL and the URL has been rewritten
 *  - onSourceLoad: A callback that must be called once the file has been loaded the callback takes
 *    1 parameter defined as -> { file: file object, success: boolean, message: string }
 *    file: A file object
 *    success: a boolean, true if the file was loaded successfully, false otherwise
 *    message: an error message if the file wasn't loaded properly
 *  
 *  loadSource must return a boolean:
 *  - true if the plugin knows how to and loaded the file
 *  - false if the plugin doesn't know how to load the file
 *  
 *  A simple loadSource plugin would look like:
 *  
 *  var myPlugin = {
 *    name: 'myPlugin',
 *    loadSource: function(file, onSourceLoad) {
 *      // load the file
 *      return true;
 *    }
 *  }
 */
jstestdriver.PluginRegistrar.prototype.loadSource = function(file, onSourceLoad) {
  this.dispatch_(jstestdriver.PluginRegistrar.LOAD_SOURCE, arguments);
};


/**
 * runTestConfiguration
 * 
 * By defining the method runTestConfiguration a plugin can implement its own way of running
 * certain types of tests.
 * 
 * runTestConfiguration takes 3 parameters:
 * - testRunConfiguration: A jstestdriver.TestRunConfiguration object.
 * - onTestDone: A callback that needs to be call when a test ran so that the results are properly
 *   sent back to the client. It takes 1 parameter a jstestdriver.TestResult.
 * - onTestRunConfigurationComplete: A callback that needs to be call when everything ran. It takes
 *   no parameter.
 *   
 * runTestConfiguration must return a boolean:
 * - true if the plugin can run the tests
 * - false if the plugin can not run the tests
 * 
 * A simple runTestConfiguration plugin would look like:
 * 
 * var myPlugin = {
 *   name: 'myPlugin',
 *   runTestConfiguration: function(testRunConfiguration, onTestDone,
 *       onTestRunConfigurationComplete) {
 *     // run the tests
 *     return true;
 *   }
 * }
 * 
 */
jstestdriver.PluginRegistrar.prototype.runTestConfiguration = function(testRunConfiguration,
    onTestDone, onTestRunConfigurationComplete) {
  this.dispatch_(jstestdriver.PluginRegistrar.RUN_TEST, arguments);
};


/**
 * processTestResult
 * 
 * By defining the method processTestResult a plugin can pass extra meta data about a test back to
 * the server.
 * 
 * processTestResult takes 1 parameter:
 * - testResult: The TestResult of the most recently run test.
 *              
 *   
 * processTestResult must return a boolean:
 * - true to allow other plugins to process the test result
 * - false if not further processing should be allowed.
 * 
 * A simple processTestResult plugin would look like:
 * 
 * var myPlugin = {
 *   name: 'myPlugin',
 *   processTestResult: function(testResult) {
 *     testResult.data.foo = 'bar';
 *     return true;
 *   }
 * }
 * 
 */
jstestdriver.PluginRegistrar.prototype.processTestResult = function(testResult) {
  this.dispatch_(jstestdriver.PluginRegistrar.PROCESS_TEST_RESULT, arguments);
};


/**
 * isFailure
 * 
 * By defining the method isFailure a plugin will determine if an exception thrown by an assertion
 * framework is considered a failure by the assertion framework.
 * 
 * isFailure takes 1 parameter:
 * - exception: The exception thrown by the test
 *              
 *   
 * processTestResult must return a boolean:
 * - true if the exception is considered a failure
 * - false if the exception is not considered a failure
 * 
 * A simple isFailure plugin would look like:
 * 
 * var myPlugin = {
 *   name: 'myPlugin',
 *   isFailure: function(exception) {
 *     return exception.name == 'AssertError';
 *   }
 * }
 * 
 */
jstestdriver.PluginRegistrar.prototype.isFailure = function(exception) {
  return this.dispatch_(jstestdriver.PluginRegistrar.IS_FAILURE, arguments);
};


/**
 * getTestRunsConfigurationFor
 * 
 * By defining the method getTestRunsConfigurationFor a plugin will be able to
 * modify the process in which a TestCaseInfo provides a TestRunConfiguration from an expression
 * such as fooCase.testBar.
 * 
 * getTestRunsConfigurationFor takes 3 parameters:
 * - testCaseInfos: The array of loaded TestCaseInfos.
 * - expressions: The array of expressions used to determine the TestRunConfiguration.
 * - testRunsConfiguration: An array to add test case TestRunConfigurations to.
 * 
 */
jstestdriver.PluginRegistrar.prototype.getTestRunsConfigurationFor =
    function(testCaseInfos, expressions, testRunsConfiguration) {
  return this.dispatch_(jstestdriver.PluginRegistrar.GET_TEST_RUN_CONFIGURATIONS, arguments);
};


/**
 * onTestsStart
 * 
 * A setup hook called before all tests are run.
 * 
 */
jstestdriver.PluginRegistrar.prototype.onTestsStart = function() {
  return this.dispatch_(jstestdriver.PluginRegistrar.ON_TESTS_START, []);
};


/**
 * onTestsFinish
 * 
 * A tear down hook called after all tests are run.
 * 
 */
jstestdriver.PluginRegistrar.prototype.onTestsFinish = function() {
  return this.dispatch_(jstestdriver.PluginRegistrar.ON_TESTS_FINISH, []);
};
/*
 * Copyright 2009 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
jstestdriver.LibLoader = function(files, dom, getScript) {
  this.files_ = files;
  this.dom_ = dom;
  this.getScript_ = getScript;
  this.remainingLibToLoad_ = this.files_.length;
  this.boundOnLibLoaded_ = jstestdriver.bind(this, this.onLibLoaded);
  this.savedDocumentWrite_ = dom.write;
  this.currentFile_ = 0;
};


jstestdriver.LibLoader.prototype.load = function(onAllLibLoaded, data) {
  if (this.files_.length == 0) {
    onAllLibLoaded(data);
  } else {
    this.dom_.write = function() {};
    this.onAllLibLoaded_ = onAllLibLoaded;
    this.data_ = data;
    this.getScript_(this.dom_, this.files_[this.currentFile_++], this.boundOnLibLoaded_);
  }
};


jstestdriver.LibLoader.prototype.onLibLoaded = function() {
  if (--this.remainingLibToLoad_ == 0) {
    var onAllLibLoaded = this.onAllLibLoaded_;
    var data = this.data_;

    this.onAllLibLoaded_ = null;
    this.data_ = null;
    this.dom_.write = this.savedDocumentWrite_;
    onAllLibLoaded(data);
  } else {
    this.getScript_(this.dom_, this.files_[this.currentFile_++], this.boundOnLibLoaded_);
  }
};
/*
 * Copyright 2009 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
jstestdriver.FileLoader = function(pluginRegistrar, onAllFilesLoaded) {
  this.pluginRegistrar_ = pluginRegistrar;
  this.onAllFilesLoaded_ = onAllFilesLoaded;
  this.boundOnFileLoaded = jstestdriver.bind(this, this.onFileLoaded_);
  this.boundLoadFile_ = jstestdriver.bind(this, this.onLoadFile_);
  this.loadedFiles_ = [];
};


/**
 * Load files.
 * 
 * files is an array containing jstestdriver.FileSource objects.
 */
jstestdriver.FileLoader.prototype.load = function(files) {
  this.files_ = files;
  if (this.files_.length > 0) {
    this.loadFile_(this.files_.shift());
  } else {
    this.onAllFilesLoaded_({ loadedFiles: [] });
  }
};


jstestdriver.FileLoader.prototype.loadFile_ = function(file) {
  this.pluginRegistrar_.loadSource(file, this.boundOnFileLoaded);
};

/**
 * This method is called once a file has been loaded. It then either load the next file or if none
 * are left sends back the list of loaded files to the server.
 * 
 * @param {Object} file A jstestdriver.FileResult object
 */
jstestdriver.FileLoader.prototype.onFileLoaded_ = function(fileLoaded) {
  this.loadedFiles_.push(fileLoaded);
  if (this.files_.length == 0) {
    this.onAllFilesLoaded_({
      loadedFiles: this.loadedFiles_
    });
  } else {
    this.loadFile_(this.files_.shift());
  }
};
/*
 * Copyright 2011 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

goog.provide('jstestdriver.TestRunFilter');

goog.require('jstestdriver');

/**
 * @constructor
 */
jstestdriver.TestRunFilter = function(testCaseInfo) {
  this.testCaseInfo_ = testCaseInfo;
};


jstestdriver.TestRunFilter.prototype.getDefaultTestRunConfiguration = function() {
  return this.createTestRunConfiguration_(this.testCaseInfo_.getTestNames());
};


/**
 * Includes and excludes tests based on the given expressions. Expressions are
 * of the form:
 *
 * Expr:
 *   "all" | RegExp | -RegExp
 *
 * RegExp:
 *   A JavaScript regular expression without the quoting characters.
 *
 * @param expressions {Array.<string>} The expression strings.
 */
jstestdriver.TestRunFilter.prototype.getTestRunConfigurationFor = function(expressions) {
  var positiveExpressions = this.filter_(expressions, this.regexMatcher_(/^[^-].*/));
  if (positiveExpressions.length < 1) {
    positiveExpressions.push('all');
  }
  var negativeExpressions = this.filter_(expressions, this.regexMatcher_(/^-.*/));
  var testMethodMap = this.buildTestMethodMap_();
  var excludedTestIds = this.getExcludedTestIds_(testMethodMap, negativeExpressions);
  var matchedTests = this.getMatchedTests_(testMethodMap, positiveExpressions, excludedTestIds);
  return matchedTests.length > 0 ? this.createTestRunConfiguration_(matchedTests) : null;
};


jstestdriver.TestRunFilter.prototype.createTestRunConfiguration_ = function(tests) {
  return new jstestdriver.TestRunConfiguration(this.testCaseInfo_, tests);
};


/**
 * @param regex {RegExp} The regular expression.
 * @return {function(string): boolean} A function that tests the given RegExp
 *     against the function's expression argument.
 * @private
 */
jstestdriver.TestRunFilter.prototype.regexMatcher_ = function(regex) {
  return function(expression) {
    return regex.test(expression);
  };
};


/**
 * @return {Object.<string, string>} A map from test method id to test method
 *     name, where a test method id is of the form TestCaseName#testMethodName.
 * @private
 */
jstestdriver.TestRunFilter.prototype.buildTestMethodMap_ = function() {
  var testMethodMap = {};
  var testMethods = this.testCaseInfo_.getTestNames();
  var testMethodsLength = testMethods.length;
  for (var i = 0; i < testMethodsLength; ++i) {
    var methodName = testMethods[i];
    if (this.isTestMethod_(methodName)) {
      testMethodMap[this.buildTestMethodId_(methodName)] = methodName;
    }
  }
  return testMethodMap;
};


/**
 * @param methodName {string} A name of a method of the test class.
 * @return {boolean} True if the method name begins with 'test'.
 * @private
 */
jstestdriver.TestRunFilter.prototype.isTestMethod_ = function(methodName) {
  return /^test.*/.test(methodName);
};


/**
 * @param testMethod {string} The name of the test method.
 * @return {string} A test method id which is of the form
 *     TestCaseName#testMethodName.
 * @private
 */
jstestdriver.TestRunFilter.prototype.buildTestMethodId_ = function(testMethod) {
  return this.testCaseInfo_.getTestCaseName() + '#' + testMethod;
};


/**
 * @param expressions {Array.<string>} The expression strings.
 * @param condition {function(string): boolean} A condition that applies to the
 *     expression strings.
 * @return {Array.<string>} Any expression strings for which the condition holds.
 * @private
 */
jstestdriver.TestRunFilter.prototype.filter_ = function(expressions, condition) {
  var result = [];
  for (var i = 0; i < expressions.length; ++i) {
    if (condition(expressions[i])) {
      result.push(expressions[i]);
    }
  }
  return result;
};


/**
 * @param testMethodMap {Object.<string, string>} A map from test method id to
 *     test method name.
 * @param negativeExpressions {Array.<string>} The negative expression strings.
 * @return {Object.<string, boolean>} A map from test method id to boolean that
 *     signals whether a test method should be excluded from this test run.
 * @private
 */
jstestdriver.TestRunFilter.prototype.getExcludedTestIds_ = function(
    testMethodMap, negativeExpressions) {
  var excludedTestIds = {};
  for (var i = 0; i < negativeExpressions.length; ++i) {
    var expr = negativeExpressions[i].substring(1);
    var pattern = new RegExp(expr);
    for (var testMethodId in testMethodMap) {
      if (pattern.test(testMethodId)) {
        excludedTestIds[testMethodId] = true;
      }
    }
  }
  return excludedTestIds;
};

/**
 * @param testMethodMap {Object.<string, string>} A map from test method id to
 *     test method name.
 * @param positiveExpressions {Array.<string>} The positive expression strings.
 * @param excludedTestIds {Object.<string, boolean>} A map from test method id to
 *     boolean that signals whether a test method should be excluded from this
 *     test run.
 * @return {Array.<string>} A list of test method names for test methods that
 *     should be run.
 * @private
 */
jstestdriver.TestRunFilter.prototype.getMatchedTests_ = function(
    testMethodMap, positiveExpressions, excludedTestIds) {
  var matchedTests = [];
  for (var i = 0; i < positiveExpressions.length; i++) {
    var expr = positiveExpressions[i];

    if (expr == 'all') {
      expr = '.*';
    }

    var pattern = new RegExp(expr);

    for (var testMethodId in testMethodMap) {
      if (pattern.test(testMethodId) && !excludedTestIds[testMethodId]) {
        matchedTests.push(testMethodMap[testMethodId]);
      }
    }
  }
  return matchedTests;
};
/*
 * Copyright 2009 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

goog.provide('jstestdriver.TestCaseInfo');

goog.require('jstestdriver');
goog.require('jstestdriver.TestRunFilter');

/**
 * @param {string} testCaseName
 * @param {Function} template
 * @param {string} opt_type
 * @param {string} opt_fileName
 * @constructor
 */
jstestdriver.TestCaseInfo = function(testCaseName,
                                     template,
                                     opt_type,
                                     opt_fileName) {

  this.testCaseName_ = testCaseName;
  this.template_ = template;
  this.type_ = opt_type || jstestdriver.TestCaseInfo.DEFAULT_TYPE;
  this.fileName_ = opt_fileName || '';
};


jstestdriver.TestCaseInfo.DEFAULT_TYPE = 'default';


jstestdriver.TestCaseInfo.ASYNC_TYPE = 'async';


/**
 * @private
 * @type {string}
 */
jstestdriver.TestCaseInfo.prototype.testCaseName_;


/**
 * @private
 * @type {Function}
 */
jstestdriver.TestCaseInfo.prototype.template_;


/**
 * @private
 * @type {string}
 */
jstestdriver.TestCaseInfo.prototype.type_;


/**
 * @private
 * @type {string}
 */
jstestdriver.TestCaseInfo.prototype.fileName_;


/**
 * @return {string}
 */
jstestdriver.TestCaseInfo.prototype.getType = function() {
  return this.type_;
};


/**
 * @returns {string}
 */
jstestdriver.TestCaseInfo.prototype.getFileName = function() {
  return this.fileName_;
};


/**
 * @param {string} fileName
 */
jstestdriver.TestCaseInfo.prototype.setFileName = function(fileName) {
  this.fileName_ = fileName;
};


/**
 * @returns {string}
 */
jstestdriver.TestCaseInfo.prototype.getTestCaseName = function() {
  return this.testCaseName_;
};


/**
 * @returns {Function}
 */
jstestdriver.TestCaseInfo.prototype.getTemplate = function() {
  return this.template_;
};


/**
 * @returns {Array.<string>}
 */
jstestdriver.TestCaseInfo.prototype.getTestNames = function() {
  var testNames = [];

  for (var property in this.template_.prototype) {
    if (property.indexOf('test') == 0) {
      testNames.push(property);
    }
  }
  return testNames;
};


/**
 * @returns {jstestdriver.TestRunConfiguration}
 */
jstestdriver.TestCaseInfo.prototype.getDefaultTestRunConfiguration = function() {
  return new jstestdriver.TestRunFilter(this).getDefaultTestRunConfiguration();
};


/**
 * Includes and excludes tests based on the given expressions. Expressions are
 * of the form:
 *
 * Expr:
 *   "all" | RegExp | -RegExp
 *
 * RegExp:
 *   A JavaScript regular expression without the quoting characters.
 *
 * @param expressions {Array.<string>} The expression strings.
 */
jstestdriver.TestCaseInfo.prototype.getTestRunConfigurationFor = function(expressions) {
  return new jstestdriver.TestRunFilter(this).getTestRunConfigurationFor(expressions);
};

/**
 * @param {Object} obj
 * @returns {boolean}
 */
jstestdriver.TestCaseInfo.prototype.equals = function(obj) {
  return (!!obj) && typeof obj.getTestCaseName != 'undefined'
      && obj.getTestCaseName() == this.testCaseName_;
};


/**
 * @returns {string}
 */
jstestdriver.TestCaseInfo.prototype.toString = function() {
  return "TestCaseInfo(" +
    this.testCaseName_ +
    "," + this.template_ +
    "," + this.type_ + ")";
};
/*
 * Copyright 2009 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

goog.provide('jstestdriver.TestResult');

goog.require('jstestdriver');


/**
 * @param {string} testCaseName
 * @param {string} testName
 * @param {jstestdriver.TestResult.RESULT} result
 * @param {string} message
 * @param {Array.<string>} log
 * @param {number} time
 * @param {Object.<string, Object>} opt_data A map of arbitrary value pairs
 *     representing test meta data.
 * @param {*} opt_argument An optional argument for a test fragment.
 * @constructor
 */
jstestdriver.TestResult = function(testCaseName,
    testName, result, message, log, time, opt_data, opt_argument) {
  this.testCaseName = testCaseName;
  this.testName = testName;
  this.result = result;
  this.message = message;
  this.log = log;
  this.time = time;
  this.data = opt_data || {};
  this.argument = opt_argument;
};


/**
 * @enum {string}
 */
jstestdriver.TestResult.RESULT = {
  PASSED : 'passed',
  ERROR : 'error',
  FAILED : 'failed'
};
/*
 * Copyright 2009 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

goog.provide('jstestdriver.TestRunConfiguration');

goog.require('jstestdriver');
goog.require('jstestdriver.TestCaseInfo');

/**
 * Represents all of the necessary information to run a test case.
 * @param {jstestdriver.TestCaseInfo} testCaseInfo The test case information, containing
 * @param {Array.<string>} tests The names of all the tests to run.
 * @param {Object.<string, *>=} opt_args The arguments for the tests.
 * @constructor
 */
jstestdriver.TestRunConfiguration = function(testCaseInfo, tests, opt_args) {
  /**
   * @type {jstestdriver.TestCaseInfo}
   * @private
   */
  this.testCaseInfo_ = testCaseInfo;
  /**
   * @type {Array.<string>}
   * @private
   */
  this.tests_ = tests;
  /**
   * @type {Object.<string, *>}
   * @private
   */
  this.arguments_ = opt_args ? opt_args : null;
};


jstestdriver.TestRunConfiguration.prototype.getTestCaseInfo = function() {
  return this.testCaseInfo_;
};


jstestdriver.TestRunConfiguration.prototype.getTests = function() {
  return this.tests_;
};


/**
 * @return {Object.<string, *>} the arguments.
 */
jstestdriver.TestRunConfiguration.prototype.getArguments = function() {
  return this.arguments_;
};
/*
 * Copyright 2009 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

/**
 * Handles the TestCases
 * @constructor
 */
jstestdriver.TestCaseManager = function(pluginRegistrar) {
  this.testCasesInfo_ = [];
  this.fileToTestCaseMap_ = {};
  this.testCaseToFileMap_ = {};
  this.latestTestCaseInfo_ = null;
  this.pluginRegistrar_ = pluginRegistrar;
  this.recentCases_ = [];
};


/**
 * @param {jstestdriver.TestCaseInfo} testCaseInfo The testcase for the manager
 *   to track.
 */
jstestdriver.TestCaseManager.prototype.add = function(testCaseInfo) {
  var index = this.indexOf_(testCaseInfo);
  if (index != -1) {
    throw new Error('duplicate test case names! On ' +
        testCaseInfo + ' and ' + this.testCasesInfo_[index] +
        ' in ' + this.testCasesInfo_[index].getFileName());
  } else {
    this.testCasesInfo_.push(testCaseInfo);
    this.recentCases_.push(testCaseInfo);
  }
};


jstestdriver.TestCaseManager.prototype.updateLatestTestCase = function(filename) {
  if (this.recentCases_.length) {
    this.fileToTestCaseMap_[filename] = this.recentCases_;
    for (var i = 0; this.recentCases_[i]; i++) {
      // TODO(corysmith): find a way to keep the TestCaseInfo invariant.
      this.recentCases_[i].setFileName(filename);
    }
    this.recentCases_ = [];
  }
};


jstestdriver.TestCaseManager.prototype.removeTestCaseForFilename = function(filename) {
  var cases = this.fileToTestCaseMap_[filename] || [];
  this.fileToTestCaseMap_[filename] = null;
  delete this.fileToTestCaseMap_[filename];
  while (cases.length) {
    this.removeTestCase_(this.indexOf_(cases.pop()));
  }
};


jstestdriver.TestCaseManager.prototype.removeTestCase_ = function(index) {
  var testCase = this.testCasesInfo_.splice(index, 1);
};


jstestdriver.TestCaseManager.prototype.indexOf_ = function(testCaseInfo) {
  var size = this.testCasesInfo_.length;

  for (var i = 0; i < size; i++) {
    var currentTestCaseInfo = this.testCasesInfo_[i];

    if (currentTestCaseInfo.equals(testCaseInfo)) {
      return i;
    }
  }
  return -1;
};


jstestdriver.TestCaseManager.prototype.getDefaultTestRunsConfiguration = function() {
  var testRunsConfiguration = [];
  var size = this.testCasesInfo_.length;

  for (var i = 0; i < size; i++) {
    var testCaseInfo = this.testCasesInfo_[i];

    testRunsConfiguration.push(testCaseInfo.getDefaultTestRunConfiguration());
  }
  return testRunsConfiguration;
};


jstestdriver.TestCaseManager.prototype.getTestRunsConfigurationFor = function(expressions) {
  var testRunsConfiguration = [];
  this.pluginRegistrar_.getTestRunsConfigurationFor(this.testCasesInfo_,
                                                    expressions,
                                                    testRunsConfiguration);
  return testRunsConfiguration;
};


jstestdriver.TestCaseManager.prototype.getTestCasesInfo = function() {
  return this.testCasesInfo_;
};


jstestdriver.TestCaseManager.prototype.getCurrentlyLoadedTestCases = function() {
  var testCases = [];
  var size = this.testCasesInfo_.length;

  for (var i = 0; i < size; i++) {
    var testCaseInfo = this.testCasesInfo_[i];
    testCases.push({
      'name' : testCaseInfo.getTestCaseName(),
      'tests' : testCaseInfo.getTestNames()
    })
  }
  return {
    numTests: testCases.length,
    testCases: testCases
  };
};

jstestdriver.TestCaseManager.prototype.getCurrentlyLoadedTestCasesFor = function(expressions) {
  var testRunsConfiguration = this.getTestRunsConfigurationFor(expressions);
  var size = testRunsConfiguration.length;
  var testCases = [];

  for (var i = 0; i < size; i++) {
    var testRunConfiguration = testRunsConfiguration[i];
    var testCaseInfo = testRunConfiguration.getTestCaseInfo();
    var tests = testRunConfiguration.getTests();
    testCases.push({
      'name' : testCaseInfo.getTestCaseName(),
      'tests' : testCaseInfo.getTestNames(),
      'fileName' :  testCaseInfo.getFileName()
    })
  }
  return {
    numTests: testCases.length,
    testCases: testCases
  };
};


/** @deprecated */
jstestdriver.TestCaseManager.prototype.getCurrentlyLoadedTest = function() {
  var testNames = [];
  var size = this.testCasesInfo_.length;

  for (var i = 0; i < size; i++) {
    var testCaseInfo = this.testCasesInfo_[i];
    var testCaseName = testCaseInfo.getTestCaseName();
    var tests = testCaseInfo.getTestNames();
    var testsSize = tests.length;

    for (var j = 0; j < testsSize; j++) {
      testNames.push(testCaseName + '.' + tests[j]);
    }
  }
  return {
    numTests: testNames.length,
    testNames: testNames
  };
};


jstestdriver.TestCaseManager.prototype.getCurrentlyLoadedTestFor = function(expressions) {
  var testRunsConfiguration = this.getTestRunsConfigurationFor(expressions);
  var size = testRunsConfiguration.length;
  var testNames = [];

  for (var i = 0; i < size; i++) {
    var testRunConfiguration = testRunsConfiguration[i];
    var testCaseName = testRunConfiguration.getTestCaseInfo().getTestCaseName();
    var tests = testRunConfiguration.getTests();
    var testsSize = tests.length;

    for (var j = 0; j < testsSize; j++) {
      var testName = tests[j];

      testNames.push(testCaseName + '.' + testName);
    }
  }
  return {
    numTests: testNames.length,
    testNames: testNames
  };
};
/*
 * Copyright 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

/**
 * @fileoverview
 * @author corysmith@google.com (Cory Smith)
 * @author rdionne@google.com (Robert Dionne)
 */



/**
 * Constructs a TestCaseBuilder.
 * @param {jstestdriver.TestCaseManager} testCaseManager The appropriate test
 *     case manager.
 * @constructor
 */
jstestdriver.TestCaseBuilder = function(testCaseManager) {
  this.testCaseManager_ = testCaseManager;
};


/**
 * Defines a test case.
 * @param {string} testCaseName The name of the test case.
 * @param {Object} opt_proto An optional prototype.
 * @param {Object} opt_type Either DEFAULT_TYPE or ASYNC_TYPE.
 * @return {Function} Base function that represents the test case class.
 */
jstestdriver.TestCaseBuilder.prototype.TestCase =
    function(testCaseName, opt_proto, opt_type) {
  this.checkNotBeginsWith_(testCaseName, '-');
  this.checkNotContains_(testCaseName, ',');
  this.checkNotContains_(testCaseName, '#');
  var testCaseClass = function() {};
  if (opt_proto) {
    testCaseClass.prototype = opt_proto;
  }
  if (typeof testCaseClass.prototype.setUp == 'undefined') {
    testCaseClass.prototype.setUp = function() {};
  }
  if (!testCaseClass.prototype.hasOwnProperty('toString')) {
    testCaseClass.prototype.toString = function() {
      return "TestCase(" + testCaseName +")";
    };
  }
  if (typeof testCaseClass.prototype.tearDown == 'undefined') {
    testCaseClass.prototype.tearDown = function() {};
  }
  this.testCaseManager_.add(
      new jstestdriver.TestCaseInfo(testCaseName, testCaseClass, opt_type));
  return testCaseClass;
};


jstestdriver.TestCaseBuilder.prototype.checkNotBeginsWith_ = function(
    testCaseName, illegalString) {
  if (testCaseName.indexOf(illegalString) == 0) {
    throw new Error('Test case names must not begin with \'' +
        illegalString + '\'');
  }
};


jstestdriver.TestCaseBuilder.prototype.checkNotContains_= function(
    testCaseName, illegalString) {
  if (testCaseName.indexOf(illegalString) > -1) {
    throw new Error('Test case names must not contain \'' + illegalString + '\'');
  }
};


/**
 * Defines an asynchronous test case.
 * @param {string} testCaseName The name of the test case.
 * @param {Object} opt_proto An optional prototype.
 * @return {Function} Base function that represents the asyncronous test case
 *     class.
 */
jstestdriver.TestCaseBuilder.prototype.AsyncTestCase =
    function(testCaseName, opt_proto) {
  return this.TestCase(
      testCaseName, opt_proto, jstestdriver.TestCaseInfo.ASYNC_TYPE);
};


/**
 * A TestCase that will only be executed when a certain condition is true.
 * @param {string} The name of the TestCase.
 * @param {function():boolean} A function that indicates if this case should be
 *     run.
 * @param {Object} opt_proto An optional prototype for the test case class.
 * @param {Object} opt_type Either DEFAULT_TYPE or ASYNC_TYPE.
 * @return {Function} Base function that represents the TestCase class.
 */
jstestdriver.TestCaseBuilder.prototype.ConditionalTestCase =
    function(testCaseName, condition, opt_proto, opt_type) {
  if (condition()) {
    return this.TestCase(testCaseName, opt_proto, opt_type);
  }
  this.testCaseManager_.add(
      new jstestdriver.TestCaseInfo(
          testCaseName,
          jstestdriver.TestCaseBuilder.PlaceHolderCase,
          opt_type));
  return function(){};
};


/**
 * An AsyncTestCase that will only be executed when a certain condition is true.
 * @param {String} The name of the AsyncTestCase.
 * @param {function():boolean} A function that indicates if this case should be
 *     run.
 * @param {Object} opt_proto An optional prototype for the test case class.
 * @return {Function} Base function that represents the TestCase class.
 */
jstestdriver.TestCaseBuilder.prototype.ConditionalAsyncTestCase =
    function(testCaseName, condition, opt_proto) {
  return this.ConditionalTestCase(
      testCaseName, condition, opt_proto, jstestdriver.TestCaseInfo.ASYNC_TYPE);
};


/**
 * Constructs a place holder test case.
 * @constructor
 */
jstestdriver.TestCaseBuilder.PlaceHolderCase = function() {};


/**
 * Ensures there is at least one test to demonstrate a correct exclusion.
 */
jstestdriver.TestCaseBuilder.PlaceHolderCase.prototype.testExcludedByCondition =
      jstestdriver.EMPTY_FUNC;

/*
 * Copyright 2009 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

/**
 * @param pluginRegistrar
 * @constructor
 */
jstestdriver.TestRunner = function(pluginRegistrar) {
  this.pluginRegistrar_ = pluginRegistrar;

  this.boundRunNextConfiguration_ =
      jstestdriver.bind(this, this.runNextConfiguration_);
};


/**
 * Runs all TestRunConfigurations.
 * @param {Array.<jstestdriver.TestRunConfiguration>} testRunsConfiguration Configurations to
 *      run. This array willl be modified...
 * @param {function(jstestdriver.TestResult):null} onTestDone
 * 
 */
jstestdriver.TestRunner.prototype.runTests = function(testRunsConfiguration,
                                                      onTestDone,
                                                      onComplete,
                                                      captureConsole) {

  this.pluginRegistrar_.onTestsStart();
  this.testRunsConfiguration_ = testRunsConfiguration;
  this.onTestDone_ = onTestDone;
  this.onComplete_ = onComplete;
  this.captureConsole_ = captureConsole;
  this.runNextConfiguration_();
};


jstestdriver.TestRunner.prototype.finish_ = function() {
  var onComplete = this.onComplete_;
  this.pluginRegistrar_.onTestsFinish();
  this.testRunsConfiguration_ = null;
  this.onTestDone_ = null;
  this.onComplete_ = null;
  this.captureConsole_ = false;
  onComplete();
};


jstestdriver.TestRunner.prototype.runNextConfiguration_ = function() {
  if (this.testRunsConfiguration_.length == 0) {
    this.finish_();
    return;
  }
  this.runConfiguration(
      this.testRunsConfiguration_.shift(),
      this.onTestDone_,
      this.boundRunNextConfiguration_);
}


/**
 * Runs a test configuration.
 * @param {jstestdriver.TestRunConfiguration} config
 * @param {function(jstestdriver.TestResult):null} onTestDone
 *     Function to be called when test is done.
 * @param {Function} onComplete Function to be called when all tests are done.
 */
jstestdriver.TestRunner.prototype.runConfiguration = function(config,
                                                              onTestDone,
                                                              onComplete) {
  if (this.captureConsole_) {
    this.overrideConsole_();
  }

  jstestdriver.log("running configuration " + config);
  this.pluginRegistrar_.runTestConfiguration(
      config,
      onTestDone,
      onComplete);

  if (this.captureConsole_) {
    this.resetConsole_();
  }
};


jstestdriver.TestRunner.prototype.overrideConsole_ = function() {
  this.logMethod_ = console.log;
  this.logDebug_ = console.debug;
  this.logInfo_ = console.info;
  this.logWarn_ = console.warn;
  this.logError_ = console.error;
  console.log = function() { jstestdriver.console.log.apply(jstestdriver.console, arguments); };
  console.debug = function() { jstestdriver.console.debug.apply(jstestdriver.console, arguments); };
  console.info = function() { jstestdriver.console.info.apply(jstestdriver.console, arguments); };
  console.warn = function() { jstestdriver.console.warn.apply(jstestdriver.console, arguments); };
  console.error = function() { jstestdriver.console.error.apply(jstestdriver.console, arguments); };
};


jstestdriver.TestRunner.prototype.resetConsole_ = function() {
  console.log = this.logMethod_;
  console.debug = this.logDebug_;
  console.info = this.logInfo_;
  console.warn = this.logWarn_;
  console.error = this.logError_;  
};



/**
 * A map to manage the state of running TestCases.
 * @constructor
 */
jstestdriver.TestRunner.TestCaseMap = function() {
  this.testCases_ = {};
};


/**
 * Start a TestCase.
 * @param {String} testCaseName The name of the test case to start.
 */
jstestdriver.TestRunner.TestCaseMap.prototype.startCase = function(testCaseName) {
  this.testCases_[testCaseName] = true;
};


/**
 * Stops a TestCase.
 * @param {String} testCaseName The name of the test case to stop.
 */
jstestdriver.TestRunner.TestCaseMap.prototype.stopCase = function(testCaseName) {
  this.testCases_[testCaseName] = false;
};


/**
 * Indicates if there are still cases running.
 */
jstestdriver.TestRunner.TestCaseMap.prototype.hasActiveCases = function() {
  for (var testCase in this.testCases_) {
    if (this.testCases_.hasOwnProperty(testCase) && this.testCases_[testCase]) {
      return true;
    }
  }
  return false;
};
/*
 * Copyright 2009 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */



/**
 * Allows the browser to stop the test execution thread after a test when the
 * interval requires it to.
 * @param setTimeout {function(Function, number):null}
 * @param interval {number}
 * @return {function(Function):null}
 */
jstestdriver.testBreather = function(setTimeout, interval) {
  var lastBreath = new Date();
  function maybeBreathe(callback) {
    var now = new Date();
    if ((now - lastBreath) > interval) {
      setTimeout(callback, 1);
      lastBreath = now;
    } else {
      callback();
    }
  };
  return maybeBreathe;
};


jstestdriver.TIMEOUT = 500;

jstestdriver.NOOP_COMMAND = {
  command : 'noop',
  parameters : []
};

// TODO(corysmith): Extract the network streaming logic from the Executor logic.
/**
 * @param {jstestdriver.StreamingService} streamingService The service for
 *     streaming {@link jstestdriver.Reponse}s to the server.
 * @param {jstestdriver.TestCaseManager} testCaseManager Used to access the TestCaseInfo's for running.
 * @param {jstestdriver.TestRunner} testRunner Runs the tests...
 * @param {jstestdriver.PluginRegistrar} pluginRegistrar The plugin service,
 *     for post processing test results.
 * @param {jstestdriver.now} now
 * @param {function():number} getBrowserInfo
 * @param {jstestdriver.Signal} currentActionSignal
 * @param {jstestdriver.Signal} unloadSignal
 * @constructor
 */
jstestdriver.CommandExecutor = function(streamingService,
                                        testCaseManager,
                                        testRunner,
                                        pluginRegistrar,
                                        now,
                                        getBrowserInfo,
                                        currentActionSignal,
                                        unloadSignal) {
  this.streamingService_ = streamingService;
  this.__testCaseManager = testCaseManager;
  this.__testRunner = testRunner;
  this.__pluginRegistrar = pluginRegistrar;
  this.__boundExecuteCommand = jstestdriver.bind(this, this.executeCommand);
  this.__boundExecute = jstestdriver.bind(this, this.execute);
  this.__boundEvaluateCommand = jstestdriver.bind(this, this.evaluateCommand);
  this.boundOnFileLoaded_ = jstestdriver.bind(this, this.onFileLoaded);
  this.boundOnFileLoadedRunnerMode_ = jstestdriver.bind(this, this.onFileLoadedRunnerMode);
  this.commandMap_ = {};
  this.testsDone_ = [];
  this.debug_ = false;
  this.now_ = now;
  this.lastTestResultsSent_ = 0;
  this.getBrowserInfo = getBrowserInfo;
  this.currentActionSignal_ = currentActionSignal;
  this.currentCommand = null;
  this.unloadSignal_ = unloadSignal;
};


/**
 * Executes a command form the server.
 * @param jsonCommand {String}
 */
jstestdriver.CommandExecutor.prototype.executeCommand = function(jsonCommand) {
  var command;
  if (jsonCommand && jsonCommand.length) { //handling some odd IE errors.
    command = jsonParse(jsonCommand);
  } else {
    command = jstestdriver.NOOP_COMMAND;
  }
  this.currentCommand = command.command;
  jstestdriver.log('current command ' + command.command);
  try {
    this.unloadSignal_.set(false); // if the page unloads during a command, issue an error.
    this.commandMap_[command.command](command.parameters);
  } catch (e) {
    var message =  'Exception ' + e.name + ': ' + e.message +
        '\n' + e.fileName + '(' + e.lineNumber +
        '):\n' + e.stack;
    var response = new jstestdriver.Response(jstestdriver.RESPONSE_TYPES.LOG,
      jstestdriver.JSON.stringify(
          new jstestdriver.BrowserLog(1000,
              'jstestdriver.CommandExecutor',
              message,
              this.getBrowserInfo())),
      this.getBrowserInfo());
    if (top.console && top.console.log) {
      top.console.log(message);
    }
    this.streamingService_.close(response, this.__boundExecuteCommand);
    this.unloadSignal_.set(true); // reloads are possible between actions.
    // Propagate the exception.
    throw e;
  }
};


jstestdriver.CommandExecutor.prototype.execute = function(cmd) {
  var response = new jstestdriver.Response(
          jstestdriver.RESPONSE_TYPES.COMMAND_RESULT,
          JSON.stringify(this.__boundEvaluateCommand(cmd)),
          this.getBrowserInfo());

  this.streamingService_.close(response, this.__boundExecuteCommand);
};


jstestdriver.CommandExecutor.prototype.evaluateCommand = function(cmd) {
  var res = '';
  try {
    var evaluatedCmd = eval('(' + cmd + ')');
    if (evaluatedCmd) {
      res = evaluatedCmd.toString();
    }
  } catch (e) {
    res = 'Exception ' + e.name + ': ' + e.message +
          '\n' + e.fileName + '(' + e.lineNumber +
          '):\n' + e.stack;
  }
  return res;
};


/**
 * Registers a command to the executor to handle incoming command requests.
 * @param {String} name The name of the command
 * @param {Object} context The context to call the command in.
 * @param {function(Array):null} func the command.
 */
jstestdriver.CommandExecutor.prototype.registerCommand =
    function(name, context, func) {
  this.commandMap_[name] = jstestdriver.bind(context, func);
};


/**
 * Registers a command to the executor to handle incoming command requests
 * @param {String} name The name of the command
 * @param {Object} context The context to call the command in.
 * @param {function(Array):null} func the command.
 */
jstestdriver.CommandExecutor.prototype.registerTracedCommand =
    function(name, context, func) {
  var bound = jstestdriver.bind(context, func);
  var signal = this.currentActionSignal_;
  this.commandMap_[name] = function() {
    signal.set(name);
    return bound.apply(null, arguments);
  };
};


jstestdriver.CommandExecutor.prototype.dryRun = function() {
  var response =
      new jstestdriver.Response(jstestdriver.RESPONSE_TYPES.TEST_QUERY_RESULT,
          JSON.stringify(this.__testCaseManager.getCurrentlyLoadedTestCases()),
          this.getBrowserInfo());
  
  this.streamingService_.close(response, this.__boundExecuteCommand);
};


jstestdriver.CommandExecutor.prototype.dryRunFor = function(args) {
  var expressions = jsonParse('{"expressions":' + args[0] + '}').expressions;
  var tests = JSON.stringify(
      this.__testCaseManager.getCurrentlyLoadedTestCasesFor(expressions))
  var response = new jstestdriver.Response(
          jstestdriver.RESPONSE_TYPES.TEST_QUERY_RESULT,
          tests,
          this.getBrowserInfo());
  this.streamingService_.close(response, this.__boundExecuteCommand);
};


jstestdriver.CommandExecutor.prototype.listen = function(loadResults) {
  var response;
  if (window.location.href.search('refresh') != -1) {
    response =
        new jstestdriver.Response(jstestdriver.RESPONSE_TYPES.RESET_RESULT,
                                  '{"loadedFiles":' + JSON.stringify(loadResults) + '}',
                                  this.getBrowserInfo(),
                                  true);
    jstestdriver.log('Runner reset: ' + window.location.href);
  } else {
    jstestdriver.log('Listen: ' + window.location.href);
    response =
        new jstestdriver.Response(jstestdriver.RESPONSE_TYPES.BROWSER_READY,
                                  '{"loadedFiles":' + JSON.stringify(loadResults) + '}',
                                  this.getBrowserInfo(),
                                  true);

  }
  this.streamingService_.close(response, this.__boundExecuteCommand);
};
/*
 * Copyright 2011 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the 'License'); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */



jstestdriver.ManualScriptLoader = function(win, testCaseManager, now) {
  this.win_ = win;
  this.testCaseManager_ = testCaseManager;
  this.now_ = now;
  this.onFileLoaded_ = null;
  this.started_ = -1;
  this.file_ = null;
  this.fileMap_ = {};
  this.errorHandler_ = this.createErrorHandler();
};


jstestdriver.ManualScriptLoader.prototype.beginLoad = function(file, onFileLoaded) {
  this.fileMap_[file.fileSrc] = file;
  this.testCaseManager_.removeTestCaseForFilename(file.fileSrc);
  this.file_ = file;
  this.win_.onerror = this.errorHandler_;
  this.started_ = this.now_();
  this.onFileLoaded_ = onFileLoaded;
  jstestdriver.log('loading ' + file.fileSrc);
};


jstestdriver.ManualScriptLoader.prototype.endLoad = function(file) {
  var elapsed = this.now_() - this.started_;
  if (elapsed > 50) {
    jstestdriver.log('slow load ' + this.file_.fileSrc + ' in ' + elapsed);
  }
  this.testCaseManager_.updateLatestTestCase(file.fileSrc);
  var result = new jstestdriver.FileResult(file,
                                           true,
                                           '',
                                           this.now_() - this.started_);
  this.onFileLoaded_(result);
};


jstestdriver.ManualScriptLoader.prototype.createErrorHandler = function() {
  var self = this;
  return function (msg, url, line) {
    var offset = url.indexOf('/test/')
    var fileSrc = offset > -1 ? url.substr(offset, url.length - offset) : url;
    var loadingFile = self.fileMap_[fileSrc];
    jstestdriver.log('failed load ' + fileSrc + ' in ' +
        (self.now_() - self.started_));
    var started = self.started_;
    self.started_ = -1;
    var loadMsg = 'error loading file: ' + fileSrc;

    if (line != undefined && line != null) {
      loadMsg += ':' + line;
    }

    if (msg != undefined && msg != null) {
      loadMsg += ': ' + msg;
    }
    self.win_.onerror = jstestdriver.EMPTY_FUNC;
    self.onFileLoaded_(new jstestdriver.FileResult(loadingFile, false, loadMsg, self.now_() - started));
  }
};
/*
 * Copyright 2011 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


jstestdriver.ManualResourceTracker = function(
    parse,
    serialize,
    pluginRegistrar,
    getBrowserInfo,
    manualScriptLoader) {
  this.parse_ = parse;
  this.serialize_ = serialize;
  this.getBrowserInfo_ = getBrowserInfo;
  this.manualScriptLoader_ = manualScriptLoader;
  this.boundOnComplete_ = jstestdriver.bind(this, this.onComplete_);
  this.results_ = [];
  this.resultsIndexMap_ = {};
};

/**
 * Starts the resource load tracking to catch errors and other statistics. 
 * @param {String} jsonFile A serialized jstestdriver.FileSrc
 */
jstestdriver.ManualResourceTracker.prototype.startResourceLoad =
    function(jsonFile) {
  var file = this.parse_(jsonFile);
  this.manualScriptLoader_.beginLoad(file, this.boundOnComplete_);
};

/**
 * Method to be called with the resource completes.
 * @param {jstestdriver.FileLoadResult} result
 */
jstestdriver.ManualResourceTracker.prototype.onComplete_ = function(result) {
  var fileSrc = result.file.fileSrc;
  var idx = this.resultsIndexMap_[fileSrc];
  if (idx != null) {
    // errors can arrive after the load is reported as complete. Apparently,
    // onError is not tied to the script resolution.
    if (!result.success) { // if it's successful, don't replace, as it could overwrite an error.
      this.results_[idx] = result;
    }
  } else {
    this.resultsIndexMap_[fileSrc] = this.results_.push(result) - 1;
  }
};

/**
 * Called after the resource has loaded (maybe, other times it will called immediately).
 */
jstestdriver.ManualResourceTracker.prototype.finishResourceLoad = function(jsonFile) {
  var file = this.parse_(jsonFile);
  this.manualScriptLoader_.endLoad(file);
};

/**
 * Returns the collected results from loading.
 * @return {Array.<jstestdriver.FileLoadResult>}
 */
jstestdriver.ManualResourceTracker.prototype.getResults = function() {
  return this.results_;
};
/*
 * Copyright 2010 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

/**
 * Loads script tags for the stand alone runner.
 * 
 * @param {function(String):Object} jsonParse A function to deserialize json objects.
 * @param {jstestdriver.PluginRegistrar} pluginRegistrar
 * @param {function():jstestdriver.BrowserInfo} getBrowserInfo Browser info factory.
 * @param {function(jstestdriver.Response):void} onLoadComplete The function to call when the loading is complete.
 * @param {jstestdriver.StandAloneTestReporter} results The reporter object for the stand alone runner.
 * 
 */
jstestdriver.StandAloneLoadTestsCommand =
    function(jsonParse, pluginRegistrar, getBrowserInfo, onLoadComplete, reporter, now) {
  this.jsonParse_ = jsonParse;
  this.pluginRegistrar_ = pluginRegistrar;
  this.boundOnFileLoaded_ = jstestdriver.bind(this, this.onFileLoaded);
  this.getBrowserInfo = getBrowserInfo;
  this.onLoadComplete_ = onLoadComplete;
  this.reporter_ = reporter;
  this.now_ = now;
}


jstestdriver.StandAloneLoadTestsCommand.prototype.loadTest = function(args) {
  var files = args[0];
  var fileSrcs = this.jsonParse_('{"f":' + files + '}').f;

  this.removeScripts(document, fileSrcs);
  var fileLoader = new jstestdriver.FileLoader(this.pluginRegistrar_,
    this.boundOnFileLoaded_);

  this.reporter_.startLoading(this.now_());
  fileLoader.load(fileSrcs);
};

jstestdriver.StandAloneLoadTestsCommand.prototype.onFileLoaded = function(status) {
  this.reporter_.addLoadedFileResults(status.loadedFiles);
  var response = new jstestdriver.Response(
          jstestdriver.RESPONSE_TYPES.FILE_LOAD_RESULT,
          JSON.stringify(status),
          this.getBrowserInfo());
  this.reporter_.finishLoading(this.now_());
  this.onLoadComplete_(response);
};


jstestdriver.StandAloneLoadTestsCommand.prototype.findScriptTagsToRemove_ =
    function(dom, fileSrcs) {
  var scripts = dom.getElementsByTagName('script');
  var filesSize = fileSrcs.length;
  var scriptsSize = scripts.length;
  var scriptTagsToRemove = [];

  for (var i = 0; i < filesSize; i++) {
    var f = fileSrcs[i].fileSrc;

    for (var j = 0; j < scriptsSize; j++) {
      var s = scripts[j];

      if (s.src.indexOf(f) != -1) {
        scriptTagsToRemove.push(s);
        break;
      }
    }
  }
  return scriptTagsToRemove;
};


jstestdriver.StandAloneLoadTestsCommand.prototype.removeScriptTags_ =
    function(dom, scriptTagsToRemove) {
  var head = dom.getElementsByTagName('head')[0];
  var size = scriptTagsToRemove.length;

  for (var i = 0; i < size; i++) {
    var script = scriptTagsToRemove[i];
    head.removeChild(script);
  }
};


jstestdriver.StandAloneLoadTestsCommand.prototype.removeScripts = function(dom, fileSrcs) {
  this.removeScriptTags_(dom, this.findScriptTagsToRemove_(dom, fileSrcs));
};
/*
 * Copyright 2010 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


/**
 * Executes tests for the standalone runner.
 * 
 * @param {jstestdriver.TestCaseManager}
 * @param {jstestdriver.TestRunner}
 * @param {jstestdriver.PluginRegistrar}
 * @param {function():BrowserInfo}
 * @param {jstestdriver.StandAloneTestReporter} reporter The reporter object for the stand alone runner.
 * @param {function():Number}
 * @param {function(String):Object}
 */
jstestdriver.StandAloneRunTestsCommand = function(testCaseManager,
                                                  testRunner,
                                                  pluginRegistrar,
                                                  getBrowserInfo,
                                                  reporter,
                                                  now,
                                                  jsonParse,
                                                  streamContinue,
                                                  streamStop) {
  this.testCaseManager_ = testCaseManager;
  this.testRunner_ = testRunner;
  this.pluginRegistrar_ = pluginRegistrar;
  this.jsonParse_ = jsonParse;
  this.now_ = now;
  this.boundOnTestDone_ = jstestdriver.bind(this, this.onTestDone_);
  this.boundOnComplete_ = jstestdriver.bind(this, this.onComplete);
  this.testsDone_ = [];
  this.getBrowserInfo_ = getBrowserInfo;
  this.reporter_ = reporter;
  this.streamContinue_ = streamContinue;
  this.streamStop_ = streamStop;
};


jstestdriver.StandAloneRunTestsCommand.prototype.createLog_ = function(message) {
  return new jstestdriver.BrowserLog(0, 'jstestdriver.StandAloneRunTestsCommand',
    message, this.getBrowserInfo_());
};


jstestdriver.StandAloneRunTestsCommand.prototype.runAllTests = function(args) {
  this.streamContinue_(
      new jstestdriver.Response(
          jstestdriver.RESPONSE_TYPES.LOG,
          jstestdriver.JSON.stringify(this.createLog_('all tests started.')),
          this.getBrowserInfo_()));
  var captureConsole = args[0];
  this.debug_ = Boolean(args[2]);

  this.runTestCases_(this.testCaseManager_.getDefaultTestRunsConfiguration(),
      captureConsole == "true" ? true : false);
};


jstestdriver.StandAloneRunTestsCommand.prototype.runTests = function(args) {
  this.streamContinue_(
      new jstestdriver.Response(
          jstestdriver.RESPONSE_TYPES.LOG,
          jstestdriver.JSON.stringify(this.createLog_('started tests.')),
          this.getBrowserInfo_()));
  var expressions = jsonParse('{"expressions":' + args[0] + '}').expressions;
  var captureConsole = args[1];
  this.debug_ = Boolean(args[2]);

  this.runTestCases_(this.testCaseManager_.getTestRunsConfigurationFor(expressions),
                     captureConsole == "true" ? true : false,
                     false);
};


jstestdriver.StandAloneRunTestsCommand.prototype.runTestCases_ = function(testRunsConfiguration,
    captureConsole) {
  this.reporter_.startTests(this.now_());
  this.totaltestruns_ = testRunsConfiguration.length;
  this.testRunner_.runTests(testRunsConfiguration,
                            this.boundOnTestDone_,
                            this.boundOnComplete_,
                            captureConsole);
};


jstestdriver.StandAloneRunTestsCommand.prototype.onTestDone_ = function(result) {
  this.reporter_.updateIsSuccess(
      result.result == jstestdriver.TestResult.RESULT.PASSED);
  this.addTestResult(result);
};


jstestdriver.StandAloneRunTestsCommand.prototype.onComplete = function() {
  var serializedTests = jstestdriver.JSON.stringify(this.testsDone_);
  this.streamContinue_(new jstestdriver.Response(
          jstestdriver.RESPONSE_TYPES.TEST_RESULT,
          serializedTests,
          this.getBrowserInfo_()));
  this.reporter_.setReport(serializedTests);
  this.testsDone_ = [];
  this.reporter_.finishTests(this.now_());
  this.reporter_.setIsFinished(true);
  this.streamStop_(
      new jstestdriver.Response(
          jstestdriver.RESPONSE_TYPES.LOG,
          jstestdriver.JSON.stringify(this.createLog_(
              'testing complete, isSuccess:' +
              this.reporter_.isSuccess() +
              ', isFinished:' +
              this.reporter_.isFinished())),
          this.getBrowserInfo_()));
};


jstestdriver.StandAloneRunTestsCommand.prototype.addTestResult = function(testResult) {
  this.reporter_.addTestResult(testResult);
  this.pluginRegistrar_.processTestResult(testResult);
  this.testsDone_.push(testResult);
};
/*
 * Copyright 2010 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

/**
 * A command that does nothing but contact the server and return a response.
 * Used to retrieve new commands from the server.
 * 
 * @constructor
 * 
 * @author corbinrsmith@gmail.com (Cory Smith)
 */
jstestdriver.NoopCommand = function(streamStop, getBrowserInfo) {
  /**
   * Function used to contact the server.
   * @type {function(jstestdriver.Response):null}
   */
  this.streamStop_ = streamStop;
  /**
   * Function used to retrieve the jstestdriver.BrowserInfo.
   * @type {function():jstestdriver.BrowserInfo}
   */
  this.streamStop_ = streamStop;
  this.getBrowserInfo_ = getBrowserInfo;
};

jstestdriver.NoopCommand.prototype.sendNoop = function() {
  
  this.streamStop_(
      new jstestdriver.Response(
          jstestdriver.RESPONSE_TYPES.NOOP,
          '{}',
          this.getBrowserInfo_()));
}

/*
 * Copyright 2010 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


/**
 * Reporter for test results when running in stand alone mode.
 * @constructor
 */
jstestdriver.StandAloneTestReporter = function() {
  this.finished_ = false;
  this.success_ = 1;
  this.report_ = '';
  this.filesLoaded_ = 0;
  this.lastTestResult_ = "none";
};


/** 
 * @export
 */
jstestdriver.StandAloneTestReporter.prototype.isFinished = function() {
  return this.finished_;
};


jstestdriver.StandAloneTestReporter.prototype.startTests = function(when) {
};


jstestdriver.StandAloneTestReporter.prototype.finishTests = function(when) {
};


jstestdriver.StandAloneTestReporter.prototype.startLoading = function(when) {
}


jstestdriver.StandAloneTestReporter.prototype.finishLoading = function(when) {
}


/**
 * @export
 * @return {String} A json representation of the test results.
 */
jstestdriver.StandAloneTestReporter.prototype.getReport = function() {
  return this.report_;
};


/**
 * @export
 */
jstestdriver.StandAloneTestReporter.prototype.getNumFilesLoaded = function() {
  return this.filesLoaded_;
};


jstestdriver.StandAloneTestReporter.prototype.setIsFinished = function(finished) {
  this.log("finished: " + finished + ": success" + this.success_);
  this.finished_ = finished;
};


jstestdriver.StandAloneTestReporter.prototype.log = function(msg) {
  //var div = document.body.appendChild(document.createElement('div'));
  //div.innerHTML = "LOG: " + msg;
}


jstestdriver.StandAloneTestReporter.prototype.setIsSuccess = function(success) {
  this.log("success" + this.success_);
  this.success_ = success;
};


/**
 * Adds a test result to the current run.
 * @param {jstestdriver.TestResult}
 */
jstestdriver.StandAloneTestReporter.prototype.addTestResult = function(testResult) {
  this.lastTestResult_ = testResult.testCaseName + "." + testResult.testName + " " + testResult.result;
  this.log("testresult: " + this.lastTestResult_);
};


jstestdriver.StandAloneTestReporter.prototype.isSuccess = function() {
  return !!this.success_;
};


jstestdriver.StandAloneTestReporter.prototype.updateIsSuccess = function(success) {
  if (this != window.top.G_testRunner) {
    // this is a horrible hack to work around overwrites happening on file importing.
    window.top.G_testRunner = this;
  }
  this.success_ = success & this.success_;
  this.log("success" + this.success_);
};


jstestdriver.StandAloneTestReporter.prototype.setReport = function(report) {
  this.report_ = report;
};


jstestdriver.StandAloneTestReporter.prototype.addLoadedFileResults = function(filesLoaded) {
  var numberOfFilesLoaded = filesLoaded.length;
  this.log("files loaded: " + numberOfFilesLoaded);
  if (this != window.top.G_testRunner) {
    // this is a horrible hack to work around overwrites happening on file importing.
    window.top.G_testRunner = this;
  }
  this.filesLoaded_ += numberOfFilesLoaded;
};


jstestdriver.StandAloneTestReporter.prototype.toString = function() {
  return "StandAloneTestReporter(success=["
      + this.success_ + "], finished=["
      + this.finished_ + "], lastTestResult=["
      + this.lastTestResult_ + "], filesLoaded=["
      + this.filesLoaded_ + "] report=["
      + this.report_ + "])";
};
/*
 * Copyright 2010 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

/**
 * @fileoverview Configuration namespace for setting up JsTD runners.
 */
jstestdriver.config = (function(module) {
  var config = module || {};

  /**
   * Create a new runner.
   */
  config.createRunner = function(createCommandExecutor, opt_runTestLoop) {

    var runTestLoop = opt_runTestLoop || jstestdriver.plugins.defaultRunTestLoop;

    jstestdriver.pluginRegistrar = new jstestdriver.PluginRegistrar();
    jstestdriver.testCaseManager =
        new jstestdriver.TestCaseManager(jstestdriver.pluginRegistrar);

    jstestdriver.testRunner =
        new jstestdriver.TestRunner(jstestdriver.pluginRegistrar);

    jstestdriver.testCaseBuilder =
        new jstestdriver.TestCaseBuilder(jstestdriver.testCaseManager);

    jstestdriver.global.TestCase = jstestdriver.bind(jstestdriver.testCaseBuilder,
        jstestdriver.testCaseBuilder.TestCase);

    jstestdriver.global.AsyncTestCase = jstestdriver.bind(jstestdriver.testCaseBuilder,
        jstestdriver.testCaseBuilder.AsyncTestCase);

    jstestdriver.global.ConditionalTestCase = jstestdriver.bind(jstestdriver.testCaseBuilder,
        jstestdriver.testCaseBuilder.ConditionalTestCase);

    jstestdriver.global.ConditionalAsyncTestCase = jstestdriver.bind(
        jstestdriver.testCaseBuilder,
        jstestdriver.testCaseBuilder.ConditionalAsyncTestCase);

    // default plugin
    var scriptLoader = new jstestdriver.plugins.ScriptLoader(window, document,
          jstestdriver.testCaseManager, jstestdriver.now);
    var stylesheetLoader =
        new jstestdriver.plugins.StylesheetLoader(window, document,
              jstestdriver.jQuery.browser.mozilla || jstestdriver.jQuery.browser.safari);
    var fileLoaderPlugin = new jstestdriver.plugins.FileLoaderPlugin(
            scriptLoader,
            stylesheetLoader,
            jstestdriver.now);
    var testRunnerPlugin =
          new jstestdriver.plugins.TestRunnerPlugin(Date, function() {
        jstestdriver.log(jstestdriver.jQuery('body')[0].innerHTML);
        jstestdriver.jQuery('body').children().remove();
        jstestdriver.jQuery(document).unbind();
        jstestdriver.jQuery(document).die();
    }, runTestLoop);

    jstestdriver.pluginRegistrar.register(
        new jstestdriver.plugins.DefaultPlugin(
            fileLoaderPlugin,
            testRunnerPlugin,
            new jstestdriver.plugins.AssertsPlugin(),
            new jstestdriver.plugins.TestCaseManagerPlugin()));

    jstestdriver.pluginRegistrar.register(
        new jstestdriver.plugins.async.AsyncTestRunnerPlugin(Date, function() {

          jstestdriver.jQuery('body').children().remove();
          jstestdriver.jQuery(document).unbind();
          jstestdriver.jQuery(document).die();
        }, jstestdriver.utils.serializeErrors));

    // legacy
    jstestdriver.testCaseManager.TestCase = jstestdriver.global.TestCase;

    var id = parseInt(jstestdriver.extractId("/id/1/slave/".toString()));

    function getBrowserInfo() {
      return new jstestdriver.BrowserInfo(id);
    }

    jstestdriver.manualResourceTracker = new jstestdriver.ManualResourceTracker(
        jstestdriver.JSON.parse,
        jstestdriver.JSON.stringify,
        jstestdriver.pluginRegistrar,
        getBrowserInfo,
        new jstestdriver.ManualScriptLoader(
            window,
            jstestdriver.testCaseManager,
            jstestdriver.now));

    return jstestdriver.executor = createCommandExecutor(
        jstestdriver.testCaseManager,
        jstestdriver.testRunner,
        jstestdriver.pluginRegistrar,
        jstestdriver.now,
        window.location.toString(),
        getBrowserInfo,
        id);
  };


  /**
   * Creates a CommandExecutor.
   * @static
   * 
   * @param {jstestdriver.TestCaseManager} testCaseManager
   * @param {jstestdriver.PluginRegistrar} pluginRegistrar
   * @param {function():Number} now
   * @param {String} location The current window location
   * 
   * @return {jstestdriver.CommandExecutor}
   */
  config.createExecutor = function(testCaseManager,
                                   testRunner,
                                   pluginRegistrar,
                                   now,
                                   location,
                                   getBrowserInfo,
                                   id) {
    var url = jstestdriver.createPath("/id/1/slave/".toString(),
                                      jstestdriver.SERVER_URL + id);

    var unloadSignal = new jstestdriver.Signal(false);

    var streamingService = new jstestdriver.StreamingService(
            url,
            now,
            jstestdriver.convertToJson(jstestdriver.jQuery.post),
            jstestdriver.createSynchPost(jstestdriver.jQuery),
            jstestdriver.setTimeout,
            unloadSignal);

    var currentActionSignal = new jstestdriver.Signal(null);

    var executor = new jstestdriver.CommandExecutor(streamingService,
                                                    testCaseManager,
                                                    testRunner,
                                                    pluginRegistrar,
                                                    now,
                                                    getBrowserInfo,
                                                    currentActionSignal,
                                                    unloadSignal);

    var boundExecuteCommand = jstestdriver.bind(executor, executor.executeCommand);

    function streamStop(response) {
      streamingService.close(response, boundExecuteCommand)
    }

    function streamContinue(response) {
      streamingService.stream(response, boundExecuteCommand);
    }

    var loadTestsCommand = new jstestdriver.LoadTestsCommand(jsonParse,
            pluginRegistrar,
            getBrowserInfo,
            streamStop);

    var runTestsCommand = new jstestdriver.RunTestsCommand(
        testCaseManager,
        testRunner,
        pluginRegistrar,
        getBrowserInfo,
        jstestdriver.now,
        jsonParse,
        streamContinue,
        streamStop);
    var resetCommand = new jstestdriver.ResetCommand(
        window.location,
        unloadSignal,
        jstestdriver.now);

    var noopCommand = new jstestdriver.NoopCommand(streamStop, getBrowserInfo);

    executor.registerCommand('execute', executor, executor.execute);
    executor.registerCommand('noop', noopCommand, noopCommand.sendNoop);
    executor.registerCommand('runAllTests', runTestsCommand, runTestsCommand.runAllTests);
    executor.registerCommand('runTests', runTestsCommand, runTestsCommand.runTests);
    executor.registerCommand('loadTest', loadTestsCommand, loadTestsCommand.loadTest);
    executor.registerCommand('reset', resetCommand, resetCommand.reset);
    executor.registerCommand('dryRun', executor, executor.dryRun);
    executor.registerCommand('dryRunFor', executor, executor.dryRunFor);
    executor.registerCommand('unknownBrowser', null, function() {
      // TODO(corysmith): handle this better.
    });
    executor.registerCommand('stop', null, function() {
      if (window.console && window.console.log) {
        window.console.log('Stopping executor by server request.');
      }
    });
    executor.registerCommand('streamAcknowledged',
                              streamingService,
                              streamingService.streamAcknowledged);


    function getCommand() {
      return currentActionSignal.get();
    }

    var unloadHandler = new jstestdriver.PageUnloadHandler(
        streamingService,
        getBrowserInfo,
        getCommand,
        unloadSignal);
    
    jstestdriver.jQuery(window).bind('unload', jstestdriver.bind(unloadHandler, unloadHandler.onUnload));
    jstestdriver.jQuery(window).bind('beforeunload', jstestdriver.bind(unloadHandler, unloadHandler.onUnload));
    window.onbeforeunload = jstestdriver.bind(unloadHandler, unloadHandler.onUnload);

    return executor;
  }
  
  /**
   * Creates a visual stand alone CommandExecutor.
   * @static
   * 
   * @param {jstestdriver.TestCaseManager} testCaseManager
   * @param {jstestdriver.PluginRegistrar} pluginRegistrar
   * @param {function():Number} now
   * @param {String} location The current window location
   * 
   * @return {jstestdriver.CommandExecutor}
   */
  config.createVisualExecutor = function(testCaseManager,
      testRunner,
      pluginRegistrar,
      now,
      location,
      getBrowserInfo,
      id) {
    return config.createStandAloneExecutorWithReporter(
        testCaseManager,
        testRunner,
        pluginRegistrar,
        now,
        location,
        new jstestdriver.VisualTestReporter(
            function(tagName) {
              return document.createElement(tagName);
            },
            function(node) {
              return document.body.appendChild(node);
            },
            jstestdriver.jQuery,
            JSON.parse),
        getBrowserInfo,
        id);
  };

  /**
   * Creates a stand alone CommandExecutor.
   * @static
   * 
   * @param {jstestdriver.TestCaseManager} testCaseManager
   * @param {jstestdriver.PluginRegistrar} pluginRegistrar
   * @param {function():Number} now
   * @param {String} location The current window location
   * 
   * @return {jstestdriver.CommandExecutor}
   */
  config.createStandAloneExecutor =  function(
      testCaseManager,
      testRunner,
      pluginRegistrar,
      now,
      location,
      getBrowserInfo,
      id) {
    return config.createStandAloneExecutorWithReporter(testCaseManager,
        testRunner,
        pluginRegistrar,
        now,
        location,
        new jstestdriver.StandAloneTestReporter(),
        getBrowserInfo,
        id)
  };


  // TODO(corysmith): Factor out the duplicated code.
  /**
   * Creates a stand alone CommandExecutor configured with a reporter.
   * @static
   * 
   * @param {jstestdriver.TestCaseManager} testCaseManager
   * @param {jstestdriver.PluginRegistrar} pluginRegistrar
   * @param {function():Number} now
   * @param {String} location The current window location
   * 
   * @return {jstestdriver.CommandExecutor}
   */
  config.createStandAloneExecutorWithReporter = function(
      testCaseManager,
      testRunner,
      pluginRegistrar,
      now,
      location,
      reporter,
      getBrowserInfo,
      id) {
    var url =jstestdriver.createPath("/id/1/slave/".toString(),
        jstestdriver.SERVER_URL + id);

    var unloadSignal = new jstestdriver.Signal(false);

    var streamingService = new jstestdriver.StreamingService(
            url,
            now,
            jstestdriver.convertToJson(jstestdriver.jQuery.post),
            jstestdriver.createSynchPost(jstestdriver.jQuery),
            jstestdriver.setTimeout,
            unloadSignal);

    window.top.G_testRunner = reporter;
    jstestdriver.reporter = reporter;

    var currentActionSignal = new jstestdriver.Signal(null);

    var executor = new jstestdriver.CommandExecutor(streamingService,
            testCaseManager,
            testRunner,
            pluginRegistrar,
            now,
            getBrowserInfo,
            currentActionSignal,
            unloadSignal);

    var boundExecuteCommand = jstestdriver.bind(executor,
                                                executor.executeCommand);

    function streamStop(response) {
      streamingService.close(response, boundExecuteCommand)
    }

    function streamContinue(response) {
      streamingService.stream(response, boundExecuteCommand);
    }

    var loadTestsCommand = new jstestdriver.StandAloneLoadTestsCommand(
        jsonParse,
        pluginRegistrar,
        getBrowserInfo,
        streamStop,
        reporter,
        jstestdriver.now);

    var runTestsCommand =
        new jstestdriver.StandAloneRunTestsCommand(
            testCaseManager,
            testRunner,
            pluginRegistrar,
            getBrowserInfo,
            reporter,
            now,
            jsonParse,
            streamContinue,
            streamStop);

    executor.registerTracedCommand('execute', executor, executor.execute);
    executor.registerTracedCommand('noop', null, streamStop);
    executor.registerTracedCommand('runAllTests', runTestsCommand, runTestsCommand.runAllTests);
    executor.registerTracedCommand('runTests', runTestsCommand, runTestsCommand.runTests);
    executor.registerTracedCommand('loadTest', loadTestsCommand, loadTestsCommand.loadTest);
    executor.registerTracedCommand('reset', executor, executor.reset);
    executor.registerTracedCommand('dryRun', executor, executor.dryRun);
    executor.registerTracedCommand('dryRunFor', executor, executor.dryRunFor);
    executor.registerCommand('streamAcknowledged',
            streamingService,
            streamingService.streamAcknowledged);
    executor.registerCommand('unknownBrowser', null, function() {
      // TODO(corysmith): handle this better.
    });
    executor.registerCommand('stop', null, function() {
      if (window.console && window.console.log) {
        window.console.log('Stopping executor by server request.');
      }
    });

    return executor;
  }

  return config;
})(jstestdriver.config);

/*
 * Copyright 2010 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

/**
 * @fileoverview Defines the FiniteUseCallback class, which decorates a
 * Javascript function by notifying the test runner about any exceptions thrown
 * when the function executes.
 *
 * @author rdionne@google.com (Robert Dionne)
 */

goog.provide('jstestdriver.plugins.async.CatchingCallback');

goog.require('jstestdriver');

/**
 * Constructs a CatchingCallback.
 *
 * @param {Object} testCase the testCase to use as 'this' when calling the
 *    wrapped function.
 * @param {jstestdriver.plugins.async.CallbackPool} pool the pool to which this
 *    callback belongs.
 * @param {Function} wrapped the wrapped callback function.
 * @constructor
 */
jstestdriver.plugins.async.CatchingCallback = function(
    testCase, pool, wrapped) {
  this.testCase_ = testCase;
  this.pool_ = pool;
  this.callback_ = wrapped;
};


/**
 * Invokes the wrapped callback, catching any exceptions and reporting the
 * status to the pool.
 * @return {*} The return value of the original callback.
 */
jstestdriver.plugins.async.CatchingCallback.prototype.invoke = function() {
  var result;
  var message;
  try {
    result = this.callback_.apply(this.testCase_, arguments);
    message = 'success.';
    return result;
  } catch (e) {
    this.pool_.onError(e);
    message = 'failure: ' + e;
    throw e;
  } finally {
    this.pool_.remove(message);
  }
};
/*
 * Copyright 2010 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


/**
 * @fileoverview Defines the ExpiringCallback class, which decorates a
 * Javascript function by restricting the length of time the asynchronous system
 * may delay before calling the function.
 *
 * @author rdionne@google.com (Robert Dionne)
 */

goog.provide('jstestdriver.plugins.async.ExpiringCallback');

goog.require('jstestdriver');

/**
 * Constructs an ExpiringCallback.
 *
 * @param {jstestdriver.plugins.async.CallbackPool} pool The pool to which this
 *     callback belongs.
 * @param {jstestdriver.plugins.async.FiniteUseCallback} callback A
 *     FiniteUseCallback.
 * @param {jstestdriver.plugins.async.Timeout} timeout A Timeout object.
 * @param {string} stepDescription A description of the current test step.
 * @constructor
 */
jstestdriver.plugins.async.ExpiringCallback = function(
    pool, callback, timeout, stepDescription, callbackDescription) {
  this.pool_ = pool;
  this.callback_ = callback;
  this.timeout_ = timeout;
  this.stepDescription_ = stepDescription;
  this.callbackDescription_ = callbackDescription;
};


/**
 * Arms this callback to expire after the given delay.
 *
 * @param {number} delay The amount of time (ms) before this callback expires.
 */
jstestdriver.plugins.async.ExpiringCallback.prototype.arm = function(delay) {
  var callback = this;
  this.timeout_.arm(function() {
    callback.pool_.onError(new Error('Callback \'' +
        callback.callbackDescription_ + '\' expired after ' + delay +
        ' ms during test step \'' + callback.stepDescription_ + '\''));
    callback.pool_.remove('expired.', callback.callback_.getRemainingUses());
    callback.callback_.deplete();
  }, delay);
};


/**
 * Invokes this callback.
 * @return {*} The return value of the FiniteUseCallback.
 */
jstestdriver.plugins.async.ExpiringCallback.prototype.invoke = function() {
  return this.callback_.invoke.apply(this.callback_, arguments);
};

/*
 * Copyright 2010 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


/**
 * @fileoverview Defines the FiniteUseCallback class, which decorates a
 * Javascript function by restricting the number of times the asynchronous
 * system may call it.
 *
 * @author rdionne@google.com (Robert Dionne)
 */

goog.provide('jstestdriver.plugins.async.FiniteUseCallback');

goog.require('jstestdriver');

/**
 * Constructs a FiniteUseCallback.
 *
 * @param {jstestdriver.plugins.async.CatchingCallback} callback A
 *     CatchingCallback.
 * @param {Function} onDepleted a function to execute when this
 *     FiniteUseCallback depletes.
 * @param {?number} opt_remainingUses the number of permitted uses remaining;
 *     defaults to one.
 * @constructor
 */
jstestdriver.plugins.async.FiniteUseCallback = function(
    callback, onDepleted, opt_remainingUses) {
  this.callback_ = callback;
  this.onDepleted_ = onDepleted;
  this.remainingUses_ = opt_remainingUses || 1;
};


/**
 * Depletes the remaining permitted uses.  Calls onDepleted.
 */
jstestdriver.plugins.async.FiniteUseCallback.prototype.deplete = function() {
  this.remainingUses_ = 0;
  if (this.onDepleted_) {
    this.onDepleted_.apply();
  }
};


/**
 * @return {number} The number of remaining permitted uses.
 */
jstestdriver.plugins.async.FiniteUseCallback.prototype.getRemainingUses =
    function() {
  return this.remainingUses_;
};


/**
 * Invokes this callback if it is usable. Calls onDepleted if invoking this
 * callback depletes its remaining permitted uses.
 * @param {...*} var_args The original callback arguments.
 * @return {*} The return value of the CatchingCallback or null.
 */
jstestdriver.plugins.async.FiniteUseCallback.prototype.invoke =
    function(var_args) {
  if (this.isUsable()) {
    try {
      this.remainingUses_ -= 1;
      return this.callback_.invoke.apply(this.callback_, arguments);
    } finally {
      if (this.onDepleted_ && !this.isUsable()) {
        this.onDepleted_.apply();
      }
    }
  }
};


/**
 * @return {boolean} True if any permitted uses remain.
 */
jstestdriver.plugins.async.FiniteUseCallback.prototype.isUsable = function() {
  return this.remainingUses_ > 0;
};
/*
 * Copyright 2010 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


/**
 * @fileoverview Defines the Timeout class.  The arm() method is equivalent to
 * window.setTimeout() and maybeDisarm() is equivalent to window.clearTimeout().
 *
 * @author rdionne@google.com (Robert Dionne)
 */

goog.provide('jstestdriver.plugins.async.Timeout');

goog.require('jstestdriver');

/**
 * Constructs a Timeout. Accepts alternate implementations of setTimeout and
 * clearTimeout.
 *
 * @param {Function} setTimeout The global setTimeout function to use.
 * @param {Function} clearTimeout The global clearTimeout function to use.
 * @constructor
 */
jstestdriver.plugins.async.Timeout = function(setTimeout, clearTimeout) {
  this.setTimeout_ = setTimeout;
  this.clearTimeout_ = clearTimeout;
  this.handle_ = null;
};


/**
 * Arms this Timeout to fire after the specified delay.
 *
 * @param {Function} callback The callback to call after the delay passes.
 * @param {number} delay The timeout delay in milliseconds.
 */
jstestdriver.plugins.async.Timeout.prototype.arm = function(callback, delay) {
  var self = this;
  this.handle_ = this.setTimeout_(function() {
    self.maybeDisarm();
    return callback.apply(null, arguments);
  }, delay);
};

/**
 * Explicitly disarms the timeout.
 * @private
 */
jstestdriver.plugins.async.Timeout.prototype.disarm_ = function() {
  this.clearTimeout_(this.handle_);
  this.handle_ = null;
};


/**
 * @return {boolean} True if the timeout is armed.
 */
jstestdriver.plugins.async.Timeout.prototype.isArmed = function() {
  return this.handle_ != null;
};


/**
 * Disarms the timeout if it is armed.
 */
jstestdriver.plugins.async.Timeout.prototype.maybeDisarm = function() {
  if (this.isArmed()) {
    this.disarm_();
  }
};
/*
 * Copyright 2010 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


/**
 * @fileoverview Defines the TestSafeCallbackBuilder class. It decorates a
 * Javascript function with several safeguards so that it may be safely executed
 * asynchronously within a test.
 *
 * The safeguards include:
 *   1) notifying the test runner about any exceptions thrown when the function
 *      executes
 *   2) restricting the number of times the asynchronous system may call the
 *      function
 *   3) restricting the length of time the asynchronous system may delay before
 *      calling the function
 *
 * @author rdionne@google.com (Robert Dionne)
 */

goog.provide('jstestdriver.plugins.async.TestSafeCallbackBuilder');

goog.require('jstestdriver');
goog.require('jstestdriver.plugins.async.CatchingCallback');
goog.require('jstestdriver.plugins.async.ExpiringCallback');
goog.require('jstestdriver.plugins.async.FiniteUseCallback');
goog.require('jstestdriver.plugins.async.Timeout');

/**
 * Constructs a TestSafeCallbackBuilder.
 *
 * @param {Function} opt_setTimeout the global setTimeout function to use.
 * @param {Function} opt_clearTimeout the global clearTimeout function to use.
 * @param {Function} opt_timeoutConstructor a constructor for obtaining new the
 *     Timeouts.
 * @constructor
 */
jstestdriver.plugins.async.TestSafeCallbackBuilder = function(
    opt_setTimeout, opt_clearTimeout, opt_timeoutConstructor) {
  this.setTimeout_ = opt_setTimeout || jstestdriver.setTimeout;
  this.clearTimeout_ = opt_clearTimeout || jstestdriver.clearTimeout;
  this.timeoutConstructor_ = opt_timeoutConstructor ||
      jstestdriver.plugins.async.Timeout;
  this.callbackDescription = 'Unknown callback.';
  this.stepDescription_ = 'Unknown step.';
  this.pool_ = null;
  this.remainingUses_ = null;
  this.testCase_ = null;
  this.wrapped_ = null;
};


/**
 * Returns the original function decorated with safeguards.
 * @return {*} The return value of the original callback.
 */
jstestdriver.plugins.async.TestSafeCallbackBuilder.prototype.build =
    function() {
  var catchingCallback = new jstestdriver.plugins.async.CatchingCallback(
      this.testCase_, this.pool_, this.wrapped_);
  var timeout = new (this.timeoutConstructor_)(
      this.setTimeout_, this.clearTimeout_);
  var onDepleted = function() {
    timeout.maybeDisarm();
  };
  var finiteUseCallback = new jstestdriver.plugins.async.FiniteUseCallback(
      catchingCallback, onDepleted, this.remainingUses_);
  return new jstestdriver.plugins.async.ExpiringCallback(
      this.pool_, finiteUseCallback, timeout,
      this.stepDescription_, this.callbackDescription_);
};


jstestdriver.plugins.async.TestSafeCallbackBuilder.
    prototype.setCallbackDescription = function(callbackDescription) {
  this.callbackDescription_ = callbackDescription;
  return this;
};


jstestdriver.plugins.async.TestSafeCallbackBuilder.
    prototype.setStepDescription = function(stepDescription) {
  this.stepDescription_ = stepDescription;
  return this;
};


/**
 * @param {jstestdriver.plugins.async.CallbackPool} pool the CallbackPool to
 *     contain the callback.
 * @return {jstestdriver.plugins.async.TestSafeCallbackBuilder} This.
 */
jstestdriver.plugins.async.TestSafeCallbackBuilder.prototype.setPool = function(
    pool) {
  this.pool_ = pool;
  return this;
};


/**
 * @param {number} remainingUses The remaining number of permitted calls.
 * @return {jstestdriver.plugins.async.TestSafeCallbackBuilder} This.
 */
jstestdriver.plugins.async.TestSafeCallbackBuilder.prototype.setRemainingUses =
    function(remainingUses) {
  this.remainingUses_ = remainingUses;
  return this;
};


/**
 * @param {Object} testCase The test case instance available as 'this' within
 *     the function's scope.
 * @return {jstestdriver.plugins.async.TestSafeCallbackBuilder} This.
 */
jstestdriver.plugins.async.TestSafeCallbackBuilder.prototype.setTestCase =
    function(testCase) {
  this.testCase_ = testCase;
  return this;
};


/**
 * @param {Function} wrapped The function wrapped by the above safeguards.
 * @return {jstestdriver.plugins.async.TestSafeCallbackBuilder} This.
 */
jstestdriver.plugins.async.TestSafeCallbackBuilder.prototype.setWrapped =
    function(wrapped) {
  this.wrapped_ = wrapped;
  return this;
};
/*
 * Copyright 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


/**
 * @fileoverview Defines the CallbackPool class, which decorates given callback
 * functions with safeguards and tracks them until they execute or expire.
 *
 * @author rdionne@google.com (Robert Dionne)
 */

goog.provide('jstestdriver.plugins.async.CallbackPool');

goog.require('jstestdriver');
goog.require('jstestdriver.plugins.async.TestSafeCallbackBuilder');

/**
 * Constructs a CallbackPool.
 *
 * @param {Function} setTimeout The global setTimeout function.
 * @param {Object} testCase The test case instance.
 * @param {Function} onPoolComplete A function to call when the pool empties.
 * @param {string} stepDescription A description of the current test step.
 * @param {boolean} opt_pauseForHuman Whether or not to pause for debugging.
 * @param {Function} opt_callbackBuilderConstructor An optional constructor for
 *     a callback builder.
 * @constructor
 */
jstestdriver.plugins.async.CallbackPool = function(setTimeout, testCase,
      onPoolComplete, stepDescription, opt_pauseForHuman,
      opt_callbackBuilderConstructor) {
  this.setTimeout_ = setTimeout;
  this.testCase_ = testCase;
  this.onPoolComplete_ = onPoolComplete;
  this.stepDescription_ = stepDescription;
  this.pauseForHuman_ = !!opt_pauseForHuman;
  this.callbackBuilderConstructor_ = opt_callbackBuilderConstructor ||
      jstestdriver.plugins.async.TestSafeCallbackBuilder;
  this.errors_ = [];
  this.count_ = 0;
  this.callbackIndex_ = 1;
  this.active_ = false;
};


/**
 * The number of milliseconds to wait before expiring a delinquent callback.
 */
jstestdriver.plugins.async.CallbackPool.TIMEOUT = 30000;


/**
 * Calls onPoolComplete if the pool is active and empty.
 */
jstestdriver.plugins.async.CallbackPool.prototype.maybeComplete = function() {
  if (this.active_ && this.count_ == 0 && this.onPoolComplete_) {
    var pool = this;
    this.setTimeout_(function() {
      pool.active_ = false;
      pool.onPoolComplete_(pool.errors_);
    }, 0);
  }
};


/**
 * Activates the pool and calls maybeComplete.
 */
jstestdriver.plugins.async.CallbackPool.prototype.activate = function() {
    this.active_ = true;
    this.maybeComplete();
};


/**
 * @return {number} The number of outstanding callbacks in the pool.
 */
jstestdriver.plugins.async.CallbackPool.prototype.count = function() {
  return this.count_;
};


/**
 * Accepts errors to later report them to the test runner via onPoolComplete.
 * @param {Error} error The error to report.
 */
jstestdriver.plugins.async.CallbackPool.prototype.onError = function(error) {
  this.errors_.push(error);
  this.count_ = 0;
  this.maybeComplete();
};


/**
 * Adds a callback function to the pool, optionally more than once.
 *
 * @param {Function} wrapped The callback function to decorate with safeguards
 *     and to add to the pool.
 * @param {number} opt_n The number of permitted uses of the given callback;
 *     defaults to one.
 * @param {number} opt_timeout The timeout in milliseconds.
 * @return {Function} A test safe callback.
 */
jstestdriver.plugins.async.CallbackPool.prototype.addCallback = function(
    wrapped, opt_n, opt_timeout, opt_description) {
  this.count_ += opt_n || 1;
  var callback = new (this.callbackBuilderConstructor_)()
      .setCallbackDescription(opt_description || '#' + this.callbackIndex_++)
      .setStepDescription(this.stepDescription_)
      .setPool(this)
      .setRemainingUses(opt_n)
      .setTestCase(this.testCase_)
      .setWrapped(wrapped)
      .build();
  if (!this.pauseForHuman_) {
    callback.arm(opt_timeout ||
        jstestdriver.plugins.async.CallbackPool.TIMEOUT);
  }
  return function() {
    return callback.invoke.apply(callback, arguments);
  };
};


/**
 * Adds a callback function to the pool, optionally more than once.
 *
 * @param {Function} wrapped The callback function to decorate with safeguards
 *     and to add to the pool.
 * @param {number} opt_n The number of permitted uses of the given callback;
 *     defaults to one.
 * @deprecated Use CallbackPool#addCallback().
 */
jstestdriver.plugins.async.CallbackPool.prototype.add =
    jstestdriver.plugins.async.CallbackPool.prototype.addCallback;


/**
 * @return {Function} An errback function to attach to an asynchronous system so
 *     that the test runner can be notified in the event of error.
 * @param {string} message A message to report to the user upon error.
 */
jstestdriver.plugins.async.CallbackPool.prototype.addErrback = function(
    message) {
  var pool = this;
  return function() {
    pool.onError(new Error(
        'Errback ' + message + ' called with arguments: ' +
            Array.prototype.slice.call(arguments)));
  };
};


/**
 * Removes a callback from the pool, optionally more than one.
 *
 * @param {string} message A message to pass to the pool for logging purposes;
 *     usually the reason that the callback was removed from the pool.
 * @param {number} opt_n The number of callbacks to remove from the pool.
 */
jstestdriver.plugins.async.CallbackPool.prototype.remove = function(
    message, opt_n) {
  if (this.count_ > 0) {
    this.count_ -= opt_n || 1;
    this.maybeComplete();
  }
};
/*
 * Copyright 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


/**
 * @fileoverview Defines the CallbackPoolDelegate class. Encapsulates a
 * CallbackPool behind a narrower interface. Also, validates arguments.
 *
 * @author rdionne@google.com (Robert Dionne)
 */

goog.provide('jstestdriver.plugins.async.CallbackPoolDelegate');

goog.require('jstestdriver');

/**
 * Constructs a CallbackPoolDelegate.
 * @param {jstestdriver.plugins.async.CallbackPool} pool The pool.
 * @constructor
 * @export
 */
jstestdriver.plugins.async.CallbackPoolDelegate = function(pool) {
  this.pool_ = pool;
};


/**
 * Adds a callback to the pool.
 * @param {Object|Function} callback The callback to wrap.
 * @param {number=} opt_n An optional number of times to wait for the callback to
 *     be called.
 * @param {number=} opt_timeout The timeout in milliseconds.
 * @param {string=} opt_description The callback description.
 * @return {Function} The wrapped callback.
 * @export
 */
jstestdriver.plugins.async.CallbackPoolDelegate.prototype.addCallback = function(
    callback, opt_n, opt_timeout, opt_description) {
  if (typeof callback == 'object') {
    var params = callback;
    callback = params['callback'];
    opt_n = params['invocations'];
    opt_timeout = params['timeout'] ? params['timeout'] * 1000 : undefined;
    opt_description = params['description'];
  }

  if (typeof callback == 'function' && callback) {
    return this.pool_.addCallback(
        callback, opt_n, opt_timeout, opt_description);
  }

  return null;
};


/**
 * @return {Function} An errback function to attach to an asynchronous system so
 *     that the test runner can be notified in the event of error.
 * @param {string} message A message to report to the user upon error.
 * @export
 */
jstestdriver.plugins.async.CallbackPoolDelegate.prototype.addErrback = function(
    message) {
  return this.pool_.addErrback(message);
};


/**
 * Adds a callback to the pool.
 * @param {Object|Function} callback The callback to wrap.
 * @param {number=} opt_n An optional number of times to wait for the callback to
 *     be called.
 * @param {number=} opt_timeout The timeout in milliseconds.
 * @param {string=} opt_description The callback description.
 * @return {Function} The wrapped callback.
 * @export
 */
jstestdriver.plugins.async.CallbackPoolDelegate.prototype.add =
    jstestdriver.plugins.async.CallbackPoolDelegate.prototype.addCallback;


/**
 * A no-op callback that's useful for waiting until an asynchronous operation
 * completes without performing any action.
 * @param {Object|number=} opt_n An optional number of times to wait for the
 *     callback to be called.
 * @param {number=} opt_timeout The timeout in milliseconds.
 * @param {string=} opt_description The description.
 * @return {Function} A noop callback.
 * @export
 */
jstestdriver.plugins.async.CallbackPoolDelegate.prototype.noop = function(
    opt_n, opt_timeout, opt_description) {
  if (typeof opt_n == 'object') {
    var params = opt_n;
    opt_timeout = params['timeout'] ? params['timeout'] * 1000 : undefined;
    opt_description = params['description'];
    opt_n = params['invocations'];
  }
  return this.pool_.addCallback(
      jstestdriver.EMPTY_FUNC, opt_n, opt_timeout, opt_description);
};
/*
 * Copyright 2010 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


/**
 * @fileoverview Defines the DeferredQueue class.
 *
 * @author rdionne@google.com (Robert Dionne)
 */

goog.provide('jstestdriver.plugins.async.DeferredQueue');

goog.require('jstestdriver');
goog.require('jstestdriver.plugins.async.DeferredQueueDelegate');
goog.require('jstestdriver.plugins.async.CallbackPool');
goog.require('jstestdriver.plugins.async.CallbackPoolDelegate');

/**
 * Constructs a DeferredQueue.
 * @param {Function} setTimeout The setTimeout function.
 * @param {Object} testCase The test case that owns this queue.
 * @param {Function} onQueueComplete The queue complete callback.
 * @param {jstestdriver.plugins.async.DeferredQueueDelegate} delegate The
 *     delegate wrapping all DeferredQueues for this test run0.
 * @param {boolean} opt_pauseForHuman Whether or not to pause for debugging.
 * @param {Function} opt_queueConstructor The DeferredQueue constructor.
 * @param {Function} opt_queueDelegateConstructor The DeferredQueueDelegate
 *     constructor.
 * @param {Function} opt_poolConstructor The CallbackPool constructor.
 * @param {Function} opt_poolDelegateConstructor The CallbackPoolDelegate constructor.
 * @constructor
 */
jstestdriver.plugins.async.DeferredQueue = function(setTimeout, testCase,
    onQueueComplete, delegate, opt_pauseForHuman, opt_queueConstructor,
    opt_queueDelegateConstructor, opt_poolConstructor, opt_poolDelegateConstructor) {
  this.setTimeout_ = setTimeout;
  this.testCase_ = testCase;
  this.onQueueComplete_ = onQueueComplete;
  this.delegate_ = delegate;
  this.pauseForHuman_ = !!opt_pauseForHuman;
  this.queueConstructor_ = opt_queueConstructor ||
      jstestdriver.plugins.async.DeferredQueue;
  this.queueDelegateConstructor_ = opt_queueDelegateConstructor ||
      jstestdriver.plugins.async.DeferredQueueDelegate;
  this.poolConstructor_ = opt_poolConstructor ||
      jstestdriver.plugins.async.CallbackPool;
  this.poolDelegateConstructor_ = opt_poolDelegateConstructor ||
      jstestdriver.plugins.async.CallbackPoolDelegate;
  this.descriptions_ = [];
  this.operations_ = [];
  this.errors_ = [];
};


/**
 * Executes a step of the test.
 * @param {Function} operation The next test step.
 * @param {Function} onQueueComplete The queue complete callback.
 * @private
 */
jstestdriver.plugins.async.DeferredQueue.prototype.execute_ = function(
    description, operation, onQueueComplete) {
  var queue = new (this.queueConstructor_)(this.setTimeout_,
      this.testCase_, onQueueComplete, this.delegate_, this.pauseForHuman_);
  this.delegate_.setQueue(queue);

  var onPoolComplete = function(errors) {
    queue.finishStep_(errors);
  };
  var pool = new (this.poolConstructor_)(
      this.setTimeout_, this.testCase_, onPoolComplete, description, this.pauseForHuman_);
  var poolDelegate = new (this.poolDelegateConstructor_)(pool);

  if (operation) {
    try {
      operation.call(this.testCase_, poolDelegate, this.delegate_);
    } catch (e) {
      pool.onError(e);
    }
  }

  pool.activate();
};


/**
 * Enqueues a test step.
 * @param {string} description The test step description.
 * @param {Function} operation The test step to add to the queue.
 */
jstestdriver.plugins.async.DeferredQueue.prototype.defer = function(
    description, operation) {
  this.descriptions_.push(description);
  this.operations_.push(operation);
};


/**
 * Starts the next test step.
 */
jstestdriver.plugins.async.DeferredQueue.prototype.startStep = function() {
  var nextDescription = this.descriptions_.shift();
  var nextOp = this.operations_.shift();
  if (nextOp) {
    var q = this;
    this.execute_(nextDescription, nextOp, function(errors) {
      q.finishStep_(errors);
    });
  } else {
    this.onQueueComplete_([]);
  }
};


/**
 * Finishes the current test step.
 * @param {Array.<Error>} errors An array of any errors that occurred during the
 *     previous test step.
 * @private
 */
jstestdriver.plugins.async.DeferredQueue.prototype.finishStep_ = function(
    errors) {
  this.errors_ = this.errors_.concat(errors);
  if (this.errors_.length) {
    this.onQueueComplete_(this.errors_);
  } else {
    this.startStep();
  }
};
/*
 * Copyright 2010 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


/**
 * @fileoverview Defines the DeferredQueueInterface class. Encapsulates a
 * DeferredQueue behind a narrower interface. Also, validates arguments.
 *
 * @author rdionne@google.com (Robert Dionne)
 */

goog.provide('jstestdriver.plugins.async.DeferredQueueDelegate');

goog.require('jstestdriver');

/**
 * Constructs a DeferredQueueDelegate.
 * @param {function(Object)} toJson a function to convert objects to JSON.
 * @constructor
 * @export
 */
jstestdriver.plugins.async.DeferredQueueDelegate = function(toJson) {
  this.toJson_ = toJson;
  this.q_ = null;
  this.step_ = 1;
};


/**
 * Sets the current queue instance.
 * @param {jstestdriver.plugins.async.DeferredQueue} queue The queue.
 */
jstestdriver.plugins.async.DeferredQueueDelegate.prototype.setQueue = function(
    queue) {
  this.q_ = queue;
};


/**
 * Adds a function to the queue to call later.
 * @param {string|Function} description The description or function.
 * @param {Function=} operation The function.
 * @return {jstestdriver.plugins.async.DeferredQueueDelegate} This.
 * @export
 */
jstestdriver.plugins.async.DeferredQueueDelegate.prototype.call = function(
    description, operation) {
  if (!this.q_) {
    throw new Error('Queue undefined!');
  }

  if (typeof description == 'function') {
    operation = description;
    description = this.nextDescription_();
  }

  if (typeof description == 'object') {
    operation = description.operation;
    description = description.description;
  }

  if (!description) {
    description = this.nextDescription_();
  }

  if (operation) {
    this.q_.defer(description, operation);
    this.step_ += 1;
  }

  return this;
};


/**
 * @return {string} A description for the next step.
 */
jstestdriver.plugins.async.DeferredQueueDelegate.prototype.nextDescription_ =
    function() {
  return '#' + this.step_;
};


/**
 * Adds a function to the queue to call later.
 * @param {string|Function} description The description or function.
 * @param {Function=} operation The function.
 * @deprecated Use DeferredQueueDelegate#call().
 * @export
 */
jstestdriver.plugins.async.DeferredQueueDelegate.prototype.defer =
    jstestdriver.plugins.async.DeferredQueueDelegate.prototype.call;
/*
 * Copyright 2010 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


/**
 * @fileoverview Defines the TestStage class.
 * @author rdionne@google.com (Robert Dionne)
 */

goog.provide('jstestdriver.plugins.async.TestStage');
goog.provide('jstestdriver.plugins.async.TestStage.Builder');

goog.require('jstestdriver');
goog.require('jstestdriver.setTimeout');
goog.require('jstestdriver.plugins.async.DeferredQueueDelegate');
goog.require('jstestdriver.plugins.async.DeferredQueue');

/**
 * Constructs a TestStage.
 *
 * A TestStage is an executable portion of a test, such as setUp, tearDown, or
 * the test method.
 *
 * @param {Function} onError An error handler.
 * @param {Function} onStageComplete A callback for stage completion.
 * @param {Object} testCase The test case that owns this test stage.
 * @param {Function} testMethod The test method this stage represents.
 * @param {function(Object)} toJson a function to convert objects to JSON.
 * @param {Object} opt_argument An argument to pass to the test method.
 * @param {boolean} opt_pauseForHuman Whether to pause for debugging.
 * @param {Function} opt_queueDelegateConstructor The constructor of
 * DeferredQueueDelegate.
 * @param {Function} opt_queueConstructor The constructor of DeferredQueue.
 * @param {Function} opt_setTimeout The setTimeout function or suitable
 *     replacement.
 * @constructor
 */
jstestdriver.plugins.async.TestStage = function(
    onError, onStageComplete, testCase, testMethod, toJson, opt_argument,
    opt_pauseForHuman, opt_queueDelegateConstructor, opt_queueConstructor,
    opt_setTimeout) {
  this.onError_ = onError;
  this.onStageComplete_ = onStageComplete;
  this.testCase_ = testCase;
  this.testMethod_ = testMethod;
  this.toJson_ = toJson;
  this.argument_ = opt_argument;
  this.pauseForHuman_ = !!opt_pauseForHuman;
  this.queueDelegateConstructor_ = opt_queueDelegateConstructor ||
      jstestdriver.plugins.async.DeferredQueueDelegate;
  this.queueConstructor_ = opt_queueConstructor ||
      jstestdriver.plugins.async.DeferredQueue;
  this.setTimeout_ = opt_setTimeout || jstestdriver.setTimeout;
};


/**
 * Executes this TestStage.
 */
jstestdriver.plugins.async.TestStage.prototype.execute = function() {
  var delegate = new (this.queueDelegateConstructor_)(this.toJson_);
  var queue = new (this.queueConstructor_)(this.setTimeout_, this.testCase_,
      this.onStageComplete_, delegate, this.pauseForHuman_);
  delegate.setQueue(queue);

  if (this.testMethod_) {
    try {
      this.testMethod_.call(this.testCase_, delegate, this.argument_);
    } catch (e) {
      this.onError_(e);
    }
  }

  queue.startStep();
};



/**
 * Constructor for a Builder of TestStages. Used to avoid confusion when
 * trying to construct TestStage objects (as the constructor takes a lot
 * of parameters of similar types).
 * @constructor
 */
jstestdriver.plugins.async.TestStage.Builder = function() {
  this.onError_ = null;
  this.onStageComplete_ = null;
  this.testCase_ = null;
  this.testMethod_ = null;
  this.toJson_ = null;
  this.opt_argument_ = null;
  this.opt_pauseForHuman_ = null;
  this.opt_queueDelegateConstructor_ =
      jstestdriver.plugins.async.DeferredQueueDelegate;
  this.opt_queueConstructor_ = jstestdriver.plugins.async.DeferredQueue;
  this.opt_setTimeout_ = jstestdriver.setTimeout;
};


// Setters for the various fields; they return the Builder instance to allow
// method call chaining.
jstestdriver.plugins.async.TestStage.Builder.prototype.setOnError =
    function(onError) {
  this.onError_ = onError;
  return this;
};


jstestdriver.plugins.async.TestStage.Builder.prototype.setOnStageComplete =
    function(onStageComplete) {
  this.onStageComplete_ = onStageComplete;
  return this;
};


jstestdriver.plugins.async.TestStage.Builder.prototype.setTestCase =
    function(testCase) {
  this.testCase_ = testCase;
  return this;
};


jstestdriver.plugins.async.TestStage.Builder.prototype.setTestMethod =
    function(testMethod) {
  this.testMethod_ = testMethod;
  return this;
};


jstestdriver.plugins.async.TestStage.Builder.prototype.setToJson =
    function(toJson) {
  this.toJson_ = toJson;
  return this;
};


jstestdriver.plugins.async.TestStage.Builder.prototype.setArgument =
    function(argument) {
  this.opt_argument_ = argument;
  return this;
};


jstestdriver.plugins.async.TestStage.Builder.prototype.setPauseForHuman =
    function(pauseForHuman) {
  this.opt_pauseForHuman_ = pauseForHuman;
  return this;
};


jstestdriver.plugins.async.TestStage.Builder.prototype.
    setQueueDelegateConstructor = function(queueDelegateConstructor) {
  this.opt_queueDelegateConstructor_ = queueDelegateConstructor;
  return this;
};


jstestdriver.plugins.async.TestStage.Builder.prototype.setQueueConstructor =
    function(queueConstructor) {
  this.opt_queueConstructor_ = queueConstructor;
  return this;
};


jstestdriver.plugins.async.TestStage.Builder.prototype.setTimeoutSetter =
    function(setTimeout) {
  this.opt_setTimeout_ = setTimeout;
  return this;
};


jstestdriver.plugins.async.TestStage.Builder.prototype.build = function() {
  return new jstestdriver.plugins.async.TestStage(
      this.onError_, this.onStageComplete_, this.testCase_, this.testMethod_,
      this.toJson_, this.opt_argument_, this.opt_pauseForHuman_,
      this.opt_queueDelegateConstructor_, this.opt_queueConstructor_,
      this.opt_setTimeout_);
};
/*
 * Copyright 2009 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
jstestdriver.plugins.ScriptLoader = function(win, dom, testCaseManager, now) {
  this.win_ = win;
  this.dom_ = dom;
  this.testCaseManager_ = testCaseManager;
  this.now_ = now;
};


jstestdriver.plugins.ScriptLoader.prototype.load = function(file, callback) {
  this.testCaseManager_.removeTestCaseForFilename(file.fileSrc);
  this.fileResult_ = null;
  var head = this.dom_.getElementsByTagName('head')[0];
  var script = this.dom_.createElement('script');
  var start = this.now_();

  if (!jstestdriver.jQuery.browser.opera) {
    script.onload = jstestdriver.bind(this, function() {
      this.cleanCallBacks(script)
      this.onLoad_(file, callback, start);
    });
  }
  script.onreadystatechange = jstestdriver.bind(this, function() {
    if (script.readyState === "loaded" || script.readyState === "complete") {
      this.cleanCallBacks(script)
      this.onLoad_(file, callback, start);
    }
  });

  var handleError = jstestdriver.bind(this, function(msg, url, line) {
    this.testCaseManager_.removeTestCaseForFilename(file.fileSrc);
    var loadMsg = 'error loading file: ' + file.fileSrc;

    if (line != undefined && line != null) {
      loadMsg += ':' + line;
    }
    if (msg != undefined && msg != null) {
      loadMsg += ': ' + msg;
    }
    this.cleanCallBacks(script)
    callback(new jstestdriver.FileResult(file, false, loadMsg));
  });
  this.win_.onerror = handleError; 
  script.onerror = handleError;

  script.type = "text/javascript";
  script.src = file.fileSrc;
  head.appendChild(script);

};

jstestdriver.plugins.ScriptLoader.prototype.cleanCallBacks = function(script) {
  script.onerror = jstestdriver.EMPTY_FUNC;
  script.onload = jstestdriver.EMPTY_FUNC;
  script.onreadystatechange = jstestdriver.EMPTY_FUNC;
  this.win_.onerror = jstestdriver.EMPTY_FUNC;
};


jstestdriver.plugins.ScriptLoader.prototype.onLoad_ =
    function(file, callback, start) {
  this.testCaseManager_.updateLatestTestCase(file.fileSrc);
  var result = new jstestdriver.FileResult(file, true, '', this.now_() - start);
  this.win_.onerror = jstestdriver.EMPTY_FUNC;
  callback(result);
};


jstestdriver.plugins.ScriptLoader.prototype.updateResult_ = function(fileResult) {
  if (this.fileResult_ == null) {
    this.fileResult_ = fileResult;
  }
};
/*
 * Copyright 2009 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
jstestdriver.plugins.StylesheetLoader = function(win, dom, synchronousCallback) {
  this.win_ = win;
  this.dom_ = dom;
  this.synchronousCallback_ = synchronousCallback;
};


jstestdriver.plugins.StylesheetLoader.prototype.load = function(file, callback) {
  this.fileResult_ = null;
  var head = this.dom_.getElementsByTagName('head')[0];
  var link = this.dom_.createElement('link');
  var handleError = jstestdriver.bind(this, function(msg, url, line) {
    var loadMsg = 'error loading file: ' + file.fileSrc;

    if (line != undefined && line != null) {
      loadMsg += ':' + line;
    }
    if (msg != undefined && msg != null) {
      loadMsg += ': ' + msg;
    }
    this.updateResult_(new jstestdriver.FileResult(file, false, loadMsg));
  });

  this.win_.onerror = handleError;
  link.onerror = handleError;
  if (!jstestdriver.jQuery.browser.opera) {
    link.onload = jstestdriver.bind(this, function() {
      this.onLoad_(file, callback);
    });
  }
  link.onreadystatechange = jstestdriver.bind(this, function() {
    if (link.readyState == 'loaded') {
      this.onLoad_(file, callback);
    }
  });
  link.type = "text/css";
  link.rel = "stylesheet";
  link.href = file.fileSrc;
  head.appendChild(link);

  // Firefox and Safari don't seem to support onload or onreadystatechange for link
  if (this.synchronousCallback_) {
    this.onLoad_(file, callback);
  }
};


jstestdriver.plugins.StylesheetLoader.prototype.onLoad_ = function(file, callback) {
  this.updateResult_(new jstestdriver.FileResult(file, true, ''));
  this.win_.onerror = jstestdriver.EMPTY_FUNC;
  callback(this.fileResult_);  
};


jstestdriver.plugins.StylesheetLoader.prototype.updateResult_ = function(fileResult) {
  if (this.fileResult_ == null) {
    this.fileResult_ = fileResult;
  }
};
/*
 * Copyright 2009 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
jstestdriver.plugins.FileLoaderPlugin = function(scriptLoader, stylesheetLoader) {
  this.scriptLoader_ = scriptLoader;
  this.stylesheetLoader_ = stylesheetLoader;
};


jstestdriver.plugins.FileLoaderPlugin.prototype.loadSource = function(file, onSourceLoaded) {
  if (file.fileSrc.match(/\.css$/)) {
    this.stylesheetLoader_.load(file, onSourceLoaded);
  } else {
    this.scriptLoader_.load(file, onSourceLoaded);
  }
};
/*
 * Copyright 2009 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

/**
 * @param dateObj
 * @param clearBody
 * @param opt_runTestLoop
 * @constructor
 */
jstestdriver.plugins.TestRunnerPlugin = function(dateObj, clearBody, opt_runTestLoop) {
  this.dateObj_ = dateObj;
  this.clearBody_ = clearBody;
  this.boundRunTest_ = jstestdriver.bind(this, this.runTest);
  this.runTestLoop_ = opt_runTestLoop || jstestdriver.plugins.defaultRunTestLoop;
};


jstestdriver.plugins.timedProcessArray = function(interval, array, process, finish, now, setTimeout)
{
  var items = array.concat(); //clone the array
  setTimeout(function nestedFunction(){
    var start = now();
    do{
      process(items.shift());
    }while(items.length > 0 && (now() - start < interval));

    if (items.length > 0){
      setTimeout(nestedFunction, 25);
    }else{
      finish();
    }
  }, 25);
};


jstestdriver.plugins.createPausingRunTestLoop =
    function (interval, now, setTimeout) {
  var lastPause;
  function pausingRunTestLoop(testCaseName,
                                template,
                                tests,
                                runTest,
                                onTest,
                                onComplete) {
      jstestdriver.plugins.timedProcessArray(interval, tests, function(oItem){
      onTest(runTest(testCaseName, template, oItem));
    }, onComplete, now, setTimeout);
  }
  return pausingRunTestLoop;
};


jstestdriver.plugins.pausingRunTestLoop =
    jstestdriver.plugins.createPausingRunTestLoop(
        50,
        jstestdriver.now,
        jstestdriver.setTimeout);


jstestdriver.plugins.defaultRunTestLoop =
    function(testCaseName, template, tests, runTest, onTest, onComplete) {
  for (var i = 0; tests[i]; i++) {
    onTest(runTest(testCaseName, template, tests[i]));
  }
  onComplete();
};


jstestdriver.plugins.TestRunnerPlugin.prototype.runTestConfiguration =
    function(testRunConfiguration, onTestDone, onTestRunConfigurationComplete) {
  var testCaseInfo = testRunConfiguration.getTestCaseInfo();
  var tests = testRunConfiguration.getTests();
  var size = tests.length;

  if (testCaseInfo.getType() != jstestdriver.TestCaseInfo.DEFAULT_TYPE) {
    for (var i = 0; tests[i]; i++) {
      onTestDone(new jstestdriver.TestResult(
          testCaseInfo.getTestCaseName(),
          tests[i],
          'error',
          testCaseInfo.getTestCaseName() +
            ' is an unhandled test case: ' +
            testCaseInfo.getType(),
          '',
          0));
    }
    onTestRunConfigurationComplete();
    return;
  }

  this.runTestLoop_(testCaseInfo.getTestCaseName(),
                    testCaseInfo.getTemplate(),
                    tests,
                    this.boundRunTest_,
                    onTestDone,
                    onTestRunConfigurationComplete)
};


jstestdriver.plugins.TestRunnerPlugin.prototype.runTest =
    function(testCaseName, testCase, testName) {
  var testCaseInstance;
  var errors = [];
  try {
    try {
      testCaseInstance = new testCase();
    } catch (e) {
      return new jstestdriver.TestResult(
          testCaseName,
          testName,
          jstestdriver.TestResult.RESULT.ERROR,
          testCaseName + ' is not a test case',
          '',
          0);
    }
    var start = new this.dateObj_().getTime();

    jstestdriver.expectedAssertCount = -1;
    jstestdriver.assertCount = 0;
    var res = jstestdriver.TestResult.RESULT.PASSED;
    try {
      if (testCaseInstance.setUp) {
        testCaseInstance.setUp();
      }
      if (!(testName in testCaseInstance)) {
        var err = new Error(testName + ' not found in ' + testCaseName);
        err.name = 'AssertError';
        throw err;
      }
      testCaseInstance[testName]();
      if (jstestdriver.expectedAssertCount != -1 &&
          jstestdriver.expectedAssertCount != jstestdriver.assertCount) {
        var err = new Error("Expected '" +
            jstestdriver.expectedAssertCount +
            "' asserts but '" +
            jstestdriver.assertCount +
            "' encountered.");

        err.name = 'AssertError';
        throw err;
      }
    } catch (e) {
      // We use the global here because of a circular dependency. The isFailure plugin should be
      // refactored.
      res = jstestdriver.pluginRegistrar.isFailure(e) ?
          jstestdriver.TestResult.RESULT.FAILED :
            jstestdriver.TestResult.RESULT.ERROR;
      errors.push(e);
    }
    try {
      if (testCaseInstance.tearDown) {
        testCaseInstance.tearDown();
      }
      this.clearBody_();
    } catch (e) {
      if (res == jstestdriver.TestResult.RESULT.PASSED) {
        res = jstestdriver.TestResult.RESULT.ERROR;
      }
      errors.push(e);
    }
    var end = new this.dateObj_().getTime();
    var msg = this.serializeError(errors);
    return new jstestdriver.TestResult(testCaseName, testName, res, msg,
            jstestdriver.console.getAndResetLog(), end - start);
  } catch (e) {
    errors.push(e);
    return new jstestdriver.TestResult(testCaseName, testName,
            'error', 'Unexpected runner error: ' + this.serializeError(errors),
            jstestdriver.console.getAndResetLog(), 0);
  }
};

/**
 *@param {Error} e
 */
jstestdriver.plugins.TestRunnerPlugin.prototype.serializeError = function(e) {
  return jstestdriver.utils.serializeErrors(e);
};
/*
 * Copyright 2010 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


/**
 * @fileoverview Defines the AsyncTestRunnerPlugin class, which executes
 * asynchronous test cases within JsTestDriver.
 *
 *     +----------------------------- more tests? ------------ nextTest() <--------------+
 *     |                                                                                 |
 *     v                                                                                 |
 * startSetUp() ---- execute ---> finishSetUp(errors)                                    |
 *                                     |                                                 |
 * startTestMethod() <--- no errors ---+---- errors ----+                                |
 *        |                                             |                                |
 *     execute                                          |                                |
 *        |                                             |                                |
 *        v                                             v                                |
 * finishTestMethod(errors) -- errors or no errors -> startTearDown() -- execute -> finishTearDown(errors)
 *
 * @author rdionne@google.com (Robert Dionne)
 */

goog.provide('jstestdriver.plugins.async.AsyncTestRunnerPlugin');

goog.require('jstestdriver');
goog.require('jstestdriver.setTimeout');
goog.require('jstestdriver.TestCaseInfo');
goog.require('jstestdriver.TestResult');
goog.require('jstestdriver.plugins.async.CallbackPool');
goog.require('jstestdriver.plugins.async.CallbackPoolDelegate');
goog.require('jstestdriver.plugins.async.DeferredQueue');
goog.require('jstestdriver.plugins.async.DeferredQueueDelegate');
goog.require('jstestdriver.plugins.async.TestStage');
goog.require('jstestdriver.plugins.async.TestStage.Builder');

/**
 * Constructs an AsyncTestRunnerPlugin.
 *
 * @param {Function} dateObj the date object constructor
 * @param {Function} clearBody a function to call to clear the document body.
 * @param {Function} toJson a function to call to convert an object to JSON.
 * @param {boolean} opt_pauseForHuman Whether to pause for debugging.
 * @param {Function} opt_setTimeout window.setTimeout replacement.
 * @param {Function} opt_queueConstructor a constructor for obtaining new
 *     DeferredQueues.
 * @param {Function} opt_queueDelegateConstructor a constructor for obtaining new
 *     DeferredQueueDelegates.
 * @constructor
 */
jstestdriver.plugins.async.AsyncTestRunnerPlugin = function(dateObj, clearBody,
      toJson, opt_pauseForHuman, opt_setTimeout, opt_queueConstructor,
      opt_queueDelegateConstructor) {
  this.name = "AsyncTestRunnerPlugin";
  this.dateObj_ = dateObj;
  this.clearBody_ = clearBody;
  this.toJson_ = toJson;
  this.pauseForHuman_ = !!opt_pauseForHuman;
  this.setTimeout_ = opt_setTimeout || jstestdriver.setTimeout;
  this.queueConstructor_ = opt_queueConstructor || jstestdriver.plugins.async.DeferredQueue;
  this.queueDelegateConstructor_ = opt_queueDelegateConstructor ||
      jstestdriver.plugins.async.DeferredQueueDelegate;
  this.testRunConfiguration_ = null;
  this.testCaseInfo_ = null;
  this.onTestDone_ = null;
  this.onTestRunConfigurationComplete_ = null;
  this.testIndex_ = 0;
  this.testCase_ = null;
  this.testName_ = null;
  this.start_ = null;
  this.errors_ = null;
};

/**
 * Runs a test case.
 *
 * @param {jstestdriver.TestRunConfiguration} testRunConfiguration the test 
 *        case configuration
 * @param {function(jstestdriver.TestResult)} onTestDone the function to call to 
 *        report a test is complete
 * @param {function()=} opt_onTestRunConfigurationComplete the function to call 
 *        to report a test case is complete. A no-op will be used if this is
 *        not specified.
 */
jstestdriver.plugins.async.AsyncTestRunnerPlugin.prototype.runTestConfiguration = function(
    testRunConfiguration, onTestDone, opt_onTestRunConfigurationComplete) {
  if (testRunConfiguration.getTestCaseInfo().getType() == jstestdriver.TestCaseInfo.ASYNC_TYPE) {
    this.testRunConfiguration_ = testRunConfiguration;
    this.testCaseInfo_ = testRunConfiguration.getTestCaseInfo();
    this.onTestDone_ = onTestDone;
    this.onTestRunConfigurationComplete_ = opt_onTestRunConfigurationComplete ||
        function() {};
    this.testIndex_ = 0;
    this.nextTest();
    return true;
  }

  return false;
};

/**
 * Runs the next test in the current test case.
 */
jstestdriver.plugins.async.AsyncTestRunnerPlugin.prototype.nextTest = function() {
  this.start_ = new this.dateObj_().getTime();
  if (this.testIndex_ < this.testRunConfiguration_.getTests().length) {
    jstestdriver.expectedAssertCount = -1;
    jstestdriver.assertCount = 0;
    this.testCase_ = new (this.testCaseInfo_.getTemplate());
    this.testName_ = this.testRunConfiguration_.getTests()[this.testIndex_];
    this.errors_ = [];
    this.startSetUp();
  } else {
    this.testRunConfiguration_ = null;
    this.testCaseInfo_ = null;
    this.onTestDone_ = null;
    this.testIndex_ = 0;
    this.testCase_ = null;
    this.testName_ = null;
    this.start_ = null;
    this.errors_ = null;

    // Unset this callback before running it because the next callback may be
    // set by the code run by the callback.
    var onTestRunConfigurationComplete = this.onTestRunConfigurationComplete_;
    this.onTestRunConfigurationComplete_ = null;
    onTestRunConfigurationComplete.call(this);
  }
};


/**
 * Starts the next phase of the current test in the current test case. Creates a
 * DeferredQueue to manage the steps of this phase, executes the phase
 * catching any exceptions, and then hands the control over to the queue to
 * call onQueueComplete when it empties.
 */
jstestdriver.plugins.async.AsyncTestRunnerPlugin.prototype.execute_ = function(
    onStageComplete, invokeMethod) {
  var runner = this;
  var onError = function(error) {runner.errors_.push(error);};
  var arguments = this.testRunConfiguration_.getArguments();
  var argument = arguments ? arguments[this.testName_] : null;
  var stage = new jstestdriver.plugins.async.TestStage.Builder().
      setOnError(onError).
      setOnStageComplete(onStageComplete).
      setTestCase(this.testCase_).
      setTestMethod(invokeMethod).
      setArgument(argument).
      setPauseForHuman(this.pauseForHuman_).
      setQueueDelegateConstructor(this.queueDelegateConstructor_).
      setQueueConstructor(this.queueConstructor_).
      setTimeoutSetter(this.setTimeout_).
      setToJson(this.toJson_).
      build();
  stage.execute();
};


/**
 * Starts the setUp phase.
 */
jstestdriver.plugins.async.AsyncTestRunnerPlugin.prototype.startSetUp = function() {
  var runner = this;
  this.execute_(function(errors) {
    runner.finishSetUp(errors);
  }, this.testCase_['setUp']);
};

/**
 * Finishes the setUp phase and reports any errors. If there are errors it
 * initiates the tearDown phase, otherwise initiates the testMethod phase.
 *
 * @param errors errors caught during the current asynchronous phase.
 */
jstestdriver.plugins.async.AsyncTestRunnerPlugin.prototype.finishSetUp = function(errors) {
  this.errors_ = this.errors_.concat(errors);
  if (this.errors_.length) {
    this.startTearDown();
  } else {
    this.startTestMethod();
  }
};

/**
 * Starts the testMethod phase.
 */
jstestdriver.plugins.async.AsyncTestRunnerPlugin.prototype.startTestMethod = function() {
  var runner = this;
  this.execute_(function(errors) {
    runner.finishTestMethod(errors);
  }, this.testCase_[this.testName_]);
};

/**
 * Finishes the testMethod phase and reports any errors. Continues with the
 * tearDown phase.
 *
 * @param errors errors caught during the current asynchronous phase.
 */
jstestdriver.plugins.async.AsyncTestRunnerPlugin.prototype.finishTestMethod = function(errors) {
  this.errors_ = this.errors_.concat(errors);
  this.startTearDown();
};


/**
 * Start the tearDown phase.
 */
jstestdriver.plugins.async.AsyncTestRunnerPlugin.prototype.startTearDown = function() {
  var runner = this;
  this.execute_(function(errors){
    runner.finishTearDown(errors);
  }, this.testCase_['tearDown']);
};


/**
 * Finishes the tearDown phase and reports any errors. Submits the test results
 * to the test runner. Continues with the next test.
 *
 * @param errors errors caught during the current asynchronous phase.
 */
jstestdriver.plugins.async.AsyncTestRunnerPlugin.prototype.finishTearDown = function(errors) {
  this.errors_ = this.errors_.concat(errors);
  this.clearBody_();
  this.onTestDone_(this.buildResult());
  this.testIndex_ += 1;
  this.nextTest();
};

/**
 * Builds a test result.
 */
jstestdriver.plugins.async.AsyncTestRunnerPlugin.prototype.buildResult = function() {
  var end = new this.dateObj_().getTime();
  var result = jstestdriver.TestResult.RESULT.PASSED;
  var message = '';
  if (this.errors_.length) {
    result = jstestdriver.TestResult.RESULT.FAILED;
    message = this.toJson_(this.errors_);
  } else if (jstestdriver.expectedAssertCount != -1 &&
             jstestdriver.expectedAssertCount != jstestdriver.assertCount) {
    result = jstestdriver.TestResult.RESULT.FAILED;
    message = this.toJson_([new Error("Expected '" +
        jstestdriver.expectedAssertCount +
        "' asserts but '" +
        jstestdriver.assertCount +
        "' encountered.")]);
  }
  var arguments = this.testRunConfiguration_.getArguments();
  var argument = arguments ? arguments[this.testName_] : null;
  return new jstestdriver.TestResult(
      this.testCaseInfo_.getTestCaseName(), this.testName_, result, message,
      jstestdriver.console.getAndResetLog(), end - this.start_, null, argument);
};
/*
 * Copyright 2009 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
jstestdriver.plugins.DefaultPlugin = function(fileLoaderPlugin,
                                              testRunnerPlugin,
                                              assertsPlugin,
                                              testCaseManagerPlugin) {
  this.fileLoaderPlugin_ = fileLoaderPlugin;
  this.testRunnerPlugin_ = testRunnerPlugin;
  this.assertsPlugin_ = assertsPlugin;
  this.testCaseManagerPlugin_ = testCaseManagerPlugin;
};


jstestdriver.plugins.DefaultPlugin.prototype.name = 'defaultPlugin';


jstestdriver.plugins.DefaultPlugin.prototype.loadSource = function(file, onSourceLoaded) {
  return this.fileLoaderPlugin_.loadSource(file, onSourceLoaded);
};


jstestdriver.plugins.DefaultPlugin.prototype.runTestConfiguration = function(testRunConfiguration,
    onTestDone, onTestRunConfigurationComplete) {
  return this.testRunnerPlugin_.runTestConfiguration(testRunConfiguration, onTestDone,
      onTestRunConfigurationComplete);
};


jstestdriver.plugins.DefaultPlugin.prototype.isFailure = function(exception) {
  return this.assertsPlugin_.isFailure(exception);
};


jstestdriver.plugins.DefaultPlugin.prototype.getTestRunsConfigurationFor =
    function(testCaseInfos, expressions, testRunsConfiguration) {
  return this.testCaseManagerPlugin_.getTestRunsConfigurationFor(testCaseInfos,
                                                                expressions,
                                                                testRunsConfiguration);
};


jstestdriver.plugins.DefaultPlugin.prototype.onTestsStart =
    jstestdriver.EMPTY_FUNC;


jstestdriver.plugins.DefaultPlugin.prototype.onTestsFinish =
  jstestdriver.EMPTY_FUNC;
/*
 * Copyright 2009 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
jstestdriver.plugins.AssertsPlugin = function() {
};


jstestdriver.plugins.AssertsPlugin.prototype.isFailure = function(e) {
  return e.name == 'AssertError';
};
/*
 * Copyright 2009 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


/**
 * Plugin that handles the default behavior for the TestCaseManager.
 * @author corysmith@google.com (Cory Smith)
 */
jstestdriver.plugins.TestCaseManagerPlugin = function() {};


/**
 * Write testRunconfigurations retrieved from testCaseInfos defined by expressions.
 * @param {Array.<jstestdriver.TestCaseInfo>} testCaseInfos The loaded test case infos.
 * @param {Array.<String>} The expressions that define the TestRunConfigurations
 * @parma {Array.<jstestdriver.TestRunConfiguration>} The resultant array of configurations.
 */
jstestdriver.plugins.TestCaseManagerPlugin.prototype.getTestRunsConfigurationFor =
    function(testCaseInfos, expressions, testRunsConfiguration) {
  var size = testCaseInfos.length;
  for (var i = 0; i < size; i++) {
    var testCaseInfo = testCaseInfos[i];
    var testRunConfiguration = testCaseInfo.getTestRunConfigurationFor(expressions);

    if (testRunConfiguration != null) {
      testRunsConfiguration.push(testRunConfiguration);
    }
  }
  return true;
};


(function(window) {

    /**
     * Invoked before all the tests are run, it reports complete number of tests.
     */
    function beforeRun(karma) {
        karma.info({
            // count number of tests in each of the modules
            total: jstestdriver.testCaseManager.getDefaultTestRunsConfiguration().reduce(function(memo, currentCase) {
                return memo + currentCase.tests_.length;
            }, 0)
        });
    }

    /**
     * Invoked after all the tests are finished running with unit tests runner
     * as a first parameter. `window.__coverage__` is provided by Karma. This function
     * basically notifies Karma that unit tests runner is done.
     */
    function afterRun(karma) {
        karma.complete({
            coverage: window.__coverage__
        });
    }

    /**
     * Invoked after each test, used to provide Karma with feedback for each of the tests
     */
    function afterTest(karma, testResult) {
        var log = [];
        if (testResult.log != "")
            log.push(testResult.log);
        if (testResult.message != "" && testResult.message != "[]") {
            var error = JSON.parse(testResult.message)[0];
            log.push(error.stack);
        }
        karma.result({
            description: testResult.testName,
            suite: [testResult.testCaseName] || [],
            success: testResult.result === "passed",
            log: log,
            time: testResult.time
        });
    }

    /**
     * TODO: 0. Documentation...
     *
     * @param  {Object} karma Karma runner instance
     * @return {Function} start function that will collect test modules and kick off Tyrtle runner
     */
    function createStartFn(karma) {
        jstestdriver.console = new jstestdriver.Console();
        jstestdriver.config.createRunner(jstestdriver.config.createStandAloneExecutor,
            jstestdriver.plugins.pausingRunTestLoop);

        return function () {
            beforeRun(karma);
            jstestdriver.testRunner.runTests(jstestdriver.testCaseManager.getDefaultTestRunsConfiguration(),
                function(test) {
                    afterTest(karma, test);
                }, function() {
                    afterRun(karma);
                }, true );
        };
    }

    /**
     * Returned function is used for logging by Karma
     */
    function createDumpFn(karma, serialize) {
        return function () {
            karma.info({ dump: [].slice.call(arguments) });
        };
    }

    window.__karma__.start = createStartFn(window.__karma__);
    window.dump = createDumpFn(window.__karma__, function (value) {
        return value;
    });
})(window);