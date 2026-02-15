import React, { useState, useRef } from 'react';
import { CameraIcon } from './icons/CameraIcon';
import { UploadIcon } from './icons/UploadIcon';

interface ImageUploadModalProps {
    onUpload: (file: File) => void;
    onExit: () => void;
}

const ImageUploadModal: React.FC<ImageUploadModalProps> = ({ onUpload, onExit }) => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isCameraOn, setIsCameraOn] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.type.startsWith('image/')) {
                setError('Please upload an image file.');
                return;
            }
            setFile(selectedFile);
            setError(null);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(selectedFile);
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraOn(true);
                setPreview(null);
                setFile(null);
            }
        } catch (err) {
            setError("Could not access camera. Please check permissions.");
        }
    };
    
    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }
        setIsCameraOn(false);
    }

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context?.drawImage(videoRef.current, 0, 0);
            canvasRef.current.toBlob(blob => {
                if (blob) {
                    const capturedFile = new File([blob], "capture.jpg", { type: "image/jpeg" });
                    setFile(capturedFile);
                    const reader = new FileReader();
                    reader.onloadend = () => setPreview(reader.result as string);
                    reader.readAsDataURL(capturedFile);
                    stopCamera();
                }
            }, 'image/jpeg');
        }
    };
    
    const handleSubmit = () => {
        if (file) {
            onUpload(file);
        } else {
            setError("Please select or capture an image.");
        }
    };
    
    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-lg m-4">
                <h2 className="text-2xl font-bold text-cyan-300 mb-4">Upload Your Work</h2>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

                <div className="w-full h-64 bg-slate-900 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    {preview && <img src={preview} alt="Preview" className="max-h-full max-w-full" />}
                    {isCameraOn && <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>}
                    {!preview && !isCameraOn && <p className="text-slate-500">Image preview or camera feed</p>}
                </div>
                <canvas ref={canvasRef} className="hidden"></canvas>

                {isCameraOn ? (
                    <div className="flex gap-4 mb-4">
                         <button onClick={handleCapture} className="flex-1 px-4 py-2 bg-cyan-600 rounded-lg font-semibold">Capture</button>
                         <button onClick={stopCamera} className="flex-1 px-4 py-2 bg-slate-700 rounded-lg font-semibold">Stop Camera</button>
                    </div>
                ): (
                     <div className="flex gap-4 mb-4">
                        <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold">
                            <UploadIcon className="w-5 h-5" /> Choose File
                        </button>
                        <button onClick={startCamera} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg font-semibold">
                            <CameraIcon className="w-5 h-5" /> Use Camera
                        </button>
                    </div>
                )}
                
                {error && <p className="text-red-400 text-center text-sm mb-4">{error}</p>}
                
                <div className="flex justify-end gap-4">
                    <button onClick={onExit} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold">Cancel</button>
                    <button onClick={handleSubmit} disabled={!file} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-bold disabled:bg-slate-600">Submit for Analysis</button>
                </div>
            </div>
        </div>
    );
};

export default ImageUploadModal;
