import o from "@tutao/otest"
import { RegistryHive, WindowsRegistryFacade, WindowsRegistryKey } from "../../../../src/common/desktop/integration/WindowsRegistryFacade.js"
import { CommandExecutor, CommandOutput } from "../../../../src/common/desktop/CommandExecutor"
import { object, verify, when } from "testdouble"
import { assertNotNull } from "@tutao/tutanota-utils"

o.spec("WindowsRegistryFacade", () => {
	let executor: CommandExecutor
	let facade: WindowsRegistryFacade

	o.beforeEach(() => {
		executor = object()
		facade = new WindowsRegistryFacade(executor)
	})

	o.spec("get", () => {
		const hive = RegistryHive.HKEY_CURRENT_USER
		const path = "\\Some\\Path\\Here"
		const value = "something"
		const combined = `${hive}${path}`

		let entry: WindowsRegistryKey
		let commandOutput: CommandOutput<string, string> | undefined = undefined

		o.beforeEach(() => {
			entry = facade.entry(hive, path)
			when(
				executor.run({
					executable: "reg",
					args: ["QUERY", combined, "/v", value],
				}),
			).thenDo(async (_) => assertNotNull(commandOutput))
		})

		o.test("string", async () => {
			commandOutput = {
				stdout: `\n${combined}\n    ${value}    REG_SZ    Here is a lovely string\n`,
				stderr: "",
				exitCode: 0,
			}
			const result = await entry.get(value)
			o.check(result).equals("Here is a lovely string")
		})
		o.test("dword", async () => {
			commandOutput = {
				stdout: `\n${combined}\n    ${value}    REG_DWORD    12345678\n`,
				stderr: "",
				exitCode: 0,
			}
			const result = await entry.get(value)
			o.check(result).equals(12345678)
		})
		o.test("unknown", async () => {
			commandOutput = {
				stdout: `\n${combined}\n    ${value}    REG_SOMETHING    oooooooooo spooky value what is this????\n`,
				stderr: "",
				exitCode: 0,
			}
			const result = await entry.get(value)
			o.check(result).equals("oooooooooo spooky value what is this????")
		})
		o.test("nothing", async () => {
			commandOutput = {
				stdout: "",
				stderr: "no value for you sorry :(",
				exitCode: 1,
			}
			const result = await entry.get(value)
			o.check(result).equals(null)
		})
	})

	o.test("enumerate", async () => {
		const hive = RegistryHive.HKEY_CURRENT_USER
		const path = "\\Some\\Path\\Here"
		const combined = `${hive}${path}`
		const entry = facade.entry(hive, path)
		when(
			executor.run({
				executable: "reg",
				args: ["QUERY", combined],
			}),
		).thenResolve({
			stdout: `\n${combined}\n    here-is-a-string-key    REG_SZ    Here is a lovely string\n    here-is-a-number-key    REG_DWORD    12345678\n`,
			stderr: "",
			exitCode: 0,
		})
		const result = await entry.enumerate()
		const kv: [string, string | number][] = [
			["here-is-a-string-key", "Here is a lovely string"],
			["here-is-a-number-key", 12345678],
		]
		const expected: Map<string, string | number> = new Map(kv)
		o.check(result).deepEquals(expected)
	})

	o.spec("set", () => {
		const hive = RegistryHive.HKEY_CURRENT_USER
		const path = "\\Some\\Path\\Here"
		const valueName = "something"
		const combined = `${hive}${path}`

		let entry: WindowsRegistryKey

		o.beforeEach(() => {
			entry = facade.entry(hive, path)
		})

		o.test("string", async () => {
			when(
				executor.run({
					executable: "reg",
					args: ["ADD", combined, "/v", valueName, "/t", "REG_SZ", "/d", "my new string", "/f"],
				}),
			).thenResolve({
				exitCode: 0,
				stderr: "",
				stdout: "Yay!",
			})
			await entry.set(valueName, "my new string")
			verify(
				executor.run({
					executable: "reg",
					args: ["ADD", combined, "/v", valueName, "/t", "REG_SZ", "/d", "my new string", "/f"],
				}),
			)
		})
		o.test("dword", async () => {
			when(
				executor.run({
					executable: "reg",
					args: ["ADD", combined, "/v", valueName, "/t", "REG_DWORD", "/d", "314159265", "/f"],
				}),
			).thenResolve({
				exitCode: 0,
				stderr: "",
				stdout: "Yay!",
			})
			await entry.set(valueName, 314159265)
			verify(
				executor.run({
					executable: "reg",
					args: ["ADD", combined, "/v", valueName, "/t", "REG_DWORD", "/d", "314159265", "/f"],
				}),
			)
		})
	})

	o.test("remove", async () => {
		const hive = RegistryHive.HKEY_CURRENT_USER
		const path = "\\Some\\Path\\Here"
		const valueName = "something"
		const combined = `${hive}${path}`
		const entry = facade.entry(hive, path)

		o.test("when present", async () => {
			when(
				executor.run({
					executable: "reg",
					args: ["DELETE", combined, "/v", valueName, "/f"],
				}),
			).thenResolve({
				exitCode: 0,
				stderr: "",
				stdout: "Yay!",
			})

			o.check(await entry.remove(valueName)).equals(true)
		})

		o.test("when failed", async () => {
			when(
				executor.run({
					executable: "reg",
					args: ["DELETE", combined, "/v", valueName, "/f"],
				}),
			).thenResolve({
				exitCode: 1,
				stderr: "Boo! Wasn't there :(",
				stdout: "",
			})

			o.check(await entry.remove(valueName)).equals(false)
		})
	})
})
