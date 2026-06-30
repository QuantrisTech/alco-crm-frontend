"use client";

function parseInline(text: string): React.ReactNode[] {
    const nodes: React.ReactNode[] = [];
    const regex = /(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(<u>([^<]+)<\/u>)|(\*([^*]+)\*)/g;

    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            nodes.push(text.slice(lastIndex, match.index));
        }

        if (match[1]) {
            // link — url|nofollow format check karo
            const rawUrl = match[3];
            const isNofollow = rawUrl.endsWith("|nofollow");
            const url = isNofollow ? rawUrl.replace("|nofollow", "") : rawUrl;

            nodes.push(
                <a
                    key={key++}
                    href={url}
                    target="_blank"
                    rel={isNofollow ? "nofollow noopener noreferrer" : "noopener noreferrer"}
                    className="text-yellow-600 underline hover:text-yellow-700"
                >
                    {match[2]}
                </a>
            );
        } else if (match[4]) {
            nodes.push(<strong key={key++}>{match[5]}</strong>);
        } else if (match[6]) {
            nodes.push(<u key={key++}>{match[7]}</u>);
        } else if (match[8]) {
            nodes.push(<em key={key++}>{match[9]}</em>);
        }

        lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
        nodes.push(text.slice(lastIndex));
    }

    return nodes;
}

export default function RichText({ text }: { text: string }) {
    return <>{parseInline(text || "")}</>;
}