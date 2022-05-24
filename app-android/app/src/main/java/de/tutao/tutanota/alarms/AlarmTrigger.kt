package de.tutao.tutanota.alarms

enum class AlarmTrigger(
		private val value: String,
) {
	FIVE_MINUTES("5M"),
	TEN_MINUTES("10M"),
	THIRTY_MINUTES("30M"),
	ONE_HOUR("1H"),
	ONE_DAY("1D"),
	TWO_DAYS("2D"),
	THREE_DAYS("3D"),
	ONE_WEEK("1W");

	companion object {
		operator fun get(value: String): AlarmTrigger {
			for (alarmTrigger in values()) {
				if (alarmTrigger.value == value) {
					return alarmTrigger
				}
			}
			// Fallback to five minutes in the case of an invalid trigger value
			return FIVE_MINUTES
		}
	}
}