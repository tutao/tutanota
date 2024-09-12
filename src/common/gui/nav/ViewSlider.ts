import m, { Children, Component } from "mithril"
import { ColumnType, ViewColumn } from "../base/ViewColumn.js"
import type { windowSizeListener } from "../../misc/WindowFacade.js"
import { windowFacade } from "../../misc/WindowFacade.js"
import { size } from "../size.js"
import { alpha, AlphaEnum, animations, transform, TransformEnum } from "../animation/Animations.js"
import { ease } from "../animation/Easing.js"
import { theme } from "../theme.js"
import { assertNotNull } from "@tutao/tutanota-utils"
import { styles } from "../styles.js"
import { AriaLandmarks } from "../AriaUtils.js"
import { LayerType } from "../../../RootView.js"
import { assertMainOrNode } from "../../api/common/Env.js"
import { client } from "../../misc/ClientDetector.js"

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
	bottomNav?: Children
}

/**
 * Represents a view with multiple view columns. Depending on the screen width and the view columns configurations,
 * the actual widths and positions of the view columns is calculated. This allows a consistent layout for any browser
 * resolution on any type of device.
 */
export class ViewSlider implements Component<ViewSliderAttrs> {
	private readonly mainColumn: ViewColumn
	focusedColumn: ViewColumn
	private visibleBackgroundColumns: ViewColumn[]
	private domSlidingPart!: HTMLElement
	view: Component<ViewSliderAttrs>["view"]
	private busy: Promise<unknown>
	private isModalBackgroundVisible: boolean
	private readonly resizeListener: windowSizeListener = () => this.updateVisibleBackgroundColumns()
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
		this.updateVisibleBackgroundColumns()

		windowFacade.addResizeListener(this.resizeListener)
		windowFacade.addHistoryEventListener(this.handleHistoryEvent)
	}

	/** Removes the registered event listeners as soon as this component is unloaded (invoked by mithril)*/
	onremove: () => void = () => {
		windowFacade.removeResizeListener(this.resizeListener)
		windowFacade.removeHistoryEventListener(this.handleHistoryEvent)
	}
	private getSideColDom: () => HTMLElement | null = () => this.viewColumns[0].domColumn

	constructor(private readonly viewColumns: ViewColumn[], private readonly enableDrawer: boolean = true) {
		// the first background column is the main column
		this.mainColumn = assertNotNull(
			viewColumns.find((column) => column.columnType === ColumnType.Background),
			"there was no backgroung column passed to viewslider",
		)

		this.focusedColumn = this.mainColumn
		this.visibleBackgroundColumns = []

		this.updateVisibleBackgroundColumns()

		this.busy = Promise.resolve()
		this.isModalBackgroundVisible = false
		for (const column of this.viewColumns) {
			column.ariaRole = this.getColumnRole(column)
		}

		this.view = ({ attrs }): Children => {
			const mainSliderColumns = this.getColumnsForMainSlider()

			const allBackgroundColumnsAreVisible = this.visibleBackgroundColumns.length === mainSliderColumns.length
			return m(
				".fill-absolute.flex.col",
				{
					oncreate: (vnode) => {
						if (this.enableDrawer) this.attachTouchHandler(vnode.dom as HTMLElement)
					},
					onremove: () => {
						if (this.viewColumns[0].columnType === ColumnType.Foreground && this.viewColumns[0].isInForeground) {
							this.viewColumns[0].isInForeground = false
							this.isModalBackgroundVisible = false
						}
					},
				},
				[
					styles.isUsingBottomNavigation() ? null : attrs.header,
					m(
						".view-columns.flex-grow.rel",
						{
							oncreate: (vnode) => {
								this.domSlidingPart = vnode.dom as HTMLElement
							},
							style: {
								width: this.getWidth() + "px",
								transform: "translateX(" + this.getOffset(this.visibleBackgroundColumns[0]) + "px)",
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
					styles.isUsingBottomNavigation() && !client.isCalendarApp() ? attrs.bottomNav : null,
					this.getColumnsForOverlay().map((c) => m(c, {})),
					this.enableDrawer ? this.createModalBackground() : null,
				],
			)
		}
	}

	private getColumnRole(column: ViewColumn): AriaLandmarks | null {
		// role  for foreground column is handled inside FolderColumnView
		if (column.columnType === ColumnType.Foreground) {
			return null
		}

		return this.mainColumn === column ? AriaLandmarks.Main : AriaLandmarks.Region
	}

	getMainColumn(): ViewColumn {
		return this.mainColumn
	}

	private getColumnsForMainSlider(): Array<ViewColumn> {
		return this.viewColumns.filter((c) => c.columnType === ColumnType.Background || c.isVisible)
	}

	private getColumnsForOverlay(): Array<ViewColumn> {
		return this.viewColumns.filter((c) => c.columnType === ColumnType.Foreground && !c.isVisible)
	}

	private createModalBackground(): Children {
		if (this.isModalBackgroundVisible) {
			return [
				m(".fill-absolute.will-change-alpha", {
					style: {
						zIndex: LayerType.ForegroundMenu,
					},
					oncreate: (vnode) => {
						this.busy.then(() => animations.add(vnode.dom as HTMLElement, alpha(AlphaEnum.BackgroundColor, theme.modal_bg, 0, 0.5)))
					},
					onbeforeremove: (vnode) => {
						return this.busy.then(() => animations.add(vnode.dom as HTMLElement, alpha(AlphaEnum.BackgroundColor, theme.modal_bg, 0.5, 0)))
					},
					onclick: () => {
						this.focus(this.visibleBackgroundColumns[0])
					},
				}),
			]
		} else {
			return []
		}
	}

	private updateVisibleBackgroundColumns() {
		this.focusedColumn = this.focusedColumn || this.mainColumn
		let visibleColumns: ViewColumn[] = [this.focusedColumn.columnType === ColumnType.Background ? this.focusedColumn : this.mainColumn]
		let remainingSpace = window.innerWidth - visibleColumns[0].minWidth
		let nextVisibleColumn = this.getNextVisibleColumn(visibleColumns, this.viewColumns)

		while (nextVisibleColumn && remainingSpace >= nextVisibleColumn.minWidth) {
			visibleColumns.push(nextVisibleColumn)
			remainingSpace -= nextVisibleColumn.minWidth
			nextVisibleColumn = this.getNextVisibleColumn(visibleColumns, this.viewColumns)
		}

		// visible columns must be sort by the initial column order
		visibleColumns.sort((a, b) => this.viewColumns.indexOf(a) - this.viewColumns.indexOf(b))

		this.distributeRemainingSpace(visibleColumns, remainingSpace)

		this.setWidthForHiddenColumns(visibleColumns)

		for (const column of this.viewColumns) {
			column.isVisible = visibleColumns.includes(column)
		}
		this.updateOffsets()
		this.visibleBackgroundColumns = visibleColumns

		if (this.allColumnsVisible()) {
			this.focusedColumn.isInForeground = false
			this.isModalBackgroundVisible = false

			if (this.viewColumns[0].domColumn) {
				this.viewColumns[0].domColumn.style.transform = ""
			}
		}

		window.requestAnimationFrame(() => m.redraw())
	}

	getVisibleBackgroundColumns(): ViewColumn[] {
		return this.visibleBackgroundColumns.slice()
	}

	isUsingOverlayColumns(): boolean {
		return this.viewColumns.every((c) => c.columnType !== ColumnType.Foreground || c.isVisible)
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
		return this.viewColumns.filter((c) => c.columnType === ColumnType.Background)
	}

	/**
	 * distributes the remaining space to all visible columns
	 * @param visibleColumns
	 * @param remainingSpace
	 */
	private distributeRemainingSpace(visibleColumns: ViewColumn[], remainingSpace: number) {
		let spacePerColumn = remainingSpace / visibleColumns.length
		for (const [index, visibleColumn] of visibleColumns.entries()) {
			if (visibleColumns.length - 1 === index) {
				// ignore max width for the last visible column
				visibleColumn.width = visibleColumn.minWidth + remainingSpace
			} else {
				let spaceForThisColumn = Math.min(spacePerColumn, visibleColumn.maxWidth - visibleColumn.minWidth)
				remainingSpace -= spaceForThisColumn
				visibleColumn.width = visibleColumn.minWidth + spaceForThisColumn
			}
		}
	}

	private setWidthForHiddenColumns(visibleColumns: ViewColumn[]) {
		// if all columns are visible there is no need to set the width
		if (this.viewColumns.length === visibleColumns.length) {
			return
		}

		// if only one column is visible set the same width for all columns ignoring max width
		if (visibleColumns.length === 1) {
			for (const column of this.viewColumns) {
				column.width = visibleColumns[0].width
			}
		}

		// Reduce the width of the foreground button to keep always a small part of the background button visible.
		let foreGroundColumn = this.viewColumns.find((column) => column.columnType === ColumnType.Foreground)

		if (foreGroundColumn) {
			let remainingSpace = window.innerWidth - foreGroundColumn.minWidth - size.hpad_large
			let additionalSpaceForColumn = Math.min(remainingSpace, foreGroundColumn.maxWidth - foreGroundColumn.minWidth)
			foreGroundColumn.width = foreGroundColumn.minWidth + additionalSpaceForColumn
		}
	}

	async focus(viewColumn: ViewColumn): Promise<unknown> {
		try {
			await this.busy
			if (this.focusedColumn === viewColumn) return
			// hide the foreground column if the column is in foreground
			if (this.focusedColumn.isInForeground) {
				this.busy = this.slideForegroundColumn(this.focusedColumn, false)
				await this.busy
			}

			this.focusedColumn = viewColumn
			if (
				viewColumn.columnType === ColumnType.Background &&
				this.visibleBackgroundColumns.length === 1 &&
				this.visibleBackgroundColumns.indexOf(viewColumn) < 0
			) {
				const currentOffset = this.domSlidingPart.getBoundingClientRect().left
				this.busy = this.slideBackgroundColumns(viewColumn, currentOffset, this.getOffset(viewColumn))
			} else if (viewColumn.columnType === ColumnType.Foreground && this.visibleBackgroundColumns.indexOf(viewColumn) < 0) {
				this.busy = this.slideForegroundColumn(viewColumn, true)
			}

			await this.busy
		} finally {
			// for updating header bar after animation
			m.redraw()
			viewColumn.focus()
		}
	}

	waitForAnimation(): Promise<unknown> {
		return this.busy
	}

	/**
	 * Executes a slide animation for the background buttons.
	 */
	private slideBackgroundColumns(nextVisibleViewColumn: ViewColumn, oldOffset: number, newOffset: number): Promise<unknown> {
		return animations
			.add(this.domSlidingPart, transform(TransformEnum.TranslateX, oldOffset, newOffset), {
				easing: ease.inOut,
			})
			.finally(() => {
				// replace the visible column
				const [removed] = this.visibleBackgroundColumns.splice(0, 1, nextVisibleViewColumn)

				removed.isVisible = false
				nextVisibleViewColumn.isVisible = true
			})
	}

	/**
	 * Executes a slide animation for the foreground button.
	 */
	private slideForegroundColumn(foregroundColumn: ViewColumn, toForeground: boolean): Promise<unknown> {
		if (!foregroundColumn.domColumn) return Promise.resolve()

		// Remove the `visibility: hidden` from the target column before starting the animation, so it is visible during the animation
		foregroundColumn.domColumn.style.visibility = "visible"

		const colRect = foregroundColumn.domColumn.getBoundingClientRect()

		const oldOffset = colRect.left
		let newOffset = foregroundColumn.getOffsetForeground(toForeground)
		this.isModalBackgroundVisible = toForeground
		return animations
			.add(assertNotNull(foregroundColumn.domColumn, "foreground column has no domcolumn"), transform(TransformEnum.TranslateX, oldOffset, newOffset), {
				easing: ease.in,
			})
			.finally(() => {
				foregroundColumn.isInForeground = toForeground
			})
	}

	updateOffsets() {
		let offset = 0

		for (let column of this.viewColumns) {
			if (column.columnType === ColumnType.Background || column.isVisible) {
				column.offset = offset
				offset += column.width
			}
		}
	}

	getWidth(): number {
		let lastColumn = this.viewColumns[this.viewColumns.length - 1]
		return lastColumn.offset + lastColumn.width
	}

	getOffset(column: ViewColumn): number {
		return 0 - column.offset
	}

	isFocusPreviousPossible(): boolean {
		return this.getPreviousColumn() != null
	}

	focusPreviousColumn(): Promise<unknown> {
		if (this.isFocusPreviousPossible()) {
			window.getSelection()?.empty() // try to deselect text
			return this.focus(assertNotNull(this.getPreviousColumn(), "previous column was null!"))
		} else {
			return Promise.resolve()
		}
	}

	focusNextColumn() {
		const indexOfCurrent = this.viewColumns.indexOf(this.focusedColumn)

		if (indexOfCurrent + 1 < this.viewColumns.length) {
			this.focus(this.viewColumns[indexOfCurrent + 1])
		}
	}

	getPreviousColumn(): ViewColumn | null {
		if (this.viewColumns.indexOf(this.visibleBackgroundColumns[0]) > 0 && !this.focusedColumn.isInForeground) {
			let visibleColumnIndex = this.viewColumns.indexOf(this.visibleBackgroundColumns[0])
			return this.viewColumns[visibleColumnIndex - 1]
		}

		return null
	}

	isFirstBackgroundColumnFocused(): boolean {
		return this.viewColumns.filter((column) => column.columnType === ColumnType.Background).indexOf(this.focusedColumn) === 0
	}

	isForegroundColumnFocused(): boolean {
		return this.focusedColumn && this.focusedColumn.columnType === ColumnType.Foreground
	}

	allColumnsVisible(): boolean {
		return this.visibleBackgroundColumns.length === this.viewColumns.length
	}

	attachTouchHandler(element: HTMLElement) {
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
				const mainCol = this.mainColumn.domColumn

				const sideCol = this.getSideColDom()

				if (!mainCol || !sideCol) {
					return
				}

				const mainColRect = mainCol.getBoundingClientRect()
				const velocity = (safeLastGestureInfo.x - safeOldGestureInfo.x) / (safeLastGestureInfo.time - safeOldGestureInfo.time)

				const show = () => {
					this.focusedColumn = this.viewColumns[0]
					this.busy = this.slideForegroundColumn(this.viewColumns[0], true)
					this.isModalBackgroundVisible = true
				}

				const hide = () => {
					this.focusedColumn = this.viewColumns[1]
					this.busy = this.slideForegroundColumn(this.viewColumns[0], false)
					this.isModalBackgroundVisible = false
				}

				// Gesture for the side column
				if (this.getBackgroundColumns()[0].isVisible || this.focusedColumn.isInForeground) {
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
						const colRect = this.domSlidingPart.getBoundingClientRect()

						// Re-focus the column to reset offset changed by the gesture
						this.busy = this.slideBackgroundColumns(this.focusedColumn, colRect.left, -this.focusedColumn.offset)
						this.focus(this.focusedColumn)
					}
				}

				this.busy.then(() => m.redraw())
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

				const mainCol = this.mainColumn.domColumn

				const sideCol = this.getSideColDom()

				if (!mainCol || !sideCol || this.allColumnsVisible()) {
					lastGestureInfo = null
					return
				}

				if (event.touches.length === 1 && (this.viewColumns[0].isInForeground || event.touches[0].pageX < 40)) {
					// Only stop propogation while the menu is not yet fully visible
					if (!this.viewColumns[0].isInForeground) {
						event.stopPropagation()
					}

					lastGestureInfo = initialGestureInfo = gestureInfoFromTouch(event.touches[0])
				}
			},
			touchmove: (event: any) => {
				const sideCol = this.getSideColDom()

				if (!sideCol || !this.mainColumn || this.allColumnsVisible()) {
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
						if (this.getBackgroundColumns()[0].isVisible || this.focusedColumn.isInForeground) {
							const newTranslate = Math.min(sideColRect.left - (gestureInfo.x - newTouchPos), 0)
							sideCol.style.transform = `translateX(${newTranslate}px)`
						} else {
							// Gesture for background column
							const slidingDomRect = this.domSlidingPart.getBoundingClientRect()

							// Do not allow to move column to the left
							const newTranslate = Math.max(slidingDomRect.left - (gestureInfo.x - newTouchPos), -this.focusedColumn.offset)
							this.domSlidingPart.style.transform = `translateX(${newTranslate}px)`
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
