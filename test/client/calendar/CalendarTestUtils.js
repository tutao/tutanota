// @flow


import type {AccountTypeEnum} from "../../../src/api/common/TutanotaConstants"
import {AccountType, FeatureType, GroupType, TimeFormat} from "../../../src/api/common/TutanotaConstants"
import type {IUserController} from "../../../src/api/main/UserController"
import {createBookingsRef} from "../../../src/api/entities/sys/BookingsRef"
import {GENERATED_MAX_ID} from "../../../src/api/common/utils/EntityUtils"
import {createFeature} from "../../../src/api/entities/sys/Feature"
import {downcast} from "@tutao/tutanota-utils"
import {createUser} from "../../../src/api/entities/sys/User"
import {createGroupMembership} from "../../../src/api/entities/sys/GroupMembership"
import {createTutanotaProperties} from "../../../src/api/entities/tutanota/TutanotaProperties"
import {createGroupInfo} from "../../../src/api/entities/sys/GroupInfo"
import {createMailAddressAlias} from "../../../src/api/entities/sys/MailAddressAlias"
import {createCustomer} from "../../../src/api/entities/sys/Customer"
import {createCustomerInfo} from "../../../src/api/entities/sys/CustomerInfo"
import type {MailboxDetail} from "../../../src/mail/model/MailModel";
import {MailModel} from "../../../src/mail/model/MailModel"
import {createMailBox} from "../../../src/api/entities/tutanota/MailBox";
import {createGroup} from "../../../src/api/entities/sys/Group";
import {createMailboxGroupRoot} from "../../../src/api/entities/tutanota/MailboxGroupRoot";
import {LazyLoaded} from "@tutao/tutanota-utils"
import type {CalendarUpdateDistributor} from "../../../src/calendar/date/CalendarUpdateDistributor"
import o from "ospec"
import type {Contact} from "../../../src/api/entities/tutanota/Contact"
import type {ContactModel} from "../../../src/contacts/model/ContactModel"
import {CalendarModel} from "../../../src/calendar/model/CalendarModel"
import type {IProgressMonitor} from "../../../src/api/common/utils/ProgressMonitor"
import type {CalendarEvent} from "../../../src/api/entities/tutanota/CalendarEvent"
import {createCalendarEvent} from "../../../src/api/entities/tutanota/CalendarEvent";
import type {CalendarInfo} from "../../../src/calendar/model/CalendarModel";

export const accountMailAddress = "address@tutanota.com"
export const userId = "12356"
export const calendarGroupId = "0"

export function makeUserController(aliases: Array<string> = [], accountType: AccountTypeEnum = AccountType.PREMIUM, defaultSender?: string, businessFeatureOrdered: boolean = false): IUserController {
	const bookingsRef = createBookingsRef({items: GENERATED_MAX_ID})
	const customizations = []
	if (businessFeatureOrdered) {
		customizations.push(createFeature({feature: FeatureType.BusinessFeatureEnabled}))
	}
	return downcast({
		user: createUser({
			_id: userId,
			memberships: [createGroupMembership({groupType: GroupType.Mail}), createGroupMembership({groupType: GroupType.Contact})],
			accountType,
		}),
		props: createTutanotaProperties({
			defaultSender: defaultSender || accountMailAddress,
		}),
		userGroupInfo: createGroupInfo({
			mailAddressAliases: aliases.map((address) => createMailAddressAlias({mailAddress: address, enabled: true})),
			mailAddress: accountMailAddress,
		}),
		userSettingsGroupRoot: {
			timeFormat: TimeFormat.TWENTY_FOUR_HOURS,
		},
		isInternalUser: () => true,
		isFreeAccount: () => true,
		loadCustomer: () => Promise.resolve(createCustomer({customizations: customizations})),
		loadCustomerInfo: () => Promise.resolve(createCustomerInfo({bookings: bookingsRef})),
		getCalendarMemberships: () => {//TODO
			return [];
		}
	})
}

export function makeMailboxDetail(): MailboxDetail {
	return {
		mailbox: createMailBox(),
		folders: [],
		mailGroupInfo: createGroupInfo(),
		mailGroup: createGroup({user: userId}),
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
		shared: type === "shared"
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
		loadCalendarInfos: (progressMonitor) => {
			return Promise.resolve(makeCalendars("own", calendarGroupId))
		},
		loadOrCreateCalendarInfo: (progressMonitor: IProgressMonitor) => {
			return Promise.resolve(makeCalendars("own", calendarGroupId))
		},
		createCalendar: (name: string, color: ?string) => Promise.resolve()
	})
}

export function makeMailModel(): MailModel {
	return downcast({
		getUserMailboxDetails: o.spy(() => Promise.resolve(makeMailboxDetail())),

	})
}

export function makeContactModel(contacts: Array<Contact> = []): ContactModel {
	const findContact = (address) => contacts.find((c) => c.mailAddresses.find(a => a.address === address))

	return downcast({
		searchForContact: (address) => Promise.resolve(findContact(address)),
	})
}

function id(element) {
	return ["list", element]
}

export function makeEvent(_id: string, startTime: Date, endTime: Date, uid: string = ""): CalendarEvent {
	return createCalendarEvent({_id: id(_id), startTime, endTime, uid})
}