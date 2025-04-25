import { assertWorkerOrNode, isApp, isDesktop } from "../../common/Env.js"
import { defer, DeferredObject } from "@tutao/tutanota-utils/dist/Utils"
import { ApplicationTypesHash, HttpMethod, MediaType, ServerModelInfo } from "../../common/EntityFunctions"
import { FileFacade } from "../../../native/common/generatedipc/FileFacade"
import { stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { RestClient } from "../rest/RestClient"
import { decompressString } from "../crypto/ModelMapper"

assertWorkerOrNode()

type ApplicationTypesGetOut = {
	currentApplicationHash: string
	modelTypesAsString: string
}

/**
 * Facade to call the ApplicationTypesService, ensuring that multiple
 * request made in quick succession only lead to a single requests within
 * a time frame defined by the @applicationTypesGetInTimeout.
 *
 * A new request is made, once
 * * @applicationTypesGetInTimeout is reached
 * * OR timeout is cancelled (lastInvoked = 0), after a request is finished (success or error)
 */
export class ApplicationTypesFacade {
	public applicationTypesGetInTimeout = 1000
	private lastInvoked = 0
	private deferredRequests: Array<DeferredObject<void>>

	private readonly persistenceFilePath: string = "server_type_models.json"

	private constructor(private readonly restClient: RestClient, private readonly fileFacade: FileFacade, private readonly serverModelInfo: ServerModelInfo) {
		this.deferredRequests = []
	}

	static async getInitialized(restClient: RestClient, fileFacade: FileFacade, serverModelInfo: ServerModelInfo): Promise<ApplicationTypesFacade> {
		return await new ApplicationTypesFacade(restClient, fileFacade, serverModelInfo).readStoredTypeModels()
	}

	async getServerApplicationTypesJson(): Promise<void> {
		let deferredObject: DeferredObject<void> = defer()
		this.deferredRequests.push(deferredObject)

		if (Date.now() - this.lastInvoked > this.applicationTypesGetInTimeout) {
			this.lastInvoked = Date.now()
			try {
				const applicationTypesGetOutCompressed = await this.restClient.request("rest/base/applicationtypesservice", HttpMethod.GET, {
					responseType: MediaType.Binary,
				})
				const applicationTypesGetOut = JSON.parse(decompressString(applicationTypesGetOutCompressed)) as ApplicationTypesGetOut
				await this.overrideAndSaveApplicationTypes(applicationTypesGetOut)
				this.resolvePendingRequests()
			} finally {
				// reset lastInvoked in any case (success or error) to ensure that the next request is send again
				this.lastInvoked = 0
			}
		}

		return deferredObject.promise
	}

	private async overrideAndSaveApplicationTypes(applicationTypesGetOut: ApplicationTypesGetOut) {
		const newApplicationTypesHash = applicationTypesGetOut.currentApplicationHash
		const applicationTypesJsonString = applicationTypesGetOut.modelTypesAsString
		const newApplicationTypesJsonData = JSON.parse(applicationTypesJsonString)

		this.serverModelInfo.init(newApplicationTypesHash, newApplicationTypesJsonData)

		if (isDesktop() || isApp()) {
			try {
				const fileContent = stringToUtf8Uint8Array(applicationTypesJsonString)
				await this.fileFacade.writeToAppDir(fileContent, this.persistenceFilePath)
			} catch (err_to_ignore) {
				console.error(`Failed to persist server model: ${err_to_ignore}`)
			}
		}
	}

	private resolvePendingRequests() {
		const deferredRequests = this.deferredRequests.slice(0, this.deferredRequests.length)
		this.deferredRequests = []

		for (let deferredRequest of deferredRequests) {
			deferredRequest.resolve()
		}
	}

	// this function can be no-fail
	// if we fail to read from file, we will anyway read from server later on.
	private async readStoredTypeModels(): Promise<ApplicationTypesFacade> {
		// in the web app, we don't have a persistent server model. we'll update it if it's needed.
		try {
			if (isDesktop() || isApp()) {
				const fileContent = await this.fileFacade.readFromAppDir(this.persistenceFilePath)
				this.serverModelInfo.initFromJsonUint8Array(fileContent)
			}
		} catch (e) {
			console.log(`Ignoring error to read typeModel from filesystem: ${e}`)
		}
		return this
	}

	public getApplicationTypesHash(): ApplicationTypesHash | null {
		return this.serverModelInfo.getApplicationTypesHash()
	}
}
