import { PhotoUploadZone } from './PhotoUploadZone'

interface AddPhotoModalProps {
    isOpen: boolean
    onClose: () => void
    onPhotoAdded: () => void
}

export function AddPhotoModal({ isOpen, onClose, onPhotoAdded }: AddPhotoModalProps) {
    if (!isOpen) return null

    const handlePhotoUploaded = () => {
        onPhotoAdded()
        // 成功メッセージを見せるために自動では閉じない
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-2xl text-white">
                <h2 className="text-xl font-bold mb-4">写真を追加</h2>

                <div className="mb-4 p-3 bg-blue-900 bg-opacity-30 border border-blue-600 rounded">
                    <p className="text-sm text-blue-200">
                        💡 写真のメタデータからワールド情報を自動的に取得してワールドに紐付けます
                    </p>
                </div>

                <PhotoUploadZone onPhotoUploaded={handlePhotoUploaded} />

                <div className="flex justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 hover:bg-gray-700 rounded"
                    >
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    )
}
