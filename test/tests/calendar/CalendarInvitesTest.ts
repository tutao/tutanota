import o from "@tutao/otest"
import { CalendarInviteHandler, ReplyResult } from "../../../src/calendar-app/calendar/view/CalendarInvites.js"
import { createTestEntity } from "../TestUtils.js"
import { sysTypeRefs, tutanotaTypeRefs } from "@tutao/typerefs"
import { CalendarAttendeeStatus } from "../../../src/app-env"
import { findAttendeeInAddresses } from "../../../src/common/api/common/utils/CommonCalendarUtils.js"
import { instance, matchers, verify, when } from "testdouble"
import { CalendarModel } from "../../../src/calendar-app/calendar/model/CalendarModel.js"
import { LoginController } from "../../../src/common/api/main/LoginController.js"
import { calendars, makeUserController } from "./CalendarTestUtils.js"
import { UserController } from "../../../src/common/api/main/UserController.js"
import { CalendarNotificationSender } from "../../../src/calendar-app/calendar/view/CalendarNotificationSender.js"
import { SendMailModel } from "../../../src/common/mailFunctionality/SendMailModel.js"
import { MailboxDetail, MailboxModel } from "../../../src/common/mailFunctionality/MailboxModel.js"
import { CalendarEventProgenitor } from "../../../src/common/api/worker/facades/lazy/CalendarFacade"
import { AccountType } from "../../../src/app-env"

o.spec("CalendarInviteHandlerTest", function () {
	let maiboxModel: MailboxModel,
		calendarInviteHandler: CalendarInviteHandler,
		calendarModel: CalendarModel,
		logins: LoginController,
		sendMailModel: SendMailModel
	let calendarNotificationSender: CalendarNotificationSender
	let mailboxDetails: MailboxDetail

	const SENDER_ADDRESS = "sender@example.com"
	const ATTENDEE_ADDRESS = "attendee@example.com"

	let ownAttendee: tutanotaTypeRefs.CalendarEventAttendee
	let mail: tutanotaTypeRefs.Mail
	let event: tutanotaTypeRefs.CalendarEvent

	o.beforeEach(function () {
		event = createTestEntity(tutanotaTypeRefs.CalendarEventTypeRef, {
			uid: "uid",
			organizer: createTestEntity(tutanotaTypeRefs.EncryptedMailAddressTypeRef),
			attendees: [
				createTestEntity(tutanotaTypeRefs.CalendarEventAttendeeTypeRef, {
					address: createTestEntity(tutanotaTypeRefs.EncryptedMailAddressTypeRef, {
						address: SENDER_ADDRESS,
					}),
					status: CalendarAttendeeStatus.ACCEPTED,
				}),
				createTestEntity(tutanotaTypeRefs.CalendarEventAttendeeTypeRef, {
					address: createTestEntity(tutanotaTypeRefs.EncryptedMailAddressTypeRef, {
						address: ATTENDEE_ADDRESS,
					}),
					status: CalendarAttendeeStatus.NEEDS_ACTION,
				}),
			],
			pendingInvitation: true,
		})
		ownAttendee = findAttendeeInAddresses(event.attendees, [ATTENDEE_ADDRESS])!

		const customerId = "customerId"
		const user = {
			_id: "userId",
			customer: customerId,
		} as sysTypeRefs.User
		const userSettingsGroupRoot = createTestEntity(tutanotaTypeRefs.UserSettingsGroupRootTypeRef)
		let userController: Partial<UserController> = makeUserController([], AccountType.FREE, undefined, false, false, user, userSettingsGroupRoot)

		mailboxDetails = {
			mailbox: createTestEntity(tutanotaTypeRefs.MailBoxTypeRef),
			mailGroupInfo: createTestEntity(sysTypeRefs.GroupInfoTypeRef, {
				mailAddress: "mailgroup@addre.ss",
			}),
			mailGroup: createTestEntity(sysTypeRefs.GroupTypeRef),
			mailboxGroupRoot: createTestEntity(tutanotaTypeRefs.MailboxGroupRootTypeRef),
		}
		const mailboxProperties: tutanotaTypeRefs.MailboxProperties = createTestEntity(tutanotaTypeRefs.MailboxPropertiesTypeRef, {})

		maiboxModel = instance(MailboxModel)
		when(maiboxModel.getMailboxProperties(matchers.anything())).thenResolve(mailboxProperties)

		calendarModel = instance(CalendarModel)
		when(calendarModel.getEventsByUid(matchers.anything(), matchers.anything())).thenResolve({
			progenitor: event as CalendarEventProgenitor,
			alteredInstances: [],
		})

		logins = instance(LoginController)
		when(logins.getUserController()).thenReturn(userController)

		calendarNotificationSender = instance(CalendarNotificationSender)

		sendMailModel = instance(SendMailModel)

		calendarInviteHandler = new CalendarInviteHandler(maiboxModel, calendarModel, logins, calendarNotificationSender, async () => {
			return sendMailModel
		})
	})

	o.spec("ReplyToEventInvitation", function () {
		o.spec("Unknown sender - User can reply only from EventBanner", function () {
			/**
			 * An unknown sender means this email is not in our contact list
			 * Therefore there are no pending events in the database since we don't trust them yet
			 */

			o.beforeEach(function () {
				mail = createTestEntity(tutanotaTypeRefs.MailTypeRef)
				mail.sender = tutanotaTypeRefs.createMailAddress({
					address: SENDER_ADDRESS,
					name: "whatever",
					contact: null,
				})
				when(calendarModel.getCalendarInfos()).thenResolve(calendars)
				when(calendarModel.getEventsByUid(matchers.anything(), matchers.anything())).thenResolve(null)
			})

			o.test("Reply no should only sent the response email", async function () {
				o.check(await calendarInviteHandler.replyToEventInvitation(event, ownAttendee!, CalendarAttendeeStatus.DECLINED, mail, mailboxDetails)).equals(
					ReplyResult.ReplySent,
				)
				verify(calendarModel.handleNewCalendarEventInvitationFromIcs(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
				verify(calendarModel.processUpdateToCalendarEventFromIcs(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })

				const calendarEventCaptor = matchers.captor()
				verify(calendarNotificationSender.sendResponse(calendarEventCaptor.capture(), matchers.anything(), matchers.anything()), { times: 1 })
				const capturedCalendarEvent: tutanotaTypeRefs.CalendarEvent = calendarEventCaptor.value
				const calendarEventAttendee = capturedCalendarEvent.attendees.find((attendee) => attendee.address.address === ATTENDEE_ADDRESS)
				o(calendarEventAttendee?.status).equals(CalendarAttendeeStatus.DECLINED)
			})

			o.test("Reply yes or maybe successfully creates an event", async function () {
				o.check(await calendarInviteHandler.replyToEventInvitation(event, ownAttendee!, CalendarAttendeeStatus.ACCEPTED, mail, mailboxDetails)).equals(
					ReplyResult.ReplySent,
				)

				verify(calendarModel.handleNewCalendarEventInvitationFromIcs(matchers.anything(), matchers.anything(), matchers.anything()), { times: 1 })

				verify(calendarModel.processUpdateToCalendarEventFromIcs(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })

				const calendarEventCaptor = matchers.captor()
				verify(calendarNotificationSender.sendResponse(calendarEventCaptor.capture(), matchers.anything(), matchers.anything()), { times: 1 })
				const capturedCalendarEvent: tutanotaTypeRefs.CalendarEvent = calendarEventCaptor.value
				const calendarEventAttendee = capturedCalendarEvent.attendees.find((attendee) => attendee.address.address === ATTENDEE_ADDRESS)
				o(calendarEventAttendee?.status).equals(CalendarAttendeeStatus.ACCEPTED)
			})
		})

		o.spec("Known sender  - User can reply only from EventBanner or eventPreview", function () {
			o.test("respond yes to event from eventBanner", async function () {
				mail = createTestEntity(tutanotaTypeRefs.MailTypeRef)
				mail.sender = tutanotaTypeRefs.createMailAddress({
					address: SENDER_ADDRESS,
					name: "whatever",
					contact: null,
				})
				when(calendarModel.getCalendarInfos()).thenResolve(calendars)

				o.check(await calendarInviteHandler.replyToEventInvitation(event, ownAttendee!, CalendarAttendeeStatus.ACCEPTED, mail, mailboxDetails)).equals(
					ReplyResult.ReplySent,
				)

				const eventCaptor = matchers.captor()
				verify(calendarModel.processUpdateToCalendarEventFromIcs(matchers.anything(), matchers.anything(), eventCaptor.capture()), { times: 1 })
				const capturedEvent = eventCaptor.value
				o.check(capturedEvent.pendingInvitation).equals(false)
				const guestAttendee = capturedEvent.attendees[1]
				o.check(guestAttendee.status).equals(CalendarAttendeeStatus.ACCEPTED)
			})

			o.test("respond no to event from eventBanner should update persisted events", async function () {
				mail = createTestEntity(tutanotaTypeRefs.MailTypeRef)
				mail.sender = tutanotaTypeRefs.createMailAddress({
					address: SENDER_ADDRESS,
					name: "whatever",
					contact: null,
				})
				when(calendarModel.getCalendarInfos()).thenResolve(calendars)

				o.check(await calendarInviteHandler.replyToEventInvitation(event, ownAttendee!, CalendarAttendeeStatus.DECLINED, mail, mailboxDetails)).equals(
					ReplyResult.ReplySent,
				)
				verify(calendarModel.processUpdateToCalendarEventFromIcs(matchers.anything(), matchers.anything(), matchers.anything()), { times: 1 })
			})

			o.test("respond no to event from eventPreview should update persisted events", async function () {
				when(calendarModel.getCalendarInfos()).thenResolve(calendars)

				// previousMail is null because eventPreview is part of calendar app and will not receive a Mail object
				o.check(await calendarInviteHandler.replyToEventInvitation(event, ownAttendee!, CalendarAttendeeStatus.DECLINED, null, mailboxDetails)).equals(
					ReplyResult.ReplySent,
				)

				const eventCaptor = matchers.captor()
				verify(calendarModel.processUpdateToCalendarEventFromIcs(matchers.anything(), matchers.anything(), eventCaptor.capture()), { times: 1 })
				const capturedEvent: tutanotaTypeRefs.CalendarEvent = eventCaptor.value
				o.check(capturedEvent.pendingInvitation).equals(false)
				const guestAttendee = capturedEvent.attendees[1]
				o.check(guestAttendee.status).equals(CalendarAttendeeStatus.DECLINED)
			})

			o.test("respond yes to event on read only shared calendar", async function () {
				const event = createTestEntity(tutanotaTypeRefs.CalendarEventTypeRef, {
					organizer: createTestEntity(tutanotaTypeRefs.EncryptedMailAddressTypeRef, { address: SENDER_ADDRESS, name: "sender" }),
					_ownerGroup: "ownergroup",
					attendees: [
						createTestEntity(tutanotaTypeRefs.CalendarEventAttendeeTypeRef, {
							address: createTestEntity(tutanotaTypeRefs.EncryptedMailAddressTypeRef, {
								address: SENDER_ADDRESS,
							}),
							status: CalendarAttendeeStatus.ACCEPTED,
						}),
						createTestEntity(tutanotaTypeRefs.CalendarEventAttendeeTypeRef, {
							address: createTestEntity(tutanotaTypeRefs.EncryptedMailAddressTypeRef, {
								address: ATTENDEE_ADDRESS,
							}),
							status: CalendarAttendeeStatus.NEEDS_ACTION,
						}),
					],
				})
				mail = createTestEntity(tutanotaTypeRefs.MailTypeRef)
				mail.sender = tutanotaTypeRefs.createMailAddress({
					address: SENDER_ADDRESS,
					name: "whatever",
					contact: null,
				})
				when(calendarModel.getCalendarInfos()).thenResolve(new Map())
				o.check(await calendarInviteHandler.replyToEventInvitation(event, ownAttendee!, CalendarAttendeeStatus.DECLINED, mail, mailboxDetails)).equals(
					ReplyResult.ReplySent,
				)
				verify(calendarModel.processUpdateToCalendarEventFromIcs(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
			})
		})

		o.test("Reply to a confidential email sends out a confidential reply", async function () {
			mail = createTestEntity(tutanotaTypeRefs.MailTypeRef)
			mail.sender = tutanotaTypeRefs.createMailAddress({
				address: SENDER_ADDRESS,
				name: "whatever",
				contact: null,
			})
			mail.confidential = true

			o.check(await calendarInviteHandler.replyToEventInvitation(event, ownAttendee!, CalendarAttendeeStatus.ACCEPTED, mail, mailboxDetails)).equals(
				ReplyResult.ReplySent,
			)

			const calendarEventCaptor = matchers.captor()
			verify(calendarNotificationSender.sendResponse(calendarEventCaptor.capture(), matchers.anything(), matchers.anything()), { times: 1 })
			const capturedCalendarEvent: tutanotaTypeRefs.CalendarEvent = calendarEventCaptor.value
			o(capturedCalendarEvent.invitedConfidentially).equals(mail.confidential)
			verify(sendMailModel.setConfidential(true), { times: 2 })
		})
	})
})
