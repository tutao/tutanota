//@flow
import o from "ospec/ospec.js"
import type {Guest} from "../../../src/calendar/CalendarEventViewModel"
import {CalendarEventViewModel} from "../../../src/calendar/CalendarEventViewModel"
import {downcast, noOp} from "../../../src/api/common/utils/Utils"
import {LazyLoaded} from "../../../src/api/common/utils/LazyLoaded"
import type {MailboxDetail} from "../../../src/mail/MailModel"
import {MailModel} from "../../../src/mail/MailModel"
import type {CalendarEvent} from "../../../src/api/entities/tutanota/CalendarEvent"
import {createCalendarEvent} from "../../../src/api/entities/tutanota/CalendarEvent"
import {createGroupInfo} from "../../../src/api/entities/sys/GroupInfo"
import type {ShareCapabilityEnum} from "../../../src/api/common/TutanotaConstants"
import {AlarmInterval, CalendarAttendeeStatus, GroupType, ShareCapability, TimeFormat} from "../../../src/api/common/TutanotaConstants"
import type {CalendarInfo} from "../../../src/calendar/CalendarView"
import {createGroupMembership} from "../../../src/api/entities/sys/GroupMembership"
import type {User} from "../../../src/api/entities/sys/User"
import {createUser} from "../../../src/api/entities/sys/User"
import {createCalendarEventAttendee} from "../../../src/api/entities/tutanota/CalendarEventAttendee"
import {createMailBox} from "../../../src/api/entities/tutanota/MailBox"
import {createGroup} from "../../../src/api/entities/sys/Group"
import {createMailboxGroupRoot} from "../../../src/api/entities/tutanota/MailboxGroupRoot"
import type {CalendarUpdateDistributor} from "../../../src/calendar/CalendarUpdateDistributor"
import type {IUserController} from "../../../src/api/main/UserController"
import {createEncryptedMailAddress} from "../../../src/api/entities/tutanota/EncryptedMailAddress"
import {CalendarModel} from "../../../src/calendar/CalendarModel"
import {getAllDayDateUTCFromZone} from "../../../src/calendar/CalendarUtils"
import {DateTime} from "luxon"
import {createMailAddressAlias} from "../../../src/api/entities/sys/MailAddressAlias"
import {RecipientInfoType} from "../../../src/api/common/RecipientInfo"
import {SendMailModel} from "../../../src/mail/SendMailModel"
import type {LoginController} from "../../../src/api/main/LoginController"
import type {ContactModel} from "../../../src/contacts/ContactModel"
import {EventController} from "../../../src/api/main/EventController"
import {lang} from "../../../src/misc/LanguageViewModel"
import type {Mail} from "../../../src/api/entities/tutanota/Mail"
import {createMail} from "../../../src/api/entities/tutanota/Mail"
import {createContact} from "../../../src/api/entities/tutanota/Contact"

const calendarGroupId = "0"
const now = new Date(2020, 4, 25, 13, 40)
const zone = "Europe/Berlin"
const wrapIntoMailAddress = (address) => createEncryptedMailAddress({address})
const mailAddress = wrapIntoMailAddress("address@tutanota.com")
const userId = "12356"
const getAddress = a => a.mailAddress

o.spec("CalendarEventViewModel", function () {
	let inviteModel: SendMailModel
	let updateModel: SendMailModel
	let cancelModel: SendMailModel
	let responseModel: SendMailModel
	let showProgress = noOp

	function init({
		              userController = makeUserController(),
		              distributor = makeDistributor(),
		              mailboxDetail = makeMailboxDetail(),
		              calendars,
		              existingEvent,
		              calendarModel = makeCalendarModel(),
		              mail = null,
	              }: {|
		userController?: IUserController,
		distributor?: CalendarUpdateDistributor,
		mailboxDetail?: MailboxDetail,
		calendars: Map<Id, CalendarInfo>,
		calendarModel?: CalendarModel,
		existingEvent: ?CalendarEvent,
		mail?: ?Mail,
	|}): CalendarEventViewModel {
		const loginController: LoginController = downcast({
				getUserController: () => userController,
				isInternalUserLoggedIn: () => true,
			}
		)
		const contactModel: ContactModel = downcast({
			searchForContact: () => Promise.resolve(null),
		})
		const mailModel: MailModel = downcast({
				getRecipientKeyData: () => Promise.resolve(null),
			}
		)
		const eventController: EventController = downcast({
			addEntityListener: noOp,
			removeEntityListener: noOp,
		})
		inviteModel = new SendMailModel(loginController, mailModel, contactModel, eventController, mailboxDetail)
		updateModel = new SendMailModel(loginController, mailModel, contactModel, eventController, mailboxDetail)
		cancelModel = new SendMailModel(loginController, mailModel, contactModel, eventController, mailboxDetail)
		responseModel = new SendMailModel(loginController, mailModel, contactModel, eventController, mailboxDetail)
		const sendFactory = (_, purpose) => {
			return {
				invite: inviteModel,
				update: updateModel,
				cancel: cancelModel,
				response: responseModel,
			}[purpose]
		}

		return new CalendarEventViewModel(
			userController,
			distributor,
			calendarModel,
			mailboxDetail,
			sendFactory,
			now,
			zone,
			calendars,
			existingEvent,
			mail,
			false,
		)
	}

	let askForUpdates
	let askInsecurePassword

	o.before(function () {
		// We need this because SendMailModel queries for default language. We should refactor to avoid this.
		lang.init({})
	})

	o.beforeEach(function () {
		askForUpdates = o.spy()
		askInsecurePassword = o.spy()
	})

	o("init with existing event", function () {
		const existingEvent = createCalendarEvent({
			summary: "existing event",
			startTime: DateTime.fromObject({year: 2020, month: 5, day: 26, hour: 12, zone}).toJSDate(),
			endTime: DateTime.fromObject({year: 2020, month: 5, day: 26, hour: 13, zone}).toJSDate(),
			description: "note",
			location: "location",
			_ownerGroup: calendarGroupId,
			organizer: mailAddress,
		})
		const viewModel = init({calendars: makeCalendars("own"), existingEvent})

		o(viewModel.summary()).equals(existingEvent.summary)
		o(viewModel.startDate.toISOString()).equals(DateTime.fromObject({year: 2020, month: 5, day: 26, zone}).toJSDate().toISOString())
		o(viewModel.endDate.toISOString()).equals(DateTime.fromObject({year: 2020, month: 5, day: 26, zone}).toJSDate().toISOString())
		o(viewModel.startTime).equals("12:00")
		o(viewModel.endTime).equals("13:00")
		o(viewModel.note).equals(existingEvent.description)
		o(viewModel.location()).equals(existingEvent.location)
		o(viewModel.isReadOnlyEvent()).equals(false)
		o(viewModel.canModifyGuests()).equals(true)("canModifyGuests")
		o(viewModel.canModifyOwnAttendance()).equals(true)
		o(viewModel.canModifyOrganizer()).equals(true)
		o(viewModel.organizer).deepEquals(mailAddress)
		o(viewModel.possibleOrganizers).deepEquals([mailAddress])
	})

	o("init all day event", function () {
		const existingEvent = createCalendarEvent({
			summary: "existing event",
			startTime: getAllDayDateUTCFromZone(DateTime.fromObject({year: 2020, month: 5, day: 26, zone}).toJSDate(), zone),
			endTime: getAllDayDateUTCFromZone(DateTime.fromObject({year: 2020, month: 5, day: 27, zone}).toJSDate(), zone),
			description: "note",
			location: "location",
			_ownerGroup: calendarGroupId,
		})
		const viewModel = init({calendars: makeCalendars("own"), existingEvent})

		o(viewModel.summary()).equals(existingEvent.summary)
		o(viewModel.startDate.toISOString()).equals(DateTime.fromObject({year: 2020, month: 5, day: 26, zone}).toJSDate().toISOString())
		o(viewModel.endDate.toISOString()).equals(DateTime.fromObject({year: 2020, month: 5, day: 26, zone}).toJSDate().toISOString())
	})

	o("invite in our own calendar", function () {
		const existingEvent = createCalendarEvent({
			summary: "existing event",
			startTime: new Date(2020, 4, 26, 12),
			endTime: new Date(2020, 4, 26, 13),
			organizer: wrapIntoMailAddress("another-user@provider.com"),
			_ownerGroup: calendarGroupId,
			attendees: [
				createCalendarEventAttendee({
					address: createEncryptedMailAddress({address: "attendee@example.com"})
				}),
				createCalendarEventAttendee({
					address: mailAddress
				})
			]
		})
		const viewModel = init({calendars: makeCalendars("own"), existingEvent})
		o(viewModel.isReadOnlyEvent()).equals(false)
		o(viewModel.canModifyGuests()).equals(false)
		o(viewModel.canModifyOwnAttendance()).equals(true)
		o(viewModel.canModifyOrganizer()).equals(false)
		o(viewModel.possibleOrganizers).deepEquals([existingEvent.organizer])
	})

	o("new invite (without calendar)", function () {
		const calendars = makeCalendars("own")
		const existingEvent = createCalendarEvent({
			summary: "existing event",
			startTime: new Date(2020, 4, 26, 12),
			endTime: new Date(2020, 4, 26, 13),
			organizer: wrapIntoMailAddress("another-user@provider.com"),
			_ownerGroup: null,
			attendees: [
				createCalendarEventAttendee({
					address: mailAddress,
					status: CalendarAttendeeStatus.ACCEPTED,
				})
			]
		})
		const viewModel = init({calendars, existingEvent})
		o(viewModel.isReadOnlyEvent()).equals(false)
		o(viewModel.canModifyGuests()).equals(false)
		o(viewModel.canModifyOwnAttendance()).equals(true)
		o(viewModel.canModifyOrganizer()).equals(false)
		o(viewModel.possibleOrganizers).deepEquals([existingEvent.organizer])
	})

	o("in writable calendar", function () {
		const calendars = makeCalendars("shared")
		const userController = makeUserController()
		addCapability(userController.user, calendarGroupId, ShareCapability.Write)
		const existingEvent = createCalendarEvent({
			summary: "existing event",
			startTime: new Date(2020, 4, 26, 12),
			endTime: new Date(2020, 4, 26, 13),
			organizer: wrapIntoMailAddress("another-user@provider.com"),
			_ownerGroup: calendarGroupId,
		})
		const viewModel = init({calendars, existingEvent, userController})
		o(viewModel.isReadOnlyEvent()).equals(false)
		o(viewModel.canModifyGuests()).equals(false)
		o(viewModel.canModifyOwnAttendance()).equals(false)
		o(viewModel.canModifyOrganizer()).equals(false)
		o(viewModel.possibleOrganizers).deepEquals([existingEvent.organizer])
	})

	o("invite in writable calendar", function () {
		const calendars = makeCalendars("shared")
		const userController = makeUserController()
		addCapability(userController.user, calendarGroupId, ShareCapability.Write)
		const existingEvent = createCalendarEvent({
			summary: "existing event",
			startTime: new Date(2020, 4, 26, 12),
			endTime: new Date(2020, 4, 26, 13),
			organizer: wrapIntoMailAddress("another-user@provider.com"),
			_ownerGroup: calendarGroupId,
		})
		const viewModel = init({calendars, existingEvent, userController})
		o(viewModel.isReadOnlyEvent()).equals(false)
		o(viewModel.canModifyGuests()).equals(false)
		o(viewModel.canModifyOwnAttendance()).equals(false)
		o(viewModel.canModifyOrganizer()).equals(false)
		o(viewModel.possibleOrganizers).deepEquals([existingEvent.organizer])
	})

	o("in readonly calendar", function () {
		const calendars = makeCalendars("shared")
		const userController = makeUserController()
		addCapability(userController.user, calendarGroupId, ShareCapability.Read)
		const existingEvent = createCalendarEvent({
			_ownerGroup: calendarGroupId,
		})
		const viewModel = init({calendars, existingEvent, userController})

		o(viewModel.isReadOnlyEvent()).equals(true)
		o(viewModel.canModifyGuests()).equals(false)("canModifyGuests")
		o(viewModel.canModifyOwnAttendance()).equals(false)
		o(viewModel.canModifyOrganizer()).equals(false)
	})

	o("in writable calendar w/ guests", function () {
		const calendars = makeCalendars("shared")
		const userController = makeUserController()
		addCapability(userController.user, calendarGroupId, ShareCapability.Write)
		const existingEvent = createCalendarEvent({
			summary: "existing event",
			startTime: new Date(2020, 4, 26, 12),
			endTime: new Date(2020, 4, 26, 13),
			organizer: wrapIntoMailAddress("another-user@provider.com"),
			_ownerGroup: calendarGroupId,
			attendees: [
				createCalendarEventAttendee({
					address: createEncryptedMailAddress({address: "attendee@example.com"})
				})
			]
		})
		const viewModel = init({calendars, userController, existingEvent})
		o(viewModel.isReadOnlyEvent()).equals(true)
		o(viewModel.canModifyGuests()).equals(false)
		o(viewModel.canModifyOwnAttendance()).equals(false)
		o(viewModel.canModifyOrganizer()).equals(false)
		o(viewModel.possibleOrganizers).deepEquals([existingEvent.organizer])
	})

	o.spec("delete event", function () {
		o("own event with attendees in own calendar", async function () {
			const calendars = makeCalendars("own")
			const distributor = makeDistributor()
			const attendee = makeAttendee()
			const ownAttendee = makeAttendee(mailAddress.address)
			const calendarModel = makeCalendarModel()
			const existingEvent = createCalendarEvent({
				_id: ["listid", "calendarid"],
				_ownerGroup: calendarGroupId,
				organizer: mailAddress,
				attendees: [ownAttendee, attendee],
				sequence: "1",
			})
			const newEvent = createCalendarEvent({
				_id: ["listid", "calendarid"],
				_ownerGroup: calendarGroupId,
				organizer: mailAddress,
				attendees: [ownAttendee, attendee],
				sequence: "2",
			})
			const viewModel = init({calendars, existingEvent, calendarModel, distributor})

			await viewModel.deleteEvent()

			o(calendarModel.deleteEvent.calls.map(c => c.args)).deepEquals([[existingEvent]])
			o(distributor.sendCancellation.calls.map(c => c.args)).deepEquals([[newEvent, cancelModel]])
			o(cancelModel._bccRecipients.map(r => r.mailAddress)).deepEquals([attendee.address.address])
		})

		o("own event without attendees in own calendar", async function () {
			const calendars = makeCalendars("own")
			const distributor = makeDistributor()
			const calendarModel = makeCalendarModel()
			const existingEvent = createCalendarEvent({
				_id: ["listid", "calendarid"],
				_ownerGroup: calendarGroupId,
				organizer: mailAddress,
				attendees: []
			})
			const viewModel = init({calendars, existingEvent, calendarModel, distributor})
			await viewModel.deleteEvent()
			o(calendarModel.deleteEvent.calls.map(c => c.args)).deepEquals([[existingEvent]])
			o(distributor.sendCancellation.calls).deepEquals([])
		})

		o("invite in own calendar", async function () {
			const calendars = makeCalendars("own")
			const distributor = makeDistributor()
			const calendarModel = makeCalendarModel()
			const attendee = makeAttendee()
			const existingEvent = createCalendarEvent({
				_id: ["listid", "calendarid"],
				_ownerGroup: calendarGroupId,
				organizer: wrapIntoMailAddress("another-address@example.com"),
				attendees: [attendee],
			})
			const viewModel = init({calendars, existingEvent, calendarModel, distributor})
			await viewModel.deleteEvent()
			o(calendarModel.deleteEvent.calls.map(c => c.args)).deepEquals([[existingEvent]])
			o(distributor.sendCancellation.calls).deepEquals([])
		})

		o("in shared calendar", async function () {
			const calendars = makeCalendars("shared")
			const userController = makeUserController()
			addCapability(userController.user, calendarGroupId, ShareCapability.Write)
			const distributor = makeDistributor()
			const calendarModel = makeCalendarModel()
			const attendee = makeAttendee()
			const existingEvent = createCalendarEvent({
				_id: ["listid", "calendarid"],
				_ownerGroup: calendarGroupId,
				organizer: mailAddress,
				attendees: [attendee],
			})
			const viewModel = init({calendars, existingEvent, calendarModel, distributor, userController})
			await viewModel.deleteEvent()
			o(calendarModel.deleteEvent.calls.map(c => c.args)).deepEquals([[existingEvent]])
			o(distributor.sendCancellation.calls).deepEquals([])
		})

		o("in own calendar, without attendees", async function () {
			const calendars = makeCalendars("own")
			const distributor = makeDistributor()
			const calendarModel = makeCalendarModel()
			const existingEvent = createCalendarEvent({
				_id: ["listid", "calendarid"],
				_ownerGroup: calendarGroupId,
				organizer: mailAddress,
				attendees: [],
			})
			const viewModel = init({calendars, existingEvent, calendarModel, distributor})
			await viewModel.deleteEvent()
			o(calendarModel.deleteEvent.calls.map(c => c.args)).deepEquals([[existingEvent]])
			o(distributor.sendCancellation.calls).deepEquals([])
		})

		o("in own calendar, self is only attendee", async function () {
			const calendars = makeCalendars("own")
			const userController = makeUserController()
			const distributor = makeDistributor()
			const calendarModel = makeCalendarModel()
			const attendee = makeAttendee(mailAddress.address)
			const existingEvent = createCalendarEvent({
				_id: ["listid", "calendarid"],
				_ownerGroup: calendarGroupId,
				organizer: mailAddress,
				attendees: [attendee],
			})
			const viewModel = init({calendars, existingEvent, calendarModel, distributor, userController})
			await viewModel.deleteEvent()
			o(calendarModel.deleteEvent.calls.map(c => c.args)).deepEquals([[existingEvent]])
			o(distributor.sendCancellation.calls).deepEquals([])
		})
	})

	o.spec("create event", function () {
		o("own calendar, no guests", async function () {
			const calendars = makeCalendars("own")
			const calendarModel = makeCalendarModel()
			const distributor = makeDistributor()
			const viewModel = init({calendars, existingEvent: null, calendarModel, distributor})
			const summary = "Summary"
			viewModel.summary(summary)
			const newDescription = "new description"
			viewModel.changeDescription(newDescription)

			o(await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})).deepEquals(true)

			const [createdEvent] = calendarModel.createEvent.calls[0].args
			o(createdEvent.summary).equals("Summary")
			o(createdEvent.description).equals(newDescription)
			o(distributor.sendInvite.calls).deepEquals([])
			o(distributor.sendCancellation.calls).deepEquals([])
			o(askForUpdates.calls).deepEquals([])
			o(askInsecurePassword.calls).deepEquals([])
		})

		o("own calendar, new guests", async function () {
			const calendars = makeCalendars("own")
			const calendarModel = makeCalendarModel()
			const distributor = makeDistributor()
			const viewModel = init({calendars, existingEvent: null, calendarModel, distributor})
			const newGuest = "new-attendee@example.com"

			viewModel.addAttendee(newGuest)

			o(await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})).deepEquals(true)

			o(calendarModel.createEvent.calls.length).equals(1)("created event")
			o(distributor.sendInvite.calls[0].args[1]).deepEquals(inviteModel)
			o(distributor.sendCancellation.calls).deepEquals([])
			o(inviteModel._bccRecipients.map(r => r.mailAddress)).deepEquals([newGuest])

			const createdEvent = calendarModel.createEvent.calls[0].args[0]
			o(createdEvent.attendees.map((a) => ({status: a.status, address: a.address}))).deepEquals([
				{status: CalendarAttendeeStatus.ACCEPTED, address: mailAddress},
				{status: CalendarAttendeeStatus.NEEDS_ACTION, address: createEncryptedMailAddress({address: newGuest})},
			])
			o(askForUpdates.calls).deepEquals([])
			o(askInsecurePassword.calls).deepEquals([])
		})

		o("own calendar, same guests, agree on updates", async function () {
			const calendars = makeCalendars("own")
			const calendarModel = makeCalendarModel()
			const distributor = makeDistributor()
			const guest = "new-attendee@example.com"
			const existingEvent = createCalendarEvent({
				_id: ["listId", "eventId"],
				_ownerGroup: calendarGroupId,
				attendees: [
					createCalendarEventAttendee({
						address: createEncryptedMailAddress({address: guest})
					})
				],
				organizer: mailAddress,
				startTime: new Date(2020, 4, 5, 16),
				endTime: new Date(2020, 4, 6, 20),
			})
			const viewModel = init({calendars, existingEvent, calendarModel, distributor})
			viewModel.onStartDateSelected(new Date(2020, 4, 3))
			askForUpdates = o.spy(() => Promise.resolve("yes"))

			o(await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})).equals(true)
			o(calendarModel.updateEvent.calls.length).equals(1)("created event")
			o(distributor.sendUpdate.calls[0].args[1]).equals(updateModel)
			o(distributor.sendCancellation.calls).deepEquals([])
			o(updateModel._bccRecipients.map((a) => a.mailAddress)).deepEquals([guest])
			o(askForUpdates.calls.length).equals(1)
			o(askInsecurePassword.calls).deepEquals([])
		})

		o("own calendar, old, new, removed guests, agree on updates", async function () {
			const calendars = makeCalendars("own")
			const calendarModel = makeCalendarModel()
			const distributor = makeDistributor()
			const oldGuest = "old-attendee@example.com"
			const newGuest = "new-attendee@example.com"
			const toRemoveGuest: Guest = {
				address: createEncryptedMailAddress({address: "remove-attendee@example.com"}),
				type: RecipientInfoType.EXTERNAL,
				status: CalendarAttendeeStatus.ACCEPTED,
				password: null,
			}
			const toRemoveAttendee = createCalendarEventAttendee({
				address: toRemoveGuest.address,
			})
			const existingEvent = createCalendarEvent({
				_id: ["listId", "eventId"],
				_ownerGroup: calendarGroupId,
				attendees: [
					createCalendarEventAttendee({
						address: createEncryptedMailAddress({address: oldGuest})
					}),
					toRemoveAttendee
				],
				organizer: mailAddress,
				startTime: new Date(2020, 4, 5, 16),
				endTime: new Date(2020, 4, 6, 20),
			})
			const viewModel = init({calendars, existingEvent, calendarModel, distributor})
			viewModel.onStartDateSelected(new Date(2020, 4, 3))
			viewModel.addAttendee(newGuest)
			viewModel.removeAttendee(toRemoveGuest)
			askForUpdates = o.spy(() => Promise.resolve("yes"))

			await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})

			o(calendarModel.updateEvent.calls.length).equals(1)("created event")
			o(distributor.sendUpdate.calls[0].args[1]).equals(updateModel)("update")
			o(updateModel._bccRecipients.map(getAddress)).deepEquals([oldGuest])
			o(distributor.sendInvite.calls[0].args[1]).equals(inviteModel)("invite")
			o(inviteModel._bccRecipients.map(getAddress)).deepEquals([newGuest])
			o(distributor.sendCancellation.calls[0].args[1]).equals(cancelModel)("cancel")
			o(cancelModel._bccRecipients.map(getAddress)).deepEquals([toRemoveGuest.address.address])
			o(askForUpdates.calls.length).equals(1)
			o(askInsecurePassword.calls).deepEquals([])
		})

		o("own calendar, same guests, agree on updates and on insecure password", async function () {
			const calendars = makeCalendars("own")
			const calendarModel = makeCalendarModel()
			const distributor = makeDistributor()
			const guest = "new-attendee@example.com"
			const existingEvent = createCalendarEvent({
				_id: ["listId", "eventId"],
				_ownerGroup: calendarGroupId,
				attendees: [
					createCalendarEventAttendee({
						address: createEncryptedMailAddress({address: guest})
					})
				],
				organizer: mailAddress,
				startTime: new Date(2020, 4, 5, 16),
				endTime: new Date(2020, 4, 6, 20),
			})
			const viewModel = init({calendars, existingEvent, calendarModel, distributor})
			updateModel._bccRecipients[0].type = RecipientInfoType.EXTERNAL
			await updateModel._bccRecipients[0].resolveContactPromise
			updateModel._bccRecipients[0].contact = createContact({presharedPassword: "123"})
			updateModel.recipientsChanged(undefined)
			viewModel.onStartDateSelected(new Date(2020, 4, 3))
			askForUpdates = o.spy(() => Promise.resolve("yes"))
			askInsecurePassword = o.spy()

			o(await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})).equals(true)
			o(calendarModel.updateEvent.calls.length).equals(1)("created event")
			o(distributor.sendUpdate.calls[0].args[1]).equals(updateModel)
			o(distributor.sendCancellation.calls).deepEquals([])
			o(updateModel._bccRecipients.map((a) => a.mailAddress)).deepEquals([guest])
			o(askForUpdates.calls.length).equals(1)
			// No new attendees, do not ask about password
			o(askInsecurePassword.calls.length).equals(0)
		})

		o("own calendar, same and new guests, agree on updates but not on insecure password", async function () {
			const calendars = makeCalendars("own")
			const calendarModel = makeCalendarModel()
			const distributor = makeDistributor()
			const guest = "exising-attendee@example.com"
			const newGuest = "new-attendee@example.com"
			const existingEvent = createCalendarEvent({
				_id: ["listId", "eventId"],
				_ownerGroup: calendarGroupId,
				attendees: [
					createCalendarEventAttendee({
						address: createEncryptedMailAddress({address: guest})
					})
				],
				organizer: mailAddress,
				startTime: new Date(2020, 4, 5, 16),
				endTime: new Date(2020, 4, 6, 20),
			})
			const viewModel = init({calendars, existingEvent, calendarModel, distributor})
			updateModel._bccRecipients[0].type = RecipientInfoType.EXTERNAL
			await updateModel._bccRecipients[0].resolveContactPromise
			updateModel._bccRecipients[0].contact = createContact({presharedPassword: "123"})
			updateModel.recipientsChanged(undefined)
			viewModel.onStartDateSelected(new Date(2020, 4, 3))
			askForUpdates = o.spy(() => Promise.resolve("yes"))
			askInsecurePassword = o.spy(() => false)

			viewModel.addAttendee(newGuest, null)

			o(await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})).equals(false)

			o(calendarModel.updateEvent.calls.length).equals(0)
			o(distributor.sendUpdate.calls.length).equals(0)
			o(distributor.sendCancellation.calls).deepEquals([])
			o(updateModel._bccRecipients.map((a) => a.mailAddress)).deepEquals([guest])
			o(askForUpdates.calls.length).equals(1)
			o(askInsecurePassword.calls.length).equals(1)
		})

		o("own calendar, old, new, removed guests, do not send updates", async function () {
			const calendars = makeCalendars("own")
			const calendarModel = makeCalendarModel()
			const distributor = makeDistributor()
			const oldGuest = "old-attendee@example.com"
			const newGuest = "new-attendee@example.com"
			const toRemoveGuest: Guest = {
				address: createEncryptedMailAddress({address: "remove-attendee@example.com"}),
				type: RecipientInfoType.EXTERNAL,
				status: CalendarAttendeeStatus.ACCEPTED,
				password: null,
			}
			const toRemoveAttendee = createCalendarEventAttendee({
				address: toRemoveGuest.address,
			})
			const existingEvent = createCalendarEvent({
				_id: ["listId", "eventId"],
				_ownerGroup: calendarGroupId,
				attendees: [
					createCalendarEventAttendee({
						address: createEncryptedMailAddress({address: oldGuest})
					}),
					toRemoveAttendee
				],
				organizer: mailAddress,
				startTime: new Date(2020, 4, 5, 16),
				endTime: new Date(2020, 4, 6, 20),
			})
			const viewModel = init({calendars, existingEvent, calendarModel, distributor})
			viewModel.onStartDateSelected(new Date(2020, 4, 3))
			viewModel.addAttendee(newGuest)
			viewModel.removeAttendee(toRemoveGuest)
			askForUpdates = o.spy(() => Promise.resolve("no"))

			o(await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})).equals(true)

			o(calendarModel.updateEvent.calls.length).equals(1)("created event")
			o(distributor.sendUpdate.calls).deepEquals([])
			o(distributor.sendInvite.calls.length).equals(1)("sent invite")
			o(distributor.sendCancellation.calls.length).equals(1)("sent cancellation")
			o(askForUpdates.calls.length).equals(1)
			o(askInsecurePassword.calls).deepEquals([])
		})

		o("own calendar, old, new, removed guests, cancel", async function () {
			const calendars = makeCalendars("own")
			const calendarModel = makeCalendarModel()
			const distributor = makeDistributor()
			const oldGuest = "old-attendee@example.com"
			const newGuest = "new-attendee@example.com"
			const toRemoveGuest: Guest = {
				address: createEncryptedMailAddress({address: "remove-attendee@example.com"}),
				type: RecipientInfoType.EXTERNAL,
				status: CalendarAttendeeStatus.ACCEPTED,
				password: null,
			}
			const toRemoveAttendee = createCalendarEventAttendee({
				address: toRemoveGuest.address,
			})
			const existingEvent = createCalendarEvent({
				_id: ["listId", "eventId"],
				_ownerGroup: calendarGroupId,
				attendees: [
					createCalendarEventAttendee({
						address: createEncryptedMailAddress({address: oldGuest})
					}),
					toRemoveAttendee
				],
				organizer: mailAddress,
				startTime: new Date(2020, 4, 5, 16),
				endTime: new Date(2020, 4, 6, 20),
			})
			const viewModel = init({calendars, existingEvent, calendarModel, distributor})
			viewModel.onStartDateSelected(new Date(2020, 4, 3))
			viewModel.addAttendee(newGuest)
			viewModel.removeAttendee(toRemoveGuest)
			askForUpdates = o.spy(() => Promise.resolve("cancel"))

			o(await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})).equals(false)

			o(calendarModel.updateEvent.calls.length).equals(0)("did not created event")
			o(distributor.sendUpdate.calls).deepEquals([])
			o(distributor.sendInvite.calls.length).equals(0)("did not sent invite")
			o(distributor.sendCancellation.calls.length).equals(0)("did not sent cancellation")
			o(askForUpdates.calls.length).equals(1)
			o(askInsecurePassword.calls).deepEquals([])
		})

		o("own calendar, only removed guests, send updates", async function () {
			const calendars = makeCalendars("own")
			const calendarModel = makeCalendarModel()
			const distributor = makeDistributor()
			const toRemoveGuest: Guest = {
				address: createEncryptedMailAddress({address: "remove-attendee@example.com"}),
				type: RecipientInfoType.EXTERNAL,
				status: CalendarAttendeeStatus.ACCEPTED,
				password: null,
			}
			const toRemoveAttendee = createCalendarEventAttendee({
				address: toRemoveGuest.address,
			})
			const existingEvent = createCalendarEvent({
				_id: ["listId", "eventId"],
				_ownerGroup: calendarGroupId,
				attendees: [
					toRemoveAttendee
				],
				organizer: mailAddress,
				startTime: new Date(2020, 4, 5, 16),
				endTime: new Date(2020, 4, 6, 20),
			})
			const viewModel = init({calendars, existingEvent, calendarModel, distributor})
			viewModel.onStartDateSelected(new Date(2020, 4, 3))
			viewModel.removeAttendee(toRemoveGuest)
			askForUpdates = o.spy()

			o(await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})).equals(true)
			o(calendarModel.updateEvent.calls.length).equals(1)("created event")
			o(distributor.sendCancellation.calls[0].args[1]).equals(cancelModel)
			o(cancelModel._bccRecipients.map(getAddress)).deepEquals([toRemoveGuest.address.address])
			// There are only removed guests, we always send to them
			o(askForUpdates.calls.length).equals(0)
			o(askInsecurePassword.calls).deepEquals([])
		})

		o("send response", async function () {
			const mail = createMail()
			const calendars = makeCalendars("own")
			const calendarModel = makeCalendarModel()
			const distributor = makeDistributor()
			const ownAttendee = createCalendarEventAttendee({
				address: mailAddress,
				status: CalendarAttendeeStatus.NEEDS_ACTION,
			})
			const anotherAttendee = createCalendarEventAttendee({
				address: createEncryptedMailAddress({address: "another-attendee@example.com"}),
				status: CalendarAttendeeStatus.DECLINED,
			})
			const organizerAddress = "another-address@example.com"
			const existingEvent = createCalendarEvent({
				startTime: new Date(2020, 5, 1),
				endTime: new Date(2020, 5, 2),
				organizer: wrapIntoMailAddress(organizerAddress),
				attendees: [ownAttendee, anotherAttendee],
			})
			const viewModel = init({calendars, existingEvent, calendarModel, distributor, mail})
			viewModel.selectGoing(CalendarAttendeeStatus.ACCEPTED)
			o(await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})).equals(true)

			// As it is a "new" event, we must create it, not update
			const [createdEvent] = calendarModel.createEvent.calls[0].args
			o(createdEvent.attendees.length).equals(2)
			o(createdEvent.attendees.find(a =>
				a.address.address === ownAttendee.address.address).status).equals(CalendarAttendeeStatus.ACCEPTED)
			o(createdEvent.attendees.find(a =>
				a.address.address === anotherAttendee.address.address).status).equals(CalendarAttendeeStatus.DECLINED)

			o(distributor.sendUpdate.calls).deepEquals([])
			o(distributor.sendInvite.calls).deepEquals([])
			o(distributor.sendCancellation.calls).deepEquals([])
			o(distributor.sendResponse.calls.map(call => call.args))
				.deepEquals([[createdEvent, responseModel, mailAddress.address, mail, CalendarAttendeeStatus.ACCEPTED]])
			o(responseModel._toRecipients.map(getAddress)).deepEquals([organizerAddress])
			o(askForUpdates.calls).deepEquals([])
			o(askInsecurePassword.calls).deepEquals([])
		})

		o("existing event times preserved", async function () {
			const calendars = makeCalendars("own")
			const calendarModel = makeCalendarModel()
			const startTime = DateTime.fromObject({year: 2020, month: 6, day: 4, hour: 12, zone}).toJSDate()
			const endTime = DateTime.fromObject({year: 2020, month: 6, day: 4, hour: 13, zone}).toJSDate()
			const existingEvent = createCalendarEvent({_id: ["listId", "eventId"], startTime, endTime})
			const viewModel = init({calendars, existingEvent, calendarModel})

			o(await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})).deepEquals(true)
			const [createdEvent] = calendarModel.updateEvent.calls[0].args
			o(createdEvent.startTime.toISOString()).deepEquals(startTime.toISOString())
			o(createdEvent.endTime.toISOString()).deepEquals(endTime.toISOString())
			o(askForUpdates.calls).deepEquals([])
			o(askInsecurePassword.calls).deepEquals([])
		})

		o("invite to self is not sent", async function () {
			const calendars = makeCalendars("own")
			const calendarModel = makeCalendarModel()
			const distributor = makeDistributor()
			const viewModel = init({calendars, existingEvent: null, calendarModel, distributor})
			const newGuest = "new-attendee@example.com"
			viewModel.addAttendee(newGuest)
			viewModel.addAttendee(mailAddress.address)


			o(await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})).equals(true)
			o(calendarModel.createEvent.calls.length).equals(1)("created event")
			o(distributor.sendInvite.calls[0].args[1]).equals(inviteModel)
			o(inviteModel._bccRecipients.map(getAddress)).deepEquals([newGuest])
			o(distributor.sendCancellation.calls).deepEquals([])
			o(askForUpdates.calls).deepEquals([])
			o(askInsecurePassword.calls).deepEquals([])
		})

		o("update to self is not sent", async function () {
			const calendars = makeCalendars("own")
			const distributor = makeDistributor()
			const ownAttendee = createCalendarEventAttendee({
				address: mailAddress,
				status: CalendarAttendeeStatus.NEEDS_ACTION,
			})
			const anotherAttendee = createCalendarEventAttendee({
				address: createEncryptedMailAddress({address: "another-attendee@example.com"}),
				status: CalendarAttendeeStatus.DECLINED,
			})
			const alias = "alias@tutanota.com"
			const userController = makeUserController([alias])
			const existingEvent = createCalendarEvent({
				_ownerGroup: calendarGroupId,
				startTime: new Date(2020, 5, 1),
				endTime: new Date(2020, 5, 2),
				organizer: wrapIntoMailAddress(alias),
				attendees: [ownAttendee, anotherAttendee],
			})
			const viewModel = init({calendars, distributor, userController, existingEvent})
			const askForUpdates = o.spy(() => Promise.resolve("yes"))

			await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})

			o(distributor.sendUpdate.calls[0].args[1]).equals(updateModel)
			o(updateModel._bccRecipients.map(getAddress)).deepEquals([anotherAttendee.address.address])
			o(askForUpdates.calls.length).equals(1)
		})

		o("invite is not called if only self is added", async function () {
			const calendars = makeCalendars("own")
			const distributor = makeDistributor()
			const anotherAttendee = createCalendarEventAttendee({
				address: createEncryptedMailAddress({address: "another-attendee@example.com"}),
				status: CalendarAttendeeStatus.DECLINED,
			})
			const alias = "alias@tutanota.com"
			const userController = makeUserController([alias])
			const existingEvent = createCalendarEvent({
				_ownerGroup: calendarGroupId,
				startTime: new Date(2020, 5, 1),
				endTime: new Date(2020, 5, 2),
				organizer: wrapIntoMailAddress(alias),
				attendees: [anotherAttendee],
			})
			const viewModel = init({calendars, distributor, userController, existingEvent})
			askForUpdates = o.spy(() => Promise.resolve("yes"))

			viewModel.addAttendee(mailAddress.address)
			await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})

			o(distributor.sendUpdate.calls[0].args[1]).equals(updateModel)
			o(updateModel._bccRecipients.map(getAddress)).deepEquals([anotherAttendee.address.address])
			o(distributor.sendInvite.calls).deepEquals([])("Invite is not called")
			// Update is asked because there's another attendee
			o(askForUpdates.calls.length).equals(1)
		})

		o("does not ask for updates if only self is present", async function () {
			const calendars = makeCalendars("own")
			const distributor = makeDistributor()
			const ownAttendee = createCalendarEventAttendee({
				address: mailAddress,
				status: CalendarAttendeeStatus.NEEDS_ACTION,
			})
			const alias = "alias@tutanota.com"
			const userController = makeUserController([alias])
			const existingEvent = createCalendarEvent({
				startTime: new Date(2020, 5, 1),
				endTime: new Date(2020, 5, 2),
				organizer: wrapIntoMailAddress(alias),
				attendees: [ownAttendee],
			})
			const viewModel = init({calendars, distributor, userController, existingEvent})
			o(await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})).equals(true)
			o(askForUpdates.calls.length).equals(0)
			o(askInsecurePassword.calls.length).equals(0)
		})

		o("does not ask for updates if alarm is changed in shared calendar", async function () {
			const calendars = makeCalendars("shared")
			const calendarModel = makeCalendarModel()
			const existingEvent = createCalendarEvent({
				_id: ["listId", "eventId"],
				organizer: wrapIntoMailAddress("organizer@tutanota.de"),
				startTime: DateTime.utc(2020, 6, 11).toJSDate(),
				endTime: DateTime.utc(2020, 7, 12).toJSDate(),
				_ownerGroup: calendarGroupId,
				attendees: [
					createCalendarEventAttendee({
						address: createEncryptedMailAddress({address: "guest@tutanota.com"})
					})
				]
			})
			const viewModel = init({calendarModel, calendars, existingEvent})

			viewModel.addAlarm(AlarmInterval.FIVE_MINUTES)
			o(await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})).equals(true)

			o(calendarModel.updateEvent.calls.length).equals(1)("Did update event")
			o(askForUpdates.calls.length).equals(0)
		})
	})

	o.spec("onStartDateSelected", function () {
		o("date adjusted forward", async function () {
			const calendars = makeCalendars("own")
			const existingEvent = createCalendarEvent({
				startTime: DateTime.fromObject({year: 2020, month: 6, day: 8, hour: 13, zone}).toJSDate(),
				endTime: DateTime.fromObject({year: 2020, month: 6, day: 9, hour: 15, zone}).toJSDate(),
			})
			const viewModel = init({calendars, existingEvent})
			viewModel.onStartDateSelected(DateTime.fromObject({year: 2020, month: 6, day: 10, zone}).toJSDate())

			// No hours because it's a "date", not "time" field.
			o(viewModel.endDate.toISOString())
				.equals(DateTime.fromObject({year: 2020, month: 6, day: 11, zone}).toJSDate().toISOString())
			o(viewModel.endTime).equals("15:00")
		})

		o("date adjusted backwards", async function () {
			const calendars = makeCalendars("own")
			const existingEvent = createCalendarEvent({
				startTime: DateTime.fromObject({year: 2020, month: 6, day: 8, hour: 13, zone}).toJSDate(),
				endTime: DateTime.fromObject({year: 2020, month: 6, day: 9, hour: 15, zone}).toJSDate(),
			})
			const viewModel = init({calendars, existingEvent})
			viewModel.onStartDateSelected(DateTime.fromObject({year: 2020, month: 6, day: 6, zone}).toJSDate())

			// No hours because it's a "date", not "time" field.
			o(viewModel.endDate.toISOString())
				.equals(DateTime.fromObject({year: 2020, month: 6, day: 7, zone}).toJSDate().toISOString())
			o(viewModel.endTime).equals("15:00")
		})
	})

	o.spec("onStartTimeSelected", function () {
		o("time adjusted forward", async function () {
			const calendars = makeCalendars("own")
			const existingEvent = createCalendarEvent({
				startTime: DateTime.fromObject({year: 2020, month: 6, day: 8, hour: 13, zone}).toJSDate(),
				endTime: DateTime.fromObject({year: 2020, month: 6, day: 8, hour: 15, zone}).toJSDate(),
			})
			const viewModel = init({calendars, existingEvent})
			viewModel.onStartTimeSelected("14:00")

			// No hours because it's a "date", not "time" field.
			o(viewModel.endDate.toISOString())
				.equals(DateTime.fromObject({year: 2020, month: 6, day: 8, zone}).toJSDate().toISOString())
			o(viewModel.endTime).equals("16:00")
		})

		o("time adjusted backward", async function () {
			const calendars = makeCalendars("own")
			const existingEvent = createCalendarEvent({
				startTime: DateTime.fromObject({year: 2020, month: 6, day: 8, hour: 13, zone}).toJSDate(),
				endTime: DateTime.fromObject({year: 2020, month: 6, day: 8, hour: 15, zone}).toJSDate(),
			})
			const viewModel = init({calendars, existingEvent})
			viewModel.onStartTimeSelected("12:00")

			// No hours because it's a "date", not "time" field.
			o(viewModel.endDate.toISOString())
				.equals(DateTime.fromObject({year: 2020, month: 6, day: 8, zone}).toJSDate().toISOString())
			o(viewModel.endTime).equals("14:00")
		})

		o("time not adjust when different day", async function () {
			const calendars = makeCalendars("own")
			const existingEvent = createCalendarEvent({
				startTime: DateTime.fromObject({year: 2020, month: 6, day: 8, hour: 13, zone}).toJSDate(),
				endTime: DateTime.fromObject({year: 2020, month: 6, day: 9, hour: 15, zone}).toJSDate(),
			})
			const viewModel = init({calendars, existingEvent})
			viewModel.onStartTimeSelected("12:00")

			// No hours because it's a "date", not "time" field.
			o(viewModel.endDate.toISOString())
				.equals(DateTime.fromObject({year: 2020, month: 6, day: 9, zone}).toJSDate().toISOString())
			o(viewModel.endTime).equals("15:00")
		})
	})

	o.spec("addAttendee", function () {
		o("to new event", async function () {
			const calendars = makeCalendars("own")
			const viewModel = init({calendars, existingEvent: null})
			const newGuest = "new-attendee@example.com"

			viewModel.addAttendee(newGuest)

			o(viewModel.attendees()).deepEquals([
				{
					address: mailAddress,
					type: RecipientInfoType.INTERNAL,
					status: CalendarAttendeeStatus.ACCEPTED,
					password: null,
				},
				{
					address: createEncryptedMailAddress({address: newGuest}),
					type: RecipientInfoType.UNKNOWN,
					status: CalendarAttendeeStatus.ADDED,
					password: null,
				},
			])
		})

		o("to existing event", async function () {
			const calendars = makeCalendars("own")
			const existingEvent = createCalendarEvent({
				_ownerGroup: calendarGroupId,
			})
			const viewModel = init({calendars, existingEvent})
			const newGuest = "new-attendee@example.com"

			viewModel.addAttendee(newGuest)

			o(viewModel.attendees()).deepEquals([
				{
					address: mailAddress,
					type: RecipientInfoType.INTERNAL,
					status: CalendarAttendeeStatus.ACCEPTED,
					password: null,
				},
				{
					address: createEncryptedMailAddress({address: newGuest}),
					type: RecipientInfoType.UNKNOWN,
					status: CalendarAttendeeStatus.ADDED,
					password: null,
				},
			])
		})

		o("to existing event as duplicate", async function () {
			const calendars = makeCalendars("own")
			const guest = "new-attendee@example.com"
			const existingEvent = createCalendarEvent({
				attendees: [createCalendarEventAttendee({address: createEncryptedMailAddress({address: guest})})]
			})
			const viewModel = init({calendars, existingEvent})

			viewModel.addAttendee(guest)

			// Organizer is not added because new attendee was not added
			o(viewModel.attendees()).deepEquals([
				{
					address: createEncryptedMailAddress({address: guest}),
					type: RecipientInfoType.UNKNOWN,
					status: CalendarAttendeeStatus.ADDED,
					password: null,
				},
			])

		})
	})

	o.spec("selectGoing", function () {
		o("status of own attendee is changed selected in own event", async function () {
			const calendars = makeCalendars("own")
			const attendee = createCalendarEventAttendee({
				address: createEncryptedMailAddress({address: "guest@example.com"})
			})
			const ownAttendee = createCalendarEventAttendee({
				address: mailAddress,
			})
			const existingEvent = createCalendarEvent({
				attendees: [attendee, ownAttendee]
			})
			const viewModel = init({calendars, existingEvent})

			viewModel.selectGoing(CalendarAttendeeStatus.DECLINED)

			o(viewModel.attendees()).deepEquals([
				{
					address: mailAddress,
					type: RecipientInfoType.INTERNAL,
					status: CalendarAttendeeStatus.DECLINED,
					password: null,
				},
				{
					address: attendee.address,
					type: RecipientInfoType.UNKNOWN,
					status: CalendarAttendeeStatus.ADDED,
					password: null,
				},
			])
		})

		o("status of own attendee is changed selected in invite", async function () {
			const calendars = makeCalendars("own")
			const attendee = createCalendarEventAttendee({
				address: createEncryptedMailAddress({address: "guest@example.com"})
			})
			const ownAttendee = createCalendarEventAttendee({
				address: mailAddress
			})
			const existingEvent = createCalendarEvent({
				attendees: [attendee, ownAttendee],
				organizer: createEncryptedMailAddress({address: "organizer@example.com"}),
			})
			const viewModel = init({calendars, existingEvent})

			viewModel.selectGoing(CalendarAttendeeStatus.TENTATIVE)

			o(viewModel.attendees()).deepEquals([
				{
					address: mailAddress,
					type: RecipientInfoType.INTERNAL,
					status: CalendarAttendeeStatus.TENTATIVE,
					password: null,
				},
				{
					address: attendee.address,
					type: RecipientInfoType.UNKNOWN,
					status: attendee.status,
					password: null,
				},
			])
		})
	})

	o.spec("canModifyOrganizer", function () {
		o("can modify when when new event and no guests", function () {
			const calendars = makeCalendars("own")
			const viewModel = init({calendars, existingEvent: null})
			o(viewModel.canModifyOrganizer()).equals(true)
		})

		o("can modify when when new own event and added guests", function () {
			const calendars = makeCalendars("own")
			const viewModel = init({calendars, existingEvent: null})
			viewModel.addAttendee("guest@example.com")
			o(viewModel.canModifyOrganizer()).equals(true)
		})

		o("can modify when own event and no guests", function () {
			const calendars = makeCalendars("own")
			const viewModel = init({
				calendars,
				existingEvent: createCalendarEvent({
					_id: ["listId", "calendarId"],
					_ownerGroup: calendarGroupId,
				})
			})
			o(viewModel.canModifyOrganizer()).equals(true)
		})

		o("can modify when own event without guests and added guests", function () {
			const calendars = makeCalendars("own")
			const viewModel = init({
				calendars,
				existingEvent: createCalendarEvent({
					_id: ["listId", "calendarId"],
					_ownerGroup: calendarGroupId,
				})
			})

			viewModel.addAttendee("guest@tutanota.de")

			o(viewModel.canModifyOrganizer()).equals(true)
		})

		o("cannot modify in own calendar when there were guests", function () {
			const calendars = makeCalendars("own")
			const viewModel = init({
				calendars,
				existingEvent: createCalendarEvent({
					_id: ["listId", "calendarId"],
					_ownerGroup: calendarGroupId,
					attendees: [createCalendarEventAttendee({address: createEncryptedMailAddress({address: "guest@tutanota.com"})})]
				})
			})

			o(viewModel.canModifyOrganizer()).equals(false)
		})

		o("cannot modify in own calendar when there were guests and they were removed", function () {
			const calendars = makeCalendars("own")
			const toRemoveGuest: Guest = {
				address: createEncryptedMailAddress({address: "remove-attendee@example.com"}),
				type: RecipientInfoType.EXTERNAL,
				status: CalendarAttendeeStatus.ACCEPTED,
				password: null,
			}
			const viewModel = init({
				calendars,
				existingEvent: createCalendarEvent({
					_id: ["listId", "calendarId"],
					_ownerGroup: calendarGroupId,
					attendees: [createCalendarEventAttendee({address: toRemoveGuest.address})]
				})
			})

			viewModel.removeAttendee(toRemoveGuest)

			o(viewModel.canModifyOrganizer()).equals(false)
		})

		o("cannot modify in ro shared calendar without guests", function () {
			const calendars = makeCalendars("shared")
			const viewModel = init({
				calendars,
				existingEvent: createCalendarEvent({
					_id: ["listId", "calendarId"],
					_ownerGroup: calendarGroupId,
				})
			})

			o(viewModel.canModifyOrganizer()).equals(false)
		})

		o("can modify in rw shared calendar without guests", function () {
			const calendars = makeCalendars("shared")
			const userController = makeUserController()
			addCapability(userController.user, calendarGroupId, ShareCapability.Write)
			const viewModel = init({
				calendars,
				userController,
				existingEvent: createCalendarEvent({
					_id: ["listId", "calendarId"],
					_ownerGroup: calendarGroupId,
				})
			})

			o(viewModel.canModifyOrganizer()).equals(false)
		})

		o("cannot modify when it's invite in own calendar", function () {
			const calendars = makeCalendars("own")
			const viewModel = init({
				calendars,
				existingEvent: createCalendarEvent({
					_id: ["listId", "calendarId"],
					_ownerGroup: calendarGroupId,
					organizer: createEncryptedMailAddress({address: "organizer@example.com"})
				})
			})

			o(viewModel.canModifyOrganizer()).equals(false)
		})
	})

	o.spec("getAvailableCalendars", function () {
		const ownCalendar = makeCalendarInfo("own", calendarGroupId)
		const userController = makeUserController()
		const roCalendarId = "roId"
		const roCalendar = makeCalendarInfo("shared", roCalendarId)
		addCapability(userController.user, roCalendarId, ShareCapability.Read)

		const rwCalendarId = "rwId"
		const rwCalendar = makeCalendarInfo("shared", rwCalendarId)
		addCapability(userController.user, rwCalendarId, ShareCapability.Write)

		const calendars = new Map([
			[calendarGroupId, ownCalendar],
			[roCalendarId, roCalendar],
			[rwCalendarId, rwCalendar]
		])

		o("own calendar, new event", function () {
			const viewModel = init({userController, calendars, existingEvent: null})
			o(viewModel.getAvailableCalendars()).deepEquals([ownCalendar, rwCalendar])
		})

		o("own calendar, existing event no guests", function () {
			const existingEvent = createCalendarEvent({
				_ownerGroup: calendarGroupId,
			})
			const viewModel = init({userController, calendars, existingEvent})
			o(viewModel.getAvailableCalendars()).deepEquals([ownCalendar, rwCalendar])
		})

		o("rw calendar, existing event with no guests", function () {
			const existingEvent = createCalendarEvent({
				_ownerGroup: rwCalendarId,
			})
			const viewModel = init({userController, calendars, existingEvent})
			o(viewModel.getAvailableCalendars()).deepEquals([ownCalendar, rwCalendar])
		})

		o("new invite", function () {
			const existingEvent = createCalendarEvent({
				_ownerGroup: null,
				organizer: createEncryptedMailAddress({address: "organizer@example.com"}),
				attendees: [makeAttendee(mailAddress.address)]
			})

			const viewModel = init({userController, calendars, existingEvent})
			o(viewModel.getAvailableCalendars()).deepEquals([ownCalendar])
		})

		o("ro calendar, existing event with no guests", function () {
			const existingEvent = createCalendarEvent({
				_ownerGroup: roCalendarId,
			})
			const viewModel = init({userController, calendars, existingEvent})
			o(viewModel.getAvailableCalendars()).deepEquals([roCalendar])
		})

		o("own calendar, existing event with guests", function () {
			const existingEvent = createCalendarEvent({
				_ownerGroup: calendarGroupId,
				attendees: [makeAttendee()]
			})
			const viewModel = init({userController, calendars, existingEvent})
			o(viewModel.getAvailableCalendars()).deepEquals([ownCalendar])
		})

		o("rw calendar, existing event with guests", function () {
			const existingEvent = createCalendarEvent({
				_ownerGroup: rwCalendarId,
				attendees: [makeAttendee()]
			})
			const viewModel = init({userController, calendars, existingEvent})
			o(viewModel.getAvailableCalendars()).deepEquals([rwCalendar])
		})

		o("ro calendar, existing event with guests", function () {
			const existingEvent = createCalendarEvent({
				_ownerGroup: roCalendarId,
				attendees: [makeAttendee()]
			})
			const viewModel = init({userController, calendars, existingEvent})
			o(viewModel.getAvailableCalendars()).deepEquals([roCalendar])
		})
	})
})

function makeCalendarInfo(type: "own" | "shared", id: string): CalendarInfo {
	return {
		groupRoot: downcast({}),
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

function makeCalendars(type: "own" | "shared", id: string = calendarGroupId): Map<string, CalendarInfo> {
	const calendarInfo = makeCalendarInfo(type, id)
	return new Map([[id, calendarInfo]])
}

function makeUserController(aliases: Array<string> = []): IUserController {
	return downcast({
		user: createUser({
			_id: userId,
			memberships: [createGroupMembership({groupType: GroupType.Mail}), createGroupMembership({groupType: GroupType.Contact})],
		}),
		props: {
			defaultSender: mailAddress,
		},
		userGroupInfo: createGroupInfo({
			mailAddressAliases: aliases.map((address) => createMailAddressAlias({mailAddress: address, enabled: true})),
			mailAddress: mailAddress.address,
		}),
		userSettingsGroupRoot: {
			timeFormat: TimeFormat.TWENTY_FOUR_HOURS,
		},
		isInternalUser: () => true,
		isFreeAccount: () => true,
	})
}

function addCapability(user: User, groupId: Id, capability: ShareCapabilityEnum) {
	user.memberships.push(createGroupMembership({
		group: groupId,
		capability,
	}))
}

function makeAttendee(address: string = "attendee@example.com") {
	return createCalendarEventAttendee({
		address: createEncryptedMailAddress({
			address
		})
	})
}

function makeMailboxDetail(): MailboxDetail {
	return {
		mailbox: createMailBox(),
		folders: [],
		mailGroupInfo: createGroupInfo(),
		mailGroup: createGroup({user: userId}),
		mailboxGroupRoot: createMailboxGroupRoot(),
	}
}

function makeDistributor(): CalendarUpdateDistributor {
	return {
		sendInvite: o.spy(() => Promise.resolve()),
		sendUpdate: o.spy(() => Promise.resolve()),
		sendCancellation: o.spy(() => Promise.resolve()),
		sendResponse: o.spy(() => Promise.resolve()),
	}
}

function makeCalendarModel(): CalendarModel {
	return downcast({
		createEvent: o.spy(() => Promise.resolve()),
		updateEvent: o.spy(() => Promise.resolve()),
		deleteEvent: o.spy(() => Promise.resolve()),
		loadAlarms: o.spy(() => Promise.resolve([]))
	})
}