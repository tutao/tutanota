package de.tutao.tutanota

import de.tutao.tutanota.alarms.AlarmModel.getAllDayDateUTC
import de.tutao.tutanota.alarms.AlarmModel.iterateAlarmOccurrences
import de.tutao.tutanota.alarms.AlarmTrigger
import de.tutao.tutanota.alarms.EndType
import de.tutao.tutanota.alarms.RepeatPeriod
import org.junit.Assert
import org.junit.Test
import java.util.*

class AlarmModelTest {
	private val timeZone = TimeZone.getTimeZone("Europe/Berlin")

	@Test
	fun testIterates() {
		val occurrences: MutableList<Date> = ArrayList()
		val now = getDate(timeZone, 2019, 4, 2, 0, 0)
		val eventStart = getDate(timeZone, 2019, 4, 2, 12, 0)
		iterateAlarmOccurrences(now, timeZone, eventStart, eventStart, RepeatPeriod.WEEKLY,
				1, EndType.NEVER, 0, AlarmTrigger.ONE_HOUR, timeZone
		) { time: Date, _: Int, _: Date? -> occurrences.add(time) }
		Assert.assertArrayEquals(Arrays.asList(
				getDate(timeZone, 2019, 4, 2, 11, 0),
				getDate(timeZone, 2019, 4, 9, 11, 0),
				getDate(timeZone, 2019, 4, 16, 11, 0),
				getDate(timeZone, 2019, 4, 23, 11, 0)
		).toTypedArray(), occurrences.subList(0, 4).toTypedArray())
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
		iterateAlarmOccurrences(now, repeatTimeZone, eventStart, eventEnd, RepeatPeriod.DAILY,
				1, EndType.UNTIL, repeatEnd.time, AlarmTrigger.ONE_DAY, timeZone
		) { time: Date, _: Int, _: Date? -> occurrences.add(time) }
		val expected = Arrays.asList( // Event on 2nd, alarm on 1st
				getDate(timeZone, 2019, 4, 1, 0, 0),  // Event on 3rd, alarm on 2d
				getDate(timeZone, 2019, 4, 2, 0, 0) // No even on 4rd (because endDate is 4th)
		)
		Assert.assertArrayEquals(expected.toTypedArray(), occurrences.toTypedArray())
	}

	private fun getDate(timeZone: TimeZone, year: Int, month: Int, day: Int, hour: Int, minute: Int): Date {
		val calendar = Calendar.getInstance(timeZone)
		calendar[year, month, day, hour, minute] = 0
		calendar[Calendar.MILLISECOND] = 0
		return calendar.time
	}
}