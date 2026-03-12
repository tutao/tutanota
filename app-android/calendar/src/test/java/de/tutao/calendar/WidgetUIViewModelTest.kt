package de.tutao.calendar

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import de.tutao.calendar.widget.WidgetUpdateTrigger
import de.tutao.calendar.widget.data.CalendarEventDao
import de.tutao.calendar.widget.data.CalendarEventListDao
import de.tutao.calendar.widget.data.LastSyncDao
import de.tutao.calendar.widget.data.SettingsDao
import de.tutao.calendar.widget.data.WidgetRepository
import de.tutao.calendar.widget.model.BirthdayStrings
import de.tutao.calendar.widget.model.WidgetUIViewModel
import de.tutao.tutasdk.Sdk
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.CredentialType
import de.tutao.tutashared.IdTupleCustom
import de.tutao.tutashared.ipc.CredentialsInfo
import de.tutao.tutashared.ipc.DataWrapper
import de.tutao.tutashared.ipc.NativeCredentialsFacade
import de.tutao.tutashared.ipc.UnencryptedCredentials
import kotlinx.coroutines.test.runTest
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.doThrow
import org.mockito.kotlin.mock
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.mockito.kotlin.wheneverBlocking
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId
import java.util.Calendar

class WidgetUIViewModelTest {
	private lateinit var mockWidgetDataStore: DataStore<Preferences>
	private lateinit var mockWidgetCacheDataStore: DataStore<Preferences>
	private lateinit var mockWidgetRepository: WidgetRepository

	private val eventOne = CalendarEventDao(IdTupleCustom("list", "1"), 1758326400000UL, 1758330000000UL, "Event One")
	private val eventTwo = CalendarEventDao(IdTupleCustom("list", "2"), 1758333600000UL, 1758337200000UL, "Event Two")
	private val eventThree =
		CalendarEventDao(IdTupleCustom("list", "3"), 1758330000000UL, 1758333600000UL, "Event Three")
	private val eventFour = CalendarEventDao(IdTupleCustom("list", "4"), 1758319200000UL, 1758322800000UL, "Event Four")

	private val sdk: Sdk = mock<Sdk> { onBlocking { login(any()) } doReturn mock() }

	private val credentialsFacade: NativeCredentialsFacade = mock<NativeCredentialsFacade> {
		onBlocking { loadByUserId(any()) } doReturn UnencryptedCredentials(
			CredentialsInfo("sample@example.com", "", CredentialType.INTERNAL),
			"",
			DataWrapper("mock".toByteArray()),
			"",
			DataWrapper("mock".toByteArray())
		)
	}
	private val cryptoFacade: AndroidNativeCryptoFacade = mock()

	@Before
	fun beforeEach() {
		mockWidgetRepository = mock() {
			onBlocking { loadSettings(any(), any()) } doReturn SettingsDao("", calendars = mapOf())
			onBlocking { loadLastSync(any(), any()) } doReturn LastSyncDao(0, WidgetUpdateTrigger.APP, false)
			onBlocking { storeSettings(any(), any(), any()) } doReturn Unit
			onBlocking { loadEvents(any(), any(), any(), any(), any(), any(), any()) } doReturn mapOf(
				"cal1" to CalendarEventListDao(listOf(eventOne, eventTwo), listOf(), listOf()),
				"cal2" to CalendarEventListDao(listOf(eventThree, eventFour), listOf(), listOf()),
			)
			onBlocking { loadEventsFromCache(any(), any(), any(), any(), any()) } doReturn mapOf()
		}

		mockWidgetDataStore = mock()
		mockWidgetCacheDataStore = mock()
	}

	@Test
	fun testEventsFromCache() = runTest {
		wheneverBlocking { mockWidgetRepository.loadCalendars(any(), any(), any()) }.doReturn(mapOf())

		wheneverBlocking {
			mockWidgetRepository.loadLastSync(any(), any())
		}.doReturn(LastSyncDao(0, WidgetUpdateTrigger.WORKER, false))

		val model = WidgetUIViewModel(
			mockWidgetRepository,
			0,
			credentialsFacade,
			cryptoFacade,
			sdk,
			Calendar.getInstance(),
			BirthdayStrings("", "")
		)
		model.loadUIState(
			mockWidgetDataStore, mockWidgetCacheDataStore, LocalDateTime.ofInstant(
				Instant.ofEpochMilli(1758333600000), ZoneId.of("Europe/Berlin")
			)
		)

		verify(mockWidgetRepository, times(1)).loadEventsFromCache(any(), any(), any(), any(), any())
		verify(mockWidgetRepository, times(0)).loadEvents(any(), any(), any(), any(), any(), any(), any())
	}

	@Test
	fun testEventsFromCacheOnError() = runTest {
		wheneverBlocking { mockWidgetRepository.loadCalendars(any(), any(), any()) }.doReturn(mapOf())

		// Modifies non-cached loadEvents function to throw an error
		wheneverBlocking {
			mockWidgetRepository.loadEvents(any(), any(), any(), any(), any(), any(), any())
		}.doThrow(RuntimeException())

		val model = WidgetUIViewModel(
			mockWidgetRepository,
			0,
			credentialsFacade,
			cryptoFacade,
			sdk,
			Calendar.getInstance(),
			BirthdayStrings("", "")
		)
		model.loadUIState(
			mockWidgetDataStore, mockWidgetCacheDataStore, LocalDateTime.ofInstant(
				Instant.ofEpochMilli(1758333600000), ZoneId.of("Europe/Berlin")
			)
		)

		verify(mockWidgetRepository, times(1)).loadEventsFromCache(any(), any(), any(), any(), any())
	}

	@Test
	fun testEventsOrder() = runTest {
		val mockedCalendar = Calendar.getInstance()
		mockedCalendar.timeInMillis = 1758333600000

		wheneverBlocking { mockWidgetRepository.loadCalendars(any(), any(), any()) }.doReturn(mapOf())

		val model = WidgetUIViewModel(
			mockWidgetRepository, 0, credentialsFacade, cryptoFacade, sdk, mockedCalendar, BirthdayStrings("", "")
		)
		val events = model.loadUIState(
			mockWidgetDataStore,
			mockWidgetCacheDataStore,
			LocalDateTime.ofInstant(Instant.ofEpochMilli(1758333600000), ZoneId.of("Europe/Berlin"))
		)

		assert(events != null)
		assert(events?.normalEvents?.size == 1)

		verify(mockWidgetRepository, times(0)).loadEventsFromCache(any(), any(), any(), any(), any())
		verify(mockWidgetRepository, times(1)).loadEvents(any(), any(), any(), any(), any(), any(), any())

		val key = events?.normalEvents?.keys?.first()
		val dayEvents = events?.normalEvents?.get(key)

		assert(dayEvents?.get(0)?.eventId == eventFour.id)
		assert(dayEvents?.get(2)?.eventId == eventThree.id)
	}

	@Test
	fun testCanFetchEventsWhenLoadCalendarsFail() = runTest {
		wheneverBlocking { mockWidgetRepository.loadCalendars(any(), any(), any()) }.doThrow(RuntimeException())

		val mockedCalendar = Calendar.getInstance()
		mockedCalendar.timeInMillis = 1758333600000

		val model = WidgetUIViewModel(
			mockWidgetRepository,
			0,
			credentialsFacade,
			cryptoFacade,
			sdk,
			mockedCalendar,
			BirthdayStrings("", "")
		)
		val events = model.loadUIState(
			mockWidgetDataStore,
			mockWidgetCacheDataStore,
			LocalDateTime.ofInstant(Instant.ofEpochMilli(1758333600000), ZoneId.of("Europe/Berlin"))
		)

		assert(events != null)
		assert(events?.normalEvents?.size == 1)

		verify(mockWidgetRepository, times(1)).loadCalendars(any(), any(), any())
		verify(mockWidgetRepository, times(0)).loadEventsFromCache(any(), any(), any(), any(), any())
		verify(mockWidgetRepository, times(1)).loadEvents(any(), any(), any(), any(), any(), any(), any())

		val key = events?.normalEvents?.keys?.first()
		val dayEvents = events?.normalEvents?.get(key)

		assert(dayEvents?.get(0)?.eventId == eventFour.id)
		assert(dayEvents?.get(2)?.eventId == eventThree.id)
	}
}