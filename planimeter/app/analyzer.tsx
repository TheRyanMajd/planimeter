"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Camera, ImageIcon, Loader2, RefreshCw, Send } from "lucide-react"
import { useRef, useState } from "react"
// import { analyzeImage } from "./api/analyze-image/actions" vercel no likey


export default function ImageAnalyzer() {

    async function compressAndConvertToBase64(file: File, maxWidth = 1080, maxHeight = 1080, quality = 0.9): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
                    const width = img.width * scale;
                    const height = img.height * scale;

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext("2d");
                    if (!ctx) return reject("Failed to get canvas context");
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            if (!blob) return reject("Failed to create blob");
                            const reader2 = new FileReader();
                            reader2.onloadend = () => {
                                resolve(reader2.result as string);
                            };
                            reader2.readAsDataURL(blob);
                        },
                        "image/jpeg",
                        quality
                    );
                };
                img.src = event.target?.result as string;
            };

            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
        });
    }



    const [captureMode, setCaptureMode] = useState<"camera" | "upload">("upload")
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [result, setResult] = useState<string | null>(null)
    const [cameraActive, setCameraActive] = useState(false)

    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Handle camera activation
    const activateCamera = async () => {
        setCaptureMode("camera")
        setCameraActive(true)

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
            })

            if (videoRef.current) {
                videoRef.current.srcObject = stream
            }
        } catch (err) {
            console.error("Error accessing camera:", err)
            setCameraActive(false)
            alert("Could not access camera. Please check permissions or try uploading an image instead.")
        }
    }

    // Handle camera deactivation
    const deactivateCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream
            stream.getTracks().forEach((track) => track.stop())
            videoRef.current.srcObject = null
        }
        setCameraActive(false)
    }

    // Handle taking a photo
    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current
            const canvas = canvasRef.current

            // Set canvas dimensions to match video
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight

            // Draw the current video frame to the canvas
            const context = canvas.getContext("2d")
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height)

                // Convert canvas to data URL and create a file
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" })
                        setImageFile(file)
                        console.log(imageFile);
                        setImagePreview(canvas.toDataURL("image/jpeg"))
                        deactivateCamera()
                    }
                }, "image/jpeg")
            }
        }
    }

    // Handle file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            const reader = new FileReader()
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    // Handle file upload button click
    const triggerFileUpload = () => {
        setCaptureMode("upload")
        deactivateCamera()
        fileInputRef.current?.click()
    }

    async function analyzeImageClient(base64DataUrl: string): Promise<string> {
        const res = await fetch("/api/analyze-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ base64DataUrl }),
        });

        const data = await res.json();
        return data.result;
    }


    const handleAnalyze = async () => {
        if (!imageFile) return;
        setIsAnalyzing(true);
        setResult(null);

        try {
            const base64 = await compressAndConvertToBase64(imageFile);
            const analysisResult = await analyzeImageClient(base64);
            setResult(analysisResult);
        } catch (error) {
            console.error("Image analysis failed:", error);
            setResult("Error analyzing image.");
        }

        setIsAnalyzing(false);
    };


    const handleReset = () => {
        setImagePreview(null);
        setImageFile(null);
        setResult(null);
        deactivateCamera();
    };
    return (
        <div className="w-full max-w-md flex flex-col gap-4">
            {/* Camera view */}
            {cameraActive && (
                <div className="relative rounded-lg overflow-hidden bg-black aspect-[4/3] w-full">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <Button
                        onClick={takePhoto}
                        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 rounded-full w-16 h-16"
                    >
                        <span className="sr-only">Take Photo</span>
                        <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-white"></div>
                        </div>
                    </Button>
                </div>
            )}

            {/* Hidden canvas for photo capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Image preview */}
            {imagePreview && !cameraActive && (
                <Card className="overflow-hidden">
                    <div className="aspect-[4/3] w-full relative">
                        <img
                            src={imagePreview || "/placeholder.svg"}
                            alt="Preview"
                            className="w-full h-full object-contain bg-gray-100"
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                            onClick={handleReset}
                        >
                            <RefreshCw className="h-4 w-4" />
                            <span className="sr-only">Reset</span>
                        </Button>
                    </div>
                </Card>
            )}

            {/* Input controls */}
            {!imagePreview && !cameraActive && (
                <Card className="p-6 flex flex-col items-center gap-6">
                    <div className="text-center text-gray-600">
                        <p>Choose how you want to add an image</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full">
                        <Button
                            onClick={activateCamera}
                            className="h-24 flex flex-col gap-2"
                            variant={captureMode === "camera" ? "default" : "outline"}
                        >
                            <Camera className="h-6 w-6" />
                            <span>Take Photo</span>
                        </Button>

                        <Button
                            onClick={triggerFileUpload}
                            className="h-24 flex flex-col gap-2"
                            variant={captureMode === "upload" ? "default" : "outline"}
                        >
                            <ImageIcon className="h-6 w-6 bg-black" />
                            <span className="text-black">Upload Image</span>
                        </Button>
                    </div>

                    <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} className="hidden" />
                </Card>
            )}

            {/* Analysis button */}
            {imagePreview && !isAnalyzing && !result && (
                <Button onClick={handleAnalyze} className="w-full py-6 text-lg text-black">
                    <Send className="mr-2 h-5 w-5" />
                    Send to ChatGPT
                </Button>
            )}

            {/* Loading state */}
            {isAnalyzing && (
                <div className="flex flex-col items-center gap-4 py-6">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-gray-600">Analyzing your image...</p>
                </div>
            )}

            {/* Results display */}
            {result && (
                <Card className={cn("p-4 transition-all duration-300", "animate-in fade-in slide-in-from-bottom-4")}>
                    <h2 className="font-semibold text-lg mb-2 text-black">Estimated Area</h2>
                    <div className="prose prose-sm max-w-none">
                        <p className="whitespace-pre-line text-black">{result}</p>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Analyze Another Image
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    )
}
