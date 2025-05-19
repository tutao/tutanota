import o from "@tutao/otest"
import { ApplicationTypesFacade, ApplicationTypesGetOut } from "../../../../../src/common/api/worker/facades/ApplicationTypesFacade"
import { matchers, object, verify, when } from "testdouble"
import { ApplicationTypesService } from "../../../../../src/common/api/entities/base/Services"
import { AssociationType, Cardinality, Type } from "../../../../../src/common/api/common/EntityConstants"
import { HttpMethod, MediaType, ServerModelInfo, ServerModels } from "../../../../../src/common/api/common/EntityFunctions"
import { Mode } from "../../../../../src/common/api/common/Env"
import { AppName, AppNameEnum } from "@tutao/tutanota-utils/dist/TypeRef"
import { ModelAssociation, ServerTypeModel } from "../../../../../src/common/api/common/EntityTypes"
import { downcast } from "@tutao/tutanota-utils"
import { FileFacade } from "../../../../../src/common/native/common/generatedipc/FileFacade"
import { RestClient } from "../../../../../src/common/api/worker/rest/RestClient"
import { getServiceRestPath } from "../../../../../src/common/api/worker/rest/ServiceExecutor"
import { ServiceDefinition } from "../../../../../src/common/api/common/ServiceRequest"
import { compressString, decompressString } from "../../../../../src/common/api/worker/crypto/ModelMapper"
import { withOverriddenEnv } from "../../../TestUtils"

const { anything } = matchers

o.spec("ApplicationTypesFacadeTest", function () {
	let restClient: RestClient
	let fileFacade: FileFacade
	let applicationTypesFacade: ApplicationTypesFacade
	let serverModelInfo: ServerModelInfo
	let mockResponse = compressString(
		JSON.stringify({
			applicationTypesHash: "currentApplicationHash",
			applicationTypesJson: JSON.stringify({
				tutanota: {
					name: AppNameEnum.Tutanota,
					version: 10,

					types: {
						"42": {
							app: "tutanota" satisfies AppName,
							encrypted: true,
							id: 42,
							name: "TestType",
							rootId: "SoMeId",
							since: 0,
							type: Type.ListElement,
							isPublic: true,
							values: {},
							associations: {
								"3": {
									id: 3,
									name: "testAssociation",
									type: AssociationType.Aggregation,
									cardinality: Cardinality.One,
									refTypeId: 43,
									final: false,
									dependency: "tutanota",
								} satisfies ModelAssociation,
							},
							version: 0,
							versioned: false,
						} as unknown as ServerTypeModel,
					},
				},

				base: { version: 10, types: {}, name: AppNameEnum.Base },
				sys: { version: 10, types: {}, name: AppNameEnum.Sys },
				usage: { version: 10, types: {}, name: AppNameEnum.Usage },
				monitor: { version: 10, types: {}, name: AppNameEnum.Monitor },
				gossip: { version: 10, types: {}, name: AppNameEnum.Gossip },
				storage: { version: 10, types: {}, name: AppNameEnum.Storage },
				accounting: { version: 10, types: {}, name: AppNameEnum.Accounting },
			} satisfies ServerModels),
		}),
	)

	o.beforeEach(async function () {
		restClient = object()
		fileFacade = object()
		serverModelInfo = object()
		applicationTypesFacade = new ApplicationTypesFacade(restClient, fileFacade, serverModelInfo)
	})

	o("getServerApplicationTypesJson does only one service request for requests made in quick succession", async function () {
		o.timeout(200)

		when(
			restClient.request(getServiceRestPath(ApplicationTypesService as ServiceDefinition), HttpMethod.GET, { responseType: MediaType.Binary }),
		).thenResolve(mockResponse)

		const promise1 = applicationTypesFacade.getServerApplicationTypesJson()
		const promise2 = applicationTypesFacade.getServerApplicationTypesJson()
		const promise3 = applicationTypesFacade.getServerApplicationTypesJson()

		await promise1
		await promise2
		await promise3

		verify(restClient.request(getServiceRestPath(ApplicationTypesService as ServiceDefinition), HttpMethod.GET, { responseType: MediaType.Binary }), {
			times: 1,
		})
	})

	o("getServerApplicationTypesJson makes multiple service requests when called with a timeout in between", async function () {
		o.timeout(150)
		applicationTypesFacade.applicationTypesGetInTimeout = 100

		when(
			restClient.request(getServiceRestPath(ApplicationTypesService as ServiceDefinition), HttpMethod.GET, { responseType: MediaType.Binary }),
		).thenResolve(mockResponse)

		const promise1 = applicationTypesFacade.getServerApplicationTypesJson()
		await new Promise((resolve) => setTimeout(resolve, 101))
		const promise2 = applicationTypesFacade.getServerApplicationTypesJson()

		await promise1
		await promise2

		verify(restClient.request(getServiceRestPath(ApplicationTypesService as ServiceDefinition), HttpMethod.GET, { responseType: MediaType.Binary }), {
			times: 2,
		})
	})

	function createApplicationTypesGetOutFromResponse(applicationTypesGetOut: Uint8Array) {
		return JSON.parse(decompressString(applicationTypesGetOut)) as ApplicationTypesGetOut
	}

	o("should attempt to write file but not propagate write error", async () => {
		when(
			restClient.request(getServiceRestPath(ApplicationTypesService as ServiceDefinition), HttpMethod.GET, { responseType: MediaType.Binary }),
		).thenResolve(mockResponse)

		let expectedReturn = createApplicationTypesGetOutFromResponse(mockResponse)
		when(fileFacade.writeToAppDir(anything(), anything())).thenReject(Error("writing failed simulation failed"))

		let actualReturn = await withOverriddenEnv({ mode: Mode.Desktop }, () => applicationTypesFacade.getServerApplicationTypesJson())
		o(actualReturn).equals(expectedReturn)
	})

	o("should attempt to read but not fail on read error", async () => {
		when(fileFacade.readDataFile(anything())).thenReject(Error("reading failed simulation failed"))
		await withOverriddenEnv({ mode: Mode.Desktop }, () => new ApplicationTypesFacade(object(), fileFacade, serverModelInfo))
		// did not throw
	})

	for (const targetEnv of Object.values(Mode)) {
		const shouldPersist = ["Desktop", "App"].includes(targetEnv)

		o(`Server model should persist for native platforms: ${targetEnv}`, async () => {
			when(
				restClient.request(getServiceRestPath(ApplicationTypesService as ServiceDefinition), HttpMethod.GET, { responseType: MediaType.Binary }),
			).thenResolve(mockResponse)
			when(fileFacade.writeToAppDir(anything(), anything())).thenReturn(Promise.resolve(downcast({})))
			let expectedResult = createApplicationTypesGetOutFromResponse(mockResponse)
			let actualResult = await withOverriddenEnv({ mode: targetEnv }, () => applicationTypesFacade.getServerApplicationTypesJson())
			o(actualResult).equals(expectedResult)
			verify(fileFacade.writeToAppDir(anything(), anything()), { times: shouldPersist ? 1 : 0 })
		})

		o(`Server model should be initialised from file for native platforms: ${targetEnv}`, async () => {
			await withOverriddenEnv({ mode: targetEnv }, () => new ApplicationTypesFacade(object(), fileFacade, serverModelInfo))
			verify(fileFacade.readFromAppDir(anything()), { times: shouldPersist ? 1 : 0 })
		})
	}
})
