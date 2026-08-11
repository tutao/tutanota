import { IDotMenu, IMail, IMailView, IUIRegistry } from "./IUIRegistry"

class DotMenu implements IDotMenu {
	public add(icon: string, name: string, action: () => void): void {
		action()
	}
	remove(name: string): void {}
}

class MailView implements IMailView {
	dotMenu = new DotMenu()
}

class Mail implements IMail {
	mailView = new MailView()
}

export class UIRegistry implements IUIRegistry {
	mail = new Mail()
}
