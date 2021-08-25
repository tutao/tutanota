//@flow

import m from "mithril"
import {colorForBg} from "../date/CalendarUtils"
import {px, size} from "../../gui/size"
import {Icon} from "../../gui/base/Icon"
import {Icons} from "../../gui/base/icons/Icons"
import type {clickHandler} from "../../gui/base/GuiUtils"

export type CalendarEventBubbleAttrs = {
	text: string,
	secondLineText?: ?string,
	color: string,
	hasAlarm: boolean,
	click: clickHandler,
	height?: number,
	noBorderRight?: boolean,
	noBorderLeft?: boolean,
	verticalPadding?: number
}


const lineHeight = size.calendar_line_height
const lineHeightPx = px(lineHeight)

export class CalendarEventBubble implements MComponent<CalendarEventBubbleAttrs> {

	view({attrs}: Vnode<CalendarEventBubbleAttrs>): Children {
		return m(".calendar-event.small.overflow-hidden.flex.fade-in"
			+ (attrs.noBorderLeft ? ".event-continues-left" : "")
			+ (attrs.noBorderRight ? ".event-continues-right" : "")
			, {
				style: {
					background: "#" + attrs.color,
					color: colorForBg("#" + attrs.color),
					minHeight: lineHeightPx,
					height: px(attrs.height ? Math.max(attrs.height, 0) : lineHeight),
					"padding-top": px(attrs.verticalPadding || 0),
				},
				onclick: (e) => {
					e.stopPropagation()
					attrs.click(e, e.target)
				}
			}, [
				attrs.hasAlarm
					? m(Icon, {
						icon: Icons.Notifications,
						style: {fill: colorForBg("#" + attrs.color), "padding-top": "2px", "padding-right": "2px"},
						class: "icon-small",
					})
					: null,
				m(".flex.col", {
					style: {
						// Limit the width to trigger ellipsis
						width: "95%"
					}
				}, this.renderContent(attrs))
			])
	}

	renderContent({height: maybeHeight, text, secondLineText}: CalendarEventBubbleAttrs): Children {
		const height = maybeHeight ?? lineHeight
		const isMultiline = height >= lineHeight * 2

		if (isMultiline) {

			// How many lines of text that will fit in the bubble
			// we dont want any cut in half lines in case the bubble cannot fit a whole number of lines
			const linesInBubble = Math.floor(height / lineHeight)

			// leave space for the second text line. it will be restricted to a maximum of one line in height
			const topSectionMaxLines = secondLineText != null
				? linesInBubble - 1
				: linesInBubble

			const topSectionClass = topSectionMaxLines === 1
				? ".text-ellipsis"
				: ".text-overflow"

			return [
				this.renderTextSection(topSectionClass, text, topSectionMaxLines * lineHeight),
				secondLineText
					? this.renderTextSection(".text-ellipsis", secondLineText, lineHeight)
					: null
			]
		} else {
			return this.renderTextSection(".text-ellipsis", secondLineText ? `${text} | ${secondLineText}` : text, lineHeight)
		}
	}

	renderTextSection(classes: string, text: string, maxHeight: number): Child {
		return m(classes, {
			style: {
				lineHeight: lineHeightPx,
				maxHeight: px(maxHeight),
			}
		}, text)
	}
}
