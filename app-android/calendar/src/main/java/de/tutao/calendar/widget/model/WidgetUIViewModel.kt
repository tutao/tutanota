package de.tutao.calendar.widget.model

import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.datastore.core.DataStore
import androidx.datastore.core.IOException
import androidx.datastore.preferences.core.Preferences
import androidx.glance.action.Action
import androidx.glance.appwidget.action.actionStartActivity
import androidx.lifecycle.ViewModel
import de.tutao.calendar.MainActivity
import de.tutao.calendar.widget.WidgetUpdateTrigger
import de.tutao.calendar.widget.data.BirthdayEventDao
import de.tutao.calendar.widget.data.CalendarEventDao
import de.tutao.calendar.widget.data.CalendarEventListDao
import de.tutao.calendar.widget.data.LastSyncDao
import de.tutao.calendar.widget.data.SettingsDao
import de.tutao.calendar.widget.data.UIEvent
import de.tutao.calendar.widget.data.WidgetRepository
import de.tutao.calendar.widget.data.WidgetUIData
import de.tutao.calendar.widget.error.WidgetError
import de.tutao.calendar.widget.error.WidgetErrorType
import de.tutao.calendar.widget.widgetDataStore
import de.tutao.tutasdk.GeneratedId
import de.tutao.tutasdk.LoginException
import de.tutao.tutasdk.Sdk
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.IdTuple
import de.tutao.tutashared.base64ToBase64Url
import de.tutao.tutashared.ipc.CalendarOpenAction
import de.tutao.tutashared.ipc.NativeCredentialsFacade
import de.tutao.tutashared.ipc.UnencryptedCredentials
import de.tutao.tutashared.isAllDayEventByTimes
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
	private val sdk: Sdk?,
	private val calendar: Calendar,
	private val birthdayStrings: BirthdayStrings
) : ViewModel() {
	private val _uiState = MutableStateFlow<WidgetUIData?>(null)
	val uiState: StateFlow<WidgetUIData?> = _uiState.asStateFlow()

	private val _error = MutableStateFlow<WidgetError?>(null)
	val error: StateFlow<WidgetError?> = _error.asStateFlow()

	companion object {
		private const val TAG = "WidgetUIViewModel"
	}

	suspend fun loadUIState(
		widgetDataStore: DataStore<Preferences>,
		widgetCacheDataStore: DataStore<Preferences>,
		now: LocalDateTime
	): WidgetUIData? {
		Log.i(TAG, "Init loadUIState")
		val allDayEvents: HashMap<LocalDate, List<UIEvent>> = HashMap()
		val normalEvents: HashMap<LocalDate, List<UIEvent>> = HashMap()
		val zoneId = this.calendar.timeZone.toZoneId()

		val (settings, calendars, credentials, lastSync) = this.getInitialUiState(widgetDataStore)
			?: return WidgetUIData(
				hashMapOf(),
				hashMapOf()
			)

		// Force is set as True when worker detects that it's a new day
		val forceRemoteEventsFetch = lastSync?.force ?: false
		val calendarToEventsListMap = this.getCalendarEvents(
			(lastSync == null || lastSync.trigger == WidgetUpdateTrigger.APP || forceRemoteEventsFetch) && this.sdk != null,
			this.sdk,
			credentials,
			widgetCacheDataStore,
			settings,
			calendars
		)

		val startOfToday = now.toLocalDate()
		normalEvents[startOfToday] = listOf() // The first day should always be included even if there are no events
		allDayEvents[startOfToday] = listOf()

		val todayMidnight = startOfToday.atStartOfDay(zoneId).toInstant()
		val tomorrowMidnight = startOfToday
			.plusDays(1)
			.atStartOfDay(zoneId)
			.toInstant()

		calendarToEventsListMap.forEach { (calendarId, eventList) ->
			Log.d(TAG, "Creating UIEvents from calendar $calendarId")

			val shortAndLongEvents = eventList.shortEvents.plus(eventList.longEvents)

			shortAndLongEvents.forEach { loadedEvent ->
				val event = this.makeUiEvent(
					loadedEvent,
					todayMidnight,
					tomorrowMidnight,
					zoneId,
					calendarId,
					settings
				)

				val eventStartAsInstant = Instant.ofEpochMilli(loadedEvent.startTime.toLong())
				val eventStartDate = if (event.isDisplayedAsAllDay) {
					eventStartAsInstant.atZone(ZoneId.of(ZoneOffset.UTC.id)).toLocalDate()
				} else {
					val eventLocalStartTime = LocalDateTime.ofInstant(eventStartAsInstant, zoneId)
					eventLocalStartTime.toLocalDate()
				}

				val eventHappensTodayOrInTheFuture = !eventStartDate.isBefore(startOfToday)
				if (eventHappensTodayOrInTheFuture) {
					if (!normalEvents.containsKey(eventStartDate)) {
						normalEvents[eventStartDate] = listOf()
						allDayEvents[eventStartDate] = listOf()
					}

					if (event.isDisplayedAsAllDay) {
						allDayEvents[eventStartDate] = allDayEvents[eventStartDate]!!.plusElement(event)
					} else {
						normalEvents[eventStartDate] = normalEvents[eventStartDate]!!.plusElement(event)
					}
				}
			}

			Log.d(TAG, "EventsList after processing short and long events for calendar $calendarId:")
			normalEvents.entries.forEach { (day, events) ->
				Log.d(
					TAG,
					"Day: $day has ${events.size} normal events and ${allDayEvents[day]?.size ?: 0} All-day events"
				)
			}

			eventList.birthdayEvents.map {
				val eventStartAsInstant = Instant.ofEpochMilli(it.eventDao.startTime.toLong())

				val eventLocalStartTime = LocalDateTime.ofInstant(eventStartAsInstant, zoneId)
				val eventLocalEndTime =
					LocalDateTime.ofInstant(Instant.ofEpochMilli(it.eventDao.endTime.toLong()), zoneId)
				val formatter = DateTimeFormatter.ofPattern("HH:mm")
				val event = UIEvent(
					calendarId,
					it.eventDao.id,
					calendarColor = settings.calendars[calendarId]?.color ?: "2196f3",
					summary = buildBirthdayEventTitle(it),
					eventLocalStartTime.format(formatter),
					eventLocalEndTime.format(formatter),
					isDisplayedAsAllDay = true,
					isBirthday = true
				)

				val eventStartDate = eventStartAsInstant.atZone(ZoneId.of(ZoneOffset.UTC.id)).toLocalDate()
				val eventHappensTodayOrInTheFuture = !eventStartDate.isBefore(startOfToday)
				if (eventHappensTodayOrInTheFuture) {
					if (!allDayEvents.containsKey(eventStartDate)) {
						normalEvents[eventStartDate] = listOf()
						allDayEvents[eventStartDate] = listOf()
					}
					allDayEvents[eventStartDate] = allDayEvents[eventStartDate]!!.plus(event)
				}
			}
		}

		Log.d(TAG, "Sorting events by start time")
		normalEvents.forEach() { (startOfDay, events) ->
			val sorted = events.sortedWith(Comparator<UIEvent> { a, b ->
				LocalTime.parse(a.formattedStartTime).compareTo(LocalTime.parse(b.formattedStartTime))
			})

			normalEvents[startOfDay] = sorted
		}

		Log.d(TAG, "Assigning sorted events to uiState")
		_uiState.value = WidgetUIData(normalEvents, allDayEvents)

		return uiState.value
	}

	private suspend fun getInitialUiState(widgetDataStore: DataStore<Preferences>): WidgetSetupData? {
		val widgetStoredData = try {
			this.loadStoredWidgetSettingsAndUpdateCalendarRenderInfo(widgetDataStore)
		} catch (e: Exception) {
			// We couldn't load widget settings, so we must show an error to User
			_error.value = WidgetError(
				"Error reading from DataStore (WidgetId $widgetId)",
				e.stackTraceToString(),
				WidgetErrorType.UNEXPECTED
			)
			return null
		}
		if (widgetStoredData == null) {
			return null
		}

		val userId = widgetStoredData.first.userId
		val credentials = try {
			this.credentialsFacade.loadByUserId(userId)
		} catch (_: Exception) {
			null
		}
		if (credentials == null) {
			_error.value = WidgetError(
				"Missing credentials for user ${userId}",
				"",
				WidgetErrorType.CREDENTIALS
			)
			Log.w(TAG, "Missing credentials for user ${userId} during widget setup")

			return null
		}

		return WidgetSetupData(widgetStoredData.first, widgetStoredData.second, credentials, widgetStoredData.third)
	}

	private fun makeUiEvent(
		loadedEvent: CalendarEventDao,
		todayMidnight: Instant?,
		tomorrowMidnight: Instant?,
		zoneId: ZoneId?,
		calendarId: GeneratedId,
		settings: SettingsDao
	): UIEvent {
		val eventStartAsInstant = Instant.ofEpochMilli(loadedEvent.startTime.toLong())
		val eventEndAsInstant = Instant.ofEpochMilli(loadedEvent.endTime.toLong())

		val eventTakesEntireDay = eventStartAsInstant < todayMidnight && eventEndAsInstant >= tomorrowMidnight
		val isConsideredAllDay = isAllDayEventByTimes(
			Date.from(eventStartAsInstant), Date.from(eventEndAsInstant)
		) || eventTakesEntireDay

		val formatter = DateTimeFormatter.ofPattern("HH:mm")
		val eventLocalStartTime = LocalDateTime.ofInstant(eventStartAsInstant, zoneId)
		val eventLocalEndTime = LocalDateTime.ofInstant(eventEndAsInstant, zoneId)

		return UIEvent(
			calendarId,
			loadedEvent.id,
			settings.calendars[calendarId]?.color ?: "2196f3",
			loadedEvent.summary,
			eventLocalStartTime.format(formatter),
			eventLocalEndTime.format(formatter),
			isConsideredAllDay,
		)
	}

	private suspend fun getCalendarEvents(
		shouldFetchFromServer: Boolean,
		sdk: Sdk?,
		credentials: UnencryptedCredentials,
		widgetCacheDataStore: DataStore<Preferences>,
		settings: SettingsDao,
		calendars: List<GeneratedId>
	): Map<GeneratedId, CalendarEventListDao> {
		if (shouldFetchFromServer && sdk != null) {
			try {
				val loggedInSdk = sdk.login(credentials.toSdkCredentials())

				return repository.loadEvents(
					widgetCacheDataStore,
					widgetId,
					settings.userId,
					calendars,
					credentials,
					loggedInSdk,
					cryptoFacade
				)
			} catch (e: LoginException) {
				// Fallback to cached events. We don't set an error here because we still able to display "something"
				// to the user.
				Log.e(
					TAG,
					"Missing credentials for user ${settings.userId} when trying to load widget content}", e
				)
				return repository.loadEventsFromCache(
					widgetCacheDataStore,
					widgetId,
					calendars,
					credentials,
					cryptoFacade
				)
			} catch (e: Exception) {
				Log.e(TAG, "Unknown exception occurred", e)
				return repository.loadEventsFromCache(
					widgetCacheDataStore,
					widgetId,
					calendars,
					credentials,
					cryptoFacade
				)
			}
		} else {
			return repository.loadEventsFromCache(
				widgetCacheDataStore,
				widgetId,
				calendars,
				credentials,
				cryptoFacade
			)
		}
	}

	private data class WidgetSetupData(
		val userSettings: SettingsDao,
		val selectedCalendarIds: List<GeneratedId>,
		val credentials: UnencryptedCredentials,
		val lastSync: LastSyncDao?,
	)

	private suspend fun loadStoredWidgetSettingsAndUpdateCalendarRenderInfo(
		widgetDataStore: DataStore<Preferences>,
	): Triple<SettingsDao, List<GeneratedId>, LastSyncDao?>? {
		val settings = repository.loadSettings(widgetDataStore, widgetId) ?: return null
		Log.i(TAG, "Widget settings has ${settings.calendars.values.size} calendars")
		settings.calendars.entries.forEach { (calendarId, calendar) ->
			Log.d(TAG, "$calendarId - ${calendar.name}")
		}

		val lastSync = repository.loadLastSync(widgetDataStore, widgetId)
		Log.i(TAG, "Widget last sync at $lastSync")

		sdk?.let { sdk -> loadCalendars(widgetDataStore, sdk, settings) }
		val calendars = settings.calendars.keys.toList()

		return Triple(settings, calendars, lastSync)
	}

	private suspend fun loadCalendars(widgetDataStore: DataStore<Preferences>, sdk: Sdk, settings: SettingsDao) {
		try {
			Log.i(TAG, "Fetching new calendar data from server")
			val loadedCalendars = repository.loadCalendars(settings.userId, credentialsFacade, sdk)
			Log.i(TAG, "Successfully fetched ${loadedCalendars.size} calendars")
			for (key in loadedCalendars.keys) {
				settings.calendars[key]?.color = loadedCalendars[key]?.color ?: continue
			}
			repository.storeSettings(widgetDataStore, widgetId, settings)
			Log.i(TAG, "Cached calendar data updated successfully!")
		} catch (e: LoginException.ApiCall) {
			// Failed to login into SDK, probably because of connection issues
			Log.e(TAG, "Calendar colors could not be loaded due credential issues. Falling back to cached values.", e)
		} catch (e: IOException) {
			// We couldn't store widget settings, so calendar colors will stay cached
			Log.e(TAG, "Failed to store calendar colors. Falling back to cached values.", e)
		} catch (e: Exception) {
			// Something else happened, we catch here to continue loading events with cached calendar values
			Log.e(TAG, "Failed to retrieve calendar colors. Falling back to cached values.", e)
		}
	}

	private fun buildBirthdayEventTitle(event: BirthdayEventDao): String {
		if (event.contact.age == null) {
			return birthdayStrings.birthdayTitleTemplate.replace("{name}", event.contact.name)
		}

		val age = birthdayStrings.birthdayAgeTemplate.replace(
			"{age}",
			event.contact.age.toString()
		)

		return "${event.contact.name} ($age)"
	}

	suspend fun getLoggedInUser(context: Context): String? {
		try {
			return repository.loadSettings(context.widgetDataStore, widgetId)?.userId
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

data class BirthdayStrings(
	val birthdayTitleTemplate: String,
	val birthdayAgeTemplate: String
)