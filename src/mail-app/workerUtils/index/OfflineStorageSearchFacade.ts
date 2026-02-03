import { SearchFacade } from "./SearchFacade"
import { MoreResultsIndexEntry, SearchRestriction, SearchResult } from "../../../common/api/worker/search/SearchTypes"
import { sql } from "../../../common/api/worker/offline/Sql"
import { untagSqlValue } from "../../../common/api/worker/offline/SqlValue"
import { SqlCipherFacade } from "../../../common/native/common/generatedipc/SqlCipherFacade"
import { MailIndexer } from "./MailIndexer"
import { getSearchEndTimestamp } from "../../../common/api/common/utils/IndexUtils"
import { first, isEmpty, isSameTypeRef, splitArrayAt } from "@tutao/tutanota-utils"
import { ContactTypeRef, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError"
import { ContactIndexer } from "./ContactIndexer"
import { FULL_INDEXED_TIMESTAMP, NOTHING_INDEXED_TIMESTAMP } from "../../../common/api/common/TutanotaConstants"
import { SearchToken, splitQuery } from "../../../common/api/common/utils/QueryTokenUtils"
import { elementIdPart } from "../../../common/api/common/utils/EntityUtils"

/**
 * Handles preparing and running SQLite+FTS5 search queries
 */
export class OfflineStorageSearchFacade implements SearchFacade {
	constructor(
		private readonly sqlCipherFacade: SqlCipherFacade,
		private readonly mailIndexer: MailIndexer,
		private readonly contactIndexer: ContactIndexer,
	) {}

	async search(query: string, restriction: SearchRestriction, _minSuggestionCount: number, maxResults?: number): Promise<SearchResult> {
		const tokens = await this.tokenize(query)

		if (isSameTypeRef(restriction.type, MailTypeRef)) {
			return this.searchMails(query, tokens, restriction, maxResults)
		} else if (isSameTypeRef(restriction.type, ContactTypeRef)) {
			return this.searchContacts(query, tokens, restriction)
		} else {
			throw new ProgrammingError(`cannot search ${restriction.type.typeId}`)
		}
	}

	private emptySearchResult(query: string, restriction: SearchRestriction, currentIndexTimestamp: number): SearchResult {
		return {
			query,
			tokens: [],
			restriction,
			results: [],
			currentIndexTimestamp,
			lastReadSearchIndexRow: [],
			matchWordOrder: false,
			moreResults: [],
			moreResultsEntries: [],
		}
	}

	private async searchMails(originalQuery: string, tokens: SearchToken[], restriction: SearchRestriction, maxResults?: number): Promise<SearchResult> {
		// folderIds always have zero or one IDs for mail search
		if (restriction.folderIds.length > 1) {
			throw new ProgrammingError("cannot search mails with more than one mailset search restriction")
		}

		if (isEmpty(tokens)) {
			return this.emptySearchResult(originalQuery, restriction, getSearchEndTimestamp(this.mailIndexer.currentIndexTimestamp, restriction))
		} else {
			// Create our FTS5 query
			const normalizedQuery = this.normalizeQuery(tokens)

			// An empty string will match any ID
			const idToSearch = first(restriction.folderIds) ?? ""

			// Do the actual search query.
			//
			// This will also filter based on date range and sets, and it will order by received date in descending order so
			// that newer emails appear first in the returned list.
			//
			// Note: We use instr() for checking for sets, but there's a small gotcha: instr() is 1-indexed, returning 0
			// if not found, 1 for the first char, etc.; see https://www.sqlitetutorial.net/sqlite-functions/sqlite-instr/
			//
			// Field filtering: FTS5 contentless tables ignore column filters (e.g., {sender} : term), so we must
			// filter by the actual field content stored in content_mail_index using SQL WHERE clauses.
			// We check if ALL tokens appear in the target field(s) using INSTR for each token.
			const fieldFilter = this.buildFieldFilterClause(tokens, restriction.field)
			const preparedSqlQuery = sql`
                SELECT list_entities.listId,
                       list_entities.elementId
                FROM mail_index
                         INNER JOIN list_entities ON
                    mail_index.rowid = list_entities.rowid
                         INNER JOIN content_mail_index ON
                    list_entities.rowid = content_mail_index.rowid
                WHERE mail_index = ${normalizedQuery}
                  AND instr(content_mail_index.sets, ${idToSearch}) > 0
                  AND content_mail_index.receivedDate <= ${restriction.start ?? Number.MAX_SAFE_INTEGER}
                  AND content_mail_index.receivedDate >= ${restriction.end ?? 0}
                  ${fieldFilter}
                ORDER BY content_mail_index.receivedDate DESC`
			const resultRows = await this.sqlCipherFacade.all(preparedSqlQuery.query, preparedSqlQuery.params)
			const resultIds = resultRows.map(({ listId, elementId }) => {
				return [untagSqlValue(listId) as string, untagSqlValue(elementId) as string] satisfies IdTuple
			})

			let results: IdTuple[]
			let moreResultsEntries: IdTuple[]

			if (maxResults == null || resultIds.length <= maxResults) {
				// Everything can fit in `maxResults`
				results = resultIds
				moreResultsEntries = []
			} else {
				// We want to keep all of the IDs for the remaining results in an array so we don't need to do this
				// search again (also minimizes IPC calls), but the underlying search facade also won't try to load all
				// mails at once.
				const [returnedIds, remainingIds] = splitArrayAt(resultIds, maxResults)
				results = returnedIds
				moreResultsEntries = remainingIds
			}

			return {
				query: originalQuery,
				tokens,
				restriction,
				results,
				moreResults: [],
				currentIndexTimestamp: getSearchEndTimestamp(this.mailIndexer.currentIndexTimestamp, restriction),
				lastReadSearchIndexRow: [],
				matchWordOrder: false,
				moreResultsEntries,
			}
		}
	}

	private async searchContacts(originalQuery: string, tokens: SearchToken[], restriction: SearchRestriction): Promise<SearchResult> {
		const indexTimestamp = (await this.contactIndexer.areContactsIndexed()) ? FULL_INDEXED_TIMESTAMP : NOTHING_INDEXED_TIMESTAMP

		if (isEmpty(tokens)) {
			return this.emptySearchResult(originalQuery, restriction, getSearchEndTimestamp(indexTimestamp, restriction))
		} else {
			// Create our FTS5 query
			const normalizedQuery = this.normalizeQuery(tokens)

			const columnList = contactFieldToColumn(restriction.field)
			const queryString = columnList != null ? `{${columnList}} : ${normalizedQuery}` : normalizedQuery
			const preparedSqlQuery = sql`
                SELECT list_entities.listId,
                       list_entities.elementId
                FROM contact_index
                         INNER JOIN list_entities ON
                    contact_index.rowid = list_entities.rowid
                WHERE contact_index = ${queryString}
                ORDER BY contact_index.firstName, contact_index.lastName`

			const resultRows = await this.sqlCipherFacade.all(preparedSqlQuery.query, preparedSqlQuery.params)
			const resultIds = resultRows.map(({ listId, elementId }) => {
				return [untagSqlValue(listId) as string, untagSqlValue(elementId) as string] satisfies IdTuple
			})

			return {
				query: originalQuery,
				tokens,
				restriction,
				results: resultIds,
				currentIndexTimestamp: getSearchEndTimestamp(indexTimestamp, restriction),
				lastReadSearchIndexRow: [],
				matchWordOrder: false,
				moreResults: [],
				moreResultsEntries: [],
			}
		}
	}

	async getMoreSearchResults(searchResult: SearchResult, count: number): Promise<SearchResult> {
		// We already have all of the IDs loaded, thus we really just need to extend our results
		let [addedResultsEntries, remainingExtraResultsEntries] = splitArrayAt(searchResult.moreResultsEntries, count)
		searchResult.results.push(...addedResultsEntries)
		searchResult.moreResultsEntries = remainingExtraResultsEntries
		return searchResult
	}

	async tokenize(phrase: string): Promise<SearchToken[]> {
		const tokens: SearchToken[] = []
		for (const token of splitQuery(phrase)) {
			if (token.exact) {
				tokens.push(token)
			} else {
				// split further down into words (as splitQuery does not handle CJK, but the facade's tokenizer does)
				for (const word of await this.sqlCipherFacade.tokenize(token.token)) {
					if (word !== "") {
						tokens.push({
							token: word,
							exact: false,
						})
					}
				}
			}
		}
		return tokens
	}

	/**
	 * Take an array of tokens created from splitTokens and return an FTS5 search query.
	 *
	 * Non-exact tokens will have an asterisk appended to indicate they are prefixes.
	 *
	 * For example, splitQuery(`hello world this is "my string"`) becomes `"hello"* "world"* "this"* "is"* "my string"`
	 *
	 * See https://sqlite.org/fts5.html
	 *
	 * @param tokens tokens to normalize
	 * @return normalized query that can be used for FTS5
	 * @private
	 * @VisibleForTesting
	 */
	normalizeQuery(tokens: readonly SearchToken[]): string {
		const normalizedQuery: string[] = []

		for (const token of tokens) {
			if (token.exact) {
				normalizedQuery.push(`"${token.token}"`)
			} else {
				// match the start of a token (e.g. "free"* will match "freedom")
				normalizedQuery.push(`"${token.token}"*`)
			}
		}

		return normalizedQuery.join(" ")
	}

	/**
	 * Build a SQL clause to filter search results by specific mail fields.
	 *
	 * FTS5 contentless tables ignore column filters (e.g., {sender} : term), so we need to
	 * filter by the actual field content stored in content_mail_index using SQL WHERE clauses.
	 * For each token, we check if it appears in the target field(s) using INSTR (case-insensitive via LOWER).
	 *
	 * @param tokens the search tokens
	 * @param field the field to filter by (null means no field filtering)
	 * @returns SQL clause string to append to WHERE, or empty string if no filtering needed
	 * @private
	 */
	private buildFieldFilterClause(tokens: readonly SearchToken[], field: string | null): string {
		if (field == null) {
			return ""
		}

		const columns = mailFieldToContentColumn(field)
		if (columns == null) {
			return ""
		}

		// For each token, we need to ensure it appears in at least one of the target columns.
		// We use LOWER() for case-insensitive matching and INSTR to check for substring presence.
		const tokenClauses: string[] = []
		for (const token of tokens) {
			const columnChecks = columns.map((col) => `INSTR(LOWER(content_mail_index.${col}), LOWER('${this.escapeForSql(token.token)}')) > 0`)
			// Token must appear in at least one of the target columns
			tokenClauses.push(`(${columnChecks.join(" OR ")})`)
		}

		if (tokenClauses.length === 0) {
			return ""
		}

		// All tokens must match (AND between token clauses)
		return `AND (${tokenClauses.join(" AND ")})`
	}

	/**
	 * Escape a string for safe use in SQL. Escapes single quotes by doubling them.
	 * @private
	 */
	private escapeForSql(value: string): string {
		return value.replace(/'/g, "''")
	}
}

/**
 * Map search field names to content_mail_index column names for field-specific filtering.
 * Note: subject, body, and attachments are NOT stored in content_mail_index,
 * so field filtering for those is not supported (falls back to FTS5 matching).
 */
function mailFieldToContentColumn(field: string | null): string[] | null {
	switch (field) {
		case null:
			return null
		case "from":
			return ["sender"]
		case "to":
			return ["toRecipients", "ccRecipients", "bccRecipients"]
		case "subject":
		case "body":
		case "attachment":
			// These fields are not stored in content_mail_index, so no additional filtering possible
			return null
		default:
			throw new ProgrammingError(`Unknown field "${field}" passed into mailFieldToContentColumn`)
	}
}

// Important: This should be kept up-to-date with SEARCH_MAIL_FIELDS
// Note: This function is no longer used for contentless FTS5 filtering but kept for reference
function mailFieldToColumn(field: string | null): string[] | null {
	switch (field) {
		case null:
			return null
		case "from":
			return ["sender"]
		case "subject":
			return ["subject"]
		case "body":
			return ["body"]
		case "to":
			return ["toRecipients", "ccRecipients", "bccRecipients"]
		case "attachment":
			return ["attachments"]
		default:
			throw new ProgrammingError(`Unknown field "${field}" passed into mailFieldToColumn`)
	}
}

function contactFieldToColumn(field: string | null): string[] | null {
	switch (field) {
		case "mailAddresses":
			// note the plural in the column name
			return ["mailAddresses"]
		case null:
			return null
		default:
			throw new ProgrammingError(`Unknown field "${field}" passed into contactFieldToColumn`)
	}
}
