import o, { assertThrows } from "@tutao/otest"
import { ClientEntity, DecryptedParsedInstance, ModelMapper, OutgoingClientEntity, TypeModelResolver } from "../../../src/platform-kit/instance-pipeline"
import {
	AssociationTypeEnum,
	CardinalityEnum,
	ClientTypeModel,
	DEFAULT_ENTITY_FIELDS,
	Entity,
	EntityTypeEnum,
	ModelAssociation,
	ModelValue,
	ServerTypeModel,
	TypeModel,
	TypeRef,
	ValueTypeEnum,
} from "../../../src/platform-kit/meta"
import {
	createEncryptedValueType,
	DummyTypeModelResolver,
	testAggregateModel,
	TestAggregateRef,
	TestEntity,
	testTypeModel,
	TestTypeRef,
} from "./InstancePipelineTestUtils"
import { InvalidModelError, ProgrammingError } from "../../../src/platform-kit/app-env"
import { createTestEntityWithDummyResolver, removeOriginals } from "../TestUtils"
import { assertNotNull } from "../../../src/platform-kit/utils"
import { ParsedValue } from "../../../src/platform-kit/instance-pipeline/ParsedValue"
import { random } from "../../../src/platform-kit/crypto"

o.spec("ModelMapperTest", function () {
	let modelMapper: ModelMapper
	let decryptedParsedInstance: DecryptedParsedInstance
	let instance: TestEntity

	o.beforeEach(async () => {
		modelMapper = new ModelMapper(new DummyTypeModelResolver() as TypeModelResolver)

		instance = await createTestEntityWithDummyResolver(TestTypeRef, {
			testAssociation: [
				await createTestEntityWithDummyResolver(TestAggregateRef, {
					_id: null!,
					testNumber: "123456",
					testSecondLevelAssociation: [],
					testZeroOrOneAggregation: null,
				}),
			],
			_kdfNonce: null,
			_ownerEncSessionKey: null,
			testValueZeroOrOne: null,
			testBoolean: false,
			testDate: new Date("2025-01-01T13:00:00.000Z"),
			testElementAssociation: "associatedElementId",
			testListElementAssociation: [["listId", "listElementId"]],
			testZeroOrOneListElementAssociation: null,
			testValue: "some encrypted string",
			testGeneratedId: "generatedId",
			_id: ["listId", "listElementId"],
			testFinalBoolean: false,
		})
		decryptedParsedInstance = DecryptedParsedInstance.incomingFromServer(testTypeModel as ServerTypeModel)
			.addAttributeById(1, ParsedValue.fromString("some encrypted string"))
			.addAttributeById(7, ParsedValue.fromString("1"))
			.addAttributeById(15, ParsedValue.fromString("1"))
			.addAttributeById(16, ParsedValue.fromByteArray(random.generateRandomData(10)))
			.addAttributeById(2, ParsedValue.fromNull())
			.addAttributeById(14, ParsedValue.fromNull())
			.addAttributeById(5, ParsedValue.fromString(new Date("2025-01-01T13:00:00.000Z").getTime().toString()))
			.addAttributeById(12, ParsedValue.fromId("generatedId"))
			.addAttributeById(13, ParsedValue.fromIdTuple(["listId", "elementId"]))
			.addAttributeById(4, ParsedValue.fromIdList(["associatedElementId"]))
			.addAttributeById(8, ParsedValue.fromIdTupleList([["listId", "listElementId"]]))
			.addAttributeById(17, ParsedValue.fromIdList([]))
			.addAttributeById(
				3,
				ParsedValue.fromNestedItems([
					DecryptedParsedInstance.incomingFromServer(testAggregateModel as ServerTypeModel)
						.addAttributeById(2, ParsedValue.fromString("123"))
						.addAttributeById(6, ParsedValue.fromId("some id"))
						.addAttributeById(9, ParsedValue.fromIdList([]))
						.addAttributeById(10, ParsedValue.fromIdList([])),
				]),
			)
	})

	o.spec("mapToInstance", function () {
		o("happy path", async function () {
			const mappedEntity = await modelMapper.mapToInstance(decryptedParsedInstance)
			removeOriginals(mappedEntity)

			const mappedInstance = mappedEntity as any
			o(mappedInstance._type).deepEquals(TestTypeRef)
			o(mappedInstance._id).deepEquals(["listId", "elementId"])
			o(mappedInstance.testValue).equals("some encrypted string")
			o(mappedInstance.testBoolean).equals(true)
			o(mappedInstance.testDate.toISOString()).equals("2025-01-01T13:00:00.000Z")
			o(mappedInstance.testAssociation[0]).deepEquals({
				_type: TestAggregateRef,
				testNumber: "123",
				_id: "some id",
				testSecondLevelAssociation: [],
				testZeroOrOneAggregation: null,
				...DEFAULT_ENTITY_FIELDS,
			})
			o(mappedInstance.testElementAssociation).equals("associatedElementId")
			o(mappedInstance.testGeneratedId).equals("generatedId")
			o(mappedInstance.testListElementAssociation).deepEquals([["listId", "listElementId"]])
			o(typeof mappedInstance._errors).equals("undefined")
		})

		o("if server cardinality is One, puts default value", async function () {
			decryptedParsedInstance.addAttributeById(1, ParsedValue.fromNull())

			const result = (await modelMapper.mapToInstance(decryptedParsedInstance)) as any
			o(result.testValue).deepEquals("")
		})

		o("wrong cardinality on value field throws", async function () {
			const serverModel = structuredClone(decryptedParsedInstance.typeModel)
			serverModel.values["1"].cardinality = CardinalityEnum.ZeroOrOne
			;(decryptedParsedInstance as any).typeModel = serverModel

			decryptedParsedInstance.addAttributeById(1, ParsedValue.fromNull())
			const err = await assertThrows(InvalidModelError, async () => modelMapper.mapToInstance(decryptedParsedInstance))
			o(err.message).equals(`Expected non-null value for attribute with One cardinality. ${TestTypeRef.toString()}/testValue`)
		})

		o("mapToInstances maps every parsed instance", async function () {
			const result = await modelMapper.mapToInstances<TestEntity>([decryptedParsedInstance, decryptedParsedInstance])

			o(result.length).equals(2)
			o(result[0] === result[1]).equals(false)
			o(result[0].testValue).equals("some encrypted string")
			o(result[1].testValue).equals("some encrypted string")
		})

		o("mapToInstances returns an empty array for no input", async function () {
			o(await modelMapper.mapToInstances([])).deepEquals([])
		})

		o("decryption errors of the parsed instance are copied to _errors", async function () {
			decryptedParsedInstance.addErrorByAttributeId(1, "could not decrypt")

			const result = (await modelMapper.mapToInstance(decryptedParsedInstance)) as any

			o(result._errors).deepEquals({ "1": "could not decrypt" })
		})

		o("_original is a snapshot of the mapped entity without its own _original", async function () {
			const result = await modelMapper.mapToInstance<TestEntity>(decryptedParsedInstance)

			const original = assertNotNull(result._original)
			o(original._original).equals(null)
			o(original.testValue).equals("some encrypted string")
			// aggregates carry their own _original as well and it is part of the snapshot
			o(result.testAssociation[0]._original).notEquals(null)
			o(original.testAssociation[0]._original).notEquals(null)

			result.testValue = "changed"
			result.testAssociation[0].testNumber = "999"
			o(original.testValue).equals("some encrypted string")
			o(original.testAssociation[0].testNumber).equals("123")
		})

		o("wrong association cardinality throws xyz", async function () {
			decryptedParsedInstance.addAttributeById(4, ParsedValue.fromIdList(["some-id", "another-id-should-not-be-here-when-cardinality-is-zero-one"]))

			const err = await assertThrows(InvalidModelError, async () => modelMapper.mapToInstance(decryptedParsedInstance))
			o(err.message).equals("Cardinality ZeroOrOne can hold at max one item. Found: 2")
		})
	})

	o.spec("mapToClientModelParsedInstance", function () {
		o("happy path debug", async function () {
			const resultingParsedInstance = await modelMapper.mapToDecryptedInstance(instance)

			o(resultingParsedInstance.getAttributeById(1).asString()).equals("some encrypted string")
			o(resultingParsedInstance.getAttributeById(7).asBoolean()).equals(false)
			o(resultingParsedInstance.getAttributeById(5).asDate().toISOString()).equals("2025-01-01T13:00:00.000Z")
			const testAssociation = resultingParsedInstance.getAttributeById(3).asNestedObjList()[0]
			o(testAssociation.getAttributeById(2).asString()).equals("123456")
			// aggregate _id is randomly generated if not found
			o(testAssociation.getAttributeById(6).asString().length).deepEquals(6)
			o(resultingParsedInstance.getAttributeById(4).asIdList()).deepEquals(["associatedElementId"])
			o(resultingParsedInstance.hasError()).equals(false)
		})
	})

	o.spec("cardinality assertions", function () {
		o("assertCorrectAssociationClientCardinality", async function () {
			const f = (cardinality, value) => {
				const rec = {}

				const stubTypeModel = {
					associations: {
						"1": {
							name: "res",
							cardinality,
						} as ModelAssociation,
					},
				} as unknown as TypeModel
				const r = new ClientEntity(stubTypeModel as ClientTypeModel, rec)
				r.setAssociationForTest(1, value)
				return rec["res"]
			}

			o(f(CardinalityEnum.One, ["v"])).deepEquals("v")
			o(f(CardinalityEnum.ZeroOrOne, ["v"])).deepEquals("v")
			o(f(CardinalityEnum.ZeroOrOne, [])).deepEquals(null)
			o(f(CardinalityEnum.Any, ["v"])).deepEquals(["v"])
			o(f(CardinalityEnum.Any, ["v", "v2"])).deepEquals(["v", "v2"])
			o(f(CardinalityEnum.ZeroOrOne, [["listId", "listElementId"]])).deepEquals(["listId", "listElementId"])
			o(f(CardinalityEnum.One, [["listId", "listElementId"]])).deepEquals(["listId", "listElementId"])
			o(f(CardinalityEnum.Any, [["listId", "listElementId"]])).deepEquals([["listId", "listElementId"]])
			o(f(CardinalityEnum.Any, [])).deepEquals([])

			await assertThrows(InvalidModelError, async () => f(CardinalityEnum.One, ["v", "v1", "v2"]))
			await assertThrows(InvalidModelError, async () => f(CardinalityEnum.ZeroOrOne, ["v", "v1", "v2"]))
			await assertThrows(InvalidModelError, async () => f(CardinalityEnum.One, []))
			await assertThrows(InvalidModelError, async () => f(CardinalityEnum.One, ["v", "v2"]))
			await assertThrows(InvalidModelError, async () => f(CardinalityEnum.ZeroOrOne, ["v", "v2"]))
		})

		o("assertCorrectValueCardinality", async function () {
			const cardinalityOne = createEncryptedValueType(ValueTypeEnum.String, CardinalityEnum.One)
			const cardinalityZeroOrOne = createEncryptedValueType(ValueTypeEnum.String, CardinalityEnum.ZeroOrOne)
			const cardinalityAny = createEncryptedValueType(ValueTypeEnum.String, CardinalityEnum.Any)

			o(modelMapper.assertCorrectValueCardinality(TestTypeRef, cardinalityOne, cardinalityOne, ParsedValue.fromString("v"))).deepEquals(
				ParsedValue.fromString("v"),
			)
			o(modelMapper.assertCorrectValueCardinality(TestTypeRef, cardinalityZeroOrOne, cardinalityZeroOrOne, ParsedValue.fromString("v"))).deepEquals(
				ParsedValue.fromString("v"),
			)
			o(modelMapper.assertCorrectValueCardinality(TestTypeRef, cardinalityZeroOrOne, cardinalityZeroOrOne, ParsedValue.fromNull())).deepEquals(
				ParsedValue.fromNull(),
			)

			// if serverHave cardinalityOne, the value is null and client still has cardinality one, we put default value
			// this is the case when we change some value from ZeroOrOne -> One
			o(modelMapper.assertCorrectValueCardinality(TestTypeRef, cardinalityOne, cardinalityOne, ParsedValue.fromNull())).deepEquals(
				ParsedValue.fromString(""),
			)

			const idTupleValue = { ...createEncryptedValueType(ValueTypeEnum.GeneratedId, CardinalityEnum.One), name: "_id" }
			o(
				modelMapper.assertCorrectValueCardinality(TestTypeRef, idTupleValue, idTupleValue, ParsedValue.fromIdTuple(["listId", "listElementId"])),
			).deepEquals(ParsedValue.fromIdTuple(["listId", "listElementId"]))

			const cardinalityOneErr = await assertThrows(InvalidModelError, async () =>
				modelMapper.assertCorrectValueCardinality(TestTypeRef, cardinalityZeroOrOne, cardinalityOne, ParsedValue.fromNull()),
			)
			const cardinalityAnyNullErr = await assertThrows(InvalidModelError, async () =>
				modelMapper.assertCorrectValueCardinality(TestTypeRef, cardinalityAny, cardinalityAny, ParsedValue.fromNull()),
			)
			const cardinalityAnyValueErr = await assertThrows(InvalidModelError, async () =>
				modelMapper.assertCorrectValueCardinality(TestTypeRef, cardinalityAny, cardinalityAny, ParsedValue.fromString("v")),
			)
			const nonStringValue = await assertThrows(ProgrammingError, async () =>
				modelMapper.assertCorrectValueCardinality(TestTypeRef, cardinalityOne, cardinalityOne, ParsedValue.fromNestedItems([])),
			)

			o(cardinalityOneErr.message).equals(`Expected non-null value for attribute with One cardinality. ${TestTypeRef.toString()}/test`)
			o(cardinalityAnyNullErr.message).equals("Current metamodel does not support ANY cardinality value")
			o(cardinalityAnyValueErr.message).equals("Current metamodel does not support ANY cardinality value")
			o(nonStringValue.message).equals("Invalid value/cardinality combination")
		})
	})
	o.spec("ClientEntity", function () {
		function stubModel(type: EntityTypeEnum, values: Record<string, Partial<ModelValue>> = {}): ClientTypeModel {
			return { app: "tutanota", id: 900, name: "Stub", type, values, associations: {} } as unknown as ClientTypeModel
		}

		o("castAsEntity keeps _original null for DataTransfer and BlobElement parents", function () {
			for (const type of [EntityTypeEnum.DataTransfer, EntityTypeEnum.BlobElement]) {
				const model = stubModel(type)
				const entity = new ClientEntity(model, { someValue: "v" }).castAsEntity<Entity>(model)
				o(entity._original).equals(null)
				o((entity as any).someValue).equals("v")
			}
		})

		o("castAsEntity sets _original for other parents", function () {
			for (const type of [EntityTypeEnum.Element, EntityTypeEnum.ListElement, EntityTypeEnum.Aggregated]) {
				const model = stubModel(type)
				const entity = new ClientEntity(model, { someValue: "v" }).castAsEntity<Entity>(model)
				o(entity._original).notEquals(null)
				o((entity._original as any).someValue).equals("v")
			}
		})

		o("castAsEntity decides on the parent type, not on the own type", function () {
			const aggregateModel = stubModel(EntityTypeEnum.Aggregated)
			const blobParentModel = stubModel(EntityTypeEnum.BlobElement)
			o(new ClientEntity(aggregateModel, {}).castAsEntity<Entity>(blobParentModel)._original).equals(null)
		})

		o("setValue maps _id depending on the entity type", function () {
			const idValue = { id: 1, name: "_id" }
			const cases: Array<[EntityTypeEnum, ParsedValue<DecryptedParsedInstance>, unknown]> = [
				[EntityTypeEnum.ListElement, ParsedValue.fromIdTuple(["l", "e"]), ["l", "e"]],
				[EntityTypeEnum.BlobElement, ParsedValue.fromIdTuple(["l", "e"]), ["l", "e"]],
				[EntityTypeEnum.Element, ParsedValue.fromId("e"), [null, "e"]],
				[EntityTypeEnum.Aggregated, ParsedValue.fromId("e"), "e"],
			]
			for (const [type, parsedValue, expected] of cases) {
				const record: Record<string, unknown> = {}
				new ClientEntity(stubModel(type, { "1": idValue }), record).setValue(1, parsedValue)
				o(record["_id"]).deepEquals(expected)
			}
		})

		o("setValue throws for _id on DataTransfer types", async function () {
			const model = stubModel(EntityTypeEnum.DataTransfer, { "1": { id: 1, name: "_id" } })
			await assertThrows(ProgrammingError, async () => new ClientEntity(model, {}).setValue(1, ParsedValue.fromId("e")))
		})
	})

	o.spec("OutgoingClientEntity", function () {
		const stubRef = new TypeRef<Entity>("tutanota", 901)
		function model(type: EntityTypeEnum, associations: Record<string, Partial<ModelAssociation>> = {}): ClientTypeModel {
			return { app: "tutanota", id: 901, name: "Stub", type, values: {}, associations } as unknown as ClientTypeModel
		}
		function association(overrides: Partial<ModelAssociation>): ModelAssociation {
			return {
				id: 1,
				name: "assoc",
				type: AssociationTypeEnum.ElementAssociation,
				cardinality: CardinalityEnum.Any,
				refTypeId: 902,
				final: false,
				dependency: null,
				...overrides,
			}
		}
		function outgoing(record: Record<string, unknown>, type = EntityTypeEnum.Element): OutgoingClientEntity {
			return new OutgoingClientEntity({ _type: stubRef, ...record } as Entity, model(type))
		}
		const idValue = { id: 1, name: "_id" } as ModelValue

		o("throws when the type model does not match the entity _type", async function () {
			const wrongModel = { ...model(EntityTypeEnum.Element), id: 999 }
			await assertThrows(Error, async () => new OutgoingClientEntity({ _type: stubRef } as Entity, wrongModel))
		})

		o("getValue maps _id depending on the entity type", function () {
			o(outgoing({ _id: ["l", "e"] }, EntityTypeEnum.ListElement).getValue(idValue)).deepEquals(ParsedValue.fromIdTuple(["l", "e"]))
			o(outgoing({ _id: ["l", "e"] }, EntityTypeEnum.BlobElement).getValue(idValue)).deepEquals(ParsedValue.fromIdTuple(["l", "e"]))
			o(outgoing({ _id: [null, "e"] }, EntityTypeEnum.Element).getValue(idValue)).deepEquals(ParsedValue.fromId("e"))
			o(outgoing({ _id: "e" }, EntityTypeEnum.Aggregated).getValue(idValue)).deepEquals(ParsedValue.fromId("e"))
		})

		o("getValue returns null for a missing _id", function () {
			o(outgoing({ _id: null }).getValue(idValue).isNull()).equals(true)
			o(outgoing({}).getValue(idValue).isNull()).equals(true)
		})

		o("getValue throws for _id on DataTransfer types", async function () {
			const entity = outgoing({ _id: "e" }, EntityTypeEnum.DataTransfer)
			await assertThrows(ProgrammingError, async () => entity.getValue(idValue))
		})

		o("getAggregationList rejects a mismatching aggregate type model", async function () {
			const entity = outgoing({ assoc: [] })
			const aggregateModel = { ...model(EntityTypeEnum.Aggregated), id: 902 }
			await assertThrows(Error, async () => entity.getAggregationList(association({ refTypeId: 903 }), aggregateModel))
			await assertThrows(Error, async () => entity.getAggregationList(association({ dependency: "sys" }), aggregateModel))
		})

		o("getAggregationList accepts a matching type model and sets the aggregate _type", function () {
			const entity = outgoing({ assoc: [{ x: 1 }] })
			const aggregateModel = { ...model(EntityTypeEnum.Aggregated), id: 902 }
			const result = entity.getAggregationList(association({ dependency: "tutanota" }), aggregateModel)
			o(result.length).equals(1)
			o(result[0].typeModel).equals(aggregateModel)
		})

		o("cardinality One association", async function () {
			o(outgoing({ assoc: "a" }).getIdList(association({ cardinality: CardinalityEnum.One }))).deepEquals(["a"])
			o(
				outgoing({ assoc: ["l", "e"] }).getIdTupleList(
					association({ cardinality: CardinalityEnum.One, type: AssociationTypeEnum.ListElementAssociationGenerated }),
				),
			).deepEquals([["l", "e"]])
			await assertThrows(InvalidModelError, async () => outgoing({ assoc: null }).getIdList(association({ cardinality: CardinalityEnum.One })))
			await assertThrows(InvalidModelError, async () => outgoing({ assoc: ["a", "b"] }).getIdList(association({ cardinality: CardinalityEnum.One })))
		})

		o("cardinality ZeroOrOne association", async function () {
			const zeroOrOne = association({ cardinality: CardinalityEnum.ZeroOrOne })
			o(outgoing({ assoc: "a" }).getIdList(zeroOrOne)).deepEquals(["a"])
			o(outgoing({ assoc: null }).getIdList(zeroOrOne)).deepEquals([])
			o(
				outgoing({ assoc: ["l", "e"] }).getIdTupleList(
					association({ cardinality: CardinalityEnum.ZeroOrOne, type: AssociationTypeEnum.ListElementAssociationGenerated }),
				),
			).deepEquals([["l", "e"]])
			await assertThrows(InvalidModelError, async () => outgoing({ assoc: ["a", "b"] }).getIdList(zeroOrOne))
		})

		o("cardinality Any association", async function () {
			const any = association({ cardinality: CardinalityEnum.Any })
			o(outgoing({ assoc: ["a", "b"] }).getIdList(any)).deepEquals(["a", "b"])
			o(outgoing({ assoc: [] }).getIdList(any)).deepEquals([])
			await assertThrows(InvalidModelError, async () => outgoing({ assoc: "a" }).getIdList(any))
			await assertThrows(InvalidModelError, async () => outgoing({}).getIdList(any))
		})
	})
})
