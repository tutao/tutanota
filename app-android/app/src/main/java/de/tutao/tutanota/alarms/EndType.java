package de.tutao.tutanota.alarms;

public enum EndType {
	NEVER, COUNT, UNTIL;


	public static EndType get(long value) {
		if (value > EndType.values().length - 1) {
			throw new IllegalArgumentException("Unknown EndType: " + value);
		}
		return EndType.values()[(int) value];
	}
}

