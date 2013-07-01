"use strict";

goog.provide('tutao.tutanota.ctrl.ButtonBarViewModel');

// TODO move gui part to custom binding
// TODO width adaption when scrollbar appears/disappears
// TODO width adaption when window width changes

/**
 * Defines a button bar.
 *
 * @constructor
 * @param {Object}
 *            button An observable array containing any number of
 *            tutao.tutanota.ctrl.Button instances.
 */
tutao.tutanota.ctrl.ButtonBarViewModel = function(buttons) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

	this.buttons = buttons;
	this.nextButtons = ko.observableArray(); // the buttons that will be shown next (after the visibleButtons have moved away)
	this.visibleButtons = ko.observableArray(); // the buttons that are currently visible
	this.domButtons = ko.observable();
	this.maxWidth = ko.observable(0);
	var self = this;
	this.domButtons.subscribe(function(value) {
		var id = null;
		id = setInterval(function() {
			var maxWidth = $(self.domButtons()).parent().width();
			if (maxWidth != 0) {
				clearInterval(id);
				self.maxWidth(maxWidth);
				self._init();
			}
		}, 50);
	});
	this.buttons.subscribe(function() {
		self._init();
	});
};

tutao.tutanota.ctrl.ButtonBarViewModel.prototype._init = function() {
	if (this.maxWidth() == 0) {
		return;
	}

	ko.utils.arrayForEach(this.buttons(), function(button) {
		$("button#measureButton").text(button.getLabel());
		button.width($("button#measureButton").outerWidth(true));
	});

	this.visibleButtons([]);
	this.nextButtons([]);
	// directly show first buttons
	this._switchButtons();
	var myWidth = 0;
	for (var i = 0; i < this.nextButtons().length; i++) {
		myWidth += this.nextButtons()[i].width();
	}
	$(this.domButtons()).css('right', '0px');
	$(this.domButtons()).width(myWidth);
	this.visibleButtons(this.nextButtons());
};

tutao.tutanota.ctrl.ButtonBarViewModel.prototype.hasMoreButton = function() {
	if (this.maxWidth() == 0) {
		return false;
	}

	var maxWidth = $(this.domButtons()).parent().width();
	if (this.maxWidth() != maxWidth) {
		this.maxWidth(maxWidth);
		this._init();
	}

	var myWidth = 0;
	for (var i = 0; i < this.buttons().length; i++) {
		myWidth += this.buttons()[i].width();
	}

	// check both max width and buttons explicitly to invoke observable subscriptions
	var tooSmallMaxWidth = (myWidth > this.maxWidth());
	var hiddenButtons = false;
	ko.utils.arrayForEach(this.buttons(), function(button) {
		hiddenButtons = hiddenButtons || (button.getVisibility() == tutao.tutanota.ctrl.Button.VISIBILITY_HIDDEN);
	});
	return (tooSmallMaxWidth || hiddenButtons);
};

tutao.tutanota.ctrl.ButtonBarViewModel.prototype.showMore = function() {
	var self = this;
	self._switchButtons();
	var nextWidth = 0;
	for (var i = 0; i < this.nextButtons().length; i++) {
		nextWidth += this.nextButtons()[i].width();
	}
	$(this.domButtons()).animate({
		right: -$(self.domButtons()).width() + 'px'
	}, 300, function() { // move buttons out
		self.visibleButtons(self.nextButtons());
		$(self.domButtons()).width(nextWidth);
		$(self.domButtons()).css('right', -nextWidth + 'px');
		$(self.domButtons()).animate({
			right: '0px'
		}, 300); // move buttons in
	});
};

tutao.tutanota.ctrl.ButtonBarViewModel.prototype._switchButtons = function() {
	var nextButtons = [];
	if (this.visibleButtons().length == 0
			|| this.visibleButtons()[this.visibleButtons().length - 1] == this
					.buttons()[this.buttons().length - 1]) {
		// the last buttons are are shown, so show the default visible buttons
		// again
		var currentWidth = 0;
		for (var i = 0; i < this.buttons().length; i++) {
			if (this.buttons()[i].getVisibility() != tutao.tutanota.ctrl.Button.VISIBILITY_HIDDEN
					&& currentWidth + this.buttons()[i].width() <= this
							.maxWidth()) {
				nextButtons.push(this.buttons()[i]);
				currentWidth += this.buttons()[i].width();
			}
		}
	} else {
		// the next buttons from the button list are shown. find the first of
		// the next.
		var firstOfNext = null;
		var currentWidth = 0;
		for (var i = 0; i < this.buttons().length; i++) {
			if (firstOfNext) {
				if (currentWidth + this.buttons()[i].width() <= this.maxWidth()) {
					nextButtons.push(this.buttons()[i]);
					currentWidth += this.buttons()[i].width();
				}
			} else {
				if (this.buttons()[i] == this.visibleButtons()[this
						.visibleButtons().length - 1]) {
					// found the button in the button list that is the last one
					// in the currently visible buttons.
					// add new visible buttons beginning with the next in the
					// button list
					firstOfNext = i + 1;
				}
			}
		}
	}
	this.nextButtons(nextButtons);
};
