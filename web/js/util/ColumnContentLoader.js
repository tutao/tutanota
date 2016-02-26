"use strict";

tutao.provide('tutao.util.ColumnContentLoader');

/**
 * Handles the process of loading the content for a column, sliding to that column and showing the loading as busy.
 * Also handles initiation of another loading process while another one is already running.
 * @constructor
 */
tutao.util.ColumnContentLoader = function() {
    this._currentObjectToLoad = ko.observable(null);
};

tutao.util.ColumnContentLoader.INSTRUCTION_SLIDE_COLUMN = 0;
tutao.util.ColumnContentLoader.INSTRUCTION_LOAD_CONTENT = 1;
tutao.util.ColumnContentLoader.INSTRUCTION_SHOW_BUSY = 2;

/**
 * Starts the process.
 * @param {Object} objectToLoad The object that shall be loaded. This is only needed to identify if loading a different object was started while another process is already running.
 * @param {bool} slideToTargetColumnNeeded True if we need to slide to the target column (e.g. because it is not visible yet), false otherwise.
 * @param {function(number):Promise} instructionHandler A function receiving one of tutao.util.ColumnContentLoader.INSTRUCTION_* as first argument. Must return a promise that is resolved when finished.
 * @returns {Promise} When the process is finished. At that step you can stop showing the loading as busy and show the loaded content. Rejected if an error occurs during any of the instruction handler calls.
 */
tutao.util.ColumnContentLoader.prototype.load = function(objectToLoad, slideToTargetColumnNeeded, instructionHandler) {
    var self = this;
    var finished = false;
    this._currentObjectToLoad(objectToLoad);

    return new Promise(function(resolve, reject) {
        var handleError = function(e) {
            if (self._currentObjectToLoad() == objectToLoad) {
                self._currentObjectToLoad(null);
                finished = true;
                reject(e);
            }
        };

        var loadContent = function() {
            if (self._currentObjectToLoad() == objectToLoad) {
                instructionHandler(tutao.util.ColumnContentLoader.INSTRUCTION_LOAD_CONTENT).then(function() {
                    if (self._currentObjectToLoad() == objectToLoad) {
                        self._currentObjectToLoad(null);
                        finished = true;
                        resolve();
                    }
                }).caught(function(e) {
                    handleError(e);
                });
            }
        };

        // if the target column must be shown, directly show busy to avoid that the old content is shortly visible when switching to the target column
        if (slideToTargetColumnNeeded) {
            instructionHandler(tutao.util.ColumnContentLoader.INSTRUCTION_SHOW_BUSY).then(function() {
                // we want to slide to the target column before loading the content to avoid bad sliding performance
                instructionHandler(tutao.util.ColumnContentLoader.INSTRUCTION_SLIDE_COLUMN).then(function() {
                    loadContent();
                }).caught(function(e) {
                    handleError(e);
                });
            }).caught(function(e) {
                handleError(e);
            });
        } else {
            // only show busy after 200ms if the content has not been loaded till then
            setTimeout(function() {
                if (!finished && self._currentObjectToLoad() == objectToLoad) {
                    instructionHandler(tutao.util.ColumnContentLoader.INSTRUCTION_SHOW_BUSY).caught(function(e) {
                        handleError(e);
                    });
                }
            }, 200);
            // load the content now
            loadContent();
        }
    });
};

tutao.util.ColumnContentLoader.prototype.getObjectToLoad = function() {
    return this._currentObjectToLoad();
};
