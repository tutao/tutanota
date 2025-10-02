import o from "@tutao/otest"
import { SqlCipherFacade } from "../../../../../src/common/native/common/generatedipc/SqlCipherFacade"
import { DesktopSqlCipher } from "../../../../../src/common/desktop/db/DesktopSqlCipher"
import { AutosaveDraftsTableDefinitions, OfflineStorageAutosaveFacade } from "../../../../../src/common/api/worker/facades/lazy/OfflineStorageAutosaveFacade"
import { LocalAutosavedDraftData } from "../../../../../src/common/api/worker/facades/lazy/AutosaveFacade"

const offlineDatabaseTestKey = new Uint8Array([3957386659, 354339016, 3786337319, 3366334248])

o.spec("OfflineStorageAutosaveFacade", () => {
	let sql: SqlCipherFacade
	const userId = "my id"

	let facade: OfflineStorageAutosaveFacade

	const testAutosaveDraftData: LocalAutosavedDraftData = Object.freeze({
		body: "Here is a mail body! :)",
		subject: "Here is the subject. You will see it when you believe it.",
		to: [
			{
				address: "to@to.to",
				name: "bob",
			},
		],
		cc: [
			{
				address: "cc@cc.cc",
				name: "also bob",
			},
			{
				address: "cc2@cc2.cc2",
				name: "another person named bob",
			},
		],
		bcc: [
			{
				address: "bcc@bcc.bcc",
				name: "why are all of my friends named bob",
			},
		],
		confidential: true,
		editedTime: 12345,
		lastUpdatedTime: 6789,
		locallySavedTime: 101112,
		mailGroupId: "this is my mail group id",
		mailId: ["some", "mailid"],
		senderAddress: "sender@somewhere.com",
	} satisfies LocalAutosavedDraftData)

	o.beforeEach(async () => {
		sql = new DesktopSqlCipher(":memory:", false)
		await sql.openDb(userId, offlineDatabaseTestKey)

		await sql.run(AutosaveDraftsTableDefinitions["autosave_drafts"].definition, [])

		facade = new OfflineStorageAutosaveFacade(sql)
	})

	o.spec("get autosave draft data", () => {
		o.test("when there is no autosave data it returns null", async () => {
			const autosaveDraftData = await facade.getAutosavedDraftData()
			o.check(autosaveDraftData).equals(null)
		})
		o.test("when we set autosave data we get it back", async () => {
			await facade.setAutosavedDraftData(structuredClone(testAutosaveDraftData))
			const autosaveDraftData = await facade.getAutosavedDraftData()
			o.check(autosaveDraftData).deepEquals(testAutosaveDraftData)
		})
	})

	o.test("clears autosave draft data", async () => {
		await facade.setAutosavedDraftData(structuredClone(testAutosaveDraftData))
		await facade.clearAutosavedDraftData()
		const autosaveDraftDataCleared = await facade.getAutosavedDraftData()
		o.check(autosaveDraftDataCleared).equals(null)
	})
})
