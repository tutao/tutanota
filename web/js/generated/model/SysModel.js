"use strict";

goog.provide('tutao.tutanota.model.sys_model');

tutao.tutanota.model.sys_model = {
name: "sys",
version: "4",
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
      { name: "_id", id: "1", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "pubKey", id: "2", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
      { name: "symEncPrivKey", id: "3", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
      { name: "version", id: "4", since: "1", type: "Number", cardinality: "One", final: "true", enrypted: "false"},
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
    encrypted: false,
    values: [
      { name: "_format", id: "9", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "7", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "8", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "adminGroupEncGKey", id: "11", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "true", enrypted: "false"},
      { name: "enabled", id: "12", since: "1", type: "Boolean", cardinality: "One", final: "true", enrypted: "false"},
      { name: "type", id: "10", since: "1", type: "Number", cardinality: "One", final: "true", enrypted: "false"},
    ], associations: [
      { name: "keys", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "KeyPair", final: "true" },
      { name: "admin", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "Group" },
      { name: "customer", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "Customer" },
      { name: "groupInfo", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "GroupInfo" },
      { name: "invitations", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "GroupInvitation" },
      { name: "members", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "GroupMember" },
      { name: "user", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "User" },
    ]
  },
  GroupInfo: {
    name: "GroupInfo",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "14",
    rootId: "A3N5cwAO",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_format", id: "18", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "16", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_listEncSessionKey", id: "19", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "_permissions", id: "17", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "created", id: "23", since: "1", type: "Date", cardinality: "One", final: "true", enrypted: "false"},
      { name: "deleted", id: "24", since: "1", type: "Date", cardinality: "ZeroOrOne", final: "true", enrypted: "false"},
      { name: "mailAddress", id: "22", since: "1", type: "String", cardinality: "ZeroOrOne", final: "true", enrypted: "false"},
      { name: "name", id: "21", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true"},
    ], associations: [
      { name: "group", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
    ]
  },
  GroupMembership: {
    name: "GroupMembership",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "25",
    rootId: "A3N5cwAZ",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "26", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "admin", id: "28", since: "1", type: "Boolean", cardinality: "One", final: "true", enrypted: "false"},
      { name: "symEncGKey", id: "27", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
    ], associations: [
      { name: "group", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
      { name: "groupInfo", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "GroupInfo" },
      { name: "groupMember", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "GroupMember" },
    ]
  },
  Customer: {
    name: "Customer",
    since: "1",
    type: "ELEMENT_TYPE",
    id: "31",
    rootId: "A3N5cwAf",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "35", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "33", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "34", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "type", id: "36", since: "1", type: "Number", cardinality: "One", final: "true", enrypted: "false"},
    ], associations: [
      { name: "adminGroup", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
      { name: "adminGroups", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "GroupInfo" },
      { name: "customerGroup", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
      { name: "customerGroups", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "GroupInfo" },
      { name: "customerInfo", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "CustomerInfo" },
      { name: "teamGroups", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "GroupInfo" },
      { name: "userGroups", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "GroupInfo" },
    ]
  },
  AuthenticatedDevice: {
    name: "AuthenticatedDevice",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "43",
    rootId: "A3N5cwAr",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "44", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "authType", id: "45", since: "1", type: "Number", cardinality: "One", final: "true", enrypted: "false"},
      { name: "deviceKey", id: "47", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
      { name: "deviceToken", id: "46", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false"},
    ], associations: [
    ]
  },
  Login: {
    name: "Login",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "48",
    rootId: "A3N5cwAw",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "52", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "50", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "51", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "time", id: "53", since: "1", type: "Date", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  SecondFactorAuthentication: {
    name: "SecondFactorAuthentication",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "54",
    rootId: "A3N5cwA2",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "58", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "56", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "57", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "code", id: "59", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "finished", id: "61", since: "1", type: "Boolean", cardinality: "One", final: "false", enrypted: "false"},
      { name: "service", id: "62", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "verifyCount", id: "60", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  PhoneNumber: {
    name: "PhoneNumber",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "63",
    rootId: "A3N5cwA_",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "64", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "number", id: "65", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false"},
    ], associations: [
    ]
  },
  VariableExternalAuthInfo: {
    name: "VariableExternalAuthInfo",
    since: "1",
    type: "ELEMENT_TYPE",
    id: "66",
    rootId: "A3N5cwBC",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "70", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "68", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "69", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "authUpdateCounter", id: "76", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "lastSentTimestamp", id: "75", since: "1", type: "Date", cardinality: "One", final: "false", enrypted: "false"},
      { name: "loggedInIpAddressHash", id: "73", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "loggedInTimestamp", id: "72", since: "1", type: "Date", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "loggedInVerifier", id: "71", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "sentCount", id: "74", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  UserExternalAuthInfo: {
    name: "UserExternalAuthInfo",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "77",
    rootId: "A3N5cwBN",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "78", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "authUpdateCounter", id: "82", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "autoAuthenticationId", id: "79", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "autoTransmitPassword", id: "81", since: "1", type: "String", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "latestSaltHash", id: "80", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
    ], associations: [
      { name: "variableAuthInfo", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "VariableExternalAuthInfo" },
    ]
  },
  User: {
    name: "User",
    since: "1",
    type: "ELEMENT_TYPE",
    id: "84",
    rootId: "A3N5cwBU",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "88", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "86", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "87", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "accountType", id: "92", since: "1", type: "Number", cardinality: "One", final: "true", enrypted: "false"},
      { name: "enabled", id: "93", since: "1", type: "Boolean", cardinality: "One", final: "true", enrypted: "false"},
      { name: "salt", id: "90", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "true", enrypted: "false"},
      { name: "userEncClientKey", id: "89", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
      { name: "verifier", id: "91", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
    ], associations: [
      { name: "authenticatedDevices", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "AuthenticatedDevice", final: "true" },
      { name: "externalAuthInfo", since: "1", type: "AGGREGATION", cardinality: "ZeroOrOne", refType: "UserExternalAuthInfo", final: "true" },
      { name: "memberships", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "GroupMembership", final: "true" },
      { name: "phoneNumbers", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "PhoneNumber", final: "true" },
      { name: "userGroup", since: "1", type: "AGGREGATION", cardinality: "One", refType: "GroupMembership", final: "true" },
      { name: "customer", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "Customer" },
      { name: "failedLogins", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "Login" },
      { name: "secondFactorAuthentications", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "SecondFactorAuthentication" },
      { name: "successfulLogins", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "Login" },
    ]
  },
  ExternalUserReference: {
    name: "ExternalUserReference",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "103",
    rootId: "A3N5cwBn",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "107", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "105", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "106", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
    ], associations: [
      { name: "user", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "User" },
      { name: "userGroup", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
    ]
  },
  GroupRoot: {
    name: "GroupRoot",
    since: "1",
    type: "ELEMENT_TYPE",
    id: "110",
    rootId: "A3N5cwBu",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "114", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "112", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "113", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "groupShareBucketId", id: "115", since: "1", type: "GeneratedId", cardinality: "One", final: "false", enrypted: "false"},
      { name: "symEncShareBucketKey", id: "598", since: "2", type: "Bytes", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
    ], associations: [
      { name: "externalGroupInfos", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "GroupInfo" },
      { name: "externalUserReferences", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "ExternalUserReference" },
    ]
  },
  BucketPermission: {
    name: "BucketPermission",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "118",
    rootId: "A3N5cwB2",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "122", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "120", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "121", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "ops", id: "127", since: "1", type: "String", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "pubEncBucketKey", id: "125", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "pubKeyVersion", id: "126", since: "1", type: "Number", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "symEncBucketKey", id: "124", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "type", id: "123", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "group", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
    ]
  },
  Bucket: {
    name: "Bucket",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "129",
    rootId: "A3N5cwAAgQ",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "130", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
    ], associations: [
      { name: "bucketPermissions", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "BucketPermission" },
    ]
  },
  Permission: {
    name: "Permission",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "132",
    rootId: "A3N5cwAAhA",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "136", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "134", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "135", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "bucketEncSessionKey", id: "139", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "ops", id: "140", since: "1", type: "String", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "symEncSessionKey", id: "138", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "type", id: "137", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "bucket", since: "1", type: "AGGREGATION", cardinality: "ZeroOrOne", refType: "Bucket", final: "false" },
      { name: "group", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "Group" },
    ]
  },
  AccountingInfo: {
    name: "AccountingInfo",
    since: "1",
    type: "ELEMENT_TYPE",
    id: "143",
    rootId: "A3N5cwAAjw",
    versioned: true,
    encrypted: true,
    values: [
      { name: "_format", id: "147", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "145", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "146", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "lastInvoiceNbrOfSentSms", id: "593", since: "2", type: "Number", cardinality: "One", final: "true", enrypted: "false"},
      { name: "lastInvoiceTimestamp", id: "592", since: "2", type: "Date", cardinality: "ZeroOrOne", final: "true", enrypted: "false"},
    ], associations: [
    ]
  },
  CustomerInfo: {
    name: "CustomerInfo",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "148",
    rootId: "A3N5cwAAlA",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "152", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "150", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "151", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "activationTime", id: "157", since: "1", type: "Date", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "company", id: "153", since: "1", type: "String", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "creationTime", id: "155", since: "1", type: "Date", cardinality: "One", final: "true", enrypted: "false"},
      { name: "domain", id: "154", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false"},
      { name: "registrationMailAddress", id: "597", since: "2", type: "String", cardinality: "One", final: "true", enrypted: "false"},
      { name: "testEndTime", id: "156", since: "1", type: "Date", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
    ], associations: [
      { name: "accountingInfo", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "AccountingInfo" },
      { name: "customer", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Customer" },
    ]
  },
  RegistrationData: {
    name: "RegistrationData",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "161",
    rootId: "A3N5cwAAoQ",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "165", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "163", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "164", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "accountType", id: "166", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "code", id: "176", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "company", id: "169", since: "1", type: "String", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "domain", id: "170", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "domainVerificationMailSentOn", id: "168", since: "1", type: "Date", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "groupName", id: "171", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "language", id: "167", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "mailAddress", id: "173", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "mobilePhoneNumber", id: "172", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "state", id: "174", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "verifyCount", id: "175", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  System: {
    name: "System",
    since: "1",
    type: "ELEMENT_TYPE",
    id: "177",
    rootId: "A3N5cwAAsQ",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "181", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "179", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "180", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "lastInvoiceNbr", id: "591", since: "2", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "freeCustomerInfos", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "CustomerInfo" },
      { name: "freeGroup", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
      { name: "premiumCustomerInfos", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "CustomerInfo" },
      { name: "premiumGroup", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
      { name: "registrationDataList", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "RegistrationData" },
      { name: "starterCustomerInfos", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "CustomerInfo" },
      { name: "starterGroup", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
      { name: "streamCustomerInfos", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "CustomerInfo" },
      { name: "streamGroup", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
      { name: "systemAdminGroup", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
      { name: "systemCustomer", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Customer" },
      { name: "systemCustomerInfo", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "CustomerInfo" },
      { name: "systemUserGroup", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
    ]
  },
  GroupInvitation: {
    name: "GroupInvitation",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "195",
    rootId: "A3N5cwAAww",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "199", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "197", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "198", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "pubEncGKey", id: "200", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
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
    id: "204",
    rootId: "A3N5cwAAzA",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "208", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "206", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "207", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
    ], associations: [
      { name: "internalGroup", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "Group" },
    ]
  },
  DomainToCustomer: {
    name: "DomainToCustomer",
    since: "1",
    type: "ELEMENT_TYPE",
    id: "210",
    rootId: "A3N5cwAA0g",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "214", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "212", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "213", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
    ], associations: [
      { name: "customer", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Customer" },
    ]
  },
  GroupMember: {
    name: "GroupMember",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "216",
    rootId: "A3N5cwAA2A",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "220", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "218", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "219", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
    ], associations: [
      { name: "group", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
      { name: "user", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "User" },
      { name: "userGroupInfo", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "GroupInfo" },
    ]
  },
  RootInstance: {
    name: "RootInstance",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "231",
    rootId: "A3N5cwAA5w",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "235", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "233", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "234", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "reference", id: "236", since: "1", type: "GeneratedId", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  VersionInfo: {
    name: "VersionInfo",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "237",
    rootId: "A3N5cwAA7Q",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "241", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "239", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "240", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "app", id: "242", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "operation", id: "246", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "referenceList", id: "244", since: "1", type: "GeneratedId", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "timestamp", id: "245", since: "1", type: "Date", cardinality: "One", final: "false", enrypted: "false"},
      { name: "type", id: "243", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "versionData", id: "247", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
    ], associations: [
      { name: "author", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
      { name: "authorGroupInfo", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "GroupInfo" },
    ]
  },
  ListVersionInfo: {
    name: "ListVersionInfo",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "250",
    rootId: "A3N5cwAA-g",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "254", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "252", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "253", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "operation", id: "256", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "timestamp", id: "255", since: "1", type: "Date", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "author", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
      { name: "authorGroupInfo", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "GroupInfo" },
      { name: "version", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "VersionInfo" },
    ]
  },
  IncomingShare: {
    name: "IncomingShare",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "260",
    rootId: "A3N5cwABBA",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "264", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "262", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "263", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "app", id: "265", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "referenceId", id: "268", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "referenceListId", id: "267", since: "1", type: "GeneratedId", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "shareType", id: "266", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "bucketPermission", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "BucketPermission" },
      { name: "ownerGroup", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
    ]
  },
  OutgoingShare: {
    name: "OutgoingShare",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "271",
    rootId: "A3N5cwABDw",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "275", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "273", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "274", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "app", id: "276", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "referenceId", id: "279", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "referenceListId", id: "278", since: "1", type: "GeneratedId", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "shareType", id: "277", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "shareholderMailAddress", id: "280", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "bucketPermission", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "BucketPermission" },
    ]
  },
  Shares: {
    name: "Shares",
    since: "1",
    type: "ELEMENT_TYPE",
    id: "282",
    rootId: "A3N5cwABGg",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "286", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "284", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "285", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
    ], associations: [
      { name: "incoming", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "IncomingShare" },
      { name: "outgoing", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "OutgoingShare" },
    ]
  },
  ShareData: {
    name: "ShareData",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "289",
    rootId: "A3N5cwABIQ",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "290", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "app", id: "292", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "bucket", id: "296", since: "1", type: "GeneratedId", cardinality: "One", final: "false", enrypted: "false"},
      { name: "instancePermissions", id: "295", since: "1", type: "GeneratedId", cardinality: "One", final: "false", enrypted: "false"},
      { name: "ownerGroupId", id: "291", since: "1", type: "GeneratedId", cardinality: "One", final: "false", enrypted: "false"},
      { name: "pubEncBucketKey", id: "298", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "pubKeyVersion", id: "299", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "shareType", id: "293", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "shareholderMailAddress", id: "294", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "writePermission", id: "297", since: "1", type: "Boolean", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  SystemKeysReturn: {
    name: "SystemKeysReturn",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "301",
    rootId: "A3N5cwABLQ",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "302", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "freeGroupKey", id: "305", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "premiumGroupKey", id: "306", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "starterGroupKey", id: "307", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "systemAdminPubKey", id: "303", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "systemAdminPubKeyVersion", id: "304", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  MailAddressAvailabilityData: {
    name: "MailAddressAvailabilityData",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "309",
    rootId: "A3N5cwABNQ",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "310", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "mailAddress", id: "311", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  MailAddressAvailabilityReturn: {
    name: "MailAddressAvailabilityReturn",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "312",
    rootId: "A3N5cwABOA",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "313", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "available", id: "314", since: "1", type: "Boolean", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  RegistrationServiceData: {
    name: "RegistrationServiceData",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "316",
    rootId: "A3N5cwABPA",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "317", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "accountType", id: "318", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "company", id: "321", since: "1", type: "String", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "domain", id: "322", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "groupName", id: "320", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "language", id: "319", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "mailAddress", id: "324", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "mobilePhoneNumber", id: "323", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "state", id: "325", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  RegistrationReturn: {
    name: "RegistrationReturn",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "326",
    rootId: "A3N5cwABRg",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "327", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "authToken", id: "328", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  RegistrationVerifyDomainDataPost: {
    name: "RegistrationVerifyDomainDataPost",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "330",
    rootId: "A3N5cwABSg",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "331", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "currentAdminMailAddress", id: "333", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "language", id: "332", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  RegistrationVerifyDomainDataPut: {
    name: "RegistrationVerifyDomainDataPut",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "334",
    rootId: "A3N5cwABTg",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "335", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "authToken", id: "336", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  RegistrationVerifyDomainPostReturn: {
    name: "RegistrationVerifyDomainPostReturn",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "337",
    rootId: "A3N5cwABUQ",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "338", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "mailSent", id: "339", since: "1", type: "Boolean", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  SendRegistrationCodeData: {
    name: "SendRegistrationCodeData",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "341",
    rootId: "A3N5cwABVQ",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "342", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "accountType", id: "345", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "authToken", id: "343", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "language", id: "344", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "mobilePhoneNumber", id: "346", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  SendRegistrationCodeReturn: {
    name: "SendRegistrationCodeReturn",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "347",
    rootId: "A3N5cwABWw",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "348", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "authToken", id: "349", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  VerifyRegistrationCodeData: {
    name: "VerifyRegistrationCodeData",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "351",
    rootId: "A3N5cwABXw",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "352", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "authToken", id: "353", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "code", id: "354", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  CreateGroupData: {
    name: "CreateGroupData",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "356",
    rootId: "A3N5cwABZA",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "357", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "adminEncGKey", id: "363", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "encryptedName", id: "358", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "listEncSessionKey", id: "364", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "mailAddress", id: "359", since: "1", type: "String", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "pubKey", id: "360", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "symEncGKey", id: "362", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "symEncPrivKey", id: "361", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  CreateGroupListData: {
    name: "CreateGroupListData",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "365",
    rootId: "A3N5cwABbQ",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "366", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "adminEncGroupInfoListKey", id: "368", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "customerEncGroupInfoListKey", id: "367", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "createGroupData", since: "1", type: "AGGREGATION", cardinality: "ZeroOrOne", refType: "CreateGroupData", final: "false" },
    ]
  },
  CustomerReturn: {
    name: "CustomerReturn",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "370",
    rootId: "A3N5cwABcg",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "371", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "adminUser", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "User" },
      { name: "adminUserGroup", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
    ]
  },
  CustomerData: {
    name: "CustomerData",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "374",
    rootId: "A3N5cwABdg",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "375", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "accountingInfoBucketEncAccountingInfoSessionKey", id: "385", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "adminEncAccountingInfoSessionKey", id: "383", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "authToken", id: "376", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "company", id: "377", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "domain", id: "378", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "salt", id: "388", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "symEncAccountGroupKey", id: "390", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "systemCustomerPubEncAccountingInfoBucketKey", id: "386", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "systemCustomerPubKeyVersion", id: "387", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "userEncClientKey", id: "384", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "verifier", id: "389", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "adminGroupList", since: "1", type: "AGGREGATION", cardinality: "One", refType: "CreateGroupListData", final: "false" },
      { name: "customerGroupList", since: "1", type: "AGGREGATION", cardinality: "One", refType: "CreateGroupListData", final: "false" },
      { name: "teamGroupList", since: "1", type: "AGGREGATION", cardinality: "One", refType: "CreateGroupListData", final: "false" },
      { name: "userGroupList", since: "1", type: "AGGREGATION", cardinality: "One", refType: "CreateGroupListData", final: "false" },
    ]
  },
  UserReturn: {
    name: "UserReturn",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "392",
    rootId: "A3N5cwABiA",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "393", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "user", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "User" },
      { name: "userGroup", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
    ]
  },
  UserData: {
    name: "UserData",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "396",
    rootId: "A3N5cwABjA",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "397", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "mobilePhoneNumber", id: "403", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "salt", id: "401", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "userEncClientKey", id: "398", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "userEncCustomerGroupKey", id: "399", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "verifier", id: "402", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "userGroupData", since: "1", type: "AGGREGATION", cardinality: "ZeroOrOne", refType: "CreateGroupData", final: "false" },
    ]
  },
  UserDataDelete: {
    name: "UserDataDelete",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "404",
    rootId: "A3N5cwABlA",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "405", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "restore", id: "406", since: "1", type: "Boolean", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "user", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "User" },
    ]
  },
  PublicKeyData: {
    name: "PublicKeyData",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "409",
    rootId: "A3N5cwABmQ",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "410", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "mailAddress", id: "411", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  PublicKeyReturn: {
    name: "PublicKeyReturn",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "412",
    rootId: "A3N5cwABnA",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "413", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "pubKey", id: "414", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "pubKeyVersion", id: "415", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  SaltData: {
    name: "SaltData",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "417",
    rootId: "A3N5cwABoQ",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "418", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "mailAddress", id: "419", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  SaltReturn: {
    name: "SaltReturn",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "420",
    rootId: "A3N5cwABpA",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "421", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "salt", id: "422", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  UserIdData: {
    name: "UserIdData",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "424",
    rootId: "A3N5cwABqA",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "425", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "mailAddress", id: "426", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  UserIdReturn: {
    name: "UserIdReturn",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "427",
    rootId: "A3N5cwABqw",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "428", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "userId", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "User" },
    ]
  },
  AutoLoginDataGet: {
    name: "AutoLoginDataGet",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "431",
    rootId: "A3N5cwABrw",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "432", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "deviceToken", id: "434", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "userId", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "User" },
    ]
  },
  AutoLoginDataDelete: {
    name: "AutoLoginDataDelete",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "435",
    rootId: "A3N5cwABsw",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "436", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "deviceToken", id: "437", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  AutoLoginDataReturn: {
    name: "AutoLoginDataReturn",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "438",
    rootId: "A3N5cwABtg",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "439", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "deviceKey", id: "440", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  AutoLoginPostReturn: {
    name: "AutoLoginPostReturn",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "441",
    rootId: "A3N5cwABuQ",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "442", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "deviceToken", id: "443", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  UpdatePermissionKeyData: {
    name: "UpdatePermissionKeyData",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "445",
    rootId: "A3N5cwABvQ",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "446", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "bucketEncSessionKey", id: "448", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "symEncBucketKey", id: "449", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "symEncSessionKey", id: "447", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
    ], associations: [
      { name: "bucketPermission", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "BucketPermission" },
      { name: "permission", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "Permission" },
    ]
  },
  Authentication: {
    name: "Authentication",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "453",
    rootId: "A3N5cwABxQ",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "454", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "authVerifier", id: "456", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "userId", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "User" },
    ]
  },
  Chat: {
    name: "Chat",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "457",
    rootId: "A3N5cwAByQ",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "458", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "recipient", id: "460", since: "1", type: "GeneratedId", cardinality: "One", final: "false", enrypted: "false"},
      { name: "sender", id: "459", since: "1", type: "GeneratedId", cardinality: "One", final: "false", enrypted: "false"},
      { name: "text", id: "461", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  EntityUpdate: {
    name: "EntityUpdate",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "462",
    rootId: "A3N5cwABzg",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "463", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "application", id: "464", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "instanceId", id: "467", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "instanceListId", id: "466", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "operation", id: "624", since: "4", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "type", id: "465", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  Exception: {
    name: "Exception",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "468",
    rootId: "A3N5cwAB1A",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "469", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "msg", id: "471", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "type", id: "470", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  WebsocketWrapper: {
    name: "WebsocketWrapper",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "472",
    rootId: "A3N5cwAB2A",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "473", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "msgId", id: "474", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "type", id: "475", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
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
    id: "480",
    rootId: "A3N5cwAB4A",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "481", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "operation", id: "484", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "timestamp", id: "483", since: "1", type: "Date", cardinality: "One", final: "false", enrypted: "false"},
      { name: "version", id: "482", since: "1", type: "GeneratedId", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "author", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
      { name: "authorGroupInfo", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "GroupInfo" },
    ]
  },
  VersionData: {
    name: "VersionData",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "487",
    rootId: "A3N5cwAB5w",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "488", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "application", id: "489", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "id", id: "491", since: "1", type: "GeneratedId", cardinality: "One", final: "false", enrypted: "false"},
      { name: "listId", id: "492", since: "1", type: "GeneratedId", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "typeId", id: "490", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  VersionReturn: {
    name: "VersionReturn",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "493",
    rootId: "A3N5cwAB7Q",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "494", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "versions", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "Version", final: "false" },
    ]
  },
  SmsMonitorTriggerData: {
    name: "SmsMonitorTriggerData",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "497",
    rootId: "A3N5cwAB8Q",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "498", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "networkOperatorIds", id: "500", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "smsFacadeIds", id: "499", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  SmsMonitorReceiverData: {
    name: "SmsMonitorReceiverData",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "502",
    rootId: "A3N5cwAB9g",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "503", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  MembershipAddData: {
    name: "MembershipAddData",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "505",
    rootId: "A3N5cwAB-Q",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "506", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "symEncGKey", id: "507", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "group", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "Group" },
      { name: "user", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "User" },
    ]
  },
  LongConfigValue: {
    name: "LongConfigValue",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "511",
    rootId: "A3N5cwAB_w",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "512", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "name", id: "513", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "value", id: "514", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  StringConfigValue: {
    name: "StringConfigValue",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "515",
    rootId: "A3N5cwACAw",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "516", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "name", id: "517", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "value", id: "518", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  TimeRangeConfigValue: {
    name: "TimeRangeConfigValue",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "519",
    rootId: "A3N5cwACBw",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "520", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "end", id: "523", since: "1", type: "Date", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "identifier", id: "521", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "start", id: "522", since: "1", type: "Date", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  TimeRangeListConfigValue: {
    name: "TimeRangeListConfigValue",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "524",
    rootId: "A3N5cwACDA",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "525", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "name", id: "526", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "timeRanges", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "TimeRangeConfigValue", final: "false" },
    ]
  },
  ConfigDataReturn: {
    name: "ConfigDataReturn",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "528",
    rootId: "A3N5cwACEA",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "529", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "longValues", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "LongConfigValue", final: "false" },
      { name: "stringValues", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "StringConfigValue", final: "false" },
      { name: "timeRangeLists", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "TimeRangeListConfigValue", final: "false" },
    ]
  },
  ChangePasswordData: {
    name: "ChangePasswordData",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "534",
    rootId: "A3N5cwACFg",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "535", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "code", id: "539", since: "1", type: "String", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "pwEncUserGroupKey", id: "538", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "salt", id: "537", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "verifier", id: "536", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  SecondFactorAuthData: {
    name: "SecondFactorAuthData",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "541",
    rootId: "A3N5cwACHQ",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "542", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "language", id: "543", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "service", id: "544", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  SecondFactorAuthAllowedReturn: {
    name: "SecondFactorAuthAllowedReturn",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "546",
    rootId: "A3N5cwACIg",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "547", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "allowed", id: "548", since: "1", type: "Boolean", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  CustomerInfoReturn: {
    name: "CustomerInfoReturn",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "550",
    rootId: "A3N5cwACJg",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "551", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "sendMailDisabled", id: "552", since: "1", type: "Boolean", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  ResetPasswordData: {
    name: "ResetPasswordData",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "584",
    rootId: "A3N5cwACSA",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "585", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "pwEncUserGroupKey", id: "588", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "salt", id: "587", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "verifier", id: "586", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "user", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "User" },
    ]
  },
  InvoiceServiceData: {
    name: "InvoiceServiceData",
    since: "2",
    type: "DATA_TRANSFER_TYPE",
    id: "594",
    rootId: "A3N5cwACUg",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "595", since: "2", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  DomainMailAddressAvailabilityData: {
    name: "DomainMailAddressAvailabilityData",
    since: "2",
    type: "DATA_TRANSFER_TYPE",
    id: "599",
    rootId: "A3N5cwACVw",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "600", since: "2", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "mailAddress", id: "601", since: "2", type: "String", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  DomainMailAddressAvailabilityReturn: {
    name: "DomainMailAddressAvailabilityReturn",
    since: "2",
    type: "DATA_TRANSFER_TYPE",
    id: "602",
    rootId: "A3N5cwACWg",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "603", since: "2", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "available", id: "604", since: "2", type: "Boolean", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  RegistrationConfigReturn: {
    name: "RegistrationConfigReturn",
    since: "2",
    type: "DATA_TRANSFER_TYPE",
    id: "606",
    rootId: "A3N5cwACXg",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "607", since: "2", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "freeEnabled", id: "609", since: "2", type: "Boolean", cardinality: "One", final: "false", enrypted: "false"},
      { name: "starterEnabled", id: "608", since: "2", type: "Boolean", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  PhoneNumberToUser: {
    name: "PhoneNumberToUser",
    since: "2",
    type: "ELEMENT_TYPE",
    id: "611",
    rootId: "A3N5cwACYw",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "615", since: "2", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "613", since: "2", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "614", since: "2", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
    ], associations: [
      { name: "users", since: "2", type: "ELEMENT_ASSOCIATION", cardinality: "Any", refType: "User" },
    ]
  },
  PhoneNumberTypeData: {
    name: "PhoneNumberTypeData",
    since: "3",
    type: "DATA_TRANSFER_TYPE",
    id: "617",
    rootId: "A3N5cwACaQ",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "618", since: "3", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "phoneNumber", id: "619", since: "3", type: "String", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  PhoneNumberTypeReturn: {
    name: "PhoneNumberTypeReturn",
    since: "3",
    type: "DATA_TRANSFER_TYPE",
    id: "620",
    rootId: "A3N5cwACbA",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "621", since: "3", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "type", id: "622", since: "3", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
} };
