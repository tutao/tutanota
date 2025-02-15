
//#region src/common/api/entities/monitor/TypeModels.js
const typeModels = {
	"ApprovalMail": {
		"name": "ApprovalMail",
		"since": 14,
		"type": "LIST_ELEMENT_TYPE",
		"id": 221,
		"rootId": "B21vbml0b3IAAN0",
		"versioned": false,
		"encrypted": false,
		"values": {
			"_format": {
				"final": false,
				"name": "_format",
				"id": 225,
				"since": 14,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"_id": {
				"final": true,
				"name": "_id",
				"id": 223,
				"since": 14,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"_ownerGroup": {
				"final": true,
				"name": "_ownerGroup",
				"id": 226,
				"since": 14,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"_permissions": {
				"final": true,
				"name": "_permissions",
				"id": 224,
				"since": 14,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"date": {
				"final": true,
				"name": "date",
				"id": 228,
				"since": 14,
				"type": "Date",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"range": {
				"final": true,
				"name": "range",
				"id": 227,
				"since": 14,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"text": {
				"final": true,
				"name": "text",
				"id": 229,
				"since": 14,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": { "customer": {
			"final": true,
			"name": "customer",
			"id": 230,
			"since": 14,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "Customer",
			"dependency": null
		} },
		"app": "monitor",
		"version": "30"
	},
	"CounterValue": {
		"name": "CounterValue",
		"since": 22,
		"type": "AGGREGATED_TYPE",
		"id": 300,
		"rootId": "B21vbml0b3IAASw",
		"versioned": false,
		"encrypted": false,
		"values": {
			"_id": {
				"final": true,
				"name": "_id",
				"id": 301,
				"since": 22,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"counterId": {
				"final": false,
				"name": "counterId",
				"id": 302,
				"since": 22,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"value": {
				"final": false,
				"name": "value",
				"id": 303,
				"since": 22,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {},
		"app": "monitor",
		"version": "30"
	},
	"ErrorReportData": {
		"name": "ErrorReportData",
		"since": 23,
		"type": "AGGREGATED_TYPE",
		"id": 316,
		"rootId": "B21vbml0b3IAATw",
		"versioned": false,
		"encrypted": false,
		"values": {
			"_id": {
				"final": true,
				"name": "_id",
				"id": 317,
				"since": 23,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"additionalInfo": {
				"final": true,
				"name": "additionalInfo",
				"id": 326,
				"since": 23,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"appVersion": {
				"final": true,
				"name": "appVersion",
				"id": 319,
				"since": 23,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"clientType": {
				"final": true,
				"name": "clientType",
				"id": 320,
				"since": 23,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"errorClass": {
				"final": true,
				"name": "errorClass",
				"id": 322,
				"since": 23,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"errorMessage": {
				"final": true,
				"name": "errorMessage",
				"id": 323,
				"since": 23,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"stackTrace": {
				"final": true,
				"name": "stackTrace",
				"id": 324,
				"since": 23,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"time": {
				"final": true,
				"name": "time",
				"id": 318,
				"since": 23,
				"type": "Date",
				"cardinality": "One",
				"encrypted": false
			},
			"userId": {
				"final": true,
				"name": "userId",
				"id": 321,
				"since": 23,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"userMessage": {
				"final": true,
				"name": "userMessage",
				"id": 325,
				"since": 23,
				"type": "String",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": {},
		"app": "monitor",
		"version": "30"
	},
	"ErrorReportFile": {
		"name": "ErrorReportFile",
		"since": 23,
		"type": "AGGREGATED_TYPE",
		"id": 305,
		"rootId": "B21vbml0b3IAATE",
		"versioned": false,
		"encrypted": false,
		"values": {
			"_id": {
				"final": true,
				"name": "_id",
				"id": 306,
				"since": 23,
				"type": "CustomId",
				"cardinality": "One",
				"encrypted": false
			},
			"content": {
				"final": true,
				"name": "content",
				"id": 308,
				"since": 23,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"name": {
				"final": true,
				"name": "name",
				"id": 307,
				"since": 23,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {},
		"app": "monitor",
		"version": "30"
	},
	"ReadCounterData": {
		"name": "ReadCounterData",
		"since": 1,
		"type": "DATA_TRANSFER_TYPE",
		"id": 12,
		"rootId": "B21vbml0b3IADA",
		"versioned": false,
		"encrypted": false,
		"values": {
			"_format": {
				"final": false,
				"name": "_format",
				"id": 13,
				"since": 1,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"columnName": {
				"final": false,
				"name": "columnName",
				"id": 15,
				"since": 1,
				"type": "GeneratedId",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"counterType": {
				"final": false,
				"name": "counterType",
				"id": 299,
				"since": 22,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"rowName": {
				"final": false,
				"name": "rowName",
				"id": 14,
				"since": 1,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {},
		"app": "monitor",
		"version": "30"
	},
	"ReadCounterReturn": {
		"name": "ReadCounterReturn",
		"since": 1,
		"type": "DATA_TRANSFER_TYPE",
		"id": 16,
		"rootId": "B21vbml0b3IAEA",
		"versioned": false,
		"encrypted": false,
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
			"value": {
				"final": false,
				"name": "value",
				"id": 18,
				"since": 1,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			}
		},
		"associations": { "counterValues": {
			"final": false,
			"name": "counterValues",
			"id": 304,
			"since": 22,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "CounterValue",
			"dependency": null
		} },
		"app": "monitor",
		"version": "30"
	},
	"ReportErrorIn": {
		"name": "ReportErrorIn",
		"since": 23,
		"type": "DATA_TRANSFER_TYPE",
		"id": 335,
		"rootId": "B21vbml0b3IAAU8",
		"versioned": false,
		"encrypted": false,
		"values": { "_format": {
			"final": false,
			"name": "_format",
			"id": 336,
			"since": 23,
			"type": "Number",
			"cardinality": "One",
			"encrypted": false
		} },
		"associations": {
			"data": {
				"final": false,
				"name": "data",
				"id": 337,
				"since": 23,
				"type": "AGGREGATION",
				"cardinality": "One",
				"refType": "ErrorReportData",
				"dependency": null
			},
			"files": {
				"final": false,
				"name": "files",
				"id": 338,
				"since": 23,
				"type": "AGGREGATION",
				"cardinality": "Any",
				"refType": "ErrorReportFile",
				"dependency": null
			}
		},
		"app": "monitor",
		"version": "30"
	},
	"WriteCounterData": {
		"name": "WriteCounterData",
		"since": 4,
		"type": "DATA_TRANSFER_TYPE",
		"id": 49,
		"rootId": "B21vbml0b3IAMQ",
		"versioned": false,
		"encrypted": false,
		"values": {
			"_format": {
				"final": false,
				"name": "_format",
				"id": 50,
				"since": 4,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			},
			"column": {
				"final": false,
				"name": "column",
				"id": 52,
				"since": 4,
				"type": "GeneratedId",
				"cardinality": "One",
				"encrypted": false
			},
			"counterType": {
				"final": false,
				"name": "counterType",
				"id": 215,
				"since": 12,
				"type": "Number",
				"cardinality": "ZeroOrOne",
				"encrypted": false
			},
			"row": {
				"final": false,
				"name": "row",
				"id": 51,
				"since": 4,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"value": {
				"final": false,
				"name": "value",
				"id": 53,
				"since": 4,
				"type": "Number",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {},
		"app": "monitor",
		"version": "30"
	}
};

//#endregion
export { typeModels as typeModels$4 };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVHlwZU1vZGVsczMtY2h1bmsuanMiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsiLi4vc3JjL2NvbW1vbi9hcGkvZW50aXRpZXMvbW9uaXRvci9UeXBlTW9kZWxzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIFRoaXMgaXMgYW4gYXV0b21hdGljYWxseSBnZW5lcmF0ZWQgZmlsZSwgcGxlYXNlIGRvIG5vdCBlZGl0IGJ5IGhhbmQhXG5cbi8vIFlvdSBzaG91bGQgbm90IHVzZSBpdCBkaXJlY3RseSwgcGxlYXNlIHVzZSBgcmVzb2x2ZVR5cFJlZmVyZW5jZSgpYCBpbnN0ZWFkLlx0XG4vLyBXZSBkbyBub3Qgd2FudCB0c2MgdG8gc3BlbmQgdGltZSBlaXRoZXIgY2hlY2tpbmcgb3IgaW5mZXJyaW5nIHR5cGUgb2YgdGhlc2UgaHVnZSBleHByZXNzaW9ucy4gRXZlbiB3aGVuIGl0IGRvZXMgdHJ5IHRvIGluZmVyIHRoZW0gdGhleSBhcmUgc3RpbGwgd3JvbmcuXG4vLyBUaGUgYWN0dWFsIHR5cGUgaXMgYW4gb2JqZWN0IHdpdGgga2V5cyBhcyBlbnRpdGllcyBuYW1lcyBhbmQgdmFsdWVzIGFzIFR5cGVNb2RlbC5cblxuLyoqIEB0eXBlIHthbnl9ICovXG5leHBvcnQgY29uc3QgdHlwZU1vZGVscyA9IHtcblx0XCJBcHByb3ZhbE1haWxcIjoge1xuXHRcdFwibmFtZVwiOiBcIkFwcHJvdmFsTWFpbFwiLFxuXHRcdFwic2luY2VcIjogMTQsXG5cdFx0XCJ0eXBlXCI6IFwiTElTVF9FTEVNRU5UX1RZUEVcIixcblx0XHRcImlkXCI6IDIyMSxcblx0XHRcInJvb3RJZFwiOiBcIkIyMXZibWwwYjNJQUFOMFwiLFxuXHRcdFwidmVyc2lvbmVkXCI6IGZhbHNlLFxuXHRcdFwiZW5jcnlwdGVkXCI6IGZhbHNlLFxuXHRcdFwidmFsdWVzXCI6IHtcblx0XHRcdFwiX2Zvcm1hdFwiOiB7XG5cdFx0XHRcdFwiZmluYWxcIjogZmFsc2UsXG5cdFx0XHRcdFwibmFtZVwiOiBcIl9mb3JtYXRcIixcblx0XHRcdFx0XCJpZFwiOiAyMjUsXG5cdFx0XHRcdFwic2luY2VcIjogMTQsXG5cdFx0XHRcdFwidHlwZVwiOiBcIk51bWJlclwiLFxuXHRcdFx0XHRcImNhcmRpbmFsaXR5XCI6IFwiT25lXCIsXG5cdFx0XHRcdFwiZW5jcnlwdGVkXCI6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0XCJfaWRcIjoge1xuXHRcdFx0XHRcImZpbmFsXCI6IHRydWUsXG5cdFx0XHRcdFwibmFtZVwiOiBcIl9pZFwiLFxuXHRcdFx0XHRcImlkXCI6IDIyMyxcblx0XHRcdFx0XCJzaW5jZVwiOiAxNCxcblx0XHRcdFx0XCJ0eXBlXCI6IFwiQ3VzdG9tSWRcIixcblx0XHRcdFx0XCJjYXJkaW5hbGl0eVwiOiBcIk9uZVwiLFxuXHRcdFx0XHRcImVuY3J5cHRlZFwiOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdFwiX293bmVyR3JvdXBcIjoge1xuXHRcdFx0XHRcImZpbmFsXCI6IHRydWUsXG5cdFx0XHRcdFwibmFtZVwiOiBcIl9vd25lckdyb3VwXCIsXG5cdFx0XHRcdFwiaWRcIjogMjI2LFxuXHRcdFx0XHRcInNpbmNlXCI6IDE0LFxuXHRcdFx0XHRcInR5cGVcIjogXCJHZW5lcmF0ZWRJZFwiLFxuXHRcdFx0XHRcImNhcmRpbmFsaXR5XCI6IFwiWmVyb09yT25lXCIsXG5cdFx0XHRcdFwiZW5jcnlwdGVkXCI6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0XCJfcGVybWlzc2lvbnNcIjoge1xuXHRcdFx0XHRcImZpbmFsXCI6IHRydWUsXG5cdFx0XHRcdFwibmFtZVwiOiBcIl9wZXJtaXNzaW9uc1wiLFxuXHRcdFx0XHRcImlkXCI6IDIyNCxcblx0XHRcdFx0XCJzaW5jZVwiOiAxNCxcblx0XHRcdFx0XCJ0eXBlXCI6IFwiR2VuZXJhdGVkSWRcIixcblx0XHRcdFx0XCJjYXJkaW5hbGl0eVwiOiBcIk9uZVwiLFxuXHRcdFx0XHRcImVuY3J5cHRlZFwiOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdFwiZGF0ZVwiOiB7XG5cdFx0XHRcdFwiZmluYWxcIjogdHJ1ZSxcblx0XHRcdFx0XCJuYW1lXCI6IFwiZGF0ZVwiLFxuXHRcdFx0XHRcImlkXCI6IDIyOCxcblx0XHRcdFx0XCJzaW5jZVwiOiAxNCxcblx0XHRcdFx0XCJ0eXBlXCI6IFwiRGF0ZVwiLFxuXHRcdFx0XHRcImNhcmRpbmFsaXR5XCI6IFwiWmVyb09yT25lXCIsXG5cdFx0XHRcdFwiZW5jcnlwdGVkXCI6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0XCJyYW5nZVwiOiB7XG5cdFx0XHRcdFwiZmluYWxcIjogdHJ1ZSxcblx0XHRcdFx0XCJuYW1lXCI6IFwicmFuZ2VcIixcblx0XHRcdFx0XCJpZFwiOiAyMjcsXG5cdFx0XHRcdFwic2luY2VcIjogMTQsXG5cdFx0XHRcdFwidHlwZVwiOiBcIlN0cmluZ1wiLFxuXHRcdFx0XHRcImNhcmRpbmFsaXR5XCI6IFwiWmVyb09yT25lXCIsXG5cdFx0XHRcdFwiZW5jcnlwdGVkXCI6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0XCJ0ZXh0XCI6IHtcblx0XHRcdFx0XCJmaW5hbFwiOiB0cnVlLFxuXHRcdFx0XHRcIm5hbWVcIjogXCJ0ZXh0XCIsXG5cdFx0XHRcdFwiaWRcIjogMjI5LFxuXHRcdFx0XHRcInNpbmNlXCI6IDE0LFxuXHRcdFx0XHRcInR5cGVcIjogXCJTdHJpbmdcIixcblx0XHRcdFx0XCJjYXJkaW5hbGl0eVwiOiBcIk9uZVwiLFxuXHRcdFx0XHRcImVuY3J5cHRlZFwiOiBmYWxzZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0XCJhc3NvY2lhdGlvbnNcIjoge1xuXHRcdFx0XCJjdXN0b21lclwiOiB7XG5cdFx0XHRcdFwiZmluYWxcIjogdHJ1ZSxcblx0XHRcdFx0XCJuYW1lXCI6IFwiY3VzdG9tZXJcIixcblx0XHRcdFx0XCJpZFwiOiAyMzAsXG5cdFx0XHRcdFwic2luY2VcIjogMTQsXG5cdFx0XHRcdFwidHlwZVwiOiBcIkVMRU1FTlRfQVNTT0NJQVRJT05cIixcblx0XHRcdFx0XCJjYXJkaW5hbGl0eVwiOiBcIlplcm9Pck9uZVwiLFxuXHRcdFx0XHRcInJlZlR5cGVcIjogXCJDdXN0b21lclwiLFxuXHRcdFx0XHRcImRlcGVuZGVuY3lcIjogbnVsbFxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0XCJhcHBcIjogXCJtb25pdG9yXCIsXG5cdFx0XCJ2ZXJzaW9uXCI6IFwiMzBcIlxuXHR9LFxuXHRcIkNvdW50ZXJWYWx1ZVwiOiB7XG5cdFx0XCJuYW1lXCI6IFwiQ291bnRlclZhbHVlXCIsXG5cdFx0XCJzaW5jZVwiOiAyMixcblx0XHRcInR5cGVcIjogXCJBR0dSRUdBVEVEX1RZUEVcIixcblx0XHRcImlkXCI6IDMwMCxcblx0XHRcInJvb3RJZFwiOiBcIkIyMXZibWwwYjNJQUFTd1wiLFxuXHRcdFwidmVyc2lvbmVkXCI6IGZhbHNlLFxuXHRcdFwiZW5jcnlwdGVkXCI6IGZhbHNlLFxuXHRcdFwidmFsdWVzXCI6IHtcblx0XHRcdFwiX2lkXCI6IHtcblx0XHRcdFx0XCJmaW5hbFwiOiB0cnVlLFxuXHRcdFx0XHRcIm5hbWVcIjogXCJfaWRcIixcblx0XHRcdFx0XCJpZFwiOiAzMDEsXG5cdFx0XHRcdFwic2luY2VcIjogMjIsXG5cdFx0XHRcdFwidHlwZVwiOiBcIkN1c3RvbUlkXCIsXG5cdFx0XHRcdFwiY2FyZGluYWxpdHlcIjogXCJPbmVcIixcblx0XHRcdFx0XCJlbmNyeXB0ZWRcIjogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRcImNvdW50ZXJJZFwiOiB7XG5cdFx0XHRcdFwiZmluYWxcIjogZmFsc2UsXG5cdFx0XHRcdFwibmFtZVwiOiBcImNvdW50ZXJJZFwiLFxuXHRcdFx0XHRcImlkXCI6IDMwMixcblx0XHRcdFx0XCJzaW5jZVwiOiAyMixcblx0XHRcdFx0XCJ0eXBlXCI6IFwiR2VuZXJhdGVkSWRcIixcblx0XHRcdFx0XCJjYXJkaW5hbGl0eVwiOiBcIk9uZVwiLFxuXHRcdFx0XHRcImVuY3J5cHRlZFwiOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdFwidmFsdWVcIjoge1xuXHRcdFx0XHRcImZpbmFsXCI6IGZhbHNlLFxuXHRcdFx0XHRcIm5hbWVcIjogXCJ2YWx1ZVwiLFxuXHRcdFx0XHRcImlkXCI6IDMwMyxcblx0XHRcdFx0XCJzaW5jZVwiOiAyMixcblx0XHRcdFx0XCJ0eXBlXCI6IFwiTnVtYmVyXCIsXG5cdFx0XHRcdFwiY2FyZGluYWxpdHlcIjogXCJPbmVcIixcblx0XHRcdFx0XCJlbmNyeXB0ZWRcIjogZmFsc2Vcblx0XHRcdH1cblx0XHR9LFxuXHRcdFwiYXNzb2NpYXRpb25zXCI6IHt9LFxuXHRcdFwiYXBwXCI6IFwibW9uaXRvclwiLFxuXHRcdFwidmVyc2lvblwiOiBcIjMwXCJcblx0fSxcblx0XCJFcnJvclJlcG9ydERhdGFcIjoge1xuXHRcdFwibmFtZVwiOiBcIkVycm9yUmVwb3J0RGF0YVwiLFxuXHRcdFwic2luY2VcIjogMjMsXG5cdFx0XCJ0eXBlXCI6IFwiQUdHUkVHQVRFRF9UWVBFXCIsXG5cdFx0XCJpZFwiOiAzMTYsXG5cdFx0XCJyb290SWRcIjogXCJCMjF2Ym1sMGIzSUFBVHdcIixcblx0XHRcInZlcnNpb25lZFwiOiBmYWxzZSxcblx0XHRcImVuY3J5cHRlZFwiOiBmYWxzZSxcblx0XHRcInZhbHVlc1wiOiB7XG5cdFx0XHRcIl9pZFwiOiB7XG5cdFx0XHRcdFwiZmluYWxcIjogdHJ1ZSxcblx0XHRcdFx0XCJuYW1lXCI6IFwiX2lkXCIsXG5cdFx0XHRcdFwiaWRcIjogMzE3LFxuXHRcdFx0XHRcInNpbmNlXCI6IDIzLFxuXHRcdFx0XHRcInR5cGVcIjogXCJDdXN0b21JZFwiLFxuXHRcdFx0XHRcImNhcmRpbmFsaXR5XCI6IFwiT25lXCIsXG5cdFx0XHRcdFwiZW5jcnlwdGVkXCI6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0XCJhZGRpdGlvbmFsSW5mb1wiOiB7XG5cdFx0XHRcdFwiZmluYWxcIjogdHJ1ZSxcblx0XHRcdFx0XCJuYW1lXCI6IFwiYWRkaXRpb25hbEluZm9cIixcblx0XHRcdFx0XCJpZFwiOiAzMjYsXG5cdFx0XHRcdFwic2luY2VcIjogMjMsXG5cdFx0XHRcdFwidHlwZVwiOiBcIlN0cmluZ1wiLFxuXHRcdFx0XHRcImNhcmRpbmFsaXR5XCI6IFwiT25lXCIsXG5cdFx0XHRcdFwiZW5jcnlwdGVkXCI6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0XCJhcHBWZXJzaW9uXCI6IHtcblx0XHRcdFx0XCJmaW5hbFwiOiB0cnVlLFxuXHRcdFx0XHRcIm5hbWVcIjogXCJhcHBWZXJzaW9uXCIsXG5cdFx0XHRcdFwiaWRcIjogMzE5LFxuXHRcdFx0XHRcInNpbmNlXCI6IDIzLFxuXHRcdFx0XHRcInR5cGVcIjogXCJTdHJpbmdcIixcblx0XHRcdFx0XCJjYXJkaW5hbGl0eVwiOiBcIk9uZVwiLFxuXHRcdFx0XHRcImVuY3J5cHRlZFwiOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdFwiY2xpZW50VHlwZVwiOiB7XG5cdFx0XHRcdFwiZmluYWxcIjogdHJ1ZSxcblx0XHRcdFx0XCJuYW1lXCI6IFwiY2xpZW50VHlwZVwiLFxuXHRcdFx0XHRcImlkXCI6IDMyMCxcblx0XHRcdFx0XCJzaW5jZVwiOiAyMyxcblx0XHRcdFx0XCJ0eXBlXCI6IFwiTnVtYmVyXCIsXG5cdFx0XHRcdFwiY2FyZGluYWxpdHlcIjogXCJPbmVcIixcblx0XHRcdFx0XCJlbmNyeXB0ZWRcIjogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRcImVycm9yQ2xhc3NcIjoge1xuXHRcdFx0XHRcImZpbmFsXCI6IHRydWUsXG5cdFx0XHRcdFwibmFtZVwiOiBcImVycm9yQ2xhc3NcIixcblx0XHRcdFx0XCJpZFwiOiAzMjIsXG5cdFx0XHRcdFwic2luY2VcIjogMjMsXG5cdFx0XHRcdFwidHlwZVwiOiBcIlN0cmluZ1wiLFxuXHRcdFx0XHRcImNhcmRpbmFsaXR5XCI6IFwiT25lXCIsXG5cdFx0XHRcdFwiZW5jcnlwdGVkXCI6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0XCJlcnJvck1lc3NhZ2VcIjoge1xuXHRcdFx0XHRcImZpbmFsXCI6IHRydWUsXG5cdFx0XHRcdFwibmFtZVwiOiBcImVycm9yTWVzc2FnZVwiLFxuXHRcdFx0XHRcImlkXCI6IDMyMyxcblx0XHRcdFx0XCJzaW5jZVwiOiAyMyxcblx0XHRcdFx0XCJ0eXBlXCI6IFwiU3RyaW5nXCIsXG5cdFx0XHRcdFwiY2FyZGluYWxpdHlcIjogXCJaZXJvT3JPbmVcIixcblx0XHRcdFx0XCJlbmNyeXB0ZWRcIjogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRcInN0YWNrVHJhY2VcIjoge1xuXHRcdFx0XHRcImZpbmFsXCI6IHRydWUsXG5cdFx0XHRcdFwibmFtZVwiOiBcInN0YWNrVHJhY2VcIixcblx0XHRcdFx0XCJpZFwiOiAzMjQsXG5cdFx0XHRcdFwic2luY2VcIjogMjMsXG5cdFx0XHRcdFwidHlwZVwiOiBcIlN0cmluZ1wiLFxuXHRcdFx0XHRcImNhcmRpbmFsaXR5XCI6IFwiT25lXCIsXG5cdFx0XHRcdFwiZW5jcnlwdGVkXCI6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0XCJ0aW1lXCI6IHtcblx0XHRcdFx0XCJmaW5hbFwiOiB0cnVlLFxuXHRcdFx0XHRcIm5hbWVcIjogXCJ0aW1lXCIsXG5cdFx0XHRcdFwiaWRcIjogMzE4LFxuXHRcdFx0XHRcInNpbmNlXCI6IDIzLFxuXHRcdFx0XHRcInR5cGVcIjogXCJEYXRlXCIsXG5cdFx0XHRcdFwiY2FyZGluYWxpdHlcIjogXCJPbmVcIixcblx0XHRcdFx0XCJlbmNyeXB0ZWRcIjogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRcInVzZXJJZFwiOiB7XG5cdFx0XHRcdFwiZmluYWxcIjogdHJ1ZSxcblx0XHRcdFx0XCJuYW1lXCI6IFwidXNlcklkXCIsXG5cdFx0XHRcdFwiaWRcIjogMzIxLFxuXHRcdFx0XHRcInNpbmNlXCI6IDIzLFxuXHRcdFx0XHRcInR5cGVcIjogXCJTdHJpbmdcIixcblx0XHRcdFx0XCJjYXJkaW5hbGl0eVwiOiBcIlplcm9Pck9uZVwiLFxuXHRcdFx0XHRcImVuY3J5cHRlZFwiOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdFwidXNlck1lc3NhZ2VcIjoge1xuXHRcdFx0XHRcImZpbmFsXCI6IHRydWUsXG5cdFx0XHRcdFwibmFtZVwiOiBcInVzZXJNZXNzYWdlXCIsXG5cdFx0XHRcdFwiaWRcIjogMzI1LFxuXHRcdFx0XHRcInNpbmNlXCI6IDIzLFxuXHRcdFx0XHRcInR5cGVcIjogXCJTdHJpbmdcIixcblx0XHRcdFx0XCJjYXJkaW5hbGl0eVwiOiBcIlplcm9Pck9uZVwiLFxuXHRcdFx0XHRcImVuY3J5cHRlZFwiOiBmYWxzZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0XCJhc3NvY2lhdGlvbnNcIjoge30sXG5cdFx0XCJhcHBcIjogXCJtb25pdG9yXCIsXG5cdFx0XCJ2ZXJzaW9uXCI6IFwiMzBcIlxuXHR9LFxuXHRcIkVycm9yUmVwb3J0RmlsZVwiOiB7XG5cdFx0XCJuYW1lXCI6IFwiRXJyb3JSZXBvcnRGaWxlXCIsXG5cdFx0XCJzaW5jZVwiOiAyMyxcblx0XHRcInR5cGVcIjogXCJBR0dSRUdBVEVEX1RZUEVcIixcblx0XHRcImlkXCI6IDMwNSxcblx0XHRcInJvb3RJZFwiOiBcIkIyMXZibWwwYjNJQUFURVwiLFxuXHRcdFwidmVyc2lvbmVkXCI6IGZhbHNlLFxuXHRcdFwiZW5jcnlwdGVkXCI6IGZhbHNlLFxuXHRcdFwidmFsdWVzXCI6IHtcblx0XHRcdFwiX2lkXCI6IHtcblx0XHRcdFx0XCJmaW5hbFwiOiB0cnVlLFxuXHRcdFx0XHRcIm5hbWVcIjogXCJfaWRcIixcblx0XHRcdFx0XCJpZFwiOiAzMDYsXG5cdFx0XHRcdFwic2luY2VcIjogMjMsXG5cdFx0XHRcdFwidHlwZVwiOiBcIkN1c3RvbUlkXCIsXG5cdFx0XHRcdFwiY2FyZGluYWxpdHlcIjogXCJPbmVcIixcblx0XHRcdFx0XCJlbmNyeXB0ZWRcIjogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRcImNvbnRlbnRcIjoge1xuXHRcdFx0XHRcImZpbmFsXCI6IHRydWUsXG5cdFx0XHRcdFwibmFtZVwiOiBcImNvbnRlbnRcIixcblx0XHRcdFx0XCJpZFwiOiAzMDgsXG5cdFx0XHRcdFwic2luY2VcIjogMjMsXG5cdFx0XHRcdFwidHlwZVwiOiBcIlN0cmluZ1wiLFxuXHRcdFx0XHRcImNhcmRpbmFsaXR5XCI6IFwiT25lXCIsXG5cdFx0XHRcdFwiZW5jcnlwdGVkXCI6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0XCJuYW1lXCI6IHtcblx0XHRcdFx0XCJmaW5hbFwiOiB0cnVlLFxuXHRcdFx0XHRcIm5hbWVcIjogXCJuYW1lXCIsXG5cdFx0XHRcdFwiaWRcIjogMzA3LFxuXHRcdFx0XHRcInNpbmNlXCI6IDIzLFxuXHRcdFx0XHRcInR5cGVcIjogXCJTdHJpbmdcIixcblx0XHRcdFx0XCJjYXJkaW5hbGl0eVwiOiBcIk9uZVwiLFxuXHRcdFx0XHRcImVuY3J5cHRlZFwiOiBmYWxzZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0XCJhc3NvY2lhdGlvbnNcIjoge30sXG5cdFx0XCJhcHBcIjogXCJtb25pdG9yXCIsXG5cdFx0XCJ2ZXJzaW9uXCI6IFwiMzBcIlxuXHR9LFxuXHRcIlJlYWRDb3VudGVyRGF0YVwiOiB7XG5cdFx0XCJuYW1lXCI6IFwiUmVhZENvdW50ZXJEYXRhXCIsXG5cdFx0XCJzaW5jZVwiOiAxLFxuXHRcdFwidHlwZVwiOiBcIkRBVEFfVFJBTlNGRVJfVFlQRVwiLFxuXHRcdFwiaWRcIjogMTIsXG5cdFx0XCJyb290SWRcIjogXCJCMjF2Ym1sMGIzSUFEQVwiLFxuXHRcdFwidmVyc2lvbmVkXCI6IGZhbHNlLFxuXHRcdFwiZW5jcnlwdGVkXCI6IGZhbHNlLFxuXHRcdFwidmFsdWVzXCI6IHtcblx0XHRcdFwiX2Zvcm1hdFwiOiB7XG5cdFx0XHRcdFwiZmluYWxcIjogZmFsc2UsXG5cdFx0XHRcdFwibmFtZVwiOiBcIl9mb3JtYXRcIixcblx0XHRcdFx0XCJpZFwiOiAxMyxcblx0XHRcdFx0XCJzaW5jZVwiOiAxLFxuXHRcdFx0XHRcInR5cGVcIjogXCJOdW1iZXJcIixcblx0XHRcdFx0XCJjYXJkaW5hbGl0eVwiOiBcIk9uZVwiLFxuXHRcdFx0XHRcImVuY3J5cHRlZFwiOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdFwiY29sdW1uTmFtZVwiOiB7XG5cdFx0XHRcdFwiZmluYWxcIjogZmFsc2UsXG5cdFx0XHRcdFwibmFtZVwiOiBcImNvbHVtbk5hbWVcIixcblx0XHRcdFx0XCJpZFwiOiAxNSxcblx0XHRcdFx0XCJzaW5jZVwiOiAxLFxuXHRcdFx0XHRcInR5cGVcIjogXCJHZW5lcmF0ZWRJZFwiLFxuXHRcdFx0XHRcImNhcmRpbmFsaXR5XCI6IFwiWmVyb09yT25lXCIsXG5cdFx0XHRcdFwiZW5jcnlwdGVkXCI6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0XCJjb3VudGVyVHlwZVwiOiB7XG5cdFx0XHRcdFwiZmluYWxcIjogZmFsc2UsXG5cdFx0XHRcdFwibmFtZVwiOiBcImNvdW50ZXJUeXBlXCIsXG5cdFx0XHRcdFwiaWRcIjogMjk5LFxuXHRcdFx0XHRcInNpbmNlXCI6IDIyLFxuXHRcdFx0XHRcInR5cGVcIjogXCJOdW1iZXJcIixcblx0XHRcdFx0XCJjYXJkaW5hbGl0eVwiOiBcIk9uZVwiLFxuXHRcdFx0XHRcImVuY3J5cHRlZFwiOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdFwicm93TmFtZVwiOiB7XG5cdFx0XHRcdFwiZmluYWxcIjogZmFsc2UsXG5cdFx0XHRcdFwibmFtZVwiOiBcInJvd05hbWVcIixcblx0XHRcdFx0XCJpZFwiOiAxNCxcblx0XHRcdFx0XCJzaW5jZVwiOiAxLFxuXHRcdFx0XHRcInR5cGVcIjogXCJTdHJpbmdcIixcblx0XHRcdFx0XCJjYXJkaW5hbGl0eVwiOiBcIk9uZVwiLFxuXHRcdFx0XHRcImVuY3J5cHRlZFwiOiBmYWxzZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0XCJhc3NvY2lhdGlvbnNcIjoge30sXG5cdFx0XCJhcHBcIjogXCJtb25pdG9yXCIsXG5cdFx0XCJ2ZXJzaW9uXCI6IFwiMzBcIlxuXHR9LFxuXHRcIlJlYWRDb3VudGVyUmV0dXJuXCI6IHtcblx0XHRcIm5hbWVcIjogXCJSZWFkQ291bnRlclJldHVyblwiLFxuXHRcdFwic2luY2VcIjogMSxcblx0XHRcInR5cGVcIjogXCJEQVRBX1RSQU5TRkVSX1RZUEVcIixcblx0XHRcImlkXCI6IDE2LFxuXHRcdFwicm9vdElkXCI6IFwiQjIxdmJtbDBiM0lBRUFcIixcblx0XHRcInZlcnNpb25lZFwiOiBmYWxzZSxcblx0XHRcImVuY3J5cHRlZFwiOiBmYWxzZSxcblx0XHRcInZhbHVlc1wiOiB7XG5cdFx0XHRcIl9mb3JtYXRcIjoge1xuXHRcdFx0XHRcImZpbmFsXCI6IGZhbHNlLFxuXHRcdFx0XHRcIm5hbWVcIjogXCJfZm9ybWF0XCIsXG5cdFx0XHRcdFwiaWRcIjogMTcsXG5cdFx0XHRcdFwic2luY2VcIjogMSxcblx0XHRcdFx0XCJ0eXBlXCI6IFwiTnVtYmVyXCIsXG5cdFx0XHRcdFwiY2FyZGluYWxpdHlcIjogXCJPbmVcIixcblx0XHRcdFx0XCJlbmNyeXB0ZWRcIjogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRcInZhbHVlXCI6IHtcblx0XHRcdFx0XCJmaW5hbFwiOiBmYWxzZSxcblx0XHRcdFx0XCJuYW1lXCI6IFwidmFsdWVcIixcblx0XHRcdFx0XCJpZFwiOiAxOCxcblx0XHRcdFx0XCJzaW5jZVwiOiAxLFxuXHRcdFx0XHRcInR5cGVcIjogXCJOdW1iZXJcIixcblx0XHRcdFx0XCJjYXJkaW5hbGl0eVwiOiBcIlplcm9Pck9uZVwiLFxuXHRcdFx0XHRcImVuY3J5cHRlZFwiOiBmYWxzZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0XCJhc3NvY2lhdGlvbnNcIjoge1xuXHRcdFx0XCJjb3VudGVyVmFsdWVzXCI6IHtcblx0XHRcdFx0XCJmaW5hbFwiOiBmYWxzZSxcblx0XHRcdFx0XCJuYW1lXCI6IFwiY291bnRlclZhbHVlc1wiLFxuXHRcdFx0XHRcImlkXCI6IDMwNCxcblx0XHRcdFx0XCJzaW5jZVwiOiAyMixcblx0XHRcdFx0XCJ0eXBlXCI6IFwiQUdHUkVHQVRJT05cIixcblx0XHRcdFx0XCJjYXJkaW5hbGl0eVwiOiBcIkFueVwiLFxuXHRcdFx0XHRcInJlZlR5cGVcIjogXCJDb3VudGVyVmFsdWVcIixcblx0XHRcdFx0XCJkZXBlbmRlbmN5XCI6IG51bGxcblx0XHRcdH1cblx0XHR9LFxuXHRcdFwiYXBwXCI6IFwibW9uaXRvclwiLFxuXHRcdFwidmVyc2lvblwiOiBcIjMwXCJcblx0fSxcblx0XCJSZXBvcnRFcnJvckluXCI6IHtcblx0XHRcIm5hbWVcIjogXCJSZXBvcnRFcnJvckluXCIsXG5cdFx0XCJzaW5jZVwiOiAyMyxcblx0XHRcInR5cGVcIjogXCJEQVRBX1RSQU5TRkVSX1RZUEVcIixcblx0XHRcImlkXCI6IDMzNSxcblx0XHRcInJvb3RJZFwiOiBcIkIyMXZibWwwYjNJQUFVOFwiLFxuXHRcdFwidmVyc2lvbmVkXCI6IGZhbHNlLFxuXHRcdFwiZW5jcnlwdGVkXCI6IGZhbHNlLFxuXHRcdFwidmFsdWVzXCI6IHtcblx0XHRcdFwiX2Zvcm1hdFwiOiB7XG5cdFx0XHRcdFwiZmluYWxcIjogZmFsc2UsXG5cdFx0XHRcdFwibmFtZVwiOiBcIl9mb3JtYXRcIixcblx0XHRcdFx0XCJpZFwiOiAzMzYsXG5cdFx0XHRcdFwic2luY2VcIjogMjMsXG5cdFx0XHRcdFwidHlwZVwiOiBcIk51bWJlclwiLFxuXHRcdFx0XHRcImNhcmRpbmFsaXR5XCI6IFwiT25lXCIsXG5cdFx0XHRcdFwiZW5jcnlwdGVkXCI6IGZhbHNlXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRcImFzc29jaWF0aW9uc1wiOiB7XG5cdFx0XHRcImRhdGFcIjoge1xuXHRcdFx0XHRcImZpbmFsXCI6IGZhbHNlLFxuXHRcdFx0XHRcIm5hbWVcIjogXCJkYXRhXCIsXG5cdFx0XHRcdFwiaWRcIjogMzM3LFxuXHRcdFx0XHRcInNpbmNlXCI6IDIzLFxuXHRcdFx0XHRcInR5cGVcIjogXCJBR0dSRUdBVElPTlwiLFxuXHRcdFx0XHRcImNhcmRpbmFsaXR5XCI6IFwiT25lXCIsXG5cdFx0XHRcdFwicmVmVHlwZVwiOiBcIkVycm9yUmVwb3J0RGF0YVwiLFxuXHRcdFx0XHRcImRlcGVuZGVuY3lcIjogbnVsbFxuXHRcdFx0fSxcblx0XHRcdFwiZmlsZXNcIjoge1xuXHRcdFx0XHRcImZpbmFsXCI6IGZhbHNlLFxuXHRcdFx0XHRcIm5hbWVcIjogXCJmaWxlc1wiLFxuXHRcdFx0XHRcImlkXCI6IDMzOCxcblx0XHRcdFx0XCJzaW5jZVwiOiAyMyxcblx0XHRcdFx0XCJ0eXBlXCI6IFwiQUdHUkVHQVRJT05cIixcblx0XHRcdFx0XCJjYXJkaW5hbGl0eVwiOiBcIkFueVwiLFxuXHRcdFx0XHRcInJlZlR5cGVcIjogXCJFcnJvclJlcG9ydEZpbGVcIixcblx0XHRcdFx0XCJkZXBlbmRlbmN5XCI6IG51bGxcblx0XHRcdH1cblx0XHR9LFxuXHRcdFwiYXBwXCI6IFwibW9uaXRvclwiLFxuXHRcdFwidmVyc2lvblwiOiBcIjMwXCJcblx0fSxcblx0XCJXcml0ZUNvdW50ZXJEYXRhXCI6IHtcblx0XHRcIm5hbWVcIjogXCJXcml0ZUNvdW50ZXJEYXRhXCIsXG5cdFx0XCJzaW5jZVwiOiA0LFxuXHRcdFwidHlwZVwiOiBcIkRBVEFfVFJBTlNGRVJfVFlQRVwiLFxuXHRcdFwiaWRcIjogNDksXG5cdFx0XCJyb290SWRcIjogXCJCMjF2Ym1sMGIzSUFNUVwiLFxuXHRcdFwidmVyc2lvbmVkXCI6IGZhbHNlLFxuXHRcdFwiZW5jcnlwdGVkXCI6IGZhbHNlLFxuXHRcdFwidmFsdWVzXCI6IHtcblx0XHRcdFwiX2Zvcm1hdFwiOiB7XG5cdFx0XHRcdFwiZmluYWxcIjogZmFsc2UsXG5cdFx0XHRcdFwibmFtZVwiOiBcIl9mb3JtYXRcIixcblx0XHRcdFx0XCJpZFwiOiA1MCxcblx0XHRcdFx0XCJzaW5jZVwiOiA0LFxuXHRcdFx0XHRcInR5cGVcIjogXCJOdW1iZXJcIixcblx0XHRcdFx0XCJjYXJkaW5hbGl0eVwiOiBcIk9uZVwiLFxuXHRcdFx0XHRcImVuY3J5cHRlZFwiOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdFwiY29sdW1uXCI6IHtcblx0XHRcdFx0XCJmaW5hbFwiOiBmYWxzZSxcblx0XHRcdFx0XCJuYW1lXCI6IFwiY29sdW1uXCIsXG5cdFx0XHRcdFwiaWRcIjogNTIsXG5cdFx0XHRcdFwic2luY2VcIjogNCxcblx0XHRcdFx0XCJ0eXBlXCI6IFwiR2VuZXJhdGVkSWRcIixcblx0XHRcdFx0XCJjYXJkaW5hbGl0eVwiOiBcIk9uZVwiLFxuXHRcdFx0XHRcImVuY3J5cHRlZFwiOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdFwiY291bnRlclR5cGVcIjoge1xuXHRcdFx0XHRcImZpbmFsXCI6IGZhbHNlLFxuXHRcdFx0XHRcIm5hbWVcIjogXCJjb3VudGVyVHlwZVwiLFxuXHRcdFx0XHRcImlkXCI6IDIxNSxcblx0XHRcdFx0XCJzaW5jZVwiOiAxMixcblx0XHRcdFx0XCJ0eXBlXCI6IFwiTnVtYmVyXCIsXG5cdFx0XHRcdFwiY2FyZGluYWxpdHlcIjogXCJaZXJvT3JPbmVcIixcblx0XHRcdFx0XCJlbmNyeXB0ZWRcIjogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRcInJvd1wiOiB7XG5cdFx0XHRcdFwiZmluYWxcIjogZmFsc2UsXG5cdFx0XHRcdFwibmFtZVwiOiBcInJvd1wiLFxuXHRcdFx0XHRcImlkXCI6IDUxLFxuXHRcdFx0XHRcInNpbmNlXCI6IDQsXG5cdFx0XHRcdFwidHlwZVwiOiBcIlN0cmluZ1wiLFxuXHRcdFx0XHRcImNhcmRpbmFsaXR5XCI6IFwiT25lXCIsXG5cdFx0XHRcdFwiZW5jcnlwdGVkXCI6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0XCJ2YWx1ZVwiOiB7XG5cdFx0XHRcdFwiZmluYWxcIjogZmFsc2UsXG5cdFx0XHRcdFwibmFtZVwiOiBcInZhbHVlXCIsXG5cdFx0XHRcdFwiaWRcIjogNTMsXG5cdFx0XHRcdFwic2luY2VcIjogNCxcblx0XHRcdFx0XCJ0eXBlXCI6IFwiTnVtYmVyXCIsXG5cdFx0XHRcdFwiY2FyZGluYWxpdHlcIjogXCJPbmVcIixcblx0XHRcdFx0XCJlbmNyeXB0ZWRcIjogZmFsc2Vcblx0XHRcdH1cblx0XHR9LFxuXHRcdFwiYXNzb2NpYXRpb25zXCI6IHt9LFxuXHRc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