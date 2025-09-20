import React, {useEffect, useState} from "react";
import type {SubscriptionItem} from "../types/Subscription";
import {SubscriptionCard} from "../components/SubscriptionCard";

type SubscriptionWithCount = SubscriptionItem & {
    totalItemCount?: number | null;
};

export const SubscriptionsPage: React.FC = () => {
    const [subscriptions, setSubscriptions] = useState<SubscriptionWithCount[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);

    const [draftFilter, setDraftFilter] = useState("");
    const [appliedFilter, setAppliedFilter] = useState("");

    const [page, setPage] = useState(1);
    const itemsPerPage = 25;

    // 🔹 ключ, который форсит перезагрузку при изменении
    const [refreshKey, setRefreshKey] = useState(0);

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

                const items: SubscriptionWithCount[] = (data.items ?? []).map((item: any) => {
                    const channelId = item?.snippet?.resourceId?.channelId ?? "";
                    const totalItemCount = item?.contentDetails?.totalItemCount ?? null;
                    return {
                        id: item.id,
                        title: item?.snippet?.title ?? "",
                        channelTitle: item?.snippet?.channelTitle ?? "",
                        thumbnailUrl: item?.snippet?.thumbnails?.default?.url ?? "",
                        channelId,
                        channelUrl: channelId ? `https://www.youtube.com/channel/${channelId}` : "",
                        totalItemCount,
                    };
                });

                setSubscriptions(items);
                setTotal(data.totalResults ?? data?.pageInfo?.totalResults ?? 0);
            } catch (e) {
                if ((e as any).name !== "AbortError") console.error(e);
            } finally {
                setLoading(false);
            }
        })();
        return () => ac.abort();
    }, [appliedFilter, page, itemsPerPage, refreshKey]); // ← добавили refreshKey

    const applyFilter = () => {
        setPage(1);
        setAppliedFilter(draftFilter.trim());
        setSelectedIds(new Set());
    };

    const clearFilter = () => {
        setDraftFilter("");
        setAppliedFilter("");
        setPage(1);
        setSelectedIds(new Set());
    };

    const handleCheck = (id: string, isChecked: boolean) => {
        setSelectedIds(prev => {
            const s = new Set(prev);
            isChecked ? s.add(id) : s.delete(id);
            return s;
        });
    };

    // 🔄 Принудительно обновить кэш на сервере и перезагрузить текущую страницу
    const forceRefresh = async () => {
        try {
            setLoading(true);
            const resp = await fetch("/api/subscriptions/refresh", {
                method: "POST",
                credentials: "include",
            });
            if (!resp.ok && resp.status !== 204) {
                console.error("Failed to refresh cache", resp.status);
            }
        } catch (e) {
            console.error(e);
        } finally {
            // триггерим перезагрузку данных
            setRefreshKey(k => k + 1);
            setLoading(false);
        }
    };

    const handleUnsubscribe = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/unsubscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: Array.from(selectedIds) }),
                credentials: "include",
            });
            if (res.ok) {
                setSubscriptions(prev => prev.filter(s => !selectedIds.has(s.id)));
                setSelectedIds(new Set());
                // необязательно: подтянем свежий список после отписки
                setRefreshKey(k => k + 1);
            } else {
                alert("Ошибка при удалении подписок");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAllVisible = () => {
        const s = new Set(selectedIds);
        subscriptions.forEach(sub => s.add(sub.id));
        setSelectedIds(s);
    };
    const handleDeselectAllVisible = () => {
        const s = new Set(selectedIds);
        subscriptions.forEach(sub => s.delete(sub.id));
        setSelectedIds(s);
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

                {/* ⚡ Кнопка принудительного обновления кэша */}
                <button onClick={forceRefresh} disabled={loading} title="Сбросить кэш и перечитать подписки">
                    Обновить кэш
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
                    <button onClick={handleSelectAllVisible} disabled={subscriptions.length === 0 || loading}>
                        Выбрать все отображаемые
                    </button>
                    <button onClick={handleDeselectAllVisible} disabled={subscriptions.length === 0 || loading}>
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
                    <div key={item.id} style={{ marginBottom: 8 }}>
                        <SubscriptionCard
                            item={item}
                            checked={selectedIds.has(item.id)}
                            onChange={handleCheck}
                        />
                        <div style={{ fontSize: 12, color: "#666", margin: "4px 0 0 34px" }}>
                            {typeof item.totalItemCount === "number"
                                ? `Всего элементов (по данным подписки): ${item.totalItemCount}`
                                : "Всего элементов: —"}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};
