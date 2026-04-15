import o from "@tutao/otest"
import { CalendarAttendeeStatus, EndType, RepeatPeriod } from "../../../../src/app-env"
import { func, matchers, object, verify, when } from "testdouble"
import {
	CalendarOperation,
	eventHasChanged,
	EventSaveResult,
	makeCalendarEventModel,
} from "../../../../src/calendar-app/calendar/gui/eventeditor-model/CalendarEventModel.js"
import { CalendarNotificationSender } from "../../../../src/calendar-app/calendar/view/CalendarNotificationSender.js"
import { CalendarModel } from "../../../../src/calendar-app/calendar/model/CalendarModel.js"
import { sysTypeRefs, tutanotaTypeRefs } from "@tutao/typerefs"
import { EntityClient } from "../../../../src/common/api/common/EntityClient.js"
import { calendars, getDateInZone, makeUserController, otherAddress, ownerAddress, ownerAlias, ownerId, ownerMailAddress } from "../CalendarTestUtils.js"
import { clone, identity, noOp } from "@tutao/utils"
import { RecipientsModel, ResolvableRecipient } from "../../../../src/common/api/main/RecipientsModel.js"
import { LoginController } from "../../../../src/common/api/main/LoginController.js"
import { createTestEntity } from "../../TestUtils.js"
import { areExcludedDatesEqual, areRepeatRulesEqual } from "../../../../src/common/calendar/date/CalendarUtils.js"
import { SendMailModel } from "../../../../src/common/mailFunctionality/SendMailModel.js"
import { MailboxDetail } from "../../../../src/common/mailFunctionality/MailboxModel.js"
import { CalendarInviteHandler } from "../../../../src/calendar-app/calendar/view/CalendarInvites"
import { AccountType } from "../../../../src/app-env"

o.spec("CalendarEventModel", function () {
	let distributor: CalendarNotificationSender
	let calendarModel: CalendarModel
	let entityClient: EntityClient

	o.beforeEach(function () {
		distributor = object()
		calendarModel = object()
		entityClient = object()
	})

	o.spec("integration tests", function () {
		o("doing no edit operation on an existing event updates it as expected, no updates.", async function () {
			// this test case is insane and only serves as a warning example to not do such things.
			const event = createTestEntity(tutanotaTypeRefs.CalendarEventTypeRef, {
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
				repeatRule: createTestEntity(sysTypeRefs.RepeatRuleTypeRef, {
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
					tutanotaTypeRefs.createCalendarEventAttendee({
						address: ownerAddress,
						status: CalendarAttendeeStatus.ACCEPTED,
					}),
					tutanotaTypeRefs.createCalendarEventAttendee({
						address: otherAddress,
						status: CalendarAttendeeStatus.ACCEPTED,
					}),
				],
			})
			const recipientsModel: RecipientsModel = object()
			const logins: LoginController = object()
			const userSettingsGroupRoot = createTestEntity(tutanotaTypeRefs.UserSettingsGroupRootTypeRef, { groupSettings: [] })

			const userController = makeUserController([ownerAlias.address], AccountType.PAID, ownerMailAddress, true, false, undefined, userSettingsGroupRoot)
			when(logins.getUserController()).thenReturn(userController)

			when(calendarModel.loadAlarms(event.alarmInfos, userController.user)).thenResolve([
				createTestEntity(sysTypeRefs.UserAlarmInfoTypeRef, {
					_id: event.alarmInfos[0],
					alarmInfo: createTestEntity(sysTypeRefs.AlarmInfoTypeRef, {
						alarmIdentifier: "alarmIdentifier",
						trigger: "5M",
						calendarRef: createTestEntity(sysTypeRefs.CalendarEventRefTypeRef, {
							elementId: event._id[1],
							listId: event._id[0],
						}),
					}),
				}),
			])
			when(calendarModel.getCalendarInfos()).thenResolve(calendars)
			when(calendarModel.resolveCalendarEventProgenitor(matchers.anything())).thenResolve(event)

			const resolvableOwner: ResolvableRecipient = object()
			when(resolvableOwner.resolve()).thenResolve(ownerAddress)

			const resolvableRecipient: ResolvableRecipient = object()
			when(resolvableRecipient.resolve()).thenResolve(otherAddress)
			const resolvables = [resolvableOwner, resolvableRecipient, resolvableOwner]

			let tryCount = 0
			when(recipientsModel.initialize(matchers.anything())).thenDo(() => resolvables[tryCount++])

			const mailboxDetail: MailboxDetail = {
				mailbox: createTestEntity(tutanotaTypeRefs.MailBoxTypeRef),
				mailGroupInfo: createTestEntity(sysTypeRefs.GroupInfoTypeRef),
				mailGroup: createTestEntity(sysTypeRefs.GroupTypeRef, {
					user: ownerId,
				}),
				mailboxGroupRoot: createTestEntity(tutanotaTypeRefs.MailboxGroupRootTypeRef),
			}
			const mailboxProperties: tutanotaTypeRefs.MailboxProperties = createTestEntity(tutanotaTypeRefs.MailboxPropertiesTypeRef, {})
			const sendModelFac: () => SendMailModel = func<() => SendMailModel>()
			const mockCalendarInviteHandler: CalendarInviteHandler = object()

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
				mockCalendarInviteHandler,
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
							timeZone: "Europe/Berlin",
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
		const fixedOrganizer = createTestEntity(tutanotaTypeRefs.EncryptedMailAddressTypeRef, {
			address: "moo@d.de",
			name: "bla",
		})
		const att = (a, n, s) =>
			createTestEntity(tutanotaTypeRefs.CalendarEventAttendeeTypeRef, {
				address: createTestEntity(tutanotaTypeRefs.EncryptedMailAddressTypeRef, { address: a, name: n }),
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
			[
				"organizer",
				fixedOrganizer,
				createTestEntity(tutanotaTypeRefs.EncryptedMailAddressTypeRef, { address: "moo@d.de", name: "bla" }),
				false,
				"same organizer, different object",
			],
			[
				"organizer",
				fixedOrganizer,
				createTestEntity(tutanotaTypeRefs.EncryptedMailAddressTypeRef, { address: "moo@d.de", name: "blabla" }),
				false,
				"different address, same name",
			],
			[
				"organizer",
				fixedOrganizer,
				createTestEntity(tutanotaTypeRefs.EncryptedMailAddressTypeRef, { address: "moo@d.io", name: "bla" }),
				true,
				"same name, different address",
			],
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
				// createCalendarEvent will create events with a startTime and endTime created by "new Date()",
				// which is not repeatable, so we only do it once.
				const template = createTestEntity(tutanotaTypeRefs.CalendarEventTypeRef, { [attr]: previous })
				const copy = Object.assign({}, template, { [attr]: now })
				o(eventHasChanged(copy, template)).equals(expected)(msg ?? attr)
				o(eventHasChanged(copy, clone(copy))).equals(false)(`do not change ${msg}`)
			})
		}

		o("same object -> false", function () {
			const event = createTestEntity(tutanotaTypeRefs.CalendarEventTypeRef, {})
			o(eventHasChanged(event, event)).equals(false)
		})
	})

	const dw = (d) => createTestEntity(sysTypeRefs.DateWrapperTypeRef, { date: getDateInZone(d) })
	o.spec("areRepeatRulesEqual", function () {
		// property, now, previous, expected, msg
		const cases = [
			["endType", EndType.Never, EndType.Count, false],
			["endValue", "10", "15", false],
			["frequency", RepeatPeriod.DAILY, RepeatPeriod.MONTHLY, false],
			["interval", "10", "15", false],
			["excludedDates", [] as Array<sysTypeRefs.DateWrapper>, [] as Array<sysTypeRefs.DateWrapper>, true, "no exclusions"],
			["excludedDates", [] as Array<sysTypeRefs.DateWrapper>, [dw("2023-02-01")] as Array<sysTypeRefs.DateWrapper>, false, "added exclusion"],
			[
				"excludedDates",
				[dw("2023-02-01")] as Array<sysTypeRefs.DateWrapper>,
				[dw("2023-02-01")] as Array<sysTypeRefs.DateWrapper>,
				true,
				"same exclusions",
			],
		] as const

		for (const [attr, now, previous, expected, msg] of cases) {
			o(`${attr} changed -> ${expected}`, function () {
				o(
					areRepeatRulesEqual(
						createTestEntity(sysTypeRefs.RepeatRuleTypeRef, { [attr]: now }),
						createTestEntity(sysTypeRefs.RepeatRuleTypeRef, { [attr]: previous }),
					),
				).equals(expected)(msg ?? attr)
				o(
					areRepeatRulesEqual(
						createTestEntity(sysTypeRefs.RepeatRuleTypeRef, { [attr]: now }),
						createTestEntity(sysTypeRefs.RepeatRuleTypeRef, { [attr]: now }),
					),
				).equals(true)(`do not change ${msg}`)
			})
		}
		o("same object -> true", function () {
			const r1 = createTestEntity(sysTypeRefs.RepeatRuleTypeRef, {})
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
