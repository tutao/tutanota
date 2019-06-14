package de.tutao.tutanota;

public final class IdTuple {

    private final String listId;
    private final String elementId;

    public IdTuple(String listId, String elementId) {

        this.listId = listId;
        this.elementId = elementId;
    }

    public String getElementId() {
        return elementId;
    }

    public String getListId() {
        return listId;
    }
}
