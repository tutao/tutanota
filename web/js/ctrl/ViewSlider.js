"use strict";

tutao.provide('tutao.tutanota.ctrl.ViewSlider');

/**
 * Represents a view with multiple view columns. Depending on the screen width and the view columns configurations, the actual widths and positions of the view
 * columns is calculated. This allows a consistent layout for any browser resolution on any type of device.
 * @constructor
 */
tutao.tutanota.ctrl.ViewSlider = function(updateColumnTitleCallback) {
	 // all dummy values until showDefault is called the first time
	// static values (only change at initialization or screen width change)
	this._viewColumns = [];
	this._screenWidth = 0;
	this._initialized = false;
	this._receiver = undefined;
    this._updateColumnTitleCallback = updateColumnTitleCallback;
	this._defaultViewStartIndex = 0;
	this._defaultViewEndIndex = 0;

	// dynamic information (changes depending on the currently visible columns of the view)
	this._minVisibleColumn = -1;
	this._maxVisibleColumn = -1;
	this._mainViewColumnId = -1; // the view column that was selected via showViewColumn or -1 if showDefault was called
};

/**
 * Adds a view column by providing its configuration and returns an id for it. All view columns must be added during the initialization of the ViewSlider.
 * @param {number} prio The priority of the view column. Lower value = higher priority. This is used to determine which view columns are visible by default.
 * @param {number} minWidth The minimum allowed width for the view column.
 * @param {number} maxWidth The maximum allowed width for the view column.
 * @param {function(number, number)} widthReceiver A listener function that is called whenever the position or width of the view column is modified. Receives the x position and width
 * of the view column as argument.
 * @param {function()} titleProvider A function that returns the translated title text for a column.
 * @return {number} The id that is now associated with the view column. Use it for calls to showViewColumn and isVisible.
 */
tutao.tutanota.ctrl.ViewSlider.prototype.addViewColumn = function(prio, minWidth, maxWidth, widthReceiver, titleProvider) {
	// 0 is a dummy width until showDefault is called the first time
	this._viewColumns.push({ prio: prio, minWidth: minWidth, maxWidth: maxWidth, widthReceiver: widthReceiver, width: null, getTitle: titleProvider, observable: new tutao.event.Observable()});
	return this._viewColumns.length - 1;
};

/**
 * Set the function that is called when the position and/or width of the view need to be adopted. This function must be called
 * during initialization.
 * @param {function(number,number,boolean)} receiver A listener function that is called as soon as the position and/or width of the view need to be adopted.
 * First argument is the left position in px, second argument is the width in px, third argument indicates if this is the initial call to set the left
 * position and width. The receiver can use this information e.g to initially set the values directly in the gui and animate the change otherwise.
 */
tutao.tutanota.ctrl.ViewSlider.prototype.setViewPositionAndSizeReceiver = function(receiver) {
	this._receiver = receiver;
};

/**
 * Calculates the width of each column and calculates the default columns.
 */
tutao.tutanota.ctrl.ViewSlider.prototype._initColumns = function() {
	this._calculateDefaultColumns();

	// calculate the column widths of the columns left and right of the default columns
	for (var i = this._defaultViewEndIndex + 1; i < this._viewColumns.length; i++) {
		// try to find a width that make complete columns visible in that view
		var widthSum = this._viewColumns[i].minWidth;
		// walk from the column left and add up the widths until it does not fit into the screen any more
		var currentColumn = i - 1;
		while (widthSum + this._viewColumns[currentColumn].width < this._screenWidth) {
			widthSum += this._viewColumns[currentColumn].width;
			currentColumn--;
		}
		this._viewColumns[i].width = Math.min(this._viewColumns[i].minWidth + (this._screenWidth - widthSum), this._viewColumns[i].maxWidth);
	}

	for (var i = this._defaultViewStartIndex - 1; i >= 0; i--) {
		// try to find a width that make complete columns visible in that view
		var widthSum = this._viewColumns[i].minWidth;
		// walk from the column right and add up the widths until it does not fit into the screen any more
		var currentColumn = i + 1;
		while (widthSum + this._viewColumns[currentColumn].width < this._screenWidth) {
			widthSum += this._viewColumns[currentColumn].width;
			currentColumn++;
		}
        // if the column (+ neighbours) does not fit into the screen width completely, only show it with its minimal width
        if (this._viewColumns[i].minWidth + (this._screenWidth - widthSum) > this._viewColumns[i].maxWidth) {
            this._viewColumns[i].width = this._viewColumns[i].minWidth;
        } else {
            this._viewColumns[i].width = this._viewColumns[i].minWidth + (this._screenWidth - widthSum);
        }
	}

	// notify the column widths and positions
	var posX = 0;
	for (var i = 0; i < this._viewColumns.length; i++) {
		// notify the view column via the setter function
		this._viewColumns[i].widthReceiver(posX, this._viewColumns[i].width);
        this._viewColumns[i].observable.notifyObservers(this._viewColumns[i].width);
		posX += this._viewColumns[i].width;
	}
};

/**
 * Calculates the default columns (_defaultViewStartIndex, _defaultViewEndIndex) and the widths of those columns.
 */
tutao.tutanota.ctrl.ViewSlider.prototype._calculateDefaultColumns = function() {
	// calculate the highest prio column
	var highestPrio = null;
	var highestPrioColumn = null;
	for (var i = 0; i < this._viewColumns.length; i++) {
		if (highestPrio == null || this._viewColumns[i].prio < highestPrio) {
			highestPrio = this._viewColumns[i].prio;
			highestPrioColumn = i;
		}
	}
	// find neighbours to be contained in the default columns
	var width = Math.min(this._viewColumns[highestPrioColumn].minWidth, this._screenWidth);
	var index = highestPrioColumn;
	this._defaultViewStartIndex = highestPrioColumn;
	this._defaultViewEndIndex = highestPrioColumn;
	while (true) {
		index = this._getHighestPrioNeighbour(this._defaultViewStartIndex, this._defaultViewEndIndex);
		if (index == null) {
			break;
		}
		if (width + this._viewColumns[index].minWidth <= this._screenWidth) {
			width += this._viewColumns[index].minWidth;
			this._defaultViewStartIndex = Math.min(this._defaultViewStartIndex, index);
			this._defaultViewEndIndex = Math.max(this._defaultViewEndIndex, index);
		} else {
			break;
		}
	}
	if (this._defaultViewStartIndex == this._defaultViewEndIndex) {
		// only one default column
		if (this._viewColumns.length == 1) {
			// there is only one column at all, so use the max width if that is less than the window width
			this._viewColumns[this._defaultViewStartIndex].width = Math.min(this._screenWidth, this._viewColumns[this._defaultViewStartIndex].maxWidth);
		} else {
			this._viewColumns[this._defaultViewStartIndex].width = this._screenWidth;
		}
	} else {
		// calculate the widths of the default columns
		var spareWidth = this._screenWidth - width;
		// distribute the spareWidth to the default columns proportional to their minWidth
		var newWidth = 0;
		for (var i = this._defaultViewStartIndex; i < this._defaultViewEndIndex; i++) {
			this._viewColumns[i].width = Math.floor(this._viewColumns[i].minWidth + spareWidth * this._viewColumns[i].minWidth / width);
			newWidth += this._viewColumns[i].width;
		}
		// calculate the last columns width from newWidth to make sure that by rounding no spare pixels are left
		this._viewColumns[this._defaultViewEndIndex].width = this._screenWidth - newWidth;
	}
};

/**
 * Provides the index of the column that has the highest priority left or right of the given columns.
 * @param {number} columnIndex The column to check the neighbours for.
 * @return {number=} The index of the heighest prio neighbour or null if none.
 */
tutao.tutanota.ctrl.ViewSlider.prototype._getHighestPrioNeighbour = function(minColumnId, maxColumnId) {
	if (minColumnId == 0 && maxColumnId == this._viewColumns.length - 1) {
		return null;
	} else if (minColumnId == 0) {
		return maxColumnId + 1;
	} else if (maxColumnId == this._viewColumns.length - 1) {
		return minColumnId - 1;
	} else if (this._viewColumns[minColumnId - 1].prio > this._viewColumns[maxColumnId + 1].prio) {
		return maxColumnId + 1;
	} else {
		return minColumnId - 1;
	}
};

/**
 * Sets the current screen width if it has changed, e.g. browser resizing or tablet orientation change.
 * The view slider will update the view columns sizes and positions accordingly.
 * @param {number} screenWidth The width of the visible browser area.
 */
tutao.tutanota.ctrl.ViewSlider.prototype.setScreenWidth = function(screenWidth) {
	this._screenWidth = screenWidth;
	if (this._initialized) {
		this._initialized = false; // screen width changes are regarded as new initialization
		// reset the visible columns to calculate them again
		if (this._mainViewColumnId == -1) {
			// the default columns were visible, so show them now again
			this.showDefault();
		} else {
			this.showViewColumn(this._mainViewColumnId);
		}
	}
};

/**
 * Adjusts the layout of the view columns according to their properties (prio, min/max width).
 * This function must be called once after the initialization of the ViewSlider
 * is finished (setViewPositionAndSizeReceiver, initial setScreenWidth and addViewColumn for all view columns).
 */
tutao.tutanota.ctrl.ViewSlider.prototype.showDefault = function() {
	var initial = !this._initialized;
	if (!this._initialized) {
		this._initColumns();
		this._initialized = true;
	}
	if (initial || this._minVisibleColumn != this._defaultViewStartIndex || this._maxVisibleColumn != this._defaultViewEndIndex) {
		this._mainViewColumnId = -1; // this must be -1 if showDefault is called

		this._minVisibleColumn = this._defaultViewStartIndex;
		this._maxVisibleColumn = this._defaultViewEndIndex;
		this.notifyViewPosition(initial);
	}
    this.notifyColumnChange();
};

/**
 * Calculates the view position according to the minimum visible column and notifies the position receiver.
 * @param {boolean} initial Indicates if this is an initial notification.
 */
tutao.tutanota.ctrl.ViewSlider.prototype.notifyViewPosition = function(initial) {
	var x = 0;
	for (var i = 0; i < this._minVisibleColumn; i++) {
		x -= this._viewColumns[i].width;
	}
	var viewWidth = this._getViewWidth();
	// center the visible columns if they are smaller than the window width (may only happen if they are the only columns at all)
	if (viewWidth < this._screenWidth) {
		x = (this._screenWidth - viewWidth) / 2;
	}
	this._receiver(x, viewWidth, initial);
};

/**
 * Adjusts the view column positions to make the given view column visible.
 * @param {number} viewColumnId The id of the view columns that shall be made visible.
 */
tutao.tutanota.ctrl.ViewSlider.prototype.showViewColumn = function(viewColumnId) {
	var initial = !this._initialized; // this may be initial after a screen width change
	if (!this._initialized) {
		this._initColumns();
		this._initialized = true;
	}

	this._mainViewColumnId = viewColumnId;

	if (initial) {
		// show at least the column with the id viewColumnId
		// if possible additionally show other former visible columns (by prio)
		// if possible additionally show other columns (by prio)
		var newMin = viewColumnId;
		var newMax = viewColumnId;
		var widthSum = this._viewColumns[viewColumnId].width;
		while (true) {
			var next = null;
			if (this._minVisibleColumn < newMin && this._maxVisibleColumn > newMax) {
				// there were left and right additional visible columns, so check their prio
				next = this._getHighestPrioNeighbour(newMin, newMax);
			} else if (this._minVisibleColumn < newMin) {
				// there were left additional visible columns
				next = newMin - 1;
			} else if (this._maxVisibleColumn > newMax) {
				// there were right additional visible columns
				next = newMax + 1;
			} else {
				// there are no former visible columns left and right any more, so just check the remaining
				// former non-visible ones
				next = this._getHighestPrioNeighbour(newMin, newMax);
			}
			if (next == null || next == -1 || next == this._viewColumns.length) {
				break;
			} else if (widthSum + this._viewColumns[next].width <= this._screenWidth) {
				widthSum += this._viewColumns[next].width;
				newMin = Math.min(newMin, next);
				newMax = Math.max(newMax, next);
			} else {
				break;
			}
		}
		this._minVisibleColumn = newMin;
		this._maxVisibleColumn = newMax;
		this.notifyViewPosition(initial);
	} else	if (viewColumnId < this._minVisibleColumn) {
		// move the view as little as possible so that the column becomes visible
		// calculate the visible columns
		this._minVisibleColumn = viewColumnId;
		var widthSum = 0;
		var index = viewColumnId;
		while (widthSum + this._viewColumns[index].width <= this._screenWidth) {
			widthSum += this._viewColumns[index].width;
			index++;
		}
		this._maxVisibleColumn = index - 1;
		this.notifyViewPosition(initial);
	} else if (viewColumnId > this._maxVisibleColumn) {
		// calculate the visible columns
		this._maxVisibleColumn = viewColumnId;
		var widthSum = 0;
		var index = viewColumnId;
		while (widthSum + this._viewColumns[index].width <= this._screenWidth) {
			widthSum += this._viewColumns[index].width;
			index--;
		}
		this._minVisibleColumn = index + 1;
		this.notifyViewPosition(initial);
	}
    this.notifyColumnChange();
};

/**
 * Adds an observer that is notified if the width of the provided column changes
 * @param {number} viewColumnId The id of the view columns that shall be made visible.
 * @param {function(number)} widthObserver Called with the updated width
 */
tutao.tutanota.ctrl.ViewSlider.prototype.addWidthObserver = function(viewColumnId, widthObserver) {
    this._viewColumns[viewColumnId].observable.addObserver(widthObserver);
};

/**
 * Provides the information if the view column associated with the given id is visible. Partly visible view columns are regarded as not visible.
 * @param {number} viewColumnId The id of the view columns.
 * @return {boolean} Returns true if the view columns is visible, false otherwise.
 */
tutao.tutanota.ctrl.ViewSlider.prototype.isVisible = function(viewColumnId) {
	return (viewColumnId >= this._minVisibleColumn && viewColumnId <= this._maxVisibleColumn);
};

/**
 * Provides the id of the leftmost visible column.
 * @return {number} The id of the leftmost visible column.
 */
tutao.tutanota.ctrl.ViewSlider.prototype.getLeftmostVisibleColumnId = function() {
	return this._minVisibleColumn;
};

/**
 * Provides the id of the rightmost visible column.
 * @return {number} The id of the rightmost visible column.
 */
tutao.tutanota.ctrl.ViewSlider.prototype.getRightmostVisibleColumnId = function() {
	return this._maxVisibleColumn;
};

/**
 * Provides the width of the complete view which is the sum of its view columns.
 * @protected
 * @return {number} The width of the view.
 */
tutao.tutanota.ctrl.ViewSlider.prototype._getViewWidth = function() {
	// the view width is the sum of all view columns
	var viewWidth = 0;
	for (var i = 0; i < this._viewColumns.length; i++) {
		viewWidth += this._viewColumns[i].width;
	}
	return viewWidth;
};

/**
 * Return the width of the given view column.
 * @param {number} viewColumnId The id of the view column.
 * @return {number} The width of the view column.
 */
tutao.tutanota.ctrl.ViewSlider.prototype.getViewColumnWidth = function(viewColumnId) {
    return this._viewColumns[viewColumnId].width;
};

tutao.tutanota.ctrl.ViewSlider.prototype.notifyColumnChange = function() {
    if ( this._updateColumnTitleCallback != undefined){
        var currentTitle = null;
        if ( this._minVisibleColumn >= 0){
            currentTitle = this._viewColumns[this._minVisibleColumn].getTitle();
        }
        var previousColumnId = this._minVisibleColumn -1;
        var previousTitle = null;
        if (previousColumnId >=0 ){
            previousTitle = this._viewColumns[previousColumnId].getTitle();
        }
       this._updateColumnTitleCallback(currentTitle, previousTitle);
    }
};




//Html and css for a simple test:
//
//<!DOCTYPE html>
//<html>
//<head>
//  <meta charset="utf-8" />
//  <meta name="apple-mobile-web-app-capable" content="yes" />
//  <meta name="viewport" content="initial-scale=1.0,maximum-scale=1.0">
//  <title>Test</title>
//     <link href="test.css" rel="stylesheet" type="text/css">
//    <script type="text/javascript" src="libs/closure-library-2012-01-19/closure/goog/base.js"></script>
//  <script type="text/javascript" src="libs/jquery-1.7.1.js"></script>
//  <script type="text/javascript" src="js/ctrl/ViewSlider.js"></script>
//<script type="text/javascript">
//$(document).ready(function() {
//  window.view = new tutao.tutanota.ctrl.ViewSlider();
//  window.view.setScreenWidth(1024);
//  window.view.setViewPositionAndSizeReceiver(function(left, width, initial) {
//    if (initial) {
//      $('#view').css("left", left + "px");
//    } else {
//      $('#view').animate({ left: left + "px"}, 300);
//    }
//    $('#view').css("width", width + "px");
//  });
//  window.view.addViewColumn(2, 150, 150, function(width) { {number}
//	  $('#viewColumn0').css("width", width + "px");
//  });
//  window.view.addViewColumn(0, 300, 300, function(width) {
//    $('#viewColumn1').css("width", width + "px");
//  });
//  window.view.addViewColumn(1, 724, 724, function(width) {
//    $('#viewColumn2').css("width", width + "px");
//  });
//  window.view.showDefault();
//  // window.view.showViewColumn(0);
//});
//</script>
//</head>
//<body>
//  <div id="view">
//    <div id="viewColumn0">
//      tags tags tags tags tags tags tags tags tags tags tags tags tags tags tags tags tags tags tags tags tags tags tags tags
//    </div>
//    <div id="viewColumn1">
//      mail list mail list mail list mail list mail list mail list mail list mail list mail list mail list mail list mail list mail list mail list
//    </div>
//    <div id="viewColumn2">
//      mails mails mails mails mails mails mails mails mails mails mails mails mails mails mails mails mails mails mails mails mails mails mails
//    </div>
//  </div>
//</body>
//</html>
//
//body {
//  overflow-x: hidden;
//}
//
//div#view {
//  position: absolute;
//  top: 65px;
//  bottom: 0px;
//}
//
//div#viewColumn0 {
//  position: relative;
//  height: 100%;
//  float: left;
//  background: #456743;
//}
//
//div#viewColumn1 {
//  position: relative;
//  height: 100%;
//  float: left;
//  background: #956443;
//}
//
//div#viewColumn2 {
//  position: relative;
//  height: 100%;
//  float: left;
//  background: #156793;
//}
