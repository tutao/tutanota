import { ProgrammingError } from "./ProgrammingError-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import { arrayEqualsWithPredicate, assert, assertNonNull, assertNotNull, clamp, clone, defer, findAll, getFromMap, getStartOfDay, identity, incrementDate, isNotEmpty, isSameDay, isSameDayOfDate, memoized, noOp, numberRange, remove, trisectingDiff, typedValues } from "./dist2-chunk.js";
import { lang } from "./LanguageViewModel-chunk.js";
import { MAX_HUE_ANGLE, hslToHex, isColorLight, isValidColorCode, theme } from "./theme-chunk.js";
import { AccountType, CLIENT_ONLY_CALENDARS, CalendarAttendeeStatus, ConversationType, DEFAULT_CLIENT_ONLY_CALENDAR_COLORS, EndType, EventTextTimeOption, RepeatPeriod, ShareCapability, WeekStart, defaultCalendarColor } from "./TutanotaConstants-chunk.js";
import { size } from "./size-chunk.js";
import { DateTime, Duration } from "./luxon-chunk.js";
import { getStrippedClone, haveSameId } from "./EntityUtils-chunk.js";
import { createCalendarEvent, createCalendarEventAttendee, createEncryptedMailAddress } from "./TypeRefs-chunk.js";
import { CalendarViewType, cleanMailAddress, findRecipientWithAddress, generateEventElementId, isAllDayEvent, serializeAlarmInterval } from "./CommonCalendarUtils-chunk.js";
import { AlarmIntervalUnit, DefaultDateProvider, StandardAlarmInterval, alarmIntervalToLuxonDurationLikeObject, areRepeatRulesEqual, eventEndsAfterDay, eventStartsBefore, findFirstPrivateCalendar, generateUid, getAllDayDateForTimezone, getEndOfDayWithZone, getEventEnd, getEventStart, getStartOfDayWithZone, getStartOfNextDayWithZone, getStartOfTheWeekOffset, getStartOfWeek, getTimeZone, getWeekNumber, hasSourceUrl, incrementByRepeatPeriod, incrementSequence, parseAlarmInterval } from "./CalendarUtils-chunk.js";
import { NotFoundError, PayloadTooLargeError, TooManyRequestsError } from "./RestError-chunk.js";
import { ButtonType } from "./Button-chunk.js";
import { Icons } from "./Icons-chunk.js";
import { Dialog, createAsyncDropdown } from "./Dialog-chunk.js";
import { IconButton } from "./IconButton-chunk.js";
import { CalendarEventWhenModel, Time } from "./CalendarEventWhenModel-chunk.js";
import { formatDateTime, formatDateWithMonth, formatDateWithWeekday, formatMonthWithFullYear, formatTime } from "./Formatter-chunk.js";
import { assertEventValidity } from "./CalendarModel-chunk.js";
import { hasCapabilityOnGroup } from "./GroupUtils2-chunk.js";
import { UserError } from "./UserError-chunk.js";
import { RecipientField, getDefaultSender } from "./SharedMailUtils-chunk.js";
import { getPasswordStrengthForUser, isSecurePassword } from "./PasswordUtils-chunk.js";
import { RecipientType } from "./Recipient-chunk.js";
import { getContactDisplayName } from "./ContactUtils-chunk.js";
import { ResolveMode } from "./RecipientsModel-chunk.js";
import { UpgradeRequiredError } from "./UpgradeRequiredError-chunk.js";
import { ColorPickerModel } from "./ColorPickerModel-chunk.js";

//#region src/calendar-app/calendar/gui/eventeditor-model/CalendarEventWhoModel.ts
var CalendarEventWhoModel = class {
	/** we need to resolve recipients to know if we need to show an external password field. */
	resolvedRecipients = new Map();
	pendingRecipients = 0;
	_recipientsSettled = defer();
	/** it's possible that the consumer cares about all the recipient information being resolved, but that's only possible in an async way. */
	get recipientsSettled() {
		return this._recipientsSettled.promise;
	}
	/** external password for an external attendee with an address */
	externalPasswords = new Map();
	/** to know who to update, we need to know who was already on the guest list.
	* we keep the attendees in maps for deduplication, keyed by their address.
	* */
	initialAttendees = new Map();
	initialOwnAttendeeStatus = null;
	/** we only show the send update checkbox if there are attendees that require updates from us. */
	initiallyHadOtherAttendees;
	/** the current list of attendees. */
	_attendees = new Map();
	/** organizer MUST be set if _ownAttendee is - we're either both, we're invited and someone else is organizer or there are no guests at all. */
	_organizer = null;
	/** the attendee that has one of our mail addresses. MUST NOT be in _attendees */
	_ownAttendee = null;
	isConfidential;
	/**
	* whether this user will send updates for this event.
	* * this needs to be our event.
	* * we need a paid account
	* * there need to be changes that require updating the attendees (eg alarms do not)
	* * there also need to be attendees that require updates/invites/cancellations/response
	*/
	shouldSendUpdates = false;
	/**
	*
	* @param initialValues
	* @param eventType
	* @param operation the operation the user is currently attempting. we could use recurrenceId on initialvalues for this information, but this is safer.
	* @param calendars
	* @param _selectedCalendar
	* @param userController
	* @param isNew whether the event is new (never been saved)
	* @param ownMailAddresses an array of the mail addresses this user could be mentioned as as an attendee or organizer.
	* @param recipientsModel
	* @param responseTo
	* @param passwordStrengthModel
	* @param sendMailModelFactory
	* @param uiUpdateCallback
	*/
	constructor(initialValues, eventType, operation, calendars, _selectedCalendar, userController, isNew, ownMailAddresses, recipientsModel, responseTo, passwordStrengthModel, sendMailModelFactory, uiUpdateCallback = noOp) {
		this.eventType = eventType;
		this.operation = operation;
		this.calendars = calendars;
		this._selectedCalendar = _selectedCalendar;
		this.userController = userController;
		this.isNew = isNew;
		this.ownMailAddresses = ownMailAddresses;
		this.recipientsModel = recipientsModel;
		this.responseTo = responseTo;
		this.passwordStrengthModel = passwordStrengthModel;
		this.sendMailModelFactory = sendMailModelFactory;
		this.uiUpdateCallback = uiUpdateCallback;
		this.setupAttendees(initialValues);
		const resolvePromises = initialValues.attendees?.map((a) => this.resolveAndCacheAddress(a.address)).concat() ?? [];
		if (initialValues.organizer) resolvePromises.push(this.resolveAndCacheAddress(initialValues.organizer));
		Promise.all(resolvePromises).then(this.uiUpdateCallback);
		this.initiallyHadOtherAttendees = this.hasNotifyableOtherAttendees();
		this.isConfidential = initialValues.invitedConfidentially ?? false;
	}
	set selectedCalendar(v) {
		/**
		* when changing the calendar of an event, if the user is the organiser
		* they can link any of their owned calendars(private or shared) to said event
		* even if the event has guests
		**/
		if (!v.userIsOwner && v.shared && this._attendees.size > 0) throw new ProgrammingError("tried to select shared calendar while there are guests.");
else if (!v.userIsOwner && v.shared && this.isNew && this._organizer != null) this._organizer = null;
		this._selectedCalendar = v;
		this.uiUpdateCallback();
	}
	get selectedCalendar() {
		return this._selectedCalendar;
	}
	/**
	* whether the current user can modify the guest list of the event depending on event type and the calendar it's in.
	*
	* * at the moment, we can never modify guests when editing only part of a series.
	* * selected calendar is our own:
	*   * event is invite (we're not organizer): can't modify guest list, any edit operation will be local only.
	*   * event is our own: can do what we want.
	* * if the selected calendar is a shared one:
	*   * ro: don't show editor at all
	*   * rw, new event: don't show attendee list editor - we can't invite in shared calendars.
	*   * rw, existing event without attendees: not our own calendar, can't invite, don't show attendee list.
	*   * rw, existing event with attendees:  this is the case where we can see attendees, but can't edit them.
	*                                         but we also can't edit the event since there are attendees and we're
	*                                         unable to send updates.
	*/
	get canModifyGuests() {
		/**
		* if the user is the event's organiser and the owner of its linked calendar, the user can modify the guests freely
		**/
		const userIsOwner = this.eventType === EventType.OWN && this.selectedCalendar.userIsOwner;
		return userIsOwner || !(this.selectedCalendar?.shared || this.eventType === EventType.INVITE || this.operation === CalendarOperation.EditThis);
	}
	/**
	* filter the calendars an event can be saved to depending on the event type, attendee status and edit operation.
	* Prevent moving the event to another calendar if you only have read permission or if the event has attendees.
	* */
	getAvailableCalendars() {
		const { groupSettings } = this.userController.userSettingsGroupRoot;
		const calendarArray = Array.from(this.calendars.values()).filter((cal) => !this.isExternalCalendar(groupSettings, cal.group._id));
		if (this.eventType === EventType.LOCKED || this.operation === CalendarOperation.EditThis) return [this.selectedCalendar];
else if (this.isNew && this._attendees.size > 0)
 /**
		* when changing the calendar of an event, if the user is the organiser
		* they can link any of their owned calendars(private or shared) to said event
		* even if the event has guests
		**/
		return calendarArray.filter((calendarInfo) => calendarInfo.userIsOwner || !calendarInfo.shared);
else if (this._attendees.size > 0 && this.eventType === EventType.OWN) return calendarArray.filter((calendarInfo) => calendarInfo.userIsOwner);
else if (this._attendees.size > 0 || this.eventType === EventType.INVITE) return calendarArray.filter((calendarInfo) => !calendarInfo.shared || haveSameId(calendarInfo.group, this.selectedCalendar.group));
else return calendarArray.filter((calendarInfo) => hasCapabilityOnGroup(this.userController.user, calendarInfo.group, ShareCapability.Write));
	}
	isExternalCalendar(groupSettings, groupId) {
		const existingGroupSettings = groupSettings.find((gc) => gc.group === groupId);
		return hasSourceUrl(existingGroupSettings);
	}
	async resolveAndCacheAddress(a) {
		if (this.resolvedRecipients.has(a.address)) return;
		this.pendingRecipients = this.pendingRecipients + 1;
		const recipient = await this.recipientsModel.resolve(a, ResolveMode.Eager).resolved();
		this.cacheRecipient(recipient);
		this.pendingRecipients = this.pendingRecipients - 1;
		if (this.pendingRecipients === 0) {
			this._recipientsSettled.resolve();
			this._recipientsSettled = defer();
		}
	}
	cacheRecipient(recipient) {
		this.resolvedRecipients.set(recipient.address, recipient);
		if (recipient.type !== RecipientType.EXTERNAL) return;
		this.externalPasswords.set(recipient.address, recipient.contact?.presharedPassword ?? "");
		if (recipient.contact != null && this._attendees.has(recipient.address)) {
			const attendee = this._attendees.get(recipient.address);
			attendee.address.name = getContactDisplayName(recipient.contact);
		}
	}
	/**
	* internally, we want to keep ourselves and the organizer separate from the other attendees
	*/
	setupAttendees(initialValues) {
		const ownAddresses = this.ownMailAddresses.map((a) => cleanMailAddress(a.address));
		for (const a of initialValues.attendees ?? []) {
			const attendee = createCalendarEventAttendee({
				status: a.status,
				address: createEncryptedMailAddress({
					name: a.address.name,
					address: cleanMailAddress(a.address.address)
				})
			});
			this.initialAttendees.set(attendee.address.address, attendee);
		}
		const initialOrganizerAddress = initialValues.organizer == null ? null : createEncryptedMailAddress({
			address: cleanMailAddress(initialValues.organizer.address),
			name: initialValues.organizer.name
		});
		if (initialOrganizerAddress != null) {
			const organizerAttendee = this.initialAttendees.get(initialOrganizerAddress.address);
			this._organizer = organizerAttendee ?? createCalendarEventAttendee({
				address: initialOrganizerAddress,
				status: CalendarAttendeeStatus.NEEDS_ACTION
			});
			this.initialAttendees.delete(this._organizer.address.address);
		}
		const ownAttendeeAddresses = findAll(Array.from(this.initialAttendees.keys()), (address) => ownAddresses.includes(address));
		this._ownAttendee = this.initialAttendees.get(ownAttendeeAddresses[0]) ?? null;
		this.initialOwnAttendeeStatus = this._ownAttendee?.status ?? null;
		for (const match of ownAttendeeAddresses) this.initialAttendees.delete(match);
		for (const [initialAttendeeAddress, initialAttendee] of this.initialAttendees.entries()) this._attendees.set(initialAttendeeAddress, clone(initialAttendee));
		if (this._organizer != null && this._attendees.size === 0 && this._ownAttendee == null) this._organizer = null;
		if (this.eventType === EventType.OWN && this._organizer != null && !ownAddresses.includes(this._organizer.address.address) && Array.from(this._attendees.values()).some((a) => a.status !== CalendarAttendeeStatus.ADDED)) {
			console.warn("got an event with attendees and an organizer that's not the owner of the calendar, replacing organizer.");
			this._attendees.set(this._organizer.address.address, this._organizer);
			this._organizer = this._ownAttendee ?? createCalendarEventAttendee({
				address: createEncryptedMailAddress({
					address: ownAddresses[0],
					name: ""
				}),
				status: CalendarAttendeeStatus.ACCEPTED
			});
		}
		if (this._organizer && ownAddresses.includes(this._organizer.address.address) && this._organizer.address.address !== this._ownAttendee?.address.address) this._ownAttendee = this._organizer;
	}
	/**
	* figure out if there are currently other people that might need to be notified if this event is modified.
	* attendees that were just added and not invited yet are ignored for this.
	* @private
	*/
	hasNotifyableOtherAttendees() {
		return !this.isNew && Array.from(this.initialAttendees.values()).some((a) => a.status !== CalendarAttendeeStatus.ADDED);
	}
	get possibleOrganizers() {
		if (this.eventType !== EventType.OWN) return this._organizer ? [this._organizer.address] : [];
else if (!this.hasNotifyableOtherAttendees()) return this.ownMailAddresses;
else if (this._organizer != null && this.ownGuest?.address === this._organizer?.address.address) return [this._organizer.address];
else if (this.eventType === EventType.OWN) return this.ownMailAddresses;
else throw new ProgrammingError("could not figure out which addresses are a valid organizer for this event.");
	}
	/**
	* get our own guest, if any
	*/
	get ownGuest() {
		return this._ownAttendee && this.getGuestForAttendee(this._ownAttendee);
	}
	/**
	* get the current organizer of the event
	*
	* there is no setter - if we're changing attendees, we're ensured to be the organizer.
	*/
	get organizer() {
		return this._organizer && this.getGuestForAttendee(this._organizer);
	}
	/**
	* a list of the attendees of the event that are not the organizer or ourselves, with their status and type
	*/
	get guests() {
		return Array.from(this._attendees.values()).map((a) => this.getGuestForAttendee(a));
	}
	getGuestForAttendee(a) {
		if (this.resolvedRecipients.has(a.address.address)) {
			const recipient = this.resolvedRecipients.get(a.address.address);
			return {
				...recipient,
				status: a.status
			};
		} else return {
			address: a.address.address,
			name: a.address.name,
			status: a.status,
			type: RecipientType.UNKNOWN,
			contact: null
		};
	}
	/**
	* add a mail address to the list of invitees.
	* the organizer will always be set to the last of the current user's mail addresses that has been added.
	*
	* if an attendee is deleted an re-added, the status is retained.
	*
	* @param address the mail address to send the invite to
	* @param contact a contact for a display name.
	*/
	addAttendee(address, contact = null) {
		if (!this.canModifyGuests) throw new UserError(lang.makeTranslation("cannotAddAttendees_msg", "Cannot add attendees"));
		const cleanAddress = cleanMailAddress(address);
		if (this._attendees.has(cleanAddress) || this._organizer?.address.address === cleanAddress || this._ownAttendee?.address.address === cleanAddress) return;
		const ownAttendee = findRecipientWithAddress(this.ownMailAddresses, cleanAddress);
		if (ownAttendee != null) this.addOwnAttendee(ownAttendee);
else {
			const name = contact != null ? getContactDisplayName(contact) : "";
			this.addOtherAttendee(createEncryptedMailAddress({
				address: cleanAddress,
				name
			}));
		}
	}
	/**
	* this is a no-op if there are already
	* @param address MUST be one of ours and MUST NOT be in the attendees array or set on _organizer
	* @private
	*/
	addOwnAttendee(address) {
		if (this.hasNotifyableOtherAttendees()) {
			console.log("can't change organizer if there are other invitees already");
			return;
		}
		const attendeeToAdd = createCalendarEventAttendee({
			address,
			status: CalendarAttendeeStatus.ACCEPTED
		});
		this._ownAttendee = attendeeToAdd;
		this._organizer = attendeeToAdd;
		if (!this.resolvedRecipients.has(address.address)) this.resolveAndCacheAddress(address).then(this.uiUpdateCallback);
		this.uiUpdateCallback();
	}
	/**
	*
	* @param address must NOT be one of ours.
	* @private
	*/
	addOtherAttendee(address) {
		if (this._ownAttendee == null) this.addOwnAttendee(this.ownMailAddresses[0]);
		address.address = cleanMailAddress(address.address);
		const previousAttendee = this.initialAttendees.get(address.address);
		if (previousAttendee != null) this._attendees.set(address.address, previousAttendee);
else this._attendees.set(address.address, createCalendarEventAttendee({
			address,
			status: CalendarAttendeeStatus.ADDED
		}));
		if (!this.resolvedRecipients.has(address.address)) this.resolveAndCacheAddress(address).then(this.uiUpdateCallback);
		this.uiUpdateCallback();
	}
	/**
	* remove a single attendee from the list.
	* * if it's the organizer AND there are other attendees, this is a no-op - if there are attendees, someone must be organizer (and it's us)
	* * if it's the organizer AND there are no other attendees, this sets the organizer and ownAttendee
	* * if it's not the organizer, but the last non-organizer attendee, only removes the attendee from the list, but the
	*   result will have an empty attendee list and no organizer if no other attendees are added in the meantime.
	* * if it's not the organizer but not the last non-organizer attendee, just removes that attendee from the list.
	* @param address the attendee to remove.
	*/
	removeAttendee(address) {
		const cleanRemoveAddress = cleanMailAddress(address);
		if (this._organizer?.address.address === cleanRemoveAddress) if (this._attendees.size > 0) {
			console.log("tried to remove organizer while there are other attendees, ignoring.");
			return;
		} else {
			this._organizer = null;
			this._ownAttendee = null;
			this.uiUpdateCallback();
		}
else if (this._attendees.has(cleanRemoveAddress)) {
			this._attendees.delete(cleanRemoveAddress);
			if (this._attendees.size === 0) {
				this._organizer = null;
				this._ownAttendee = null;
			}
			this.uiUpdateCallback();
		}
	}
	/**
	* modify your own attendance to the selected value.
	* is a no-op if we're not actually an attendee
	* @param status
	*/
	setOwnAttendance(status) {
		if (this._ownAttendee) this._ownAttendee.status = status;
	}
	setPresharedPassword(address, password) {
		this.externalPasswords.set(address, password);
	}
	/** for a stored address, get the preshared password and an indicator value for its strength */
	getPresharedPassword(address) {
		const password = this.externalPasswords.get(address) ?? "";
		const recipient = this.resolvedRecipients.get(address);
		const strength = recipient != null ? this.passwordStrengthModel(password, recipient) : 0;
		return {
			password,
			strength
		};
	}
	/**
	* return whether any of the attendees have a password set that warrants asking the user if they really want to use it.
	*
	* ignores empty passwords since those are always a hard fail when sending external mail.
	*/
	hasInsecurePasswords() {
		if (!this.isConfidential) return false;
		for (const g of this._attendees.values()) {
			const { password, strength } = this.getPresharedPassword(g.address.address);
			if (password === "" || isSecurePassword(strength)) continue;
			return true;
		}
		return false;
	}
	prepareSendModel(attendees) {
		if (!this._ownAttendee) return null;
		const recipients = attendees.map(({ address }) => address);
		const model = this.sendMailModelFactory();
		model.initWithTemplate([], "", "");
		for (const recipient of recipients) {
			model.addRecipient(RecipientField.BCC, recipient);
			if (this.externalPasswords.has(recipient.address)) {
				const password = assertNotNull(this.externalPasswords.get(recipient.address));
				model.setPassword(recipient.address, password);
			}
		}
		model.setSender(this._ownAttendee.address.address);
		model.setConfidential(this.isConfidential);
		return model;
	}
	prepareResponseModel() {
		if (this.eventType !== EventType.INVITE || this._ownAttendee === null || this._organizer == null || this._ownAttendee == null) return null;
		const initialOwnAttendeeStatus = assertNotNull(this.initialOwnAttendeeStatus, "somehow managed to become an attendee on an invite we weren't invited to before");
		if (!(initialOwnAttendeeStatus !== this._ownAttendee.status && this._ownAttendee.status !== CalendarAttendeeStatus.NEEDS_ACTION)) return null;
		const responseModel = this.sendMailModelFactory();
		if (this.responseTo != null) responseModel.initAsResponse({
			previousMail: this.responseTo,
			conversationType: ConversationType.REPLY,
			senderMailAddress: this._ownAttendee.address.address,
			recipients: [],
			attachments: [],
			bodyText: "",
			subject: "",
			replyTos: []
		}, new Map());
else responseModel.initWithTemplate({}, "", "");
		responseModel.addRecipient(RecipientField.TO, this._organizer.address);
		return responseModel;
	}
	get result() {
		if (this._selectedCalendar == null) throw new UserError("noCalendar_msg");
		const isOrganizer = this._organizer != null && this._ownAttendee?.address.address === this._organizer.address.address;
		const { kept: attendeesToUpdate, deleted: attendeesToCancel, added: attendeesToInvite } = getRecipientLists(this.initialAttendees, this._attendees, isOrganizer, this.isNew);
		const { allAttendees, organizerToPublish } = assembleAttendees(attendeesToInvite, attendeesToUpdate, this._organizer, this._ownAttendee);
		return {
			attendees: allAttendees,
			organizer: organizerToPublish,
			isConfidential: this.isConfidential,
			cancelModel: isOrganizer && attendeesToCancel.length > 0 ? this.prepareSendModel(attendeesToCancel) : null,
			inviteModel: isOrganizer && attendeesToInvite.length > 0 ? this.prepareSendModel(attendeesToInvite) : null,
			updateModel: isOrganizer && attendeesToUpdate.length > 0 && this.shouldSendUpdates ? this.prepareSendModel(attendeesToUpdate) : null,
			responseModel: !isOrganizer && organizerToPublish != null ? this.prepareResponseModel() : null,
			calendar: this._selectedCalendar
		};
	}
};
function getRecipientLists(initialAttendees, currentAttendees, isOrganizer, isNew) {
	if (!isOrganizer) return {
		added: [],
		deleted: [],
		kept: Array.from(initialAttendees.values())
	};
else if (isNew) return {
		added: Array.from(currentAttendees.values()),
		deleted: [],
		kept: []
	};
else return trisectingDiff(initialAttendees, currentAttendees);
}
/** get the list of attendees and the organizer address to publish.
* the array contains the organizer as an attendee.
*
* if there's only an organizer but no other attendees, no attendees or organizers are returned.
* */
function assembleAttendees(attendeesToInvite, attendeesToUpdate, organizer, ownAttendee) {
	if (organizer == null || attendeesToInvite.length + attendeesToUpdate.length === 0 && (ownAttendee == null || ownAttendee.address.address === organizer?.address.address)) return {
		allAttendees: [],
		organizerToPublish: null
	};
	const allAttendees = [];
	if (organizer.address.address !== ownAttendee?.address.address) allAttendees.push(organizer);
	if (ownAttendee != null) allAttendees.push(ownAttendee);
	allAttendees.push(...attendeesToUpdate);
	allAttendees.push(...attendeesToInvite);
	return {
		allAttendees,
		organizerToPublish: organizer.address
	};
}

//#endregion
//#region src/calendar-app/calendar/gui/eventeditor-model/CalendarEventAlarmModel.ts
var CalendarEventAlarmModel = class {
	_alarms = [];
	/** we can set reminders only if we're able to edit the event on the server because we have to add them to the entity. */
	canEditReminders;
	constructor(eventType, alarms = [], dateProvider, uiUpdateCallback = noOp) {
		this.dateProvider = dateProvider;
		this.uiUpdateCallback = uiUpdateCallback;
		this.canEditReminders = eventType === EventType.OWN || eventType === EventType.SHARED_RW || eventType === EventType.LOCKED || eventType === EventType.INVITE;
		this._alarms = [...alarms];
	}
	/**
	* @param trigger the interval to add.
	*/
	addAlarm(trigger) {
		if (trigger == null) return;
		const alreadyHasAlarm = this._alarms.some((e) => this.isEqualAlarms(trigger, e));
		if (alreadyHasAlarm) return;
		this._alarms.push(trigger);
		this.uiUpdateCallback();
	}
	/**
	* deactivate the alarm for the given interval.
	*/
	removeAlarm(alarmInterval) {
		remove(this._alarms, alarmInterval);
		this.uiUpdateCallback();
	}
	removeAll() {
		this._alarms.splice(0);
	}
	addAll(alarmIntervalList) {
		this._alarms.push(...alarmIntervalList);
	}
	get alarms() {
		return this._alarms;
	}
	get result() {
		return { alarms: Array.from(this._alarms.values()).map((t) => this.makeNewAlarm(t)) };
	}
	makeNewAlarm(alarmInterval) {
		return {
			alarmIdentifier: generateEventElementId(this.dateProvider.now()),
			trigger: serializeAlarmInterval(alarmInterval)
		};
	}
	/**
	* Compares two AlarmIntervals if they have the same duration
	* eg: 60 minutes === 1 hour
	* @param alarmOne base interval
	* @param alarmTwo interval to be compared with
	* @return true if they have the same duration
	*/
	isEqualAlarms(alarmOne, alarmTwo) {
		const luxonAlarmOne = Duration.fromDurationLike(alarmIntervalToLuxonDurationLikeObject(alarmOne)).shiftToAll();
		const luxonAlarmTwo = Duration.fromDurationLike(alarmIntervalToLuxonDurationLikeObject(alarmTwo)).shiftToAll();
		return luxonAlarmOne.equals(luxonAlarmTwo);
	}
};

//#endregion
//#region src/common/misc/SanitizedTextViewModel.ts
var SanitizedTextViewModel = class {
	sanitizedText = null;
	constructor(text, sanitizer, uiUpdateCallback = noOp) {
		this.text = text;
		this.sanitizer = sanitizer;
		this.uiUpdateCallback = uiUpdateCallback;
	}
	set content(v) {
		this.sanitizedText = null;
		this.text = v;
		this.uiUpdateCallback();
	}
	get content() {
		if (this.sanitizedText == null) this.sanitizedText = this.sanitizer.sanitizeHTML(this.text, { blockExternalContent: false }).html;
		return this.sanitizedText;
	}
};

//#endregion
//#region src/calendar-app/calendar/gui/eventeditor-model/CalendarNotificationModel.ts
var CalendarNotificationModel = class {
	constructor(notificationSender, loginController) {
		this.notificationSender = notificationSender;
		this.loginController = loginController;
	}
	/**
	* send all notifications required for the new event, determined by the contents of the sendModels parameter.
	*
	* will modify the attendee list of newEvent if invites/cancellations are sent.
	*/
	async send(event, recurrenceIds, sendModels) {
		if (sendModels.updateModel == null && sendModels.cancelModel == null && sendModels.inviteModel == null && sendModels.responseModel == null) return;
		if ((sendModels.updateModel != null || sendModels.cancelModel != null || sendModels.inviteModel != null) && !await hasPlanWithInvites(this.loginController)) {
			const { getAvailablePlansWithCalendarInvites } = await import("./SubscriptionUtils2-chunk.js");
			throw new UpgradeRequiredError("upgradeRequired_msg", await getAvailablePlansWithCalendarInvites());
		}
		const recurrenceTimes = recurrenceIds.map((date) => date.getTime());
		const originalExclusions = event.repeatRule?.excludedDates ?? [];
		const filteredExclusions = originalExclusions.filter(({ date }) => !recurrenceTimes.includes(date.getTime()));
		if (event.repeatRule != null) event.repeatRule.excludedDates = filteredExclusions;
		try {
			const invitePromise = sendModels.inviteModel != null ? this.sendInvites(event, sendModels.inviteModel) : Promise.resolve();
			const cancelPromise = sendModels.cancelModel != null ? this.sendCancellation(event, sendModels.cancelModel) : Promise.resolve();
			const updatePromise = sendModels.updateModel != null ? this.sendUpdates(event, sendModels.updateModel) : Promise.resolve();
			const responsePromise = sendModels.responseModel != null ? this.respondToOrganizer(event, sendModels.responseModel) : Promise.resolve();
			await Promise.all([
				invitePromise,
				cancelPromise,
				updatePromise,
				responsePromise
			]);
		} finally {
			if (event.repeatRule != null) event.repeatRule.excludedDates = originalExclusions;
		}
	}
	/**
	* invite all new attendees for an event and set their status from "ADDED" to "NEEDS_ACTION"
	* @param event will be modified if invites are sent.
	* @param inviteModel
	* @private
	*/
	async sendInvites(event, inviteModel) {
		if (event.organizer == null || inviteModel?.allRecipients().length === 0) throw new ProgrammingError("event has no organizer or no invitable attendees, can't send invites.");
		const newAttendees = getNonOrganizerAttendees(event).filter((a) => a.status === CalendarAttendeeStatus.ADDED);
		await inviteModel.waitForResolvedRecipients();
		if (event.invitedConfidentially != null) inviteModel.setConfidential(event.invitedConfidentially);
		await this.notificationSender.sendInvite(event, inviteModel);
		for (const attendee of newAttendees) if (attendee.status === CalendarAttendeeStatus.ADDED) attendee.status = CalendarAttendeeStatus.NEEDS_ACTION;
	}
	async sendCancellation(event, cancelModel) {
		const updatedEvent = clone(event);
		try {
			if (event.invitedConfidentially != null) cancelModel.setConfidential(event.invitedConfidentially);
			await this.notificationSender.sendCancellation(updatedEvent, cancelModel);
		} catch (e) {
			if (e instanceof TooManyRequestsError) throw new UserError("mailAddressDelay_msg");
else throw e;
		}
	}
	async sendUpdates(event, updateModel) {
		await updateModel.waitForResolvedRecipients();
		if (event.invitedConfidentially != null) updateModel.setConfidential(event.invitedConfidentially);
		await this.notificationSender.sendUpdate(event, updateModel);
	}
	/**
	* send a response mail to the organizer as stated on the original event. calling this for an event that is not an invite or
	* does not contain address as an attendee or that has no organizer is an error.
	* @param newEvent the event to send the update for, this should be identical to existingEvent except for the own status.
	* @param responseModel
	* @private
	*/
	async respondToOrganizer(newEvent, responseModel) {
		await responseModel.waitForResolvedRecipients();
		if (newEvent.invitedConfidentially != null) responseModel.setConfidential(newEvent.invitedConfidentially);
		await this.notificationSender.sendResponse(newEvent, responseModel);
		responseModel.dispose();
	}
};
async function hasPlanWithInvites(loginController) {
	const userController = loginController.getUserController();
	const { user } = userController;
	if (user.accountType === AccountType.FREE || user.accountType === AccountType.EXTERNAL) return false;
	const customer = await loginController.getUserController().loadCustomer();
	return (await userController.getPlanConfig()).eventInvites;
}

//#endregion
//#region src/calendar-app/calendar/gui/eventeditor-model/CalendarEventModelStrategy.ts
var CalendarEventApplyStrategies = class {
	constructor(calendarModel, logins, notificationModel, lazyRecurrenceIds, showProgress = identity, zone) {
		this.calendarModel = calendarModel;
		this.logins = logins;
		this.notificationModel = notificationModel;
		this.lazyRecurrenceIds = lazyRecurrenceIds;
		this.showProgress = showProgress;
		this.zone = zone;
	}
	/**
	* save a new event to the selected calendar, invite all attendees except for the organizer and set up alarms.
	*/
	async saveNewEvent(editModels) {
		const { eventValues, newAlarms, sendModels, calendar } = assembleCalendarEventEditResult(editModels);
		const uid = generateUid(calendar.group._id, Date.now());
		const newEvent = assignEventIdentity(eventValues, { uid });
		assertEventValidity(newEvent);
		const { groupRoot } = calendar;
		await this.showProgress((async () => {
			await this.notificationModel.send(newEvent, [], sendModels);
			await this.calendarModel.createEvent(newEvent, newAlarms, this.zone, groupRoot);
		})());
	}
	/** all instances of an event will be updated. if the recurrenceIds are invalidated (rrule or startTime changed),
	* will delete all altered instances and exclusions. */
	async saveEntireExistingEvent(editModelsForProgenitor, existingEvent) {
		const uid = assertNotNull(existingEvent.uid, "no uid to update existing event");
		assertNotNull(existingEvent?._id, "no id to update existing event");
		assertNotNull(existingEvent?._ownerGroup, "no ownerGroup to update existing event");
		assertNotNull(existingEvent?._permissions, "no permissions to update existing event");
		const { newEvent, calendar, newAlarms, sendModels } = assembleEditResultAndAssignFromExisting(existingEvent, editModelsForProgenitor, CalendarOperation.EditAll);
		const { groupRoot } = calendar;
		await this.showProgress((async () => {
			const recurrenceIds = await this.lazyRecurrenceIds(uid);
			await this.notificationModel.send(newEvent, recurrenceIds, sendModels);
			await this.calendarModel.updateEvent(newEvent, newAlarms, this.zone, groupRoot, existingEvent);
			const invalidateAlteredInstances = newEvent.repeatRule && newEvent.repeatRule.excludedDates.length === 0;
			const newDuration = editModelsForProgenitor.whenModel.duration;
			const index = await this.calendarModel.getEventsByUid(uid);
			if (index == null) return;
			for (const occurrence of index.alteredInstances) if (invalidateAlteredInstances) {
				editModelsForProgenitor.whoModel.shouldSendUpdates = true;
				const { sendModels: sendModels$1 } = assembleEditResultAndAssignFromExisting(occurrence, editModelsForProgenitor, CalendarOperation.EditThis);
				for (const recipient of sendModels$1.cancelModel?.allRecipients() ?? []) sendModels$1.updateModel?.addRecipient(RecipientField.BCC, recipient);
				sendModels$1.cancelModel = sendModels$1.updateModel;
				sendModels$1.updateModel = null;
				sendModels$1.inviteModel = null;
				await this.notificationModel.send(occurrence, [], sendModels$1);
				await this.calendarModel.deleteEvent(occurrence);
			} else {
				const { newEvent: newEvent$1, newAlarms: newAlarms$1, sendModels: sendModels$1 } = assembleEditResultAndAssignFromExisting(occurrence, editModelsForProgenitor, CalendarOperation.EditThis);
				newEvent$1.startTime = occurrence.startTime;
				newEvent$1.endTime = DateTime.fromJSDate(newEvent$1.startTime, { zone: this.zone }).plus(newDuration).toJSDate();
				newEvent$1.repeatRule = null;
				await this.notificationModel.send(newEvent$1, [], sendModels$1);
				await this.calendarModel.updateEvent(newEvent$1, newAlarms$1, this.zone, groupRoot, occurrence);
			}
		})());
	}
	async saveNewAlteredInstance({ editModels, editModelsForProgenitor, existingInstance, progenitor }) {
		await this.showProgress((async () => {
			const { newEvent, calendar, newAlarms, sendModels } = assembleEditResultAndAssignFromExisting(existingInstance, editModels, CalendarOperation.EditThis);
			await this.notificationModel.send(newEvent, [], sendModels);
			editModelsForProgenitor.whoModel.shouldSendUpdates = true;
			editModelsForProgenitor.whenModel.excludeDate(existingInstance.startTime);
			const { newEvent: newProgenitor, sendModels: progenitorSendModels, newAlarms: progenitorAlarms } = assembleEditResultAndAssignFromExisting(progenitor, editModelsForProgenitor, CalendarOperation.EditAll);
			const recurrenceIds = await this.lazyRecurrenceIds(progenitor.uid);
			recurrenceIds.push(existingInstance.startTime);
			await this.notificationModel.send(newProgenitor, recurrenceIds, progenitorSendModels);
			await this.calendarModel.updateEvent(newProgenitor, progenitorAlarms, this.zone, calendar.groupRoot, progenitor);
			const { groupRoot } = calendar;
			await this.calendarModel.createEvent(newEvent, newAlarms, this.zone, groupRoot);
		})());
	}
	async saveExistingAlteredInstance(editModels, existingInstance) {
		const { newEvent, calendar, newAlarms, sendModels } = assembleEditResultAndAssignFromExisting(existingInstance, editModels, CalendarOperation.EditThis);
		const { groupRoot } = calendar;
		await this.showProgress((async () => {
			await this.notificationModel.send(newEvent, [], sendModels);
			await this.calendarModel.updateEvent(newEvent, newAlarms, this.zone, groupRoot, existingInstance);
		})());
	}
	/** delete a whole event and all the instances generated by it */
	async deleteEntireExistingEvent(editModels, existingEvent) {
		editModels.whoModel.shouldSendUpdates = true;
		const { sendModels } = assembleCalendarEventEditResult(editModels);
		await this.showProgress((async () => {
			const alteredOccurrences = await this.calendarModel.getEventsByUid(assertNotNull(existingEvent.uid));
			if (alteredOccurrences) for (const occurrence of alteredOccurrences.alteredInstances) {
				if (occurrence.attendees.length === 0) continue;
				const { sendModels: sendModels$1 } = assembleEditResultAndAssignFromExisting(occurrence, editModels, CalendarOperation.DeleteAll);
				sendModels$1.cancelModel = sendModels$1.updateModel;
				sendModels$1.updateModel = null;
				await this.notificationModel.send(occurrence, [], sendModels$1);
			}
			sendModels.cancelModel = sendModels.updateModel;
			sendModels.updateModel = null;
			await this.notificationModel.send(existingEvent, [], sendModels);
			if (existingEvent.uid != null) await this.calendarModel.deleteEventsByUid(existingEvent.uid);
			await this.calendarModel.deleteEvent(existingEvent);
		})());
	}
	/** add an exclusion to the progenitor and send an update. */
	async excludeSingleInstance(editModelsForProgenitor, existingInstance, progenitor) {
		await this.showProgress((async () => {
			editModelsForProgenitor.whoModel.shouldSendUpdates = true;
			editModelsForProgenitor.whenModel.excludeDate(existingInstance.startTime);
			const { newEvent, sendModels, calendar, newAlarms } = assembleEditResultAndAssignFromExisting(progenitor, editModelsForProgenitor, CalendarOperation.DeleteThis);
			const recurrenceIds = await this.lazyRecurrenceIds(progenitor.uid);
			recurrenceIds.push(existingInstance.startTime);
			await this.notificationModel.send(newEvent, recurrenceIds, sendModels);
			await this.calendarModel.updateEvent(newEvent, newAlarms, this.zone, calendar.groupRoot, progenitor);
		})());
	}
	/** only remove a single altered instance from the server & the uid index. will not modify the progenitor. */
	async deleteAlteredInstance(editModels, existingAlteredInstance) {
		editModels.whoModel.shouldSendUpdates = true;
		const { sendModels } = assembleCalendarEventEditResult(editModels);
		sendModels.cancelModel = sendModels.updateModel;
		sendModels.updateModel = null;
		await this.showProgress((async () => {
			await this.notificationModel.send(existingAlteredInstance, [], sendModels);
			await this.calendarModel.deleteEvent(existingAlteredInstance);
		})());
	}
};

//#endregion
//#region src/common/misc/SimpleTextViewModel.ts
var SimpleTextViewModel = class {
	constructor(text, uiUpdateCallback = noOp) {
		this.text = text;
		this.uiUpdateCallback = uiUpdateCallback;
	}
	set content(text) {
		this.text = text;
		this.uiUpdateCallback();
	}
	get content() {
		return this.text;
	}
};

//#endregion
//#region src/calendar-app/calendar/gui/eventeditor-model/CalendarEventModel.ts
let EventType = function(EventType$1) {
	/** event in our own calendar and we are organizer */
	EventType$1["OWN"] = "own";
	/** event in shared calendar with read permission */
	EventType$1["SHARED_RO"] = "shared_ro";
	/** event in shared calendar with write permission, that has no attendees */
	EventType$1["SHARED_RW"] = "shared_rw";
	/** shared with write permissions, but we can't edit anything but alarms because it has attendees. might be something the calendar owner was invited to. */
	EventType$1["LOCKED"] = "locked";
	/** invite from calendar invitation which is not stored in calendar yet, or event stored in **own calendar** and we are not organizer. */
	EventType$1["INVITE"] = "invite";
	/** we are an external user and see an event in our mailbox */
	EventType$1["EXTERNAL"] = "external";
	return EventType$1;
}({});
let ReadonlyReason = function(ReadonlyReason$1) {
	/** it's a shared event, so at least the attendees are read-only */
	ReadonlyReason$1[ReadonlyReason$1["SHARED"] = 0] = "SHARED";
	/** this edit operation applies to only part of a series, so attendees and calendar are read-only */
	ReadonlyReason$1[ReadonlyReason$1["SINGLE_INSTANCE"] = 1] = "SINGLE_INSTANCE";
	/** the organizer is not the current user */
	ReadonlyReason$1[ReadonlyReason$1["NOT_ORGANIZER"] = 2] = "NOT_ORGANIZER";
	/** the event cannot be edited for an unspecified reason. This is the default value */
	ReadonlyReason$1[ReadonlyReason$1["UNKNOWN"] = 3] = "UNKNOWN";
	/** we can edit anything here */
	ReadonlyReason$1[ReadonlyReason$1["NONE"] = 4] = "NONE";
	return ReadonlyReason$1;
}({});
let CalendarOperation = function(CalendarOperation$1) {
	/** create a new event */
	CalendarOperation$1[CalendarOperation$1["Create"] = 0] = "Create";
	/** only apply an edit to only one particular instance of the series */
	CalendarOperation$1[CalendarOperation$1["EditThis"] = 1] = "EditThis";
	/** Delete a single instance from a series, altered or not */
	CalendarOperation$1[CalendarOperation$1["DeleteThis"] = 2] = "DeleteThis";
	/** apply the edit operation to all instances of the series*/
	CalendarOperation$1[CalendarOperation$1["EditAll"] = 3] = "EditAll";
	/** delete the whole series */
	CalendarOperation$1[CalendarOperation$1["DeleteAll"] = 4] = "DeleteAll";
	return CalendarOperation$1;
}({});
async function makeCalendarEventModel(operation, initialValues, recipientsModel, calendarModel, logins, mailboxDetail, mailboxProperties, sendMailModelFactory, notificationSender, entityClient, responseTo, zone = getTimeZone(), showProgress = identity, uiUpdateCallback = mithril_default.redraw) {
	const { htmlSanitizer } = await import("./HtmlSanitizer2-chunk.js");
	const ownMailAddresses = getOwnMailAddressesWithDefaultSenderInFront(logins, mailboxDetail, mailboxProperties);
	if (operation === CalendarOperation.DeleteAll || operation === CalendarOperation.EditAll) {
		assertNonNull(initialValues.uid, "tried to edit/delete all with nonexistent uid");
		const index = await calendarModel.getEventsByUid(initialValues.uid);
		if (index != null && index.progenitor != null) initialValues = index.progenitor;
	}
	const user = logins.getUserController().user;
	const [alarms, calendars] = await Promise.all([resolveAlarmsForEvent(initialValues.alarmInfos ?? [], calendarModel, user), calendarModel.getCalendarInfos()]);
	const selectedCalendar = getPreselectedCalendar(calendars, initialValues);
	const getPasswordStrength = (password, recipientInfo) => getPasswordStrengthForUser(password, recipientInfo, mailboxDetail, logins);
	const eventType = getEventType(initialValues, calendars, ownMailAddresses.map(({ address }) => address), logins.getUserController());
	const makeEditModels = (initializationEvent) => ({
		whenModel: new CalendarEventWhenModel(initializationEvent, zone, uiUpdateCallback),
		whoModel: new CalendarEventWhoModel(initializationEvent, eventType, operation, calendars, selectedCalendar, logins.getUserController(), operation === CalendarOperation.Create, ownMailAddresses, recipientsModel, responseTo, getPasswordStrength, sendMailModelFactory, uiUpdateCallback),
		alarmModel: new CalendarEventAlarmModel(eventType, alarms, new DefaultDateProvider(), uiUpdateCallback),
		location: new SimpleTextViewModel(initializationEvent.location, uiUpdateCallback),
		summary: new SimpleTextViewModel(initializationEvent.summary, uiUpdateCallback),
		description: new SanitizedTextViewModel(initializationEvent.description, htmlSanitizer, uiUpdateCallback)
	});
	const recurrenceIds = async (uid) => uid == null ? [] : (await calendarModel.getEventsByUid(uid))?.alteredInstances.map((i) => i.recurrenceId) ?? [];
	const notificationModel = new CalendarNotificationModel(notificationSender, logins);
	const applyStrategies = new CalendarEventApplyStrategies(calendarModel, logins, notificationModel, recurrenceIds, showProgress, zone);
	const initialOrDefaultValues = Object.assign(makeEmptyCalendarEvent(), initialValues);
	const cleanInitialValues = cleanupInitialValuesForEditing(initialOrDefaultValues);
	const progenitor = () => calendarModel.resolveCalendarEventProgenitor(cleanInitialValues);
	const strategy = await selectStrategy(makeEditModels, applyStrategies, operation, progenitor, createCalendarEvent(initialOrDefaultValues), cleanInitialValues);
	return strategy && new CalendarEventModel(strategy, eventType, operation, logins.getUserController(), notificationSender, entityClient, calendars);
}
async function selectStrategy(makeEditModels, applyStrategies, operation, resolveProgenitor, existingInstanceIdentity, cleanInitialValues) {
	let editModels;
	let apply;
	let mayRequireSendingUpdates;
	if (operation === CalendarOperation.Create) {
		editModels = makeEditModels(cleanInitialValues);
		apply = () => applyStrategies.saveNewEvent(editModels);
		mayRequireSendingUpdates = () => true;
	} else if (operation === CalendarOperation.EditThis) {
		cleanInitialValues.repeatRule = null;
		if (cleanInitialValues.recurrenceId == null) {
			const progenitor = await resolveProgenitor();
			if (progenitor == null || progenitor.repeatRule == null) {
				console.warn("no repeating progenitor during EditThis operation?");
				return null;
			}
			apply = () => applyStrategies.saveNewAlteredInstance({
				editModels,
				editModelsForProgenitor: makeEditModels(progenitor),
				existingInstance: existingInstanceIdentity,
				progenitor
			});
			mayRequireSendingUpdates = () => true;
			editModels = makeEditModels(cleanInitialValues);
		} else {
			editModels = makeEditModels(cleanInitialValues);
			apply = () => applyStrategies.saveExistingAlteredInstance(editModels, existingInstanceIdentity);
			mayRequireSendingUpdates = () => assembleEditResultAndAssignFromExisting(existingInstanceIdentity, editModels, operation).hasUpdateWorthyChanges;
		}
	} else if (operation === CalendarOperation.DeleteThis) if (cleanInitialValues.recurrenceId == null) {
		const progenitor = await resolveProgenitor();
		if (progenitor == null) return null;
		editModels = makeEditModels(progenitor);
		apply = () => applyStrategies.excludeSingleInstance(editModels, existingInstanceIdentity, progenitor);
		mayRequireSendingUpdates = () => true;
	} else {
		editModels = makeEditModels(cleanInitialValues);
		apply = () => applyStrategies.deleteAlteredInstance(editModels, existingInstanceIdentity);
		mayRequireSendingUpdates = () => true;
	}
else if (operation === CalendarOperation.EditAll) {
		const progenitor = await resolveProgenitor();
		if (progenitor == null) return null;
		editModels = makeEditModels(cleanInitialValues);
		apply = () => applyStrategies.saveEntireExistingEvent(editModels, progenitor);
		mayRequireSendingUpdates = () => assembleEditResultAndAssignFromExisting(existingInstanceIdentity, editModels, operation).hasUpdateWorthyChanges;
	} else if (operation === CalendarOperation.DeleteAll) {
		editModels = makeEditModels(cleanInitialValues);
		apply = () => applyStrategies.deleteEntireExistingEvent(editModels, existingInstanceIdentity);
		mayRequireSendingUpdates = () => assembleEditResultAndAssignFromExisting(existingInstanceIdentity, editModels, operation).hasUpdateWorthyChanges;
	} else throw new ProgrammingError(`unknown calendar operation: ${operation}`);
	return {
		apply,
		mayRequireSendingUpdates,
		editModels
	};
}
function getNonOrganizerAttendees({ organizer, attendees }) {
	if (attendees == null) return [];
	if (organizer == null) return attendees;
	const organizerAddress = cleanMailAddress(organizer.address);
	return attendees.filter((a) => cleanMailAddress(a.address.address) !== organizerAddress) ?? [];
}
var CalendarEventModel = class {
	processing = false;
	get editModels() {
		return this.strategy.editModels;
	}
	constructor(strategy, eventType, operation, userController, distributor, entityClient, calendars) {
		this.strategy = strategy;
		this.eventType = eventType;
		this.operation = operation;
		this.userController = userController;
		this.distributor = distributor;
		this.entityClient = entityClient;
		this.calendars = calendars;
		this.calendars = calendars;
	}
	async apply() {
		if (this.userController.user.accountType === AccountType.EXTERNAL) {
			console.log("did not apply event changes, we're an external user.");
			return EventSaveResult.Failed;
		}
		if (this.processing) return EventSaveResult.Failed;
		this.processing = true;
		try {
			await this.strategy.apply();
			return EventSaveResult.Saved;
		} catch (e) {
			if (e instanceof PayloadTooLargeError) throw new UserError("requestTooLarge_msg");
else if (e instanceof NotFoundError) return EventSaveResult.NotFound;
else throw e;
		} finally {
			this.processing = false;
		}
	}
	/** false if the event is only partially or not at all writable */
	isFullyWritable() {
		return this.eventType === EventType.OWN || this.eventType === EventType.SHARED_RW;
	}
	/** some edit operations apply to the whole event series.
	* they are not possible if the operation the model was created with only applies to a single instance.
	*
	* returns true if such operations can be attempted.
	* */
	canEditSeries() {
		return this.operation !== CalendarOperation.EditThis && (this.eventType === EventType.OWN || this.eventType === EventType.SHARED_RW);
	}
	canChangeCalendar() {
		return this.operation !== CalendarOperation.EditThis && (this.eventType === EventType.OWN || this.eventType === EventType.SHARED_RW || this.eventType === EventType.INVITE);
	}
	isAskingForUpdatesNeeded() {
		return this.eventType === EventType.OWN && !this.editModels.whoModel.shouldSendUpdates && this.editModels.whoModel.initiallyHadOtherAttendees && this.strategy.mayRequireSendingUpdates();
	}
	getReadonlyReason() {
		const isFullyWritable = this.isFullyWritable();
		const canEditSeries = this.canEditSeries();
		const canModifyGuests = this.editModels.whoModel.canModifyGuests;
		if (isFullyWritable && canEditSeries && canModifyGuests) return ReadonlyReason.NONE;
		if (!isFullyWritable && !canEditSeries && !canModifyGuests) return ReadonlyReason.NOT_ORGANIZER;
		if (!canModifyGuests) if (canEditSeries) return ReadonlyReason.SHARED;
else return ReadonlyReason.SINGLE_INSTANCE;
		return ReadonlyReason.UNKNOWN;
	}
};
function eventHasChanged(now, previous) {
	if (previous == null) return true;
	return now.startTime.getTime() !== previous?.startTime?.getTime() || now.description !== previous?.description || now.summary !== previous.summary || now.location !== previous.location || now.endTime.getTime() !== previous?.endTime?.getTime() || now.invitedConfidentially !== previous.invitedConfidentially || now.uid !== previous.uid || !areRepeatRulesEqual(now.repeatRule, previous?.repeatRule ?? null) || !arrayEqualsWithPredicate(now.attendees, previous?.attendees ?? [], (a1, a2) => a1.status === a2.status && cleanMailAddress(a1.address.address) === cleanMailAddress(a2.address.address)) || now.organizer !== previous.organizer && now.organizer?.address !== previous.organizer?.address;
}
function assembleCalendarEventEditResult(models) {
	const whenResult = models.whenModel.result;
	const whoResult = models.whoModel.result;
	const alarmResult = models.alarmModel.result;
	const summary = models.summary.content;
	const description = models.description.content;
	const location = models.location.content;
	return {
		eventValues: {
			startTime: whenResult.startTime,
			endTime: whenResult.endTime,
			repeatRule: whenResult.repeatRule,
			summary,
			description,
			location,
			invitedConfidentially: whoResult.isConfidential,
			organizer: whoResult.organizer,
			attendees: whoResult.attendees,
			alarmInfos: []
		},
		newAlarms: alarmResult.alarms,
		sendModels: whoResult,
		calendar: whoResult.calendar
	};
}
function assembleEditResultAndAssignFromExisting(existingEvent, editModels, operation) {
	const assembleResult = assembleCalendarEventEditResult(editModels);
	const { uid: oldUid, sequence: oldSequence, recurrenceId } = existingEvent;
	const newEvent = assignEventIdentity(assembleResult.eventValues, {
		uid: oldUid,
		sequence: incrementSequence(oldSequence),
		recurrenceId: operation === CalendarOperation.EditThis && recurrenceId == null ? existingEvent.startTime : recurrenceId
	});
	assertEventValidity(newEvent);
	newEvent._id = existingEvent._id;
	newEvent._ownerGroup = existingEvent._ownerGroup;
	newEvent._permissions = existingEvent._permissions;
	return {
		hasUpdateWorthyChanges: eventHasChanged(newEvent, existingEvent),
		newEvent,
		calendar: assembleResult.calendar,
		newAlarms: assembleResult.newAlarms,
		sendModels: assembleResult.sendModels
	};
}
function assignEventIdentity(values, identity$1) {
	return createCalendarEvent({
		sequence: "0",
		recurrenceId: null,
		hashedUid: null,
		...values,
		...identity$1
	});
}
async function resolveAlarmsForEvent(alarms, calendarModel, user) {
	const alarmInfos = await calendarModel.loadAlarms(alarms, user);
	return alarmInfos.map(({ alarmInfo }) => parseAlarmInterval(alarmInfo.trigger));
}
function makeEmptyCalendarEvent() {
	return {
		alarmInfos: [],
		invitedConfidentially: null,
		hashedUid: null,
		uid: null,
		recurrenceId: null,
		endTime: new Date(),
		summary: "",
		startTime: new Date(),
		location: "",
		repeatRule: null,
		description: "",
		attendees: [],
		organizer: null,
		sequence: ""
	};
}
function cleanupInitialValuesForEditing(initialValues) {
	const stripped = getStrippedClone(initialValues);
	const result = createCalendarEvent(stripped);
	result.alarmInfos = [];
	return result;
}
let EventSaveResult = function(EventSaveResult$1) {
	EventSaveResult$1[EventSaveResult$1["Saved"] = 0] = "Saved";
	EventSaveResult$1[EventSaveResult$1["Failed"] = 1] = "Failed";
	EventSaveResult$1[EventSaveResult$1["NotFound"] = 2] = "NotFound";
	return EventSaveResult$1;
}({});
/**
* return the calendar the given event belongs to, if any, otherwise get the first one from the given calendars.
* @param calendars must contain at least one calendar
* @param event
*/
function getPreselectedCalendar(calendars, event) {
	const ownerGroup = event?._ownerGroup ?? null;
	if (ownerGroup == null || !calendars.has(ownerGroup)) {
		const calendar = findFirstPrivateCalendar(calendars);
		if (!calendar) throw new Error("Can't find a private calendar");
		return calendar;
	} else return assertNotNull(calendars.get(ownerGroup), "invalid ownergroup for existing event?");
}
/** get the list of mail addresses that are enabled for this mailbox with the configured sender names
* will put the sender that matches the default sender address in the first spot. this enables us to use
* it as an easy default without having to pass it around separately */
function getOwnMailAddressesWithDefaultSenderInFront(logins, mailboxDetail, mailboxProperties) {
	const defaultSender = getDefaultSender(logins, mailboxDetail);
	const ownMailAddresses = mailboxProperties.mailAddressProperties.map(({ mailAddress, senderName }) => createEncryptedMailAddress({
		address: mailAddress,
		name: senderName
	}));
	const defaultIndex = ownMailAddresses.findIndex((address) => address.address === defaultSender);
	if (defaultIndex < 0) return ownMailAddresses;
	const defaultEncryptedMailAddress = ownMailAddresses.splice(defaultIndex, 1);
	return [...defaultEncryptedMailAddress, ...ownMailAddresses];
}

//#endregion
//#region src/calendar-app/calendar/gui/CalendarGuiUtils.ts
function renderCalendarSwitchLeftButton(label, click) {
	return mithril_default(IconButton, {
		title: label,
		icon: Icons.ArrowBackward,
		click
	});
}
function renderCalendarSwitchRightButton(label, click) {
	return mithril_default(IconButton, {
		title: label,
		icon: Icons.ArrowForward,
		click
	});
}
function weekTitle(date, weekStart) {
	const startOfTheWeekOffset = getStartOfTheWeekOffset(weekStart);
	const firstDate = getStartOfWeek(date, startOfTheWeekOffset);
	const lastDate = incrementDate(new Date(firstDate), 6);
	if (firstDate.getMonth() !== lastDate.getMonth()) {
		if (firstDate.getFullYear() !== lastDate.getFullYear()) return `${lang.formats.monthShortWithFullYear.format(firstDate)} - ${lang.formats.monthShortWithFullYear.format(lastDate)}`;
		return `${lang.formats.monthShort.format(firstDate)} - ${lang.formats.monthShort.format(lastDate)} ${lang.formats.yearNumeric.format(firstDate)}`;
	} else return `${lang.formats.monthLong.format(firstDate)} ${lang.formats.yearNumeric.format(firstDate)}`;
}
function calendarWeek(date, weekStart) {
	if (weekStart !== WeekStart.MONDAY) return null;
	return lang.get("weekNumber_label", { "{week}": String(getWeekNumber(date)) });
}
function calendarNavConfiguration(viewType, date, weekStart, titleType, switcher) {
	const onBack = () => switcher(viewType, false);
	const onForward = () => switcher(viewType, true);
	switch (viewType) {
		case CalendarViewType.DAY: return {
			back: renderCalendarSwitchLeftButton("prevDay_label", onBack),
			forward: renderCalendarSwitchRightButton("nextDay_label", onForward),
			title: titleType === "short" ? formatMonthWithFullYear(date) : formatDateWithWeekday(date)
		};
		case CalendarViewType.MONTH: return {
			back: renderCalendarSwitchLeftButton("prevMonth_label", onBack),
			forward: renderCalendarSwitchRightButton("nextMonth_label", onForward),
			title: formatMonthWithFullYear(date)
		};
		case CalendarViewType.WEEK: return {
			back: renderCalendarSwitchLeftButton("prevWeek_label", onBack),
			forward: renderCalendarSwitchRightButton("nextWeek_label", onForward),
			title: titleType === "short" ? formatMonthWithFullYear(date) : weekTitle(date, weekStart)
		};
		case CalendarViewType.AGENDA: return {
			back: renderCalendarSwitchLeftButton("prevDay_label", onBack),
			forward: renderCalendarSwitchRightButton("nextDay_label", onForward),
			title: titleType === "short" ? formatMonthWithFullYear(date) : formatDateWithWeekday(date)
		};
	}
}
function askIfShouldSendCalendarUpdatesToAttendees() {
	return new Promise((resolve) => {
		let alertDialog;
		const cancelButton = {
			label: "cancel_action",
			click: () => {
				resolve("cancel");
				alertDialog.close();
			},
			type: ButtonType.Secondary
		};
		const noButton = {
			label: "no_label",
			click: () => {
				resolve("no");
				alertDialog.close();
			},
			type: ButtonType.Secondary
		};
		const yesButton = {
			label: "yes_label",
			click: () => {
				resolve("yes");
				alertDialog.close();
			},
			type: ButtonType.Primary
		};
		const onclose = (positive) => positive ? resolve("yes") : resolve("cancel");
		alertDialog = Dialog.confirmMultiple("sendUpdates_msg", [
			cancelButton,
			noButton,
			yesButton
		], onclose);
	});
}
function getDateFromMousePos({ x, y, targetWidth, targetHeight }, weeks) {
	assert(weeks.length > 0, "Weeks must not be zero length");
	const unitHeight = targetHeight / weeks.length;
	const currentSquareY = Math.floor(y / unitHeight);
	const week = weeks[clamp(currentSquareY, 0, weeks.length - 1)];
	assert(week.length > 0, "Week must not be zero length");
	const unitWidth = targetWidth / week.length;
	const currentSquareX = Math.floor(x / unitWidth);
	return week[clamp(currentSquareX, 0, week.length - 1)];
}
function getTimeFromMousePos({ y, targetHeight }, hourDivision) {
	const sectionHeight = targetHeight / 24;
	const hour = y / sectionHeight;
	const hourRounded = Math.floor(hour);
	const minutesInc = 60 / hourDivision;
	const minute = Math.floor((hour - hourRounded) * hourDivision) * minutesInc;
	return new Time(hourRounded, minute);
}
const SELECTED_DATE_INDICATOR_THICKNESS = 4;
function getIconForViewType(viewType) {
	const lookupTable = {
		[CalendarViewType.DAY]: Icons.TableSingle,
		[CalendarViewType.WEEK]: Icons.TableColumns,
		[CalendarViewType.MONTH]: Icons.Table,
		[CalendarViewType.AGENDA]: Icons.ListUnordered
	};
	return lookupTable[viewType];
}
function shouldDefaultToAmPmTimeFormat() {
	return lang.code === "en";
}
function getCalendarMonth(date, firstDayOfWeekFromOffset, weekdayNarrowFormat) {
	const weeks = [[]];
	const calculationDate = getStartOfDay(date);
	calculationDate.setDate(1);
	const beginningOfMonth = new Date(calculationDate);
	let currentYear = calculationDate.getFullYear();
	let month = calculationDate.getMonth();
	let firstDay;
	if (firstDayOfWeekFromOffset > calculationDate.getDay()) firstDay = calculationDate.getDay() + 7 - firstDayOfWeekFromOffset;
else firstDay = calculationDate.getDay() - firstDayOfWeekFromOffset;
	let dayCount;
	incrementDate(calculationDate, -firstDay);
	for (dayCount = 0; dayCount < firstDay; dayCount++) {
		weeks[0].push({
			date: new Date(calculationDate),
			day: calculationDate.getDate(),
			month: calculationDate.getMonth(),
			year: calculationDate.getFullYear(),
			isPaddingDay: true
		});
		incrementDate(calculationDate, 1);
	}
	while (calculationDate.getMonth() === month) {
		if (weeks[0].length && dayCount % 7 === 0) weeks.push([]);
		const dayInfo = {
			date: new Date(currentYear, month, calculationDate.getDate()),
			year: currentYear,
			month,
			day: calculationDate.getDate(),
			isPaddingDay: false
		};
		weeks[weeks.length - 1].push(dayInfo);
		incrementDate(calculationDate, 1);
		dayCount++;
	}
	while (dayCount < 42) {
		if (dayCount % 7 === 0) weeks.push([]);
		weeks[weeks.length - 1].push({
			day: calculationDate.getDate(),
			year: calculationDate.getFullYear(),
			month: calculationDate.getMonth(),
			date: new Date(calculationDate),
			isPaddingDay: true
		});
		incrementDate(calculationDate, 1);
		dayCount++;
	}
	const weekdays = [];
	const weekdaysDate = new Date();
	incrementDate(weekdaysDate, -weekdaysDate.getDay() + firstDayOfWeekFromOffset);
	for (let i = 0; i < 7; i++) {
		weekdays.push(weekdayNarrowFormat ? lang.formats.weekdayNarrow.format(weekdaysDate) : lang.formats.weekdayShort.format(weekdaysDate));
		incrementDate(weekdaysDate, 1);
	}
	return {
		beginningOfMonth,
		weekdays,
		weeks
	};
}
function formatEventDuration(event, zone, includeTimezone) {
	if (isAllDayEvent(event)) {
		const startTime = getEventStart(event, zone);
		const startString = formatDateWithMonth(startTime);
		const endTime = incrementByRepeatPeriod(getEventEnd(event, zone), RepeatPeriod.DAILY, -1, zone);
		if (isSameDayOfDate(startTime, endTime)) return `${lang.get("allDay_label")}, ${startString}`;
else return `${lang.get("allDay_label")}, ${startString} - ${formatDateWithMonth(endTime)}`;
	} else {
		const startString = formatDateTime(event.startTime);
		let endString;
		if (isSameDay(event.startTime, event.endTime)) endString = formatTime(event.endTime);
else endString = formatDateTime(event.endTime);
		return `${startString} - ${endString} ${includeTimezone ? getTimeZone() : ""}`;
	}
}
const createRepeatRuleFrequencyValues = () => {
	return [
		{
			name: lang.get("calendarRepeatIntervalNoRepeat_label"),
			value: null
		},
		{
			name: lang.get("calendarRepeatIntervalDaily_label"),
			value: RepeatPeriod.DAILY
		},
		{
			name: lang.get("calendarRepeatIntervalWeekly_label"),
			value: RepeatPeriod.WEEKLY
		},
		{
			name: lang.get("calendarRepeatIntervalMonthly_label"),
			value: RepeatPeriod.MONTHLY
		},
		{
			name: lang.get("calendarRepeatIntervalAnnually_label"),
			value: RepeatPeriod.ANNUALLY
		}
	];
};
const createRepeatRuleOptions = () => {
	return [
		{
			name: "calendarRepeatIntervalNoRepeat_label",
			value: null
		},
		{
			name: "calendarRepeatIntervalDaily_label",
			value: RepeatPeriod.DAILY
		},
		{
			name: "calendarRepeatIntervalWeekly_label",
			value: RepeatPeriod.WEEKLY
		},
		{
			name: "calendarRepeatIntervalMonthly_label",
			value: RepeatPeriod.MONTHLY
		},
		{
			name: "calendarRepeatIntervalAnnually_label",
			value: RepeatPeriod.ANNUALLY
		},
		{
			name: "custom_label",
			value: "CUSTOM"
		}
	];
};
const customFrequenciesOptions = [
	{
		name: {
			singular: "day_label",
			plural: "days_label"
		},
		value: RepeatPeriod.DAILY
	},
	{
		name: {
			singular: "week_label",
			plural: "weeks_label"
		},
		value: RepeatPeriod.WEEKLY
	},
	{
		name: {
			singular: "month_label",
			plural: "months_label"
		},
		value: RepeatPeriod.MONTHLY
	},
	{
		name: {
			singular: "year_label",
			plural: "years_label"
		},
		value: RepeatPeriod.ANNUALLY
	}
];
const createCustomEndTypeOptions = () => {
	return [
		{
			name: "calendarRepeatStopConditionNever_label",
			value: EndType.Never
		},
		{
			name: "calendarRepeatStopConditionOccurrences_label",
			value: EndType.Count
		},
		{
			name: "calendarRepeatStopConditionDate_label",
			value: EndType.UntilDate
		}
	];
};
const createIntervalValues = () => numberRange(1, 256).map((n) => ({
	name: String(n),
	value: n,
	ariaValue: String(n)
}));
function humanDescriptionForAlarmInterval(value, locale) {
	if (value.value === 0) return lang.get("calendarReminderIntervalAtEventStart_label");
	return Duration.fromObject(alarmIntervalToLuxonDurationLikeObject(value)).reconfigure({ locale }).toHuman();
}
const createAlarmIntervalItems = (locale) => typedValues(StandardAlarmInterval).map((value) => {
	return {
		value,
		name: humanDescriptionForAlarmInterval(value, locale)
	};
});
const createAttendingItems = () => [
	{
		name: lang.get("attending_label"),
		value: CalendarAttendeeStatus.ACCEPTED,
		ariaValue: lang.get("attending_label")
	},
	{
		name: lang.get("maybeAttending_label"),
		value: CalendarAttendeeStatus.TENTATIVE,
		ariaValue: lang.get("maybeAttending_label")
	},
	{
		name: lang.get("notAttending_label"),
		value: CalendarAttendeeStatus.DECLINED,
		ariaValue: lang.get("notAttending_label")
	},
	{
		name: lang.get("pending_label"),
		value: CalendarAttendeeStatus.NEEDS_ACTION,
		selectable: false,
		ariaValue: lang.get("pending_label")
	}
];
function humanDescriptionForAlarmIntervalUnit(unit) {
	switch (unit) {
		case AlarmIntervalUnit.MINUTE: return lang.get("calendarReminderIntervalUnitMinutes_label");
		case AlarmIntervalUnit.HOUR: return lang.get("calendarReminderIntervalUnitHours_label");
		case AlarmIntervalUnit.DAY: return lang.get("calendarReminderIntervalUnitDays_label");
		case AlarmIntervalUnit.WEEK: return lang.get("calendarReminderIntervalUnitWeeks_label");
	}
}
function formatEventTime({ endTime, startTime }, showTime) {
	switch (showTime) {
		case EventTextTimeOption.START_TIME: return formatTime(startTime);
		case EventTextTimeOption.END_TIME: return ` - ${formatTime(endTime)}`;
		case EventTextTimeOption.START_END_TIME: return `${formatTime(startTime)} - ${formatTime(endTime)}`;
		default: throw new ProgrammingError(`Unknown time option: ${showTime}`);
	}
}
function formatEventTimes(day, event, zone) {
	if (isAllDayEvent(event)) return lang.get("allDay_label");
else {
		const startsBefore = eventStartsBefore(day, zone, event);
		const endsAfter = eventEndsAfterDay(day, zone, event);
		if (startsBefore && endsAfter) return lang.get("allDay_label");
else {
			const startTime = startsBefore ? day : event.startTime;
			const endTime = endsAfter ? getEndOfDayWithZone(day, zone) : event.endTime;
			return formatEventTime({
				startTime,
				endTime
			}, EventTextTimeOption.START_END_TIME);
		}
	}
}
const createCustomRepeatRuleUnitValues = () => {
	return [
		{
			name: humanDescriptionForAlarmIntervalUnit(AlarmIntervalUnit.MINUTE),
			value: AlarmIntervalUnit.MINUTE
		},
		{
			name: humanDescriptionForAlarmIntervalUnit(AlarmIntervalUnit.HOUR),
			value: AlarmIntervalUnit.HOUR
		},
		{
			name: humanDescriptionForAlarmIntervalUnit(AlarmIntervalUnit.DAY),
			value: AlarmIntervalUnit.DAY
		},
		{
			name: humanDescriptionForAlarmIntervalUnit(AlarmIntervalUnit.WEEK),
			value: AlarmIntervalUnit.WEEK
		}
	];
};
const CALENDAR_EVENT_HEIGHT = size.calendar_line_height + 2;
const TEMPORARY_EVENT_OPACITY = .7;
let EventLayoutMode = function(EventLayoutMode$1) {
	/** Take event start and end times into account when laying out. */
	EventLayoutMode$1[EventLayoutMode$1["TimeBasedColumn"] = 0] = "TimeBasedColumn";
	/** Each event is treated as if it would take the whole day when laying out. */
	EventLayoutMode$1[EventLayoutMode$1["DayBasedColumn"] = 1] = "DayBasedColumn";
	return EventLayoutMode$1;
}({});
function layOutEvents(events, zone, renderer, layoutMode) {
	events.sort((e1, e2) => {
		const e1Start = getEventStart(e1, zone);
		const e2Start = getEventStart(e2, zone);
		if (e1Start < e2Start) return -1;
		if (e1Start > e2Start) return 1;
		const e1End = getEventEnd(e1, zone);
		const e2End = getEventEnd(e2, zone);
		if (e1End < e2End) return -1;
		if (e1End > e2End) return 1;
		return 0;
	});
	let lastEventEnding = null;
	let lastEventStart = null;
	let columns = [];
	const children = [];
	const calcEvents = new Map();
	for (const e of events) {
		const calcEvent = getFromMap(calcEvents, e, () => getCalculationEvent(e, zone, layoutMode));
		if (lastEventEnding != null && lastEventStart != null && lastEventEnding <= calcEvent.startTime.getTime() && (layoutMode === EventLayoutMode.DayBasedColumn || !visuallyOverlaps(lastEventStart, lastEventEnding, calcEvent.startTime))) {
			children.push(...renderer(columns));
			columns = [];
			lastEventEnding = null;
			lastEventStart = null;
		}
		let placed = false;
		for (let i = 0; i < columns.length; i++) {
			const col = columns[i];
			const lastEvent = col[col.length - 1];
			const lastCalcEvent = getFromMap(calcEvents, lastEvent, () => getCalculationEvent(lastEvent, zone, layoutMode));
			if (!collidesWith(lastCalcEvent, calcEvent) && (layoutMode === EventLayoutMode.DayBasedColumn || !visuallyOverlaps(lastCalcEvent.startTime, lastCalcEvent.endTime, calcEvent.startTime))) {
				col.push(e);
				placed = true;
				break;
			}
		}
		if (!placed) columns.push([e]);
		if (lastEventEnding == null || lastEventEnding.getTime() < calcEvent.endTime.getTime()) lastEventEnding = calcEvent.endTime;
		if (lastEventStart == null || lastEventStart.getTime() < calcEvent.startTime.getTime()) lastEventStart = calcEvent.startTime;
	}
	children.push(...renderer(columns));
	return children;
}
/** get an event that can be rendered to the screen. in day view, the event is returned as-is, otherwise it's stretched to cover each day
* it occurs on completely. */
function getCalculationEvent(event, zone, eventLayoutMode) {
	if (eventLayoutMode === EventLayoutMode.DayBasedColumn) {
		const calcEvent = clone(event);
		if (isAllDayEvent(event)) {
			calcEvent.startTime = getAllDayDateForTimezone(event.startTime, zone);
			calcEvent.endTime = getAllDayDateForTimezone(event.endTime, zone);
		} else {
			calcEvent.startTime = getStartOfDayWithZone(event.startTime, zone);
			calcEvent.endTime = getStartOfNextDayWithZone(event.endTime, zone);
		}
		return calcEvent;
	} else return event;
}
/**
* This function checks whether two events collide based on their start and end time
* Assuming vertical columns with time going top-to-bottom, this would be true in these cases:
*
* case 1:
* +-----------+
* |           |
* |           |   +----------+
* +-----------+   |          |
*                 |          |
*                 +----------+
* case 2:
* +-----------+
* |           |   +----------+
* |           |   |          |
* |           |   +----------+
* +-----------+
*
* There could be a case where they are flipped vertically, but we don't have them because earlier events will be always first. so the "left" top edge will
* always be "above" the "right" top edge.
*/
function collidesWith(a, b) {
	return a.endTime.getTime() > b.startTime.getTime() && a.startTime.getTime() < b.endTime.getTime();
}
/**
* Due to the minimum height for events they overlap if a short event is directly followed by another event,
* therefore, we check whether the event height is less than the minimum height.
*
* This does not cover all the cases but handles the case when the second event starts right after the first one.
*/
function visuallyOverlaps(firstEventStart, firstEventEnd, secondEventStart) {
	const firstEventStartOnSameDay = isSameDay(firstEventStart, firstEventEnd) ? firstEventStart.getTime() : getStartOfDay(firstEventEnd).getTime();
	const eventDurationMs = firstEventEnd.getTime() - firstEventStartOnSameDay;
	const eventDurationHours = eventDurationMs / 36e5;
	const height = eventDurationHours * size.calendar_hour_height - size.calendar_event_border;
	return firstEventEnd.getTime() === secondEventStart.getTime() && height < size.calendar_line_height;
}
function expandEvent(ev, columnIndex, columns) {
	let colSpan = 1;
	for (let i = columnIndex + 1; i < columns.length; i++) {
		let col = columns[i];
		for (let j = 0; j < col.length; j++) {
			let ev1 = col[j];
			if (collidesWith(ev, ev1) || visuallyOverlaps(ev.startTime, ev.endTime, ev1.startTime)) return colSpan;
		}
		colSpan++;
	}
	return colSpan;
}
function getEventColor(event, groupColors) {
	return (event._ownerGroup && groupColors.get(event._ownerGroup)) ?? defaultCalendarColor;
}
function calendarAttendeeStatusSymbol(status) {
	switch (status) {
		case CalendarAttendeeStatus.ADDED:
		case CalendarAttendeeStatus.NEEDS_ACTION: return "";
		case CalendarAttendeeStatus.TENTATIVE: return "?";
		case CalendarAttendeeStatus.ACCEPTED: return "✓";
		case CalendarAttendeeStatus.DECLINED: return "❌";
		default: throw new Error("Unknown calendar attendee status: " + status);
	}
}
const iconForAttendeeStatus = Object.freeze({
	[CalendarAttendeeStatus.ACCEPTED]: Icons.CircleCheckmark,
	[CalendarAttendeeStatus.TENTATIVE]: Icons.CircleHelp,
	[CalendarAttendeeStatus.DECLINED]: Icons.CircleReject,
	[CalendarAttendeeStatus.NEEDS_ACTION]: Icons.CircleHelp,
	[CalendarAttendeeStatus.ADDED]: Icons.CircleHelp
});
const getGroupColors = memoized((userSettingsGroupRoot) => {
	return userSettingsGroupRoot.groupSettings.reduce((acc, { group, color }) => {
		if (!isValidColorCode("#" + color)) color = defaultCalendarColor;
		acc.set(group, color);
		return acc;
	}, new Map());
});
const getClientOnlyColors = (userId, clientOnlyCalendarsInfo) => {
	const colors = new Map();
	for (const [id, _] of CLIENT_ONLY_CALENDARS) {
		const calendarId = `${userId}#${id}`;
		colors.set(calendarId, clientOnlyCalendarsInfo.get(calendarId)?.color ?? DEFAULT_CLIENT_ONLY_CALENDAR_COLORS.get(id));
	}
	return colors;
};
const getClientOnlyCalendars = (userId, clientOnlyCalendarInfo) => {
	const userCalendars = [];
	for (const [id, key] of CLIENT_ONLY_CALENDARS) {
		const calendarId = `${userId}#${id}`;
		const calendar = clientOnlyCalendarInfo.get(calendarId);
		if (calendar) userCalendars.push({
			...calendar,
			id: calendarId,
			name: calendar.name ? calendar.name : lang.get(key)
		});
	}
	return userCalendars;
};
function getEventType(existingEvent, calendars, ownMailAddresses, userController) {
	const { user, userSettingsGroupRoot } = userController;
	if (user.accountType === AccountType.EXTERNAL) return EventType.EXTERNAL;
	const existingOrganizer = existingEvent.organizer;
	const isOrganizer = existingOrganizer != null && ownMailAddresses.some((a) => cleanMailAddress(a) === existingOrganizer.address);
	if (existingEvent._ownerGroup == null) if (existingOrganizer != null && !isOrganizer) return EventType.INVITE;
else return EventType.OWN;
	const calendarInfoForEvent = calendars.get(existingEvent._ownerGroup) ?? null;
	if (calendarInfoForEvent == null || calendarInfoForEvent.isExternal) return EventType.SHARED_RO;
	/**
	* if the event has a _ownerGroup, it means there is a calendar set to it
	* so, if the user is the owner of said calendar they are free to manage the event however they want
	**/
	if ((isOrganizer || existingOrganizer === null) && calendarInfoForEvent.userIsOwner) return EventType.OWN;
	if (calendarInfoForEvent.shared) {
		const canWrite = hasCapabilityOnGroup(user, calendarInfoForEvent.group, ShareCapability.Write);
		if (canWrite) {
			const organizerAddress = cleanMailAddress(existingOrganizer?.address ?? "");
			const wouldRequireUpdates = existingEvent.attendees != null && existingEvent.attendees.some((a) => cleanMailAddress(a.address.address) !== organizerAddress);
			return wouldRequireUpdates ? EventType.LOCKED : EventType.SHARED_RW;
		} else return EventType.SHARED_RO;
	}
	if (existingOrganizer == null || existingEvent.attendees?.length === 0 || isOrganizer) return EventType.OWN;
else return EventType.INVITE;
}
function shouldDisplayEvent(e, hiddenCalendars) {
	return !hiddenCalendars.has(assertNotNull(e._ownerGroup, "event without ownerGroup in getEventsOnDays"));
}
function daysHaveEvents(eventsOnDays) {
	return eventsOnDays.shortEventsPerDay.some(isNotEmpty) || isNotEmpty(eventsOnDays.longEvents);
}
function changePeriodOnWheel(callback) {
	return (event) => {
		callback(event.deltaY > 0 || event.deltaX > 0);
	};
}
async function showDeletePopup(model, ev, receiver, onClose) {
	if (await model.isRepeatingForDeleting()) createAsyncDropdown({
		lazyButtons: () => Promise.resolve([{
			label: "deleteSingleEventRecurrence_action",
			click: async () => {
				await model.deleteSingle();
				onClose?.();
			}
		}, {
			label: "deleteAllEventRecurrence_action",
			click: () => confirmDeleteClose(model, onClose)
		}]),
		width: 300
	})(ev, receiver);
else confirmDeleteClose(model, onClose);
}
async function confirmDeleteClose(model, onClose) {
	if (!await Dialog.confirm("deleteEventConfirmation_msg")) return;
	await model.deleteAll();
	onClose?.();
}
function getDisplayEventTitle(title) {
	return title ?? title !== "" ? title : lang.get("noTitle_label");
}
function generateRandomColor() {
	const model = new ColorPickerModel(!isColorLight(theme.content_bg));
	return hslToHex(model.getColor(Math.floor(Math.random() * MAX_HUE_ANGLE), 2));
}
function renderCalendarColor(selectedCalendar, groupColors) {
	const color = selectedCalendar ? groupColors.get(selectedCalendar.groupInfo.group) ?? defaultCalendarColor : null;
	return mithril_default(".mt-xs", { style: {
		width: "100px",
		height: "10px",
		background: color ? "#" + color : "transparent"
	} });
}

//#endregion
export { CALENDAR_EVENT_HEIGHT, CalendarEventModel, CalendarNotificationModel, CalendarOperation, EventLayoutMode, EventSaveResult, EventType, ReadonlyReason, SELECTED_DATE_INDICATOR_THICKNESS, TEMPORARY_EVENT_OPACITY, askIfShouldSendCalendarUpdatesToAttendees, assembleCalendarEventEditResult, assembleEditResultAndAssignFromExisting, assignEventIdentity, calendarAttendeeStatusSymbol, calendarNavConfiguration, calendarWeek, changePeriodOnWheel, createAlarmIntervalItems, createAttendingItems, createCustomEndTypeOptions, createCustomRepeatRuleUnitValues, createIntervalValues, createRepeatRuleFrequencyValues, createRepeatRuleOptions, customFrequenciesOptions, daysHaveEvents, eventHasChanged, expandEvent, formatEventDuration, formatEventTime, formatEventTimes, generateRandomColor, getCalendarMonth, getClientOnlyCalendars, getClientOnlyColors, getDateFromMousePos, getDisplayEventTitle, getEventColor, getEventType, getGroupColors, getIconForViewType, getNonOrganizerAttendees, getTimeFromMousePos, hasPlanWithInvites, humanDescriptionForAlarmInterval, humanDescriptionForAlarmIntervalUnit, iconForAttendeeStatus, layOutEvents, makeCalendarEventModel, renderCalendarColor, renderCalendarSwitchLeftButton, renderCalendarSwitchRightButton, shouldDefaultToAmPmTimeFormat, shouldDisplayEvent, showDeletePopup };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2FsZW5kYXJHdWlVdGlscy1jaHVuay5qcyIsIm5hbWVzIjpbImluaXRpYWxWYWx1ZXM6IFBhcnRpYWw8U3RyaXBwZWQ8Q2FsZW5kYXJFdmVudD4+IiwiZXZlbnRUeXBlOiBFdmVudFR5cGUiLCJvcGVyYXRpb246IENhbGVuZGFyT3BlcmF0aW9uIiwiY2FsZW5kYXJzOiBSZWFkb25seU1hcDxJZCwgQ2FsZW5kYXJJbmZvPiIsIl9zZWxlY3RlZENhbGVuZGFyOiBDYWxlbmRhckluZm8iLCJ1c2VyQ29udHJvbGxlcjogVXNlckNvbnRyb2xsZXIiLCJpc05ldzogYm9vbGVhbiIsIm93bk1haWxBZGRyZXNzZXM6IFJlYWRvbmx5QXJyYXk8RW5jcnlwdGVkTWFpbEFkZHJlc3M+IiwicmVjaXBpZW50c01vZGVsOiBSZWNpcGllbnRzTW9kZWwiLCJyZXNwb25zZVRvOiBNYWlsIHwgbnVsbCIsInBhc3N3b3JkU3RyZW5ndGhNb2RlbDogKHBhc3N3b3JkOiBzdHJpbmcsIHJlY2lwaWVudEluZm86IFBhcnRpYWxSZWNpcGllbnQpID0+IG51bWJlciIsInNlbmRNYWlsTW9kZWxGYWN0b3J5OiBsYXp5PFNlbmRNYWlsTW9kZWw+IiwidWlVcGRhdGVDYWxsYmFjazogKCkgPT4gdm9pZCIsInY6IENhbGVuZGFySW5mbyIsImdyb3VwU2V0dGluZ3M6IEdyb3VwU2V0dGluZ3NbXSIsImdyb3VwSWQ6IElkIiwiYTogUGFydGlhbFJlY2lwaWVudCIsInJlY2lwaWVudDogUmVjaXBpZW50IiwiYTogQ2FsZW5kYXJFdmVudEF0dGVuZGVlIiwiYWRkcmVzczogc3RyaW5nIiwiY29udGFjdDogQ29udGFjdCB8IG51bGwiLCJhZGRyZXNzOiBFbmNyeXB0ZWRNYWlsQWRkcmVzcyIsInN0YXR1czogQ2FsZW5kYXJBdHRlbmRlZVN0YXR1cyIsInBhc3N3b3JkOiBzdHJpbmciLCJhdHRlbmRlZXM6IFJlYWRvbmx5QXJyYXk8Q2FsZW5kYXJFdmVudEF0dGVuZGVlPiIsInJlc3BvbnNlTW9kZWw6IFNlbmRNYWlsTW9kZWwiLCJpbml0aWFsQXR0ZW5kZWVzOiBSZWFkb25seU1hcDx1bmtub3duLCBDYWxlbmRhckV2ZW50QXR0ZW5kZWU+IiwiY3VycmVudEF0dGVuZGVlczogUmVhZG9ubHlNYXA8dW5rbm93biwgQ2FsZW5kYXJFdmVudEF0dGVuZGVlPiIsImlzT3JnYW5pemVyOiBib29sZWFuIiwiYXR0ZW5kZWVzVG9JbnZpdGU6IFJlYWRvbmx5QXJyYXk8Q2FsZW5kYXJFdmVudEF0dGVuZGVlPiIsImF0dGVuZGVlc1RvVXBkYXRlOiBSZWFkb25seUFycmF5PENhbGVuZGFyRXZlbnRBdHRlbmRlZT4iLCJvcmdhbml6ZXI6IENhbGVuZGFyRXZlbnRBdHRlbmRlZSB8IG51bGwiLCJvd25BdHRlbmRlZTogQ2FsZW5kYXJFdmVudEF0dGVuZGVlIHwgbnVsbCIsImFsbEF0dGVuZGVlczogQXJyYXk8Q2FsZW5kYXJFdmVudEF0dGVuZGVlPiIsImV2ZW50VHlwZTogRXZlbnRUeXBlIiwiYWxhcm1zOiBBcnJheTxBbGFybUludGVydmFsPiIsImRhdGVQcm92aWRlcjogRGF0ZVByb3ZpZGVyIiwidWlVcGRhdGVDYWxsYmFjazogKCkgPT4gdm9pZCIsInRyaWdnZXI6IEFsYXJtSW50ZXJ2YWwgfCBudWxsIiwiYWxhcm1JbnRlcnZhbDogQWxhcm1JbnRlcnZhbCIsImFsYXJtSW50ZXJ2YWxMaXN0OiBBbGFybUludGVydmFsW10iLCJhbGFybU9uZTogQWxhcm1JbnRlcnZhbCIsImFsYXJtVHdvOiBBbGFybUludGVydmFsIiwidGV4dDogc3RyaW5nIiwic2FuaXRpemVyOiBIdG1sU2FuaXRpemVyIiwidWlVcGRhdGVDYWxsYmFjazogKCkgPT4gdm9pZCIsInY6IHN0cmluZyIsIm5vdGlmaWNhdGlvblNlbmRlcjogQ2FsZW5kYXJOb3RpZmljYXRpb25TZW5kZXIiLCJsb2dpbkNvbnRyb2xsZXI6IExvZ2luQ29udHJvbGxlciIsImV2ZW50OiBDYWxlbmRhckV2ZW50IiwicmVjdXJyZW5jZUlkczogQXJyYXk8RGF0ZT4iLCJzZW5kTW9kZWxzOiBDYWxlbmRhck5vdGlmaWNhdGlvblNlbmRNb2RlbHMiLCJpbnZpdGVNb2RlbDogU2VuZE1haWxNb2RlbCIsImNhbmNlbE1vZGVsOiBTZW5kTWFpbE1vZGVsIiwidXBkYXRlTW9kZWw6IFNlbmRNYWlsTW9kZWwiLCJuZXdFdmVudDogQ2FsZW5kYXJFdmVudCIsInJlc3BvbnNlTW9kZWw6IFNlbmRNYWlsTW9kZWwiLCJjYWxlbmRhck1vZGVsOiBDYWxlbmRhck1vZGVsIiwibG9naW5zOiBMb2dpbkNvbnRyb2xsZXIiLCJub3RpZmljYXRpb25Nb2RlbDogQ2FsZW5kYXJOb3RpZmljYXRpb25Nb2RlbCIsImxhenlSZWN1cnJlbmNlSWRzOiAodWlkPzogc3RyaW5nIHwgbnVsbCkgPT4gUHJvbWlzZTxBcnJheTxEYXRlPj4iLCJzaG93UHJvZ3Jlc3M6IFNob3dQcm9ncmVzc0NhbGxiYWNrIiwiem9uZTogc3RyaW5nIiwiZWRpdE1vZGVsczogQ2FsZW5kYXJFdmVudEVkaXRNb2RlbHMiLCJlZGl0TW9kZWxzRm9yUHJvZ2VuaXRvcjogQ2FsZW5kYXJFdmVudEVkaXRNb2RlbHMiLCJleGlzdGluZ0V2ZW50OiBDYWxlbmRhckV2ZW50IiwicmVjdXJyZW5jZUlkczogQXJyYXk8RGF0ZT4iLCJzZW5kTW9kZWxzIiwibmV3RXZlbnQiLCJuZXdBbGFybXMiLCJleGlzdGluZ0luc3RhbmNlOiBDYWxlbmRhckV2ZW50IiwicHJvZ2VuaXRvcjogQ2FsZW5kYXJFdmVudCIsImV4aXN0aW5nQWx0ZXJlZEluc3RhbmNlOiBDYWxlbmRhckV2ZW50IiwidGV4dDogc3RyaW5nIiwidWlVcGRhdGVDYWxsYmFjazogKCkgPT4gdm9pZCIsIm9wZXJhdGlvbjogQ2FsZW5kYXJPcGVyYXRpb24iLCJpbml0aWFsVmFsdWVzOiBQYXJ0aWFsPENhbGVuZGFyRXZlbnQ+IiwicmVjaXBpZW50c01vZGVsOiBSZWNpcGllbnRzTW9kZWwiLCJjYWxlbmRhck1vZGVsOiBDYWxlbmRhck1vZGVsIiwibG9naW5zOiBMb2dpbkNvbnRyb2xsZXIiLCJtYWlsYm94RGV0YWlsOiBNYWlsYm94RGV0YWlsIiwibWFpbGJveFByb3BlcnRpZXM6IE1haWxib3hQcm9wZXJ0aWVzIiwic2VuZE1haWxNb2RlbEZhY3Rvcnk6IGxhenk8U2VuZE1haWxNb2RlbD4iLCJub3RpZmljYXRpb25TZW5kZXI6IENhbGVuZGFyTm90aWZpY2F0aW9uU2VuZGVyIiwiZW50aXR5Q2xpZW50OiBFbnRpdHlDbGllbnQiLCJyZXNwb25zZVRvOiBNYWlsIHwgbnVsbCIsInpvbmU6IHN0cmluZyIsInNob3dQcm9ncmVzczogU2hvd1Byb2dyZXNzQ2FsbGJhY2siLCJ1aVVwZGF0ZUNhbGxiYWNrOiAoKSA9PiB2b2lkIiwibSIsInBhc3N3b3JkOiBzdHJpbmciLCJyZWNpcGllbnRJbmZvOiBQYXJ0aWFsUmVjaXBpZW50IiwiaW5pdGlhbGl6YXRpb25FdmVudDogQ2FsZW5kYXJFdmVudCIsInVpZD86IHN0cmluZyIsIm1ha2VFZGl0TW9kZWxzOiAoaTogU3RyaXBwZWRFbnRpdHk8Q2FsZW5kYXJFdmVudD4pID0+IENhbGVuZGFyRXZlbnRFZGl0TW9kZWxzIiwiYXBwbHlTdHJhdGVnaWVzOiBDYWxlbmRhckV2ZW50QXBwbHlTdHJhdGVnaWVzIiwicmVzb2x2ZVByb2dlbml0b3I6ICgpID0+IFByb21pc2U8Q2FsZW5kYXJFdmVudCB8IG51bGw+IiwiZXhpc3RpbmdJbnN0YW5jZUlkZW50aXR5OiBDYWxlbmRhckV2ZW50IiwiY2xlYW5Jbml0aWFsVmFsdWVzOiBTdHJpcHBlZEVudGl0eTxDYWxlbmRhckV2ZW50PiIsImVkaXRNb2RlbHM6IENhbGVuZGFyRXZlbnRFZGl0TW9kZWxzIiwiYXBwbHk6ICgpID0+IFByb21pc2U8dm9pZD4iLCJtYXlSZXF1aXJlU2VuZGluZ1VwZGF0ZXM6ICgpID0+IGJvb2xlYW4iLCJzdHJhdGVneTogQ2FsZW5kYXJFdmVudE1vZGVsU3RyYXRlZ3kiLCJldmVudFR5cGU6IEV2ZW50VHlwZSIsInVzZXJDb250cm9sbGVyOiBVc2VyQ29udHJvbGxlciIsImRpc3RyaWJ1dG9yOiBDYWxlbmRhck5vdGlmaWNhdGlvblNlbmRlciIsImNhbGVuZGFyczogUmVhZG9ubHlNYXA8SWQsIENhbGVuZGFySW5mbz4iLCJub3c6IENhbGVuZGFyRXZlbnQiLCJwcmV2aW91czogUGFydGlhbDxDYWxlbmRhckV2ZW50PiB8IG51bGwiLCJtb2RlbHM6IENhbGVuZGFyRXZlbnRFZGl0TW9kZWxzIiwiZXhpc3RpbmdFdmVudDogQ2FsZW5kYXJFdmVudCIsInZhbHVlczogQ2FsZW5kYXJFdmVudFZhbHVlcyIsImlkZW50aXR5OiBSZXF1aXJlPFwidWlkXCIsIFBhcnRpYWw8Q2FsZW5kYXJFdmVudElkZW50aXR5Pj4iLCJpZGVudGl0eSIsImFsYXJtczogQ2FsZW5kYXJFdmVudFtcImFsYXJtSW5mb3NcIl0iLCJ1c2VyOiBVc2VyIiwiaW5pdGlhbFZhbHVlczogU3RyaXBwZWRFbnRpdHk8Q2FsZW5kYXJFdmVudD4iLCJldmVudD86IFBhcnRpYWw8Q2FsZW5kYXJFdmVudD4gfCBudWxsIiwib3duZXJHcm91cDogc3RyaW5nIHwgbnVsbCIsImxhYmVsOiBUcmFuc2xhdGlvbktleSIsImNsaWNrOiAoKSA9PiB1bmtub3duIiwiZGF0ZTogRGF0ZSIsIndlZWtTdGFydDogV2Vla1N0YXJ0Iiwidmlld1R5cGU6IENhbGVuZGFyVmlld1R5cGUiLCJ0aXRsZVR5cGU6IFwic2hvcnRcIiB8IFwiZGV0YWlsZWRcIiIsInN3aXRjaGVyOiAodmlld1R5cGU6IENhbGVuZGFyVmlld1R5cGUsIG5leHQ6IGJvb2xlYW4pID0+IHVua25vd24iLCJhbGVydERpYWxvZzogRGlhbG9nIiwicG9zaXRpdmU6IGJvb2xlYW4iLCJ3ZWVrczogQXJyYXk8QXJyYXk8RGF0ZT4+IiwiaG91ckRpdmlzaW9uOiBudW1iZXIiLCJsb29rdXBUYWJsZTogUmVjb3JkPENhbGVuZGFyVmlld1R5cGUsIEFsbEljb25zPiIsImZpcnN0RGF5T2ZXZWVrRnJvbU9mZnNldDogbnVtYmVyIiwid2Vla2RheU5hcnJvd0Zvcm1hdDogYm9vbGVhbiIsIndlZWtzOiBBcnJheTxBcnJheTxDYWxlbmRhckRheT4+Iiwid2Vla2RheXM6IHN0cmluZ1tdIiwiZXZlbnQ6IENhbGVuZGFyRXZlbnRUaW1lcyIsInpvbmU6IHN0cmluZyIsImluY2x1ZGVUaW1lem9uZTogYm9vbGVhbiIsInZhbHVlOiBBbGFybUludGVydmFsIiwibG9jYWxlOiBzdHJpbmciLCJ1bml0OiBBbGFybUludGVydmFsVW5pdCIsInNob3dUaW1lOiBFdmVudFRleHRUaW1lT3B0aW9uIiwiZGF5OiBEYXRlIiwiZXZlbnQ6IENhbGVuZGFyRXZlbnQiLCJzdGFydFRpbWU6IERhdGUiLCJlbmRUaW1lOiBEYXRlIiwiQ0FMRU5EQVJfRVZFTlRfSEVJR0hUOiBudW1iZXIiLCJldmVudHM6IEFycmF5PENhbGVuZGFyRXZlbnQ+IiwicmVuZGVyZXI6IChjb2x1bW5zOiBBcnJheTxBcnJheTxDYWxlbmRhckV2ZW50Pj4pID0+IENoaWxkQXJyYXkiLCJsYXlvdXRNb2RlOiBFdmVudExheW91dE1vZGUiLCJsYXN0RXZlbnRFbmRpbmc6IERhdGUgfCBudWxsIiwibGFzdEV2ZW50U3RhcnQ6IERhdGUgfCBudWxsIiwiY29sdW1uczogQXJyYXk8QXJyYXk8Q2FsZW5kYXJFdmVudD4+IiwiY2hpbGRyZW46IEFycmF5PENoaWxkcmVuPiIsImV2ZW50TGF5b3V0TW9kZTogRXZlbnRMYXlvdXRNb2RlIiwiYTogQ2FsZW5kYXJFdmVudCIsImI6IENhbGVuZGFyRXZlbnQiLCJmaXJzdEV2ZW50U3RhcnQ6IERhdGUiLCJmaXJzdEV2ZW50RW5kOiBEYXRlIiwic2Vjb25kRXZlbnRTdGFydDogRGF0ZSIsImV2OiBDYWxlbmRhckV2ZW50IiwiY29sdW1uSW5kZXg6IG51bWJlciIsImdyb3VwQ29sb3JzOiBHcm91cENvbG9ycyIsInN0YXR1czogQ2FsZW5kYXJBdHRlbmRlZVN0YXR1cyIsImljb25Gb3JBdHRlbmRlZVN0YXR1czogUmVjb3JkPENhbGVuZGFyQXR0ZW5kZWVTdGF0dXMsIEFsbEljb25zPiIsInVzZXJTZXR0aW5nc0dyb3VwUm9vdDogVXNlclNldHRpbmdzR3JvdXBSb290IiwidXNlcklkOiBJZCIsImNsaWVudE9ubHlDYWxlbmRhcnNJbmZvOiBNYXA8SWQsIENsaWVudE9ubHlDYWxlbmRhcnNJbmZvPiIsImNvbG9yczogTWFwPElkLCBzdHJpbmc+IiwiY2xpZW50T25seUNhbGVuZGFySW5mbzogTWFwPElkLCBDbGllbnRPbmx5Q2FsZW5kYXJzSW5mbz4iLCJ1c2VyQ2FsZW5kYXJzOiAoQ2xpZW50T25seUNhbGVuZGFyc0luZm8gJiB7IGlkOiBzdHJpbmc7IG5hbWU6IHN0cmluZyB9KVtdIiwiZXhpc3RpbmdFdmVudDogUGFydGlhbDxDYWxlbmRhckV2ZW50PiIsImNhbGVuZGFyczogUmVhZG9ubHlNYXA8SWQsIENhbGVuZGFySW5mbz4iLCJvd25NYWlsQWRkcmVzc2VzOiBSZWFkb25seUFycmF5PHN0cmluZz4iLCJ1c2VyQ29udHJvbGxlcjogVXNlckNvbnRyb2xsZXIiLCJ3b3VsZFJlcXVpcmVVcGRhdGVzOiBib29sZWFuIiwiZTogQ2FsZW5kYXJFdmVudCIsImhpZGRlbkNhbGVuZGFyczogUmVhZG9ubHlTZXQ8SWQ+IiwiZXZlbnRzT25EYXlzOiBFdmVudHNPbkRheXMiLCJjYWxsYmFjazogKGlzTmV4dDogYm9vbGVhbikgPT4gdW5rbm93biIsImV2ZW50OiBXaGVlbEV2ZW50IiwibW9kZWw6IENhbGVuZGFyRXZlbnRQcmV2aWV3Vmlld01vZGVsIiwiZXY6IE1vdXNlRXZlbnQiLCJyZWNlaXZlcjogSFRNTEVsZW1lbnQiLCJvbkNsb3NlPzogKCkgPT4gdW5rbm93biIsInRpdGxlOiBzdHJpbmciLCJzZWxlY3RlZENhbGVuZGFyOiBDYWxlbmRhckluZm8gfCBudWxsIiwiZ3JvdXBDb2xvcnM6IE1hcDxJZCwgc3RyaW5nPiJdLCJzb3VyY2VzIjpbIi4uL3NyYy9jYWxlbmRhci1hcHAvY2FsZW5kYXIvZ3VpL2V2ZW50ZWRpdG9yLW1vZGVsL0NhbGVuZGFyRXZlbnRXaG9Nb2RlbC50cyIsIi4uL3NyYy9jYWxlbmRhci1hcHAvY2FsZW5kYXIvZ3VpL2V2ZW50ZWRpdG9yLW1vZGVsL0NhbGVuZGFyRXZlbnRBbGFybU1vZGVsLnRzIiwiLi4vc3JjL2NvbW1vbi9taXNjL1Nhbml0aXplZFRleHRWaWV3TW9kZWwudHMiLCIuLi9zcmMvY2FsZW5kYXItYXBwL2NhbGVuZGFyL2d1aS9ldmVudGVkaXRvci1tb2RlbC9DYWxlbmRhck5vdGlmaWNhdGlvbk1vZGVsLnRzIiwiLi4vc3JjL2NhbGVuZGFyLWFwcC9jYWxlbmRhci9ndWkvZXZlbnRlZGl0b3ItbW9kZWwvQ2FsZW5kYXJFdmVudE1vZGVsU3RyYXRlZ3kudHMiLCIuLi9zcmMvY29tbW9uL21pc2MvU2ltcGxlVGV4dFZpZXdNb2RlbC50cyIsIi4uL3NyYy9jYWxlbmRhci1hcHAvY2FsZW5kYXIvZ3VpL2V2ZW50ZWRpdG9yLW1vZGVsL0NhbGVuZGFyRXZlbnRNb2RlbC50cyIsIi4uL3NyYy9jYWxlbmRhci1hcHAvY2FsZW5kYXIvZ3VpL0NhbGVuZGFyR3VpVXRpbHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcblx0Q2FsZW5kYXJFdmVudCxcblx0Q2FsZW5kYXJFdmVudEF0dGVuZGVlLFxuXHRDb250YWN0LFxuXHRjcmVhdGVDYWxlbmRhckV2ZW50QXR0ZW5kZWUsXG5cdGNyZWF0ZUVuY3J5cHRlZE1haWxBZGRyZXNzLFxuXHRFbmNyeXB0ZWRNYWlsQWRkcmVzcyxcblx0R3JvdXBTZXR0aW5ncyxcblx0TWFpbCxcbn0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgUGFydGlhbFJlY2lwaWVudCwgUmVjaXBpZW50LCBSZWNpcGllbnRUeXBlIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL3JlY2lwaWVudHMvUmVjaXBpZW50LmpzXCJcbmltcG9ydCB7IGhhdmVTYW1lSWQsIFN0cmlwcGVkIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL0VudGl0eVV0aWxzLmpzXCJcbmltcG9ydCB7IGNsZWFuTWFpbEFkZHJlc3MsIGZpbmRSZWNpcGllbnRXaXRoQWRkcmVzcyB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9Db21tb25DYWxlbmRhclV0aWxzLmpzXCJcbmltcG9ydCB7IGFzc2VydE5vdE51bGwsIGNsb25lLCBkZWZlciwgRGVmZXJyZWRPYmplY3QsIGZpbmRBbGwsIGxhenksIG5vT3AsIHRyaXNlY3RpbmdEaWZmIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBDYWxlbmRhckF0dGVuZGVlU3RhdHVzLCBDb252ZXJzYXRpb25UeXBlLCBTaGFyZUNhcGFiaWxpdHkgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHMuanNcIlxuaW1wb3J0IHsgUmVjaXBpZW50c01vZGVsLCBSZXNvbHZlTW9kZSB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vYXBpL21haW4vUmVjaXBpZW50c01vZGVsLmpzXCJcbmltcG9ydCB7IEd1ZXN0IH0gZnJvbSBcIi4uLy4uL3ZpZXcvQ2FsZW5kYXJJbnZpdGVzLmpzXCJcbmltcG9ydCB7IGlzU2VjdXJlUGFzc3dvcmQgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL21pc2MvcGFzc3dvcmRzL1Bhc3N3b3JkVXRpbHMuanNcIlxuaW1wb3J0IHsgU2VuZE1haWxNb2RlbCB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vbWFpbEZ1bmN0aW9uYWxpdHkvU2VuZE1haWxNb2RlbC5qc1wiXG5pbXBvcnQgeyBDYWxlbmRhckluZm8gfSBmcm9tIFwiLi4vLi4vbW9kZWwvQ2FsZW5kYXJNb2RlbC5qc1wiXG5pbXBvcnQgeyBoYXNDYXBhYmlsaXR5T25Hcm91cCB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vc2hhcmluZy9Hcm91cFV0aWxzLmpzXCJcbmltcG9ydCB7IFVzZXJDb250cm9sbGVyIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9hcGkvbWFpbi9Vc2VyQ29udHJvbGxlci5qc1wiXG5pbXBvcnQgeyBVc2VyRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2FwaS9tYWluL1VzZXJFcnJvci5qc1wiXG5pbXBvcnQgeyBDYWxlbmRhck9wZXJhdGlvbiwgRXZlbnRUeXBlIH0gZnJvbSBcIi4vQ2FsZW5kYXJFdmVudE1vZGVsLmpzXCJcbmltcG9ydCB7IFByb2dyYW1taW5nRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vZXJyb3IvUHJvZ3JhbW1pbmdFcnJvci5qc1wiXG5pbXBvcnQgeyBDYWxlbmRhck5vdGlmaWNhdGlvblNlbmRNb2RlbHMgfSBmcm9tIFwiLi9DYWxlbmRhck5vdGlmaWNhdGlvbk1vZGVsLmpzXCJcbmltcG9ydCB7IGdldENvbnRhY3REaXNwbGF5TmFtZSB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vY29udGFjdHNGdW5jdGlvbmFsaXR5L0NvbnRhY3RVdGlscy5qc1wiXG5pbXBvcnQgeyBSZWNpcGllbnRGaWVsZCB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vbWFpbEZ1bmN0aW9uYWxpdHkvU2hhcmVkTWFpbFV0aWxzLmpzXCJcbmltcG9ydCB7IGhhc1NvdXJjZVVybCB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vY2FsZW5kYXIvZGF0ZS9DYWxlbmRhclV0aWxzXCJcbmltcG9ydCB7IGxhbmcgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWwuanNcIlxuXG4vKiogdGhlcmUgaXMgbm8gcG9pbnQgaW4gcmV0dXJuaW5nIHJlY2lwaWVudHMsIHRoZSBTZW5kTWFpbE1vZGVsIHdpbGwgcmUtcmVzb2x2ZSB0aGVtIGFueXdheS4gKi9cbnR5cGUgQXR0ZW5kYW5jZU1vZGVsUmVzdWx0ID0ge1xuXHRhdHRlbmRlZXM6IENhbGVuZGFyRXZlbnRbXCJhdHRlbmRlZXNcIl1cblx0b3JnYW5pemVyOiBDYWxlbmRhckV2ZW50W1wib3JnYW5pemVyXCJdXG5cdGlzQ29uZmlkZW50aWFsOiBib29sZWFuXG5cdC8qKiB3aGljaCBjYWxlbmRhciBzaG91bGQgdGhlIHJlc3VsdCBiZSBhc3NpZ25lZCB0byAqL1xuXHRjYWxlbmRhcjogQ2FsZW5kYXJJbmZvXG59ICYgQ2FsZW5kYXJOb3RpZmljYXRpb25TZW5kTW9kZWxzXG5cbi8qKiBtb2RlbCB0byBkZWNvdXBsZSBhdHRlbmRlZSBsaXN0IGVkaXQgb3BlcmF0aW9ucyBmcm9tIG90aGVyIGNoYW5nZXMgdG8gYSBjYWxlbmRhciBldmVudC5cbiAqIHRyYWNrcyBleHRlcm5hbCBwYXNzd29yZHMsIGF0dGVuZGFuY2Ugc3RhdHVzLCBsaXN0IG9mIGF0dGVuZGVlcywgcmVjaXBpZW50cyB0byBpbnZpdGUsXG4gKiB1cGRhdGUsIGNhbmNlbCBhbmQgdGhlIGNhbGVuZGFyIHRoZSBldmVudCBpcyBpbi5cbiAqL1xuZXhwb3J0IGNsYXNzIENhbGVuZGFyRXZlbnRXaG9Nb2RlbCB7XG5cdC8qKiB3ZSBuZWVkIHRvIHJlc29sdmUgcmVjaXBpZW50cyB0byBrbm93IGlmIHdlIG5lZWQgdG8gc2hvdyBhbiBleHRlcm5hbCBwYXNzd29yZCBmaWVsZC4gKi9cblx0cHJpdmF0ZSByZWFkb25seSByZXNvbHZlZFJlY2lwaWVudHM6IE1hcDxzdHJpbmcsIFJlY2lwaWVudD4gPSBuZXcgTWFwKClcblx0cHJpdmF0ZSBwZW5kaW5nUmVjaXBpZW50czogbnVtYmVyID0gMFxuXHRwcml2YXRlIF9yZWNpcGllbnRzU2V0dGxlZDogRGVmZXJyZWRPYmplY3Q8dm9pZD4gPSBkZWZlcigpXG5cdC8qKiBpdCdzIHBvc3NpYmxlIHRoYXQgdGhlIGNvbnN1bWVyIGNhcmVzIGFib3V0IGFsbCB0aGUgcmVjaXBpZW50IGluZm9ybWF0aW9uIGJlaW5nIHJlc29sdmVkLCBidXQgdGhhdCdzIG9ubHkgcG9zc2libGUgaW4gYW4gYXN5bmMgd2F5LiAqL1xuXHRnZXQgcmVjaXBpZW50c1NldHRsZWQoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0cmV0dXJuIHRoaXMuX3JlY2lwaWVudHNTZXR0bGVkLnByb21pc2Vcblx0fVxuXG5cdC8qKiBleHRlcm5hbCBwYXNzd29yZCBmb3IgYW4gZXh0ZXJuYWwgYXR0ZW5kZWUgd2l0aCBhbiBhZGRyZXNzICovXG5cdHByaXZhdGUgcmVhZG9ubHkgZXh0ZXJuYWxQYXNzd29yZHM6IE1hcDxzdHJpbmcsIHN0cmluZz4gPSBuZXcgTWFwKClcblxuXHQvKiogdG8ga25vdyB3aG8gdG8gdXBkYXRlLCB3ZSBuZWVkIHRvIGtub3cgd2hvIHdhcyBhbHJlYWR5IG9uIHRoZSBndWVzdCBsaXN0LlxuXHQgKiB3ZSBrZWVwIHRoZSBhdHRlbmRlZXMgaW4gbWFwcyBmb3IgZGVkdXBsaWNhdGlvbiwga2V5ZWQgYnkgdGhlaXIgYWRkcmVzcy5cblx0ICogKi9cblx0cHJpdmF0ZSBpbml0aWFsQXR0ZW5kZWVzOiBNYXA8c3RyaW5nLCBDYWxlbmRhckV2ZW50QXR0ZW5kZWU+ID0gbmV3IE1hcCgpXG5cdHByaXZhdGUgaW5pdGlhbE93bkF0dGVuZGVlU3RhdHVzOiBDYWxlbmRhckF0dGVuZGVlU3RhdHVzIHwgbnVsbCA9IG51bGxcblx0LyoqIHdlIG9ubHkgc2hvdyB0aGUgc2VuZCB1cGRhdGUgY2hlY2tib3ggaWYgdGhlcmUgYXJlIGF0dGVuZGVlcyB0aGF0IHJlcXVpcmUgdXBkYXRlcyBmcm9tIHVzLiAqL1xuXHRyZWFkb25seSBpbml0aWFsbHlIYWRPdGhlckF0dGVuZGVlczogYm9vbGVhblxuXHQvKiogdGhlIGN1cnJlbnQgbGlzdCBvZiBhdHRlbmRlZXMuICovXG5cdHByaXZhdGUgX2F0dGVuZGVlczogTWFwPHN0cmluZywgQ2FsZW5kYXJFdmVudEF0dGVuZGVlPiA9IG5ldyBNYXAoKVxuXHQvKiogb3JnYW5pemVyIE1VU1QgYmUgc2V0IGlmIF9vd25BdHRlbmRlZSBpcyAtIHdlJ3JlIGVpdGhlciBib3RoLCB3ZSdyZSBpbnZpdGVkIGFuZCBzb21lb25lIGVsc2UgaXMgb3JnYW5pemVyIG9yIHRoZXJlIGFyZSBubyBndWVzdHMgYXQgYWxsLiAqL1xuXHRwcml2YXRlIF9vcmdhbml6ZXI6IENhbGVuZGFyRXZlbnRBdHRlbmRlZSB8IG51bGwgPSBudWxsXG5cdC8qKiB0aGUgYXR0ZW5kZWUgdGhhdCBoYXMgb25lIG9mIG91ciBtYWlsIGFkZHJlc3Nlcy4gTVVTVCBOT1QgYmUgaW4gX2F0dGVuZGVlcyAqL1xuXHRwcml2YXRlIF9vd25BdHRlbmRlZTogQ2FsZW5kYXJFdmVudEF0dGVuZGVlIHwgbnVsbCA9IG51bGxcblxuXHRwdWJsaWMgaXNDb25maWRlbnRpYWw6IGJvb2xlYW5cblx0LyoqXG5cdCAqIHdoZXRoZXIgdGhpcyB1c2VyIHdpbGwgc2VuZCB1cGRhdGVzIGZvciB0aGlzIGV2ZW50LlxuXHQgKiAqIHRoaXMgbmVlZHMgdG8gYmUgb3VyIGV2ZW50LlxuXHQgKiAqIHdlIG5lZWQgYSBwYWlkIGFjY291bnRcblx0ICogKiB0aGVyZSBuZWVkIHRvIGJlIGNoYW5nZXMgdGhhdCByZXF1aXJlIHVwZGF0aW5nIHRoZSBhdHRlbmRlZXMgKGVnIGFsYXJtcyBkbyBub3QpXG5cdCAqICogdGhlcmUgYWxzbyBuZWVkIHRvIGJlIGF0dGVuZGVlcyB0aGF0IHJlcXVpcmUgdXBkYXRlcy9pbnZpdGVzL2NhbmNlbGxhdGlvbnMvcmVzcG9uc2Vcblx0ICovXG5cdHNob3VsZFNlbmRVcGRhdGVzOiBib29sZWFuID0gZmFsc2VcblxuXHQvKipcblx0ICpcblx0ICogQHBhcmFtIGluaXRpYWxWYWx1ZXNcblx0ICogQHBhcmFtIGV2ZW50VHlwZVxuXHQgKiBAcGFyYW0gb3BlcmF0aW9uIHRoZSBvcGVyYXRpb24gdGhlIHVzZXIgaXMgY3VycmVudGx5IGF0dGVtcHRpbmcuIHdlIGNvdWxkIHVzZSByZWN1cnJlbmNlSWQgb24gaW5pdGlhbHZhbHVlcyBmb3IgdGhpcyBpbmZvcm1hdGlvbiwgYnV0IHRoaXMgaXMgc2FmZXIuXG5cdCAqIEBwYXJhbSBjYWxlbmRhcnNcblx0ICogQHBhcmFtIF9zZWxlY3RlZENhbGVuZGFyXG5cdCAqIEBwYXJhbSB1c2VyQ29udHJvbGxlclxuXHQgKiBAcGFyYW0gaXNOZXcgd2hldGhlciB0aGUgZXZlbnQgaXMgbmV3IChuZXZlciBiZWVuIHNhdmVkKVxuXHQgKiBAcGFyYW0gb3duTWFpbEFkZHJlc3NlcyBhbiBhcnJheSBvZiB0aGUgbWFpbCBhZGRyZXNzZXMgdGhpcyB1c2VyIGNvdWxkIGJlIG1lbnRpb25lZCBhcyBhcyBhbiBhdHRlbmRlZSBvciBvcmdhbml6ZXIuXG5cdCAqIEBwYXJhbSByZWNpcGllbnRzTW9kZWxcblx0ICogQHBhcmFtIHJlc3BvbnNlVG9cblx0ICogQHBhcmFtIHBhc3N3b3JkU3RyZW5ndGhNb2RlbFxuXHQgKiBAcGFyYW0gc2VuZE1haWxNb2RlbEZhY3Rvcnlcblx0ICogQHBhcmFtIHVpVXBkYXRlQ2FsbGJhY2tcblx0ICovXG5cdGNvbnN0cnVjdG9yKFxuXHRcdGluaXRpYWxWYWx1ZXM6IFBhcnRpYWw8U3RyaXBwZWQ8Q2FsZW5kYXJFdmVudD4+LFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgZXZlbnRUeXBlOiBFdmVudFR5cGUsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBvcGVyYXRpb246IENhbGVuZGFyT3BlcmF0aW9uLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgY2FsZW5kYXJzOiBSZWFkb25seU1hcDxJZCwgQ2FsZW5kYXJJbmZvPixcblx0XHQvKiogdGhpcyBzaG91bGQgb25seSBiZSByZWxldmFudCB0byBzYXZpbmcgc28gY291bGQgYmUgcHV0IGluIHRoZSBhcHBseSBzdHJhdGVneSwgYnV0IGF0IHRoZSBtb21lbnQgd2UgcmVzdHJpY3QgYXR0ZW5kZWVzIGRlcGVuZGluZyBvbiB0aGVcblx0XHQgKiBjYWxlbmRhciB3ZSdyZSBzYXZpbmcgdG8uXG5cdFx0ICogdGhpbmsgb2YgaXQgYXMgY29uZmlndXJpbmcgd2hvIGhhcyBhY2Nlc3MgdG8gdGhlIGV2ZW50LlxuXHRcdCAqICovXG5cdFx0cHJpdmF0ZSBfc2VsZWN0ZWRDYWxlbmRhcjogQ2FsZW5kYXJJbmZvLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgdXNlckNvbnRyb2xsZXI6IFVzZXJDb250cm9sbGVyLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgaXNOZXc6IGJvb2xlYW4sXG5cdFx0cHJpdmF0ZSByZWFkb25seSBvd25NYWlsQWRkcmVzc2VzOiBSZWFkb25seUFycmF5PEVuY3J5cHRlZE1haWxBZGRyZXNzPixcblx0XHRwcml2YXRlIHJlYWRvbmx5IHJlY2lwaWVudHNNb2RlbDogUmVjaXBpZW50c01vZGVsLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgcmVzcG9uc2VUbzogTWFpbCB8IG51bGwsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBwYXNzd29yZFN0cmVuZ3RoTW9kZWw6IChwYXNzd29yZDogc3RyaW5nLCByZWNpcGllbnRJbmZvOiBQYXJ0aWFsUmVjaXBpZW50KSA9PiBudW1iZXIsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBzZW5kTWFpbE1vZGVsRmFjdG9yeTogbGF6eTxTZW5kTWFpbE1vZGVsPixcblx0XHRwcml2YXRlIHJlYWRvbmx5IHVpVXBkYXRlQ2FsbGJhY2s6ICgpID0+IHZvaWQgPSBub09wLFxuXHQpIHtcblx0XHR0aGlzLnNldHVwQXR0ZW5kZWVzKGluaXRpYWxWYWx1ZXMpXG5cdFx0Ly8gcmVzb2x2ZSBjdXJyZW50IHJlY2lwaWVudHMgc28gdGhhdCB3ZSBrbm93IHdoYXQgZXh0ZXJuYWwgcGFzc3dvcmRzIHRvIGRpc3BsYXlcblx0XHRjb25zdCByZXNvbHZlUHJvbWlzZXMgPSBpbml0aWFsVmFsdWVzLmF0dGVuZGVlcz8ubWFwKChhKSA9PiB0aGlzLnJlc29sdmVBbmRDYWNoZUFkZHJlc3MoYS5hZGRyZXNzKSkuY29uY2F0KCkgPz8gW11cblx0XHRpZiAoaW5pdGlhbFZhbHVlcy5vcmdhbml6ZXIpIHtcblx0XHRcdHJlc29sdmVQcm9taXNlcy5wdXNoKHRoaXMucmVzb2x2ZUFuZENhY2hlQWRkcmVzcyhpbml0aWFsVmFsdWVzLm9yZ2FuaXplcikpXG5cdFx0fVxuXHRcdFByb21pc2UuYWxsKHJlc29sdmVQcm9taXNlcykudGhlbih0aGlzLnVpVXBkYXRlQ2FsbGJhY2spXG5cblx0XHR0aGlzLmluaXRpYWxseUhhZE90aGVyQXR0ZW5kZWVzID0gdGhpcy5oYXNOb3RpZnlhYmxlT3RoZXJBdHRlbmRlZXMoKVxuXHRcdHRoaXMuaXNDb25maWRlbnRpYWwgPSBpbml0aWFsVmFsdWVzLmludml0ZWRDb25maWRlbnRpYWxseSA/PyBmYWxzZVxuXHR9XG5cblx0c2V0IHNlbGVjdGVkQ2FsZW5kYXIodjogQ2FsZW5kYXJJbmZvKSB7XG5cdFx0LyoqXG5cdFx0ICogd2hlbiBjaGFuZ2luZyB0aGUgY2FsZW5kYXIgb2YgYW4gZXZlbnQsIGlmIHRoZSB1c2VyIGlzIHRoZSBvcmdhbmlzZXJcblx0XHQgKiB0aGV5IGNhbiBsaW5rIGFueSBvZiB0aGVpciBvd25lZCBjYWxlbmRhcnMocHJpdmF0ZSBvciBzaGFyZWQpIHRvIHNhaWQgZXZlbnRcblx0XHQgKiBldmVuIGlmIHRoZSBldmVudCBoYXMgZ3Vlc3RzXG5cdFx0ICoqL1xuXHRcdGlmICghdi51c2VySXNPd25lciAmJiB2LnNoYXJlZCAmJiB0aGlzLl9hdHRlbmRlZXMuc2l6ZSA+IDApIHtcblx0XHRcdHRocm93IG5ldyBQcm9ncmFtbWluZ0Vycm9yKFwidHJpZWQgdG8gc2VsZWN0IHNoYXJlZCBjYWxlbmRhciB3aGlsZSB0aGVyZSBhcmUgZ3Vlc3RzLlwiKVxuXHRcdH0gZWxzZSBpZiAoIXYudXNlcklzT3duZXIgJiYgdi5zaGFyZWQgJiYgdGhpcy5pc05ldyAmJiB0aGlzLl9vcmdhbml6ZXIgIT0gbnVsbCkge1xuXHRcdFx0Ly8gZm9yIG5ldyBldmVudHMsIGl0J3MgcG9zc2libGUgdG8gaGF2ZSBhbiBvcmdhbml6ZXIgYnV0IG5vIGF0dGVuZGVlcyBpZiB5b3Ugb25seSBhZGQgeW91cnNlbGYuXG5cdFx0XHR0aGlzLl9vcmdhbml6ZXIgPSBudWxsXG5cdFx0fVxuXHRcdHRoaXMuX3NlbGVjdGVkQ2FsZW5kYXIgPSB2XG5cdFx0dGhpcy51aVVwZGF0ZUNhbGxiYWNrKClcblx0fVxuXG5cdGdldCBzZWxlY3RlZENhbGVuZGFyKCk6IENhbGVuZGFySW5mbyB7XG5cdFx0cmV0dXJuIHRoaXMuX3NlbGVjdGVkQ2FsZW5kYXJcblx0fVxuXG5cdC8qKlxuXHQgKiB3aGV0aGVyIHRoZSBjdXJyZW50IHVzZXIgY2FuIG1vZGlmeSB0aGUgZ3Vlc3QgbGlzdCBvZiB0aGUgZXZlbnQgZGVwZW5kaW5nIG9uIGV2ZW50IHR5cGUgYW5kIHRoZSBjYWxlbmRhciBpdCdzIGluLlxuXHQgKlxuXHQgKiAqIGF0IHRoZSBtb21lbnQsIHdlIGNhbiBuZXZlciBtb2RpZnkgZ3Vlc3RzIHdoZW4gZWRpdGluZyBvbmx5IHBhcnQgb2YgYSBzZXJpZXMuXG5cdCAqICogc2VsZWN0ZWQgY2FsZW5kYXIgaXMgb3VyIG93bjpcblx0ICogICAqIGV2ZW50IGlzIGludml0ZSAod2UncmUgbm90IG9yZ2FuaXplcik6IGNhbid0IG1vZGlmeSBndWVzdCBsaXN0LCBhbnkgZWRpdCBvcGVyYXRpb24gd2lsbCBiZSBsb2NhbCBvbmx5LlxuXHQgKiAgICogZXZlbnQgaXMgb3VyIG93bjogY2FuIGRvIHdoYXQgd2Ugd2FudC5cblx0ICogKiBpZiB0aGUgc2VsZWN0ZWQgY2FsZW5kYXIgaXMgYSBzaGFyZWQgb25lOlxuXHQgKiAgICogcm86IGRvbid0IHNob3cgZWRpdG9yIGF0IGFsbFxuXHQgKiAgICogcncsIG5ldyBldmVudDogZG9uJ3Qgc2hvdyBhdHRlbmRlZSBsaXN0IGVkaXRvciAtIHdlIGNhbid0IGludml0ZSBpbiBzaGFyZWQgY2FsZW5kYXJzLlxuXHQgKiAgICogcncsIGV4aXN0aW5nIGV2ZW50IHdpdGhvdXQgYXR0ZW5kZWVzOiBub3Qgb3VyIG93biBjYWxlbmRhciwgY2FuJ3QgaW52aXRlLCBkb24ndCBzaG93IGF0dGVuZGVlIGxpc3QuXG5cdCAqICAgKiBydywgZXhpc3RpbmcgZXZlbnQgd2l0aCBhdHRlbmRlZXM6ICB0aGlzIGlzIHRoZSBjYXNlIHdoZXJlIHdlIGNhbiBzZWUgYXR0ZW5kZWVzLCBidXQgY2FuJ3QgZWRpdCB0aGVtLlxuXHQgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnV0IHdlIGFsc28gY2FuJ3QgZWRpdCB0aGUgZXZlbnQgc2luY2UgdGhlcmUgYXJlIGF0dGVuZGVlcyBhbmQgd2UncmVcblx0ICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuYWJsZSB0byBzZW5kIHVwZGF0ZXMuXG5cdCAqL1xuXHRnZXQgY2FuTW9kaWZ5R3Vlc3RzKCk6IGJvb2xlYW4ge1xuXHRcdC8qKlxuXHRcdCAqIGlmIHRoZSB1c2VyIGlzIHRoZSBldmVudCdzIG9yZ2FuaXNlciBhbmQgdGhlIG93bmVyIG9mIGl0cyBsaW5rZWQgY2FsZW5kYXIsIHRoZSB1c2VyIGNhbiBtb2RpZnkgdGhlIGd1ZXN0cyBmcmVlbHlcblx0XHQgKiovXG5cdFx0Y29uc3QgdXNlcklzT3duZXIgPSB0aGlzLmV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLk9XTiAmJiB0aGlzLnNlbGVjdGVkQ2FsZW5kYXIudXNlcklzT3duZXJcblx0XHRyZXR1cm4gdXNlcklzT3duZXIgfHwgISh0aGlzLnNlbGVjdGVkQ2FsZW5kYXI/LnNoYXJlZCB8fCB0aGlzLmV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLklOVklURSB8fCB0aGlzLm9wZXJhdGlvbiA9PT0gQ2FsZW5kYXJPcGVyYXRpb24uRWRpdFRoaXMpXG5cdH1cblxuXHQvKipcblx0ICogZmlsdGVyIHRoZSBjYWxlbmRhcnMgYW4gZXZlbnQgY2FuIGJlIHNhdmVkIHRvIGRlcGVuZGluZyBvbiB0aGUgZXZlbnQgdHlwZSwgYXR0ZW5kZWUgc3RhdHVzIGFuZCBlZGl0IG9wZXJhdGlvbi5cblx0ICogUHJldmVudCBtb3ZpbmcgdGhlIGV2ZW50IHRvIGFub3RoZXIgY2FsZW5kYXIgaWYgeW91IG9ubHkgaGF2ZSByZWFkIHBlcm1pc3Npb24gb3IgaWYgdGhlIGV2ZW50IGhhcyBhdHRlbmRlZXMuXG5cdCAqICovXG5cdGdldEF2YWlsYWJsZUNhbGVuZGFycygpOiBSZWFkb25seUFycmF5PENhbGVuZGFySW5mbz4ge1xuXHRcdGNvbnN0IHsgZ3JvdXBTZXR0aW5ncyB9ID0gdGhpcy51c2VyQ29udHJvbGxlci51c2VyU2V0dGluZ3NHcm91cFJvb3Rcblx0XHRjb25zdCBjYWxlbmRhckFycmF5ID0gQXJyYXkuZnJvbSh0aGlzLmNhbGVuZGFycy52YWx1ZXMoKSkuZmlsdGVyKChjYWwpID0+ICF0aGlzLmlzRXh0ZXJuYWxDYWxlbmRhcihncm91cFNldHRpbmdzLCBjYWwuZ3JvdXAuX2lkKSlcblxuXHRcdGlmICh0aGlzLmV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLkxPQ0tFRCB8fCB0aGlzLm9wZXJhdGlvbiA9PT0gQ2FsZW5kYXJPcGVyYXRpb24uRWRpdFRoaXMpIHtcblx0XHRcdHJldHVybiBbdGhpcy5zZWxlY3RlZENhbGVuZGFyXVxuXHRcdH0gZWxzZSBpZiAodGhpcy5pc05ldyAmJiB0aGlzLl9hdHRlbmRlZXMuc2l6ZSA+IDApIHtcblx0XHRcdC8vIGlmIHdlIGFkZGVkIGd1ZXN0cywgd2UgY2Fubm90IHNlbGVjdCBhIHNoYXJlZCBjYWxlbmRhciB0byBjcmVhdGUgdGhlIGV2ZW50LlxuXHRcdFx0LyoqXG5cdFx0XHQgKiB3aGVuIGNoYW5naW5nIHRoZSBjYWxlbmRhciBvZiBhbiBldmVudCwgaWYgdGhlIHVzZXIgaXMgdGhlIG9yZ2FuaXNlclxuXHRcdFx0ICogdGhleSBjYW4gbGluayBhbnkgb2YgdGhlaXIgb3duZWQgY2FsZW5kYXJzKHByaXZhdGUgb3Igc2hhcmVkKSB0byBzYWlkIGV2ZW50XG5cdFx0XHQgKiBldmVuIGlmIHRoZSBldmVudCBoYXMgZ3Vlc3RzXG5cdFx0XHQgKiovXG5cdFx0XHRyZXR1cm4gY2FsZW5kYXJBcnJheS5maWx0ZXIoKGNhbGVuZGFySW5mbykgPT4gY2FsZW5kYXJJbmZvLnVzZXJJc093bmVyIHx8ICFjYWxlbmRhckluZm8uc2hhcmVkKVxuXHRcdH0gZWxzZSBpZiAodGhpcy5fYXR0ZW5kZWVzLnNpemUgPiAwICYmIHRoaXMuZXZlbnRUeXBlID09PSBFdmVudFR5cGUuT1dOKSB7XG5cdFx0XHRyZXR1cm4gY2FsZW5kYXJBcnJheS5maWx0ZXIoKGNhbGVuZGFySW5mbykgPT4gY2FsZW5kYXJJbmZvLnVzZXJJc093bmVyKVxuXHRcdH0gZWxzZSBpZiAodGhpcy5fYXR0ZW5kZWVzLnNpemUgPiAwIHx8IHRoaXMuZXZlbnRUeXBlID09PSBFdmVudFR5cGUuSU5WSVRFKSB7XG5cdFx0XHQvLyBXZSBkb24ndCBhbGxvdyBpbnZpdGluZyBpbiBhIHNoYXJlZCBjYWxlbmRhci5cblx0XHRcdC8vIElmIHdlIGhhdmUgYXR0ZW5kZWVzLCB3ZSBjYW5ub3Qgc2VsZWN0IGEgc2hhcmVkIGNhbGVuZGFyLlxuXHRcdFx0Ly8gV2UgYWxzbyBkb24ndCBhbGxvdyBhY2NlcHRpbmcgaW52aXRlcyBpbnRvIHNoYXJlZCBjYWxlbmRhcnMuXG5cdFx0XHRyZXR1cm4gY2FsZW5kYXJBcnJheS5maWx0ZXIoKGNhbGVuZGFySW5mbykgPT4gIWNhbGVuZGFySW5mby5zaGFyZWQgfHwgaGF2ZVNhbWVJZChjYWxlbmRhckluZm8uZ3JvdXAsIHRoaXMuc2VsZWN0ZWRDYWxlbmRhci5ncm91cCkpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBjYWxlbmRhckFycmF5LmZpbHRlcigoY2FsZW5kYXJJbmZvKSA9PiBoYXNDYXBhYmlsaXR5T25Hcm91cCh0aGlzLnVzZXJDb250cm9sbGVyLnVzZXIsIGNhbGVuZGFySW5mby5ncm91cCwgU2hhcmVDYXBhYmlsaXR5LldyaXRlKSlcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGlzRXh0ZXJuYWxDYWxlbmRhcihncm91cFNldHRpbmdzOiBHcm91cFNldHRpbmdzW10sIGdyb3VwSWQ6IElkKSB7XG5cdFx0Y29uc3QgZXhpc3RpbmdHcm91cFNldHRpbmdzID0gZ3JvdXBTZXR0aW5ncy5maW5kKChnYykgPT4gZ2MuZ3JvdXAgPT09IGdyb3VwSWQpXG5cdFx0cmV0dXJuIGhhc1NvdXJjZVVybChleGlzdGluZ0dyb3VwU2V0dGluZ3MpXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHJlc29sdmVBbmRDYWNoZUFkZHJlc3MoYTogUGFydGlhbFJlY2lwaWVudCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGlmICh0aGlzLnJlc29sdmVkUmVjaXBpZW50cy5oYXMoYS5hZGRyZXNzKSkgcmV0dXJuXG5cdFx0dGhpcy5wZW5kaW5nUmVjaXBpZW50cyA9IHRoaXMucGVuZGluZ1JlY2lwaWVudHMgKyAxXG5cdFx0Y29uc3QgcmVjaXBpZW50ID0gYXdhaXQgdGhpcy5yZWNpcGllbnRzTW9kZWwucmVzb2x2ZShhLCBSZXNvbHZlTW9kZS5FYWdlcikucmVzb2x2ZWQoKVxuXHRcdHRoaXMuY2FjaGVSZWNpcGllbnQocmVjaXBpZW50KVxuXHRcdHRoaXMucGVuZGluZ1JlY2lwaWVudHMgPSB0aGlzLnBlbmRpbmdSZWNpcGllbnRzIC0gMVxuXHRcdGlmICh0aGlzLnBlbmRpbmdSZWNpcGllbnRzID09PSAwKSB7XG5cdFx0XHR0aGlzLl9yZWNpcGllbnRzU2V0dGxlZC5yZXNvbHZlKClcblx0XHRcdHRoaXMuX3JlY2lwaWVudHNTZXR0bGVkID0gZGVmZXIoKVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgY2FjaGVSZWNpcGllbnQocmVjaXBpZW50OiBSZWNpcGllbnQpOiB2b2lkIHtcblx0XHR0aGlzLnJlc29sdmVkUmVjaXBpZW50cy5zZXQocmVjaXBpZW50LmFkZHJlc3MsIHJlY2lwaWVudClcblx0XHRpZiAocmVjaXBpZW50LnR5cGUgIT09IFJlY2lwaWVudFR5cGUuRVhURVJOQUwpIHJldHVyblxuXHRcdHRoaXMuZXh0ZXJuYWxQYXNzd29yZHMuc2V0KHJlY2lwaWVudC5hZGRyZXNzLCByZWNpcGllbnQuY29udGFjdD8ucHJlc2hhcmVkUGFzc3dvcmQgPz8gXCJcIilcblx0XHRpZiAocmVjaXBpZW50LmNvbnRhY3QgIT0gbnVsbCAmJiB0aGlzLl9hdHRlbmRlZXMuaGFzKHJlY2lwaWVudC5hZGRyZXNzKSkge1xuXHRcdFx0Y29uc3QgYXR0ZW5kZWUgPSB0aGlzLl9hdHRlbmRlZXMuZ2V0KHJlY2lwaWVudC5hZGRyZXNzKSFcblx0XHRcdGF0dGVuZGVlLmFkZHJlc3MubmFtZSA9IGdldENvbnRhY3REaXNwbGF5TmFtZShyZWNpcGllbnQuY29udGFjdClcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogaW50ZXJuYWxseSwgd2Ugd2FudCB0byBrZWVwIG91cnNlbHZlcyBhbmQgdGhlIG9yZ2FuaXplciBzZXBhcmF0ZSBmcm9tIHRoZSBvdGhlciBhdHRlbmRlZXNcblx0ICovXG5cdHByaXZhdGUgc2V0dXBBdHRlbmRlZXMoaW5pdGlhbFZhbHVlczogUGFydGlhbDxTdHJpcHBlZDxDYWxlbmRhckV2ZW50Pj4pIHtcblx0XHRjb25zdCBvd25BZGRyZXNzZXMgPSB0aGlzLm93bk1haWxBZGRyZXNzZXMubWFwKChhKSA9PiBjbGVhbk1haWxBZGRyZXNzKGEuYWRkcmVzcykpXG5cblx0XHQvLyBjb252ZXJ0IHRoZSBsaXN0IG9mIGF0dGVuZGVlcyBpbnRvIGEgbWFwIGZvciBlYXNpZXIgdXNlLlxuXHRcdGZvciAoY29uc3QgYSBvZiBpbml0aWFsVmFsdWVzLmF0dGVuZGVlcyA/PyBbXSkge1xuXHRcdFx0Y29uc3QgYXR0ZW5kZWUgPSBjcmVhdGVDYWxlbmRhckV2ZW50QXR0ZW5kZWUoe1xuXHRcdFx0XHRzdGF0dXM6IGEuc3RhdHVzLFxuXHRcdFx0XHRhZGRyZXNzOiBjcmVhdGVFbmNyeXB0ZWRNYWlsQWRkcmVzcyh7XG5cdFx0XHRcdFx0bmFtZTogYS5hZGRyZXNzLm5hbWUsXG5cdFx0XHRcdFx0YWRkcmVzczogY2xlYW5NYWlsQWRkcmVzcyhhLmFkZHJlc3MuYWRkcmVzcyksXG5cdFx0XHRcdH0pLFxuXHRcdFx0fSlcblx0XHRcdC8vIHdlIHdpbGwgcmVtb3ZlIG93biBhdHRlbmRlZXMgKyBvcmdhbml6ZXIgbGF0ZXIuXG5cdFx0XHR0aGlzLmluaXRpYWxBdHRlbmRlZXMuc2V0KGF0dGVuZGVlLmFkZHJlc3MuYWRkcmVzcywgYXR0ZW5kZWUpXG5cdFx0fVxuXG5cdFx0Ly8gZ2V0IHRoZSBvcmdhbml6ZXIgb3V0IG9mIHRoZSBhdHRlbmRlZXMgYW5kIGludG8gYSBzZXBhcmF0ZSBmaWVsZFxuXHRcdGNvbnN0IGluaXRpYWxPcmdhbml6ZXJBZGRyZXNzID1cblx0XHRcdGluaXRpYWxWYWx1ZXMub3JnYW5pemVyID09IG51bGxcblx0XHRcdFx0PyBudWxsXG5cdFx0XHRcdDogY3JlYXRlRW5jcnlwdGVkTWFpbEFkZHJlc3Moe1xuXHRcdFx0XHRcdFx0YWRkcmVzczogY2xlYW5NYWlsQWRkcmVzcyhpbml0aWFsVmFsdWVzLm9yZ2FuaXplci5hZGRyZXNzKSxcblx0XHRcdFx0XHRcdG5hbWU6IGluaXRpYWxWYWx1ZXMub3JnYW5pemVyLm5hbWUsXG5cdFx0XHRcdCAgfSlcblxuXHRcdGlmIChpbml0aWFsT3JnYW5pemVyQWRkcmVzcyAhPSBudWxsKSB7XG5cdFx0XHQvLyBjaGVjayBpZiB0aGUgb3JnYW5pemVyIGlzIGFsc28gaW4gdGhlIGF0dGVuZGVlcyBhcnJheSBhbmQgcmVtb3ZlIHRoZW0gaWYgc29cblx0XHRcdGNvbnN0IG9yZ2FuaXplckF0dGVuZGVlID0gdGhpcy5pbml0aWFsQXR0ZW5kZWVzLmdldChpbml0aWFsT3JnYW5pemVyQWRkcmVzcy5hZGRyZXNzKVxuXHRcdFx0dGhpcy5fb3JnYW5pemVyID1cblx0XHRcdFx0b3JnYW5pemVyQXR0ZW5kZWUgPz9cblx0XHRcdFx0Y3JlYXRlQ2FsZW5kYXJFdmVudEF0dGVuZGVlKHtcblx0XHRcdFx0XHRhZGRyZXNzOiBpbml0aWFsT3JnYW5pemVyQWRkcmVzcyxcblx0XHRcdFx0XHQvLyB0aGUgb3JnYW5pemVyIGFkZGVkIHRoZW1zZWx2ZXMsIGJ1dCBkaWQgbm90IHNwZWNpZnkgaWYgdGhleSdyZSBwYXJ0aWNpcGF0aW5nXG5cdFx0XHRcdFx0c3RhdHVzOiBDYWxlbmRhckF0dGVuZGVlU3RhdHVzLk5FRURTX0FDVElPTixcblx0XHRcdFx0fSlcblx0XHRcdHRoaXMuaW5pdGlhbEF0dGVuZGVlcy5kZWxldGUodGhpcy5fb3JnYW5pemVyLmFkZHJlc3MuYWRkcmVzcylcblx0XHR9XG5cblx0XHQvLyB3ZSBkb24ndCB3YW50IG91cnNlbHZlcyBpbiB0aGUgYXR0ZW5kZWUgbGlzdCwgc2luY2Ugd2UncmUgdXNpbmcgaXQgdG8gdHJhY2sgdXBkYXRlcyB3ZSBuZWVkIHRvIHNlbmQuXG5cdFx0Y29uc3Qgb3duQXR0ZW5kZWVBZGRyZXNzZXMgPSBmaW5kQWxsKEFycmF5LmZyb20odGhpcy5pbml0aWFsQXR0ZW5kZWVzLmtleXMoKSksIChhZGRyZXNzKSA9PiBvd25BZGRyZXNzZXMuaW5jbHVkZXMoYWRkcmVzcykpXG5cdFx0dGhpcy5fb3duQXR0ZW5kZWUgPSB0aGlzLmluaXRpYWxBdHRlbmRlZXMuZ2V0KG93bkF0dGVuZGVlQWRkcmVzc2VzWzBdKSA/PyBudWxsXG5cdFx0dGhpcy5pbml0aWFsT3duQXR0ZW5kZWVTdGF0dXMgPSAodGhpcy5fb3duQXR0ZW5kZWU/LnN0YXR1cyBhcyBDYWxlbmRhckF0dGVuZGVlU3RhdHVzKSA/PyBudWxsXG5cdFx0Zm9yIChjb25zdCBtYXRjaCBvZiBvd25BdHRlbmRlZUFkZHJlc3Nlcykge1xuXHRcdFx0dGhpcy5pbml0aWFsQXR0ZW5kZWVzLmRlbGV0ZShtYXRjaClcblx0XHR9XG5cblx0XHQvLyBzZXQgdXAgdGhlIGF0dGVuZGVlcyBtYXAgdGhhdCB0cmFja3MgdGhlIGFjdHVhbCBjaGFuZ2VzXG5cdFx0Zm9yIChjb25zdCBbaW5pdGlhbEF0dGVuZGVlQWRkcmVzcywgaW5pdGlhbEF0dGVuZGVlXSBvZiB0aGlzLmluaXRpYWxBdHRlbmRlZXMuZW50cmllcygpKSB7XG5cdFx0XHR0aGlzLl9hdHRlbmRlZXMuc2V0KGluaXRpYWxBdHRlbmRlZUFkZHJlc3MsIGNsb25lKGluaXRpYWxBdHRlbmRlZSkpXG5cdFx0fVxuXG5cdFx0Ly8gd2Ugbm93IGhhdmUgY2xlYW5lZCB2ZXJzaW9ucyBvZiBvcmdhbml6ZXIsIG93bkF0dGVuZGVlIGFuZCBvdGhlciBhdHRlbmRlZXMgaW4gc2VwYXJhdGUgZmllbGRzLlxuXHRcdC8vIG5vdyB0aGUgc2FuaXR5IGNoZWNrcy5cblxuXHRcdGlmICh0aGlzLl9vcmdhbml6ZXIgIT0gbnVsbCAmJiB0aGlzLl9hdHRlbmRlZXMuc2l6ZSA9PT0gMCAmJiB0aGlzLl9vd25BdHRlbmRlZSA9PSBudWxsKSB7XG5cdFx0XHQvLyBpZiB0aGVyZSBhcmUgbm8gYXR0ZW5kZWVzIGJlc2lkZXMgdGhlIG9yZ2FuaXplciwgdGhlIG9yZ2FuaXplciBtdXN0IG5vdCBiZSBzcGVjaWZpZWQuXG5cdFx0XHR0aGlzLl9vcmdhbml6ZXIgPSBudWxsXG5cdFx0fVxuXG5cdFx0aWYgKFxuXHRcdFx0dGhpcy5ldmVudFR5cGUgPT09IEV2ZW50VHlwZS5PV04gJiZcblx0XHRcdHRoaXMuX29yZ2FuaXplciAhPSBudWxsICYmXG5cdFx0XHQhb3duQWRkcmVzc2VzLmluY2x1ZGVzKHRoaXMuX29yZ2FuaXplci5hZGRyZXNzLmFkZHJlc3MpICYmXG5cdFx0XHRBcnJheS5mcm9tKHRoaXMuX2F0dGVuZGVlcy52YWx1ZXMoKSkuc29tZSgoYSkgPT4gYS5zdGF0dXMgIT09IENhbGVuZGFyQXR0ZW5kZWVTdGF0dXMuQURERUQpXG5cdFx0KSB7XG5cdFx0XHQvLyB0aGlzIGlzIHRlY2huaWNhbGx5IGFuIGludmFsaWQgc3RhdGUgbm93IHRoYXQgc2hvdWxkIG5vdCBoYXBwZW4gd2l0aCBuZXcgZXZlbnRzLlxuXHRcdFx0Ly8gd2UgcHJldmlvdXNseSBhc3NpZ25lZCB0aGUgZXZlbnQgY3JlYXRvciAod2hpY2ggbWlnaHQgbm90IGJlIHRoZSBjYWxlbmRhciBvd25lcikgdG8gdGhlIG9yZ2FuaXplciBmaWVsZCxcblx0XHRcdC8vIGV2ZW4gd2hlbiB0aGVyZSB3ZXJlIG5vIGF0dGVuZGVlcy5cblx0XHRcdGNvbnNvbGUud2FybihcImdvdCBhbiBldmVudCB3aXRoIGF0dGVuZGVlcyBhbmQgYW4gb3JnYW5pemVyIHRoYXQncyBub3QgdGhlIG93bmVyIG9mIHRoZSBjYWxlbmRhciwgcmVwbGFjaW5nIG9yZ2FuaXplci5cIilcblx0XHRcdHRoaXMuX2F0dGVuZGVlcy5zZXQodGhpcy5fb3JnYW5pemVyLmFkZHJlc3MuYWRkcmVzcywgdGhpcy5fb3JnYW5pemVyKVxuXHRcdFx0dGhpcy5fb3JnYW5pemVyID1cblx0XHRcdFx0dGhpcy5fb3duQXR0ZW5kZWUgPz9cblx0XHRcdFx0Y3JlYXRlQ2FsZW5kYXJFdmVudEF0dGVuZGVlKHtcblx0XHRcdFx0XHRhZGRyZXNzOiBjcmVhdGVFbmNyeXB0ZWRNYWlsQWRkcmVzcyh7XG5cdFx0XHRcdFx0XHRhZGRyZXNzOiBvd25BZGRyZXNzZXNbMF0sXG5cdFx0XHRcdFx0XHRuYW1lOiBcIlwiLFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdHN0YXR1czogQ2FsZW5kYXJBdHRlbmRlZVN0YXR1cy5BQ0NFUFRFRCxcblx0XHRcdFx0fSlcblx0XHR9XG5cblx0XHRpZiAoXG5cdFx0XHR0aGlzLl9vcmdhbml6ZXIgJiZcblx0XHRcdG93bkFkZHJlc3Nlcy5pbmNsdWRlcyh0aGlzLl9vcmdhbml6ZXIuYWRkcmVzcy5hZGRyZXNzKSAmJlxuXHRcdFx0dGhpcy5fb3JnYW5pemVyLmFkZHJlc3MuYWRkcmVzcyAhPT0gdGhpcy5fb3duQXR0ZW5kZWU/LmFkZHJlc3MuYWRkcmVzc1xuXHRcdCkge1xuXHRcdFx0Ly8gaWYgd2UncmUgdGhlIG9yZ2FuaXplciwgb3duQXR0ZW5kZWUgc2hvdWxkIGJlIHRoZSBzYW1lLiB3ZSBkb24ndCBtb2RpZnkgb3JnYW5pemVyIGhlcmUgYmVjYXVzZSBzb21lb25lIG1pZ2h0IGFscmVhZHkgaGF2ZSBzZW50IGludml0ZXMuXG5cdFx0XHR0aGlzLl9vd25BdHRlbmRlZSA9IHRoaXMuX29yZ2FuaXplclxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBmaWd1cmUgb3V0IGlmIHRoZXJlIGFyZSBjdXJyZW50bHkgb3RoZXIgcGVvcGxlIHRoYXQgbWlnaHQgbmVlZCB0byBiZSBub3RpZmllZCBpZiB0aGlzIGV2ZW50IGlzIG1vZGlmaWVkLlxuXHQgKiBhdHRlbmRlZXMgdGhhdCB3ZXJlIGp1c3QgYWRkZWQgYW5kIG5vdCBpbnZpdGVkIHlldCBhcmUgaWdub3JlZCBmb3IgdGhpcy5cblx0ICogQHByaXZhdGVcblx0ICovXG5cdHByaXZhdGUgaGFzTm90aWZ5YWJsZU90aGVyQXR0ZW5kZWVzKCkge1xuXHRcdHJldHVybiAoXG5cdFx0XHQvLyBpZiB0aGUgZXZlbnQgaXMgbmV3IHdlIGNhbiBkbyB3aGF0IHdlIHdhbnQgKG5vIGF0dGVuZGVlIHdhcyBub3RpZmllZCB5ZXQpXG5cdFx0XHQhdGhpcy5pc05ldyAmJlxuXHRcdFx0Ly8gaWYgdGhlIGV2ZW50IGlzIG5vdCBuZXcsIGJ1dCB0aGUgYXR0ZW5kZWUgbGlzdCBkaWQgbm90IGhhdmUgYW55IGF0dGVuZGVlcyB0aGF0IHdlcmUgYWxyZWFkeSBub3RpZmllZCxcblx0XHRcdC8vIHRoZXJlIGFyZSBubyBhdHRlbmRlZXMgdGhhdCBhcmUgbm90IGVpdGhlciB1cyBvciB0aGUgb3JnYW5pemVyXG5cdFx0XHRBcnJheS5mcm9tKHRoaXMuaW5pdGlhbEF0dGVuZGVlcy52YWx1ZXMoKSkuc29tZSgoYSkgPT4gYS5zdGF0dXMgIT09IENhbGVuZGFyQXR0ZW5kZWVTdGF0dXMuQURERUQpXG5cdFx0KVxuXHR9XG5cblx0Lypcblx0ICogcmV0dXJuIGEgbGlzdCBvZiBtYWlsIGFkZHJlc3NlcyB0aGF0IHdlIGNhbiBzZXQgYXMgYW4gb3JnYW5pemVyLlxuXHQgKi9cblx0Z2V0IHBvc3NpYmxlT3JnYW5pemVycygpOiBSZWFkb25seUFycmF5PEVuY3J5cHRlZE1haWxBZGRyZXNzPiB7XG5cdFx0aWYgKHRoaXMuZXZlbnRUeXBlICE9PSBFdmVudFR5cGUuT1dOKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fb3JnYW5pemVyID8gW3RoaXMuX29yZ2FuaXplci5hZGRyZXNzXSA6IFtdXG5cdFx0fSBlbHNlIGlmICghdGhpcy5oYXNOb3RpZnlhYmxlT3RoZXJBdHRlbmRlZXMoKSkge1xuXHRcdFx0Ly8gaWYgd2UgaGF2ZSBubyBhdHRlbmRlZXMgdGhhdCByZXF1aXJlIGFuIHVwZGF0ZSwgd2UgY2FuIHVzZSB3aGF0ZXZlciBhZGRyZXNzXG5cdFx0XHRyZXR1cm4gdGhpcy5vd25NYWlsQWRkcmVzc2VzXG5cdFx0fSBlbHNlIGlmICh0aGlzLl9vcmdhbml6ZXIgIT0gbnVsbCAmJiB0aGlzLm93bkd1ZXN0Py5hZGRyZXNzID09PSB0aGlzLl9vcmdhbml6ZXI/LmFkZHJlc3MuYWRkcmVzcykge1xuXHRcdFx0Ly8gaWYgdGhlcmUgYXJlIG90aGVyIGF0dGVuZGVlcyBhbmQgd2UgaGF2ZSBhbiBvcmdhbml6ZXIgdGhhdCdzIHVzLCB3ZSBtdXN0IHVzZSB0aGF0IG9yZ2FuaXplclxuXHRcdFx0Ly8gYmVjYXVzZSBjaGFuZ2luZyB0aGUgb3JnYW5pemVyIGFkZHJlc3MgYWZ0ZXIgdGhlIGF0dGVuZGVlcyB3ZXJlIGludml0ZWQgaXMgc3Vib3B0aW1hbC5cblx0XHRcdHJldHVybiBbdGhpcy5fb3JnYW5pemVyLmFkZHJlc3NdXG5cdFx0fSBlbHNlIGlmICh0aGlzLmV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLk9XTikge1xuXHRcdFx0cmV0dXJuIHRoaXMub3duTWFpbEFkZHJlc3Nlc1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBzb21ldGhpbmcgaXMgd3JvbmcuXG5cdFx0XHR0aHJvdyBuZXcgUHJvZ3JhbW1pbmdFcnJvcihcImNvdWxkIG5vdCBmaWd1cmUgb3V0IHdoaWNoIGFkZHJlc3NlcyBhcmUgYSB2YWxpZCBvcmdhbml6ZXIgZm9yIHRoaXMgZXZlbnQuXCIpXG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIGdldCBvdXIgb3duIGd1ZXN0LCBpZiBhbnlcblx0ICovXG5cdGdldCBvd25HdWVzdCgpOiBHdWVzdCB8IG51bGwge1xuXHRcdHJldHVybiB0aGlzLl9vd25BdHRlbmRlZSAmJiB0aGlzLmdldEd1ZXN0Rm9yQXR0ZW5kZWUodGhpcy5fb3duQXR0ZW5kZWUpXG5cdH1cblxuXHQvKipcblx0ICogZ2V0IHRoZSBjdXJyZW50IG9yZ2FuaXplciBvZiB0aGUgZXZlbnRcblx0ICpcblx0ICogdGhlcmUgaXMgbm8gc2V0dGVyIC0gaWYgd2UncmUgY2hhbmdpbmcgYXR0ZW5kZWVzLCB3ZSdyZSBlbnN1cmVkIHRvIGJlIHRoZSBvcmdhbml6ZXIuXG5cdCAqL1xuXHRnZXQgb3JnYW5pemVyKCk6IEd1ZXN0IHwgbnVsbCB7XG5cdFx0cmV0dXJuIHRoaXMuX29yZ2FuaXplciAmJiB0aGlzLmdldEd1ZXN0Rm9yQXR0ZW5kZWUodGhpcy5fb3JnYW5pemVyKVxuXHR9XG5cblx0LyoqXG5cdCAqIGEgbGlzdCBvZiB0aGUgYXR0ZW5kZWVzIG9mIHRoZSBldmVudCB0aGF0IGFyZSBub3QgdGhlIG9yZ2FuaXplciBvciBvdXJzZWx2ZXMsIHdpdGggdGhlaXIgc3RhdHVzIGFuZCB0eXBlXG5cdCAqL1xuXHRnZXQgZ3Vlc3RzKCk6IFJlYWRvbmx5QXJyYXk8R3Vlc3Q+IHtcblx0XHRyZXR1cm4gQXJyYXkuZnJvbSh0aGlzLl9hdHRlbmRlZXMudmFsdWVzKCkpLm1hcCgoYSkgPT4gdGhpcy5nZXRHdWVzdEZvckF0dGVuZGVlKGEpKVxuXHR9XG5cblx0cHJpdmF0ZSBnZXRHdWVzdEZvckF0dGVuZGVlKGE6IENhbGVuZGFyRXZlbnRBdHRlbmRlZSk6IEd1ZXN0IHtcblx0XHRpZiAodGhpcy5yZXNvbHZlZFJlY2lwaWVudHMuaGFzKGEuYWRkcmVzcy5hZGRyZXNzKSkge1xuXHRcdFx0Y29uc3QgcmVjaXBpZW50OiBSZWNpcGllbnQgPSB0aGlzLnJlc29sdmVkUmVjaXBpZW50cy5nZXQoYS5hZGRyZXNzLmFkZHJlc3MpIVxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0Li4ucmVjaXBpZW50LFxuXHRcdFx0XHRzdGF0dXM6IGEuc3RhdHVzIGFzIENhbGVuZGFyQXR0ZW5kZWVTdGF0dXMsXG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIHRoaXMgaXMgYSB0ZW1wb3Jhcnkgc2l0dWF0aW9uLCBhbiBhdHRlbmRlZSB0aGF0IGlzIHNldCBpbiB0aGlzIG1vZGVsXG5cdFx0XHQvLyB3aWxsIGJlIHJlc29sdmVkIHNvbWV0aW1lIGFmdGVyIGl0IHdhcyBhZGRlZC5cblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGFkZHJlc3M6IGEuYWRkcmVzcy5hZGRyZXNzLFxuXHRcdFx0XHRuYW1lOiBhLmFkZHJlc3MubmFtZSxcblx0XHRcdFx0c3RhdHVzOiBhLnN0YXR1cyBhcyBDYWxlbmRhckF0dGVuZGVlU3RhdHVzLFxuXHRcdFx0XHR0eXBlOiBSZWNpcGllbnRUeXBlLlVOS05PV04sXG5cdFx0XHRcdGNvbnRhY3Q6IG51bGwsXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIGFkZCBhIG1haWwgYWRkcmVzcyB0byB0aGUgbGlzdCBvZiBpbnZpdGVlcy5cblx0ICogdGhlIG9yZ2FuaXplciB3aWxsIGFsd2F5cyBiZSBzZXQgdG8gdGhlIGxhc3Qgb2YgdGhlIGN1cnJlbnQgdXNlcidzIG1haWwgYWRkcmVzc2VzIHRoYXQgaGFzIGJlZW4gYWRkZWQuXG5cdCAqXG5cdCAqIGlmIGFuIGF0dGVuZGVlIGlzIGRlbGV0ZWQgYW4gcmUtYWRkZWQsIHRoZSBzdGF0dXMgaXMgcmV0YWluZWQuXG5cdCAqXG5cdCAqIEBwYXJhbSBhZGRyZXNzIHRoZSBtYWlsIGFkZHJlc3MgdG8gc2VuZCB0aGUgaW52aXRlIHRvXG5cdCAqIEBwYXJhbSBjb250YWN0IGEgY29udGFjdCBmb3IgYSBkaXNwbGF5IG5hbWUuXG5cdCAqL1xuXHRhZGRBdHRlbmRlZShhZGRyZXNzOiBzdHJpbmcsIGNvbnRhY3Q6IENvbnRhY3QgfCBudWxsID0gbnVsbCk6IHZvaWQge1xuXHRcdGlmICghdGhpcy5jYW5Nb2RpZnlHdWVzdHMpIHtcblx0XHRcdHRocm93IG5ldyBVc2VyRXJyb3IobGFuZy5tYWtlVHJhbnNsYXRpb24oXCJjYW5ub3RBZGRBdHRlbmRlZXNfbXNnXCIsIFwiQ2Fubm90IGFkZCBhdHRlbmRlZXNcIikpXG5cdFx0fVxuXHRcdGNvbnN0IGNsZWFuQWRkcmVzcyA9IGNsZWFuTWFpbEFkZHJlc3MoYWRkcmVzcylcblx0XHQvLyBXZSBkb24ndCBhZGQgYW4gYXR0ZW5kZWUgaWYgdGhleSBhcmUgYWxyZWFkeSBhbiBhdHRlbmRlZVxuXHRcdGlmICh0aGlzLl9hdHRlbmRlZXMuaGFzKGNsZWFuQWRkcmVzcykgfHwgdGhpcy5fb3JnYW5pemVyPy5hZGRyZXNzLmFkZHJlc3MgPT09IGNsZWFuQWRkcmVzcyB8fCB0aGlzLl9vd25BdHRlbmRlZT8uYWRkcmVzcy5hZGRyZXNzID09PSBjbGVhbkFkZHJlc3MpIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblxuXHRcdGNvbnN0IG93bkF0dGVuZGVlID0gZmluZFJlY2lwaWVudFdpdGhBZGRyZXNzKHRoaXMub3duTWFpbEFkZHJlc3NlcywgY2xlYW5BZGRyZXNzKVxuXHRcdGlmIChvd25BdHRlbmRlZSAhPSBudWxsKSB7XG5cdFx0XHR0aGlzLmFkZE93bkF0dGVuZGVlKG93bkF0dGVuZGVlKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zdCBuYW1lID0gY29udGFjdCAhPSBudWxsID8gZ2V0Q29udGFjdERpc3BsYXlOYW1lKGNvbnRhY3QpIDogXCJcIlxuXHRcdFx0dGhpcy5hZGRPdGhlckF0dGVuZGVlKGNyZWF0ZUVuY3J5cHRlZE1haWxBZGRyZXNzKHsgYWRkcmVzczogY2xlYW5BZGRyZXNzLCBuYW1lIH0pKVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiB0aGlzIGlzIGEgbm8tb3AgaWYgdGhlcmUgYXJlIGFscmVhZHlcblx0ICogQHBhcmFtIGFkZHJlc3MgTVVTVCBiZSBvbmUgb2Ygb3VycyBhbmQgTVVTVCBOT1QgYmUgaW4gdGhlIGF0dGVuZGVlcyBhcnJheSBvciBzZXQgb24gX29yZ2FuaXplclxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0cHJpdmF0ZSBhZGRPd25BdHRlbmRlZShhZGRyZXNzOiBFbmNyeXB0ZWRNYWlsQWRkcmVzcyk6IHZvaWQge1xuXHRcdGlmICh0aGlzLmhhc05vdGlmeWFibGVPdGhlckF0dGVuZGVlcygpKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhcImNhbid0IGNoYW5nZSBvcmdhbml6ZXIgaWYgdGhlcmUgYXJlIG90aGVyIGludml0ZWVzIGFscmVhZHlcIilcblx0XHRcdHJldHVyblxuXHRcdH1cblx0XHRjb25zdCBhdHRlbmRlZVRvQWRkID0gY3JlYXRlQ2FsZW5kYXJFdmVudEF0dGVuZGVlKHsgYWRkcmVzcywgc3RhdHVzOiBDYWxlbmRhckF0dGVuZGVlU3RhdHVzLkFDQ0VQVEVEIH0pXG5cdFx0dGhpcy5fb3duQXR0ZW5kZWUgPSBhdHRlbmRlZVRvQWRkXG5cblx0XHQvLyBtYWtlIHN1cmUgdGhhdCB0aGUgb3JnYW5pemVyIG9uIHRoZSBldmVudCBpcyB0aGUgc2FtZSBhZGRyZXNzIGFzIHdlIGFkZGVkIGFzIGFuIG93biBhdHRlbmRlZS5cblx0XHR0aGlzLl9vcmdhbml6ZXIgPSBhdHRlbmRlZVRvQWRkXG5cdFx0aWYgKCF0aGlzLnJlc29sdmVkUmVjaXBpZW50cy5oYXMoYWRkcmVzcy5hZGRyZXNzKSkge1xuXHRcdFx0dGhpcy5yZXNvbHZlQW5kQ2FjaGVBZGRyZXNzKGFkZHJlc3MpLnRoZW4odGhpcy51aVVwZGF0ZUNhbGxiYWNrKVxuXHRcdH1cblx0XHR0aGlzLnVpVXBkYXRlQ2FsbGJhY2soKVxuXHR9XG5cblx0LyoqXG5cdCAqXG5cdCAqIEBwYXJhbSBhZGRyZXNzIG11c3QgTk9UIGJlIG9uZSBvZiBvdXJzLlxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0cHJpdmF0ZSBhZGRPdGhlckF0dGVuZGVlKGFkZHJlc3M6IEVuY3J5cHRlZE1haWxBZGRyZXNzKSB7XG5cdFx0aWYgKHRoaXMuX293bkF0dGVuZGVlID09IG51bGwpIHtcblx0XHRcdC8vIHdlJ3JlIGFkZGluZyBzb21lb25lIHRoYXQncyBub3QgdXMgd2hpbGUgd2UncmUgbm90IGFuIGF0dGVuZGVlLFxuXHRcdFx0Ly8gc28gd2UgYWRkIG91cnNlbHZlcyBhcyBhbiBhdHRlbmRlZSBhbmQgYXMgb3JnYW5pemVyLlxuXHRcdFx0dGhpcy5hZGRPd25BdHRlbmRlZSh0aGlzLm93bk1haWxBZGRyZXNzZXNbMF0pXG5cdFx0fVxuXG5cdFx0YWRkcmVzcy5hZGRyZXNzID0gY2xlYW5NYWlsQWRkcmVzcyhhZGRyZXNzLmFkZHJlc3MpXG5cdFx0Y29uc3QgcHJldmlvdXNBdHRlbmRlZSA9IHRoaXMuaW5pdGlhbEF0dGVuZGVlcy5nZXQoYWRkcmVzcy5hZGRyZXNzKVxuXG5cdFx0Ly8gIHdlIG5vdyBrbm93IHRoYXQgdGhpcyBhZGRyZXNzIGlzIG5vdCBpbiB0aGUgbGlzdCBhbmQgdGhhdCBpdCdzIGFsc29cblx0XHQvLyAgbm90IHVzIHVuZGVyIGFub3RoZXIgYWRkcmVzcyB0aGF0J3MgYWxyZWFkeSBhZGRlZCwgc28gd2UgY2FuIGp1c3QgYWRkIGl0LlxuXHRcdC8vICB3ZSByZXVzZSB0aGUgZW50cnkgZnJvbSB0aGUgaW5pdGlhbCBhdHRlbmRlZXMgaW4gY2FzZSB3ZSBhbHJlYWR5IGhhZCB0aGlzIGF0dGVuZGVlIGF0IHRoZSBzdGFydFxuXHRcdGlmIChwcmV2aW91c0F0dGVuZGVlICE9IG51bGwpIHtcblx0XHRcdHRoaXMuX2F0dGVuZGVlcy5zZXQoYWRkcmVzcy5hZGRyZXNzLCBwcmV2aW91c0F0dGVuZGVlKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLl9hdHRlbmRlZXMuc2V0KGFkZHJlc3MuYWRkcmVzcywgY3JlYXRlQ2FsZW5kYXJFdmVudEF0dGVuZGVlKHsgYWRkcmVzcywgc3RhdHVzOiBDYWxlbmRhckF0dGVuZGVlU3RhdHVzLkFEREVEIH0pKVxuXHRcdH1cblx0XHRpZiAoIXRoaXMucmVzb2x2ZWRSZWNpcGllbnRzLmhhcyhhZGRyZXNzLmFkZHJlc3MpKSB7XG5cdFx0XHR0aGlzLnJlc29sdmVBbmRDYWNoZUFkZHJlc3MoYWRkcmVzcykudGhlbih0aGlzLnVpVXBkYXRlQ2FsbGJhY2spXG5cdFx0fVxuXHRcdHRoaXMudWlVcGRhdGVDYWxsYmFjaygpXG5cdH1cblxuXHQvKipcblx0ICogcmVtb3ZlIGEgc2luZ2xlIGF0dGVuZGVlIGZyb20gdGhlIGxpc3QuXG5cdCAqICogaWYgaXQncyB0aGUgb3JnYW5pemVyIEFORCB0aGVyZSBhcmUgb3RoZXIgYXR0ZW5kZWVzLCB0aGlzIGlzIGEgbm8tb3AgLSBpZiB0aGVyZSBhcmUgYXR0ZW5kZWVzLCBzb21lb25lIG11c3QgYmUgb3JnYW5pemVyIChhbmQgaXQncyB1cylcblx0ICogKiBpZiBpdCdzIHRoZSBvcmdhbml6ZXIgQU5EIHRoZXJlIGFyZSBubyBvdGhlciBhdHRlbmRlZXMsIHRoaXMgc2V0cyB0aGUgb3JnYW5pemVyIGFuZCBvd25BdHRlbmRlZVxuXHQgKiAqIGlmIGl0J3Mgbm90IHRoZSBvcmdhbml6ZXIsIGJ1dCB0aGUgbGFzdCBub24tb3JnYW5pemVyIGF0dGVuZGVlLCBvbmx5IHJlbW92ZXMgdGhlIGF0dGVuZGVlIGZyb20gdGhlIGxpc3QsIGJ1dCB0aGVcblx0ICogICByZXN1bHQgd2lsbCBoYXZlIGFuIGVtcHR5IGF0dGVuZGVlIGxpc3QgYW5kIG5vIG9yZ2FuaXplciBpZiBubyBvdGhlciBhdHRlbmRlZXMgYXJlIGFkZGVkIGluIHRoZSBtZWFudGltZS5cblx0ICogKiBpZiBpdCdzIG5vdCB0aGUgb3JnYW5pemVyIGJ1dCBub3QgdGhlIGxhc3Qgbm9uLW9yZ2FuaXplciBhdHRlbmRlZSwganVzdCByZW1vdmVzIHRoYXQgYXR0ZW5kZWUgZnJvbSB0aGUgbGlzdC5cblx0ICogQHBhcmFtIGFkZHJlc3MgdGhlIGF0dGVuZGVlIHRvIHJlbW92ZS5cblx0ICovXG5cdHJlbW92ZUF0dGVuZGVlKGFkZHJlc3M6IHN0cmluZykge1xuXHRcdGNvbnN0IGNsZWFuUmVtb3ZlQWRkcmVzcyA9IGNsZWFuTWFpbEFkZHJlc3MoYWRkcmVzcylcblx0XHRpZiAodGhpcy5fb3JnYW5pemVyPy5hZGRyZXNzLmFkZHJlc3MgPT09IGNsZWFuUmVtb3ZlQWRkcmVzcykge1xuXHRcdFx0aWYgKHRoaXMuX2F0dGVuZGVlcy5zaXplID4gMCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcInRyaWVkIHRvIHJlbW92ZSBvcmdhbml6ZXIgd2hpbGUgdGhlcmUgYXJlIG90aGVyIGF0dGVuZGVlcywgaWdub3JpbmcuXCIpXG5cdFx0XHRcdHJldHVyblxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5fb3JnYW5pemVyID0gbnVsbFxuXHRcdFx0XHQvLyB3ZSBtdXN0IGJlIHRoZSBvcmdhbml6ZXIgc2luY2Ugd2UncmUgcmVtb3ZpbmcgZ3Vlc3RzLlxuXHRcdFx0XHR0aGlzLl9vd25BdHRlbmRlZSA9IG51bGxcblxuXHRcdFx0XHR0aGlzLnVpVXBkYXRlQ2FsbGJhY2soKVxuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAodGhpcy5fYXR0ZW5kZWVzLmhhcyhjbGVhblJlbW92ZUFkZHJlc3MpKSB7XG5cdFx0XHRcdHRoaXMuX2F0dGVuZGVlcy5kZWxldGUoY2xlYW5SZW1vdmVBZGRyZXNzKVxuXHRcdFx0XHRpZiAodGhpcy5fYXR0ZW5kZWVzLnNpemUgPT09IDApIHtcblx0XHRcdFx0XHR0aGlzLl9vcmdhbml6ZXIgPSBudWxsXG5cdFx0XHRcdFx0Ly8gd2UgbXVzdCBiZSB0aGUgb3JnYW5pemVyIHNpbmNlIHdlJ3JlIHJlbW92aW5nIGd1ZXN0cy5cblx0XHRcdFx0XHR0aGlzLl9vd25BdHRlbmRlZSA9IG51bGxcblx0XHRcdFx0fVxuXHRcdFx0XHR0aGlzLnVpVXBkYXRlQ2FsbGJhY2soKVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBtb2RpZnkgeW91ciBvd24gYXR0ZW5kYW5jZSB0byB0aGUgc2VsZWN0ZWQgdmFsdWUuXG5cdCAqIGlzIGEgbm8tb3AgaWYgd2UncmUgbm90IGFjdHVhbGx5IGFuIGF0dGVuZGVlXG5cdCAqIEBwYXJhbSBzdGF0dXNcblx0ICovXG5cdHNldE93bkF0dGVuZGFuY2Uoc3RhdHVzOiBDYWxlbmRhckF0dGVuZGVlU3RhdHVzKSB7XG5cdFx0aWYgKHRoaXMuX293bkF0dGVuZGVlKSB0aGlzLl9vd25BdHRlbmRlZS5zdGF0dXMgPSBzdGF0dXNcblx0fVxuXG5cdHNldFByZXNoYXJlZFBhc3N3b3JkKGFkZHJlc3M6IHN0cmluZywgcGFzc3dvcmQ6IHN0cmluZykge1xuXHRcdHRoaXMuZXh0ZXJuYWxQYXNzd29yZHMuc2V0KGFkZHJlc3MsIHBhc3N3b3JkKVxuXHR9XG5cblx0LyoqIGZvciBhIHN0b3JlZCBhZGRyZXNzLCBnZXQgdGhlIHByZXNoYXJlZCBwYXNzd29yZCBhbmQgYW4gaW5kaWNhdG9yIHZhbHVlIGZvciBpdHMgc3RyZW5ndGggKi9cblx0Z2V0UHJlc2hhcmVkUGFzc3dvcmQoYWRkcmVzczogc3RyaW5nKTogeyBwYXNzd29yZDogc3RyaW5nOyBzdHJlbmd0aDogbnVtYmVyIH0ge1xuXHRcdGNvbnN0IHBhc3N3b3JkID0gdGhpcy5leHRlcm5hbFBhc3N3b3Jkcy5nZXQoYWRkcmVzcykgPz8gXCJcIlxuXHRcdGNvbnN0IHJlY2lwaWVudCA9IHRoaXMucmVzb2x2ZWRSZWNpcGllbnRzLmdldChhZGRyZXNzKVxuXHRcdGNvbnN0IHN0cmVuZ3RoID0gcmVjaXBpZW50ICE9IG51bGwgPyB0aGlzLnBhc3N3b3JkU3RyZW5ndGhNb2RlbChwYXNzd29yZCwgcmVjaXBpZW50KSA6IDBcblx0XHRyZXR1cm4geyBwYXNzd29yZCwgc3RyZW5ndGggfVxuXHR9XG5cblx0LyoqXG5cdCAqIHJldHVybiB3aGV0aGVyIGFueSBvZiB0aGUgYXR0ZW5kZWVzIGhhdmUgYSBwYXNzd29yZCBzZXQgdGhhdCB3YXJyYW50cyBhc2tpbmcgdGhlIHVzZXIgaWYgdGhleSByZWFsbHkgd2FudCB0byB1c2UgaXQuXG5cdCAqXG5cdCAqIGlnbm9yZXMgZW1wdHkgcGFzc3dvcmRzIHNpbmNlIHRob3NlIGFyZSBhbHdheXMgYSBoYXJkIGZhaWwgd2hlbiBzZW5kaW5nIGV4dGVybmFsIG1haWwuXG5cdCAqL1xuXHRoYXNJbnNlY3VyZVBhc3N3b3JkcygpOiBib29sZWFuIHtcblx0XHRpZiAoIXRoaXMuaXNDb25maWRlbnRpYWwpIHtcblx0XHRcdHJldHVybiBmYWxzZVxuXHRcdH1cblx0XHRmb3IgKGNvbnN0IGcgb2YgdGhpcy5fYXR0ZW5kZWVzLnZhbHVlcygpKSB7XG5cdFx0XHRjb25zdCB7IHBhc3N3b3JkLCBzdHJlbmd0aCB9ID0gdGhpcy5nZXRQcmVzaGFyZWRQYXNzd29yZChnLmFkZHJlc3MuYWRkcmVzcylcblx0XHRcdGlmIChwYXNzd29yZCA9PT0gXCJcIiB8fCBpc1NlY3VyZVBhc3N3b3JkKHN0cmVuZ3RoKSkgY29udGludWVcblx0XHRcdHJldHVybiB0cnVlXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlXG5cdH1cblxuXHRwcml2YXRlIHByZXBhcmVTZW5kTW9kZWwoYXR0ZW5kZWVzOiBSZWFkb25seUFycmF5PENhbGVuZGFyRXZlbnRBdHRlbmRlZT4pOiBTZW5kTWFpbE1vZGVsIHwgbnVsbCB7XG5cdFx0aWYgKCF0aGlzLl9vd25BdHRlbmRlZSkgcmV0dXJuIG51bGxcblx0XHRjb25zdCByZWNpcGllbnRzID0gYXR0ZW5kZWVzLm1hcCgoeyBhZGRyZXNzIH0pID0+IGFkZHJlc3MpXG5cdFx0Y29uc3QgbW9kZWwgPSB0aGlzLnNlbmRNYWlsTW9kZWxGYWN0b3J5KClcblx0XHQvLyBkbyBub3QgcGFzcyByZWNpcGllbnRzIGluIHRlbXBsYXRlIGFyZ3VtZW50cyBhcyByZWNpcGllbnQgY2hlY2tzIGluIHNlbmRNYWlsTW9kZWwgYXJlIGRvbmUgaW4gc3luYyBwYXJ0IG9mIHNlbmRcblx0XHRtb2RlbC5pbml0V2l0aFRlbXBsYXRlKFtdLCBcIlwiLCBcIlwiKVxuXG5cdFx0Zm9yIChjb25zdCByZWNpcGllbnQgb2YgcmVjaXBpZW50cykge1xuXHRcdFx0bW9kZWwuYWRkUmVjaXBpZW50KFJlY2lwaWVudEZpZWxkLkJDQywgcmVjaXBpZW50KVxuXHRcdFx0Ly8gT25seSBzZXQgdGhlIHBhc3N3b3JkIGlmIHdlIGhhdmUgYW4gZW50cnkuXG5cdFx0XHQvLyBUaGUgcmVjaXBpZW50cyBtaWdodCBub3QgYmUgcmVzb2x2ZWQgYXQgdGhpcyBwb2ludCB5ZXQsIHNvIHdlIHNob3VsZG4ndCBzZXQgdGhlIHBhc3N3b3JkIG9uIHRoZSBtb2RlbCB1bmxlc3Mgd2UgaGF2ZSBvbmUgZm9yIHN1cmUuXG5cdFx0XHQvLyBTZW5kTWFpbE1vZGVsIHdpbGwgYW55d2F5IHJlc29sdmUgdGhlIHJlY2lwaWVudHMsIGJ1dCBpdCB3b24ndCBkZXRlY3QgdGhlIHJpZ2h0IHBhc3N3b3JkIGlmIGl0J3MgYWxyZWFkeSBwcmUtZmlsbGVkIGJ5IHVzLlxuXHRcdFx0aWYgKHRoaXMuZXh0ZXJuYWxQYXNzd29yZHMuaGFzKHJlY2lwaWVudC5hZGRyZXNzKSkge1xuXHRcdFx0XHRjb25zdCBwYXNzd29yZCA9IGFzc2VydE5vdE51bGwodGhpcy5leHRlcm5hbFBhc3N3b3Jkcy5nZXQocmVjaXBpZW50LmFkZHJlc3MpKVxuXHRcdFx0XHRtb2RlbC5zZXRQYXNzd29yZChyZWNpcGllbnQuYWRkcmVzcywgcGFzc3dvcmQpXG5cdFx0XHR9XG5cdFx0fVxuXHRcdG1vZGVsLnNldFNlbmRlcih0aGlzLl9vd25BdHRlbmRlZS5hZGRyZXNzLmFkZHJlc3MpXG5cdFx0bW9kZWwuc2V0Q29uZmlkZW50aWFsKHRoaXMuaXNDb25maWRlbnRpYWwpXG5cdFx0cmV0dXJuIG1vZGVsXG5cdH1cblxuXHRwcml2YXRlIHByZXBhcmVSZXNwb25zZU1vZGVsKCk6IFNlbmRNYWlsTW9kZWwgfCBudWxsIHtcblx0XHRpZiAodGhpcy5ldmVudFR5cGUgIT09IEV2ZW50VHlwZS5JTlZJVEUgfHwgdGhpcy5fb3duQXR0ZW5kZWUgPT09IG51bGwgfHwgdGhpcy5fb3JnYW5pemVyID09IG51bGwgfHwgdGhpcy5fb3duQXR0ZW5kZWUgPT0gbnVsbCkge1xuXHRcdFx0Ly8gbm90IGNoZWNraW5nIGZvciBpbml0aWFsQXR0ZW5kZWVzLnNpemUgPT09IDAgYmVjYXVzZSB3ZSBhbmQgdGhlIG9yZ2FuaXplciBtaWdodCBiZSB0aGUgb25seSBhdHRlbmRlZXMsIHdoaWNoIGRvIG5vdCBzaG93XG5cdFx0XHQvLyB1cCB0aGVyZS5cblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXG5cdFx0Y29uc3QgaW5pdGlhbE93bkF0dGVuZGVlU3RhdHVzID0gYXNzZXJ0Tm90TnVsbChcblx0XHRcdHRoaXMuaW5pdGlhbE93bkF0dGVuZGVlU3RhdHVzLFxuXHRcdFx0XCJzb21laG93IG1hbmFnZWQgdG8gYmVjb21lIGFuIGF0dGVuZGVlIG9uIGFuIGludml0ZSB3ZSB3ZXJlbid0IGludml0ZWQgdG8gYmVmb3JlXCIsXG5cdFx0KVxuXG5cdFx0aWYgKCEoaW5pdGlhbE93bkF0dGVuZGVlU3RhdHVzICE9PSB0aGlzLl9vd25BdHRlbmRlZS5zdGF0dXMgJiYgdGhpcy5fb3duQXR0ZW5kZWUuc3RhdHVzICE9PSBDYWxlbmRhckF0dGVuZGVlU3RhdHVzLk5FRURTX0FDVElPTikpIHtcblx0XHRcdC8vIGVpdGhlciBvdXIgc3RhdHVzIGRpZCBub3QgYWN0dWFsbHkgY2hhbmdlIG9yIG91ciBuZXcgc3RhdHVzIGlzIFwiTkVFRFNfQUNUSU9OXCJcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXG5cdFx0Y29uc3QgcmVzcG9uc2VNb2RlbDogU2VuZE1haWxNb2RlbCA9IHRoaXMuc2VuZE1haWxNb2RlbEZhY3RvcnkoKVxuXG5cdFx0aWYgKHRoaXMucmVzcG9uc2VUbyAhPSBudWxsKSB7XG5cdFx0XHQvLyBkbyBub3QgcGFzcyByZWNpcGllbnRzIGluIHRlbXBsYXRlIGFyZ3VtZW50cyBhcyByZWNpcGllbnQgY2hlY2tzIGluIHNlbmRNYWlsTW9kZWwgYXJlIGRvbmUgaW4gc3luYyBwYXJ0IG9mIHNlbmRcblx0XHRcdHJlc3BvbnNlTW9kZWwuaW5pdEFzUmVzcG9uc2UoXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRwcmV2aW91c01haWw6IHRoaXMucmVzcG9uc2VUbyxcblx0XHRcdFx0XHRjb252ZXJzYXRpb25UeXBlOiBDb252ZXJzYXRpb25UeXBlLlJFUExZLFxuXHRcdFx0XHRcdHNlbmRlck1haWxBZGRyZXNzOiB0aGlzLl9vd25BdHRlbmRlZS5hZGRyZXNzLmFkZHJlc3MsXG5cdFx0XHRcdFx0cmVjaXBpZW50czogW10sXG5cdFx0XHRcdFx0YXR0YWNobWVudHM6IFtdLFxuXHRcdFx0XHRcdGJvZHlUZXh0OiBcIlwiLFxuXHRcdFx0XHRcdHN1YmplY3Q6IFwiXCIsXG5cdFx0XHRcdFx0cmVwbHlUb3M6IFtdLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRuZXcgTWFwKCksXG5cdFx0XHQpXG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIGRvIG5vdCBwYXNzIHJlY2lwaWVudHMgaW4gdGVtcGxhdGUgYXJndW1lbnRzIGFzIHJlY2lwaWVudCBjaGVja3MgaW4gc2VuZE1haWxNb2RlbCBhcmUgZG9uZSBpbiBzeW5jIHBhcnQgb2Ygc2VuZFxuXHRcdFx0cmVzcG9uc2VNb2RlbC5pbml0V2l0aFRlbXBsYXRlKHt9LCBcIlwiLCBcIlwiKVxuXHRcdH1cblx0XHRyZXNwb25zZU1vZGVsLmFkZFJlY2lwaWVudChSZWNpcGllbnRGaWVsZC5UTywgdGhpcy5fb3JnYW5pemVyLmFkZHJlc3MpXG5cblx0XHRyZXR1cm4gcmVzcG9uc2VNb2RlbFxuXHR9XG5cblx0Z2V0IHJlc3VsdCgpOiBBdHRlbmRhbmNlTW9kZWxSZXN1bHQge1xuXHRcdGlmICh0aGlzLl9zZWxlY3RlZENhbGVuZGFyID09IG51bGwpIHtcblx0XHRcdHRocm93IG5ldyBVc2VyRXJyb3IoXCJub0NhbGVuZGFyX21zZ1wiKVxuXHRcdH1cblxuXHRcdGNvbnN0IGlzT3JnYW5pemVyID0gdGhpcy5fb3JnYW5pemVyICE9IG51bGwgJiYgdGhpcy5fb3duQXR0ZW5kZWU/LmFkZHJlc3MuYWRkcmVzcyA9PT0gdGhpcy5fb3JnYW5pemVyLmFkZHJlc3MuYWRkcmVzc1xuXG5cdFx0Y29uc3Qge1xuXHRcdFx0a2VwdDogYXR0ZW5kZWVzVG9VcGRhdGUsXG5cdFx0XHRkZWxldGVkOiBhdHRlbmRlZXNUb0NhbmNlbCxcblx0XHRcdGFkZGVkOiBhdHRlbmRlZXNUb0ludml0ZSxcblx0XHR9ID0gZ2V0UmVjaXBpZW50TGlzdHModGhpcy5pbml0aWFsQXR0ZW5kZWVzLCB0aGlzLl9hdHRlbmRlZXMsIGlzT3JnYW5pemVyLCB0aGlzLmlzTmV3KVxuXG5cdFx0Y29uc3QgeyBhbGxBdHRlbmRlZXMsIG9yZ2FuaXplclRvUHVibGlzaCB9ID0gYXNzZW1ibGVBdHRlbmRlZXMoYXR0ZW5kZWVzVG9JbnZpdGUsIGF0dGVuZGVlc1RvVXBkYXRlLCB0aGlzLl9vcmdhbml6ZXIsIHRoaXMuX293bkF0dGVuZGVlKVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGF0dGVuZGVlczogYWxsQXR0ZW5kZWVzLFxuXHRcdFx0b3JnYW5pemVyOiBvcmdhbml6ZXJUb1B1Ymxpc2gsXG5cdFx0XHRpc0NvbmZpZGVudGlhbDogdGhpcy5pc0NvbmZpZGVudGlhbCxcblx0XHRcdGNhbmNlbE1vZGVsOiBpc09yZ2FuaXplciAmJiBhdHRlbmRlZXNUb0NhbmNlbC5sZW5ndGggPiAwID8gdGhpcy5wcmVwYXJlU2VuZE1vZGVsKGF0dGVuZGVlc1RvQ2FuY2VsKSA6IG51bGwsXG5cdFx0XHRpbnZpdGVNb2RlbDogaXNPcmdhbml6ZXIgJiYgYXR0ZW5kZWVzVG9JbnZpdGUubGVuZ3RoID4gMCA/IHRoaXMucHJlcGFyZVNlbmRNb2RlbChhdHRlbmRlZXNUb0ludml0ZSkgOiBudWxsLFxuXHRcdFx0dXBkYXRlTW9kZWw6IGlzT3JnYW5pemVyICYmIGF0dGVuZGVlc1RvVXBkYXRlLmxlbmd0aCA+IDAgJiYgdGhpcy5zaG91bGRTZW5kVXBkYXRlcyA/IHRoaXMucHJlcGFyZVNlbmRNb2RlbChhdHRlbmRlZXNUb1VwZGF0ZSkgOiBudWxsLFxuXHRcdFx0cmVzcG9uc2VNb2RlbDogIWlzT3JnYW5pemVyICYmIG9yZ2FuaXplclRvUHVibGlzaCAhPSBudWxsID8gdGhpcy5wcmVwYXJlUmVzcG9uc2VNb2RlbCgpIDogbnVsbCxcblx0XHRcdGNhbGVuZGFyOiB0aGlzLl9zZWxlY3RlZENhbGVuZGFyLFxuXHRcdH1cblx0fVxufVxuXG5mdW5jdGlvbiBnZXRSZWNpcGllbnRMaXN0cyhcblx0aW5pdGlhbEF0dGVuZGVlczogUmVhZG9ubHlNYXA8dW5rbm93biwgQ2FsZW5kYXJFdmVudEF0dGVuZGVlPixcblx0Y3VycmVudEF0dGVuZGVlczogUmVhZG9ubHlNYXA8dW5rbm93biwgQ2FsZW5kYXJFdmVudEF0dGVuZGVlPixcblx0aXNPcmdhbml6ZXI6IGJvb2xlYW4sXG5cdGlzTmV3OiBib29sZWFuLFxuKTogUmV0dXJuVHlwZTx0eXBlb2YgdHJpc2VjdGluZ0RpZmY8Q2FsZW5kYXJFdmVudEF0dGVuZGVlPj4ge1xuXHRpZiAoIWlzT3JnYW5pemVyKSB7XG5cdFx0Ly8gaWYgd2UncmUgbm90IHRoZSBvcmdhbml6ZXIsIHdlIGNhbid0IGhhdmUgY2hhbmdlZCB0aGUgZ3Vlc3QgbGlzdC5cblx0XHRyZXR1cm4geyBhZGRlZDogW10sIGRlbGV0ZWQ6IFtdLCBrZXB0OiBBcnJheS5mcm9tKGluaXRpYWxBdHRlbmRlZXMudmFsdWVzKCkpIH1cblx0fSBlbHNlIGlmIChpc05ldykge1xuXHRcdC8vIGEgbmV3IGV2ZW50IHdpbGwgYWx3YXlzIGhhdmUgZXZlcnlvbmUgb24gdGhlIGd1ZXN0IGxpc3QgaGF2ZSB0byBiZSBpbnZpdGVkLlxuXHRcdHJldHVybiB7IGFkZGVkOiBBcnJheS5mcm9tKGN1cnJlbnRBdHRlbmRlZXMudmFsdWVzKCkpLCBkZWxldGVkOiBbXSwga2VwdDogW10gfVxuXHR9IGVsc2Uge1xuXHRcdC8vIGluIHRoaXMgY2FzZSwgdGhlIGd1ZXN0IGxpc3QgbWF5IGhhdmUgY2hhbmdlZCBhcmJpdHJhcmlseVxuXHRcdHJldHVybiB0cmlzZWN0aW5nRGlmZihpbml0aWFsQXR0ZW5kZWVzLCBjdXJyZW50QXR0ZW5kZWVzKVxuXHR9XG59XG5cbi8qKiBnZXQgdGhlIGxpc3Qgb2YgYXR0ZW5kZWVzIGFuZCB0aGUgb3JnYW5pemVyIGFkZHJlc3MgdG8gcHVibGlzaC5cbiAqIHRoZSBhcnJheSBjb250YWlucyB0aGUgb3JnYW5pemVyIGFzIGFuIGF0dGVuZGVlLlxuICpcbiAqIGlmIHRoZXJlJ3Mgb25seSBhbiBvcmdhbml6ZXIgYnV0IG5vIG90aGVyIGF0dGVuZGVlcywgbm8gYXR0ZW5kZWVzIG9yIG9yZ2FuaXplcnMgYXJlIHJldHVybmVkLlxuICogKi9cbmZ1bmN0aW9uIGFzc2VtYmxlQXR0ZW5kZWVzKFxuXHRhdHRlbmRlZXNUb0ludml0ZTogUmVhZG9ubHlBcnJheTxDYWxlbmRhckV2ZW50QXR0ZW5kZWU+LFxuXHRhdHRlbmRlZXNUb1VwZGF0ZTogUmVhZG9ubHlBcnJheTxDYWxlbmRhckV2ZW50QXR0ZW5kZWU+LFxuXHRvcmdhbml6ZXI6IENhbGVuZGFyRXZlbnRBdHRlbmRlZSB8IG51bGwsXG5cdG93bkF0dGVuZGVlOiBDYWxlbmRhckV2ZW50QXR0ZW5kZWUgfCBudWxsLFxuKToge1xuXHRhbGxBdHRlbmRlZXM6IEFycmF5PENhbGVuZGFyRXZlbnRBdHRlbmRlZT5cblx0b3JnYW5pemVyVG9QdWJsaXNoOiBFbmNyeXB0ZWRNYWlsQWRkcmVzcyB8IG51bGxcbn0ge1xuXHRpZiAoXG5cdFx0b3JnYW5pemVyID09IG51bGwgfHxcblx0XHQoYXR0ZW5kZWVzVG9JbnZpdGUubGVuZ3RoICsgYXR0ZW5kZWVzVG9VcGRhdGUubGVuZ3RoID09PSAwICYmIChvd25BdHRlbmRlZSA9PSBudWxsIHx8IG93bkF0dGVuZGVlLmFkZHJlc3MuYWRkcmVzcyA9PT0gb3JnYW5pemVyPy5hZGRyZXNzLmFkZHJlc3MpKVxuXHQpIHtcblx0XHQvLyB0aGVyZSdzIG5vIGF0dGVuZGVlcyBiZXNpZGVzIHRoZSBvcmdhbml6ZXIgKHdoaWNoIG1heSBiZSB1cykgb3IgdGhlcmUncyBubyBvcmdhbml6ZXIgYXQgYWxsLlxuXHRcdHJldHVybiB7IGFsbEF0dGVuZGVlczogW10sIG9yZ2FuaXplclRvUHVibGlzaDogbnVsbCB9XG5cdH1cblx0Y29uc3QgYWxsQXR0ZW5kZWVzOiBBcnJheTxDYWxlbmRhckV2ZW50QXR0ZW5kZWU+ID0gW11cblx0aWYgKG9yZ2FuaXplci5hZGRyZXNzLmFkZHJlc3MgIT09IG93bkF0dGVuZGVlPy5hZGRyZXNzLmFkZHJlc3MpIHtcblx0XHRhbGxBdHRlbmRlZXMucHVzaChvcmdhbml6ZXIpXG5cdH1cblx0aWYgKG93bkF0dGVuZGVlICE9IG51bGwpIHtcblx0XHRhbGxBdHRlbmRlZXMucHVzaChvd25BdHRlbmRlZSlcblx0fVxuXHRhbGxBdHRlbmRlZXMucHVzaCguLi5hdHRlbmRlZXNUb1VwZGF0ZSlcblx0YWxsQXR0ZW5kZWVzLnB1c2goLi4uYXR0ZW5kZWVzVG9JbnZpdGUpXG5cblx0cmV0dXJuIHtcblx0XHRhbGxBdHRlbmRlZXMsXG5cdFx0b3JnYW5pemVyVG9QdWJsaXNoOiBvcmdhbml6ZXIuYWRkcmVzcyxcblx0fVxufVxuIiwiaW1wb3J0IHsgZ2VuZXJhdGVFdmVudEVsZW1lbnRJZCwgc2VyaWFsaXplQWxhcm1JbnRlcnZhbCB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9Db21tb25DYWxlbmRhclV0aWxzLmpzXCJcbmltcG9ydCB7IG5vT3AsIHJlbW92ZSB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgRXZlbnRUeXBlIH0gZnJvbSBcIi4vQ2FsZW5kYXJFdmVudE1vZGVsLmpzXCJcbmltcG9ydCB7IERhdGVQcm92aWRlciB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9EYXRlUHJvdmlkZXIuanNcIlxuaW1wb3J0IHsgQWxhcm1JbnRlcnZhbCwgYWxhcm1JbnRlcnZhbFRvTHV4b25EdXJhdGlvbkxpa2VPYmplY3QgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2NhbGVuZGFyL2RhdGUvQ2FsZW5kYXJVdGlscy5qc1wiXG5pbXBvcnQgeyBEdXJhdGlvbiB9IGZyb20gXCJsdXhvblwiXG5pbXBvcnQgeyBBbGFybUluZm9UZW1wbGF0ZSB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL2xhenkvQ2FsZW5kYXJGYWNhZGUuanNcIlxuXG5leHBvcnQgdHlwZSBDYWxlbmRhckV2ZW50QWxhcm1Nb2RlbFJlc3VsdCA9IHtcblx0YWxhcm1zOiBBcnJheTxBbGFybUluZm9UZW1wbGF0ZT5cbn1cblxuLyoqXG4gKiBlZGl0IHRoZSBhbGFybXMgc2V0IG9uIGEgY2FsZW5kYXIgZXZlbnQuXG4gKi9cbmV4cG9ydCBjbGFzcyBDYWxlbmRhckV2ZW50QWxhcm1Nb2RlbCB7XG5cdHByaXZhdGUgcmVhZG9ubHkgX2FsYXJtczogQXJyYXk8QWxhcm1JbnRlcnZhbD4gPSBbXVxuXHQvKiogd2UgY2FuIHNldCByZW1pbmRlcnMgb25seSBpZiB3ZSdyZSBhYmxlIHRvIGVkaXQgdGhlIGV2ZW50IG9uIHRoZSBzZXJ2ZXIgYmVjYXVzZSB3ZSBoYXZlIHRvIGFkZCB0aGVtIHRvIHRoZSBlbnRpdHkuICovXG5cdHJlYWRvbmx5IGNhbkVkaXRSZW1pbmRlcnM6IGJvb2xlYW5cblxuXHRjb25zdHJ1Y3Rvcihcblx0XHRldmVudFR5cGU6IEV2ZW50VHlwZSxcblx0XHRhbGFybXM6IEFycmF5PEFsYXJtSW50ZXJ2YWw+ID0gW10sXG5cdFx0cHJpdmF0ZSByZWFkb25seSBkYXRlUHJvdmlkZXI6IERhdGVQcm92aWRlcixcblx0XHRwcml2YXRlIHJlYWRvbmx5IHVpVXBkYXRlQ2FsbGJhY2s6ICgpID0+IHZvaWQgPSBub09wLFxuXHQpIHtcblx0XHR0aGlzLmNhbkVkaXRSZW1pbmRlcnMgPVxuXHRcdFx0ZXZlbnRUeXBlID09PSBFdmVudFR5cGUuT1dOIHx8IGV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLlNIQVJFRF9SVyB8fCBldmVudFR5cGUgPT09IEV2ZW50VHlwZS5MT0NLRUQgfHwgZXZlbnRUeXBlID09PSBFdmVudFR5cGUuSU5WSVRFXG5cdFx0dGhpcy5fYWxhcm1zID0gWy4uLmFsYXJtc11cblx0fVxuXG5cdC8qKlxuXHQgKiBAcGFyYW0gdHJpZ2dlciB0aGUgaW50ZXJ2YWwgdG8gYWRkLlxuXHQgKi9cblx0YWRkQWxhcm0odHJpZ2dlcjogQWxhcm1JbnRlcnZhbCB8IG51bGwpIHtcblx0XHRpZiAodHJpZ2dlciA9PSBudWxsKSByZXR1cm5cblxuXHRcdC8vIENoZWNrcyBpZiBhbiBhbGFybSB3aXRoIHRoZSBzYW1lIGR1cmF0aW9uIGFscmVhZHkgZXhpc3RzXG5cdFx0Y29uc3QgYWxyZWFkeUhhc0FsYXJtID0gdGhpcy5fYWxhcm1zLnNvbWUoKGUpID0+IHRoaXMuaXNFcXVhbEFsYXJtcyh0cmlnZ2VyLCBlKSlcblx0XHRpZiAoYWxyZWFkeUhhc0FsYXJtKSByZXR1cm5cblxuXHRcdHRoaXMuX2FsYXJtcy5wdXNoKHRyaWdnZXIpXG5cdFx0dGhpcy51aVVwZGF0ZUNhbGxiYWNrKClcblx0fVxuXG5cdC8qKlxuXHQgKiBkZWFjdGl2YXRlIHRoZSBhbGFybSBmb3IgdGhlIGdpdmVuIGludGVydmFsLlxuXHQgKi9cblx0cmVtb3ZlQWxhcm0oYWxhcm1JbnRlcnZhbDogQWxhcm1JbnRlcnZhbCkge1xuXHRcdHJlbW92ZSh0aGlzLl9hbGFybXMsIGFsYXJtSW50ZXJ2YWwpXG5cdFx0dGhpcy51aVVwZGF0ZUNhbGxiYWNrKClcblx0fVxuXG5cdHJlbW92ZUFsbCgpIHtcblx0XHR0aGlzLl9hbGFybXMuc3BsaWNlKDApXG5cdH1cblxuXHRhZGRBbGwoYWxhcm1JbnRlcnZhbExpc3Q6IEFsYXJtSW50ZXJ2YWxbXSkge1xuXHRcdHRoaXMuX2FsYXJtcy5wdXNoKC4uLmFsYXJtSW50ZXJ2YWxMaXN0KVxuXHR9XG5cblx0Z2V0IGFsYXJtcygpOiBSZWFkb25seUFycmF5PEFsYXJtSW50ZXJ2YWw+IHtcblx0XHRyZXR1cm4gdGhpcy5fYWxhcm1zXG5cdH1cblxuXHRnZXQgcmVzdWx0KCk6IENhbGVuZGFyRXZlbnRBbGFybU1vZGVsUmVzdWx0IHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0YWxhcm1zOiBBcnJheS5mcm9tKHRoaXMuX2FsYXJtcy52YWx1ZXMoKSkubWFwKCh0KSA9PiB0aGlzLm1ha2VOZXdBbGFybSh0KSksXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBtYWtlTmV3QWxhcm0oYWxhcm1JbnRlcnZhbDogQWxhcm1JbnRlcnZhbCk6IEFsYXJtSW5mb1RlbXBsYXRlIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0YWxhcm1JZGVudGlmaWVyOiBnZW5lcmF0ZUV2ZW50RWxlbWVudElkKHRoaXMuZGF0ZVByb3ZpZGVyLm5vdygpKSxcblx0XHRcdHRyaWdnZXI6IHNlcmlhbGl6ZUFsYXJtSW50ZXJ2YWwoYWxhcm1JbnRlcnZhbCksXG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIENvbXBhcmVzIHR3byBBbGFybUludGVydmFscyBpZiB0aGV5IGhhdmUgdGhlIHNhbWUgZHVyYXRpb25cblx0ICogZWc6IDYwIG1pbnV0ZXMgPT09IDEgaG91clxuXHQgKiBAcGFyYW0gYWxhcm1PbmUgYmFzZSBpbnRlcnZhbFxuXHQgKiBAcGFyYW0gYWxhcm1Ud28gaW50ZXJ2YWwgdG8gYmUgY29tcGFyZWQgd2l0aFxuXHQgKiBAcmV0dXJuIHRydWUgaWYgdGhleSBoYXZlIHRoZSBzYW1lIGR1cmF0aW9uXG5cdCAqL1xuXHRpc0VxdWFsQWxhcm1zKGFsYXJtT25lOiBBbGFybUludGVydmFsLCBhbGFybVR3bzogQWxhcm1JbnRlcnZhbCk6IGJvb2xlYW4ge1xuXHRcdGNvbnN0IGx1eG9uQWxhcm1PbmUgPSBEdXJhdGlvbi5mcm9tRHVyYXRpb25MaWtlKGFsYXJtSW50ZXJ2YWxUb0x1eG9uRHVyYXRpb25MaWtlT2JqZWN0KGFsYXJtT25lKSkuc2hpZnRUb0FsbCgpXG5cdFx0Y29uc3QgbHV4b25BbGFybVR3byA9IER1cmF0aW9uLmZyb21EdXJhdGlvbkxpa2UoYWxhcm1JbnRlcnZhbFRvTHV4b25EdXJhdGlvbkxpa2VPYmplY3QoYWxhcm1Ud28pKS5zaGlmdFRvQWxsKClcblxuXHRcdHJldHVybiBsdXhvbkFsYXJtT25lLmVxdWFscyhsdXhvbkFsYXJtVHdvKVxuXHR9XG59XG4iLCJpbXBvcnQgdHlwZSB7IEh0bWxTYW5pdGl6ZXIgfSBmcm9tIFwiLi9IdG1sU2FuaXRpemVyLmpzXCJcbmltcG9ydCB7IG5vT3AgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcblxuZXhwb3J0IGNsYXNzIFNhbml0aXplZFRleHRWaWV3TW9kZWwge1xuXHRwcml2YXRlIHNhbml0aXplZFRleHQ6IHN0cmluZyB8IG51bGwgPSBudWxsXG5cblx0Y29uc3RydWN0b3IocHJpdmF0ZSB0ZXh0OiBzdHJpbmcsIHByaXZhdGUgcmVhZG9ubHkgc2FuaXRpemVyOiBIdG1sU2FuaXRpemVyLCBwcml2YXRlIHJlYWRvbmx5IHVpVXBkYXRlQ2FsbGJhY2s6ICgpID0+IHZvaWQgPSBub09wKSB7fVxuXG5cdHNldCBjb250ZW50KHY6IHN0cmluZykge1xuXHRcdHRoaXMuc2FuaXRpemVkVGV4dCA9IG51bGxcblx0XHR0aGlzLnRleHQgPSB2XG5cdFx0dGhpcy51aVVwZGF0ZUNhbGxiYWNrKClcblx0fVxuXG5cdGdldCBjb250ZW50KCk6IHN0cmluZyB7XG5cdFx0aWYgKHRoaXMuc2FuaXRpemVkVGV4dCA9PSBudWxsKSB7XG5cdFx0XHR0aGlzLnNhbml0aXplZFRleHQgPSB0aGlzLnNhbml0aXplci5zYW5pdGl6ZUhUTUwodGhpcy50ZXh0LCB7IGJsb2NrRXh0ZXJuYWxDb250ZW50OiBmYWxzZSB9KS5odG1sXG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLnNhbml0aXplZFRleHRcblx0fVxufVxuIiwiaW1wb3J0IHsgU2VuZE1haWxNb2RlbCB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vbWFpbEZ1bmN0aW9uYWxpdHkvU2VuZE1haWxNb2RlbC5qc1wiXG5pbXBvcnQgeyBDYWxlbmRhck5vdGlmaWNhdGlvblNlbmRlciB9IGZyb20gXCIuLi8uLi92aWV3L0NhbGVuZGFyTm90aWZpY2F0aW9uU2VuZGVyLmpzXCJcbmltcG9ydCB7IExvZ2luQ29udHJvbGxlciB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vYXBpL21haW4vTG9naW5Db250cm9sbGVyLmpzXCJcbmltcG9ydCB7IENhbGVuZGFyRXZlbnQgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBQcm9ncmFtbWluZ0Vycm9yIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL2Vycm9yL1Byb2dyYW1taW5nRXJyb3IuanNcIlxuaW1wb3J0IHsgQWNjb3VudFR5cGUsIENhbGVuZGFyQXR0ZW5kZWVTdGF0dXMgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHMuanNcIlxuaW1wb3J0IHsgY2xvbmUgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IFRvb01hbnlSZXF1ZXN0c0Vycm9yIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL2Vycm9yL1Jlc3RFcnJvci5qc1wiXG5pbXBvcnQgeyBVc2VyRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2FwaS9tYWluL1VzZXJFcnJvci5qc1wiXG5pbXBvcnQgeyBnZXROb25Pcmdhbml6ZXJBdHRlbmRlZXMgfSBmcm9tIFwiLi9DYWxlbmRhckV2ZW50TW9kZWwuanNcIlxuaW1wb3J0IHsgVXBncmFkZVJlcXVpcmVkRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2FwaS9tYWluL1VwZ3JhZGVSZXF1aXJlZEVycm9yLmpzXCJcblxuLyoqIGFsbCB0aGUgcGVvcGxlIHRoYXQgbWF5IGJlIGludGVyZXN0ZWQgaW4gY2hhbmdlcyB0byBhbiBldmVudCBnZXQgc3RvcmVkIGluIHRoZXNlIG1vZGVscy5cbiAqIGlmIG9uZSBvZiB0aGVtIGlzIG51bGwsIGl0J3MgYmVjYXVzZSB0aGVyZSBpcyBubyBvbmUgdGhhdCBuZWVkcyB0aGF0IGtpbmQgb2YgdXBkYXRlLlxuICogKi9cbmV4cG9ydCB0eXBlIENhbGVuZGFyTm90aWZpY2F0aW9uU2VuZE1vZGVscyA9IHtcblx0aW52aXRlTW9kZWw6IFNlbmRNYWlsTW9kZWwgfCBudWxsXG5cdHVwZGF0ZU1vZGVsOiBTZW5kTWFpbE1vZGVsIHwgbnVsbFxuXHRjYW5jZWxNb2RlbDogU2VuZE1haWxNb2RlbCB8IG51bGxcblx0cmVzcG9uc2VNb2RlbDogU2VuZE1haWxNb2RlbCB8IG51bGxcbn1cblxuLyoqIGNvbnRhaW5zIHRoZSBsb2dpYyB0byBkaXN0cmlidXRlIHRoZSBuZWNlc3NhcnkgdXBkYXRlcyB0byB3aG9tIGl0IG1heSBjb25jZXJuXG4gKiAgYW5kIGNoZWNrcyB0aGUgcHJlY29uZGl0aW9uc1xuICogKi9cbmV4cG9ydCBjbGFzcyBDYWxlbmRhck5vdGlmaWNhdGlvbk1vZGVsIHtcblx0Y29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBub3RpZmljYXRpb25TZW5kZXI6IENhbGVuZGFyTm90aWZpY2F0aW9uU2VuZGVyLCBwcml2YXRlIHJlYWRvbmx5IGxvZ2luQ29udHJvbGxlcjogTG9naW5Db250cm9sbGVyKSB7fVxuXG5cdC8qKlxuXHQgKiBzZW5kIGFsbCBub3RpZmljYXRpb25zIHJlcXVpcmVkIGZvciB0aGUgbmV3IGV2ZW50LCBkZXRlcm1pbmVkIGJ5IHRoZSBjb250ZW50cyBvZiB0aGUgc2VuZE1vZGVscyBwYXJhbWV0ZXIuXG5cdCAqXG5cdCAqIHdpbGwgbW9kaWZ5IHRoZSBhdHRlbmRlZSBsaXN0IG9mIG5ld0V2ZW50IGlmIGludml0ZXMvY2FuY2VsbGF0aW9ucyBhcmUgc2VudC5cblx0ICovXG5cdGFzeW5jIHNlbmQoZXZlbnQ6IENhbGVuZGFyRXZlbnQsIHJlY3VycmVuY2VJZHM6IEFycmF5PERhdGU+LCBzZW5kTW9kZWxzOiBDYWxlbmRhck5vdGlmaWNhdGlvblNlbmRNb2RlbHMpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRpZiAoc2VuZE1vZGVscy51cGRhdGVNb2RlbCA9PSBudWxsICYmIHNlbmRNb2RlbHMuY2FuY2VsTW9kZWwgPT0gbnVsbCAmJiBzZW5kTW9kZWxzLmludml0ZU1vZGVsID09IG51bGwgJiYgc2VuZE1vZGVscy5yZXNwb25zZU1vZGVsID09IG51bGwpIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblx0XHRpZiAoXG5cdFx0XHQvLyBzZW5kaW5nIHJlc3BvbnNlcyBpcyBPSyBmb3IgZnJlZSB1c2Vycy5cblx0XHRcdChzZW5kTW9kZWxzLnVwZGF0ZU1vZGVsICE9IG51bGwgfHwgc2VuZE1vZGVscy5jYW5jZWxNb2RlbCAhPSBudWxsIHx8IHNlbmRNb2RlbHMuaW52aXRlTW9kZWwgIT0gbnVsbCkgJiZcblx0XHRcdCEoYXdhaXQgaGFzUGxhbldpdGhJbnZpdGVzKHRoaXMubG9naW5Db250cm9sbGVyKSlcblx0XHQpIHtcblx0XHRcdGNvbnN0IHsgZ2V0QXZhaWxhYmxlUGxhbnNXaXRoQ2FsZW5kYXJJbnZpdGVzIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi8uLi8uLi8uLi9jb21tb24vc3Vic2NyaXB0aW9uL1N1YnNjcmlwdGlvblV0aWxzLmpzXCIpXG5cdFx0XHR0aHJvdyBuZXcgVXBncmFkZVJlcXVpcmVkRXJyb3IoXCJ1cGdyYWRlUmVxdWlyZWRfbXNnXCIsIGF3YWl0IGdldEF2YWlsYWJsZVBsYW5zV2l0aENhbGVuZGFySW52aXRlcygpKVxuXHRcdH1cblx0XHQvLyB3ZSBuZWVkIHRvIGV4Y2x1ZGUgdGhlIGV4Y2x1c2lvbnMgdGhhdCBhcmUgb25seSB0aGVyZSBiZWNhdXNlIG9mIGFsdGVyZWQgaW5zdGFuY2VzIHNwZWNpZmljYWxseVxuXHRcdC8vIHNvIGdvb2dsZSBjYWxlbmRhciBoYW5kbGVzIG91ciBpbnZpdGF0aW9uc1xuXHRcdGNvbnN0IHJlY3VycmVuY2VUaW1lcyA9IHJlY3VycmVuY2VJZHMubWFwKChkYXRlKSA9PiBkYXRlLmdldFRpbWUoKSlcblx0XHRjb25zdCBvcmlnaW5hbEV4Y2x1c2lvbnMgPSBldmVudC5yZXBlYXRSdWxlPy5leGNsdWRlZERhdGVzID8/IFtdXG5cdFx0Y29uc3QgZmlsdGVyZWRFeGNsdXNpb25zID0gb3JpZ2luYWxFeGNsdXNpb25zLmZpbHRlcigoeyBkYXRlIH0pID0+ICFyZWN1cnJlbmNlVGltZXMuaW5jbHVkZXMoZGF0ZS5nZXRUaW1lKCkpKVxuXHRcdGlmIChldmVudC5yZXBlYXRSdWxlICE9IG51bGwpIGV2ZW50LnJlcGVhdFJ1bGUuZXhjbHVkZWREYXRlcyA9IGZpbHRlcmVkRXhjbHVzaW9uc1xuXG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IGludml0ZVByb21pc2UgPSBzZW5kTW9kZWxzLmludml0ZU1vZGVsICE9IG51bGwgPyB0aGlzLnNlbmRJbnZpdGVzKGV2ZW50LCBzZW5kTW9kZWxzLmludml0ZU1vZGVsKSA6IFByb21pc2UucmVzb2x2ZSgpXG5cdFx0XHRjb25zdCBjYW5jZWxQcm9taXNlID0gc2VuZE1vZGVscy5jYW5jZWxNb2RlbCAhPSBudWxsID8gdGhpcy5zZW5kQ2FuY2VsbGF0aW9uKGV2ZW50LCBzZW5kTW9kZWxzLmNhbmNlbE1vZGVsKSA6IFByb21pc2UucmVzb2x2ZSgpXG5cdFx0XHRjb25zdCB1cGRhdGVQcm9taXNlID0gc2VuZE1vZGVscy51cGRhdGVNb2RlbCAhPSBudWxsID8gdGhpcy5zZW5kVXBkYXRlcyhldmVudCwgc2VuZE1vZGVscy51cGRhdGVNb2RlbCkgOiBQcm9taXNlLnJlc29sdmUoKVxuXHRcdFx0Y29uc3QgcmVzcG9uc2VQcm9taXNlID0gc2VuZE1vZGVscy5yZXNwb25zZU1vZGVsICE9IG51bGwgPyB0aGlzLnJlc3BvbmRUb09yZ2FuaXplcihldmVudCwgc2VuZE1vZGVscy5yZXNwb25zZU1vZGVsKSA6IFByb21pc2UucmVzb2x2ZSgpXG5cdFx0XHRhd2FpdCBQcm9taXNlLmFsbChbaW52aXRlUHJvbWlzZSwgY2FuY2VsUHJvbWlzZSwgdXBkYXRlUHJvbWlzZSwgcmVzcG9uc2VQcm9taXNlXSlcblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0aWYgKGV2ZW50LnJlcGVhdFJ1bGUgIT0gbnVsbCkgZXZlbnQucmVwZWF0UnVsZS5leGNsdWRlZERhdGVzID0gb3JpZ2luYWxFeGNsdXNpb25zXG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIGludml0ZSBhbGwgbmV3IGF0dGVuZGVlcyBmb3IgYW4gZXZlbnQgYW5kIHNldCB0aGVpciBzdGF0dXMgZnJvbSBcIkFEREVEXCIgdG8gXCJORUVEU19BQ1RJT05cIlxuXHQgKiBAcGFyYW0gZXZlbnQgd2lsbCBiZSBtb2RpZmllZCBpZiBpbnZpdGVzIGFyZSBzZW50LlxuXHQgKiBAcGFyYW0gaW52aXRlTW9kZWxcblx0ICogQHByaXZhdGVcblx0ICovXG5cdHByaXZhdGUgYXN5bmMgc2VuZEludml0ZXMoZXZlbnQ6IENhbGVuZGFyRXZlbnQsIGludml0ZU1vZGVsOiBTZW5kTWFpbE1vZGVsKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0aWYgKGV2ZW50Lm9yZ2FuaXplciA9PSBudWxsIHx8IGludml0ZU1vZGVsPy5hbGxSZWNpcGllbnRzKCkubGVuZ3RoID09PSAwKSB7XG5cdFx0XHR0aHJvdyBuZXcgUHJvZ3JhbW1pbmdFcnJvcihcImV2ZW50IGhhcyBubyBvcmdhbml6ZXIgb3Igbm8gaW52aXRhYmxlIGF0dGVuZGVlcywgY2FuJ3Qgc2VuZCBpbnZpdGVzLlwiKVxuXHRcdH1cblx0XHRjb25zdCBuZXdBdHRlbmRlZXMgPSBnZXROb25Pcmdhbml6ZXJBdHRlbmRlZXMoZXZlbnQpLmZpbHRlcigoYSkgPT4gYS5zdGF0dXMgPT09IENhbGVuZGFyQXR0ZW5kZWVTdGF0dXMuQURERUQpXG5cdFx0YXdhaXQgaW52aXRlTW9kZWwud2FpdEZvclJlc29sdmVkUmVjaXBpZW50cygpXG5cdFx0aWYgKGV2ZW50Lmludml0ZWRDb25maWRlbnRpYWxseSAhPSBudWxsKSB7XG5cdFx0XHRpbnZpdGVNb2RlbC5zZXRDb25maWRlbnRpYWwoZXZlbnQuaW52aXRlZENvbmZpZGVudGlhbGx5KVxuXHRcdH1cblx0XHRhd2FpdCB0aGlzLm5vdGlmaWNhdGlvblNlbmRlci5zZW5kSW52aXRlKGV2ZW50LCBpbnZpdGVNb2RlbClcblx0XHRmb3IgKGNvbnN0IGF0dGVuZGVlIG9mIG5ld0F0dGVuZGVlcykge1xuXHRcdFx0aWYgKGF0dGVuZGVlLnN0YXR1cyA9PT0gQ2FsZW5kYXJBdHRlbmRlZVN0YXR1cy5BRERFRCkge1xuXHRcdFx0XHRhdHRlbmRlZS5zdGF0dXMgPSBDYWxlbmRhckF0dGVuZGVlU3RhdHVzLk5FRURTX0FDVElPTlxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2VuZENhbmNlbGxhdGlvbihldmVudDogQ2FsZW5kYXJFdmVudCwgY2FuY2VsTW9kZWw6IFNlbmRNYWlsTW9kZWwpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCB1cGRhdGVkRXZlbnQgPSBjbG9uZShldmVudClcblxuXHRcdHRyeSB7XG5cdFx0XHRpZiAoZXZlbnQuaW52aXRlZENvbmZpZGVudGlhbGx5ICE9IG51bGwpIHtcblx0XHRcdFx0Y2FuY2VsTW9kZWwuc2V0Q29uZmlkZW50aWFsKGV2ZW50Lmludml0ZWRDb25maWRlbnRpYWxseSlcblx0XHRcdH1cblx0XHRcdGF3YWl0IHRoaXMubm90aWZpY2F0aW9uU2VuZGVyLnNlbmRDYW5jZWxsYXRpb24odXBkYXRlZEV2ZW50LCBjYW5jZWxNb2RlbClcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRpZiAoZSBpbnN0YW5jZW9mIFRvb01hbnlSZXF1ZXN0c0Vycm9yKSB7XG5cdFx0XHRcdHRocm93IG5ldyBVc2VyRXJyb3IoXCJtYWlsQWRkcmVzc0RlbGF5X21zZ1wiKSAvLyBUaGlzIHdpbGwgYmUgY2F1Z2h0IGFuZCBvcGVuIGVycm9yIGRpYWxvZ1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgZVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2VuZFVwZGF0ZXMoZXZlbnQ6IENhbGVuZGFyRXZlbnQsIHVwZGF0ZU1vZGVsOiBTZW5kTWFpbE1vZGVsKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0YXdhaXQgdXBkYXRlTW9kZWwud2FpdEZvclJlc29sdmVkUmVjaXBpZW50cygpXG5cdFx0aWYgKGV2ZW50Lmludml0ZWRDb25maWRlbnRpYWxseSAhPSBudWxsKSB7XG5cdFx0XHR1cGRhdGVNb2RlbC5zZXRDb25maWRlbnRpYWwoZXZlbnQuaW52aXRlZENvbmZpZGVudGlhbGx5KVxuXHRcdH1cblx0XHRhd2FpdCB0aGlzLm5vdGlmaWNhdGlvblNlbmRlci5zZW5kVXBkYXRlKGV2ZW50LCB1cGRhdGVNb2RlbClcblx0fVxuXG5cdC8qKlxuXHQgKiBzZW5kIGEgcmVzcG9uc2UgbWFpbCB0byB0aGUgb3JnYW5pemVyIGFzIHN0YXRlZCBvbiB0aGUgb3JpZ2luYWwgZXZlbnQuIGNhbGxpbmcgdGhpcyBmb3IgYW4gZXZlbnQgdGhhdCBpcyBub3QgYW4gaW52aXRlIG9yXG5cdCAqIGRvZXMgbm90IGNvbnRhaW4gYWRkcmVzcyBhcyBhbiBhdHRlbmRlZSBvciB0aGF0IGhhcyBubyBvcmdhbml6ZXIgaXMgYW4gZXJyb3IuXG5cdCAqIEBwYXJhbSBuZXdFdmVudCB0aGUgZXZlbnQgdG8gc2VuZCB0aGUgdXBkYXRlIGZvciwgdGhpcyBzaG91bGQgYmUgaWRlbnRpY2FsIHRvIGV4aXN0aW5nRXZlbnQgZXhjZXB0IGZvciB0aGUgb3duIHN0YXR1cy5cblx0ICogQHBhcmFtIHJlc3BvbnNlTW9kZWxcblx0ICogQHByaXZhdGVcblx0ICovXG5cdHByaXZhdGUgYXN5bmMgcmVzcG9uZFRvT3JnYW5pemVyKG5ld0V2ZW50OiBDYWxlbmRhckV2ZW50LCByZXNwb25zZU1vZGVsOiBTZW5kTWFpbE1vZGVsKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0YXdhaXQgcmVzcG9uc2VNb2RlbC53YWl0Rm9yUmVzb2x2ZWRSZWNpcGllbnRzKClcblx0XHRpZiAobmV3RXZlbnQuaW52aXRlZENvbmZpZGVudGlhbGx5ICE9IG51bGwpIHtcblx0XHRcdHJlc3BvbnNlTW9kZWwuc2V0Q29uZmlkZW50aWFsKG5ld0V2ZW50Lmludml0ZWRDb25maWRlbnRpYWxseSlcblx0XHR9XG5cblx0XHRhd2FpdCB0aGlzLm5vdGlmaWNhdGlvblNlbmRlci5zZW5kUmVzcG9uc2UobmV3RXZlbnQsIHJlc3BvbnNlTW9kZWwpXG5cdFx0cmVzcG9uc2VNb2RlbC5kaXNwb3NlKClcblx0fVxufVxuXG4vKiogZGV0ZXJtaW5lIGlmIHdlIHNob3VsZCBzaG93IHRoZSBcInNlbmRpbmcgaW52aXRlcyBpcyBub3QgYXZhaWxhYmxlIGZvciB5b3VyIHBsYW4sIHBsZWFzZSB1cGdyYWRlXCIgZGlhbG9nXG4gKiB0byB0aGUgY3VycmVudGx5IGxvZ2dlZCBpbiB1c2VyLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFzUGxhbldpdGhJbnZpdGVzKGxvZ2luQ29udHJvbGxlcjogTG9naW5Db250cm9sbGVyKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdGNvbnN0IHVzZXJDb250cm9sbGVyID0gbG9naW5Db250cm9sbGVyLmdldFVzZXJDb250cm9sbGVyKClcblx0Y29uc3QgeyB1c2VyIH0gPSB1c2VyQ29udHJvbGxlclxuXHRpZiAodXNlci5hY2NvdW50VHlwZSA9PT0gQWNjb3VudFR5cGUuRlJFRSB8fCB1c2VyLmFjY291bnRUeXBlID09PSBBY2NvdW50VHlwZS5FWFRFUk5BTCkge1xuXHRcdHJldHVybiBmYWxzZVxuXHR9XG5cblx0Y29uc3QgY3VzdG9tZXIgPSBhd2FpdCBsb2dpbkNvbnRyb2xsZXIuZ2V0VXNlckNvbnRyb2xsZXIoKS5sb2FkQ3VzdG9tZXIoKVxuXG5cdHJldHVybiAoYXdhaXQgdXNlckNvbnRyb2xsZXIuZ2V0UGxhbkNvbmZpZygpKS5ldmVudEludml0ZXNcbn1cbiIsIi8qKlxuICogdGhpcyBmaWxlIGNvbnRhaW5zIHRoZSBzdHJhdGVnaWVzIHVzZWQgdG8gY3JlYXRlLCBlZGl0IGFuZCBkZWxldGUgY2FsZW5kYXIgZXZlbnRzIHVuZGVyIGRpZmZlcmVudCBzY2VuYXJpb3MuXG4gKiB0aGUgc2NlbmFyaW9zIGFyZSBtb3N0bHkgZGl2aWRlZCBpbnRvIGRlY2lkaW5nIHRoZSB0eXBlIG9mIG9wZXJhdGlvbiAoZWRpdCwgZGVsZXRlLCBjcmVhdGUpXG4gKiBhbmQgdGhlIHNjb3BlIG9mIHRoZSBvcGVyYXRpb24gKG9ubHkgdGhlIGNsaWNrZWQgaW5zdGFuY2Ugb3IgYWxsIGluc3RhbmNlcylcbiAqICovXG5pbXBvcnQgeyBDYWxlbmRhckV2ZW50IH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgYXNzZXJ0RXZlbnRWYWxpZGl0eSwgQ2FsZW5kYXJNb2RlbCB9IGZyb20gXCIuLi8uLi9tb2RlbC9DYWxlbmRhck1vZGVsLmpzXCJcbmltcG9ydCB7IENhbGVuZGFyTm90aWZpY2F0aW9uTW9kZWwgfSBmcm9tIFwiLi9DYWxlbmRhck5vdGlmaWNhdGlvbk1vZGVsLmpzXCJcbmltcG9ydCB7IGFzc2VydE5vdE51bGwsIGlkZW50aXR5IH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBnZW5lcmF0ZVVpZCB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vY2FsZW5kYXIvZGF0ZS9DYWxlbmRhclV0aWxzLmpzXCJcbmltcG9ydCB7XG5cdGFzc2VtYmxlQ2FsZW5kYXJFdmVudEVkaXRSZXN1bHQsXG5cdGFzc2VtYmxlRWRpdFJlc3VsdEFuZEFzc2lnbkZyb21FeGlzdGluZyxcblx0YXNzaWduRXZlbnRJZGVudGl0eSxcblx0Q2FsZW5kYXJFdmVudEVkaXRNb2RlbHMsXG5cdENhbGVuZGFyT3BlcmF0aW9uLFxuXHRTaG93UHJvZ3Jlc3NDYWxsYmFjayxcbn0gZnJvbSBcIi4vQ2FsZW5kYXJFdmVudE1vZGVsLmpzXCJcbmltcG9ydCB7IExvZ2luQ29udHJvbGxlciB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vYXBpL21haW4vTG9naW5Db250cm9sbGVyLmpzXCJcbmltcG9ydCB7IERhdGVUaW1lIH0gZnJvbSBcImx1eG9uXCJcbmltcG9ydCB7IFJlY2lwaWVudEZpZWxkIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9tYWlsRnVuY3Rpb25hbGl0eS9TaGFyZWRNYWlsVXRpbHMuanNcIlxuXG4vKiogd2hlbiBzdGFydGluZyBhbiBlZGl0IG9yIGRlbGV0ZSBvcGVyYXRpb24gb2YgYW4gZXZlbnQsIHdlXG4gKiBuZWVkIHRvIGtub3cgaG93IHRvIGFwcGx5IGl0IGFuZCB3aGV0aGVyIHRvIHNlbmQgdXBkYXRlcy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ2FsZW5kYXJFdmVudE1vZGVsU3RyYXRlZ3kge1xuXHQvKiogYXBwbHkgdGhlIGNoYW5nZXMgdG8gdGhlIHNlcnZlciBhbmQgbm90aWZ5IGF0dGVuZGVlcyAqL1xuXHRhcHBseSgpOiBQcm9taXNlPHZvaWQ+XG5cblx0LyoqIGNoZWNrIGlmIHRoZSBjdXJyZW50IHN0YXRlIG9mIHRoZSBvcGVyYXRpb24gd291bGQgY2F1c2UgdXBkYXRlcyB0byBiZSBzZW50Ki9cblx0bWF5UmVxdWlyZVNlbmRpbmdVcGRhdGVzKCk6IGJvb2xlYW5cblxuXHRlZGl0TW9kZWxzOiBDYWxlbmRhckV2ZW50RWRpdE1vZGVsc1xufVxuXG4vKiogc3RyYXRlZ2llcyB0byBhcHBseSBjYWxlbmRhciBvcGVyYXRpb25zIHdpdGggc29tZSBjb21tb24gc2V0dXAgKi9cbmV4cG9ydCBjbGFzcyBDYWxlbmRhckV2ZW50QXBwbHlTdHJhdGVnaWVzIHtcblx0Y29uc3RydWN0b3IoXG5cdFx0cHJpdmF0ZSByZWFkb25seSBjYWxlbmRhck1vZGVsOiBDYWxlbmRhck1vZGVsLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgbG9naW5zOiBMb2dpbkNvbnRyb2xsZXIsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBub3RpZmljYXRpb25Nb2RlbDogQ2FsZW5kYXJOb3RpZmljYXRpb25Nb2RlbCxcblx0XHRwcml2YXRlIHJlYWRvbmx5IGxhenlSZWN1cnJlbmNlSWRzOiAodWlkPzogc3RyaW5nIHwgbnVsbCkgPT4gUHJvbWlzZTxBcnJheTxEYXRlPj4sXG5cdFx0cHJpdmF0ZSByZWFkb25seSBzaG93UHJvZ3Jlc3M6IFNob3dQcm9ncmVzc0NhbGxiYWNrID0gaWRlbnRpdHksXG5cdFx0cHJpdmF0ZSByZWFkb25seSB6b25lOiBzdHJpbmcsXG5cdCkge31cblxuXHQvKipcblx0ICogc2F2ZSBhIG5ldyBldmVudCB0byB0aGUgc2VsZWN0ZWQgY2FsZW5kYXIsIGludml0ZSBhbGwgYXR0ZW5kZWVzIGV4Y2VwdCBmb3IgdGhlIG9yZ2FuaXplciBhbmQgc2V0IHVwIGFsYXJtcy5cblx0ICovXG5cdGFzeW5jIHNhdmVOZXdFdmVudChlZGl0TW9kZWxzOiBDYWxlbmRhckV2ZW50RWRpdE1vZGVscyk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IHsgZXZlbnRWYWx1ZXMsIG5ld0FsYXJtcywgc2VuZE1vZGVscywgY2FsZW5kYXIgfSA9IGFzc2VtYmxlQ2FsZW5kYXJFdmVudEVkaXRSZXN1bHQoZWRpdE1vZGVscylcblx0XHRjb25zdCB1aWQgPSBnZW5lcmF0ZVVpZChjYWxlbmRhci5ncm91cC5faWQsIERhdGUubm93KCkpXG5cdFx0Y29uc3QgbmV3RXZlbnQgPSBhc3NpZ25FdmVudElkZW50aXR5KGV2ZW50VmFsdWVzLCB7IHVpZCB9KVxuXHRcdGFzc2VydEV2ZW50VmFsaWRpdHkobmV3RXZlbnQpXG5cdFx0Y29uc3QgeyBncm91cFJvb3QgfSA9IGNhbGVuZGFyXG5cblx0XHRhd2FpdCB0aGlzLnNob3dQcm9ncmVzcyhcblx0XHRcdChhc3luYyAoKSA9PiB7XG5cdFx0XHRcdGF3YWl0IHRoaXMubm90aWZpY2F0aW9uTW9kZWwuc2VuZChuZXdFdmVudCwgW10sIHNlbmRNb2RlbHMpXG5cdFx0XHRcdGF3YWl0IHRoaXMuY2FsZW5kYXJNb2RlbC5jcmVhdGVFdmVudChuZXdFdmVudCwgbmV3QWxhcm1zLCB0aGlzLnpvbmUsIGdyb3VwUm9vdClcblx0XHRcdH0pKCksXG5cdFx0KVxuXHR9XG5cblx0LyoqIGFsbCBpbnN0YW5jZXMgb2YgYW4gZXZlbnQgd2lsbCBiZSB1cGRhdGVkLiBpZiB0aGUgcmVjdXJyZW5jZUlkcyBhcmUgaW52YWxpZGF0ZWQgKHJydWxlIG9yIHN0YXJ0VGltZSBjaGFuZ2VkKSxcblx0ICogd2lsbCBkZWxldGUgYWxsIGFsdGVyZWQgaW5zdGFuY2VzIGFuZCBleGNsdXNpb25zLiAqL1xuXHRhc3luYyBzYXZlRW50aXJlRXhpc3RpbmdFdmVudChlZGl0TW9kZWxzRm9yUHJvZ2VuaXRvcjogQ2FsZW5kYXJFdmVudEVkaXRNb2RlbHMsIGV4aXN0aW5nRXZlbnQ6IENhbGVuZGFyRXZlbnQpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCB1aWQgPSBhc3NlcnROb3ROdWxsKGV4aXN0aW5nRXZlbnQudWlkLCBcIm5vIHVpZCB0byB1cGRhdGUgZXhpc3RpbmcgZXZlbnRcIilcblx0XHRhc3NlcnROb3ROdWxsKGV4aXN0aW5nRXZlbnQ/Ll9pZCwgXCJubyBpZCB0byB1cGRhdGUgZXhpc3RpbmcgZXZlbnRcIilcblx0XHRhc3NlcnROb3ROdWxsKGV4aXN0aW5nRXZlbnQ/Ll9vd25lckdyb3VwLCBcIm5vIG93bmVyR3JvdXAgdG8gdXBkYXRlIGV4aXN0aW5nIGV2ZW50XCIpXG5cdFx0YXNzZXJ0Tm90TnVsbChleGlzdGluZ0V2ZW50Py5fcGVybWlzc2lvbnMsIFwibm8gcGVybWlzc2lvbnMgdG8gdXBkYXRlIGV4aXN0aW5nIGV2ZW50XCIpXG5cblx0XHRjb25zdCB7IG5ld0V2ZW50LCBjYWxlbmRhciwgbmV3QWxhcm1zLCBzZW5kTW9kZWxzIH0gPSBhc3NlbWJsZUVkaXRSZXN1bHRBbmRBc3NpZ25Gcm9tRXhpc3RpbmcoXG5cdFx0XHRleGlzdGluZ0V2ZW50LFxuXHRcdFx0ZWRpdE1vZGVsc0ZvclByb2dlbml0b3IsXG5cdFx0XHRDYWxlbmRhck9wZXJhdGlvbi5FZGl0QWxsLFxuXHRcdClcblx0XHRjb25zdCB7IGdyb3VwUm9vdCB9ID0gY2FsZW5kYXJcblx0XHRhd2FpdCB0aGlzLnNob3dQcm9ncmVzcyhcblx0XHRcdChhc3luYyAoKSA9PiB7XG5cdFx0XHRcdGNvbnN0IHJlY3VycmVuY2VJZHM6IEFycmF5PERhdGU+ID0gYXdhaXQgdGhpcy5sYXp5UmVjdXJyZW5jZUlkcyh1aWQpXG5cdFx0XHRcdGF3YWl0IHRoaXMubm90aWZpY2F0aW9uTW9kZWwuc2VuZChuZXdFdmVudCwgcmVjdXJyZW5jZUlkcywgc2VuZE1vZGVscylcblx0XHRcdFx0YXdhaXQgdGhpcy5jYWxlbmRhck1vZGVsLnVwZGF0ZUV2ZW50KG5ld0V2ZW50LCBuZXdBbGFybXMsIHRoaXMuem9uZSwgZ3JvdXBSb290LCBleGlzdGluZ0V2ZW50KVxuXHRcdFx0XHRjb25zdCBpbnZhbGlkYXRlQWx0ZXJlZEluc3RhbmNlcyA9IG5ld0V2ZW50LnJlcGVhdFJ1bGUgJiYgbmV3RXZlbnQucmVwZWF0UnVsZS5leGNsdWRlZERhdGVzLmxlbmd0aCA9PT0gMFxuXG5cdFx0XHRcdGNvbnN0IG5ld0R1cmF0aW9uID0gZWRpdE1vZGVsc0ZvclByb2dlbml0b3Iud2hlbk1vZGVsLmR1cmF0aW9uXG5cdFx0XHRcdGNvbnN0IGluZGV4ID0gYXdhaXQgdGhpcy5jYWxlbmRhck1vZGVsLmdldEV2ZW50c0J5VWlkKHVpZClcblx0XHRcdFx0aWYgKGluZGV4ID09IG51bGwpIHJldHVyblxuXG5cdFx0XHRcdC8vIG5vdGU6IGlmIHdlIGV2ZXIgYWxsb3cgZWRpdGluZyBndWVzdHMgc2VwYXJhdGVseSwgd2UgbmVlZCB0byB1cGRhdGUgdGhpcyB0byBub3QgdXNlIHRoZVxuXHRcdFx0XHQvLyBub3RlOiBwcm9nZW5pdG9yIGVkaXQgbW9kZWxzIHNpbmNlIHRoZSBndWVzdCBsaXN0IG1pZ2h0IGJlIGRpZmZlcmVudCBmcm9tIHRoZSBpbnN0YW5jZVxuXHRcdFx0XHQvLyBub3RlOiB3ZSdyZSBsb29raW5nIGF0LlxuXHRcdFx0XHRmb3IgKGNvbnN0IG9jY3VycmVuY2Ugb2YgaW5kZXguYWx0ZXJlZEluc3RhbmNlcykge1xuXHRcdFx0XHRcdGlmIChpbnZhbGlkYXRlQWx0ZXJlZEluc3RhbmNlcykge1xuXHRcdFx0XHRcdFx0ZWRpdE1vZGVsc0ZvclByb2dlbml0b3Iud2hvTW9kZWwuc2hvdWxkU2VuZFVwZGF0ZXMgPSB0cnVlXG5cdFx0XHRcdFx0XHRjb25zdCB7IHNlbmRNb2RlbHMgfSA9IGFzc2VtYmxlRWRpdFJlc3VsdEFuZEFzc2lnbkZyb21FeGlzdGluZyhvY2N1cnJlbmNlLCBlZGl0TW9kZWxzRm9yUHJvZ2VuaXRvciwgQ2FsZW5kYXJPcGVyYXRpb24uRWRpdFRoaXMpXG5cdFx0XHRcdFx0XHQvLyBpbiBjYXNlcyB3aGVyZSBndWVzdHMgd2VyZSByZW1vdmVkIGFuZCB0aGUgc3RhcnQgdGltZS9yZXBlYXQgcnVsZSBjaGFuZ2VkLCB3ZSBtaWdodFxuXHRcdFx0XHRcdFx0Ly8gaGF2ZSBib3RoIGEgY2FuY2VsIG1vZGVsIChjb250YWluaW5nIHRoZSByZW1vdmVkIHJlY2lwaWVudHMpIGFuZCBhbiB1cGRhdGUgbW9kZWwgKHRoZSByZXN0KVxuXHRcdFx0XHRcdFx0Ly8gd2UncmUgY29weWluZyBhbGwgb2YgdGhlbSB0byBjYW5jZWwgaWYgdGhlIGFsdGVyZWQgaW5zdGFuY2VzIHdlcmUgaW52YWxpZGF0ZWQsIHNpbmNlIHRoZVxuXHRcdFx0XHRcdFx0Ly8gdXBkYXRlIChhbmQgaW52aXRlIGZvciB0aGF0IG1hdHRlcikgaXMgaXJyZWxldmFudCBmb3IgdGhvc2UgaW5zdGFuY2VzLlxuXHRcdFx0XHRcdFx0Zm9yIChjb25zdCByZWNpcGllbnQgb2Ygc2VuZE1vZGVscy5jYW5jZWxNb2RlbD8uYWxsUmVjaXBpZW50cygpID8/IFtdKSB7XG5cdFx0XHRcdFx0XHRcdHNlbmRNb2RlbHMudXBkYXRlTW9kZWw/LmFkZFJlY2lwaWVudChSZWNpcGllbnRGaWVsZC5CQ0MsIHJlY2lwaWVudClcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdHNlbmRNb2RlbHMuY2FuY2VsTW9kZWwgPSBzZW5kTW9kZWxzLnVwZGF0ZU1vZGVsXG5cdFx0XHRcdFx0XHRzZW5kTW9kZWxzLnVwZGF0ZU1vZGVsID0gbnVsbFxuXHRcdFx0XHRcdFx0c2VuZE1vZGVscy5pbnZpdGVNb2RlbCA9IG51bGxcblx0XHRcdFx0XHRcdGF3YWl0IHRoaXMubm90aWZpY2F0aW9uTW9kZWwuc2VuZChvY2N1cnJlbmNlLCBbXSwgc2VuZE1vZGVscylcblx0XHRcdFx0XHRcdGF3YWl0IHRoaXMuY2FsZW5kYXJNb2RlbC5kZWxldGVFdmVudChvY2N1cnJlbmNlKVxuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRjb25zdCB7IG5ld0V2ZW50LCBuZXdBbGFybXMsIHNlbmRNb2RlbHMgfSA9IGFzc2VtYmxlRWRpdFJlc3VsdEFuZEFzc2lnbkZyb21FeGlzdGluZyhcblx0XHRcdFx0XHRcdFx0b2NjdXJyZW5jZSxcblx0XHRcdFx0XHRcdFx0ZWRpdE1vZGVsc0ZvclByb2dlbml0b3IsXG5cdFx0XHRcdFx0XHRcdENhbGVuZGFyT3BlcmF0aW9uLkVkaXRUaGlzLFxuXHRcdFx0XHRcdFx0KVxuXHRcdFx0XHRcdFx0Ly8gd2UgbmVlZCB0byB1c2UgdGhlIHRpbWUgd2UgaGFkIGJlZm9yZSwgbm90IHRoZSB0aW1lIG9mIHRoZSBwcm9nZW5pdG9yICh3aGljaCBkaWQgbm90IGNoYW5nZSBzaW5jZSB3ZSBzdGlsbCBoYXZlIGFsdGVyZWQgb2NjdXJyZW5jZXMpXG5cdFx0XHRcdFx0XHRuZXdFdmVudC5zdGFydFRpbWUgPSBvY2N1cnJlbmNlLnN0YXJ0VGltZVxuXHRcdFx0XHRcdFx0bmV3RXZlbnQuZW5kVGltZSA9IERhdGVUaW1lLmZyb21KU0RhdGUobmV3RXZlbnQuc3RhcnRUaW1lLCB7IHpvbmU6IHRoaXMuem9uZSB9KS5wbHVzKG5ld0R1cmF0aW9uKS50b0pTRGF0ZSgpXG5cdFx0XHRcdFx0XHQvLyBhbHRlcmVkIGluc3RhbmNlcyBuZXZlciBoYXZlIGEgcmVwZWF0IHJ1bGVcblx0XHRcdFx0XHRcdG5ld0V2ZW50LnJlcGVhdFJ1bGUgPSBudWxsXG5cdFx0XHRcdFx0XHRhd2FpdCB0aGlzLm5vdGlmaWNhdGlvbk1vZGVsLnNlbmQobmV3RXZlbnQsIFtdLCBzZW5kTW9kZWxzKVxuXHRcdFx0XHRcdFx0YXdhaXQgdGhpcy5jYWxlbmRhck1vZGVsLnVwZGF0ZUV2ZW50KG5ld0V2ZW50LCBuZXdBbGFybXMsIHRoaXMuem9uZSwgZ3JvdXBSb290LCBvY2N1cnJlbmNlKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSkoKSxcblx0XHQpXG5cdH1cblxuXHRhc3luYyBzYXZlTmV3QWx0ZXJlZEluc3RhbmNlKHtcblx0XHRlZGl0TW9kZWxzLFxuXHRcdGVkaXRNb2RlbHNGb3JQcm9nZW5pdG9yLFxuXHRcdGV4aXN0aW5nSW5zdGFuY2UsXG5cdFx0cHJvZ2VuaXRvcixcblx0fToge1xuXHRcdGVkaXRNb2RlbHM6IENhbGVuZGFyRXZlbnRFZGl0TW9kZWxzXG5cdFx0ZWRpdE1vZGVsc0ZvclByb2dlbml0b3I6IENhbGVuZGFyRXZlbnRFZGl0TW9kZWxzXG5cdFx0ZXhpc3RpbmdJbnN0YW5jZTogQ2FsZW5kYXJFdmVudFxuXHRcdHByb2dlbml0b3I6IENhbGVuZGFyRXZlbnRcblx0fSkge1xuXHRcdGF3YWl0IHRoaXMuc2hvd1Byb2dyZXNzKFxuXHRcdFx0KGFzeW5jICgpID0+IHtcblx0XHRcdFx0Ly8gTkVXOiBlZGl0IG1vZGVscyB0aGF0IHdlIHVzZWQgc28gZmFyIGFyZSBmb3IgdGhlIG5ldyBldmVudCAocmVzY2hlZHVsZWQgb25lKS4gdGhpcyBzaG91bGQgYmUgYW4gaW52aXRlLlxuXHRcdFx0XHRjb25zdCB7IG5ld0V2ZW50LCBjYWxlbmRhciwgbmV3QWxhcm1zLCBzZW5kTW9kZWxzIH0gPSBhc3NlbWJsZUVkaXRSZXN1bHRBbmRBc3NpZ25Gcm9tRXhpc3RpbmcoXG5cdFx0XHRcdFx0ZXhpc3RpbmdJbnN0YW5jZSxcblx0XHRcdFx0XHRlZGl0TW9kZWxzLFxuXHRcdFx0XHRcdENhbGVuZGFyT3BlcmF0aW9uLkVkaXRUaGlzLFxuXHRcdFx0XHQpXG5cdFx0XHRcdGF3YWl0IHRoaXMubm90aWZpY2F0aW9uTW9kZWwuc2VuZChuZXdFdmVudCwgW10sIHNlbmRNb2RlbHMpXG5cblx0XHRcdFx0Ly8gT0xEOiBidXQgd2UgbmVlZCB0byB1cGRhdGUgdGhlIGV4aXN0aW5nIG9uZSBhcyB3ZWxsLCB0byBhZGQgYW4gZXhjbHVzaW9uIGZvciB0aGUgb3JpZ2luYWwgaW5zdGFuY2UgdGhhdCB3ZSBlZGl0ZWQuXG5cdFx0XHRcdGVkaXRNb2RlbHNGb3JQcm9nZW5pdG9yLndob01vZGVsLnNob3VsZFNlbmRVcGRhdGVzID0gdHJ1ZVxuXHRcdFx0XHRlZGl0TW9kZWxzRm9yUHJvZ2VuaXRvci53aGVuTW9kZWwuZXhjbHVkZURhdGUoZXhpc3RpbmdJbnN0YW5jZS5zdGFydFRpbWUpXG5cdFx0XHRcdGNvbnN0IHtcblx0XHRcdFx0XHRuZXdFdmVudDogbmV3UHJvZ2VuaXRvcixcblx0XHRcdFx0XHRzZW5kTW9kZWxzOiBwcm9nZW5pdG9yU2VuZE1vZGVscyxcblx0XHRcdFx0XHRuZXdBbGFybXM6IHByb2dlbml0b3JBbGFybXMsXG5cdFx0XHRcdH0gPSBhc3NlbWJsZUVkaXRSZXN1bHRBbmRBc3NpZ25Gcm9tRXhpc3RpbmcocHJvZ2VuaXRvciwgZWRpdE1vZGVsc0ZvclByb2dlbml0b3IsIENhbGVuZGFyT3BlcmF0aW9uLkVkaXRBbGwpXG5cdFx0XHRcdGNvbnN0IHJlY3VycmVuY2VJZHMgPSBhd2FpdCB0aGlzLmxhenlSZWN1cnJlbmNlSWRzKHByb2dlbml0b3IudWlkKVxuXHRcdFx0XHRyZWN1cnJlbmNlSWRzLnB1c2goZXhpc3RpbmdJbnN0YW5jZS5zdGFydFRpbWUpXG5cdFx0XHRcdGF3YWl0IHRoaXMubm90aWZpY2F0aW9uTW9kZWwuc2VuZChuZXdQcm9nZW5pdG9yLCByZWN1cnJlbmNlSWRzLCBwcm9nZW5pdG9yU2VuZE1vZGVscylcblx0XHRcdFx0YXdhaXQgdGhpcy5jYWxlbmRhck1vZGVsLnVwZGF0ZUV2ZW50KG5ld1Byb2dlbml0b3IsIHByb2dlbml0b3JBbGFybXMsIHRoaXMuem9uZSwgY2FsZW5kYXIuZ3JvdXBSb290LCBwcm9nZW5pdG9yKVxuXG5cdFx0XHRcdC8vIE5FV1xuXHRcdFx0XHRjb25zdCB7IGdyb3VwUm9vdCB9ID0gY2FsZW5kYXJcblx0XHRcdFx0YXdhaXQgdGhpcy5jYWxlbmRhck1vZGVsLmNyZWF0ZUV2ZW50KG5ld0V2ZW50LCBuZXdBbGFybXMsIHRoaXMuem9uZSwgZ3JvdXBSb290KVxuXHRcdFx0fSkoKSxcblx0XHQpXG5cdH1cblxuXHRhc3luYyBzYXZlRXhpc3RpbmdBbHRlcmVkSW5zdGFuY2UoZWRpdE1vZGVsczogQ2FsZW5kYXJFdmVudEVkaXRNb2RlbHMsIGV4aXN0aW5nSW5zdGFuY2U6IENhbGVuZGFyRXZlbnQpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCB7IG5ld0V2ZW50LCBjYWxlbmRhciwgbmV3QWxhcm1zLCBzZW5kTW9kZWxzIH0gPSBhc3NlbWJsZUVkaXRSZXN1bHRBbmRBc3NpZ25Gcm9tRXhpc3RpbmcoZXhpc3RpbmdJbnN0YW5jZSwgZWRpdE1vZGVscywgQ2FsZW5kYXJPcGVyYXRpb24uRWRpdFRoaXMpXG5cdFx0Y29uc3QgeyBncm91cFJvb3QgfSA9IGNhbGVuZGFyXG5cdFx0YXdhaXQgdGhpcy5zaG93UHJvZ3Jlc3MoXG5cdFx0XHQoYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRhd2FpdCB0aGlzLm5vdGlmaWNhdGlvbk1vZGVsLnNlbmQobmV3RXZlbnQsIFtdLCBzZW5kTW9kZWxzKVxuXHRcdFx0XHRhd2FpdCB0aGlzLmNhbGVuZGFyTW9kZWwudXBkYXRlRXZlbnQobmV3RXZlbnQsIG5ld0FsYXJtcywgdGhpcy56b25lLCBncm91cFJvb3QsIGV4aXN0aW5nSW5zdGFuY2UpXG5cdFx0XHR9KSgpLFxuXHRcdClcblx0fVxuXG5cdC8qKiBkZWxldGUgYSB3aG9sZSBldmVudCBhbmQgYWxsIHRoZSBpbnN0YW5jZXMgZ2VuZXJhdGVkIGJ5IGl0ICovXG5cdGFzeW5jIGRlbGV0ZUVudGlyZUV4aXN0aW5nRXZlbnQoZWRpdE1vZGVsczogQ2FsZW5kYXJFdmVudEVkaXRNb2RlbHMsIGV4aXN0aW5nRXZlbnQ6IENhbGVuZGFyRXZlbnQpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRlZGl0TW9kZWxzLndob01vZGVsLnNob3VsZFNlbmRVcGRhdGVzID0gdHJ1ZVxuXHRcdGNvbnN0IHsgc2VuZE1vZGVscyB9ID0gYXNzZW1ibGVDYWxlbmRhckV2ZW50RWRpdFJlc3VsdChlZGl0TW9kZWxzKVxuXHRcdGF3YWl0IHRoaXMuc2hvd1Byb2dyZXNzKFxuXHRcdFx0KGFzeW5jICgpID0+IHtcblx0XHRcdFx0Y29uc3QgYWx0ZXJlZE9jY3VycmVuY2VzID0gYXdhaXQgdGhpcy5jYWxlbmRhck1vZGVsLmdldEV2ZW50c0J5VWlkKGFzc2VydE5vdE51bGwoZXhpc3RpbmdFdmVudC51aWQpKVxuXHRcdFx0XHRpZiAoYWx0ZXJlZE9jY3VycmVuY2VzKSB7XG5cdFx0XHRcdFx0Zm9yIChjb25zdCBvY2N1cnJlbmNlIG9mIGFsdGVyZWRPY2N1cnJlbmNlcy5hbHRlcmVkSW5zdGFuY2VzKSB7XG5cdFx0XHRcdFx0XHRpZiAob2NjdXJyZW5jZS5hdHRlbmRlZXMubGVuZ3RoID09PSAwKSBjb250aW51ZVxuXHRcdFx0XHRcdFx0Y29uc3QgeyBzZW5kTW9kZWxzIH0gPSBhc3NlbWJsZUVkaXRSZXN1bHRBbmRBc3NpZ25Gcm9tRXhpc3Rpbmcob2NjdXJyZW5jZSwgZWRpdE1vZGVscywgQ2FsZW5kYXJPcGVyYXRpb24uRGVsZXRlQWxsKVxuXHRcdFx0XHRcdFx0c2VuZE1vZGVscy5jYW5jZWxNb2RlbCA9IHNlbmRNb2RlbHMudXBkYXRlTW9kZWxcblx0XHRcdFx0XHRcdHNlbmRNb2RlbHMudXBkYXRlTW9kZWwgPSBudWxsXG5cdFx0XHRcdFx0XHRhd2FpdCB0aGlzLm5vdGlmaWNhdGlvbk1vZGVsLnNlbmQob2NjdXJyZW5jZSwgW10sIHNlbmRNb2RlbHMpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0c2VuZE1vZGVscy5jYW5jZWxNb2RlbCA9IHNlbmRNb2RlbHMudXBkYXRlTW9kZWxcblx0XHRcdFx0c2VuZE1vZGVscy51cGRhdGVNb2RlbCA9IG51bGxcblx0XHRcdFx0YXdhaXQgdGhpcy5ub3RpZmljYXRpb25Nb2RlbC5zZW5kKGV4aXN0aW5nRXZlbnQsIFtdLCBzZW5kTW9kZWxzKVxuXHRcdFx0XHRpZiAoZXhpc3RpbmdFdmVudC51aWQgIT0gbnVsbCkge1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMuY2FsZW5kYXJNb2RlbC5kZWxldGVFdmVudHNCeVVpZChleGlzdGluZ0V2ZW50LnVpZClcblx0XHRcdFx0fVxuXHRcdFx0XHQvLyBkb2luZyB0aGlzIGV4cGxpY2l0bHkgYmVjYXVzZSB3ZSBtaWdodCBoYXZlIGNsaWNrZWQgYW4gZXZlbnQgdGhhdCdzIG5vdCBsaXN0ZWQgaW5cblx0XHRcdFx0Ly8gdGhlIHVpZCBpbmRleCBmb3Igc29tZSByZWFzb24uIHRoaXMgcHJldmVudHMgYnVncyBmcm9tIGNyZWF0aW5nIHVuZGVsZXRhYmxlIGV2ZW50cy5cblx0XHRcdFx0YXdhaXQgdGhpcy5jYWxlbmRhck1vZGVsLmRlbGV0ZUV2ZW50KGV4aXN0aW5nRXZlbnQpXG5cdFx0XHR9KSgpLFxuXHRcdClcblx0fVxuXG5cdC8qKiBhZGQgYW4gZXhjbHVzaW9uIHRvIHRoZSBwcm9nZW5pdG9yIGFuZCBzZW5kIGFuIHVwZGF0ZS4gKi9cblx0YXN5bmMgZXhjbHVkZVNpbmdsZUluc3RhbmNlKGVkaXRNb2RlbHNGb3JQcm9nZW5pdG9yOiBDYWxlbmRhckV2ZW50RWRpdE1vZGVscywgZXhpc3RpbmdJbnN0YW5jZTogQ2FsZW5kYXJFdmVudCwgcHJvZ2VuaXRvcjogQ2FsZW5kYXJFdmVudCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGF3YWl0IHRoaXMuc2hvd1Byb2dyZXNzKFxuXHRcdFx0KGFzeW5jICgpID0+IHtcblx0XHRcdFx0ZWRpdE1vZGVsc0ZvclByb2dlbml0b3Iud2hvTW9kZWwuc2hvdWxkU2VuZFVwZGF0ZXMgPSB0cnVlXG5cdFx0XHRcdGVkaXRNb2RlbHNGb3JQcm9nZW5pdG9yLndoZW5Nb2RlbC5leGNsdWRlRGF0ZShleGlzdGluZ0luc3RhbmNlLnN0YXJ0VGltZSlcblx0XHRcdFx0Y29uc3QgeyBuZXdFdmVudCwgc2VuZE1vZGVscywgY2FsZW5kYXIsIG5ld0FsYXJtcyB9ID0gYXNzZW1ibGVFZGl0UmVzdWx0QW5kQXNzaWduRnJvbUV4aXN0aW5nKFxuXHRcdFx0XHRcdHByb2dlbml0b3IsXG5cdFx0XHRcdFx0ZWRpdE1vZGVsc0ZvclByb2dlbml0b3IsXG5cdFx0XHRcdFx0Q2FsZW5kYXJPcGVyYXRpb24uRGVsZXRlVGhpcyxcblx0XHRcdFx0KVxuXHRcdFx0XHRjb25zdCByZWN1cnJlbmNlSWRzID0gYXdhaXQgdGhpcy5sYXp5UmVjdXJyZW5jZUlkcyhwcm9nZW5pdG9yLnVpZClcblx0XHRcdFx0cmVjdXJyZW5jZUlkcy5wdXNoKGV4aXN0aW5nSW5zdGFuY2Uuc3RhcnRUaW1lKVxuXHRcdFx0XHRhd2FpdCB0aGlzLm5vdGlmaWNhdGlvbk1vZGVsLnNlbmQobmV3RXZlbnQsIHJlY3VycmVuY2VJZHMsIHNlbmRNb2RlbHMpXG5cdFx0XHRcdGF3YWl0IHRoaXMuY2FsZW5kYXJNb2RlbC51cGRhdGVFdmVudChuZXdFdmVudCwgbmV3QWxhcm1zLCB0aGlzLnpvbmUsIGNhbGVuZGFyLmdyb3VwUm9vdCwgcHJvZ2VuaXRvcilcblx0XHRcdH0pKCksXG5cdFx0KVxuXHR9XG5cblx0LyoqIG9ubHkgcmVtb3ZlIGEgc2luZ2xlIGFsdGVyZWQgaW5zdGFuY2UgZnJvbSB0aGUgc2VydmVyICYgdGhlIHVpZCBpbmRleC4gd2lsbCBub3QgbW9kaWZ5IHRoZSBwcm9nZW5pdG9yLiAqL1xuXHRhc3luYyBkZWxldGVBbHRlcmVkSW5zdGFuY2UoZWRpdE1vZGVsczogQ2FsZW5kYXJFdmVudEVkaXRNb2RlbHMsIGV4aXN0aW5nQWx0ZXJlZEluc3RhbmNlOiBDYWxlbmRhckV2ZW50KTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0ZWRpdE1vZGVscy53aG9Nb2RlbC5zaG91bGRTZW5kVXBkYXRlcyA9IHRydWVcblx0XHRjb25zdCB7IHNlbmRNb2RlbHMgfSA9IGFzc2VtYmxlQ2FsZW5kYXJFdmVudEVkaXRSZXN1bHQoZWRpdE1vZGVscylcblx0XHRzZW5kTW9kZWxzLmNhbmNlbE1vZGVsID0gc2VuZE1vZGVscy51cGRhdGVNb2RlbFxuXHRcdHNlbmRNb2RlbHMudXBkYXRlTW9kZWwgPSBudWxsXG5cdFx0YXdhaXQgdGhpcy5zaG93UHJvZ3Jlc3MoXG5cdFx0XHQoYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRhd2FpdCB0aGlzLm5vdGlmaWNhdGlvbk1vZGVsLnNlbmQoZXhpc3RpbmdBbHRlcmVkSW5zdGFuY2UsIFtdLCBzZW5kTW9kZWxzKVxuXHRcdFx0XHRhd2FpdCB0aGlzLmNhbGVuZGFyTW9kZWwuZGVsZXRlRXZlbnQoZXhpc3RpbmdBbHRlcmVkSW5zdGFuY2UpXG5cdFx0XHR9KSgpLFxuXHRcdClcblx0fVxufVxuIiwiaW1wb3J0IHsgbm9PcCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuXG4vKipcbiAqIFRleHQgdmlldyBtb2RlbCBzdWl0YWJsZSBmb3IgZGF0YSBlbnRyeSB0aGF0IGlzbid0IHJlbmRlcmVkIGFzIEhUTUxcbiAqL1xuZXhwb3J0IGNsYXNzIFNpbXBsZVRleHRWaWV3TW9kZWwge1xuXHRjb25zdHJ1Y3Rvcihwcml2YXRlIHRleHQ6IHN0cmluZywgcHJpdmF0ZSByZWFkb25seSB1aVVwZGF0ZUNhbGxiYWNrOiAoKSA9PiB2b2lkID0gbm9PcCkge31cblxuXHRzZXQgY29udGVudCh0ZXh0OiBzdHJpbmcpIHtcblx0XHR0aGlzLnRleHQgPSB0ZXh0XG5cdFx0dGhpcy51aVVwZGF0ZUNhbGxiYWNrKClcblx0fVxuXG5cdGdldCBjb250ZW50KCk6IHN0cmluZyB7XG5cdFx0cmV0dXJuIHRoaXMudGV4dFxuXHR9XG59XG4iLCIvKipcbiAqIFRoaXMgZmlsZSBjb250YWlucyB0aGUgbW9zdCBpbXBvcnRhbnQgZnVuY3Rpb25zIGFuZCBjbGFzc2VzIHRvIGRldGVybWluZSB0aGUgZXZlbnQgdHlwZSwgdGhlIG9yZ2FuaXplciBvZiB0aGUgZXZlbnQgYW5kIHBvc3NpYmxlXG4gKiBvcmdhbml6ZXJzIGluIGFjY29yZGFuY2Ugd2l0aCB0aGUgY2FwYWJpbGl0aWVzIGZvciBldmVudHMgKHNlZSB0YWJsZSkuXG4gKlxuICogVGhlIG1vc3QgaW1wb3J0YW50IHJlc3RyaWN0aW9uIGlzIHRoYXQgaXQgaXMgaW1wb3NzaWJsZSB0byBjaGFuZ2UgdGhlIGd1ZXN0IGxpc3Qgb3Igc2VuZCB1cGRhdGVzIHRvIGF0dGVuZGVlcyBvbiBldmVudHMgaW5cbiAqIGNhbGVuZGFycyB5b3UgZG8gbm90IG93biwgd2hpY2ggbWVhbnMgdGhhdCB0aGUgZXZlbnQgaGFzIG5vIG9yZ2FuaXplciAoZ3Vlc3QgbGlzdCBpcyBlbXB0eSkgb3IgdGhhdCB0aGUgZXZlbnQgaGFzIGd1ZXN0c1xuICogYW5kIHRoZXJlZm9yZSBhbHNvIGFuIG9yZ2FuaXplciB0aGF0J3Mgbm90IHVzLlxuICpcbiAqIENhcGFiaWxpdHkgZm9yIGV2ZW50cyBpcyBmYWlybHkgY29tcGxpY2F0ZWQ6XG4gKiBOb3RlOiBcInNoYXJlZFwiIGNhbGVuZGFyIG1lYW5zIFwibm90IG93bmVyIG9mIHRoZSBjYWxlbmRhclwiLiBDYWxlbmRhciBhbHdheXMgbG9va3MgbGlrZSBwZXJzb25hbCBmb3IgdGhlIG93bmVyLlxuICogTm90ZTogXCJoYXMgYXR0ZW5kZWVzXCIgYXBwbGllcyB0byBldmVudHMgZm9yIHdoaWNoIGludml0ZXMgd2VyZSBhbHJlYWR5IHNlbnQuIHdoaWxlIGVkaXRpbmcgYW5kIGFkZGluZyBhdHRlbmRlZXMsIFwibm8gYXR0ZW5kZWVzXCIgYXBwbGllcy5cbiAqIE5vdGU6IHRoZSBvbmx5IG9yZ2FuaXplciB0aGF0IGFuIGV2ZW50IGNhbiBoYXZlIGlzIHRoZSBvd25lciBvZiB0aGUgY2FsZW5kYXIgdGhlIGV2ZW50IGlzIGRlZmluZWQgaW4uXG4gKlxuICogfCBFdmVudCBTdGF0ZVx0XHRcdCAgICAgICAgICAgICAgICAgICAgICAgICB8fCBQb3NzaWJsZSBvcGVyYXRpb25zXG4gKiB8IGNhbGVuZGFyIGFjY2VzcyAgfCBldmVudCBvcmlnaW4gfCBoYXMgYXR0ZW5kZWVzIHx8IGVkaXQgZGV0YWlscyAgfCBlZGl0IG93biBhdHRlbmRhbmNlIHwgbW9kaWZ5IGF0dGVuZGVlcyB8IGFkZCBhbGFybXMgfFxuICogfC0tLS0tLS0tLS0tLS0tLS0tLSstLS0tLS0tLS0tLS0tLSstLS0tLS0tLS0tLS0tLS0rKy0tLS0tLS0tLS0tLS0tLSstLS0tLS0tLS0tLS0tLS0tLS0tLS0rLS0tLS0tLS0tLS0tLS0tLS0tfC0tLS0tLS0tLS0tLXxcbiAqIHwgb3duICAgICAgICAgICAgICB8IGNhbGVuZGFyICAgICB8IG5vICAgICAgICAgICAgfHwgeWVzICAgICAgICAgICB8IG4vYSAgICAgICAgICAgICAgICAgfCB5ZXMgICAgICAgICAgICAgIHwgeWVzICAgICAgICB8XG4gKiB8IG93biAgICAgICAgICAgICAgfCBpbnZpdGUgICAgICAgfCBubyAgICAgICAgICAgIHx8IG4vYSAgICAgICAgICAgfCBuL2EgICAgICAgICAgICAgICAgIHwgbi9hICAgICAgICAgICAgICB8IHllcyAgICAgICAgfFxuICogfCBzaGFyZWQgcncgICAgICAgIHwgY2FsZW5kYXIgICAgIHwgbm8gICAgICAgICAgICB8fCB5ZXMgICAgICAgICAgIHwgbi9hICAgICAgICAgICAgICAgICB8IG5vICAgICAgICAgICAgICAgfCB5ZXMgICAgICAgIHxcbiAqIHwgc2hhcmVkIHJ3ICAgICAgICB8IGludml0ZSAgICAgICB8IG5vICAgICAgICAgICAgfHwgbi9hICAgICAgICAgICB8IG4vYSAgICAgICAgICAgICAgICAgfCBuL2EgICAgICAgICAgICAgIHwgeWVzICAgICAgICB8XG4gKiB8IHNoYXJlZCBybyAgICAgICAgfCBhbnkgICAgICAgICAgfCBubyAgICAgICAgICAgIHx8IG5vICAgICAgICAgICAgfCBuL2EgICAgICAgICAgICAgICAgIHwgbm8gICAgICAgICAgICAgICB8IG5vICAgICAgICAgfFxuICogfC0tLS0tLS0tLS0tLS0tLS0tLSstLS0tLS0tLS0tLS0tLSstLS0tLS0tLS0tLS0tLS0rKy0tLS0tLS0tLS0tLS0tLSstLS0tLS0tLS0tLS0tLS0tLS0tLS0rLS0tLS0tLS0tLS0tLS0tLS0tfC0tLS0tLS0tLS0tLXxcbiAqIHwgb3duICAgICAgICAgICAgICB8IGNhbGVuZGFyICAgICB8IHllcyAgICAgICAgICAgfHwgeWVzICAgICAgICAgICB8IHllcyAgICAgICAgICAgICAgICAgfCB5ZXMgICAgICAgICAgICAgIHwgeWVzICAgICAgICB8XG4gKiB8IG93biAgICAgICAgICAgICAgfCBpbnZpdGUgICAgICAgfCB5ZXMgICAgICAgICAgIHx8IG5vICAgICAgICAgICAgfCB5ZXMgICAgICAgICAgICAgICAgIHwgbm8gICAgICAgICAgICAgICB8IHllcyAgICAgICAgfFxuICogfCBzaGFyZWQgcncgICAgICAgIHwgYW55ICAgICAgICAgIHwgeWVzICAgICAgICAgICB8fCBubyAgICAgICAgICAgIHwgbm8gICAgICAgICAgICAgICAgICB8IG5vICAgICAgICAgICAgICAgfCB5ZXMgICAgICAgIHxcbiAqIHwgc2hhcmVkIHJvICAgICAgICB8IGFueSAgICAgICAgICB8IHllcyAgICAgICAgICAgfHwgbm8gICAgICAgICAgICB8IG5vICAgICAgICAgICAgICAgICAgfCBubyAgICAgICAgICAgICAgIHwgbm8gICAgICAgICB8XG4gKlxuICogVGhlIGZhaXJseSBjb21wbGljYXRlZCBldmVudCBlZGl0IG9wZXJhdGlvbiBpcyBzcGxpdCBpbnRvIHNldmVyYWwgc3VibW9kZWxzIHRoYXQgYXJlIHN0b3JlZCBvbiB0aGUgQ2FsZW5kYXJFdmVudE1vZGVsLmVkaXRNb2RlbHMgZmllbGQuXG4gKiBUaGV5IHJvdWdobHkgY29ycmVzcG9uZCB0byB0aGUgcXVlc3Rpb25zIG9mXG4gKiAqIHdoZW4gYW5kIGhvdyBvZnRlbiB0aGUgZXZlbnQgaGFwcGVucyAoc2VlIENhbGVuZGFyRXZlbnRXaGVuTW9kZWwudHMpXG4gKiAqIHdobyBwYXJ0aWNpcGF0ZXMgYW5kIGhhcyBhY2Nlc3MgdG8gdGhlIGV2ZW50IChzZWUgQ2FsZW5kYXJFdmVudFdob01vZGVsLnRzKVxuICogKiB0aGUgYWxhcm1zIHRoZSBjdXJyZW50IHVzZXIgc2V0IGZvciB0aGUgZXZlbnQgKENhbGVuZGFyRXZlbnRBbGFybU1vZGVsLnRzKVxuICogKiB3aGF0IHRoZSBldmVudCBpcyBhYm91dCAoZGVzY3JpcHRpb24sIHN1bW1hcnkpXG4gKiAqIHdoZXJlIHRoZSBldmVudCB0YWtlcyBwbGFjZSAobG9jYXRpb24pXG4gKlxuICogVGhlc2UgYXJlIGluIGRlc2NlbmRpbmcgb3JkZXIgb2YgY29tcGxleGl0eSwgdGhlIGxhc3QgdHdvIHBvaW50cyBhcmUgZXNzZW50aWFsbHkganVzdCAocmljaCl0ZXh0IGZpZWxkcy5cbiAqXG4gKiBUaGUgZ2VuZXJhbCBmbG93IGZvciBlZGl0aW5nIGFuIGV2ZW50IGlzIGFzIGZvbGxvd3M6XG4gKiAqIGNhbGwgbWFrZUNhbGVuZGFyRXZlbnRNb2RlbCAocHJvYmFibHkgdmlhIHRoZSBsb2NhdG9yKS4gVGhlIG1vc3QgaW1wb3J0YW50IGRlY2lzaW9uIGhlcmUgaXMgd2hhdCBFdmVudFR5cGUgd2UgYXJlIGRlYWxpbmcgd2l0aC5cbiAqICogZWRpdCB0aGUgcHJvcGVydGllcyB0aGF0IG5lZWQgdG8gYmUgZWRpdGVkXG4gKiAqIGNhbGwgXCJzYXZlTmV3RXZlbnRcIiBvciBcInVwZGF0ZUV4aXN0aW5nRXZlbnRcIiBvbiB0aGUgQ2FsZW5kYXJFdmVudE1vZGVsLiBpbnRlcm5hbGx5LCB0aGlzIG1lYW5zOlxuICogICAqIHRoZSBtb2RlbCB0YWtlcyB0aGUgY29udGVudHMgb2YgdGhlIGVkaXRNb2RlbHMgZmllbGQgYW5kIHVzZXMgdGhlbSB0byBhc3NlbWJsZSB0aGUgcmVzdWx0IG9mIHRoZSBlZGl0IG9wZXJhdGlvblxuICogICAqIHRoZSBldmVudCBpZGVudGl0eSBpcyBhc3NpZ25lZFxuICogICAqIG5vdGlmeSB0aGUgYXR0ZW5kZWVzIHRoYXQgdGhlIENhbGVuZGFyRXZlbnRXaG9Nb2RlbCBkZXRlcm1pbmVkIG5lZWQgdG8gYmUgbm90aWZpZWRcbiAqICAgKiBzYXZlIHRoZSBldmVudCBhbmQgaXRzIGFsYXJtcyB0byB0aGUgc2VydmVyXG4gKlxuICogV2hpbGUgaXQncyBwb3NzaWJsZSB0byBjYWxsIHRoZSBzYXZlIG9wZXJhdGlvbiBtdWx0aXBsZSB0aW1lcywgdGhlIGludGVudGlvbiBpcyB0byB1c2UgYSBuZXcgbW9kZWwgZm9yIGVhY2ggZWRpdCBvcGVyYXRpb24uXG4gKlxuICogRnV0dXJlIGltcHJvdmVtZW50czogQ2FsZW5kYXJFdmVudE1vZGVsIHNob3VsZCBwcm9iYWJseSBiZSBzZXZlcmFsIGNsYXNzZXMgd2l0aCBhIGdlbmVyaWMgXCJzYXZlXCIgYW5kIFwiZWRpdE1vZGVsc1wiIGludGVyZmFjZSBpbnN0ZWFkXG4gKiBvZiBiZWluZyBjYXBhYmxlIG9mIGRvaW5nIHdoYXRldmVyIGFuZCBiZWluZyBjb250cm9sbGVkIGJ5IHRoZSBjYWxsZXIuXG4gKiAgICAgKiBpbnZpdGU6IHNhdmUgc2VuZHMgdXBkYXRlIHRvIG9yZ2FuaXplciwgdGhlbiBzYXZlcyAoaWYgaXQncyBpbiBvd24gY2FsZW5kYXIpXG4gKiAgICAgKiBuZXcgZXZlbnQ6IHNhdmUgbm90aWZpZXMgYXR0ZW5kZWVzLCBzYXZlcyB0aGUgZXZlbnQgYXMgbmV3LlxuICogICAgICogZXhpc3RpbmcgZXZlbnQ6IHVwZGF0ZXMvaW52aXRlcy9jYW5jZWxzIGF0dGVuZGVlcywgdGhlbiB1cGRhdGVzLlxuICogICAgICogZXRjLlxuICovXG5cbmltcG9ydCB7IEFjY291bnRUeXBlIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzLmpzXCJcbmltcG9ydCB7XG5cdENhbGVuZGFyRXZlbnQsXG5cdENhbGVuZGFyRXZlbnRBdHRlbmRlZSxcblx0Y3JlYXRlQ2FsZW5kYXJFdmVudCxcblx0Y3JlYXRlRW5jcnlwdGVkTWFpbEFkZHJlc3MsXG5cdEVuY3J5cHRlZE1haWxBZGRyZXNzLFxuXHRNYWlsLFxuXHRNYWlsYm94UHJvcGVydGllcyxcbn0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgVXNlciB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vYXBpL2VudGl0aWVzL3N5cy9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgdHlwZSB7IE1haWxib3hEZXRhaWwgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL21haWxGdW5jdGlvbmFsaXR5L01haWxib3hNb2RlbC5qc1wiXG5pbXBvcnQge1xuXHRBbGFybUludGVydmFsLFxuXHRhcmVSZXBlYXRSdWxlc0VxdWFsLFxuXHREZWZhdWx0RGF0ZVByb3ZpZGVyLFxuXHRmaW5kRmlyc3RQcml2YXRlQ2FsZW5kYXIsXG5cdGdldFRpbWVab25lLFxuXHRpbmNyZW1lbnRTZXF1ZW5jZSxcblx0cGFyc2VBbGFybUludGVydmFsLFxufSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2NhbGVuZGFyL2RhdGUvQ2FsZW5kYXJVdGlscy5qc1wiXG5pbXBvcnQgeyBhcnJheUVxdWFsc1dpdGhQcmVkaWNhdGUsIGFzc2VydE5vbk51bGwsIGFzc2VydE5vdE51bGwsIGlkZW50aXR5LCBsYXp5LCBSZXF1aXJlIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBjbGVhbk1haWxBZGRyZXNzIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL0NvbW1vbkNhbGVuZGFyVXRpbHMuanNcIlxuaW1wb3J0IHsgYXNzZXJ0RXZlbnRWYWxpZGl0eSwgQ2FsZW5kYXJJbmZvLCBDYWxlbmRhck1vZGVsIH0gZnJvbSBcIi4uLy4uL21vZGVsL0NhbGVuZGFyTW9kZWwuanNcIlxuaW1wb3J0IHsgTm90Rm91bmRFcnJvciwgUGF5bG9hZFRvb0xhcmdlRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vZXJyb3IvUmVzdEVycm9yLmpzXCJcbmltcG9ydCB7IENhbGVuZGFyTm90aWZpY2F0aW9uU2VuZGVyIH0gZnJvbSBcIi4uLy4uL3ZpZXcvQ2FsZW5kYXJOb3RpZmljYXRpb25TZW5kZXIuanNcIlxuaW1wb3J0IHsgU2VuZE1haWxNb2RlbCB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vbWFpbEZ1bmN0aW9uYWxpdHkvU2VuZE1haWxNb2RlbC5qc1wiXG5pbXBvcnQgeyBVc2VyRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2FwaS9tYWluL1VzZXJFcnJvci5qc1wiXG5pbXBvcnQgeyBFbnRpdHlDbGllbnQgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW50aXR5Q2xpZW50LmpzXCJcbmltcG9ydCB7IFJlY2lwaWVudHNNb2RlbCB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vYXBpL21haW4vUmVjaXBpZW50c01vZGVsLmpzXCJcbmltcG9ydCB7IExvZ2luQ29udHJvbGxlciB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vYXBpL21haW4vTG9naW5Db250cm9sbGVyLmpzXCJcbmltcG9ydCBtIGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IFBhcnRpYWxSZWNpcGllbnQgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vcmVjaXBpZW50cy9SZWNpcGllbnQuanNcIlxuaW1wb3J0IHsgZ2V0UGFzc3dvcmRTdHJlbmd0aEZvclVzZXIgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL21pc2MvcGFzc3dvcmRzL1Bhc3N3b3JkVXRpbHMuanNcIlxuaW1wb3J0IHsgQ2FsZW5kYXJFdmVudFdoZW5Nb2RlbCB9IGZyb20gXCIuL0NhbGVuZGFyRXZlbnRXaGVuTW9kZWwuanNcIlxuaW1wb3J0IHsgQ2FsZW5kYXJFdmVudFdob01vZGVsIH0gZnJvbSBcIi4vQ2FsZW5kYXJFdmVudFdob01vZGVsLmpzXCJcbmltcG9ydCB7IENhbGVuZGFyRXZlbnRBbGFybU1vZGVsIH0gZnJvbSBcIi4vQ2FsZW5kYXJFdmVudEFsYXJtTW9kZWwuanNcIlxuaW1wb3J0IHsgU2FuaXRpemVkVGV4dFZpZXdNb2RlbCB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vbWlzYy9TYW5pdGl6ZWRUZXh0Vmlld01vZGVsLmpzXCJcbmltcG9ydCB7IGdldFN0cmlwcGVkQ2xvbmUsIFN0cmlwcGVkLCBTdHJpcHBlZEVudGl0eSB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9FbnRpdHlVdGlscy5qc1wiXG5pbXBvcnQgeyBVc2VyQ29udHJvbGxlciB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vYXBpL21haW4vVXNlckNvbnRyb2xsZXIuanNcIlxuaW1wb3J0IHsgQ2FsZW5kYXJOb3RpZmljYXRpb25Nb2RlbCwgQ2FsZW5kYXJOb3RpZmljYXRpb25TZW5kTW9kZWxzIH0gZnJvbSBcIi4vQ2FsZW5kYXJOb3RpZmljYXRpb25Nb2RlbC5qc1wiXG5pbXBvcnQgeyBDYWxlbmRhckV2ZW50QXBwbHlTdHJhdGVnaWVzLCBDYWxlbmRhckV2ZW50TW9kZWxTdHJhdGVneSB9IGZyb20gXCIuL0NhbGVuZGFyRXZlbnRNb2RlbFN0cmF0ZWd5LmpzXCJcbmltcG9ydCB7IFByb2dyYW1taW5nRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vZXJyb3IvUHJvZ3JhbW1pbmdFcnJvci5qc1wiXG5pbXBvcnQgeyBTaW1wbGVUZXh0Vmlld01vZGVsIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9taXNjL1NpbXBsZVRleHRWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHsgQWxhcm1JbmZvVGVtcGxhdGUgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L0NhbGVuZGFyRmFjYWRlLmpzXCJcbmltcG9ydCB7IGdldEV2ZW50VHlwZSB9IGZyb20gXCIuLi9DYWxlbmRhckd1aVV0aWxzLmpzXCJcbmltcG9ydCB7IGdldERlZmF1bHRTZW5kZXIgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL21haWxGdW5jdGlvbmFsaXR5L1NoYXJlZE1haWxVdGlscy5qc1wiXG5cbi8qKiB0aGUgdHlwZSBvZiB0aGUgZXZlbnQgZGV0ZXJtaW5lcyB3aGljaCBlZGl0IG9wZXJhdGlvbnMgYXJlIGF2YWlsYWJsZSB0byB1cy4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIEV2ZW50VHlwZSB7XG5cdC8qKiBldmVudCBpbiBvdXIgb3duIGNhbGVuZGFyIGFuZCB3ZSBhcmUgb3JnYW5pemVyICovXG5cdE9XTiA9IFwib3duXCIsXG5cdC8qKiBldmVudCBpbiBzaGFyZWQgY2FsZW5kYXIgd2l0aCByZWFkIHBlcm1pc3Npb24gKi9cblx0U0hBUkVEX1JPID0gXCJzaGFyZWRfcm9cIixcblx0LyoqIGV2ZW50IGluIHNoYXJlZCBjYWxlbmRhciB3aXRoIHdyaXRlIHBlcm1pc3Npb24sIHRoYXQgaGFzIG5vIGF0dGVuZGVlcyAqL1xuXHRTSEFSRURfUlcgPSBcInNoYXJlZF9yd1wiLFxuXHQvKiogc2hhcmVkIHdpdGggd3JpdGUgcGVybWlzc2lvbnMsIGJ1dCB3ZSBjYW4ndCBlZGl0IGFueXRoaW5nIGJ1dCBhbGFybXMgYmVjYXVzZSBpdCBoYXMgYXR0ZW5kZWVzLiBtaWdodCBiZSBzb21ldGhpbmcgdGhlIGNhbGVuZGFyIG93bmVyIHdhcyBpbnZpdGVkIHRvLiAqL1xuXHRMT0NLRUQgPSBcImxvY2tlZFwiLFxuXHQvKiogaW52aXRlIGZyb20gY2FsZW5kYXIgaW52aXRhdGlvbiB3aGljaCBpcyBub3Qgc3RvcmVkIGluIGNhbGVuZGFyIHlldCwgb3IgZXZlbnQgc3RvcmVkIGluICoqb3duIGNhbGVuZGFyKiogYW5kIHdlIGFyZSBub3Qgb3JnYW5pemVyLiAqL1xuXHRJTlZJVEUgPSBcImludml0ZVwiLFxuXHQvKiogd2UgYXJlIGFuIGV4dGVybmFsIHVzZXIgYW5kIHNlZSBhbiBldmVudCBpbiBvdXIgbWFpbGJveCAqL1xuXHRFWFRFUk5BTCA9IFwiZXh0ZXJuYWxcIixcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gUmVhZG9ubHlSZWFzb24ge1xuXHQvKiogaXQncyBhIHNoYXJlZCBldmVudCwgc28gYXQgbGVhc3QgdGhlIGF0dGVuZGVlcyBhcmUgcmVhZC1vbmx5ICovXG5cdFNIQVJFRCxcblx0LyoqIHRoaXMgZWRpdCBvcGVyYXRpb24gYXBwbGllcyB0byBvbmx5IHBhcnQgb2YgYSBzZXJpZXMsIHNvIGF0dGVuZGVlcyBhbmQgY2FsZW5kYXIgYXJlIHJlYWQtb25seSAqL1xuXHRTSU5HTEVfSU5TVEFOQ0UsXG5cdC8qKiB0aGUgb3JnYW5pemVyIGlzIG5vdCB0aGUgY3VycmVudCB1c2VyICovXG5cdE5PVF9PUkdBTklaRVIsXG5cdC8qKiB0aGUgZXZlbnQgY2Fubm90IGJlIGVkaXRlZCBmb3IgYW4gdW5zcGVjaWZpZWQgcmVhc29uLiBUaGlzIGlzIHRoZSBkZWZhdWx0IHZhbHVlICovXG5cdFVOS05PV04sXG5cdC8qKiB3ZSBjYW4gZWRpdCBhbnl0aGluZyBoZXJlICovXG5cdE5PTkUsXG59XG5cbi8qKlxuICogY29tcGxldGUgY2FsZW5kYXIgZXZlbnQgZXhjZXB0IHRoZSBwYXJ0cyB0aGF0IGRlZmluZSB0aGUgaWRlbnRpdHkgb2YgdGhlIGV2ZW50IGluc3RhbmNlIChpbiBpY2FsIHRlcm1zKSBhbmQgdGhlIHRlY2huaWNhbCBmaWVsZHMuXG4gKiB3aGVuIHRoZSBleGNsdWRlZCBmaWVsZHMgYXJlIGFkZGVkLCB0aGlzIHR5cGUgY2FuIGJlIHVzZWQgdG8gc2V0IHVwIGEgc2VyaWVzLCB1cGRhdGUgYSBzZXJpZXMgb3IgcmVzY2hlZHVsZSBhbiBpbnN0YW5jZSBvZiBhIHNlcmllc1xuICogaGFzaGVkVWlkIGlzIGV4Y2x1ZGVkIHNlcGFyYXRlbHkgc2luY2UgaXQncyBub3QgcmVhbGx5IHJlbGV2YW50IHRvIHRoZSBjbGllbnQncyBsb2dpYy5cbiAqL1xuZXhwb3J0IHR5cGUgQ2FsZW5kYXJFdmVudFZhbHVlcyA9IE9taXQ8U3RyaXBwZWQ8Q2FsZW5kYXJFdmVudD4sIEV2ZW50SWRlbnRpdHlGaWVsZE5hbWVzIHwgXCJoYXNoZWRVaWRcIj5cblxuLyoqXG4gKiB0aGUgcGFydHMgb2YgYSBjYWxlbmRhciBldmVudCB0aGF0IGRlZmluZSB0aGUgaWRlbnRpdHkgb2YgdGhlIGV2ZW50IGluc3RhbmNlLlxuICovXG5leHBvcnQgdHlwZSBDYWxlbmRhckV2ZW50SWRlbnRpdHkgPSBQaWNrPFN0cmlwcGVkPENhbGVuZGFyRXZlbnQ+LCBFdmVudElkZW50aXR5RmllbGROYW1lcz5cblxuLyoqXG4gKiB3aGljaCBwYXJ0cyBvZiBhIGNhbGVuZGFyIGV2ZW50IHNlcmllcyB0byBhcHBseSBhbiBlZGl0IG9wZXJhdGlvbiB0by5cbiAqIGNvbnN1bWVycyBtdXN0IHRha2UgY2FyZSB0byBvbmx5IHVzZSBhcHByb3ByaWF0ZSB2YWx1ZXMgZm9yIHRoZSBvcGVyYXRpb25cbiAqIGluIHF1ZXN0aW9uIChpZSByZW1vdmluZyBhIHJlcGVhdCBydWxlIGZyb20gYSBzaW5nbGUgZXZlbnQgaW4gYSBzZXJpZXMgaXMgbm9uc2Vuc2ljYWwpXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIENhbGVuZGFyT3BlcmF0aW9uIHtcblx0LyoqIGNyZWF0ZSBhIG5ldyBldmVudCAqL1xuXHRDcmVhdGUsXG5cdC8qKiBvbmx5IGFwcGx5IGFuIGVkaXQgdG8gb25seSBvbmUgcGFydGljdWxhciBpbnN0YW5jZSBvZiB0aGUgc2VyaWVzICovXG5cdEVkaXRUaGlzLFxuXHQvKiogRGVsZXRlIGEgc2luZ2xlIGluc3RhbmNlIGZyb20gYSBzZXJpZXMsIGFsdGVyZWQgb3Igbm90ICovXG5cdERlbGV0ZVRoaXMsXG5cdC8qKiBhcHBseSB0aGUgZWRpdCBvcGVyYXRpb24gdG8gYWxsIGluc3RhbmNlcyBvZiB0aGUgc2VyaWVzKi9cblx0RWRpdEFsbCxcblx0LyoqIGRlbGV0ZSB0aGUgd2hvbGUgc2VyaWVzICovXG5cdERlbGV0ZUFsbCxcbn1cblxuLyoqXG4gKiBnZXQgdGhlIG1vZGVscyBlbmFibGluZyBjb25zaXN0ZW50IGNhbGVuZGFyIGV2ZW50IHVwZGF0ZXMuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtYWtlQ2FsZW5kYXJFdmVudE1vZGVsKFxuXHRvcGVyYXRpb246IENhbGVuZGFyT3BlcmF0aW9uLFxuXHRpbml0aWFsVmFsdWVzOiBQYXJ0aWFsPENhbGVuZGFyRXZlbnQ+LFxuXHRyZWNpcGllbnRzTW9kZWw6IFJlY2lwaWVudHNNb2RlbCxcblx0Y2FsZW5kYXJNb2RlbDogQ2FsZW5kYXJNb2RlbCxcblx0bG9naW5zOiBMb2dpbkNvbnRyb2xsZXIsXG5cdG1haWxib3hEZXRhaWw6IE1haWxib3hEZXRhaWwsXG5cdG1haWxib3hQcm9wZXJ0aWVzOiBNYWlsYm94UHJvcGVydGllcyxcblx0c2VuZE1haWxNb2RlbEZhY3Rvcnk6IGxhenk8U2VuZE1haWxNb2RlbD4sXG5cdG5vdGlmaWNhdGlvblNlbmRlcjogQ2FsZW5kYXJOb3RpZmljYXRpb25TZW5kZXIsXG5cdGVudGl0eUNsaWVudDogRW50aXR5Q2xpZW50LFxuXHRyZXNwb25zZVRvOiBNYWlsIHwgbnVsbCxcblx0em9uZTogc3RyaW5nID0gZ2V0VGltZVpvbmUoKSxcblx0c2hvd1Byb2dyZXNzOiBTaG93UHJvZ3Jlc3NDYWxsYmFjayA9IGlkZW50aXR5LFxuXHR1aVVwZGF0ZUNhbGxiYWNrOiAoKSA9PiB2b2lkID0gbS5yZWRyYXcsXG4pOiBQcm9taXNlPENhbGVuZGFyRXZlbnRNb2RlbCB8IG51bGw+IHtcblx0Y29uc3QgeyBodG1sU2FuaXRpemVyIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi8uLi8uLi8uLi9jb21tb24vbWlzYy9IdG1sU2FuaXRpemVyLmpzXCIpXG5cdGNvbnN0IG93bk1haWxBZGRyZXNzZXMgPSBnZXRPd25NYWlsQWRkcmVzc2VzV2l0aERlZmF1bHRTZW5kZXJJbkZyb250KGxvZ2lucywgbWFpbGJveERldGFpbCwgbWFpbGJveFByb3BlcnRpZXMpXG5cdGlmIChvcGVyYXRpb24gPT09IENhbGVuZGFyT3BlcmF0aW9uLkRlbGV0ZUFsbCB8fCBvcGVyYXRpb24gPT09IENhbGVuZGFyT3BlcmF0aW9uLkVkaXRBbGwpIHtcblx0XHRhc3NlcnROb25OdWxsKGluaXRpYWxWYWx1ZXMudWlkLCBcInRyaWVkIHRvIGVkaXQvZGVsZXRlIGFsbCB3aXRoIG5vbmV4aXN0ZW50IHVpZFwiKVxuXHRcdGNvbnN0IGluZGV4ID0gYXdhaXQgY2FsZW5kYXJNb2RlbC5nZXRFdmVudHNCeVVpZChpbml0aWFsVmFsdWVzLnVpZClcblx0XHRpZiAoaW5kZXggIT0gbnVsbCAmJiBpbmRleC5wcm9nZW5pdG9yICE9IG51bGwpIHtcblx0XHRcdGluaXRpYWxWYWx1ZXMgPSBpbmRleC5wcm9nZW5pdG9yXG5cdFx0fVxuXHR9XG5cblx0Y29uc3QgdXNlciA9IGxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnVzZXJcblx0Y29uc3QgW2FsYXJtcywgY2FsZW5kYXJzXSA9IGF3YWl0IFByb21pc2UuYWxsKFtcblx0XHRyZXNvbHZlQWxhcm1zRm9yRXZlbnQoaW5pdGlhbFZhbHVlcy5hbGFybUluZm9zID8/IFtdLCBjYWxlbmRhck1vZGVsLCB1c2VyKSxcblx0XHRjYWxlbmRhck1vZGVsLmdldENhbGVuZGFySW5mb3MoKSxcblx0XSlcblx0Y29uc3Qgc2VsZWN0ZWRDYWxlbmRhciA9IGdldFByZXNlbGVjdGVkQ2FsZW5kYXIoY2FsZW5kYXJzLCBpbml0aWFsVmFsdWVzKVxuXHRjb25zdCBnZXRQYXNzd29yZFN0cmVuZ3RoID0gKHBhc3N3b3JkOiBzdHJpbmcsIHJlY2lwaWVudEluZm86IFBhcnRpYWxSZWNpcGllbnQpID0+XG5cdFx0Z2V0UGFzc3dvcmRTdHJlbmd0aEZvclVzZXIocGFzc3dvcmQsIHJlY2lwaWVudEluZm8sIG1haWxib3hEZXRhaWwsIGxvZ2lucylcblxuXHRjb25zdCBldmVudFR5cGUgPSBnZXRFdmVudFR5cGUoXG5cdFx0aW5pdGlhbFZhbHVlcyxcblx0XHRjYWxlbmRhcnMsXG5cdFx0b3duTWFpbEFkZHJlc3Nlcy5tYXAoKHsgYWRkcmVzcyB9KSA9PiBhZGRyZXNzKSxcblx0XHRsb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKSxcblx0KVxuXG5cdGNvbnN0IG1ha2VFZGl0TW9kZWxzID0gKGluaXRpYWxpemF0aW9uRXZlbnQ6IENhbGVuZGFyRXZlbnQpID0+ICh7XG5cdFx0d2hlbk1vZGVsOiBuZXcgQ2FsZW5kYXJFdmVudFdoZW5Nb2RlbChpbml0aWFsaXphdGlvbkV2ZW50LCB6b25lLCB1aVVwZGF0ZUNhbGxiYWNrKSxcblx0XHR3aG9Nb2RlbDogbmV3IENhbGVuZGFyRXZlbnRXaG9Nb2RlbChcblx0XHRcdGluaXRpYWxpemF0aW9uRXZlbnQsXG5cdFx0XHRldmVudFR5cGUsXG5cdFx0XHRvcGVyYXRpb24sXG5cdFx0XHRjYWxlbmRhcnMsXG5cdFx0XHRzZWxlY3RlZENhbGVuZGFyLFxuXHRcdFx0bG9naW5zLmdldFVzZXJDb250cm9sbGVyKCksXG5cdFx0XHRvcGVyYXRpb24gPT09IENhbGVuZGFyT3BlcmF0aW9uLkNyZWF0ZSxcblx0XHRcdG93bk1haWxBZGRyZXNzZXMsXG5cdFx0XHRyZWNpcGllbnRzTW9kZWwsXG5cdFx0XHRyZXNwb25zZVRvLFxuXHRcdFx0Z2V0UGFzc3dvcmRTdHJlbmd0aCxcblx0XHRcdHNlbmRNYWlsTW9kZWxGYWN0b3J5LFxuXHRcdFx0dWlVcGRhdGVDYWxsYmFjayxcblx0XHQpLFxuXHRcdGFsYXJtTW9kZWw6IG5ldyBDYWxlbmRhckV2ZW50QWxhcm1Nb2RlbChldmVudFR5cGUsIGFsYXJtcywgbmV3IERlZmF1bHREYXRlUHJvdmlkZXIoKSwgdWlVcGRhdGVDYWxsYmFjayksXG5cdFx0bG9jYXRpb246IG5ldyBTaW1wbGVUZXh0Vmlld01vZGVsKGluaXRpYWxpemF0aW9uRXZlbnQubG9jYXRpb24sIHVpVXBkYXRlQ2FsbGJhY2spLFxuXHRcdHN1bW1hcnk6IG5ldyBTaW1wbGVUZXh0Vmlld01vZGVsKGluaXRpYWxpemF0aW9uRXZlbnQuc3VtbWFyeSwgdWlVcGRhdGVDYWxsYmFjayksXG5cdFx0ZGVzY3JpcHRpb246IG5ldyBTYW5pdGl6ZWRUZXh0Vmlld01vZGVsKGluaXRpYWxpemF0aW9uRXZlbnQuZGVzY3JpcHRpb24sIGh0bWxTYW5pdGl6ZXIsIHVpVXBkYXRlQ2FsbGJhY2spLFxuXHR9KVxuXG5cdGNvbnN0IHJlY3VycmVuY2VJZHMgPSBhc3luYyAodWlkPzogc3RyaW5nKSA9PlxuXHRcdHVpZCA9PSBudWxsID8gW10gOiAoYXdhaXQgY2FsZW5kYXJNb2RlbC5nZXRFdmVudHNCeVVpZCh1aWQpKT8uYWx0ZXJlZEluc3RhbmNlcy5tYXAoKGkpID0+IGkucmVjdXJyZW5jZUlkKSA/PyBbXVxuXHRjb25zdCBub3RpZmljYXRpb25Nb2RlbCA9IG5ldyBDYWxlbmRhck5vdGlmaWNhdGlvbk1vZGVsKG5vdGlmaWNhdGlvblNlbmRlciwgbG9naW5zKVxuXHRjb25zdCBhcHBseVN0cmF0ZWdpZXMgPSBuZXcgQ2FsZW5kYXJFdmVudEFwcGx5U3RyYXRlZ2llcyhjYWxlbmRhck1vZGVsLCBsb2dpbnMsIG5vdGlmaWNhdGlvbk1vZGVsLCByZWN1cnJlbmNlSWRzLCBzaG93UHJvZ3Jlc3MsIHpvbmUpXG5cdGNvbnN0IGluaXRpYWxPckRlZmF1bHRWYWx1ZXMgPSBPYmplY3QuYXNzaWduKG1ha2VFbXB0eUNhbGVuZGFyRXZlbnQoKSwgaW5pdGlhbFZhbHVlcylcblx0Y29uc3QgY2xlYW5Jbml0aWFsVmFsdWVzID0gY2xlYW51cEluaXRpYWxWYWx1ZXNGb3JFZGl0aW5nKGluaXRpYWxPckRlZmF1bHRWYWx1ZXMpXG5cdGNvbnN0IHByb2dlbml0b3IgPSAoKSA9PiBjYWxlbmRhck1vZGVsLnJlc29sdmVDYWxlbmRhckV2ZW50UHJvZ2VuaXRvcihjbGVhbkluaXRpYWxWYWx1ZXMpXG5cdGNvbnN0IHN0cmF0ZWd5ID0gYXdhaXQgc2VsZWN0U3RyYXRlZ3koXG5cdFx0bWFrZUVkaXRNb2RlbHMsXG5cdFx0YXBwbHlTdHJhdGVnaWVzLFxuXHRcdG9wZXJhdGlvbixcblx0XHRwcm9nZW5pdG9yLFxuXHRcdGNyZWF0ZUNhbGVuZGFyRXZlbnQoaW5pdGlhbE9yRGVmYXVsdFZhbHVlcyksXG5cdFx0Y2xlYW5Jbml0aWFsVmFsdWVzLFxuXHQpXG5cdHJldHVybiBzdHJhdGVneSAmJiBuZXcgQ2FsZW5kYXJFdmVudE1vZGVsKHN0cmF0ZWd5LCBldmVudFR5cGUsIG9wZXJhdGlvbiwgbG9naW5zLmdldFVzZXJDb250cm9sbGVyKCksIG5vdGlmaWNhdGlvblNlbmRlciwgZW50aXR5Q2xpZW50LCBjYWxlbmRhcnMpXG59XG5cbmFzeW5jIGZ1bmN0aW9uIHNlbGVjdFN0cmF0ZWd5KFxuXHRtYWtlRWRpdE1vZGVsczogKGk6IFN0cmlwcGVkRW50aXR5PENhbGVuZGFyRXZlbnQ+KSA9PiBDYWxlbmRhckV2ZW50RWRpdE1vZGVscyxcblx0YXBwbHlTdHJhdGVnaWVzOiBDYWxlbmRhckV2ZW50QXBwbHlTdHJhdGVnaWVzLFxuXHRvcGVyYXRpb246IENhbGVuZGFyT3BlcmF0aW9uLFxuXHRyZXNvbHZlUHJvZ2VuaXRvcjogKCkgPT4gUHJvbWlzZTxDYWxlbmRhckV2ZW50IHwgbnVsbD4sXG5cdGV4aXN0aW5nSW5zdGFuY2VJZGVudGl0eTogQ2FsZW5kYXJFdmVudCxcblx0Y2xlYW5Jbml0aWFsVmFsdWVzOiBTdHJpcHBlZEVudGl0eTxDYWxlbmRhckV2ZW50Pixcbik6IFByb21pc2U8Q2FsZW5kYXJFdmVudE1vZGVsU3RyYXRlZ3kgfCBudWxsPiB7XG5cdGxldCBlZGl0TW9kZWxzOiBDYWxlbmRhckV2ZW50RWRpdE1vZGVsc1xuXHRsZXQgYXBwbHk6ICgpID0+IFByb21pc2U8dm9pZD5cblx0bGV0IG1heVJlcXVpcmVTZW5kaW5nVXBkYXRlczogKCkgPT4gYm9vbGVhblxuXHRpZiAob3BlcmF0aW9uID09PSBDYWxlbmRhck9wZXJhdGlvbi5DcmVhdGUpIHtcblx0XHRlZGl0TW9kZWxzID0gbWFrZUVkaXRNb2RlbHMoY2xlYW5Jbml0aWFsVmFsdWVzKVxuXHRcdGFwcGx5ID0gKCkgPT4gYXBwbHlTdHJhdGVnaWVzLnNhdmVOZXdFdmVudChlZGl0TW9kZWxzKVxuXHRcdG1heVJlcXVpcmVTZW5kaW5nVXBkYXRlcyA9ICgpID0+IHRydWVcblx0fSBlbHNlIGlmIChvcGVyYXRpb24gPT09IENhbGVuZGFyT3BlcmF0aW9uLkVkaXRUaGlzKSB7XG5cdFx0Y2xlYW5Jbml0aWFsVmFsdWVzLnJlcGVhdFJ1bGUgPSBudWxsXG5cdFx0aWYgKGNsZWFuSW5pdGlhbFZhbHVlcy5yZWN1cnJlbmNlSWQgPT0gbnVsbCkge1xuXHRcdFx0Y29uc3QgcHJvZ2VuaXRvciA9IGF3YWl0IHJlc29sdmVQcm9nZW5pdG9yKClcblx0XHRcdGlmIChwcm9nZW5pdG9yID09IG51bGwgfHwgcHJvZ2VuaXRvci5yZXBlYXRSdWxlID09IG51bGwpIHtcblx0XHRcdFx0Y29uc29sZS53YXJuKFwibm8gcmVwZWF0aW5nIHByb2dlbml0b3IgZHVyaW5nIEVkaXRUaGlzIG9wZXJhdGlvbj9cIilcblx0XHRcdFx0cmV0dXJuIG51bGxcblx0XHRcdH1cblx0XHRcdGFwcGx5ID0gKCkgPT5cblx0XHRcdFx0YXBwbHlTdHJhdGVnaWVzLnNhdmVOZXdBbHRlcmVkSW5zdGFuY2Uoe1xuXHRcdFx0XHRcdGVkaXRNb2RlbHM6IGVkaXRNb2RlbHMsXG5cdFx0XHRcdFx0ZWRpdE1vZGVsc0ZvclByb2dlbml0b3I6IG1ha2VFZGl0TW9kZWxzKHByb2dlbml0b3IpLFxuXHRcdFx0XHRcdGV4aXN0aW5nSW5zdGFuY2U6IGV4aXN0aW5nSW5zdGFuY2VJZGVudGl0eSxcblx0XHRcdFx0XHRwcm9nZW5pdG9yOiBwcm9nZW5pdG9yLFxuXHRcdFx0XHR9KVxuXHRcdFx0bWF5UmVxdWlyZVNlbmRpbmdVcGRhdGVzID0gKCkgPT4gdHJ1ZVxuXHRcdFx0ZWRpdE1vZGVscyA9IG1ha2VFZGl0TW9kZWxzKGNsZWFuSW5pdGlhbFZhbHVlcylcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZWRpdE1vZGVscyA9IG1ha2VFZGl0TW9kZWxzKGNsZWFuSW5pdGlhbFZhbHVlcylcblx0XHRcdGFwcGx5ID0gKCkgPT4gYXBwbHlTdHJhdGVnaWVzLnNhdmVFeGlzdGluZ0FsdGVyZWRJbnN0YW5jZShlZGl0TW9kZWxzLCBleGlzdGluZ0luc3RhbmNlSWRlbnRpdHkpXG5cdFx0XHRtYXlSZXF1aXJlU2VuZGluZ1VwZGF0ZXMgPSAoKSA9PiBhc3NlbWJsZUVkaXRSZXN1bHRBbmRBc3NpZ25Gcm9tRXhpc3RpbmcoZXhpc3RpbmdJbnN0YW5jZUlkZW50aXR5LCBlZGl0TW9kZWxzLCBvcGVyYXRpb24pLmhhc1VwZGF0ZVdvcnRoeUNoYW5nZXNcblx0XHR9XG5cdH0gZWxzZSBpZiAob3BlcmF0aW9uID09PSBDYWxlbmRhck9wZXJhdGlvbi5EZWxldGVUaGlzKSB7XG5cdFx0aWYgKGNsZWFuSW5pdGlhbFZhbHVlcy5yZWN1cnJlbmNlSWQgPT0gbnVsbCkge1xuXHRcdFx0Y29uc3QgcHJvZ2VuaXRvciA9IGF3YWl0IHJlc29sdmVQcm9nZW5pdG9yKClcblx0XHRcdGlmIChwcm9nZW5pdG9yID09IG51bGwpIHtcblx0XHRcdFx0cmV0dXJuIG51bGxcblx0XHRcdH1cblx0XHRcdGVkaXRNb2RlbHMgPSBtYWtlRWRpdE1vZGVscyhwcm9nZW5pdG9yKVxuXHRcdFx0YXBwbHkgPSAoKSA9PiBhcHBseVN0cmF0ZWdpZXMuZXhjbHVkZVNpbmdsZUluc3RhbmNlKGVkaXRNb2RlbHMsIGV4aXN0aW5nSW5zdGFuY2VJZGVudGl0eSwgcHJvZ2VuaXRvcilcblx0XHRcdG1heVJlcXVpcmVTZW5kaW5nVXBkYXRlcyA9ICgpID0+IHRydWVcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZWRpdE1vZGVscyA9IG1ha2VFZGl0TW9kZWxzKGNsZWFuSW5pdGlhbFZhbHVlcylcblx0XHRcdGFwcGx5ID0gKCkgPT4gYXBwbHlTdHJhdGVnaWVzLmRlbGV0ZUFsdGVyZWRJbnN0YW5jZShlZGl0TW9kZWxzLCBleGlzdGluZ0luc3RhbmNlSWRlbnRpdHkpXG5cdFx0XHRtYXlSZXF1aXJlU2VuZGluZ1VwZGF0ZXMgPSAoKSA9PiB0cnVlXG5cdFx0fVxuXHR9IGVsc2UgaWYgKG9wZXJhdGlvbiA9PT0gQ2FsZW5kYXJPcGVyYXRpb24uRWRpdEFsbCkge1xuXHRcdGNvbnN0IHByb2dlbml0b3IgPSBhd2FpdCByZXNvbHZlUHJvZ2VuaXRvcigpXG5cdFx0aWYgKHByb2dlbml0b3IgPT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuIG51bGxcblx0XHR9XG5cdFx0ZWRpdE1vZGVscyA9IG1ha2VFZGl0TW9kZWxzKGNsZWFuSW5pdGlhbFZhbHVlcylcblx0XHRhcHBseSA9ICgpID0+IGFwcGx5U3RyYXRlZ2llcy5zYXZlRW50aXJlRXhpc3RpbmdFdmVudChlZGl0TW9kZWxzLCBwcm9nZW5pdG9yKVxuXHRcdG1heVJlcXVpcmVTZW5kaW5nVXBkYXRlcyA9ICgpID0+IGFzc2VtYmxlRWRpdFJlc3VsdEFuZEFzc2lnbkZyb21FeGlzdGluZyhleGlzdGluZ0luc3RhbmNlSWRlbnRpdHksIGVkaXRNb2RlbHMsIG9wZXJhdGlvbikuaGFzVXBkYXRlV29ydGh5Q2hhbmdlc1xuXHR9IGVsc2UgaWYgKG9wZXJhdGlvbiA9PT0gQ2FsZW5kYXJPcGVyYXRpb24uRGVsZXRlQWxsKSB7XG5cdFx0ZWRpdE1vZGVscyA9IG1ha2VFZGl0TW9kZWxzKGNsZWFuSW5pdGlhbFZhbHVlcylcblx0XHRhcHBseSA9ICgpID0+IGFwcGx5U3RyYXRlZ2llcy5kZWxldGVFbnRpcmVFeGlzdGluZ0V2ZW50KGVkaXRNb2RlbHMsIGV4aXN0aW5nSW5zdGFuY2VJZGVudGl0eSlcblx0XHRtYXlSZXF1aXJlU2VuZGluZ1VwZGF0ZXMgPSAoKSA9PiBhc3NlbWJsZUVkaXRSZXN1bHRBbmRBc3NpZ25Gcm9tRXhpc3RpbmcoZXhpc3RpbmdJbnN0YW5jZUlkZW50aXR5LCBlZGl0TW9kZWxzLCBvcGVyYXRpb24pLmhhc1VwZGF0ZVdvcnRoeUNoYW5nZXNcblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgUHJvZ3JhbW1pbmdFcnJvcihgdW5rbm93biBjYWxlbmRhciBvcGVyYXRpb246ICR7b3BlcmF0aW9ufWApXG5cdH1cblxuXHRyZXR1cm4geyBhcHBseSwgbWF5UmVxdWlyZVNlbmRpbmdVcGRhdGVzLCBlZGl0TW9kZWxzIH1cbn1cblxuLyoqIHJldHVybiBhbGwgdGhlIGF0dGVuZGVlcyBpbiB0aGUgbGlzdCBvZiBhdHRlbmRlZXMgdGhhdCBhcmUgbm90IHRoZSBnaXZlbiBvcmdhbml6ZXIuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Tm9uT3JnYW5pemVyQXR0ZW5kZWVzKHtcblx0b3JnYW5pemVyLFxuXHRhdHRlbmRlZXMsXG59OiBQYXJ0aWFsPFBpY2s8UmVhZG9ubHk8Q2FsZW5kYXJFdmVudD4sIFwiYXR0ZW5kZWVzXCIgfCBcIm9yZ2FuaXplclwiPj4pOiBSZWFkb25seUFycmF5PENhbGVuZGFyRXZlbnRBdHRlbmRlZT4ge1xuXHRpZiAoYXR0ZW5kZWVzID09IG51bGwpIHJldHVybiBbXVxuXHRpZiAob3JnYW5pemVyID09IG51bGwpIHJldHVybiBhdHRlbmRlZXNcblx0Y29uc3Qgb3JnYW5pemVyQWRkcmVzcyA9IGNsZWFuTWFpbEFkZHJlc3Mob3JnYW5pemVyLmFkZHJlc3MpXG5cdHJldHVybiBhdHRlbmRlZXMuZmlsdGVyKChhKSA9PiBjbGVhbk1haWxBZGRyZXNzKGEuYWRkcmVzcy5hZGRyZXNzKSAhPT0gb3JnYW5pemVyQWRkcmVzcykgPz8gW11cbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHRoZSBldmVudCB0eXBlLCB0aGUgb3JnYW5pemVyIG9mIHRoZSBldmVudCBhbmQgcG9zc2libGUgb3JnYW5pemVycyBpbiBhY2NvcmRhbmNlIHdpdGggdGhlIGNhcGFiaWxpdGllcyBmb3IgZXZlbnRzIChzZWUgdGFibGUpLlxuICovXG5leHBvcnQgY2xhc3MgQ2FsZW5kYXJFdmVudE1vZGVsIHtcblx0cHJvY2Vzc2luZzogYm9vbGVhbiA9IGZhbHNlXG5cblx0Z2V0IGVkaXRNb2RlbHMoKTogQ2FsZW5kYXJFdmVudEVkaXRNb2RlbHMge1xuXHRcdHJldHVybiB0aGlzLnN0cmF0ZWd5LmVkaXRNb2RlbHNcblx0fVxuXG5cdGNvbnN0cnVjdG9yKFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgc3RyYXRlZ3k6IENhbGVuZGFyRXZlbnRNb2RlbFN0cmF0ZWd5LFxuXHRcdHB1YmxpYyByZWFkb25seSBldmVudFR5cGU6IEV2ZW50VHlwZSxcblx0XHRwdWJsaWMgcmVhZG9ubHkgb3BlcmF0aW9uOiBDYWxlbmRhck9wZXJhdGlvbixcblx0XHQvLyBVc2VyQ29udHJvbGxlciBhbHJlYWR5IGtlZXBzIHRyYWNrIG9mIHVzZXIgdXBkYXRlcywgaXQgaXMgYmV0dGVyIHRvIG5vdCBoYXZlIG91ciBvd24gcmVmZXJlbmNlIHRvIHRoZSB1c2VyLCB3ZSBtaWdodCBtaXNzXG5cdFx0Ly8gaW1wb3J0YW50IHVwZGF0ZXMgbGlrZSBwcmVtaXVtIHVwZ3JhZGVcblx0XHRyZWFkb25seSB1c2VyQ29udHJvbGxlcjogVXNlckNvbnRyb2xsZXIsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBkaXN0cmlidXRvcjogQ2FsZW5kYXJOb3RpZmljYXRpb25TZW5kZXIsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBlbnRpdHlDbGllbnQ6IEVudGl0eUNsaWVudCxcblx0XHRwcml2YXRlIHJlYWRvbmx5IGNhbGVuZGFyczogUmVhZG9ubHlNYXA8SWQsIENhbGVuZGFySW5mbz4sXG5cdCkge1xuXHRcdHRoaXMuY2FsZW5kYXJzID0gY2FsZW5kYXJzXG5cdH1cblxuXHRhc3luYyBhcHBseSgpOiBQcm9taXNlPEV2ZW50U2F2ZVJlc3VsdD4ge1xuXHRcdGlmICh0aGlzLnVzZXJDb250cm9sbGVyLnVzZXIuYWNjb3VudFR5cGUgPT09IEFjY291bnRUeXBlLkVYVEVSTkFMKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhcImRpZCBub3QgYXBwbHkgZXZlbnQgY2hhbmdlcywgd2UncmUgYW4gZXh0ZXJuYWwgdXNlci5cIilcblx0XHRcdHJldHVybiBFdmVudFNhdmVSZXN1bHQuRmFpbGVkXG5cdFx0fVxuXHRcdGlmICh0aGlzLnByb2Nlc3NpbmcpIHtcblx0XHRcdHJldHVybiBFdmVudFNhdmVSZXN1bHQuRmFpbGVkXG5cdFx0fVxuXHRcdHRoaXMucHJvY2Vzc2luZyA9IHRydWVcblxuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCB0aGlzLnN0cmF0ZWd5LmFwcGx5KClcblx0XHRcdHJldHVybiBFdmVudFNhdmVSZXN1bHQuU2F2ZWRcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRpZiAoZSBpbnN0YW5jZW9mIFBheWxvYWRUb29MYXJnZUVycm9yKSB7XG5cdFx0XHRcdHRocm93IG5ldyBVc2VyRXJyb3IoXCJyZXF1ZXN0VG9vTGFyZ2VfbXNnXCIpXG5cdFx0XHR9IGVsc2UgaWYgKGUgaW5zdGFuY2VvZiBOb3RGb3VuZEVycm9yKSB7XG5cdFx0XHRcdHJldHVybiBFdmVudFNhdmVSZXN1bHQuTm90Rm91bmRcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93IGVcblx0XHRcdH1cblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0dGhpcy5wcm9jZXNzaW5nID0gZmFsc2Vcblx0XHR9XG5cdH1cblxuXHQvKiogZmFsc2UgaWYgdGhlIGV2ZW50IGlzIG9ubHkgcGFydGlhbGx5IG9yIG5vdCBhdCBhbGwgd3JpdGFibGUgKi9cblx0aXNGdWxseVdyaXRhYmxlKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLmV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLk9XTiB8fCB0aGlzLmV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLlNIQVJFRF9SV1xuXHR9XG5cblx0LyoqIHNvbWUgZWRpdCBvcGVyYXRpb25zIGFwcGx5IHRvIHRoZSB3aG9sZSBldmVudCBzZXJpZXMuXG5cdCAqIHRoZXkgYXJlIG5vdCBwb3NzaWJsZSBpZiB0aGUgb3BlcmF0aW9uIHRoZSBtb2RlbCB3YXMgY3JlYXRlZCB3aXRoIG9ubHkgYXBwbGllcyB0byBhIHNpbmdsZSBpbnN0YW5jZS5cblx0ICpcblx0ICogcmV0dXJucyB0cnVlIGlmIHN1Y2ggb3BlcmF0aW9ucyBjYW4gYmUgYXR0ZW1wdGVkLlxuXHQgKiAqL1xuXHRjYW5FZGl0U2VyaWVzKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLm9wZXJhdGlvbiAhPT0gQ2FsZW5kYXJPcGVyYXRpb24uRWRpdFRoaXMgJiYgKHRoaXMuZXZlbnRUeXBlID09PSBFdmVudFR5cGUuT1dOIHx8IHRoaXMuZXZlbnRUeXBlID09PSBFdmVudFR5cGUuU0hBUkVEX1JXKVxuXHR9XG5cblx0Y2FuQ2hhbmdlQ2FsZW5kYXIoKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIChcblx0XHRcdHRoaXMub3BlcmF0aW9uICE9PSBDYWxlbmRhck9wZXJhdGlvbi5FZGl0VGhpcyAmJlxuXHRcdFx0KHRoaXMuZXZlbnRUeXBlID09PSBFdmVudFR5cGUuT1dOIHx8IHRoaXMuZXZlbnRUeXBlID09PSBFdmVudFR5cGUuU0hBUkVEX1JXIHx8IHRoaXMuZXZlbnRUeXBlID09PSBFdmVudFR5cGUuSU5WSVRFKVxuXHRcdClcblx0fVxuXG5cdGlzQXNraW5nRm9yVXBkYXRlc05lZWRlZCgpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0dGhpcy5ldmVudFR5cGUgPT09IEV2ZW50VHlwZS5PV04gJiZcblx0XHRcdCF0aGlzLmVkaXRNb2RlbHMud2hvTW9kZWwuc2hvdWxkU2VuZFVwZGF0ZXMgJiZcblx0XHRcdHRoaXMuZWRpdE1vZGVscy53aG9Nb2RlbC5pbml0aWFsbHlIYWRPdGhlckF0dGVuZGVlcyAmJlxuXHRcdFx0dGhpcy5zdHJhdGVneS5tYXlSZXF1aXJlU2VuZGluZ1VwZGF0ZXMoKVxuXHRcdClcblx0fVxuXG5cdGdldFJlYWRvbmx5UmVhc29uKCk6IFJlYWRvbmx5UmVhc29uIHtcblx0XHRjb25zdCBpc0Z1bGx5V3JpdGFibGUgPSB0aGlzLmlzRnVsbHlXcml0YWJsZSgpXG5cdFx0Y29uc3QgY2FuRWRpdFNlcmllcyA9IHRoaXMuY2FuRWRpdFNlcmllcygpXG5cdFx0Y29uc3QgY2FuTW9kaWZ5R3Vlc3RzID0gdGhpcy5lZGl0TW9kZWxzLndob01vZGVsLmNhbk1vZGlmeUd1ZXN0c1xuXG5cdFx0aWYgKGlzRnVsbHlXcml0YWJsZSAmJiBjYW5FZGl0U2VyaWVzICYmIGNhbk1vZGlmeUd1ZXN0cykgcmV0dXJuIFJlYWRvbmx5UmVhc29uLk5PTkVcblx0XHRpZiAoIWlzRnVsbHlXcml0YWJsZSAmJiAhY2FuRWRpdFNlcmllcyAmJiAhY2FuTW9kaWZ5R3Vlc3RzKSByZXR1cm4gUmVhZG9ubHlSZWFzb24uTk9UX09SR0FOSVpFUlxuXHRcdC8vIGZ1bGx5IHdyaXRhYmxlIGFuZCAhY2FuTW9kaWZ5R3Vlc3RzIGhhcHBlbnMgb24gc2hhcmVkIGNhbGVuZGFyc1xuXHRcdGlmICghY2FuTW9kaWZ5R3Vlc3RzKSB7XG5cdFx0XHRpZiAoY2FuRWRpdFNlcmllcykge1xuXHRcdFx0XHRyZXR1cm4gUmVhZG9ubHlSZWFzb24uU0hBUkVEXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gUmVhZG9ubHlSZWFzb24uU0lOR0xFX0lOU1RBTkNFXG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBSZWFkb25seVJlYXNvbi5VTktOT1dOXG5cdH1cbn1cblxuLyoqXG4gKlxuICogQHBhcmFtIG5vdyB0aGUgbmV3IGV2ZW50LlxuICogQHBhcmFtIHByZXZpb3VzIHRoZSBldmVudCBhcyBpdCBvcmlnaW5hbGx5IHdhc1xuICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWYgY2hhbmdlcyB3ZXJlIG1hZGUgdG8gdGhlIGV2ZW50IHRoYXQganVzdGlmeSBzZW5kaW5nIHVwZGF0ZXMgdG8gYXR0ZW5kZWVzLlxuICogZXhwb3J0ZWQgZm9yIHRlc3RpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV2ZW50SGFzQ2hhbmdlZChub3c6IENhbGVuZGFyRXZlbnQsIHByZXZpb3VzOiBQYXJ0aWFsPENhbGVuZGFyRXZlbnQ+IHwgbnVsbCk6IGJvb2xlYW4ge1xuXHRpZiAocHJldmlvdXMgPT0gbnVsbCkgcmV0dXJuIHRydWVcblx0Ly8gd2UgZG8gbm90IGNoZWNrIGZvciB0aGUgc2VxdWVuY2UgbnVtYmVyIChhcyBpdCBzaG91bGQgYmUgY2hhbmdlZCB3aXRoIGV2ZXJ5IHVwZGF0ZSkgb3IgdGhlIGRlZmF1bHQgaW5zdGFuY2UgcHJvcGVydGllcyBzdWNoIGFzIF9pZFxuXHRyZXR1cm4gKFxuXHRcdG5vdy5zdGFydFRpbWUuZ2V0VGltZSgpICE9PSBwcmV2aW91cz8uc3RhcnRUaW1lPy5nZXRUaW1lKCkgfHxcblx0XHRub3cuZGVzY3JpcHRpb24gIT09IHByZXZpb3VzPy5kZXNjcmlwdGlvbiB8fFxuXHRcdG5vdy5zdW1tYXJ5ICE9PSBwcmV2aW91cy5zdW1tYXJ5IHx8XG5cdFx0bm93LmxvY2F0aW9uICE9PSBwcmV2aW91cy5sb2NhdGlvbiB8fFxuXHRcdG5vdy5lbmRUaW1lLmdldFRpbWUoKSAhPT0gcHJldmlvdXM/LmVuZFRpbWU/LmdldFRpbWUoKSB8fFxuXHRcdG5vdy5pbnZpdGVkQ29uZmlkZW50aWFsbHkgIT09IHByZXZpb3VzLmludml0ZWRDb25maWRlbnRpYWxseSB8fFxuXHRcdC8vIHNob3VsZCB0aGlzIGJlIGEgaGFyZCBlcnJvciwgd2UgbmV2ZXIgd2FudCB0byBjaGFuZ2UgdGhlIHVpZCBvciBjb21wYXJlIGV2ZW50cyB3aXRoIGRpZmZlcmVudCBVSURzP1xuXHRcdG5vdy51aWQgIT09IHByZXZpb3VzLnVpZCB8fFxuXHRcdCFhcmVSZXBlYXRSdWxlc0VxdWFsKG5vdy5yZXBlYXRSdWxlLCBwcmV2aW91cz8ucmVwZWF0UnVsZSA/PyBudWxsKSB8fFxuXHRcdCFhcnJheUVxdWFsc1dpdGhQcmVkaWNhdGUoXG5cdFx0XHRub3cuYXR0ZW5kZWVzLFxuXHRcdFx0cHJldmlvdXM/LmF0dGVuZGVlcyA/PyBbXSxcblx0XHRcdChhMSwgYTIpID0+IGExLnN0YXR1cyA9PT0gYTIuc3RhdHVzICYmIGNsZWFuTWFpbEFkZHJlc3MoYTEuYWRkcmVzcy5hZGRyZXNzKSA9PT0gY2xlYW5NYWlsQWRkcmVzcyhhMi5hZGRyZXNzLmFkZHJlc3MpLFxuXHRcdCkgfHwgLy8gd2UgaWdub3JlIHRoZSBuYW1lc1xuXHRcdChub3cub3JnYW5pemVyICE9PSBwcmV2aW91cy5vcmdhbml6ZXIgJiYgbm93Lm9yZ2FuaXplcj8uYWRkcmVzcyAhPT0gcHJldmlvdXMub3JnYW5pemVyPy5hZGRyZXNzKVxuXHQpIC8vIHdlIGlnbm9yZSB0aGUgbmFtZXNcbn1cblxuLyoqXG4gKiBjb25zdHJ1Y3QgYSB1c2FibGUgY2FsZW5kYXIgZXZlbnQgZnJvbSB0aGUgcmVzdWx0IG9mIG9uZSBvciBtb3JlIGVkaXQgb3BlcmF0aW9ucy5cbiAqIHJldHVybnMgdGhlIG5ldyBhbGFybXMgc2VwYXJhdGVseSBzbyB0aGV5IGNhbiBiZSBzZXQgdXBcbiAqIG9uIHRoZSBzZXJ2ZXIgYmVmb3JlIGFzc2lnbmluZyB0aGUgaWRzLlxuICogQHBhcmFtIG1vZGVsc1xuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZW1ibGVDYWxlbmRhckV2ZW50RWRpdFJlc3VsdChtb2RlbHM6IENhbGVuZGFyRXZlbnRFZGl0TW9kZWxzKToge1xuXHRldmVudFZhbHVlczogQ2FsZW5kYXJFdmVudFZhbHVlc1xuXHRuZXdBbGFybXM6IFJlYWRvbmx5QXJyYXk8QWxhcm1JbmZvVGVtcGxhdGU+XG5cdHNlbmRNb2RlbHM6IENhbGVuZGFyTm90aWZpY2F0aW9uU2VuZE1vZGVsc1xuXHRjYWxlbmRhcjogQ2FsZW5kYXJJbmZvXG59IHtcblx0Y29uc3Qgd2hlblJlc3VsdCA9IG1vZGVscy53aGVuTW9kZWwucmVzdWx0XG5cdGNvbnN0IHdob1Jlc3VsdCA9IG1vZGVscy53aG9Nb2RlbC5yZXN1bHRcblx0Y29uc3QgYWxhcm1SZXN1bHQgPSBtb2RlbHMuYWxhcm1Nb2RlbC5yZXN1bHRcblx0Y29uc3Qgc3VtbWFyeSA9IG1vZGVscy5zdW1tYXJ5LmNvbnRlbnRcblx0Y29uc3QgZGVzY3JpcHRpb24gPSBtb2RlbHMuZGVzY3JpcHRpb24uY29udGVudFxuXHRjb25zdCBsb2NhdGlvbiA9IG1vZGVscy5sb2NhdGlvbi5jb250ZW50XG5cblx0cmV0dXJuIHtcblx0XHRldmVudFZhbHVlczoge1xuXHRcdFx0Ly8gd2hlbj9cblx0XHRcdHN0YXJ0VGltZTogd2hlblJlc3VsdC5zdGFydFRpbWUsXG5cdFx0XHRlbmRUaW1lOiB3aGVuUmVzdWx0LmVuZFRpbWUsXG5cdFx0XHRyZXBlYXRSdWxlOiB3aGVuUmVzdWx0LnJlcGVhdFJ1bGUsXG5cdFx0XHQvLyB3aGF0P1xuXHRcdFx0c3VtbWFyeSxcblx0XHRcdGRlc2NyaXB0aW9uLFxuXHRcdFx0Ly8gd2hlcmU/XG5cdFx0XHRsb2NhdGlvbixcblx0XHRcdC8vIHdobz9cblx0XHRcdGludml0ZWRDb25maWRlbnRpYWxseTogd2hvUmVzdWx0LmlzQ29uZmlkZW50aWFsLFxuXHRcdFx0b3JnYW5pemVyOiB3aG9SZXN1bHQub3JnYW5pemVyLFxuXHRcdFx0YXR0ZW5kZWVzOiB3aG9SZXN1bHQuYXR0ZW5kZWVzLFxuXHRcdFx0Ly8gZmllbGRzIHJlbGF0ZWQgdG8gdGhlIGV2ZW50IGluc3RhbmNlJ3MgaWRlbnRpdHkgYXJlIGV4Y2x1ZGVkLlxuXHRcdFx0Ly8gcmVtaW5kZXJzLiB3aWxsIGJlIHNldCB1cCBzZXBhcmF0ZWx5LlxuXHRcdFx0YWxhcm1JbmZvczogW10sXG5cdFx0fSxcblx0XHRuZXdBbGFybXM6IGFsYXJtUmVzdWx0LmFsYXJtcyxcblx0XHRzZW5kTW9kZWxzOiB3aG9SZXN1bHQsXG5cdFx0Y2FsZW5kYXI6IHdob1Jlc3VsdC5jYWxlbmRhcixcblx0fVxufVxuXG4vKiogYXNzZW1ibGUgdGhlIGVkaXQgcmVzdWx0IGZyb20gYW4gZXhpc3RpbmcgZXZlbnQgZWRpdCBvcGVyYXRpb24gYW5kIGFwcGx5IHNvbWUgZmllbGRzIGZyb20gdGhlIG9yaWdpbmFsIGV2ZW50XG4gKiBAcGFyYW0gZXhpc3RpbmdFdmVudCB0aGUgZXZlbnQgd2Ugd2lsbCBiZSB1cGRhdGluZyBhbmQgdGFrZSBpZCwgb3duZXJHcm91cCBhbmQgcGVybWlzc2lvbnMgZnJvbSBhcyB3ZWxsIGFzIHRoZSB1aWQsIHNlcXVlbmNlIHRvIGluY3JlbWVudCBhbmQgcmVjdXJyZW5jZUlkXG4gKiBAcGFyYW0gZWRpdE1vZGVscyB0aGUgZWRpdE1vZGVscyBwcm92aWRpbmcgdGhlIHZhbHVlcyBmb3IgdGhlIG5ldyBldmVudC5cbiAqIEBwYXJhbSBvcGVyYXRpb24gZGV0ZXJtaW5lcyB0aGUgc291cmNlIG9mIHRoZSByZWN1cnJlbmNlSWQgLSBpbiB0aGUgY2FzZSBvZiBFZGl0VGhpcyBpdCdzIHRoZSBzdGFydCB0aW1lIG9mIHRoZSBvcmlnaW5hbCBldmVudCwgb3RoZXJ3aXNlIGV4aXN0aW5nRXZlbnRzJyByZWN1cnJlbmNlSWQgaXMgdXNlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VtYmxlRWRpdFJlc3VsdEFuZEFzc2lnbkZyb21FeGlzdGluZyhleGlzdGluZ0V2ZW50OiBDYWxlbmRhckV2ZW50LCBlZGl0TW9kZWxzOiBDYWxlbmRhckV2ZW50RWRpdE1vZGVscywgb3BlcmF0aW9uOiBDYWxlbmRhck9wZXJhdGlvbikge1xuXHRjb25zdCBhc3NlbWJsZVJlc3VsdCA9IGFzc2VtYmxlQ2FsZW5kYXJFdmVudEVkaXRSZXN1bHQoZWRpdE1vZGVscylcblx0Y29uc3QgeyB1aWQ6IG9sZFVpZCwgc2VxdWVuY2U6IG9sZFNlcXVlbmNlLCByZWN1cnJlbmNlSWQgfSA9IGV4aXN0aW5nRXZlbnRcblx0Y29uc3QgbmV3RXZlbnQgPSBhc3NpZ25FdmVudElkZW50aXR5KGFzc2VtYmxlUmVzdWx0LmV2ZW50VmFsdWVzLCB7XG5cdFx0dWlkOiBvbGRVaWQhLFxuXHRcdHNlcXVlbmNlOiBpbmNyZW1lbnRTZXF1ZW5jZShvbGRTZXF1ZW5jZSksXG5cdFx0cmVjdXJyZW5jZUlkOiBvcGVyYXRpb24gPT09IENhbGVuZGFyT3BlcmF0aW9uLkVkaXRUaGlzICYmIHJlY3VycmVuY2VJZCA9PSBudWxsID8gZXhpc3RpbmdFdmVudC5zdGFydFRpbWUgOiByZWN1cnJlbmNlSWQsXG5cdH0pXG5cblx0YXNzZXJ0RXZlbnRWYWxpZGl0eShuZXdFdmVudClcblxuXHRuZXdFdmVudC5faWQgPSBleGlzdGluZ0V2ZW50Ll9pZFxuXHRuZXdFdmVudC5fb3duZXJHcm91cCA9IGV4aXN0aW5nRXZlbnQuX293bmVyR3JvdXBcblx0bmV3RXZlbnQuX3Blcm1pc3Npb25zID0gZXhpc3RpbmdFdmVudC5fcGVybWlzc2lvbnNcblxuXHRyZXR1cm4ge1xuXHRcdGhhc1VwZGF0ZVdvcnRoeUNoYW5nZXM6IGV2ZW50SGFzQ2hhbmdlZChuZXdFdmVudCwgZXhpc3RpbmdFdmVudCksXG5cdFx0bmV3RXZlbnQsXG5cdFx0Y2FsZW5kYXI6IGFzc2VtYmxlUmVzdWx0LmNhbGVuZGFyLFxuXHRcdG5ld0FsYXJtczogYXNzZW1ibGVSZXN1bHQubmV3QWxhcm1zLFxuXHRcdHNlbmRNb2RlbHM6IGFzc2VtYmxlUmVzdWx0LnNlbmRNb2RlbHMsXG5cdH1cbn1cblxuLyoqXG4gKiBjb21iaW5lIGV2ZW50IHZhbHVlcyB3aXRoIHRoZSBmaWVsZHMgcmVxdWlyZWQgdG8gaWRlbnRpZnkgYSBwYXJ0aWN1bGFyIGluc3RhbmNlIG9mIHRoZSBldmVudC5cbiAqIEBwYXJhbSB2YWx1ZXNcbiAqIEBwYXJhbSBpZGVudGl0eSBzZXF1ZW5jZSAoZGVmYXVsdCBcIjBcIikgYW5kIHJlY3VycmVuY2VJZCAoZGVmYXVsdCBudWxsKSBhcmUgb3B0aW9uYWwsIGJ1dCB0aGUgdWlkIG11c3QgYmUgc3BlY2lmaWVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzaWduRXZlbnRJZGVudGl0eSh2YWx1ZXM6IENhbGVuZGFyRXZlbnRWYWx1ZXMsIGlkZW50aXR5OiBSZXF1aXJlPFwidWlkXCIsIFBhcnRpYWw8Q2FsZW5kYXJFdmVudElkZW50aXR5Pj4pOiBDYWxlbmRhckV2ZW50IHtcblx0cmV0dXJuIGNyZWF0ZUNhbGVuZGFyRXZlbnQoe1xuXHRcdHNlcXVlbmNlOiBcIjBcIixcblx0XHRyZWN1cnJlbmNlSWQ6IG51bGwsXG5cdFx0aGFzaGVkVWlkOiBudWxsLFxuXHRcdC4uLnZhbHVlcyxcblx0XHQuLi5pZGVudGl0eSxcblx0fSlcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZUFsYXJtc0ZvckV2ZW50KGFsYXJtczogQ2FsZW5kYXJFdmVudFtcImFsYXJtSW5mb3NcIl0sIGNhbGVuZGFyTW9kZWw6IENhbGVuZGFyTW9kZWwsIHVzZXI6IFVzZXIpOiBQcm9taXNlPEFycmF5PEFsYXJtSW50ZXJ2YWw+PiB7XG5cdGNvbnN0IGFsYXJtSW5mb3MgPSBhd2FpdCBjYWxlbmRhck1vZGVsLmxvYWRBbGFybXMoYWxhcm1zLCB1c2VyKVxuXHRyZXR1cm4gYWxhcm1JbmZvcy5tYXAoKHsgYWxhcm1JbmZvIH0pID0+IHBhcnNlQWxhcm1JbnRlcnZhbChhbGFybUluZm8udHJpZ2dlcikpXG59XG5cbmZ1bmN0aW9uIG1ha2VFbXB0eUNhbGVuZGFyRXZlbnQoKTogU3RyaXBwZWRFbnRpdHk8Q2FsZW5kYXJFdmVudD4ge1xuXHRyZXR1cm4ge1xuXHRcdGFsYXJtSW5mb3M6IFtdLFxuXHRcdGludml0ZWRDb25maWRlbnRpYWxseTogbnVsbCxcblx0XHRoYXNoZWRVaWQ6IG51bGwsXG5cdFx0dWlkOiBudWxsLFxuXHRcdHJlY3VycmVuY2VJZDogbnVsbCxcblx0XHRlbmRUaW1lOiBuZXcgRGF0ZSgpLFxuXHRcdHN1bW1hcnk6IFwiXCIsXG5cdFx0c3RhcnRUaW1lOiBuZXcgRGF0ZSgpLFxuXHRcdGxvY2F0aW9uOiBcIlwiLFxuXHRcdHJlcGVhdFJ1bGU6IG51bGwsXG5cdFx0ZGVzY3JpcHRpb246IFwiXCIsXG5cdFx0YXR0ZW5kZWVzOiBbXSxcblx0XHRvcmdhbml6ZXI6IG51bGwsXG5cdFx0c2VxdWVuY2U6IFwiXCIsXG5cdH1cbn1cblxuZnVuY3Rpb24gY2xlYW51cEluaXRpYWxWYWx1ZXNGb3JFZGl0aW5nKGluaXRpYWxWYWx1ZXM6IFN0cmlwcGVkRW50aXR5PENhbGVuZGFyRXZlbnQ+KTogQ2FsZW5kYXJFdmVudCB7XG5cdC8vIHRoZSBldmVudCB3ZSBnb3QgcGFzc2VkIG1heSBhbHJlYWR5IGhhdmUgc29tZSB0ZWNobmljYWwgZmllbGRzIGFzc2lnbmVkLCBzbyB3ZSByZW1vdmUgdGhlbS5cblx0Y29uc3Qgc3RyaXBwZWQgPSBnZXRTdHJpcHBlZENsb25lPENhbGVuZGFyRXZlbnQ+KGluaXRpYWxWYWx1ZXMpXG5cdGNvbnN0IHJlc3VsdCA9IGNyZWF0ZUNhbGVuZGFyRXZlbnQoc3RyaXBwZWQpXG5cblx0Ly8gcmVtb3ZlIHRoZSBhbGFybSBpbmZvcyBmcm9tIHRoZSByZXN1bHQsIHRoZXkgZG9uJ3QgY29udGFpbiBhbnkgdXNlZnVsIGluZm9ybWF0aW9uIGZvciB0aGUgZWRpdGluZyBvcGVyYXRpb24uXG5cdC8vIHNlbGVjdGVkIGFsYXJtcyBhcmUgcmV0dXJuZWQgaW4gdGhlIGVkaXQgcmVzdWx0IHNlcGFyYXRlIGZyb20gdGhlIGV2ZW50LlxuXHRyZXN1bHQuYWxhcm1JbmZvcyA9IFtdXG5cblx0cmV0dXJuIHJlc3VsdFxufVxuXG4vKiogd2hldGhlciB0byBjbG9zZSBkaWFsb2cgKi9cbmV4cG9ydCBjb25zdCBlbnVtIEV2ZW50U2F2ZVJlc3VsdCB7XG5cdFNhdmVkLFxuXHRGYWlsZWQsXG5cdE5vdEZvdW5kLFxufVxuXG4vKiogZ2VuZXJpYyBmdW5jdGlvbiB0aGF0IGFzeW5jaHJvbm91c2x5IHJldHVybnMgd2hhdGV2ZXIgdHlwZSB0aGUgY2FsbGVyIHBhc3NlZCBpbiwgYnV0IG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBwcm9taXNlLiAqL1xuZXhwb3J0IHR5cGUgU2hvd1Byb2dyZXNzQ2FsbGJhY2sgPSA8VD4oaW5wdXQ6IFByb21pc2U8VD4pID0+IFByb21pc2U8VD5cblxuLyoqIGV4cG9ydGVkIGZvciB0ZXN0aW5nICovXG5leHBvcnQgdHlwZSBDYWxlbmRhckV2ZW50RWRpdE1vZGVscyA9IHtcblx0d2hlbk1vZGVsOiBDYWxlbmRhckV2ZW50V2hlbk1vZGVsXG5cdHdob01vZGVsOiBDYWxlbmRhckV2ZW50V2hvTW9kZWxcblx0YWxhcm1Nb2RlbDogQ2FsZW5kYXJFdmVudEFsYXJtTW9kZWxcblx0bG9jYXRpb246IFNpbXBsZVRleHRWaWV3TW9kZWxcblx0c3VtbWFyeTogU2ltcGxlVGV4dFZpZXdNb2RlbFxuXHRkZXNjcmlwdGlvbjogU2FuaXRpemVkVGV4dFZpZXdNb2RlbFxufVxuXG4vKiogdGhlIGZpZWxkcyB0aGF0IHRvZ2V0aGVyIHdpdGggdGhlIHN0YXJ0IHRpbWUgcG9pbnQgdG8gYSBzcGVjaWZpYyB2ZXJzaW9uIGFuZCBpbnN0YW5jZSBvZiBhbiBldmVudCAqL1xudHlwZSBFdmVudElkZW50aXR5RmllbGROYW1lcyA9IFwidWlkXCIgfCBcInNlcXVlbmNlXCIgfCBcInJlY3VycmVuY2VJZFwiXG5cbi8qKlxuICogcmV0dXJuIHRoZSBjYWxlbmRhciB0aGUgZ2l2ZW4gZXZlbnQgYmVsb25ncyB0bywgaWYgYW55LCBvdGhlcndpc2UgZ2V0IHRoZSBmaXJzdCBvbmUgZnJvbSB0aGUgZ2l2ZW4gY2FsZW5kYXJzLlxuICogQHBhcmFtIGNhbGVuZGFycyBtdXN0IGNvbnRhaW4gYXQgbGVhc3Qgb25lIGNhbGVuZGFyXG4gKiBAcGFyYW0gZXZlbnRcbiAqL1xuZnVuY3Rpb24gZ2V0UHJlc2VsZWN0ZWRDYWxlbmRhcihjYWxlbmRhcnM6IFJlYWRvbmx5TWFwPElkLCBDYWxlbmRhckluZm8+LCBldmVudD86IFBhcnRpYWw8Q2FsZW5kYXJFdmVudD4gfCBudWxsKTogQ2FsZW5kYXJJbmZvIHtcblx0Y29uc3Qgb3duZXJHcm91cDogc3RyaW5nIHwgbnVsbCA9IGV2ZW50Py5fb3duZXJHcm91cCA/PyBudWxsXG5cdGlmIChvd25lckdyb3VwID09IG51bGwgfHwgIWNhbGVuZGFycy5oYXMob3duZXJHcm91cCkpIHtcblx0XHRjb25zdCBjYWxlbmRhciA9IGZpbmRGaXJzdFByaXZhdGVDYWxlbmRhcihjYWxlbmRhcnMpXG5cdFx0aWYgKCFjYWxlbmRhcikgdGhyb3cgbmV3IEVycm9yKFwiQ2FuJ3QgZmluZCBhIHByaXZhdGUgY2FsZW5kYXJcIilcblx0XHRyZXR1cm4gY2FsZW5kYXJcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gYXNzZXJ0Tm90TnVsbChjYWxlbmRhcnMuZ2V0KG93bmVyR3JvdXApLCBcImludmFsaWQgb3duZXJncm91cCBmb3IgZXhpc3RpbmcgZXZlbnQ/XCIpXG5cdH1cbn1cblxuLyoqIGdldCB0aGUgbGlzdCBvZiBtYWlsIGFkZHJlc3NlcyB0aGF0IGFyZSBlbmFibGVkIGZvciB0aGlzIG1haWxib3ggd2l0aCB0aGUgY29uZmlndXJlZCBzZW5kZXIgbmFtZXNcbiAqIHdpbGwgcHV0IHRoZSBzZW5kZXIgdGhhdCBtYXRjaGVzIHRoZSBkZWZhdWx0IHNlbmRlciBhZGRyZXNzIGluIHRoZSBmaXJzdCBzcG90LiB0aGlzIGVuYWJsZXMgdXMgdG8gdXNlXG4gKiBpdCBhcyBhbiBlYXN5IGRlZmF1bHQgd2l0aG91dCBoYXZpbmcgdG8gcGFzcyBpdCBhcm91bmQgc2VwYXJhdGVseSAqL1xuZnVuY3Rpb24gZ2V0T3duTWFpbEFkZHJlc3Nlc1dpdGhEZWZhdWx0U2VuZGVySW5Gcm9udChcblx0bG9naW5zOiBMb2dpbkNvbnRyb2xsZXIsXG5cdG1haWxib3hEZXRhaWw6IE1haWxib3hEZXRhaWwsXG5cdG1haWxib3hQcm9wZXJ0aWVzOiBNYWlsYm94UHJvcGVydGllcyxcbik6IEFycmF5PEVuY3J5cHRlZE1haWxBZGRyZXNzPiB7XG5cdGNvbnN0IGRlZmF1bHRTZW5kZXIgPSBnZXREZWZhdWx0U2VuZGVyKGxvZ2lucywgbWFpbGJveERldGFpbClcblx0Y29uc3Qgb3duTWFpbEFkZHJlc3NlcyA9IG1haWxib3hQcm9wZXJ0aWVzLm1haWxBZGRyZXNzUHJvcGVydGllcy5tYXAoKHsgbWFpbEFkZHJlc3MsIHNlbmRlck5hbWUgfSkgPT5cblx0XHRjcmVhdGVFbmNyeXB0ZWRNYWlsQWRkcmVzcyh7XG5cdFx0XHRhZGRyZXNzOiBtYWlsQWRkcmVzcyxcblx0XHRcdG5hbWU6IHNlbmRlck5hbWUsXG5cdFx0fSksXG5cdClcblx0Y29uc3QgZGVmYXVsdEluZGV4ID0gb3duTWFpbEFkZHJlc3Nlcy5maW5kSW5kZXgoKGFkZHJlc3MpID0+IGFkZHJlc3MuYWRkcmVzcyA9PT0gZGVmYXVsdFNlbmRlcilcblx0aWYgKGRlZmF1bHRJbmRleCA8IDApIHtcblx0XHQvLyBzaG91bGQgbm90IGhhcHBlblxuXHRcdHJldHVybiBvd25NYWlsQWRkcmVzc2VzXG5cdH1cblx0Y29uc3QgZGVmYXVsdEVuY3J5cHRlZE1haWxBZGRyZXNzID0gb3duTWFpbEFkZHJlc3Nlcy5zcGxpY2UoZGVmYXVsdEluZGV4LCAxKVxuXHRyZXR1cm4gWy4uLmRlZmF1bHRFbmNyeXB0ZWRNYWlsQWRkcmVzcywgLi4ub3duTWFpbEFkZHJlc3Nlc11cbn1cbiIsImltcG9ydCBtLCB7IENoaWxkLCBDaGlsZEFycmF5LCBDaGlsZHJlbiB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB0eXBlIHsgVHJhbnNsYXRpb25LZXkgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHsgbGFuZyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBCdXR0b25UeXBlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9CdXR0b24uanNcIlxuaW1wb3J0IHsgSWNvbnMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL2ljb25zL0ljb25zLmpzXCJcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvRGlhbG9nLmpzXCJcbmltcG9ydCB0eXBlIHsgTW91c2VQb3NBbmRCb3VuZHMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0d1aVV0aWxzLmpzXCJcbmltcG9ydCB7IFRpbWUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2NhbGVuZGFyL2RhdGUvVGltZS5qc1wiXG5pbXBvcnQge1xuXHRhc3NlcnQsXG5cdGFzc2VydE5vdE51bGwsXG5cdGNsYW1wLFxuXHRjbG9uZSxcblx0Z2V0RnJvbU1hcCxcblx0Z2V0U3RhcnRPZkRheSxcblx0aW5jcmVtZW50RGF0ZSxcblx0aXNOb3RFbXB0eSxcblx0aXNTYW1lRGF5LFxuXHRpc1NhbWVEYXlPZkRhdGUsXG5cdG1lbW9pemVkLFxuXHRudW1iZXJSYW5nZSxcblx0dHlwZWRWYWx1ZXMsXG59IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgSWNvbkJ1dHRvbiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvSWNvbkJ1dHRvbi5qc1wiXG5pbXBvcnQge1xuXHRmb3JtYXREYXRlVGltZSxcblx0Zm9ybWF0RGF0ZVdpdGhNb250aCxcblx0Zm9ybWF0RGF0ZVdpdGhXZWVrZGF5LFxuXHRmb3JtYXRNb250aFdpdGhGdWxsWWVhcixcblx0Zm9ybWF0VGltZSxcblx0dGltZVN0cmluZ0Zyb21QYXJ0cyxcbn0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0Zvcm1hdHRlci5qc1wiXG5pbXBvcnQge1xuXHRBbGFybUludGVydmFsLFxuXHRhbGFybUludGVydmFsVG9MdXhvbkR1cmF0aW9uTGlrZU9iamVjdCxcblx0QWxhcm1JbnRlcnZhbFVuaXQsXG5cdENhbGVuZGFyRGF5LFxuXHRDYWxlbmRhck1vbnRoLFxuXHRldmVudEVuZHNBZnRlckRheSxcblx0ZXZlbnRTdGFydHNCZWZvcmUsXG5cdGdldEFsbERheURhdGVGb3JUaW1lem9uZSxcblx0Z2V0RW5kT2ZEYXlXaXRoWm9uZSxcblx0Z2V0RXZlbnRFbmQsXG5cdGdldEV2ZW50U3RhcnQsXG5cdGdldFN0YXJ0T2ZEYXlXaXRoWm9uZSxcblx0Z2V0U3RhcnRPZk5leHREYXlXaXRoWm9uZSxcblx0Z2V0U3RhcnRPZlRoZVdlZWtPZmZzZXQsXG5cdGdldFN0YXJ0T2ZXZWVrLFxuXHRnZXRUaW1lWm9uZSxcblx0Z2V0V2Vla051bWJlcixcblx0aW5jcmVtZW50QnlSZXBlYXRQZXJpb2QsXG5cdFN0YW5kYXJkQWxhcm1JbnRlcnZhbCxcbn0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9jYWxlbmRhci9kYXRlL0NhbGVuZGFyVXRpbHMuanNcIlxuaW1wb3J0IHtcblx0QWNjb3VudFR5cGUsXG5cdENhbGVuZGFyQXR0ZW5kZWVTdGF0dXMsXG5cdENMSUVOVF9PTkxZX0NBTEVOREFSUyxcblx0REVGQVVMVF9DTElFTlRfT05MWV9DQUxFTkRBUl9DT0xPUlMsXG5cdGRlZmF1bHRDYWxlbmRhckNvbG9yLFxuXHRFbmRUeXBlLFxuXHRFdmVudFRleHRUaW1lT3B0aW9uLFxuXHRSZXBlYXRQZXJpb2QsXG5cdFNoYXJlQ2FwYWJpbGl0eSxcblx0V2Vla1N0YXJ0LFxufSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHMuanNcIlxuaW1wb3J0IHsgQWxsSWNvbnMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0ljb24uanNcIlxuaW1wb3J0IHsgU2VsZWN0b3JJdGVtTGlzdCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvRHJvcERvd25TZWxlY3Rvci5qc1wiXG5pbXBvcnQgeyBEYXRlVGltZSwgRHVyYXRpb24gfSBmcm9tIFwibHV4b25cIlxuaW1wb3J0IHsgQ2FsZW5kYXJFdmVudFRpbWVzLCBDYWxlbmRhclZpZXdUeXBlLCBjbGVhbk1haWxBZGRyZXNzLCBpc0FsbERheUV2ZW50IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL0NvbW1vbkNhbGVuZGFyVXRpbHMuanNcIlxuaW1wb3J0IHsgQ2FsZW5kYXJFdmVudCwgVXNlclNldHRpbmdzR3JvdXBSb290IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgUHJvZ3JhbW1pbmdFcnJvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9lcnJvci9Qcm9ncmFtbWluZ0Vycm9yLmpzXCJcbmltcG9ydCB7IHNpemUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9zaXplLmpzXCJcbmltcG9ydCB7IGhzbFRvSGV4LCBpc0NvbG9yTGlnaHQsIGlzVmFsaWRDb2xvckNvZGUsIE1BWF9IVUVfQU5HTEUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0NvbG9yLmpzXCJcbmltcG9ydCB7IEdyb3VwQ29sb3JzIH0gZnJvbSBcIi4uL3ZpZXcvQ2FsZW5kYXJWaWV3LmpzXCJcbmltcG9ydCB7IENhbGVuZGFySW5mbyB9IGZyb20gXCIuLi9tb2RlbC9DYWxlbmRhck1vZGVsLmpzXCJcbmltcG9ydCB7IEV2ZW50VHlwZSB9IGZyb20gXCIuL2V2ZW50ZWRpdG9yLW1vZGVsL0NhbGVuZGFyRXZlbnRNb2RlbC5qc1wiXG5pbXBvcnQgeyBoYXNDYXBhYmlsaXR5T25Hcm91cCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vc2hhcmluZy9Hcm91cFV0aWxzLmpzXCJcbmltcG9ydCB7IEV2ZW50c09uRGF5cyB9IGZyb20gXCIuLi92aWV3L0NhbGVuZGFyVmlld01vZGVsLmpzXCJcbmltcG9ydCB7IENhbGVuZGFyRXZlbnRQcmV2aWV3Vmlld01vZGVsIH0gZnJvbSBcIi4vZXZlbnRwb3B1cC9DYWxlbmRhckV2ZW50UHJldmlld1ZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBjcmVhdGVBc3luY0Ryb3Bkb3duIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9Ecm9wZG93bi5qc1wiXG5pbXBvcnQgeyBVc2VyQ29udHJvbGxlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL21haW4vVXNlckNvbnRyb2xsZXIuanNcIlxuaW1wb3J0IHsgQ2xpZW50T25seUNhbGVuZGFyc0luZm8gfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvRGV2aWNlQ29uZmlnLmpzXCJcbmltcG9ydCB7IFNlbGVjdE9wdGlvbiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvU2VsZWN0LmpzXCJcbmltcG9ydCB7IFJhZGlvR3JvdXBPcHRpb24gfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL1JhZGlvR3JvdXAuanNcIlxuaW1wb3J0IHsgQ29sb3JQaWNrZXJNb2RlbCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvY29sb3JQaWNrZXIvQ29sb3JQaWNrZXJNb2RlbC5qc1wiXG5pbXBvcnQgeyB0aGVtZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL3RoZW1lLmpzXCJcblxuZXhwb3J0IGludGVyZmFjZSBJbnRlcnZhbE9wdGlvbiB7XG5cdHZhbHVlOiBudW1iZXJcblx0YXJpYVZhbHVlOiBzdHJpbmdcblx0bmFtZTogc3RyaW5nXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJDYWxlbmRhclN3aXRjaExlZnRCdXR0b24obGFiZWw6IFRyYW5zbGF0aW9uS2V5LCBjbGljazogKCkgPT4gdW5rbm93bik6IENoaWxkIHtcblx0cmV0dXJuIG0oSWNvbkJ1dHRvbiwge1xuXHRcdHRpdGxlOiBsYWJlbCxcblx0XHRpY29uOiBJY29ucy5BcnJvd0JhY2t3YXJkLFxuXHRcdGNsaWNrLFxuXHR9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyQ2FsZW5kYXJTd2l0Y2hSaWdodEJ1dHRvbihsYWJlbDogVHJhbnNsYXRpb25LZXksIGNsaWNrOiAoKSA9PiB1bmtub3duKTogQ2hpbGQge1xuXHRyZXR1cm4gbShJY29uQnV0dG9uLCB7XG5cdFx0dGl0bGU6IGxhYmVsLFxuXHRcdGljb246IEljb25zLkFycm93Rm9yd2FyZCxcblx0XHRjbGljayxcblx0fSlcbn1cblxuZnVuY3Rpb24gd2Vla1RpdGxlKGRhdGU6IERhdGUsIHdlZWtTdGFydDogV2Vla1N0YXJ0KTogc3RyaW5nIHtcblx0Y29uc3Qgc3RhcnRPZlRoZVdlZWtPZmZzZXQgPSBnZXRTdGFydE9mVGhlV2Vla09mZnNldCh3ZWVrU3RhcnQpXG5cdGNvbnN0IGZpcnN0RGF0ZSA9IGdldFN0YXJ0T2ZXZWVrKGRhdGUsIHN0YXJ0T2ZUaGVXZWVrT2Zmc2V0KVxuXHRjb25zdCBsYXN0RGF0ZSA9IGluY3JlbWVudERhdGUobmV3IERhdGUoZmlyc3REYXRlKSwgNilcblxuXHRpZiAoZmlyc3REYXRlLmdldE1vbnRoKCkgIT09IGxhc3REYXRlLmdldE1vbnRoKCkpIHtcblx0XHRpZiAoZmlyc3REYXRlLmdldEZ1bGxZZWFyKCkgIT09IGxhc3REYXRlLmdldEZ1bGxZZWFyKCkpIHtcblx0XHRcdHJldHVybiBgJHtsYW5nLmZvcm1hdHMubW9udGhTaG9ydFdpdGhGdWxsWWVhci5mb3JtYXQoZmlyc3REYXRlKX0gLSAke2xhbmcuZm9ybWF0cy5tb250aFNob3J0V2l0aEZ1bGxZZWFyLmZvcm1hdChsYXN0RGF0ZSl9YFxuXHRcdH1cblx0XHRyZXR1cm4gYCR7bGFuZy5mb3JtYXRzLm1vbnRoU2hvcnQuZm9ybWF0KGZpcnN0RGF0ZSl9IC0gJHtsYW5nLmZvcm1hdHMubW9udGhTaG9ydC5mb3JtYXQobGFzdERhdGUpfSAke2xhbmcuZm9ybWF0cy55ZWFyTnVtZXJpYy5mb3JtYXQoZmlyc3REYXRlKX1gXG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIGAke2xhbmcuZm9ybWF0cy5tb250aExvbmcuZm9ybWF0KGZpcnN0RGF0ZSl9ICR7bGFuZy5mb3JtYXRzLnllYXJOdW1lcmljLmZvcm1hdChmaXJzdERhdGUpfWBcblx0fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TmV4dEZvdXJ0ZWVuRGF5cyhzdGFydE9mVG9kYXk6IERhdGUpOiBBcnJheTxEYXRlPiB7XG5cdGxldCBjYWxjdWxhdGlvbkRhdGUgPSBuZXcgRGF0ZShzdGFydE9mVG9kYXkpXG5cdGNvbnN0IGRheXM6IERhdGVbXSA9IFtdXG5cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCAxNDsgaSsrKSB7XG5cdFx0ZGF5cy5wdXNoKG5ldyBEYXRlKGNhbGN1bGF0aW9uRGF0ZS5nZXRUaW1lKCkpKVxuXHRcdGNhbGN1bGF0aW9uRGF0ZSA9IGluY3JlbWVudERhdGUoY2FsY3VsYXRpb25EYXRlLCAxKVxuXHR9XG5cblx0cmV0dXJuIGRheXNcbn1cblxuZXhwb3J0IHR5cGUgQ2FsZW5kYXJOYXZDb25maWd1cmF0aW9uID0geyBiYWNrOiBDaGlsZDsgdGl0bGU6IHN0cmluZzsgZm9yd2FyZDogQ2hpbGQgfVxuXG5leHBvcnQgZnVuY3Rpb24gY2FsZW5kYXJXZWVrKGRhdGU6IERhdGUsIHdlZWtTdGFydDogV2Vla1N0YXJ0KSB7XG5cdC8vIEFjY29yZGluZyB0byBJU08gODYwMSwgd2Vla3MgYWx3YXlzIHN0YXJ0IG9uIE1vbmRheS4gV2VlayBudW1iZXJpbmcgc3lzdGVtcyBmb3Jcblx0Ly8gd2Vla3MgdGhhdCBkbyBub3Qgc3RhcnQgb24gTW9uZGF5IGFyZSBub3Qgc3RyaWN0bHkgZGVmaW5lZCwgc28gd2Ugb25seSBkaXNwbGF5XG5cdC8vIGEgd2VlayBudW1iZXIgaWYgdGhlIHVzZXIncyBjbGllbnQgaXMgY29uZmlndXJlZCB0byBzdGFydCB3ZWVrcyBvbiBNb25kYXlcblx0aWYgKHdlZWtTdGFydCAhPT0gV2Vla1N0YXJ0Lk1PTkRBWSkge1xuXHRcdHJldHVybiBudWxsXG5cdH1cblxuXHRyZXR1cm4gbGFuZy5nZXQoXCJ3ZWVrTnVtYmVyX2xhYmVsXCIsIHtcblx0XHRcInt3ZWVrfVwiOiBTdHJpbmcoZ2V0V2Vla051bWJlcihkYXRlKSksXG5cdH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYWxlbmRhck5hdkNvbmZpZ3VyYXRpb24oXG5cdHZpZXdUeXBlOiBDYWxlbmRhclZpZXdUeXBlLFxuXHRkYXRlOiBEYXRlLFxuXHR3ZWVrU3RhcnQ6IFdlZWtTdGFydCxcblx0dGl0bGVUeXBlOiBcInNob3J0XCIgfCBcImRldGFpbGVkXCIsXG5cdHN3aXRjaGVyOiAodmlld1R5cGU6IENhbGVuZGFyVmlld1R5cGUsIG5leHQ6IGJvb2xlYW4pID0+IHVua25vd24sXG4pOiBDYWxlbmRhck5hdkNvbmZpZ3VyYXRpb24ge1xuXHRjb25zdCBvbkJhY2sgPSAoKSA9PiBzd2l0Y2hlcih2aWV3VHlwZSwgZmFsc2UpXG5cdGNvbnN0IG9uRm9yd2FyZCA9ICgpID0+IHN3aXRjaGVyKHZpZXdUeXBlLCB0cnVlKVxuXHRzd2l0Y2ggKHZpZXdUeXBlKSB7XG5cdFx0Y2FzZSBDYWxlbmRhclZpZXdUeXBlLkRBWTpcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGJhY2s6IHJlbmRlckNhbGVuZGFyU3dpdGNoTGVmdEJ1dHRvbihcInByZXZEYXlfbGFiZWxcIiwgb25CYWNrKSxcblx0XHRcdFx0Zm9yd2FyZDogcmVuZGVyQ2FsZW5kYXJTd2l0Y2hSaWdodEJ1dHRvbihcIm5leHREYXlfbGFiZWxcIiwgb25Gb3J3YXJkKSxcblx0XHRcdFx0dGl0bGU6IHRpdGxlVHlwZSA9PT0gXCJzaG9ydFwiID8gZm9ybWF0TW9udGhXaXRoRnVsbFllYXIoZGF0ZSkgOiBmb3JtYXREYXRlV2l0aFdlZWtkYXkoZGF0ZSksXG5cdFx0XHR9XG5cdFx0Y2FzZSBDYWxlbmRhclZpZXdUeXBlLk1PTlRIOlxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0YmFjazogcmVuZGVyQ2FsZW5kYXJTd2l0Y2hMZWZ0QnV0dG9uKFwicHJldk1vbnRoX2xhYmVsXCIsIG9uQmFjayksXG5cdFx0XHRcdGZvcndhcmQ6IHJlbmRlckNhbGVuZGFyU3dpdGNoUmlnaHRCdXR0b24oXCJuZXh0TW9udGhfbGFiZWxcIiwgb25Gb3J3YXJkKSxcblx0XHRcdFx0dGl0bGU6IGZvcm1hdE1vbnRoV2l0aEZ1bGxZZWFyKGRhdGUpLFxuXHRcdFx0fVxuXHRcdGNhc2UgQ2FsZW5kYXJWaWV3VHlwZS5XRUVLOlxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0YmFjazogcmVuZGVyQ2FsZW5kYXJTd2l0Y2hMZWZ0QnV0dG9uKFwicHJldldlZWtfbGFiZWxcIiwgb25CYWNrKSxcblx0XHRcdFx0Zm9yd2FyZDogcmVuZGVyQ2FsZW5kYXJTd2l0Y2hSaWdodEJ1dHRvbihcIm5leHRXZWVrX2xhYmVsXCIsIG9uRm9yd2FyZCksXG5cdFx0XHRcdHRpdGxlOiB0aXRsZVR5cGUgPT09IFwic2hvcnRcIiA/IGZvcm1hdE1vbnRoV2l0aEZ1bGxZZWFyKGRhdGUpIDogd2Vla1RpdGxlKGRhdGUsIHdlZWtTdGFydCksXG5cdFx0XHR9XG5cdFx0Y2FzZSBDYWxlbmRhclZpZXdUeXBlLkFHRU5EQTpcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGJhY2s6IHJlbmRlckNhbGVuZGFyU3dpdGNoTGVmdEJ1dHRvbihcInByZXZEYXlfbGFiZWxcIiwgb25CYWNrKSxcblx0XHRcdFx0Zm9yd2FyZDogcmVuZGVyQ2FsZW5kYXJTd2l0Y2hSaWdodEJ1dHRvbihcIm5leHREYXlfbGFiZWxcIiwgb25Gb3J3YXJkKSxcblx0XHRcdFx0dGl0bGU6IHRpdGxlVHlwZSA9PT0gXCJzaG9ydFwiID8gZm9ybWF0TW9udGhXaXRoRnVsbFllYXIoZGF0ZSkgOiBmb3JtYXREYXRlV2l0aFdlZWtkYXkoZGF0ZSksXG5cdFx0XHR9XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFza0lmU2hvdWxkU2VuZENhbGVuZGFyVXBkYXRlc1RvQXR0ZW5kZWVzKCk6IFByb21pc2U8XCJ5ZXNcIiB8IFwibm9cIiB8IFwiY2FuY2VsXCI+IHtcblx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG5cdFx0bGV0IGFsZXJ0RGlhbG9nOiBEaWFsb2dcblx0XHRjb25zdCBjYW5jZWxCdXR0b24gPSB7XG5cdFx0XHRsYWJlbDogXCJjYW5jZWxfYWN0aW9uXCIsXG5cdFx0XHRjbGljazogKCkgPT4ge1xuXHRcdFx0XHRyZXNvbHZlKFwiY2FuY2VsXCIpXG5cdFx0XHRcdGFsZXJ0RGlhbG9nLmNsb3NlKClcblx0XHRcdH0sXG5cdFx0XHR0eXBlOiBCdXR0b25UeXBlLlNlY29uZGFyeSxcblx0XHR9IGFzIGNvbnN0XG5cdFx0Y29uc3Qgbm9CdXR0b24gPSB7XG5cdFx0XHRsYWJlbDogXCJub19sYWJlbFwiLFxuXHRcdFx0Y2xpY2s6ICgpID0+IHtcblx0XHRcdFx0cmVzb2x2ZShcIm5vXCIpXG5cdFx0XHRcdGFsZXJ0RGlhbG9nLmNsb3NlKClcblx0XHRcdH0sXG5cdFx0XHR0eXBlOiBCdXR0b25UeXBlLlNlY29uZGFyeSxcblx0XHR9IGFzIGNvbnN0XG5cdFx0Y29uc3QgeWVzQnV0dG9uID0ge1xuXHRcdFx0bGFiZWw6IFwieWVzX2xhYmVsXCIsXG5cdFx0XHRjbGljazogKCkgPT4ge1xuXHRcdFx0XHRyZXNvbHZlKFwieWVzXCIpXG5cdFx0XHRcdGFsZXJ0RGlhbG9nLmNsb3NlKClcblx0XHRcdH0sXG5cdFx0XHR0eXBlOiBCdXR0b25UeXBlLlByaW1hcnksXG5cdFx0fSBhcyBjb25zdFxuXG5cdFx0Y29uc3Qgb25jbG9zZSA9IChwb3NpdGl2ZTogYm9vbGVhbikgPT4gKHBvc2l0aXZlID8gcmVzb2x2ZShcInllc1wiKSA6IHJlc29sdmUoXCJjYW5jZWxcIikpXG5cblx0XHRhbGVydERpYWxvZyA9IERpYWxvZy5jb25maXJtTXVsdGlwbGUoXCJzZW5kVXBkYXRlc19tc2dcIiwgW2NhbmNlbEJ1dHRvbiwgbm9CdXR0b24sIHllc0J1dHRvbl0sIG9uY2xvc2UpXG5cdH0pXG59XG5cbi8qKlxuICogTWFwIHRoZSBsb2NhdGlvbiBvZiBhIG1vdXNlIGNsaWNrIG9uIGFuIGVsZW1lbnQgdG8gYSBnaXZlIGRhdGUsIGdpdmVuIGEgbGlzdCBvZiB3ZWVrc1xuICogdGhlcmUgc2hvdWxkIGJlIG5laXRoZXIgemVybyB3ZWVrcywgbm9yIHplcm8gbGVuZ3RoIHdlZWtzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXREYXRlRnJvbU1vdXNlUG9zKHsgeCwgeSwgdGFyZ2V0V2lkdGgsIHRhcmdldEhlaWdodCB9OiBNb3VzZVBvc0FuZEJvdW5kcywgd2Vla3M6IEFycmF5PEFycmF5PERhdGU+Pik6IERhdGUge1xuXHRhc3NlcnQod2Vla3MubGVuZ3RoID4gMCwgXCJXZWVrcyBtdXN0IG5vdCBiZSB6ZXJvIGxlbmd0aFwiKVxuXHRjb25zdCB1bml0SGVpZ2h0ID0gdGFyZ2V0SGVpZ2h0IC8gd2Vla3MubGVuZ3RoXG5cdGNvbnN0IGN1cnJlbnRTcXVhcmVZID0gTWF0aC5mbG9vcih5IC8gdW5pdEhlaWdodClcblx0Y29uc3Qgd2VlayA9IHdlZWtzW2NsYW1wKGN1cnJlbnRTcXVhcmVZLCAwLCB3ZWVrcy5sZW5ndGggLSAxKV1cblx0YXNzZXJ0KHdlZWsubGVuZ3RoID4gMCwgXCJXZWVrIG11c3Qgbm90IGJlIHplcm8gbGVuZ3RoXCIpXG5cdGNvbnN0IHVuaXRXaWR0aCA9IHRhcmdldFdpZHRoIC8gd2Vlay5sZW5ndGhcblx0Y29uc3QgY3VycmVudFNxdWFyZVggPSBNYXRoLmZsb29yKHggLyB1bml0V2lkdGgpXG5cdHJldHVybiB3ZWVrW2NsYW1wKGN1cnJlbnRTcXVhcmVYLCAwLCB3ZWVrLmxlbmd0aCAtIDEpXVxufVxuXG4vKipcbiAqIE1hcCB0aGUgdmVydGljYWwgcG9zaXRpb24gb2YgYSBtb3VzZSBjbGljayBvbiBhbiBlbGVtZW50IHRvIGEgdGltZSBvZiBkYXlcbiAqIEBwYXJhbSB5XG4gKiBAcGFyYW0gdGFyZ2V0SGVpZ2h0XG4gKiBAcGFyYW0gaG91ckRpdmlzaW9uOiBob3cgbWFueSB0aW1lcyB0byBkaXZpZGUgdGhlIGhvdXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFRpbWVGcm9tTW91c2VQb3MoeyB5LCB0YXJnZXRIZWlnaHQgfTogTW91c2VQb3NBbmRCb3VuZHMsIGhvdXJEaXZpc2lvbjogbnVtYmVyKTogVGltZSB7XG5cdGNvbnN0IHNlY3Rpb25IZWlnaHQgPSB0YXJnZXRIZWlnaHQgLyAyNFxuXHRjb25zdCBob3VyID0geSAvIHNlY3Rpb25IZWlnaHRcblx0Y29uc3QgaG91clJvdW5kZWQgPSBNYXRoLmZsb29yKGhvdXIpXG5cdGNvbnN0IG1pbnV0ZXNJbmMgPSA2MCAvIGhvdXJEaXZpc2lvblxuXHRjb25zdCBtaW51dGUgPSBNYXRoLmZsb29yKChob3VyIC0gaG91clJvdW5kZWQpICogaG91ckRpdmlzaW9uKSAqIG1pbnV0ZXNJbmNcblx0cmV0dXJuIG5ldyBUaW1lKGhvdXJSb3VuZGVkLCBtaW51dGUpXG59XG5cbmV4cG9ydCBjb25zdCBTRUxFQ1RFRF9EQVRFX0lORElDQVRPUl9USElDS05FU1MgPSA0XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRJY29uRm9yVmlld1R5cGUodmlld1R5cGU6IENhbGVuZGFyVmlld1R5cGUpOiBBbGxJY29ucyB7XG5cdGNvbnN0IGxvb2t1cFRhYmxlOiBSZWNvcmQ8Q2FsZW5kYXJWaWV3VHlwZSwgQWxsSWNvbnM+ID0ge1xuXHRcdFtDYWxlbmRhclZpZXdUeXBlLkRBWV06IEljb25zLlRhYmxlU2luZ2xlLFxuXHRcdFtDYWxlbmRhclZpZXdUeXBlLldFRUtdOiBJY29ucy5UYWJsZUNvbHVtbnMsXG5cdFx0W0NhbGVuZGFyVmlld1R5cGUuTU9OVEhdOiBJY29ucy5UYWJsZSxcblx0XHRbQ2FsZW5kYXJWaWV3VHlwZS5BR0VOREFdOiBJY29ucy5MaXN0VW5vcmRlcmVkLFxuXHR9XG5cdHJldHVybiBsb29rdXBUYWJsZVt2aWV3VHlwZV1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNob3VsZERlZmF1bHRUb0FtUG1UaW1lRm9ybWF0KCk6IGJvb2xlYW4ge1xuXHRyZXR1cm4gbGFuZy5jb2RlID09PSBcImVuXCJcbn1cblxuLyoqXG4gKiBnZXQgYW4gb2JqZWN0IHJlcHJlc2VudGluZyB0aGUgY2FsZW5kYXIgbW9udGggdGhlIGdpdmVuIGRhdGUgaXMgaW4uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDYWxlbmRhck1vbnRoKGRhdGU6IERhdGUsIGZpcnN0RGF5T2ZXZWVrRnJvbU9mZnNldDogbnVtYmVyLCB3ZWVrZGF5TmFycm93Rm9ybWF0OiBib29sZWFuKTogQ2FsZW5kYXJNb250aCB7XG5cdGNvbnN0IHdlZWtzOiBBcnJheTxBcnJheTxDYWxlbmRhckRheT4+ID0gW1tdXVxuXHRjb25zdCBjYWxjdWxhdGlvbkRhdGUgPSBnZXRTdGFydE9mRGF5KGRhdGUpXG5cdGNhbGN1bGF0aW9uRGF0ZS5zZXREYXRlKDEpXG5cdGNvbnN0IGJlZ2lubmluZ09mTW9udGggPSBuZXcgRGF0ZShjYWxjdWxhdGlvbkRhdGUpXG5cdGxldCBjdXJyZW50WWVhciA9IGNhbGN1bGF0aW9uRGF0ZS5nZXRGdWxsWWVhcigpXG5cdGxldCBtb250aCA9IGNhbGN1bGF0aW9uRGF0ZS5nZXRNb250aCgpXG5cdC8vIGFkZCBcInBhZGRpbmdcIiBkYXlzXG5cdC8vIGdldERheSByZXR1cm5zIHRoZSBkYXkgb2YgdGhlIHdlZWsgKGZyb20gMCB0byA2KSBmb3IgdGhlIHNwZWNpZmllZCBkYXRlICh3aXRoIGZpcnN0IG9uZSBiZWluZyBTdW5kYXkpXG5cdGxldCBmaXJzdERheVxuXG5cdGlmIChmaXJzdERheU9mV2Vla0Zyb21PZmZzZXQgPiBjYWxjdWxhdGlvbkRhdGUuZ2V0RGF5KCkpIHtcblx0XHRmaXJzdERheSA9IGNhbGN1bGF0aW9uRGF0ZS5nZXREYXkoKSArIDcgLSBmaXJzdERheU9mV2Vla0Zyb21PZmZzZXRcblx0fSBlbHNlIHtcblx0XHRmaXJzdERheSA9IGNhbGN1bGF0aW9uRGF0ZS5nZXREYXkoKSAtIGZpcnN0RGF5T2ZXZWVrRnJvbU9mZnNldFxuXHR9XG5cblx0bGV0IGRheUNvdW50XG5cdGluY3JlbWVudERhdGUoY2FsY3VsYXRpb25EYXRlLCAtZmlyc3REYXkpXG5cblx0Zm9yIChkYXlDb3VudCA9IDA7IGRheUNvdW50IDwgZmlyc3REYXk7IGRheUNvdW50KyspIHtcblx0XHR3ZWVrc1swXS5wdXNoKHtcblx0XHRcdGRhdGU6IG5ldyBEYXRlKGNhbGN1bGF0aW9uRGF0ZSksXG5cdFx0XHRkYXk6IGNhbGN1bGF0aW9uRGF0ZS5nZXREYXRlKCksXG5cdFx0XHRtb250aDogY2FsY3VsYXRpb25EYXRlLmdldE1vbnRoKCksXG5cdFx0XHR5ZWFyOiBjYWxjdWxhdGlvbkRhdGUuZ2V0RnVsbFllYXIoKSxcblx0XHRcdGlzUGFkZGluZ0RheTogdHJ1ZSxcblx0XHR9KVxuXHRcdGluY3JlbWVudERhdGUoY2FsY3VsYXRpb25EYXRlLCAxKVxuXHR9XG5cblx0Ly8gYWRkIGFjdHVhbCBkYXlzXG5cdHdoaWxlIChjYWxjdWxhdGlvbkRhdGUuZ2V0TW9udGgoKSA9PT0gbW9udGgpIHtcblx0XHRpZiAod2Vla3NbMF0ubGVuZ3RoICYmIGRheUNvdW50ICUgNyA9PT0gMCkge1xuXHRcdFx0Ly8gc3RhcnQgbmV3IHdlZWtcblx0XHRcdHdlZWtzLnB1c2goW10pXG5cdFx0fVxuXG5cdFx0Y29uc3QgZGF5SW5mbyA9IHtcblx0XHRcdGRhdGU6IG5ldyBEYXRlKGN1cnJlbnRZZWFyLCBtb250aCwgY2FsY3VsYXRpb25EYXRlLmdldERhdGUoKSksXG5cdFx0XHR5ZWFyOiBjdXJyZW50WWVhcixcblx0XHRcdG1vbnRoOiBtb250aCxcblx0XHRcdGRheTogY2FsY3VsYXRpb25EYXRlLmdldERhdGUoKSxcblx0XHRcdGlzUGFkZGluZ0RheTogZmFsc2UsXG5cdFx0fVxuXHRcdHdlZWtzW3dlZWtzLmxlbmd0aCAtIDFdLnB1c2goZGF5SW5mbylcblx0XHRpbmNyZW1lbnREYXRlKGNhbGN1bGF0aW9uRGF0ZSwgMSlcblx0XHRkYXlDb3VudCsrXG5cdH1cblxuXHQvLyBhZGQgcmVtYWluaW5nIFwicGFkZGluZ1wiIGRheXNcblx0d2hpbGUgKGRheUNvdW50IDwgNDIpIHtcblx0XHRpZiAoZGF5Q291bnQgJSA3ID09PSAwKSB7XG5cdFx0XHR3ZWVrcy5wdXNoKFtdKVxuXHRcdH1cblxuXHRcdHdlZWtzW3dlZWtzLmxlbmd0aCAtIDFdLnB1c2goe1xuXHRcdFx0ZGF5OiBjYWxjdWxhdGlvbkRhdGUuZ2V0RGF0ZSgpLFxuXHRcdFx0eWVhcjogY2FsY3VsYXRpb25EYXRlLmdldEZ1bGxZZWFyKCksXG5cdFx0XHRtb250aDogY2FsY3VsYXRpb25EYXRlLmdldE1vbnRoKCksXG5cdFx0XHRkYXRlOiBuZXcgRGF0ZShjYWxjdWxhdGlvbkRhdGUpLFxuXHRcdFx0aXNQYWRkaW5nRGF5OiB0cnVlLFxuXHRcdH0pXG5cdFx0aW5jcmVtZW50RGF0ZShjYWxjdWxhdGlvbkRhdGUsIDEpXG5cdFx0ZGF5Q291bnQrK1xuXHR9XG5cblx0Y29uc3Qgd2Vla2RheXM6IHN0cmluZ1tdID0gW11cblx0Y29uc3Qgd2Vla2RheXNEYXRlID0gbmV3IERhdGUoKVxuXHRpbmNyZW1lbnREYXRlKHdlZWtkYXlzRGF0ZSwgLXdlZWtkYXlzRGF0ZS5nZXREYXkoKSArIGZpcnN0RGF5T2ZXZWVrRnJvbU9mZnNldCkgLy8gZ2V0IGZpcnN0IGRheSBvZiB3ZWVrXG5cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCA3OyBpKyspIHtcblx0XHR3ZWVrZGF5cy5wdXNoKHdlZWtkYXlOYXJyb3dGb3JtYXQgPyBsYW5nLmZvcm1hdHMud2Vla2RheU5hcnJvdy5mb3JtYXQod2Vla2RheXNEYXRlKSA6IGxhbmcuZm9ybWF0cy53ZWVrZGF5U2hvcnQuZm9ybWF0KHdlZWtkYXlzRGF0ZSkpXG5cdFx0aW5jcmVtZW50RGF0ZSh3ZWVrZGF5c0RhdGUsIDEpXG5cdH1cblxuXHRyZXR1cm4ge1xuXHRcdGJlZ2lubmluZ09mTW9udGgsXG5cdFx0d2Vla2RheXMsXG5cdFx0d2Vla3MsXG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdEV2ZW50RHVyYXRpb24oZXZlbnQ6IENhbGVuZGFyRXZlbnRUaW1lcywgem9uZTogc3RyaW5nLCBpbmNsdWRlVGltZXpvbmU6IGJvb2xlYW4pOiBzdHJpbmcge1xuXHRpZiAoaXNBbGxEYXlFdmVudChldmVudCkpIHtcblx0XHRjb25zdCBzdGFydFRpbWUgPSBnZXRFdmVudFN0YXJ0KGV2ZW50LCB6b25lKVxuXHRcdGNvbnN0IHN0YXJ0U3RyaW5nID0gZm9ybWF0RGF0ZVdpdGhNb250aChzdGFydFRpbWUpXG5cdFx0Y29uc3QgZW5kVGltZSA9IGluY3JlbWVudEJ5UmVwZWF0UGVyaW9kKGdldEV2ZW50RW5kKGV2ZW50LCB6b25lKSwgUmVwZWF0UGVyaW9kLkRBSUxZLCAtMSwgem9uZSlcblxuXHRcdGlmIChpc1NhbWVEYXlPZkRhdGUoc3RhcnRUaW1lLCBlbmRUaW1lKSkge1xuXHRcdFx0cmV0dXJuIGAke2xhbmcuZ2V0KFwiYWxsRGF5X2xhYmVsXCIpfSwgJHtzdGFydFN0cmluZ31gXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBgJHtsYW5nLmdldChcImFsbERheV9sYWJlbFwiKX0sICR7c3RhcnRTdHJpbmd9IC0gJHtmb3JtYXREYXRlV2l0aE1vbnRoKGVuZFRpbWUpfWBcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0Y29uc3Qgc3RhcnRTdHJpbmcgPSBmb3JtYXREYXRlVGltZShldmVudC5zdGFydFRpbWUpXG5cdFx0bGV0IGVuZFN0cmluZ1xuXG5cdFx0aWYgKGlzU2FtZURheShldmVudC5zdGFydFRpbWUsIGV2ZW50LmVuZFRpbWUpKSB7XG5cdFx0XHRlbmRTdHJpbmcgPSBmb3JtYXRUaW1lKGV2ZW50LmVuZFRpbWUpXG5cdFx0fSBlbHNlIHtcblx0XHRcdGVuZFN0cmluZyA9IGZvcm1hdERhdGVUaW1lKGV2ZW50LmVuZFRpbWUpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGAke3N0YXJ0U3RyaW5nfSAtICR7ZW5kU3RyaW5nfSAke2luY2x1ZGVUaW1lem9uZSA/IGdldFRpbWVab25lKCkgOiBcIlwifWBcblx0fVxufVxuXG5leHBvcnQgY29uc3QgY3JlYXRlUmVwZWF0UnVsZUZyZXF1ZW5jeVZhbHVlcyA9ICgpOiBTZWxlY3Rvckl0ZW1MaXN0PFJlcGVhdFBlcmlvZCB8IG51bGw+ID0+IHtcblx0cmV0dXJuIFtcblx0XHR7XG5cdFx0XHRuYW1lOiBsYW5nLmdldChcImNhbGVuZGFyUmVwZWF0SW50ZXJ2YWxOb1JlcGVhdF9sYWJlbFwiKSxcblx0XHRcdHZhbHVlOiBudWxsLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0bmFtZTogbGFuZy5nZXQoXCJjYWxlbmRhclJlcGVhdEludGVydmFsRGFpbHlfbGFiZWxcIiksXG5cdFx0XHR2YWx1ZTogUmVwZWF0UGVyaW9kLkRBSUxZLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0bmFtZTogbGFuZy5nZXQoXCJjYWxlbmRhclJlcGVhdEludGVydmFsV2Vla2x5X2xhYmVsXCIpLFxuXHRcdFx0dmFsdWU6IFJlcGVhdFBlcmlvZC5XRUVLTFksXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRuYW1lOiBsYW5nLmdldChcImNhbGVuZGFyUmVwZWF0SW50ZXJ2YWxNb250aGx5X2xhYmVsXCIpLFxuXHRcdFx0dmFsdWU6IFJlcGVhdFBlcmlvZC5NT05USExZLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0bmFtZTogbGFuZy5nZXQoXCJjYWxlbmRhclJlcGVhdEludGVydmFsQW5udWFsbHlfbGFiZWxcIiksXG5cdFx0XHR2YWx1ZTogUmVwZWF0UGVyaW9kLkFOTlVBTExZLFxuXHRcdH0sXG5cdF1cbn1cbmV4cG9ydCBjb25zdCBjcmVhdGVSZXBlYXRSdWxlT3B0aW9ucyA9ICgpOiBSZWFkb25seUFycmF5PFJhZGlvR3JvdXBPcHRpb248UmVwZWF0UGVyaW9kIHwgXCJDVVNUT01cIiB8IG51bGw+PiA9PiB7XG5cdHJldHVybiBbXG5cdFx0e1xuXHRcdFx0bmFtZTogXCJjYWxlbmRhclJlcGVhdEludGVydmFsTm9SZXBlYXRfbGFiZWxcIixcblx0XHRcdHZhbHVlOiBudWxsLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0bmFtZTogXCJjYWxlbmRhclJlcGVhdEludGVydmFsRGFpbHlfbGFiZWxcIixcblx0XHRcdHZhbHVlOiBSZXBlYXRQZXJpb2QuREFJTFksXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRuYW1lOiBcImNhbGVuZGFyUmVwZWF0SW50ZXJ2YWxXZWVrbHlfbGFiZWxcIixcblx0XHRcdHZhbHVlOiBSZXBlYXRQZXJpb2QuV0VFS0xZLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0bmFtZTogXCJjYWxlbmRhclJlcGVhdEludGVydmFsTW9udGhseV9sYWJlbFwiLFxuXHRcdFx0dmFsdWU6IFJlcGVhdFBlcmlvZC5NT05USExZLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0bmFtZTogXCJjYWxlbmRhclJlcGVhdEludGVydmFsQW5udWFsbHlfbGFiZWxcIixcblx0XHRcdHZhbHVlOiBSZXBlYXRQZXJpb2QuQU5OVUFMTFksXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRuYW1lOiBcImN1c3RvbV9sYWJlbFwiLFxuXHRcdFx0dmFsdWU6IFwiQ1VTVE9NXCIsXG5cdFx0fSxcblx0XVxufVxuXG5leHBvcnQgY29uc3QgY3VzdG9tRnJlcXVlbmNpZXNPcHRpb25zID0gW1xuXHR7XG5cdFx0bmFtZTogeyBzaW5ndWxhcjogXCJkYXlfbGFiZWxcIiwgcGx1cmFsOiBcImRheXNfbGFiZWxcIiB9LFxuXHRcdHZhbHVlOiBSZXBlYXRQZXJpb2QuREFJTFksXG5cdH0sXG5cdHtcblx0XHRuYW1lOiB7IHNpbmd1bGFyOiBcIndlZWtfbGFiZWxcIiwgcGx1cmFsOiBcIndlZWtzX2xhYmVsXCIgfSxcblx0XHR2YWx1ZTogUmVwZWF0UGVyaW9kLldFRUtMWSxcblx0fSxcblx0e1xuXHRcdG5hbWU6IHsgc2luZ3VsYXI6IFwibW9udGhfbGFiZWxcIiwgcGx1cmFsOiBcIm1vbnRoc19sYWJlbFwiIH0sXG5cdFx0dmFsdWU6IFJlcGVhdFBlcmlvZC5NT05USExZLFxuXHR9LFxuXHR7XG5cdFx0bmFtZTogeyBzaW5ndWxhcjogXCJ5ZWFyX2xhYmVsXCIsIHBsdXJhbDogXCJ5ZWFyc19sYWJlbFwiIH0sXG5cdFx0dmFsdWU6IFJlcGVhdFBlcmlvZC5BTk5VQUxMWSxcblx0fSxcbl1cblxuZXhwb3J0IGNvbnN0IGNyZWF0ZUN1c3RvbUVuZFR5cGVPcHRpb25zID0gKCk6IFJlYWRvbmx5QXJyYXk8UmFkaW9Hcm91cE9wdGlvbjxFbmRUeXBlPj4gPT4ge1xuXHRyZXR1cm4gW1xuXHRcdHtcblx0XHRcdG5hbWU6IFwiY2FsZW5kYXJSZXBlYXRTdG9wQ29uZGl0aW9uTmV2ZXJfbGFiZWxcIixcblx0XHRcdHZhbHVlOiBFbmRUeXBlLk5ldmVyLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0bmFtZTogXCJjYWxlbmRhclJlcGVhdFN0b3BDb25kaXRpb25PY2N1cnJlbmNlc19sYWJlbFwiLFxuXHRcdFx0dmFsdWU6IEVuZFR5cGUuQ291bnQsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRuYW1lOiBcImNhbGVuZGFyUmVwZWF0U3RvcENvbmRpdGlvbkRhdGVfbGFiZWxcIixcblx0XHRcdHZhbHVlOiBFbmRUeXBlLlVudGlsRGF0ZSxcblx0XHR9LFxuXHRdXG59XG5cbmV4cG9ydCBjb25zdCBjcmVhdGVSZXBlYXRSdWxlRW5kVHlwZVZhbHVlcyA9ICgpOiBTZWxlY3Rvckl0ZW1MaXN0PEVuZFR5cGU+ID0+IHtcblx0cmV0dXJuIFtcblx0XHR7XG5cdFx0XHRuYW1lOiBsYW5nLmdldChcImNhbGVuZGFyUmVwZWF0U3RvcENvbmRpdGlvbk5ldmVyX2xhYmVsXCIpLFxuXHRcdFx0dmFsdWU6IEVuZFR5cGUuTmV2ZXIsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRuYW1lOiBsYW5nLmdldChcImNhbGVuZGFyUmVwZWF0U3RvcENvbmRpdGlvbk9jY3VycmVuY2VzX2xhYmVsXCIpLFxuXHRcdFx0dmFsdWU6IEVuZFR5cGUuQ291bnQsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRuYW1lOiBsYW5nLmdldChcImNhbGVuZGFyUmVwZWF0U3RvcENvbmRpdGlvbkRhdGVfbGFiZWxcIiksXG5cdFx0XHR2YWx1ZTogRW5kVHlwZS5VbnRpbERhdGUsXG5cdFx0fSxcblx0XVxufVxuZXhwb3J0IGNvbnN0IGNyZWF0ZUludGVydmFsVmFsdWVzID0gKCk6IEludGVydmFsT3B0aW9uW10gPT4gbnVtYmVyUmFuZ2UoMSwgMjU2KS5tYXAoKG4pID0+ICh7IG5hbWU6IFN0cmluZyhuKSwgdmFsdWU6IG4sIGFyaWFWYWx1ZTogU3RyaW5nKG4pIH0pKVxuXG5leHBvcnQgZnVuY3Rpb24gaHVtYW5EZXNjcmlwdGlvbkZvckFsYXJtSW50ZXJ2YWw8UD4odmFsdWU6IEFsYXJtSW50ZXJ2YWwsIGxvY2FsZTogc3RyaW5nKTogc3RyaW5nIHtcblx0aWYgKHZhbHVlLnZhbHVlID09PSAwKSByZXR1cm4gbGFuZy5nZXQoXCJjYWxlbmRhclJlbWluZGVySW50ZXJ2YWxBdEV2ZW50U3RhcnRfbGFiZWxcIilcblxuXHRyZXR1cm4gRHVyYXRpb24uZnJvbU9iamVjdChhbGFybUludGVydmFsVG9MdXhvbkR1cmF0aW9uTGlrZU9iamVjdCh2YWx1ZSkpLnJlY29uZmlndXJlKHsgbG9jYWxlOiBsb2NhbGUgfSkudG9IdW1hbigpXG59XG5cbmV4cG9ydCBjb25zdCBjcmVhdGVBbGFybUludGVydmFsSXRlbXMgPSAobG9jYWxlOiBzdHJpbmcpOiBTZWxlY3Rvckl0ZW1MaXN0PEFsYXJtSW50ZXJ2YWw+ID0+XG5cdHR5cGVkVmFsdWVzKFN0YW5kYXJkQWxhcm1JbnRlcnZhbCkubWFwKCh2YWx1ZSkgPT4ge1xuXHRcdHJldHVybiB7XG5cdFx0XHR2YWx1ZSxcblx0XHRcdG5hbWU6IGh1bWFuRGVzY3JpcHRpb25Gb3JBbGFybUludGVydmFsKHZhbHVlLCBsb2NhbGUpLFxuXHRcdH1cblx0fSlcblxuZXhwb3J0IGludGVyZmFjZSBBdHRlbmRpbmdJdGVtIGV4dGVuZHMgU2VsZWN0T3B0aW9uPENhbGVuZGFyQXR0ZW5kZWVTdGF0dXM+IHtcblx0bmFtZTogc3RyaW5nXG5cdHNlbGVjdGFibGU/OiBib29sZWFuXG59XG5cbmV4cG9ydCBjb25zdCBjcmVhdGVBdHRlbmRpbmdJdGVtcyA9ICgpOiBBdHRlbmRpbmdJdGVtW10gPT4gW1xuXHR7XG5cdFx0bmFtZTogbGFuZy5nZXQoXCJhdHRlbmRpbmdfbGFiZWxcIiksXG5cdFx0dmFsdWU6IENhbGVuZGFyQXR0ZW5kZWVTdGF0dXMuQUNDRVBURUQsXG5cdFx0YXJpYVZhbHVlOiBsYW5nLmdldChcImF0dGVuZGluZ19sYWJlbFwiKSxcblx0fSxcblx0e1xuXHRcdG5hbWU6IGxhbmcuZ2V0KFwibWF5YmVBdHRlbmRpbmdfbGFiZWxcIiksXG5cdFx0dmFsdWU6IENhbGVuZGFyQXR0ZW5kZWVTdGF0dXMuVEVOVEFUSVZFLFxuXHRcdGFyaWFWYWx1ZTogbGFuZy5nZXQoXCJtYXliZUF0dGVuZGluZ19sYWJlbFwiKSxcblx0fSxcblx0e1xuXHRcdG5hbWU6IGxhbmcuZ2V0KFwibm90QXR0ZW5kaW5nX2xhYmVsXCIpLFxuXHRcdHZhbHVlOiBDYWxlbmRhckF0dGVuZGVlU3RhdHVzLkRFQ0xJTkVELFxuXHRcdGFyaWFWYWx1ZTogbGFuZy5nZXQoXCJub3RBdHRlbmRpbmdfbGFiZWxcIiksXG5cdH0sXG5cdHtcblx0XHRuYW1lOiBsYW5nLmdldChcInBlbmRpbmdfbGFiZWxcIiksXG5cdFx0dmFsdWU6IENhbGVuZGFyQXR0ZW5kZWVTdGF0dXMuTkVFRFNfQUNUSU9OLFxuXHRcdHNlbGVjdGFibGU6IGZhbHNlLFxuXHRcdGFyaWFWYWx1ZTogbGFuZy5nZXQoXCJwZW5kaW5nX2xhYmVsXCIpLFxuXHR9LFxuXVxuXG5leHBvcnQgZnVuY3Rpb24gaHVtYW5EZXNjcmlwdGlvbkZvckFsYXJtSW50ZXJ2YWxVbml0KHVuaXQ6IEFsYXJtSW50ZXJ2YWxVbml0KTogc3RyaW5nIHtcblx0c3dpdGNoICh1bml0KSB7XG5cdFx0Y2FzZSBBbGFybUludGVydmFsVW5pdC5NSU5VVEU6XG5cdFx0XHRyZXR1cm4gbGFuZy5nZXQoXCJjYWxlbmRhclJlbWluZGVySW50ZXJ2YWxVbml0TWludXRlc19sYWJlbFwiKVxuXHRcdGNhc2UgQWxhcm1JbnRlcnZhbFVuaXQuSE9VUjpcblx0XHRcdHJldHVybiBsYW5nLmdldChcImNhbGVuZGFyUmVtaW5kZXJJbnRlcnZhbFVuaXRIb3Vyc19sYWJlbFwiKVxuXHRcdGNhc2UgQWxhcm1JbnRlcnZhbFVuaXQuREFZOlxuXHRcdFx0cmV0dXJuIGxhbmcuZ2V0KFwiY2FsZW5kYXJSZW1pbmRlckludGVydmFsVW5pdERheXNfbGFiZWxcIilcblx0XHRjYXNlIEFsYXJtSW50ZXJ2YWxVbml0LldFRUs6XG5cdFx0XHRyZXR1cm4gbGFuZy5nZXQoXCJjYWxlbmRhclJlbWluZGVySW50ZXJ2YWxVbml0V2Vla3NfbGFiZWxcIilcblx0fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdGltZVN0cmluZyhkYXRlOiBEYXRlLCBhbVBtOiBib29sZWFuKTogc3RyaW5nIHtcblx0cmV0dXJuIHRpbWVTdHJpbmdGcm9tUGFydHMoZGF0ZS5nZXRIb3VycygpLCBkYXRlLmdldE1pbnV0ZXMoKSwgYW1QbSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRpbWVTdHJpbmdJblpvbmUoZGF0ZTogRGF0ZSwgYW1QbTogYm9vbGVhbiwgem9uZTogc3RyaW5nKTogc3RyaW5nIHtcblx0Y29uc3QgeyBob3VyLCBtaW51dGUgfSA9IERhdGVUaW1lLmZyb21KU0RhdGUoZGF0ZSwge1xuXHRcdHpvbmUsXG5cdH0pXG5cdHJldHVybiB0aW1lU3RyaW5nRnJvbVBhcnRzKGhvdXIsIG1pbnV0ZSwgYW1QbSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdEV2ZW50VGltZSh7IGVuZFRpbWUsIHN0YXJ0VGltZSB9OiBDYWxlbmRhckV2ZW50VGltZXMsIHNob3dUaW1lOiBFdmVudFRleHRUaW1lT3B0aW9uKTogc3RyaW5nIHtcblx0c3dpdGNoIChzaG93VGltZSkge1xuXHRcdGNhc2UgRXZlbnRUZXh0VGltZU9wdGlvbi5TVEFSVF9USU1FOlxuXHRcdFx0cmV0dXJuIGZvcm1hdFRpbWUoc3RhcnRUaW1lKVxuXG5cdFx0Y2FzZSBFdmVudFRleHRUaW1lT3B0aW9uLkVORF9USU1FOlxuXHRcdFx0cmV0dXJuIGAgLSAke2Zvcm1hdFRpbWUoZW5kVGltZSl9YFxuXG5cdFx0Y2FzZSBFdmVudFRleHRUaW1lT3B0aW9uLlNUQVJUX0VORF9USU1FOlxuXHRcdFx0cmV0dXJuIGAke2Zvcm1hdFRpbWUoc3RhcnRUaW1lKX0gLSAke2Zvcm1hdFRpbWUoZW5kVGltZSl9YFxuXG5cdFx0ZGVmYXVsdDpcblx0XHRcdHRocm93IG5ldyBQcm9ncmFtbWluZ0Vycm9yKGBVbmtub3duIHRpbWUgb3B0aW9uOiAke3Nob3dUaW1lfWApXG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdEV2ZW50VGltZXMoZGF5OiBEYXRlLCBldmVudDogQ2FsZW5kYXJFdmVudCwgem9uZTogc3RyaW5nKTogc3RyaW5nIHtcblx0aWYgKGlzQWxsRGF5RXZlbnQoZXZlbnQpKSB7XG5cdFx0cmV0dXJuIGxhbmcuZ2V0KFwiYWxsRGF5X2xhYmVsXCIpXG5cdH0gZWxzZSB7XG5cdFx0Y29uc3Qgc3RhcnRzQmVmb3JlID0gZXZlbnRTdGFydHNCZWZvcmUoZGF5LCB6b25lLCBldmVudClcblx0XHRjb25zdCBlbmRzQWZ0ZXIgPSBldmVudEVuZHNBZnRlckRheShkYXksIHpvbmUsIGV2ZW50KVxuXHRcdGlmIChzdGFydHNCZWZvcmUgJiYgZW5kc0FmdGVyKSB7XG5cdFx0XHRyZXR1cm4gbGFuZy5nZXQoXCJhbGxEYXlfbGFiZWxcIilcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc3Qgc3RhcnRUaW1lOiBEYXRlID0gc3RhcnRzQmVmb3JlID8gZGF5IDogZXZlbnQuc3RhcnRUaW1lXG5cdFx0XHRjb25zdCBlbmRUaW1lOiBEYXRlID0gZW5kc0FmdGVyID8gZ2V0RW5kT2ZEYXlXaXRoWm9uZShkYXksIHpvbmUpIDogZXZlbnQuZW5kVGltZVxuXHRcdFx0cmV0dXJuIGZvcm1hdEV2ZW50VGltZSh7IHN0YXJ0VGltZSwgZW5kVGltZSB9LCBFdmVudFRleHRUaW1lT3B0aW9uLlNUQVJUX0VORF9USU1FKVxuXHRcdH1cblx0fVxufVxuXG5leHBvcnQgY29uc3QgY3JlYXRlQ3VzdG9tUmVwZWF0UnVsZVVuaXRWYWx1ZXMgPSAoKTogU2VsZWN0b3JJdGVtTGlzdDxBbGFybUludGVydmFsVW5pdCB8IG51bGw+ID0+IHtcblx0cmV0dXJuIFtcblx0XHR7XG5cdFx0XHRuYW1lOiBodW1hbkRlc2NyaXB0aW9uRm9yQWxhcm1JbnRlcnZhbFVuaXQoQWxhcm1JbnRlcnZhbFVuaXQuTUlOVVRFKSxcblx0XHRcdHZhbHVlOiBBbGFybUludGVydmFsVW5pdC5NSU5VVEUsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRuYW1lOiBodW1hbkRlc2NyaXB0aW9uRm9yQWxhcm1JbnRlcnZhbFVuaXQoQWxhcm1JbnRlcnZhbFVuaXQuSE9VUiksXG5cdFx0XHR2YWx1ZTogQWxhcm1JbnRlcnZhbFVuaXQuSE9VUixcblx0XHR9LFxuXHRcdHtcblx0XHRcdG5hbWU6IGh1bWFuRGVzY3JpcHRpb25Gb3JBbGFybUludGVydmFsVW5pdChBbGFybUludGVydmFsVW5pdC5EQVkpLFxuXHRcdFx0dmFsdWU6IEFsYXJtSW50ZXJ2YWxVbml0LkRBWSxcblx0XHR9LFxuXHRcdHtcblx0XHRcdG5hbWU6IGh1bWFuRGVzY3JpcHRpb25Gb3JBbGFybUludGVydmFsVW5pdChBbGFybUludGVydmFsVW5pdC5XRUVLKSxcblx0XHRcdHZhbHVlOiBBbGFybUludGVydmFsVW5pdC5XRUVLLFxuXHRcdH0sXG5cdF1cbn1cbmV4cG9ydCBjb25zdCBDQUxFTkRBUl9FVkVOVF9IRUlHSFQ6IG51bWJlciA9IHNpemUuY2FsZW5kYXJfbGluZV9oZWlnaHQgKyAyXG5leHBvcnQgY29uc3QgVEVNUE9SQVJZX0VWRU5UX09QQUNJVFkgPSAwLjdcblxuZXhwb3J0IGNvbnN0IGVudW0gRXZlbnRMYXlvdXRNb2RlIHtcblx0LyoqIFRha2UgZXZlbnQgc3RhcnQgYW5kIGVuZCB0aW1lcyBpbnRvIGFjY291bnQgd2hlbiBsYXlpbmcgb3V0LiAqL1xuXHRUaW1lQmFzZWRDb2x1bW4sXG5cdC8qKiBFYWNoIGV2ZW50IGlzIHRyZWF0ZWQgYXMgaWYgaXQgd291bGQgdGFrZSB0aGUgd2hvbGUgZGF5IHdoZW4gbGF5aW5nIG91dC4gKi9cblx0RGF5QmFzZWRDb2x1bW4sXG59XG5cbi8qKlxuICogRnVuY3Rpb24gd2hpY2ggc29ydHMgZXZlbnRzIGludG8gdGhlIFwiY29sdW1uc1wiIGFuZCBcInJvd3NcIiBhbmQgcmVuZGVycyB0aGVtIHVzaW5nIHtAcGFyYW0gcmVuZGVyZXJ9LlxuICogQ29sdW1ucyBhcmUgYWJzdHJhY3QgYW5kIGNhbiBiZSBhY3R1YWxseSB0aGUgcm93cy4gQSBzaW5nbGUgY29sdW1uIHByb2dyZXNzZXMgaW4gdGltZSB3aGlsZSBtdWx0aXBsZSBjb2x1bW5zIGNhbiBoYXBwZW4gaW4gcGFyYWxsZWwuXG4gKiBpbiBvbmUgY29sdW1uIG9uIGEgc2luZ2xlIGRheSAoaXQgd2lsbCBcInN0cmV0Y2hcIiBldmVudHMgZnJvbSB0aGUgZGF5IHN0YXJ0IHVudGlsIHRoZSBuZXh0IGRheSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsYXlPdXRFdmVudHMoXG5cdGV2ZW50czogQXJyYXk8Q2FsZW5kYXJFdmVudD4sXG5cdHpvbmU6IHN0cmluZyxcblx0cmVuZGVyZXI6IChjb2x1bW5zOiBBcnJheTxBcnJheTxDYWxlbmRhckV2ZW50Pj4pID0+IENoaWxkQXJyYXksXG5cdGxheW91dE1vZGU6IEV2ZW50TGF5b3V0TW9kZSxcbik6IENoaWxkQXJyYXkge1xuXHRldmVudHMuc29ydCgoZTEsIGUyKSA9PiB7XG5cdFx0Y29uc3QgZTFTdGFydCA9IGdldEV2ZW50U3RhcnQoZTEsIHpvbmUpXG5cdFx0Y29uc3QgZTJTdGFydCA9IGdldEV2ZW50U3RhcnQoZTIsIHpvbmUpXG5cdFx0aWYgKGUxU3RhcnQgPCBlMlN0YXJ0KSByZXR1cm4gLTFcblx0XHRpZiAoZTFTdGFydCA+IGUyU3RhcnQpIHJldHVybiAxXG5cdFx0Y29uc3QgZTFFbmQgPSBnZXRFdmVudEVuZChlMSwgem9uZSlcblx0XHRjb25zdCBlMkVuZCA9IGdldEV2ZW50RW5kKGUyLCB6b25lKVxuXHRcdGlmIChlMUVuZCA8IGUyRW5kKSByZXR1cm4gLTFcblx0XHRpZiAoZTFFbmQgPiBlMkVuZCkgcmV0dXJuIDFcblx0XHRyZXR1cm4gMFxuXHR9KVxuXHRsZXQgbGFzdEV2ZW50RW5kaW5nOiBEYXRlIHwgbnVsbCA9IG51bGxcblx0bGV0IGxhc3RFdmVudFN0YXJ0OiBEYXRlIHwgbnVsbCA9IG51bGxcblx0bGV0IGNvbHVtbnM6IEFycmF5PEFycmF5PENhbGVuZGFyRXZlbnQ+PiA9IFtdXG5cdGNvbnN0IGNoaWxkcmVuOiBBcnJheTxDaGlsZHJlbj4gPSBbXVxuXHQvLyBDYWNoZSBmb3IgY2FsY3VsYXRpb24gZXZlbnRzXG5cdGNvbnN0IGNhbGNFdmVudHMgPSBuZXcgTWFwKClcblx0Zm9yIChjb25zdCBlIG9mIGV2ZW50cykge1xuXHRcdGNvbnN0IGNhbGNFdmVudCA9IGdldEZyb21NYXAoY2FsY0V2ZW50cywgZSwgKCkgPT4gZ2V0Q2FsY3VsYXRpb25FdmVudChlLCB6b25lLCBsYXlvdXRNb2RlKSlcblx0XHQvLyBDaGVjayBpZiBhIG5ldyBldmVudCBncm91cCBuZWVkcyB0byBiZSBzdGFydGVkXG5cdFx0aWYgKFxuXHRcdFx0bGFzdEV2ZW50RW5kaW5nICE9IG51bGwgJiZcblx0XHRcdGxhc3RFdmVudFN0YXJ0ICE9IG51bGwgJiZcblx0XHRcdGxhc3RFdmVudEVuZGluZyA8PSBjYWxjRXZlbnQuc3RhcnRUaW1lLmdldFRpbWUoKSAmJlxuXHRcdFx0KGxheW91dE1vZGUgPT09IEV2ZW50TGF5b3V0TW9kZS5EYXlCYXNlZENvbHVtbiB8fCAhdmlzdWFsbHlPdmVybGFwcyhsYXN0RXZlbnRTdGFydCwgbGFzdEV2ZW50RW5kaW5nLCBjYWxjRXZlbnQuc3RhcnRUaW1lKSlcblx0XHQpIHtcblx0XHRcdC8vIFRoZSBsYXRlc3QgZXZlbnQgaXMgbGF0ZXIgdGhhbiBhbnkgb2YgdGhlIGV2ZW50IGluIHRoZVxuXHRcdFx0Ly8gY3VycmVudCBncm91cC4gVGhlcmUgaXMgbm8gb3ZlcmxhcC4gT3V0cHV0IHRoZSBjdXJyZW50XG5cdFx0XHQvLyBldmVudCBncm91cCBhbmQgc3RhcnQgYSBuZXcgZXZlbnQgZ3JvdXAuXG5cdFx0XHRjaGlsZHJlbi5wdXNoKC4uLnJlbmRlcmVyKGNvbHVtbnMpKVxuXHRcdFx0Y29sdW1ucyA9IFtdIC8vIFRoaXMgc3RhcnRzIG5ldyBldmVudCBncm91cC5cblxuXHRcdFx0bGFzdEV2ZW50RW5kaW5nID0gbnVsbFxuXHRcdFx0bGFzdEV2ZW50U3RhcnQgPSBudWxsXG5cdFx0fVxuXG5cdFx0Ly8gVHJ5IHRvIHBsYWNlIHRoZSBldmVudCBpbnNpZGUgdGhlIGV4aXN0aW5nIGNvbHVtbnNcblx0XHRsZXQgcGxhY2VkID0gZmFsc2VcblxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgY29sdW1ucy5sZW5ndGg7IGkrKykge1xuXHRcdFx0Y29uc3QgY29sID0gY29sdW1uc1tpXVxuXHRcdFx0Y29uc3QgbGFzdEV2ZW50ID0gY29sW2NvbC5sZW5ndGggLSAxXVxuXHRcdFx0Y29uc3QgbGFzdENhbGNFdmVudCA9IGdldEZyb21NYXAoY2FsY0V2ZW50cywgbGFzdEV2ZW50LCAoKSA9PiBnZXRDYWxjdWxhdGlvbkV2ZW50KGxhc3RFdmVudCwgem9uZSwgbGF5b3V0TW9kZSkpXG5cblx0XHRcdGlmIChcblx0XHRcdFx0IWNvbGxpZGVzV2l0aChsYXN0Q2FsY0V2ZW50LCBjYWxjRXZlbnQpICYmXG5cdFx0XHRcdChsYXlvdXRNb2RlID09PSBFdmVudExheW91dE1vZGUuRGF5QmFzZWRDb2x1bW4gfHwgIXZpc3VhbGx5T3ZlcmxhcHMobGFzdENhbGNFdmVudC5zdGFydFRpbWUsIGxhc3RDYWxjRXZlbnQuZW5kVGltZSwgY2FsY0V2ZW50LnN0YXJ0VGltZSkpXG5cdFx0XHQpIHtcblx0XHRcdFx0Y29sLnB1c2goZSkgLy8gcHVzaCByZWFsIGV2ZW50IGhlcmUgbm90IGNhbGMgZXZlbnRcblxuXHRcdFx0XHRwbGFjZWQgPSB0cnVlXG5cdFx0XHRcdGJyZWFrXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gSXQgd2FzIG5vdCBwb3NzaWJsZSB0byBwbGFjZSB0aGUgZXZlbnQuIEFkZCBhIG5ldyBjb2x1bW5cblx0XHQvLyBmb3IgdGhlIGN1cnJlbnQgZXZlbnQgZ3JvdXAuXG5cdFx0aWYgKCFwbGFjZWQpIHtcblx0XHRcdGNvbHVtbnMucHVzaChbZV0pXG5cdFx0fVxuXG5cdFx0Ly8gUmVtZW1iZXIgdGhlIGxhdGVzdCBldmVudCBlbmQgdGltZSBhbmQgc3RhcnQgdGltZSBvZiB0aGUgY3VycmVudCBncm91cC5cblx0XHQvLyBUaGlzIGlzIGxhdGVyIHVzZWQgdG8gZGV0ZXJtaW5lIGlmIGEgbmV3IGdyb3VwcyBzdGFydHMuXG5cdFx0aWYgKGxhc3RFdmVudEVuZGluZyA9PSBudWxsIHx8IGxhc3RFdmVudEVuZGluZy5nZXRUaW1lKCkgPCBjYWxjRXZlbnQuZW5kVGltZS5nZXRUaW1lKCkpIHtcblx0XHRcdGxhc3RFdmVudEVuZGluZyA9IGNhbGNFdmVudC5lbmRUaW1lXG5cdFx0fVxuXHRcdGlmIChsYXN0RXZlbnRTdGFydCA9PSBudWxsIHx8IGxhc3RFdmVudFN0YXJ0LmdldFRpbWUoKSA8IGNhbGNFdmVudC5zdGFydFRpbWUuZ2V0VGltZSgpKSB7XG5cdFx0XHRsYXN0RXZlbnRTdGFydCA9IGNhbGNFdmVudC5zdGFydFRpbWVcblx0XHR9XG5cdH1cblx0Y2hpbGRyZW4ucHVzaCguLi5yZW5kZXJlcihjb2x1bW5zKSlcblx0cmV0dXJuIGNoaWxkcmVuXG59XG5cbi8qKiBnZXQgYW4gZXZlbnQgdGhhdCBjYW4gYmUgcmVuZGVyZWQgdG8gdGhlIHNjcmVlbi4gaW4gZGF5IHZpZXcsIHRoZSBldmVudCBpcyByZXR1cm5lZCBhcy1pcywgb3RoZXJ3aXNlIGl0J3Mgc3RyZXRjaGVkIHRvIGNvdmVyIGVhY2ggZGF5XG4gKiBpdCBvY2N1cnMgb24gY29tcGxldGVseS4gKi9cbmZ1bmN0aW9uIGdldENhbGN1bGF0aW9uRXZlbnQoZXZlbnQ6IENhbGVuZGFyRXZlbnQsIHpvbmU6IHN0cmluZywgZXZlbnRMYXlvdXRNb2RlOiBFdmVudExheW91dE1vZGUpOiBDYWxlbmRhckV2ZW50IHtcblx0aWYgKGV2ZW50TGF5b3V0TW9kZSA9PT0gRXZlbnRMYXlvdXRNb2RlLkRheUJhc2VkQ29sdW1uKSB7XG5cdFx0Y29uc3QgY2FsY0V2ZW50ID0gY2xvbmUoZXZlbnQpXG5cblx0XHRpZiAoaXNBbGxEYXlFdmVudChldmVudCkpIHtcblx0XHRcdGNhbGNFdmVudC5zdGFydFRpbWUgPSBnZXRBbGxEYXlEYXRlRm9yVGltZXpvbmUoZXZlbnQuc3RhcnRUaW1lLCB6b25lKVxuXHRcdFx0Y2FsY0V2ZW50LmVuZFRpbWUgPSBnZXRBbGxEYXlEYXRlRm9yVGltZXpvbmUoZXZlbnQuZW5kVGltZSwgem9uZSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y2FsY0V2ZW50LnN0YXJ0VGltZSA9IGdldFN0YXJ0T2ZEYXlXaXRoWm9uZShldmVudC5zdGFydFRpbWUsIHpvbmUpXG5cdFx0XHRjYWxjRXZlbnQuZW5kVGltZSA9IGdldFN0YXJ0T2ZOZXh0RGF5V2l0aFpvbmUoZXZlbnQuZW5kVGltZSwgem9uZSlcblx0XHR9XG5cblx0XHRyZXR1cm4gY2FsY0V2ZW50XG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIGV2ZW50XG5cdH1cbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIGNoZWNrcyB3aGV0aGVyIHR3byBldmVudHMgY29sbGlkZSBiYXNlZCBvbiB0aGVpciBzdGFydCBhbmQgZW5kIHRpbWVcbiAqIEFzc3VtaW5nIHZlcnRpY2FsIGNvbHVtbnMgd2l0aCB0aW1lIGdvaW5nIHRvcC10by1ib3R0b20sIHRoaXMgd291bGQgYmUgdHJ1ZSBpbiB0aGVzZSBjYXNlczpcbiAqXG4gKiBjYXNlIDE6XG4gKiArLS0tLS0tLS0tLS0rXG4gKiB8ICAgICAgICAgICB8XG4gKiB8ICAgICAgICAgICB8ICAgKy0tLS0tLS0tLS0rXG4gKiArLS0tLS0tLS0tLS0rICAgfCAgICAgICAgICB8XG4gKiAgICAgICAgICAgICAgICAgfCAgICAgICAgICB8XG4gKiAgICAgICAgICAgICAgICAgKy0tLS0tLS0tLS0rXG4gKiBjYXNlIDI6XG4gKiArLS0tLS0tLS0tLS0rXG4gKiB8ICAgICAgICAgICB8ICAgKy0tLS0tLS0tLS0rXG4gKiB8ICAgICAgICAgICB8ICAgfCAgICAgICAgICB8XG4gKiB8ICAgICAgICAgICB8ICAgKy0tLS0tLS0tLS0rXG4gKiArLS0tLS0tLS0tLS0rXG4gKlxuICogVGhlcmUgY291bGQgYmUgYSBjYXNlIHdoZXJlIHRoZXkgYXJlIGZsaXBwZWQgdmVydGljYWxseSwgYnV0IHdlIGRvbid0IGhhdmUgdGhlbSBiZWNhdXNlIGVhcmxpZXIgZXZlbnRzIHdpbGwgYmUgYWx3YXlzIGZpcnN0LiBzbyB0aGUgXCJsZWZ0XCIgdG9wIGVkZ2Ugd2lsbFxuICogYWx3YXlzIGJlIFwiYWJvdmVcIiB0aGUgXCJyaWdodFwiIHRvcCBlZGdlLlxuICovXG5mdW5jdGlvbiBjb2xsaWRlc1dpdGgoYTogQ2FsZW5kYXJFdmVudCwgYjogQ2FsZW5kYXJFdmVudCk6IGJvb2xlYW4ge1xuXHRyZXR1cm4gYS5lbmRUaW1lLmdldFRpbWUoKSA+IGIuc3RhcnRUaW1lLmdldFRpbWUoKSAmJiBhLnN0YXJ0VGltZS5nZXRUaW1lKCkgPCBiLmVuZFRpbWUuZ2V0VGltZSgpXG59XG5cbi8qKlxuICogRHVlIHRvIHRoZSBtaW5pbXVtIGhlaWdodCBmb3IgZXZlbnRzIHRoZXkgb3ZlcmxhcCBpZiBhIHNob3J0IGV2ZW50IGlzIGRpcmVjdGx5IGZvbGxvd2VkIGJ5IGFub3RoZXIgZXZlbnQsXG4gKiB0aGVyZWZvcmUsIHdlIGNoZWNrIHdoZXRoZXIgdGhlIGV2ZW50IGhlaWdodCBpcyBsZXNzIHRoYW4gdGhlIG1pbmltdW0gaGVpZ2h0LlxuICpcbiAqIFRoaXMgZG9lcyBub3QgY292ZXIgYWxsIHRoZSBjYXNlcyBidXQgaGFuZGxlcyB0aGUgY2FzZSB3aGVuIHRoZSBzZWNvbmQgZXZlbnQgc3RhcnRzIHJpZ2h0IGFmdGVyIHRoZSBmaXJzdCBvbmUuXG4gKi9cbmZ1bmN0aW9uIHZpc3VhbGx5T3ZlcmxhcHMoZmlyc3RFdmVudFN0YXJ0OiBEYXRlLCBmaXJzdEV2ZW50RW5kOiBEYXRlLCBzZWNvbmRFdmVudFN0YXJ0OiBEYXRlKTogYm9vbGVhbiB7XG5cdC8vIFdlIGFyZSBvbmx5IGludGVyZXN0ZWQgaW4gdGhlIGhlaWdodCBvbiB0aGUgbGFzdCBkYXkgb2YgdGhlIGV2ZW50IGJlY2F1c2UgYW4gZXZlbnQgZW5kaW5nIGxhdGVyIHdpbGwgdGFrZSB1cCB0aGUgd2hvbGUgY29sdW1uIHVudGlsIHRoZSBuZXh0IGRheSBhbnl3YXkuXG5cdGNvbnN0IGZpcnN0RXZlbnRTdGFydE9uU2FtZURheSA9IGlzU2FtZURheShmaXJzdEV2ZW50U3RhcnQsIGZpcnN0RXZlbnRFbmQpID8gZmlyc3RFdmVudFN0YXJ0LmdldFRpbWUoKSA6IGdldFN0YXJ0T2ZEYXkoZmlyc3RFdmVudEVuZCkuZ2V0VGltZSgpXG5cdGNvbnN0IGV2ZW50RHVyYXRpb25NcyA9IGZpcnN0RXZlbnRFbmQuZ2V0VGltZSgpIC0gZmlyc3RFdmVudFN0YXJ0T25TYW1lRGF5XG5cdGNvbnN0IGV2ZW50RHVyYXRpb25Ib3VycyA9IGV2ZW50RHVyYXRpb25NcyAvICgxMDAwICogNjAgKiA2MClcblx0Y29uc3QgaGVpZ2h0ID0gZXZlbnREdXJhdGlvbkhvdXJzICogc2l6ZS5jYWxlbmRhcl9ob3VyX2hlaWdodCAtIHNpemUuY2FsZW5kYXJfZXZlbnRfYm9yZGVyXG5cdHJldHVybiBmaXJzdEV2ZW50RW5kLmdldFRpbWUoKSA9PT0gc2Vjb25kRXZlbnRTdGFydC5nZXRUaW1lKCkgJiYgaGVpZ2h0IDwgc2l6ZS5jYWxlbmRhcl9saW5lX2hlaWdodFxufVxuXG5leHBvcnQgZnVuY3Rpb24gZXhwYW5kRXZlbnQoZXY6IENhbGVuZGFyRXZlbnQsIGNvbHVtbkluZGV4OiBudW1iZXIsIGNvbHVtbnM6IEFycmF5PEFycmF5PENhbGVuZGFyRXZlbnQ+Pik6IG51bWJlciB7XG5cdGxldCBjb2xTcGFuID0gMVxuXG5cdGZvciAobGV0IGkgPSBjb2x1bW5JbmRleCArIDE7IGkgPCBjb2x1bW5zLmxlbmd0aDsgaSsrKSB7XG5cdFx0bGV0IGNvbCA9IGNvbHVtbnNbaV1cblxuXHRcdGZvciAobGV0IGogPSAwOyBqIDwgY29sLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRsZXQgZXYxID0gY29sW2pdXG5cblx0XHRcdGlmIChjb2xsaWRlc1dpdGgoZXYsIGV2MSkgfHwgdmlzdWFsbHlPdmVybGFwcyhldi5zdGFydFRpbWUsIGV2LmVuZFRpbWUsIGV2MS5zdGFydFRpbWUpKSB7XG5cdFx0XHRcdHJldHVybiBjb2xTcGFuXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Y29sU3BhbisrXG5cdH1cblxuXHRyZXR1cm4gY29sU3BhblxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RXZlbnRDb2xvcihldmVudDogQ2FsZW5kYXJFdmVudCwgZ3JvdXBDb2xvcnM6IEdyb3VwQ29sb3JzKTogc3RyaW5nIHtcblx0cmV0dXJuIChldmVudC5fb3duZXJHcm91cCAmJiBncm91cENvbG9ycy5nZXQoZXZlbnQuX293bmVyR3JvdXApKSA/PyBkZWZhdWx0Q2FsZW5kYXJDb2xvclxufVxuXG5leHBvcnQgZnVuY3Rpb24gY2FsZW5kYXJBdHRlbmRlZVN0YXR1c1N5bWJvbChzdGF0dXM6IENhbGVuZGFyQXR0ZW5kZWVTdGF0dXMpOiBzdHJpbmcge1xuXHRzd2l0Y2ggKHN0YXR1cykge1xuXHRcdGNhc2UgQ2FsZW5kYXJBdHRlbmRlZVN0YXR1cy5BRERFRDpcblx0XHRjYXNlIENhbGVuZGFyQXR0ZW5kZWVTdGF0dXMuTkVFRFNfQUNUSU9OOlxuXHRcdFx0cmV0dXJuIFwiXCJcblxuXHRcdGNhc2UgQ2FsZW5kYXJBdHRlbmRlZVN0YXR1cy5URU5UQVRJVkU6XG5cdFx0XHRyZXR1cm4gXCI/XCJcblxuXHRcdGNhc2UgQ2FsZW5kYXJBdHRlbmRlZVN0YXR1cy5BQ0NFUFRFRDpcblx0XHRcdHJldHVybiBcIuKck1wiXG5cblx0XHRjYXNlIENhbGVuZGFyQXR0ZW5kZWVTdGF0dXMuREVDTElORUQ6XG5cdFx0XHRyZXR1cm4gXCLinYxcIlxuXG5cdFx0ZGVmYXVsdDpcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIlVua25vd24gY2FsZW5kYXIgYXR0ZW5kZWUgc3RhdHVzOiBcIiArIHN0YXR1cylcblx0fVxufVxuXG5leHBvcnQgY29uc3QgaWNvbkZvckF0dGVuZGVlU3RhdHVzOiBSZWNvcmQ8Q2FsZW5kYXJBdHRlbmRlZVN0YXR1cywgQWxsSWNvbnM+ID0gT2JqZWN0LmZyZWV6ZSh7XG5cdFtDYWxlbmRhckF0dGVuZGVlU3RhdHVzLkFDQ0VQVEVEXTogSWNvbnMuQ2lyY2xlQ2hlY2ttYXJrLFxuXHRbQ2FsZW5kYXJBdHRlbmRlZVN0YXR1cy5URU5UQVRJVkVdOiBJY29ucy5DaXJjbGVIZWxwLFxuXHRbQ2FsZW5kYXJBdHRlbmRlZVN0YXR1cy5ERUNMSU5FRF06IEljb25zLkNpcmNsZVJlamVjdCxcblx0W0NhbGVuZGFyQXR0ZW5kZWVTdGF0dXMuTkVFRFNfQUNUSU9OXTogSWNvbnMuQ2lyY2xlSGVscCxcblx0W0NhbGVuZGFyQXR0ZW5kZWVTdGF0dXMuQURERURdOiBJY29ucy5DaXJjbGVIZWxwLFxufSlcbmV4cG9ydCBjb25zdCBnZXRHcm91cENvbG9ycyA9IG1lbW9pemVkKCh1c2VyU2V0dGluZ3NHcm91cFJvb3Q6IFVzZXJTZXR0aW5nc0dyb3VwUm9vdCkgPT4ge1xuXHRyZXR1cm4gdXNlclNldHRpbmdzR3JvdXBSb290Lmdyb3VwU2V0dGluZ3MucmVkdWNlKChhY2MsIHsgZ3JvdXAsIGNvbG9yIH0pID0+IHtcblx0XHRpZiAoIWlzVmFsaWRDb2xvckNvZGUoXCIjXCIgKyBjb2xvcikpIHtcblx0XHRcdGNvbG9yID0gZGVmYXVsdENhbGVuZGFyQ29sb3Jcblx0XHR9XG5cdFx0YWNjLnNldChncm91cCwgY29sb3IpXG5cdFx0cmV0dXJuIGFjY1xuXHR9LCBuZXcgTWFwKCkpXG59KVxuXG5leHBvcnQgY29uc3QgZ2V0Q2xpZW50T25seUNvbG9ycyA9ICh1c2VySWQ6IElkLCBjbGllbnRPbmx5Q2FsZW5kYXJzSW5mbzogTWFwPElkLCBDbGllbnRPbmx5Q2FsZW5kYXJzSW5mbz4pID0+IHtcblx0Y29uc3QgY29sb3JzOiBNYXA8SWQsIHN0cmluZz4gPSBuZXcgTWFwKClcblx0Zm9yIChjb25zdCBbaWQsIF9dIG9mIENMSUVOVF9PTkxZX0NBTEVOREFSUykge1xuXHRcdGNvbnN0IGNhbGVuZGFySWQgPSBgJHt1c2VySWR9IyR7aWR9YFxuXHRcdGNvbG9ycy5zZXQoY2FsZW5kYXJJZCwgY2xpZW50T25seUNhbGVuZGFyc0luZm8uZ2V0KGNhbGVuZGFySWQpPy5jb2xvciA/PyBERUZBVUxUX0NMSUVOVF9PTkxZX0NBTEVOREFSX0NPTE9SUy5nZXQoaWQpISlcblx0fVxuXHRyZXR1cm4gY29sb3JzXG59XG5cbmV4cG9ydCBjb25zdCBnZXRDbGllbnRPbmx5Q2FsZW5kYXJzID0gKHVzZXJJZDogSWQsIGNsaWVudE9ubHlDYWxlbmRhckluZm86IE1hcDxJZCwgQ2xpZW50T25seUNhbGVuZGFyc0luZm8+KSA9PiB7XG5cdGNvbnN0IHVzZXJDYWxlbmRhcnM6IChDbGllbnRPbmx5Q2FsZW5kYXJzSW5mbyAmIHsgaWQ6IHN0cmluZzsgbmFtZTogc3RyaW5nIH0pW10gPSBbXVxuXG5cdGZvciAoY29uc3QgW2lkLCBrZXldIG9mIENMSUVOVF9PTkxZX0NBTEVOREFSUykge1xuXHRcdGNvbnN0IGNhbGVuZGFySWQgPSBgJHt1c2VySWR9IyR7aWR9YFxuXHRcdGNvbnN0IGNhbGVuZGFyID0gY2xpZW50T25seUNhbGVuZGFySW5mby5nZXQoY2FsZW5kYXJJZClcblx0XHRpZiAoY2FsZW5kYXIpIHtcblx0XHRcdHVzZXJDYWxlbmRhcnMucHVzaCh7XG5cdFx0XHRcdC4uLmNhbGVuZGFyLFxuXHRcdFx0XHRpZDogY2FsZW5kYXJJZCxcblx0XHRcdFx0bmFtZTogY2FsZW5kYXIubmFtZSA/IGNhbGVuZGFyLm5hbWUgOiBsYW5nLmdldChrZXkpLFxuXHRcdFx0fSlcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gdXNlckNhbGVuZGFyc1xufVxuXG4vKipcbiAqICBmaW5kIG91dCBob3cgd2UgZW5kZWQgdXAgd2l0aCB0aGlzIGV2ZW50LCB3aGljaCBkZXRlcm1pbmVzIHRoZSBjYXBhYmlsaXRpZXMgd2UgaGF2ZSB3aXRoIGl0LlxuICogIGZvciBzaGFyZWQgZXZlbnRzIGluIGNhbGVuZGFyIHdoZXJlIHdlIGhhdmUgcmVhZC13cml0ZSBhY2Nlc3MsIHdlIGNhbiBzdGlsbCBvbmx5IHZpZXcgZXZlbnRzIHRoYXQgaGF2ZVxuICogIGF0dGVuZGVlcywgYmVjYXVzZSB3ZSBjb3VsZCBub3Qgc2VuZCB1cGRhdGVzIGFmdGVyIHdlIGVkaXQgc29tZXRoaW5nXG4gKiBAcGFyYW0gZXhpc3RpbmdFdmVudCB0aGUgZXZlbnQgaW4gcXVlc3Rpb24uXG4gKiBAcGFyYW0gY2FsZW5kYXJzIGEgbGlzdCBvZiBjYWxlbmRhcnMgdGhhdCB0aGlzIHVzZXIgaGFzIGFjY2VzcyB0by5cbiAqIEBwYXJhbSBvd25NYWlsQWRkcmVzc2VzIHRoZSBsaXN0IG9mIG1haWwgYWRkcmVzc2VzIHRoaXMgdXNlciBtaWdodCBiZSB1c2luZy5cbiAqIEBwYXJhbSB1c2VyQ29udHJvbGxlclxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RXZlbnRUeXBlKFxuXHRleGlzdGluZ0V2ZW50OiBQYXJ0aWFsPENhbGVuZGFyRXZlbnQ+LFxuXHRjYWxlbmRhcnM6IFJlYWRvbmx5TWFwPElkLCBDYWxlbmRhckluZm8+LFxuXHRvd25NYWlsQWRkcmVzc2VzOiBSZWFkb25seUFycmF5PHN0cmluZz4sXG5cdHVzZXJDb250cm9sbGVyOiBVc2VyQ29udHJvbGxlcixcbik6IEV2ZW50VHlwZSB7XG5cdGNvbnN0IHsgdXNlciwgdXNlclNldHRpbmdzR3JvdXBSb290IH0gPSB1c2VyQ29udHJvbGxlclxuXG5cdGlmICh1c2VyLmFjY291bnRUeXBlID09PSBBY2NvdW50VHlwZS5FWFRFUk5BTCkge1xuXHRcdHJldHVybiBFdmVudFR5cGUuRVhURVJOQUxcblx0fVxuXG5cdGNvbnN0IGV4aXN0aW5nT3JnYW5pemVyID0gZXhpc3RpbmdFdmVudC5vcmdhbml6ZXJcblx0Y29uc3QgaXNPcmdhbml6ZXIgPSBleGlzdGluZ09yZ2FuaXplciAhPSBudWxsICYmIG93bk1haWxBZGRyZXNzZXMuc29tZSgoYSkgPT4gY2xlYW5NYWlsQWRkcmVzcyhhKSA9PT0gZXhpc3RpbmdPcmdhbml6ZXIuYWRkcmVzcylcblxuXHRpZiAoZXhpc3RpbmdFdmVudC5fb3duZXJHcm91cCA9PSBudWxsKSB7XG5cdFx0aWYgKGV4aXN0aW5nT3JnYW5pemVyICE9IG51bGwgJiYgIWlzT3JnYW5pemVyKSB7XG5cdFx0XHQvLyBPd25lckdyb3VwIGlzIG5vdCBzZXQgZm9yIGV2ZW50cyBmcm9tIGZpbGUsIGJ1dCB3ZSBhbHNvIHJlcXVpcmUgYW4gb3JnYW5pemVyIHRvIHRyZWF0IGl0IGFzIGFuIGludml0ZS5cblx0XHRcdHJldHVybiBFdmVudFR5cGUuSU5WSVRFXG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIGVpdGhlciB0aGUgb3JnYW5pemVyIGV4aXN0cyBhbmQgaXQncyB1cywgb3IgdGhlIG9yZ2FuaXplciBkb2VzIG5vdCBleGlzdCBhbmQgd2UgY2FuIHRyZWF0IHRoaXMgYXMgb3VyIGV2ZW50LFxuXHRcdFx0Ly8gbGlrZSBmb3IgbmV3bHkgY3JlYXRlZCBldmVudHMuXG5cdFx0XHRyZXR1cm4gRXZlbnRUeXBlLk9XTlxuXHRcdH1cblx0fVxuXG5cdGNvbnN0IGNhbGVuZGFySW5mb0ZvckV2ZW50ID0gY2FsZW5kYXJzLmdldChleGlzdGluZ0V2ZW50Ll9vd25lckdyb3VwKSA/PyBudWxsXG5cdGlmIChjYWxlbmRhckluZm9Gb3JFdmVudCA9PSBudWxsIHx8IGNhbGVuZGFySW5mb0ZvckV2ZW50LmlzRXh0ZXJuYWwpIHtcblx0XHQvLyBldmVudCBoYXMgYW4gb3duZXJncm91cCwgYnV0IGl0J3Mgbm90IGluIG9uZSBvZiBvdXIgY2FsZW5kYXJzLiB0aGlzIG1pZ2h0IGFjdHVhbGx5IGJlIGFuIGVycm9yLlxuXHRcdHJldHVybiBFdmVudFR5cGUuU0hBUkVEX1JPXG5cdH1cblxuXHQvKipcblx0ICogaWYgdGhlIGV2ZW50IGhhcyBhIF9vd25lckdyb3VwLCBpdCBtZWFucyB0aGVyZSBpcyBhIGNhbGVuZGFyIHNldCB0byBpdFxuXHQgKiBzbywgaWYgdGhlIHVzZXIgaXMgdGhlIG93bmVyIG9mIHNhaWQgY2FsZW5kYXIgdGhleSBhcmUgZnJlZSB0byBtYW5hZ2UgdGhlIGV2ZW50IGhvd2V2ZXIgdGhleSB3YW50XG5cdCAqKi9cblx0aWYgKChpc09yZ2FuaXplciB8fCBleGlzdGluZ09yZ2FuaXplciA9PT0gbnVsbCkgJiYgY2FsZW5kYXJJbmZvRm9yRXZlbnQudXNlcklzT3duZXIpIHtcblx0XHRyZXR1cm4gRXZlbnRUeXBlLk9XTlxuXHR9XG5cblx0aWYgKGNhbGVuZGFySW5mb0ZvckV2ZW50LnNoYXJlZCkge1xuXHRcdGNvbnN0IGNhbldyaXRlID0gaGFzQ2FwYWJpbGl0eU9uR3JvdXAodXNlciwgY2FsZW5kYXJJbmZvRm9yRXZlbnQuZ3JvdXAsIFNoYXJlQ2FwYWJpbGl0eS5Xcml0ZSlcblx0XHRpZiAoY2FuV3JpdGUpIHtcblx0XHRcdGNvbnN0IG9yZ2FuaXplckFkZHJlc3MgPSBjbGVhbk1haWxBZGRyZXNzKGV4aXN0aW5nT3JnYW5pemVyPy5hZGRyZXNzID8/IFwiXCIpXG5cdFx0XHRjb25zdCB3b3VsZFJlcXVpcmVVcGRhdGVzOiBib29sZWFuID1cblx0XHRcdFx0ZXhpc3RpbmdFdmVudC5hdHRlbmRlZXMgIT0gbnVsbCAmJiBleGlzdGluZ0V2ZW50LmF0dGVuZGVlcy5zb21lKChhKSA9PiBjbGVhbk1haWxBZGRyZXNzKGEuYWRkcmVzcy5hZGRyZXNzKSAhPT0gb3JnYW5pemVyQWRkcmVzcylcblx0XHRcdHJldHVybiB3b3VsZFJlcXVpcmVVcGRhdGVzID8gRXZlbnRUeXBlLkxPQ0tFRCA6IEV2ZW50VHlwZS5TSEFSRURfUldcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIEV2ZW50VHlwZS5TSEFSRURfUk9cblx0XHR9XG5cdH1cblxuXHQvL0ZvciBhbiBldmVudCBpbiBhIHBlcnNvbmFsIGNhbGVuZGFyIHRoZXJlIGFyZSAzIG9wdGlvbnNcblx0aWYgKGV4aXN0aW5nT3JnYW5pemVyID09IG51bGwgfHwgZXhpc3RpbmdFdmVudC5hdHRlbmRlZXM/Lmxlbmd0aCA9PT0gMCB8fCBpc09yZ2FuaXplcikge1xuXHRcdC8vIDEuIHdlIGFyZSB0aGUgb3JnYW5pemVyIG9mIHRoZSBldmVudCBvciB0aGUgZXZlbnQgZG9lcyBub3QgaGF2ZSBhbiBvcmdhbml6ZXIgeWV0XG5cdFx0Ly8gMi4gd2UgYXJlIG5vdCB0aGUgb3JnYW5pemVyIGFuZCB0aGUgZXZlbnQgZG9lcyBub3QgaGF2ZSBndWVzdHMuIGl0IHdhcyBjcmVhdGVkIGJ5IHNvbWVvbmUgd2Ugc2hhcmVkIG91ciBjYWxlbmRhciB3aXRoIChhbHNvIGNvbnNpZGVyZWQgb3VyIG93biBldmVudClcblx0XHRyZXR1cm4gRXZlbnRUeXBlLk9XTlxuXHR9IGVsc2Uge1xuXHRcdC8vIDMuIHRoZSBldmVudCBpcyBhbiBpbnZpdGF0aW9uIHRoYXQgaGFzIGFub3RoZXIgb3JnYW5pemVyIGFuZC9vciBhdHRlbmRlZXMuXG5cdFx0cmV0dXJuIEV2ZW50VHlwZS5JTlZJVEVcblx0fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2hvdWxkRGlzcGxheUV2ZW50KGU6IENhbGVuZGFyRXZlbnQsIGhpZGRlbkNhbGVuZGFyczogUmVhZG9ubHlTZXQ8SWQ+KTogYm9vbGVhbiB7XG5cdHJldHVybiAhaGlkZGVuQ2FsZW5kYXJzLmhhcyhhc3NlcnROb3ROdWxsKGUuX293bmVyR3JvdXAsIFwiZXZlbnQgd2l0aG91dCBvd25lckdyb3VwIGluIGdldEV2ZW50c09uRGF5c1wiKSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRheXNIYXZlRXZlbnRzKGV2ZW50c09uRGF5czogRXZlbnRzT25EYXlzKTogYm9vbGVhbiB7XG5cdHJldHVybiBldmVudHNPbkRheXMuc2hvcnRFdmVudHNQZXJEYXkuc29tZShpc05vdEVtcHR5KSB8fCBpc05vdEVtcHR5KGV2ZW50c09uRGF5cy5sb25nRXZlbnRzKVxufVxuXG4vKipcbiAqIEEgaGFuZGxlciBmb3IgYG9ud2hlZWxgIHRvIG1vdmUgdG8gYSBmb3J3YXJkcyBvciBwcmV2aW91cyB2aWV3IGJhc2VkIG9uIG1vdXNlIHdoZWVsIG1vdmVtZW50XG4gKiBAcmV0dXJucyBhIGZ1bmN0aW9uIHRvIGJlIHVzZWQgYnkgYG9ud2hlZWxgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGFuZ2VQZXJpb2RPbldoZWVsKGNhbGxiYWNrOiAoaXNOZXh0OiBib29sZWFuKSA9PiB1bmtub3duKTogKGV2ZW50OiBXaGVlbEV2ZW50KSA9PiB2b2lkIHtcblx0cmV0dXJuIChldmVudDogV2hlZWxFdmVudCkgPT4ge1xuXHRcdC8vIEdvIHRvIHRoZSBuZXh0IHBlcmlvZCBpZiBzY3JvbGxpbmcgZG93biBvciByaWdodFxuXHRcdGNhbGxiYWNrKGV2ZW50LmRlbHRhWSA+IDAgfHwgZXZlbnQuZGVsdGFYID4gMClcblx0fVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2hvd0RlbGV0ZVBvcHVwKG1vZGVsOiBDYWxlbmRhckV2ZW50UHJldmlld1ZpZXdNb2RlbCwgZXY6IE1vdXNlRXZlbnQsIHJlY2VpdmVyOiBIVE1MRWxlbWVudCwgb25DbG9zZT86ICgpID0+IHVua25vd24pIHtcblx0aWYgKGF3YWl0IG1vZGVsLmlzUmVwZWF0aW5nRm9yRGVsZXRpbmcoKSkge1xuXHRcdGNyZWF0ZUFzeW5jRHJvcGRvd24oe1xuXHRcdFx0bGF6eUJ1dHRvbnM6ICgpID0+XG5cdFx0XHRcdFByb21pc2UucmVzb2x2ZShbXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0bGFiZWw6IFwiZGVsZXRlU2luZ2xlRXZlbnRSZWN1cnJlbmNlX2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0Y2xpY2s6IGFzeW5jICgpID0+IHtcblx0XHRcdFx0XHRcdFx0YXdhaXQgbW9kZWwuZGVsZXRlU2luZ2xlKClcblx0XHRcdFx0XHRcdFx0b25DbG9zZT8uKClcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRsYWJlbDogXCJkZWxldGVBbGxFdmVudFJlY3VycmVuY2VfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRjbGljazogKCkgPT4gY29uZmlybURlbGV0ZUNsb3NlKG1vZGVsLCBvbkNsb3NlKSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRdKSxcblx0XHRcdHdpZHRoOiAzMDAsXG5cdFx0fSkoZXYsIHJlY2VpdmVyKVxuXHR9IGVsc2Uge1xuXHRcdC8vIG5vaW5zcGVjdGlvbiBKU0lnbm9yZWRQcm9taXNlRnJvbUNhbGxcblx0XHRjb25maXJtRGVsZXRlQ2xvc2UobW9kZWwsIG9uQ2xvc2UpXG5cdH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gY29uZmlybURlbGV0ZUNsb3NlKG1vZGVsOiBDYWxlbmRhckV2ZW50UHJldmlld1ZpZXdNb2RlbCwgb25DbG9zZT86ICgpID0+IHVua25vd24pOiBQcm9taXNlPHZvaWQ+IHtcblx0aWYgKCEoYXdhaXQgRGlhbG9nLmNvbmZpcm0oXCJkZWxldGVFdmVudENvbmZpcm1hdGlvbl9tc2dcIikpKSByZXR1cm5cblx0YXdhaXQgbW9kZWwuZGVsZXRlQWxsKClcblx0b25DbG9zZT8uKClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldERpc3BsYXlFdmVudFRpdGxlKHRpdGxlOiBzdHJpbmcpOiBzdHJpbmcge1xuXHRyZXR1cm4gdGl0bGUgPz8gdGl0bGUgIT09IFwiXCIgPyB0aXRsZSA6IGxhbmcuZ2V0KFwibm9UaXRsZV9sYWJlbFwiKVxufVxuXG5leHBvcnQgdHlwZSBDb2xvclN0cmluZyA9IHN0cmluZ1xuXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVSYW5kb21Db2xvcigpOiBDb2xvclN0cmluZyB7XG5cdGNvbnN0IG1vZGVsID0gbmV3IENvbG9yUGlja2VyTW9kZWwoIWlzQ29sb3JMaWdodCh0aGVtZS5jb250ZW50X2JnKSlcblx0cmV0dXJuIGhzbFRvSGV4KG1vZGVsLmdldENvbG9yKE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIE1BWF9IVUVfQU5HTEUpLCAyKSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlckNhbGVuZGFyQ29sb3Ioc2VsZWN0ZWRDYWxlbmRhcjogQ2FsZW5kYXJJbmZvIHwgbnVsbCwgZ3JvdXBDb2xvcnM6IE1hcDxJZCwgc3RyaW5nPikge1xuXHRjb25zdCBjb2xvciA9IHNlbGVjdGVkQ2FsZW5kYXIgPyBncm91cENvbG9ycy5nZXQoc2VsZWN0ZWRDYWxlbmRhci5ncm91cEluZm8uZ3JvdXApID8/IGRlZmF1bHRDYWxlbmRhckNvbG9yIDogbnVsbFxuXHRyZXR1cm4gbShcIi5tdC14c1wiLCB7XG5cdFx0c3R5bGU6IHtcblx0XHRcdHdpZHRoOiBcIjEwMHB4XCIsXG5cdFx0XHRoZWlnaHQ6IFwiMTBweFwiLFxuXHRcdFx0YmFja2dyb3VuZDogY29sb3IgPyBcIiNcIiArIGNvbG9y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