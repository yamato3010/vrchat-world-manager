"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddWorldModal = AddWorldModal;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
function AddWorldModal({ isOpen, onClose, onWorldAdded }) {
    const [vrchatUrlOrId, setVrchatUrlOrId] = (0, react_1.useState)('');
    const [manualData, setManualData] = (0, react_1.useState)({
        name: '',
        authorName: '',
        description: '',
        thumbnailUrl: '',
        userMemo: '',
        tags: '',
    });
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    if (!isOpen)
        return null;
    const handleFetch = async () => {
        setLoading(true);
        setError('');
        try {
            // Extract ID from URL if needed (simple regex)
            let worldId = vrchatUrlOrId;
            const match = vrchatUrlOrId.match(/(wrld_[a-f0-9-]+)/);
            if (match) {
                worldId = match[1];
            }
            if (!worldId.startsWith('wrld_')) {
                throw new Error('Invalid World ID format');
            }
            const data = await window.electronAPI.fetchVRChatWorld(worldId);
            setManualData({
                ...manualData,
                name: data.name,
                authorName: data.authorName,
                description: data.description,
                thumbnailUrl: data.thumbnailImageUrl,
            });
        }
        catch (err) {
            setError('Failed to fetch world: ' + err.message);
        }
        finally {
            setLoading(false);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await window.electronAPI.createWorld({
                vrchatWorldId: vrchatUrlOrId.match(/(wrld_[a-f0-9-]+)/)?.[1] || undefined,
                ...manualData,
            });
            onWorldAdded();
            onClose();
            // Reset form
            setVrchatUrlOrId('');
            setManualData({
                name: '',
                authorName: '',
                description: '',
                thumbnailUrl: '',
                userMemo: '',
                tags: '',
            });
        }
        catch (err) {
            setError('Failed to save world: ' + err.message);
        }
        finally {
            setLoading(false);
        }
    };
    return ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-gray-800 p-6 rounded-lg w-full max-w-2xl text-white", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-bold mb-4", children: "Add World" }), (0, jsx_runtime_1.jsxs)("div", { className: "mb-6", children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium mb-1", children: "VRChat URL or ID (Optional)" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2", children: [(0, jsx_runtime_1.jsx)("input", { type: "text", className: "flex-1 bg-gray-700 rounded px-3 py-2", value: vrchatUrlOrId, onChange: (e) => setVrchatUrlOrId(e.target.value), placeholder: "https://vrchat.com/home/world/wrld_..." }), (0, jsx_runtime_1.jsx)("button", { onClick: handleFetch, disabled: loading || !vrchatUrlOrId, className: "bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded disabled:opacity-50", children: "Fetch" })] })] }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium mb-1", children: "World Name *" }), (0, jsx_runtime_1.jsx)("input", { required: true, type: "text", className: "w-full bg-gray-700 rounded px-3 py-2", value: manualData.name, onChange: (e) => setManualData({ ...manualData, name: e.target.value }) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium mb-1", children: "Author" }), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "w-full bg-gray-700 rounded px-3 py-2", value: manualData.authorName, onChange: (e) => setManualData({ ...manualData, authorName: e.target.value }) })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium mb-1", children: "Description" }), (0, jsx_runtime_1.jsx)("textarea", { className: "w-full bg-gray-700 rounded px-3 py-2 h-20", value: manualData.description, onChange: (e) => setManualData({ ...manualData, description: e.target.value }) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium mb-1", children: "Thumbnail URL" }), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "w-full bg-gray-700 rounded px-3 py-2", value: manualData.thumbnailUrl, onChange: (e) => setManualData({ ...manualData, thumbnailUrl: e.target.value }) })] }), manualData.thumbnailUrl && ((0, jsx_runtime_1.jsx)("img", { src: manualData.thumbnailUrl, alt: "Preview", className: "h-32 object-cover rounded" })), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium mb-1", children: "My Memo" }), (0, jsx_runtime_1.jsx)("textarea", { className: "w-full bg-gray-700 rounded px-3 py-2", value: manualData.userMemo, onChange: (e) => setManualData({ ...manualData, userMemo: e.target.value }) })] }), error && (0, jsx_runtime_1.jsx)("p", { className: "text-red-500 text-sm", children: error }), (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-end gap-2 mt-6", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: onClose, className: "px-4 py-2 hover:bg-gray-700 rounded", children: "Cancel" }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: loading, className: "bg-green-600 hover:bg-green-700 px-4 py-2 rounded disabled:opacity-50", children: loading ? 'Saving...' : 'Save World' })] })] })] }) }));
}
