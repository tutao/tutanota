import {ViewColumn} from "../src/gui/base/ViewColumn"
import type {EntityUpdateData} from "../src/api/main/EventController"


interface IViewSlider {
	focusedColumn: ViewColumn;

	isFocusPreviousPossible(): boolean;

	isFirstBackgroundColumnFocused(): boolean;

	isForegroundColumnFocused(): boolean;

	getPreviousColumn(): ?ViewColumn;

	focusPreviousColumn(): void;

	focusNextColumn(): void;

	getBackgroundColumns(): ViewColumn[];

	isUsingOverlayColumns(): boolean;

	getMainColumn(): ViewColumn;
}