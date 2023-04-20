import path from "node:path"

export function getResourcePath(resource: string): string {
	if (env.dist) {
		return path.join((process as any).resourcesPath, resource)
	} else {
		return path.join(process.cwd(), "build/desktop/resources", resource)
	}
}
