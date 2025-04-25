import { assertWorkerOrNode, isApp, isDesktop } from "../../common/Env.js"
import { assertNotNull, defer, DeferredObject } from "@tutao/tutanota-utils/dist/Utils"
import { ApplicationTypesHash, HttpMethod, MediaType, ServerModelInfo } from "../../common/EntityFunctions"
import { FileFacade } from "../../../native/common/generatedipc/FileFacade"
import { stringToUtf8Uint8Array, uint8ArrayToBase64, uint8ArrayToString } from "@tutao/tutanota-utils"
import { RestClient } from "../rest/RestClient"
import { decompressString } from "../crypto/ModelMapper"
import { sha256Hash } from "@tutao/tutanota-crypto"
import { getServiceRestPath } from "../rest/ServiceExecutor"
import { ApplicationTypesService } from "../../entities/base/Services"
import { ServiceDefinition } from "../../common/ServiceRequest"

assertWorkerOrNode()

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
	private deferredRequests: Array<DeferredObject<void>>

	private readonly persistenceFilePath: string = "server_type_models.json"

	private constructor(private readonly restClient: RestClient, private readonly fileFacade: FileFacade, private readonly serverModelInfo: ServerModelInfo) {
		this.deferredRequests = []
	}

	static async getInitialized(restClient: RestClient, fileFacade: FileFacade, serverModelInfo: ServerModelInfo): Promise<ApplicationTypesFacade> {
		return await new ApplicationTypesFacade(restClient, fileFacade, serverModelInfo).initFromStoredTypeModels()
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

	public async getServerApplicationTypesJson(): Promise<void> {
		let deferredObject: DeferredObject<void> = defer()
		this.deferredRequests.push(deferredObject)

		if (Date.now() - this.lastInvoked > this.applicationTypesGetInTimeout) {
			this.lastInvoked = Date.now()
			try {
				const applicationTypesGetOut = await this.requestApplicationTypes()
				console.log(JSON.stringify(applicationTypesGetOut, null, 2))
				await this.overrideAndStoreNewApplicationTypes(applicationTypesGetOut)

				this.resolvePendingRequests()
			} finally {
				// reset lastInvoked in any case (success or error) to ensure that the next request is send again
				this.lastInvoked = 0
			}
		}

		return deferredObject.promise
	}

	private async overrideAndStoreNewApplicationTypes(applicationTypesGetOut: ApplicationTypesGetOut) {
		console.log("re-initializing server model from new server response data")

		const newApplicationTypesHash = applicationTypesGetOut.applicationTypesHash
		const newApplicationTypesJsonString = applicationTypesGetOut.applicationTypesJson
		const newApplicationTypesJsonData = JSON.parse(newApplicationTypesJsonString)

		this.serverModelInfo.init(newApplicationTypesHash, newApplicationTypesJsonData)

		if (isDesktop() || isApp()) {
			try {
				const fileContent = stringToUtf8Uint8Array(newApplicationTypesJsonString)
				await this.fileFacade.writeToAppDir(fileContent, this.persistenceFilePath)
			} catch (err_to_ignore) {
				console.error(`Failed to persist server model: ${err_to_ignore}`)
			}
		}
	}

	// This function is OK to fail.
	// In case we fail to read the application types from the stored json file,
	// we will anyway request it from the server later again, as the in memory applicationTypesHash in the
	// @ServerModelInfo does not match with the hash announced on any response header.
	private async initFromStoredTypeModels(): Promise<ApplicationTypesFacade> {
		// in the web app, we do not have a persistent server model,
		// therefore we will load it from the server
		// when the web app is started and store it in memory
		if (isDesktop() || isApp()) {
			try {
				const applicationTypesJsonData = await this.fileFacade.readFromAppDir(this.persistenceFilePath)
				await this.overrideWithLocalApplicationTypes(applicationTypesJsonData)
			} catch (e) {
				console.log(`ignoring error to read typeModel from filesystem: ${e}`)
			}
		}
		return this
	}

	private async overrideWithLocalApplicationTypes(applicationTypesJsonData: Uint8Array) {
		console.log("initializing server model from local json data")

		const applicationTypesHashTruncatedBase64 = await this.computeApplicationTypesHash(applicationTypesJsonData)
		console.log(applicationTypesHashTruncatedBase64)

		const applicationTypesJsonString = uint8ArrayToString("utf-8", applicationTypesJsonData)
		const parsedJsonData = assertNotNull(JSON.parse(applicationTypesJsonString))

		this.serverModelInfo.init(applicationTypesHashTruncatedBase64, parsedJsonData)
	}

	// visibleForTesting
	public async computeApplicationTypesHash(applicationTypesJsonData: Uint8Array): Promise<string> {
		const applicationTypesHash = sha256Hash(applicationTypesJsonData)
		return uint8ArrayToBase64(applicationTypesHash.slice(0, 5))
	}

	public getApplicationTypesHash(): ApplicationTypesHash | null {
		return this.serverModelInfo.getApplicationTypesHash()
	}

	private resolvePendingRequests() {
		const deferredRequests = this.deferredRequests.slice(0, this.deferredRequests.length)
		this.deferredRequests = []

		for (let deferredRequest of deferredRequests) {
			deferredRequest.resolve()
		}
	}
}
