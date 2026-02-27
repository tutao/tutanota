package de.tutao.calendar

import android.content.Context
import de.tutao.calendar.widget.data.WidgetDataRepository
import de.tutao.tutasdk.ApiCallException
import de.tutao.tutasdk.CalendarEvent
import de.tutao.tutasdk.CalendarEventAttendee
import de.tutao.tutasdk.CalendarEventsList
import de.tutao.tutasdk.CalendarFacade
import de.tutao.tutasdk.CalendarRenderData
import de.tutao.tutasdk.DateTime
import de.tutao.tutasdk.ElementValue
import de.tutao.tutasdk.IdTupleGenerated
import de.tutao.tutasdk.LoggedInSdk
import de.tutao.tutasdk.Sdk
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.CredentialType
import de.tutao.tutashared.IdTupleCustom
import de.tutao.tutashared.ipc.CredentialsInfo
import de.tutao.tutashared.ipc.DataWrapper
import de.tutao.tutashared.ipc.NativeCredentialsFacade
import de.tutao.tutashared.ipc.UnencryptedCredentials
import junit.framework.TestCase.assertNull
import kotlinx.coroutines.test.runTest
import org.junit.Test
import org.mockito.Mock
import org.mockito.kotlin.any
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.doThrow
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.mockito.kotlin.wheneverBlocking
import java.util.Date

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

	@Test
	fun test_loadEvents_gets_events_from_server() = runTest {
		mockContext = mock<Context>()
		val mockUnencryptedCredentials = mock<UnencryptedCredentials>()
		val mockCryptoFacade = mock<AndroidNativeCryptoFacade>()
		// Arrange
		val missingId = "missing"
		val fooCalId = "foo"
		val barCalId = "bar"
		val missingCalendar = CalendarRenderData(missingId, "AAAAAA")

		val mockedFooEvent = createCalendarEventStub(id = IdTupleCustom("fooList", "fooEvent"))
		val mockedBarEvent = createCalendarEventStub(id = IdTupleCustom("barList", "barEvent"))

		val mockedFooCalendarEventsList = CalendarEventsList(listOf(mockedFooEvent), listOf(), listOf())
		val mockedBarCalendarEventsList = CalendarEventsList(listOf(mockedBarEvent), listOf(), listOf())

		mockedFooCalendarEventsList.shortEvents = listOf(mockedFooEvent)
		mockedBarCalendarEventsList.shortEvents = listOf(mockedBarEvent)


		val repository = WidgetDataRepository()
		val mockedSdk = mock<Sdk> { onBlocking { login(any()) } doReturn mock() }
		val mockedCalendarFacade = mock<CalendarFacade> {
			onBlocking {
				getCalendarEvents(
					eq(fooCalId), any(), any()
				)
			} doReturn mockedFooCalendarEventsList

			onBlocking {
				getCalendarEvents(
					eq(barCalId), any(), any()
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
			mockContext,
			1,
			"a",
			listOf(fooCalId, barCalId),
			mockUnencryptedCredentials,
			mockedLoggedInSdk,
			mockCryptoFacade
		)

		// Assert
		verify(mockedCalendarFacade, times(2)).getCalendarEvents(any(), any(), any())

		assert(loadedEvents[fooCalId]?.shortEvents?.first()?.id?.toSdkIdTupleCustom() == mockedFooEvent.id)
		assert(loadedEvents[barCalId]?.shortEvents?.first()?.id?.toSdkIdTupleCustom() == mockedBarEvent.id)
	}

	@Test
	fun test_loadEvents_does_not_cache_calendars_where_calendar_group_membership_is_missing_from_server() = runTest {

		mockContext = mock<Context>()
		val mockUnencryptedCredentials = mock<UnencryptedCredentials>()
		val mockCryptoFacade = mock<AndroidNativeCryptoFacade>()
		// Arrange
		val missingCalId = "missing"
		val fooCalId = "foo"
		val barCalId = "bar"

		val mockedFooEvent = createCalendarEventStub(id = IdTupleCustom("fooList", "fooEvent"))
		val mockedBarEvent = createCalendarEventStub(id = IdTupleCustom("barList", "barEvent"))

		val mockedFooCalendarEventsList = CalendarEventsList(listOf(mockedFooEvent), listOf(), listOf())
		val mockedBarCalendarEventsList = CalendarEventsList(listOf(mockedBarEvent), listOf(), listOf())

		mockedFooCalendarEventsList.shortEvents = listOf(mockedFooEvent)
		mockedBarCalendarEventsList.shortEvents = listOf(mockedBarEvent)


		val repository = WidgetDataRepository()

		val mockedSdk = mock<Sdk> { onBlocking { login(any()) } doReturn mock() }
		val mockedCalendarFacade = mock<CalendarFacade> {
			onBlocking {
				getCalendarEvents(
					eq(fooCalId), any(), any()
				)
			} doReturn mockedFooCalendarEventsList

			onBlocking {
				getCalendarEvents(
					eq(barCalId), any(), any()
				)
			} doReturn mockedBarCalendarEventsList

			onBlocking {
				getCalendarEvents(
					eq(missingCalId), any(), any()
				)
			} doThrow (ApiCallException.InternalSdkException("de.tutao.tutasdk.ApiCallException\$InternalSdkException: errorMessage=Missing membership for id $missingCalId"))
		}

		val mockedLoggedInSdk = mock<LoggedInSdk> {
			onBlocking { calendarFacade() }.doReturn(mockedCalendarFacade)
		}

		wheneverBlocking {
			mockedSdk.login(any())
		}.doReturn(mockedLoggedInSdk)


		// Act
		val loadedEvents = repository.loadEvents(
			mockContext,
			1,
			"a",
			listOf(fooCalId, barCalId, missingCalId),
			mockUnencryptedCredentials,
			mockedLoggedInSdk,
			mockCryptoFacade
		)

		// Assert
		verify(
			mockedCalendarFacade, times(1)
		).getCalendarEvents(eq(missingCalId), any(), any())
		verify(mockedCalendarFacade, times(3)).getCalendarEvents(any(), any(), any())

		assert(loadedEvents[fooCalId]?.shortEvents?.first()?.id?.toSdkIdTupleCustom() == mockedFooEvent.id)
		assert(loadedEvents[barCalId]?.shortEvents?.first()?.id?.toSdkIdTupleCustom() == mockedBarEvent.id)
		assertNull(loadedEvents[missingCalId])

	}

	@Test
	fun test_loadEventsFromCache_gracefully_handles_missing_membership_errors() = runTest {}

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