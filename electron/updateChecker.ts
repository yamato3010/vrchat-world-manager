import axios from 'axios'

const REPO = 'yamato3010/vrchat-world-manager'

export interface UpdateCheckResult {
    available: boolean
    latestVersion?: string
    releaseUrl?: string
}

function parseVersion(version: string): [number, number, number] {
    const [major, minor, patch] = version.replace(/^v/, '').split('.').map(Number)
    return [major || 0, minor || 0, patch || 0]
}

export function isNewerVersion(latest: string, current: string): boolean {
    const [lMajor, lMinor, lPatch] = parseVersion(latest)
    const [cMajor, cMinor, cPatch] = parseVersion(current)

    if (lMajor !== cMajor) return lMajor > cMajor
    if (lMinor !== cMinor) return lMinor > cMinor
    return lPatch > cPatch
}

export async function checkForAppUpdate(currentVersion: string): Promise<UpdateCheckResult> {
    try {
        const response = await axios.get(`https://api.github.com/repos/${REPO}/releases/latest`)
        const latestVersion = response.data.tag_name as string
        const releaseUrl = response.data.html_url as string

        if (isNewerVersion(latestVersion, currentVersion)) {
            return { available: true, latestVersion, releaseUrl }
        }
        return { available: false }
    } catch (error) {
        console.error('Failed to check for updates:', error)
        return { available: false }
    }
}
