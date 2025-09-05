package de.tutao.tutashared

class SuspensionHandler {
	private val isSuspended: Boolean = false
	private val suspendedUntil: Int = 0
	private val deferredRequests: MutableList<() -> Unit> = mutableListOf()
	private val hasSentInfoMessage: Boolean = false

	
}