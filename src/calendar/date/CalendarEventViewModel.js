//@flow
import type {CalendarInfo} from "../view/CalendarView"
import type {AlarmIntervalEnum, CalendarAttendeeStatusEnum, EndTypeEnum, RepeatPeriodEnum} from "../../api/common/TutanotaConstants"
import {
	AccountType,
	CalendarAttendeeStatus,
	EndType,
	FeatureType,
	getAttendeeStatus,
	RepeatPeriod,
	ShareCapability,
	TimeFormat
} from "../../api/common/TutanotaConstants"
import {createCalendarEventAttendee} from "../../api/entities/tutanota/CalendarEventAttendee"
import type {CalendarEvent} from "../../api/entities/tutanota/CalendarEvent"
import {createCalendarEvent} from "../../api/entities/tutanota/CalendarEvent"
import type {AlarmInfo} from "../../api/entities/sys/AlarmInfo"
import {createAlarmInfo} from "../../api/entities/sys/AlarmInfo"
import type {MailboxDetail} from "../../mail/model/MailModel"
import stream from "mithril/stream/stream.js"
import {copyMailAddress, getDefaultSenderFromUser, getEnabledMailAddressesWithUser, getSenderNameForUser} from "../../mail/model/MailUtils"
import {
	createRepeatRuleWithValues,
	generateUid,
	getAllDayDateForTimezone,
	getAllDayDateUTCFromZone,
	getDiffInDays,
	getEventEnd,
	getEventStart,
	getNextHalfHour,
	getStartOfDayWithZone,
	getStartOfNextDayWithZone,
	getTimeZone,
	incrementByRepeatPeriod,
	incrementSequence,
	prepareCalendarDescription,
	timeString,
	timeStringInZone
} from "./CalendarUtils"
import {assertNotNull, clone, downcast, isCustomizationEnabledForCustomer, neverNull, noOp} from "../../api/common/utils/Utils"
import {generateEventElementId, isAllDayEvent} from "../../api/common/utils/CommonCalendarUtils"
import {CalendarModel} from "../model/CalendarModel"
import {DateTime} from "luxon"
import type {EncryptedMailAddress} from "../../api/entities/tutanota/EncryptedMailAddress"
import {createEncryptedMailAddress} from "../../api/entities/tutanota/EncryptedMailAddress"
import {NotFoundError, PayloadTooLargeError, TooManyRequestsError} from "../../api/common/error/RestError"
import {incrementDate} from "../../api/common/utils/DateUtils"
import type {CalendarUpdateDistributor} from "./CalendarUpdateDistributor"
import {calendarUpdateDistributor} from "./CalendarUpdateDistributor"
import type {IUserController} from "../../api/main/UserController"
import type {RecipientInfo, RecipientInfoTypeEnum} from "../../api/common/RecipientInfo"
import {isExternal, RecipientInfoType} from "../../api/common/RecipientInfo"
import type {Contact} from "../../api/entities/tutanota/Contact"
import type {SendMailModel} from "../../mail/editor/SendMailModel"
import {addMapEntry, deleteMapEntry} from "../../api/common/utils/MapUtils"
import type {RepeatRule} from "../../api/entities/sys/RepeatRule"
import {UserError} from "../../api/main/UserError"
import type {Mail} from "../../api/entities/tutanota/Mail"
import {logins} from "../../api/main/LoginController"
import {locator} from "../../api/main/MainLocator"
import {EntityClient} from "../../api/common/EntityClient"
import {BusinessFeatureRequiredError} from "../../api/main/BusinessFeatureRequiredError"
import {parseTime, timeStringFromParts} from "../../misc/Formatter"
import {hasCapabilityOnGroup} from "../../sharing/GroupUtils"

const TIMESTAMP_ZERO_YEAR = 1970

// whether to close dialog
export type EventCreateResult = boolean

const EventType = Object.freeze({
	OWN: "own", // event in our own calendar and we are organizer
	SHARED_RO: "shared_ro", // event in shared calendar with read permission
	SHARED_RW: "shared_rw", // event in shared calendar with write permission
	INVITE: "invite", // invite from calendar invitation which is not stored in calendar yet, or event stored and we are not organizer
})
type EventTypeEnum = $Values<typeof EventType>

export type Guest = {|
	address: EncryptedMailAddress,
	type: RecipientInfoTypeEnum,
	status: CalendarAttendeeStatusEnum
|}

type SendMailPurpose = "invite" | "update" | "cancel" | "response"
type SendMailModelFactory = (MailboxDetail, SendMailPurpose) => SendMailModel

type RepeatData = {|
	frequency: RepeatPeriodEnum,
	interval: number,
	endType: EndTypeEnum,
	endValue: number
|}

type ShowProgressCallback = Promise<mixed> => mixed

/**
 * ViewModel for viewing/editing the event. Takes care of sending out updates.
 */
export class CalendarEventViewModel {
	+summary: Stream<string>;
	+selectedCalendar: Stream<?CalendarInfo>;
	startDate: Date;
	endDate: Date;
	startTime: string;
	endTime: string;
	+allDay: Stream<boolean>;
	repeat: ?RepeatData
	calendars: Array<CalendarInfo>
	+attendees: Stream<$ReadOnlyArray<Guest>>;
	organizer: ?EncryptedMailAddress;
	+possibleOrganizers: $ReadOnlyArray<EncryptedMailAddress>;
	+location: Stream<string>;
	note: string;
	+amPmFormat: boolean;
	+existingEvent: ?CalendarEvent
	_oldStartTime: ?string;
	+_zone: string;
	// We keep alarms read-only so that view can diff just array and not all elements
	alarms: $ReadOnlyArray<AlarmInfo>;
	// UserController already keeps track of user updates, it is better to not have our own reference to the user, we might miss
	// important updates like premium upgrade
	+_userController: IUserController;
	+_eventType: EventTypeEnum;
	+_distributor: CalendarUpdateDistributor;
	+_calendarModel: CalendarModel;
	+_inviteModel: SendMailModel;
	+_updateModel: SendMailModel;
	+_cancelModel: SendMailModel;
	+_ownMailAddresses: Array<string>;
	+_entityClient: EntityClient;
	// We want to observe changes to it. To not mutate accidentally without stream update we keep it immutable.
	+_guestStatuses: Stream<$ReadOnlyMap<string, CalendarAttendeeStatusEnum>>;
	+_sendModelFactory: () => SendMailModel;
	/** Our own attendee, it should not be included in any of the sendMailModels. */
	+_ownAttendee: Stream<?EncryptedMailAddress>;
	_responseTo: ?Mail
	+sendingOutUpdate: Stream<boolean>
	_processing: boolean;
	hasBusinessFeature: Stream<boolean>
	hasPremiumLegacy: Stream<boolean>

	constructor(
		userController: IUserController,
		distributor: CalendarUpdateDistributor,
		calendarModel: CalendarModel,
		entityClient: EntityClient,
		mailboxDetail: MailboxDetail,
		sendMailModelFactory: SendMailModelFactory,
		date: Date,
		zone: string,
		calendars: Map<Id, CalendarInfo>,
		existingEvent?: ?CalendarEvent,
		responseTo: ?Mail,
		resolveRecipientsLazily: boolean,
	) {
		this._distributor = distributor
		this._calendarModel = calendarModel
		this._entityClient = entityClient
		this._responseTo = responseTo
		this._inviteModel = sendMailModelFactory(mailboxDetail, "invite")
		this._updateModel = sendMailModelFactory(mailboxDetail, "update")
		this._cancelModel = sendMailModelFactory(mailboxDetail, "cancel")
		this.summary = stream("")
		this._sendModelFactory = () => sendMailModelFactory(mailboxDetail, "response")
		this._ownMailAddresses = getEnabledMailAddressesWithUser(mailboxDetail, userController.userGroupInfo)
		this._ownAttendee = stream(null)
		this.sendingOutUpdate = stream(false)
		this._processing = false
		this.hasBusinessFeature = stream(false)
		this.hasPremiumLegacy = stream(false)

		const existingOrganizer = existingEvent && existingEvent.organizer
		this.organizer = existingOrganizer
			? copyMailAddress(existingOrganizer)
			: addressToMailAddress(getDefaultSenderFromUser(userController), mailboxDetail, userController)
		this.location = stream("")
		this.note = ""
		this.allDay = stream(false)
		this.amPmFormat = userController.userSettingsGroupRoot.timeFormat === TimeFormat.TWELVE_HOURS
		this.existingEvent = existingEvent
		this._zone = zone
		this.alarms = []
		this._userController = userController
		this._guestStatuses = this._initGuestStatus(existingEvent, resolveRecipientsLazily)
		this.attendees = this._initAttendees()
		if (existingEvent) {
			if (existingEvent.invitedConfidentially != null) {
				this.setConfidential(existingEvent.invitedConfidentially)
			}
		}
		this._eventType = this._initEventType(existingEvent, calendars)

		this.possibleOrganizers = existingOrganizer && !this.canModifyOrganizer()
			? [existingOrganizer]
			: existingOrganizer && !this._ownMailAddresses.includes(existingOrganizer.address)
				? [existingOrganizer].concat(this._ownPossibleOrganizers(mailboxDetail, userController))
				: this._ownPossibleOrganizers(mailboxDetail, userController)

		this.calendars = Array.from(calendars.values())
		this.selectedCalendar = stream(this.getAvailableCalendars()[0])

		if (existingEvent) {
			this._applyValuesFromExistingEvent(existingEvent, calendars)
		} else {
			// We care about passed time here, use it for default time values.
			this._setDefaultTimes(date)
			this.startDate = getStartOfDayWithZone(date, this._zone)
			this.endDate = getStartOfDayWithZone(date, this._zone)
		}
		this.updateCustomerFeatures()
	}

	_applyValuesFromExistingEvent(existingEvent: CalendarEvent, calendars: Map<Id, CalendarInfo>): void {
		this.summary(existingEvent.summary)
		const calendarForGroup = calendars.get(neverNull(existingEvent._ownerGroup))
		if (calendarForGroup) {
			this.selectedCalendar(calendarForGroup)
		}
		this.allDay(isAllDayEvent(existingEvent))
		this.startDate = getStartOfDayWithZone(getEventStart(existingEvent, this._zone), this._zone)
		if (this.allDay()) {
			this.endDate = incrementDate(getEventEnd(existingEvent, this._zone), -1)
			// We don't care about passed time here, just use current one as default
			this._setDefaultTimes()
		} else {
			this.startTime = timeStringInZone(getEventStart(existingEvent, this._zone), this.amPmFormat, this._zone)
			this.endTime = timeStringInZone(getEventEnd(existingEvent, this._zone), this.amPmFormat, this._zone)
			this.endDate = getStartOfDayWithZone(getEventEnd(existingEvent, this._zone), this._zone)
		}

		if (existingEvent.repeatRule) {
			const existingRule = existingEvent.repeatRule
			const repeat = {
				frequency: downcast(existingRule.frequency),
				interval: Number(existingRule.interval),
				endType: downcast(existingRule.endType),
				endValue: existingRule.endType === EndType.Count ? Number(existingRule.endValue) : 1,
			}
			if (existingRule.endType === EndType.UntilDate) {
				const rawEndDate = new Date(Number(existingRule.endValue))
				const localDate = this.allDay() ? getAllDayDateForTimezone(rawEndDate, this._zone) : rawEndDate
				// Shown date is one day behind the actual end (for us it's excluded)
				const shownDate = incrementByRepeatPeriod(localDate, RepeatPeriod.DAILY, -1, this._zone)
				repeat.endValue = shownDate.getTime()
			}
			this.repeat = repeat
		} else {
			this.repeat = null
		}
		this.location(existingEvent.location)
		this.note = prepareCalendarDescription(existingEvent.description)

		this._calendarModel.loadAlarms(existingEvent.alarmInfos, this._userController.user).then((alarms) => {
			alarms.forEach((alarm) => this.addAlarm(downcast(alarm.alarmInfo.trigger)))
		})
	}

	/**
	 * Capability for events is fairly complicated:
	 * Note: share "shared" means "not owner of the calendar". Calendar always looks like personal for the owner.
	 *
	 * | Calendar | edit details    | own attendance | guests | organizer
	 * |----------|-----------------|----------------|--------|----------
	 * | Personal | yes             | yes            | yes    | yes
	 * | Personal | yes (local)     | yes            | no     | no
	 * | Shared   | yes***          | no             | no*    | no*
	 * | Shared   | yes*** (local)  | no**           | no*    | no*
	 *
	 *   * we don't allow sharing in other people's calendar because later only organizer can modify event and
	 *   we don't want to prevent calendar owner from editing events in their own calendar.
	 *
	 *   ** this is not "our" copy of the event, from the point of organizer we saw it just accidentally.
	 *   Later we might support proposing ourselves as attendee but currently organizer should be asked to
	 *   send out the event.
	 *
	 *   *** depends on share capability. Cannot edit if it's not a copy and there are attendees.
	 */
	_initEventType(existingEvent: ?CalendarEvent, calendars: Map<Id, CalendarInfo>): EventTypeEnum {
		if (!existingEvent) {
			return EventType.OWN
		} else {
			// OwnerGroup is not set for events from file
			const calendarInfoForEvent = existingEvent._ownerGroup && calendars.get(existingEvent._ownerGroup)
			if (calendarInfoForEvent) {
				if (calendarInfoForEvent.shared) {
					return hasCapabilityOnGroup(this._userController.user, calendarInfoForEvent.group, ShareCapability.Write)
						? EventType.SHARED_RW
						: EventType.SHARED_RO
				} else {
					return (existingEvent.organizer == null || this._ownMailAddresses.includes(existingEvent.organizer.address))
						? EventType.OWN
						: EventType.INVITE
				}
			} else {
				// We can edit new invites (from files)
				return EventType.INVITE
			}
		}
	}

	_initGuestStatus(existingEvent: ?CalendarEvent, resolveRecipientsLazily: boolean): Stream<$ReadOnlyMap<string, CalendarAttendeeStatusEnum>> {
		const newStatuses = new Map()
		if (existingEvent) {
			existingEvent.attendees.forEach((attendee) => {
				if (this._ownMailAddresses.includes(attendee.address.address)) {
					this._ownAttendee(copyMailAddress(attendee.address))
				} else {
					this._updateModel.addOrGetRecipient("bcc", {
						name: attendee.address.name,
						address: attendee.address.address,
					}, resolveRecipientsLazily)
				}
				newStatuses.set(attendee.address.address, getAttendeeStatus(attendee))
			})
		}
		return stream(newStatuses)
	}

	updateCustomerFeatures(): Promise<void> {
		return this._userController.loadCustomer()
		           .then(customer => {
			           this.hasBusinessFeature(isCustomizationEnabledForCustomer(customer, FeatureType.BusinessFeatureEnabled))
			           this.hasPremiumLegacy(isCustomizationEnabledForCustomer(customer, FeatureType.PremiumLegacy))
		           }).return()
	}

	_initAttendees(): Stream<Array<Guest>> {
		return stream.merge(
			[this._inviteModel.onMailChanged, this._updateModel.onMailChanged, this._guestStatuses, this._ownAttendee]
		).map(() => {
			const makeGuestList = (model) => {
				return model.bccRecipients().map(recipientInfo => {
					const guest = {
						address: createEncryptedMailAddress({
							name: recipientInfo.name,
							address: recipientInfo.mailAddress,
						}),
						status: this._guestStatuses().get(recipientInfo.mailAddress)
							|| CalendarAttendeeStatus.NEEDS_ACTION,
						type: recipientInfo.type
					}
					return guest
				})
			}

			const guests = makeGuestList(this._inviteModel).concat(makeGuestList(this._updateModel))
			const ownAttendee = this._ownAttendee()
			if (ownAttendee) {
				guests.unshift({
					address: ownAttendee,
					status: this._guestStatuses().get(ownAttendee.address) || CalendarAttendeeStatus.ACCEPTED,
					type: RecipientInfoType.INTERNAL
				})
			}
			return guests
		})
	}

	_setDefaultTimes(date: Date = getNextHalfHour()) {
		const endTimeDate = new Date(date)
		endTimeDate.setMinutes(endTimeDate.getMinutes() + 30)
		this.startTime = timeString(date, this.amPmFormat)
		this.endTime = timeString(endTimeDate, this.amPmFormat)
	}

	_ownPossibleOrganizers(mailboxDetail: MailboxDetail, userController: IUserController): Array<EncryptedMailAddress> {
		return this._ownMailAddresses.map((address) => addressToMailAddress(address, mailboxDetail, userController))
	}

	findOwnAttendee(): ?Guest {
		return this.attendees().find(a => this._ownMailAddresses.includes(a.address.address))
	}

	onStartTimeSelected(value: string) {
		this._oldStartTime = this.startTime
		this.startTime = value
		if (this.startDate.getTime() === this.endDate.getTime()) {
			this._adjustEndTime()
		}
	}

	onEndTimeSelected(value: string) {
		this.endTime = value
	}

	addGuest(mailAddress: string, contact: ?Contact) {

		// 1: if the attendee already exists, do nothing
		// 2: if the attendee is not yourself, add to the invite model
		// 3: if the attendee is yourself and you already exist as an attendee, remove yourself
		// 4: add the attendee
		// 5: add organizer if you are not already in the list

		// We don't add a guest if they are already an attendee
		// even though the SendMailModel handles deduplication, we need to check here because recipients shouldn't be duplicated across the 3 models either
		if (this.attendees().some((a) => a.address.address === mailAddress)) {
			return
		}

		const isOwnAttendee = this._ownMailAddresses.includes(mailAddress)

		// SendMailModel handles deduplication
		// this.attendees will be updated when the model's recipients are updated
		if (!isOwnAttendee) this._inviteModel.addOrGetRecipient("bcc", {address: mailAddress, contact, name: null})

		const status = isOwnAttendee ? CalendarAttendeeStatus.ACCEPTED : CalendarAttendeeStatus.ADDED


		// If we exist as an attendee and the added guest is also an attendee, then remove the existing ownAttendee
		// and the new one will be added in the next step
		if (isOwnAttendee) {
			const ownAttendee = this.findOwnAttendee()
			if (ownAttendee) {
				this._guestStatuses(deleteMapEntry(this._guestStatuses(), ownAttendee.address.address))
			}
		}

		// if this guy wasn't already an attendee with a status
		if (!this._guestStatuses().has(mailAddress)) {
			this._guestStatuses(addMapEntry(this._guestStatuses(), mailAddress, status))
		}

		// this duplicated condition check may or may not be redundant to do here
		if (isOwnAttendee) {
			const newOrganizer = this.possibleOrganizers.find(o => o.address === mailAddress)
			if (newOrganizer) this.setOrganizer(newOrganizer)
		}

		// Add organizer as attendee if not currenly in the list
		if (this.attendees().length === 1 && this.findOwnAttendee() == null) {
			this.selectGoing(CalendarAttendeeStatus.ACCEPTED)
		}
	}

	getGuestPassword(guest: Guest): string {
		return this._inviteModel.getPassword(guest.address.address)
			|| this._updateModel.getPassword(guest.address.address)
			|| this._cancelModel.getPassword(guest.address.address)
	}

	isReadOnlyEvent(): boolean {
		return this._eventType === EventType.SHARED_RO
			|| this._eventType === EventType.SHARED_RW && this.attendees().length > 0
	}

	_adjustEndTime() {
		const parsedOldStartTime = this._oldStartTime && parseTime(this._oldStartTime)
		const parsedStartTime = parseTime(this.startTime)
		const parsedEndTime = parseTime(this.endTime)
		if (!parsedStartTime || !parsedEndTime || !parsedOldStartTime) {
			return
		}
		const endTotalMinutes = parsedEndTime.hours * 60 + parsedEndTime.minutes
		const startTotalMinutes = parsedStartTime.hours * 60 + parsedStartTime.minutes
		const diff = Math.abs(endTotalMinutes - parsedOldStartTime.hours * 60 - parsedOldStartTime.minutes)
		const newEndTotalMinutes = startTotalMinutes + diff
		let newEndHours = Math.floor(newEndTotalMinutes / 60)
		if (newEndHours > 23) {
			newEndHours = 23
		}
		const newEndMinutes = newEndTotalMinutes % 60
		this.endTime = timeStringFromParts(newEndHours, newEndMinutes, this.amPmFormat)
	}

	onStartDateSelected(date: ?Date) {
		if (date) {
			// The custom ID for events is derived from the unix timestamp, and sorting the negative ids is a challenge we decided not to
			// tackle because it is a rare case.
			if (date && date.getFullYear() < TIMESTAMP_ZERO_YEAR) {
				const thisYear = (new Date()).getFullYear()
				let newDate = new Date(date)
				newDate.setFullYear(thisYear)
				this.startDate = newDate
			} else {
				const diff = getDiffInDays(date, this.startDate)
				this.endDate = DateTime.fromJSDate(this.endDate, {zone: this._zone}).plus({days: diff}).toJSDate()
				this.startDate = date
			}
		}
	}

	onEndDateSelected(date: ?Date) {
		if (date) {
			this.endDate = date
		}
	}

	onRepeatPeriodSelected(repeatPeriod: ?RepeatPeriodEnum) {
		if (repeatPeriod == null) {
			this.repeat = null
		} else {
			// Provide default values if repeat is not there, override them with existing repeat if it's there, provide new frequency
			// First empty object is for Flow.
			this.repeat = Object.assign(
				{interval: 1, endType: EndType.Never, endValue: 1, frequency: repeatPeriod},
				this.repeat,
				{frequency: repeatPeriod}
			)
		}
	}

	onEndOccurencesSelected(endValue: number) {
		if (this.repeat && this.repeat.endType === EndType.Count) {
			this.repeat.endValue = endValue
		}
	}

	onRepeatEndDateSelected(endDate: ?Date) {
		const {repeat} = this
		if (endDate && repeat && repeat.endType === EndType.UntilDate) {
			repeat.endValue = endDate.getTime()
		}
	}

	onRepeatIntervalChanged(interval: number) {
		if (this.repeat) {
			this.repeat.interval = interval
		}
	}

	onRepeatEndTypeChanged(endType: EndTypeEnum) {
		const {repeat} = this
		if (repeat) {
			repeat.endType = endType
			if (endType === EndType.UntilDate) {
				repeat.endValue = incrementByRepeatPeriod(new Date(), RepeatPeriod.MONTHLY, 1, this._zone).getTime()
			} else {
				repeat.endValue = 1
			}
		}
	}

	addAlarm(trigger: AlarmIntervalEnum) {
		const alarm = createCalendarAlarm(generateEventElementId(Date.now()), trigger)
		this.alarms = this.alarms.concat(alarm)
	}

	changeAlarm(identifier: string, trigger: ?AlarmIntervalEnum) {
		const newAlarms = this.alarms.slice()
		for (let i = 0; i < newAlarms.length; i++) {
			if (newAlarms[i].alarmIdentifier === identifier) {
				if (trigger) {
					newAlarms[i].trigger = trigger
				} else {
					newAlarms.splice(i, 1)
				}
				this.alarms = newAlarms
				break
			}
		}
	}

	changeDescription(description: string) {
		this.note = description
	}

	canModifyGuests(): boolean {
		// It is not allowed to modify guests in shared calendar or invite.
		const selectedCalendar = this.selectedCalendar()
		return selectedCalendar != null && !selectedCalendar.shared && this._eventType !== EventType.INVITE
	}

	shouldShowSendInviteNotAvailable(): boolean {
		if (this._userController.user.accountType === AccountType.FREE) {
			return true
		}
		if (this._userController.user.accountType === AccountType.EXTERNAL) {
			return false
		}
		return !this.hasBusinessFeature() && !this.hasPremiumLegacy()
	}

	removeAttendee(guest: Guest) {
		const existingRecipient = this.existingEvent
			&& this.existingEvent.attendees.find((a) => a.address.address === guest.address.address)
		for (const model of [this._inviteModel, this._updateModel, this._cancelModel]) {
			const recipientInfo = model.bccRecipients().find(r => r.mailAddress === guest.address.address)
			if (recipientInfo) {
				model.removeRecipient(recipientInfo, "bcc")

				const newStatuses = new Map(this._guestStatuses())
				newStatuses.delete(recipientInfo.mailAddress)
				this._guestStatuses(newStatuses)
			}
		}
		if (existingRecipient) {
			this._cancelModel.addOrGetRecipient("bcc", {
				address: existingRecipient.address.address,
				name: existingRecipient.address.name,
				contact: null,
			})
		}
	}

	canModifyOwnAttendance(): boolean {
		// We can always modify own attendance in own event. Also can modify if it's invite in our calendar and we are invited.
		return this._eventType === EventType.OWN || (this._eventType === EventType.INVITE && !!this.findOwnAttendee())
	}

	canModifyOrganizer(): boolean {
		// We can only modify the organizer if it is our own event and there are no guests
		return this._eventType === EventType.OWN
			&& (!this.existingEvent
				|| (this.existingEvent.attendees.length === 0)
				|| (this.existingEvent.attendees.length === 1
					&& this._ownMailAddresses.includes(this.existingEvent.attendees[0].address.address)))
	}

	setOrganizer(newOrganizer: EncryptedMailAddress): void {
		if (this.canModifyOrganizer()) {
			this.organizer = newOrganizer
			// we always add the organizer to the attendee list
			this._ownAttendee(newOrganizer)
		}
	}

	canModifyAlarms(): boolean {
		return this._eventType === EventType.OWN
			|| this._eventType === EventType.INVITE
			|| this._eventType === EventType.SHARED_RW
	}

	deleteEvent(): Promise<void> {
		const event = this.existingEvent
		if (event) {
			// We must always be in attendees so we just check that there's more than one attendee
			const awaitCancellation = this._eventType === EventType.OWN && event.attendees.length > 1
				? this._sendCancellation(event)
				: Promise.resolve()
			return awaitCancellation.then(() => this._calendarModel.deleteEvent(event)).catch(NotFoundError, noOp)
		} else {
			return Promise.resolve()
		}
	}

	/**
	 * @reject UserError
	 */
	saveAndSend(
		{askForUpdates, askInsecurePassword, showProgress}: {
			askForUpdates: () => Promise<"yes" | "no" | "cancel">,
			askInsecurePassword: () => Promise<boolean>,
			showProgress: ShowProgressCallback,
		}
	): Promise<EventCreateResult> {
		if (this._processing) {
			return Promise.resolve(false)
		}
		this._processing = true
		return Promise.resolve().then(() => {
			const newEvent = this._initializeNewEvent()
			const newAlarms = this.alarms.slice()
			if (this._eventType === EventType.OWN) {
				// It is our own event. We might need to send out invites/cancellations/updates
				return this._sendNotificationAndSave(askInsecurePassword, askForUpdates, showProgress, newEvent, newAlarms)
			} else if (this._eventType === EventType.INVITE) {
				// We have been invited by another person (internal/ unsecure external)
				return this._respondToOrganizerAndSave(showProgress, assertNotNull(this.existingEvent), newEvent, newAlarms)
			} else {
				// This is event in a shared calendar. We cannot send anything because it's not our event.
				const p = this._saveEvent(newEvent, newAlarms)
				showProgress(p)
				return p.return(true)
			}
		}).catch(PayloadTooLargeError, () => {
			throw new UserError("requestTooLarge_msg")
		}).finally(() => {
			this._processing = false
		})
	}

	_sendCancellation(event: CalendarEvent): Promise<*> {
		const updatedEvent = clone(event)
		// This is guaranteed to be our own event.
		updatedEvent.sequence = incrementSequence(updatedEvent.sequence, true)
		const cancelAddresses = event.attendees
		                             .filter(a => !this._ownMailAddresses.includes(a.address.address))
		                             .map(a => a.address)

		return Promise
			.each(cancelAddresses, (a) => {
				const [recipientInfo, recipientInfoPromise] = this._cancelModel.addOrGetRecipient("bcc", {
					name: a.name,
					address: a.address,
					contact: null
				})
				//We cannot send a notification to external recipients without a password, so we exclude them
				if (this._cancelModel.isConfidential()) {
					return Promise.all([recipientInfo.resolveContactPromise, recipientInfoPromise])
					              .then(() => {
						              if (isExternal(recipientInfo) && !this._cancelModel.getPassword(recipientInfo.mailAddress)) {
							              this._cancelModel.removeRecipient(recipientInfo, "bcc", false)
						              }
					              })
				} else {
					return Promise.resolve()
				}
			})
			.then(() => {
				//We check if there are any attendees left to send the cancellation to
				return this._cancelModel.allRecipients().length
					? this._distributor.sendCancellation(updatedEvent, this._cancelModel)
					: Promise.resolve()
			})
			.catch(TooManyRequestsError, () => {
				throw new UserError("mailAddressDelay_msg") // This will be caught and open error dialog
			})
	}

	_saveEvent(newEvent: CalendarEvent, newAlarms: Array<AlarmInfo>): Promise<void> {
		if (this._userController.user.accountType === AccountType.EXTERNAL) {
			return Promise.resolve()
		}
		const groupRoot = assertNotNull(this.selectedCalendar()).groupRoot
		if (this.existingEvent == null || this.existingEvent._id == null) {
			return this._calendarModel.createEvent(newEvent, newAlarms, this._zone, groupRoot)
		} else {
			return this._calendarModel.updateEvent(newEvent, newAlarms, this._zone, groupRoot, this.existingEvent)
			           .return()
		}
	}

	_sendNotificationAndSave(askInsecurePassword: () => Promise<boolean>, askForUpdates: () => Promise<"yes" | "no" | "cancel">,
	                         showProgress: ShowProgressCallback, newEvent: CalendarEvent, newAlarms: Array<AlarmInfo>): Promise<boolean> {
		// ask for update
		const askForUpdatesAwait = this._updateModel.bccRecipients().length
			? askForUpdates()
			: Promise.resolve("no")

		const passwordCheck = () => this.hasInsecurePasswords()
		&& this.containsExternalRecipients() ? askInsecurePassword() : Promise.resolve(true)

		return askForUpdatesAwait.then(updateResponse => {
			if (updateResponse === "cancel") {
				return false
			} else if (this.shouldShowSendInviteNotAvailable() // we check again to prevent updates after cancelling business or updates for an imported event
				&& (updateResponse === "yes" || this._inviteModel.bccRecipients().length || this._cancelModel.bccRecipients().length)) {
				throw new BusinessFeatureRequiredError("businessFeatureRequiredInvite_msg")
			}

			// Do check passwords if there are new recipients. We already made decision for those who we invited before
			return Promise.resolve(this._inviteModel.bccRecipients().length ? passwordCheck() : true)
			              .then((passwordCheckPassed) => {
				              if (!passwordCheckPassed) {
					              // User said to not send despite insecure password, stop
					              return false
				              }
				              // Invites are cancellations are sent out independent of the updates decision
				              const p = this._sendInvite(newEvent)
				                            .then(() => this._cancelModel.bccRecipients().length
					                            ? this._distributor.sendCancellation(newEvent, this._cancelModel)
					                            : Promise.resolve())
				                            .then(() => this._saveEvent(newEvent, newAlarms))
				                            .then(() => updateResponse === "yes"
					                            ? this._distributor.sendUpdate(newEvent, this._updateModel)
					                            : Promise.resolve())
				                            .then(() => true)
				              showProgress(p)
				              return p
			              })
		})
	}

	_sendInvite(event: CalendarEvent): Promise<void> {
		const newAttendees = event.attendees.filter((a) => a.status === CalendarAttendeeStatus.ADDED)
		if (newAttendees.length > 0) {
			return this._distributor.sendInvite(event, this._inviteModel)
			           .then(() => {
				           newAttendees.forEach((a) => {
					           if (a.status === CalendarAttendeeStatus.ADDED) {
						           a.status = CalendarAttendeeStatus.NEEDS_ACTION
					           }
					           this._guestStatuses(addMapEntry(this._guestStatuses(), a.address.address, CalendarAttendeeStatus.NEEDS_ACTION))
				           })
			           })
		} else {
			return Promise.resolve()
		}
	}

	_respondToOrganizerAndSave(showProgress: ShowProgressCallback, existingEvent: CalendarEvent, newEvent: CalendarEvent,
	                           newAlarms: Array<AlarmInfo>): Promise<boolean> {
		// We are not using this._findAttendee() because we want to search it on the event, before our modifications
		const ownAttendee = existingEvent.attendees.find(a => this._ownMailAddresses.includes(a.address.address))
		const selectedOwnAttendeeStatus = ownAttendee && this._guestStatuses().get(ownAttendee.address.address)
		let sendPromise = Promise.resolve()
		if (ownAttendee
			&& selectedOwnAttendeeStatus !== CalendarAttendeeStatus.NEEDS_ACTION
			&& ownAttendee.status !== selectedOwnAttendeeStatus
		) {
			ownAttendee.status = assertNotNull(selectedOwnAttendeeStatus)
			const sendResponseModel = this._sendModelFactory()
			const organizer = assertNotNull(existingEvent.organizer)
			sendResponseModel.addOrGetRecipient("to", {name: organizer.name, address: organizer.address, contact: null})
			sendPromise = this._distributor.sendResponse(newEvent, sendResponseModel, ownAttendee.address.address, this._responseTo,
				assertNotNull(selectedOwnAttendeeStatus)
			).then(() => sendResponseModel.dispose())
		}
		const p = sendPromise.then(() => this._saveEvent(newEvent, newAlarms))
		showProgress(p)
		return p.return(true)
	}

	selectGoing(going: CalendarAttendeeStatusEnum) {
		if (this.canModifyOwnAttendance()) {
			const ownAttendee = this._ownAttendee()
			if (ownAttendee) {
				this._guestStatuses(addMapEntry(this._guestStatuses(), ownAttendee.address, going))
			} else if (this._eventType === EventType.OWN) {
				// use the default sender as the organizer
				const newOwnAttendee = createEncryptedMailAddress({address: this._inviteModel.getSender()})
				this._ownAttendee(newOwnAttendee)
				this._guestStatuses(addMapEntry(this._guestStatuses(), newOwnAttendee.address, going))
			}
		}
	}

	createRepeatRule(newEvent: CalendarEvent, repeat: RepeatData): RepeatRule {
		const interval = repeat.interval || 1
		const repeatRule = createRepeatRuleWithValues(repeat.frequency, interval)
		const stopType = repeat.endType
		repeatRule.endType = stopType
		if (stopType === EndType.Count) {
			const count = repeat.endValue
			if (isNaN(count) || Number(count) < 1) {
				repeatRule.endType = EndType.Never
			} else {
				repeatRule.endValue = String(count)
			}
		} else if (stopType === EndType.UntilDate) {
			const repeatEndDate = getStartOfNextDayWithZone(new Date(repeat.endValue), this._zone)
			if (repeatEndDate.getTime() < getEventStart(newEvent, this._zone)) {
				throw new UserError("startAfterEnd_label")
			} else {
				// We have to save repeatEndDate in the same way we save start/end times because if one is timzone
				// dependent and one is not then we have interesting bugs in edge cases (event created in -11 could
				// end on another date in +12). So for all day events end date is UTC-encoded all day event and for
				// regular events it is just a timestamp.
				repeatRule.endValue =
					String((this.allDay() ? getAllDayDateUTCFromZone(repeatEndDate, this._zone) : repeatEndDate).getTime())
			}
		}
		return repeatRule
	}

	setConfidential(confidential: boolean): void {
		this._inviteModel.setConfidential(confidential)
		this._updateModel.setConfidential(confidential)
		this._cancelModel.setConfidential(confidential)
	}

	isConfidential(): boolean {
		return this._inviteModel.isConfidential() && this._updateModel.isConfidential() && this._cancelModel.isConfidential()
	}


	updatePassword(guest: Guest, password: string) {
		const inInvite = this._inviteModel.bccRecipients().find((r) => r.mailAddress === guest.address.address)
		if (inInvite) {
			this._inviteModel.setPassword(inInvite.mailAddress, password)
		}
		const inUpdate = this._updateModel.bccRecipients().find((r) => r.mailAddress === guest.address.address)
		if (inUpdate) {
			this._updateModel.setPassword(inUpdate.mailAddress, password)
		}
		const inCancel = this._cancelModel.bccRecipients().find((r) => r.mailAddress === guest.address.address)
		if (inCancel) {
			this._updateModel.setPassword(inCancel.mailAddress, password)
		}
	}

	shouldShowPasswordFields(): boolean {
		return this.isConfidential() && this._eventType === EventType.OWN
	}

	getPasswordStrength(guest: Guest): number {
		const address = guest.address.address
		const getStrength = (model) => {
			const recipient = model.allRecipients()
			                       .find(r => address === r.mailAddress)
			return recipient ? model.getPasswordStrength(recipient) : null
		}
		const inviteStrength = getStrength(this._inviteModel)
		if (inviteStrength != null) return inviteStrength

		const updateStrength = getStrength(this._updateModel)
		return updateStrength != null ? updateStrength : 0
	}

	hasInsecurePasswords(): boolean {
		if (!this.isConfidential()) {
			return false
		}
		if (this._eventType === EventType.INVITE) {
			// We can't receive invites from secure external users, so we don't have to reply with password
			return false
		} else {
			return this._inviteModel.hasInsecurePasswords()
				|| this._updateModel.hasInsecurePasswords()
				|| this._cancelModel.hasInsecurePasswords()
		}
	}

	containsExternalRecipients(): boolean {
		return this._inviteModel.containsExternalRecipients()
			|| this._updateModel.containsExternalRecipients()
			|| this._cancelModel.containsExternalRecipients()
	}

	getAvailableCalendars(): Array<CalendarInfo> {
		// Prevent moving the calendar to another calendar if you only have read permission or if the event has attendees.
		if (this.isReadOnlyEvent()) {
			return this.calendars
			           .filter((calendarInfo) => calendarInfo.group._id === assertNotNull(this.existingEvent)._ownerGroup)
		} else if (this.attendees().length || this._eventType === EventType.INVITE) {
			// We don't allow inviting in a shared calendar. If we have attendees, we cannot select a shared calendar
			// We also don't allow accepting invites into shared calendars.
			return this.calendars
			           .filter((calendarInfo) => !calendarInfo.shared)
		} else {
			return this.calendars
			           .filter((calendarInfo) => hasCapabilityOnGroup(this._userController.user, calendarInfo.group, ShareCapability.Write))
		}
	}

	_allRecipients(): Array<RecipientInfo> {
		return this._inviteModel.allRecipients().concat(this._updateModel.allRecipients()).concat(this._cancelModel.allRecipients())
	}

	dispose(): void {
		this._inviteModel.dispose()
		this._updateModel.dispose()
		this._cancelModel.dispose()
	}

	isInvite(): boolean {
		return this._eventType === EventType.INVITE
	}

	_initializeNewEvent(): CalendarEvent {
		// We have to use existing instance to get all the final fields correctly
		// Using clone feels hacky but otherwise we need to save all attributes of the existing event somewhere and if dialog is
		// cancelled we also don't want to modify passed event
		const newEvent = this.existingEvent ? clone(this.existingEvent) : createCalendarEvent()
		newEvent.sequence = incrementSequence(newEvent.sequence, this._eventType === EventType.OWN)

		let startDate = new Date(this.startDate)
		let endDate = new Date(this.endDate)

		if (this.allDay()) {
			startDate = getAllDayDateUTCFromZone(startDate, this._zone)
			endDate = getAllDayDateUTCFromZone(getStartOfNextDayWithZone(endDate, this._zone), this._zone)
		} else {
			const parsedStartTime = parseTime(this.startTime)
			const parsedEndTime = parseTime(this.endTime)
			if (!parsedStartTime || !parsedEndTime) {
				throw new UserError("timeFormatInvalid_msg")
			}
			startDate = DateTime.fromJSDate(startDate, {zone: this._zone})
			                    .set({hour: parsedStartTime.hours, minute: parsedStartTime.minutes})
			                    .toJSDate()

			// End date is never actually included in the event. For the whole day event the next day
			// is the boundary. For the timed one the end time is the boundary.
			endDate = DateTime.fromJSDate(endDate, {zone: this._zone})
			                  .set({hour: parsedEndTime.hours, minute: parsedEndTime.minutes})
			                  .toJSDate()
		}

		if (endDate.getTime() <= startDate.getTime()) {
			throw new UserError("startAfterEnd_label")
		}
		newEvent.startTime = startDate
		newEvent.description = this.note
		newEvent.summary = this.summary()
		newEvent.location = this.location()
		newEvent.endTime = endDate
		newEvent.invitedConfidentially = this.isConfidential()
		newEvent.uid = this.existingEvent && this.existingEvent.uid
			? this.existingEvent.uid
			: generateUid(assertNotNull(this.selectedCalendar()).group._id, Date.now())
		const repeat = this.repeat
		if (repeat == null) {
			newEvent.repeatRule = null
		} else {
			newEvent.repeatRule = this.createRepeatRule(newEvent, repeat)
		}
		newEvent.attendees = this.attendees().map((a) => createCalendarEventAttendee({
			address: a.address,
			status: a.status,
		}))
		newEvent.organizer = this.organizer
		return newEvent
	}
}

function addressToMailAddress(address: string, mailboxDetail: MailboxDetail, userController: IUserController): EncryptedMailAddress {
	return createEncryptedMailAddress({
		address,
		name: getSenderNameForUser(mailboxDetail, userController)
	})
}

function createCalendarAlarm(identifier: string, trigger: string): AlarmInfo {
	const calendarAlarmInfo = createAlarmInfo()
	calendarAlarmInfo.alarmIdentifier = identifier
	calendarAlarmInfo.trigger = trigger
	return calendarAlarmInfo
}


export function createCalendarEventViewModel(date: Date, calendars: Map<Id, CalendarInfo>, mailboxDetail: MailboxDetail,
                                             existingEvent: ?CalendarEvent, previousMail: ?Mail, resolveRecipientsLazily: boolean,
): Promise<CalendarEventViewModel> {
	return import("../../mail/editor/SendMailModel").then((model) => {
		return new CalendarEventViewModel(
			logins.getUserController(),
			calendarUpdateDistributor,
			locator.calendarModel,
			locator.entityClient,
			mailboxDetail,
			(mailboxDetail) => model.defaultSendMailModel(mailboxDetail),
			date,
			getTimeZone(),
			calendars,
			existingEvent,
			previousMail,
			resolveRecipientsLazily,
		)
	})
}