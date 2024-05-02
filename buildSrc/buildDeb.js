/**
 * This is a script that runs all steps necessary for publishing the finished build artifacts, i.e. signed binaries.
 * The steps performed in here should be moved to the Jenkinsfile. That would be much simpler plus we never want to run this outside of our CI environment.
 */
import { getTutanotaAppVersion } from "./buildUtils.js"
import "zx/globals"
import { Argument, program } from "commander"

program.name("buildDeb").description("A script to package the app into a deb")

program
	.addArgument(new Argument("target").choices(["webapp", "desktop-staging", "desktop-prod"]))
	.action(async (target) => {
		switch (target) {
			case "webapp": {
				await compress()
				const tutanotaVersion = await getTutanotaAppVersion()
				await packageDeb({
					version: tutanotaVersion,
					name: "tutanota",
					fpmRootMapping: "./build/=/opt/tutanota",
					fpmAfterInstallScript: "./resources/scripts/after-install.sh",
				})
				break
			}
			case "desktop-staging": {
				await compress()
				const tutanotaVersion = await getTutanotaAppVersion()
				await packageDeb({
					version: tutanotaVersion,
					name: "tutanota-desktop-test",
					fpmRootMapping: `./build/desktop-test/=/opt/tutanota-desktop`,
				})
				break
			}
			case "desktop-prod": {
				await compress()
				const tutanotaVersion = await getTutanotaAppVersion()
				await packageDeb({
					version: tutanotaVersion,
					name: "tutanota-desktop",
					fpmRootMapping: `./build/desktop/=/opt/tutanota-desktop`,
				})
				break
			}
		}
	})
	.parse()

// Find and compress built code (js and html)
function compress() {
	return $`/usr/bin/find ./build '(' -name "*.js" -o -name "*.html" ')' -exec gzip --force --keep --verbose --best '{}' ';'`
}

async function packageDeb({ version, fpmRootMapping, name, fpmAfterInstallScript }) {
	const fpmFlags = [
		`--force`,
		`--input-type`,
		`dir`,
		`--output-type`,
		`deb`,
		`--deb-user`,
		`tutadb`,
		`--deb-group`,
		`tutadb`,
		`--name`,
		name,
		`--version`,
		version,
	]

	if (fpmAfterInstallScript != null) {
		fpmFlags.push(`--after-install`, fpmAfterInstallScript, "--template-scripts")
	}

	await $`/usr/local/bin/fpm ${fpmFlags} ${fpmRootMapping}`

	// The output filename from fpm
	const debName = `${name}_${version}_amd64.deb`
	// user puppet needs to read the deb file from jetty
	await $`/bin/chmod o+r ${debName}`

	console.log(`Packaged deb file at ${debName}`)
}
