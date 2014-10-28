"use strict";

tutao.provide('tutao.tutanota.gui');

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
            if (tutao.tutanota.util.ClientDetector.isMobileDevice()) {
                var m = new Hammer.Manager(element);
                m.add(new Hammer.Tap({ threshold: 10 }));
                var prevent = new PreventGhostClick(element);
                m.on("tap", function (event) {
                    event.srcEvent.preventDefault();
                    $(element).addClass("active");
                    setTimeout(function () {
                        $(element).removeClass("active");
                    }, 100);
                    valueAccessor()(viewModel, event.srcEvent);
                });
                return false;
            } else {
                return ko.bindingHandlers.click.init.apply(this, arguments);
            }
		}
	};

	// allows the view model to receive the bound dom element
	ko.bindingHandlers.domInit = {
		init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
			valueAccessor()(element);
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
			ko.bindingHandlers.text.update(element, function() { return tutao.locator.languageViewModel.get(ko.utils.unwrapObservable(valueAccessor()), params); });
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
	
	// sets a wide class on all forms that are wider than 500px
	var updateForm = function(element, container) {
		var e = $(element);
		e.toggleClass("wide", container.width() > 499); // Must be at least 375px to support iphone6 login screen
	};
	// allows moving the record-data part of a record-container below the record-name on small devices
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
	            // value needs to be defined outside of the fadeOut valueAccessor to work
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
                    var views = $([newView, previousView]);
					views.css('-webkit-transform', '');
                    views.css('-ms-transform', '');
                    views.css('transform', '');

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

    if (tutao.tutanota.util.ClientDetector.getDeviceType() == tutao.tutanota.util.ClientDetector.DEVICE_TYPE_IPAD && tutao.tutanota.util.ClientDetector.getBrowserVersion() == 7) {
        tutao.tutanota.gui._fixWindowHeight();
        window.addEventListener("orientationchange", tutao.tutanota.gui._fixWindowHeight);
        document.addEventListener('focusout', tutao.tutanota.gui._fixWindowHeight);
    }

	if (tutao.tutanota.util.ClientDetector.isMobileDevice()) {
		tutao.tutanota.gui._disableWindowScrolling();
	}
    // not used currently because in the most important case (history sliding on iOS 7) it is not working
    // window.onbeforeunload = tutao.tutanota.gui._confirmExit;

    // workaround for firefox bug
    tutao.tutanota.gui.addWindowResizeListener(function() {
        tutao.tutanota.gui.adjustPanelHeight();
    });
};

/*tutao.tutanota.gui._confirmExit = function() {
    if (tutao.locator.viewManager.isUserLoggedIn()) {
        return tutao.lang("leavePageConfirmation_msg");
    } else {
        return null;
    }
};*/

tutao.tutanota.gui._fixWindowHeight = function() {
    if (window.innerHeight != document.body.style.height) {
        document.body.style.height = window.innerHeight + "px";
    }
    if (document.body.scrollTop !== 0) {
        window.scrollTo(0, 0);
    }
};

/**
 * Prevents the complete window from scrolling vertically on touch devices.
 * See http://stackoverflow.com/questions/10238084/ios-safari-how-to-disable-overscroll-but-allow-scrollable-divs-to-scroll-norma
 */
tutao.tutanota.gui._disableWindowScrolling = function() {

    // Uses document because document will be topmost level in bubbling
    $(document).on('touchmove',function(e){
        e.preventDefault();
    });

    // Uses body because jquery on events are called off of the element they are
    // added to, so bubbling would not work if we used document instead.
    var scrolling = false;
    $('body').on('touchstart','.scrollable',function(e) {

        // Only execute the below code once at a time
        if (!scrolling) {
            scrolling = true;
            if (e.currentTarget.scrollTop === 0) {
                e.currentTarget.scrollTop = 1;
            } else if (e.currentTarget.scrollHeight === e.currentTarget.scrollTop + e.currentTarget.offsetHeight) {
                e.currentTarget.scrollTop -= 1;
            }
            scrolling = false;
        }
    });

    // Prevents preventDefault from being called on document if it sees a scrollable div
    $('body').on('touchmove', '.scrollable', function(e) {
        // Only block default if internal div contents are large enough to scroll
        // Warning: scrollHeight support is not universal. (http://stackoverflow.com/a/15033226/40352)
        if($(this)[0].scrollHeight > $(this).innerHeight()) {
            e.stopPropagation();
        }
    });
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
// * Register a listener function that is called when a long press on a mail in the mail list is registered.
// * @param {function(Object,number,number)} listener The listener passes the pressed dom element and the x/y position that was pressed.
// */
//tutao.tutanota.gui.registerMailLongPress = function(listener) {
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
//				listener($(e.target).closest(".mailInList").get(0), startX, startY);
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
        if (tutao.tutanota.util.ClientDetector.getBrowserType() == tutao.tutanota.util.ClientDetector.BROWSER_TYPE_ANDROID) {
            // css transitions on older androids are horribly slow
            $(domElement).css("left", left + "px");
            $(domElement).css("width", width + "px");
        } else {
            $(domElement).transition({left: left + "px", width: width + "px"}, 300, 'easeInOutCubic');
        }
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
 * Notifies the listener about window size changes.
 * @param {function(number, number)} listener Provides the new width and height of the window if the values change.
 */
tutao.tutanota.gui.addWindowResizeListener = function(listener) {
	var self = this;
	$(window).on("resize", function() {
		listener(self.getWindowWidth(), self.getWindowHeight());
	});
	// on iOS 6, the orientation change events do not trigger resize events in ComposerMode (see e.g. tutao.locator.mailView.enableTouchComposingMode())
	if (tutao.tutanota.util.ClientDetector.isMobileDevice()) {
		$(window).on("orientationchange", function() {
			listener(self.getWindowWidth(), self.getWindowHeight());
		});
	}
};

/**
 * Adjust the height of all panel elements to enable scrolling in firefox browser. This is just a workaround.
 * http://www.webdesignerdepot.com/2014/02/how-to-create-horizontal-scrolling-using-display-table-cell
 */
tutao.tutanota.gui.adjustPanelHeight = function () {
    if (tutao.tutanota.util.ClientDetector.getBrowserType() == tutao.tutanota.util.ClientDetector.BROWSER_TYPE_FIREFOX || (tutao.tutanota.util.ClientDetector.getBrowserType() == tutao.tutanota.util.ClientDetector.BROWSER_TYPE_IE && tutao.tutanota.util.ClientDetector.getBrowserVersion() >= 10 && tutao.tutanota.util.ClientDetector.getDeviceType() == tutao.tutanota.util.ClientDetector.DEVICE_TYPE_DESKTOP)) {
        var panelPadding = parseInt( $('.panel').css('padding-top'));
        var calculatedHeight = $(window).height() - panelPadding;
        $('.panel > div').css('height', calculatedHeight);
    }
};

/**
 * Shows the tooltip on mobile devices
 * @param {DOMElement} element
 */
tutao.tutanota.gui.showTooltip = function(item, event) {
    var element = event.target.parentElement; // the bubble

    $(document).trigger("click.tooltip"); // hide other tooltips
    $(element).children(".tooltip").show().transition({ opacity: 0.9 });
    $(document).on("click.tooltip", function (e) {
        // it takes a bit till the original click event bubbles and we do not want to catch this one and hide the tooltip immediately, therefore check the timestamp
        // do not close the tooltip if the user clicks on it to allow selecting the tooltip text
        if (e.timeStamp !== event.timeStamp && !$(".tooltip").is($(e.target.parentElement))) {
            $(document).off("click.tooltip");
            $(element).children(".tooltip").transition({ opacity: 0 }).hide();
        }
    });
    return false;
};

/**
 * Opens a link in a new browser window
 * @param {string} href
 */
tutao.tutanota.gui.openLink = function(href) {
    if (tutao.env.mode == tutao.Mode.App) {
        window.open(href, "_system");
    } else {
        window.open(href, "_blank");
    }
};
