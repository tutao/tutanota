const HEADER = "/* generated file, don't edit. */\n"

export class Accumulator {
	private code = ""
	private readonly imports = new Set<string>()

	constructor(private readonly appender: (code: string) => void = (code) => (this.code += code)) {}

	line(code: string = ""): this {
		this.appender(code + "\n")
		return this
	}

	/**
	 * Add multiple lines with an optional line-suffix
	 */
	lines(
		lines: Array<string>,
		opts?: {
			/** additional string to append to line end */
			suffix?: string
			/** whether suffix should be appended on the final line */
			trailing?: boolean
		},
	): this {
		const lineJoiner = opts?.suffix ?? ""
		const trailingJoiner = opts?.trailing ?? false
		for (const [idx, line] of lines.entries()) {
			const joiner = trailingJoiner || idx < lines.length - 1 ? lineJoiner : ""
			this.line(line + joiner)
		}
		return this
	}

	/**
	 * Do something in a callback with this accumulator
	 */
	do(callback: (thisAccumulator: Accumulator) => void): this {
		callback(this)
		return this
	}

	/**
	 * Do something in a callback with an indented accumulator
	 */
	indented(callback: (indentAccumulator: Accumulator) => void): this {
		callback(this.indent())
		return this
	}

	indent(indent: string = "\t"): Accumulator {
		return new Accumulator((code) => {
			this.appender(indent + code)
		})
	}

	addImport(imp: string) {
		this.imports.add(imp)
	}

	finish(): string {
		return HEADER + "\n" + Array.from(this.imports).join("\n") + "\n" + this.code
	}
}
