package de.tutao.tutashared.push

class PushNotificationJobState(
	/** Whether jobParameters is not null; should be true when a job is currently running. */
	var active: Boolean
)