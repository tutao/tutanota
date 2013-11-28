"use strict";

goog.provide('tutao.tutanota.gui.MailView');

/**
 * @constructor
 * @implements {tutao.tutanota.ctrl.View}
 */
tutao.tutanota.gui.MailView = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this._mailsHeight = 0;
	this._passwordChannelsHeight = 0;

	this._leftmostVisibleColumn = ko.observable(-1);
	this._rightmostVisibleColumn = ko.observable(-1);
};

/**
 * These ids are actually returned by addViewColumn.
 */
tutao.tutanota.gui.MailView.COLUMN_TAGS = 0;
tutao.tutanota.gui.MailView.COLUMN_MAIL_LIST = 1;
tutao.tutanota.gui.MailView.COLUMN_CONVERSATION = 2;
tutao.tutanota.gui.MailView.COLUMN_PASSWORD_CHANNELS = 3;

/**
 * @inherit
 */
tutao.tutanota.gui.MailView.prototype.init = function(external) {
	var self = this;
	// configure view slider
	this._viewSlider = new tutao.tutanota.ctrl.ViewSlider();
	this._viewSlider.setScreenWidth(tutao.tutanota.gui.getWindowWidth());
	this._viewSlider.setViewPositionAndSizeReceiver(function(x, y, initial) {
		self._leftmostVisibleColumn(self._viewSlider.getLeftmostVisibleColumnId());
		self._rightmostVisibleColumn(self._viewSlider.getRightmostVisibleColumnId());
		tutao.tutanota.gui.viewPositionAndSizeReceiver("#mailContent", x, y, initial);
	});
	this._viewSlider.addViewColumn(2, 190, 190, function(x, width) {
		$('#tagListColumn').css("width", width + "px");
	});
	this._viewSlider.addViewColumn(0, 300, 800, function(x, width) {
		$('#searchAndMailListColumn').css("width", width + "px");
	});
	this._viewSlider.addViewColumn(1, 600, 1024, function(x, width) {
		$('#conversationColumn').css("width", width + "px");
	});
	if (!external) {
		this._viewSlider.addViewColumn(3, 300, 800, function(x, width) {
			$('#passwordChannelColumn').css("width", width + "px");
		});
	}

	this._firstActivation = true;
	this._touchComposingModeActive = false;
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
	this._viewSlider.setScreenWidth(tutao.tutanota.gui.getWindowWidth());
	if (this._firstActivation) {
		this._firstActivation = false;
		if (tutao.tutanota.util.ClientDetector.isTouchSupported()) {
			this._mailListScroller = new iScroll('mailList', {useTransition: true});
			this._mailsScroller = new iScroll('innerConversationColumn', {useTransition: true});
			this._externalMailConfigScroller = new iScroll('innerPasswordChannelColumn', {useTransition: true});

//			// workaround for input field bug. it allows to set the focus on text input elements
//			// it is currently not needed, because we disable iscroll as soon as we edit a mail
//			this._externalMailConfigScroller.options.onBeforeScrollStart = function(e) {
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
		tutao.locator.mailListViewModel.init();
	} else {
		this.mailListUpdated();
		this.mailsUpdated();
	}
	if (this._touchComposingModeActive) {
		this.enableTouchComposingMode();
	}
};

/**
 * @inherit
 */
tutao.tutanota.gui.MailView.prototype.deactivate = function() {
	if (this._touchComposingModeActive) {
		this.disableTouchComposingMode();
		// remember that it is active
		this._touchComposingModeActive = true;
	}
};

/**
 * @inherit
 */
tutao.tutanota.gui.MailView.prototype.windowSizeChanged = function(width, height) {
	this._viewSlider.setScreenWidth(width);
};

tutao.tutanota.gui.MailView.COLUMN_TAGS = 0;
tutao.tutanota.gui.MailView.COLUMN_MAIL_LIST = 1;
tutao.tutanota.gui.MailView.COLUMN_CONVERSATION = 2;
tutao.tutanota.gui.MailView.COLUMN_PASSWORD_CHANNELS = 3;

/**
 * @inherit
 */
tutao.tutanota.gui.MailView.prototype.swipeRecognized = function(type) {
	if (type == tutao.tutanota.ctrl.SwipeRecognizer.TYPE_LEFT_IN) {
		if (this.isShowNeighbourColumnPossible(true)) {
			this.showNeighbourColumn(true);
		}
	} else if (type == tutao.tutanota.ctrl.SwipeRecognizer.TYPE_LEFT_OUT) {
		if (this._viewSlider.isVisible(tutao.tutanota.gui.MailView.COLUMN_TAGS)) {
			this._viewSlider.showDefault();
		}
	} else if (type == tutao.tutanota.ctrl.SwipeRecognizer.TYPE_RIGHT_IN) {
		if (this.isShowNeighbourColumnPossible(false)) {
			this.showNeighbourColumn(false);
		}
	}
};

/**
 * @inherit
 */
tutao.tutanota.gui.MailView.prototype.showNeighbourColumn = function(left) {
	var columnToShow = (left) ? this._viewSlider.getLeftmostVisibleColumnId() - 1 : this._viewSlider.getRightmostVisibleColumnId() + 1;
	this._viewSlider.showViewColumn(columnToShow);
};

/**
 * @inherit
 */
tutao.tutanota.gui.MailView.prototype.isShowNeighbourColumnPossible = function(left) {
	if (this._leftmostVisibleColumn() == -1) {
		return false;
	}
	if (left) {
		return (this._leftmostVisibleColumn() == tutao.tutanota.gui.MailView.COLUMN_MAIL_LIST) || // allow showing tag list
		(this._leftmostVisibleColumn() == tutao.tutanota.gui.MailView.COLUMN_CONVERSATION && !tutao.locator.mailViewModel.isComposingState()) || // allow showing mail list if displayed mail is visible
		(this._leftmostVisibleColumn() == tutao.tutanota.gui.MailView.COLUMN_PASSWORD_CHANNELS); // allow showing composing mail if only password channels are visible
	} else {
		return ((this._rightmostVisibleColumn() == tutao.tutanota.gui.MailView.COLUMN_CONVERSATION) && (tutao.locator.passwordChannelViewModel.getSecureExternalRecipients().length > 0) || // allow showing password channels if composing mail is visible
				(this._leftmostVisibleColumn() == tutao.tutanota.gui.MailView.COLUMN_TAGS && this._rightmostVisibleColumn() <= tutao.tutanota.gui.MailView.COLUMN_MAIL_LIST)); // allow slide out tag list
	}
};

/**
 * Makes sure that the default columns are visible (at least including the mail list column).
 */
tutao.tutanota.gui.MailView.prototype.showDefaultColumns = function() {
	this._viewSlider.showDefault();
};

/**
 * See return
 * @return {boolean} true, if the mail list column is visible.
 */
tutao.tutanota.gui.MailView.prototype.isMailListColumnVisible = function() {
	return this._viewSlider.isVisible(tutao.tutanota.gui.MailView.COLUMN_MAIL_LIST);
};

/**
 * Makes sure that the conversation column is visible.
 * @param {function()=} callback The callback to invoke after the conversation column is visible.
 */
tutao.tutanota.gui.MailView.prototype.showConversationColumn = function(callback) {
	if (!this.isConversationColumnVisible()) {
		this._viewSlider.showViewColumn(tutao.tutanota.gui.MailView.COLUMN_CONVERSATION);
		if (callback) {
			setTimeout(function() {
				callback();
			}, 400);
		}
	} else {
		if (callback) {
			callback();
		}
	}
};

/**
 * See return
 * @return {boolean} true, if the conversation column is visible.
 */
tutao.tutanota.gui.MailView.prototype.isConversationColumnVisible = function() {
	return this._viewSlider.isVisible(tutao.tutanota.gui.MailView.COLUMN_CONVERSATION);
};

/**
 * Makes sure that the password channel column is visible.
 */
tutao.tutanota.gui.MailView.prototype.showPasswordChannelColumn = function() {
	this._viewSlider.showViewColumn(tutao.tutanota.gui.MailView.COLUMN_PASSWORD_CHANNELS);
};

/**
 * Sets the composing mail body text.
 * @param {string} text The html body text.
 */
tutao.tutanota.gui.MailView.prototype.setComposingBody = function(text) {
	$(".conversation").find(".composeBody").append(text);
};

/**
 * Gets the composing mail body text.
 * @return {string} The html body text.
 */
tutao.tutanota.gui.MailView.prototype.getComposingBody = function() {
	var bodyTextNode = $(".conversation").find(".composeBody");
	// TODO (before beta) merge sibling blockquotes on top level
	return bodyTextNode.html();
};

/**
 * Fades the new mail out
 */
tutao.tutanota.gui.MailView.prototype.fadeFirstMailOut = function() {
	$(".conversation").find('.mail').first().fadeOut();
};

/**
 * The touch composing mode is only used on touch devices in order to allow scrolling the complete body during editing.
 * This is needed because of the keyboard overlay of these devices.
 */
tutao.tutanota.gui.MailView.prototype.enableTouchComposingMode = function() {
	if (!tutao.tutanota.util.ClientDetector.isTouchSupported()) {
		return;
	}
	this._touchComposingModeActive = true;

	// now we allow scrolling the window vertically, so we need to enable touchmove
	tutao.tutanota.gui.enableWindowScrolling();

	// scrolling the mails is not allowed in touch composing mode because the complete window shall be scrolled
	this._mailsScroller.scrollTo(0, 0);
	this._mailsScroller.disable();
	this._externalMailConfigScroller.scrollTo(0, 0);
	this._externalMailConfigScroller.disable();

	tutao.tutanota.gui.addResizeListener($(".conversation")[0], this._updateBodyHeight, true);
	tutao.tutanota.gui.addResizeListener($("#passwordChannelList")[0], this._updateBodyHeightPWChannels, true);
};

/**
 * This event listener updates the body height and is invoked whenever the contents of the #conversation change.
 * It updates the body height and additionally updates the scroll position for the body contenteditable.
 */
tutao.tutanota.gui.MailView.prototype._updateBodyHeight = function(width, height) {
	this._mailsHeight = height + $('#header').height() + 110;
	var newHeight = Math.max(this._mailsHeight, this._passwordChannelsHeight, tutao.tutanota.gui.getWindowHeight());
	if (newHeight > tutao.tutanota.gui.getWindowHeight()) {
		$('body').height(newHeight);
	}

	// if editing the contenteditable for the body, scroll to the cursor
	var node = $(window.getSelection().focusNode);
	if (node.nodeType == tutao.tutanota.gui.TEXT_NODE) {
		node = node.parentNode;
	}

	if (!node || node.attr('contenteditable') || !node.offset() || node.offset().top == 0) {
		// the root content editable has been selected. do not scroll to that position!
		return;
	}
	// $(window.getSelection().focusNode).offset().top
	var target = $(window.getSelection().getRangeAt().endContainer).offset().top - (window.innerHeight / 3);
	window.scrollTo(0, target);
};

tutao.tutanota.gui.MailView.prototype._updateBodyHeightPWChannels = function(width, height) {
	this._passwordChannelsHeight = height + $('#header').height() + 140;
	var newHeight = Math.max(this._mailsHeight, this._passwordChannelsHeight, tutao.tutanota.gui.getWindowHeight());
	if (newHeight > tutao.tutanota.gui.getWindowHeight()) {
		$('body').height(newHeight);
	}
};

/**
 * Disables the touch composing mode for the mail view.
 */
tutao.tutanota.gui.MailView.prototype.disableTouchComposingMode = function() {
	if (!tutao.tutanota.util.ClientDetector.isTouchSupported()) {
		return;
	}
	tutao.tutanota.gui.removeResizeListener($(".conversation")[0], this._updateBodyHeight);
	tutao.tutanota.gui.removeResizeListener($("#passwordChannelList")[0], this._updateBodyHeightPWChannels);
	this._touchComposingModeActive = false;
	tutao.tutanota.gui.disableWindowScrolling();
	this._mailsScroller.enable();
	this._externalMailConfigScroller.enable();
};

/**
 * Animates adding a mail if necessary. If a composing mail is added it is animated, displayed mails are not animated.
 * @param {Object} domElement The mail dom element.
 * @param {number} position The position in the conversation.
 * @param {tutao.tutanota.ctrl.ComposingMail|tutao.tutanota.ctrl.DisplayedMail} mail The mail.
 */
tutao.tutanota.gui.MailView.prototype.addMail = function(domElement, position, mail) {
	if (mail instanceof tutao.tutanota.ctrl.ComposingMail) {
		var self = this;
		self.showFirstMail();
		tutao.tutanota.gui.slideDown(domElement, function() {
			if (self._touchComposingModeActive) {
				self._updateBodyHeight($(".conversation").width(), $(".conversation").height());
			}
		});
	}
};

/**
 * Animates removing a mail if necessary. See tutao.tutanota.ctrl.ComposingMail.isDirectSwitchActivated for more information.
 * @param {Object} domElement The mail dom element.
 * @param {number} position The position in the conversation.
 * @param {tutao.tutanota.ctrl.ComposingMail|tutao.tutanota.ctrl.DisplayedMail} mail The mail.
 */
tutao.tutanota.gui.MailView.prototype.removeMail = function(domElement, position, mail) {
	if (mail instanceof tutao.tutanota.ctrl.ComposingMail && !mail.isDirectSwitchActive()) {
		tutao.tutanota.gui.slideBeforeRemove(domElement);
	} else {
		$(domElement).remove();
	}
};

/**
 * Scrolls the mails up to the first mail.
 */
tutao.tutanota.gui.MailView.prototype.showFirstMail = function() {
	if (this._mailsScroller) {
		this._mailsScroller.scrollTo(0, 0, 0);
	} else {
		$("#innerConversationColumn").scrollTop(0);
	}
};

/**
 * Must be called when the mail list changes. Updates iScroll.
 */
tutao.tutanota.gui.MailView.prototype.mailListUpdated = function() {
	if (this._mailListScroller) {
		this._mailListScroller.refresh();
	}
};

/**
 * Must be called when the mails change. Updates iScroll.
 */
tutao.tutanota.gui.MailView.prototype.mailsUpdated = function() {
	if (this._mailsScroller) {
		this._mailsScroller.refresh();
	}
};

/**
 * Provides the dom element of the given mail in the mail list.
 * @param {tutao.entity.tutanota.Mail} mail The mail.
 * @return {Object} The dom element.
 */
tutao.tutanota.gui.MailView.prototype.getMailListDomElement = function(mail) {
	return $('#mailInList' + mail.getId()[0] + mail.getId()[1]);
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
		if (distance >= distances.length) {
			continue; // we don't care any more
		} else {
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
 * Fades the conversation column in and out.
 */
tutao.tutanota.gui.MailView.prototype.fadeConversation = function() {
	$("#innerConversationColumn").children().fadeOut().fadeIn();
};

/**
 * Fades the conversation column in.
 */
tutao.tutanota.gui.MailView.prototype.fadeConversationIn = function(callback) {
	$("#innerConversationColumn").children().hide().fadeIn(callback);
};

/**
 * Hides the conversation column
 */
tutao.tutanota.gui.MailView.prototype.hideConversation = function() {
	$("#innerConversationColumn").children().hide();
};
