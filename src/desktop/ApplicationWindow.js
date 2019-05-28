// @flow
import type {ElectronPermission} from 'electron'
import {BrowserWindow, Menu, shell, WebContents} from 'electron'
import * as localShortcut from 'electron-localshortcut'
import DesktopUtils from './DesktopUtils.js'
import u2f from '../misc/u2f-api.js'
import {lang} from './DesktopLocalizationProvider.js'
import type {WindowBounds, WindowManager} from "./DesktopWindowManager"
import type {IPC} from "./IPC"

export type UserInfo = {|
    userId: string,
    mailAddress: string
|}

export class ApplicationWindow {
    _ipc: IPC;
    _startFile: string;
    _browserWindow: BrowserWindow;
    _userInfo: ?UserInfo;
    _setBoundsTimeout: TimeoutID;
    _preloadjs: string;
    _desktophtml: string;
    id: number;

    constructor(wm: WindowManager, preloadjs: string, desktophtml: string, noAutoLogin?: boolean) {
        this._userInfo = null
        this._ipc = wm.ipc
        this._preloadjs = preloadjs
        this._desktophtml = desktophtml
        this._startFile = DesktopUtils.pathToFileURL(this._desktophtml)
        console.log("startFile: ", this._startFile)
        this._createBrowserWindow(wm)
        this._browserWindow.loadURL(
            noAutoLogin
                ? this._startFile + "?noAutoLogin=true"
                : this._startFile
        )
        Menu.setApplicationMenu(null)
    }

    //expose browserwindow api
    on = (m: BrowserWindowEvent, f: (Event)=>void) => this._browserWindow.on(m, f)
    once = (m: BrowserWindowEvent, f: (Event)=>void) => this._browserWindow.once(m, f)
    getTitle = () => this._browserWindow.webContents.getTitle()
    setZoomFactor = (f: number) => this._browserWindow.webContents.setZoomFactor(f)
    isFullScreen = () => this._browserWindow.isFullScreen()
    isMinimized = () => this._browserWindow.isMinimized()
    minimize = () => this._browserWindow.minimize()
    hide = () => this._browserWindow.hide()
    center = () => this._browserWindow.center()
    showInactive = () => this._browserWindow.showInactive()
    isFocused = () => this._browserWindow.isFocused()

    show() {
        if (!this._browserWindow) {
            return
        }
        const contents = this._browserWindow.webContents
        const devToolsState = contents.isDevToolsOpened()
        this._browserWindow.show()
        if (this._browserWindow.isMinimized()) {
            this._browserWindow.restore()
            //TODO: there has to be a better way. fix for #691
            contents.toggleDevTools()
            if (devToolsState) {
                contents.openDevTools()
            } else {
                contents.closeDevTools()
            }
        } else if (!this._browserWindow.isFocused()) {
            this._browserWindow.focus()
        }
    }

    _createBrowserWindow(wm: WindowManager) {
        this._browserWindow = new BrowserWindow({
            icon: wm.getIcon(),
            show: false,
            autoHideMenuBar: true,
            webPreferences: {
                nodeIntegration: false,
                nodeIntegrationInWorker: false,
                // TODO: not a real os sandbox yet.
                // https://github.com/electron-userland/electron-builder/issues/2562
                // https://electronjs.org/docs/api/sandbox-option
                sandbox: true,
                // can't use contextIsolation because this will prevent
                // the preload script changes to the web app
                contextIsolation: false,
                webSecurity: true,
                preload: this._preloadjs
            }
        })
        this._browserWindow.setMenuBarVisibility(false)
        this.id = this._browserWindow.id
        this._ipc.addWindow(this.id)

        this._browserWindow.webContents.session.setPermissionRequestHandler(this._permissionRequestHandler)
        wm.dl.manageDownloadsForSession(this._browserWindow.webContents.session)

        this._browserWindow
            .on('closed', () => {
                this.setUserInfo(null)
                this._ipc.removeWindow(this.id)
            })
            .on('focus', () => localShortcut.enableAll(this._browserWindow))
            .on('blur', ev => localShortcut.disableAll(this._browserWindow))

        this._browserWindow.webContents
            .on('new-window', (e, url) => {
                // we never open any new windows directly from the renderer
                // except for links in mails etc. so open them in the browser
                shell.openExternal(url)
                e.preventDefault()
            })
            .on('will-attach-webview', e => e.preventDefault())
            .on('did-start-navigation', (e, url, isInPlace) => {
                const newURL = this._rewriteURL(url, isInPlace)
                if (newURL !== url) {
                    e.preventDefault()
                    this._browserWindow.loadURL(newURL)
                }
            })
            .on('context-menu', (e, params) => {
                this.sendMessageToWebContents('open-context-menu', [{linkURL: params.linkURL}])
            })
            .on('crashed', () => wm.recreateWindow(this))
        /**
         * we need two conditions for the context menu to work on every window
         * 1. the preload script must have run already on this window
         * 2. the first web app instance must have sent the translations to the node thread
         * dom-ready is after preload and after the index.html was loaded into the webContents,
         * but may be before any javascript ran
         */
        this._browserWindow.webContents.on('dom-ready', () => {
            lang.initialized.promise.then(() => this.sendMessageToWebContents('setup-context-menu', []))
        })

        localShortcut.register(this._browserWindow, 'CommandOrControl+F', () => this._openFindInPage())
        localShortcut.register(this._browserWindow, 'CommandOrControl+P', () => this._printMail())
        localShortcut.register(this._browserWindow, 'F12', () => this._toggleDevTools())
        localShortcut.register(this._browserWindow, 'F5', () => this._browserWindow.loadURL(this._startFile))
        localShortcut.register(this._browserWindow, 'CommandOrControl+W', () => this._browserWindow.close())
        localShortcut.register(this._browserWindow, 'CommandOrControl+H', () => this._browserWindow.hide())
        localShortcut.register(this._browserWindow, 'CommandOrControl+N', () => wm.newWindow(true))
        localShortcut.register(
            this._browserWindow,
            process.platform === 'darwin'
                ? 'Command+Control+F'
                : 'F11',
            () => this._toggleFullScreen()
        )
    }

    openMailBox(info: UserInfo, path?: ?string): Promise<void> {
        return this._ipc.initialized(this.id).then(() =>
            this._ipc.sendRequest(this.id, 'openMailbox', [info.userId, info.mailAddress, path])
        ).then(() => this.show())
    }

    sendMessageToWebContents(message: WebContentsMessage | number, args: any) {
        if (!this._browserWindow || this._browserWindow.isDestroyed()) {
            console.warn(`BrowserWindow unavailable, not sending message ${message}:\n${args}`)
            return
        }
        if (!this._browserWindow.webContents || this._browserWindow.webContents.isDestroyed()) {
            console.warn(`WebContents unavailable, not sending message ${message}:\n${args}`)
            return
        }
        this._browserWindow.webContents.send(message.toString(), args)
    }

    setUserInfo(info: ?UserInfo) {
        this._userInfo = info
    }

    getUserInfo(): ?UserInfo {
        return this._userInfo
    }

    getUserId(): ?string {
        return this._userInfo ? this._userInfo.userId : null
    }

    getPath(): string {
        return this._browserWindow.webContents.getURL().substring(this._startFile.length)
    }

    // filesystem paths work differently than URLs
    _rewriteURL(url: string, isInPlace: boolean): string {
        if (
            !url.startsWith(this._startFile) &&
            !url.startsWith(`chrome-extension://${u2f.EXTENSION_ID}`)
        ) {
            return this._startFile
        }
        if (url === this._startFile + '?r=%2Flogin%3FnoAutoLogin%3Dtrue' && isInPlace) {
            // after logout, don't try to login automatically.
            // this fails if ?noAutoLogin=true is set directly from the web app for some reason
            return this._startFile + '?noAutoLogin=true'
        }
        return url
    }

    findInPage(args: Array<any>): Promise<{ currentMatch: number, numberOfMatches: number }> {
        if (args[0] !== '') {
            this._browserWindow.webContents.findInPage(args[0], args[1])
            return new Promise((resolve) => {
                this._browserWindow.webContents.once('found-in-page', (ev: Event, res: { activeMatchOrdinal: number, matches: number }) => {
                    resolve({
                        currentMatch: res.activeMatchOrdinal - 1,
                        numberOfMatches: res.matches - 1
                    })
                })
            })
        } else {
            this.stopFindInPage()
            return Promise.resolve({currentMatch: 0, numberOfMatches: 0})
        }
    }

    stopFindInPage() {
        this._browserWindow.webContents.stopFindInPage('keepSelection')
    }

    _permissionRequestHandler(webContents: WebContents, permission: ElectronPermission, callback: (boolean) => void) {
        return callback(false)
    }

    _toggleDevTools(): void {
        const wc = this._browserWindow.webContents
        if (wc.isDevToolsOpened()) {
            wc.closeDevTools()
        } else {
            wc.openDevTools({mode: 'undocked'})
        }
    }

    _toggleFullScreen(): void {
        this._browserWindow.setFullScreen(!this._browserWindow.isFullScreen())
    }

    _printMail() {
        this._ipc.sendRequest(this.id, 'print', [])
    }

    _openFindInPage(): void {
        this._ipc.sendRequest(this.id, 'openFindInPage', [])
    }

    isVisible(): boolean {
        return this._browserWindow.isVisible() && !this._browserWindow.isMinimized()
    }

    // browserWindow.hide() was called (or it was created with showWhenReady = false)
    isHidden(): boolean {
        return !this._browserWindow.isVisible() && !this._browserWindow.isMinimized()
    }

    setBounds(bounds: WindowBounds) {
        this._browserWindow.setFullScreen(bounds.fullscreen)
        if (bounds.fullscreen) return
        this._browserWindow.setBounds(bounds.rect)
        if (process.platform !== 'linux') return
        clearTimeout(this._setBoundsTimeout)
        this._setBoundsTimeout = setTimeout(() => {
            const newRect = this._browserWindow.getBounds()
            if (bounds.rect.y !== newRect.y) {
                // window was moved by the OS, so we move it back twice the distance.
                // should end up right where we want it.
                this._browserWindow.setPosition(newRect.x, newRect.y + 2 * (bounds.rect.y - newRect.y))
            }
        }, 200)
    }

    getBounds(): WindowBounds {
        return {
            fullscreen: this._browserWindow.isFullScreen(),
            rect: this._browserWindow.getBounds()
        }
    }
}
