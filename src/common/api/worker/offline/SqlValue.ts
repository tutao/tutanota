import { mapObject } from "@tutao/tutanota-utils"

export type SqlValue = null | string | number | Uint8Array

/**
 * Type tag for values being passed to SQL statements
 */
export const enum SqlType {
	Null = "SqlNull",
	Number = "SqlNum",
	String = "SqlStr",
	Bytes = "SqlBytes",
}

export type FormattedQuery = { query: string; params: TaggedSqlValue[] }
export type TaggedSqlValue =
	| { type: SqlType.Null; value: null }
	| { type: SqlType.String; value: string }
	| { type: SqlType.Number; value: number }
	| { type: SqlType.Bytes; value: Uint8Array }

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
