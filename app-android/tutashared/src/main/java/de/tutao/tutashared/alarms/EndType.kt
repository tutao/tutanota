package de.tutao.tutashared.alarms

enum class EndType {
	NEVER,
	COUNT,
	UNTIL;

	companion object {
		operator fun get(value: Long): EndType {
			require(value <= values().size - 1) { "Unknown EndType: $value" }
			return values()[value.toInt()]
		}
	}
}