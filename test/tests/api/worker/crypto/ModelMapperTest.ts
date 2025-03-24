import o from "@tutao/otest"
import { random } from "@tutao/tutanota-crypto"
import {
	assertCorrectAssociationClientCardinality,
	assertCorrectAssociationServerCardinality,
	assertCorrectValueCardinality,
	convertDbToJsType,
	convertJsToDbType,
	isDefaultValue,
	ModelMapper,
	valueToDefault,
} from "../../../../../src/common/api/worker/crypto/ModelMapper.js"
import { Cardinality, ValueType } from "../../../../../src/common/api/common/EntityConstants.js"
import { downcast, uint8ArrayToBase64 } from "@tutao/tutanota-utils"
import { dummyResolver, TestAggregateRef, TestEntity, testTypeModel, TestTypeRef } from "./InstancePipelineTestUtils"
import { ParsedInstance } from "../../../../../src/common/api/common/EntityTypes"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { ProgrammingError } from "../../../../../src/common/api/common/error/ProgrammingError"

o.spec("ModelMapper", function () {
	const modelMapper: ModelMapper = new ModelMapper(dummyResolver, dummyResolver)

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

	o.spec("applyClientModel", function () {
		o("happy path", async function () {
			const parsedInstance: ParsedInstance = {
				1: "some encrypted string",
				5: new Date("2025-01-01T13:00:00.000Z"),
				3: [{ 2: "123", 6: "123456", _finalIvs: {} } as ParsedInstance],
				4: ["associatedListId"],
				7: true,
				_finalIvs: {},
			}
			const mappedInstance = (await modelMapper.applyClientModel(TestTypeRef, parsedInstance)) as any

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
			o(mappedInstance._finalIvs).deepEquals(parsedInstance._finalIvs)
			o(typeof mappedInstance._errors).equals("undefined")
		})
		o("wrong cardinality on value field throws", async function () {
			const parsedInstance: ParsedInstance = {
				1: null,
				5: new Date("2025-01-01T13:00:00.000Z"),
				3: [{ 2: "123", 6: "123456", _finalIvs: {} } as ParsedInstance],
				4: ["associatedListId"],
				7: true,
				_finalIvs: {},
			}
			await assertThrows(ProgrammingError, async () => modelMapper.applyClientModel(TestTypeRef, parsedInstance))
		})
		o("wrong aggregation cardinality throws", async function () {
			const parsedInstance: ParsedInstance = {
				1: "some encrypted string",
				5: new Date("2025-01-01T13:00:00.000Z"),
				3: [],
				4: ["associatedListId"],
				7: true,
				_finalIvs: {},
			}
			await assertThrows(ProgrammingError, async () => modelMapper.applyClientModel(TestTypeRef, parsedInstance))
		})
		o("wrong reference cardinality throws", async function () {
			const parsedInstance: ParsedInstance = {
				1: "some encrypted string",
				5: new Date("2025-01-01T13:00:00.000Z"),
				3: [{ 2: "123", 6: "123456", _finalIvs: {} } as ParsedInstance],
				4: [],
				7: true,
				_finalIvs: {},
			}
			await assertThrows(ProgrammingError, async () => modelMapper.applyClientModel(TestTypeRef, parsedInstance))
		})
	})
	o.spec("applyServerModel", function () {
		o("happy path", async function () {
			const instance: TestEntity = {
				_type: TestTypeRef,
				_finalIvs: {},
				testAssociation: {
					_type: TestAggregateRef,
					_finalIvs: {},
					_id: "someCustomId",
					testNumber: "123456",
				},
				testBoolean: false,
				testDate: new Date("2025-01-01T13:00:00.000Z"),
				testListAssociation: "associatedListId",
				testValue: "some encrypted string",
			}
			const serverInstance: ParsedInstance = await modelMapper.applyServerModel(TestTypeRef, instance)

			o(serverInstance[1]).equals("some encrypted string")
			o(serverInstance[7]).equals(false)
			o((serverInstance[5] as Date).toISOString()).equals("2025-01-01T13:00:00.000Z")
			o(serverInstance[3]).deepEquals([
				{
					_finalIvs: {},
					2: "123456",
					6: "someCustomId",
				} as ParsedInstance,
			])
			o(serverInstance[4]).deepEquals(["associatedListId"])
			o(serverInstance._finalIvs).deepEquals(instance._finalIvs!)
			o(typeof serverInstance._errors).equals("undefined")
		})

		o("default values are assigned", async function () {
			const instance: TestEntity = {
				_type: TestTypeRef,
				_finalIvs: {},
				testAssociation: {
					_type: TestAggregateRef,
					_finalIvs: {},
					_id: "someCustomId",
					testNumber: "123456",
				},
				testBoolean: false,
				testDate: new Date("2025-01-01T13:00:00.000Z"),
				testListAssociation: "associatedListId",
				testValue: downcast<string>(null),
			}
			const serverInstance: ParsedInstance = await modelMapper.applyServerModel(TestTypeRef, instance)
			o(serverInstance[1]).equals(valueToDefault(testTypeModel.values["1"].type))
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
			const f = (card, value) => assertCorrectAssociationClientCardinality(TestTypeRef, "1", card, value)
			o(f(Cardinality.One, ["v"])).deepEquals("v")
			o(f(Cardinality.ZeroOrOne, ["v"])).deepEquals("v")
			o(f(Cardinality.ZeroOrOne, [])).deepEquals(null)
			o(f(Cardinality.Any, ["v"])).deepEquals(["v"])
			o(f(Cardinality.Any, ["v", "v2"])).deepEquals(["v", "v2"])

			await assertThrows(ProgrammingError, async () => f(Cardinality.One, []))
			await assertThrows(ProgrammingError, async () => f(Cardinality.One, ["v", "v2"]))
			await assertThrows(ProgrammingError, async () => f(Cardinality.ZeroOrOne, ["v", "v2"]))
		})

		o("assertCorrectAssociationServerCardinality", async function () {
			const f = (card, value) => assertCorrectAssociationServerCardinality(TestTypeRef, "1", card, value)
			o(f(Cardinality.One, "v")).deepEquals(["v"])
			o(f(Cardinality.ZeroOrOne, "v")).deepEquals(["v"])
			o(f(Cardinality.ZeroOrOne, null)).deepEquals([])
			o(f(Cardinality.Any, ["v"])).deepEquals(["v"])
			o(f(Cardinality.Any, [])).deepEquals([])
			o(f(Cardinality.Any, ["v", "v2"])).deepEquals(["v", "v2"])

			await assertThrows(ProgrammingError, async () => f(Cardinality.One, null))
			await assertThrows(ProgrammingError, async () => f(Cardinality.One, ["v"]))
			await assertThrows(ProgrammingError, async () => f(Cardinality.One, ["v", "v2"]))
			await assertThrows(ProgrammingError, async () => f(Cardinality.ZeroOrOne, ["v"]))
			await assertThrows(ProgrammingError, async () => f(Cardinality.ZeroOrOne, []))
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
