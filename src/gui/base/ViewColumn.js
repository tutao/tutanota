// @flow
import m from "mithril"
import {assertMainOrNode} from "../../api/Env"
import type {AriaLandmarksEnum} from "../../api/common/utils/AriaUtils"
import {AriaLandmarks, landmarkAttrs} from "../../api/common/utils/AriaUtils"

assertMainOrNode()

type ColumnTypeEnum = 0 | 1

export const ColumnType = {
	Background: 1,
	Foreground: 0
}

type Attrs = {rightBorder?: boolean}

export class ViewColumn {
	component: Component;
	columnType: ColumnTypeEnum;
	minWidth: number;
	maxWidth: number;
	title: ?lazy<string>;
	ariaLabel: ?lazy<string>;
	width: number;
	offset: number; // offset to the left
	_domColumn: ?HTMLElement;
	view: Function;
	isInForeground: boolean;
	visible: boolean;
	_ariaRole: ? AriaLandmarksEnum;

	/**
	 * Create a view column.
	 * @param component The component that is rendered as this column
	 * @param columnType The type of the view column.
	 * @param minWidth The minimum allowed width for the view column.
	 * @param maxWidth The maximum allowed width for the view column.
	 * @param title A function that returns the translated title text for a column.
	 */
	constructor(component: Component, columnType: ColumnTypeEnum, minWidth: number, maxWidth: number, title: ?lazy<string>, ariaLabel: ?lazy<string>) {
		this.component = component
		this.columnType = columnType
		this.minWidth = minWidth
		this.maxWidth = maxWidth
		this.title = title
		this.ariaLabel = ariaLabel
		this.width = minWidth
		this.offset = 0
		this.isInForeground = false
		this.visible = false

		this.view = (vnode: Vnode<Attrs>) => {
			const zIndex = !this.visible && this.columnType === ColumnType.Foreground ? ".z4" : ""
			const border = vnode.attrs.rightBorder ? ".list-border-right" : ""
			const landmark = this._ariaRole ? landmarkAttrs(this._ariaRole, this.ariaLabel ? this.ariaLabel() : this.getTitle()) : ""
			return m(".view-column.overflow-x-hidden.fill-absolute.backface_fix" + zIndex + border + landmark, {
					"aria-hidden": this.visible || this.isInForeground ? "false" : "true",
					oncreate: (vnode) => {
						this._domColumn = vnode.dom
						this._domColumn.style.transform = this.columnType === ColumnType.Foreground ?
							'translateX(' + this.getOffsetForeground(this.isInForeground) + 'px)' : null
						if (this._ariaRole === AriaLandmarks.Main) {
							this.focus()
						}
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

	setRole(landmark: ?AriaLandmarksEnum) {
		this._ariaRole = landmark
	}

	getWidth(): number {
		return this.width
	}

	getTitle(): string {
		return this.title ? this.title() : ""
	}

	getOffsetForeground(foregroundState: boolean): number {
		if (this.visible || foregroundState) {
			return 0
		} else {
			return -this.width
		}
	}

	focus() {
		this._domColumn && this._domColumn.focus()
	}
}