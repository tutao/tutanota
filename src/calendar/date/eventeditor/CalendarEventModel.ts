/**
 * This file contains the most important functions and classes to determine the event type, the organizer of the event and possible
 * organizers in accordance with the capabilities for events (see table).
 *
 * The most important restriction is that it is impossible to change the guest list or send updates to attendees on events in
 * calendars you do not own, which means that the event has no organizer (guest list is empty) or that the event has guests
 * and therefore also an organizer that's not us.
 *
 * Capability for events is fairly complicated:
 * Note: "shared" calendar means "not owner of the calendar". Calendar always looks like personal for the owner.
 * Note: "has attendees" applies to events for which invites were already sent. while editing and adding attendees, "no attendees" applies.
 * Note: the only organizer that an event can have is the owner of the calendar the event is defined in.
 *
 * | Event State			                         || Possible operations
 * | calendar access  | event origin | has attendees || edit details  | edit own attendance | modify attendees | add alarms |
 * |------------------+--------------+---------------++---------------+---------------------+------------------|------------|
 * | own              | calendar     | no            || yes           | n/a                 | yes              | yes        |
 * | own              | invite       | no            || n/a           | n/a                 | n/a              | yes        |
 * | shared rw        | calendar     | no            || yes           | n/a                 | no               | yes        |
 * | shared rw        | invite       | no            || n/a           | n/a                 | n/a              | yes        |
 * | shared ro        | any          | no            || no            | n/a                 | no               | no         |
 * |------------------+--------------+---------------++---------------+---------------------+------------------|------------|
 * | own              | calendar     | yes           || yes           | yes                 | yes              | yes        |
 * | own              | invite       | yes           || no            | yes                 | no               | yes        |
 * | shared rw        | any          | yes           || no            | no                  | no               | yes        |
 * | shared ro        | any          | yes           || no            | no                  | no               | no         |
 *
 * The fairly complicated event edit operation is split into several submodels that are stored on the CalendarEventModel.editModels field.
 * They roughly correspond to the questions of
 * * when and how often the event happens (see CalendarEventWhenModel.ts)
 * * who participates and has access to the event (see CalendarEventWhoModel.ts)
 * * the alarms the current user set for the event (CalendarEventAlarmModel.ts)
 * * what the event is about (description, summary)
 * * where the event takes place (location)
 *
 * These are in descending order of complexity, the last two points are essentially just (rich)text fields.
 *
 * The general flow for editing an event is as follows:
 * * call makeCalendarEventModel (probably via the locator). The most important decision here is what EventType we are dealing with.
 * * edit the properties that need to be edited
 * * call "saveNewEvent" or "updateExistingEvent" on the CalendarEventModel. internally, this means:
 *   * the model takes the contents of the editModels field and uses them to assemble the result of the edit operation
 *   * the event identity is assigned
 *   * notify the attendees that the CalendarEventWhoModel determined need to be notified
 *   * save the event and its alarms to the server
 *
 * While it's possible to call the save operation multiple times, the intention is to use a new model for each edit operation.
 *
 * Future improvements: CalendarEventModel should probably be several classes with a generic "save" and "editModels" interface instead
 * of being capable of doing whatever and being controlled by the caller.
 *     * invite: save sends update to organizer, then saves (if it's in own calendar)
 *     * new event: save notifies attendees, saves the event as new.
 *     * existing event: updates/invites/cancels attendees, then updates.
 *     * etc.
 */

import { AccountType, AlarmInterval, AvailablePlanType, CalendarAttendeeStatus, FeatureType } from "../../../api/common/TutanotaConstants.js"
import {
	CalendarEvent,
	CalendarEventAttendee,
	createCalendarEvent,
	createEncryptedMailAddress,
	Mail,
	MailboxProperties,
} from "../../../api/entities/tutanota/TypeRefs.js"
import { AlarmInfo, PlanConfiguration, User } from "../../../api/entities/sys/TypeRefs.js"
import { MailboxDetail } from "../../../mail/model/MailModel.js"
import { CalendarEventValidity, checkEventValidity, DefaultDateProvider, generateUid, getEventType, getTimeZone, incrementSequence } from "../CalendarUtils.js"
import { isCustomizationEnabledForCustomer } from "../../../api/common/utils/Utils.js"
import { arrayEqualsWithPredicate, assertNotNull, clone, getFirstOrThrow, identity, lazy } from "@tutao/tutanota-utils"
import { cleanMailAddress, findAttendeeInAddresses } from "../../../api/common/utils/CommonCalendarUtils.js"
import { CalendarInfo, CalendarModel } from "../../model/CalendarModel.js"
import { PayloadTooLargeError, TooManyRequestsError } from "../../../api/common/error/RestError.js"
import { CalendarUpdateDistributor } from "../CalendarUpdateDistributor.js"
import { SendMailModel } from "../../../mail/editor/SendMailModel.js"
import { UserError } from "../../../api/main/UserError.js"
import { EntityClient } from "../../../api/common/EntityClient.js"
import { ProgrammingError } from "../../../api/common/error/ProgrammingError.js"
import { Require } from "@tutao/tutanota-utils/dist/Utils.js"
import { RecipientsModel } from "../../../api/main/RecipientsModel.js"
import { LoginController } from "../../../api/main/LoginController.js"
import m from "mithril"
import { NoopProgressMonitor } from "../../../api/common/utils/ProgressMonitor.js"
import { PartialRecipient } from "../../../api/common/recipients/Recipient.js"
import { getPasswordStrengthForUser } from "../../../misc/passwords/PasswordUtils.js"
import { areRepeatRulesEqual, CalendarEventWhenModel } from "./CalendarEventWhenModel.js"
import { CalendarEventWhoModel } from "./CalendarEventWhoModel.js"
import { CalendarEventAlarmModel } from "./CalendarEventAlarmModel.js"
import { SanitizedTextViewModel } from "../../../misc/SanitizedTextViewModel.js"
import { getStrippedClone, Stripped } from "../../../api/common/utils/EntityUtils.js"
import { UserController } from "../../../api/main/UserController.js"
import { UpgradeRequiredError } from "../../../api/main/UpgradeRequiredError.js"
import { IServiceExecutor } from "../../../api/common/ServiceRequest.js"
import { getAvailableMatchingPlans } from "../../../misc/SubscriptionDialogs.js"

/** the type of the event determines which edit operations are available to us. */
export const enum EventType {
	/** event in our own calendar and we are organizer */
	OWN = "own",
	/** event in shared calendar with read permission */
	SHARED_RO = "shared_ro",
	/** event in shared calendar with write permission, that has no attendees */
	SHARED_RW = "shared_rw",
	/** shared with write permissions, but we can't edit anything but alarms because it has attendees. might be something the calendar owner was invited to. */
	LOCKED = "locked",
	/** invite from calendar invitation which is not stored in calendar yet, or event stored in **own calendar** and we are not organizer. */
	INVITE = "invite",
	/** we are an external user and see an event in our mailbox */
	EXTERNAL = "external",
}

/**
 * complete calendar event except the parts that define the identity of the event instance (in ical terms) and the technical fields.
 * when the excluded fields are added, this type can be used to set up a series, update a series or reschedule an instance of a series
 * hashedUid is excluded separately since it's not really relevant to the client's logic.
 */
export type CalendarEventValues = Omit<Stripped<CalendarEvent>, EventIdentityFieldNames | "hashedUid">

/**
 * the parts of a calendar event that define the identity of the event instance.
 */
export type CalendarEventIdentity = Pick<Stripped<CalendarEvent>, EventIdentityFieldNames>

/** all the people that may be interested in changes to an event get stored in these models.
 * if one of them is null, it's because there is no one that needs that kind of update.
 * */
export type CalendarEventUpdateNotificationModels = {
	inviteModel: SendMailModel | null
	updateModel: SendMailModel | null
	cancelModel: SendMailModel | null
	responseModel: SendMailModel | null
}

/**
 * get the models enabling consistent calendar event updates.
 */
export async function makeCalendarEventModel(
	initialValues: Partial<CalendarEvent>,
	recipientsModel: RecipientsModel,
	calendarModel: CalendarModel,
	logins: LoginController,
	mailboxDetail: MailboxDetail,
	mailboxProperties: MailboxProperties,
	sendMailModelFactory: lazy<SendMailModel>,
	distributor: CalendarUpdateDistributor,
	entityClient: EntityClient,
	responseTo: Mail | null,
	serviceExecutor: IServiceExecutor,
	zone: string = getTimeZone(),
	showProgress: ShowProgressCallback = identity,
	uiUpdateCallback: () => void = m.redraw,
): Promise<CalendarEventModel> {
	const { htmlSanitizer } = await import("../../../misc/HtmlSanitizer.js")
	const ownMailAddresses = mailboxProperties.mailAddressProperties.map(({ mailAddress, senderName }) =>
		createEncryptedMailAddress({
			address: mailAddress,
			name: senderName,
		}),
	)
	const isNew = initialValues._ownerGroup == null
	const cleanInitialValues = cleanupInitialValuesForEditing(initialValues)
	const user = logins.getUserController().user
	const [alarms, calendars] = await Promise.all([
		resolveAlarmsForEvent(initialValues.alarmInfos ?? [], calendarModel, user),
		calendarModel.loadCalendarInfos(new NoopProgressMonitor()),
	])
	const selectedCalendar = getPreselectedCalendar(calendars, initialValues)
	const getPasswordStrength = (password: string, recipientInfo: PartialRecipient) =>
		getPasswordStrengthForUser(password, recipientInfo, mailboxDetail, logins)

	const eventType = getEventType(
		initialValues,
		calendars,
		ownMailAddresses.map(({ address }) => address),
		user,
	)

	const editModels = {
		whenModel: new CalendarEventWhenModel(cleanInitialValues, zone, uiUpdateCallback),
		whoModel: new CalendarEventWhoModel(
			cleanInitialValues,
			eventType,
			calendars,
			selectedCalendar,
			logins.getUserController(),
			isNew,
			ownMailAddresses,
			recipientsModel,
			getPasswordStrength,
			sendMailModelFactory,
			uiUpdateCallback,
		),
		alarmModel: new CalendarEventAlarmModel(eventType, alarms, new DefaultDateProvider(), uiUpdateCallback),
		location: new SanitizedTextViewModel(cleanInitialValues.location, htmlSanitizer, uiUpdateCallback),
		summary: new SanitizedTextViewModel(cleanInitialValues.summary, htmlSanitizer, uiUpdateCallback),
		description: new SanitizedTextViewModel(cleanInitialValues.description, htmlSanitizer, uiUpdateCallback),
	}

	return new CalendarEventModel(
		/** in this case, we only want to give the existing event if it actually exists on the server. */
		initialValues._ownerGroup != null ? createCalendarEvent(initialValues) : null,
		eventType,
		editModels,
		logins.getUserController(),
		distributor,
		calendarModel,
		entityClient,
		calendars,
		zone,
		responseTo,
		serviceExecutor,
		showProgress,
	)
}

/** return all the attendees in the list of attendees that are not the given organizer. */
export function getNonOrganizerAttendees({
	organizer,
	attendees,
}: Partial<Pick<Readonly<CalendarEvent>, "attendees" | "organizer">>): ReadonlyArray<CalendarEventAttendee> {
	if (attendees == null) return []
	if (organizer == null) return attendees
	const organizerAddress = cleanMailAddress(organizer.address)
	return attendees.filter((a) => cleanMailAddress(a.address.address) !== organizerAddress) ?? []
}

/**
 * Determines the event type, the organizer of the event and possible organizers in accordance with the capabilities for events (see table).
 */
export class CalendarEventModel {
	processing: boolean = false

	/**
	 * whether this user will send updates for this event.
	 * * this needs to be our event.
	 * * we need a paid account
	 * * there need to be changes that require updating the attendees (eg alarms do not)
	 * * there also need to be attendees that require updates/invites/cancellations/response
	 */
	shouldSendUpdates: boolean = false
	canUseInvites: boolean = false
	hasPremiumLegacy: boolean = false
	readonly initialized: Promise<CalendarEventModel>
	private readonly sequence: string

	constructor(
		private readonly existingEvent: Readonly<CalendarEvent> | null,
		public readonly eventType: EventType,
		public readonly editModels: CalendarEventEditModels,
		// UserController already keeps track of user updates, it is better to not have our own reference to the user, we might miss
		// important updates like premium upgrade
		readonly userController: UserController,
		private readonly distributor: CalendarUpdateDistributor,
		private readonly calendarModel: CalendarModel,
		private readonly entityClient: EntityClient,
		private readonly calendars: ReadonlyMap<Id, CalendarInfo>,
		private readonly zone: string,
		private readonly responseTo: Mail | null,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly showProgress: ShowProgressCallback = identity,
	) {
		this.calendars = calendars
		this.sequence = existingEvent?.sequence ?? "0"
		this.initialized = this.updateCustomerFeatures()
	}

	private async updateCustomerFeatures(): Promise<CalendarEventModel> {
		if (this.userController.isInternalUser()) {
			const customer = await this.userController.loadCustomer()
			this.canUseInvites = isCustomizationEnabledForCustomer(customer, FeatureType.BusinessFeatureEnabled) || (await this.userController.isNewPaidPlan())
			this.hasPremiumLegacy = isCustomizationEnabledForCustomer(customer, FeatureType.PremiumLegacy)
		} else {
			this.canUseInvites = false
			this.hasPremiumLegacy = false
		}

		return this
	}

	shouldShowSendInviteNotAvailable(): boolean {
		if (this.userController.user.accountType === AccountType.FREE) {
			return true
		}

		if (this.userController.user.accountType === AccountType.EXTERNAL) {
			return false
		}

		return !this.canUseInvites && !this.hasPremiumLegacy
	}

	/**
	 * save a new event to the selected calendar, invite all attendees except for the organizer and set up alarms.
	 */
	async saveNewEvent(): Promise<EventSaveResult> {
		let result = EventSaveResult.Failed
		await this.initialized

		const { eventValues, newAlarms, sendModels, calendar } = assembleCalendarEventEditResult(this.editModels)
		const { inviteModel } = sendModels
		const uid = generateUid(calendar.group._id, Date.now())
		const newEvent = assignEventIdentity(eventValues, { uid })

		assertEventValidity(newEvent)
		if (this.processing) {
			return result
		}
		this.processing = true
		try {
			result = await this.showProgress(
				(async () => {
					if (inviteModel != null) await this.sendInvites(newEvent, inviteModel)
					return await this.saveEvent(newEvent, calendar, newAlarms)
				})(),
			)
		} catch (e) {
			if (e instanceof PayloadTooLargeError) {
				throw new UserError("requestTooLarge_msg")
			} else {
				throw e
			}
		} finally {
			this.processing = false
		}

		return result
	}

	async deleteEvent(): Promise<EventSaveResult> {
		const event = assertNotNull(this.existingEvent, "tried to delete non-existing event")
		const { sendModels } = assembleCalendarEventEditResult(this.editModels)
		const { updateModel } = sendModels
		if (updateModel) {
			await this.distributor.sendCancellation(event, updateModel)
		}
		await this.calendarModel.deleteEvent(event)
		return EventSaveResult.Saved
	}

	/**
	 * update the whole event by completely deleting the old event, writing the new one,
	 * updating/inviting/cancelling any attendees where that is necessary.
	 */
	async updateExistingEvent(): Promise<EventSaveResult> {
		await this.initialized
		if (this.processing) {
			return EventSaveResult.Failed
		}
		this.processing = true

		const { newEvent, calendar, newAlarms, sendModels } = await this.assembleEditResult()
		const { responseModel, inviteModel, updateModel, cancelModel } = sendModels

		try {
			if (this.eventType === EventType.OWN) {
				// It is our own event. We might need to send out invites/cancellations/updates
				return await this.showProgress(
					(async () => {
						await this.sendNotifications(newEvent, { inviteModel, updateModel, cancelModel })
						return await this.saveEvent(newEvent, calendar, newAlarms)
					})(),
				)
			} else if (this.eventType === EventType.INVITE && responseModel != null) {
				// We have been invited by another person (internal/unsecure external)
				return await this.showProgress(
					(async () => {
						await this.respondToOrganizer(newEvent, responseModel)
						return await this.saveEvent(newEvent, calendar, newAlarms)
					})(),
				)
			} else {
				// Either this is an event in a shared calendar. We cannot send anything because it's not our event.
				// Or no changes were made that require sending updates and we just save other changes.
				return await this.showProgress(this.saveEvent(newEvent, calendar, newAlarms))
			}
		} catch (e) {
			if (e instanceof PayloadTooLargeError) {
				throw new UserError("requestTooLarge_msg")
			}
			throw e
		} finally {
			this.processing = false
		}
	}

	private async sendCancellation(event: CalendarEvent, cancelModel: SendMailModel): Promise<any> {
		const updatedEvent = clone(event)

		// This is guaranteed to be our own event.
		updatedEvent.sequence = incrementSequence(this.sequence, true)

		try {
			await this.distributor.sendCancellation(updatedEvent, cancelModel)
		} catch (e) {
			if (e instanceof TooManyRequestsError) {
				throw new UserError("mailAddressDelay_msg") // This will be caught and open error dialog
			} else {
				throw e
			}
		}
	}

	private async saveEvent(eventToSave: CalendarEvent, calendar: CalendarInfo, newAlarms: ReadonlyArray<AlarmInfo>): Promise<EventSaveResult> {
		if (this.userController.user.accountType === AccountType.EXTERNAL) {
			console.log("did not save event, we're an external user.")
			return Promise.resolve(EventSaveResult.Failed)
		}
		const { groupRoot } = calendar

		if (eventToSave._id == null) {
			await this.calendarModel.createEvent(eventToSave, newAlarms, this.zone, groupRoot)
		} else {
			await this.calendarModel.updateEvent(
				eventToSave,
				newAlarms,
				this.zone,
				groupRoot,
				assertNotNull(this.existingEvent, "tried to update non-existing event."),
			)
		}
		return EventSaveResult.Saved
	}

	/**
	 * send all notifications required for the new event. will always send cancellations and invites, but will skip updates
	 * if this.shouldSendUpdates is false.
	 *
	 * will modify the attendee list of newEvent if invites/cancellations are sent.
	 */
	async sendNotifications(
		newEvent: CalendarEvent,
		models: {
			inviteModel: SendMailModel | null
			updateModel: SendMailModel | null
			cancelModel: SendMailModel | null
		},
	): Promise<void> {
		if (models.updateModel == null && models.cancelModel == null && models.inviteModel == null) {
			return
		}
		if (this.shouldShowSendInviteNotAvailable()) {
			throw new UpgradeRequiredError("businessFeatureRequiredInvite_msg", await this.getPlansWithEventInvites())
		}
		const invitePromise = models.inviteModel != null ? this.sendInvites(newEvent, models.inviteModel) : Promise.resolve()
		const cancelPromise = models.cancelModel != null ? this.sendCancellation(newEvent, models.cancelModel) : Promise.resolve()
		const updatePromise = models.updateModel != null && this.shouldSendUpdates ? this.sendUpdates(newEvent, models.updateModel) : Promise.resolve()
		return await Promise.all([invitePromise, cancelPromise, updatePromise]).then()
	}

	async getPlansWithEventInvites(): Promise<AvailablePlanType[]> {
		return await getAvailableMatchingPlans(this.serviceExecutor, (config: PlanConfiguration) => config.business)
	}

	/**
	 * invite all new attendees for an event and set their status from "ADDED" to "NEEDS_ACTION"
	 * @param event will be modified if invites are sent.
	 * @param inviteModel
	 * @private
	 */
	private async sendInvites(event: CalendarEvent, inviteModel: SendMailModel): Promise<void> {
		if (event.organizer == null || inviteModel?.allRecipients().length === 0) {
			throw new ProgrammingError("event has no organizer or no invitable attendees, can't send invites.")
		}
		const newAttendees = getNonOrganizerAttendees(event).filter((a) => a.status === CalendarAttendeeStatus.ADDED)
		await inviteModel.waitForResolvedRecipients()
		await this.distributor.sendInvite(event, inviteModel)
		for (const attendee of newAttendees) {
			if (attendee.status === CalendarAttendeeStatus.ADDED) {
				attendee.status = CalendarAttendeeStatus.NEEDS_ACTION
			}
		}
	}

	private async sendUpdates(event: CalendarEvent, updateModel: SendMailModel): Promise<void> {
		await updateModel.waitForResolvedRecipients()
		await this.distributor.sendUpdate(event, updateModel)
	}

	/**
	 * send a response mail to the organizer as stated on the original event. calling this for an event that is not an invite or
	 * does not contain address as an attendee or that has no organizer is an error.
	 * @param newEvent the event to send the update for, this should be identical to existingEvent except for the own status.
	 * @param responseModel
	 * @private
	 */
	private async respondToOrganizer(newEvent: CalendarEvent, responseModel: SendMailModel): Promise<void> {
		if (this.existingEvent?.attendees == null || this.existingEvent.attendees.length === 0 || this.existingEvent.organizer == null) {
			throw new ProgrammingError("trying to send a response to an event that has no attendees or has no organizer")
		}
		if (this.eventType !== EventType.INVITE) {
			throw new ProgrammingError("trying to send a response to an event that is not an invite.")
		}

		const existingOwnAttendee = findAttendeeInAddresses(this.existingEvent.attendees, [responseModel.getSender()])
		const newOwnAttendee = findAttendeeInAddresses(newEvent.attendees, [responseModel.getSender()])
		if (existingOwnAttendee == null || newOwnAttendee == null) {
			throw new ProgrammingError("trying to send a response when the responding address is not in the event attendees")
		}

		if (!(existingOwnAttendee.status !== newOwnAttendee.status && newOwnAttendee.status !== CalendarAttendeeStatus.NEEDS_ACTION)) {
			console.log("got response model to notify organizer, but status did not change")
			return
		}

		await this.showProgress(
			(async () => {
				await responseModel.waitForResolvedRecipients()
				await this.distributor.sendResponse(newEvent, responseModel, this.responseTo)
				responseModel.dispose()
			})(),
		)
	}

	/** check the current state of the edit operation and see if they amount to anything the attendees should be notified of. */
	async hasUpdateWorthyChanges(): Promise<boolean> {
		return (await this.assembleEditResult()).hasUpdateWorthyChanges
	}

	private async assembleEditResult() {
		const assembleResult = assembleCalendarEventEditResult(this.editModels)

		const mayIncrement = this.eventType === EventType.OWN || this.eventType === EventType.SHARED_RW
		const { uid: oldUid, sequence: oldSequence } = assertNotNull(this.existingEvent, "called update existing event on nonexisting event")
		const uid = assertNotNull(oldUid, "called update existing event on event without uid")
		const newEvent = assignEventIdentity(assembleResult.eventValues, {
			uid,
			sequence: incrementSequence(oldSequence, mayIncrement),
		})

		assertEventValidity(newEvent)

		newEvent._id = assertNotNull(this.existingEvent?._id, "no id to update existing event")
		newEvent._ownerGroup = assertNotNull(this.existingEvent?._ownerGroup, "no ownergroup to update existing event")
		newEvent._permissions = assertNotNull(this.existingEvent?._permissions, "no permissions to update existing event")

		return {
			hasUpdateWorthyChanges: eventHasChanged(newEvent, this.existingEvent),
			newEvent,
			calendar: assembleResult.calendar,
			newAlarms: assembleResult.newAlarms,
			sendModels: assembleResult.sendModels,
		}
	}
}

/**
 *
 * @param now the new event.
 * @param previous the event as it originally was
 * @returns {boolean} true if changes were made to the event that justify sending updates to attendees.
 */
function eventHasChanged(now: CalendarEvent, previous: Partial<CalendarEvent> | null): boolean {
	if (previous == null) return true
	// we do not check for the sequence number (as it should be changed with every update) or the default instance properties such as _id
	return (
		now.startTime.getTime() !== previous?.startTime?.getTime() ||
		now.description !== previous.description ||
		now.summary !== previous.summary ||
		now.location !== previous.location ||
		now.endTime.getTime() !== previous?.endTime?.getTime() ||
		now.invitedConfidentially !== previous.invitedConfidentially ||
		now.uid !== previous.uid ||
		!areRepeatRulesEqual(now.repeatRule, previous?.repeatRule ?? null) ||
		!arrayEqualsWithPredicate(
			now.attendees,
			previous?.attendees ?? [],
			(a1, a2) => a1.status === a2.status && cleanMailAddress(a1.address.address) === cleanMailAddress(a2.address.address),
		) || // we ignore the names
		(now.organizer !== previous.organizer && now.organizer?.address !== previous.organizer?.address)
	) // we ignore the names
}

function assertEventValidity(event: CalendarEvent) {
	switch (checkEventValidity(event)) {
		case CalendarEventValidity.InvalidContainsInvalidDate:
			throw new UserError("invalidDate_msg")
		case CalendarEventValidity.InvalidEndBeforeStart:
			throw new UserError("startAfterEnd_label")
		case CalendarEventValidity.InvalidPre1970:
			// shouldn't happen while the check in setStartDate is still there, resetting the date each time
			throw new UserError("pre1970Start_msg")
		case CalendarEventValidity.Valid:
		// event is valid, nothing to do
	}
}

/**
 * construct a usable calendar event from the result of one or more edit operations.
 * returns the new alarms separately so they can be set up
 * on the server before assigning the ids.
 * @param models
 */
function assembleCalendarEventEditResult(models: CalendarEventEditModels): {
	eventValues: CalendarEventValues
	newAlarms: ReadonlyArray<AlarmInfo>
	sendModels: CalendarEventUpdateNotificationModels
	calendar: CalendarInfo
} {
	const whenResult = models.whenModel.result
	const whoResult = models.whoModel.result
	const alarmResult = models.alarmModel.result
	const summary = models.summary.content
	const description = models.description.content
	const location = models.location.content

	return {
		eventValues: {
			// when?
			startTime: whenResult.startTime,
			endTime: whenResult.endTime,
			repeatRule: whenResult.repeatRule,
			// what?
			summary,
			description,
			// where?
			location,
			// who?
			invitedConfidentially: whoResult.isConfidential,
			organizer: whoResult.organizer,
			attendees: whoResult.attendees,
			// fields related to the event instance's identity are excluded.
			// reminders. will be set up separately.
			alarmInfos: [],
		},
		newAlarms: alarmResult.alarms,
		sendModels: whoResult,
		calendar: whoResult.calendar,
	}
}

/**
 * combine event values with the fields required to identify a particular instance of the event.
 * @param values
 * @param identity sequence (default "0") and recurrenceId (default null) are optional, but the uid must be specified.
 */
function assignEventIdentity(values: CalendarEventValues, identity: Require<"uid", Partial<CalendarEventIdentity>>): CalendarEvent {
	return createCalendarEvent({
		...values,
		sequence: "0",
		...identity,
	})
}

async function resolveAlarmsForEvent(alarms: CalendarEvent["alarmInfos"], calendarModel: CalendarModel, user: User): Promise<Array<AlarmInterval>> {
	const alarmInfos = await calendarModel.loadAlarms(alarms, user)
	return alarmInfos.map(({ alarmInfo }) => alarmInfo.trigger as AlarmInterval)
}

function cleanupInitialValuesForEditing(initialValues: Partial<CalendarEvent>): CalendarEvent {
	// the event we got passed may already have some technical fields assigned, so we remove them.
	const stripped = getStrippedClone<CalendarEvent>(initialValues)
	const result = createCalendarEvent(stripped)

	// remove the alarm infos from the result, they don't contain any useful information for the editing operation.
	// selected alarms are returned in the edit result separate from the event.
	result.alarmInfos = []

	return result
}

/** whether to close dialog */
export const enum EventSaveResult {
	Saved,
	Failed,
}

/** generic function that asynchronously returns whatever type the caller passed in, but not necessarily the same promise. */
type ShowProgressCallback = <T>(input: Promise<T>) => Promise<T>

/** exported for testing */
export type CalendarEventEditModels = {
	whenModel: CalendarEventWhenModel
	whoModel: CalendarEventWhoModel
	alarmModel: CalendarEventAlarmModel
	location: SanitizedTextViewModel
	summary: SanitizedTextViewModel
	description: SanitizedTextViewModel
}

/** the fields that together with the start time point to a specific version and instance of an event */
type EventIdentityFieldNames = "uid" | "sequence" // | "recurrenceId"

/**
 * return the calendar the given event belongs to, if any, otherwise get the first one from the given calendars.
 * @param calendars must contain at least one calendar
 * @param event
 */
function getPreselectedCalendar(calendars: ReadonlyMap<Id, CalendarInfo>, event?: Partial<CalendarEvent> | null): CalendarInfo {
	const ownerGroup: string | null = event?._ownerGroup ?? null
	if (ownerGroup == null || !calendars.has(ownerGroup)) {
		return getFirstOrThrow(Array.from(calendars.values()))
	} else {
		return assertNotNull(calendars.get(ownerGroup), "invalid ownergroup for existing event?")
	}
}
