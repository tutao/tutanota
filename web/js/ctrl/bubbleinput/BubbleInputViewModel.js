"use strict";

tutao.provide('tutao.tutanota.ctrl.bubbleinput.BubbleInputViewModel');

/**
 * Displays a BubbleInputField. A BubbleInputField is an input field that converts text to bubbles
 * for an enhanced user experience. It supports suggestions via a drop down list.
 *
 * Always use with the bubbleinput-template (see index.html)
 *
 * The BubbleInputField consists of the following components:
 * <ul>
 *   <li>bubbles which are created based on the text input of the user and
 *   <li>an input field into which the user types text.
 * </ul>
 *
 * As the BubbleInputField is made of these components, a bit of background work is done in order to provide a seamless user experience:
 * <ul>
 *   <li>The input field gets resized whenever the user types text, or a bubble is created.
 *   <li>We try to create a new bubble if the user has pressed space or return or the focus of the input field gets lost.
 *   <li>If the user clicks anywhere inside the BubbleInputField (besided on bubbles), the underlying input field is focused.
 * </ul>
 *
 * TODO (story: Make navigation items selectable and mark selected item (keyboard navigation)) key event handler on the document that delegates keypresses to the currently active element (must be marked with tabindex)
 *       pseudo-code: ko.dataFor(document.activeElement).keypress(event)
 *
 * @constructor
 * @param {tutao.tutanota.ctrl.bubbleinput.BubbleHandler} bubbleHandler
 */
tutao.tutanota.ctrl.bubbleinput.BubbleInputViewModel = function(bubbleHandler) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	// a delegate for retrieving suggestions and creating bubbles (see BubbleHandler)
	this.bubbleHandler = bubbleHandler;
	// true if the inputField is focused
	this.inputActive = ko.observable(false);
	if (tutao.tutanota.util.ClientDetector.getBrowserType() == tutao.tutanota.util.ClientDetector.BROWSER_TYPE_FIREFOX) {
		// firefox hides fields just in the moment when the focus is lost. If this is enabled for chrome, clicking on suggestions does not work in the exploded distribution
		this.inputActive = this.inputActive.extend({throttle: 0});
	}
	this.inputActive.subscribe(function(active) {
		if (!active && !this.skipNextBlur) {
			this.createBubbles();  // focus lost
		}
	}, this);
	// true if the BubbleInputField is active (currently always when the input field is active)
	this.active = this.inputActive;

    this.loading = ko.observable(false);
	// the current value of the input field
	this.inputValue = ko.observable("");
	this.inputValue.subscribe(function(newValue) {
		tutao.tutanota.gui.BubbleInputGui.resizeInputField(this.inputDomField, newValue);
	}, this);
	this.bubbles = ko.observableArray();
	// The dom element representing the input field. This is used for gui actions like resizing the input field to the correct size (see tutao.tutanota.gui.BubbleInputGui)
	this.inputDomField = null;
    this._latestSearchText = "";
    this.inputValue.subscribe(function() {
        var self = this;
        // Disable search if the last search result was already empty and only characters has been appended to the last result's search text.
        if (this._latestSearchText.length != 0 && tutao.util.StringUtils.startsWith(this.inputValue(), this._latestSearchText) && this.suggestions().length == 0 && !this.loading()) {
            return;
        }
        this.loading(true);
        this._latestSearchText = this.inputValue();
        var currentSearchText = this.inputValue();
        this.bubbleHandler.getSuggestions(this.inputValue(), function(suggestions) {
            // Only update search result if search text has not been changed during search.
            if (currentSearchText == self.inputValue()) {
                self.suggestions(suggestions);
                self.loading(false);
            }
        });
    }, this);
	this.suggestions = ko.observableArray();
	this.selectedSuggestion = ko.observable(null);
	this.suggestions.subscribe(function(newSuggestions) {
		if (newSuggestions.length > 0 && (this.selectedSuggestion() == null || !tutao.util.ArrayUtils.contains(this.suggestions(), this.selectedSuggestion()))) {
			this.selectedSuggestion(newSuggestions[0]);
		} else if (newSuggestions.length == 0 && this.selectedSuggestion() != null) {
			this.selectedSuggestion(null);
		}
	}, this);

	// a blur occurs after a mousedown on a suggestion. These blurs must be skipped in order to hold the cursor on the input field.
	this.skipNextBlur = false;
    this.enabled = true;
};

/**
 * Sets the focus on the input field.
 */
tutao.tutanota.ctrl.bubbleinput.BubbleInputViewModel.prototype.setInputActive = function() {
	this.inputActive(true);
	var self = this;
	// setTimeout is needed because mobile safari hides the cursor after selecting a suggestion otherwise.
	setTimeout(function() {
		tutao.tutanota.gui.BubbleInputGui.setCursorToEnd(self.inputDomField);
	},0);
};

/**
 * Disables input.
 */
tutao.tutanota.ctrl.bubbleinput.BubbleInputViewModel.prototype.setEnabled = function(enabled) {
    this.enabled = enabled;
};

/**
 * Dispatches all relevant key codes to the BubbleInputField (see belows methods).
 * @see http://api.jquery.com/keyup/ and http://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes for key codes
 * @param data
 * @param event
 */
tutao.tutanota.ctrl.bubbleinput.BubbleInputViewModel.prototype.handleKey = function(data, event) {
    if (!this.enabled) {
        return false;
    }
	if (event.which === 13 || event.which === 32) {
		return this.createBubbles(); // return and whitespace
	} else if (event.which === 8) {// backspace, del: 46
		this.handleBackspace();
	} else if (event.which === 46) {
		return this.handleDelete();
	} else if (event.which === 37) {
		this.handleLeftArrow();
	} else if (event.which === 39) {
		return this.handleRightArrow();
	} else if (event.which === 38) {
		return this.handleUpArrow();
	} else if (event.which === 40) {
		return this.handleDownArrow();
	} else if (event.which === 65 && event.ctrlKey) {
		this.selectAll();
	} else if (event.which === 17) {
		// do not react on ctrl key
	} else {
		this.removeBubbleSelection();
	}
	return true;
};

/**
 * Does the following when a backspache occurs:
 * <ul>
 *   <li>If no bubble is selected and the cursor is positioned at the beginning of the input field, the last bubble gets selected
 *   <li>If at least one bubble is selected, the bubbles are deleted and the selection is set on the left sibling of the leftmost deleted bubble
 * </ul>
 */
tutao.tutanota.ctrl.bubbleinput.BubbleInputViewModel.prototype.handleBackspace = function() {
	if (this.isBubbleSelected()) {
		var nextSelection = null;
		for (var i = 0; i < this.bubbles().length; i++) {
			if (this.bubbles()[i].selected() && i > 0) {
				nextSelection = this.bubbles()[i - 1];
				break;
			}
		}
		this.deleteSelectedBubbles();
		if (nextSelection) {
			nextSelection.selected(true);
		}
	} else if (this.inputValue() == "") {
		this.selectLastBubble();
	}
};

/**
 * If at least one bubble is selected, the bubbles are deleted and the selection is set on the right sibling of the rightmost deleted bubble
 */
tutao.tutanota.ctrl.bubbleinput.BubbleInputViewModel.prototype.handleDelete = function() {
	if (this.isBubbleSelected()) {
		var nextSelection = null;
		for (var i = this.bubbles().length - 1; i >= 0; i--) {
			if (this.bubbles()[i].selected() && i < this.bubbles().length - 1) {
				nextSelection = this.bubbles()[i + 1];
				break;
			}
		}
		this.deleteSelectedBubbles();
		if (nextSelection) {
			nextSelection.selected(true);
		}
		return true;
	}
	return true;
};

/**
 * Steps from right to left through the bubbles when the cursor is positioned on the first position of the input field
 */
tutao.tutanota.ctrl.bubbleinput.BubbleInputViewModel.prototype.handleLeftArrow = function() {
	if (this.isBubbleSelected()) {
		for (var i = 0; i < this.bubbles().length; i++) {
			if (this.bubbles()[i].selected()) {
				if (i > 0) {
					this.bubbles()[i].selected(false);
					this.bubbles()[i - 1].selected(true);
					return;
				}
			}
		}
	} else {
		this.selectLastBubble();
	}
};

/**
 * Steps from left to right through the bubbles
 * @return {boolean} false, if another bubble has been selected, true otherwise.
 */
tutao.tutanota.ctrl.bubbleinput.BubbleInputViewModel.prototype.handleRightArrow = function() {
	if (this.isBubbleSelected()) {
		for (var i = 0; i < this.bubbles().length; i++) {
			if (this.bubbles()[i].selected()) {
					this.bubbles()[i].selected(false);
					if (i < this.bubbles().length - 1) {
						this.bubbles()[i + 1].selected(true);
					}
					return false;
			}
		}
	}
	return true;
};

/**
 * Selects the previous available suggestions
 * @return {boolean} false.
 */
tutao.tutanota.ctrl.bubbleinput.BubbleInputViewModel.prototype.handleUpArrow = function() {
	if (this.selectedSuggestion()) {
		var nextPosition = this.suggestions().indexOf(this.selectedSuggestion()) - 1;
		if (nextPosition == -1) {
			nextPosition = this.suggestions().length - 1;
		} else {
			nextPosition = nextPosition % this.suggestions().length;
		}
		this.selectedSuggestion(this.suggestions()[nextPosition]);
	}
	return false;
};

/**
 * Selects the next available suggestions
 * @return {boolean} false.
 */
tutao.tutanota.ctrl.bubbleinput.BubbleInputViewModel.prototype.handleDownArrow = function() {
	if (this.selectedSuggestion()) {
		var nextPosition = this.suggestions().indexOf(this.selectedSuggestion()) + 1;
		this.selectedSuggestion(this.suggestions()[nextPosition % this.suggestions().length]);
	}
	return false;
};

/**
 * Selects the last bubble if the cursor is positioned at the beginning of the input field
 */
tutao.tutanota.ctrl.bubbleinput.BubbleInputViewModel.prototype.selectLastBubble = function() {
	var lastElement = tutao.util.ArrayUtils.last(this.bubbles());
    // getting the cursor position of input type=email fields does not work on chrome, so we check that the field is empty instead
    if (lastElement && this.inputValue() == "") {
        lastElement.selected(true);
    }
};

/**
 * Deletes all currently selected bubbles.
 */
tutao.tutanota.ctrl.bubbleinput.BubbleInputViewModel.prototype.deleteSelectedBubbles = function() {
	for (var i = this.bubbles().length - 1; i >= 0; i--) {
		if (this.bubbles()[i].selected()) {
			var deletedBubble = this.bubbles.splice(i, 1)[0];
			this.bubbleHandler.bubbleDeleted(deletedBubble);
		}
	}
	tutao.tutanota.gui.BubbleInputGui.resizeInputField(this.inputDomField, this.inputValue());
};

/**
 * Removes the selection from all selected bubbles
 */
tutao.tutanota.ctrl.bubbleinput.BubbleInputViewModel.prototype.removeBubbleSelection = function() {
	for (var i = 0; i < this.bubbles().length; i++) {
		if (this.bubbles()[i].selected()) {
			this.bubbles()[i].selected(false);
		}
	}
};

/**
 * @return {Boolean} true, if at least one bubble is selected.
 */
tutao.tutanota.ctrl.bubbleinput.BubbleInputViewModel.prototype.isBubbleSelected = function() {
	for (var i = 0; i < this.bubbles().length; i++) {
		if (this.bubbles()[i].selected()) {
			return true;
		}
	}
	return false;
};

/**
 * Creates a new bubble (delegates to the bubbleHandler)
 * @return {boolean} true, if the bubble has been created, false otherwise.
 */
tutao.tutanota.ctrl.bubbleinput.BubbleInputViewModel.prototype.createBubbles = function() {
	var value = this.inputValue().trim();
	if (value === "") {
		return false;
	}
	var bubbles = [];
	// if there is a selected suggestion, we shall create a bubble from that suggestions instead of the entered text
	if (this.selectedSuggestion()) {
        var bubble = this.bubbleHandler.createBubbleFromSuggestion(this.selectedSuggestion());
        if (bubble) {
            bubbles.push(bubble);
        }
	} else {
		bubbles = this.bubbleHandler.createBubblesFromText(value);
	}
	if (bubbles.length > 0) {
        for (var i=0; i<bubbles.length; i++) {
		    this.bubbles.push(bubbles[i]);
        }
		this.inputValue("");
		tutao.tutanota.gui.BubbleInputGui.resizeInputField(this.inputDomField, this.inputValue());
	}
	return false;
};

/**
 * Selects all bubbles.
 */
tutao.tutanota.ctrl.bubbleinput.BubbleInputViewModel.prototype.selectAll = function() {
	for (var i = 0; i < this.bubbles().length; i++) {
		this.bubbles()[i].selected(true);
	}
};

/**
 * Sets the inputDomField when the dom is created.
 * @param {Object} domElement The dom element.
 */
tutao.tutanota.ctrl.bubbleinput.BubbleInputViewModel.prototype.setInputField = function(domElement) {
	this.inputDomField = domElement;
};

/**
 * Handles blur events of the input field and resets the focus to the input field if skipNextBlur is true.
 * @param {BubbleInputviewModel} vm The BubbleInputViewModel.
 * @param {jQuery.Event} event The blur event.
 * @return {Boolean} false, if the focus to the input field has been resetted (prevents default) and true otherwise.
 */
tutao.tutanota.ctrl.bubbleinput.BubbleInputViewModel.prototype.inputFieldBlurFired = function(vm, event) {
	if (this.skipNextBlur) {
		this.skipNextBlur = false;
		this.setInputActive();
		return false;
	}
	return true;
};

/**
 * Handles the mousedown event on a suggestion and sets skipNextBlur to true
 * @return {Boolean} true.
 */
tutao.tutanota.ctrl.bubbleinput.BubbleInputViewModel.prototype.suggestionMousedownFired = function() {
	this.skipNextBlur = true;
	return true;
};


/**
 * Creates a bubble for the given suggestion.
 * @param {tutao.tutanota.ctrl.bubbleinput.Suggestion} suggestion The suggestion.
 * @param {jQuery.Event} event Not used currently.
 */
tutao.tutanota.ctrl.bubbleinput.BubbleInputViewModel.prototype.acceptSuggestion = function(suggestion, event) {
	var bubble = this.bubbleHandler.createBubbleFromSuggestion(suggestion);
	if (bubble) {
		this.bubbles.push(bubble);
		this.inputValue("");
		tutao.tutanota.gui.BubbleInputGui.resizeInputField(this.inputDomField, this.inputValue());
	}
	this.setInputActive();
	return true;
};

/**
 * Adds the given bubble to the bubble input field.
 * @param {tutao.tutanota.ctrl.bubbleinput.Bubble} bubble The bubble.
 */
tutao.tutanota.ctrl.bubbleinput.BubbleInputViewModel.prototype.addBubble = function(bubble) {
	var self = this;
	this.bubbles.push(bubble);
	setTimeout(function() {
		tutao.tutanota.gui.BubbleInputGui.resizeInputField(self.inputDomField, self.inputValue());
	}, 0);
};

/**
 * Deletes the given bubble.
 */
tutao.tutanota.ctrl.bubbleinput.BubbleInputViewModel.prototype.removeBubble = function(bubble) {
    var deletedBubble = this.bubbles.splice(this.bubbles.indexOf(bubble), 1)[0];
    this.bubbleHandler.bubbleDeleted(deletedBubble);
    tutao.tutanota.gui.BubbleInputGui.resizeInputField(this.inputDomField, this.inputValue());
};
