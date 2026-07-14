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

abstract class Path {
	protected readonly path: string

	protected constructor(
		parent: Nullable<Path>,
		readonly hasBeenCutOff: boolean,
		fieldSubPath: string,
	) {
		if (parent != null) {
			this.path = `${parent.renderedPath()}${fieldSubPath}`
		} else {
			this.path = fieldSubPath
		}
	}

	protected renderedPath(): string {
		return `${this.path}/`
	}
}

export abstract class RootOrAggregatePath extends Path {
	addAssociationId(modelAssociation: ModelAssociation): AssociationPath {
		const isInDataTransferAggregation = modelAssociation.idForAssociatedData != null
		const needsToGetCutOff = isInDataTransferAggregation && !this.hasBeenCutOff
		let parent: Nullable<RootOrAggregatePath> = this
		if (needsToGetCutOff) {
			parent = null
		}
		return new AssociationPath(parent, isInDataTransferAggregation, getId(modelAssociation))
	}

	addValueId(modelValue: ModelValue): ValuePath {
		const isInDataTransferAggregation = modelValue.idForAssociatedData != null
		const needsToGetCutOff = isInDataTransferAggregation && !this.hasBeenCutOff
		let parent: Nullable<RootOrAggregatePath> = this
		if (needsToGetCutOff) {
			parent = null
		}
		return new ValuePath(parent, isInDataTransferAggregation, getId(modelValue))
	}
}

export class RootPath extends RootOrAggregatePath {
	constructor() {
		super(null, false, "")
	}

	protected renderedPath(): string {
		return ""
	}
}

export class AggregatePath extends RootOrAggregatePath {
	constructor(parent: AssociationOrAssociationPatchPath, hasBeenCutOff: boolean, aggregateId: Id) {
		super(parent, hasBeenCutOff, `${aggregateId}`)
	}
}

abstract class AttributePath extends Path {
	constructor(parent: Nullable<RootOrAggregatePath>, hasBeenCutOff: boolean, attributeId: AttributeId) {
		super(parent, hasBeenCutOff, `${attributeId}`)
	}
}

export interface AssociationOrAssociationPatchPath extends Path {
	addAggregateId(aggregateId: Id): AggregatePath
}

export class AssociationPatchPath extends Path implements AssociationOrAssociationPatchPath {
	constructor(fieldPathString: string) {
		super(null, false, fieldPathString)
	}

	addAggregateId(aggregateId: Id): AggregatePath {
		return new AggregatePath(this, false, aggregateId)
	}
}

export class AssociationPath extends AttributePath implements AssociationOrAssociationPatchPath {
	addAggregateId(aggregateId: Id): AggregatePath {
		return new AggregatePath(this, this.hasBeenCutOff, aggregateId)
	}
}

export class ValuePath extends AttributePath {
	getPath(): string {
		return this.path
	}
}
