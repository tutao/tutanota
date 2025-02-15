export const PRIMITIVES = ["string", "boolean", "number", "bytes", "void"];
const KOTLIN_KEYWORDS = [
    "as",
    "break",
    "class",
    "continue",
    "do",
    "else",
    "false",
    "for",
    "fun",
    "if",
    "in",
    "interface",
    "is",
    "null",
    "object",
    "package",
    "return",
    "super",
    "this",
    "throw",
    "true",
    "try",
    "typealias",
    "typeof",
    "val",
    "var",
    "when",
    "while",
];
const TYPESCRIPT_KEYWORDS = [
    "var",
    "const",
    "let",
    "break",
    "return",
    "case",
    "catch",
    "class",
    "continue",
    "debugger",
    "default",
    "delete",
    "do",
    "else",
    "enum",
    "export",
    "extends",
    "false",
    "finally",
    "for",
    "function",
    "if",
    "import",
    "in",
    "instanceOf",
    "new",
    "null",
    "return",
    "super",
    "switch",
    "this",
    "throw",
    "true",
    "try",
    "typeOf",
    "void",
    "while",
    "with",
];
const SWIFT_KEYWORDS = [
    "Class",
    "deinit",
    "Enum",
    "extension",
    "Func",
    "import",
    "Init",
    "internal",
    "Let",
    "operator",
    "private",
    "protocol",
    "public",
    "static",
    "struct",
    "subscript",
    "typealias",
    "var",
    "break",
    "case",
    "continue",
    "default",
    "do",
    "else",
    "fallthrough",
    "for",
    "if",
    "in",
    "return",
    "switch",
    "where",
    "while",
    "as",
    "dynamicType",
    "false",
    "is",
    "nil",
    "self",
    "Self",
    "super",
    "true",
    "_COLUMN_",
    "_FILE_",
    "_FUNCTION_",
    "_LINE_",
    "associativity",
    "convenience",
    "dynamic",
    "didSet",
    "final",
    "get",
    "infix",
    "inout",
    "lazy",
    "left",
    "mutating",
    "none",
    "nonmutating",
    "optional",
    "override",
    "postfix",
    "precedence",
    "prefix",
    "Protocol",
    "required",
    "right",
    "set",
    "Type",
    "unowned",
    "weak",
    "willSet",
];
const FORBIDDEN_IDENTIFIERS = new Set([...KOTLIN_KEYWORDS, ...TYPESCRIPT_KEYWORDS, ...SWIFT_KEYWORDS]);
/**
 * parse a type definition string from the json into a structure that contains all information needed to render
 * language-specific type defs
 */
export function parseType(typeString) {
    let nullable = false;
    typeString = typeString.trim();
    if (typeString.endsWith("?")) {
        nullable = true;
        typeString = typeString.slice(0, -1);
    }
    const listMatch = typeString.match(/^\s*List<\s*(.*)\s*>\s*$/);
    if (listMatch) {
        const nested = parseType(listMatch[1]);
        return { baseName: "List", generics: [nested], nullable, external: false };
    }
    const mapMatch = typeString.match(/^\s*Map<\s*(.*?),\s*(.*?)\s*>\s*$/);
    if (mapMatch) {
        const nestedKey = parseType(mapMatch[1]);
        const nestedValue = parseType(mapMatch[2]);
        return { baseName: "Map", generics: [nestedKey, nestedValue], nullable, external: false };
    }
    // this is a basic type without generic params
    const external = !PRIMITIVES.includes(typeString);
    const willBreakAtLeastOneLang = FORBIDDEN_IDENTIFIERS.has(typeString) && external;
    const startsWithLetterOrUnderscore = typeString.match(/^[_a-zA-Z]/);
    if (willBreakAtLeastOneLang || !startsWithLetterOrUnderscore) {
        throw new Error(`illegal identifier: "${typeString}"`);
    }
    return { baseName: typeString, generics: [], external, nullable };
} // frontend type
/**
 * Assure that the given string is a valid identifier for all languages
 */
export function assertValidIdentifier(ident) {
    if (FORBIDDEN_IDENTIFIERS.has(ident)) {
        throw new Error(`identifier "${ident}" is forbidden`);
    }
    if (!ident.match(/^[_a-zA-Z][_a-zA-Z0-9]*$/)) {
        throw new Error(`identifier ${ident} contains forbidden characters`);
    }
    return ident;
}
