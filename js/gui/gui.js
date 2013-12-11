"use strict";

goog.provide('tutao.tutanota.gui');

/**
 * The static id of the text node type.
 */
tutao.tutanota.gui.TEXT_NODE = 3;
/**
 * The static id of the element node type.
 */
tutao.tutanota.gui.ELEMENT_NODE = 1;

/**
 * @export
 */
tutao.tutanota.gui.initKnockout = function() {
	ko.bindingHandlers['class'] = {
	    'update': function(element, valueAccessor) {
	        if (element['__ko__previousClassValue__']) {
	            ko.utils.toggleDomNodeCssClass(element, element['__ko__previousClassValue__'], false);
	        }
	        var value = ko.utils.unwrapObservable(valueAccessor());
	        ko.utils.toggleDomNodeCssClass(element, value, true);
	        element['__ko__previousClassValue__'] = value;
	    }
	};
	ko.bindingHandlers.fastClick = {
		init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
			// FastButton is used because the FastClick bug does not exist (jumping focus)
			// Disadvantage: The cursor does not stay in the bubbleinputfield when selecting a suggestion (seems to depend on body movement)
			// Additional bad disadvantage: elements that are bound to the fastClick can not be iscroll-scrolled
			// Additional disadvantage: click events may come twice if the click triggers a alert or confirm popup, e.g. in the contact view
			// one time when the delete button is clicked (then press cancel) and the second time when you try to
			// scroll the contact afterwards (see iss129)
			// workaround is to call the handler function in a setTimeout
			new FastButton(element, function(event) {
				valueAccessor()(viewModel, event);
			});
		}
	};
	// FastClick is currently not used because when selecting the subject field, the focus jumps to the body in certain cases
	// Advantage of FastClick: The cursor is always staying in the bubble input field when selecting a suggestion (the body does not scroll)
	//new FastClick(document.body);

	// allows the view model to receive the bound dom element
	ko.bindingHandlers.domInit = {
		init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
			valueAccessor()(element);
		}
	};

	ko.bindingHandlers.setDomWidth = {
		update: function(element, valueAccessor, allBindingsAccessor, viewModel) {
			valueAccessor()($(element).outerWidth(true));
		}
	};

	ko.bindingHandlers.fadeVisible = {
			init: function(element, valueAccessor) {
				// Initially set the element to be instantly visible/hidden depending on the value
				var value = valueAccessor();
				$(element).toggle(ko.utils.unwrapObservable(value)); // Use "unwrapObservable" so we can handle values that may or may not be observable
			},
			update: function(element, valueAccessor) {
				// Whenever the value subsequently changes, slowly fade the element in or out
				var value = valueAccessor();
				ko.utils.unwrapObservable(value) ? $(element).fadeIn() : $(element).fadeOut();
			}
	};

	ko.bindingHandlers.fadeInVisible = {
			init: function(element, valueAccessor) {
				// Initially set the element to be instantly visible/hidden depending on the value
				var value = valueAccessor();
				$(element).toggle(ko.utils.unwrapObservable(value)); // Use "unwrapObservable" so we can handle values that may or may not be observable
			},
			update: function(element, valueAccessor) {
				// Whenever the value subsequently changes, slowly fade the element in or out
				var value = valueAccessor();
				ko.utils.unwrapObservable(value) ? $(element).fadeIn() : $(element).hide();
			}
	};
	
	ko.bindingHandlers.lang = {
		update: function(element, valueAccessor, allBindingsAccessor) {
			var params = allBindingsAccessor()["params"];
			ko.bindingHandlers.text.update(element, function() { return tutao.locator.languageViewModel.get(valueAccessor(), params); });
	    }
	};
	
	ko.bindingHandlers.simpleDate = {
		// one-way
		update: function(element, valueAccessor, allBindingsAccessor) {
			var defaultText = allBindingsAccessor()["default"];
			var unwrappedDate = ko.utils.unwrapObservable(valueAccessor());
			if (unwrappedDate == null) {
				ko.bindingHandlers.text.update(element, function() { return defaultText; });
			} else {
				ko.bindingHandlers.text.update(element, function() { return tutao.tutanota.util.Formatter.dateToSimpleString(unwrappedDate); });
			}
	    }
	};
	
	ko.bindingHandlers.dateInput = {
		// two-way
		init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
	        ko.utils.registerEventHandler(element, 'change', function (event) {
        		valueAccessor()(tutao.tutanota.util.Formatter.dashStringToDate($(element).val()));
	        });
	    },
	    update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
	    	var unwrappedDate = ko.utils.unwrapObservable(valueAccessor());
	    	if (unwrappedDate == null) {
	    		$(element).val(null);
			} else {
				$(element).val(tutao.tutanota.util.Formatter.dateToDashString(unwrappedDate));
			}
	    }
	};
	
	ko.bindingHandlers.fadeLang = {
		update: function(element, valueAccessor, allBindingsAccessor) {
			var params = allBindingsAccessor()["params"];
			ko.bindingHandlers.fadeText.update(element, function() { return tutao.locator.languageViewModel.get(valueAccessor(), params); });
	    }
	};
	
	// sets a wide class on all forms that are wider than 350px
	var updateForm = function(element, container) {
		var e = $(element);
		e.toggleClass("wide", container.width() >= 350);
	};
	var currentForms = []; 
	ko.bindingHandlers.form = {
		init: function(element, valueAccessor) {
			var container = $(element).closest(".viewColumn, .panel");
			setTimeout(function() {
				updateForm(element, container);
			},1);
			var formMapping = {formElement: element, container: container};
			currentForms.push(formMapping);
			
			ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
				currentForms.splice(formMapping,1);
		    });
		},
		update: function(element, valueAccessor) {
			var container = $(element).closest(".viewColumn, .panel");
			updateForm(element, container);
		}
	};
	$(window).resize(function() {
		for (var i = 0; i < currentForms.length; i++) {
			updateForm(currentForms[i].formElement, currentForms[i].container);
		}
	});
	
	ko.bindingHandlers.fadeText = {
	    init: function(element, valueAccessor) { 
	        // initially don't show the element        
	        //$(element).hide();        
	    },
	    update: function(element, valueAccessor) {
	        var value = ko.utils.unwrapObservable(valueAccessor());
	        $(element).fadeOut(500, function() {
	            // set the text of the element, 
	            // value needs to be defined outside of the fadeOut callback to work
	        	ko.bindingHandlers.text.update(element, function() { return value; } );
	            $(element).fadeIn(500);
	        });
	    }
	};
	
	ko.bindingHandlers.slideHideTop = {
		init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
			// Initially set the element to be instantly visible/hidden depending on the value
			bindingContext.oldValue = ko.utils.unwrapObservable(valueAccessor());
			$(element).toggle(Boolean(bindingContext.oldValue)); // Use "unwrapObservable" so we can handle values that may or may not be observable
		},
		update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
			var value = ko.utils.unwrapObservable(valueAccessor());
			if (value === bindingContext.oldValue) {
				return;
			}
			bindingContext.oldValue = value;
			if (value) {
				$(element).css({ y: '-100%' });
				$(element).show().transition({ y: '0%' }, function () {});
			} else {
				$(element).transition({ y: '-100%' }, function () { $(this).hide(); });
			}
			
		}
	};
	$.fx.speeds._default = 600;
	var slideViewQueue = [];
	ko.bindingHandlers.slideView = {
		previousView: null,
		init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
			// Initially set the element to be instantly visible/hidden depending on the value
			bindingContext.oldValue = ko.utils.unwrapObservable(valueAccessor());
			$(element).toggle(Boolean(bindingContext.oldValue)); // Use "unwrapObservable" so we can handle values that may or may not be observable
		},
		update: function(newView, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
			var value = ko.utils.unwrapObservable(valueAccessor());
			if (value) {
				slideViewQueue.push(function() {
					ko.bindingHandlers.slideView.runTransition(newView);
				});
				if (slideViewQueue.length == 1) {
					slideViewQueue[0]();
				}
			}
		},
		runTransition: function(newView) {
			var previousView = ko.bindingHandlers.slideView.previousView;
			if (previousView != newView) {
				var finishedHandler = function () {
					// TODO remove, after https://github.com/rstacruz/jquery.transit/issues/158 has been fixed
					$(newView).css({'-webkit-transform': ''}, {'-ms-transform': ''}, {'-moz-transform': ''}, {'transform': ''});
					
					ko.bindingHandlers.slideView.previousView = newView;
					slideViewQueue.shift();
					if (slideViewQueue.length > 0) {
						slideViewQueue[0]();
					}
				};
				if (newView == $("div#login")[0]) { // just a workaround as long as sliding in the loginview does not work on all devices
					$(previousView).hide();
					$(newView).show();
					finishedHandler();
					
				} else {
					$(previousView).transition({ y: '-100%' }).transition({display: "none"}, 0);
					$(newView).transition({ y: '100%' },0).transition({display: ""}, 0).transition({ y: '0%' }, finishedHandler);
				}
			} else {
				slideViewQueue.shift();
				if (slideViewQueue.length > 0) {
					slideViewQueue[0]();
				}
			}
		}
	};	
	
	// slides the dom-element to the left to hide it and to the right to make it visible
	ko.bindingHandlers.slideHideLeft = {
		init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
			// Initially set the element to be instantly visible/hidden depending on the value
			bindingContext.oldValue = ko.utils.unwrapObservable(valueAccessor());
			$(element).toggle(Boolean(bindingContext.oldValue)); // Use "unwrapObservable" so we can handle values that may or may not be observable
		},
		update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
			var value = ko.utils.unwrapObservable(valueAccessor());
			if (value === bindingContext.oldValue) {
				return;
			}
			bindingContext.oldValue = value;
			//setTimeout(function() {
				if (value) {
					//$(element).css({ x: '-1%' });
					$(element).show().transition({ x: '0%' }, function () {});
				} else {
					$(element).transition({ x: '-100%' }, function () { $(this).hide(); });
				}
			//}, 0);
		}
	};

	ko.bindingHandlers.slideVisible = {
		init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
			// Initially set the element to be instantly visible/hidden depending on the value
			bindingContext.oldValue = ko.utils.unwrapObservable(valueAccessor());
			$(element).toggle(Boolean(bindingContext.oldValue)); // Use "unwrapObservable" so we can handle values that may or may not be observable
		},
		update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
			// Whenever the value subsequently changes, slowly fade the element in or out
			var value = ko.utils.unwrapObservable(valueAccessor());
			if (value === bindingContext.oldValue) {
				return;
			}
			bindingContext.oldValue = value;
			// invoke the slideDown/up operation after all knockout bindings to the value have been updated
			// Problem: text or html binding is defined on a child of a div which is slided up or down depending on the child text
			setTimeout(function() {
				if (value) {
					$(element).hide().slideDown();
				} else {
					/* ATTENTION: The animation time must match the timeout in:
					 * * tutao.tutanota.ctrl.DisplayedMail.prototype._loadBody
					 */
					$(element).slideUp(function() {
						$(element).hide();
					});
				}
			}, 0);
		}
	};

//	ko.bindingHandlers.slideVisible = {
//		    update: function(element, valueAccessor, allBindingsAccessor) {
//		        // First get the latest data that we're bound to
//		        var value = valueAccessor(), allBindings = allBindingsAccessor();
//
//		        // Next, whether or not the supplied model property is observable, get its current value
//		        var valueUnwrapped = ko.utils.unwrapObservable(value);
//
//		        // Grab some more data from another binding property
//		        var duration = allBindings.slideDuration || 400; // 400ms is default duration unless otherwise specified
//
//		        // Now manipulate the DOM element
//		        if (valueUnwrapped == true)
//		            $(element).slideDown(duration); // Make the element visible
//		        else
//		            $(element).slideUp(duration);   // Make the element invisible
//		    }
//		};

//	ko.bindingHandlers.wysihtml5 = {
//	        control: "",
//	        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
//	            control = $(element).wysihtml5({
//	                "events": {
//	                    "change" : function() {
//	                        var observable = valueAccessor();
//	                        observable(control.getValue());
//	                    }
//	                }
//	            }).data("wysihtml5").editor;
//
//
//	        },
//	        update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
//	            var content = valueAccessor();
//
//	            if (content != undefined) {
//	                control.setValue(content());
//	            }
//	        }
//	    };

	// must be invoked because knockout won't render anything otherwise
	ko.applyBindings({});
};

/**
 * Cleans and re-applies all bindings to the logo-node which is only partially managed by knockout (because it is shown .
 */
tutao.tutanota.gui.resetLogoBindings = function() {
	var logo = $('div#logo');
	ko.cleanNode(logo[0]);
	logo.children().each(function() {
		ko.cleanNode(this);
	});
	ko.applyBindings(logo);
};

/**
 * Initializes all global events for the gui.
 */
tutao.tutanota.gui.initEvents = function() {
	// not used currently
//	setTimeout(function() { // without the timeout the animation does not work.
//		// additionally binding mousedown starts the animation twice
//		$('.menu_link').bind("touchstart", function(e) {
//			self = $(this).children('div').children('img');
//	        self.animate({ height: '42', top: '0', width: '42'}, 150, function() {
//	        	self.animate({ height: '34', top: '4', width: '34'}, 150);
//	        });
//	    });
//	}, 0);

	if (tutao.tutanota.util.ClientDetector.isTouchSupported()) {
		// do not allow default scrolling on the window
		tutao.tutanota.gui.disableWindowScrolling();
	}
};

/**
 * This function calls preventDefault() on the given event.
 * @param {Event} e The event.
 */
tutao.tutanota.gui._preventDefault = function(e) {
	e.preventDefault();
};

/**
 * Allows the complete window to scroll vertically. This is used in touch composing mode (i.e. the
 * virtual keyboard is shown on touch devices)
 */
tutao.tutanota.gui.enableWindowScrolling = function() {
	$('#viewContainer').addClass('touchComposingMode');
	document.removeEventListener('touchmove', tutao.tutanota.gui._preventDefault, false);
};

/**
 * Prevents the complete window from scrolling vertically on touch devices.
 */
tutao.tutanota.gui.disableWindowScrolling = function() {
	// reset the height to the "normal" height
	$('body').css("height", "100%");

	$('#viewContainer').removeClass('touchComposingMode').css('height', '');
	document.addEventListener('touchmove', tutao.tutanota.gui._preventDefault, false);
};

/**
 * Provides the information if the given dom element is a contenteditable or belongs to one.
 * @param {Object} domElement The element to test.
 * @return {boolean} If it is/belongs to a contenteditable.
 */
tutao.tutanota.gui.isContentEditable = function(domElement) {
	// contenteditables contain other nodes, so we also need to check the parents
	var current = domElement;
	while (current) {
		if (current.contentEditable == "true") {
			return true;
		}
		current = current.parentNode;
	}
	return false;
};

/**
 * Provides the information if the given dom element is editable. These are selects, inputs, textareas and contenteditables.
 * @param {Object} domElement The element to test.
 * @return {boolean} If it is editable.
 */
tutao.tutanota.gui.isEditable = function(domElement) {
	return (domElement.tagName == 'SELECT' || domElement.tagName == 'INPUT' || domElement.tagName == 'TEXTAREA' ||
			tutao.tutanota.gui.isContentEditable(domElement));
};

// currently not used because deleting mails is done in mail view and not via context menu in mail list view
///**
// * Register a callback function that is called when a long press on a mail in the mail list is registered.
// * @param {function(Object,number,number)} callback The callback passes the pressed dom element and the x/y position that was pressed.
// */
//tutao.tutanota.gui.registerMailLongPress = function(callback) {
//	var pressTimer = undefined;
//	var startX = undefined;
//	var startY = undefined;
//	var cancelLongPress = false;
//
//	var pressFunction = function(e) {
//		cancelLongPress = false;
//		startX = e.pageX;
//		startY = e.pageY;
//		pressTimer = window.setTimeout(function() {
//			if (!cancelLongPress) {
//				callback($(e.target).closest(".mailInList").get(0), startX, startY);
//			}
//		}, 1000);
//		return false;
//	};
//
//	// cancel the long press if the finger position is too far from the start press position
//	var moveFunction = function(e) {
//		if (!cancelLongPress) {
//			if (Math.abs(e.pageX - startX) > 5 || Math.abs(e.pageY - startY) > 5) {
//				cancelLongPress = true;
//			}
//		}
//		return false;
//	};
//
//	var releaseFunction = function(e) {
//		window.clearTimeout(pressTimer);
//		return false;
//	};
//
//	document.addEventListener("mousedown", pressFunction); // just for desktop compatibility
//	document.addEventListener("touchstart", pressFunction);
//	document.addEventListener("mouseup", releaseFunction); // just for desktop compatibility
//	document.addEventListener("touchend", releaseFunction);
//	document.addEventListener("touchmove", moveFunction);
//};

/**
 * Asks the user for a confirmation to cancel the mail and provides the result.
 * @param {string} text The text to show to the user.
 * @return {boolean} True if the mail shall be cancelled, false otherwise.
 */
tutao.tutanota.gui.confirm = function(text) {
	return confirm(text);
};

/**
 * Shows an alert window to the user and returns when it is closed.
 * @param {string} text The text in the window.
 */
tutao.tutanota.gui.alert = function(text) {
	alert(text);
};

/**
 * Set the search status in the gui.
 * @param {number} status 0: search icon is visible, 1: cancel icon is visible.
 */
tutao.tutanota.gui.setSearchStatus = function(status) {
	if (status === 0) {
		$("#searchImage").removeClass('searchCancel');
		$("#searchImage").addClass('searchStart');
	} else if (status === 1) {
		$("#searchImage").removeClass('searchStart');
		$("#searchImage").addClass('searchCancel');
	}
};

/**
 * Marks the given dom elements as selected.
 * @param {Array.<Object>} elements The dom elements.
 */
tutao.tutanota.gui.select = function(elements) {
	for (var i = 0; i < elements.length; i++) {
		$(elements[i]).addClass('selected');
		$(elements[i]).removeClass('unreadFont');
	}
};

/**
 * Marks the given dom elements as not selected.
 * @param {Array.<Object>} elements The dom elements.
 */
tutao.tutanota.gui.unselect = function(elements) {
	for (var i = 0; i < elements.length; i++) {
		$(elements[i]).removeClass('selected');
	}
};

//not needed currently as we scroll the complete window when editing a mail
///**
// * When this function is called the mail scroller is refreshed whenever the body changes. This is needed to keep the
// * complete new mail scrollable even when the height of the body field increases due to new lines inserted by the user.
// */
//tutao.tutanota.gui.refreshScrollerWhenBodyChanges = function() {
//	/*var defaultWindowHeight = window.innerHeight;
//
//	var currentHeight = undefined;
//	var body = $("#conversation").find(".composeBody");
//	body.bind("keyup", function(e) {
//		//console.log(e);
//		//tutao.tutanota.gui.iscroll.mailsScroller.scrollTo(0, 30);
//		//window.getSelection().getRangeAt().commonAncestorContainer.parentNode.offsetTop
//		//tutao.tutanota.gui.findCursorPosition();
//		if (currentHeight != undefined && currentHeight != $(e.target).height()) {
//			//console.log("size");
//			//var lastY = tutao.tutanota.gui.iscroll.mailsScroller.y;
//			//tutao.tutanota.gui.iscroll.mailsScroller.scrollTo(0, tutao.tutanota.gui.iscroll.mailsScroller.maxScrollY, 0);
//			setTimeout(function() {
//				//tutao.tutanota.gui.iscroll.mailsScroller.scrollTo(0, lastY, 0);
//				setTimeout(function() {
//					tutao.tutanota.gui.iscroll.mailsScroller.refresh();
//					//console.log(currentHeight);
//				},10);
//			},10);
//		}
//		currentHeight = $(e.target).height();
//	});*/
//
//	var body = $("#conversation").find(".composeBody");
//	body.bind("focus", function(e) {
//
//		/*
//		 * this is a workaround for the bug with webkit-overflow-scrolling
//		 * when the content element is smaller than its container (i.e. it is not scrollable), then the container is made smaller than the content,
//		 * the content does not become scrollable. we explicitely change the size of the content to make it scrollable
//		 */
//		setTimeout(function() {
//			if ($(".mail").css("margin-bottom") == "7px") {
//				$(".mail").css("margin-bottom", "6px");
//			} else {
//				$(".mail").css("margin-bottom", "7px");
//			}
//		}, 10);
//		/* end workaround for bug with webkit-overflow-scrolling */
//
////		setTimeout(function() {
////			tutao.tutanota.gui.iscroll.mailsScroller.refresh();
////		}, 0);
//	});
//	/* end workaround for bug with the virtual keyboard on ipad */
//
//	// when the virtual keyboard has move the page up and is then switched off, we need to refresh iscroll
//	// there is no virtual keyboard event, so use blur instead
//	/*body.bind("blur", function(e) {
//		//console.log("blur1");
//		setTimeout(function() {
////			tutao.tutanota.gui.iscroll.mailsScroller.refresh();
////			var yPosition = tutao.tutanota.gui.iscroll.mailsScroller.y;
////			tutao.tutanota.gui.iscroll.mailsScroller.scrollTo(0, -10000, 0);
//			//console.log("blur22");
//			setTimeout(function() {
////				console.log("blur2");
////				tutao.tutanota.gui.iscroll.mailsScroller.scrollTo(0, yPosition, 0);
//			}, 1);
//		}, 1);
//	});*/
//	//old to do: once, add listener when the browser height changes
//};

/* Gui part for the view slider */

/**
 * Makes the changes on the view requested by the view slider.
 * @param {number} left Left position of the view.
 * @param {number} width The width of the view.
 * @param {boolean} initial True if this is the first time the values are set.
 */
tutao.tutanota.gui.viewPositionAndSizeReceiver = function(domElement, left, width, initial) {
	// the transition is done via css
	if (initial) {
		$(domElement).css("left", left + "px");
		$(domElement).css("width", width + "px");
	} else {
		$(domElement).transition({left: left + "px", width: width + "px"}, 300, 'easeInOutCubic');
	}
};

/**
 * Slides a new dom element instead of displaying it immediately. Knockout event handler (afterAdd).
 * @param {Object} domElement The dom element.
 */
tutao.tutanota.gui.slideAfterAdd = function(domElement) {
	tutao.tutanota.gui.slideDown(domElement, null);
};

/**
 * Slides a dom element down
 * @param {Object} domElement The dom element.
 */
tutao.tutanota.gui.slideDown = function(domElement, callback) {
	if (domElement.nodeType !== tutao.tutanota.gui.TEXT_NODE) {
		$(domElement).hide().slideDown(400, callback);
	}
};

/**
 * Slides a dom element before removal instead of removing it immediately.
 * @param {Object} domElement The dom element.
 */
tutao.tutanota.gui.slideBeforeRemove = function(domElement) {
	if (domElement.nodeType !== tutao.tutanota.gui.TEXT_NODE) {
		// ATTENTION: The animation time must match the timeout in:
		//   tutao.tutanota.ctrl.ComposingMail.prototype.cancelMail
		$(domElement).slideUp(function() {
			$(domElement).remove();
		});
	}
};

/**
 * Contains all registered resize listeners {domElement:Object, callback:function(), subtreeListener:function(), inputListener, width:number, height:number}.
 */
tutao.tutanota.gui._resizeListeners = [];

/**
 * Notifies the given callback about a size change of the given dom element.
 * Uses DOMSubtreeModified for dom changes and an input listener for each text area or contenteditable in the dom element.
 * @param {Object} domElement The dom element.
 * @param {function(number,number)} callback Called when the width or height changes. Receives width and height.
 * @param {Boolean} initialCall When true the callback is once called in this function with the current width and height. Not initially called when it is false.
 */
tutao.tutanota.gui.addResizeListener = function(domElement, callback, initialCall) {
	var node = $(domElement);
	var currentWidth = node.width();
	var currentHeight = node.height();
	var listenerData = {domElement: domElement, callback: callback, subtreeListener: null, inputListener: null, width: currentWidth, height: currentHeight};
	// remember listener to be able to unbind it
	tutao.tutanota.gui._resizeListeners.push(listenerData);

	// each time an input event on a textarea it fired check the size
	listenerData.inputListener = function() {
		tutao.tutanota.gui._checkSizeChange(listenerData);
		return true;
	};

	// each time the dom tree changes all input listeners are removed from and added to all text areas because text areas might have been added
	// additionally check the size
	listenerData.subtreeListener = function() {
		tutao.tutanota.gui._updateInputListeners(listenerData);
		tutao.tutanota.gui._checkSizeChange(listenerData);
		return true;
	};

	// bind the subtree listener
	node.bind("DOMSubtreeModified", listenerData.subtreeListener);
	// bind the input listeners
	tutao.tutanota.gui._updateInputListeners(listenerData);

	if (initialCall) {
		listenerData.callback(currentWidth, currentHeight);
	}
};

/**
 * Removes all input listeners and adds them again.
 * @param {Object} listenerData The listener data like defined in tutao.tutanota.gui._resizeListeners.
 */
tutao.tutanota.gui._updateInputListeners = function(listenerData) {
	var textareas = $(listenerData.domElement).find("textarea");
	textareas.unbind("input", listenerData.inputListener);
	textareas.bind("input", listenerData.inputListener);
};

/**
 * Notifies the listener if the size of the dom elemen thas changed.
 * @param {Object} listenerData The listener data containing the dom element and callback like defined in tutao.tutanota.gui._resizeListeners.
 */
tutao.tutanota.gui._checkSizeChange = function(listenerData) {
	// at least in chrome strangely it takes much time (> 100ms) until the new height is available
	setTimeout(function() {
		var currentWidth = $(listenerData.domElement).width();
		var currentHeight = $(listenerData.domElement).height();
		if ((currentWidth != listenerData.width) || (currentHeight != listenerData.height)) {
			listenerData.width = currentWidth;
			listenerData.height = currentHeight;
			listenerData.callback(currentWidth, currentHeight);
		}
	}, 200);
};

/**
 * Stops notifying the given callback about a size change of the given dom element.
 * @param {Object} domElement The dom element.
 * @param {function(number,number)} callback Called when the width or height changes. Receives width and height.
 */
tutao.tutanota.gui.removeResizeListener = function(domElement, callback) {
	for (var i = 0; i < tutao.tutanota.gui._resizeListeners.length; i++) {
		var listener = tutao.tutanota.gui._resizeListeners[i];
		if (listener.domElement == domElement && listener.callback == callback) {
			$(listener.domElement).unbind("DOMSubtreeModified", listener.subtreeListener);
			$(listener.domElement).find("textarea").unbind("input", listener.inputListener);
			tutao.tutanota.gui._resizeListeners.splice(i, 1);
			return;
		}
	}
};

/**
 * Removes the focus from all currently selected elements. This can be used to hide the keyboard on mobile devices.
 */
tutao.tutanota.gui.blur = function(element) {
	$(element).focus().blur();
};


/**
 * Returns the width of the window (user visible area).
 * @return {number} The width of the browser window in px.
 */
tutao.tutanota.gui.getWindowWidth = function() {
	return $(window).width();
};

/**
 * Returns the height of the window (user visible area).
 * @return {number} The height of the browser window in px.
 */
tutao.tutanota.gui.getWindowHeight = function() {
	return $(window).height();
};

/**
 * Notifies the callback about window size changes.
 * @param {function(number, number)} callback Provides the new width and height of the window if the values change.
 */
tutao.tutanota.gui.addWindowResizeListener = function(callback) {
	var self = this;
	$(window).on("resize", function() {
		callback(self.getWindowWidth(), self.getWindowHeight());
	});
	// on iOS 6, the orientation change events do not trigger resize events in ComposerMode (see e.g. tutao.locator.mailView.enableTouchComposingMode())
	if (tutao.tutanota.util.ClientDetector.isTouchSupported()) {
		$(window).on("orientationchange", function() {
			callback(self.getWindowWidth(), self.getWindowHeight());
		});
	}
};
