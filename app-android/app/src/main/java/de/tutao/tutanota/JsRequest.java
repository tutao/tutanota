package de.tutao.tutanota;

public enum JsRequest {
	updatePushIdentifier("updatePushIdentifier"),
	notify("notify"),
	createMailEditor("createMailEditor"),
	handleBackPress("handleBackPress"),
	showAlertDialog("showAlertDialog"),
	openMailbox("openMailbox"),
	openCalendar("openCalendar"),
	visibilityChange("visibilityChange");

	private final String name;

	JsRequest(String s) {
		name = s;
	}

	public String toString() {
		return this.name;
	}
}
