// This is an automatically generated file, please do not edit by hand!

// You should not use it directly, please use `resolveTypReference()` instead.	
// We do not want tsc to spend time either checking or inferring type of these huge expressions. Even when it does try to infer them they are still wrong.
// The actual type is an object with keys as entities names and values as TypeModel.

/** @type {any} */
export const typeModels = {
	"79": {
		"name": "CustomerAccountPosting",
		"since": 3,
		"type": "AGGREGATED_TYPE",
		"id": 79,
		"rootId": "CmFjY291bnRpbmcATw",
		"versioned": false,
		"encrypted": false,
		"values": {
			"80": {
				"final": true,
				"name": "_id",
				"id": 80,
				"since": 3,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"81": {
				"final": true,
				"name": "type",
				"id": 81,
				"since": 3,
				"type": "Number",
				"cardinality": "One",
				"encrypted": true
			},
			"82": {
				"final": true,
				"name": "valueDate",
				"id": 82,
				"since": 3,
				"type": "Date",
				"cardinality": "One",
				"encrypted": true
			},
			"83": {
				"final": true,
				"name": "invoiceNumber",
				"id": 83,
				"since": 3,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": true
			},
			"84": {
				"final": true,
				"name": "amount",
				"id": 84,
				"since": 3,
				"type": "Number",
				"cardinality": "One",
				"encrypted": true
			}
		},
		"associations": {},
		"app": "accounting",
		"version": "7"
	},
	"86": {
		"name": "CustomerAccountReturn",
		"since": 3,
		"type": "DATA_TRANSFER_TYPE",
		"id": 86,
		"rootId": "CmFjY291bnRpbmcAVg",
		"versioned": false,
		"encrypted": true,
		"values": {
			"87": {
				"final": false,
				"name": "_format",
				"id": 87,
				"since": 3,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"88": {
				"final": true,
				"name": "_ownerGroup",
				"id": 88,
				"since": 3,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"89": {
				"final": true,
				"name": "_ownerPublicEncSessionKey",
				"id": 89,
				"since": 3,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"92": {
				"final": false,
				"name": "outstandingBookingsPrice",
				"id": 92,
				"since": 4,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"94": {
				"final": true,
				"name": "balance",
				"id": 94,
				"since": 5,
				"type": "Number",
				"cardinality": "One",
				"encrypted": true
			},
			"96": {
				"final": true,
				"name": "_publicCryptoProtocolVersion",
				"id": 96,
				"since": 7,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"90": {
				"final": false,
				"name": "postings",
				"id": 90,
				"since": 3,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 79,
				"dependency": null
			}
		},
		"app": "accounting",
		"version": "7"
	}
}