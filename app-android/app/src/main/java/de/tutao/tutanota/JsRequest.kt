package de.tutao.tutanota

enum class JsRequest(private val requestName: String) {
	updatePushIdentifier("updatePushIdentifier"),
	notify("notify"),
	createMailEditor("createMailEditor"),
	handleBackPress("handleBackPress"),
	showAlertDialog("showAlertDialog"),
	openMailbox("openMailbox"),
	openCalendar("openCalendar"),
	visibilityChange("visibilityChange"),
	invalidateAlarms("invalidateAlarms");

	override fun toString(): String {
		return requestName
	}
}