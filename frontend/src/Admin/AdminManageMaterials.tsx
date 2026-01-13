import { useState } from "react";

interface Item {
  name: string;
  image: File | null;
  preview: string | null;
}
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
export default function AdminManageMaterials() {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [materials, setMaterials] = useState<Item[]>([]);
  const [tools, setTools] = useState<Item[]>([]);

  const [uploadedMaterials, setUploadedMaterials] = useState<Item[]>([]);
  const [uploadedTools, setUploadedTools] = useState<Item[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number, type: "material" | "tool") => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      if (type === "material") {
        const updated = [...materials];
        updated[index].image = file;
        updated[index].preview = preview;
        setMaterials(updated);
      } else {
        const updated = [...tools];
        updated[index].image = file;
        updated[index].preview = preview;
        setTools(updated);
      }
    }
  };

  const addMaterial = () => setMaterials([...materials, { name: "", image: null, preview: null }]);
  const addTool = () => setTools([...tools, { name: "", image: null, preview: null }]);

  const updateMaterialName = (index: number, value: string) => {
    const updated = [...materials];
    updated[index].name = value;
    setMaterials(updated);
  };

  const updateToolName = (index: number, value: string) => {
    const updated = [...tools];
    updated[index].name = value;
    setTools(updated);
  };

  const deleteMaterial = (index: number) => {
    const updated = [...materials];
    updated.splice(index, 1);
    setMaterials(updated);
  };

  const deleteTool = (index: number) => {
    const updated = [...tools];
    updated.splice(index, 1);
    setTools(updated);
  };

  const deleteUploadedMaterial = (index: number) => {
    const updated = [...uploadedMaterials];
    updated.splice(index, 1);
    setUploadedMaterials(updated);
  };

  const deleteUploadedTool = (index: number) => {
    const updated = [...uploadedTools];
    updated.splice(index, 1);
    setUploadedTools(updated);
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("subject", subject);
    formData.append("topic", topic);

    materials.forEach((item) => {
      if (item.image) {
        formData.append("materialsImages", item.image);
      }
    });

    tools.forEach((item) => {
      if (item.image) {
        formData.append("toolsImages", item.image);
      }
    });

    formData.append("materialsData", JSON.stringify(materials.map(item => ({ name: item.name }))));
    formData.append("toolsData", JSON.stringify(tools.map(item => ({ name: item.name }))));

    try {
      const response = await fetch(`${API_BASE}/api/materials-tools`, {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        console.log("Successfully submitted!");

        // After successful submit:
        setUploadedMaterials(prev => [...prev, ...materials]);
        setUploadedTools(prev => [...prev, ...tools]);

        // Clear the form
        setSubject("");
        setTopic("");
        setMaterials([]);
        setTools([]);
      } else {
        console.error("Failed to submit");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-center">Manage Materials & Tools</h1>

      <div className="bg-white shadow-md rounded-lg p-6 space-y-6">

        {/* Subject */}
        <div className="space-y-2">
          <label className="block font-semibold">Subject</label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2"
          >
            <option value="">Select Subject</option>
            <option value="Math">Math</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Biology">Biology</option>
          </select>
        </div>

        {/* Topic */}
        <div className="space-y-2">
          <label className="block font-semibold">Topic</label>
          <input
            type="text"
            placeholder="Topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        {/* Materials */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Materials</h2>
          {materials.map((material, index) => (
            <div key={index} className="flex flex-col gap-2 border p-4 rounded-md bg-gray-50 relative">
              {material.preview && (
                <img src={material.preview} alt="preview" className="w-32 h-32 object-cover rounded-md" />
              )}
              <input
                type="text"
                placeholder="Material Name"
                value={material.name}
                onChange={(e) => updateMaterialName(index, e.target.value)}
                className="border border-gray-300 rounded-md p-2"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, index, "material")}
                className="border border-gray-300 rounded-md p-2"
              />
              <button
                onClick={() => deleteMaterial(index)}
                type="button"
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm"
              >
                Delete
              </button>
            </div>
          ))}
          <button
            onClick={addMaterial}
            type="button"
            className="px-4 py-2 text-sm border border-gray-400 rounded-md hover:bg-gray-100"
          >
            Add Material
          </button>
        </div>

        {/* Tools */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Tools</h2>
          {tools.map((tool, index) => (
            <div key={index} className="flex flex-col gap-2 border p-4 rounded-md bg-gray-50 relative">
              {tool.preview && (
                <img src={tool.preview} alt="preview" className="w-32 h-32 object-cover rounded-md" />
              )}
              <input
                type="text"
                placeholder="Tool Name"
                value={tool.name}
                onChange={(e) => updateToolName(index, e.target.value)}
                className="border border-gray-300 rounded-md p-2"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, index, "tool")}
                className="border border-gray-300 rounded-md p-2"
              />
              <button
                onClick={() => deleteTool(index)}
                type="button"
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm"
              >
                Delete
              </button>
            </div>
          ))}
          <button
            onClick={addTool}
            type="button"
            className="px-4 py-2 text-sm border border-gray-400 rounded-md hover:bg-gray-100"
          >
            Add Tool
          </button>
        </div>

        {/* Save */}
        <button
          onClick={handleSubmit}
          type="button"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-md"
        >
          Save Materials & Tools
        </button>

      </div>

      {/* Uploaded Items Display */}
      <div className="bg-white shadow-md rounded-lg p-6 space-y-6">
        <h2 className="text-2xl font-bold">Uploaded Materials</h2>
        <div className="grid grid-cols-2 gap-4">
          {uploadedMaterials.map((material, index) => (
            <div key={index} className="flex flex-col items-center gap-2 p-4 border rounded-md">
              {material.preview && (
                <img src={material.preview} alt={material.name} className="w-32 h-32 object-cover rounded-md" />
              )}
              <span>{material.name}</span>
              <div className="flex gap-2">
                {/* Edit could open a modal or another form */}
                <button className="text-blue-600 hover:underline text-sm">Edit</button>
                <button
                  onClick={() => deleteUploadedMaterial(index)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-bold">Uploaded Tools</h2>
        <div className="grid grid-cols-2 gap-4">
          {uploadedTools.map((tool, index) => (
            <div key={index} className="flex flex-col items-center gap-2 p-4 border rounded-md">
              {tool.preview && (
                <img src={tool.preview} alt={tool.name} className="w-32 h-32 object-cover rounded-md" />
              )}
              <span>{tool.name}</span>
              <div className="flex gap-2">
                <button className="text-blue-600 hover:underline text-sm">Edit</button>
                <button
                  onClick={() => deleteUploadedTool(index)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
