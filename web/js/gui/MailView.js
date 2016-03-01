"use strict";

tutao.provide('tutao.tutanota.gui.MailView');

/**
 * @constructor
 * @implements {tutao.tutanota.ctrl.View}
 */
tutao.tutanota.gui.MailView = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this._welcomeMessage = "";
};

/**
 * These ids are returned by addViewColumn.
 */
tutao.tutanota.gui.MailView.COLUMN_FOLDERS = null;
tutao.tutanota.gui.MailView.COLUMN_MAIL_LIST = null;
tutao.tutanota.gui.MailView.COLUMN_CONVERSATION = null;
tutao.tutanota.gui.MailView.COLUMN_PASSWORD_CHANNELS = null;

/**
 * @inherit
 */
tutao.tutanota.gui.MailView.prototype.init = function(external, updateColumnTitleCallback) {
    this._swipeSlider = new tutao.tutanota.gui.SwipeSlider(this, "mailContent", updateColumnTitleCallback);
    tutao.tutanota.gui.MailView.COLUMN_FOLDERS = this._swipeSlider.addViewColumn(2, 200, 420, 'mailFolderColumn', function() { return tutao.lang("folderTitle_label"); });
    tutao.tutanota.gui.MailView.COLUMN_MAIL_LIST = this._swipeSlider.addViewColumn(0, 300, 800, 'searchAndMailListColumn', tutao.locator.mailFolderListViewModel.getSelectedFolderName );
    tutao.tutanota.gui.MailView.COLUMN_CONVERSATION = this._swipeSlider.addViewColumn(1, 600, 1024, 'conversationColumn',tutao.locator.mailViewModel.getColumnTitleText);
	if (!external) {
        tutao.tutanota.gui.MailView.COLUMN_PASSWORD_CHANNELS = this._swipeSlider.addViewColumn(3, 300, 800, 'passwordChannelColumn');
	}

};

tutao.tutanota.gui.MailView.prototype.getMailListColumnWidth = function() {
    return this._swipeSlider.getViewSlider().getViewColumnWidth(tutao.tutanota.gui.MailView.COLUMN_MAIL_LIST);
};

/**
 * @inherit
 */
tutao.tutanota.gui.MailView.prototype.isForInternalUserOnly = function() {
	return false;
};

/**
 * @inherit
 */
tutao.tutanota.gui.MailView.prototype.activate = function() {
    this._swipeSlider.activate();
};

/**
 * @inherit
 */
tutao.tutanota.gui.MailView.prototype.deactivate = function() {
    tutao.locator.mailListViewModel.disableMobileMultiSelect();
};

/**
 * @inherit
 */
tutao.tutanota.gui.MailView.prototype.isShowLeftNeighbourColumnPossible = function() {
    return (this._swipeSlider.getLeftmostVisibleColumnId() == tutao.tutanota.gui.MailView.COLUMN_MAIL_LIST) || // allow showing tag list
    (this._swipeSlider.getLeftmostVisibleColumnId() == tutao.tutanota.gui.MailView.COLUMN_CONVERSATION && !tutao.locator.mailViewModel.isComposingState()) || // allow showing mail list if displayed mail is visible
    (this._swipeSlider.getLeftmostVisibleColumnId() == tutao.tutanota.gui.MailView.COLUMN_PASSWORD_CHANNELS); // allow showing composing mail if only password channels are visible
};

/**
 * @inherit
 */
tutao.tutanota.gui.MailView.prototype.isShowRightNeighbourColumnPossible = function() {
    return ((this._swipeSlider.getRightmostVisibleColumnId() == tutao.tutanota.gui.MailView.COLUMN_CONVERSATION) && (tutao.locator.passwordChannelViewModel.getSecureExternalRecipients().length > 0) || // allow showing password channels if composing mail is visible
        (this._swipeSlider.getLeftmostVisibleColumnId() == tutao.tutanota.gui.MailView.COLUMN_FOLDERS && this._swipeSlider.getRightmostVisibleColumnId() <= tutao.tutanota.gui.MailView.COLUMN_MAIL_LIST)); // allow slide out tag list
};

/**
 * @inherit
 */
tutao.tutanota.gui.MailView.prototype.getSwipeSlider = function() {
    return this._swipeSlider;
};

/**
 * Makes sure that the default columns are visible (at least including the mail list column).
 * @return {Promise} When finished.
 */
tutao.tutanota.gui.MailView.prototype.showDefaultColumns = function() {
	return this._swipeSlider.getViewSlider().showDefault();
};

/**
 * See return
 * @return {boolean} true, if the mail list column is visible.
 */
tutao.tutanota.gui.MailView.prototype.isMailListColumnVisible = function() {
    return (this._swipeSlider.getLeftmostVisibleColumnId() <= tutao.tutanota.gui.MailView.COLUMN_MAIL_LIST) && (this._swipeSlider.getRightmostVisibleColumnId() >= tutao.tutanota.gui.MailView.COLUMN_MAIL_LIST);
};

tutao.tutanota.gui.MailView.prototype.isDefaultColumnsVisible = function() {
    return this._swipeSlider.getViewSlider().isDefaultVisible();
};

/**
 * Makes sure that the conversation column is visible.
 * @return {Promise} When finished.
 */
tutao.tutanota.gui.MailView.prototype.showConversationColumn = function() {
	if (!this.isConversationColumnVisible()) {
        return this._swipeSlider.getViewSlider().showViewColumn(tutao.tutanota.gui.MailView.COLUMN_CONVERSATION);
	} else {
		return Promise.resolve();
	}
};

/**
 * See return
 * @return {boolean} true, if the conversation column is visible.
 */
tutao.tutanota.gui.MailView.prototype.isConversationColumnVisible = function() {
    return (this._swipeSlider.getLeftmostVisibleColumnId() <= tutao.tutanota.gui.MailView.COLUMN_CONVERSATION) && (this._swipeSlider.getRightmostVisibleColumnId() >= tutao.tutanota.gui.MailView.COLUMN_CONVERSATION);
};

/**
 * Makes sure that the password channel column is visible.
 */
tutao.tutanota.gui.MailView.prototype.showPasswordChannelColumn = function() {
	this._swipeSlider.getViewSlider().showViewColumn(tutao.tutanota.gui.MailView.COLUMN_PASSWORD_CHANNELS);
};

/**
 * See return
 * @return {boolean} true, if the password channel column is visible.
 */
tutao.tutanota.gui.MailView.prototype.isPasswordChannelColumnVisible = function() {
    return (this._swipeSlider.getRightmostVisibleColumnId() == tutao.tutanota.gui.MailView.COLUMN_PASSWORD_CHANNELS);
};

/**
 * Sets the composing mail body text.
 * @param {string} text The html body text.
 */
tutao.tutanota.gui.MailView.prototype.setComposingBody = function(text) {
	var composeBody = $(".conversation").find(".composeBody");
    if (composeBody.length == 0) {
        throw new Error("no composing mail created");
    }
	var result = tutao.locator.htmlSanitizer.sanitize(text, false);
    composeBody.append(result.text);
    this.addSubmitCheckToDivs(composeBody);
};

/**
 * Gets the composing mail body text.
 * @return {string} The html body text.
 */
tutao.tutanota.gui.MailView.prototype.getComposingBody = function() {
	var bodyTextNode = $(".conversation").find(".composeBody");
	// sibling blockquotes on top level are not merged if separated by user
    var result = tutao.locator.htmlSanitizer.sanitize(bodyTextNode.html(), false);
    var text = tutao.tutanota.util.Formatter.urlify(result.text);
	return text;
};


tutao.tutanota.gui.MailView.prototype.clearComposingBody = function() {
	var composeBody = $(".conversation").find(".composeBody");
	if (composeBody.length == 0) {
		throw new Error("no composing mail created");
	}
	composeBody.html("");
};


/**
 * Splits the highest parent of current below boundary into two parts. The parts are separated
 * from current to the highest parent below boundary whereas current belongs to the first
 * part and all following siblings of current belong to the second part.
 *
 * The parents of current are splitted and therefore created for a second time for the second
 * part. Other elements are from first to second part, if needed.
 *
 * A new paragraph (<p>) is inserted between the two parts. This paragraph contains a whitespace
 * to make sure that the browser reserves space for it.
 *
 * @param {Object} current The dom element with the current cursor position.
 * @param {Object} boundary The dom element (contenteditable) that surrounds the editing area.
 * @param {Object} childToAdd The dom element that should be added as first child to the newly
 * 					created parent or next to the newly created <p> as child of the boundary.
 * @return
 */
tutao.tutanota.gui.MailView.splitBlockquote = function(current, boundary, childToAdd) {
	var parent = current.parentNode;
	if (parent.nodeType === tutao.tutanota.gui.ELEMENT_NODE && parent != boundary) { // only add Element nodes
		var newParent = $("<" + parent.nodeName + ">");
		newParent.attr("class", $(parent).attr("class"));
		newParent.attr("style", $(parent).attr("style"));
		if (childToAdd && childToAdd.childNodes.length != 0) {
			newParent.append(childToAdd);
		}
		var next = current;
		var siblingsToAdd = [];
		while (next = next.nextSibling) {
			siblingsToAdd.push(next);
		}
		for (var i = 0; i < siblingsToAdd.length; i++) {
			newParent.append(siblingsToAdd[i]);
		}

		return tutao.tutanota.gui.MailView.splitBlockquote(parent, boundary, newParent.get(0));
	} else if (childToAdd) {
		if (childToAdd && childToAdd.childNodes.length != 0) {
			$(current).after(childToAdd);
		}
		var textNode = $("<p>&nbsp;</p>");
		$(current).after(textNode);
		return textNode;
	}
};

/**
 * A key event listener that handles inserting blank newlines into quotations in a contenteditable. Must be attached to a contenteditable.
 * @param {Object} vm The view model.
 * @param {Object} e The jquery key event.
 * @return {boolean} True if the event was handled, false otherwise.
 */
tutao.tutanota.gui.MailView.handleMailComposerReturnKey = function(vm, e) {
	if (e.keyCode === 13) {
		var boundary = e.target;
		var range = null;
	    if (window.getSelection && window.getSelection().getRangeAt) {
	        range = window.getSelection().getRangeAt(0);
	    } else if (document.selection && document.selection.createRange) {
	        range = document.selection.createRange();
	    }
	    if (range) {
	    	var current = range.startContainer;
	    	if (current.nodeType === tutao.tutanota.gui.TEXT_NODE && range.startOffset != current.length) {
	    		current.splitText(range.startOffset);
	    	} else if (current.nodeType === tutao.tutanota.gui.ELEMENT_NODE && current.childNodes.length !== 0) {
	    		current = range.startContainer.childNodes[range.startOffset];
	    	}
	    	if ($(current).parentsUntil(boundary).filter($(boundary).find("> blockquote.tutanota_quote")).size() > 0) {
	    		var newTextNode = tutao.tutanota.gui.MailView.splitBlockquote(current, boundary);
	    		if (newTextNode) {
	    			range = document.createRange();
	    			range.setStart(newTextNode.get(0), 0);
	    			range.setEnd(newTextNode.get(0), 0);
	    			range.collapse(true);
	    			window.getSelection().removeAllRanges();
	    			window.getSelection().addRange(range);
	    			return false;
	    		}
	    	}
	    }
	}
	return true;
};

/**
 * Tries to find the one quotation block inside the given html and returns it separated from the "normal" part. If more than one quotation block is found, everything is returned
 * as "normal" part. Optimized for Tutanota, gmail, thunderbird and partly Outlook (quotes with left border).
 * @param {string} html The html text to check.
 * @return {Object.<string,string>} An object containing a "text" property and a "quotation" property with the separated html parts. The quotation part may be empty.
 */
tutao.tutanota.gui.MailView.prototype.splitMailTextQuotation = function(html) {
	var div = $("<div>" + html + "</div>");
	var quotes = div.find("> blockquote.tutanota_quote, > blockquote.gmail_quote, > blockquote.thunderbird_quote");
	if (quotes.length === 0) {
		quotes = this._findNearestOutlookQuotations(div);
	}
	if (quotes.length == 1) {
		var rest = $("<div>");
		var next = null;
		while (next = quotes[0].nextSibling) {
			rest.append(next);
		}
		var quoteAndRest = $("<div>").append(quotes.first().remove()).append(rest.contents());
		return {text: div.html(), quotation: quoteAndRest.html()};
	} else {
		return {text: html, quotation: ""};
	}
};

/**
 * Tries to find the outlook quotation that is nearest to the given outer div. Multiple parallel quotations are not recognized.
 * @param {Object} outerDiv The jquery div.
 * @return {Object} The jquery div that was recognized as the quotation part.
 */
tutao.tutanota.gui.MailView.prototype._findNearestOutlookQuotations = function(outerDiv) {
	var outlookQuotes = outerDiv.find("div").filter(function() {
		var element = $(this);
		return (element.css("border-left-width") != "0px" && element.css("border-left-width") != "") &&
				(element.css("border-top-width") == "0px" || element.css("border-top-width") == "") &&
				(element.css("border-right-width") == "0px" || element.css("border-right-width") == "") &&
				(element.css("border-bottom-width") == "0px" || element.css("border-bottom-width") == "");
	});
	var distances = [];
	distances.length = 100;
	for (var i = 0; i < outlookQuotes.length; i++) {
		var distance = $(outlookQuotes[i]).parentsUntil(outerDiv).length;
		if (distance < distances.length) {
            if (!distances[distance]) {
                distances[distance] = [];
            }
            distances[distance].push(outlookQuotes.get(i));
		}
	}
	var i = 0;
	while (!distances[i] && i < distances.length) {
		i++;
	}
	return distances[i] ? $(distances[i]) : $([]);
};

/**
 * Adds a submit listener to all forms of the mail body which shows a warning if the form is submitted.
 */
tutao.tutanota.gui.MailView.prototype.addSubmitCheckToMailBody = function() {
    var divs = $(".conversation").find('.mailBody, .mailBodyQuotation');
    this.addSubmitCheckToDivs(divs);
};

/**
 * Adds a submit listener to all forms of the mail body which shows a warning if the form is submitted.
 */
tutao.tutanota.gui.MailView.prototype.addSubmitCheckToDivs = function(jQueryDivs) {
    jQueryDivs.submit(function(event) {
        // use the default confirm dialog here because the submit can not be done async
        if (!confirm(tutao.lang("reallySubmitContent_msg"))) {
            event.preventDefault();
        }
    });
};

/**
 * @inherit
 */
tutao.tutanota.gui.MailView.prototype.getWelcomeMessage = function() {
	return this._welcomeMessage;
};

tutao.tutanota.gui.MailView.prototype.setWelcomeMessage = function(newValue) {
	return this._welcomeMessage = newValue;
};
