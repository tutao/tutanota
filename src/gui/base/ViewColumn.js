// @flow
import m from "mithril"
import {assertMainOrNode} from "../../api/Env"

assertMainOrNode()

type ColumnTypeEnum = 0 | 1

export const ColumnType = {
	Background: 1,
	Foreground: 0
}

export class ViewColumn {
	component: Component;
	columnType: ColumnTypeEnum;
	minWidth: number;
	maxWidth: number;
	title: ?lazy<string>;
	width: number;
	offset: number; // offset to the left
	_domColumn: ?HTMLElement;
	view: Function;
	isInForeground: boolean;
	visible: boolean;

	/**
	 * Create a view column.
	 * @param component The component that is rendered as this column
	 * @param columnType The type of the view column.
	 * @param minWidth The minimum allowed width for the view column.
	 * @param maxWidth The maximum allowed width for the view column.
	 * @param title A function that returns the translated title text for a column.
	 */
	constructor(component: Component, columnType: ColumnTypeEnum, minWidth: number, maxWidth: number, title: ?lazy<string>) {
		this.component = component
		this.columnType = columnType
		this.minWidth = minWidth
		this.maxWidth = maxWidth
		this.title = title
		this.width = minWidth
		this.offset = 0
		this.isInForeground = false
		this.visible = false

		this.view = () => {
			let zIndex = !this.visible && this.columnType === ColumnType.Foreground ? ".z4" : ""
			return m(".view-column..overflow-x-hidden.fill-absolute.backface_fix" + zIndex, {
					"aria-hidden": this.visible ? "false" : "true",
					oncreate: (vnode) => {
						this._domColumn = vnode.dom
						this._domColumn.style.transform = this.columnType === ColumnType.Foreground ?
							'translateX(' + this.getOffsetForeground(this.isInForeground) + 'px)' : null
					},
					style: {
						width: this.width + 'px',
						left: this.offset + 'px',
					},
				},
				m(this.component))

		}
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

	getOffsetForeground(foregroundState: boolean) {
		if (this.visible || foregroundState) {
			return 0
		} else {
			return -this.width
		}
	}

}