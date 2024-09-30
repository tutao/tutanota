// This is an automatically generated file, please do not edit by hand!

// You should not use it directly, please use `resolveTypReference()` instead.	
// We do not want tsc to spend time either checking or inferring type of these huge expressions. Even when it does try to infer them they are still wrong.
// The actual type is an object with keys as entities names and values as TypeModel.

/** @type {any} */
export const typeModels = {
    "AccountingInfo": {
        "name": "AccountingInfo",
        "since": 1,
        "type": "ELEMENT_TYPE",
        "id": 143,
        "rootId": "A3N5cwAAjw",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 147,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 145,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_modified": {
                "final": true,
                "name": "_modified",
                "id": 1499,
                "since": 43,
                "type": "Date",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 1010,
                "since": 17,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1009,
                "since": 17,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 2223,
                "since": 96,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 146,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "invoiceAddress": {
                "final": false,
                "name": "invoiceAddress",
                "id": 763,
                "since": 9,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "invoiceCountry": {
                "final": false,
                "name": "invoiceCountry",
                "id": 764,
                "since": 9,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "invoiceName": {
                "final": false,
                "name": "invoiceName",
                "id": 762,
                "since": 9,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "invoiceVatIdNo": {
                "final": false,
                "name": "invoiceVatIdNo",
                "id": 766,
                "since": 9,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "lastInvoiceNbrOfSentSms": {
                "final": true,
                "name": "lastInvoiceNbrOfSentSms",
                "id": 593,
                "since": 2,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "lastInvoiceTimestamp": {
                "final": true,
                "name": "lastInvoiceTimestamp",
                "id": 592,
                "since": 2,
                "type": "Date",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "paymentAccountIdentifier": {
                "final": false,
                "name": "paymentAccountIdentifier",
                "id": 1060,
                "since": 18,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "paymentInterval": {
                "final": false,
                "name": "paymentInterval",
                "id": 769,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "paymentMethod": {
                "final": false,
                "name": "paymentMethod",
                "id": 767,
                "since": 9,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "paymentMethodInfo": {
                "final": false,
                "name": "paymentMethodInfo",
                "id": 768,
                "since": 9,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "paymentProviderCustomerId": {
                "final": false,
                "name": "paymentProviderCustomerId",
                "id": 770,
                "since": 9,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "paypalBillingAgreement": {
                "final": false,
                "name": "paypalBillingAgreement",
                "id": 1312,
                "since": 30,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "secondCountryInfo": {
                "final": false,
                "name": "secondCountryInfo",
                "id": 765,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {
            "appStoreSubscription": {
                "final": false,
                "name": "appStoreSubscription",
                "id": 2424,
                "since": 103,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "AppStoreSubscription",
                "dependency": null
            },
            "invoiceInfo": {
                "final": true,
                "name": "invoiceInfo",
                "id": 771,
                "since": 9,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "InvoiceInfo",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "AdminGroupKeyAuthenticationData": {
        "name": "AdminGroupKeyAuthenticationData",
        "since": 111,
        "type": "AGGREGATED_TYPE",
        "id": 2477,
        "rootId": "A3N5cwAJrQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 2478,
                "since": 111,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "authKeyEncAdminRotationHash": {
                "final": false,
                "name": "authKeyEncAdminRotationHash",
                "id": 2481,
                "since": 111,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "version": {
                "final": false,
                "name": "version",
                "id": 2480,
                "since": 111,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "userGroup": {
                "final": false,
                "name": "userGroup",
                "id": 2479,
                "since": 111,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Group",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "AdminGroupKeyRotationPostIn": {
        "name": "AdminGroupKeyRotationPostIn",
        "since": 101,
        "type": "DATA_TRANSFER_TYPE",
        "id": 2364,
        "rootId": "A3N5cwAJPA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 2365,
                "since": 101,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "adminGroupKeyAuthenticationDataList": {
                "final": false,
                "name": "adminGroupKeyAuthenticationDataList",
                "id": 2483,
                "since": 111,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "AdminGroupKeyAuthenticationData",
                "dependency": null
            },
            "adminGroupKeyData": {
                "final": false,
                "name": "adminGroupKeyData",
                "id": 2366,
                "since": 101,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "GroupKeyRotationData",
                "dependency": null
            },
            "userGroupKeyData": {
                "final": false,
                "name": "userGroupKeyData",
                "id": 2367,
                "since": 101,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "UserGroupKeyRotationData",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "AdministratedGroupsRef": {
        "name": "AdministratedGroupsRef",
        "since": 27,
        "type": "AGGREGATED_TYPE",
        "id": 1303,
        "rootId": "A3N5cwAFFw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1304,
                "since": 27,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "items": {
                "final": true,
                "name": "items",
                "id": 1305,
                "since": 27,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "AdministratedGroup",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "AffiliatePartnerKpiMonthSummary": {
        "name": "AffiliatePartnerKpiMonthSummary",
        "since": 110,
        "type": "AGGREGATED_TYPE",
        "id": 2453,
        "rootId": "A3N5cwAJlQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 2454,
                "since": 110,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "commission": {
                "final": false,
                "name": "commission",
                "id": 2460,
                "since": 110,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "monthTimestamp": {
                "final": false,
                "name": "monthTimestamp",
                "id": 2455,
                "since": 110,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "newFree": {
                "final": false,
                "name": "newFree",
                "id": 2456,
                "since": 110,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "newPaid": {
                "final": false,
                "name": "newPaid",
                "id": 2457,
                "since": 110,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "totalFree": {
                "final": false,
                "name": "totalFree",
                "id": 2458,
                "since": 110,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "totalPaid": {
                "final": false,
                "name": "totalPaid",
                "id": 2459,
                "since": 110,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "AffiliatePartnerKpiServiceGetOut": {
        "name": "AffiliatePartnerKpiServiceGetOut",
        "since": 110,
        "type": "DATA_TRANSFER_TYPE",
        "id": 2461,
        "rootId": "A3N5cwAJnQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 2462,
                "since": 110,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "accumulatedCommission": {
                "final": false,
                "name": "accumulatedCommission",
                "id": 2464,
                "since": 110,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "creditedCommission": {
                "final": false,
                "name": "creditedCommission",
                "id": 2465,
                "since": 110,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "promotionId": {
                "final": false,
                "name": "promotionId",
                "id": 2463,
                "since": 110,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "kpis": {
                "final": false,
                "name": "kpis",
                "id": 2466,
                "since": 110,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "AffiliatePartnerKpiMonthSummary",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "AlarmInfo": {
        "name": "AlarmInfo",
        "since": 48,
        "type": "AGGREGATED_TYPE",
        "id": 1536,
        "rootId": "A3N5cwAGAA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1537,
                "since": 48,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "alarmIdentifier": {
                "final": true,
                "name": "alarmIdentifier",
                "id": 1539,
                "since": 48,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "trigger": {
                "final": true,
                "name": "trigger",
                "id": 1538,
                "since": 48,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {
            "calendarRef": {
                "final": false,
                "name": "calendarRef",
                "id": 1540,
                "since": 48,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "CalendarEventRef",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "AlarmNotification": {
        "name": "AlarmNotification",
        "since": 48,
        "type": "AGGREGATED_TYPE",
        "id": 1564,
        "rootId": "A3N5cwAGHA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1565,
                "since": 48,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "eventEnd": {
                "final": true,
                "name": "eventEnd",
                "id": 1569,
                "since": 48,
                "type": "Date",
                "cardinality": "One",
                "encrypted": true
            },
            "eventStart": {
                "final": true,
                "name": "eventStart",
                "id": 1568,
                "since": 48,
                "type": "Date",
                "cardinality": "One",
                "encrypted": true
            },
            "operation": {
                "final": true,
                "name": "operation",
                "id": 1566,
                "since": 48,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "summary": {
                "final": true,
                "name": "summary",
                "id": 1567,
                "since": 48,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {
            "alarmInfo": {
                "final": true,
                "name": "alarmInfo",
                "id": 1570,
                "since": 48,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "AlarmInfo",
                "dependency": null
            },
            "notificationSessionKeys": {
                "final": true,
                "name": "notificationSessionKeys",
                "id": 1572,
                "since": 48,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "NotificationSessionKey",
                "dependency": null
            },
            "repeatRule": {
                "final": true,
                "name": "repeatRule",
                "id": 1571,
                "since": 48,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "RepeatRule",
                "dependency": null
            },
            "user": {
                "final": true,
                "name": "user",
                "id": 1573,
                "since": 48,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "User",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "AlarmServicePost": {
        "name": "AlarmServicePost",
        "since": 48,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1576,
        "rootId": "A3N5cwAGKA",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1577,
                "since": 48,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "alarmNotifications": {
                "final": false,
                "name": "alarmNotifications",
                "id": 1578,
                "since": 48,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "AlarmNotification",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "ArchiveRef": {
        "name": "ArchiveRef",
        "since": 69,
        "type": "AGGREGATED_TYPE",
        "id": 1873,
        "rootId": "A3N5cwAHUQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1874,
                "since": 69,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "archiveId": {
                "final": true,
                "name": "archiveId",
                "id": 1875,
                "since": 69,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "ArchiveType": {
        "name": "ArchiveType",
        "since": 69,
        "type": "AGGREGATED_TYPE",
        "id": 1876,
        "rootId": "A3N5cwAHVA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1877,
                "since": 69,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "active": {
                "final": false,
                "name": "active",
                "id": 1879,
                "since": 69,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "ArchiveRef",
                "dependency": null
            },
            "inactive": {
                "final": false,
                "name": "inactive",
                "id": 1880,
                "since": 69,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "ArchiveRef",
                "dependency": null
            },
            "type": {
                "final": false,
                "name": "type",
                "id": 1878,
                "since": 69,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "TypeInfo",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "AuditLogEntry": {
        "name": "AuditLogEntry",
        "since": 22,
        "type": "LIST_ELEMENT_TYPE",
        "id": 1101,
        "rootId": "A3N5cwAETQ",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1105,
                "since": 22,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1103,
                "since": 22,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 1107,
                "since": 22,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1106,
                "since": 22,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 2227,
                "since": 96,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 1104,
                "since": 22,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "action": {
                "final": true,
                "name": "action",
                "id": 1110,
                "since": 22,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "actorIpAddress": {
                "final": true,
                "name": "actorIpAddress",
                "id": 1109,
                "since": 22,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "actorMailAddress": {
                "final": true,
                "name": "actorMailAddress",
                "id": 1108,
                "since": 22,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "date": {
                "final": true,
                "name": "date",
                "id": 1112,
                "since": 22,
                "type": "Date",
                "cardinality": "One",
                "encrypted": true
            },
            "modifiedEntity": {
                "final": true,
                "name": "modifiedEntity",
                "id": 1111,
                "since": 22,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {
            "groupInfo": {
                "final": true,
                "name": "groupInfo",
                "id": 1113,
                "since": 22,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "GroupInfo",
                "dependency": null
            },
            "modifiedGroupInfo": {
                "final": true,
                "name": "modifiedGroupInfo",
                "id": 1307,
                "since": 27,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "GroupInfo",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "AuditLogRef": {
        "name": "AuditLogRef",
        "since": 22,
        "type": "AGGREGATED_TYPE",
        "id": 1114,
        "rootId": "A3N5cwAEWg",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1115,
                "since": 22,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "items": {
                "final": true,
                "name": "items",
                "id": 1116,
                "since": 22,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "AuditLogEntry",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "AuthenticatedDevice": {
        "name": "AuthenticatedDevice",
        "since": 1,
        "type": "AGGREGATED_TYPE",
        "id": 43,
        "rootId": "A3N5cwAr",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 44,
                "since": 1,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "authType": {
                "final": true,
                "name": "authType",
                "id": 45,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "deviceKey": {
                "final": true,
                "name": "deviceKey",
                "id": 47,
                "since": 1,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "deviceToken": {
                "final": true,
                "name": "deviceToken",
                "id": 46,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "Authentication": {
        "name": "Authentication",
        "since": 1,
        "type": "AGGREGATED_TYPE",
        "id": 453,
        "rootId": "A3N5cwABxQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 454,
                "since": 1,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "accessToken": {
                "final": true,
                "name": "accessToken",
                "id": 1239,
                "since": 23,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "authVerifier": {
                "final": false,
                "name": "authVerifier",
                "id": 456,
                "since": 1,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "externalAuthToken": {
                "final": false,
                "name": "externalAuthToken",
                "id": 968,
                "since": 15,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {
            "userId": {
                "final": false,
                "name": "userId",
                "id": 455,
                "since": 1,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "User",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "AutoLoginDataDelete": {
        "name": "AutoLoginDataDelete",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 435,
        "rootId": "A3N5cwABsw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 436,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "deviceToken": {
                "final": false,
                "name": "deviceToken",
                "id": 437,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "AutoLoginDataGet": {
        "name": "AutoLoginDataGet",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 431,
        "rootId": "A3N5cwABrw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 432,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "deviceToken": {
                "final": false,
                "name": "deviceToken",
                "id": 434,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "userId": {
                "final": false,
                "name": "userId",
                "id": 433,
                "since": 1,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "User",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "AutoLoginDataReturn": {
        "name": "AutoLoginDataReturn",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 438,
        "rootId": "A3N5cwABtg",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 439,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "deviceKey": {
                "final": false,
                "name": "deviceKey",
                "id": 440,
                "since": 1,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "AutoLoginPostReturn": {
        "name": "AutoLoginPostReturn",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 441,
        "rootId": "A3N5cwABuQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 442,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "deviceToken": {
                "final": false,
                "name": "deviceToken",
                "id": 443,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "Blob": {
        "name": "Blob",
        "since": 69,
        "type": "AGGREGATED_TYPE",
        "id": 1882,
        "rootId": "A3N5cwAHWg",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1883,
                "since": 69,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "archiveId": {
                "final": false,
                "name": "archiveId",
                "id": 1884,
                "since": 69,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "blobId": {
                "final": false,
                "name": "blobId",
                "id": 1906,
                "since": 72,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "size": {
                "final": false,
                "name": "size",
                "id": 1898,
                "since": 70,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "BlobReferenceTokenWrapper": {
        "name": "BlobReferenceTokenWrapper",
        "since": 74,
        "type": "AGGREGATED_TYPE",
        "id": 1990,
        "rootId": "A3N5cwAHxg",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1991,
                "since": 74,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "blobReferenceToken": {
                "final": true,
                "name": "blobReferenceToken",
                "id": 1992,
                "since": 74,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "Booking": {
        "name": "Booking",
        "since": 9,
        "type": "LIST_ELEMENT_TYPE",
        "id": 709,
        "rootId": "A3N5cwACxQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_area": {
                "final": true,
                "name": "_area",
                "id": 715,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_format": {
                "final": false,
                "name": "_format",
                "id": 713,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 711,
                "since": 9,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_owner": {
                "final": true,
                "name": "_owner",
                "id": 714,
                "since": 9,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1004,
                "since": 17,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 712,
                "since": 9,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "bonusMonth": {
                "final": false,
                "name": "bonusMonth",
                "id": 2103,
                "since": 86,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "createDate": {
                "final": false,
                "name": "createDate",
                "id": 716,
                "since": 9,
                "type": "Date",
                "cardinality": "One",
                "encrypted": false
            },
            "endDate": {
                "final": false,
                "name": "endDate",
                "id": 718,
                "since": 9,
                "type": "Date",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "paymentInterval": {
                "final": false,
                "name": "paymentInterval",
                "id": 719,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "paymentMonths": {
                "final": false,
                "name": "paymentMonths",
                "id": 717,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "items": {
                "final": false,
                "name": "items",
                "id": 721,
                "since": 9,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "BookingItem",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "BookingItem": {
        "name": "BookingItem",
        "since": 9,
        "type": "AGGREGATED_TYPE",
        "id": 700,
        "rootId": "A3N5cwACvA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 701,
                "since": 9,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "currentCount": {
                "final": false,
                "name": "currentCount",
                "id": 703,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "currentInvoicedCount": {
                "final": false,
                "name": "currentInvoicedCount",
                "id": 706,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "featureType": {
                "final": false,
                "name": "featureType",
                "id": 702,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "maxCount": {
                "final": false,
                "name": "maxCount",
                "id": 704,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "price": {
                "final": false,
                "name": "price",
                "id": 707,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "priceType": {
                "final": false,
                "name": "priceType",
                "id": 708,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "totalInvoicedCount": {
                "final": false,
                "name": "totalInvoicedCount",
                "id": 705,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "BookingsRef": {
        "name": "BookingsRef",
        "since": 9,
        "type": "AGGREGATED_TYPE",
        "id": 722,
        "rootId": "A3N5cwAC0g",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 723,
                "since": 9,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "items": {
                "final": true,
                "name": "items",
                "id": 724,
                "since": 9,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "Booking",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "BootstrapFeature": {
        "name": "BootstrapFeature",
        "since": 24,
        "type": "AGGREGATED_TYPE",
        "id": 1249,
        "rootId": "A3N5cwAE4Q",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1250,
                "since": 24,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "feature": {
                "final": false,
                "name": "feature",
                "id": 1309,
                "since": 28,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "Braintree3ds2Request": {
        "name": "Braintree3ds2Request",
        "since": 66,
        "type": "AGGREGATED_TYPE",
        "id": 1828,
        "rootId": "A3N5cwAHJA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1829,
                "since": 66,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "bin": {
                "final": false,
                "name": "bin",
                "id": 1832,
                "since": 66,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "clientToken": {
                "final": false,
                "name": "clientToken",
                "id": 1830,
                "since": 66,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "nonce": {
                "final": false,
                "name": "nonce",
                "id": 1831,
                "since": 66,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "Braintree3ds2Response": {
        "name": "Braintree3ds2Response",
        "since": 66,
        "type": "AGGREGATED_TYPE",
        "id": 1833,
        "rootId": "A3N5cwAHKQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1834,
                "since": 66,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "clientToken": {
                "final": false,
                "name": "clientToken",
                "id": 1835,
                "since": 66,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "nonce": {
                "final": false,
                "name": "nonce",
                "id": 1836,
                "since": 66,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "BrandingDomainData": {
        "name": "BrandingDomainData",
        "since": 22,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1149,
        "rootId": "A3N5cwAEfQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1150,
                "since": 22,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "domain": {
                "final": true,
                "name": "domain",
                "id": 1151,
                "since": 22,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "sessionEncPemCertificateChain": {
                "final": true,
                "name": "sessionEncPemCertificateChain",
                "id": 1152,
                "since": 22,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "sessionEncPemPrivateKey": {
                "final": true,
                "name": "sessionEncPemPrivateKey",
                "id": 1153,
                "since": 22,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "systemAdminPubEncSessionKey": {
                "final": true,
                "name": "systemAdminPubEncSessionKey",
                "id": 1154,
                "since": 22,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "systemAdminPubKeyVersion": {
                "final": true,
                "name": "systemAdminPubKeyVersion",
                "id": 2282,
                "since": 96,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "systemAdminPublicProtocolVersion": {
                "final": true,
                "name": "systemAdminPublicProtocolVersion",
                "id": 2161,
                "since": 92,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "BrandingDomainDeleteData": {
        "name": "BrandingDomainDeleteData",
        "since": 22,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1155,
        "rootId": "A3N5cwAEgw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1156,
                "since": 22,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "domain": {
                "final": true,
                "name": "domain",
                "id": 1157,
                "since": 22,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "BrandingDomainGetReturn": {
        "name": "BrandingDomainGetReturn",
        "since": 56,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1723,
        "rootId": "A3N5cwAGuw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1724,
                "since": 56,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "certificateInfo": {
                "final": false,
                "name": "certificateInfo",
                "id": 1725,
                "since": 56,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "CertificateInfo",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "Bucket": {
        "name": "Bucket",
        "since": 1,
        "type": "AGGREGATED_TYPE",
        "id": 129,
        "rootId": "A3N5cwAAgQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 130,
                "since": 1,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "bucketPermissions": {
                "final": true,
                "name": "bucketPermissions",
                "id": 131,
                "since": 1,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "BucketPermission",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "BucketKey": {
        "name": "BucketKey",
        "since": 82,
        "type": "AGGREGATED_TYPE",
        "id": 2043,
        "rootId": "A3N5cwAH-w",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 2044,
                "since": 82,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "groupEncBucketKey": {
                "final": true,
                "name": "groupEncBucketKey",
                "id": 2046,
                "since": 82,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "protocolVersion": {
                "final": true,
                "name": "protocolVersion",
                "id": 2158,
                "since": 92,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "pubEncBucketKey": {
                "final": true,
                "name": "pubEncBucketKey",
                "id": 2045,
                "since": 82,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "recipientKeyVersion": {
                "final": true,
                "name": "recipientKeyVersion",
                "id": 2252,
                "since": 96,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "senderKeyVersion": {
                "final": true,
                "name": "senderKeyVersion",
                "id": 2253,
                "since": 96,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {
            "bucketEncSessionKeys": {
                "final": true,
                "name": "bucketEncSessionKeys",
                "id": 2048,
                "since": 82,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "InstanceSessionKey",
                "dependency": null
            },
            "keyGroup": {
                "final": true,
                "name": "keyGroup",
                "id": 2047,
                "since": 82,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "Group",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "BucketPermission": {
        "name": "BucketPermission",
        "since": 1,
        "type": "LIST_ELEMENT_TYPE",
        "id": 118,
        "rootId": "A3N5cwB2",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 122,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 120,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1000,
                "since": 17,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 121,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "ownerEncBucketKey": {
                "final": true,
                "name": "ownerEncBucketKey",
                "id": 1001,
                "since": 17,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "ownerKeyVersion": {
                "final": true,
                "name": "ownerKeyVersion",
                "id": 2248,
                "since": 96,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "protocolVersion": {
                "final": true,
                "name": "protocolVersion",
                "id": 2157,
                "since": 92,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "pubEncBucketKey": {
                "final": false,
                "name": "pubEncBucketKey",
                "id": 125,
                "since": 1,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "pubKeyVersion": {
                "final": false,
                "name": "pubKeyVersion",
                "id": 126,
                "since": 1,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "senderKeyVersion": {
                "final": true,
                "name": "senderKeyVersion",
                "id": 2250,
                "since": 96,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "symEncBucketKey": {
                "final": false,
                "name": "symEncBucketKey",
                "id": 124,
                "since": 1,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "symKeyVersion": {
                "final": true,
                "name": "symKeyVersion",
                "id": 2249,
                "since": 96,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "type": {
                "final": false,
                "name": "type",
                "id": 123,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "group": {
                "final": false,
                "name": "group",
                "id": 128,
                "since": 1,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Group",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "CalendarEventRef": {
        "name": "CalendarEventRef",
        "since": 48,
        "type": "AGGREGATED_TYPE",
        "id": 1532,
        "rootId": "A3N5cwAF_A",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1533,
                "since": 48,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "elementId": {
                "final": true,
                "name": "elementId",
                "id": 1534,
                "since": 48,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "listId": {
                "final": true,
                "name": "listId",
                "id": 1535,
                "since": 48,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "CertificateInfo": {
        "name": "CertificateInfo",
        "since": 44,
        "type": "AGGREGATED_TYPE",
        "id": 1500,
        "rootId": "A3N5cwAF3A",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1501,
                "since": 44,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "expiryDate": {
                "final": true,
                "name": "expiryDate",
                "id": 1502,
                "since": 44,
                "type": "Date",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "state": {
                "final": true,
                "name": "state",
                "id": 1503,
                "since": 44,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "type": {
                "final": true,
                "name": "type",
                "id": 1504,
                "since": 44,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "certificate": {
                "final": true,
                "name": "certificate",
                "id": 1505,
                "since": 44,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "SslCertificate",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "Challenge": {
        "name": "Challenge",
        "since": 23,
        "type": "AGGREGATED_TYPE",
        "id": 1187,
        "rootId": "A3N5cwAEow",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1188,
                "since": 23,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "type": {
                "final": true,
                "name": "type",
                "id": 1189,
                "since": 23,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "otp": {
                "final": true,
                "name": "otp",
                "id": 1247,
                "since": 24,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "OtpChallenge",
                "dependency": null
            },
            "u2f": {
                "final": true,
                "name": "u2f",
                "id": 1190,
                "since": 23,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "U2fChallenge",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "ChangeKdfPostIn": {
        "name": "ChangeKdfPostIn",
        "since": 95,
        "type": "DATA_TRANSFER_TYPE",
        "id": 2198,
        "rootId": "A3N5cwAIlg",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 2199,
                "since": 95,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "kdfVersion": {
                "final": false,
                "name": "kdfVersion",
                "id": 2204,
                "since": 95,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "oldVerifier": {
                "final": false,
                "name": "oldVerifier",
                "id": 2203,
                "since": 95,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "pwEncUserGroupKey": {
                "final": false,
                "name": "pwEncUserGroupKey",
                "id": 2202,
                "since": 95,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "salt": {
                "final": false,
                "name": "salt",
                "id": 2201,
                "since": 95,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "userGroupKeyVersion": {
                "final": false,
                "name": "userGroupKeyVersion",
                "id": 2410,
                "since": 102,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "verifier": {
                "final": false,
                "name": "verifier",
                "id": 2200,
                "since": 95,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "ChangePasswordPostIn": {
        "name": "ChangePasswordPostIn",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 534,
        "rootId": "A3N5cwACFg",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 535,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "code": {
                "final": false,
                "name": "code",
                "id": 539,
                "since": 1,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "kdfVersion": {
                "final": false,
                "name": "kdfVersion",
                "id": 2134,
                "since": 89,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "oldVerifier": {
                "final": false,
                "name": "oldVerifier",
                "id": 1240,
                "since": 23,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "pwEncUserGroupKey": {
                "final": false,
                "name": "pwEncUserGroupKey",
                "id": 538,
                "since": 1,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "recoverCodeVerifier": {
                "final": true,
                "name": "recoverCodeVerifier",
                "id": 1418,
                "since": 36,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "salt": {
                "final": false,
                "name": "salt",
                "id": 537,
                "since": 1,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "userGroupKeyVersion": {
                "final": false,
                "name": "userGroupKeyVersion",
                "id": 2408,
                "since": 102,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "verifier": {
                "final": false,
                "name": "verifier",
                "id": 536,
                "since": 1,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "Chat": {
        "name": "Chat",
        "since": 1,
        "type": "AGGREGATED_TYPE",
        "id": 457,
        "rootId": "A3N5cwAByQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 458,
                "since": 1,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "recipient": {
                "final": false,
                "name": "recipient",
                "id": 460,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "sender": {
                "final": false,
                "name": "sender",
                "id": 459,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "text": {
                "final": false,
                "name": "text",
                "id": 461,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "CloseSessionServicePost": {
        "name": "CloseSessionServicePost",
        "since": 50,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1595,
        "rootId": "A3N5cwAGOw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1596,
                "since": 50,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "accessToken": {
                "final": false,
                "name": "accessToken",
                "id": 1597,
                "since": 50,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "sessionId": {
                "final": false,
                "name": "sessionId",
                "id": 1598,
                "since": 50,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Session",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "CreateCustomerServerPropertiesData": {
        "name": "CreateCustomerServerPropertiesData",
        "since": 13,
        "type": "DATA_TRANSFER_TYPE",
        "id": 961,
        "rootId": "A3N5cwADwQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 962,
                "since": 13,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "adminGroupEncSessionKey": {
                "final": false,
                "name": "adminGroupEncSessionKey",
                "id": 963,
                "since": 13,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "adminGroupKeyVersion": {
                "final": false,
                "name": "adminGroupKeyVersion",
                "id": 2274,
                "since": 96,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "CreateCustomerServerPropertiesReturn": {
        "name": "CreateCustomerServerPropertiesReturn",
        "since": 13,
        "type": "DATA_TRANSFER_TYPE",
        "id": 964,
        "rootId": "A3N5cwADxA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 965,
                "since": 13,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "id": {
                "final": false,
                "name": "id",
                "id": 966,
                "since": 13,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "CustomerServerProperties",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "CreateSessionData": {
        "name": "CreateSessionData",
        "since": 23,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1211,
        "rootId": "A3N5cwAEuw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1212,
                "since": 23,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "accessKey": {
                "final": true,
                "name": "accessKey",
                "id": 1216,
                "since": 23,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "authToken": {
                "final": true,
                "name": "authToken",
                "id": 1217,
                "since": 23,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "authVerifier": {
                "final": true,
                "name": "authVerifier",
                "id": 1214,
                "since": 23,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "clientIdentifier": {
                "final": true,
                "name": "clientIdentifier",
                "id": 1215,
                "since": 23,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "mailAddress": {
                "final": true,
                "name": "mailAddress",
                "id": 1213,
                "since": 23,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "recoverCodeVerifier": {
                "final": true,
                "name": "recoverCodeVerifier",
                "id": 1417,
                "since": 36,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {
            "user": {
                "final": true,
                "name": "user",
                "id": 1218,
                "since": 23,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "User",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "CreateSessionReturn": {
        "name": "CreateSessionReturn",
        "since": 23,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1219,
        "rootId": "A3N5cwAEww",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1220,
                "since": 23,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "accessToken": {
                "final": true,
                "name": "accessToken",
                "id": 1221,
                "since": 23,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "challenges": {
                "final": true,
                "name": "challenges",
                "id": 1222,
                "since": 23,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "Challenge",
                "dependency": null
            },
            "user": {
                "final": true,
                "name": "user",
                "id": 1223,
                "since": 23,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "User",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "CreditCard": {
        "name": "CreditCard",
        "since": 30,
        "type": "AGGREGATED_TYPE",
        "id": 1313,
        "rootId": "A3N5cwAFIQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1314,
                "since": 30,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "cardHolderName": {
                "final": false,
                "name": "cardHolderName",
                "id": 1315,
                "since": 30,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "cvv": {
                "final": false,
                "name": "cvv",
                "id": 1317,
                "since": 30,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "expirationMonth": {
                "final": false,
                "name": "expirationMonth",
                "id": 1318,
                "since": 30,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "expirationYear": {
                "final": false,
                "name": "expirationYear",
                "id": 1319,
                "since": 30,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "number": {
                "final": false,
                "name": "number",
                "id": 1316,
                "since": 30,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "CustomDomainCheckGetIn": {
        "name": "CustomDomainCheckGetIn",
        "since": 49,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1586,
        "rootId": "A3N5cwAGMg",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1587,
                "since": 49,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "domain": {
                "final": false,
                "name": "domain",
                "id": 1588,
                "since": 49,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "customer": {
                "final": false,
                "name": "customer",
                "id": 2053,
                "since": 83,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "Customer",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "CustomDomainCheckGetOut": {
        "name": "CustomDomainCheckGetOut",
        "since": 49,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1589,
        "rootId": "A3N5cwAGNQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1590,
                "since": 49,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "checkResult": {
                "final": false,
                "name": "checkResult",
                "id": 1591,
                "since": 49,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "invalidRecords": {
                "final": false,
                "name": "invalidRecords",
                "id": 1593,
                "since": 49,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "DnsRecord",
                "dependency": null
            },
            "missingRecords": {
                "final": false,
                "name": "missingRecords",
                "id": 1592,
                "since": 49,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "DnsRecord",
                "dependency": null
            },
            "requiredRecords": {
                "final": false,
                "name": "requiredRecords",
                "id": 1758,
                "since": 62,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "DnsRecord",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "CustomDomainData": {
        "name": "CustomDomainData",
        "since": 9,
        "type": "DATA_TRANSFER_TYPE",
        "id": 735,
        "rootId": "A3N5cwAC3w",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 736,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "domain": {
                "final": false,
                "name": "domain",
                "id": 737,
                "since": 9,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "catchAllMailGroup": {
                "final": false,
                "name": "catchAllMailGroup",
                "id": 1045,
                "since": 18,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "Group",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "CustomDomainReturn": {
        "name": "CustomDomainReturn",
        "since": 9,
        "type": "DATA_TRANSFER_TYPE",
        "id": 731,
        "rootId": "A3N5cwAC2w",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 732,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "validationResult": {
                "final": false,
                "name": "validationResult",
                "id": 733,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "invalidDnsRecords": {
                "final": true,
                "name": "invalidDnsRecords",
                "id": 734,
                "since": 9,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "StringWrapper",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "Customer": {
        "name": "Customer",
        "since": 1,
        "type": "ELEMENT_TYPE",
        "id": 31,
        "rootId": "A3N5cwAf",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 35,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 33,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 991,
                "since": 17,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 34,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "approvalStatus": {
                "final": false,
                "name": "approvalStatus",
                "id": 926,
                "since": 12,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "businessUse": {
                "final": false,
                "name": "businessUse",
                "id": 1754,
                "since": 61,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "orderProcessingAgreementNeeded": {
                "final": false,
                "name": "orderProcessingAgreementNeeded",
                "id": 1347,
                "since": 31,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "type": {
                "final": true,
                "name": "type",
                "id": 36,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "adminGroup": {
                "final": true,
                "name": "adminGroup",
                "id": 37,
                "since": 1,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Group",
                "dependency": null
            },
            "adminGroups": {
                "final": true,
                "name": "adminGroups",
                "id": 39,
                "since": 1,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "GroupInfo",
                "dependency": null
            },
            "auditLog": {
                "final": true,
                "name": "auditLog",
                "id": 1161,
                "since": 22,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "AuditLogRef",
                "dependency": null
            },
            "customerGroup": {
                "final": true,
                "name": "customerGroup",
                "id": 38,
                "since": 1,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Group",
                "dependency": null
            },
            "customerGroups": {
                "final": true,
                "name": "customerGroups",
                "id": 40,
                "since": 1,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "GroupInfo",
                "dependency": null
            },
            "customerInfo": {
                "final": true,
                "name": "customerInfo",
                "id": 160,
                "since": 1,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "CustomerInfo",
                "dependency": null
            },
            "customizations": {
                "final": false,
                "name": "customizations",
                "id": 1256,
                "since": 25,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "Feature",
                "dependency": null
            },
            "orderProcessingAgreement": {
                "final": true,
                "name": "orderProcessingAgreement",
                "id": 1348,
                "since": 31,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "OrderProcessingAgreement",
                "dependency": null
            },
            "properties": {
                "final": true,
                "name": "properties",
                "id": 662,
                "since": 6,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "CustomerProperties",
                "dependency": null
            },
            "referralCode": {
                "final": false,
                "name": "referralCode",
                "id": 2061,
                "since": 84,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "ReferralCode",
                "dependency": null
            },
            "rejectedSenders": {
                "final": true,
                "name": "rejectedSenders",
                "id": 1750,
                "since": 60,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "RejectedSendersRef",
                "dependency": null
            },
            "serverProperties": {
                "final": true,
                "name": "serverProperties",
                "id": 960,
                "since": 13,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "CustomerServerProperties",
                "dependency": null
            },
            "teamGroups": {
                "final": true,
                "name": "teamGroups",
                "id": 42,
                "since": 1,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "GroupInfo",
                "dependency": null
            },
            "userAreaGroups": {
                "final": true,
                "name": "userAreaGroups",
                "id": 992,
                "since": 17,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "UserAreaGroups",
                "dependency": null
            },
            "userGroups": {
                "final": true,
                "name": "userGroups",
                "id": 41,
                "since": 1,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "GroupInfo",
                "dependency": null
            },
            "whitelabelChildren": {
                "final": true,
                "name": "whitelabelChildren",
                "id": 1277,
                "since": 26,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "WhitelabelChildrenRef",
                "dependency": null
            },
            "whitelabelParent": {
                "final": true,
                "name": "whitelabelParent",
                "id": 1276,
                "since": 26,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "WhitelabelParent",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "CustomerAccountTerminationPostIn": {
        "name": "CustomerAccountTerminationPostIn",
        "since": 79,
        "type": "DATA_TRANSFER_TYPE",
        "id": 2015,
        "rootId": "A3N5cwAH3w",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 2016,
                "since": 79,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "terminationDate": {
                "final": true,
                "name": "terminationDate",
                "id": 2017,
                "since": 79,
                "type": "Date",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {
            "surveyData": {
                "final": false,
                "name": "surveyData",
                "id": 2313,
                "since": 98,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "SurveyData",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "CustomerAccountTerminationPostOut": {
        "name": "CustomerAccountTerminationPostOut",
        "since": 79,
        "type": "DATA_TRANSFER_TYPE",
        "id": 2018,
        "rootId": "A3N5cwAH4g",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 2019,
                "since": 79,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "terminationRequest": {
                "final": false,
                "name": "terminationRequest",
                "id": 2020,
                "since": 79,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "CustomerAccountTerminationRequest",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "CustomerAccountTerminationRequest": {
        "name": "CustomerAccountTerminationRequest",
        "since": 79,
        "type": "LIST_ELEMENT_TYPE",
        "id": 2005,
        "rootId": "A3N5cwAH1Q",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 2009,
                "since": 79,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 2007,
                "since": 79,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 2010,
                "since": 79,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 2008,
                "since": 79,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "terminationDate": {
                "final": true,
                "name": "terminationDate",
                "id": 2012,
                "since": 79,
                "type": "Date",
                "cardinality": "One",
                "encrypted": false
            },
            "terminationRequestDate": {
                "final": true,
                "name": "terminationRequestDate",
                "id": 2013,
                "since": 79,
                "type": "Date",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "customer": {
                "final": false,
                "name": "customer",
                "id": 2011,
                "since": 79,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Customer",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "CustomerInfo": {
        "name": "CustomerInfo",
        "since": 1,
        "type": "LIST_ELEMENT_TYPE",
        "id": 148,
        "rootId": "A3N5cwAAlA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 152,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 150,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1011,
                "since": 17,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 151,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "activationTime": {
                "final": false,
                "name": "activationTime",
                "id": 157,
                "since": 1,
                "type": "Date",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "company": {
                "final": false,
                "name": "company",
                "id": 153,
                "since": 1,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "creationTime": {
                "final": true,
                "name": "creationTime",
                "id": 155,
                "since": 1,
                "type": "Date",
                "cardinality": "One",
                "encrypted": false
            },
            "deletionReason": {
                "final": true,
                "name": "deletionReason",
                "id": 640,
                "since": 5,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "deletionTime": {
                "final": true,
                "name": "deletionTime",
                "id": 639,
                "since": 5,
                "type": "Date",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "domain": {
                "final": true,
                "name": "domain",
                "id": 154,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "erased": {
                "final": true,
                "name": "erased",
                "id": 1381,
                "since": 32,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "includedEmailAliases": {
                "final": false,
                "name": "includedEmailAliases",
                "id": 1067,
                "since": 18,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "includedStorageCapacity": {
                "final": false,
                "name": "includedStorageCapacity",
                "id": 1068,
                "since": 18,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "perUserAliasCount": {
                "final": false,
                "name": "perUserAliasCount",
                "id": 2094,
                "since": 86,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "perUserStorageCapacity": {
                "final": false,
                "name": "perUserStorageCapacity",
                "id": 2093,
                "since": 86,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "plan": {
                "final": false,
                "name": "plan",
                "id": 2098,
                "since": 86,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "promotionEmailAliases": {
                "final": false,
                "name": "promotionEmailAliases",
                "id": 976,
                "since": 16,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "promotionStorageCapacity": {
                "final": false,
                "name": "promotionStorageCapacity",
                "id": 650,
                "since": 6,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "registrationMailAddress": {
                "final": true,
                "name": "registrationMailAddress",
                "id": 597,
                "since": 2,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "source": {
                "final": false,
                "name": "source",
                "id": 725,
                "since": 9,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "testEndTime": {
                "final": false,
                "name": "testEndTime",
                "id": 156,
                "since": 1,
                "type": "Date",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "usedSharedEmailAliases": {
                "final": true,
                "name": "usedSharedEmailAliases",
                "id": 977,
                "since": 16,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "accountingInfo": {
                "final": true,
                "name": "accountingInfo",
                "id": 159,
                "since": 1,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "AccountingInfo",
                "dependency": null
            },
            "bookings": {
                "final": true,
                "name": "bookings",
                "id": 727,
                "since": 9,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "BookingsRef",
                "dependency": null
            },
            "customPlan": {
                "final": true,
                "name": "customPlan",
                "id": 2114,
                "since": 87,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "PlanConfiguration",
                "dependency": null
            },
            "customer": {
                "final": true,
                "name": "customer",
                "id": 158,
                "since": 1,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Customer",
                "dependency": null
            },
            "domainInfos": {
                "final": true,
                "name": "domainInfos",
                "id": 726,
                "since": 9,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "DomainInfo",
                "dependency": null
            },
            "giftCards": {
                "final": true,
                "name": "giftCards",
                "id": 1794,
                "since": 65,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "GiftCardsRef",
                "dependency": null
            },
            "referredBy": {
                "final": false,
                "name": "referredBy",
                "id": 2072,
                "since": 84,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "Customer",
                "dependency": null
            },
            "supportInfo": {
                "final": true,
                "name": "supportInfo",
                "id": 2197,
                "since": 94,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "SupportInfo",
                "dependency": null
            },
            "takeoverCustomer": {
                "final": false,
                "name": "takeoverCustomer",
                "id": 1076,
                "since": 19,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "Customer",
                "dependency": null
            },
            "terminationRequest": {
                "final": false,
                "name": "terminationRequest",
                "id": 2014,
                "since": 79,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "CustomerAccountTerminationRequest",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "CustomerProperties": {
        "name": "CustomerProperties",
        "since": 6,
        "type": "ELEMENT_TYPE",
        "id": 656,
        "rootId": "A3N5cwACkA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 660,
                "since": 6,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 658,
                "since": 6,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 985,
                "since": 17,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 659,
                "since": 6,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "externalUserWelcomeMessage": {
                "final": false,
                "name": "externalUserWelcomeMessage",
                "id": 661,
                "since": 6,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "lastUpgradeReminder": {
                "final": false,
                "name": "lastUpgradeReminder",
                "id": 975,
                "since": 15,
                "type": "Date",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "usageDataOptedOut": {
                "final": false,
                "name": "usageDataOptedOut",
                "id": 2025,
                "since": 80,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "bigLogo": {
                "final": false,
                "name": "bigLogo",
                "id": 923,
                "since": 11,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "File",
                "dependency": null
            },
            "notificationMailTemplates": {
                "final": false,
                "name": "notificationMailTemplates",
                "id": 1522,
                "since": 45,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "NotificationMailTemplate",
                "dependency": null
            },
            "smallLogo": {
                "final": false,
                "name": "smallLogo",
                "id": 922,
                "since": 11,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "File",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "CustomerServerProperties": {
        "name": "CustomerServerProperties",
        "since": 13,
        "type": "ELEMENT_TYPE",
        "id": 954,
        "rootId": "A3N5cwADug",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 958,
                "since": 13,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 956,
                "since": 13,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 987,
                "since": 17,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 986,
                "since": 17,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 2224,
                "since": 96,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 957,
                "since": 13,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "requirePasswordUpdateAfterReset": {
                "final": false,
                "name": "requirePasswordUpdateAfterReset",
                "id": 1100,
                "since": 22,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "saveEncryptedIpAddressInSession": {
                "final": false,
                "name": "saveEncryptedIpAddressInSession",
                "id": 1406,
                "since": 35,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "whitelabelCode": {
                "final": false,
                "name": "whitelabelCode",
                "id": 1278,
                "since": 26,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "emailSenderList": {
                "final": false,
                "name": "emailSenderList",
                "id": 959,
                "since": 13,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "EmailSenderListElement",
                "dependency": null
            },
            "whitelabelRegistrationDomains": {
                "final": false,
                "name": "whitelabelRegistrationDomains",
                "id": 1279,
                "since": 26,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "StringWrapper",
                "dependency": null
            },
            "whitelistedDomains": {
                "final": true,
                "name": "whitelistedDomains",
                "id": 1099,
                "since": 21,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "DomainsRef",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "DateWrapper": {
        "name": "DateWrapper",
        "since": 85,
        "type": "AGGREGATED_TYPE",
        "id": 2073,
        "rootId": "A3N5cwAIGQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 2074,
                "since": 85,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "date": {
                "final": true,
                "name": "date",
                "id": 2075,
                "since": 85,
                "type": "Date",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "DebitServicePutData": {
        "name": "DebitServicePutData",
        "since": 18,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1041,
        "rootId": "A3N5cwAEEQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1042,
                "since": 18,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "invoice": {
                "final": false,
                "name": "invoice",
                "id": 1043,
                "since": 18,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "LegacyInvoice",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "DeleteCustomerData": {
        "name": "DeleteCustomerData",
        "since": 5,
        "type": "DATA_TRANSFER_TYPE",
        "id": 641,
        "rootId": "A3N5cwACgQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 642,
                "since": 5,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "authVerifier": {
                "final": false,
                "name": "authVerifier",
                "id": 1325,
                "since": 30,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "reason": {
                "final": false,
                "name": "reason",
                "id": 644,
                "since": 5,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "takeoverMailAddress": {
                "final": false,
                "name": "takeoverMailAddress",
                "id": 1077,
                "since": 19,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "undelete": {
                "final": false,
                "name": "undelete",
                "id": 643,
                "since": 5,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "customer": {
                "final": false,
                "name": "customer",
                "id": 645,
                "since": 5,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Customer",
                "dependency": null
            },
            "surveyData": {
                "final": false,
                "name": "surveyData",
                "id": 2312,
                "since": 98,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "SurveyData",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "DnsRecord": {
        "name": "DnsRecord",
        "since": 49,
        "type": "AGGREGATED_TYPE",
        "id": 1581,
        "rootId": "A3N5cwAGLQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1582,
                "since": 49,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "subdomain": {
                "final": false,
                "name": "subdomain",
                "id": 1583,
                "since": 49,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "type": {
                "final": false,
                "name": "type",
                "id": 1584,
                "since": 49,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "value": {
                "final": false,
                "name": "value",
                "id": 1585,
                "since": 49,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "DomainInfo": {
        "name": "DomainInfo",
        "since": 9,
        "type": "AGGREGATED_TYPE",
        "id": 696,
        "rootId": "A3N5cwACuA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 697,
                "since": 9,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "domain": {
                "final": true,
                "name": "domain",
                "id": 698,
                "since": 9,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "validatedMxRecord": {
                "final": true,
                "name": "validatedMxRecord",
                "id": 699,
                "since": 9,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "catchAllMailGroup": {
                "final": true,
                "name": "catchAllMailGroup",
                "id": 1044,
                "since": 18,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "Group",
                "dependency": null
            },
            "whitelabelConfig": {
                "final": true,
                "name": "whitelabelConfig",
                "id": 1136,
                "since": 22,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "WhitelabelConfig",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "DomainMailAddressAvailabilityData": {
        "name": "DomainMailAddressAvailabilityData",
        "since": 2,
        "type": "DATA_TRANSFER_TYPE",
        "id": 599,
        "rootId": "A3N5cwACVw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 600,
                "since": 2,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "mailAddress": {
                "final": false,
                "name": "mailAddress",
                "id": 601,
                "since": 2,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "DomainMailAddressAvailabilityReturn": {
        "name": "DomainMailAddressAvailabilityReturn",
        "since": 2,
        "type": "DATA_TRANSFER_TYPE",
        "id": 602,
        "rootId": "A3N5cwACWg",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 603,
                "since": 2,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "available": {
                "final": false,
                "name": "available",
                "id": 604,
                "since": 2,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "DomainsRef": {
        "name": "DomainsRef",
        "since": 21,
        "type": "AGGREGATED_TYPE",
        "id": 1096,
        "rootId": "A3N5cwAESA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1097,
                "since": 21,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "items": {
                "final": true,
                "name": "items",
                "id": 1098,
                "since": 21,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "Domain",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "EmailSenderListElement": {
        "name": "EmailSenderListElement",
        "since": 13,
        "type": "AGGREGATED_TYPE",
        "id": 949,
        "rootId": "A3N5cwADtQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 950,
                "since": 13,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "field": {
                "final": false,
                "name": "field",
                "id": 1705,
                "since": 54,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "hashedValue": {
                "final": false,
                "name": "hashedValue",
                "id": 951,
                "since": 13,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "type": {
                "final": false,
                "name": "type",
                "id": 953,
                "since": 13,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "value": {
                "final": false,
                "name": "value",
                "id": 952,
                "since": 13,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "EntityEventBatch": {
        "name": "EntityEventBatch",
        "since": 20,
        "type": "LIST_ELEMENT_TYPE",
        "id": 1079,
        "rootId": "A3N5cwAENw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1083,
                "since": 20,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1081,
                "since": 20,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1084,
                "since": 20,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 1082,
                "since": 20,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "events": {
                "final": true,
                "name": "events",
                "id": 1085,
                "since": 20,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "EntityUpdate",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "EntityUpdate": {
        "name": "EntityUpdate",
        "since": 1,
        "type": "AGGREGATED_TYPE",
        "id": 462,
        "rootId": "A3N5cwABzg",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 463,
                "since": 1,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "application": {
                "final": false,
                "name": "application",
                "id": 464,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "instanceId": {
                "final": false,
                "name": "instanceId",
                "id": 467,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "instanceListId": {
                "final": false,
                "name": "instanceListId",
                "id": 466,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "operation": {
                "final": false,
                "name": "operation",
                "id": 624,
                "since": 4,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "type": {
                "final": false,
                "name": "type",
                "id": 465,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "Exception": {
        "name": "Exception",
        "since": 1,
        "type": "AGGREGATED_TYPE",
        "id": 468,
        "rootId": "A3N5cwAB1A",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 469,
                "since": 1,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "msg": {
                "final": false,
                "name": "msg",
                "id": 471,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "type": {
                "final": false,
                "name": "type",
                "id": 470,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "ExternalPropertiesReturn": {
        "name": "ExternalPropertiesReturn",
        "since": 6,
        "type": "DATA_TRANSFER_TYPE",
        "id": 663,
        "rootId": "A3N5cwAClw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 664,
                "since": 6,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "accountType": {
                "final": false,
                "name": "accountType",
                "id": 666,
                "since": 6,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "message": {
                "final": false,
                "name": "message",
                "id": 665,
                "since": 6,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "bigLogo": {
                "final": false,
                "name": "bigLogo",
                "id": 925,
                "since": 11,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "File",
                "dependency": null
            },
            "smallLogo": {
                "final": false,
                "name": "smallLogo",
                "id": 924,
                "since": 11,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "File",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "ExternalUserReference": {
        "name": "ExternalUserReference",
        "since": 1,
        "type": "LIST_ELEMENT_TYPE",
        "id": 103,
        "rootId": "A3N5cwBn",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 107,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 105,
                "since": 1,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 997,
                "since": 17,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 106,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "user": {
                "final": true,
                "name": "user",
                "id": 108,
                "since": 1,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "User",
                "dependency": null
            },
            "userGroup": {
                "final": true,
                "name": "userGroup",
                "id": 109,
                "since": 1,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Group",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "Feature": {
        "name": "Feature",
        "since": 25,
        "type": "AGGREGATED_TYPE",
        "id": 1253,
        "rootId": "A3N5cwAE5Q",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1254,
                "since": 25,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "feature": {
                "final": false,
                "name": "feature",
                "id": 1255,
                "since": 25,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "File": {
        "name": "File",
        "since": 11,
        "type": "AGGREGATED_TYPE",
        "id": 917,
        "rootId": "A3N5cwADlQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 918,
                "since": 11,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "data": {
                "final": false,
                "name": "data",
                "id": 921,
                "since": 11,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "mimeType": {
                "final": false,
                "name": "mimeType",
                "id": 920,
                "since": 11,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "name": {
                "final": false,
                "name": "name",
                "id": 919,
                "since": 11,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "GeneratedIdWrapper": {
        "name": "GeneratedIdWrapper",
        "since": 32,
        "type": "AGGREGATED_TYPE",
        "id": 1349,
        "rootId": "A3N5cwAFRQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1350,
                "since": 32,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "value": {
                "final": false,
                "name": "value",
                "id": 1351,
                "since": 32,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "GiftCard": {
        "name": "GiftCard",
        "since": 65,
        "type": "LIST_ELEMENT_TYPE",
        "id": 1769,
        "rootId": "A3N5cwAG6Q",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1773,
                "since": 65,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1771,
                "since": 65,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 1775,
                "since": 65,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1774,
                "since": 65,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 2238,
                "since": 96,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 1772,
                "since": 65,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "message": {
                "final": false,
                "name": "message",
                "id": 1778,
                "since": 65,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "migrated": {
                "final": false,
                "name": "migrated",
                "id": 1993,
                "since": 75,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "orderDate": {
                "final": true,
                "name": "orderDate",
                "id": 1779,
                "since": 65,
                "type": "Date",
                "cardinality": "One",
                "encrypted": false
            },
            "status": {
                "final": true,
                "name": "status",
                "id": 1776,
                "since": 65,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "value": {
                "final": true,
                "name": "value",
                "id": 1777,
                "since": 65,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "GiftCardCreateData": {
        "name": "GiftCardCreateData",
        "since": 65,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1803,
        "rootId": "A3N5cwAHCw",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1804,
                "since": 65,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "keyHash": {
                "final": false,
                "name": "keyHash",
                "id": 1809,
                "since": 65,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "message": {
                "final": false,
                "name": "message",
                "id": 1805,
                "since": 65,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "ownerEncSessionKey": {
                "final": false,
                "name": "ownerEncSessionKey",
                "id": 1806,
                "since": 65,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "ownerKeyVersion": {
                "final": false,
                "name": "ownerKeyVersion",
                "id": 2275,
                "since": 96,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "value": {
                "final": false,
                "name": "value",
                "id": 1807,
                "since": 65,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "GiftCardCreateReturn": {
        "name": "GiftCardCreateReturn",
        "since": 65,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1813,
        "rootId": "A3N5cwAHFQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1814,
                "since": 65,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "giftCard": {
                "final": true,
                "name": "giftCard",
                "id": 1815,
                "since": 65,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "GiftCard",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "GiftCardDeleteData": {
        "name": "GiftCardDeleteData",
        "since": 65,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1810,
        "rootId": "A3N5cwAHEg",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1811,
                "since": 65,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "giftCard": {
                "final": true,
                "name": "giftCard",
                "id": 1812,
                "since": 65,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "GiftCard",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "GiftCardGetReturn": {
        "name": "GiftCardGetReturn",
        "since": 65,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1798,
        "rootId": "A3N5cwAHBg",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1799,
                "since": 65,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "maxPerPeriod": {
                "final": false,
                "name": "maxPerPeriod",
                "id": 1800,
                "since": 65,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "period": {
                "final": false,
                "name": "period",
                "id": 1801,
                "since": 65,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "options": {
                "final": false,
                "name": "options",
                "id": 1802,
                "since": 65,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "GiftCardOption",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "GiftCardOption": {
        "name": "GiftCardOption",
        "since": 65,
        "type": "AGGREGATED_TYPE",
        "id": 1795,
        "rootId": "A3N5cwAHAw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1796,
                "since": 65,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "value": {
                "final": false,
                "name": "value",
                "id": 1797,
                "since": 65,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "GiftCardRedeemData": {
        "name": "GiftCardRedeemData",
        "since": 65,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1817,
        "rootId": "A3N5cwAHGQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1818,
                "since": 65,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "countryCode": {
                "final": false,
                "name": "countryCode",
                "id": 1995,
                "since": 76,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "keyHash": {
                "final": false,
                "name": "keyHash",
                "id": 1820,
                "since": 65,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "giftCardInfo": {
                "final": true,
                "name": "giftCardInfo",
                "id": 1819,
                "since": 65,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "GiftCardInfo",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "GiftCardRedeemGetReturn": {
        "name": "GiftCardRedeemGetReturn",
        "since": 65,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1821,
        "rootId": "A3N5cwAHHQ",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1822,
                "since": 65,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "message": {
                "final": true,
                "name": "message",
                "id": 1824,
                "since": 65,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "value": {
                "final": true,
                "name": "value",
                "id": 1825,
                "since": 65,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "giftCard": {
                "final": true,
                "name": "giftCard",
                "id": 1823,
                "since": 65,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "GiftCard",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "GiftCardsRef": {
        "name": "GiftCardsRef",
        "since": 65,
        "type": "AGGREGATED_TYPE",
        "id": 1791,
        "rootId": "A3N5cwAG_w",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1792,
                "since": 65,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "items": {
                "final": true,
                "name": "items",
                "id": 1793,
                "since": 65,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "GiftCard",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "Group": {
        "name": "Group",
        "since": 1,
        "type": "ELEMENT_TYPE",
        "id": 5,
        "rootId": "A3N5cwAF",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 9,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 7,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 981,
                "since": 17,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 8,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "adminGroupEncGKey": {
                "final": true,
                "name": "adminGroupEncGKey",
                "id": 11,
                "since": 1,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "adminGroupKeyVersion": {
                "final": true,
                "name": "adminGroupKeyVersion",
                "id": 2270,
                "since": 96,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "enabled": {
                "final": true,
                "name": "enabled",
                "id": 12,
                "since": 1,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "external": {
                "final": true,
                "name": "external",
                "id": 982,
                "since": 17,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "groupKeyVersion": {
                "final": false,
                "name": "groupKeyVersion",
                "id": 2271,
                "since": 96,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "type": {
                "final": true,
                "name": "type",
                "id": 10,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "admin": {
                "final": true,
                "name": "admin",
                "id": 224,
                "since": 1,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "Group",
                "dependency": null
            },
            "administratedGroups": {
                "final": true,
                "name": "administratedGroups",
                "id": 1306,
                "since": 27,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "AdministratedGroupsRef",
                "dependency": null
            },
            "archives": {
                "final": true,
                "name": "archives",
                "id": 1881,
                "since": 69,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "ArchiveType",
                "dependency": null
            },
            "currentKeys": {
                "final": true,
                "name": "currentKeys",
                "id": 13,
                "since": 1,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "KeyPair",
                "dependency": null
            },
            "customer": {
                "final": true,
                "name": "customer",
                "id": 226,
                "since": 1,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "Customer",
                "dependency": null
            },
            "formerGroupKeys": {
                "final": false,
                "name": "formerGroupKeys",
                "id": 2273,
                "since": 96,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "GroupKeysRef",
                "dependency": null
            },
            "groupInfo": {
                "final": true,
                "name": "groupInfo",
                "id": 227,
                "since": 1,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "GroupInfo",
                "dependency": null
            },
            "invitations": {
                "final": true,
                "name": "invitations",
                "id": 228,
                "since": 1,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "SentGroupInvitation",
                "dependency": null
            },
            "members": {
                "final": true,
                "name": "members",
                "id": 229,
                "since": 1,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "GroupMember",
                "dependency": null
            },
            "pubAdminGroupEncGKey": {
                "final": true,
                "name": "pubAdminGroupEncGKey",
                "id": 2475,
                "since": 111,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "PubEncKeyData",
                "dependency": null
            },
            "storageCounter": {
                "final": true,
                "name": "storageCounter",
                "id": 2092,
                "since": 86,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "StorageCounter",
                "dependency": null
            },
            "user": {
                "final": true,
                "name": "user",
                "id": 225,
                "since": 1,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "User",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "GroupInfo": {
        "name": "GroupInfo",
        "since": 1,
        "type": "LIST_ELEMENT_TYPE",
        "id": 14,
        "rootId": "A3N5cwAO",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 18,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 16,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_listEncSessionKey": {
                "final": false,
                "name": "_listEncSessionKey",
                "id": 19,
                "since": 1,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 984,
                "since": 17,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 983,
                "since": 17,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 2225,
                "since": 96,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 17,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "created": {
                "final": true,
                "name": "created",
                "id": 23,
                "since": 1,
                "type": "Date",
                "cardinality": "One",
                "encrypted": false
            },
            "deleted": {
                "final": true,
                "name": "deleted",
                "id": 24,
                "since": 1,
                "type": "Date",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "groupType": {
                "final": true,
                "name": "groupType",
                "id": 1286,
                "since": 27,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "mailAddress": {
                "final": true,
                "name": "mailAddress",
                "id": 22,
                "since": 1,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "name": {
                "final": false,
                "name": "name",
                "id": 21,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {
            "group": {
                "final": true,
                "name": "group",
                "id": 20,
                "since": 1,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Group",
                "dependency": null
            },
            "localAdmin": {
                "final": true,
                "name": "localAdmin",
                "id": 1287,
                "since": 27,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "Group",
                "dependency": null
            },
            "mailAddressAliases": {
                "final": true,
                "name": "mailAddressAliases",
                "id": 687,
                "since": 8,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "MailAddressAlias",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "GroupKey": {
        "name": "GroupKey",
        "since": 96,
        "type": "LIST_ELEMENT_TYPE",
        "id": 2255,
        "rootId": "A3N5cwAIzw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 2259,
                "since": 96,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 2257,
                "since": 96,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 2260,
                "since": 96,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 2258,
                "since": 96,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "adminGroupEncGKey": {
                "final": false,
                "name": "adminGroupEncGKey",
                "id": 2263,
                "since": 96,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "adminGroupKeyVersion": {
                "final": false,
                "name": "adminGroupKeyVersion",
                "id": 2265,
                "since": 96,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "ownerEncGKey": {
                "final": false,
                "name": "ownerEncGKey",
                "id": 2261,
                "since": 96,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "ownerKeyVersion": {
                "final": false,
                "name": "ownerKeyVersion",
                "id": 2262,
                "since": 96,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "keyPair": {
                "final": false,
                "name": "keyPair",
                "id": 2266,
                "since": 96,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "KeyPair",
                "dependency": null
            },
            "pubAdminGroupEncGKey": {
                "final": true,
                "name": "pubAdminGroupEncGKey",
                "id": 2476,
                "since": 111,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "PubEncKeyData",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "GroupKeyRotationData": {
        "name": "GroupKeyRotationData",
        "since": 101,
        "type": "AGGREGATED_TYPE",
        "id": 2328,
        "rootId": "A3N5cwAJGA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 2329,
                "since": 101,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "adminGroupEncGroupKey": {
                "final": false,
                "name": "adminGroupEncGroupKey",
                "id": 2334,
                "since": 101,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "adminGroupKeyVersion": {
                "final": false,
                "name": "adminGroupKeyVersion",
                "id": 2335,
                "since": 101,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "groupEncPreviousGroupKey": {
                "final": false,
                "name": "groupEncPreviousGroupKey",
                "id": 2333,
                "since": 101,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "groupKeyVersion": {
                "final": false,
                "name": "groupKeyVersion",
                "id": 2332,
                "since": 101,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "group": {
                "final": false,
                "name": "group",
                "id": 2336,
                "since": 101,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Group",
                "dependency": null
            },
            "groupKeyUpdatesForMembers": {
                "final": true,
                "name": "groupKeyUpdatesForMembers",
                "id": 2397,
                "since": 102,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "GroupKeyUpdateData",
                "dependency": null
            },
            "groupMembershipUpdateData": {
                "final": true,
                "name": "groupMembershipUpdateData",
                "id": 2432,
                "since": 106,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "GroupMembershipUpdateData",
                "dependency": null
            },
            "keyPair": {
                "final": false,
                "name": "keyPair",
                "id": 2337,
                "since": 101,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "KeyPair",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "GroupKeyRotationInfoGetOut": {
        "name": "GroupKeyRotationInfoGetOut",
        "since": 101,
        "type": "DATA_TRANSFER_TYPE",
        "id": 2342,
        "rootId": "A3N5cwAJJg",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 2343,
                "since": 101,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "userOrAdminGroupKeyRotationScheduled": {
                "final": false,
                "name": "userOrAdminGroupKeyRotationScheduled",
                "id": 2344,
                "since": 101,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "groupKeyUpdates": {
                "final": false,
                "name": "groupKeyUpdates",
                "id": 2407,
                "since": 102,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "Any",
                "refType": "GroupKeyUpdate",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "GroupKeyRotationPostIn": {
        "name": "GroupKeyRotationPostIn",
        "since": 101,
        "type": "DATA_TRANSFER_TYPE",
        "id": 2338,
        "rootId": "A3N5cwAJIg",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 2339,
                "since": 101,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "groupKeyUpdates": {
                "final": false,
                "name": "groupKeyUpdates",
                "id": 2340,
                "since": 101,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "GroupKeyRotationData",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "GroupKeyUpdate": {
        "name": "GroupKeyUpdate",
        "since": 102,
        "type": "LIST_ELEMENT_TYPE",
        "id": 2369,
        "rootId": "A3N5cwAJQQ",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 2373,
                "since": 102,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 2371,
                "since": 102,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 2375,
                "since": 102,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 2374,
                "since": 102,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 2376,
                "since": 102,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 2372,
                "since": 102,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "groupKey": {
                "final": true,
                "name": "groupKey",
                "id": 2377,
                "since": 102,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": true
            },
            "groupKeyVersion": {
                "final": true,
                "name": "groupKeyVersion",
                "id": 2378,
                "since": 102,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "bucketKey": {
                "final": true,
                "name": "bucketKey",
                "id": 2379,
                "since": 102,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "BucketKey",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "GroupKeyUpdateData": {
        "name": "GroupKeyUpdateData",
        "since": 102,
        "type": "AGGREGATED_TYPE",
        "id": 2391,
        "rootId": "A3N5cwAJVw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 2392,
                "since": 102,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "bucketKeyEncSessionKey": {
                "final": false,
                "name": "bucketKeyEncSessionKey",
                "id": 2395,
                "since": 102,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "sessionKeyEncGroupKey": {
                "final": false,
                "name": "sessionKeyEncGroupKey",
                "id": 2394,
                "since": 102,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "sessionKeyEncGroupKeyVersion": {
                "final": false,
                "name": "sessionKeyEncGroupKeyVersion",
                "id": 2393,
                "since": 102,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "pubEncBucketKeyData": {
                "final": true,
                "name": "pubEncBucketKeyData",
                "id": 2396,
                "since": 102,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "PubEncKeyData",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "GroupKeyUpdatesRef": {
        "name": "GroupKeyUpdatesRef",
        "since": 102,
        "type": "AGGREGATED_TYPE",
        "id": 2380,
        "rootId": "A3N5cwAJTA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 2381,
                "since": 102,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "list": {
                "final": true,
                "name": "list",
                "id": 2382,
                "since": 102,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "GroupKeyUpdate",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "GroupKeysRef": {
        "name": "GroupKeysRef",
        "since": 96,
        "type": "AGGREGATED_TYPE",
        "id": 2267,
        "rootId": "A3N5cwAI2w",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 2268,
                "since": 96,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "list": {
                "final": true,
                "name": "list",
                "id": 2269,
                "since": 96,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "GroupKey",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "GroupMember": {
        "name": "GroupMember",
        "since": 1,
        "type": "LIST_ELEMENT_TYPE",
        "id": 216,
        "rootId": "A3N5cwAA2A",
        "versioned": false,
        "encrypted": false,
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
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1021,
                "since": 17,
                "type": "GeneratedId",
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
            "capability": {
                "final": true,
                "name": "capability",
                "id": 1625,
                "since": 52,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {
            "group": {
                "final": true,
                "name": "group",
                "id": 222,
                "since": 1,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Group",
                "dependency": null
            },
            "user": {
                "final": true,
                "name": "user",
                "id": 223,
                "since": 1,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "User",
                "dependency": null
            },
            "userGroupInfo": {
                "final": true,
                "name": "userGroupInfo",
                "id": 221,
                "since": 1,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "GroupInfo",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "GroupMembership": {
        "name": "GroupMembership",
        "since": 1,
        "type": "AGGREGATED_TYPE",
        "id": 25,
        "rootId": "A3N5cwAZ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 26,
                "since": 1,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "admin": {
                "final": true,
                "name": "admin",
                "id": 28,
                "since": 1,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "capability": {
                "final": true,
                "name": "capability",
                "id": 1626,
                "since": 52,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "groupKeyVersion": {
                "final": true,
                "name": "groupKeyVersion",
                "id": 2246,
                "since": 96,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "groupType": {
                "final": true,
                "name": "groupType",
                "id": 1030,
                "since": 17,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "symEncGKey": {
                "final": true,
                "name": "symEncGKey",
                "id": 27,
                "since": 1,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "symKeyVersion": {
                "final": true,
                "name": "symKeyVersion",
                "id": 2247,
                "since": 96,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "group": {
                "final": true,
                "name": "group",
                "id": 29,
                "since": 1,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Group",
                "dependency": null
            },
            "groupInfo": {
                "final": true,
                "name": "groupInfo",
                "id": 30,
                "since": 1,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "GroupInfo",
                "dependency": null
            },
            "groupMember": {
                "final": true,
                "name": "groupMember",
                "id": 230,
                "since": 1,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "GroupMember",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "GroupMembershipKeyData": {
        "name": "GroupMembershipKeyData",
        "since": 102,
        "type": "AGGREGATED_TYPE",
        "id": 2398,
        "rootId": "A3N5cwAJXg",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 2399,
                "since": 102,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "groupKeyVersion": {
                "final": false,
                "name": "groupKeyVersion",
                "id": 2401,
                "since": 102,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "symEncGKey": {
                "final": false,
                "name": "symEncGKey",
                "id": 2403,
                "since": 102,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "symKeyVersion": {
                "final": false,
                "name": "symKeyVersion",
                "id": 2402,
                "since": 102,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "group": {
                "final": false,
                "name": "group",
                "id": 2400,
                "since": 102,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Group",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "GroupMembershipUpdateData": {
        "name": "GroupMembershipUpdateData",
        "since": 106,
        "type": "AGGREGATED_TYPE",
        "id": 2427,
        "rootId": "A3N5cwAJew",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 2428,
                "since": 106,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "userEncGroupKey": {
                "final": false,
                "name": "userEncGroupKey",
                "id": 2430,
                "since": 106,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "userKeyVersion": {
                "final": false,
                "name": "userKeyVersion",
                "id": 2431,
                "since": 106,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "userId": {
                "final": false,
                "name": "userId",
                "id": 2429,
                "since": 106,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "User",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "GroupRoot": {
        "name": "GroupRoot",
        "since": 1,
        "type": "ELEMENT_TYPE",
        "id": 110,
        "rootId": "A3N5cwBu",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 114,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 112,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 998,
                "since": 17,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 113,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "externalGroupInfos": {
                "final": true,
                "name": "externalGroupInfos",
                "id": 116,
                "since": 1,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "GroupInfo",
                "dependency": null
            },
            "externalUserAreaGroupInfos": {
                "final": true,
                "name": "externalUserAreaGroupInfos",
                "id": 999,
                "since": 17,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "UserAreaGroups",
                "dependency": null
            },
            "externalUserReferences": {
                "final": true,
                "name": "externalUserReferences",
                "id": 117,
                "since": 1,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "ExternalUserReference",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "IdTupleWrapper": {
        "name": "IdTupleWrapper",
        "since": 99,
        "type": "AGGREGATED_TYPE",
        "id": 2315,
        "rootId": "A3N5cwAJCw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 2316,
                "since": 99,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "listElementId": {
                "final": true,
                "name": "listElementId",
                "id": 2318,
                "since": 99,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "listId": {
                "final": true,
                "name": "listId",
                "id": 2317,
                "since": 99,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "InstanceSessionKey": {
        "name": "InstanceSessionKey",
        "since": 82,
        "type": "AGGREGATED_TYPE",
        "id": 2037,
        "rootId": "A3N5cwAH9Q",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 2038,
                "since": 82,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "encryptionAuthStatus": {
                "final": true,
                "name": "encryptionAuthStatus",
                "id": 2159,
                "since": 92,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "instanceId": {
                "final": true,
                "name": "instanceId",
                "id": 2041,
                "since": 82,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "instanceList": {
                "final": true,
                "name": "instanceList",
                "id": 2040,
                "since": 82,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "symEncSessionKey": {
                "final": true,
                "name": "symEncSessionKey",
                "id": 2042,
                "since": 82,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "symKeyVersion": {
                "final": true,
                "name": "symKeyVersion",
                "id": 2254,
                "since": 96,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "typeInfo": {
                "final": false,
                "name": "typeInfo",
                "id": 2039,
                "since": 82,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "TypeInfo",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "Invoice": {
        "name": "Invoice",
        "since": 52,
        "type": "ELEMENT_TYPE",
        "id": 1650,
        "rootId": "A3N5cwAGcg",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1654,
                "since": 52,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1652,
                "since": 52,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 1656,
                "since": 52,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1655,
                "since": 52,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 2235,
                "since": 96,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 1653,
                "since": 52,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "address": {
                "final": false,
                "name": "address",
                "id": 1661,
                "since": 52,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "adminUser": {
                "final": true,
                "name": "adminUser",
                "id": 1668,
                "since": 52,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "business": {
                "final": true,
                "name": "business",
                "id": 1662,
                "since": 52,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": true
            },
            "country": {
                "final": true,
                "name": "country",
                "id": 1660,
                "since": 52,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "date": {
                "final": true,
                "name": "date",
                "id": 1658,
                "since": 52,
                "type": "Date",
                "cardinality": "One",
                "encrypted": true
            },
            "grandTotal": {
                "final": true,
                "name": "grandTotal",
                "id": 1667,
                "since": 52,
                "type": "Number",
                "cardinality": "One",
                "encrypted": true
            },
            "paymentMethod": {
                "final": false,
                "name": "paymentMethod",
                "id": 1659,
                "since": 52,
                "type": "Number",
                "cardinality": "One",
                "encrypted": true
            },
            "reason": {
                "final": false,
                "name": "reason",
                "id": 1669,
                "since": 52,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "subTotal": {
                "final": true,
                "name": "subTotal",
                "id": 1666,
                "since": 52,
                "type": "Number",
                "cardinality": "One",
                "encrypted": true
            },
            "type": {
                "final": true,
                "name": "type",
                "id": 1657,
                "since": 52,
                "type": "Number",
                "cardinality": "One",
                "encrypted": true
            },
            "vat": {
                "final": true,
                "name": "vat",
                "id": 1665,
                "since": 52,
                "type": "Number",
                "cardinality": "One",
                "encrypted": true
            },
            "vatIdNumber": {
                "final": true,
                "name": "vatIdNumber",
                "id": 1663,
                "since": 52,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "vatRate": {
                "final": true,
                "name": "vatRate",
                "id": 1664,
                "since": 52,
                "type": "Number",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {
            "bookings": {
                "final": true,
                "name": "bookings",
                "id": 1672,
                "since": 52,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "Any",
                "refType": "Booking",
                "dependency": null
            },
            "customer": {
                "final": true,
                "name": "customer",
                "id": 1671,
                "since": 52,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Customer",
                "dependency": null
            },
            "items": {
                "final": true,
                "name": "items",
                "id": 1670,
                "since": 52,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "InvoiceItem",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "InvoiceDataGetIn": {
        "name": "InvoiceDataGetIn",
        "since": 93,
        "type": "DATA_TRANSFER_TYPE",
        "id": 2185,
        "rootId": "A3N5cwAIiQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 2186,
                "since": 93,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "invoiceNumber": {
                "final": false,
                "name": "invoiceNumber",
                "id": 2187,
                "since": 93,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "InvoiceDataGetOut": {
        "name": "InvoiceDataGetOut",
        "since": 93,
        "type": "DATA_TRANSFER_TYPE",
        "id": 2170,
        "rootId": "A3N5cwAIeg",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 2171,
                "since": 93,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "address": {
                "final": false,
                "name": "address",
                "id": 2177,
                "since": 93,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "country": {
                "final": true,
                "name": "country",
                "id": 2176,
                "since": 93,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "date": {
                "final": true,
                "name": "date",
                "id": 2174,
                "since": 93,
                "type": "Date",
                "cardinality": "One",
                "encrypted": false
            },
            "grandTotal": {
                "final": true,
                "name": "grandTotal",
                "id": 2182,
                "since": 93,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "invoiceId": {
                "final": true,
                "name": "invoiceId",
                "id": 2172,
                "since": 93,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "invoiceType": {
                "final": true,
                "name": "invoiceType",
                "id": 2173,
                "since": 93,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "paymentMethod": {
                "final": false,
                "name": "paymentMethod",
                "id": 2175,
                "since": 93,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "subTotal": {
                "final": true,
                "name": "subTotal",
                "id": 2181,
                "since": 93,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "vat": {
                "final": true,
                "name": "vat",
                "id": 2180,
                "since": 93,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "vatIdNumber": {
                "final": true,
                "name": "vatIdNumber",
                "id": 2178,
                "since": 93,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "vatRate": {
                "final": true,
                "name": "vatRate",
                "id": 2179,
                "since": 93,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "vatType": {
                "final": true,
                "name": "vatType",
                "id": 2183,
                "since": 93,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "items": {
                "final": true,
                "name": "items",
                "id": 2184,
                "since": 93,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "InvoiceDataItem",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "InvoiceDataItem": {
        "name": "InvoiceDataItem",
        "since": 93,
        "type": "AGGREGATED_TYPE",
        "id": 2162,
        "rootId": "A3N5cwAIcg",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 2163,
                "since": 93,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "amount": {
                "final": true,
                "name": "amount",
                "id": 2164,
                "since": 93,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "endDate": {
                "final": true,
                "name": "endDate",
                "id": 2169,
                "since": 93,
                "type": "Date",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "itemType": {
                "final": true,
                "name": "itemType",
                "id": 2165,
                "since": 93,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "singlePrice": {
                "final": true,
                "name": "singlePrice",
                "id": 2166,
                "since": 93,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "startDate": {
                "final": true,
                "name": "startDate",
                "id": 2168,
                "since": 93,
                "type": "Date",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "totalPrice": {
                "final": true,
                "name": "totalPrice",
                "id": 2167,
                "since": 93,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "InvoiceInfo": {
        "name": "InvoiceInfo",
        "since": 9,
        "type": "ELEMENT_TYPE",
        "id": 752,
        "rootId": "A3N5cwAC8A",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 756,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 754,
                "since": 9,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1008,
                "since": 17,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 755,
                "since": 9,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "discountPercentage": {
                "final": false,
                "name": "discountPercentage",
                "id": 2126,
                "since": 88,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "extendedPeriodOfPaymentDays": {
                "final": false,
                "name": "extendedPeriodOfPaymentDays",
                "id": 1638,
                "since": 52,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "persistentPaymentPeriodExtension": {
                "final": false,
                "name": "persistentPaymentPeriodExtension",
                "id": 1639,
                "since": 52,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "publishInvoices": {
                "final": false,
                "name": "publishInvoices",
                "id": 759,
                "since": 9,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "reminderState": {
                "final": false,
                "name": "reminderState",
                "id": 1637,
                "since": 52,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "specialPriceBrandingPerUser": {
                "final": false,
                "name": "specialPriceBrandingPerUser",
                "id": 1282,
                "since": 26,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "specialPriceBusinessPerUser": {
                "final": false,
                "name": "specialPriceBusinessPerUser",
                "id": 1864,
                "since": 68,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "specialPriceContactFormSingle": {
                "final": false,
                "name": "specialPriceContactFormSingle",
                "id": 1284,
                "since": 26,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "specialPriceSharedGroupSingle": {
                "final": false,
                "name": "specialPriceSharedGroupSingle",
                "id": 1283,
                "since": 26,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "specialPriceSharingPerUser": {
                "final": false,
                "name": "specialPriceSharingPerUser",
                "id": 1627,
                "since": 52,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "specialPriceUserSingle": {
                "final": false,
                "name": "specialPriceUserSingle",
                "id": 758,
                "since": 9,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "specialPriceUserTotal": {
                "final": false,
                "name": "specialPriceUserTotal",
                "id": 757,
                "since": 9,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {
            "invoices": {
                "final": true,
                "name": "invoices",
                "id": 760,
                "since": 9,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "LegacyInvoice",
                "dependency": null
            },
            "paymentErrorInfo": {
                "final": true,
                "name": "paymentErrorInfo",
                "id": 1640,
                "since": 52,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "PaymentErrorInfo",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "InvoiceItem": {
        "name": "InvoiceItem",
        "since": 52,
        "type": "AGGREGATED_TYPE",
        "id": 1641,
        "rootId": "A3N5cwAGaQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1642,
                "since": 52,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "amount": {
                "final": true,
                "name": "amount",
                "id": 1643,
                "since": 52,
                "type": "Number",
                "cardinality": "One",
                "encrypted": true
            },
            "endDate": {
                "final": true,
                "name": "endDate",
                "id": 1648,
                "since": 52,
                "type": "Date",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "singlePrice": {
                "final": true,
                "name": "singlePrice",
                "id": 1645,
                "since": 52,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "singleType": {
                "final": true,
                "name": "singleType",
                "id": 1649,
                "since": 52,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": true
            },
            "startDate": {
                "final": true,
                "name": "startDate",
                "id": 1647,
                "since": 52,
                "type": "Date",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "totalPrice": {
                "final": true,
                "name": "totalPrice",
                "id": 1646,
                "since": 52,
                "type": "Number",
                "cardinality": "One",
                "encrypted": true
            },
            "type": {
                "final": true,
                "name": "type",
                "id": 1644,
                "since": 52,
                "type": "Number",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "KeyPair": {
        "name": "KeyPair",
        "since": 1,
        "type": "AGGREGATED_TYPE",
        "id": 0,
        "rootId": "A3N5cwAA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1,
                "since": 1,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "pubEccKey": {
                "final": true,
                "name": "pubEccKey",
                "id": 2144,
                "since": 92,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "pubKyberKey": {
                "final": true,
                "name": "pubKyberKey",
                "id": 2146,
                "since": 92,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "pubRsaKey": {
                "final": true,
                "name": "pubRsaKey",
                "id": 2,
                "since": 1,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "symEncPrivEccKey": {
                "final": true,
                "name": "symEncPrivEccKey",
                "id": 2145,
                "since": 92,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "symEncPrivKyberKey": {
                "final": true,
                "name": "symEncPrivKyberKey",
                "id": 2147,
                "since": 92,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "symEncPrivRsaKey": {
                "final": true,
                "name": "symEncPrivRsaKey",
                "id": 3,
                "since": 1,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "KeyRotation": {
        "name": "KeyRotation",
        "since": 96,
        "type": "LIST_ELEMENT_TYPE",
        "id": 2283,
        "rootId": "A3N5cwAI6w",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 2287,
                "since": 96,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 2285,
                "since": 96,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 2288,
                "since": 96,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 2286,
                "since": 96,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "groupKeyRotationType": {
                "final": true,
                "name": "groupKeyRotationType",
                "id": 2290,
                "since": 96,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "targetKeyVersion": {
                "final": true,
                "name": "targetKeyVersion",
                "id": 2289,
                "since": 96,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "adminGroupKeyAuthenticationData": {
                "final": false,
                "name": "adminGroupKeyAuthenticationData",
                "id": 2482,
                "since": 111,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "AdminGroupKeyAuthenticationData",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "KeyRotationsRef": {
        "name": "KeyRotationsRef",
        "since": 96,
        "type": "AGGREGATED_TYPE",
        "id": 2291,
        "rootId": "A3N5cwAI8w",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 2292,
                "since": 96,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "list": {
                "final": true,
                "name": "list",
                "id": 2293,
                "since": 96,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "KeyRotation",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "LocationServiceGetReturn": {
        "name": "LocationServiceGetReturn",
        "since": 30,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1321,
        "rootId": "A3N5cwAFKQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1322,
                "since": 30,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "country": {
                "final": false,
                "name": "country",
                "id": 1323,
                "since": 30,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "Login": {
        "name": "Login",
        "since": 1,
        "type": "LIST_ELEMENT_TYPE",
        "id": 48,
        "rootId": "A3N5cwAw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 52,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 50,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 993,
                "since": 17,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 51,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "time": {
                "final": false,
                "name": "time",
                "id": 53,
                "since": 1,
                "type": "Date",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "MailAddressAlias": {
        "name": "MailAddressAlias",
        "since": 8,
        "type": "AGGREGATED_TYPE",
        "id": 684,
        "rootId": "A3N5cwACrA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 685,
                "since": 8,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "enabled": {
                "final": true,
                "name": "enabled",
                "id": 784,
                "since": 9,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "mailAddress": {
                "final": true,
                "name": "mailAddress",
                "id": 686,
                "since": 8,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "MailAddressAliasGetIn": {
        "name": "MailAddressAliasGetIn",
        "since": 86,
        "type": "DATA_TRANSFER_TYPE",
        "id": 2095,
        "rootId": "A3N5cwAILw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 2096,
                "since": 86,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "targetGroup": {
                "final": false,
                "name": "targetGroup",
                "id": 2097,
                "since": 86,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Group",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "MailAddressAliasServiceData": {
        "name": "MailAddressAliasServiceData",
        "since": 8,
        "type": "DATA_TRANSFER_TYPE",
        "id": 688,
        "rootId": "A3N5cwACsA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 689,
                "since": 8,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "mailAddress": {
                "final": false,
                "name": "mailAddress",
                "id": 690,
                "since": 8,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "group": {
                "final": false,
                "name": "group",
                "id": 691,
                "since": 8,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Group",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "MailAddressAliasServiceDataDelete": {
        "name": "MailAddressAliasServiceDataDelete",
        "since": 9,
        "type": "DATA_TRANSFER_TYPE",
        "id": 785,
        "rootId": "A3N5cwADEQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 786,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "mailAddress": {
                "final": false,
                "name": "mailAddress",
                "id": 787,
                "since": 9,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "restore": {
                "final": false,
                "name": "restore",
                "id": 788,
                "since": 9,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "group": {
                "final": false,
                "name": "group",
                "id": 789,
                "since": 9,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Group",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "MailAddressAliasServiceReturn": {
        "name": "MailAddressAliasServiceReturn",
        "since": 8,
        "type": "DATA_TRANSFER_TYPE",
        "id": 692,
        "rootId": "A3N5cwACtA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 693,
                "since": 8,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "enabledAliases": {
                "final": false,
                "name": "enabledAliases",
                "id": 1071,
                "since": 18,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "nbrOfFreeAliases": {
                "final": false,
                "name": "nbrOfFreeAliases",
                "id": 694,
                "since": 8,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "totalAliases": {
                "final": false,
                "name": "totalAliases",
                "id": 1069,
                "since": 18,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "usedAliases": {
                "final": false,
                "name": "usedAliases",
                "id": 1070,
                "since": 18,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "MailAddressAvailability": {
        "name": "MailAddressAvailability",
        "since": 81,
        "type": "AGGREGATED_TYPE",
        "id": 2026,
        "rootId": "A3N5cwAH6g",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 2027,
                "since": 81,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "available": {
                "final": false,
                "name": "available",
                "id": 2029,
                "since": 81,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "mailAddress": {
                "final": false,
                "name": "mailAddress",
                "id": 2028,
                "since": 81,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "MailAddressToGroup": {
        "name": "MailAddressToGroup",
        "since": 1,
        "type": "ELEMENT_TYPE",
        "id": 204,
        "rootId": "A3N5cwAAzA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 208,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 206,
                "since": 1,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1019,
                "since": 17,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 207,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "internalGroup": {
                "final": false,
                "name": "internalGroup",
                "id": 209,
                "since": 1,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "Group",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "MembershipAddData": {
        "name": "MembershipAddData",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 505,
        "rootId": "A3N5cwAB-Q",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 506,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "groupKeyVersion": {
                "final": false,
                "name": "groupKeyVersion",
                "id": 2277,
                "since": 96,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "symEncGKey": {
                "final": false,
                "name": "symEncGKey",
                "id": 507,
                "since": 1,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "symKeyVersion": {
                "final": false,
                "name": "symKeyVersion",
                "id": 2276,
                "since": 96,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "group": {
                "final": false,
                "name": "group",
                "id": 509,
                "since": 1,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Group",
                "dependency": null
            },
            "user": {
                "final": false,
                "name": "user",
                "id": 508,
                "since": 1,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "User",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "MembershipPutIn": {
        "name": "MembershipPutIn",
        "since": 102,
        "type": "DATA_TRANSFER_TYPE",
        "id": 2404,
        "rootId": "A3N5cwAJZA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 2405,
                "since": 102,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "groupKeyUpdates": {
                "final": false,
                "name": "groupKeyUpdates",
                "id": 2406,
                "since": 102,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "GroupMembershipKeyData",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "MembershipRemoveData": {
        "name": "MembershipRemoveData",
        "since": 9,
        "type": "DATA_TRANSFER_TYPE",
        "id": 867,
        "rootId": "A3N5cwADYw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 868,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "group": {
                "final": false,
                "name": "group",
                "id": 870,
                "since": 9,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Group",
                "dependency": null
            },
            "user": {
                "final": false,
                "name": "user",
                "id": 869,
                "since": 9,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "User",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "MissedNotification": {
        "name": "MissedNotification",
        "since": 53,
        "type": "ELEMENT_TYPE",
        "id": 1693,
        "rootId": "A3N5cwAGnQ",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1697,
                "since": 53,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1695,
                "since": 53,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 1699,
                "since": 53,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1698,
                "since": 53,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 2236,
                "since": 96,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 1696,
                "since": 53,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "changeTime": {
                "final": true,
                "name": "changeTime",
                "id": 1701,
                "since": 53,
                "type": "Date",
                "cardinality": "One",
                "encrypted": false
            },
            "confirmationId": {
                "final": true,
                "name": "confirmationId",
                "id": 1700,
                "since": 53,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "lastProcessedNotificationId": {
                "final": true,
                "name": "lastProcessedNotificationId",
                "id": 1722,
                "since": 55,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {
            "alarmNotifications": {
                "final": false,
                "name": "alarmNotifications",
                "id": 1703,
                "since": 53,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "AlarmNotification",
                "dependency": null
            },
            "notificationInfos": {
                "final": false,
                "name": "notificationInfos",
                "id": 1702,
                "since": 53,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "NotificationInfo",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "MultipleMailAddressAvailabilityData": {
        "name": "MultipleMailAddressAvailabilityData",
        "since": 81,
        "type": "DATA_TRANSFER_TYPE",
        "id": 2030,
        "rootId": "A3N5cwAH7g",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 2031,
                "since": 81,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "mailAddresses": {
                "final": false,
                "name": "mailAddresses",
                "id": 2032,
                "since": 81,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "StringWrapper",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "MultipleMailAddressAvailabilityReturn": {
        "name": "MultipleMailAddressAvailabilityReturn",
        "since": 81,
        "type": "DATA_TRANSFER_TYPE",
        "id": 2033,
        "rootId": "A3N5cwAH8Q",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 2034,
                "since": 81,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "availabilities": {
                "final": false,
                "name": "availabilities",
                "id": 2035,
                "since": 81,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "MailAddressAvailability",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "NotificationInfo": {
        "name": "NotificationInfo",
        "since": 32,
        "type": "AGGREGATED_TYPE",
        "id": 1364,
        "rootId": "A3N5cwAFVA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1365,
                "since": 32,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "mailAddress": {
                "final": false,
                "name": "mailAddress",
                "id": 1366,
                "since": 32,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "userId": {
                "final": false,
                "name": "userId",
                "id": 1368,
                "since": 32,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "mailId": {
                "final": true,
                "name": "mailId",
                "id": 2319,
                "since": 99,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "IdTupleWrapper",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "NotificationMailTemplate": {
        "name": "NotificationMailTemplate",
        "since": 45,
        "type": "AGGREGATED_TYPE",
        "id": 1517,
        "rootId": "A3N5cwAF7Q",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1518,
                "since": 45,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "body": {
                "final": false,
                "name": "body",
                "id": 1520,
                "since": 45,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "language": {
                "final": false,
                "name": "language",
                "id": 1519,
                "since": 45,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "subject": {
                "final": false,
                "name": "subject",
                "id": 1521,
                "since": 45,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "NotificationSessionKey": {
        "name": "NotificationSessionKey",
        "since": 48,
        "type": "AGGREGATED_TYPE",
        "id": 1553,
        "rootId": "A3N5cwAGEQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1554,
                "since": 48,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "pushIdentifierSessionEncSessionKey": {
                "final": false,
                "name": "pushIdentifierSessionEncSessionKey",
                "id": 1556,
                "since": 48,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "pushIdentifier": {
                "final": false,
                "name": "pushIdentifier",
                "id": 1555,
                "since": 48,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "PushIdentifier",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "OrderProcessingAgreement": {
        "name": "OrderProcessingAgreement",
        "since": 31,
        "type": "LIST_ELEMENT_TYPE",
        "id": 1326,
        "rootId": "A3N5cwAFLg",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1330,
                "since": 31,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1328,
                "since": 31,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 1332,
                "since": 31,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1331,
                "since": 31,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 2231,
                "since": 96,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 1329,
                "since": 31,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "customerAddress": {
                "final": false,
                "name": "customerAddress",
                "id": 1334,
                "since": 31,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "signatureDate": {
                "final": false,
                "name": "signatureDate",
                "id": 1335,
                "since": 31,
                "type": "Date",
                "cardinality": "One",
                "encrypted": false
            },
            "version": {
                "final": false,
                "name": "version",
                "id": 1333,
                "since": 31,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "customer": {
                "final": true,
                "name": "customer",
                "id": 1337,
                "since": 31,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Customer",
                "dependency": null
            },
            "signerUserGroupInfo": {
                "final": false,
                "name": "signerUserGroupInfo",
                "id": 1336,
                "since": 31,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "GroupInfo",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "OtpChallenge": {
        "name": "OtpChallenge",
        "since": 24,
        "type": "AGGREGATED_TYPE",
        "id": 1244,
        "rootId": "A3N5cwAE3A",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1245,
                "since": 24,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "secondFactors": {
                "final": false,
                "name": "secondFactors",
                "id": 1246,
                "since": 24,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "Any",
                "refType": "SecondFactor",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "PaymentDataServiceGetData": {
        "name": "PaymentDataServiceGetData",
        "since": 67,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1861,
        "rootId": "A3N5cwAHRQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1862,
                "since": 67,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "clientType": {
                "final": false,
                "name": "clientType",
                "id": 1863,
                "since": 67,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "PaymentDataServiceGetReturn": {
        "name": "PaymentDataServiceGetReturn",
        "since": 9,
        "type": "DATA_TRANSFER_TYPE",
        "id": 790,
        "rootId": "A3N5cwADFg",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 791,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "loginUrl": {
                "final": false,
                "name": "loginUrl",
                "id": 792,
                "since": 9,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "PaymentDataServicePostData": {
        "name": "PaymentDataServicePostData",
        "since": 66,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1837,
        "rootId": "A3N5cwAHLQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1838,
                "since": 66,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "braintree3dsResponse": {
                "final": false,
                "name": "braintree3dsResponse",
                "id": 1839,
                "since": 66,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "Braintree3ds2Response",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "PaymentDataServicePutData": {
        "name": "PaymentDataServicePutData",
        "since": 9,
        "type": "DATA_TRANSFER_TYPE",
        "id": 793,
        "rootId": "A3N5cwADGQ",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 794,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "confirmedCountry": {
                "final": false,
                "name": "confirmedCountry",
                "id": 804,
                "since": 9,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "invoiceAddress": {
                "final": false,
                "name": "invoiceAddress",
                "id": 797,
                "since": 9,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "invoiceCountry": {
                "final": false,
                "name": "invoiceCountry",
                "id": 798,
                "since": 9,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "invoiceName": {
                "final": false,
                "name": "invoiceName",
                "id": 796,
                "since": 9,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "invoiceVatIdNo": {
                "final": false,
                "name": "invoiceVatIdNo",
                "id": 799,
                "since": 9,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "paymentInterval": {
                "final": false,
                "name": "paymentInterval",
                "id": 802,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "paymentMethod": {
                "final": false,
                "name": "paymentMethod",
                "id": 800,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": true
            },
            "paymentMethodInfo": {
                "final": false,
                "name": "paymentMethodInfo",
                "id": 801,
                "since": 9,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "paymentToken": {
                "final": false,
                "name": "paymentToken",
                "id": 803,
                "since": 9,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            }
        },
        "associations": {
            "creditCard": {
                "final": false,
                "name": "creditCard",
                "id": 1320,
                "since": 30,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "CreditCard",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "PaymentDataServicePutReturn": {
        "name": "PaymentDataServicePutReturn",
        "since": 9,
        "type": "DATA_TRANSFER_TYPE",
        "id": 805,
        "rootId": "A3N5cwADJQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 806,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "result": {
                "final": false,
                "name": "result",
                "id": 807,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "braintree3dsRequest": {
                "final": false,
                "name": "braintree3dsRequest",
                "id": 1840,
                "since": 66,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "Braintree3ds2Request",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "PaymentErrorInfo": {
        "name": "PaymentErrorInfo",
        "since": 52,
        "type": "AGGREGATED_TYPE",
        "id": 1632,
        "rootId": "A3N5cwAGYA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1633,
                "since": 52,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "errorCode": {
                "final": true,
                "name": "errorCode",
                "id": 1635,
                "since": 52,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "errorTime": {
                "final": true,
                "name": "errorTime",
                "id": 1634,
                "since": 52,
                "type": "Date",
                "cardinality": "One",
                "encrypted": false
            },
            "thirdPartyErrorId": {
                "final": true,
                "name": "thirdPartyErrorId",
                "id": 1636,
                "since": 52,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "Permission": {
        "name": "Permission",
        "since": 1,
        "type": "LIST_ELEMENT_TYPE",
        "id": 132,
        "rootId": "A3N5cwAAhA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 136,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 134,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 1003,
                "since": 17,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1002,
                "since": 17,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 2242,
                "since": 96,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 135,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "bucketEncSessionKey": {
                "final": false,
                "name": "bucketEncSessionKey",
                "id": 139,
                "since": 1,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "listElementApplication": {
                "final": false,
                "name": "listElementApplication",
                "id": 1524,
                "since": 46,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "listElementTypeId": {
                "final": false,
                "name": "listElementTypeId",
                "id": 1523,
                "since": 46,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "ops": {
                "final": false,
                "name": "ops",
                "id": 140,
                "since": 1,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "symEncSessionKey": {
                "final": false,
                "name": "symEncSessionKey",
                "id": 138,
                "since": 1,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "symKeyVersion": {
                "final": true,
                "name": "symKeyVersion",
                "id": 2251,
                "since": 96,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "type": {
                "final": false,
                "name": "type",
                "id": 137,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "bucket": {
                "final": false,
                "name": "bucket",
                "id": 142,
                "since": 1,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "Bucket",
                "dependency": null
            },
            "group": {
                "final": false,
                "name": "group",
                "id": 141,
                "since": 1,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "Group",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "PlanConfiguration": {
        "name": "PlanConfiguration",
        "since": 87,
        "type": "AGGREGATED_TYPE",
        "id": 2104,
        "rootId": "A3N5cwAIOA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 2105,
                "since": 87,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "autoResponder": {
                "final": true,
                "name": "autoResponder",
                "id": 2130,
                "since": 88,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "contactList": {
                "final": true,
                "name": "contactList",
                "id": 2136,
                "since": 90,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "customDomainType": {
                "final": true,
                "name": "customDomainType",
                "id": 2111,
                "since": 87,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "eventInvites": {
                "final": true,
                "name": "eventInvites",
                "id": 2109,
                "since": 87,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "multiUser": {
                "final": true,
                "name": "multiUser",
                "id": 2112,
                "since": 87,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "nbrOfAliases": {
                "final": true,
                "name": "nbrOfAliases",
                "id": 2106,
                "since": 87,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "sharing": {
                "final": true,
                "name": "sharing",
                "id": 2108,
                "since": 87,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "storageGb": {
                "final": true,
                "name": "storageGb",
                "id": 2107,
                "since": 87,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "templates": {
                "final": true,
                "name": "templates",
                "id": 2113,
                "since": 87,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "whitelabel": {
                "final": true,
                "name": "whitelabel",
                "id": 2110,
                "since": 87,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "PlanPrices": {
        "name": "PlanPrices",
        "since": 39,
        "type": "AGGREGATED_TYPE",
        "id": 1460,
        "rootId": "A3N5cwAFtA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1461,
                "since": 39,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "additionalUserPriceMonthly": {
                "final": false,
                "name": "additionalUserPriceMonthly",
                "id": 1465,
                "since": 39,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "business": {
                "final": false,
                "name": "business",
                "id": 2100,
                "since": 86,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "businessPlan": {
                "final": false,
                "name": "businessPlan",
                "id": 2129,
                "since": 88,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "customDomains": {
                "final": false,
                "name": "customDomains",
                "id": 2102,
                "since": 86,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "firstYearDiscount": {
                "final": false,
                "name": "firstYearDiscount",
                "id": 1464,
                "since": 39,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "includedAliases": {
                "final": false,
                "name": "includedAliases",
                "id": 1467,
                "since": 39,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "includedStorage": {
                "final": false,
                "name": "includedStorage",
                "id": 1468,
                "since": 39,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "monthlyPrice": {
                "final": false,
                "name": "monthlyPrice",
                "id": 1463,
                "since": 39,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "monthlyReferencePrice": {
                "final": false,
                "name": "monthlyReferencePrice",
                "id": 1462,
                "since": 39,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "planName": {
                "final": false,
                "name": "planName",
                "id": 2128,
                "since": 88,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "sharing": {
                "final": false,
                "name": "sharing",
                "id": 2099,
                "since": 86,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "whitelabel": {
                "final": false,
                "name": "whitelabel",
                "id": 2101,
                "since": 86,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "planConfiguration": {
                "final": false,
                "name": "planConfiguration",
                "id": 2127,
                "since": 88,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "PlanConfiguration",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "PlanServiceGetOut": {
        "name": "PlanServiceGetOut",
        "since": 87,
        "type": "DATA_TRANSFER_TYPE",
        "id": 2115,
        "rootId": "A3N5cwAIQw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 2116,
                "since": 87,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "config": {
                "final": false,
                "name": "config",
                "id": 2117,
                "since": 87,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "PlanConfiguration",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "PriceData": {
        "name": "PriceData",
        "since": 9,
        "type": "AGGREGATED_TYPE",
        "id": 853,
        "rootId": "A3N5cwADVQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 854,
                "since": 9,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "paymentInterval": {
                "final": false,
                "name": "paymentInterval",
                "id": 857,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "price": {
                "final": false,
                "name": "price",
                "id": 855,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "taxIncluded": {
                "final": false,
                "name": "taxIncluded",
                "id": 856,
                "since": 9,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "items": {
                "final": false,
                "name": "items",
                "id": 858,
                "since": 9,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "PriceItemData",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "PriceItemData": {
        "name": "PriceItemData",
        "since": 9,
        "type": "AGGREGATED_TYPE",
        "id": 847,
        "rootId": "A3N5cwADTw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 848,
                "since": 9,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "count": {
                "final": false,
                "name": "count",
                "id": 850,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "featureType": {
                "final": false,
                "name": "featureType",
                "id": 849,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "price": {
                "final": false,
                "name": "price",
                "id": 851,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "singleType": {
                "final": false,
                "name": "singleType",
                "id": 852,
                "since": 9,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "PriceRequestData": {
        "name": "PriceRequestData",
        "since": 9,
        "type": "AGGREGATED_TYPE",
        "id": 836,
        "rootId": "A3N5cwADRA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 837,
                "since": 9,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "accountType": {
                "final": false,
                "name": "accountType",
                "id": 842,
                "since": 9,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "business": {
                "final": false,
                "name": "business",
                "id": 840,
                "since": 9,
                "type": "Boolean",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "count": {
                "final": false,
                "name": "count",
                "id": 839,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "featureType": {
                "final": false,
                "name": "featureType",
                "id": 838,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "paymentInterval": {
                "final": false,
                "name": "paymentInterval",
                "id": 841,
                "since": 9,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "reactivate": {
                "final": false,
                "name": "reactivate",
                "id": 1285,
                "since": 26,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "PriceServiceData": {
        "name": "PriceServiceData",
        "since": 9,
        "type": "DATA_TRANSFER_TYPE",
        "id": 843,
        "rootId": "A3N5cwADSw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 844,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "date": {
                "final": false,
                "name": "date",
                "id": 846,
                "since": 9,
                "type": "Date",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {
            "priceRequest": {
                "final": false,
                "name": "priceRequest",
                "id": 845,
                "since": 9,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "PriceRequestData",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "PriceServiceReturn": {
        "name": "PriceServiceReturn",
        "since": 9,
        "type": "DATA_TRANSFER_TYPE",
        "id": 859,
        "rootId": "A3N5cwADWw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 860,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "currentPeriodAddedPrice": {
                "final": false,
                "name": "currentPeriodAddedPrice",
                "id": 862,
                "since": 9,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "periodEndDate": {
                "final": false,
                "name": "periodEndDate",
                "id": 861,
                "since": 9,
                "type": "Date",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "currentPriceNextPeriod": {
                "final": false,
                "name": "currentPriceNextPeriod",
                "id": 864,
                "since": 9,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "PriceData",
                "dependency": null
            },
            "currentPriceThisPeriod": {
                "final": false,
                "name": "currentPriceThisPeriod",
                "id": 863,
                "since": 9,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "PriceData",
                "dependency": null
            },
            "futurePriceNextPeriod": {
                "final": false,
                "name": "futurePriceNextPeriod",
                "id": 865,
                "since": 9,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "PriceData",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "PubEncKeyData": {
        "name": "PubEncKeyData",
        "since": 102,
        "type": "AGGREGATED_TYPE",
        "id": 2384,
        "rootId": "A3N5cwAJUA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 2385,
                "since": 102,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "protocolVersion": {
                "final": true,
                "name": "protocolVersion",
                "id": 2390,
                "since": 102,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "pubEncSymKey": {
                "final": true,
                "name": "pubEncSymKey",
                "id": 2387,
                "since": 102,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "recipientIdentifier": {
                "final": true,
                "name": "recipientIdentifier",
                "id": 2386,
                "since": 102,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "recipientIdentifierType": {
                "final": true,
                "name": "recipientIdentifierType",
                "id": 2469,
                "since": 111,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "recipientKeyVersion": {
                "final": true,
                "name": "recipientKeyVersion",
                "id": 2388,
                "since": 102,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "senderKeyVersion": {
                "final": true,
                "name": "senderKeyVersion",
                "id": 2389,
                "since": 102,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "PublicKeyGetIn": {
        "name": "PublicKeyGetIn",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 409,
        "rootId": "A3N5cwABmQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 410,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "identifier": {
                "final": false,
                "name": "identifier",
                "id": 411,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "identifierType": {
                "final": false,
                "name": "identifierType",
                "id": 2468,
                "since": 111,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "version": {
                "final": false,
                "name": "version",
                "id": 2244,
                "since": 96,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "PublicKeyGetOut": {
        "name": "PublicKeyGetOut",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 412,
        "rootId": "A3N5cwABnA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 413,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "pubEccKey": {
                "final": true,
                "name": "pubEccKey",
                "id": 2148,
                "since": 92,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "pubKeyVersion": {
                "final": false,
                "name": "pubKeyVersion",
                "id": 415,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "pubKyberKey": {
                "final": true,
                "name": "pubKyberKey",
                "id": 2149,
                "since": 92,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "pubRsaKey": {
                "final": false,
                "name": "pubRsaKey",
                "id": 414,
                "since": 1,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "PublicKeyPutIn": {
        "name": "PublicKeyPutIn",
        "since": 92,
        "type": "DATA_TRANSFER_TYPE",
        "id": 2150,
        "rootId": "A3N5cwAIZg",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 2151,
                "since": 92,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "pubEccKey": {
                "final": true,
                "name": "pubEccKey",
                "id": 2152,
                "since": 92,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "symEncPrivEccKey": {
                "final": true,
                "name": "symEncPrivEccKey",
                "id": 2153,
                "since": 92,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "keyGroup": {
                "final": false,
                "name": "keyGroup",
                "id": 2154,
                "since": 92,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Group",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "PushIdentifier": {
        "name": "PushIdentifier",
        "since": 5,
        "type": "LIST_ELEMENT_TYPE",
        "id": 625,
        "rootId": "A3N5cwACcQ",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_area": {
                "final": true,
                "name": "_area",
                "id": 631,
                "since": 5,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_format": {
                "final": false,
                "name": "_format",
                "id": 629,
                "since": 5,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 627,
                "since": 5,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_owner": {
                "final": true,
                "name": "_owner",
                "id": 630,
                "since": 5,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 1497,
                "since": 43,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1029,
                "since": 17,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 2241,
                "since": 96,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 628,
                "since": 5,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "app": {
                "final": true,
                "name": "app",
                "id": 2426,
                "since": 105,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "disabled": {
                "final": false,
                "name": "disabled",
                "id": 1476,
                "since": 39,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "displayName": {
                "final": false,
                "name": "displayName",
                "id": 1498,
                "since": 43,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "identifier": {
                "final": false,
                "name": "identifier",
                "id": 633,
                "since": 5,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "language": {
                "final": false,
                "name": "language",
                "id": 634,
                "since": 5,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "lastNotificationDate": {
                "final": false,
                "name": "lastNotificationDate",
                "id": 1248,
                "since": 24,
                "type": "Date",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "lastUsageTime": {
                "final": false,
                "name": "lastUsageTime",
                "id": 1704,
                "since": 53,
                "type": "Date",
                "cardinality": "One",
                "encrypted": false
            },
            "pushServiceType": {
                "final": true,
                "name": "pushServiceType",
                "id": 632,
                "since": 5,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "PushIdentifierList": {
        "name": "PushIdentifierList",
        "since": 5,
        "type": "AGGREGATED_TYPE",
        "id": 635,
        "rootId": "A3N5cwACew",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 636,
                "since": 5,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "list": {
                "final": true,
                "name": "list",
                "id": 637,
                "since": 5,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "PushIdentifier",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "ReceivedGroupInvitation": {
        "name": "ReceivedGroupInvitation",
        "since": 52,
        "type": "LIST_ELEMENT_TYPE",
        "id": 1602,
        "rootId": "A3N5cwAGQg",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1606,
                "since": 52,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1604,
                "since": 52,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 1608,
                "since": 52,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1607,
                "since": 52,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 2234,
                "since": 96,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 1605,
                "since": 52,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "capability": {
                "final": false,
                "name": "capability",
                "id": 1614,
                "since": 52,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "groupType": {
                "final": true,
                "name": "groupType",
                "id": 1868,
                "since": 68,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "inviteeMailAddress": {
                "final": false,
                "name": "inviteeMailAddress",
                "id": 1613,
                "since": 52,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "inviterMailAddress": {
                "final": false,
                "name": "inviterMailAddress",
                "id": 1611,
                "since": 52,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "inviterName": {
                "final": false,
                "name": "inviterName",
                "id": 1612,
                "since": 52,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "sharedGroupKey": {
                "final": false,
                "name": "sharedGroupKey",
                "id": 1609,
                "since": 52,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": true
            },
            "sharedGroupKeyVersion": {
                "final": false,
                "name": "sharedGroupKeyVersion",
                "id": 2280,
                "since": 96,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "sharedGroupName": {
                "final": false,
                "name": "sharedGroupName",
                "id": 1610,
                "since": 52,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {
            "sentInvitation": {
                "final": false,
                "name": "sentInvitation",
                "id": 1616,
                "since": 52,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "SentGroupInvitation",
                "dependency": null
            },
            "sharedGroup": {
                "final": false,
                "name": "sharedGroup",
                "id": 1615,
                "since": 52,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Group",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "RecoverCode": {
        "name": "RecoverCode",
        "since": 36,
        "type": "ELEMENT_TYPE",
        "id": 1407,
        "rootId": "A3N5cwAFfw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1411,
                "since": 36,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1409,
                "since": 36,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1412,
                "since": 36,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 1410,
                "since": 36,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "recoverCodeEncUserGroupKey": {
                "final": true,
                "name": "recoverCodeEncUserGroupKey",
                "id": 1414,
                "since": 36,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "userEncRecoverCode": {
                "final": true,
                "name": "userEncRecoverCode",
                "id": 1413,
                "since": 36,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "userKeyVersion": {
                "final": true,
                "name": "userKeyVersion",
                "id": 2281,
                "since": 96,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "verifier": {
                "final": true,
                "name": "verifier",
                "id": 1415,
                "since": 36,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "RecoverCodeData": {
        "name": "RecoverCodeData",
        "since": 101,
        "type": "AGGREGATED_TYPE",
        "id": 2346,
        "rootId": "A3N5cwAJKg",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 2347,
                "since": 101,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "recoveryCodeEncUserGroupKey": {
                "final": false,
                "name": "recoveryCodeEncUserGroupKey",
                "id": 2349,
                "since": 101,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "recoveryCodeVerifier": {
                "final": false,
                "name": "recoveryCodeVerifier",
                "id": 2351,
                "since": 101,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "userEncRecoveryCode": {
                "final": false,
                "name": "userEncRecoveryCode",
                "id": 2350,
                "since": 101,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "userKeyVersion": {
                "final": false,
                "name": "userKeyVersion",
                "id": 2348,
                "since": 101,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "ReferralCodeGetIn": {
        "name": "ReferralCodeGetIn",
        "since": 84,
        "type": "DATA_TRANSFER_TYPE",
        "id": 2062,
        "rootId": "A3N5cwAIDg",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 2063,
                "since": 84,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "referralCode": {
                "final": false,
                "name": "referralCode",
                "id": 2064,
                "since": 84,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "ReferralCode",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "ReferralCodePostIn": {
        "name": "ReferralCodePostIn",
        "since": 84,
        "type": "DATA_TRANSFER_TYPE",
        "id": 2065,
        "rootId": "A3N5cwAIEQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 2066,
                "since": 84,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "ReferralCodePostOut": {
        "name": "ReferralCodePostOut",
        "since": 84,
        "type": "DATA_TRANSFER_TYPE",
        "id": 2067,
        "rootId": "A3N5cwAIEw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 2068,
                "since": 84,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "referralCode": {
                "final": false,
                "name": "referralCode",
                "id": 2069,
                "since": 84,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "ReferralCode",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "RegistrationCaptchaServiceData": {
        "name": "RegistrationCaptchaServiceData",
        "since": 7,
        "type": "DATA_TRANSFER_TYPE",
        "id": 674,
        "rootId": "A3N5cwACog",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 675,
                "since": 7,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "response": {
                "final": false,
                "name": "response",
                "id": 677,
                "since": 7,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "token": {
                "final": false,
                "name": "token",
                "id": 676,
                "since": 7,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "RegistrationCaptchaServiceGetData": {
        "name": "RegistrationCaptchaServiceGetData",
        "since": 40,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1479,
        "rootId": "A3N5cwAFxw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1480,
                "since": 40,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "businessUseSelected": {
                "final": false,
                "name": "businessUseSelected",
                "id": 1752,
                "since": 61,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "mailAddress": {
                "final": false,
                "name": "mailAddress",
                "id": 1482,
                "since": 40,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "paidSubscriptionSelected": {
                "final": false,
                "name": "paidSubscriptionSelected",
                "id": 1751,
                "since": 61,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "signupToken": {
                "final": false,
                "name": "signupToken",
                "id": 1731,
                "since": 58,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "token": {
                "final": false,
                "name": "token",
                "id": 1481,
                "since": 40,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "RegistrationCaptchaServiceReturn": {
        "name": "RegistrationCaptchaServiceReturn",
        "since": 7,
        "type": "DATA_TRANSFER_TYPE",
        "id": 678,
        "rootId": "A3N5cwACpg",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 679,
                "since": 7,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "challenge": {
                "final": false,
                "name": "challenge",
                "id": 681,
                "since": 7,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "token": {
                "final": false,
                "name": "token",
                "id": 680,
                "since": 7,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "RegistrationReturn": {
        "name": "RegistrationReturn",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 326,
        "rootId": "A3N5cwABRg",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 327,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "authToken": {
                "final": false,
                "name": "authToken",
                "id": 328,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "RegistrationServiceData": {
        "name": "RegistrationServiceData",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 316,
        "rootId": "A3N5cwABPA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 317,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "source": {
                "final": false,
                "name": "source",
                "id": 874,
                "since": 9,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "starterDomain": {
                "final": false,
                "name": "starterDomain",
                "id": 322,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "state": {
                "final": false,
                "name": "state",
                "id": 325,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "RejectedSender": {
        "name": "RejectedSender",
        "since": 60,
        "type": "LIST_ELEMENT_TYPE",
        "id": 1736,
        "rootId": "A3N5cwAGyA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1740,
                "since": 60,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1738,
                "since": 60,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1741,
                "since": 60,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 1739,
                "since": 60,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "reason": {
                "final": true,
                "name": "reason",
                "id": 1746,
                "since": 60,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "recipientMailAddress": {
                "final": true,
                "name": "recipientMailAddress",
                "id": 1745,
                "since": 60,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "senderHostname": {
                "final": true,
                "name": "senderHostname",
                "id": 1744,
                "since": 60,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "senderIp": {
                "final": true,
                "name": "senderIp",
                "id": 1743,
                "since": 60,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "senderMailAddress": {
                "final": true,
                "name": "senderMailAddress",
                "id": 1742,
                "since": 60,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "RejectedSendersRef": {
        "name": "RejectedSendersRef",
        "since": 60,
        "type": "AGGREGATED_TYPE",
        "id": 1747,
        "rootId": "A3N5cwAG0w",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1748,
                "since": 60,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "items": {
                "final": true,
                "name": "items",
                "id": 1749,
                "since": 60,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "RejectedSender",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "RepeatRule": {
        "name": "RepeatRule",
        "since": 48,
        "type": "AGGREGATED_TYPE",
        "id": 1557,
        "rootId": "A3N5cwAGFQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1558,
                "since": 48,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "endType": {
                "final": false,
                "name": "endType",
                "id": 1560,
                "since": 48,
                "type": "Number",
                "cardinality": "One",
                "encrypted": true
            },
            "endValue": {
                "final": false,
                "name": "endValue",
                "id": 1561,
                "since": 48,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "frequency": {
                "final": false,
                "name": "frequency",
                "id": 1559,
                "since": 48,
                "type": "Number",
                "cardinality": "One",
                "encrypted": true
            },
            "interval": {
                "final": false,
                "name": "interval",
                "id": 1562,
                "since": 48,
                "type": "Number",
                "cardinality": "One",
                "encrypted": true
            },
            "timeZone": {
                "final": false,
                "name": "timeZone",
                "id": 1563,
                "since": 48,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            }
        },
        "associations": {
            "excludedDates": {
                "final": true,
                "name": "excludedDates",
                "id": 2076,
                "since": 85,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "DateWrapper",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "ResetFactorsDeleteData": {
        "name": "ResetFactorsDeleteData",
        "since": 36,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1419,
        "rootId": "A3N5cwAFiw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1420,
                "since": 36,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "authVerifier": {
                "final": true,
                "name": "authVerifier",
                "id": 1422,
                "since": 36,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "mailAddress": {
                "final": true,
                "name": "mailAddress",
                "id": 1421,
                "since": 36,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "recoverCodeVerifier": {
                "final": true,
                "name": "recoverCodeVerifier",
                "id": 1423,
                "since": 36,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "ResetPasswordPostIn": {
        "name": "ResetPasswordPostIn",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 584,
        "rootId": "A3N5cwACSA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 585,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "kdfVersion": {
                "final": false,
                "name": "kdfVersion",
                "id": 2135,
                "since": 89,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "pwEncUserGroupKey": {
                "final": false,
                "name": "pwEncUserGroupKey",
                "id": 588,
                "since": 1,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "salt": {
                "final": false,
                "name": "salt",
                "id": 587,
                "since": 1,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "userGroupKeyVersion": {
                "final": false,
                "name": "userGroupKeyVersion",
                "id": 2409,
                "since": 102,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "verifier": {
                "final": false,
                "name": "verifier",
                "id": 586,
                "since": 1,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "user": {
                "final": false,
                "name": "user",
                "id": 589,
                "since": 1,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "User",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "RootInstance": {
        "name": "RootInstance",
        "since": 1,
        "type": "LIST_ELEMENT_TYPE",
        "id": 231,
        "rootId": "A3N5cwAA5w",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 235,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 233,
                "since": 1,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1022,
                "since": 17,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 234,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "reference": {
                "final": false,
                "name": "reference",
                "id": 236,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "SaltData": {
        "name": "SaltData",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 417,
        "rootId": "A3N5cwABoQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 418,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "mailAddress": {
                "final": false,
                "name": "mailAddress",
                "id": 419,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "SaltReturn": {
        "name": "SaltReturn",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 420,
        "rootId": "A3N5cwABpA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 421,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "kdfVersion": {
                "final": false,
                "name": "kdfVersion",
                "id": 2133,
                "since": 89,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "salt": {
                "final": false,
                "name": "salt",
                "id": 422,
                "since": 1,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "SecondFactor": {
        "name": "SecondFactor",
        "since": 23,
        "type": "LIST_ELEMENT_TYPE",
        "id": 1169,
        "rootId": "A3N5cwAEkQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1173,
                "since": 23,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1171,
                "since": 23,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1174,
                "since": 23,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 1172,
                "since": 23,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "name": {
                "final": true,
                "name": "name",
                "id": 1176,
                "since": 23,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "otpSecret": {
                "final": true,
                "name": "otpSecret",
                "id": 1242,
                "since": 24,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "type": {
                "final": true,
                "name": "type",
                "id": 1175,
                "since": 23,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "u2f": {
                "final": true,
                "name": "u2f",
                "id": 1177,
                "since": 23,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "U2fRegisteredDevice",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "SecondFactorAuthAllowedReturn": {
        "name": "SecondFactorAuthAllowedReturn",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 546,
        "rootId": "A3N5cwACIg",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 547,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "allowed": {
                "final": false,
                "name": "allowed",
                "id": 548,
                "since": 1,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "SecondFactorAuthData": {
        "name": "SecondFactorAuthData",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 541,
        "rootId": "A3N5cwACHQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 542,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "otpCode": {
                "final": true,
                "name": "otpCode",
                "id": 1243,
                "since": 24,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "type": {
                "final": true,
                "name": "type",
                "id": 1230,
                "since": 23,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {
            "session": {
                "final": true,
                "name": "session",
                "id": 1232,
                "since": 23,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "Session",
                "dependency": null
            },
            "u2f": {
                "final": true,
                "name": "u2f",
                "id": 1231,
                "since": 23,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "U2fResponseData",
                "dependency": null
            },
            "webauthn": {
                "final": true,
                "name": "webauthn",
                "id": 1905,
                "since": 71,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "WebauthnResponseData",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "SecondFactorAuthDeleteData": {
        "name": "SecondFactorAuthDeleteData",
        "since": 62,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1755,
        "rootId": "A3N5cwAG2w",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1756,
                "since": 62,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "session": {
                "final": true,
                "name": "session",
                "id": 1757,
                "since": 62,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Session",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "SecondFactorAuthGetData": {
        "name": "SecondFactorAuthGetData",
        "since": 23,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1233,
        "rootId": "A3N5cwAE0Q",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1234,
                "since": 23,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "accessToken": {
                "final": true,
                "name": "accessToken",
                "id": 1235,
                "since": 23,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "SecondFactorAuthGetReturn": {
        "name": "SecondFactorAuthGetReturn",
        "since": 23,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1236,
        "rootId": "A3N5cwAE1A",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1237,
                "since": 23,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "secondFactorPending": {
                "final": true,
                "name": "secondFactorPending",
                "id": 1238,
                "since": 23,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "SecondFactorAuthentication": {
        "name": "SecondFactorAuthentication",
        "since": 1,
        "type": "LIST_ELEMENT_TYPE",
        "id": 54,
        "rootId": "A3N5cwA2",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 58,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 56,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 994,
                "since": 17,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 57,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "code": {
                "final": false,
                "name": "code",
                "id": 59,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "finished": {
                "final": false,
                "name": "finished",
                "id": 61,
                "since": 1,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "service": {
                "final": false,
                "name": "service",
                "id": 62,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "verifyCount": {
                "final": false,
                "name": "verifyCount",
                "id": 60,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "SendRegistrationCodeData": {
        "name": "SendRegistrationCodeData",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 341,
        "rootId": "A3N5cwABVQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 342,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "accountType": {
                "final": false,
                "name": "accountType",
                "id": 345,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "authToken": {
                "final": false,
                "name": "authToken",
                "id": 343,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "language": {
                "final": false,
                "name": "language",
                "id": 344,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "mobilePhoneNumber": {
                "final": false,
                "name": "mobilePhoneNumber",
                "id": 346,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "SendRegistrationCodeReturn": {
        "name": "SendRegistrationCodeReturn",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 347,
        "rootId": "A3N5cwABWw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 348,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "authToken": {
                "final": false,
                "name": "authToken",
                "id": 349,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "SentGroupInvitation": {
        "name": "SentGroupInvitation",
        "since": 1,
        "type": "LIST_ELEMENT_TYPE",
        "id": 195,
        "rootId": "A3N5cwAAww",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 199,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 197,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1018,
                "since": 17,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 198,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "capability": {
                "final": false,
                "name": "capability",
                "id": 1601,
                "since": 52,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "inviteeMailAddress": {
                "final": false,
                "name": "inviteeMailAddress",
                "id": 1600,
                "since": 52,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "receivedInvitation": {
                "final": false,
                "name": "receivedInvitation",
                "id": 1617,
                "since": 52,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "ReceivedGroupInvitation",
                "dependency": null
            },
            "sharedGroup": {
                "final": false,
                "name": "sharedGroup",
                "id": 203,
                "since": 1,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Group",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "Session": {
        "name": "Session",
        "since": 23,
        "type": "LIST_ELEMENT_TYPE",
        "id": 1191,
        "rootId": "A3N5cwAEpw",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1195,
                "since": 23,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1193,
                "since": 23,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 1197,
                "since": 23,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1196,
                "since": 23,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 2229,
                "since": 96,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 1194,
                "since": 23,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "accessKey": {
                "final": true,
                "name": "accessKey",
                "id": 1202,
                "since": 23,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "clientIdentifier": {
                "final": false,
                "name": "clientIdentifier",
                "id": 1198,
                "since": 23,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "lastAccessTime": {
                "final": true,
                "name": "lastAccessTime",
                "id": 1201,
                "since": 23,
                "type": "Date",
                "cardinality": "One",
                "encrypted": false
            },
            "loginIpAddress": {
                "final": true,
                "name": "loginIpAddress",
                "id": 1200,
                "since": 23,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": true
            },
            "loginTime": {
                "final": true,
                "name": "loginTime",
                "id": 1199,
                "since": 23,
                "type": "Date",
                "cardinality": "One",
                "encrypted": true
            },
            "state": {
                "final": true,
                "name": "state",
                "id": 1203,
                "since": 23,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "challenges": {
                "final": true,
                "name": "challenges",
                "id": 1204,
                "since": 23,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "Challenge",
                "dependency": null
            },
            "user": {
                "final": true,
                "name": "user",
                "id": 1205,
                "since": 23,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "User",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "SignOrderProcessingAgreementData": {
        "name": "SignOrderProcessingAgreementData",
        "since": 31,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1342,
        "rootId": "A3N5cwAFPg",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1343,
                "since": 31,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "customerAddress": {
                "final": false,
                "name": "customerAddress",
                "id": 1345,
                "since": 31,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "version": {
                "final": false,
                "name": "version",
                "id": 1344,
                "since": 31,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "SseConnectData": {
        "name": "SseConnectData",
        "since": 32,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1352,
        "rootId": "A3N5cwAFSA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1353,
                "since": 32,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "identifier": {
                "final": true,
                "name": "identifier",
                "id": 1354,
                "since": 32,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "userIds": {
                "final": false,
                "name": "userIds",
                "id": 1355,
                "since": 32,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "GeneratedIdWrapper",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "StringConfigValue": {
        "name": "StringConfigValue",
        "since": 1,
        "type": "AGGREGATED_TYPE",
        "id": 515,
        "rootId": "A3N5cwACAw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 516,
                "since": 1,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "name": {
                "final": false,
                "name": "name",
                "id": 517,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "value": {
                "final": false,
                "name": "value",
                "id": 518,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "StringWrapper": {
        "name": "StringWrapper",
        "since": 9,
        "type": "AGGREGATED_TYPE",
        "id": 728,
        "rootId": "A3N5cwAC2A",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 729,
                "since": 9,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "value": {
                "final": false,
                "name": "value",
                "id": 730,
                "since": 9,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "SurveyData": {
        "name": "SurveyData",
        "since": 98,
        "type": "AGGREGATED_TYPE",
        "id": 2295,
        "rootId": "A3N5cwAI9w",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 2296,
                "since": 98,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "category": {
                "final": true,
                "name": "category",
                "id": 2297,
                "since": 98,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "details": {
                "final": true,
                "name": "details",
                "id": 2299,
                "since": 98,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "reason": {
                "final": true,
                "name": "reason",
                "id": 2298,
                "since": 98,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "version": {
                "final": true,
                "name": "version",
                "id": 2300,
                "since": 98,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "SwitchAccountTypePostIn": {
        "name": "SwitchAccountTypePostIn",
        "since": 9,
        "type": "DATA_TRANSFER_TYPE",
        "id": 772,
        "rootId": "A3N5cwADBA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 773,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "accountType": {
                "final": false,
                "name": "accountType",
                "id": 774,
                "since": 9,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "customer": {
                "final": false,
                "name": "customer",
                "id": 2123,
                "since": 87,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "date": {
                "final": false,
                "name": "date",
                "id": 775,
                "since": 9,
                "type": "Date",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "plan": {
                "final": false,
                "name": "plan",
                "id": 1310,
                "since": 30,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "specialPriceUserSingle": {
                "final": false,
                "name": "specialPriceUserSingle",
                "id": 2124,
                "since": 87,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {
            "referralCode": {
                "final": false,
                "name": "referralCode",
                "id": 2071,
                "since": 84,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "ReferralCode",
                "dependency": null
            },
            "surveyData": {
                "final": false,
                "name": "surveyData",
                "id": 2314,
                "since": 98,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "SurveyData",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "SystemKeysReturn": {
        "name": "SystemKeysReturn",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 301,
        "rootId": "A3N5cwABLQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 302,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "freeGroupKey": {
                "final": false,
                "name": "freeGroupKey",
                "id": 305,
                "since": 1,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "freeGroupKeyVersion": {
                "final": false,
                "name": "freeGroupKeyVersion",
                "id": 2278,
                "since": 96,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "premiumGroupKey": {
                "final": false,
                "name": "premiumGroupKey",
                "id": 306,
                "since": 1,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "premiumGroupKeyVersion": {
                "final": false,
                "name": "premiumGroupKeyVersion",
                "id": 2279,
                "since": 96,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "systemAdminPubEccKey": {
                "final": false,
                "name": "systemAdminPubEccKey",
                "id": 2155,
                "since": 92,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "systemAdminPubKeyVersion": {
                "final": false,
                "name": "systemAdminPubKeyVersion",
                "id": 304,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "systemAdminPubKyberKey": {
                "final": false,
                "name": "systemAdminPubKyberKey",
                "id": 2156,
                "since": 92,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "systemAdminPubRsaKey": {
                "final": false,
                "name": "systemAdminPubRsaKey",
                "id": 303,
                "since": 1,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {
            "freeGroup": {
                "final": false,
                "name": "freeGroup",
                "id": 880,
                "since": 9,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "Group",
                "dependency": null
            },
            "premiumGroup": {
                "final": false,
                "name": "premiumGroup",
                "id": 881,
                "since": 9,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "Group",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "TakeOverDeletedAddressData": {
        "name": "TakeOverDeletedAddressData",
        "since": 63,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1759,
        "rootId": "A3N5cwAG3w",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1760,
                "since": 63,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "authVerifier": {
                "final": false,
                "name": "authVerifier",
                "id": 1762,
                "since": 63,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "mailAddress": {
                "final": false,
                "name": "mailAddress",
                "id": 1761,
                "since": 63,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "recoverCodeVerifier": {
                "final": false,
                "name": "recoverCodeVerifier",
                "id": 1763,
                "since": 63,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "targetAccountMailAddress": {
                "final": false,
                "name": "targetAccountMailAddress",
                "id": 1764,
                "since": 63,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "TypeInfo": {
        "name": "TypeInfo",
        "since": 69,
        "type": "AGGREGATED_TYPE",
        "id": 1869,
        "rootId": "A3N5cwAHTQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1870,
                "since": 69,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "application": {
                "final": false,
                "name": "application",
                "id": 1871,
                "since": 69,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "typeId": {
                "final": false,
                "name": "typeId",
                "id": 1872,
                "since": 69,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "U2fChallenge": {
        "name": "U2fChallenge",
        "since": 23,
        "type": "AGGREGATED_TYPE",
        "id": 1183,
        "rootId": "A3N5cwAEnw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1184,
                "since": 23,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "challenge": {
                "final": true,
                "name": "challenge",
                "id": 1185,
                "since": 23,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "keys": {
                "final": true,
                "name": "keys",
                "id": 1186,
                "since": 23,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "U2fKey",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "U2fKey": {
        "name": "U2fKey",
        "since": 23,
        "type": "AGGREGATED_TYPE",
        "id": 1178,
        "rootId": "A3N5cwAEmg",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1179,
                "since": 23,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "appId": {
                "final": true,
                "name": "appId",
                "id": 1181,
                "since": 23,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "keyHandle": {
                "final": true,
                "name": "keyHandle",
                "id": 1180,
                "since": 23,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "secondFactor": {
                "final": false,
                "name": "secondFactor",
                "id": 1182,
                "since": 23,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "SecondFactor",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "U2fRegisteredDevice": {
        "name": "U2fRegisteredDevice",
        "since": 23,
        "type": "AGGREGATED_TYPE",
        "id": 1162,
        "rootId": "A3N5cwAEig",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1163,
                "since": 23,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "appId": {
                "final": true,
                "name": "appId",
                "id": 1165,
                "since": 23,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "compromised": {
                "final": true,
                "name": "compromised",
                "id": 1168,
                "since": 23,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "counter": {
                "final": true,
                "name": "counter",
                "id": 1167,
                "since": 23,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "keyHandle": {
                "final": true,
                "name": "keyHandle",
                "id": 1164,
                "since": 23,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "publicKey": {
                "final": true,
                "name": "publicKey",
                "id": 1166,
                "since": 23,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "U2fResponseData": {
        "name": "U2fResponseData",
        "since": 23,
        "type": "AGGREGATED_TYPE",
        "id": 1225,
        "rootId": "A3N5cwAEyQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1226,
                "since": 23,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "clientData": {
                "final": true,
                "name": "clientData",
                "id": 1228,
                "since": 23,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "keyHandle": {
                "final": true,
                "name": "keyHandle",
                "id": 1227,
                "since": 23,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "signatureData": {
                "final": true,
                "name": "signatureData",
                "id": 1229,
                "since": 23,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "UpdatePermissionKeyData": {
        "name": "UpdatePermissionKeyData",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 445,
        "rootId": "A3N5cwABvQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 446,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "ownerEncSessionKey": {
                "final": false,
                "name": "ownerEncSessionKey",
                "id": 1031,
                "since": 17,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "ownerKeyVersion": {
                "final": false,
                "name": "ownerKeyVersion",
                "id": 2245,
                "since": 96,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "bucketPermission": {
                "final": false,
                "name": "bucketPermission",
                "id": 451,
                "since": 1,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "BucketPermission",
                "dependency": null
            },
            "permission": {
                "final": false,
                "name": "permission",
                "id": 450,
                "since": 1,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Permission",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "UpdateSessionKeysPostIn": {
        "name": "UpdateSessionKeysPostIn",
        "since": 82,
        "type": "DATA_TRANSFER_TYPE",
        "id": 2049,
        "rootId": "A3N5cwAIAQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 2050,
                "since": 82,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "ownerEncSessionKeys": {
                "final": false,
                "name": "ownerEncSessionKeys",
                "id": 2051,
                "since": 82,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "InstanceSessionKey",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "UpgradePriceServiceData": {
        "name": "UpgradePriceServiceData",
        "since": 39,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1456,
        "rootId": "A3N5cwAFsA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1457,
                "since": 39,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "campaign": {
                "final": false,
                "name": "campaign",
                "id": 1459,
                "since": 39,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "date": {
                "final": false,
                "name": "date",
                "id": 1458,
                "since": 39,
                "type": "Date",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {
            "referralCode": {
                "final": false,
                "name": "referralCode",
                "id": 2077,
                "since": 86,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "ReferralCode",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "UpgradePriceServiceReturn": {
        "name": "UpgradePriceServiceReturn",
        "since": 39,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1469,
        "rootId": "A3N5cwAFvQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1470,
                "since": 39,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "bonusMonthsForYearlyPlan": {
                "final": false,
                "name": "bonusMonthsForYearlyPlan",
                "id": 2084,
                "since": 86,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "business": {
                "final": false,
                "name": "business",
                "id": 1472,
                "since": 39,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "messageTextId": {
                "final": false,
                "name": "messageTextId",
                "id": 1471,
                "since": 39,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {
            "advancedPrices": {
                "final": false,
                "name": "advancedPrices",
                "id": 2082,
                "since": 86,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "PlanPrices",
                "dependency": null
            },
            "essentialPrices": {
                "final": false,
                "name": "essentialPrices",
                "id": 2081,
                "since": 86,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "PlanPrices",
                "dependency": null
            },
            "freePrices": {
                "final": false,
                "name": "freePrices",
                "id": 2078,
                "since": 86,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "PlanPrices",
                "dependency": null
            },
            "legendaryPrices": {
                "final": false,
                "name": "legendaryPrices",
                "id": 2080,
                "since": 86,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "PlanPrices",
                "dependency": null
            },
            "plans": {
                "final": false,
                "name": "plans",
                "id": 2131,
                "since": 88,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "PlanPrices",
                "dependency": null
            },
            "premiumBusinessPrices": {
                "final": false,
                "name": "premiumBusinessPrices",
                "id": 1866,
                "since": 68,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "PlanPrices",
                "dependency": null
            },
            "premiumPrices": {
                "final": false,
                "name": "premiumPrices",
                "id": 1473,
                "since": 39,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "PlanPrices",
                "dependency": null
            },
            "proPrices": {
                "final": false,
                "name": "proPrices",
                "id": 1474,
                "since": 39,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "PlanPrices",
                "dependency": null
            },
            "revolutionaryPrices": {
                "final": false,
                "name": "revolutionaryPrices",
                "id": 2079,
                "since": 86,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "PlanPrices",
                "dependency": null
            },
            "teamsBusinessPrices": {
                "final": false,
                "name": "teamsBusinessPrices",
                "id": 1867,
                "since": 68,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "PlanPrices",
                "dependency": null
            },
            "teamsPrices": {
                "final": false,
                "name": "teamsPrices",
                "id": 1729,
                "since": 57,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "PlanPrices",
                "dependency": null
            },
            "unlimitedPrices": {
                "final": false,
                "name": "unlimitedPrices",
                "id": 2083,
                "since": 86,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "PlanPrices",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "User": {
        "name": "User",
        "since": 1,
        "type": "ELEMENT_TYPE",
        "id": 84,
        "rootId": "A3N5cwBU",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 88,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 86,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 996,
                "since": 17,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 87,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "accountType": {
                "final": true,
                "name": "accountType",
                "id": 92,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "enabled": {
                "final": true,
                "name": "enabled",
                "id": 93,
                "since": 1,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "kdfVersion": {
                "final": true,
                "name": "kdfVersion",
                "id": 2132,
                "since": 89,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "requirePasswordUpdate": {
                "final": true,
                "name": "requirePasswordUpdate",
                "id": 1117,
                "since": 22,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            },
            "salt": {
                "final": true,
                "name": "salt",
                "id": 90,
                "since": 1,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "verifier": {
                "final": true,
                "name": "verifier",
                "id": 91,
                "since": 1,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "alarmInfoList": {
                "final": false,
                "name": "alarmInfoList",
                "id": 1552,
                "since": 48,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "UserAlarmInfoListType",
                "dependency": null
            },
            "auth": {
                "final": true,
                "name": "auth",
                "id": 1210,
                "since": 23,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "UserAuthentication",
                "dependency": null
            },
            "authenticatedDevices": {
                "final": true,
                "name": "authenticatedDevices",
                "id": 97,
                "since": 1,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "AuthenticatedDevice",
                "dependency": null
            },
            "customer": {
                "final": true,
                "name": "customer",
                "id": 99,
                "since": 1,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "Customer",
                "dependency": null
            },
            "externalAuthInfo": {
                "final": true,
                "name": "externalAuthInfo",
                "id": 98,
                "since": 1,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "UserExternalAuthInfo",
                "dependency": null
            },
            "failedLogins": {
                "final": true,
                "name": "failedLogins",
                "id": 101,
                "since": 1,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "Login",
                "dependency": null
            },
            "memberships": {
                "final": true,
                "name": "memberships",
                "id": 96,
                "since": 1,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "GroupMembership",
                "dependency": null
            },
            "pushIdentifierList": {
                "final": false,
                "name": "pushIdentifierList",
                "id": 638,
                "since": 5,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "PushIdentifierList",
                "dependency": null
            },
            "secondFactorAuthentications": {
                "final": true,
                "name": "secondFactorAuthentications",
                "id": 102,
                "since": 1,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "SecondFactorAuthentication",
                "dependency": null
            },
            "successfulLogins": {
                "final": true,
                "name": "successfulLogins",
                "id": 100,
                "since": 1,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "Login",
                "dependency": null
            },
            "userGroup": {
                "final": true,
                "name": "userGroup",
                "id": 95,
                "since": 1,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "GroupMembership",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "UserAlarmInfo": {
        "name": "UserAlarmInfo",
        "since": 48,
        "type": "LIST_ELEMENT_TYPE",
        "id": 1541,
        "rootId": "A3N5cwAGBQ",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1545,
                "since": 48,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1543,
                "since": 48,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 1547,
                "since": 48,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1546,
                "since": 48,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 2233,
                "since": 96,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 1544,
                "since": 48,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "alarmInfo": {
                "final": false,
                "name": "alarmInfo",
                "id": 1548,
                "since": 48,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "AlarmInfo",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "UserAlarmInfoListType": {
        "name": "UserAlarmInfoListType",
        "since": 48,
        "type": "AGGREGATED_TYPE",
        "id": 1549,
        "rootId": "A3N5cwAGDQ",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1550,
                "since": 48,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "alarms": {
                "final": true,
                "name": "alarms",
                "id": 1551,
                "since": 48,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "UserAlarmInfo",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "UserAreaGroups": {
        "name": "UserAreaGroups",
        "since": 17,
        "type": "AGGREGATED_TYPE",
        "id": 988,
        "rootId": "A3N5cwAD3A",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 989,
                "since": 17,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "list": {
                "final": true,
                "name": "list",
                "id": 990,
                "since": 17,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "GroupInfo",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "UserAuthentication": {
        "name": "UserAuthentication",
        "since": 23,
        "type": "AGGREGATED_TYPE",
        "id": 1206,
        "rootId": "A3N5cwAEtg",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1207,
                "since": 23,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "recoverCode": {
                "final": false,
                "name": "recoverCode",
                "id": 1416,
                "since": 36,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "ZeroOrOne",
                "refType": "RecoverCode",
                "dependency": null
            },
            "secondFactors": {
                "final": true,
                "name": "secondFactors",
                "id": 1209,
                "since": 23,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "SecondFactor",
                "dependency": null
            },
            "sessions": {
                "final": true,
                "name": "sessions",
                "id": 1208,
                "since": 23,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "Session",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "UserDataDelete": {
        "name": "UserDataDelete",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 404,
        "rootId": "A3N5cwABlA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 405,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "date": {
                "final": false,
                "name": "date",
                "id": 879,
                "since": 9,
                "type": "Date",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "restore": {
                "final": false,
                "name": "restore",
                "id": 406,
                "since": 1,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "user": {
                "final": false,
                "name": "user",
                "id": 407,
                "since": 1,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "User",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "UserExternalAuthInfo": {
        "name": "UserExternalAuthInfo",
        "since": 1,
        "type": "AGGREGATED_TYPE",
        "id": 77,
        "rootId": "A3N5cwBN",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 78,
                "since": 1,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "authUpdateCounter": {
                "final": false,
                "name": "authUpdateCounter",
                "id": 82,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "autoAuthenticationId": {
                "final": true,
                "name": "autoAuthenticationId",
                "id": 79,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "autoTransmitPassword": {
                "final": false,
                "name": "autoTransmitPassword",
                "id": 81,
                "since": 1,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "latestSaltHash": {
                "final": false,
                "name": "latestSaltHash",
                "id": 80,
                "since": 1,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {
            "variableAuthInfo": {
                "final": true,
                "name": "variableAuthInfo",
                "id": 83,
                "since": 1,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "VariableExternalAuthInfo",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "UserGroupKeyDistribution": {
        "name": "UserGroupKeyDistribution",
        "since": 101,
        "type": "ELEMENT_TYPE",
        "id": 2320,
        "rootId": "A3N5cwAJEA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 2324,
                "since": 101,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 2322,
                "since": 101,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 2325,
                "since": 101,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 2323,
                "since": 101,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "distributionEncUserGroupKey": {
                "final": true,
                "name": "distributionEncUserGroupKey",
                "id": 2326,
                "since": 101,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "userGroupKeyVersion": {
                "final": true,
                "name": "userGroupKeyVersion",
                "id": 2327,
                "since": 101,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "UserGroupKeyRotationData": {
        "name": "UserGroupKeyRotationData",
        "since": 101,
        "type": "AGGREGATED_TYPE",
        "id": 2352,
        "rootId": "A3N5cwAJMA",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 2353,
                "since": 101,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "adminGroupEncUserGroupKey": {
                "final": false,
                "name": "adminGroupEncUserGroupKey",
                "id": 2359,
                "since": 101,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "adminGroupKeyVersion": {
                "final": false,
                "name": "adminGroupKeyVersion",
                "id": 2360,
                "since": 101,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "authVerifier": {
                "final": false,
                "name": "authVerifier",
                "id": 2362,
                "since": 101,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "distributionKeyEncUserGroupKey": {
                "final": false,
                "name": "distributionKeyEncUserGroupKey",
                "id": 2355,
                "since": 101,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "passphraseEncUserGroupKey": {
                "final": false,
                "name": "passphraseEncUserGroupKey",
                "id": 2354,
                "since": 101,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "userGroupEncPreviousGroupKey": {
                "final": false,
                "name": "userGroupEncPreviousGroupKey",
                "id": 2357,
                "since": 101,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "userGroupKeyVersion": {
                "final": false,
                "name": "userGroupKeyVersion",
                "id": 2356,
                "since": 101,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "group": {
                "final": false,
                "name": "group",
                "id": 2361,
                "since": 101,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Group",
                "dependency": null
            },
            "keyPair": {
                "final": false,
                "name": "keyPair",
                "id": 2358,
                "since": 101,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "KeyPair",
                "dependency": null
            },
            "pubAdminGroupEncUserGroupKey": {
                "final": false,
                "name": "pubAdminGroupEncUserGroupKey",
                "id": 2470,
                "since": 111,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "PubEncKeyData",
                "dependency": null
            },
            "recoverCodeData": {
                "final": false,
                "name": "recoverCodeData",
                "id": 2363,
                "since": 101,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "RecoverCodeData",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "UserGroupKeyRotationPostIn": {
        "name": "UserGroupKeyRotationPostIn",
        "since": 111,
        "type": "DATA_TRANSFER_TYPE",
        "id": 2471,
        "rootId": "A3N5cwAJpw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 2472,
                "since": 111,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "userGroupKeyData": {
                "final": false,
                "name": "userGroupKeyData",
                "id": 2473,
                "since": 111,
                "type": "AGGREGATION",
                "cardinality": "One",
                "refType": "UserGroupKeyRotationData",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "UserGroupRoot": {
        "name": "UserGroupRoot",
        "since": 52,
        "type": "ELEMENT_TYPE",
        "id": 1618,
        "rootId": "A3N5cwAGUg",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1622,
                "since": 52,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1620,
                "since": 52,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1623,
                "since": 52,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 1621,
                "since": 52,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "groupKeyUpdates": {
                "final": false,
                "name": "groupKeyUpdates",
                "id": 2383,
                "since": 102,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "GroupKeyUpdatesRef",
                "dependency": null
            },
            "invitations": {
                "final": true,
                "name": "invitations",
                "id": 1624,
                "since": 52,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "ReceivedGroupInvitation",
                "dependency": null
            },
            "keyRotations": {
                "final": false,
                "name": "keyRotations",
                "id": 2294,
                "since": 96,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "KeyRotationsRef",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "VariableExternalAuthInfo": {
        "name": "VariableExternalAuthInfo",
        "since": 1,
        "type": "ELEMENT_TYPE",
        "id": 66,
        "rootId": "A3N5cwBC",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 70,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 68,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 995,
                "since": 17,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 69,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "authUpdateCounter": {
                "final": false,
                "name": "authUpdateCounter",
                "id": 76,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "lastSentTimestamp": {
                "final": false,
                "name": "lastSentTimestamp",
                "id": 75,
                "since": 1,
                "type": "Date",
                "cardinality": "One",
                "encrypted": false
            },
            "loggedInIpAddressHash": {
                "final": false,
                "name": "loggedInIpAddressHash",
                "id": 73,
                "since": 1,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "loggedInTimestamp": {
                "final": false,
                "name": "loggedInTimestamp",
                "id": 72,
                "since": 1,
                "type": "Date",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "loggedInVerifier": {
                "final": false,
                "name": "loggedInVerifier",
                "id": 71,
                "since": 1,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "sentCount": {
                "final": false,
                "name": "sentCount",
                "id": 74,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "VerifyRegistrationCodeData": {
        "name": "VerifyRegistrationCodeData",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 351,
        "rootId": "A3N5cwABXw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 352,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "authToken": {
                "final": false,
                "name": "authToken",
                "id": 353,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "code": {
                "final": false,
                "name": "code",
                "id": 354,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "Version": {
        "name": "Version",
        "since": 1,
        "type": "AGGREGATED_TYPE",
        "id": 480,
        "rootId": "A3N5cwAB4A",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 481,
                "since": 1,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "operation": {
                "final": false,
                "name": "operation",
                "id": 484,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "timestamp": {
                "final": false,
                "name": "timestamp",
                "id": 483,
                "since": 1,
                "type": "Date",
                "cardinality": "One",
                "encrypted": false
            },
            "version": {
                "final": false,
                "name": "version",
                "id": 482,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "author": {
                "final": false,
                "name": "author",
                "id": 485,
                "since": 1,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Group",
                "dependency": null
            },
            "authorGroupInfo": {
                "final": false,
                "name": "authorGroupInfo",
                "id": 486,
                "since": 1,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "GroupInfo",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "VersionData": {
        "name": "VersionData",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 487,
        "rootId": "A3N5cwAB5w",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 488,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "application": {
                "final": false,
                "name": "application",
                "id": 489,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "id": {
                "final": false,
                "name": "id",
                "id": 491,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "listId": {
                "final": false,
                "name": "listId",
                "id": 492,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "typeId": {
                "final": false,
                "name": "typeId",
                "id": 490,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "VersionInfo": {
        "name": "VersionInfo",
        "since": 1,
        "type": "LIST_ELEMENT_TYPE",
        "id": 237,
        "rootId": "A3N5cwAA7Q",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 241,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 239,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1023,
                "since": 17,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 240,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "app": {
                "final": false,
                "name": "app",
                "id": 242,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "operation": {
                "final": false,
                "name": "operation",
                "id": 246,
                "since": 1,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "referenceList": {
                "final": false,
                "name": "referenceList",
                "id": 244,
                "since": 1,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "timestamp": {
                "final": false,
                "name": "timestamp",
                "id": 245,
                "since": 1,
                "type": "Date",
                "cardinality": "One",
                "encrypted": false
            },
            "type": {
                "final": false,
                "name": "type",
                "id": 243,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "versionData": {
                "final": false,
                "name": "versionData",
                "id": 247,
                "since": 1,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            }
        },
        "associations": {
            "author": {
                "final": false,
                "name": "author",
                "id": 248,
                "since": 1,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Group",
                "dependency": null
            },
            "authorGroupInfo": {
                "final": true,
                "name": "authorGroupInfo",
                "id": 249,
                "since": 1,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "GroupInfo",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "VersionReturn": {
        "name": "VersionReturn",
        "since": 1,
        "type": "DATA_TRANSFER_TYPE",
        "id": 493,
        "rootId": "A3N5cwAB7Q",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 494,
                "since": 1,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "versions": {
                "final": false,
                "name": "versions",
                "id": 495,
                "since": 1,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "Version",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "WebauthnResponseData": {
        "name": "WebauthnResponseData",
        "since": 71,
        "type": "AGGREGATED_TYPE",
        "id": 1899,
        "rootId": "A3N5cwAHaw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1900,
                "since": 71,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "authenticatorData": {
                "final": true,
                "name": "authenticatorData",
                "id": 1903,
                "since": 71,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "clientData": {
                "final": true,
                "name": "clientData",
                "id": 1902,
                "since": 71,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "keyHandle": {
                "final": true,
                "name": "keyHandle",
                "id": 1901,
                "since": 71,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            },
            "signature": {
                "final": true,
                "name": "signature",
                "id": 1904,
                "since": 71,
                "type": "Bytes",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "WebsocketCounterData": {
        "name": "WebsocketCounterData",
        "since": 41,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1492,
        "rootId": "A3N5cwAF1A",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1493,
                "since": 41,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "mailGroup": {
                "final": false,
                "name": "mailGroup",
                "id": 1494,
                "since": 41,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "counterValues": {
                "final": false,
                "name": "counterValues",
                "id": 1495,
                "since": 41,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "WebsocketCounterValue",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "WebsocketCounterValue": {
        "name": "WebsocketCounterValue",
        "since": 41,
        "type": "AGGREGATED_TYPE",
        "id": 1488,
        "rootId": "A3N5cwAF0A",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1489,
                "since": 41,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            },
            "count": {
                "final": false,
                "name": "count",
                "id": 1491,
                "since": 41,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "counterId": {
                "final": false,
                "name": "counterId",
                "id": 1490,
                "since": 41,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "WebsocketEntityData": {
        "name": "WebsocketEntityData",
        "since": 41,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1483,
        "rootId": "A3N5cwAFyw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1484,
                "since": 41,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "eventBatchId": {
                "final": false,
                "name": "eventBatchId",
                "id": 1485,
                "since": 41,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "eventBatchOwner": {
                "final": false,
                "name": "eventBatchOwner",
                "id": 1486,
                "since": 41,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "eventBatch": {
                "final": false,
                "name": "eventBatch",
                "id": 1487,
                "since": 41,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "EntityUpdate",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "WebsocketLeaderStatus": {
        "name": "WebsocketLeaderStatus",
        "since": 64,
        "type": "DATA_TRANSFER_TYPE",
        "id": 1766,
        "rootId": "A3N5cwAG5g",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1767,
                "since": 64,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "leaderStatus": {
                "final": false,
                "name": "leaderStatus",
                "id": 1768,
                "since": 64,
                "type": "Boolean",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {},
        "app": "sys",
        "version": "111"
    },
    "WhitelabelChild": {
        "name": "WhitelabelChild",
        "since": 26,
        "type": "LIST_ELEMENT_TYPE",
        "id": 1257,
        "rootId": "A3N5cwAE6Q",
        "versioned": false,
        "encrypted": true,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1261,
                "since": 26,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1259,
                "since": 26,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerEncSessionKey": {
                "final": true,
                "name": "_ownerEncSessionKey",
                "id": 1263,
                "since": 26,
                "type": "Bytes",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1262,
                "since": 26,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_ownerKeyVersion": {
                "final": true,
                "name": "_ownerKeyVersion",
                "id": 2230,
                "since": 96,
                "type": "Number",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 1260,
                "since": 26,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "comment": {
                "final": false,
                "name": "comment",
                "id": 1267,
                "since": 26,
                "type": "String",
                "cardinality": "One",
                "encrypted": true
            },
            "createdDate": {
                "final": true,
                "name": "createdDate",
                "id": 1265,
                "since": 26,
                "type": "Date",
                "cardinality": "One",
                "encrypted": false
            },
            "deletedDate": {
                "final": false,
                "name": "deletedDate",
                "id": 1266,
                "since": 26,
                "type": "Date",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "mailAddress": {
                "final": true,
                "name": "mailAddress",
                "id": 1264,
                "since": 26,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "customer": {
                "final": true,
                "name": "customer",
                "id": 1268,
                "since": 26,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Customer",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "WhitelabelChildrenRef": {
        "name": "WhitelabelChildrenRef",
        "since": 26,
        "type": "AGGREGATED_TYPE",
        "id": 1269,
        "rootId": "A3N5cwAE9Q",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1270,
                "since": 26,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "items": {
                "final": true,
                "name": "items",
                "id": 1271,
                "since": 26,
                "type": "LIST_ASSOCIATION",
                "cardinality": "One",
                "refType": "WhitelabelChild",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "WhitelabelConfig": {
        "name": "WhitelabelConfig",
        "since": 22,
        "type": "ELEMENT_TYPE",
        "id": 1127,
        "rootId": "A3N5cwAEZw",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_format": {
                "final": false,
                "name": "_format",
                "id": 1131,
                "since": 22,
                "type": "Number",
                "cardinality": "One",
                "encrypted": false
            },
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1129,
                "since": 22,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "_ownerGroup": {
                "final": true,
                "name": "_ownerGroup",
                "id": 1132,
                "since": 22,
                "type": "GeneratedId",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "_permissions": {
                "final": true,
                "name": "_permissions",
                "id": 1130,
                "since": 22,
                "type": "GeneratedId",
                "cardinality": "One",
                "encrypted": false
            },
            "germanLanguageCode": {
                "final": false,
                "name": "germanLanguageCode",
                "id": 1308,
                "since": 28,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "imprintUrl": {
                "final": false,
                "name": "imprintUrl",
                "id": 1425,
                "since": 37,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "jsonTheme": {
                "final": false,
                "name": "jsonTheme",
                "id": 1133,
                "since": 22,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "metaTags": {
                "final": false,
                "name": "metaTags",
                "id": 1281,
                "since": 26,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            },
            "privacyStatementUrl": {
                "final": false,
                "name": "privacyStatementUrl",
                "id": 1496,
                "since": 42,
                "type": "String",
                "cardinality": "ZeroOrOne",
                "encrypted": false
            },
            "whitelabelCode": {
                "final": false,
                "name": "whitelabelCode",
                "id": 1727,
                "since": 56,
                "type": "String",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "bootstrapCustomizations": {
                "final": false,
                "name": "bootstrapCustomizations",
                "id": 1252,
                "since": 24,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "BootstrapFeature",
                "dependency": null
            },
            "certificateInfo": {
                "final": false,
                "name": "certificateInfo",
                "id": 1506,
                "since": 44,
                "type": "AGGREGATION",
                "cardinality": "ZeroOrOne",
                "refType": "CertificateInfo",
                "dependency": null
            },
            "whitelabelRegistrationDomains": {
                "final": false,
                "name": "whitelabelRegistrationDomains",
                "id": 1728,
                "since": 56,
                "type": "AGGREGATION",
                "cardinality": "Any",
                "refType": "StringWrapper",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    },
    "WhitelabelParent": {
        "name": "WhitelabelParent",
        "since": 26,
        "type": "AGGREGATED_TYPE",
        "id": 1272,
        "rootId": "A3N5cwAE-A",
        "versioned": false,
        "encrypted": false,
        "values": {
            "_id": {
                "final": true,
                "name": "_id",
                "id": 1273,
                "since": 26,
                "type": "CustomId",
                "cardinality": "One",
                "encrypted": false
            }
        },
        "associations": {
            "customer": {
                "final": true,
                "name": "customer",
                "id": 1274,
                "since": 26,
                "type": "ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "Customer",
                "dependency": null
            },
            "whitelabelChildInParent": {
                "final": true,
                "name": "whitelabelChildInParent",
                "id": 1275,
                "since": 26,
                "type": "LIST_ELEMENT_ASSOCIATION",
                "cardinality": "One",
                "refType": "WhitelabelChild",
                "dependency": null
            }
        },
        "app": "sys",
        "version": "111"
    }
}