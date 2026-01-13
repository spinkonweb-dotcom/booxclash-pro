import React, { useState } from "react";
import axios from "axios";
import NavBar from "./Navbar"; // Assuming this component exists

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

const difficultyLevels = [
  "Very Easy",
  "Easy (Foundation)",
  "Intermediate",
  "Advanced",
  "Expert",
  "Master",
];

const Questions: React.FC = () => {
  const [curriculum, setCurriculum] = useState<"Local" | "Cambridge">("Local");
  const [selectedSubject, setSelectedSubject] = useState("");
  // Updated state to use a string to match the new schema
  const [selectedLevel, setSelectedLevel] = useState(difficultyLevels[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isError, setIsError] = useState(false);

  // Handles the file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setUploadStatus(""); // Clear previous status
    }
  };

  const handleSubmit = async () => {
    // Check if a file has been selected
    if (!selectedFile) {
      setUploadStatus("❌ Please select a JSON file to upload.");
      setIsError(true);
      return;
    }

    // Use FormData to send the file to the backend
    const formData = new FormData();
    formData.append("questionsFile", selectedFile);

    try {
      const res = await axios.post(
        `${API_BASE}/api/questions/upload`, // Updated endpoint
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setUploadStatus(`✅ Uploaded ${res.data.insertedCount} questions.`);
      setIsError(false);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setUploadStatus(`❌ Error: ${err.response.data.error}`);
      } else if (err instanceof Error) {
        setUploadStatus(`❌ An unknown error occurred: ${err.message}`);
      } else {
        setUploadStatus("❌ An unknown error occurred.");
      }
      setIsError(true);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <NavBar
        curriculum={curriculum}
        setCurriculum={setCurriculum}
        selectedSubject={selectedSubject}
        setSelectedSubject={setSelectedSubject}
        selectedLevel={selectedLevel}
        setSelectedLevel={setSelectedLevel}
        levels={difficultyLevels} // Pass the levels array to your NavBar
        hasContent={true}
      />

      {/* File Upload Section */}
      <div className="my-6 p-4 border rounded-lg bg-gray-800">
        <h2 className="text-white text-xl font-bold mb-4">Upload Questions</h2>
        <div className="mb-4">
          <label className="block text-white font-semibold mb-1">
            Choose JSON File:
          </label>
          <input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="text-gray-400"
          />
        </div>
        <button
          onClick={handleSubmit}
          className="bg-purple-700 hover:bg-purple-900 text-white py-2 px-4 rounded"
        >
          Upload Questions
        </button>
      </div>

      {/* Status */}
      {uploadStatus && (
        <p className={`mt-4 text-sm font-semibold ${isError ? "text-red-500" : "text-green-500"}`}>
          {uploadStatus}
        </p>
      )}
    </div>
  );
};

export default Questions;