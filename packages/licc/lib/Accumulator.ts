const HEADER = "/* generated file, don't edit. */\n"

export class Accumulator {
	private code: string = ""
	private imports: Set<string> = new Set()

	constructor(
		private readonly appender: (code: string) => void = (code) => this.code += code,
	) {
	}

	line(code: string = "") {
		this.appender(code + "\n")
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