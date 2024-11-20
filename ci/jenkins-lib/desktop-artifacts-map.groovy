def filesPathAndExt() {
	return [
			windows: [
					staging: [
							["build/desktop-test/tutanota-desktop-test-win.exe", "exe"],
							["build/desktop-test/tutanota-desktop-test-win.exe.blockmap", "exe.blockmap"],
							["build/desktop-test/win-sig.bin", "sig.bin"],
							["build/desktop-test/latest.yml", "latest.yml"],
					],
					prod   : [
							["build/desktop/tutanota-desktop-win.exe", "exe"],
							["build/desktop/tutanota-desktop-win.exe.blockmap", "exe.blockmap"],
							["build/desktop/win-sig.bin", "sig.bin"],
							["build/desktop/latest.yml", "latest.yml"],
					]
			],
			mac    : [
					staging: [
							["build/desktop-test/tutanota-desktop-test-mac.dmg", "dmg"],
							["build/desktop-test/tutanota-desktop-test-mac.dmg.blockmap", "dmg.blockmap"],
							["build/desktop-test/tutanota-desktop-test-mac.zip", "zip"],
							["build/desktop-test/tutanota-desktop-test-mac.zip.blockmap", "zip.blockmap"],
							["build/desktop-test/mac-sig-dmg.bin", "sig.dmg.bin"],
							["build/desktop-test/mac-sig-zip.bin", "sig.zip.bin"],
							["build/desktop-test/latest-mac.yml", "latest.yml"],
					],
					prod   : [
							["build/desktop/tutanota-desktop-mac.dmg", "dmg"],
							["build/desktop/tutanota-desktop-mac.dmg.blockmap", "dmg.blockmap"],
							["build/desktop/tutanota-desktop-mac.zip", "zip"],
							["build/desktop/tutanota-desktop-mac.zip.blockmap", "zip.blockmap"],
							["build/desktop/mac-sig-dmg.bin", "sig.dmg.bin"],
							["build/desktop/mac-sig-zip.bin", "sig.zip.bin"],
							["build/desktop/latest-mac.yml", "latest.yml"],
					]
			],
			linux  : [
					staging: [
							["build/desktop-test/tutanota-desktop-test-linux.AppImage", "AppImage"],
							["build/desktop-test/linux-sig.bin", "sig.bin"],
							["build/desktop-test/latest-linux.yml", "latest.yml"],
					],
					prod   : [
							["build/desktop/tutanota-desktop-linux.AppImage", "AppImage"],
							["build/desktop/linux-sig.bin", "sig.bin"],
							["build/desktop/latest-linux.yml", "latest.yml"],
					]
			],
	]
}

// required in order to be able to use "load" to include this script in a jenkins pipleline
return this