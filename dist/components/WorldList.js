"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorldList = WorldList;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
function WorldList({ refreshTrigger, onWorldClick }) {
    const [worlds, setWorlds] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        loadWorlds();
    }, [refreshTrigger]);
    const loadWorlds = async () => {
        setLoading(true);
        try {
            const data = await window.electronAPI.getWorlds();
            setWorlds(data);
        }
        catch (error) {
            console.error('Failed to load worlds:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this world?')) {
            await window.electronAPI.deleteWorld(id);
            loadWorlds();
        }
    };
    if (loading)
        return (0, jsx_runtime_1.jsx)("div", { className: "text-center p-4", children: "Loading worlds..." });
    return ((0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4", children: [worlds.map((world) => ((0, jsx_runtime_1.jsxs)("div", { className: "bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700 cursor-pointer hover:border-purple-500 transition-colors", children: [(0, jsx_runtime_1.jsxs)("div", { className: "h-48 bg-gray-700 relative group", onClick: () => onWorldClick(world.id), children: [world.thumbnailUrl ? ((0, jsx_runtime_1.jsx)("img", { src: world.thumbnailUrl, alt: world.name, className: "w-full h-full object-cover" })) : ((0, jsx_runtime_1.jsx)("div", { className: "w-full h-full flex items-center justify-center text-gray-500", children: "No Image" })), (0, jsx_runtime_1.jsx)("div", { className: "absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100", children: (0, jsx_runtime_1.jsx)("button", { onClick: (e) => {
                                        e.stopPropagation();
                                        handleDelete(world.id);
                                    }, className: "bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700", children: "Delete" }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-4", onClick: () => onWorldClick(world.id), children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-bold text-lg truncate", title: world.name, children: world.name }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-400 truncate", children: world.authorName }), world.userMemo && ((0, jsx_runtime_1.jsxs)("div", { className: "mt-2 text-sm bg-gray-700 p-2 rounded", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-yellow-500 text-xs font-bold", children: "MEMO:" }), " ", world.userMemo] }))] })] }, world.id))), worlds.length === 0 && ((0, jsx_runtime_1.jsx)("div", { className: "col-span-full text-center text-gray-500 py-10", children: "No worlds added yet. Click \"Add World\" to get started." }))] }));
}
