// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const RegistrationServiceDataTypeRef: TypeRef<RegistrationServiceData> = new TypeRef("sys", "RegistrationServiceData")
export const _TypeModel: TypeModel = {
	"name": "RegistrationServiceData",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 316,
	"rootId": "A3N5cwABPA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 317,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"accountType": {
			"name": "accountType",
			"id": 318,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"company": {
			"name": "company",
			"id": 321,
			"since": 1,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"domain": {
			"name": "domain",
			"id": 322,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"groupName": {
			"name": "groupName",
			"id": 320,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"language": {
			"name": "language",
			"id": 319,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mailAddress": {
			"name": "mailAddress",
			"id": 324,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mobilePhoneNumber": {
			"name": "mobilePhoneNumber",
			"id": 323,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"source": {
			"name": "source",
			"id": 874,
			"since": 9,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"specialPriceUserSingle": {
			"name": "specialPriceUserSingle",
			"id": 875,
			"since": 9,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"specialPriceUserTotal": {
			"name": "specialPriceUserTotal",
			"id": 876,
			"since": 9,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"state": {
			"name": "state",
			"id": 325,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "28"
}

export function createRegistrationServiceData(): RegistrationServiceData {
	return create(_TypeModel)
}
