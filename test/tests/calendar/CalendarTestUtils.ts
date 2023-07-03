import { AccountType, ContactAddressType, FeatureType, GroupType, ShareCapability, TimeFormat } from "../../../src/api/common/TutanotaConstants.js"
import type { UserController } from "../../../src/api/main/UserController.js"
import {
	createBookingsRef,
	createCustomer,
	createCustomerInfo,
	createFeature,
	createGroup,
	createGroupInfo,
	createGroupMembership,
	createMailAddressAlias,
	createPlanConfiguration,
	createUser,
	Feature,
	User,
} from "../../../src/api/entities/sys/TypeRefs.js"
import { GENERATED_MAX_ID } from "../../../src/api/common/utils/EntityUtils.js"
import { downcast, LazyLoaded } from "@tutao/tutanota-utils"
import type { CalendarEvent } from "../../../src/api/entities/tutanota/TypeRefs.js"
import {
	createCalendarEvent,
	createCalendarGroupRoot,
	createContact,
	createContactAddress,
	createEncryptedMailAddress,
	createMailBox,
	createMailboxGroupRoot,
	createTutanotaProperties,
	EncryptedMailAddress,
} from "../../../src/api/entities/tutanota/TypeRefs.js"
import type { MailboxDetail } from "../../../src/mail/model/MailModel.js"
import { MailModel } from "../../../src/mail/model/MailModel.js"
import type { CalendarUpdateDistributor } from "../../../src/calendar/date/CalendarUpdateDistributor.js"
import o from "ospec"
import type { CalendarInfo } from "../../../src/calendar/model/CalendarModel"
import { CalendarModel } from "../../../src/calendar/model/CalendarModel"
import { FolderSystem } from "../../../src/api/common/mail/FolderSystem.js"
import { Recipient, RecipientType } from "../../../src/api/common/recipients/Recipient.js"

export const ownerMailAddress = "calendarowner@tutanota.de" as const
export const ownerId = "ownerId" as const
export const calendarGroupId = "0" as const

export const ownerAddress = createEncryptedMailAddress({
	address: ownerMailAddress,
	name: "Calendar Owner",
})
export const ownerRecipient: Recipient = {
	address: ownerAddress.address,
	name: ownerAddress.name,
	type: RecipientType.INTERNAL,
	contact: null,
}
export const ownerAlias = createEncryptedMailAddress({
	address: "calendarowneralias@tutanota.de",
	name: "Calendar Owner Alias",
})
export const ownerAliasRecipient: Recipient = {
	address: ownerAlias.address,
	name: ownerAlias.name,
	type: RecipientType.INTERNAL,
	contact: null,
}
export const otherAddress = createEncryptedMailAddress({
	address: "someone@tutanota.de",
	name: "Some One",
})
export const otherRecipient: Recipient = {
	address: otherAddress.address,
	name: otherAddress.name,
	type: RecipientType.EXTERNAL,
	contact: createContact({
		nickname: otherAddress.name,
		presharedPassword: "otherPassword",
		addresses: [
			createContactAddress({
				address: otherAddress.address,
				type: ContactAddressType.WORK,
			}),
		],
	}),
}
export const otherAddress2 = createEncryptedMailAddress({
	address: "someoneelse@tutanota.de",
	name: "Some One Else",
})
export const otherRecipient2: Recipient = {
	address: otherAddress2.address,
	name: otherAddress2.name,
	type: RecipientType.INTERNAL,
	contact: createContact({
		nickname: otherAddress2.name,
		presharedPassword: "otherPassword2",
		addresses: [
			createContactAddress({
				address: otherAddress2.address,
				type: ContactAddressType.WORK,
			}),
		],
	}),
}

export const calendars: Map<Id, CalendarInfo> = new Map()

calendars.set("ownCalendar", {
	groupRoot: createCalendarGroupRoot({}),
	shared: false,
	longEvents: new LazyLoaded(() => Promise.resolve([])),
	groupInfo: createGroupInfo({}),
	group: createGroup({
		_id: "ownCalendar",
		user: "ownerId",
		type: GroupType.Calendar,
	}),
})

calendars.set("sharedCalendar", {
	groupRoot: createCalendarGroupRoot({}),
	shared: true,
	longEvents: new LazyLoaded(() => Promise.resolve([])),
	groupInfo: createGroupInfo({}),
	group: createGroup({
		_id: "sharedCalendar",
		user: "otherId",
		type: GroupType.Calendar,
	}),
})

export const ownAddresses: ReadonlyArray<EncryptedMailAddress> = [ownerAddress, ownerAlias]

export function makeUserController(
	aliases: Array<string> = [],
	accountType: AccountType = AccountType.PREMIUM,
	defaultSender?: string,
	businessFeatureOrdered: boolean = false,
	isNewPaidPlan: boolean = false,
): UserController {
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
			_id: ownerId,
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
			defaultSender: defaultSender || ownerMailAddress,
		}),
		userGroupInfo: createGroupInfo({
			mailAddressAliases: aliases.map((address) =>
				createMailAddressAlias({
					mailAddress: address,
					enabled: true,
				}),
			),
			mailAddress: ownerMailAddress,
		}),
		userSettingsGroupRoot: {
			timeFormat: TimeFormat.TWENTY_FOUR_HOURS,
		},
		isInternalUser: () => true,
		isFreeAccount: () => true,
		isNewPaidPlan: () => isNewPaidPlan,
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
		getPlanConfig: () =>
			Promise.resolve(
				createPlanConfiguration({
					business: businessFeatureOrdered || isNewPaidPlan,
				}),
			),
	})
}

export function makeMailboxDetail(): MailboxDetail {
	return {
		mailbox: createMailBox(),
		folders: new FolderSystem([]),
		mailGroupInfo: createGroupInfo(),
		mailGroup: createGroup({
			user: ownerId,
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
			user: type === "own" ? ownerId : "anotherUserId",
		}),
		shared: type === "shared",
	}
}

export function makeCalendars(type: "own" | "shared", id: string = calendarGroupId): Map<string, CalendarInfo> {
	const calendarInfo = makeCalendarInfo(type, id)
	return new Map([[id, calendarInfo]])
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

export function addCapability(user: User, groupId: Id, capability: ShareCapability) {
	user.memberships.push(
		createGroupMembership({
			group: groupId,
			capability,
		}),
	)
}
