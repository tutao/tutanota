package de.tutao.tutanota.alarms;

import java.util.Calendar;
import java.util.Date;
import java.util.TimeZone;

public class AlarmModel {
    public static void iterateAlarmOccurrences(TimeZone timeZone,
                                               Date eventStart,
                                               RepeatPeriod frequency,
                                               int interval,
                                               EndType endType,
                                               int endValue,
                                               AlarmInterval alarmInterval,
                                               AlarmIterationCallback callback) {
        Calendar calendar = Calendar.getInstance(timeZone);
        long now = System.currentTimeMillis();
        int occurrences = 0;
        int futureOccurrences = 0;

        while (futureOccurrences < 10
                && (endType != EndType.COUNT
                || occurrences < endValue)) {

            calendar.setTime(eventStart);
            incrementByRepeatPeriod(calendar, frequency, interval * occurrences);

            if (endType == EndType.UNTIL && calendar.getTimeInMillis() > endValue) {
                break;
            }
            Date alarmTime = calculateAlarmTime(calendar.getTime(), timeZone, alarmInterval);

            if (calendar.getTimeInMillis() >= now) {
                callback.call(alarmTime, occurrences);
                futureOccurrences++;
            }
            occurrences++;
        }
    }

    public interface AlarmIterationCallback {
        void call(Date time, int occurrence);
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
                                          AlarmInterval alarmInterval) {
        Calendar calendar;
        if (timeZone != null) {
            calendar = Calendar.getInstance(timeZone);
        } else {
            calendar = Calendar.getInstance();
        }
        calendar.setTime(eventStart);
        switch (alarmInterval) {
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

}
