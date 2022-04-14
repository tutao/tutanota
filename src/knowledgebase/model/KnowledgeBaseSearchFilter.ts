import type {KnowledgeBaseEntry} from "../../api/entities/tutanota/TypeRefs.js"
import {search} from "../../api/common/utils/PlainTextSearch"

export function knowledgeBaseSearch(input: string, allEntries: ReadonlyArray<KnowledgeBaseEntry>): ReadonlyArray<KnowledgeBaseEntry> {
	return search(input, allEntries, ["title", "description", "keywords.keyword"], false)
}