import {
	CalendarEvent,
	CalendarEventAttendee,
	Contact,
	createCalendarEventAttendee,
	createEncryptedMailAddress,
	EncryptedMailAddress,
	GroupSettings,
	Mail,
} from "../../../../common/api/entities/tutanota/TypeRefs.js"
import { PartialRecipient, Recipient, RecipientType } from "../../../../common/api/common/recipients/Recipient.js"
import { haveSameId, Stripped } from "../../../../common/api/common/utils/EntityUtils.js"
import { cleanMailAddress, findRecipientWithAddress } from "../../../../common/api/common/utils/CommonCalendarUtils.js"
import { assertNotNull, clone, defer, DeferredObject, findAll, lazy, noOp, trisectingDiff } from "@tutao/tutanota-utils"
import { CalendarAttendeeStatus, ConversationType, ShareCapability } from "../../../../common/api/common/TutanotaConstants.js"
import { RecipientsModel, ResolveMode } from "../../../../common/api/main/RecipientsModel.js"
import { Guest } from "../../view/CalendarInvites.js"
import { isSecurePassword } from "../../../../common/misc/passwords/PasswordUtils.js"
import { SendMailModel } from "../../../../common/mailFunctionality/SendMailModel.js"
import { CalendarInfo } from "../../model/CalendarModel.js"
import { hasCapabilityOnGroup } from "../../../../common/sharing/GroupUtils.js"
import { UserController } from "../../../../common/api/main/UserController.js"
import { UserError } from "../../../../common/api/main/UserError.js"
import { CalendarOperation, EventType } from "./CalendarEventModel.js"
import { ProgrammingError } from "../../../../common/api/common/error/ProgrammingError.js"
import { CalendarNotificationSendModels } from "./CalendarNotificationModel.js"
import { getContactDisplayName } from "../../../../common/contactsFunctionality/ContactUtils.js"
import { RecipientField } from "../../../../common/mailFunctionality/SharedMailUtils.js"
import { hasSourceUrl } from "../../../../common/calendar/import/ImportExportUtils.js"

/** there is no point in returning recipients, the SendMailModel will re-resolve them anyway. */
type AttendanceModelResult = {
	attendees: CalendarEvent["attendees"]
	organizer: CalendarEvent["organizer"]
	isConfidential: boolean
	/** which calendar should the result be assigned to */
	calendar: CalendarInfo
} & CalendarNotificationSendModels

/** model to decouple attendee list edit operations from other changes to a calendar event.
 * tracks external passwords, attendance status, list of attendees, recipients to invite,
 * update, cancel and the calendar the event is in.
 */
export class CalendarEventWhoModel {
	/** we need to resolve recipients to know if we need to show an external password field. */
	private readonly resolvedRecipients: Map<string, Recipient> = new Map()
	private pendingRecipients: number = 0
	private _recipientsSettled: DeferredObject<void> = defer()
	/** it's possible that the consumer cares about all the recipient information being resolved, but that's only possible in an async way. */
	get recipientsSettled(): Promise<void> {
		return this._recipientsSettled.promise
	}

	/** external password for an external attendee with an address */
	private readonly externalPasswords: Map<string, string> = new Map()

	/** to know who to update, we need to know who was already on the guest list.
	 * we keep the attendees in maps for deduplication, keyed by their address.
	 * */
	private initialAttendees: Map<string, CalendarEventAttendee> = new Map()
	private initialOwnAttendeeStatus: CalendarAttendeeStatus | null = null
	/** we only show the send update checkbox if there are attendees that require updates from us. */
	readonly initiallyHadOtherAttendees: boolean
	/** the current list of attendees. */
	private _attendees: Map<string, CalendarEventAttendee> = new Map()
	/** organizer MUST be set if _ownAttendee is - we're either both, we're invited and someone else is organizer or there are no guests at all. */
	private _organizer: CalendarEventAttendee | null = null
	/** the attendee that has one of our mail addresses. MUST NOT be in _attendees */
	private _ownAttendee: CalendarEventAttendee | null = null

	public isConfidential: boolean
	/**
	 * whether this user will send updates for this event.
	 * * this needs to be our event.
	 * * we need a paid account
	 * * there need to be changes that require updating the attendees (eg alarms do not)
	 * * there also need to be attendees that require updates/invites/cancellations/response
	 */
	shouldSendUpdates: boolean = false

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
	constructor(
		initialValues: Partial<Stripped<CalendarEvent>>,
		private readonly eventType: EventType,
		private readonly operation: CalendarOperation,
		private readonly calendars: ReadonlyMap<Id, CalendarInfo>,
		/** this should only be relevant to saving so could be put in the apply strategy, but at the moment we restrict attendees depending on the
		 * calendar we're saving to.
		 * think of it as configuring who has access to the event.
		 * */
		private _selectedCalendar: CalendarInfo,
		private readonly userController: UserController,
		private readonly isNew: boolean,
		private readonly ownMailAddresses: ReadonlyArray<EncryptedMailAddress>,
		private readonly recipientsModel: RecipientsModel,
		private readonly responseTo: Mail | null,
		private readonly passwordStrengthModel: (password: string, recipientInfo: PartialRecipient) => number,
		private readonly sendMailModelFactory: lazy<SendMailModel>,
		private readonly uiUpdateCallback: () => void = noOp,
	) {
		this.setupAttendees(initialValues)
		// resolve current recipients so that we know what external passwords to display
		const resolvePromises = initialValues.attendees?.map((a) => this.resolveAndCacheAddress(a.address)).concat() ?? []
		if (initialValues.organizer) {
			resolvePromises.push(this.resolveAndCacheAddress(initialValues.organizer))
		}
		Promise.all(resolvePromises).then(this.uiUpdateCallback)

		this.initiallyHadOtherAttendees = this.hasNotifyableOtherAttendees()
		this.isConfidential = initialValues.invitedConfidentially ?? false
	}

	set selectedCalendar(v: CalendarInfo) {
		/**
		 * when changing the calendar of an event, if the user is the organiser
		 * they can link any of their owned calendars(private or shared) to said event
		 * even if the event has guests
		 **/
		if (!v.userIsOwner && v.shared && this._attendees.size > 0) {
			throw new ProgrammingError("tried to select shared calendar while there are guests.")
		} else if (!v.userIsOwner && v.shared && this.isNew && this._organizer != null) {
			// for new events, it's possible to have an organizer but no attendees if you only add yourself.
			this._organizer = null
		}
		this._selectedCalendar = v
		this.uiUpdateCallback()
	}

	get selectedCalendar(): CalendarInfo {
		return this._selectedCalendar
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
	get canModifyGuests(): boolean {
		/**
		 * if the user is the event's organiser and the owner of its linked calendar, the user can modify the guests freely
		 **/
		const userIsOwner = this.eventType === EventType.OWN && this.selectedCalendar.userIsOwner
		return userIsOwner || !(this.selectedCalendar?.shared || this.eventType === EventType.INVITE || this.operation === CalendarOperation.EditThis)
	}

	/**
	 * filter the calendars an event can be saved to depending on the event type, attendee status and edit operation.
	 * Prevent moving the event to another calendar if you only have read permission or if the event has attendees.
	 * */
	getAvailableCalendars(): ReadonlyArray<CalendarInfo> {
		const { groupSettings } = this.userController.userSettingsGroupRoot
		const calendarArray = Array.from(this.calendars.values()).filter((cal) => !this.isExternalCalendar(groupSettings, cal.group._id))

		if (this.eventType === EventType.LOCKED || this.operation === CalendarOperation.EditThis) {
			return [this.selectedCalendar]
		} else if (this.isNew && this._attendees.size > 0) {
			// if we added guests, we cannot select a shared calendar to create the event.
			/**
			 * when changing the calendar of an event, if the user is the organiser
			 * they can link any of their owned calendars(private or shared) to said event
			 * even if the event has guests
			 **/
			return calendarArray.filter((calendarInfo) => calendarInfo.userIsOwner || !calendarInfo.shared)
		} else if (this._attendees.size > 0 && this.eventType === EventType.OWN) {
			return calendarArray.filter((calendarInfo) => calendarInfo.userIsOwner)
		} else if (this._attendees.size > 0 || this.eventType === EventType.INVITE) {
			// We don't allow inviting in a shared calendar.
			// If we have attendees, we cannot select a shared calendar.
			// We also don't allow accepting invites into shared calendars.
			return calendarArray.filter((calendarInfo) => !calendarInfo.shared || haveSameId(calendarInfo.group, this.selectedCalendar.group))
		} else {
			return calendarArray.filter((calendarInfo) => hasCapabilityOnGroup(this.userController.user, calendarInfo.group, ShareCapability.Write))
		}
	}

	private isExternalCalendar(groupSettings: GroupSettings[], groupId: Id) {
		const existingGroupSettings = groupSettings.find((gc) => gc.group === groupId)
		return hasSourceUrl(existingGroupSettings)
	}

	private async resolveAndCacheAddress(a: PartialRecipient): Promise<void> {
		if (this.resolvedRecipients.has(a.address)) return
		this.pendingRecipients = this.pendingRecipients + 1
		const recipient = await this.recipientsModel.resolve(a, ResolveMode.Eager).resolved()
		this.cacheRecipient(recipient)
		this.pendingRecipients = this.pendingRecipients - 1
		if (this.pendingRecipients === 0) {
			this._recipientsSettled.resolve()
			this._recipientsSettled = defer()
		}
	}

	private cacheRecipient(recipient: Recipient): void {
		this.resolvedRecipients.set(recipient.address, recipient)
		if (recipient.type !== RecipientType.EXTERNAL) return
		this.externalPasswords.set(recipient.address, recipient.contact?.presharedPassword ?? "")
		if (recipient.contact != null && this._attendees.has(recipient.address)) {
			const attendee = this._attendees.get(recipient.address)!
			attendee.address.name = getContactDisplayName(recipient.contact)
		}
	}

	/**
	 * internally, we want to keep ourselves and the organizer separate from the other attendees
	 */
	private setupAttendees(initialValues: Partial<Stripped<CalendarEvent>>) {
		const ownAddresses = this.ownMailAddresses.map((a) => cleanMailAddress(a.address))

		// convert the list of attendees into a map for easier use.
		for (const a of initialValues.attendees ?? []) {
			const attendee = createCalendarEventAttendee({
				status: a.status,
				address: createEncryptedMailAddress({
					name: a.address.name,
					address: cleanMailAddress(a.address.address),
				}),
			})
			// we will remove own attendees + organizer later.
			this.initialAttendees.set(attendee.address.address, attendee)
		}

		// get the organizer out of the attendees and into a separate field
		const initialOrganizerAddress =
			initialValues.organizer == null
				? null
				: createEncryptedMailAddress({
						address: cleanMailAddress(initialValues.organizer.address),
						name: initialValues.organizer.name,
				  })

		if (initialOrganizerAddress != null) {
			// check if the organizer is also in the attendees array and remove them if so
			const organizerAttendee = this.initialAttendees.get(initialOrganizerAddress.address)
			this._organizer =
				organizerAttendee ??
				createCalendarEventAttendee({
					address: initialOrganizerAddress,
					// the organizer added themselves, but did not specify if they're participating
					status: CalendarAttendeeStatus.NEEDS_ACTION,
				})
			this.initialAttendees.delete(this._organizer.address.address)
		}

		// we don't want ourselves in the attendee list, since we're using it to track updates we need to send.
		const ownAttendeeAddresses = findAll(Array.from(this.initialAttendees.keys()), (address) => ownAddresses.includes(address))
		this._ownAttendee = this.initialAttendees.get(ownAttendeeAddresses[0]) ?? null
		this.initialOwnAttendeeStatus = (this._ownAttendee?.status as CalendarAttendeeStatus) ?? null
		for (const match of ownAttendeeAddresses) {
			this.initialAttendees.delete(match)
		}

		// set up the attendees map that tracks the actual changes
		for (const [initialAttendeeAddress, initialAttendee] of this.initialAttendees.entries()) {
			this._attendees.set(initialAttendeeAddress, clone(initialAttendee))
		}

		// we now have cleaned versions of organizer, ownAttendee and other attendees in separate fields.
		// now the sanity checks.

		if (this._organizer != null && this._attendees.size === 0 && this._ownAttendee == null) {
			// if there are no attendees besides the organizer, the organizer must not be specified.
			this._organizer = null
		}

		if (
			this.eventType === EventType.OWN &&
			this._organizer != null &&
			!ownAddresses.includes(this._organizer.address.address) &&
			Array.from(this._attendees.values()).some((a) => a.status !== CalendarAttendeeStatus.ADDED)
		) {
			// this is technically an invalid state now that should not happen with new events.
			// we previously assigned the event creator (which might not be the calendar owner) to the organizer field,
			// even when there were no attendees.
			console.warn("got an event with attendees and an organizer that's not the owner of the calendar, replacing organizer.")
			this._attendees.set(this._organizer.address.address, this._organizer)
			this._organizer =
				this._ownAttendee ??
				createCalendarEventAttendee({
					address: createEncryptedMailAddress({
						address: ownAddresses[0],
						name: "",
					}),
					status: CalendarAttendeeStatus.ACCEPTED,
				})
		}

		if (
			this._organizer &&
			ownAddresses.includes(this._organizer.address.address) &&
			this._organizer.address.address !== this._ownAttendee?.address.address
		) {
			// if we're the organizer, ownAttendee should be the same. we don't modify organizer here because someone might already have sent invites.
			this._ownAttendee = this._organizer
		}
	}

	/**
	 * figure out if there are currently other people that might need to be notified if this event is modified.
	 * attendees that were just added and not invited yet are ignored for this.
	 * @private
	 */
	private hasNotifyableOtherAttendees() {
		return (
			// if the event is new we can do what we want (no attendee was notified yet)
			!this.isNew &&
			// if the event is not new, but the attendee list did not have any attendees that were already notified,
			// there are no attendees that are not either us or the organizer
			Array.from(this.initialAttendees.values()).some((a) => a.status !== CalendarAttendeeStatus.ADDED)
		)
	}

	/*
	 * return a list of mail addresses that we can set as an organizer.
	 */
	get possibleOrganizers(): ReadonlyArray<EncryptedMailAddress> {
		if (this.eventType !== EventType.OWN) {
			return this._organizer ? [this._organizer.address] : []
		} else if (!this.hasNotifyableOtherAttendees()) {
			// if we have no attendees that require an update, we can use whatever address
			return this.ownMailAddresses
		} else if (this._organizer != null && this.ownGuest?.address === this._organizer?.address.address) {
			// if there are other attendees and we have an organizer that's us, we must use that organizer
			// because changing the organizer address after the attendees were invited is suboptimal.
			return [this._organizer.address]
		} else {
			// something is wrong.
			throw new ProgrammingError("could not figure out which addresses are a valid organizer for this event.")
		}
	}

	/**
	 * get our own guest, if any
	 */
	get ownGuest(): Guest | null {
		return this._ownAttendee && this.getGuestForAttendee(this._ownAttendee)
	}

	/**
	 * get the current organizer of the event
	 *
	 * there is no setter - if we're changing attendees, we're ensured to be the organizer.
	 */
	get organizer(): Guest | null {
		return this._organizer && this.getGuestForAttendee(this._organizer)
	}

	/**
	 * a list of the attendees of the event that are not the organizer or ourselves, with their status and type
	 */
	get guests(): ReadonlyArray<Guest> {
		return Array.from(this._attendees.values()).map((a) => this.getGuestForAttendee(a))
	}

	private getGuestForAttendee(a: CalendarEventAttendee): Guest {
		if (this.resolvedRecipients.has(a.address.address)) {
			const recipient: Recipient = this.resolvedRecipients.get(a.address.address)!
			return {
				...recipient,
				status: a.status as CalendarAttendeeStatus,
			}
		} else {
			// this is a temporary situation, an attendee that is set in this model
			// will be resolved sometime after it was added.
			return {
				address: a.address.address,
				name: a.address.name,
				status: a.status as CalendarAttendeeStatus,
				type: RecipientType.UNKNOWN,
				contact: null,
			}
		}
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
	addAttendee(address: string, contact: Contact | null = null): void {
		if (!this.canModifyGuests) {
			throw new UserError(() => "cannotAddAttendees_msg")
		}
		const cleanAddress = cleanMailAddress(address)
		// We don't add an attendee if they are already an attendee
		if (this._attendees.has(cleanAddress) || this._organizer?.address.address === cleanAddress || this._ownAttendee?.address.address === cleanAddress) {
			return
		}

		const ownAttendee = findRecipientWithAddress(this.ownMailAddresses, cleanAddress)
		if (ownAttendee != null) {
			this.addOwnAttendee(ownAttendee)
		} else {
			const name = contact != null ? getContactDisplayName(contact) : ""
			this.addOtherAttendee(createEncryptedMailAddress({ address: cleanAddress, name }))
		}
	}

	/**
	 * this is a no-op if there are already
	 * @param address MUST be one of ours and MUST NOT be in the attendees array or set on _organizer
	 * @private
	 */
	private addOwnAttendee(address: EncryptedMailAddress): void {
		if (this.hasNotifyableOtherAttendees()) {
			console.log("can't change organizer if there are other invitees already")
			return
		}
		const attendeeToAdd = createCalendarEventAttendee({ address, status: CalendarAttendeeStatus.ACCEPTED })
		this._ownAttendee = attendeeToAdd

		// make sure that the organizer on the event is the same address as we added as an own attendee.
		this._organizer = attendeeToAdd
		if (!this.resolvedRecipients.has(address.address)) {
			this.resolveAndCacheAddress(address).then(this.uiUpdateCallback)
		}
		this.uiUpdateCallback()
	}

	/**
	 *
	 * @param address must NOT be one of ours.
	 * @private
	 */
	private addOtherAttendee(address: EncryptedMailAddress) {
		if (this._ownAttendee == null) {
			// we're adding someone that's not us while we're not an attendee,
			// so we add ourselves as an attendee and as organizer.
			this.addOwnAttendee(this.ownMailAddresses[0])
		}

		address.address = cleanMailAddress(address.address)
		const previousAttendee = this.initialAttendees.get(address.address)

		//  we now know that this address is not in the list and that it's also
		//  not us under another address that's already added, so we can just add it.
		//  we reuse the entry from the initial attendees in case we already had this attendee at the start
		if (previousAttendee != null) {
			this._attendees.set(address.address, previousAttendee)
		} else {
			this._attendees.set(address.address, createCalendarEventAttendee({ address, status: CalendarAttendeeStatus.ADDED }))
		}
		if (!this.resolvedRecipients.has(address.address)) {
			this.resolveAndCacheAddress(address).then(this.uiUpdateCallback)
		}
		this.uiUpdateCallback()
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
	removeAttendee(address: string) {
		const cleanRemoveAddress = cleanMailAddress(address)
		if (this._organizer?.address.address === cleanRemoveAddress) {
			if (this._attendees.size > 0) {
				console.log("tried to remove organizer while there are other attendees, ignoring.")
				return
			} else {
				this._organizer = null
				// we must be the organizer since we're removing guests.
				this._ownAttendee = null

				this.uiUpdateCallback()
			}
		} else {
			if (this._attendees.has(cleanRemoveAddress)) {
				this._attendees.delete(cleanRemoveAddress)
				if (this._attendees.size === 0) {
					this._organizer = null
					// we must be the organizer since we're removing guests.
					this._ownAttendee = null
				}
				this.uiUpdateCallback()
			}
		}
	}

	/**
	 * modify your own attendance to the selected value.
	 * is a no-op if we're not actually an attendee
	 * @param status
	 */
	setOwnAttendance(status: CalendarAttendeeStatus) {
		this._ownAttendee && (this._ownAttendee.status = status)
	}

	setPresharedPassword(address: string, password: string) {
		this.externalPasswords.set(address, password)
	}

	/** for a stored address, get the preshared password and an indicator value for its strength */
	getPresharedPassword(address: string): { password: string; strength: number } {
		const password = this.externalPasswords.get(address) ?? ""
		const recipient = this.resolvedRecipients.get(address)
		const strength = recipient != null ? this.passwordStrengthModel(password, recipient) : 0
		return { password, strength }
	}

	/**
	 * return whether any of the attendees have a password set that warrants asking the user if they really want to use it.
	 *
	 * ignores empty passwords since those are always a hard fail when sending external mail.
	 */
	hasInsecurePasswords(): boolean {
		if (!this.isConfidential) {
			return false
		}
		for (const g of this._attendees.values()) {
			const { password, strength } = this.getPresharedPassword(g.address.address)
			if (password === "" || isSecurePassword(strength)) continue
			return true
		}

		return false
	}

	private prepareSendModel(attendees: ReadonlyArray<CalendarEventAttendee>): SendMailModel | null {
		if (!this._ownAttendee) return null
		const recipients = attendees.map(({ address }) => address)
		const model = this.sendMailModelFactory()
		// do not pass recipients in template arguments as recipient checks in sendMailModel are done in sync part of send
		model.initWithTemplate([], "", "")

		for (const recipient of recipients) {
			model.addRecipient(RecipientField.BCC, recipient)
			// Only set the password if we have an entry.
			// The recipients might not be resolved at this point yet, so we shouldn't set the password on the model unless we have one for sure.
			// SendMailModel will anyway resolve the recipients, but it won't detect the right password if it's already pre-filled by us.
			if (this.externalPasswords.has(recipient.address)) {
				const password = assertNotNull(this.externalPasswords.get(recipient.address))
				model.setPassword(recipient.address, password)
			}
		}
		model.setSender(this._ownAttendee.address.address)
		model.setConfidential(this.isConfidential)
		return model
	}

	private prepareResponseModel(): SendMailModel | null {
		if (this.eventType !== EventType.INVITE || this._ownAttendee === null || this._organizer == null || this._ownAttendee == null) {
			// not checking for initialAttendees.size === 0 because we and the organizer might be the only attendees, which do not show
			// up there.
			return null
		}

		const initialOwnAttendeeStatus = assertNotNull(
			this.initialOwnAttendeeStatus,
			"somehow managed to become an attendee on an invite we weren't invited to before",
		)

		if (!(initialOwnAttendeeStatus !== this._ownAttendee.status && this._ownAttendee.status !== CalendarAttendeeStatus.NEEDS_ACTION)) {
			// either our status did not actually change or our new status is "NEEDS_ACTION"
			return null
		}

		const responseModel: SendMailModel = this.sendMailModelFactory()

		if (this.responseTo != null) {
			// do not pass recipients in template arguments as recipient checks in sendMailModel are done in sync part of send
			responseModel.initAsResponse(
				{
					previousMail: this.responseTo,
					conversationType: ConversationType.REPLY,
					senderMailAddress: this._ownAttendee.address.address,
					recipients: [],
					attachments: [],
					bodyText: "",
					subject: "",
					replyTos: [],
				},
				new Map(),
			)
		} else {
			// do not pass recipients in template arguments as recipient checks in sendMailModel are done in sync part of send
			responseModel.initWithTemplate({}, "", "")
		}
		responseModel.addRecipient(RecipientField.TO, this._organizer.address)

		return responseModel
	}

	get result(): AttendanceModelResult {
		if (this._selectedCalendar == null) {
			throw new UserError("noCalendar_msg")
		}

		const isOrganizer = this._organizer != null && this._ownAttendee?.address.address === this._organizer.address.address

		const {
			kept: attendeesToUpdate,
			deleted: attendeesToCancel,
			added: attendeesToInvite,
		} = getRecipientLists(this.initialAttendees, this._attendees, isOrganizer, this.isNew)

		const { allAttendees, organizerToPublish } = assembleAttendees(attendeesToInvite, attendeesToUpdate, this._organizer, this._ownAttendee)

		return {
			attendees: allAttendees,
			organizer: organizerToPublish,
			isConfidential: this.isConfidential,
			cancelModel: isOrganizer && attendeesToCancel.length > 0 ? this.prepareSendModel(attendeesToCancel) : null,
			inviteModel: isOrganizer && attendeesToInvite.length > 0 ? this.prepareSendModel(attendeesToInvite) : null,
			updateModel: isOrganizer && attendeesToUpdate.length > 0 && this.shouldSendUpdates ? this.prepareSendModel(attendeesToUpdate) : null,
			responseModel: !isOrganizer && organizerToPublish != null ? this.prepareResponseModel() : null,
			calendar: this._selectedCalendar,
		}
	}
}

function getRecipientLists(
	initialAttendees: ReadonlyMap<unknown, CalendarEventAttendee>,
	currentAttendees: ReadonlyMap<unknown, CalendarEventAttendee>,
	isOrganizer: boolean,
	isNew: boolean,
): ReturnType<typeof trisectingDiff<CalendarEventAttendee>> {
	if (!isOrganizer) {
		// if we're not the organizer, we can't have changed the guest list.
		return { added: [], deleted: [], kept: Array.from(initialAttendees.values()) }
	} else if (isNew) {
		// a new event will always have everyone on the guest list have to be invited.
		return { added: Array.from(currentAttendees.values()), deleted: [], kept: [] }
	} else {
		// in this case, the guest list may have changed arbitrarily
		return trisectingDiff(initialAttendees, currentAttendees)
	}
}

/** get the list of attendees and the organizer address to publish.
 * the array contains the organizer as an attendee.
 *
 * if there's only an organizer but no other attendees, no attendees or organizers are returned.
 * */
function assembleAttendees(
	attendeesToInvite: ReadonlyArray<CalendarEventAttendee>,
	attendeesToUpdate: ReadonlyArray<CalendarEventAttendee>,
	organizer: CalendarEventAttendee | null,
	ownAttendee: CalendarEventAttendee | null,
): {
	allAttendees: Array<CalendarEventAttendee>
	organizerToPublish: EncryptedMailAddress | null
} {
	if (
		organizer == null ||
		(attendeesToInvite.length + attendeesToUpdate.length === 0 && (ownAttendee == null || ownAttendee.address.address === organizer?.address.address))
	) {
		// there's no attendees besides the organizer (which may be us) or there's no organizer at all.
		return { allAttendees: [], organizerToPublish: null }
	}
	const allAttendees: Array<CalendarEventAttendee> = []
	if (organizer.address.address !== ownAttendee?.address.address) {
		allAttendees.push(organizer)
	}
	if (ownAttendee != null) {
		allAttendees.push(ownAttendee)
	}
	allAttendees.push(...attendeesToUpdate)
	allAttendees.push(...attendeesToInvite)

	return {
		allAttendees,
		organizerToPublish: organizer.address,
	}
}
