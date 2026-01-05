import o from "@tutao/otest"
import { ModelMapper } from "../../../../../src/common/api/worker/crypto/ModelMapper.js"
import { AssociationType, Cardinality, Type, ValueType } from "../../../../../src/common/api/common/EntityConstants.js"
import { TypeRef } from "@tutao/tutanota-utils"
import { TestAggregateRef, TestEntity } from "./InstancePipelineTestUtils"
import { ClientModelParsedInstance, ClientTypeModel, ServerModelParsedInstance, ServerTypeModel } from "../../../../../src/common/api/common/EntityTypes"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { ProgrammingError } from "../../../../../src/common/api/common/error/ProgrammingError"
import { ClientTypeReferenceResolver, ServerTypeReferenceResolver } from "../../../../../src/common/api/common/EntityFunctions"
import { removeOriginals } from "../../../TestUtils"
import { InvalidModelError } from "../../../../../src/common/api/common/error/InvalidModelError"

o.spec("ModelMapperTransformations", function () {
	o.spec("AddAssociation", function () {
		o("add One aggregation", async function () {
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
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
				}
				return clientModel[typeRef.typeId]
			}
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)
			const parsedInstance: ServerModelParsedInstance = {
				3: [{ 2: "123", _finalIvs: {} } as any as ServerModelParsedInstance],
				_finalIvs: {},
			} as any as ServerModelParsedInstance

			const mappedInstance = (await modelMapper.mapToInstance(TestTypeRef, parsedInstance)) as any
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")
		})
		o("add ZeroOrOne aggregation", async function () {
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
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
				}
				return clientModel[typeRef.typeId]
			}
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)
			const parsedInstance: ServerModelParsedInstance = {
				3: [{ 2: "123", _finalIvs: {} } as any as ServerModelParsedInstance],
				_finalIvs: {},
			} as any as ServerModelParsedInstance

			const mappedInstance = (await modelMapper.mapToInstance(TestTypeRef, parsedInstance)) as any
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			// request is prepared with the client model and does not add ZeroOrOne aggregation
			const newParsedInstance = await modelMapper.mapToClientModelParsedInstance(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals({
				_finalIvs: {},
			} as any)
		})
		o("add Any aggregation", async function () {
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
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
				}
				return clientModel[typeRef.typeId]
			}
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)
			const parsedInstance: ServerModelParsedInstance = {
				3: [{ 2: "123", _finalIvs: {} } as any as ServerModelParsedInstance],
				_finalIvs: {},
			} as any as ServerModelParsedInstance

			const mappedInstance = (await modelMapper.mapToInstance(TestTypeRef, parsedInstance)) as any
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			// request is prepared with the client model and does not add Any aggregation
			const newParsedInstance = await modelMapper.mapToClientModelParsedInstance(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals({
				_finalIvs: {},
			} as any as ClientModelParsedInstance)
		})

		o("add One list element association", async function () {
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
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
				}
				return clientModel[typeRef.typeId]
			}
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)
			const parsedInstance: ServerModelParsedInstance = {
				3: [["listId", "listElementId"]],
				_finalIvs: {},
			} as any as ServerModelParsedInstance

			const mappedInstance = (await modelMapper.mapToInstance(TestTypeRef, parsedInstance)) as any
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")
		})
		o("add ZeroOrOne list element association", async function () {
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
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
				}
				return clientModel[typeRef.typeId]
			}
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)
			const parsedInstance: ServerModelParsedInstance = {
				3: [["listId", "listElementId"]],
				_finalIvs: {},
			} as any as ServerModelParsedInstance

			const mappedInstance = (await modelMapper.mapToInstance(TestTypeRef, parsedInstance)) as any
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			// request is prepared with the client model and does not add ZeroOrOne association
			const newParsedInstance = await modelMapper.mapToClientModelParsedInstance(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals({
				_finalIvs: {},
			} as any as ClientModelParsedInstance)
		})
		o("add Any list element association", async function () {
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
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
				}
				return clientModel[typeRef.typeId]
			}
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)
			const parsedInstance: ServerModelParsedInstance = {
				3: [["listId", "listElementId"]],
				_finalIvs: {},
			} as any as ServerModelParsedInstance

			const mappedInstance = (await modelMapper.mapToInstance(TestTypeRef, parsedInstance)) as any
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			// request is prepared with the client model and does not add Any association
			const newParsedInstance = await modelMapper.mapToClientModelParsedInstance(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals({
				_finalIvs: {},
			} as any as ClientModelParsedInstance)
		})
	})
	o.spec("AddValue", function () {
		o("add One Value", async function () {
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
						values: {},
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
				}
				return clientModel[typeRef.typeId]
			}
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)
			const parsedInstance: ServerModelParsedInstance = {
				1: "example",
				_finalIvs: {},
			} as any as ServerModelParsedInstance

			const mappedInstance = (await modelMapper.mapToInstance(TestTypeRef, parsedInstance)) as any
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			// request is prepared with the client model and does not add One value
			const newParsedInstance = await modelMapper.mapToClientModelParsedInstance(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals({
				_finalIvs: {},
			} as any as ClientModelParsedInstance)
		})
		o("add One Value with default supplier on server should also supply default on client", async function () {
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

			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)
			// The instance in the offline storage (written when the value was not there for the server & client models)
			const parsedInstance: ServerModelParsedInstance = {
				_finalIvs: {},
			} as any as ServerModelParsedInstance

			const mappedInstance = (await modelMapper.mapToInstance(TestTypeRef, parsedInstance)) as any
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testValue: "",
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			// request is prepared with the client model and does not add One value
			const newParsedInstance = await modelMapper.mapToClientModelParsedInstance(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals({
				1: "",
				_finalIvs: {},
			} as any as ClientModelParsedInstance)
		})
		o("add ZeroOrOne Value", async function () {
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
						values: {},
						associations: {},
						version: 0,
						versioned: false,
					} as unknown as ClientTypeModel,
				}
				return clientModel[typeRef.typeId]
			}
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)
			const parsedInstance: ServerModelParsedInstance = {
				1: "example",
				_finalIvs: {},
			} as any as ServerModelParsedInstance

			const mappedInstance = (await modelMapper.mapToInstance(TestTypeRef, parsedInstance)) as any
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			// request is prepared with the client model and does not add ZeroOrOne value
			const newParsedInstance = await modelMapper.mapToClientModelParsedInstance(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals({
				_finalIvs: {},
			} as any as ClientModelParsedInstance)
		})
	})
	o.spec("BooleanToNumberValue", function () {
		o("convert boolean to number value", async function () {
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
				return clientModel[typeRef.typeId]
			}
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)
			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)

			// false
			const falseParsedInstance: ServerModelParsedInstance = {
				1: "0",
				_finalIvs: {},
			} as any as ServerModelParsedInstance

			const falseMappedInstance = (await modelMapper.mapToInstance(TestTypeRef, falseParsedInstance)) as any
			removeOriginals(falseMappedInstance)
			o(falseMappedInstance).deepEquals({
				_type: TestTypeRef,
				testValue: false,
				_finalIvs: {},
			} as any)
			o(typeof falseMappedInstance._errors).equals("undefined")

			// request is prepared with the client model and does not add handle the boolean to number transformation
			const newFalseParsedInstance = await modelMapper.mapToClientModelParsedInstance(TestTypeRef, falseMappedInstance)
			o(newFalseParsedInstance).deepEquals({
				1: false,
				_finalIvs: {},
			} as any as ClientModelParsedInstance)

			// true
			const trueParsedInstance: ServerModelParsedInstance = {
				1: "anything",
				_finalIvs: {},
			} as any as ServerModelParsedInstance

			const trueMappedInstance = (await modelMapper.mapToInstance(TestTypeRef, trueParsedInstance)) as any
			removeOriginals(trueMappedInstance)
			o(trueMappedInstance).deepEquals({
				_type: TestTypeRef,
				testValue: true,
				_finalIvs: {},
			} as any)
			o(typeof trueMappedInstance._errors).equals("undefined")

			// request is prepared with the client model and does not add handle the boolean to number transformation
			const newTrueParsedInstance = await modelMapper.mapToClientModelParsedInstance(TestTypeRef, trueMappedInstance)
			o(newTrueParsedInstance).deepEquals({
				1: true,
				_finalIvs: {},
			} as any as ClientModelParsedInstance)
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

			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)
			const parsedInstance: ServerModelParsedInstance = {
				3: [
					{
						_finalIvs: {},
					} as any as ServerModelParsedInstance,
				],
				_finalIvs: {},
			} as any as ServerModelParsedInstance

			const mappedInstance = (await modelMapper.mapToInstance(TestTypeRef, parsedInstance)) as any
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testAggregation: [
					{
						_type: TestAggregateRef,
						_finalIvs: {},
					},
				],
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			const newParsedInstance = await modelMapper.mapToClientModelParsedInstance(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals(parsedInstance as any as ClientModelParsedInstance)
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

			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)
			const parsedInstance: ServerModelParsedInstance = {
				3: [],
				_finalIvs: {},
			} as any as ServerModelParsedInstance
			// can't convert an empty array to one
			await assertThrows(InvalidModelError, async () => modelMapper.mapToInstance(TestTypeRef, parsedInstance))
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

			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)
			const parsedInstance: ServerModelParsedInstance = {
				3: [],
				_finalIvs: {},
			} as any as ServerModelParsedInstance
			// can't convert an empty array to one
			const mappedInstance = await modelMapper.mapToInstance(TestTypeRef, parsedInstance)
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testAggregation: null,
				_finalIvs: {},
			} as any)
			const newParsedInstance = await modelMapper.mapToClientModelParsedInstance(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals(parsedInstance as any as ClientModelParsedInstance)
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

			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)
			const parsedInstance: ServerModelParsedInstance = {
				3: [{ _finalIvs: {} } as any as ServerModelParsedInstance, { _finalIvs: {} } as any as ServerModelParsedInstance],
				_finalIvs: {},
			} as any as ServerModelParsedInstance
			// can't convert an array with multiple elements to ZeroOrOne
			await assertThrows(InvalidModelError, () => modelMapper.mapToInstance(TestTypeRef, parsedInstance))
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

			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)
			const parsedInstance: ServerModelParsedInstance = {
				3: [],
				_finalIvs: {},
			} as any as ServerModelParsedInstance
			// can convert an empty array to ZeroOrOne
			const mappedInstance = await modelMapper.mapToInstance(TestTypeRef, parsedInstance)
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testAggregation: [],
				_finalIvs: {},
			} as any)
			const newParsedInstance = await modelMapper.mapToClientModelParsedInstance(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals(parsedInstance as any as ClientModelParsedInstance)
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

			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)
			const parsedInstance: ServerModelParsedInstance = {
				3: [{ _finalIvs: {} } as any as ServerModelParsedInstance],
				_finalIvs: {},
			} as any as ServerModelParsedInstance
			// can convert an array with one element to ZeroOrOne
			const mappedInstance = await modelMapper.mapToInstance(TestTypeRef, parsedInstance)
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testAggregation: [{ _type: TestAggregateRef, _finalIvs: {} } as any],
				_finalIvs: {},
			} as any)
			const newParsedInstance = await modelMapper.mapToClientModelParsedInstance(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals(parsedInstance as any as ClientModelParsedInstance)
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

			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)
			const parsedInstance: ServerModelParsedInstance = {
				3: [["listId", "listElementId"]],
				_finalIvs: {},
			} as any as ServerModelParsedInstance

			const mappedInstance = (await modelMapper.mapToInstance(TestTypeRef, parsedInstance)) as any
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testListElementAssociation: [["listId", "listElementId"]],
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			const newParsedInstance = await modelMapper.mapToClientModelParsedInstance(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals(parsedInstance as any as ClientModelParsedInstance)
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

			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)
			const parsedInstance: ServerModelParsedInstance = {
				3: [],
				_finalIvs: {},
			} as any as ServerModelParsedInstance
			// can't convert an empty array to one
			await assertThrows(InvalidModelError, async () => modelMapper.mapToInstance(TestTypeRef, parsedInstance))
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

			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)
			const parsedInstance: ServerModelParsedInstance = {
				3: [],
				_finalIvs: {},
			} as any as ServerModelParsedInstance
			// can't convert an empty array to one
			const mappedInstance = await modelMapper.mapToInstance(TestTypeRef, parsedInstance)
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testListElementAssociation: null,
				_finalIvs: {},
			} as any)

			// request is prepared with the client model and association is not changed
			const newParsedInstance = await modelMapper.mapToClientModelParsedInstance(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals(parsedInstance as any as ClientModelParsedInstance)
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

			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)
			const parsedInstance: ServerModelParsedInstance = {
				3: [
					["listId", "listElementId1"],
					["listId", "listElementId2"],
				],
				_finalIvs: {},
			} as any as ServerModelParsedInstance
			// can't convert an array with multiple elements to ZeroOrOne
			await assertThrows(InvalidModelError, () => modelMapper.mapToInstance(TestTypeRef, parsedInstance))
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

			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)
			const parsedInstance: ServerModelParsedInstance = {
				3: [],
				_finalIvs: {},
			} as any as ServerModelParsedInstance
			// can convert an empty array to ZeroOrOne
			const mappedInstance = await modelMapper.mapToInstance(TestTypeRef, parsedInstance)
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testListElementAssociation: [],
				_finalIvs: {},
			} as any)
			const newParsedInstance = await modelMapper.mapToClientModelParsedInstance(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals(parsedInstance as any as ClientModelParsedInstance)
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

			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)
			const parsedInstance: ServerModelParsedInstance = {
				3: [["listId", "listElementId"]],
				_finalIvs: {},
			} as any as ServerModelParsedInstance
			// can convert an array with one element to ZeroOrOne
			const mappedInstance = await modelMapper.mapToInstance(TestTypeRef, parsedInstance)
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testListElementAssociation: [["listId", "listElementId"]],
				_finalIvs: {},
			} as any)
			const newParsedInstance = await modelMapper.mapToClientModelParsedInstance(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals(parsedInstance as any as ClientModelParsedInstance)
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

			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)
			const parsedInstance: ServerModelParsedInstance = {
				1: "example",
				_finalIvs: {},
			} as any as ServerModelParsedInstance

			const mappedInstance = (await modelMapper.mapToInstance(TestTypeRef, parsedInstance)) as any
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testValue: "example",
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			const newParsedInstance = await modelMapper.mapToClientModelParsedInstance(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals({
				1: "example",
				_finalIvs: {},
			} as any as ClientModelParsedInstance)
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

			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)
			const parsedInstance: ServerModelParsedInstance = {
				1: "example",
				_finalIvs: {},
			} as any as ServerModelParsedInstance

			const mappedInstance = (await modelMapper.mapToInstance(TestTypeRef, parsedInstance)) as any
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testValue: "example",
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			const newParsedInstance = await modelMapper.mapToClientModelParsedInstance(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals({
				1: "example",
				_finalIvs: {},
			} as any as ClientModelParsedInstance)
		})
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

			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)
			const parsedInstance: ServerModelParsedInstance = {
				1: null,
				_finalIvs: {},
			} as any as ServerModelParsedInstance

			await assertThrows(InvalidModelError, () => modelMapper.mapToInstance(TestTypeRef, parsedInstance))
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
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)
			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)

			const parsedInstance: ServerModelParsedInstance = {
				1: "42",
				_finalIvs: {},
			} as any as ServerModelParsedInstance

			const mappedInstance = (await modelMapper.mapToInstance(TestTypeRef, parsedInstance)) as any
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testValue: 42,
				_finalIvs: {},
			} as any)
			o(typeof parsedInstance._errors).equals("undefined")

			// request is prepared with the client model and does not add handle the number to string transformation
			const newParsedInstance = await modelMapper.mapToClientModelParsedInstance(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals({
				1: 42,
				_finalIvs: {},
			} as any as ClientModelParsedInstance)
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
			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)

			const wrongParsedInstance: ServerModelParsedInstance = {
				1: "example",
				_finalIvs: {},
			} as any as ServerModelParsedInstance

			await assertThrows(ProgrammingError, () => modelMapper.mapToInstance(TestTypeRef, wrongParsedInstance))
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

			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)
			const parsedInstance: ServerModelParsedInstance = {
				_finalIvs: {},
			} as any as ServerModelParsedInstance
			// can't create the instance since One aggregation is removed
			await assertThrows(InvalidModelError, () => modelMapper.mapToInstance(TestTypeRef, parsedInstance))
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

			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)
			const parsedInstance: ServerModelParsedInstance = {
				_finalIvs: {},
			} as any as ServerModelParsedInstance

			// can remove aggregation with ZeroOrOne cardinality and supply null
			const mappedInstance = (await modelMapper.mapToInstance(TestTypeRef, parsedInstance)) as any
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testAssociation: null,
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			// request is prepared with the client model and does NOT remove ZeroOrOne aggregation
			const newParsedInstance = await modelMapper.mapToClientModelParsedInstance(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals({
				3: [],
				_finalIvs: {},
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

			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)
			const parsedInstance: ServerModelParsedInstance = {
				_finalIvs: {},
			} as any as ServerModelParsedInstance

			// can remove association with Any cardinality and supply []
			const mappedInstance = (await modelMapper.mapToInstance(TestTypeRef, parsedInstance)) as any
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testAssociation: [],
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			// request is prepared with the client model and does NOT remove Any aggregation
			const newParsedInstance = await modelMapper.mapToClientModelParsedInstance(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals({
				3: [],
				_finalIvs: {},
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

			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)
			const parsedInstance: ServerModelParsedInstance = {
				_finalIvs: {},
			} as any as ServerModelParsedInstance
			// can't create the instance since One association is removed
			await assertThrows(InvalidModelError, () => modelMapper.mapToInstance(TestTypeRef, parsedInstance))
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

			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)
			const parsedInstance: ServerModelParsedInstance = {
				_finalIvs: {},
			} as any as ServerModelParsedInstance

			// can remove association with ZeroOrOne and supply null
			const mappedInstance = (await modelMapper.mapToInstance(TestTypeRef, parsedInstance)) as any
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testListElementAssociation: null,
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			// request is prepared with the client model and does NOT remove ZeroOrOne list element association
			const newParsedInstance = await modelMapper.mapToClientModelParsedInstance(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals({
				3: [],
				_finalIvs: {},
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

			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)
			const parsedInstance: ServerModelParsedInstance = {
				_finalIvs: {},
			} as any as ServerModelParsedInstance

			// can remove association with Any cardinality and supply []
			const mappedInstance = (await modelMapper.mapToInstance(TestTypeRef, parsedInstance)) as any
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testListElementAssociation: [],
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			// request is prepared with the client model and does NOT remove Any list element association
			const newParsedInstance = await modelMapper.mapToClientModelParsedInstance(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals({
				3: [],
				_finalIvs: {},
			} as any)
		})
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

			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)
			const parsedInstance: ServerModelParsedInstance = {
				_finalIvs: {},
			} as any as ServerModelParsedInstance

			const mappedInstance = (await modelMapper.mapToInstance(TestTypeRef, parsedInstance)) as any
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testValue: "",
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			// request is prepared with the client model and does NOT remove One value
			const newParsedInstance = await modelMapper.mapToClientModelParsedInstance(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals({
				1: "",
				_finalIvs: {},
			} as any as ClientModelParsedInstance)
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

			const modelMapper: ModelMapper = new ModelMapper(
				clientModelResolver as ClientTypeReferenceResolver,
				serverModelResolver as ServerTypeReferenceResolver,
			)
			const parsedInstance: ServerModelParsedInstance = {
				_finalIvs: {},
			} as any as ServerModelParsedInstance

			const mappedInstance = (await modelMapper.mapToInstance(TestTypeRef, parsedInstance)) as any
			removeOriginals(mappedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testValue: null,
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			// request is prepared with the client model and does NOT remove ZeroOrOne value
			const newParsedInstance = await modelMapper.mapToClientModelParsedInstance(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals({
				1: null,
				_finalIvs: {},
			} as any)
		})
	})
})
