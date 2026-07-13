import { AttributeId, ModelAssociation, ModelValue } from "@tutao/meta"
import { Nullable } from "@tutao/utils"

/**
 * When encrypting fields with AEAD, we need to pass the field path as part of the associated data. This is not trivial
 * when the attribute is supposed to be moved from one instance type to another on the server side. For such cases, we
 * build a field path that a) is mapped to the final intended location of the ciphertext and b) cuts out the outer part
 * of the path, where the field is nested.
 */

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
		parent: Nullable<FieldPathElement>,
		readonly hasBeenCutOff: boolean,
		fieldSubPath: string,
	) {
		if (parent != null) {
			this.fieldPath = `${parent.fieldPathPrefix()}${fieldSubPath}`
		} else {
			this.fieldPath = fieldSubPath
		}
	}

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
		super(null, false, "")
	}

	protected fieldPathPrefix(): string {
		return ""
	}
}

export class AggregateFieldPathElement extends RootOrAggregateFieldPathElement {
	constructor(parent: AssociationPatchOrAssociationPathElement, hasBeenCutOff: boolean, aggregateId: Id) {
		super(parent, hasBeenCutOff, `${aggregateId}`)
	}
}

abstract class AttributeFieldPathElement extends FieldPathElement {
	constructor(parent: Nullable<RootOrAggregateFieldPathElement>, hasBeenCutOff: boolean, attributeId: AttributeId) {
		super(parent, hasBeenCutOff, `${attributeId}`)
	}
}

export interface AssociationPatchOrAssociationPathElement extends FieldPathElement {
	addAggregateId(aggregateId: Id): AggregateFieldPathElement
}

export class AssociationPatchFieldPathElement extends FieldPathElement implements AssociationPatchOrAssociationPathElement {
	constructor(fieldPathString: string) {
		super(null, false, fieldPathString)
	}

	addAggregateId(aggregateId: Id): AggregateFieldPathElement {
		return new AggregateFieldPathElement(this, false, aggregateId)
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
