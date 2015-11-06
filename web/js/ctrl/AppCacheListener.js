"use strict";

tutao.provide('tutao.tutanota.ctrl.c');

/**
 * @constructor
 */
tutao.tutanota.ctrl.AppCacheListener = function() {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
    this._progressDialog = tutao.locator.progressDialogModel;
    this._appCache = window.applicationCache;
    this._dummyProgress = 0;
    this._initListeners();
};

/**
 * Inits all needed listeners for appcache events.
 * @private
 */
tutao.tutanota.ctrl.AppCacheListener.prototype._initListeners = function() {

    // An update was found. The browser is fetching resources.
    this._appCache.addEventListener('downloading', this._handleDownloadEvent, false);

    // The manifest returns 404 or 410, the download failed, or the manifest changed while the download was in progress.
    this._appCache.addEventListener('error', this._handleCacheError, false);

    // Fired for each resource listed in the manifest as it is being fetched.
    this._appCache.addEventListener('progress', this._handleProgressEvent, false);

    // Fired when the manifest resources have been newly redownloaded. Called by Firefox for initial download instead of "cached"
    this._appCache.addEventListener('updateready', this._handleUpdateReady, false);

    // The resources have been downloaded initially. In Firefox, "updateready" is called instead.
    this._appCache.addEventListener('cached', this._handleCachedEvent, false);
};

tutao.tutanota.ctrl.AppCacheListener.prototype._handleDownloadEvent = function(event) {
    this._dummyProgress = 0;
    console.log("downloading");
    this._progressDialog.open("applicationUpdate_label");
};

tutao.tutanota.ctrl.AppCacheListener.prototype._handleProgressEvent = function(event) {
    if (event.lengthComputable) {
        this._progressDialog.updateProgress(event.loaded / event.total * 100);
    } else {
        if (this._dummyProgress < 100) {
            this._dummyProgress++;
        }
        this._progressDialog.updateProgress(this._dummyProgress);
    }
};

tutao.tutanota.ctrl.AppCacheListener.prototype._handleCachedEvent = function(event) {
    console.log("cached");
    this._progressDialog.close();
};

tutao.tutanota.ctrl.AppCacheListener.prototype._handleUpdateReady = function(event) {
    console.log("update ready");
    try {
        // Firefox throws an exception when "updateready" was called for the inital download (instead of "cached") and then swapCache() is called, so we have to catch the exception to be able to close the progress dialog.
        this._appCache.swapCache();
        this._progressDialog.close();
        window.location.reload();
    } catch (e) {
        this._progressDialog.close();
    }
};

tutao.tutanota.ctrl.AppCacheListener.prototype._handleCacheError = function(event) {
    console.log("cache error", event);
    this._progressDialog.close();
};
