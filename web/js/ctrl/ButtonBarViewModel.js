"use strict";

tutao.provide('tutao.tutanota.ctrl.ButtonBarViewModel');

// - move gui part to custom binding
// - width adaption when scrollbar appears/disappears

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

    if (!moreButtonText) {
        moreButtonText = "more_label";
    }

    this.moreButton = new tutao.tutanota.ctrl.Button(moreButtonText, tutao.tutanota.ctrl.Button.ALWAYS_VISIBLE_PRIO, this.switchMore, this.isMoreVisible, false, "moreAction",  "more", moreButtonText);
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

    //  Decorate the click listener of all buttons to close the more menu
    var self = this;
    for( var i=0; i< buttons.length; i++){
        // we hide after a short delay to make the successful touch action visible (highlight the button)
        var hideMoreAfterShortDelay = function () {
            setTimeout(function () {
                self.hideMore();
            },300);
        };
        buttons[i].setHideButtonsHandler(hideMoreAfterShortDelay);
    }

	this.moreButtons = ko.observableArray(); // the buttons that will be shown in more menu
	this.visibleButtons = ko.observableArray(); // the buttons that are visible in button bar
    this.moreVisible = ko.observable(false);
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
    this.maxWidth = width;
    this.updateSpecialButtons();
};

tutao.tutanota.ctrl.ButtonBarViewModel.prototype.isMoreVisible = function() {
    if (tutao.locator.viewManager.isUserLoggedIn) {
        return this.moreVisible();
    }
    return false;
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
    this.moreButtons(moreButtonList);

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


tutao.tutanota.ctrl.ButtonBarViewModel.prototype.hasMoreButton = function() {
    return this.moreButtons.length != 0;
};

tutao.tutanota.ctrl.ButtonBarViewModel.prototype._showMore = function() {
    tutao.locator.modalPageBackgroundViewModel.show(this.hideMore);
    this.moreVisible(true);
};

tutao.tutanota.ctrl.ButtonBarViewModel.prototype.hideMore = function(vm, event) {
    // when tapping on the menu item also the parent modalDialog receives an event. the menu item hides the more menu itself, so hide it here only if the modalDialog itself was tapped
    if (!event || event.target.className.indexOf("modalDialog") != -1) {
        this.moreVisible(false);
    }
};

tutao.tutanota.ctrl.ButtonBarViewModel.prototype.switchMore = function() {
    if (this.moreVisible()){
        this.hideMore();
    }else{
        this._showMore();
    }
};
