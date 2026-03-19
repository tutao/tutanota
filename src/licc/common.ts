export interface LangGenerator {
	/**
	 * generate a structured type definition
	 * @param definition
	 */
	handleStructDefinition(definition: StructDefinition): string

	/**
	 * generate a collection of methods with arguments and return types
	 * and its associated dispatchers
	 * @param definition
	 */
	generateFacade(definition: FacadeDefinition): string

	generateReceiveDispatcher(definition: FacadeDefinition): string

	generateSendDispatcher(definition: FacadeDefinition): string

	/**
	 * generate the receiving dispatcher for the facades we are on the receiving side of
	 */
	generateGlobalDispatcher(name: string, facadeNames: Array<string>): string

	/**
	 * generate extra type definitions needed to make the interface work
	 */
	generateExtraFiles(): Record<string, string>

	/**
	 * external types that don't get generated but are located somewhere else
	 */
	generateTypeRef(outDir: string, definitionPath: string, definition: TypeRefDefinition): string | null

	generateEnum(definition: EnumDefinition): string
}

export type Platform = "ios" | "web" | "android" | "desktop"
export type Language = "kotlin" | "swift" | "typescript"

export interface StructDefinition {
	type: "struct"
	name: string
	fields: Record<string, string>
	doc?: string
}

export interface FacadeDefinition {
	type: "facade"
	name: string
	senders: Array<Platform>
	receivers: Array<Platform>
	methods: Record<string, MethodDefinition>
	doc?: string
}

export interface TypeRefDefinition {
	type: "typeref"
	name: string
	location: Record<Language, string>
}

export interface MethodDefinition {
	arg: Array<ArgumentDefinition>
	ret: string
	doc?: string
}

export interface EnumDefinition {
	type: "enum"
	name: string
	values: Array<string>
	doc?: string
}

export type ArgumentDefinition = Record<string, string>

export interface RenderedType {
	externals: string[]
	name: string
}

export function getArgs(methName: string, methodDef: MethodDefinition): { name: string; type: string }[] {
	return methodDef.arg.map((a, i) => {
		const entries = Object.entries(a)
		if (entries.length === 0) {
			throw new Error(`Syntax Error: method ${methName} argument ${i} is empty`)
		} else if (entries.length > 1) {
			throw new Error(`Syntax Error: method ${methName} argument ${i} has too many entries`)
		}
		return { name: entries[0][0], type: entries[0][1] }
	})
}

export function capitalize(input: string): string {
	return input.replace(/^\w/, (c) => c.toUpperCase())
}

export function minusculize(input: string): string {
	return input.replace(/^\w/, (c) => c.toLowerCase())
}

export function camelCaseToSnakeCase(name: string): string {
	let finalName = ""
	for (let i = 0; i < name.length; i++) {
		const char = name.charAt(i)
		const lower = char.toLowerCase()
		if (char !== lower && i > 0) {
			finalName += "_"
		}
		finalName += lower
	}
	return finalName
}
