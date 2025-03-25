package de.tutao.calendar.widget.data

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.CreationExtras
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import de.tutao.tutasdk.CalendarRenderData
import de.tutao.tutasdk.GeneratedId
import de.tutao.tutasdk.Sdk
import de.tutao.tutashared.ipc.NativeCredentialsFacade
import de.tutao.tutashared.ipc.PersistedCredentials
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.Date

class WidgetConfigViewModel(
	application: Application,
	private val credentialsFacade: NativeCredentialsFacade,
	private val sdk: Sdk,
	private val repository: WidgetRepository
) :
	AndroidViewModel(application) {
	private val _credentials = MutableStateFlow<List<PersistedCredentials>>(listOf())
	private val _isLoading = MutableStateFlow(true)
	private val _selectedCredential = MutableStateFlow<PersistedCredentials?>(null)
	private val _calendars: MutableStateFlow<Map<GeneratedId, CalendarRenderData>> = MutableStateFlow(HashMap())
	private val _selectedCalendars: MutableStateFlow<Map<GeneratedId, CalendarRenderData>> = MutableStateFlow(HashMap())

	val credentials: StateFlow<List<PersistedCredentials>> = _credentials.asStateFlow()
	val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
	val selectedCredential: StateFlow<PersistedCredentials?> = _selectedCredential.asStateFlow()
	val calendars: StateFlow<Map<GeneratedId, CalendarRenderData>> = _calendars.asStateFlow()

	companion object {
		val APPLICATION_EXTRA_KEY = object : CreationExtras.Key<Application> {}
		val CREDENTIALS_FACADE_EXTRA_KEY = object : CreationExtras.Key<NativeCredentialsFacade> {}
		val SDK_EXTRA_KEY = object : CreationExtras.Key<Sdk> {}
		val REPOSITORY_EXTRA_KEY = object : CreationExtras.Key<WidgetRepository> {}

		const val TAG = "WidgetConfigViewModel"

		val Factory: ViewModelProvider.Factory = viewModelFactory {
			initializer {
				val application = this[APPLICATION_EXTRA_KEY] as Application
				val credentialsFacade = this[CREDENTIALS_FACADE_EXTRA_KEY] as NativeCredentialsFacade
				val sdk = this[SDK_EXTRA_KEY] as Sdk
				val repository = this[REPOSITORY_EXTRA_KEY] as WidgetRepository

				WidgetConfigViewModel(application, credentialsFacade, sdk, repository)
			}
		}
	}

	fun loadCredentials() {
		viewModelScope.launch {
			_isLoading.value = true
			_credentials.value = repository.loadCredentials(credentialsFacade)
			_isLoading.value = false
		}
	}

	fun setSelectedCredential(credential: PersistedCredentials): Job? {
		if (_selectedCredential.value == credential) {
			return null
		}
		_selectedCalendars.value = HashMap()
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

	fun loadWidgetSettings(context: Context, widgetId: Int) {
		viewModelScope.launch {
			val settings = repository.loadSettings(context, widgetId) ?: return@launch

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
				setSelectedCredential(selectedCredential)?.invokeOnCompletion {
					preSelectCalendars()
				}
			} else {
				preSelectCalendars()
			}
		}
	}

	fun storeSettings(context: Context, widgetId: Int): Job {
		val credential = _selectedCredential.value ?: throw Exception("Missing credentials for user")

		_isLoading.value = true

		return viewModelScope.launch {
			repository.storeLastSyncInBatch(context, intArrayOf(widgetId), Date())
			repository.storeSettings(
				context,
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
		_calendars.value = repository.loadCalendars(credential.credentialInfo.userId, credentialsFacade, sdk)
		_isLoading.value = false
	}
}