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
 * @param {function(Element):number=} measureFunction A function that returns the width of the buttons dom element including margins.
 *                                          This function should only be provided if the buttons are no standard-buttons
 */
tutao.tutanota.ctrl.ButtonBarViewModel = function(buttons,moreButtonText, measureFunction) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    if(!moreButtonText) {
        moreButtonText = "dots_label";
    }

    this.moreButton = new tutao.tutanota.ctrl.Button(moreButtonText, 100, this.switchMore, this.isMoreVisible, false, "moreAction",  "more", moreButtonText);
    if (measureFunction) {
        this._getSingleButtonWidth = measureFunction;
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

    //  Decorate the click listener of all buttons to close the more menu
    var self = this;
    for( var i=0; i< buttons.length; i++){
        // we hide after a short delay to make the successful touch action visible (highlight the button)
        var hideMoreAfterShortDelay = function () {
            setTimeout(function () {
                self.hideMore();
            },300);
        }
        buttons[i].setHideButtonsHandler(hideMoreAfterShortDelay);
    }

	this.moreButtons = ko.observableArray(); // the buttons that will be shown in more menu
	this.visibleButtons = ko.observableArray(); // the buttons that are visible in button bar
    this.moreVisible = ko.observable(false);
    this.maxWidth = 0;
    this.widthSubscription = null;

	this.allButtons.subscribe(function() {
		this.updateVisibleButtons();
	}, this);

    this._widthInterval = null;
};

tutao.tutanota.ctrl.ButtonBarViewModel.prototype.setButtonBarWidth = function(width) {
    this.maxWidth = width;
    this.updateVisibleButtons();
};

tutao.tutanota.ctrl.ButtonBarViewModel.prototype.isMoreVisible = function() {
    if (tutao.locator.viewManager.isUserLoggedIn){
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
    if (!this.widthSubscription) {
        this.widthSubscription = tutao.locator.viewManager.windowWidthObservable.subscribe( function() {
            setTimeout(this.updateVisibleButtons, 0); // the column width is not yet updated when the window width changes, so use a timeout
        }, this);
    }

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

/**
 * @param {tutao.tutanota.ctrl.Button} button The button to measure
 * @return {number} The width including the margin of the button
 */
tutao.tutanota.ctrl.ButtonBarViewModel.prototype._getSingleButtonWidth = function (button) {
    // ATTENTION: If this width is changed, we have to update the measure function in ViewManager!
    return 45;
};