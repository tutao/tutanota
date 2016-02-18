/* global cordova:true */

/*!
 * Module dependencies.
 */

/**
 * cordova.js for node.
 *
 * Think of this as cordova-node, which would be simliar to cordova-android
 * or cordova-browser. The purpose of this module is to enable testing
 * of a plugin's JavaScript interface.
 *
 * When this module is first required, it will insert a global cordova
 * instance, which can hijack cordova-specific commands within the pluin's
 * implementation.
 *
 * Remember to require this module before the plugin that you want to test.
 *
 * Example:
 *
 *     var cordova = require('./helper/cordova'),
 *         myPlugin = require('../www/myPlugin');
 */

module.exports = global.cordova = cordova = {

    /**
     * cordova.require Mock.
     *
     * Hijacks all cordova.requires. By default, it returns an empty function.
     * You can define your own implementation of each required module before
     * or after it has been required.
     *
     * See `cordova.required` to learn how to add your own module implemtnation.
     */

    require: function(moduleId) {
        // define a default function if it doesn't exist
        if (!cordova.required[moduleId]) {
            cordova.required[moduleId] = function() {};
        }
        // create a new module mapping between the module Id and cordova.required.
        return new ModuleMap(moduleId);
    },

    /**
     * Cordova module implementations.
     *
     * A key-value hash, where the key is the module such as 'cordova/exec'
     * and the value is the function or object returned.
     *
     * For example:
     *
     *     var exec = require('cordova/exec');
     *
     * Will map to:
     *
     *     cordova.required['cordova/exec'];
     */

    required: {
        // populated at runtime
    }
};

/**
 * Module Mapper.
 *
 * Returns a function that when executed will lookup the implementation
 * in cordova.required[id].
 *
 * @param {String} moduleId is the module name/path, such as 'cordova/exec'
 * @return {Function}.
 */

function ModuleMap(moduleId) {
    return function() {
        // lookup and execute the module's mock implementation, passing
        // in any parameters that were provided.
        return cordova.required[moduleId].apply(this, arguments);
    };
}
