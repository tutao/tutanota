/* Generated file. timestamp: 2::1780384965011*/
const val SECOND_IN_MILLIS: Number = 1000;
fun public secondsToMillis(seconds: Number): Number { return  seconds * SECOND_IN_MILLIS }
const val MINUTE_IN_MILLIS: Number = secondsToMillis(60);
fun public minutesToMillis(minutes: Number): Number { return  minutes * MINUTE_IN_MILLIS }
const val HOUR_IN_MILLIS: Number = minutesToMillis(60);
fun public hoursToMillis(hours: Number): Number { return  hours * HOUR_IN_MILLIS }
const val DAY_IN_MILLIS: Number = hoursToMillis(24);
fun public daysToMillis(days: Number): Number { return  days * DAY_IN_MILLIS }
const val DAY_IN_MINUTES: Number = 24 * 60;

