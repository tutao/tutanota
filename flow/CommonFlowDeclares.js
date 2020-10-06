import type {EntityUpdateData} from "../src/api/main/EventController"
import type {TranslationKey} from "../src/misc/LanguageViewModel"

declare type finder<T> = (T) => boolean

declare type stringValidator = (string) => ?TranslationKey | Promise<?TranslationKey>;

declare type validator = () => ?TranslationKey | Promise<?TranslationKey>;

declare type progressUpdater = (number) => mixed;

declare type lazy<T> = () => T;

declare type lazyAsync<T> = () => Promise<T>;

declare type action = () => Promise<void>;

declare type handler<T> = (T) => mixed;

declare type mapper<T, R> = (T) => ?R;

// not all browsers have the actual button as e.currentTarget, but all of them send it as a second argument (see https://github.com/tutao/tutanota/issues/1110)
declare type clickHandler = (event: MouseEvent, dom: HTMLElement) => mixed;

declare type dropHandler = (dragData: string) => void;


declare interface UpdatableSettingsViewer {
	view(): Children;

	entityEventsReceived(updates: $ReadOnlyArray<EntityUpdateData>): Promise<void>;
}

declare interface MithrilEvent {
	redraw: boolean;
}

type ListConfig<T, R: VirtualRow<T>> = {
	rowHeight: number;

	/**
	 * Get the given number of entities starting after the given id. May return more elements than requested, e.g. if all elements are available on first fetch.
	 */
	fetch(startId: Id, count: number): Promise<Array<T>>;

	/**
	 * Returns null if the given element could not be loaded
	 */
	loadSingle(elementId: Id): Promise<?T>;

	sortCompare(entity1: T, entity2: T): number;

	/**
	 * Called whenever the user clicks on any element in the list or if the selection changes by any other means.
	 * Use cases:
	 *                                                                                                          elementClicked  selectionChanged  multiSelectOperation  entities.length
	 * Scroll to element (loadInitial(entity) or scrollToIdAndSelect()) which was not selected before:          false           true              false                 1
	 * Select previous or next element with key shortcut:                                                       false           true              false                 1
	 * Select previous or next element with key shortcut and multi select:                                      false           true              true                  any
	 * User clicks non-selected element without multi selection:                                                true            true              false                 1
	 * User clicks selected element without multi selection:                                                    true            false             false                 1
	 * User clicks element with multi selection, so selection changes:                                          true            true              true                  any
	 * User clicks element with multi selection, so selection does not change:                                  true            false             true                  any
	 * Element is deleted and next element is selected:                                                         false           true              false                 1
	 * Element is deleted and removed from selection:                                                           false           true              true                  any
	 *
	 * @param entities: The selected entities.
	 * @param elementClicked: True if the user clicked on any element, false if the selection changed by any other means.
	 * @param selectionChanged: True if the selection changed, false if it did not change. There may be no change, e.g. when the user clicks an element that is already selected.
	 * @param multiSelectOperation: True if the user executes a multi select (shift or ctrl key pressed) or if an element is removed from the selection because it was removed from the list.
	 */
	elementSelected(entities: Array<T>, elementClicked: boolean, selectionChanged: boolean, multiSelectOperation: boolean): void;

	/**
	 * add custom drag behaviour to the list.
	 * @param ev dragstart event
	 * @param vR: the row the event was started on
	 * @param selectedElements the currently selected elements
	 * @return true if the event was fully handled, false if the list should execute default behaviour
	 */
	dragStart?: (ev: DragEvent, vR: VirtualRow<T>, selectedElements: Array<T>) => boolean;

	createVirtualRow(): R;

	listLoadedCompletly?: () => void;

	showStatus: boolean;
	className: string;
	swipe: SwipeConfiguration<T>;

	elementsDraggable: boolean;
	/**
	 * True if the user may select multiple or 0 elements.
	 * Keep in mind that even if multiSelectionAllowed == false, elementSelected() will be called with multiSelectOperation = true if an element is deleted and removed from the selection.
	 */
	multiSelectionAllowed: boolean;
	emptyMessage: string;
}


type SwipeConfiguration<T> = {
	renderLeftSpacer(): Children;

	renderRightSpacer(): Children;

	// result value indicates whether to commit to the result of the swipe
	// true and undefined both indicate commiting, false means to not commit - maybe we should change to just boolean and update all the callsites
	swipeLeft(listElement: T): Promise<boolean | void>;

	swipeRight(listElement: T): Promise<boolean | void>;

	enabled: boolean;

}

/**
 * 1:1 mapping to DOM elements. Displays a single list entry.
 */
declare interface VirtualRow<T> {
	render(): Children;

	update(listEntry: T, selected: boolean): void;

	entity: ?T;
	top: number;
	domElement: ?HTMLElement;
}

declare type windowSizeListener = (width: number, height: number) => mixed

declare type VirtualElement = Object

declare var document: Document

declare interface View {
}

type LogCategory = {[key: string]: string}

// Enums
type ThemeId = 'light' | 'dark' | 'custom'

declare var navigator: Navigator;

type SanitizeResult = {
	text: string,
	externalContent: Array<string>,
	inlineImageCids: Array<string>,
	links: Array<string>,
}

type StatusTypeEnum = 'neutral' | 'valid' | 'invalid'

type Status = {
	type: StatusTypeEnum,
	text: TranslationKey
}

type ButtonColors = {button: string, button_selected: string, icon: string, icon_selected: string}

declare var indexedDB: any;
