import {
	AssociationType,
	Cardinality,
	ClientTypeModel,
	Entity,
	ModelValue,
	ServerTypeModel,
	Type,
	TypeModel,
	TypeRef,
	ValueTypeEnum,
} from "../../../src/platform-kit/meta"
import { ApplicationTypesHash, ClientTypeReferenceResolver, ServerTypeReferenceResolver, TypeModelResolver } from "../../../src/platform-kit/instance-pipeline"

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
			type: ValueTypeEnum.String,
			cardinality: Cardinality.One,
			final: true,
			encrypted: true,
		},
		"2": {
			id: 2,
			name: "testValueZeroOrOne",
			type: ValueTypeEnum.String,
			cardinality: Cardinality.ZeroOrOne,
			final: false,
			encrypted: true,
		},
		"5": {
			id: 5,
			name: "testDate",
			type: ValueTypeEnum.Date,
			cardinality: Cardinality.One,
			final: false,
			encrypted: false,
		},
		"7": {
			id: 7,
			name: "testBoolean",
			type: ValueTypeEnum.Boolean,
			cardinality: Cardinality.ZeroOrOne,
			final: false,
			encrypted: true,
		},
		"12": {
			id: 12,
			name: "testGeneratedId",
			type: ValueTypeEnum.GeneratedId,
			cardinality: Cardinality.One,
			final: false,
			encrypted: false,
		},
		"13": {
			id: 13,
			name: "_id",
			type: ValueTypeEnum.GeneratedId,
			cardinality: Cardinality.One,
			final: false,
			encrypted: false,
		},
		"14": {
			id: 14,
			name: "_ownerEncSessionKey",
			type: ValueTypeEnum.Bytes,
			cardinality: Cardinality.ZeroOrOne,
			final: true,
			encrypted: false,
		},
		"15": {
			id: 15,
			name: "testFinalBoolean",
			type: ValueTypeEnum.Boolean,
			cardinality: Cardinality.One,
			final: true,
			encrypted: true,
		},
		"16": {
			id: 16,
			name: "_kdfNonce",
			type: ValueTypeEnum.Bytes,
			cardinality: Cardinality.ZeroOrOne,
			final: true,
			encrypted: false,
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
		},
		"4": {
			id: 4,
			name: "testElementAssociation",
			type: AssociationType.ElementAssociation,
			cardinality: Cardinality.ZeroOrOne,
			refTypeId: 44,
			final: false,
			dependency: null,
		},
		"8": {
			id: 8,
			name: "testListElementAssociation",
			type: AssociationType.ListElementAssociationGenerated,
			cardinality: Cardinality.Any,
			refTypeId: 44,
			final: false,
			dependency: null,
		},
		"17": {
			id: 17,
			name: "testZeroOrOneListElementAssociation",
			type: AssociationType.ListElementAssociationGenerated,
			cardinality: Cardinality.ZeroOrOne,
			refTypeId: 44,
			final: false,
			dependency: null,
		},
	},
	version: 0,
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
	isPublic: true,
	values: {
		"2": {
			id: 2,
			name: "testNumber",
			type: ValueTypeEnum.Number,
			cardinality: Cardinality.One,
			final: false,
			encrypted: false,
		},
		"6": {
			id: 6,
			name: "_id",
			type: ValueTypeEnum.CustomId,
			cardinality: Cardinality.One,
			final: true,
			encrypted: false,
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
		},
		"10": {
			id: 10,
			name: "testZeroOrOneAggregation",
			type: AssociationType.Aggregation,
			cardinality: Cardinality.ZeroOrOne,
			refTypeId: 44,
			final: false,
			dependency: "tutanota",
		},
	},
	version: 0,
	versioned: false,
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
			type: ValueTypeEnum.Bytes,
			cardinality: Cardinality.ZeroOrOne,
			final: false,
			encrypted: false,
		},
		"11": {
			id: 11,
			name: "_id",
			type: ValueTypeEnum.CustomId,
			cardinality: Cardinality.One,
			final: true,
			encrypted: false,
		},
		"17": {
			id: 17,
			name: "testEncryptedBytes",
			type: ValueTypeEnum.Bytes,
			cardinality: Cardinality.ZeroOrOne,
			final: false,
			encrypted: true,
		},
	},
	associations: {},
	version: 0,
	versioned: false,
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
		case testTypeModel.id:
			return Promise.resolve(testTypeModel)
		case testAggregateModel.id:
			return Promise.resolve(testAggregateModel)
		case testAggregateOnAggregateModel.id:
			return Promise.resolve(testAggregateOnAggregateModel)
	}
	return Promise.resolve(testTypeModel)
}

export class DummyTypeModelResolver extends TypeModelResolver {
	constructor(
		private readonly clientResolver: ClientTypeReferenceResolver = dummyResolver as ClientTypeReferenceResolver,
		private readonly serverResolver: ServerTypeReferenceResolver = dummyResolver as ServerTypeReferenceResolver,
	) {
		super(null!, null!)
	}

	getServerApplicationTypesModelHash(): ApplicationTypesHash | null {
		return null
	}

	resolveClientTypeReference(typeRef: TypeRef<any>): Promise<ClientTypeModel> {
		return this.clientResolver(typeRef)
	}
	resolveServerTypeReference(typeRef: TypeRef<any>): Promise<ServerTypeModel> {
		return this.serverResolver(typeRef)
	}

	setServerApplicationTypesModelHash(hash: ApplicationTypesHash): void {}
}

export function createEncryptedValueType(
	type: ValueTypeEnum,
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
	} satisfies ModelValue
}
