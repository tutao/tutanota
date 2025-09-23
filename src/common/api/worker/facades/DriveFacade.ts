import { KeyLoaderFacade } from "./KeyLoaderFacade"
import { EntityClient } from "../../common/EntityClient"
import { IServiceExecutor } from "../../common/ServiceRequest"

export class DriveFacade {
	constructor(
		private readonly keyLoaderFacade: KeyLoaderFacade,
		private readonly entityClient: EntityClient,
		private readonly serviceExecutor: IServiceExecutor,
	) {}

	public async testDriveFacade(): Promise<number> {
		return 1337
	}
}
