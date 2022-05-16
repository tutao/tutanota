import {AccountType, FeatureType, GroupType, TimeFormat} from "../../../src/api/common/TutanotaConstants.js"
import type {IUserController} from "../../../src/api/main/UserController.js"
import {createBookingsRef} from "../../../src/api/entities/sys/TypeRefs.js"
import {GENERATED_MAX_ID} from "../../../src/api/common/utils/EntityUtils.js"
import {createFeature, Feature} from "../../../src/api/entities/sys/TypeRefs.js"
import {downcast, LazyLoaded} from "@tutao/tutanota-utils"
import {createUser} from "../../../src/api/entities/sys/TypeRefs.js"
import {createGroupMembership} from "../../../src/api/entities/sys/TypeRefs.js"
import {createTutanotaProperties} from "../../../src/api/entities/tutanota/TypeRefs.js"
import {createGroupInfo} from "../../../src/api/entities/sys/TypeRefs.js"
import {createMailAddressAlias} from "../../../src/api/entities/sys/TypeRefs.js"
import {createCustomer} from "../../../src/api/entities/sys/TypeRefs.js"
import {createCustomerInfo} from "../../../src/api/entities/sys/TypeRefs.js"
import type {MailboxDetail} from "../../../src/mail/model/MailModel.js"
import {MailModel} from "../../../src/mail/model/MailModel.js"
import {createMailBox} from "../../../src/api/entities/tutanota/TypeRefs.js"
import {createGroup} from "../../../src/api/entities/sys/TypeRefs.js"
import {createMailboxGroupRoot} from "../../../src/api/entities/tutanota/TypeRefs.js"
import type {CalendarUpdateDistributor} from "../../../src/calendar/date/CalendarUpdateDistributor.js"
import o from "ospec"
import type {Contact} from "../../../src/api/entities/tutanota/TypeRefs.js"
import type {ContactModel} from "../../../src/contacts/model/ContactModel.js"
import type {CalendarInfo} from "../../../src/calendar/model/CalendarModel.js"
import {CalendarModel} from "../../../src/calendar/model/CalendarModel.js"
import type {IProgressMonitor} from "../../../src/api/common/utils/ProgressMonitor.js"
import type {CalendarEvent} from "../../../src/api/entities/tutanota/TypeRefs.js"
import {createCalendarEvent} from "../../../src/api/entities/tutanota/TypeRefs.js"

export const accountMailAddress = "address@tutanota.com" as const
export const userId = "12356" as const
export const calendarGroupId = "0" as const

export function makeUserController(
	aliases: Array<string> = [],
	accountType: AccountType = AccountType.PREMIUM,
	defaultSender?: string,
	businessFeatureOrdered: boolean = false,
): IUserController {
	const bookingsRef = createBookingsRef({
		items: GENERATED_MAX_ID,
	})
	const customizations: Feature[] = []

	if (businessFeatureOrdered) {
		customizations.push(
			createFeature({
				feature: FeatureType.BusinessFeatureEnabled,
			}),
		)
	}

	return downcast({
		user: createUser({
			_id: userId,
			memberships: [
				createGroupMembership({
					groupType: GroupType.Mail,
				}),
				createGroupMembership({
					groupType: GroupType.Contact,
				}),
			],
			accountType,
		}),
		props: createTutanotaProperties({
			defaultSender: defaultSender || accountMailAddress,
		}),
		userGroupInfo: createGroupInfo({
			mailAddressAliases: aliases.map(address =>
				createMailAddressAlias({
					mailAddress: address,
					enabled: true,
				}),
			),
			mailAddress: accountMailAddress,
		}),
		userSettingsGroupRoot: {
			timeFormat: TimeFormat.TWENTY_FOUR_HOURS,
		},
		isInternalUser: () => true,
		isFreeAccount: () => true,
		loadCustomer: () =>
			Promise.resolve(
				createCustomer({
					customizations: customizations,
				}),
			),
		loadCustomerInfo: () =>
			Promise.resolve(
				createCustomerInfo({
					bookings: bookingsRef,
				}),
			),
		getCalendarMemberships: () => {
			//TODO
			return []
		},
	})
}

export function makeMailboxDetail(): MailboxDetail {
	return {
		mailbox: createMailBox(),
		folders: [],
		mailGroupInfo: createGroupInfo(),
		mailGroup: createGroup({
			user: userId,
		}),
		mailboxGroupRoot: createMailboxGroupRoot(),
	}
}

export function makeCalendarInfo(type: "own" | "shared", id: string): CalendarInfo {
	return {
		groupRoot: downcast({
			longEvents: "longEventsList",
			shortEvents: "shortEventsList",
		}),
		longEvents: new LazyLoaded(() => Promise.resolve([])),
		groupInfo: downcast({}),
		group: createGroup({
			_id: id,
			type: GroupType.Calendar,
			user: type === "own" ? userId : "anotherUserId",
		}),
		shared: type === "shared",
	}
}

export function makeCalendars(type: "own" | "shared", id: string = calendarGroupId): Map<string, CalendarInfo> {
	const calendarInfo = makeCalendarInfo(type, id)
	return new Map([[id, calendarInfo]])
}

export function makeDistributor(): CalendarUpdateDistributor {
	return {
		sendInvite: o.spy(() => Promise.resolve()),
		sendUpdate: o.spy(() => Promise.resolve()),
		sendCancellation: o.spy(() => Promise.resolve()),
		sendResponse: o.spy(() => Promise.resolve()),
	}
}

export function makeCalendarModel(): CalendarModel {
	return downcast({
		createEvent: o.spy(() => Promise.resolve()),
		updateEvent: o.spy(() => Promise.resolve()),
		deleteEvent: o.spy(() => Promise.resolve()),
		loadAlarms: o.spy(() => Promise.resolve([])),
		loadCalendarInfos: () => {
			return Promise.resolve(makeCalendars("own", calendarGroupId))
		},
		loadOrCreateCalendarInfo: () => {
			return Promise.resolve(makeCalendars("own", calendarGroupId))
		},
		createCalendar: () => Promise.resolve(),
	})
}

export function makeMailModel(): MailModel {
	return downcast({
		getUserMailboxDetails: o.spy(() => Promise.resolve(makeMailboxDetail())),
	})
}

export function makeContactModel(contacts: Array<Contact> = []): ContactModel {
	const findContact = address => contacts.find(c => c.mailAddresses.find(a => a.address === address))

	return downcast({
		searchForContact: address => Promise.resolve(findContact(address)),
	})
}

function id(element): IdTuple {
	return ["list", element]
}

export function makeEvent(_id: string, startTime: Date, endTime: Date, uid: string = ""): CalendarEvent {
	return createCalendarEvent({
		_id: id(_id),
		startTime,
		endTime,
		uid,
	})
}