import React, { useState } from 'react';
import { Modal, Button } from './ui';
import AtlasBucksIcon from '../assets/illustrations/AtlasBucks';
import { useCurrency, dismissMigration } from '../lib/currency';
import { useAuth } from '../auth/AuthProvider';

// One-shot patch-notes modal for the economy v2 changeover (2026-05-28). Shown
// only when the server has a non-zero `migrationGrant` for the signed-in user.
// Dismissal clears the flag server-side so the modal never reappears.
export default function MigrationV2Modal() {
    const { isAuthed, patchUser } = useAuth();
    const currency = useCurrency();
    const [closing, setClosing] = useState(false);

    const open = isAuthed && currency.loaded && currency.migrationGrant > 0;

    const onClose = async () => {
        if (closing) return;
        setClosing(true);
        await dismissMigration();
        patchUser({ migrationGrant: 0 });
        setClosing(false);
    };

    return (
        <Modal open={open} onClose={onClose} title="Atlas Bucks just got better">
            <div className="migration-modal">
                <div className="migration-modal__grant">
                    <AtlasBucksIcon size={48} />
                    <div className="migration-modal__grant-num">
                        +{currency.migrationGrant.toLocaleString()}
                    </div>
                    <div className="migration-modal__grant-label">credited to your wallet</div>
                </div>
                <div className="migration-modal__notes">
                    <h3>What changed</h3>
                    <ul>
                        <li><strong>No more claiming.</strong> Atlas Bucks now land the instant you earn them — per correct answer, end of run, new high score.</li>
                        <li><strong>XP rates doubled.</strong> Every correct answer now pays twice the XP it used to.</li>
                        <li><strong>Bucks pay at the old rate.</strong> The number that used to show up in the trade-in is now what you get directly per answer.</li>
                        <li><strong>Your unclaimed balance is yours.</strong> Whatever you hadn't traded in yet was credited above so nothing was lost.</li>
                    </ul>
                </div>
                <div className="migration-modal__actions">
                    <Button variant="primary" icon="check_circle" onClick={onClose} disabled={closing}>
                        {closing ? 'Saving…' : 'Got it'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
