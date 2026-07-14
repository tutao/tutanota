import { AttributeId, ModelAssociation, ModelValue } from "@tutao/meta"
import { Nullable } from "@tutao/utils"

/**
 * When encrypting values with AEAD, we need to pass the attribute path as part of the associated data. This is not trivial
 * when the attribute is supposed to be moved from one instance type to another on the server side. For such cases, we
 * build a path that a) is mapped to the final intended location of the ciphertext and b) cuts out the outer part of
 * the path, where the value is nested.
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
		pathElement: string,
	) {
		if (parent != null) {
			this.path = `${parent.path}${pathElement}`
		} else {
			this.path = pathElement
		}
	}
}

export abstract class InstancePath extends Path {
	addAssociationId(modelAssociation: ModelAssociation): AssociationPath {
		const isInDataTransferAggregation = modelAssociation.idForAssociatedData != null
		const needsToGetCutOff = isInDataTransferAggregation && !this.hasBeenCutOff
		let parent: Nullable<InstancePath> = this
		if (needsToGetCutOff) {
			parent = null
		}
		return AssociationPath.construct(parent, isInDataTransferAggregation, getId(modelAssociation))
	}

	addValueId(modelValue: ModelValue): ValuePath {
		const isInDataTransferAggregation = modelValue.idForAssociatedData != null
		const needsToGetCutOff = isInDataTransferAggregation && !this.hasBeenCutOff
		let parent: Nullable<InstancePath> = this
		if (needsToGetCutOff) {
			parent = null
		}
		return new ValuePath(parent, isInDataTransferAggregation, getId(modelValue))
	}
}

export class RootPath extends InstancePath {
	constructor() {
		super(null, false, "")
	}
}

export class AggregatePath extends InstancePath {
	constructor(parent: AssociationPath, hasBeenCutOff: boolean, aggregateId: Id) {
		super(parent, hasBeenCutOff, `${aggregateId}/`)
	}
}

export class AssociationPath extends Path {
	static construct(parent: Nullable<InstancePath>, hasBeenCutOff: boolean, attributeId: AttributeId): AssociationPath {
		return new AssociationPath(parent, hasBeenCutOff, `${attributeId}/`)
	}

	static fromPatchPath(pathString: string): AssociationPath {
		return new AssociationPath(null, false, pathString)
	}

	addAggregateId(aggregateId: Id): AggregatePath {
		return new AggregatePath(this, this.hasBeenCutOff, aggregateId)
	}
}

export class ValuePath extends Path {
	constructor(parent: Nullable<InstancePath>, hasBeenCutOff: boolean, attributeId: AttributeId) {
		super(parent, hasBeenCutOff, `${attributeId}`)
	}

	getPath(): string {
		return this.path
	}
}
