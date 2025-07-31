import React, {useEffect, useState} from "react";
import type {SubscriptionItem} from "../types/Subscription";
import {SubscriptionCard} from "../components/SubscriptionCard";

export const SubscriptionsPage: React.FC = () => {
    const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch("/api/subscriptions") // backend должен проксироваться через Vite
            .then((res) => res.json())
            .then((data) => {
                const items = data.items.map((item: any) => ({
                    id: item.id,
                    title: item.snippet.title,
                    channelTitle: item.snippet.channelTitle,
                    thumbnailUrl: item.snippet.thumbnails.default?.url || "",
                }));
                setSubscriptions(items);
            });
    }, []);

    const handleCheck = (id: string, isChecked: boolean) => {
        setSelectedIds((prev) => {
            const newSet = new Set(prev);
            isChecked ? newSet.add(id) : newSet.delete(id);
            return newSet;
        });
    };

    const handleUnsubscribe = async () => {
        setLoading(true);
        const res = await fetch("/api/unsubscribe", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ids: Array.from(selectedIds)}),
        });

        if (res.ok) {
            // удалить из списка
            setSubscriptions((prev) =>
                prev.filter((s) => !selectedIds.has(s.id))
            );
            setSelectedIds(new Set());
        } else {
            alert("Ошибка при удалении подписок");
        }

        setLoading(false);
    };

    return (
        <div style={{maxWidth: 600, margin: "0 auto", padding: "20px"}}>
            <h2>Мои подписки на YouTube</h2>
            {subscriptions.map((item) => (
                <SubscriptionCard
                    key={item.id}
                    item={item}
                    checked={selectedIds.has(item.id)}
                    onChange={handleCheck}
                />
            ))}

            {selectedIds.size > 0 && (
                <button onClick={handleUnsubscribe} disabled={loading}>
                    {loading ? "Удаление..." : `Удалить выбранные (${selectedIds.size})`}
                </button>
            )}
        </div>
    );
};
