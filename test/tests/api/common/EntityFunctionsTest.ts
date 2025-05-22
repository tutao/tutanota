import o from "@tutao/otest"
import { ClientModelInfo, ServerModelInfo, ServerModels } from "../../../../src/common/api/common/EntityFunctions"
import { AppName } from "@tutao/tutanota-utils/lib/TypeRef"
import { stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { Cardinality, Type, ValueType } from "../../../../src/common/api/common/EntityConstants"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { ProgrammingError } from "../../../../src/common/api/common/error/ProgrammingError"
import { ApplicationTypesFacade } from "../../../../src/common/api/worker/facades/ApplicationTypesFacade"
import { object } from "testdouble"
import { clientModelAsServerModel } from "../../TestUtils"
import { TypeModel } from "../../../../src/common/api/common/EntityTypes"

o.spec("EntityFunctionsTest", function () {
	let serverModelInfo: ServerModelInfo
	let clientModelInfo: ClientModelInfo
	let applicationTypesFacade: ApplicationTypesFacade

	o.beforeEach(async () => {
		clientModelInfo = ClientModelInfo.getNewInstanceForTestsOnly()
		serverModelInfo = ServerModelInfo.getUninitializedInstanceForTestsOnly(clientModelInfo)
		clientModelAsServerModel(serverModelInfo, clientModelInfo)
		applicationTypesFacade = await ApplicationTypesFacade.getInitialized(object(), object(), serverModelInfo)
	})

	o.spec("parseModelValues", () => {
		const clientModel: Record<string, TypeModel> = {
			"0": {
				app: "base",
				encrypted: true,
				id: 0,
				name: "TestType",
				rootId: "SoMeId",
				since: 0,
				type: Type.ListElement,
				isPublic: true,
				values: {
					"1": {
						id: 1,
						name: "testValue",
						type: ValueType.String,
						cardinality: Cardinality.One,
						final: true,
						encrypted: true,
					},
				},
				associations: {},
				version: 1,
				versioned: false,
			},
		}
		const partialServerModel: ServerModels = {
			base: {
				version: 2,
				name: "base",
				types: {
					"0": {
						app: "base",
						encrypted: true,
						id: 0,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						isPublic: true,
						values: {
							"1": {
								id: 1,
								name: "testValue",
								type: ValueType.String,
								cardinality: Cardinality.One,
								final: true,
								encrypted: false,
							},
						},
						associations: {},
						version: "2",
						versioned: false,
					},
				},
			},
		} as any

		o("fail to parse if encrypted value is changed to unencrypted", async () => {
			const serverModel = Object.assign({}, serverModelInfo.typeModels, partialServerModel)
			const serverModelString = JSON.stringify({ base: serverModel })
			clientModelInfo = ClientModelInfo.getNewInstanceForTestsOnly()
			clientModelInfo.typeModels = Object.assign({}, clientModelInfo.typeModels, { base: clientModel })
			serverModelInfo = ServerModelInfo.getUninitializedInstanceForTestsOnly(clientModelInfo)

			const applicationTypesHashTruncatedBase64 = applicationTypesFacade.computeApplicationTypesHash(stringToUtf8Uint8Array(serverModelString))
			const e = await assertThrows(ProgrammingError, async () => serverModelInfo.init(applicationTypesHashTruncatedBase64, serverModel))
			o(e.message).equals("Trying to parse encrypted value as unencrypted for: base:0:1")
		})

		o("ignore non-existent typeValue on client", async () => {
			const serverModel = Object.assign({}, serverModelInfo.typeModels, partialServerModel)
			const serverModelString = JSON.stringify({ base: serverModel })
			clientModelInfo = ClientModelInfo.getNewInstanceForTestsOnly()
			clientModelInfo.typeModels = Object.assign({}, clientModelInfo.typeModels, {
				base: {
					"0": {
						app: "base",
						encrypted: true,
						id: 0,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						values: {
							"3": {
								id: 3,
								name: "anotherTestValue",
								type: ValueType.String,
								cardinality: Cardinality.One,
								final: true,
								encrypted: true,
							},
						},
						associations: {},
						version: "1",
						versioned: false,
					},
				},
			})
			serverModelInfo = ServerModelInfo.getUninitializedInstanceForTestsOnly(clientModelInfo)
			const applicationTypesHashTruncatedBase64 = applicationTypesFacade.computeApplicationTypesHash(stringToUtf8Uint8Array(serverModelString))
			serverModelInfo.init(applicationTypesHashTruncatedBase64, serverModel)
		})
	})

	o("resolveTypeRefFromAppAndTypeNameLegacy resolves the TypeRef successfully", async () => {
		const app = "tutanota" as AppName
		const mailTypeId = 97
		const mailTypeName = clientModelInfo.typeModels.tutanota[mailTypeId].name
		const mailTypeRef = ClientModelInfo.getNewInstanceForTestsOnly().resolveTypeRefFromAppAndTypeNameLegacy(app, mailTypeName)
		o(mailTypeId).equals(mailTypeRef.typeId)
	})
})
