import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

interface GameData {
    _id?: string;
    image: File | null;
    imagePreview: string;
    title: string;
    component: string;
    imageUrl?: string; // <-- Add this line
  }
  

const GamesUpload = () => {
  const [content, setContent] = useState<GameData>({
    image: null,
    imagePreview: "",
    title: "",
    component: "",
  });
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const [savedGames, setSavedGames] = useState<GameData[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

const fetchGames = useCallback(async () => {
  try {
    const res = await axios.get(`${API_BASE}/api/games`);
    setSavedGames(res.data);
  } catch (err) {
    console.error("Error fetching games", err);
  }
}, [API_BASE]); // add any dependencies here if needed

useEffect(() => {
  fetchGames();
}, [fetchGames]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContent((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setContent((prev) => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", content.title);
    formData.append("component", content.component);
    if (content.image) formData.append("image", content.image);

    try {
      if (editingId) {
        await axios.put(`${API_BASE}/api/games/${editingId}`, formData);
        setEditingId(null);
      } else {
        await axios.post(`${API_BASE}/api/games`, formData);
      }
      setContent({ image: null, imagePreview: "", title: "", component: "" });
      fetchGames();
    } catch (err) {
      console.error("Error uploading game", err);
    }
  };

  interface EditGame {
    _id?: string;
    title: string;
    component: string;
    imageUrl?: string;
  }

  const handleEdit = (game: EditGame) => {
    setContent({
      _id: game._id,
      title: game.title,
      component: game.component,
      image: null,
      imagePreview: game.imageUrl ?? "",
    });
    setEditingId(game._id ?? null);
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_BASE}/api/games/${id}`);
      fetchGames();
    } catch (err) {
      console.error("Error deleting game", err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">
        {editingId ? "Edit Game" : "Upload New Game"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
        <div>
          <label className="block text-sm font-medium">Game Image</label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          {content.imagePreview && (
            <img
              src={content.imagePreview}
              alt="Preview"
              className="mt-2 w-32 h-32 object-cover rounded"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Game Title</label>
          <input
            type="text"
            name="title"
            value={content.title}
            onChange={handleChange}
            className="w-full mt-1 border rounded p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Component</label>
          <input
            type="text"
            name="component"
            value={content.component}
            onChange={handleChange}
            className="w-full mt-1 border rounded p-2"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {editingId ? "Update Game" : "Save Game"}
        </button>
      </form>

      <div className="mt-10">
        <h3 className="text-xl font-semibold mb-4">Saved Games</h3>
        {savedGames.length === 0 ? (
          <p className="text-gray-500">No games saved yet.</p>
        ) : (
          <ul className="space-y-3">
            {savedGames.map((game) => (
              <li key={game._id} className="border p-4 rounded bg-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                <img
                    src={
                      game.imagePreview
                        ? `${API_BASE}/uploads/${game.imagePreview}?t=${Date.now()}`
                        : "https://via.placeholder.com/100"
                    }
                    alt="Game Thumbnail"
                    className="w-32 h-32 rounded-full border-4 border-orange-500 shadow-md object-cover"
                  />
                  <div>
                    <p className="font-semibold">{game.title}</p>
                    <p className="text-sm text-gray-600">Component: {game.component}</p>
                  </div>
                </div>
                <div className="space-x-2">
                  <button onClick={() => handleEdit(game)} className="px-3 py-1 bg-yellow-500 text-white rounded text-sm">Edit</button>
                  <button onClick={() => handleDelete(game._id!)} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default GamesUpload;
