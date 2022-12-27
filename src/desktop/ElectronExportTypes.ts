import type * as FsModule from "fs"
import type * as PathModule from "path"
import type * as NetModule from "net"
import type * as ChildProcessModule from "child_process"
import { WebContents } from "electron"

export type FsExports = typeof FsModule
export type PathExports = typeof PathModule
export type NetExports = typeof NetModule
export type ChildProcessExports = typeof ChildProcessModule
export type ElectronExports = typeof Electron.CrossProcessExports
export type WinregExports = { default: WinregStatic }
export type WebContentsEvent = {
	readonly sender: WebContents
	readonly preventDefault: () => void
}
