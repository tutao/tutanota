import { FeatureType, PresentableKeyVerificationState, ShareCapability, TimeFormat } from "../../../src/app-env"
import type { UserController } from "../../../src/common/api/main/UserController.js"
import { GENERATED_MAX_ID, sysTypeRefs, tutanotaTypeRefs } from "@tutao/typerefs"
import { downcast, LazyLoaded } from "@tutao/utils"
import type { CalendarInfo } from "../../../src/calendar-app/calendar/model/CalendarModel"
import { Recipient, RecipientType } from "../../../src/common/api/common/recipients/Recipient.js"
import { DateTime } from "luxon"
import { createTestEntity } from "../TestUtils.js"
import { matchers, object, when } from "testdouble"
import { AlarmScheduler } from "../../../src/common/calendar/date/AlarmScheduler.js"
import { CalendarType } from "../../../src/common/calendar/date/CalendarUtils"
import { EventWrapper } from "../../../src/calendar-app/calendar/view/CalendarViewModel"
import { AccountType, ContactAddressType, GroupType } from "../../../src/app-env"

export const ownerMailAddress = "calendarowner@tutanota.de" as const
export const ownerId = "ownerId" as const
export const calendarGroupId = "0" as const

export const ownerAddress = tutanotaTypeRefs.createEncryptedMailAddress({
	address: ownerMailAddress,
	name: "Calendar Owner",
})
export const ownerRecipient: Recipient = {
	address: ownerAddress.address,
	name: ownerAddress.name,
	type: RecipientType.INTERNAL,
	contact: null,
	verificationState: PresentableKeyVerificationState.NONE,
}
export const ownerAlias = tutanotaTypeRefs.createEncryptedMailAddress({
	address: "calendarowneralias@tutanota.de",
	name: "Calendar Owner Alias",
})
export const ownerAliasRecipient: Recipient = {
	address: ownerAlias.address,
	name: ownerAlias.name,
	type: RecipientType.INTERNAL,
	contact: null,
	verificationState: PresentableKeyVerificationState.NONE,
}
export const otherAddress = tutanotaTypeRefs.createEncryptedMailAddress({
	address: "someone@tutanota.de",
	name: "Some One",
})
export const otherRecipient: Recipient = {
	address: otherAddress.address,
	name: otherAddress.name,
	type: RecipientType.EXTERNAL,
	contact: createTestEntity(tutanotaTypeRefs.ContactTypeRef, {
		nickname: otherAddress.name,
		presharedPassword: "otherPassword",
		addresses: [
			createTestEntity(tutanotaTypeRefs.ContactAddressTypeRef, {
				address: otherAddress.address,
				type: ContactAddressType.WORK,
			}),
		],
	}),
	verificationState: PresentableKeyVerificationState.NONE,
}
export const otherAddress2 = tutanotaTypeRefs.createEncryptedMailAddress({
	address: "someoneelse@tutanota.de",
	name: "Some One Else",
})
export const otherRecipient2: Recipient = {
	address: otherAddress2.address,
	name: otherAddress2.name,
	type: RecipientType.INTERNAL,
	contact: createTestEntity(tutanotaTypeRefs.ContactTypeRef, {
		nickname: otherAddress2.name,
		presharedPassword: "otherPassword2",
		addresses: [
			createTestEntity(tutanotaTypeRefs.ContactAddressTypeRef, {
				address: otherAddress2.address,
				type: ContactAddressType.WORK,
			}),
		],
	}),
	verificationState: PresentableKeyVerificationState.NONE,
}

export const thirdAddress = tutanotaTypeRefs.createEncryptedMailAddress({
	address: "somethirdaddress@tuta.com",
	name: "thirdperson",
})
export const thirdRecipient: Recipient = {
	address: thirdAddress.address,
	name: thirdAddress.name,
	type: RecipientType.INTERNAL,
	contact: createTestEntity(tutanotaTypeRefs.ContactTypeRef, {
		nickname: "drei",
		presharedPassword: "noPassword",
		addresses: [
			createTestEntity(tutanotaTypeRefs.ContactAddressTypeRef, {
				address: thirdAddress.address,
				type: ContactAddressType.OTHER,
			}),
		],
	}),
	verificationState: PresentableKeyVerificationState.NONE,
}

export const calendars: ReadonlyMap<Id, CalendarInfo> = new Map([
	[
		"ownCalendar",
		{
			id: "ownCalendar",
			name: "Private Calendar",
			color: "",
			groupRoot: createTestEntity(tutanotaTypeRefs.CalendarGroupRootTypeRef, {}),
			hasMultipleMembers: false,
			userIsOwner: true,
			longEvents: new LazyLoaded(() => Promise.resolve([])),
			groupInfo: createTestEntity(sysTypeRefs.GroupInfoTypeRef, {}),
			group: createTestEntity(sysTypeRefs.GroupTypeRef, {
				_id: "ownCalendar",
				user: "ownerId",
				type: GroupType.Calendar,
			}),
			isExternal: false,
			type: CalendarType.Private,
		},
	],
	[
		"ownSharedCalendar",
		{
			id: "ownSharedCalendar",
			name: "Owned Shared Calendar",
			color: "",
			groupRoot: createTestEntity(tutanotaTypeRefs.CalendarGroupRootTypeRef, {}),
			hasMultipleMembers: true,
			userIsOwner: true,
			longEvents: new LazyLoaded(() => Promise.resolve([])),
			groupInfo: createTestEntity(sysTypeRefs.GroupInfoTypeRef, {}),
			group: createTestEntity(sysTypeRefs.GroupTypeRef, {
				_id: "ownSharedCalendar",
				user: "ownerId",
				type: GroupType.Calendar,
			}),
			isExternal: false,
			type: CalendarType.Shared,
		},
	],
	[
		"ownExternalCalendar",
		{
			id: "ownExternalCalendar",
			name: "External Calendar",
			color: "",
			groupRoot: createTestEntity(tutanotaTypeRefs.CalendarGroupRootTypeRef, {}),
			hasMultipleMembers: false,
			userIsOwner: true,
			longEvents: new LazyLoaded(() => Promise.resolve([])),
			groupInfo: createTestEntity(sysTypeRefs.GroupInfoTypeRef, {}),
			group: createTestEntity(sysTypeRefs.GroupTypeRef, {
				_id: "ownExternalCalendar",
				user: "ownerId",
				type: GroupType.Calendar,
			}),
			isExternal: true,
			type: CalendarType.External,
		},
	],
	[
		"sharedCalendar",
		{
			id: "sharedCalendar",
			name: "Shared Calendar",
			color: "",
			groupRoot: createTestEntity(tutanotaTypeRefs.CalendarGroupRootTypeRef, {}),
			hasMultipleMembers: true,
			userIsOwner: false,
			longEvents: new LazyLoaded(() => Promise.resolve([])),
			groupInfo: createTestEntity(sysTypeRefs.GroupInfoTypeRef, {}),
			group: createTestEntity(sysTypeRefs.GroupTypeRef, {
				_id: "sharedCalendar",
				user: "otherId",
				type: GroupType.Calendar,
			}),
			isExternal: false,
			type: CalendarType.Shared,
		},
	],
])

export const ownAddresses: ReadonlyArray<tutanotaTypeRefs.EncryptedMailAddress> = [ownerAddress, ownerAlias]

export function makeUserController(
	aliases: Array<string> = [],
	accountType: AccountType = AccountType.PAID,
	defaultSender?: string,
	businessFeatureOrdered: boolean = false,
	isNewPaidPlan: boolean = false,
	user?: sysTypeRefs.User,
	userSettingsGroupRoot?: tutanotaTypeRefs.UserSettingsGroupRoot,
): UserController {
	const bookingsRef = createTestEntity(sysTypeRefs.BookingsRefTypeRef, {
		items: GENERATED_MAX_ID,
	})
	const customizations: sysTypeRefs.Feature[] = []

	if (businessFeatureOrdered) {
		customizations.push(
			createTestEntity(sysTypeRefs.FeatureTypeRef, {
				feature: FeatureType.BusinessFeatureEnabled,
			}),
		)
	}

	return downcast({
		user: createTestEntity(sysTypeRefs.UserTypeRef, {
			_id: ownerId,
			memberships: [
				createTestEntity(sysTypeRefs.GroupMembershipTypeRef, {
					groupType: GroupType.Mail,
				}),
				createTestEntity(sysTypeRefs.GroupMembershipTypeRef, {
					groupType: GroupType.Contact,
				}),
			],
			accountType,
			...user,
		}),
		props: createTestEntity(tutanotaTypeRefs.TutanotaPropertiesTypeRef, {
			defaultSender: defaultSender || ownerMailAddress,
		}),
		userGroupInfo: createTestEntity(sysTypeRefs.GroupInfoTypeRef, {
			mailAddressAliases: aliases.map((address) =>
				createTestEntity(sysTypeRefs.MailAddressAliasTypeRef, {
					mailAddress: address,
					enabled: true,
				}),
			),
			mailAddress: ownerMailAddress,
		}),
		userSettingsGroupRoot: {
			timeFormat: TimeFormat.TWENTY_FOUR_HOURS,
			groupSettings: [],
			...userSettingsGroupRoot,
		},
		isInternalUser: () => true,
		isFreeAccount: () => true,
		isNewPaidPlan: () => isNewPaidPlan,
		loadCustomer: () =>
			Promise.resolve(
				createTestEntity(sysTypeRefs.CustomerTypeRef, {
					customizations: customizations,
				}),
			),
		loadCustomerInfo: () =>
			Promise.resolve(
				createTestEntity(sysTypeRefs.CustomerInfoTypeRef, {
					bookings: bookingsRef,
				}),
			),
		getCalendarMemberships: () => {
			//TODO
			return []
		},
		getPlanConfig: () =>
			Promise.resolve(
				createTestEntity(sysTypeRefs.PlanConfigurationTypeRef, {
					eventInvites: businessFeatureOrdered || isNewPaidPlan,
				}),
			),
	})
}

export function makeCalendarInfo(id: string, isOwner: boolean, calendarType: CalendarType): CalendarInfo {
	return {
		id: id,
		name: "",
		color: "",
		groupRoot: downcast({
			longEvents: "longEventsList",
			shortEvents: "shortEventsList",
		}),
		groupInfo: downcast({}),
		group: createTestEntity(sysTypeRefs.GroupTypeRef, {
			_id: id,
			type: GroupType.Calendar,
			user: isOwner ? ownerId : "anotherUserId",
		}),
		hasMultipleMembers: isOwner && calendarType === CalendarType.Shared,
		userIsOwner: isOwner && calendarType === CalendarType.Private,
		isExternal: isOwner && calendarType === CalendarType.External,
		type: calendarType,
	}
}

function id(element: string): IdTuple {
	return ["list", element]
}

export function makeEventWrapper(event: tutanotaTypeRefs.CalendarEvent, props?: Partial<EventWrapper>): EventWrapper {
	return {
		color: "#FAFAFA",
		event,
		flags: {
			isAlteredInstance: false,
			hasAlarms: false,
		},
		...(props != null ? props : {}),
	}
}

export function makeEvent(_id: string, startTime: Date, endTime: Date, uid: string = ""): EventWrapper {
	return makeEventWrapper(
		createTestEntity(tutanotaTypeRefs.CalendarEventTypeRef, {
			_ownerGroup: "ownerGroup",
			_id: id(_id),
			startTime,
			endTime,
			uid,
		}),
	)
}

export function addCapability(user: sysTypeRefs.User, groupId: Id, capability: ShareCapability) {
	user.memberships.push(
		createTestEntity(sysTypeRefs.GroupMembershipTypeRef, {
			group: groupId,
			capability,
		}),
	)
}

export const zone = "Europe/Berlin"

/** create a js date object corresponding to the given ISO-like date string (YYYY-MM-DDTHH:MM)in
 * the {@param useZone} time zone, which defaults to Europe/Berlin (UTC+2)
 * times can be omitted.
 * */
export function getDateInZone(iso: string, useZone = zone): Date {
	const dt = DateTime.fromISO(iso, { zone: useZone })
	if (!dt.isValid) {
		throw new Error(`Invalid date! ${iso} ${dt.invalidExplanation}`)
	}
	return dt.toJSDate()
}

/** create a js date object corresponding to the given ISO-like date string (YYYY-MM-DDTHH:MM)in
 * the utc time zone
 * times can be omitted.
 * */
export function getDateInUTC(iso: string): Date {
	const dt = DateTime.fromISO(iso, { zone: "utc" })
	if (!dt.isValid) {
		throw new Error(`Invalid date! ${iso} ${dt.invalidExplanation}`)
	}
	return dt.toJSDate()
}

export function makeAlarmScheduler(): AlarmScheduler {
	const scheduler: AlarmScheduler = object()
	when(scheduler.scheduleAlarm(matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything)).thenReturn(undefined)
	when(scheduler.cancelAlarm(matchers.anything())).thenReturn(undefined)
	return scheduler
}
