import m, { Component } from "mithril"
import { AriaLandmarks, landmarkAttrs } from "../AriaUtils"
import { LayerType } from "../../../RootView"
import type { lazy } from "@tutao/tutanota-utils"
import { assertMainOrNode } from "../../api/common/Env"

assertMainOrNode()

export const enum ColumnType {
	Background = 1,
	Foreground = 0,
}

type Attrs = {
	rightBorder?: boolean
}

export class ViewColumn implements Component<Attrs> {
	private readonly component: Component
	readonly columnType: ColumnType
	readonly minWidth: number
	readonly maxWidth: number
	private readonly headerCenter: lazy<string>
	private readonly ariaLabel: lazy<string>
	width: number
	offset: number // offset to the left

	// not private because used by ViewSlider
	domColumn: HTMLElement | null = null
	isInForeground: boolean
	isVisible: boolean
	ariaRole: AriaLandmarks | null = null

	/**
	 * Create a view column.
	 * @param component The component that is rendered as this column
	 * @param columnType The type of the view column.
	 * @param minWidth The minimum allowed width for the view column.
	 * @param headerCenter returned in {@link getTitle}. Used in ARIA landmark unless overriden by {@link ariaLabel}
	 * @param ariaLabel used in ARIA landmark
	 * @param maxWidth The maximum allowed width for the view column.
	 * @param headerCenter The title of the view column.
	 * @param ariaLabel The label of the view column to be read by screen readers. Defaults to headerCenter if not specified.
	 */
	constructor(
		component: Component,
		columnType: ColumnType,
		{
			minWidth,
			maxWidth,
			// note: headerCenter is a candidate for removal, ViewColumn is not responsible for the header. This is only useful as an ARIA description which we can already
			// provide separately. We should always require aria description instead.
			headerCenter,
			ariaLabel = () => this.getTitle(),
		}: {
			minWidth: number
			maxWidth: number
			headerCenter?: lazy<string>
			ariaLabel?: lazy<string>
		},
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
		this.isVisible = false
		// fixup for old-style components
		this.view = this.view.bind(this)
	}

	view() {
		const zIndex = !this.isVisible && this.columnType === ColumnType.Foreground ? LayerType.ForegroundMenu + 1 : ""
		const landmark = this.ariaRole ? landmarkAttrs(this.ariaRole, this.ariaLabel ? this.ariaLabel() : this.getTitle()) : {}
		return m(
			".view-column.fill-absolute",
			{
				...landmark,
				"aria-hidden": this.isVisible || this.isInForeground ? "false" : "true",
				oncreate: (vnode) => {
					this.domColumn = vnode.dom as HTMLElement
					this.domColumn.style.transform =
						this.columnType === ColumnType.Foreground ? "translateX(" + this.getOffsetForeground(this.isInForeground) + "px)" : ""

					if (this.ariaRole === AriaLandmarks.Main) {
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

	getTitle(): string {
		return this.headerCenter()
	}

	getOffsetForeground(foregroundState: boolean): number {
		if (this.isVisible || foregroundState) {
			return 0
		} else {
			return -this.width
		}
	}

	focus() {
		this.domColumn && this.domColumn.focus()
	}
}
