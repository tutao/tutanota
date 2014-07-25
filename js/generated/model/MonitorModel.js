"use strict";

goog.provide('tutao.tutanota.model.monitor_model');

tutao.tutanota.model.monitor_model = {
name: "monitor",
version: "1",
types: {
  CounterSnapshot: {
    name: "CounterSnapshot",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "0",
    rootId: "B21vbml0b3IAAA",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "4", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "2", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "3", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "value", id: "5", since: "1", type: "Number", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  CounterSnapshotSeries: {
    name: "CounterSnapshotSeries",
    since: "1",
    type: "ELEMENT_TYPE",
    id: "6",
    rootId: "B21vbml0b3IABg",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "10", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "8", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "9", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
    ], associations: [
      { name: "snapshots", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "CounterSnapshot" },
    ]
  },
  ReadCounterData: {
    name: "ReadCounterData",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "12",
    rootId: "B21vbml0b3IADA",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "13", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "monitor", id: "14", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "owner", id: "15", since: "1", type: "GeneratedId", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  ReadCounterReturn: {
    name: "ReadCounterReturn",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "16",
    rootId: "B21vbml0b3IAEA",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "17", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "value", id: "18", since: "1", type: "Number", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  CreateCounterMonitor: {
    name: "CreateCounterMonitor",
    since: "1",
    type: "AGGREGATED_TYPE",
    id: "20",
    rootId: "B21vbml0b3IAFA",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_id", id: "21", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "monitor", id: "22", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
  CreateCounterSnapshotData: {
    name: "CreateCounterSnapshotData",
    since: "1",
    type: "DATA_TRANSFER_TYPE",
    id: "23",
    rootId: "B21vbml0b3IAFw",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "24", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
    ], associations: [
      { name: "monitors", since: "1", type: "AGGREGATION", cardinality: "Any", refType: "CreateCounterMonitor", final: "false" },
    ]
  },
  LogEntry: {
    name: "LogEntry",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "27",
    rootId: "B21vbml0b3IAGw",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "31", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "_id", id: "29", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "_permissions", id: "30", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false"},
      { name: "agent", id: "37", since: "1", type: "String", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "date", id: "33", since: "1", type: "Date", cardinality: "One", final: "false", enrypted: "false"},
      { name: "level", id: "34", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "logger", id: "38", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "message", id: "41", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false"},
      { name: "server", id: "32", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false"},
      { name: "source", id: "39", since: "1", type: "String", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "thread", id: "40", since: "1", type: "String", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "url", id: "36", since: "1", type: "String", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
      { name: "userId", id: "35", since: "1", type: "GeneratedId", cardinality: "ZeroOrOne", final: "false", enrypted: "false"},
    ], associations: [
    ]
  },
} };
