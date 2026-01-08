import o from "@tutao/otest"
import { splitIdsIntoChunksByList } from "../../../../../src/common/api/worker/facades/lazy/DriveFacade"

function generateIdTuples(count: number, listId: string = "list id") {
	const ids: IdTuple[] = []
	for (let i = 0; i < count; i++) {
		ids.push([listId, `element id ${i}`])
	}
	return ids
}

o.spec("DriveFacade", function () {
	o.spec("chonkItems", function () {
		o.test("when called with one list of each and both fit into one chunk it produces a single chunk", async function () {
			const fileIds = generateIdTuples(5)
			const folderIds = generateIdTuples(5)

			const chonked = [...splitIdsIntoChunksByList(10, fileIds, folderIds)]
			o.check(chonked).deepEquals([{ fileIdsChunk: fileIds, folderIdsChunk: folderIds }])
		})

		o.test("when called with empty fileIds and filled folderIds and both fit into one call it produces a single chunk", async function () {
			const fileIds = generateIdTuples(0)
			const folderIds = generateIdTuples(5)

			const chonked = [...splitIdsIntoChunksByList(10, fileIds, folderIds)]
			o.check(chonked).deepEquals([{ fileIdsChunk: fileIds, folderIdsChunk: folderIds }])
		})

		o.test("when called with filled fileIds and empty folderIds and both fit into one call it produces a single chunk", async function () {
			const fileIds = generateIdTuples(5)
			const folderIds = generateIdTuples(0)

			const chonked = [...splitIdsIntoChunksByList(10, fileIds, folderIds)]
			o.check(chonked).deepEquals([{ fileIdsChunk: fileIds, folderIdsChunk: folderIds }])
		})

		o.test("when called with both empty it produces no chunk at all", async function () {
			const fileIds = generateIdTuples(0)
			const folderIds = generateIdTuples(0)

			const chonked = [...splitIdsIntoChunksByList(10, fileIds, folderIds)]
			o.check(chonked).deepEquals([])
		})

		o.test("when called with same amount of each and they don't fit into a single chunk size it produces two chunks", async function () {
			const fileIds = generateIdTuples(5)
			const [fileId1, fileId2, fileId3, fileId4, fileId5] = fileIds
			const folderIds = generateIdTuples(5)
			const [folderId1, folderId2, folderId3, folderId4, folderId5] = folderIds

			const chonked = [...splitIdsIntoChunksByList(7, fileIds, folderIds)]
			o.check(chonked).deepEquals([
				{ fileIdsChunk: [fileId1, fileId2, fileId3, fileId4, fileId5], folderIdsChunk: [folderId1, folderId2] },
				{ fileIdsChunk: [], folderIdsChunk: [folderId3, folderId4, folderId5] },
			])
		})

		o.test("when called with different amounts and they don't fit into a single chunk size it produces multiple chunks", async function () {
			const fileIds = generateIdTuples(6)
			const [fileId1, fileId2, fileId3, fileId4, fileId5, fileId6] = fileIds
			const folderIds = generateIdTuples(5)
			const [folderId1, folderId2, folderId3, folderId4, folderId5] = folderIds

			const chonked = [...splitIdsIntoChunksByList(5, fileIds, folderIds)]
			o.check(chonked).deepEquals([
				{ fileIdsChunk: [fileId1, fileId2, fileId3, fileId4, fileId5], folderIdsChunk: [] },
				{ fileIdsChunk: [fileId6], folderIdsChunk: [folderId1, folderId2, folderId3, folderId4] },
				{ fileIdsChunk: [], folderIdsChunk: [folderId5] },
			])
		})

		o.test("when called with two file lists produces multiple chunks filling in folder ids", async function () {
			const fileIds1 = generateIdTuples(6, "listId1")
			const fileIds2 = generateIdTuples(6, "listId2")
			const folderIds = generateIdTuples(5)
			const [folderId1, folderId2, folderId3, folderId4, folderId5] = folderIds

			const chonked = [...splitIdsIntoChunksByList(10, [...fileIds1, ...fileIds2], folderIds)]
			o.check(chonked).deepEquals([
				{ fileIdsChunk: [...fileIds1], folderIdsChunk: [folderId1, folderId2, folderId3, folderId4] },
				{ fileIdsChunk: [...fileIds2], folderIdsChunk: [folderId5] },
			])
		})

		o.test("when called with two file lists and two folder lists produces multiple chunks", async function () {
			const fileIds1 = generateIdTuples(6, "listId1")
			const fileIds2 = generateIdTuples(6, "listId2")
			const folderIds1 = generateIdTuples(5, "fListId1")
			const folderIds2 = generateIdTuples(5, "fListId2")
			const [folderId1_1, folderId1_2, folderId1_3, folderId1_4, folderId1_5] = folderIds1

			const chonked = [...splitIdsIntoChunksByList(10, [...fileIds1, ...fileIds2], [...folderIds1, ...folderIds2])]
			o.check(chonked).deepEquals([
				{ fileIdsChunk: fileIds1, folderIdsChunk: [folderId1_1, folderId1_2, folderId1_3, folderId1_4] },
				{ fileIdsChunk: fileIds2, folderIdsChunk: [folderId1_5] },
				{ fileIdsChunk: [], folderIdsChunk: folderIds2 },
			])
		})
	})
})
