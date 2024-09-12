// This is an automatically generated file, please do not edit by hand!

// You should not use it directly, please use `resolveTypReference()` instead.	
// We do not want tsc to spend time either checking or inferring type of these huge expressions. Even when it does try to infer them they are still wrong.
// The actual type is an object with keys as entities names and values as TypeModel.

/** @type {any} */
export const typeModels = {
    "AttachmentKeyData": {
        "name": "AttachmentKeyData",
        "since": 11,
        "type": "AGGREGATED_TYPE",
        "id": 542,
        "rootId": "CHR1dGFub3RhAAIe",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 543,
                "since": 11,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "bucketEncFileSessionKey": {
                "final": true,
                "name": "bucketEncFileSessionKey",
                "id": 544,
                "since": 11,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "fileSessionKey": {
                "final": true,
                "name": "fileSessionKey",
                "id": 545,
                "since": 11,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {
            "file": {
                "final": true,
                "name": "file",
                "id": 546,
                "since": 11,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "File",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "Birthday": {
        "name": "Birthday",
        "since": 23,
        "type": "AGGREGATED_TYPE",
        "id": 844,
        "rootId": "CHR1dGFub3RhAANM",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 845,
                "since": 23,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "day": {
                "final": false,
                "name": "day",
                "id": 846,
                "since": 23,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "month": {
                "final": false,
                "name": "month",
                "id": 847,
                "since": 23,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "year": {
                "final": false,
                "name": "year",
                "id": 848,
                "since": 23,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "Body": {
        "name": "Body",
        "since": 58,
        "type": "AGGREGATED_TYPE",
        "id": 1273,
        "rootId": "CHR1dGFub3RhAAT5",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1274,
                "since": 58,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "compressedText": {
                "final": true,
                "name": "compressedText",
                "id": 1276,
                "since": 58,
                "type": "CompressedString",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "text": {
                "final": true,
                "name": "text",
                "id": 1275,
                "since": 58,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "CalendarDeleteData": {
        "name": "CalendarDeleteData",
        "since": 34,
        "type": "DATA_TRANSFER_TYPE",
        "id": 982,
        "rootId": "CHR1dGFub3RhAAPW",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 983,
                "since": 34,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "groupRootId": {
                "final": false,
                "name": "groupRootId",
                "id": 984,
                "since": 34,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "CalendarGroupRoot",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "CalendarEvent": {
        "name": "CalendarEvent",
        "since": 33,
        "type": "LIST_ELEMENT_TYPE",
        "id": 933,
        "rootId": "CHR1dGFub3RhAAOl",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 937,
                "since": 33,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 935,
                "since": 33,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 939,
                "since": 33,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 938,
                "since": 33,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 1401,
                "since": 69,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 936,
                "since": 33,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "description": {
                "final": false,
                "name": "description",
                "id": 941,
                "since": 33,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "endTime": {
                "final": false,
                "name": "endTime",
                "id": 943,
                "since": 33,
                "type": "Date",
                "cardinality": "One",
                "encrypted": true
            },
            "hashedUid": {
                "final": false,
                "name": "hashedUid",
                "id": 1088,
                "since": 42,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "invitedConfidentially": {
                "final": false,
                "name": "invitedConfidentially",
                "id": 1090,
                "since": 42,
                "type": "Boolean",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "location": {
                "final": false,
                "name": "location",
                "id": 944,
                "since": 33,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "recurrenceId": {
                "final": false,
                "name": "recurrenceId",
                "id": 1320,
                "since": 62,
                "type": "Date",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "sequence": {
                "final": false,
                "name": "sequence",
                "id": 1089,
                "since": 42,
                "type": "Number",
                "cardinality": "One",
                "encrypted": true
            },
            "startTime": {
                "final": false,
                "name": "startTime",
                "id": 942,
                "since": 33,
                "type": "Date",
                "cardinality": "One",
                "encrypted": true
            },
            "summary": {
                "final": false,
                "name": "summary",
                "id": 940,
                "since": 33,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "uid": {
                "final": false,
                "name": "uid",
                "id": 988,
                "since": 35,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            }
        },
        "associations": {
            "alarmInfos": {
                "final": false,
                "name": "alarmInfos",
                "id": 946,
                "since": 33,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "Any",
                "refType": "UserAlarmInfo",
                "dependency": null
            },
            "attendees": {
                "final": false,
                "name": "attendees",
                "id": 1091,
                "since": 42,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "CalendarEventAttendee",
                "dependency": null
            },
            "organizer": {
                "final": false,
                "name": "organizer",
                "id": 1092,
                "since": 42,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "EncryptedMailAddress",
                "dependency": null
            },
            "repeatRule": {
                "final": false,
                "name": "repeatRule",
                "id": 945,
                "since": 33,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "CalendarRepeatRule",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "CalendarEventAttendee": {
        "name": "CalendarEventAttendee",
        "since": 42,
        "type": "AGGREGATED_TYPE",
        "id": 1084,
        "rootId": "CHR1dGFub3RhAAQ8",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1085,
                "since": 42,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "status": {
                "final": false,
                "name": "status",
                "id": 1086,
                "since": 42,
                "type": "Number",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {
            "address": {
                "final": true,
                "name": "address",
                "id": 1087,
                "since": 42,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "EncryptedMailAddress",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "CalendarEventIndexRef": {
        "name": "CalendarEventIndexRef",
        "since": 42,
        "type": "AGGREGATED_TYPE",
        "id": 1100,
        "rootId": "CHR1dGFub3RhAARM",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1101,
                "since": 42,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "list": {
                "final": true,
                "name": "list",
                "id": 1102,
                "since": 42,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "CalendarEventUidIndex",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "CalendarEventUidIndex": {
        "name": "CalendarEventUidIndex",
        "since": 42,
        "type": "LIST_ELEMENT_TYPE",
        "id": 1093,
        "rootId": "CHR1dGFub3RhAARF",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1097,
                "since": 42,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1095,
                "since": 42,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1098,
                "since": 42,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 1096,
                "since": 42,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "alteredInstances": {
                "final": false,
                "name": "alteredInstances",
                "id": 1321,
                "since": 62,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "Any",
                "refType": "CalendarEvent",
                "dependency": null
            },
            "progenitor": {
                "final": true,
                "name": "progenitor",
                "id": 1099,
                "since": 42,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "CalendarEvent",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "CalendarEventUpdate": {
        "name": "CalendarEventUpdate",
        "since": 42,
        "type": "LIST_ELEMENT_TYPE",
        "id": 1104,
        "rootId": "CHR1dGFub3RhAARQ",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1108,
                "since": 42,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1106,
                "since": 42,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 1110,
                "since": 42,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1109,
                "since": 42,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 1405,
                "since": 69,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 1107,
                "since": 42,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "sender": {
                "final": true,
                "name": "sender",
                "id": 1111,
                "since": 42,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {
            "file": {
                "final": true,
                "name": "file",
                "id": 1112,
                "since": 42,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "File",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "CalendarEventUpdateList": {
        "name": "CalendarEventUpdateList",
        "since": 42,
        "type": "AGGREGATED_TYPE",
        "id": 1113,
        "rootId": "CHR1dGFub3RhAARZ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1114,
                "since": 42,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "list": {
                "final": true,
                "name": "list",
                "id": 1115,
                "since": 42,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "CalendarEventUpdate",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "CalendarGroupRoot": {
        "name": "CalendarGroupRoot",
        "since": 33,
        "type": "ELEMENT_TYPE",
        "id": 947,
        "rootId": "CHR1dGFub3RhAAOz",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 951,
                "since": 33,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 949,
                "since": 33,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 953,
                "since": 33,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 952,
                "since": 33,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 1402,
                "since": 69,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 950,
                "since": 33,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "index": {
                "final": true,
                "name": "index",
                "id": 1103,
                "since": 42,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "CalendarEventIndexRef",
                "dependency": null
            },
            "longEvents": {
                "final": true,
                "name": "longEvents",
                "id": 955,
                "since": 33,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "CalendarEvent",
                "dependency": null
            },
            "shortEvents": {
                "final": true,
                "name": "shortEvents",
                "id": 954,
                "since": 33,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "CalendarEvent",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "CalendarRepeatRule": {
        "name": "CalendarRepeatRule",
        "since": 33,
        "type": "AGGREGATED_TYPE",
        "id": 926,
        "rootId": "CHR1dGFub3RhAAOe",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 927,
                "since": 33,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "endType": {
                "final": false,
                "name": "endType",
                "id": 929,
                "since": 33,
                "type": "Number",
                "cardinality": "One",
                "encrypted": true
            },
            "endValue": {
                "final": false,
                "name": "endValue",
                "id": 930,
                "since": 33,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "frequency": {
                "final": false,
                "name": "frequency",
                "id": 928,
                "since": 33,
                "type": "Number",
                "cardinality": "One",
                "encrypted": true
            },
            "interval": {
                "final": false,
                "name": "interval",
                "id": 931,
                "since": 33,
                "type": "Number",
                "cardinality": "One",
                "encrypted": true
            },
            "timeZone": {
                "final": false,
                "name": "timeZone",
                "id": 932,
                "since": 33,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {
            "excludedDates": {
                "final": true,
                "name": "excludedDates",
                "id": 1319,
                "since": 61,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "DateWrapper",
                "dependency": "sys"
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "Contact": {
        "name": "Contact",
        "since": 1,
        "type": "LIST_ELEMENT_TYPE",
        "id": 64,
        "rootId": "CHR1dGFub3RhAEA",
        "versioned": true,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 68,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 66,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 69,
                "since": 1,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 585,
                "since": 13,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 1394,
                "since": 69,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 67,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "birthdayIso": {
                "final": false,
                "name": "birthdayIso",
                "id": 1083,
                "since": 41,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "comment": {
                "final": false,
                "name": "comment",
                "id": 77,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "company": {
                "final": false,
                "name": "company",
                "id": 74,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "department": {
                "final": false,
                "name": "department",
                "id": 1385,
                "since": 67,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "firstName": {
                "final": false,
                "name": "firstName",
                "id": 72,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "lastName": {
                "final": false,
                "name": "lastName",
                "id": 73,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "middleName": {
                "final": false,
                "name": "middleName",
                "id": 1380,
                "since": 67,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "nameSuffix": {
                "final": false,
                "name": "nameSuffix",
                "id": 1381,
                "since": 67,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "nickname": {
                "final": false,
                "name": "nickname",
                "id": 849,
                "since": 23,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "oldBirthdayDate": {
                "final": false,
                "name": "oldBirthdayDate",
                "id": 76,
                "since": 1,
                "type": "Date",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "phoneticFirst": {
                "final": false,
                "name": "phoneticFirst",
                "id": 1382,
                "since": 67,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "phoneticLast": {
                "final": false,
                "name": "phoneticLast",
                "id": 1384,
                "since": 67,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "phoneticMiddle": {
                "final": false,
                "name": "phoneticMiddle",
                "id": 1383,
                "since": 67,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "presharedPassword": {
                "final": false,
                "name": "presharedPassword",
                "id": 79,
                "since": 1,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "role": {
                "final": false,
                "name": "role",
                "id": 75,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "title": {
                "final": false,
                "name": "title",
                "id": 850,
                "since": 23,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            }
        },
        "associations": {
            "addresses": {
                "final": false,
                "name": "addresses",
                "id": 82,
                "since": 1,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "ContactAddress",
                "dependency": null
            },
            "customDate": {
                "final": false,
                "name": "customDate",
                "id": 1386,
                "since": 67,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "ContactCustomDate",
                "dependency": null
            },
            "mailAddresses": {
                "final": false,
                "name": "mailAddresses",
                "id": 80,
                "since": 1,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "ContactMailAddress",
                "dependency": null
            },
            "messengerHandles": {
                "final": false,
                "name": "messengerHandles",
                "id": 1389,
                "since": 67,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "ContactMessengerHandle",
                "dependency": null
            },
            "oldBirthdayAggregate": {
                "final": false,
                "name": "oldBirthdayAggregate",
                "id": 851,
                "since": 23,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "Birthday",
                "dependency": null
            },
            "phoneNumbers": {
                "final": false,
                "name": "phoneNumbers",
                "id": 81,
                "since": 1,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "ContactPhoneNumber",
                "dependency": null
            },
            "photo": {
                "final": false,
                "name": "photo",
                "id": 852,
                "since": 23,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "File",
                "dependency": null
            },
            "pronouns": {
                "final": false,
                "name": "pronouns",
                "id": 1390,
                "since": 67,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "ContactPronouns",
                "dependency": null
            },
            "relationships": {
                "final": false,
                "name": "relationships",
                "id": 1388,
                "since": 67,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "ContactRelationship",
                "dependency": null
            },
            "socialIds": {
                "final": false,
                "name": "socialIds",
                "id": 83,
                "since": 1,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "ContactSocialId",
                "dependency": null
            },
            "websites": {
                "final": false,
                "name": "websites",
                "id": 1387,
                "since": 67,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "ContactWebsite",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "ContactAddress": {
        "name": "ContactAddress",
        "since": 1,
        "type": "AGGREGATED_TYPE",
        "id": 54,
        "rootId": "CHR1dGFub3RhADY",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 55,
                "since": 1,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "address": {
                "final": false,
                "name": "address",
                "id": 57,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "customTypeName": {
                "final": false,
                "name": "customTypeName",
                "id": 58,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "type": {
                "final": false,
                "name": "type",
                "id": 56,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "ContactCustomDate": {
        "name": "ContactCustomDate",
        "since": 67,
        "type": "AGGREGATED_TYPE",
        "id": 1356,
        "rootId": "CHR1dGFub3RhAAVM",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1357,
                "since": 67,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "customTypeName": {
                "final": false,
                "name": "customTypeName",
                "id": 1359,
                "since": 67,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "dateIso": {
                "final": false,
                "name": "dateIso",
                "id": 1360,
                "since": 67,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "type": {
                "final": false,
                "name": "type",
                "id": 1358,
                "since": 67,
                "type": "Number",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "ContactList": {
        "name": "ContactList",
        "since": 1,
        "type": "ELEMENT_TYPE",
        "id": 153,
        "rootId": "CHR1dGFub3RhAACZ",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 157,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 155,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 593,
                "since": 13,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 592,
                "since": 13,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 1397,
                "since": 69,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 156,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "contacts": {
                "final": true,
                "name": "contacts",
                "id": 160,
                "since": 1,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "Contact",
                "dependency": null
            },
            "photos": {
                "final": false,
                "name": "photos",
                "id": 856,
                "since": 23,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "PhotosRef",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "ContactListEntry": {
        "name": "ContactListEntry",
        "since": 64,
        "type": "LIST_ELEMENT_TYPE",
        "id": 1325,
        "rootId": "CHR1dGFub3RhAAUt",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1329,
                "since": 64,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1327,
                "since": 64,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 1331,
                "since": 64,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1330,
                "since": 64,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 1409,
                "since": 69,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 1328,
                "since": 64,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "emailAddress": {
                "final": false,
                "name": "emailAddress",
                "id": 1332,
                "since": 64,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "ContactListGroupRoot": {
        "name": "ContactListGroupRoot",
        "since": 64,
        "type": "ELEMENT_TYPE",
        "id": 1333,
        "rootId": "CHR1dGFub3RhAAU1",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1337,
                "since": 64,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1335,
                "since": 64,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 1339,
                "since": 64,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1338,
                "since": 64,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 1410,
                "since": 69,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 1336,
                "since": 64,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "entries": {
                "final": true,
                "name": "entries",
                "id": 1340,
                "since": 64,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "ContactListEntry",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "ContactMailAddress": {
        "name": "ContactMailAddress",
        "since": 1,
        "type": "AGGREGATED_TYPE",
        "id": 44,
        "rootId": "CHR1dGFub3RhACw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 45,
                "since": 1,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "address": {
                "final": false,
                "name": "address",
                "id": 47,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "customTypeName": {
                "final": false,
                "name": "customTypeName",
                "id": 48,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "type": {
                "final": false,
                "name": "type",
                "id": 46,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "ContactMessengerHandle": {
        "name": "ContactMessengerHandle",
        "since": 67,
        "type": "AGGREGATED_TYPE",
        "id": 1371,
        "rootId": "CHR1dGFub3RhAAVb",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1372,
                "since": 67,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "customTypeName": {
                "final": false,
                "name": "customTypeName",
                "id": 1374,
                "since": 67,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "handle": {
                "final": false,
                "name": "handle",
                "id": 1375,
                "since": 67,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "type": {
                "final": false,
                "name": "type",
                "id": 1373,
                "since": 67,
                "type": "Number",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "ContactPhoneNumber": {
        "name": "ContactPhoneNumber",
        "since": 1,
        "type": "AGGREGATED_TYPE",
        "id": 49,
        "rootId": "CHR1dGFub3RhADE",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 50,
                "since": 1,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "customTypeName": {
                "final": false,
                "name": "customTypeName",
                "id": 53,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "number": {
                "final": false,
                "name": "number",
                "id": 52,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "type": {
                "final": false,
                "name": "type",
                "id": 51,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "ContactPronouns": {
        "name": "ContactPronouns",
        "since": 67,
        "type": "AGGREGATED_TYPE",
        "id": 1376,
        "rootId": "CHR1dGFub3RhAAVg",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1377,
                "since": 67,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "language": {
                "final": false,
                "name": "language",
                "id": 1378,
                "since": 67,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "pronouns": {
                "final": false,
                "name": "pronouns",
                "id": 1379,
                "since": 67,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "ContactRelationship": {
        "name": "ContactRelationship",
        "since": 67,
        "type": "AGGREGATED_TYPE",
        "id": 1366,
        "rootId": "CHR1dGFub3RhAAVW",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1367,
                "since": 67,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "customTypeName": {
                "final": false,
                "name": "customTypeName",
                "id": 1369,
                "since": 67,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "person": {
                "final": false,
                "name": "person",
                "id": 1370,
                "since": 67,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "type": {
                "final": false,
                "name": "type",
                "id": 1368,
                "since": 67,
                "type": "Number",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "ContactSocialId": {
        "name": "ContactSocialId",
        "since": 1,
        "type": "AGGREGATED_TYPE",
        "id": 59,
        "rootId": "CHR1dGFub3RhADs",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 60,
                "since": 1,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "customTypeName": {
                "final": false,
                "name": "customTypeName",
                "id": 63,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "socialId": {
                "final": false,
                "name": "socialId",
                "id": 62,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "type": {
                "final": false,
                "name": "type",
                "id": 61,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "ContactWebsite": {
        "name": "ContactWebsite",
        "since": 67,
        "type": "AGGREGATED_TYPE",
        "id": 1361,
        "rootId": "CHR1dGFub3RhAAVR",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1362,
                "since": 67,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "customTypeName": {
                "final": false,
                "name": "customTypeName",
                "id": 1364,
                "since": 67,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "type": {
                "final": false,
                "name": "type",
                "id": 1363,
                "since": 67,
                "type": "Number",
                "cardinality": "One",
                "encrypted": true
            },
            "url": {
                "final": false,
                "name": "url",
                "id": 1365,
                "since": 67,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "ConversationEntry": {
        "name": "ConversationEntry",
        "since": 1,
        "type": "LIST_ELEMENT_TYPE",
        "id": 84,
        "rootId": "CHR1dGFub3RhAFQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 120,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 118,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 588,
                "since": 13,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 119,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "conversationType": {
                "final": true,
                "name": "conversationType",
                "id": 122,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "messageId": {
                "final": true,
                "name": "messageId",
                "id": 121,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "mail": {
                "final": true,
                "name": "mail",
                "id": 124,
                "since": 1,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "Mail",
                "dependency": null
            },
            "previous": {
                "final": true,
                "name": "previous",
                "id": 123,
                "since": 1,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "ConversationEntry",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "CreateExternalUserGroupData": {
        "name": "CreateExternalUserGroupData",
        "since": 1,
        "type": "AGGREGATED_TYPE",
        "id": 138,
        "rootId": "CHR1dGFub3RhAACK",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 139,
                "since": 1,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "externalPwEncUserGroupKey": {
                "final": false,
                "name": "externalPwEncUserGroupKey",
                "id": 142,
                "since": 1,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "internalUserEncUserGroupKey": {
                "final": false,
                "name": "internalUserEncUserGroupKey",
                "id": 143,
                "since": 1,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "internalUserGroupKeyVersion": {
                "final": false,
                "name": "internalUserGroupKeyVersion",
                "id": 1433,
                "since": 69,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "mailAddress": {
                "final": false,
                "name": "mailAddress",
                "id": 141,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "CreateGroupPostReturn": {
        "name": "CreateGroupPostReturn",
        "since": 34,
        "type": "DATA_TRANSFER_TYPE",
        "id": 985,
        "rootId": "CHR1dGFub3RhAAPZ",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 986,
                "since": 34,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "group": {
                "final": true,
                "name": "group",
                "id": 987,
                "since": 34,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Group",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "CreateMailFolderData": {
        "name": "CreateMailFolderData",
        "since": 7,
        "type": "DATA_TRANSFER_TYPE",
        "id": 450,
        "rootId": "CHR1dGFub3RhAAHC",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 451,
                "since": 7,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "folderName": {
                "final": true,
                "name": "folderName",
                "id": 453,
                "since": 7,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "ownerEncSessionKey": {
                "final": true,
                "name": "ownerEncSessionKey",
                "id": 454,
                "since": 7,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "ownerGroup": {
                "final": true,
                "name": "ownerGroup",
                "id": 1268,
                "since": 57,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "ownerKeyVersion": {
                "final": true,
                "name": "ownerKeyVersion",
                "id": 1414,
                "since": 69,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "parentFolder": {
                "final": true,
                "name": "parentFolder",
                "id": 452,
                "since": 7,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "MailFolder",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "CreateMailFolderReturn": {
        "name": "CreateMailFolderReturn",
        "since": 7,
        "type": "DATA_TRANSFER_TYPE",
        "id": 455,
        "rootId": "CHR1dGFub3RhAAHH",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 456,
                "since": 7,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "newFolder": {
                "final": false,
                "name": "newFolder",
                "id": 457,
                "since": 7,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "MailFolder",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "CreateMailGroupData": {
        "name": "CreateMailGroupData",
        "since": 19,
        "type": "DATA_TRANSFER_TYPE",
        "id": 707,
        "rootId": "CHR1dGFub3RhAALD",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 708,
                "since": 19,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "encryptedName": {
                "final": false,
                "name": "encryptedName",
                "id": 710,
                "since": 19,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "mailAddress": {
                "final": false,
                "name": "mailAddress",
                "id": 709,
                "since": 19,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "mailEncMailboxSessionKey": {
                "final": false,
                "name": "mailEncMailboxSessionKey",
                "id": 711,
                "since": 19,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "groupData": {
                "final": false,
                "name": "groupData",
                "id": 712,
                "since": 19,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "InternalGroupData",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "CustomerAccountCreateData": {
        "name": "CustomerAccountCreateData",
        "since": 16,
        "type": "DATA_TRANSFER_TYPE",
        "id": 648,
        "rootId": "CHR1dGFub3RhAAKI",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 649,
                "since": 16,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "accountGroupKeyVersion": {
                "final": false,
                "name": "accountGroupKeyVersion",
                "id": 1421,
                "since": 69,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "adminEncAccountingInfoSessionKey": {
                "final": false,
                "name": "adminEncAccountingInfoSessionKey",
                "id": 659,
                "since": 16,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "adminEncCustomerServerPropertiesSessionKey": {
                "final": false,
                "name": "adminEncCustomerServerPropertiesSessionKey",
                "id": 661,
                "since": 16,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "authToken": {
                "final": false,
                "name": "authToken",
                "id": 650,
                "since": 16,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "code": {
                "final": false,
                "name": "code",
                "id": 873,
                "since": 24,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "date": {
                "final": false,
                "name": "date",
                "id": 651,
                "since": 16,
                "type": "Date",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "lang": {
                "final": false,
                "name": "lang",
                "id": 652,
                "since": 16,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "systemAdminPubEncAccountingInfoSessionKey": {
                "final": false,
                "name": "systemAdminPubEncAccountingInfoSessionKey",
                "id": 660,
                "since": 16,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "systemAdminPubKeyVersion": {
                "final": false,
                "name": "systemAdminPubKeyVersion",
                "id": 1422,
                "since": 69,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "systemAdminPublicProtocolVersion": {
                "final": true,
                "name": "systemAdminPublicProtocolVersion",
                "id": 1355,
                "since": 66,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "userEncAccountGroupKey": {
                "final": false,
                "name": "userEncAccountGroupKey",
                "id": 655,
                "since": 16,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "userEncAdminGroupKey": {
                "final": false,
                "name": "userEncAdminGroupKey",
                "id": 654,
                "since": 16,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "adminGroupData": {
                "final": false,
                "name": "adminGroupData",
                "id": 657,
                "since": 16,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "InternalGroupData",
                "dependency": null
            },
            "customerGroupData": {
                "final": false,
                "name": "customerGroupData",
                "id": 658,
                "since": 16,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "InternalGroupData",
                "dependency": null
            },
            "userData": {
                "final": false,
                "name": "userData",
                "id": 653,
                "since": 16,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "UserAccountUserData",
                "dependency": null
            },
            "userGroupData": {
                "final": false,
                "name": "userGroupData",
                "id": 656,
                "since": 16,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "InternalGroupData",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "DefaultAlarmInfo": {
        "name": "DefaultAlarmInfo",
        "since": 74,
        "type": "AGGREGATED_TYPE",
        "id": 1446,
        "rootId": "CHR1dGFub3RhAAWm",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1447,
                "since": 74,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "trigger": {
                "final": true,
                "name": "trigger",
                "id": 1448,
                "since": 74,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "DeleteGroupData": {
        "name": "DeleteGroupData",
        "since": 19,
        "type": "DATA_TRANSFER_TYPE",
        "id": 713,
        "rootId": "CHR1dGFub3RhAALJ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 714,
                "since": 19,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "restore": {
                "final": false,
                "name": "restore",
                "id": 715,
                "since": 19,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "group": {
                "final": true,
                "name": "group",
                "id": 716,
                "since": 19,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Group",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "DeleteMailData": {
        "name": "DeleteMailData",
        "since": 5,
        "type": "DATA_TRANSFER_TYPE",
        "id": 419,
        "rootId": "CHR1dGFub3RhAAGj",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 420,
                "since": 5,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "folder": {
                "final": true,
                "name": "folder",
                "id": 724,
                "since": 19,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "MailFolder",
                "dependency": null
            },
            "mails": {
                "final": false,
                "name": "mails",
                "id": 421,
                "since": 5,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "Any",
                "refType": "Mail",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "DeleteMailFolderData": {
        "name": "DeleteMailFolderData",
        "since": 7,
        "type": "DATA_TRANSFER_TYPE",
        "id": 458,
        "rootId": "CHR1dGFub3RhAAHK",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 459,
                "since": 7,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "folders": {
                "final": false,
                "name": "folders",
                "id": 460,
                "since": 7,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "Any",
                "refType": "MailFolder",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "DraftAttachment": {
        "name": "DraftAttachment",
        "since": 11,
        "type": "AGGREGATED_TYPE",
        "id": 491,
        "rootId": "CHR1dGFub3RhAAHr",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 492,
                "since": 11,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "ownerEncFileSessionKey": {
                "final": true,
                "name": "ownerEncFileSessionKey",
                "id": 493,
                "since": 11,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "ownerKeyVersion": {
                "final": true,
                "name": "ownerKeyVersion",
                "id": 1430,
                "since": 69,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "existingFile": {
                "final": true,
                "name": "existingFile",
                "id": 495,
                "since": 11,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "File",
                "dependency": null
            },
            "newFile": {
                "final": true,
                "name": "newFile",
                "id": 494,
                "since": 11,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "NewDraftAttachment",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "DraftCreateData": {
        "name": "DraftCreateData",
        "since": 11,
        "type": "DATA_TRANSFER_TYPE",
        "id": 508,
        "rootId": "CHR1dGFub3RhAAH8",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 509,
                "since": 11,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "conversationType": {
                "final": true,
                "name": "conversationType",
                "id": 511,
                "since": 11,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "ownerEncSessionKey": {
                "final": true,
                "name": "ownerEncSessionKey",
                "id": 512,
                "since": 11,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "ownerKeyVersion": {
                "final": false,
                "name": "ownerKeyVersion",
                "id": 1427,
                "since": 69,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "previousMessageId": {
                "final": true,
                "name": "previousMessageId",
                "id": 510,
                "since": 11,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {
            "draftData": {
                "final": false,
                "name": "draftData",
                "id": 515,
                "since": 11,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "DraftData",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "DraftCreateReturn": {
        "name": "DraftCreateReturn",
        "since": 11,
        "type": "DATA_TRANSFER_TYPE",
        "id": 516,
        "rootId": "CHR1dGFub3RhAAIE",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 517,
                "since": 11,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "draft": {
                "final": false,
                "name": "draft",
                "id": 518,
                "since": 11,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Mail",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "DraftData": {
        "name": "DraftData",
        "since": 11,
        "type": "AGGREGATED_TYPE",
        "id": 496,
        "rootId": "CHR1dGFub3RhAAHw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 497,
                "since": 11,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "bodyText": {
                "final": true,
                "name": "bodyText",
                "id": 499,
                "since": 11,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "compressedBodyText": {
                "final": true,
                "name": "compressedBodyText",
                "id": 1194,
                "since": 46,
                "type": "CompressedString",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "confidential": {
                "final": true,
                "name": "confidential",
                "id": 502,
                "since": 11,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": true
            },
            "method": {
                "final": true,
                "name": "method",
                "id": 1116,
                "since": 42,
                "type": "Number",
                "cardinality": "One",
                "encrypted": true
            },
            "senderMailAddress": {
                "final": true,
                "name": "senderMailAddress",
                "id": 500,
                "since": 11,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "senderName": {
                "final": true,
                "name": "senderName",
                "id": 501,
                "since": 11,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "subject": {
                "final": true,
                "name": "subject",
                "id": 498,
                "since": 11,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {
            "addedAttachments": {
                "final": true,
                "name": "addedAttachments",
                "id": 506,
                "since": 11,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "DraftAttachment",
                "dependency": null
            },
            "bccRecipients": {
                "final": true,
                "name": "bccRecipients",
                "id": 505,
                "since": 11,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "DraftRecipient",
                "dependency": null
            },
            "ccRecipients": {
                "final": true,
                "name": "ccRecipients",
                "id": 504,
                "since": 11,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "DraftRecipient",
                "dependency": null
            },
            "removedAttachments": {
                "final": true,
                "name": "removedAttachments",
                "id": 507,
                "since": 11,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "Any",
                "refType": "File",
                "dependency": null
            },
            "replyTos": {
                "final": false,
                "name": "replyTos",
                "id": 819,
                "since": 21,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "EncryptedMailAddress",
                "dependency": null
            },
            "toRecipients": {
                "final": true,
                "name": "toRecipients",
                "id": 503,
                "since": 11,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "DraftRecipient",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "DraftRecipient": {
        "name": "DraftRecipient",
        "since": 11,
        "type": "AGGREGATED_TYPE",
        "id": 482,
        "rootId": "CHR1dGFub3RhAAHi",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 483,
                "since": 11,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "mailAddress": {
                "final": true,
                "name": "mailAddress",
                "id": 485,
                "since": 11,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "name": {
                "final": true,
                "name": "name",
                "id": 484,
                "since": 11,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "DraftUpdateData": {
        "name": "DraftUpdateData",
        "since": 11,
        "type": "DATA_TRANSFER_TYPE",
        "id": 519,
        "rootId": "CHR1dGFub3RhAAIH",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 520,
                "since": 11,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "draft": {
                "final": false,
                "name": "draft",
                "id": 522,
                "since": 11,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Mail",
                "dependency": null
            },
            "draftData": {
                "final": false,
                "name": "draftData",
                "id": 521,
                "since": 11,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "DraftData",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "DraftUpdateReturn": {
        "name": "DraftUpdateReturn",
        "since": 11,
        "type": "DATA_TRANSFER_TYPE",
        "id": 523,
        "rootId": "CHR1dGFub3RhAAIL",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 524,
                "since": 11,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "attachments": {
                "final": true,
                "name": "attachments",
                "id": 525,
                "since": 11,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "Any",
                "refType": "File",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "EmailTemplate": {
        "name": "EmailTemplate",
        "since": 45,
        "type": "LIST_ELEMENT_TYPE",
        "id": 1158,
        "rootId": "CHR1dGFub3RhAASG",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1162,
                "since": 45,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1160,
                "since": 45,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 1164,
                "since": 45,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1163,
                "since": 45,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 1406,
                "since": 69,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 1161,
                "since": 45,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "tag": {
                "final": false,
                "name": "tag",
                "id": 1166,
                "since": 45,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "title": {
                "final": false,
                "name": "title",
                "id": 1165,
                "since": 45,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {
            "contents": {
                "final": false,
                "name": "contents",
                "id": 1167,
                "since": 45,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "EmailTemplateContent",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "EmailTemplateContent": {
        "name": "EmailTemplateContent",
        "since": 45,
        "type": "AGGREGATED_TYPE",
        "id": 1154,
        "rootId": "CHR1dGFub3RhAASC",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1155,
                "since": 45,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "languageCode": {
                "final": false,
                "name": "languageCode",
                "id": 1157,
                "since": 45,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "text": {
                "final": false,
                "name": "text",
                "id": 1156,
                "since": 45,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "EncryptTutanotaPropertiesData": {
        "name": "EncryptTutanotaPropertiesData",
        "since": 9,
        "type": "DATA_TRANSFER_TYPE",
        "id": 473,
        "rootId": "CHR1dGFub3RhAAHZ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 474,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "symEncSessionKey": {
                "final": false,
                "name": "symEncSessionKey",
                "id": 476,
                "since": 9,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "symKeyVersion": {
                "final": false,
                "name": "symKeyVersion",
                "id": 1428,
                "since": 69,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "properties": {
                "final": false,
                "name": "properties",
                "id": 475,
                "since": 9,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "TutanotaProperties",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "EncryptedMailAddress": {
        "name": "EncryptedMailAddress",
        "since": 14,
        "type": "AGGREGATED_TYPE",
        "id": 612,
        "rootId": "CHR1dGFub3RhAAJk",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 613,
                "since": 14,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "address": {
                "final": true,
                "name": "address",
                "id": 615,
                "since": 14,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "name": {
                "final": true,
                "name": "name",
                "id": 614,
                "since": 14,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "EntropyData": {
        "name": "EntropyData",
        "since": 43,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1122,
        "rootId": "CHR1dGFub3RhAARi",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1123,
                "since": 43,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "userEncEntropy": {
                "final": false,
                "name": "userEncEntropy",
                "id": 1124,
                "since": 43,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "userKeyVersion": {
                "final": false,
                "name": "userKeyVersion",
                "id": 1432,
                "since": 69,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "ExternalUserData": {
        "name": "ExternalUserData",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 145,
        "rootId": "CHR1dGFub3RhAACR",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 146,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "externalMailEncMailBoxSessionKey": {
                "final": false,
                "name": "externalMailEncMailBoxSessionKey",
                "id": 673,
                "since": 16,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "externalMailEncMailGroupInfoSessionKey": {
                "final": false,
                "name": "externalMailEncMailGroupInfoSessionKey",
                "id": 670,
                "since": 16,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "externalUserEncEntropy": {
                "final": false,
                "name": "externalUserEncEntropy",
                "id": 412,
                "since": 2,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "externalUserEncMailGroupKey": {
                "final": false,
                "name": "externalUserEncMailGroupKey",
                "id": 148,
                "since": 1,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "externalUserEncTutanotaPropertiesSessionKey": {
                "final": false,
                "name": "externalUserEncTutanotaPropertiesSessionKey",
                "id": 672,
                "since": 16,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "externalUserEncUserGroupInfoSessionKey": {
                "final": false,
                "name": "externalUserEncUserGroupInfoSessionKey",
                "id": 150,
                "since": 1,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "internalMailEncMailGroupInfoSessionKey": {
                "final": false,
                "name": "internalMailEncMailGroupInfoSessionKey",
                "id": 671,
                "since": 16,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "internalMailEncUserGroupInfoSessionKey": {
                "final": false,
                "name": "internalMailEncUserGroupInfoSessionKey",
                "id": 669,
                "since": 16,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "internalMailGroupKeyVersion": {
                "final": false,
                "name": "internalMailGroupKeyVersion",
                "id": 1429,
                "since": 69,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "kdfVersion": {
                "final": false,
                "name": "kdfVersion",
                "id": 1323,
                "since": 63,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "verifier": {
                "final": false,
                "name": "verifier",
                "id": 149,
                "since": 1,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "userGroupData": {
                "final": false,
                "name": "userGroupData",
                "id": 151,
                "since": 1,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "CreateExternalUserGroupData",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "File": {
        "name": "File",
        "since": 1,
        "type": "LIST_ELEMENT_TYPE",
        "id": 13,
        "rootId": "CHR1dGFub3RhAA0",
        "versioned": false,
        "encrypted": true,
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
            "_id": {
                "final": true,
                "name": "_id",
                "id": 15,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 18,
                "since": 1,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 580,
                "since": 13,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 1391,
                "since": 69,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 16,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "cid": {
                "final": true,
                "name": "cid",
                "id": 924,
                "since": 32,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "mimeType": {
                "final": true,
                "name": "mimeType",
                "id": 23,
                "since": 1,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "name": {
                "final": false,
                "name": "name",
                "id": 21,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "size": {
                "final": true,
                "name": "size",
                "id": 22,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "blobs": {
                "final": true,
                "name": "blobs",
                "id": 1225,
                "since": 52,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "Blob",
                "dependency": "sys"
            },
            "parent": {
                "final": true,
                "name": "parent",
                "id": 25,
                "since": 1,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "File",
                "dependency": null
            },
            "subFiles": {
                "final": true,
                "name": "subFiles",
                "id": 26,
                "since": 1,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "Subfiles",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "FileSystem": {
        "name": "FileSystem",
        "since": 1,
        "type": "ELEMENT_TYPE",
        "id": 28,
        "rootId": "CHR1dGFub3RhABw",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 32,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 30,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 582,
                "since": 13,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 581,
                "since": 13,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 1392,
                "since": 69,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 31,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "files": {
                "final": true,
                "name": "files",
                "id": 35,
                "since": 1,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "File",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "GroupInvitationDeleteData": {
        "name": "GroupInvitationDeleteData",
        "since": 38,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1016,
        "rootId": "CHR1dGFub3RhAAP4",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1017,
                "since": 38,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "receivedInvitation": {
                "final": false,
                "name": "receivedInvitation",
                "id": 1018,
                "since": 38,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "ReceivedGroupInvitation",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "GroupInvitationPostData": {
        "name": "GroupInvitationPostData",
        "since": 38,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1002,
        "rootId": "CHR1dGFub3RhAAPq",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1003,
                "since": 38,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "internalKeyData": {
                "final": false,
                "name": "internalKeyData",
                "id": 1005,
                "since": 38,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "InternalRecipientKeyData",
                "dependency": null
            },
            "sharedGroupData": {
                "final": false,
                "name": "sharedGroupData",
                "id": 1004,
                "since": 38,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "SharedGroupData",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "GroupInvitationPostReturn": {
        "name": "GroupInvitationPostReturn",
        "since": 38,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1006,
        "rootId": "CHR1dGFub3RhAAPu",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1007,
                "since": 38,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "existingMailAddresses": {
                "final": false,
                "name": "existingMailAddresses",
                "id": 1008,
                "since": 38,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "MailAddress",
                "dependency": null
            },
            "invalidMailAddresses": {
                "final": false,
                "name": "invalidMailAddresses",
                "id": 1009,
                "since": 38,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "MailAddress",
                "dependency": null
            },
            "invitedMailAddresses": {
                "final": false,
                "name": "invitedMailAddresses",
                "id": 1010,
                "since": 38,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "MailAddress",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "GroupInvitationPutData": {
        "name": "GroupInvitationPutData",
        "since": 38,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1011,
        "rootId": "CHR1dGFub3RhAAPz",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1012,
                "since": 38,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "sharedGroupEncInviteeGroupInfoKey": {
                "final": true,
                "name": "sharedGroupEncInviteeGroupInfoKey",
                "id": 1014,
                "since": 38,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "sharedGroupKeyVersion": {
                "final": true,
                "name": "sharedGroupKeyVersion",
                "id": 1419,
                "since": 69,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "userGroupEncGroupKey": {
                "final": true,
                "name": "userGroupEncGroupKey",
                "id": 1013,
                "since": 38,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "userGroupKeyVersion": {
                "final": false,
                "name": "userGroupKeyVersion",
                "id": 1418,
                "since": 69,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "receivedInvitation": {
                "final": false,
                "name": "receivedInvitation",
                "id": 1015,
                "since": 38,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "ReceivedGroupInvitation",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "GroupSettings": {
        "name": "GroupSettings",
        "since": 34,
        "type": "AGGREGATED_TYPE",
        "id": 968,
        "rootId": "CHR1dGFub3RhAAPI",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 969,
                "since": 34,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "color": {
                "final": false,
                "name": "color",
                "id": 971,
                "since": 34,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "name": {
                "final": false,
                "name": "name",
                "id": 1020,
                "since": 39,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "sourceUrl": {
                "final": false,
                "name": "sourceUrl",
                "id": 1468,
                "since": 75,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            }
        },
        "associations": {
            "defaultAlarmsList": {
                "final": false,
                "name": "defaultAlarmsList",
                "id": 1449,
                "since": 74,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "DefaultAlarmInfo",
                "dependency": null
            },
            "group": {
                "final": true,
                "name": "group",
                "id": 970,
                "since": 34,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Group",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "Header": {
        "name": "Header",
        "since": 58,
        "type": "AGGREGATED_TYPE",
        "id": 1269,
        "rootId": "CHR1dGFub3RhAAT1",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1270,
                "since": 58,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "compressedHeaders": {
                "final": true,
                "name": "compressedHeaders",
                "id": 1272,
                "since": 58,
                "type": "CompressedString",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "headers": {
                "final": true,
                "name": "headers",
                "id": 1271,
                "since": 58,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "ImapFolder": {
        "name": "ImapFolder",
        "since": 1,
        "type": "AGGREGATED_TYPE",
        "id": 190,
        "rootId": "CHR1dGFub3RhAAC-",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 191,
                "since": 1,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "lastseenuid": {
                "final": false,
                "name": "lastseenuid",
                "id": 193,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "name": {
                "final": false,
                "name": "name",
                "id": 192,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "uidvalidity": {
                "final": false,
                "name": "uidvalidity",
                "id": 194,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "syncInfo": {
                "final": true,
                "name": "syncInfo",
                "id": 195,
                "since": 1,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "RemoteImapSyncInfo",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "ImapSyncConfiguration": {
        "name": "ImapSyncConfiguration",
        "since": 1,
        "type": "AGGREGATED_TYPE",
        "id": 209,
        "rootId": "CHR1dGFub3RhAADR",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 210,
                "since": 1,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "host": {
                "final": false,
                "name": "host",
                "id": 211,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "password": {
                "final": false,
                "name": "password",
                "id": 214,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "port": {
                "final": false,
                "name": "port",
                "id": 212,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "user": {
                "final": false,
                "name": "user",
                "id": 213,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "imapSyncState": {
                "final": false,
                "name": "imapSyncState",
                "id": 215,
                "since": 1,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "ImapSyncState",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "ImapSyncState": {
        "name": "ImapSyncState",
        "since": 1,
        "type": "ELEMENT_TYPE",
        "id": 196,
        "rootId": "CHR1dGFub3RhAADE",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 200,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 198,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 595,
                "since": 13,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 199,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "folders": {
                "final": false,
                "name": "folders",
                "id": 201,
                "since": 1,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "ImapFolder",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "InboxRule": {
        "name": "InboxRule",
        "since": 12,
        "type": "AGGREGATED_TYPE",
        "id": 573,
        "rootId": "CHR1dGFub3RhAAI9",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 574,
                "since": 12,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "type": {
                "final": false,
                "name": "type",
                "id": 575,
                "since": 12,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "value": {
                "final": false,
                "name": "value",
                "id": 576,
                "since": 12,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {
            "targetFolder": {
                "final": false,
                "name": "targetFolder",
                "id": 577,
                "since": 12,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "MailFolder",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "InternalGroupData": {
        "name": "InternalGroupData",
        "since": 16,
        "type": "AGGREGATED_TYPE",
        "id": 642,
        "rootId": "CHR1dGFub3RhAAKC",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 643,
                "since": 16,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "adminEncGroupKey": {
                "final": false,
                "name": "adminEncGroupKey",
                "id": 646,
                "since": 16,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "adminKeyVersion": {
                "final": false,
                "name": "adminKeyVersion",
                "id": 1415,
                "since": 69,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "groupEncPrivEccKey": {
                "final": true,
                "name": "groupEncPrivEccKey",
                "id": 1343,
                "since": 66,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "groupEncPrivKyberKey": {
                "final": true,
                "name": "groupEncPrivKyberKey",
                "id": 1345,
                "since": 66,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "groupEncPrivRsaKey": {
                "final": false,
                "name": "groupEncPrivRsaKey",
                "id": 645,
                "since": 16,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "ownerEncGroupInfoSessionKey": {
                "final": false,
                "name": "ownerEncGroupInfoSessionKey",
                "id": 647,
                "since": 16,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "ownerKeyVersion": {
                "final": false,
                "name": "ownerKeyVersion",
                "id": 1416,
                "since": 69,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "pubEccKey": {
                "final": true,
                "name": "pubEccKey",
                "id": 1342,
                "since": 66,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "pubKyberKey": {
                "final": true,
                "name": "pubKyberKey",
                "id": 1344,
                "since": 66,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "pubRsaKey": {
                "final": false,
                "name": "pubRsaKey",
                "id": 644,
                "since": 16,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {
            "adminGroup": {
                "final": true,
                "name": "adminGroup",
                "id": 874,
                "since": 25,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "Group",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "InternalRecipientKeyData": {
        "name": "InternalRecipientKeyData",
        "since": 11,
        "type": "AGGREGATED_TYPE",
        "id": 527,
        "rootId": "CHR1dGFub3RhAAIP",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 528,
                "since": 11,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "mailAddress": {
                "final": true,
                "name": "mailAddress",
                "id": 529,
                "since": 11,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "protocolVersion": {
                "final": true,
                "name": "protocolVersion",
                "id": 1352,
                "since": 66,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "pubEncBucketKey": {
                "final": true,
                "name": "pubEncBucketKey",
                "id": 530,
                "since": 11,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "recipientKeyVersion": {
                "final": true,
                "name": "recipientKeyVersion",
                "id": 531,
                "since": 11,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "senderKeyVersion": {
                "final": true,
                "name": "senderKeyVersion",
                "id": 1431,
                "since": 69,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "KnowledgeBaseEntry": {
        "name": "KnowledgeBaseEntry",
        "since": 45,
        "type": "LIST_ELEMENT_TYPE",
        "id": 1171,
        "rootId": "CHR1dGFub3RhAAST",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1175,
                "since": 45,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1173,
                "since": 45,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 1177,
                "since": 45,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1176,
                "since": 45,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 1413,
                "since": 69,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 1174,
                "since": 45,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "description": {
                "final": false,
                "name": "description",
                "id": 1179,
                "since": 45,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "title": {
                "final": false,
                "name": "title",
                "id": 1178,
                "since": 45,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {
            "keywords": {
                "final": false,
                "name": "keywords",
                "id": 1180,
                "since": 45,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "KnowledgeBaseEntryKeyword",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "KnowledgeBaseEntryKeyword": {
        "name": "KnowledgeBaseEntryKeyword",
        "since": 45,
        "type": "AGGREGATED_TYPE",
        "id": 1168,
        "rootId": "CHR1dGFub3RhAASQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1169,
                "since": 45,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "keyword": {
                "final": false,
                "name": "keyword",
                "id": 1170,
                "since": 45,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "ListUnsubscribeData": {
        "name": "ListUnsubscribeData",
        "since": 24,
        "type": "DATA_TRANSFER_TYPE",
        "id": 867,
        "rootId": "CHR1dGFub3RhAANj",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 868,
                "since": 24,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "headers": {
                "final": false,
                "name": "headers",
                "id": 871,
                "since": 24,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "recipient": {
                "final": false,
                "name": "recipient",
                "id": 870,
                "since": 24,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "mail": {
                "final": false,
                "name": "mail",
                "id": 869,
                "since": 24,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Mail",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "Mail": {
        "name": "Mail",
        "since": 1,
        "type": "LIST_ELEMENT_TYPE",
        "id": 97,
        "rootId": "CHR1dGFub3RhAGE",
        "versioned": false,
        "encrypted": true,
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
            "_id": {
                "final": true,
                "name": "_id",
                "id": 99,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 102,
                "since": 1,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 587,
                "since": 13,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 1395,
                "since": 69,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 100,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "authStatus": {
                "final": false,
                "name": "authStatus",
                "id": 1022,
                "since": 40,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "confidential": {
                "final": true,
                "name": "confidential",
                "id": 426,
                "since": 6,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": true
            },
            "differentEnvelopeSender": {
                "final": true,
                "name": "differentEnvelopeSender",
                "id": 617,
                "since": 14,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "encryptionAuthStatus": {
                "final": true,
                "name": "encryptionAuthStatus",
                "id": 1346,
                "since": 66,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "listUnsubscribe": {
                "final": true,
                "name": "listUnsubscribe",
                "id": 866,
                "since": 24,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": true
            },
            "method": {
                "final": true,
                "name": "method",
                "id": 1120,
                "since": 42,
                "type": "Number",
                "cardinality": "One",
                "encrypted": true
            },
            "movedTime": {
                "final": true,
                "name": "movedTime",
                "id": 896,
                "since": 30,
                "type": "Date",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "phishingStatus": {
                "final": false,
                "name": "phishingStatus",
                "id": 1021,
                "since": 40,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "receivedDate": {
                "final": true,
                "name": "receivedDate",
                "id": 107,
                "since": 1,
                "type": "Date",
                "cardinality": "One",
                "encrypted": false
            },
            "recipientCount": {
                "final": true,
                "name": "recipientCount",
                "id": 1307,
                "since": 58,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "replyType": {
                "final": false,
                "name": "replyType",
                "id": 466,
                "since": 7,
                "type": "Number",
                "cardinality": "One",
                "encrypted": true
            },
            "state": {
                "final": true,
                "name": "state",
                "id": 108,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "subject": {
                "final": true,
                "name": "subject",
                "id": 105,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "unread": {
                "final": false,
                "name": "unread",
                "id": 109,
                "since": 1,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "attachments": {
                "final": true,
                "name": "attachments",
                "id": 115,
                "since": 1,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "Any",
                "refType": "File",
                "dependency": null
            },
            "bucketKey": {
                "final": true,
                "name": "bucketKey",
                "id": 1310,
                "since": 58,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "BucketKey",
                "dependency": "sys"
            },
            "conversationEntry": {
                "final": true,
                "name": "conversationEntry",
                "id": 117,
                "since": 1,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "ConversationEntry",
                "dependency": null
            },
            "firstRecipient": {
                "final": true,
                "name": "firstRecipient",
                "id": 1306,
                "since": 58,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "MailAddress",
                "dependency": null
            },
            "mailDetails": {
                "final": true,
                "name": "mailDetails",
                "id": 1308,
                "since": 58,
                "type": "BLOB_ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "MailDetailsBlob",
                "dependency": null
            },
            "mailDetailsDraft": {
                "final": true,
                "name": "mailDetailsDraft",
                "id": 1309,
                "since": 58,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "MailDetailsDraft",
                "dependency": null
            },
            "sender": {
                "final": true,
                "name": "sender",
                "id": 111,
                "since": 1,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "MailAddress",
                "dependency": null
            },
            "sets": {
                "final": false,
                "name": "sets",
                "id": 1465,
                "since": 74,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "Any",
                "refType": "MailFolder",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "MailAddress": {
        "name": "MailAddress",
        "since": 1,
        "type": "AGGREGATED_TYPE",
        "id": 92,
        "rootId": "CHR1dGFub3RhAFw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 93,
                "since": 1,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "address": {
                "final": true,
                "name": "address",
                "id": 95,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "name": {
                "final": true,
                "name": "name",
                "id": 94,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {
            "contact": {
                "final": false,
                "name": "contact",
                "id": 96,
                "since": 1,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "Contact",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "MailAddressProperties": {
        "name": "MailAddressProperties",
        "since": 56,
        "type": "AGGREGATED_TYPE",
        "id": 1263,
        "rootId": "CHR1dGFub3RhAATv",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1264,
                "since": 56,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "mailAddress": {
                "final": true,
                "name": "mailAddress",
                "id": 1265,
                "since": 56,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "senderName": {
                "final": false,
                "name": "senderName",
                "id": 1266,
                "since": 56,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "MailBag": {
        "name": "MailBag",
        "since": 74,
        "type": "AGGREGATED_TYPE",
        "id": 1460,
        "rootId": "CHR1dGFub3RhAAW0",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1461,
                "since": 74,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "mails": {
                "final": true,
                "name": "mails",
                "id": 1462,
                "since": 74,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "Mail",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "MailBox": {
        "name": "MailBox",
        "since": 1,
        "type": "ELEMENT_TYPE",
        "id": 125,
        "rootId": "CHR1dGFub3RhAH0",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 129,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 127,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 591,
                "since": 13,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 590,
                "since": 13,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 1396,
                "since": 69,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 128,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "lastInfoDate": {
                "final": true,
                "name": "lastInfoDate",
                "id": 569,
                "since": 12,
                "type": "Date",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "archivedMailBags": {
                "final": false,
                "name": "archivedMailBags",
                "id": 1463,
                "since": 74,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "MailBag",
                "dependency": null
            },
            "currentMailBag": {
                "final": false,
                "name": "currentMailBag",
                "id": 1464,
                "since": 74,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "MailBag",
                "dependency": null
            },
            "folders": {
                "final": true,
                "name": "folders",
                "id": 443,
                "since": 7,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "MailFolderRef",
                "dependency": null
            },
            "mailDetailsDrafts": {
                "final": false,
                "name": "mailDetailsDrafts",
                "id": 1318,
                "since": 60,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "MailDetailsDraftsRef",
                "dependency": null
            },
            "receivedAttachments": {
                "final": true,
                "name": "receivedAttachments",
                "id": 134,
                "since": 1,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "File",
                "dependency": null
            },
            "sentAttachments": {
                "final": true,
                "name": "sentAttachments",
                "id": 133,
                "since": 1,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "File",
                "dependency": null
            },
            "spamResults": {
                "final": true,
                "name": "spamResults",
                "id": 1220,
                "since": 48,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "SpamResults",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "MailDetails": {
        "name": "MailDetails",
        "since": 58,
        "type": "AGGREGATED_TYPE",
        "id": 1282,
        "rootId": "CHR1dGFub3RhAAUC",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1283,
                "since": 58,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "authStatus": {
                "final": false,
                "name": "authStatus",
                "id": 1289,
                "since": 58,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "sentDate": {
                "final": true,
                "name": "sentDate",
                "id": 1284,
                "since": 58,
                "type": "Date",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "body": {
                "final": true,
                "name": "body",
                "id": 1288,
                "since": 58,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "Body",
                "dependency": null
            },
            "headers": {
                "final": true,
                "name": "headers",
                "id": 1287,
                "since": 58,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "Header",
                "dependency": null
            },
            "recipients": {
                "final": true,
                "name": "recipients",
                "id": 1286,
                "since": 58,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "Recipients",
                "dependency": null
            },
            "replyTos": {
                "final": true,
                "name": "replyTos",
                "id": 1285,
                "since": 58,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "EncryptedMailAddress",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "MailDetailsBlob": {
        "name": "MailDetailsBlob",
        "since": 58,
        "type": "BLOB_ELEMENT_TYPE",
        "id": 1298,
        "rootId": "CHR1dGFub3RhAAUS",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1302,
                "since": 58,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1300,
                "since": 58,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 1304,
                "since": 58,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1303,
                "since": 58,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 1408,
                "since": 69,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 1301,
                "since": 58,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "details": {
                "final": true,
                "name": "details",
                "id": 1305,
                "since": 58,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "MailDetails",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "MailDetailsDraft": {
        "name": "MailDetailsDraft",
        "since": 58,
        "type": "LIST_ELEMENT_TYPE",
        "id": 1290,
        "rootId": "CHR1dGFub3RhAAUK",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1294,
                "since": 58,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1292,
                "since": 58,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 1296,
                "since": 58,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1295,
                "since": 58,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 1407,
                "since": 69,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 1293,
                "since": 58,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "details": {
                "final": true,
                "name": "details",
                "id": 1297,
                "since": 58,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "MailDetails",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "MailDetailsDraftsRef": {
        "name": "MailDetailsDraftsRef",
        "since": 60,
        "type": "AGGREGATED_TYPE",
        "id": 1315,
        "rootId": "CHR1dGFub3RhAAUj",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1316,
                "since": 60,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "list": {
                "final": true,
                "name": "list",
                "id": 1317,
                "since": 60,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "MailDetailsDraft",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "MailFolder": {
        "name": "MailFolder",
        "since": 7,
        "type": "LIST_ELEMENT_TYPE",
        "id": 429,
        "rootId": "CHR1dGFub3RhAAGt",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 433,
                "since": 7,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 431,
                "since": 7,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 434,
                "since": 7,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 589,
                "since": 13,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 1399,
                "since": 69,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 432,
                "since": 7,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "folderType": {
                "final": true,
                "name": "folderType",
                "id": 436,
                "since": 7,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "isLabel": {
                "final": false,
                "name": "isLabel",
                "id": 1457,
                "since": 74,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "isMailSet": {
                "final": false,
                "name": "isMailSet",
                "id": 1458,
                "since": 74,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "name": {
                "final": false,
                "name": "name",
                "id": 435,
                "since": 7,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {
            "entries": {
                "final": false,
                "name": "entries",
                "id": 1459,
                "since": 74,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "MailSetEntry",
                "dependency": null
            },
            "mails": {
                "final": true,
                "name": "mails",
                "id": 437,
                "since": 7,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "Mail",
                "dependency": null
            },
            "parentFolder": {
                "final": true,
                "name": "parentFolder",
                "id": 439,
                "since": 7,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "MailFolder",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "MailFolderRef": {
        "name": "MailFolderRef",
        "since": 7,
        "type": "AGGREGATED_TYPE",
        "id": 440,
        "rootId": "CHR1dGFub3RhAAG4",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 441,
                "since": 7,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "folders": {
                "final": true,
                "name": "folders",
                "id": 442,
                "since": 7,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "MailFolder",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "MailSetEntry": {
        "name": "MailSetEntry",
        "since": 74,
        "type": "LIST_ELEMENT_TYPE",
        "id": 1450,
        "rootId": "CHR1dGFub3RhAAWq",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1454,
                "since": 74,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1452,
                "since": 74,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1455,
                "since": 74,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 1453,
                "since": 74,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "mail": {
                "final": true,
                "name": "mail",
                "id": 1456,
                "since": 74,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Mail",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "MailboxGroupRoot": {
        "name": "MailboxGroupRoot",
        "since": 18,
        "type": "ELEMENT_TYPE",
        "id": 693,
        "rootId": "CHR1dGFub3RhAAK1",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 697,
                "since": 18,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 695,
                "since": 18,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 698,
                "since": 18,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 696,
                "since": 18,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "calendarEventUpdates": {
                "final": true,
                "name": "calendarEventUpdates",
                "id": 1119,
                "since": 42,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "CalendarEventUpdateList",
                "dependency": null
            },
            "mailbox": {
                "final": true,
                "name": "mailbox",
                "id": 699,
                "since": 18,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "MailBox",
                "dependency": null
            },
            "mailboxProperties": {
                "final": true,
                "name": "mailboxProperties",
                "id": 1203,
                "since": 47,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "MailboxProperties",
                "dependency": null
            },
            "outOfOfficeNotification": {
                "final": true,
                "name": "outOfOfficeNotification",
                "id": 1150,
                "since": 44,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "OutOfOfficeNotification",
                "dependency": null
            },
            "outOfOfficeNotificationRecipientList": {
                "final": true,
                "name": "outOfOfficeNotificationRecipientList",
                "id": 1151,
                "since": 44,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "OutOfOfficeNotificationRecipientList",
                "dependency": null
            },
            "serverProperties": {
                "final": true,
                "name": "serverProperties",
                "id": 700,
                "since": 18,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "MailboxServerProperties",
                "dependency": null
            },
            "whitelistRequests": {
                "final": true,
                "name": "whitelistRequests",
                "id": 701,
                "since": 18,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "WhitelistRequest",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "MailboxProperties": {
        "name": "MailboxProperties",
        "since": 47,
        "type": "ELEMENT_TYPE",
        "id": 1195,
        "rootId": "CHR1dGFub3RhAASr",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1199,
                "since": 47,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1197,
                "since": 47,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 1201,
                "since": 47,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1200,
                "since": 47,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 1411,
                "since": 69,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 1198,
                "since": 47,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "reportMovedMails": {
                "final": false,
                "name": "reportMovedMails",
                "id": 1202,
                "since": 47,
                "type": "Number",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {
            "mailAddressProperties": {
                "final": false,
                "name": "mailAddressProperties",
                "id": 1267,
                "since": 56,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "MailAddressProperties",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "MailboxServerProperties": {
        "name": "MailboxServerProperties",
        "since": 18,
        "type": "ELEMENT_TYPE",
        "id": 677,
        "rootId": "CHR1dGFub3RhAAKl",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 681,
                "since": 18,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 679,
                "since": 18,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 682,
                "since": 18,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 680,
                "since": 18,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "whitelistProtectionEnabled": {
                "final": false,
                "name": "whitelistProtectionEnabled",
                "id": 683,
                "since": 18,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "MoveMailData": {
        "name": "MoveMailData",
        "since": 7,
        "type": "DATA_TRANSFER_TYPE",
        "id": 445,
        "rootId": "CHR1dGFub3RhAAG9",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 446,
                "since": 7,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "mails": {
                "final": false,
                "name": "mails",
                "id": 448,
                "since": 7,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "Any",
                "refType": "Mail",
                "dependency": null
            },
            "sourceFolder": {
                "final": false,
                "name": "sourceFolder",
                "id": 1466,
                "since": 74,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "MailFolder",
                "dependency": null
            },
            "targetFolder": {
                "final": false,
                "name": "targetFolder",
                "id": 447,
                "since": 7,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "MailFolder",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "NewDraftAttachment": {
        "name": "NewDraftAttachment",
        "since": 11,
        "type": "AGGREGATED_TYPE",
        "id": 486,
        "rootId": "CHR1dGFub3RhAAHm",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 487,
                "since": 11,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "encCid": {
                "final": true,
                "name": "encCid",
                "id": 925,
                "since": 32,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "encFileName": {
                "final": true,
                "name": "encFileName",
                "id": 488,
                "since": 11,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "encMimeType": {
                "final": true,
                "name": "encMimeType",
                "id": 489,
                "since": 11,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "referenceTokens": {
                "final": true,
                "name": "referenceTokens",
                "id": 1226,
                "since": 52,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "BlobReferenceTokenWrapper",
                "dependency": "sys"
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "NewsId": {
        "name": "NewsId",
        "since": 55,
        "type": "AGGREGATED_TYPE",
        "id": 1245,
        "rootId": "CHR1dGFub3RhAATd",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1246,
                "since": 55,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "newsItemId": {
                "final": false,
                "name": "newsItemId",
                "id": 1248,
                "since": 55,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "newsItemName": {
                "final": false,
                "name": "newsItemName",
                "id": 1247,
                "since": 55,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "NewsIn": {
        "name": "NewsIn",
        "since": 55,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1259,
        "rootId": "CHR1dGFub3RhAATr",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1260,
                "since": 55,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "newsItemId": {
                "final": false,
                "name": "newsItemId",
                "id": 1261,
                "since": 55,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "NewsOut": {
        "name": "NewsOut",
        "since": 55,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1256,
        "rootId": "CHR1dGFub3RhAATo",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1257,
                "since": 55,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "newsItemIds": {
                "final": false,
                "name": "newsItemIds",
                "id": 1258,
                "since": 55,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "NewsId",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "NotificationMail": {
        "name": "NotificationMail",
        "since": 1,
        "type": "AGGREGATED_TYPE",
        "id": 223,
        "rootId": "CHR1dGFub3RhAADf",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 224,
                "since": 1,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "bodyText": {
                "final": false,
                "name": "bodyText",
                "id": 226,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "mailboxLink": {
                "final": false,
                "name": "mailboxLink",
                "id": 417,
                "since": 3,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "recipientMailAddress": {
                "final": false,
                "name": "recipientMailAddress",
                "id": 227,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "recipientName": {
                "final": false,
                "name": "recipientName",
                "id": 228,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "subject": {
                "final": false,
                "name": "subject",
                "id": 225,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "OutOfOfficeNotification": {
        "name": "OutOfOfficeNotification",
        "since": 44,
        "type": "ELEMENT_TYPE",
        "id": 1131,
        "rootId": "CHR1dGFub3RhAARr",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1135,
                "since": 44,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1133,
                "since": 44,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1136,
                "since": 44,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 1134,
                "since": 44,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "enabled": {
                "final": false,
                "name": "enabled",
                "id": 1137,
                "since": 44,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "endDate": {
                "final": false,
                "name": "endDate",
                "id": 1139,
                "since": 44,
                "type": "Date",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "startDate": {
                "final": false,
                "name": "startDate",
                "id": 1138,
                "since": 44,
                "type": "Date",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {
            "notifications": {
                "final": false,
                "name": "notifications",
                "id": 1140,
                "since": 44,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "OutOfOfficeNotificationMessage",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "OutOfOfficeNotificationMessage": {
        "name": "OutOfOfficeNotificationMessage",
        "since": 44,
        "type": "AGGREGATED_TYPE",
        "id": 1126,
        "rootId": "CHR1dGFub3RhAARm",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1127,
                "since": 44,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "message": {
                "final": false,
                "name": "message",
                "id": 1129,
                "since": 44,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "subject": {
                "final": false,
                "name": "subject",
                "id": 1128,
                "since": 44,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "type": {
                "final": false,
                "name": "type",
                "id": 1130,
                "since": 44,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "OutOfOfficeNotificationRecipientList": {
        "name": "OutOfOfficeNotificationRecipientList",
        "since": 44,
        "type": "AGGREGATED_TYPE",
        "id": 1147,
        "rootId": "CHR1dGFub3RhAAR7",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1148,
                "since": 44,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "list": {
                "final": true,
                "name": "list",
                "id": 1149,
                "since": 44,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "OutOfOfficeNotificationRecipient",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "PhishingMarkerWebsocketData": {
        "name": "PhishingMarkerWebsocketData",
        "since": 40,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1034,
        "rootId": "CHR1dGFub3RhAAQK",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1035,
                "since": 40,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "lastId": {
                "final": false,
                "name": "lastId",
                "id": 1036,
                "since": 40,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "markers": {
                "final": false,
                "name": "markers",
                "id": 1037,
                "since": 40,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "ReportedMailFieldMarker",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "PhotosRef": {
        "name": "PhotosRef",
        "since": 23,
        "type": "AGGREGATED_TYPE",
        "id": 853,
        "rootId": "CHR1dGFub3RhAANV",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 854,
                "since": 23,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "files": {
                "final": true,
                "name": "files",
                "id": 855,
                "since": 23,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "File",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "ReceiveInfoServiceData": {
        "name": "ReceiveInfoServiceData",
        "since": 12,
        "type": "DATA_TRANSFER_TYPE",
        "id": 570,
        "rootId": "CHR1dGFub3RhAAI6",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 571,
                "since": 12,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "language": {
                "final": true,
                "name": "language",
                "id": 1121,
                "since": 42,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "Recipients": {
        "name": "Recipients",
        "since": 58,
        "type": "AGGREGATED_TYPE",
        "id": 1277,
        "rootId": "CHR1dGFub3RhAAT9",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1278,
                "since": 58,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "bccRecipients": {
                "final": true,
                "name": "bccRecipients",
                "id": 1281,
                "since": 58,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "MailAddress",
                "dependency": null
            },
            "ccRecipients": {
                "final": true,
                "name": "ccRecipients",
                "id": 1280,
                "since": 58,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "MailAddress",
                "dependency": null
            },
            "toRecipients": {
                "final": true,
                "name": "toRecipients",
                "id": 1279,
                "since": 58,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "MailAddress",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "RemoteImapSyncInfo": {
        "name": "RemoteImapSyncInfo",
        "since": 1,
        "type": "LIST_ELEMENT_TYPE",
        "id": 183,
        "rootId": "CHR1dGFub3RhAAC3",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 187,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 185,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 594,
                "since": 13,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 186,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "seen": {
                "final": false,
                "name": "seen",
                "id": 189,
                "since": 1,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "message": {
                "final": false,
                "name": "message",
                "id": 188,
                "since": 1,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Mail",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "ReportMailPostData": {
        "name": "ReportMailPostData",
        "since": 40,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1066,
        "rootId": "CHR1dGFub3RhAAQq",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1067,
                "since": 40,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "mailSessionKey": {
                "final": false,
                "name": "mailSessionKey",
                "id": 1068,
                "since": 40,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "reportType": {
                "final": false,
                "name": "reportType",
                "id": 1082,
                "since": 41,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "mailId": {
                "final": false,
                "name": "mailId",
                "id": 1069,
                "since": 40,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Mail",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "ReportedMailFieldMarker": {
        "name": "ReportedMailFieldMarker",
        "since": 40,
        "type": "AGGREGATED_TYPE",
        "id": 1023,
        "rootId": "CHR1dGFub3RhAAP_",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1024,
                "since": 40,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "marker": {
                "final": false,
                "name": "marker",
                "id": 1025,
                "since": 40,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "status": {
                "final": false,
                "name": "status",
                "id": 1026,
                "since": 40,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "SecureExternalRecipientKeyData": {
        "name": "SecureExternalRecipientKeyData",
        "since": 11,
        "type": "AGGREGATED_TYPE",
        "id": 532,
        "rootId": "CHR1dGFub3RhAAIU",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 533,
                "since": 11,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "kdfVersion": {
                "final": true,
                "name": "kdfVersion",
                "id": 1324,
                "since": 63,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "mailAddress": {
                "final": true,
                "name": "mailAddress",
                "id": 534,
                "since": 11,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "ownerEncBucketKey": {
                "final": true,
                "name": "ownerEncBucketKey",
                "id": 599,
                "since": 13,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "ownerKeyVersion": {
                "final": true,
                "name": "ownerKeyVersion",
                "id": 1417,
                "since": 69,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "passwordVerifier": {
                "final": true,
                "name": "passwordVerifier",
                "id": 536,
                "since": 11,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "pwEncCommunicationKey": {
                "final": true,
                "name": "pwEncCommunicationKey",
                "id": 540,
                "since": 11,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "salt": {
                "final": true,
                "name": "salt",
                "id": 538,
                "since": 11,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "saltHash": {
                "final": true,
                "name": "saltHash",
                "id": 539,
                "since": 11,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "userGroupKeyVersion": {
                "final": false,
                "name": "userGroupKeyVersion",
                "id": 1445,
                "since": 72,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "SendDraftData": {
        "name": "SendDraftData",
        "since": 11,
        "type": "DATA_TRANSFER_TYPE",
        "id": 547,
        "rootId": "CHR1dGFub3RhAAIj",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 548,
                "since": 11,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "bucketEncMailSessionKey": {
                "final": true,
                "name": "bucketEncMailSessionKey",
                "id": 551,
                "since": 11,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "calendarMethod": {
                "final": false,
                "name": "calendarMethod",
                "id": 1117,
                "since": 42,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "language": {
                "final": true,
                "name": "language",
                "id": 549,
                "since": 11,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "mailSessionKey": {
                "final": true,
                "name": "mailSessionKey",
                "id": 550,
                "since": 11,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "plaintext": {
                "final": true,
                "name": "plaintext",
                "id": 675,
                "since": 18,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "senderNameUnencrypted": {
                "final": true,
                "name": "senderNameUnencrypted",
                "id": 552,
                "since": 11,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "sessionEncEncryptionAuthStatus": {
                "final": true,
                "name": "sessionEncEncryptionAuthStatus",
                "id": 1444,
                "since": 71,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {
            "attachmentKeyData": {
                "final": true,
                "name": "attachmentKeyData",
                "id": 555,
                "since": 11,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "AttachmentKeyData",
                "dependency": null
            },
            "internalRecipientKeyData": {
                "final": true,
                "name": "internalRecipientKeyData",
                "id": 553,
                "since": 11,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "InternalRecipientKeyData",
                "dependency": null
            },
            "mail": {
                "final": true,
                "name": "mail",
                "id": 556,
                "since": 11,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Mail",
                "dependency": null
            },
            "secureExternalRecipientKeyData": {
                "final": true,
                "name": "secureExternalRecipientKeyData",
                "id": 554,
                "since": 11,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "SecureExternalRecipientKeyData",
                "dependency": null
            },
            "symEncInternalRecipientKeyData": {
                "final": true,
                "name": "symEncInternalRecipientKeyData",
                "id": 1353,
                "since": 66,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "SymEncInternalRecipientKeyData",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "SendDraftReturn": {
        "name": "SendDraftReturn",
        "since": 11,
        "type": "DATA_TRANSFER_TYPE",
        "id": 557,
        "rootId": "CHR1dGFub3RhAAIt",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 558,
                "since": 11,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "messageId": {
                "final": false,
                "name": "messageId",
                "id": 559,
                "since": 11,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "sentDate": {
                "final": false,
                "name": "sentDate",
                "id": 560,
                "since": 11,
                "type": "Date",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "notifications": {
                "final": false,
                "name": "notifications",
                "id": 561,
                "since": 11,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "NotificationMail",
                "dependency": null
            },
            "sentMail": {
                "final": true,
                "name": "sentMail",
                "id": 562,
                "since": 11,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Mail",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "SharedGroupData": {
        "name": "SharedGroupData",
        "since": 38,
        "type": "AGGREGATED_TYPE",
        "id": 992,
        "rootId": "CHR1dGFub3RhAAPg",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 993,
                "since": 38,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "bucketEncInvitationSessionKey": {
                "final": false,
                "name": "bucketEncInvitationSessionKey",
                "id": 998,
                "since": 38,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "capability": {
                "final": false,
                "name": "capability",
                "id": 994,
                "since": 38,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "sessionEncInviterName": {
                "final": false,
                "name": "sessionEncInviterName",
                "id": 997,
                "since": 38,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "sessionEncSharedGroupKey": {
                "final": false,
                "name": "sessionEncSharedGroupKey",
                "id": 995,
                "since": 38,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "sessionEncSharedGroupName": {
                "final": false,
                "name": "sessionEncSharedGroupName",
                "id": 996,
                "since": 38,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "sharedGroup": {
                "final": false,
                "name": "sharedGroup",
                "id": 1001,
                "since": 38,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "sharedGroupEncInviterGroupInfoKey": {
                "final": true,
                "name": "sharedGroupEncInviterGroupInfoKey",
                "id": 999,
                "since": 38,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "sharedGroupEncSharedGroupInfoKey": {
                "final": true,
                "name": "sharedGroupEncSharedGroupInfoKey",
                "id": 1000,
                "since": 38,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "sharedGroupKeyVersion": {
                "final": true,
                "name": "sharedGroupKeyVersion",
                "id": 1420,
                "since": 69,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "SpamResults": {
        "name": "SpamResults",
        "since": 48,
        "type": "AGGREGATED_TYPE",
        "id": 1217,
        "rootId": "CHR1dGFub3RhAATB",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1218,
                "since": 48,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "list": {
                "final": true,
                "name": "list",
                "id": 1219,
                "since": 48,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "SpamResult",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "Subfiles": {
        "name": "Subfiles",
        "since": 1,
        "type": "AGGREGATED_TYPE",
        "id": 11,
        "rootId": "CHR1dGFub3RhAAs",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 12,
                "since": 1,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "files": {
                "final": true,
                "name": "files",
                "id": 27,
                "since": 1,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "File",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "SymEncInternalRecipientKeyData": {
        "name": "SymEncInternalRecipientKeyData",
        "since": 66,
        "type": "AGGREGATED_TYPE",
        "id": 1347,
        "rootId": "CHR1dGFub3RhAAVD",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1348,
                "since": 66,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "mailAddress": {
                "final": true,
                "name": "mailAddress",
                "id": 1349,
                "since": 66,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "symEncBucketKey": {
                "final": true,
                "name": "symEncBucketKey",
                "id": 1350,
                "since": 66,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "symKeyVersion": {
                "final": false,
                "name": "symKeyVersion",
                "id": 1435,
                "since": 69,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "keyGroup": {
                "final": true,
                "name": "keyGroup",
                "id": 1351,
                "since": 66,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Group",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "TemplateGroupRoot": {
        "name": "TemplateGroupRoot",
        "since": 45,
        "type": "ELEMENT_TYPE",
        "id": 1181,
        "rootId": "CHR1dGFub3RhAASd",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1185,
                "since": 45,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1183,
                "since": 45,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 1187,
                "since": 45,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1186,
                "since": 45,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 1412,
                "since": 69,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 1184,
                "since": 45,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "knowledgeBase": {
                "final": true,
                "name": "knowledgeBase",
                "id": 1189,
                "since": 45,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "KnowledgeBaseEntry",
                "dependency": null
            },
            "templates": {
                "final": true,
                "name": "templates",
                "id": 1188,
                "since": 45,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "EmailTemplate",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "TranslationGetIn": {
        "name": "TranslationGetIn",
        "since": 70,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1436,
        "rootId": "CHR1dGFub3RhAAWc",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1437,
                "since": 70,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "lang": {
                "final": true,
                "name": "lang",
                "id": 1438,
                "since": 70,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "TranslationGetOut": {
        "name": "TranslationGetOut",
        "since": 70,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1439,
        "rootId": "CHR1dGFub3RhAAWf",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1440,
                "since": 70,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "giftCardSubject": {
                "final": false,
                "name": "giftCardSubject",
                "id": 1441,
                "since": 70,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "invitationSubject": {
                "final": false,
                "name": "invitationSubject",
                "id": 1442,
                "since": 70,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "TutanotaProperties": {
        "name": "TutanotaProperties",
        "since": 1,
        "type": "ELEMENT_TYPE",
        "id": 216,
        "rootId": "CHR1dGFub3RhAADY",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 220,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 218,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 598,
                "since": 13,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 597,
                "since": 13,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 1398,
                "since": 69,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 219,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "customEmailSignature": {
                "final": false,
                "name": "customEmailSignature",
                "id": 471,
                "since": 9,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "defaultSender": {
                "final": false,
                "name": "defaultSender",
                "id": 469,
                "since": 8,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "defaultUnconfidential": {
                "final": false,
                "name": "defaultUnconfidential",
                "id": 470,
                "since": 8,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "emailSignatureType": {
                "final": false,
                "name": "emailSignatureType",
                "id": 472,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "lastSeenAnnouncement": {
                "final": false,
                "name": "lastSeenAnnouncement",
                "id": 897,
                "since": 30,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "noAutomaticContacts": {
                "final": false,
                "name": "noAutomaticContacts",
                "id": 568,
                "since": 11,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": true
            },
            "notificationMailLanguage": {
                "final": false,
                "name": "notificationMailLanguage",
                "id": 418,
                "since": 4,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "sendPlaintextOnly": {
                "final": false,
                "name": "sendPlaintextOnly",
                "id": 676,
                "since": 18,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": true
            },
            "userEncEntropy": {
                "final": false,
                "name": "userEncEntropy",
                "id": 410,
                "since": 2,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "userKeyVersion": {
                "final": false,
                "name": "userKeyVersion",
                "id": 1434,
                "since": 69,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {
            "imapSyncConfig": {
                "final": false,
                "name": "imapSyncConfig",
                "id": 222,
                "since": 1,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "ImapSyncConfiguration",
                "dependency": null
            },
            "inboxRules": {
                "final": false,
                "name": "inboxRules",
                "id": 578,
                "since": 12,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "InboxRule",
                "dependency": null
            },
            "lastPushedMail": {
                "final": false,
                "name": "lastPushedMail",
                "id": 221,
                "since": 1,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "Mail",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "UpdateMailFolderData": {
        "name": "UpdateMailFolderData",
        "since": 59,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1311,
        "rootId": "CHR1dGFub3RhAAUf",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1312,
                "since": 59,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "folder": {
                "final": false,
                "name": "folder",
                "id": 1313,
                "since": 59,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "MailFolder",
                "dependency": null
            },
            "newParent": {
                "final": false,
                "name": "newParent",
                "id": 1314,
                "since": 59,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "MailFolder",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "UserAccountCreateData": {
        "name": "UserAccountCreateData",
        "since": 16,
        "type": "DATA_TRANSFER_TYPE",
        "id": 663,
        "rootId": "CHR1dGFub3RhAAKX",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 664,
                "since": 16,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "date": {
                "final": false,
                "name": "date",
                "id": 665,
                "since": 16,
                "type": "Date",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {
            "userData": {
                "final": false,
                "name": "userData",
                "id": 666,
                "since": 16,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "UserAccountUserData",
                "dependency": null
            },
            "userGroupData": {
                "final": false,
                "name": "userGroupData",
                "id": 667,
                "since": 16,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "InternalGroupData",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "UserAccountUserData": {
        "name": "UserAccountUserData",
        "since": 16,
        "type": "AGGREGATED_TYPE",
        "id": 622,
        "rootId": "CHR1dGFub3RhAAJu",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 623,
                "since": 16,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "contactEncContactListSessionKey": {
                "final": false,
                "name": "contactEncContactListSessionKey",
                "id": 637,
                "since": 16,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "customerEncContactGroupInfoSessionKey": {
                "final": false,
                "name": "customerEncContactGroupInfoSessionKey",
                "id": 640,
                "since": 16,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "customerEncFileGroupInfoSessionKey": {
                "final": false,
                "name": "customerEncFileGroupInfoSessionKey",
                "id": 641,
                "since": 16,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "customerEncMailGroupInfoSessionKey": {
                "final": false,
                "name": "customerEncMailGroupInfoSessionKey",
                "id": 639,
                "since": 16,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "customerKeyVersion": {
                "final": false,
                "name": "customerKeyVersion",
                "id": 1426,
                "since": 69,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "encryptedName": {
                "final": false,
                "name": "encryptedName",
                "id": 625,
                "since": 16,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "fileEncFileSystemSessionKey": {
                "final": false,
                "name": "fileEncFileSystemSessionKey",
                "id": 638,
                "since": 16,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "kdfVersion": {
                "final": false,
                "name": "kdfVersion",
                "id": 1322,
                "since": 63,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "mailAddress": {
                "final": false,
                "name": "mailAddress",
                "id": 624,
                "since": 16,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "mailEncMailBoxSessionKey": {
                "final": false,
                "name": "mailEncMailBoxSessionKey",
                "id": 636,
                "since": 16,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "pwEncUserGroupKey": {
                "final": false,
                "name": "pwEncUserGroupKey",
                "id": 629,
                "since": 16,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "recoverCodeEncUserGroupKey": {
                "final": false,
                "name": "recoverCodeEncUserGroupKey",
                "id": 893,
                "since": 29,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "recoverCodeVerifier": {
                "final": false,
                "name": "recoverCodeVerifier",
                "id": 894,
                "since": 29,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "salt": {
                "final": false,
                "name": "salt",
                "id": 626,
                "since": 16,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "userEncContactGroupKey": {
                "final": false,
                "name": "userEncContactGroupKey",
                "id": 632,
                "since": 16,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "userEncCustomerGroupKey": {
                "final": false,
                "name": "userEncCustomerGroupKey",
                "id": 630,
                "since": 16,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "userEncEntropy": {
                "final": false,
                "name": "userEncEntropy",
                "id": 634,
                "since": 16,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "userEncFileGroupKey": {
                "final": false,
                "name": "userEncFileGroupKey",
                "id": 633,
                "since": 16,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "userEncMailGroupKey": {
                "final": false,
                "name": "userEncMailGroupKey",
                "id": 631,
                "since": 16,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "userEncRecoverCode": {
                "final": false,
                "name": "userEncRecoverCode",
                "id": 892,
                "since": 29,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "userEncTutanotaPropertiesSessionKey": {
                "final": false,
                "name": "userEncTutanotaPropertiesSessionKey",
                "id": 635,
                "since": 16,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "verifier": {
                "final": false,
                "name": "verifier",
                "id": 627,
                "since": 16,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "tutanota",
        "version": "75"
    },
    "UserAreaGroupData": {
        "name": "UserAreaGroupData",
        "since": 33,
        "type": "AGGREGATED_TYPE",
        "id": 956,
        "rootId": "CHR1dGFub3RhAAO8",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 957,
                "since": 33,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "adminEncGroupKey": {
                "final": false,
                "name": "adminEncGroupKey",
                "id": 959,
                "since": 33,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "adminKeyVersion": {
                "final": false,
                "name": "adminKeyVersion",
                "id": 1423,
                "since": 69,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "customerEncGroupInfoSessionKey": {
                "final": false,
                "name": "customerEncGroupInfoSessionKey",
                "id": 960,
                "since": 33,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "customerKeyVersion": {
                "final": false,
                "name": "customerKeyVersion",
                "id": 1424,
                "since": 69,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "groupEncGroupRootSessionKey": {
                "final": false,
                "name": "groupEncGroupRootSessionKey",
                "id": 958,
                "since": 33,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "groupInfoEncName": {
                "final": false,
                "name": "groupInfoEncName",
                "id": 962,
                "since": 33,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "userEncGroupKey": {
                "final": false,
                "name": "userEncGroupKey",
                "id": 961,
                "since": 33,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "userKeyVersion": {
                "final": false,
                "name": "userKeyVersion",
                "id": 1425,
                "since": 69,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "adminGroup": {
                "final": true,
                "name": "adminGroup",
                "id": 963,
                "since": 33,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "Group",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "UserAreaGroupDeleteData": {
        "name": "UserAreaGroupDeleteData",
        "since": 45,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1190,
        "rootId": "CHR1dGFub3RhAASm",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1191,
                "since": 45,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "group": {
                "final": false,
                "name": "group",
                "id": 1192,
                "since": 45,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Group",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "UserAreaGroupPostData": {
        "name": "UserAreaGroupPostData",
        "since": 33,
        "type": "DATA_TRANSFER_TYPE",
        "id": 964,
        "rootId": "CHR1dGFub3RhAAPE",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 965,
                "since": 33,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "groupData": {
                "final": false,
                "name": "groupData",
                "id": 966,
                "since": 33,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "UserAreaGroupData",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    },
    "UserSettingsGroupRoot": {
        "name": "UserSettingsGroupRoot",
        "since": 34,
        "type": "ELEMENT_TYPE",
        "id": 972,
        "rootId": "CHR1dGFub3RhAAPM",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 976,
                "since": 34,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 974,
                "since": 34,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 978,
                "since": 34,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 977,
                "since": 34,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 1403,
                "since": 69,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 975,
                "since": 34,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "startOfTheWeek": {
                "final": false,
                "name": "startOfTheWeek",
                "id": 981,
                "since": 34,
                "type": "Number",
                "cardinality": "One",
                "encrypted": true
            },
            "timeFormat": {
                "final": false,
                "name": "timeFormat",
                "id": 980,
                "since": 34,
                "type": "Number",
                "cardinality": "One",
                "encrypted": true
            },
            "usageDataOptedIn": {
                "final": false,
                "name": "usageDataOptedIn",
                "id": 1234,
                "since": 54,
                "type": "Boolean",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            }
        },
        "associations": {
            "groupSettings": {
                "final": false,
                "name": "groupSettings",
                "id": 979,
                "since": 34,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "GroupSettings",
                "dependency": null
            }
        },
        "app": "tutanota",
        "version": "75"
    }
}