package de.tutao.calendar

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.preferencesOf
import androidx.datastore.preferences.core.stringPreferencesKey
import de.tutao.calendar.widget.WIDGET_EVENTS_CACHE
import de.tutao.calendar.widget.data.CalendarEventDao
import de.tutao.calendar.widget.data.CalendarEventListDao
import de.tutao.calendar.widget.data.WidgetDataRepository
import de.tutao.calendar.widget.data.WidgetRepository
import de.tutao.tutasdk.ApiCallException
import de.tutao.tutasdk.CalendarEvent
import de.tutao.tutasdk.CalendarEventAttendee
import de.tutao.tutasdk.CalendarEventsList
import de.tutao.tutasdk.CalendarFacade
import de.tutao.tutasdk.CalendarRenderData
import de.tutao.tutasdk.DateTime
import de.tutao.tutasdk.ElementValue
import de.tutao.tutasdk.GeneratedId
import de.tutao.tutasdk.IdTupleGenerated
import de.tutao.tutasdk.LoggedInSdk
import de.tutao.tutasdk.Sdk
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.CredentialType
import de.tutao.tutashared.IdTupleCustom
import de.tutao.tutashared.base64ToBytes
import de.tutao.tutashared.ipc.CredentialsInfo
import de.tutao.tutashared.ipc.DataWrapper
import de.tutao.tutashared.ipc.NativeCredentialsFacade
import de.tutao.tutashared.ipc.UnencryptedCredentials
import de.tutao.tutashared.toBase64
import junit.framework.TestCase.assertNull
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.Json
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.doThrow
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.kotlin.wheneverBlocking
import java.util.Date

class WidgetRepositoryTest {

	private val json = Json { ignoreUnknownKeys = true }


	private lateinit var repository: WidgetRepository
	private lateinit var mockedUnencryptedCredentials: UnencryptedCredentials
	private lateinit var mockedCryptoFacade: AndroidNativeCryptoFacade

	private val MISSING_CAL_ID = "missing"
	private val FOO_CAL_ID = "foo"
	private val BAR_CAL_ID = "bar"
	private val WIDGET_ID = 1

	private lateinit var mockedFooEvent: CalendarEvent
	private lateinit var mockedFooCalendarEventsList: CalendarEventsList
	private lateinit var mockedBarEvent: CalendarEvent
	private lateinit var mockedBarCalendarEventsList: CalendarEventsList
	private lateinit var mockedSdk: Sdk
	private lateinit var mockedDataStore: DataStore<Preferences>

	private val credentialsFacade: NativeCredentialsFacade = mock<NativeCredentialsFacade> {
		onBlocking { loadByUserId(any()) } doReturn UnencryptedCredentials(
			CredentialsInfo("sample@example.com", "", CredentialType.INTERNAL),
			"",
			DataWrapper("mock".toByteArray()),
			"",
			DataWrapper("mock".toByteArray())
		)
	}

	@Before
	fun setup() {
		mockedDataStore = mock<DataStore<Preferences>>()

		repository = WidgetDataRepository()
		mockedUnencryptedCredentials = mock()
		val mockedDatabaseKey = mock<DataWrapper>()
		whenever(mockedDatabaseKey.data).thenReturn(ByteArray(0))
		whenever(mockedUnencryptedCredentials.databaseKey).thenReturn(mockedDatabaseKey)

		mockedCryptoFacade = mock()
		whenever(mockedCryptoFacade.aesDecryptData(any(), any())).thenReturn(ByteArray(0))

		// Mocking generateIv() to provide a consistent return value for the default argument in
		// mockedCryptoFacade.aesEncryptData.  It's as a workaround for a bug in mockito kotlin where argument matchers
		// don't work on method signatures that use default values.
		// See also: https://github.com/mockito/mockito-kotlin/issues/511
		val matchableReturnValue = ByteArray(0)
		whenever(mockedCryptoFacade.generateIv()).thenReturn(matchableReturnValue)
		whenever(mockedCryptoFacade.aesEncryptData(any(), any(), eq(matchableReturnValue))).thenReturn(
			ByteArray(0)
		)

		mockedSdk = mock { onBlocking { login(any()) } doReturn mock() }
		mockedFooEvent = createCalendarEventStub(
			id = IdTupleCustom(
				"fooList", "fooEvent"
			)
		)
		mockedFooCalendarEventsList = CalendarEventsList(listOf(mockedFooEvent), listOf(), listOf())
		mockedFooCalendarEventsList.shortEvents = listOf(mockedFooEvent)

		mockedBarEvent = createCalendarEventStub(
			id = IdTupleCustom(
				"barList", "barEvent"
			)
		)
		mockedBarCalendarEventsList = CalendarEventsList(listOf(mockedBarEvent), listOf(), listOf())
		mockedBarCalendarEventsList.shortEvents = listOf(mockedBarEvent)
	}

	@Test
	fun testGetCalendarColors() = runTest {
		val mockedCalendarFacade = mock<CalendarFacade> {
			onBlocking { getCalendarsRenderData() } doReturn mapOf(
				"foo" to CalendarRenderData("Calendar Foo", "000000"),
				"bar" to CalendarRenderData("Calendar Bar", "FFFFFF")
			)
		}

		val mockedLoggedInSdk = mock<LoggedInSdk> {
			onBlocking { calendarFacade() } doReturn mockedCalendarFacade
		}

		wheneverBlocking {
			mockedSdk.login(any())
		}.doReturn(mockedLoggedInSdk)

		val loadedCalendars = repository.loadCalendars("foo", credentialsFacade, mockedSdk)

		assert(loadedCalendars.size == 2)
		assert(loadedCalendars.entries.elementAt(0).key == "bar")
		assert(loadedCalendars.entries.elementAt(0).value.name == "Calendar Bar")
	}

	@Test
	fun test_loadEvents_gets_events_from_server() = runTest {
		// Arrange
		val mockedCalendarFacade = mock<CalendarFacade> {
			onBlocking {
				getCalendarEvents(
					eq(FOO_CAL_ID), any(), any()
				)
			} doReturn mockedFooCalendarEventsList

			onBlocking {
				getCalendarEvents(
					eq(BAR_CAL_ID), any(), any()
				)
			} doReturn mockedBarCalendarEventsList
		}

		val mockedLoggedInSdk = mock<LoggedInSdk> {
			onBlocking { calendarFacade() }.doReturn(mockedCalendarFacade)
		}

		wheneverBlocking {
			mockedSdk.login(any())
		}.doReturn(mockedLoggedInSdk)


		// Act
		val loadedEvents = repository.loadEvents(
			mockedDataStore,
			1,
			"a",
			listOf(FOO_CAL_ID, BAR_CAL_ID),
			mockedUnencryptedCredentials,
			mockedLoggedInSdk,
			mockedCryptoFacade
		)

		// Assert
		verify(mockedCalendarFacade, times(2)).getCalendarEvents(any(), any(), any())

		assert(loadedEvents[FOO_CAL_ID]?.shortEvents?.first()?.id?.toSdkIdTupleCustom() == mockedFooEvent.id)
		assert(loadedEvents[BAR_CAL_ID]?.shortEvents?.first()?.id?.toSdkIdTupleCustom() == mockedBarEvent.id)
	}

	@Test
	fun test_loadEvents_should_ignore_calendar_that_throws_missing_membership() = runTest {
		// Arrange
		val mockedCalendarFacade = mock<CalendarFacade> {
			onBlocking {
				getCalendarEvents(
					eq(FOO_CAL_ID), any(), any()
				)
			} doReturn mockedFooCalendarEventsList

			onBlocking {
				getCalendarEvents(
					eq(BAR_CAL_ID), any(), any()
				)
			} doReturn mockedBarCalendarEventsList

			onBlocking {
				getCalendarEvents(
					eq(MISSING_CAL_ID), any(), any()
				)
			} doThrow (ApiCallException.InternalSdkException("de.tutao.tutasdk.ApiCallException\$InternalSdkException: errorMessage=Missing membership for id $MISSING_CAL_ID"))
		}

		val mockedLoggedInSdk = mock<LoggedInSdk> {
			onBlocking { calendarFacade() }.doReturn(mockedCalendarFacade)
		}

		wheneverBlocking {
			mockedSdk.login(any())
		}.doReturn(mockedLoggedInSdk)


		// Act
		val loadedEvents = repository.loadEvents(
			mockedDataStore,
			1,
			"a",
			listOf(MISSING_CAL_ID, FOO_CAL_ID, BAR_CAL_ID),
			mockedUnencryptedCredentials,
			mockedLoggedInSdk,
			mockedCryptoFacade
		)

		// Assert
		verify(mockedCalendarFacade, times(3)).getCalendarEvents(any(), any(), any())
		verify(
			mockedCalendarFacade, times(1)
		).getCalendarEvents(eq(MISSING_CAL_ID), any(), any())

		assert(loadedEvents[FOO_CAL_ID]?.shortEvents?.first()?.id?.toSdkIdTupleCustom() == mockedFooEvent.id)
		assert(loadedEvents[BAR_CAL_ID]?.shortEvents?.first()?.id?.toSdkIdTupleCustom() == mockedBarEvent.id)
		assertNull(loadedEvents[MISSING_CAL_ID])
	}

	@Test
	fun test_loadEventsFromCache_only_returns_requested_calendars_from_cache() = runTest {
		// Arrange
		val cachedCalId = "CACHED"
		val preferenceKey = stringPreferencesKey("${WIDGET_EVENTS_CACHE}_$WIDGET_ID")

		val fooEventListDao = CalendarEventListDao(
			mockedFooCalendarEventsList.shortEvents.map {
				CalendarEventDao(IdTupleCustom(it.id!!.listId, it.id!!.elementId), it.startTime, it.endTime, it.summary)
			},
			listOf<CalendarEventDao>(),
		)
		val barEventListDao = CalendarEventListDao(
			mockedBarCalendarEventsList.shortEvents.map {
				CalendarEventDao(IdTupleCustom(it.id!!.listId, it.id!!.elementId), it.startTime, it.endTime, it.summary)
			},
			listOf<CalendarEventDao>(),
		)
		val cachedEventListDao = CalendarEventListDao(
			listOf<CalendarEventDao>(),
			listOf<CalendarEventDao>(),
		)

		val encodedFooEventList = json.encodeToString(fooEventListDao)
		val encodedBarEventList = json.encodeToString(barEventListDao)
		val encodedCachedEventList = json.encodeToString(cachedEventListDao)

		// We are skipping encryption here for test purposes
		val encodedFooEventListAsBase64 = encodedFooEventList.toByteArray().toBase64()
		val encodedBarEventListAsBase64 = encodedBarEventList.toByteArray().toBase64()
		val encodedCachedEventListAsBase64 = encodedCachedEventList.toByteArray().toBase64()

		val encryptedEventListMap: Map<GeneratedId, String> = mapOf(
			FOO_CAL_ID to encodedFooEventListAsBase64,
			BAR_CAL_ID to encodedBarEventListAsBase64,
			cachedCalId to encodedCachedEventListAsBase64
		)

		val cachedJsonEncodedEventsListMap = json.encodeToString(encryptedEventListMap)

		val mockedPreferences = preferencesOf(preferenceKey to cachedJsonEncodedEventsListMap)
		whenever(mockedDataStore.data).thenReturn(flowOf(mockedPreferences))


		// For each attempt to decrypt one entry of the decoded cachedJsonEncodedEventsListMap
		// we return encodedFooEventList and encodedBarEventList
		whenever(
			mockedCryptoFacade.aesDecryptData(
				any(), eq(encodedFooEventListAsBase64.base64ToBytes())
			)
		).thenReturn(encodedFooEventList.toByteArray())
		whenever(
			mockedCryptoFacade.aesDecryptData(
				any(), eq(encodedBarEventListAsBase64.base64ToBytes())
			)
		).thenReturn(encodedBarEventList.toByteArray())

		whenever(
			mockedCryptoFacade.aesDecryptData(
				any(), eq(encodedCachedEventListAsBase64.base64ToBytes())
			)
		).thenReturn(
			encodedCachedEventList.toByteArray()
		)


		// Act
		val cachedCalendar = repository.loadEventsFromCache(
			mockedDataStore, WIDGET_ID, listOf(FOO_CAL_ID, BAR_CAL_ID), mockedUnencryptedCredentials, mockedCryptoFacade
		)

		// Assert
		assert(cachedCalendar.size == 2)
		assert(cachedCalendar.keys.contains(FOO_CAL_ID))
		assert(cachedCalendar.keys.contains(BAR_CAL_ID))
		assert(!cachedCalendar.keys.contains(cachedCalId))
	}

	@Test
	fun test_loadEventsFromCache_does_not_throw_if_requested_calendar_is_missing_from_cache() = runTest {

		// Arrange
		val preferenceKey = stringPreferencesKey("${WIDGET_EVENTS_CACHE}_$WIDGET_ID")

		val fooEventListDao = CalendarEventListDao(
			mockedFooCalendarEventsList.shortEvents.map {
				CalendarEventDao(IdTupleCustom(it.id!!.listId, it.id!!.elementId), it.startTime, it.endTime, it.summary)
			},
			listOf<CalendarEventDao>(),
		)
		val encodedFooEventList = json.encodeToString(fooEventListDao)

		// We are skipping encryption here for test purposes
		val encodedFooEventListAsBase64 = encodedFooEventList.toByteArray().toBase64()

		val encryptedEventListMap: Map<GeneratedId, String> = mapOf(
			FOO_CAL_ID to encodedFooEventListAsBase64,
		)

		val cachedJsonEncodedEventsListMap = json.encodeToString(encryptedEventListMap)
		val mockedPreferences = preferencesOf(preferenceKey to cachedJsonEncodedEventsListMap)
		whenever(mockedDataStore.data).thenReturn(flowOf(mockedPreferences))

		whenever(
			mockedCryptoFacade.aesDecryptData(
				any(), eq(encodedFooEventListAsBase64.base64ToBytes())
			)
		).thenReturn(encodedFooEventList.toByteArray())


		// Act
		val cachedCalendars = repository.loadEventsFromCache(
			mockedDataStore, WIDGET_ID, listOf(BAR_CAL_ID), mockedUnencryptedCredentials, mockedCryptoFacade
		)

		// Assert
		assert(cachedCalendars.isEmpty())
	}
}


fun createCalendarEventStub(
	id: IdTupleCustom?,
	summary: String = "",
	description: String = "",
	startTime: DateTime = Date().time.toULong(),
	endTime: DateTime = Date().time.toULong(),
	location: String = "",
	sequence: Long = 0L,
	alarmInfos: List<IdTupleGenerated> = listOf(),
	calendarEventAttendee: List<CalendarEventAttendee> = listOf(),
	errors: Map<String, ElementValue> = mapOf()
): CalendarEvent {
	return CalendarEvent(
		id = id?.toSdkIdTupleCustom(),
		permissions = "permissions",
		format = 0L,
		summary = summary,
		description = description,
		startTime = startTime,
		endTime = endTime,
		location = location,
		sequence = sequence,
		alarmInfos = alarmInfos,
		attendees = calendarEventAttendee,
		errors = errors,
		ownerGroup = null,
		ownerEncSessionKey = null,
		uid = null,
		hashedUid = null,
		invitedConfidentially = null,
		recurrenceId = null,
		ownerKeyVersion = null,
		sender = null,
		pendingInvitation = null,
		repeatRule = null,
		organizer = null
	)
}