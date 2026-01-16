import o from "@tutao/otest"
import {
	DEFAULT_VECTOR_MAX_LENGTH,
	SpamMailDatum,
	SpamMailProcessor,
} from "../../../../../../src/common/api/common/utils/spamClassificationUtils/SpamMailProcessor"
import { ClientSpamTrainingDatum, ClientSpamTrainingDatumTypeRef } from "../../../../../../src/common/api/entities/tutanota/TypeRefs"
import { createTestEntity } from "../../../../TestUtils"
import { SparseVectorCompressor } from "../../../../../../src/common/api/common/utils/spamClassificationUtils/SparseVectorCompressor"
import { splitArrayAt } from "@tutao/tutanota-utils"
import { createRandomString } from "./SparseVectorCompressorTest"

o.spec("SpamMailProcessor Tests", () => {
	let spamMailProcessor: SpamMailProcessor
	let datum: SpamMailDatum
	let sparseVectorCompressor: SparseVectorCompressor

	o.beforeEach(async () => {
		spamMailProcessor = new SpamMailProcessor()
		sparseVectorCompressor = new SparseVectorCompressor()

		datum = {
			subject: "subject",
			serverClassifier: 8,
			sender: "sender@email.com",
			serverIsSpam: true,
			authStatus: "0",
			ccRecipients: "cc-recipients",
			bccRecipients: "bcc-recipients",
			toRecipients: "to-recpipients",
			ownerGroup: "owner",
			body: Array(1024 * 6)
				.fill(0)
				.map(() => createRandomString(5))
				.join(" "),
		}
	})

	o("model input - sanitization checks", async () => {
		const spaceForServerResult = 20
		const { modelInput, vectorToUpload } = await createModelInputAndUploadVector(spaceForServerResult, datum)
		const clientSpamTrainingDatum: ClientSpamTrainingDatum = createTestEntity(ClientSpamTrainingDatumTypeRef, {
			vector: vectorToUpload,
		})
		const recoveredModelInput = await spamMailProcessor.getModelInputFromTrainingDatum(spaceForServerResult, clientSpamTrainingDatum)

		const uploadedVector = Array.from(clientSpamTrainingDatum.vector.values())
		const serverSideClassifierFromDatum = uploadedVector.pop()!
		const serverDecisionFromDatum = uploadedVector.pop()!
		const vectorizedMailFromDatum = sparseVectorCompressor.decompress(Uint8Array.from(uploadedVector))

		const [vectorizedMailFromModelInput, [serverDecisionFromModelInput, ...oneHotEncodedServerClassifier]] = splitArrayAt(
			modelInput,
			modelInput.length - spaceForServerResult,
		)
		const serverClassifierFromInput = oneHotEncodedServerClassifier.findIndex((v) => v === 1)

		o(serverSideClassifierFromDatum).equals(datum.serverClassifier + 1) // we shift all classifier by +1 to reserve `0` for UNKNOWN
		o(serverClassifierFromInput).equals(datum.serverClassifier + 1)
		o(serverDecisionFromDatum).equals(Number(datum.serverIsSpam))
		o(serverDecisionFromModelInput).equals(Number(datum.serverIsSpam))
		o(vectorizedMailFromDatum).deepEquals(vectorizedMailFromModelInput)
		o(modelInput).deepEquals(recoveredModelInput)
	})

	o("model input is recovered from clientSpamTrainingDatum - increased model dimension", async () => {
		const spaceForServerResultWhileUploading = 20
		const spaceForServerResultWhileUpdating = 30
		datum.serverClassifier = 22

		const { modelInput: initialModelInput, vectorToUpload } = await createModelInputAndUploadVector(spaceForServerResultWhileUploading, datum)
		const clientSpamTrainingDatum: ClientSpamTrainingDatum = createTestEntity(ClientSpamTrainingDatumTypeRef, {
			vector: vectorToUpload,
		})
		const recoveredModelInput = await spamMailProcessor.getModelInputFromTrainingDatum(spaceForServerResultWhileUpdating, clientSpamTrainingDatum)

		const [vectorizedMailInitial, [serverIsSpamInitial, ...oneHotServerClassifierInitial]] = splitArrayAt(initialModelInput, DEFAULT_VECTOR_MAX_LENGTH)
		const [vectorizedMailRecover, [serverIsSpamUpdate, ...oneHotServerClassifierUpdated]] = splitArrayAt(recoveredModelInput, DEFAULT_VECTOR_MAX_LENGTH)
		const serverClassifierInitial = oneHotServerClassifierInitial.findIndex((v) => v === 1)
		const serverClassifierUpdated = oneHotServerClassifierUpdated.findIndex((v) => v === 1)

		o(initialModelInput.length).equals(DEFAULT_VECTOR_MAX_LENGTH + spaceForServerResultWhileUploading)
		o(recoveredModelInput.length).equals(DEFAULT_VECTOR_MAX_LENGTH + spaceForServerResultWhileUpdating)
		o(vectorizedMailInitial).deepEquals(vectorizedMailRecover)
		o(serverIsSpamInitial).equals(serverIsSpamUpdate)
		o(serverIsSpamUpdate).equals(datum.serverIsSpam ? 1 : 0)
		o(oneHotServerClassifierInitial.length).equals(19)
		o(oneHotServerClassifierUpdated.length).equals(29)
		o(serverClassifierInitial).equals(0)
		o(serverClassifierUpdated).equals(23)
	})

	async function createModelInputAndUploadVector(spaceForServerResult: number, datum: SpamMailDatum) {
		const vectorizedMail = await spamMailProcessor.makeVectorizedMail(datum)
		const modelInput = await spamMailProcessor.makeModelInputFromMailDatum(spaceForServerResult, datum, vectorizedMail)
		const vectorToUpload = await spamMailProcessor.makeUploadVectorFromMailDatum(datum, vectorizedMail)

		return { modelInput, vectorToUpload }
	}
})
