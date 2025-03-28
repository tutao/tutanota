package de.tutao.calendar.widget.model

import android.content.Context
import android.util.Log
import androidx.datastore.core.IOException
import androidx.lifecycle.ViewModel
import de.tutao.calendar.widget.WidgetUpdateTrigger
import de.tutao.calendar.widget.data.UIEvent
import de.tutao.calendar.widget.data.WidgetRepository
import de.tutao.calendar.widget.data.WidgetUIData
import de.tutao.calendar.widget.error.WidgetError
import de.tutao.calendar.widget.error.WidgetErrorType
import de.tutao.tutasdk.Sdk
import de.tutao.tutashared.ipc.NativeCredentialsFacade
import de.tutao.tutashared.isAllDayEventByTimes
import de.tutao.tutashared.push.toSdkCredentials
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Calendar
import java.util.Date

class WidgetUIViewModel(
	private val repository: WidgetRepository,
	private val widgetId: Int,
	private val credentialsFacade: NativeCredentialsFacade,
	private val sdk: Sdk?
) : ViewModel() {
	private val _uiState = MutableStateFlow<WidgetUIData?>(null)
	val uiState: StateFlow<WidgetUIData?> = _uiState.asStateFlow()

	private val _error = MutableStateFlow<WidgetError?>(null)
	val error: StateFlow<WidgetError?> = _error.asStateFlow()

	companion object {
		private const val TAG = "WidgetUIViewModel"
	}

	suspend fun loadUIState(context: Context): WidgetUIData? {
		val allDayEvents: MutableList<UIEvent> = mutableListOf()
		val normalEvents: MutableList<UIEvent> = mutableListOf()

		val todayMidnight = Calendar.getInstance()
		todayMidnight.set(Calendar.HOUR_OF_DAY, 0)
		todayMidnight.set(Calendar.MINUTE, 0)
		todayMidnight.set(Calendar.SECOND, 0)
		todayMidnight.set(Calendar.MILLISECOND, 0)

		val tomorrowMidnight = Calendar.getInstance()
		tomorrowMidnight.add(Calendar.DAY_OF_YEAR, 1)
		tomorrowMidnight.set(Calendar.HOUR_OF_DAY, 0)
		tomorrowMidnight.set(Calendar.MINUTE, 0)
		tomorrowMidnight.set(Calendar.SECOND, 0)
		tomorrowMidnight.set(Calendar.MILLISECOND, 0)

		val settings = repository.loadSettings(context, widgetId) ?: return WidgetUIData(normalEvents, allDayEvents)
		val lastSync = repository.loadLastSync(context, widgetId)
		val credentials = this.credentialsFacade.loadByUserId(settings.userId)?.toSdkCredentials()
		val calendars = settings.calendars.keys.toList()

		if (credentials == null) {
			_error.value = WidgetError(
				"Missing credentials for user ${settings.userId}",
				"",
				WidgetErrorType.CREDENTIALS
			)
			Log.w(TAG, "Missing credentials for user ${settings.userId} during widget setup")

			return null
		}

		// Force is set as True when worker detects that it's a new day
		val forceRemoteEventsFetch = lastSync?.force ?: false
		val calendarToEventsListMap =
			if ((lastSync == null || lastSync.trigger == WidgetUpdateTrigger.APP || forceRemoteEventsFetch) && this.sdk != null) {
				try {
					val loggedInSdk = this.sdk.login(credentials)
					repository.loadEvents(
						settings.userId,
						calendars,
						credentialsFacade,
						loggedInSdk
					)
				} catch (e: Exception) {
					// Fallback to cached events. We don't set an error here because we still able to display "something"
					// to the user.
					Log.w(
						TAG,
						"Missing credentials for user ${settings.userId} during widget setup. ${e.stackTraceToString()}"
					)
					repository.loadEvents(calendars)
				}
			} else {
				repository.loadEvents(calendars)
			}

		calendarToEventsListMap.forEach { (calendarId, eventList) ->
			eventList.shortEvents.plus(eventList.longEvents).forEach { loadedEvent ->
				val zoneId = ZoneId.systemDefault()
				val start = LocalDateTime.ofInstant(Instant.ofEpochMilli(loadedEvent.startTime.toLong()), zoneId)
				val end = LocalDateTime.ofInstant(Instant.ofEpochMilli(loadedEvent.endTime.toLong()), zoneId)
				val formatter = DateTimeFormatter.ofPattern("HH:mm")
				val isAllDay = isAllDayEventByTimes(
					Date.from(Instant.ofEpochMilli(loadedEvent.startTime.toLong())),
					Date.from(Instant.ofEpochMilli(loadedEvent.endTime.toLong()))
				) || (loadedEvent.startTime.toLong() < todayMidnight.timeInMillis && loadedEvent.endTime.toLong() >= tomorrowMidnight.timeInMillis)

				val event = UIEvent(
					calendarId,
					loadedEvent.id,
					settings.calendars[calendarId]?.color ?: "2196f3",
					loadedEvent.summary,
					start.format(formatter),
					end.format(formatter),
					isAllDay,
					loadedEvent.startTime
				)

				if (isAllDay) {
					allDayEvents.add(event)
				} else {
					normalEvents.add(event)
				}
			}
		}

		normalEvents.sortWith(Comparator<UIEvent> { a, b ->
			when {
				a.startTimestamp > b.startTimestamp -> 1
				a.startTimestamp < b.startTimestamp -> -1
				else -> 0
			}
		})

		_uiState.value = WidgetUIData(normalEvents, allDayEvents)

		return uiState.value
	}

	suspend fun getLoggedInUser(context: Context): String? {
		try {
			return repository.loadSettings(context, widgetId)?.userId
		} catch (e: IOException) {
			WidgetError(e.message ?: "", e.stackTraceToString(), WidgetErrorType.UNEXPECTED)
			Log.e(
				WidgetConfigViewModel.TAG,
				"Error on Data Store while loading Widget Settings: ${e.stackTraceToString()}"
			)
		} catch (e: Exception) {
			_error.value = WidgetError(e.message ?: "", e.stackTraceToString(), WidgetErrorType.UNEXPECTED)
			Log.e(
				WidgetConfigViewModel.TAG,
				"Unexpected error while loading Widget Settings: ${e.stackTraceToString()}"
			)
		}

		return null
	}
}