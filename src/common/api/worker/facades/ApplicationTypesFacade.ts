import { assertWorkerOrNode } from "../../common/Env.js"
import { IServiceExecutor } from "../../common/ServiceRequest.js"
import { ApplicationTypesService } from "../../entities/base/Services"
import { debounceStart, debounceStartAndDiscard, defer, DeferredObject } from "@tutao/tutanota-utils/dist/Utils"

assertWorkerOrNode()

const TIMEOUT = 500

export class ApplicationTypesFacade {
	deferredRequests: Array<DeferredObject<any>>
	readonly debounceRequest = debounceStartAndDiscard(TIMEOUT, async () => {
		let applicationTypesGetOut = this.serviceExecutor.get(ApplicationTypesService, null)
		// save file as serverApplicationTypesJson.currentApplicationVersionSum.json and contents serverApplicationTypesJson.jsonAllApplicationTypesString
		// FIXME use function implemented by sug
		const deferredRequests = this.deferredRequests
		this.deferredRequests = []
		for (let deferredRequest of deferredRequests) {
			deferredRequest.resolve(null)
		}
	})

	constructor(private readonly serviceExecutor: IServiceExecutor) {
		this.deferredRequests = []
	}

	async getServerApplicationTypesJson(): Promise<void> {
		let deferredObject: DeferredObject<void> = defer()
		this.deferredRequests.push(deferredObject)

		this.debounceRequest()

		return deferredObject.promise
	}
}
