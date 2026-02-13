import o from "@tutao/otest"
import {
	BYTES_COMPRESSED_MAIL_VECTOR_LENGTH,
	BYTES_FOR_SERVER_CLASSIFICATION_DATA,
	SpamMailDatum,
	SpamMailProcessor,
} from "../../../../../../src/common/api/common/utils/spamClassificationUtils/SpamMailProcessor"
import { ClientSpamTrainingDatum, ClientSpamTrainingDatumTypeRef } from "../../../../../../src/common/api/entities/tutanota/TypeRefs"
import { createTestEntity } from "../../../../TestUtils"
import { SparseVectorCompressor } from "../../../../../../src/common/api/common/utils/spamClassificationUtils/SparseVectorCompressor"
import { splitArrayAt, splitUint8Array } from "@tutao/tutanota-utils"
import { createRandomString } from "./SparseVectorCompressorTest"
import { DEFAULT_VECTOR_MAX_LENGTH } from "../../../../../../src/common/api/common/TutanotaConstants"

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

		const [vectorizedMailFromModelInput, serverClassificationDataFromModelInput] = splitArrayAt(expectedModelInput, DEFAULT_VECTOR_MAX_LENGTH)

		const classifiers = serverClassificationDataFromModelInput.filter((_, index) => index % 2 === 1)
		const decisions = serverClassificationDataFromModelInput.filter((_, index) => index % 2 === 0)

		const classifiersUsed = findIndexes(classifiers, (v) => v === 1)
		const serverDecisions = classifiersUsed.map((classifierIndex) => decisions[classifierIndex])

		o(modelInputFromDownloadedData).deepEquals(expectedModelInput)
		o(vectorizedMailFromDatum).deepEquals(vectorizedMailFromModelInput)
		o(serverClassificationDataFromUploadedVector).deepEquals(expectedOneHotEncodedServerClassificationData)
		o(serverClassificationDataFromModelInput).deepEquals(expectedOneHotEncodedServerClassificationData)
		o([4, 6]).deepEquals(classifiersUsed)
		o([1, 0]).deepEquals(serverDecisions)
	})

	async function createModelInputAndUploadableVectors(datum: SpamMailDatum) {
		const modelInput = await spamMailProcessor.processSpamMailDatum(datum)
		const { uploadableVectorLegacy, uploadableVector } = await spamMailProcessor.makeUploadableVectors(datum)

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
