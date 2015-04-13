"use strict";

tutao.provide('tutao.tutanota.gui.BubbleInputGui');

/**
 * Resizes the input field to be maximized in the last line if there is enough space (at least more than 15px)
 * @param {*} inputField The dom element.
 * @param {string} text The text of the inputField.
 */
tutao.tutanota.gui.BubbleInputGui.resizeInputField = function(inputField, text) {
	var inputFieldDiv = $(inputField).parent();
	var bubbles = inputFieldDiv.siblings();
	var inputContainer = inputFieldDiv.parent();
	var maxLineWidth = inputContainer.width() - 5; // subtract 5 MS pixel (at least two pixels are needed in ie10, the rest are ms security pixels ;-))
	var maxTopValue = Math.max.apply(null, bubbles.map(function() {return $(this).position().top;}));
	var lastLineWidth = 0;
	bubbles.each(function() {
		var element = $(this);
		if (element.position().top === maxTopValue) {
			lastLineWidth += element.outerWidth(true);
		}
	});
	var remainingSpace = maxLineWidth - lastLineWidth;
	var textWidth = this._measureTextWidth(text, $(inputField).css('font'));
	// create a new line when there is not enough space for a single character (15px) or if the remaining space is smaller than the textwidth
	if (remainingSpace >= 15 && remainingSpace > textWidth) {
		inputFieldDiv.width(remainingSpace);
	} else {
		inputFieldDiv.width(maxLineWidth);
	}
};

/**
 * Sets the cursor to the end of the input field.
 * @param {*} target The target or one of it's children must be an input field (input with type='text').
 */
tutao.tutanota.gui.BubbleInputGui.setCursorToEnd = function(target) {
	if (!$(target).is("input[type=text]")) {
		target = $(target).find("input[type=text]");
	}
	$(target).each(function() {
		tutao.tutanota.gui.BubbleInputGui.setSelectionRange(this, this.value.length, this.value.length);
	});
};

/**
 * Sets the selection on an input field.
 * @param {*} input The input field.
 * @param {number} selectionStart The start of the selection.
 * @param {number} selectionEnd The end of the selection.
 */
tutao.tutanota.gui.BubbleInputGui.setSelectionRange = function(input, selectionStart, selectionEnd) {
	if (input.setSelectionRange) {
	    input.focus();
	    input.setSelectionRange(selectionStart, selectionEnd);
	} else if (input.createTextRange) {
	    var range = input.createTextRange();
	    range.collapse(true);
	    range.moveEnd('character', selectionEnd);
	    range.moveStart('character', selectionStart);
	    range.select();
	}
};

/**
 * Measures the width of a text with the provided font.
 * @param {string} text The text to measure.
 * @param {string} font The css font style.
 * @return {number} the width of the text in px.
 */
tutao.tutanota.gui.BubbleInputGui._measureTextWidth = function(text, font) {
	var sanitizedText = tutao.locator.htmlSanitizer.sanitize(text, false).text;
    var id = 'text-width-tester';
    var tag = $('#' + id);
    if (!tag.length) {
        tag = $('<span id="' + id + '" style="display:none;font:' + font + ';">' + sanitizedText + '</span>');
        $('body').append(tag);
    } else {
        tag.css({font: font}).html(sanitizedText);
    }
    return tag.width();
};
