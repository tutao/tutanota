var tutao = typeof tutao != 'undefined' ? tutao : {};

tutao.global = this;

/**
 * Adapted from goog.exportPath_
 * 
 * Builds an object structure for the provided namespace path,
 * ensuring that names that already exist are not overwritten. For
 * example:
 * "a.b.c" -> a = {};a.b={};a.b.c={};
 * @param {string} name name of the object that this file defines.
 */
tutao.provide = function(name) {
    var parts = name.split('.');
    var cur = tutao.global;

    // Internet Explorer exhibits strange behavior when throwing errors from
    // methods externed in this manner.  See the testExportSymbolExceptions in
    // base_test.html for an example.
    if (!(parts[0] in cur) && cur.execScript) {
        cur.execScript('var ' + parts[0]);
    }

    // Certain browsers cannot parse code in the form for((a in b); c;);
    // This pattern is produced by the JSCompiler when it collapses the
    // statement above into the conditional loop below. To prevent this from
    // happening, use a for-loop and reserve the init logic as below.

    // Parentheses added to eliminate strict JS warning in Firefox.
    for (var part; parts.length && (part = parts.shift());) {
        if (cur[part]) {
            cur = cur[part];
        } else {
            cur = cur[part] = {};
        }
    }
};

if (!Object.create) {
    Object.create = function(proto, props) {
        if (typeof props !== "undefined") {
            throw "The multiple-argument version of Object.create is not provided by this browser and cannot be shimmed.";
        }
        function F() { }
        F.prototype = proto;
        return new F();
    };
}