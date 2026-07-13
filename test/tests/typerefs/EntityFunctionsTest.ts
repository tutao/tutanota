import o, { assertThrows } from "@tutao/otest"
import { stringToUtf8Uint8Array } from "../../../src/platform-kit/utils"
import { Cardinality, Type, TypeModel, ValueType } from "../../../src/platform-kit/meta"
import { ProgrammingError } from "../../../src/platform-kit/app-env"
import { ApplicationTypesFacade } from "../../../src/platform-kit/instance-pipeline/ApplicationTypesFacade"
import { object } from "testdouble"
import { clientModelAsServerModel, makePopulatedClientModelInfo } from "../TestUtils"
import { MailTypeRef } from "@tutao/entities/tutanota"
import { ClientModelInfo, ServerModelInfo, ServerModels } from "../../../src/platform-kit/instance-pipeline"

o.spec("EntityFunctionsTest", function () {
	let serverModelInfo: ServerModelInfo
	let clientModelInfo: ClientModelInfo
	let applicationTypesFacade: ApplicationTypesFacade

	o.beforeEach(async () => {
		clientModelInfo = makePopulatedClientModelInfo()
		serverModelInfo = clientModelAsServerModel(clientModelInfo)
		applicationTypesFacade = new ApplicationTypesFacade(object(), object(), serverModelInfo)
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
						idForAssociatedData: null,
					},
				},
				associations: {},
				version: 1,
				versioned: false,
				idForSubKeyContext: null,
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
			const applicationTypesJson = JSON.stringify(serverModel)

			const applicationTypesHash = applicationTypesFacade.computeApplicationTypesHash(stringToUtf8Uint8Array(applicationTypesJson))
			clientModelInfo = ClientModelInfo.getNewInstanceForTestsOnly()
			Object.assign(clientModelInfo.typeModels, clientModelInfo.typeModels, { base: clientModel })
			serverModelInfo = ServerModelInfo.getUninitializedInstanceForTestsOnly(clientModelInfo, async () => ({
				applicationTypesHash,
				applicationTypesJson,
			}))

			const e = await assertThrows(ProgrammingError, async () => serverModelInfo.resolveServerTypeReference(MailTypeRef))
			o(e.message).equals("Trying to parse encrypted value as unencrypted for: base:0:1")
		})

		o("ignore non-existent typeValue on client", async () => {
			const serverModel = Object.assign({}, serverModelInfo.typeModels, partialServerModel)
			const applicationTypesJson = JSON.stringify(serverModel)
			const applicationTypesHash = applicationTypesFacade.computeApplicationTypesHash(stringToUtf8Uint8Array(applicationTypesJson))
			clientModelInfo = makePopulatedClientModelInfo()
			Object.assign(clientModelInfo.typeModels, clientModelInfo.typeModels, {
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
			serverModelInfo = ServerModelInfo.getUninitializedInstanceForTestsOnly(clientModelInfo, async () => ({
				applicationTypesHash,
				applicationTypesJson,
			}))
			await serverModelInfo.resolveServerTypeReference(MailTypeRef)
		})
	})
})
