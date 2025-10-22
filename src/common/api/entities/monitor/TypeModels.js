// This is an automatically generated file, please do not edit by hand!

// You should not use it directly, please use `resolveTypReference()` instead.	
// We do not want tsc to spend time either checking or inferring type of these huge expressions. Even when it does try to infer them they are still wrong.
// The actual type is an object with keys as entities names and values as TypeModel.

/** @type {any} */
export const typeModels = {
	"12": {
		"name": "ReadCounterData",
		"app": "monitor",
		"version": 36,
		"since": 1,
		"type": "DATA_TRANSFER_TYPE",
		"id": 12,
		"rootId": "B21vbml0b3IADA",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"13": {
				"final": false,
				"name": "_format",
				"id": 13,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"14": {
				"final": false,
				"name": "rowName",
				"id": 14,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"15": {
				"final": false,
				"name": "columnName",
				"id": 15,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"299": {
				"final": false,
				"name": "counterType",
				"id": 299,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"16": {
		"name": "ReadCounterReturn",
		"app": "monitor",
		"version": 36,
		"since": 1,
		"type": "DATA_TRANSFER_TYPE",
		"id": 16,
		"rootId": "B21vbml0b3IAEA",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"17": {
				"final": false,
				"name": "_format",
				"id": 17,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"18": {
				"final": false,
				"name": "value",
				"id": 18,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"304": {
				"final": false,
				"name": "counterValues",
				"id": 304,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 300,
				"dependency": null
			}
		}
	},
	"49": {
		"name": "WriteCounterData",
		"app": "monitor",
		"version": 36,
		"since": 4,
		"type": "DATA_TRANSFER_TYPE",
		"id": 49,
		"rootId": "B21vbml0b3IAMQ",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"50": {
				"final": false,
				"name": "_format",
				"id": 50,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"51": {
				"final": false,
				"name": "row",
				"id": 51,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"52": {
				"final": false,
				"name": "column",
				"id": 52,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"53": {
				"final": false,
				"name": "value",
				"id": 53,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"215": {
				"final": false,
				"name": "counterType",
				"id": 215,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"221": {
		"name": "ApprovalMail",
		"app": "monitor",
		"version": 36,
		"since": 14,
		"type": "LIST_ELEMENT_TYPE",
		"id": 221,
		"rootId": "B21vbml0b3IAAN0",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"223": {
				"final": true,
				"name": "_id",
				"id": 223,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"224": {
				"final": true,
				"name": "_permissions",
				"id": 224,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"225": {
				"final": false,
				"name": "_format",
				"id": 225,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"226": {
				"final": true,
				"name": "_ownerGroup",
				"id": 226,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"227": {
				"final": true,
				"name": "range",
				"id": 227,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"228": {
				"final": true,
				"name": "date",
				"id": 228,
				"type": "Date",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"229": {
				"final": true,
				"name": "text",
				"id": 229,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"230": {
				"final": true,
				"name": "customer",
				"id": 230,
				"type": "ELEMENT_ASSOCIATION",
				"cardinality": "ZeroOrOne",
				"refTypeId": 31,
				"dependency": "sys"
			}
		}
	},
	"300": {
		"name": "CounterValue",
		"app": "monitor",
		"version": 36,
		"since": 22,
		"type": "AGGREGATED_TYPE",
		"id": 300,
		"rootId": "B21vbml0b3IAASw",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"301": {
				"final": true,
				"name": "_id",
				"id": 301,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"302": {
				"final": false,
				"name": "counterId",
				"id": 302,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"303": {
				"final": false,
				"name": "value",
				"id": 303,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"305": {
		"name": "ErrorReportFile",
		"app": "monitor",
		"version": 36,
		"since": 23,
		"type": "AGGREGATED_TYPE",
		"id": 305,
		"rootId": "B21vbml0b3IAATE",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"306": {
				"final": true,
				"name": "_id",
				"id": 306,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"307": {
				"final": true,
				"name": "name",
				"id": 307,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"308": {
				"final": true,
				"name": "content",
				"id": 308,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"316": {
		"name": "ErrorReportData",
		"app": "monitor",
		"version": 36,
		"since": 23,
		"type": "AGGREGATED_TYPE",
		"id": 316,
		"rootId": "B21vbml0b3IAATw",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"317": {
				"final": true,
				"name": "_id",
				"id": 317,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"318": {
				"final": true,
				"name": "time",
				"id": 318,
				"type": "Date",
				"cardinality": "One",
				"encrypted": false
			},
			"319": {
				"final": true,
				"name": "appVersion",
				"id": 319,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"320": {
				"final": true,
				"name": "clientType",
				"id": 320,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"321": {
				"final": true,
				"name": "userId",
				"id": 321,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"322": {
				"final": true,
				"name": "errorClass",
				"id": 322,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"323": {
				"final": true,
				"name": "errorMessage",
				"id": 323,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"324": {
				"final": true,
				"name": "stackTrace",
				"id": 324,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"325": {
				"final": true,
				"name": "userMessage",
				"id": 325,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"326": {
				"final": true,
				"name": "additionalInfo",
				"id": 326,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"335": {
		"name": "ReportErrorIn",
		"app": "monitor",
		"version": 36,
		"since": 23,
		"type": "DATA_TRANSFER_TYPE",
		"id": 335,
		"rootId": "B21vbml0b3IAAU8",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"336": {
				"final": false,
				"name": "_format",
				"id": 336,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"337": {
				"final": false,
				"name": "data",
				"id": 337,
				"type": "AGGREGATION",
				"cardinality": "One",
				"refTypeId": 316,
				"dependency": null
			},
			"338": {
				"final": false,
				"name": "files",
				"id": 338,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 305,
				"dependency": null
			}
		}
	}
}