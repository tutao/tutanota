import o from "@tutao/otest"
import { IServiceExecutor } from "../../../../../src/common/api/common/ServiceRequest"
import { ApplicationTypesFacade } from "../../../../../src/common/api/worker/facades/ApplicationTypesFacade"
import { matchers, object, verify, when } from "testdouble"
import { ApplicationTypesService } from "../../../../../src/common/api/entities/base/Services"
import { AssociationType, Cardinality, Type } from "../../../../../src/common/api/common/EntityConstants"
import { createTestEntity } from "../../../TestUtils"
import { ClientModelInfo, ServerModelInfo, ServerModels } from "../../../../../src/common/api/common/EntityFunctions"
import { Mode } from "../../../../../src/common/api/common/Env"
import { AppName, AppNameEnum } from "@tutao/tutanota-utils/dist/TypeRef"
import { ModelAssociation, TypeModel } from "../../../../../src/common/api/common/EntityTypes"
import { assertNotNull, downcast, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { FileFacade } from "../../../../../src/common/native/common/generatedipc/FileFacade"

const { anything } = matchers

o.spec("ApplicationTypesFacadeTest", function () {
	const initialMode = env.mode
	let serviceExecutor: IServiceExecutor
	let fileFacade: FileFacade
	let applicationTypesFacade: ApplicationTypesFacade
	let serverModelInfo: ServerModelInfo
	let clientModelInfo: ClientModelInfo
	let mockResponse: any = {
		currentApplicationHash: "currentApplicationHash",
		modelTypesAsString: JSON.stringify({
			tutanota: {
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
						version: "0",
						versioned: false,
					} satisfies TypeModel,
				},
			},

			base: { version: 10, types: {} },
			sys: { version: 10, types: {} },
			usage: { version: 10, types: {} },
			monitor: { version: 10, types: {} },
			gossip: { version: 10, types: {} },
			storage: { version: 10, types: {} },
			accounting: { version: 10, types: {} },
		} satisfies ServerModels),
	}
	const jsonContentBuffer = stringToUtf8Uint8Array(mockResponse.modelTypesAsString)

	o.beforeEach(async function () {
		serviceExecutor = object()
		fileFacade = object()
		serverModelInfo = object()
		clientModelInfo = object()
		applicationTypesFacade = await ApplicationTypesFacade.getInitialized(object(), fileFacade, serverModelInfo)
	})

	o.afterEach(function () {
		env.mode = initialMode
	})

	o("getServerApplicationTypesJson does only one service request for requests made in quick succession", async function () {
		o.timeout(200)

		when(serviceExecutor.get(ApplicationTypesService, null)).thenResolve(mockResponse)

		const promise1 = applicationTypesFacade.getServerApplicationTypesJson()
		const promise2 = applicationTypesFacade.getServerApplicationTypesJson()
		const promise3 = applicationTypesFacade.getServerApplicationTypesJson()

		await promise1
		await promise2
		await promise3

		verify(serviceExecutor.get(ApplicationTypesService, null), { times: 1 })
	})

	o("getServerApplicationTypesJson makes multiple service requests when called with a timeout in between", async function () {
		o.timeout(150)
		applicationTypesFacade.applicationTypesGetInTimeout = 100

		when(serviceExecutor.get(ApplicationTypesService, null)).thenResolve(mockResponse)

		const promise1 = applicationTypesFacade.getServerApplicationTypesJson()
		await new Promise((resolve) => setTimeout(resolve, 101))
		const promise2 = applicationTypesFacade.getServerApplicationTypesJson()

		await promise1
		await promise2

		verify(serviceExecutor.get(ApplicationTypesService, null), { times: 2 })
	})

	o("server model should be assigned to memory first and write to file later", async () => {
		env.mode = "Desktop"

		when(serviceExecutor.get(ApplicationTypesService, null)).thenResolve(mockResponse)

		let callOrder = new Array<string>()
		when(fileFacade.writeToAppDir(anything(), anything())).thenDo(async () => callOrder.push("write"))
		when(serverModelInfo.init(mockResponse.applicationTypesHash, anything())).thenDo(() => callOrder.push("assign"))

		await applicationTypesFacade.getServerApplicationTypesJson()
		o(callOrder).deepEquals(["assign", "write"])
	})

	o("should attempt to write file but not propagate write error", async () => {
		env.mode = "Desktop"

		when(serviceExecutor.get(ApplicationTypesService, null)).thenResolve(mockResponse)
		when(serverModelInfo.init(mockResponse.applicationTypesHash, anything())).thenReturn()
		when(fileFacade.writeToAppDir(anything(), anything())).thenReject(Error("writing failed simulation failed"))

		await applicationTypesFacade.getServerApplicationTypesJson()
		// verify that server model is updated even if writing to disk fails
		verify(serverModelInfo.init(anything(), anything()))
	})

	o("should attempt to read but not fail on read error", async () => {
		env.mode = "Desktop"

		when(fileFacade.readDataFile(anything())).thenReject(Error("reading failed simulation failed"))
		await ApplicationTypesFacade.getInitialized(object(), fileFacade, serverModelInfo)

		// verify nothing changed in ServerModelInfo
		for (const app in AppNameEnum) {
			ensureSameTypeModel(serverModelInfo.typeModels[app].types, clientModelInfo.typeModels[app])
		}
	})

	for (const targetEnv of Object.values(Mode)) {
		const shouldPersist = ["Desktop", "App"].includes(targetEnv)

		o(`Server model for should persist for native platforms: ${targetEnv}`, async () => {
			env.mode = targetEnv

			when(serviceExecutor.get(ApplicationTypesService, null)).thenResolve(mockResponse)
			when(serverModelInfo.init(anything(), anything())).thenResolve()
			when(fileFacade.writeToAppDir(anything(), anything())).thenReturn(Promise.resolve(downcast({})))

			await applicationTypesFacade.getServerApplicationTypesJson()

			verify(fileFacade.writeToAppDir(anything(), anything()), { times: shouldPersist ? 1 : 0 })
		})

		o(`Server model should be initialised from file for native platforms: ${targetEnv}`, async () => {
			env.mode = targetEnv

			await ApplicationTypesFacade.getInitialized(object(), fileFacade, serverModelInfo)
			verify(fileFacade.readFromAppDir(anything()), { times: shouldPersist ? 1 : 0 })
		})
	}

	function ensureSameTypeModel(firstTypeModel: Record<string, TypeModel>, secondTypeModel: Record<string, TypeModel>) {
		// key by comparing. useful for debugging
		for (const [typeId, expectedTypeInfo] of Object.entries(secondTypeModel)) {
			const typeModel = assertNotNull(firstTypeModel[typeId], `typeId ${typeId} does not exists`)

			for (const metaKey of Object.keys(typeModel)) {
				if (metaKey === "associations" || metaKey === "values") {
					for (const [fieldId, fieldInfo] of Object.entries(typeModel[metaKey])) {
						const expectedFieldInfo = assertNotNull(expectedTypeInfo[metaKey][fieldId.toString()], `fieldId ${fieldId} does not exists`)
						o(fieldInfo).deepEquals(expectedFieldInfo)
					}
				} else {
					o(assertNotNull(typeModel[metaKey])).deepEquals(expectedTypeInfo[metaKey])(`key ${metaKey} does not match for type: ${typeModel.name}`)
				}
			}
		}

		// whole object compare
		o(firstTypeModel).deepEquals(assertNotNull(secondTypeModel))
	}
})
