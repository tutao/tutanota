// This is an automatically generated file, please do not edit by hand!

// You should not use it directly, please use `resolveTypReference()` instead.	
// We do not want tsc to spend time either checking or inferring type of these huge expressions. Even when it does try to infer them they are still wrong.
// The actual type is an object with keys as entities names and values as TypeModel.

/** @type {any} */
export const typeModels = {
    "UsageTestAssignment": {
        "name": "UsageTestAssignment",
        "since": 1,
        "type": "AGGREGATED_TYPE",
        "id": 56,
        "rootId": "BXVzYWdlADg",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 57,
                "since": 1,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "name": {
                "final": false,
                "name": "name",
                "id": 59,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "sendPings": {
                "final": false,
                "name": "sendPings",
                "id": 61,
                "since": 1,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "testId": {
                "final": true,
                "name": "testId",
                "id": 58,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "variant": {
                "final": true,
                "name": "variant",
                "id": 60,
                "since": 1,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {
            "stages": {
                "final": false,
                "name": "stages",
                "id": 62,
                "since": 1,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "UsageTestStage",
                "dependency": null
            }
        },
        "app": "usage",
        "version": "2"
    },
    "UsageTestAssignmentIn": {
        "name": "UsageTestAssignmentIn",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 53,
        "rootId": "BXVzYWdlADU",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 54,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "testDeviceId": {
                "final": false,
                "name": "testDeviceId",
                "id": 55,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "usage",
        "version": "2"
    },
    "UsageTestAssignmentOut": {
        "name": "UsageTestAssignmentOut",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 63,
        "rootId": "BXVzYWdlAD8",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 64,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "testDeviceId": {
                "final": false,
                "name": "testDeviceId",
                "id": 65,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "assignments": {
                "final": false,
                "name": "assignments",
                "id": 66,
                "since": 1,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "UsageTestAssignment",
                "dependency": null
            }
        },
        "app": "usage",
        "version": "2"
    },
    "UsageTestMetricConfig": {
        "name": "UsageTestMetricConfig",
        "since": 1,
        "type": "AGGREGATED_TYPE",
        "id": 12,
        "rootId": "BXVzYWdlAAw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 13,
                "since": 1,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "name": {
                "final": true,
                "name": "name",
                "id": 14,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "type": {
                "final": true,
                "name": "type",
                "id": 15,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "configValues": {
                "final": false,
                "name": "configValues",
                "id": 16,
                "since": 1,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "UsageTestMetricConfigValue",
                "dependency": null
            }
        },
        "app": "usage",
        "version": "2"
    },
    "UsageTestMetricConfigValue": {
        "name": "UsageTestMetricConfigValue",
        "since": 1,
        "type": "AGGREGATED_TYPE",
        "id": 8,
        "rootId": "BXVzYWdlAAg",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 9,
                "since": 1,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "key": {
                "final": false,
                "name": "key",
                "id": 10,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "value": {
                "final": false,
                "name": "value",
                "id": 11,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "usage",
        "version": "2"
    },
    "UsageTestMetricData": {
        "name": "UsageTestMetricData",
        "since": 1,
        "type": "AGGREGATED_TYPE",
        "id": 17,
        "rootId": "BXVzYWdlABE",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 18,
                "since": 1,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "name": {
                "final": true,
                "name": "name",
                "id": 19,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "value": {
                "final": true,
                "name": "value",
                "id": 20,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "usage",
        "version": "2"
    },
    "UsageTestParticipationIn": {
        "name": "UsageTestParticipationIn",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 80,
        "rootId": "BXVzYWdlAFA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 81,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "stage": {
                "final": false,
                "name": "stage",
                "id": 83,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "testDeviceId": {
                "final": false,
                "name": "testDeviceId",
                "id": 84,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "testId": {
                "final": false,
                "name": "testId",
                "id": 82,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "metrics": {
                "final": false,
                "name": "metrics",
                "id": 85,
                "since": 1,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "UsageTestMetricData",
                "dependency": null
            }
        },
        "app": "usage",
        "version": "2"
    },
    "UsageTestStage": {
        "name": "UsageTestStage",
        "since": 1,
        "type": "AGGREGATED_TYPE",
        "id": 35,
        "rootId": "BXVzYWdlACM",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 36,
                "since": 1,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "maxPings": {
                "final": false,
                "name": "maxPings",
                "id": 88,
                "since": 2,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "minPings": {
                "final": false,
                "name": "minPings",
                "id": 87,
                "since": 2,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "name": {
                "final": false,
                "name": "name",
                "id": 37,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "metrics": {
                "final": false,
                "name": "metrics",
                "id": 38,
                "since": 1,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "UsageTestMetricConfig",
                "dependency": null
            }
        },
        "app": "usage",
        "version": "2"
    }
}