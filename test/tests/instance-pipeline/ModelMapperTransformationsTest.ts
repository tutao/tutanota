import o, { assertThrows } from "@tutao/otest"
import { DecryptedParsedInstance, ModelMapper } from "../../../src/platform-kit/instance-pipeline"
import { AssociationType, Cardinality, ClientTypeModel, ServerTypeModel, Type, TypeRef, ValueType } from "../../../src/platform-kit/meta"
import { DummyTypeModelResolver, TestAggregateRef, TestEntity } from "./InstancePipelineTestUtils"
import { removeOriginals } from "../TestUtils"
import { ParsedValue } from "../../../src/platform-kit/instance-pipeline/ParsedValue"
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
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(serverModel["42"]).addAttribute(
				3,
				ParsedValue.fromNestedItems([DecryptedParsedInstance.incomingFromServer(serverModel["43"]).addAttribute(2, ParsedValue.fromString("123"))]),
			)

			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)
			const mappedInstance = (await modelMapper.mapToInstance(parsedInstance)) as any
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")
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
			const typeRef = new TypeRef<TestEntity>("tutanota", 42)

			const serverDecryptedInstance = DecryptedParsedInstance.incomingFromServer(serverModel["42"]).addAttribute(
				3,
				ParsedValue.fromNestedItems([DecryptedParsedInstance.incomingFromServer(serverModel["43"]).addAttribute(2, ParsedValue.fromString("123"))]),
			)

			const mappedInstance = await modelMapper.mapToInstance(serverDecryptedInstance)
			removeOriginals(mappedInstance)

			o(mappedInstance).deepEquals({
				_type: typeRef,
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
			const typeRef = new TypeRef<TestEntity>("tutanota", 42)
			const aggregateTypeRef = new TypeRef<TestEntity>("tutanota", 43)

			const clientTypeModel = await clientModelResolver(typeRef)
			const serverTypeModel = await serverModelResolver(typeRef)
			const serverAggregateModel = await serverModelResolver(aggregateTypeRef)

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, serverModelResolver))
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(serverTypeModel).addAttribute(
				3,
				ParsedValue.fromNestedItems([DecryptedParsedInstance.incomingFromServer(serverAggregateModel).addAttribute(2, ParsedValue.fromString("123"))]),
			)

			const mappedInstance = await modelMapper.mapToInstance(parsedInstance)
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: typeRef,
			} as any)
			o(typeof mappedInstance["_errors"]).equals("undefined")

			// request is prepared with the client model and does not add Any aggregation
			const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
			const expectedDecryptedInstance = DecryptedParsedInstance.outgoingToServer(clientModel["42"])
			o.check(newParsedInstance.deepEquals(expectedDecryptedInstance)).equals(true)
		})

		o("add One list element association", async function () {
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
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(serverModel["42"]).addAttribute(
				3,
				ParsedValue.fromIdTupleList([["listId", "listElementId"]]),
			)

			const mappedInstance = (await modelMapper.mapToInstance(parsedInstance)) as any
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")
		})

		o("add ZeroOrOne list element association", async function () {
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
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))

			const parsedInstance = DecryptedParsedInstance.incomingFromServer(serverModel["42"]).addAttribute(
				3,
				ParsedValue.fromIdTupleList([["listId", "listElementId"]]),
			)

			const mappedInstance = (await modelMapper.mapToInstance(parsedInstance)) as any
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			// request is prepared with the client model and does not add ZeroOrOne association
			const newParsedInstance = await modelMapper.mapToInstance(mappedInstance)
			o(newParsedInstance).deepEquals({} as any)
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

			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))

			const parsedInstance = DecryptedParsedInstance.incomingFromServer(serverModel["42"]).addAttribute(
				3,
				ParsedValue.fromIdTupleList([["listId", "listElementId"]]),
			)

			const mappedInstance = (await modelMapper.mapToInstance(parsedInstance)) as any
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			// request is prepared with the client model and does not add Any association
			const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
			o(newParsedInstance).deepEquals({} as any)
		})
	})

	o.spec("AddValue", function () {
		o("add One Value", async function () {
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
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
				}
				return clientModel[typeRef.typeId]
			}
			const testTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))

			const parsedInstance = DecryptedParsedInstance.incomingFromServer(serverModel["42"]).addAttribute(1, ParsedValue.fromString("example"))

			const mappedInstance = (await modelMapper.mapToInstance(parsedInstance)) as any
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: testTypeRef,
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			// request is prepared with the client model and does not add One value
			const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
			o(newParsedInstance).deepEquals(parsedInstance)
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
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))

			// The instance in the local-store storage (written when the value was not there for the server & client models)
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(serverModel["42"])

			const mappedInstance = (await modelMapper.mapToInstance(parsedInstance)) as any
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testValue: "",
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

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
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(serverModel["42"]).addAttribute(1, ParsedValue.fromString("example"))

			const mappedInstance = (await modelMapper.mapToInstance(parsedInstance)) as any
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			// request is prepared with the client model and does not add ZeroOrOne value
			const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
			o(newParsedInstance).deepEquals({} as any)
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
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)
			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))

			const falseParsedInstance = DecryptedParsedInstance.incomingFromServer(serverModel["42"]).addAttribute(1, ParsedValue.fromBoolean(false))

			const falseMappedInstance = (await modelMapper.mapToInstance(falseParsedInstance)) as any
			removeOriginals(falseMappedInstance)
			o(falseMappedInstance).deepEquals({
				_type: TestTypeRef,
				testValue: false,
			} as any)
			o(typeof falseMappedInstance._errors).equals("undefined")

			// request is prepared with the client model and does not add handle the boolean to number transformation
			const newFalseParsedInstance = await modelMapper.mapToDecryptedInstance(falseMappedInstance)
			o(newFalseParsedInstance).deepEquals(falseParsedInstance)

			const trueParsedInstance = DecryptedParsedInstance.incomingFromServer(serverModel["42"]).addAttribute(1, ParsedValue.fromString("anything"))

			const trueMappedInstance = (await modelMapper.mapToInstance(trueParsedInstance)) as any
			removeOriginals(trueMappedInstance)
			o(trueMappedInstance).deepEquals({
				_type: TestTypeRef,
				testValue: true,
			} as any)
			o(typeof trueMappedInstance._errors).equals("undefined")

			// request is prepared with the client model and does not add handle the boolean to number transformation
			const newTrueParsedInstance = await modelMapper.mapToDecryptedInstance(trueMappedInstance)
			o(newTrueParsedInstance).deepEquals(trueParsedInstance)
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

			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))

			let serverTypeModel = await serverModelResolver(TestTypeRef)
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(serverTypeModel).addAttribute(
				3,
				ParsedValue.fromNestedItems([DecryptedParsedInstance.incomingFromServer(serverTypeModel)]),
			)

			const mappedInstance = (await modelMapper.mapToInstance(parsedInstance)) as any
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testAggregation: [
					{
						_type: TestAggregateRef,
					},
				],
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
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

			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))

			const typeModel = await serverModelResolver(TestTypeRef)

			const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel)
			parsedInstance.addAttribute(3, ParsedValue.fromNestedItems([]))

			// const parsedInstance: ServerModelParsedInstance = {
			// 	3: [],
			// } as any as ServerModelParsedInstance
			// can't convert an empty array to one
			await assertThrows(InvalidModelError, async () => modelMapper.mapToInstance(parsedInstance))
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

			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
			const typeModel = await serverModelResolver(TestTypeRef)
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel).addAttribute(3, ParsedValue.fromNestedItems([]))

			// can't convert an empty array to one
			const mappedInstance = await modelMapper.mapToInstance(parsedInstance)
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testAggregation: null,
			} as any)
			const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
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

			const testTypeRef = new TypeRef<TestEntity>("tutanota", 42)
			const aggregateTypeRef = new TypeRef<TestEntity>("tutanota", 43)

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
			const typeModel = await serverModelResolver(testTypeRef)
			const aggregateTypeModel = await serverModelResolver(aggregateTypeRef)
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel).addAttribute(
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

			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
			const typeModel = await serverModelResolver(TestTypeRef)
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel).addAttribute(3, ParsedValue.fromNestedItems([]))

			// can convert an empty array to ZeroOrOne
			const mappedInstance = await modelMapper.mapToInstance(parsedInstance)
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testAggregation: [],
			} as any)
			const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
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

			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)
			const aggregateTypeRef = new TypeRef<TestEntity>("tutanota", 43)

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
			const typeModel = await serverModelResolver(TestTypeRef)
			const aggregateTypeModel = await serverModelResolver(aggregateTypeRef)
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel).addAttribute(
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

			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
			const typeModel = await serverModelResolver(TestTypeRef)
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel).addAttribute(
				3,
				ParsedValue.fromIdTupleList([["listId", "listElementId"]]),
			)

			const mappedInstance = (await modelMapper.mapToInstance(parsedInstance)) as any
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testListElementAssociation: [["listId", "listElementId"]],
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
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

			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
			const typeModel = await serverModelResolver(TestTypeRef)
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel).addAttribute(3, ParsedValue.fromIdTupleList([]))

			// can't convert an empty array to one
			await assertThrows(InvalidModelError, async () => modelMapper.mapToInstance(parsedInstance))
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

			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
			const typeModel = await serverModelResolver(TestTypeRef)
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel).addAttribute(3, ParsedValue.fromIdTupleList([]))

			// can't convert an empty array to one
			const mappedInstance = await modelMapper.mapToInstance(parsedInstance)
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testListElementAssociation: null,
			} as any)

			// request is prepared with the client model and association is not changed
			const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
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

			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
			const typeModel = await serverModelResolver(TestTypeRef)
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel).addAttribute(
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

			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
			const typeModel = await serverModelResolver(TestTypeRef)
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel).addAttribute(3, ParsedValue.fromIdTupleList([]))

			// can convert an empty array to ZeroOrOne
			const mappedInstance = await modelMapper.mapToInstance(parsedInstance)
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testListElementAssociation: [],
			} as any)
			const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
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

			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
			const typeModel = await serverModelResolver(TestTypeRef)
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel).addAttribute(
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
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
			const typeModel = await serverModelResolver(TestTypeRef)
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel).addAttribute(1, ParsedValue.fromString("example"))

			const mappedInstance = (await modelMapper.mapToInstance(parsedInstance)) as any
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testValue: "example",
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
			const expected = DecryptedParsedInstance.incomingFromServer(typeModel).addAttribute(3, ParsedValue.fromString("example"))
			o.check(newParsedInstance.deepEquals(expected)).equals(true)
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
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
			const typeModel = await serverModelResolver(TestTypeRef)
			const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel).addAttribute(1, ParsedValue.fromString("example"))

			const mappedInstance = (await modelMapper.mapToInstance(parsedInstance)) as any
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testValue: "example",
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
			const exptected = DecryptedParsedInstance.incomingFromServer(typeModel).addAttribute(1, ParsedValue.fromString("example"))
			o(newParsedInstance.deepEquals(exptected)).equals(true)

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
				const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

				const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
				const typeModel = await serverModelResolver(TestTypeRef)
				const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel).addAttribute(3, ParsedValue.fromNull())
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
				const typeRef = new TypeRef<TestEntity>("tutanota", 42)
				const typeModel = await serverModelResolver(typeRef)
				const clientTypeModel = await clientModelResolver(typeRef)

				const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
				const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel).addAttribute(3, ParsedValue.fromString("42"))

				const mappedInstance = await modelMapper.mapToInstance(parsedInstance)
				const expectedInstance = DecryptedParsedInstance.incomingFromServer(clientTypeModel).addAttribute(3, ParsedValue.fromString("42"))
				const expectedEntity = await modelMapper.mapToInstance(expectedInstance)
				removeOriginals(mappedInstance)
				o(mappedInstance).deepEquals(expectedEntity)
				o(typeof parsedInstance.getErrors()).equals("undefined")

				// request is prepared with the client model and does not add handle the number to string transformation
				const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
				o.check(newParsedInstance.deepEquals(expectedInstance)).equals(true)
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
				const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

				const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
				const typeModel = await serverModelResolver(TestTypeRef)
				const wrongParsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel).addAttribute(3, ParsedValue.fromString("example"))

				await assertThrows(ProgrammingError, () => modelMapper.mapToInstance(wrongParsedInstance))
			})
		})
		o.spec("RemoveAssociation", function () {
			o("remove One aggregation", async function () {
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
				const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

				const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
				const typeModel = await serverModelResolver(TestTypeRef)
				const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel)

				// can't create the instance since One aggregation is removed
				await assertThrows(InvalidModelError, () => modelMapper.mapToInstance(parsedInstance))
			})
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
				const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

				const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
				const typeModel = await serverModelResolver(TestTypeRef)
				const clientTypeModel = await clientModelResolver(TestTypeRef)
				const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel)

				const exptectedInstance = DecryptedParsedInstance.incomingFromServer(clientTypeModel).addAttribute(3, ParsedValue.fromNull())
				const expectedEntity = await modelMapper.mapToInstance(exptectedInstance)

				// can remove aggregation with ZeroOrOne cardinality and supply null
				const mappedInstance = await modelMapper.mapToInstance(parsedInstance)
				removeOriginals(mappedInstance)

				o(mappedInstance).deepEquals(expectedEntity)
				//FIXME is it needed to check _errors?
				// o(typeof mappedInstance._errors).equals("undefined")

				// request is prepared with the client model and does NOT remove ZeroOrOne aggregation
				const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
				o(newParsedInstance).deepEquals({
					3: [],
				} as any)
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
				const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

				const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
				const typeModel = await serverModelResolver(TestTypeRef)
				const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel)

				// can remove association with Any cardinality and supply []
				const mappedInstance = (await modelMapper.mapToInstance(parsedInstance)) as any
				removeOriginals(mappedInstance)
				o(mappedInstance).deepEquals({
					_type: TestTypeRef,
					testAssociation: [],
				} as any)
				o(typeof mappedInstance._errors).equals("undefined")

				// request is prepared with the client model and does NOT remove Any aggregation
				const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
				o(newParsedInstance).deepEquals({
					3: [],
				} as any)
			})
			o("remove One list element association", async function () {
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
				const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

				const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
				const typeModel = await serverModelResolver(TestTypeRef)
				const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel)
				// can't create the instance since One association is removed
				await assertThrows(InvalidModelError, () => modelMapper.mapToInstance(parsedInstance))
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
				const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

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

				//FIXME check _errors?
				// o(typeof mappedInstance._errors).equals("undefined")

				// request is prepared with the client model and does NOT remove ZeroOrOne list element association
				const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
				o(newParsedInstance).deepEquals({
					3: [],
				} as any)
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
				const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

				const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
				const typeModel = await serverModelResolver(TestTypeRef)
				const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel)

				// can remove association with Any cardinality and supply []
				const mappedInstance = (await modelMapper.mapToInstance(parsedInstance)) as any
				removeOriginals(mappedInstance)
				o(mappedInstance).deepEquals({
					_type: TestTypeRef,
					testListElementAssociation: [],
				} as any)
				o(typeof mappedInstance._errors).equals("undefined")

				// request is prepared with the client model and does NOT remove Any list element association
				const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
				o(newParsedInstance).deepEquals({
					3: [],
				} as any)
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
					const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

					const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
					const typeModel = await serverModelResolver(TestTypeRef)
					const clientTypeModel = await clientModelResolver(TestTypeRef)
					const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel)
					const expectedInstance = DecryptedParsedInstance.incomingFromServer(clientTypeModel).addAttribute(1, ParsedValue.fromString(""))
					const expectedEntity = await modelMapper.mapToInstance(expectedInstance)

					const mappedInstance = await modelMapper.mapToInstance(parsedInstance)
					removeOriginals(mappedInstance)
					o(mappedInstance).deepEquals(expectedEntity)

					//FIXME _errors?
					// o(typeof mappedInstance._errors).equals("undefined")

					// request is prepared with the client model and does NOT remove One value
					const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
					o.check(newParsedInstance.deepEquals(expectedInstance)).equals(true)
				})
				o("remove ZeroOrOne Value", async function () {
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
					const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

					const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver(clientModelResolver, null!))
					const typeModel = await serverModelResolver(TestTypeRef)
					const clientTypeModel = await clientModelResolver(TestTypeRef)
					const parsedInstance = DecryptedParsedInstance.incomingFromServer(typeModel)

					const expectedInstance = DecryptedParsedInstance.incomingFromServer(clientTypeModel).addAttribute(1, ParsedValue.fromNull())
					const expectedEntity = await modelMapper.mapToInstance(expectedInstance)

					const mappedInstance = (await modelMapper.mapToInstance(parsedInstance)) as any
					removeOriginals(mappedInstance)
					o(mappedInstance).deepEquals(expectedEntity)

					//FIXME _errors?
					// o(typeof mappedInstance._errors).equals("undefined")

					// request is prepared with the client model and does NOT remove ZeroOrOne value
					const newParsedInstance = await modelMapper.mapToDecryptedInstance(mappedInstance)
					o.check(newParsedInstance.deepEquals(expectedInstance)).equals(true)
				})
			})
		})
	})
})
