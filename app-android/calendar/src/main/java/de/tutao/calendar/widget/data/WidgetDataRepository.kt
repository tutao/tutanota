package de.tutao.calendar.widget.data

import de.tutao.tutasdk.CalendarEventsList
import de.tutao.tutasdk.GeneratedId
import de.tutao.tutasdk.LoggedInSdk
import de.tutao.tutashared.ipc.NativeCredentialsFacade
import java.util.Calendar
import java.util.TimeZone

class WidgetDataRepository : WidgetRepository() {
	override suspend fun loadEvents(
		userId: GeneratedId,
		calendars: List<GeneratedId>,
		credentialsFacade: NativeCredentialsFacade,
		loggedInSdk: LoggedInSdk
	): Map<GeneratedId, CalendarEventsList> {
		val calendarFacade = loggedInSdk.calendarFacade()
		val systemCalendar = Calendar.getInstance(TimeZone.getDefault())

		var calendarEventsList: Map<GeneratedId, CalendarEventsList> = HashMap()

		calendars.forEach { calendarId ->
			val events = calendarFacade.getCalendarEvents(calendarId, (systemCalendar.timeInMillis).toULong())
			calendarEventsList = calendarEventsList.plus(calendarId to events)
		}

		return calendarEventsList
	}
}