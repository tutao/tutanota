"use strict";

tutao.provide('tutao.tutanota.ctrl.View');

/**
 * A View represents the canvas on which type of functionality is provided in Tutanota. The content of a view
 * is not necessarily completely visible but may be moved into the visible area (window) of a browser by a ViewSlider.
 * @interface
 */
tutao.tutanota.ctrl.View = function() {};

/**
 * Called after loading Tutanota.
 * @param {Boolean} external True if the view shall be loaded for an external user, false for an internal user.
 * @param {function()} updateColumnTitleCallback Has to return the column title.
 */
tutao.tutanota.ctrl.View.prototype.init = function(external, updateColumnTitleCallback) {};

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
 * @return {tutao.tutanota.gui.SwipeSlider} The SwipeSlider used by the view.
 */
tutao.tutanota.ctrl.View.prototype.getSwipeSlider = function() {};

/**
 * Provides the information if it is allowed to show the left neighbour column.
 * @return {boolean} True if the left neighbour column can be shown, false otherwise.
 */
tutao.tutanota.ctrl.View.prototype.isShowLeftNeighbourColumnPossible = function() {};

/**
 * Provides the information if it is allowed to show the right neighbour column.
 * @return {boolean} True if the right neighbour column can be shown, false otherwise.
 */
tutao.tutanota.ctrl.View.prototype.isShowRightNeighbourColumnPossible = function() {};


/**
 * Returns a text for the welcome message for this view.
 * @return {String} The welcome message  for this vew.
 */
tutao.tutanota.ctrl.View.prototype.getWelcomeMessage = function() {return ""};