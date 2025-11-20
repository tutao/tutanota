import * as cborg from "cborg"
import { customTypeDecoders, customTypeEncoders } from "../../offline/OfflineStorage"
import { SpamClassificationModel } from "../../../../../mail-app/workerUtils/spamClassification/SpamClassifier"
import { Nullable } from "@tutao/tutanota-utils"

/**
 * Version of the format
 */
const LOCAL_SPAM_CLASSIFICATION_STORAGE_VERSION: number = 1

/**
 * Facade interface that handles locally storing the SpamClassificationModel for the SpamClassifier
 */
export interface SpamClassifierStorageFacade {
	getSpamClassificationModel(ownerGroup: Id): Promise<Nullable<SpamClassificationModel>>

	setSpamClassificationModel(model: SpamClassificationModel): Promise<void>

	deleteSpamClassificationModel(ownerGroup: Id): Promise<void>
}

interface VersionedSpamClassificationModel extends SpamClassificationModel {
	version: number
}

/**
 * Encode the SpamClassificationModel
 * @param model to encode
 */
export function encodeSpamClassificationModel(model: SpamClassificationModel): Uint8Array {
	return cborg.encode(
		{
			version: LOCAL_SPAM_CLASSIFICATION_STORAGE_VERSION,
			...model,
		},
		{ typeEncoders: customTypeEncoders },
	)
}

/**
 * Decode the SpamClassificationModel into an object, handling any migrations
 * @param model to decode
 * @throws Error if {@link model} is not valid
 */
export function decodeSpamClassificationModel(model: Uint8Array): SpamClassificationModel {
	const decoded = cborg.decode(model, { tags: customTypeDecoders }) as Partial<VersionedSpamClassificationModel>

	if (decoded.version !== LOCAL_SPAM_CLASSIFICATION_STORAGE_VERSION) {
		throw new Error(`Expected version ${LOCAL_SPAM_CLASSIFICATION_STORAGE_VERSION} from decoded SpamClassification but got version ${decoded.version}`)
	}

	delete decoded.version

	return decoded as SpamClassificationModel
}
