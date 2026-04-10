import { tutanotaTypeRefs } from "@tutao/typeRefs"
import { search } from "../../../common/api/common/utils/PlainTextSearch.js"

export function knowledgeBaseSearch(
	input: string,
	allEntries: ReadonlyArray<tutanotaTypeRefs.KnowledgeBaseEntry>,
): ReadonlyArray<tutanotaTypeRefs.KnowledgeBaseEntry> {
	return search(input, allEntries, ["title", "description", "keywords.keyword"], false)
}
