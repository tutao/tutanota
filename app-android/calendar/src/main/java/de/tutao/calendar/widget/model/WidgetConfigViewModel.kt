package de.tutao.calendar.widget.model

import android.app.Application
import android.content.Context
import android.util.Log
import androidx.datastore.core.IOException
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.CreationExtras
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import de.tutao.calendar.widget.data.SettingsDao
import de.tutao.calendar.widget.data.WidgetRepository
import de.tutao.calendar.widget.error.WidgetError
import de.tutao.tutasdk.CalendarRenderData
import de.tutao.tutasdk.GeneratedId
import de.tutao.tutasdk.LoginException
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
	private val sdk: Sdk?,
	private val repository: WidgetRepository
) :
	AndroidViewModel(application), WidgetConfigModel {
	private val _credentials = MutableStateFlow<List<PersistedCredentials>>(listOf())
	private val _isLoading = MutableStateFlow(true)
	private val _selectedCredential = MutableStateFlow<PersistedCredentials?>(null)
	private val _calendars: MutableStateFlow<Map<GeneratedId, CalendarRenderData>> = MutableStateFlow(HashMap())
	private val _selectedCalendars: MutableStateFlow<Map<GeneratedId, CalendarRenderData>> = MutableStateFlow(HashMap())
	private val _error = MutableStateFlow<WidgetError?>(null)

	override val credentials: StateFlow<List<PersistedCredentials>> = _credentials.asStateFlow()
	override val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
	override val selectedCredential: StateFlow<PersistedCredentials?> = _selectedCredential.asStateFlow()
	override val calendars: StateFlow<Map<GeneratedId, CalendarRenderData>> = _calendars.asStateFlow()
	override val error: StateFlow<WidgetError?> = _error.asStateFlow()

	companion object {
		val APPLICATION_EXTRA_KEY = object : CreationExtras.Key<Application> {}
		val CREDENTIALS_FACADE_EXTRA_KEY = object : CreationExtras.Key<NativeCredentialsFacade> {}
		val SDK_EXTRA_KEY = object : CreationExtras.Key<Sdk?> {}
		val REPOSITORY_EXTRA_KEY = object : CreationExtras.Key<WidgetRepository> {}

		const val TAG = "WidgetConfigViewModel"

		val Factory: ViewModelProvider.Factory = viewModelFactory {
			initializer {
				val application = this[APPLICATION_EXTRA_KEY] as Application
				val credentialsFacade = this[CREDENTIALS_FACADE_EXTRA_KEY] as NativeCredentialsFacade
				val sdk = this[SDK_EXTRA_KEY]
				val repository = this[REPOSITORY_EXTRA_KEY] as WidgetRepository

				WidgetConfigViewModel(application, credentialsFacade, sdk, repository)
			}
		}
	}

	fun loadCredentials() {
		viewModelScope.launch {
			_isLoading.value = true
			try {
				_credentials.value = repository.loadCredentials(credentialsFacade)
			} catch (e: Exception) {
				// FIXME Replace by translation
				_error.value = WidgetError(
					"Failed to read stored credentials",
					"Failed to read stored credentials from database",
					e.stackTraceToString()
				)
				Log.e(TAG, "Failed to read stored credentials from database: ${e.stackTraceToString()}")
			} finally {
				_isLoading.value = false
			}
		}
	}

	override fun setSelectedCredential(credential: PersistedCredentials): Job? {
		if (_selectedCredential.value == credential) {
			return null
		}
		_selectedCalendars.value = HashMap()
		_selectedCredential.value = credential

		return viewModelScope.launch {
			loadCalendars(credential)
		}
	}

	override fun toggleCalendarSelection(calendarId: GeneratedId, isSelected: Boolean) {
		if (!isSelected) {
			_selectedCalendars.value = _selectedCalendars.value.minus(calendarId)
			return
		}

		val renderData: CalendarRenderData = _calendars.value[calendarId] ?: return
		_selectedCalendars.value = _selectedCalendars.value.plus(calendarId to renderData)
	}

	override fun isCalendarSelected(calendarId: GeneratedId): Boolean {
		return _selectedCalendars.value[calendarId] != null
	}

	fun loadWidgetSettings(context: Context, widgetId: Int) {
		viewModelScope.launch {
			try {
				val settings = repository.loadSettings(context, widgetId) ?: return@launch

				_isLoading.value = true

				val selectedCredential =
					credentials.value.find { credential -> credential.credentialInfo.userId == settings.userId }

				val preSelectCalendars = {
					if (calendars.value.isNotEmpty()) {
						_selectedCalendars.value =
							settings.calendars.filterKeys { id -> calendars.value.containsKey(id) }
					} else {
						_selectedCalendars.value = settings.calendars
					}
				}

				if (selectedCredential != null) {
					setSelectedCredential(selectedCredential)?.invokeOnCompletion {
						preSelectCalendars()
					}
				} else {
					preSelectCalendars()
				}
			} catch (e: IOException) {
				_isLoading.value = false
				// FIXME Replace by translation
				_error.value = WidgetError(
					"Failed to read stored Widget Settings",
					"Error on Data Store while loading Widget Settings",
					e.stackTraceToString()
				)
				Log.e(TAG, "Error on Data Store while loading Widget Settings: ${e.stackTraceToString()}")
			} catch (e: Exception) {
				_isLoading.value = false
				// FIXME Replace by translation
				_error.value = WidgetError(
					"Failed to read stored Widget Settings",
					"Unexpected error while loading Widget Settings",
					e.stackTraceToString()
				)
				Log.e(TAG, "Unexpected error while loading Widget Settings: ${e.stackTraceToString()}")
			}
		}
	}

	fun storeSettings(context: Context, widgetId: Int): Job {
		val credential = _selectedCredential.value ?: throw Exception("Missing credentials for user")

		_isLoading.value = true

		return viewModelScope.launch {
			try {
				repository.storeLastSyncInBatch(context, intArrayOf(widgetId), Date())
				repository.storeSettings(
					context,
					widgetId,
					SettingsDao(
						calendars = _selectedCalendars.value,
						userId = credential.credentialInfo.userId
					)
				)
			} catch (e: IOException) {
				// FIXME Replace by translation
				_error.value =
					WidgetError(
						"Failed to write Widget Settings, please try again later",
						"Unexpected error while saving Widget Settings",
						e.stackTraceToString()
					)
				Log.e(TAG, "Unexpected error while saving Widget Settings: ${e.message}")
			} catch (e: Exception) {
				// FIXME Replace by translation
				_error.value =
					WidgetError(
						"Unexpected error, please try again later",
						"Unexpected error while saving Widget Settings",
						e.stackTraceToString()
					)
				Log.e(TAG, "Unexpected error while saving Widget Settings: ${e.message}")
			} finally {
				_isLoading.value = false
			}
		}
	}

	private suspend fun loadCalendars(credential: PersistedCredentials) {
		if (sdk == null) {
			_error.value = WidgetError(
				"Unexpected error while loading calendars", "Missing initialized SDK", ""
			)
			Log.e(TAG, "Missing initialized SDK")

			return
		}

		try {
			_isLoading.value = true
			_calendars.value = repository.loadCalendars(credential.credentialInfo.userId, credentialsFacade, sdk)
		} catch (e: LoginException) {
			// FIXME Replace by translation
			_error.value = WidgetError(
				"Failed to login in with the selected credentials, try removing and adding the account in Calendar App",
				e.message ?: "",
				e.stackTraceToString()
			)
			Log.e(TAG, "Failed to load credentials: ${e.message}")
		} catch (e: Exception) {
			// FIXME Replace by translation
			_error.value =
				WidgetError(
					"Missing credentials/permissions for the selected account",
					e.message ?: "",
					e.stackTraceToString()
				)
			Log.e(TAG, "Missing credentials/permissions for the selected account: ${e.message}")
		} finally {
			_isLoading.value = false
		}
	}
}