import {FacadeDefinition, getArgs, LangGenerator, MethodDefinition, minusculize, RenderedType, StructDefitinion, TypeRefDefinition} from "./common.js"
import {Accumulator} from "./Accumulator.js"
import {ParsedType, parseType} from "./Parser.js"

export class KotlinGenerator implements LangGenerator {

	generateGlobalDispatcher(name: string, facadeNames: string[]): string {
		const acc = new Accumulator()
		KotlinGenerator.generateImports(acc)
		acc.line(`import de.tutao.tutanota.ipc.*`)
		acc.line()
		acc.line(`class ${name} (`)
		const methodAcc = acc.indent()
		methodAcc.line(`json: Json,`)
		for (let facadeName of facadeNames) {
			methodAcc.line(`${minusculize(facadeName)} : ${facadeName},`)
		}
		acc.line(") {")
		for (let facadeName of facadeNames) {
			methodAcc.line(`private val ${minusculize(facadeName)}: ${facadeName}ReceiveDispatcher = ${facadeName}ReceiveDispatcher(json, ${minusculize(facadeName)})`)
		}
		methodAcc.line()

		methodAcc.line(`suspend fun dispatch(facadeName: String, methodName: String, args: List<String>): String {`)
		const whenAcc = methodAcc.indent()
		whenAcc.line(`return when (facadeName) {`)
		const caseAcc = whenAcc.indent()
		for (let facadeName of facadeNames) {
			caseAcc.line(`"${facadeName}" -> this.${minusculize(facadeName)}.dispatch(methodName, args)`)
		}
		caseAcc.line(`else -> throw Error("unknown facade: $facadeName")`)
		whenAcc.line(`}`)
		methodAcc.line(`}`)
		acc.line(`}`)
		return acc.finish()
	}

	handleStructDefinition(definition: StructDefitinion): string {
		const acc = new Accumulator()
		KotlinGenerator.generateImports(acc)
		acc.line()
		acc.line("@Serializable")
		acc.line(`data class ${definition.name}(`)
		const fieldGenerator = acc.indent()
		for (const [name, fieldDefinition] of Object.entries(definition.fields)) {
			const renderedType = typeNameKotlin(fieldDefinition)
			fieldGenerator.line(`val ${name}: ${renderedType.name},`)
		}
		acc.line(")")
		return acc.finish()
	}

	private static generateImports(acc: Accumulator) {
		acc.line("package de.tutao.tutanota.ipc")
		acc.line()
		acc.line("import kotlinx.serialization.*")
		acc.line("import kotlinx.serialization.json.*")
		acc.line()
	}

	generateFacade(definition: FacadeDefinition): string {
		const acc = new Accumulator()
		KotlinGenerator.generateImports(acc)
		acc.line(`interface ${definition.name} {`)
		const methodGenerator = acc.indent()
		for (const [name, methodDefinition] of Object.entries(definition.methods)) {
			KotlinGenerator.generateMethodSignature(methodGenerator, name, methodDefinition)
		}
		acc.line("}")
		return acc.finish()
	}

	generateReceiveDispatcher(definition: FacadeDefinition): string {
		const acc = new Accumulator()
		KotlinGenerator.generateImports(acc)
		acc.line(`class ${definition.name}ReceiveDispatcher(`)
		acc.indent().line(`private val json: Json,`)
		acc.indent().line(`private val facade: ${definition.name},`)
		acc.line(`) {`)
		const methAcc = acc.indent()
		methAcc.line()
		methAcc.line(`suspend fun dispatch(method: String, arg: List<String>): String {`)
		const whenAcc = methAcc.indent()
		whenAcc.line(`when (method) {`)
		const caseAcc = whenAcc.indent()
		for (const [methodName, methodDef] of Object.entries(definition.methods)) {
			caseAcc.line(`"${methodName}" -> {`)
			const arg = getArgs(methodName, methodDef)
			const decodedArgs = []
			for (let i = 0; i < arg.length; i++) {
				const {name: argName, type} = arg[i]
				const renderedArgType = typeNameKotlin(type)
				decodedArgs.push([argName, renderedArgType] as const)
			}
			const varAcc = caseAcc.indent()
			for (let i = 0; i < arg.length; i++) {
				const [argName, renderedType] = decodedArgs[i]
				varAcc.line(`val ${argName}: ${renderedType.name} = json.decodeFromString(arg[${i}])`)
			}
			varAcc.line(`val result: ${typeNameKotlin(methodDef.ret).name} = this.facade.${methodName}(`)
			for (let i = 0; i < arg.length; i++) {
				const [argName] = decodedArgs[i]
				varAcc.indent().line(`${argName},`)
			}
			varAcc.line(`)`)
			varAcc.line(`return json.encodeToString(result)`)
			caseAcc.line(`}`)
		}
		caseAcc.line(`else -> throw Error("unknown method for ${definition.name}: $method")`)
		whenAcc.line(`}`)
		methAcc.line(`}`)
		acc.line(`}`)
		return acc.finish()
	}

	private static generateNativeInterface(): string {
		const acc = new Accumulator()
		KotlinGenerator.generateImports(acc)
		acc.line(`interface NativeInterface {`)
		acc.indent().line(`suspend fun sendRequest(requestType: String, args: List<String>): String`)
		acc.line(`}`)
		return acc.finish()
	}

	private static generateMethodSignature(methodGenerator: Accumulator, name: string, methodDefinition: MethodDefinition, prefix: string = "") {
		methodGenerator.line(`${prefix} suspend fun ${name}(`)
		const argGenerator = methodGenerator.indent()
		for (const argument of getArgs(name, methodDefinition)) {
			const renderedArgument = typeNameKotlin(argument.type)
			argGenerator.line(`${argument.name}: ${renderedArgument.name},`)
		}
		const renderedReturn = typeNameKotlin(methodDefinition.ret)
		methodGenerator.line(`): ${renderedReturn.name}`)
	}

	generateSendDispatcher(definition: FacadeDefinition): string {
		const acc = new Accumulator()
		KotlinGenerator.generateImports(acc)
		const classBodyAcc = acc.indent()
		acc.line(`class ${definition.name}SendDispatcher (`)
		classBodyAcc.line(`private val json: Json,`)
		classBodyAcc.line(`private val transport : NativeInterface,`)
		acc.line(`) : ${definition.name} {`)
		classBodyAcc.line(`private val encodedFacade = json.encodeToString("${definition.name}")`)
		for (const [methodName, methodDefinition] of Object.entries(definition.methods)) {
			KotlinGenerator.generateMethodSignature(classBodyAcc, methodName, methodDefinition, "override")
			classBodyAcc.line("{")

			const methodBodyAcc = classBodyAcc.indent()
			methodBodyAcc.line(`val encodedMethod = json.encodeToString("${methodName}")`)
			methodBodyAcc.line("val args : MutableList<String> = mutableListOf()")
			for (let arg of getArgs(methodName, methodDefinition)) {
				methodBodyAcc.line(`args.add(json.encodeToString(${arg.name}))`)
			}
			methodBodyAcc.line(`val result = this.transport.sendRequest("ipc", listOf(encodedFacade, encodedMethod) + args)`)
			if (methodDefinition.ret !== "void") {
				methodBodyAcc.line(`return json.decodeFromString(result)`)
			} else {
				methodBodyAcc.line(`return`)
			}
			classBodyAcc.line(`}`)
			classBodyAcc.line()
		}


		acc.line(`}`)
		return acc.finish()
	}

	generateExtraFiles(): Record<string, string> {
		return {
			"NativeInterface": KotlinGenerator.generateNativeInterface()
		}
	}

	generateTypeRef(outDir: string, definitionPath: string, definition: TypeRefDefinition): string | null {
		if (definition.location.kotlin) {
			const acc = new Accumulator()
			acc.line(`package de.tutao.tutanota.ipc`)
			acc.line(`typealias ${definition.name} = ${definition.location.kotlin}`)
			return acc.finish()
		} else {
			return null
		}
	}
}

function typeNameKotlin(name: string): RenderedType {
	const parsed = parseType(name)
	return renderKotlinType(parsed)
}

function renderKotlinType(parsed: ParsedType): RenderedType {
	const {baseName, nullable, external} = parsed
	switch (baseName) {
		case "List":
			const renderedListInner = renderKotlinType(parsed.generics[0])
			return {
				externals: renderedListInner.externals,
				name: maybeNullable(`List<${renderedListInner.name}>`, nullable)
			}
		case "Map":
			const renderedKey = renderKotlinType(parsed.generics[0])
			const renderedValue = renderKotlinType(parsed.generics[1])
			return {
				externals: [...renderedKey.externals, ...renderedValue.externals],
				name: maybeNullable(`Map<${renderedKey.name}, ${renderedValue.name}>`, nullable)
			}
		case "string":
			return {externals: [], name: maybeNullable("String", nullable)}
		case "boolean":
			return {externals: [], name: maybeNullable("Boolean", nullable)}
		case "number":
			return {externals: [], name: maybeNullable("Int", nullable)}
		case "bytes":
			return {externals: [], name: maybeNullable("ByteArray", nullable)}
		case "void":
			return {externals: [], name: maybeNullable("Unit", nullable)}
		default:
			return {externals: [baseName], name: maybeNullable(baseName, nullable)}
	}
}

function maybeNullable(name: string, nullable: boolean) {
	return nullable ? `${name}?` : name
}