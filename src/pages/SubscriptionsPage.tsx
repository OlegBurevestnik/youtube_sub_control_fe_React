import React, {useEffect, useState} from "react";
import type {SubscriptionItem} from "../types/Subscription";
import {SubscriptionCard} from "../components/SubscriptionCard";

export const SubscriptionsPage: React.FC = () => {
    const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);

    // фильтр: вводим отдельно, применяем по кнопке
    const [draftFilter, setDraftFilter] = useState("");
    const [appliedFilter, setAppliedFilter] = useState("");

    // пагинация
    const [page, setPage] = useState(1);
    const itemsPerPage = 25;

    useEffect(() => {
        const ac = new AbortController();

        (async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `/api/subscriptions?query=${encodeURIComponent(appliedFilter)}&page=${page}&limit=${itemsPerPage}`,
                    { credentials: "include", signal: ac.signal }
                );
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();

                const items = (data.items ?? []).map((item: any) => {
                    const channelId = item?.snippet?.resourceId?.channelId ?? "";
                    return {
                        id: item.id,
                        title: item?.snippet?.title ?? "",
                        channelTitle: item?.snippet?.channelTitle ?? "",
                        thumbnailUrl: item?.snippet?.thumbnails?.default?.url ?? "",
                        channelId,
                        channelUrl: channelId ? `https://www.youtube.com/channel/${channelId}` : "",
                    } as SubscriptionItem;
                });

                setSubscriptions(items);
                setTotal(data.totalResults ?? 0);
            } catch (e) {
                if ((e as any).name !== "AbortError") {
                    console.error(e);
                }
            } finally {
                setLoading(false);
            }
        })();

        return () => ac.abort();
    }, [appliedFilter, page, itemsPerPage]);

    // применяем фильтр по кнопке
    const applyFilter = () => {
        setPage(1);
        setAppliedFilter(draftFilter.trim());
        // выбранные чекбоксы лучше очистить при новом фильтре, чтобы не висели "невидимые" выделения
        setSelectedIds(new Set());
    };

    // очистка фильтра
    const clearFilter = () => {
        setDraftFilter("");
        setAppliedFilter("");
        setPage(1);
        setSelectedIds(new Set());
    };

    // отметка одного элемента
    const handleCheck = (id: string, isChecked: boolean) => {
        setSelectedIds((prev) => {
            const newSet = new Set(prev);
            isChecked ? newSet.add(id) : newSet.delete(id);
            return newSet;
        });
    };

    // массовая отписка
    const handleUnsubscribe = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/unsubscribe", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ids: Array.from(selectedIds)}),
                credentials: "include",
            });

            if (res.ok) {
                setSubscriptions((prev) => prev.filter((s) => !selectedIds.has(s.id)));
                setSelectedIds(new Set());
                // total можно уменьшить на удалённое кол-во, если хочешь:
                // setTotal(t => Math.max(0, t - deletedCount));
            } else {
                alert("Ошибка при удалении подписок");
            }
        } finally {
            setLoading(false);
        }
    };

    // выбрать все/снять все — именно видимые (текущая страница)
    const handleSelectAllVisible = () => {
        const newSet = new Set(selectedIds);
        subscriptions.forEach(sub => newSet.add(sub.id));
        setSelectedIds(newSet);
    };

    const handleDeselectAllVisible = () => {
        const newSet = new Set(selectedIds);
        subscriptions.forEach(sub => newSet.delete(sub.id));
        setSelectedIds(newSet);
    };

    const canGoPrev = page > 1;
    const canGoNext = page * itemsPerPage < total;

    return (
        <div style={{maxWidth: 720, margin: "0 auto", padding: "20px"}}>
            <h2>Мои подписки на YouTube</h2>
            <h3>Всего подписок: {total}</h3>

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                    type="text"
                    placeholder="Фильтр по названию канала"
                    value={draftFilter}
                    onChange={(e) => setDraftFilter(e.target.value)}
                    style={{ flex: 1, padding: 8 }}
                    onKeyDown={(e) => { if (e.key === "Enter") applyFilter(); }}
                    disabled={loading}
                />
                <button onClick={applyFilter} disabled={draftFilter.trim() === appliedFilter.trim() || loading}>
                    Применить
                </button>
                <button onClick={clearFilter} disabled={(!draftFilter && !appliedFilter) || loading}>
                    Сбросить
                </button>
            </div>

            <p style={{ margin: "8px 0" }}>
                Отображаются {subscriptions.length} из {total} подписок
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0 16px" }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!canGoPrev || loading}>
                    Назад
                </button>
                <button onClick={() => setPage(p => p + 1)} disabled={!canGoNext || loading}>
                    Вперёд
                </button>
                <span>Страница {page}</span>

                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    <button
                        onClick={handleSelectAllVisible}
                        disabled={subscriptions.length === 0 || loading}
                    >
                        Выбрать все отображаемые
                    </button>
                    <button
                        onClick={handleDeselectAllVisible}
                        disabled={subscriptions.length === 0 || loading}
                    >
                        Снять выделение
                    </button>
                </div>
            </div>

            {selectedIds.size > 0 && (
                <button onClick={handleUnsubscribe} disabled={loading}>
                    {loading ? "Удаление..." : `Удалить выбранные (${selectedIds.size})`}
                </button>
            )}

            {loading && subscriptions.length === 0 ? (
                <p>Загрузка…</p>
            ) : subscriptions.length === 0 ? (
                <p>Ничего не найдено</p>
            ) : (
                subscriptions.map((item) => (
                    <SubscriptionCard
                        key={item.id}
                        item={item}
                        checked={selectedIds.has(item.id)}
                        onChange={handleCheck}
                    />
                ))
            )}
        </div>
    );
};
