import type { CSSProperties, ReactNode } from "react";

type AlertTone = "info" | "success" | "warning" | "danger";

// Full-strength tone color (border + title) and the % used to tint the bg.
const toneStyle: Record<AlertTone, { color: string; bgMix: number }> = {
    info: { color: "var(--accent)", bgMix: 12 }, // periwinkle
    success: { color: "var(--mint)", bgMix: 12 },
    warning: { color: "var(--amber)", bgMix: 14 },
    danger: { color: "#e0685f", bgMix: 14 },
};

export function Alert({
    tone = "info",
    title,
    children,
}: {
    tone?: AlertTone;
    title?: string;
    children: ReactNode;
}) {
    const { color, bgMix } = toneStyle[tone];
    const style: CSSProperties = {
        background: `color-mix(in srgb, ${color} ${bgMix}%, var(--surface))`,
        borderColor: color,
    };

    return (
        <div
            className="rounded-lg border border-l-4 p-4"
            style={style}
            role="note"
        >
            {title ? (
                <p
                    className="mb-1 text-sm font-semibold"
                    style={{ color }}
                >
                    {title}
                </p>
            ) : null}
            <div className="text-sm leading-relaxed text-[var(--muted)]">
                {children}
            </div>
        </div>
    );
}

// Vertical stack of alerts with consistent spacing.
export function AlertStack({ children }: { children: ReactNode }) {
    return <div className="flex flex-col gap-4">{children}</div>;
}
