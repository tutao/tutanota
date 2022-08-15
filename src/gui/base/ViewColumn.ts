import m, {Child, Component, Vnode} from "mithril"
import {AriaLandmarks, landmarkAttrs} from "../AriaUtils"
import {LayerType} from "../../RootView"
import type {lazy} from "@tutao/tutanota-utils"
import {assertMainOrNode} from "../../api/common/Env"

assertMainOrNode()

export const enum ColumnType {
	Background = 1,
	Foreground = 0,
}

type HeaderCenter = {
	left: Child
	middle: string
	right: Child
}
type Attrs = {
	rightBorder?: boolean
}

export class ViewColumn implements Component<Attrs> {
	component: Component
	columnType: ColumnType
	minWidth: number
	maxWidth: number
	headerCenter: lazy<string | HeaderCenter>
	ariaLabel: lazy<string> | null
	width: number
	offset: number // offset to the left

	// not private because used by ViewSlider
	_domColumn: HTMLElement | null = null
	view: Component<Attrs>["view"]
	isInForeground: boolean
	visible: boolean
	private _ariaRole: AriaLandmarks | null = null

	/**
	 * Create a view column.
	 * @param component The component that is rendered as this column
	 * @param columnType The type of the view column.
	 * @param minWidth The minimum allowed width for the view column.
	 * @param maxWidth The maximum allowed width for the view column.
	 */
	constructor(
		component: Component,
		columnType: ColumnType,
		minWidth: number,
		maxWidth: number,
		headerCenter?: lazy<string | HeaderCenter>,
		ariaLabel?: lazy<string>,
	) {
		this.component = component
		this.columnType = columnType
		this.minWidth = minWidth
		this.maxWidth = maxWidth

		this.headerCenter = headerCenter || (() => "")

		this.ariaLabel = ariaLabel ?? null
		this.width = minWidth
		this.offset = 0
		this.isInForeground = false
		this.visible = false

		this.view = (vnode: Vnode<Attrs>) => {
			const zIndex = !this.visible && this.columnType === ColumnType.Foreground ? LayerType.ForegroundMenu + 1 : ""
			const border = vnode.attrs.rightBorder ? ".list-border-right" : ""
			const landmark = this._ariaRole ? landmarkAttrs(this._ariaRole, this.ariaLabel ? this.ariaLabel() : this.getTitle()) : ""
			return m(
				".view-column.overflow-x-hidden.fill-absolute" + border + landmark,
				{
					"aria-hidden": this.visible || this.isInForeground ? "false" : "true",
					oncreate: vnode => {
						this._domColumn = vnode.dom as HTMLElement
						this._domColumn.style.transform =
							this.columnType === ColumnType.Foreground ? "translateX(" + this.getOffsetForeground(this.isInForeground) + "px)" : ""

						if (this._ariaRole === AriaLandmarks.Main) {
							this.focus()
						}
					},
					style: {
						zIndex,
						width: this.width + "px",
						left: this.offset + "px",
					},
				},
				m(this.component),
			)
		}
	}

	setWidth(width: number) {
		this.width = width
	}

	setRole(landmark: AriaLandmarks | null) {
		this._ariaRole = landmark
	}

	getWidth(): number {
		return this.width
	}

	getTitle(): string {
		const center = this.headerCenter()
		return typeof center === "string" ? center : center.middle
	}

	getTitleButtonLeft(): Child | null {
		const center = this.headerCenter()
		return typeof center === "string" ? null : center.left
	}

	getTitleButtonRight(): Child | null {
		const center = this.headerCenter()
		return typeof center === "string" ? null : center.right
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