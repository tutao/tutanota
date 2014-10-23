"use strict";

tutao.provide('tutao.tutanota.ctrl.Button');

/**
 * Defines a button.
 * @constructor
 * @param {string} labelTextId The label visible on the button.
 * @param {number} priority The higher the value the higher the priority. Priority 0 buttons are only in the more menu.
 * @param {function} clickListener Is called when the button is clicked.
 * @param {function=} isVisible The button is displayed, if this function returns true
 * @param {boolean=} directClick True if the click event shall not be deferred by a setTimeout (needed to avoid alert/confirm popup bugs).
 * @param {string=} id The id to set for the button.
 * @param {string=} imageClass If set, the according image will be displayed
 * @param {string=} imageAltTextId alt text for the optional image
 * @param {function=} isSelected Returns true, if the current button is selected
 */
tutao.tutanota.ctrl.Button = function (labelTextId, priority, clickListener, isVisible, directClick, id, imageClass, imageAltTextId, isSelected) {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
    this.labelTextId = labelTextId;

    this._priority = priority;
    this._clickListener = clickListener;
    this._directClick = directClick;
    this.id = id;
    this.isVisible = isVisible ? isVisible : function () {
        return true;
    };
    this.imageClass = imageClass;
    this.imageAltTextId = imageAltTextId;
    this.badge = ko.observable(0);
    this._isSelected = isSelected;
};

/**
 * Provides the priority of the button.
 * @return {number} 0 or positive number value.
 */
tutao.tutanota.ctrl.Button.prototype.getPriority = function () {
    return this._priority;
};

/**
 * Executes the click functionality.
 * @param {Object} vm The view model.
 * @param {Event} event The click event.
 */
tutao.tutanota.ctrl.Button.prototype.click = function (vm, event) {
    if (this._directClick) {
        // needed e.g. for opening a file chooser because a setTimeout in between would not work
        this._clickListener();
    } else {
        var self = this;
        // setTimeout because otherwise problems with alert/confirm dialogs appear
        setTimeout(function () {
            self._clickListener();
        }, 0);
    }
};


tutao.tutanota.ctrl.Button.prototype.getImageAltTextId = function () {
    return this.imageAltTextId;
};

tutao.tutanota.ctrl.Button.prototype.getLabelTextId = function () {
    return this.labelTextId;
};

tutao.tutanota.ctrl.Button.prototype.getId = function () {
    return this.id;
};

/**
 * Sets the number that shall appear in the badge of this button. No badge is shown if the number is 0.
 * @param number The number to display.
 */
tutao.tutanota.ctrl.Button.prototype.setBadgeNumber = function (number) {
    this.badge(number);
};

tutao.tutanota.ctrl.Button.prototype.isSelected = function () {
    if (this._isSelected) {
        return this._isSelected();
    } else {
        return false;
    }
};