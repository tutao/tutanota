import o from "@tutao/otest"
import { Captor, matchers, object, verify, when } from "testdouble"
import { CommandExecutor, ProcessIOEncoding, RunParams } from "../../../src/common/desktop/CommandExecutor"
import { ChildProcessExports } from "../../../src/common/desktop/ElectronExportTypes"
import { ChildProcessWithoutNullStreams } from "node:child_process"
import { Readable } from "node:stream"

o.spec("CommandExecutor", () => {
	let executor: CommandExecutor

	let childProcessExports: ChildProcessExports
	let childProcessObject: ChildProcessWithoutNullStreams

	let stdout: Readable
	let stderr: Readable

	let onError: Captor
	let onClose: Captor
	let onStdoutData: Captor
	let onStderrData: Captor

	o.beforeEach(() => {
		childProcessExports = object()
		stdout = object()
		stderr = object()

		childProcessObject = object()
		childProcessObject.stderr = stderr
		childProcessObject.stdout = stdout

		onError = matchers.captor()
		onClose = matchers.captor()
		onStdoutData = matchers.captor()
		onStderrData = matchers.captor()

		when(childProcessObject.on("error", onError.capture())).thenReturn({})
		when(childProcessObject.on("close", onClose.capture())).thenReturn({})

		when(stdout.on("data", onStdoutData.capture())).thenReturn({})
		when(stderr.on("data", onStderrData.capture())).thenReturn({})

		executor = new CommandExecutor(childProcessExports)
	})

	o.spec("run with output", () => {
		o.test("string data", async () => {
			const params: RunParams = {
				executable: "some executable",
				args: ["some", "args"],
				// this is the default
				// stdoutEncoding: ProcessIOEncoding.Utf8,
			}

			when(childProcessExports.spawn(params.executable, params.args, matchers.anything())).thenDo(() => {
				Promise.resolve().then(() => {
					onStdoutData.value("some data\n")
					onStdoutData.value("more data")
					onClose.value(0)
				})
				return childProcessObject
			})

			const result = await executor.run(params)
			o.check(result.stdout).equals("some data\nmore data")
			o.check(result.stderr).equals("")
			o.check(result.exitCode).equals(0)
		})
		o.test("binary", async () => {
			const params: RunParams<ProcessIOEncoding.Binary> = {
				executable: "some executable",
				args: ["some", "args"],
				stdoutEncoding: ProcessIOEncoding.Binary,
			}

			when(childProcessExports.spawn(params.executable, params.args, matchers.anything())).thenDo(() => {
				Promise.resolve().then(() => {
					onStdoutData.value(new Uint8Array([1, 2, 3, 4]))
					onStdoutData.value(new Uint8Array([5, 6, 7, 8, 9, 10]))
					onClose.value(0)
				})
				return childProcessObject
			})

			const result = await executor.run(params)
			o.check(result.stdout).deepEquals(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))
			o.check(result.stderr).equals("")
			o.check(result.exitCode).equals(0)
		})
		o.test("ignored", async () => {
			const params: RunParams<ProcessIOEncoding.Ignore> = {
				executable: "some executable",
				args: ["some", "args"],
				stdoutEncoding: ProcessIOEncoding.Ignore,
			}

			when(childProcessExports.spawn(params.executable, params.args, matchers.anything())).thenDo(() => {
				Promise.resolve().then(() => {
					onStdoutData.value(new Uint8Array([1, 2, 3, 4]))
					onStdoutData.value(new Uint8Array([5, 6, 7, 8, 9, 10]))
					onClose.value(0)
				})
				return childProcessObject
			})

			const result = await executor.run(params)
			o.check(result.stdout).deepEquals(null)
			o.check(result.stderr).equals("")
			o.check(result.exitCode).equals(0)
		})
	})

	o.spec("run with stderr", () => {
		o.test("default/string data", async () => {
			const params: RunParams<ProcessIOEncoding.Ignore> = {
				executable: "some executable",
				args: ["some", "args"],
				stdoutEncoding: ProcessIOEncoding.Ignore,
				// this is the default
				// stderrEncoding: ProcessIOEncoding.Utf8,
			}

			when(childProcessExports.spawn(params.executable, params.args, matchers.anything())).thenDo(() => {
				Promise.resolve().then(() => {
					onStderrData.value("some data\n")
					onStderrData.value("more data")
					onClose.value(0)
				})
				return childProcessObject
			})

			const result = await executor.run(params)
			o.check(result.stdout).equals(null)
			o.check(result.stderr).equals("some data\nmore data")
			o.check(result.exitCode).equals(0)
		})
		o.test("binary", async () => {
			const params: RunParams<ProcessIOEncoding.Ignore, ProcessIOEncoding.Binary> = {
				executable: "some executable",
				args: ["some", "args"],
				stdoutEncoding: ProcessIOEncoding.Ignore,
				stderrEncoding: ProcessIOEncoding.Binary,
			}

			when(childProcessExports.spawn(params.executable, params.args, matchers.anything())).thenDo(() => {
				Promise.resolve().then(() => {
					onStderrData.value(new Uint8Array([1, 2, 3, 4]))
					onStderrData.value(new Uint8Array([5, 6, 7, 8, 9, 10]))
					onClose.value(0)
				})
				return childProcessObject
			})

			const result = await executor.run(params)
			o.check(result.stdout).equals(null)
			o.check(result.stderr).deepEquals(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))
			o.check(result.exitCode).equals(0)
		})
		o.test("ignored", async () => {
			const params: RunParams<ProcessIOEncoding.Ignore, ProcessIOEncoding.Ignore> = {
				executable: "some executable",
				args: ["some", "args"],
				stdoutEncoding: ProcessIOEncoding.Ignore,
				stderrEncoding: ProcessIOEncoding.Ignore,
			}

			when(childProcessExports.spawn(params.executable, params.args, matchers.anything())).thenDo(() => {
				Promise.resolve().then(() => {
					onStderrData.value(new Uint8Array([1, 2, 3, 4]))
					onStderrData.value(new Uint8Array([5, 6, 7, 8, 9, 10]))
					onClose.value(0)
				})
				return childProcessObject
			})

			const result = await executor.run(params)
			o.check(result.stdout).deepEquals(null)
			o.check(result.stderr).equals(null)
			o.check(result.exitCode).equals(0)
		})
	})

	o.test("returns exit code", async () => {
		const params: RunParams = {
			executable: "some executable",
			args: ["some", "args"],
			stdoutEncoding: ProcessIOEncoding.Utf8,
		}

		when(childProcessExports.spawn(params.executable, params.args, matchers.anything())).thenDo(() => {
			Promise.resolve().then(() => {
				onClose.value(123)
			})
			return childProcessObject
		})

		const result = await executor.run(params)
		o.check(result.stdout).equals("")
		o.check(result.stderr).equals("")
		o.check(result.exitCode).equals(123)
	})

	o.test("error", async () => {
		const params: RunParams = {
			executable: "some executable",
			args: ["some", "args"],
			stdoutEncoding: ProcessIOEncoding.Utf8,
		}

		const someError = new Error("oh noooooo")

		when(childProcessExports.spawn(params.executable, params.args, matchers.anything())).thenDo(() => {
			Promise.resolve().then(() => {
				onError.value(someError)
			})
			return childProcessObject
		})

		try {
			await executor.run(params)
			throw new Error("should have exceptioned")
		} catch (e) {
			o.check(e).equals(someError)
		}
	})

	o.test("runDetached", () => {
		executor.runDetached({
			executable: "an executable",
			args: ["some", "args"],
			currentDirectory: "/some/directory",
		})

		verify(
			childProcessExports.spawn("an executable", ["some", "args"], {
				cwd: "/some/directory",
				detached: true,
				stdio: "ignore",
			}),
		)
	})
})
