import o from "@tutao/otest"
import { AssociationPath, RootPath } from "../../../src/platform-kit/instance-pipeline/EncryptionContextPath"
import { AssociationType, Cardinality, ModelAssociation, ModelValue, ValueType } from "../../../src/platform-kit/meta"

o.spec("EncryptionContextPath", () => {
	let mappedModelValue: ModelValue
	let modelValue: ModelValue
	let modelAssociation: ModelAssociation
	let mappedModelAssociation: ModelAssociation
	o.beforeEach(() => {
		modelValue = {
			id: 1,
			name: "Value",
			type: ValueType.Boolean,
			cardinality: Cardinality.One,
			final: false,
			encrypted: true,
			idForAssociatedData: null,
		}
		mappedModelValue = {
			id: 2,
			name: "MappedValue",
			type: ValueType.Boolean,
			cardinality: Cardinality.One,
			final: false,
			encrypted: true,
			idForAssociatedData: 42,
		}

		modelAssociation = {
			id: 3,
			name: "Association",
			type: AssociationType.Aggregation,
			cardinality: Cardinality.Any,
			refTypeId: 555,
			final: false,
			idForAssociatedData: null,
		}
		mappedModelAssociation = {
			id: 4,
			name: "MappedAssociation",
			type: AssociationType.Aggregation,
			cardinality: Cardinality.Any,
			refTypeId: 666,
			final: false,
			idForAssociatedData: 44,
		}
	})
	o.test("Simple values print path", () => {
		const valuePath = new RootPath().addValueId(modelValue)

		o.check(valuePath.getPath()).equals("1")
		o.check(valuePath.hasBeenCutOff).equals(false)
	})

	o.test("Mapped values print mapped path", () => {
		const valuePath = new RootPath().addValueId(mappedModelValue)

		o.check(valuePath.getPath()).equals("42")
		o.check(valuePath.hasBeenCutOff).equals(true)
	})

	o.test("Simple values within aggregates print path", () => {
		const valuePath = new RootPath().addAssociationId(modelAssociation).addAggregateId("aggregateId").addValueId(modelValue)

		o.check(valuePath.getPath()).equals("3/aggregateId/1")
		o.check(valuePath.hasBeenCutOff).equals(false)
	})

	o.test("Mapped values within aggregates print path", () => {
		const valuePath = new RootPath().addAssociationId(modelAssociation).addAggregateId("aggregateId").addValueId(mappedModelValue)

		o.check(valuePath.getPath()).equals("42")
		o.check(valuePath.hasBeenCutOff).equals(true)
	})

	o.test("Mapped values within mapped aggregates print path", () => {
		const valuePath = new RootPath()
			.addAssociationId(modelAssociation)
			.addAggregateId("aggregateId")
			.addAssociationId(mappedModelAssociation)
			.addAggregateId("anotherAggregateId")
			.addValueId(mappedModelValue)

		o.check(valuePath.getPath()).equals("44/anotherAggregateId/42")
		o.check(valuePath.hasBeenCutOff).equals(true)
	})

	o.test("Simple values print path for patch", () => {
		const valuePath = AssociationPath.fromPatchPath("5/something/7/").addAggregateId("someOtherThing").addValueId(modelValue)
		o.check(valuePath.getPath()).equals("5/something/7/someOtherThing/1")
		o.check(valuePath.hasBeenCutOff).equals(false)
	})
})
