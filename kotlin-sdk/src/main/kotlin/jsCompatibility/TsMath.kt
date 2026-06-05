package de.tutao.jsCompatibility

import kotlin.math.pow

class TsMath {
	companion object {
		fun pow(num1: TsNumber, num2: TsNumber): TsNumber {
			return TsNumber(num1.toDouble().pow(num2.toDouble()))
		}
	}
}