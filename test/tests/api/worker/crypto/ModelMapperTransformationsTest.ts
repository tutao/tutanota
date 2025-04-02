import o from "@tutao/otest"
import { ModelMapper } from "../../../../../src/common/api/worker/crypto/ModelMapper.js"
import { AssociationType, Cardinality, Type, ValueType } from "../../../../../src/common/api/common/EntityConstants.js"
import { TypeRef } from "@tutao/tutanota-utils"
import { TestAggregateRef, TestEntity } from "./InstancePipelineTestUtils"
import { ParsedInstance, TypeModel } from "../../../../../src/common/api/common/EntityTypes"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { ProgrammingError } from "../../../../../src/common/api/common/error/ProgrammingError"

o.spec("ModelMapperTransformations", function () {
	o.spec("AddAssociation", function () {
		o("add One aggregation", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestAggregate",
						rootId: "SoMeId",
						since: 0,
						type: Type.Aggregated,
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
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)
			const parsedInstance: ParsedInstance = {
				3: [{ 2: "123", _finalIvs: {} } as ParsedInstance],
				_finalIvs: {},
			}

			const mappedInstance = (await modelMapper.applyClientModel(TestTypeRef, parsedInstance)) as any
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			// can't create association of ONE
			await assertThrows(ProgrammingError, async () => modelMapper.applyServerModel(TestTypeRef, mappedInstance))
		})
		o("add ZeroOrOne aggregation", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestAggregate",
						rootId: "SoMeId",
						since: 0,
						type: Type.Aggregated,
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
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)
			const parsedInstance: ParsedInstance = {
				3: [{ 2: "123", _finalIvs: {} } as ParsedInstance],
				_finalIvs: {},
			}

			const mappedInstance = (await modelMapper.applyClientModel(TestTypeRef, parsedInstance)) as any
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			// can create association with ZeroOrOne
			const newParsedInstance = await modelMapper.applyServerModel(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals({
				3: [],
				_finalIvs: {},
			})
		})
		o("add Any aggregation", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestAggregate",
						rootId: "SoMeId",
						since: 0,
						type: Type.Aggregated,
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
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)
			const parsedInstance: ParsedInstance = {
				3: [{ 2: "123", _finalIvs: {} } as ParsedInstance],
				_finalIvs: {},
			}

			const mappedInstance = (await modelMapper.applyClientModel(TestTypeRef, parsedInstance)) as any
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			// can create association with ANY
			const newParsedInstance = await modelMapper.applyServerModel(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals({
				3: [],
				_finalIvs: {},
			})
		})

		o("add One list element association", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestRef",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)
			const parsedInstance: ParsedInstance = {
				3: [["listId", "listElementId"]],
				_finalIvs: {},
			}

			const mappedInstance = (await modelMapper.applyClientModel(TestTypeRef, parsedInstance)) as any
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			// can't create association of ONE
			await assertThrows(ProgrammingError, async () => modelMapper.applyServerModel(TestTypeRef, mappedInstance))
		})
		o("add ZeroOrOne list element association", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestRef",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)
			const parsedInstance: ParsedInstance = {
				3: [["listId", "listElementId"]],
				_finalIvs: {},
			}

			const mappedInstance = (await modelMapper.applyClientModel(TestTypeRef, parsedInstance)) as any
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			// can create association with ZeroOrOne
			const newParsedInstance = await modelMapper.applyServerModel(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals({
				3: [],
				_finalIvs: {},
			})
		})
		o("add Any list element association", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestAggregate",
						rootId: "SoMeId",
						since: 0,
						type: Type.Aggregated,
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
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)
			const parsedInstance: ParsedInstance = {
				3: [["listId", "listElementId"]],
				_finalIvs: {},
			}

			const mappedInstance = (await modelMapper.applyClientModel(TestTypeRef, parsedInstance)) as any
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			// can create association with ANY
			const newParsedInstance = await modelMapper.applyServerModel(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals({
				3: [],
				_finalIvs: {},
			})
		})
	})
	o.spec("AddValue", function () {
		o("add One Value", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)
			const parsedInstance: ParsedInstance = {
				1: "example",
				_finalIvs: {},
			}

			const mappedInstance = (await modelMapper.applyClientModel(TestTypeRef, parsedInstance)) as any
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			const newParsedInstance = await modelMapper.applyServerModel(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals({
				1: "",
				_finalIvs: {},
			})
		})
		o("add ZeroOrOne Value", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)
			const parsedInstance: ParsedInstance = {
				1: "example",
				_finalIvs: {},
			}

			const mappedInstance = (await modelMapper.applyClientModel(TestTypeRef, parsedInstance)) as any
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			const newParsedInstance = await modelMapper.applyServerModel(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals({
				1: null,
				_finalIvs: {},
			})
		})
	})
	o.spec("BooleanToNumberValue", function () {
		o("convert boolean to number value", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)
			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)

			// false
			const falseParsedInstance: ParsedInstance = {
				1: "0",
				_finalIvs: {},
			}

			const falseMappedInstance = (await modelMapper.applyClientModel(TestTypeRef, falseParsedInstance)) as any
			o(falseMappedInstance).deepEquals({
				_type: TestTypeRef,
				testValue: false,
				_finalIvs: {},
			} as any)
			o(typeof falseMappedInstance._errors).equals("undefined")

			const newFalseParsedInstance = await modelMapper.applyServerModel(TestTypeRef, falseMappedInstance)
			o(newFalseParsedInstance).deepEquals({
				1: "0",
				_finalIvs: {},
			})

			// true
			const trueParsedInstance: ParsedInstance = {
				1: "anything",
				_finalIvs: {},
			}

			const trueMappedInstance = (await modelMapper.applyClientModel(TestTypeRef, trueParsedInstance)) as any
			o(trueMappedInstance).deepEquals({
				_type: TestTypeRef,
				testValue: true,
				_finalIvs: {},
			} as any)
			o(typeof trueMappedInstance._errors).equals("undefined")

			const newTrueParsedInstance = await modelMapper.applyServerModel(TestTypeRef, trueMappedInstance)
			o(newTrueParsedInstance).deepEquals({
				1: "1",
				_finalIvs: {},
			})
		})
	})
	o.spec("ChangeAssociationCardinality", function () {
		o("change aggregation from Any to One", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestAggregate",
						rootId: "SoMeId",
						since: 0,
						type: Type.Aggregated,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestAggregate",
						rootId: "SoMeId",
						since: 0,
						type: Type.Aggregated,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}

			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)
			const parsedInstance: ParsedInstance = {
				3: [
					{
						_finalIvs: {},
					} as ParsedInstance,
				],
				_finalIvs: {},
			}

			const mappedInstance = (await modelMapper.applyClientModel(TestTypeRef, parsedInstance)) as any
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

			const newParsedInstance = await modelMapper.applyServerModel(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals(parsedInstance)
		})
		o("change aggregation from One to Any null value", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestAggregate",
						rootId: "SoMeId",
						since: 0,
						type: Type.Aggregated,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestAggregate",
						rootId: "SoMeId",
						since: 0,
						type: Type.Aggregated,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}

			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)
			const parsedInstance: ParsedInstance = {
				3: [],
				_finalIvs: {},
			}
			// can't convert an empty array to one
			await assertThrows(ProgrammingError, async () => modelMapper.applyClientModel(TestTypeRef, parsedInstance))
		})
		o("change aggregation from ZeroOrOne to Any null value", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestAggregate",
						rootId: "SoMeId",
						since: 0,
						type: Type.Aggregated,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestAggregate",
						rootId: "SoMeId",
						since: 0,
						type: Type.Aggregated,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}

			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)
			const parsedInstance: ParsedInstance = {
				3: [],
				_finalIvs: {},
			}
			// can't convert an empty array to one
			const mappedInstance = await modelMapper.applyClientModel(TestTypeRef, parsedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testAggregation: null,
				_finalIvs: {},
			} as any)
			const newParsedInstance = await modelMapper.applyServerModel(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals(parsedInstance)
		})
		o("change aggregation from ZeroOrOne to Any multiple values", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestAggregate",
						rootId: "SoMeId",
						since: 0,
						type: Type.Aggregated,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestAggregate",
						rootId: "SoMeId",
						since: 0,
						type: Type.Aggregated,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}

			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)
			const parsedInstance: ParsedInstance = {
				3: [{ _finalIvs: {} } as ParsedInstance, { _finalIvs: {} } as ParsedInstance],
				_finalIvs: {},
			}
			// can't convert an array with multiple elements to ZeroOrOne
			await assertThrows(ProgrammingError, () => modelMapper.applyClientModel(TestTypeRef, parsedInstance))
		})
		o("change aggregation from Any to ZeroOrOne null value", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestAggregate",
						rootId: "SoMeId",
						since: 0,
						type: Type.Aggregated,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestAggregate",
						rootId: "SoMeId",
						since: 0,
						type: Type.Aggregated,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}

			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)
			const parsedInstance: ParsedInstance = {
				3: [],
				_finalIvs: {},
			}
			// can convert an empty array to ZeroOrOne
			const mappedInstance = await modelMapper.applyClientModel(TestTypeRef, parsedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testAggregation: [],
				_finalIvs: {},
			} as any)
			const newParsedInstance = await modelMapper.applyServerModel(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals(parsedInstance)
		})
		o("change aggregation from Any to ZeroOrOne one value", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestAggregate",
						rootId: "SoMeId",
						since: 0,
						type: Type.Aggregated,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestAggregate",
						rootId: "SoMeId",
						since: 0,
						type: Type.Aggregated,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}

			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)
			const parsedInstance: ParsedInstance = {
				3: [{ _finalIvs: {} } as ParsedInstance],
				_finalIvs: {},
			}
			// can convert an array with one element to ZeroOrOne
			const mappedInstance = await modelMapper.applyClientModel(TestTypeRef, parsedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testAggregation: [{ _type: TestAggregateRef, _finalIvs: {} } as any],
				_finalIvs: {},
			} as any)
			const newParsedInstance = await modelMapper.applyServerModel(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals(parsedInstance)
		})

		o("change list element association from Any to One", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestRef",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestRef",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}

			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)
			const parsedInstance: ParsedInstance = {
				3: [["listId", "listElementId"]],
				_finalIvs: {},
			}

			const mappedInstance = (await modelMapper.applyClientModel(TestTypeRef, parsedInstance)) as any
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testListElementAssociation: [["listId", "listElementId"]],
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			const newParsedInstance = await modelMapper.applyServerModel(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals(parsedInstance)
		})
		o("change list element association from One to Any null value", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestRef",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestRef",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}

			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)
			const parsedInstance: ParsedInstance = {
				3: [],
				_finalIvs: {},
			}
			// can't convert an empty array to one
			await assertThrows(ProgrammingError, async () => modelMapper.applyClientModel(TestTypeRef, parsedInstance))
		})
		o("change list element association from ZeroOrOne to Any null value", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestRef",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestRef",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}

			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)
			const parsedInstance: ParsedInstance = {
				3: [],
				_finalIvs: {},
			}
			// can't convert an empty array to one
			const mappedInstance = await modelMapper.applyClientModel(TestTypeRef, parsedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testListElementAssociation: null,
				_finalIvs: {},
			} as any)
			const newParsedInstance = await modelMapper.applyServerModel(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals(parsedInstance)
		})
		o("change list element association from ZeroOrOne to Any multiple values", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestRef",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestRef",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}

			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)
			const parsedInstance: ParsedInstance = {
				3: [
					["listId", "listElementId1"],
					["listId", "listElementId2"],
				],
				_finalIvs: {},
			}
			// can't convert an array with multiple elements to ZeroOrOne
			await assertThrows(ProgrammingError, () => modelMapper.applyClientModel(TestTypeRef, parsedInstance))
		})
		o("change list element association from Any to ZeroOrOne null value", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestRef",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestRef",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}

			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)
			const parsedInstance: ParsedInstance = {
				3: [],
				_finalIvs: {},
			}
			// can convert an empty array to ZeroOrOne
			const mappedInstance = await modelMapper.applyClientModel(TestTypeRef, parsedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testListElementAssociation: [],
				_finalIvs: {},
			} as any)
			const newParsedInstance = await modelMapper.applyServerModel(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals(parsedInstance)
		})
		o("change list element association from Any to ZeroOrOne one value", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestRef",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestRef",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}

			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)
			const parsedInstance: ParsedInstance = {
				3: [["listId", "listElementId"]],
				_finalIvs: {},
			}
			// can convert an array with one element to ZeroOrOne
			const mappedInstance = await modelMapper.applyClientModel(TestTypeRef, parsedInstance)
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testListElementAssociation: [["listId", "listElementId"]],
				_finalIvs: {},
			} as any)
			const newParsedInstance = await modelMapper.applyServerModel(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals(parsedInstance)
		})
	})
	o.spec("ChangeValueCardinality", function () {
		o("change value from ZeroOrOne to One", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)
			const parsedInstance: ParsedInstance = {
				1: "example",
				_finalIvs: {},
			}

			const mappedInstance = (await modelMapper.applyClientModel(TestTypeRef, parsedInstance)) as any
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testValue: "example",
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			const newParsedInstance = await modelMapper.applyServerModel(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals({
				1: "example",
				_finalIvs: {},
			})
		})
		o("change value from One to ZeroOrOne", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)
			const parsedInstance: ParsedInstance = {
				1: "example",
				_finalIvs: {},
			}

			const mappedInstance = (await modelMapper.applyClientModel(TestTypeRef, parsedInstance)) as any
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testValue: "example",
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			const newParsedInstance = await modelMapper.applyServerModel(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals({
				1: "example",
				_finalIvs: {},
			})
		})
		o("change value from One to ZeroOrOne null value throws", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)
			const parsedInstance: ParsedInstance = {
				1: null,
				_finalIvs: {},
			}

			await assertThrows(ProgrammingError, () => modelMapper.applyClientModel(TestTypeRef, parsedInstance))
		})
	})
	o.spec("NumberToStringValue", function () {
		o("convert number to string value", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)
			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)

			const parsedInstance: ParsedInstance = {
				1: "42",
				_finalIvs: {},
			}

			const mappedInstance = (await modelMapper.applyClientModel(TestTypeRef, parsedInstance)) as any
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testValue: 42,
				_finalIvs: {},
			} as any)
			o(typeof parsedInstance._errors).equals("undefined")

			const newParsedInstance = await modelMapper.applyServerModel(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals({
				1: "42",
				_finalIvs: {},
			})
		})
		o("convert number to string value throws when server sends non numeric", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)
			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)

			const wrongParsedInstance: ParsedInstance = {
				1: "example",
				_finalIvs: {},
			}

			await assertThrows(ProgrammingError, () => modelMapper.applyClientModel(TestTypeRef, wrongParsedInstance))
		})
	})
	o.spec("RemoveAssociation", function () {
		o("remove One aggregation", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestAggregate",
						rootId: "SoMeId",
						since: 0,
						type: Type.Aggregated,
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
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)
			const parsedInstance: ParsedInstance = {
				_finalIvs: {},
			}
			// can't create the instance since One aggregation is removed
			await assertThrows(ProgrammingError, () => modelMapper.applyClientModel(TestTypeRef, parsedInstance))
		})
		o("remove ZeroOrOne aggregation", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestAggregate",
						rootId: "SoMeId",
						since: 0,
						type: Type.Aggregated,
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
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)
			const parsedInstance: ParsedInstance = {
				_finalIvs: {},
			}

			// can remove aggregation with ZeroOrOne cardinality and supply null
			const mappedInstance = (await modelMapper.applyClientModel(TestTypeRef, parsedInstance)) as any
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testAssociation: null,
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			const newParsedInstance = await modelMapper.applyServerModel(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals(parsedInstance)
		})
		o("remove Any aggregation", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestAggregate",
						rootId: "SoMeId",
						since: 0,
						type: Type.Aggregated,
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
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)
			const parsedInstance: ParsedInstance = {
				_finalIvs: {},
			}

			// can remove association with Any cardinality and supply []
			const mappedInstance = (await modelMapper.applyClientModel(TestTypeRef, parsedInstance)) as any
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testAssociation: [],
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			const newParsedInstance = await modelMapper.applyServerModel(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals(parsedInstance)
		})

		o("remove One list element association", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestRef",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)
			const parsedInstance: ParsedInstance = {
				_finalIvs: {},
			}
			// can't create the instance since One association is removed
			await assertThrows(ProgrammingError, () => modelMapper.applyClientModel(TestTypeRef, parsedInstance))
		})
		o("remove ZeroOrOne list element association", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestRef",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)
			const parsedInstance: ParsedInstance = {
				_finalIvs: {},
			}

			// can remove association with ZeroOrOne and supply null
			const mappedInstance = (await modelMapper.applyClientModel(TestTypeRef, parsedInstance)) as any
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testListElementAssociation: null,
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			const newParsedInstance = await modelMapper.applyServerModel(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals({
				_finalIvs: {},
			})
		})
		o("remove Any list element association", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
					"43": {
						app: "tutanota",
						encrypted: true,
						id: 43,
						name: "TestAggregate",
						rootId: "SoMeId",
						since: 0,
						type: Type.Aggregated,
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
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)
			const parsedInstance: ParsedInstance = {
				_finalIvs: {},
			}

			// can remove association with Any cardinality and supply []
			const mappedInstance = (await modelMapper.applyClientModel(TestTypeRef, parsedInstance)) as any
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testListElementAssociation: [],
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			const newParsedInstance = await modelMapper.applyServerModel(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals({
				_finalIvs: {},
			})
		})
	})
	o.spec("RemoveValue", function () {
		o("Remove One Value", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)
			const parsedInstance: ParsedInstance = {
				_finalIvs: {},
			}

			const mappedInstance = (await modelMapper.applyClientModel(TestTypeRef, parsedInstance)) as any
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testValue: "",
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			const newParsedInstance = await modelMapper.applyServerModel(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals({
				_finalIvs: {},
			})
		})
		o("remove ZeroOrOne Value", async function () {
			const serverModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const serverModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
						values: {},
						associations: {},
						version: "0",
						versioned: false,
					},
				}
				return serverModel[typeRef.typeId]
			}

			const clientModelResolver = async (typeRef: TypeRef<any>): Promise<TypeModel> => {
				const clientModel: Record<string, TypeModel> = {
					"42": {
						app: "tutanota",
						encrypted: true,
						id: 42,
						name: "TestType",
						rootId: "SoMeId",
						since: 0,
						type: Type.ListElement,
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
						version: "0",
						versioned: false,
					},
				}
				return clientModel[typeRef.typeId]
			}
			const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)

			const modelMapper: ModelMapper = new ModelMapper(serverModelResolver, clientModelResolver)
			const parsedInstance: ParsedInstance = {
				_finalIvs: {},
			}

			const mappedInstance = (await modelMapper.applyClientModel(TestTypeRef, parsedInstance)) as any
			o(mappedInstance).deepEquals({
				_type: TestTypeRef,
				testValue: null,
				_finalIvs: {},
			} as any)
			o(typeof mappedInstance._errors).equals("undefined")

			const newParsedInstance = await modelMapper.applyServerModel(TestTypeRef, mappedInstance)
			o(newParsedInstance).deepEquals({
				_finalIvs: {},
			})
		})
	})
})
