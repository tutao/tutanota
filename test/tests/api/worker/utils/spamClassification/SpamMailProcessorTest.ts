import o from "@tutao/otest"
import {
	BYTES_COMPRESSED_MAIL_VECTOR_LENGTH,
	BYTES_FOR_SERVER_CLASSIFICATION_DATA,
	SpamMailDatum,
	SpamMailProcessor,
} from "../../../../../../src/applications/common/api/common/utils/spamClassificationUtils/SpamMailProcessor"

import { createTestEntity } from "../../../../TestUtils"
import { SparseVectorCompressor } from "../../../../../../src/applications/common/api/common/utils/spamClassificationUtils/SparseVectorCompressor"
import { splitArrayAt, splitUint8Array } from "../../../../../../src/platform-kit/utils"
import { createRandomString } from "./SparseVectorCompressorTest"
import { DEFAULT_VECTOR_MAX_LENGTH } from "../../../../../../src/platform-kit/app-env"
import { ClientSpamTrainingDatum, ClientSpamTrainingDatumTypeRef } from "@tutao/entities/tutanota"

o.spec("SpamMailProcessor Tests", () => {
	let spamMailProcessor: SpamMailProcessor
	let datum: SpamMailDatum
	let sparseVectorCompressor: SparseVectorCompressor

	o.beforeEach(async () => {
		spamMailProcessor = new SpamMailProcessor()
		sparseVectorCompressor = new SparseVectorCompressor()

		datum = {
			subject: "subject",
			serverClassificationData: "1,8",
			sender: "sender@email.com",
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

	o("model input - still works with old ClientSpamTrainingDatum", async () => {
		datum.serverClassificationData = null
		const { uploadableVectorLegacy } = await createModelInputAndUploadableVectors(datum)
		// clientSpamTrainingDatum uploaded by old clients has vectorNewFormat set to null
		const clientSpamTrainingDatum: ClientSpamTrainingDatum = createTestEntity(ClientSpamTrainingDatumTypeRef, {
			vectorLegacy: uploadableVectorLegacy,
			vectorWithServerClassifiers: null,
		})

		const modelInputFromUploadedLegacyVector = await spamMailProcessor.processClientSpamTrainingDatum(clientSpamTrainingDatum)
		const legacyVectorDecompressed = sparseVectorCompressor.decompress(uploadableVectorLegacy, DEFAULT_VECTOR_MAX_LENGTH)
		const modelInputFromLegacyVector = legacyVectorDecompressed.concat(new Array<number>(BYTES_FOR_SERVER_CLASSIFICATION_DATA).fill(0))

		o(modelInputFromUploadedLegacyVector).deepEquals(modelInputFromLegacyVector)
	})

	o("model input - sanitization checks", async () => {
		datum.serverClassificationData = "1,4:0,6" // 4th classifier: spam, 6th classifier: not spam
		// 00.00.00.11.00.01-0000000
		const { modelInput: expectedModelInput, uploadableVectorLegacy, uploadableVector } = await createModelInputAndUploadableVectors(datum)
		const clientSpamTrainingDatum: ClientSpamTrainingDatum = createTestEntity(ClientSpamTrainingDatumTypeRef, {
			vectorLegacy: uploadableVectorLegacy,
			vectorWithServerClassifiers: uploadableVector,
		})
		const modelInputFromDownloadedData = await spamMailProcessor.processClientSpamTrainingDatum(clientSpamTrainingDatum)

		const expectedOneHotEncodedServerClassificationData = spamMailProcessor.oneHotEncodeServerClassifiers(datum.serverClassificationData!)
		const [lengthBytes, rest] = splitUint8Array(clientSpamTrainingDatum.vectorWithServerClassifiers!, BYTES_COMPRESSED_MAIL_VECTOR_LENGTH)
		const length = sparseVectorCompressor.decodeCompressedVectorLength(lengthBytes)
		const [compressedVector, compressedServerClassificationData] = splitUint8Array(rest, length)
		const vectorizedMailFromDatum = sparseVectorCompressor.decompress(compressedVector, DEFAULT_VECTOR_MAX_LENGTH)
		const serverClassificationDataFromUploadedVector = sparseVectorCompressor.decompress(
			compressedServerClassificationData,
			BYTES_FOR_SERVER_CLASSIFICATION_DATA,
		)

		o.check(expectedModelInput).notEquals(null)
		const [vectorizedMailFromModelInput, serverClassificationDataFromModelInput] = splitArrayAt(expectedModelInput!, DEFAULT_VECTOR_MAX_LENGTH)

		const classifiers = serverClassificationDataFromModelInput.filter((_, index) => index % 2 === 1)
		const decisions = serverClassificationDataFromModelInput.filter((_, index) => index % 2 === 0)

		const classifiersUsed = findIndexes(classifiers, (v) => v === 1)
		const serverDecisions = classifiersUsed.map((classifierIndex) => decisions[classifierIndex])

		o(modelInputFromDownloadedData).deepEquals(expectedModelInput!)
		o(vectorizedMailFromDatum).deepEquals(vectorizedMailFromModelInput)
		o(serverClassificationDataFromUploadedVector).deepEquals(expectedOneHotEncodedServerClassificationData)
		o(serverClassificationDataFromModelInput).deepEquals(expectedOneHotEncodedServerClassificationData)
		o([4, 6]).deepEquals(classifiersUsed)
		o([1, 0]).deepEquals(serverDecisions)
	})

	o("preprocessMail - pathological body is processed quickly", async () => {
		datum.body = "a.".repeat(20_000) + "@" + " ".repeat(20_000) + "a@" + "a.".repeat(10_000) + "-"
		const start = Date.now()
		const result = spamMailProcessor.preprocessMail(datum)
		o(Date.now() - start < 1000).equals(true)
		o(result.includes("TEMAIL")).equals(true)
	})

	// o("preprocessMail - truncates very long bodies", async () => {
	// 	datum.subject = ""
	// 	datum.body = "x".repeat(MAX_PREPROCESS_BODY_LENGTH) + " TAILMARKER"
	// 	o(spamMailProcessor.preprocessMail(datum).includes("TAILMARKER")).equals(false)
	// })
	//
	// o("preprocessMail - truncates based on text, not html", async () => {
	// 	datum.subject = ""
	// 	datum.body = `<img src="data:image/png;base64,${"A".repeat(MAX_PREPROCESS_BODY_LENGTH * 2)}"> VISIBLETEXT`
	// 	o(spamMailProcessor.preprocessMail(datum).includes("VISIBLETEXT")).equals(true)
	// })
	//
	// o("preprocessMail - skips remaining steps when out of time budget", async () => {
	// 	datum.body = "mail me at test@example.com 12"
	// 	const realNow = Date.now
	// 	let calls = 0
	// 	Date.now = () => (calls++ === 0 ? 0 : MAX_PREPROCESS_TIME_MS + 1)
	// 	let result: string
	// 	try {
	// 		result = spamMailProcessor.preprocessMail(datum)
	// 	} finally {
	// 		Date.now = realNow
	// 	}
	// 	// html removal runs, following steps should not.
	// 	o(result.includes("TEMAIL")).equals(false)
	// 	o(result.includes("TNUMBER")).equals(false)
	// 	o(result.includes("test@example.com")).equals(true)
	// })

	async function createModelInputAndUploadableVectors(datum: SpamMailDatum) {
		const modelInput = await spamMailProcessor.processSpamMailDatum(datum)
		const maybeVectors = await spamMailProcessor.makeUploadableVectors(datum)
		o.check(maybeVectors).notEquals(null)
		const { uploadableVectorLegacy, uploadableVector } = maybeVectors!

		return { modelInput, uploadableVectorLegacy, uploadableVector }
	}
})

function findIndexes<T>(array: T[], checker: (_: T) => boolean): number[] {
	const indexes: number[] = []
	for (let i = 0; i < array.length; i++) {
		if (checker(array[i])) {
			indexes.push(i)
		}
	}
	return indexes
}
