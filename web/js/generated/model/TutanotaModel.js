"use strict";

goog.provide('tutao.tutanota.model.tutanota_model');

tutao.tutanota.model.tutanota_model = {
name: "tutanota",
version: "5",
types: {
  DataBlock: {
    name: "DataBlock",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "0",
    rootId: "CHR1dGFub3RhAAA",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "1", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "blockData", id: "3", since: "1", type: "GeneratedId", cardinality: "One", final: "false", enrypted: "false"},
      { name: "size", id: "2", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  FileData: {
    name: "FileData",
    since: "1",
    type: "ELEMENT_TYPE",
    id: "4",
    rootId: "CHR1dGFub3RhAAQ",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "8", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "6", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "7", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "size", id: "9", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "unreferenced", id: "409", since: "2", type: "Boolean", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "blocks", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "DataBlock", final: "false" },
    ]
  },
  Subfiles: {
    name: "Subfiles",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "11",
    rootId: "CHR1dGFub3RhAAs",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "12", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
    ], associations: [
      { name: "files", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "File" },
    ]
  },
  File: {
    name: "File",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "13",
    rootId: "CHR1dGFub3RhAA0",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_area", id: "20", since: "1", type: "Number", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_format", id: "17", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "15", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_listEncSessionKey", id: "18", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "_owner", id: "19", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "16", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "mimeType", id: "23", since: "1", type: "String", cardinality: "ZeroOrOne", final: "true", enrypted: "true"},
      { name: "name", id: "21", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true"},
      { name: "size", id: "22", since: "1", type: "Number", cardinality: "One", final: "true", enrypted: "false"},
    ], associations: [
      { name: "subFiles", since: "1", type: "AGGREGATION", cardinality: "ZeroOrOne", refType: "Subfiles", final: "true" },
      { name: "data", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "FileData" },
      { name: "parent", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "File" },
    ]
  },
  FileSystem: {
    name: "FileSystem",
    since: "1",
    type: "ELEMENT_TYPE",
    id: "28",
    rootId: "CHR1dGFub3RhABw",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_format", id: "32", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "30", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "31", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "shareBucketId", id: "33", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "symEncShareBucketKey", id: "34", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
    ], associations: [
      { name: "files", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "File" },
    ]
  },
  MailBody: {
    name: "MailBody",
    since: "1",
    type: "ELEMENT_TYPE",
    id: "36",
    rootId: "CHR1dGFub3RhACQ",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_area", id: "42", since: "1", type: "Number", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_format", id: "40", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "38", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_owner", id: "41", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "39", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "text", id: "43", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "true"},
    ], associations: [
    ]
  },
  ContactMailAddress: {
    name: "ContactMailAddress",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "44",
    rootId: "CHR1dGFub3RhACw",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "45", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "address", id: "47", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true"},
      { name: "customTypeName", id: "48", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true"},
      { name: "type", id: "46", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "true"},
    ], associations: [
    ]
  },
  ContactPhoneNumber: {
    name: "ContactPhoneNumber",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "49",
    rootId: "CHR1dGFub3RhADE",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "50", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "customTypeName", id: "53", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true"},
      { name: "number", id: "52", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true"},
      { name: "type", id: "51", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "true"},
    ], associations: [
    ]
  },
  ContactAddress: {
    name: "ContactAddress",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "54",
    rootId: "CHR1dGFub3RhADY",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "55", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "address", id: "57", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true"},
      { name: "customTypeName", id: "58", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true"},
      { name: "type", id: "56", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "true"},
    ], associations: [
    ]
  },
  ContactSocialId: {
    name: "ContactSocialId",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "59",
    rootId: "CHR1dGFub3RhADs",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "60", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "customTypeName", id: "63", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true"},
      { name: "socialId", id: "62", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true"},
      { name: "type", id: "61", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "true"},
    ], associations: [
    ]
  },
  Contact: {
    name: "Contact",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "64",
    rootId: "CHR1dGFub3RhAEA",
    versioned: true,
    encrypted: true,
    values: [
      { name: "_area", id: "71", since: "1", type: "Number", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_format", id: "68", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "66", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_listEncSessionKey", id: "69", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "_owner", id: "70", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "67", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "autoTransmitPassword", id: "78", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true"},
      { name: "birthday", id: "76", since: "1", type: "Date", cardinality: "ZeroOrOne", final: "false", enrypted: "true"},
      { name: "comment", id: "77", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true"},
      { name: "company", id: "74", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true"},
      { name: "firstName", id: "72", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true"},
      { name: "lastName", id: "73", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true"},
      { name: "presharedPassword", id: "79", since: "1", type: "String", cardinality: "ZeroOrOne", final: "false", enrypted: "true"},
      { name: "title", id: "75", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true"},
    ], associations: [
      { name: "addresses", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "ContactAddress", final: "false" },
      { name: "mailAddresses", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "ContactMailAddress", final: "false" },
      { name: "phoneNumbers", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "ContactPhoneNumber", final: "false" },
      { name: "socialIds", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "ContactSocialId", final: "false" },
    ]
  },
  ConversationEntry: {
    name: "ConversationEntry",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "84",
    rootId: "CHR1dGFub3RhAFQ",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "120", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "118", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "119", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "conversationType", id: "122", since: "1", type: "Number", cardinality: "One", final: "true", enrypted: "false"},
      { name: "messageId", id: "121", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false"},
    ], associations: [
      { name: "mail", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "Mail" },
      { name: "previous", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "ConversationEntry" },
    ]
  },
  MessageMapping: {
    name: "MessageMapping",
    since: "1",
    type: "ELEMENT_TYPE",
    id: "86",
    rootId: "CHR1dGFub3RhAFY",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_format", id: "90", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "88", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "89", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
    ], associations: [
      { name: "conversationEntry", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "ConversationEntry" },
    ]
  },
  MailAddress: {
    name: "MailAddress",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "92",
    rootId: "CHR1dGFub3RhAFw",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "93", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "address", id: "95", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false"},
      { name: "name", id: "94", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "true"},
    ], associations: [
      { name: "contact", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "Contact" },
    ]
  },
  Mail: {
    name: "Mail",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "97",
    rootId: "CHR1dGFub3RhAGE",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_area", id: "104", since: "1", type: "Number", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_format", id: "101", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "99", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_listEncSessionKey", id: "102", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "_owner", id: "103", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "100", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "receivedDate", id: "107", since: "1", type: "Date", cardinality: "One", final: "true", enrypted: "false"},
      { name: "sentDate", id: "106", since: "1", type: "Date", cardinality: "One", final: "true", enrypted: "false"},
      { name: "state", id: "108", since: "1", type: "Number", cardinality: "One", final: "true", enrypted: "false"},
      { name: "subject", id: "105", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "true"},
      { name: "trashed", id: "110", since: "1", type: "Boolean", cardinality: "One", final: "false", enrypted: "false"},
      { name: "unread", id: "109", since: "1", type: "Boolean", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "bccRecipients", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "MailAddress", final: "true" },
      { name: "ccRecipients", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "MailAddress", final: "true" },
      { name: "sender", since: "1", type: "AGGREGATION", cardinality: "One", refType: "MailAddress", final: "true" },
      { name: "toRecipients", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "MailAddress", final: "true" },
      { name: "attachments", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "Any", refType: "File" },
      { name: "body", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "MailBody" },
      { name: "conversationEntry", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "ConversationEntry" },
    ]
  },
  MailBox: {
    name: "MailBox",
    since: "1",
    type: "ELEMENT_TYPE",
    id: "125",
    rootId: "CHR1dGFub3RhAH0",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_format", id: "129", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "127", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "128", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "shareBucketId", id: "130", since: "1", type: "GeneratedId", cardinality: "ZeroOrOne", final: "true", enrypted: "false"},
      { name: "symEncShareBucketKey", id: "131", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "true", enrypted: "false"},
    ], associations: [
      { name: "mails", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "Mail" },
      { name: "receivedAttachments", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "File" },
      { name: "sentAttachments", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "File" },
    ]
  },
  PasswordChannelPhoneNumber: {
    name: "PasswordChannelPhoneNumber",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "135",
    rootId: "CHR1dGFub3RhAACH",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "136", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "number", id: "137", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false"},
    ], associations: [
    ]
  },
  CreateExternalUserGroupData: {
    name: "CreateExternalUserGroupData",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "138",
    rootId: "CHR1dGFub3RhAACK",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "139", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "adminEncGKey", id: "143", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "encryptedName", id: "140", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "groupInfoListEncSessionKey", id: "144", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "mailAddress", id: "141", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "symEncGKey", id: "142", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  ExternalUserData: {
    name: "ExternalUserData",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "145",
    rootId: "CHR1dGFub3RhAACR",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "146", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "externalUserEncGroupInfoSessionKey", id: "150", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "groupEncEntropy", id: "412", since: "2", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "groupEncMailListKey", id: "148", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "userEncClientKey", id: "147", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "verifier", id: "149", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "userGroupData", since: "1", type: "AGGREGATION", cardinality: "One", refType: "CreateExternalUserGroupData", final: "false" },
    ]
  },
  ContactList: {
    name: "ContactList",
    since: "1",
    type: "ELEMENT_TYPE",
    id: "153",
    rootId: "CHR1dGFub3RhAACZ",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_format", id: "157", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "155", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "156", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "shareBucketId", id: "158", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "symEncShareBucketKey", id: "159", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
    ], associations: [
      { name: "contacts", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "Contact" },
    ]
  },
  Recipient: {
    name: "Recipient",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "161",
    rootId: "CHR1dGFub3RhAACh",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "162", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "autoTransmitPassword", id: "170", since: "1", type: "String", cardinality: "ZeroOrOne", final: "true", enrypted: "false"},
      { name: "mailAddress", id: "165", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false"},
      { name: "name", id: "164", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "true"},
      { name: "passwordVerifier", id: "169", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "true", enrypted: "false"},
      { name: "pubEncBucketKey", id: "166", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "true", enrypted: "false"},
      { name: "pubKeyVersion", id: "167", since: "1", type: "Number", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "pwEncCommunicationKey", id: "173", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "true", enrypted: "false"},
      { name: "salt", id: "171", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "true", enrypted: "false"},
      { name: "saltHash", id: "172", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "true", enrypted: "false"},
      { name: "symEncBucketKey", id: "168", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "true", enrypted: "false"},
      { name: "type", id: "163", since: "1", type: "Number", cardinality: "One", final: "true", enrypted: "false"},
    ], associations: [
      { name: "passwordChannelPhoneNumbers", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "PasswordChannelPhoneNumber", final: "true" },
    ]
  },
  Attachment: {
    name: "Attachment",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "175",
    rootId: "CHR1dGFub3RhAACv",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "176", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "bucketEncFileSessionKey", id: "178", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
      { name: "fileName", id: "180", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "true", enrypted: "false"},
      { name: "listEncFileSessionKey", id: "177", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
      { name: "mimeType", id: "181", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "true", enrypted: "false"},
    ], associations: [
      { name: "file", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "File" },
      { name: "fileData", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "FileData" },
    ]
  },
  RemoteImapSyncInfo: {
    name: "RemoteImapSyncInfo",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "183",
    rootId: "CHR1dGFub3RhAAC3",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "187", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "185", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "186", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "seen", id: "189", since: "1", type: "Boolean", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "message", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "Mail" },
    ]
  },
  ImapFolder: {
    name: "ImapFolder",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "190",
    rootId: "CHR1dGFub3RhAAC-",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "191", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "lastseenuid", id: "193", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "name", id: "192", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "uidvalidity", id: "194", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "syncInfo", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "RemoteImapSyncInfo" },
    ]
  },
  ImapSyncState: {
    name: "ImapSyncState",
    since: "1",
    type: "ELEMENT_TYPE",
    id: "196",
    rootId: "CHR1dGFub3RhAADE",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "200", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "198", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "199", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
    ], associations: [
      { name: "folders", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "ImapFolder", final: "false" },
    ]
  },
  MailboxUpdate: {
    name: "MailboxUpdate",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "202",
    rootId: "CHR1dGFub3RhAADK",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "206", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "204", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "205", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "update", id: "208", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "message", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "Mail" },
    ]
  },
  ImapSyncConfiguration: {
    name: "ImapSyncConfiguration",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "209",
    rootId: "CHR1dGFub3RhAADR",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "210", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "host", id: "211", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "password", id: "214", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "port", id: "212", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "user", id: "213", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "imapSyncState", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "ImapSyncState" },
    ]
  },
  TutanotaProperties: {
    name: "TutanotaProperties",
    since: "1",
    type: "ELEMENT_TYPE",
    id: "216",
    rootId: "CHR1dGFub3RhAADY",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "220", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "218", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "219", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "groupEncEntropy", id: "410", since: "2", type: "Bytes", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "notificationMailLanguage", id: "418", since: "4", type: "String", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
    ], associations: [
      { name: "imapSyncConfig", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "ImapSyncConfiguration", final: "false" },
      { name: "lastPushedMail", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "Mail" },
    ]
  },
  NotificationMail: {
    name: "NotificationMail",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "223",
    rootId: "CHR1dGFub3RhAADf",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "224", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "bodyText", id: "226", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "mailboxLink", id: "417", since: "3", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "recipientMailAddress", id: "227", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "recipientName", id: "228", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "subject", id: "225", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  SendMailData: {
    name: "SendMailData",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "229",
    rootId: "CHR1dGFub3RhAADl",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_format", id: "230", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "bodyText", id: "233", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "true"},
      { name: "bucketEncSessionKey", id: "241", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
      { name: "conversationType", id: "237", since: "1", type: "Number", cardinality: "One", final: "true", enrypted: "false"},
      { name: "language", id: "231", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false"},
      { name: "listEncSessionKey", id: "238", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
      { name: "previousMessageId", id: "236", since: "1", type: "String", cardinality: "ZeroOrOne", final: "true", enrypted: "false"},
      { name: "senderName", id: "234", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "true"},
      { name: "senderNameUnencrypted", id: "235", since: "1", type: "String", cardinality: "ZeroOrOne", final: "true", enrypted: "false"},
      { name: "sharableEncSessionKey", id: "240", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
      { name: "subject", id: "232", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "true"},
      { name: "symEncSessionKey", id: "239", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
    ], associations: [
      { name: "attachments", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "Attachment", final: "true" },
      { name: "bccRecipients", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "Recipient", final: "true" },
      { name: "ccRecipients", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "Recipient", final: "true" },
      { name: "toRecipients", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "Recipient", final: "true" },
    ]
  },
  SendMailReturn: {
    name: "SendMailReturn",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "246",
    rootId: "CHR1dGFub3RhAAD2",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_format", id: "247", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "messageId", id: "248", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "sentDate", id: "249", since: "1", type: "Date", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "notifications", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "NotificationMail", final: "false" },
      { name: "senderMail", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "Mail" },
    ]
  },
  AttachmentFromExternal: {
    name: "AttachmentFromExternal",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "253",
    rootId: "CHR1dGFub3RhAAD9",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "254", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "fileName", id: "257", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
      { name: "mimeType", id: "258", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
      { name: "recipientBucketEncFileSessionKey", id: "256", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
      { name: "senderBucketEncFileSessionKey", id: "255", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
    ], associations: [
      { name: "fileData", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "FileData" },
    ]
  },
  SendMailFromExternalData: {
    name: "SendMailFromExternalData",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "260",
    rootId: "CHR1dGFub3RhAAEE",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_format", id: "261", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "bodyText", id: "264", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "true"},
      { name: "language", id: "262", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false"},
      { name: "previousMessageId", id: "266", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false"},
      { name: "recipientBucketEncSessionKey", id: "269", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
      { name: "senderBucketEncSessionKey", id: "268", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
      { name: "senderName", id: "265", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "true"},
      { name: "senderSymEncBucketKey", id: "267", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
      { name: "subject", id: "263", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "true"},
    ], associations: [
      { name: "attachments", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "AttachmentFromExternal", final: "true" },
      { name: "toRecipient", since: "1", type: "AGGREGATION", cardinality: "One", refType: "Recipient", final: "true" },
    ]
  },
  SendMailFromExternalReturn: {
    name: "SendMailFromExternalReturn",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "272",
    rootId: "CHR1dGFub3RhAAEQ",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_format", id: "273", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "senderMail", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "Mail" },
    ]
  },
  UnsecureRecipient: {
    name: "UnsecureRecipient",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "276",
    rootId: "CHR1dGFub3RhAAEU",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "277", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "mailAddress", id: "279", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false"},
      { name: "name", id: "278", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false"},
    ], associations: [
    ]
  },
  UnsecureAttachment: {
    name: "UnsecureAttachment",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "280",
    rootId: "CHR1dGFub3RhAAEY",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "281", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "fileName", id: "285", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "true", enrypted: "false"},
      { name: "fileSessionKey", id: "282", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
      { name: "listEncFileSessionKey", id: "283", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
      { name: "mimeType", id: "286", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "true", enrypted: "false"},
    ], associations: [
      { name: "file", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "File" },
      { name: "fileData", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "FileData" },
    ]
  },
  SendUnsecureMailData: {
    name: "SendUnsecureMailData",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "288",
    rootId: "CHR1dGFub3RhAAEg",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "289", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "bodyText", id: "292", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false"},
      { name: "conversationType", id: "295", since: "1", type: "Number", cardinality: "One", final: "true", enrypted: "false"},
      { name: "language", id: "290", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false"},
      { name: "listEncSessionKey", id: "297", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
      { name: "mailSessionKey", id: "296", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
      { name: "previousMessageId", id: "294", since: "1", type: "String", cardinality: "ZeroOrOne", final: "true", enrypted: "false"},
      { name: "senderName", id: "293", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false"},
      { name: "sharableEncSessionKey", id: "299", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
      { name: "subject", id: "291", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false"},
      { name: "symEncSessionKey", id: "298", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
    ], associations: [
      { name: "attachments", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "UnsecureAttachment", final: "true" },
      { name: "bccRecipients", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "UnsecureRecipient", final: "true" },
      { name: "ccRecipients", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "UnsecureRecipient", final: "true" },
      { name: "toRecipients", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "UnsecureRecipient", final: "true" },
    ]
  },
  SendUnsecureMailReturn: {
    name: "SendUnsecureMailReturn",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "304",
    rootId: "CHR1dGFub3RhAAEw",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "305", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "senderMail", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "Mail" },
    ]
  },
  PasswordMessagingData: {
    name: "PasswordMessagingData",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "308",
    rootId: "CHR1dGFub3RhAAE0",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "309", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "language", id: "310", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false"},
      { name: "numberId", id: "311", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "symKeyForPasswordTransmission", id: "312", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
    ], associations: [
    ]
  },
  PasswordMessagingReturn: {
    name: "PasswordMessagingReturn",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "313",
    rootId: "CHR1dGFub3RhAAE5",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "314", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "autoAuthenticationId", id: "315", since: "1", type: "GeneratedId", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  PasswordAutoAuthenticationReturn: {
    name: "PasswordAutoAuthenticationReturn",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "317",
    rootId: "CHR1dGFub3RhAAE9",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "318", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  PasswordRetrievalData: {
    name: "PasswordRetrievalData",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "320",
    rootId: "CHR1dGFub3RhAAFA",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "321", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "autoAuthenticationId", id: "322", since: "1", type: "GeneratedId", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  PasswordRetrievalReturn: {
    name: "PasswordRetrievalReturn",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "323",
    rootId: "CHR1dGFub3RhAAFD",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "324", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "transmissionKeyEncryptedPassword", id: "325", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false"},
    ], associations: [
    ]
  },
  PasswordChannelReturn: {
    name: "PasswordChannelReturn",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "327",
    rootId: "CHR1dGFub3RhAAFH",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "328", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "phoneNumberChannels", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "PasswordChannelPhoneNumber", final: "true" },
    ]
  },
  FileDataDataGet: {
    name: "FileDataDataGet",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "331",
    rootId: "CHR1dGFub3RhAAFL",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_format", id: "332", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "base64", id: "333", since: "1", type: "Boolean", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "file", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "File" },
    ]
  },
  FileDataDataPost: {
    name: "FileDataDataPost",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "335",
    rootId: "CHR1dGFub3RhAAFP",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_format", id: "336", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "group", id: "337", since: "1", type: "GeneratedId", cardinality: "One", final: "false", enrypted: "false"},
      { name: "size", id: "338", since: "1", type: "Number", cardinality: "One", final: "true", enrypted: "false"},
    ], associations: [
    ]
  },
  FileDataDataReturn: {
    name: "FileDataDataReturn",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "339",
    rootId: "CHR1dGFub3RhAAFT",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_format", id: "340", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "size", id: "341", since: "1", type: "Number", cardinality: "One", final: "true", enrypted: "false"},
    ], associations: [
    ]
  },
  FileDataReturnPost: {
    name: "FileDataReturnPost",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "342",
    rootId: "CHR1dGFub3RhAAFW",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_format", id: "343", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "fileData", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "FileData" },
    ]
  },
  CreateFileData: {
    name: "CreateFileData",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "346",
    rootId: "CHR1dGFub3RhAAFa",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_format", id: "347", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "fileName", id: "348", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "true"},
      { name: "group", id: "350", since: "1", type: "GeneratedId", cardinality: "One", final: "false", enrypted: "false"},
      { name: "listEncSessionKey", id: "351", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "mimeType", id: "349", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "true"},
    ], associations: [
      { name: "fileData", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "FileData" },
      { name: "parentFolder", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "File" },
    ]
  },
  CreateFileReturn: {
    name: "CreateFileReturn",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "354",
    rootId: "CHR1dGFub3RhAAFi",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_format", id: "355", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "file", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "File" },
    ]
  },
  CreateFolderData: {
    name: "CreateFolderData",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "358",
    rootId: "CHR1dGFub3RhAAFm",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_format", id: "359", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "fileName", id: "360", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "true"},
      { name: "group", id: "361", since: "1", type: "GeneratedId", cardinality: "One", final: "false", enrypted: "false"},
      { name: "listEncSessionKey", id: "363", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "symEncSessionKey", id: "362", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "parentFolder", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "File" },
    ]
  },
  CreateFolderReturn: {
    name: "CreateFolderReturn",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "365",
    rootId: "CHR1dGFub3RhAAFt",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_format", id: "366", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "file", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "File" },
    ]
  },
  UpdateFileData: {
    name: "UpdateFileData",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "369",
    rootId: "CHR1dGFub3RhAAFx",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "370", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "file", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "File" },
      { name: "fileData", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "FileData" },
    ]
  },
  DeleteFileData: {
    name: "DeleteFileData",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "374",
    rootId: "CHR1dGFub3RhAAF2",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "375", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "group", id: "376", since: "1", type: "GeneratedId", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "file", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "File" },
    ]
  },
  FeedbackData: {
    name: "FeedbackData",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "379",
    rootId: "CHR1dGFub3RhAAF7",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "380", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "image", id: "383", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
      { name: "msg", id: "381", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false"},
      { name: "useragent", id: "382", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false"},
    ], associations: [
    ]
  },
  InitGroupData: {
    name: "InitGroupData",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "385",
    rootId: "CHR1dGFub3RhAAGB",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "386", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "contactShareBucketEncContactListSessionKey", id: "392", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
      { name: "fileShareBucketEncFileSystemSessionKey", id: "395", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
      { name: "groupEncEntropy", id: "411", since: "2", type: "Bytes", cardinality: "One", final: "false", enrypted: "false"},
      { name: "groupId", id: "387", since: "1", type: "GeneratedId", cardinality: "One", final: "false", enrypted: "false"},
      { name: "groupShareBucketEncExternalGroupInfoListKey", id: "399", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
      { name: "mailShareBucketEncMailBoxSessionKey", id: "389", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
      { name: "symEncContactListSessionKey", id: "391", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
      { name: "symEncContactShareBucketKey", id: "393", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
      { name: "symEncExternalGroupInfoListKey", id: "397", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
      { name: "symEncFileShareBucketKey", id: "396", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
      { name: "symEncFileSystemSessionKey", id: "394", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
      { name: "symEncGroupShareBucketKey", id: "398", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
      { name: "symEncMailBoxSessionKey", id: "388", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
      { name: "symEncMailShareBucketKey", id: "390", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false"},
    ], associations: [
    ]
  },
  WelcomeMailData: {
    name: "WelcomeMailData",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "401",
    rootId: "CHR1dGFub3RhAAGR",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "402", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "language", id: "403", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  MigrateToV2Data: {
    name: "MigrateToV2Data",
    since: "2",
    type: "DATA_TRANSFER_TYPE",
    id: "413",
    rootId: "CHR1dGFub3RhAAGd",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "414", since: "2", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "noop", id: "415", since: "2", type: "Boolean", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  DeleteMailData: {
    name: "DeleteMailData",
    since: "5",
    type: "DATA_TRANSFER_TYPE",
    id: "419",
    rootId: "CHR1dGFub3RhAAGj",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "420", since: "5", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "mails", since: "5", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "Any", refType: "Mail" },
    ]
  },
  MigrateToV5Data: {
    name: "MigrateToV5Data",
    since: "5",
    type: "DATA_TRANSFER_TYPE",
    id: "422",
    rootId: "CHR1dGFub3RhAAGm",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "423", since: "5", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "noop", id: "424", since: "5", type: "Boolean", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
} };
