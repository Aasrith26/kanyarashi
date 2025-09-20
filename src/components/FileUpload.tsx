'use client'
import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Inbox } from "lucide-react";
import { uploadToS3 } from "@/lib/s3";

interface FileUploadProps {
  onUploadComplete?: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete }) => {
    const [uploaded, setUploaded] = useState(false);
    const [uploading, setUploading] = useState(false);
    const {getRootProps, getInputProps, isDragActive} = useDropzone({
        accept: {
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/vnd.ms-powerpoint': ['.ppt'],
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'text/plain': ['.txt'],
            'application/rtf': ['.rtf'],
        },
        maxFiles:10,
        disabled: uploaded || uploading,
        onDrop: async (acceptedFiles) => {
            setUploading(true);
            let allSuccess = true;
            for (const file of acceptedFiles) {
                if (file.size > 10 * 1024 * 1024) {
                    console.error(`File ${file.name} is too large. Please upload a smaller file.`);
                    allSuccess = false;
                    continue;
                }
                try {
                    const data = await uploadToS3(file, "resume");
                    console.log("Uploaded:", file.name, data);
                } catch (error) {
                    console.log("Error uploading", file.name, error);
                    allSuccess = false;
                }
            }
            setUploading(false);
            if (allSuccess && acceptedFiles.length > 0) {
                setUploaded(true);
                if (onUploadComplete) onUploadComplete();
            }
        },
    });
    return (
        <div className="p-2 bg-white rounded-xl">
           <div {...getRootProps({
            className : `border-dashed border-2 rounded-xl cursor-pointer bg-gray-50 py-8 flex flex-col justify-center items-center ${uploaded || uploading ? 'opacity-50 pointer-events-none' : ''}`,
           })}>
             <input {...getInputProps()} disabled={uploaded || uploading}></input>
             <>
               <Inbox className="w-10 h-10 text-blue-500"/>
              <p className="mt-2 text-m text-slate-400">Upload Resumes in bulk or individually</p>
              <p className="mt-2 text-sm text-slate-300">Maximum of 10 files</p>
             </>
           </div>
           {uploaded && (
             <div className="mt-4 text-green-600 font-semibold text-center">Files uploaded successfully!</div>
           )}
           {uploading && (
             <div className="mt-4 text-blue-600 font-semibold text-center">Uploading...</div>
           )}
        </div>
    )
}

export default FileUpload