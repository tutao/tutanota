package de.tutao.calendar

import android.content.Context
import de.tutao.calendar.widget.WidgetUpdateTrigger
import de.tutao.calendar.widget.data.CalendarEventDao
import de.tutao.calendar.widget.data.CalendarEventListDao
import de.tutao.calendar.widget.data.LastSyncDao
import de.tutao.calendar.widget.data.SettingsDao
import de.tutao.calendar.widget.data.WidgetRepository
import de.tutao.calendar.widget.model.WidgetUIViewModel
import de.tutao.tutasdk.Sdk
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.CredentialType
import de.tutao.tutashared.IdTuple
import de.tutao.tutashared.ipc.CredentialsInfo
import de.tutao.tutashared.ipc.DataWrapper
import de.tutao.tutashared.ipc.NativeCredentialsFacade
import de.tutao.tutashared.ipc.UnencryptedCredentials
import kotlinx.coroutines.test.runTest
import org.junit.Test
import org.mockito.Mock
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
	@Mock
	private lateinit var mockContext: Context

	private val eventOne = CalendarEventDao(IdTuple("list", "1"), 1758326400000UL, 1758330000000UL, "Event One")
	private val eventTwo = CalendarEventDao(IdTuple("list", "2"), 1758333600000UL, 1758337200000UL, "Event Two")
	private val eventThree = CalendarEventDao(IdTuple("list", "3"), 1758330000000UL, 1758333600000UL, "Event Three")
	private val eventFour = CalendarEventDao(IdTuple("list", "4"), 1758319200000UL, 1758322800000UL, "Event Four")
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

	private fun getRepository(): WidgetRepository {
		return mock<WidgetRepository> {
			onBlocking { loadSettings(any(), any()) } doReturn SettingsDao("", calendars = mapOf())
			onBlocking { loadLastSync(any(), any()) } doReturn LastSyncDao(0, WidgetUpdateTrigger.APP, false)
			onBlocking { loadCalendars(any(), any(), any()) } doReturn mapOf()
			onBlocking { storeSettings(any(), any(), any()) } doReturn Unit
			onBlocking { loadEvents(any(), any(), any(), any(), any(), any(), any()) } doReturn
					mapOf(
						"cal1" to CalendarEventListDao(listOf(eventOne, eventTwo), listOf(), listOf()),
						"cal2" to CalendarEventListDao(listOf(eventThree, eventFour), listOf(), listOf()),
					)
			onBlocking { loadEvents(any(), any(), any(), any(), any()) } doReturn mapOf()
		}
	}

	@Test()
	fun testEventsFromCache() = runTest {
		mockContext = mock<Context>()
		val repository = getRepository()

		wheneverBlocking {
			repository.loadLastSync(any(), any())
		}.doReturn(LastSyncDao(0, WidgetUpdateTrigger.WORKER, false))

		val model = WidgetUIViewModel(repository, 0, credentialsFacade, cryptoFacade, sdk, Calendar.getInstance())
		model.loadUIState(
			context = mockContext,
			LocalDateTime.ofInstant(Instant.ofEpochMilli(1758333600000), ZoneId.of("Europe/Berlin"))
		)

		verify(repository, times(1)).loadEvents(any(), any(), any(), any(), any())
		verify(repository, times(0)).loadEvents(any(), any(), any(), any(), any(), any(), any())
	}

	@Test()
	fun testEventsFromCacheOnError() = runTest {
		mockContext = mock<Context>()
		val repository = getRepository()

		// Modifies non-cached loadEvents function to throw an error
		wheneverBlocking {
			repository.loadEvents(any(), any(), any(), any(), any(), any(), any())
		}.doThrow(RuntimeException())

		val model = WidgetUIViewModel(repository, 0, credentialsFacade, cryptoFacade, sdk, Calendar.getInstance())
		model.loadUIState(
			context = mockContext,
			LocalDateTime.ofInstant(Instant.ofEpochMilli(1758333600000), ZoneId.of("Europe/Berlin"))
		)

		verify(repository, times(1)).loadEvents(any(), any(), any(), any(), any())
	}

	@Test
	fun testEventsOrder() = runTest {
		mockContext = mock<Context>()

		val repository = getRepository()

		val mockedCalendar = Calendar.getInstance()
		mockedCalendar.timeInMillis = 1758333600000

		val model = WidgetUIViewModel(repository, 0, credentialsFacade, cryptoFacade, sdk, mockedCalendar)
		val events = model.loadUIState(
			context = mockContext,
			LocalDateTime.ofInstant(Instant.ofEpochMilli(1758333600000), ZoneId.of("Europe/Berlin"))
		)

		assert(events != null)
		assert(events?.normalEvents?.size == 1)

		verify(repository, times(0)).loadEvents(any(), any(), any(), any(), any())
		verify(repository, times(1)).loadEvents(any(), any(), any(), any(), any(), any(), any())

		val key = events?.normalEvents?.keys?.first()
		val dayEvents = events?.normalEvents?.get(key)

		assert(dayEvents?.get(0)?.eventId == eventFour.id)
		assert(dayEvents?.get(2)?.eventId == eventThree.id)
	}
}