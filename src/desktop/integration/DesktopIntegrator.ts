import type {WindowManager} from "../DesktopWindowManager"
export interface DesktopIntegrator {
    readonly enableAutoLaunch: () => Promise<void>
    readonly disableAutoLaunch: () => Promise<void>
    readonly isAutoLaunchEnabled: () => Promise<boolean>
    readonly runIntegration: (wm: WindowManager) => Promise<void>
    readonly isIntegrated: () => Promise<boolean>
    readonly integrate: () => Promise<void>
    readonly unintegrate: () => Promise<void>
}
export async function getDesktopIntegratorForPlatform(
    electron: $Exports<"electron">,
    fs: $Exports<"fs">,
    childProcess: $Exports<"child_process">,
    _winreg: () => Promise<$Exports<"winreg">>,
): Promise<DesktopIntegrator> {
    switch (process.platform) {
        case "win32":
            const {DesktopIntegratorWin32} = await import("./DesktopIntegratorWin32")
            const winreg = await _winreg()
            return new DesktopIntegratorWin32(electron, winreg.default)

        case "darwin":
            const {DesktopIntegratorDarwin} = await import("./DesktopIntegratorDarwin.js")
            return new DesktopIntegratorDarwin(electron)

        case "linux":
            const {DesktopIntegratorLinux} = await import("./DesktopIntegratorLinux")
            return new DesktopIntegratorLinux(electron, fs, childProcess)

        default:
            return Promise.reject(new Error("Invalid Platform"))
    }
}