"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const WorldList_1 = require("./components/WorldList");
const AddWorldModal_1 = require("./components/AddWorldModal");
function App() {
    const [isModalOpen, setIsModalOpen] = (0, react_1.useState)(false);
    const [refreshTrigger, setRefreshTrigger] = (0, react_1.useState)(0);
    const handleWorldAdded = () => {
        setRefreshTrigger(prev => prev + 1);
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "min-h-screen bg-gray-900 text-white", children: [(0, jsx_runtime_1.jsxs)("header", { className: "bg-gray-800 p-4 shadow-md flex justify-between items-center sticky top-0 z-10", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-xl font-bold text-purple-400", children: "VRChat World Manager" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setIsModalOpen(true), className: "bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-medium transition-colors", children: "+ Add World" })] }), (0, jsx_runtime_1.jsx)("main", { className: "container mx-auto py-6", children: (0, jsx_runtime_1.jsx)(WorldList_1.WorldList, { refreshTrigger: refreshTrigger }) }), (0, jsx_runtime_1.jsx)(AddWorldModal_1.AddWorldModal, { isOpen: isModalOpen, onClose: () => setIsModalOpen(false), onWorldAdded: handleWorldAdded })] }));
}
exports.default = App;
