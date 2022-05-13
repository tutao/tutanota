package de.tutao.tutanota

enum class OperationType {
	CREATE, UPDATE, DELETE
}

class IdTuple(val listId: String, val elementId: String)