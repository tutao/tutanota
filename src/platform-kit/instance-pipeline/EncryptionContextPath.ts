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

export abstract class InstancePath extends Path {}

export class RootPath extends InstancePath {
	constructor(app: AppName) {
		super(app, null, false, "")
	}
}

export class AggregatePath extends InstancePath {
	protected constructor(parent: AssociationPath, hasBeenCutOff: boolean, aggregateId: Id) {
		super(parent.app, parent, hasBeenCutOff, `${aggregateId}/`)
	}

	static fromAssociationPath(parent: AssociationPath, aggregateId: Id): AggregatePath {
		return new AggregatePath(parent, parent.hasBeenCutOff, aggregateId)
	}
}

export class AssociationPath extends Path {
	protected constructor(app: AppName, parent: Nullable<InstancePath>, hasBeenCutOff: boolean, attributeString: string) {
		super(app, parent, hasBeenCutOff, `${attributeString}/`)
	}

	static fromInstancePath(parent: InstancePath, modelAssociation: ModelAssociation): AssociationPath {
		const isInDataTransferAggregation = modelAssociation.transferredAttributeId != null
		const needsToGetCutOff = isInDataTransferAggregation && !parent.hasBeenCutOff
		return new AssociationPath(parent.app, needsToGetCutOff ? null : parent, isInDataTransferAggregation, getId(modelAssociation).toString())
	}

	static fromPatchPath(app: AppName, pathString: string): AssociationPath {
		return new AssociationPath(app, null, false, pathString)
	}
}

export class ValuePath extends Path {
	static fromInstancePath(parent: InstancePath, modelValue: ModelValue): ValuePath {
		const isInDataTransferAggregation = modelValue.transferredAttributeId != null
		const needsToGetCutOff = isInDataTransferAggregation && !parent.hasBeenCutOff
		return new ValuePath(parent.app, needsToGetCutOff ? null : parent, isInDataTransferAggregation, getId(modelValue).toString())
	}

	static fromPatchPath(app: AppName, pathString: string): ValuePath {
		return new ValuePath(app, null, false, pathString)
	}

	getPath(): string {
		return this.path
	}
}
