import m, { Children, Component, Vnode } from "mithril"
import { px, size } from "../../gui/size"
import { Icon, IconSize } from "../../gui/base/Icon"
import { Icons } from "../../gui/base/icons/Icons"
import { colorForBg } from "../../gui/base/GuiUtils"
import { theme } from "../../gui/theme"
import { EventGridData, RowBounds } from "./CalendarTimeGrid"
import {
	type CalendarEventBubbleClickHandler,
	CalendarEventBubbleKeyDownHandler,
	EventWrapper,
	EventWrapperFlags,
} from "../../../calendar-app/calendar/view/CalendarViewModel"
import { formatEventTime, getDisplayEventTitle, TEMPORARY_EVENT_OPACITY } from "../../../calendar-app/calendar/gui/CalendarGuiUtils"
import { TabIndex } from "../../api/common/TutanotaConstants"
import { EventWrapperFlagKeys, FlagKeyToIcon, getTimeTextFormatForLongEvent, getTimeZone } from "../date/CalendarUtils"
import { Time } from "../date/Time"

export const MIN_ROW_SPAN = 3

export interface RangeOverflowData {
	start: boolean
	end: boolean
}

export interface CalendarEventBubbleDragProperties {
	drag: {
		prepareCurrentDraggedEvent: (eventWrapper: EventWrapper) => unknown
		setTimeUnderMouse: (time: Time, date: Date) => unknown
	}
}

export interface EventBubbleInteractions {
	click: CalendarEventBubbleClickHandler
	keyDown: CalendarEventBubbleKeyDownHandler
}

export type CalendarEventBubbleAttrs = {
	interactions?: EventBubbleInteractions & CalendarEventBubbleDragProperties
	gridInfo: EventGridData
	eventWrapper: EventWrapper
	rowOverflowInfo: RangeOverflowData
	columnOverflowInfo: RangeOverflowData
	canReceiveFocus: boolean
	baseDate?: Date
	height?: number
}
const lineHeight = size.calendar_line_height
const lineHeightPx = px(lineHeight)

export class CalendarEventBubble implements Component<CalendarEventBubbleAttrs> {
	view({ attrs }: Vnode<CalendarEventBubbleAttrs>): Children {
		// This helps us stop flickering in certain cases where we want to disable and re-enable fade in (ie. when dragging events)
		// Reapplying the animation to the element will cause it to trigger instantly, so we don't want to do that
		// const doFadeIn = !this.hasFinishedInitialRender && attrs.fadeIn
		// const enablePointerEvents = attrs.enablePointerEvents
		const { gridInfo, eventWrapper, rowOverflowInfo, interactions, canReceiveFocus, baseDate, columnOverflowInfo, height } = attrs
		const zone = getTimeZone()
		const timeFormat = baseDate ? getTimeTextFormatForLongEvent(eventWrapper.event, baseDate, baseDate, zone) : null
		const formatedEventTime = timeFormat ? formatEventTime(eventWrapper.event, timeFormat) : ""

		return m(
			".flex.z2.b.darker-hover.small",
			{
				style: {
					pointerEvents: canReceiveFocus ? "auto" : "none",
					minHeight: px(0),
					minWidth: px(0),
					gridColumn: `${gridInfo.column.start} / span ${gridInfo.column.span}`,
					gridRow: `${gridInfo.row.start} / ${gridInfo.row.end}`,
					color: !eventWrapper.flags?.isFeatured ? colorForBg(`#${eventWrapper.color}`) : undefined,
					opacity: `${eventWrapper.flags?.isTransientEvent ? TEMPORARY_EVENT_OPACITY : 1}`,
				} satisfies Partial<CSSStyleDeclaration>,
			},
			[
				columnOverflowInfo.start
					? m(".event-continues-left-indicator.height-100p", {
							style: {
								backgroundColor: `#${eventWrapper.color}`,
								borderRight: `1px solid #${eventWrapper.color}`,
								width: px(6),
							} satisfies Partial<CSSStyleDeclaration>,
						})
					: null,
				m(
					// EventBubble
					".plr-core-4.height-100p.full-width.border-radius-core-4",
					{
						onclick: (e: MouseEvent) => {
							e.stopPropagation()
							if (!eventWrapper.flags?.isTransientEvent) {
								interactions?.click(attrs.eventWrapper.event, e)
							}
						},
						onkeydown: (e: KeyboardEvent) => {
							interactions?.keyDown(attrs.eventWrapper.event, e)
						},
						onmousedown: () => {
							if (!eventWrapper.flags?.isTransientEvent) {
								interactions?.drag.prepareCurrentDraggedEvent(eventWrapper)
							}
						},
						tabIndex: canReceiveFocus ? TabIndex.Default : TabIndex.Programmatic,
						class: interactions?.click ? "cursor-pointer" : "",
						style: {
							height: height ? px(height) : undefined,
							borderTop: rowOverflowInfo.start ? "none" : undefined,
							borderBottom: rowOverflowInfo.end ? "none" : undefined,

							"border-top-left-radius": rowOverflowInfo.start || columnOverflowInfo.start ? "0" : undefined,
							"border-top-right-radius": rowOverflowInfo.start || columnOverflowInfo.end ? "0" : undefined,
							"border-bottom-left-radius": rowOverflowInfo.end || columnOverflowInfo.start ? "0" : undefined,
							"border-bottom-right-radius": rowOverflowInfo.end || columnOverflowInfo.end ? "0" : undefined,

							backgroundColor: eventWrapper.color.includes("#") ? eventWrapper.color : `#${eventWrapper.color}`,

							border: eventWrapper.flags?.isFeatured
								? `1.5px dashed ${eventWrapper.flags?.isConflict ? theme.on_warning_container : theme.on_success_container}`
								: "none",

							paddingTop: "2px",
							paddingBottom: "2px",
						} satisfies Partial<CSSStyleDeclaration> & Record<string, any>,
					},
					eventWrapper.flags.isFeatured
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
									getDisplayEventTitle(eventWrapper.event.summary),
								),
							])
						: this.renderNonFeaturedTexts(eventWrapper.event.summary, eventWrapper.color, gridInfo.row, formatedEventTime, eventWrapper.flags),
				),
				columnOverflowInfo.end
					? m(".event-continues-right-indicator.height-100p", {
							style: {
								backgroundColor: `#${eventWrapper.color}`,
								borderLeft: `1px solid #${eventWrapper.color}`,
								width: px(6),
							} satisfies Partial<CSSStyleDeclaration>,
						})
					: null,
			],
		)
	}

	private renderNonFeaturedTexts(summary: string, color: string, rowBounds: RowBounds, eventTime: string, flags: EventWrapperFlags) {
		const totalRowSpan = rowBounds.end - rowBounds.start
		const showSecondLine = totalRowSpan >= MIN_ROW_SPAN * 2
		const maxLines = Math.floor((totalRowSpan - MIN_ROW_SPAN) / MIN_ROW_SPAN)

		return m(".flex", [
			Object.entries(flags).map(([key, value]: [EventWrapperFlagKeys, boolean]) => {
				return value && FlagKeyToIcon[key]
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
				".flex.overflow-hidden",
				{
					class: showSecondLine ? "col" : "",
				},
				[
					m(
						"span",
						{
							class: showSecondLine ? "text-ellipsis-multi-line" : "text-no-wrap",
							style: {
								"-webkit-line-clamp": maxLines, // This helps resizing the text to show as much as possible of its contents
							},
						},
						getDisplayEventTitle(summary),
					),
					m(".flex.items-center.text-ellipsis", [
						!showSecondLine && eventTime !== ""
							? m(Icon, {
									class: "icon-small mlr-core-4",
									icon: Icons.Time,
									style: {
										fill: colorForBg("#" + color),
										marginTop: "-2px",
									},
								})
							: null,
						`${eventTime}`,
					]),
				],
			),
		])
	}
}
