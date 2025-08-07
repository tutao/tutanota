import { ChildProcessExports } from "./ElectronExportTypes"
import { Readable } from "node:stream"
import { SECOND_MS } from "../api/common/TutanotaConstants"

/**
 * Default number of seconds before timing out
 */
export const DEFAULT_TIMEOUT = 30 * SECOND_MS

/**
 * Parameters to use for executing commands.
 */
export interface ProcessParams<STDOUT extends ProcessIOEncoding = ProcessIOEncoding.Utf8, STDERR extends ProcessIOEncoding = ProcessIOEncoding.Utf8> {
	/**
	 * Executable/command to run.
	 */
	executable: string

	/**
	 * Args to pass.
	 */
	args: readonly string[]

	/**
	 * Current directory to use.
	 *
	 * By default, the current working directory will be used.
	 */
	currentDirectory?: string

	/**
	 * Timeout in milliseconds.
	 *
	 * By default, {@link DEFAULT_TIMEOUT} is used. If 0 is passed, the process will be allowed to run indefinitely.
	 */
	timeout?: number

	/**
	 * Output encoding to use.
	 *
	 * By default, this will be {@link ProcessIOEncoding.Utf8}.
	 */
	stdoutEncoding?: STDOUT

	/**
	 * Error encoding to use.
	 *
	 * By default, this will be {@link ProcessIOEncoding.Utf8}.
	 */
	stderrEncoding?: STDERR
}

/**
 * Encoding to use.
 */
export enum ProcessIOEncoding {
	/**
	 * Output will be null
	 */
	Ignore,

	/**
	 * Output will be a string
	 */
	Utf8,

	/**
	 * Output will be a Uint8Array
	 */
	Binary,
}

/**
 * Translates a given ProcessIOEncoding type to its JavaScript output type
 */
type OutputBufferFor<T> = T extends ProcessIOEncoding.Utf8
	? string
	: T extends ProcessIOEncoding.Binary
		? Uint8Array
		: T extends ProcessIOEncoding.Ignore
			? null
			: never

/**
 * Command output as a result of {@link CommandExecutor#run}
 */
export interface CommandOutput<STDOUT, STDERR> {
	/**
	 * All collected standard output
	 */
	readonly stdout: STDOUT

	/**
	 * All collected standard error
	 *
	 * Note that this being non-empty does not mean an error occurred.
	 */
	readonly stderr: STDERR

	/**
	 * The exit code returned by the process.
	 *
	 * An error code of zero typically indicates success. A non-zero error means that there was an error, but
	 * the process still ran successfully.
	 */
	readonly exitCode: number
}

/**
 * Interface for executing commands.
 */
export class CommandExecutor {
	constructor(private readonly childProcess: ChildProcessExports) {}

	/**
	 * Run the given command.
	 * @param params params to execute
	 * @return output from the command
	 * @throws Error if the command failed to execute
	 */
	run<STDOUT extends ProcessIOEncoding = ProcessIOEncoding.Utf8, STDERR extends ProcessIOEncoding = ProcessIOEncoding.Utf8>(
		params: ProcessParams<STDOUT, STDERR>,
	): Promise<CommandOutput<OutputBufferFor<STDOUT>, OutputBufferFor<STDERR>>> {
		const {
			executable,
			args,
			timeout = DEFAULT_TIMEOUT,
			stdoutEncoding = ProcessIOEncoding.Utf8,
			stderrEncoding = ProcessIOEncoding.Utf8,
			currentDirectory,
		} = params

		if (isNaN(timeout) || timeout < 0) {
			throw new Error(`invalid timeout ${timeout}`)
		}

		return new Promise((resolve, reject) => {
			let exited = false
			const process = this.childProcess.spawn(executable, args, {
				timeout: timeout === 0 ? undefined : timeout,
				cwd: currentDirectory,
			})

			let stdout = initializeOutputBuffer(stdoutEncoding)
			let stderr = initializeOutputBuffer(stderrEncoding)

			setEncodingForReadable(process.stdout, stdoutEncoding)
			setEncodingForReadable(process.stderr, stderrEncoding)

			process.on("error", (error) => {
				if (!exited) {
					exited = true
					reject(error)
				}
			})

			process.on("close", (exitCode) => {
				if (!exited) {
					exited = true
					if (exitCode == null) {
						reject(new Error("process was terminated or aborted due to an external signal"))
					} else {
						resolve({
							stdout: stdout as OutputBufferFor<STDOUT>,
							stderr: stderr as OutputBufferFor<STDERR>,
							exitCode,
						})
					}
				}
			})

			process.stdout.on("data", (data: string | Buffer) => {
				stdout = appendBuffer(stdout, data, stdoutEncoding)
			})

			process.stderr.on("data", (data: string | Buffer) => {
				stderr = appendBuffer(stderr, data, stderrEncoding)
			})
		})
	}
}

function appendBuffer(toBuffer: OutputBuffer, withData: string | Buffer, encoding: ProcessIOEncoding): OutputBuffer {
	switch (encoding) {
		case ProcessIOEncoding.Ignore:
			return null
		case ProcessIOEncoding.Binary: {
			const prefix = toBuffer as Uint8Array
			const suffix = withData as Buffer
			const newBuffer = new Uint8Array(prefix.length + suffix.length)
			newBuffer.set(prefix, 0)
			newBuffer.set(suffix, prefix.length)
			return newBuffer
		}
		case ProcessIOEncoding.Utf8: {
			return (toBuffer as string) + (withData as string)
		}
	}
}

function setEncodingForReadable(readable: Readable, encoding: ProcessIOEncoding) {
	switch (encoding) {
		case ProcessIOEncoding.Utf8:
			readable.setEncoding("utf8")
			break
		case ProcessIOEncoding.Binary:
			readable.setEncoding("binary")
			break
		case ProcessIOEncoding.Ignore:
			// we just ignore the input
			break
	}
}

function initializeOutputBuffer(encoding: ProcessIOEncoding): OutputBuffer {
	switch (encoding) {
		case ProcessIOEncoding.Ignore:
			return null
		case ProcessIOEncoding.Binary:
			return new Uint8Array()
		case ProcessIOEncoding.Utf8:
			return ""
	}
}

type OutputBuffer = string | Uint8Array | null
