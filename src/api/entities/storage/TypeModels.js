// This is an automatically generated file, please do not edit by hand!

// You should not use it directly, please use `resolveTypReference()` instead.	
// We do not want tsc to spend time either checking or inferring type of these huge expressions. Even when it does try to infer them they are still wrong.
// The actual type is an object with keys as entities names and values as TypeModel.

/** @type {any} */
export const typeModels = {
    "BlobAccessTokenPostIn": {
        "name": "BlobAccessTokenPostIn",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 77,
        "rootId": "B3N0b3JhZ2UATQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 78,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "archiveDataType": {
                "final": false,
                "name": "archiveDataType",
                "id": 180,
                "since": 4,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {
            "read": {
                "final": true,
                "name": "read",
                "id": 181,
                "since": 4,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "BlobReadData",
                "dependency": null
            },
            "write": {
                "final": false,
                "name": "write",
                "id": 80,
                "since": 1,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "BlobWriteData",
                "dependency": null
            }
        },
        "app": "storage",
        "version": "7"
    },
    "BlobAccessTokenPostOut": {
        "name": "BlobAccessTokenPostOut",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 81,
        "rootId": "B3N0b3JhZ2UAUQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 82,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "blobAccessInfo": {
                "final": false,
                "name": "blobAccessInfo",
                "id": 161,
                "since": 4,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "BlobServerAccessInfo",
                "dependency": null
            }
        },
        "app": "storage",
        "version": "7"
    },
    "BlobArchiveRef": {
        "name": "BlobArchiveRef",
        "since": 4,
        "type": "LIST_ELEMENT_TYPE",
        "id": 129,
        "rootId": "B3N0b3JhZ2UAAIE",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 133,
                "since": 4,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 131,
                "since": 4,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 134,
                "since": 4,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 132,
                "since": 4,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "archive": {
                "final": false,
                "name": "archive",
                "id": 135,
                "since": 4,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Archive",
                "dependency": null
            }
        },
        "app": "storage",
        "version": "7"
    },
    "BlobGetIn": {
        "name": "BlobGetIn",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 50,
        "rootId": "B3N0b3JhZ2UAMg",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 51,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "archiveId": {
                "final": false,
                "name": "archiveId",
                "id": 52,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "blobId": {
                "final": false,
                "name": "blobId",
                "id": 110,
                "since": 3,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "storage",
        "version": "7"
    },
    "BlobId": {
        "name": "BlobId",
        "since": 4,
        "type": "AGGREGATED_TYPE",
        "id": 144,
        "rootId": "B3N0b3JhZ2UAAJA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 145,
                "since": 4,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "blobId": {
                "final": false,
                "name": "blobId",
                "id": 146,
                "since": 4,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "storage",
        "version": "7"
    },
    "BlobPostOut": {
        "name": "BlobPostOut",
        "since": 4,
        "type": "DATA_TRANSFER_TYPE",
        "id": 125,
        "rootId": "B3N0b3JhZ2UAfQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 126,
                "since": 4,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "blobReferenceToken": {
                "final": false,
                "name": "blobReferenceToken",
                "id": 127,
                "since": 4,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "storage",
        "version": "7"
    },
    "BlobReadData": {
        "name": "BlobReadData",
        "since": 4,
        "type": "AGGREGATED_TYPE",
        "id": 175,
        "rootId": "B3N0b3JhZ2UAAK8",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 176,
                "since": 4,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "archiveId": {
                "final": false,
                "name": "archiveId",
                "id": 177,
                "since": 4,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "instanceListId": {
                "final": true,
                "name": "instanceListId",
                "id": 178,
                "since": 4,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {
            "instanceIds": {
                "final": true,
                "name": "instanceIds",
                "id": 179,
                "since": 4,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "InstanceId",
                "dependency": null
            }
        },
        "app": "storage",
        "version": "7"
    },
    "BlobReferenceDeleteIn": {
        "name": "BlobReferenceDeleteIn",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 100,
        "rootId": "B3N0b3JhZ2UAZA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 101,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "archiveDataType": {
                "final": false,
                "name": "archiveDataType",
                "id": 124,
                "since": 4,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "instanceId": {
                "final": false,
                "name": "instanceId",
                "id": 103,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "instanceListId": {
                "final": false,
                "name": "instanceListId",
                "id": 102,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {
            "blobs": {
                "final": true,
                "name": "blobs",
                "id": 105,
                "since": 1,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "Blob",
                "dependency": "sys"
            }
        },
        "app": "storage",
        "version": "7"
    },
    "BlobReferencePutIn": {
        "name": "BlobReferencePutIn",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 94,
        "rootId": "B3N0b3JhZ2UAXg",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 95,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "archiveDataType": {
                "final": false,
                "name": "archiveDataType",
                "id": 123,
                "since": 4,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "instanceId": {
                "final": false,
                "name": "instanceId",
                "id": 107,
                "since": 2,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "instanceListId": {
                "final": false,
                "name": "instanceListId",
                "id": 97,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {
            "referenceTokens": {
                "final": true,
                "name": "referenceTokens",
                "id": 122,
                "since": 4,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "BlobReferenceTokenWrapper",
                "dependency": "sys"
            }
        },
        "app": "storage",
        "version": "7"
    },
    "BlobServerAccessInfo": {
        "name": "BlobServerAccessInfo",
        "since": 4,
        "type": "AGGREGATED_TYPE",
        "id": 157,
        "rootId": "B3N0b3JhZ2UAAJ0",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 158,
                "since": 4,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "blobAccessToken": {
                "final": false,
                "name": "blobAccessToken",
                "id": 159,
                "since": 4,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "expires": {
                "final": false,
                "name": "expires",
                "id": 192,
                "since": 6,
                "type": "Date",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "servers": {
                "final": false,
                "name": "servers",
                "id": 160,
                "since": 4,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "BlobServerUrl",
                "dependency": null
            }
        },
        "app": "storage",
        "version": "7"
    },
    "BlobServerUrl": {
        "name": "BlobServerUrl",
        "since": 4,
        "type": "AGGREGATED_TYPE",
        "id": 154,
        "rootId": "B3N0b3JhZ2UAAJo",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 155,
                "since": 4,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "url": {
                "final": false,
                "name": "url",
                "id": 156,
                "since": 4,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "storage",
        "version": "7"
    },
    "BlobWriteData": {
        "name": "BlobWriteData",
        "since": 1,
        "type": "AGGREGATED_TYPE",
        "id": 73,
        "rootId": "B3N0b3JhZ2UASQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 74,
                "since": 1,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "archiveOwnerGroup": {
                "final": false,
                "name": "archiveOwnerGroup",
                "id": 75,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "storage",
        "version": "7"
    },
    "InstanceId": {
        "name": "InstanceId",
        "since": 4,
        "type": "AGGREGATED_TYPE",
        "id": 172,
        "rootId": "B3N0b3JhZ2UAAKw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 173,
                "since": 4,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "instanceId": {
                "final": true,
                "name": "instanceId",
                "id": 174,
                "since": 4,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "storage",
        "version": "7"
    }
}