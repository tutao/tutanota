import { assertWorkerOrNode } from "@tutao/app-env"

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
