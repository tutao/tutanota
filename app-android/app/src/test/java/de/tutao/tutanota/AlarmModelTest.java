package de.tutao.tutanota;

import org.junit.Test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.TimeZone;

import de.tutao.tutanota.alarms.AlarmModel;
import de.tutao.tutanota.alarms.AlarmTrigger;
import de.tutao.tutanota.alarms.EndType;
import de.tutao.tutanota.alarms.RepeatPeriod;

import static de.tutao.tutanota.alarms.AlarmModel.getAllDayDateUTC;
import static org.junit.Assert.assertArrayEquals;

public class AlarmModelTest {

	private final TimeZone timeZone = TimeZone.getTimeZone("Europe/Berlin");

	@Test
	public void testIterates() {
		List<Date> occurrences = new ArrayList<>();

		Date now = getDate(timeZone, 2, 0);
		Date eventStart = getDate(timeZone, 2, 12);

		AlarmModel.iterateAlarmOccurrences(now, timeZone, eventStart, eventStart, RepeatPeriod.WEEKLY,
				1, EndType.NEVER, 0, AlarmTrigger.ONE_HOUR, timeZone,
				(time, occurrence, occurrenceTime) -> occurrences.add(time)
		);

		assertArrayEquals(Arrays.asList(
				getDate(timeZone, 2, 11),
				getDate(timeZone, 9, 11),
				getDate(timeZone, 16, 11),
				getDate(timeZone, 23, 11)
		).toArray(), occurrences.subList(0, 4).toArray());
	}


	@Test
	public void testAllDayEndOnDate() {
		List<Date> occurrences = new ArrayList<>();

		TimeZone repeatTimeZone = TimeZone.getTimeZone("Asia/Anadyr");

		Date now = getDate(repeatTimeZone, 1, 0);
		// UTC date just encodes the date, whatever you pass to it. You just have to extract consistently
		Date eventStart = getAllDayDateUTC(getDate(timeZone, 2, 0), timeZone);
		Date eventEnd = getAllDayDateUTC(getDate(timeZone, 3, 0), timeZone);
		Date repeatEnd = getAllDayDateUTC(getDate(timeZone, 4, 0), timeZone);

		AlarmModel.iterateAlarmOccurrences(now, repeatTimeZone, eventStart, eventEnd, RepeatPeriod.DAILY,
				1, EndType.UNTIL, repeatEnd.getTime(), AlarmTrigger.ONE_DAY, timeZone,
				(time, occurrence, occurrenceTime) -> occurrences.add(time)
		);


		List<Date> expected = Arrays.asList(
				// Event on 2nd, alarm on 1st
				getDate(timeZone, 1, 0),
				// Event on 3rd, alarm on 2d
				getDate(timeZone, 2, 0)
				// No even on 4rd (because endDate is 4th)
		);
		assertArrayEquals(expected.toArray(), occurrences.toArray());
	}

	private Date getDate(TimeZone timeZone, int day, int hour) {
		Calendar calendar = Calendar.getInstance(timeZone);
		calendar.set(2019, 4, day, hour, 0, 0);
		calendar.set(Calendar.MILLISECOND, 0);
		return calendar.getTime();
	}
}
