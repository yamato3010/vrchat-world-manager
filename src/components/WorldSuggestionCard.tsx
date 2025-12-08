import { WorldSuggestion } from '../types'

interface WorldSuggestionCardProps {
    suggestion: WorldSuggestion
    onAccept: (suggestion: WorldSuggestion) => void
    onDismiss: (suggestion: WorldSuggestion) => void
}

export function WorldSuggestionCard({ suggestion, onAccept, onDismiss }: WorldSuggestionCardProps) {
    return (
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700 hover:border-purple-500 transition-colors">
            <div className="relative">
                {suggestion.worldThumbnail ? (
                    <img
                        src={suggestion.worldThumbnail}
                        alt={suggestion.worldName || 'World'}
                        className="w-full h-48 object-cover"
                    />
                ) : (
                    <div className="w-full h-48 bg-gray-700 flex items-center justify-center">
                        <svg className="w-16 h-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}
                <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                    おすすめ
                </div>
            </div>

            <div className="p-4">
                <h3 className="text-white font-semibold text-lg mb-1 truncate">
                    {suggestion.worldName || 'Unknown World'}
                </h3>
                {suggestion.worldAuthor && (
                    <p className="text-gray-400 text-sm mb-3 truncate">
                        by {suggestion.worldAuthor}
                    </p>
                )}
                <p className="text-gray-500 text-xs mb-4">
                    写真: {suggestion.photoFileName}
                </p>

                <div className="flex gap-2">
                    <button
                        onClick={() => onDismiss(suggestion)}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm transition-colors"
                    >
                        無視
                    </button>
                    <button
                        onClick={() => onAccept(suggestion)}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm transition-colors"
                    >
                        追加
                    </button>
                </div>
            </div>
        </div>
    )
}
