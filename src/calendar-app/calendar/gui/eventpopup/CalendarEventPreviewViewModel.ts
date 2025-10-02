import { CalendarEvent, CalendarEventAttendee } from "../../../../common/api/entities/tutanota/TypeRefs.js"
import {
	addDaysForRecurringEvent,
	calendarEventHasMoreThanOneOccurrencesLeft,
	CalendarTimeRange,
	getStartOfDayWithZone,
} from "../../../../common/calendar/date/CalendarUtils.js"
import { CalendarEventModel, CalendarOperation, EventSaveResult, EventType, getNonOrganizerAttendees } from "../eventeditor-model/CalendarEventModel.js"
import { NotFoundError } from "../../../../common/api/common/error/RestError.js"
import { CalendarInfoBase, CalendarModel } from "../../model/CalendarModel.js"
import { ProgrammingError } from "../../../../common/api/common/error/ProgrammingError.js"
import { CalendarAttendeeStatus, EndType } from "../../../../common/api/common/TutanotaConstants.js"
import m from "mithril"
import { clone, deepEqual, incrementDate, LazyLoaded, Thunk } from "@tutao/tutanota-utils"
import { CalendarEventUidIndexEntry } from "../../../../common/api/worker/facades/lazy/CalendarFacade.js"
import { EventEditorDialog } from "../eventeditor-view/CalendarEventEditDialog.js"
import { convertTextToHtml } from "../../../../common/misc/Formatter.js"
import { prepareCalendarDescription } from "../../../../common/api/common/utils/CommonCalendarUtils.js"
import { SearchToken } from "../../../../common/api/common/utils/QueryTokenUtils"
import { lang } from "../../../../common/misc/LanguageViewModel.js"

/**
 * makes decisions about which operations are available from the popup and knows how to implement them depending on the event's type.
 */
export class CalendarEventPreviewViewModel {
	readonly canEdit: boolean
	readonly canDelete: boolean
	readonly canSendUpdates: boolean
	readonly isOrganizer: boolean
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
	 * Comment to be sent together with the event reply
	 */
	comment: string = ""

	private readonly calendar: LazyLoaded<CalendarInfoBase | undefined> = new LazyLoaded<CalendarInfoBase | undefined>(async () => {
		if (!this.calendarEvent?._ownerGroup) {
			return undefined
		}
		return this.calendarModel.getCalendarInfo(this.calendarEvent._ownerGroup)
	})

	/**
	 *
	 * @param calendarEvent the event to display in the popup
	 * @param calendarModel the calendar model where the event can be updated/deleted
	 * @param eventType
	 * @param hasBusinessFeature if the current user is allowed to do certain operations.
	 * @param ownAttendee will be cloned to have a copy that's not influencing the actual event but can be changed to quickly update the UI
	 * @param lazyIndexEntry async function to resolve the progenitor of the shown event
	 * @param eventModelFactory
	 * @param highlightedStrings
	 * @param uiUpdateCallback
	 */
	constructor(
		readonly calendarEvent: Readonly<CalendarEvent>,
		private readonly calendarModel: CalendarModel,
		readonly eventType: EventType,
		private readonly hasBusinessFeature: boolean,
		ownAttendee: CalendarEventAttendee | null,
		private readonly lazyIndexEntry: () => Promise<CalendarEventUidIndexEntry | null>,
		private readonly eventModelFactory: (mode: CalendarOperation, event: CalendarEvent) => Promise<CalendarEventModel | null>,
		private readonly highlightedStrings?: readonly SearchToken[],
		private readonly uiUpdateCallback: () => void = m.redraw,
	) {
		this._ownAttendee = clone(ownAttendee)
		this.isOrganizer = calendarEvent.organizer?.address === ownAttendee?.address.address

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

		this.calendar.getAsync().then(m.redraw)
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
		if (this.ownAttendee == null || this.isOrganizer) return null
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
			const model = await this.eventModelFactory(CalendarOperation.EditAll, this.calendarEvent)
			if (model) {
				model.editModels.whoModel.setOwnAttendance(status)
				model.editModels.whoModel.isConfidential = this.calendarEvent.invitedConfidentially ?? false
				model.editModels.comment.content = this.comment || ""
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
			const model = await this.eventModelFactory(CalendarOperation.DeleteThis, this.calendarEvent)
			await model?.apply()
		} catch (e) {
			if (!(e instanceof NotFoundError)) {
				throw e
			}
		}
	}

	async deleteAll(): Promise<void> {
		try {
			const model = await this.eventModelFactory(CalendarOperation.DeleteAll, this.calendarEvent)
			await model?.apply()
		} catch (e) {
			if (!(e instanceof NotFoundError)) {
				throw e
			}
		}
	}

	async editSingle() {
		const model = await this.eventModelFactory(CalendarOperation.EditThis, this.calendarEvent)
		if (model == null) {
			return
		}
		try {
			const eventEditor = new EventEditorDialog()
			return await eventEditor.showExistingCalendarEventEditDialog(model, {
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

	async editThisAndFutureOccurrences() {
		try {
			const { progenitorModel, progenitor } = await this.resolveSeriesModificationProperties()

			if (deepEqual(this.calendarEvent, progenitor)) {
				return await this.editAll()
			}

			const newEventModel = await this.eventModelFactory(CalendarOperation.Create, this.calendarEvent)
			if (!newEventModel) {
				throw new Error("Failed to split original series and instantiate a new event model.")
			}
			newEventModel.editModels.whenModel.deleteExcludedDates()
			newEventModel.editModels.whoModel.resetGuestsStatus()

			if (newEventModel.editModels.whenModel.repeatEndType === EndType.Count) {
				const generationRange: CalendarTimeRange = {
					start: progenitor.startTime.getTime(),
					end: getStartOfDayWithZone(this.calendarEvent.startTime, this.calendarEvent.repeatRule!.timeZone).getTime(),
				}
				const occurrencesPerDay = new Map()
				addDaysForRecurringEvent(occurrencesPerDay, { isGhost: false, event: progenitor }, generationRange, newEventModel.editModels.whenModel.zone)

				const occurrencesLeft =
					newEventModel.editModels.whenModel.repeatEndOccurrences -
					progenitorModel.editModels.whenModel.excludedDates.length -
					Array.from(occurrencesPerDay.values()).flat().length
				newEventModel.editModels.whenModel.repeatEndOccurrences = occurrencesLeft > 0 ? occurrencesLeft : 1
			}

			const eventEditor = new EventEditorDialog()
			await eventEditor.showNewCalendarEventEditDialog(newEventModel, async () => {
				progenitorModel.editModels.whenModel.repeatEndType = EndType.UntilDate
				progenitorModel.editModels.whenModel.repeatEndDateForDisplay = incrementDate(
					getStartOfDayWithZone(this.calendarEvent.startTime, this.calendarEvent.repeatRule!.timeZone),
					-1,
				)
				await progenitorModel.apply()
			})
		} catch (err) {
			if (err instanceof NotFoundError) {
				console.log("calendar event not found when clicking on the event")
			} else {
				throw err
			}
		}
	}

	async deleteThisAndFutureOccurrences() {
		try {
			const { progenitorModel, progenitor } = await this.resolveSeriesModificationProperties()

			if (deepEqual(this.calendarEvent, progenitor)) {
				return await this.deleteAll()
			}

			progenitorModel.editModels.whenModel.repeatEndType = EndType.UntilDate
			progenitorModel.editModels.whenModel.repeatEndDateForDisplay = incrementDate(
				getStartOfDayWithZone(this.calendarEvent.startTime, this.calendarEvent.repeatRule!.timeZone),
				-1,
			)
			await progenitorModel.apply()
		} catch (err) {
			if (err instanceof NotFoundError) {
				console.log("calendar event not found when clicking on the event")
			} else {
				throw err
			}
		}
	}

	async duplicateEvent() {
		try {
			const progenitor = await this.calendarModel.resolveCalendarEventProgenitor(this.calendarEvent)

			if (!progenitor) {
				throw new Error("Could not resolve progenitor.")
			}

			const newEventModel = await this.eventModelFactory(CalendarOperation.Create, progenitor)

			if (!newEventModel) {
				throw new Error("Failed clone and create a new event model.")
			}
			newEventModel.editModels.summary.content = lang.get("copyOf_title", {
				"{title}": newEventModel.editModels.summary.content,
			})
			newEventModel.editModels.whenModel.deleteExcludedDates()
			newEventModel.editModels.whoModel.resetGuestsStatus()

			const calendarId = newEventModel.editModels.whoModel.selectedCalendar.group._id
			await newEventModel.editModels.alarmModel.removeCalendarDefaultAlarms(calendarId, this.calendarModel.getGroupSettings())

			const eventEditor = new EventEditorDialog()
			return await eventEditor.showNewCalendarEventEditDialog(newEventModel)
		} catch (err) {
			if (err instanceof NotFoundError) {
				console.log("calendar event not found when clicking on the event")
			} else {
				throw err
			}
		}
	}

	async resolveSeriesModificationProperties() {
		if (!this.calendarEvent.repeatRule) {
			throw new Error("Editing a series without repeat rule")
		}

		const progenitor = await this.calendarModel.resolveCalendarEventProgenitor(this.calendarEvent)
		if (!progenitor) {
			throw new Error("Could not resolve progenitor.")
		}

		const progenitorModel = await this.eventModelFactory(CalendarOperation.StopSeriesAtDate, progenitor)
		if (!progenitorModel) {
			throw new Error("Failed instantiate progenitor model.")
		}

		return { progenitorModel, progenitor }
	}

	async editAll() {
		const model = await this.eventModelFactory(CalendarOperation.EditAll, this.calendarEvent)
		if (model == null) {
			return
		}
		try {
			const eventEditor = new EventEditorDialog()
			return await eventEditor.showExistingCalendarEventEditDialog(model, {
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
		const model = await this.eventModelFactory(CalendarOperation.EditAll, this.calendarEvent)
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
		const { getHtmlSanitizer } = await import("../../../../common/misc/HtmlSanitizer.js")
		this.sanitizedDescription = prepareCalendarDescription(
			this.calendarEvent.description,
			(s) =>
				getHtmlSanitizer().sanitizeHTML(convertTextToHtml(s), {
					blockExternalContent: false,
					highlightedStrings: this.highlightedStrings,
				}).html,
		)
	}

	getSanitizedDescription() {
		return this.sanitizedDescription
	}

	// Returns null if there is no ownerGroup, which might be the case if an event invitation is being viewed
	getCalendarInfoBase(): CalendarInfoBase | null {
		if (!this.calendarEvent._ownerGroup) return null
		return this.calendar.getSync() ?? null
	}
}
