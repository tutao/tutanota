import { CommandExecutor } from "./CommandExecutor"
import { promises as fs } from "node:fs"
import os from "node:os"
import tls from "node:tls"

export class CertificateProvider {
	private cachedCertificates: string[] | null = null
	private readonly platform = os.platform()

	constructor(private readonly commandExecutor: CommandExecutor) {}

	async getCertificates(): Promise<string[]> {
		if (this.cachedCertificates !== null) {
			return this.cachedCertificates
		}

		const certificates = await this.loadPlatformCertificates()

		this.cachedCertificates = [...new Set([...tls.rootCertificates, ...certificates])]

		return this.cachedCertificates
	}

	clearCache(): void {
		this.cachedCertificates = null
	}

	private async loadPlatformCertificates(): Promise<string[]> {
		switch (this.platform) {
			case "linux":
				return this.getLinuxCertificates()

			case "darwin":
				return this.getMacOSCertificates()

			case "win32":
				return this.getWindowsCertificates()

			default:
				return []
		}
	}

	private async getLinuxCertificates(): Promise<string[]> {
		const paths = ["/etc/ssl/certs/ca-certificates.crt", "/etc/pki/tls/certs/ca-bundle.crt"]

		for (const path of paths) {
			try {
				const content = await fs.readFile(path, "utf8")
				return this.splitPemCertificates(content)
			} catch {
				// continue with next path
			}
		}

		return []
	}

	private async getMacOSCertificates(): Promise<string[]> {
		try {
			const result = await this.commandExecutor.run({
				executable: "security",
				args: ["find-certificate", "-a", "-p", "/Library/Keychains/System.keychain"],
			})

			if (result.exitCode !== 0) {
				return []
			}

			return this.splitPemCertificates(result.stdout)
		} catch {
			return []
		}
	}

	private async getWindowsCertificates(): Promise<string[]> {
		try {
			const result = await this.commandExecutor.run({
				executable: "powershell.exe",
				args: [
					"-NoProfile",
					"-NonInteractive",
					"-Command",
					"Get-ChildItem Cert:\\LocalMachine\\Root | ForEach-Object { [Convert]::ToBase64String($_.RawData) }",
				],
			})

			if (result.exitCode !== 0) {
				return []
			}

			return result.stdout
				.split(/\r?\n/)
				.filter(Boolean)
				.map((base64) => {
					const formatted = base64.match(/.{1,64}/g)?.join("\n") ?? ""

					return ["-----BEGIN CERTIFICATE-----", formatted, "-----END CERTIFICATE-----"].join("\n")
				})
		} catch {
			return []
		}
	}

	private splitPemCertificates(content: string): string[] {
		return content.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g) ?? []
	}
}
