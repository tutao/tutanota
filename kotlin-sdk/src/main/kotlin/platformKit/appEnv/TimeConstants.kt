/* Generated file. Do not edit by hand!*/
package de.tutao.platformKit.appEnv;

const val sECONDINMILLIS: number = 1000;
fun public secondsToMillis(seconds: number): number { return  seconds * sECONDINMILLIS }
const val mINUTEINMILLIS: number = secondsToMillis(60);
fun public minutesToMillis(minutes: number): number { return  minutes * mINUTEINMILLIS }
const val hOURINMILLIS: number = minutesToMillis(60);
fun public hoursToMillis(hours: number): number { return  hours * hOURINMILLIS }
const val dAYINMILLIS: number = hoursToMillis(24);
fun public daysToMillis(days: number): number { return  days * dAYINMILLIS }
const val dAYINMINUTES: number = 24 * 60;

