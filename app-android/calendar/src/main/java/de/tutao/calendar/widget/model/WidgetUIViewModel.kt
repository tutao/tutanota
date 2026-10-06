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
import de.tutao.calendar.R
import de.tutao.calendar.widget.WidgetUpdateTrigger
import de.tutao.calendar.widget.data.BirthdayEventDao
import de.tutao.calendar.widget.data.CalendarEventDao
import de.tutao.calendar.widget.data.CalendarEventListDao
import de.tutao.calendar.widget.data.LastSyncDao
import de.tutao.calendar.widget.data.SettingsDao
import de.tutao.calendar.widget.data.UIEvent
import de.tutao.calendar.widget.data.WidgetRepository
import de.tutao.calendar.widget.data.WidgetUIState
import de.tutao.calendar.widget.error.WidgetError
import de.tutao.calendar.widget.error.WidgetErrorType
import de.tutao.calendar.widget.widgetDataRepository
import de.tutao.calendar.widget.widgetDataStore
import de.tutao.tutasdk.GeneratedId
import de.tutao.tutasdk.LoginException
import de.tutao.tutasdk.Sdk
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.IdTuple
import de.tutao.tutashared.SdkFileClient
import de.tutao.tutashared.SdkRestClient
import de.tutao.tutashared.TempDir
import de.tutao.tutashared.base64ToBase64Url
import de.tutao.tutashared.credentials.CredentialsEncryptionFactory
import de.tutao.tutashared.data.AppDatabase
import de.tutao.tutashared.file.TempFs
import de.tutao.tutashared.ipc.CalendarOpenAction
import de.tutao.tutashared.ipc.NativeCredentialsFacade
import de.tutao.tutashared.ipc.UnencryptedCredentials
import de.tutao.tutashared.isAllDayEventByTimes
import de.tutao.tutashared.push.toSdkCredentials
import de.tutao.tutashared.remote.RemoteStorage
import de.tutao.tutashared.toBase64
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import java.security.SecureRandom
import java.time.Instant
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneId
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import java.util.Calendar
import java.util.Date
import kotlin.math.max
import kotlin.math.min
import kotlin.time.measureTimedValue

class WidgetUIViewModel(
	private val repository: WidgetRepository,
	private val widgetId: Int,
	private val credentialsFacade: NativeCredentialsFacade,
	private val cryptoFacade: AndroidNativeCryptoFacade,
	private var sdk: Sdk?,
	private val calendar: Calendar,
	private val birthdayStrings: BirthdayStrings
) : ViewModel() {

	companion object {
		private const val TAG = "WidgetUIViewModel"

		fun init(context: Context, widgetId: Int): WidgetUIViewModel {
			Log.d(this.TAG, "[$widgetId] Creating new widgetUiViewModel")
			val db = AppDatabase.getDatabase(context, true)
			val remoteStorage = RemoteStorage(db)
			val tempDir = TempDir(context)
			val tempFs = TempFs(context, SecureRandom(), tempDir)
			val crypto = AndroidNativeCryptoFacade(context, tempFs)
			val nativeCredentialsFacade = CredentialsEncryptionFactory.create(context, crypto, db)
			val birthdayStrings = BirthdayStrings(
				context.getString(R.string.birthdayEvent_title),
				context.getString(R.string.birthdayEventAge_title)
			)
			val sdk = try {
				Sdk(remoteStorage.getRemoteUrl()!!, SdkRestClient(), SdkFileClient(context.filesDir))
			} catch (e: Exception) {
				Log.e(
					this.TAG,
					"[$widgetId] Failed to initialize SDK, falling back to cached events if available. $e"
				)
				null
			}

			return WidgetUIViewModel(
				context.widgetDataRepository,
				widgetId,
				nativeCredentialsFacade,
				crypto,
				sdk,
				Calendar.getInstance(),
				birthdayStrings
			)
		}
	}

	private val _uiState = MutableStateFlow<WidgetUIState>(WidgetUIState.NewlyCreated)
	val uiState: StateFlow<WidgetUIState> = _uiState.asStateFlow()

	suspend fun loadUIState(
		widgetDataStore: DataStore<Preferences>,
		widgetCacheDataStore: DataStore<Preferences>,
		now: LocalDateTime
	): WidgetUIState {
		Log.i(TAG, "[$widgetId] Init loadUIState")
		val zoneId = this.calendar.timeZone.toZoneId()

		val widgetStoredState = this.getWidgetStoredState(widgetDataStore)
		if (widgetStoredState == null) {
			Log.w(TAG, "[$widgetId] No previous stored settings state found, probably missing configuration!")
			Log.d(TAG, "[$widgetId] Current WidgetUIViewModel value is: ${uiState.value}")
			return uiState.value
		}

		val (settings, calendars, credentials, lastSync) = widgetStoredState
		Log.i(TAG, "[$widgetId] Loaded stored widget $widgetId state. Last sync info $lastSync")

		if (_uiState.value is WidgetUIState.NewConfigurationProvided) {
			_uiState.value = WidgetUIState.Loading
		}

		// Force is set as True when worker detects that it's a new day
		val forceRemoteEventsFetch = lastSync?.force ?: false

		Log.d(TAG, "[$widgetId] Starting to fetch calendar events")
		val calendarToEventsListMap: Map<GeneratedId, CalendarEventListDao> = this.getCalendarEvents(
			(lastSync == null || lastSync.trigger == WidgetUpdateTrigger.APP || lastSync.trigger == WidgetUpdateTrigger.SETTINGS || forceRemoteEventsFetch) && this.sdk != null,
			this.sdk,
			credentials,
			widgetCacheDataStore,
			settings,
			calendars
		)

		val startOfToday = now.toLocalDate()
		val daysAndEvents: Array<List<UIEvent>> =
			arrayOf(listOf(), listOf(), listOf(), listOf(), listOf(), listOf(), listOf())

		calendarToEventsListMap.forEach { (calendarId, eventList) ->
			Log.d(TAG, "[$widgetId] Creating UIEvents from calendar $calendarId")
			val shortAndLongEvents: List<CalendarEventDao> = eventList.shortEvents.plus(eventList.longEvents)

			for (eventDao: CalendarEventDao in shortAndLongEvents) {
				for (dayIndex in 0..<daysAndEvents.size) {

					val currentDayMidnightInstantLocalZone =
						startOfToday.atStartOfDay(zoneId).plus(dayIndex.toLong(), ChronoUnit.DAYS).toInstant()
					val nextDayMidnightInstantLocalZone = startOfToday
						.plusDays(1 + dayIndex.toLong())
						.atStartOfDay(zoneId)
						.toInstant()

					val currentDayMidnightInstantUTC =
						startOfToday.atStartOfDay(ZoneId.of("UTC")).plus(dayIndex.toLong(), ChronoUnit.DAYS).toInstant()

					val nextDayMidnightInstantUTC =
						startOfToday.atStartOfDay(ZoneId.of("UTC")).plus(1 + dayIndex.toLong(), ChronoUnit.DAYS)
							.toInstant()

					val eventStartInstant = Instant.ofEpochMilli(eventDao.startTime.toLong())
					val eventEndInstant = Instant.ofEpochMilli(eventDao.endTime.toLong())

					val eventStartUTC = Date.from(eventStartInstant)
					val eventEndUTC = Date.from(eventEndInstant)

					// Apply time zone for displaying string clock times
					val eventStartLocalTime = LocalDateTime.ofInstant(eventStartInstant, zoneId)
					val eventEndLocalTime = LocalDateTime.ofInstant(eventEndInstant, zoneId)

					var uiEventStartMax: Long
					var uiEventEndMin: Long

					// for all day events we want to do the start/end limit checking using the UTC midnight instants not the local time midnight instant
					if (isAllDayEventByTimes(eventStartUTC, eventEndUTC)) {
						uiEventStartMax = max(
							currentDayMidnightInstantUTC.toEpochMilli(),
							eventDao.startTime.toLong()
						)    /* will equal today midnight if the event starts before today */
						uiEventEndMin = min(
							nextDayMidnightInstantUTC.toEpochMilli(),
							eventDao.endTime.toLong()
						) /* will equal tomorrow midnight if event ends after today */
					} else {
						uiEventStartMax = max(
							currentDayMidnightInstantLocalZone.toEpochMilli(),
							eventDao.startTime.toLong()
						)    /* will equal today midnight if the event starts before today */
						uiEventEndMin = min(
							nextDayMidnightInstantLocalZone.toEpochMilli(),
							eventDao.endTime.toLong()
						) /* will equal tomorrow midnight if event ends after today */
					}
					val eventStartsAfterToday = uiEventStartMax >= uiEventEndMin
					val eventEndsBeforeToday = uiEventEndMin <= uiEventStartMax

					if (eventEndsBeforeToday || eventStartsAfterToday) {
						// Will be true if the event starts after or ends before the day we are currently iterating on
						continue
					}

					// Handle logic for modifying string related to all day events and events spanning multiple days
					val eventTakesEntireDay =
						eventStartInstant < currentDayMidnightInstantLocalZone && eventEndInstant >= nextDayMidnightInstantLocalZone
					val eventStartsBeforeTodayAndEndsToday =
						eventStartInstant < currentDayMidnightInstantLocalZone && eventEndInstant < nextDayMidnightInstantLocalZone
					val eventStartsTodayAndEndsLater =
						eventStartInstant >= currentDayMidnightInstantLocalZone && eventEndInstant >= nextDayMidnightInstantLocalZone

					val timesString = if (eventStartsBeforeTodayAndEndsToday) {
						// if event starts on a previous day and ends today, communicate this
						"Ends at " + eventEndLocalTime.format(UIEvent.dateFormatter)
					} else if (eventStartsTodayAndEndsLater) {
						// if event starts today and continues on another day, communicate this
						"Starts at " + eventStartLocalTime.format(UIEvent.dateFormatter)
					} else {
						// if event starts and ends on same day, display times normally
						eventStartLocalTime.format(UIEvent.dateFormatter) + " - " + eventEndLocalTime.format(UIEvent.dateFormatter)
					}
					// determine if event will be considered all day based on times
					val isConsideredAllDay = isAllDayEventByTimes(
						Date.from(eventStartInstant), Date.from(eventEndInstant)
					) || eventTakesEntireDay // if event starts on previous day and ends on later day, display it like an all-day event.

					// We need these instants for sorting
					val uiEventStartLocalDateTime =
						LocalDateTime.ofInstant(Instant.ofEpochMilli(uiEventStartMax), zoneId)
					val uiEventEndLocalDateTime = LocalDateTime.ofInstant(Instant.ofEpochMilli(uiEventEndMin), zoneId)

					// create the item that we will show in the widget UI
					val uiEvent = UIEvent(
						calendarId,
						eventDao.id,
						settings.calendars[calendarId]?.color ?: "2196f3",
						eventDao.summary,
						uiEventStartLocalDateTime.format(UIEvent.dateFormatter),
						uiEventEndLocalDateTime.format(UIEvent.dateFormatter),
						isConsideredAllDay,
						timesString,
						isBirthday = false,
						startsBeforeTodayAndEndsToday = eventStartsBeforeTodayAndEndsToday
					)

					daysAndEvents[dayIndex] = daysAndEvents[dayIndex].plus(uiEvent)
				}
			}
			for (birthdayEventDao: BirthdayEventDao in eventList.birthdayEvents) {
				val eventStartAsInstant = Instant.ofEpochMilli(birthdayEventDao.eventDao.startTime.toLong())

				val eventLocalStartTime = LocalDateTime.ofInstant(eventStartAsInstant, zoneId)
				val eventLocalEndTime =
					LocalDateTime.ofInstant(
						Instant.ofEpochMilli(birthdayEventDao.eventDao.endTime.toLong()),
						zoneId
					)
				val uiEvent = UIEvent(
					calendarId,
					birthdayEventDao.eventDao.id,
					calendarColor = settings.calendars[calendarId]?.color ?: "2196f3",
					summary = buildBirthdayEventTitle(birthdayEventDao),
					eventLocalStartTime.format(UIEvent.dateFormatter),
					eventLocalEndTime.format(UIEvent.dateFormatter),
					isDisplayedAsAllDay = true,
					"",
					isBirthday = true
				)

				val eventStartDate =
					Instant.ofEpochMilli(birthdayEventDao.eventDao.startTime.toLong()).atZone(ZoneOffset.UTC)
						.toLocalDate()

				// we get the index differently for birthday events because we know they will always only be a single instance of an all day event.
				// so much of the complex logic for other types of events is not necessary.
				val index = ChronoUnit.DAYS.between(startOfToday, eventStartDate)
				daysAndEvents[index.toInt()] = daysAndEvents[index.toInt()].plus(uiEvent)
			}
		}

		Log.d(TAG, "[$widgetId] Sorting events by start time")
		// we sorted events in a day to put them in the correct order.
		for ((index, eventsOfDay) in daysAndEvents.withIndex()) {
			val sortedEventsOfDay = eventsOfDay.sortedWith(Comparator<UIEvent> { a, b ->
				Log.d(TAG, "start time for event A with summary \"${a.summary}\": ${a.formattedStartTime}")
				Log.d(TAG, "start time for event B with summary \"${b.summary}\" ${b.formattedStartTime}")
				// compares the events' local start times, ignoring date. This might not always give us the results we want!
				// e.g.: if the event starts at 5AM on October 5 and ends on 4pm October 6, the entry on the Oct 6 will appear in the widget
				// before an event that starts at 6am Oct 6
				// To get the result that hak wants we should conditionally sort using the End Date of events that continue from a previous date.
				val compareResult =
					LocalTime.parse(a.formattedStartTime).compareTo(LocalTime.parse(b.formattedStartTime))
				Log.d(TAG, "COMPARE RESULT: ${compareResult.toString()}")
				// Compare result 1 means a > b
				compareResult
			})
			daysAndEvents[index] = sortedEventsOfDay
		}

		Log.d(TAG, "[$widgetId] Assigning sorted events to uiState")
		_uiState.value = WidgetUIState.Available(daysAndEvents)

		return uiState.value
	}

	private suspend fun getWidgetStoredState(widgetDataStore: DataStore<Preferences>): WidgetSetupData? {
		var settings: SettingsDao? = null
		var calendars: List<String> = listOf()
		var lastSync: LastSyncDao? = null
		try {
			val preferences = widgetDataStore.data.first().toPreferences()

			settings = repository.decodeSettingsFromPreferences(preferences, widgetId) ?: return null
			Log.i(TAG, "[$widgetId] Widget settings has ${settings.calendars.values.size} calendars")
			settings.calendars.entries.forEach { (calendarId, calendar) ->
				Log.d(TAG, "[$widgetId] $calendarId - ${calendar.name}")
			}

			lastSync = repository.decodeLastSyncFromPreferences(preferences, widgetId)
			Log.i(TAG, "[$widgetId] Widget last sync at $lastSync")

			sdk?.let { sdk ->
				syncCalendarsColors(
					widgetDataStore,
					sdk,
					settings
				) // Silently fails so it doens't prevent events loading
			}
			calendars = settings.calendars.keys.toList()
		} catch (e: Exception) {
			Log.e(TAG, "[$widgetId] Error when loading initial UI State", e)
			// We couldn't load widget settings, so we must show an error to User
			_uiState.value =
				WidgetUIState.Error(
					error =
						WidgetError(
							"Error reading from DataStore (WidgetId $widgetId)",
							e.stackTraceToString(),
							WidgetErrorType.UNEXPECTED
						)
				)
			return null
		}

		val userId = settings.userId
		val credentials = this.credentialsFacade.loadByUserId(userId)
		if (credentials == null) {
			_uiState.value = WidgetUIState.Error(
				WidgetError(
					"Missing credentials for user ${userId}",
					"",
					WidgetErrorType.CREDENTIALS
				)
			)
			Log.w(TAG, "[$widgetId] Missing credentials for user ${userId} during widget setup")
			return null
		} else {
			return WidgetSetupData(settings, calendars, credentials, lastSync)
		}
	}

	/**
	 * Gets all the calendar events for a given list of calendars.
	 * Returns a Map of calendar IDs to CalendarEventListDaos.
	 */
	private suspend fun getCalendarEvents(
		shouldFetchFromServer: Boolean,
		sdk: Sdk?,
		credentials: UnencryptedCredentials,
		widgetCacheDataStore: DataStore<Preferences>,
		settings: SettingsDao,
		calendars: List<GeneratedId>
	): Map<GeneratedId, CalendarEventListDao> {
		Log.d(TAG, "shouldFetchFromServer: $shouldFetchFromServer")
		if (shouldFetchFromServer && sdk != null) {
			try {
				val sdkCredentials = credentials.toSdkCredentials()
				val loggedInSdk = sdk.login(sdkCredentials)
				var events: Map<GeneratedId, CalendarEventListDao>
				val time = measureTimedValue {
					events = repository.loadEvents(
						widgetCacheDataStore,
						widgetId,
						settings.userId,
						calendars,
						credentials,
						loggedInSdk,
						cryptoFacade,
					)
				}
				Log.d(TAG, "[$widgetId] LoadEvents time: $time")

				return events
			} catch (e: LoginException) {
				// Fallback to cached events. We don't set an error here because we still able to display "something"
				// to the user.
				Log.e(
					TAG,
					"[$widgetId] Missing credentials for user ${settings.userId} when trying to load widget content}",
					e
				)
				return repository.loadEventsFromCache(
					widgetCacheDataStore,
					widgetId,
					calendars,
					credentials,
					cryptoFacade
				)
			} catch (e: Exception) {
				Log.e(TAG, "[$widgetId] Unknown exception occurred", e)

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

	private suspend fun syncCalendarsColors(
		widgetDataStore: DataStore<Preferences>,
		sdk: Sdk,
		settings: SettingsDao
	) {
		try {
			Log.i(TAG, "[$widgetId] Fetching new calendar data from server")
			val loadedCalendars = repository.loadCalendars(settings.userId, credentialsFacade, sdk)
			Log.i(TAG, "[$widgetId] Successfully fetched ${loadedCalendars.size} calendars")
			for (key in loadedCalendars.keys) {
				settings.calendars[key]?.color = loadedCalendars[key]?.color ?: continue
			}
			repository.storeSettings(widgetDataStore, widgetId, settings)
			Log.i(TAG, "[$widgetId] Cached calendar data updated successfully!")
		} catch (e: LoginException.ApiCall) {
			// Failed to login into SDK, probably because of connection issues
			Log.e(
				TAG,
				"[$widgetId] Calendar colors could not be loaded due credential issues. Falling back to cached values.",
				e
			)
		} catch (e: IOException) {
			// We couldn't store widget settings, so calendar colors will stay cached
			Log.e(TAG, "[$widgetId] Failed to store calendar colors. Falling back to cached values.", e)
		} catch (e: Exception) {
			// Something else happened, we catch here to continue loading events with cached calendar values
			Log.e(TAG, "[$widgetId] Failed to retrieve calendar colors. Falling back to cached values.", e)
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
			Log.i(TAG, "[$widgetId] Loading logged in user.")
			return repository.loadSettings(context.widgetDataStore, widgetId)?.userId
		} catch (e: IOException) {
			WidgetError(e.message ?: "", e.stackTraceToString(), WidgetErrorType.UNEXPECTED)
			Log.e(
				WidgetConfigViewModel.TAG,
				"[$widgetId] Error on Data Store while loading Widget Settings: ${e.stackTraceToString()}"
			)
		} catch (e: Exception) {
			_uiState.value = WidgetUIState.Error(
				WidgetError(e.message ?: "", e.stackTraceToString(), WidgetErrorType.UNEXPECTED)
			)
			Log.e(
				WidgetConfigViewModel.TAG,
				"[$widgetId] Unexpected error while loading Widget Settings: ${e.stackTraceToString()}"
			)
		}

		return null
	}

	fun setAsConfigured() {
		_uiState.value = WidgetUIState.NewConfigurationProvided
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