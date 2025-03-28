import m from "mithril"
import { LoginController } from "../../api/main/LoginController.js"
import { CalendarOpenAction } from "../common/generatedipc/CalendarOpenAction.js"
import { CalendarEventModel, CalendarOperation } from "../../../calendar-app/calendar/gui/eventeditor-model/CalendarEventModel.js"
import { formatJSDate } from "../../api/common/utils/CommonCalendarUtils.js"

/**
 * Handles requests for opening calendar paths from native.
 */
export class OpenCalendarHandler {
	constructor(
		private readonly logins: LoginController,
		private readonly eventModelFactory: (mode: CalendarOperation, date: Date) => Promise<CalendarEventModel | null>,
	) {}

	async openCalendar(userId: Id, action: CalendarOpenAction, date: string | null, eventId: string | null): Promise<void> {
		const dt = date ? new Date(Date.parse(date)) : new Date()
		const parsedDate = formatJSDate(dt)

		if (action === CalendarOpenAction.Agenda) {
			this.handleAgendaOpening(userId, parsedDate, eventId ?? "")
		} else {
			this.handleDefaultOpening(userId)
		}

		if (parsedDate && action === CalendarOpenAction.EventEditor) {
			return this.openCalendarEventEditor(parsedDate)
		}
	}

	private handleAgendaOpening(userId: string, parsedDate: string | null, eventId: string) {
		if (this.logins.isUserLoggedIn() && this.logins.getUserController().user._id === userId) {
			m.route.set(`/calendar/agenda/${parsedDate}/${eventId}`)
		} else {
			m.route.set(`/login?noAutoLogin=false&userId=${userId}&requestedPath=${encodeURIComponent(`/calendar/agenda/${parsedDate}/${eventId}`)}`)
		}
	}

	private handleDefaultOpening(userId: string) {
		if (this.logins.isUserLoggedIn() && this.logins.getUserController().user._id === userId) {
			m.route.set(`/calendar`)
		} else {
			m.route.set(`/login?noAutoLogin=false&userId=${userId}&requestedPath=${encodeURIComponent(`/calendar`)}`)
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
