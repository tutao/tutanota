import m, {Children, Component} from "mithril"
import {Cat, log} from "../../misc/Log"
import {px, size} from "../size"
import {client} from "../../misc/ClientDetector"
import {Keys, OperationType, TabIndex} from "../../api/common/TutanotaConstants"
import type {DeferredObject, MaybeLazy} from "@tutao/tutanota-utils"
import {addAll, arrayEquals, assertNotNull, debounceStart, defer, last, lastThrow, mapLazily, neverNull, ofClass, remove} from "@tutao/tutanota-utils"
import ColumnEmptyMessageBox from "./ColumnEmptyMessageBox"
import {progressIcon} from "./Icon"
import {animations, DefaultAnimationTime, opacity, transform, TransformEnum} from "../animation/Animations"
import {ease} from "../animation/Easing"
import {windowFacade} from "../../misc/WindowFacade"
import {BadRequestError, ConnectionError} from "../../api/common/error/RestError"
import {SwipeHandler} from "./SwipeHandler"
import {applySafeAreaInsetMarginLR} from "../HtmlUtils"
import {theme} from "../theme"
import type {Shortcut} from "../../misc/KeyManager"
import {isKeyPressed, keyManager} from "../../misc/KeyManager"
import type {ListElement} from "../../api/common/utils/EntityUtils"
import {firstBiggerThanSecond, GENERATED_MAX_ID, getElementId, getLetId} from "../../api/common/utils/EntityUtils"
import {assertMainOrNode} from "../../api/common/Env"
import {ButtonN, ButtonType} from "./ButtonN"
import {LoadingState, LoadingStateTracker} from "../../offline/LoadingState"
import {lang} from "../../misc/LanguageViewModel"
import {PosRect} from "./Dropdown"

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

export interface ListConfig<T, R extends VirtualRow<T>> {
	rowHeight: number

	/**
	 * Get the given number of entities starting after the given id. May return more elements than requested, e.g. if all elements are available on first fetch.
	 */
	fetch(startId: Id, count: number): Promise<Array<T>>

	/**
	 * Returns null if the given element could not be loaded
	 */
	loadSingle(elementId: Id): Promise<T | null>

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

interface DomStatus {
	bufferUp: HTMLElement | null
	bufferDown: HTMLElement | null
	speed: HTMLElement | null
	scrollDiff: HTMLElement | null
	timeDiff: HTMLElement | null
}

/**
 * A list that renders only a few dom elements (virtual list) to represent the items of even very large lists.
 *
 * Generics:
 * * T is the type of the entity
 * * R is the type of the Row
 */
export class List<T extends ListElement, R extends VirtualRow<T>> implements Component {
	ready: boolean = false

	loading: Promise<void> = Promise.resolve()
	currentPosition: number = 0
	lastPosition: number = 0
	lastUpdateTime!: number
	width = 0

	// if set, paint operations are executed later, when the scroll speed becomes slower
	updateLater: boolean = false

	repositionTimeout: TimeoutID | null // the id of the timeout to reposition if updateLater == true and scrolling stops abruptly (e.g. end of list or user touch)

	/** sorted with _config.sortCompare */
	readonly loadedEntities: T[] = []

	/**  // displays a part of the page, VirtualRows map 1:1 to DOM-Elements */
	virtualList: R[] = []

	private domListContainer!: HTMLElement
	private domList!: HTMLElement
	private domDeferred: DeferredObject<void> = defer<void>()
	private loadedCompletely = false

	private domStatus: DomStatus = {
		bufferUp: null,
		bufferDown: null,
		speed: null,
		scrollDiff: null,
		timeDiff: null,
	}

	private visibleElementsHeight: number = 0
	private bufferHeight: number
	private swipeHandler: ListSwipeHandler<T, R> | null = null
	domSwipeSpacerLeft!: HTMLElement
	domSwipeSpacerRight!: HTMLElement

	/** the selected entities must be sorted the same way the loaded entities are sorted */
	private selectedEntities: T[] = []

	private lastSelectedEntitiesForCallback: T[] = []

	/** true if the last key multi selection action was selecting the previous entity, false if it was selecting the next entity */
	private lastMultiSelectWasKeyUp = false

	private idOfEntityToSelectWhenReceived: Id | null = null
	private messageBoxDom: HTMLElement | null = null

	/** Can be activated by holding on element in a list. When active, elements can be selected just by tapping them */
	private mobileMultiSelectionActive: boolean = false

	private loadingState = new LoadingStateTracker()
	private loadingIndicatorDom = defer<HTMLElement>()
	private loadingIndicatorChildDom = defer<HTMLElement>()

	constructor(
		readonly config: ListConfig<T, R>
	) {
		this.bufferHeight = this.config.rowHeight * ScrollBuffer
		this.oncreate = this.oncreate.bind(this)
		this.onremove = this.onremove.bind(this)
		this.onbeforeupdate = this.onbeforeupdate.bind(this)
		this.view = this.view.bind(this)
		this.reset()
	}

	oncreate() {
		this.loadingState.setStateChangedListener(state => this.handleLoadingStateChanged(state))
		keyManager.registerShortcuts(listSelectionKeyboardShortcuts(this))
		windowFacade.addResizeListener(this.windowResizeListener)
	}

	onremove() {
		this.loadingState.clearStateChangedListener()
		keyManager.unregisterShortcuts(listSelectionKeyboardShortcuts(this))
		this.reset()
	}

	/**
	 *  We render the list once on the initial draw
	 *  So we only want view to be called when there is a state change
	 */
	onbeforeupdate() {
		return !this.ready
	}

	view(): Children {
		let list = m(".list-container.fill-absolute.scroll.list-bg.nofocus.overflow-x-hidden", {
			tabindex: TabIndex.Programmatic,
			oncreate: vnode => {
				this.domListContainer = vnode.dom as HTMLElement
				this.width = this.domListContainer.clientWidth

				this.createVirtualRows()

				// On mobile, we want to wait for the side menu animation to end before doing any heavy things to keep the animation smooth
				const execute = (callback: () => void) => client.isMobileDevice()
					? window.setTimeout(callback, DefaultAnimationTime)
					: window.requestAnimationFrame(callback)

				execute(() => {
					m.render(vnode.dom, this.renderList())
					this.domDeferred.resolve()
					this.init()
				})
			},
		})

		if (this.config.showStatus) {
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
								oncreate: vnode => (this.domStatus.bufferUp = vnode.dom as HTMLElement),
							}),
							m(".bufferDown", {
								oncreate: vnode => (this.domStatus.bufferDown = vnode.dom as HTMLElement),
							}),
						]),
						m("div", [
							m(".scrollDiff", {
								oncreate: vnode => (this.domStatus.scrollDiff = vnode.dom as HTMLElement),
							}),
						]),
						m("div", [
							m(".speed", {
								oncreate: vnode => (this.domStatus.speed = vnode.dom as HTMLElement),
							}),
							m(".time", {
								oncreate: vnode => (this.domStatus.timeDiff = vnode.dom as HTMLElement),
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

	private renderList(): Children {
		return [
			m(
				".swipe-spacer.flex.items-center.justify-end.pr-l.blue",
				{
					oncreate: vnode => (this.domSwipeSpacerLeft = vnode.dom as HTMLElement),
					tabindex: TabIndex.Programmatic,
					"aria-hidden": "true",
					style: {
						height: px(this.config.rowHeight),
						transform: `translateY(-${this.config.rowHeight}px)`,
						position: "absolute",
						"z-index": 1,
						width: px(this.width),
					},
				},
				this.config.swipe.renderLeftSpacer(),
			),
			m(
				".swipe-spacer.flex.items-center.pl-l.red",
				{
					oncreate: vnode => (this.domSwipeSpacerRight = vnode.dom as HTMLElement),
					tabindex: TabIndex.Programmatic,
					"aria-hidden": "true",
					style: {
						height: px(this.config.rowHeight),
						transform: `translateY(-${this.config.rowHeight}px)`,
						position: "absolute",
						"z-index": 1,
						width: px(this.width),
					},
				},
				this.config.swipe.renderRightSpacer(),
			),
			m(
				"ul.list.list-alternate-background.fill-absolute.click",
				{
					oncreate: vnode => this.setDomList(vnode.dom as HTMLElement),
					style: {
						height: this.calculateListHeight(),
					},
					className: this.config.className,
				},
				[
					this.virtualList.map(virtualRow => {
						return m(
							"li.list-row.pl.pr-l" + (this.config.dragStart ? '[draggable="true"]' : ""),
							{
								tabindex: TabIndex.Default,
								oncreate: vnode => this.initRow(virtualRow, vnode.dom as HTMLElement),
								style: {
									transform: `translateY(-${this.config.rowHeight}px)`,
									paddingTop: px(15),
									paddingBottom: px(15),
								},
								ondragstart: (event: DragEvent) => {
									if (this.config.dragStart) {
										this.config.dragStart(event, virtualRow, this.selectedEntities)
									}
								},
							},
							virtualRow.render(),
						)
					}),
					// odd-row is toggled manually on the dom element when the number of elements changes
					m("li.list-row.odd-row", {
							oncreate: vnode => {
								this.loadingIndicatorDom.resolve(vnode.dom as HTMLElement)
							},
							style: {
								bottom: 0,
								height: px(size.list_row_height),
								display: this.loadingState.isIdle() ? "none" : ""
							}
						}, m("",
							{
								oncreate: vnode => {
									this.loadingIndicatorChildDom.resolve(vnode.dom as HTMLElement)
								}
							},
							this.loadingState.isLoading()
								? this.renderLoadingIndicator()
								: this.loadingState.isConnectionLost()
									? this.renderConnectionLostIndicator()
									: null
						)
					)
				],
			), // We cannot render it conditionally because it's rendered once, we must manipulate DOM afterwards
			m(ColumnEmptyMessageBox, {
				message: () => this.config.emptyMessage,
				color: theme.list_message_bg,
				oncreate: vnode => {
					this.messageBoxDom = vnode.dom as HTMLElement

					this.updateMessageBoxVisibility()
				},
			}),
		]
	}

	private reset() {
		if (this.domListContainer) {
			this.domListContainer.removeEventListener("scroll", this.scrollListener)
		}

		this.domDeferred = defer()
		this.ready = false
		this.virtualList = []
		windowFacade.removeResizeListener(this.windowResizeListener)
	}

	private readonly windowResizeListener = () => {
		this.updateWidth()
	}

	private scrollListener = () => {
		this.currentPosition = this.domListContainer.scrollTop

		if (this.lastPosition !== this.currentPosition) {
			window.requestAnimationFrame(() => this.scroll())
		}
	}

	private updateWidth() {
		if (this.domListContainer && this.domSwipeSpacerLeft && this.domSwipeSpacerRight) {
			this.domSwipeSpacerLeft.style.opacity = "0"
			this.domSwipeSpacerRight.style.opacity = "0"
			setTimeout(() => {
				this.width = this.domListContainer.clientWidth

				if (this.swipeHandler) {
					this.swipeHandler.updateWidth()

					this.domSwipeSpacerLeft.style.opacity = "1"
					this.domSwipeSpacerRight.style.opacity = "1"
				}
			}, 60)
		}
	}

	clear() {
		this.loadedEntities.length = 0
		this.loadedCompletely = false

		if (this.domList) {
			this.domList.style.height = this.calculateListHeight()

			for (let row of this.virtualList) {
				if (row.domElement) {
					row.domElement.style.display = "none"
				}
			}
		}
	}

	private async handleLoadingStateChanged(newState: LoadingState): Promise<void> {

		const [loadingStateDom, loadingStateDomChild] = await Promise.all([this.loadingIndicatorDom.promise, this.loadingIndicatorChildDom.promise])


		switch (newState) {
			case LoadingState.Idle:
				loadingStateDom.style.display = "none"
				break
			case LoadingState.Loading:
				m.render(loadingStateDomChild, this.renderLoadingIndicator())
				loadingStateDom.style.display = ""
				break
			case LoadingState.ConnectionLost:
				m.render(loadingStateDomChild, this.renderConnectionLostIndicator())
				loadingStateDom.style.display = ""
				break
		}
	}

	private renderLoadingIndicator(): Children {
		return m(
			".flex-center.items-center",
			{
				style: {
					height: px(size.list_row_height),
					width: "100%",
					position: "absolute"
				}
			},
			progressIcon(),
		)
	}

	private renderConnectionLostIndicator(): Children {
		return m(".plr-l.flex-space-around.items-center",
			{
				style: {
					height: px(size.list_row_height),
					width: "100%",
					position: "absolute"
				}
			},
			[
				m("", lang.get("connectionLost_msg")),
				m(ButtonN, {
					label: "retry_action",
					type: ButtonType.Primary,
					click: () => this.retryLoading()
				})
			]
		)
	}

	private initRow(virtualRow: R, domElement: HTMLElement) {
		let touchStartTime: number | null = null
		virtualRow.domElement = domElement

		domElement.onclick = e => {
			if (!touchStartTime || Date.now() - touchStartTime < 400) {
				virtualRow.entity && this.elementClicked(virtualRow.entity, e)
			}
		}

		domElement.onkeyup = (e) => {
			if (isKeyPressed(e.keyCode, Keys.SPACE, Keys.RETURN)) {
				virtualRow.entity && this.elementClicked(virtualRow.entity, e)
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

			if (this.config.multiSelectionAllowed) {
				// Activate multi selection after pause
				timeoutId = setTimeout(() => {
					this.mobileMultiSelectionActive = true

					// check that virtualRow.entity exists because we had error feedbacks about it
					if (virtualRow.entity && !this.isEntitySelected(virtualRow.entity._id[1])) {
						this.selectedEntities.length = 0

						this.elementClicked(virtualRow.entity, e)
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
		return this.loadedEntities.find(entity => getLetId(entity)[1] === id) ?? null
	}

	/**
	 * Updates the given list of selected items with a click on the given clicked item. Takes ctrl and shift key events into consideration for multi selection.
	 * If ctrl is pressed the selection status of the clickedItem is toggled.
	 * If shift is pressed, all items beginning from the nearest selected item to the clicked item are additionally selected.
	 * If neither ctrl nor shift are pressed only the clicked item is selected.
	 */
	private elementClicked(clickedEntity: T, event: TouchEvent | MouseEvent | KeyboardEvent) {
		let selectionChanged = false
		let multiSelect = false

		if (this.config.multiSelectionAllowed && (this.mobileMultiSelectionActive || (client.isMacOS ? event.metaKey : event.ctrlKey))) {
			selectionChanged = true
			multiSelect = true

			if (this.selectedEntities.indexOf(clickedEntity) !== -1) {
				remove(this.selectedEntities, clickedEntity)
			} else {
				this.selectedEntities.push(clickedEntity)
			}
		} else if (this.config.multiSelectionAllowed && event.shiftKey) {
			multiSelect = true

			if (this.selectedEntities.length === 0) {
				// no item is selected, so treat it as if shift was not pressed
				this.selectedEntities.push(clickedEntity)

				selectionChanged = true
			} else if (this.selectedEntities.length === 1 && this.selectedEntities[0] === clickedEntity) {
				// nothing to do, the item is already selected
			} else {
				// select all items from the given item to the nearest already selected item
				let clickedItemIndex: number = this.loadedEntities.indexOf(clickedEntity)

				let nearestSelectedIndex: number | null = null

				for (let i = 0; i < this.selectedEntities.length; i++) {
					let currentSelectedItemIndex = this.loadedEntities.indexOf(this.selectedEntities[i])

					if (
						nearestSelectedIndex == null ||
						Math.abs(clickedItemIndex - currentSelectedItemIndex) < Math.abs(clickedItemIndex - nearestSelectedIndex)
					) {
						nearestSelectedIndex = currentSelectedItemIndex
					}
				}

				let itemsToAddToSelection: T[] = []

				if (neverNull(nearestSelectedIndex) < clickedItemIndex) {
					for (let i = neverNull(nearestSelectedIndex) + 1; i <= clickedItemIndex; i++) {
						itemsToAddToSelection.push(this.loadedEntities[i])
					}
				} else {
					for (let i = clickedItemIndex; i < neverNull(nearestSelectedIndex); i++) {
						itemsToAddToSelection.push(this.loadedEntities[i])
					}
				}

				addAll(this.selectedEntities, itemsToAddToSelection)
				selectionChanged = itemsToAddToSelection.length > 0
			}
		} else {
			if (!arrayEquals(this.selectedEntities, [clickedEntity])) {
				this.selectedEntities.splice(0, this.selectedEntities.length, clickedEntity)

				selectionChanged = true
			}
		}

		if (selectionChanged) {
			// the selected entities must be sorted the same way the loaded entities are sorted
			this.selectedEntities.sort(this.config.sortCompare)

			this.reposition()
		}

		if (this.selectedEntities.length === 0) {
			this.mobileMultiSelectionActive = false
		}

		this.elementSelected(this.getSelectedEntities(), true, multiSelect)
	}

	sort() {
		this.loadedEntities.sort(this.config.sortCompare)

		try {
			this.redraw()
		} catch (e) {
			// this may be called before "this" hasn't been fully initialized, in which case this.redraw() will throw
			// so just catch and do nothing
		}
	}

	private entitySelected(entity: T, addToSelection: boolean) {
		if (addToSelection) {
			if (this.selectedEntities.indexOf(entity) === -1) {
				this.selectedEntities.push(entity)

				// the selected entities must be sorted the same way the loaded entities are sorted
				this.selectedEntities.sort(this.config.sortCompare)

				this.reposition()

				this.elementSelected(this.getSelectedEntities(), false, true)
			}
		} else {
			let selectionChanged = this.selectedEntities.length !== 1 || this.selectedEntities[0] !== entity

			if (selectionChanged) {
				this.selectedEntities = [entity]

				this.reposition()
			}

			if (this.selectedEntities.length === 0) {
				this.mobileMultiSelectionActive = false
			}

			this.elementSelected(this.getSelectedEntities(), false, false)
		}
	}

	private elementSelected = debounceStart(200,
		(entities: T[], elementClicked: boolean, multiSelectOperation: boolean) => {
			const selectionChanged =
				this.lastSelectedEntitiesForCallback.length !== entities.length || this.lastSelectedEntitiesForCallback.some((el, i) => entities[i] !== el)

			this.config.elementSelected(entities, elementClicked, selectionChanged, multiSelectOperation)

			this.lastSelectedEntitiesForCallback = entities
		},
	)

	selectNext(shiftPressed: boolean) {
		if (!this.config.multiSelectionAllowed) {
			shiftPressed = false
		}

		if (shiftPressed && this.lastMultiSelectWasKeyUp === true && this.selectedEntities.length > 1) {
			// we have to remove the selection from the top
			this.selectedEntities.splice(0, 1)

			this.reposition()

			this.elementSelected(this.getSelectedEntities(), false, true)

			this.scrollToLoadedEntityAndSelect(this.selectedEntities[0], true)
		} else {
			this.lastMultiSelectWasKeyUp = false

			if (this.selectedEntities.length === 0 && this.loadedEntities.length > 0) {
				this.entitySelected(this.loadedEntities[0], shiftPressed)
			} else if (this.selectedEntities.length !== 0 && this.loadedEntities.length > 0) {
				let selectedIndex = this.loadedEntities.indexOf(lastThrow(this.selectedEntities))

				if (!shiftPressed && selectedIndex === this.loadedEntities.length - 1) {
					// select the last entity currently selected as multi selection. This is needed to avoid that elements can not be selected any more if all elements are multi selected
					selectedIndex--
				}

				if (selectedIndex !== this.loadedEntities.length - 1) {
					this.scrollToLoadedEntityAndSelect(this.loadedEntities[selectedIndex + 1], shiftPressed)
				}
			}
		}
	}

	selectPrevious(shiftPressed: boolean) {
		if (!this.config.multiSelectionAllowed) {
			shiftPressed = false
		}

		if (shiftPressed && this.lastMultiSelectWasKeyUp === false && this.selectedEntities.length > 1) {
			// we have to remove the selection from the bottom
			this.selectedEntities.splice(-1, 1)

			this.reposition()

			this.elementSelected(this.getSelectedEntities(), false, true)

			const lastEl = last(this.selectedEntities)
			lastEl && this.scrollToLoadedEntityAndSelect(lastEl, true)
		} else {
			this.lastMultiSelectWasKeyUp = true

			if (this.selectedEntities.length === 0 && this.loadedEntities.length > 0) {
				this.entitySelected(this.loadedEntities[0], shiftPressed)
			} else if (this.selectedEntities.length !== 0 && this.loadedEntities.length > 0) {
				let selectedIndex = this.loadedEntities.indexOf(this.selectedEntities[0])

				if (!shiftPressed && selectedIndex === 0) {
					// select the first entity currently selected as multi selection. This is needed to avoid that elements can not be selected any more if all elements are multi selected
					selectedIndex++
				}

				if (selectedIndex !== 0) {
					this.scrollToLoadedEntityAndSelect(this.loadedEntities[selectedIndex - 1], shiftPressed)
				}
			}
		}
	}

	selectNone() {
		this.mobileMultiSelectionActive = false

		if (this.selectedEntities.length > 0) {
			this.selectedEntities = []

			this.reposition()

			this.elementSelected([], false, false)
		}
	}

	isEntitySelected(id: Id): boolean {
		return this.selectedEntities.find(entity => getLetId(entity)[1] === id) != null
	}

	getSelectedEntities(): T[] {
		// return a copy to avoid outside modifications
		return this.selectedEntities.slice()
	}

	getSelectionBounds(): PosRect {
		const selected = this.getSelectedEntities()

		const rowBounds = this.virtualList
							  .filter(row => row.domElement != null && row.entity != null && selected.includes(row.entity))
							  .map(row => row.domElement!.getBoundingClientRect())

		const left = Math.min(...rowBounds.map(row => row.left))
		const right = Math.max(...rowBounds.map(row => row.right))
		const top = Math.min(...rowBounds.map(row => row.top))
		const bottom = Math.max(...rowBounds.map(row => row.bottom))

		return {
			left,
			right,
			top,
			bottom,
			height: bottom - top,
			width: right - left
		}
	}

	/**
	 * Must be called after creating the list. Loads an initial amount of elements into the list.
	 * @param listElementId If not null and existing, loads the list at least up to this element, scrolls to it and selects it.
	 */
	async loadInitial(listElementId?: Id): Promise<void> {
		if (listElementId) {
			const entity = await this.scrollToIdAndSelect(listElementId)
			if (entity != null) {
				return
			}
		}
		await this.loadMore()
		await this.domDeferred.promise
		this.domList.style.height = this.calculateListHeight()
	}

	private async loadMore(): Promise<void> {
		await this.loadingState.trackPromise(this.doLoadMore())
				  .catch(ofClass(ConnectionError, (e) => console.log("connection error in loadMore")))
				  .finally(() => m.redraw())
	}

	private async doLoadMore(): Promise<void> {
		let startId

		if (this.loadedEntities.length === 0) {
			startId = GENERATED_MAX_ID
		} else {
			startId = getLetId(this.loadedEntities[this.loadedEntities.length - 1])[1]
		}

		let count = PageSize

		this.loading = this.config
						   .fetch(startId, count)
						   .then(newItems => {
							   this.loadedEntities.push(...newItems)
							   this.loadedEntities.sort(this.config.sortCompare)
							   if (newItems.length < count) {
								   // ensure that all elements are added to the loaded entities before calling setLoadedCompletely
								   this.setLoadedCompletely()
							   }
						   })
						   .finally(() => {
							   if (this.ready) {
								   this.reposition()
							   }
						   })
		return this.loading
	}

	private calculateListHeight(): string {
		return this.config.rowHeight * (this.loadedEntities.length + (this.loadedCompletely ? 0 : 1)) + "px"
	}

	setLoadedCompletely() {
		this.loadedCompletely = true
		this.loadingState.setIdle()
		if (this.config.listLoadedCompletly) {
			this.config.listLoadedCompletly()
		}
	}

	displaySpinner() {
		this.loadingState.set(LoadingState.Loading)
	}

	init() {
		this.domListContainer.addEventListener(
			"scroll",
			this.scrollListener,
			client.passive()
				? {
					passive: true,
				}
				: false,
		)

		window.requestAnimationFrame(() => {
			this.domList.style.height = this.calculateListHeight()

			this.reposition()

			this.ready = true

			if (client.isTouchSupported() && this.config.swipe.enabled) {
				this.swipeHandler = new ListSwipeHandler(this.domListContainer, this)
			}
		})
	}

	setDomList(domElement: HTMLElement) {
		this.domList = domElement
	}

	createVirtualRows() {
		let visibleElements = 2 * Math.ceil(this.domListContainer.clientHeight / this.config.rowHeight / 2) // divide and multiply by two to get an even number (because of alternating row backgrounds)

		this.virtualList.length = visibleElements + ScrollBuffer * 2
		this.visibleElementsHeight = visibleElements * this.config.rowHeight

		for (let i = 0; i < this.virtualList.length; i++) {
			this.virtualList[i] = this.config.createVirtualRow()
			this.virtualList[i].top = i * this.config.rowHeight
		}
	}

	private scroll() {
		// make sure no scrolling is done if the virtualList was already cleared when unloading this list. on Safari this would lead to an error.
		if (this.virtualList.length === 0) return
		let up = this.currentPosition < this.lastPosition
		let scrollDiff = up ? this.lastPosition - this.currentPosition : this.currentPosition - this.lastPosition
		let now = window.performance.now()
		let timeDiff = Math.round(now - this.lastUpdateTime)
		this.lastUpdateTime = now
		let rowHeight = this.config.rowHeight
		let topElement = this.virtualList[0]
		let bottomElement = this.virtualList[this.virtualList.length - 1]

		this.loadMoreIfNecessary()

		let status = {
			bufferUp: Math.floor((this.currentPosition - topElement.top) / rowHeight),
			bufferDown: Math.floor((bottomElement.top + rowHeight - (this.currentPosition + this.visibleElementsHeight)) / rowHeight),
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
				this.currentPosition + this.visibleElementsHeight === this.loadedEntities.length * rowHeight
			) {
				// completely reposition the elements as scrolling becomes slower or the top / bottom of the list has been reached
				this.repositionTimeout && clearTimeout(this.repositionTimeout)

				this.reposition()
			}
		} else if (
			(status.bufferDown <= 5 && this.currentPosition + this.visibleElementsHeight < this.loadedEntities.length * rowHeight - 6 * rowHeight) ||
			(status.bufferUp <= 5 && this.currentPosition > 6 * rowHeight)
		) {
			if (client.isDesktopDevice()) {
				this.reposition()
			} else {
				log(Cat.debug, "list > update later (scrolling too fast)")
				// scrolling is too fast, the buffer will be eaten up: stop painting until scrolling becomes slower
				this.updateLater = true
				this.repositionTimeout = setTimeout(() => this.repositionAfterScrollStop(), 110)
			}
		} else if (!up) {
			while (
				topElement.top + rowHeight < this.currentPosition - this.bufferHeight &&
				this.virtualList[this.virtualList.length - 1].top < rowHeight * this.loadedEntities.length - rowHeight
				) {
				let nextPosition = this.virtualList[this.virtualList.length - 1].top + rowHeight

				if (nextPosition < this.currentPosition) {
					this.reposition()
				} else {
					topElement.top = nextPosition

					if (topElement.domElement) {
						topElement.domElement.style.transform = `translateY(${topElement.top}px)`
					}

					let pos = topElement.top / rowHeight
					let entity = this.loadedEntities[pos]

					this.updateVirtualRow(topElement, entity, (pos % 2) as any)

					this.virtualList.push(assertNotNull(this.virtualList.shift()))

					topElement = this.virtualList[0]
					bottomElement = topElement
				}
			}
		} else {
			while (bottomElement.top > this.currentPosition + this.visibleElementsHeight + this.bufferHeight && topElement.top > 0) {
				let nextPosition = this.virtualList[0].top - rowHeight

				if (nextPosition > this.currentPosition) {
					this.reposition()
				} else {
					bottomElement.top = nextPosition

					if (bottomElement.domElement) {
						bottomElement.domElement.style.transform = `translateY(${bottomElement.top}px)`
					}

					let pos = bottomElement.top / rowHeight
					let entity = this.loadedEntities[pos]

					this.updateVirtualRow(bottomElement, entity, (pos % 2) as any)

					this.virtualList.unshift(assertNotNull(this.virtualList.pop()))

					topElement = bottomElement
					bottomElement = this.virtualList[this.virtualList.length - 1]
				}
			}
		}
	}

	private loadMoreIfNecessary() {
		let lastBunchVisible = this.currentPosition > this.loadedEntities.length * this.config.rowHeight - this.visibleElementsHeight * 2

		if (lastBunchVisible &&
			!this.loadingState.isLoading() &&
			!this.loadedCompletely &&
			!this.loadingState.isConnectionLost()
		) {
			this.loadMore().then(() => {
				this.domList.style.height = this.calculateListHeight()
			})
		}
	}

	private async retryLoading() {
		if (this.loadingState.isConnectionLost()) {
			await this.loadMore()
			// We might need to remove extra space for the "retry" list item.
			this.domList.style.height = this.calculateListHeight()
		}
	}

	private repositionAfterScrollStop() {
		if (window.performance.now() - this.lastUpdateTime > 100) {
			window.requestAnimationFrame(() => this.reposition())
		} else {
			this.repositionTimeout = setTimeout(() => this.repositionAfterScrollStop(), 110)
		}
	}

	private updateMessageBoxVisibility() {
		if (this.messageBoxDom) {
			this.messageBoxDom.style.display = this.loadedEntities.length === 0 && this.loadedCompletely && this.config.emptyMessage !== "" ? "" : "none"
		}
	}

	private reposition() {
		this.updateMessageBoxVisibility()

		this.currentPosition = this.domListContainer.scrollTop
		let rowHeight = this.config.rowHeight
		let maxStartPosition = rowHeight * this.loadedEntities.length - this.bufferHeight * 2 - this.visibleElementsHeight
		let nextPosition = this.currentPosition - (this.currentPosition % rowHeight) - this.bufferHeight

		if (nextPosition < 0) {
			nextPosition = 0
		} else if (nextPosition > maxStartPosition) {
			nextPosition = maxStartPosition
		}

		for (let row of this.virtualList) {
			row.top = nextPosition
			nextPosition = nextPosition + rowHeight

			if (!row.domElement) {
				// This might happen during the window resize when things change too fast, just try again next time
				console.log(`undefined dom element for virtual dom element ${this.virtualList.length}, ${row.top}`)
				return
			}

			row.domElement.style.transform = "translateY(" + row.top + "px)"
			let pos = row.top / rowHeight
			let entity = this.loadedEntities[pos]

			this.updateVirtualRow(row, entity, (pos % 2) as any)
		}

		this.loadingIndicatorDom.promise.then(dom => {
			if (this.loadedEntities.length % 2 === 0) {
				dom.classList.add("odd-row")
			} else {
				dom.classList.add("odd-row")
			}
		})

		log(Cat.debug, "repositioned list")
		this.updateLater = false
	}

	redraw(): void {
		this.reposition()
	}

	private updateVirtualRow(row: VirtualRow<T>, entity: T | null, odd: boolean) {
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

	private updateStatus(status: {bufferUp: number; bufferDown: number; speed: number; scrollDiff: number; timeDiff: number}) {
		if (this.domStatus.bufferUp) this.domStatus.bufferUp.textContent = status.bufferUp + ""
		if (this.domStatus.bufferDown) this.domStatus.bufferDown.textContent = status.bufferDown + ""
		if (this.domStatus.speed) this.domStatus.speed.textContent = status.speed + ""
		if (this.domStatus.scrollDiff) this.domStatus.scrollDiff.textContent = status.scrollDiff + ""
		if (this.domStatus.timeDiff) this.domStatus.timeDiff.textContent = status.timeDiff + ""
	}

	/**
	 * Selects the element with the given id and scrolls to it so it becomes visible.
	 * Immediately selects the element if it is already existing in the list, otherwise waits until it is received via websocket, then selects it.
	 */
	scrollToIdAndSelectWhenReceived(listElementId: Id): void {
		let entity = this.getEntity(listElementId)

		if (entity) {
			this.scrollToLoadedEntityAndSelect(entity, false)
		} else {
			this.idOfEntityToSelectWhenReceived = listElementId
		}
	}

	/**
	 * Selects the element with the given id and scrolls to it so it becomes visible. Loads the list until the given element is reached.
	 * @return The entity or null if the entity is not in this list.
	 */
	async scrollToIdAndSelect(listElementId: Id): Promise<T | null> {
		let entity = this.getEntity(listElementId)

		if (entity) {
			this.scrollToLoadedEntityAndSelect(entity, false)

			return Promise.resolve(entity)
		} else {
			try {
				// first check if the element can be loaded
				const entity = await this.config.loadSingle(listElementId)
				if (!entity) {
					return null
				}
				const scrollTarget = await this.loadUntil(listElementId)
				await this.domDeferred.promise
				this.domList.style.height = this.calculateListHeight()

				if (scrollTarget != null) {
					this.scrollToLoadedEntityAndSelect(scrollTarget, false)
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

	private scrollToLoadedEntityAndSelect(scrollTarget: T, addToSelection: boolean) {
		// check if the element is visible already. only scroll if it is not visible
		for (let i = 0; i < this.virtualList.length; i++) {
			if (this.virtualList[i].entity === scrollTarget) {
				if (
					this.virtualList[i].top - this.currentPosition > 0 &&
					this.virtualList[i].top - this.currentPosition < this.visibleElementsHeight - this.config.rowHeight
				) {
					this.entitySelected(scrollTarget, addToSelection)

					// we do not need to scroll
					return
				}

				break
			}
		}

		this.domDeferred.promise.then(() => {
			this.domListContainer.scrollTop = this.loadedEntities.indexOf(scrollTarget) * this.config.rowHeight

			this.entitySelected(scrollTarget, addToSelection)
		})
	}

	private async loadUntil(listElementId: Id): Promise<T | null> {
		let scrollTarget = this.loadedEntities.find(e => getLetId(e)[1] === listElementId)

		// also stop loading if the list element id is bigger than the loaded ones
		if (
			scrollTarget != null ||
			this.loadedCompletely ||
			(this.loadedEntities.length > 0 && firstBiggerThanSecond(listElementId, getLetId(this.loadedEntities[this.loadedEntities.length - 1])[1]))
		) {
			return Promise.resolve(scrollTarget ?? null)
		} else {
			return this.loadingState.trackPromise(
				this.doLoadMore().then(() => this.loadUntil(listElementId))
			).catch(ofClass(ConnectionError, () => null)).finally(() => m.redraw())
		}
	}

	entityEventReceived(elementId: Id, operation: OperationType): Promise<void> {
		if (operation === OperationType.CREATE || operation === OperationType.UPDATE) {
			// load the element without range checks for now
			return this.config.loadSingle(elementId).then(entity => {
				if (!entity) {
					return
				}

				let newEntity: T = neverNull(entity)
				// wait for any pending loading
				return resolvedThen(this.loading, () => {
					if (operation === OperationType.CREATE) {
						if (this.loadedCompletely) {
							this.addToLoadedEntities(newEntity)
						} else if (this.loadedEntities.length > 0 && this.config.sortCompare(newEntity, neverNull(last(this.loadedEntities))) < 0) {
							// new element is in the loaded range or newer than the first element
							this.addToLoadedEntities(newEntity)
						}
					} else if (operation === OperationType.UPDATE) {
						this.updateLoadedEntity(newEntity)
					}
				})
			})
		} else if (operation === OperationType.DELETE) {
			let swipeAnimation = this.swipeHandler ? this.swipeHandler.animating : Promise.resolve()
			return swipeAnimation.then(() => this.deleteLoadedEntity(elementId))
		} else {
			return Promise.resolve()
		}
	}

	private addToLoadedEntities(entity: T) {
		for (let i = 0; i < this.loadedEntities.length; i++) {
			if (getLetId(entity)[1] === getLetId(this.loadedEntities[i])[1]) {
				return
			}
		}

		this.loadedEntities.push(entity)

		this.loadedEntities.sort(this.config.sortCompare)

		if (this.ready) {
			this.domList.style.height = this.calculateListHeight()

			this.reposition()
		}

		if (this.idOfEntityToSelectWhenReceived && this.idOfEntityToSelectWhenReceived === getLetId(entity)[1]) {
			this.idOfEntityToSelectWhenReceived = null

			this.scrollToLoadedEntityAndSelect(entity, false)
		}
	}

	private updateLoadedEntity(entity: T) {
		for (let positionToUpdate = 0; positionToUpdate < this.loadedEntities.length; positionToUpdate++) {
			if (getLetId(entity)[1] === getLetId(this.loadedEntities[positionToUpdate])[1]) {
				this.loadedEntities.splice(positionToUpdate, 1, entity as any)

				this.loadedEntities.sort(this.config.sortCompare)

				if (this.ready) {
					this.reposition()
				}

				break
			}
		}

		for (let i = 0; i < this.selectedEntities.length; i++) {
			if (getLetId(entity)[1] === getLetId(this.selectedEntities[i])[1]) {
				this.selectedEntities[i] = entity
				break
			}
		}
	}

	deleteLoadedEntity(elementId: Id): Promise<void> {
		// wait for any pending loading
		return resolvedThen(this.loading, () => {
			let entity = this.loadedEntities.find(e => {
				return getLetId(e)[1] === elementId
			})

			if (entity) {
				let nextElementSelected = false

				if (this.selectedEntities.length === 1 && this.selectedEntities[0] === entity && this.loadedEntities.length > 1) {
					let nextSelection =
						entity === last(this.loadedEntities)
							? this.loadedEntities[this.loadedEntities.length - 2]
							: this.loadedEntities[this.loadedEntities.indexOf(entity) + 1]

					this.selectedEntities.push(nextSelection)

					nextElementSelected = true
				}

				remove(this.loadedEntities, entity)
				let selectionChanged = remove(this.selectedEntities, entity)

				if (this.ready) {
					this.domList.style.height = this.calculateListHeight()

					this.reposition()
				}

				if (selectionChanged) {
					this.elementSelected(this.getSelectedEntities(), false, !nextElementSelected)
				}

				// trigger loading new elements before the scrollbar disappears and no reload can be triggered any more by scrolling
				this.loadMoreIfNecessary()
			}
		})
	}

	isMobileMultiSelectionActionActive(): boolean {
		return this.mobileMultiSelectionActive
	}

	getLoadedEntities(): T[] {
		return this.loadedEntities
	}
}

export const ACTION_DISTANCE = 150

function resolvedThen<T, R>(promise: Promise<T>, handler: () => R): Promise<R> {
	return promise.then(handler, handler)
}

class ListSwipeHandler<T extends ListElement, R extends VirtualRow<T>> extends SwipeHandler {
	virtualElement: VirtualRow<T> | null = null
	list: List<T, R>
	xoffset!: number

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
				this.list.domSwipeSpacerLeft.style.transform = `translateX(${this.xoffset - this.list.width}px) translateY(${ve.top}px)`
				this.list.domSwipeSpacerRight.style.transform = `
				translateX(${this.xoffset + this.list.width}px) translateY(${ve.top}px)`
			}
		})
	}

	onHorizontalGestureCompleted(delta: {x: number; y: number}): Promise<void> {
		if (this.virtualElement && this.virtualElement.entity && Math.abs(delta.x) > ACTION_DISTANCE) {
			// Gesture is completed
			let entity = this.virtualElement.entity
			let swipePromise

			if (delta.x < 0) {
				swipePromise = this.list.config.swipe.swipeLeft(entity)
			} else {
				swipePromise = this.list.config.swipe.swipeRight(entity)
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
			let listTargetPosition = this.xoffset < 0 ? -this.list.width : this.list.width
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
					this.list.domSwipeSpacerLeft,
					transform(TransformEnum.TranslateX, this.xoffset - this.list.width, listTargetPosition - this.list.width).chain(
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
					this.list.domSwipeSpacerRight,
					transform(TransformEnum.TranslateX, this.xoffset + this.list.width, listTargetPosition + this.list.width).chain(
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
											 .deleteLoadedEntity(id)
											 .then(() => {
												 // fade out element
												 this.xoffset = 0

												 if (ve.domElement) {
													 ve.domElement.style.transform = `translateX(${this.xoffset}px) translateY(${ve.top}px)`
												 }

												 return Promise.all([
													 animations.add(this.list.domSwipeSpacerLeft, opacity(1, 0, true)),
													 animations.add(this.list.domSwipeSpacerRight, opacity(1, 0, true)),
												 ])
											 })
											 .then(() => {
												 // set swipe element to initial configuration
												 this.list.domSwipeSpacerLeft.style.transform = `translateX(${this.xoffset - this.list.width}px) translateY(${ve.top}px)`
												 this.list.domSwipeSpacerRight.style.transform = `translateX(${this.xoffset + this.list.width}px) translateY(${ve.top}px)`
												 this.list.domSwipeSpacerRight.style.opacity = ""
												 this.list.domSwipeSpacerLeft.style.opacity = ""
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

			let targetElementPosition = Math.floor(relativeYposition / this.list.config.rowHeight) * this.list.config.rowHeight

			this.virtualElement = this.list.virtualList.find(ve => ve.top === targetElementPosition) ?? null
		}

		return assertNotNull(this.virtualElement)
	}

	updateWidth() {
		this.list.domSwipeSpacerLeft.style.width = px(this.list.width)
		this.list.domSwipeSpacerRight.style.width = px(this.list.width)
		this.list.domSwipeSpacerLeft.style.transform = `translateX(${-this.list.width}px) translateY(0px)`
		this.list.domSwipeSpacerRight.style.transform = `translateX(${this.list.width}px) translateY(0px)`

		this.list.virtualList.forEach(element => {
			element.domElement && applySafeAreaInsetMarginLR(element.domElement)
		})
	}

	reset(delta: {x: number; y: number}): Promise<any> {
		try {
			if (this.xoffset !== 0) {
				let ve = this.virtualElement

				if (ve && ve.domElement && ve.entity) {
					return Promise.all([
						animations.add(ve.domElement, transform(TransformEnum.TranslateX, this.xoffset, 0).chain(TransformEnum.TranslateY, ve.top, ve.top), {
							easing: ease.inOut,
						}),
						animations.add(
							this.list.domSwipeSpacerLeft,
							transform(TransformEnum.TranslateX, this.xoffset - this.list.width, -this.list.width).chain(
								TransformEnum.TranslateY,
								ve.top,
								ve.top,
							),
							{
								easing: ease.inOut,
							},
						),
						animations.add(
							this.list.domSwipeSpacerRight,
							transform(TransformEnum.TranslateX, this.xoffset + this.list.width, this.list.width).chain(
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