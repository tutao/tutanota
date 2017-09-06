// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const UserTypeRef: TypeRef<User> = new TypeRef("sys", "User")
export const _TypeModel: TypeModel = {
	"name": "User",
	"since": 1,
	"type": "ELEMENT_TYPE",
	"id": 84,
	"rootId": "A3N5cwBU",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 88,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 86,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 996,
			"since": 17,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 87,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"accountType": {
			"name": "accountType",
			"id": 92,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"enabled": {
			"name": "enabled",
			"id": 93,
			"since": 1,
			"type": "Boolean",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"requirePasswordUpdate": {
			"name": "requirePasswordUpdate",
			"id": 1117,
			"since": 22,
			"type": "Boolean",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"salt": {
			"name": "salt",
			"id": 90,
			"since": 1,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"userEncClientKey": {
			"name": "userEncClientKey",
			"id": 89,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"verifier": {
			"name": "verifier",
			"id": 91,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"auth": {
			"name": "auth",
			"since": 23,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "UserAuthentication",
			"final": true
		},
		"authenticatedDevices": {
			"name": "authenticatedDevices",
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "AuthenticatedDevice",
			"final": true
		},
		"externalAuthInfo": {
			"name": "externalAuthInfo",
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "UserExternalAuthInfo",
			"final": true
		},
		"memberships": {
			"name": "memberships",
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "GroupMembership",
			"final": true
		},
		"phoneNumbers": {
			"name": "phoneNumbers",
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "PhoneNumber",
			"final": true
		},
		"pushIdentifierList": {
			"name": "pushIdentifierList",
			"since": 5,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "PushIdentifierList",
			"final": false
		},
		"userGroup": {
			"name": "userGroup",
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "GroupMembership",
			"final": true
		},
		"customer": {
			"name": "customer",
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "Customer",
			"final": true,
			"external": false
		},
		"failedLogins": {
			"name": "failedLogins",
			"since": 1,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "Login",
			"final": true,
			"external": false
		},
		"secondFactorAuthentications": {
			"name": "secondFactorAuthentications",
			"since": 1,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "SecondFactorAuthentication",
			"final": true,
			"external": false
		},
		"successfulLogins": {
			"name": "successfulLogins",
			"since": 1,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "Login",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "25"
}

export function createUser(): User {
	return create(_TypeModel)
}
