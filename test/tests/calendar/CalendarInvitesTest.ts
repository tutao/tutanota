import o from "@tutao/otest"
import { CalendarInviteHandler, ReplyResult } from "../../../src/calendar-app/view/CalendarInvites.js"
import { createTestEntity } from "../TestUtils.js"
import {
	CalendarEventAttendeeTypeRef,
	CalendarEventTypeRef,
	createMailAddress,
	EncryptedMailAddressTypeRef,
	MailboxGroupRootTypeRef,
	type MailboxProperties,
	MailboxPropertiesTypeRef,
	MailBoxTypeRef,
	MailTypeRef,
} from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import { CalendarAttendeeStatus } from "../../../src/common/api/common/TutanotaConstants.js"
import { findAttendeeInAddresses } from "../../../src/common/api/common/utils/CommonCalendarUtils.js"
import { MailboxDetail, MailModel } from "../../../src/mail-app/model/MailModel.js"
import { instance, matchers, when } from "testdouble"
import { CalendarModel } from "../../../src/calendar-app/model/CalendarModel.js"
import { LoginController } from "../../../src/common/api/main/LoginController.js"
import { FolderSystem } from "../../../src/common/api/common/mail/FolderSystem.js"
import { GroupInfoTypeRef, GroupTypeRef, User } from "../../../src/common/api/entities/sys/TypeRefs.js"
import { calendars } from "./CalendarTestUtils.js"
import { UserController } from "../../../src/common/api/main/UserController.js"
import { SendMailModel } from "../../../src/mail-app/editor/SendMailModel.js"
import { CalendarNotificationSender } from "../../../src/calendar-app/view/CalendarNotificationSender.js"
import { mockAttribute } from "@tutao/tutanota-test-utils"

const { anything, argThat } = matchers

o.spec("CalendarInviteHandlerTest", function () {
	let mailModel: MailModel, calendarIniviteHandler: CalendarInviteHandler, calendarModel: CalendarModel, logins: LoginController, sendMailModel: SendMailModel
	let calendarNotificationSender: CalendarNotificationSender

	o.beforeEach(function () {
		let userController: Partial<UserController>
		const customerId = "customerId"
		const user = {
			_id: "userId",
			customer: customerId,
		} as User
		userController = { user }

		const mailboxDetails: MailboxDetail = {
			mailbox: createTestEntity(MailBoxTypeRef),
			folders: new FolderSystem([]),
			mailGroupInfo: createTestEntity(GroupInfoTypeRef, {
				mailAddress: "mailgroup@addre.ss",
			}),
			mailGroup: createTestEntity(GroupTypeRef),
			mailboxGroupRoot: createTestEntity(MailboxGroupRootTypeRef),
		}
		const mailboxProperties: MailboxProperties = createTestEntity(MailboxPropertiesTypeRef, {})

		mailModel = instance(MailModel)
		when(mailModel.getMailboxDetailsForMail(anything())).thenResolve(mailboxDetails)
		when(mailModel.getMailboxProperties(anything())).thenResolve(mailboxProperties)

		calendarModel = instance(CalendarModel)
		when(calendarModel.getEventsByUid(anything())).thenResolve({
			ownerGroup: "whatever",
			progenitor: null,
			alteredInstances: [],
		})
		//processCalendarEventMessage is mocked to get call count
		mockAttribute(calendarModel, calendarModel.processCalendarEventMessage, () => Promise.resolve())

		logins = instance(LoginController)
		when(logins.getUserController()).thenReturn(userController)

		calendarNotificationSender = instance(CalendarNotificationSender)

		sendMailModel = instance(SendMailModel)

		calendarIniviteHandler = new CalendarInviteHandler(mailModel, calendarModel, logins, calendarNotificationSender, async () => {
			return sendMailModel
		})
	})

	o.spec("ReplyToEventInvitation", function () {
		o("respond yes to event", async function () {
			const sender = "sender@example.com"
			const attendee = "attendee@example.com"
			const event = createTestEntity(CalendarEventTypeRef, {
				uid: "uid",
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
			const ownAttendee = findAttendeeInAddresses(event.attendees, [attendee])
			let mail = createTestEntity(MailTypeRef)
			mail.sender = createMailAddress({ address: sender, name: "whatever", contact: null })
			when(calendarModel.getCalendarInfos()).thenResolve(calendars)
			o(await calendarIniviteHandler.replyToEventInvitation(event, ownAttendee!, CalendarAttendeeStatus.ACCEPTED, mail)).equals(ReplyResult.ReplySent)
			o(calendarModel.processCalendarEventMessage.callCount).equals(1)
		})

		o("respond no to event", async function () {
			const sender = "sender@example.com"
			const attendee = "attendee@example.com"
			const event = createTestEntity(CalendarEventTypeRef, {
				uid: "uid",
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
			const ownAttendee = findAttendeeInAddresses(event.attendees, [attendee])
			let mail = createTestEntity(MailTypeRef)
			mail.sender = createMailAddress({ address: sender, name: "whatever", contact: null })
			when(calendarModel.getCalendarInfos()).thenResolve(calendars)
			o(await calendarIniviteHandler.replyToEventInvitation(event, ownAttendee!, CalendarAttendeeStatus.DECLINED, mail)).equals(ReplyResult.ReplySent)
			o(calendarModel.processCalendarEventMessage.callCount).equals(0)
		})

		o("respond yes to event on read only shared calendar", async function () {
			const sender = "sender@example.com"
			const attendee = "attendee@example.com"
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
			const ownAttendee = findAttendeeInAddresses(event.attendees, [attendee])
			let mail = createTestEntity(MailTypeRef)
			mail.sender = createMailAddress({ address: sender, name: "whatever", contact: null })
			when(calendarModel.getCalendarInfos()).thenResolve(new Map())
			o(await calendarIniviteHandler.replyToEventInvitation(event, ownAttendee!, CalendarAttendeeStatus.DECLINED, mail)).equals(ReplyResult.ReplySent)
			o(calendarModel.processCalendarEventMessage.callCount).equals(0)
		})
	})
})
