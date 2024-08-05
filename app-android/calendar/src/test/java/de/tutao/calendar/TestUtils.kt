package de.tutao.calendar

import org.mockito.AdditionalMatchers.aryEq

/**
 * Wrapper around `AdditionalMatchers::aryEq`
 * aryEq returns null, which causes an error when used on a non-null parameter
 */
fun arrayEq(array: ByteArray): ByteArray {
	aryEq(array)
	return array
}