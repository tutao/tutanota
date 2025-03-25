import m from "mithril"
import { LoginController } from "../../api/main/LoginController.js"
import { CalendarOpenAction } from "../common/generatedipc/CalendarOpenAction.js"
import { DateTime } from "luxon"
import { CalendarEventModel, CalendarOperation } from "../../../calendar-app/calendar/gui/eventeditor-model/CalendarEventModel.js"
import { EventEditorDialog } from "../../../calendar-app/calendar/gui/eventeditor-view/CalendarEventEditDialog.js"

/**
 * Handles requests for opening calendar paths from native.
 */
export class OpenCalendarHandler {
	constructor(
		private readonly logins: LoginController,
		private readonly eventModelFactory: (mode: CalendarOperation, date: Date) => Promise<CalendarEventModel | null>,
	) {}

	async openCalendar(userId: Id, action: CalendarOpenAction, date: string | null): Promise<void> {
		const parsedDate = date ? DateTime.fromISO(date).toISODate() : DateTime.now().toISODate()

		this.handleAgendaOpening(userId, parsedDate)

		if (parsedDate && action === CalendarOpenAction.EventEditor) {
			return this.openCalendarEventEditor(parsedDate)
		}
	}

	private handleAgendaOpening(userId: string, parsedDate: string | null) {
		if (this.logins.isUserLoggedIn() && this.logins.getUserController().user._id === userId) {
			m.route.set(`/calendar/agenda/${parsedDate}`)
		} else {
			m.route.set(`/login?noAutoLogin=false&userId=${userId}&requestedPath=${encodeURIComponent(`/calendar/agenda/${parsedDate}`)}`)
		}
	}

	async openCalendarEventEditor(date: string): Promise<void> {
		await this.logins.waitForFullLogin()
		const { EventEditorDialog } = await import("../../../calendar-app/calendar/gui/eventeditor-view/CalendarEventEditDialog.js")

		const model = await this.eventModelFactory(CalendarOperation.Create, new Date(date))

		if (model) {
			const eventEditor = new EventEditorDialog()
			await eventEditor.showNewCalendarEventEditDialog(model)
		}
	}
}
