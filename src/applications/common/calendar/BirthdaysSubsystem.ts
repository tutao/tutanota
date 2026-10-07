import { Contact, ContactTypeRef, createCalendarEvent } from "@tutao/entities/tutanota"
import { DEFAULT_BIRTHDAY_CALENDAR_COLOR } from "@tutao/app-env"
import { lang } from "../../../ui/utils/LanguageViewModel"
import { OperationType } from "@tutao/meta"
import type { EventWrapper } from "../../calendar-app/calendar/view/CalendarViewModel"
import type { UserController } from "../api/main/UserController"
import type { ContactModel } from "../contactsFunctionality/ContactModel"
import type { EntityClient } from "../../../platform-kit/network/EntityClient"

class BirthdaysSubsystem {
	private readonly map = new Map<
		number,
		{
			birthdayYear: number | null
			eventSummary: string
		}[]
	>()
	private initialized = false
	private birthdaysFeatureIncludedInPlan = false

	async init(userController: UserController, contactModel: ContactModel, entityClient: EntityClient): Promise<void> {
		if (this.initialized) {
			this.info("Already initialized. Skipping initialization.")
			return
		}

		this.birthdaysFeatureIncludedInPlan = userController.isInternalUser() && (await userController.isNewPaidPlan())
		if (!this.birthdaysFeatureIncludedInPlan) {
			return
		}

		const contactsListId = await contactModel.getContactListId()
		if (contactsListId == null) {
			this.warn("Could not initialize: contacts list ID unavailable.")
			return
		}

		const contacts = await entityClient.loadAll(ContactTypeRef, contactsListId)
		for (const contact of contacts) {
			birthdaysSubsystem.addContactsBirthdayIfKnown(contact)
		}
		this.initialized = true
	}

	async handleContactEvent(contactModel: ContactModel, operation: OperationType, id: IdTuple) {
		if (operation === OperationType.CREATE || operation === OperationType.UPDATE) {
			const contact = await contactModel.loadContactFromId(id)
			birthdaysSubsystem.addContactsBirthdayIfKnown(contact)
		} else if (operation === OperationType.DELETE) {
			// TODO
		}
	}

	public addContactsBirthdayIfKnown(contact: Contact): boolean {
		const bdayIso = contact.birthdayIso
		if (bdayIso == null) {
			return false
		}

		const bdayIsoComponents = bdayIso.split("-")
		const bdayYear = parseInt(bdayIsoComponents[bdayIsoComponents.length - 3]) ?? null
		const bdayMonth = parseInt(bdayIsoComponents[bdayIsoComponents.length - 2])
		const bdayDay = parseInt(bdayIsoComponents[bdayIsoComponents.length - 1])
		if ((bdayYear !== null && isNaN(bdayYear)) || isNaN(bdayMonth) || isNaN(bdayDay)) {
			this.warn(`Invalid year, month and/or day in birthday ISO string "${bdayIso}"!. Not adding entry to map. Birthday will not be displayed.`)
			return false
		}

		const key = this.calculateMapKeyFromMonthAndDay(bdayMonth, bdayDay)
		let listForDayOfYear = this.map.get(key)
		if (!listForDayOfYear) {
			listForDayOfYear = []
			this.map.set(key, listForDayOfYear)
		}
		listForDayOfYear.push({
			birthdayYear: bdayYear,
			eventSummary: lang.get("birthdayEvent_title", { "{name}": contact.firstName }),
		})
		return true
	}

	public generateEventWrappersForBirthdaysOnDay(userController: UserController, year: number, month: number, day: number): EventWrapper[] {
		const eventWrappers: EventWrapper[] = []

		const key = this.calculateMapKeyFromMonthAndDay(month, day)
		const listForDayOfYear = this.map.get(key)
		if (!listForDayOfYear) {
			return eventWrappers
		}

		const bdayEventsOnDayStartJSDate = new Date(Date.UTC(year, month - 1, day))
		const bdayEventsOnDayEndJSDate = new Date(Date.UTC(year, month - 1, day + 1))

		for (let { birthdayYear, eventSummary } of listForDayOfYear) {
			if (birthdayYear !== null) {
				const age = year - birthdayYear
				if (age < 0) {
					continue
				}
				if (age > 0) {
					eventSummary += ` (${lang.get("birthdayEventAge_title", { "{age}": age })})`
				}
			}

			const event = createCalendarEvent({
				sequence: "0",
				recurrenceId: null,
				sender: null,
				hashedUid: null,
				summary: eventSummary,
				startTime: bdayEventsOnDayStartJSDate,
				endTime: bdayEventsOnDayEndJSDate,
				location: "",
				description: "",
				alarmInfos: [],
				organizer: null,
				attendees: [],
				invitedConfidentially: null,
				repeatRule: null,
				uid: "",
				pendingInvitation: null,
				startTimeZone: null,
				endTimeZone: null,
			})

			const eventWrapper: EventWrapper = {
				event,
				color: userController.userSettingsGroupRoot.birthdayCalendarColor ?? DEFAULT_BIRTHDAY_CALENDAR_COLOR,
				flags: {
					isBirthdayEvent: true,
					isAlteredInstance: false,
					hasAlarms: false,
				},
			}
			eventWrappers.push(eventWrapper)
		}
		return eventWrappers
	}

	private calculateMapKeyFromMonthAndDay(month: number, day: number): number {
		// The keys are designed to be easily debuggable. For example, the key for the 1st of the 5th is 501:
		// the 100s and optionally 1000s place contain the month and the 1s and 10s place contain the month.
		return month * 100 + day
	}

	private info(message: string) {
		console.info(TAG + " " + message)
	}

	private warn(message: string) {
		console.warn(TAG + " " + message)
	}
}

const TAG = "[" + BirthdaysSubsystem.name + "]"

// Import this singleton if you need to do birthday stuff
export const birthdaysSubsystem = new BirthdaysSubsystem()
