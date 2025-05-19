import { assertWorkerOrNode, isApp, isDesktop } from "../../common/Env.js"
import { defer, DeferredObject } from "@tutao/tutanota-utils/dist/Utils"
import { ApplicationTypesHash, HttpMethod, MediaType, ServerModelInfo } from "../../common/EntityFunctions"
import { FileFacade } from "../../../native/common/generatedipc/FileFacade"
import { stringToUtf8Uint8Array, uint8ArrayToBase64, uint8ArrayToString } from "@tutao/tutanota-utils"
import { RestClient } from "../rest/RestClient"
import { decompressString } from "../crypto/ModelMapper"
import { sha256Hash } from "@tutao/tutanota-crypto"
import { getServiceRestPath } from "../rest/ServiceExecutor"
import { ApplicationTypesService } from "../../entities/base/Services"
import { ServiceDefinition } from "../../common/ServiceRequest"
import { ServerModelsUnavailableError } from "../../common/error/ServerModelsUnavailableError"

assertWorkerOrNode()

/**
 * Do **NOT** change the names of these attributes, they need to match the record found on the
 * server at ApplicationTypesService#ApplicationTypesGetOut. This is to make sure we can update the
 * format of the service output in the future. With general schema definitions this would not be
 * possible as schemas returned by this service are required to read the schemas themselves.
 */
export type ApplicationTypesGetOut = {
	applicationTypesHash: ApplicationTypesHash
	applicationTypesJson: string
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
	// visibleForTesting
	public applicationTypesGetInTimeout = 1000

	private lastInvoked = 0
	private deferredRequests: Array<DeferredObject<ApplicationTypesGetOut>>

	private readonly persistenceFilePath: string = "server_type_models.json"

	constructor(private readonly restClient: RestClient, private readonly fileFacade: FileFacade, private readonly serverModelInfo: ServerModelInfo) {
		this.deferredRequests = []
	}

	private async requestApplicationTypes(): Promise<ApplicationTypesGetOut> {
		const applicationTypesGetOutCompressed = await this.restClient.request(
			getServiceRestPath(ApplicationTypesService as ServiceDefinition),
			HttpMethod.GET,
			{
				responseType: MediaType.Binary,
			},
		)
		return JSON.parse(decompressString(applicationTypesGetOutCompressed))
	}

	public async getServerApplicationTypesJson(): Promise<ApplicationTypesGetOut> {
		console.log(">>>>> deferring request")
		let deferredObject: DeferredObject<ApplicationTypesGetOut> = defer()
		this.deferredRequests.push(deferredObject)
		const models = await this.loadStoredTypeModels()
		if (models != null) {
			this.resolvePendingRequests(models)
		} else if (Date.now() - this.lastInvoked > this.applicationTypesGetInTimeout) {
			this.lastInvoked = Date.now()
			try {
				const applicationTypesGetOut = await this.requestApplicationTypes()

				console.log("re-initializing server model from new server response data")
				await this.storeNewApplicationTypes(applicationTypesGetOut.applicationTypesJson)
				this.resolvePendingRequests(applicationTypesGetOut)
				console.log(">>>>> resolved requests")
			} catch (e) {
				this.rejectPendingRequests(new ServerModelsUnavailableError("Could not get server models"))
			} finally {
				console.log(">>>>> resetting lastInvoked")
				// reset lastInvoked in any case (success or error) to ensure that the next request is sent again
				this.lastInvoked = 0
			}
		}

		return deferredObject.promise
	}

	private async storeNewApplicationTypes(newApplicationTypesJsonString: string) {
		if (isDesktop() || isApp()) {
			try {
				const fileContent = stringToUtf8Uint8Array(newApplicationTypesJsonString)
				await this.fileFacade.writeToAppDir(fileContent, this.persistenceFilePath)
			} catch (err_to_ignore) {
				console.error(`Failed to persist server model: ${err_to_ignore}`)
			}
		}
	}

	// In case we fail to read the application types from the stored json file,
	// we will request it from the server eagerly.
	private async loadStoredTypeModels(): Promise<ApplicationTypesGetOut | null> {
		// in the web app, we do not have a persistent server model,
		// therefore we will load it from the server
		// when the web app is started and store it in memory
		if (isDesktop() || isApp()) {
			try {
				const applicationTypesJsonData = await this.fileFacade.readFromAppDir(this.persistenceFilePath)
				const applicationTypesHash = this.computeApplicationTypesHash(applicationTypesJsonData)
				console.log(`initializing server model from local json data. Hash: ${applicationTypesHash}`)
				const applicationTypesJson = uint8ArrayToString("utf-8", applicationTypesJsonData)
				return { applicationTypesHash, applicationTypesJson }
			} catch (e) {
				console.log(`ignoring error to read typeModel from filesystem: ${e}`)
			}
		}

		return null
	}

	// visibleForTesting
	public computeApplicationTypesHash(applicationTypesJsonData: Uint8Array): string {
		const applicationTypesHash = sha256Hash(applicationTypesJsonData)
		return uint8ArrayToBase64(applicationTypesHash.slice(0, 5))
	}

	public getApplicationTypesHash(): ApplicationTypesHash | null {
		return this.serverModelInfo.getApplicationTypesHash()
	}

	private resolvePendingRequests(typesReturn: ApplicationTypesGetOut) {
		const deferredRequests = this.deferredRequests.slice(0, this.deferredRequests.length)
		this.deferredRequests = []

		for (let deferredRequest of deferredRequests) {
			deferredRequest.resolve(typesReturn)
		}
	}

	private rejectPendingRequests(e: Error) {
		const deferredRequests = this.deferredRequests.slice(0, this.deferredRequests.length)
		this.deferredRequests = []

		for (let deferredRequest of deferredRequests) {
			deferredRequest.reject(e)
		}
	}
}
