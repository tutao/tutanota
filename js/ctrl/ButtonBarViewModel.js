"use strict";

goog.provide('tutao.tutanota.ctrl.ButtonBarViewModel');

// - move gui part to custom binding
// - width adaption when scrollbar appears/disappears

/**
 * Defines a button bar.
 *
 * @constructor
 * @param {Object} buttons An observable array containing any number of
 *            tutao.tutanota.ctrl.Button instances.
 */
tutao.tutanota.ctrl.ButtonBarViewModel = function(buttons) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    this.moreButton = new tutao.tutanota.ctrl.Button("...", 100, this.switchMore);
    $("button#measureButton").text(this.moreButton.getLabel());
    this.moreButton.width($("button#measureButton").outerWidth(true));

	this.allButtons = buttons;
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
tutao.tutanota.ctrl.ButtonBarViewModel.prototype.getButtonWidth = function(buttons) {
    var buttonWidth = 0;
    for(var i=0; i< buttons.length; i++) {
        buttonWidth += buttons[i].width();
    }
    return buttonWidth;
};


tutao.tutanota.ctrl.ButtonBarViewModel.prototype.updateVisibleButtons = function() {
    if (!this.widthSubscription) {
        this.widthSubscription = tutao.locator.viewManager.windowWidthObservable.subscribe( function() {
            setTimeout(this.updateVisibleButtons, 0); // the column width is not yet updated when the window width changes, so use a timeout
        }, this);
    }
    var buttonMargin = 0;
    for(var i=0; i< this.allButtons().length; i++) {
        var currentButton = this.allButtons()[i];
        $("button#measureButton").text(currentButton.getLabel());
        currentButton.width($("button#measureButton").outerWidth(true));
        if (buttonMargin == 0) {
            buttonMargin = parseInt($("button#measureButton").css("margin-right"));
        }
    }

    this.maxWidth = $(this.domButtonBar()).width() - buttonMargin;

    var visibleButtonList = [].concat(this.allButtons());
    var moreButtonList = [];
    if (this.maxWidth < this.getButtonWidth(visibleButtonList)){
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
    if ( this.maxWidth < this.getButtonWidth(visibleButtonList)){
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

