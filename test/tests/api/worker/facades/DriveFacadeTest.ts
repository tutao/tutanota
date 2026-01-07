import o from "@tutao/otest"
import { splitListElementsIntoChunksByList } from "../../../../../src/common/api/worker/facades/lazy/DriveFacade"
import { listIdPart } from "../../../../../src/common/api/common/utils/EntityUtils"

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

			const chonked = [...splitListElementsIntoChunksByList(10, listIdPart, fileIds, folderIds)]
			o.check(chonked).deepEquals([{ left: fileIds, right: folderIds }])
		})

		o.test("when called with empty fileIds and filled folderIds and both fit into one call it produces a single chunk", async function () {
			const fileIds = generateIdTuples(0)
			const folderIds = generateIdTuples(5)

			const chonked = [...splitListElementsIntoChunksByList(10, listIdPart, fileIds, folderIds)]
			o.check(chonked).deepEquals([{ left: fileIds, right: folderIds }])
		})

		o.test("when called with filled fileIds and empty folderIds and both fit into one call it produces a single chunk", async function () {
			const fileIds = generateIdTuples(5)
			const folderIds = generateIdTuples(0)

			const chonked = [...splitListElementsIntoChunksByList(10, listIdPart, fileIds, folderIds)]
			o.check(chonked).deepEquals([{ left: fileIds, right: folderIds }])
		})

		o.test("when called with both empty it produces no chunk at all", async function () {
			const fileIds = generateIdTuples(0)
			const folderIds = generateIdTuples(0)

			const chonked = [...splitListElementsIntoChunksByList(10, listIdPart, fileIds, folderIds)]
			o.check(chonked).deepEquals([])
		})

		o.test("when called with same amount of each and they don't fit into a single chunk size it produces two chunks", async function () {
			const fileIds = generateIdTuples(5)
			const [fileId1, fileId2, fileId3, fileId4, fileId5] = fileIds
			const folderIds = generateIdTuples(5)
			const [folderId1, folderId2, folderId3, folderId4, folderId5] = folderIds

			const chonked = [...splitListElementsIntoChunksByList(7, listIdPart, fileIds, folderIds)]
			o.check(chonked).deepEquals([
				{ left: [fileId1, fileId2, fileId3, fileId4, fileId5], right: [folderId1, folderId2] },
				{ left: [], right: [folderId3, folderId4, folderId5] },
			])
		})

		o.test("when called with different amounts and they don't fit into a single chunk size it produces multiple chunks", async function () {
			const fileIds = generateIdTuples(6)
			const [fileId1, fileId2, fileId3, fileId4, fileId5, fileId6] = fileIds
			const folderIds = generateIdTuples(5)
			const [folderId1, folderId2, folderId3, folderId4, folderId5] = folderIds

			const chonked = [...splitListElementsIntoChunksByList(5, listIdPart, fileIds, folderIds)]
			o.check(chonked).deepEquals([
				{ left: [fileId1, fileId2, fileId3, fileId4, fileId5], right: [] },
				{ left: [fileId6], right: [folderId1, folderId2, folderId3, folderId4] },
				{ left: [], right: [folderId5] },
			])
		})

		o.test("when called with two file lists produces multiple chunks filling in folder ids", async function () {
			const fileIds1 = generateIdTuples(6, "listId1")
			const fileIds2 = generateIdTuples(6, "listId2")
			const folderIds = generateIdTuples(5)
			const [folderId1, folderId2, folderId3, folderId4, folderId5] = folderIds

			const chonked = [...splitListElementsIntoChunksByList(10, listIdPart, [...fileIds1, ...fileIds2], folderIds)]
			o.check(chonked).deepEquals([
				{ left: [...fileIds1], right: [folderId1, folderId2, folderId3, folderId4] },
				{ left: [...fileIds2], right: [folderId5] },
			])
		})

		o.test("when called with two file lists and two folder lists produces multiple chunks", async function () {
			const fileIds1 = generateIdTuples(6, "listId1")
			const fileIds2 = generateIdTuples(6, "listId2")
			const folderIds1 = generateIdTuples(5, "fListId1")
			const folderIds2 = generateIdTuples(5, "fListId2")
			const [folderId1_1, folderId1_2, folderId1_3, folderId1_4, folderId1_5] = folderIds1

			const chonked = [...splitListElementsIntoChunksByList(10, listIdPart, [...fileIds1, ...fileIds2], [...folderIds1, ...folderIds2])]
			o.check(chonked).deepEquals([
				{ left: fileIds1, right: [folderId1_1, folderId1_2, folderId1_3, folderId1_4] },
				{ left: fileIds2, right: [folderId1_5] },
				{ left: [], right: folderIds2 },
			])
		})
	})
})
