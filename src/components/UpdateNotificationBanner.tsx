interface UpdateNotificationBannerProps {
    latestVersion: string
    releaseUrl: string
    onDismiss: () => void
}

export function UpdateNotificationBanner({ latestVersion, releaseUrl, onDismiss }: UpdateNotificationBannerProps) {
    const handleDownload = () => {
        window.electronAPI.openExternalLink(releaseUrl)
    }

    return (
        <div className="bg-purple-900/40 border border-purple-600 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-purple-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <p className="text-white text-sm">
                    新しいバージョン ({latestVersion}) が利用可能です
                </p>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={handleDownload}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 h-9 rounded shadow transition-colors text-sm"
                >
                    ダウンロードページを開く
                </button>
                <button
                    onClick={onDismiss}
                    className="text-gray-400 hover:text-gray-200 h-9 w-9 flex items-center justify-center"
                    title="閉じる"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    )
}
