"use strict";

goog.provide('tutao.tutanota.ctrl.ButtonBarViewModel');

// - move gui part to custom binding
// - width adaption when scrollbar appears/disappears

/**
 * Defines a button bar.
 *
 * @constructor
 * @param {Array.<tutao.tutanota.ctrl.Button>} buttons An array containing any number of tutao.tutanota.ctrl.Button instances.
 * @param {string=} moreButtonText The text for the more button.
 * @param {function(Element):number=} measureFunction A function that returns the width of the buttons dom element including margins.
 *                                          This function should only be provided if the buttons are no standard-buttons
 */
tutao.tutanota.ctrl.ButtonBarViewModel = function(buttons,moreButtonText, measureFunction) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    if(!moreButtonText) {
        moreButtonText = "dots_label";
    }
    this.moreButton = new tutao.tutanota.ctrl.Button(moreButtonText, 100, this.switchMore, false, "moreAction", null, "more", moreButtonText);
    if (measureFunction) {
        this.getSingleButtonWidth = measureFunction;
    }

    // only show buttons that are not hidden
    this.allButtons = ko.computed(function() {
        return ko.utils.arrayFilter(buttons, function(button) {
            if (button) { // on IE8, the arrayFilter might be called with undefined parameters
                return button.isVisible();
            } else {
                return false;
            }

        });
    });
	this.moreButtons = ko.observableArray(); // the buttons that will be shown in more menu
	this.visibleButtons = ko.observableArray(); // the buttons that are visible in button bar
    this.moreVisible = ko.observable(false);
    this.domButtonBar = ko.observable(null); // is set via domInit binding to the buttonBar div
    this.maxWidth = 0;
    this.widthSubscription = null;

    this.domButtonBar.subscribe(function(value) {
        var self = this;
        var id = null;
        id = setInterval(function() {
            self.maxWidth = $(self.domButtonBar()).width();
            if (self.maxWidth != 0) {
                clearInterval(id);
                self.updateVisibleButtons();
            }
        }, 50);
    }, this);

	this.allButtons.subscribe(function() {
		this.updateVisibleButtons();
	}, this);
};

/**
 *
 * @param {Array} buttons
 * @returns {number}
 */
tutao.tutanota.ctrl.ButtonBarViewModel.prototype.getButtonsWidth = function(buttons) {
    var buttonWidth = 0;
    for(var i=0; i< buttons.length; i++) {
        buttonWidth += this.getSingleButtonWidth(buttons[i]);
    }
    return buttonWidth;
};


tutao.tutanota.ctrl.ButtonBarViewModel.prototype.updateVisibleButtons = function() {
    if (!this.widthSubscription) {
        this.widthSubscription = tutao.locator.viewManager.windowWidthObservable.subscribe( function() {
            setTimeout(this.updateVisibleButtons, 0); // the column width is not yet updated when the window width changes, so use a timeout
        }, this);
    }

    this.maxWidth = $(this.domButtonBar()).width();

    var visibleButtonList = [].concat(this.allButtons());
    var moreButtonList = [];
    if (this.maxWidth < this.getButtonsWidth(visibleButtonList)){
        visibleButtonList.push(this.moreButton);
        this._filterButtons(visibleButtonList, moreButtonList);
    }
    this.visibleButtons(visibleButtonList);
    this.moreButtons(moreButtonList);

    this.visibleButtons.reverse();
};

/**
 *
 * @param {Array} visibleButtonList
 * @param {Array} moreButtonList
 * @private
 */
tutao.tutanota.ctrl.ButtonBarViewModel.prototype._filterButtons = function(visibleButtonList, moreButtonList) {
    if ( this.maxWidth < this.getButtonsWidth(visibleButtonList)){
        var buttonIndex = this._getLowestPriorityButtonIndex(visibleButtonList);
        if ( buttonIndex >= 0){
            var removedButtons = visibleButtonList.splice(buttonIndex, 1);
            moreButtonList.splice(0, 0, removedButtons[0]);
            this._filterButtons(visibleButtonList, moreButtonList);
        }
    }
};


/**
 *
 * @param {Array} buttonList
 * @return {Number} button index
 * @private
 */
tutao.tutanota.ctrl.ButtonBarViewModel.prototype._getLowestPriorityButtonIndex = function(buttonList) {
    var lowestPriority = 1000;
    var buttonIndex = -1;
    for(var i=0; i< buttonList.length; i++ ){
        var currentButton = buttonList[i];
        if (currentButton.getPriority() < lowestPriority){
            lowestPriority = currentButton.getPriority();
            buttonIndex = i;
        }
    }
    return buttonIndex;
};


tutao.tutanota.ctrl.ButtonBarViewModel.prototype.hasMoreButton = function() {
    return this.moreButtons.length != 0;
};

tutao.tutanota.ctrl.ButtonBarViewModel.prototype._showMore = function() {
    tutao.locator.modalPageBackgroundViewModel.show(this.hideMore);
    this.moreVisible(true);
};

tutao.tutanota.ctrl.ButtonBarViewModel.prototype.hideMore = function() {
    this.moreVisible(false);
};

tutao.tutanota.ctrl.ButtonBarViewModel.prototype.switchMore = function() {
    if ( this.moreVisible()){
        this.hideMore();
    }else{
        this._showMore();
    }
};

/**
 * @param {tutao.tutanota.ctrl.Button} button The button to measure
 * @return {number} The width including the margin of the button
 */
tutao.tutanota.ctrl.ButtonBarViewModel.prototype.getSingleButtonWidth = function (button) {
    var measureButton = $("button#measureButton");
    measureButton.text(tutao.lang(button.getLabelTextId()));
    return measureButton.outerWidth(true);
};