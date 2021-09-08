package de.tutao.tutanota;

import androidx.annotation.NonNull;

public enum JsRequest {
	updatePushIdentifier("updatePushIdentifier"),
	notify("notify"),
	createMailEditor("createMailEditor"),
	handleBackPress("handleBackPress"),
	showAlertDialog("showAlertDialog"),
	openMailbox("openMailbox"),
	openCalendar("openCalendar"),
	visibilityChange("visibilityChange"),
	invalidateAlarms("invalidateAlarms");


	private final String name;

	JsRequest(String s) {
		name = s;
	}

	@NonNull
	public String toString() {
		return this.name;
	}
}
