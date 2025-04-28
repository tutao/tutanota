package de.tutao.calendar.widget.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import de.tutao.calendar.widget.WIDGET_CACHE_DATE_PREFIX
import de.tutao.calendar.widget.WIDGET_EVENTS_CACHE
import de.tutao.calendar.widget.widgetCacheDataStore
import de.tutao.tutasdk.CalendarEvent
import de.tutao.tutasdk.GeneratedId
import de.tutao.tutasdk.LoggedInSdk
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.IdTuple
import de.tutao.tutashared.base64ToBytes
import de.tutao.tutashared.ipc.UnencryptedCredentials
import de.tutao.tutashared.toBase64
import kotlinx.coroutines.flow.first
import kotlinx.serialization.encodeToString
import java.util.Calendar
import java.util.Date
import java.util.TimeZone

class WidgetDataRepository() : WidgetRepository() {
	companion object {
		@Volatile
		private var instance: WidgetDataRepository? = null

		fun getInstance(): WidgetDataRepository {
			if (instance == null) {
				synchronized(this) {
					if (instance == null) {
						instance = WidgetDataRepository()
					}
				}
			}
			return instance!!
		}
	}

	private suspend fun updateCacheCreationDate(context: Context, widgetId: Int, now: Date) {
		val nowTimestamp = now.time

		val cacheDateIdentifier = "${WIDGET_CACHE_DATE_PREFIX}_$widgetId"
		val preferencesKey = stringPreferencesKey(cacheDateIdentifier)

		val createdAtDao = CacheDateDao(nowTimestamp)
		context.widgetCacheDataStore.edit { preferences ->
			preferences[preferencesKey] = json.encodeToString(createdAtDao)
		}
	}

	override suspend fun storeCache(
		context: Context,
		widgetId: Int,
		eventsMap: Map<GeneratedId, CalendarEventListDao>,
		cryptoFacade: AndroidNativeCryptoFacade,
		credentials: UnencryptedCredentials
	) {
		val key = credentials.databaseKey ?: return

		val encryptedEventListMap: MutableMap<GeneratedId, String> = mutableMapOf()
		for ((calendar, eventList) in eventsMap) {
			val jsonEncodedEventList = json.encodeToString(eventList)

			val encryptedData = cryptoFacade.aesEncryptData(key.data, jsonEncodedEventList.toByteArray())
			val base64String = encryptedData.toBase64()
			encryptedEventListMap[calendar] = base64String
		}

		val databaseWidgetIdentifier = "${WIDGET_EVENTS_CACHE}_$widgetId"
		val preferencesKey = stringPreferencesKey(databaseWidgetIdentifier)
		val encryptedEventListMapJson = json.encodeToString(encryptedEventListMap)

		context.widgetCacheDataStore.edit { preferences ->
			preferences[preferencesKey] = encryptedEventListMapJson
		}

		updateCacheCreationDate(context, widgetId, Date())
	}

	override suspend fun loadCache(
		context: Context,
		widgetId: Int,
		calendars: List<GeneratedId>,
		cryptoFacade: AndroidNativeCryptoFacade,
		credentials: UnencryptedCredentials
	): Map<GeneratedId, CalendarEventListDao> {
		val key = credentials.databaseKey ?: return mapOf()

		val databaseWidgetIdentifier = "${WIDGET_EVENTS_CACHE}_$widgetId"
		val preferencesKey = stringPreferencesKey(databaseWidgetIdentifier)

		val preferences = context.widgetCacheDataStore.data.first()
		val encodedEventsJson = preferences[preferencesKey] ?: return mapOf()

		val encodedEvents = json.decodeFromString<Map<GeneratedId, String>>(encodedEventsJson)
		val eventsMap: MutableMap<GeneratedId, CalendarEventListDao> = mutableMapOf()

		for ((calendar, encryptedEvents) in encodedEvents) {
			val decodedEvents = encryptedEvents.base64ToBytes()
			val decryptedEvents = cryptoFacade.aesDecryptData(key.data, decodedEvents)
			val eventsJson = String(decryptedEvents)

			eventsMap[calendar] = json.decodeFromString(eventsJson)
		}

		return eventsMap
	}

	override suspend fun loadEvents(
		context: Context,
		widgetId: Int,
		userId: GeneratedId,
		calendars: List<GeneratedId>,
		credentials: UnencryptedCredentials,
		loggedInSdk: LoggedInSdk,
		cryptoFacade: AndroidNativeCryptoFacade
	): Map<GeneratedId, CalendarEventListDao> {
		val calendarFacade = loggedInSdk.calendarFacade()
		val systemCalendar = Calendar.getInstance(TimeZone.getDefault())

		var calendarEventListMap: Map<GeneratedId, CalendarEventListDao> = HashMap()

		calendars.forEach { calendarId ->
			val events = calendarFacade.getCalendarEvents(calendarId, (systemCalendar.timeInMillis).toULong())
			calendarEventListMap = calendarEventListMap.plus(
				calendarId to CalendarEventListDao(
					events.shortEvents.toDao(),
					events.longEvents.toDao()
				)
			)
		}

		storeCache(context, widgetId, calendarEventListMap, cryptoFacade, credentials)

		return calendarEventListMap
	}

	override suspend fun loadEvents(
		context: Context,
		widgetId: Int,
		calendars: List<GeneratedId>,
		credentials: UnencryptedCredentials,
		cryptoFacade: AndroidNativeCryptoFacade
	): Map<GeneratedId, CalendarEventListDao> {
		val now = Calendar.getInstance(TimeZone.getDefault()).timeInMillis.toULong()
		val cachedEvents: MutableMap<GeneratedId, CalendarEventListDao> =
			loadCache(context, widgetId, calendars, cryptoFacade, credentials).toMutableMap()
		val cache = cachedEvents.filterKeys { calendars.contains(it) }

		for ((id, events) in cache.entries) {
			cachedEvents[id] = CalendarEventListDao(
				shortEvents = events.shortEvents.filter { it.startTime >= now || it.endTime >= now },
				longEvents = events.longEvents.filter { it.startTime >= now || it.endTime >= now },
			)
		}

		return cachedEvents.filterKeys { calendars.contains(it) }
	}

	private fun List<CalendarEvent>.toDao(): List<CalendarEventDao> {
		return this.map {
			val id = it.id ?: throw RuntimeException("Trying to convert an event without id to CalendarEventDao")

			CalendarEventDao(
				IdTuple(id.listId, id.elementId),
				it.startTime,
				it.endTime,
				it.summary
			)
		}
	}
}