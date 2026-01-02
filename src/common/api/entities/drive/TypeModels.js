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
				"encrypted": false
			},
			"11": {
				"final": true,
				"name": "updatedDate",
				"id": 11,
				"type": "Date",
				"cardinality": "One",
				"encrypted": false
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
				"encrypted": false
			},
			"26": {
				"final": true,
				"name": "updatedDate",
				"id": 26,
				"type": "Date",
				"cardinality": "One",
				"encrypted": false
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
				"refTypeId": 55,
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
				"refTypeId": 14,
				"dependency": null
			}
		}
	},
	"68": {
		"name": "DrivePutIn",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "DATA_TRANSFER_TYPE",
		"id": 68,
		"rootId": "BWRyaXZlAEQ",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"69": {
				"final": false,
				"name": "_format",
				"id": 69,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"70": {
				"final": true,
				"name": "newName",
				"id": 70,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			}
		},
		"associations": {
			"71": {
				"final": true,
				"name": "file",
				"id": 71,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "ZeroOrOne",
				"refTypeId": 14,
				"dependency": null
			},
			"72": {
				"final": true,
				"name": "folder",
				"id": 72,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "ZeroOrOne",
				"refTypeId": 0,
				"dependency": null
			}
		}
	},
	"73": {
		"name": "DriveDeleteIn",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "DATA_TRANSFER_TYPE",
		"id": 73,
		"rootId": "BWRyaXZlAEk",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"74": {
				"final": false,
				"name": "_format",
				"id": 74,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"75": {
				"final": false,
				"name": "files",
				"id": 75,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "Any",
				"refTypeId": 14,
				"dependency": null
			},
			"76": {
				"final": false,
				"name": "folders",
				"id": 76,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "Any",
				"refTypeId": 0,
				"dependency": null
			}
		}
	},
	"78": {
		"name": "DriveFolderServicePostIn",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "DATA_TRANSFER_TYPE",
		"id": 78,
		"rootId": "BWRyaXZlAE4",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"79": {
				"final": false,
				"name": "_format",
				"id": 79,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"80": {
				"final": true,
				"name": "folderName",
				"id": 80,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"81": {
				"final": true,
				"name": "ownerEncSessionKey",
				"id": 81,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"82": {
				"final": true,
				"name": "parent",
				"id": 82,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 0,
				"dependency": null
			}
		}
	},
	"83": {
		"name": "DriveFolderServicePostOut",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "DATA_TRANSFER_TYPE",
		"id": 83,
		"rootId": "BWRyaXZlAFM",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"84": {
				"final": false,
				"name": "_format",
				"id": 84,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"85": {
				"final": true,
				"name": "folder",
				"id": 85,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 0,
				"dependency": null
			}
		}
	},
	"86": {
		"name": "DriveFolderServicePutIn",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "DATA_TRANSFER_TYPE",
		"id": 86,
		"rootId": "BWRyaXZlAFY",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"87": {
				"final": false,
				"name": "_format",
				"id": 87,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"88": {
				"final": true,
				"name": "files",
				"id": 88,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "Any",
				"refTypeId": 14,
				"dependency": null
			},
			"89": {
				"final": true,
				"name": "folders",
				"id": 89,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "Any",
				"refTypeId": 0,
				"dependency": null
			},
			"90": {
				"final": true,
				"name": "destination",
				"id": 90,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 0,
				"dependency": null
			}
		}
	},
	"91": {
		"name": "DriveFolderServiceDeleteIn",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "DATA_TRANSFER_TYPE",
		"id": 91,
		"rootId": "BWRyaXZlAFs",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"92": {
				"final": false,
				"name": "_format",
				"id": 92,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"95": {
				"final": false,
				"name": "restore",
				"id": 95,
				"type": "Boolean",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"93": {
				"final": true,
				"name": "files",
				"id": 93,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "Any",
				"refTypeId": 14,
				"dependency": null
			},
			"94": {
				"final": true,
				"name": "folders",
				"id": 94,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "Any",
				"refTypeId": 0,
				"dependency": null
			}
		}
	},
	"97": {
		"name": "DriveRenameData",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "AGGREGATED_TYPE",
		"id": 97,
		"rootId": "BWRyaXZlAGE",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"98": {
				"final": true,
				"name": "_id",
				"id": 98,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"99": {
				"final": true,
				"name": "encNewName",
				"id": 99,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"100": {
				"final": true,
				"name": "file",
				"id": 100,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "ZeroOrOne",
				"refTypeId": 14,
				"dependency": null
			},
			"101": {
				"final": true,
				"name": "folder",
				"id": 101,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "ZeroOrOne",
				"refTypeId": 0,
				"dependency": null
			}
		}
	},
	"102": {
		"name": "DriveCopyServicePostIn",
		"app": "drive",
		"version": 1,
		"since": 1,
		"type": "DATA_TRANSFER_TYPE",
		"id": 102,
		"rootId": "BWRyaXZlAGY",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"103": {
				"final": false,
				"name": "_format",
				"id": 103,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"104": {
				"final": false,
				"name": "items",
				"id": 104,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 97,
				"dependency": null
			},
			"105": {
				"final": false,
				"name": "destination",
				"id": 105,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 0,
				"dependency": null
			}
		}
	}
}