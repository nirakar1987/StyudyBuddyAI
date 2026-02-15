import React, { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Text as Text3D } from '@react-three/drei';
import { AppState, AppContextType } from '../types';
import { generate3DMolecule, MoleculeData } from '../services/geminiService';
import { BeakerIcon } from './icons/BeakerIcon';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import * as THREE from 'three';

interface ScienceLabViewProps {
    context: AppContextType;
}

const MoleculePart = ({ position, color, size = 1 }: { position: [number, number, number], color: string, size?: number }) => {
    return (
        <mesh position={position}>
            <sphereGeometry args={[size, 32, 32]} />
            <meshStandardMaterial color={color} metalness={0.7} roughness={0.2} envMapIntensity={1} />
        </mesh>
    );
};

const CylinderBond = ({ start, end }: { start: [number, number, number], end: [number, number, number] }) => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    const midPoint = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5);
    const length = startVec.distanceTo(endVec);

    const direction = new THREE.Vector3().subVectors(endVec, startVec).normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

    return (
        <mesh position={midPoint} quaternion={quaternion}>
            <cylinderGeometry args={[0.15, 0.15, length, 12]} />
            <meshStandardMaterial color="#cccccc" opacity={0.6} transparent />
        </mesh>
    );
};

const DynamicMolecule = ({ data, vibrationSpeed }: { data: MoleculeData, vibrationSpeed: number }) => {
    const groupRef = useRef<THREE.Group>(null!);

    useFrame((state) => {
        if (!groupRef.current) return;
        // Subtle overall rotation
        groupRef.current.rotation.y += 0.005;

        // Vibration effect based on heat
        if (vibrationSpeed > 0) {
            groupRef.current.children.forEach((child, i) => {
                const time = state.clock.getElapsedTime();
                child.position.y += Math.sin(time * 5 + i) * vibrationSpeed * 0.005;
                child.position.x += Math.cos(time * 3 + i) * vibrationSpeed * 0.005;
            });
        }
    });

    return (
        <group ref={groupRef}>
            {data.atoms.map((atom, index) => (
                <MoleculePart
                    key={`atom-${index}`}
                    position={atom.position}
                    color={atom.color}
                    size={atom.size}
                />
            ))}
            {data.bonds.map((bond, index) => {
                const start = data.atoms[bond[0]].position;
                const end = data.atoms[bond[1]].position;
                return <CylinderBond key={`bond-${index}`} start={start} end={end} />;
            })}
        </group>
    );
};

const ScienceLabView: React.FC<ScienceLabViewProps> = ({ context }) => {
    const { setAppState } = context;
    const [moleculeInput, setMoleculeInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [moleculeData, setMoleculeData] = useState<MoleculeData | null>(null);
    const [heat, setHeat] = useState(0); // 0 to 10

    const handleGenerate = async () => {
        if (!moleculeInput.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await generate3DMolecule(moleculeInput);
            setMoleculeData(data);
        } catch (err: any) {
            setError("Could not generate molecule structure. Try a simpler name.");
        } finally {
            setIsLoading(false);
        }
    };

    const predefinedMolecules = [
        { name: "Caffeine", formula: "C8H10N4O2" },
        { name: "Golden Ratio", formula: "Au" }, // Just for fun, actually Gold
        { name: "Adrenaline", formula: "C9H13NO3" },
        { name: "Diamond", formula: "C (Crystal)" }
    ];

    return (
        <div className="flex flex-col h-full animate-fade-in relative bg-slate-900 rounded-lg overflow-hidden">
            {/* Control Panel Overlay */}
            <div className="absolute top-4 left-4 z-20 bg-slate-800/80 backdrop-blur-md p-4 rounded-xl border border-slate-600 max-w-sm w-full shadow-2xl">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
                    <BeakerIcon className="w-6 h-6 text-cyan-400" /> Generative 3D Lab
                </h2>

                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={moleculeInput}
                        onChange={(e) => setMoleculeInput(e.target.value)}
                        placeholder="e.g. Glucose, H2SO4, Aspirin"
                        className="flex-grow bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none"
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-lg font-bold disabled:opacity-50"
                    >
                        {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <SparklesIcon className="w-5 h-5" />}
                    </button>
                </div>

                {error && <p className="text-red-400 text-sm mb-2">{error}</p>}

                <div className="mb-4">
                    <p className="text-xs text-slate-400 mb-2 uppercase font-bold">Quick Load:</p>
                    <div className="flex flex-wrap gap-2">
                        {predefinedMolecules.map(m => (
                            <button
                                key={m.name}
                                onClick={() => { setMoleculeInput(m.name); handleGenerate(); }}
                                className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-cyan-100 border border-slate-600"
                            >
                                {m.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Simulation Controls */}
                {moleculeData && (
                    <div className="border-t border-slate-600 pt-3">
                        <div className="flex justify-between text-xs text-slate-300 mb-1">
                            <span>Temperature (Vibration)</span>
                            <span>{heat * 10}°C</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="10"
                            value={heat}
                            onChange={(e) => setHeat(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                    </div>
                )}
            </div>

            {/* Info Overlay */}
            {moleculeData && (
                <div className="absolute bottom-4 left-4 z-20 bg-slate-800/80 backdrop-blur-md p-4 rounded-xl border border-slate-600 max-w-lg shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-1">{moleculeData.name} <span className="text-sm font-normal text-slate-400 ml-2">Generated by AI</span></h3>
                    <p className="text-slate-300 text-sm">{moleculeData.description}</p>
                </div>
            )}

            {/* Exit Button */}
            <div className="absolute top-4 right-4 z-20">
                <button
                    onClick={() => setAppState(AppState.DASHBOARD)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold backdrop-blur-sm transition-colors border border-white/10"
                >
                    <ArrowLeftOnRectangleIcon className="w-5 h-5" /> Exit Lab
                </button>
            </div>

            {/* 3D Canvas */}
            <div className="flex-grow w-full h-full bg-gradient-to-b from-slate-900 to-black relative">
                <Canvas camera={{ position: [0, 2, 8], fov: 45 }}>
                    <Suspense fallback={null}>
                        <ambientLight intensity={0.4} />
                        <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
                        <pointLight position={[-10, -5, -10]} intensity={1} color="#00ffff" />
                        <spotLight position={[0, 10, 0]} angle={0.5} penumbra={1} intensity={1} castShadow />

                        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                        <Float speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
                            {moleculeData ? (
                                <DynamicMolecule data={moleculeData} vibrationSpeed={heat} />
                            ) : (
                                <mesh position={[0, 0, 0]}>
                                    <sphereGeometry args={[0.1, 16, 16]} />
                                    <meshStandardMaterial color="transparent" opacity={0} />
                                </mesh>
                            )}
                        </Float>

                        {!moleculeData && !isLoading && (
                            <Text3D position={[0, 0, 0]} fontSize={0.5} color="white" anchorX="center" anchorY="middle">
                                Enter a molecule name to generate 3D model
                            </Text3D>
                        )}

                        <OrbitControls makeDefault enablePan={true} enableZoom={true} minDistance={2} maxDistance={20} />
                        <gridHelper args={[20, 20, 0x222222, 0x111111]} position={[0, -3, 0]} />
                    </Suspense>
                </Canvas>
            </div>
        </div>
    );
};

export default ScienceLabView;
