package de.tutao.calendar.widget.data

import de.tutao.tutasdk.CalendarEventsList
import de.tutao.tutasdk.GeneratedId
import de.tutao.tutasdk.LoggedInSdk
import de.tutao.tutashared.ipc.NativeCredentialsFacade
import java.util.Calendar
import java.util.TimeZone

class WidgetDataRepository : WidgetRepository() {
	companion object {
		@Volatile
		private var instance: WidgetDataRepository? = null

		fun getInstance(): WidgetDataRepository {
			if (instance == null) {
				synchronized(this) {
					if (instance == null) {
						instance = WidgetDataRepository()
					}
				}
			}
			return instance!!
		}
	}

	override suspend fun loadEvents(
		userId: GeneratedId,
		calendars: List<GeneratedId>,
		credentialsFacade: NativeCredentialsFacade,
		loggedInSdk: LoggedInSdk
	): Map<GeneratedId, CalendarEventsList> {
		// Clear our cached events
		cachedEvents = mapOf()

		val calendarFacade = loggedInSdk.calendarFacade()
		val systemCalendar = Calendar.getInstance(TimeZone.getDefault())

		var calendarEventsList: Map<GeneratedId, CalendarEventsList> = HashMap()

		calendars.forEach { calendarId ->
			val events = calendarFacade.getCalendarEvents(calendarId, (systemCalendar.timeInMillis).toULong())

			cachedEvents = cachedEvents.plus(calendarId to events)
			calendarEventsList = calendarEventsList.plus(calendarId to events)
		}

		return calendarEventsList
	}

	override suspend fun loadEvents(): Map<GeneratedId, CalendarEventsList> {
		val now = Calendar.getInstance(TimeZone.getDefault()).timeInMillis.toULong()
		var filteredCache: Map<GeneratedId, CalendarEventsList> = mapOf()

		for ((id, events) in cachedEvents.entries) {
			filteredCache = filteredCache.plus(
				id to CalendarEventsList(
					shortEvents = events.shortEvents.filter { it.startTime >= now || it.endTime >= now },
					longEvents = events.longEvents.filter { it.startTime >= now || it.endTime >= now },
				)
			)
		}

		cachedEvents = filteredCache
		return filteredCache
	}
}