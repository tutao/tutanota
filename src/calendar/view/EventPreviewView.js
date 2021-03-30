//@flow
import type {CalendarEvent} from "../../api/entities/tutanota/CalendarEvent"
import m from "mithril"
import {Icon} from "../../gui/base/Icon"
import {theme} from "../../gui/theme"
import {BootIcons} from "../../gui/base/icons/BootIcons"
import {Icons} from "../../gui/base/icons/Icons"
import {iconForAttendeeStatus} from "./CalendarEventEditDialog"
import {formatEventDuration, getTimeZone} from "../CalendarUtils"
import {attendeeStatusByCode} from "../../api/common/TutanotaConstants"
import {memoized} from "../../api/common/utils/Utils"

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

export type Attrs = {
	event: CalendarEvent,
	limitDescriptionHeight: boolean,
	sanitizedDescription: string,
}

export class EventPreviewView implements MComponent<Attrs> {
	// Cache the parsed URL so we don't parse the URL on every single view call
	+_getLocationUrl: typeof getLocationUrl

	constructor() {
		this._getLocationUrl = memoized(getLocationUrl)
	}

	view({attrs: {event, limitDescriptionHeight, sanitizedDescription}}: Vnode<Attrs>): Children {

		const url = this._getLocationUrl(event.location.trim())

		return m(".flex.col", [
			m(".flex.col.smaller", [
				m(".flex.pb-s.items-center", [renderSectionIndicator(BootIcons.Calendar), m(".h3.selectable", event.summary)]),
				m(".flex.pb-s.items-center", [
						renderSectionIndicator(Icons.Time),
						m(".align-self-center.selectable", formatEventDuration(event, getTimeZone(), false))
					]
				),
				event.location
					? m(".flex.pb-s.items-center", [
						renderSectionIndicator(Icons.Pin),
						m("a", {href: url.toString(), target: "_blank"}, m(".text-ellipsis.selectable.underline", event.location))
					])
					: null,
				event.attendees.length
					? m(".flex.pb-s", [
						renderSectionIndicator(BootIcons.Contacts),
						m(".flex-wrap", event.attendees.map(a => m(".flex.items-center", [
							m(Icon, {
								icon: iconForAttendeeStatus[attendeeStatusByCode[a.status]],
								style: {fill: theme.content_fg},
								class: "mr-s"
							}),
							m(".span.line-break-anywhere.selectable", a.address.address),
						]))),
					])
					: null,
				!!event.description
					? m(".flex.pb-s.items-start", [
						renderSectionIndicator(Icons.AlignLeft, {marginTop: "2px"}),
						limitDescriptionHeight
							? m(".scroll.full-width.selectable", {style: {maxHeight: "100px"}}, m.trust(sanitizedDescription))
							: m(".selectable", m.trust(sanitizedDescription))
					])
					: null,
			]),
		])
	}
}


function renderSectionIndicator(icon, style: {[string]: any} = {}) {
	return m(".pr", m(Icon, {
		icon,
		large: true,
		style: Object.assign({
			fill: theme.content_button,
			display: "block"
		}, style)
	}))
}