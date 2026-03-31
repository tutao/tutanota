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
import de.tutao.tutashared.IdTuple
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
	private lateinit var mockedSdk: Sdk
	private lateinit var mockedDataStore: DataStore<Preferences>

	private val MISSING_CALENDAR_ID = "missing"
	private val WORK_CALENDAR_ID = "work_calendar_id"
	private val PERSONAL_CALENDAR_ID = "personal_calendar_id"
	private val WIDGET_ID: Int = 1

	private lateinit var workCalendarEvent: CalendarEvent
	private lateinit var workCalendarEventsList: CalendarEventsList

	private lateinit var personalCalendarEvent: CalendarEvent
	private lateinit var personalCalendarEventsList: CalendarEventsList

	private val credentialsFacade: NativeCredentialsFacade = mock {
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
		repository = WidgetDataRepository.getInstance()

		mockedDataStore = mock()

		val mockedDatabaseKey: DataWrapper = mock()
		whenever(mockedDatabaseKey.data).thenReturn(ByteArray(0))

		mockedUnencryptedCredentials = mock()
		whenever(mockedUnencryptedCredentials.databaseKey).thenReturn(mockedDatabaseKey)

		mockedCryptoFacade = mock()
		whenever(mockedCryptoFacade.aesDecryptData(any(), any())).thenReturn(ByteArray(0))

		mockedSdk = mock { onBlocking { login(any()) } doReturn mock() }

		// Mocking generateIv() to provide a consistent return value for the default argument in
		// mockedCryptoFacade.aesEncryptData.  It's as a workaround for a bug in mockito kotlin where argument matchers
		// don't work on method signatures that use default values.
		// See also: https://github.com/mockito/mockito-kotlin/issues/511
		whenever(mockedCryptoFacade.generateIv()).thenReturn(ByteArray(0))
		whenever(mockedCryptoFacade.aesEncryptData(any(), any(), any())).thenReturn(ByteArray(0))

		workCalendarEvent = createTestCalendarEvent(
			id = IdTuple(
				"workCalendarList", "workCalendarEvent"
			)
		)
		workCalendarEventsList = CalendarEventsList(listOf(workCalendarEvent), listOf(), listOf())
		workCalendarEventsList.shortEvents = listOf(workCalendarEvent)

		personalCalendarEvent = createTestCalendarEvent(
			id = IdTuple(
				"barList", "barEvent"
			)
		)
		personalCalendarEventsList = CalendarEventsList(listOf(personalCalendarEvent), listOf(), listOf())
		personalCalendarEventsList.shortEvents = listOf(personalCalendarEvent)
	}

	@Test
	fun testGetCalendarColors() = runTest {
		val mockedCalendarFacade = mock<CalendarFacade> {
			onBlocking { getCalendarsRenderData() } doReturn mapOf(
				WORK_CALENDAR_ID to CalendarRenderData("Work Calendar", "000000"),
				PERSONAL_CALENDAR_ID to CalendarRenderData("Personal Calendar", "FFFFFF")
			)
		}

		val mockedLoggedInSdk = mock<LoggedInSdk> {
			onBlocking { calendarFacade() } doReturn mockedCalendarFacade
		}

		wheneverBlocking {
			mockedSdk.login(any())
		}.doReturn(mockedLoggedInSdk)

		val loadedCalendars = repository.loadCalendars("dummyId", credentialsFacade, mockedSdk)

		assert(loadedCalendars.size == 2)
		assert(loadedCalendars.entries.elementAt(0).key == PERSONAL_CALENDAR_ID)
		assert(loadedCalendars.entries.elementAt(0).value.name == "Personal Calendar")
	}

	@Test
	fun test_loadEvents_gets_events_from_server() = runTest {
		// Arrange
		val mockedCalendarFacade = mock<CalendarFacade> {
			onBlocking {
				getCalendarEvents(
					eq(WORK_CALENDAR_ID), any(), any()
				)
			} doReturn workCalendarEventsList

			onBlocking {
				getCalendarEvents(
					eq(PERSONAL_CALENDAR_ID), any(), any()
				)
			} doReturn personalCalendarEventsList
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
			listOf(WORK_CALENDAR_ID, PERSONAL_CALENDAR_ID),
			mockedUnencryptedCredentials,
			mockedLoggedInSdk,
			mockedCryptoFacade
		)

		// Assert
		verify(mockedCalendarFacade, times(2)).getCalendarEvents(any(), any(), any())

		assert(loadedEvents[WORK_CALENDAR_ID]?.shortEvents?.first()?.id?.toSdkIdTupleCustom() == workCalendarEvent.id)
		assert(loadedEvents[PERSONAL_CALENDAR_ID]?.shortEvents?.first()?.id?.toSdkIdTupleCustom() == personalCalendarEvent.id)
	}

	@Test
	fun test_loadEvents_should_ignore_calendar_that_throws_missing_membership() = runTest {
		// Arrange
		val mockedCalendarFacade = mock<CalendarFacade> {
			onBlocking {
				getCalendarEvents(
					eq(WORK_CALENDAR_ID), any(), any()
				)
			} doReturn workCalendarEventsList

			onBlocking {
				getCalendarEvents(
					eq(PERSONAL_CALENDAR_ID), any(), any()
				)
			} doReturn personalCalendarEventsList

			onBlocking {
				getCalendarEvents(
					eq(MISSING_CALENDAR_ID), any(), any()
				)
			} doThrow (ApiCallException.InternalSdkException("de.tutao.tutasdk.ApiCallException\$InternalSdkException: errorMessage=Missing membership for id $MISSING_CALENDAR_ID"))
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
			listOf(MISSING_CALENDAR_ID, WORK_CALENDAR_ID, PERSONAL_CALENDAR_ID),
			mockedUnencryptedCredentials,
			mockedLoggedInSdk,
			mockedCryptoFacade
		)

		// Assert
		verify(mockedCalendarFacade, times(3)).getCalendarEvents(any(), any(), any())
		verify(
			mockedCalendarFacade, times(1)
		).getCalendarEvents(eq(MISSING_CALENDAR_ID), any(), any())

		assert(loadedEvents[WORK_CALENDAR_ID]?.shortEvents?.first()?.id?.toSdkIdTupleCustom() == workCalendarEvent.id)
		assert(loadedEvents[PERSONAL_CALENDAR_ID]?.shortEvents?.first()?.id?.toSdkIdTupleCustom() == personalCalendarEvent.id)
		assertNull(loadedEvents[MISSING_CALENDAR_ID])
	}

	@Test
	fun test_loadEventsFromCache_only_returns_requested_calendars_from_cache() = runTest {
		// Arrange
		val cachedCalId = "CACHED"
		val preferenceKey = stringPreferencesKey("${WIDGET_EVENTS_CACHE}_$WIDGET_ID")

		val workCalendarEventListDao = CalendarEventListDao(
			workCalendarEventsList.shortEvents.map {
				CalendarEventDao(IdTuple(it.id!!.listId, it.id!!.elementId), it.startTime, it.endTime, it.summary)
			},
			listOf(),
		)
		val personalCalendarEventListDao = CalendarEventListDao(
			personalCalendarEventsList.shortEvents.map {
				CalendarEventDao(IdTuple(it.id!!.listId, it.id!!.elementId), it.startTime, it.endTime, it.summary)
			},
			listOf(),
		)
		val cachedEventListDao = CalendarEventListDao(
			listOf(),
			listOf(),
		)

		val encodedWorkCalendarEventList = json.encodeToString(workCalendarEventListDao)
		val encodedPersonalCalendarEventList = json.encodeToString(personalCalendarEventListDao)
		val encodedCachedEventList = json.encodeToString(cachedEventListDao)

		// We are skipping encryption here for test purposes
		val encodedWorkCalendarEventListAsBase64 = encodedWorkCalendarEventList.toByteArray().toBase64()
		val encodedPersonalCalendarEventListAsBase64 = encodedPersonalCalendarEventList.toByteArray().toBase64()
		val encodedCachedEventListAsBase64 = encodedCachedEventList.toByteArray().toBase64()
		val encryptedEventListMap: Map<GeneratedId, String> = mapOf(
			WORK_CALENDAR_ID to encodedWorkCalendarEventListAsBase64,
			PERSONAL_CALENDAR_ID to encodedPersonalCalendarEventListAsBase64,
			cachedCalId to encodedCachedEventListAsBase64
		)

		val cachedJsonEncodedEventsListMap = json.encodeToString(encryptedEventListMap)

		val preferences = preferencesOf(preferenceKey to cachedJsonEncodedEventsListMap)
		whenever(mockedDataStore.data).thenReturn(flowOf(preferences))

		// For each attempt to decrypt one entry of the decoded cachedJsonEncodedEventsListMap
		// we return encodedFooEventList and encodedBarEventList
		whenever(
			mockedCryptoFacade.aesDecryptData(
				any(), eq(encodedWorkCalendarEventListAsBase64.base64ToBytes())
			)
		).thenReturn(encodedWorkCalendarEventList.toByteArray())
		whenever(
			mockedCryptoFacade.aesDecryptData(
				any(), eq(encodedPersonalCalendarEventListAsBase64.base64ToBytes())
			)
		).thenReturn(encodedPersonalCalendarEventList.toByteArray())

		whenever(
			mockedCryptoFacade.aesDecryptData(
				any(), eq(encodedCachedEventListAsBase64.base64ToBytes())
			)
		).thenReturn(
			encodedCachedEventList.toByteArray()
		)

		// Act
		val cachedCalendar = repository.loadEventsFromCache(
			mockedDataStore,
			WIDGET_ID,
			listOf(WORK_CALENDAR_ID, PERSONAL_CALENDAR_ID),
			mockedUnencryptedCredentials,
			mockedCryptoFacade
		)

		// Assert
		assert(cachedCalendar.size == 2)
		assert(cachedCalendar.keys.containsAll(listOf(WORK_CALENDAR_ID, PERSONAL_CALENDAR_ID)))
		assert(!cachedCalendar.keys.contains(cachedCalId))
	}

	@Test
	fun test_loadEventsFromCache_does_not_throw_if_requested_calendar_is_missing_from_cache() = runTest {
		// Arrange
		val preferenceKey = stringPreferencesKey("${WIDGET_EVENTS_CACHE}_$WIDGET_ID")

		val workCalendarEventListDao = CalendarEventListDao(
			workCalendarEventsList.shortEvents.map {
				CalendarEventDao(IdTuple(it.id!!.listId, it.id!!.elementId), it.startTime, it.endTime, it.summary)
			},
			listOf(),
		)
		val encodedWorkCalendarEventList = json.encodeToString(workCalendarEventListDao)

		// We are skipping encryption here for test purposes
		val encodedWorkCalendarEventListAsBase64 = encodedWorkCalendarEventList.toByteArray().toBase64()

		val encryptedEventListMap: Map<GeneratedId, String> = mapOf(
			WORK_CALENDAR_ID to encodedWorkCalendarEventListAsBase64,
		)

		val cachedJsonEncodedEventsListMap = json.encodeToString(encryptedEventListMap)
		val preferences = preferencesOf(preferenceKey to cachedJsonEncodedEventsListMap)
		whenever(mockedDataStore.data).thenReturn(flowOf(preferences))

		whenever(
			mockedCryptoFacade.aesDecryptData(
				any(), eq(encodedWorkCalendarEventListAsBase64.base64ToBytes())
			)
		).thenReturn(encodedWorkCalendarEventList.toByteArray())


		// Act
		val cachedCalendars = repository.loadEventsFromCache(
			mockedDataStore, WIDGET_ID, listOf(PERSONAL_CALENDAR_ID), mockedUnencryptedCredentials, mockedCryptoFacade
		)

		// Assert
		verify(mockedCryptoFacade, times(1)).aesDecryptData(any(), any()) // Cache has only WorkCalendar
		assert(cachedCalendars.isEmpty()) // But we requested PersonalCalendar
	}
}


fun createTestCalendarEvent(
	id: IdTuple?,
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
		kdfNonce = null,
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