import o from "ospec"
import { AccountType, CalendarAttendeeStatus, EndType, RepeatPeriod } from "../../../../src/api/common/TutanotaConstants.js"
import { func, matchers, object, verify, when } from "testdouble"
import { UserController } from "../../../../src/api/main/UserController.js"
import {
	CalendarEventEditModels,
	CalendarEventModel,
	EventSaveResult,
	EventType,
	makeCalendarEventModel,
} from "../../../../src/calendar/date/eventeditor/CalendarEventModel.js"
import { CalendarUpdateDistributor } from "../../../../src/calendar/date/CalendarUpdateDistributor.js"
import { CalendarModel } from "../../../../src/calendar/model/CalendarModel.js"
import {
	createCalendarEvent,
	createCalendarEventAttendee,
	createMailBox,
	createMailboxGroupRoot,
	createMailboxProperties,
	MailboxProperties,
} from "../../../../src/api/entities/tutanota/TypeRefs.js"
import { EntityClient } from "../../../../src/api/common/EntityClient.js"
import { calendars, makeUserController, otherAddress, ownerAddress, ownerAlias, ownerId, ownerMailAddress } from "../CalendarTestUtils.js"
import {
	createAlarmInfo,
	createCalendarEventRef,
	createGroup,
	createGroupInfo,
	createRepeatRule,
	createUserAlarmInfo,
} from "../../../../src/api/entities/sys/TypeRefs.js"
import { identity, noOp } from "@tutao/tutanota-utils"
import { RecipientsModel, ResolvableRecipient, ResolveMode } from "../../../../src/api/main/RecipientsModel.js"
import { LoginController } from "../../../../src/api/main/LoginController.js"
import { MailboxDetail } from "../../../../src/mail/model/MailModel.js"
import { FolderSystem } from "../../../../src/api/common/mail/FolderSystem.js"
import { SendMailModel } from "../../../../src/mail/editor/SendMailModel.js"

o.spec("CalendarEventModelTest", function () {
	let userController: UserController
	let distributor: CalendarUpdateDistributor
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
			const userController = makeUserController([ownerAlias.address], AccountType.PREMIUM, ownerMailAddress, true)
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
			const result = await model.updateExistingEvent()
			o(result).equals(EventSaveResult.Saved)
			verify(
				calendarModel.updateEvent(
					matchers.contains({
						...event,
						sequence: "0",
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

	o.spec("sending invites availability", async function () {
		o("not available for free users will is true for free accounts", async function () {
			const userController = makeUserController([], AccountType.FREE, "", false)
			const model = new CalendarEventModel(
				null,
				EventType.OWN,
				editModels,
				userController,
				distributor,
				calendarModel,
				entityClient,
				calendars,
				"Europe/Berlin",
				null,
			)
			const notAvailable = model.shouldShowSendInviteNotAvailable()
			o(notAvailable).equals(true)
		})
		o("not available for premium users without business subscription", async function () {
			const userController = makeUserController([], AccountType.PREMIUM, "", false)
			const model = new CalendarEventModel(
				null,
				EventType.OWN,
				editModels,
				userController,
				distributor,
				calendarModel,
				entityClient,
				calendars,
				"Europe/Berlin",
				null,
			)
			await model.initialized
			const notAvailable = model.shouldShowSendInviteNotAvailable()
			o(notAvailable).equals(true)
		})
		o("available for premium users with business subscription", async function () {
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			const model = new CalendarEventModel(
				null,
				EventType.OWN,
				editModels,
				userController,
				distributor,
				calendarModel,
				entityClient,
				calendars,
				"Europe/Berlin",
				null,
			)
			await model.initialized
			const notAvailable = model.shouldShowSendInviteNotAvailable()
			o(notAvailable).equals(false)
		})
		o("available for external users", async function () {
			const userController = makeUserController([], AccountType.EXTERNAL, "", false)
			const model = new CalendarEventModel(
				null,
				EventType.OWN,
				editModels,
				userController,
				distributor,
				calendarModel,
				entityClient,
				calendars,
				"Europe/Berlin",
				null,
			)
			await model.initialized
			const notAvailable = model.shouldShowSendInviteNotAvailable()
			o(notAvailable).equals(false)
		})
	})
})
