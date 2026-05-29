/* Generated file. timestamp: 29::1780065495007*/
const val SECOND_IN_MILLIS: number = 1000

public fun secondsToMillis(seconds: number): number { 
return seconds * SECOND_IN_MILLIS
 }

const val MINUTE_IN_MILLIS: number = secondsToMillis(60)

public fun minutesToMillis(minutes: number): number { 
return minutes * MINUTE_IN_MILLIS
 }

const val HOUR_IN_MILLIS: number = minutesToMillis(60)

public fun hoursToMillis(hours: number): number { 
return hours * HOUR_IN_MILLIS
 }

const val DAY_IN_MILLIS: number = hoursToMillis(24)

public fun daysToMillis(days: number): number { 
return days * DAY_IN_MILLIS
 }

const val DAY_IN_MINUTES: number = 24 * 60

/** File End **/