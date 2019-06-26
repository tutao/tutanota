package de.tutao.tutanota;

import org.junit.Before;
import org.junit.Test;

import java.io.File;
import java.net.URL;
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

import static org.junit.Assert.assertArrayEquals;

public class AlarmModelTest {

    TimeZone timeZone = TimeZone.getTimeZone("Europe/Berlin");

//    @Before
//    public void before() {
//        ClassLoader classLoader = getClass().getClassLoader();
//        URL resource = classLoader.getResource("resources/AlarmCompatibilityTest.json");
//        File file = new File(resource.getPath());
//        System.out.println(file.exists());
//    }

    @Test
    public void testShortWithTime() {
        List<Date> occurrences = new ArrayList<>();

        long now = getDate(timeZone, 2019, 4, 2, 0, 0).getTime();
        Date eventStart = getDate(timeZone, 2019, 4, 2, 12, 0);

        AlarmModel.iterateAlarmOccurrences(now, timeZone, eventStart, RepeatPeriod.WEEKLY,
                1, EndType.NEVER, 0, AlarmTrigger.ONE_HOUR,
                (time, occurrence) -> occurrences.add(time)
        );

        assertArrayEquals(Arrays.asList(
                getDate(timeZone, 2019, 4, 2, 11, 0),
                getDate(timeZone, 2019, 4, 9, 11, 0),
                getDate(timeZone, 2019, 4, 16, 11, 0),
                getDate(timeZone, 2019, 4, 23, 11, 0)
        ).toArray(), occurrences.subList(0, 4).toArray());
    }

    private Date getDate(TimeZone timeZone, int year, int month, int day, int hour, int minute) {
        Calendar calendar = Calendar.getInstance(timeZone);
        calendar.set(year, month, day, hour, minute, 0);
        calendar.set(Calendar.MILLISECOND, 0);
        return calendar.getTime();
    }
}
