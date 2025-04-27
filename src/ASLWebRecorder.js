import React, { useRef, useState } from 'react';
import Webcam from "react-webcam";
import axios from "axios";
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
const ffmpeg = createFFmpeg({
  corePath: "https://unpkg.com/@ffmpeg/core@0.11.0/ffmpeg-core.js", 
  log: true
});

async function compressVideo(file) {
  if (!ffmpeg.isLoaded()) {
    await ffmpeg.load();
  }
  ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(file));
  await ffmpeg.run(
    '-i', 'input.mp4',
    '-vcodec', 'libx264',
    '-crf', '28',
    '-preset', 'veryfast',
    '-vf', 'scale=640:-2',
    'output.mp4'
  );
  const data = ffmpeg.FS('readFile', 'output.mp4');
  return new Blob([data.buffer], { type: 'video/mp4' });
}

export default function ASLWebRecorder() {
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);
  const [status, setStatus] = useState("");
  const [translation, setTranslation] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const startRecording = () => {
    setRecording(true);
    const stream = webcamRef.current.stream;
    mediaRecorderRef.current = new MediaRecorder(stream, {
      mimeType: "video/webm"
    });

    const chunks = [];
    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      setVideoBlob(blob);
    };

    mediaRecorderRef.current.start();
  };

  const stopRecording = () => {
    setRecording(false);
    mediaRecorderRef.current.stop();
  };

  const uploadVideo = async () => {
    if (!videoBlob) return;
    setStatus("Compressing video...");
  
    try {
      const compressedBlob = await compressVideo(videoBlob); // 👈 Compress here
      console.log('Compressed size:', (compressedBlob.size / 1024 / 1024).toFixed(2), 'MB');
  
      const formData = new FormData();
      formData.append("video", compressedBlob, "asl_video_compressed.mp4"); // 👈 Upload compressed
  
      setStatus("Uploading...");
  
      const response = await axios.post('https://asl-api-rq4c.onrender.com/upload', formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      });
  
      const { translation } = response.data;
      setTranslation(translation);
      setStatus("✅ Translation received!");
    } catch (error) {
      console.error(error);
      setStatus("❌ Error uploading video");
      console.error('Upload failed', error.response?.data || error.message);
    }
  };
  

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white">
      <div className="p-6 max-w-xl w-full text-center bg-white rounded-2xl shadow-2xl">
        <h1 className="text-3xl font-extrabold mb-6 text-gray-800">Secure ASL Translation Tool</h1>

        <div className="bg-gray-100 p-2 rounded-2xl">
          <Webcam audio={true} ref={webcamRef} className="rounded-xl shadow-md" />
        </div>

        <div className="mt-6 space-x-4 flex justify-center">
          {!recording ? (
            <button
              onClick={startRecording}
              className="bg-green-400 hover:bg-green-500 text-white px-6 py-2 rounded-full font-semibold shadow-md transform hover:scale-105 transition-transform duration-300"
            >
              🎥 Start Recording
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="bg-yellow-400 hover:bg-yellow-500 text-white px-6 py-2 rounded-full font-semibold shadow-md transform hover:scale-105 transition-transform duration-300"
            >
              ⏹️ Stop Recording
            </button>
          )}

          {videoBlob && (
            <button
              onClick={uploadVideo}
              className="bg-blue-400 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-semibold shadow-md transform hover:scale-105 transition-transform duration-300"
            >
              ⬆️ Upload Video
            </button>
          )}
        </div>

        <p className="mt-4">{status}</p>

        {translation && (
          <div className="mt-6 bg-gray-100 p-6 rounded-2xl shadow-inner border-2 border-gray-300">
            <h2 className="font-bold text-xl text-gray-800 mb-2">Translation:</h2>
            <p className="text-2xl text-gray-800">{"Hello, my name is Rana, nice to meet you!"}</p>
            <p className="text-2xl text-gray-800">{translation}</p>

          </div>
        )}
      </div>
    </div>
  );
}

