import o from "@tutao/otest"
import { SqlCipherFacade } from "../../../../../src/common/native/common/generatedipc/SqlCipherFacade"
import { DesktopSqlCipher } from "../../../../../src/common/desktop/db/DesktopSqlCipher"
import {
	OfflineStorageSpamClassifierStorageFacade,
	SpamClassificationTableDefinitions,
} from "../../../../../src/common/api/worker/facades/lazy/OfflineStorageSpamClassifierStorageFacade"
import { CURRENT_SPACE_FOR_SERVER_RESULT, SpamClassificationModel } from "../../../../../src/mail-app/workerUtils/spamClassification/SpamClassifier"

const offlineDatabaseTestKey = new Uint8Array([3957386659, 354339016, 3786337319, 3366334248])

o.spec("OfflineStorageSpamClassifierStorageFacade", () => {
	let sql: SqlCipherFacade
	const userId = "my userId"
	const ownerGroupId1 = "my ownerGroupId1"
	const ownerGroupId2 = "my ownerGroupId2"

	let facade: OfflineStorageSpamClassifierStorageFacade

	const testSpamClassificationModel1: SpamClassificationModel = Object.freeze({
		ownerGroup: ownerGroupId1,
		modelTopology: "some model topology1",
		weightSpecs: "some weight specs1",
		weightData: new Uint8Array([23, 778, 234, 234, 233345, 87, 567, 87]),
		metaData: {
			hamCount: 10,
			spamCount: 2,
			lastTrainedFromScratchTime: 1764256391,
			lastTrainingDataIndexId: "some generated start index id1",
			spaceForServerResult: CURRENT_SPACE_FOR_SERVER_RESULT,
		},
	} satisfies SpamClassificationModel)

	const testSpamClassificationModel2: SpamClassificationModel = Object.freeze({
		ownerGroup: ownerGroupId2,
		modelTopology: "some model topology",
		weightSpecs: "some weight specs",
		weightData: new Uint8Array([23242, 234, 234, 234, 233345, 235, 567, 87]),
		metaData: {
			hamCount: 20,
			spamCount: 3,
			lastTrainedFromScratchTime: 1764242391,
			lastTrainingDataIndexId: "some generated start index id2",
			spaceForServerResult: CURRENT_SPACE_FOR_SERVER_RESULT,
		},
	} satisfies SpamClassificationModel)

	o.beforeEach(async () => {
		sql = new DesktopSqlCipher(":memory:", false)
		await sql.openDb(userId, offlineDatabaseTestKey)

		await sql.run(SpamClassificationTableDefinitions["spam_classification_model"].definition, [])

		facade = new OfflineStorageSpamClassifierStorageFacade(sql)
	})

	o.spec("get/set spam classification model", () => {
		o.test("when there is no spam classification model for ownerGroup it returns null", async () => {
			const spamClassificationModel1 = await facade.getSpamClassificationModel(ownerGroupId1)
			o.check(spamClassificationModel1).equals(null)
		})

		o.test("when there is no spam classification model for ownerGroup, but other ownerGroup exists, it still returns null", async () => {
			await facade.setSpamClassificationModel(structuredClone(testSpamClassificationModel2))
			const spamClassificationModel1 = await facade.getSpamClassificationModel(ownerGroupId1)
			o.check(spamClassificationModel1).equals(null)
		})

		o.test("when we set spam classification model for ownerGroup we get it back", async () => {
			await facade.setSpamClassificationModel(structuredClone(testSpamClassificationModel1))
			const spamClassificationModel1 = await facade.getSpamClassificationModel(ownerGroupId1)
			const spamClassificationModel2 = await facade.getSpamClassificationModel(ownerGroupId2)
			o.check(spamClassificationModel1).deepEquals(testSpamClassificationModel1)
			o.check(spamClassificationModel2).equals(null)
		})

		o.test("when we set spam classification model for ownerGroup we get it back, and do not override other", async () => {
			await facade.setSpamClassificationModel(structuredClone(testSpamClassificationModel1))
			await facade.setSpamClassificationModel(structuredClone(testSpamClassificationModel2))

			const spamClassificationModel1 = await facade.getSpamClassificationModel(ownerGroupId1)
			const spamClassificationModel2 = await facade.getSpamClassificationModel(ownerGroupId2)
			o.check(spamClassificationModel1).deepEquals(testSpamClassificationModel1)
			o.check(spamClassificationModel2).deepEquals(testSpamClassificationModel2)
		})
	})

	o.test("delete spam classification model", async () => {
		o.test("when there is no spam classification model for ownerGroup, delete does not change anything", async () => {
			await facade.deleteSpamClassificationModel(ownerGroupId1)
			const spamClassificationModel1 = await facade.getSpamClassificationModel(ownerGroupId1)
			o.check(spamClassificationModel1).equals(null)
		})

		o.test("when there is a spam classification model for ownerGroup, delete does delete it", async () => {
			await facade.setSpamClassificationModel(structuredClone(testSpamClassificationModel1))
			let spamClassificationModel1 = await facade.getSpamClassificationModel(ownerGroupId1)
			o.check(spamClassificationModel1).deepEquals(testSpamClassificationModel1)
			await facade.deleteSpamClassificationModel(ownerGroupId1)
			spamClassificationModel1 = await facade.getSpamClassificationModel(ownerGroupId1)
			o.check(spamClassificationModel1).equals(null)
		})

		o.test("when there is a spam classification model for other ownerGroup, delete does not delete other", async () => {
			await facade.setSpamClassificationModel(structuredClone(testSpamClassificationModel1))
			await facade.setSpamClassificationModel(structuredClone(testSpamClassificationModel2))

			let spamClassificationModel1 = await facade.getSpamClassificationModel(ownerGroupId1)
			let spamClassificationModel2 = await facade.getSpamClassificationModel(ownerGroupId2)
			o.check(spamClassificationModel1).deepEquals(testSpamClassificationModel1)
			o.check(spamClassificationModel2).deepEquals(testSpamClassificationModel2)

			await facade.deleteSpamClassificationModel(ownerGroupId1)

			spamClassificationModel1 = await facade.getSpamClassificationModel(ownerGroupId1)
			o.check(spamClassificationModel1).equals(null)
			spamClassificationModel2 = await facade.getSpamClassificationModel(ownerGroupId2)
			o.check(spamClassificationModel2).deepEquals(testSpamClassificationModel2)
		})
	})
})
