import o from "@tutao/otest"
import { CalendarInviteHandler, ReplyResult } from "../../../src/applications/calendar-app/calendar/view/CalendarInvites.js"
import { createTestEntity } from "../TestUtils.js"

import { findAttendeeInAddresses } from "../../../src/applications/common/api/common/utils/CommonCalendarUtils.js"
import { instance, matchers, object, verify, when } from "testdouble"
import { CalendarInfo, CalendarModel } from "../../../src/applications/calendar-app/calendar/model/CalendarModel.js"
import { LoginController } from "../../../src/applications/common/api/main/LoginController.js"
import { makeCalendarInfo, makeUserController, ownCalendarId } from "./CalendarTestUtils.js"
import { UserController } from "../../../src/applications/common/api/main/UserController.js"
import { CalendarNotificationSender } from "../../../src/applications/calendar-app/calendar/view/CalendarNotificationSender.js"
import { InitAsResponseArgs, SendMailModel } from "../../../src/applications/common/mailFunctionality/SendMailModel.js"
import { MailboxDetail, MailboxModel } from "../../../src/applications/common/mailFunctionality/MailboxModel.js"
import { CalendarEventProgenitor } from "../../../src/applications/common/api/worker/facades/lazy/CalendarFacade"
import {
	CalendarEvent,
	CalendarEventAttendee,
	CalendarEventAttendeeTypeRef,
	CalendarEventTypeRef,
	createMailAddress,
	EncryptedMailAddressTypeRef,
	Mail,
	MailboxGroupRootTypeRef,
	MailboxProperties,
	MailboxPropertiesTypeRef,
	MailBoxTypeRef,
	MailTypeRef,
	UserSettingsGroupRootTypeRef,
} from "@tutao/entities/tutanota"

import { GroupInfoTypeRef, GroupTypeRef, User } from "@tutao/entities/sys"
import { CalendarAttendeeStatus } from "../../../src/entities/tutanota/Utils"
import { AccountType } from "../../../src/entities/sys/Utils"
import { CalendarType } from "../../../src/applications/common/calendar/date/CalendarUtils"

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

	let ownAttendee: CalendarEventAttendee
	let mail: Mail
	let event: CalendarEvent

	const calendarGroupId = "ownCalendarId"

	o.beforeEach(function () {
		event = createTestEntity(CalendarEventTypeRef, {
			uid: "uid",
			organizer: createTestEntity(EncryptedMailAddressTypeRef),
			attendees: [
				createTestEntity(CalendarEventAttendeeTypeRef, {
					address: createTestEntity(EncryptedMailAddressTypeRef, {
						address: SENDER_ADDRESS,
					}),
					status: CalendarAttendeeStatus.ACCEPTED,
				}),
				createTestEntity(CalendarEventAttendeeTypeRef, {
					address: createTestEntity(EncryptedMailAddressTypeRef, {
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

		const calendarInfo: CalendarInfo = makeCalendarInfo(calendarGroupId, true, CalendarType.Private)
		when(calendarModel.getCalendarInfos()).thenResolve(new Map([[calendarGroupId, calendarInfo]]))
	})

	o.spec("ReplyToEventInvitation", function () {
		o.spec("Unknown sender - User can reply only from EventBanner", function () {
			/**
			 * An unknown sender means this email is not in our contact list
			 * Therefore there are no pending events in the database since we don't trust them yet
			 */

			o.beforeEach(function () {
				mail = createTestEntity(MailTypeRef)
				mail.sender = createMailAddress({
					address: SENDER_ADDRESS,
					name: "whatever",
					contact: null,
				})
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
				const capturedCalendarEvent: CalendarEvent = calendarEventCaptor.value
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
				const capturedCalendarEvent: CalendarEvent = calendarEventCaptor.value
				const calendarEventAttendee = capturedCalendarEvent.attendees.find((attendee) => attendee.address.address === ATTENDEE_ADDRESS)
				o(calendarEventAttendee?.status).equals(CalendarAttendeeStatus.ACCEPTED)
			})
		})

		o.spec("Known sender  - User can reply only from EventBanner or eventPreview", function () {
			o.beforeEach(function () {
				event._ownerGroup = calendarGroupId
			})

			o.test("respond yes to event from eventBanner", async function () {
				mail = createTestEntity(MailTypeRef)
				mail.sender = createMailAddress({
					address: SENDER_ADDRESS,
					name: "whatever",
					contact: null,
				})

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
				mail = createTestEntity(MailTypeRef)
				mail.sender = createMailAddress({
					address: SENDER_ADDRESS,
					name: "whatever",
					contact: null,
				})

				o.check(await calendarInviteHandler.replyToEventInvitation(event, ownAttendee!, CalendarAttendeeStatus.DECLINED, mail, mailboxDetails)).equals(
					ReplyResult.ReplySent,
				)
				verify(calendarModel.processUpdateToCalendarEventFromIcs(matchers.anything(), matchers.anything(), matchers.anything()), { times: 1 })
			})

			o.test("respond no to event from eventPreview should update persisted events", async function () {
				// previousMail is null because eventPreview is part of calendar app and will not receive a Mail object
				o.check(await calendarInviteHandler.replyToEventInvitation(event, ownAttendee!, CalendarAttendeeStatus.DECLINED, null, mailboxDetails)).equals(
					ReplyResult.ReplySent,
				)

				const eventCaptor = matchers.captor()
				verify(calendarModel.processUpdateToCalendarEventFromIcs(matchers.anything(), matchers.anything(), eventCaptor.capture()), { times: 1 })
				const capturedEvent: CalendarEvent = eventCaptor.value
				o.check(capturedEvent.pendingInvitation).equals(false)
				const guestAttendee = capturedEvent.attendees[1]
				o.check(guestAttendee.status).equals(CalendarAttendeeStatus.DECLINED)
			})

			o.test("respond yes to event on read only shared calendar", async function () {
				const event = createTestEntity(CalendarEventTypeRef, {
					organizer: createTestEntity(EncryptedMailAddressTypeRef, { address: SENDER_ADDRESS, name: "sender" }),
					_ownerGroup: "ownergroup",
					attendees: [
						createTestEntity(CalendarEventAttendeeTypeRef, {
							address: createTestEntity(EncryptedMailAddressTypeRef, {
								address: SENDER_ADDRESS,
							}),
							status: CalendarAttendeeStatus.ACCEPTED,
						}),
						createTestEntity(CalendarEventAttendeeTypeRef, {
							address: createTestEntity(EncryptedMailAddressTypeRef, {
								address: ATTENDEE_ADDRESS,
							}),
							status: CalendarAttendeeStatus.NEEDS_ACTION,
						}),
					],
				})
				mail = createTestEntity(MailTypeRef)
				mail.sender = createMailAddress({
					address: SENDER_ADDRESS,
					name: "whatever",
					contact: null,
				})
				o.check(await calendarInviteHandler.replyToEventInvitation(event, ownAttendee!, CalendarAttendeeStatus.DECLINED, mail, mailboxDetails)).equals(
					ReplyResult.ReplySent,
				)
				verify(calendarModel.processUpdateToCalendarEventFromIcs(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
			})
		})

		o.test("Reply from eventPreview sends email with invited address", async function () {
			const ownAlias = "own-alias@tuta.io"

			event.attendees = [
				createTestEntity(CalendarEventAttendeeTypeRef, {
					address: createTestEntity(EncryptedMailAddressTypeRef, {
						address: SENDER_ADDRESS,
					}),
					status: CalendarAttendeeStatus.ACCEPTED,
				}),
				createTestEntity(CalendarEventAttendeeTypeRef, {
					address: createTestEntity(EncryptedMailAddressTypeRef, {
						address: ownAlias,
					}),
					status: CalendarAttendeeStatus.NEEDS_ACTION,
				}),
			]
			ownAttendee = findAttendeeInAddresses(event.attendees, [ownAlias])!

			const replyResult = await calendarInviteHandler.replyToEventInvitation(event, ownAttendee, CalendarAttendeeStatus.ACCEPTED, null, mailboxDetails)
			o.check(replyResult).equals(ReplyResult.ReplySent)

			const notificationSenderCaptor = matchers.captor()
			verify(calendarNotificationSender.sendResponse(matchers.anything(), notificationSenderCaptor.capture(), matchers.anything()), { times: 1 })

			const responseModel: SendMailModel = notificationSenderCaptor.value
			verify(responseModel.initWithTemplate({}, "", "", [], false, ownAlias), { times: 1 })
		})

		o.test("Reply from eventBanner sends email with invited address", async function () {
			const ownAlias = "own-alias@tuta.io"

			event.attendees = [
				createTestEntity(CalendarEventAttendeeTypeRef, {
					address: createTestEntity(EncryptedMailAddressTypeRef, {
						address: SENDER_ADDRESS,
					}),
					status: CalendarAttendeeStatus.ACCEPTED,
				}),
				createTestEntity(CalendarEventAttendeeTypeRef, {
					address: createTestEntity(EncryptedMailAddressTypeRef, {
						address: ownAlias,
					}),
					status: CalendarAttendeeStatus.NEEDS_ACTION,
				}),
			]
			ownAttendee = findAttendeeInAddresses(event.attendees, [ownAlias])!

			const mockPreviousMail: Mail = object()

			const replyResult = await calendarInviteHandler.replyToEventInvitation(
				event,
				ownAttendee,
				CalendarAttendeeStatus.ACCEPTED,
				mockPreviousMail,
				mailboxDetails,
			)
			o.check(replyResult).equals(ReplyResult.ReplySent)

			const notificationSenderCaptor = matchers.captor()
			verify(calendarNotificationSender.sendResponse(matchers.anything(), notificationSenderCaptor.capture(), matchers.anything()), { times: 1 })

			const responseModel: SendMailModel = notificationSenderCaptor.value
			verify(
				responseModel.initAsResponse(
					matchers.argThat((args: InitAsResponseArgs) => args.senderMailAddress === ownAlias),
					matchers.anything(),
				),
				{ times: 1 },
			)
		})

		o.test("Reply to a confidential email sends out a confidential reply", async function () {
			mail = createTestEntity(MailTypeRef)
			mail.sender = createMailAddress({
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

			const capturedCalendarEvent: CalendarEvent = calendarEventCaptor.value
			o(capturedCalendarEvent.invitedConfidentially).equals(mail.confidential)
			verify(sendMailModel.setConfidential(true), { times: 2 })
		})
	})
})
