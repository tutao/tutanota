export type AttributeId = number
export type TypeId = number
export type AttributeName = string

export const enum OperationType {
	CREATE = "0",
	UPDATE = "1",
	DELETE = "2",
}

export enum ValueTypeEnum {
	String = "String",
	Number = "Number",
	Bytes = "Bytes",
	Date = "Date",
	Boolean = "Boolean",
	GeneratedId = "GeneratedId",
	CustomId = "CustomId",
	CompressedString = "CompressedString",
}

export enum CardinalityEnum {
	ZeroOrOne = "ZeroOrOne",
	Any = "Any",
	One = "One",
}

export enum EntityTypeEnum {
	Element = "ELEMENT_TYPE",
	ListElement = "LIST_ELEMENT_TYPE",
	DataTransfer = "DATA_TRANSFER_TYPE",
	Aggregated = "AGGREGATED_TYPE",
	BlobElement = "BLOB_ELEMENT_TYPE",
}

export enum AssociationTypeEnum {
	ElementAssociation = "ELEMENT_ASSOCIATION",
	ListAssociation = "LIST_ASSOCIATION",
	ListElementAssociationGenerated = "LIST_ELEMENT_ASSOCIATION_GENERATED",
	Aggregation = "AGGREGATION",
	BlobElementAssociation = "BLOB_ELEMENT_ASSOCIATION",
	ListElementAssociationCustom = "LIST_ELEMENT_ASSOCIATION_CUSTOM",
}

/// How association are actually represented in metamodel
export const enum AssociationReprType {
	SingleId,
	IdTuple,
	Aggregation,
}

export const enum IdType {
	SingleId,
	IdTuple,
}

export function getIdType(typeModel: EntityTypeEnum) {
	switch (typeModel) {
		case EntityTypeEnum.Element:
		case EntityTypeEnum.Aggregated:
		case EntityTypeEnum.DataTransfer:
			return IdType.SingleId
		case EntityTypeEnum.BlobElement:
		case EntityTypeEnum.ListElement:
			return IdType.IdTuple
	}
}

export function getAssociationRepresentationType(associationType: AssociationTypeEnum) {
	switch (associationType) {
		case AssociationTypeEnum.Aggregation:
			return AssociationReprType.Aggregation

		case AssociationTypeEnum.BlobElementAssociation:
		case AssociationTypeEnum.ListElementAssociationCustom:
		case AssociationTypeEnum.ListElementAssociationGenerated:
			return AssociationReprType.IdTuple

		case AssociationTypeEnum.ListAssociation:
		case AssociationTypeEnum.ElementAssociation:
			return AssociationReprType.SingleId
	}
}
