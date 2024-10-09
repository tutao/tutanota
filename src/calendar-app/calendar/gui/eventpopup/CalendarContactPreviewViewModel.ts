import { CalendarEvent, CalendarEventAttendee, Contact } from "../../../../common/api/entities/tutanota/TypeRefs.js"
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
export class CalendarContactPreviewViewModel {
	/**
	 *
	 * @param event the event that was interacted with
	 * @param contact the contact to display in the popup
	 * @param canEdit
	 * @param uiUpdateCallback
	 */
	constructor(
		readonly event: Readonly<CalendarEvent>,
		readonly contact: Readonly<Contact>,
		readonly canEdit: boolean = false,
		private readonly uiUpdateCallback: () => void = m.redraw,
	) {}

	async editSingle() {
		throw new ProgrammingError("not implemented")
	}
}
