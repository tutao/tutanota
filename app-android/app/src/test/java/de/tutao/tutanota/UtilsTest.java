package de.tutao.tutanota;

import org.junit.Test;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

public class UtilsTest {
	@Test
	public void testIsColorLightPinkDark() {
		assertFalse(Utils.isColorLight("#B73A9A"));
	}

	@Test
	public void testIsColorLightBlueLight() {
		assertTrue(Utils.isColorLight("#3A9AFF"));
	}

	@Test
	public void testIsThreeDigitBlackDark() {
		assertFalse(Utils.isColorLight("#000"));
	}

	@Test
	public void testIsThreeDigitWhiteLight() {
		assertTrue(Utils.isColorLight("#FFF"));
	}

	@Test
	public void testIsThreeDigitCyanLight() {
		assertTrue(Utils.isColorLight("#0FF"));
	}

	@Test
	public void testParseSixDigitColors() {
		assertEquals(Utils.parseColor("#000000"), 0xff000000);
		assertEquals(Utils.parseColor("#FFFFFF"), 0xffffffff);
		assertEquals(Utils.parseColor("#FABDAD"), 0xfffabdad);
	}

	@Test
	public void testParseThreeDigitColors() {
		assertEquals(Utils.parseColor("#000"), 0xff000000);
		assertEquals(Utils.parseColor("#FFF"), 0xffffffff);
		assertEquals(Utils.parseColor("#BAD"), 0xffbbaadd);
	}

}
