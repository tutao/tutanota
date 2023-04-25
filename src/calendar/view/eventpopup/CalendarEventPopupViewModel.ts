import { CalendarEvent, CalendarEventAttendee } from "../../../api/entities/tutanota/TypeRefs.js"
import { calendarEventHasMoreThanOneOccurrencesLeft } from "../../date/CalendarUtils.js"
import { CalendarEventModel, EventSaveResult, EventType, getNonOrganizerAttendees } from "../../date/eventeditor/CalendarEventModel.js"
import { NotFoundError } from "../../../api/common/error/RestError.js"
import { CalendarModel } from "../../model/CalendarModel.js"
import { CalendarEventEditMode, showExistingCalendarEventEditDialog } from "../eventeditor/CalendarEventEditDialog.js"
import { ProgrammingError } from "../../../api/common/error/ProgrammingError.js"
import { CalendarAttendeeStatus } from "../../../api/common/TutanotaConstants.js"
import m from "mithril"
import { clone } from "@tutao/tutanota-utils"

/**
 * makes decisions about which operations are available from the popup and knows how to implement them depending on the event's type.
 */
export class CalendarEventPopupViewModel {
	readonly canEdit: boolean
	readonly canDelete: boolean
	readonly canSendUpdates: boolean
	/** for deleting, an event that has only one non-deleted instance behaves as if it wasn't repeating
	 * because deleting the last instance is the same as deleting the whole event from the pov of the user.
	 */
	readonly isRepeatingForDeleting: boolean
	/** for editing, an event that has only one non-deleted instance is still considered repeating
	 * because we might reschedule that instance and then unexclude some deleted instances.
	 */
	readonly isRepeatingForEditing: boolean

	private processing: boolean = false
	private readonly _ownAttendee: CalendarEventAttendee | null

	/**
	 *
	 * @param calendarEvent the event to display in the popup
	 * @param calendarModel the calendar model where the event can be updated/deleted
	 * @param eventType
	 * @param hasBusinessFeature if the current user is allowed to do certain operations.
	 * @param ownAttendee will be cloned to have a copy that's not influencing the actual event but can be changed to quickly update the UI
	 * @param eventModelFactory
	 * @param uiUpdateCallback
	 */
	constructor(
		readonly calendarEvent: Readonly<CalendarEvent>,
		private readonly calendarModel: CalendarModel,
		readonly eventType: EventType,
		private readonly hasBusinessFeature: boolean,
		ownAttendee: CalendarEventAttendee | null,
		private readonly eventModelFactory: (mode: CalendarEventEditMode) => Promise<CalendarEventModel>,
		private readonly uiUpdateCallback: () => void = m.redraw,
	) {
		this._ownAttendee = clone(ownAttendee)
		if (this.calendarEvent._ownerGroup == null) {
			this.canEdit = false
			this.canDelete = false
			this.canSendUpdates = false
		} else {
			// partially editable (adding alarms) counts as editable.
			this.canEdit =
				this.eventType === EventType.OWN ||
				this.eventType === EventType.SHARED_RW ||
				this.eventType === EventType.LOCKED ||
				this.eventType === EventType.INVITE
			this.canDelete = this.canEdit || this.eventType === EventType.INVITE
			this.canSendUpdates = hasBusinessFeature && this.eventType === EventType.OWN && getNonOrganizerAttendees(calendarEvent).length > 0
		}

		// we do not edit single instances yet
		this.isRepeatingForEditing = false // calendarEvent.repeatRule != null
		this.isRepeatingForDeleting = calendarEventHasMoreThanOneOccurrencesLeft(calendarEvent)
	}

	get ownAttendee(): CalendarEventAttendee | null {
		return this._ownAttendee
	}

	async setOwnAttendance(status: CalendarAttendeeStatus): Promise<void> {
		if (this.calendarEvent.organizer == null || this.ownAttendee == null || this.processing || this._ownAttendee?.status === status) return
		const oldStatus = this.ownAttendee.status
		this.processing = true
		try {
			this.ownAttendee.status = status
			this.uiUpdateCallback()
			const model = await this.eventModelFactory(CalendarEventEditMode.All)
			model.editModels.whoModel.setOwnAttendance(status)
			await model.updateExistingEvent()
		} catch (e) {
			this.ownAttendee.status = oldStatus
			throw e
		} finally {
			this.processing = false
		}
	}

	/** add an exclusion for this event instances start time on the original event.
	 * if this is a rescheduled instance, we will just delete the event because the progenitor already
	 * has an exclusion for this time.
	 * */
	async deleteSingle() {
		try {
			// passing "all" because this is actually an update to the progenitor
			const model = await this.eventModelFactory(CalendarEventEditMode.All)
			await model.editModels.whenModel.excludeDate(this.calendarEvent.startTime)
			await model.updateExistingEvent()
		} catch (e) {
			if (!(e instanceof NotFoundError)) {
				throw e
			}
		}
	}

	async deleteAll(): Promise<void> {
		try {
			const model = await this.eventModelFactory(CalendarEventEditMode.All)
			await model.deleteEvent()
		} catch (e) {
			if (!(e instanceof NotFoundError)) {
				throw e
			}
		}
	}

	async editSingle() {
		throw new ProgrammingError("not implemented")
	}

	async editAll() {
		const model = await this.eventModelFactory(CalendarEventEditMode.All)

		try {
			return await showExistingCalendarEventEditDialog(model, {
				uid: this.calendarEvent.uid,
				sequence: this.calendarEvent.sequence,
			})
		} catch (err) {
			if (err instanceof NotFoundError) {
				console.log("calendar event not found when clicking on the event")
			} else {
				throw err
			}
		}
	}

	async sendUpdates(): Promise<EventSaveResult> {
		const model = await this.eventModelFactory(CalendarEventEditMode.All)
		try {
			model.shouldSendUpdates = true
			await model.updateExistingEvent()
			return EventSaveResult.Saved
		} finally {
			model.shouldSendUpdates = false
		}
	}
}
