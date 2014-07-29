"use strict";

describe("ViewSliderTest", function () {

    var assert = chai.assert;

    var checkColumns = function (width, columns, defaultStart, defaultEnd, widths) {
        var view = new tutao.tutanota.ctrl.ViewSlider();
        view.setViewPositionAndSizeReceiver(function () {});
        view.setScreenWidth(width);
        for (var i = 0; i < columns.length; i++) {
            view.addViewColumn(columns[i].prio, columns[i].min, columns[i].max, function () {
            });
        }
        view.showDefault();
        assert.equal(defaultStart, view._defaultViewStartIndex, "default start index wrong:");
        assert.equal(defaultEnd, view._defaultViewEndIndex, "default end index wrong:");
        for (var i = 0; i < widths.length; i++) {
            assert.equal(widths[i], view._viewColumns[i].width, "column " + i + " width is wrong:");
        }
    };

    it("default columns and column widths", function () {
        // both fit in
        checkColumns(450, [
            {prio: 1, min: 150, max: 150},
            {prio: 0, min: 300, max: 300}
        ], 0, 1, [150, 300]);
        // one fits in
        checkColumns(449, [
            {prio: 1, min: 150, max: 150},
            {prio: 0, min: 300, max: 300}
        ], 1, 1, [150, 449]);
        // iPad vertical
        checkColumns(1024, [
            {prio: 2, min: 150, max: 150},
            {prio: 0, min: 300, max: 400},
            {prio: 1, min: 600, max: 1000},
            {prio: 3, min: 300, max: 500}
        ], 1, 2, [150, 341, 683, 341]);
        // iPad horizontal
        checkColumns(768, [
            {prio: 2, min: 150, max: 150},
            {prio: 0, min: 300, max: 400},
            {prio: 1, min: 600, max: 1000},
            {prio: 3, min: 300, max: 500}
        ], 1, 1, [150, 768, 768, 500]);
        // desktop browser
        checkColumns(1920, [
            {prio: 2, min: 150, max: 150},
            {prio: 0, min: 300, max: 400},
            {prio: 1, min: 600, max: 1000},
            {prio: 3, min: 300, max: 500}
        ], 0, 3, [213, 426, 853, 428]);
        // single column, max width is used
        checkColumns(1024, [
            {prio: 0, min: 150, max: 300}
        ], 0, 0, [300]);
    });

    it(" show column", function () {
        var view = new tutao.tutanota.ctrl.ViewSlider();
        view.setScreenWidth(1024);
        var callIndex = 0;
        view.setViewPositionAndSizeReceiver(function (left, width, initial) {
            if (callIndex == 0) {
                //view.showDefault()
                assert.equal(-150, left);
                assert.equal(1515, width);
                assert.equal(true, initial);
            } else if (callIndex == 1) {
                //view.showViewColumn(0)
                assert.equal(0, left);
                assert.equal(1515, width);
                assert.equal(false, initial);
            } else if (callIndex == 2) {
                //view.showViewColumn(3)
                assert.equal(-491, left);
                assert.equal(1515, width);
                assert.equal(false, initial);
            } else if (callIndex == 3) {
                //view.showDefault()
                assert.equal(-150, left);
                assert.equal(1515, width);
                assert.equal(false, initial);
            } else if (callIndex == 4) {
                // after screen change
                assert.equal(-150, left);
                assert.equal(2186, width);
                assert.equal(true, initial);
            }
            callIndex++;
        });
        var screenWidth = 1024;
        view.addViewColumn(2, 150, 150, function (posX, width) {
            if (screenWidth == 1024) {
                assert.equal(150, width);
            } else {
                assert.equal(150, width);
            }
        });
        view.addViewColumn(0, 300, 400, function (posX, width) {
            if (screenWidth == 1024) {
                assert.equal(341, width);
            } else {
                assert.equal(768, width);
            }
        });
        view.addViewColumn(1, 600, 1000, function (posX, width) {
            if (screenWidth == 1024) {
                assert.equal(683, width);
            } else {
                assert.equal(768, width);
            }
        });
        view.addViewColumn(3, 300, 500, function (posX, width) {
            if (screenWidth == 1024) {
                assert.equal(341, width);
            } else {
                assert.equal(500, width);
            }
        });
        view.showDefault();
        view.showViewColumn(0);
        view.showViewColumn(1); // should not do anything
        view.showViewColumn(3);
        view.showDefault();
        screenWidth = 768;
        view.setScreenWidth(768);
    });

});