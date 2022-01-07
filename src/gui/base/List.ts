import m, {Children} from "mithril"
import {Cat, log} from "../../misc/Log"
import {px} from "../size"
import {client} from "../../misc/ClientDetector"
import {Keys, OperationType, TabIndex} from "../../api/common/TutanotaConstants"
import type {DeferredObject, MaybeLazy} from "@tutao/tutanota-utils"
import {
	addAll,
	arrayEquals,
	assertNotNull,
	debounceStart,
	defer,
	last,
	mapLazily,
	neverNull,
	remove
} from "@tutao/tutanota-utils"
import ColumnEmptyMessageBox from "./ColumnEmptyMessageBox"
import {progressIcon} from "./Icon"
import {animations, DefaultAnimationTime, opacity, transform, TransformEnum} from "../animation/Animations"
import {ease} from "../animation/Easing"
import {windowFacade} from "../../misc/WindowFacade"
import {BadRequestError} from "../../api/common/error/RestError"
import {SwipeHandler} from "./SwipeHandler"
import {applySafeAreaInsetMarginLR} from "../HtmlUtils"
import {theme} from "../theme"
import {styles} from "../styles"
import type {Shortcut} from "../../misc/KeyManager"
import {isKeyPressed, keyManager} from "../../misc/KeyManager"
import type {ListElement} from "../../api/common/utils/EntityUtils"
import {firstBiggerThanSecond, GENERATED_MAX_ID, getElementId, getLetId} from "../../api/common/utils/EntityUtils"
import {assertMainOrNode} from "../../api/common/Env"

assertMainOrNode()
export const ScrollBuffer = 15 // virtual elements that are used as scroll buffer in both directions

export const PageSize = 100
export type SwipeConfiguration<T> = {
	renderLeftSpacer(): Children
	renderRightSpacer(): Children
	// result value indicates whether to commit to the result of the swipe
	// true indicates committing, false means to not commit and to cancel
	swipeLeft(listElement: T): Promise<boolean>
	swipeRight(listElement: T): Promise<boolean>
	enabled: boolean
}

/**
 * 1:1 mapping to DOM elements. Displays a single list entry.
 */
export interface VirtualRow<T> {
	render(): Children

	update(listEntry: T, selected: boolean): void

	entity: T | null
	top: number
	domElement: HTMLElement | null
}

export type ListConfig<T, R extends VirtualRow<T>> = {
	rowHeight: number

	/**
	 * Get the given number of entities starting after the given id. May return more elements than requested, e.g. if all elements are available on first fetch.
	 */
	fetch(startId: Id, count: number): Promise<Array<T>>

	/**
	 * Returns null if the given element could not be loaded
	 */
	loadSingle(elementId: Id): Promise<T | void>
	sortCompare(entity1: T, entity2: T): number

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
	elementSelected(entities: Array<T>, elementClicked: boolean, selectionChanged: boolean, multiSelectOperation: boolean): void

	/**
	 * add custom drag behaviour to the list.
	 * @param ev dragstart event
	 * @param vR: the row the event was started on
	 * @param selectedElements the currently selected elements
	 */
	dragStart?: (ev: DragEvent, vR: VirtualRow<T>, selectedElements: ReadonlyArray<T>) => void
	createVirtualRow(): R
	listLoadedCompletly?: () => void
	showStatus: boolean
	className: string
	swipe: SwipeConfiguration<T>

	/**
	 * True if the user may select multiple or 0 elements.
	 * Keep in mind that even if multiSelectionAllowed == false, elementSelected() will be called with multiSelectOperation = true if an element is deleted and removed from the selection.
	 */
	multiSelectionAllowed: boolean
	emptyMessage: string
}

type RenderCallbackType =
		| {
	type: "timeout"
	id: TimeoutID
}
		| {
	type: "frame"
	id: AnimationFrameID
}


/**
 * A list that renders only a few dom elements (virtual list) to represent the items of even very large lists.
 *
 * Generics:
 * * T is the type of the entity
 * * R is the type of the Row
 */
export class List<T extends ListElement, R extends VirtualRow<T>> {
	_config: ListConfig<T, R>
	_loadedEntities: T[] // sorted with _config.sortCompare

	_virtualList: R[] // displays a part of the page, VirtualRows map 1:1 to DOM-Elements

	_domListContainer: HTMLElement
	_domList: HTMLElement
	_domInitialized: DeferredObject<void>
	_width: number
	_loadedCompletely: boolean
	_loading: Promise<void>
	currentPosition: number
	lastPosition: number
	lastUpdateTime: number
	updateLater: boolean // if set, paint operations are executed later, when the scroll speed becomes slower

	repositionTimeout: TimeoutID | null // the id of the timeout to reposition if updateLater == true and scrolling stops abruptly (e.g. end of list or user touch)

	_domStatus: {
		bufferUp: HTMLElement | null
		bufferDown: HTMLElement | null
		speed: HTMLElement | null
		scrollDiff: HTMLElement | null
		timeDiff: HTMLElement | null
	}
	_visibleElementsHeight: number
	bufferHeight: number
	_swipeHandler: ListSwipeHandler<T, R> | null
	_domSwipeSpacerLeft: HTMLElement
	_domSwipeSpacerRight: HTMLElement
	_domLoadingRow: HTMLElement
	ready: boolean
	view: (...args: Array<any>) => any
	onbeforeupdate: (...args: Array<any>) => any
	oncreate: (...args: Array<any>) => any
	onremove: (...args: Array<any>) => any
	_scrollListener: (...args: Array<any>) => any
	_selectedEntities: T[] // the selected entities must be sorted the same way the loaded entities are sorted

	_lastSelectedEntitiesForCallback: T[] = []
	_lastMultiSelectWasKeyUp: boolean // true if the last key multi selection action was selecting the previous entity, false if it was selecting the next entity

	_idOfEntityToSelectWhenReceived: Id | null
	_messageBoxDom: HTMLElement | null
	_renderCallback: RenderCallbackType | null
	// Can be activated by holding on element in a list. When active, elements can be selected just by tapping them
	_mobileMultiSelectionActive: boolean = false
	_displayingProgress: boolean

	constructor(config: ListConfig<T, R>) {
		this._config = config
		this._loadedEntities = []

		this._scrollListener = () => {
			this.currentPosition = this._domListContainer.scrollTop

			if (this.lastPosition !== this.currentPosition) {
				window.requestAnimationFrame(() => this._scroll())
			}
		}

		this._virtualList = []
		this._width = 0
		this._loadedCompletely = false
		this._loading = Promise.resolve()
		this.currentPosition = 0
		this.lastPosition = 0
		this.updateLater = false
		this._visibleElementsHeight = 0
		this.bufferHeight = this._config.rowHeight * ScrollBuffer
		this._domStatus = {
			bufferUp: null,
			bufferDown: null,
			speed: null,
			scrollDiff: null,
			timeDiff: null,
		}
		this._selectedEntities = []
		this._lastMultiSelectWasKeyUp = false // value does not matter here

		this._idOfEntityToSelectWhenReceived = null

		this.onbeforeupdate = () => !this.ready // the list should never be redrawn by mithril after the inial draw

		this._displayingProgress = false

		const updateWidth = () => {
			if (this._domListContainer && this._domSwipeSpacerLeft && this._domSwipeSpacerRight) {
				this._domSwipeSpacerLeft.style.opacity = "0"
				this._domSwipeSpacerRight.style.opacity = "0"
				setTimeout(() => {
					this._width = this._domListContainer.clientWidth

					if (this._swipeHandler) {
						this._swipeHandler.updateWidth()

						this._domSwipeSpacerLeft.style.opacity = "1"
						this._domSwipeSpacerRight.style.opacity = "1"
					}
				}, 60)
			}
		}

		const reset = () => {
			if (this._domListContainer) {
				this._domListContainer.removeEventListener("scroll", this._scrollListener)
			}

			this._domInitialized = defer()
			this.ready = false
			this._virtualList = []
			windowFacade.removeResizeListener(updateWidth)
		}

		reset()

		this.onremove = () => {
			keyManager.unregisterShortcuts(listSelectionKeyboardShortcuts(this))
			reset()
		}

		this.oncreate = () => {
			keyManager.registerShortcuts(listSelectionKeyboardShortcuts(this))
			windowFacade.addResizeListener(updateWidth)
		}

		this.view = (): Children => {
			let list = m(".list-container.fill-absolute.scroll.list-bg.nofocus.overflow-x-hidden", {
				tabindex: TabIndex.Programmatic,
				oncreate: vnode => {
					this._domListContainer = vnode.dom as HTMLElement
					this._width = this._domListContainer.clientWidth

					this._createChildrens()

					const render = () => {
						m.render(vnode.dom, [
							m(
									".swipe-spacer.flex.items-center.justify-end.pr-l.blue",
									{
										oncreate: vnode => (this._domSwipeSpacerLeft = vnode.dom as HTMLElement),
										tabindex: TabIndex.Programmatic,
										"aria-hidden": "true",
										style: {
											height: px(this._config.rowHeight),
											transform: `translateY(-${this._config.rowHeight}px)`,
											position: "absolute",
											"z-index": 1,
											width: px(this._width),
										},
									},
									this._config.swipe.renderLeftSpacer(),
							),
							m(
									".swipe-spacer.flex.items-center.pl-l.red",
									{
										oncreate: vnode => (this._domSwipeSpacerRight = vnode.dom as HTMLElement),
										tabindex: TabIndex.Programmatic,
										"aria-hidden": "true",
										style: {
											height: px(this._config.rowHeight),
											transform: `translateY(-${this._config.rowHeight}px)`,
											position: "absolute",
											"z-index": 1,
											width: px(this._width),
										},
									},
									this._config.swipe.renderRightSpacer(),
							),
							m(
									"ul.list.list-alternate-background.fill-absolute.click",
									{
										oncreate: vnode => this._setDomList(vnode.dom as HTMLElement),
										style: {
											height: this._calculateListHeight(),
										},
										className: this._config.className,
									},
									[
										this._virtualList.map(virtualRow => {
											return m(
													"li.list-row.pl.pr-l" + (this._config.dragStart ? '[draggable="true"]' : ""),
													{
														tabindex: TabIndex.Default,
														oncreate: vnode => this._initRow(virtualRow, vnode.dom as HTMLElement),
														style: {
															transform: `translateY(-${this._config.rowHeight}px)`,
															paddingTop: px(15),
															paddingBottom: px(15),
														},
														ondragstart: event => {
															if (this._config.dragStart) {
																this._config.dragStart(event, virtualRow, this._selectedEntities)
															}
														},
													},
													virtualRow.render(),
											)
										}), // odd-row is switched directly on the dom element when the number of elements changes
										m(
												"li#spinnerinlist.list-loading.list-row.flex-center.items-center.odd-row",
												{
													oncreate: vnode => {
														this._domLoadingRow = vnode.dom as HTMLElement
														this._domLoadingRow.style.display = this._displayingProgress ? "" : "none"
													},
												},
												progressIcon(),
										),
									],
							), // We cannot render it conditionally because it's rendered once, we must manipulate DOM afterwards
							m(ColumnEmptyMessageBox, {
								message: () => this._config.emptyMessage,
								color: theme.list_message_bg,
								oncreate: vnode => {
									this._messageBoxDom = vnode.dom as HTMLElement

									this._updateMessageBoxVisibility()
								},
							}),
						])

						this._domInitialized.resolve()

						this._init()
					}

					if (client.isMobileDevice()) {
						// We want side menu animation to end before doing any heavy things so it's smooth
						const id = window.setTimeout(() => render(), DefaultAnimationTime)
						this._renderCallback = {
							type: "timeout",
							id,
						}
					} else {
						const id = window.requestAnimationFrame(() => render())
						this._renderCallback = {
							type: "frame",
							id,
						}
					}
				},
			})

			if (this._config.showStatus) {
				return m(".status-wrapper", [
					m(
							".status.flex.justify-between.fill-absolute",
							{
								style: {
									height: px(60),
								},
							},
							[
								m("div", [
									m(".bufferUp", {
										oncreate: vnode => (this._domStatus.bufferUp = vnode.dom as HTMLElement),
									}),
									m(".bufferDown", {
										oncreate: vnode => (this._domStatus.bufferDown = vnode.dom as HTMLElement),
									}),
								]),
								m("div", [
									m(".scrollDiff", {
										oncreate: vnode => (this._domStatus.scrollDiff = vnode.dom as HTMLElement),
									}),
								]),
								m("div", [
									m(".speed", {
										oncreate: vnode => (this._domStatus.speed = vnode.dom as HTMLElement),
									}),
									m(".time", {
										oncreate: vnode => (this._domStatus.timeDiff = vnode.dom as HTMLElement),
									}),
								]),
							],
					),
					m(
							".list-wrapper.fill-absolute",
							{
								style: {
									top: px(60),
								},
							},
							list,
					),
				])
			} else {
				return list
			}
		}
	}

	clear() {
		this._loadedEntities.length = 0
		this._loadedCompletely = false

		if (this._domList) {
			this._domList.style.height = this._calculateListHeight()

			for (let row of this._virtualList) {
				if (row.domElement) {
					row.domElement.style.display = "none"
				}
			}
		}
	}

	_initRow(virtualRow: R, domElement: HTMLElement) {
		let touchStartTime
		virtualRow.domElement = domElement

		domElement.onclick = e => {
			if (!touchStartTime || Date.now() - touchStartTime < 400) {
				virtualRow.entity && this._elementClicked(virtualRow.entity, e)
			}
		}

		domElement.onkeyup = (e) => {
			if (isKeyPressed(e.keyCode, Keys.SPACE, Keys.RETURN)) {
				virtualRow.entity && this._elementClicked(virtualRow.entity, e)
			}
		}

		let timeoutId: TimeoutID | null
		let touchStartCoords:
				| {
			x: number
			y: number
		}
				| null
				| undefined
		domElement.addEventListener("touchstart", (e: TouchEvent) => {
			touchStartTime = Date.now()

			if (this._config.multiSelectionAllowed) {
				// Activate multi selection after pause
				timeoutId = setTimeout(() => {
					this._mobileMultiSelectionActive = true

					// check that virtualRow.entity exists because we had error feedbacks about it
					if (virtualRow.entity && !this.isEntitySelected(virtualRow.entity._id[1])) {
						this._selectedEntities.length = 0

						this._elementClicked(virtualRow.entity, e)
					} else {
						m.redraw() // only header changes we don't need reposition here
					}
				}, 400)
				touchStartCoords = {
					x: e.touches[0].pageX,
					y: e.touches[0].pageY,
				}
			}
		})

		const touchEnd = () => {
			timeoutId && clearTimeout(timeoutId)
		}

		domElement.addEventListener("touchend", touchEnd)
		domElement.addEventListener("touchcancel", touchEnd)
		domElement.addEventListener("touchmove", (e: TouchEvent) => {
			// If the user moved the finger too much by any axis, don't count it as a long press
			const maxDistance = 30
			const touch = e.touches[0]

			if (
					touchStartCoords &&
					timeoutId &&
					(Math.abs(touch.pageX - touchStartCoords.x) > maxDistance || Math.abs(touch.pageY - touchStartCoords.y) > maxDistance)
			) {
				clearTimeout(timeoutId)
			}
		})
		applySafeAreaInsetMarginLR(domElement)
	}

	getEntity(id: Id): T | null {
		return this._loadedEntities.find(entity => getLetId(entity)[1] === id)
	}

	/**
	 * Updates the given list of selected items with a click on the given clicked item. Takes ctrl and shift key events into consideration for multi selection.
	 * If ctrl is pressed the selection status of the clickedItem is toggled.
	 * If shift is pressed, all items beginning from the nearest selected item to the clicked item are additionally selected.
	 * If neither ctrl nor shift are pressed only the clicked item is selected.
	 */
	_elementClicked(clickedEntity: T, event: TouchEvent | MouseEvent | KeyboardEvent) {
		let selectionChanged = false
		let multiSelect = false

		if (this._config.multiSelectionAllowed && (this._mobileMultiSelectionActive || (client.isMacOS ? event.metaKey : event.ctrlKey))) {
			selectionChanged = true
			multiSelect = true

			if (this._selectedEntities.indexOf(clickedEntity) !== -1) {
				remove(this._selectedEntities, clickedEntity)
			} else {
				this._selectedEntities.push(clickedEntity)
			}
		} else if (this._config.multiSelectionAllowed && event.shiftKey) {
			multiSelect = true

			if (this._selectedEntities.length === 0) {
				// no item is selected, so treat it as if shift was not pressed
				this._selectedEntities.push(clickedEntity)

				selectionChanged = true
			} else if (this._selectedEntities.length === 1 && this._selectedEntities[0] === clickedEntity) {
				// nothing to do, the item is already selected
			} else {
				// select all items from the given item to the nearest already selected item
				let clickedItemIndex: number = this._loadedEntities.indexOf(clickedEntity)

				let nearestSelectedIndex: number | null = null

				for (let i = 0; i < this._selectedEntities.length; i++) {
					let currentSelectedItemIndex = this._loadedEntities.indexOf(this._selectedEntities[i])

					if (
							nearestSelectedIndex == null ||
							Math.abs(clickedItemIndex - currentSelectedItemIndex) < Math.abs(clickedItemIndex - nearestSelectedIndex)
					) {
						nearestSelectedIndex = currentSelectedItemIndex
					}
				}

				let itemsToAddToSelection = []

				if (neverNull(nearestSelectedIndex) < clickedItemIndex) {
					for (let i = neverNull(nearestSelectedIndex) + 1; i <= clickedItemIndex; i++) {
						itemsToAddToSelection.push(this._loadedEntities[i])
					}
				} else {
					for (let i = clickedItemIndex; i < neverNull(nearestSelectedIndex); i++) {
						itemsToAddToSelection.push(this._loadedEntities[i])
					}
				}

				addAll(this._selectedEntities, itemsToAddToSelection)
				selectionChanged = itemsToAddToSelection.length > 0
			}
		} else {
			if (!arrayEquals(this._selectedEntities, [clickedEntity])) {
				this._selectedEntities.splice(0, this._selectedEntities.length, clickedEntity)

				selectionChanged = true
			}
		}

		if (selectionChanged) {
			// the selected entities must be sorted the same way the loaded entities are sorted
			this._selectedEntities.sort(this._config.sortCompare)

			this._reposition()
		}

		if (this._selectedEntities.length === 0) {
			this._mobileMultiSelectionActive = false
		}

		this._elementSelected(this.getSelectedEntities(), true, multiSelect)
	}

	sort() {
		this._loadedEntities.sort(this._config.sortCompare)

		try {
			this.redraw()
		} catch (e) {
			// this may be called before "this" hasn't been fully initialized, in which case this.redraw() will throw
			// so just catch and do nothing
		}
	}

	_entitySelected(entity: T, addToSelection: boolean) {
		if (addToSelection) {
			if (this._selectedEntities.indexOf(entity) === -1) {
				this._selectedEntities.push(entity)

				// the selected entities must be sorted the same way the loaded entities are sorted
				this._selectedEntities.sort(this._config.sortCompare)

				this._reposition()

				this._elementSelected(this.getSelectedEntities(), false, true)
			}
		} else {
			let selectionChanged = this._selectedEntities.length !== 1 || this._selectedEntities[0] !== entity

			if (selectionChanged) {
				this._selectedEntities = [entity]

				this._reposition()
			}

			if (this._selectedEntities.length === 0) {
				this._mobileMultiSelectionActive = false
			}

			this._elementSelected(this.getSelectedEntities(), false, false)
		}
	}

	_elementSelected: (entities: T[], elementClicked: boolean, multiSelectOperation: boolean) => void = debounceStart(
			200,
			(entities, elementClicked, multiSelectOperation) => {
				const selectionChanged =
						this._lastSelectedEntitiesForCallback.length !== entities.length || this._lastSelectedEntitiesForCallback.some((el, i) => entities[i] !== el)

				this._config.elementSelected(entities, elementClicked, selectionChanged, multiSelectOperation)

				this._lastSelectedEntitiesForCallback = entities
			},
	)

	selectNext(shiftPressed: boolean) {
		if (!this._config.multiSelectionAllowed) {
			shiftPressed = false
		}

		if (shiftPressed && this._lastMultiSelectWasKeyUp === true && this._selectedEntities.length > 1) {
			// we have to remove the selection from the top
			this._selectedEntities.splice(0, 1)

			this._reposition()

			this._elementSelected(this.getSelectedEntities(), false, true)

			this._scrollToLoadedEntityAndSelect(this._selectedEntities[0], true)
		} else {
			this._lastMultiSelectWasKeyUp = false

			if (this._selectedEntities.length === 0 && this._loadedEntities.length > 0) {
				this._entitySelected(this._loadedEntities[0], shiftPressed)
			} else if (this._selectedEntities.length !== 0 && this._loadedEntities.length > 0) {
				let selectedIndex = this._loadedEntities.indexOf(last(this._selectedEntities))

				if (!shiftPressed && selectedIndex === this._loadedEntities.length - 1) {
					// select the last entity currently selected as multi selection. This is needed to avoid that elements can not be selected any more if all elements are multi selected
					selectedIndex--
				}

				if (selectedIndex !== this._loadedEntities.length - 1) {
					this._scrollToLoadedEntityAndSelect(this._loadedEntities[selectedIndex + 1], shiftPressed)
				}
			}
		}
	}

	selectPrevious(shiftPressed: boolean) {
		if (!this._config.multiSelectionAllowed) {
			shiftPressed = false
		}

		if (shiftPressed && this._lastMultiSelectWasKeyUp === false && this._selectedEntities.length > 1) {
			// we have to remove the selection from the bottom
			this._selectedEntities.splice(-1, 1)

			this._reposition()

			this._elementSelected(this.getSelectedEntities(), false, true)

			const lastEl = last(this._selectedEntities)
			lastEl && this._scrollToLoadedEntityAndSelect(lastEl, true)
		} else {
			this._lastMultiSelectWasKeyUp = true

			if (this._selectedEntities.length === 0 && this._loadedEntities.length > 0) {
				this._entitySelected(this._loadedEntities[0], shiftPressed)
			} else if (this._selectedEntities.length !== 0 && this._loadedEntities.length > 0) {
				let selectedIndex = this._loadedEntities.indexOf(this._selectedEntities[0])

				if (!shiftPressed && selectedIndex === 0) {
					// select the first entity currently selected as multi selection. This is needed to avoid that elements can not be selected any more if all elements are multi selected
					selectedIndex++
				}

				if (selectedIndex !== 0) {
					this._scrollToLoadedEntityAndSelect(this._loadedEntities[selectedIndex - 1], shiftPressed)
				}
			}
		}
	}

	selectNone() {
		this._mobileMultiSelectionActive = false

		if (this._selectedEntities.length > 0) {
			this._selectedEntities = []

			this._reposition()

			this._elementSelected([], false, false)
		}
	}

	isEntitySelected(id: Id): boolean {
		return this._selectedEntities.find(entity => getLetId(entity)[1] === id) != null
	}

	getSelectedEntities(): T[] {
		// return a copy to avoid outside modifications
		return this._selectedEntities.slice()
	}

	/**
	 * Must be called after creating the list. Loads an initial amount of elements into the list.
	 * @param listElementId If not null and existing, loads the list at least up to this element, scrolls to it and selects it.
	 */
	loadInitial(listElementId?: Id): Promise<void> {
		if (listElementId) {
			return this.scrollToIdAndSelect(listElementId).then(entity => {
				if (!entity) {
					return this._loadMore().then(() => {
						return this._domInitialized.promise.then(() => {
							this._domList.style.height = this._calculateListHeight()
						})
					})
				}
			})
		} else {
			return this._loadMore().then(() => {
				return this._domInitialized.promise.then(() => {
					this._domList.style.height = this._calculateListHeight()
				})
			})
		}
	}

	_loadMore(): Promise<any> {
		let startId

		if (this._loadedEntities.length === 0) {
			startId = GENERATED_MAX_ID
		} else {
			startId = getLetId(this._loadedEntities[this._loadedEntities.length - 1])[1]
		}

		let count = PageSize
		this.displaySpinner(this._loadedEntities.length === 0 && styles.isUsingBottomNavigation())
		this._loading = this._config
				.fetch(startId, count)
				.then((newItems: T[]) => {
					this._loadedEntities.push(...newItems)

					this._loadedEntities.sort(this._config.sortCompare)

					if (newItems.length < count) this.setLoadedCompletely() // ensure that all elements are added to the loaded entities before calling setLoadedCompletely
				})
				.finally(() => {
					this._displayingProgress = false

					if (this.ready) {
						this._domLoadingRow.style.display = "none"

						this._reposition()
					}
				})
		return this._loading
	}

	_calculateListHeight(): string {
		return this._config.rowHeight * (this._loadedEntities.length + (this._loadedCompletely ? 0 : 1)) + "px"
	}

	setLoadedCompletely() {
		this._loadedCompletely = true
		this._displayingProgress = false

		this._domInitialized.promise.then(() => {
			this._domLoadingRow.style.display = "none"
		})

		if (this._config.listLoadedCompletly) {
			this._config.listLoadedCompletly()
		}
	}

	displaySpinner(delayed: boolean = true, force?: boolean) {
		this._displayingProgress = true
		setTimeout(
				() => {
					if ((force || this._displayingProgress) && this._domLoadingRow) {
						this._domLoadingRow.style.display = ""
					} // Delay a little bit more than DefaultAnimationTime to execute after the dom is likely initialized
				},
				delayed ? DefaultAnimationTime + 16 : 5,
		)
	}

	_init() {
		this._domListContainer.addEventListener(
				"scroll",
				this._scrollListener,
				client.passive()
						? {
							passive: true,
						}
						: false,
		)

		window.requestAnimationFrame(() => {
			this._domList.style.height = this._calculateListHeight()

			this._reposition()

			this.ready = true

			if (client.isTouchSupported() && this._config.swipe.enabled) {
				this._swipeHandler = new ListSwipeHandler(this._domListContainer, this)
			}
		})
	}

	_setDomList(domElement: HTMLElement) {
		this._domList = domElement
	}

	_createChildrens() {
		let visibleElements = 2 * Math.ceil(this._domListContainer.clientHeight / this._config.rowHeight / 2) // divide and multiply by two to get an even number (because of alternating row backgrounds)

		this._virtualList.length = visibleElements + ScrollBuffer * 2
		this._visibleElementsHeight = visibleElements * this._config.rowHeight

		for (let i = 0; i < this._virtualList.length; i++) {
			this._virtualList[i] = this._config.createVirtualRow()
			this._virtualList[i].top = i * this._config.rowHeight
		}
	}

	_scroll() {
		// make sure no scrolling is done if the virtualList was already cleared when unloading this list. on Safari this would lead to an error.
		if (this._virtualList.length === 0) return
		let up = this.currentPosition < this.lastPosition
		let scrollDiff = up ? this.lastPosition - this.currentPosition : this.currentPosition - this.lastPosition
		let now = window.performance.now()
		let timeDiff = Math.round(now - this.lastUpdateTime)
		this.lastUpdateTime = now
		let rowHeight = this._config.rowHeight
		let topElement = this._virtualList[0]
		let bottomElement = this._virtualList[this._virtualList.length - 1]

		this._loadMoreIfNecessary()

		let status = {
			bufferUp: Math.floor((this.currentPosition - topElement.top) / rowHeight),
			bufferDown: Math.floor((bottomElement.top + rowHeight - (this.currentPosition + this._visibleElementsHeight)) / rowHeight),
			speed: Math.ceil(scrollDiff / timeDiff),
			// pixel per ms
			scrollDiff: scrollDiff,
			timeDiff: timeDiff,
		}
		this.updateStatus(status)
		this.lastPosition = this.currentPosition

		if (this.updateLater) {
			// only happens for non desktop devices
			if (
					scrollDiff < 50 ||
					this.currentPosition === 0 ||
					this.currentPosition + this._visibleElementsHeight === this._loadedEntities.length * rowHeight
			) {
				// completely reposition the elements as scrolling becomes slower or the top / bottom of the list has been reached
				this.repositionTimeout && clearTimeout(this.repositionTimeout)

				this._reposition()
			}
		} else if (
				(status.bufferDown <= 5 && this.currentPosition + this._visibleElementsHeight < this._loadedEntities.length * rowHeight - 6 * rowHeight) ||
				(status.bufferUp <= 5 && this.currentPosition > 6 * rowHeight)
		) {
			if (client.isDesktopDevice()) {
				this._reposition()
			} else {
				log(Cat.debug, "list > update later (scrolling too fast)")
				// scrolling is too fast, the buffer will be eaten up: stop painting until scrolling becomes slower
				this.updateLater = true
				this.repositionTimeout = setTimeout(() => this._repositionAfterScrollStop(), 110)
			}
		} else if (!up) {
			while (
					topElement.top + rowHeight < this.currentPosition - this.bufferHeight &&
					this._virtualList[this._virtualList.length - 1].top < rowHeight * this._loadedEntities.length - rowHeight
					) {
				let nextPosition = this._virtualList[this._virtualList.length - 1].top + rowHeight

				if (nextPosition < this.currentPosition) {
					this._reposition()
				} else {
					topElement.top = nextPosition

					if (topElement.domElement) {
						topElement.domElement.style.transform = `translateY(${topElement.top}px)`
					}

					let pos = topElement.top / rowHeight
					let entity = this._loadedEntities[pos]

					this._updateVirtualRow(topElement, entity, (pos % 2) as any)

					this._virtualList.push(this._virtualList.shift())

					topElement = this._virtualList[0]
					bottomElement = topElement
				}
			}
		} else {
			while (bottomElement.top > this.currentPosition + this._visibleElementsHeight + this.bufferHeight && topElement.top > 0) {
				let nextPosition = this._virtualList[0].top - rowHeight

				if (nextPosition > this.currentPosition) {
					this._reposition()
				} else {
					bottomElement.top = nextPosition

					if (bottomElement.domElement) {
						bottomElement.domElement.style.transform = `translateY(${bottomElement.top}px)`
					}

					let pos = bottomElement.top / rowHeight
					let entity = this._loadedEntities[pos]

					this._updateVirtualRow(bottomElement, entity, (pos % 2) as any)

					this._virtualList.unshift(this._virtualList.pop())

					topElement = bottomElement
					bottomElement = this._virtualList[this._virtualList.length - 1]
				}
			}
		}
	}

	_loadMoreIfNecessary() {
		let lastBunchVisible = this.currentPosition > this._loadedEntities.length * this._config.rowHeight - this._visibleElementsHeight * 2

		if (lastBunchVisible && !this._displayingProgress && !this._loadedCompletely) {
			this._loadMore().then(() => {
				this._domList.style.height = this._calculateListHeight()
			})
		}
	}

	_repositionAfterScrollStop() {
		if (window.performance.now() - this.lastUpdateTime > 100) {
			window.requestAnimationFrame(() => this._reposition())
		} else {
			this.repositionTimeout = setTimeout(() => this._repositionAfterScrollStop(), 110)
		}
	}

	_updateMessageBoxVisibility() {
		if (this._messageBoxDom) {
			this._messageBoxDom.style.display = this._loadedEntities.length === 0 && this._loadedCompletely && this._config.emptyMessage !== "" ? "" : "none"
		}
	}

	_reposition() {
		this._updateMessageBoxVisibility()

		this.currentPosition = this._domListContainer.scrollTop
		let rowHeight = this._config.rowHeight
		let maxStartPosition = rowHeight * this._loadedEntities.length - this.bufferHeight * 2 - this._visibleElementsHeight
		let nextPosition = this.currentPosition - (this.currentPosition % rowHeight) - this.bufferHeight

		if (nextPosition < 0) {
			nextPosition = 0
		} else if (nextPosition > maxStartPosition) {
			nextPosition = maxStartPosition
		}

		for (let row of this._virtualList) {
			row.top = nextPosition
			nextPosition = nextPosition + rowHeight

			if (!row.domElement) {
				// This might happen during the window resize when things change too fast, just try again next time
				console.log(`undefined dom element for virtual dom element ${this._virtualList.length}, ${row.top}`)
				return
			}

			row.domElement.style.transform = "translateY(" + row.top + "px)"
			let pos = row.top / rowHeight
			let entity = this._loadedEntities[pos]

			this._updateVirtualRow(row, entity, (pos % 2) as any)
		}

		if (this._loadedEntities.length % 2 === 0) {
			this._domLoadingRow.classList.add("odd-row")
		} else {
			this._domLoadingRow.classList.remove("odd-row")
		}

		log(Cat.debug, "repositioned list")
		this.updateLater = false
	}

	redraw(): void {
		this._reposition()
	}

	_updateVirtualRow(row: VirtualRow<T>, entity: T | null, odd: boolean) {
		row.entity = entity

		if (row.domElement) {
			if (odd) {
				row.domElement.classList.remove("odd-row")
			} else {
				row.domElement.classList.add("odd-row")
			}

			if (entity) {
				row.domElement.style.display = "list-item"
				row.update(entity, this.isEntitySelected(getLetId(entity)[1]))
			} else {
				row.domElement.style.display = "none"
			}
		}
	}

	updateStatus(status: { bufferUp: number; bufferDown: number; speed: number; scrollDiff: number; timeDiff: number }) {
		if (this._domStatus.bufferUp) this._domStatus.bufferUp.textContent = status.bufferUp + ""
		if (this._domStatus.bufferDown) this._domStatus.bufferDown.textContent = status.bufferDown + ""
		if (this._domStatus.speed) this._domStatus.speed.textContent = status.speed + ""
		if (this._domStatus.scrollDiff) this._domStatus.scrollDiff.textContent = status.scrollDiff + ""
		if (this._domStatus.timeDiff) this._domStatus.timeDiff.textContent = status.timeDiff + ""
	}

	/**
	 * Selects the element with the given id and scrolls to it so it becomes visible.
	 * Immediately selects the element if it is already existing in the list, otherwise waits until it is received via websocket, then selects it.
	 */
	scrollToIdAndSelectWhenReceived(listElementId: Id): void {
		let entity = this.getEntity(listElementId)

		if (entity) {
			this._scrollToLoadedEntityAndSelect(entity, false)
		} else {
			this._idOfEntityToSelectWhenReceived = listElementId
		}
	}

	/**
	 * Selects the element with the given id and scrolls to it so it becomes visible. Loads the list until the given element is reached.
	 * @return The entity or null if the entity is not in this list.
	 */
	async scrollToIdAndSelect(listElementId: Id): Promise<T | null> {
		let entity = this.getEntity(listElementId)

		if (entity) {
			this._scrollToLoadedEntityAndSelect(entity, false)

			return Promise.resolve(entity)
		} else {
			try {
				// first check if the element can be loaded
				const entity = await this._config.loadSingle(listElementId)
				if (!entity) {
					return null
				}
				const scrollTarget = await this._loadTill(listElementId)
				await this._domInitialized.promise
				this._domList.style.height = this._calculateListHeight()

				if (scrollTarget != null) {
					this._scrollToLoadedEntityAndSelect(scrollTarget, false)
				}

				return scrollTarget

			} catch (e) {
				if (e instanceof BadRequestError) {
					console.log("invalid element id", listElementId, e)
					return null
				} else {
					throw e
				}
			}
		}
	}

	_scrollToLoadedEntityAndSelect(scrollTarget: T, addToSelection: boolean) {
		// check if the element is visible already. only scroll if it is not visible
		for (let i = 0; i < this._virtualList.length; i++) {
			if (this._virtualList[i].entity === scrollTarget) {
				if (
						this._virtualList[i].top - this.currentPosition > 0 &&
						this._virtualList[i].top - this.currentPosition < this._visibleElementsHeight - this._config.rowHeight
				) {
					this._entitySelected(scrollTarget, addToSelection)

					// we do not need to scroll
					return
				}

				break
			}
		}

		this._domInitialized.promise.then(() => {
			this._domListContainer.scrollTop = this._loadedEntities.indexOf(scrollTarget) * this._config.rowHeight

			this._entitySelected(scrollTarget, addToSelection)
		})
	}

	_loadTill(listElementId: Id): Promise<T | null> {
		let scrollTarget = this._loadedEntities.find(e => getLetId(e)[1] === listElementId)

		// also stop loading if the list element id is bigger than the loaded ones
		if (
				scrollTarget != null ||
				this._loadedCompletely ||
				(this._loadedEntities.length > 0 && firstBiggerThanSecond(listElementId, getLetId(this._loadedEntities[this._loadedEntities.length - 1])[1]))
		) {
			return Promise.resolve(scrollTarget)
		} else {
			return this._loadMore().then(() => this._loadTill(listElementId))
		}
	}

	entityEventReceived(elementId: Id, operation: OperationType): Promise<void> {
		if (operation === OperationType.CREATE || operation === OperationType.UPDATE) {
			// load the element without range checks for now
			return this._config.loadSingle(elementId).then(entity => {
				if (!entity) {
					return
				}

				let newEntity: T = neverNull(entity)
				// wait for any pending loading
				return resolvedThen(this._loading, () => {
					if (operation === OperationType.CREATE) {
						if (this._loadedCompletely) {
							this._addToLoadedEntities(newEntity)
						} else if (this._loadedEntities.length > 0 && this._config.sortCompare(newEntity, neverNull(last(this._loadedEntities))) < 0) {
							// new element is in the loaded range or newer than the first element
							this._addToLoadedEntities(newEntity)
						}
					} else if (operation === OperationType.UPDATE) {
						this._updateLoadedEntity(newEntity)
					}
				})
			})
		} else if (operation === OperationType.DELETE) {
			let swipeAnimation = this._swipeHandler ? this._swipeHandler.animating : Promise.resolve()
			return swipeAnimation.then(() => this._deleteLoadedEntity(elementId))
		} else {
			return Promise.resolve()
		}
	}

	_addToLoadedEntities(entity: T) {
		for (let i = 0; i < this._loadedEntities.length; i++) {
			if (getLetId(entity)[1] === getLetId(this._loadedEntities[i])[1]) {
				return
			}
		}

		this._loadedEntities.push(entity)

		this._loadedEntities.sort(this._config.sortCompare)

		if (this.ready) {
			this._domList.style.height = this._calculateListHeight()

			this._reposition()
		}

		if (this._idOfEntityToSelectWhenReceived && this._idOfEntityToSelectWhenReceived === getLetId(entity)[1]) {
			this._idOfEntityToSelectWhenReceived = null

			this._scrollToLoadedEntityAndSelect(entity, false)
		}
	}

	_updateLoadedEntity(entity: T) {
		for (let positionToUpdate = 0; positionToUpdate < this._loadedEntities.length; positionToUpdate++) {
			if (getLetId(entity)[1] === getLetId(this._loadedEntities[positionToUpdate])[1]) {
				this._loadedEntities.splice(positionToUpdate, 1, entity as any)

				this._loadedEntities.sort(this._config.sortCompare)

				if (this.ready) {
					this._reposition()
				}

				break
			}
		}

		for (let i = 0; i < this._selectedEntities.length; i++) {
			if (getLetId(entity)[1] === getLetId(this._selectedEntities[i])[1]) {
				this._selectedEntities[i] = entity
				break
			}
		}
	}

	_deleteLoadedEntity(elementId: Id): Promise<void> {
		// wait for any pending loading
		return resolvedThen(this._loading, () => {
			let entity = this._loadedEntities.find(e => {
				return getLetId(e)[1] === elementId
			})

			if (entity) {
				let nextElementSelected = false

				if (this._selectedEntities.length === 1 && this._selectedEntities[0] === entity && this._loadedEntities.length > 1) {
					let nextSelection =
							entity === last(this._loadedEntities)
									? this._loadedEntities[this._loadedEntities.length - 2]
									: this._loadedEntities[this._loadedEntities.indexOf(entity) + 1]

					this._selectedEntities.push(nextSelection)

					nextElementSelected = true
				}

				remove(this._loadedEntities, entity)
				let selectionChanged = remove(this._selectedEntities, entity)

				if (this.ready) {
					this._domList.style.height = this._calculateListHeight()

					this._reposition()
				}

				if (selectionChanged) {
					this._elementSelected(this.getSelectedEntities(), false, !nextElementSelected)
				}

				// trigger loading new elements before the scrollbar disappears and no reload can be triggered any more by scrolling
				this._loadMoreIfNecessary()
			}
		})
	}

	isMobileMultiSelectionActionActive(): boolean {
		return this._mobileMultiSelectionActive
	}

	getLoadedEntities(): T[] {
		return this._loadedEntities
	}
}

export const ACTION_DISTANCE = 150

function resolvedThen<T, R>(promise: Promise<T>, handler: () => R): Promise<R> {
	return promise.then(handler, handler)
}

class ListSwipeHandler<T extends ListElement, R extends VirtualRow<T>> extends SwipeHandler {
	virtualElement: VirtualRow<T> | null
	list: List<T, R>
	xoffset: number

	constructor(touchArea: HTMLElement, list: List<any, any>) {
		super(touchArea)
		this.list = list
	}

	onHorizontalDrag(xDelta: number, yDelta: number) {
		super.onHorizontalDrag(xDelta, yDelta)
		// get it *before* raf so that we don't pick an element after reset() again
		const ve = this.getVirtualElement()
		// Animate the row with following touch
		window.requestAnimationFrame(() => {
			// Do not animate the swipe gesture more than necessary
			this.xoffset = xDelta < 0 ? Math.max(xDelta, -ACTION_DISTANCE) : Math.min(xDelta, ACTION_DISTANCE)

			if (!this.isAnimating && ve && ve.domElement && ve.entity) {
				ve.domElement.style.transform = `translateX(${this.xoffset}px) translateY(${ve.top}px)`
				this.list._domSwipeSpacerLeft.style.transform = `translateX(${this.xoffset - this.list._width}px) translateY(${ve.top}px)`
				this.list._domSwipeSpacerRight.style.transform = `
				translateX(${this.xoffset + this.list._width}px) translateY(${ve.top}px)`
			}
		})
	}

	onHorizontalGestureCompleted(delta: { x: number; y: number }): Promise<void> {
		if (this.virtualElement && this.virtualElement.entity && Math.abs(delta.x) > ACTION_DISTANCE) {
			// Gesture is completed
			let entity = this.virtualElement.entity
			let swipePromise

			if (delta.x < 0) {
				swipePromise = this.list._config.swipe.swipeLeft(entity)
			} else {
				swipePromise = this.list._config.swipe.swipeRight(entity)
			}

			return this.finish(getElementId(entity), swipePromise, delta)
		} else {
			return this.reset(delta)
		}
	}

	finish(
			id: Id,
			swipeActionPromise: Promise<any>,
			delta: {
				x: number
				y: number
			},
	): Promise<void> {
		if (this.xoffset !== 0) {
			let ve = neverNull(this.virtualElement)
			let listTargetPosition = this.xoffset < 0 ? -this.list._width : this.list._width
			swipeActionPromise = swipeActionPromise
					.then(commit => commit !== false)
					.catch(e => {
						console.error("rejection in swipe action", e)
						return false
					})
			return Promise.all([
				// animate swipe action to full width
				ve.domElement &&
				animations.add(
						ve.domElement,
						transform(TransformEnum.TranslateX, this.xoffset, listTargetPosition).chain(TransformEnum.TranslateY, ve.top, ve.top),
						{
							easing: ease.inOut,
							duration: DefaultAnimationTime * 2,
						},
				),
				animations.add(
						this.list._domSwipeSpacerLeft,
						transform(TransformEnum.TranslateX, this.xoffset - this.list._width, listTargetPosition - this.list._width).chain(
								TransformEnum.TranslateY,
								ve.top,
								ve.top,
						),
						{
							easing: ease.inOut,
							duration: DefaultAnimationTime * 2,
						},
				),
				animations.add(
						this.list._domSwipeSpacerRight,
						transform(TransformEnum.TranslateX, this.xoffset + this.list._width, listTargetPosition + this.list._width).chain(
								TransformEnum.TranslateY,
								ve.top,
								ve.top,
						),
						{
							easing: ease.inOut,
							duration: DefaultAnimationTime * 2,
						},
				),
			])
					.then(() => (this.xoffset = listTargetPosition))
					.then(() => swipeActionPromise)
					.then(success => {
						if (success) {
							return this.list
									._deleteLoadedEntity(id)
									.then(() => {
										// fade out element
										this.xoffset = 0

										if (ve.domElement) {
											ve.domElement.style.transform = `translateX(${this.xoffset}px) translateY(${ve.top}px)`
										}

										return Promise.all([
											animations.add(this.list._domSwipeSpacerLeft, opacity(1, 0, true)),
											animations.add(this.list._domSwipeSpacerRight, opacity(1, 0, true)),
										])
									})
									.then(() => {
										// set swipe element to initial configuration
										this.list._domSwipeSpacerLeft.style.transform = `translateX(${this.xoffset - this.list._width}px) translateY(${ve.top}px)`
										this.list._domSwipeSpacerRight.style.transform = `translateX(${this.xoffset + this.list._width}px) translateY(${ve.top}px)`
										this.list._domSwipeSpacerRight.style.opacity = ""
										this.list._domSwipeSpacerLeft.style.opacity = ""
									})
						} else {
							return this.reset(delta)
						}
					})
					.finally(() => {
						this.virtualElement = null
					})
		} else {
			return Promise.resolve()
		}
	}

	getVirtualElement(): VirtualRow<T> {
		if (!this.virtualElement) {
			let touchAreaOffset = this.touchArea.getBoundingClientRect().top
			let relativeYposition = this.list.currentPosition + this.startPos.y - touchAreaOffset

			let targetElementPosition = Math.floor(relativeYposition / this.list._config.rowHeight) * this.list._config.rowHeight

			this.virtualElement = this.list._virtualList.find(ve => ve.top === targetElementPosition)
		}

		return assertNotNull(this.virtualElement)
	}

	updateWidth() {
		this.list._domSwipeSpacerLeft.style.width = px(this.list._width)
		this.list._domSwipeSpacerRight.style.width = px(this.list._width)
		this.list._domSwipeSpacerLeft.style.transform = `translateX(${-this.list._width}px) translateY(0px)`
		this.list._domSwipeSpacerRight.style.transform = `translateX(${this.list._width}px) translateY(0px)`

		this.list._virtualList.forEach(element => {
			element.domElement && applySafeAreaInsetMarginLR(element.domElement)
		})
	}

	reset(delta: { x: number; y: number }): Promise<any> {
		try {
			if (this.xoffset !== 0) {
				let ve = this.virtualElement

				if (ve && ve.domElement && ve.entity) {
					return Promise.all([
						animations.add(ve.domElement, transform(TransformEnum.TranslateX, this.xoffset, 0).chain(TransformEnum.TranslateY, ve.top, ve.top), {
							easing: ease.inOut,
						}),
						animations.add(
								this.list._domSwipeSpacerLeft,
								transform(TransformEnum.TranslateX, this.xoffset - this.list._width, -this.list._width).chain(
										TransformEnum.TranslateY,
										ve.top,
										ve.top,
								),
								{
									easing: ease.inOut,
								},
						),
						animations.add(
								this.list._domSwipeSpacerRight,
								transform(TransformEnum.TranslateX, this.xoffset + this.list._width, this.list._width).chain(
										TransformEnum.TranslateY,
										ve.top,
										ve.top,
								),
								{
									easing: ease.inOut,
								},
						),
					])
				}

				this.xoffset = 0
			}
		} finally {
			this.virtualElement = null
		}

		return Promise.resolve()
	}
}

export function listSelectionKeyboardShortcuts<T extends ListElement, R extends VirtualRow<T>>(list: MaybeLazy<List<T, R>>): Array<Shortcut> {
	return [
		{
			key: Keys.UP,
			exec: mapLazily(list, list => list.selectPrevious(false)),
			help: "selectPrevious_action",
		},
		{
			key: Keys.K,
			exec: mapLazily(list, list => list.selectPrevious(false)),
			help: "selectPrevious_action",
		},
		{
			key: Keys.UP,
			shift: true,
			exec: mapLazily(list, list => list.selectPrevious(true)),
			help: "addPrevious_action",
		},
		{
			key: Keys.K,
			shift: true,
			exec: mapLazily(list, list => list.selectPrevious(true)),
			help: "addPrevious_action",
		},
		{
			key: Keys.DOWN,
			exec: mapLazily(list, list => list.selectNext(false)),
			help: "selectNext_action",
		},
		{
			key: Keys.J,
			exec: mapLazily(list, list => list.selectNext(false)),
			help: "selectNext_action",
		},
		{
			key: Keys.DOWN,
			shift: true,
			exec: mapLazily(list, list => list.selectNext(true)),
			help: "addNext_action",
		},
		{
			key: Keys.J,
			shift: true,
			exec: mapLazily(list, list => list.selectNext(true)),
			help: "addNext_action",
		},
	]
}