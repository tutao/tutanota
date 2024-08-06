package de.tutao.calendar

import de.tutao.tutashared.isLightHexColor
import de.tutao.tutashared.parseColor
import org.junit.Assert
import org.junit.Test

class UtilsTest {
	@Test
	fun testIsColorLightPinkDark() {
		Assert.assertFalse("#B73A9A".isLightHexColor())
	}

	@Test
	fun testIsColorLightBlueLight() {
		Assert.assertTrue("#3A9AFF".isLightHexColor())
	}

	@Test
	fun testIsThreeDigitBlackDark() {
		Assert.assertFalse("#000".isLightHexColor())
	}

	@Test
	fun testIsThreeDigitWhiteLight() {
		Assert.assertTrue("#FFF".isLightHexColor())
	}

	@Test
	fun testIsThreeDigitCyanLight() {
		Assert.assertTrue("#0FF".isLightHexColor())
	}

	@Test
	fun testParseSixDigitColors() {
		Assert.assertEquals(parseColor("#000000").toLong(), -0x1000000)
		Assert.assertEquals(parseColor("#FFFFFF").toLong(), -0x1)
		Assert.assertEquals(parseColor("#FABDAD").toLong(), -0x54253)
	}

	@Test
	fun testParseThreeDigitColors() {
		Assert.assertEquals(parseColor("#000").toLong(), -0x1000000)
		Assert.assertEquals(parseColor("#FFF").toLong(), -0x1)
		Assert.assertEquals(parseColor("#BAD").toLong(), -0x445523)
	}
}