import { CommandExecutor } from "./CommandExecutor"
import { promises as fs } from "node:fs"
import os from "node:os"
import tls from "node:tls"

export class CertificateProvider {
	private cachedCertificates: string[] | null = null
	private cachePromise: Promise<string[]> | null = null
	private readonly platform = os.platform()

	constructor(private readonly commandExecutor: CommandExecutor) {}

	async getCertificates(): Promise<string[]> {
		if (this.cachedCertificates !== null) {
			return this.cachedCertificates
		}

		if (!this.cachePromise) {
			this.cachePromise = this.loadAndCacheCertificates()
		}

		return this.cachePromise
	}

	clearCache(): void {
		this.cachedCertificates = null
		this.cachePromise = null
	}

	private async loadAndCacheCertificates(): Promise<string[]> {
		try {
			const certificates = await this.loadPlatformCertificates()
			this.cachedCertificates = [...new Set([...tls.rootCertificates, ...certificates])]
			return this.cachedCertificates
		} catch (error) {
			console.warn("Failed to load platform certificates, using Node.js defaults:", error)
			this.cachedCertificates = [...tls.rootCertificates]
			return this.cachedCertificates
		}
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
				console.warn(`Unsupported platform: ${this.platform}`)
				return []
		}
	}

	private async getLinuxCertificates(): Promise<string[]> {
		const filePaths = [
			"/etc/ssl/certs/ca-certificates.crt", // Debian/Ubuntu/Gentoo
			"/etc/pki/tls/certs/ca-bundle.crt", // RHEL 6/CentOS 6
			"/etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem", // RHEL 7+/Fedora
			"/etc/ssl/cert.pem", // Alpine/OpenBSD-style
		]

		for (const path of filePaths) {
			try {
				const content = await fs.readFile(path, "utf8")
				return this.splitPemCertificates(content)
			} catch (error) {
				// Ignore errors, try the next file
			}
		}

		return []
	}

	private async getMacOSCertificates(): Promise<string[]> {
		const keychains = [
			"/System/Library/Keychains/SystemRootCertificates.keychain", // System roots
			"/Library/Keychains/System.keychain", // Admin-installed
		]

		const allCerts: string[] = []

		for (const keychain of keychains) {
			try {
				const result = await this.commandExecutor.run({
					executable: "security",
					args: ["find-certificate", "-a", "-p", keychain],
				})

				if (result.exitCode === 0 && result.stdout) {
					allCerts.push(...this.splitPemCertificates(result.stdout))
				}
			} catch (error) {
				console.warn(`Failed to read macOS keychain ${keychain}:`, error)
			}
		}

		return allCerts
	}

	private async getWindowsCertificates(): Promise<string[]> {
		const stores = ["Cert:\\LocalMachine\\Root", "Cert:\\CurrentUser\\Root"]

		const allCerts: string[] = []

		for (const store of stores) {
			try {
				const result = await this.commandExecutor.run({
					executable: "powershell.exe",
					args: [
						"-NoProfile",
						"-NonInteractive",
						"-OutputFormat",
						"Text",
						"-Command",
						`Get-ChildItem '${store}' | ForEach-Object { 
							'-----BEGIN CERTIFICATE-----'
							[System.Convert]::ToBase64String($_.RawData, 'InsertLineBreaks')
							'-----END CERTIFICATE-----'
						}`,
					],
				})

				if (result.exitCode === 0 && result.stdout) {
					allCerts.push(...this.splitPemCertificates(result.stdout))
				}
			} catch (error) {
				console.warn(`Failed to read Windows certificate store ${store}:`, error)
			}
		}

		return allCerts
	}

	private splitPemCertificates(content: string): string[] {
		const matches = content.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g)
		if (!matches) return []

		return matches
			.map((cert) => cert.replace(/\r\n/g, "\n").trim())
			.filter((cert) => {
				const body = cert.replace("-----BEGIN CERTIFICATE-----", "").replace("-----END CERTIFICATE-----", "").replace(/\s/g, "")
				return body.length > 0
			})
	}
}
