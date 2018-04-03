package de.tutao.tutanota;

public enum JsRequest {
    updatePushIdentifier("updatePushIdentifier"),
    notify("notify"),
    createMailEditor("createMailEditor");

    private final String name;

    private JsRequest(String s) {
        name = s;
    }

    public boolean equalsName(String otherName) {
        return name.equals(otherName);
    }

    public String toString() {
        return this.name;
    }
}
