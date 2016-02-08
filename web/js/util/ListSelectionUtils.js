"use strict";

tutao.provide('tutao.util.ListSelectionUtils');

/**
 * Updates the given list of selected items with a click on the given clicked item. Takes ctrl and shift key events into consideration for multi selection.
 * If ctrl is pressed the selection status of the clickedItem is toggled.
 * If shift is pressed, all items beginning from the nearest selected item to the clicked item are additionally selected.
 * If neither ctrl nor shift are pressed only the clicked item is selected.
 * @param {function(<Object>)} allItems The observable array with the list of all visible items.
 * @param {function(<Object>)} selectedItems The observable array with all selected items, not sorted. All selected items must also be present in allItems.
 * @param {Object} clickedItem The item that was clicked by the user.
 * @return {bool} True if the click was a multi-selection operation, i.e. ctrl or shift was pressed while clicking the item.
 */
tutao.util.ListSelectionUtils.itemClicked = function(allItems, selectedItems, clickedItem) {
    if (tutao.locator.keyManager.isCtrlPressed()) {
        if (selectedItems().indexOf(clickedItem) != -1) {
            selectedItems.remove(clickedItem);
        } else {
            selectedItems.push(clickedItem);
        }
        return true;
    } else if (tutao.locator.keyManager.isShiftPressed()) {
        if (selectedItems().length == 0) {
            // no item is selected, so treat it as if shift was not pressed
            selectedItems([clickedItem]);
        } else if (selectedItems().length == 1 && selectedItems()[0] == clickedItem) {
            // nothing to do, the item is already selected
        } else {
            // select all items from the given item to the nearest already selected item
            var clickedItemIndex = allItems.indexOf(clickedItem);
            var nearestSelectedIndex = null;
            for (var i=0; i<selectedItems().length; i++) {
                var currentSelectedItemIndex = allItems.indexOf(selectedItems()[i]);
                if (nearestSelectedIndex == null || Math.abs(clickedItemIndex - currentSelectedItemIndex) < Math.abs(clickedItemIndex - nearestSelectedIndex)) {
                    nearestSelectedIndex = currentSelectedItemIndex;
                }
            }
            var itemsToAddToSelection = [];
            if (nearestSelectedIndex < clickedItemIndex) {
                for (var i=nearestSelectedIndex+1; i<=clickedItemIndex; i++) {
                    itemsToAddToSelection.push(allItems()[i]);
                }
            } else {
                for (var i=clickedItemIndex; i<nearestSelectedIndex; i++) {
                    itemsToAddToSelection.push(allItems()[i]);
                }
            }
            ko.utils.arrayPushAll(selectedItems, itemsToAddToSelection);
        }
        return true;
    } else {
        selectedItems([clickedItem]);
        return false;
    }
};
