cordova.define("cordova-plugin-test-framework.main", function(require, exports, module) {
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

var LOG_HEADER_HEIGHT = 20,
    CONTENT_TOP_OFFSET = 30;

var isWin = cordova.platformId === "windows",
    isWP8 = cordova.platformId === "windowsphone";

/******************************************************************************/

function getMode(callback) {
  var mode = localStorage.getItem('cdvtests-mode') || 'main';
  callback(mode);
}

function setMode(mode) {
  var handlers = {
    'main': runMain,
    'auto': runAutoTests,
    'manual': runManualTests
  };
  if (!handlers.hasOwnProperty(mode)) {
    console.error("Unsupported mode: " + mode);
    console.error("Defaulting to 'main'");
    mode = 'main';
  }

  localStorage.setItem('cdvtests-mode', mode);
  clearContent();

  handlers[mode]();
}

/******************************************************************************/

function clearContent() {
  var content = document.getElementById('content');
  content.innerHTML = '';
  var log = document.getElementById('log--content');
  log.innerHTML = '';
  var buttons = document.getElementById('buttons');
  buttons.innerHTML = '';

  setLogVisibility(false);
}

/******************************************************************************/

function setTitle(title) {
  var el = document.getElementById('title');
  el.textContent = title;
}

/******************************************************************************/

function setLogVisibility(visible) {
    if (visible) {
        document.querySelector('body').classList.add('expanded-log');

        if (isWin || isWP8) {
            var h = document.querySelector('body').offsetHeight;

            document.getElementById('middle').style.height = (h * 0.6 - LOG_HEADER_HEIGHT - CONTENT_TOP_OFFSET) + "px";
            document.getElementById('middle').style.marginBottom = (h * 0.4) + "px";
            document.getElementById('middle').style.paddingBottom = (h * 0.4) + "px";
        }
    } else {
        document.querySelector('body').classList.remove('expanded-log');

        if (isWin || isWP8) {
            document.getElementById('middle').style.height = "";
            document.getElementById('middle').style.marginBottom = "";
            document.getElementById('middle').style.paddingBottom = "";
        }
    }
}

window.onresize = function (event) {
    // Update content and log heights
    if (isWin || isWP8) {
        setLogVisibility(getLogVisibility());
    }
};

function getLogVisibility() {
  var e = document.querySelector('body');
  return e.classList.contains('expanded-log');
}

function toggleLogVisibility() {
  if (getLogVisibility()) {
    setLogVisibility(false);
  } else {
    setLogVisibility(true);
  }
}

/******************************************************************************/

function attachEvents() {
  document.getElementById('log--title').addEventListener('click', toggleLogVisibility);
}

/******************************************************************************/

var origConsole = window.console;

exports.wrapConsole = function() {
  function appendToOnscreenLog(type, args) {
    var el = document.getElementById('log--content');
    var div = document.createElement('div');
    div.classList.add('log--content--line');
    div.classList.add('log--content--line--' + type);
    div.textContent = Array.prototype.slice.apply(args).map(function(arg) {
        return (typeof arg === 'string') ? arg : JSON.stringify(arg);
      }).join(' ');
    el.appendChild(div);
    // scroll to bottom
    el.scrollTop = el.scrollHeight;
  }

  function createCustomLogger(type) {
    var medic = require('cordova-plugin-test-framework.medic');
    return function() {
      origConsole[type].apply(origConsole, arguments);
      // TODO: encode log type somehow for medic logs?
      medic.log.apply(medic, arguments);
      appendToOnscreenLog(type, arguments);
      setLogVisibility(true);
    };
  }

  window.console = {
    log: createCustomLogger('log'),
    warn: createCustomLogger('warn'),
    error: createCustomLogger('error'),
  };
};

exports.unwrapConsole = function() {
  window.console = origConsole;
};

/******************************************************************************/

function createActionButton(title, callback, appendTo) {
  appendTo = appendTo ? appendTo : 'buttons';
  var buttons = document.getElementById(appendTo);
  var div = document.createElement('div');
  var button = document.createElement('a');
  button.textContent = title;
  button.onclick = function(e) {
    e.preventDefault();
    callback();
  };
  button.classList.add('topcoat-button');
  div.appendChild(button);
  buttons.appendChild(div);
}

/******************************************************************************/

function setupAutoTestsEnablers(cdvtests) {
  var enablerList = createEnablerList();

  // Iterate over all the registered test modules
  iterateAutoTests(cdvtests, function(api, testModule) {
    // For "standard" plugins remove the common/repetitive bits of
    // the api key, for use as the title.  For third-party plugins, the full
    // api will be used as the title
    var title = api.replace(/org\.apache\.cordova\./i, '').replace(/\.tests.tests/i, '');

    createEnablerCheckbox(api, title, testModule.getEnabled(), enablerList.id, toggleTestHandler);
  });

  updateEnabledTestCount();
}

/******************************************************************************/

function createEnablerList() {
  var buttons = document.getElementById('buttons');

  var enablerContainer = document.createElement('div');
  enablerContainer.id = 'test-enablers-container';

  // Create header to show count of enabled/total tests
  var header = document.createElement('h3');
  header.id = 'tests-enabled';

  // Create widget to show/hide list
  var expander = document.createElement('span');
  expander.id = 'test-expander';
  expander.innerText = 'Show/hide tests to be run';
  expander.onclick = toggleEnablerVisibility;

  // Create list to contain checkboxes for each test
  var enablerList = document.createElement('div');
  enablerList.id = "test-list";

  // Create select/deselect all buttons (in button bar)
  var checkButtonBar = document.createElement('ul');
  checkButtonBar.classList.add('topcoat-button-bar');

  function createSelectToggleButton(title, selected) {
    var barItem = document.createElement('li');
    barItem.classList.add('topcoat-button-bar__item');

    var link = document.createElement('a');
    link.classList.add('topcoat-button-bar__button');
    link.innerText = title;
    link.href = null;
    link.onclick = function(e) {
      e.preventDefault();
      toggleSelected(enablerList.id, selected);
      return false;
    };

    barItem.appendChild(link);
    checkButtonBar.appendChild(barItem);
  };
  createSelectToggleButton('Check all', true);
  createSelectToggleButton('Uncheck all', false);
  enablerList.appendChild(checkButtonBar);

  enablerContainer.appendChild(header);
  enablerContainer.appendChild(expander);
  enablerContainer.appendChild(enablerList);

  buttons.appendChild(enablerContainer);

  return enablerList;
}

/******************************************************************************/

function updateEnabledTestCount() {
  var enabledLabel = document.getElementById('tests-enabled');

  // Determine how many tests are currently enabled
  var cdvtests = cordova.require('cordova-plugin-test-framework.cdvtests');
  var total = 0;
  var enabled = 0;
  iterateAutoTests(cdvtests, function(api, testModule) {
    total++;
    if (testModule.getEnabled()) {
      enabled++;
    }
  });

  if (enabled == total) {
    enabledLabel.innerText = 'Running All Tests.';
  } else {
    enabledLabel.innerText = 'Running ' + enabled + ' of ' + total + ' Tests.';
  }
}

/******************************************************************************/

function toggleSelected(containerId, newCheckedValue) {
  [].forEach.call(document.getElementById(containerId).getElementsByTagName('input'), function(input) {
    if (input.type !== 'checkbox') return;
    input.checked = newCheckedValue;
    toggleTestEnabled(input);
  });
  updateEnabledTestCount();
}

/******************************************************************************/

function toggleEnablerVisibility() {
  var enablerList = document.getElementById('test-list');
  if (enablerList.classList.contains('expanded')) {
    enablerList.classList.remove('expanded');
  } else {
    enablerList.classList.add('expanded');
  }
}

/******************************************************************************/

function createEnablerCheckbox(api, title, isEnabled, appendTo, callback) {
  var container = document.getElementById(appendTo);

  var label = document.createElement('label');
  label.classList.add('topcoat-checkbox');

  var checkbox = document.createElement('input');
  checkbox.type = "checkbox";
  checkbox.value = api;
  checkbox.checked = isEnabled;
  label.htmlFor = checkbox.id = 'enable_' + api;

  checkbox.onchange = function(e) {
    e.preventDefault();
    callback(e);
  };

  var div = document.createElement('div');
  div.classList.add('topcoat-checkbox__checkmark');

  var text = document.createElement('span');
  text.innerText = title;

  label.appendChild(checkbox);
  label.appendChild(div);
  label.appendChild(text);

  container.appendChild(label);
}

/******************************************************************************/

function toggleTestHandler(event) {
  var checkbox = event.target;

  toggleTestEnabled(checkbox);
  updateEnabledTestCount();
}

/******************************************************************************/

function toggleTestEnabled(checkbox) {
  var cdvtests = cordova.require('cordova-plugin-test-framework.cdvtests');
  cdvtests.tests[checkbox.value].setEnabled(checkbox.checked);
}

/******************************************************************************/

function iterateAutoTests(cdvtests, callback) {
  Object.keys(cdvtests.tests).forEach(function(api) {
    var testModule = cdvtests.tests[api];
    if (!testModule.hasOwnProperty('defineAutoTests')) {
      return;
    }
    callback(api, testModule);
  });
}

/******************************************************************************/

function runAutoTests() {
  setTitle('Auto Tests');

  createActionButton('Run', setMode.bind(null, 'auto'));
  createActionButton('Reset App', location.reload.bind(location));
  createActionButton('Back', setMode.bind(null, 'main'));

  var cdvtests = cordova.require('cordova-plugin-test-framework.cdvtests');
  cdvtests.init();
  setupAutoTestsEnablers(cdvtests);

  cdvtests.defineAutoTests();

  // Run the tests!
  var jasmineEnv = window.jasmine.getEnv();

  jasmineEnv.execute();
}

/******************************************************************************/

function runManualTests() {
  setTitle('Manual Tests');

  createActionButton('Reset App', location.reload.bind(location));
  createActionButton('Back', setMode.bind(null, 'main'));

  var contentEl = document.getElementById('content');
  var beforeEach = function(title) {
    clearContent();
    setTitle(title || 'Manual Tests');
    createActionButton('Reset App', location.reload.bind(location));
    createActionButton('Back', setMode.bind(null, 'manual'));
  };
  var cdvtests = cordova.require('cordova-plugin-test-framework.cdvtests');
  cdvtests.defineManualTests(contentEl, beforeEach, createActionButton);
}

/******************************************************************************/

function runMain() {
  setTitle('Apache Cordova Plugin Tests');

  createActionButton('Auto Tests', setMode.bind(null, 'auto'));
  createActionButton('Manual Tests', setMode.bind(null, 'manual'));
  createActionButton('Reset App', location.reload.bind(location));
  if (/showBack/.exec(location.hash)) {
      createActionButton('Back', function() {
          history.go(-1);
      });
  }

  if (isWin && typeof WinJS !== 'undefined') {
    var app = WinJS.Application;
    app.addEventListener("error", function (err) {
        // We do not want an unhandled exception to crash the test app
        // Returning true marks it as being handled
        return true;
      });
  }
}

/******************************************************************************/

exports.init = function() {
  // TODO: have a way to opt-out of console wrapping in case line numbers are important.
  // ...Or find a custom way to print line numbers using stack or something.
  // make sure to always wrap when using medic.
  attachEvents();
  exports.wrapConsole();

  var medic = require('cordova-plugin-test-framework.medic');
  medic.load(function() {
    if (medic.enabled) {
      setMode('auto');
    } else {
      getMode(setMode);
    }
  });
};

/******************************************************************************/

});
