//@flow
import type {CalendarEvent} from "../../api/entities/tutanota/CalendarEvent"
import m from "mithril"
import type {AllIconsEnum} from "../../gui/base/Icon"
import {Icon} from "../../gui/base/Icon"
import {theme} from "../../gui/theme"
import {BootIcons} from "../../gui/base/icons/BootIcons"
import {Icons} from "../../gui/base/icons/Icons"
import {iconForAttendeeStatus} from "./CalendarEventEditDialog"
import {createRepeatRuleFrequencyValues, formatEventDuration, getRepeatEndTime, getTimeZone} from "../date/CalendarUtils"
import type {RepeatPeriodEnum} from "../../api/common/TutanotaConstants"
import {CalendarAttendeeStatus, EndType, getAttendeeStatus, RepeatPeriod} from "../../api/common/TutanotaConstants"
import {downcast, memoized} from "@tutao/tutanota-utils"
import type {CalendarEventAttendee} from "../../api/entities/tutanota/CalendarEventAttendee"
import {lang} from "../../misc/LanguageViewModel"
import type {RepeatRule} from "../../api/entities/sys/RepeatRule"
import {isAllDayEvent} from "../../api/common/utils/CommonCalendarUtils"
import {formatDateWithMonth} from "../../misc/Formatter"
import {hasError} from "../../api/common/utils/ErrorCheckUtils"
import {createEncryptedMailAddress} from "../../api/entities/tutanota/EncryptedMailAddress"
import {createCalendarEventAttendee} from "../../api/entities/tutanota/CalendarEventAttendee"

export type Attrs = {
	event: CalendarEvent,
	sanitizedDescription: string,
}

export class EventPreviewView implements MComponent<Attrs> {
	// Cache the parsed URL so we don't parse the URL on every single view call
	+_getLocationUrl: typeof getLocationUrl

	constructor() {
		this._getLocationUrl = memoized(getLocationUrl)
	}

	view({attrs: {event, sanitizedDescription}}: Vnode<Attrs>): Children {

		const url = this._getLocationUrl(event.location.trim())

		// We copy the attendees array so that we can add the organizer, in the case that they are not already in attendees
		// This is just for display purposes. We need to copy because event.attendees is the source of truth for the event
		// so we can't modify it
		const attendees = event.attendees.slice()
		const organizer = event.organizer
		if (organizer != null && attendees.length > 0 && !attendees.some(attendee => attendee.address.address === organizer.address)) {
			attendees.unshift(createCalendarEventAttendee({
				address: createEncryptedMailAddress({
					address: organizer.address
				}),
				status: CalendarAttendeeStatus.ADDED // We don't know whether the organizer will be attending or not in this case
			}))
		}

		return m(".flex.col", [
			m(".flex.col.smaller", [
				m(".flex.pb-s.items-center", [
					this._renderSectionIndicator(BootIcons.Calendar),
					m(".h3.selectable.text-break", event.summary)
				]),
				m(".flex.pb-s", [
						this._renderSectionIndicator(Icons.Time),
						m(".align-self-center.selectable.flex-column", [
							m("", formatEventDuration(event, getTimeZone(), false)),
							this._renderRepeatRule(event)
						])
					]
				),
				event.location
					? m(".flex.pb-s.items-center", [
						this._renderSectionIndicator(Icons.Pin),
						m(".text-ellipsis.selectable", m("a", {
							href: url.toString(),
							target: "_blank",
							rel: "noopener noreferrer"
						}, event.location))
					])
					: null,
				attendees.length !== 0
					? m(".flex.pb-s", [
						this._renderSectionIndicator(BootIcons.Contacts),
						m(".flex-wrap", attendees.map(a => this._renderAttendee(a))),
					])
					: null,
				!!event.description
					? m(".flex.pb-s.items-start", [
						this._renderSectionIndicator(Icons.AlignLeft, {marginTop: "2px"}),
						m(".full-width.selectable.text-break", m.trust(sanitizedDescription))
					])
					: null,
			]),
		])
	}

	_renderRepeatRule(event: CalendarEvent): Children {
		const repeatRule = event.repeatRule
		if (repeatRule) {
			const frequency = formatRepetitionFrequency(repeatRule)
			if (frequency) {
				return m("", frequency + formatRepetitionEnd(repeatRule, isAllDayEvent(event)))
			} else {
				// If we cannot properly process the frequency we just indicate that the event is part of a series.
				return m("", lang.get("unknownRepetition_msg"))
			}
		}
		return null
	}

	_renderAttendee(attendee: CalendarEventAttendee): Children {
		let attendeeField = attendee.address.address
		if(hasError(attendee.address)){
			attendeeField = lang.get("corruptedValue_msg")
		}
		return m(".flex.items-center", [
			m(Icon, {
				icon: iconForAttendeeStatus[getAttendeeStatus(attendee)],
				style: {fill: theme.content_fg},
				class: "mr-s"
			}),
			m(".span.line-break-anywhere.selectable", attendeeField),
		])
	}

	_renderSectionIndicator(icon: AllIconsEnum, style: {[string]: any} = {}): Children {
		return m(".pr", m(Icon, {
			icon,
			large: true,
			style: Object.assign({
				fill: theme.content_button,
				display: "block"
			}, style)
		}))
	}
}

/**
 * if text is a valid absoule url, then returns a URL with text as the href
 * otherwise passes text as the search parameter for open street map
 * @param text
 * @returns {*}
 */
function getLocationUrl(text: string): URL {
	const osmHref = `https://www.openstreetmap.org/search?query=${text}`
	let url
	try {
		// if not a valid _absolute_ url then we get an exception
		url = new URL(text)
	} catch {
		url = new URL(osmHref)
	}
	return url
}

function formatRepetitionFrequency(repeatRule: RepeatRule): ?string {
	if (repeatRule.interval === "1") {
		const frequency = createRepeatRuleFrequencyValues().find(frequency => frequency.value === repeatRule.frequency)
		if (frequency) {
			return frequency.name
		}
	} else {
		return lang.get("repetition_msg", {
			"{interval}": repeatRule.interval,
			"{timeUnit}": getFrequencyTimeUnit(downcast(repeatRule.frequency))
		})
	}

	return null
}

/**
 * @returns {string} The returned string includes a leading separator (", " or " ").
 */
function formatRepetitionEnd(repeatRule: RepeatRule, isAllDay: boolean): string {
	switch (repeatRule.endType) {
		case EndType.Count:
			if (!repeatRule.endValue) {
				return ""
			}
			return ", " + lang.get("times_msg", {"{amount}": repeatRule.endValue})
		case EndType.UntilDate:
			const repeatEndTime = getRepeatEndTime(repeatRule, isAllDay, getTimeZone())
			return " " + lang.get("until_label") + " " + formatDateWithMonth(repeatEndTime)
		default:
			return ""
	}
}

function getFrequencyTimeUnit(frequency: RepeatPeriodEnum): string {
	switch (frequency) {
		case RepeatPeriod.DAILY:
			return lang.get("days_label")
		case RepeatPeriod.WEEKLY:
			return lang.get("weeks_label")
		case RepeatPeriod.MONTHLY:
			return lang.get("months_label")
		case RepeatPeriod.ANNUALLY:
			return lang.get("years_label")
		default:
			throw new Error("Unknown calendar event repeat rule frequency: " + frequency)
	}
}