import { SearchFacade } from "./SearchFacade"
import { SearchRestriction, SearchResult } from "../../../common/api/worker/search/SearchTypes"
import { sql } from "../../../common/api/worker/offline/Sql"
import { untagSqlValue } from "../../../common/api/worker/offline/SqlValue"
import { SqlCipherFacade } from "../../../common/native/common/generatedipc/SqlCipherFacade"
import { MailIndexer } from "./MailIndexer"
import { getSearchEndTimestamp } from "../../../common/api/worker/search/IndexUtils"
import { first, isEmpty, isSameTypeRef } from "@tutao/tutanota-utils"
import { ContactTypeRef, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError"
import { ContactIndexer } from "./ContactIndexer"
import { FULL_INDEXED_TIMESTAMP, NOTHING_INDEXED_TIMESTAMP } from "../../../common/api/common/TutanotaConstants"
import { SearchToken, splitQuery } from "../../../common/api/common/utils/QueryTokenUtils"

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
		const tokens = await this.tokenize(query)

		if (isSameTypeRef(restriction.type, MailTypeRef)) {
			return this.searchMails(query, tokens, restriction)
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

	private async searchMails(originalQuery: string, tokens: SearchToken[], restriction: SearchRestriction): Promise<SearchResult> {
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
                  AND content_mail_index.receivedDate <= ${restriction.start ?? Number.MAX_SAFE_INTEGER}
                  AND content_mail_index.receivedDate >= ${restriction.end ?? 0}
                ORDER BY content_mail_index.receivedDate DESC`
			const resultRows = await this.sqlCipherFacade.all(preparedSqlQuery.query, preparedSqlQuery.params)
			const resultIds = resultRows.map(({ listId, elementId }) => {
				return [untagSqlValue(listId) as string, untagSqlValue(elementId) as string] satisfies IdTuple
			})
			return {
				query: originalQuery,
				tokens,
				restriction,
				results: resultIds,
				currentIndexTimestamp: getSearchEndTimestamp(this.mailIndexer.currentIndexTimestamp, restriction),
				lastReadSearchIndexRow: [],
				matchWordOrder: false,
				moreResults: [],
				moreResultsEntries: [],
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

			const preparedSqlQuery = sql`
                SELECT list_entities.listId,
                       list_entities.elementId
                FROM contact_index
                         INNER JOIN list_entities ON
                    contact_index.rowid = list_entities.rowid
                WHERE contact_index = ${normalizedQuery}
                ORDER BY contact_index.firstName, contact_index.lastName`

			if (restriction.field === "mailAddress") {
				// If we are searching by only mailAddress, we need to use a slightly different WHERE clause
				preparedSqlQuery.query = preparedSqlQuery.query.replace("WHERE contact_index = ?", "WHERE mailAddresses MATCH ?")
			}

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

	async getMoreSearchResults(searchResult: SearchResult, _: number): Promise<SearchResult> {
		// There isn't really any need in "more" search results, and we never promise any so this is no-op
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
