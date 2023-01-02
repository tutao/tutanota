import m, { Children, Component } from "mithril"
import { ColumnType, ViewColumn } from "../base/ViewColumn.js"
import type { windowSizeListener } from "../../misc/WindowFacade.js"
import { windowFacade } from "../../misc/WindowFacade.js"
import { size } from "../size.js"
import { alpha, AlphaEnum, animations, transform, TransformEnum } from "../animation/Animations.js"
import { ease } from "../animation/Easing.js"
import { theme } from "../theme.js"
import { neverNull } from "@tutao/tutanota-utils"
import { styles } from "../styles.js"
import { AriaLandmarks } from "../AriaUtils.js"
import { LayerType } from "../../RootView.js"
import { assertMainOrNode } from "../../api/common/Env.js"

assertMainOrNode()
export type GestureInfo = {
	x: number
	y: number
	time: number
	identifier: number
}
export const gestureInfoFromTouch = (touch: Touch): GestureInfo => ({
	x: touch.pageX,
	y: touch.pageY,
	time: performance.now(),
	identifier: touch.identifier,
})

interface ViewSliderAttrs {
	header: Children
	bottomNav: Children
}

/**
 * Represents a view with multiple view columns. Depending on the screen width and the view columns configurations,
 * the actual widths and positions of the view columns is calculated. This allows a consistent layout for any browser
 * resolution on any type of device.
 */
export class ViewSlider implements Component<ViewSliderAttrs> {
	columns: ViewColumn[]
	private _mainColumn: ViewColumn
	focusedColumn: ViewColumn
	private _visibleBackgroundColumns: ViewColumn[]
	private _domSlidingPart!: HTMLElement
	view: Component<ViewSliderAttrs>["view"]
	private _busy: Promise<unknown>
	private _parentName: string
	private _isModalBackgroundVisible: boolean
	private readonly resizeListener: windowSizeListener = () => this._updateVisibleBackgroundColumns()
	private readonly handleHistoryEvent = () => {
		const prev = this.getPreviousColumn()
		if (prev != null && prev.columnType !== ColumnType.Foreground) {
			this.focusPreviousColumn()
			return false
		} else if (this.isForegroundColumnFocused()) {
			this.focusNextColumn()
			return false
		}
		return true
	}

	/** Creates the event listeners as soon as this component is loaded (invoked by mithril)*/
	oncreate: () => void = () => {
		this._updateVisibleBackgroundColumns()

		windowFacade.addResizeListener(this.resizeListener)
		windowFacade.addHistoryEventListener(this.handleHistoryEvent)
	}

	/** Removes the registered event listeners as soon as this component is unloaded (invoked by mithril)*/
	onremove: () => void = () => {
		windowFacade.removeResizeListener(this.resizeListener)
		windowFacade.removeHistoryEventListener(this.handleHistoryEvent)
	}
	_getSideColDom: () => HTMLElement | null = () => this.columns[0]._domColumn

	constructor(viewColumns: ViewColumn[], parentName: string) {
		this.columns = viewColumns
		this._mainColumn = neverNull(viewColumns.find((column) => column.columnType === ColumnType.Background)) // the first background column is the main column

		this.focusedColumn = this._mainColumn
		this._visibleBackgroundColumns = []

		this._updateVisibleBackgroundColumns()

		this._busy = Promise.resolve()
		this._parentName = parentName
		this._isModalBackgroundVisible = false
		this.columns.forEach((column) => column.setRole(this._getColumnRole(column)))

		this.view = ({ attrs }): Children => {
			const mainSliderColumns = this._getColumnsForMainSlider()

			const allBackgroundColumnsAreVisible = this._visibleBackgroundColumns.length === mainSliderColumns.length
			return m(
				".fill-absolute.flex.col",
				{
					oncreate: (vnode) => {
						this._attachTouchHandler(vnode.dom as HTMLElement)
					},
					onremove: () => {
						if (this.columns[0].columnType === ColumnType.Foreground && this.columns[0].isInForeground) {
							this.columns[0].isInForeground = false
							this._isModalBackgroundVisible = false
						}
					},
				},
				[
					attrs.header,
					m(
						".view-columns.flex-grow.rel",
						{
							oncreate: (vnode) => {
								this._domSlidingPart = vnode.dom as HTMLElement
							},
							style: {
								width: this.getWidth() + "px",
								transform: "translateX(" + this.getOffset(this._visibleBackgroundColumns[0]) + "px)",
							},
						},
						mainSliderColumns.map((column, index) =>
							m(column, {
								// Only apply right border if 1. all background columns are visible. 2. It's not the last column.
								// Perhaps the condition should be "there's another visible column after this one" but it works like this too
								rightBorder: allBackgroundColumnsAreVisible && index !== mainSliderColumns.length - 1,
							}),
						),
					),
					styles.isUsingBottomNavigation() ? attrs.bottomNav : null,
					this._getColumnsForOverlay().map((c) => m(c, {})),
					this._createModalBackground(),
				],
			)
		}
	}

	_getColumnRole(column: ViewColumn): AriaLandmarks | null {
		// role  for foreground column is handled inside FolderColumnView
		if (column.columnType === ColumnType.Foreground) {
			return null
		}

		return this._mainColumn === column ? AriaLandmarks.Main : AriaLandmarks.Region
	}

	getMainColumn(): ViewColumn {
		return this._mainColumn
	}

	_getColumnsForMainSlider(): Array<ViewColumn> {
		return this.columns.filter((c) => c.columnType === ColumnType.Background || c.visible)
	}

	_getColumnsForOverlay(): Array<ViewColumn> {
		return this.columns.filter((c) => c.columnType === ColumnType.Foreground && !c.visible)
	}

	_createModalBackground(): Children {
		if (this._isModalBackgroundVisible) {
			return [
				m(".fill-absolute.will-change-alpha", {
					style: {
						zIndex: LayerType.ForegroundMenu,
					},
					oncreate: (vnode) => {
						this._busy.then(() => animations.add(vnode.dom as HTMLElement, alpha(AlphaEnum.BackgroundColor, theme.modal_bg, 0, 0.5)))
					},
					onbeforeremove: (vnode) => {
						return this._busy.then(() => animations.add(vnode.dom as HTMLElement, alpha(AlphaEnum.BackgroundColor, theme.modal_bg, 0.5, 0)))
					},
					onclick: () => {
						this.focus(this._visibleBackgroundColumns[0])
					},
				}),
			]
		} else {
			return []
		}
	}

	_updateVisibleBackgroundColumns() {
		this.focusedColumn = this.focusedColumn || this._mainColumn
		let visibleColumns: ViewColumn[] = [this.focusedColumn.columnType === ColumnType.Background ? this.focusedColumn : this._mainColumn]
		let remainingSpace = window.innerWidth - visibleColumns[0].minWidth
		let nextVisibleColumn = this.getNextVisibleColumn(visibleColumns, this.columns)

		while (nextVisibleColumn && remainingSpace >= nextVisibleColumn.minWidth) {
			visibleColumns.push(nextVisibleColumn)
			remainingSpace -= nextVisibleColumn.minWidth
			nextVisibleColumn = this.getNextVisibleColumn(visibleColumns, this.columns)
		}

		// visible columns must be sort by the initial column order
		visibleColumns.sort((a, b) => this.columns.indexOf(a) - this.columns.indexOf(b))

		this._distributeRemainingSpace(visibleColumns, remainingSpace)

		this._setWidthForHiddenColumns(visibleColumns)

		this.columns.forEach((column) => (column.visible = visibleColumns.includes(column)))
		this.updateOffsets()
		this._visibleBackgroundColumns = visibleColumns

		if (this.allColumnsVisible()) {
			this.focusedColumn.isInForeground = false
			this._isModalBackgroundVisible = false

			if (this.columns[0]._domColumn) {
				this.columns[0]._domColumn.style.transform = ""
			}
		}

		window.requestAnimationFrame(() => m.redraw())
	}

	getVisibleBackgroundColumns(): ViewColumn[] {
		return this._visibleBackgroundColumns.slice()
	}

	isUsingOverlayColumns(): boolean {
		return this.columns.every((c) => c.columnType !== ColumnType.Foreground || c.visible)
	}

	/**
	 * Returns the next column which should become visible
	 * @param visibleColumns All columns that will definitely be visible
	 * @param allColumns All columns*
	 */
	getNextVisibleColumn(visibleColumns: ViewColumn[], allColumns: ViewColumn[]): ViewColumn | null {
		// First: try to find a background column which is not visible
		let nextColumn = allColumns.find((column) => {
			return column.columnType === ColumnType.Background && visibleColumns.indexOf(column) < 0
		})

		if (!nextColumn) {
			// Second: if no more background columns are available add the foreground column to the visible columns
			nextColumn = allColumns.find((column) => {
				return column.columnType === ColumnType.Foreground && visibleColumns.indexOf(column) < 0
			})
		}

		return nextColumn ?? null
	}

	getBackgroundColumns(): ViewColumn[] {
		return this.columns.filter((c) => c.columnType === ColumnType.Background)
	}

	/**
	 * distributes the remaining space to all visible columns
	 * @param visibleColumns
	 * @param remainingSpace
	 */
	_distributeRemainingSpace(visibleColumns: ViewColumn[], remainingSpace: number) {
		let spacePerColumn = remainingSpace / visibleColumns.length
		visibleColumns.forEach((visibleColumn: ViewColumn, index) => {
			if (visibleColumns.length - 1 === index) {
				// ignore max width for the last visible column
				visibleColumn.setWidth(visibleColumn.minWidth + remainingSpace)
			} else {
				let spaceForThisColumn = Math.min(spacePerColumn, visibleColumn.maxWidth - visibleColumn.minWidth)
				remainingSpace -= spaceForThisColumn
				visibleColumn.setWidth(visibleColumn.minWidth + spaceForThisColumn)
			}
		})
	}

	_setWidthForHiddenColumns(visibleColumns: ViewColumn[]) {
		// if all columns are visible there is no need to set the width
		if (this.columns.length === visibleColumns.length) {
			return
		}

		// if only one column is visible set the same width for all columns ignoring max width
		if (visibleColumns.length === 1) {
			this.columns.forEach((column) => column.setWidth(visibleColumns[0].width))
		}

		// Reduce the width of the foreground button to keep always a small part of the background button visible.
		let foreGroundColumn = this.columns.find((column) => column.columnType === ColumnType.Foreground)

		if (foreGroundColumn) {
			let remainingSpace = window.innerWidth - foreGroundColumn.minWidth - size.hpad_large
			let additionalSpaceForColumn = Math.min(remainingSpace, foreGroundColumn.maxWidth - foreGroundColumn.minWidth)
			foreGroundColumn.setWidth(foreGroundColumn.minWidth + additionalSpaceForColumn)
		}
	}

	focus(viewColumn: ViewColumn): Promise<unknown> {
		return this._busy
			.then(() => {
				// hide the foreground column if the column is in foreground
				if (this.focusedColumn.isInForeground) {
					this._busy = this._slideForegroundColumn(this.focusedColumn, false)
					return this._busy
				}
			})
			.then(() => {
				this.focusedColumn = viewColumn

				if (
					viewColumn.columnType === ColumnType.Background &&
					this._visibleBackgroundColumns.length === 1 &&
					this._visibleBackgroundColumns.indexOf(viewColumn) < 0
				) {
					const currentOffset = this._domSlidingPart.getBoundingClientRect().left

					this._busy = this._slideBackgroundColumns(viewColumn, currentOffset, this.getOffset(viewColumn))
				} else if (viewColumn.columnType === ColumnType.Foreground && this._visibleBackgroundColumns.indexOf(viewColumn) < 0) {
					this._busy = this._slideForegroundColumn(viewColumn, true)
				}

				return this._busy
			})
			.finally(() => {
				m.redraw()
				viewColumn.focus()
			}) // for updating header bar after animation
	}

	/**
	 * Executes a slide animation for the background buttons.
	 */
	_slideBackgroundColumns(nextVisibleViewColumn: ViewColumn, oldOffset: number, newOffset: number): Promise<unknown> {
		return animations
			.add(this._domSlidingPart, transform(TransformEnum.TranslateX, oldOffset, newOffset), {
				easing: ease.inOut,
			})
			.finally(() => {
				// replace the visible column
				const [removed] = this._visibleBackgroundColumns.splice(0, 1, nextVisibleViewColumn)

				removed.visible = false
				nextVisibleViewColumn.visible = true
			})
	}

	/**
	 * Executes a slide animation for the foreground button.
	 */
	_slideForegroundColumn(foregroundColumn: ViewColumn, toForeground: boolean): Promise<unknown> {
		if (!foregroundColumn._domColumn) return Promise.resolve()

		const colRect = foregroundColumn._domColumn.getBoundingClientRect()

		const oldOffset = colRect.left
		let newOffset = foregroundColumn.getOffsetForeground(toForeground)
		this._isModalBackgroundVisible = toForeground
		return animations
			.add(neverNull(foregroundColumn._domColumn), transform(TransformEnum.TranslateX, oldOffset, newOffset), {
				easing: ease.in,
			})
			.finally(() => {
				foregroundColumn.isInForeground = toForeground
			})
	}

	updateOffsets() {
		let offset = 0

		for (let column of this.columns) {
			if (column.columnType === ColumnType.Background || column.visible) {
				column.offset = offset
				offset += column.width
			}
		}
	}

	getWidth(): number {
		let lastColumn = this.columns[this.columns.length - 1]
		return lastColumn.offset + lastColumn.width
	}

	getOffset(column: ViewColumn): number {
		return 0 - column.offset
	}

	isFocusPreviousPossible(): boolean {
		return this.getPreviousColumn() != null
	}

	focusPreviousColumn() {
		if (this.isFocusPreviousPossible()) {
			this.focus(neverNull(this.getPreviousColumn()))
		}
	}

	focusNextColumn() {
		const indexOfCurrent = this.columns.indexOf(this.focusedColumn)

		if (indexOfCurrent + 1 < this.columns.length) {
			this.focus(this.columns[indexOfCurrent + 1])
		}
	}

	getPreviousColumn(): ViewColumn | null {
		if (this.columns.indexOf(this._visibleBackgroundColumns[0]) > 0 && !this.focusedColumn.isInForeground) {
			let visibleColumnIndex = this.columns.indexOf(this._visibleBackgroundColumns[0])
			return this.columns[visibleColumnIndex - 1]
		}

		return null
	}

	isFirstBackgroundColumnFocused(): boolean {
		return this.columns.filter((column) => column.columnType === ColumnType.Background).indexOf(this.focusedColumn) === 0
	}

	isForegroundColumnFocused(): boolean {
		return this.focusedColumn && this.focusedColumn.columnType === ColumnType.Foreground
	}

	allColumnsVisible(): boolean {
		return this._visibleBackgroundColumns.length === this.columns.length
	}

	_attachTouchHandler(element: HTMLElement) {
		let lastGestureInfo: GestureInfo | null
		let oldGestureInfo: GestureInfo | null
		let initialGestureInfo: GestureInfo | null
		const VERTICAL = 1
		const HORIZONTAL = 2
		let directionLock: 0 | 1 | 2 = 0

		const gestureEnd = (event: any) => {
			const safeLastGestureInfo = lastGestureInfo
			const safeOldGestureInfo = oldGestureInfo

			if (safeLastGestureInfo && safeOldGestureInfo && !this.allColumnsVisible()) {
				const touch = event.changedTouches[0]
				const mainCol = this._mainColumn._domColumn

				const sideCol = this._getSideColDom()

				if (!mainCol || !sideCol) {
					return
				}

				const mainColRect = mainCol.getBoundingClientRect()
				const velocity = (safeLastGestureInfo.x - safeOldGestureInfo.x) / (safeLastGestureInfo.time - safeOldGestureInfo.time)

				const show = () => {
					this.focusedColumn = this.columns[0]
					this._busy = this._slideForegroundColumn(this.columns[0], true)
					this._isModalBackgroundVisible = true
				}

				const hide = () => {
					this.focusedColumn = this.columns[1]
					this._busy = this._slideForegroundColumn(this.columns[0], false)
					this._isModalBackgroundVisible = false
				}

				// Gesture for the side column
				if (this.getBackgroundColumns()[0].visible || this.focusedColumn.isInForeground) {
					// Gesture was with enough velocity to show the menu
					if (velocity > 0.8) {
						show() // Gesture was with enough velocity to hide the menu and we're not scrolling vertically
					} else if (velocity < -0.8 && directionLock !== VERTICAL) {
						hide()
					} else {
						// Finger was released without much velocity so if it's further than some distance from edge, open menu. Otherwise, close it.
						if (touch.pageX > mainColRect.left + 100) {
							show()
						} else if (directionLock !== VERTICAL) {
							hide()
						}
					}
				} else {
					// Gesture for sliding other columns
					if ((safeLastGestureInfo.x > window.innerWidth / 3 || velocity > 0.8) && directionLock !== VERTICAL) {
						this.focusPreviousColumn()
					} else {
						const colRect = this._domSlidingPart.getBoundingClientRect()

						// Re-focus the column to reset offset changed by the gesture
						this._busy = this._slideBackgroundColumns(this.focusedColumn, colRect.left, -this.focusedColumn.offset)
						this.focus(this.focusedColumn)
					}
				}

				this._busy.then(() => m.redraw())
			}

			// If this is the first touch and not another one
			if (safeLastGestureInfo && safeLastGestureInfo.identifier === event.changedTouches[0].identifier) {
				lastGestureInfo = null
				oldGestureInfo = null
				initialGestureInfo = null
				directionLock = 0
			}
		}

		const listeners = {
			touchstart: (event: any) => {
				if (lastGestureInfo) {
					// Already detecting a gesture, ignore second one
					return
				}

				const mainCol = this._mainColumn._domColumn

				const sideCol = this._getSideColDom()

				if (!mainCol || !sideCol || this.allColumnsVisible()) {
					lastGestureInfo = null
					return
				}

				if (event.touches.length === 1 && (this.columns[0].isInForeground || event.touches[0].pageX < 40)) {
					// Only stop propogation while the menu is not yet fully visible
					if (!this.columns[0].isInForeground) {
						event.stopPropagation()
					}

					lastGestureInfo = initialGestureInfo = gestureInfoFromTouch(event.touches[0])
				}
			},
			touchmove: (event: any) => {
				const sideCol = this._getSideColDom()

				if (!sideCol || !this._mainColumn || this.allColumnsVisible()) {
					return
				}

				const gestureInfo = lastGestureInfo
				const safeInitialGestureInfo = initialGestureInfo

				if (gestureInfo && safeInitialGestureInfo && event.touches.length === 1) {
					const touch = event.touches[0]
					const newTouchPos = touch.pageX
					const sideColRect = sideCol.getBoundingClientRect()
					oldGestureInfo = lastGestureInfo
					const safeLastInfo = (lastGestureInfo = gestureInfoFromTouch(touch))

					// If we have horizonal lock or we don't have vertical lock but would like to acquire horizontal one, the lock horizontally
					if (directionLock === HORIZONTAL || (directionLock !== VERTICAL && Math.abs(safeLastInfo.x - safeInitialGestureInfo.x) > 30)) {
						directionLock = HORIZONTAL

						// Gesture for side column
						if (this.getBackgroundColumns()[0].visible || this.focusedColumn.isInForeground) {
							const newTranslate = Math.min(sideColRect.left - (gestureInfo.x - newTouchPos), 0)
							sideCol.style.transform = `translateX(${newTranslate}px)`
						} else {
							// Gesture for background column
							const slidingDomRect = this._domSlidingPart.getBoundingClientRect()

							// Do not allow to move column to the left
							const newTranslate = Math.max(slidingDomRect.left - (gestureInfo.x - newTouchPos), -this.focusedColumn.offset)
							this._domSlidingPart.style.transform = `translateX(${newTranslate}px)`
						}

						// Scroll events are not cancellable and browsees complain a lot
						if (event.cancelable !== false) event.preventDefault() // If we don't have a vertical lock but we would like to acquire one, get it
					} else if (directionLock !== VERTICAL && Math.abs(safeLastInfo.y - safeInitialGestureInfo.y) > 30) {
						directionLock = VERTICAL
					}

					event.stopPropagation()
				}
			},
			touchend: gestureEnd,
			touchcancel: gestureEnd,
		}

		for (let [name, listener] of Object.entries(listeners)) {
			element.addEventListener(name, listener, true)
		}
	}
}
