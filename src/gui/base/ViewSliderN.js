// @flow
import m from "mithril"
import {windowFacade} from "../../misc/WindowFacade"
import {size} from "../size"
import {alpha, animations, transform} from "../animation/Animations"
import {ease} from "../animation/Easing"
import {theme} from "../theme"
import {neverNull} from "../../api/common/utils/Utils"
import {assertMainOrNode} from "../../api/Env"
import {header} from "./Header"

assertMainOrNode()

export type ViewSliderAttrs = {
	columns: ViewColumnN[],
}

/**
 * Represents a view with multiple view columns. Depending on the screen width and the view columns configurations,
 * the actual widths and positions of the view columns is calculated. This allows a consistent layout for any browser
 * resolution on any type of device.
 */
class _ViewSlider {
	_mainColumn: ViewColumnN;
	focusedColumn: ViewColumnN;
	_visibleBackgroundColumns: ViewColumnN[];
	resizeListener: windowSizeListener;
	_domSlider: HTMLElement;
	_busy: Promise<void>;
	_isModalBackgroundVisible: boolean

	constructor() {
		this._busy = Promise.resolve()
		this._isModalBackgroundVisible = false

	}

	oninit(vnode: Vnode<ViewSliderAttrs>) {
		const columns = vnode.attrs.columns
		this._mainColumn = neverNull(columns.find((column) => column.columnType === ColumnType.Background)) // the first background column is the main column
		this.focusedColumn = this._mainColumn
		this._visibleBackgroundColumns = []

		this.resizeListener = (width, height) => {
			this._updateVisibleBackgroundColumns(columns)
		}

		this._updateVisibleBackgroundColumns(columns)
	}

	/** Removes the registered event listener as soon as this component is unloaded (invoked by mithril)*/
	onremove() {
		windowFacade.removeResizeListener(this.resizeListener)
	}

	/** Creates the event listener as soon as this component is loaded (invoked by mithril)*/
	oncreate(vnode) {
		this._updateVisibleBackgroundColumns(vnode.attrs.columns)
		windowFacade.addResizeListener(this.resizeListener)
	}

	view(vnode: Vnode<ViewSliderAttrs>): VirtualElement {
		const a = vnode.attrs
		//console.log("viewslider.view")
		return m(".flex.col.fill-absolute", [
			m(header),
			m(".view-columns.backface_fix.flex-grow", {
				oncreate: (vnode) => this._domSlider = vnode.dom,
				style: {
					transform: 'translateX(' + this.getOffset(this._visibleBackgroundColumns[0]) + 'px)',
					width: this.getWidth(a.columns) + 'px'
				}
			}, a.columns.map(column => {
				return m(".view-column.fill-absolute.backface_fix", {
						oncreate: (vnode) => column._domColumn = vnode.dom,
						style: {
							width: column.width + 'px',
							left: column.offset + 'px',
							transform: column.columnType === ColumnType.Foreground ?
								'translateX(' + column.getOffsetForeground(column.isInForeground) + 'px)' : null,
							'z-index': column.columnType === ColumnType.Foreground ? "3" : "1"
						}
					},
					m(column.component))
			}).concat(this._createModalBackground()))
		])
	}

	_createModalBackground() {
		if (this._isModalBackgroundVisible) {
			return [
				m(".fill-absolute.z2", {
					oncreate: (vnode) => {
						animations.add(vnode.dom, alpha(alpha.type.backgroundColor, theme.modal_bg, 0, 0.5))
					},
					onbeforeremove: (vnode) => {
						return animations.add(vnode.dom, alpha(alpha.type.backgroundColor, theme.modal_bg, 0.5, 0))
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


	_updateVisibleBackgroundColumns(columns: ViewColumnN[]) {
		this.focusedColumn.isInForeground = false
		this._isModalBackgroundVisible = false
		this.focusedColumn = this._mainColumn
		let visibleColumns: ViewColumnN[] = [this._mainColumn]
		let remainingSpace = window.innerWidth - this._mainColumn.minWidth

		let nextVisibleColumn = this.getNextVisibleColumn(visibleColumns, columns)
		while (nextVisibleColumn && remainingSpace >= nextVisibleColumn.minWidth) {
			visibleColumns.push(nextVisibleColumn)
			remainingSpace -= nextVisibleColumn.minWidth
			nextVisibleColumn = this.getNextVisibleColumn(visibleColumns, columns)
		}
		// visible columns must be sort by the initial column order
		visibleColumns.sort((a, b) => columns.indexOf(a) - columns.indexOf(b))

		this._distributeRemainingSpace(visibleColumns, remainingSpace)
		this._setWidthForHiddenColumns(columns, visibleColumns);

		this.updateOffsets(columns)

		this._visibleBackgroundColumns = visibleColumns
		window.requestAnimationFrame(() => m.redraw())
	}

	/**
	 * Returns the next column which should become visible
	 * @param visibleColumns All columns that will definitely be visible
	 * @param allColumns All columns*
	 */
	getNextVisibleColumn(visibleColumns: ViewColumnN[], allColumns: ViewColumnN[]): ?ViewColumnN {
		let visibleIndexes = visibleColumns.map(column => allColumns.indexOf(column))

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
		return nextColumn
	}

	/**
	 * distributes the remaining space to all visible columns
	 * @param columns
	 * @param remainingSpace
	 */
	_distributeRemainingSpace(visibleColumns: ViewColumnN[], remainingSpace: number) {
		let spacePerColumn = remainingSpace / visibleColumns.length
		visibleColumns.forEach((visibleColumn: ViewColumnN, index) => {
			if ((visibleColumns.length - 1) === index) {
				// ignore max width for the last visible column
				visibleColumn.setWidth(visibleColumn.minWidth + remainingSpace)
			} else {
				let spaceForThisColumn = Math.min(spacePerColumn, visibleColumn.maxWidth - visibleColumn.minWidth)
				remainingSpace -= spaceForThisColumn
				visibleColumn.setWidth(visibleColumn.minWidth + spaceForThisColumn)
			}
		})
	}


	_setWidthForHiddenColumns(columns: ViewColumnN[], visibleColumns: ViewColumnN[]) {
		// if all columns are visible there is no need to set the width
		if (columns.length === visibleColumns.length) {
			return;
		}
		// if only one column is visible set the same width for all columns ignoring max width
		if (visibleColumns.length === 1) {
			columns.forEach(column => column.setWidth(visibleColumns[0].width))
		}

		// Reduce the width of the foreground button to keep always a small part of the background button visible.
		let foreGroundColumn = columns.find(column => column.columnType === ColumnType.Foreground)
		if (foreGroundColumn) {
			let remainingSpace = window.innerWidth - foreGroundColumn.minWidth - size.hpad_large;
			let additionalSpaceForColumn = Math.min(remainingSpace, foreGroundColumn.maxWidth
				- foreGroundColumn.minWidth)
			foreGroundColumn.setWidth(foreGroundColumn.minWidth + additionalSpaceForColumn)
		}
	}


	focus(viewColumn: ViewColumnN) {
		//console.log("focus", viewColumn)
		this._busy.then(() => {
			// hide the foreground column if the column is in foreground
			if (this.focusedColumn.isInForeground) {
				this._busy = this._slideForegroundColumn(this.focusedColumn, false)
				return this._busy
			}
		}).then(() => {
			this.focusedColumn = viewColumn
			if (viewColumn.columnType === ColumnType.Background && this._visibleBackgroundColumns.length === 1
				&& this._visibleBackgroundColumns.indexOf(viewColumn) < 0) {
				//console.log("slide start", oldOffset, newOffset)
				this._busy = this._slideBackgroundColumns(viewColumn, this.getOffset(this._visibleBackgroundColumns[0]), this.getOffset(viewColumn))
			} else if (viewColumn.columnType === ColumnType.Foreground
				&& this._visibleBackgroundColumns.indexOf(viewColumn) < 0) {
				this._busy = this._slideForegroundColumn(viewColumn, true)
			}
			return this._busy;
		}).finally(() => m.redraw()) // for updating header bar after animation
	}

	/**
	 * Executes a slide animation for the background buttons.
	 */
	_slideBackgroundColumns(nextVisibleViewColumn: ViewColumnN, oldOffset: number, newOffset: number): Promise<void> {
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
	_slideForegroundColumn(foregroundColumn: ViewColumnN, toForeground: boolean): Promise<void> {
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


	updateOffsets(columns: ViewColumnN[]) {
		let offset = 0
		for (let column of columns) {
			column.offset = offset
			offset += column.width
		}
	}

	getWidth(columns: ViewColumnN[]): number {
		let lastColumn = columns[columns.length - 1]
		return lastColumn.offset + lastColumn.width
	}

	getOffset(column: ViewColumnN): number {
		return 0 - column.offset
	}

	isFocusPreviousPossible(columns: ViewColumnN[]) {
		return this.getPreviousColumn(columns) != null
	}

	focusPreviousColumn(columns: ViewColumnN[]) {
		if (this.isFocusPreviousPossible(columns)) {
			this.focus(neverNull(this.getPreviousColumn(columns)))
		}
	}

	getPreviousColumn(columns: ViewColumnN[]): ?ViewColumnN {
		if (columns.indexOf(this._visibleBackgroundColumns[0]) > 0 && !this.focusedColumn.isInForeground) {
			let visibleColumnIndex = columns.indexOf(this._visibleBackgroundColumns[0])
			return columns[visibleColumnIndex - 1]
		}
		return null
	}

}

export const ViewSliderN: Class<MComponent<ViewSliderAttrs>> = _ViewSlider

type ColumnTypeEnum = 0 | 1

export const ColumnType = {
	Background: 1,
	Foreground: 0
}

export class ViewColumnN {
	component: Component | Class<MComponent<void>>;
	columnType: ColumnTypeEnum;
	minWidth: number;
	maxWidth: number;
	title: ?lazy<string>;
	width: number;
	offset: number; // offset to the left
	_domColumn: ?HTMLElement;
	isInForeground: boolean;

	/**
	 * Create a view column.
	 * @param component The component that is rendered as this column
	 * @param columnType The type of the view column.
	 * @param minWidth The minimum allowed width for the view column.
	 * @param maxWidth The maximum allowed width for the view column.
	 * @param title A function that returns the translated title text for a column.
	 */
	constructor(component: Component | Class<MComponent<void>>, columnType: ColumnTypeEnum, minWidth: number, maxWidth: number, title: ?lazy<string>) {
		this.component = component
		this.columnType = columnType
		this.minWidth = minWidth
		this.maxWidth = maxWidth
		this.title = title
		this.width = minWidth
		this.offset = 0
		this.isInForeground = false
	}

	setWidth(width: number) {
		this.width = width
	}

	getWidth(): number {
		return this.width
	}

	getTitle(): string {
		return this.title ? this.title() : ""
	}

	getOffsetForeground(foregroundState: boolean): number {
		return foregroundState ? this.width : 0;
	}
}