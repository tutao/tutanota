import o from "ospec"
import {
	CalendarEvent,
	createCalendarEvent,
	createCalendarEventAttendee,
	createContact,
	createEncryptedMailAddress,
} from "../../../../src/api/entities/tutanota/TypeRefs.js"
import { CalendarEventWhoModel } from "../../../../src/calendar/date/eventeditor/CalendarEventWhoModel.js"
import { matchers, object, verify, when } from "testdouble"
import { RecipientsModel } from "../../../../src/api/main/RecipientsModel.js"
import { Recipient, RecipientType } from "../../../../src/api/common/recipients/Recipient.js"
import { AccountType, CalendarAttendeeStatus, ShareCapability } from "../../../../src/api/common/TutanotaConstants.js"
import { createUser } from "../../../../src/api/entities/sys/TypeRefs.js"
import { SendMailModel } from "../../../../src/mail/editor/SendMailModel.js"
import { UserController } from "../../../../src/api/main/UserController.js"
import { EventType } from "../../../../src/calendar/date/eventeditor/CalendarEventModel.js"
import {
	addCapability,
	calendars,
	makeUserController,
	otherAddress,
	otherAddress2,
	otherRecipient,
	otherRecipient2,
	ownAddresses,
	ownerAddress,
	ownerAlias,
	ownerAliasRecipient,
	ownerRecipient,
} from "../CalendarTestUtils.js"
import { neverNull } from "@tutao/tutanota-utils"
import { RecipientField } from "../../../../src/mail/model/MailUtils.js"
import { ProgrammingError } from "../../../../src/api/common/error/ProgrammingError.js"

o.spec("CalendarEventWhoModel", function () {
	const passwordStrengthModel = () => 1

	let recipients: RecipientsModel
	let sendMailModel: SendMailModel
	let userController: UserController

	const setupRecipient = (recipient: Recipient) => {
		const sameAddressMatcher = matchers.argThat((p) => p.address === recipient.address)
		when(recipients.resolve(sameAddressMatcher, matchers.anything())).thenReturn({
			resolved: () => Promise.resolve(recipient),
		})
	}

	o.beforeEach(() => {
		userController = object()
		sendMailModel = object()
		recipients = object()
		setupRecipient(ownerRecipient)
		setupRecipient(ownerAliasRecipient)
		setupRecipient(otherRecipient)
		setupRecipient(otherRecipient2)
	})

	const getNewModel = (initialValues: Partial<CalendarEvent>) =>
		new CalendarEventWhoModel(
			initialValues,
			EventType.OWN,
			calendars,
			calendars.get("ownCalendar")!,
			userController,
			true,
			ownAddresses,
			recipients,
			passwordStrengthModel,
			() => sendMailModel,
		)
	const getOldModel = (initialValues: Partial<CalendarEvent>, eventType = EventType.OWN) =>
		new CalendarEventWhoModel(
			initialValues,
			eventType,
			calendars,
			calendars.get("ownCalendar")!,
			userController,
			false,
			ownAddresses,
			recipients,
			passwordStrengthModel,
			() => sendMailModel,
		)

	const getOldSharedModel = (initialValues: Partial<CalendarEvent>, eventType = EventType.SHARED_RW) =>
		new CalendarEventWhoModel(
			initialValues,
			eventType,
			calendars,
			calendars.get("sharedCalendar")!,
			userController,
			false,
			ownAddresses,
			recipients,
			passwordStrengthModel,
			() => sendMailModel,
		)

	const getOldInviteModel = (initialValues: Partial<CalendarEvent>) =>
		new CalendarEventWhoModel(
			initialValues,
			EventType.INVITE,
			calendars,
			calendars.get("ownCalendar")!,
			userController,
			false,
			ownAddresses,
			recipients,
			passwordStrengthModel,
			() => sendMailModel,
		)

	const getNewInviteModel = (initialValues: Partial<CalendarEvent>) =>
		new CalendarEventWhoModel(
			initialValues,
			EventType.INVITE,
			calendars,
			calendars.get("ownCalendar")!,
			userController,
			true,
			ownAddresses,
			recipients,
			passwordStrengthModel,
			() => sendMailModel,
		)

	o.spec("invite capabilities for different events", function () {
		o("invite in our own calendar can only modify own attendance", async function () {
			const existingEvent = createCalendarEvent({
				summary: "existing event",
				startTime: new Date(2020, 4, 26, 12),
				endTime: new Date(2020, 4, 26, 13),
				organizer: otherAddress,
				_ownerGroup: "ownCalendar",
				attendees: [
					createCalendarEventAttendee({
						address: ownerAddress,
						status: CalendarAttendeeStatus.ACCEPTED,
					}),
					createCalendarEventAttendee({
						address: otherAddress,
					}),
				],
			})
			const model = getOldInviteModel(existingEvent)
			o(model.ownGuest?.status).equals(CalendarAttendeeStatus.ACCEPTED)
			o(model.canModifyGuests).equals(false)
			model.setOwnAttendance(CalendarAttendeeStatus.DECLINED)
			o(model.ownGuest?.status).equals(CalendarAttendeeStatus.DECLINED)
			o(model.possibleOrganizers).deepEquals([neverNull(existingEvent.organizer)])
		})
		o("existing normal event in writable calendar can not modify guests", async function () {
			const userController = makeUserController()
			addCapability(userController.user, "sharedCalendar", ShareCapability.Write)
			const existingEvent = createCalendarEvent({
				summary: "existing event",
				startTime: new Date(2020, 4, 26, 12),
				endTime: new Date(2020, 4, 26, 13),
				organizer: otherAddress,
				_ownerGroup: "sharedCalendar",
				attendees: [
					createCalendarEventAttendee({
						address: ownerAddress,
						status: CalendarAttendeeStatus.ACCEPTED,
					}),
					createCalendarEventAttendee({
						address: otherAddress,
					}),
				],
			})

			const model = getOldModel(existingEvent, EventType.SHARED_RW)
			model.selectedCalendar = calendars.get("sharedCalendar")!
			o(model.canModifyGuests).equals(false)
			o(model.possibleOrganizers).deepEquals([neverNull(existingEvent.organizer)])
		})
		o("for an invite in writable calendar, we cannot modify guests", async function () {
			const userController = makeUserController()
			addCapability(userController.user, "sharedCalendar", ShareCapability.Write)
			const existingEvent = createCalendarEvent({
				summary: "existing event",
				startTime: new Date(2020, 4, 26, 12),
				endTime: new Date(2020, 4, 26, 13),
				organizer: otherAddress,
				_ownerGroup: "sharedCalendar",
				attendees: [
					createCalendarEventAttendee({
						address: otherAddress,
					}),
					createCalendarEventAttendee({
						address: otherAddress2,
					}),
				],
			})
			const model = getOldSharedModel(existingEvent, EventType.LOCKED)
			o(model.canModifyGuests).equals(false)("cannot modify guests")
			o(model.possibleOrganizers).deepEquals([neverNull(existingEvent.organizer)])
		})
		o("in readonly calendar, cannot modify guests", async function () {
			const userController = makeUserController()
			addCapability(userController.user, "sharedCalendar", ShareCapability.Read)
			const existingEvent = createCalendarEvent({
				_ownerGroup: "sharedCalendar",
			})
			const model = getOldSharedModel(existingEvent, EventType.SHARED_RO)
			o(model.canModifyGuests).equals(false)("canModifyGuests")
			o(model.possibleOrganizers).deepEquals([])
		})
		o("in writable calendar w/ guests, we cannot modify guests", async function () {
			const userController = makeUserController()
			addCapability(userController.user, "sharedCalendar", ShareCapability.Write)
			const existingEvent = createCalendarEvent({
				summary: "existing event",
				startTime: new Date(2020, 4, 26, 12),
				endTime: new Date(2020, 4, 26, 13),
				organizer: otherAddress,
				_ownerGroup: "sharedCalendar",
				attendees: [
					createCalendarEventAttendee({
						address: otherAddress,
					}),
					createCalendarEventAttendee({
						address: ownerAddress,
					}),
				],
			})
			const model = getOldSharedModel(existingEvent, EventType.SHARED_RO)
			o(model.canModifyGuests).equals(false)
			o(model.possibleOrganizers).deepEquals([neverNull(existingEvent.organizer)])
		})
	})
	o.spec("adding and removing attendees", function () {
		o("adding another alias on your own event replaces the old attendee and updates the organizer", async function () {
			const model = getNewModel({
				attendees: [createCalendarEventAttendee({ address: ownAddresses[0] }), createCalendarEventAttendee({ address: otherAddress })],
				organizer: ownAddresses[0],
			})

			model.addAttendee(ownerAlias.address, null)
			await model.recipientsSettled
			o(model.guests).deepEquals([
				{
					address: otherAddress.address,
					name: otherAddress.name,
					type: RecipientType.EXTERNAL,
					contact: otherRecipient.contact,
					status: CalendarAttendeeStatus.ADDED,
				},
			])("the single non-organizer guest is in guests array")
			o(model.ownGuest).deepEquals(model.organizer)("the own guest is the organizer")
			const result = model.result
			o(result.inviteModel).notEquals(null)("on a new model, everyone but the organizer needs to be invited, even if added during initialization")
			o(result.updateModel).equals(null)
			o(result.cancelModel).equals(null)
			o(result.responseModel).equals(null)
			o(result.attendees).deepEquals([
				createCalendarEventAttendee({ address: ownerAlias, status: CalendarAttendeeStatus.ACCEPTED }),
				createCalendarEventAttendee({ address: otherAddress, status: CalendarAttendeeStatus.ADDED }),
			])("the result contains all attendees including the organizer")
			o(result.organizer).deepEquals(ownerAlias)
		})
		o("setting multiple ownAddresses correctly gives the possible organizers", function () {
			const model = getNewModel({
				attendees: [createCalendarEventAttendee({ address: ownAddresses[0] }), createCalendarEventAttendee({ address: otherAddress })],
				organizer: ownAddresses[0],
			})
			o(model.possibleOrganizers).deepEquals([ownerAddress, ownerAlias])
		})
		o("add attendee that is not the user while without organizer -> organizer is now the first of the current users' mail addresses", async function () {
			const model = getNewModel({
				attendees: [],
				organizer: null,
			})
			model.addAttendee(otherAddress.address, otherRecipient.contact)
			await model.recipientsSettled
			o(model.organizer).deepEquals({
				address: ownAddresses[0].address,
				name: ownAddresses[0].name,
				type: RecipientType.INTERNAL,
				status: CalendarAttendeeStatus.ACCEPTED,
				contact: null,
			})
			const result = model.result
			o(result.attendees.map((a) => a.address)).deepEquals([ownerAddress, otherAddress])
			o(result.organizer).deepEquals(ownerAddress)
		})
		o("remove last attendee that is not the organizer also removes the organizer on the result, but not on the attendees getter", function () {
			const model = getNewModel({
				attendees: [],
				organizer: null,
			})
			model.addAttendee(otherAddress.address, otherRecipient.contact)
			o(model.organizer).notEquals(null)
			model.removeAttendee(otherAddress.address)
			const result = model.result
			o(result.attendees.length).equals(0)
			o(result.organizer).equals(null)
		})
		o("trying to remove the organizer while there are other attendees does nothing", function () {
			const model = getNewModel({
				attendees: [createCalendarEventAttendee({ address: ownAddresses[0] }), createCalendarEventAttendee({ address: otherAddress })],
				organizer: ownerAddress,
			})
			model.removeAttendee(ownerAddress.address)
			const result = model.result
			o(result.attendees.length).equals(2)
			o(result.organizer).deepEquals(ownerAddress)
		})
		o("getting the result on an old model is idempotent", function () {
			const model = getOldModel({
				attendees: [
					createCalendarEventAttendee({ address: ownAddresses[0], status: CalendarAttendeeStatus.ACCEPTED }),
					createCalendarEventAttendee({ address: otherAddress, status: CalendarAttendeeStatus.ACCEPTED }),
				],
				organizer: ownerAddress,
			})
			model.removeAttendee(otherAddress.address)
			model.addAttendee(otherAddress2.address, otherRecipient2.contact)
			o(model.result).deepEquals(model.result)
		})
		o("removing an attendee while there are other attendees removes only that attendee", async function () {
			const model = getOldModel({
				attendees: [
					createCalendarEventAttendee({ address: ownAddresses[0], status: CalendarAttendeeStatus.ACCEPTED }),
					createCalendarEventAttendee({ address: otherAddress }),
				],
				organizer: ownerAddress,
			})
			model.addAttendee(otherAddress.address, otherRecipient.contact)
			model.addAttendee(otherAddress2.address, otherRecipient2.contact)
			await model.recipientsSettled
			const resultBeforeRemove = model.result
			o(resultBeforeRemove.attendees).deepEquals([
				createCalendarEventAttendee({ address: ownerAddress, status: CalendarAttendeeStatus.ACCEPTED }),
				createCalendarEventAttendee({ address: otherAddress, status: CalendarAttendeeStatus.ADDED }),
				createCalendarEventAttendee({ address: otherAddress2, status: CalendarAttendeeStatus.ADDED }),
			])("there are three attendees in the event")
			o(resultBeforeRemove.organizer).deepEquals(ownerAddress)
			model.removeAttendee(otherAddress.address)
			const result = model.result
			o(result.attendees).deepEquals([
				createCalendarEventAttendee({ address: ownerAddress, status: CalendarAttendeeStatus.ACCEPTED }),
				createCalendarEventAttendee({ address: otherAddress2, status: CalendarAttendeeStatus.ADDED }),
			])
			o(result.organizer).deepEquals(ownerAddress)
		})
		o("setting external passwords is reflected in the getters and result", async function () {
			const model = getNewModel({
				attendees: [
					createCalendarEventAttendee({ address: ownAddresses[0] }),
					createCalendarEventAttendee({ address: otherAddress, status: CalendarAttendeeStatus.NEEDS_ACTION }),
				],
				organizer: ownerAddress,
				invitedConfidentially: true,
			})

			o(model.guests).deepEquals([
				{
					address: "someone@tutanota.de",
					name: "Some One",
					status: CalendarAttendeeStatus.NEEDS_ACTION,
					type: RecipientType.UNKNOWN,
					contact: null,
				},
			])
			o(model.getPresharedPassword(otherAddress.address)).deepEquals({ password: "", strength: 0 })("password is not set")
			await model.recipientsSettled
			o(model.guests).deepEquals([
				{
					address: "someone@tutanota.de",
					name: "Some One",
					status: CalendarAttendeeStatus.NEEDS_ACTION,
					type: RecipientType.EXTERNAL,
					contact: otherRecipient.contact,
				},
			])
			o(model.getPresharedPassword(otherAddress.address)).deepEquals({ password: "otherPassword", strength: 1 })
			const { attendees } = model.result
			o(attendees).deepEquals([
				createCalendarEventAttendee({
					address: ownerAddress,
					status: CalendarAttendeeStatus.ADDED,
				}),
				createCalendarEventAttendee({
					address: otherAddress,
					status: CalendarAttendeeStatus.NEEDS_ACTION,
				}),
			])
		})
		o("adding only oneself as an organizer but no attendees results in a result without organizer or attendees", function () {
			const model = getNewModel({})
			model.addAttendee(ownAddresses[0].address)
			o(model.guests.length).equals(0)
			o(model.organizer?.address).equals(ownAddresses[0].address)
			o(model.result.organizer).equals(null)
			o(model.result.attendees.length).equals(0)
		})
		o("organizer is replaced with ourselves when an own event with someone else as organizer is opened", function () {
			const model = getNewModel({
				attendees: [
					createCalendarEventAttendee({ address: ownAddresses[0], status: CalendarAttendeeStatus.ACCEPTED }),
					createCalendarEventAttendee({ address: otherAddress, status: CalendarAttendeeStatus.ACCEPTED }),
					createCalendarEventAttendee({ address: otherAddress2, status: CalendarAttendeeStatus.NEEDS_ACTION }),
				],
				organizer: otherAddress,
			})
			o(model.guests.length).equals(2)("only two guests besides the organizer")
			o(model.organizer?.address).equals(ownAddresses[0].address)("model states us as organizer")
			o(model.result.organizer).deepEquals(ownAddresses[0])("result has us as an organizer")
			o(model.result.attendees.length).equals(3)("we as organizer + the original organizer + the other attendee are in the result")
		})
		o("removing/adding attendees on existing event correctly creates the send models", function () {
			const sendModels: Array<SendMailModel> = [object(), object(), object()]
			const userController = makeUserController([], AccountType.PAID)
			const third = createEncryptedMailAddress({ address: "somethirdaddress@tutanota.com" })
			setupRecipient({
				name: "third",
				address: third.address,
				type: RecipientType.INTERNAL,
				contact: null,
			})

			const existingEvent = createCalendarEvent({
				_ownerGroup: "ownCalendar",
				startTime: new Date(2020, 5, 1),
				endTime: new Date(2020, 5, 2),
				organizer: ownerAddress,
				attendees: [
					createCalendarEventAttendee({
						status: CalendarAttendeeStatus.NEEDS_ACTION,
						address: ownerAddress,
					}),
					createCalendarEventAttendee({
						status: CalendarAttendeeStatus.NEEDS_ACTION,
						address: otherAddress2,
					}),
					createCalendarEventAttendee({
						status: CalendarAttendeeStatus.NEEDS_ACTION,
						address: third,
					}),
				],
			})
			const model = new CalendarEventWhoModel(
				existingEvent,
				EventType.OWN,
				calendars,
				calendars.get("ownCalendar")!,
				userController,
				false,
				ownAddresses,
				recipients,
				passwordStrengthModel,
				() => sendModels.pop()!,
			)
			model.removeAttendee(otherAddress2.address)
			model.addAttendee(otherAddress.address, createContact({ nickname: otherAddress.name }))
			const result = model.result
			o(result.responseModel).equals(null)
			verify(result.updateModel?.addRecipient(RecipientField.BCC, third), { times: 1 })
			verify(result.cancelModel?.addRecipient(RecipientField.BCC, otherAddress2), { times: 1 })
			verify(result.inviteModel?.addRecipient(RecipientField.BCC, otherAddress), { times: 1 })
			o(sendModels.length).equals(0)
			o(result.attendees.length).equals(3)("all the attendees are there")
		})
		o("adding attendees on new event correctly creates invite model", function () {
			const sendModels: Array<SendMailModel> = [object()]
			const userController = makeUserController([], AccountType.PAID)
			const existingEvent = createCalendarEvent({
				_ownerGroup: "ownCalendar",
				startTime: new Date(2020, 5, 1),
				endTime: new Date(2020, 5, 2),
				organizer: ownerAddress,
				attendees: [
					createCalendarEventAttendee({
						status: CalendarAttendeeStatus.NEEDS_ACTION,
						address: ownerAddress,
					}),
					createCalendarEventAttendee({
						status: CalendarAttendeeStatus.NEEDS_ACTION,
						address: otherAddress2,
					}),
				],
			})
			const model = new CalendarEventWhoModel(
				existingEvent,
				EventType.OWN,
				calendars,
				calendars.get("ownCalendar")!,
				userController,
				true,
				ownAddresses,
				recipients,
				passwordStrengthModel,
				() => sendModels.pop()!,
			)
			model.addAttendee(otherAddress.address, createContact({ nickname: otherAddress.name }))
			const result = model.result
			o(result.responseModel).equals(null)
			o(sendModels.length).equals(0)
			o(result.cancelModel).equals(null)
			o(result.updateModel).equals(null)
			verify(result.inviteModel?.addRecipient(RecipientField.BCC, otherAddress), { times: 1 })
			verify(result.inviteModel?.addRecipient(RecipientField.BCC, otherAddress2), { times: 1 })
			o(result.attendees.length).equals(3)("all the attendees are there")
		})
	})
	o.spec("calendar selection", function () {
		o.spec("getAvailableCalendars", function () {
			o("it returns the shared calendars we have write access to when there are no attendees", function () {
				userController.user = createUser({ _id: "ownerId" })
				// add it as a writable calendar so that we see that it's filtered out
				addCapability(userController.user, "sharedCalendar", ShareCapability.Write)
				const model = getNewModel({})
				o(model.getAvailableCalendars()).deepEquals([calendars.get("ownCalendar")!, calendars.get("sharedCalendar")!])
			})

			o("it returns only the calendars we have write access to", function () {
				userController.user = createUser({ _id: "ownerId" })
				// add it as a writable calendar so that we see that it's filtered out
				addCapability(userController.user, "sharedCalendar", ShareCapability.Read)
				const model = getNewModel({})
				o(model.getAvailableCalendars()).deepEquals([calendars.get("ownCalendar")!])
			})

			o("it returns only own calendars after adding attendees to an existing event", function () {
				userController.user = createUser({ _id: "ownerId" })
				// add it as a writable calendar so that we see that it's filtered out
				addCapability(userController.user, "sharedCalendar", ShareCapability.Write)
				const model = getOldModel({})
				model.addAttendee(otherAddress.address)
				o(model.getAvailableCalendars()).deepEquals([calendars.get("ownCalendar")!])
			})

			o("it returns only own calendars for existing own event with attendees ", function () {
				userController.user = createUser({ _id: "ownerId" })
				// add it as a writable calendar so that we see that it's filtered out
				addCapability(userController.user, "sharedCalendar", ShareCapability.Write)
				const model = getOldModel({
					attendees: [createCalendarEventAttendee({ address: otherAddress, status: CalendarAttendeeStatus.NEEDS_ACTION })],
				})
				o(model.getAvailableCalendars()).deepEquals([calendars.get("ownCalendar")!])
			})

			o("it returns only own calendars for invite", function () {
				userController.user = createUser({ _id: "ownerId" })
				// add it as a writable calendar so that we see that it's filtered out
				addCapability(userController.user, "sharedCalendar", ShareCapability.Write)
				const model = getOldInviteModel({})
				o(model.getAvailableCalendars()).deepEquals([calendars.get("ownCalendar")!])
			})

			o("it returns only existing calendar if it's existing shared event with attendees", function () {
				userController.user = createUser({ _id: "ownerId" })
				// add it as a writable calendar so that we see that it's filtered out
				addCapability(userController.user, "sharedCalendar", ShareCapability.Write)
				const model = getOldSharedModel(
					{
						attendees: [createCalendarEventAttendee({ address: otherAddress, status: CalendarAttendeeStatus.NEEDS_ACTION })],
					},
					EventType.LOCKED,
				)
				o(model.getAvailableCalendars()).deepEquals([calendars.get("sharedCalendar")!])
			})
		})

		o("changing the calendar to a shared one while the event has attendees is an error", function () {
			const model = getNewModel({})
			model.addAttendee(otherAddress.address)
			o(model.guests.length).equals(1)
			o(() => (model.selectedCalendar = calendars.get("sharedCalendar")!)).throws(ProgrammingError)
			o(model.selectedCalendar).deepEquals(calendars.get("ownCalendar")!)
		})
	})
	o.spec("invites in own calendar, changing own attendance", function () {
		o("changing own attendance on new event results in responseModel and correct status", async function () {
			const userController = makeUserController([], AccountType.PAID)
			const existingEvent = createCalendarEvent({
				_ownerGroup: "ownCalendar",
				startTime: new Date(2020, 5, 1),
				endTime: new Date(2020, 5, 2),
				organizer: otherAddress,
				attendees: [
					createCalendarEventAttendee({
						status: CalendarAttendeeStatus.DECLINED,
						address: otherAddress,
					}),
					createCalendarEventAttendee({
						status: CalendarAttendeeStatus.NEEDS_ACTION,
						address: ownerAddress,
					}),
					createCalendarEventAttendee({
						status: CalendarAttendeeStatus.NEEDS_ACTION,
						address: otherAddress2,
					}),
				],
			})
			const model = new CalendarEventWhoModel(
				existingEvent,
				EventType.INVITE,
				calendars,
				calendars.get("ownCalendar")!,
				userController,
				true,
				ownAddresses,
				recipients,
				passwordStrengthModel,
				() => sendMailModel,
			)
			model.setOwnAttendance(CalendarAttendeeStatus.ACCEPTED)
			const result = model.result
			verify(result.responseModel?.addRecipient(RecipientField.TO, otherAddress), { times: 1 })
			o(result.attendees.length).equals(3)("all the attendees are still there")
			o(result.attendees[1].status).deepEquals(CalendarAttendeeStatus.ACCEPTED)
			o(result.inviteModel).equals(null)("no invite model")
			o(result.cancelModel).equals(null)("no cancel model")
			o(result.updateModel).equals(null)("no update model")
		})
		o("changing own attendance on existing event results in responseModel and correct status", async function () {
			const userController = makeUserController([], AccountType.PAID)
			const existingEvent = createCalendarEvent({
				_ownerGroup: "ownCalendar",
				startTime: new Date(2020, 5, 1),
				endTime: new Date(2020, 5, 2),
				organizer: otherAddress,
				attendees: [
					createCalendarEventAttendee({
						status: CalendarAttendeeStatus.DECLINED,
						address: otherAddress,
					}),
					createCalendarEventAttendee({
						status: CalendarAttendeeStatus.NEEDS_ACTION,
						address: ownerAddress,
					}),
					createCalendarEventAttendee({
						status: CalendarAttendeeStatus.NEEDS_ACTION,
						address: otherAddress2,
					}),
				],
			})
			const model = new CalendarEventWhoModel(
				existingEvent,
				EventType.INVITE,
				calendars,
				calendars.get("ownCalendar")!,
				userController,
				false,
				ownAddresses,
				recipients,
				passwordStrengthModel,
				() => sendMailModel,
			)
			model.setOwnAttendance(CalendarAttendeeStatus.DECLINED)
			const result = model.result
			verify(result.responseModel?.addRecipient(RecipientField.TO, otherAddress), { times: 1 })
			o(result.attendees.length).equals(3)("all the attendees are still there")
			o(result.attendees[1].status).deepEquals(CalendarAttendeeStatus.DECLINED)
			o(result.inviteModel).equals(null)("no invite model")
			o(result.cancelModel).equals(null)("no cancel model")
			o(result.updateModel).equals(null)("no update model")
		})
	})
})
