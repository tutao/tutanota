// We cannot use Flow here because it's used during build

export const Type = {
	Element: "ELEMENT_TYPE",
	ListElement: "LIST_ELEMENT_TYPE",
	DataTransfer: "DATA_TRANSFER_TYPE",
	Aggregated: "AGGREGATED_TYPE"
}

export const Cardinality = {
	ZeroOrOne: "ZeroOrOne",
	Any: "Any",
	One: "One"
}

export const AssociationType = {
	ElementAssociation: "ELEMENT_ASSOCIATION",
	ListAssociation: "LIST_ASSOCIATION",
	ListElementAssociation: "LIST_ELEMENT_ASSOCIATION",
	Aggregation: "AGGREGATION",
}

export const ValueType = {
	String: "String",
	Number: "Number",
	Bytes: "Bytes",
	Date: "Date",
	Boolean: "Boolean",
	GeneratedId: "GeneratedId",
	CustomId: "CustomId",
	CompressedString: "CompressedString",
}

export const ResourceType = {
	Persistence: "Persistence",
	Service: "Service"
}

export const ValueToFlowTypes = {
	String: "string",
	Number: "NumberString",
	Bytes: "Uint8Array",
	Date: "Date",
	Boolean: "boolean",
	GeneratedId: "Id",
	CustomId: "Id",
	CompressedString: "string",
}
