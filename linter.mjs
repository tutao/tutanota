import { parse } from "@typescript-eslint/typescript-estree"

const code = 'import m, {m, u as m} from "mithril";const message: string = "Hello, TypeScript!"; const vnode = m("");'

const ast = parse(code)

console.log(JSON.stringify(ast, null, 2))
