/** @file little script to prepare licc install. Implemented as a node script to please Windows. */
import * as fs from "node:fs"

// mkdir -p dist
fs.mkdirSync("dist", { recursive: true })
// touch dist/cli.js
fs.closeSync(fs.openSync("dist/cli.js", "a"))
