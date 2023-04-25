import o from "ospec"
// @ts-ignore[untyped-import]
import en from "../../../src/translations/en.js"
import type { Guest } from "../../../src/calendar/date/CalendarEventSaveModel.js"
import { areExcludedDatesEqual, CalendarEventSaveModel } from "../../../src/calendar/date/CalendarEventSaveModel.js"
import { lang } from "../../../src/misc/LanguageViewModel.js"
import { assertThrows, unmockAttribute } from "@tutao/tutanota-test-utils"
import { addMapEntry, clone, delay, downcast, LazyLoaded, neverNull, noOp } from "@tutao/tutanota-utils"
import type { MailboxDetail } from "../../../src/mail/model/MailModel.js"
import { MailModel } from "../../../src/mail/model/MailModel.js"
import type { CalendarEvent, Mail } from "../../../src/api/entities/tutanota/TypeRefs.js"
import {
	Contact,
	createCalendarEvent,
	createCalendarEventAttendee,
	createContact,
	createContactMailAddress,
	createEncryptedMailAddress,
	createMail,
	createMailboxProperties,
	EncryptedMailAddress,
} from "../../../src/api/entities/tutanota/TypeRefs.js"
import {
	AccountType,
	AlarmInterval,
	assertEnumValue,
	CalendarAttendeeStatus,
	EndType,
	RepeatPeriod,
	ShareCapability,
} from "../../../src/api/common/TutanotaConstants.js"
import type { User } from "../../../src/api/entities/sys/TypeRefs.js"
import { createDateWrapper, createGroupMembership, createPublicKeyReturn, createRepeatRule } from "../../../src/api/entities/sys/TypeRefs.js"
import type { CalendarUpdateDistributor } from "../../../src/calendar/date/CalendarUpdateDistributor.js"
import type { UserController } from "../../../src/api/main/UserController.js"
import type { CalendarInfo } from "../../../src/calendar/model/CalendarModel.js"
import { CalendarModel } from "../../../src/calendar/model/CalendarModel.js"
import { getAllDayDateUTCFromZone, getTimeZone } from "../../../src/calendar/date/CalendarUtils.js"
import { DateTime } from "luxon"
import { SendMailModel } from "../../../src/mail/editor/SendMailModel"
import type { LoginController } from "../../../src/api/main/LoginController"
import { EventController } from "../../../src/api/main/EventController"
import { EntityClient } from "../../../src/api/common/EntityClient"
import { BusinessFeatureRequiredError } from "../../../src/api/main/BusinessFeatureRequiredError"
import { MailFacade } from "../../../src/api/worker/facades/lazy/MailFacade.js"
import { Time } from "../../../src/api/common/utils/Time"
import {
	accountMailAddress,
	calendarGroupId,
	makeCalendarInfo,
	makeCalendarModel,
	makeCalendars,
	makeDistributor,
	makeMailboxDetail,
	makeUserController,
} from "./CalendarTestUtils.js"
import { RecipientType } from "../../../src/api/common/recipients/Recipient.js"
import { RecipientsModel, ResolvableRecipient } from "../../../src/api/main/RecipientsModel"
import { instance, matchers, object, when } from "testdouble"
import { ContactModel } from "../../../src/contacts/model/ContactModel"
import { ResolvableRecipientMock } from "../mail/ResolvableRecipientMock.js"
import { EntityRestClientMock } from "../api/worker/rest/EntityRestClientMock.js"
import { NoZoneDateProvider } from "../../../src/api/common/utils/NoZoneDateProvider.js"

const now = new Date(2020, 4, 25, 13, 40)
const zone = getTimeZone()

const wrapEncIntoMailAddress = (address) =>
	createEncryptedMailAddress({
		address,
	})

const encMailAddress: EncryptedMailAddress = wrapEncIntoMailAddress(accountMailAddress)

const getAddress = (a: ResolvableRecipient) => a.address

let internalAddresses: string[] = []
let resolveRecipientMs = 100
let mockedAttributeReferences = []

o.spec("CalendarEventSaveModel", function () {
	let inviteModel: SendMailModel
	let updateModel: SendMailModel
	let cancelModel: SendMailModel
	let responseModel: SendMailModel
	let showProgress = noOp

	let recipientsModel: RecipientsModel

	async function init({
		userController = makeUserController(),
		distributor = makeDistributor(),
		mailboxDetail = makeMailboxDetail(),
		calendars,
		existingEvent,
		calendarModel = makeCalendarModel(),
		mailModel = downcast({}),
		mail = null,
		existingContacts = [],
	}: {
		userController?: UserController
		distributor?: CalendarUpdateDistributor
		mailboxDetail?: MailboxDetail
		calendars: Map<Id, CalendarInfo>
		calendarModel?: CalendarModel
		mailModel?: MailModel
		existingEvent: CalendarEvent | null
		mail?: Mail | null | undefined
		existingContacts?: Array<Contact>
	}): Promise<CalendarEventSaveModel> {
		const loginController: LoginController = downcast({
			getUserController: () => userController,
			isInternalUserLoggedIn: () => true,
		})
		const eventController: EventController = downcast({
			addEntityListener: noOp,
			removeEntityListener: noOp,
		})
		const entityClient = new EntityClient(new EntityRestClientMock())

		const mailFacadeMock = downcast<MailFacade>({
			async getRecipientKeyData(mailAddress: string) {
				await delay(resolveRecipientMs)

				if (internalAddresses.includes(mailAddress)) {
					return createPublicKeyReturn({
						pubKey: new Uint8Array(0),
					})
				} else {
					return null
				}
			},
		})

		const contactModel = object<ContactModel>()

		recipientsModel = instance(RecipientsModel)

		when(recipientsModel.resolve(matchers.anything(), matchers.anything())).thenDo(
			({ address, name, contact, type }, resolveMode) =>
				new ResolvableRecipientMock(
					address,
					name ?? null,
					contact ?? null,
					type ?? null,
					internalAddresses,
					existingContacts,
					resolveMode,
					userController.user,
				),
		)

		const mailboxProperties = createMailboxProperties()

		inviteModel = new SendMailModel(
			mailFacadeMock,
			entityClient,
			loginController,
			neverNull(mailModel),
			contactModel,
			eventController,
			mailboxDetail,
			recipientsModel,
			new NoZoneDateProvider(),
			mailboxProperties,
		)
		updateModel = new SendMailModel(
			mailFacadeMock,
			entityClient,
			loginController,
			neverNull(mailModel),
			contactModel,
			eventController,
			mailboxDetail,
			recipientsModel,
			new NoZoneDateProvider(),
			mailboxProperties,
		)
		cancelModel = new SendMailModel(
			mailFacadeMock,
			entityClient,
			loginController,
			neverNull(mailModel),
			contactModel,
			eventController,
			mailboxDetail,
			recipientsModel,
			new NoZoneDateProvider(),
			mailboxProperties,
		)
		responseModel = new SendMailModel(
			mailFacadeMock,
			entityClient,
			loginController,
			neverNull(mailModel),
			contactModel,
			eventController,
			mailboxDetail,
			recipientsModel,
			new NoZoneDateProvider(),
			mailboxProperties,
		)

		const sendFactory = {
			invite: () => inviteModel,
			update: () => updateModel,
			cancel: () => cancelModel,
			response: () => responseModel,
		}

		const viewModel = new CalendarEventSaveModel(
			userController,
			distributor,
			calendarModel,
			entityClient,
			mailboxDetail,
			mailboxProperties,
			sendFactory,
			now,
			zone,
			calendars,
			existingEvent,
			mail,
			false,
		)
		viewModel.hasBusinessFeature = true
		await viewModel.initialized
		return viewModel
	}

	let askForUpdates: any
	let askInsecurePassword: any
	o.before(async function () {
		// We need this because SendMailModel queries for default language. We should refactor to avoid this.
		await lang.init(en)
	})
	o.beforeEach(function () {
		askForUpdates = o.spy(async () => "yes")
		askInsecurePassword = o.spy(async () => true)
		internalAddresses = []
	})
	o.afterEach(function () {
		mockedAttributeReferences.forEach((ref) => unmockAttribute(ref))
		mockedAttributeReferences = []
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
						address: createEncryptedMailAddress({
							address: guest,
						}),
					}),
				],
				uid: "MyUid",
				sequence: "1",
				invitedConfidentially: true,
				organizer: encMailAddress,
				startTime: new Date(2020, 4, 5, 16),
				endTime: new Date(2020, 4, 6, 20),
			})
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			const viewModel = await init({
				userController,
				calendars,
				existingEvent,
				calendarModel,
				distributor,
			})

			const newEvent = viewModel.initializeNewEvent()

			o(viewModel.hasChanges(newEvent)).equals(false)
			newEvent.sequence = "7"
			o(viewModel.hasChanges(newEvent)).equals(false)
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
						address: createEncryptedMailAddress({
							address: guest,
						}),
						status: "0",
					}),
				],
				uid: "MyUid",
				invitedConfidentially: true,
				organizer: encMailAddress,
				startTime: new Date(2020, 4, 5, 16),
				endTime: new Date(2020, 4, 6, 20),
			})
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			const viewModel = await init({
				userController,
				calendars,
				existingEvent,
				calendarModel,
				distributor,
			})

			let newEvent = viewModel.initializeNewEvent()

			o(viewModel.hasChanges(newEvent)).equals(false)
			newEvent.description = "my test"
			o(viewModel.hasChanges(newEvent)).equals(true)
			newEvent.description = existingEvent.description
			o(viewModel.hasChanges(newEvent)).equals(false)
			newEvent.summary = "some nice title"
			o(viewModel.hasChanges(newEvent)).equals(true)
			newEvent.summary = existingEvent.summary
			o(viewModel.hasChanges(newEvent)).equals(false)
			newEvent.location = "some nice title"
			o(viewModel.hasChanges(newEvent)).equals(true)
			newEvent.location = existingEvent.location
			o(viewModel.hasChanges(newEvent)).equals(false)
			newEvent.startTime = new Date(2020, 4, 10, 16)
			o(viewModel.hasChanges(newEvent)).equals(true)
			newEvent.startTime = existingEvent.startTime
			o(viewModel.hasChanges(newEvent)).equals(false)
			newEvent.endTime = new Date(2020, 4, 10, 16)
			o(viewModel.hasChanges(newEvent)).equals(true)
			newEvent.endTime = existingEvent.endTime
			o(viewModel.hasChanges(newEvent)).equals(false)
			newEvent.organizer = wrapEncIntoMailAddress("otherorganizer@tutanota.com")
			o(viewModel.hasChanges(newEvent)).equals(true)
			newEvent.organizer = existingEvent.organizer
			o(viewModel.hasChanges(newEvent)).equals(false)
			newEvent.attendees.push(
				createCalendarEventAttendee({
					address: createEncryptedMailAddress({
						address: "mysecondadress@tutanota.com",
					}),
				}),
			)
			o(viewModel.hasChanges(newEvent)).equals(true)
			newEvent.attendees = existingEvent.attendees
			o(viewModel.hasChanges(newEvent)).equals(false)
			newEvent.attendees = [
				createCalendarEventAttendee({
					address: createEncryptedMailAddress({
						address: guest,
					}),
					status: "1", // different
				}),
			]
			o(viewModel.hasChanges(newEvent)).equals(true)
			newEvent.attendees = existingEvent.attendees
			o(viewModel.hasChanges(newEvent)).equals(false)
			newEvent.repeatRule = createRepeatRule()
			o(viewModel.hasChanges(newEvent)).equals(true)
			newEvent.repeatRule = existingEvent.repeatRule
			o(viewModel.hasChanges(newEvent)).equals(false)
			newEvent.repeatRule = createRepeatRule({
				excludedDates: [createDateWrapper({ date: new Date("2023-03-06T13:56:28.658Z") })],
			})
			o(viewModel.hasChanges(newEvent)).equals(true)
			existingEvent.repeatRule = createRepeatRule({
				excludedDates: newEvent.repeatRule!.excludedDates.slice(),
			})
			o(viewModel.hasChanges(newEvent)).equals(false)
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
						address: createEncryptedMailAddress({
							address: guest,
						}),
					}),
				],
				uid: "MyUid",
				invitedConfidentially: true,
				organizer: encMailAddress,
				startTime: new Date(2020, 4, 5, 16),
				endTime: new Date(2020, 4, 6, 20),
			})
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			const viewModel = await init({
				userController,
				calendars,
				existingEvent,
				calendarModel,
				distributor,
			})

			let newEvent = viewModel.initializeNewEvent()

			o(viewModel.hasChanges(newEvent)).equals(false)
			existingEvent.invitedConfidentially = false
			o(viewModel.hasChanges(newEvent)).equals(true)
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
						address: createEncryptedMailAddress({
							address: guest,
						}),
					}),
				],
				invitedConfidentially: true,
				organizer: encMailAddress,
				startTime: new Date(2020, 4, 5, 16),
				endTime: new Date(2020, 4, 6, 20),
			})
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			let viewModel = await init({
				userController,
				calendars,
				existingEvent,
				calendarModel,
				distributor,
			})

			let newEvent = viewModel.initializeNewEvent()

			o(viewModel.hasChanges(newEvent)).equals(true)
			existingEvent.uid = "MyUid"
			viewModel = await init({
				userController,
				calendars,
				existingEvent,
				calendarModel,
				distributor,
			})
			newEvent = viewModel.initializeNewEvent()
			o(viewModel.hasChanges(newEvent)).equals(false)
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
						address: createEncryptedMailAddress({
							address: guest,
						}),
					}),
				],
				uid: "MyUid",
				invitedConfidentially: false,
				organizer: encMailAddress,
				startTime: new Date(2020, 4, 5, 16),
				endTime: new Date(2020, 4, 6, 20),
			})
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			const viewModel = await init({
				userController,
				calendars,
				existingEvent,
				calendarModel,
				distributor,
			})

			// @ts-ignore
			updateModel.bccRecipients()[0].type = RecipientType.EXTERNAL

			// @ts-ignore
			updateModel.bccRecipients()[0].contact = createContact({
				presharedPassword: "123",
			})
			updateModel.onMailChanged(null)
			askForUpdates = o.spy(() => Promise.resolve("yes"))
			askInsecurePassword = o.spy(async () => true)
			o(
				await viewModel.saveAndSend({
					askForUpdates,
					askInsecurePassword,
					showProgress,
				}),
			).equals(true)
			// @ts-ignore
			o(calendarModel.updateEvent.calls.length).equals(1)("created event")
			// @ts-ignore
			o(distributor.sendUpdate.callCount).equals(0)
			// @ts-ignore
			o(distributor.sendCancellation.callCount).equals(0)
			o(updateModel.bccRecipients().map((a) => a.address)).deepEquals([guest])
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
						address: createEncryptedMailAddress({
							address: guest,
						}),
					}),
				],
				uid: "MyUid",
				invitedConfidentially: false,
				organizer: encMailAddress,
				startTime: new Date(2020, 4, 5, 16),
				endTime: new Date(2020, 4, 6, 20),
			})
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			const viewModel = await init({
				userController,
				calendars,
				existingEvent,
				calendarModel,
				distributor,
			})

			// @ts-ignore
			updateModel.bccRecipients()[0].type = RecipientType.EXTERNAL

			// @ts-ignore
			updateModel.bccRecipients()[0].contact = createContact({
				presharedPassword: "123",
			})
			updateModel.onMailChanged(null)
			askForUpdates = o.spy(() => Promise.resolve("yes"))
			askInsecurePassword = o.spy(async () => true)
			viewModel.isForceUpdates = true
			o(
				await viewModel.saveAndSend({
					askForUpdates,
					askInsecurePassword,
					showProgress,
				}),
			).equals(true)
			// @ts-ignore
			o(calendarModel.updateEvent.calls.length).equals(1)("created event")
			// @ts-ignore
			o(distributor.sendUpdate.callCount).equals(1)
			// @ts-ignore
			o(distributor.sendUpdate.calls[0].args[1]).equals(updateModel)
			// @ts-ignore
			o(distributor.sendCancellation.callCount).equals(0)
			o(updateModel.bccRecipients().map((a) => a.address)).deepEquals([guest])
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
						address: createEncryptedMailAddress({
							address: guest,
						}),
					}),
				],
				uid: "MyUid",
				invitedConfidentially: false,
				organizer: encMailAddress,
				startTime: new Date(2020, 4, 5, 16),
				endTime: new Date(2020, 4, 6, 20),
			})
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			const viewModel = await init({
				userController,
				calendars,
				existingEvent,
				calendarModel,
				distributor,
			})
			viewModel.setStartDate(new Date(2020, 4, 3))
			// @ts-ignore
			updateModel.bccRecipients()[0].type = RecipientType.EXTERNAL

			// @ts-ignore
			updateModel.bccRecipients()[0].contact = createContact({
				presharedPassword: "123",
			})
			updateModel.onMailChanged(null)
			askForUpdates = o.spy(() => Promise.resolve("yes"))
			askInsecurePassword = o.spy(async () => true)
			viewModel.isForceUpdates = true
			o(
				await viewModel.saveAndSend({
					askForUpdates,
					askInsecurePassword,
					showProgress,
				}),
			).equals(true)
			// @ts-ignore
			o(calendarModel.updateEvent.calls.length).equals(1)("created event")
			// @ts-ignore
			o(distributor.sendUpdate.callCount).equals(1)
			// @ts-ignore
			o(distributor.sendUpdate.calls[0].args[1]).equals(updateModel)
			// @ts-ignore
			o(distributor.sendCancellation.callCount).equals(0)
			o(updateModel.bccRecipients().map((a) => a.address)).deepEquals([guest])
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
						address: createEncryptedMailAddress({
							address: guest,
						}),
					}),
				],
				uid: "MyUid",
				invitedConfidentially: false,
				organizer: encMailAddress,
				startTime: new Date(2020, 4, 5, 16),
				endTime: new Date(2020, 4, 6, 20),
			})
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			const viewModel = await init({
				userController,
				calendars,
				existingEvent,
				calendarModel,
				distributor,
			})
			viewModel.setStartDate(new Date(2020, 4, 3))
			// @ts-ignore
			updateModel.bccRecipients()[0].type = RecipientType.EXTERNAL

			// @ts-ignore
			updateModel.bccRecipients()[0].contact = createContact({
				presharedPassword: "123",
			})
			updateModel.onMailChanged(null)
			askForUpdates = o.spy(() => Promise.resolve("yes"))
			askInsecurePassword = o.spy(async () => true)
			o(
				await viewModel.saveAndSend({
					askForUpdates,
					askInsecurePassword,
					showProgress,
				}),
			).equals(true)
			// @ts-ignore
			o(calendarModel.updateEvent.calls.length).equals(1)("created event")
			// @ts-ignore
			o(distributor.sendUpdate.callCount).equals(1)
			// @ts-ignore
			o(distributor.sendUpdate.calls[0].args[1]).equals(updateModel)
			// @ts-ignore
			o(distributor.sendCancellation.callCount).equals(0)
			o(updateModel.bccRecipients().map((a) => a.address)).deepEquals([guest])
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
			const viewModel = await init({
				calendars,
				existingEvent,
				calendarModel,
				distributor,
				mailModel,
			})
			await viewModel.deleteEvent()
			// This doesn't always pass because sometimes the start and end times are off by a fraction of a second
			o(calendarModel.deleteEvent.calls.map((c) => c.args)).deepEquals([[existingEvent]])
			o(distributor.sendCancellation.calls.map((c) => c.args[0])).deepEquals([newEvent])
			o(cancelModel.bccRecipients().map((r) => r.address)).deepEquals([attendee.address.address])
		})
		o("own event with external attendees in own calendar, has password, not confidential", async function () {
			const calendars = makeCalendars("own")
			const distributor = makeDistributor()
			const attendee = makeAttendee()
			const ownAttendee = makeAttendee(encMailAddress.address)
			const calendarModel = makeCalendarModel()
			const mailModel = downcast({})
			const contact = createContact({
				mailAddresses: [
					createContactMailAddress({
						address: attendee.address.address,
					}),
				],
				presharedPassword: "123",
			})
			const startTime = DateTime.fromISO("2016-05-25T09:08:34.123", {
				zone: "UTC",
			}).toJSDate()
			const endTime = DateTime.fromISO("2016-05-25T09:09:34.123", {
				zone: "UTC",
			}).toJSDate()
			const existingEvent = createCalendarEvent({
				_id: ["listid", "calendarid"],
				_ownerGroup: calendarGroupId,
				organizer: encMailAddress,
				attendees: [ownAttendee, attendee],
				sequence: "1",
				invitedConfidentially: false,
				startTime,
				endTime,
			})
			const newEvent = createCalendarEvent({
				_id: ["listid", "calendarid"],
				_ownerGroup: calendarGroupId,
				organizer: encMailAddress,
				attendees: [ownAttendee, attendee],
				sequence: "2",
				invitedConfidentially: false,
				startTime,
				endTime,
			})
			const viewModel = await init({
				calendars,
				existingEvent,
				calendarModel,
				distributor,
				mailModel,
				existingContacts: [contact],
			})
			await viewModel.deleteEvent()
			// @ts-ignore
			o(calendarModel.deleteEvent.calls.map((c) => c.args)).deepEquals([[existingEvent]])
			// @ts-ignore
			o(distributor.sendCancellation.calls.map((c) => c.args[0])).deepEquals([newEvent])
			o(cancelModel.bccRecipients().map((r) => r.address)).deepEquals([attendee.address.address])
		})
		o("own event with external attendees in own calendar, has password, confidential", async function () {
			const calendars = makeCalendars("own")
			const distributor = makeDistributor()
			const attendee = makeAttendee()
			const ownAttendee = makeAttendee(encMailAddress.address)
			const calendarModel = makeCalendarModel()
			const mailModel = downcast({})
			const contact = createContact({
				mailAddresses: [
					createContactMailAddress({
						address: attendee.address.address,
					}),
				],
				presharedPassword: "123",
			})
			const startTime = DateTime.fromISO("2016-05-25T09:08:34.123", {
				zone: "UTC",
			}).toJSDate()
			const endTime = DateTime.fromISO("2016-05-25T09:09:34.123", {
				zone: "UTC",
			}).toJSDate()
			const existingEvent = createCalendarEvent({
				_id: ["listid", "calendarid"],
				_ownerGroup: calendarGroupId,
				organizer: encMailAddress,
				attendees: [ownAttendee, attendee],
				sequence: "1",
				invitedConfidentially: true,
				startTime,
				endTime,
			})
			const newEvent = createCalendarEvent({
				_id: ["listid", "calendarid"],
				_ownerGroup: calendarGroupId,
				organizer: encMailAddress,
				attendees: [ownAttendee, attendee],
				sequence: "2",
				invitedConfidentially: true,
				startTime,
				endTime,
			})
			const viewModel = await init({
				calendars,
				existingEvent,
				calendarModel,
				distributor,
				mailModel,
				existingContacts: [contact],
			})
			await viewModel.deleteEvent()
			// This doesn't always pass because sometimes the start and end times are off by a fraction of a second
			// @ts-ignore
			o(calendarModel.deleteEvent.calls.map((c) => c.args)).deepEquals([[existingEvent]])
			// @ts-ignore
			o(distributor.sendCancellation.calls.map((c) => c.args[0])).deepEquals([newEvent])
			o(cancelModel.bccRecipients().map((r) => r.address)).deepEquals([attendee.address.address])
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
				mailAddresses: [
					createContactMailAddress({
						address: attendee.address.address,
					}),
				],
				presharedPassword: null,
			})

			// specify start and end date specifically,
			// because sometimes deepEquals fails due to milliseconds being off by a fraction (even though it's the same object?)
			const existingStart = new Date(1994, 5, 8)
			const existingEnd = new Date(1994, 5, 9)
			const existingEvent = createCalendarEvent({
				_id: ["listid", "calendarid"],
				_ownerGroup: calendarGroupId,
				organizer: encMailAddress,
				attendees: [ownAttendee, attendee],
				sequence: "1",
				invitedConfidentially: true,
				startTime: existingStart,
				endTime: existingEnd,
			})
			const viewModel = await init({
				calendars,
				existingEvent,
				calendarModel,
				distributor,
				mailModel,
				existingContacts: [contact],
			})
			await viewModel.deleteEvent()
			o(calendarModel.deleteEvent.calls.map((c) => c.args)).deepEquals([[existingEvent]])
			o(distributor.sendCancellation.calls.map((c) => c.args[0])).deepEquals([])
			o(cancelModel.bccRecipients().map((r) => r.address)).deepEquals([])
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
				mailAddresses: [
					createContactMailAddress({
						address: attendee.address.address,
					}),
				],
				presharedPassword: null,
			})
			const existingEvent = createCalendarEvent({
				_id: ["listid", "calendarid"],
				_ownerGroup: calendarGroupId,
				organizer: encMailAddress,
				attendees: [ownAttendee, attendee],
				sequence: "1",
				invitedConfidentially: true,
			})
			const viewModel = await init({
				calendars,
				existingEvent,
				calendarModel,
				distributor,
				mailModel,
				existingContacts: [contact],
			})
			await viewModel.deleteEvent()
			// This doesn't always pass because sometimes the start and end times are off by a fraction of a second
			// @ts-ignore
			o(calendarModel.deleteEvent.calls.map((c) => c.args)).deepEquals([[existingEvent]])
			// @ts-ignore
			o(distributor.sendCancellation.calls.map((c) => c.args[0])).deepEquals([])
			o(cancelModel.bccRecipients().map((r) => r.address)).deepEquals([])
		})
		o("own event without attendees in own calendar", async function () {
			const calendars = makeCalendars("own")
			const distributor = makeDistributor()
			const calendarModel = makeCalendarModel()
			const existingEvent = createCalendarEvent({
				_id: ["listid", "calendarid"],
				_ownerGroup: calendarGroupId,
				organizer: encMailAddress,
				attendees: [],
			})
			const viewModel = await init({
				calendars,
				existingEvent,
				calendarModel,
				distributor,
			})
			await viewModel.deleteEvent()
			// @ts-ignore
			o(calendarModel.deleteEvent.calls.map((c) => c.args)).deepEquals([[existingEvent]])
			// @ts-ignore
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
			const viewModel = await init({
				calendars,
				existingEvent,
				calendarModel,
				distributor,
			})
			await viewModel.deleteEvent()
			// @ts-ignore
			o(calendarModel.deleteEvent.calls.map((c) => c.args)).deepEquals([[existingEvent]])
			// @ts-ignore
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
			const viewModel = await init({
				calendars,
				existingEvent,
				calendarModel,
				distributor,
				userController,
			})
			await viewModel.deleteEvent()
			// @ts-ignore
			o(calendarModel.deleteEvent.calls.map((c) => c.args)).deepEquals([[existingEvent]])
			// @ts-ignore
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
			const viewModel = await init({
				calendars,
				existingEvent,
				calendarModel,
				distributor,
			})
			await viewModel.deleteEvent()
			// @ts-ignore
			o(calendarModel.deleteEvent.calls.map((c) => c.args)).deepEquals([[existingEvent]])
			// @ts-ignore
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
			const viewModel = await init({
				calendars,
				existingEvent,
				calendarModel,
				distributor,
				userController,
			})
			await viewModel.deleteEvent()
			// @ts-ignore
			o(calendarModel.deleteEvent.calls.map((c) => c.args)).deepEquals([[existingEvent]])
			// @ts-ignore
			o(distributor.sendCancellation.calls).deepEquals([])
		})
	})
	o.spec("create event", function () {
		o("own calendar, no guest, legacy with business feature", async function () {
			const calendars = makeCalendars("own")
			const calendarModel = makeCalendarModel()
			const distributor = makeDistributor()
			const viewModel = await init({
				calendars,
				existingEvent: null,
				calendarModel,
				distributor,
			})
			const summary = "Summary"
			viewModel.summary = summary
			const newDescription = "new description"
			viewModel.changeDescription(newDescription)
			o(
				await viewModel.saveAndSend({
					askForUpdates,
					askInsecurePassword,
					showProgress,
				}),
			).equals(true)
			// @ts-ignore
			const [createdEvent] = calendarModel.createEvent.calls[0].args
			o(createdEvent.summary).equals("Summary")
			o(createdEvent.description).equals(newDescription)
			// @ts-ignore
			o(distributor.sendInvite.callCount).equals(0)
			// @ts-ignore
			o(distributor.sendCancellation.callCount).equals(0)
			o(askForUpdates.callCount).equals(0)
			o(askInsecurePassword.callCount).equals(0)
		})
		o("own calendar, new guests, newPaidAccount", async function () {
			const calendars = makeCalendars("own")
			const calendarModel = makeCalendarModel()
			const distributor = makeDistributor()
			const userController = makeUserController([], AccountType.PREMIUM, "", false, true)
			const viewModel = await init({
				userController,
				calendars,
				existingEvent: null,
				calendarModel,
				distributor,
			})
			const newGuest = "new-attendee@example.com"
			viewModel.addGuest(newGuest, null)
			askInsecurePassword = o.spy(async () => true)
			o(
				await viewModel.saveAndSend({
					askForUpdates,
					askInsecurePassword,
					showProgress,
				}),
			).equals(true)
			// @ts-ignore
			o(calendarModel.createEvent.calls.length).equals(1)("created event")
			// @ts-ignore
			o(distributor.sendInvite.calls[0].args[1]).deepEquals(inviteModel)
			// @ts-ignore
			o(distributor.sendCancellation.callCount).equals(0)
			o(inviteModel.bccRecipients().map((r) => r.address)).deepEquals([newGuest])
			// @ts-ignore
			const createdEvent = calendarModel.createEvent.calls[0].args[0]
			o(
				createdEvent.attendees.map((a) => ({
					status: a.status,
					address: a.address,
				})),
			).deepEquals([
				{
					status: CalendarAttendeeStatus.ACCEPTED,
					address: encMailAddress,
				},
				{
					status: CalendarAttendeeStatus.NEEDS_ACTION,
					address: createEncryptedMailAddress({
						address: newGuest,
					}),
				},
			])
			o(askForUpdates.callCount).equals(0)
			o(askInsecurePassword.callCount).equals(0)
		})
		o("own calendar, new guests", async function () {
			const calendars = makeCalendars("own")
			const calendarModel = makeCalendarModel()
			const distributor = makeDistributor()
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			const viewModel = await init({
				userController,
				calendars,
				existingEvent: null,
				calendarModel,
				distributor,
			})
			const newGuest = "new-attendee@example.com"
			viewModel.addGuest(newGuest, null)
			askInsecurePassword = o.spy(async () => true)
			o(
				await viewModel.saveAndSend({
					askForUpdates,
					askInsecurePassword,
					showProgress,
				}),
			).equals(true)
			// @ts-ignore
			o(calendarModel.createEvent.calls.length).equals(1)("created event")
			// @ts-ignore
			o(distributor.sendInvite.calls[0].args[1]).deepEquals(inviteModel)
			// @ts-ignore
			o(distributor.sendCancellation.callCount).equals(0)
			o(inviteModel.bccRecipients().map((r) => r.address)).deepEquals([newGuest])
			// @ts-ignore
			const createdEvent = calendarModel.createEvent.calls[0].args[0]
			o(
				createdEvent.attendees.map((a) => ({
					status: a.status,
					address: a.address,
				})),
			).deepEquals([
				{
					status: CalendarAttendeeStatus.ACCEPTED,
					address: encMailAddress,
				},
				{
					status: CalendarAttendeeStatus.NEEDS_ACTION,
					address: createEncryptedMailAddress({
						address: newGuest,
					}),
				},
			])
			o(askForUpdates.callCount).equals(0)
			o(askInsecurePassword.callCount).equals(0)
		})
		o("own calendar, new guests, premium no business feature", async function () {
			const calendars = makeCalendars("own")
			const calendarModel = makeCalendarModel()
			const distributor = makeDistributor()
			const userController = makeUserController([], AccountType.PREMIUM, "", false)
			const viewModel = await init({
				userController,
				calendars,
				existingEvent: null,
				calendarModel,
				distributor,
			})
			const newGuest = "new-attendee@example.com"
			viewModel.addGuest(newGuest, null)
			askInsecurePassword = o.spy(async () => true)
			const e = await assertThrows(BusinessFeatureRequiredError, () =>
				viewModel.saveAndSend({
					askForUpdates,
					askInsecurePassword,
					showProgress,
				}),
			)
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
						address: createEncryptedMailAddress({
							address: guest,
						}),
					}),
				],
				organizer: encMailAddress,
				startTime: new Date(2020, 4, 5, 16),
				endTime: new Date(2020, 4, 6, 20),
			})
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			const viewModel = await init({
				userController,
				calendars,
				existingEvent,
				calendarModel,
				distributor,
			})
			viewModel.setStartDate(new Date(2020, 4, 3))
			askForUpdates = o.spy(() => Promise.resolve("yes"))
			o(
				await viewModel.saveAndSend({
					askForUpdates,
					askInsecurePassword,
					showProgress,
				}),
			).equals(true)
			// @ts-ignore
			o(calendarModel.updateEvent.calls.length).equals(1)("created event")
			// @ts-ignore
			o(distributor.sendUpdate.calls[0].args[1]).equals(updateModel)
			// @ts-ignore
			o(distributor.sendCancellation.callCount).equals(0)
			o(updateModel.bccRecipients().map((a) => a.address)).deepEquals([guest])
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
				address: createEncryptedMailAddress({
					address: "remove-attendee@example.com",
				}),
				type: RecipientType.EXTERNAL,
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
						address: createEncryptedMailAddress({
							address: oldGuest,
						}),
					}),
					toRemoveAttendee,
				],
				organizer: encMailAddress,
				startTime: new Date(2020, 4, 5, 16),
				endTime: new Date(2020, 4, 6, 20),
			})
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			const viewModel = await init({
				userController,
				calendars,
				existingEvent,
				calendarModel,
				distributor,
			})
			viewModel.setStartDate(new Date(2020, 4, 3))
			viewModel.addGuest(newGuest, null)
			viewModel.removeAttendee(toRemoveGuest)
			askForUpdates = o.spy(() => Promise.resolve("yes"))
			await viewModel.saveAndSend({
				askForUpdates,
				askInsecurePassword,
				showProgress,
			})
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
						address: createEncryptedMailAddress({
							address: guest,
						}),
					}),
				],
				organizer: encMailAddress,
				startTime: new Date(2020, 4, 5, 16),
				endTime: new Date(2020, 4, 6, 20),
			})
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			const viewModel = await init({
				userController,
				calendars,
				existingEvent,
				calendarModel,
				distributor,
			})
			// @ts-ignore
			updateModel.bccRecipients()[0].type = RecipientType.EXTERNAL

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
						address: createEncryptedMailAddress({
							address: "guest@tutanota.com",
						}),
					}),
				],
			})
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			const viewModel = await init({
				userController,
				calendarModel,
				calendars,
				existingEvent,
			})
			viewModel.addAlarm(AlarmInterval.FIVE_MINUTES)
			o(
				await viewModel.saveAndSend({
					askForUpdates,
					askInsecurePassword,
					showProgress,
				}),
			).equals(true)
			// @ts-ignore
			o(calendarModel.updateEvent.calls.length).equals(1)("Did update event")
			o(askForUpdates.calls.length).equals(0)
		})
	})
	o("send invite with alias as default sender", async function () {
		const calendars = makeCalendars("own")
		const distributor = makeDistributor()
		const alias = "alias@tutanota.com"
		const userController = makeUserController([alias], AccountType.PREMIUM, alias)
		const viewModel = await init({
			calendars,
			distributor,
			userController,
			existingEvent: null,
		})
		viewModel.setConfidential(false)
		viewModel.addGuest("guest@external.de", null)
		o(viewModel.attendees.length).equals(2)
		o(viewModel.organizer!).deepEquals(wrapEncIntoMailAddress(alias))
		const attendees = viewModel.attendees
		o(attendees.find((guest) => guest.address.address === "guest@external.de")).notEquals(undefined)
		o(attendees.find((guest) => guest.address.address === alias)).notEquals(undefined)
		o(attendees.find((guest) => guest.address.address === "address@tutanota.com")).equals(undefined)
	})
	o("invite self to set organizer with existing attendees", async function () {
		const calendars = makeCalendars("own")
		const distributor = makeDistributor()
		const alias = "alias@tutanota.com"
		const aliasEncMailAddress = wrapEncIntoMailAddress(alias)
		const userController = makeUserController([alias], AccountType.PREMIUM)
		const viewModel = await init({
			calendars,
			distributor,
			userController,
			existingEvent: null,
		})
		const attendees = viewModel.attendees
		viewModel.setConfidential(false)
		viewModel.addGuest("guest@external.de", null)
		o(attendees.length).equals(2)
		o(viewModel.organizer!).deepEquals(encMailAddress)
		viewModel.addGuest(accountMailAddress, null)
		o(attendees.length).equals(2)
		o(viewModel.organizer!).deepEquals(encMailAddress)
		o(attendees.find((guest) => guest.address.address === "guest@external.de")).notEquals(undefined)
		o(attendees.find((guest) => guest.address.address === accountMailAddress)).notEquals(undefined)
		o(attendees.find((guest) => guest.address.address === alias)).equals(undefined)
		viewModel.addGuest(alias, null)
		o(attendees.length).equals(2)
		// @ts-ignore
		o(viewModel.organizer).deepEquals(aliasEncMailAddress)("the organizer should now be the alias")
		o(attendees.find((guest) => guest.address.address === "guest@external.de")).notEquals(undefined)
		o(attendees.find((guest) => guest.address.address === alias)).notEquals(undefined)
		o(attendees.find((guest) => guest.address.address === accountMailAddress)).equals(undefined)
	})
	o("invite self as first attendee", async function () {
		const calendars = makeCalendars("own")
		const distributor = makeDistributor()
		const alias = "alias@tutanota.com"
		const userController = makeUserController([alias], AccountType.PREMIUM)
		const viewModel = await init({
			calendars,
			distributor,
			userController,
			existingEvent: null,
		})
		const attendees = viewModel.attendees
		viewModel.setConfidential(false)
		viewModel.addGuest(accountMailAddress, null)
		o(attendees.length).equals(1)
		// @ts-ignore
		o(viewModel.organizer).deepEquals(encMailAddress)
		o(attendees.find((guest) => guest.address.address === accountMailAddress)).notEquals(undefined)
	})
	o("invite alias as first attendee", async function () {
		const calendars = makeCalendars("own")
		const distributor = makeDistributor()
		const alias = "alias@tutanota.com"
		const aliasEncMailAddress = wrapEncIntoMailAddress(alias)
		const userController = makeUserController([alias], AccountType.PREMIUM)
		const viewModel = await init({
			calendars,
			distributor,
			userController,
			existingEvent: null,
		})
		const attendees = viewModel.attendees
		viewModel.setConfidential(false)
		viewModel.addGuest(alias, null)
		o(attendees.length).equals(1)
		o(viewModel.organizer!).deepEquals(aliasEncMailAddress)
		o(attendees.find((guest) => guest.address.address === alias)).notEquals(undefined)
	})
	o.spec("Events we have been invited to by another user", function () {
		o(
			"When we change our attendance status for a new event event (without id) to 'accept' the organizer is notified and the event is created",
			async function () {
				const calendars = makeCalendars("own")
				const distributor = makeDistributor()
				const userController = makeUserController([], AccountType.PREMIUM)
				const existingEvent = createCalendarEvent({
					_ownerGroup: calendarGroupId,
					startTime: new Date(2020, 5, 1),
					endTime: new Date(2020, 5, 2),
					organizer: wrapEncIntoMailAddress("someonelse@tutanota.com"),
					attendees: [
						createCalendarEventAttendee({
							status: CalendarAttendeeStatus.ADDED,
							address: encMailAddress,
						}),
					],
				})
				const calendarModel = makeCalendarModel()
				const viewModel = await init({
					calendars,
					distributor,
					userController,
					existingEvent,
					calendarModel,
				})
				viewModel.guestStatuses = addMapEntry(viewModel.guestStatuses, encMailAddress.address, CalendarAttendeeStatus.ACCEPTED)
				await viewModel.saveAndSend({ askForUpdates, askInsecurePassword, showProgress })
				o(distributor.sendResponse.calls.length).equals(1)("organizer gets notified")
				o(calendarModel.createEvent.calls.length).equals(1)("create event")
			},
		)
		o(
			"When we change our attendance status for a new event event (without id) to 'decline' the organizer is notified and the event is created",
			async function () {
				const calendars = makeCalendars("own")
				const distributor = makeDistributor()
				const userController = makeUserController([], AccountType.PREMIUM)
				const existingEvent = createCalendarEvent({
					_ownerGroup: calendarGroupId,
					startTime: new Date(2020, 5, 1),
					endTime: new Date(2020, 5, 2),
					organizer: wrapEncIntoMailAddress("someonelse@tutanota.com"),
					attendees: [
						createCalendarEventAttendee({
							status: CalendarAttendeeStatus.ACCEPTED,
							address: encMailAddress,
						}),
					],
				})
				const calendarModel = makeCalendarModel()
				const viewModel = await init({
					calendars,
					distributor,
					userController,
					existingEvent,
					calendarModel,
				})
				viewModel.guestStatuses = addMapEntry(viewModel.guestStatuses, encMailAddress.address, CalendarAttendeeStatus.DECLINED)
				await viewModel.saveAndSend({ askForUpdates, askInsecurePassword, showProgress })
				o(distributor.sendResponse.calls.length).equals(1)("organizer gets notified")
				o(calendarModel.createEvent.calls.length).equals(1)("create event")
			},
		)

		o(
			"When we change our attendance status of an existing event to 'decline' the organizer gets notified and the event gets updated in our calendar",
			async function () {
				const calendars = makeCalendars("own")
				const distributor = makeDistributor()
				const userController = makeUserController([], AccountType.PREMIUM)
				const existingEvent = createCalendarEvent({
					_id: ["listId", "calendarId"],
					_ownerGroup: calendarGroupId,
					startTime: new Date(2020, 5, 1),
					endTime: new Date(2020, 5, 2),
					organizer: wrapEncIntoMailAddress("someonelse@tutanota.com"),
					attendees: [
						createCalendarEventAttendee({
							status: CalendarAttendeeStatus.ACCEPTED,
							address: encMailAddress,
						}),
					],
				})
				const calendarModel = makeCalendarModel()
				const viewModel = await init({
					calendars,
					distributor,
					userController,
					existingEvent,
					calendarModel,
				})
				viewModel.guestStatuses = addMapEntry(viewModel.guestStatuses, encMailAddress.address, CalendarAttendeeStatus.DECLINED)
				await viewModel.saveAndSend({ askForUpdates, askInsecurePassword, showProgress })
				o(distributor.sendResponse.calls.length).equals(1)("organizer gets notified")
				o(calendarModel.updateEvent.calls.length).equals(1)("update event")
			},
		)
		o(
			"When we change our attendance status for an existing to 'accepted' the organizer gets notified and the event gets updated in our calendar",
			async function () {
				const calendars = makeCalendars("own")
				const distributor = makeDistributor()
				const userController = makeUserController([], AccountType.PREMIUM)
				const existingEvent = createCalendarEvent({
					_id: ["listId", "calendarId"],
					_ownerGroup: calendarGroupId,
					startTime: new Date(2020, 5, 1),
					endTime: new Date(2020, 5, 2),
					organizer: wrapEncIntoMailAddress("someonelse@tutanota.com"),
					attendees: [
						createCalendarEventAttendee({
							status: CalendarAttendeeStatus.ADDED,
							address: encMailAddress,
						}),
					],
				})
				const calendarModel = makeCalendarModel()
				const viewModel = await init({
					calendars,
					distributor,
					userController,
					existingEvent,
					calendarModel,
				})
				viewModel.guestStatuses = addMapEntry(viewModel.guestStatuses, encMailAddress.address, CalendarAttendeeStatus.ACCEPTED)
				await viewModel.saveAndSend({ askForUpdates, askInsecurePassword, showProgress })
				o(distributor.sendResponse.calls.length).equals(1)("organizer gets notified")
				o(calendarModel.updateEvent.calls.length).equals(1)("update event")
			},
		)
	})
	o.spec("onStartDateSelected", function () {
		o("date adjusted forward", async function () {
			const calendars = makeCalendars("own")
			const existingEvent = createCalendarEvent({
				startTime: DateTime.fromObject(
					{
						year: 2020,
						month: 6,
						day: 8,
						hour: 13,
					},
					{ zone },
				).toJSDate(),
				endTime: DateTime.fromObject(
					{
						year: 2020,
						month: 6,
						day: 9,
						hour: 15,
					},
					{ zone },
				).toJSDate(),
			})
			const viewModel = await init({
				calendars,
				existingEvent,
			})
			viewModel.setStartDate(
				DateTime.fromObject(
					{
						year: 2020,
						month: 6,
						day: 10,
					},
					{ zone },
				).toJSDate(),
			)
			// No hours because it's a "date", not "time" field.
			o(viewModel.endDate.toISOString()).equals(
				DateTime.fromObject(
					{
						year: 2020,
						month: 6,
						day: 11,
					},
					{ zone },
				)
					.toJSDate()
					.toISOString(),
			)
			// @ts-ignore
			o(viewModel.endTime?.toObject()).deepEquals({
				hours: 15,
				minutes: 0,
			})
		})
		o("date adjusted backwards", async function () {
			const calendars = makeCalendars("own")
			const existingEvent = createCalendarEvent({
				startTime: DateTime.fromObject(
					{
						year: 2020,
						month: 6,
						day: 8,
						hour: 13,
					},
					{ zone },
				).toJSDate(),
				endTime: DateTime.fromObject(
					{
						year: 2020,
						month: 6,
						day: 9,
						hour: 15,
					},
					{ zone },
				).toJSDate(),
			})
			const viewModel = await init({
				calendars,
				existingEvent,
			})
			viewModel.setStartDate(
				DateTime.fromObject(
					{
						year: 2020,
						month: 6,
						day: 6,
					},
					{ zone },
				).toJSDate(),
			)
			// No hours because it's a "date", not "time" field.
			o(viewModel.endDate.toISOString()).equals(
				DateTime.fromObject(
					{
						year: 2020,
						month: 6,
						day: 7,
					},
					{ zone },
				)
					.toJSDate()
					.toISOString(),
			)
			// @ts-ignore
			o(viewModel.endTime?.toObject()).deepEquals({
				hours: 15,
				minutes: 0,
			})
		})
	})
	o.spec("onStartTimeSelected", function () {
		o("time adjusted forward", async function () {
			const calendars = makeCalendars("own")
			const existingEvent = createCalendarEvent({
				startTime: DateTime.fromObject(
					{
						year: 2020,
						month: 6,
						day: 8,
						hour: 13,
					},
					{ zone },
				).toJSDate(),
				endTime: DateTime.fromObject(
					{
						year: 2020,
						month: 6,
						day: 8,
						hour: 15,
					},
					{ zone },
				).toJSDate(),
			})
			const viewModel = await init({
				calendars,
				existingEvent,
			})
			viewModel.setStartTime(new Time(14, 0))
			// No hours because it's a "date", not "time" field.
			o(viewModel.endDate.toISOString()).equals(
				DateTime.fromObject(
					{
						year: 2020,
						month: 6,
						day: 8,
					},
					{ zone },
				)
					.toJSDate()
					.toISOString(),
			)
			// @ts-ignore
			o(viewModel.endTime?.to24HourString()).deepEquals("16:00")
		})
		o("time adjusted backward", async function () {
			const calendars = makeCalendars("own")
			const existingEvent = createCalendarEvent({
				startTime: DateTime.fromObject(
					{
						year: 2020,
						month: 6,
						day: 8,
						hour: 13,
					},
					{ zone },
				).toJSDate(),
				endTime: DateTime.fromObject(
					{
						year: 2020,
						month: 6,
						day: 8,
						hour: 15,
					},
					{ zone },
				).toJSDate(),
			})
			const viewModel = await init({
				calendars,
				existingEvent,
			})
			viewModel.setStartTime(new Time(12, 0))
			// No hours because it's a "date", not "time" field.
			o(viewModel.endDate.toISOString()).equals(
				DateTime.fromObject(
					{
						year: 2020,
						month: 6,
						day: 8,
					},
					{ zone },
				)
					.toJSDate()
					.toISOString(),
			)
			// @ts-ignore
			o(viewModel.endTime?.toObject()).deepEquals({
				hours: 14,
				minutes: 0,
			})
		})
		o("time not adjust when different day", async function () {
			const calendars = makeCalendars("own")
			const existingEvent = createCalendarEvent({
				startTime: DateTime.fromObject(
					{
						year: 2020,
						month: 6,
						day: 8,
						hour: 13,
					},
					{ zone },
				).toJSDate(),
				endTime: DateTime.fromObject(
					{
						year: 2020,
						month: 6,
						day: 9,
						hour: 15,
					},
					{ zone },
				).toJSDate(),
			})
			const viewModel = await init({
				calendars,
				existingEvent,
			})
			viewModel.setStartTime(new Time(12, 0))
			// No hours because it's a "date", not "time" field.
			o(viewModel.endDate.toISOString()).equals(
				DateTime.fromObject(
					{
						year: 2020,
						month: 6,
						day: 9,
					},
					{ zone },
				)
					.toJSDate()
					.toISOString(),
			)
			o(viewModel.endTime?.to24HourString()).equals("15:00")
		})
	})
	o.spec("add guest", function () {
		o("to new event", async function () {
			const calendars = makeCalendars("own")
			const viewModel = await init({
				calendars,
				existingEvent: null,
			})
			const newGuest = "new-attendee@example.com"
			viewModel.addGuest(newGuest, null)
			await viewModel.waitForResolvedRecipients()
			o(viewModel.attendees).deepEquals([
				{
					address: encMailAddress,
					type: RecipientType.INTERNAL,
					status: CalendarAttendeeStatus.ACCEPTED,
				},
				{
					address: createEncryptedMailAddress({
						address: newGuest,
					}),
					type: RecipientType.EXTERNAL,
					//add guest does not wait for recipient info to be resolved
					status: CalendarAttendeeStatus.ADDED,
				},
			])
			await delay(resolveRecipientMs)
			o(viewModel.attendees[1].type).equals(RecipientType.EXTERNAL)
		})
		o("to existing event", async function () {
			const calendars = makeCalendars("own")
			const existingEvent = createCalendarEvent({
				_ownerGroup: calendarGroupId,
			})
			const viewModel = await init({
				calendars,
				existingEvent,
			})
			const newGuest = "new-attendee@example.com"
			viewModel.addGuest(newGuest, null)
			await viewModel.waitForResolvedRecipients()
			o(viewModel.attendees).deepEquals([
				{
					address: encMailAddress,
					type: RecipientType.INTERNAL,
					status: CalendarAttendeeStatus.ACCEPTED,
				},
				{
					address: createEncryptedMailAddress({
						address: newGuest,
					}),
					type: RecipientType.EXTERNAL,
					status: CalendarAttendeeStatus.ADDED,
				},
			])
			await delay(resolveRecipientMs)
			o(viewModel.attendees[1].type).equals(RecipientType.EXTERNAL)
		})
		o("to existing event as duplicate", async function () {
			const calendars = makeCalendars("own")
			const guest = "new-attendee@example.com"
			const existingEvent = createCalendarEvent({
				attendees: [
					createCalendarEventAttendee({
						address: createEncryptedMailAddress({
							address: guest,
						}),
					}),
				],
			})
			const viewModel = await init({
				calendars,
				existingEvent,
			})
			viewModel.addGuest(guest, null)
			await viewModel.waitForResolvedRecipients()
			// Organizer is not added because new attendee was not added
			o(viewModel.attendees).deepEquals([
				{
					address: createEncryptedMailAddress({
						address: guest,
					}),
					type: RecipientType.EXTERNAL,
					status: CalendarAttendeeStatus.ADDED,
				},
			])
			await delay(resolveRecipientMs)
			o(viewModel.attendees[0].type).equals(RecipientType.EXTERNAL)
		})
	})
	o.spec("select going", function () {
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
			const viewModel = await init({
				calendars,
				userController,
				existingEvent,
			})
			viewModel.selectGoing(CalendarAttendeeStatus.ACCEPTED)
			o(viewModel.attendees).deepEquals([
				{
					address: ownAttendee.address,
					status: CalendarAttendeeStatus.ACCEPTED,
					type: RecipientType.INTERNAL,
				},
			])
		})
		o("status of own attendee is changed selected in own event", async function () {
			const calendars = makeCalendars("own")
			const attendee = createCalendarEventAttendee({
				address: createEncryptedMailAddress({
					address: "guest@example.com",
				}),
			})
			const ownAttendee = createCalendarEventAttendee({
				address: encMailAddress,
			})
			const existingEvent = createCalendarEvent({
				attendees: [attendee, ownAttendee],
			})
			const viewModel = await init({
				calendars,
				existingEvent,
			})
			viewModel.selectGoing(CalendarAttendeeStatus.DECLINED)
			await viewModel.waitForResolvedRecipients()
			o(viewModel.attendees).deepEquals([
				{
					address: encMailAddress,
					type: RecipientType.INTERNAL,
					status: CalendarAttendeeStatus.DECLINED,
				},
				{
					address: attendee.address,
					type: RecipientType.EXTERNAL,
					status: CalendarAttendeeStatus.ADDED,
				},
			])
			await delay(resolveRecipientMs)
			o(viewModel.attendees[1].type).equals(RecipientType.EXTERNAL)
		})
		o("status of own attendee is changed selected in invite", async function () {
			const calendars = makeCalendars("own")
			const attendee = createCalendarEventAttendee({
				address: createEncryptedMailAddress({
					address: "guest@example.com",
				}),
			})
			const ownAttendee = createCalendarEventAttendee({
				address: encMailAddress,
			})
			const existingEvent = createCalendarEvent({
				attendees: [attendee, ownAttendee],
				organizer: createEncryptedMailAddress({
					address: "organizer@example.com",
				}),
			})
			const viewModel = await init({
				calendars,
				existingEvent,
			})
			viewModel.selectGoing(CalendarAttendeeStatus.TENTATIVE)
			await viewModel.waitForResolvedRecipients()
			o(viewModel.attendees).deepEquals([
				{
					address: encMailAddress,
					type: RecipientType.INTERNAL,
					status: CalendarAttendeeStatus.TENTATIVE,
				},
				{
					address: attendee.address,
					type: RecipientType.EXTERNAL,
					status: assertEnumValue(CalendarAttendeeStatus, attendee.status),
				},
			])
			await delay(resolveRecipientMs)
			o(viewModel.attendees[1].type).equals(RecipientType.EXTERNAL)
		})
	})
	o.spec("canModifyOrganizer", function () {
		o("can modify when when new event and no guests", async function () {
			const calendars = makeCalendars("own")
			const viewModel = await init({
				calendars,
				existingEvent: null,
			})
			o(viewModel.canModifyOrganizer()).equals(true)
		})
		o("can modify when when new own event and added guests", async function () {
			const calendars = makeCalendars("own")
			const viewModel = await init({
				calendars,
				existingEvent: null,
			})
			viewModel.addGuest("guest@example.com", null)
			o(viewModel.canModifyOrganizer()).equals(true)
		})
		o("can modify when own event and no guests", async function () {
			const calendars = makeCalendars("own")
			const viewModel = await init({
				calendars,
				existingEvent: createCalendarEvent({
					_id: ["listId", "calendarId"],
					_ownerGroup: calendarGroupId,
				}),
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
				}),
			})
			viewModel.addGuest("guest@tutanota.de", null)
			o(viewModel.canModifyOrganizer()).equals(true)
		})
		o("cannot modify in own calendar when there were guests", async function () {
			const calendars = makeCalendars("own")
			const viewModel = await init({
				calendars,
				existingEvent: createCalendarEvent({
					_id: ["listId", "calendarId"],
					_ownerGroup: calendarGroupId,
					attendees: [
						createCalendarEventAttendee({
							address: createEncryptedMailAddress({
								address: "guest@tutanota.com",
							}),
						}),
					],
				}),
			})
			o(viewModel.canModifyOrganizer()).equals(false)
		})
		o("cannot modify in own calendar when there were guests and they were removed", async function () {
			const calendars = makeCalendars("own")
			const toRemoveGuest: Guest = {
				address: createEncryptedMailAddress({
					address: "remove-attendee@example.com",
				}),
				type: RecipientType.EXTERNAL,
				status: CalendarAttendeeStatus.ACCEPTED,
			}
			const viewModel = await init({
				calendars,
				existingEvent: createCalendarEvent({
					_id: ["listId", "calendarId"],
					_ownerGroup: calendarGroupId,
					attendees: [
						createCalendarEventAttendee({
							address: toRemoveGuest.address,
						}),
					],
				}),
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
				}),
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
				}),
			})
			o(viewModel.canModifyOrganizer()).equals(false)
		})
		o("cannot modify when it's invite in own calendar", async function () {
			const calendars = makeCalendars("own")

			const viewModel = await init({
				calendars,
				existingEvent: createCalendarEvent({
					summary: "existing event",
					startTime: new Date(2020, 4, 26, 12),
					endTime: new Date(2020, 4, 26, 13),
					organizer: wrapEncIntoMailAddress("another-user@provider.com"),
					_ownerGroup: calendarGroupId,
					attendees: [
						createCalendarEventAttendee({
							address: createEncryptedMailAddress({
								address: "attendee@example.com",
							}),
						}),
						createCalendarEventAttendee({
							address: encMailAddress,
						}),
					],
				}),
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
			[rwCalendarId, rwCalendar],
		])
		o("own calendar, new event", async function () {
			const viewModel = await init({
				userController,
				calendars,
				existingEvent: null,
			})
			o(viewModel.getAvailableCalendars()).deepEquals([ownCalendar, rwCalendar])
		})
		o("own calendar, existing event no guests", async function () {
			const existingEvent = createCalendarEvent({
				_ownerGroup: calendarGroupId,
			})
			const viewModel = await init({
				userController,
				calendars,
				existingEvent,
			})
			o(viewModel.getAvailableCalendars()).deepEquals([ownCalendar, rwCalendar])
		})
		o("rw calendar, existing event with no guests", async function () {
			const existingEvent = createCalendarEvent({
				_ownerGroup: rwCalendarId,
			})
			const viewModel = await init({
				userController,
				calendars,
				existingEvent,
			})
			o(viewModel.getAvailableCalendars()).deepEquals([ownCalendar, rwCalendar])
		})
		o("new invite", async function () {
			const existingEvent = createCalendarEvent({
				_ownerGroup: null,
				organizer: createEncryptedMailAddress({
					address: "organizer@example.com",
				}),
				attendees: [makeAttendee(encMailAddress.address)],
			})
			const viewModel = await init({
				userController,
				calendars,
				existingEvent,
			})
			o(viewModel.getAvailableCalendars()).deepEquals([ownCalendar])
		})
		o("ro calendar, existing event with no guests", async function () {
			const existingEvent = createCalendarEvent({
				_ownerGroup: roCalendarId,
			})
			const viewModel = await init({
				userController,
				calendars,
				existingEvent,
			})
			o(viewModel.getAvailableCalendars()).deepEquals([roCalendar])
		})
		o("own calendar, existing event with guests", async function () {
			const existingEvent = createCalendarEvent({
				_ownerGroup: calendarGroupId,
				attendees: [makeAttendee()],
			})
			const viewModel = await init({
				userController,
				calendars,
				existingEvent,
			})
			o(viewModel.getAvailableCalendars()).deepEquals([ownCalendar])
		})
		o("rw calendar, existing event with guests", async function () {
			const existingEvent = createCalendarEvent({
				_ownerGroup: rwCalendarId,
				attendees: [makeAttendee()],
			})
			const viewModel = await init({
				userController,
				calendars,
				existingEvent,
			})
			o(viewModel.getAvailableCalendars()).deepEquals([rwCalendar])
		})
		o("ro calendar, existing event with guests", async function () {
			const existingEvent = createCalendarEvent({
				_ownerGroup: roCalendarId,
				attendees: [makeAttendee()],
			})
			const viewModel = await init({
				userController,
				calendars,
				existingEvent,
			})
			o(viewModel.getAvailableCalendars()).deepEquals([roCalendar])
		})
	})
	o.spec("shouldShowInviteNotAvailable", async function () {
		o("not available for free users", async function () {
			const userController = makeUserController([], AccountType.FREE, "", false)
			const viewModel = await init({
				userController,
				calendars: makeCalendars("own"),
				existingEvent: null,
			})
			const notAvailable = await viewModel.shouldShowSendInviteNotAvailable()
			o(notAvailable).equals(true)
		})
		o("not available for premium users without business subscription", async function () {
			const userController = makeUserController([], AccountType.PREMIUM, "", false)
			const viewModel = await init({
				userController,
				calendars: makeCalendars("own"),
				existingEvent: null,
			})
			await viewModel.updateCustomerFeatures()
			const notAvailable = await viewModel.shouldShowSendInviteNotAvailable()
			o(notAvailable).equals(true)
		})
		o("available for premium users with business subscription", async function () {
			const userController = makeUserController([], AccountType.PREMIUM, "", true)
			const viewModel = await init({
				userController,
				calendars: makeCalendars("own"),
				existingEvent: null,
			})
			await viewModel.updateCustomerFeatures()
			const notAvailable = await viewModel.shouldShowSendInviteNotAvailable()
			o(notAvailable).equals(false)
		})
		o("available for external users", async function () {
			const userController = makeUserController([], AccountType.EXTERNAL, "", false)
			const viewModel = await init({
				userController,
				calendars: makeCalendars("own"),
				existingEvent: null,
			})
			await viewModel.updateCustomerFeatures()
			const notAvailable = await viewModel.shouldShowSendInviteNotAvailable()
			o(notAvailable).equals(false)
		})
	})
})

	})
	})
})
