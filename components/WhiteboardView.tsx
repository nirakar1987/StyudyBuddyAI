import React, { useRef, useState, useEffect } from 'react';
import { AppState, AppContextType, AvatarState } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';
import { analyzeHandwrittenWork } from '../services/geminiService';

interface WhiteboardViewProps {
    context: AppContextType;
}

const WhiteboardView: React.FC<WhiteboardViewProps> = ({ context }) => {
    const { setAppState, setAvatarState, studentProfile } = context;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(3);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size to parent container
        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
                // Set white background initially
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);
        const { x, y } = getCoordinates(e, canvas);
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { x, y } = getCoordinates(e, canvas);
        ctx.lineTo(x, y);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.closePath();
        }
    };

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setFeedback(null);
    };

    const handleAnalyzeWork = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        setIsAnalyzing(true);
        setFeedback(null);
        setAvatarState(AvatarState.THINKING);

        try {
            // Convert canvas to blob
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
            if (!blob) throw new Error("Could not capture whiteboard.");

            // Create a File object from Blob
            const file = new File([blob], "whiteboard.png", { type: "image/png" });

            // Send to Gemini
            const result = await analyzeHandwrittenWork(file, "Check this math problem solution");
            setFeedback(result);
        } catch (error) {
            console.error(error);
            setFeedback("Sorry, I couldn't analyze your work right now. Please try again.");
        } finally {
            setIsAnalyzing(false);
            setAvatarState(AvatarState.IDLE);
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in relative">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-[var(--color-primary)] flex items-center gap-2">
                    <PencilIcon className="w-6 h-6" /> Interactive Whiteboard
                </h2>
                <div className="flex gap-2">
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-none"
                        title="Choose Color"
                    />
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={lineWidth}
                        onChange={(e) => setLineWidth(parseInt(e.target.value))}
                        className="w-24"
                        title="Brush Size"
                    />
                    <button onClick={clearCanvas} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200" title="Clear Board">
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-grow bg-white rounded-xl shadow-inner border-2 border-slate-200 overflow-hidden relative cursor-crosshair touch-none">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-full block"
                />
            </div>

            <div className="mt-4 flex justify-between items-center">
                <button
                    onClick={() => setAppState(AppState.DASHBOARD)}
                    className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-700 font-semibold"
                >
                    <ArrowLeftOnRectangleIcon className="w-5 h-5" /> Back
                </button>

                <button
                    onClick={handleAnalyzeWork}
                    disabled={isAnalyzing}
                    className="px-6 py-2 bg-[var(--color-primary-action)] text-white rounded-lg font-bold hover:bg-violet-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    {isAnalyzing ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                            Checking...
                        </>
                    ) : (
                        <>
                            <SparklesIcon className="w-5 h-5" />
                            Check My Work
                        </>
                    )}
                </button>
            </div>

            {feedback && (
                <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl animate-fade-in">
                    <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-indigo-600" />
                        StudyBuddy AI's Feedback:
                    </h3>
                    <p className="text-indigo-800 whitespace-pre-wrap">{feedback}</p>
                </div>
            )}
        </div>
    );
};

export default WhiteboardView;
