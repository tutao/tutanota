// This is an automatically generated file, please do not edit by hand!

// You should not use it directly, please use `resolveTypReference()` instead.	
// We do not want tsc to spend time either checking or inferring type of these huge expressions. Even when it does try to infer them they are still wrong.
// The actual type is an object with keys as entities names and values as TypeModel.

/** @type {any} */
export const typeModels = {
	"0": {
		"name": "DriveFolder",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "LIST_ELEMENT_TYPE",
		"id": 0,
		"rootId": "BWRyaXZlAAA",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"2": {
				"final": true,
				"name": "_id",
				"id": 2,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"3": {
				"final": true,
				"name": "_permissions",
				"id": 3,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"4": {
				"final": false,
				"name": "_format",
				"id": 4,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"5": {
				"final": true,
				"name": "_ownerGroup",
				"id": 5,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"6": {
				"final": true,
				"name": "_ownerEncSessionKey",
				"id": 6,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"7": {
				"final": true,
				"name": "_ownerKeyVersion",
				"id": 7,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"8": {
				"final": true,
				"name": "type",
				"id": 8,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"9": {
				"final": true,
				"name": "name",
				"id": 9,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"10": {
				"final": true,
				"name": "createdDate",
				"id": 10,
				"type": "Date",
				"cardinality": "One",
				"encrypted": true
			},
			"11": {
				"final": true,
				"name": "updatedDate",
				"id": 11,
				"type": "Date",
				"cardinality": "One",
				"encrypted": true
			}
		},
		"associations": {
			"12": {
				"final": true,
				"name": "parent",
				"id": 12,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "ZeroOrOne",
				"refTypeId": 0,
				"dependency": null
			},
			"36": {
				"final": true,
				"name": "files",
				"id": 36,
				"type": "LIST_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 28,
				"dependency": null
			}
		}
	},
	"13": {
		"name": "DriveFile",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "LIST_ELEMENT_TYPE",
		"id": 13,
		"rootId": "BWRyaXZlAA0",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"15": {
				"final": true,
				"name": "_id",
				"id": 15,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"16": {
				"final": true,
				"name": "_permissions",
				"id": 16,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"17": {
				"final": false,
				"name": "_format",
				"id": 17,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"18": {
				"final": true,
				"name": "_ownerGroup",
				"id": 18,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"19": {
				"final": true,
				"name": "_ownerEncSessionKey",
				"id": 19,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"20": {
				"final": true,
				"name": "_ownerKeyVersion",
				"id": 20,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"21": {
				"final": true,
				"name": "name",
				"id": 21,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"22": {
				"final": true,
				"name": "size",
				"id": 22,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"23": {
				"final": true,
				"name": "mimeType",
				"id": 23,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"24": {
				"final": true,
				"name": "createdDate",
				"id": 24,
				"type": "Date",
				"cardinality": "One",
				"encrypted": true
			},
			"25": {
				"final": true,
				"name": "updatedDate",
				"id": 25,
				"type": "Date",
				"cardinality": "One",
				"encrypted": true
			}
		},
		"associations": {
			"26": {
				"final": true,
				"name": "folder",
				"id": 26,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 0,
				"dependency": null
			},
			"27": {
				"final": true,
				"name": "blobs",
				"id": 27,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 1882,
				"dependency": "sys"
			}
		}
	},
	"28": {
		"name": "DriveFileRef",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "LIST_ELEMENT_TYPE",
		"id": 28,
		"rootId": "BWRyaXZlABw",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"30": {
				"final": true,
				"name": "_id",
				"id": 30,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"31": {
				"final": true,
				"name": "_permissions",
				"id": 31,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"32": {
				"final": false,
				"name": "_format",
				"id": 32,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"33": {
				"final": true,
				"name": "_ownerGroup",
				"id": 33,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"34": {
				"final": true,
				"name": "file",
				"id": 34,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "ZeroOrOne",
				"refTypeId": 13,
				"dependency": null
			},
			"35": {
				"final": true,
				"name": "folder",
				"id": 35,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "ZeroOrOne",
				"refTypeId": 0,
				"dependency": null
			}
		}
	},
	"37": {
		"name": "DriveFileBag",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "AGGREGATED_TYPE",
		"id": 37,
		"rootId": "BWRyaXZlACU",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"38": {
				"final": true,
				"name": "_id",
				"id": 38,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"39": {
				"final": true,
				"name": "files",
				"id": 39,
				"type": "LIST_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 13,
				"dependency": null
			}
		}
	},
	"40": {
		"name": "DriveFolderBag",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "AGGREGATED_TYPE",
		"id": 40,
		"rootId": "BWRyaXZlACg",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"41": {
				"final": true,
				"name": "_id",
				"id": 41,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"42": {
				"final": true,
				"name": "folders",
				"id": 42,
				"type": "LIST_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 0,
				"dependency": null
			}
		}
	},
	"43": {
		"name": "DriveGroupRoot",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "ELEMENT_TYPE",
		"id": 43,
		"rootId": "BWRyaXZlACs",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"45": {
				"final": true,
				"name": "_id",
				"id": 45,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"46": {
				"final": true,
				"name": "_permissions",
				"id": 46,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"47": {
				"final": false,
				"name": "_format",
				"id": 47,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"48": {
				"final": true,
				"name": "_ownerGroup",
				"id": 48,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"49": {
				"final": false,
				"name": "fileBags",
				"id": 49,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 37,
				"dependency": null
			},
			"50": {
				"final": false,
				"name": "folderBags",
				"id": 50,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 40,
				"dependency": null
			},
			"51": {
				"final": false,
				"name": "root",
				"id": 51,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 0,
				"dependency": null
			},
			"52": {
				"final": false,
				"name": "trash",
				"id": 52,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 0,
				"dependency": null
			}
		}
	},
	"53": {
		"name": "DriveUploadedFile",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "AGGREGATED_TYPE",
		"id": 53,
		"rootId": "BWRyaXZlADU",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"54": {
				"final": true,
				"name": "_id",
				"id": 54,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"55": {
				"final": true,
				"name": "fileName",
				"id": 55,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"56": {
				"final": true,
				"name": "mimeType",
				"id": 56,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"57": {
				"final": true,
				"name": "createdDate",
				"id": 57,
				"type": "Date",
				"cardinality": "One",
				"encrypted": true
			},
			"58": {
				"final": true,
				"name": "updatedDate",
				"id": 58,
				"type": "Date",
				"cardinality": "One",
				"encrypted": true
			},
			"59": {
				"final": true,
				"name": "ownerEncSessionKey",
				"id": 59,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"60": {
				"final": true,
				"name": "referenceTokens",
				"id": 60,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 1990,
				"dependency": "sys"
			}
		}
	},
	"61": {
		"name": "DriveCreateData",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "DATA_TRANSFER_TYPE",
		"id": 61,
		"rootId": "BWRyaXZlAD0",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"62": {
				"final": false,
				"name": "_format",
				"id": 62,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"63": {
				"final": true,
				"name": "parent",
				"id": 63,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 0,
				"dependency": null
			},
			"64": {
				"final": true,
				"name": "uploadedFile",
				"id": 64,
				"type": "AGGREGATION",
				"cardinality": "One",
				"refTypeId": 53,
				"dependency": null
			}
		}
	},
	"65": {
		"name": "DriveCreateReturn",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "DATA_TRANSFER_TYPE",
		"id": 65,
		"rootId": "BWRyaXZlAEE",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"66": {
				"final": false,
				"name": "_format",
				"id": 66,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"67": {
				"final": false,
				"name": "createdFile",
				"id": 67,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 13,
				"dependency": null
			}
		}
	},
	"68": {
		"name": "DriveDeleteIn",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "DATA_TRANSFER_TYPE",
		"id": 68,
		"rootId": "BWRyaXZlAEQ",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"69": {
				"final": false,
				"name": "_format",
				"id": 69,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"70": {
				"final": false,
				"name": "fileToDelete",
				"id": 70,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 13,
				"dependency": null
			}
		}
	},
	"71": {
		"name": "DriveDeleteOut",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "DATA_TRANSFER_TYPE",
		"id": 71,
		"rootId": "BWRyaXZlAEc",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"72": {
				"final": false,
				"name": "_format",
				"id": 72,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {}
	}
}