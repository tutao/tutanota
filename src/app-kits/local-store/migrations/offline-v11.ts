import { OfflineStorage } from "../OfflineStorage.js"
import { ApplicationTypesFacade } from "../../../platform-kits/instance-pipeline"
import { OfflineMigration } from "../OfflineMigration"

const VERSION = 11
export class offline11 extends OfflineMigration {
	constructor(private readonly applicationTypesFacade: ApplicationTypesFacade) {
		super(VERSION)
	}

	async migrate(storage: OfflineStorage) {
		console.log("removing applicationTypes json files to re-initialize from server")
		await this.applicationTypesFacade.invalidateApplicationTypes()
	}
}
