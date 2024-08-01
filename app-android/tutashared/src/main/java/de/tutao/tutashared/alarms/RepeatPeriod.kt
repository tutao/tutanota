package de.tutao.tutashared.alarms

enum class RepeatPeriod {
	DAILY,
	WEEKLY,
	MONTHLY,
	ANNUALLY;

	fun value(): Long {
		return ordinal.toLong()
	}

	companion object {
		operator fun get(value: Long): RepeatPeriod {
			require(value <= values().size - 1) { "Unknown RepeatPeriod: $value" }
			return values()[value.toInt()]
		}
	}
}