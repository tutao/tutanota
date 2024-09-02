/**
 * @fileOverview This file is used by the api class generator in another repo
 * but is checked in here so that it's updated in lockstep with rust code that expects it.
 */

import { AssociationType, Type } from "../src/common/api/common/EntityConstants.js"

/**
 * @param p {object}
 * @param p.type {import("../src/common/api/common/EntityTypes.js").TypeModel}
 * @param p.modelName {string}
 * @return {string}
 */
export function generateRustType({ type, modelName }) {
	let typeName = mapTypeName(type.name, modelName)
	let buf = `#[derive(uniffi::Record, Clone, Serialize, Deserialize, Debug)]
pub struct ${typeName} {\n`
	for (let [valueName, valueProperties] of Object.entries(type.values)) {
		const rustType = rustValueType(valueName, type, valueProperties)
		if (valueName === "type") {
			buf += `\t#[serde(rename = "type")]\n`
			buf += `\tpub r#type: ${rustType},\n`
		} else if (valueProperties.type === "Bytes") {
			buf += `\t#[serde(with = "serde_bytes")]\n`
			buf += `\tpub ${valueName}: ${rustType},\n`
		} else {
			buf += `\tpub ${valueName}: ${rustType},\n`
		}
	}

	for (let [associationName, associationProperties] of Object.entries(type.associations)) {
		const innerRustType = rustAssociationType(associationProperties)
		let rustType
		switch (associationProperties.cardinality) {
			case "ZeroOrOne":
				rustType = `Option<${innerRustType}>`
				break
			case "Any":
				rustType = `Vec<${innerRustType}>`
				break
			case "One":
				rustType = innerRustType
				break
		}

		if (associationName === "type") {
			buf += `\t#[serde(rename = "type")]\n`
			buf += `\tpub r#type: ${rustType},\n`
		} else {
			buf += `\tpub ${associationName}: ${rustType},\n`
		}
	}

	if (type.encrypted) {
		buf += `\tpub _errors: Option<Errors>,\n`
	}

	// aggregates do not say whether they are encrypted or not. For some reason!
	if (type.encrypted || Object.values(type.values).some((v) => v.encrypted)) {
		buf += `\tpub _finalIvs: HashMap<String, FinalIv>,\n`
	}
	buf += "}"

	buf += "\n\n"

	buf += `impl Entity for ${typeName} {\n`
	buf += "\tfn type_ref() -> TypeRef {\n"
	buf += `\t\tTypeRef {\n`
	buf += `\t\t\tapp: "${modelName}",\n`
	buf += `\t\t\ttype_: "${typeName}",\n`
	buf += `\t\t}\n`
	buf += "\t}\n"
	buf += "}"

	return buf
}

/**
 * @param types {string[]}
 * @return {string}
 */
export function combineRustTypes(types) {
	if (types.length === 0) return "\n"
	return `#![allow(non_snake_case, unused_imports)]
use super::*;
use serde::{Deserialize, Serialize};

${types.join("\n\n")}
`
}

/**
 * @param name {string}
 * @param modelName {string}
 * @return {string}
 */
function mapTypeName(name, modelName) {
	if (name === "File" && modelName === "tutanota") return "TutanotaFile"
	if (name === "Exception" && modelName === "sys") return "SysException"
	return name
}

/**
 * @param valueName {string}
 * @param type {import("../src/common/api/common/EntityTypes.js").TypeModel}
 * @param value {import("../src/common/api/common/EntityTypes.js").ModelValue}
 * @return {string}
 */
function rustValueType(valueName, type, value) {
	const ValueToRustTypes = Object.freeze({
		String: "String",
		Number: "i64",
		Bytes: "Vec<u8>",
		Date: "DateTime",
		Boolean: "bool",
		GeneratedId: "GeneratedId",
		CustomId: "CustomId",
		// not supported yet
		CompressedString: "Vec<u8>",
	})

	let innerType
	if (valueName === "_id" && (type.type === Type.ListElement || type.type === Type.BlobElement)) {
		innerType = "IdTuple"
	} else {
		innerType = ValueToRustTypes[value.type]
	}
	if (value.cardinality === "ZeroOrOne") {
		return `Option<${innerType}>`
	} else {
		return innerType
	}
}

/**
 * @param association {import("../src/common/api/common/EntityTypes.js").ModelAssociation}
 * @return {string}
 */
function rustAssociationType(association) {
	if (association.type === AssociationType.Aggregation) {
		if (association.dependency) {
			return `${association.dependency}::${association.refType}`
		} else {
			return association.refType
		}
	} else if (association.type === AssociationType.ListElementAssociation) {
		return "IdTuple"
	} else if (association.type === AssociationType.BlobElementAssociation) {
		return "IdTuple"
	} else {
		return "GeneratedId"
	}
}
