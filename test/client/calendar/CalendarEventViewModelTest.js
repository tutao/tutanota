//@flow
import o from "ospec"
// $FlowIgnore[untyped-import]
import en from "../../../src/translations/en"
import type {Guest} from "../../../src/calendar/date/CalendarEventViewModel"
import {CalendarEventViewModel} from "../../../src/calendar/date/CalendarEventViewModel"
import {lang} from "../../../src/misc/LanguageViewModel"
import {assertThrows, unmockAttribute,} from "@tutao/tutanota-test-utils"
import {clone, delay, downcast, noOp} from "@tutao/tutanota-utils"
import type {MailboxDetail} from "../../../src/mail/model/MailModel"
import {MailModel} from "../../../src/mail/model/MailModel"
import type {CalendarEvent} from "../../../src/api/entities/tutanota/CalendarEvent"
import {createCalendarEvent} from "../../../src/api/entities/tutanota/CalendarEvent"
import type {ShareCapabilityEnum} from "../../../src/api/common/TutanotaConstants"
import {AccountType, AlarmInterval, CalendarAttendeeStatus, ShareCapability} from "../../../src/api/common/TutanotaConstants"
import {createGroupMembership} from "../../../src/api/entities/sys/GroupMembership"
import type {User} from "../../../src/api/entities/sys/User"
import {createCalendarEventAttendee} from "../../../src/api/entities/tutanota/CalendarEventAttendee"
import type {CalendarUpdateDistributor} from "../../../src/calendar/date/CalendarUpdateDistributor"
import type {IUserController} from "../../../src/api/main/UserController"
import {createEncryptedMailAddress} from "../../../src/api/entities/tutanota/EncryptedMailAddress"
import type {CalendarInfo} from "../../../src/calendar/model/CalendarModel";
import {CalendarModel} from "../../../src/calendar/model/CalendarModel"
import {getAllDayDateUTCFromZone, getTimeZone} from "../../../src/calendar/date/CalendarUtils"
import {DateTime} from "luxon"
import {RecipientInfoType} from "../../../src/api/common/RecipientInfo"
import {SendMailModel} from "../../../src/mail/editor/SendMailModel"
import type {LoginController} from "../../../src/api/main/LoginController"
import type {ContactModel} from "../../../src/contacts/model/ContactModel"
import {EventController} from "../../../src/api/main/EventController"
import type {Mail} from "../../../src/api/entities/tutanota/Mail"
import {createMail} from "../../../src/api/entities/tutanota/Mail"
import {createContact} from "../../../src/api/entities/tutanota/Contact"
import {EntityClient} from "../../../src/api/common/EntityClient"
import {createPublicKeyReturn} from "../../../src/api/entities/sys/PublicKeyReturn"
import {createContactMailAddress} from "../../../src/api/entities/tutanota/ContactMailAddress"
import {BusinessFeatureRequiredError} from "../../../src/api/main/BusinessFeatureRequiredError"
import {MailFacade} from "../../../src/api/worker/facades/MailFacade"
import {EntityRestClientMock} from "../../api/worker/EntityRestClientMock"
import {Time} from "../../../src/api/common/utils/Time"
import {
	accountMailAddress,
	calendarGroupId,
	makeCalendarInfo,
	makeCalendarModel,
	makeCalendars,
	makeContactModel,
	makeDistributor,
	makeMailboxDetail,
	makeUserController
} from "./CalendarTestUtils"
import {createRepeatRule} from "../../../src/api/entities/sys/RepeatRule"


const now = new Date(2020, 4, 25, 13, 40)
const zone = getTimeZone()
const wrapEncIntoMailAddress = (address) => createEncryptedMailAddress({address})
const encMailAddress = wrapEncIntoMailAddress(accountMailAddress)
const getAddress = a => a.mailAddress
let internalAddresses = []
let resolveRecipientMs = 100
let mockedAttributeReferences = []

o.spec("CalendarEventViewModel", function () {
	let inviteModel: SendMailModel
	let updateModel: SendMailModel
	let cancelModel: SendMailModel
	let responseModel: SendMailModel
	let showProgress = noOp

	async function init({
		                    userController = makeUserController(),
		                    distributor = makeDistributor(),
		                    mailboxDetail = makeMailboxDetail(),
		                    calendars,
		                    existingEvent,
		                    calendarModel = makeCalendarModel(),
		                    mailModel = downcast({}),
		                    contactModel = makeContactModel(),
		                    mail = null
	                    }: {|
		userController?: IUserController,
		distributor?: CalendarUpdateDistributor,
		mailboxDetail?: MailboxDetail,
		calendars: Map<Id, CalendarInfo>,
		calendarModel?: CalendarModel,
		mailModel?: MailModel,
		contactModel?: ContactModel,
		existingEvent: ?CalendarEvent,
		mail?: ?Mail
	|}): Promise<CalendarEventViewModel> {
		const loginController: LoginController = downcast({
				getUserController: () => userController,
				isInternalUserLoggedIn: () => true,
			}
		)
		const eventController: EventController = downcast({
			addEntityListener: noOp,
			removeEntityListener: noOp,
		})
		const entityClient = new EntityClient(new EntityRestClientMock())
		const mailFacadeMock = downcast<MailFacade>({
			async getRecipientKeyData(mailAddress: string) {
				await delay(resolveRecipientMs)
				if (internalAddresses.includes(mailAddress)) {
					return createPublicKeyReturn({pubKey: new Uint8Array(0)})
				} else {
					return null
				}
			}
		})
		inviteModel = new SendMailModel(mailFacadeMock, loginController, mailModel, contactModel, eventController, entityClient, mailboxDetail)
		updateModel = new SendMailModel(mailFacadeMock, loginController, mailModel, contactModel, eventController, entityClient, mailboxDetail)
		cancelModel = new SendMailModel(mailFacadeMock, loginController, mailModel, contactModel, eventController, entityClient, mailboxDetail)
		responseModel = new SendMailModel(mailFacadeMock, loginController, mailModel, contactModel, eventController, entityClient, mailboxDetail)
		const sendFactory = (_, purpose) => {
			return {
				invite: inviteModel,
				update: updateModel,
				cancel: cancelModel,
				response: responseModel,
			}[purpose]
		}

		const viewModel = new CalendarEventViewModel(
			userController,
			distributor,
			calendarModel,
			entityClient,
			mailboxDetail,
			sendFactory,
			now,
			zone,
			calendars,
			existingEvent,
			mail,
			false,
		)
		viewModel.hasBusinessFeature(true)

		await viewModel.initialized
		return viewModel
	}

	let askForUpdates: OspecSpy<() => Promise<"yes" | "no" | "cancel">>
	let askInsecurePassword: OspecSpy<() => Promise<boolean>>

	o.before(function () {
		// We need this because SendMailModel queries for default language. We should refactor to avoid this.
		lang.init(en)
	})

	o.beforeEach(function () {
		askForUpdates = o.spy(async () => "yes")
		askInsecurePassword = o.spy(async () => true)
		internalAddresses = []
	})

	o.afterEach(function () {
		mockedAttributeReferences.forEach(ref => unmockAttribute(ref))
		mockedAttributeReferences = []
	})

	o("init with existing event", async function () {
		const existingEvent = createCalendarEvent({
			summary: "existing event",
			startTime: DateTime.fromObject({year: 2020, month: 5, day: 26, hour: 12, zone}).toJSDate(),
			endTime: DateTime.fromObject({year: 2020, month: 5, day: 26, hour: 13, zone}).toJSDate(),
			description: "note",
			location: "location",
			_ownerGroup: calendarGroupId,
			organizer: encMailAddress,
		})
		const viewModel = await init({calendars: makeCalendars("own"), existingEvent})

		o(viewModel.summary()).equals(existingEvent.summary)
		o(viewModel.startDate.toISOString()).equals(DateTime.fromObject({year: 2020, month: 5, day: 26, zone}).toJSDate().toISOString())
		o(viewModel.endDate.toISOString()).equals(DateTime.fromObject({year: 2020, month: 5, day: 26, zone}).toJSDate().toISOString())
		o(viewModel.startTime?.toObject()).deepEquals({hours: 12, minutes: 0})
		o(viewModel.endTime?.toObject()).deepEquals({hours: 13, minutes: 0})
		o(viewModel.note).equals(existingEvent.description)
		o(viewModel.location()).equals(existingEvent.location)
		o(viewModel.isReadOnlyEvent()).equals(false)
		o(viewModel.canModifyGuests()).equals(true)("canModifyGuests")
		o(viewModel.canModifyOwnAttendance()).equals(true)
		o(viewModel.canModifyOrganizer()).equals(true)
		o(viewModel.organizer).deepEquals(encMailAddress)
		o(viewModel.possibleOrganizers).deepEquals([encMailAddress])
	})

	o("init all day event", async function () {
		const existingEvent = createCalendarEvent({
			summary: "existing event",
			startTime: getAllDayDateUTCFromZone(DateTime.fromObject({year: 2020, month: 5, day: 26, zone}).toJSDate(), zone),
			endTime: getAllDayDateUTCFromZone(DateTime.fromObject({year: 2020, month: 5, day: 27, zone}).toJSDate(), zone),
			description: "note",
			location: "location",
			_ownerGroup: calendarGroupId,
		})
		const viewModel = await init({calendars: makeCalendars("own"), existingEvent})

		o(viewModel.summary()).equals(existingEvent.summary)
		o(viewModel.startDate.toISOString()).equals(DateTime.fromObject({year: 2020, month: 5, day: 26, zone}).toJSDate().toISOString())
		o(viewModel.endDate.toISOString()).equals(DateTime.fromObject({year: 2020, month: 5, day: 26, zone}).toJSDate().toISOString())
	})

	o("invite in our own calendar", async function () {
		const existingEvent = createCalendarEvent({
			summary: "existing event",
			startTime: new Date(2020, 4, 26, 12),
			endTime: new Date(2020, 4, 26, 13),
			organizer: wrapEncIntoMailAddress("another-user@provider.com"),
			_ownerGroup: calendarGroupId,
			attendees: [
				createCalendarEventAttendee({
					address: createEncryptedMailAddress({address: "attendee@example.com"})
				}),
				createCalendarEventAttendee({
					address: encMailAddress
				})
			]
		})
		const viewModel = await init({calendars: makeCalendars("own"), existingEvent})
		o(viewModel.isReadOnlyEvent()).equals(false)
		o(viewModel.canModifyGuests()).equals(false)
		o(viewModel.canModifyOwnAttendance()).equals(true)
		o(viewModel.canModifyOrganizer()).equals(false)
		o(viewModel.possibleOrganizers).deepEquals([existingEvent.organizer])
	})

	o("new invite (without calendar)", async function () {
		const calendars = makeCalendars("own")
		const existingEvent = createCalendarEvent({
			summary: "existing event",
			startTime: new Date(2020, 4, 26, 12),
			endTime: new Date(2020, 4, 26, 13),
			organizer: wrapEncIntoMailAddress("another-user@provider.com"),
			_ownerGroup: null,
			attendees: [
				createCalendarEventAttendee({
					address: encMailAddress,
					status: CalendarAttendeeStatus.ACCEPTED,
				})
			]
		})
		const viewModel = await init({calendars, existingEvent})
		o(viewModel.isReadOnlyEvent()).equals(false)
		o(viewModel.canModifyGuests()).equals(false)
		o(viewModel.canModifyOwnAttendance()).equals(true)
		o(viewModel.canModifyOrganizer()).equals(false)
		o(viewModel.possibleOrganizers).deepEquals([existingEvent.organizer])
	})

	o("in writable calendar", async function () {
		const calendars = makeCalendars("shared")
		const userController = makeUserController()
		addCapability(userController.user, calendarGroupId, ShareCapability.Write)
		const existingEvent = createCalendarEvent({
			summary: "existing event",
			startTime: new Date(2020, 4, 26, 12),
			endTime: new Date(2020, 4, 26, 13),
			organizer: wrapEncIntoMailAddress("another-user@provider.com"),
			_ownerGroup: calendarGroupId,
		})
		const viewModel = await init({calendars, existingEvent, userController})
		o(viewModel.isReadOnlyEvent()).equals(false)
		o(viewModel.canModifyGuests()).equals(false)
		o(viewModel.canModifyOwnAttendance()).equals(false)
		o(viewModel.canModifyOrganizer()).equals(false)
		o(viewModel.possibleOrganizers).deepEquals([existingEvent.organizer])
	})

	o("invite in writable calendar", async function () {
		const calendars = makeCalendars("shared")
		const userController = makeUserController()
		addCapability(userController.user, calendarGroupId, ShareCapability.Write)
		const existingEvent = createCalendarEvent({
			summary: "existing event",
			startTime: new Date(2020, 4, 26, 12),
			endTime: new Date(2020, 4, 26, 13),
			organizer: wrapEncIntoMailAddress("another-user@provider.com"),
			_ownerGroup: calendarGroupId,
		})
		const viewModel = await init({calendars, existingEvent, userController})
		o(viewModel.isReadOnlyEvent()).equals(false)
		o(viewModel.canModifyGuests()).equals(false)
		o(viewModel.canModifyOwnAttendance()).equals(false)
		o(viewModel.canModifyOrganizer()).equals(false)
		o(viewModel.possibleOrganizers).deepEquals([existingEvent.organizer])
	})

	o("in readonly calendar", async function () {
		const calendars = makeCalendars("shared")
		const userController = makeUserController()
		addCapability(userController.user, calendarGroupId, ShareCapability.Read)
		const existingEvent = createCalendarEvent({
			_ownerGroup: calendarGroupId,
		})
		const viewModel = await init({calendars, existingEvent, userController})

		o(viewModel.isReadOnlyEvent()).equals(true)
		o(viewModel.canModifyGuests()).equals(false)("canModifyGuests")
		o(viewModel.canModifyOwnAttendance()).equals(false)
		o(viewModel.canModifyOrganizer()).equals(false)
	})

	o("in writable calendar w/ guests", async function () {
		const calendars = makeCalendars("shared")
		const userController = makeUserController()
		addCapability(userController.user, calendarGroupId, ShareCapability.Write)
		const existingEvent = createCalendarEvent({
			summary: "existing event",
			startTime: new Date(2020, 4, 26, 12),
			endTime: new Date(2020, 4, 26, 13),
			organizer: wrapEncIntoMailAddress("another-user@provider.com"),
			_ownerGroup: calendarGroupId,
			attendees: [
				createCalendarEventAttendee({
					address: createEncryptedMailAddress({address: "attendee@example.com"})
				})
			]
		})
		const viewModel = await init({calendars, userController, existingEvent})
		o(viewModel.isReadOnlyEvent()).equals(true)
		o(viewModel.canModifyGuests()).equals(false)
		o(viewModel.canModifyOwnAttendance()).equals(false)
		o(viewModel.canModifyOrganizer()).equals(false)
		o(viewModel.possibleOrganizers).deepEquals([existingEvent.organizer])
	})

	o.spec("_hasChanges", async function () {
		o("ignore sequence", async function () {
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
				uid: "MyUid",
				sequence: "1",
				invitedConfidentially: true,
				organizer: encMailAddress,
				startTime: new Date(2020, 4, 5, 16),
				endTime: new Date(2020, 4, 6, 20),
			})
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			const viewModel = await init({userController, calendars, existingEvent, calendarModel, distributor})
			const newEvent = viewModel._initializeNewEvent()
			o(viewModel._hasChanges(newEvent)).equals(false)
			newEvent.sequence = "7"
			o(viewModel._hasChanges(newEvent)).equals(false)
		})

		o("detect changes", async function () {
			const calendars = makeCalendars("own")
			const calendarModel = makeCalendarModel()
			const distributor = makeDistributor()
			const guest = "new-attendee@example.com"
			const existingEvent = createCalendarEvent({
				_id: ["listId", "eventId"],
				_ownerGroup: calendarGroupId,
				attendees: [
					createCalendarEventAttendee({
						address: createEncryptedMailAddress({address: guest}),
						status: "0"
					})
				],
				uid: "MyUid",
				invitedConfidentially: true,
				organizer: encMailAddress,
				startTime: new Date(2020, 4, 5, 16),
				endTime: new Date(2020, 4, 6, 20),
			})
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			const viewModel = await init({userController, calendars, existingEvent, calendarModel, distributor})
			let newEvent = viewModel._initializeNewEvent()
			o(viewModel._hasChanges(newEvent)).equals(false)
			newEvent.description = "my test"
			o(viewModel._hasChanges(newEvent)).equals(true)
			newEvent.description = existingEvent.description
			o(viewModel._hasChanges(newEvent)).equals(false)
			newEvent.summary = "some nice title"
			o(viewModel._hasChanges(newEvent)).equals(true)
			newEvent.summary = existingEvent.summary
			o(viewModel._hasChanges(newEvent)).equals(false)
			newEvent.location = "some nice title"
			o(viewModel._hasChanges(newEvent)).equals(true)
			newEvent.location = existingEvent.location
			o(viewModel._hasChanges(newEvent)).equals(false)
			newEvent.startTime = new Date(2020, 4, 10, 16)
			o(viewModel._hasChanges(newEvent)).equals(true)
			newEvent.startTime = existingEvent.startTime
			o(viewModel._hasChanges(newEvent)).equals(false)
			newEvent.endTime = new Date(2020, 4, 10, 16)
			o(viewModel._hasChanges(newEvent)).equals(true)
			newEvent.endTime = existingEvent.endTime
			o(viewModel._hasChanges(newEvent)).equals(false)
			newEvent.organizer = wrapEncIntoMailAddress("otherorganizer@tutanota.com")
			o(viewModel._hasChanges(newEvent)).equals(true)
			newEvent.organizer = existingEvent.organizer
			o(viewModel._hasChanges(newEvent)).equals(false)
			newEvent.attendees.push(createCalendarEventAttendee({
				address: createEncryptedMailAddress({address: "mysecondadress@tutanota.com"})
			}))
			o(viewModel._hasChanges(newEvent)).equals(true)
			newEvent.attendees = existingEvent.attendees
			o(viewModel._hasChanges(newEvent)).equals(false)
			newEvent.attendees = [
				createCalendarEventAttendee({
					address: createEncryptedMailAddress({address: guest}),
					status: "1" // different
				})
			]
			o(viewModel._hasChanges(newEvent)).equals(true)
			newEvent.attendees = existingEvent.attendees
			o(viewModel._hasChanges(newEvent)).equals(false)
			newEvent.repeatRule = createRepeatRule()
			o(viewModel._hasChanges(newEvent)).equals(true)
			newEvent.repeatRule = existingEvent.repeatRule
			o(viewModel._hasChanges(newEvent)).equals(false)
		})

		o("do not ignore confidentiality", async function () {
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
				uid: "MyUid",
				invitedConfidentially: true,
				organizer: encMailAddress,
				startTime: new Date(2020, 4, 5, 16),
				endTime: new Date(2020, 4, 6, 20),
			})
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			const viewModel = await init({userController, calendars, existingEvent, calendarModel, distributor})
			let newEvent = viewModel._initializeNewEvent()
			o(viewModel._hasChanges(newEvent)).equals(false)
			existingEvent.invitedConfidentially = false
			o(viewModel._hasChanges(newEvent)).equals(true)
		})

		o("do not ignore uid", async function () {
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
				invitedConfidentially: true,
				organizer: encMailAddress,
				startTime: new Date(2020, 4, 5, 16),
				endTime: new Date(2020, 4, 6, 20),
			})
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			let viewModel = await init({userController, calendars, existingEvent, calendarModel, distributor})
			let newEvent = viewModel._initializeNewEvent()
			o(viewModel._hasChanges(newEvent)).equals(true)
			existingEvent.uid = "MyUid"
			viewModel = await init({userController, calendars, existingEvent, calendarModel, distributor})
			newEvent = viewModel._initializeNewEvent()
			o(viewModel._hasChanges(newEvent)).equals(false)
		})
	})

	o.spec("force update", async function () {

		o("not forcing updates to attendees, no changes, send no update", async function () {
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
				uid: "MyUid",
				invitedConfidentially: false,
				organizer: encMailAddress,
				startTime: new Date(2020, 4, 5, 16),
				endTime: new Date(2020, 4, 6, 20),
			})
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			const viewModel = await init({userController, calendars, existingEvent, calendarModel, distributor})
			updateModel.bccRecipients()[0].type = RecipientInfoType.EXTERNAL
			await updateModel.bccRecipients()[0].resolveContactPromise
			updateModel.bccRecipients()[0].contact = createContact({presharedPassword: "123"})
			updateModel.onMailChanged(true)
			askForUpdates = o.spy(() => Promise.resolve("yes"))
			askInsecurePassword = o.spy(async () => true)

			o(await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})).equals(true)
			o(calendarModel.updateEvent.calls.length).equals(1)("created event")
			o(distributor.sendUpdate.callCount).equals(0)
			o(distributor.sendCancellation.callCount).equals(0)
			o(updateModel.bccRecipients().map((a) => a.mailAddress)).deepEquals([guest])
			o(askForUpdates.calls.length).equals(0)
			// No new attendees, do not ask about password
			o(askInsecurePassword.calls.length).equals(0)
		})

		o("force sending updates to attendees, no changes", async function () {
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
				uid: "MyUid",
				invitedConfidentially: false,
				organizer: encMailAddress,
				startTime: new Date(2020, 4, 5, 16),
				endTime: new Date(2020, 4, 6, 20),
			})
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			const viewModel = await init({userController, calendars, existingEvent, calendarModel, distributor})
			updateModel.bccRecipients()[0].type = RecipientInfoType.EXTERNAL
			await updateModel.bccRecipients()[0].resolveContactPromise
			updateModel.bccRecipients()[0].contact = createContact({presharedPassword: "123"})
			updateModel.onMailChanged(true)
			askForUpdates = o.spy(() => Promise.resolve("yes"))
			askInsecurePassword = o.spy(async () => true)

			viewModel.isForceUpdates(true)
			o(await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})).equals(true)
			o(calendarModel.updateEvent.calls.length).equals(1)("created event")
			o(distributor.sendUpdate.callCount).equals(1)
			o(distributor.sendUpdate.calls[0].args[1]).equals(updateModel)
			o(distributor.sendCancellation.callCount).equals(0)
			o(updateModel.bccRecipients().map((a) => a.mailAddress)).deepEquals([guest])
			o(askForUpdates.calls.length).equals(0) // not called because we force updates
			// No new attendees, do not ask about password
			o(askInsecurePassword.calls.length).equals(0)
		})

		o("force sending updates to attendees, with changes", async function () {
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
				uid: "MyUid",
				invitedConfidentially: false,
				organizer: encMailAddress,
				startTime: new Date(2020, 4, 5, 16),
				endTime: new Date(2020, 4, 6, 20),
			})
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			const viewModel = await init({userController, calendars, existingEvent, calendarModel, distributor})
			viewModel.setStartDate(new Date(2020, 4, 3))
			updateModel.bccRecipients()[0].type = RecipientInfoType.EXTERNAL
			await updateModel.bccRecipients()[0].resolveContactPromise
			updateModel.bccRecipients()[0].contact = createContact({presharedPassword: "123"})
			updateModel.onMailChanged(true)
			askForUpdates = o.spy(() => Promise.resolve("yes"))
			askInsecurePassword = o.spy(async () => true)

			viewModel.isForceUpdates(true)
			o(await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})).equals(true)
			o(calendarModel.updateEvent.calls.length).equals(1)("created event")
			o(distributor.sendUpdate.callCount).equals(1)
			o(distributor.sendUpdate.calls[0].args[1]).equals(updateModel)
			o(distributor.sendCancellation.callCount).equals(0)
			o(updateModel.bccRecipients().map((a) => a.mailAddress)).deepEquals([guest])
			o(askForUpdates.calls.length).equals(0) // not called because updates are forced
			// No new attendees, do not ask about password
			o(askInsecurePassword.calls.length).equals(0)
		})

		o("not forcing updates to attendees, with changes", async function () {
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
				uid: "MyUid",
				invitedConfidentially: false,
				organizer: encMailAddress,
				startTime: new Date(2020, 4, 5, 16),
				endTime: new Date(2020, 4, 6, 20),
			})
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			const viewModel = await init({userController, calendars, existingEvent, calendarModel, distributor})
			viewModel.setStartDate(new Date(2020, 4, 3))
			updateModel.bccRecipients()[0].type = RecipientInfoType.EXTERNAL
			await updateModel.bccRecipients()[0].resolveContactPromise
			updateModel.bccRecipients()[0].contact = createContact({presharedPassword: "123"})
			updateModel.onMailChanged(true)
			askForUpdates = o.spy(() => Promise.resolve("yes"))
			askInsecurePassword = o.spy(async () => true)

			o(await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})).equals(true)
			o(calendarModel.updateEvent.calls.length).equals(1)("created event")
			o(distributor.sendUpdate.callCount).equals(1)
			o(distributor.sendUpdate.calls[0].args[1]).equals(updateModel)
			o(distributor.sendCancellation.callCount).equals(0)
			o(updateModel.bccRecipients().map((a) => a.mailAddress)).deepEquals([guest])
			o(askForUpdates.calls.length).equals(1)
			// No new attendees, do not ask about password
			o(askInsecurePassword.calls.length).equals(0)
		})
	})

	o.spec("delete event", async function () {
		o("own event with internal attendees in own calendar", async function () {
			const calendars = makeCalendars("own")
			const distributor = makeDistributor()
			const attendee = makeAttendee()
			const ownAttendee = makeAttendee(encMailAddress.address)
			const calendarModel = makeCalendarModel()
			internalAddresses = [attendee.address.address]
			const mailModel = downcast({})
			const existingEvent = createCalendarEvent({
				_id: ["listid", "calendarid"],
				_ownerGroup: calendarGroupId,
				organizer: encMailAddress,
				attendees: [ownAttendee, attendee],
				sequence: "1",
			})
			const newEvent = createCalendarEvent({
				_id: ["listid", "calendarid"],
				_ownerGroup: calendarGroupId,
				organizer: encMailAddress,
				attendees: [ownAttendee, attendee],
				sequence: "2",
				startTime: existingEvent.startTime,
				endTime: existingEvent.endTime,
			})
			const viewModel = await init({calendars, existingEvent, calendarModel, distributor, mailModel})

			await viewModel.deleteEvent()

			// This doesn't always pass because sometimes the start and end times are off by a fraction of a second
			o(calendarModel.deleteEvent.calls.map(c => c.args)).deepEquals([[existingEvent]])
			o(distributor.sendCancellation.calls.map(c => c.args[0])).deepEquals([newEvent])
			o(cancelModel.bccRecipients().map(r => r.mailAddress)).deepEquals([attendee.address.address])
		})

		o("own event with external attendees in own calendar, has password, not confidential", async function () {
			const calendars = makeCalendars("own")
			const distributor = makeDistributor()
			const attendee = makeAttendee()
			const ownAttendee = makeAttendee(encMailAddress.address)
			const calendarModel = makeCalendarModel()
			const mailModel = downcast({})
			const contact = createContact({
				mailAddresses: [createContactMailAddress({address: attendee.address.address})],
				presharedPassword: "123",
			})
			const contactModel = makeContactModel([contact])

			const startTime = DateTime.fromISO("2016-05-25T09:08:34.123", {zone: "UTC"}).toJSDate()
			const endTime = DateTime.fromISO("2016-05-25T09:09:34.123", {zone: "UTC"}).toJSDate()

			const existingEvent = createCalendarEvent({
				_id: ["listid", "calendarid"],
				_ownerGroup: calendarGroupId,
				organizer: encMailAddress,
				attendees: [ownAttendee, attendee],
				sequence: "1",
				invitedConfidentially: false,
				startTime,
				endTime

			})
			const newEvent = createCalendarEvent({
				_id: ["listid", "calendarid"],
				_ownerGroup: calendarGroupId,
				organizer: encMailAddress,
				attendees: [ownAttendee, attendee],
				sequence: "2",
				invitedConfidentially: false,
				startTime,
				endTime

			})
			const viewModel = await init({calendars, existingEvent, calendarModel, distributor, mailModel, contactModel})

			await viewModel.deleteEvent()

			o(calendarModel.deleteEvent.calls.map(c => c.args)).deepEquals([[existingEvent]])
			o(distributor.sendCancellation.calls.map(c => c.args[0])).deepEquals([newEvent])
			o(cancelModel.bccRecipients().map(r => r.mailAddress)).deepEquals([attendee.address.address])
		})

		o("own event with external attendees in own calendar, has password, confidential", async function () {
			const calendars = makeCalendars("own")
			const distributor = makeDistributor()
			const attendee = makeAttendee()
			const ownAttendee = makeAttendee(encMailAddress.address)
			const calendarModel = makeCalendarModel()
			const mailModel = downcast({})
			const contact = createContact({
				mailAddresses: [createContactMailAddress({address: attendee.address.address})],
				presharedPassword: "123",
			})
			const contactModel = makeContactModel([contact])
			const existingEvent = createCalendarEvent({
				_id: ["listid", "calendarid"],
				_ownerGroup: calendarGroupId,
				organizer: encMailAddress,
				attendees: [ownAttendee, attendee],
				sequence: "1",
				invitedConfidentially: true,
			})
			const newEvent = createCalendarEvent({
				_id: ["listid", "calendarid"],
				_ownerGroup: calendarGroupId,
				organizer: encMailAddress,
				attendees: [ownAttendee, attendee],
				sequence: "2",
				invitedConfidentially: true,
			})
			const viewModel = await init({calendars, existingEvent, calendarModel, distributor, mailModel, contactModel})

			await viewModel.deleteEvent()

			// This doesn't always pass because sometimes the start and end times are off by a fraction of a second
			o(calendarModel.deleteEvent.calls.map(c => c.args)).deepEquals([[existingEvent]])
			o(distributor.sendCancellation.calls.map(c => c.args[0])).deepEquals([newEvent])
			o(cancelModel.bccRecipients().map(r => r.mailAddress)).deepEquals([attendee.address.address])
		})

		o("own event with external attendees in own calendar, no password, confidential", async function () {
			// There should no cancellations sent to attendees without password as we cannot encrypt emails
			const calendars = makeCalendars("own")
			const distributor = makeDistributor()
			const attendee = makeAttendee()
			const ownAttendee = makeAttendee(encMailAddress.address)
			const calendarModel = makeCalendarModel()
			const mailModel = downcast({})
			const contact = createContact({
				mailAddresses: [createContactMailAddress({address: attendee.address.address})],
				presharedPassword: null,
			})
			const contactModel = makeContactModel([contact])
			const existingEvent = createCalendarEvent({
				_id: ["listid", "calendarid"],
				_ownerGroup: calendarGroupId,
				organizer: encMailAddress,
				attendees: [ownAttendee, attendee],
				sequence: "1",
				invitedConfidentially: true,
			})
			const viewModel = await init({calendars, existingEvent, calendarModel, distributor, mailModel, contactModel})

			await viewModel.deleteEvent()

			// This doesn't always pass because sometimes the start and end times are off by a fraction of a second
			o(calendarModel.deleteEvent.calls.map(c => c.args)).deepEquals([[existingEvent]])
			o(distributor.sendCancellation.calls.map(c => c.args[0])).deepEquals([])
			o(cancelModel.bccRecipients().map(r => r.mailAddress)).deepEquals([])
		})

		o("own event with external eventually resolved attendees in own calendar, no password, confidential", async function () {
			// There should no cancellations sent to attendees without password as we cannot encrypt emails
			const calendars = makeCalendars("own")
			const distributor = makeDistributor()
			const attendee = makeAttendee()
			const ownAttendee = makeAttendee(encMailAddress.address)
			const calendarModel = makeCalendarModel()
			const mailModel = downcast({}) // delay resolving
			const contact = createContact({
				mailAddresses: [createContactMailAddress({address: attendee.address.address})],
				presharedPassword: null,
			})
			const contactModel = makeContactModel([contact])
			const existingEvent = createCalendarEvent({
				_id: ["listid", "calendarid"],
				_ownerGroup: calendarGroupId,
				organizer: encMailAddress,
				attendees: [ownAttendee, attendee],
				sequence: "1",
				invitedConfidentially: true,
			})
			const viewModel = await init({calendars, existingEvent, calendarModel, distributor, mailModel, contactModel})

			await viewModel.deleteEvent()

			// This doesn't always pass because sometimes the start and end times are off by a fraction of a second
			o(calendarModel.deleteEvent.calls.map(c => c.args)).deepEquals([[existingEvent]])
			o(distributor.sendCancellation.calls.map(c => c.args[0])).deepEquals([])
			o(cancelModel.bccRecipients().map(r => r.mailAddress)).deepEquals([])
		})

		o("own event without attendees in own calendar", async function () {
			const calendars = makeCalendars("own")
			const distributor = makeDistributor()
			const calendarModel = makeCalendarModel()
			const existingEvent = createCalendarEvent({
				_id: ["listid", "calendarid"],
				_ownerGroup: calendarGroupId,
				organizer: encMailAddress,
				attendees: []
			})
			const viewModel = await init({calendars, existingEvent, calendarModel, distributor})
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
				organizer: wrapEncIntoMailAddress("another-address@example.com"),
				attendees: [attendee],
			})
			const viewModel = await init({calendars, existingEvent, calendarModel, distributor})
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
				organizer: encMailAddress,
				attendees: [attendee],
			})
			const viewModel = await init({calendars, existingEvent, calendarModel, distributor, userController})
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
				organizer: encMailAddress,
				attendees: [],
			})
			const viewModel = await init({calendars, existingEvent, calendarModel, distributor})
			await viewModel.deleteEvent()
			o(calendarModel.deleteEvent.calls.map(c => c.args)).deepEquals([[existingEvent]])
			o(distributor.sendCancellation.calls).deepEquals([])
		})

		o("in own calendar, self is only attendee", async function () {
			const calendars = makeCalendars("own")
			const userController = makeUserController()
			const distributor = makeDistributor()
			const calendarModel = makeCalendarModel()
			const attendee = makeAttendee(encMailAddress.address)
			const existingEvent = createCalendarEvent({
				_id: ["listid", "calendarid"],
				_ownerGroup: calendarGroupId,
				organizer: encMailAddress,
				attendees: [attendee],
			})
			const viewModel = await init({calendars, existingEvent, calendarModel, distributor, userController})
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
			const viewModel = await init({calendars, existingEvent: null, calendarModel, distributor})
			const summary = "Summary"
			viewModel.summary(summary)
			const newDescription = "new description"
			viewModel.changeDescription(newDescription)

			o(await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})).deepEquals(true)

			const [createdEvent] = calendarModel.createEvent.calls[0].args
			o(createdEvent.summary).equals("Summary")
			o(createdEvent.description).equals(newDescription)
			o(distributor.sendInvite.callCount).equals(0)
			o(distributor.sendCancellation.callCount).equals(0)
			o(askForUpdates.callCount).equals(0)
			o(askInsecurePassword.callCount).equals(0)
		})

		o("own calendar, new guests", async function () {
			const calendars = makeCalendars("own")
			const calendarModel = makeCalendarModel()
			const distributor = makeDistributor()
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			const viewModel = await init({userController, calendars, existingEvent: null, calendarModel, distributor})
			const newGuest = "new-attendee@example.com"

			viewModel.addGuest(newGuest)
			askInsecurePassword = o.spy(async () => true)
			o(await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})).deepEquals(true)

			o(calendarModel.createEvent.calls.length).equals(1)("created event")
			o(distributor.sendInvite.calls[0].args[1]).deepEquals(inviteModel)
			o(distributor.sendCancellation.callCount).equals(0)
			o(inviteModel.bccRecipients().map(r => r.mailAddress)).deepEquals([newGuest])

			const createdEvent = calendarModel.createEvent.calls[0].args[0]
			o(createdEvent.attendees.map((a) => ({status: a.status, address: a.address}))).deepEquals([
				{status: CalendarAttendeeStatus.ACCEPTED, address: encMailAddress},
				{status: CalendarAttendeeStatus.NEEDS_ACTION, address: createEncryptedMailAddress({address: newGuest})},
			])
			o(askForUpdates.callCount).equals(0)
			o(askInsecurePassword.callCount).equals(0)
		})

		o("own calendar, new guests, premium no business feature", async function () {
			const calendars = makeCalendars("own")
			const calendarModel = makeCalendarModel()
			const distributor = makeDistributor()
			const userController = makeUserController([], AccountType.PREMIUM, "", false)
			const viewModel = await init({userController, calendars, existingEvent: null, calendarModel, distributor})
			const newGuest = "new-attendee@example.com"

			viewModel.addGuest(newGuest)
			askInsecurePassword = o.spy(async () => true)
			const e = await assertThrows(BusinessFeatureRequiredError, () => viewModel.saveAndSend({
				askForUpdates,
				askInsecurePassword,
				showProgress
			}))
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
				organizer: encMailAddress,
				startTime: new Date(2020, 4, 5, 16),
				endTime: new Date(2020, 4, 6, 20),
			})
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			const viewModel = await init({userController, calendars, existingEvent, calendarModel, distributor})
			viewModel.setStartDate(new Date(2020, 4, 3))
			askForUpdates = o.spy(() => Promise.resolve("yes"))

			o(await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})).equals(true)
			o(calendarModel.updateEvent.calls.length).equals(1)("created event")
			o(distributor.sendUpdate.calls[0].args[1]).equals(updateModel)
			o(distributor.sendCancellation.callCount).equals(0)
			o(updateModel.bccRecipients().map((a) => a.mailAddress)).deepEquals([guest])
			o(askForUpdates.calls.length).equals(1)
			o(askInsecurePassword.callCount).equals(0)
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
				organizer: encMailAddress,
				startTime: new Date(2020, 4, 5, 16),
				endTime: new Date(2020, 4, 6, 20),
			})
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			const viewModel = await init({userController, calendars, existingEvent, calendarModel, distributor})
			viewModel.setStartDate(new Date(2020, 4, 3))
			viewModel.addGuest(newGuest)
			viewModel.removeAttendee(toRemoveGuest)
			askForUpdates = o.spy(() => Promise.resolve("yes"))

			await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})

			o(calendarModel.updateEvent.calls.length).equals(1)("created event")
			o(distributor.sendUpdate.calls[0].args[1]).equals(updateModel)("update")
			o(updateModel.bccRecipients().map(getAddress)).deepEquals([oldGuest])
			o(distributor.sendInvite.calls[0].args[1]).equals(inviteModel)("invite")
			o(inviteModel.bccRecipients().map(getAddress)).deepEquals([newGuest])
			o(distributor.sendCancellation.calls[0].args[1]).equals(cancelModel)("cancel")
			o(cancelModel.bccRecipients().map(getAddress)).deepEquals([toRemoveGuest.address.address])
			o(askForUpdates.calls.length).equals(1)
			o(askInsecurePassword.callCount).equals(0)
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
				organizer: encMailAddress,
				startTime: new Date(2020, 4, 5, 16),
				endTime: new Date(2020, 4, 6, 20),
			})
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			const viewModel = await init({userController, calendars, existingEvent, calendarModel, distributor})
			updateModel.bccRecipients()[0].type = RecipientInfoType.EXTERNAL
			await updateModel.bccRecipients()[0].resolveContactPromise
			updateModel.bccRecipients()[0].contact = createContact({presharedPassword: "123"})
			updateModel.onMailChanged(true)
			viewModel.setStartDate(new Date(2020, 4, 3))
			askForUpdates = o.spy(() => Promise.resolve("yes"))
			askInsecurePassword = o.spy(async () => true)

			o(await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})).equals(true)
			o(calendarModel.updateEvent.calls.length).equals(1)("created event")
			o(distributor.sendUpdate.calls[0].args[1]).equals(updateModel)
			o(distributor.sendCancellation.callCount).equals(0)
			o(updateModel.bccRecipients().map((a) => a.mailAddress)).deepEquals([guest])
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
				organizer: encMailAddress,
				startTime: new Date(2020, 4, 5, 16),
				endTime: new Date(2020, 4, 6, 20),
			})
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			const viewModel = await init({userController, calendars, existingEvent, calendarModel, distributor})
			updateModel.bccRecipients()[0].type = RecipientInfoType.EXTERNAL
			viewModel.updatePassword(viewModel.attendees()[0], "123")
			viewModel.setStartDate(new Date(2020, 4, 3))
			askForUpdates = o.spy(() => Promise.resolve("yes"))
			askInsecurePassword = o.spy(async () => false)

			viewModel.addGuest(newGuest, null)

			o(await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})).equals(false)

			o(calendarModel.updateEvent.calls.length).equals(0)
			o(distributor.sendUpdate.calls.length).equals(0)
			o(distributor.sendCancellation.callCount).equals(0)
			o(updateModel.bccRecipients().map((a) => a.mailAddress)).deepEquals([guest])
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
				organizer: encMailAddress,
				startTime: new Date(2020, 4, 5, 16),
				endTime: new Date(2020, 4, 6, 20),
			})
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			const viewModel = await init({userController, calendars, existingEvent, calendarModel, distributor})
			viewModel.setStartDate(new Date(2020, 4, 3))
			viewModel.addGuest(newGuest)
			viewModel.removeAttendee(toRemoveGuest)
			askForUpdates = o.spy(() => Promise.resolve("no"))

			o(await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})).equals(true)

			o(calendarModel.updateEvent.calls.length).equals(1)("created event")
			o(distributor.sendUpdate.callCount).equals(0)
			o(distributor.sendInvite.calls.length).equals(1)("sent invite")
			o(distributor.sendCancellation.calls.length).equals(1)("sent cancellation")
			o(askForUpdates.calls.length).equals(1)
			o(askInsecurePassword.callCount).equals(0)
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
				organizer: encMailAddress,
				startTime: new Date(2020, 4, 5, 16),
				endTime: new Date(2020, 4, 6, 20),
			})
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			const viewModel = await init({userController, calendars, existingEvent, calendarModel, distributor})
			viewModel.setStartDate(new Date(2020, 4, 3))
			viewModel.addGuest(newGuest)
			viewModel.removeAttendee(toRemoveGuest)
			askForUpdates = o.spy(() => Promise.resolve("cancel"))

			o(await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})).equals(false)

			o(calendarModel.updateEvent.calls.length).equals(0)("did not created event")
			o(distributor.sendUpdate.callCount).equals(0)
			o(distributor.sendInvite.calls.length).equals(0)("did not sent invite")
			o(distributor.sendCancellation.calls.length).equals(0)("did not sent cancellation")
			o(askForUpdates.calls.length).equals(1)
			o(askInsecurePassword.callCount).equals(0)
		})

		o("own calendar, only removed guests, send updates", async function () {
			const calendars = makeCalendars("own")
			const calendarModel = makeCalendarModel()
			const distributor = makeDistributor()
			const toRemoveGuest: Guest = {
				address: createEncryptedMailAddress({address: "remove-attendee@example.com"}),
				type: RecipientInfoType.EXTERNAL,
				status: CalendarAttendeeStatus.ACCEPTED,
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
				organizer: encMailAddress,
				startTime: new Date(2020, 4, 5, 16),
				endTime: new Date(2020, 4, 6, 20),
			})
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			const viewModel = await init({userController, calendars, existingEvent, calendarModel, distributor})
			viewModel.setStartDate(new Date(2020, 4, 3))
			viewModel.removeAttendee(toRemoveGuest)
			askForUpdates = o.spy(async () => "yes")

			o(await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})).equals(true)
			o(calendarModel.updateEvent.calls.length).equals(1)("created event")
			o(distributor.sendCancellation.calls[0].args[1]).equals(cancelModel)
			o(cancelModel.bccRecipients().map(getAddress)).deepEquals([toRemoveGuest.address.address])
			// There are only removed guests, we always send to them
			o(askForUpdates.calls.length).equals(0)
			o(askInsecurePassword.callCount).equals(0)
		})

		o("send response", async function () {
			const mail = createMail()
			const calendars = makeCalendars("own")
			const calendarModel = makeCalendarModel()
			const distributor = makeDistributor()
			const ownAttendee = createCalendarEventAttendee({
				address: encMailAddress,
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
				organizer: wrapEncIntoMailAddress(organizerAddress),
				attendees: [ownAttendee, anotherAttendee],
			})
			const viewModel = await init({calendars, existingEvent, calendarModel, distributor, mail})
			viewModel.selectGoing(CalendarAttendeeStatus.ACCEPTED)
			o(await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})).equals(true)

			// As it is a "new" event, we must create it, not update
			const [createdEvent] = calendarModel.createEvent.calls[0].args
			o(createdEvent.attendees.length).equals(2)
			o(createdEvent.attendees.find(a =>
				a.address.address === ownAttendee.address.address).status).equals(CalendarAttendeeStatus.ACCEPTED)
			o(createdEvent.attendees.find(a =>
				a.address.address === anotherAttendee.address.address).status).equals(CalendarAttendeeStatus.DECLINED)

			o(distributor.sendUpdate.callCount).equals(0)
			o(distributor.sendInvite.callCount).equals(0)
			o(distributor.sendCancellation.callCount).equals(0)
			o(distributor.sendResponse.calls.map(call => call.args))
				.deepEquals([[createdEvent, responseModel, encMailAddress.address, mail, CalendarAttendeeStatus.ACCEPTED]])
			o(responseModel.toRecipients().map(getAddress)).deepEquals([organizerAddress])
			o(askForUpdates.callCount).equals(0)
			o(askInsecurePassword.callCount).equals(0)
		})

		o("existing event times preserved", async function () {
			const calendars = makeCalendars("own")
			const calendarModel = makeCalendarModel()
			const startTime = DateTime.fromObject({year: 2020, month: 6, day: 4, hour: 12, zone}).toJSDate()
			const endTime = DateTime.fromObject({year: 2020, month: 6, day: 4, hour: 13, zone}).toJSDate()
			const existingEvent = createCalendarEvent({_id: ["listId", "eventId"], startTime, endTime})
			const viewModel = await init({calendars, existingEvent, calendarModel})

			o(await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})).deepEquals(true)
			const [createdEvent] = calendarModel.updateEvent.calls[0].args
			o(createdEvent.startTime.toISOString()).deepEquals(startTime.toISOString())
			o(createdEvent.endTime.toISOString()).deepEquals(endTime.toISOString())
			o(askForUpdates.callCount).equals(0)
			o(askInsecurePassword.callCount).equals(0)
		})

		o("invite to self is not sent", async function () {
			const calendars = makeCalendars("own")
			const calendarModel = makeCalendarModel()
			const distributor = makeDistributor()
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			const viewModel = await init({userController, calendars, existingEvent: null, calendarModel, distributor})
			const newGuest = "new-attendee@example.com"
			viewModel.addGuest(newGuest)
			viewModel.addGuest(encMailAddress.address)


			o(await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})).equals(true)
			o(calendarModel.createEvent.calls.length).equals(1)("created event")
			o(distributor.sendInvite.calls[0].args[1]).equals(inviteModel)
			o(inviteModel.bccRecipients().map(getAddress)).deepEquals([newGuest])
			o(distributor.sendCancellation.callCount).equals(0)
			o(askForUpdates.callCount).equals(0)
			o(askInsecurePassword.callCount).equals(0)
		})

		o("update to self is not sent", async function () {
			const calendars = makeCalendars("own")
			const distributor = makeDistributor()
			const ownAttendee = createCalendarEventAttendee({
				address: encMailAddress,
				status: CalendarAttendeeStatus.NEEDS_ACTION,
			})
			const anotherAttendee = createCalendarEventAttendee({
				address: createEncryptedMailAddress({address: "another-attendee@example.com"}),
				status: CalendarAttendeeStatus.DECLINED,
			})
			const alias = "alias@tutanota.com"
			const userController = makeUserController([alias], AccountType.PREMIUM, "", true)
			const existingEvent = createCalendarEvent({
				_ownerGroup: calendarGroupId,
				startTime: new Date(2020, 5, 1),
				endTime: new Date(2020, 5, 2),
				organizer: wrapEncIntoMailAddress(alias),
				attendees: [ownAttendee, anotherAttendee],
			})
			const viewModel = await init({userController, calendars, distributor, existingEvent})
			const askForUpdates = o.spy(() => Promise.resolve("yes"))

			await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})

			o(distributor.sendUpdate.calls[0].args[1]).equals(updateModel)
			o(updateModel.bccRecipients().map(getAddress)).deepEquals([anotherAttendee.address.address])
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
			const userController = makeUserController([alias], AccountType.PREMIUM, "", true)
			const existingEvent = createCalendarEvent({
				_ownerGroup: calendarGroupId,
				startTime: new Date(2020, 5, 1),
				endTime: new Date(2020, 5, 2),
				organizer: wrapEncIntoMailAddress(alias),
				attendees: [anotherAttendee],
			})
			const viewModel = await init({userController, calendars, distributor, existingEvent})
			askForUpdates = o.spy(() => Promise.resolve("yes"))

			viewModel.addGuest(encMailAddress.address)
			await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})

			o(distributor.sendUpdate.calls[0].args[1]).equals(updateModel)
			o(updateModel.bccRecipients().map(getAddress)).deepEquals([anotherAttendee.address.address])
			o(distributor.sendInvite.callCount).equals(0)("Invite is not called")
			// Update is asked because there's another attendee
			o(askForUpdates.calls.length).equals(1)
		})

		o("does not ask for updates if only self is present", async function () {
			const calendars = makeCalendars("own")
			const distributor = makeDistributor()
			const ownAttendee = createCalendarEventAttendee({
				address: encMailAddress,
				status: CalendarAttendeeStatus.NEEDS_ACTION,
			})
			const alias = "alias@tutanota.com"
			const userController = makeUserController([alias], AccountType.PREMIUM, "", true)
			const existingEvent = createCalendarEvent({
				startTime: new Date(2020, 5, 1),
				endTime: new Date(2020, 5, 2),
				organizer: wrapEncIntoMailAddress(alias),
				attendees: [ownAttendee],
			})
			const viewModel = await init({userController, calendars, distributor, existingEvent})
			o(await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})).equals(true)
			o(askForUpdates.calls.length).equals(0)
			o(askInsecurePassword.calls.length).equals(0)
		})

		o("does not ask for updates if alarm is changed in shared calendar", async function () {
			const calendars = makeCalendars("shared")
			const calendarModel = makeCalendarModel()
			const existingEvent = createCalendarEvent({
				_id: ["listId", "eventId"],
				organizer: wrapEncIntoMailAddress("organizer@tutanota.de"),
				startTime: DateTime.utc(2020, 6, 11).toJSDate(),
				endTime: DateTime.utc(2020, 7, 12).toJSDate(),
				_ownerGroup: calendarGroupId,
				attendees: [
					createCalendarEventAttendee({
						address: createEncryptedMailAddress({address: "guest@tutanota.com"})
					})
				]
			})
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			const viewModel = await init({userController, calendarModel, calendars, existingEvent})

			viewModel.addAlarm(AlarmInterval.FIVE_MINUTES)
			o(await viewModel.saveAndSend({askForUpdates, askInsecurePassword, showProgress})).equals(true)

			o(calendarModel.updateEvent.calls.length).equals(1)("Did update event")
			o(askForUpdates.calls.length).equals(0)
		})
	})

	o("send invite with alias as default sender", async function () {
		const calendars = makeCalendars("own")
		const distributor = makeDistributor()
		const alias = "alias@tutanota.com"
		const userController = makeUserController([alias], AccountType.PREMIUM, alias)
		const viewModel = await init({calendars, distributor, userController, existingEvent: null})
		viewModel.setConfidential(false)
		viewModel.addGuest("guest@external.de")
		o(viewModel.attendees().length).equals(2)
		o(viewModel.organizer).deepEquals(wrapEncIntoMailAddress(alias))

		const attendees = viewModel.attendees()
		o(attendees.find(guest => guest.address.address === "guest@external.de")).notEquals(undefined)
		o(attendees.find(guest => guest.address.address === alias)).notEquals(undefined)
		o(attendees.find(guest => guest.address.address === "address@tutanota.com")).equals(undefined)
	})

	o("invite self to set organizer with existing attendees", async function () {
		const calendars = makeCalendars("own")
		const distributor = makeDistributor()
		const alias = "alias@tutanota.com"
		const aliasEncMailAddress = wrapEncIntoMailAddress(alias)
		const userController = makeUserController([alias], AccountType.PREMIUM)
		const viewModel = await init({calendars, distributor, userController, existingEvent: null})
		const attendees = viewModel.attendees

		viewModel.setConfidential(false)
		viewModel.addGuest("guest@external.de")
		o(attendees().length).equals(2)
		o(viewModel.organizer).deepEquals(encMailAddress)

		viewModel.addGuest(accountMailAddress)
		o(attendees().length).equals(2)
		o(viewModel.organizer).deepEquals(encMailAddress)
		o(attendees().find(guest => guest.address.address === "guest@external.de")).notEquals(undefined)
		o(attendees().find(guest => guest.address.address === accountMailAddress)).notEquals(undefined)
		o(attendees().find(guest => guest.address.address === alias)).equals(undefined)

		viewModel.addGuest(alias)
		o(attendees().length).equals(2)
		o(viewModel.organizer).deepEquals(aliasEncMailAddress)("the organizer should now be the alias")
		o(attendees().find(guest => guest.address.address === "guest@external.de")).notEquals(undefined)
		o(attendees().find(guest => guest.address.address === alias)).notEquals(undefined)
		o(attendees().find(guest => guest.address.address === accountMailAddress)).equals(undefined)
	})

	o("invite self as first attendee", async function () {
		const calendars = makeCalendars("own")
		const distributor = makeDistributor()
		const alias = "alias@tutanota.com"
		const userController = makeUserController([alias], AccountType.PREMIUM)
		const viewModel = await init({calendars, distributor, userController, existingEvent: null})
		const attendees = viewModel.attendees

		viewModel.setConfidential(false)
		viewModel.addGuest(accountMailAddress)
		o(attendees().length).equals(1)
		o(viewModel.organizer).deepEquals(encMailAddress)
		o(attendees().find(guest => guest.address.address === accountMailAddress)).notEquals(undefined)
	})


	o("invite alias as first attendee", async function () {
		const calendars = makeCalendars("own")
		const distributor = makeDistributor()
		const alias = "alias@tutanota.com"
		const aliasEncMailAddress = wrapEncIntoMailAddress(alias)
		const userController = makeUserController([alias], AccountType.PREMIUM)
		const viewModel = await init({calendars, distributor, userController, existingEvent: null})
		const attendees = viewModel.attendees

		viewModel.setConfidential(false)
		viewModel.addGuest(alias)
		o(attendees().length).equals(1)
		o(viewModel.organizer).deepEquals(aliasEncMailAddress)
		o(attendees().find(guest => guest.address.address === alias)).notEquals(undefined)
	})

	o.spec("onStartDateSelected", function () {
		o("date adjusted forward", async function () {
			const calendars = makeCalendars("own")
			const existingEvent = createCalendarEvent({
				startTime: DateTime.fromObject({year: 2020, month: 6, day: 8, hour: 13, zone}).toJSDate(),
				endTime: DateTime.fromObject({year: 2020, month: 6, day: 9, hour: 15, zone}).toJSDate(),
			})
			const viewModel = await init({calendars, existingEvent})
			viewModel.setStartDate(DateTime.fromObject({year: 2020, month: 6, day: 10, zone}).toJSDate())

			// No hours because it's a "date", not "time" field.
			o(viewModel.endDate.toISOString())
				.equals(DateTime.fromObject({year: 2020, month: 6, day: 11, zone}).toJSDate().toISOString())
			o(viewModel.endTime?.toObject()).deepEquals({hours: 15, minutes: 0})
		})

		o("date adjusted backwards", async function () {
			const calendars = makeCalendars("own")
			const existingEvent = createCalendarEvent({
				startTime: DateTime.fromObject({year: 2020, month: 6, day: 8, hour: 13, zone}).toJSDate(),
				endTime: DateTime.fromObject({year: 2020, month: 6, day: 9, hour: 15, zone}).toJSDate(),
			})
			const viewModel = await init({calendars, existingEvent})
			viewModel.setStartDate(DateTime.fromObject({year: 2020, month: 6, day: 6, zone}).toJSDate())

			// No hours because it's a "date", not "time" field.
			o(viewModel.endDate.toISOString())
				.equals(DateTime.fromObject({year: 2020, month: 6, day: 7, zone}).toJSDate().toISOString())
			o(viewModel.endTime?.toObject()).deepEquals({hours: 15, minutes: 0})
		})
	})

	o.spec("onStartTimeSelected", function () {
		o("time adjusted forward", async function () {
			const calendars = makeCalendars("own")
			const existingEvent = createCalendarEvent({
				startTime: DateTime.fromObject({year: 2020, month: 6, day: 8, hour: 13, zone}).toJSDate(),
				endTime: DateTime.fromObject({year: 2020, month: 6, day: 8, hour: 15, zone}).toJSDate(),
			})
			const viewModel = await init({calendars, existingEvent})
			viewModel.setStartTime(new Time(14, 0))

			// No hours because it's a "date", not "time" field.
			o(viewModel.endDate.toISOString())
				.equals(DateTime.fromObject({year: 2020, month: 6, day: 8, zone}).toJSDate().toISOString())
			o(viewModel.endTime?.to24HourString()).deepEquals("16:00")
		})

		o("time adjusted backward", async function () {
			const calendars = makeCalendars("own")
			const existingEvent = createCalendarEvent({
				startTime: DateTime.fromObject({year: 2020, month: 6, day: 8, hour: 13, zone}).toJSDate(),
				endTime: DateTime.fromObject({year: 2020, month: 6, day: 8, hour: 15, zone}).toJSDate(),
			})
			const viewModel = await init({calendars, existingEvent})
			viewModel.setStartTime(new Time(12, 0))

			// No hours because it's a "date", not "time" field.
			o(viewModel.endDate.toISOString())
				.equals(DateTime.fromObject({year: 2020, month: 6, day: 8, zone}).toJSDate().toISOString())
			o(viewModel.endTime?.toObject()).deepEquals({hours: 14, minutes: 0})
		})

		o("time not adjust when different day", async function () {
			const calendars = makeCalendars("own")
			const existingEvent = createCalendarEvent({
				startTime: DateTime.fromObject({year: 2020, month: 6, day: 8, hour: 13, zone}).toJSDate(),
				endTime: DateTime.fromObject({year: 2020, month: 6, day: 9, hour: 15, zone}).toJSDate(),
			})
			const viewModel = await init({calendars, existingEvent})
			viewModel.setStartTime(new Time(12, 0))

			// No hours because it's a "date", not "time" field.
			o(viewModel.endDate.toISOString())
				.equals(DateTime.fromObject({year: 2020, month: 6, day: 9, zone}).toJSDate().toISOString())
			o(viewModel.endTime?.to24HourString()).equals("15:00")
		})
	})

	o.spec("addGuest", function () {

		o("to new event", async function () {
			const calendars = makeCalendars("own")
			const viewModel = await init({calendars, existingEvent: null})
			const newGuest = "new-attendee@example.com"

			viewModel.addGuest(newGuest)

			o(viewModel.attendees()).deepEquals([
				{
					address: encMailAddress,
					type: RecipientInfoType.INTERNAL,
					status: CalendarAttendeeStatus.ACCEPTED,
				},
				{
					address: createEncryptedMailAddress({address: newGuest}),
					type: RecipientInfoType.UNKNOWN, //add guest does not wait for recipient info to be resolved
					status: CalendarAttendeeStatus.ADDED,
				},
			])

			await delay(resolveRecipientMs)
			o(viewModel.attendees()[1].type).equals(RecipientInfoType.EXTERNAL)
		})

		o("to existing event", async function () {
			const calendars = makeCalendars("own")
			const existingEvent = createCalendarEvent({
				_ownerGroup: calendarGroupId,
			})
			const viewModel = await init({calendars, existingEvent})
			const newGuest = "new-attendee@example.com"

			viewModel.addGuest(newGuest)

			o(viewModel.attendees()).deepEquals([
				{
					address: encMailAddress,
					type: RecipientInfoType.INTERNAL,
					status: CalendarAttendeeStatus.ACCEPTED,
				},
				{
					address: createEncryptedMailAddress({address: newGuest}),
					type: RecipientInfoType.UNKNOWN,  //add guest does not wait for recipient info to be resolved
					status: CalendarAttendeeStatus.ADDED,
				},
			])

			await delay(resolveRecipientMs)
			o(viewModel.attendees()[1].type).equals(RecipientInfoType.EXTERNAL)
		})

		o("to existing event as duplicate", async function () {
			const calendars = makeCalendars("own")
			const guest = "new-attendee@example.com"
			const existingEvent = createCalendarEvent({
				attendees: [createCalendarEventAttendee({address: createEncryptedMailAddress({address: guest})})]
			})
			const viewModel = await init({calendars, existingEvent})

			viewModel.addGuest(guest)

			// Organizer is not added because new attendee was not added
			o(viewModel.attendees()).deepEquals([
				{
					address: createEncryptedMailAddress({address: guest}),
					type: RecipientInfoType.UNKNOWN,  //new CalendarEventViewModel does not wait for recipient info to be resolved
					status: CalendarAttendeeStatus.ADDED,
				},
			])

			await delay(resolveRecipientMs)
			o(viewModel.attendees()[0].type).equals(RecipientInfoType.EXTERNAL)

		})
	})

	o.spec("selectGoing", function () {
		o("as a free user", async function () {
			const calendars = makeCalendars("own")
			const userController = makeUserController([], AccountType.FREE)
			const ownAttendee = createCalendarEventAttendee({
				address: encMailAddress,
			})
			const existingEvent = createCalendarEvent({
				attendees: [clone(ownAttendee)],
				organizer: wrapEncIntoMailAddress("some-organizer@example.com"),
			})
			const viewModel = await init({calendars, userController, existingEvent})

			viewModel.selectGoing(CalendarAttendeeStatus.ACCEPTED)
			o(viewModel.attendees()).deepEquals([
				{
					address: ownAttendee.address,
					status: CalendarAttendeeStatus.ACCEPTED,
					type: RecipientInfoType.INTERNAL,
				}
			])
		})

		o("status of own attendee is changed selected in own event", async function () {
			const calendars = makeCalendars("own")
			const attendee = createCalendarEventAttendee({
				address: createEncryptedMailAddress({address: "guest@example.com"})
			})
			const ownAttendee = createCalendarEventAttendee({
				address: encMailAddress,
			})
			const existingEvent = createCalendarEvent({
				attendees: [attendee, ownAttendee]
			})
			const viewModel = await init({calendars, existingEvent})

			viewModel.selectGoing(CalendarAttendeeStatus.DECLINED)

			o(viewModel.attendees()).deepEquals([
				{
					address: encMailAddress,
					type: RecipientInfoType.INTERNAL,
					status: CalendarAttendeeStatus.DECLINED,
				},
				{
					address: attendee.address,
					type: RecipientInfoType.UNKNOWN,  //new CalendarEventViewModel does not wait for recipient info to be resolved
					status: CalendarAttendeeStatus.ADDED,
				},
			])

			await delay(resolveRecipientMs)
			o(viewModel.attendees()[1].type).equals(RecipientInfoType.EXTERNAL)
		})

		o("status of own attendee is changed selected in invite", async function () {
			const calendars = makeCalendars("own")
			const attendee = createCalendarEventAttendee({
				address: createEncryptedMailAddress({address: "guest@example.com"})
			})
			const ownAttendee = createCalendarEventAttendee({
				address: encMailAddress
			})
			const existingEvent = createCalendarEvent({
				attendees: [attendee, ownAttendee],
				organizer: createEncryptedMailAddress({address: "organizer@example.com"}),
			})
			const viewModel = await init({calendars, existingEvent})

			viewModel.selectGoing(CalendarAttendeeStatus.TENTATIVE)

			o(viewModel.attendees()).deepEquals([
				{
					address: encMailAddress,
					type: RecipientInfoType.INTERNAL,
					status: CalendarAttendeeStatus.TENTATIVE,
				},
				{
					address: attendee.address,
					type: RecipientInfoType.UNKNOWN, //new CalendarEventViewModel does not wait for recipient info to be resolved
					status: attendee.status,
				},
			])
			await delay(resolveRecipientMs)
			o(viewModel.attendees()[1].type).equals(RecipientInfoType.EXTERNAL)
		})
	})

	o.spec("canModifyOrganizer", function () {
		o("can modify when when new event and no guests", async function () {
			const calendars = makeCalendars("own")
			const viewModel = await init({calendars, existingEvent: null})
			o(viewModel.canModifyOrganizer()).equals(true)
		})

		o("can modify when when new own event and added guests", async function () {
			const calendars = makeCalendars("own")
			const viewModel = await init({calendars, existingEvent: null})
			viewModel.addGuest("guest@example.com")
			o(viewModel.canModifyOrganizer()).equals(true)
		})

		o("can modify when own event and no guests", async function () {
			const calendars = makeCalendars("own")
			const viewModel = await init({
				calendars,
				existingEvent: createCalendarEvent({
					_id: ["listId", "calendarId"],
					_ownerGroup: calendarGroupId,
				})
			})
			o(viewModel.canModifyOrganizer()).equals(true)
		})

		o("can modify when own event without guests and added guests", async function () {
			const calendars = makeCalendars("own")
			const viewModel = await init({
				calendars,
				existingEvent: createCalendarEvent({
					_id: ["listId", "calendarId"],
					_ownerGroup: calendarGroupId,
				})
			})

			viewModel.addGuest("guest@tutanota.de")

			o(viewModel.canModifyOrganizer()).equals(true)
		})

		o("cannot modify in own calendar when there were guests", async function () {
			const calendars = makeCalendars("own")
			const viewModel = await init({
				calendars,
				existingEvent: createCalendarEvent({
					_id: ["listId", "calendarId"],
					_ownerGroup: calendarGroupId,
					attendees: [createCalendarEventAttendee({address: createEncryptedMailAddress({address: "guest@tutanota.com"})})]
				})
			})

			o(viewModel.canModifyOrganizer()).equals(false)
		})

		o("cannot modify in own calendar when there were guests and they were removed", async function () {
			const calendars = makeCalendars("own")
			const toRemoveGuest: Guest = {
				address: createEncryptedMailAddress({address: "remove-attendee@example.com"}),
				type: RecipientInfoType.EXTERNAL,
				status: CalendarAttendeeStatus.ACCEPTED,
			}
			const viewModel = await init({
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

		o("cannot modify in ro shared calendar without guests", async function () {
			const calendars = makeCalendars("shared")
			const viewModel = await init({
				calendars,
				existingEvent: createCalendarEvent({
					_id: ["listId", "calendarId"],
					_ownerGroup: calendarGroupId,
				})
			})

			o(viewModel.canModifyOrganizer()).equals(false)
		})

		o("can modify in rw shared calendar without guests", async function () {
			const calendars = makeCalendars("shared")
			const userController = makeUserController()
			addCapability(userController.user, calendarGroupId, ShareCapability.Write)
			const viewModel = await init({
				calendars,
				userController,
				existingEvent: createCalendarEvent({
					_id: ["listId", "calendarId"],
					_ownerGroup: calendarGroupId,
				})
			})

			o(viewModel.canModifyOrganizer()).equals(false)
		})

		o("cannot modify when it's invite in own calendar", async function () {
			const calendars = makeCalendars("own")
			const viewModel = await init({
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

	o.spec("getAvailableCalendars", async function () {
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

		o("own calendar, new event", async function () {
			const viewModel = await init({userController, calendars, existingEvent: null})
			o(viewModel.getAvailableCalendars()).deepEquals([ownCalendar, rwCalendar])
		})

		o("own calendar, existing event no guests", async function () {
			const existingEvent = createCalendarEvent({
				_ownerGroup: calendarGroupId,
			})
			const viewModel = await init({userController, calendars, existingEvent})
			o(viewModel.getAvailableCalendars()).deepEquals([ownCalendar, rwCalendar])
		})

		o("rw calendar, existing event with no guests", async function () {
			const existingEvent = createCalendarEvent({
				_ownerGroup: rwCalendarId,
			})
			const viewModel = await init({userController, calendars, existingEvent})
			o(viewModel.getAvailableCalendars()).deepEquals([ownCalendar, rwCalendar])
		})

		o("new invite", async function () {
			const existingEvent = createCalendarEvent({
				_ownerGroup: null,
				organizer: createEncryptedMailAddress({address: "organizer@example.com"}),
				attendees: [makeAttendee(encMailAddress.address)]
			})

			const viewModel = await init({userController, calendars, existingEvent})
			o(viewModel.getAvailableCalendars()).deepEquals([ownCalendar])
		})

		o("ro calendar, existing event with no guests", async function () {
			const existingEvent = createCalendarEvent({
				_ownerGroup: roCalendarId,
			})
			const viewModel = await init({userController, calendars, existingEvent})
			o(viewModel.getAvailableCalendars()).deepEquals([roCalendar])
		})

		o("own calendar, existing event with guests", async function () {
			const existingEvent = createCalendarEvent({
				_ownerGroup: calendarGroupId,
				attendees: [makeAttendee()]
			})
			const viewModel = await init({userController, calendars, existingEvent})
			o(viewModel.getAvailableCalendars()).deepEquals([ownCalendar])
		})

		o("rw calendar, existing event with guests", async function () {
			const existingEvent = createCalendarEvent({
				_ownerGroup: rwCalendarId,
				attendees: [makeAttendee()]
			})
			const viewModel = await init({userController, calendars, existingEvent})
			o(viewModel.getAvailableCalendars()).deepEquals([rwCalendar])
		})

		o("ro calendar, existing event with guests", async function () {
			const existingEvent = createCalendarEvent({
				_ownerGroup: roCalendarId,
				attendees: [makeAttendee()]
			})
			const viewModel = await init({userController, calendars, existingEvent})
			o(viewModel.getAvailableCalendars()).deepEquals([roCalendar])
		})
	})

	o.spec("shouldShowInviteNotAvailable", async function () {
		o("not available for free users", async function () {
			const userController = makeUserController([], AccountType.FREE, "", false)
			const viewModel = await init({userController, calendars: makeCalendars("own"), existingEvent: null})
			const notAvailable = viewModel.shouldShowSendInviteNotAvailable()
			o(notAvailable).equals(true)
		})

		o("not available for premium users without business subscription", async function () {
			const userController = makeUserController([], AccountType.PREMIUM, "", false)
			const viewModel = await init({userController, calendars: makeCalendars("own"), existingEvent: null})
			await viewModel.updateCustomerFeatures()
			const notAvailable = viewModel.shouldShowSendInviteNotAvailable()
			o(notAvailable).equals(true)
		})

		o("available for premium users with business subscription", async function () {
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			const viewModel = await init({userController, calendars: makeCalendars("own"), existingEvent: null})
			await viewModel.updateCustomerFeatures()
			const notAvailable = viewModel.shouldShowSendInviteNotAvailable()
			o(notAvailable).equals(false)
		})

		o("available for external users", async function () {
			const userController = makeUserController([], AccountType.EXTERNAL, "", false)
			const viewModel = await init({userController, calendars: makeCalendars("own"), existingEvent: null})
			await viewModel.updateCustomerFeatures()
			const notAvailable = viewModel.shouldShowSendInviteNotAvailable()
			o(notAvailable).equals(false)
		})
	})
})

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
		}),
	})
}

