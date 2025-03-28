package de.tutao.calendar.widget.model

import de.tutao.calendar.widget.error.WidgetError
import de.tutao.tutasdk.CalendarRenderData
import de.tutao.tutasdk.GeneratedId
import de.tutao.tutashared.ipc.PersistedCredentials
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.StateFlow

interface WidgetConfigModel {
	val credentials: StateFlow<List<PersistedCredentials>>
	val isLoading: StateFlow<Boolean>
	val selectedCredential: StateFlow<PersistedCredentials?>
	val calendars: StateFlow<Map<GeneratedId, CalendarRenderData>>
	val error: StateFlow<WidgetError?>

	fun toggleCalendarSelection(calendarId: GeneratedId, isSelected: Boolean)
	fun isCalendarSelected(calendarId: GeneratedId): Boolean
	fun setSelectedCredential(credential: PersistedCredentials): Job?
}