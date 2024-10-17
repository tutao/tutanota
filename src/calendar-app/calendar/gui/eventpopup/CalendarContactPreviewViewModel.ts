import { CalendarEvent, Contact } from "../../../../common/api/entities/tutanota/TypeRefs.js"
// import { client } from "../../../../common/misc/ClientDetector.js"
import { MobileSystemFacade } from "../../../../common/native/common/generatedipc/MobileSystemFacade.js"
import { EntityClient } from "../../../../common/api/common/EntityClient.js"

/**
 * makes decisions about which operations are available from the popup and knows how to implement them depending on the event's type.
 */
export class CalendarContactPreviewViewModel {
	/**
	 *
	 * @param event the event that was interacted with
	 * @param contact the contact to display in the popup
	 * @param canEdit
	 */
	constructor(
		private readonly systemFacade: MobileSystemFacade,
		private readonly entityClient: EntityClient,
		readonly event: Readonly<CalendarEvent>,
		readonly contact: Readonly<Contact>,
		readonly canEdit: boolean = false,
	) {}

	async editSingle() {
		// if (client.isCalendarApp()) {
		// 	const query = `contactId=${stringToBase64(this.contact._id.join("/"))}`
		// 	this.systemFacade.openMailApp(stringToBase64(query))
		// 	return
		// }
		// new ContactEditor(this.entityClient, this.contact, listIdPart(this.contact._id), m.redraw).show()
	}
}
