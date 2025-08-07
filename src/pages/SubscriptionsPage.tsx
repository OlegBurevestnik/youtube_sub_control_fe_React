import React, {useEffect, useState} from "react";
import type {SubscriptionItem} from "../types/Subscription";
import {SubscriptionCard} from "../components/SubscriptionCard";

export const SubscriptionsPage: React.FC = () => {
    const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("");
    const [page, setPage] = useState(1);
    const itemsPerPage = 25;

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetch(`/api/subscriptions?query=${encodeURIComponent(filter)}&page=${page}&limit=${itemsPerPage}`)
                .then(res => res.json())
                .then(data => {
                    const items = data.items.map((item: any) => ({
                        id: item.id,
                        title: item.snippet.title,
                        channelTitle: item.snippet.channelTitle,
                        thumbnailUrl: item.snippet.thumbnails.default?.url || "",
                    }));
                    setSubscriptions(items);
                    setTotal(data.totalResults || 0); // <- сохраняем общее количество
                });
        }, 300);

        return () => clearTimeout(timeout);
    }, [filter, page]);


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

    const filteredSubscriptions = subscriptions.filter((sub) =>
        (sub.title || "").toLowerCase().includes(filter.toLowerCase()) ||
        (sub.channelTitle || "").toLowerCase().includes(filter.toLowerCase())
    );

    const handleSelectAllFiltered = () => {
        const newSet = new Set(selectedIds);
        filteredSubscriptions.forEach(sub => newSet.add(sub.id));
        setSelectedIds(newSet);
    };

    const handleDeselectAllFiltered = () => {
        const newSet = new Set(selectedIds);
        filteredSubscriptions.forEach(sub => newSet.delete(sub.id));
        setSelectedIds(newSet);
    };


    return (
        <div style={{maxWidth: 600, margin: "0 auto", padding: "20px"}}>
            <h2>Мои подписки на YouTube</h2>
            <h3>Всего подписок: {total}</h3>

            <input
                type="text"
                placeholder="Фильтр по названию канала"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{
                    width: "100%",
                    marginBottom: "16px",
                    padding: "8px",
                    fontSize: "16px"
                }}
            />

            <p>
                Отображаются {subscriptions.length} из {total} подписок
            </p>

            <button onClick={() => setPage(page - 1)} disabled={page === 1}>
                Назад
            </button>
            <button onClick={() => setPage(page + 1)} disabled={page * itemsPerPage >= total}>
                Вперёд
            </button>
            <span>Страница {page}</span>

            <button
                onClick={handleSelectAllFiltered}
                disabled={filteredSubscriptions.length === 0}
                style={{
                    marginBottom: "16px",
                    marginLeft: "8px",
                    padding: "8px"
                }}
            >
                Выбрать все отображаемые
            </button>

            <button
                onClick={handleDeselectAllFiltered}
                disabled={filteredSubscriptions.length === 0}
                style={{
                    marginBottom: "16px",
                    marginLeft: "8px",
                    padding: "8px"
                }}
            >
                Снять выделение
            </button>

            {selectedIds.size > 0 && (
                <button onClick={handleUnsubscribe} disabled={loading}>
                    {loading ? "Удаление..." : `Удалить выбранные (${selectedIds.size})`}
                </button>
            )}
            {filteredSubscriptions.map((item) => (
                <SubscriptionCard
                    key={item.id}
                    item={item}
                    checked={selectedIds.has(item.id)}
                    onChange={handleCheck}
                />
            ))}
        </div>
    );
};


