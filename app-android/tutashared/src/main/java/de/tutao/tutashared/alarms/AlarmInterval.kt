package de.tutao.tutashared.alarms


enum class AlarmIntervalUnit(
	private val value: String,
) {
	MINUTE("M"), HOUR("H"), DAY("D"), WEEK("W");

	companion object {
		fun get(value: String): AlarmIntervalUnit {
			for (alarmTrigger in AlarmIntervalUnit.values()) {
				if (alarmTrigger.value == value) {
					return alarmTrigger
				}
			}
			throw IllegalArgumentException("Invalid AlarmIntervalUnit $value")
		}
	}
}

data class AlarmInterval(
	val unit: AlarmIntervalUnit,
	val value: Int,
) {
	companion object {
		fun fromString(string: String): AlarmInterval {
			val regex = Regex("(\\d+)([MHDW])")

			val matchResult = regex.matchEntire(string)
			if (matchResult != null) {
				val digitsString = matchResult.groups[1]!!.value
				val unitString = matchResult.groups[2]!!.value

				val value = digitsString.toInt()
				val unit = AlarmIntervalUnit.get(unitString)
				return AlarmInterval(unit, value)
			} else {
				throw IllegalArgumentException("Not a valid AlarmInterval ${string}")
			}
		}
	}
}