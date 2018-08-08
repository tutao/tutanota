import {TypeRef} from "../src/api/common/EntityFunctions"

declare function finder(any): boolean

declare function stringValidator(string): ?string;

declare function validator(): ?string;

declare function progressUpdater(number): void;

declare function lazy<T>(): T;

declare function lazyAsync<T>(): Promise<T>;

declare function action(): Promise<void>;

declare function handler<T>(T): void;

declare function mapper<T, R>(T): ?R;

declare function clickHandler(event: MouseEvent): void;

declare function dropHandler(dragData: string): void;

type KeyPress = {keyCode: number, ctrl: boolean, shift: boolean};

declare function keyMatcher(key: KeyPress): boolean;

type Key = {code: number, name: string};

declare interface Shortcut {
	key: Key;
	ctrl?: boolean; // undefined == false
	alt?: boolean; // undefined == false
	shift?: boolean; // undefined == false
	meta?: boolean; // undefined == false
	enabled?: lazy<boolean>;

	exec(key: KeyPress): ?boolean; // must return true, if preventDefault should not be invoked
	help: string;
}

/**
 * @return false, if the default action should be aborted
 */
declare function keyHandler(key: KeyPress): boolean;


declare interface UpdatableComponent {
	view(): VirtualElement | VirtualElement[];

	entityEventReceived<T>(typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum): void;

	addButtonClicked?: boolean;
}

declare interface MithrilEvent {
	redraw: boolean;
}

declare interface ListConfig<T, R: VirtualRow<T>> {
	rowHeight: number;

	/**
	 * Get the given number of entities starting after the given id. May return more elements than requested, e.g. if all elements are available on first fetch.
	 */
	fetch(startId: Id, count: number): Promise<T[]>;

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
	 * @param selection Changed: True if the selection changed, false if it did not change. There may be no change, e.g. when the user clicks an element that is already selected.
	 * @param multiSelectOperation: True if the user executes a multi select (shift or ctrl key pressed) or if an element is removed from the selection because it was removed from the list.
	 */
	elementSelected(entities: T[], elementClicked: boolean, selectionChanged: boolean, multiSelectOperation: boolean): void;

	createVirtualRow(): R;

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

declare interface TableRow<T> {
	render: (entity: T, odd: boolean, index: number) => Children;
}

declare interface TableHead {
	render: () => Children;
}

declare interface TableAttrs<T> {
	row: TableRow<T>; // The component to render all rows
	head?: TableHead;
	cache: RowCache<T>; // The cache for this table
	style?: Object;
	class?: string;
}

declare interface RowCache<T> {
	cache: T[];

	loadMore(): Promise<void>;

	complete: boolean;
	loading: ?Promise<void>;
}

declare interface SwipeConfiguration<T> {
	renderLeftSpacer(): Children;

	renderRightSpacer(): Children;

	swipeLeft(listElement: T): Promise<void>;

	swipeRight(listElement: T): Promise<void>;
}

/**
 * 1:1 mapping to DOM elements. Displays a single list entry.
 */
declare interface VirtualRow<T> {
	render(): Children;

	update(listEntry: T, selected: boolean): void;

	entity: ?T;
	top: number;
	domElement: HTMLElement;
}

declare function stream<T>(value: ?T): T

declare function windowSizeListener(width: number, height: number): void

declare type VirtualElement = Object

declare var document: Document

declare interface View {
}

declare interface ModalComponent {
	hideAnimation(): Promise<void>;

	onClose(): void;

	shortcuts(): Shortcut[];

	view(vnode: Vnode<any>): Vnode<any>;

	backgroundClick(e: MouseEvent): void;
}

type LogCategory = {[key: string]: string}

// Enums
type ThemeId = 'light' | 'dark' | 'custom'

declare function EasingFunction(percent: number): number;

type DomMutation = {
	updateDom(target: HTMLElement, percent: number, easing: EasingFunction): void;
}
type DomTransform = {
	updateDom(target: HTMLElement, percent: number, easing: EasingFunction): void;
	chain(type: TransformEnum, begin: number, end: number): DomTransform;
}
type AlphaEnum = 'backgroundColor' | 'color'
type TransformEnum = 'translateX' | 'translateY' | 'rotateY' | 'rotateZ'
type TransformValues = {
	[key: TransformEnum]: {begin: number, end: number}
}

declare var navigator: Navigator;

declare class DateTimeFormat {
	constructor(lang: string, options?: Object): void;
	format(d: Date): string;
}

declare class NumberFormat {
	constructor(lang: string, options?: Object): void;
	format(value: number): string;
}

declare class Intl {
	static DateTimeFormat: DateTimeFormat;
	static NumberFormat: NumberFormat;
}

type SanitizeResult = {
	text: string,
	externalContent: string[]
}

type StatusTypeEnum = 'neutral' | 'valid' | 'invalid'

type Status = {
	type: StatusTypeEnum,
	text: string
}

type ButtonColors = {button: string, button_selected: string, icon: string, icon_selected: string}

declare class Notification {
	static permission: string;
	static requestPermission(callback: Function): void;
	constructor(application: string, options?: Object): void;
	onshow: any;
	onclick: any;
	close: Function;
}

declare var indexedDB: any;
