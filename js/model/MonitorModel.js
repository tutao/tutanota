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
      { name: "_format", id: "3", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_id", id: "1", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_permissions", id: "2", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "value", id: "4", since: "1", type: "Number", cardinality: "ZeroOrOne", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  CounterSnapshotSeries: {
    name: "CounterSnapshotSeries",
    since: "1",
    type: "ELEMENT_TYPE",
    id: "5",
    rootId: "B21vbml0b3IABQ",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "8", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_id", id: "6", since: "1", type: "CustomId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_permissions", id: "7", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
      { name: "snapshots", since: "1", type: "LIST_ASSOCIATION", cardinality: "One", refType: "CounterSnapshot" },
    ]
  },
  ReadCounterService: {
    name: "ReadCounterService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "10",
    rootId: "B21vbml0b3IACg",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "11", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "value", id: "12", since: "1", type: "Number", cardinality: "ZeroOrOne", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  CreateCounterSnapshotService: {
    name: "CreateCounterSnapshotService",
    since: "1",
    type: "SERVICE_TYPE",
    id: "13",
    rootId: "B21vbml0b3IADQ",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "14", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
  LogEntry: {
    name: "LogEntry",
    since: "1",
    type: "LIST_ELEMENT_TYPE",
    id: "15",
    rootId: "B21vbml0b3IADw",
    versioned: false,
    encrypted: false,
    values: [
      { name: "_format", id: "18", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_id", id: "16", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "_permissions", id: "17", since: "1", type: "GeneratedId", cardinality: "One", final: "true", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "agent", id: "24", since: "1", type: "String", cardinality: "ZeroOrOne", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "date", id: "20", since: "1", type: "Date", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "level", id: "21", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "logger", id: "25", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "message", id: "28", since: "1", type: "String", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "server", id: "19", since: "1", type: "Number", cardinality: "One", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "source", id: "26", since: "1", type: "String", cardinality: "ZeroOrOne", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "thread", id: "27", since: "1", type: "String", cardinality: "ZeroOrOne", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "url", id: "23", since: "1", type: "String", cardinality: "ZeroOrOne", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
      { name: "userId", id: "22", since: "1", type: "GeneratedId", cardinality: "ZeroOrOne", final: "false", enrypted: "false", searchable: "false", sortable: "false"},
    ], associations: [
    ]
  },
} };
