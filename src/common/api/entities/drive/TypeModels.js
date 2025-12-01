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
			"13": {
				"final": true,
				"name": "originalParent",
				"id": 13,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "ZeroOrOne",
				"refTypeId": 0,
				"dependency": null
			},
			"38": {
				"final": true,
				"name": "files",
				"id": 38,
				"type": "LIST_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 30,
				"dependency": null
			}
		}
	},
	"14": {
		"name": "DriveFile",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "LIST_ELEMENT_TYPE",
		"id": 14,
		"rootId": "BWRyaXZlAA4",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"16": {
				"final": true,
				"name": "_id",
				"id": 16,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"17": {
				"final": true,
				"name": "_permissions",
				"id": 17,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"18": {
				"final": false,
				"name": "_format",
				"id": 18,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"19": {
				"final": true,
				"name": "_ownerGroup",
				"id": 19,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"20": {
				"final": true,
				"name": "_ownerEncSessionKey",
				"id": 20,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"21": {
				"final": true,
				"name": "_ownerKeyVersion",
				"id": 21,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"22": {
				"final": true,
				"name": "name",
				"id": 22,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"23": {
				"final": true,
				"name": "size",
				"id": 23,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"24": {
				"final": true,
				"name": "mimeType",
				"id": 24,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"25": {
				"final": true,
				"name": "createdDate",
				"id": 25,
				"type": "Date",
				"cardinality": "One",
				"encrypted": true
			},
			"26": {
				"final": true,
				"name": "updatedDate",
				"id": 26,
				"type": "Date",
				"cardinality": "One",
				"encrypted": true
			}
		},
		"associations": {
			"27": {
				"final": true,
				"name": "folder",
				"id": 27,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 0,
				"dependency": null
			},
			"28": {
				"final": true,
				"name": "blobs",
				"id": 28,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 1882,
				"dependency": "sys"
			},
			"29": {
				"final": true,
				"name": "originalParent",
				"id": 29,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "ZeroOrOne",
				"refTypeId": 0,
				"dependency": null
			}
		}
	},
	"30": {
		"name": "DriveFileRef",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "LIST_ELEMENT_TYPE",
		"id": 30,
		"rootId": "BWRyaXZlAB4",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"32": {
				"final": true,
				"name": "_id",
				"id": 32,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"33": {
				"final": true,
				"name": "_permissions",
				"id": 33,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"34": {
				"final": false,
				"name": "_format",
				"id": 34,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"35": {
				"final": true,
				"name": "_ownerGroup",
				"id": 35,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"36": {
				"final": true,
				"name": "file",
				"id": 36,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "ZeroOrOne",
				"refTypeId": 14,
				"dependency": null
			},
			"37": {
				"final": true,
				"name": "folder",
				"id": 37,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "ZeroOrOne",
				"refTypeId": 0,
				"dependency": null
			}
		}
	},
	"39": {
		"name": "DriveFileBag",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "AGGREGATED_TYPE",
		"id": 39,
		"rootId": "BWRyaXZlACc",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"40": {
				"final": true,
				"name": "_id",
				"id": 40,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"41": {
				"final": true,
				"name": "files",
				"id": 41,
				"type": "LIST_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 14,
				"dependency": null
			}
		}
	},
	"42": {
		"name": "DriveFolderBag",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "AGGREGATED_TYPE",
		"id": 42,
		"rootId": "BWRyaXZlACo",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"43": {
				"final": true,
				"name": "_id",
				"id": 43,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"44": {
				"final": true,
				"name": "folders",
				"id": 44,
				"type": "LIST_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 0,
				"dependency": null
			}
		}
	},
	"45": {
		"name": "DriveGroupRoot",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "ELEMENT_TYPE",
		"id": 45,
		"rootId": "BWRyaXZlAC0",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"47": {
				"final": true,
				"name": "_id",
				"id": 47,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"48": {
				"final": true,
				"name": "_permissions",
				"id": 48,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"49": {
				"final": false,
				"name": "_format",
				"id": 49,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"50": {
				"final": true,
				"name": "_ownerGroup",
				"id": 50,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"51": {
				"final": false,
				"name": "fileBags",
				"id": 51,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 39,
				"dependency": null
			},
			"52": {
				"final": false,
				"name": "folderBags",
				"id": 52,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 42,
				"dependency": null
			},
			"53": {
				"final": false,
				"name": "root",
				"id": 53,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 0,
				"dependency": null
			},
			"54": {
				"final": false,
				"name": "trash",
				"id": 54,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 0,
				"dependency": null
			}
		}
	},
	"55": {
		"name": "DriveUploadedFile",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "AGGREGATED_TYPE",
		"id": 55,
		"rootId": "BWRyaXZlADc",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"56": {
				"final": true,
				"name": "_id",
				"id": 56,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"57": {
				"final": true,
				"name": "fileName",
				"id": 57,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"58": {
				"final": true,
				"name": "mimeType",
				"id": 58,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"59": {
				"final": true,
				"name": "createdDate",
				"id": 59,
				"type": "Date",
				"cardinality": "One",
				"encrypted": true
			},
			"60": {
				"final": true,
				"name": "updatedDate",
				"id": 60,
				"type": "Date",
				"cardinality": "One",
				"encrypted": true
			},
			"61": {
				"final": true,
				"name": "ownerEncSessionKey",
				"id": 61,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"62": {
				"final": true,
				"name": "referenceTokens",
				"id": 62,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 1990,
				"dependency": "sys"
			}
		}
	},
	"63": {
		"name": "DriveCreateData",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "DATA_TRANSFER_TYPE",
		"id": 63,
		"rootId": "BWRyaXZlAD8",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"64": {
				"final": false,
				"name": "_format",
				"id": 64,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"65": {
				"final": true,
				"name": "parent",
				"id": 65,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 0,
				"dependency": null
			},
			"66": {
				"final": true,
				"name": "uploadedFile",
				"id": 66,
				"type": "AGGREGATION",
				"cardinality": "One",
				"refTypeId": 55,
				"dependency": null
			}
		}
	},
	"67": {
		"name": "DriveCreateReturn",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "DATA_TRANSFER_TYPE",
		"id": 67,
		"rootId": "BWRyaXZlAEM",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"68": {
				"final": false,
				"name": "_format",
				"id": 68,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"69": {
				"final": false,
				"name": "createdFile",
				"id": 69,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 14,
				"dependency": null
			}
		}
	},
	"70": {
		"name": "DrivePutIn",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "DATA_TRANSFER_TYPE",
		"id": 70,
		"rootId": "BWRyaXZlAEY",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"71": {
				"final": false,
				"name": "_format",
				"id": 71,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"72": {
				"final": true,
				"name": "newName",
				"id": 72,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"73": {
				"final": true,
				"name": "updatedDate",
				"id": 73,
				"type": "Date",
				"cardinality": "One",
				"encrypted": true
			}
		},
		"associations": {
			"74": {
				"final": true,
				"name": "file",
				"id": 74,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "ZeroOrOne",
				"refTypeId": 14,
				"dependency": null
			},
			"75": {
				"final": true,
				"name": "folder",
				"id": 75,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "ZeroOrOne",
				"refTypeId": 0,
				"dependency": null
			}
		}
	},
	"76": {
		"name": "DriveDeleteIn",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "DATA_TRANSFER_TYPE",
		"id": 76,
		"rootId": "BWRyaXZlAEw",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"77": {
				"final": false,
				"name": "_format",
				"id": 77,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"78": {
				"final": false,
				"name": "fileToDelete",
				"id": 78,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 14,
				"dependency": null
			}
		}
	},
	"79": {
		"name": "DriveDeleteOut",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "DATA_TRANSFER_TYPE",
		"id": 79,
		"rootId": "BWRyaXZlAE8",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"80": {
				"final": false,
				"name": "_format",
				"id": 80,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"82": {
		"name": "DriveFolderServicePostIn",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "DATA_TRANSFER_TYPE",
		"id": 82,
		"rootId": "BWRyaXZlAFI",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"83": {
				"final": false,
				"name": "_format",
				"id": 83,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"84": {
				"final": true,
				"name": "folderName",
				"id": 84,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"85": {
				"final": true,
				"name": "createdDate",
				"id": 85,
				"type": "Date",
				"cardinality": "One",
				"encrypted": true
			},
			"86": {
				"final": true,
				"name": "updatedDate",
				"id": 86,
				"type": "Date",
				"cardinality": "One",
				"encrypted": true
			},
			"87": {
				"final": true,
				"name": "ownerEncSessionKey",
				"id": 87,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"88": {
				"final": true,
				"name": "parent",
				"id": 88,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 0,
				"dependency": null
			}
		}
	},
	"89": {
		"name": "DriveFolderServicePostOut",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "DATA_TRANSFER_TYPE",
		"id": 89,
		"rootId": "BWRyaXZlAFk",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"90": {
				"final": false,
				"name": "_format",
				"id": 90,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"91": {
				"final": true,
				"name": "folder",
				"id": 91,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 0,
				"dependency": null
			}
		}
	},
	"92": {
		"name": "DriveFolderServicePutIn",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "DATA_TRANSFER_TYPE",
		"id": 92,
		"rootId": "BWRyaXZlAFw",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"93": {
				"final": false,
				"name": "_format",
				"id": 93,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"94": {
				"final": true,
				"name": "file",
				"id": 94,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "ZeroOrOne",
				"refTypeId": 14,
				"dependency": null
			},
			"95": {
				"final": true,
				"name": "folder",
				"id": 95,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "ZeroOrOne",
				"refTypeId": 0,
				"dependency": null
			},
			"96": {
				"final": true,
				"name": "destination",
				"id": 96,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 0,
				"dependency": null
			}
		}
	},
	"97": {
		"name": "DriveFolderServicePutOut",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "DATA_TRANSFER_TYPE",
		"id": 97,
		"rootId": "BWRyaXZlAGE",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"98": {
				"final": false,
				"name": "_format",
				"id": 98,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"99": {
				"final": true,
				"name": "movedFile",
				"id": 99,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 30,
				"dependency": null
			}
		}
	},
	"100": {
		"name": "DriveFolderServiceDeleteIn",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "DATA_TRANSFER_TYPE",
		"id": 100,
		"rootId": "BWRyaXZlAGQ",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"101": {
				"final": false,
				"name": "_format",
				"id": 101,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"104": {
				"final": false,
				"name": "restore",
				"id": 104,
				"type": "Boolean",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"102": {
				"final": true,
				"name": "file",
				"id": 102,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "ZeroOrOne",
				"refTypeId": 14,
				"dependency": null
			},
			"103": {
				"final": true,
				"name": "folder",
				"id": 103,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "ZeroOrOne",
				"refTypeId": 0,
				"dependency": null
			}
		}
	}
}