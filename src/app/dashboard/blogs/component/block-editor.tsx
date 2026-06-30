// "use client";
// import { useState } from "react";
// import { Plus, X, GripVertical, Quote, Heading, List, AlignLeft, Minus } from "lucide-react";

// // ── Types ──
// export type BlockType = "p" | "h2" | "h3" | "quote" | "ul" | "ol";

// type ListItem = {
//     _id?: string;
//     bold?: string;
//     text: string;
// };

// export type Block = {
//     _id: string;
//     type: BlockType;
//     text?: string;
//     items?: ListItem[];
// };

// type BlockEditorProps = {
//     value: Block[];
//     onChange: (blocks: Block[]) => void;
// };

// // ── Block Type Config ──
// const blockTypes: { type: BlockType; label: string; icon: React.ReactNode; placeholder: string }[] = [
//     { type: "p", label: "Paragraph", icon: <AlignLeft size={13} />, placeholder: "Write a paragraph..." },
//     { type: "h2", label: "Heading 2", icon: <Heading size={13} />, placeholder: "Section heading..." },
//     { type: "h3", label: "Heading 3", icon: <Heading size={12} />, placeholder: "Sub heading..." },
//     { type: "quote", label: "Quote", icon: <Quote size={13} />, placeholder: "Write a quote..." },
//     { type: "ul", label: "Bullet List", icon: <List size={13} />, placeholder: "List item..." },
//     { type: "ol", label: "Numbered List", icon: <List size={13} />, placeholder: "List item..." },
// ];

// // const genId = () => Math.random().toString(36).slice(2, 9);

// // ── Single Block Renderer ──
// function BlockItem({
//     block,
//     index,
//     totalBlocks,
//     onChange,
//     onRemove,
//     onTypeChange,
//     showError,
// }: {
//     block: Block;
//     index: number;
//     totalBlocks: number;
//     onChange: (_id: string, value: string | ListItem[]) => void;
//     onRemove: (_id: string) => void;
//     onTypeChange: (_id: string, type: BlockType) => void;
//     showError: boolean;
// }) {
//     const config = blockTypes.find((b) => b.type === block.type)!;
//     const isList = block.type === "ul" || block.type === "ol";
//     // ── 1. isEmpty check (line 53) — String() wrap ──
//     const isEmpty = isList
//         ? !block.items?.some((i) => String(i ?? "").trim())  // ✅
//         : !block.text?.trim();


//     const handleListItemChange = (itemIndex: number, val: string) => {
//         const updated = (block.items || []).map(item => ({ ...item }));

//         updated[itemIndex] = {
//             ...updated[itemIndex],
//             text: val,
//         };

//         onChange(block._id, updated);
//     };

//     const addListItem = () => {
//         onChange(block._id, [
//             ...(block.items || []),
//             { text: "" }
//         ]);
//     };

//     const removeListItem = (itemIndex: number) => {
//         const updated = (block.items || []).filter((_, i) => i !== itemIndex);
//         onChange(block._id, updated.length ? updated : [{ text: "" }]);
//     };

//     // ── Block style preview ──
//     const labelStyle =
//         block.type === "h2"
//             ? "text-lg font-bold text-gray-700"
//             : block.type === "h3"
//                 ? "text-base font-semibold text-gray-700"
//                 : block.type === "quote"
//                     ? "italic text-gray-500 border-l-4 border-yellow-400 pl-3"
//                     : "text-sm text-gray-700";

//     return (
//         <div
//             className={`group relative flex gap-3 p-4 rounded-xl border transition-all ${showError && isEmpty
//                 ? "border-red-300 bg-red-50"
//                 : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
//                 }`}
//         >
//             {/* Drag Handle + Index */}
//             <div className="flex flex-col items-center gap-1 pt-0.5 flex-shrink-0">
//                 <span className="text-[10px] text-gray-300 font-mono">{index + 1}</span>
//                 <GripVertical size={14} className="text-gray-200 group-hover:text-gray-400 transition cursor-grab" />
//             </div>

//             {/* Block Content */}
//             <div className="flex-1 min-w-0">
//                 {/* Type Selector */}
//                 <div className="flex items-center gap-2 mb-2.5">
//                     {blockTypes.map((bt) => (
//                         <button
//                             key={bt.type}
//                             type="button"
//                             onClick={() => onTypeChange(block._id, bt.type)}
//                             title={bt.label}
//                             className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition ${block.type === bt.type
//                                 ? "bg-gray-900 text-white"
//                                 : "bg-gray-100 text-gray-500 hover:bg-gray-200"
//                                 }`}
//                         >
//                             {bt.icon}
//                             <span className="hidden sm:inline">{bt.label}</span>
//                         </button>
//                     ))}
//                 </div>

//                 {/* Input Area */}
//                 {isList ? (
//                     <div className="space-y-2">
//                         {(block.items || [{ text: "" }]).map((item, i) => {
//                             const itemValue = typeof item === "string" ? item : item?.text || "";
//                             return (
//                                 <div
//                                     key={item._id || `${block._id}-${i}`}
//                                 > {/* ✅ unique key */}
//                                     <span className="text-gray-300 text-xs w-4 flex-shrink-0">
//                                         {block.type === "ol" ? `${i + 1}.` : "-"}
//                                     </span>
//                                     <input
//                                         type="text"
//                                         value={itemValue}
//                                         onChange={(e) => handleListItemChange(i, e.target.value)}
//                                         placeholder={`Item ${i + 1}...`}
//                                         className="flex-1 border-b border-gray-200 focus:border-yellow-400 outline-none text-sm text-gray-800 py-1 bg-transparent transition"
//                                     />
//                                     {(block.items || []).length > 1 && (
//                                         <button type="button" onClick={() => removeListItem(i)}
//                                             className="text-gray-300 hover:text-red-400 transition flex-shrink-0">
//                                             <X size={13} />
//                                         </button>
//                                     )}
//                                 </div>
//                             );
//                         })}

//                         <button
//                             type="button"
//                             onClick={addListItem}
//                             className="flex items-center gap-1 text-xs text-gray-400 hover:text-yellow-600 transition mt-1"
//                         >
//                             <Plus size={12} /> Add item
//                         </button>
//                     </div>
//                 ) : (
//                     <textarea
//                         value={block.text || ""}
//                         onChange={(e) => onChange(block._id, e.target.value)}
//                         placeholder={config.placeholder}
//                         rows={block.type === "p" ? 3 : 1}
//                         className={`w-full outline-none resize-none bg-transparent border-b border-gray-200 focus:border-yellow-400 pb-1 transition placeholder:text-gray-300 ${labelStyle}`}
//                     />
//                 )}

//                 {/* Error hint */}
//                 {showError && isEmpty && (
//                     <p className="text-xs text-red-400 mt-1">
//                         Block is empty — fill it or remove it.
//                     </p>
//                 )}
//             </div>

//             {/* Remove Button */}
//             <button
//                 type="button"
//                 onClick={() => onRemove(block._id)}
//                 className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition opacity-0 group-hover:opacity-100 mt-0.5"
//                 title="Remove block"
//             >
//                 <X size={13} />
//             </button>
//         </div>
//     );
// }

// // ── Add Block Button ──
// function AddBlockButton({ onAdd }: { onAdd: (type: BlockType) => void }) {
//     const [open, setOpen] = useState(false);

//     return (
//         <div className="relative">
//             <button
//                 type="button"
//                 onClick={() => setOpen((v) => !v)}
//                 className="flex items-center gap-2 w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-yellow-400 hover:text-yellow-500 hover:bg-yellow-50/40 transition justify-center font-medium"
//             >
//                 <Plus size={15} />
//                 {open ? "Close Block" : "Add Block"}
//             </button>

//             <div
//                 className={`overflow-hidden transition-all duration-300 ease-in-out
//                 ${open ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"}
//                 `}
//             >
//                 <div className="bg-white border border-gray-100 rounded-2xl shadow-xl z-20 p-3 grid grid-cols-3 gap-2">
//                     {blockTypes.map((bt) => (
//                         <button
//                             key={bt.type}
//                             type="button"
//                             onClick={() => { onAdd(bt.type); setOpen(false); }}
//                             className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-yellow-50 hover:text-yellow-700 text-gray-600 transition border border-transparent hover:border-yellow-200 text-xs font-medium"
//                         >
//                             <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
//                                 {bt.icon}
//                             </span>
//                             {bt.label}
//                         </button>
//                     ))}
//                 </div>
//             </div>
//         </div>
//     );
// }

// // ── Main Export ──
// export default function BlockEditor({ value, onChange }: BlockEditorProps) {
//     const [showErrors, setShowErrors] = useState(false);

//     // const blocks: Block[] = value?.length
//     //     ? value
//     //     : [{ _id: "temp_" + Date.now(), type: "p", text: "" }];
//     const blocks: Block[] = value || [];

//     const updateBlocks = (updated: Block[]) => onChange(updated);

//     const addBlock = (type: BlockType) => {
//         const tempId = "temp_" + Date.now();

//         const newBlock: Block =
//             type === "ul" || type === "ol"
//                 ? { _id: tempId, type, items: [{ text: "" }] }
//                 : { _id: tempId, type, text: "" };

//         updateBlocks([...blocks.map(b => ({ ...b })), newBlock]); // ✅ copy old blocks
//     };
//     const removeBlock = (_id: string) => {
//         const filtered = blocks.filter((b) => b._id !== _id);
//         updateBlocks(filtered.length ? filtered : [{ _id: "temp_" + Date.now(), type: "p", text: "" }]);
//     };

//     const handleChange = (_id: string, val: string | ListItem[]) => {
//         updateBlocks(
//             blocks.map((b) => {
//                 if (b._id !== _id) return b;

//                 if (Array.isArray(val)) {
//                     return {
//                         ...b,
//                         items: val.map(item => ({ ...item })) // ✅ deep copy
//                     };
//                 }

//                 return {
//                     ...b,
//                     text: val
//                 };
//             })
//         );
//     };

//     const handleTypeChange = (_id: string, type: BlockType) => {
//         updateBlocks(
//             blocks.map((b) => {
//                 if (b._id !== _id) return b;
//                 const isList = type === "ul" || type === "ol";
//                 const wasText = b.type !== "ul" && b.type !== "ol";
//                 return isList
//                     ? { ...b, type, items: wasText && b.text ? [{ text: String(b.text) }] : [{ text: "" }], text: undefined }
//                     : { ...b, type, text: !wasText && b.items ? b.items.map(i => i.text).join(", ") : String(b.text || ""), items: undefined };

//             })
//         );
//     };

//     // ── Validate (called from parent via ref or expose) ──
//     const hasEmptyBlocks = blocks.length > 0 && blocks.some((b) => {
//         const isList = b.type === "ul" || b.type === "ol";

//         return isList
//             ? !b.items?.some((i) => String(i?.text || "").trim())
//             : !b.text?.trim();
//     });
//     return (
//         <div className="space-y-3">
//             {/* Blocks */}
//             {blocks.map((block, index) => (
//                 <BlockItem
//                     key={block?._id}
//                     block={block}
//                     index={index}
//                     totalBlocks={blocks.length}
//                     onChange={handleChange}
//                     onRemove={removeBlock}
//                     onTypeChange={handleTypeChange}
//                     showError={showErrors}
//                 />
//             ))}

//             {/* Add Block Button */}
//             <AddBlockButton onAdd={addBlock} />

//             {/* Validation Message */}
//             {showErrors && hasEmptyBlocks && (
//                 <p className="text-xs text-red-500 text-center">
//                     Fill all blocks or remove empty ones before saving.
//                 </p>
//             )}

//             {/* Hidden trigger for parent validation */}
//             <button
//                 type="button"
//                 id="block-editor-validate"
//                 className="hidden"
//                 onClick={() => setShowErrors(true)}
//             />
//         </div>
//     );
// }
"use client";
import { useState, useRef } from "react";
import { Plus, X, GripVertical, Quote, Heading, List, AlignLeft, Bold, Italic, Underline, Link as LinkIcon } from "lucide-react";
import RichText from "./RichText";

// ── Types ──
export type BlockType = "p" | "h2" | "h3" | "quote" | "ul" | "ol";

type ListItem = {
    _id?: string;
    bold?: string;
    text: string;
};

export type Block = {
    _id: string;
    type: BlockType;
    text?: string;
    items?: ListItem[];
};

type BlockEditorProps = {
    value: Block[];
    onChange: (blocks: Block[]) => void;
};

// ── Block Type Config ──
const blockTypes: { type: BlockType; label: string; icon: React.ReactNode; placeholder: string }[] = [
    { type: "p", label: "Paragraph", icon: <AlignLeft size={13} />, placeholder: "Write a paragraph..." },
    { type: "h2", label: "Heading 2", icon: <Heading size={13} />, placeholder: "Section heading..." },
    { type: "h3", label: "Heading 3", icon: <Heading size={12} />, placeholder: "Sub heading..." },
    { type: "quote", label: "Quote", icon: <Quote size={13} />, placeholder: "Write a quote..." },
    { type: "ul", label: "Bullet List", icon: <List size={13} />, placeholder: "List item..." },
    { type: "ol", label: "Numbered List", icon: <List size={13} />, placeholder: "List item..." },
];

// const genId = () => Math.random().toString(36).slice(2, 9);

// ── Single Block Renderer ──
function BlockItem({
    block,
    index,
    totalBlocks,
    onChange,
    onRemove,
    onTypeChange,
    showError,
}: {
    block: Block;
    index: number;
    totalBlocks: number;
    onChange: (_id: string, value: string | ListItem[]) => void;
    onRemove: (_id: string) => void;
    onTypeChange: (_id: string, type: BlockType) => void;
    showError: boolean;
}) {
    const config = blockTypes.find((b) => b.type === block.type)!;
    const isList = block.type === "ul" || block.type === "ol";
    // ── 1. isEmpty check (line 53) — String() wrap ──
    const isEmpty = isList
        ? !block.items?.some((i) => String(i ?? "").trim())  // ✅
        : !block.text?.trim();
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const [linkNofollow, setLinkNofollow] = useState(false);
    const [savedSelection, setSavedSelection] = useState<{ start: number; end: number } | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const openLinkModal = () => {
        const ta = textareaRef.current;
        if (!ta) return;
        setSavedSelection({ start: ta.selectionStart, end: ta.selectionEnd });
        setLinkUrl("");
        setLinkNofollow(false);
        setLinkModalOpen(true);
    };

    const insertLink = () => {
        if (!linkUrl.trim() || !savedSelection) {
            setLinkModalOpen(false);
            return;
        }
        const ta = textareaRef.current;
        const value = block.text || "";
        const { start, end } = savedSelection;
        const selected = value.slice(start, end) || "link text";

        // ✅ nofollow ko url ke sath "|nofollow" suffix se mark karte hain
        const finalUrl = linkNofollow ? `${linkUrl.trim()}|nofollow` : linkUrl.trim();
        const markdown = `[${selected}](${finalUrl})`;

        const newValue = value.slice(0, start) + markdown + value.slice(end);
        onChange(block._id, newValue);
        setLinkModalOpen(false);

        requestAnimationFrame(() => {
            ta?.focus();
        });
    };

    const wrapSelection = (before: string, after: string = before) => {
        const ta = textareaRef.current;
        if (!ta) return;

        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const value = block.text || "";
        const selected = value.slice(start, end) || "text";

        const newValue =
            value.slice(0, start) + before + selected + after + value.slice(end);

        onChange(block._id, newValue);

        // cursor selection restore (next tick)
        requestAnimationFrame(() => {
            ta.focus();
            ta.setSelectionRange(start + before.length, start + before.length + selected.length);
        });
    };

    const handleLink = () => {
        const url = prompt("Enter URL:");
        if (!url) return;
        wrapSelection("[", `](${url})`);
    };

    const handleListItemChange = (itemIndex: number, val: string) => {
        const updated = (block.items || []).map(item => ({ ...item }));

        updated[itemIndex] = {
            ...updated[itemIndex],
            text: val,
        };

        onChange(block._id, updated);
    };

    const addListItem = () => {
        onChange(block._id, [
            ...(block.items || []),
            { text: "" }
        ]);
    };

    const removeListItem = (itemIndex: number) => {
        const updated = (block.items || []).filter((_, i) => i !== itemIndex);
        onChange(block._id, updated.length ? updated : [{ text: "" }]);
    };

    // ── Block style preview ──
    const labelStyle =
        block.type === "h2"
            ? "text-lg font-bold text-gray-700"
            : block.type === "h3"
                ? "text-base font-semibold text-gray-700"
                : block.type === "quote"
                    ? "italic text-gray-500 border-l-4 border-yellow-400 pl-3"
                    : "text-sm text-gray-700";

    return (
        <>
            <div
                className={`group relative flex gap-3 p-4 rounded-xl border transition-all ${showError && isEmpty
                    ? "border-red-300 bg-red-50"
                    : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                    }`}
            >
                {/* Drag Handle + Index */}
                <div className="flex flex-col items-center gap-1 pt-0.5 flex-shrink-0">
                    <span className="text-[10px] text-gray-300 font-mono">{index + 1}</span>
                    <GripVertical size={14} className="text-gray-200 group-hover:text-gray-400 transition cursor-grab" />
                </div>

                {/* Block Content */}
                <div className="flex-1 min-w-0">
                    {/* Type Selector */}
                    <div className="flex items-center gap-2 mb-2.5">
                        {blockTypes.map((bt) => (
                            <button
                                key={bt.type}
                                type="button"
                                onClick={() => onTypeChange(block._id, bt.type)}
                                title={bt.label}
                                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition ${block.type === bt.type
                                    ? "bg-gray-900 text-white"
                                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                    }`}
                            >
                                {bt.icon}
                                <span className="hidden sm:inline">{bt.label}</span>
                            </button>
                        ))}
                    </div>
                    {!isList && block.type === "p" && (
                        <div className="flex items-center gap-1 mb-2 sticky top-0 bg-white z-10 py-1">
                            <button type="button" onClick={() => wrapSelection("**")} title="Bold"
                                className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
                                <Bold size={13} />
                            </button>
                            <button type="button" onClick={() => wrapSelection("*")} title="Italic"
                                className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
                                <Italic size={13} />
                            </button>
                            <button type="button" onClick={() => wrapSelection("<u>", "</u>")} title="Underline"
                                className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
                                <Underline size={13} />
                            </button>
                            <button type="button" onClick={openLinkModal} title="Link"
                                className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
                                <LinkIcon size={13} />
                            </button>
                        </div>
                    )}
                    {/* Input Area */}
                    {isList ? (
                        <div className="space-y-2">
                            {(block.items || [{ text: "" }]).map((item, i) => {
                                const itemValue = typeof item === "string" ? item : item?.text || "";
                                return (
                                    <div
                                        key={item._id || `${block._id}-${i}`}
                                    > {/* ✅ unique key */}
                                        <span className="text-gray-300 text-xs w-4 flex-shrink-0">
                                            {block.type === "ol" ? `${i + 1}.` : "-"}
                                        </span>
                                        <input
                                            type="text"
                                            value={itemValue}
                                            onChange={(e) => handleListItemChange(i, e.target.value)}
                                            placeholder={`Item ${i + 1}...`}
                                            className="flex-1 border-b border-gray-200 focus:border-yellow-400 outline-none text-sm text-gray-800 py-1 bg-transparent transition"
                                        />
                                        {(block.items || []).length > 1 && (
                                            <button type="button" onClick={() => removeListItem(i)}
                                                className="text-gray-300 hover:text-red-400 transition flex-shrink-0">
                                                <X size={13} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}

                            <button
                                type="button"
                                onClick={addListItem}
                                className="flex items-center gap-1 text-xs text-gray-400 hover:text-yellow-600 transition mt-1"
                            >
                                <Plus size={12} /> Add item
                            </button>
                        </div>
                    ) : (
                        <>
                            <textarea
                                ref={textareaRef}
                                value={block.text || ""}
                                onChange={(e) => onChange(block._id, e.target.value)}
                                placeholder={config.placeholder}
                                rows={block.type === "p" ? 3 : 1}
                                className={`w-full outline-none resize-none bg-transparent border-b border-gray-200 focus:border-yellow-400 pb-1 transition placeholder:text-gray-300 ${labelStyle}`}
                            />
                            {block.text && block.type === "p" && (
                                <div className="mt-1.5 px-2 py-1.5 bg-gray-50 rounded text-xs text-gray-500">
                                    <span className="text-gray-400">Preview: </span>
                                    <RichText text={block.text} />
                                </div>
                            )}
                        </>
                    )}

                    {/* Error hint */}
                    {showError && isEmpty && (
                        <p className="text-xs text-red-400 mt-1">
                            Block is empty — fill it or remove it.
                        </p>
                    )}
                </div>

                {/* Remove Button */}
                <button
                    type="button"
                    onClick={() => onRemove(block._id)}
                    className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition opacity-0 group-hover:opacity-100 mt-0.5"
                    title="Remove block"
                >
                    <X size={13} />
                </button>
            </div>
            {linkModalOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setLinkModalOpen(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
                        <h4 className="text-sm font-semibold text-gray-800 mb-3">Insert Link</h4>

                        <label className="text-xs font-medium text-gray-600 mb-1 block">URL</label>
                        <input
                            autoFocus
                            type="text"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-yellow-300 text-gray-800 mb-3"
                        />

                        <label className="flex items-center gap-2 mb-4 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={linkNofollow}
                                onChange={(e) => setLinkNofollow(e.target.checked)}
                                className="w-4 h-4 accent-yellow-400"
                            />
                            <span className="text-sm text-gray-700">Nofollow link</span>
                        </label>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setLinkModalOpen(false)}
                                className="flex-1 py-2 rounded-lg border text-sm text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={insertLink}
                                className="flex-1 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-gray-800"
                            >
                                Insert
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ── Add Block Button ──
function AddBlockButton({ onAdd }: { onAdd: (type: BlockType) => void }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-yellow-400 hover:text-yellow-500 hover:bg-yellow-50/40 transition justify-center font-medium"
            >
                <Plus size={15} />
                {open ? "Close Block" : "Add Block"}
            </button>

            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out
                ${open ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"}
                `}
            >
                <div className="bg-white border border-gray-100 rounded-2xl shadow-xl z-20 p-3 grid grid-cols-3 gap-2">
                    {blockTypes.map((bt) => (
                        <button
                            key={bt.type}
                            type="button"
                            onClick={() => { onAdd(bt.type); setOpen(false); }}
                            className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-yellow-50 hover:text-yellow-700 text-gray-600 transition border border-transparent hover:border-yellow-200 text-xs font-medium"
                        >
                            <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                {bt.icon}
                            </span>
                            {bt.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Main Export ──
export default function BlockEditor({ value, onChange }: BlockEditorProps) {
    const [showErrors, setShowErrors] = useState(false);

    // const blocks: Block[] = value?.length
    //     ? value
    //     : [{ _id: "temp_" + Date.now(), type: "p", text: "" }];
    const blocks: Block[] = value || [];

    const updateBlocks = (updated: Block[]) => onChange(updated);

    const addBlock = (type: BlockType) => {
        const tempId = "temp_" + Date.now();

        const newBlock: Block =
            type === "ul" || type === "ol"
                ? { _id: tempId, type, items: [{ text: "" }] }
                : { _id: tempId, type, text: "" };

        updateBlocks([...blocks.map(b => ({ ...b })), newBlock]); // ✅ copy old blocks
    };
    const removeBlock = (_id: string) => {
        const filtered = blocks.filter((b) => b._id !== _id);
        updateBlocks(filtered.length ? filtered : [{ _id: "temp_" + Date.now(), type: "p", text: "" }]);
    };

    const handleChange = (_id: string, val: string | ListItem[]) => {
        updateBlocks(
            blocks.map((b) => {
                if (b._id !== _id) return b;

                if (Array.isArray(val)) {
                    return {
                        ...b,
                        items: val.map(item => ({ ...item })) // ✅ deep copy
                    };
                }

                return {
                    ...b,
                    text: val
                };
            })
        );
    };

    const handleTypeChange = (_id: string, type: BlockType) => {
        updateBlocks(
            blocks.map((b) => {
                if (b._id !== _id) return b;
                const isList = type === "ul" || type === "ol";
                const wasText = b.type !== "ul" && b.type !== "ol";
                return isList
                    ? { ...b, type, items: wasText && b.text ? [{ text: String(b.text) }] : [{ text: "" }], text: undefined }
                    : { ...b, type, text: !wasText && b.items ? b.items.map(i => i.text).join(", ") : String(b.text || ""), items: undefined };

            })
        );
    };

    // ── Validate (called from parent via ref or expose) ──
    const hasEmptyBlocks = blocks.length > 0 && blocks.some((b) => {
        const isList = b.type === "ul" || b.type === "ol";

        return isList
            ? !b.items?.some((i) => String(i?.text || "").trim())
            : !b.text?.trim();
    });
    return (
        <div className="space-y-3">
            {/* Blocks */}
            {blocks.map((block, index) => (
                <BlockItem
                    key={block?._id}
                    block={block}
                    index={index}
                    totalBlocks={blocks.length}
                    onChange={handleChange}
                    onRemove={removeBlock}
                    onTypeChange={handleTypeChange}
                    showError={showErrors}
                />
            ))}

            {/* Add Block Button */}
            <AddBlockButton onAdd={addBlock} />

            {/* Validation Message */}
            {showErrors && hasEmptyBlocks && (
                <p className="text-xs text-red-500 text-center">
                    Fill all blocks or remove empty ones before saving.
                </p>
            )}

            {/* Hidden trigger for parent validation */}
            <button
                type="button"
                id="block-editor-validate"
                className="hidden"
                onClick={() => setShowErrors(true)}
            />
        </div>
    );
}
