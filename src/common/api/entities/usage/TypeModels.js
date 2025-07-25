// This is an automatically generated file, please do not edit by hand!

// You should not use it directly, please use `resolveTypReference()` instead.	
// We do not want tsc to spend time either checking or inferring type of these huge expressions. Even when it does try to infer them they are still wrong.
// The actual type is an object with keys as entities names and values as TypeModel.

/** @type {any} */
export const typeModels = {
	"8": {
		"name": "UsageTestMetricConfigValue",
		"app": "usage",
		"version": 4,
		"since": 1,
		"type": "AGGREGATED_TYPE",
		"id": 8,
		"rootId": "BXVzYWdlAAg",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"9": {
				"final": true,
				"name": "_id",
				"id": 9,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"10": {
				"final": false,
				"name": "key",
				"id": 10,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"11": {
				"final": false,
				"name": "value",
				"id": 11,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"12": {
		"name": "UsageTestMetricConfig",
		"app": "usage",
		"version": 4,
		"since": 1,
		"type": "AGGREGATED_TYPE",
		"id": 12,
		"rootId": "BXVzYWdlAAw",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"13": {
				"final": true,
				"name": "_id",
				"id": 13,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"14": {
				"final": true,
				"name": "name",
				"id": 14,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"15": {
				"final": true,
				"name": "type",
				"id": 15,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"16": {
				"final": false,
				"name": "configValues",
				"id": 16,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 8,
				"dependency": null
			}
		}
	},
	"17": {
		"name": "UsageTestMetricData",
		"app": "usage",
		"version": 4,
		"since": 1,
		"type": "AGGREGATED_TYPE",
		"id": 17,
		"rootId": "BXVzYWdlABE",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"18": {
				"final": true,
				"name": "_id",
				"id": 18,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"19": {
				"final": true,
				"name": "name",
				"id": 19,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"20": {
				"final": true,
				"name": "value",
				"id": 20,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"35": {
		"name": "UsageTestStage",
		"app": "usage",
		"version": 4,
		"since": 1,
		"type": "AGGREGATED_TYPE",
		"id": 35,
		"rootId": "BXVzYWdlACM",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"36": {
				"final": true,
				"name": "_id",
				"id": 36,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"37": {
				"final": false,
				"name": "name",
				"id": 37,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"87": {
				"final": false,
				"name": "minPings",
				"id": 87,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"88": {
				"final": false,
				"name": "maxPings",
				"id": 88,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"102": {
				"final": false,
				"name": "isFinalStage",
				"id": 102,
				"type": "Boolean",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"38": {
				"final": false,
				"name": "metrics",
				"id": 38,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 12,
				"dependency": null
			}
		}
	},
	"53": {
		"name": "UsageTestAssignmentIn",
		"app": "usage",
		"version": 4,
		"since": 1,
		"type": "DATA_TRANSFER_TYPE",
		"id": 53,
		"rootId": "BXVzYWdlADU",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"54": {
				"final": false,
				"name": "_format",
				"id": 54,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"55": {
				"final": false,
				"name": "testDeviceId",
				"id": 55,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"56": {
		"name": "UsageTestAssignment",
		"app": "usage",
		"version": 4,
		"since": 1,
		"type": "AGGREGATED_TYPE",
		"id": 56,
		"rootId": "BXVzYWdlADg",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"57": {
				"final": true,
				"name": "_id",
				"id": 57,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"58": {
				"final": true,
				"name": "testId",
				"id": 58,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"59": {
				"final": false,
				"name": "name",
				"id": 59,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"60": {
				"final": true,
				"name": "variant",
				"id": 60,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"61": {
				"final": false,
				"name": "sendPings",
				"id": 61,
				"type": "Boolean",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"62": {
				"final": false,
				"name": "stages",
				"id": 62,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 35,
				"dependency": null
			}
		}
	},
	"63": {
		"name": "UsageTestAssignmentOut",
		"app": "usage",
		"version": 4,
		"since": 1,
		"type": "DATA_TRANSFER_TYPE",
		"id": 63,
		"rootId": "BXVzYWdlAD8",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"64": {
				"final": false,
				"name": "_format",
				"id": 64,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"65": {
				"final": false,
				"name": "testDeviceId",
				"id": 65,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"66": {
				"final": false,
				"name": "assignments",
				"id": 66,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 56,
				"dependency": null
			}
		}
	},
	"80": {
		"name": "UsageTestParticipationIn",
		"app": "usage",
		"version": 4,
		"since": 1,
		"type": "DATA_TRANSFER_TYPE",
		"id": 80,
		"rootId": "BXVzYWdlAFA",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"81": {
				"final": false,
				"name": "_format",
				"id": 81,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"82": {
				"final": false,
				"name": "testId",
				"id": 82,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"83": {
				"final": false,
				"name": "stage",
				"id": 83,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"84": {
				"final": false,
				"name": "testDeviceId",
				"id": 84,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"100": {
				"final": false,
				"name": "isFinalPingForStage",
				"id": 100,
				"type": "Boolean",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"85": {
				"final": false,
				"name": "metrics",
				"id": 85,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 17,
				"dependency": null
			}
		}
	},
	"90": {
		"name": "UsageTestParticipationOut",
		"app": "usage",
		"version": 4,
		"since": 4,
		"type": "DATA_TRANSFER_TYPE",
		"id": 90,
		"rootId": "BXVzYWdlAFo",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"91": {
				"final": false,
				"name": "_format",
				"id": 91,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"92": {
				"final": false,
				"name": "pingListId",
				"id": 92,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"93": {
				"final": false,
				"name": "pingId",
				"id": 93,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"94": {
		"name": "UsageTestParticipationDeleteIn",
		"app": "usage",
		"version": 4,
		"since": 4,
		"type": "DATA_TRANSFER_TYPE",
		"id": 94,
		"rootId": "BXVzYWdlAF4",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"95": {
				"final": false,
				"name": "_format",
				"id": 95,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"96": {
				"final": false,
				"name": "testId",
				"id": 96,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"97": {
				"final": false,
				"name": "testDeviceId",
				"id": 97,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"98": {
				"final": false,
				"name": "pingListId",
				"id": 98,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"99": {
				"final": false,
				"name": "pingId",
				"id": 99,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {}
	}
}