import m, { Child, Children, Component, Vnode } from "mithril"
import { px, size } from "../../../common/gui/size"
import { Icon } from "../../../common/gui/base/Icon"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { ClickHandler, colorForBg } from "../../../common/gui/base/GuiUtils"
import { TabIndex } from "../../../common/api/common/TutanotaConstants.js"

export type LegacyCalendarEventBubbleAttrs = {
	text: string
	secondLineText?: string | null
	color: string
	hasAlarm: boolean
	isAltered: boolean
	isBirthday: boolean
	click: ClickHandler
	keyDown: (event: KeyboardEvent, dom: HTMLElement) => unknown
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

/**
 * @deprecated since version 314.251018.1. Use the new CalendarEventBubble instead
 * @see CalendarEventBubble
 */
export class LegacyCalendarEventBubble implements Component<LegacyCalendarEventBubbleAttrs> {
	private hasFinishedInitialRender: boolean = false

	oncreate(vnode: Vnode<LegacyCalendarEventBubbleAttrs>) {
		this.hasFinishedInitialRender = true
	}

	view({ attrs }: Vnode<LegacyCalendarEventBubbleAttrs>): Children {
		// This helps us stop flickering in certain cases where we want to disable and re-enable fade in (ie. when dragging events)
		// Reapplying the animation to the element will cause it to trigger instantly, so we don't want to do that
		const doFadeIn = !this.hasFinishedInitialRender && attrs.fadeIn
		const enablePointerEvents = attrs.enablePointerEvents
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
				tabIndex: enablePointerEvents ? TabIndex.Default : TabIndex.Programmatic,
				onclick: (e: MouseEvent) => {
					e.stopPropagation()
					attrs.click(e, e.target as HTMLElement)
				},
				onkeydown: (e: KeyboardEvent) => {
					attrs.keyDown(e, e.target as HTMLElement)
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
				attrs.isBirthday
					? m(Icon, {
							icon: Icons.Gift,
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
					LegacyCalendarEventBubble.renderContent(attrs),
				),
			],
		)
	}

	private static renderContent({ height: maybeHeight, text, secondLineText, color }: LegacyCalendarEventBubbleAttrs): Children {
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
			const topSectionClass = topSectionMaxLines === 1 ? ".text-clip" : ".text-ellipsis-multi-line"
			return [
				// The wrapper around `text` is needed to stop `-webkit-box` from changing the height
				LegacyCalendarEventBubble.renderTextSection(
					"",
					m(
						topSectionClass,
						{
							style: {
								"-webkit-line-clamp": topSectionMaxLines, // This helps resizing the text to show as much as possible of its contents
							},
						},
						text,
					),
					topSectionMaxLines * lineHeight,
				),
				secondLineText ? LegacyCalendarEventBubble.renderTextSection(".text-ellipsis", secondLineText, lineHeight) : null,
			]
		} else {
			return LegacyCalendarEventBubble.renderTextSection(
				".text-clip",
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

	private static renderTextSection(classes: string, text: Children, maxHeight: number): Child {
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
