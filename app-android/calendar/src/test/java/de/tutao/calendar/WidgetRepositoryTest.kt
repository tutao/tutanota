package de.tutao.calendar

import android.content.Context
import de.tutao.calendar.widget.data.WidgetDataRepository
import de.tutao.calendar.widget.data.WidgetRepository
import de.tutao.tutasdk.CalendarFacade
import de.tutao.tutasdk.CalendarRenderData
import de.tutao.tutasdk.LoggedInSdk
import de.tutao.tutasdk.Sdk
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.CredentialType
import de.tutao.tutashared.ipc.CredentialsInfo
import de.tutao.tutashared.ipc.DataWrapper
import de.tutao.tutashared.ipc.NativeCredentialsFacade
import de.tutao.tutashared.ipc.UnencryptedCredentials
import kotlinx.coroutines.test.runTest
import org.junit.Test
import org.mockito.Mock
import org.mockito.kotlin.any
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.mock
import org.mockito.kotlin.wheneverBlocking

class WidgetRepositoryTest {
	@Mock
	private lateinit var mockContext: Context

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

	@Test
	fun testGetCalendarColors() = runTest {
		mockContext = mock<Context>()

		val repository = WidgetDataRepository()
		val mockedSdk = mock<Sdk> { onBlocking { login(any()) } doReturn mock() }
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
}