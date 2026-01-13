import React, { useEffect, useRef, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useDrop } from 'react-dnd';
import MaterialItem from './MaterialItem';

interface DragItem {
  id: string;
  name: string;
  image: string;
  type: 'material' | 'tool';
}
const API_BASE = "https://backend-162267981396.us-central1.run.app";
interface Experiment {
  _id: string;
  topic: string;
  name: string;
  materials: { _id: string; name: string; imageUrl: string }[];
  tools: { _id: string; name: string; imageUrl: string }[];
  result: string;
  steps: string[]; // e.g., ["Add vinegar", "Mix with baking soda"]
}

const StudentExperimentRoom: React.FC = () => {
  const { state } = useLocation();
  const { id } = state || {};

  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [loading, setLoading] = useState(true);

  const [droppedItems, setDroppedItems] = useState<DragItem[]>([]);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [findings, setFindings] = useState<string>('');

  // Create drop target ref
  const dropRef = useRef<HTMLDivElement>(null);

  const [{ isOver }, drop] = useDrop<DragItem, void, { isOver: boolean }>({
    accept: ['material', 'tool'],
    drop: (item) => {
      setDroppedItems((prev) => [...prev, item]);
      autoCompleteStep(item);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Attach drop behavior to dropRef
  drop(dropRef);

  useEffect(() => {
    const fetchExperiment = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/experiments/${id}`);
        const expData = response.data;

        // Parse steps if stored as string
        if (typeof expData.steps === 'string') {
          try {
            expData.steps = JSON.parse(expData.steps);
          } catch (e) {
            console.error('Failed to parse steps', e);
            expData.steps = [];
          }
        }

        setExperiment(expData);
      } catch (error) {
        console.error('Error fetching experiment', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchExperiment();
    }
  }, [id]);

  const handleCompleteStep = (step: string) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps((prev) => [...prev, step]);
    }
  };

  const autoCompleteStep = (item: DragItem) => {
    if (!experiment) return;

    experiment.steps.forEach((step) => {
      const normalizedStep = step.toLowerCase();
      const normalizedItem = item.name.toLowerCase();
      if (normalizedStep.includes(normalizedItem)) {
        handleCompleteStep(step);
      }
    });
  };

  if (loading) return <div className="p-6">Loading experiment...</div>;
  if (!experiment) return <Navigate to="/" />;

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 min-h-screen">

      {/* Drop Zone */}
      <div
        ref={dropRef}
        className={`col-span-2 border-4 rounded-lg p-4 flex flex-wrap items-start justify-start gap-4 bg-gray-50 min-h-[400px] ${
          isOver ? 'border-green-500' : 'border-gray-300'
        }`}
      >
        {droppedItems.length === 0 ? (
          <p className="text-gray-400 text-center w-full">Drag materials or tools here...</p>
        ) : (
          droppedItems.map((item, index) => (
            <img
              key={index}
              src={item.image}
              alt={item.name}
              className="h-20 w-20 object-cover rounded-lg shadow-md"
            />
          ))
        )}
      </div>

      {/* Materials */}
      <div className="border rounded-lg p-4 bg-white shadow">
        <h2 className="text-xl font-bold mb-4">Materials 🧪</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {experiment.materials.map((mat) => (
            <MaterialItem
              key={mat._id}
              item={{
                id: mat._id,
                name: mat.name,
                image: `${API_BASE}/${mat.imageUrl.replace(/\\/g, '/')}`,
                type: 'material',
              }}
              type="material"
            />
          ))}
        </div>
      </div>

      {/* Tools */}
      <div className="border rounded-lg p-4 bg-white shadow">
        <h2 className="text-xl font-bold mb-4">Tools 🔧</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {experiment.tools.map((tool) => (
            <MaterialItem
              key={tool._id}
              item={{
                id: tool._id,
                name: tool.name,
                image: `${API_BASE}/${tool.imageUrl.replace(/\\/g, '/')}`,
                type: 'tool',
              }}
              type="tool"
            />
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="border rounded-lg p-4 bg-white shadow">
        <h2 className="text-xl font-bold mb-4">Steps 📝</h2>
        {Array.isArray(experiment.steps) && experiment.steps.length > 0 ? (
          <ul className="space-y-4 text-sm">
            {experiment.steps.map((step, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={completedSteps.includes(step)}
                  onChange={() => handleCompleteStep(step)}
                  className="w-4 h-4"
                />
                <span className={`${completedSteps.includes(step) ? 'line-through text-gray-400' : ''}`}>
                  {step}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No steps provided yet.</p>
        )}
      </div>

      {/* Findings */}
      <div className="col-span-1 md:col-span-4 mt-8 p-6 border rounded-lg bg-gray-100">
        <h2 className="text-2xl font-bold mb-4">Record Your Findings 📋</h2>
        <textarea
          className="w-full h-40 p-4 border rounded-lg resize-none"
          placeholder="Write your observations here..."
          value={findings}
          onChange={(e) => setFindings(e.target.value)}
        />
      </div>
    </div>
  );
};

export default StudentExperimentRoom;
