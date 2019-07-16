const path = require('path')

/**
 * This is used for launching electron:
 * 1. copied to app-desktop/build from make.js
 * 2. copied to app-desktop/build/dist from dist.js (DesktopBuilder)
 */

module.exports = function (nameSuffix, version, targetUrl, iconPath, sign) {
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
            "pubKeyUrl": "https://raw.githubusercontent.com/tutao/tutanota/electron-client/tutao-pub.pem",
            "pubKeys": [
                "-----BEGIN PUBLIC KEY-----\n"
                + "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1eQA3vZyVSSMUbFZrSxB\n"
                + "va/OErAiT7HrVKF1m8ZLpsTu652SFLKelrFlUWz+ZcWx7yxNzpj8hpB4SDwJxQeO\n"
                + "9UD5q6IozwhNSV10h6G19lls3+3x3rzuQTOPXzNLv7SG1mdQUwfsf91gzv3Yg2Qd\n"
                + "Wd8gpKYLmG8rKo95FFAAXiafISs/3Xi8B+9dBp8cjgO4Nq/oTdLeYGBWfe+oDzPv\n"
                + "JPL4IDQa+SR5eI6jEMoVBRC7LihkP+fCwdhrlyOD+ei7s1YVoNU+qpWeLZ6wCYLP\n"
                + "Xbt7N3L2t3TiXEWmz+pjCz/HG3m/PuGamlGHDy/P8WlnvsbIEI6doDU8gAHUkpNS\n"
                + "HwIDAQAB\n"
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
            "defaultDesktopConfig": {
                "heartbeatTimeoutInSeconds": 30,
                "defaultDownloadPath": null,
                "enableAutoUpdate": true,
                "runAsTrayApp": true,
            }
        },
        "dependencies": {
            "electron-updater": "4.1.2",
            "chalk": "2.4.2",
            "electron-localshortcut": "3.1.0",
            "fs-extra": "7.0.1",
            "bluebird": "3.5.2",
            "node-forge": "0.8.3",
            "winreg": "1.2.4"
        },
        "build": {
            "afterAllArtifactBuild": "./buildSrc/afterAllArtifactBuild.js",
            "electronVersion": "4.1.4",
            "icon": iconPath,
            "appId": "de.tutao.tutanota" + nameSuffix,
            "productName": nameSuffix.length > 0
                ? nameSuffix.slice(1) + " Tutanota Desktop"
                : "Tutanota Desktop",
            "artifactName": "${name}-${os}.${ext}",
            "protocols": [
                {
                    "name": "Mailto Links",
                    "schemes": [
                        "mailto"
                    ],
                    "role": "Editor"
                }
            ],
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
                "publisherName": "Tutao GmbH",
                "sign": sign
                    ? "./buildSrc/winsigner.js"
                    : undefined,
                "signingHashAlgorithms": [
                    "sha256"
                ],
                "target": [
                    {
                        "target": "nsis",
                        "arch": "x64"
                    }
                ]
            },
            "nsis": {
                "oneClick": false, "perMachine": false,
                "createStartMenuShortcut": true,
                "allowElevation": true,
                "allowToChangeInstallationDirectory": true
            },
            "mac": {
                "icon": path.join(path.dirname(iconPath), "logo-solo-red.png.icns"),
                "extendInfo": {
                    "LSUIElement": 1 //hide dock icon on startup
                },
                "target": [
                    {
                        "target": "zip",
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

