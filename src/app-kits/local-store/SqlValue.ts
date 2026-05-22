import { mapObject } from "@tutao/utils"
import { SqlType, SqlValue, TaggedSqlValue } from "./Types"

export function tagSqlObject(params: Record<string, SqlValue>): Record<string, TaggedSqlValue> {
	return mapObject((p: SqlValue) => tagSqlValue(p), params)
}

export function tagSqlValue(param: SqlValue): TaggedSqlValue {
	if (typeof param === "string") {
		return { type: SqlType.String, value: param }
	} else if (typeof param === "number") {
		return { type: SqlType.Number, value: param }
	} else if (param == null) {
		return { type: SqlType.Null, value: null }
	} else {
		return { type: SqlType.Bytes, value: param }
	}
}

export function untagSqlValue(tagged: TaggedSqlValue): SqlValue {
	return tagged.value
}

export function untagSqlObject(tagged: Record<string, TaggedSqlValue>): Record<string, SqlValue> {
	return mapObject((p: TaggedSqlValue) => p.value, tagged)
}
