package de.tutao.calendar

import de.tutao.calendar.push.isSameDay
import de.tutao.tutashared.alarms.AlarmInterval
import de.tutao.tutashared.alarms.AlarmIntervalUnit
import de.tutao.tutashared.alarms.AlarmModel.getAllDayDateUTC
import de.tutao.tutashared.alarms.AlarmModel.iterateAlarmOccurrences
import de.tutao.tutashared.alarms.EndType
import de.tutao.tutashared.alarms.RepeatPeriod
import org.junit.Assert
import org.junit.Test
import java.util.Calendar
import java.util.Date
import java.util.TimeZone

class AlarmModelTest {
	private val timeZone = TimeZone.getTimeZone("Europe/Berlin")

	@Test
	fun testIterates() {
		val occurrences: MutableList<Date> = ArrayList()
		val now = getDate(timeZone, 2019, 4, 2, 0, 0)
		val eventStart = getDate(timeZone, 2019, 4, 2, 12, 0)
		iterateAlarmOccurrences(
			now, timeZone, eventStart, eventStart, RepeatPeriod.WEEKLY,
			1, EndType.NEVER, 0, AlarmInterval(AlarmIntervalUnit.HOUR, 1), timeZone, emptyList()
		) { time: Date, _: Int, _: Date? -> occurrences.add(time) }
		Assert.assertArrayEquals(
			listOf(
				getDate(timeZone, 2019, 4, 2, 11, 0),
				getDate(timeZone, 2019, 4, 9, 11, 0),
				getDate(timeZone, 2019, 4, 16, 11, 0),
				getDate(timeZone, 2019, 4, 23, 11, 0)
			).toTypedArray(), occurrences.subList(0, 4).toTypedArray()
		)
	}

	@Test
	fun testAllDayEndOnDate() {
		val occurrences: MutableList<Date> = ArrayList()
		val repeatTimeZone = TimeZone.getTimeZone("Asia/Anadyr")
		val now = getDate(repeatTimeZone, 2019, 4, 1, 0, 0)
		// UTC date just encodes the date, whatever you pass to it. You just have to extract consistently
		val eventStart = getAllDayDateUTC(getDate(timeZone, 2019, 4, 2, 0, 0), timeZone)
		val eventEnd = getAllDayDateUTC(getDate(timeZone, 2019, 4, 3, 0, 0), timeZone)
		val repeatEnd = getAllDayDateUTC(getDate(timeZone, 2019, 4, 4, 0, 0), timeZone)
		iterateAlarmOccurrences(
			now, repeatTimeZone, eventStart, eventEnd, RepeatPeriod.DAILY,
			1, EndType.UNTIL, repeatEnd.time, AlarmInterval(AlarmIntervalUnit.DAY, 1), timeZone, emptyList()
		) { time: Date, _: Int, _: Date? -> occurrences.add(time) }
		val expected = listOf( // Event on 2nd, alarm on 1st
			getDate(timeZone, 2019, 4, 1, 0, 0),  // Event on 3rd, alarm on 2d
			getDate(timeZone, 2019, 4, 2, 0, 0) // No even on 4rd (because endDate is 4th)
		)
		Assert.assertArrayEquals(expected.toTypedArray(), occurrences.toTypedArray())
	}

	@Test
	fun testSameDay() {
		// same day
		Assert.assertTrue(
			isSameDay(
				getDate(timeZone, 2022, 11, 25, 13, 7).time,
				getDate(timeZone, 2022, 11, 25, 13, 7).time
			)
		)
		Assert.assertTrue(
			isSameDay(
				getDate(timeZone, 2022, 11, 25, 13, 7).time,
				getDate(timeZone, 2022, 11, 25, 0, 0).time
			)
		)
		Assert.assertTrue(
			isSameDay(
				getDate(timeZone, 2022, 11, 25, 13, 7).time,
				getDate(timeZone, 2022, 11, 25, 23, 59).time
			)
		)
		Assert.assertTrue(
			isSameDay(
				getDate(timeZone, 2022, 11, 25, 0, 0).time,
				getDate(timeZone, 2022, 11, 25, 23, 59).time
			)
		)
		Assert.assertTrue(
			isSameDay(
				getDate(timeZone, 2022, 11, 25, 23, 59).time,
				getDate(timeZone, 2022, 11, 25, 0, 0).time
			)
		)

		// not same day
		Assert.assertFalse(
			isSameDay(
				getDate(timeZone, 2022, 11, 25, 13, 7).time,
				getDate(timeZone, 2022, 11, 26, 13, 7).time
			)
		)
		Assert.assertFalse(
			isSameDay(
				getDate(timeZone, 2022, 11, 25, 13, 7).time,
				getDate(timeZone, 2022, 11, 26, 0, 0).time
			)
		)
		Assert.assertFalse(
			isSameDay(
				getDate(timeZone, 2022, 11, 25, 23, 59).time,
				getDate(timeZone, 2022, 11, 26, 0, 0).time
			)
		)
		Assert.assertFalse(
			isSameDay(
				getDate(timeZone, 2022, 11, 25, 0, 0).time,
				getDate(timeZone, 2022, 11, 24, 23, 59).time
			)
		)
		Assert.assertFalse(
			isSameDay(
				getDate(timeZone, 2021, 11, 25, 13, 7).time,
				getDate(timeZone, 2022, 11, 25, 13, 7).time
			)
		)

		// time zone test
		val timeZoneGMT = TimeZone.getTimeZone("Europe/London")
		val otherTimeZone = TimeZone.getTimeZone("Asia/Anadyr")
		Assert.assertTrue(
			isSameDay(
				getDate(timeZoneGMT, 2022, 11, 25, 22, 59).time,
				getDate(timeZoneGMT, 2022, 11, 25, 23, 59).time,
				timeZoneGMT
			)
		)
		Assert.assertTrue(
			isSameDay(
				getDate(timeZoneGMT, 2022, 11, 25, 22, 59).time,
				getDate(timeZoneGMT, 2022, 11, 25, 23, 59).time,
				otherTimeZone
			)
		)
		// for berlin the next day starts between these two timestamps
		Assert.assertFalse(
			isSameDay(
				getDate(timeZoneGMT, 2022, 11, 25, 22, 59).time,
				getDate(timeZoneGMT, 2022, 11, 25, 23, 59).time,
				timeZone
			)
		)
		Assert.assertEquals(
			isSameDay(
				getDate(timeZoneGMT, 2022, 11, 25, 22, 59).time,
				getDate(timeZoneGMT, 2022, 11, 25, 23, 59).time
			),
			isSameDay(
				getDate(timeZoneGMT, 2022, 11, 25, 22, 59).time,
				getDate(timeZoneGMT, 2022, 11, 25, 23, 59).time,
				TimeZone.getDefault()
			)
		)
	}

	private fun getDate(timeZone: TimeZone, year: Int, month: Int, day: Int, hour: Int, minute: Int): Date {
		val calendar = Calendar.getInstance(timeZone)
		calendar[year, month, day, hour, minute] = 0
		calendar[Calendar.MILLISECOND] = 0
		return calendar.time
	}
}