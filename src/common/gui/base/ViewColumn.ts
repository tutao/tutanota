import m, { Component } from "mithril"
import { AriaLandmarks, landmarkAttrs } from "../AriaUtils"
import { LayerType } from "../../../RootView"
import { lazy, MaybeLazy, resolveMaybeLazy } from "@tutao/tutanota-utils"
import { assertMainOrNode } from "../../api/common/Env"
import { lang, MaybeTranslation } from "../../misc/LanguageViewModel.js"

assertMainOrNode()

export const enum ColumnType {
	Foreground = 0,
	Background = 1,
}

type Attrs = {
	rightBorder?: boolean
}

export class ViewColumn implements Component<Attrs> {
	private readonly component: Component
	columnType: ColumnType
	readonly minWidth: number
	readonly maxWidth: number
	private readonly headerCenter: MaybeLazy<MaybeTranslation>
	private readonly ariaLabel: lazy<string>
	private readonly testId: string | null
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
	 * @param testId testId of the view column used for UI tests.
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
			ariaLabel = () => lang.getTranslationText(this.getTitle()),
			testId,
		}: {
			minWidth: number
			maxWidth: number
			headerCenter?: MaybeLazy<MaybeTranslation>
			ariaLabel?: lazy<string>
			testId?: string
		},
	) {
		this.component = component
		this.columnType = columnType
		this.minWidth = minWidth
		this.maxWidth = maxWidth

		this.headerCenter = headerCenter || "emptyString_msg"

		this.ariaLabel = ariaLabel ?? null
		this.testId = testId ?? null
		this.width = minWidth
		this.offset = 0
		this.isInForeground = false
		this.isVisible = false
		// fixup for old-style components
		this.view = this.view.bind(this)
	}

	view() {
		const zIndex = !this.isVisible && this.columnType === ColumnType.Foreground ? LayerType.ForegroundMenu + 1 : ""
		const landmark = this.ariaRole ? landmarkAttrs(this.ariaRole, this.ariaLabel()) : {}
		return m(
			".view-column.fill-absolute",
			{
				...landmark,
				"data-testid": `section:${this.testId ?? lang.getTranslationText(this.getTitle())}`,
				inert: !this.isVisible && !this.isInForeground,
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

	getTitle(): MaybeTranslation {
		return resolveMaybeLazy(this.headerCenter)
	}

	getOffsetForeground(foregroundState: boolean): number {
		if (this.isVisible || foregroundState) {
			return 0
		} else {
			return -this.width
		}
	}

	focus() {
		this.domColumn?.focus()
	}
}
