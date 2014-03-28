"use strict";

goog.provide('tutao.tutanota.ctrl.c');

/**
 * @constructor
 */
tutao.tutanota.ctrl.AppCacheListener = function() {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
    this._progressDialog = tutao.locator.progressDialogModel;
    this._appCache = window.applicationCache;
    this._initListeners();
};

/**
 * Inits all needed listeners for appcache events.
 * @private
 */
tutao.tutanota.ctrl.AppCacheListener.prototype._initListeners = function() {

    // An update was found. The browser is fetching resources.
    this._appCache.addEventListener('downloading', this._handleDownloadEvent, false);

    // The manifest returns 404 or 410, the download failed,
    // or the manifest changed while the download was in progress.
    this._appCache.addEventListener('error', this._handleCacheError, false);

    // Fired for each resource listed in the manifest as it is being fetched.
    this._appCache.addEventListener('progress', this._handleProgressEvent, false);

    // Fired when the manifest resources have been newly redownloaded.
    this._appCache.addEventListener('updateready', this._handleUpdateReady, false);
};

tutao.tutanota.ctrl.AppCacheListener.prototype._handleDownloadEvent = function(event) {
    this._progressDialog.open("applicationUpdate_label");
};

tutao.tutanota.ctrl.AppCacheListener.prototype._handleProgressEvent = function(event) {
    this._progressDialog.updateProgress(event.loaded, event.total);
};

tutao.tutanota.ctrl.AppCacheListener.prototype._handleUpdateReady = function(event) {
    // Browser downloaded a new app cache.
    // Swap it in and reload the page to get the new hotness.
    this._appCache.swapCache();
    this._progressDialog.close();
    window.location.reload();
};

tutao.tutanota.ctrl.AppCacheListener.prototype._handleCacheError = function(event) {
    this._progressDialog.close();
};
