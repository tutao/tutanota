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
