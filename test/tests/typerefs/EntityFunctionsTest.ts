import o, { assertThrows } from "@tutao/otest"

import { stringToUtf8Uint8Array } from "@tutao/utils"
import { Cardinality, Type, ValueType } from "../../../src/meta"
import { ProgrammingError } from "@tutao/app-env"
import { ApplicationTypesFacade } from "../../../src/instance-pipeline/ApplicationTypesFacade"
import { object } from "testdouble"
import { TypeModel } from "../../../src/meta"

import { clientModelAsServerModel, makePopulatedClientModelInfo } from "../TestUtils"
import { MailTypeRef } from "@tutao/entities/tutanota"
import { ClientModelInfo, ServerModelInfo, ServerModels } from "@tutao/instance-pipeline"

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
			const applicationTypesJson = JSON.stringify(serverModel)

			const applicationTypesHash = applicationTypesFacade.computeApplicationTypesHash(stringToUtf8Uint8Array(applicationTypesJson))
			clientModelInfo = ClientModelInfo.getNewInstanceForTestsOnly()
			clientModelInfo.typeModels = Object.assign({}, clientModelInfo.typeModels, { base: clientModel })
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
			serverModelInfo = ServerModelInfo.getUninitializedInstanceForTestsOnly(clientModelInfo, async () => ({
				applicationTypesHash,
				applicationTypesJson,
			}))
			await serverModelInfo.resolveServerTypeReference(MailTypeRef)
		})
	})
})
