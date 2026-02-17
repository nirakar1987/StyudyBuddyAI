
import React, { useState } from 'react';
import { AppState, AppContextType } from '../types';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';
import { ShoppingBagIcon } from './icons/ShoppingBagIcon';

interface PointShopViewProps {
    context: AppContextType;
}

interface ShopItem {
    id: string;
    name: string;
    price: number;
    icon: string;
    category: 'Avatar' | 'Background' | 'Effect';
    description: string;
}

const PointShopView: React.FC<PointShopViewProps> = ({ context }) => {
    const { setAppState, studentProfile, setStudentProfile, setScore } = context;
    // Fallback to empty array if undefined
    const purchasedItems = studentProfile?.purchased_items || [];
    const activeItems = studentProfile?.active_items || [];
    const [activeTab, setActiveTab] = useState<'All' | 'Avatar' | 'Background' | 'Effect'>('All');

    const shopItems: ShopItem[] = [
        { id: 'hat_cool', name: 'Cool Cap', price: 100, icon: '🧢', category: 'Avatar', description: 'Look stylish while you study!' },
        { id: 'glasses_smart', name: 'Smart Glasses', price: 150, icon: '👓', category: 'Avatar', description: 'Boost your IQ points (visually).' },
        { id: 'crown_gold', name: 'Golden Crown', price: 500, icon: '👑', category: 'Avatar', description: 'For the king/queen of quizzes.' },
        { id: 'bg_space', name: 'Space Theme', price: 300, icon: '🌌', category: 'Background', description: 'Study among the stars.' },
        { id: 'bg_forest', name: 'Forest Theme', price: 250, icon: '🌲', category: 'Background', description: 'Peaceful learning environment.' },
        { id: 'effect_sparkle', name: 'Sparkle Trail', price: 200, icon: '✨', category: 'Effect', description: 'Leave a trail of magic.' },
        { id: 'pet_robot', name: 'Mini Robo', price: 800, icon: '🤖', category: 'Avatar', description: 'A tiny robotic companion.' },
        { id: 'hat_wizard', name: 'Wizard Hat', price: 400, icon: '🧙‍♂️', category: 'Avatar', description: 'Cast spells of knowledge.' },
    ];

    const handleBuy = async (item: ShopItem) => {
        if (!studentProfile) return;

        if (purchasedItems.includes(item.id)) {
            // Toggle Equip/Unequip if already owned
            const isActive = activeItems.includes(item.id);
            let newActiveItems = [...activeItems];

            if (isActive) {
                newActiveItems = newActiveItems.filter(id => id !== item.id);
            } else {
                // If it's a background, unequip other backgrounds first (optional rule)
                if (item.category === 'Background') {
                    newActiveItems = newActiveItems.filter(id => !shopItems.find(s => s.id === id && s.category === 'Background'));
                }
                newActiveItems.push(item.id);
            }

            await setStudentProfile(prev => prev ? { ...prev, active_items: newActiveItems } : null);
            return;
        }

        if ((studentProfile.score || 0) < item.price) {
            alert("Not enough points! Keep studying!");
            return;
        }

        const confirmBuy = window.confirm(`Buy ${item.name} for ${item.price} points?`);
        if (confirmBuy) {
            await setScore((prev) => prev - item.price);

            // Add to purchased items and auto-equip
            const newPurchased = [...purchasedItems, item.id];
            const newActive = [...activeItems, item.id];

            await setStudentProfile(prev => prev ? {
                ...prev,
                purchased_items: newPurchased,
                active_items: newActive
            } : null);

            alert(`Purchase successful! You are now the owner of ${item.name}.`);
        }
    };

    const filteredItems = activeTab === 'All' ? shopItems : shopItems.filter(i => i.category === activeTab);

    return (
        <div className="flex flex-col h-full animate-fade-in p-6 md:p-8 relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                        <ShoppingBagIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-white tracking-tight flex items-center gap-2">
                            Point Shop
                            <span className="text-yellow-400 text-2xl">🪙</span>
                        </h2>
                        <p className="text-slate-400 text-sm font-medium">Invest your hard-earned points!</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-yellow-500/30 flex items-center gap-2">
                        <span className="text-yellow-400 font-black text-xl">{studentProfile?.score || 0}</span>
                        <span className="text-xs font-bold text-slate-400 uppercase">Available Points</span>
                    </div>
                    <button
                        onClick={() => setAppState(AppState.DASHBOARD)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all font-bold text-xs uppercase tracking-widest border border-white/5"
                    >
                        <ArrowLeftOnRectangleIcon className="w-4 h-4" /> Back
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 relative z-10">
                {['All', 'Avatar', 'Background', 'Effect'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeTab === tab
                            ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/20'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Shop Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-8 custom-scrollbar relative z-10">
                {filteredItems.map((item) => {
                    const canAfford = (studentProfile?.score || 0) >= item.price;
                    const isOwned = purchasedItems.includes(item.id);

                    return (
                        <div
                            key={item.id}
                            className={`group relative bg-slate-800/80 backdrop-blur-sm rounded-3xl p-6 border ${isOwned ? 'border-green-500/50' : 'border-white/10 hover:border-yellow-500/50'} transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-2xl`}
                        >
                            <div className="absolute top-4 right-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-900/50 px-2 py-1 rounded-lg">
                                {item.category}
                            </div>

                            <div className="flex justify-center my-6">
                                <div className="text-6xl filter drop-shadow-xl transform group-hover:scale-110 transition-transform duration-300">
                                    {item.icon}
                                </div>
                            </div>

                            <div className="text-center mb-4">
                                <h3 className="text-xl font-black text-white mb-1">{item.name}</h3>
                                <p className="text-xs text-slate-400 font-medium">{item.description}</p>
                            </div>

                            <button
                                onClick={() => handleBuy(item)}
                                disabled={!isOwned && !canAfford}
                                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isOwned
                                        ? (activeItems.includes(item.id)
                                            ? 'bg-green-500 text-slate-900 hover:bg-green-400 shadow-lg shadow-green-500/20'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600')
                                        : canAfford
                                            ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-900 shadow-lg shadow-yellow-500/20'
                                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                    }`}
                            >
                                {isOwned ? (
                                    activeItems.includes(item.id) ? '✓ Equipped' : 'Equip'
                                ) : (
                                    <>
                                        {item.price} <span className="text-xs opacity-70">PTS</span>
                                    </>
                                )}
                            </button>

                            {/* Hover Details */}
                            {!isOwned && !canAfford && (
                                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <p className="text-red-400 font-bold text-center px-4">
                                        Need {item.price - (studentProfile?.score || 0)} more points!
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PointShopView;
