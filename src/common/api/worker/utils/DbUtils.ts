import { assertWorkerOrNode } from "@tutao/app-env"
import { stringToUtf8Uint8Array, uint8ArrayToBase64 } from "@tutao/utils"
import { sha256Hash } from "@tutao/crypto"

assertWorkerOrNode()

export function deleteObjectStores(db: IDBDatabase, ...oss: string[]) {
	for (let os of oss) {
		try {
			db.deleteObjectStore(os)
		} catch (e) {
			console.warn("Error while deleting old os", os, "ignoring", e)
		}
	}
}
export function b64UserIdHash(userId: Id): string {
	return uint8ArrayToBase64(sha256Hash(stringToUtf8Uint8Array(userId)))
}
