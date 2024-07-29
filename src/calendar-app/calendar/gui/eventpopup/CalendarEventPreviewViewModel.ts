import { CalendarEvent, CalendarEventAttendee } from "../../../../common/api/entities/tutanota/TypeRefs.js"
import { calendarEventHasMoreThanOneOccurrencesLeft } from "../../../../common/calendar/date/CalendarUtils.js"
import { CalendarEventModel, CalendarOperation, EventSaveResult, EventType, getNonOrganizerAttendees } from "../eventeditor-model/CalendarEventModel.js"
import { NotFoundError } from "../../../../common/api/common/error/RestError.js"
import { CalendarModel } from "../../model/CalendarModel.js"
import { showExistingCalendarEventEditDialog } from "../eventeditor-view/CalendarEventEditDialog.js"
import { ProgrammingError } from "../../../../common/api/common/error/ProgrammingError.js"
import { CalendarAttendeeStatus } from "../../../../common/api/common/TutanotaConstants.js"
import m from "mithril"
import { clone, Thunk } from "@tutao/tutanota-utils"
import { CalendarEventUidIndexEntry } from "../../../../common/api/worker/facades/lazy/CalendarFacade.js"

/**
 * makes decisions about which operations are available from the popup and knows how to implement them depending on the event's type.
 */
export class CalendarEventPreviewViewModel {
	readonly canEdit: boolean
	readonly canDelete: boolean
	readonly canSendUpdates: boolean
	/** for editing, an event that has only one non-deleted instance is still considered repeating
	 * because we might reschedule that instance and then unexclude some deleted instances.
	 *
	 * the ability to edit a single instance also depends on the event type:
	 *    * OWN -> I can do what I want
	 *    * SHARED_RW -> can edit single instance as if it was my own (since single instance editing locks attendees anyway)
	 *    * SHARED_RO, LOCKED, EXTERNAL -> cannot edit at all
	 *    * INVITE -> we're not the organizer, we can only set our own attendance globally and send it back to the organizer.
	 *          probably the best reason to make single-instance attendee editing possible asap.
	 */
	readonly isRepeatingForEditing: boolean

	private sanitizedDescription: string | null = null

	private processing: boolean = false
	private readonly _ownAttendee: CalendarEventAttendee | null

	/**
	 *
	 * @param calendarEvent the event to display in the popup
	 * @param calendarModel the calendar model where the event can be updated/deleted
	 * @param eventType
	 * @param hasBusinessFeature if the current user is allowed to do certain operations.
	 * @param ownAttendee will be cloned to have a copy that's not influencing the actual event but can be changed to quickly update the UI
	 * @param lazyIndexEntry async function to resolve the progenitor of the shown event
	 * @param eventModelFactory
	 * @param uiUpdateCallback
	 */
	constructor(
		readonly calendarEvent: Readonly<CalendarEvent>,
		private readonly calendarModel: CalendarModel,
		readonly eventType: EventType,
		private readonly hasBusinessFeature: boolean,
		ownAttendee: CalendarEventAttendee | null,
		private readonly lazyIndexEntry: () => Promise<CalendarEventUidIndexEntry | null>,
		private readonly eventModelFactory: (mode: CalendarOperation) => Promise<CalendarEventModel | null>,
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

		this.isRepeatingForEditing =
			(calendarEvent.repeatRule != null || calendarEvent.recurrenceId != null) && (eventType === EventType.OWN || eventType === EventType.SHARED_RW)
	}

	/** for deleting, an event that has only one non-deleted instance behaves as if it wasn't repeating
	 * because deleting the last instance is the same as deleting the whole event from the pov of the user.
	 */
	async isRepeatingForDeleting(): Promise<boolean> {
		const index = await this.lazyIndexEntry()
		if (index == null) return false
		return calendarEventHasMoreThanOneOccurrencesLeft(index)
	}

	get ownAttendee(): CalendarEventAttendee | null {
		return this._ownAttendee
	}

	/** return an object enabling us to set and display the participation correctly if this is an event we're invited to, null otherwise.
	 * note that the Promise<unknown> type on setParticipation prevents us from leaking errors when consumers call it and try to catch errors without
	 * awaiting it (they get an async call without await warning) */
	getParticipationSetterAndThen(action: Thunk): null | {
		ownAttendee: CalendarEventAttendee
		setParticipation: (status: CalendarAttendeeStatus) => Promise<unknown>
	} {
		if (this.ownAttendee == null || this.eventType !== EventType.INVITE) return null
		return {
			ownAttendee: this.ownAttendee,
			setParticipation: async (status) => {
				await this.setOwnAttendance(status)
				action()
			},
		}
	}

	private async setOwnAttendance(status: CalendarAttendeeStatus): Promise<void> {
		if (this.calendarEvent.organizer == null || this.ownAttendee == null || this.processing || this._ownAttendee?.status === status) return
		const oldStatus = this.ownAttendee.status
		this.processing = true
		try {
			this.ownAttendee.status = status
			this.uiUpdateCallback()
			// no per-instance attendees yet.
			const model = await this.eventModelFactory(CalendarOperation.EditAll)
			if (model) {
				model.editModels.whoModel.setOwnAttendance(status)
				model.editModels.whoModel.isConfidential = this.calendarEvent.invitedConfidentially ?? false
				await model.apply()
			} else {
				this.ownAttendee.status = oldStatus
			}
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
			const model = await this.eventModelFactory(CalendarOperation.DeleteThis)
			await model?.apply()
		} catch (e) {
			if (!(e instanceof NotFoundError)) {
				throw e
			}
		}
	}

	async deleteAll(): Promise<void> {
		try {
			const model = await this.eventModelFactory(CalendarOperation.DeleteAll)
			await model?.apply()
		} catch (e) {
			if (!(e instanceof NotFoundError)) {
				throw e
			}
		}
	}

	async editSingle() {
		const model = await this.eventModelFactory(CalendarOperation.EditThis)
		if (model == null) {
			return
		}
		try {
			return await showExistingCalendarEventEditDialog(model, {
				uid: this.calendarEvent.uid,
				sequence: this.calendarEvent.sequence,
				recurrenceId: this.calendarEvent.startTime,
			})
		} catch (err) {
			if (err instanceof NotFoundError) {
				console.log("occurrence not found when clicking on the event")
			} else {
				throw err
			}
		}

		throw new ProgrammingError("not implemented")
	}

	async editAll() {
		const model = await this.eventModelFactory(CalendarOperation.EditAll)
		if (model == null) {
			return
		}
		try {
			return await showExistingCalendarEventEditDialog(model, {
				uid: this.calendarEvent.uid,
				sequence: this.calendarEvent.sequence,
				recurrenceId: null,
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
		const model = await this.eventModelFactory(CalendarOperation.EditAll)
		if (model == null) {
			return EventSaveResult.Failed
		}
		try {
			model.editModels.whoModel.shouldSendUpdates = true
			await model.apply()
			return EventSaveResult.Saved
		} finally {
			model.editModels.whoModel.shouldSendUpdates = false
		}
	}

	async sanitizeDescription(): Promise<void> {
		const { htmlSanitizer } = await import("../../../../common/misc/HtmlSanitizer.js")
		this.sanitizedDescription = htmlSanitizer.sanitizeHTML(this.calendarEvent.description, {
			blockExternalContent: true,
		}).html
	}

	getSanitizedDescription() {
		return this.sanitizedDescription
	}
}
