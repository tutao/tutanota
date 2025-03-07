package de.tutao.calendar.widget.data

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import de.tutao.tutasdk.CalendarRenderData
import de.tutao.tutasdk.GeneratedId
import de.tutao.tutashared.ipc.PersistedCredentials
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class WidgetConfigViewModel(application: Application) : AndroidViewModel(application) {
	private val repository: WidgetRepository
	private val _credentials = MutableStateFlow<List<PersistedCredentials>>(listOf())
	private val _isLoading = MutableStateFlow(true)
	private val _selectedCredential = MutableStateFlow<PersistedCredentials?>(null)
	private val _calendars: MutableStateFlow<Map<GeneratedId, CalendarRenderData>> = MutableStateFlow(HashMap())
	private val _selectedCalendars: MutableStateFlow<Map<GeneratedId, CalendarRenderData>> = MutableStateFlow(HashMap())

	val credentials: StateFlow<List<PersistedCredentials>> = _credentials.asStateFlow()
	val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
	val selectedCredential: StateFlow<PersistedCredentials?> = _selectedCredential.asStateFlow()
	val calendars: StateFlow<Map<GeneratedId, CalendarRenderData>> = _calendars.asStateFlow()

	init {
		val context = getApplication<Application>().applicationContext
		repository = WidgetRepository(context)
	}

	fun loadCredentials() {
		viewModelScope.launch {
			_isLoading.value = true
			_credentials.value = repository.loadCredentials()
			_isLoading.value = false
		}
	}

	fun setSelectedCredential(credential: PersistedCredentials): Job {
		_selectedCredential.value = credential

		return viewModelScope.launch {
			loadCalendars(credential)
		}
	}

	fun toggleCalendarSelection(calendarId: GeneratedId, isSelected: Boolean) {
		if (!isSelected) {
			_selectedCalendars.value = _selectedCalendars.value.minus(calendarId)
			return
		}

		val renderData: CalendarRenderData = _calendars.value[calendarId] ?: return
		_selectedCalendars.value = _selectedCalendars.value.plus(calendarId to renderData)
	}

	fun isCalendarSelected(calendarId: GeneratedId): Boolean {
		return _selectedCalendars.value[calendarId] != null
	}

	fun loadWidgetSettings(widgetId: Int) {
		val settings = repository.loadSettings(widgetId) ?: return

		_isLoading.value = true

		val selectedCredential =
			credentials.value.find { credential -> credential.credentialInfo.userId == settings.userId }

		val preSelectCalendars = {
			if (calendars.value.isNotEmpty()) {
				_selectedCalendars.value = settings.calendars.filterKeys { id -> calendars.value.containsKey(id) }
			} else {
				_selectedCalendars.value = settings.calendars
			}

			_isLoading.value = false
		}

		if (selectedCredential != null) {
			setSelectedCredential(selectedCredential).invokeOnCompletion {
				println(calendars.value)
				preSelectCalendars()
			}
		} else {
			preSelectCalendars()
		}
	}

	fun storeSettings(widgetId: Int) {
		val credential = _selectedCredential.value ?: throw Exception("Missing credentials for user")

		_isLoading.value = true

		viewModelScope.launch {
			repository.storeSettings(
				widgetId,
				SettingsDao(
					calendars = _selectedCalendars.value,
					userId = credential.credentialInfo.userId
				)
			)

			_isLoading.value = false
		}
	}

	private suspend fun loadCalendars(credential: PersistedCredentials) {
		_isLoading.value = true
		_calendars.value = repository.loadCalendars(credential)
		_isLoading.value = false
	}
}