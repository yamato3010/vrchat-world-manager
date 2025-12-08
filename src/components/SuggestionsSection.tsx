import { WorldSuggestion } from '../types'
import { WorldSuggestionCard } from './WorldSuggestionCard'

interface SuggestionsSectionProps {
    suggestions: WorldSuggestion[]
    onAccept: (suggestion: WorldSuggestion) => void
    onDismiss: (suggestion: WorldSuggestion) => void
}

export function SuggestionsSection({ suggestions, onAccept, onDismiss }: SuggestionsSectionProps) {
    if (suggestions.length === 0) {
        return null
    }

    return (
        <div className="mb-8 p-4">
            <div className="flex items-center gap-2 mb-4">
                <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <h2 className="text-2xl font-bold text-white">おすすめワールド</h2>
                <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded">
                    {suggestions.length}件
                </span>
            </div>

            <p className="text-gray-400 text-sm mb-4">
                最近VRChatで撮影した写真から、まだ登録されていないワールドを検出しました
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {suggestions.map((suggestion) => (
                    <WorldSuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        onAccept={onAccept}
                        onDismiss={onDismiss}
                    />
                ))}
            </div>
        </div>
    )
}
