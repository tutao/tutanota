package de.tutao.tutanota

import de.tutao.tutashared.MAX_COLOR_ALPHA
import de.tutao.tutashared.isLightColor
import de.tutao.tutashared.parseColor
import org.junit.Assert
import org.junit.Test

class UtilsTest {
	@Test
	fun testIsColorLightPinkDark() {
		Assert.assertFalse((0xB73A9A or MAX_COLOR_ALPHA).isLightColor())
	}

	@Test
	fun testIsColorLightBlueLight() {
		Assert.assertTrue((0x3A9AFF or MAX_COLOR_ALPHA).isLightColor())
	}

	@Test
	fun testIsThreeDigitBlackDark() {
		Assert.assertFalse((0 or MAX_COLOR_ALPHA).isLightColor())
	}

	@Test
	fun testIsThreeDigitWhiteLight() {
		Assert.assertTrue((0xFFFFFF or MAX_COLOR_ALPHA).isLightColor())
	}

	@Test
	fun testIsThreeDigitCyanLight() {
		Assert.assertTrue((0x00FFFF or MAX_COLOR_ALPHA).isLightColor())
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