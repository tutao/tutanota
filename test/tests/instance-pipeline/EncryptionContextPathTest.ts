import o from "@tutao/otest"
import { AggregatePath, AssociationPath, RootPath, ValuePath } from "../../../src/platform-kit/instance-pipeline/EncryptionContextPath"
import { AppName, AssociationTypeEnum, CardinalityEnum, ModelAssociation, ModelValue, ValueTypeEnum } from "../../../src/platform-kit/meta"

o.spec("EncryptionContextPath", () => {
	let mappedModelValue: ModelValue
	let modelValue: ModelValue
	let modelAssociation: ModelAssociation
	let mappedModelAssociation: ModelAssociation
	let app: AppName
	o.beforeEach(() => {
		modelValue = {
			id: 1,
			name: "Value",
			type: ValueTypeEnum.Boolean,
			cardinality: CardinalityEnum.One,
			final: false,
			encrypted: true,
			transferredAttributeId: null,
		}
		mappedModelValue = {
			id: 2,
			name: "MappedValue",
			type: ValueTypeEnum.Boolean,
			cardinality: CardinalityEnum.One,
			final: false,
			encrypted: true,
			transferredAttributeId: 42,
		}

		modelAssociation = {
			id: 3,
			name: "Association",
			type: AssociationTypeEnum.Aggregation,
			cardinality: CardinalityEnum.Any,
			refTypeId: 555,
			final: false,
			dependency: null,
			transferredAttributeId: null,
		}
		mappedModelAssociation = {
			id: 4,
			name: "MappedAssociation",
			type: AssociationTypeEnum.Aggregation,
			cardinality: CardinalityEnum.Any,
			refTypeId: 666,
			final: false,
			dependency: null,
			transferredAttributeId: 44,
		}

		app = "testApplication"
	})
	o.test("Simple values print path", () => {
		const rootPath = new RootPath(app)
		const valuePath = ValuePath.fromInstancePath(rootPath, modelValue)

		o.check(valuePath.getPath()).equals("1")
		o.check(valuePath.hasBeenCutOff).equals(false)
	})

	o.test("Mapped values print mapped path", () => {
		const rootPath = new RootPath(app)
		const valuePath = ValuePath.fromInstancePath(rootPath, mappedModelValue)

		o.check(valuePath.getPath()).equals("42")
		o.check(valuePath.hasBeenCutOff).equals(true)
	})

	o.test("Simple values within aggregates print path", () => {
		const rootPath = new RootPath(app)
		const associationPath = AssociationPath.fromInstancePath(rootPath, modelAssociation)
		const aggregatePath = AggregatePath.fromAssociationPath(associationPath, "aggregateId")
		const valuePath = ValuePath.fromInstancePath(aggregatePath, modelValue)

		o.check(valuePath.getPath()).equals("3/aggregateId/1")
		o.check(valuePath.hasBeenCutOff).equals(false)
	})

	o.test("Mapped values within aggregates print path", () => {
		const rootPath = new RootPath(app)
		const associationPath = AssociationPath.fromInstancePath(rootPath, modelAssociation)
		const aggregatePath = AggregatePath.fromAssociationPath(associationPath, "aggregateId")
		const valuePath = ValuePath.fromInstancePath(aggregatePath, mappedModelValue)

		o.check(valuePath.getPath()).equals("42")
		o.check(valuePath.hasBeenCutOff).equals(true)
	})

	o.test("Mapped values within mapped aggregates print path", () => {
		const rootPath = new RootPath(app)
		const associationPath0 = AssociationPath.fromInstancePath(rootPath, modelAssociation)
		const aggregatePath0 = AggregatePath.fromAssociationPath(associationPath0, "aggregateId")
		const associationPath1 = AssociationPath.fromInstancePath(aggregatePath0, mappedModelAssociation)
		const aggregatePath1 = AggregatePath.fromAssociationPath(associationPath1, "anotherAggregateId")
		const valuePath = ValuePath.fromInstancePath(aggregatePath1, mappedModelValue)

		o.check(valuePath.getPath()).equals("44/anotherAggregateId/42")
		o.check(valuePath.hasBeenCutOff).equals(true)
	})

	o.test("Simple values print path for patch", () => {
		const associationPath = AssociationPath.fromPatchPath(app, "5/something/7")
		const aggregatePath = AggregatePath.fromAssociationPath(associationPath, "someOtherThing")
		const valuePath = ValuePath.fromInstancePath(aggregatePath, modelValue)
		o.check(valuePath.getPath()).equals("5/something/7/someOtherThing/1")
		o.check(valuePath.hasBeenCutOff).equals(false)
	})
})
