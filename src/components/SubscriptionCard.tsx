import React from "react";
import type {SubscriptionItem} from "../types/Subscription";

interface Props {
    item: SubscriptionItem;
    checked: boolean;
    onChange: (id: string, checked: boolean) => void;
}

export const SubscriptionCard: React.FC<Props> = ({item, checked, onChange}) => {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', border: '1px solid #ccc',
            padding: '10px', marginBottom: '10px', borderRadius: '4px'
        }}>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(item.id, e.target.checked)}
                style={{marginRight: '10px'}}
            />
            <img src={item.thumbnailUrl} alt="Thumbnail" style={{width: 80, height: 80, marginRight: 10}}/>
            <div>
                <strong>{item.title}</strong>
                <div>{item.channelTitle}</div>
            </div>
        </div>
    );
};
