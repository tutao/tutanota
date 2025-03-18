import o from "@tutao/otest"
import { InstanceCryptoMapper } from "../../../../../src/common/api/worker/crypto/InstanceCryptoMapper"
import { TypeModel } from "../../../../../src/common/api/common/EntityTypes"

o.spec("InstanceCryptoMapper", function () {
	let mapper: InstanceCryptoMapper = new InstanceCryptoMapper()

	o("decrypt", function () {
		const typeModel1: TypeModel = {
			id: 1,
			since: 0,
			app: "tutanota",
			version: "1",
			name: "DummyType",
			type: "ELEMENT_TYPE",
			versioned: false,
			encrypted: false,
			rootId: "arbitrary",
			values: {
				"1": {
					final: true,
					name: "count",
					id: 1,
					type: "Number",
					cardinality: "One",
					encrypted: false,
				},
			},
			associations: {
				"2": {
					final: true,
					name: "sender",
					id: 2,
					type: "AGGREGATION",
					cardinality: "One",
					refTypeId: 2,
					dependency: null,
				},
			},
		}

		const typeModel2: TypeModel = {
			id: 2,
			since: 0,
			app: "tutanota",
			version: "1",
			name: "DummyAssociation",
			type: "ELEMENT_TYPE",
			versioned: false,
			encrypted: false,
			rootId: "arbitrary",
			values: {
				"1": {
					final: true,
					name: "count",
					id: 1,
					type: "Number",
					cardinality: "One",
					encrypted: false,
				},
			},
			associations: {
				"2": {
					final: true,
					name: "sender",
					id: 2,
					type: "AGGREGATION",
					cardinality: "One",
					refTypeId: 2,
					dependency: null,
				},
			},
		}
		mapper.decryptParsedInstance()
	})
})
