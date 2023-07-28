import m, { Child, Children, Component, Vnode } from "mithril"
import { colorForBg } from "../date/CalendarUtils"
import { px, size } from "../../gui/size"
import { Icon } from "../../gui/base/Icon"
import { Icons } from "../../gui/base/icons/Icons"
import type { clickHandler } from "../../gui/base/GuiUtils"

export type CalendarEventBubbleAttrs = {
	text: string
	secondLineText?: string | null
	color: string
	hasAlarm: boolean
	isAltered: boolean
	click: clickHandler
	height?: number
	noBorderRight?: boolean
	noBorderLeft?: boolean
	verticalPadding?: number
	fadeIn: boolean
	opacity: number
	enablePointerEvents: boolean
}
const lineHeight = size.calendar_line_height
const lineHeightPx = px(lineHeight)

export class CalendarEventBubble implements Component<CalendarEventBubbleAttrs> {
	_hasFinishedInitialRender: boolean = false

	oncreate(vnode: Vnode<CalendarEventBubbleAttrs>) {
		this._hasFinishedInitialRender = true
	}

	view({ attrs }: Vnode<CalendarEventBubbleAttrs>): Children {
		// This helps us stop flickering in certain cases where we want to disable and re-enable fade in (ie. when dragging events)
		// Reapplying the animation to the element will cause it to trigger instantly, so we don't want to do that
		const doFadeIn = !this._hasFinishedInitialRender && attrs.fadeIn
		let enablePointerEvents = attrs.enablePointerEvents
		return m(
			".calendar-event.small.overflow-hidden.flex.cursor-pointer" +
				(doFadeIn ? ".fade-in" : "") +
				(attrs.noBorderLeft ? ".event-continues-left" : "") +
				(attrs.noBorderRight ? ".event-continues-right" : ""),
			{
				style: {
					background: "#" + attrs.color,
					color: colorForBg("#" + attrs.color),
					minHeight: lineHeightPx,
					height: px(attrs.height ? Math.max(attrs.height, 0) : lineHeight),
					"padding-top": px(attrs.verticalPadding || 0),
					opacity: attrs.opacity,
					pointerEvents: enablePointerEvents ? "auto" : "none",
				},
				onclick: (e: MouseEvent) => {
					e.stopPropagation()
					attrs.click(e, e.target as HTMLElement)
				},
			},
			[
				attrs.hasAlarm
					? m(Icon, {
							icon: Icons.Notifications,
							style: {
								fill: colorForBg("#" + attrs.color),
								"padding-top": "2px",
								"padding-right": "2px",
							},
							class: "icon-small",
					  })
					: null,
				attrs.isAltered
					? m(Icon, {
							icon: Icons.Edit,
							style: {
								fill: colorForBg("#" + attrs.color),
								"padding-top": "2px",
								"padding-right": "2px",
							},
							class: "icon-small",
					  })
					: null,
				m(
					".flex.col",
					{
						style: {
							// Limit the width to trigger ellipsis
							width: "95%",
						},
					},
					this.renderContent(attrs),
				),
			],
		)
	}

	renderContent({ height: maybeHeight, text, secondLineText, color }: CalendarEventBubbleAttrs): Children {
		// If the bubble has 2 or more lines worth of vertical space, then we will render the text + the secondLineText on separate lines
		// Otherwise we will combine them onto a single line
		const height = maybeHeight ?? lineHeight
		const isMultiline = height >= lineHeight * 2

		if (isMultiline) {
			// How many lines of text that will fit in the bubble
			// we dont want any cut in half lines in case the bubble cannot fit a whole number of lines
			const linesInBubble = Math.floor(height / lineHeight)
			// leave space for the second text line. it will be restricted to a maximum of one line in height
			const topSectionMaxLines = secondLineText != null ? linesInBubble - 1 : linesInBubble
			const topSectionClass = topSectionMaxLines === 1 ? ".text-ellipsis" : ".text-overflow"
			return [
				this.renderTextSection(topSectionClass, text, topSectionMaxLines * lineHeight),
				secondLineText ? this.renderTextSection(".text-ellipsis", secondLineText, lineHeight) : null,
			]
		} else {
			return this.renderTextSection(
				".text-ellipsis",
				secondLineText
					? [
							`${text} `,
							m(Icon, {
								icon: Icons.Time,
								style: {
									fill: colorForBg("#" + color),
									"padding-top": "2px",
									"padding-right": "2px",
									"vertical-align": "text-top",
								},
								class: "icon-small",
							}),
							`${secondLineText}`,
					  ]
					: text,
				lineHeight,
			)
		}
	}

	renderTextSection(classes: string, text: Children, maxHeight: number): Child {
		return m(
			classes,
			{
				style: {
					lineHeight: lineHeightPx,
					maxHeight: px(maxHeight),
				},
			},
			text,
		)
	}
}
