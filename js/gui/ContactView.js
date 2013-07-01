"use strict";

goog.provide('tutao.tutanota.gui.ContactView');

/**
 * @constructor
 * @implements {tutao.tutanota.ctrl.View}
 */
tutao.tutanota.gui.ContactView = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

	this._leftmostVisibleColumn = ko.observable(-1);
	this._rightmostVisibleColumn = ko.observable(-1);
};

/**
 * These ids are actually returned by addViewColumn.
 */
tutao.tutanota.gui.ContactView.COLUMN_CONTACT_LIST = 0;
tutao.tutanota.gui.ContactView.COLUMN_CONTACT = 1;

/**
 * @inherit
 */
tutao.tutanota.gui.ContactView.prototype.init = function() {
	var self = this;
	// configure view slider
	this._viewSlider = new tutao.tutanota.ctrl.ViewSlider();

	//TODO read from css
	this._viewSlider.setScreenWidth(tutao.tutanota.gui.getWindowWidth());
	this._viewSlider.setViewPositionAndSizeReceiver(function(x, y, initial) {
		self._leftmostVisibleColumn(self._viewSlider.getLeftmostVisibleColumnId());
		self._rightmostVisibleColumn(self._viewSlider.getRightmostVisibleColumnId());
		tutao.tutanota.gui.viewPositionAndSizeReceiver("#contactContent", x, y, initial);
	});
	this._viewSlider.addViewColumn(0, 300, 400, function(x, width) {
		$('#searchAndContactListColumn').css("width", width + "px");
	});
	this._viewSlider.addViewColumn(1, 600, 1000, function(x, width) {
		$('#contactColumn').css("width", width + "px");
	});

	this._firstActivation = true;
	this._touchComposingModeActive = false;
};

/**
 * @inherit
 */
tutao.tutanota.gui.ContactView.prototype.isForInternalUserOnly = function() {
	return true;
};

/**
 * @inherit
 */
tutao.tutanota.gui.ContactView.prototype.activate = function() {
	this._viewSlider.setScreenWidth(tutao.tutanota.gui.getWindowWidth());
	if (this._firstActivation) {
		this._firstActivation = false;
		if (tutao.tutanota.util.ClientDetector.isTouchSupported()) {
			// the timeout is a workaround for the bug that the contact list scrolls horizontally
			// on iPad until the orientation is changed (see iss119)
			setTimeout(function() {
				this._contactListScroller = new iScroll('contactList', {useTransition: true});
			}, 0);
			this._contactScroller = new iScroll('innerContactColumn', {useTransition: true});

//			// workaround for input field bug. it allows to set the focus on text input elements
//			// it is currently not needed, because we disable iscroll as soon as we edit a mail
//			this._contactScroller.options.onBeforeScrollStart = function(e) {
//		        var target = e.target;
//
//		        while (target.nodeType != 1) target = target.parentNode;
//
//		        if (!tutao.tutanota.gui.isEditable(e.target)) {
//		            e.preventDefault();
//		        }
//		    };
		}
		// only show the default view columns if this is the first activation, otherwise we want to see the last visible view columns
		this._viewSlider.showDefault();
		tutao.locator.contactListViewModel.init();
	} else {
		this.contactListUpdated();
		this.contactUpdated();
	}
	if (this._touchComposingModeActive) {
		this.enableTouchComposingMode();
	}
};

/**
 * @inherit
 */
tutao.tutanota.gui.ContactView.prototype.deactivate = function() {
	if (this._touchComposingModeActive) {
		this.disableTouchComposingMode();
		// remember that it is active
		this._touchComposingModeActive = true;
	}
};

/**
 * @inherit
 */
tutao.tutanota.gui.ContactView.prototype.windowSizeChanged = function(width, height) {
	this._viewSlider.setScreenWidth(width);
};

/**
 * @inherit
 */
tutao.tutanota.gui.ContactView.prototype.swipeRecognized = function(type) {
	if (type == tutao.tutanota.ctrl.SwipeRecognizer.TYPE_LEFT_IN) {
		if (this.isShowNeighbourColumnPossible(true)) {
			this.showNeighbourColumn(true);
		}
	}
};

/**
 * @inherit
 */
tutao.tutanota.gui.ContactView.prototype.showNeighbourColumn = function(left) {
	var columnToShow = (left) ? this._viewSlider.getLeftmostVisibleColumnId() - 1 : this._viewSlider.getRightmostVisibleColumnId() + 1;
	this._viewSlider.showViewColumn(columnToShow);
};

/**
 * @inherit
 */
tutao.tutanota.gui.ContactView.prototype.isShowNeighbourColumnPossible = function(left) {
	if (left) {
		return (this._leftmostVisibleColumn() == tutao.tutanota.gui.ContactView.COLUMN_CONTACT 
				&& (tutao.locator.contactViewModel.mode() == tutao.tutanota.ctrl.ContactViewModel.MODE_NONE || tutao.locator.contactViewModel.mode() == tutao.tutanota.ctrl.ContactViewModel.MODE_SHOW)); // allow showing contact list
	} else {
		return false;
	}
};

/**
 * Makes sure that the contact list column is visible.
 */
tutao.tutanota.gui.ContactView.prototype.showContactListColumn = function() {
	this._viewSlider.showViewColumn(tutao.tutanota.gui.ContactView.COLUMN_CONTACT_LIST);
};

/**
 * Makes sure that the contact column is visible.
 */
tutao.tutanota.gui.ContactView.prototype.showContactColumn = function() {
	this._viewSlider.showViewColumn(tutao.tutanota.gui.ContactView.COLUMN_CONTACT);
};

/**
 * Must be called when the contact list changes. Updates iScroll.
 */
tutao.tutanota.gui.ContactView.prototype.contactListUpdated = function() {
	if (this._conctactListScroller) {
		this._conctactListScroller.refresh();
	}
};

/**
 * Must be called when the shown contact is changed. Updates iScroll.
 */
tutao.tutanota.gui.ContactView.prototype.contactUpdated = function() {
	if (this._contactScroller) {
		this._contactScroller.refresh();
	}
};

/**
 * The touch composing mode is only used on touch devices in order to allow scrolling the complete body during editing.
 * This is needed because of the keyboard overlay of these devices.
 */
tutao.tutanota.gui.ContactView.prototype.enableTouchComposingMode = function() {
	if (!tutao.tutanota.util.ClientDetector.isTouchSupported()) {
		return;
	}
	this._touchComposingModeActive = true;

	// now we allow scrolling the window vertically, so we need to enable touchmove
	tutao.tutanota.gui.enableWindowScrolling();

	// scrolling the contact is not allowed in touch composing mode because the complete window shall be scrolled
	this._contactScroller.scrollTo(0, 0);
	this._contactScroller.disable();

	tutao.tutanota.gui.addResizeListener($('#contactWrapper')[0], this._updateContactHeight, true);
};

/**
 * This event listener updates the contact height and is invoked whenever the contents of the #contact change.
 * It updates the body height.
 */
tutao.tutanota.gui.ContactView.prototype._updateContactHeight = function(width, height) {
	var newHeight = height + $('#header').height() + 110;
	if (newHeight > tutao.tutanota.gui.getWindowHeight()) {
		$('body').height(newHeight);
	}
};

/**
 * Disables the touch composing mode for the contact view.
 */
tutao.tutanota.gui.ContactView.prototype.disableTouchComposingMode = function() {
	if (!tutao.tutanota.util.ClientDetector.isTouchSupported()) {
		return;
	}
	tutao.tutanota.gui.removeResizeListener($('#contactWrapper')[0], this._updateContactHeight);
	this._touchComposingModeActive = false;
	tutao.tutanota.gui.disableWindowScrolling();
	this._contactScroller.enable();
};
