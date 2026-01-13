import MaterialToolSet from "../models/MaterialToolSet.js";

// Save new materials and tools
export const saveMaterialsTools = async (req, res) => {
  try {
    const { subject, topic, materialsData, toolsData } = req.body;

    if (!subject || !topic) {
      return res.status(400).json({ message: "Subject and Topic are required." });
    }

    let materialsParsed = [];
    let toolsParsed = [];

    try {
      materialsParsed = typeof materialsData === 'string' ? JSON.parse(materialsData) : materialsData;
      toolsParsed = typeof toolsData === 'string' ? JSON.parse(toolsData) : toolsData;
    } catch (parseError) {
      return res.status(400).json({ message: "Invalid JSON format in materialsData or toolsData." });
    }

    const materialsImages = req.files?.materialsImages || [];
    const toolsImages = req.files?.toolsImages || [];

    const materials = materialsParsed.map((item, index) => ({
      name: item.name || '',
      imageUrl: materialsImages[index]?.path || ''
    }));

    const tools = toolsParsed.map((item, index) => ({
      name: item.name || '',
      imageUrl: toolsImages[index]?.path || ''
    }));

    const newEntry = new MaterialToolSet({
      subject,
      topic,
      materials,
      tools,
    });

    await newEntry.save();

    return res.status(201).json({ message: "Materials and Tools saved successfully!", data: newEntry });
  } catch (error) {
    console.error('Error saving materials and tools:', error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get materials and tools by topic
export const getMaterialsToolsByTopic = async (req, res) => {
  try {
    const { topic } = req.query;

    if (!topic) {
      return res.status(400).json({ message: "Topic is required." });
    }

    const entry = await MaterialToolSet.findOne({ topic });

    if (!entry) {
      return res.status(404).json({ message: "No materials/tools found for this topic." });
    }

    return res.status(200).json({
      materials: entry.materials,
      tools: entry.tools,
    });
  } catch (error) {
    console.error('Error fetching materials/tools by topic:', error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
