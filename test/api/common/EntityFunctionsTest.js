//@flow
import o from "ospec/ospec.js"
import {_loadMultipleEntities, HttpMethod} from "../../../src/api/common/EntityFunctions"
import {CustomerTypeRef} from "../../../src/api/entities/sys/Customer"

o.spec("EntityFunctions", function () {

	o("_loadMultipleEntities", function () {
		testLoadMultipleEntities(fillArray(0, 1), [["0"]])
		testLoadMultipleEntities(fillArray(0, 100), [fillArray(0, 100)])
		testLoadMultipleEntities(fillArray(0, 101), [fillArray(0, 100), ["100"]])
		testLoadMultipleEntities(fillArray(0, 211), [fillArray(0, 100), fillArray(100, 100), fillArray(200, 11)])
	})

	let testLoadMultipleEntities = function (requestedIds, expectedIdArrays) {
		let step = 0
		let target = {
			entityRequest: (typeRef, method, listId, id, entity, queryParams) => {
				o(method).equals(HttpMethod.GET)
				o(listId).equals(null)
				o(id).equals(null)
				o(entity).equals(null)
				o(queryParams.ids).equals(expectedIdArrays[step].join(","))
				step++
				return (queryParams.ids.split(","): any)
			}
		}
		return _loadMultipleEntities(CustomerTypeRef, null, requestedIds, (target: any)).then(result => {
			o(step).equals(expectedIdArrays.length)
			o(result).deepEquals(requestedIds)
		})
	}

	let fillArray = function (start, count) {
		let arr = Array.apply(null, Array(count))
		return arr.map(function (x, i) { return String(start + i) })
	}
})
