import { assertWorkerOrNode } from "../../common/Env"

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
