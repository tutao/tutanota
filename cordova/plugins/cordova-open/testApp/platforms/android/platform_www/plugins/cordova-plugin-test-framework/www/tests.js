cordova.define("cordova-plugin-test-framework.cdvtests", function(require, exports, module) {
/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

'use strict';

exports.tests = Object.create(null);

function TestModule(api) {
  var name = api;
  var enabled = true;

  var enabledPref = localStorage.getItem('cordova-tests-enabled-' + name);
  if (enabledPref)
  {
    enabled = (enabledPref == true.toString());
  }
  
  this.getEnabled = function () {
    return enabled;
  };
  
  this.setEnabled = function (isEnabled) {
    enabled = isEnabled;
    localStorage.setItem('cordova-tests-enabled-' + name, enabled);
  };
}

function getTestsObject(api) {
  return exports.tests[api] = exports.tests[api] || new TestModule(api);
}

function requireAllTestModules() {
  // This finds all js-modules named "tests" (regardless of plugins they came from)
  var test_modules = cordova.require('cordova/plugin_list')
    .map(function(jsmodule) {
      return jsmodule.id;
    })
    .filter(function(id) {
      return /\.tests$/.test(id);
    });

  // Map auto / manual test definitions for each, but without actually running the handlers
  test_modules.forEach(function(id) {
    try {
      var plugintests = cordova.require(id);

      if (plugintests.hasOwnProperty('defineAutoTests')) {
        getTestsObject(id).defineAutoTests = function() {
          describe(id + ' >>', plugintests.defineAutoTests.bind(plugintests));
        };
      }

      if (plugintests.hasOwnProperty('defineManualTests')) {
        getTestsObject(id).defineManualTests = plugintests.defineManualTests.bind(plugintests);
      }
    } catch(ex) {
      console.warn('Failed to load tests: ', id);
      return;
    }
  });
}

function createJasmineInterface() {
  var jasmine_helpers = require('cordova-plugin-test-framework.jasmine_helpers');
  var jasmineInterface = jasmine_helpers.setUpJasmine();
  return jasmineInterface;
}

function attachJasmineInterfaceToGlobal() {
  var jasmineInterface = createJasmineInterface();
  for (var property in jasmineInterface) {
    window[property] = jasmineInterface[property];
  }
}

function detachJasmineInterfaceFromGlobal() {
  var jasmineInterface = createJasmineInterface();
  for (var property in jasmineInterface) {
    delete window[property];
  }
}

exports.defineAutoTests = function() {
  requireAllTestModules();
  attachJasmineInterfaceToGlobal();

  Object.keys(exports.tests).forEach(function(key) {
    if (!exports.tests[key].getEnabled())
      return;
    if (!exports.tests[key].hasOwnProperty('defineAutoTests'))
      return;
    exports.tests[key].defineAutoTests();
  });
};

exports.defineManualTests = function(contentEl, beforeEach, createActionButton) {
  requireAllTestModules();
  detachJasmineInterfaceFromGlobal();

  Object.keys(exports.tests).forEach(function(key) {
    if (!exports.tests[key].getEnabled())
      return;
    if (!exports.tests[key].hasOwnProperty('defineManualTests'))
      return;
    createActionButton(key, function() {
      beforeEach(key);
      exports.tests[key].defineManualTests(contentEl, createActionButton);
    });
  });
};

exports.init = function() {
  requireAllTestModules();
}

});
