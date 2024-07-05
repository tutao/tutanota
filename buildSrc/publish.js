/**
 * This is a script that runs all steps necessary for publishing the finished build artifacts, i.e. signed binaries.
 * The steps performed in here should be moved to the Jenkinsfile. That would be much simpler plus we never want to run this outside of our CI environment.
 */
import { getTutanotaAppVersion } from "./buildUtils.js"
import "zx/globals"
;(async function () {
	// Find and compress built code (js and html)
	const compress = () => $`/usr/bin/find ./build '(' -name "*.js" -o -name "*.html" ')' -exec gzip --force --keep --verbose --best '{}' ';'`

	if (process.argv[2] === "webapp") {
		await compress()
		const tutanotaVersion = await getTutanotaAppVersion()
		await packageAndPublishDeb({
			version: tutanotaVersion,
			name: "tutanota",
			fpmRootMapping: "./build/=/opt/tutanota",
			fpmAfterInstallScript: "./resources/scripts/after-install.sh",
			destinationDir: `/opt/repository/tutanota`,
		})
	} else if (process.argv[2] === "desktop") {
		await compress()
		const tutanotaVersion = await getTutanotaAppVersion()
		await packageAndPublishDeb({
			version: tutanotaVersion,
			name: "tutanota-desktop",
			fpmRootMapping: `./build/desktop/=/opt/tutanota-desktop`,
			destinationDir: `/opt/repository/tutanota-desktop`,
		})
		await packageAndPublishDeb({
			version: tutanotaVersion,
			name: "tutanota-desktop-test",
			fpmRootMapping: `./build/desktop-test/=/opt/tutanota-desktop`,
			destinationDir: `/opt/repository/tutanota-desktop-test`,
		})

		// copy appimage for dev_clients
		// in order to release this new version locally, execute:
		// mv /opt/repository/dev_client/tutanota-desktop-linux-new.AppImage /opt/repository/dev_client/tutanota-desktop-linux.AppImage
		await $`/bin/cp -f ./build/desktop/tutanota-desktop-linux.AppImage /opt/repository/dev_client/tutanota-desktop-linux-new.AppImage`
		await $`/bin/chmod o+r /opt/repository/dev_client/tutanota-desktop-linux-new.AppImage`
	} else {
		console.error("Usage: node publish <webapp|desktop>")
		process.exit(1)
	}
})()

/**
 * @param params {object}
 * @param params.version {string}
 * @param params.fpmRootMapping {string}
 * @param params.name {string}
 * @param [params.fpmAfterInstallScript] {string}
 * @param params.destinationDir {string}
 */
async function packageAndPublishDeb({ version, fpmRootMapping, name, fpmAfterInstallScript, destinationDir }) {
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
	const destination = path.join(destinationDir, debName)

	await $`/bin/cp -f ./${debName} ${destination}`

	// user puppet needs to read the deb file from jetty
	await $`/bin/chmod o+r ${destination}`
}
