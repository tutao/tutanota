package de.tutao.calendar.widget.test

import de.tutao.calendar.widget.data.WidgetConfigModel
import de.tutao.calendar.widget.error.WidgetError
import de.tutao.tutasdk.CalendarRenderData
import de.tutao.tutasdk.GeneratedId
import de.tutao.tutashared.ipc.PersistedCredentials
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class WidgetConfigTestViewModel(
	credentials: List<PersistedCredentials> = listOf(),
	selectedCredential: PersistedCredentials? = null,
	calendars: Map<GeneratedId, CalendarRenderData> = mapOf(),
	private val selectedCalendars: List<GeneratedId> = listOf()
) : WidgetConfigModel {
	override val credentials: StateFlow<List<PersistedCredentials>> = MutableStateFlow(credentials)
	override val isLoading: StateFlow<Boolean> = MutableStateFlow(false)
	override val selectedCredential: StateFlow<PersistedCredentials?> = MutableStateFlow(selectedCredential)
	override val calendars: StateFlow<Map<GeneratedId, CalendarRenderData>> = MutableStateFlow(calendars)
	override val error: StateFlow<WidgetError?> = MutableStateFlow(null)

	override fun toggleCalendarSelection(calendarId: GeneratedId, isSelected: Boolean) {}

	override fun isCalendarSelected(calendarId: GeneratedId): Boolean {
		return selectedCalendars.contains(calendarId)
	}

	override fun setSelectedCredential(credential: PersistedCredentials): Job? {
		return null
	}
}