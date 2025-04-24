import o from "@tutao/otest"
import { ClientModelInfo, resolveTypeRefFromAppAndTypeNameLegacy, ServerModelInfo, ServerModels } from "../../../../src/common/api/common/EntityFunctions"
import fs from "node:fs"
import { AppName, AppNameEnum } from "@tutao/tutanota-utils/lib/TypeRef"
import { assertNotNull, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { Cardinality, Type, ValueType } from "../../../../src/common/api/common/EntityConstants"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { TypeModel } from "../../../../src/common/api/common/EntityTypes"
import { ProgrammingError } from "../../../../src/common/api/common/error/ProgrammingError"

o.spec("EntityFunctionsTest", function () {
	let serverModelInfo: ServerModelInfo
	let clientModelInfo: ClientModelInfo
	let emptyTypeModel: ServerModels

	o.beforeEach(() => {
		clientModelInfo = new ClientModelInfo()
		serverModelInfo = new ServerModelInfo(clientModelInfo)
		emptyTypeModel = {} as ServerModels
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
				version: "1",
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
			clientModelInfo = new ClientModelInfo()
			clientModelInfo.typeModels = Object.assign({}, clientModelInfo.typeModels, { base: clientModel })
			serverModelInfo = new ServerModelInfo(clientModelInfo)
			const applicationTypesHashTruncatedBase64 = serverModelInfo.computeApplicationTypesHash(stringToUtf8Uint8Array(serverModelString))
			const e = await assertThrows(ProgrammingError, () => Promise.resolve(serverModelInfo.init(applicationTypesHashTruncatedBase64, serverModel)))
			o(e.message).equals("Trying to parse encrypted value as unencrypted!")
		})
		o("ignore non-existent typeValue on client", async () => {
			const serverModel = Object.assign({}, serverModelInfo.typeModels, partialServerModel)
			const serverModelString = JSON.stringify({ base: serverModel })
			clientModelInfo = new ClientModelInfo()
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
			serverModelInfo = new ServerModelInfo(clientModelInfo)
			const applicationTypesHashTruncatedBase64 = serverModelInfo.computeApplicationTypesHash(stringToUtf8Uint8Array(serverModelString))
			serverModelInfo.init(applicationTypesHashTruncatedBase64, serverModel)
		})
	})

	o("can read from saved applicationTypesJson file", async () => {
		const combinedTypeModelsJsonString = JSON.stringify({
			accounting: {
				name: "accounting",
				version: 8,
				types: {},
			},
			base: {
				name: "base",
				version: 2,
				types: {},
			},
			gossip: {
				name: "gossip",
				version: 14,
				types: {},
			},
			monitor: {
				name: "monitor",
				version: 33,
				types: {},
			},
			storage: {
				name: "storage",
				version: 12,
				types: {},
			},
			sys: {
				name: "sys",
				version: 126,
				types: {},
			},
			tutanota: {
				name: "tutanota",
				version: 86,
				types: {},
			},
			usage: {
				name: "usage",
				version: 3,
				types: {},
			},
		})

		const applicationVersionSum = 284
		const applicationTypesHashTruncatedBase64 = serverModelInfo.computeApplicationTypesHash(stringToUtf8Uint8Array(combinedTypeModelsJsonString))
		const parsedApplicationTypesJson = JSON.parse(combinedTypeModelsJsonString)
		serverModelInfo.init(applicationTypesHashTruncatedBase64, parsedApplicationTypesJson)

		o(applicationTypesHashTruncatedBase64).equals(serverModelInfo.getApplicationTypesHash())
		o(applicationVersionSum).equals(serverModelInfo.getApplicationVersionSum())

		serverModelInfo.initFromJsonUint8Array(stringToUtf8Uint8Array(combinedTypeModelsJsonString))

		o(applicationTypesHashTruncatedBase64).equals(serverModelInfo.getApplicationTypesHash())
		o(applicationVersionSum).equals(serverModelInfo.getApplicationVersionSum())
	})

	o("will be ok if applicationTypesJson file read is successful", async () => {
		// start empty
		const serverModelInfo = new ServerModelInfo(clientModelInfo)
		serverModelInfo.typeModels = emptyTypeModel
		o(serverModelInfo.computeApplicationVersionSum(serverModelInfo.typeModels)).equals(0)

		const combinedTypeModelsJsonString = JSON.stringify({
			accounting: {
				name: "accounting",
				version: 8,
				types: {},
			},
			base: {
				name: "base",
				version: 2,
				types: {},
			},
			gossip: {
				name: "gossip",
				version: 14,
				types: {},
			},
			monitor: {
				name: "monitor",
				version: 33,
				types: {},
			},
			storage: {
				name: "storage",
				version: 12,
				types: {},
			},
			sys: {
				name: "sys",
				version: 126,
				types: {},
			},
			tutanota: {
				name: "tutanota",
				version: 86,
				types: {},
			},
			usage: {
				name: "usage",
				version: 3,
				types: {},
			},
		})
		serverModelInfo.initFromJsonUint8Array(stringToUtf8Uint8Array(combinedTypeModelsJsonString))

		// things should be ok
		o(serverModelInfo.computeApplicationVersionSum(serverModelInfo.typeModels)).equals(clientModelInfo.applicationVersionSum())
	})

	o("resolveTypeRefFromAppAndTypeNameLegacy resolves the TypeRef successfully", async () => {
		const app = "tutanota" as AppName
		const mailTypeId = 97
		const mailTypeName = clientModelInfo.typeModels.tutanota[mailTypeId].name
		const mailTypeRef = resolveTypeRefFromAppAndTypeNameLegacy(app, mailTypeName)
		o(mailTypeId).equals(mailTypeRef.typeId)
	})

	function ensureSameTypeModel(firstTypeModel: Record<any, any>, secondTypeModel: Record<any, any>) {
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

function filterTypeModelForPublicTypes(types: Record<any, any>): Record<any, any> {
	let obj = {}
	for (const [key, value] of Object.entries(types)) {
		if (value.isPublic == true) {
			Object.assign(obj, { [key]: value })
		}
	}
	return obj
}
