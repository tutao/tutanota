import { FormattedQuery, SqlValue, TaggedSqlValue, tagSqlValue } from "./SqlValue.js"

/**
 * this tagged template function exists because android doesn't allow us to define SQL functions, so we have made a way to inline
 * SQL fragments into queries.
 * to make it less error-prone, we automate the generation of the params array for the actual sql call.
 * In this way, we offload the escaping of actual user content to the SQL engine, which makes this safe from an SQLI point of view.
 *
 * usage example:
 * const type = "sys/User"
 * const listId = "someList"
 * const startId = "ABC"
 * sql`SELECT entity FROM list_entities WHERE type = ${type} AND listId = ${listId} AND ${firstIdBigger(startId, "elementId")}`
 *
 * this will result in
 * const {query, params} = {
 *     query: `SELECT entity FROM list_entities WHERE type = ? AND listId = ? AND (CASE WHEN length(?) > length(elementId) THEN 1 WHEN length(?) < length(elementId) THEN 0 ELSE ? > elementId END)`,
 *     params: [
 *     		{type: SqlType.String, value: "sys/User"},
 *     		{type: SqlType.String, value: "someList"},
 *     		{type: SqlType.String, value: "ABC"},
 *     		{type: SqlType.String, value: "ABC"},
 *     		{type: SqlType.String, value: "ABC"}
 *     ]
 * }
 *
 * which can be consumed by sql.run(query, params).
 *
 * It is important that the caller ensures that the amount of SQL variables does not exceed MAX_SAFE_SQL_VARS!
 * Violating this rule will lead to an uncaught error with bad stack traces.
 */
export function sql(queryParts: TemplateStringsArray, ...paramInstances: (SqlValue | SqlFragment)[]): FormattedQuery {
	let query = ""
	let params: TaggedSqlValue[] = []
	let i: number
	for (i = 0; i < paramInstances.length; i++) {
		query += queryParts[i]
		const param = paramInstances[i]
		if (param instanceof SqlFragment) {
			query += param.text
			params.push(...param.params.map(tagSqlValue))
		} else {
			query += "?"
			params.push(tagSqlValue(param))
		}
	}
	query += queryParts[i]
	return { query, params }
}

export type UntaggedQuery = { query: string; params: readonly SqlValue[] }

/**
 * Like {@link sql} but without tagging the values
 */
export function usql(queryParts: TemplateStringsArray, ...paramInstances: (SqlValue | SqlFragment)[]): UntaggedQuery {
	let query = ""
	let params: SqlValue[] = []
	let i: number
	for (i = 0; i < paramInstances.length; i++) {
		query += queryParts[i]
		const param = paramInstances[i]
		if (param instanceof SqlFragment) {
			query += param.text
			params.push(...param.params)
		} else {
			query += "?"
			params.push(param)
		}
	}
	query += queryParts[i]
	return { query, params }
}

export class SqlFragment {
	constructor(readonly text: string, readonly params: SqlValue[]) {}
}
