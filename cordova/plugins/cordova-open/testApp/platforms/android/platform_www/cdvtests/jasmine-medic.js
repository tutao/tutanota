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

jasmineRequire.medic = function(j$) {
  j$.MedicReporter = jasmineRequire.MedicReporter(j$);
};

jasmineRequire.MedicReporter = function(j$) {
  var noopTimer = {
    start: function() {},
    elapsed: function() { return 0; }
  };

  function MedicReporter(options) {
    var env = options.env || {},
    logoptions = options.log || { logurl: 'http://127.0.0.1:5984/' }, // TODO: http://localhost:6800
    getContainer = options.getContainer,
    createElement = options.createElement,
    createTextNode = options.createTextNode,
    onRaiseExceptionsClick = options.onRaiseExceptionsClick || function() {},
    timer = options.timer || noopTimer,
    results = [],
    specsExecuted = 0,
    failureCount = 0,
    pendingSpecCount = 0,
    symbols;


    var serverurl = logoptions.logurl;

    this.initialize = function() {
    }

    var totalSpecsDefined;
    this.jasmineStarted = function(options) {
      totalSpecsDefined = options.totalSpecsDefined || 0;
      timer.start();
    };

    var topResults = new j$.ResultsNode({}, "", null),
    currentParent = topResults;

    this.suiteStarted = function(result) {
    };

    this.suiteDone = function(result) {

    };

    this.specStarted = function(result) {
      // Start timing this spec
    };

    var failures = [];
    this.specDone = function(result) {
      if (result.status != "disabled") {
        specsExecuted++;
      }
      if (result.status == "failed") {
        failureCount++;
        results.push(result);
      }
      if (result.status == "pending") {
        pendingSpecCount++;
      }
    };

    buildResults = function(){
      var json ={specs:specsExecuted, failures:failureCount, results: results};
      return json;
    }

    this.jasmineDone = function() {
      var p = 'Desktop';
      var devmodel='none';
      var version = cordova.version;
      if(typeof device != 'undefined') {
        p = device.platform.toLowerCase();
        devmodel=device.model || device.name;
        version = device.version.toLowerCase();
      }

      this.postTests({
          mobilespec:buildResults(),
          platform:(platformMap.hasOwnProperty(p) ? platformMap[p] : p),
          version:version,
          sha: options.sha,
          timestamp:Math.round(Math.floor((new Date()).getTime() / 1000)),
          model:devmodel
          });

    };


    logresult = function(){
      if(failureCount>0 ) {
        console.log('[[[ TEST OK ]]]');
      } else {
        console.log('[[[ TEST FAILED ]]]');
      }
      logfinished();
    };

    var logfinished = function(){
      console.log('>>> DONE <<<');
    };

    this.postTests = function(json) {
      console.log('posting tests');

      var xhr = new XMLHttpRequest();
      var doc_id = [options.sha, json.version, json.model].map(encodeURIComponent).join('__');
      var doc_url = serverurl + '/mobilespec_results/' + doc_id;
      xhr.open("PUT", doc_url, true);
      xhr.setRequestHeader("Content-Type","application/json")
      xhr.send(JSON.stringify(json));
    }
    return this;
  }

   /**
   * Calculate elapsed time, in Seconds.
   * @param startMs Start time in Milliseconds
   * @param finishMs Finish time in Milliseconds
   * @return Elapsed time in Seconds */
  function elapsedSec(startMs, finishMs) {
    return (finishMs - startMs) / 1000;
  }

  var platformMap = {
    'ipod touch':'ios',
    'iphone':'ios'
  };

  return MedicReporter;
};
