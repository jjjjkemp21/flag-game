import React, { useState } from 'react';
import ChestReveal from './ChestReveal';
import AtlasBucksIcon from '../../assets/illustrations/AtlasBucks';
import { useAuth } from '../../auth/AuthProvider';
import { useLoginChest, claimLoginChest } from '../../lib/loginChest';
import { useToast } from '../ui/Toast';

// Day 7 always renders as the legendary palette so the jackpot feels jackpot-y.
// Days 1-6 step through the rarity scale gently — common / common / common /
// rare / rare / epic — to give the cycle a visible escalation even before the
// finale.
const DAY_RARITY = ['common', 'common', 'common', 'rare', 'rare', 'epic', 'legendary'];

export default function LoginChestModal() {
    const { isAuthed } = useAuth();
    const toast = useToast();
    const chest = useLoginChest();
    const [claiming, setClaiming] = useState(false);

    const open = isAuthed && chest.loaded && !!chest.pending;
    const day = chest.pending ? chest.pending.day : null;
    const bucks = chest.pending ? chest.pending.bucks : 0;
    const rarity = day ? DAY_RARITY[day - 1] : 'common';

    const onClose = async () => {
        if (claiming) return;
        setClaiming(true);
        try {
            await claimLoginChest();
        } catch (err) {
            toast.danger(err.message || 'Could not claim chest.');
        } finally {
            setClaiming(false);
        }
    };

    return (
        <>
            <ChestReveal
                open={open}
                rarity={rarity}
                bucks={bucks}
                title={day === 7 ? `Day 7 — jackpot!` : `Day ${day || ''} chest`}
                subtitle={day === 7 ? 'Come back tomorrow for Day 1' : null}
                showRarity={false}
                onClose={onClose}
            />
            {open && (
                <div className="login-chest-floating-pips" aria-hidden="true">
                    {chest.payouts.map((amt, i) => {
                        const num = i + 1;
                        const isToday = num === day;
                        const isPast = day != null && num < day;
                        return (
                            <div
                                key={i}
                                className={`login-chest-pip ${isToday ? 'is-today' : ''} ${isPast ? 'is-past' : ''} ${num === 7 ? 'is-day7' : ''}`}
                            >
                                <span className="login-chest-pip__num">{num}</span>
                                <span className="login-chest-pip__bucks">
                                    <AtlasBucksIcon size={10} /> {amt}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}
