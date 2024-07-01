import type { KnowledgeBaseEntry } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { search } from "../../../common/api/common/utils/PlainTextSearch.js"

export function knowledgeBaseSearch(input: string, allEntries: ReadonlyArray<KnowledgeBaseEntry>): ReadonlyArray<KnowledgeBaseEntry> {
	return search(input, allEntries, ["title", "description", "keywords.keyword"], false)
}
