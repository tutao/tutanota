"use strict";

goog.provide('tutao.tutanota.gui.ContextMenu');

/**
 * A popup menu with arbitrary items. Looks like a native iPad popup!
 * @constructor
 */
tutao.tutanota.gui.ContextMenu = function() {
	this._initialized = false;
};

/**
 * The singleton instance of the context menu. There are never more than one context menu open, so we only need one.
 */
tutao.tutanota.gui.ContextMenu._instance = undefined;

/**
 * Provides the context menu instance.
 * @return {tutao.tutanota.gui.ContextMenu} The context menu instance.
 */
tutao.tutanota.gui.ContextMenu.getInstance = function() {
	if (!tutao.tutanota.gui.ContextMenu._instance) {
		tutao.tutanota.gui.ContextMenu._instance = new tutao.tutanota.gui.ContextMenu();
	}
	return tutao.tutanota.gui.ContextMenu._instance;
};

/**
 * Shows a context menu. Closes the menu when one of its items or somewhere outside the menu is clicked.
 * @param {Object} element The dom element the menu is shown for.
 * @param {number} posX The x value of the position for which the menu is shown.
 * @param {number} posY The y value of the position for which the menu is shown.
 * @param {Array.<Object>} entries The entries that shall be shown in the menu. Shows the result of toString() on the entries.
 * @param {function(Object)} callback Is called when one of the entries was clicked. Passes the clicked entry as argument.
 */
tutao.tutanota.gui.ContextMenu.prototype.showMenu = function(element, posX, posY, entries, callback) {
	// create a div for the context menu the first time this function is called
	if (!this._initialized) {
		var div = document.createElement('div');
		div.id = "context_menu";
		document.getElementsByTagName('body')[0].appendChild(div);

		// when the fade out transition is finished we need to remove the popup menu so that it does not block touch events to elements below it
		var transitionEndFunction = function(e) {
	        if (div.style.opacity == '0') {
	        	div.style.display = 'none';
	        }
	    };
		div.addEventListener('webkitTransitionEnd', transitionEndFunction);
		div.addEventListener('transitionend', transitionEndFunction);

		this._initialized = true;
	}

    var menu = document.getElementById('context_menu');
    // remove the old elements
    while (menu.hasChildNodes()) {
    	menu.removeChild(menu.firstChild);
    }
    // add the new elements
    for (var i = 0; i < entries.length; i++) {
    	var span = document.createElement('span');
    	span.innerHTML = entries[i].toString();
    	span.id = i;
    	menu.appendChild(span);
    }

    // it must be made visible before drawing the background otherwise the background is invisible
    menu.style.display = '';
    // draw the background. this must be done each time this function is called because the size depends
    // on the entries
    this._drawMenuBackground(menu.offsetWidth, menu.offsetHeight);

    // calculate the position of the context menu
    var menuWidth = menu.offsetWidth;
    /*var leftTop = this._findPos(element);
    var targetLeft = leftTop[0];
    var targetBottom = leftTop[1] + element.offsetHeight;
    var targetWidth = element.offsetWidth;
    var menuLeft = targetLeft + (targetWidth/2) - (menuWidth/2);
    var menuTop = targetBottom + 20;
    */
    var menuLeft = posX - (menuWidth / 2);
    //noinspection UnnecessaryLocalVariableJS
    var menuTop = posY;

    menu.style.top = menuTop + 'px';
    menu.style.left = menuLeft + 'px';

    menu.style.opacity = '1';

    // register a click listener for the whole document, but only call the callback if one of the entries was clicked
    this._registerTouchStartEndListener(document, function(target) {
    	menu.style.opacity = '0';
    	if (callback && entries[target.id]) {
    		callback(entries[target.id]);
    	}
    });
};

/**
 * Registers an event listener that only fires if a full touchstart/touchend was received. At the same time no parent elements of the given
 * element are notified of touch or click events.
 * @param {Object} domElement The dom element for which the events shall be registered.
 * @param {function(Object)} callback This callback function is called when the event is received. Passes the dom element that received the event.
 * @protected
 */
tutao.tutanota.gui.ContextMenu.prototype._registerTouchStartEndListener = function(domElement, callback) {
	// keep track of all touch start and end calls
	var nbrOfStarts = 0;

	// register touchstart and touchend to make sure that both are received, e.g. an initial touchend is ignored.
	var touchStartFunction = undefined;
	touchStartFunction = function(e) {
		e.stopPropagation();
		nbrOfStarts++;
	};
	domElement.addEventListener("touchstart", touchStartFunction, true);
	domElement.addEventListener("mousedown", touchStartFunction, true);

	var touchEndFunction = undefined;
	touchEndFunction = function(e) {
		e.stopPropagation();
		// the first call may be a touch end. in that case it is ignored
		if (nbrOfStarts > 0) {
			nbrOfStarts--;
			if (nbrOfStarts == 0) {
				domElement.removeEventListener("touchstart", touchStartFunction, true);
				domElement.removeEventListener("touchend", touchEndFunction, true);
		    	domElement.removeEventListener("mousedown", touchStartFunction, true);
		    	domElement.removeEventListener("mouseup", touchEndFunction, true);
				callback(e.target);
			}
		}
	};
	domElement.addEventListener("touchend", touchEndFunction, true);
	domElement.addEventListener("mouseup", touchEndFunction, true);

	// we need to register a click listener and stop propagation to avoid that elements below the given element are notified (e.g. mail below popup is selected)
	var clickFunction = undefined;
	clickFunction = function(e) {
		e.stopPropagation();
		domElement.removeEventListener("click", clickFunction, true);
	};
	domElement.addEventListener("click", clickFunction, true);
};

/**
 * Provides the position of the given dom element. DOES NOT WORK CORRECTLY!
 * @param {Object} obj The dom element.
 * @return {Array.<number,number>} An array with the x and y value of the position.
 * @protected
 */
tutao.tutanota.gui.ContextMenu.prototype._findPos = function(obj) {
	var curleft = 0;
	var curtop = 0;
	if (obj.offsetParent) {
		do {
			curleft += obj.offsetLeft;
			curtop += obj.offsetTop;
		} while (obj = obj.offsetParent);
	}
	return [curleft, curtop];
};

/**
 * Draws the background of this popup menu.
 * @param {number} rectWidth Width of the menu.
 * @param {number} rectHeight Height of the menu.
 * @protected
 */
tutao.tutanota.gui.ContextMenu.prototype._drawMenuBackground = function(rectWidth, rectHeight) {
	var context = undefined;
    if (document.getCSSCanvasContext) {
        context = document.getCSSCanvasContext('2d', 'menu_background', rectWidth, rectHeight);
    } else {

        var menu = document.getElementById('context_menu');
        var mycanvas = document.createElement('canvas');
        mycanvas.setAttribute('id', 'context_menu_moz_background');
        mycanvas.setAttribute('width', rectWidth);
        mycanvas.setAttribute('height', rectHeight);

        menu.appendChild(mycanvas);

        context = mycanvas.getContext('2d');
    }

    var arrowHeight = 20;
    var radius = 6;
    var lineWidth = 1;
    var pad = lineWidth / 2;
    var xs = pad;
    var ys = pad + arrowHeight;
    var xe = rectWidth - pad;
    var ye = rectHeight - pad;

    var gradient = context.createLinearGradient(rectWidth / 2, 0, rectWidth / 2, arrowHeight * 2);
    gradient.addColorStop(0, '#eee');
    gradient.addColorStop(1, '#151d31');

    context.beginPath();

    context.lineJoin = 'miter';

    context.moveTo(xs + radius, ys);

    context.lineTo(rectWidth / 2 - (arrowHeight + pad), ys);
    context.lineTo(rectWidth / 2, pad);
    context.lineTo(rectWidth / 2 + (arrowHeight + pad), ys);

    context.lineTo(xe - radius, ys);

    context.arcTo(xe, ys, xe, ys + radius, radius);

    context.lineTo(xe, ye - radius);
    context.arcTo(xe, ye, xe - radius, ye, radius);

    context.lineTo(xs + radius, ye);
    context.arcTo(xs, ye, xs, ye - radius, radius);

    context.lineTo(xs, ys + radius);
    context.arcTo(xs, ys, xs + radius, ys, radius);

    context.fillStyle = gradient;

    context.globalAlpha = .95;
    context.fill();

    context.globalAlpha = 1;

    context.strokeStyle = '#48484a';
    context.lineWidth = lineWidth;
    context.stroke();
};
