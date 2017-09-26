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
	resizeListener: windowSizeListener;
	_domSlider: HTMLElement;
	view: Function;
	_busy: Promise<void>;
	_parentName: string
	oncreate: Function;
	onremove: Function;
	_isModalBackgroundVisible: boolean

	constructor(viewColumns: ViewColumn[], parentName: string) {
		this.columns = viewColumns
		this._mainColumn = neverNull(viewColumns.find((column) => column.columnType == ColumnType.Background)) // the first background column is the main column
		this.focusedColumn = this._mainColumn
		this._visibleBackgroundColumns = []
		this._updateVisibleBackgroundColumns()
		this._busy = Promise.resolve()
		this._parentName = parentName
		this._isModalBackgroundVisible = false

		this.resizeListener = (width, height) => {
			this._updateVisibleBackgroundColumns()
		}

		/** Removes the registered event listener as soon as this component is unloaded (invoked by mithril)*/
		this.onremove = () => {
			windowFacade.removeResizeListener(this.resizeListener)
		}
		/** Creates the event listener as soon as this component is loaded (invoked by mithril)*/
		this.oncreate = () => {
			this._updateVisibleBackgroundColumns()
			windowFacade.addResizeListener(this.resizeListener)
		}

		this.view = (): VirtualElement => {
			// console.log("viewslider.view")
			return m(".view-columns.fill-absolute.backface_fix", {
				oncreate: (vnode) => this._domSlider = vnode.dom,
				style: {
					transform: 'translateX(' + this.getOffset(this._visibleBackgroundColumns[0]) + 'px)',
					width: this.getWidth() + 'px'
				}
			}, this.columns.map(column => m(column)).concat(this._createModalBackground()))
		}
	}

	_createModalBackground() {
		if (this._isModalBackgroundVisible) {
			return [m(".fill-absolute.z2", {
				oncreate: (vnode) => {
					animations.add(vnode.dom, alpha(alpha.type.backgroundColor, theme.modal_bg, 0, 0.5))
				},
				onbeforeremove: (vnode) => {
					return animations.add(vnode.dom, alpha(alpha.type.backgroundColor, theme.modal_bg, 0.5, 0))
				},
				onclick: (event: MouseEvent) => {
					this.focus(this._visibleBackgroundColumns[0])
				}
			})]
		} else {
			return []
		}
	}

	_updateVisibleBackgroundColumns() {
		this.focusedColumn.isInForeground = false
		this._isModalBackgroundVisible = false
		this.focusedColumn = this._mainColumn
		let visibleColumns: ViewColumn[] = [this._mainColumn]
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
		window.requestAnimationFrame(() => m.redraw())
	}

	/**
	 * Returns the next column which should become visible
	 * @param visibleColumns All columns that will definitely be visible
	 * @param allColumns All columns*
	 */
	getNextVisibleColumn(visibleColumns: ViewColumn[], allColumns: ViewColumn[]): ?ViewColumn {
		let visibleIndexes = visibleColumns.map(column => allColumns.indexOf(column))

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
	 * @param columns
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
		//console.log("focus", viewColumn)
		this._busy.then(() => {
			// hide the foreground column if the column is in foreground
			if (this.focusedColumn.isInForeground) {
				this._busy = this._slideForegroundColumn(this.focusedColumn, false)
				return this._busy
			}
		}).then(() => {
			this.focusedColumn = viewColumn
			if (viewColumn.columnType == ColumnType.Background && this._visibleBackgroundColumns.length == 1 && this._visibleBackgroundColumns.indexOf(viewColumn) < 0) {
				//console.log("slide start", oldOffset, newOffset)
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
			delay: 200,
			easingFunction: ease.inOut
		}).finally(() => {
			// replace the visible column
			this._visibleBackgroundColumns.splice(0, 1, nextVisibleViewColumn)
			//console.log("slide end")
		})
	}

	/**
	 * Executes a slide animation for the foreground button.
	 */
	_slideForegroundColumn(foregroundColumn: ViewColumn, toForeground: boolean): Promise<void> {
		let oldOffset = foregroundColumn.getOffsetForeground(foregroundColumn.isInForeground)
		let newOffset = foregroundColumn.getOffsetForeground(toForeground)

		this._isModalBackgroundVisible = toForeground
		m.redraw() // to animate the modal background in parallel to the sliding animation
		//console.log("fade in start")
		return animations.add(neverNull(foregroundColumn._domColumn), transform(transform.type.translateX, oldOffset, newOffset), {
			delay: 200,
			easingFunction: ease.inOut
		}).finally(() => {
			foregroundColumn.isInForeground = toForeground
			//console.log("fade in end")
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

}