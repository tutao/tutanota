import o, { assertThrows } from "@tutao/otest"
import { ClientEntity, DecryptedParsedInstance, ModelMapper, OutgoingClientEntity, TypeModelResolver } from "../../../src/platform-kit/instance-pipeline"
import {
	AssociationTypeEnum,
	CardinalityEnum,
	ClientTypeModel,
	DEFAULT_ENTITY_FIELDS,
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
import { ParsedValue } from "../../../src/platform-kit/instance-pipeline/ParsedValue"
import { random } from "../../../src/platform-kit/crypto"

o.spec("ModelMapperTest", function () {
	let modelMapper: ModelMapper
	let decryptedParsedInstance: DecryptedParsedInstance
	let instance: TestEntity

	o.beforeEach(async () => {
		modelMapper = new ModelMapper(new DummyTypeModelResolver() as TypeModelResolver, random)

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

		o("wrong association cardinality throws xyz", async function () {
			decryptedParsedInstance.addAttributeById(4, ParsedValue.fromIdList(["some-id", "another-id-should-not-be-here-when-cardinality-is-zero-one"]))

			const err = await assertThrows(InvalidModelError, async () => modelMapper.mapToInstance(decryptedParsedInstance))
			o(err.message).equals("Cardinality ZeroOrOne can hold at max one item. Found: 2")
		})

		o("mapToInstance keeps a copy of the entity (and its aggregates) in _original", async function () {
			const mappedEntity = (await modelMapper.mapToInstance(decryptedParsedInstance)) as any

			o(mappedEntity._original).notEquals(null)
			o(mappedEntity._original === mappedEntity).equals(false)
			o(mappedEntity._original._original).equals(null)
			o(mappedEntity._original._id).deepEquals(mappedEntity._id)
			o(mappedEntity._original.testValue).equals(mappedEntity.testValue)

			const aggregate = mappedEntity.testAssociation[0]
			o(aggregate._original).notEquals(null)
			o(aggregate._original.testNumber).equals("123")
		})

		o("mapToInstance with error in parsed instance sets _errors", async function () {
			decryptedParsedInstance.addErrorByAttributeId(1, "decryption failed")

			const result = (await modelMapper.mapToInstance(decryptedParsedInstance)) as any

			o(result._errors).deepEquals({ "1": "decryption failed" })
		})
	})

	o.spec("mapToInstances", function () {
		o("maps every parsed instance", async function () {
			const other = decryptedParsedInstance.clone()

			const result = (await modelMapper.mapToInstances([decryptedParsedInstance, other])) as any[]

			o(result.length).equals(2)
			o(result[0]._type).deepEquals(TestTypeRef)
			o(result[1]._type).deepEquals(TestTypeRef)
		})

		o("empty list returns empty list", async function () {
			o(await modelMapper.mapToInstances([])).deepEquals([])
		})
	})

	o.spec("mapToReadonlyInstance", function () {
		o("leaves _original null on the entity and on its aggregates", async function () {
			const result = (await modelMapper.mapToReadonlyInstance(decryptedParsedInstance)) as any

			o(result._original).equals(null)
			o(result.testAssociation.length).equals(1)
			o(result.testAssociation[0]._original).equals(null)
		})

		o("contains the same data as mapToInstance, except _original", async function () {
			const readonly = await modelMapper.mapToReadonlyInstance(decryptedParsedInstance)
			const full = removeOriginals((await modelMapper.mapToInstance(decryptedParsedInstance)) as any)

			o(readonly as any).deepEquals(full)
		})

		o("still validates cardinalities", async function () {
			decryptedParsedInstance.addAttributeById(4, ParsedValue.fromIdList(["some-id", "another-id"]))

			await assertThrows(InvalidModelError, async () => modelMapper.mapToReadonlyInstance(decryptedParsedInstance))
		})

		o("does not change the behaviour of mapToInstance afterwards", async function () {
			await modelMapper.mapToReadonlyInstance(decryptedParsedInstance)

			const result = (await modelMapper.mapToInstance(decryptedParsedInstance)) as any

			o(result._original).notEquals(null)
		})
	})

	o.spec("ClientEntity", function () {
		const makeModel = (type: EntityTypeEnum, values: Record<string, ModelValue> = {}): ClientTypeModel =>
			({ app: "tutanota", id: 1, name: "Stub", type, values, associations: {} }) as unknown as ClientTypeModel
		const idValue = { id: 1, name: "_id" } as ModelValue

		o.spec("castAsEntity", function () {
			for (const type of [EntityTypeEnum.Element, EntityTypeEnum.ListElement, EntityTypeEnum.Aggregated]) {
				o(`sets _original for ${type}`, function () {
					const model = makeModel(type)
					const entity = new ClientEntity(model, { a: "b" }).castAsEntity<any>(model, true)

					o(entity._original).notEquals(null)
					o(entity._original.a).equals("b")
				})
			}

			for (const type of [EntityTypeEnum.DataTransfer, EntityTypeEnum.BlobElement]) {
				o(`does not set _original for ${type}`, function () {
					const model = makeModel(type)
					const entity = new ClientEntity(model, { a: "b" }).castAsEntity<any>(model, true)

					o(entity._original).equals(null)
				})
			}

			o("uses the parent type model to decide about _original of an aggregate", function () {
				const aggregateModel = makeModel(EntityTypeEnum.Aggregated)
				const blobParent = makeModel(EntityTypeEnum.BlobElement)

				o(new ClientEntity(aggregateModel).castAsEntity<any>(blobParent, true)._original).equals(null)
				o(new ClientEntity(aggregateModel).castAsEntity<any>(makeModel(EntityTypeEnum.Element), true)._original).notEquals(null)
			})

			o("never sets _original when keepOriginal is false", function () {
				const model = makeModel(EntityTypeEnum.Element)
				o(new ClientEntity(model).castAsEntity<any>(model, false)._original).equals(null)
			})

			o("sets _type from the type model", function () {
				const model = makeModel(EntityTypeEnum.Element)
				o(new ClientEntity(model).castAsEntity<any>(model, true)._type).deepEquals(new TypeRef("tutanota", 1))
			})
		})

		o.spec("setValue _id", function () {
			o("BlobElement stores the id tuple", function () {
				const record: Record<string, unknown> = {}
				new ClientEntity(makeModel(EntityTypeEnum.BlobElement, { "1": idValue }), record).setValue(1, ParsedValue.fromIdTuple(["l", "e"]))
				o(record["_id"]).deepEquals(["l", "e"])
			})

			o("ListElement stores the id tuple", function () {
				const record: Record<string, unknown> = {}
				new ClientEntity(makeModel(EntityTypeEnum.ListElement, { "1": idValue }), record).setValue(1, ParsedValue.fromIdTuple(["l", "e"]))
				o(record["_id"]).deepEquals(["l", "e"])
			})

			o("Element stores an element id", function () {
				const record: Record<string, unknown> = {}
				new ClientEntity(makeModel(EntityTypeEnum.Element, { "1": idValue }), record).setValue(1, ParsedValue.fromId("e"))
				o(record["_id"]).deepEquals([null, "e"])
			})

			o("Aggregated stores a plain id", function () {
				const record: Record<string, unknown> = {}
				new ClientEntity(makeModel(EntityTypeEnum.Aggregated, { "1": idValue }), record).setValue(1, ParsedValue.fromId("agg"))
				o(record["_id"]).equals("agg")
			})

			o("DataTransfer throws", function () {
				const entity = new ClientEntity(makeModel(EntityTypeEnum.DataTransfer, { "1": idValue }))
				o(() => entity.setValue(1, ParsedValue.fromId("x"))).throws(ProgrammingError)
			})
		})

		o("setErrors", function () {
			const record: Record<string, unknown> = {}
			new ClientEntity(makeModel(EntityTypeEnum.Element), record).setErrors({ "1": "err" })
			o(record["_errors"]).deepEquals({ "1": "err" })
		})

		o("setIdList and setIdTupleList respect cardinality", function () {
			const model = {
				...makeModel(EntityTypeEnum.Element),
				associations: {
					"1": { id: 1, name: "ids", cardinality: CardinalityEnum.Any, type: AssociationTypeEnum.ListAssociation },
					"2": { id: 2, name: "tuples", cardinality: CardinalityEnum.Any, type: AssociationTypeEnum.ListElementAssociationGenerated },
				},
			} as unknown as ClientTypeModel
			const record: Record<string, unknown> = {}
			const entity = new ClientEntity(model, record)
			entity.setIdList(1, ["a", "b"])
			entity.setIdTupleList(2, [["l", "e"]])
			o(record["ids"]).deepEquals(["a", "b"])
			o(record["tuples"]).deepEquals([["l", "e"]])
		})
	})

	o.spec("OutgoingClientEntity", function () {
		const makeModel = (type: EntityTypeEnum): ClientTypeModel =>
			({ app: "tutanota", id: 1, name: "Stub", type, values: {}, associations: {} }) as unknown as ClientTypeModel
		const stubEntity = (record: object) => ({ _type: new TypeRef("tutanota", 1), ...record }) as any
		const idValue = { id: 1, name: "_id" } as ModelValue
		const assoc = (cardinality: CardinalityEnum, type: AssociationTypeEnum, extra: object = {}) =>
			({ id: 5, name: "assoc", cardinality, type, refTypeId: 2, dependency: null, ...extra }) as unknown as ModelAssociation

		o("constructor throws if the type model does not match the entity", function () {
			const wrongModel = { ...makeModel(EntityTypeEnum.Element), id: 99 } as ClientTypeModel
			o(() => new OutgoingClientEntity(stubEntity({}), wrongModel)).throws(Error)
		})

		o.spec("getAggregationList", function () {
			const aggregateModel = { ...makeModel(EntityTypeEnum.Aggregated), id: 2 } as ClientTypeModel

			o("wraps each aggregate in an OutgoingClientEntity", function () {
				const entity = new OutgoingClientEntity(stubEntity({ assoc: [{ _id: "a1" }, { _id: "a2" }] }), makeModel(EntityTypeEnum.Element))
				const result = entity.getAggregationList(assoc(CardinalityEnum.Any, AssociationTypeEnum.Aggregation), aggregateModel)

				o(result.length).equals(2)
				o(result[0].getValue(idValue).asId()).equals("a1")
			})

			o("throws if the aggregate type model does not match the association", function () {
				const entity = new OutgoingClientEntity(stubEntity({ assoc: [] }), makeModel(EntityTypeEnum.Element))
				const wrong = { ...aggregateModel, id: 3 } as ClientTypeModel
				o(() => entity.getAggregationList(assoc(CardinalityEnum.Any, AssociationTypeEnum.Aggregation), wrong)).throws(Error)
			})

			o("throws if the dependency does not match the aggregate app", function () {
				const entity = new OutgoingClientEntity(stubEntity({ assoc: [] }), makeModel(EntityTypeEnum.Element))
				const association = assoc(CardinalityEnum.Any, AssociationTypeEnum.Aggregation, { dependency: "sys" })
				o(() => entity.getAggregationList(association, aggregateModel)).throws(Error)
			})

			o("accepts a matching dependency", function () {
				const entity = new OutgoingClientEntity(stubEntity({ assoc: [] }), makeModel(EntityTypeEnum.Element))
				const association = assoc(CardinalityEnum.Any, AssociationTypeEnum.Aggregation, { dependency: "tutanota" })
				o(entity.getAggregationList(association, aggregateModel)).deepEquals([])
			})
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
})
