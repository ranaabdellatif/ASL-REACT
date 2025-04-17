import React, { useRef, useState } from 'react';
import Webcam from "react-webcam";
import axios from "axios";

export default function ASLWebRecorder() {
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);
  const [status, setStatus] = useState("");
  const [translation, setTranslation] = useState(null);

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
    setStatus("Uploading...");

    const formData = new FormData();
    formData.append("video", videoBlob, "asl_video.webm");

    try {
      const response = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const { translation } = response.data;
      setTranslation(translation);
      setStatus("Translation received!");
    } catch (error) {
      console.error(error);
      setStatus("❌ Error uploading video");
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto text-center">
      <h1 className="text-2xl font-bold mb-4">ASL Web Recorder</h1>
      <Webcam audio={true} ref={webcamRef} className="rounded-xl shadow-md" />

      <div className="mt-4 space-x-2">
        {!recording ? (
          <button
            onClick={startRecording}
            className="bg-green-500 text-white px-4 py-2 rounded-xl"
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="bg-yellow-500 text-white px-4 py-2 rounded-xl"
          >
            Stop Recording
          </button>
        )}

        {videoBlob && (
          <button
            onClick={uploadVideo}
            className="bg-blue-500 text-white px-4 py-2 rounded-xl"
          >
            Upload Video
          </button>
        )}
      </div>

      <p className="mt-4 text-gray-700">{status}</p>
      {translation && (
        <div className="mt-4 bg-gray-100 p-4 rounded-xl">
          <h2 className="font-semibold">📝 Translation:</h2>
          <p className="text-lg">{translation}</p>
        </div>
      )}
    </div>
  );
}
