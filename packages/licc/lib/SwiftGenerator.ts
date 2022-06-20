import {FacadeDefinition, getArgs, LangGenerator, MethodDefinition, minusculize, RenderedType, StructDefitinion} from "./common.js"
import {Accumulator} from "./Accumulator.js"
import {ParsedType, parseType} from "./Parser.js"

export class SwiftGenerator implements LangGenerator {
	handleStructDefinition(definition: StructDefitinion): string {
		const generator = new Accumulator()
		generator.line(`public struct ${definition.name} : Codable {`)
		const fieldGenerator = generator.indent()
		for (const [name, fieldDefinition] of Object.entries(definition.fields)) {
			const renderedType = typeNameSwift(fieldDefinition)
			fieldGenerator.line(`let ${name}: ${renderedType.name}`)
		}
		generator.line("}")
		return generator.finish()
	}

	generateFacade(definition: FacadeDefinition): string {
		const acc = new Accumulator()
		acc.line("import Foundation")
		acc.line()
		acc.line(`public protocol ${definition.name} {`)
		const methodGenerator = acc.indent()
		for (const [name, methodDefinition] of Object.entries(definition.methods)) {
			SwiftGenerator.generateMethodSignature(methodGenerator, name, methodDefinition)
		}
		acc.line("}")
		return acc.finish()
	}

	private static generateMethodSignature(methodGenerator: Accumulator, name: string, methodDefinition: MethodDefinition) {
		methodGenerator.line(`func ${name}(`)
		const argGenerator = methodGenerator.indent()
		const args = getArgs(name, methodDefinition)
		const lastArg = args[args.length - 1]
		for (const argument of args) {
			const renderedArgument = typeNameSwift(argument.type)
			const argLine =
				`_ ${argument.name}: ${renderedArgument.name}` +
				((argument === lastArg) ? "" : ",")
			argGenerator.line(argLine)
		}
		const renderedReturn = typeNameSwift(methodDefinition.ret)
		methodGenerator.line(`) async throws -> ${renderedReturn.name}`)
	}

	generateReceiveDispatcher(definition: FacadeDefinition): string {
		const acc = new Accumulator()
		acc.line("import Foundation")
		acc.line()
		acc.line(`public class ${definition.name}ReceiveDispatcher {`)
		const methodAcc = acc.indent()
		methodAcc.line(`let facade: ${definition.name}`)
		methodAcc.line(`init(facade: ${definition.name}) {`)
		methodAcc.indent().line(`self.facade = facade`)
		methodAcc.line(`}`)

		methodAcc.line(`func dispatch(method: String, arg: [String]) async throws -> String {`)
		const switchAcc = methodAcc.indent()
		switchAcc.line(`switch method {`)
		const caseAcc = switchAcc.indent()
		for (const [methodName, method] of Object.entries(definition.methods)) {
			const arg = getArgs(methodName, method)
			const decodedArgs = []
			for (let i = 0; i < arg.length; i++) {
				const {name: argName, type} = arg[i]
				const renderedArgType = typeNameSwift(type)
				decodedArgs.push([argName, renderedArgType] as const)
			}
			switchAcc.line(`case "${methodName}":`)
			for (let i = 0; i < arg.length; i++) {
				const [argName, argType] = decodedArgs[i]
				caseAcc.line(`let ${argName} = try! JSONDecoder().decode(${argType.name}.self, from: arg[${i}].data(using: .utf8)!)`)
			}
			if (method.ret === "void") {
				caseAcc.line(`try await self.facade.${methodName}(`)
			} else {
				caseAcc.line(`let result = try await self.facade.${methodName}(`)
			}
			for (let i = 0; i < arg.length; i++) {
				const comma = i === arg.length - 1 ? "" : ","
				caseAcc.indent().line(arg[i].name + comma)
			}
			caseAcc.line(")")
			if (method.ret === "void") {
				caseAcc.line(`return "null"`)
			} else {
				caseAcc.line(`return toJson(result)`)
			}
		}
		switchAcc.line(`default:`)
		caseAcc.line(`fatalError("licc messed up! \\(method)")`)
		switchAcc.line(`}`)
		methodAcc.line(`}`)

		acc.line(`}`)
		return acc.finish()
	}

	generateGlobalDispatcher(name: string, facadeNames: Array<string>): string {
		const acc = new Accumulator()
		acc.line(`public class ${name} {`)
		const methodAcc = acc.indent()

		for (let facadeName of facadeNames) {
			methodAcc.line(`private let ${minusculize(facadeName)}: ${facadeName}ReceiveDispatcher`)
		}
		methodAcc.line()
		methodAcc.line(`init(`)
		const lastFacadeName = facadeNames[facadeNames.length - 1]
		for (let facadeName of facadeNames) {
			const comma = facadeName === lastFacadeName ? "" : ","
			methodAcc.indent().line(`${minusculize(facadeName)} : ${facadeName}${comma}`)
		}
		methodAcc.line(`) {`)
		for (let facadeName of facadeNames) {
			methodAcc.indent().line(`self.${minusculize(facadeName)} = ${facadeName}ReceiveDispatcher(facade: ${minusculize(facadeName)})`)
		}
		methodAcc.line(`}`)
		methodAcc.line()

		methodAcc.line(`func dispatch(facadeName: String, methodName: String, args: Array<String>) async throws -> String {`)
		const switchAcc = methodAcc.indent()
		switchAcc.line(`switch facadeName {`)
		const caseAcc = switchAcc.indent()
		for (let facadeName of facadeNames) {
			caseAcc.line(`case "${facadeName}":`)
			caseAcc.indent().line(`return try await self.${minusculize(facadeName)}.dispatch(method: methodName, arg: args)`)
		}
		caseAcc.line(`default:`)
		caseAcc.indent().line(`fatalError("licc messed up! " + facadeName)`)
		switchAcc.line(`}`)
		methodAcc.line(`}`)
		acc.line(`}`)
		return acc.finish()
	}

	generateSendDispatcher(definition: FacadeDefinition): string {
		const acc = new Accumulator()
		acc.line("import Foundation")
		acc.line()
		acc.line(`class ${definition.name}SendDispatcher : ${definition.name} {`)
		const classBodyAcc = acc.indent()
		classBodyAcc.line(`private let transport: NativeInterface`)
		classBodyAcc.line(`init(transport: NativeInterface) { self.transport = transport }`)
		classBodyAcc.line()
		for (const [methodName, methodDefinition] of Object.entries(definition.methods)) {
			SwiftGenerator.generateMethodSignature(classBodyAcc, methodName, methodDefinition)
			const methodBodyAcc = classBodyAcc.indent()
			methodBodyAcc.line("{")
			const args = getArgs(methodName, methodDefinition)
			if (args.length > 0) {
				methodBodyAcc.line("var args = [String]()")
			} else {
				// let instead of var so that it shuts up about mutability unused
				methodBodyAcc.line("let args = [String]()")
			}
			for (let arg of args) {
				methodBodyAcc.line(`args.append(toJson(${arg.name}))`)
			}
			methodBodyAcc.line(`let encodedFacadeName = toJson("${definition.name}")`)
			methodBodyAcc.line(`let encodedMethodName = toJson("${methodName}")`)
			if (methodDefinition.ret !== "void") {
				methodBodyAcc.line(`let returnValue = try await self.transport.sendRequest(requestType: "ipc",  args: [encodedFacadeName, encodedMethodName] + args)`)
				methodBodyAcc.line(`return try! JSONDecoder().decode(${typeNameSwift(methodDefinition.ret).name}.self, from: returnValue.data(using: .utf8)!)`)
			} else {
				methodBodyAcc.line(`let _ = try await self.transport.sendRequest(requestType: "ipc",  args: [encodedFacadeName, encodedMethodName] + args)`)
			}

			methodBodyAcc.line(`}`)
			classBodyAcc.line()
		}

		acc.line(`}`)
		return acc.finish()
	}

	generateExtraFiles(): Record<string, string> {
		return {
			"NativeInterface": SwiftGenerator.generateNativeInterface()
		}
	}

	private static generateNativeInterface(): string {
		const acc = new Accumulator()
		acc.line(`protocol NativeInterface {`)
		acc.indent().line(`func sendRequest(requestType: String, args: [String]) async throws -> String`)
		acc.line(`}`)
		acc.line()
		acc.line("func toJson<T>(_ thing: T) -> String where T : Encodable {")
		acc.indent().line("return String(data: try! JSONEncoder().encode(thing), encoding: .utf8)!")
		acc.line("}")
		acc.line()
		return acc.finish()
	}
}

function typeNameSwift(name: string): RenderedType {
	const parsed = parseType(name)
	return renderSwiftType(parsed)
}

function renderSwiftType(parsed: ParsedType): RenderedType {
	const {baseName, nullable} = parsed
	switch (baseName) {
		case "List":
			const renderedListInner = renderSwiftType(parsed.generics[0])
			return {externals: renderedListInner.externals, name: maybeNullable(`[${renderedListInner.name}]`, nullable)}
		case "Map":
			const renderedKey = renderSwiftType(parsed.generics[0])
			const renderedValue = renderSwiftType(parsed.generics[1])
			return {
				externals: [...renderedKey.externals, ...renderedValue.externals],
				name: maybeNullable(`[${renderedKey.name} : ${renderedValue.name}]`, nullable)
			}
		case "string":
			return {externals: [], name: maybeNullable("String", nullable)}
		case "boolean":
			return {externals: [], name: maybeNullable("Bool", nullable)}
		case "number":
			return {externals: [], name: maybeNullable("Int", nullable)}
		case "bytes":
			return {externals: [], name: maybeNullable("Data", nullable)}
		case "void":
			return {externals: [], name: maybeNullable("Void", nullable)}
		default:
			return {externals: [baseName], name: maybeNullable(baseName, nullable)}
	}
}

function maybeNullable(name: string, nullable: boolean) {
	return nullable ? `${name}?` : name
}