import { AssociationType, Cardinality, Entity, ModelValue, Type, TypeModel, TypeRef, ValueType } from "../../../src/platform-kit/meta"

export const testTypeModel: TypeModel = {
	app: "tutanota",
	encrypted: true,
	id: 42,
	name: "TestType",
	rootId: "SoMeId",
	since: 41,
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
			idForAssociatedData: null,
		},
		"2": {
			id: 2,
			name: "testValueZeroOrOne",
			type: ValueType.String,
			cardinality: Cardinality.ZeroOrOne,
			final: false,
			encrypted: true,
			idForAssociatedData: null,
		},
		"5": {
			id: 5,
			name: "testDate",
			type: ValueType.Date,
			cardinality: Cardinality.One,
			final: false,
			encrypted: false,
			idForAssociatedData: null,
		},
		"7": {
			id: 7,
			name: "testBoolean",
			type: ValueType.Boolean,
			cardinality: Cardinality.ZeroOrOne,
			final: false,
			encrypted: true,
			idForAssociatedData: null,
		},
		"12": {
			id: 12,
			name: "testGeneratedId",
			type: ValueType.GeneratedId,
			cardinality: Cardinality.One,
			final: false,
			encrypted: false,
			idForAssociatedData: null,
		},
		"13": {
			id: 12,
			name: "_id",
			type: ValueType.GeneratedId,
			cardinality: Cardinality.One,
			final: false,
			encrypted: false,
			idForAssociatedData: null,
		},
		"14": {
			id: 14,
			name: "_ownerEncSessionKey",
			type: ValueType.Bytes,
			cardinality: Cardinality.ZeroOrOne,
			final: true,
			encrypted: false,
			idForAssociatedData: null,
		},
		"15": {
			id: 15,
			name: "testFinalBoolean",
			type: ValueType.Boolean,
			cardinality: Cardinality.One,
			final: true,
			encrypted: true,
			idForAssociatedData: null,
		},
		"16": {
			id: 16,
			name: "_kdfNonce",
			type: ValueType.Bytes,
			cardinality: Cardinality.ZeroOrOne,
			final: true,
			encrypted: false,
			idForAssociatedData: null,
		},
	},
	associations: {
		"3": {
			id: 3,
			name: "testAssociation",
			type: AssociationType.Aggregation,
			cardinality: Cardinality.Any,
			refTypeId: 43,
			final: false,
			dependency: "tutanota",
			idForAssociatedData: null,
		},
		"4": {
			id: 4,
			name: "testElementAssociation",
			type: AssociationType.ElementAssociation,
			cardinality: Cardinality.ZeroOrOne,
			refTypeId: 44,
			final: false,
			dependency: null,
			idForAssociatedData: null,
		},
		"8": {
			id: 8,
			name: "testListElementAssociation",
			type: AssociationType.ListElementAssociationGenerated,
			cardinality: Cardinality.Any,
			refTypeId: 44,
			final: false,
			dependency: null,
			idForAssociatedData: null,
		},
		"14": {
			id: 14,
			name: "testZeroOrOneListElementAssociation",
			type: AssociationType.ListElementAssociationGenerated,
			cardinality: Cardinality.ZeroOrOne,
			refTypeId: 44,
			final: false,
			dependency: null,
			idForAssociatedData: null,
		},
	},
	version: 0,
	versioned: false,
	idForSubKeyContext: null,
}

export const testAggregateModel: TypeModel = {
	app: "tutanota",
	encrypted: true,
	id: 43,
	name: "TestAggregate",
	rootId: "SoMeId",
	since: 41,
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
			idForAssociatedData: null,
		},
		"6": {
			id: 6,
			name: "_id",
			type: ValueType.CustomId,
			cardinality: Cardinality.One,
			final: true,
			encrypted: false,
			idForAssociatedData: null,
		},
	},
	associations: {
		"9": {
			id: 9,
			name: "testSecondLevelAssociation",
			type: AssociationType.Aggregation,
			cardinality: Cardinality.Any,
			refTypeId: 44,
			final: false,
			dependency: "tutanota",
			idForAssociatedData: null,
		},
		"10": {
			id: 10,
			name: "testZeroOrOneAggregation",
			type: AssociationType.Aggregation,
			cardinality: Cardinality.ZeroOrOne,
			refTypeId: 44,
			final: false,
			dependency: "tutanota",
			idForAssociatedData: null,
		},
	},
	version: 0,
	versioned: false,
	idForSubKeyContext: null,
}

export const testAggregateOnAggregateModel: TypeModel = {
	app: "tutanota",
	encrypted: true,
	id: 44,
	name: "TestAggregateOnAggregate",
	rootId: "SoMeId",
	since: 41,
	type: Type.Aggregated,
	isPublic: true,
	values: {
		"10": {
			id: 10,
			name: "testBytes",
			type: ValueType.Bytes,
			cardinality: Cardinality.ZeroOrOne,
			final: false,
			encrypted: false,
			idForAssociatedData: null,
		},
		"11": {
			id: 11,
			name: "_id",
			type: ValueType.CustomId,
			cardinality: Cardinality.One,
			final: true,
			encrypted: false,
			idForAssociatedData: null,
		},
		"17": {
			id: 17,
			name: "testEncryptedBytes",
			type: ValueType.Bytes,
			cardinality: Cardinality.ZeroOrOne,
			final: false,
			encrypted: true,
			idForAssociatedData: null,
		},
	},
	associations: {},
	version: 0,
	versioned: false,
	idForSubKeyContext: null,
}

export const TestTypeRef = new TypeRef<TestEntity>("tutanota", 42)
export const TestAggregateRef = new TypeRef<TestAggregate>("tutanota", 43)
export const TestAggregateOnAggregateRef = new TypeRef<TestAggregateOnAggregate>("tutanota", 44)

export type TestAggregateOnAggregate = Entity & {
	_id: Id
	testBytes: null | Uint8Array
}

export type TestAggregate = Entity & {
	_id: Id
	testNumber: NumberString
	testSecondLevelAssociation: TestAggregateOnAggregate[]
	testZeroOrOneAggregation: TestAggregateOnAggregate | null
}

export type TestEntity = Entity & {
	_id: IdTuple
	testGeneratedId: Id
	testValue: string
	testDate: Date
	testBoolean: boolean | null
	testAssociation: TestAggregate[]
	testElementAssociation: Id | null
	testListElementAssociation: IdTuple[]
	testZeroOrOneListElementAssociation: IdTuple | null
	testFinalBoolean: boolean
}

export const dummyResolver = (tr: TypeRef<unknown>) => {
	switch (tr.typeId) {
		case 42:
			return Promise.resolve(testTypeModel)
		case 43:
			return Promise.resolve(testAggregateModel)
		case 44:
			return Promise.resolve(testAggregateOnAggregateModel)
	}
	return Promise.resolve(testTypeModel)
}

export function createEncryptedValueType(
	type: Values<typeof ValueType>,
	cardinality: Values<typeof Cardinality>,
): ModelValue & {
	encrypted: true
} {
	return {
		name: "test",
		id: 426,
		type: type,
		cardinality: cardinality,
		final: true,
		encrypted: true,
		idForAssociatedData: null,
	} satisfies ModelValue
}
