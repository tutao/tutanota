import m, { Children, Component, Vnode } from "mithril"
import { px, size } from "../../../common/gui/size"
import { Icon, IconSize } from "../../../common/gui/base/Icon"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { ClickHandler, colorForBg, KeyboardHandler } from "../../../common/gui/base/GuiUtils"
import { theme } from "../../../common/gui/theme"
import { GridEventData, RowBounds } from "../../../common/calendar/gui/TimeView"
import { EventWrapper, EventWrapperFlags } from "./CalendarViewModel"
import { formatEventTime, TEMPORARY_EVENT_OPACITY } from "../gui/CalendarGuiUtils"
import { TabIndex } from "../../../common/api/common/TutanotaConstants"
import { EventWrapperFlagKeys, FlagKeyToIcon, getTimeTextFormatForLongEvent, getTimeZone } from "../../../common/calendar/date/CalendarUtils"

export const MIN_ROW_SPAN = 3

export interface RangeOverflowData {
	start: boolean
	end: boolean
}

export interface EventBubbleInteractions {
	click: ClickHandler
	keyDown: KeyboardHandler
}

export type CalendarEventBubbleAttrs = {
	// click: ClickHandler
	// color: string
	// hasAlarm: boolean
	// isAltered: boolean
	// isBirthday: boolean
	// text: string
	// opacity: number
	// enablePointerEvents: boolean
	// keyDown: (event: KeyboardEvent, dom: HTMLElement) => unknown

	// secondLineText?: string | null

	interactions?: EventBubbleInteractions
	gridInfo: GridEventData
	eventWrapper: EventWrapper
	rangeInfo: RangeOverflowData
	isFocusable: boolean
	baseDate: Date
}
const lineHeight = size.calendar_line_height
const lineHeightPx = px(lineHeight)

export class CalendarEventBubble implements Component<CalendarEventBubbleAttrs> {
	private hasFinishedInitialRender: boolean = false

	oncreate(vnode: Vnode<CalendarEventBubbleAttrs>) {
		this.hasFinishedInitialRender = true
	}

	view({ attrs }: Vnode<CalendarEventBubbleAttrs>): Children {
		// This helps us stop flickering in certain cases where we want to disable and re-enable fade in (ie. when dragging events)
		// Reapplying the animation to the element will cause it to trigger instantly, so we don't want to do that
		// const doFadeIn = !this.hasFinishedInitialRender && attrs.fadeIn
		// const enablePointerEvents = attrs.enablePointerEvents
		const { gridInfo, eventWrapper, rangeInfo, interactions, isFocusable, baseDate } = attrs
		const zone = getTimeZone()
		const timeFormat = getTimeTextFormatForLongEvent(eventWrapper.event, baseDate, baseDate, zone)
		const formatedEventTime = timeFormat ? formatEventTime(eventWrapper.event, timeFormat) : ""

		return m(
			// EventBubble
			".border-radius.text-ellipsis-multi-line.p-xsm.small.z2.py.plr-core-4.b",
			{
				onclick: interactions?.click,
				tabIndex: isFocusable ? TabIndex.Default : TabIndex.Programmatic,
				style: {
					"pointer-events": isFocusable ? "auto" : "none",
					"min-height": px(0),
					"min-width": px(0),
					"grid-column": `${gridInfo.column.start} / span ${gridInfo.column.span}`,
					background: `#${eventWrapper.color}`,
					color: !eventWrapper.flags?.isFeatured ? colorForBg(`#${eventWrapper.color}`) : undefined,
					"grid-row": `${gridInfo.row.start} / ${gridInfo.row.end}`,
					// "border-top-left-radius": eventWrapper.event.startTime < timeRangeAsDate.start ? "0" : undefined,
					// "border-top-right-radius": eventWrapper.event.startTime < timeRangeAsDate.start ? "0" : undefined,
					// "border-bottom-left-radius": eventWrapper.event.endTime > timeRangeAsDate.end ? "0" : undefined,
					// "border-bottom-right-radius": eventWrapper.event.endTime > timeRangeAsDate.end ? "0" : undefined,
					"border-top-left-radius": !rangeInfo.start ? "0" : undefined,
					"border-top-right-radius": !rangeInfo.start ? "0" : undefined,
					"border-bottom-left-radius": rangeInfo.end ? "0" : undefined,
					"border-bottom-right-radius": rangeInfo.end ? "0" : undefined,
					border: eventWrapper.flags?.isFeatured
						? `1.5px dashed ${eventWrapper.flags?.isConflict ? theme.on_warning_container : theme.on_success_container}`
						: "none",
					"border-top": !rangeInfo.start ? "none" : undefined,
					"border-bottom": rangeInfo.end ? "none" : undefined,
					"-webkit-line-clamp": 2,
					opacity: `${eventWrapper.flags?.isTransientEvent ? TEMPORARY_EVENT_OPACITY : 1}`,
					paddingTop: "2px",
					paddingBottom: "2px",
				} satisfies Partial<CSSStyleDeclaration> & Record<string, any>,
			},
			eventWrapper.flags?.isFeatured
				? m(".flex.items-start", [
						m(Icon, {
							icon: eventWrapper.flags?.isConflict ? Icons.AlertCircle : Icons.Checkmark,
							container: "div",
							class: "mr-xxs",
							size: IconSize.Normal,
							style: {
								fill: eventWrapper.flags?.isConflict ? theme.on_warning_container : theme.on_success_container,
							},
						}),
						m(
							".break-word.b.text-ellipsis-multi-line.lh",
							{
								style: {
									"-webkit-line-clamp": 2,
									color: eventWrapper.flags?.isConflict ? theme.on_warning_container : theme.on_success_container,
								},
							},
							eventWrapper.event.summary,
						),
					])
				: this.renderNonFeaturedTexts(eventWrapper.event.summary, eventWrapper.color, gridInfo.row, formatedEventTime, eventWrapper.flags),
		)

		// return m(
		// 	".calendar-event.small.overflow-hidden.flex.cursor-pointer" +
		// 		(doFadeIn ? ".fade-in" : "") +
		// 		(attrs.noBorderLeft ? ".event-continues-left" : "") +
		// 		(attrs.noBorderRight ? ".event-continues-right" : ""),
		// 	{
		// 		style: {
		// 			background: "#" + attrs.color,
		// 			color: colorForBg("#" + attrs.color),
		// 			minHeight: lineHeightPx,
		// 			height: px(attrs.height ? Math.max(attrs.height, 0) : lineHeight),
		// 			"padding-top": px(attrs.verticalPadding || 0),
		// 			opacity: attrs.opacity,
		// 			pointerEvents: enablePointerEvents ? "auto" : "none",
		// 			border: attrs.border,
		// 		},
		// 		tabIndex: enablePointerEvents ? TabIndex.Default : TabIndex.Programmatic,
		// 		onclick: (e: MouseEvent) => {
		// 			e.stopPropagation()
		// 			attrs.click(e, e.target as HTMLElement)
		// 		},
		// 		onkeydown: (e: KeyboardEvent) => {
		// 			attrs.keyDown(e, e.target as HTMLElement)
		// 		},
		// 	},
		// 	[
		// 		attrs.hasAlarm
		// 			? m(Icon, {
		// 					icon: Icons.Notifications,
		// 					style: {
		// 						fill: colorForBg("#" + attrs.color),
		// 						"padding-top": "2px",
		// 						"padding-right": "2px",
		// 					},
		// 					class: "icon-small",
		// 				})
		// 			: null,
		// 		attrs.isAltered
		// 			? m(Icon, {
		// 					icon: Icons.Edit,
		// 					style: {
		// 						fill: colorForBg("#" + attrs.color),
		// 						"padding-top": "2px",
		// 						"padding-right": "2px",
		// 					},
		// 					class: "icon-small",
		// 				})
		// 			: null,
		// 		attrs.isBirthday
		// 			? m(Icon, {
		// 					icon: Icons.Gift,
		// 					style: {
		// 						fill: colorForBg("#" + attrs.color),
		// 						"padding-top": "2px",
		// 						"padding-right": "2px",
		// 					},
		// 					class: "icon-small",
		// 				})
		// 			: null,
		// 		m(
		// 			".flex.col",
		// 			{
		// 				style: {
		// 					// Limit the width to trigger ellipsis
		// 					width: "95%",
		// 				},
		// 			},
		// 			CalendarEventBubble.renderContent(attrs),
		// 		),
		// 	],
		// )
	}

	private renderNonFeaturedTexts(summary: string, color: string, rowBounds: RowBounds, eventTime: string, flags?: EventWrapperFlags) {
		const totalRowSpan = rowBounds.end - rowBounds.start
		const showSecondLine = totalRowSpan >= MIN_ROW_SPAN * 2
		const maxLines = (totalRowSpan - MIN_ROW_SPAN) / MIN_ROW_SPAN
		console.log({ flags })
		return m(".flex", [
			Object.entries(flags ?? {}).map(([key, value]: [EventWrapperFlagKeys, boolean]) => {
				console.log({ key, value })
				return value
					? m(Icon, {
							icon: FlagKeyToIcon[key],
							style: {
								fill: colorForBg("#" + color),
								"margin-top": "2px",
								"margin-right": "2px",
							},
							class: "icon-small",
						})
					: null
			}),
			m(
				".flex.full-width",
				{
					class: showSecondLine ? "col" : "",
				},
				[
					m(
						".text-ellipsis-multi-line",
						{
							style: {
								"-webkit-line-clamp": maxLines, // This helps resizing the text to show as much as possible of its contents
							},
						},
						summary,
					),
					m(".flex.items-center", [
						!showSecondLine
							? m(Icon, {
									class: "icon-small mlr-core-4",
									icon: Icons.Time,
									style: {
										fill: colorForBg("#" + color),
									},
								})
							: null,
						`${eventTime}`,
					]),
				],
			),
		])
	}

	// private static renderContent({ height: maybeHeight, text, secondLineText, color }: CalendarEventBubbleAttrs): Children {
	// 	// If the bubble has 2 or more lines worth of vertical space, then we will render the text + the secondLineText on separate lines
	// 	// Otherwise we will combine them onto a single line
	// 	const height = maybeHeight ?? lineHeight
	// 	const isMultiline = height >= lineHeight * 2
	//
	// 	if (isMultiline) {
	// 		// How many lines of text that will fit in the bubble
	// 		// we dont want any cut in half lines in case the bubble cannot fit a whole number of lines
	// 		const linesInBubble = Math.floor(height / lineHeight)
	// 		// leave space for the second text line. it will be restricted to a maximum of one line in height
	// 		const topSectionMaxLines = secondLineText != null ? linesInBubble - 1 : linesInBubble
	// 		const topSectionClass = topSectionMaxLines === 1 ? ".text-clip" : ".text-ellipsis-multi-line"
	// 		return [
	// 			// The wrapper around `text` is needed to stop `-webkit-box` from changing the height
	// 			CalendarEventBubble.renderTextSection(
	// 				"",
	// 				m(
	// 					topSectionClass,
	// 					{
	// 						style: {
	// 							"-webkit-line-clamp": topSectionMaxLines, // This helps resizing the text to show as much as possible of its contents
	// 						},
	// 					},
	// 					text,
	// 				),
	// 				topSectionMaxLines * lineHeight,
	// 			),
	// 			secondLineText ? CalendarEventBubble.renderTextSection(".text-ellipsis", secondLineText, lineHeight) : null,
	// 		]
	// 	} else {
	// 		return CalendarEventBubble.renderTextSection(
	// 			".text-clip",
	// 			secondLineText
	// 				? [
	// 						`${text} `,
	// 						m(Icon, {
	// 							icon: Icons.Time,
	// 							style: {
	// 								fill: colorForBg("#" + color),
	// 								"padding-top": "2px",
	// 								"padding-right": "2px",
	// 								"vertical-align": "text-top",
	// 							},
	// 							class: "icon-small",
	// 						}),
	// 						`${secondLineText}`,
	// 					]
	// 				: text,
	// 			lineHeight,
	// 		)
	// 	}
	// }
	//
	// private static renderTextSection(classes: string, text: Children, maxHeight: number): Child {
	// 	return m(
	// 		classes,
	// 		{
	// 			style: {
	// 				lineHeight: lineHeightPx,
	// 				maxHeight: px(maxHeight),
	// 			},
	// 		},
	// 		text,
	// 	)
	// }
}
