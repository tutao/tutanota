import {TypescriptGenerator} from "./TypescriptGenerator.js"
import {capitalize, FacadeDefinition, LangGenerator, Platform, StructDefitinion} from "./common.js"
import {SwiftGenerator} from "./SwiftGenerator.js"
import {KotlinGenerator} from "./KotlinGenerator.js"
import * as path from "path"
import * as fs from "fs"

function generatorForLang(lang: string): LangGenerator {
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

function mapPlatformToLang(platform: string) {
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
	for (const [inputName, source] of Array.from(sources.entries())) {
		console.log("handling ipc schema file", inputName)
		const definition = JSON.parse(source) as FacadeDefinition | StructDefitinion
		if (!("name" in definition) || definition.name !== inputName) {
			throw new Error(`inconsistent naming: ${inputName} !== ${definition["name"]}`)
		}
		if (!("type" in definition)) {
			throw new Error(`missing type declaration: ${inputName}`)
		}
		switch (definition.type) {
			case "facade":
				assertReturnTypesPresent(definition)
				const isReceiving = definition.receivers.includes(platform)
				const isSending = definition.senders.includes(platform)
				if (!isReceiving && !isSending) {
					continue
				}
				const facadeOutput = generator.generateFacade(definition)
				write(facadeOutput, outDir, inputName + ext)
				if (isReceiving) {
					const receiveOutput = generator.generateReceiveDispatcher(definition)
					write(receiveOutput, outDir, inputName + "ReceiveDispatcher" + ext)
					facadesToImplement.push(definition.name)
				}
				if (isSending) {
					const sendOutput = generator.generateSendDispatcher(definition)
					write(sendOutput, outDir, inputName + "SendDispatcher" + ext)
				}
				break
			case "struct":
				const structOutput = generator.handleStructDefinition(definition)
				write(structOutput, outDir, inputName + ext)
				break
			default:
				throw new Error(`unknown definition type in ${inputName}: ` + (definition as any).type)
		}
	}

	const extraFiles = generator.generateExtraFiles()
	for (let extraFilesKey in extraFiles) {
		write(extraFiles[extraFilesKey], outDir, extraFilesKey + ext)
	}

	const dispatcherName = `${capitalize(platform)}GlobalDispatcher`
	const dispatcherCode = generator.generateGlobalDispatcher(dispatcherName, facadesToImplement)
	write(dispatcherCode, outDir, dispatcherName + ext)
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
	fs.mkdirSync(outDir, {recursive: true})
	const filePath = path.join(outDir, target)
	fs.writeFileSync(filePath, code)
	console.log("written:", filePath)
}

function assertReturnTypesPresent(definition: FacadeDefinition): void {
	const methNoRet = Object.entries(definition.methods).find(([_, {ret}]) => ret == null)
	if (methNoRet) {
		throw new Error(`missing return type on method ${methNoRet[0]} in ${definition.name}`)
	}
}