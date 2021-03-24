//@flow
import path from "path"

export function getResourcePath(resource: string): string {
	if (env.dist) {
		return path.join((process: any).resourcesPath, resource)
	} else {
		return path.join(process.cwd(), "build/desktop/resources", resource)
	}
}