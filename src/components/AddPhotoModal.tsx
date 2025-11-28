import { useState } from 'react'
import { PhotoUploadZone } from './PhotoUploadZone'
import { WorldAddedModal } from './WorldAddedModal'

interface AddPhotoModalProps {
    isOpen: boolean
    onClose: () => void
    onPhotoAdded: () => void
}

export function AddPhotoModal({ isOpen, onClose, onPhotoAdded }: AddPhotoModalProps) {
    const [addedWorld, setAddedWorld] = useState<any>(null)
    const [showSuccessModal, setShowSuccessModal] = useState(false)

    const handlePhotoUploaded = (world: any) => {
        onPhotoAdded()
        setAddedWorld(world)
        setShowSuccessModal(true)
        onClose() // アップロードモーダルを閉じる
    }

    const handleCloseSuccessModal = () => {
        setShowSuccessModal(false)
        setAddedWorld(null)
    }

    return (
        <>
            {isOpen && (
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
            )}

            <WorldAddedModal
                isOpen={showSuccessModal}
                onClose={handleCloseSuccessModal}
                world={addedWorld}
            />
        </>
    )
}
