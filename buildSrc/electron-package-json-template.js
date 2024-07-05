import path from "node:path"
import { readFileSync } from "node:fs"
import { getElectronVersion } from "./getInstalledModuleVersion.js"

/**
 * This is used for launching electron:
 * 1. copied to app-desktop/build from make.js
 * 2. copied to app-desktop/build from dist.js (DesktopBuilder)
 *
 * @param p {object}
 * @param p.nameSuffix {string}
 * @param p.version {string}
 * @param p.updateUrl {string}
 * @param p.iconPath {string}
 * @param p.sign {boolean}
 * @param [p.notarize] {boolean}
 * @param [p.unpacked] {boolean}
 * @param p.architecture
 */
export default async function generateTemplate({ nameSuffix, version, updateUrl, iconPath, sign, notarize, unpacked, architecture }) {
	const appName = "tutanota-desktop" + nameSuffix
	const appId = "de.tutao.tutanota" + nameSuffix
	if (process.env.JENKINS_HOME && process.env.DEBUG_SIGN) throw new Error("Tried to DEBUG_SIGN in CI!")
	const debugKey = process.env.DEBUG_SIGN ? readFileSync(path.join(process.env.DEBUG_SIGN, "test.pubkey"), { encoding: "utf8" }) : undefined
	const log = console.log.bind(console)
	return {
		name: appName,
		main: "./desktop/DesktopMain.js",
		version: version,
		author: "Tutao GmbH",
		description: "The desktop client for Tutanota, the secure e-mail service.",
		scripts: {
			start: "electron .",
		},
		"tutao-config": {
			pubKeys: [
				"-----BEGIN PUBLIC KEY-----\n" +
					"MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAhFrLW999Y/ODqGfGKSzh\n" +
					"7SFm6UgIj5scpb1r+KmEgVr/3zmd973+u2z5gG/wtayUbdVUGlzTgxqTE76BGTBR\n" +
					"szq932uTsPfjRbtbyjIOzfzPvkyAB1Ew91gQk5ubrO1VCbXAZyuFi7RxDibuklLO\n" +
					"lzHyjKyEIVTTdOqOTE+mg/vr41MxDW0X4nZw5MT1mIV/aYGeOSdtNdFsL69aR+d7\n" +
					"KufD43J60FUS9G0tf4KmyQInmGqC8MSXCO0SMwwEJZDxDzkBsSensKfS0HzIjCXS\n" +
					"or/Ahu6RwhEhjm7MyXbhiDyis+kGHSfatsO5KWWuZ4xgCEUO0L6vMQwr5M/qYOj1\n" +
					"7QIDAQAB\n" +
					"-----END PUBLIC KEY-----",
				"-----BEGIN PUBLIC KEY-----\n" +
					"MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAk4NkSbs41KjuNZfFco2l\n" +
					"unXXFOIkrdBfDmIiVfVTYagEk2cN9HkjCkiNsHucLHPuHb0reHsaxrDVE1lWGTPI\n" +
					"0Lh5diLYdxJ+AGy/8j9jsO51hONqTujdD0mJs14YkVfOUXyHQh1z6WJCLc9jrN9+\n" +
					"3dgKOlQRYW2mYise8ggYYcrRs/CY40s3/cQvrFSprFMPS6E+9lmIDp0hPKr9q90t\n" +
					"IXmzihQyc8Q0VmAfCqEwUtx6RY6BGkqKiDoMh4Qs5ZwFxhoSfgrJiwBmv0HcX1yv\n" +
					"QGNSdxrpLuMA/afCPdf49x3iwy+p+paXHKirgM5z6rnikk10Lko7dNXV0735PsZd\n" +
					"dQIDAQAB\n" +
					"-----END PUBLIC KEY-----",
				debugKey,
			],
			pollingInterval: 1000 * 60 * 60 * 3, // 3 hours
			iconName: "logo-solo-red.png",
			fileManagerTimeout: 30000,
			// true if this version checks its updates. use to prevent local builds from checking sigs.
			checkUpdateSignature: sign,
			appUserModelId: appId,
			initialSseConnectTimeoutInSeconds: 60,
			maxSseConnectTimeoutInSeconds: 2400,
			configMigrationFunction: "migrateClient",
			updateUrl,
			defaultDesktopConfig: {
				/**
				 * do not change defaultDesktopConfig
				 * instead, add migrations to src/desktop/DesktopConfigMigrator.js
				 */
				heartbeatTimeoutInSeconds: 30,
				defaultDownloadPath: null,
				enableAutoUpdate: true,
				runAsTrayApp: true,
			},
		},
		dependencies: {},
		build: {
			electronVersion: await getElectronVersion(log),
			icon: iconPath,
			appId: appId,
			productName: nameSuffix.length > 0 ? nameSuffix.slice(1) + " Tuta Mail" : "Tuta Mail",
			artifactName: "${name}-${os}.${ext}",
			asarUnpack: "desktop/*.node",
			afterSign: notarize ? "buildSrc/notarize.cjs" : undefined,
			protocols: [
				{
					name: "Mailto Links",
					schemes: ["mailto"],
					role: "Editor",
				},
			],
			forceCodeSigning: sign,
			publish: updateUrl
				? {
						provider: "generic",
						url: updateUrl,
						channel: "latest",
						publishAutoUpdate: true,
						useMultipleRangeRequest: false,
				  }
				: undefined,
			directories: {
				output: "installers",
			},
			extraResources: {
				from: path.dirname(iconPath),
				to: "./icons/",
			},
			win: {
				// relative to the project dirm which is ./build/
				extraFiles: ["mapirs.dll"],
				verifyUpdateCodeSignature: sign,
				signDlls: sign,
				publisherName: "Tutao GmbH",
				sign: sign ? "./buildSrc/winsigner.cjs" : undefined,
				signingHashAlgorithms: sign ? ["sha256"] : undefined,
				target: [
					{
						target: unpacked ? "dir" : "nsis",
						arch: architecture,
					},
				],
			},
			nsis: {
				oneClick: false,
				perMachine: false,
				createStartMenuShortcut: true,
				allowElevation: true,
				allowToChangeInstallationDirectory: true,
				include: path.join("..", "..", "buildSrc", "windows-installer.nsh"),
				warningsAsErrors: true,
			},
			mac: {
				hardenedRuntime: true,
				type: "distribution",
				gatekeeperAssess: false,
				entitlements: "buildSrc/mac-entitlements.plist",
				entitlementsInherit: "buildSrc/mac-entitlements.plist",
				icon: path.join(path.dirname(iconPath), "logo-solo-red.png.icns"),
				extendInfo: {
					LSUIElement: 1, //hide dock icon on startup
				},
				target: unpacked
					? [{ target: "dir", arch: architecture }]
					: [
							{
								target: "zip",
								arch: architecture,
							},
							{
								target: "dmg",
								arch: architecture,
							},
					  ],
			},
			linux: {
				icon: path.join(path.dirname(iconPath), "icon/"),
				synopsis: "Tuta Mail Desktop Client",
				category: "Network",
				desktop: {
					StartupWMClass: appName,
				},
				target: [
					{
						target: unpacked ? "dir" : "AppImage",
						arch: architecture,
					},
				],
			},
		},
	}
}
