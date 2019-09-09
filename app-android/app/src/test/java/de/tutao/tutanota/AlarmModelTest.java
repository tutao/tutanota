package de.tutao.tutanota;

import de.tutao.tutanota.alarms.AlarmModel;
import de.tutao.tutanota.alarms.AlarmTrigger;
import de.tutao.tutanota.alarms.EndType;
import de.tutao.tutanota.alarms.RepeatPeriod;
import org.junit.Test;

import java.util.*;

import static de.tutao.tutanota.alarms.AlarmModel.getAllDayDateUTC;
import static org.junit.Assert.assertArrayEquals;

public class AlarmModelTest {

	private final TimeZone timeZone = TimeZone.getTimeZone("Europe/Berlin");

	@Test
	public void testIterates() {
		List<Date> occurrences = new ArrayList<>();

		long now = getDate(timeZone, 2019, 4, 2, 0, 0).getTime();
		Date eventStart = getDate(timeZone, 2019, 4, 2, 12, 0);

		AlarmModel.iterateAlarmOccurrences(now, timeZone, eventStart, eventStart, RepeatPeriod.WEEKLY,
				1, EndType.NEVER, 0, AlarmTrigger.ONE_HOUR, timeZone,
				(time, occurrence, occurenceTime) -> occurrences.add(time)
		);

		assertArrayEquals(Arrays.asList(
				getDate(timeZone, 2019, 4, 2, 11, 0),
				getDate(timeZone, 2019, 4, 9, 11, 0),
				getDate(timeZone, 2019, 4, 16, 11, 0),
				getDate(timeZone, 2019, 4, 23, 11, 0)
		).toArray(), occurrences.subList(0, 4).toArray());
	}


	@Test
	public void testAllDayEndOnDate() {
		List<Date> occurrences = new ArrayList<>();

		TimeZone repeatTimeZone = TimeZone.getTimeZone("Asia/Anadyr");

		long now = getDate(repeatTimeZone, 2019, 4, 1, 0, 0).getTime();
		// UTC date just encodes the date, whatever you pass to it. You just have to extract consistently
		Date eventStart = getAllDayDateUTC(getDate(timeZone, 2019, 4, 2, 0, 0), timeZone);
		Date eventEnd = getAllDayDateUTC(getDate(timeZone, 2019, 4, 3, 0, 0), timeZone);
		Date repeatEnd = getAllDayDateUTC(getDate(timeZone, 2019, 4, 4, 0, 0), timeZone);

		AlarmModel.iterateAlarmOccurrences(now, repeatTimeZone, eventStart, eventEnd, RepeatPeriod.DAILY,
				1, EndType.UNTIL, repeatEnd.getTime(), AlarmTrigger.ONE_DAY, timeZone,
				(time, occurrence, occurrenceTime) -> occurrences.add(time)
		);


		List<Date> expected = Arrays.asList(
				// Event on 2nd, alarm on 1st
				getDate(timeZone, 2019, 4, 1, 0, 0),
				// Event on 3rd, alarm on 2d
				getDate(timeZone, 2019, 4, 2, 0, 0)
				// No even on 4rd (because endDate is 4th)
		);
		assertArrayEquals(expected.toArray(), occurrences.toArray());
	}

	private Date getDate(TimeZone timeZone, int year, int month, int day, int hour, int minute) {
		Calendar calendar = Calendar.getInstance(timeZone);
		calendar.set(year, month, day, hour, minute, 0);
		calendar.set(Calendar.MILLISECOND, 0);
		return calendar.getTime();
	}
}
