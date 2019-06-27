package de.tutao.tutanota.alarms;

public enum RepeatPeriod {
	DAILY, WEEKLY, MONTHLY, ANNUALLY;

	public static RepeatPeriod get(int value) {
		if (value > RepeatPeriod.values().length - 1) {
			throw new IllegalArgumentException("Unknown RepeatPeriod: " + value);
		}
		return RepeatPeriod.values()[value];
	}
}
