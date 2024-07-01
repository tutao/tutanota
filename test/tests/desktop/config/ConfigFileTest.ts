import o from "@tutao/otest"
import n from "../../nodemocker.js"
import { delay, numberRange } from "@tutao/tutanota-utils"
import { getConfigFile } from "../../../../src/common/desktop/config/ConfigFile.js"

const MAX_LATENCY = 20
const rndDelay = () => delay(Math.floor(Math.random() * MAX_LATENCY))

export const fsMock = {
	accessSync: function (p) {
		if (Object.keys(this.promises.fs).includes(p)) return
		throw new Error("404")
	},
	constants: {},
	promises: {
		fs: {
			"path/present.json": JSON.stringify({ a: "hello", b: "" }),
		},
		writeFile: function (p: string, v: string) {
			return rndDelay().then(() => (this.fs[p] = v))
		},
		readFile: function (p: string) {
			return rndDelay().then(() => this.fs[p])
		},
		mkdir: function (p: string, o: any) {
			Promise.resolve()
		},
	},
}

o.spec("ConfigFileTest", function () {
	o("ensurePresence works", async function () {
		const newV = { a: "bye", b: "hello" }
		const cf = getConfigFile("path", "present.json", n.mock<typeof import("fs")>("fs", fsMock).set())
		return cf
			.ensurePresence(newV)
			.then(() => cf.readJSON())
			.then((v) => {
				o(v).notDeepEquals(newV)
			})
	})

	o("ensurePresence works 2", async function () {
		const cf = getConfigFile("path", "not-present.json", n.mock<typeof import("fs")>("fs", fsMock).set())
		const newV = { a: "bye", b: "hello" }
		return cf
			.ensurePresence(newV)
			.then(() => cf.readJSON())
			.then((v) => {
				o(v).deepEquals(newV)
			})
	})

	o("interleaved reads/writes work", async function () {
		o.timeout(500)
		const cf = getConfigFile("path", "conf.json", n.mock<typeof import("fs")>("fs", fsMock).set())

		const cycles = 19
		const res: number[] = []

		for (let i = 0; i < cycles + 1; ) {
			await Promise.resolve()
			cf.writeJSON({ a: i++ })
			await Promise.resolve()
			cf.readJSON().then((v) => {
				i = v.a
				res.push(i)
			})
		}

		// flush writes/reads
		await cf.readJSON()

		o(res).deepEquals(numberRange(0, cycles))
	})

	o("instance pool works", async function () {
		const fs = n.mock<typeof import("fs")>("fs", fsMock).set()
		const first = getConfigFile("path", "somepath.json", fs)

		await first.ensurePresence({ mork: 123 })

		const second = getConfigFile("path", "somepath.json", fs)

		await second.ensurePresence({ mork: 321 })

		const unchanged_content = await first.readJSON()
		o(unchanged_content).deepEquals({ mork: 123 })

		second.writeJSON({ a: false })

		const changed_content = await first.readJSON()
		o(changed_content).deepEquals({ a: false })

		// @ts-ignore
		first.t = true
		// @ts-ignore
		o(second.t).equals(true)
	})
})
