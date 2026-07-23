import o, { assertThrows } from "@tutao/otest"
import { DecryptedParsedInstance, ModelMapper } from "../../../src/platform-kit/instance-pipeline"
import { AssociationType, Cardinality, ClientTypeModel, ServerTypeModel, Type, TypeRef, ValueType } from "../../../src/platform-kit/meta"
import { changeInstanceDirection, DummyTypeModelResolver, TestAggregateRef, TestEntity, TestTypeRef } from "./InstancePipelineTestUtils"
import { removeOriginals } from "../TestUtils"
import { InstanceDirection, ParsedValue } from "../../../src/platform-kit/instance-pipeline/ParsedValue"
import { InvalidModelError, ProgrammingError } from "../../../src/platform-kit/app-env"

o.spec("ModelMapperTransformations", function () {
	o.spec("AddAssociation", function () {
		o("add One aggregation", async function () {
			const serverModel: Record<string, ServerTypeModel> = {
				"42": {
					app: "tutanota",
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
						},
					},
					version: 0,
					versioned: false,
				} as unknown as ServerTypeModel,
				"43": {
					app: "tutanota",
					encrypted: true,
					id: 43,
					name: "TestAggregate",
					rootId: "SoMeId",
					since: 0,
					type: Type.Aggregated,
					isPublic: true,
					values: {
						"2": {
							id: 2,
							name: "testNumber",
							type: ValueType.Number,
							cardinality: Cardinality.One,
							final: false,
							encrypted: false,
						},
					},
					associations: {},
					version: 0,
					versioned: false,
				} as unknown as ServerTypeModel,
			}
			const clientModel: Record<string, ClientTypeModel> = {
				"42": {
					app: "tutanota",
					encrypted: true,
					id: 42,
					name: "TestType",
					rootId: "SoMeId",
					since: 0,
					type: Type.ListElement,
					isPublic: true,
					values: {},
					associations: {},
					version: 0,
					versioned: false,
				} as unknown as ClientTypeModel,
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<ClientTypeModel> => {
				return clientModel[typeRef.typeId]
			}

			const modelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(serverModel["42"]).addAttributeById(
				3,
				ParsedValue.fromNestedItems([DecryptedParsedInstance.incomingFromServer(serverModel["43"]).addAttributeById(2, ParsedValue.fromString("123"))]),
			)

			const mappedInstance = await modelMapper.mapToInstance(parsedInstance)
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
			} as any)
			o(typeof mappedInstance["_errors"]).equals("undefined")
		})

		o("server adds ZeroOrOne aggregation", async function () {
			const clientModel: Record<string, ClientTypeModel> = {
				"42": {
					app: "tutanota",
					encrypted: true,
					id: 42,
					name: "TestType",
					rootId: "SoMeId",
					since: 0,
					type: Type.ListElement,
					isPublic: true,
					values: {},
					associations: {},
					version: 0,
					versioned: false,
				} as unknown as ClientTypeModel,
			}
			const serverModel: Record<string, ServerTypeModel> = {
				"42": {
					app: "tutanota",
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
							cardinality: Cardinality.ZeroOrOne,
							refTypeId: 43,
							final: false,
							dependency: "tutanota",
						},
					},
					version: 0,
					versioned: false,
				} as unknown as ServerTypeModel,
				"43": {
					app: "tutanota",
					encrypted: true,
					id: 43,
					name: "TestAggregate",
					rootId: "SoMeId",
					since: 0,
					type: Type.Aggregated,
					isPublic: true,
					values: {
						"2": {
							id: 2,
							name: "testNumber",
							type: ValueType.Number,
							cardinality: Cardinality.ZeroOrOne,
							final: false,
							encrypted: false,
						},
					},
					associations: {},
					version: 0,
					versioned: false,
				} as unknown as ServerTypeModel,
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<ClientTypeModel> => {
				return clientModel[typeRef.typeId]
			}
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<ServerTypeModel> => {
				return serverModel[typeRef.typeId]
			}

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, serverModelResolver))
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(serverModel["42"]).addAttributeById(
				3,
				ParsedValue.fromNestedItems([DecryptedParsedInstance.incomingFromServer(serverModel["43"]).addAttributeById(2, ParsedValue.fromString("123"))]),
			)

			const mappedInstance = await modelMapper.mapToInstance(parsedInstance)
			removeOriginals(mappedInstance)

			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
			} as any)

			o(typeof mappedInstance["_errors"]).equals("undefined")

			// request is prepared with the client model and does not add ZeroOrOne aggregation
			const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
			const expectedDecryptedInstance = DecryptedParsedInstance.outgoingToServer(clientModel["42"])
			o.check(newParsedInstance.deepEquals(expectedDecryptedInstance)).equals(true)
		})

		o("server adds Any aggregation", async function () {
			const serverModel: Record<string, ServerTypeModel> = {
				"42": {
					app: "tutanota",
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
							cardinality: Cardinality.Any,
							refTypeId: 43,
							final: false,
							dependency: "tutanota",
						},
					},
					version: 0,
					versioned: false,
				} as unknown as ServerTypeModel,
				"43": {
					app: "tutanota",
					encrypted: true,
					id: 43,
					name: "TestAggregate",
					rootId: "SoMeId",
					since: 0,
					type: Type.Aggregated,
					isPublic: true,
					values: {
						"2": {
							id: 2,
							name: "testNumber",
							type: ValueType.Number,
							cardinality: Cardinality.ZeroOrOne,
							final: false,
							encrypted: false,
						},
					},
					associations: {},
					version: 0,
					versioned: false,
				} as unknown as ServerTypeModel,
			}
			const clientModel: Record<string, ClientTypeModel> = {
				"42": {
					app: "tutanota",
					encrypted: true,
					id: 42,
					name: "TestType",
					rootId: "SoMeId",
					since: 0,
					type: Type.ListElement,
					isPublic: true,
					values: {},
					associations: {},
					version: 0,
					versioned: false,
				} as unknown as ClientTypeModel,
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<ClientTypeModel> => {
				return clientModel[typeRef.typeId]
			}
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<ServerTypeModel> => {
				return serverModel[typeRef.typeId]
			}
			const serverTypeModel = await serverModelResolver(TestTypeRef)
			const serverAggregateModel = await serverModelResolver(TestAggregateRef)

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, serverModelResolver))
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(serverTypeModel).addAttributeById(
				3,
				ParsedValue.fromNestedItems([
					DecryptedParsedInstance.incomingFromServer(serverAggregateModel).addAttributeById(2, ParsedValue.fromString("123")),
				]),
			)

			const mappedInstance = await modelMapper.mapToInstance(parsedInstance)
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
			} as any)
			o(typeof mappedInstance["_errors"]).equals("undefined")

			// request is prepared with the client model and does not add Any aggregation
			const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
			const expectedDecryptedInstance = DecryptedParsedInstance.outgoingToServer(clientModel["42"])
			o.check(newParsedInstance.deepEquals(expectedDecryptedInstance)).equals(true)
		})

		o("server adds One list element association", async function () {
			const serverModel: Record<string, ServerTypeModel> = {
				"42": {
					app: "tutanota",
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
							name: "testListElementAssociation",
							type: AssociationType.ListElementAssociationGenerated,
							cardinality: Cardinality.One,
							refTypeId: 43,
							final: false,
							dependency: "tutanota",
						},
					},
					version: 0,
					versioned: false,
				} as unknown as ServerTypeModel,
				"43": {
					app: "tutanota",
					encrypted: true,
					id: 43,
					name: "TestRef",
					rootId: "SoMeId",
					since: 0,
					type: Type.ListElement,
					isPublic: true,
					values: {},
					associations: {},
					version: 0,
					versioned: false,
				} as unknown as ServerTypeModel,
			}
			const clientModel: Record<string, ClientTypeModel> = {
				"42": {
					app: "tutanota",
					encrypted: true,
					id: 42,
					name: "TestType",
					rootId: "SoMeId",
					since: 0,
					type: Type.ListElement,
					isPublic: true,
					values: {},
					associations: {},
					version: 0,
					versioned: false,
				} as unknown as ClientTypeModel,
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<ClientTypeModel> => {
				return clientModel[typeRef.typeId]
			}

			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<ServerTypeModel> => {
				return serverModel[typeRef.typeId]
			}
			const typeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, serverModelResolver))
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(serverModel["42"]).addAttributeById(
				3,
				ParsedValue.fromIdTupleList([["listId", "listElementId"]]),
			)

			const mappedInstance = await modelMapper.mapToInstance(parsedInstance)
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: typeRef,
			} as any)
			o(typeof mappedInstance["_errors"]).equals("undefined")
		})

		o("server adds ZeroOrOne list element association", async function () {
			const serverModel: Record<string, ServerTypeModel> = {
				"42": {
					app: "tutanota",
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
							name: "testListElementAssociation",
							type: AssociationType.ListElementAssociationGenerated,
							cardinality: Cardinality.ZeroOrOne,
							refTypeId: 43,
							final: false,
							dependency: "tutanota",
						},
					},
					version: 0,
					versioned: false,
				} as unknown as ServerTypeModel,
				"43": {
					app: "tutanota",
					encrypted: true,
					id: 43,
					name: "TestRef",
					rootId: "SoMeId",
					since: 0,
					type: Type.ListElement,
					isPublic: true,
					values: {},
					associations: {},
					version: 0,
					versioned: false,
				} as unknown as ServerTypeModel,
			}
			const clientModel: Record<string, ClientTypeModel> = {
				"42": {
					app: "tutanota",
					encrypted: true,
					id: 42,
					name: "TestType",
					rootId: "SoMeId",
					since: 0,
					type: Type.ListElement,
					isPublic: true,
					values: {},
					associations: {},
					version: 0,
					versioned: false,
				} as unknown as ClientTypeModel,
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<ClientTypeModel> => {
				return clientModel[typeRef.typeId]
			}

			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<ServerTypeModel> => {
				return serverModel[typeRef.typeId]
			}

			const clientTypeModel = clientModel["42"]
			const serverTypeModel = serverModel["42"]

			const typeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, serverModelResolver))

			const parsedInstance = DecryptedParsedInstance.incomingFromServer(serverTypeModel).addAttributeById(
				3,
				ParsedValue.fromIdTupleList([["listId", "listElementId"]]),
			)

			const mappedInstance = await modelMapper.mapToInstance(parsedInstance)
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: typeRef,
			} as any)
			o(typeof mappedInstance["_errors"]).equals("undefined")

			// request is prepared with the client model and does not add ZeroOrOne association
			const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
			const expectedDecryptedInstance = DecryptedParsedInstance.outgoingToServer(clientTypeModel)
			o.check(newParsedInstance.deepEquals(expectedDecryptedInstance)).equals(true)
		})
		o("add Any list element association", async function () {
			const serverModel: Record<string, ServerTypeModel> = {
				"42": {
					app: "tutanota",
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
							name: "testListElementAssociation",
							type: AssociationType.ListElementAssociationGenerated,
							cardinality: Cardinality.Any,
							refTypeId: 43,
							final: false,
							dependency: "tutanota",
						},
					},
					version: 0,
					versioned: false,
				} as unknown as ServerTypeModel,
				"43": {
					app: "tutanota",
					encrypted: true,
					id: 43,
					name: "TestAggregate",
					rootId: "SoMeId",
					since: 0,
					type: Type.Aggregated,
					isPublic: true,
					values: {
						"2": {
							id: 2,
							name: "testNumber",
							type: ValueType.Number,
							cardinality: Cardinality.ZeroOrOne,
							final: false,
							encrypted: false,
						},
					},
					associations: {},
					version: 0,
					versioned: false,
				} as unknown as ServerTypeModel,
			}

			const clientModel: Record<string, ClientTypeModel> = {
				"42": {
					app: "tutanota",
					encrypted: true,
					id: 42,
					name: "TestType",
					rootId: "SoMeId",
					since: 0,
					type: Type.ListElement,
					isPublic: true,
					values: {},
					associations: {},
					version: 0,
					versioned: false,
				} as unknown as ClientTypeModel,
			}
			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<ClientTypeModel> => {
				return clientModel[typeRef.typeId]
			}

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))

			const parsedInstance = DecryptedParsedInstance.incomingFromServer(serverModel["42"]).addAttributeById(
				3,
				ParsedValue.fromIdTupleList([["listId", "listElementId"]]),
			)

			const mappedInstance = await modelMapper.mapToInstance(parsedInstance)
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
			} as any)
			o(typeof mappedInstance["_errors"]).equals("undefined")

			// request is prepared with the client model and does not add Any association
			const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
			o(newParsedInstance).deepEquals(DecryptedParsedInstance.outgoingToServer(await clientModelResolver(TestTypeRef)))
		})
	})

	o.spec("AddValue", function () {
		o("server adds One Value", async function () {
			const serverModel: Record<string, ServerTypeModel> = {
				"42": {
					app: "tutanota",
					encrypted: true,
					id: 42,
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
					version: 0,
					versioned: false,
				} as unknown as ServerTypeModel,
			}
			const clientModel: Record<string, ClientTypeModel> = {
				"42": {
					app: "tutanota",
					encrypted: true,
					id: 42,
					name: "TestType",
					rootId: "SoMeId",
					since: 0,
					type: Type.ListElement,
					isPublic: true,
					values: {},
					associations: {},
					version: 0,
					versioned: false,
				} as unknown as ClientTypeModel,
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<ClientTypeModel> => {
				return clientModel[typeRef.typeId]
			}

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))

			const parsedInstance = DecryptedParsedInstance.incomingFromServer(serverModel["42"]).addAttributeById(1, ParsedValue.fromString("example"))

			const mappedInstance = await modelMapper.mapToInstance(parsedInstance)
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
			} as any)
			o(typeof mappedInstance["_errors"]).equals("undefined")

			// request is prepared with the client model and does not add One value
			const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
			const expectedOutgoingInstance = DecryptedParsedInstance.outgoingToServer(clientModel["42"])
			o(newParsedInstance.deepEquals(expectedOutgoingInstance)).equals(true)
		})
		o("add One Value with default supplier on server should also supply default on client", async function () {
			const serverModel: Record<string, ServerTypeModel> = {
				"42": {
					app: "tutanota",
					encrypted: true,
					id: 42,
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
					version: 0,
					versioned: false,
				} as unknown as ServerTypeModel,
			}
			const clientModel: Record<string, ClientTypeModel> = {
				"42": {
					app: "tutanota",
					encrypted: true,
					id: 42,
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
					version: 0,
					versioned: false,
				} as unknown as ClientTypeModel,
			}
			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<ClientTypeModel> => {
				return clientModel[typeRef.typeId]
			}

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))

			// The instance in the local-store storage (written when the value was not there for the server & client models)
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(serverModel["42"])

			const mappedInstance = await modelMapper.mapToInstance(parsedInstance)
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testValue: "",
			} as any)
			o(typeof mappedInstance["_errors"]).equals("undefined")

			// request is prepared with the client model and does not add One value
			const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
			o(newParsedInstance.getAttributeById(1).asString()).equals("")
		})
		o("add ZeroOrOne Value", async function () {
			const clientModel: Record<string, ClientTypeModel> = {
				"42": {
					app: "tutanota",
					encrypted: true,
					id: 42,
					name: "TestType",
					rootId: "SoMeId",
					since: 0,
					type: Type.ListElement,
					isPublic: true,
					values: {},
					associations: {},
					version: 0,
					versioned: false,
				} as unknown as ClientTypeModel,
			}
			const serverModel: Record<string, ServerTypeModel> = {
				"42": {
					app: "tutanota",
					encrypted: true,
					id: 42,
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
							cardinality: Cardinality.ZeroOrOne,
							final: true,
							encrypted: true,
						},
					},
					associations: {},
					version: 0,
					versioned: false,
				} as unknown as ServerTypeModel,
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<ClientTypeModel> => {
				return clientModel[typeRef.typeId]
			}

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(serverModel["42"]).addAttributeById(1, ParsedValue.fromString("example"))

			const mappedInstance = await modelMapper.mapToInstance(parsedInstance)
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
			} as any)
			o(typeof mappedInstance["_errors"]).equals("undefined")

			// request is prepared with the client model and does not add ZeroOrOne value
			const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
			o(newParsedInstance).deepEquals(DecryptedParsedInstance.outgoingToServer(await clientModelResolver(TestTypeRef)))
		})
	})
	o.spec("BooleanToNumberValue", function () {
		o("convert boolean to number value", async function () {
			const serverModel: Record<string, ServerTypeModel> = {
				"42": {
					app: "tutanota",
					encrypted: true,
					id: 42,
					name: "TestType",
					rootId: "SoMeId",
					since: 0,
					type: Type.ListElement,
					isPublic: true,
					values: {
						"1": {
							id: 1,
							name: "testValue",
							type: ValueType.Number,
							cardinality: Cardinality.ZeroOrOne,
							final: true,
							encrypted: true,
						},
					},
					associations: {},
					version: 0,
					versioned: false,
				} as unknown as ServerTypeModel,
			}
			const clientModel: Record<string, ClientTypeModel> = {
				"42": {
					app: "tutanota",
					encrypted: true,
					id: 42,
					name: "TestType",
					rootId: "SoMeId",
					since: 0,
					type: Type.ListElement,
					isPublic: true,
					values: {
						"1": {
							id: 1,
							name: "testValue",
							type: ValueType.Boolean,
							cardinality: Cardinality.ZeroOrOne,
							final: true,
							encrypted: true,
						},
					},
					associations: {},
					version: 0,
					versioned: false,
				} as unknown as ClientTypeModel,
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<ClientTypeModel> => {
				return clientModel[typeRef.typeId]
			}

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))

			const falseParsedInstance = DecryptedParsedInstance.incomingFromServer(serverModel["42"]).addAttributeById(1, ParsedValue.fromBoolean(false))
			const trueParsedInstance = DecryptedParsedInstance.incomingFromServer(serverModel["42"]).addAttributeById(1, ParsedValue.fromString("anything"))
			const falseMappedInstance = (await modelMapper.mapToInstance(falseParsedInstance)) as any
			const trueMappedInstance = (await modelMapper.mapToInstance(trueParsedInstance)) as any

			removeOriginals(trueMappedInstance)
			removeOriginals(falseMappedInstance)
			o(trueMappedInstance).deepEquals({
				_type: TestTypeRef,
				testValue: true,
			} as any)
			o(falseMappedInstance).deepEquals({
				_type: TestTypeRef,
				testValue: false,
			} as any)
			o(typeof trueMappedInstance._errors).equals("undefined")
			o(typeof falseMappedInstance._errors).equals("undefined")

			// request is prepared with the client model and does not add handle the boolean to number transformation
			const newTrueParsedInstance = await modelMapper.mapToDecryptedInstance(trueMappedInstance)
			const newFalseParsedInstance = await modelMapper.mapToDecryptedInstance(falseMappedInstance)
			o(newTrueParsedInstance.getAttributeByName("testValue").asBoolean()).equals(true)
			o(newFalseParsedInstance.getAttributeByName("testValue").asBoolean()).equals(false)
		})
	})

	o.spec("ChangeAssociationCardinality", function () {
		o("change aggregation from Any to One", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<ServerTypeModel> => {
				const serverModel: Record<string, ServerTypeModel> = {
					"42": {
						app: "tutanota",
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
								name: "testAggregation",
								type: AssociationType.Aggregation,
								cardinality: Cardinality.One,
								refTypeId: 43,
								final: false,
								dependency: "tutanota",
							},
						},
						version: 0,
						versioned: false,
					} as unknown as ServerTypeModel,
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestAggregate",
						rootId: "SoMeId",
						since: 0,
						type: Type.Aggregated,
						isPublic: true,
						values: {},
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ServerTypeModel,
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<ClientTypeModel> => {
				const clientModel: Record<string, ClientTypeModel> = {
					"42": {
						app: "tutanota",
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
								name: "testAggregation",
								type: AssociationType.Aggregation,
								cardinality: Cardinality.Any,
								refTypeId: 43,
								final: false,
								dependency: "tutanota",
							},
						},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestAggregate",
						rootId: "SoMeId",
						since: 0,
						type: Type.Aggregated,
						isPublic: true,
						values: {},
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
				}
				return clientModel[typeRef.typeId]
			}

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))

			let serverTypeModel = await serverModelResolver(TestTypeRef)
			const aggregateTypeModel = await serverModelResolver(TestAggregateRef)
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(serverTypeModel).addAttributeById(
				3,
				ParsedValue.fromNestedItems([DecryptedParsedInstance.incomingFromServer(aggregateTypeModel)]),
			)

			const mappedInstance = await modelMapper.mapToInstance(parsedInstance)
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testAggregation: [
					{
						_type: TestAggregateRef,
					},
				],
			} as any)
			o(typeof mappedInstance["_errors"]).equals("undefined")

			const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
			changeInstanceDirection(parsedInstance, InstanceDirection.OutgoingToServer)
			o.check(newParsedInstance.deepEquals(parsedInstance)).equals(true)
		})
		o("change aggregation from One to Any null value", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<ServerTypeModel> => {
				const serverModel: Record<string, ServerTypeModel> = {
					"42": {
						app: "tutanota",
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
								name: "testAggregation",
								type: AssociationType.Aggregation,
								cardinality: Cardinality.Any,
								refTypeId: 43,
								final: false,
								dependency: "tutanota",
							},
						},
						version: 0,
						versioned: false,
					} as unknown as ServerTypeModel,
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestAggregate",
						rootId: "SoMeId",
						since: 0,
						type: Type.Aggregated,
						isPublic: true,
						values: {},
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ServerTypeModel,
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<ClientTypeModel> => {
				const clientModel: Record<string, ClientTypeModel> = {
					"42": {
						app: "tutanota",
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
								name: "testAggregation",
								type: AssociationType.Aggregation,
								cardinality: Cardinality.One,
								refTypeId: 43,
								final: false,
								dependency: "tutanota",
							},
						},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestAggregate",
						rootId: "SoMeId",
						since: 0,
						type: Type.Aggregated,
						isPublic: true,
						values: {},
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
				}
				return clientModel[typeRef.typeId]
			}

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))

			const typeModel = await serverModelResolver(TestTypeRef)

			const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel)
			parsedInstance.addAttributeById(3, ParsedValue.emptyAssociation())

			// can't convert an empty array to one
			const err = await assertThrows(InvalidModelError, async () => modelMapper.mapToInstance(parsedInstance))
			o(err.message).equals("Cardinality One should have exactly one item. Found: 0")
		})
		o("change aggregation from ZeroOrOne to Any null value", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<ServerTypeModel> => {
				const serverModel: Record<string, ServerTypeModel> = {
					"42": {
						app: "tutanota",
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
								name: "testAggregation",
								type: AssociationType.Aggregation,
								cardinality: Cardinality.Any,
								refTypeId: 43,
								final: false,
								dependency: "tutanota",
							},
						},
						version: 0,
						versioned: false,
					} as unknown as ServerTypeModel,
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestAggregate",
						rootId: "SoMeId",
						since: 0,
						type: Type.Aggregated,
						isPublic: true,
						values: {},
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ServerTypeModel,
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<ClientTypeModel> => {
				const clientModel: Record<string, ClientTypeModel> = {
					"42": {
						app: "tutanota",
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
								name: "testAggregation",
								type: AssociationType.Aggregation,
								cardinality: Cardinality.ZeroOrOne,
								refTypeId: 43,
								final: false,
								dependency: "tutanota",
							},
						},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestAggregate",
						rootId: "SoMeId",
						since: 0,
						type: Type.Aggregated,
						isPublic: true,
						values: {},
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
				}
				return clientModel[typeRef.typeId]
			}

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
			const typeModel = await serverModelResolver(TestTypeRef)
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel).addAttributeById(3, ParsedValue.fromNestedItems([]))

			// can't convert an empty array to one
			const mappedInstance = await modelMapper.mapToInstance(parsedInstance)
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testAggregation: null,
			} as any)
			const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
			changeInstanceDirection(parsedInstance, InstanceDirection.OutgoingToServer)
			o.check(newParsedInstance.deepEquals(parsedInstance)).equals(true)
		})
		o("change aggregation from ZeroOrOne to Any multiple values", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<ServerTypeModel> => {
				const serverModel: Record<string, ServerTypeModel> = {
					"42": {
						app: "tutanota",
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
								name: "testAggregation",
								type: AssociationType.Aggregation,
								cardinality: Cardinality.Any,
								refTypeId: 43,
								final: false,
								dependency: "tutanota",
							},
						},
						version: 0,
						versioned: false,
					} as unknown as ServerTypeModel,
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestAggregate",
						rootId: "SoMeId",
						since: 0,
						type: Type.Aggregated,
						isPublic: true,
						values: {},
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ServerTypeModel,
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<ClientTypeModel> => {
				const clientModel: Record<string, ClientTypeModel> = {
					"42": {
						app: "tutanota",
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
								name: "testAggregation",
								type: AssociationType.Aggregation,
								cardinality: Cardinality.ZeroOrOne,
								refTypeId: 43,
								final: false,
								dependency: "tutanota",
							},
						},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestAggregate",
						rootId: "SoMeId",
						since: 0,
						type: Type.Aggregated,
						isPublic: true,
						values: {},
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
				}
				return clientModel[typeRef.typeId]
			}

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
			const typeModel = await serverModelResolver(TestTypeRef)
			const aggregateTypeModel = await serverModelResolver(TestAggregateRef)
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel).addAttributeById(
				3,
				ParsedValue.fromNestedItems([
					DecryptedParsedInstance.incomingFromServer(aggregateTypeModel),
					DecryptedParsedInstance.incomingFromServer(aggregateTypeModel),
				]),
			)

			// can't convert an array with multiple elements to ZeroOrOne
			await assertThrows(InvalidModelError, () => modelMapper.mapToInstance(parsedInstance))
		})
		o("change aggregation from Any to ZeroOrOne null value", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<ServerTypeModel> => {
				const serverModel: Record<string, ServerTypeModel> = {
					"42": {
						app: "tutanota",
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
								name: "testAggregation",
								type: AssociationType.Aggregation,
								cardinality: Cardinality.ZeroOrOne,
								refTypeId: 43,
								final: false,
								dependency: "tutanota",
							},
						},
						version: 0,
						versioned: false,
					} as unknown as ServerTypeModel,
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestAggregate",
						rootId: "SoMeId",
						since: 0,
						type: Type.Aggregated,
						isPublic: true,
						values: {},
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ServerTypeModel,
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<ClientTypeModel> => {
				const clientModel: Record<string, ClientTypeModel> = {
					"42": {
						app: "tutanota",
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
								name: "testAggregation",
								type: AssociationType.Aggregation,
								cardinality: Cardinality.Any,
								refTypeId: 43,
								final: false,
								dependency: "tutanota",
							},
						},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestAggregate",
						rootId: "SoMeId",
						since: 0,
						type: Type.Aggregated,
						isPublic: true,
						values: {},
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
				}
				return clientModel[typeRef.typeId]
			}

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
			const typeModel = await serverModelResolver(TestTypeRef)
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel).addAttributeById(3, ParsedValue.fromNestedItems([]))

			// can convert an empty array to ZeroOrOne
			const mappedInstance = await modelMapper.mapToInstance(parsedInstance)
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testAggregation: [],
			} as any)
			const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
			changeInstanceDirection(parsedInstance, InstanceDirection.OutgoingToServer)
			o.check(newParsedInstance.deepEquals(parsedInstance)).equals(true)
		})
		o("change aggregation from Any to ZeroOrOne one value", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<ServerTypeModel> => {
				const serverModel: Record<string, ServerTypeModel> = {
					"42": {
						app: "tutanota",
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
								name: "testAggregation",
								type: AssociationType.Aggregation,
								cardinality: Cardinality.ZeroOrOne,
								refTypeId: 43,
								final: false,
								dependency: "tutanota",
							},
						},
						version: 0,
						versioned: false,
					} as unknown as ServerTypeModel,
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestAggregate",
						rootId: "SoMeId",
						since: 0,
						type: Type.Aggregated,
						isPublic: true,
						values: {},
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ServerTypeModel,
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<ClientTypeModel> => {
				const clientModel: Record<string, ClientTypeModel> = {
					"42": {
						app: "tutanota",
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
								name: "testAggregation",
								type: AssociationType.Aggregation,
								cardinality: Cardinality.Any,
								refTypeId: 43,
								final: false,
								dependency: "tutanota",
							},
						},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestAggregate",
						rootId: "SoMeId",
						since: 0,
						type: Type.Aggregated,
						isPublic: true,
						values: {},
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
				}
				return clientModel[typeRef.typeId]
			}

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
			const typeModel = await serverModelResolver(TestTypeRef)
			const aggregateTypeModel = await serverModelResolver(TestAggregateRef)
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel).addAttributeById(
				3,
				ParsedValue.fromNestedItems([DecryptedParsedInstance.incomingFromServer(aggregateTypeModel)]),
			)

			// can convert an array with one element to ZeroOrOne
			const mappedInstance = await modelMapper.mapToInstance(parsedInstance)
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testAggregation: [{ _type: TestAggregateRef } as any],
			} as any)
			const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
			changeInstanceDirection(parsedInstance, InstanceDirection.OutgoingToServer)
			o.check(newParsedInstance.deepEquals(parsedInstance)).equals(true)
		})

		o("change list element association from Any to One", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<ServerTypeModel> => {
				const serverModel: Record<string, ServerTypeModel> = {
					"42": {
						app: "tutanota",
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
								name: "testListElementAssociation",
								type: AssociationType.ListElementAssociationGenerated,
								cardinality: Cardinality.One,
								refTypeId: 43,
								final: false,
								dependency: "tutanota",
							},
						},
						version: 0,
						versioned: false,
					} as unknown as ServerTypeModel,
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestRef",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						isPublic: true,
						values: {},
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ServerTypeModel,
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<ClientTypeModel> => {
				const clientModel: Record<string, ClientTypeModel> = {
					"42": {
						app: "tutanota",
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
								name: "testListElementAssociation",
								type: AssociationType.ListElementAssociationGenerated,
								cardinality: Cardinality.Any,
								refTypeId: 43,
								final: false,
								dependency: "tutanota",
							},
						},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestRef",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						isPublic: true,
						values: {},
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
				}
				return clientModel[typeRef.typeId]
			}

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
			const typeModel = await serverModelResolver(TestTypeRef)
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel).addAttributeById(
				3,
				ParsedValue.fromIdTupleList([["listId", "listElementId"]]),
			)

			const mappedInstance = await modelMapper.mapToInstance(parsedInstance)
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testListElementAssociation: [["listId", "listElementId"]],
			} as any)
			o(typeof mappedInstance["_errors"]).equals("undefined")

			const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
			changeInstanceDirection(parsedInstance, InstanceDirection.OutgoingToServer)
			o.check(newParsedInstance.deepEquals(parsedInstance)).equals(true)
		})
		o("change list element association from One to Any null value", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<ServerTypeModel> => {
				const serverModel: Record<string, ServerTypeModel> = {
					"42": {
						app: "tutanota",
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
								name: "testListElementAssociation",
								type: AssociationType.ListElementAssociationGenerated,
								cardinality: Cardinality.Any,
								refTypeId: 43,
								final: false,
								dependency: "tutanota",
							},
						},
						version: 0,
						versioned: false,
					} as unknown as ServerTypeModel,
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestRef",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						isPublic: true,
						values: {},
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ServerTypeModel,
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<ClientTypeModel> => {
				const clientModel: Record<string, ClientTypeModel> = {
					"42": {
						app: "tutanota",
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
								name: "testListElementAssociation",
								type: AssociationType.ListElementAssociationGenerated,
								cardinality: Cardinality.One,
								refTypeId: 43,
								final: false,
								dependency: "tutanota",
							},
						},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestRef",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						isPublic: true,
						values: {},
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
				}
				return clientModel[typeRef.typeId]
			}

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
			const typeModel = await serverModelResolver(TestTypeRef)
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel).addAttributeById(3, ParsedValue.fromIdTupleList([]))

			// can't convert an empty array to one
			const err = await assertThrows(InvalidModelError, async () => modelMapper.mapToInstance(parsedInstance))
			o(err.message).equals("Cardinality One should have exactly one item. Found: 0")
		})
		o("change list element association from ZeroOrOne to Any null value", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<ServerTypeModel> => {
				const serverModel: Record<string, ServerTypeModel> = {
					"42": {
						app: "tutanota",
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
								name: "testListElementAssociation",
								type: AssociationType.ListElementAssociationGenerated,
								cardinality: Cardinality.Any,
								refTypeId: 43,
								final: false,
								dependency: "tutanota",
							},
						},
						version: 0,
						versioned: false,
					} as unknown as ServerTypeModel,
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestRef",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						isPublic: true,
						values: {},
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ServerTypeModel,
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<ClientTypeModel> => {
				const clientModel: Record<string, ClientTypeModel> = {
					"42": {
						app: "tutanota",
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
								name: "testListElementAssociation",
								type: AssociationType.ListElementAssociationGenerated,
								cardinality: Cardinality.ZeroOrOne,
								refTypeId: 43,
								final: false,
								dependency: "tutanota",
							},
						},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestRef",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						isPublic: true,
						values: {},
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
				}
				return clientModel[typeRef.typeId]
			}

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
			const typeModel = await serverModelResolver(TestTypeRef)
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel).addAttributeById(3, ParsedValue.fromIdTupleList([]))

			// can't convert an empty array to one
			const mappedInstance = await modelMapper.mapToInstance(parsedInstance)
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testListElementAssociation: null,
			} as any)

			// request is prepared with the client model and association is not changed
			const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
			changeInstanceDirection(parsedInstance, InstanceDirection.OutgoingToServer)
			o.check(newParsedInstance.deepEquals(parsedInstance)).equals(true)
		})
		o("change list element association from ZeroOrOne to Any multiple values", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<ServerTypeModel> => {
				const serverModel: Record<string, ServerTypeModel> = {
					"42": {
						app: "tutanota",
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
								name: "testListElementAssociation",
								type: AssociationType.ListElementAssociationGenerated,
								cardinality: Cardinality.Any,
								refTypeId: 43,
								final: false,
								dependency: "tutanota",
							},
						},
						version: 0,
						versioned: false,
					} as unknown as ServerTypeModel,
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestRef",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						isPublic: true,
						values: {},
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ServerTypeModel,
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<ClientTypeModel> => {
				const clientModel: Record<string, ClientTypeModel> = {
					"42": {
						app: "tutanota",
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
								name: "testListElementAssociation",
								type: AssociationType.ListElementAssociationGenerated,
								cardinality: Cardinality.ZeroOrOne,
								refTypeId: 43,
								final: false,
								dependency: "tutanota",
							},
						},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestRef",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						isPublic: true,
						values: {},
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
				}
				return clientModel[typeRef.typeId]
			}

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
			const typeModel = await serverModelResolver(TestTypeRef)
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel).addAttributeById(
				3,
				ParsedValue.fromIdTupleList([
					["listId", "listElementId1"],
					["listId", "listElementId2"],
				]),
			)

			// can't convert an array with multiple elements to ZeroOrOne
			await assertThrows(InvalidModelError, () => modelMapper.mapToInstance(parsedInstance))
		})
		o("change list element association from Any to ZeroOrOne null value", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<ServerTypeModel> => {
				const serverModel: Record<string, ServerTypeModel> = {
					"42": {
						app: "tutanota",
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
								name: "testListElementAssociation",
								type: AssociationType.ListElementAssociationGenerated,
								cardinality: Cardinality.ZeroOrOne,
								refTypeId: 43,
								final: false,
								dependency: "tutanota",
							},
						},
						version: 0,
						versioned: false,
					} as unknown as ServerTypeModel,
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestRef",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						isPublic: true,
						values: {},
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ServerTypeModel,
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<ClientTypeModel> => {
				const clientModel: Record<string, ClientTypeModel> = {
					"42": {
						app: "tutanota",
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
								name: "testListElementAssociation",
								type: AssociationType.ListElementAssociationGenerated,
								cardinality: Cardinality.Any,
								refTypeId: 43,
								final: false,
								dependency: "tutanota",
							},
						},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestRef",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						isPublic: true,
						values: {},
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
				}
				return clientModel[typeRef.typeId]
			}

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
			const typeModel = await serverModelResolver(TestTypeRef)
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel).addAttributeById(3, ParsedValue.fromIdTupleList([]))

			// can convert an empty array to ZeroOrOne
			const mappedInstance = await modelMapper.mapToInstance(parsedInstance)
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testListElementAssociation: [],
			} as any)
			const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
			changeInstanceDirection(parsedInstance, InstanceDirection.OutgoingToServer)
			o.check(newParsedInstance.deepEquals(parsedInstance)).equals(true)
		})
		o("change list element association from Any to ZeroOrOne one value", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<ServerTypeModel> => {
				const serverModel: Record<string, ServerTypeModel> = {
					"42": {
						app: "tutanota",
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
								name: "testListElementAssociation",
								type: AssociationType.ListElementAssociationGenerated,
								cardinality: Cardinality.ZeroOrOne,
								refTypeId: 43,
								final: false,
								dependency: "tutanota",
							},
						},
						version: 0,
						versioned: false,
					} as unknown as ServerTypeModel,
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestRef",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						isPublic: true,
						values: {},
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ServerTypeModel,
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<ClientTypeModel> => {
				const clientModel: Record<string, ClientTypeModel> = {
					"42": {
						app: "tutanota",
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
								name: "testListElementAssociation",
								type: AssociationType.ListElementAssociationGenerated,
								cardinality: Cardinality.Any,
								refTypeId: 43,
								final: false,
								dependency: "tutanota",
							},
						},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestRef",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						isPublic: true,
						values: {},
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
				}
				return clientModel[typeRef.typeId]
			}

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
			const typeModel = await serverModelResolver(TestTypeRef)
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel).addAttributeById(
				3,
				ParsedValue.fromIdTupleList([["listId", "listElementId"]]),
			)
			// can convert an array with one element to ZeroOrOne
			const mappedInstance = await modelMapper.mapToInstance(parsedInstance)
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testListElementAssociation: [["listId", "listElementId"]],
			} as any)
			const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
			changeInstanceDirection(parsedInstance, InstanceDirection.OutgoingToServer)
			o.check(newParsedInstance.deepEquals(parsedInstance)).equals(true)
		})
	})
	o.spec("ChangeValueCardinality", function () {
		o("change value from ZeroOrOne to One", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<ServerTypeModel> => {
				const serverModel: Record<string, ServerTypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
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
						version: 0,
						versioned: false,
					} as unknown as ServerTypeModel,
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<ClientTypeModel> => {
				const clientModel: Record<string, ClientTypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
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
								cardinality: Cardinality.ZeroOrOne,
								final: true,
								encrypted: true,
							},
						},
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
				}
				return clientModel[typeRef.typeId]
			}

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
			const typeModel = await serverModelResolver(TestTypeRef)
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel).addAttributeById(1, ParsedValue.fromString("example"))

			const mappedInstance = await modelMapper.mapToInstance(parsedInstance)
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testValue: "example",
			} as any)
			o(typeof mappedInstance["_errors"]).equals("undefined")

			const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
			changeInstanceDirection(parsedInstance, InstanceDirection.OutgoingToServer)
			o.check(parsedInstance.deepEquals(newParsedInstance)).equals(true)
		})
		o("change value from One to ZeroOrOne", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<ServerTypeModel> => {
				const serverModel: Record<string, ServerTypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
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
								cardinality: Cardinality.ZeroOrOne,
								final: true,
								encrypted: true,
							},
						},
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ServerTypeModel,
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<ClientTypeModel> => {
				const clientModel: Record<string, ClientTypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
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
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
				}
				return clientModel[typeRef.typeId]
			}

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
			const typeModel = await serverModelResolver(TestTypeRef)
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel).addAttributeById(1, ParsedValue.fromString("example"))

			const mappedInstance = await modelMapper.mapToInstance(parsedInstance)
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testValue: "example",
			} as any)
			o(typeof mappedInstance["_errors"]).equals("undefined")

			const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
			changeInstanceDirection(parsedInstance, InstanceDirection.OutgoingToServer)
			o(newParsedInstance.deepEquals(parsedInstance)).equals(true)

			o("change value from One to ZeroOrOne null value throws", async function () {
				const serverModelResolver = async (typeRef: TypeRef<any>): Promise<ServerTypeModel> => {
					const serverModel: Record<string, ServerTypeModel> = {
						"42": {
							app: "tutanota",
							encrypted: true,
							id: 42,
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
									cardinality: Cardinality.ZeroOrOne,
									final: true,
									encrypted: true,
								},
							},
							associations: {},
							version: 0,
							versioned: false,
						} as unknown as ServerTypeModel,
					}
					return serverModel[typeRef.typeId]
				}

				const clientModelResolver = async (typeRef: TypeRef<any>): Promise<ClientTypeModel> => {
					const clientModel: Record<string, ClientTypeModel> = {
						"42": {
							app: "tutanota",
							encrypted: true,
							id: 42,
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
							version: 0,
							versioned: false,
						} as unknown as ClientTypeModel,
					}
					return clientModel[typeRef.typeId]
				}

				const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
				const typeModel = await serverModelResolver(TestTypeRef)
				const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel).addAttributeById(1, ParsedValue.fromNull())
				await assertThrows(InvalidModelError, () => modelMapper.mapToInstance(parsedInstance))
			})
		})
		o.spec("NumberToStringValue", function () {
			o("convert number to string value", async function () {
				const serverModelResolver = async (typeRef: TypeRef<any>): Promise<ServerTypeModel> => {
					const serverModel: Record<string, ServerTypeModel> = {
						"42": {
							app: "tutanota",
							encrypted: true,
							id: 42,
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
									cardinality: Cardinality.ZeroOrOne,
									final: true,
									encrypted: true,
								},
							},
							associations: {},
							version: 0,
							versioned: false,
						} as unknown as ServerTypeModel,
					}
					return serverModel[typeRef.typeId]
				}

				const clientModelResolver = async (typeRef: TypeRef<any>): Promise<ClientTypeModel> => {
					const clientModel: Record<string, ClientTypeModel> = {
						"42": {
							app: "tutanota",
							encrypted: true,
							id: 42,
							name: "TestType",
							rootId: "SoMeId",
							since: 0,
							type: Type.ListElement,
							isPublic: true,
							values: {
								"1": {
									id: 1,
									name: "testValue",
									type: ValueType.Number,
									cardinality: Cardinality.ZeroOrOne,
									final: true,
									encrypted: true,
								},
							},
							associations: {},
							version: 0,
							versioned: false,
						} as unknown as ClientTypeModel,
					}
					return clientModel[typeRef.typeId]
				}

				const typeModel = await serverModelResolver(TestTypeRef)
				const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
				const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel).addAttributeById(1, ParsedValue.fromString("42"))

				const mappedInstance = await modelMapper.mapToInstance(parsedInstance)
				removeOriginals(mappedInstance)
				o(mappedInstance).deepEquals({ _type: TestTypeRef, testValue: "42" } as any)
				o(parsedInstance.hasError()).equals(false)

				// request is prepared with the client model and does not add handle the number to string transformation
				const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
				o.check(newParsedInstance.getAttributeByName("testValue").asString()).equals("42")
			})
			o("convert number to string value throws when server sends non numeric", async function () {
				const serverModelResolver = async (typeRef: TypeRef<any>): Promise<ServerTypeModel> => {
					const serverModel: Record<string, ServerTypeModel> = {
						"42": {
							app: "tutanota",
							encrypted: true,
							id: 42,
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
									cardinality: Cardinality.ZeroOrOne,
									final: true,
									encrypted: true,
								},
							},
							associations: {},
							version: 0,
							versioned: false,
						} as unknown as ServerTypeModel,
					}
					return serverModel[typeRef.typeId]
				}

				const clientModelResolver = async (typeRef: TypeRef<any>): Promise<ClientTypeModel> => {
					const clientModel: Record<string, ClientTypeModel> = {
						"42": {
							app: "tutanota",
							encrypted: true,
							id: 42,
							name: "TestType",
							rootId: "SoMeId",
							since: 0,
							type: Type.ListElement,
							isPublic: true,
							values: {
								"1": {
									id: 1,
									name: "testValue",
									type: ValueType.Number,
									cardinality: Cardinality.ZeroOrOne,
									final: true,
									encrypted: true,
								},
							},
							associations: {},
							version: 0,
							versioned: false,
						} as unknown as ClientTypeModel,
					}
					return clientModel[typeRef.typeId]
				}

				const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
				const typeModel = await serverModelResolver(TestTypeRef)
				const wrongParsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel).addAttributeById(1, ParsedValue.fromString("example"))

				const err = await assertThrows(ProgrammingError, () => modelMapper.mapToInstance(wrongParsedInstance))
				o(err.message).equals("Non-numeric string for attribute: testValue")
			})
		})
		o.spec("RemoveAssociation", function () {
			o("remove ZeroOrOne aggregation", async function () {
				const serverModelResolver = async (typeRef: TypeRef<any>): Promise<ServerTypeModel> => {
					const serverModel: Record<string, ServerTypeModel> = {
						"42": {
							app: "tutanota",
							encrypted: true,
							id: 42,
							name: "TestType",
							rootId: "SoMeId",
							since: 0,
							type: Type.ListElement,
							isPublic: true,
							values: {},
							associations: {},
							version: 0,
							versioned: false,
						} as unknown as ServerTypeModel,
					}
					return serverModel[typeRef.typeId]
				}

				const clientModelResolver = async (typeRef: TypeRef<any>): Promise<ClientTypeModel> => {
					const clientModel: Record<string, ClientTypeModel> = {
						"42": {
							app: "tutanota",
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
									cardinality: Cardinality.ZeroOrOne,
									refTypeId: 43,
									final: false,
									dependency: "tutanota",
								},
							},
							version: 0,
							versioned: false,
						} as unknown as ClientTypeModel,
						"43": {
							app: "tutanota",
							encrypted: true,
							id: 43,
							name: "TestAggregate",
							rootId: "SoMeId",
							since: 0,
							type: Type.Aggregated,
							isPublic: true,
							values: {
								"2": {
									id: 2,
									name: "testNumber",
									type: ValueType.Number,
									cardinality: Cardinality.One,
									final: false,
									encrypted: false,
								},
							},
							associations: {},
							version: 0,
							versioned: false,
						} as unknown as ClientTypeModel,
					}
					return clientModel[typeRef.typeId]
				}

				const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
				const typeModel = await serverModelResolver(TestTypeRef)
				const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel)

				// can remove aggregation with ZeroOrOne cardinality and supply null
				const mappedInstance = await modelMapper.mapToInstance(parsedInstance)
				removeOriginals(mappedInstance)
				o(mappedInstance).deepEquals({ _type: TestTypeRef, testAssociation: null } as any)
				o(typeof mappedInstance["_errors"]).equals("undefined")

				// request is prepared with the client model and does NOT remove ZeroOrOne aggregation
				const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
				o(newParsedInstance.getAttributeById(3).asNestedObjList()).deepEquals([])
			})
			o("remove Any aggregation", async function () {
				const serverModelResolver = async (typeRef: TypeRef<any>): Promise<ServerTypeModel> => {
					const serverModel: Record<string, ServerTypeModel> = {
						"42": {
							app: "tutanota",
							encrypted: true,
							id: 42,
							name: "TestType",
							rootId: "SoMeId",
							since: 0,
							type: Type.ListElement,
							isPublic: true,
							values: {},
							associations: {},
							version: 0,
							versioned: false,
						} as unknown as ServerTypeModel,
					}
					return serverModel[typeRef.typeId]
				}

				const clientModelResolver = async (typeRef: TypeRef<any>): Promise<ClientTypeModel> => {
					const clientModel: Record<string, ClientTypeModel> = {
						"42": {
							app: "tutanota",
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
									cardinality: Cardinality.Any,
									refTypeId: 43,
									final: false,
									dependency: "tutanota",
								},
							},
							version: 0,
							versioned: false,
						} as unknown as ClientTypeModel,
						"43": {
							app: "tutanota",
							encrypted: true,
							id: 43,
							name: "TestAggregate",
							rootId: "SoMeId",
							since: 0,
							type: Type.Aggregated,
							isPublic: true,
							values: {
								"2": {
									id: 2,
									name: "testNumber",
									type: ValueType.Number,
									cardinality: Cardinality.ZeroOrOne,
									final: false,
									encrypted: false,
								},
							},
							associations: {},
							version: 0,
							versioned: false,
						} as unknown as ClientTypeModel,
					}
					return clientModel[typeRef.typeId]
				}

				const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
				const typeModel = await serverModelResolver(TestTypeRef)
				const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel)

				// can remove association with Any cardinality and supply []
				const mappedInstance = await modelMapper.mapToInstance(parsedInstance)
				removeOriginals(mappedInstance)
				o(mappedInstance).deepEquals({
					_type: TestTypeRef,
					testAssociation: [],
				} as any)
				o(typeof mappedInstance["_errors"]).equals("undefined")

				// request is prepared with the client model and does NOT remove Any aggregation
				const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
				o(newParsedInstance.getAttributeById(3).asIdList()).deepEquals([])
			})
			o("remove ZeroOrOne list element association", async function () {
				const serverModelResolver = async (typeRef: TypeRef<any>): Promise<ServerTypeModel> => {
					const serverModel: Record<string, ServerTypeModel> = {
						"42": {
							app: "tutanota",
							encrypted: true,
							id: 42,
							name: "TestType",
							rootId: "SoMeId",
							since: 0,
							type: Type.ListElement,
							isPublic: true,
							values: {},
							associations: {},
							version: 0,
							versioned: false,
						} as unknown as ServerTypeModel,
					}
					return serverModel[typeRef.typeId]
				}

				const clientModelResolver = async (typeRef: TypeRef<any>): Promise<ClientTypeModel> => {
					const clientModel: Record<string, ClientTypeModel> = {
						"42": {
							app: "tutanota",
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
									name: "testListElementAssociation",
									type: AssociationType.ListElementAssociationGenerated,
									cardinality: Cardinality.ZeroOrOne,
									refTypeId: 43,
									final: false,
									dependency: "tutanota",
								},
							},
							version: 0,
							versioned: false,
						} as unknown as ClientTypeModel,
						"43": {
							app: "tutanota",
							encrypted: true,
							id: 43,
							name: "TestRef",
							rootId: "SoMeId",
							since: 0,
							type: Type.ListElement,
							isPublic: true,
							values: {},
							associations: {},
							version: 0,
							versioned: false,
						} as unknown as ClientTypeModel,
					}
					return clientModel[typeRef.typeId]
				}

				const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
				const typeModel = await serverModelResolver(TestTypeRef)
				const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel)
				// can remove association with ZeroOrOne and supply null
				const mappedInstance = await modelMapper.mapToInstance(parsedInstance)
				removeOriginals(mappedInstance)
				o(mappedInstance).deepEquals({
					_type: TestTypeRef,
					testListElementAssociation: null,
				} as any)

				o(typeof mappedInstance["_errors"]).equals("undefined")

				// request is prepared with the client model and does NOT remove ZeroOrOne list element association
				const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
				o.check(newParsedInstance.getAttributeById(3).asNestedObjList()).deepEquals([])
			})
			o("remove Any list element association", async function () {
				const serverModelResolver = async (typeRef: TypeRef<any>): Promise<ServerTypeModel> => {
					const serverModel: Record<string, ServerTypeModel> = {
						"42": {
							app: "tutanota",
							encrypted: true,
							id: 42,
							name: "TestType",
							rootId: "SoMeId",
							since: 0,
							type: Type.ListElement,
							isPublic: true,
							values: {},
							associations: {},
							version: 0,
							versioned: false,
						} as unknown as ServerTypeModel,
					}
					return serverModel[typeRef.typeId]
				}

				const clientModelResolver = async (typeRef: TypeRef<any>): Promise<ClientTypeModel> => {
					const clientModel: Record<string, ClientTypeModel> = {
						"42": {
							app: "tutanota",
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
									name: "testListElementAssociation",
									type: AssociationType.ListElementAssociationGenerated,
									cardinality: Cardinality.Any,
									refTypeId: 43,
									final: false,
									dependency: "tutanota",
								},
							},
							version: 0,
							versioned: false,
						} as unknown as ClientTypeModel,
						"43": {
							app: "tutanota",
							encrypted: true,
							id: 43,
							name: "TestAggregate",
							rootId: "SoMeId",
							since: 0,
							type: Type.Aggregated,
							isPublic: true,
							values: {
								"2": {
									id: 2,
									name: "testNumber",
									type: ValueType.Number,
									cardinality: Cardinality.ZeroOrOne,
									final: false,
									encrypted: false,
								},
							},
							associations: {},
							version: 0,
							versioned: false,
						} as unknown as ClientTypeModel,
					}
					return clientModel[typeRef.typeId]
				}

				const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
				const typeModel = await serverModelResolver(TestTypeRef)
				const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel)

				// can remove association with Any cardinality and supply []
				const mappedInstance = await modelMapper.mapToInstance(parsedInstance)
				removeOriginals(mappedInstance)
				o(mappedInstance).deepEquals({
					_type: TestTypeRef,
					testListElementAssociation: [],
				} as any)
				o(typeof mappedInstance["_errors"]).equals("undefined")

				// request is prepared with the client model and does NOT remove Any list element association
				const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
				o.check(newParsedInstance.getAttributeById(3).asIdList()).deepEquals([])
			})
			o.spec("RemoveValue", function () {
				o("Remove One Value", async function () {
					const serverModelResolver = async (typeRef: TypeRef<any>): Promise<ServerTypeModel> => {
						const serverModel: Record<string, ServerTypeModel> = {
							"42": {
								app: "tutanota",
								encrypted: true,
								id: 42,
								name: "TestType",
								rootId: "SoMeId",
								since: 0,
								type: Type.ListElement,
								isPublic: true,
								values: {},
								associations: {},
								version: 0,
								versioned: false,
							} as unknown as ServerTypeModel,
						}
						return serverModel[typeRef.typeId]
					}

					const clientModelResolver = async (typeRef: TypeRef<any>): Promise<ClientTypeModel> => {
						const clientModel: Record<string, ClientTypeModel> = {
							"42": {
								app: "tutanota",
								encrypted: true,
								id: 42,
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
								version: 0,
								versioned: false,
							} as unknown as ClientTypeModel,
						}
						return clientModel[typeRef.typeId]
					}

					const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
					const typeModel = await serverModelResolver(TestTypeRef)
					const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel)

					const mappedInstance = await modelMapper.mapToInstance(parsedInstance)
					removeOriginals(mappedInstance)
					o(mappedInstance).deepEquals({ _type: TestTypeRef, testValue: "" } as any)
					o(typeof mappedInstance["_errors"]).equals("undefined")

					// request is prepared with the client model and does NOT remove One value
					const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
					o.check(newParsedInstance.getAttributeByName("testValue").asString()).equals("")
				})
				o("server removes ZeroOrOne Value", async function () {
					const serverModelResolver = async (typeRef: TypeRef<any>): Promise<ServerTypeModel> => {
						const serverModel: Record<string, ServerTypeModel> = {
							"42": {
								app: "tutanota",
								encrypted: true,
								id: 42,
								name: "TestType",
								rootId: "SoMeId",
								since: 0,
								type: Type.ListElement,
								isPublic: true,
								values: {},
								associations: {},
								version: 0,
								versioned: false,
							} as unknown as ServerTypeModel,
						}
						return serverModel[typeRef.typeId]
					}
					const clientModelResolver = async (typeRef: TypeRef<any>): Promise<ClientTypeModel> => {
						const clientModel: Record<string, ClientTypeModel> = {
							"42": {
								app: "tutanota",
								encrypted: true,
								id: 42,
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
										cardinality: Cardinality.ZeroOrOne,
										final: true,
										encrypted: true,
									},
								},
								associations: {},
								version: 0,
								versioned: false,
							} as unknown as ClientTypeModel,
						}
						return clientModel[typeRef.typeId]
					}
					const typeModel = await serverModelResolver(TestTypeRef)

					const modelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, serverModelResolver))
					const serverDecryptedParsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel)

					const entity = await modelMapper.mapToInstance(serverDecryptedParsedInstance)
					removeOriginals(entity)
					o(entity).deepEquals({ _type: TestTypeRef, testValue: null } as any)

					o(typeof entity["_errors"]).equals("undefined")

					// request is prepared with the client model and does NOT remove ZeroOrOne value
					const newParsedInstance = await modelMapper.mapToDecryptedInstance(entity)
					o(newParsedInstance.getAttributeByName("testValue")).deepEquals(ParsedValue.fromNull())
				})
			})
		})
	})
})
