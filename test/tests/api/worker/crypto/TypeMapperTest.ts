import { TypeModel, UntypedInstance } from "../../../../../src/common/api/common/EntityTypes"
import { AssociationType, Cardinality, Type, ValueType } from "../../../../../src/common/api/common/EntityConstants"
import { assertNotNull, TypeRef } from "@tutao/tutanota-utils"
import o from "@tutao/otest"
import { TypeMapper } from "../../../../../src/common/api/worker/crypto/TypeMapper"

const testTypeModel: TypeModel = {
	app: "tutanota",
	encrypted: true,
	id: 42,
	name: "TestType",
	rootId: "SoMeId",
	since: 41,
	type: Type.ListElement,
	values: {
		"1": {
			id: 1,
			name: "testValue",
			type: ValueType.String,
			cardinality: Cardinality.One,
			final: false,
			encrypted: true,
		},
	},
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
}

const testAggregateModel: TypeModel = {
	app: "tutanota",
	encrypted: true,
	id: 43,
	name: "TestAggregate",
	rootId: "SoMeId",
	since: 41,
	type: Type.ListElement,
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
}

const untypedInstance: UntypedInstance = JSON.parse('{ "1": "test string", "3": [{ "2": "123" }] }')
o.spec("TypeMapper", function () {
	let typeMapper: TypeMapper
	o.beforeEach(() => {
		const dummyResolver = (tr: TypeRef<unknown>) => {
			const model = tr.typeId === 42 ? testTypeModel : testAggregateModel
			return Promise.resolve(model)
		}
		typeMapper = new TypeMapper(dummyResolver)
	})

	o.spec("applyJsTypes", function () {
		o.test("number strings are converted to numbers", async function () {
			const encryptedParsedInstance = await typeMapper.applyJsTypes(testTypeModel, untypedInstance)
			o(encryptedParsedInstance["1"]).equals("test string")
			o(assertNotNull(encryptedParsedInstance["3"])[0]["2"]).equals("123")
		})
	})
})
