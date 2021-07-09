package de.tutao.tutanota;

import org.junit.Test;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

public class UtilsTest {
	@Test
	public void testIsColorLightPinkDark() {
		assertFalse(Utils.isColorLight("B73A9A"));
	}

	@Test
	public void testIsColorLightBlueLight() {
		assertTrue(Utils.isColorLight("3A9AFF"));
	}
}
