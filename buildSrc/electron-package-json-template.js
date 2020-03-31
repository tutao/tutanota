const path = require('path')
const pj = require('../package.json')
/**
 * This is used for launching electron:
 * 1. copied to app-desktop/build from make.js
 * 2. copied to app-desktop/build/dist from dist.js (DesktopBuilder)
 */

module.exports = function (nameSuffix, version, targetUrl, iconPath, sign, notarize) {
	return {
		"name": "tutanota-desktop" + nameSuffix,
		"main": "./src/desktop/DesktopMain.js",
		"version": version,
		"author": "Tutao GmbH",
		"description": "The desktop client for Tutanota, the secure e-mail service.",
		"scripts": {
			"start": "electron ."
		},
		"tutao-config": {
			"pubKeys": [
				"-----BEGIN PUBLIC KEY-----\n"
				+ "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAhFrLW999Y/ODqGfGKSzh\n"
				+ "7SFm6UgIj5scpb1r+KmEgVr/3zmd973+u2z5gG/wtayUbdVUGlzTgxqTE76BGTBR\n"
				+ "szq932uTsPfjRbtbyjIOzfzPvkyAB1Ew91gQk5ubrO1VCbXAZyuFi7RxDibuklLO\n"
				+ "lzHyjKyEIVTTdOqOTE+mg/vr41MxDW0X4nZw5MT1mIV/aYGeOSdtNdFsL69aR+d7\n"
				+ "KufD43J60FUS9G0tf4KmyQInmGqC8MSXCO0SMwwEJZDxDzkBsSensKfS0HzIjCXS\n"
				+ "or/Ahu6RwhEhjm7MyXbhiDyis+kGHSfatsO5KWWuZ4xgCEUO0L6vMQwr5M/qYOj1\n"
				+ "7QIDAQAB\n"
				+ "-----END PUBLIC KEY-----",
				"-----BEGIN PUBLIC KEY-----\n"
				+ "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAk4NkSbs41KjuNZfFco2l\n"
				+ "unXXFOIkrdBfDmIiVfVTYagEk2cN9HkjCkiNsHucLHPuHb0reHsaxrDVE1lWGTPI\n"
				+ "0Lh5diLYdxJ+AGy/8j9jsO51hONqTujdD0mJs14YkVfOUXyHQh1z6WJCLc9jrN9+\n"
				+ "3dgKOlQRYW2mYise8ggYYcrRs/CY40s3/cQvrFSprFMPS6E+9lmIDp0hPKr9q90t\n"
				+ "IXmzihQyc8Q0VmAfCqEwUtx6RY6BGkqKiDoMh4Qs5ZwFxhoSfgrJiwBmv0HcX1yv\n"
				+ "QGNSdxrpLuMA/afCPdf49x3iwy+p+paXHKirgM5z6rnikk10Lko7dNXV0735PsZd\n"
				+ "dQIDAQAB\n"
				+ "-----END PUBLIC KEY-----"
			],
			"pollingInterval": 1000 * 60 * 60 * 3, // 3 hours
			"preloadjs": "./src/desktop/preload.js",
			"desktophtml": "./desktop.html",
			"iconName": "logo-solo-red.png",
			"fileManagerTimeout": 30000,
			// true if this version checks its updates. use to prevent local builds from checking sigs.
			"checkUpdateSignature": sign || !!process.env.JENKINS,
			"appUserModelId": "de.tutao.tutanota" + nameSuffix,
			"initialSseConnectTimeoutInSeconds": 60,
			"maxSseConnectTimeoutInSeconds": 2400,
			"configMigrationFunction": "migrateClient",
			"defaultDesktopConfig": {
				/**
				 * do not change defaultDesktopConfig
				 * instead, add migrations to src/desktop/DesktopConfigMigrator.js
				 */
				"heartbeatTimeoutInSeconds": 30,
				"defaultDownloadPath": null,
				"enableAutoUpdate": true,
				"runAsTrayApp": true,
			}
		},
		"dependencies": {
			"electron-updater": pj.devDependencies["electron-updater"],
			"chalk": pj.devDependencies.chalk,
			"electron-localshortcut": pj.devDependencies["electron-localshortcut"],
			"fs-extra": pj.devDependencies["fs-extra"],
			"bluebird": pj.dependencies.bluebird,
			"node-forge": pj.devDependencies["node-forge"],
			"winreg": pj.devDependencies.winreg,
			"keytar": pj.dependencies.keytar
		},
		"build": {
			"electronVersion": pj.devDependencies.electron,
			"icon": iconPath,
			"appId": "de.tutao.tutanota" + nameSuffix,
			"productName": nameSuffix.length > 0
				? nameSuffix.slice(1) + " Tutanota Desktop"
				: "Tutanota Desktop",
			"artifactName": "${name}-${os}.${ext}",
			"afterSign": notarize ? "buildSrc/notarize.js" : undefined,
			"protocols": [
				{
					"name": "Mailto Links",
					"schemes": [
						"mailto"
					],
					"role": "Editor"
				}
			],
			"forceCodeSigning": sign || !!process.env.JENKINS,
			"publish": {
				"provider": "generic",
				"url": targetUrl,
				"channel": "latest",
				"publishAutoUpdate": true
			},
			"directories": {
				"output": "installers"
			},
			"extraResources": {
				"from": path.dirname(iconPath),
				"to": "./icons/"
			},
			"win": {
				"verifyUpdateCodeSignature": sign,
				"publisherName": "Tutao GmbH",
				"sign": sign
					? "./buildSrc/winsigner.js"
					: undefined,
				"signingHashAlgorithms": sign
					? ["sha256"]
					: undefined,
				"target": [
					{
						"target": "nsis",
						"arch": "x64"
					}
				]
			},
			"nsis": {
				"oneClick": false,
				"perMachine": false,
				"createStartMenuShortcut": true,
				"allowElevation": true,
				"allowToChangeInstallationDirectory": true,
				"include": path.join("..", "..", "buildSrc", "fix-old-uuid.nsh")
			},
			"mac": {
				"hardenedRuntime": true,
				"gatekeeperAssess": false,
				"entitlements": "buildSrc/mac-entitlements.plist",
				"entitlementsInherit": "buildSrc/mac-entitlements.plist",
				"icon": path.join(path.dirname(iconPath), "logo-solo-red.png.icns"),
				"extendInfo": {
					"LSUIElement": 1 //hide dock icon on startup
				},
				"target": [
					{
						"target": "zip",
						"arch": "x64"
					},
					{
						"target": "dmg",
						"arch": "x64"
					}
				]
			},
			"linux": {
				"icon": path.join(path.dirname(iconPath), "icon/"),
				"synopsis": "Tutanota Desktop Client",
				"category": "Network",
				"desktop": {
					"StartupWMClass": "tutanota-desktop" + nameSuffix
				},
				"target": [
					{
						"target": "AppImage",
						"arch": "x64"
					}
				]
			}
		}
	}
}

