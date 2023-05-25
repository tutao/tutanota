// This is an automatically generated file, please do not edit by hand!

// You should not use it directly, please use `resolveTypReference()` instead.	
// We do not want tsc to spend time either checking or inferring type of these huge expressions. Even when it does try to infer them they are still wrong.
// The actual type is an object with keys as entities names and values as TypeModel.

/** @type {any} */
export const typeModels = {
    "ApprovalMail": {
        "name": "ApprovalMail",
        "since": 14,
        "type": "LIST_ELEMENT_TYPE",
        "id": 221,
        "rootId": "B21vbml0b3IAAN0",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 225,
                "since": 14,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 223,
                "since": 14,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 226,
                "since": 14,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 224,
                "since": 14,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "date": {
                "final": true,
                "name": "date",
                "id": 228,
                "since": 14,
                "type": "Date",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "range": {
                "final": true,
                "name": "range",
                "id": 227,
                "since": 14,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "text": {
                "final": true,
                "name": "text",
                "id": 229,
                "since": 14,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "customer": {
                "final": true,
                "name": "customer",
                "id": 230,
                "since": 14,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "Customer",
                "dependency": null
            }
        },
        "app": "monitor",
        "version": "22"
    },
    "CounterValue": {
        "name": "CounterValue",
        "since": 22,
        "type": "AGGREGATED_TYPE",
        "id": 300,
        "rootId": "B21vbml0b3IAASw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 301,
                "since": 22,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "counterId": {
                "final": false,
                "name": "counterId",
                "id": 302,
                "since": 22,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "value": {
                "final": false,
                "name": "value",
                "id": 303,
                "since": 22,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "monitor",
        "version": "22"
    },
    "ReadCounterData": {
        "name": "ReadCounterData",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 12,
        "rootId": "B21vbml0b3IADA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 13,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "columnName": {
                "final": false,
                "name": "columnName",
                "id": 15,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "counterType": {
                "final": false,
                "name": "counterType",
                "id": 299,
                "since": 22,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "rowName": {
                "final": false,
                "name": "rowName",
                "id": 14,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "monitor",
        "version": "22"
    },
    "ReadCounterReturn": {
        "name": "ReadCounterReturn",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 16,
        "rootId": "B21vbml0b3IAEA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 17,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "value": {
                "final": false,
                "name": "value",
                "id": 18,
                "since": 1,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {
            "counterValues": {
                "final": false,
                "name": "counterValues",
                "id": 304,
                "since": 22,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "CounterValue",
                "dependency": null
            }
        },
        "app": "monitor",
        "version": "22"
    },
    "WriteCounterData": {
        "name": "WriteCounterData",
        "since": 4,
        "type": "DATA_TRANSFER_TYPE",
        "id": 49,
        "rootId": "B21vbml0b3IAMQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 50,
                "since": 4,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "column": {
                "final": false,
                "name": "column",
                "id": 52,
                "since": 4,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "counterType": {
                "final": false,
                "name": "counterType",
                "id": 215,
                "since": 12,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "row": {
                "final": false,
                "name": "row",
                "id": 51,
                "since": 4,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "value": {
                "final": false,
                "name": "value",
                "id": 53,
                "since": 4,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "monitor",
        "version": "22"
    }
}