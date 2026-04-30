import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "@tutao/native-bridge/common"
import { ApplicationTypesFacade } from "@tutao/instance-pipeline"

export const offline11: OfflineMigration = {
	version: 11,
	async migrate(storage: OfflineStorage, sqlCipherFacade: SqlCipherFacade, applicationTypesFacade: ApplicationTypesFacade) {
		console.log("removing applicationTypes json files to re-initialize from server")
		await applicationTypesFacade.invalidateApplicationTypes()
	},
}
