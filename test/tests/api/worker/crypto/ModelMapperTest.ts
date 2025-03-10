import o from "@tutao/otest"
import { random } from "@tutao/tutanota-crypto"
import {
	assertAndSupplyCorrectAssociationClientCardinality,
	assertCorrectValueCardinality,
	convertDbToJsType,
	convertJsToDbType,
	isDefaultValue,
	ModelMapper,
	valueToDefault,
} from "../../../../../src/common/api/worker/crypto/ModelMapper.js"
import { AssociationType, Cardinality, ValueType } from "../../../../../src/common/api/common/EntityConstants.js"
import { assertNotNull, downcast, uint8ArrayToBase64 } from "@tutao/tutanota-utils"
import { dummyResolver, TestAggregate, TestAggregateRef, TestEntity, TestTypeRef } from "./InstancePipelineTestUtils"
import { ClientModelParsedInstance, ModelAssociation, ServerModelParsedInstance } from "../../../../../src/common/api/common/EntityTypes"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { ProgrammingError } from "../../../../../src/common/api/common/error/ProgrammingError"
import { TypeReferenceResolver } from "../../../../../src/common/api/common/EntityFunctions"

o.spec("ModelMapper", function () {
	const modelMapper: ModelMapper = new ModelMapper(dummyResolver as TypeReferenceResolver, dummyResolver as TypeReferenceResolver)

	o.spec("convertDbToJsType", function () {
		o("convert value to JS Date", function () {
			let value = new Date().getTime().toString()
			o(convertDbToJsType(ValueType.Date, value)).deepEquals(new Date(parseInt(value)))
		})
		o("convert unencrypted Bytes to JS type", function () {
			const valueBytes = random.generateRandomData(15)
			const value = uint8ArrayToBase64(valueBytes)
			const jsBytes = convertDbToJsType(ValueType.Bytes, value)
			o(jsBytes instanceof Uint8Array).equals(true)
			o(Array.from(jsBytes as Uint8Array)).deepEquals(Array.from(valueBytes))
		})
		o("convert unencrypted Boolean to JS type", function () {
			o(convertDbToJsType(ValueType.Boolean, "0")).equals(false)
			o(convertDbToJsType(ValueType.Boolean, "1")).equals(true)
		})
		o("convert unencrypted Number to JS type", function () {
			o(convertDbToJsType(ValueType.Number, "0")).equals("0")
			o(convertDbToJsType(ValueType.Number, "1")).equals("1")
			o(convertDbToJsType(ValueType.Number, "12456")).equals("12456")
		})
		o("convert unencrypted compressedString to JS type", function () {
			o(convertDbToJsType(ValueType.CompressedString, "")).equals("")
			o(convertDbToJsType(ValueType.CompressedString, "QHRlc3Q=")).equals("test")
		})
	})
	o.spec("convertJsToDbType", function () {
		o("convert unencrypted Date to DB type", function () {
			let value = new Date()
			o(convertJsToDbType(ValueType.Date, value)).equals(value.getTime().toString())
		})

		o("convert unencrypted Bytes to DB type", function () {
			let valueBytes = random.generateRandomData(15)
			const dbBytes = convertJsToDbType(ValueType.Bytes, valueBytes)
			o(dbBytes instanceof Uint8Array).equals(true)
			o(uint8ArrayToBase64(dbBytes as Uint8Array)).equals(uint8ArrayToBase64(valueBytes))
		})

		o("convert unencrypted Boolean to DB type", function () {
			let value = false
			o(convertJsToDbType(ValueType.Boolean, value)).equals("0")
			value = true
			o(convertJsToDbType(ValueType.Boolean, value)).equals("1")
		})

		o("convert unencrypted Number to DB type", function () {
			let value = "0"
			o(convertJsToDbType(ValueType.Number, value)).equals("0")
			value = "1"
			o(convertJsToDbType(ValueType.Number, value)).equals("1")
		})
	})

	o.spec("mapToInstance", function () {
		o("happy path", async function () {
			const parsedInstance: ServerModelParsedInstance = {
				1: "some encrypted string",
				5: new Date("2025-01-01T13:00:00.000Z"),
				3: [{ 2: "123", 6: "123456", _finalIvs: {} } as unknown as ServerModelParsedInstance],
				4: ["associatedListId"],
				7: true,
				8: [["listId", "listElementId"]],
				_finalIvs: {},
			} as unknown as ServerModelParsedInstance
			const mappedInstance = (await modelMapper.mapToInstance(TestTypeRef, parsedInstance)) as any

			o(mappedInstance._type).deepEquals(TestTypeRef)
			o(mappedInstance.testValue).equals("some encrypted string")
			o(mappedInstance.testBoolean).equals(true)
			o(mappedInstance.testDate.toISOString()).equals("2025-01-01T13:00:00.000Z")
			o(mappedInstance.testAssociation).deepEquals({
				_type: TestAggregateRef,
				_finalIvs: {},
				testNumber: "123",
				_id: "123456",
			})
			o(mappedInstance.testListAssociation).equals("associatedListId")
			o(mappedInstance.testListElementAssociation).deepEquals(["listId", "listElementId"])
			o(mappedInstance._finalIvs).deepEquals(parsedInstance._finalIvs)
			o(typeof mappedInstance._errors).equals("undefined")
		})
		o("wrong cardinality on value field throws", async function () {
			const parsedInstance: ServerModelParsedInstance = {
				1: null,
				5: new Date("2025-01-01T13:00:00.000Z"),
				3: [{ 2: "123", 6: "123456", _finalIvs: {} } as unknown as ServerModelParsedInstance],
				4: ["associatedListId"],
				7: true,
				_finalIvs: {},
			} as unknown as ServerModelParsedInstance
			await assertThrows(ProgrammingError, async () => modelMapper.mapToInstance(TestTypeRef, parsedInstance))
		})
		o("wrong aggregation cardinality throws", async function () {
			const parsedInstance: ServerModelParsedInstance = {
				1: "some encrypted string",
				5: new Date("2025-01-01T13:00:00.000Z"),
				3: [],
				4: ["associatedListId"],
				7: true,
				_finalIvs: {},
			} as unknown as ServerModelParsedInstance
			await assertThrows(ProgrammingError, async () => modelMapper.mapToInstance(TestTypeRef, parsedInstance))
		})
		o("wrong reference cardinality throws", async function () {
			const parsedInstance: ServerModelParsedInstance = {
				1: "some encrypted string",
				5: new Date("2025-01-01T13:00:00.000Z"),
				3: [{ 2: "123", 6: "123456", _finalIvs: {} } as unknown as ServerModelParsedInstance],
				4: [],
				7: true,
				_finalIvs: {},
			} as unknown as ServerModelParsedInstance
			await assertThrows(ProgrammingError, async () => modelMapper.mapToInstance(TestTypeRef, parsedInstance))
		})
	})
	o.spec("mapToClientModelParsedInstance", function () {
		o("happy path debug", async function () {
			const instance: TestEntity = {
				_type: TestTypeRef,
				_finalIvs: {},
				testAssociation: {
					_type: TestAggregateRef,
					_finalIvs: {},
					testNumber: "123456",
				} as TestAggregate,
				testBoolean: false,
				testDate: new Date("2025-01-01T13:00:00.000Z"),
				testListAssociation: "associatedListId",
				testListElementAssociation: ["listId", "listElementId"],
				testValue: "some encrypted string",
			}
			const parsedInstance: ClientModelParsedInstance = await modelMapper.mapToClientModelParsedInstance(TestTypeRef, instance)

			o(parsedInstance[1]).equals("some encrypted string")
			o(parsedInstance[7]).equals(false)
			o((parsedInstance[5] as Date).toISOString()).equals("2025-01-01T13:00:00.000Z")
			const testAssociation = assertNotNull(parsedInstance[3])[0]
			o(testAssociation[2]).equals("123456")
			o(testAssociation[6].length).deepEquals(6) // custom generated id
			o(testAssociation._finalIvs).deepEquals({})
			o(parsedInstance[4]).deepEquals(["associatedListId"])
			o(parsedInstance._finalIvs).deepEquals(instance._finalIvs!)
			o(typeof parsedInstance._errors).equals("undefined")
		})
	})
	o.spec("default value mappings", function () {
		o("valueToDefault and isDefaultValue are compatible", async function () {
			const types = JSON.parse(JSON.stringify(ValueType))
			delete types.GeneratedId
			delete types.CustomId
			for (const valueType of Object.values(types as typeof ValueType)) {
				o(isDefaultValue(valueType, valueToDefault(valueType))).equals(true)
			}

			await assertThrows(ProgrammingError, async () => valueToDefault(ValueType.GeneratedId))
			await assertThrows(ProgrammingError, async () => valueToDefault(ValueType.CustomId))
			await assertThrows(ProgrammingError, async () => isDefaultValue(ValueType.GeneratedId, ""))
			await assertThrows(ProgrammingError, async () => isDefaultValue(ValueType.CustomId, ""))
		})
	})
	o.spec("cardinality assertions", function () {
		o("assertCorrectAssociationClientCardinality", async function () {
			const f = (type, cardinality, value) =>
				assertAndSupplyCorrectAssociationClientCardinality(
					TestTypeRef,
					"1",
					downcast<ModelAssociation>({
						type,
						cardinality,
					}),
					value,
				)
			o(f(AssociationType.ListAssociation, Cardinality.One, ["v"])).deepEquals("v")
			o(f(AssociationType.ListAssociation, Cardinality.ZeroOrOne, ["v"])).deepEquals("v")
			o(f(AssociationType.ListAssociation, Cardinality.ZeroOrOne, [])).deepEquals(null)
			o(f(AssociationType.ListAssociation, Cardinality.Any, ["v"])).deepEquals(["v"])
			o(f(AssociationType.ListAssociation, Cardinality.Any, ["v", "v2"])).deepEquals(["v", "v2"])
			o(f(AssociationType.ListElementAssociationGenerated, Cardinality.ZeroOrOne, [["listId", "listElementId"]])).deepEquals(["listId", "listElementId"])
			o(f(AssociationType.ListElementAssociationGenerated, Cardinality.One, [["listId", "listElementId"]])).deepEquals(["listId", "listElementId"])
			o(f(AssociationType.ListElementAssociationGenerated, Cardinality.Any, [["listId", "listElementId"]])).deepEquals([["listId", "listElementId"]])
			o(f(AssociationType.ListElementAssociationGenerated, Cardinality.Any, [])).deepEquals([])

			await assertThrows(ProgrammingError, async () => f(AssociationType.ListElementAssociationGenerated, Cardinality.One, ["v", "v1", "v2"]))
			await assertThrows(ProgrammingError, async () => f(AssociationType.ListElementAssociationGenerated, Cardinality.ZeroOrOne, ["v", "v1", "v2"]))
			await assertThrows(ProgrammingError, async () => f(AssociationType.ListAssociation, Cardinality.One, []))
			await assertThrows(ProgrammingError, async () => f(AssociationType.ListAssociation, Cardinality.One, ["v", "v2"]))
			await assertThrows(ProgrammingError, async () => f(AssociationType.ListAssociation, Cardinality.ZeroOrOne, ["v", "v2"]))
		})

		o("assertCorrectValueCardinality", async function () {
			const f = (card, value) => assertCorrectValueCardinality(TestTypeRef, "1", card, value)
			o(f(Cardinality.One, "v")).deepEquals("v")
			o(f(Cardinality.ZeroOrOne, "v")).deepEquals("v")
			o(f(Cardinality.ZeroOrOne, null)).deepEquals(null)

			await assertThrows(ProgrammingError, async () => f(Cardinality.One, null))
			await assertThrows(ProgrammingError, async () => f(Cardinality.Any, null))
			await assertThrows(ProgrammingError, async () => f(Cardinality.Any, "v"))
		})
	})
})
