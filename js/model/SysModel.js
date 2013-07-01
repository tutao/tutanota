"use strict";

goog.provide('tutao.tutanota.model.sys_model');

tutao.tutanota.model.sys_model = {
name: "sys",
version: "1",
types: {
  KeyPair: {
    name: "KeyPair",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "0",
    rootId: "A3N5cwAA",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "1", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "pubKey", id: "2", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "symEncPrivKey", id: "3", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "version", id: "4", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  Group: {
    name: "Group",
    since: "1",
    type: "ELEMENT_TYPE",
    id: "5",
    rootId: "A3N5cwAF",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_format", id: "8", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_id", id: "6", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_permissions", id: "7", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "mailAddress", id: "11", since: "1", type: "String", cardinality: "ZeroOrOne", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "name", id: "10", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true", searchable: "false", sortable: "false"},
      { name: "type", id: "9", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "keys", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "KeyPair", final: "false" },
      { name: "admin", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "GroupAdminship" },
      { name: "adminships", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "Any", refType: "GroupAdminship" },
      { name: "customer", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "Customer" },
      { name: "invitations", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "GroupInvitation" },
      { name: "members", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "Any", refType: "User" },
      { name: "ownedPermissions", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "GroupToPermissions" },
    ]
  },
  GroupMembership: {
    name: "GroupMembership",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "13",
    rootId: "A3N5cwAN",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "14", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "admin", id: "16", since: "1", type: "Boolean", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "symEncGKey", id: "15", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "group", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
    ]
  },
  Customer: {
    name: "Customer",
    since: "1",
    type: "ELEMENT_TYPE",
    id: "18",
    rootId: "A3N5cwAS",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_format", id: "21", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_id", id: "19", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_permissions", id: "20", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "address", id: "26", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true", searchable: "false", sortable: "false"},
      { name: "company", id: "22", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true", searchable: "false", sortable: "false"},
      { name: "firstName", id: "23", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true", searchable: "false", sortable: "false"},
      { name: "genderMale", id: "25", since: "1", type: "Boolean", cardinality: "One", final: "false", enrypted: "true", searchable: "false", sortable: "false"},
      { name: "lastName", id: "24", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "adminGroup", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
      { name: "customerGroup", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
    ]
  },
  AuthenticationInfo: {
    name: "AuthenticationInfo",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "29",
    rootId: "A3N5cwAd",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "32", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_id", id: "30", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_permissions", id: "31", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "authToken", id: "33", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "verifier", id: "34", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  AuthenticatedDevice: {
    name: "AuthenticatedDevice",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "35",
    rootId: "A3N5cwAj",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "36", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "authType", id: "37", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "deviceKey", id: "39", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "deviceToken", id: "38", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  Login: {
    name: "Login",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "40",
    rootId: "A3N5cwAo",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "43", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_id", id: "41", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_permissions", id: "42", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "time", id: "44", since: "1", type: "Date", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  User: {
    name: "User",
    since: "1",
    type: "ELEMENT_TYPE",
    id: "45",
    rootId: "A3N5cwAt",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "48", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_id", id: "46", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_permissions", id: "47", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "external", id: "53", since: "1", type: "Boolean", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "mobilePhoneNumber", id: "49", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "pwEncClientKey", id: "50", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "salt", id: "51", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "verifier", id: "52", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "authenticatedDevices", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "AuthenticatedDevice", final: "false" },
      { name: "memberships", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "GroupMembership", final: "false" },
      { name: "userGroup", since: "1", type: "AGGREGATION", cardinality: "One", refType: "GroupMembership", final: "false" },
      { name: "customer", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "Customer" },
      { name: "extAuthInfos", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "AuthenticationInfo" },
      { name: "failedLogins", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "Login" },
      { name: "successfulLogins", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "Login" },
    ]
  },
  BucketPermission: {
    name: "BucketPermission",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "61",
    rootId: "A3N5cwA9",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "64", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_id", id: "62", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_permissions", id: "63", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "ops", id: "69", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "pubEncBucketKey", id: "67", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "pubKeyVersion", id: "68", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "symEncBucketKey", id: "66", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "type", id: "65", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "group", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
    ]
  },
  Permission: {
    name: "Permission",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "71",
    rootId: "A3N5cwBH",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "74", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_id", id: "72", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_permissions", id: "73", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "bucketEncSessionKey", id: "77", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "ops", id: "78", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "symEncSessionKey", id: "76", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "type", id: "75", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "bucket", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "BucketPermission" },
      { name: "group", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "Group" },
    ]
  },
  GroupToPermissions: {
    name: "GroupToPermissions",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "81",
    rootId: "A3N5cwBR",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "84", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_id", id: "82", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_permissions", id: "83", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  System: {
    name: "System",
    since: "1",
    type: "ELEMENT_TYPE",
    id: "85",
    rootId: "A3N5cwBV",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "88", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_id", id: "86", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_permissions", id: "87", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "customers", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "Any", refType: "Customer" },
      { name: "freeGroup", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
      { name: "premiumGroup", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
      { name: "starterGroup", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
      { name: "streamGroup", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
      { name: "systemGroup", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
    ]
  },
  GroupAdminship: {
    name: "GroupAdminship",
    since: "1",
    type: "ELEMENT_TYPE",
    id: "95",
    rootId: "A3N5cwBf",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "98", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_id", id: "96", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_permissions", id: "97", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "pubEncGKey", id: "99", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "pubKeyVersion", id: "100", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "group", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
    ]
  },
  GroupInvitation: {
    name: "GroupInvitation",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "102",
    rootId: "A3N5cwBm",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "105", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_id", id: "103", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_permissions", id: "104", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "pubEncGKey", id: "106", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "group", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
      { name: "invited", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "User" },
      { name: "invitor", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "User" },
    ]
  },
  MailAddressToGroup: {
    name: "MailAddressToGroup",
    since: "1",
    type: "ELEMENT_TYPE",
    id: "110",
    rootId: "A3N5cwBu",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "113", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_id", id: "111", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_permissions", id: "112", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "external", id: "114", since: "1", type: "Boolean", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "group", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
    ]
  },
  RootInstance: {
    name: "RootInstance",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "122",
    rootId: "A3N5cwB6",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "125", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_id", id: "123", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_permissions", id: "124", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "reference", id: "126", since: "1", type: "GeneratedId", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  RegistrationData: {
    name: "RegistrationData",
    since: "1",
    type: "ELEMENT_TYPE",
    id: "127",
    rootId: "A3N5cwB_",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_format", id: "130", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_id", id: "128", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_permissions", id: "129", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "accountType", id: "131", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "address", id: "137", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "code", id: "141", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "company", id: "132", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "firstName", id: "134", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "groupName", id: "133", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "lastName", id: "135", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "mailAddress", id: "138", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "mobilePhoneNumber", id: "136", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "state", id: "139", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "verifyCount", id: "140", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  VersionInfo: {
    name: "VersionInfo",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "142",
    rootId: "A3N5cwAAjg",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "145", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_id", id: "143", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_permissions", id: "144", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "app", id: "146", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "operation", id: "150", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "referenceList", id: "148", since: "1", type: "GeneratedId", cardinality: "ZeroOrOne", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "timestamp", id: "149", since: "1", type: "Date", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "type", id: "147", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "versionData", id: "151", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "author", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
    ]
  },
  ListVersionInfo: {
    name: "ListVersionInfo",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "153",
    rootId: "A3N5cwAAmQ",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "156", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_id", id: "154", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_permissions", id: "155", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "operation", id: "158", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "timestamp", id: "157", since: "1", type: "Date", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "author", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
      { name: "version", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "VersionInfo" },
    ]
  },
  IncomingShare: {
    name: "IncomingShare",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "161",
    rootId: "A3N5cwAAoQ",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "164", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_id", id: "162", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_permissions", id: "163", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "app", id: "165", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "referenceId", id: "168", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "referenceListId", id: "167", since: "1", type: "GeneratedId", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "shareType", id: "166", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "bucketPermission", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "BucketPermission" },
      { name: "ownerGroup", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
    ]
  },
  OutgoingShare: {
    name: "OutgoingShare",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "171",
    rootId: "A3N5cwAAqw",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "174", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_id", id: "172", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_permissions", id: "173", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "app", id: "175", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "referenceId", id: "178", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "referenceListId", id: "177", since: "1", type: "GeneratedId", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "shareType", id: "176", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "shareholderMailAddress", id: "179", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "bucketPermission", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "BucketPermission" },
    ]
  },
  Shares: {
    name: "Shares",
    since: "1",
    type: "ELEMENT_TYPE",
    id: "181",
    rootId: "A3N5cwAAtQ",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "184", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_id", id: "182", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_permissions", id: "183", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "incoming", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "IncomingShare" },
      { name: "outgoing", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "OutgoingShare" },
    ]
  },
  ShareService: {
    name: "ShareService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "187",
    rootId: "A3N5cwAAuw",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "188", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "app", id: "189", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "bucket", id: "193", since: "1", type: "GeneratedId", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "instancePermissions", id: "192", since: "1", type: "GeneratedId", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "pubEncBucketKey", id: "195", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "pubKeyVersion", id: "196", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "shareType", id: "190", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "shareholderMailAddress", id: "191", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "writePermission", id: "194", since: "1", type: "Boolean", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  SystemKeysService: {
    name: "SystemKeysService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "197",
    rootId: "A3N5cwAAxQ",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "198", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "freeGroupKey", id: "201", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "premiumGroupKey", id: "202", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "starterGroupKey", id: "203", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "systemPubKey", id: "199", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "systemPubKeyVersion", id: "200", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  MailAddressAvailabilityService: {
    name: "MailAddressAvailabilityService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "204",
    rootId: "A3N5cwAAzA",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "205", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "available", id: "206", since: "1", type: "Boolean", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  RegistrationLinkService: {
    name: "RegistrationLinkService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "207",
    rootId: "A3N5cwAAzw",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "208", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "accountType", id: "209", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "address", id: "215", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "company", id: "211", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "firstName", id: "212", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "groupName", id: "210", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "lastName", id: "213", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "mailAddress", id: "216", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "mobilePhoneNumber", id: "214", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  RegistrationDataService: {
    name: "RegistrationDataService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "217",
    rootId: "A3N5cwAA2Q",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "218", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "accountType", id: "219", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "address", id: "225", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "company", id: "221", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "firstName", id: "222", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "groupName", id: "220", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "lastName", id: "223", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "mailAddress", id: "226", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "mobilePhoneNumber", id: "224", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "state", id: "227", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  TestCustomerRegistrationService: {
    name: "TestCustomerRegistrationService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "228",
    rootId: "A3N5cwAA5A",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "229", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "accountType", id: "230", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "mobilePhoneNumber", id: "231", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  SendRegistrationCodeService: {
    name: "SendRegistrationCodeService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "232",
    rootId: "A3N5cwAA6A",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "233", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "accountType", id: "235", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "authToken", id: "234", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "mobilePhoneNumber", id: "236", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  VerifyRegistrationCodeService: {
    name: "VerifyRegistrationCodeService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "237",
    rootId: "A3N5cwAA7Q",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "238", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "authToken", id: "239", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "code", id: "240", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  CustomerService: {
    name: "CustomerService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "241",
    rootId: "A3N5cwAA8Q",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "242", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "address", id: "248", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "adminEncAdminSessionKey", id: "251", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "adminEncCustomerSessionKey", id: "254", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "adminEncPrivKey", id: "250", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "adminEncUserSessionKey", id: "255", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "adminGroupName", id: "256", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "adminPubEncCustomerKey", id: "253", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "adminPubEncUserKey", id: "252", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "adminPubKey", id: "249", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "authToken", id: "243", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "company", id: "244", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "customerBucketEncCustomerSessionKey", id: "272", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "customerEncAdminSessionKey", id: "270", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "customerEncCustomerSessionKey", id: "268", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "customerEncPrivKey", id: "267", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "customerEncUserSessionKey", id: "269", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "customerGroupName", id: "271", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "customerPubKey", id: "266", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "firstName", id: "245", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "genderMale", id: "247", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "lastName", id: "246", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "pwEncClientKey", id: "265", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "pwEncUserKey", id: "264", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "salt", id: "275", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "symEncAccountGroupKey", id: "277", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "systemPubEncCustomerBucketKey", id: "273", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "systemPubKeyVersion", id: "274", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "userEncAdminKey", id: "260", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "userEncCustomerKey", id: "261", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "userEncPrivKey", id: "258", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "userEncUserSessionKey", id: "259", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "userGroupMailAddress", id: "263", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "userGroupName", id: "262", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "userPubKey", id: "257", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "verifier", id: "276", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  UserService: {
    name: "UserService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "278",
    rootId: "A3N5cwABFg",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "279", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "adminEncUserSessionKey", id: "291", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "adminPubEncUserKey", id: "288", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "adminPubKeyVersion", id: "289", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "customerEncUserSessionKey", id: "290", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "mobilePhoneNumber", id: "294", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "pwEncClientKey", id: "281", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "pwEncUserKey", id: "280", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "salt", id: "292", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "userEncCustomerKey", id: "285", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "userEncPrivKey", id: "283", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "userEncUserSessionKey", id: "284", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "userGroupMailAddress", id: "287", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "userGroupName", id: "286", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "userPubKey", id: "282", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "verifier", id: "293", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  PublicKeyService: {
    name: "PublicKeyService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "295",
    rootId: "A3N5cwABJw",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "296", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "pubKey", id: "297", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "pubKeyVersion", id: "298", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  SaltService: {
    name: "SaltService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "299",
    rootId: "A3N5cwABKw",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "300", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "salt", id: "301", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  UserIdService: {
    name: "UserIdService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "302",
    rootId: "A3N5cwABLg",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "303", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "userId", id: "304", since: "1", type: "GeneratedId", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  AutoLoginService: {
    name: "AutoLoginService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "305",
    rootId: "A3N5cwABMQ",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "306", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "deviceKey", id: "307", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  UpdatePermissionKeyService: {
    name: "UpdatePermissionKeyService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "308",
    rootId: "A3N5cwABNA",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "309", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "bucketEncSessionKey", id: "311", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "symEncBucketKey", id: "312", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "symEncSessionKey", id: "310", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "bucketPermission", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "BucketPermission" },
      { name: "permission", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "Permission" },
    ]
  },
  Authentication: {
    name: "Authentication",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "315",
    rootId: "A3N5cwABOw",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "316", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "authVerifier", id: "318", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "userId", id: "317", since: "1", type: "GeneratedId", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  Chat: {
    name: "Chat",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "319",
    rootId: "A3N5cwABPw",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "320", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "recipient", id: "322", since: "1", type: "GeneratedId", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "sender", id: "321", since: "1", type: "GeneratedId", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "text", id: "323", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  EntityUpdate: {
    name: "EntityUpdate",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "324",
    rootId: "A3N5cwABRA",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "325", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "application", id: "326", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "instanceId", id: "329", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "instanceListId", id: "328", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "type", id: "327", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  Exception: {
    name: "Exception",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "330",
    rootId: "A3N5cwABSg",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "331", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "msg", id: "333", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "type", id: "332", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  WebsocketWrapper: {
    name: "WebsocketWrapper",
    since: "1",
    type: "SERVICE_TYPE",
    id: "334",
    rootId: "A3N5cwABTg",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "335", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "msgId", id: "336", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "type", id: "337", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "authentication", since: "1", type: "AGGREGATION", cardinality: "ZeroOrOne", refType: "Authentication", final: "false" },
      { name: "chat", since: "1", type: "AGGREGATION", cardinality: "ZeroOrOne", refType: "Chat", final: "false" },
      { name: "entityUpdate", since: "1", type: "AGGREGATION", cardinality: "ZeroOrOne", refType: "EntityUpdate", final: "false" },
      { name: "exception", since: "1", type: "AGGREGATION", cardinality: "ZeroOrOne", refType: "Exception", final: "false" },
    ]
  },
  Version: {
    name: "Version",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "342",
    rootId: "A3N5cwABVg",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "343", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "operation", id: "346", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "timestamp", id: "345", since: "1", type: "Date", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "version", id: "344", since: "1", type: "GeneratedId", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "author", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
    ]
  },
  VersionService: {
    name: "VersionService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "348",
    rootId: "A3N5cwABXA",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "349", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "versions", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "Version", final: "false" },
    ]
  },
  SmsMonitorTriggerService: {
    name: "SmsMonitorTriggerService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "351",
    rootId: "A3N5cwABXw",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "352", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "networkOperatorIds", id: "354", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "smsFacadeIds", id: "353", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  AddUserToGroupService: {
    name: "AddUserToGroupService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "355",
    rootId: "A3N5cwABYw",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "356", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "symEncGKey", id: "357", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "group", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
      { name: "user", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "User" },
    ]
  },
} };
