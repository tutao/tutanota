import o from "@tutao/otest"
import { AccountType, CalendarAttendeeStatus, EndType, RepeatPeriod } from "../../../../src/api/common/TutanotaConstants.js"
import { func, matchers, object, verify, when } from "testdouble"
import { UserController } from "../../../../src/api/main/UserController.js"
import {
	areExcludedDatesEqual,
	areRepeatRulesEqual,
	CalendarEventEditModels,
	CalendarOperation,
	eventHasChanged,
	EventSaveResult,
	makeCalendarEventModel,
} from "../../../../src/calendar/date/eventeditor/CalendarEventModel.js"
import { CalendarNotificationSender } from "../../../../src/calendar/date/CalendarNotificationSender.js"
import { CalendarModel } from "../../../../src/calendar/model/CalendarModel.js"
import {
	createCalendarEvent,
	createCalendarEventAttendee,
	createEncryptedMailAddress,
	createMailBox,
	createMailboxGroupRoot,
	createMailboxProperties,
	MailboxProperties,
} from "../../../../src/api/entities/tutanota/TypeRefs.js"
import { EntityClient } from "../../../../src/api/common/EntityClient.js"
import { calendars, getDateInZone, makeUserController, otherAddress, ownerAddress, ownerAlias, ownerId, ownerMailAddress } from "../CalendarTestUtils.js"
import {
	createAlarmInfo,
	createCalendarEventRef,
	createDateWrapper,
	createGroup,
	createGroupInfo,
	createRepeatRule,
	createUserAlarmInfo,
	DateWrapper,
} from "../../../../src/api/entities/sys/TypeRefs.js"
import { identity, noOp } from "@tutao/tutanota-utils"
import { RecipientsModel, ResolvableRecipient, ResolveMode } from "../../../../src/api/main/RecipientsModel.js"
import { LoginController } from "../../../../src/api/main/LoginController.js"
import { MailboxDetail } from "../../../../src/mail/model/MailModel.js"
import { FolderSystem } from "../../../../src/api/common/mail/FolderSystem.js"
import { SendMailModel } from "../../../../src/mail/editor/SendMailModel.js"

o.spec("CalendarEventModelTest", function () {
	let userController: UserController
	let distributor: CalendarNotificationSender
	let calendarModel: CalendarModel
	let entityClient: EntityClient
	let editModels: CalendarEventEditModels

	o.beforeEach(function () {
		userController = object()
		distributor = object()
		calendarModel = object()
		entityClient = object()

		editModels = {
			alarmModel: object(),
			whenModel: object(),
			whoModel: object(),
			summary: object(),
			description: object(),
			location: object(),
		}
	})

	o.spec("integration tests", function () {
		o("doing no edit operation on an existing event updates it as expected, no updates.", async function () {
			// this test case is insane and only serves as a warning example to not do such things.
			const event = createCalendarEvent({
				sequence: "0",
				_id: ["eventListId", "eventElementId"],
				_ownerGroup: "ownCalendar",
				_permissions: "permissionId",
				summary: "hello event",
				location: "in a boat",
				description: "about 3 inches tall",
				uid: "eventUid",
				hashedUid: null,
				startTime: new Date("2023-04-27T15:00:00.000Z"),
				invitedConfidentially: false,
				endTime: new Date("2023-04-27T15:30:00.000Z"),
				repeatRule: createRepeatRule({
					interval: "10",
					_id: "repeatRuleId",
					endType: EndType.Count,
					endValue: "10",
					frequency: RepeatPeriod.DAILY,
					excludedDates: [],
				}),
				organizer: ownerAddress,
				alarmInfos: [["alarmListId", "alarmElementId"]],
				attendees: [
					createCalendarEventAttendee({
						address: ownerAddress,
						status: CalendarAttendeeStatus.ACCEPTED,
					}),
					createCalendarEventAttendee({
						address: otherAddress,
						status: CalendarAttendeeStatus.ACCEPTED,
					}),
				],
			})
			const recipientsModel: RecipientsModel = object()
			const logins: LoginController = object()
			const userController = makeUserController([ownerAlias.address], AccountType.PAID, ownerMailAddress, true)
			when(logins.getUserController()).thenReturn(userController)
			when(calendarModel.loadAlarms(event.alarmInfos, userController.user)).thenResolve([
				createUserAlarmInfo({
					_id: event.alarmInfos[0],
					alarmInfo: createAlarmInfo({
						alarmIdentifier: "alarmIdentifier",
						trigger: "5M",
						calendarRef: createCalendarEventRef({
							elementId: event._id[1],
							listId: event._id[0],
						}),
					}),
				}),
			])
			when(calendarModel.loadCalendarInfos(matchers.anything())).thenResolve(calendars)
			when(calendarModel.resolveCalendarEventProgenitor(matchers.anything())).thenResolve(event)
			const resolvableOwner: ResolvableRecipient = object()
			when(resolvableOwner.resolved()).thenResolve(ownerAddress)
			const resolvableRecipient: ResolvableRecipient = object()
			when(resolvableRecipient.resolved()).thenResolve(otherAddress)
			const resolvables = [resolvableOwner, resolvableRecipient, resolvableOwner]
			let tryCount = 0
			when(recipientsModel.resolve(matchers.anything(), ResolveMode.Eager)).thenDo(() => resolvables[tryCount++])
			const mailboxDetail: MailboxDetail = {
				mailbox: createMailBox(),
				folders: new FolderSystem([]),
				mailGroupInfo: createGroupInfo(),
				mailGroup: createGroup({
					user: ownerId,
				}),
				mailboxGroupRoot: createMailboxGroupRoot(),
			}
			const mailboxProperties: MailboxProperties = createMailboxProperties({})
			const sendModelFac: () => SendMailModel = func<() => SendMailModel>()
			const model = await makeCalendarEventModel(
				CalendarOperation.EditAll,
				event,
				recipientsModel,
				calendarModel,
				logins,
				mailboxDetail,
				mailboxProperties,
				sendModelFac,
				distributor,
				entityClient,
				null,
				"Europe/Berlin",
				identity,
				noOp,
			)
			const result = await model?.apply()
			o(result).equals(EventSaveResult.Saved)
			verify(
				calendarModel.updateEvent(
					matchers.contains({
						...event,
						sequence: "1",
						alarmInfos: [],
						repeatRule: {
							...event.repeatRule,
							_id: null,
						},
					}),
					matchers.argThat((n) => n.length === 1 && n[0].trigger === "5M"),
					"Europe/Berlin",
					calendars.get("ownCalendar")!.groupRoot,
					event,
				),
				{ times: 1 },
			)
			verify(sendModelFac(), { times: 0 })
		})
	})

	o.spec("eventHasChanged", function () {
		const fixedOrganizer = createEncryptedMailAddress({
			address: "moo@d.de",
			name: "bla",
		})
		const att = (a, n, s) =>
			createCalendarEventAttendee({
				address: createEncryptedMailAddress({ address: a, name: n }),
				status: s,
			})
		// attr, now, previous, expected, msg
		const cases = [
			["alarmInfos", [], ["some", "alarm"], false, "alarmInfos are ignored"],
			["summary", "new", "old", true],
			["location", "here", "there", true],
			["description", "ho", "ha", true],
			["invitedConfidentially", true, false, true],
			["startTime", getDateInZone("2023-05-10T13:30"), getDateInZone("2023-05-15T13:30"), true],
			["endTime", getDateInZone("2023-05-26"), getDateInZone("2023-05-27"), true],
			["uid", "newUid", "oldUid", true],
			["organizer", fixedOrganizer, fixedOrganizer, false, "same object in organizer"],
			["organizer", fixedOrganizer, createEncryptedMailAddress({ address: "moo@d.de", name: "bla" }), false, "same organizer, different object"],
			["organizer", fixedOrganizer, createEncryptedMailAddress({ address: "moo@d.de", name: "blabla" }), false, "different address, same name"],
			["organizer", fixedOrganizer, createEncryptedMailAddress({ address: "moo@d.io", name: "bla" }), true, "same name, different address"],
			["attendees", [], [], false, "no attendees in either event"],
			[
				"attendees",
				[att("b@c.d", "b", CalendarAttendeeStatus.NEEDS_ACTION)],
				[att("b@c.d", "C", CalendarAttendeeStatus.NEEDS_ACTION)],
				false,
				"only names changed",
			],
			[
				"attendees",
				[att("b@c.d", "b", CalendarAttendeeStatus.NEEDS_ACTION)],
				[att("B@C.D", "b", CalendarAttendeeStatus.NEEDS_ACTION)],
				false,
				"only address case changed",
			],
			["attendees", [att("b@c.d", "b", CalendarAttendeeStatus.NEEDS_ACTION)], [], true, "attendee changed"],
			[
				"attendees",
				[att("b@c.d", "b", CalendarAttendeeStatus.NEEDS_ACTION)],
				[att("b@c.d", "b", CalendarAttendeeStatus.ACCEPTED)],
				true,
				"status changed",
			],
			// repeat rule is tested with areRepeatRulesEqual
		] as const

		for (const [attr, now, previous, expected, msg] of cases) {
			o(`${attr} changed -> ${expected}`, function () {
				o(eventHasChanged(createCalendarEvent({ [attr]: now }), createCalendarEvent({ [attr]: previous }))).equals(expected)(msg ?? attr)
				o(eventHasChanged(createCalendarEvent({ [attr]: now }), createCalendarEvent({ [attr]: now }))).equals(false)(`do not change ${msg}`)
			})
		}

		o("same object -> false", function () {
			const event = createCalendarEvent({})
			o(eventHasChanged(event, event)).equals(false)
		})
	})

	const dw = (d) => createDateWrapper({ date: getDateInZone(d) })
	o.spec("areRepeatRulesEqual", function () {
		// property, now, previous, expected, msg
		const cases = [
			["endType", EndType.Never, EndType.Count, false],
			["endValue", "10", "15", false],
			["frequency", RepeatPeriod.DAILY, RepeatPeriod.MONTHLY, false],
			["interval", "10", "15", false],
			["excludedDates", [] as Array<DateWrapper>, [] as Array<DateWrapper>, true, "no exclusions"],
			["excludedDates", [] as Array<DateWrapper>, [dw("2023-02-01")] as Array<DateWrapper>, false, "added exclusion"],
			["excludedDates", [dw("2023-02-01")] as Array<DateWrapper>, [dw("2023-02-01")] as Array<DateWrapper>, true, "same exclusions"],
		] as const

		for (const [attr, now, previous, expected, msg] of cases) {
			o(`${attr} changed -> ${expected}`, function () {
				o(areRepeatRulesEqual(createRepeatRule({ [attr]: now }), createRepeatRule({ [attr]: previous }))).equals(expected)(msg ?? attr)
				o(areRepeatRulesEqual(createRepeatRule({ [attr]: now }), createRepeatRule({ [attr]: now }))).equals(true)(`do not change ${msg}`)
			})
		}
		o("same object -> true", function () {
			const r1 = createRepeatRule({})
			o(areRepeatRulesEqual(r1, r1)).equals(true)
		})
	})

	o.spec("areExcludedDatesEqual", function () {
		o("empty arrays are equal", function () {
			o(areExcludedDatesEqual([], [])).equals(true)
		})
		o("a nonempty array with an empty array is unequal", function () {
			o(areExcludedDatesEqual([], [dw("2023-03-06T13:56")])).equals(false)
			o(areExcludedDatesEqual([dw("2023-03-06T13:56")], [])).equals(false)
		})
		o("nonequal if an array is a subsequence of the other", function () {
			const a = [dw("2023-03-06T13:56"), dw("2023-03-09T13:56")]
			o(areExcludedDatesEqual(a, a.slice(1))).equals(false)
		})

		o("nonequal if the dates are different", function () {
			o(areExcludedDatesEqual([dw("2023-03-06T13:56")], [dw("2023-03-09T13:56")])).equals(false)
		})

		o("equal if the dates are the same", function () {
			o(areExcludedDatesEqual([dw("2023-03-06T13:56")], [dw("2023-03-06T13:56")])).equals(true)
		})
	})
})
