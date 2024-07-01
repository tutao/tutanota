// This is an automatically generated file, please do not edit by hand!

// You should not use it directly, please use `resolveTypReference()` instead.	
// We do not want tsc to spend time either checking or inferring type of these huge expressions. Even when it does try to infer them they are still wrong.
// The actual type is an object with keys as entities names and values as TypeModel.

/** @type {any} */
export const typeModels = {
    "PersistenceResourcePostReturn": {
        "name": "PersistenceResourcePostReturn",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 0,
        "rootId": "BGJhc2UAAA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "generatedId": {
                "final": false,
                "name": "generatedId",
                "id": 2,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "permissionListId": {
                "final": false,
                "name": "permissionListId",
                "id": 3,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "base",
        "version": "1"
    }
}