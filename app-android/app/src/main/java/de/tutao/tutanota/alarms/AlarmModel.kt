package de.tutao.tutanota.alarms

import java.util.*

object AlarmModel {
	private const val OCCURRENCES_SCHEDULED_AHEAD = 10

	@JvmStatic
	fun iterateAlarmOccurrences(
			now: Date,
			timeZone: TimeZone,
			eventStart: Date,
			eventEnd: Date,
			frequency: RepeatPeriod,
			interval: Int,
			endType: EndType?,
			endValue: Long,
			alarmTrigger: AlarmTrigger,
			localTimeZone: TimeZone,
			callback: AlarmIterationCallback,
	) {
		val isAllDayEvent = isAllDayEventByTimes(eventStart, eventEnd)
		val calcEventStart = if (isAllDayEvent) {
			getAllDayDateLocal(eventStart, localTimeZone)
		} else {
			eventStart
		}

		val endDate = if (endType == EndType.UNTIL) {
			if (isAllDayEvent) {
				getAllDayDateLocal(Date(endValue), localTimeZone)
			} else {
				Date(endValue)
			}
		} else {
			null
		}
		val calendar = Calendar.getInstance(if (isAllDayEvent) localTimeZone else timeZone)
		var occurrences = 0
		var futureOccurrences = 0
		while (futureOccurrences < OCCURRENCES_SCHEDULED_AHEAD
				&& (endType != EndType.COUNT
						|| occurrences < endValue)
		) {
			calendar.time = calcEventStart
			incrementByRepeatPeriod(calendar, frequency, interval * occurrences)
			if (endType == EndType.UNTIL && calendar.timeInMillis >= endDate!!.time) {
				break
			}
			val alarmTime = calculateAlarmTime(calendar.time, localTimeZone, alarmTrigger)
			if (alarmTime.after(now)) {
				callback.call(alarmTime, occurrences, calendar.time)
				futureOccurrences++
			}
			occurrences++
		}
	}

	fun incrementByRepeatPeriod(
			calendar: Calendar, period: RepeatPeriod?,
			interval: Int,
	) {
		val field: Int
		field = when (period) {
			RepeatPeriod.DAILY -> Calendar.DAY_OF_MONTH
			RepeatPeriod.WEEKLY -> Calendar.WEEK_OF_YEAR
			RepeatPeriod.MONTHLY -> Calendar.MONTH
			RepeatPeriod.ANNUALLY -> Calendar.YEAR
			else -> throw AssertionError("Unknown repeatPeriod: $period")
		}
		calendar.add(field, interval)
	}

	@JvmStatic
	fun calculateAlarmTime(
			eventStart: Date,
			timeZone: TimeZone?,
			alarmTrigger: AlarmTrigger,
	): Date {
		val calendar: Calendar = if (timeZone != null) {
			Calendar.getInstance(timeZone)
		} else {
			Calendar.getInstance()
		}
		calendar.time = eventStart
		when (alarmTrigger) {
			AlarmTrigger.FIVE_MINUTES -> calendar.add(Calendar.MINUTE, -5)
			AlarmTrigger.TEN_MINUTES -> calendar.add(Calendar.MINUTE, -10)
			AlarmTrigger.THIRTY_MINUTES -> calendar.add(Calendar.MINUTE, -30)
			AlarmTrigger.ONE_HOUR -> calendar.add(Calendar.HOUR, -1)
			AlarmTrigger.ONE_DAY -> calendar.add(Calendar.DAY_OF_MONTH, -1)
			AlarmTrigger.TWO_DAYS -> calendar.add(Calendar.DAY_OF_MONTH, -2)
			AlarmTrigger.THREE_DAYS -> calendar.add(Calendar.DAY_OF_MONTH, -3)
			AlarmTrigger.ONE_WEEK -> calendar.add(Calendar.WEEK_OF_MONTH, -1)
		}
		return calendar.time
	}

	@JvmStatic
	fun getAllDayDateUTC(localDate: Date, localTimeZone: TimeZone): Date {
		val calendar = Calendar.getInstance(localTimeZone)
		calendar.time = localDate
		val utcCalendar = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
		utcCalendar[calendar[Calendar.YEAR], calendar[Calendar.MONTH], calendar[Calendar.DAY_OF_MONTH], 0, 0] = 0
		utcCalendar[Calendar.MILLISECOND] = 0
		return utcCalendar.time
	}

	private fun getAllDayDateLocal(utcDate: Date, localTimeZone: TimeZone): Date {
		val utcCalendar = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
		utcCalendar.time = utcDate
		val calendar = Calendar.getInstance(localTimeZone)
		calendar.set(
				utcCalendar[Calendar.YEAR],
				utcCalendar[Calendar.MONTH],
				utcCalendar[Calendar.DAY_OF_MONTH],
				0,
				0,
				0
		)
		calendar.set(Calendar.MILLISECOND, 0)
		return calendar.time
	}

	private fun isAllDayEventByTimes(startDate: Date, endDate: Date): Boolean {
		val calendar = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
		calendar.time = startDate
		val startFits = calendar[Calendar.HOUR] == 0 && calendar[Calendar.MINUTE] == 0 && calendar[Calendar.SECOND] == 0
		calendar.time = endDate
		val endFits = calendar[Calendar.HOUR] == 0 && calendar[Calendar.MINUTE] == 0 && calendar[Calendar.SECOND] == 0
		return startFits && endFits
	}

	fun interface AlarmIterationCallback {
		fun call(alarmTime: Date, occurrence: Int, eventStartTime: Date)
	}
}