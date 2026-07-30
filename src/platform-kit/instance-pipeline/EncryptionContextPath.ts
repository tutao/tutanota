import { AppName, AttributeId, ModelAssociation, ModelValue } from "@tutao/meta"
import { Nullable } from "@tutao/utils"

/**
 * When encrypting values with AEAD, we need to pass the attribute path as part of the associated data. This is not trivial
 * when the attribute is supposed to be moved from one instance type to another on the server side. For such cases, we
 * build a path that (a) is mapped to the final intended location of the ciphertext and (b) cuts out the outer part of
 * the path, where the value is nested.
 */

interface ModelAttribute {
	id: AttributeId
	transferredAttributeId: Nullable<AttributeId>
}

function getId(modelAttribute: ModelAttribute): AttributeId {
	return modelAttribute.transferredAttributeId ?? modelAttribute.id
}

abstract class Path {
	protected readonly path: string

	protected constructor(
		readonly app: AppName,
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
		const isInDataTransferAggregation = modelAssociation.transferredAttributeId != null
		const needsToGetCutOff = isInDataTransferAggregation && !this.hasBeenCutOff
		const parent: Nullable<InstancePath> = needsToGetCutOff ? null : this
		return AssociationPath.construct(this.app, parent, isInDataTransferAggregation, getId(modelAssociation))
	}

	addValueId(modelValue: ModelValue): ValuePath {
		const isInDataTransferAggregation = modelValue.transferredAttributeId != null
		const needsToGetCutOff = isInDataTransferAggregation && !this.hasBeenCutOff
		const parent: Nullable<InstancePath> = needsToGetCutOff ? null : this
		return ValuePath.fromAttributeId(this.app, parent, isInDataTransferAggregation, getId(modelValue))
	}
}

export class RootPath extends InstancePath {
	constructor(app: AppName) {
		super(app, null, false, "")
	}
}

export class AggregatePath extends InstancePath {
	constructor(parent: AssociationPath, hasBeenCutOff: boolean, aggregateId: Id) {
		super(parent.app, parent, hasBeenCutOff, `${aggregateId}/`)
	}
}

export class AssociationPath extends Path {
	static construct(app: AppName, parent: Nullable<InstancePath>, hasBeenCutOff: boolean, attributeId: AttributeId): AssociationPath {
		return new AssociationPath(app, parent, hasBeenCutOff, `${attributeId}/`)
	}

	static fromPatchPath(app: AppName, pathString: string): AssociationPath {
		return new AssociationPath(app, null, false, pathString)
	}

	addAggregateId(aggregateId: Id): AggregatePath {
		return new AggregatePath(this, this.hasBeenCutOff, aggregateId)
	}
}

export class ValuePath extends Path {
	static fromAttributeId(app: AppName, parent: Nullable<InstancePath>, hasBeenCutOff: boolean, attributeId: AttributeId): ValuePath {
		return new ValuePath(app, parent, hasBeenCutOff, `${attributeId}`)
	}

	static fromPatchPath(app: AppName, pathString: string) {
		return new ValuePath(app, null, false, pathString)
	}
	getPath(): string {
		return this.path
	}
}
