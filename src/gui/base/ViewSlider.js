// @flow
import m from "mithril"
import {ViewColumn, ColumnType} from "./ViewColumn"
import {windowFacade} from "../../misc/WindowFacade"
import {size} from "../size"
import {animations, transform, alpha} from "../animation/Animations"
import {ease} from "../animation/Easing"
import {theme} from "../theme"
import {neverNull} from "../../api/common/utils/Utils"
import {assertMainOrNode} from "../../api/Env"

assertMainOrNode()

type GestureInfo = {
	x: number,
	time: number,
	identifier: number
}

const gestureInfoFromTouch = (touch: Touch) => ({x: touch.pageX, time: Date.now(), identifier: touch.identifier})

/**
 * Represents a view with multiple view columns. Depending on the screen width and the view columns configurations,
 * the actual widths and positions of the view columns is calculated. This allows a consistent layout for any browser
 * resolution on any type of device.
 */
export class ViewSlider {
	columns: ViewColumn[];
	_mainColumn: ViewColumn;
	focusedColumn: ViewColumn;
	_visibleBackgroundColumns: ViewColumn[];
	_domSlider: HTMLElement;
	view: Function;
	_busy: Promise<void>;
	_parentName: string
	_isModalBackgroundVisible: boolean
	lastGestureInfo: ?GestureInfo
	oldGestureInfo: ?GestureInfo

	/** Creates the event listener as soon as this component is loaded (invoked by mithril)*/
	oncreate = () => {
		this._updateVisibleBackgroundColumns()
		windowFacade.addResizeListener(this.resizeListener)
	}

	/** Removes the registered event listener as soon as this component is unloaded (invoked by mithril)*/
	onremove = () => windowFacade.removeResizeListener(this.resizeListener)

	resizeListener: windowSizeListener = () => this._updateVisibleBackgroundColumns()

	_getSideColDom = () => this.columns[0]._domColumn

	_gestureEnd = (event: any) => {
		const gestureInfo = this.lastGestureInfo
		const oldGestureInfo = this.oldGestureInfo
		if (gestureInfo && oldGestureInfo && !this.allColumnsVisible()) {
			const touch = event.changedTouches[0]
			const mainCol = this._mainColumn._domColumn
			const sideCol = this._getSideColDom()
			if (!mainCol || !sideCol) {
				return
			}

			const mainColRect = mainCol.getBoundingClientRect()

			const velocity = (gestureInfo.x - oldGestureInfo.x) / (gestureInfo.time - oldGestureInfo.time)

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

			if (velocity > 0.8) {
				show()
			} else if (velocity < -0.8) {
				hide()
			} else {
				if (touch.pageX > mainColRect.left + 100) {
					show()
				} else {
					hide()
				}
			}

			this._busy.then(() => m.redraw())
		}

		if (gestureInfo && gestureInfo.identifier === event.changedTouches[0].identifier) {
			this.lastGestureInfo = null
			this.oldGestureInfo = null
		}
	}

	_eventListners = {
		touchstart: (event: any) => {
			if (this.lastGestureInfo) {
				// Already detecting a gesture, ignore second one
				return;
			}
			const mainCol = this._mainColumn._domColumn
			const sideCol = this._getSideColDom()
			if (!mainCol || !sideCol || this.allColumnsVisible()) {
				this.lastGestureInfo = null
				return
			}
			const colRect = mainCol.getBoundingClientRect()
			if (
				event.touches.length == 1 &&
				(this.columns[0].isInForeground || event.touches[0].pageX < colRect.left + 40)
			) {
				event.stopPropagation()
				this.lastGestureInfo = gestureInfoFromTouch(event.touches[0])
			}
		},
		touchmove: (event: any) => {
			const sideCol = this._getSideColDom()
			if (!sideCol || !this._mainColumn || this.allColumnsVisible()) {
				return
			}

			const gestureInfo = this.lastGestureInfo
			if (gestureInfo && event.touches.length == 1) {
				const touch = event.touches[0]
				const newTouchPos = touch.pageX
				const sideColRect = sideCol.getBoundingClientRect()
				const newTranslate = Math.min(sideColRect.left + sideColRect.width - (gestureInfo.x - newTouchPos), sideColRect.width)
				sideCol.style.transform = `translateX(${newTranslate}px)`
				this.oldGestureInfo = this.lastGestureInfo
				this.lastGestureInfo = gestureInfoFromTouch(touch)
				event.stopPropagation()
			}
		},
		touchend: this._gestureEnd,
		touchcancel: this._gestureEnd
	}

	constructor(viewColumns: ViewColumn[], parentName: string) {
		this.columns = viewColumns
		this._mainColumn = neverNull(viewColumns.find((column) => column.columnType == ColumnType.Background)) // the first background column is the main column
		this.focusedColumn = this._mainColumn
		this._visibleBackgroundColumns = []
		this._updateVisibleBackgroundColumns()
		this._busy = Promise.resolve()
		this._parentName = parentName
		this._isModalBackgroundVisible = false

		this.view = (): VirtualElement => {
			return m(".view-columns.fill-absolute.backface_fix", {
				oncreate: (vnode) => {
					this._domSlider = vnode.dom
					for (let listener in this._eventListners) {
						this._domSlider.addEventListener(listener, this._eventListners[listener], true)
					}
				},
				style: {
					transform: 'translateX(' + this.getOffset(this._visibleBackgroundColumns[0]) + 'px)',
					width: this.getWidth() + 'px'
				}
			}, this.columns.map(column => m(column)).concat(this._createModalBackground()))
		}
	}

	_createModalBackground() {
		if (this._isModalBackgroundVisible) {
			return [
				m(".fill-absolute.z2.will-change-alpha", {
					oncreate: (vnode) => {
						this._busy.then(() => animations.add(vnode.dom, alpha(alpha.type.backgroundColor, theme.modal_bg, 0, 0.5)))
					},
					onbeforeremove: (vnode) => {
						return this._busy.then(() => animations.add(vnode.dom, alpha(alpha.type.backgroundColor, theme.modal_bg, 0.5, 0)))
					},
					onclick: (event: MouseEvent) => {
						this.focus(this._visibleBackgroundColumns[0])
					}
				})
			]
		} else {
			return []
		}
	}

	_updateVisibleBackgroundColumns() {
		this.focusedColumn = this.focusedColumn || this._mainColumn
		let visibleColumns: ViewColumn[] = [(this.focusedColumn.columnType == ColumnType.Background ? this.focusedColumn : this._mainColumn)]
		let remainingSpace = window.innerWidth - this._mainColumn.minWidth

		let nextVisibleColumn = this.getNextVisibleColumn(visibleColumns, this.columns)
		while (nextVisibleColumn && remainingSpace >= nextVisibleColumn.minWidth) {
			visibleColumns.push(nextVisibleColumn)
			remainingSpace -= nextVisibleColumn.minWidth
			nextVisibleColumn = this.getNextVisibleColumn(visibleColumns, this.columns)
		}
		// visible columns must be sort by the initial column order
		visibleColumns.sort((a, b) => this.columns.indexOf(a) - this.columns.indexOf(b))

		this._distributeRemainingSpace(visibleColumns, remainingSpace)
		this._setWidthForHiddenColumns(visibleColumns);

		this.updateOffsets(this.columns)

		this._visibleBackgroundColumns = visibleColumns

		if (this.allColumnsVisible()) {
			this.focusedColumn.isInForeground = false
			this._isModalBackgroundVisible = false
			if (this.columns[0]._domColumn) {
				this.columns[0]._domColumn.style.transform = ''
			}
		}

		window.requestAnimationFrame(() => m.redraw())
	}

	/**
	 * Returns the next column which should become visible
	 * @param visibleColumns All columns that will definitely be visible
	 * @param allColumns All columns*
	 */
	getNextVisibleColumn(visibleColumns: ViewColumn[], allColumns: ViewColumn[]): ?ViewColumn {
		// First: try to find a background column which is not visible
		let nextColumn = allColumns.find((column) => {
			return column.columnType == ColumnType.Background && visibleColumns.indexOf(column) < 0
		})
		if (!nextColumn) {
			// Second: if no more background columns are available add the foreground column to the visible columns
			nextColumn = allColumns.find((column) => {
				return column.columnType == ColumnType.Foreground && visibleColumns.indexOf(column) < 0
			})
		}
		return nextColumn
	}

	/**
	 * distributes the remaining space to all visible columns
	 * @param visibleColumns
	 * @param remainingSpace
	 */
	_distributeRemainingSpace(visibleColumns: ViewColumn[], remainingSpace: number) {
		let spacePerColumn = remainingSpace / visibleColumns.length
		visibleColumns.forEach((visibleColumn: ViewColumn, index) => {
			if ((visibleColumns.length - 1) == index) {
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
		if (this.columns.length == visibleColumns.length) {
			return;
		}
		// if only one column is visible set the same width for all columns ignoring max width
		if (visibleColumns.length == 1) {
			this.columns.forEach(column => column.setWidth(visibleColumns[0].width))
		}

		// Reduce the width of the foreground button to keep always a small part of the background button visible.
		let foreGroundColumn = this.columns.find(column => column.columnType == ColumnType.Foreground)
		if (foreGroundColumn) {
			let remainingSpace = window.innerWidth - foreGroundColumn.minWidth - size.hpad_large;
			let additionalSpaceForColumn = Math.min(remainingSpace, foreGroundColumn.maxWidth - foreGroundColumn.minWidth)
			foreGroundColumn.setWidth(foreGroundColumn.minWidth + additionalSpaceForColumn)
		}
	}


	focus(viewColumn: ViewColumn) {
		this._busy.then(() => {
			// hide the foreground column if the column is in foreground
			if (this.focusedColumn.isInForeground) {
				this._busy = this._slideForegroundColumn(this.focusedColumn, false)
				return this._busy
			}
		}).then(() => {
			this.focusedColumn = viewColumn
			if (viewColumn.columnType == ColumnType.Background && this._visibleBackgroundColumns.length == 1 && this._visibleBackgroundColumns.indexOf(viewColumn) < 0) {
				this._busy = this._slideBackgroundColumns(viewColumn, this.getOffset(this._visibleBackgroundColumns[0]), this.getOffset(viewColumn))
			} else if (viewColumn.columnType == ColumnType.Foreground && this._visibleBackgroundColumns.indexOf(viewColumn) < 0) {
				this._busy = this._slideForegroundColumn(viewColumn, true)
			}
			return this._busy;
		}).finally(() => m.redraw()) // for updating header bar after animation
	}

	/**
	 * Executes a slide animation for the background buttons.
	 */
	_slideBackgroundColumns(nextVisibleViewColumn: ViewColumn, oldOffset: number, newOffset: number): Promise<void> {
		return animations.add(this._domSlider, transform(transform.type.translateX, oldOffset, newOffset), {
			easingFunction: ease.inOut
		}).finally(() => {
			// replace the visible column
			this._visibleBackgroundColumns.splice(0, 1, nextVisibleViewColumn)
		})
	}

	/**
	 * Executes a slide animation for the foreground button.
	 */
	_slideForegroundColumn(foregroundColumn: ViewColumn, toForeground: boolean): Promise<void> {
		if (!foregroundColumn._domColumn) return Promise.resolve()
		const colRect = foregroundColumn._domColumn.getBoundingClientRect()
		const oldOffset = colRect.left + colRect.width
		let newOffset = foregroundColumn.getOffsetForeground(toForeground)

		this._isModalBackgroundVisible = toForeground
		return animations.add(neverNull(foregroundColumn._domColumn), transform(transform.type.translateX, oldOffset, newOffset), {
			easingFunction: ease.in
		}).finally(() => {
			foregroundColumn.isInForeground = toForeground
		})
	}


	updateOffsets(columns: ViewColumn[]) {
		let offset = 0
		for (let column of this.columns) {
			column.offset = offset
			offset += column.width
		}
	}

	getWidth(): number {
		let lastColumn = this.columns[this.columns.length - 1]
		return lastColumn.offset + lastColumn.width
	}

	getOffset(column: ViewColumn): number {
		return 0 - column.offset
	}

	isFocusPreviousPossible() {
		return this.getPreviousColumn() != null
	}

	focusPreviousColumn() {
		if (this.isFocusPreviousPossible()) {
			this.focus(neverNull(this.getPreviousColumn()))
		}
	}

	getPreviousColumn(): ?ViewColumn {
		if (this.columns.indexOf(this._visibleBackgroundColumns[0]) > 0 && !this.focusedColumn.isInForeground) {
			let visibleColumnIndex = this.columns.indexOf(this._visibleBackgroundColumns[0])
			return this.columns[visibleColumnIndex - 1]
		}
		return null
	}

	allColumnsVisible(): boolean {
		return this._visibleBackgroundColumns.length == this.columns.length
	}

}