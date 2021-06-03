// @flow

import o from "ospec"
import {ConfigurationDatabase, encryptItem} from "../../../src/api/worker/facades/ConfigurationDatabase"
import {downcast} from "../../../src/api/common/utils/Utils"
import {DbStub} from "./search/DbStub"
import type {ExternalImageRuleEnum} from "../../../src/api/common/TutanotaConstants"
import {ExternalImageRule} from "../../../src/api/common/TutanotaConstants"
import {aes256RandomKey, IV_BYTE_LENGTH} from "../../../src/api/worker/crypto/Aes"
import {random} from "../../../src/api/worker/crypto/Randomizer"
import {createUser} from "../../../src/api/entities/sys/User"

o.spec("ConfigurationDbTest", function () {
	function makeMocks(allowListTable: Array<{address: string, rule?: ExternalImageRuleEnum}>) {

		const key = aes256RandomKey()
		const iv = random.generateRandomData(IV_BYTE_LENGTH)

		const logins = downcast({
			getLoggedInUser() { return createUser() },
			getUserGroupKey() { }
		})

		const loadDb = downcast(async function (user, groupKey) {
			const stub = new DbStub()
			stub.addObjectStore("ExternalAllowListOS", false, "address")
			for (let entry of allowListTable) {
				const transaction = stub.createTransaction()
				const encryptedAddress = await encryptItem(entry.address, key, iv)
				await transaction.put("ExternalAllowListOS", null,{address: encryptedAddress, rule: entry.rule})
			}
			return {
				db: stub,
				metaData: {key, iv}
			}
		})
		return {logins, loadDb}
	}

	o.spec("V1: External image allow list only", function () {

		o("read", async function () {
			const {logins, loadDb} = makeMocks([
				{address: "fomo@server.com"}
			])
			const configDb = new ConfigurationDatabase(logins, loadDb)

			const shouldBeAllow = await configDb.getExternalImageRule("fomo@server.com")
			o(shouldBeAllow).equals(ExternalImageRule.Allow)

			const shouldBeDefault = await configDb.getExternalImageRule("notinthere@neverseen.biz")
			o(shouldBeDefault).equals(ExternalImageRule.None)
		})

		o("write", async function () {
			const {logins, loadDb} = makeMocks([])
			const configDb = new ConfigurationDatabase(logins, loadDb)

			await configDb.addExternalImageRule("fomo@server.com", ExternalImageRule.Allow)
			o(await configDb.getExternalImageRule("fomo@server.com")).equals(ExternalImageRule.Allow)

			await configDb.addExternalImageRule("fomo@server.com", ExternalImageRule.None)
			o(await configDb.getExternalImageRule("fomo@server.com")).equals(ExternalImageRule.None)

		})

	})

	o.spec("V2: External image rules list", function () {
		o("read", async function () {
			const {logins, loadDb} = makeMocks([
				{address: "fomo@server.com", rule: ExternalImageRule.Allow},
				{address: "lomo@server.com", rule: ExternalImageRule.Block}
			])
			const configDb = new ConfigurationDatabase(logins, loadDb)

			const shouldBeAllow = await configDb.getExternalImageRule("fomo@server.com")
			o(shouldBeAllow).equals(ExternalImageRule.Allow)

			const shouldBeBlock = await configDb.getExternalImageRule("lomo@server.com")
			o(shouldBeBlock).equals(ExternalImageRule.Block)

			const shouldBeDefault = await configDb.getExternalImageRule("notinthere@neverseen.biz")
			o(shouldBeDefault).equals(ExternalImageRule.None)
		})

		o("write", async function () {
			const {logins, loadDb} = makeMocks([])
			const configDb = new ConfigurationDatabase(logins, loadDb)

			await configDb.addExternalImageRule("fomo@server.com", ExternalImageRule.Block)
			o(await configDb.getExternalImageRule("fomo@server.com")).equals(ExternalImageRule.Block)

			await configDb.addExternalImageRule("fomo@server.com", ExternalImageRule.Allow)
			o(await configDb.getExternalImageRule("fomo@server.com")).equals(ExternalImageRule.Allow)

			await configDb.addExternalImageRule("fomo@server.com", ExternalImageRule.None)
			o(await configDb.getExternalImageRule("fomo@server.com")).equals(ExternalImageRule.None)

		})
	})
})