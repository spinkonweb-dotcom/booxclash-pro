import Experiment from '../models/Experiment.js';

// Create a new experiment
export const createExperiment = async (req, res) => {
  try {
    const { topic, name, materials, tools, result, steps } = req.body; // ⬅️ added steps
    let thumbnailUrl = '';

    // If a file (thumbnail) was uploaded
    if (req.file) {
      thumbnailUrl = req.file.path.replace(/\\/g, '/'); // normalize path for Windows
    }

    const newExperiment = new Experiment({
      topic,
      name,
      materials: JSON.parse(materials), // because coming as JSON string
      tools: JSON.parse(tools),
      result,
      steps,                             // ⬅️ include steps
      thumbnailUrl,
    });

    await newExperiment.save();
    res.status(201).json(newExperiment);
  } catch (error) {
    console.error('Error creating experiment:', error);
    res.status(500).json({ error: 'Failed to create experiment' });
  }
};

// Get all experiments
export const getExperiments = async (req, res) => {
  try {
    const experiments = await Experiment.find();
    res.status(200).json(experiments);
  } catch (error) {
    console.error('Error fetching experiments:', error);
    res.status(500).json({ error: 'Failed to fetch experiments' });
  }
};

// Get a single experiment by ID
export const getExperimentById = async (req, res) => {
  try {
    const { id } = req.params;
    const experiment = await Experiment.findById(id);
    if (!experiment) {
      return res.status(404).json({ error: 'Experiment not found' });
    }
    res.status(200).json(experiment);
  } catch (error) {
    console.error('Error fetching experiment:', error);
    res.status(500).json({ error: 'Failed to fetch experiment' });
  }
};

// Update an experiment
export const updateExperiment = async (req, res) => {
  const { id } = req.params;
  try {
    const { topic, name, materials, tools, result, steps } = req.body; // ⬅️ added steps
    let updateData = { topic, name, result, steps };                    // ⬅️ include steps in updateData

    if (materials) updateData.materials = JSON.parse(materials);
    if (tools) updateData.tools = JSON.parse(tools);

    if (req.file) {
      updateData.thumbnailUrl = req.file.path.replace(/\\/g, '/');
    }

    const updatedExperiment = await Experiment.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedExperiment) {
      return res.status(404).json({ error: 'Experiment not found' });
    }

    res.status(200).json(updatedExperiment);
  } catch (error) {
    console.error('Error updating experiment:', error);
    res.status(500).json({ error: 'Failed to update experiment' });
  }
};

// Delete an experiment
export const deleteExperiment = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedExperiment = await Experiment.findByIdAndDelete(id);
    if (!deletedExperiment) {
      return res.status(404).json({ error: 'Experiment not found' });
    }
    res.status(200).json({ message: 'Experiment deleted successfully' });
  } catch (error) {
    console.error('Error deleting experiment:', error);
    res.status(500).json({ error: 'Failed to delete experiment' });
  }
};
