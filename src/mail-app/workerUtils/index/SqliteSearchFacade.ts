import { SearchFacade } from "./SearchFacade"
import { SearchRestriction, SearchResult } from "../../../common/api/worker/search/SearchTypes"
import { sql } from "../../../common/api/worker/offline/Sql"
import { untagSqlValue } from "../../../common/api/worker/offline/SqlValue"
import { SqlCipherFacade } from "../../../common/native/common/generatedipc/SqlCipherFacade"
import { MailIndexer } from "./MailIndexer"
import { getSearchEndTimestamp } from "../../../common/api/worker/search/IndexUtils"

export class SqliteSearchFacade implements SearchFacade {
	constructor(private readonly sqlCipherFacade: SqlCipherFacade, private readonly mailIndexer: MailIndexer) {}

	async search(query: string, restriction: SearchRestriction, minSuggestionCount: number, maxResults?: number): Promise<SearchResult> {
		// from https://github.com/signalapp/Signal-Desktop/blob/a714a31b3990c64801f1c43b3d465877719f30a4/ts/sql/Server.ts#L1873
		// but simplified (we don't do tokenizing here)
		// FIXME: escape more special characters from fts5 syntax, e.g. '*'
		//  https://sqlite.org/fts5.html#full_text_query_syntax
		// FIXME: order the results by time
		const normalizedQuery = query
			.split(/\s+/)
			.map((token) => `"${token.replace(/"/g, '""')}"*`)
			.join(" ")
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
			query,
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

	async getMoreSearchResults(searchResult: SearchResult, _: number): Promise<SearchResult> {
		// There isn't really any need in "more" search results, and we never promise any so this is no-op
		return searchResult
	}
}
