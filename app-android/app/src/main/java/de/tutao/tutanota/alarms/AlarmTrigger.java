package de.tutao.tutanota.alarms;

public enum AlarmTrigger {
    FIVE_MINUTES("5M"),
    TEN_MINUTES("10M"),
    THIRTY_MINUTES("30M"),
    ONE_HOUR("1H"),
    ONE_DAY("1D"),
    TWO_DAYS("2D"),
    THREE_DAYS("3D"),
    ONE_WEEK("1W");

    private String value;

    AlarmTrigger(String value) {
        this.value = value;
    }

    static AlarmTrigger byValue(String value) {
        for (AlarmTrigger alarmTrigger : AlarmTrigger.values()) {
            if (alarmTrigger.value.equals(value)) {
                return alarmTrigger;
            }
        }
        throw new IllegalArgumentException("No AlarmTrigger for value" + value);
    }
}
