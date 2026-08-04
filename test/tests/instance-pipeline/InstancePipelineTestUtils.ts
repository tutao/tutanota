import {
	AssociationTypeEnum,
	CardinalityEnum,
	ClientTypeModel,
	Entity,
	EntityTypeEnum,
	ModelValue,
	ServerTypeModel,
	TypeModel,
	TypeRef,
	ValueTypeEnum,
} from "../../../src/platform-kit/meta"
import {
	ApplicationTypesHash,
	ClientTypeReferenceResolver,
	DecryptedParsedInstance,
	EncryptedParsedInstance,
	ServerTypeReferenceResolver,
	TypeModelResolver,
} from "../../../src/platform-kit/instance-pipeline"
import { InstanceDirection } from "../../../src/platform-kit/instance-pipeline/ParsedValue"

export const testTypeModel: TypeModel = {
	app: "tutanota",
	encrypted: true,
	id: 42,
	name: "TestType",
	rootId: "SoMeId",
	since: 41,
	type: EntityTypeEnum.ListElement,
	isPublic: true,
	dependsOnVersion: null,
	values: {
		"1": {
			id: 1,
			name: "testValue",
			type: ValueTypeEnum.String,
			cardinality: CardinalityEnum.One,
			final: true,
			encrypted: true,
		},
		"2": {
			id: 2,
			name: "testValueZeroOrOne",
			type: ValueTypeEnum.String,
			cardinality: CardinalityEnum.ZeroOrOne,
			final: false,
			encrypted: true,
		},
		"5": {
			id: 5,
			name: "testDate",
			type: ValueTypeEnum.Date,
			cardinality: CardinalityEnum.One,
			final: false,
			encrypted: false,
		},
		"7": {
			id: 7,
			name: "testBoolean",
			type: ValueTypeEnum.Boolean,
			cardinality: CardinalityEnum.ZeroOrOne,
			final: false,
			encrypted: true,
		},
		"12": {
			id: 12,
			name: "testGeneratedId",
			type: ValueTypeEnum.GeneratedId,
			cardinality: CardinalityEnum.One,
			final: false,
			encrypted: false,
		},
		"13": {
			id: 13,
			name: "_id",
			type: ValueTypeEnum.GeneratedId,
			cardinality: CardinalityEnum.One,
			final: false,
			encrypted: false,
		},
		"14": {
			id: 14,
			name: "_ownerEncSessionKey",
			type: ValueTypeEnum.Bytes,
			cardinality: CardinalityEnum.ZeroOrOne,
			final: true,
			encrypted: false,
		},
		"15": {
			id: 15,
			name: "testFinalBoolean",
			type: ValueTypeEnum.Boolean,
			cardinality: CardinalityEnum.One,
			final: true,
			encrypted: true,
		},
		"16": {
			id: 16,
			name: "_kdfNonce",
			type: ValueTypeEnum.Bytes,
			cardinality: CardinalityEnum.ZeroOrOne,
			final: true,
			encrypted: false,
		},
	},
	associations: {
		"3": {
			id: 3,
			name: "testAssociation",
			type: AssociationTypeEnum.Aggregation,
			cardinality: CardinalityEnum.Any,
			refTypeId: 43,
			final: false,
			dependency: "tutanota",
		},
		"4": {
			id: 4,
			name: "testElementAssociation",
			type: AssociationTypeEnum.ElementAssociation,
			cardinality: CardinalityEnum.ZeroOrOne,
			refTypeId: 44,
			final: false,
			dependency: null,
		},
		"8": {
			id: 8,
			name: "testListElementAssociation",
			type: AssociationTypeEnum.ListElementAssociationGenerated,
			cardinality: CardinalityEnum.Any,
			refTypeId: 44,
			final: false,
			dependency: null,
		},
		"17": {
			id: 17,
			name: "testZeroOrOneListElementAssociation",
			type: AssociationTypeEnum.ListElementAssociationGenerated,
			cardinality: CardinalityEnum.ZeroOrOne,
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
	type: EntityTypeEnum.Aggregated,
	isPublic: true,
	dependsOnVersion: null,
	values: {
		"2": {
			id: 2,
			name: "testNumber",
			type: ValueTypeEnum.Number,
			cardinality: CardinalityEnum.One,
			final: false,
			encrypted: false,
		},
		"6": {
			id: 6,
			name: "_id",
			type: ValueTypeEnum.CustomId,
			cardinality: CardinalityEnum.One,
			final: true,
			encrypted: false,
		},
	},
	associations: {
		"9": {
			id: 9,
			name: "testSecondLevelAssociation",
			type: AssociationTypeEnum.Aggregation,
			cardinality: CardinalityEnum.Any,
			refTypeId: 44,
			final: false,
			dependency: "tutanota",
		},
		"10": {
			id: 10,
			name: "testZeroOrOneAggregation",
			type: AssociationTypeEnum.Aggregation,
			cardinality: CardinalityEnum.ZeroOrOne,
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
	type: EntityTypeEnum.Aggregated,
	isPublic: true,
	dependsOnVersion: null,
	values: {
		"10": {
			id: 10,
			name: "testBytes",
			type: ValueTypeEnum.Bytes,
			cardinality: CardinalityEnum.ZeroOrOne,
			final: false,
			encrypted: false,
		},
		"11": {
			id: 11,
			name: "_id",
			type: ValueTypeEnum.CustomId,
			cardinality: CardinalityEnum.One,
			final: true,
			encrypted: false,
		},
		"17": {
			id: 17,
			name: "testEncryptedBytes",
			type: ValueTypeEnum.Bytes,
			cardinality: CardinalityEnum.ZeroOrOne,
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
	testEncryptedBytes: Uint8Array<ArrayBuffer> | null
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
	_kdfNonce: Uint8Array<ArrayBuffer> | null
	_ownerEncSessionKey: Uint8Array<ArrayBuffer> | null
	testValueZeroOrOne: string | null
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
	cardinality: Values<typeof CardinalityEnum>,
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

// in production use-case, everything that we store in offlineStorage should come from server
// and we guarantee this with assertions during runtime,
// i.e flow should be: EncryptedParsedInstance --(cryptoMapper)-> DecryptedParsedInstance
// but in test, we create it from: Entity --(modelMapper)-> DecryptedParsedInstance
// which is the opposite direction.
// since, we do not need that gurantee for test, we can just override the direction for now so

export function changeInstanceDirection<I extends EncryptedParsedInstance | DecryptedParsedInstance>(parsedInstance: I, direction: InstanceDirection): I {
	// @ts-ignore
	parsedInstance.direction! = direction
	// @ts-ignore
	const innerMap = parsedInstance.parsedInstance

	for (const parsedValue of innerMap.values()) {
		if (parsedValue.isArray()) {
			parsedValue.asArray().map((item) => {
				if (item.isNestedObj()) {
					changeInstanceDirection(item.asNestedObj(), direction)
				}
			})
		}
	}

	return parsedInstance
}
