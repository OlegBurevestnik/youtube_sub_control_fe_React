import React from "react";
import type { SubscriptionItem } from "../types/Subscription";

interface Props {
    item: SubscriptionItem;
    checked: boolean;
    onChange: (id: string, checked: boolean) => void;
}

export const SubscriptionCard: React.FC<Props> = ({ item, checked, onChange }) => {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                border: "1px solid #ccc",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "4px",
            }}
        >
            {/* Чекбокс — отдельно, не кликает ссылку */}
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(item.id, e.target.checked)}
                style={{ marginRight: "10px" }}
                aria-label={`Выбрать канал ${item.channelTitle || item.title}`}
            />

            {/* Ссылка на канал: картинка + текст */}
            <a
                href={item.channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", textDecoration: "none", color: "inherit" }}
                title={item.channelTitle || item.title}
            >
                <img
                    src={item.thumbnailUrl}
                    alt={item.channelTitle || item.title || "Channel thumbnail"}
                    style={{ width: 80, height: 80, marginRight: 10, objectFit: "cover", borderRadius: 4 }}
                />
                <div>
                    <strong style={{ display: "block", lineHeight: 1.2 }}>{item.title}</strong>
                    <div style={{ opacity: 0.8 }}>{item.channelTitle}</div>
                </div>
            </a>
        </div>
    );
};
