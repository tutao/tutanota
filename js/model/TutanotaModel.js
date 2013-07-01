"use strict";

goog.provide('tutao.tutanota.model.tutanota_model');

tutao.tutanota.model.tutanota_model = {
name: "tutanota",
version: "1",
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
      { name: "_id", id: "1", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "blockData", id: "3", since: "1", type: "GeneratedId", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "size", id: "2", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
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
    encrypted: true,
    values: [
      { name: "_format", id: "7", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_id", id: "5", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_permissions", id: "6", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "size", id: "8", since: "1", type: "Number", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "blocks", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "DataBlock", final: "false" },
    ]
  },
  File: {
    name: "File",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "10",
    rootId: "CHR1dGFub3RhAAo",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_format", id: "13", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_id", id: "11", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_listEncSessionKey", id: "14", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_permissions", id: "12", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "mimeType", id: "17", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "true", searchable: "false", sortable: "false"},
      { name: "name", id: "15", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true", searchable: "false", sortable: "false"},
      { name: "size", id: "16", since: "1", type: "Number", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "data", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "FileData" },
      { name: "parent", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "File" },
      { name: "subFiles", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "File" },
    ]
  },
  FileSystem: {
    name: "FileSystem",
    since: "1",
    type: "ELEMENT_TYPE",
    id: "21",
    rootId: "CHR1dGFub3RhABU",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_format", id: "24", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_id", id: "22", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_permissions", id: "23", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "shareBucketId", id: "25", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "symEncShareBucketKey", id: "26", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "files", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "File" },
    ]
  },
  MailBody: {
    name: "MailBody",
    since: "1",
    type: "ELEMENT_TYPE",
    id: "28",
    rootId: "CHR1dGFub3RhABw",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_format", id: "31", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_id", id: "29", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_permissions", id: "30", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "text", id: "32", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "true", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  ContactMailAddress: {
    name: "ContactMailAddress",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "33",
    rootId: "CHR1dGFub3RhACE",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "34", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "address", id: "36", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true", searchable: "false", sortable: "false"},
      { name: "customTypeName", id: "37", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true", searchable: "false", sortable: "false"},
      { name: "type", id: "35", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "true", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  ContactPhoneNumber: {
    name: "ContactPhoneNumber",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "38",
    rootId: "CHR1dGFub3RhACY",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "39", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "customTypeName", id: "42", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true", searchable: "false", sortable: "false"},
      { name: "number", id: "41", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true", searchable: "false", sortable: "false"},
      { name: "type", id: "40", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "true", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  ContactAddress: {
    name: "ContactAddress",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "43",
    rootId: "CHR1dGFub3RhACs",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "44", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "address", id: "46", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true", searchable: "false", sortable: "false"},
      { name: "customTypeName", id: "47", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true", searchable: "false", sortable: "false"},
      { name: "type", id: "45", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "true", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  ContactSocialId: {
    name: "ContactSocialId",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "48",
    rootId: "CHR1dGFub3RhADA",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "49", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "customTypeName", id: "52", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true", searchable: "false", sortable: "false"},
      { name: "socialId", id: "51", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true", searchable: "false", sortable: "false"},
      { name: "type", id: "50", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "true", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  Contact: {
    name: "Contact",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "53",
    rootId: "CHR1dGFub3RhADU",
    versioned: true,
    encrypted: true,
    values: [
      { name: "_format", id: "56", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_id", id: "54", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_listEncSessionKey", id: "57", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_permissions", id: "55", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "birthday", id: "62", since: "1", type: "Date", cardinality: "ZeroOrOne", final: "false", enrypted: "true", searchable: "false", sortable: "false"},
      { name: "comment", id: "63", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true", searchable: "false", sortable: "false"},
      { name: "communicationPassword", id: "64", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true", searchable: "false", sortable: "false"},
      { name: "communicationPasswordSalt", id: "65", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "true", searchable: "false", sortable: "false"},
      { name: "company", id: "60", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true", searchable: "false", sortable: "false"},
      { name: "firstName", id: "58", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true", searchable: "false", sortable: "false"},
      { name: "lastName", id: "59", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true", searchable: "false", sortable: "false"},
      { name: "title", id: "61", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "true", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "addresses", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "ContactAddress", final: "false" },
      { name: "mailAddresses", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "ContactMailAddress", final: "false" },
      { name: "phoneNumbers", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "ContactPhoneNumber", final: "false" },
      { name: "socialIds", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "ContactSocialId", final: "false" },
    ]
  },
  PasswordChannelPhoneNumber: {
    name: "PasswordChannelPhoneNumber",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "70",
    rootId: "CHR1dGFub3RhAEY",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "71", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "maskedNumber", id: "73", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "number", id: "72", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  PasswordMessage: {
    name: "PasswordMessage",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "74",
    rootId: "CHR1dGFub3RhAEo",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "75", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "authenticationToken", id: "77", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "autoAuthenticationId", id: "78", since: "1", type: "GeneratedId", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "communicationPassword", id: "76", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "lastTimestamp", id: "80", since: "1", type: "Date", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "sentCount", id: "79", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "phoneNumbers", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "PasswordChannelPhoneNumber", final: "false" },
    ]
  },
  ConversationEntry: {
    name: "ConversationEntry",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "82",
    rootId: "CHR1dGFub3RhAFI",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "114", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_id", id: "112", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_permissions", id: "113", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "conversationType", id: "116", since: "1", type: "Number", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "messageId", id: "115", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "mail", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "Mail" },
      { name: "previous", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "ConversationEntry" },
    ]
  },
  MessageMapping: {
    name: "MessageMapping",
    since: "1",
    type: "ELEMENT_TYPE",
    id: "83",
    rootId: "CHR1dGFub3RhAFM",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_format", id: "86", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_id", id: "84", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_permissions", id: "85", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "conversationEntry", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "ConversationEntry" },
    ]
  },
  MailAddress: {
    name: "MailAddress",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "88",
    rootId: "CHR1dGFub3RhAFg",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "89", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "address", id: "91", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "name", id: "90", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "true", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "contact", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "Contact" },
    ]
  },
  Mail: {
    name: "Mail",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "93",
    rootId: "CHR1dGFub3RhAF0",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_format", id: "96", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_id", id: "94", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_listEncSessionKey", id: "97", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_permissions", id: "95", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "receivedDate", id: "100", since: "1", type: "Date", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "sentDate", id: "99", since: "1", type: "Date", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "state", id: "101", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "subject", id: "98", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "true", searchable: "false", sortable: "false"},
      { name: "trashed", id: "103", since: "1", type: "Boolean", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "unread", id: "102", since: "1", type: "Boolean", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "bccRecipients", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "MailAddress", final: "true" },
      { name: "ccRecipients", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "MailAddress", final: "true" },
      { name: "passwordMessage", since: "1", type: "AGGREGATION", cardinality: "ZeroOrOne", refType: "PasswordMessage", final: "false" },
      { name: "sender", since: "1", type: "AGGREGATION", cardinality: "One", refType: "MailAddress", final: "true" },
      { name: "toRecipients", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "MailAddress", final: "true" },
      { name: "attachments", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "Any", refType: "File" },
      { name: "body", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "MailBody" },
      { name: "conversationEntry", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "ConversationEntry" },
    ]
  },
  ExternalMailReference: {
    name: "ExternalMailReference",
    since: "1",
    type: "ELEMENT_TYPE",
    id: "119",
    rootId: "CHR1dGFub3RhAHc",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "122", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_id", id: "120", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_permissions", id: "121", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "authToken", id: "124", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "salt", id: "125", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "userId", id: "123", since: "1", type: "GeneratedId", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "mail", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "Mail" },
    ]
  },
  ExternalMailReferenceService: {
    name: "ExternalMailReferenceService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "127",
    rootId: "CHR1dGFub3RhAH8",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "128", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "authToken", id: "130", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "salt", id: "131", since: "1", type: "Bytes", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "userId", id: "129", since: "1", type: "GeneratedId", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "mail", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "Mail" },
    ]
  },
  MailBox: {
    name: "MailBox",
    since: "1",
    type: "ELEMENT_TYPE",
    id: "133",
    rootId: "CHR1dGFub3RhAACF",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_format", id: "136", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_id", id: "134", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_permissions", id: "135", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "shareBucketId", id: "137", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "symEncShareBucketKey", id: "138", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "mails", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "Mail" },
      { name: "receivedAttachments", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "File" },
      { name: "sentAttachments", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "File" },
    ]
  },
  ContactList: {
    name: "ContactList",
    since: "1",
    type: "ELEMENT_TYPE",
    id: "142",
    rootId: "CHR1dGFub3RhAACO",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_format", id: "145", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_id", id: "143", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_permissions", id: "144", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "shareBucketId", id: "146", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "symEncShareBucketKey", id: "147", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "contacts", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "Contact" },
    ]
  },
  Recipient: {
    name: "Recipient",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "149",
    rootId: "CHR1dGFub3RhAACV",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "150", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "mailAddress", id: "153", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "name", id: "152", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "true", searchable: "false", sortable: "false"},
      { name: "password", id: "158", since: "1", type: "String", cardinality: "ZeroOrOne", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "passwordVerifier", id: "157", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "pubEncBucketKey", id: "154", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "pubKeyVersion", id: "155", since: "1", type: "Number", cardinality: "ZeroOrOne", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "salt", id: "159", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "symEncBucketKey", id: "156", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "type", id: "151", since: "1", type: "Number", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "passwordChannelPhoneNumbers", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "PasswordChannelPhoneNumber", final: "true" },
    ]
  },
  Attachment: {
    name: "Attachment",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "161",
    rootId: "CHR1dGFub3RhAACh",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "162", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "bucketEncFileSessionKey", id: "164", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "fileName", id: "166", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "true", enrypted: "false", searchable: "true", sortable: "true"},
      { name: "listEncFileSessionKey", id: "163", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "mimeType", id: "167", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "file", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "File" },
      { name: "fileData", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "FileData" },
    ]
  },
  SendMailService: {
    name: "SendMailService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "169",
    rootId: "CHR1dGFub3RhAACp",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_format", id: "170", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "bodyText", id: "172", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "true", searchable: "false", sortable: "false"},
      { name: "bucketEncSessionKey", id: "180", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "conversationType", id: "176", since: "1", type: "Number", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "listEncSessionKey", id: "177", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "previousMessageId", id: "175", since: "1", type: "String", cardinality: "ZeroOrOne", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "senderName", id: "173", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "true", searchable: "false", sortable: "false"},
      { name: "senderNameUnencrypted", id: "174", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "sharableEncSessionKey", id: "179", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "subject", id: "171", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "true", searchable: "false", sortable: "false"},
      { name: "symEncSessionKey", id: "178", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "attachments", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "Attachment", final: "true" },
      { name: "bccRecipients", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "Recipient", final: "true" },
      { name: "ccRecipients", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "Recipient", final: "true" },
      { name: "toRecipients", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "Recipient", final: "true" },
    ]
  },
  AttachmentFromExternal: {
    name: "AttachmentFromExternal",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "185",
    rootId: "CHR1dGFub3RhAAC5",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "186", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "fileName", id: "189", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false", searchable: "true", sortable: "true"},
      { name: "mimeType", id: "190", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "recipientBucketEncFileSessionKey", id: "188", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "senderBucketEncFileSessionKey", id: "187", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "fileData", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "FileData" },
    ]
  },
  SendMailFromExternalService: {
    name: "SendMailFromExternalService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "192",
    rootId: "CHR1dGFub3RhAADA",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_format", id: "193", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "bodyText", id: "195", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "true", searchable: "false", sortable: "false"},
      { name: "previousMessageId", id: "197", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "recipientBucketEncSessionKey", id: "200", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "senderBucketEncSessionKey", id: "199", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "senderName", id: "196", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "true", searchable: "false", sortable: "false"},
      { name: "senderSymEncBucketKey", id: "198", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "subject", id: "194", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "true", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "attachments", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "AttachmentFromExternal", final: "true" },
      { name: "toRecipient", since: "1", type: "AGGREGATION", cardinality: "One", refType: "Recipient", final: "true" },
    ]
  },
  UnsecureRecipient: {
    name: "UnsecureRecipient",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "203",
    rootId: "CHR1dGFub3RhAADL",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "204", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "mailAddress", id: "206", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "name", id: "205", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  UnsecureAttachment: {
    name: "UnsecureAttachment",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "207",
    rootId: "CHR1dGFub3RhAADP",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "208", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "fileName", id: "212", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "true", enrypted: "false", searchable: "true", sortable: "true"},
      { name: "fileSessionKey", id: "209", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "listEncFileSessionKey", id: "210", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "mimeType", id: "213", since: "1", type: "Bytes", cardinality: "ZeroOrOne", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "file", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "File" },
      { name: "fileData", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "FileData" },
    ]
  },
  SendUnsecureMailService: {
    name: "SendUnsecureMailService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "215",
    rootId: "CHR1dGFub3RhAADX",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "216", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "bodyText", id: "218", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "conversationType", id: "221", since: "1", type: "Number", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "listEncSessionKey", id: "223", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "mailSessionKey", id: "222", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "previousMessageId", id: "220", since: "1", type: "String", cardinality: "ZeroOrOne", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "senderName", id: "219", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "sharableEncSessionKey", id: "225", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "subject", id: "217", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "symEncSessionKey", id: "224", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "attachments", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "UnsecureAttachment", final: "true" },
      { name: "bccRecipients", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "UnsecureRecipient", final: "true" },
      { name: "ccRecipients", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "UnsecureRecipient", final: "true" },
      { name: "toRecipients", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "UnsecureRecipient", final: "true" },
    ]
  },
  PasswordMessagingService: {
    name: "PasswordMessagingService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "230",
    rootId: "CHR1dGFub3RhAADm",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "231", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "number", id: "232", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "symKeyForPasswordTransmission", id: "233", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  PasswordAutoAuthenticationService: {
    name: "PasswordAutoAuthenticationService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "234",
    rootId: "CHR1dGFub3RhAADq",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "235", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  PasswordRetrievalService: {
    name: "PasswordRetrievalService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "236",
    rootId: "CHR1dGFub3RhAADs",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "237", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "transmissionKeyEncryptedPassword", id: "238", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  PasswordChannelService: {
    name: "PasswordChannelService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "239",
    rootId: "CHR1dGFub3RhAADv",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "240", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "phoneNumberChannels", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "PasswordChannelPhoneNumber", final: "true" },
    ]
  },
  FileDataService: {
    name: "FileDataService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "242",
    rootId: "CHR1dGFub3RhAADy",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_format", id: "243", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "size", id: "244", since: "1", type: "Number", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  CreateDataFileService: {
    name: "CreateDataFileService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "245",
    rootId: "CHR1dGFub3RhAAD1",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_format", id: "246", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "fileName", id: "247", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "true", searchable: "true", sortable: "true"},
      { name: "mimeType", id: "248", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "true", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "fileData", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "FileData" },
      { name: "parentFolder", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "File" },
    ]
  },
  CreateFolderService: {
    name: "CreateFolderService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "251",
    rootId: "CHR1dGFub3RhAAD7",
    versioned: false,
    encrypted: true,
    values: [
      { name: "_format", id: "252", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "fileName", id: "253", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "true", searchable: "true", sortable: "true"},
    ], associations: [
      { name: "parentFolder", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "ZeroOrOne", refType: "File" },
    ]
  },
  UpdateFileService: {
    name: "UpdateFileService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "255",
    rootId: "CHR1dGFub3RhAAD_",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "256", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "file", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "File" },
      { name: "fileData", since: "1", type: "ELEMENT_ASSOCIATION", cardinality: "One", refType: "FileData" },
    ]
  },
  DeleteFileService: {
    name: "DeleteFileService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "259",
    rootId: "CHR1dGFub3RhAAED",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "260", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "file", since: "1", type: "LIST_ELEMENT_ASSOCIATION", cardinality: "One", refType: "File" },
    ]
  },
  FeedbackService: {
    name: "FeedbackService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "262",
    rootId: "CHR1dGFub3RhAAEG",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "263", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "image", id: "266", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "msg", id: "264", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "useragent", id: "265", since: "1", type: "String", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  InitGroupService: {
    name: "InitGroupService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "267",
    rootId: "CHR1dGFub3RhAAEL",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "268", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "contactShareBucketEncContactListSessionKey", id: "273", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "fileShareBucketEncFileSystemSessionKey", id: "276", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "mailShareBucketEncMailBoxSessionKey", id: "270", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "symEncContactListSessionKey", id: "272", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "symEncContactShareBucketKey", id: "274", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "symEncFileShareBucketKey", id: "277", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "symEncFileSystemSessionKey", id: "275", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "symEncMailBoxSessionKey", id: "269", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "symEncMailShareBucketKey", id: "271", since: "1", type: "Bytes", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  WelcomeMailService: {
    name: "WelcomeMailService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "278",
    rootId: "CHR1dGFub3RhAAEW",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "279", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
} };
