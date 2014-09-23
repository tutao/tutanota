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

var modulemapper = require('cordova/modulemapper');


var origOpenFunc = modulemapper.getOriginalSymbol(window, 'window.open');


function _empty() {}


function modal(message, callback, title, buttonLabels, domObjects) {
    var mainWindow = window;
    var modalWindow = origOpenFunc();
    var modalDocument = modalWindow.document;

    modalDocument.write(
        '<html><head>' +
        '<link rel="stylesheet" type="text/css" href="/css/index.css" />' +
        '<link rel="stylesheet" type="text/css" href="/css/notification.css" />' +
        '</head><body></body></html>');

    var box = modalDocument.createElement('form');
    box.setAttribute('role', 'dialog');
    // prepare and append empty section
    var section = modalDocument.createElement('section');
    box.appendChild(section);
    // add title
    var boxtitle = modalDocument.createElement('h1');
    boxtitle.appendChild(modalDocument.createTextNode(title));
    section.appendChild(boxtitle);
    // add message
    var boxMessage = modalDocument.createElement('p');
    boxMessage.appendChild(modalDocument.createTextNode(message));
    section.appendChild(boxMessage);
    // inject what's needed
    if (domObjects) {
        section.appendChild(domObjects);
    }
    // add buttons and assign callbackButton on click
    var menu = modalDocument.createElement('menu');
    box.appendChild(menu);
    for (var index = 0; index < buttonLabels.length; index++) {
        addButton(buttonLabels[index], index, (index === 0));
    }
    modalDocument.body.appendChild(box);

    function addButton(label, index, recommended) {
        var thisButtonCallback = makeCallbackButton(index + 1);
        var button = modalDocument.createElement('button');
        button.appendChild(modalDocument.createTextNode(label));
        button.addEventListener('click', thisButtonCallback, false);
        if (recommended) {
          // TODO: default one listens to Enter key
          button.classList.add('recommend');
        }
        menu.appendChild(button);
    }

    // TODO: onUnload listens to the cancel key
    function onUnload() {
        var result = 0;
        if (modalDocument.getElementById('prompt-input')) {
            result = {
                input1: '',
                buttonIndex: 0
            }
        }
        mainWindow.setTimeout(function() {
            callback(result);
        }, 10);
    };
    modalWindow.addEventListener('unload', onUnload, false);

    // call callback and destroy modal
    function makeCallbackButton(labelIndex) {
        return function() {
          if (modalWindow) {
              modalWindow.removeEventListener('unload', onUnload, false);
              modalWindow.close();
          }
          // checking if prompt
          var promptInput = modalDocument.getElementById('prompt-input');
          var response;
          if (promptInput) {
              response = {
                input1: promptInput.value,
                buttonIndex: labelIndex
              };
          }
          response = response || labelIndex;
          callback(response);
        }
    }
}

var Notification = {
    vibrate: function(milliseconds) {
        navigator.vibrate(milliseconds);
    },
    alert: function(successCallback, errorCallback, args) {
        var message = args[0];
        var title = args[1];
        var _buttonLabels = [args[2]];
        var _callback = (successCallback || _empty);
        modal(message, _callback, title, _buttonLabels);
    },
    confirm: function(successCallback, errorCallback, args) {
        var message = args[0];
        var title = args[1];
        var buttonLabels = args[2];
        var _callback = (successCallback || _empty);
        modal(message, _callback, title, buttonLabels);
    },
    prompt: function(successCallback, errorCallback, args) {
        var message = args[0];
        var title = args[1];
        var buttonLabels = args[2];
        var defaultText = args[3];
        var inputParagraph = document.createElement('p');
        inputParagraph.classList.add('input');
        var inputElement = document.createElement('input');
        inputElement.setAttribute('type', 'text');
        inputElement.id = 'prompt-input';
        if (defaultText) {
            inputElement.setAttribute('placeholder', defaultText);
        }
        inputParagraph.appendChild(inputElement);
        modal(message, successCallback, title, buttonLabels, inputParagraph);
    }
};


module.exports = Notification;
require('cordova/exec/proxy').add('Notification', Notification);
