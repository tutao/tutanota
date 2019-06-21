package de.tutao.tutanota.alarms;

public enum AlarmInterval {
    FIVE_MINUTES("5M"),
    TEN_MINUTES("10M"),
    THIRTY_MINUTES("30M"),
    ONE_HOUR("1H"),
    ONE_DAY("1D"),
    TWO_DAYS("2D"),
    THREE_DAYS("3D"),
    ONE_WEEK("1W");

    private String value;

    AlarmInterval(String value) {
        this.value = value;
    }

    static AlarmInterval byValue(String value) {
        for (AlarmInterval alarmInterval : AlarmInterval.values()) {
            if (alarmInterval.value.equals(value)) {
                return alarmInterval;
            }
        }
        throw new IllegalArgumentException("No AlarmInterval for value" + value);
    }
}
