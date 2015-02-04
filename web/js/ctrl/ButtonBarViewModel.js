"use strict";

tutao.provide('tutao.tutanota.ctrl.ButtonBarViewModel');

/**
 * Defines a button bar.
 *
 * @constructor
 * @param {Array.<tutao.tutanota.ctrl.Button>} buttons An array containing any number of tutao.tutanota.ctrl.Button instances.
 * @param {string=} moreButtonText The text for the more button.
 * @param {function(Element):number} measureFunction A function that returns the width of the buttons dom element including margins.
 */
tutao.tutanota.ctrl.ButtonBarViewModel = function(buttons, moreButtonText, measureFunction) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
    var self = this;

    if (!moreButtonText) {
        moreButtonText = "more_label";
    }

    this._moreButtons = ko.observableArray(); // the buttons from the more menu that will be shown as sub-buttons
    this.moreButton = new tutao.tutanota.ctrl.Button(moreButtonText, tutao.tutanota.ctrl.Button.ALWAYS_VISIBLE_PRIO, function() {}, this._isMoreButtonVisible, false, "moreAction",  "more", moreButtonText, null, null, this._moreButtons);
    this._getSingleButtonWidth = measureFunction;

    // the buttons that are visible and no special buttons (prio tutao.tutanota.ctrl.Button.ALWAYS_VISIBLE_PRIO)
    this.allButtons = ko.computed(function() {
        return ko.utils.arrayFilter(buttons, function(button) {
            if (button) { // on IE8, the arrayFilter might be called with undefined parameters
                return button.isVisible() && button.getPriority() < tutao.tutanota.ctrl.Button.ALWAYS_VISIBLE_PRIO;
            } else {
                return false;
            }

        });
    });

    // the buttons with prio tutao.tutanota.ctrl.Button.ALWAYS_VISIBLE_PRIO. These are shown on the left of the button bar and are never put into the more menu
    this.specialButtons = ko.computed(function() {
        return ko.utils.arrayFilter(buttons, function(button) {
            if (button) { // on IE8, the arrayFilter might be called with undefined parameters
                return button.isVisible() && button.getPriority() == tutao.tutanota.ctrl.Button.ALWAYS_VISIBLE_PRIO;
            } else {
                return false;
            }

        });
    });

	this.visibleButtons = ko.observableArray(); // the buttons that are visible in button bar
    this.maxWidth = 0;
    this.specialButtonsWidth = 0;

    this.specialButtons.subscribe(function() {
        this.updateSpecialButtons();
    }, this);

	this.allButtons.subscribe(function() {
		this.updateVisibleButtons();
	}, this);

    this._widthInterval = null;
};

tutao.tutanota.ctrl.ButtonBarViewModel.prototype.setButtonBarWidth = function(width) {
    this.maxWidth = width - 1; // 1 spare pixels for button with rounding inaccuracy
    this.updateSpecialButtons();
};

tutao.tutanota.ctrl.ButtonBarViewModel.prototype._isMoreButtonVisible = function() {
    return this._moreButtons().length > 0;
};

/**
 *
 * @param {Array} buttons
 * @returns {number}
 */
tutao.tutanota.ctrl.ButtonBarViewModel.prototype.getButtonsWidth = function(buttons) {
    var buttonWidth = 0;
    for(var i=0; i< buttons.length; i++) {
        buttonWidth += this._getSingleButtonWidth(buttons[i]);
    }
    return buttonWidth;
};


tutao.tutanota.ctrl.ButtonBarViewModel.prototype.updateVisibleButtons = function() {
    var visibleButtonList = [].concat(this.allButtons());
    var moreButtonList = [];
    if (this.maxWidth - this.specialButtonsWidth < this.getButtonsWidth(visibleButtonList)) {
        visibleButtonList.push(this.moreButton);
        this._filterButtons(visibleButtonList, moreButtonList);
    }
    this.visibleButtons(visibleButtonList);
    this._moreButtons(moreButtonList);

    this.visibleButtons.reverse();
};

tutao.tutanota.ctrl.ButtonBarViewModel.prototype.updateSpecialButtons = function() {
    this.specialButtonsWidth = this.getButtonsWidth(this.specialButtons());
    this.updateVisibleButtons();
};

/**
 *
 * @param {Array} visibleButtonList
 * @param {Array} moreButtonList
 * @private
 */
tutao.tutanota.ctrl.ButtonBarViewModel.prototype._filterButtons = function(visibleButtonList, moreButtonList) {
    if (this.maxWidth - this.specialButtonsWidth < this.getButtonsWidth(visibleButtonList)) {
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
    var lowestPriority = tutao.tutanota.ctrl.Button.ALWAYS_VISIBLE_PRIO; // tutao.tutanota.ctrl.Button.ALWAYS_VISIBLE_PRIO is max
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
