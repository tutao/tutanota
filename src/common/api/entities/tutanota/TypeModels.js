// This is an automatically generated file, please do not edit by hand!

// You should not use it directly, please use `resolveTypReference()` instead.	
// We do not want tsc to spend time either checking or inferring type of these huge expressions. Even when it does try to infer them they are still wrong.
// The actual type is an object with keys as entities names and values as TypeModel.

/** @type {any} */
export const typeModels = {
	"11": {
		"name": "Subfiles",
		"app": "tutanota",
		"version": 98,
		"since": 1,
		"type": "AGGREGATED_TYPE",
		"id": 11,
		"rootId": "CHR1dGFub3RhAAs",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"12": {
				"final": true,
				"name": "_id",
				"id": 12,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"27": {
				"final": true,
				"name": "files",
				"id": 27,
				"type": "LIST_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 13,
				"dependency": null
			}
		}
	},
	"13": {
		"name": "File",
		"app": "tutanota",
		"version": 98,
		"since": 1,
		"type": "LIST_ELEMENT_TYPE",
		"id": 13,
		"rootId": "CHR1dGFub3RhAA0",
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
				"name": "_ownerEncSessionKey",
				"id": 18,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"21": {
				"final": false,
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
				"cardinality": "ZeroOrOne",
				"encrypted": true
			},
			"580": {
				"final": true,
				"name": "_ownerGroup",
				"id": 580,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"924": {
				"final": true,
				"name": "cid",
				"id": 924,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": true
			},
			"1391": {
				"final": true,
				"name": "_ownerKeyVersion",
				"id": 1391,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"25": {
				"final": true,
				"name": "parent",
				"id": 25,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "ZeroOrOne",
				"refTypeId": 13,
				"dependency": null
			},
			"26": {
				"final": true,
				"name": "subFiles",
				"id": 26,
				"type": "AGGREGATION",
				"cardinality": "ZeroOrOne",
				"refTypeId": 11,
				"dependency": null
			},
			"1225": {
				"final": true,
				"name": "blobs",
				"id": 1225,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 1882,
				"dependency": "sys"
			}
		}
	},
	"28": {
		"name": "FileSystem",
		"app": "tutanota",
		"version": 98,
		"since": 1,
		"type": "ELEMENT_TYPE",
		"id": 28,
		"rootId": "CHR1dGFub3RhABw",
		"versioned": false,
		"encrypted": true,
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
			"581": {
				"final": true,
				"name": "_ownerGroup",
				"id": 581,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"582": {
				"final": true,
				"name": "_ownerEncSessionKey",
				"id": 582,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1392": {
				"final": true,
				"name": "_ownerKeyVersion",
				"id": 1392,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"35": {
				"final": true,
				"name": "files",
				"id": 35,
				"type": "LIST_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 13,
				"dependency": null
			}
		}
	},
	"44": {
		"name": "ContactMailAddress",
		"app": "tutanota",
		"version": 98,
		"since": 1,
		"type": "AGGREGATED_TYPE",
		"id": 44,
		"rootId": "CHR1dGFub3RhACw",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"45": {
				"final": true,
				"name": "_id",
				"id": 45,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"46": {
				"final": false,
				"name": "type",
				"id": 46,
				"type": "Number",
				"cardinality": "One",
				"encrypted": true
			},
			"47": {
				"final": false,
				"name": "address",
				"id": 47,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"48": {
				"final": false,
				"name": "customTypeName",
				"id": 48,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			}
		},
		"associations": {}
	},
	"49": {
		"name": "ContactPhoneNumber",
		"app": "tutanota",
		"version": 98,
		"since": 1,
		"type": "AGGREGATED_TYPE",
		"id": 49,
		"rootId": "CHR1dGFub3RhADE",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"50": {
				"final": true,
				"name": "_id",
				"id": 50,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"51": {
				"final": false,
				"name": "type",
				"id": 51,
				"type": "Number",
				"cardinality": "One",
				"encrypted": true
			},
			"52": {
				"final": false,
				"name": "number",
				"id": 52,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"53": {
				"final": false,
				"name": "customTypeName",
				"id": 53,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			}
		},
		"associations": {}
	},
	"54": {
		"name": "ContactAddress",
		"app": "tutanota",
		"version": 98,
		"since": 1,
		"type": "AGGREGATED_TYPE",
		"id": 54,
		"rootId": "CHR1dGFub3RhADY",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"55": {
				"final": true,
				"name": "_id",
				"id": 55,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"56": {
				"final": false,
				"name": "type",
				"id": 56,
				"type": "Number",
				"cardinality": "One",
				"encrypted": true
			},
			"57": {
				"final": false,
				"name": "address",
				"id": 57,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"58": {
				"final": false,
				"name": "customTypeName",
				"id": 58,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			}
		},
		"associations": {}
	},
	"59": {
		"name": "ContactSocialId",
		"app": "tutanota",
		"version": 98,
		"since": 1,
		"type": "AGGREGATED_TYPE",
		"id": 59,
		"rootId": "CHR1dGFub3RhADs",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"60": {
				"final": true,
				"name": "_id",
				"id": 60,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"61": {
				"final": false,
				"name": "type",
				"id": 61,
				"type": "Number",
				"cardinality": "One",
				"encrypted": true
			},
			"62": {
				"final": false,
				"name": "socialId",
				"id": 62,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"63": {
				"final": false,
				"name": "customTypeName",
				"id": 63,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			}
		},
		"associations": {}
	},
	"64": {
		"name": "Contact",
		"app": "tutanota",
		"version": 98,
		"since": 1,
		"type": "LIST_ELEMENT_TYPE",
		"id": 64,
		"rootId": "CHR1dGFub3RhAEA",
		"versioned": true,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"66": {
				"final": true,
				"name": "_id",
				"id": 66,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"67": {
				"final": true,
				"name": "_permissions",
				"id": 67,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"68": {
				"final": false,
				"name": "_format",
				"id": 68,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"69": {
				"final": true,
				"name": "_ownerEncSessionKey",
				"id": 69,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"72": {
				"final": false,
				"name": "firstName",
				"id": 72,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"73": {
				"final": false,
				"name": "lastName",
				"id": 73,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"74": {
				"final": false,
				"name": "company",
				"id": 74,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"75": {
				"final": false,
				"name": "role",
				"id": 75,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"76": {
				"final": false,
				"name": "oldBirthdayDate",
				"id": 76,
				"type": "Date",
				"cardinality": "ZeroOrOne",
				"encrypted": true
			},
			"77": {
				"final": false,
				"name": "comment",
				"id": 77,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"79": {
				"final": false,
				"name": "presharedPassword",
				"id": 79,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": true
			},
			"585": {
				"final": true,
				"name": "_ownerGroup",
				"id": 585,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"849": {
				"final": false,
				"name": "nickname",
				"id": 849,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": true
			},
			"850": {
				"final": false,
				"name": "title",
				"id": 850,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": true
			},
			"1083": {
				"final": false,
				"name": "birthdayIso",
				"id": 1083,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": true
			},
			"1380": {
				"final": false,
				"name": "middleName",
				"id": 1380,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": true
			},
			"1381": {
				"final": false,
				"name": "nameSuffix",
				"id": 1381,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": true
			},
			"1382": {
				"final": false,
				"name": "phoneticFirst",
				"id": 1382,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": true
			},
			"1383": {
				"final": false,
				"name": "phoneticMiddle",
				"id": 1383,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": true
			},
			"1384": {
				"final": false,
				"name": "phoneticLast",
				"id": 1384,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": true
			},
			"1385": {
				"final": false,
				"name": "department",
				"id": 1385,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": true
			},
			"1394": {
				"final": true,
				"name": "_ownerKeyVersion",
				"id": 1394,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"80": {
				"final": false,
				"name": "mailAddresses",
				"id": 80,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 44,
				"dependency": null
			},
			"81": {
				"final": false,
				"name": "phoneNumbers",
				"id": 81,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 49,
				"dependency": null
			},
			"82": {
				"final": false,
				"name": "addresses",
				"id": 82,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 54,
				"dependency": null
			},
			"83": {
				"final": false,
				"name": "socialIds",
				"id": 83,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 59,
				"dependency": null
			},
			"851": {
				"final": false,
				"name": "oldBirthdayAggregate",
				"id": 851,
				"type": "AGGREGATION",
				"cardinality": "ZeroOrOne",
				"refTypeId": 844,
				"dependency": null
			},
			"852": {
				"final": false,
				"name": "photo",
				"id": 852,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "ZeroOrOne",
				"refTypeId": 13,
				"dependency": null
			},
			"1386": {
				"final": false,
				"name": "customDate",
				"id": 1386,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 1356,
				"dependency": null
			},
			"1387": {
				"final": false,
				"name": "websites",
				"id": 1387,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 1361,
				"dependency": null
			},
			"1388": {
				"final": false,
				"name": "relationships",
				"id": 1388,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 1366,
				"dependency": null
			},
			"1389": {
				"final": false,
				"name": "messengerHandles",
				"id": 1389,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 1371,
				"dependency": null
			},
			"1390": {
				"final": false,
				"name": "pronouns",
				"id": 1390,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 1376,
				"dependency": null
			}
		}
	},
	"84": {
		"name": "ConversationEntry",
		"app": "tutanota",
		"version": 98,
		"since": 1,
		"type": "LIST_ELEMENT_TYPE",
		"id": 84,
		"rootId": "CHR1dGFub3RhAFQ",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"118": {
				"final": true,
				"name": "_id",
				"id": 118,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"119": {
				"final": true,
				"name": "_permissions",
				"id": 119,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"120": {
				"final": false,
				"name": "_format",
				"id": 120,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"121": {
				"final": true,
				"name": "messageId",
				"id": 121,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"122": {
				"final": true,
				"name": "conversationType",
				"id": 122,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"588": {
				"final": true,
				"name": "_ownerGroup",
				"id": 588,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"123": {
				"final": true,
				"name": "previous",
				"id": 123,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "ZeroOrOne",
				"refTypeId": 84,
				"dependency": null
			},
			"124": {
				"final": true,
				"name": "mail",
				"id": 124,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "ZeroOrOne",
				"refTypeId": 97,
				"dependency": null
			}
		}
	},
	"92": {
		"name": "MailAddress",
		"app": "tutanota",
		"version": 98,
		"since": 1,
		"type": "AGGREGATED_TYPE",
		"id": 92,
		"rootId": "CHR1dGFub3RhAFw",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"93": {
				"final": true,
				"name": "_id",
				"id": 93,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"94": {
				"final": true,
				"name": "name",
				"id": 94,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"95": {
				"final": true,
				"name": "address",
				"id": 95,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"96": {
				"final": false,
				"name": "contact",
				"id": 96,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "ZeroOrOne",
				"refTypeId": 64,
				"dependency": null
			}
		}
	},
	"97": {
		"name": "Mail",
		"app": "tutanota",
		"version": 98,
		"since": 1,
		"type": "LIST_ELEMENT_TYPE",
		"id": 97,
		"rootId": "CHR1dGFub3RhAGE",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"99": {
				"final": true,
				"name": "_id",
				"id": 99,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"100": {
				"final": true,
				"name": "_permissions",
				"id": 100,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"101": {
				"final": false,
				"name": "_format",
				"id": 101,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"102": {
				"final": true,
				"name": "_ownerEncSessionKey",
				"id": 102,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"105": {
				"final": true,
				"name": "subject",
				"id": 105,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"107": {
				"final": true,
				"name": "receivedDate",
				"id": 107,
				"type": "Date",
				"cardinality": "One",
				"encrypted": false
			},
			"108": {
				"final": true,
				"name": "state",
				"id": 108,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"109": {
				"final": false,
				"name": "unread",
				"id": 109,
				"type": "Boolean",
				"cardinality": "One",
				"encrypted": false
			},
			"426": {
				"final": true,
				"name": "confidential",
				"id": 426,
				"type": "Boolean",
				"cardinality": "One",
				"encrypted": true
			},
			"466": {
				"final": false,
				"name": "replyType",
				"id": 466,
				"type": "Number",
				"cardinality": "One",
				"encrypted": true
			},
			"587": {
				"final": true,
				"name": "_ownerGroup",
				"id": 587,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"617": {
				"final": true,
				"name": "differentEnvelopeSender",
				"id": 617,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": true
			},
			"866": {
				"final": false,
				"name": "listUnsubscribe",
				"id": 866,
				"type": "Boolean",
				"cardinality": "One",
				"encrypted": true
			},
			"896": {
				"final": true,
				"name": "movedTime",
				"id": 896,
				"type": "Date",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1021": {
				"final": false,
				"name": "phishingStatus",
				"id": 1021,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1022": {
				"final": false,
				"name": "authStatus",
				"id": 1022,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1120": {
				"final": true,
				"name": "method",
				"id": 1120,
				"type": "Number",
				"cardinality": "One",
				"encrypted": true
			},
			"1307": {
				"final": true,
				"name": "recipientCount",
				"id": 1307,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1346": {
				"final": true,
				"name": "encryptionAuthStatus",
				"id": 1346,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": true
			},
			"1395": {
				"final": true,
				"name": "_ownerKeyVersion",
				"id": 1395,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1677": {
				"final": true,
				"name": "keyVerificationState",
				"id": 1677,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": true
			},
			"1728": {
				"final": false,
				"name": "processingState",
				"id": 1728,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"111": {
				"final": true,
				"name": "sender",
				"id": 111,
				"type": "AGGREGATION",
				"cardinality": "One",
				"refTypeId": 92,
				"dependency": null
			},
			"115": {
				"final": true,
				"name": "attachments",
				"id": 115,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "Any",
				"refTypeId": 13,
				"dependency": null
			},
			"117": {
				"final": true,
				"name": "conversationEntry",
				"id": 117,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 84,
				"dependency": null
			},
			"1306": {
				"final": true,
				"name": "firstRecipient",
				"id": 1306,
				"type": "AGGREGATION",
				"cardinality": "ZeroOrOne",
				"refTypeId": 92,
				"dependency": null
			},
			"1308": {
				"final": true,
				"name": "mailDetails",
				"id": 1308,
				"type": "BLOB_ELEMENT_ASSOCIATION",
				"cardinality": "ZeroOrOne",
				"refTypeId": 1298,
				"dependency": null
			},
			"1309": {
				"final": true,
				"name": "mailDetailsDraft",
				"id": 1309,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "ZeroOrOne",
				"refTypeId": 1290,
				"dependency": null
			},
			"1310": {
				"final": true,
				"name": "bucketKey",
				"id": 1310,
				"type": "AGGREGATION",
				"cardinality": "ZeroOrOne",
				"refTypeId": 2043,
				"dependency": "sys"
			},
			"1465": {
				"final": false,
				"name": "sets",
				"id": 1465,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "Any",
				"refTypeId": 429,
				"dependency": null
			},
			"1729": {
				"final": false,
				"name": "clientSpamClassifierResult",
				"id": 1729,
				"type": "AGGREGATION",
				"cardinality": "ZeroOrOne",
				"refTypeId": 1724,
				"dependency": null
			}
		}
	},
	"125": {
		"name": "MailBox",
		"app": "tutanota",
		"version": 98,
		"since": 1,
		"type": "ELEMENT_TYPE",
		"id": 125,
		"rootId": "CHR1dGFub3RhAH0",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"127": {
				"final": true,
				"name": "_id",
				"id": 127,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"128": {
				"final": true,
				"name": "_permissions",
				"id": 128,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"129": {
				"final": false,
				"name": "_format",
				"id": 129,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"569": {
				"final": true,
				"name": "lastInfoDate",
				"id": 569,
				"type": "Date",
				"cardinality": "One",
				"encrypted": false
			},
			"590": {
				"final": true,
				"name": "_ownerGroup",
				"id": 590,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"591": {
				"final": true,
				"name": "_ownerEncSessionKey",
				"id": 591,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1396": {
				"final": true,
				"name": "_ownerKeyVersion",
				"id": 1396,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"133": {
				"final": true,
				"name": "sentAttachments",
				"id": 133,
				"type": "LIST_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 13,
				"dependency": null
			},
			"134": {
				"final": true,
				"name": "receivedAttachments",
				"id": 134,
				"type": "LIST_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 13,
				"dependency": null
			},
			"443": {
				"final": true,
				"name": "folders",
				"id": 443,
				"type": "AGGREGATION",
				"cardinality": "ZeroOrOne",
				"refTypeId": 440,
				"dependency": null
			},
			"1220": {
				"final": true,
				"name": "spamResults",
				"id": 1220,
				"type": "AGGREGATION",
				"cardinality": "ZeroOrOne",
				"refTypeId": 1217,
				"dependency": null
			},
			"1318": {
				"final": false,
				"name": "mailDetailsDrafts",
				"id": 1318,
				"type": "AGGREGATION",
				"cardinality": "ZeroOrOne",
				"refTypeId": 1315,
				"dependency": null
			},
			"1463": {
				"final": false,
				"name": "archivedMailBags",
				"id": 1463,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 1460,
				"dependency": null
			},
			"1464": {
				"final": false,
				"name": "currentMailBag",
				"id": 1464,
				"type": "AGGREGATION",
				"cardinality": "ZeroOrOne",
				"refTypeId": 1460,
				"dependency": null
			},
			"1512": {
				"final": true,
				"name": "importedAttachments",
				"id": 1512,
				"type": "LIST_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 13,
				"dependency": null
			},
			"1585": {
				"final": true,
				"name": "mailImportStates",
				"id": 1585,
				"type": "LIST_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 1559,
				"dependency": null
			},
			"1710": {
				"final": true,
				"name": "extractedFeatures",
				"id": 1710,
				"type": "LIST_ASSOCIATION",
				"cardinality": "ZeroOrOne",
				"refTypeId": 1678,
				"dependency": null
			}
		}
	},
	"138": {
		"name": "CreateExternalUserGroupData",
		"app": "tutanota",
		"version": 98,
		"since": 1,
		"type": "AGGREGATED_TYPE",
		"id": 138,
		"rootId": "CHR1dGFub3RhAACK",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"139": {
				"final": true,
				"name": "_id",
				"id": 139,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"141": {
				"final": false,
				"name": "mailAddress",
				"id": 141,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"142": {
				"final": false,
				"name": "externalPwEncUserGroupKey",
				"id": 142,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"143": {
				"final": false,
				"name": "internalUserEncUserGroupKey",
				"id": 143,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"1433": {
				"final": false,
				"name": "internalUserGroupKeyVersion",
				"id": 1433,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"145": {
		"name": "ExternalUserData",
		"app": "tutanota",
		"version": 98,
		"since": 1,
		"type": "DATA_TRANSFER_TYPE",
		"id": 145,
		"rootId": "CHR1dGFub3RhAACR",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"146": {
				"final": false,
				"name": "_format",
				"id": 146,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"148": {
				"final": false,
				"name": "externalUserEncMailGroupKey",
				"id": 148,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"149": {
				"final": false,
				"name": "verifier",
				"id": 149,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"150": {
				"final": false,
				"name": "externalUserEncUserGroupInfoSessionKey",
				"id": 150,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"412": {
				"final": false,
				"name": "externalUserEncEntropy",
				"id": 412,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"669": {
				"final": false,
				"name": "internalMailEncUserGroupInfoSessionKey",
				"id": 669,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"670": {
				"final": false,
				"name": "externalMailEncMailGroupInfoSessionKey",
				"id": 670,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"671": {
				"final": false,
				"name": "internalMailEncMailGroupInfoSessionKey",
				"id": 671,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"672": {
				"final": false,
				"name": "externalUserEncTutanotaPropertiesSessionKey",
				"id": 672,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"673": {
				"final": false,
				"name": "externalMailEncMailBoxSessionKey",
				"id": 673,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"1323": {
				"final": false,
				"name": "kdfVersion",
				"id": 1323,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1429": {
				"final": false,
				"name": "internalMailGroupKeyVersion",
				"id": 1429,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"151": {
				"final": false,
				"name": "userGroupData",
				"id": 151,
				"type": "AGGREGATION",
				"cardinality": "One",
				"refTypeId": 138,
				"dependency": null
			}
		}
	},
	"153": {
		"name": "ContactList",
		"app": "tutanota",
		"version": 98,
		"since": 1,
		"type": "ELEMENT_TYPE",
		"id": 153,
		"rootId": "CHR1dGFub3RhAACZ",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"155": {
				"final": true,
				"name": "_id",
				"id": 155,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"156": {
				"final": true,
				"name": "_permissions",
				"id": 156,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"157": {
				"final": false,
				"name": "_format",
				"id": 157,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"592": {
				"final": true,
				"name": "_ownerGroup",
				"id": 592,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"593": {
				"final": true,
				"name": "_ownerEncSessionKey",
				"id": 593,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1397": {
				"final": true,
				"name": "_ownerKeyVersion",
				"id": 1397,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"160": {
				"final": true,
				"name": "contacts",
				"id": 160,
				"type": "LIST_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 64,
				"dependency": null
			},
			"856": {
				"final": false,
				"name": "photos",
				"id": 856,
				"type": "AGGREGATION",
				"cardinality": "ZeroOrOne",
				"refTypeId": 853,
				"dependency": null
			}
		}
	},
	"183": {
		"name": "RemoteImapSyncInfo",
		"app": "tutanota",
		"version": 98,
		"since": 1,
		"type": "LIST_ELEMENT_TYPE",
		"id": 183,
		"rootId": "CHR1dGFub3RhAAC3",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"185": {
				"final": true,
				"name": "_id",
				"id": 185,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"186": {
				"final": true,
				"name": "_permissions",
				"id": 186,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"187": {
				"final": false,
				"name": "_format",
				"id": 187,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"189": {
				"final": false,
				"name": "seen",
				"id": 189,
				"type": "Boolean",
				"cardinality": "One",
				"encrypted": false
			},
			"594": {
				"final": true,
				"name": "_ownerGroup",
				"id": 594,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"188": {
				"final": false,
				"name": "message",
				"id": 188,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 97,
				"dependency": null
			}
		}
	},
	"190": {
		"name": "ImapFolder",
		"app": "tutanota",
		"version": 98,
		"since": 1,
		"type": "AGGREGATED_TYPE",
		"id": 190,
		"rootId": "CHR1dGFub3RhAAC-",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"191": {
				"final": true,
				"name": "_id",
				"id": 191,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"192": {
				"final": false,
				"name": "name",
				"id": 192,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"193": {
				"final": false,
				"name": "lastseenuid",
				"id": 193,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"194": {
				"final": false,
				"name": "uidvalidity",
				"id": 194,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"195": {
				"final": true,
				"name": "syncInfo",
				"id": 195,
				"type": "LIST_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 183,
				"dependency": null
			}
		}
	},
	"196": {
		"name": "ImapSyncState",
		"app": "tutanota",
		"version": 98,
		"since": 1,
		"type": "ELEMENT_TYPE",
		"id": 196,
		"rootId": "CHR1dGFub3RhAADE",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"198": {
				"final": true,
				"name": "_id",
				"id": 198,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"199": {
				"final": true,
				"name": "_permissions",
				"id": 199,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"200": {
				"final": false,
				"name": "_format",
				"id": 200,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"595": {
				"final": true,
				"name": "_ownerGroup",
				"id": 595,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"201": {
				"final": false,
				"name": "folders",
				"id": 201,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 190,
				"dependency": null
			}
		}
	},
	"209": {
		"name": "ImapSyncConfiguration",
		"app": "tutanota",
		"version": 98,
		"since": 1,
		"type": "AGGREGATED_TYPE",
		"id": 209,
		"rootId": "CHR1dGFub3RhAADR",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"210": {
				"final": true,
				"name": "_id",
				"id": 210,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"211": {
				"final": false,
				"name": "host",
				"id": 211,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"212": {
				"final": false,
				"name": "port",
				"id": 212,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"213": {
				"final": false,
				"name": "user",
				"id": 213,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"214": {
				"final": false,
				"name": "password",
				"id": 214,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"215": {
				"final": false,
				"name": "imapSyncState",
				"id": 215,
				"type": "ELEMENT_ASSOCIATION",
				"cardinality": "ZeroOrOne",
				"refTypeId": 196,
				"dependency": null
			}
		}
	},
	"216": {
		"name": "TutanotaProperties",
		"app": "tutanota",
		"version": 98,
		"since": 1,
		"type": "ELEMENT_TYPE",
		"id": 216,
		"rootId": "CHR1dGFub3RhAADY",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"218": {
				"final": true,
				"name": "_id",
				"id": 218,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"219": {
				"final": true,
				"name": "_permissions",
				"id": 219,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"220": {
				"final": false,
				"name": "_format",
				"id": 220,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"410": {
				"final": false,
				"name": "userEncEntropy",
				"id": 410,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"418": {
				"final": false,
				"name": "notificationMailLanguage",
				"id": 418,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"469": {
				"final": false,
				"name": "defaultSender",
				"id": 469,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"470": {
				"final": false,
				"name": "defaultUnconfidential",
				"id": 470,
				"type": "Boolean",
				"cardinality": "One",
				"encrypted": false
			},
			"471": {
				"final": false,
				"name": "customEmailSignature",
				"id": 471,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"472": {
				"final": false,
				"name": "emailSignatureType",
				"id": 472,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"568": {
				"final": false,
				"name": "noAutomaticContacts",
				"id": 568,
				"type": "Boolean",
				"cardinality": "One",
				"encrypted": true
			},
			"597": {
				"final": true,
				"name": "_ownerGroup",
				"id": 597,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"598": {
				"final": true,
				"name": "_ownerEncSessionKey",
				"id": 598,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"676": {
				"final": false,
				"name": "sendPlaintextOnly",
				"id": 676,
				"type": "Boolean",
				"cardinality": "One",
				"encrypted": true
			},
			"897": {
				"final": false,
				"name": "lastSeenAnnouncement",
				"id": 897,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1398": {
				"final": true,
				"name": "_ownerKeyVersion",
				"id": 1398,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1434": {
				"final": false,
				"name": "userKeyVersion",
				"id": 1434,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1510": {
				"final": false,
				"name": "defaultLabelCreated",
				"id": 1510,
				"type": "Boolean",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"221": {
				"final": false,
				"name": "lastPushedMail",
				"id": 221,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "ZeroOrOne",
				"refTypeId": 97,
				"dependency": null
			},
			"222": {
				"final": false,
				"name": "imapSyncConfig",
				"id": 222,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 209,
				"dependency": null
			},
			"578": {
				"final": false,
				"name": "inboxRules",
				"id": 578,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 573,
				"dependency": null
			}
		}
	},
	"223": {
		"name": "NotificationMail",
		"app": "tutanota",
		"version": 98,
		"since": 1,
		"type": "AGGREGATED_TYPE",
		"id": 223,
		"rootId": "CHR1dGFub3RhAADf",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"224": {
				"final": true,
				"name": "_id",
				"id": 224,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"225": {
				"final": false,
				"name": "subject",
				"id": 225,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"226": {
				"final": false,
				"name": "bodyText",
				"id": 226,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"227": {
				"final": false,
				"name": "recipientMailAddress",
				"id": 227,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"228": {
				"final": false,
				"name": "recipientName",
				"id": 228,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"417": {
				"final": false,
				"name": "mailboxLink",
				"id": 417,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"419": {
		"name": "DeleteMailData",
		"app": "tutanota",
		"version": 98,
		"since": 5,
		"type": "DATA_TRANSFER_TYPE",
		"id": 419,
		"rootId": "CHR1dGFub3RhAAGj",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"420": {
				"final": false,
				"name": "_format",
				"id": 420,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"421": {
				"final": false,
				"name": "mails",
				"id": 421,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "Any",
				"refTypeId": 97,
				"dependency": null
			},
			"724": {
				"final": true,
				"name": "folder",
				"id": 724,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "ZeroOrOne",
				"refTypeId": 429,
				"dependency": null
			}
		}
	},
	"429": {
		"name": "MailFolder",
		"app": "tutanota",
		"version": 98,
		"since": 7,
		"type": "LIST_ELEMENT_TYPE",
		"id": 429,
		"rootId": "CHR1dGFub3RhAAGt",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"431": {
				"final": true,
				"name": "_id",
				"id": 431,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"432": {
				"final": true,
				"name": "_permissions",
				"id": 432,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"433": {
				"final": false,
				"name": "_format",
				"id": 433,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"434": {
				"final": true,
				"name": "_ownerEncSessionKey",
				"id": 434,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"435": {
				"final": false,
				"name": "name",
				"id": 435,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"436": {
				"final": true,
				"name": "folderType",
				"id": 436,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"589": {
				"final": true,
				"name": "_ownerGroup",
				"id": 589,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1399": {
				"final": true,
				"name": "_ownerKeyVersion",
				"id": 1399,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1479": {
				"final": false,
				"name": "color",
				"id": 1479,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": true
			}
		},
		"associations": {
			"439": {
				"final": true,
				"name": "parentFolder",
				"id": 439,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "ZeroOrOne",
				"refTypeId": 429,
				"dependency": null
			},
			"1459": {
				"final": true,
				"name": "entries",
				"id": 1459,
				"type": "LIST_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 1450,
				"dependency": null
			}
		}
	},
	"440": {
		"name": "MailFolderRef",
		"app": "tutanota",
		"version": 98,
		"since": 7,
		"type": "AGGREGATED_TYPE",
		"id": 440,
		"rootId": "CHR1dGFub3RhAAG4",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"441": {
				"final": true,
				"name": "_id",
				"id": 441,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"442": {
				"final": true,
				"name": "folders",
				"id": 442,
				"type": "LIST_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 429,
				"dependency": null
			}
		}
	},
	"445": {
		"name": "MoveMailData",
		"app": "tutanota",
		"version": 98,
		"since": 7,
		"type": "DATA_TRANSFER_TYPE",
		"id": 445,
		"rootId": "CHR1dGFub3RhAAG9",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"446": {
				"final": false,
				"name": "_format",
				"id": 446,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1714": {
				"final": false,
				"name": "moveReason",
				"id": 1714,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"447": {
				"final": false,
				"name": "targetFolder",
				"id": 447,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 429,
				"dependency": null
			},
			"448": {
				"final": false,
				"name": "mails",
				"id": 448,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "Any",
				"refTypeId": 97,
				"dependency": null
			},
			"1644": {
				"final": false,
				"name": "excludeMailSet",
				"id": 1644,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "ZeroOrOne",
				"refTypeId": 429,
				"dependency": null
			}
		}
	},
	"450": {
		"name": "CreateMailFolderData",
		"app": "tutanota",
		"version": 98,
		"since": 7,
		"type": "DATA_TRANSFER_TYPE",
		"id": 450,
		"rootId": "CHR1dGFub3RhAAHC",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"451": {
				"final": false,
				"name": "_format",
				"id": 451,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"453": {
				"final": true,
				"name": "folderName",
				"id": 453,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"454": {
				"final": true,
				"name": "ownerEncSessionKey",
				"id": 454,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"1268": {
				"final": true,
				"name": "ownerGroup",
				"id": 1268,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1414": {
				"final": true,
				"name": "ownerKeyVersion",
				"id": 1414,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"452": {
				"final": true,
				"name": "parentFolder",
				"id": 452,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "ZeroOrOne",
				"refTypeId": 429,
				"dependency": null
			}
		}
	},
	"455": {
		"name": "CreateMailFolderReturn",
		"app": "tutanota",
		"version": 98,
		"since": 7,
		"type": "DATA_TRANSFER_TYPE",
		"id": 455,
		"rootId": "CHR1dGFub3RhAAHH",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"456": {
				"final": false,
				"name": "_format",
				"id": 456,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"457": {
				"final": false,
				"name": "newFolder",
				"id": 457,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 429,
				"dependency": null
			}
		}
	},
	"458": {
		"name": "DeleteMailFolderData",
		"app": "tutanota",
		"version": 98,
		"since": 7,
		"type": "DATA_TRANSFER_TYPE",
		"id": 458,
		"rootId": "CHR1dGFub3RhAAHK",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"459": {
				"final": false,
				"name": "_format",
				"id": 459,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"460": {
				"final": false,
				"name": "folders",
				"id": 460,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "Any",
				"refTypeId": 429,
				"dependency": null
			}
		}
	},
	"473": {
		"name": "EncryptTutanotaPropertiesData",
		"app": "tutanota",
		"version": 98,
		"since": 9,
		"type": "DATA_TRANSFER_TYPE",
		"id": 473,
		"rootId": "CHR1dGFub3RhAAHZ",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"474": {
				"final": false,
				"name": "_format",
				"id": 474,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"476": {
				"final": false,
				"name": "symEncSessionKey",
				"id": 476,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"1428": {
				"final": false,
				"name": "symKeyVersion",
				"id": 1428,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"475": {
				"final": false,
				"name": "properties",
				"id": 475,
				"type": "ELEMENT_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 216,
				"dependency": null
			}
		}
	},
	"482": {
		"name": "DraftRecipient",
		"app": "tutanota",
		"version": 98,
		"since": 11,
		"type": "AGGREGATED_TYPE",
		"id": 482,
		"rootId": "CHR1dGFub3RhAAHi",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"483": {
				"final": true,
				"name": "_id",
				"id": 483,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"484": {
				"final": true,
				"name": "name",
				"id": 484,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"485": {
				"final": true,
				"name": "mailAddress",
				"id": 485,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"486": {
		"name": "NewDraftAttachment",
		"app": "tutanota",
		"version": 98,
		"since": 11,
		"type": "AGGREGATED_TYPE",
		"id": 486,
		"rootId": "CHR1dGFub3RhAAHm",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"487": {
				"final": true,
				"name": "_id",
				"id": 487,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"488": {
				"final": true,
				"name": "encFileName",
				"id": 488,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"489": {
				"final": true,
				"name": "encMimeType",
				"id": 489,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"925": {
				"final": true,
				"name": "encCid",
				"id": 925,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"1226": {
				"final": true,
				"name": "referenceTokens",
				"id": 1226,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 1990,
				"dependency": "sys"
			}
		}
	},
	"491": {
		"name": "DraftAttachment",
		"app": "tutanota",
		"version": 98,
		"since": 11,
		"type": "AGGREGATED_TYPE",
		"id": 491,
		"rootId": "CHR1dGFub3RhAAHr",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"492": {
				"final": true,
				"name": "_id",
				"id": 492,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"493": {
				"final": true,
				"name": "ownerEncFileSessionKey",
				"id": 493,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"1430": {
				"final": true,
				"name": "ownerKeyVersion",
				"id": 1430,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"494": {
				"final": true,
				"name": "newFile",
				"id": 494,
				"type": "AGGREGATION",
				"cardinality": "ZeroOrOne",
				"refTypeId": 486,
				"dependency": null
			},
			"495": {
				"final": true,
				"name": "existingFile",
				"id": 495,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "ZeroOrOne",
				"refTypeId": 13,
				"dependency": null
			}
		}
	},
	"496": {
		"name": "DraftData",
		"app": "tutanota",
		"version": 98,
		"since": 11,
		"type": "AGGREGATED_TYPE",
		"id": 496,
		"rootId": "CHR1dGFub3RhAAHw",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"497": {
				"final": true,
				"name": "_id",
				"id": 497,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"498": {
				"final": true,
				"name": "subject",
				"id": 498,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"499": {
				"final": true,
				"name": "bodyText",
				"id": 499,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"500": {
				"final": true,
				"name": "senderMailAddress",
				"id": 500,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"501": {
				"final": true,
				"name": "senderName",
				"id": 501,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"502": {
				"final": true,
				"name": "confidential",
				"id": 502,
				"type": "Boolean",
				"cardinality": "One",
				"encrypted": true
			},
			"1116": {
				"final": true,
				"name": "method",
				"id": 1116,
				"type": "Number",
				"cardinality": "One",
				"encrypted": true
			},
			"1194": {
				"final": true,
				"name": "compressedBodyText",
				"id": 1194,
				"type": "CompressedString",
				"cardinality": "ZeroOrOne",
				"encrypted": true
			}
		},
		"associations": {
			"503": {
				"final": true,
				"name": "toRecipients",
				"id": 503,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 482,
				"dependency": null
			},
			"504": {
				"final": true,
				"name": "ccRecipients",
				"id": 504,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 482,
				"dependency": null
			},
			"505": {
				"final": true,
				"name": "bccRecipients",
				"id": 505,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 482,
				"dependency": null
			},
			"506": {
				"final": true,
				"name": "addedAttachments",
				"id": 506,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 491,
				"dependency": null
			},
			"507": {
				"final": true,
				"name": "removedAttachments",
				"id": 507,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "Any",
				"refTypeId": 13,
				"dependency": null
			},
			"819": {
				"final": false,
				"name": "replyTos",
				"id": 819,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 612,
				"dependency": null
			}
		}
	},
	"508": {
		"name": "DraftCreateData",
		"app": "tutanota",
		"version": 98,
		"since": 11,
		"type": "DATA_TRANSFER_TYPE",
		"id": 508,
		"rootId": "CHR1dGFub3RhAAH8",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"509": {
				"final": false,
				"name": "_format",
				"id": 509,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"510": {
				"final": true,
				"name": "previousMessageId",
				"id": 510,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"511": {
				"final": true,
				"name": "conversationType",
				"id": 511,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"512": {
				"final": true,
				"name": "ownerEncSessionKey",
				"id": 512,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"1427": {
				"final": false,
				"name": "ownerKeyVersion",
				"id": 1427,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"515": {
				"final": false,
				"name": "draftData",
				"id": 515,
				"type": "AGGREGATION",
				"cardinality": "One",
				"refTypeId": 496,
				"dependency": null
			}
		}
	},
	"516": {
		"name": "DraftCreateReturn",
		"app": "tutanota",
		"version": 98,
		"since": 11,
		"type": "DATA_TRANSFER_TYPE",
		"id": 516,
		"rootId": "CHR1dGFub3RhAAIE",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"517": {
				"final": false,
				"name": "_format",
				"id": 517,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"518": {
				"final": false,
				"name": "draft",
				"id": 518,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 97,
				"dependency": null
			}
		}
	},
	"519": {
		"name": "DraftUpdateData",
		"app": "tutanota",
		"version": 98,
		"since": 11,
		"type": "DATA_TRANSFER_TYPE",
		"id": 519,
		"rootId": "CHR1dGFub3RhAAIH",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"520": {
				"final": false,
				"name": "_format",
				"id": 520,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"521": {
				"final": false,
				"name": "draftData",
				"id": 521,
				"type": "AGGREGATION",
				"cardinality": "One",
				"refTypeId": 496,
				"dependency": null
			},
			"522": {
				"final": false,
				"name": "draft",
				"id": 522,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 97,
				"dependency": null
			}
		}
	},
	"523": {
		"name": "DraftUpdateReturn",
		"app": "tutanota",
		"version": 98,
		"since": 11,
		"type": "DATA_TRANSFER_TYPE",
		"id": 523,
		"rootId": "CHR1dGFub3RhAAIL",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"524": {
				"final": false,
				"name": "_format",
				"id": 524,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"525": {
				"final": true,
				"name": "attachments",
				"id": 525,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "Any",
				"refTypeId": 13,
				"dependency": null
			}
		}
	},
	"527": {
		"name": "InternalRecipientKeyData",
		"app": "tutanota",
		"version": 98,
		"since": 11,
		"type": "AGGREGATED_TYPE",
		"id": 527,
		"rootId": "CHR1dGFub3RhAAIP",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"528": {
				"final": true,
				"name": "_id",
				"id": 528,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"529": {
				"final": true,
				"name": "mailAddress",
				"id": 529,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"530": {
				"final": true,
				"name": "pubEncBucketKey",
				"id": 530,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"531": {
				"final": true,
				"name": "recipientKeyVersion",
				"id": 531,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1352": {
				"final": true,
				"name": "protocolVersion",
				"id": 1352,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1431": {
				"final": true,
				"name": "senderKeyVersion",
				"id": 1431,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"532": {
		"name": "SecureExternalRecipientKeyData",
		"app": "tutanota",
		"version": 98,
		"since": 11,
		"type": "AGGREGATED_TYPE",
		"id": 532,
		"rootId": "CHR1dGFub3RhAAIU",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"533": {
				"final": true,
				"name": "_id",
				"id": 533,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"534": {
				"final": true,
				"name": "mailAddress",
				"id": 534,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"536": {
				"final": true,
				"name": "passwordVerifier",
				"id": 536,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"538": {
				"final": true,
				"name": "salt",
				"id": 538,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"539": {
				"final": true,
				"name": "saltHash",
				"id": 539,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"540": {
				"final": true,
				"name": "pwEncCommunicationKey",
				"id": 540,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"599": {
				"final": true,
				"name": "ownerEncBucketKey",
				"id": 599,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"1324": {
				"final": true,
				"name": "kdfVersion",
				"id": 1324,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1417": {
				"final": true,
				"name": "ownerKeyVersion",
				"id": 1417,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1445": {
				"final": false,
				"name": "userGroupKeyVersion",
				"id": 1445,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"542": {
		"name": "AttachmentKeyData",
		"app": "tutanota",
		"version": 98,
		"since": 11,
		"type": "AGGREGATED_TYPE",
		"id": 542,
		"rootId": "CHR1dGFub3RhAAIe",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"543": {
				"final": true,
				"name": "_id",
				"id": 543,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"544": {
				"final": true,
				"name": "bucketEncFileSessionKey",
				"id": 544,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"545": {
				"final": true,
				"name": "fileSessionKey",
				"id": 545,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"546": {
				"final": true,
				"name": "file",
				"id": 546,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 13,
				"dependency": null
			}
		}
	},
	"547": {
		"name": "SendDraftData",
		"app": "tutanota",
		"version": 98,
		"since": 11,
		"type": "DATA_TRANSFER_TYPE",
		"id": 547,
		"rootId": "CHR1dGFub3RhAAIj",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"548": {
				"final": false,
				"name": "_format",
				"id": 548,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"549": {
				"final": true,
				"name": "language",
				"id": 549,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"550": {
				"final": true,
				"name": "mailSessionKey",
				"id": 550,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"551": {
				"final": true,
				"name": "bucketEncMailSessionKey",
				"id": 551,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"552": {
				"final": true,
				"name": "senderNameUnencrypted",
				"id": 552,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"675": {
				"final": true,
				"name": "plaintext",
				"id": 675,
				"type": "Boolean",
				"cardinality": "One",
				"encrypted": false
			},
			"1117": {
				"final": false,
				"name": "calendarMethod",
				"id": 1117,
				"type": "Boolean",
				"cardinality": "One",
				"encrypted": false
			},
			"1444": {
				"final": true,
				"name": "sessionEncEncryptionAuthStatus",
				"id": 1444,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"553": {
				"final": true,
				"name": "internalRecipientKeyData",
				"id": 553,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 527,
				"dependency": null
			},
			"554": {
				"final": true,
				"name": "secureExternalRecipientKeyData",
				"id": 554,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 532,
				"dependency": null
			},
			"555": {
				"final": true,
				"name": "attachmentKeyData",
				"id": 555,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 542,
				"dependency": null
			},
			"556": {
				"final": true,
				"name": "mail",
				"id": 556,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 97,
				"dependency": null
			},
			"1353": {
				"final": true,
				"name": "symEncInternalRecipientKeyData",
				"id": 1353,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 1347,
				"dependency": null
			}
		}
	},
	"557": {
		"name": "SendDraftReturn",
		"app": "tutanota",
		"version": 98,
		"since": 11,
		"type": "DATA_TRANSFER_TYPE",
		"id": 557,
		"rootId": "CHR1dGFub3RhAAIt",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"558": {
				"final": false,
				"name": "_format",
				"id": 558,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"559": {
				"final": false,
				"name": "messageId",
				"id": 559,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"560": {
				"final": false,
				"name": "sentDate",
				"id": 560,
				"type": "Date",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"561": {
				"final": false,
				"name": "notifications",
				"id": 561,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 223,
				"dependency": null
			},
			"562": {
				"final": true,
				"name": "sentMail",
				"id": 562,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 97,
				"dependency": null
			}
		}
	},
	"570": {
		"name": "ReceiveInfoServiceData",
		"app": "tutanota",
		"version": 98,
		"since": 12,
		"type": "DATA_TRANSFER_TYPE",
		"id": 570,
		"rootId": "CHR1dGFub3RhAAI6",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"571": {
				"final": false,
				"name": "_format",
				"id": 571,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1121": {
				"final": true,
				"name": "language",
				"id": 1121,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"573": {
		"name": "InboxRule",
		"app": "tutanota",
		"version": 98,
		"since": 12,
		"type": "AGGREGATED_TYPE",
		"id": 573,
		"rootId": "CHR1dGFub3RhAAI9",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"574": {
				"final": true,
				"name": "_id",
				"id": 574,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"575": {
				"final": false,
				"name": "type",
				"id": 575,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"576": {
				"final": false,
				"name": "value",
				"id": 576,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			}
		},
		"associations": {
			"577": {
				"final": false,
				"name": "targetFolder",
				"id": 577,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 429,
				"dependency": null
			}
		}
	},
	"612": {
		"name": "EncryptedMailAddress",
		"app": "tutanota",
		"version": 98,
		"since": 14,
		"type": "AGGREGATED_TYPE",
		"id": 612,
		"rootId": "CHR1dGFub3RhAAJk",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"613": {
				"final": true,
				"name": "_id",
				"id": 613,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"614": {
				"final": true,
				"name": "name",
				"id": 614,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"615": {
				"final": true,
				"name": "address",
				"id": 615,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			}
		},
		"associations": {}
	},
	"622": {
		"name": "UserAccountUserData",
		"app": "tutanota",
		"version": 98,
		"since": 16,
		"type": "AGGREGATED_TYPE",
		"id": 622,
		"rootId": "CHR1dGFub3RhAAJu",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"623": {
				"final": true,
				"name": "_id",
				"id": 623,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"624": {
				"final": false,
				"name": "mailAddress",
				"id": 624,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"625": {
				"final": false,
				"name": "encryptedName",
				"id": 625,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"626": {
				"final": false,
				"name": "salt",
				"id": 626,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"627": {
				"final": false,
				"name": "verifier",
				"id": 627,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"629": {
				"final": false,
				"name": "pwEncUserGroupKey",
				"id": 629,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"630": {
				"final": false,
				"name": "userEncCustomerGroupKey",
				"id": 630,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"631": {
				"final": false,
				"name": "userEncMailGroupKey",
				"id": 631,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"632": {
				"final": false,
				"name": "userEncContactGroupKey",
				"id": 632,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"633": {
				"final": false,
				"name": "userEncFileGroupKey",
				"id": 633,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"634": {
				"final": false,
				"name": "userEncEntropy",
				"id": 634,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"635": {
				"final": false,
				"name": "userEncTutanotaPropertiesSessionKey",
				"id": 635,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"636": {
				"final": false,
				"name": "mailEncMailBoxSessionKey",
				"id": 636,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"637": {
				"final": false,
				"name": "contactEncContactListSessionKey",
				"id": 637,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"638": {
				"final": false,
				"name": "fileEncFileSystemSessionKey",
				"id": 638,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"639": {
				"final": false,
				"name": "customerEncMailGroupInfoSessionKey",
				"id": 639,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"640": {
				"final": false,
				"name": "customerEncContactGroupInfoSessionKey",
				"id": 640,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"641": {
				"final": false,
				"name": "customerEncFileGroupInfoSessionKey",
				"id": 641,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"892": {
				"final": false,
				"name": "userEncRecoverCode",
				"id": 892,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"893": {
				"final": false,
				"name": "recoverCodeEncUserGroupKey",
				"id": 893,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"894": {
				"final": false,
				"name": "recoverCodeVerifier",
				"id": 894,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"1322": {
				"final": false,
				"name": "kdfVersion",
				"id": 1322,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1426": {
				"final": false,
				"name": "customerKeyVersion",
				"id": 1426,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"642": {
		"name": "InternalGroupData",
		"app": "tutanota",
		"version": 98,
		"since": 16,
		"type": "AGGREGATED_TYPE",
		"id": 642,
		"rootId": "CHR1dGFub3RhAAKC",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"643": {
				"final": true,
				"name": "_id",
				"id": 643,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"644": {
				"final": false,
				"name": "pubRsaKey",
				"id": 644,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"645": {
				"final": false,
				"name": "groupEncPrivRsaKey",
				"id": 645,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"646": {
				"final": false,
				"name": "adminEncGroupKey",
				"id": 646,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"647": {
				"final": false,
				"name": "ownerEncGroupInfoSessionKey",
				"id": 647,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"1342": {
				"final": true,
				"name": "pubEccKey",
				"id": 1342,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1343": {
				"final": true,
				"name": "groupEncPrivEccKey",
				"id": 1343,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1344": {
				"final": true,
				"name": "pubKyberKey",
				"id": 1344,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1345": {
				"final": true,
				"name": "groupEncPrivKyberKey",
				"id": 1345,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1415": {
				"final": false,
				"name": "adminKeyVersion",
				"id": 1415,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1416": {
				"final": false,
				"name": "ownerKeyVersion",
				"id": 1416,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"874": {
				"final": true,
				"name": "adminGroup",
				"id": 874,
				"type": "ELEMENT_ASSOCIATION",
				"cardinality": "ZeroOrOne",
				"refTypeId": 5,
				"dependency": "sys"
			}
		}
	},
	"648": {
		"name": "CustomerAccountCreateData",
		"app": "tutanota",
		"version": 98,
		"since": 16,
		"type": "DATA_TRANSFER_TYPE",
		"id": 648,
		"rootId": "CHR1dGFub3RhAAKI",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"649": {
				"final": false,
				"name": "_format",
				"id": 649,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"650": {
				"final": false,
				"name": "authToken",
				"id": 650,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"651": {
				"final": false,
				"name": "date",
				"id": 651,
				"type": "Date",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"652": {
				"final": false,
				"name": "lang",
				"id": 652,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"654": {
				"final": false,
				"name": "userEncAdminGroupKey",
				"id": 654,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"655": {
				"final": false,
				"name": "userEncAccountGroupKey",
				"id": 655,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"659": {
				"final": false,
				"name": "adminEncAccountingInfoSessionKey",
				"id": 659,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"660": {
				"final": false,
				"name": "systemAdminPubEncAccountingInfoSessionKey",
				"id": 660,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"661": {
				"final": false,
				"name": "adminEncCustomerServerPropertiesSessionKey",
				"id": 661,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"873": {
				"final": false,
				"name": "code",
				"id": 873,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"1355": {
				"final": true,
				"name": "systemAdminPublicProtocolVersion",
				"id": 1355,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1421": {
				"final": false,
				"name": "accountGroupKeyVersion",
				"id": 1421,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1422": {
				"final": false,
				"name": "systemAdminPubKeyVersion",
				"id": 1422,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1511": {
				"final": false,
				"name": "app",
				"id": 1511,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"653": {
				"final": false,
				"name": "userData",
				"id": 653,
				"type": "AGGREGATION",
				"cardinality": "One",
				"refTypeId": 622,
				"dependency": null
			},
			"656": {
				"final": false,
				"name": "userGroupData",
				"id": 656,
				"type": "AGGREGATION",
				"cardinality": "One",
				"refTypeId": 642,
				"dependency": null
			},
			"657": {
				"final": false,
				"name": "adminGroupData",
				"id": 657,
				"type": "AGGREGATION",
				"cardinality": "One",
				"refTypeId": 642,
				"dependency": null
			},
			"658": {
				"final": false,
				"name": "customerGroupData",
				"id": 658,
				"type": "AGGREGATION",
				"cardinality": "One",
				"refTypeId": 642,
				"dependency": null
			}
		}
	},
	"663": {
		"name": "UserAccountCreateData",
		"app": "tutanota",
		"version": 98,
		"since": 16,
		"type": "DATA_TRANSFER_TYPE",
		"id": 663,
		"rootId": "CHR1dGFub3RhAAKX",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"664": {
				"final": false,
				"name": "_format",
				"id": 664,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"665": {
				"final": false,
				"name": "date",
				"id": 665,
				"type": "Date",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"666": {
				"final": false,
				"name": "userData",
				"id": 666,
				"type": "AGGREGATION",
				"cardinality": "One",
				"refTypeId": 622,
				"dependency": null
			},
			"667": {
				"final": false,
				"name": "userGroupData",
				"id": 667,
				"type": "AGGREGATION",
				"cardinality": "One",
				"refTypeId": 642,
				"dependency": null
			}
		}
	},
	"677": {
		"name": "MailboxServerProperties",
		"app": "tutanota",
		"version": 98,
		"since": 18,
		"type": "ELEMENT_TYPE",
		"id": 677,
		"rootId": "CHR1dGFub3RhAAKl",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"679": {
				"final": true,
				"name": "_id",
				"id": 679,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"680": {
				"final": true,
				"name": "_permissions",
				"id": 680,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"681": {
				"final": false,
				"name": "_format",
				"id": 681,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"682": {
				"final": true,
				"name": "_ownerGroup",
				"id": 682,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"683": {
				"final": false,
				"name": "whitelistProtectionEnabled",
				"id": 683,
				"type": "Boolean",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"693": {
		"name": "MailboxGroupRoot",
		"app": "tutanota",
		"version": 98,
		"since": 18,
		"type": "ELEMENT_TYPE",
		"id": 693,
		"rootId": "CHR1dGFub3RhAAK1",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"695": {
				"final": true,
				"name": "_id",
				"id": 695,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"696": {
				"final": true,
				"name": "_permissions",
				"id": 696,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"697": {
				"final": false,
				"name": "_format",
				"id": 697,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"698": {
				"final": true,
				"name": "_ownerGroup",
				"id": 698,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"699": {
				"final": true,
				"name": "mailbox",
				"id": 699,
				"type": "ELEMENT_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 125,
				"dependency": null
			},
			"700": {
				"final": true,
				"name": "serverProperties",
				"id": 700,
				"type": "ELEMENT_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 677,
				"dependency": null
			},
			"1119": {
				"final": true,
				"name": "calendarEventUpdates",
				"id": 1119,
				"type": "AGGREGATION",
				"cardinality": "ZeroOrOne",
				"refTypeId": 1113,
				"dependency": null
			},
			"1150": {
				"final": true,
				"name": "outOfOfficeNotification",
				"id": 1150,
				"type": "ELEMENT_ASSOCIATION",
				"cardinality": "ZeroOrOne",
				"refTypeId": 1131,
				"dependency": null
			},
			"1151": {
				"final": true,
				"name": "outOfOfficeNotificationRecipientList",
				"id": 1151,
				"type": "AGGREGATION",
				"cardinality": "ZeroOrOne",
				"refTypeId": 1147,
				"dependency": null
			},
			"1203": {
				"final": true,
				"name": "mailboxProperties",
				"id": 1203,
				"type": "ELEMENT_ASSOCIATION",
				"cardinality": "ZeroOrOne",
				"refTypeId": 1195,
				"dependency": null
			}
		}
	},
	"707": {
		"name": "CreateMailGroupData",
		"app": "tutanota",
		"version": 98,
		"since": 19,
		"type": "DATA_TRANSFER_TYPE",
		"id": 707,
		"rootId": "CHR1dGFub3RhAALD",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"708": {
				"final": false,
				"name": "_format",
				"id": 708,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"709": {
				"final": false,
				"name": "mailAddress",
				"id": 709,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"710": {
				"final": false,
				"name": "encryptedName",
				"id": 710,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"711": {
				"final": false,
				"name": "mailEncMailboxSessionKey",
				"id": 711,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"712": {
				"final": false,
				"name": "groupData",
				"id": 712,
				"type": "AGGREGATION",
				"cardinality": "One",
				"refTypeId": 642,
				"dependency": null
			}
		}
	},
	"713": {
		"name": "DeleteGroupData",
		"app": "tutanota",
		"version": 98,
		"since": 19,
		"type": "DATA_TRANSFER_TYPE",
		"id": 713,
		"rootId": "CHR1dGFub3RhAALJ",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"714": {
				"final": false,
				"name": "_format",
				"id": 714,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"715": {
				"final": false,
				"name": "restore",
				"id": 715,
				"type": "Boolean",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"716": {
				"final": true,
				"name": "group",
				"id": 716,
				"type": "ELEMENT_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 5,
				"dependency": "sys"
			}
		}
	},
	"844": {
		"name": "Birthday",
		"app": "tutanota",
		"version": 98,
		"since": 23,
		"type": "AGGREGATED_TYPE",
		"id": 844,
		"rootId": "CHR1dGFub3RhAANM",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"845": {
				"final": true,
				"name": "_id",
				"id": 845,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"846": {
				"final": false,
				"name": "day",
				"id": 846,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"847": {
				"final": false,
				"name": "month",
				"id": 847,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"848": {
				"final": false,
				"name": "year",
				"id": 848,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"853": {
		"name": "PhotosRef",
		"app": "tutanota",
		"version": 98,
		"since": 23,
		"type": "AGGREGATED_TYPE",
		"id": 853,
		"rootId": "CHR1dGFub3RhAANV",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"854": {
				"final": true,
				"name": "_id",
				"id": 854,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"855": {
				"final": true,
				"name": "files",
				"id": 855,
				"type": "LIST_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 13,
				"dependency": null
			}
		}
	},
	"867": {
		"name": "ListUnsubscribeData",
		"app": "tutanota",
		"version": 98,
		"since": 24,
		"type": "DATA_TRANSFER_TYPE",
		"id": 867,
		"rootId": "CHR1dGFub3RhAANj",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"868": {
				"final": false,
				"name": "_format",
				"id": 868,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"871": {
				"final": false,
				"name": "postLink",
				"id": 871,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"869": {
				"final": false,
				"name": "mail",
				"id": 869,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 97,
				"dependency": null
			}
		}
	},
	"926": {
		"name": "CalendarRepeatRule",
		"app": "tutanota",
		"version": 98,
		"since": 33,
		"type": "AGGREGATED_TYPE",
		"id": 926,
		"rootId": "CHR1dGFub3RhAAOe",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"927": {
				"final": true,
				"name": "_id",
				"id": 927,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"928": {
				"final": false,
				"name": "frequency",
				"id": 928,
				"type": "Number",
				"cardinality": "One",
				"encrypted": true
			},
			"929": {
				"final": false,
				"name": "endType",
				"id": 929,
				"type": "Number",
				"cardinality": "One",
				"encrypted": true
			},
			"930": {
				"final": false,
				"name": "endValue",
				"id": 930,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": true
			},
			"931": {
				"final": false,
				"name": "interval",
				"id": 931,
				"type": "Number",
				"cardinality": "One",
				"encrypted": true
			},
			"932": {
				"final": false,
				"name": "timeZone",
				"id": 932,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			}
		},
		"associations": {
			"1319": {
				"final": false,
				"name": "excludedDates",
				"id": 1319,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 2073,
				"dependency": "sys"
			},
			"1590": {
				"final": false,
				"name": "advancedRules",
				"id": 1590,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 1586,
				"dependency": null
			}
		}
	},
	"933": {
		"name": "CalendarEvent",
		"app": "tutanota",
		"version": 98,
		"since": 33,
		"type": "LIST_ELEMENT_TYPE",
		"id": 933,
		"rootId": "CHR1dGFub3RhAAOl",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"935": {
				"final": true,
				"name": "_id",
				"id": 935,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"936": {
				"final": true,
				"name": "_permissions",
				"id": 936,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"937": {
				"final": false,
				"name": "_format",
				"id": 937,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"938": {
				"final": true,
				"name": "_ownerGroup",
				"id": 938,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"939": {
				"final": true,
				"name": "_ownerEncSessionKey",
				"id": 939,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"940": {
				"final": false,
				"name": "summary",
				"id": 940,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"941": {
				"final": false,
				"name": "description",
				"id": 941,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"942": {
				"final": false,
				"name": "startTime",
				"id": 942,
				"type": "Date",
				"cardinality": "One",
				"encrypted": true
			},
			"943": {
				"final": false,
				"name": "endTime",
				"id": 943,
				"type": "Date",
				"cardinality": "One",
				"encrypted": true
			},
			"944": {
				"final": false,
				"name": "location",
				"id": 944,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"988": {
				"final": false,
				"name": "uid",
				"id": 988,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": true
			},
			"1088": {
				"final": false,
				"name": "hashedUid",
				"id": 1088,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1089": {
				"final": false,
				"name": "sequence",
				"id": 1089,
				"type": "Number",
				"cardinality": "One",
				"encrypted": true
			},
			"1090": {
				"final": false,
				"name": "invitedConfidentially",
				"id": 1090,
				"type": "Boolean",
				"cardinality": "ZeroOrOne",
				"encrypted": true
			},
			"1320": {
				"final": false,
				"name": "recurrenceId",
				"id": 1320,
				"type": "Date",
				"cardinality": "ZeroOrOne",
				"encrypted": true
			},
			"1401": {
				"final": true,
				"name": "_ownerKeyVersion",
				"id": 1401,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1741": {
				"final": false,
				"name": "sender",
				"id": 1741,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": true
			}
		},
		"associations": {
			"945": {
				"final": false,
				"name": "repeatRule",
				"id": 945,
				"type": "AGGREGATION",
				"cardinality": "ZeroOrOne",
				"refTypeId": 926,
				"dependency": null
			},
			"946": {
				"final": false,
				"name": "alarmInfos",
				"id": 946,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "Any",
				"refTypeId": 1541,
				"dependency": "sys"
			},
			"1091": {
				"final": false,
				"name": "attendees",
				"id": 1091,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 1084,
				"dependency": null
			},
			"1092": {
				"final": false,
				"name": "organizer",
				"id": 1092,
				"type": "AGGREGATION",
				"cardinality": "ZeroOrOne",
				"refTypeId": 612,
				"dependency": null
			}
		}
	},
	"947": {
		"name": "CalendarGroupRoot",
		"app": "tutanota",
		"version": 98,
		"since": 33,
		"type": "ELEMENT_TYPE",
		"id": 947,
		"rootId": "CHR1dGFub3RhAAOz",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"949": {
				"final": true,
				"name": "_id",
				"id": 949,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"950": {
				"final": true,
				"name": "_permissions",
				"id": 950,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"951": {
				"final": false,
				"name": "_format",
				"id": 951,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"952": {
				"final": true,
				"name": "_ownerGroup",
				"id": 952,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"953": {
				"final": true,
				"name": "_ownerEncSessionKey",
				"id": 953,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1402": {
				"final": true,
				"name": "_ownerKeyVersion",
				"id": 1402,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"954": {
				"final": true,
				"name": "shortEvents",
				"id": 954,
				"type": "LIST_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 933,
				"dependency": null
			},
			"955": {
				"final": true,
				"name": "longEvents",
				"id": 955,
				"type": "LIST_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 933,
				"dependency": null
			},
			"1103": {
				"final": true,
				"name": "index",
				"id": 1103,
				"type": "AGGREGATION",
				"cardinality": "ZeroOrOne",
				"refTypeId": 1100,
				"dependency": null
			},
			"1739": {
				"final": false,
				"name": "pendingEvents",
				"id": 1739,
				"type": "AGGREGATION",
				"cardinality": "ZeroOrOne",
				"refTypeId": 1736,
				"dependency": null
			}
		}
	},
	"956": {
		"name": "UserAreaGroupData",
		"app": "tutanota",
		"version": 98,
		"since": 33,
		"type": "AGGREGATED_TYPE",
		"id": 956,
		"rootId": "CHR1dGFub3RhAAO8",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"957": {
				"final": true,
				"name": "_id",
				"id": 957,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"958": {
				"final": false,
				"name": "groupEncGroupRootSessionKey",
				"id": 958,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"959": {
				"final": false,
				"name": "adminEncGroupKey",
				"id": 959,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"960": {
				"final": false,
				"name": "customerEncGroupInfoSessionKey",
				"id": 960,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"961": {
				"final": false,
				"name": "userEncGroupKey",
				"id": 961,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"962": {
				"final": false,
				"name": "groupInfoEncName",
				"id": 962,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"1423": {
				"final": false,
				"name": "adminKeyVersion",
				"id": 1423,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1424": {
				"final": false,
				"name": "customerKeyVersion",
				"id": 1424,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1425": {
				"final": false,
				"name": "userKeyVersion",
				"id": 1425,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"963": {
				"final": true,
				"name": "adminGroup",
				"id": 963,
				"type": "ELEMENT_ASSOCIATION",
				"cardinality": "ZeroOrOne",
				"refTypeId": 5,
				"dependency": "sys"
			}
		}
	},
	"964": {
		"name": "UserAreaGroupPostData",
		"app": "tutanota",
		"version": 98,
		"since": 33,
		"type": "DATA_TRANSFER_TYPE",
		"id": 964,
		"rootId": "CHR1dGFub3RhAAPE",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"965": {
				"final": false,
				"name": "_format",
				"id": 965,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"966": {
				"final": false,
				"name": "groupData",
				"id": 966,
				"type": "AGGREGATION",
				"cardinality": "One",
				"refTypeId": 956,
				"dependency": null
			}
		}
	},
	"968": {
		"name": "GroupSettings",
		"app": "tutanota",
		"version": 98,
		"since": 34,
		"type": "AGGREGATED_TYPE",
		"id": 968,
		"rootId": "CHR1dGFub3RhAAPI",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"969": {
				"final": true,
				"name": "_id",
				"id": 969,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"971": {
				"final": false,
				"name": "color",
				"id": 971,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"1020": {
				"final": false,
				"name": "name",
				"id": 1020,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": true
			},
			"1468": {
				"final": false,
				"name": "sourceUrl",
				"id": 1468,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": true
			}
		},
		"associations": {
			"970": {
				"final": true,
				"name": "group",
				"id": 970,
				"type": "ELEMENT_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 5,
				"dependency": "sys"
			},
			"1449": {
				"final": false,
				"name": "defaultAlarmsList",
				"id": 1449,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 1446,
				"dependency": null
			}
		}
	},
	"972": {
		"name": "UserSettingsGroupRoot",
		"app": "tutanota",
		"version": 98,
		"since": 34,
		"type": "ELEMENT_TYPE",
		"id": 972,
		"rootId": "CHR1dGFub3RhAAPM",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"974": {
				"final": true,
				"name": "_id",
				"id": 974,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"975": {
				"final": true,
				"name": "_permissions",
				"id": 975,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"976": {
				"final": false,
				"name": "_format",
				"id": 976,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"977": {
				"final": true,
				"name": "_ownerGroup",
				"id": 977,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"978": {
				"final": true,
				"name": "_ownerEncSessionKey",
				"id": 978,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"980": {
				"final": false,
				"name": "timeFormat",
				"id": 980,
				"type": "Number",
				"cardinality": "One",
				"encrypted": true
			},
			"981": {
				"final": false,
				"name": "startOfTheWeek",
				"id": 981,
				"type": "Number",
				"cardinality": "One",
				"encrypted": true
			},
			"1234": {
				"final": false,
				"name": "usageDataOptedIn",
				"id": 1234,
				"type": "Boolean",
				"cardinality": "ZeroOrOne",
				"encrypted": true
			},
			"1403": {
				"final": true,
				"name": "_ownerKeyVersion",
				"id": 1403,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1735": {
				"final": false,
				"name": "birthdayCalendarColor",
				"id": 1735,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": true
			}
		},
		"associations": {
			"979": {
				"final": false,
				"name": "groupSettings",
				"id": 979,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 968,
				"dependency": null
			},
			"1740": {
				"final": false,
				"name": "defaultCalendar",
				"id": 1740,
				"type": "ELEMENT_ASSOCIATION",
				"cardinality": "ZeroOrOne",
				"refTypeId": 947,
				"dependency": null
			}
		}
	},
	"982": {
		"name": "CalendarDeleteData",
		"app": "tutanota",
		"version": 98,
		"since": 34,
		"type": "DATA_TRANSFER_TYPE",
		"id": 982,
		"rootId": "CHR1dGFub3RhAAPW",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"983": {
				"final": false,
				"name": "_format",
				"id": 983,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"984": {
				"final": false,
				"name": "groupRootId",
				"id": 984,
				"type": "ELEMENT_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 947,
				"dependency": null
			}
		}
	},
	"985": {
		"name": "CreateGroupPostReturn",
		"app": "tutanota",
		"version": 98,
		"since": 34,
		"type": "DATA_TRANSFER_TYPE",
		"id": 985,
		"rootId": "CHR1dGFub3RhAAPZ",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"986": {
				"final": false,
				"name": "_format",
				"id": 986,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"987": {
				"final": true,
				"name": "group",
				"id": 987,
				"type": "ELEMENT_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 5,
				"dependency": "sys"
			}
		}
	},
	"992": {
		"name": "SharedGroupData",
		"app": "tutanota",
		"version": 98,
		"since": 38,
		"type": "AGGREGATED_TYPE",
		"id": 992,
		"rootId": "CHR1dGFub3RhAAPg",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"993": {
				"final": true,
				"name": "_id",
				"id": 993,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"994": {
				"final": false,
				"name": "capability",
				"id": 994,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"995": {
				"final": false,
				"name": "sessionEncSharedGroupKey",
				"id": 995,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"996": {
				"final": false,
				"name": "sessionEncSharedGroupName",
				"id": 996,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"997": {
				"final": false,
				"name": "sessionEncInviterName",
				"id": 997,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"998": {
				"final": false,
				"name": "bucketEncInvitationSessionKey",
				"id": 998,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"999": {
				"final": true,
				"name": "sharedGroupEncInviterGroupInfoKey",
				"id": 999,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"1000": {
				"final": true,
				"name": "sharedGroupEncSharedGroupInfoKey",
				"id": 1000,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"1001": {
				"final": false,
				"name": "sharedGroup",
				"id": 1001,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"1420": {
				"final": true,
				"name": "sharedGroupKeyVersion",
				"id": 1420,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"1002": {
		"name": "GroupInvitationPostData",
		"app": "tutanota",
		"version": 98,
		"since": 38,
		"type": "DATA_TRANSFER_TYPE",
		"id": 1002,
		"rootId": "CHR1dGFub3RhAAPq",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1003": {
				"final": false,
				"name": "_format",
				"id": 1003,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1004": {
				"final": false,
				"name": "sharedGroupData",
				"id": 1004,
				"type": "AGGREGATION",
				"cardinality": "One",
				"refTypeId": 992,
				"dependency": null
			},
			"1005": {
				"final": false,
				"name": "internalKeyData",
				"id": 1005,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 527,
				"dependency": null
			}
		}
	},
	"1006": {
		"name": "GroupInvitationPostReturn",
		"app": "tutanota",
		"version": 98,
		"since": 38,
		"type": "DATA_TRANSFER_TYPE",
		"id": 1006,
		"rootId": "CHR1dGFub3RhAAPu",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1007": {
				"final": false,
				"name": "_format",
				"id": 1007,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1008": {
				"final": false,
				"name": "existingMailAddresses",
				"id": 1008,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 92,
				"dependency": null
			},
			"1009": {
				"final": false,
				"name": "invalidMailAddresses",
				"id": 1009,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 92,
				"dependency": null
			},
			"1010": {
				"final": false,
				"name": "invitedMailAddresses",
				"id": 1010,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 92,
				"dependency": null
			}
		}
	},
	"1011": {
		"name": "GroupInvitationPutData",
		"app": "tutanota",
		"version": 98,
		"since": 38,
		"type": "DATA_TRANSFER_TYPE",
		"id": 1011,
		"rootId": "CHR1dGFub3RhAAPz",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1012": {
				"final": false,
				"name": "_format",
				"id": 1012,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1013": {
				"final": true,
				"name": "userGroupEncGroupKey",
				"id": 1013,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"1014": {
				"final": true,
				"name": "sharedGroupEncInviteeGroupInfoKey",
				"id": 1014,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"1418": {
				"final": false,
				"name": "userGroupKeyVersion",
				"id": 1418,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1419": {
				"final": true,
				"name": "sharedGroupKeyVersion",
				"id": 1419,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1015": {
				"final": false,
				"name": "receivedInvitation",
				"id": 1015,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 1602,
				"dependency": "sys"
			}
		}
	},
	"1016": {
		"name": "GroupInvitationDeleteData",
		"app": "tutanota",
		"version": 98,
		"since": 38,
		"type": "DATA_TRANSFER_TYPE",
		"id": 1016,
		"rootId": "CHR1dGFub3RhAAP4",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1017": {
				"final": false,
				"name": "_format",
				"id": 1017,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1018": {
				"final": false,
				"name": "receivedInvitation",
				"id": 1018,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 1602,
				"dependency": "sys"
			}
		}
	},
	"1023": {
		"name": "ReportedMailFieldMarker",
		"app": "tutanota",
		"version": 98,
		"since": 40,
		"type": "AGGREGATED_TYPE",
		"id": 1023,
		"rootId": "CHR1dGFub3RhAAP_",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1024": {
				"final": true,
				"name": "_id",
				"id": 1024,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"1025": {
				"final": false,
				"name": "marker",
				"id": 1025,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"1026": {
				"final": false,
				"name": "status",
				"id": 1026,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"1034": {
		"name": "PhishingMarkerWebsocketData",
		"app": "tutanota",
		"version": 98,
		"since": 40,
		"type": "DATA_TRANSFER_TYPE",
		"id": 1034,
		"rootId": "CHR1dGFub3RhAAQK",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1035": {
				"final": false,
				"name": "_format",
				"id": 1035,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1036": {
				"final": false,
				"name": "lastId",
				"id": 1036,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"1652": {
				"final": false,
				"name": "applicationVersionSum",
				"id": 1652,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1653": {
				"final": false,
				"name": "applicationTypesHash",
				"id": 1653,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1037": {
				"final": false,
				"name": "markers",
				"id": 1037,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 1023,
				"dependency": null
			}
		}
	},
	"1066": {
		"name": "ReportMailPostData",
		"app": "tutanota",
		"version": 98,
		"since": 40,
		"type": "DATA_TRANSFER_TYPE",
		"id": 1066,
		"rootId": "CHR1dGFub3RhAAQq",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1067": {
				"final": false,
				"name": "_format",
				"id": 1067,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1068": {
				"final": false,
				"name": "mailSessionKey",
				"id": 1068,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"1082": {
				"final": false,
				"name": "reportType",
				"id": 1082,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1069": {
				"final": false,
				"name": "mailId",
				"id": 1069,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 97,
				"dependency": null
			}
		}
	},
	"1084": {
		"name": "CalendarEventAttendee",
		"app": "tutanota",
		"version": 98,
		"since": 42,
		"type": "AGGREGATED_TYPE",
		"id": 1084,
		"rootId": "CHR1dGFub3RhAAQ8",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1085": {
				"final": true,
				"name": "_id",
				"id": 1085,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"1086": {
				"final": false,
				"name": "status",
				"id": 1086,
				"type": "Number",
				"cardinality": "One",
				"encrypted": true
			}
		},
		"associations": {
			"1087": {
				"final": true,
				"name": "address",
				"id": 1087,
				"type": "AGGREGATION",
				"cardinality": "One",
				"refTypeId": 612,
				"dependency": null
			}
		}
	},
	"1093": {
		"name": "CalendarEventUidIndex",
		"app": "tutanota",
		"version": 98,
		"since": 42,
		"type": "LIST_ELEMENT_TYPE",
		"id": 1093,
		"rootId": "CHR1dGFub3RhAARF",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1095": {
				"final": true,
				"name": "_id",
				"id": 1095,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"1096": {
				"final": true,
				"name": "_permissions",
				"id": 1096,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"1097": {
				"final": false,
				"name": "_format",
				"id": 1097,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1098": {
				"final": true,
				"name": "_ownerGroup",
				"id": 1098,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"1099": {
				"final": true,
				"name": "progenitor",
				"id": 1099,
				"type": "LIST_ELEMENT_ASSOCIATION_CUSTOM",
				"cardinality": "ZeroOrOne",
				"refTypeId": 933,
				"dependency": null
			},
			"1321": {
				"final": false,
				"name": "alteredInstances",
				"id": 1321,
				"type": "LIST_ELEMENT_ASSOCIATION_CUSTOM",
				"cardinality": "Any",
				"refTypeId": 933,
				"dependency": null
			}
		}
	},
	"1100": {
		"name": "CalendarEventIndexRef",
		"app": "tutanota",
		"version": 98,
		"since": 42,
		"type": "AGGREGATED_TYPE",
		"id": 1100,
		"rootId": "CHR1dGFub3RhAARM",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1101": {
				"final": true,
				"name": "_id",
				"id": 1101,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1102": {
				"final": true,
				"name": "list",
				"id": 1102,
				"type": "LIST_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 1093,
				"dependency": null
			}
		}
	},
	"1104": {
		"name": "CalendarEventUpdate",
		"app": "tutanota",
		"version": 98,
		"since": 42,
		"type": "LIST_ELEMENT_TYPE",
		"id": 1104,
		"rootId": "CHR1dGFub3RhAARQ",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"1106": {
				"final": true,
				"name": "_id",
				"id": 1106,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"1107": {
				"final": true,
				"name": "_permissions",
				"id": 1107,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"1108": {
				"final": false,
				"name": "_format",
				"id": 1108,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1109": {
				"final": true,
				"name": "_ownerGroup",
				"id": 1109,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1110": {
				"final": true,
				"name": "_ownerEncSessionKey",
				"id": 1110,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1111": {
				"final": true,
				"name": "sender",
				"id": 1111,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"1405": {
				"final": true,
				"name": "_ownerKeyVersion",
				"id": 1405,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"1112": {
				"final": true,
				"name": "file",
				"id": 1112,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 13,
				"dependency": null
			}
		}
	},
	"1113": {
		"name": "CalendarEventUpdateList",
		"app": "tutanota",
		"version": 98,
		"since": 42,
		"type": "AGGREGATED_TYPE",
		"id": 1113,
		"rootId": "CHR1dGFub3RhAARZ",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1114": {
				"final": true,
				"name": "_id",
				"id": 1114,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1115": {
				"final": true,
				"name": "list",
				"id": 1115,
				"type": "LIST_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 1104,
				"dependency": null
			}
		}
	},
	"1122": {
		"name": "EntropyData",
		"app": "tutanota",
		"version": 98,
		"since": 43,
		"type": "DATA_TRANSFER_TYPE",
		"id": 1122,
		"rootId": "CHR1dGFub3RhAARi",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1123": {
				"final": false,
				"name": "_format",
				"id": 1123,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1124": {
				"final": false,
				"name": "userEncEntropy",
				"id": 1124,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"1432": {
				"final": false,
				"name": "userKeyVersion",
				"id": 1432,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"1126": {
		"name": "OutOfOfficeNotificationMessage",
		"app": "tutanota",
		"version": 98,
		"since": 44,
		"type": "AGGREGATED_TYPE",
		"id": 1126,
		"rootId": "CHR1dGFub3RhAARm",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1127": {
				"final": true,
				"name": "_id",
				"id": 1127,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"1128": {
				"final": false,
				"name": "subject",
				"id": 1128,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"1129": {
				"final": false,
				"name": "message",
				"id": 1129,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"1130": {
				"final": false,
				"name": "type",
				"id": 1130,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"1131": {
		"name": "OutOfOfficeNotification",
		"app": "tutanota",
		"version": 98,
		"since": 44,
		"type": "ELEMENT_TYPE",
		"id": 1131,
		"rootId": "CHR1dGFub3RhAARr",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1133": {
				"final": true,
				"name": "_id",
				"id": 1133,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"1134": {
				"final": true,
				"name": "_permissions",
				"id": 1134,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"1135": {
				"final": false,
				"name": "_format",
				"id": 1135,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1136": {
				"final": true,
				"name": "_ownerGroup",
				"id": 1136,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1137": {
				"final": false,
				"name": "enabled",
				"id": 1137,
				"type": "Boolean",
				"cardinality": "One",
				"encrypted": false
			},
			"1138": {
				"final": false,
				"name": "startDate",
				"id": 1138,
				"type": "Date",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1139": {
				"final": false,
				"name": "endDate",
				"id": 1139,
				"type": "Date",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"1140": {
				"final": false,
				"name": "notifications",
				"id": 1140,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 1126,
				"dependency": null
			}
		}
	},
	"1141": {
		"name": "OutOfOfficeNotificationRecipient",
		"app": "tutanota",
		"version": 98,
		"since": 44,
		"type": "LIST_ELEMENT_TYPE",
		"id": 1141,
		"rootId": "CHR1dGFub3RhAAR1",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1143": {
				"final": true,
				"name": "_id",
				"id": 1143,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"1144": {
				"final": true,
				"name": "_permissions",
				"id": 1144,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"1145": {
				"final": false,
				"name": "_format",
				"id": 1145,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1146": {
				"final": true,
				"name": "_ownerGroup",
				"id": 1146,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"1147": {
		"name": "OutOfOfficeNotificationRecipientList",
		"app": "tutanota",
		"version": 98,
		"since": 44,
		"type": "AGGREGATED_TYPE",
		"id": 1147,
		"rootId": "CHR1dGFub3RhAAR7",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1148": {
				"final": true,
				"name": "_id",
				"id": 1148,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1149": {
				"final": true,
				"name": "list",
				"id": 1149,
				"type": "LIST_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 1141,
				"dependency": null
			}
		}
	},
	"1154": {
		"name": "EmailTemplateContent",
		"app": "tutanota",
		"version": 98,
		"since": 45,
		"type": "AGGREGATED_TYPE",
		"id": 1154,
		"rootId": "CHR1dGFub3RhAASC",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1155": {
				"final": true,
				"name": "_id",
				"id": 1155,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"1156": {
				"final": false,
				"name": "text",
				"id": 1156,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"1157": {
				"final": false,
				"name": "languageCode",
				"id": 1157,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			}
		},
		"associations": {}
	},
	"1158": {
		"name": "EmailTemplate",
		"app": "tutanota",
		"version": 98,
		"since": 45,
		"type": "LIST_ELEMENT_TYPE",
		"id": 1158,
		"rootId": "CHR1dGFub3RhAASG",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"1160": {
				"final": true,
				"name": "_id",
				"id": 1160,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"1161": {
				"final": true,
				"name": "_permissions",
				"id": 1161,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"1162": {
				"final": false,
				"name": "_format",
				"id": 1162,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1163": {
				"final": true,
				"name": "_ownerGroup",
				"id": 1163,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1164": {
				"final": true,
				"name": "_ownerEncSessionKey",
				"id": 1164,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1165": {
				"final": false,
				"name": "title",
				"id": 1165,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"1166": {
				"final": false,
				"name": "tag",
				"id": 1166,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"1406": {
				"final": true,
				"name": "_ownerKeyVersion",
				"id": 1406,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"1167": {
				"final": false,
				"name": "contents",
				"id": 1167,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 1154,
				"dependency": null
			}
		}
	},
	"1168": {
		"name": "KnowledgeBaseEntryKeyword",
		"app": "tutanota",
		"version": 98,
		"since": 45,
		"type": "AGGREGATED_TYPE",
		"id": 1168,
		"rootId": "CHR1dGFub3RhAASQ",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1169": {
				"final": true,
				"name": "_id",
				"id": 1169,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"1170": {
				"final": false,
				"name": "keyword",
				"id": 1170,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			}
		},
		"associations": {}
	},
	"1171": {
		"name": "KnowledgeBaseEntry",
		"app": "tutanota",
		"version": 98,
		"since": 45,
		"type": "LIST_ELEMENT_TYPE",
		"id": 1171,
		"rootId": "CHR1dGFub3RhAAST",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"1173": {
				"final": true,
				"name": "_id",
				"id": 1173,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"1174": {
				"final": true,
				"name": "_permissions",
				"id": 1174,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"1175": {
				"final": false,
				"name": "_format",
				"id": 1175,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1176": {
				"final": true,
				"name": "_ownerGroup",
				"id": 1176,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1177": {
				"final": true,
				"name": "_ownerEncSessionKey",
				"id": 1177,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1178": {
				"final": false,
				"name": "title",
				"id": 1178,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"1179": {
				"final": false,
				"name": "description",
				"id": 1179,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"1413": {
				"final": true,
				"name": "_ownerKeyVersion",
				"id": 1413,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"1180": {
				"final": false,
				"name": "keywords",
				"id": 1180,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 1168,
				"dependency": null
			}
		}
	},
	"1181": {
		"name": "TemplateGroupRoot",
		"app": "tutanota",
		"version": 98,
		"since": 45,
		"type": "ELEMENT_TYPE",
		"id": 1181,
		"rootId": "CHR1dGFub3RhAASd",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"1183": {
				"final": true,
				"name": "_id",
				"id": 1183,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"1184": {
				"final": true,
				"name": "_permissions",
				"id": 1184,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"1185": {
				"final": false,
				"name": "_format",
				"id": 1185,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1186": {
				"final": true,
				"name": "_ownerGroup",
				"id": 1186,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1187": {
				"final": true,
				"name": "_ownerEncSessionKey",
				"id": 1187,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1412": {
				"final": true,
				"name": "_ownerKeyVersion",
				"id": 1412,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"1188": {
				"final": true,
				"name": "templates",
				"id": 1188,
				"type": "LIST_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 1158,
				"dependency": null
			},
			"1189": {
				"final": true,
				"name": "knowledgeBase",
				"id": 1189,
				"type": "LIST_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 1171,
				"dependency": null
			}
		}
	},
	"1190": {
		"name": "UserAreaGroupDeleteData",
		"app": "tutanota",
		"version": 98,
		"since": 45,
		"type": "DATA_TRANSFER_TYPE",
		"id": 1190,
		"rootId": "CHR1dGFub3RhAASm",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1191": {
				"final": false,
				"name": "_format",
				"id": 1191,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1192": {
				"final": false,
				"name": "group",
				"id": 1192,
				"type": "ELEMENT_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 5,
				"dependency": "sys"
			}
		}
	},
	"1195": {
		"name": "MailboxProperties",
		"app": "tutanota",
		"version": 98,
		"since": 47,
		"type": "ELEMENT_TYPE",
		"id": 1195,
		"rootId": "CHR1dGFub3RhAASr",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"1197": {
				"final": true,
				"name": "_id",
				"id": 1197,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"1198": {
				"final": true,
				"name": "_permissions",
				"id": 1198,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"1199": {
				"final": false,
				"name": "_format",
				"id": 1199,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1200": {
				"final": true,
				"name": "_ownerGroup",
				"id": 1200,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1201": {
				"final": true,
				"name": "_ownerEncSessionKey",
				"id": 1201,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1202": {
				"final": false,
				"name": "reportMovedMails",
				"id": 1202,
				"type": "Number",
				"cardinality": "One",
				"encrypted": true
			},
			"1411": {
				"final": true,
				"name": "_ownerKeyVersion",
				"id": 1411,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"1267": {
				"final": false,
				"name": "mailAddressProperties",
				"id": 1267,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 1263,
				"dependency": null
			}
		}
	},
	"1217": {
		"name": "SpamResults",
		"app": "tutanota",
		"version": 98,
		"since": 48,
		"type": "AGGREGATED_TYPE",
		"id": 1217,
		"rootId": "CHR1dGFub3RhAATB",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1218": {
				"final": true,
				"name": "_id",
				"id": 1218,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1219": {
				"final": true,
				"name": "list",
				"id": 1219,
				"type": "LIST_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 1208,
				"dependency": null
			}
		}
	},
	"1245": {
		"name": "NewsId",
		"app": "tutanota",
		"version": 98,
		"since": 55,
		"type": "AGGREGATED_TYPE",
		"id": 1245,
		"rootId": "CHR1dGFub3RhAATd",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1246": {
				"final": true,
				"name": "_id",
				"id": 1246,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"1247": {
				"final": false,
				"name": "newsItemName",
				"id": 1247,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"1248": {
				"final": false,
				"name": "newsItemId",
				"id": 1248,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"1256": {
		"name": "NewsOut",
		"app": "tutanota",
		"version": 98,
		"since": 55,
		"type": "DATA_TRANSFER_TYPE",
		"id": 1256,
		"rootId": "CHR1dGFub3RhAATo",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1257": {
				"final": false,
				"name": "_format",
				"id": 1257,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1258": {
				"final": false,
				"name": "newsItemIds",
				"id": 1258,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 1245,
				"dependency": null
			}
		}
	},
	"1259": {
		"name": "NewsIn",
		"app": "tutanota",
		"version": 98,
		"since": 55,
		"type": "DATA_TRANSFER_TYPE",
		"id": 1259,
		"rootId": "CHR1dGFub3RhAATr",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1260": {
				"final": false,
				"name": "_format",
				"id": 1260,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1261": {
				"final": false,
				"name": "newsItemId",
				"id": 1261,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"1263": {
		"name": "MailAddressProperties",
		"app": "tutanota",
		"version": 98,
		"since": 56,
		"type": "AGGREGATED_TYPE",
		"id": 1263,
		"rootId": "CHR1dGFub3RhAATv",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1264": {
				"final": true,
				"name": "_id",
				"id": 1264,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"1265": {
				"final": true,
				"name": "mailAddress",
				"id": 1265,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"1266": {
				"final": false,
				"name": "senderName",
				"id": 1266,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			}
		},
		"associations": {}
	},
	"1269": {
		"name": "Header",
		"app": "tutanota",
		"version": 98,
		"since": 58,
		"type": "AGGREGATED_TYPE",
		"id": 1269,
		"rootId": "CHR1dGFub3RhAAT1",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1270": {
				"final": true,
				"name": "_id",
				"id": 1270,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"1271": {
				"final": true,
				"name": "headers",
				"id": 1271,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": true
			},
			"1272": {
				"final": true,
				"name": "compressedHeaders",
				"id": 1272,
				"type": "CompressedString",
				"cardinality": "ZeroOrOne",
				"encrypted": true
			}
		},
		"associations": {}
	},
	"1273": {
		"name": "Body",
		"app": "tutanota",
		"version": 98,
		"since": 58,
		"type": "AGGREGATED_TYPE",
		"id": 1273,
		"rootId": "CHR1dGFub3RhAAT5",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1274": {
				"final": true,
				"name": "_id",
				"id": 1274,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"1275": {
				"final": true,
				"name": "text",
				"id": 1275,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": true
			},
			"1276": {
				"final": true,
				"name": "compressedText",
				"id": 1276,
				"type": "CompressedString",
				"cardinality": "ZeroOrOne",
				"encrypted": true
			}
		},
		"associations": {}
	},
	"1277": {
		"name": "Recipients",
		"app": "tutanota",
		"version": 98,
		"since": 58,
		"type": "AGGREGATED_TYPE",
		"id": 1277,
		"rootId": "CHR1dGFub3RhAAT9",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1278": {
				"final": true,
				"name": "_id",
				"id": 1278,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1279": {
				"final": true,
				"name": "toRecipients",
				"id": 1279,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 92,
				"dependency": null
			},
			"1280": {
				"final": true,
				"name": "ccRecipients",
				"id": 1280,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 92,
				"dependency": null
			},
			"1281": {
				"final": true,
				"name": "bccRecipients",
				"id": 1281,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 92,
				"dependency": null
			}
		}
	},
	"1282": {
		"name": "MailDetails",
		"app": "tutanota",
		"version": 98,
		"since": 58,
		"type": "AGGREGATED_TYPE",
		"id": 1282,
		"rootId": "CHR1dGFub3RhAAUC",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1283": {
				"final": true,
				"name": "_id",
				"id": 1283,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"1284": {
				"final": true,
				"name": "sentDate",
				"id": 1284,
				"type": "Date",
				"cardinality": "One",
				"encrypted": false
			},
			"1289": {
				"final": false,
				"name": "authStatus",
				"id": 1289,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1285": {
				"final": true,
				"name": "replyTos",
				"id": 1285,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 612,
				"dependency": null
			},
			"1286": {
				"final": true,
				"name": "recipients",
				"id": 1286,
				"type": "AGGREGATION",
				"cardinality": "One",
				"refTypeId": 1277,
				"dependency": null
			},
			"1287": {
				"final": true,
				"name": "headers",
				"id": 1287,
				"type": "AGGREGATION",
				"cardinality": "ZeroOrOne",
				"refTypeId": 1269,
				"dependency": null
			},
			"1288": {
				"final": true,
				"name": "body",
				"id": 1288,
				"type": "AGGREGATION",
				"cardinality": "One",
				"refTypeId": 1273,
				"dependency": null
			}
		}
	},
	"1290": {
		"name": "MailDetailsDraft",
		"app": "tutanota",
		"version": 98,
		"since": 58,
		"type": "LIST_ELEMENT_TYPE",
		"id": 1290,
		"rootId": "CHR1dGFub3RhAAUK",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"1292": {
				"final": true,
				"name": "_id",
				"id": 1292,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"1293": {
				"final": true,
				"name": "_permissions",
				"id": 1293,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"1294": {
				"final": false,
				"name": "_format",
				"id": 1294,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1295": {
				"final": true,
				"name": "_ownerGroup",
				"id": 1295,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1296": {
				"final": true,
				"name": "_ownerEncSessionKey",
				"id": 1296,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1407": {
				"final": true,
				"name": "_ownerKeyVersion",
				"id": 1407,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"1297": {
				"final": true,
				"name": "details",
				"id": 1297,
				"type": "AGGREGATION",
				"cardinality": "One",
				"refTypeId": 1282,
				"dependency": null
			}
		}
	},
	"1298": {
		"name": "MailDetailsBlob",
		"app": "tutanota",
		"version": 98,
		"since": 58,
		"type": "BLOB_ELEMENT_TYPE",
		"id": 1298,
		"rootId": "CHR1dGFub3RhAAUS",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"1300": {
				"final": true,
				"name": "_id",
				"id": 1300,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"1301": {
				"final": true,
				"name": "_permissions",
				"id": 1301,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"1302": {
				"final": false,
				"name": "_format",
				"id": 1302,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1303": {
				"final": true,
				"name": "_ownerGroup",
				"id": 1303,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1304": {
				"final": true,
				"name": "_ownerEncSessionKey",
				"id": 1304,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1408": {
				"final": true,
				"name": "_ownerKeyVersion",
				"id": 1408,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"1305": {
				"final": true,
				"name": "details",
				"id": 1305,
				"type": "AGGREGATION",
				"cardinality": "One",
				"refTypeId": 1282,
				"dependency": null
			}
		}
	},
	"1311": {
		"name": "UpdateMailFolderData",
		"app": "tutanota",
		"version": 98,
		"since": 59,
		"type": "DATA_TRANSFER_TYPE",
		"id": 1311,
		"rootId": "CHR1dGFub3RhAAUf",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1312": {
				"final": false,
				"name": "_format",
				"id": 1312,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1313": {
				"final": false,
				"name": "folder",
				"id": 1313,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 429,
				"dependency": null
			},
			"1314": {
				"final": false,
				"name": "newParent",
				"id": 1314,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "ZeroOrOne",
				"refTypeId": 429,
				"dependency": null
			}
		}
	},
	"1315": {
		"name": "MailDetailsDraftsRef",
		"app": "tutanota",
		"version": 98,
		"since": 60,
		"type": "AGGREGATED_TYPE",
		"id": 1315,
		"rootId": "CHR1dGFub3RhAAUj",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1316": {
				"final": true,
				"name": "_id",
				"id": 1316,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1317": {
				"final": true,
				"name": "list",
				"id": 1317,
				"type": "LIST_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 1290,
				"dependency": null
			}
		}
	},
	"1325": {
		"name": "ContactListEntry",
		"app": "tutanota",
		"version": 98,
		"since": 64,
		"type": "LIST_ELEMENT_TYPE",
		"id": 1325,
		"rootId": "CHR1dGFub3RhAAUt",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"1327": {
				"final": true,
				"name": "_id",
				"id": 1327,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"1328": {
				"final": true,
				"name": "_permissions",
				"id": 1328,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"1329": {
				"final": false,
				"name": "_format",
				"id": 1329,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1330": {
				"final": true,
				"name": "_ownerGroup",
				"id": 1330,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1331": {
				"final": true,
				"name": "_ownerEncSessionKey",
				"id": 1331,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1332": {
				"final": false,
				"name": "emailAddress",
				"id": 1332,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"1409": {
				"final": true,
				"name": "_ownerKeyVersion",
				"id": 1409,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"1333": {
		"name": "ContactListGroupRoot",
		"app": "tutanota",
		"version": 98,
		"since": 64,
		"type": "ELEMENT_TYPE",
		"id": 1333,
		"rootId": "CHR1dGFub3RhAAU1",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"1335": {
				"final": true,
				"name": "_id",
				"id": 1335,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"1336": {
				"final": true,
				"name": "_permissions",
				"id": 1336,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"1337": {
				"final": false,
				"name": "_format",
				"id": 1337,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1338": {
				"final": true,
				"name": "_ownerGroup",
				"id": 1338,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1339": {
				"final": true,
				"name": "_ownerEncSessionKey",
				"id": 1339,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1410": {
				"final": true,
				"name": "_ownerKeyVersion",
				"id": 1410,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"1340": {
				"final": true,
				"name": "entries",
				"id": 1340,
				"type": "LIST_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 1325,
				"dependency": null
			}
		}
	},
	"1347": {
		"name": "SymEncInternalRecipientKeyData",
		"app": "tutanota",
		"version": 98,
		"since": 66,
		"type": "AGGREGATED_TYPE",
		"id": 1347,
		"rootId": "CHR1dGFub3RhAAVD",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1348": {
				"final": true,
				"name": "_id",
				"id": 1348,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"1349": {
				"final": true,
				"name": "mailAddress",
				"id": 1349,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"1350": {
				"final": true,
				"name": "symEncBucketKey",
				"id": 1350,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"1435": {
				"final": false,
				"name": "symKeyVersion",
				"id": 1435,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1351": {
				"final": true,
				"name": "keyGroup",
				"id": 1351,
				"type": "ELEMENT_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 5,
				"dependency": "sys"
			}
		}
	},
	"1356": {
		"name": "ContactCustomDate",
		"app": "tutanota",
		"version": 98,
		"since": 67,
		"type": "AGGREGATED_TYPE",
		"id": 1356,
		"rootId": "CHR1dGFub3RhAAVM",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1357": {
				"final": true,
				"name": "_id",
				"id": 1357,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"1358": {
				"final": false,
				"name": "type",
				"id": 1358,
				"type": "Number",
				"cardinality": "One",
				"encrypted": true
			},
			"1359": {
				"final": false,
				"name": "customTypeName",
				"id": 1359,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"1360": {
				"final": false,
				"name": "dateIso",
				"id": 1360,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			}
		},
		"associations": {}
	},
	"1361": {
		"name": "ContactWebsite",
		"app": "tutanota",
		"version": 98,
		"since": 67,
		"type": "AGGREGATED_TYPE",
		"id": 1361,
		"rootId": "CHR1dGFub3RhAAVR",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1362": {
				"final": true,
				"name": "_id",
				"id": 1362,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"1363": {
				"final": false,
				"name": "type",
				"id": 1363,
				"type": "Number",
				"cardinality": "One",
				"encrypted": true
			},
			"1364": {
				"final": false,
				"name": "customTypeName",
				"id": 1364,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"1365": {
				"final": false,
				"name": "url",
				"id": 1365,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			}
		},
		"associations": {}
	},
	"1366": {
		"name": "ContactRelationship",
		"app": "tutanota",
		"version": 98,
		"since": 67,
		"type": "AGGREGATED_TYPE",
		"id": 1366,
		"rootId": "CHR1dGFub3RhAAVW",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1367": {
				"final": true,
				"name": "_id",
				"id": 1367,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"1368": {
				"final": false,
				"name": "type",
				"id": 1368,
				"type": "Number",
				"cardinality": "One",
				"encrypted": true
			},
			"1369": {
				"final": false,
				"name": "customTypeName",
				"id": 1369,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"1370": {
				"final": false,
				"name": "person",
				"id": 1370,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			}
		},
		"associations": {}
	},
	"1371": {
		"name": "ContactMessengerHandle",
		"app": "tutanota",
		"version": 98,
		"since": 67,
		"type": "AGGREGATED_TYPE",
		"id": 1371,
		"rootId": "CHR1dGFub3RhAAVb",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1372": {
				"final": true,
				"name": "_id",
				"id": 1372,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"1373": {
				"final": false,
				"name": "type",
				"id": 1373,
				"type": "Number",
				"cardinality": "One",
				"encrypted": true
			},
			"1374": {
				"final": false,
				"name": "customTypeName",
				"id": 1374,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"1375": {
				"final": false,
				"name": "handle",
				"id": 1375,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			}
		},
		"associations": {}
	},
	"1376": {
		"name": "ContactPronouns",
		"app": "tutanota",
		"version": 98,
		"since": 67,
		"type": "AGGREGATED_TYPE",
		"id": 1376,
		"rootId": "CHR1dGFub3RhAAVg",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1377": {
				"final": true,
				"name": "_id",
				"id": 1377,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"1378": {
				"final": false,
				"name": "language",
				"id": 1378,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"1379": {
				"final": false,
				"name": "pronouns",
				"id": 1379,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			}
		},
		"associations": {}
	},
	"1436": {
		"name": "TranslationGetIn",
		"app": "tutanota",
		"version": 98,
		"since": 70,
		"type": "DATA_TRANSFER_TYPE",
		"id": 1436,
		"rootId": "CHR1dGFub3RhAAWc",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1437": {
				"final": false,
				"name": "_format",
				"id": 1437,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1438": {
				"final": true,
				"name": "lang",
				"id": 1438,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"1439": {
		"name": "TranslationGetOut",
		"app": "tutanota",
		"version": 98,
		"since": 70,
		"type": "DATA_TRANSFER_TYPE",
		"id": 1439,
		"rootId": "CHR1dGFub3RhAAWf",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1440": {
				"final": false,
				"name": "_format",
				"id": 1440,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1441": {
				"final": false,
				"name": "giftCardSubject",
				"id": 1441,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"1442": {
				"final": false,
				"name": "invitationSubject",
				"id": 1442,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"1446": {
		"name": "DefaultAlarmInfo",
		"app": "tutanota",
		"version": 98,
		"since": 74,
		"type": "AGGREGATED_TYPE",
		"id": 1446,
		"rootId": "CHR1dGFub3RhAAWm",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1447": {
				"final": true,
				"name": "_id",
				"id": 1447,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"1448": {
				"final": true,
				"name": "trigger",
				"id": 1448,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			}
		},
		"associations": {}
	},
	"1450": {
		"name": "MailSetEntry",
		"app": "tutanota",
		"version": 98,
		"since": 74,
		"type": "LIST_ELEMENT_TYPE",
		"id": 1450,
		"rootId": "CHR1dGFub3RhAAWq",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1452": {
				"final": true,
				"name": "_id",
				"id": 1452,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"1453": {
				"final": true,
				"name": "_permissions",
				"id": 1453,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"1454": {
				"final": false,
				"name": "_format",
				"id": 1454,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1455": {
				"final": true,
				"name": "_ownerGroup",
				"id": 1455,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"1456": {
				"final": true,
				"name": "mail",
				"id": 1456,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 97,
				"dependency": null
			}
		}
	},
	"1460": {
		"name": "MailBag",
		"app": "tutanota",
		"version": 98,
		"since": 74,
		"type": "AGGREGATED_TYPE",
		"id": 1460,
		"rootId": "CHR1dGFub3RhAAW0",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1461": {
				"final": true,
				"name": "_id",
				"id": 1461,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1462": {
				"final": true,
				"name": "mails",
				"id": 1462,
				"type": "LIST_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 97,
				"dependency": null
			}
		}
	},
	"1469": {
		"name": "SimpleMoveMailPostIn",
		"app": "tutanota",
		"version": 98,
		"since": 76,
		"type": "DATA_TRANSFER_TYPE",
		"id": 1469,
		"rootId": "CHR1dGFub3RhAAW9",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1470": {
				"final": false,
				"name": "_format",
				"id": 1470,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1472": {
				"final": false,
				"name": "destinationSetType",
				"id": 1472,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1713": {
				"final": false,
				"name": "moveReason",
				"id": 1713,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"1471": {
				"final": false,
				"name": "mails",
				"id": 1471,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "Any",
				"refTypeId": 97,
				"dependency": null
			}
		}
	},
	"1474": {
		"name": "UnreadMailStatePostIn",
		"app": "tutanota",
		"version": 98,
		"since": 76,
		"type": "DATA_TRANSFER_TYPE",
		"id": 1474,
		"rootId": "CHR1dGFub3RhAAXC",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1475": {
				"final": false,
				"name": "_format",
				"id": 1475,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1477": {
				"final": false,
				"name": "unread",
				"id": 1477,
				"type": "Boolean",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1476": {
				"final": false,
				"name": "mails",
				"id": 1476,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "Any",
				"refTypeId": 97,
				"dependency": null
			}
		}
	},
	"1480": {
		"name": "ManageLabelServiceLabelData",
		"app": "tutanota",
		"version": 98,
		"since": 77,
		"type": "AGGREGATED_TYPE",
		"id": 1480,
		"rootId": "CHR1dGFub3RhAAXI",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1481": {
				"final": true,
				"name": "_id",
				"id": 1481,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"1482": {
				"final": false,
				"name": "name",
				"id": 1482,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"1483": {
				"final": false,
				"name": "color",
				"id": 1483,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			}
		},
		"associations": {}
	},
	"1484": {
		"name": "ManageLabelServicePostIn",
		"app": "tutanota",
		"version": 98,
		"since": 77,
		"type": "DATA_TRANSFER_TYPE",
		"id": 1484,
		"rootId": "CHR1dGFub3RhAAXM",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"1485": {
				"final": false,
				"name": "_format",
				"id": 1485,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1486": {
				"final": false,
				"name": "ownerEncSessionKey",
				"id": 1486,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"1487": {
				"final": false,
				"name": "ownerKeyVersion",
				"id": 1487,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1488": {
				"final": false,
				"name": "ownerGroup",
				"id": 1488,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1489": {
				"final": false,
				"name": "data",
				"id": 1489,
				"type": "AGGREGATION",
				"cardinality": "One",
				"refTypeId": 1480,
				"dependency": null
			}
		}
	},
	"1500": {
		"name": "ManageLabelServiceDeleteIn",
		"app": "tutanota",
		"version": 98,
		"since": 77,
		"type": "DATA_TRANSFER_TYPE",
		"id": 1500,
		"rootId": "CHR1dGFub3RhAAXc",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1501": {
				"final": false,
				"name": "_format",
				"id": 1501,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1502": {
				"final": false,
				"name": "label",
				"id": 1502,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 429,
				"dependency": null
			}
		}
	},
	"1504": {
		"name": "ApplyLabelServicePostIn",
		"app": "tutanota",
		"version": 98,
		"since": 77,
		"type": "DATA_TRANSFER_TYPE",
		"id": 1504,
		"rootId": "CHR1dGFub3RhAAXg",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1505": {
				"final": false,
				"name": "_format",
				"id": 1505,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1506": {
				"final": false,
				"name": "mails",
				"id": 1506,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "Any",
				"refTypeId": 97,
				"dependency": null
			},
			"1507": {
				"final": false,
				"name": "addedLabels",
				"id": 1507,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "Any",
				"refTypeId": 429,
				"dependency": null
			},
			"1508": {
				"final": false,
				"name": "removedLabels",
				"id": 1508,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "Any",
				"refTypeId": 429,
				"dependency": null
			}
		}
	},
	"1513": {
		"name": "ImportMailDataMailReference",
		"app": "tutanota",
		"version": 98,
		"since": 79,
		"type": "AGGREGATED_TYPE",
		"id": 1513,
		"rootId": "CHR1dGFub3RhAAXp",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1514": {
				"final": true,
				"name": "_id",
				"id": 1514,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"1515": {
				"final": false,
				"name": "reference",
				"id": 1515,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"1516": {
		"name": "NewImportAttachment",
		"app": "tutanota",
		"version": 98,
		"since": 79,
		"type": "AGGREGATED_TYPE",
		"id": 1516,
		"rootId": "CHR1dGFub3RhAAXs",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1517": {
				"final": true,
				"name": "_id",
				"id": 1517,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"1518": {
				"final": true,
				"name": "ownerEncFileHashSessionKey",
				"id": 1518,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1519": {
				"final": true,
				"name": "encFileHash",
				"id": 1519,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1520": {
				"final": true,
				"name": "encFileName",
				"id": 1520,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"1521": {
				"final": true,
				"name": "encMimeType",
				"id": 1521,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"1522": {
				"final": true,
				"name": "encCid",
				"id": 1522,
				"type": "Bytes",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"1523": {
				"final": true,
				"name": "referenceTokens",
				"id": 1523,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 1990,
				"dependency": "sys"
			}
		}
	},
	"1524": {
		"name": "ImportAttachment",
		"app": "tutanota",
		"version": 98,
		"since": 79,
		"type": "AGGREGATED_TYPE",
		"id": 1524,
		"rootId": "CHR1dGFub3RhAAX0",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1525": {
				"final": true,
				"name": "_id",
				"id": 1525,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"1526": {
				"final": true,
				"name": "ownerEncFileSessionKey",
				"id": 1526,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"1527": {
				"final": false,
				"name": "ownerFileKeyVersion",
				"id": 1527,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1528": {
				"final": true,
				"name": "newAttachment",
				"id": 1528,
				"type": "AGGREGATION",
				"cardinality": "ZeroOrOne",
				"refTypeId": 1516,
				"dependency": null
			},
			"1529": {
				"final": true,
				"name": "existingAttachmentFile",
				"id": 1529,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "ZeroOrOne",
				"refTypeId": 13,
				"dependency": null
			}
		}
	},
	"1530": {
		"name": "ImportMailData",
		"app": "tutanota",
		"version": 98,
		"since": 79,
		"type": "DATA_TRANSFER_TYPE",
		"id": 1530,
		"rootId": "CHR1dGFub3RhAAX6",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"1531": {
				"final": false,
				"name": "_format",
				"id": 1531,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1532": {
				"final": false,
				"name": "ownerEncSessionKey",
				"id": 1532,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"1533": {
				"final": false,
				"name": "ownerKeyVersion",
				"id": 1533,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1534": {
				"final": true,
				"name": "subject",
				"id": 1534,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"1535": {
				"final": true,
				"name": "compressedBodyText",
				"id": 1535,
				"type": "CompressedString",
				"cardinality": "One",
				"encrypted": true
			},
			"1536": {
				"final": true,
				"name": "date",
				"id": 1536,
				"type": "Date",
				"cardinality": "One",
				"encrypted": false
			},
			"1537": {
				"final": true,
				"name": "state",
				"id": 1537,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1538": {
				"final": true,
				"name": "unread",
				"id": 1538,
				"type": "Boolean",
				"cardinality": "One",
				"encrypted": false
			},
			"1539": {
				"final": true,
				"name": "messageId",
				"id": 1539,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1540": {
				"final": true,
				"name": "inReplyTo",
				"id": 1540,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1541": {
				"final": true,
				"name": "confidential",
				"id": 1541,
				"type": "Boolean",
				"cardinality": "One",
				"encrypted": true
			},
			"1542": {
				"final": true,
				"name": "method",
				"id": 1542,
				"type": "Number",
				"cardinality": "One",
				"encrypted": true
			},
			"1543": {
				"final": false,
				"name": "replyType",
				"id": 1543,
				"type": "Number",
				"cardinality": "One",
				"encrypted": true
			},
			"1544": {
				"final": true,
				"name": "differentEnvelopeSender",
				"id": 1544,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": true
			},
			"1545": {
				"final": true,
				"name": "phishingStatus",
				"id": 1545,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1546": {
				"final": true,
				"name": "compressedHeaders",
				"id": 1546,
				"type": "CompressedString",
				"cardinality": "One",
				"encrypted": true
			}
		},
		"associations": {
			"1547": {
				"final": true,
				"name": "references",
				"id": 1547,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 1513,
				"dependency": null
			},
			"1548": {
				"final": true,
				"name": "sender",
				"id": 1548,
				"type": "AGGREGATION",
				"cardinality": "One",
				"refTypeId": 92,
				"dependency": null
			},
			"1549": {
				"final": false,
				"name": "replyTos",
				"id": 1549,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 612,
				"dependency": null
			},
			"1550": {
				"final": true,
				"name": "recipients",
				"id": 1550,
				"type": "AGGREGATION",
				"cardinality": "One",
				"refTypeId": 1277,
				"dependency": null
			},
			"1551": {
				"final": true,
				"name": "importedAttachments",
				"id": 1551,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 1524,
				"dependency": null
			}
		}
	},
	"1552": {
		"name": "ImportedMail",
		"app": "tutanota",
		"version": 98,
		"since": 79,
		"type": "LIST_ELEMENT_TYPE",
		"id": 1552,
		"rootId": "CHR1dGFub3RhAAYQ",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1554": {
				"final": true,
				"name": "_id",
				"id": 1554,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"1555": {
				"final": true,
				"name": "_permissions",
				"id": 1555,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"1556": {
				"final": false,
				"name": "_format",
				"id": 1556,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1557": {
				"final": true,
				"name": "_ownerGroup",
				"id": 1557,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"1558": {
				"final": false,
				"name": "mailSetEntry",
				"id": 1558,
				"type": "LIST_ELEMENT_ASSOCIATION_CUSTOM",
				"cardinality": "One",
				"refTypeId": 1450,
				"dependency": null
			}
		}
	},
	"1559": {
		"name": "ImportMailState",
		"app": "tutanota",
		"version": 98,
		"since": 79,
		"type": "LIST_ELEMENT_TYPE",
		"id": 1559,
		"rootId": "CHR1dGFub3RhAAYX",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1561": {
				"final": true,
				"name": "_id",
				"id": 1561,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"1562": {
				"final": true,
				"name": "_permissions",
				"id": 1562,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"1563": {
				"final": false,
				"name": "_format",
				"id": 1563,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1564": {
				"final": true,
				"name": "_ownerGroup",
				"id": 1564,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1565": {
				"final": false,
				"name": "status",
				"id": 1565,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1566": {
				"final": false,
				"name": "successfulMails",
				"id": 1566,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1567": {
				"final": false,
				"name": "failedMails",
				"id": 1567,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1600": {
				"final": false,
				"name": "totalMails",
				"id": 1600,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1568": {
				"final": true,
				"name": "importedMails",
				"id": 1568,
				"type": "LIST_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 1552,
				"dependency": null
			},
			"1569": {
				"final": true,
				"name": "targetFolder",
				"id": 1569,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 429,
				"dependency": null
			}
		}
	},
	"1570": {
		"name": "ImportMailPostIn",
		"app": "tutanota",
		"version": 98,
		"since": 79,
		"type": "DATA_TRANSFER_TYPE",
		"id": 1570,
		"rootId": "CHR1dGFub3RhAAYi",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1571": {
				"final": false,
				"name": "_format",
				"id": 1571,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1577": {
				"final": true,
				"name": "mailState",
				"id": 1577,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 1559,
				"dependency": null
			},
			"1578": {
				"final": false,
				"name": "encImports",
				"id": 1578,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 728,
				"dependency": "sys"
			}
		}
	},
	"1579": {
		"name": "ImportMailPostOut",
		"app": "tutanota",
		"version": 98,
		"since": 79,
		"type": "DATA_TRANSFER_TYPE",
		"id": 1579,
		"rootId": "CHR1dGFub3RhAAYr",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1580": {
				"final": false,
				"name": "_format",
				"id": 1580,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"1582": {
		"name": "ImportMailGetIn",
		"app": "tutanota",
		"version": 98,
		"since": 79,
		"type": "DATA_TRANSFER_TYPE",
		"id": 1582,
		"rootId": "CHR1dGFub3RhAAYu",
		"versioned": false,
		"encrypted": true,
		"isPublic": true,
		"values": {
			"1583": {
				"final": false,
				"name": "_format",
				"id": 1583,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1594": {
				"final": false,
				"name": "ownerGroup",
				"id": 1594,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"1595": {
				"final": false,
				"name": "ownerKeyVersion",
				"id": 1595,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1596": {
				"final": false,
				"name": "ownerEncSessionKey",
				"id": 1596,
				"type": "Bytes",
				"cardinality": "One",
				"encrypted": false
			},
			"1597": {
				"final": false,
				"name": "newImportedMailSetName",
				"id": 1597,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"1598": {
				"final": false,
				"name": "totalMails",
				"id": 1598,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1599": {
				"final": true,
				"name": "targetMailFolder",
				"id": 1599,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 429,
				"dependency": null
			}
		}
	},
	"1586": {
		"name": "AdvancedRepeatRule",
		"app": "tutanota",
		"version": 98,
		"since": 80,
		"type": "AGGREGATED_TYPE",
		"id": 1586,
		"rootId": "CHR1dGFub3RhAAYy",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1587": {
				"final": true,
				"name": "_id",
				"id": 1587,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"1588": {
				"final": false,
				"name": "ruleType",
				"id": 1588,
				"type": "Number",
				"cardinality": "One",
				"encrypted": true
			},
			"1589": {
				"final": false,
				"name": "interval",
				"id": 1589,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			}
		},
		"associations": {}
	},
	"1591": {
		"name": "ImportMailGetOut",
		"app": "tutanota",
		"version": 98,
		"since": 80,
		"type": "DATA_TRANSFER_TYPE",
		"id": 1591,
		"rootId": "CHR1dGFub3RhAAY3",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1592": {
				"final": false,
				"name": "_format",
				"id": 1592,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1593": {
				"final": true,
				"name": "mailState",
				"id": 1593,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 1559,
				"dependency": null
			}
		}
	},
	"1605": {
		"name": "MailExportTokenServicePostOut",
		"app": "tutanota",
		"version": 98,
		"since": 81,
		"type": "DATA_TRANSFER_TYPE",
		"id": 1605,
		"rootId": "CHR1dGFub3RhAAZF",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1606": {
				"final": false,
				"name": "_format",
				"id": 1606,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1607": {
				"final": false,
				"name": "mailExportToken",
				"id": 1607,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"1618": {
		"name": "SupportTopic",
		"app": "tutanota",
		"version": 98,
		"since": 82,
		"type": "AGGREGATED_TYPE",
		"id": 1618,
		"rootId": "CHR1dGFub3RhAAZS",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1619": {
				"final": true,
				"name": "_id",
				"id": 1619,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"1620": {
				"final": false,
				"name": "lastUpdated",
				"id": 1620,
				"type": "Date",
				"cardinality": "One",
				"encrypted": false
			},
			"1621": {
				"final": false,
				"name": "issueEN",
				"id": 1621,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"1622": {
				"final": false,
				"name": "issueDE",
				"id": 1622,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"1623": {
				"final": false,
				"name": "solutionHtmlEN",
				"id": 1623,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"1624": {
				"final": false,
				"name": "solutionHtmlDE",
				"id": 1624,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"1625": {
				"final": false,
				"name": "visibility",
				"id": 1625,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1654": {
				"final": false,
				"name": "contactTemplateHtmlEN",
				"id": 1654,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"1655": {
				"final": false,
				"name": "contactTemplateHtmlDE",
				"id": 1655,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"1656": {
				"final": false,
				"name": "helpTextEN",
				"id": 1656,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"1657": {
				"final": false,
				"name": "helpTextDE",
				"id": 1657,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"1658": {
				"final": false,
				"name": "contactSupportTextEN",
				"id": 1658,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"1659": {
				"final": false,
				"name": "contactSupportTextDE",
				"id": 1659,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"1626": {
		"name": "SupportCategory",
		"app": "tutanota",
		"version": 98,
		"since": 82,
		"type": "AGGREGATED_TYPE",
		"id": 1626,
		"rootId": "CHR1dGFub3RhAAZa",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1627": {
				"final": true,
				"name": "_id",
				"id": 1627,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"1628": {
				"final": false,
				"name": "nameEN",
				"id": 1628,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"1629": {
				"final": false,
				"name": "nameDE",
				"id": 1629,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"1630": {
				"final": false,
				"name": "introductionEN",
				"id": 1630,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"1631": {
				"final": false,
				"name": "introductionDE",
				"id": 1631,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"1632": {
				"final": false,
				"name": "icon",
				"id": 1632,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"1660": {
				"final": false,
				"name": "contactTemplateHtmlEN",
				"id": 1660,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"1661": {
				"final": false,
				"name": "contactTemplateHtmlDE",
				"id": 1661,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"1662": {
				"final": false,
				"name": "helpTextEN",
				"id": 1662,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"1663": {
				"final": false,
				"name": "helpTextDE",
				"id": 1663,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1633": {
				"final": false,
				"name": "topics",
				"id": 1633,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 1618,
				"dependency": null
			}
		}
	},
	"1634": {
		"name": "SupportData",
		"app": "tutanota",
		"version": 98,
		"since": 82,
		"type": "ELEMENT_TYPE",
		"id": 1634,
		"rootId": "CHR1dGFub3RhAAZi",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1636": {
				"final": true,
				"name": "_id",
				"id": 1636,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"1637": {
				"final": true,
				"name": "_permissions",
				"id": 1637,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"1638": {
				"final": false,
				"name": "_format",
				"id": 1638,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1639": {
				"final": true,
				"name": "_ownerGroup",
				"id": 1639,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {
			"1640": {
				"final": false,
				"name": "categories",
				"id": 1640,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 1626,
				"dependency": null
			}
		}
	},
	"1641": {
		"name": "ReceiveInfoServicePostOut",
		"app": "tutanota",
		"version": 98,
		"since": 84,
		"type": "DATA_TRANSFER_TYPE",
		"id": 1641,
		"rootId": "CHR1dGFub3RhAAZp",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1642": {
				"final": false,
				"name": "_format",
				"id": 1642,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1643": {
				"final": true,
				"name": "outdatedVersion",
				"id": 1643,
				"type": "Boolean",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"1645": {
		"name": "ResolveConversationsServiceGetIn",
		"app": "tutanota",
		"version": 98,
		"since": 85,
		"type": "DATA_TRANSFER_TYPE",
		"id": 1645,
		"rootId": "CHR1dGFub3RhAAZt",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1646": {
				"final": false,
				"name": "_format",
				"id": 1646,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1647": {
				"final": true,
				"name": "conversationLists",
				"id": 1647,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 1349,
				"dependency": "sys"
			}
		}
	},
	"1648": {
		"name": "ResolveConversationsServiceGetOut",
		"app": "tutanota",
		"version": 98,
		"since": 85,
		"type": "DATA_TRANSFER_TYPE",
		"id": 1648,
		"rootId": "CHR1dGFub3RhAAZw",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1649": {
				"final": false,
				"name": "_format",
				"id": 1649,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1650": {
				"final": true,
				"name": "mailIds",
				"id": 1650,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 2315,
				"dependency": "sys"
			}
		}
	},
	"1664": {
		"name": "UserAccountPostOut",
		"app": "tutanota",
		"version": 98,
		"since": 88,
		"type": "DATA_TRANSFER_TYPE",
		"id": 1664,
		"rootId": "CHR1dGFub3RhAAaA",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1665": {
				"final": false,
				"name": "_format",
				"id": 1665,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1666": {
				"final": false,
				"name": "userId",
				"id": 1666,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"1667": {
				"final": false,
				"name": "userGroup",
				"id": 1667,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"1668": {
		"name": "MailGroupPostOut",
		"app": "tutanota",
		"version": 98,
		"since": 88,
		"type": "DATA_TRANSFER_TYPE",
		"id": 1668,
		"rootId": "CHR1dGFub3RhAAaE",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1669": {
				"final": false,
				"name": "_format",
				"id": 1669,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1670": {
				"final": false,
				"name": "mailGroup",
				"id": 1670,
				"type": "ELEMENT_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 5,
				"dependency": "sys"
			}
		}
	},
	"1671": {
		"name": "ChangePrimaryAddressServicePutIn",
		"app": "tutanota",
		"version": 98,
		"since": 90,
		"type": "DATA_TRANSFER_TYPE",
		"id": 1671,
		"rootId": "CHR1dGFub3RhAAaH",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1672": {
				"final": false,
				"name": "_format",
				"id": 1672,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1674": {
				"final": false,
				"name": "address",
				"id": 1674,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1673": {
				"final": true,
				"name": "user",
				"id": 1673,
				"type": "ELEMENT_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 84,
				"dependency": "sys"
			}
		}
	},
	"1716": {
		"name": "MovedMails",
		"app": "tutanota",
		"version": 98,
		"since": 95,
		"type": "AGGREGATED_TYPE",
		"id": 1716,
		"rootId": "CHR1dGFub3RhAAa0",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1717": {
				"final": true,
				"name": "_id",
				"id": 1717,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1718": {
				"final": false,
				"name": "targetFolder",
				"id": 1718,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 429,
				"dependency": null
			},
			"1719": {
				"final": false,
				"name": "sourceFolder",
				"id": 1719,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "One",
				"refTypeId": 429,
				"dependency": null
			},
			"1720": {
				"final": true,
				"name": "mailIds",
				"id": 1720,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 2315,
				"dependency": "sys"
			}
		}
	},
	"1721": {
		"name": "MoveMailPostOut",
		"app": "tutanota",
		"version": 98,
		"since": 95,
		"type": "DATA_TRANSFER_TYPE",
		"id": 1721,
		"rootId": "CHR1dGFub3RhAAa5",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1722": {
				"final": false,
				"name": "_format",
				"id": 1722,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1723": {
				"final": false,
				"name": "movedMails",
				"id": 1723,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refTypeId": 1716,
				"dependency": null
			}
		}
	},
	"1724": {
		"name": "ClientSpamClassifierResult",
		"app": "tutanota",
		"version": 98,
		"since": 96,
		"type": "AGGREGATED_TYPE",
		"id": 1724,
		"rootId": "CHR1dGFub3RhAAa8",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1725": {
				"final": true,
				"name": "_id",
				"id": 1725,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"1726": {
				"final": false,
				"name": "spamDecision",
				"id": 1726,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1727": {
				"final": false,
				"name": "confidence",
				"id": 1727,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {}
	},
	"1730": {
		"name": "ClientClassifierResultPostIn",
		"app": "tutanota",
		"version": 98,
		"since": 96,
		"type": "DATA_TRANSFER_TYPE",
		"id": 1730,
		"rootId": "CHR1dGFub3RhAAbC",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1731": {
				"final": false,
				"name": "_format",
				"id": 1731,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"1733": {
				"final": false,
				"name": "isPredictionMade",
				"id": 1733,
				"type": "Boolean",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1732": {
				"final": false,
				"name": "mails",
				"id": 1732,
				"type": "LIST_ELEMENT_ASSOCIATION_GENERATED",
				"cardinality": "Any",
				"refTypeId": 97,
				"dependency": null
			}
		}
	},
	"1736": {
		"name": "CalendarEventsRef",
		"app": "tutanota",
		"version": 98,
		"since": 98,
		"type": "AGGREGATED_TYPE",
		"id": 1736,
		"rootId": "CHR1dGFub3RhAAbI",
		"versioned": false,
		"encrypted": false,
		"isPublic": true,
		"values": {
			"1737": {
				"final": true,
				"name": "_id",
				"id": 1737,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {
			"1738": {
				"final": true,
				"name": "list",
				"id": 1738,
				"type": "LIST_ASSOCIATION",
				"cardinality": "One",
				"refTypeId": 933,
				"dependency": null
			}
		}
	}
}