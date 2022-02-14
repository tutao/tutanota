/**
 * This is a script that runs all steps necessary for publishing the finished build artifacts, i.e. signed binaries.
 * The steps performed in here should be moved to the Jenkinsfile. That would be much simpler plus we never want to run this outside of our CI environment.
 */
import {spawnSync} from "child_process"
import {exitOnFail, getTutanotaAppVersion} from "./buildUtils.js"
import {dirname} from "path"
import {fileURLToPath} from "url"

const __dirname = dirname(fileURLToPath(import.meta.url));

packageAndPublish()
	.then(v => {
		console.log("Published successfully")
		process.exit()
	})
	.catch(e => {
		console.log("Publishing failed: ", e)
		process.exit(1)
	})

async function packageAndPublish() {
	const version = await getTutanotaAppVersion()
	const debs = {
		webApp: `tutanota_${version}_amd64.deb`,
		desktop: `tutanota-desktop_${version}_amd64.deb`,
		desktopTest: `tutanota-desktop-test_${version}_amd64.deb`,
		// the dicts are bound to an electron release, so we use that version number.
		dict: `tutanota-desktop-dicts_${electronVersion}_amd64.deb`
	}

	packageDeb(version, debs)
	publish(version, debs)
}

function publish(version, debs) {
	console.log("Create git tag and copy .deb")
	exitOnFail(spawnSync("/usr/bin/git", `tag -a tutanota-release-${version} -m ''`.split(" "), {
		stdio: [process.stdin, process.stdout, process.stderr]
	}))

	exitOnFail(spawnSync("/usr/bin/git", `push origin tutanota-release-${version}`.split(" "), {
		stdio: [process.stdin, process.stdout, process.stderr]
	}))

	exitOnFail(spawnSync("/bin/cp", `-f build/${debs.webApp} /opt/repository/tutanota/`.split(" "), {
		cwd: __dirname,
		stdio: [process.stdin, process.stdout, process.stderr]
	}))

	exitOnFail(spawnSync("/bin/cp", `-f build/${debs.desktop} /opt/repository/tutanota-desktop/`.split(" "), {
		cwd: __dirname,
		stdio: [process.stdin, process.stdout, process.stderr]
	}))
	exitOnFail(spawnSync("/bin/cp", `-f build/${debs.desktopTest} /opt/repository/tutanota-desktop-test/`.split(" "), {
		cwd: __dirname,
		stdio: [process.stdin, process.stdout, process.stderr]
	}))

	// copy appimage for dev_clients
	exitOnFail(spawnSync("/bin/cp", `-f build/desktop/tutanota-desktop-linux.AppImage /opt/repository/dev_client/tutanota-desktop-linux-new.AppImage`.split(" "), {
		cwd: __dirname,
		stdio: [process.stdin, process.stdout, process.stderr]
	}))

	// user puppet needs to read the deb file from jetty
	exitOnFail(spawnSync("/bin/chmod", `o+r /opt/repository/tutanota/${debs.webApp}`.split(" "), {
		cwd: __dirname + '/build/',
		stdio: [process.stdin, process.stdout, process.stderr]
	}))

	exitOnFail(spawnSync("/bin/chmod", `o+r /opt/repository/tutanota-desktop/${debs.desktop}`.split(" "), {
		cwd: __dirname + '/build/',
		stdio: [process.stdin, process.stdout, process.stderr]
	}))
	exitOnFail(spawnSync("/bin/chmod", `o+r /opt/repository/tutanota-desktop-test/${debs.desktopTest}`.split(" "), {
		cwd: __dirname + '/build/',
		stdio: [process.stdin, process.stdout, process.stderr]
	}))
	// in order to release this new version locally, execute:
	// mv /opt/repository/dev_client/tutanota-desktop-linux-new.AppImage /opt/repository/dev_client/tutanota-desktop-linux.AppImage
	exitOnFail(spawnSync("/bin/chmod", `o+r /opt/repository/dev_client/tutanota-desktop-linux-new.AppImage`.split(" "), {
		cwd: __dirname + '/build/',
		stdio: [process.stdin, process.stdout, process.stderr]
	}))
}

function packageDeb(version, debs) {
	// overwrite output, source=dir target=deb, set owner
	const commonArgs = `-f -s dir -t deb --deb-user tutadb --deb-group tutadb`
	const target = `/opt/tutanota`

	exitOnFail(spawnSync("/usr/bin/find", `. ( -name *.js -o -name *.html ) -exec gzip -fkv --best {} \;`.split(" "), {
		cwd: __dirname + '/build/dist',
		stdio: [process.stdin, process.stdout, process.stderr]
	}))

	console.log("create " + debs.webApp)
	exitOnFail(spawnSync("/usr/local/bin/fpm", `${commonArgs} --after-install ../resources/scripts/after-install.sh -n tutanota -v ${version} dist/=${target}`.split(" "), {
		cwd: __dirname + '/build',
		stdio: [process.stdin, process.stdout, process.stderr]
	}))

	console.log("create " + debs.desktop)
	exitOnFail(spawnSync("/usr/local/bin/fpm", `${commonArgs} -n tutanota-desktop -v ${version} desktop/=${target}-desktop`.split(" "), {
		cwd: __dirname + '/build',
		stdio: [process.stdin, process.stdout, process.stderr]
	}))

	console.log("create " + debs.desktopTest)
	exitOnFail(spawnSync("/usr/local/bin/fpm", `${commonArgs} -n tutanota-desktop-test -v ${version} desktop-test/=${target}-desktop`.split(" "), {
		cwd: __dirname + '/build',
		stdio: [process.stdin, process.stdout, process.stderr]
	}))
}