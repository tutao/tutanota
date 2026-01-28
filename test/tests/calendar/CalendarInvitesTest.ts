import o from "@tutao/otest"
import { CalendarInviteHandler, ReplyResult } from "../../../src/calendar-app/calendar/view/CalendarInvites.js"
import { createTestEntity } from "../TestUtils.js"
import {
	CalendarEvent,
	CalendarEventAttendee,
	CalendarEventAttendeeTypeRef,
	CalendarEventTypeRef,
	createMailAddress,
	EncryptedMailAddressTypeRef,
	Mail,
	MailboxGroupRootTypeRef,
	type MailboxProperties,
	MailboxPropertiesTypeRef,
	MailBoxTypeRef,
	MailTypeRef,
	UserSettingsGroupRootTypeRef,
} from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import { AccountType, CalendarAttendeeStatus } from "../../../src/common/api/common/TutanotaConstants.js"
import { findAttendeeInAddresses } from "../../../src/common/api/common/utils/CommonCalendarUtils.js"
import { instance, matchers, when } from "testdouble"
import { CalendarModel } from "../../../src/calendar-app/calendar/model/CalendarModel.js"
import { LoginController } from "../../../src/common/api/main/LoginController.js"
import { GroupInfoTypeRef, GroupTypeRef, User } from "../../../src/common/api/entities/sys/TypeRefs.js"
import { calendars, makeUserController } from "./CalendarTestUtils.js"
import { UserController } from "../../../src/common/api/main/UserController.js"
import { CalendarNotificationSender } from "../../../src/calendar-app/calendar/view/CalendarNotificationSender.js"
import { mockAttribute, spy, unmockAttribute } from "@tutao/tutanota-test-utils"
import { SendMailModel } from "../../../src/common/mailFunctionality/SendMailModel.js"
import { MailboxDetail, MailboxModel } from "../../../src/common/mailFunctionality/MailboxModel.js"
import { CalendarEventProgenitor } from "../../../src/common/api/worker/facades/lazy/CalendarFacade"

const { anything, argThat } = matchers

o.spec("CalendarInviteHandlerTest", function () {
	let maiboxModel: MailboxModel,
		calendarInviteHandler: CalendarInviteHandler,
		calendarModel: CalendarModel,
		logins: LoginController,
		sendMailModel: SendMailModel
	let calendarNotificationSender: CalendarNotificationSender
	let mailboxDetails: MailboxDetail

	const sender = "sender@example.com"
	const attendee = "attendee@example.com"

	let ownAttendee: CalendarEventAttendee
	let mail: Mail
	let event: CalendarEvent

	o.beforeEach(function () {
		event = createTestEntity(CalendarEventTypeRef, {
			uid: "uid",
			organizer: createTestEntity(EncryptedMailAddressTypeRef),
			attendees: [
				createTestEntity(CalendarEventAttendeeTypeRef, {
					address: createTestEntity(EncryptedMailAddressTypeRef, {
						address: sender,
					}),
					status: CalendarAttendeeStatus.ACCEPTED,
				}),
				createTestEntity(CalendarEventAttendeeTypeRef, {
					address: createTestEntity(EncryptedMailAddressTypeRef, {
						address: attendee,
					}),
					status: CalendarAttendeeStatus.NEEDS_ACTION,
				}),
			],
			pendingInvitation: true,
		})
		ownAttendee = findAttendeeInAddresses(event.attendees, [attendee])!

		const customerId = "customerId"
		const user = {
			_id: "userId",
			customer: customerId,
		} as User
		const userSettingsGroupRoot = createTestEntity(UserSettingsGroupRootTypeRef)
		let userController: Partial<UserController> = makeUserController([], AccountType.FREE, undefined, false, false, user, userSettingsGroupRoot)

		mailboxDetails = {
			mailbox: createTestEntity(MailBoxTypeRef),
			mailGroupInfo: createTestEntity(GroupInfoTypeRef, {
				mailAddress: "mailgroup@addre.ss",
			}),
			mailGroup: createTestEntity(GroupTypeRef),
			mailboxGroupRoot: createTestEntity(MailboxGroupRootTypeRef),
		}
		const mailboxProperties: MailboxProperties = createTestEntity(MailboxPropertiesTypeRef, {})

		maiboxModel = instance(MailboxModel)
		when(maiboxModel.getMailboxProperties(anything())).thenResolve(mailboxProperties)

		calendarModel = instance(CalendarModel)
		when(calendarModel.getEventsByUid(matchers.anything())).thenResolve({ progenitor: event as CalendarEventProgenitor })
		//processCalendarEventMessage is mocked to get call count
		mockAttribute(calendarModel, calendarModel.processCalendarEventMessage, () => Promise.resolve())

		logins = instance(LoginController)
		when(logins.getUserController()).thenReturn(userController)

		calendarNotificationSender = instance(CalendarNotificationSender)

		sendMailModel = instance(SendMailModel)

		calendarInviteHandler = new CalendarInviteHandler(maiboxModel, calendarModel, logins, calendarNotificationSender, async () => {
			return sendMailModel
		})
	})

	o.spec("ReplyToEventInvitation", function () {
		o("respond yes to event from eventBanner", async function () {
			mail = createTestEntity(MailTypeRef)
			mail.sender = createMailAddress({ address: sender, name: "whatever", contact: null })
			when(calendarModel.getCalendarInfos()).thenResolve(calendars)

			const processCalendarUpdate = spy()
			const mockedMethod = mockAttribute(calendarModel, calendarModel.processCalendarUpdate, processCalendarUpdate)

			o(await calendarInviteHandler.replyToEventInvitation(event, ownAttendee!, CalendarAttendeeStatus.ACCEPTED, mail, mailboxDetails)).equals(
				ReplyResult.ReplySent,
			)
			o(calendarModel.processCalendarUpdate.callCount).equals(1)
			const capturedEvent: CalendarEvent = calendarModel.processCalendarUpdate.args[2]
			const guestAttendee = capturedEvent.attendees[1]
			o(guestAttendee.status).equals(CalendarAttendeeStatus.ACCEPTED)
			unmockAttribute(mockedMethod)
		})

		o("respond no to event from eventBanner", async function () {
			mail = createTestEntity(MailTypeRef)
			mail.sender = createMailAddress({ address: sender, name: "whatever", contact: null })
			when(calendarModel.getCalendarInfos()).thenResolve(calendars)

			const deletePersistedEvents = spy()
			const mockedMethod = mockAttribute(calendarModel, calendarModel.deletePersistedEvents, deletePersistedEvents)

			o(await calendarInviteHandler.replyToEventInvitation(event, ownAttendee!, CalendarAttendeeStatus.DECLINED, mail, mailboxDetails)).equals(
				ReplyResult.ReplySent,
			)
			o(calendarModel.deletePersistedEvents.callCount).equals(1)
			const removedEvent: CalendarEvent = calendarModel.deletePersistedEvents.args[0]
			o(removedEvent).deepEquals(event)
			unmockAttribute(mockedMethod)
		})

		o("respond no to event from eventPreview", async function () {
			when(calendarModel.getCalendarInfos()).thenResolve(calendars)

			const processCalendarUpdate = spy()
			const mockedMethod = mockAttribute(calendarModel, calendarModel.processCalendarUpdate, processCalendarUpdate)

			// previousMail is null because eventPreview is part of calendar app and will not receive a Mail object
			o(await calendarInviteHandler.replyToEventInvitation(event, ownAttendee!, CalendarAttendeeStatus.DECLINED, null, mailboxDetails)).equals(
				ReplyResult.ReplySent,
			)

			o(calendarModel.processCalendarUpdate.callCount).equals(1)

			const capturedEvent: CalendarEvent = calendarModel.processCalendarUpdate.args[2]
			const guestAttendee = capturedEvent.attendees[1]
			o(guestAttendee.status).equals(CalendarAttendeeStatus.DECLINED)
			unmockAttribute(mockedMethod)
		})

		o("respond yes to event on read only shared calendar", async function () {
			const event = createTestEntity(CalendarEventTypeRef, {
				organizer: createTestEntity(EncryptedMailAddressTypeRef, { address: sender, name: "sender" }),
				_ownerGroup: "ownergroup",
				attendees: [
					createTestEntity(CalendarEventAttendeeTypeRef, {
						address: createTestEntity(EncryptedMailAddressTypeRef, {
							address: sender,
						}),
						status: CalendarAttendeeStatus.ACCEPTED,
					}),
					createTestEntity(CalendarEventAttendeeTypeRef, {
						address: createTestEntity(EncryptedMailAddressTypeRef, {
							address: attendee,
						}),
						status: CalendarAttendeeStatus.NEEDS_ACTION,
					}),
				],
			})
			const processCalendarUpdate = spy()
			const mockedProcessCalendarUpdate = mockAttribute(calendarModel, calendarModel.processCalendarUpdate, processCalendarUpdate)

			const deletePersistedEvents = spy()
			const mockedDeletePersistedEvents = mockAttribute(calendarModel, calendarModel.deletePersistedEvents, deletePersistedEvents)

			mail = createTestEntity(MailTypeRef)
			mail.sender = createMailAddress({ address: sender, name: "whatever", contact: null })
			when(calendarModel.getCalendarInfos()).thenResolve(new Map())
			o(await calendarInviteHandler.replyToEventInvitation(event, ownAttendee!, CalendarAttendeeStatus.DECLINED, mail, mailboxDetails)).equals(
				ReplyResult.ReplySent,
			)
			o(calendarModel.deletePersistedEvents.callCount).equals(0)
			o(calendarModel.processCalendarUpdate.callCount).equals(0)

			unmockAttribute(mockedProcessCalendarUpdate)
			unmockAttribute(mockedDeletePersistedEvents)
		})
	})
})
