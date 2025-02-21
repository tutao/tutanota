import { Argument, Option, program } from "commander"
import { rolldown } from "rolldown"
import * as LaunchHtml from "../buildSrc/LaunchHtml.js"
import { writeFile } from "../buildSrc/buildUtils.js"
import * as env from "../buildSrc/env.js"
import { domainConfigs } from "../buildSrc/DomainConfigs.js"

await program
	.action(async () => {
		const showcaseEnv = env.create({ staticUrl: null, version: "0", mode: "Browser", dist: false, domainConfigs })

		const bundle = await rolldown({
			input: "showcase.ts",
			define: {
				// Need it at least until inlining enums is supported
				LOAD_ASSERTIONS: "false",
			},
			external: "fs", // qrcode-svg tries to import it on save()
			plugins: [
				// resolveLibs(),
			],
		})

		await bundle.write({
			dir: `build`,
			format: "esm",
			// Setting source map to inline for web part because source maps won't be loaded correctly on mobile because requests from dev tools are not
			// intercepted, so we can't serve the files.
			sourcemap: "inline",
			// overwrite the files rather than keeping all versions in the build folder
			chunkFileNames: "[name]-chunk.js",
			banner: `globalThis.env = ${JSON.stringify(env, null, 2)}`,
		})

		const html = await LaunchHtml.renderHtml([{ src: "./showcase.js", type: "module" }], showcaseEnv)
		await writeFile(`./build/index.html`, html)
	})
	.parseAsync(process.argv)
