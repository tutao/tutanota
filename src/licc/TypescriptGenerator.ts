import { Accumulator } from "./Accumulator.js"
import { EnumDefinition, FacadeDefinition, getArgs, LangGenerator, minusculize, RenderedType, StructDefinition, TypeRefDefinition } from "./common.js"
import { ParsedType, parseType } from "./Parser.js"
import path from "node:path"

export class TypescriptGenerator implements LangGenerator {
	generateGlobalDispatcher(name: string, facadeNames: Array<string>): string {
		const acc = new Accumulator()
		for (let facadeName of facadeNames) {
			acc.line(`import {${facadeName}} from "./${facadeName}.js"`)
			acc.line(`import {${facadeName}ReceiveDispatcher} from "./${facadeName}ReceiveDispatcher.js"`)
		}
		acc.line()
		acc.line(`export class ${name} {`)
		const methodAcc = acc.indent()
		for (let facadeName of facadeNames) {
			methodAcc.line(`private readonly ${minusculize(facadeName)} : ${facadeName}ReceiveDispatcher`)
		}
		methodAcc.line(`constructor(`)
		for (let facadeName of facadeNames) {
			methodAcc.indent().line(`${minusculize(facadeName)} : ${facadeName},`)
		}
		methodAcc.line(`) {`)
		for (let facadeName of facadeNames) {
			methodAcc.indent().line(`this.${minusculize(facadeName)} = new ${facadeName}ReceiveDispatcher(${minusculize(facadeName)})`)
		}
		methodAcc.line("}")
		methodAcc.line()

		methodAcc.line(`async dispatch(facadeName: string, methodName: string, args: Array<any>) {`)
		const switchAcc = methodAcc.indent()
		switchAcc.line(`switch (facadeName) {`)
		const caseAcc = switchAcc.indent()
		for (let facadeName of facadeNames) {
			caseAcc.line(`case "${facadeName}":`)
			caseAcc.indent().line(`return this.${minusculize(facadeName)}.dispatch(methodName, args)`)
		}
		caseAcc.line(`default:`)
		caseAcc.indent().line(`throw new Error("licc messed up! " + facadeName)`)
		switchAcc.line(`}`)
		methodAcc.line(`}`)
		acc.line(`}`)
		return acc.finish()
	}

	handleStructDefinition(definition: StructDefinition): string {
		let acc = new Accumulator()
		this.generateDocComment(acc, definition.doc)
		acc.line(`export interface ${definition.name} {`)
		let bodyGenerator = acc.indent()
		for (const [fieldName, fieldType] of Object.entries(definition.fields)) {
			const { name, externals } = typeNameTypescript(fieldType)
			for (const external of externals) {
				acc.addImport(`import {${external}} from "./${external}.js"`)
			}
			bodyGenerator.line(`readonly ${fieldName}: ${name}`)
		}
		acc.line("}")

		return acc.finish()
	}

	private generateDocComment(acc: Accumulator, comment: string | null | undefined) {
		if (!comment) return

		acc.line("/**")
		acc.line(` * ${comment}`)
		acc.line(" */")
	}

	private static generateNativeInterface(accumulator: Accumulator) {
		// Duplicate interface to not import it
		accumulator.line("interface NativeInterface {")
		accumulator.indent().line("invokeNative(requestType: string, args: unknown[]): Promise<any>")
		accumulator.line("}")
	}

	generateFacade(definition: FacadeDefinition): string {
		const acc = new Accumulator()
		this.generateDocComment(acc, definition.doc)
		acc.line(`export interface ${definition.name} {\n`)
		let methodAcc = acc.indent()
		for (const [name, method] of Object.entries(definition.methods)) {
			this.generateDocComment(methodAcc, method.doc)
			methodAcc.line(`${name}(`)
			let argAccumulator = methodAcc.indent()
			for (const arg of getArgs(name, method)) {
				const name = renderTypeAndAddImports(arg.type, acc)
				argAccumulator.line(`${arg.name}: ${name},`)
			}
			const resolvedReturnType = renderTypeAndAddImports(method.ret, acc)
			methodAcc.line(`): Promise<${resolvedReturnType}>`)
			methodAcc.line()
		}
		acc.line("}")
		return acc.finish()
	}

	generateReceiveDispatcher(definition: FacadeDefinition): string {
		const acc = new Accumulator()
		acc.line(`import {${definition.name}} from "./${definition.name}.js"`)
		acc.line()
		acc.line(`export class ${definition.name}ReceiveDispatcher {`)
		acc.indent().line(`constructor(private readonly facade: ${definition.name}) {}`)
		acc.indent().line(`async dispatch(method: string, arg: Array<any>) : Promise<any> {`)
		acc.indent().indent().line(`switch(method) {`)
		const switchAccumulator = acc.indent().indent().indent()
		for (const [methodName, methodDef] of Object.entries(definition.methods)) {
			switchAccumulator.line(`case "${methodName}": {`)
			const arg = getArgs(methodName, methodDef)
			const decodedArgs = []
			for (let i = 0; i < arg.length; i++) {
				const { name: argName, type } = arg[i]
				const renderedArgType = renderTypeAndAddImports(type, acc)
				decodedArgs.push([argName, renderedArgType] as const)
			}

			for (let i = 0; i < arg.length; i++) {
				const [argName, renderedType] = decodedArgs[i]
				switchAccumulator.indent().line(`const ${argName}: ${renderedType} = arg[${i}]`)
			}
			switchAccumulator.indent().line(`return this.facade.${methodName}(`)
			for (let i = 0; i < arg.length; i++) {
				const [argName] = decodedArgs[i]
				switchAccumulator.indent().indent().line(`${argName},`)
			}
			switchAccumulator.indent().line(`)`)
			switchAccumulator.line(`}`)
		}
		acc.indent().indent().line(`}`)
		acc.indent().line(`}`)
		acc.line(`}`)
		return acc.finish()
	}

	generateSendDispatcher(definition: FacadeDefinition): string {
		const acc = new Accumulator()
		acc.line(`import {${definition.name}} from "./${definition.name}.js"`)
		acc.line()
		TypescriptGenerator.generateNativeInterface(acc)
		acc.line(`export class ${definition.name}SendDispatcher implements ${definition.name} {`)
		acc.indent().line(`constructor(private readonly transport: NativeInterface) {}`)
		for (const [methodName, _] of Object.entries(definition.methods)) {
			const methodAccumulator = acc.indent()
			methodAccumulator.line(`async ${methodName}(...args: Parameters<${definition.name}["${methodName}"]>) {`)
			methodAccumulator.indent().line(`return this.transport.invokeNative("ipc",  ["${definition.name}", "${methodName}", ...args])`)
			methodAccumulator.line(`}`)
		}

		acc.line(`}`)
		return acc.finish()
	}

	generateExtraFiles(): Record<string, string> {
		return {}
	}

	generateTypeRef(outDir: string, definitionPath: string, definition: TypeRefDefinition): string {
		const acc = new Accumulator()
		let tsPath = definition.location.typescript
		const isRelative = tsPath.startsWith(".")
		const actualPath = isRelative ? path.relative(path.resolve(outDir), path.resolve(definitionPath, tsPath)) : tsPath
		acc.line(`export {${definition.name}} from "${actualPath}"`)

		return acc.finish()
	}

	generateEnum({ name, values, doc }: EnumDefinition): string {
		return new Accumulator()
			.do((acc) => this.generateDocComment(acc, doc))
			.line(`export const enum ${name} {`)
			.indented((acc) => acc.lines(values.map((value, index) => `${value} = "${index}",`)))
			.line("}")
			.finish()
	}
}

function renderTypescriptType(parsed: ParsedType): RenderedType {
	const { baseName, nullable, external } = parsed
	switch (baseName) {
		case "List": {
			const renderedListInner = renderTypescriptType(parsed.generics[0])
			return {
				externals: renderedListInner.externals,
				name: maybeNullable(`ReadonlyArray<${renderedListInner.name}>`, nullable),
			}
		}
		case "Map": {
			const renderedKey = renderTypescriptType(parsed.generics[0])
			const renderedValue = renderTypescriptType(parsed.generics[1])
			return {
				externals: [...renderedKey.externals, ...renderedValue.externals],
				name: maybeNullable(`Record<${renderedKey.name}, ${renderedValue.name}>`, nullable),
			}
		}
		case "string":
			return { externals: [], name: maybeNullable("string", nullable) }
		case "boolean":
			return { externals: [], name: maybeNullable("boolean", nullable) }
		case "number":
			return { externals: [], name: maybeNullable("number", nullable) }
		case "bytes":
			return { externals: [], name: maybeNullable("Uint8Array", nullable) }
		case "void":
			return { externals: [], name: maybeNullable("void", nullable) }
		case "IdTuple":
			return { externals: [], name: maybeNullable("IdTuple", nullable) }
		default:
			return { externals: [baseName], name: maybeNullable(baseName, nullable) }
	}
}

function maybeNullable(name: string, nullable: boolean): string {
	return nullable ? name + " | null" : name
}

function typeNameTypescript(name: string): RenderedType {
	const parsed = parseType(name)
	return renderTypescriptType(parsed)
}

function renderTypeAndAddImports(name: string, acc: Accumulator) {
	const rendered = typeNameTypescript(name)
	for (const external of rendered.externals) {
		acc.addImport(`import {${external}} from "./${external}.js"`)
	}
	return rendered.name
}
