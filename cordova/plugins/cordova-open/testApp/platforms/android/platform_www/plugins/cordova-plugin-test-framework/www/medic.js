cordova.define("cordova-plugin-test-framework.medic", function(require, exports, module) {
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

exports.logurl = 'http://127.0.0.1:7800';

exports.enabled = false;

exports.log = function() {
  if (!exports.enabled)
    return;
  var xhr = new XMLHttpRequest();
  xhr.open("POST", exports.logurl, true);
  xhr.setRequestHeader("Content-Type", "text/plain");
  xhr.send(Array.prototype.slice.apply(arguments));
};

exports.load = function (callback) {
  var cfg = null;

  try {
    // attempt to synchronously load medic config
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "../medic.json", false);
    xhr.send(null);
    cfg = JSON.parse(xhr.responseText);
  } catch (ex) { }

  // config is available
  if (cfg) {
    exports.logurl = cfg.couchdb || cfg.logurl;
    exports.sha = cfg.sha;
    exports.enabled = true;
    console.log('Loaded Medic Config: logurl=' + exports.logurl);
  } else {
    // config does not exist
    console.log('Did not find medic config file');
  }

  setTimeout(function () {
      callback();
  }, 0);
}

});
