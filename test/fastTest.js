import path from "path"
import esbuild from "esbuild"

let resolveLibs = {
	name: "qrcode-svg",
	setup(build) {
		build.onResolve({ filter: /^qrcode-svg$/ }, async () => {
			return { path: path.normalize("./libs/qrcode.js"), external: true }
		})
	},
}

const external = [
	"better-sqlite3",
	"crypto",
	"xhr2",
	"express",
	"server-destroy",
	"body-parser",
	"mockery",
	"path",
	"url",
	"util",
	"node-forge",
	"os",
	"electron-updater",
	"child_process",
	"querystring",
	"events",
	"fs",
	"buffer",
	"winreg",
	"testdouble",
]

await esbuild
	.build({
		entryPoints: ["api/bootstrapTests-api-fast.ts"],
		bundle: true,
		outfile: "../build/test-api.js",
		plugins: [resolveLibs],
		platform: "node",
		format: "esm",
		target: "node16",
		external,
		treeShaking: true,
	})
	.catch(() => process.exit(1))

await import("../build/test-api.js")
