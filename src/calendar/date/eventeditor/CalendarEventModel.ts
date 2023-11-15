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

import { AccountType } from "../../../api/common/TutanotaConstants.js"
import {
	CalendarEvent,
	CalendarEventAttendee,
	CalendarRepeatRule,
	createCalendarEvent,
	createEncryptedMailAddress,
	EncryptedMailAddress,
	Mail,
	MailboxProperties,
} from "../../../api/entities/tutanota/TypeRefs.js"
import { AlarmInfo, DateWrapper, User } from "../../../api/entities/sys/TypeRefs.js"
import { MailboxDetail } from "../../../mail/model/MailModel.js"
import {
	AlarmInterval,
	CalendarEventValidity,
	checkEventValidity,
	DefaultDateProvider,
	getEventType,
	getTimeZone,
	incrementSequence,
	parseAlarmInterval,
} from "../CalendarUtils.js"
import { arrayEqualsWithPredicate, assertNonNull, assertNotNull, getFirstOrThrow, identity, lazy, Require } from "@tutao/tutanota-utils"
import { cleanMailAddress } from "../../../api/common/utils/CommonCalendarUtils.js"
import { CalendarInfo, CalendarModel } from "../../model/CalendarModel.js"
import { PayloadTooLargeError } from "../../../api/common/error/RestError.js"
import { CalendarNotificationSender } from "../CalendarNotificationSender.js"
import { SendMailModel } from "../../../mail/editor/SendMailModel.js"
import { UserError } from "../../../api/main/UserError.js"
import { EntityClient } from "../../../api/common/EntityClient.js"
import { RecipientsModel } from "../../../api/main/RecipientsModel.js"
import { LoginController } from "../../../api/main/LoginController.js"
import m from "mithril"
import { NoopProgressMonitor } from "../../../api/common/utils/ProgressMonitor.js"
import { PartialRecipient } from "../../../api/common/recipients/Recipient.js"
import { getPasswordStrengthForUser } from "../../../misc/passwords/PasswordUtils.js"
import { CalendarEventWhenModel } from "./CalendarEventWhenModel.js"
import { CalendarEventWhoModel } from "./CalendarEventWhoModel.js"
import { CalendarEventAlarmModel } from "./CalendarEventAlarmModel.js"
import { SanitizedTextViewModel } from "../../../misc/SanitizedTextViewModel.js"
import { getStrippedClone, Stripped } from "../../../api/common/utils/EntityUtils.js"
import { UserController } from "../../../api/main/UserController.js"
import { CalendarNotificationModel, CalendarNotificationSendModels } from "./CalendarNotificationModel.js"
import { CalendarEventApplyStrategies, CalendarEventModelStrategy } from "./CalendarEventModelStrategy.js"
import { ProgrammingError } from "../../../api/common/error/ProgrammingError.js"
import { getDefaultSender } from "../../../mail/model/MailUtils.js"
import { SimpleTextViewModel } from "../../../misc/SimpleTextViewModel.js"

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

export const enum ReadonlyReason {
	/** it's a shared event, so at least the attendees are read-only */
	SHARED,
	/** this edit operation applies to only part of a series, so attendees and calendar are read-only */
	SINGLE_INSTANCE,
	/** we can edit anything here */
	NONE,
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

/**
 * which parts of a calendar event series to apply an edit operation to.
 * consumers must take care to only use appropriate values for the operation
 * in question (ie removing a repeat rule from a single event in a series is nonsensical)
 */
export const enum CalendarOperation {
	/** create a new event */
	Create,
	/** only apply an edit to only one particular instance of the series */
	EditThis,
	/** Delete a single instance from a series, altered or not */
	DeleteThis,
	/** apply the edit operation to all instances of the series*/
	EditAll,
	/** delete the whole series */
	DeleteAll,
}

/**
 * get the models enabling consistent calendar event updates.
 */
export async function makeCalendarEventModel(
	operation: CalendarOperation,
	initialValues: Partial<CalendarEvent>,
	recipientsModel: RecipientsModel,
	calendarModel: CalendarModel,
	logins: LoginController,
	mailboxDetail: MailboxDetail,
	mailboxProperties: MailboxProperties,
	sendMailModelFactory: lazy<SendMailModel>,
	notificationSender: CalendarNotificationSender,
	entityClient: EntityClient,
	responseTo: Mail | null,
	zone: string = getTimeZone(),
	showProgress: ShowProgressCallback = identity,
	uiUpdateCallback: () => void = m.redraw,
): Promise<CalendarEventModel | null> {
	const { htmlSanitizer } = await import("../../../misc/HtmlSanitizer.js")
	const ownMailAddresses = getOwnMailAddressesWithDefaultSenderInFront(logins, mailboxDetail, mailboxProperties)
	if (operation === CalendarOperation.DeleteAll || operation === CalendarOperation.EditAll) {
		assertNonNull(initialValues.uid, "tried to edit/delete all with nonexistent uid")
		const index = await calendarModel.getEventsByUid(initialValues.uid)
		if (index != null && index.progenitor != null) {
			initialValues = index.progenitor
		}
	}
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

	const makeEditModels = (initializationEvent: CalendarEvent) => ({
		whenModel: new CalendarEventWhenModel(initializationEvent, zone, uiUpdateCallback),
		whoModel: new CalendarEventWhoModel(
			initializationEvent,
			eventType,
			operation,
			calendars,
			selectedCalendar,
			logins.getUserController(),
			operation === CalendarOperation.Create,
			ownMailAddresses,
			recipientsModel,
			responseTo,
			getPasswordStrength,
			sendMailModelFactory,
			uiUpdateCallback,
		),
		alarmModel: new CalendarEventAlarmModel(eventType, alarms, new DefaultDateProvider(), uiUpdateCallback),
		location: new SimpleTextViewModel(initializationEvent.location, uiUpdateCallback),
		summary: new SimpleTextViewModel(initializationEvent.summary, uiUpdateCallback),
		description: new SanitizedTextViewModel(initializationEvent.description, htmlSanitizer, uiUpdateCallback),
	})

	const recurrenceIds = async (uid?: string) =>
		uid == null ? [] : (await calendarModel.getEventsByUid(uid))?.alteredInstances.map((i) => i.recurrenceId) ?? []
	const notificationModel = new CalendarNotificationModel(notificationSender, logins)
	const applyStrategies = new CalendarEventApplyStrategies(calendarModel, logins, notificationModel, recurrenceIds, showProgress, zone)
	const progenitor = () => calendarModel.resolveCalendarEventProgenitor(cleanInitialValues)
	const strategy = await selectStrategy(makeEditModels, applyStrategies, operation, progenitor, createCalendarEvent(initialValues), cleanInitialValues)
	return strategy && new CalendarEventModel(strategy, eventType, operation, logins.getUserController(), notificationSender, entityClient, calendars)
}

async function selectStrategy(
	makeEditModels: (i: CalendarEvent) => CalendarEventEditModels,
	applyStrategies: CalendarEventApplyStrategies,
	operation: CalendarOperation,
	resolveProgenitor: () => Promise<CalendarEvent | null>,
	existingInstanceIdentity: CalendarEvent,
	cleanInitialValues: CalendarEvent,
): Promise<CalendarEventModelStrategy | null> {
	let editModels: CalendarEventEditModels
	let apply: () => Promise<void>
	let mayRequireSendingUpdates: () => boolean
	if (operation === CalendarOperation.Create) {
		editModels = makeEditModels(cleanInitialValues)
		apply = () => applyStrategies.saveNewEvent(editModels)
		mayRequireSendingUpdates = () => true
	} else if (operation === CalendarOperation.EditThis) {
		cleanInitialValues.repeatRule = null
		if (cleanInitialValues.recurrenceId == null) {
			const progenitor = await resolveProgenitor()
			if (progenitor == null || progenitor.repeatRule == null) {
				console.warn("no repeating progenitor during EditThis operation?")
				return null
			}
			apply = () =>
				applyStrategies.saveNewAlteredInstance({
					editModels: editModels,
					editModelsForProgenitor: makeEditModels(progenitor),
					existingInstance: existingInstanceIdentity,
					progenitor: progenitor,
				})
			mayRequireSendingUpdates = () => true
			editModels = makeEditModels(cleanInitialValues)
		} else {
			editModels = makeEditModels(cleanInitialValues)
			apply = () => applyStrategies.saveExistingAlteredInstance(editModels, existingInstanceIdentity)
			mayRequireSendingUpdates = () => assembleEditResultAndAssignFromExisting(existingInstanceIdentity, editModels, operation).hasUpdateWorthyChanges
		}
	} else if (operation === CalendarOperation.DeleteThis) {
		if (cleanInitialValues.recurrenceId == null) {
			const progenitor = await resolveProgenitor()
			if (progenitor == null) {
				return null
			}
			editModels = makeEditModels(progenitor)
			apply = () => applyStrategies.excludeSingleInstance(editModels, existingInstanceIdentity, progenitor)
			mayRequireSendingUpdates = () => true
		} else {
			editModels = makeEditModels(cleanInitialValues)
			apply = () => applyStrategies.deleteAlteredInstance(editModels, existingInstanceIdentity)
			mayRequireSendingUpdates = () => true
		}
	} else if (operation === CalendarOperation.EditAll) {
		const progenitor = await resolveProgenitor()
		if (progenitor == null) {
			return null
		}
		editModels = makeEditModels(cleanInitialValues)
		apply = () => applyStrategies.saveEntireExistingEvent(editModels, progenitor)
		mayRequireSendingUpdates = () => assembleEditResultAndAssignFromExisting(existingInstanceIdentity, editModels, operation).hasUpdateWorthyChanges
	} else if (operation === CalendarOperation.DeleteAll) {
		editModels = makeEditModels(cleanInitialValues)
		apply = () => applyStrategies.deleteEntireExistingEvent(editModels, existingInstanceIdentity)
		mayRequireSendingUpdates = () => assembleEditResultAndAssignFromExisting(existingInstanceIdentity, editModels, operation).hasUpdateWorthyChanges
	} else {
		throw new ProgrammingError(`unknown calendar operation: ${operation}`)
	}

	return { apply, mayRequireSendingUpdates, editModels }
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

	get editModels(): CalendarEventEditModels {
		return this.strategy.editModels
	}

	constructor(
		private readonly strategy: CalendarEventModelStrategy,
		public readonly eventType: EventType,
		public readonly operation: CalendarOperation,
		// UserController already keeps track of user updates, it is better to not have our own reference to the user, we might miss
		// important updates like premium upgrade
		readonly userController: UserController,
		private readonly distributor: CalendarNotificationSender,
		private readonly entityClient: EntityClient,
		private readonly calendars: ReadonlyMap<Id, CalendarInfo>,
	) {
		this.calendars = calendars
	}

	async apply(): Promise<EventSaveResult> {
		if (this.userController.user.accountType === AccountType.EXTERNAL) {
			console.log("did not apply event changes, we're an external user.")
			return EventSaveResult.Failed
		}
		if (this.processing) {
			return EventSaveResult.Failed
		}
		this.processing = true

		try {
			await this.strategy.apply()
			return EventSaveResult.Saved
		} catch (e) {
			if (e instanceof PayloadTooLargeError) {
				throw new UserError("requestTooLarge_msg")
			} else {
				throw e
			}
		} finally {
			this.processing = false
		}
	}

	/** false if the event is only partially or not at all writable */
	isFullyWritable(): boolean {
		return this.eventType === EventType.OWN || this.eventType === EventType.SHARED_RW
	}

	/** some edit operations apply to the whole event series.
	 * they are not possible if the operation the model was created with only applies to a single instance.
	 *
	 * returns true if such operations can be attempted.
	 * */
	canEditSeries(): boolean {
		return this.operation !== CalendarOperation.EditThis && (this.eventType === EventType.OWN || this.eventType === EventType.SHARED_RW)
	}

	isAskingForUpdatesNeeded(): boolean {
		return (
			this.eventType === EventType.OWN &&
			!this.editModels.whoModel.shouldSendUpdates &&
			this.editModels.whoModel.initiallyHadOtherAttendees &&
			this.strategy.mayRequireSendingUpdates()
		)
	}

	getReadonlyReason(): ReadonlyReason {
		if (this.isFullyWritable() && this.canEditSeries() && this.editModels.whoModel.canModifyGuests) return ReadonlyReason.NONE
		// fully writable and !canModifyGuests happens on shared calendars
		if (!this.editModels.whoModel.canModifyGuests && this.canEditSeries()) return ReadonlyReason.SHARED
		return ReadonlyReason.SINGLE_INSTANCE
	}
}

/**
 *
 * @param now the new event.
 * @param previous the event as it originally was
 * @returns {boolean} true if changes were made to the event that justify sending updates to attendees.
 * exported for testing
 */
export function eventHasChanged(now: CalendarEvent, previous: Partial<CalendarEvent> | null): boolean {
	if (previous == null) return true
	// we do not check for the sequence number (as it should be changed with every update) or the default instance properties such as _id
	return (
		now.startTime.getTime() !== previous?.startTime?.getTime() ||
		now.description !== previous?.description ||
		now.summary !== previous.summary ||
		now.location !== previous.location ||
		now.endTime.getTime() !== previous?.endTime?.getTime() ||
		now.invitedConfidentially !== previous.invitedConfidentially ||
		// should this be a hard error, we never want to change the uid or compare events with different UIDs?
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

export function areRepeatRulesEqual(r1: CalendarRepeatRule | null, r2: CalendarRepeatRule | null): boolean {
	return (
		r1 === r2 ||
		(r1?.endType === r2?.endType &&
			r1?.endValue === r2?.endValue &&
			r1?.frequency === r2?.frequency &&
			r1?.interval === r2?.interval &&
			/** r1?.timeZone === r2?.timeZone && we're ignoring time zone because it's not an observable change. */
			areExcludedDatesEqual(r1?.excludedDates ?? [], r2?.excludedDates ?? []))
	)
}

/**
 * compare two lists of dates that are sorted from earliest to latest. return true if they are equivalent.
 */
export function areExcludedDatesEqual(e1: ReadonlyArray<DateWrapper>, e2: ReadonlyArray<DateWrapper>): boolean {
	if (e1.length !== e2.length) return false
	return e1.every(({ date }, i) => e2[i].date.getTime() === date.getTime())
}

export function assertEventValidity(event: CalendarEvent) {
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
export function assembleCalendarEventEditResult(models: CalendarEventEditModels): {
	eventValues: CalendarEventValues
	newAlarms: ReadonlyArray<AlarmInfo>
	sendModels: CalendarNotificationSendModels
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

/** assemble the edit result from an existing event edit operation and apply some fields from the original event
 * @param existingEvent the event we will be updating and take id, ownerGroup and permissions from as well as the uid, sequence to increment and recurrenceId
 * @param editModels the editModels providing the values for the new event.
 * @param operation determines the source of the recurrenceId - in the case of EditThis it's the start time of the original event, otherwise existingEvents' recurrenceId is used.
 */
export function assembleEditResultAndAssignFromExisting(existingEvent: CalendarEvent, editModels: CalendarEventEditModels, operation: CalendarOperation) {
	const assembleResult = assembleCalendarEventEditResult(editModels)
	const { uid: oldUid, sequence: oldSequence, recurrenceId } = existingEvent
	const newEvent = assignEventIdentity(assembleResult.eventValues, {
		uid: oldUid!,
		sequence: incrementSequence(oldSequence),
		recurrenceId: operation === CalendarOperation.EditThis && recurrenceId == null ? existingEvent.startTime : recurrenceId,
	})

	assertEventValidity(newEvent)

	newEvent._id = existingEvent._id
	newEvent._ownerGroup = existingEvent._ownerGroup
	newEvent._permissions = existingEvent._permissions

	return {
		hasUpdateWorthyChanges: eventHasChanged(newEvent, existingEvent),
		newEvent,
		calendar: assembleResult.calendar,
		newAlarms: assembleResult.newAlarms,
		sendModels: assembleResult.sendModels,
	}
}

/**
 * combine event values with the fields required to identify a particular instance of the event.
 * @param values
 * @param identity sequence (default "0") and recurrenceId (default null) are optional, but the uid must be specified.
 */
export function assignEventIdentity(values: CalendarEventValues, identity: Require<"uid", Partial<CalendarEventIdentity>>): CalendarEvent {
	return createCalendarEvent({
		...values,
		sequence: "0",
		...identity,
	})
}

async function resolveAlarmsForEvent(alarms: CalendarEvent["alarmInfos"], calendarModel: CalendarModel, user: User): Promise<Array<AlarmInterval>> {
	const alarmInfos = await calendarModel.loadAlarms(alarms, user)
	return alarmInfos.map(({ alarmInfo }) => parseAlarmInterval(alarmInfo.trigger))
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
export type ShowProgressCallback = <T>(input: Promise<T>) => Promise<T>

/** exported for testing */
export type CalendarEventEditModels = {
	whenModel: CalendarEventWhenModel
	whoModel: CalendarEventWhoModel
	alarmModel: CalendarEventAlarmModel
	location: SimpleTextViewModel
	summary: SimpleTextViewModel
	description: SanitizedTextViewModel
}

/** the fields that together with the start time point to a specific version and instance of an event */
type EventIdentityFieldNames = "uid" | "sequence" | "recurrenceId"

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

/** get the list of mail addresses that are enabled for this mailbox with the configured sender names
 * will put the sender that matches the default sender address in the first spot. this enables us to use
 * it as an easy default without having to pass it around separately */
function getOwnMailAddressesWithDefaultSenderInFront(
	logins: LoginController,
	mailboxDetail: MailboxDetail,
	mailboxProperties: MailboxProperties,
): Array<EncryptedMailAddress> {
	const defaultSender = getDefaultSender(logins, mailboxDetail)
	const ownMailAddresses = mailboxProperties.mailAddressProperties.map(({ mailAddress, senderName }) =>
		createEncryptedMailAddress({
			address: mailAddress,
			name: senderName,
		}),
	)
	const defaultIndex = ownMailAddresses.findIndex((address) => address.address === defaultSender)
	if (defaultIndex < 0) {
		// should not happen
		return ownMailAddresses
	}
	const defaultEncryptedMailAddress = ownMailAddresses.splice(defaultIndex, 1)
	return [...defaultEncryptedMailAddress, ...ownMailAddresses]
}
