import React from 'react';
import { motion } from 'framer-motion';
import Icon from './Icon';
import { Button, Pill } from './ui';
import { usePet, revivePet } from '../lib/pet';

const STATUS = {
    cheer: 'is thriving! Keep those flags coming.',
    wave: 'is happy to see you.',
    idle: 'is content for now.',
    hungry: 'is famished — answer flags correctly to feed it!',
    sleepy: 'is drowsy — a few rounds will perk it up.',
    sad: 'feels lonely. Play to cheer it up!',
    sick: "isn't feeling well. Play to nurse it back to health!",
};

const NEEDS = [
    { key: 'fed', label: 'Fed', icon: 'restaurant', tone: 'success' },
    { key: 'joy', label: 'Joy', icon: 'mood', tone: 'accent' },
    { key: 'energy', label: 'Energy', icon: 'bolt', tone: 'info' },
];

function NeedBar({ label, icon, tone, value }) {
    const low = value < 25;
    return (
        <div className="need-row">
            <span className="need-label">
                <Icon name={icon} /> {label}
            </span>
            <span className={`need-track ${low ? 'is-low' : ''}`}>
                <motion.span
                    className={`need-fill need-fill--${tone}`}
                    initial={false}
                    animate={{ width: `${Math.round(value)}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />
            </span>
        </div>
    );
}

function PetPanel({ setView }) {
    const pet = usePet();

    if (!pet.alive) {
        return (
            <div className="pet-panel pet-panel--gone">
                <h3 className="pet-name">{pet.name} has drifted off…</h3>
                <p className="pet-status">
                    {pet.name} wasn't cared for and faded away. Hatch a new companion and keep it happy by playing.
                </p>
                <Button variant="primary" icon="egg" onClick={() => revivePet()}>
                    Hatch a new egg
                </Button>
            </div>
        );
    }

    return (
        <div className="pet-panel">
            <div className="pet-header">
                <span className="pet-name">{pet.name}</span>
                <span className="pet-pills">
                    <Pill tone="info" icon="military_tech">Lv {pet.level}</Pill>
                    <Pill tone="primary" icon="auto_awesome">{pet.stageLabel}</Pill>
                    <Pill tone={pet.health < 25 ? 'danger' : 'success'} icon="favorite">{Math.round(pet.health)}</Pill>
                </span>
            </div>

            <div className="pet-needs">
                {NEEDS.map((n) => (
                    <NeedBar key={n.key} label={n.label} icon={n.icon} tone={n.tone} value={pet[n.key]} />
                ))}
            </div>

            <div className="pet-footer">
                <p className="pet-status">
                    <strong>{pet.name}</strong> {STATUS[pet.mood] || STATUS.idle}
                </p>
                {setView && (
                    <Button variant="secondary" size="sm" icon="storefront" onClick={() => setView('store')}>
                        Customize
                    </Button>
                )}
            </div>
        </div>
    );
}

export default PetPanel;
