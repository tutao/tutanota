import type {
	AdvancedRepeatRule,
	CalendarEvent,
	CalendarEventAttendee,
	CalendarRepeatRule,
	EncryptedMailAddress,
} from "../../../../common/api/entities/tutanota/TypeRefs.js"
import { createCalendarEventAttendee, createEncryptedMailAddress } from "../../../../common/api/entities/tutanota/TypeRefs.js"
import m, { Children, Component, Vnode } from "mithril"
import { AllIcons, Icon, IconSize } from "../../../../common/gui/base/Icon.js"
import { theme } from "../../../../common/gui/theme.js"
import { BootIcons } from "../../../../common/gui/base/icons/BootIcons.js"
import { Icons } from "../../../../common/gui/base/icons/Icons.js"
import {
	areAllAdvancedRepeatRulesValid, ByRule,
	getRepeatEndTimeForDisplay,
	getTimeZone,
	RENDER_TYPE_TRANSLATION_MAP,
	RenderType,
} from "../../../../common/calendar/date/CalendarUtils.js"
import { CalendarAttendeeStatus, EndType, getAttendeeStatus, RepeatPeriod } from "../../../../common/api/common/TutanotaConstants.js"
import { downcast, memoized } from "@tutao/tutanota-utils"
import { lang, TranslationKey } from "../../../../common/misc/LanguageViewModel.js"
import type { RepeatRule } from "../../../../common/api/entities/sys/TypeRefs.js"
import { cleanMailAddress, findAttendeeInAddresses, isAllDayEvent } from "../../../../common/api/common/utils/CommonCalendarUtils.js"
import { formatDateWithMonth } from "../../../../common/misc/Formatter.js"
import { BannerButton, BannerButtonAttrs } from "../../../../common/gui/base/buttons/BannerButton.js"
import { pureComponent } from "../../../../common/gui/base/PureComponent.js"
import { CalendarEventPreviewViewModel } from "./CalendarEventPreviewViewModel.js"
import { UpgradeRequiredError } from "../../../../common/api/main/UpgradeRequiredError.js"
import { showPlanUpgradeRequiredDialog } from "../../../../common/misc/SubscriptionDialogs.js"
import { ExternalLink } from "../../../../common/gui/base/ExternalLink.js"

import { createRepeatRuleFrequencyValues, formatEventDuration, getDisplayEventTitle, iconForAttendeeStatus } from "../CalendarGuiUtils.js"
import { hasError } from "../../../../common/api/common/utils/ErrorUtils.js"
import { px, size } from "../../../../common/gui/size.js"

export type EventPreviewViewAttrs = {
	calendarEventPreviewModel: CalendarEventPreviewViewModel
	event: Omit<CalendarEvent, "description">
	sanitizedDescription: string | null
	participation?: ReturnType<typeof CalendarEventPreviewViewModel.prototype.getParticipationSetterAndThen>
}

/** the buttons enabling the user to view their current participation status on an event and to trigger a change to it, including
 * a mail to the organizer. */
export const ReplyButtons = pureComponent((participation: NonNullable<EventPreviewViewAttrs["participation"]>) => {
	const colors = {
		borderColor: theme.content_button,
		color: theme.content_fg,
	}

	const highlightColors = {
		borderColor: theme.content_accent,
		color: theme.content_accent,
	}

	const makeStatusButtonAttrs = (status: CalendarAttendeeStatus, text: TranslationKey): BannerButtonAttrs =>
		Object.assign(
			{
				text,
				class: "width-min-content",
				click: async () => {
					try {
						await participation.setParticipation(status)
					} catch (e) {
						if (e instanceof UpgradeRequiredError) {
							const ordered = await showPlanUpgradeRequiredDialog(e.plans, e.message)
							if (!ordered) return
							await participation.setParticipation(status)
						} else {
							throw e
						}
					}
				},
			},
			participation.ownAttendee.status === status ? highlightColors : colors,
		)

	return m(".flex.col", [
		m(".small", lang.get("invitedToEvent_msg")),
		m(".flex.items-center.mt-s", [
			m(BannerButton, makeStatusButtonAttrs(CalendarAttendeeStatus.ACCEPTED, "yes_label")),
			m(BannerButton, makeStatusButtonAttrs(CalendarAttendeeStatus.TENTATIVE, "maybe_label")),
			m(BannerButton, makeStatusButtonAttrs(CalendarAttendeeStatus.DECLINED, "no_label")),
		]),
	])
})

export class EventPreviewView implements Component<EventPreviewViewAttrs> {
	// Cache the parsed URL, so we don't parse the URL on every single view call
	private readonly getLocationUrl: typeof getLocationUrl

	constructor() {
		this.getLocationUrl = memoized(getLocationUrl)
	}

	view(vnode: Vnode<EventPreviewViewAttrs>): Children {
		const { event, sanitizedDescription, participation, calendarEventPreviewModel } = vnode.attrs
		const attendees = prepareAttendees(event.attendees, event.organizer)
		const eventTitle = getDisplayEventTitle(event.summary)

		const renderInfo = calendarEventPreviewModel.getCalendarRenderInfo()

		return m(".flex.col.smaller.scroll.visible-scrollbar", [
			this.renderRow(BootIcons.Calendar, [m("span.h3", eventTitle)], true, true),
			this.renderCalendar(renderInfo.name, renderInfo.color, RENDER_TYPE_TRANSLATION_MAP.get(renderInfo.renderType) ?? "yourCalendars_label"),
			this.renderRow(
				Icons.Time,
				[formatEventDuration(event, getTimeZone(), false), m("small.text-fade", this.renderRepeatRule(event.repeatRule, isAllDayEvent(event)))],
				true,
			),
			this.renderLocation(event.location),
			this.renderAttendeesSection(attendees, participation),
			this.renderAttendanceSection(event, attendees, participation),
			this.renderDescription(sanitizedDescription),
		])
	}

	private renderRow(headerIcon: AllIcons, children: Children, isAlignedLeft: boolean = false, isEventTitle: boolean = false): Children {
		return m(".flex.pb-s", [
			this.renderSectionIndicator(headerIcon, isAlignedLeft ? { marginTop: isEventTitle ? "6px" : "2px" } : undefined),
			m(".selectable.text-break.full-width.align-self-center", children),
		])
	}

	private renderSectionIndicator(icon: AllIcons, style: Record<string, any> = {}): Children {
		return m(Icon, {
			icon,
			class: "pr",
			size: IconSize.Medium,
			style: Object.assign(
				{
					fill: theme.content_button,
					display: "block",
				},
				style,
			),
		})
	}

	private renderRepeatRule(rule: CalendarRepeatRule | null, isAllDay: boolean): Children {
		if (rule == null) return null

		const frequency = formatRepetitionFrequency(rule)

		if (frequency) {
			return m("", frequency + formatRepetitionEnd(rule, isAllDay))
		} else {
			// If we cannot properly process the frequency we just indicate that the event is part of a series.
			return m("", lang.get("unknownRepetition_msg"))
		}
	}

	private renderLocation(location: string | null): Children {
		if (location == null || location.trim().length === 0) return null
		return this.renderRow(Icons.Pin, [
			m(
				".text-ellipsis.selectable",
				m(ExternalLink, {
					href: this.getLocationUrl(location.trim()).toString(),
					text: location,
					isCompanySite: false,
				}),
			),
		])
	}

	private renderAttendeesSection(attendees: Array<CalendarEventAttendee>, participation: EventPreviewViewAttrs["participation"]): Children {
		if (attendees.length === 0) return null
		return this.renderRow(
			Icons.People,
			[
				m(
					".flex-wrap",
					attendees.map((a) => this.renderAttendee(a, participation)),
				),
			],
			true,
		)
	}

	/**
	 * if we're an attendee of this event, this renders a selector to be able to set our own attendance.
	 * @param event if the event is not in a calendar, we don't want to set our attendance from here.
	 * @param attendees list of attendees (including the organizer)
	 * @param participation
	 * @private
	 */
	private renderAttendanceSection(
		event: EventPreviewViewAttrs["event"],
		attendees: Array<CalendarEventAttendee>,
		participation: EventPreviewViewAttrs["participation"],
	): Children {
		if (attendees.length === 0 || participation == null || event._ownerGroup == null) return null
		return m(".flex.pb-s", [this.renderSectionIndicator(BootIcons.Contacts), m(ReplyButtons, participation)])
	}

	private renderAttendee(attendee: CalendarEventAttendee, participation: EventPreviewViewAttrs["participation"]): Children {
		const attendeeField = hasError(attendee.address) ? lang.get("corruptedValue_msg") : attendee.address.address
		/** we might have a more current local attendance for ourselves. */
		const status =
			participation != null && cleanMailAddress(attendee.address.address) === participation.ownAttendee.address.address
				? getAttendeeStatus(participation.ownAttendee)
				: getAttendeeStatus(attendee)

		return m(".flex.items-center", [
			m(Icon, {
				icon: iconForAttendeeStatus[status],
				style: {
					fill: theme.content_fg,
				},
				class: "mr-s",
			}),
			m(".span.line-break-anywhere.selectable", attendeeField),
		])
	}

	private renderDescription(sanitizedDescription: string | null) {
		if (sanitizedDescription == null || sanitizedDescription.length === 0) return null
		return this.renderRow(Icons.AlignLeft, [m.trust(sanitizedDescription)], true)
	}

	private renderCalendar(calendarName: string, calendarColor: string, calendarRenderType: TranslationKey) {
		return m(".flex.pb-s", [
			m(
				".flex.items-center.justify-center.mr",
				{
					style: {
						width: "24px",
						height: "24px",
					},
				},
				m("", {
					style: {
						borderRadius: "50%",
						width: px(size.hpad_large),
						height: px(size.hpad_large),
						backgroundColor: calendarColor,
					},
				}),
			),
			m(".flex.col", [calendarName, m("small.text-fade", lang.get(calendarRenderType!))]),
		])
	}
}

/**
 * if text is a valid absolute url, then returns a URL with text as the href
 * otherwise passes text as the search parameter for open street map
 * @param text
 * @returns {*}
 */
export function getLocationUrl(text: string): URL {
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

export function formatRepetitionFrequency(repeatRule: RepeatRule): string | null {
	if (repeatRule.interval === "1") {
		const frequency = createRepeatRuleFrequencyValues().find((frequency) => frequency.value === repeatRule.frequency)

		if (frequency) {
			const freq = frequency.name
			const readable = buildAdvancedRepetitionRuleDescription(repeatRule.advancedRules, downcast(repeatRule.frequency))

			return `${freq}. ${readable}`.trim()
		}
	} else {
		const repeatMessage = lang.get("repetition_msg", {
			"{interval}": repeatRule.interval,
			"{timeUnit}": getFrequencyTimeUnit(downcast(repeatRule.frequency)),
		})

		const advancedRule = buildAdvancedRepetitionRuleDescription(repeatRule.advancedRules, downcast(repeatRule.frequency))

		return `${repeatMessage}. ${advancedRule}`.trim()
	}

	return null
}

function buildAdvancedRepetitionRuleDescription(advancedRules: AdvancedRepeatRule[], frequency: RepeatPeriod): string {
	const hasInvalidRules = !areAllAdvancedRepeatRulesValid(advancedRules, frequency)

	let translationKey: TranslationKey = "withCustomRules_label"
	if (hasInvalidRules) {
		return lang.get(translationKey)
	}

	const days: string[] = []

	for (const item of advancedRules) {
		switch (item.ruleType) {
			case ByRule.BYDAY:
				days.push(item.interval)
				break
			default:
				return lang.get(translationKey)
		}
	}

	if (days.length === 0) return ""

	if (frequency === RepeatPeriod.MONTHLY) {
		// Gets the number and the day of the week for a given rule value
		// e.g. 2TH would return ["2TH", "2", "TH"]
		const ruleRegex = /^([-+]?\d{0,2})([a-zA-Z]{2})?$/g

		const parsedRuleValue = Array.from(days[0].matchAll(ruleRegex)).flat()

		const day = parseShortDay(parsedRuleValue[2] ?? "")
		const leadingValue = Number.parseInt(parsedRuleValue[1])

		if (leadingValue === 1) {
			translationKey = "firstOfPeriod_label"
		} else if (leadingValue === 2) {
			translationKey = "secondOfPeriod_label"
		} else if (leadingValue === -1) {
			translationKey = "lastOfPeriod_label"
		} else if (!Number.isNaN(leadingValue)) {
			translationKey = "nthOfPeriod_label"
		}

		return lang.get(translationKey, {
			"{days}": day,
			"{n}": leadingValue,
		})
	}

	return lang.get("onDays_label", {
		"{days}": joinAndEndWithString(
			days.map((day) => parseShortDay(day)),
			", ",
			lang.get("and_label"),
		),
	})
}

/*
 * Concatenates elements of an array using a specified separator, and
 * appends the final element with an alternative separator
 */
function joinAndEndWithString(items: any[], separator: string, lastSeparator: string) {
	if (items.length > 1) {
		const last = items.pop()
		const joinedString = items.join(separator)

		return `${joinedString} ${lastSeparator} ${last}`
	}

	return items.join(separator)
}

/**
 * @returns {string} The returned string includes a leading separator (", " or "").
 */
export function formatRepetitionEnd(repeatRule: RepeatRule, isAllDay: boolean): string {
	switch (repeatRule.endType) {
		case EndType.Count:
			if (!repeatRule.endValue) {
				return ""
			}

			return (
				", " +
				lang.get("times_msg", {
					"{amount}": repeatRule.endValue,
				})
			)

		case EndType.UntilDate: {
			const repeatEndTime = getRepeatEndTimeForDisplay(repeatRule, isAllDay, getTimeZone())
			return " " + lang.get("until_label") + " " + formatDateWithMonth(repeatEndTime)
		}

		default:
			return ""
	}
}

function getFrequencyTimeUnit(frequency: RepeatPeriod): string {
	switch (frequency) {
		case RepeatPeriod.DAILY:
			return lang.get("days_label")

		case RepeatPeriod.WEEKLY:
			return lang.get("weeks_label")

		case RepeatPeriod.MONTHLY:
			return lang.get("pricing.months_label")

		case RepeatPeriod.ANNUALLY:
			return lang.get("years_label")

		default:
			throw new Error("Unknown calendar event repeat rule frequency: " + frequency)
	}
}

function parseShortDay(day: string) {
	const days: Record<string, TranslationKey> = {
		MO: "monday_label",
		TU: "tuesday_label",
		WE: "wednesday_label",
		TH: "thursday_label",
		FR: "friday_label",
		SA: "saturday_label",
		SU: "sunday_label",
	}

	return lang.get(days[day]) || ""
}

function prepareAttendees(attendees: Array<CalendarEventAttendee>, organizer: EncryptedMailAddress | null): Array<CalendarEventAttendee> {
	// We copy the attendees array so that we can add the organizer, in the case that they are not already in attendees
	// This is just for display purposes. We need to copy because event.attendees is the source of truth for the event
	// so we can't modify it
	const attendeesCopy = attendees.slice()

	if (organizer != null && attendeesCopy.length > 0 && !findAttendeeInAddresses(attendeesCopy, [organizer.address])) {
		attendeesCopy.unshift(
			createCalendarEventAttendee({
				address: createEncryptedMailAddress({
					address: organizer.address,
					name: "",
				}),
				status: CalendarAttendeeStatus.ADDED, // We don't know whether the organizer will be attending or not in this case
			}),
		)
	}

	return attendeesCopy
}
