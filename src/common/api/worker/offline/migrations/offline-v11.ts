import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "@tutao/native-bridge"
import { ApplicationTypesFacade } from "../../facades/ApplicationTypesFacade"

export const offline11: OfflineMigration = {
	version: 11,
	async migrate(storage: OfflineStorage, sqlCipherFacade: SqlCipherFacade, applicationTypesFacade: ApplicationTypesFacade) {
		console.log("removing applicationTypes json files to re-initialize from server")
		await applicationTypesFacade.invalidateApplicationTypes()
	},
}
