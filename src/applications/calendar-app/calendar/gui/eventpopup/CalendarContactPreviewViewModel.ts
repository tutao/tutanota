import { isNotNull } from "../../../../../platform-kits/utils"
import { CalendarEvent, Contact } from "@tutao/entities/tutanota"

/**
 * makes decisions about which operations are available from the popup and knows how to implement them depending on the event's type.
 */
export class CalendarContactPreviewViewModel {
	/**
	 *
	 * @param calendarEvent the event that was interacted with
	 * @param contact the contact to display in the popup
	 * @param _canEdit allow editing the contact if available
	 */
	constructor(
		readonly calendarEvent: Readonly<CalendarEvent>,
		readonly contact: Readonly<Contact>,
		private readonly _canEdit: boolean = false,
	) {}

	get canEdit(): boolean {
		return this._canEdit && isNotNull(this.contact)
	}
}
