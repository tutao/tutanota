package de.tutao.tutashared.push

/** A wrapper class that allows changing of the PushNotificationService's state by
 * SseClient methods.  This is necessary because Kotlin passes by value not reference.
 */
class PushNotificationServiceStateIndicator(var state: PushNotificationServiceState)