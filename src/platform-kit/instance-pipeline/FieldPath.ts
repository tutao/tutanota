import { AttributeId, ModelAssociation, ModelValue } from "@tutao/meta"
import { Nullable } from "@tutao/utils"

interface ModelAttribute {
	id: AttributeId
	idForAssociatedData: Nullable<AttributeId>
}

function getId(modelAttribute: ModelAttribute): AttributeId {
	return modelAttribute.idForAssociatedData ?? modelAttribute.id
}

abstract class FieldPathElement {
	protected readonly fieldPath: string

	protected constructor(
		protected readonly parent: Nullable<FieldPathElement>,
		protected readonly hasBeenCutOff: boolean,
	) {
		if (parent != null) {
			this.fieldPath = `${parent.fieldPathPrefix()}${this.asString()}`
		} else {
			this.fieldPath = this.asString()
		}
	}

	protected abstract asString(): string

	protected fieldPathPrefix(): string {
		return `${this.fieldPath}/`
	}
}

export abstract class RootOrAggregateFieldPathElement extends FieldPathElement {
	addAssociationId(modelAssociation: ModelAssociation): AssociationFieldPathElement {
		const isInDataTransferAggregation = modelAssociation.idForAssociatedData != null
		const needsToGetCutOff = isInDataTransferAggregation && !this.hasBeenCutOff
		let parent: Nullable<RootOrAggregateFieldPathElement> = this
		if (needsToGetCutOff) {
			parent = null
		}
		return new AssociationFieldPathElement(parent, isInDataTransferAggregation, getId(modelAssociation))
	}

	addValueId(modelValue: ModelValue): ValueFieldPathElement {
		const isInDataTransferAggregation = modelValue.idForAssociatedData != null
		const needsToGetCutOff = isInDataTransferAggregation && !this.hasBeenCutOff
		let parent: Nullable<RootOrAggregateFieldPathElement> = this
		if (needsToGetCutOff) {
			parent = null
		}
		return new ValueFieldPathElement(parent, isInDataTransferAggregation, getId(modelValue))
	}
}

export class RootFieldPathElement extends RootOrAggregateFieldPathElement {
	constructor() {
		super(null, false)
	}

	protected asString(): string {
		return ""
	}

	protected fieldPathPrefix(): string {
		return ""
	}
}

export class AggregateFieldPathElement extends RootOrAggregateFieldPathElement {
	constructor(
		parent: AssociationPatchOrAssociationPathElement,
		hasBeenCutOff: boolean,
		protected readonly aggregateId: Id,
	) {
		super(parent, hasBeenCutOff)
	}

	protected asString(): string {
		return `${this.aggregateId}`
	}
}

abstract class AttributeFieldPathElement extends FieldPathElement {
	constructor(
		parent: Nullable<RootOrAggregateFieldPathElement>,
		hasBeenCutOff: boolean,
		readonly attributeId: AttributeId,
	) {
		super(parent, hasBeenCutOff)
	}

	protected asString(): string {
		return `${this.attributeId}`
	}
}

export interface AssociationPatchOrAssociationPathElement extends FieldPathElement {
	addAggregateId(aggregateId: Id): AggregateFieldPathElement
}

export class AssociationPatchFieldPathElement extends FieldPathElement implements AssociationPatchOrAssociationPathElement {
	constructor(private readonly fieldPathString: string) {
		super(null, false)
	}

	addAggregateId(aggregateId: Id): AggregateFieldPathElement {
		return new AggregateFieldPathElement(this, false, aggregateId)
	}

	protected asString(): string {
		return this.fieldPathString
	}
}

export class AssociationFieldPathElement extends AttributeFieldPathElement implements AssociationPatchOrAssociationPathElement {
	addAggregateId(aggregateId: Id): AggregateFieldPathElement {
		return new AggregateFieldPathElement(this, this.hasBeenCutOff, aggregateId)
	}
}

export class ValueFieldPathElement extends AttributeFieldPathElement {
	getFieldPath(): string {
		return this.fieldPath
	}
}
