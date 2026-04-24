import { TypescriptGenerator } from "./TypescriptGenerator.js"
import { capitalize, EnumDefinition, FacadeDefinition, LangGenerator, Language, Platform, StructDefinition, TypeRefDefinition } from "./common.js"
import { SwiftGenerator } from "./SwiftGenerator.js"
import { KotlinGenerator } from "./KotlinGenerator.js"
import * as path from "node:path"
import * as fs from "node:fs"
import JSON5 from "json5"

function generatorForLang(lang: Language): LangGenerator {
	switch (lang) {
		case "typescript":
			return new TypescriptGenerator()
		case "swift":
			return new SwiftGenerator()
		case "kotlin":
			return new KotlinGenerator()
		default:
			throw new Error("Unknown output language:" + lang)
	}
}

function mapPlatformToLang(platform: string): Language {
	switch (platform) {
		case "ios":
			return "swift"
		case "android":
			return "kotlin"
		case "web":
		case "desktop":
			return "typescript"
		default:
			throw new Error("unknown platform " + platform)
	}
}

/**
 * generate and write all target language source files.
 *
 * @param platform one of the supported platform names
 * @param sources a map from the definition file name to the definition json string
 * @param outDir the directory the output files should be written to
 */
export function generate(platform: Platform, sources: Map<string, string>, outDir: string) {
	const lang = mapPlatformToLang(platform)
	const ext = getFileExtensionForLang(lang)
	const generator = generatorForLang(lang)
	const facadesToImplement: Array<string> = []
	const generatedSymbols = new Array<string>()
	for (const [inputPath, source] of Array.from(sources.entries())) {
		console.log("handling ipc schema file", inputPath)
		const definition = JSON5.parse(source) as FacadeDefinition | StructDefinition | TypeRefDefinition | EnumDefinition
		if (!("name" in definition)) {
			throw new Error(`malformed definition: ${inputPath} doesn't have name field`)
		}
		if (!("type" in definition)) {
			throw new Error(`missing type declaration: ${inputPath}`)
		}

		switch (definition.type) {
			case "facade": {
				assertReturnTypesPresent(definition)
				const isReceiving = definition.receivers.includes(platform)
				const isSending = definition.senders.includes(platform)
				if (!isReceiving && !isSending) {
					continue
				}

				const facadeOutput = generator.generateFacade(definition)
				generatedSymbols.push(definition.name)
				write(facadeOutput, outDir, definition.name + ext)
				if (isReceiving) {
					const receivingDispatcherSymbol = definition.name + "ReceiveDispatcher"
					const receiveOutput = generator.generateReceiveDispatcher(definition)
					generatedSymbols.push(receivingDispatcherSymbol)
					write(receiveOutput, outDir, receivingDispatcherSymbol + ext)
					facadesToImplement.push(definition.name)
				}
				if (isSending) {
					const sendingDispatcherSymbol = definition.name + "SendDispatcher"
					const sendOutput = generator.generateSendDispatcher(definition)
					generatedSymbols.push(sendingDispatcherSymbol)
					write(sendOutput, outDir, sendingDispatcherSymbol + ext)
				}
				break
			}
			case "struct": {
				const structOutput = generator.handleStructDefinition(definition)
				generatedSymbols.push(definition.name)
				write(structOutput, outDir, definition.name + ext)
				break
			}
			case "typeref": {
				const refOutput = generator.generateTypeRef(outDir, inputPath, definition)
				if (refOutput != null) {
					generatedSymbols.push(definition.name)
					write(refOutput, outDir, definition.name + ext)
				}
				break
			}
			case "enum": {
				const enumOutput = generator.generateEnum(definition)
				generatedSymbols.push(definition.name)
				write(enumOutput, outDir, definition.name + ext)
				break
			}
			default:
				throw new Error(`unknown definition type in ${inputPath}: ` + (definition as any).type)
		}
	}

	const dispatcherName = `${capitalize(platform)}GlobalDispatcher`
	const dispatcherCode = generator.generateGlobalDispatcher(dispatcherName, facadesToImplement)
	generatedSymbols.push(dispatcherName)
	write(dispatcherCode, outDir, dispatcherName + ext)

	const extraFiles = generator.generateExtraFiles(platform, generatedSymbols)
	for (let extraFilesKey in extraFiles) {
		write(extraFiles[extraFilesKey], outDir, extraFilesKey + ext)
	}
}

function getFileExtensionForLang(lang: string): string {
	switch (lang) {
		case "typescript":
			return ".ts"
		case "swift":
			return ".swift"
		case "kotlin":
			return ".kt"
		default:
			throw new Error("unknown output lang: " + lang)
	}
}

function write(code: string, outDir: string, target: string) {
	fs.mkdirSync(outDir, { recursive: true })
	const filePath = path.join(outDir, target)
	fs.writeFileSync(filePath, code)
	console.log("written:", filePath)
}

function assertReturnTypesPresent(definition: FacadeDefinition): void {
	const methNoRet = Object.entries(definition.methods).find(([_, { ret }]) => ret == null)
	if (methNoRet) {
		throw new Error(`missing return type on method ${methNoRet[0]} in ${definition.name}`)
	}
}
