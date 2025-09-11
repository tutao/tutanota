package de.tutao.calendar.widget.model

import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.datastore.core.IOException
import androidx.glance.action.Action
import androidx.glance.appwidget.action.actionStartActivity
import androidx.lifecycle.ViewModel
import de.tutao.calendar.MainActivity
import de.tutao.calendar.R
import de.tutao.calendar.widget.WidgetUpdateTrigger
import de.tutao.calendar.widget.data.BirthdayEventDao
import de.tutao.calendar.widget.data.LastSyncDao
import de.tutao.calendar.widget.data.SettingsDao
import de.tutao.calendar.widget.data.UIEvent
import de.tutao.calendar.widget.data.WidgetRepository
import de.tutao.calendar.widget.data.WidgetUIData
import de.tutao.calendar.widget.error.WidgetError
import de.tutao.calendar.widget.error.WidgetErrorType
import de.tutao.tutasdk.Sdk
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.IdTuple
import de.tutao.tutashared.base64ToBase64Url
import de.tutao.tutashared.ipc.CalendarOpenAction
import de.tutao.tutashared.ipc.NativeCredentialsFacade
import de.tutao.tutashared.isAllDayEventByTimes
import de.tutao.tutashared.midnightInDate
import de.tutao.tutashared.push.toSdkCredentials
import de.tutao.tutashared.toBase64
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneId
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import java.util.Calendar
import java.util.Date

class WidgetUIViewModel(
	private val repository: WidgetRepository,
	private val widgetId: Int,
	private val credentialsFacade: NativeCredentialsFacade,
	private val cryptoFacade: AndroidNativeCryptoFacade,
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
		val allDayEvents: HashMap<Long, List<UIEvent>> = HashMap()
		val normalEvents: HashMap<Long, List<UIEvent>> = HashMap()

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

		val settings: SettingsDao?
		val lastSync: LastSyncDao?
		var calendars = listOf<String>()

		try {
			settings = repository.loadSettings(context, widgetId) ?: return WidgetUIData(normalEvents, allDayEvents)
			lastSync = repository.loadLastSync(context, widgetId)

			if (sdk != null) {
				val loadedCalendars = repository.loadCalendars(settings.userId, credentialsFacade, sdk)
				for (key in loadedCalendars.keys) {
					settings.calendars[key]?.color = loadedCalendars[key]?.color ?: continue
				}
				repository.storeSettings(context, widgetId, settings)
			}

			calendars = settings.calendars.keys.toList()
		} catch (e: Exception) {
			// We couldn't load widget settings, so we must show an error to User
			_error.value = WidgetError(
				"Something went wrong when reading from DataStore, WidgetId $widgetId",
				e.stackTraceToString(),
				WidgetErrorType.UNEXPECTED
			)
			return null
		}

		val credentials = try {
			this.credentialsFacade.loadByUserId(settings.userId)
		} catch (_: Exception) {
			null
		}

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
					val loggedInSdk = this.sdk.login(credentials.toSdkCredentials())

					repository.loadEvents(
						context,
						widgetId,
						settings.userId,
						calendars,
						credentials,
						loggedInSdk,
						cryptoFacade
					)
				} catch (e: Exception) {
					// Fallback to cached events. We don't set an error here because we still able to display "something"
					// to the user.
					Log.w(
						TAG,
						"Missing credentials for user ${settings.userId} during widget setup. ${e.stackTraceToString()}"
					)
					repository.loadEvents(context, widgetId, calendars, credentials, cryptoFacade)
				}
			} else {
				repository.loadEvents(context, widgetId, calendars, credentials, cryptoFacade)
			}

		val startOfToday = midnightInDate(ZoneId.systemDefault(), LocalDateTime.now())
		normalEvents[startOfToday] = listOf() // The first day should always be included even if there are no events
		allDayEvents[startOfToday] = listOf()

		calendarToEventsListMap.forEach { (calendarId, eventList) ->
			eventList.shortEvents.plus(eventList.longEvents).forEach { loadedEvent ->
				val zoneId = ZoneId.systemDefault()
				val startAsInstant = Instant.ofEpochMilli(loadedEvent.startTime.toLong())

				val start = LocalDateTime.ofInstant(startAsInstant, zoneId)
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
					loadedEvent.startTime.toLong()
				)

				val referenceDate = if (isAllDay) {
					val eventDate = LocalDateTime.ofInstant(startAsInstant, ZoneOffset.UTC)
					LocalDateTime
						.of(LocalDate.of(eventDate.year, eventDate.month, eventDate.dayOfMonth), LocalTime.MIDNIGHT)
						.atZone(ZoneId.systemDefault()).toLocalDateTime()
				} else {
					start
				}

				val startOfDay = midnightInDate(zoneId, referenceDate)
				if (startOfDay >= startOfToday) {
					if (!normalEvents.containsKey(startOfDay)) {
						normalEvents[startOfDay] = listOf()
						allDayEvents[startOfDay] = listOf()
					}

					if (isAllDay) {
						allDayEvents[startOfDay] = allDayEvents[startOfDay]!!.plus(event)
					} else {
						normalEvents[startOfDay] = normalEvents[startOfDay]!!.plus(event)
					}
				}
			}

			eventList.birthdayEvents.map {
				val zoneId = ZoneId.systemDefault()
				val startAsInstant = Instant.ofEpochMilli(it.eventDao.startTime.toLong())
				val start = LocalDateTime.ofInstant(startAsInstant, zoneId)
				val end = LocalDateTime.ofInstant(Instant.ofEpochMilli(it.eventDao.endTime.toLong()), zoneId)
				val formatter = DateTimeFormatter.ofPattern("HH:mm")

				val event = UIEvent(
					calendarId,
					it.eventDao.id,
					calendarColor = settings.calendars[calendarId]?.color ?: "2196f3",
					summary = buildBirthdayEventTitle(it, context),
					start.format(formatter),
					end.format(formatter),
					isAllDay = true,
					it.eventDao.startTime.toLong(),
					isBirthday = true
				)

				val eventDate = LocalDateTime.ofInstant(startAsInstant, ZoneOffset.UTC)
				val referenceDate = LocalDateTime
					.of(LocalDate.of(eventDate.year, eventDate.month, eventDate.dayOfMonth), LocalTime.MIDNIGHT)
					.atZone(ZoneId.systemDefault()).toLocalDateTime()

				val startOfDay = midnightInDate(zoneId, referenceDate)
				if (startOfDay >= startOfToday) {

					if (!allDayEvents.containsKey(startOfDay)) {
						normalEvents[startOfDay] = listOf()
						allDayEvents[startOfDay] = listOf()
					}
					allDayEvents[startOfDay] = allDayEvents[startOfDay]!!.plus(event)
				}
			}
		}

		normalEvents.forEach() { (startOfDay, events) ->
			val sorted = events.sortedWith(Comparator<UIEvent> { a, b ->
				when {
					a.startTimestamp > b.startTimestamp -> 1
					a.startTimestamp < b.startTimestamp -> -1
					else -> 0
				}
			})

			normalEvents[startOfDay] = sorted
		}

		_uiState.value = WidgetUIData(normalEvents, allDayEvents)

		return uiState.value
	}

	private fun buildBirthdayEventTitle(event: BirthdayEventDao, context: Context): String {
		if (event.contact.age == null) {
			return context.getString(R.string.birthdayEvent_title).replace("{name}", event.contact.name)
		}

		val age = context.getString(R.string.birthdayEventAge_title).replace(
			"{age}",
			event.contact.age.toString()
		)

		return "${event.contact.name} ($age)"
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

fun openCalendarAgenda(
	context: Context,
	userId: String? = "",
	date: LocalDateTime = LocalDateTime.now(),
	eventId: IdTuple? = null
): Action {
	val openCalendarAgenda = Intent(context, MainActivity::class.java)
	openCalendarAgenda.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
	openCalendarAgenda.action = MainActivity.OPEN_CALENDAR_ACTION
	openCalendarAgenda.putExtra(MainActivity.OPEN_USER_MAILBOX_USERID_KEY, userId)
	openCalendarAgenda.putExtra(
		MainActivity.OPEN_CALENDAR_IN_APP_ACTION_KEY,
		CalendarOpenAction.AGENDA.value
	)

	openCalendarAgenda.putExtra(
		MainActivity.OPEN_CALENDAR_DATE_KEY,
		date.format(DateTimeFormatter.ISO_DATE_TIME.withZone(ZoneId.systemDefault()))
	)
	if (eventId != null) {
		openCalendarAgenda.putExtra(
			MainActivity.OPEN_CALENDAR_EVENT_KEY,
			"${eventId.listId}/${eventId.elementId}".toByteArray().toBase64().base64ToBase64Url()
		)
	}

	return actionStartActivity(openCalendarAgenda)
}