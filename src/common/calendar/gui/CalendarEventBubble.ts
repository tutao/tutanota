import m, { Children, Component, Vnode } from "mithril"
import { px } from "../../gui/size"
import { Icon } from "../../gui/base/Icon"
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
import { EventTextTimeOption, TabIndex } from "../../api/common/TutanotaConstants"
import { EventWrapperFlagKeys, FlagKeyToIcon, getDiffIn60mIntervals, getTimeTextFormatForLongEvent, getTimeZone } from "../date/CalendarUtils"
import { Time } from "../date/Time"
import { isAllDayEvent } from "../../api/common/utils/CommonCalendarUtils"

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
	verticalOverflowInfo: RangeOverflowData
	horizontalOverflowInfo: RangeOverflowData
	canReceiveFocus: boolean
	baseDate: Date
	height?: number
}

export class CalendarEventBubble implements Component<CalendarEventBubbleAttrs> {
	view({ attrs }: Vnode<CalendarEventBubbleAttrs>): Children {
		// This helps us stop flickering in certain cases where we want to disable and re-enable fade in (ie. when dragging events)
		// Reapplying the animation to the element will cause it to trigger instantly, so we don't want to do that
		// const doFadeIn = !this.hasFinishedInitialRender && attrs.fadeIn
		// const enablePointerEvents = attrs.enablePointerEvents
		const { gridInfo, eventWrapper, verticalOverflowInfo, interactions, canReceiveFocus, baseDate, horizontalOverflowInfo, height } = attrs

		const calendarEvent = eventWrapper.event

		const isLongNormalEvent = !isAllDayEvent(calendarEvent) && getDiffIn60mIntervals(calendarEvent.startTime, calendarEvent.endTime) >= 24

		const timeFormat = isLongNormalEvent
			? EventTextTimeOption.START_END_TIME
			: getTimeTextFormatForLongEvent(calendarEvent, baseDate, baseDate, getTimeZone())

		const eventTime = timeFormat ? formatEventTime(calendarEvent, timeFormat) : ""
		const eventTitle = isLongNormalEvent ? `${eventTime} ${getDisplayEventTitle(calendarEvent.summary)}` : getDisplayEventTitle(calendarEvent.summary)

		let textColor = !eventWrapper.flags?.isFeatured ? colorForBg(`#${eventWrapper.color}`) : undefined
		let border = eventWrapper.flags?.isFeatured
			? `1.5px dashed ${eventWrapper.flags?.isConflict ? theme.on_warning_container : theme.on_success_container}`
			: "none"
		let backgroundColor = eventWrapper.color.includes("#") ? eventWrapper.color : `#${eventWrapper.color}`

		if (eventWrapper.flags?.isGhost) {
			textColor = theme.on_surface_variant
			border = `1px dashed ${theme.outline}`
			backgroundColor = theme.surface_container_high
		}

		return m(
			".flex.z2.b.darker-hover.small",
			{
				style: {
					pointerEvents: canReceiveFocus ? "auto" : "none",
					minHeight: px(0),
					minWidth: px(0),
					gridColumn: `${gridInfo.column.start} / span ${gridInfo.column.span}`,
					gridRow: `${gridInfo.row.start} / ${gridInfo.row.end}`,
					color: textColor, // Why is this logic only applied for Featured bubbles? (Or is it also applied elsewhere?)
					opacity: `${eventWrapper.flags?.isTransientEvent ? TEMPORARY_EVENT_OPACITY : 1}`,
				} satisfies Partial<CSSStyleDeclaration>,
			},
			[
				horizontalOverflowInfo.start
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
					".pl-4.pr-4.height-100p.full-width.border-radius-4",
					{
						onclick: (e: MouseEvent) => {
							e.stopPropagation()
							if (!eventWrapper.flags?.isTransientEvent) {
								interactions?.click(calendarEvent, e)
							}
						},
						onkeydown: (e: KeyboardEvent) => {
							interactions?.keyDown(calendarEvent, e)
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
							borderTop: verticalOverflowInfo.start ? "none" : undefined,
							borderBottom: verticalOverflowInfo.end ? "none" : undefined,

							"border-top-left-radius": verticalOverflowInfo.start || horizontalOverflowInfo.start ? "0" : undefined,
							"border-top-right-radius": verticalOverflowInfo.start || horizontalOverflowInfo.end ? "0" : undefined,
							"border-bottom-left-radius": verticalOverflowInfo.end || horizontalOverflowInfo.start ? "0" : undefined,
							"border-bottom-right-radius": verticalOverflowInfo.end || horizontalOverflowInfo.end ? "0" : undefined,

							backgroundColor: backgroundColor,

							border: border,

							paddingTop: "2px",
							paddingBottom: "2px",
						} satisfies Partial<CSSStyleDeclaration> & Record<string, any>,
					},
					eventWrapper.flags.isFeatured
						? this.renderFeaturedTexts(eventTitle, eventWrapper.flags)
						: this.renderNonFeaturedTexts(
								eventTitle,
								eventWrapper.color,
								gridInfo.row,
								isAllDayEvent(eventWrapper.event) || isLongNormalEvent ? "" : eventTime,
								eventWrapper.flags,
							),
				),
				horizontalOverflowInfo.end
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

	private renderFeaturedTexts(title: string, flags: EventWrapperFlags) {
		return m(".flex.items-start", [
			m(Icon, {
				icon: flags.isConflict ? Icons.AlertCircle : Icons.Checkmark,
				container: "div",
				class: "mr-xxs",
				style: {
					fill: flags.isConflict ? theme.on_warning_container : theme.on_success_container,
				},
			}),
			m(
				".break-word.b.text-ellipsis-multi-line.lh",
				{
					style: {
						"-webkit-line-clamp": 2,
						color: flags.isConflict ? theme.on_warning_container : theme.on_success_container,
					},
				},
				title,
			),
		])
	}

	/**
	 * Logic for rendering the text and Icon of a bubble that is NOT flagged as "featured".
	 * "Non-featured" events are just regular event bubbles showing up in all different calendar views.
	 *
	 * Events are currently labeled "featured" for display in the event banner, where they have special
	 * styling to distinguish them from events unrelated to the event invite.
	 * @private
	 */
	private renderNonFeaturedTexts(title: string, color: string, rowBounds: RowBounds, eventTime: string, flags: EventWrapperFlags) {
		const totalRowSpan = rowBounds.end - rowBounds.start
		const showSecondLine = totalRowSpan >= MIN_ROW_SPAN * 2
		const maxLines = Math.floor((totalRowSpan - MIN_ROW_SPAN) / MIN_ROW_SPAN)

		const iconFillColor = colorForBg(`#${color}`)
		const hasEventTime = eventTime !== ""

		const flagIcons = Object.entries(flags)
			.filter(([key, value]) => value && FlagKeyToIcon[key as EventWrapperFlagKeys])
			.map(([key]) =>
				m(Icon, {
					icon: FlagKeyToIcon[key as EventWrapperFlagKeys],
					class: "icon-small",
					style: {
						fill: iconFillColor,
						marginTop: "2px",
						marginRight: "2px",
					},
				}),
			)

		return m(".flex", [
			...flagIcons,
			m(".flex.overflow-hidden", { class: showSecondLine ? "col" : "" }, [
				m(
					"span",
					{
						class: showSecondLine ? "text-ellipsis-multi-line" : "text-no-wrap",
						style: {
							"-webkit-line-clamp": maxLines,
						},
					},
					title,
				),
				hasEventTime ? this.renderEventTime(eventTime, showSecondLine, iconFillColor) : null,
			]),
		])
	}

	private renderEventTime(eventTime: string, showSecondLine: boolean, iconFillColor: string): Children {
		return m(".flex.items-center.text-ellipsis", [
			!showSecondLine
				? m(Icon, {
						icon: Icons.Time,
						class: "icon-small ml-4 mr-4",
						style: {
							fill: iconFillColor,
							marginTop: "-2px",
						},
					})
				: null,
			eventTime,
		])
	}
}
