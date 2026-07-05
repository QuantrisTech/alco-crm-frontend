// components/admin/GuideVideoUpload.tsx
"use client";

import { useState } from "react";
import { getGuideUploadSignature } from "@/utils/api";

export default function GuideVideoUpload({
    pageKey,
    onUploaded,
}: {
    pageKey: string;
    onUploaded: (url: string, publicId: string) => void;
}) {
    const [progress, setProgress] = useState(0);
    const [uploading, setUploading] = useState(false);

    const handleFile = async (file: File) => {
        setUploading(true);
        setProgress(0);

        try {
            // 1. backend se signature lo
            //   const { data: sig } = await api.get("/guides/upload-signature");
            const { data: sig } = await getGuideUploadSignature();
            // 2. directly Cloudinary py upload karo
            const formData = new FormData();
            formData.append("file", file);
            formData.append("api_key", sig.apiKey);
            formData.append("timestamp", sig.timestamp.toString());
            formData.append("signature", sig.signature);
            formData.append("folder", sig.folder);

            const xhr = new XMLHttpRequest();
            xhr.upload.onprogress = (e) => {
                setProgress(Math.round((e.loaded / e.total) * 100));
            };

            const uploadPromise = new Promise<any>((resolve, reject) => {
                xhr.onload = () => resolve(JSON.parse(xhr.responseText));
                xhr.onerror = reject;
            });

            xhr.open(
                "POST",
                `https://api.cloudinary.com/v1_1/${sig.cloudName}/video/upload`
            );
            xhr.send(formData);

            const result = await uploadPromise;
            onUploaded(result.secure_url, result.public_id);
        } catch (err) {
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <input
                type="file"
                accept="video/*"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                disabled={uploading}
            />
            {uploading && (
                <div className="mt-2 text-sm text-gray-500">Uploading... {progress}%</div>
            )}
        </div>
    );
}