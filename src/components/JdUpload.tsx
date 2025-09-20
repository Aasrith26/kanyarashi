'use client'
import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Inbox } from "lucide-react";
import { uploadToS3 } from "@/lib/s3";

// Define the shape of the data that will be passed up
interface UploadResult {
  key: string;
  file_name: string;
}

// Update the props to use the new UploadResult interface
interface JdUploadProps {
  onUploadComplete?: (result: UploadResult) => void;
}

const JdUpload: React.FC<JdUploadProps> = ({ onUploadComplete }) => {
  const [uploaded, setUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      console.error(`File ${file.name} is too large.`);
      return;
    }

    setUploading(true);
    try {
      const result = await uploadToS3(file, "jd");
      if (result) {
        setUploaded(true);
        if (onUploadComplete) {
          // Pass the entire result object back to the parent
          onUploadComplete(result);
        }
      } else {
        console.error("Upload failed, no result returned.");
      }
    } catch (error) {
      console.error("Error uploading", file.name, error);
    } finally {
      setUploading(false);
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 
      'application/pdf': ['.pdf'], 
      'application/msword': ['.doc', '.docx'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-powerpoint': ['.ppt', '.pptx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-excel': ['.xls', '.xlsx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
      'application/rtf': ['.rtf'],
    },
    maxFiles: 1,
    disabled: uploaded || uploading,
    onDrop,
  });

  return (
    <div className="p-2 bg-slate-800/50 rounded-xl border border-slate-700 w-[90vw] md:w-[40vw] max-w-[600px]">
      <div
        {...getRootProps({
          className: `h-[40vh] md:h-[25vh] min-h-[250px] m-2 border-dashed border-2 border-gray-600 rounded-xl cursor-pointer bg-gray-900/50 flex flex-col justify-center items-center text-center transition-colors duration-300 hover:border-gray-400 hover:bg-gray-600 ${
            uploading || uploaded ? "opacity-50 pointer-events-none" : ""
          }`,
        })}
      >
        <input {...getInputProps()} />
        <Inbox className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-lg text-gray-300">
          Drop your JD here, or click to browse
        </p>
        <p className="text-sm text-gray-500 mt-1">Max file size: 10MB</p>
      </div>
      {uploading && (
        <div className="text-gray-400 font-semibold text-center pb-2">Uploading...</div>
      )}
      {uploaded && !uploading && (
        <div className="text-green-300 font-semibold text-center pb-2">Upload successful!</div>
      )}
    </div>
  );
};

export default JdUpload;
