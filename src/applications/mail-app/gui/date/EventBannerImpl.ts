import { findAttendeeInAddresses, formatJSDate, isAllDayEvent, isSameExternalEvent } from "../../../common/api/common/utils/CommonCalendarUtils"
import { ParsedIcalFileContentData } from "../../../calendar-app/calendar/view/CalendarInvites"
import { CalendarEventsRepository } from "../../../common/calendar/date/CalendarEventsRepository"
import m, { ChildArray, Children, ClassComponent, Vnode, VnodeDOM } from "mithril"
import { base64ToBase64Url, getStartOfDay, isNotNull, partition, stringToBase64 } from "@tutao/utils"
import { theme } from "../../../../ui/theme"
import { styles } from "../../../../ui/styles"
import { layout_size, px } from "../../../../ui/size"
import { Icon, IconSize } from "../../../../ui/base/Icon"
import { lang, Translation } from "../../../../ui/utils/LanguageViewModel"
import { collidesWith } from "../../../calendar-app/calendar/gui/CalendarGuiUtils"
import { Icons } from "../../../../ui/base/icons/Icons"
import { BannerButton } from "../../../../ui/base/buttons/BannerButton"
import { ReplyButtons } from "../../../calendar-app/calendar/gui/eventpopup/EventPreviewView"
import stream from "mithril/stream"
import { isRepliedTo } from "../../mail/model/MailUtils"
import { EventBannerSkeleton } from "../EventBannerSkeleton"
import type { EventBannerAttrs } from "../../mail/view/EventBanner"
import { ExpandableTextArea, ExpandableTextAreaAttrs } from "../../../../ui/base/ExpandableTextArea.js"
import { EventWrapper } from "../../../calendar-app/calendar/view/CalendarViewModel.js"
import { fromStrippedCalendarEventAttendee, makeCalendarEventFromIcsCalendarEvent } from "../../../common/calendar/import/ImportExportUtils"
import { CalendarEvent, createCalendarEventAttendee, Mail } from "@tutao/entities/tutanota"
import { CalendarAttendeeStatus, CalendarMethod } from "../../../../entities/tutanota/Utils"
import { EventTextTimeOption, ProgrammingError, SECOND_IN_MILLIS } from "@tutao/app-env"
import { GENERATED_MIN_ID } from "@tutao/meta"
import { IcsCalendarEvent } from "../../../calendar-app/calendar/export/CalendarParser"
import { getCalendarEventDurationInMinutes, getTimeZone } from "../../../common/calendar/date/CalendarUtils"
import { formatEventTime } from "../../../calendar-app/calendar/gui/DateTimeTextFormatterUtils"
import { TimeOverview } from "./TimeOverview"

export type EventBannerImplAttrs = Omit<EventBannerAttrs, "iCalContents"> & {
	iCalContents: ParsedIcalFileContentData
	sendResponse: (event: IcsCalendarEvent, recipient: string, status: CalendarAttendeeStatus, previousMail: Mail, comment?: string) => Promise<boolean>
	usesAmPmTimeFormat: boolean
}

/**
 * It represents a summary of day with calendar events around a main event
 */
export interface InviteAgenda {
	before: EventWrapper | null
	after: EventWrapper | null
	main: EventWrapper
	allDayEvents: Array<EventWrapper>
	regularEvents: Array<EventWrapper>
	existingEvent?: EventWrapper
	conflictCount: number
}

export class EventBannerImpl implements ClassComponent<EventBannerImplAttrs> {
	private agenda: Map<string, InviteAgenda> | null = null
	private comment: string = ""

	async oncreate({ attrs }: VnodeDOM<EventBannerImplAttrs>) {
		this.agenda = await loadEventsAroundInvite(attrs.eventsRepository, attrs.iCalContents, attrs.recipient)
		m.redraw()
	}

	view({ attrs: { iCalContents, eventsRepository, mail, recipient, sendResponse, usesAmPmTimeFormat } }: Vnode<EventBannerImplAttrs>): Children {
		const agenda = this.agenda
		if (!agenda) {
			return m(EventBannerSkeleton)
		}

		const replyCallback = async (event: IcsCalendarEvent, recipient: string, status: CalendarAttendeeStatus, previousMail: Mail) => {
			const responded = await sendResponse(event, recipient, status, previousMail, this.comment)
			if (responded) {
				this.agenda = await loadEventsAroundInvite(eventsRepository, iCalContents, recipient, true)
				updateAttendeeStatusIfNeeded(event, recipient, this.agenda.get(event.uid ?? "")?.existingEvent?.event)
				m.redraw()
			}
			return responded
		}

		const eventsReplySection = iCalContents.events
			.map((event: IcsCalendarEvent): { event: IcsCalendarEvent; replySection: Children } | None => {
				const replySection = this.buildReplySection(agenda, event, mail, recipient, iCalContents.method, replyCallback)
				return replySection == null ? null : { event, replySection }
			})
			// thunderbird does not add attendees to rescheduled instances when they were added during an "all event"
			// edit operation, but _will_ send all the events to the participants in a single file. we do not show the
			// banner for events that do not mention us.
			.filter(isNotNull)

		return eventsReplySection.map(({ event, replySection }) => {
			return this.buildEventBanner(event, agenda.get(event.uid ?? "") ?? null, recipient, replySection, usesAmPmTimeFormat)
		}) as Children
	}

	private buildEventBanner(icsCalendarEvent: IcsCalendarEvent, agenda: InviteAgenda | null, recipient: string, replySection: Children, amPm: boolean) {
		const event = makeCalendarEventFromIcsCalendarEvent(icsCalendarEvent)
		const recipientIsOrganizer = recipient === event.organizer?.address

		if (!agenda) {
			console.warn(`Trying to render an EventBanner for an event but it doesn't have an agenda. Something really wrong happened.`)
		}

		const calendarTimeZone = getTimeZone()

		/* Event Banner */
		return m(
			".border-radius-8.border-sm.grid.full-width.mb-8",
			{
				style: styles.isSingleColumnLayout()
					? {
							"grid-template-columns": "min-content 1fr",
							"grid-template-rows": "auto 1fr",
							"max-width": "100%",
							"border-color": theme.surface_container_high,
						}
					: {
							"grid-template-columns": recipientIsOrganizer ? "min-content max-content" : "min-content min-content 1fr",
							"max-width": recipientIsOrganizer ? "max-content" : px(layout_size.two_column_layout_width),
							"border-color": theme.surface_container_high,
						},
			},
			[
				/* Date Column */
				m(
					".flex.flex-column.center.items-center.pb-16.pt-16.justify-center.fill-grid-column",
					{
						class: styles.isSingleColumnLayout() ? "plr-16" : "pr-32 pl-32",
						style: {
							"background-color": theme.surface_container_high,
							color: theme.on_surface,
						},
					},
					[
						m("span.normal-font-size", event.startTime.toLocaleString("default", { month: "short" })),
						m("span.big.b.lh-s", event.startTime.getDate().toString().padStart(2, "0")),
						m("span.normal-font-size", event.startTime.toLocaleString("default", { year: "numeric" })),
					],
				),
				/* Invite Column */
				m(".flex.flex-column.plr-16.pb-16.pt-16.justify-start.overflow-x-hidden", [
					m(".flex", [
						m(Icon, {
							icon: Icons.CalendarFilled,
							container: "div",
							class: "mr-4",
							style: { fill: theme.on_surface },
							size: IconSize.PX24,
						}),
						m("span.b.h5.text-ellipsis-multi-line.lh-s", event.summary),
					]),
					event.organizer?.address
						? m(".flex.items-center.small.mt-8", [
								m("span.b", lang.getTranslation("when_label").text),
								m("span.ml-4", formatEventTime(event, EventTextTimeOption.START_END_TIME, false, calendarTimeZone)),
							])
						: null,
					replySection,
				]),
				/* Time Overview */
				!recipientIsOrganizer ? m(TimeOverview, { agenda, amPm }) : null,
			],
		)
	}

	private buildReplySection(
		agenda: Map<string, InviteAgenda>,
		icsCalendarEvent: IcsCalendarEvent,
		mail: Mail,
		recipient: string,
		method: CalendarMethod,
		sendResponse: EventBannerImplAttrs["sendResponse"],
	): Children {
		const existingEventWrapper = agenda.get(icsCalendarEvent.uid)?.existingEvent
		let ownAttendee = findAttendeeInAddresses(existingEventWrapper?.event.attendees ?? [], [recipient])

		if (!existingEventWrapper || !ownAttendee) {
			const icsAttendee = findAttendeeInAddresses(icsCalendarEvent.attendees ?? [], [recipient])
			if (!icsAttendee) {
				console.warn("Trying to build a reply section for an event we were not invited")
				return null
			}
			ownAttendee = createCalendarEventAttendee(fromStrippedCalendarEventAttendee(icsAttendee))
		}

		const children: Children = [] as ChildArray
		const viewOnCalendarButton = m(BannerButton, {
			borderColor: theme.outline,
			color: theme.on_surface,
			click: () => this.handleViewOnCalendarAction(existingEventWrapper?.event),
			text: {
				testId: "",
				text: lang.getTranslation("viewOnCalendar_action").text,
			} as Translation,
		})

		if (method === CalendarMethod.REQUEST && ownAttendee != null) {
			// some mails contain more than one event that we want to be able to respond to
			// separately.

			const needsAction =
				(!isRepliedTo(mail) && !existingEventWrapper) ||
				ownAttendee.status === CalendarAttendeeStatus.NEEDS_ACTION ||
				ownAttendee.status === CalendarAttendeeStatus.ADDED
			if (needsAction) {
				children.push(
					m("", [
						m(ReplyButtons, {
							ownAttendee,
							setParticipation: async (status: CalendarAttendeeStatus) => {
								sendResponse(icsCalendarEvent, recipient, status, mail)
							},
						}),
						this.renderCommentInputBox(),
					]),
				)
			} else if (!needsAction) {
				children.push(m(".align-self-start.start.small.mt-8.mb-8.lh", lang.getTranslation("alreadyReplied_msg").text))
				children.push(viewOnCalendarButton)
			}
		} else if (method === CalendarMethod.REPLY) {
			children.push(m(".align-self-start.start.small.mt-8.mb-8.lh", lang.getTranslation("eventNotificationUpdated_msg").text))
			children.push(viewOnCalendarButton)
		} else {
			return null
		}

		return children
	}

	private renderCommentInputBox(): Children {
		return m(ExpandableTextArea, {
			classes: ["mt-8"],
			variant: "outlined",
			value: this.comment,
			oninput: (newValue: string) => {
				this.comment = newValue
			},
			oncreate: (node) => {
				node.dom.addEventListener("keydown", (e) => {
					// disable shortcuts
					e.stopPropagation()
					return true
				})
			},
			maxLines: 2,
			maxLength: 250,
			ariaLabel: lang.getTranslation("addComment_label").text,
			placeholder: lang.getTranslation("addComment_label").text,
		} satisfies ExpandableTextAreaAttrs)
	}

	private handleViewOnCalendarAction(event: CalendarEvent | undefined) {
		if (!event) {
			throw new ProgrammingError("Tried to render 'View on Calendar' button, but we are missing the corresponding event")
		}
		const eventDate = formatJSDate(event.startTime)
		const eventId = base64ToBase64Url(stringToBase64(event._id.join("/")))
		m.route.set(`/calendar/agenda/${eventDate}/${eventId}`)
	}
}

export async function loadEventsAroundInvite(
	eventsRepository: CalendarEventsRepository,
	iCalContents: ParsedIcalFileContentData,
	recipient: string,
	forceReload: boolean = false,
) {
	/*
	 * - Load events that occurs on the same day as event start/end, load both because an event can start at one day and ends in another
	 * - Extract conflicting events following the logic bellow
	 *           [==============] (event)
	 *   [=========] ev.endTime > event.startTime && ev.endTime <= event.endTime
	 *     					[=========] ev.startTime >= event.startTime && ev.startTime < event.endTime
	 *				[========]	ev.startTime >= event.startTime && ev.startTime < event.endTime
	 * [=========]
	 * [==================================] ev.startTime <= event.startTime && ev.endTime >= event.endTime
	 *  						[=========]
	 * - If there's no conflicting before event, get one from event list that starts and ends before the invitation
	 * - If there's no conflicting after event, get one from event list that starts and ends after the invitation
	 * - Build an object that should contain the event before and after, these can be null, meaning that there's no event at the time
	 */
	const eventToAgenda: Map<string, InviteAgenda> = new Map()
	const datesToLoad = iCalContents.events.map((ev) => [getStartOfDay(ev.startTime), getStartOfDay(ev.endTime)]).flat()
	const hasNewPaidPlan = await eventsRepository.canLoadBirthdaysCalendar()
	if (hasNewPaidPlan) {
		await eventsRepository.loadContactsBirthdays()
	}
	if (forceReload) {
		await eventsRepository.forceLoadEventsAt(datesToLoad)
	} else {
		await eventsRepository.loadMonthsIfNeeded(datesToLoad, stream(false), null)
	}
	const events = eventsRepository.getDaysToEvents()() // Short and long events

	for (const iCalEvent of iCalContents.events) {
		const startOfDay = getStartOfDay(iCalEvent.startTime)
		const endOfDay = getStartOfDay(iCalEvent.endTime)
		const eventsForStartDay = events.get(startOfDay.getTime()) ?? []
		const eventsForEndDay = events.get(endOfDay.getTime()) ?? []
		const allExistingEvents: Array<EventWrapper> = Array.from(new Set([...eventsForStartDay, ...eventsForEndDay]))

		const currentExistingEvent = allExistingEvents.find((e) => isSameExternalEvent(e.event, iCalEvent))

		updateAttendeeStatusIfNeeded(iCalEvent, recipient, currentExistingEvent?.event)

		const [allDayAndLongEvents, normalEvents] = partition(allExistingEvents, (ev) => {
			const eventHas24HoursOrMore = getCalendarEventDurationInMinutes(ev.event) >= 60 * 24
			return isAllDayEvent(ev.event) || eventHas24HoursOrMore
		})

		const conflictingNormalEvents = normalEvents.filter((ev) => !isSameExternalEvent(ev.event, iCalEvent) && collidesWith(ev.event, iCalEvent))

		// Decides if we already have a conflicting event or if we should pick an event from event list that happens before the invitation
		const closestConflictingEventBeforeStartTime = conflictingNormalEvents
			.filter((ev) => ev.event.startTime <= iCalEvent.startTime)
			.reduce((closest: EventWrapper | null, ev) => {
				if (!closest) return ev
				if (iCalEvent.startTime.getTime() - ev.event.startTime.getTime() < iCalEvent.startTime.getTime() - closest.event.startTime.getTime()) return ev
				return closest
			}, null)

		// Decides if we already have a conflicting event or if we should pick an event from event list that happens after the invitation
		const closestConflictingEventAfterStartTime = conflictingNormalEvents
			.filter((ev) => ev.event.startTime > iCalEvent.startTime)
			.reduce((closest: EventWrapper | null, ev) => {
				if (!closest) return ev
				if (
					Math.abs(iCalEvent.startTime.getTime() - ev.event.startTime.getTime()) <
					Math.abs(iCalEvent.startTime.getTime() - closest.event.startTime.getTime())
				)
					return ev
				return closest
			}, null)

		// Placeholder id
		const generatedCalendarEvent = makeCalendarEventFromIcsCalendarEvent(iCalEvent)
		generatedCalendarEvent._id = [GENERATED_MIN_ID, GENERATED_MIN_ID]

		let eventList: InviteAgenda = {
			before: null,
			after: null,
			main: {
				event: generatedCalendarEvent,
				color: theme.success_container,
				flags: {
					isFeatured: true,
					isConflict: conflictingNormalEvents.length + allDayAndLongEvents.length > 0,
					hasAlarms: false,
					isAlteredInstance: false,
				},
			},
			allDayEvents: allDayAndLongEvents.map((wrapper) => ({
				...wrapper,
			})),
			existingEvent: currentExistingEvent,
			conflictCount: conflictingNormalEvents.length + allDayAndLongEvents.length,
			regularEvents: conflictingNormalEvents.map((wrapper) => ({
				...wrapper,
			})),
		}

		const oneHour = SECOND_IN_MILLIS * 3600
		if (!closestConflictingEventBeforeStartTime) {
			const eventBefore = normalEvents
				.sort((a, b) => b.event.startTime.getTime() - a.event.startTime.getTime())
				.find(
					(ev) =>
						!isSameExternalEvent(ev.event, iCalEvent) &&
						ev.event.startTime <= iCalEvent.startTime &&
						iCalEvent.startTime.getTime() - ev.event.endTime.getTime() <= oneHour,
				)

			if (eventBefore) {
				eventList.before = eventBefore
			}
		} else {
			eventList.before = {
				...closestConflictingEventBeforeStartTime,
			}
		}

		if (!closestConflictingEventAfterStartTime) {
			const eventAfter = normalEvents
				.sort((a, b) => a.event.startTime.getTime() - b.event.startTime.getTime())
				.find(
					(ev) =>
						!isSameExternalEvent(ev.event, iCalEvent) &&
						ev.event.startTime > iCalEvent.startTime &&
						ev.event.startTime.getTime() - iCalEvent.endTime.getTime() <= oneHour,
				)

			if (eventAfter) {
				eventList.after = eventAfter
			}
		} else {
			eventList.after = {
				...closestConflictingEventAfterStartTime,
			}
		}

		if (eventList.conflictCount > 0) {
			eventList.main.color = theme.warning_container
		}
		eventToAgenda.set(iCalEvent.uid ?? "", eventList)
	}

	return eventToAgenda
}

function updateAttendeeStatusIfNeeded(inviteEvent: IcsCalendarEvent, ownAttendeeAddress: string, existingEvent?: CalendarEvent) {
	if (!existingEvent) {
		return
	}

	const icsOwnAttendee = findAttendeeInAddresses(inviteEvent.attendees ?? [], [ownAttendeeAddress])
	const existingOwnAttendee = findAttendeeInAddresses(existingEvent.attendees, [ownAttendeeAddress])
	if (!icsOwnAttendee || !existingOwnAttendee) {
		return
	}

	icsOwnAttendee.status = existingOwnAttendee.status
}
