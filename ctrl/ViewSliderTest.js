"use strict";

JsHamcrest.Integration.JsTestDriver();
JsMockito.Integration.JsTestDriver();

TestCase("ViewSliderTest", {
	
	"test default columns and column widths": function() {
		// both fit in
		this.checkColumns(450, [{prio: 1, min: 150, max: 150}, {prio: 0, min: 300, max: 300}], 0, 1, [150, 300]);
		// one fits in
		this.checkColumns(449, [{prio: 1, min: 150, max: 150}, {prio: 0, min: 300, max: 300}], 1, 1, [150, 449]);
		// iPad vertical
		this.checkColumns(1024, [{prio: 2, min: 150, max: 150}, {prio: 0, min: 300, max: 400}, {prio: 1, min: 600, max: 1000}, {prio: 3, min: 300, max: 500}], 1, 2, [150, 341, 683, 341]);
		// iPad horizontal
		this.checkColumns(768, [{prio: 2, min: 150, max: 150}, {prio: 0, min: 300, max: 400}, {prio: 1, min: 600, max: 1000}, {prio: 3, min: 300, max: 500}], 1, 1, [150, 768, 768, 500]);
		// desktop browser
		this.checkColumns(1920, [{prio: 2, min: 150, max: 150}, {prio: 0, min: 300, max: 400}, {prio: 1, min: 600, max: 1000}, {prio: 3, min: 300, max: 500}], 0, 3, [213, 426, 853, 428]);
		// single column, max width is used
		this.checkColumns(1024, [{prio: 0, min: 150, max: 300}], 0, 0, [300]);
	},
	
	checkColumns: function(width, columns, defaultStart, defaultEnd, widths) {
		var view = new tutao.tutanota.ctrl.ViewSlider();
		view.setViewPositionAndSizeReceiver(function() {});
		view.setScreenWidth(width);
		for (var i=0; i<columns.length; i++) {
			view.addViewColumn(columns[i].prio, columns[i].min, columns[i].max, function() {});
		}
		view.showDefault();
		assertEquals("default start index wrong:", defaultStart, view._defaultViewStartIndex);
		assertEquals("default end index wrong:", defaultEnd, view._defaultViewEndIndex);
		for (var i=0; i<widths.length; i++) {
			assertEquals("column " + i + " width is wrong:", widths[i], view._viewColumns[i].width);
		}
	},
	
	"test show column": function() {
		var view = new tutao.tutanota.ctrl.ViewSlider();
		view.setScreenWidth(1024);
		var callIndex = 0;
		view.setViewPositionAndSizeReceiver(function(left, width, initial) {
			if (callIndex == 0) {
				//view.showDefault()
				assertEquals(-150, left);
				assertEquals(1515, width);
				assertEquals(true, initial);
			} else if (callIndex == 1) {
				//view.showViewColumn(0)
				assertEquals(0, left);
				assertEquals(1515, width);
				assertEquals(false, initial);
			} else if (callIndex == 2) {
				//view.showViewColumn(3)
				assertEquals(-491, left);
				assertEquals(1515, width);
				assertEquals(false, initial);
			} else if (callIndex == 3) {
				//view.showDefault()
				assertEquals(-150, left);
				assertEquals(1515, width);
				assertEquals(false, initial);
			} else if (callIndex == 4) {
				// after screen change
				assertEquals(-150, left);
				assertEquals(2186, width);
				assertEquals(true, initial);
			}
			callIndex++;
		});
		var screenWidth = 1024;
		view.addViewColumn(2, 150, 150, function(posX, width) {
			if (screenWidth == 1024) {
				assertEquals(150, width);
			} else {
				assertEquals(150, width);
			}
		});
		view.addViewColumn(0, 300, 400, function(posX, width) {
			if (screenWidth == 1024) {
				assertEquals(341, width);
			} else {
				assertEquals(768, width);
			}
		});
		view.addViewColumn(1, 600, 1000, function(posX, width) {
			if (screenWidth == 1024) {
				assertEquals(683, width);
			} else {
				assertEquals(768, width);
			}
		});
		view.addViewColumn(3, 300, 500, function(posX, width) {
			if (screenWidth == 1024) {
				assertEquals(341, width);
			} else {
				assertEquals(500, width);
			}
		});
		view.showDefault();
		view.showViewColumn(0);
		view.showViewColumn(1); // should not do anything
		view.showViewColumn(3);
		view.showDefault();
		screenWidth = 768;
		view.setScreenWidth(768);
	}
});