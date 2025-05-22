package de.tutao.tutanota

import de.tutao.tutashared.alarms.AlarmInterval
import de.tutao.tutashared.alarms.AlarmIntervalUnit
import org.junit.Assert.assertEquals
import org.junit.Test

class AlarmIntervalTest {

	@Test
	fun testFromString() {
		assertEquals(AlarmInterval(AlarmIntervalUnit.MINUTE, 1), AlarmInterval.fromString("1M"))
		assertEquals(AlarmInterval(AlarmIntervalUnit.HOUR, 2), AlarmInterval.fromString("2H"))
		assertEquals(AlarmInterval(AlarmIntervalUnit.DAY, 3), AlarmInterval.fromString("3D"))
		assertEquals(AlarmInterval(AlarmIntervalUnit.WEEK, 44), AlarmInterval.fromString("44W"))
	}
}