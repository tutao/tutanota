package de.tutao.tutanota.alarms;

import java.util.Calendar;
import java.util.Date;
import java.util.TimeZone;

public class AlarmModel {

	public static final int OCCURRENCES_SCHEDULED_AHEAD = 10;

	public static void iterateAlarmOccurrences(Date now,
											   TimeZone timeZone,
											   Date eventStart,
											   Date eventEnd,
											   RepeatPeriod frequency,
											   int interval,
											   EndType endType,
											   long endValue,
											   AlarmTrigger alarmTrigger,
											   TimeZone locaTimeZone,
											   AlarmIterationCallback callback) {


		boolean isAllDayEvent = isAllDayEventByTimes(eventStart, eventEnd);
		Date calcEventStart = isAllDayEvent ? getAllDayDateLocal(eventStart, locaTimeZone) : eventStart;
		Date endDate = endType == EndType.UNTIL
				? isAllDayEvent
				? getAllDayDateLocal(new Date(endValue), locaTimeZone)
				: new Date(endValue)
				: null;

		Calendar calendar = Calendar.getInstance(isAllDayEvent ? locaTimeZone : timeZone);
		int occurrences = 0;
		int futureOccurrences = 0;


		while (futureOccurrences < OCCURRENCES_SCHEDULED_AHEAD
				&& (endType != EndType.COUNT
				|| occurrences < endValue)) {

			calendar.setTime(calcEventStart);
			incrementByRepeatPeriod(calendar, frequency, interval * occurrences);

			if (endType == EndType.UNTIL && calendar.getTimeInMillis() >= endDate.getTime()) {
				break;
			}
			Date alarmTime = calculateAlarmTime(calendar.getTime(), locaTimeZone, alarmTrigger);

			if (alarmTime.after(now)) {
				callback.call(alarmTime, occurrences, calendar.getTime());
				futureOccurrences++;
			}
			occurrences++;
		}
	}

	public interface AlarmIterationCallback {
		void call(Date alarmTime, int occurrence, Date eventStartTime);
	}

	public static void incrementByRepeatPeriod(Calendar calendar, RepeatPeriod period,
											   int interval) {
		int field;
		switch (period) {
			case DAILY:
				field = Calendar.DAY_OF_MONTH;
				break;
			case WEEKLY:
				field = Calendar.WEEK_OF_YEAR;
				break;
			case MONTHLY:
				field = Calendar.MONTH;
				break;
			case ANNUALLY:
				field = Calendar.YEAR;
				break;
			default:
				throw new AssertionError("Unknown repeatPeriod: " + period);
		}
		calendar.add(field, interval);
	}

	public static Date calculateAlarmTime(Date eventStart, TimeZone timeZone,
										  AlarmTrigger alarmTrigger) {
		Calendar calendar;
		if (timeZone != null) {
			calendar = Calendar.getInstance(timeZone);
		} else {
			calendar = Calendar.getInstance();
		}
		calendar.setTime(eventStart);
		switch (alarmTrigger) {
			case FIVE_MINUTES:
				calendar.add(Calendar.MINUTE, -5);
				break;
			case TEN_MINUTES:
				calendar.add(Calendar.MINUTE, -10);
				break;
			case THIRTY_MINUTES:
				calendar.add(Calendar.MINUTE, -30);
				break;
			case ONE_HOUR:
				calendar.add(Calendar.HOUR, -1);
				break;
			case ONE_DAY:
				calendar.add(Calendar.DAY_OF_MONTH, -1);
				break;
			case TWO_DAYS:
				calendar.add(Calendar.DAY_OF_MONTH, -2);
				break;
			case THREE_DAYS:
				calendar.add(Calendar.DAY_OF_MONTH, -3);
				break;
			case ONE_WEEK:
				calendar.add(Calendar.WEEK_OF_MONTH, -1);
				break;
		}
		return calendar.getTime();
	}

	public static Date getAllDayDateUTC(Date localDate, TimeZone localTimeZone) {
		Calendar calendar = Calendar.getInstance(localTimeZone);
		calendar.setTime(localDate);
		Calendar utcCalendar = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
		utcCalendar.set(calendar.get(Calendar.YEAR), calendar.get(Calendar.MONTH), calendar.get(Calendar.DAY_OF_MONTH), 0, 0, 0);
		utcCalendar.set(Calendar.MILLISECOND, 0);
		return utcCalendar.getTime();
	}

	public static Date getAllDayDateLocal(Date utcDate, TimeZone localTimeZone) {
		Calendar utcCalendar = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
		utcCalendar.setTime(utcDate);
		Calendar calendar = Calendar.getInstance(localTimeZone);
		calendar.set(utcCalendar.get(Calendar.YEAR), utcCalendar.get(Calendar.MONTH), utcCalendar.get(Calendar.DAY_OF_MONTH), 0, 0, 0);
		calendar.set(Calendar.MILLISECOND, 0);
		return calendar.getTime();
	}

	public static boolean isAllDayEventByTimes(Date startDate, Date endDate) {
		Calendar calendar = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
		calendar.setTime(startDate);
		boolean startFits = calendar.get(Calendar.HOUR) == 0 && calendar.get(Calendar.MINUTE) == 0 && calendar.get(Calendar.SECOND) == 0;
		calendar.setTime(endDate);
		boolean endFits = calendar.get(Calendar.HOUR) == 0 && calendar.get(Calendar.MINUTE) == 0 && calendar.get(Calendar.SECOND) == 0;
		return startFits && endFits;
	}
}
