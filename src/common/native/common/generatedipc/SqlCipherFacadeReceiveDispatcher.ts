/* generated file, don't edit. */

import { TaggedSqlValue } from "./TaggedSqlValue.js"
import { SqlCipherFacade } from "./SqlCipherFacade.js"

export class SqlCipherFacadeReceiveDispatcher {
	constructor(private readonly facade: SqlCipherFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "openDb": {
				const userId: string = arg[0]
				const dbKey: Uint8Array = arg[1]
				return this.facade.openDb(userId, dbKey)
			}
			case "closeDb": {
				return this.facade.closeDb()
			}
			case "deleteDb": {
				const userId: string = arg[0]
				return this.facade.deleteDb(userId)
			}
			case "run": {
				const query: string = arg[0]
				const params: ReadonlyArray<TaggedSqlValue> = arg[1]
				return this.facade.run(query, params)
			}
			case "get": {
				const query: string = arg[0]
				const params: ReadonlyArray<TaggedSqlValue> = arg[1]
				return this.facade.get(query, params)
			}
			case "all": {
				const query: string = arg[0]
				const params: ReadonlyArray<TaggedSqlValue> = arg[1]
				return this.facade.all(query, params)
			}
			case "lockRangesDbAccess": {
				const listId: string = arg[0]
				return this.facade.lockRangesDbAccess(listId)
			}
			case "unlockRangesDbAccess": {
				const listId: string = arg[0]
				return this.facade.unlockRangesDbAccess(listId)
			}
		}
	}
}
