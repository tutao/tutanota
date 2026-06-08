package de.tutao.jsCompatibility

import kotlin.math.pow

object TsMath {
	fun pow(num1: TsNumber, num2: TsNumber) = TsNumber(num1.toDouble().pow(num2.toDouble()))
}
