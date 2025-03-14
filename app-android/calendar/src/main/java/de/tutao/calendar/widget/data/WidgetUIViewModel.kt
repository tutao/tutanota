package de.tutao.calendar.widget.data

import android.content.Context
import android.util.Log
import androidx.compose.runtime.saveable.Saver
import androidx.compose.runtime.saveable.listSaver
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import de.tutao.tutasdk.GeneratedId
import de.tutao.tutashared.isAllDayEventByTimes
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Calendar
import java.util.Date

data class UIEvent(
	val calendarId: GeneratedId,
	val calendarColor: String,
	val summary: String,
	val startTime: String,
	val endTime: String,
	val isAllDay: Boolean,
)

data class WidgetUIData(
	val normalEvents: List<UIEvent>,
	val allDayEvents: List<UIEvent>,
	val allDayEventsCount: Int = allDayEvents.size
)

class WidgetUIViewModel(private val context: Context, private val widgetId: Int) : ViewModel() {
	private val repository: WidgetRepository = WidgetRepository(context)

	private val _isLoading = MutableStateFlow<Boolean>(false);
	val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()


	private val _settingsState = MutableStateFlow<SettingsDao?>(null)
	val settingsState: StateFlow<SettingsDao?> = _settingsState.asStateFlow()

	private val _uiState = MutableStateFlow<WidgetUIData?>(null)
	val uiState: StateFlow<WidgetUIData?> = _uiState.asStateFlow()

	init {
		Log.d(TAG, "init")
		_isLoading.value = true
		_settingsState.value = repository.loadSettings(widgetId)
		loadUIState()
	}

	fun loadUIState() {
		Log.d(TAG, "loadUIState start")
		if (settingsState.value == null) return
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

		viewModelScope.launch {
			Log.d(TAG, "loadUIState coroutine start")
			val calendarToEventsListMap =
				repository.loadEvents(settingsState.value!!.userId, settingsState.value!!.calendars.keys.toList())

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
						settingsState.value!!.calendars[calendarId]?.color ?: "2196f3",
						loadedEvent.summary,
						start.format(formatter),
						end.format(formatter),
						isAllDay
					)

					if (isAllDay) {
						allDayEvents.add(event)
					} else {
						normalEvents.add(event)
					}
				}
			}

			_uiState.value = WidgetUIData(normalEvents, allDayEvents)
			Log.d(TAG, "loadUIState coroutine end")
		}
	}

	fun getLoggedInUser(): String? {
		return settingsState.value?.userId
	}

	companion object {
		private const val TAG = "WidgetUIViewModel"

		val Saver: Saver<WidgetUIViewModel, *> = listSaver(
			save = {
				Log.d(TAG, "Saver save")
				listOf(it.context, it.widgetId)
			},
			restore = {
				Log.d(TAG, "Saver restore")
				WidgetUIViewModel(
					context = it[0] as Context,
					widgetId = it[1] as Int,
				)
			}
		)
	}
}