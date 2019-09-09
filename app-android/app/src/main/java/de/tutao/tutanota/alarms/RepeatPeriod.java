package de.tutao.tutanota.alarms;

public enum RepeatPeriod {
	DAILY, WEEKLY, MONTHLY, ANNUALLY;

	public static RepeatPeriod get(long value) {
		if (value > RepeatPeriod.values().length - 1) {
			throw new IllegalArgumentException("Unknown RepeatPeriod: " + value);
		}
		return RepeatPeriod.values()[(int) value];
	}
}
