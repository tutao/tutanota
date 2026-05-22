import { TypescriptGenerator } from "./TypescriptGenerator.js"
import {
	capitalize,
	DefinationType,
	EnumDefinition,
	FacadeDefinition,
	LangGenerator,
	Language,
	Platform,
	StructDefinition,
	TypeRefDefinition,
} from "./common.js"
import { SwiftGenerator } from "./SwiftGenerator.js"
import { KotlinGenerator } from "./KotlinGenerator.js"
import * as path from "node:path"
import * as fs from "node:fs"
import JSON5 from "json5"

function generatorForLang(lang: Language): LangGenerator {
	switch (lang) {
		case Language.Typescript:
			return new TypescriptGenerator()
		case Language.Swift:
			return new SwiftGenerator()
		case Language.Kotlin:
			return new KotlinGenerator()
		default:
			throw new Error("Unknown output language:" + lang)
	}
}

function mapPlatformToLang(platform: Platform): Language {
	switch (platform) {
		case Platform.Ios:
			return Language.Swift
		case "android":
			return Language.Kotlin
		case "web":
		case "desktop":
			return Language.Typescript
		default:
			throw new Error("unknown platform " + platform)
	}
}

/**
 * generate and write all target language source files.
 *
 * @param platform one of the supported platform names
 * @param sources a map from the definition file name to the definition json string
 * @param outDirBase the directory the output files should be written to
 */
export function generate(platform: Platform, sources: Map<string, string>, outDirBase: string) {
	const lang = mapPlatformToLang(platform)
	const generator = generatorForLang(lang)
	const { dispatcherOutDir, typesOutDir, dispatcherExt, typesExt } = (function () {
		switch (lang) {
			case Language.Typescript:
				return {
					dispatcherOutDir: path.join(outDirBase, "dispatchers"),
					typesOutDir: path.join(outDirBase, "types"),
					dispatcherExt: ".ts",
					typesExt: ".d.ts",
				}
			case Language.Swift:
				return {
					dispatcherOutDir: outDirBase,
					typesOutDir: outDirBase,
					dispatcherExt: ".swift",
					typesExt: ".swift",
				}
			case Language.Kotlin:
				return {
					dispatcherOutDir: outDirBase,
					typesOutDir: outDirBase,
					dispatcherExt: ".kt",
					typesExt: ".kt",
				}
		}
	})()

	const facadesToImplement: Array<string> = []
	const generatedSymbols = new Array<{ symbol: string; defType: DefinationType }>()
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
			case DefinationType.Facade: {
				assertReturnTypesPresent(definition)
				const isReceiving = definition.receivers.includes(platform)
				const isSending = definition.senders.includes(platform)
				if (!isReceiving && !isSending) {
					continue
				}

				const facadeOutput = generator.generateFacade(definition)
				generatedSymbols.push({ symbol: definition.name, defType: definition.type })
				write(facadeOutput, typesOutDir, definition.name + typesExt)
				if (isReceiving) {
					const receivingDispatcherSymbol = definition.name + "ReceiveDispatcher"
					const receiveOutput = generator.generateReceiveDispatcher(definition)
					generatedSymbols.push({ symbol: receivingDispatcherSymbol, defType: DefinationType.Dispatcher })
					write(receiveOutput, dispatcherOutDir, receivingDispatcherSymbol + dispatcherExt)
					facadesToImplement.push(definition.name)
				}
				if (isSending) {
					const sendingDispatcherSymbol = definition.name + "SendDispatcher"
					const sendOutput = generator.generateSendDispatcher(definition)
					generatedSymbols.push({ symbol: sendingDispatcherSymbol, defType: DefinationType.Dispatcher })
					write(sendOutput, dispatcherOutDir, sendingDispatcherSymbol + dispatcherExt)
				}
				break
			}
			case DefinationType.Struct: {
				const structOutput = generator.handleStructDefinition(definition)
				generatedSymbols.push({ symbol: definition.name, defType: definition.type })
				write(structOutput, typesOutDir, definition.name + typesExt)
				break
			}
			case DefinationType.TypeRef: {
				const refOutput = generator.generateTypeRef(typesOutDir, inputPath, definition)
				if (refOutput != null) {
					generatedSymbols.push({ symbol: definition.name, defType: definition.type })
					write(refOutput, typesOutDir, definition.name + typesExt)
				}
				break
			}
			case DefinationType.Enum: {
				const enumOutput = generator.generateEnum(definition)
				generatedSymbols.push({ symbol: definition.name, defType: definition.type })
				write(enumOutput, typesOutDir, definition.name + typesExt)
				generator.storeEnum(definition.name)
				break
			}
			default:
				throw new Error(`unknown definition type in ${inputPath}: ` + (definition as any).type)
		}
	}

	const dispatcherName = `${capitalize(platform)}GlobalDispatcher`
	const dispatcherCode = generator.generateGlobalDispatcher(dispatcherName, facadesToImplement)
	generatedSymbols.push({ symbol: dispatcherName, defType: DefinationType.Dispatcher })
	write(dispatcherCode, dispatcherOutDir, dispatcherName + dispatcherExt)

	const extraFiles = generator.generateExtraFiles(platform, generatedSymbols)
	for (let extraFilesKey in extraFiles) {
		write(extraFiles[extraFilesKey], outDirBase, extraFilesKey + dispatcherExt)
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
