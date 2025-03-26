import { SearchFacade } from "./SearchFacade"
import { SearchRestriction, SearchResult } from "../../../common/api/worker/search/SearchTypes"
import { sql } from "../../../common/api/worker/offline/Sql"
import { untagSqlValue } from "../../../common/api/worker/offline/SqlValue"
import { SqlCipherFacade } from "../../../common/native/common/generatedipc/SqlCipherFacade"
import { MailIndexer } from "./MailIndexer"
import { getSearchEndTimestamp } from "../../../common/api/worker/search/IndexUtils"
import { isSameTypeRef } from "@tutao/tutanota-utils"
import { ContactTypeRef, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError"
import { ContactIndexer } from "./ContactIndexer"

/**
 * Handles preparing and running SQLite+FTS5 search queries
 */
export class OfflineStorageSearchFacade implements SearchFacade {
	constructor(
		private readonly sqlCipherFacade: SqlCipherFacade,
		private readonly mailIndexer: MailIndexer,
		private readonly contactIndexer: ContactIndexer,
	) {}

	async search(query: string, restriction: SearchRestriction, minSuggestionCount: number, maxResults?: number): Promise<SearchResult> {
		// For FTS5, tokens with special characters or "AND", "OR", or "NOT" must be escaped with quotes, though we can
		// also just escape all tokens with quotes for simplicity. Then, to include quotes mid-query like this, we
		// replace " with "". Lastly, we add a `*` at the end of each token to match prefixes.
		//
		// See https://www.sqlite.org/fts5.html
		//
		// The code below is from https://github.com/signalapp/Signal-Desktop/blob/a714a31b3990c64801f1c43b3d465877719f30a4/ts/sql/Server.ts#L1873
		// but simplified (we don't do tokenizing here)
		const normalizedQuery = query
			.split(/\s+/)
			.map((token) => `"${token.replace(/"/g, '""')}"*`)
			.join(" ")

		if (isSameTypeRef(restriction.type, MailTypeRef)) {
			return this.searchMails(query, normalizedQuery, restriction, maxResults)
		} else if (isSameTypeRef(restriction.type, ContactTypeRef)) {
			return this.searchContacts(query, normalizedQuery, restriction, maxResults)
		} else {
			throw new ProgrammingError(`cannot search ${restriction.type.type}`)
		}
	}

	private async searchMails(originalQuery: string, normalizedQuery: string, restriction: SearchRestriction, maxResults?: number): Promise<SearchResult> {
		const preparedSqlQuery = sql`
			SELECT list_entities.listId,
				   list_entities.elementId
			FROM mail_index
					 INNER JOIN list_entities ON
				mail_index.rowid = list_entities.rowid
					 INNER JOIN content_mail_index ON
				list_entities.rowid = content_mail_index.rowid
			WHERE mail_index = ${normalizedQuery}
			ORDER BY content_mail_index.receivedDate DESC
				LIMIT ${maxResults ?? Number.MAX_SAFE_INTEGER}`
		const resultRows = await this.sqlCipherFacade.all(preparedSqlQuery.query, preparedSqlQuery.params)
		const resultIds = resultRows.map(({ listId, elementId }) => {
			return [untagSqlValue(listId) as string, untagSqlValue(elementId) as string] satisfies IdTuple
		})
		const result: SearchResult = {
			query: originalQuery,
			restriction,
			results: resultIds,
			currentIndexTimestamp: getSearchEndTimestamp(this.mailIndexer.currentIndexTimestamp, restriction),
			lastReadSearchIndexRow: [],
			matchWordOrder: false,
			moreResults: [],
			moreResultsEntries: [],
		}
		return result
	}

	private async searchContacts(originalQuery: string, normalizedQuery: string, restriction: SearchRestriction, maxResults?: number): Promise<SearchResult> {
		const preparedSqlQuery = sql`
            SELECT list_entities.listId,
                   list_entities.elementId
            FROM contact_index
                     INNER JOIN list_entities ON
                contact_index.rowid = list_entities.rowid
            WHERE contact_index = ${normalizedQuery}
            ORDER BY contact_index.lastName, contact_index.firstName
                LIMIT ${maxResults ?? Number.MAX_SAFE_INTEGER}`
		const resultRows = await this.sqlCipherFacade.all(preparedSqlQuery.query, preparedSqlQuery.params)
		const resultIds = resultRows.map(({ listId, elementId }) => {
			return [untagSqlValue(listId) as string, untagSqlValue(elementId) as string] satisfies IdTuple
		})
		const result: SearchResult = {
			query: originalQuery,
			restriction,
			results: resultIds,
			currentIndexTimestamp: getSearchEndTimestamp(this.contactIndexer.currentIndexTimestamp, restriction),
			lastReadSearchIndexRow: [],
			matchWordOrder: false,
			moreResults: [],
			moreResultsEntries: [],
		}
		return result
	}

	async getMoreSearchResults(searchResult: SearchResult, _: number): Promise<SearchResult> {
		// There isn't really any need in "more" search results, and we never promise any so this is no-op
		return searchResult
	}
}
