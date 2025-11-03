import o from "@tutao/otest"
import { SpamClassificationDataDealer } from "../../../../../../src/mail-app/workerUtils/spamClassification/SpamClassificationDataDealer"
import { SpamMailProcessor } from "../../../../../../src/mail-app/workerUtils/spamClassification/SpamMailProcessor"
import { ClientSpamTrainingDatum, createClientSpamTrainingDatum } from "../../../../../../src/common/api/entities/tutanota/TypeRefs"
import { SpamDecision } from "../../../../../../src/common/api/common/TutanotaConstants"
import { object } from "testdouble"
import { EntityClient } from "../../../../../../src/common/api/common/EntityClient"
import { BulkMailLoader } from "../../../../../../src/mail-app/workerUtils/index/BulkMailLoader"

o.spec("SpamClassificationDataDealer", () => {
	const createSpamTrainingDatum = (spamDecision: SpamDecision): ClientSpamTrainingDatum =>
		createClientSpamTrainingDatum({
			_ownerGroup: "group",
			confidence: "1",
			spamDecision,
			vector: new Uint8Array(),
		})

	const entityClientMock = object<EntityClient>()

	const bulkMailLoaderMock = object<BulkMailLoader>()

	const dealer = new SpamClassificationDataDealer(entityClientMock, () => Promise.resolve(bulkMailLoaderMock), new SpamMailProcessor())

	o.spec("subsampleHamAndSpamMails", () => {
		o("does not subsample if ratio is balanced", () => {
			const data = [createSpamTrainingDatum(SpamDecision.WHITELIST), createSpamTrainingDatum(SpamDecision.BLACKLIST)]
			const { subsampledTrainingData, hamCount, spamCount } = dealer.subsampleHamAndSpamMails(data)
			o(subsampledTrainingData.length).equals(2)
			o(hamCount).equals(1)
			o(spamCount).equals(1)
		})

		o("limits ham when ratio > MAX_RATIO", () => {
			const hamData = Array.from({ length: 50 }, () => createSpamTrainingDatum(SpamDecision.WHITELIST))
			const spamData = Array.from({ length: 1 }, () => createSpamTrainingDatum(SpamDecision.BLACKLIST))
			const { subsampledTrainingData, hamCount, spamCount } = dealer.subsampleHamAndSpamMails([...hamData, ...spamData])
			o(hamCount).equals(10)
			o(spamCount).equals(1)
			o(subsampledTrainingData.length).equals(11)
		})

		o("limits spam when ratio < MIN_RATIO", () => {
			const hamData = Array.from({ length: 1 }, () => createSpamTrainingDatum(SpamDecision.WHITELIST))
			const spamData = Array.from({ length: 50 }, () => createSpamTrainingDatum(SpamDecision.BLACKLIST))

			const { subsampledTrainingData, hamCount, spamCount } = dealer.subsampleHamAndSpamMails([...hamData, ...spamData])
			o(hamCount).equals(1)
			o(spamCount).equals(10)
			o(subsampledTrainingData.length).equals(11)
		})
	})
})
