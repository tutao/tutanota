import { search } from "../../../common/api/common/utils/PlainTextSearch.js"
import { KnowledgeBaseEntry } from "@tutao/entities/tutanota"

export function knowledgeBaseSearch(input: string, allEntries: ReadonlyArray<KnowledgeBaseEntry>): ReadonlyArray<KnowledgeBaseEntry> {
	return search(input, allEntries, ["title", "description", "keywords.keyword"], false)
}
