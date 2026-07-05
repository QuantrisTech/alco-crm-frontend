// components/GuideContentRenderer.tsx
export default function GuideContentRenderer({ blocks }: { blocks: any[] }) {
  return (
    <div className="space-y-3 text-sm text-gray-700">
      {blocks.map((block, i) => {
        if (block.type === "h2") return <h2 key={i} className="text-lg font-bold">{block.text}</h2>;
        if (block.type === "h3") return <h3 key={i} className="text-base font-semibold">{block.text}</h3>;
        if (block.type === "quote")
          return <blockquote key={i} className="italic border-l-4 border-yellow-400 pl-3 text-gray-500">{block.text}</blockquote>;
        if (block.type === "ul")
          return <ul key={i} className="list-disc pl-5">{block.items?.map((it: any, j: number) => <li key={j}>{it.text}</li>)}</ul>;
        if (block.type === "ol")
          return <ol key={i} className="list-decimal pl-5">{block.items?.map((it: any, j: number) => <li key={j}>{it.text}</li>)}</ol>;
        return <p key={i}>{block.text}</p>;
      })}
    </div>
  );
}