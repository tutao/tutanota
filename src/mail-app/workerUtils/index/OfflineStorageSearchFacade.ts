import { SearchFacade } from "./SearchFacade"
import { SearchRestriction, SearchResult } from "../../../common/api/worker/search/SearchTypes"
import { sql } from "../../../common/api/worker/offline/Sql"
import { untagSqlValue } from "../../../common/api/worker/offline/SqlValue"
import { SqlCipherFacade } from "../../../common/native/common/generatedipc/SqlCipherFacade"
import { MailIndexer } from "./MailIndexer"
import { getSearchEndTimestamp } from "../../../common/api/worker/search/IndexUtils"
import { first, isSameTypeRef } from "@tutao/tutanota-utils"
import { ContactTypeRef, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError"
import { ContactIndexer } from "./ContactIndexer"
import { FULL_INDEXED_TIMESTAMP, NOTHING_INDEXED_TIMESTAMP } from "../../../common/api/common/TutanotaConstants"

/**
 * Handles preparing and running SQLite+FTS5 search queries
 */
export class OfflineStorageSearchFacade implements SearchFacade {
	constructor(
		private readonly sqlCipherFacade: SqlCipherFacade,
		private readonly mailIndexer: MailIndexer,
		private readonly contactIndexer: ContactIndexer,
	) {}

	async search(query: string, restriction: SearchRestriction, _minSuggestionCount: number, _maxResults?: number): Promise<SearchResult> {
		const normalizedQuery = normalizeQuery(query)

		if (isSameTypeRef(restriction.type, MailTypeRef)) {
			return this.searchMails(query, normalizedQuery, restriction)
		} else if (isSameTypeRef(restriction.type, ContactTypeRef)) {
			return this.searchContacts(query, normalizedQuery, restriction)
		} else {
			throw new ProgrammingError(`cannot search ${restriction.type.type}`)
		}
	}

	private async searchMails(originalQuery: string, normalizedQuery: string, restriction: SearchRestriction): Promise<SearchResult> {
		// folderIds always have zero or one IDs for mail search
		if (restriction.folderIds.length > 1) {
			throw new ProgrammingError("cannot search mails with more than one mailset search restriction")
		}

		// An empty string will match any ID
		const idToSearch = first(restriction.folderIds) ?? ""

		// Match a field to a column.
		//
		// In FTS5, single columns are matched like `column : "token1" "token2"` or, for multiple columns (as OR), you
		// can use `{column1 column2} : "token1" "token2" (note that matching one column like this is also allowed).
		//
		// Otherwise, we pass the query string as-is.
		const columnList = mailFieldToColumn(restriction.field)?.join(" ")
		const queryString = columnList != null ? `{${columnList}} : ${normalizedQuery}` : normalizedQuery

		// Do the actual search query.
		//
		// This will also filter based on date range and sets, and it will order by received date in descending order so
		// that newer emails appear first in the returned list.
		//
		// Note: We use instr() for checking for sets, but there's a small gotcha: instr() is 1-indexed, returning 0
		// if not found, 1 for the first char, etc.; see https://www.sqlitetutorial.net/sqlite-functions/sqlite-instr/
		const preparedSqlQuery = sql`
            SELECT list_entities.listId,
                   list_entities.elementId
            FROM mail_index
                     INNER JOIN list_entities ON
                mail_index.rowid = list_entities.rowid
                     INNER JOIN content_mail_index ON
                list_entities.rowid = content_mail_index.rowid
            WHERE mail_index = ${queryString}
              AND instr(content_mail_index.sets, ${idToSearch}) > 0
              AND content_mail_index.receivedDate <= ${restriction.end ?? Number.MAX_SAFE_INTEGER}
              AND content_mail_index.receivedDate >= ${restriction.start ?? 0}
            ORDER BY content_mail_index.receivedDate DESC`
		const resultRows = await this.sqlCipherFacade.all(preparedSqlQuery.query, preparedSqlQuery.params)
		const resultIds = resultRows.map(({ listId, elementId }) => {
			return [untagSqlValue(listId) as string, untagSqlValue(elementId) as string] satisfies IdTuple
		})
		return {
			query: originalQuery,
			restriction,
			results: resultIds,
			currentIndexTimestamp: getSearchEndTimestamp(this.mailIndexer.currentIndexTimestamp, restriction),
			lastReadSearchIndexRow: [],
			matchWordOrder: false,
			moreResults: [],
			moreResultsEntries: [],
		}
	}

	private async searchContacts(originalQuery: string, normalizedQuery: string, restriction: SearchRestriction): Promise<SearchResult> {
		const preparedSqlQuery = sql`
            SELECT list_entities.listId,
                   list_entities.elementId
            FROM contact_index
                     INNER JOIN list_entities ON
                contact_index.rowid = list_entities.rowid
            WHERE contact_index = ${normalizedQuery}
            ORDER BY contact_index.firstName, contact_index.lastName`
		const resultRows = await this.sqlCipherFacade.all(preparedSqlQuery.query, preparedSqlQuery.params)
		const resultIds = resultRows.map(({ listId, elementId }) => {
			return [untagSqlValue(listId) as string, untagSqlValue(elementId) as string] satisfies IdTuple
		})
		const indexTimestamp = (await this.contactIndexer.areContactsIndexed()) ? FULL_INDEXED_TIMESTAMP : NOTHING_INDEXED_TIMESTAMP

		return {
			query: originalQuery,
			restriction,
			results: resultIds,
			currentIndexTimestamp: getSearchEndTimestamp(indexTimestamp, restriction),
			lastReadSearchIndexRow: [],
			matchWordOrder: false,
			moreResults: [],
			moreResultsEntries: [],
		}
	}

	async getMoreSearchResults(searchResult: SearchResult, _: number): Promise<SearchResult> {
		// There isn't really any need in "more" search results, and we never promise any so this is no-op
		return searchResult
	}
}

// Important: This should be kept up-to-date with SEARCH_MAIL_FIELDS
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

/**
 * Split into FTS5 search tokens and return the query
 *
 * For words that are not in quotes, they will match the start of a string.
 * Otherwise, they will be fully matched.
 *
 * For example, `hello world this is "my string"` becomes `"hello"* "world"* "this"* "is"* "my string"`
 *
 * See https://sqlite.org/fts5.html
 *
 * @param query query to check
 * @return normalized query that can be used for FTS5
 * @VisibleForTesting
 */
export function normalizeQuery(query: string): string {
	const normalizedQuery: string[] = []

	let quoted = false
	for (const block of query.split('"')) {
		if (quoted) {
			// in quotes; match an exact token or phrase (e.g. "free" will not match "freedom")
			const trimmed = block.trim()
			if (trimmed !== "") {
				normalizedQuery.push(`"${trimmed}"`)
			}
		} else {
			// split into words and, for each word, match the start of a token (e.g. "free"* will match "freedom")
			for (const word of block.split(/\s+/)) {
				if (word !== "") {
					normalizedQuery.push(`"${word}"*`)
				}
			}
		}
		quoted = !quoted
	}
	// if !quoted here, then the user is likely in the middle of typing a quoted string, which is fine

	return normalizedQuery.join(" ")
}
