package de.tutao.tutashared.push

enum class PushNotificationServiceStates {
	/** onCreate was called but onStartCommand hasn't been yet. */
	CREATED,

	/** onStartCommand has been called. We start holding wakeLock via job. */
	STARTED,

	/** onStartingConnection has been called. */
	CONNECTING,

	/** we received an initial message from the server, we release wakeLock by finished the job. */
	CONNECTED,

	/** The system forcibly stopped us. */
	STOPPED
}