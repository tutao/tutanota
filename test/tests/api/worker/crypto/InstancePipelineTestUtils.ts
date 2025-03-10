import { Entity, ModelValue, TypeModel } from "../../../../../src/common/api/common/EntityTypes"
import { AssociationType, Cardinality, Type, ValueType } from "../../../../../src/common/api/common/EntityConstants"
import { TypeRef } from "@tutao/tutanota-utils"

export const testTypeModel: TypeModel = {
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
			final: true,
			encrypted: true,
		},
		"5": {
			id: 1,
			name: "testDate",
			type: ValueType.Date,
			cardinality: Cardinality.One,
			final: false,
			encrypted: false,
		},
		"7": {
			id: 1,
			name: "testBoolean",
			type: ValueType.Boolean,
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
		"4": {
			id: 4,
			name: "testListAssociation",
			type: AssociationType.ListAssociation,
			cardinality: Cardinality.One,
			refTypeId: 44,
			final: false,
			dependency: null,
		},
		"8": {
			id: 8,
			name: "testListElementAssociation",
			type: AssociationType.ListElementAssociationGenerated,
			cardinality: Cardinality.One,
			refTypeId: 44,
			final: false,
			dependency: null,
		},
	},
	version: "0",
	versioned: false,
}

export const testAggregateModel: TypeModel = {
	app: "tutanota",
	encrypted: true,
	id: 43,
	name: "TestAggregate",
	rootId: "SoMeId",
	since: 41,
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
		"6": {
			id: 6,
			name: "_id",
			type: ValueType.CustomId,
			cardinality: Cardinality.One,
			final: true,
			encrypted: false,
		},
	},
	associations: {},
	version: "0",
	versioned: false,
}

export const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)
export const TestAggregateRef = new TypeRef<TestAggregate>("tutanota", 43)

export type TestAggregate = Entity & {
	_id: Id
	testNumber: NumberString
}

export type TestEntity = Entity & {
	testValue: string
	testDate: Date
	testBoolean: boolean
	testAssociation: TestAggregate
	testListAssociation: Id
	testListElementAssociation: IdTuple
}

export const dummyResolver = (tr: TypeRef<unknown>) => {
	const model = tr.typeId === 42 ? testTypeModel : testAggregateModel
	return Promise.resolve(model)
}

export function createEncryptedValueType(type: Values<typeof ValueType>, cardinality: Values<typeof Cardinality>): ModelValue & { encrypted: true } {
	return {
		name: "test",
		id: 426,
		type: type,
		cardinality: cardinality,
		final: true,
		encrypted: true,
	} satisfies ModelValue
}
