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
	let buf = `#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
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
	buf += `
impl Entity for ${typeName} {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "${modelName}",
			type_: "${typeName}",
		}
	}
}
`

	return buf + "\n\n"
}

export function generateRustServiceDefinition(appName, appVersion, services) {
	let imports = new Set([
		"#![allow(unused_imports, dead_code, unused_variables)]",
		"use crate::ApiCallError;",
		"use crate::entities::Entity;",
		"use crate::services::{PostService, GetService, PutService, DeleteService, Service, Executor, ExtraServiceParams};",
		"use crate::rest_client::HttpMethod;",
		"use crate::services::hidden::Nothing;",
	])
	const code = services
		.map((s) => {
			let serviceDefinition = `
pub struct ${s.name};

crate::service_impl!(declare, ${s.name}, "${appName}/${s.name.toLowerCase()}", ${appVersion});
`

			function getTypeRef(dataType) {
				if (dataType) {
					return `Some(${dataType}::type_ref())`
				} else {
					return "None"
				}
			}

			function addImports(appName, input, output) {
				if (input) {
					imports.add(`use crate::entities::${appName}::${input};`)
				}
				if (output) {
					imports.add(`use crate::entities::${appName}::${output};`)
				}
			}

			function makeImpl(name, input, output) {
				addImports(appName, input, output)
				return `crate::service_impl!(${name}, ${s.name}, ${input ?? "()"}, ${output ?? "()"});\n`
			}

			if (s.bodyTypes.POST_IN || s.bodyTypes.POST_OUT) {
				serviceDefinition += makeImpl("POST", s.bodyTypes.POST_IN, s.bodyTypes.POST_OUT)
			}

			if (s.bodyTypes.GET_IN || s.bodyTypes.GET_OUT) {
				serviceDefinition += makeImpl("GET", s.bodyTypes.GET_IN, s.bodyTypes.GET_OUT)
			}

			if (s.bodyTypes.PUT_IN || s.bodyTypes.PUT_OUT) {
				serviceDefinition += makeImpl("PUT", s.bodyTypes.PUT_IN, s.bodyTypes.PUT_OUT)
			}

			if (s.bodyTypes.DELETE_IN || s.bodyTypes.DELETE_OUT) {
				serviceDefinition += makeImpl("DELETE", s.bodyTypes.DELETE_IN, s.bodyTypes.DELETE_OUt)
			}

			return serviceDefinition
		})
		.join("\n")
	return Array.from(imports).join("\n") + code
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
