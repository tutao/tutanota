//@flow
import o from "ospec"
import {_loadMultipleEntities, _setupMultipleEntities, HttpMethod} from "../../../src/api/common/EntityFunctions"
import {CustomerTypeRef} from "../../../src/api/entities/sys/Customer"
import {createContact} from "../../../src/api/entities/tutanota/Contact"
import {flat} from "@tutao/tutanota-utils"
import {BadRequestError, InternalServerError, PayloadTooLargeError} from "../../../src/api/common/error/RestError"
import {assertThrows} from "../../../packages/tutanota-test-utils"
import {SetupMultipleError} from "../../../src/api/common/error/SetupMultipleError"

o.spec("EntityFunctions", async function () {

	o("_loadMultipleEntities", async function () {

		await testLoadMultipleEntities(fillArray(0, 1), [["0"]])
		await testLoadMultipleEntities(fillArray(0, 100), [fillArray(0, 100)])
		await testLoadMultipleEntities(fillArray(0, 101), [fillArray(0, 100), ["100"]])
		await testLoadMultipleEntities(fillArray(0, 211), [fillArray(0, 100), fillArray(100, 100), fillArray(200, 11)])
	})

	o.spec("setupMultipleEntities", async function () {
		o("_setupMultipleEntities", async function () {
			const listId = "listId"
			await testSetupMultipleEntities(listId, [["0"]])
			await testSetupMultipleEntities(listId, [fillArray(0, 100)])
			await testSetupMultipleEntities(listId, [fillArray(0, 100), ["100"]])
			await testSetupMultipleEntities(listId, [fillArray(0, 100), fillArray(100, 100), fillArray(200, 11)])
		})

		o("post multiple error", async function () {
			const listId = "listId"
			const idArrays = Array.apply(null, Array(100)).map(i => null)
			const instances = []
			idArrays.forEach((idArray, index) => {
				instances.push(createContact())
			})
			let target = {
				entityRequest: (typeRef, method, listId, id, entity, queryParams) => {
					return Promise.reject(new BadRequestError("test"))
				}
			}
			const result = await assertThrows(SetupMultipleError, async () => {
				return await _setupMultipleEntities(listId, instances, (target: any))
			})
			o(result.failedInstances.length).equals(instances.length)
			o(result.errors.length).equals(1)
			o(result.errors[0] instanceof BadRequestError).equals(true)
			o(result.failedInstances).deepEquals(instances)
		})

		o("partial post multiple error", async function () {
			const listId = "listId"
			const idArrays = [fillArray(0, 100), Array.apply(null, Array(100)).map(i => null)]
			let instances = []
			idArrays.forEach((idArray, index) => {
				instances.push([])
				for (let i = 0; i < idArray.length; i++) {
					instances[index].push(createContact())
				}
			})
			let requestCount = 0
			let target = {
				entityRequest: (typeRef, method, listId, id, entity, queryParams) => {
					if (requestCount === 0) {
						requestCount += 1
						return Promise.resolve(idArrays[0])
					}
					return Promise.reject(new BadRequestError("test"))
				}
			}

			const result = await assertThrows(SetupMultipleError, async () => {
				return await _setupMultipleEntities(listId, flat(instances), (target: any))
			})
			o(result.failedInstances.length).equals(instances[1].length)
			o(result.errors.length).equals(1)
			o(result.errors[0] instanceof BadRequestError).equals(true)
			o(result.failedInstances).deepEquals(instances[1])
		})

		o("test PayLoadTooLargeError", async function () {
			const listId = "listId"
			const idArrays = [fillArray(0, 100), ["100", null, "102"]] // GET fails for id 101
			let instances = []
			idArrays.forEach((idArray, index) => {
				instances.push([])
				for (let i = 0; i < idArray.length; i++) {
					instances[index].push(createContact())
				}
			})
			let requestCount = 0
			let step = 0
			let target = {
				entityRequest: (typeRef, method, listId, id, entity, queryParams) => {
					if (requestCount === 0) {
						requestCount += 1
						return Promise.resolve(idArrays[0])
					} else if (Array.isArray(entity) && entity.length > 1) {
						return Promise.reject(new PayloadTooLargeError("test"))
					} else if (step === 1) {
						step += 1
						return Promise.reject(new InternalServerError("might happen"))
					} else {
						return Promise.resolve(idArrays[1][step++])
					}
				}
			}

			const result = await assertThrows(SetupMultipleError, async () => {
				return await _setupMultipleEntities(listId, flat(instances), (target: any))
			})
			o(result.failedInstances.length).equals(1)
			o(result.errors.length).equals(1)
			o(result.errors[0] instanceof InternalServerError).equals(true)
			o(result.failedInstances).deepEquals([instances[1][1]])
		})
	})


	async function testLoadMultipleEntities(requestedIds, expectedIdArrays) {
		let step = 0
		let target = {
			entityRequest: (typeRef, method, listId, id, entity, queryParams) => {
				o(method).equals(HttpMethod.GET)
				o(listId).equals(null)
				o(id).equals(null)
				o(entity).equals(null)
				o(queryParams.ids).equals(expectedIdArrays[step].join(","))
				step++
				return Promise.resolve(queryParams.ids.split(","))
			}
		}
		return _loadMultipleEntities(CustomerTypeRef, null, requestedIds, (target: any)).then(result => {
			o(step).equals(expectedIdArrays.length)
			o(result).deepEquals(requestedIds)
		})
	}

	async function testSetupMultipleEntities(listId: Id, expectedIdArrays) {
		let instances = []
		expectedIdArrays.forEach((idArray, index) => {
			instances.push([])
			for (let i = 0; i < idArray.length; i++) {
				instances[index].push(createContact())
			}
		})
		let step = 0
		let target = {
			entityRequest: (typeRef, method, listId, id, entity, queryParams) => {
				o(method).equals(HttpMethod.POST)
				o(listId).equals(listId)
				o(id).equals(null)
				o(entity).deepEquals(instances[step])
				o(queryParams.count).equals(expectedIdArrays[step].length + "")
				step++
				return Promise.resolve(expectedIdArrays[step - 1])
			}
		}
		return _setupMultipleEntities(listId, flat(instances), (target: any)).then(result => {
			o(step).equals(expectedIdArrays.length)
			o(result).deepEquals(flat(expectedIdArrays))
		})
	}


	let fillArray = function (start, count) {
		let arr = Array.apply(null, Array(count))
		return arr.map(function (x, i) { return String(start + i) })
	}
})
