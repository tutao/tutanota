"use strict";

goog.provide('tutao.tutanota.ctrl.View');

/**
 * A View represents the canvas on which type of functionality is provided in Tutanota. The content of a view
 * is not necessarily completely visible but may be moved into the visible area (window) of a browser by a ViewSlider.
 * @interface
 */
tutao.tutanota.ctrl.View = function() {};

/**
 * Called after loading Tutanota.
 * @param {Boolean} external True if the view shall be loaded for an external user, false for an internal user.
 */
tutao.tutanota.ctrl.View.prototype.init = function(external) {};

/**
 * Provides the information if this view shall only be shown to internal users.
 */
tutao.tutanota.ctrl.View.prototype.isForInternalUserOnly = function() {};

/**
 * Called directly before the view is shown.
 * @param {Object=} params The parameters for this view.
 */
tutao.tutanota.ctrl.View.prototype.activate = function(params) {};

/**
 * Called directly before the view is hidden.
 */
tutao.tutanota.ctrl.View.prototype.deactivate = function() {};

/**
 * Called if this view is active and the window size has changed.
 */
tutao.tutanota.ctrl.View.prototype.windowSizeChanged = function(width, height) {};

/**
 * Called if this view is active and a swipe has been recognized.
 */
tutao.tutanota.ctrl.View.prototype.swipeRecognized = function(type) {};

/**
 * Slides the currently visible column(s) left or right to make a neighbour column visible.
 * @param {boolean} left True if the left neighbour column shall be made visible, false if the right neighbour column shall be made visible.
 */
tutao.tutanota.ctrl.View.prototype.showNeighbourColumn = function(left) {};

/**
 * Provides the information if it is allowed to slide to the column left or right.
 * @param {boolean} left True if the left direction shall be checked, false for the right direction.
 * @return {boolean} True if sliding in the given direction is allowed, false otherwise.
 */
tutao.tutanota.ctrl.View.prototype.isShowNeighbourColumnPossible = function(left) {};
