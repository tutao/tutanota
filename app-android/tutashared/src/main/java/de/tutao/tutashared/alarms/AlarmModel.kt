package de.tutao.tutashared.alarms

import de.tutao.tutasdk.ByRule
import de.tutao.tutasdk.ByRuleType
import de.tutao.tutasdk.DateTime
import de.tutao.tutasdk.EventFacade
import de.tutao.tutasdk.EventRepeatRule
import java.time.Instant
import java.util.Calendar
import java.util.Date
import java.util.TimeZone
import kotlin.math.abs

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
		endValue: Long?,
		alarmTrigger: AlarmInterval,
		localTimeZone: TimeZone,
		excludedDates: List<Date>,
		byRules: List<ByRule>,
		callback: AlarmIterationCallback
	) {
		val isAllDayEvent = isAllDayEventByTimes(eventStart, eventEnd)
		val calcEventStart = if (isAllDayEvent) {
			getAllDayDateLocal(eventStart, localTimeZone)
		} else {
			eventStart
		}

		val calcExcludedDates = if (isAllDayEvent) {
			excludedDates.map { getAllDayDateLocal(it, localTimeZone) }
		} else {
			excludedDates
		}

		val endDate = if (endType == EndType.UNTIL) {
			if (isAllDayEvent) {
				getAllDayDateLocal(Date(endValue!!), localTimeZone)
			} else {
				Date(endValue!!)
			}
		} else {
			null
		}
		val calendar = Calendar.getInstance(if (isAllDayEvent) localTimeZone else timeZone)
		val setPosRules = byRules.filter { rule -> rule.byRule == ByRuleType.BY_SET_POS }
		val eventFacade = EventFacade()

		var occurrences = 0
		var futureOccurrences = 0
		var intervalOccurrences = 0

		while (
			futureOccurrences < OCCURRENCES_SCHEDULED_AHEAD &&
			(endType != EndType.COUNT || occurrences < endValue!!)
		) {
			calendar.time = calcEventStart

			incrementByRepeatPeriod(calendar, frequency, interval * intervalOccurrences)

			var expandedEvents: List<DateTime> = eventFacade.generateFutureInstances(
				(calendar.timeInMillis / 1000).toULong(),
				EventRepeatRule(frequency.toSdkPeriod(), byRules)
			)

			// Add the progenitor if it isn't included in the expansion
			if (intervalOccurrences == 0 && !expandedEvents.contains(calcEventStart.time.toULong())) {
				expandedEvents = expandedEvents.plus(calcEventStart.time.toULong())
			}

			// This map + filter prevent an infinity loop trap by removing invalid rules like POS 320 for freq. weekly
			// and ensures that 0 <= abs(SETPOS) < eventCount
			val parsedSetPos = setPosRules.map {
				if (it.interval.toInt() < 0) {
					expandedEvents.count() - abs(it.interval.toInt())
				} else {
					it.interval.toInt() - 1
				}
			}.filter { it >= 0 && it < frequency.getMaxDaysInPeriod() }

			if (endType == EndType.UNTIL && calendar.timeInMillis >= endDate!!.time) {
				break
			}

			for (index in expandedEvents.indices) {
				if (endValue != null && occurrences >= endValue) {
					break
				}

				if (parsedSetPos.isNotEmpty() && !parsedSetPos.contains(index)) {
					continue
				}

				val event = expandedEvents[index]

				val eventDate = Date.from(Instant.ofEpochSecond(event.toLong()))

				val alarmTime = calculateAlarmTime(eventDate, localTimeZone, alarmTrigger)
				val startTimeCalendar = calculateLocalStartTime(eventDate, localTimeZone)

				if (alarmTime.after(now) && calcExcludedDates.none { it.time == startTimeCalendar.time.time }) {
					callback.call(alarmTime, occurrences, eventDate)
					futureOccurrences++
				}

				occurrences++
			}

			intervalOccurrences++
		}
	}

	private fun incrementByRepeatPeriod(
		calendar: Calendar, period: RepeatPeriod?,
		interval: Int,
	) {
		val field: Int = when (period) {
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
		alarmTrigger: AlarmInterval,
	): Date {
		val calendar: Calendar = calculateLocalStartTime(eventStart, timeZone)
		when (alarmTrigger.unit) {
			AlarmIntervalUnit.MINUTE -> calendar.add(Calendar.MINUTE, -alarmTrigger.value)
			AlarmIntervalUnit.HOUR -> calendar.add(Calendar.HOUR, -alarmTrigger.value)
			AlarmIntervalUnit.DAY -> calendar.add(Calendar.DAY_OF_MONTH, -alarmTrigger.value)
			AlarmIntervalUnit.WEEK -> calendar.add(Calendar.WEEK_OF_MONTH, -alarmTrigger.value)
		}

		return calendar.time
	}

	@JvmStatic
	fun calculateLocalStartTime(
		eventStart: Date,
		timeZone: TimeZone?,
	): Calendar {
		val calendar: Calendar = if (timeZone != null) {
			Calendar.getInstance(timeZone)
		} else {
			Calendar.getInstance()
		}
		calendar.time = eventStart
		return calendar
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

	private fun RepeatPeriod.toSdkPeriod() = run {
		when (this) {
			RepeatPeriod.DAILY -> de.tutao.tutasdk.RepeatPeriod.DAILY
			RepeatPeriod.WEEKLY -> de.tutao.tutasdk.RepeatPeriod.WEEKLY
			RepeatPeriod.MONTHLY -> de.tutao.tutasdk.RepeatPeriod.MONTHLY
			RepeatPeriod.ANNUALLY -> de.tutao.tutasdk.RepeatPeriod.ANNUALLY
		}
	}

	private fun RepeatPeriod.getMaxDaysInPeriod() = run {
		when (this) {
			RepeatPeriod.DAILY -> 1
			RepeatPeriod.WEEKLY -> 7
			RepeatPeriod.MONTHLY -> 31
			RepeatPeriod.ANNUALLY -> 366
		}
	}
}