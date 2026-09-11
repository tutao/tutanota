package de.tutao.calendar

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.emptyPreferences
import de.tutao.calendar.widget.WidgetUpdateTrigger
import de.tutao.calendar.widget.data.CalendarEventDao
import de.tutao.calendar.widget.data.CalendarEventListDao
import de.tutao.calendar.widget.data.LastSyncDao
import de.tutao.calendar.widget.data.SettingsDao
import de.tutao.calendar.widget.data.UIEvent
import de.tutao.calendar.widget.data.WidgetRepository
import de.tutao.calendar.widget.data.WidgetUIState
import de.tutao.calendar.widget.model.BirthdayStrings
import de.tutao.calendar.widget.model.WidgetUIViewModel
import de.tutao.tutasdk.CalendarRenderData
import de.tutao.tutasdk.Sdk
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.CredentialType
import de.tutao.tutashared.IdTuple
import de.tutao.tutashared.ipc.CredentialsInfo
import de.tutao.tutashared.ipc.DataWrapper
import de.tutao.tutashared.ipc.NativeCredentialsFacade
import de.tutao.tutashared.ipc.UnencryptedCredentials
import junit.framework.TestCase.assertEquals
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertTrue
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
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneId
import java.util.Calendar

class WidgetUIViewModelTest {
	private val ZONE_ID: ZoneId = ZoneId.of("Europe/Berlin")
	private val TEST_LOCAL_DATE_TIME = LocalDateTime.of(2026, 9, 8, 15, 0)
	private val CALENDAR_ID = "selected-calendar-id"
	private val USER_ID = "user-id"

	private lateinit var mockWidgetDataStore: DataStore<Preferences>
	private lateinit var mockWidgetCacheDataStore: DataStore<Preferences>
	private lateinit var mockWidgetRepository: WidgetRepository

	private val sdk: Sdk = mock<Sdk> { onBlocking { login(any()) } doReturn mock() }

	private val credentialsFacade: NativeCredentialsFacade = mock<NativeCredentialsFacade> {
		onBlocking { loadByUserId(any()) } doReturn UnencryptedCredentials(
			CredentialsInfo("sample@example.com", USER_ID, CredentialType.INTERNAL),
			"",
			DataWrapper("mock".toByteArray()),
			"",
			DataWrapper("mock".toByteArray())
		)
	}
	private val cryptoFacade: AndroidNativeCryptoFacade = mock()

	@Before
	fun beforeEach() {
		mockWidgetRepository = mock() {}

		mockWidgetDataStore = mock() {
			on { data } doReturn flowOf(emptyPreferences())
		}
		mockWidgetCacheDataStore = mock()
	}

	@Test
	fun `returns Newly Created state when widget hasn't been configured yet`() = runTest {
		whenever(mockWidgetRepository.decodeSettingsFromPreferences(any(), any())).thenReturn(null)

		val model = makeUiViewModel()

		val state = model.loadUIState(mockWidgetDataStore, mockWidgetCacheDataStore, TEST_LOCAL_DATE_TIME)

		assertTrue(state is WidgetUIState.NewlyCreated)
	}

	@Test
	fun `loads events from cache when last sync was triggered by worker`() = runTest {
		givenConfiguredWidget()

		wheneverBlocking { mockWidgetRepository.loadEventsFromCache(any(), any(), any(), any(), any()) }.doReturn(
			emptyMap()
		)

		val model = makeUiViewModel()
		model.loadUIState(mockWidgetDataStore, mockWidgetCacheDataStore, TEST_LOCAL_DATE_TIME)

		verify(mockWidgetRepository, times(1)).loadEventsFromCache(any(), any(), any(), any(), any())
		verify(mockWidgetRepository, times(0)).loadEvents(any(), any(), any(), any(), any(), any(), any())
	}

	@Test
	fun `loads events from server when widget has never synced`() =
		runTest {
			givenConfiguredWidget(lastSync = null)

			wheneverBlocking {
				mockWidgetRepository.loadEvents(
					any(),
					any(),
					eq(USER_ID),
					any(),
					any(),
					any(),
					any()
				)
			} doReturn emptyMap()

			val model = makeUiViewModel()
			model.loadUIState(mockWidgetDataStore, mockWidgetCacheDataStore, TEST_LOCAL_DATE_TIME)

			verify(mockWidgetRepository, times(0)).loadEventsFromCache(any(), any(), any(), any(), any())
			verify(mockWidgetRepository, times(1)).loadEvents(any(), any(), any(), any(), any(), any(), any())
		}

	@Test
	fun `loads events from server when last sync was triggered by worker and an hour has passed (forced sync)`() =
		runTest {
			givenConfiguredWidget(lastSync = makeLastSync(forceFetch = true))

			wheneverBlocking {
				mockWidgetRepository.loadEvents(
					any(),
					any(),
					eq(USER_ID),
					any(),
					any(),
					any(),
					any()
				)
			} doReturn emptyMap()

			val model = makeUiViewModel()
			model.loadUIState(mockWidgetDataStore, mockWidgetCacheDataStore, TEST_LOCAL_DATE_TIME)

			verify(mockWidgetRepository, times(0)).loadEventsFromCache(any(), any(), any(), any(), any())
			verify(mockWidgetRepository, times(1)).loadEvents(any(), any(), any(), any(), any(), any(), any())
		}

	@Test
	fun `returns empty events lists when cached calendars have no events`() = runTest {
		givenConfiguredWidget()

		wheneverBlocking {
			mockWidgetRepository.loadEventsFromCache(
				eq(mockWidgetCacheDataStore),
				any(),
				eq(listOf(CALENDAR_ID)),
				any(),
				any()
			)
		}.doReturn(
			mapOf(
				CALENDAR_ID to CalendarEventListDao(emptyList(), emptyList())
			)
		)

		val model = makeUiViewModel()
		val result: WidgetUIState =
			model.loadUIState(mockWidgetDataStore, mockWidgetCacheDataStore, TEST_LOCAL_DATE_TIME)

		verify(mockWidgetRepository, times(1)).loadEventsFromCache(any(), any(), any(), any(), any())
		verify(mockWidgetRepository, times(0)).loadEvents(any(), any(), any(), any(), any(), any(), any())
		assertTrue(result is WidgetUIState.Available)

		val today = TEST_LOCAL_DATE_TIME.toLocalDate()
		assertEquals(
			"Normal events map should be empty",
			mapOf<LocalDate, List<UIEvent>>(today to emptyList()),
			(result as WidgetUIState.Available).normalEvents
		)
		assertEquals(
			"All day events map should be empty",
			mapOf<LocalDate, List<UIEvent>>(today to emptyList()),
			result.allDayEvents
		)
	}

	@Test
	fun `load events from cache when fetching from the server fails`() = runTest {
		val settingsDao = makeSettingsDao()
		givenConfiguredWidget(settingsDao)

		wheneverBlocking { mockWidgetRepository.loadEventsFromCache(any(), any(), any(), any(), any()) }.doReturn(
			emptyMap()
		)

		// Modifies non-cached loadEvents function to throw an error
		wheneverBlocking {
			mockWidgetRepository.loadEvents(any(), any(), any(), any(), any(), any(), any())
		}.doThrow(RuntimeException())

		val model = makeUiViewModel()
		model.loadUIState(mockWidgetDataStore, mockWidgetCacheDataStore, TEST_LOCAL_DATE_TIME)

		verify(mockWidgetRepository, times(1)).loadEventsFromCache(any(), any(), any(), any(), any())
	}

	@Test
	fun `returns events in ascending order, ordered by start time`() = runTest {
		val settingsDao = makeSettingsDao()
		givenConfiguredWidget(settingsDao, null)// Never synced should fetch from server

		val eventOne = makeCalendarEventDao(
			id = "latest-event",
			start = TEST_LOCAL_DATE_TIME.plusHours(5),
			end = TEST_LOCAL_DATE_TIME.plusHours(6),
		)
		val eventTwo = makeCalendarEventDao(
			id = "second-event",
			start = TEST_LOCAL_DATE_TIME.plusHours(3),
			end = TEST_LOCAL_DATE_TIME.plusHours(4),
		)
		val eventThree = makeCalendarEventDao(
			id = "third-event",
			start = TEST_LOCAL_DATE_TIME.plusHours(4),
			end = TEST_LOCAL_DATE_TIME.plusHours(5),
		)
		val eventFour = makeCalendarEventDao(
			id = "earliest-event",
			start = TEST_LOCAL_DATE_TIME.plusHours(2),
			end = TEST_LOCAL_DATE_TIME.plusHours(3),
		)
		wheneverBlocking {
			mockWidgetRepository.loadEvents(
				any(),
				any(),
				eq(USER_ID),
				eq(settingsDao.calendars.keys.toList()),
				any(),
				any(),
				any()
			)
		} doReturn mapOf(
			CALENDAR_ID to CalendarEventListDao(listOf(eventOne, eventTwo, eventThree, eventFour), listOf(), listOf()),
		)

		val model = makeUiViewModel()
		val state = model.loadUIState(mockWidgetDataStore, mockWidgetCacheDataStore, TEST_LOCAL_DATE_TIME)

		assertTrue(state is WidgetUIState.Available)
		val availableState = state as WidgetUIState.Available
		assertEquals(1, availableState.normalEvents.size)

		verify(mockWidgetRepository, times(0)).loadEventsFromCache(any(), any(), any(), any(), any())
		verify(mockWidgetRepository, times(1)).loadEvents(any(), any(), any(), any(), any(), any(), any())

		val eventsIds = availableState.normalEvents.values.first().map { uIEvent -> uIEvent.eventId }
		assertEquals(listOf(eventFour, eventTwo, eventThree, eventOne).map { eventDao -> eventDao.id }, eventsIds)
	}

	@Test
	fun `load events even when loading calendar details fails`() = runTest {
		givenConfiguredWidget(lastSync = makeLastSync(forceFetch = true))

		wheneverBlocking { mockWidgetRepository.loadCalendars(any(), any(), any()) }.doThrow(RuntimeException())

		wheneverBlocking {
			mockWidgetRepository.loadEvents(
				any(),
				any(),
				eq(USER_ID),
				any(),
				any(),
				any(),
				any()
			)
		} doReturn emptyMap()

		val model = makeUiViewModel()
		val state = model.loadUIState(mockWidgetDataStore, mockWidgetCacheDataStore, TEST_LOCAL_DATE_TIME)

		assertTrue(state is WidgetUIState.Available)
		val availableState = state as WidgetUIState.Available
		assertEquals(1, availableState.normalEvents.size)

		verify(mockWidgetRepository, times(1)).loadCalendars(any(), any(), any())
		verify(mockWidgetRepository, times(1)).loadEvents(any(), any(), any(), any(), any(), any(), any())
		verify(mockWidgetRepository, times(0)).loadEventsFromCache(any(), any(), any(), any(), any())
	}

	private fun makeUiViewModel(): WidgetUIViewModel = WidgetUIViewModel(
		mockWidgetRepository,
		0,
		credentialsFacade,
		cryptoFacade,
		sdk,
		Calendar.getInstance(),
		BirthdayStrings("", "")
	)

	private fun givenConfiguredWidget(
		settings: SettingsDao = makeSettingsDao(),
		lastSync: LastSyncDao? = makeLastSync(),
	) {
		whenever(
			mockWidgetRepository.decodeSettingsFromPreferences(any(), any())
		).thenReturn(settings)

		whenever(
			mockWidgetRepository.decodeLastSyncFromPreferences(any(), any())
		).thenReturn(lastSync)

		wheneverBlocking {
			mockWidgetRepository.loadCalendars(eq(settings.userId), any(), any())
		}.thenReturn(settings.calendars)
	}

	private fun makeLastSync(
		trigger: WidgetUpdateTrigger = WidgetUpdateTrigger.WORKER,
		forceFetch: Boolean = false
	): LastSyncDao {
		return LastSyncDao(0, trigger, forceFetch)
	}

	private fun makeSettingsDao(calendarName: String = "Private Calendar"): SettingsDao {
		val calendarRenderData = CalendarRenderData(calendarName, "435E91")
		return SettingsDao(
			calendars = mapOf(CALENDAR_ID to calendarRenderData),
			userId = USER_ID,
		)
	}

	private fun makeCalendarEventDao(
		id: String,
		start: LocalDateTime,
		end: LocalDateTime,
	) = CalendarEventDao(
		IdTuple("list", id),
		start.atZone(ZONE_ID).toInstant().toEpochMilli().toULong(),
		end.atZone(ZONE_ID).toInstant().toEpochMilli().toULong(),
		"Event $id",
	)
}