import LessonContent from "../models/LessonContent.js";

export const saveLessonContent = async (req, res) => {
  const {
    curriculum, // ✅ NEW
    subject,
    topic,
    level,
    start,
    knowQuestions = [],
    doComponent,
    watchContent,
    reflectPrompt,
    quiz = [],
  } = req.body;

  try {
    if (start && typeof start.points === "undefined") {
      start.points = 0;
    }

    const sanitizedKnowQuestions = knowQuestions.map((q) => ({
      ...q,
      image: q.image || "",
      points: typeof q.points === "number" ? q.points : 0,
    }));

    const sanitizedQuiz = quiz.map((q) => ({
      ...q,
      points: typeof q.points === "number" ? q.points : 0,
    }));

    let sanitizedWatchContent = watchContent;
    if (watchContent && typeof watchContent.points === "undefined") {
      sanitizedWatchContent = { ...watchContent, points: 0 };
    }

    let sanitizedReflectPrompt = { prompts: [], points: 0 };
    if (reflectPrompt) {
      sanitizedReflectPrompt = {
        prompts: Array.isArray(reflectPrompt.prompts) ? reflectPrompt.prompts : [],
        points: typeof reflectPrompt.points === "number" ? reflectPrompt.points : 0,
      };
    }

    let sanitizedDoComponent = { componentLink: "", points: 0 };
    if (doComponent) {
      sanitizedDoComponent = {
        componentLink: typeof doComponent.componentLink === "string" ? doComponent.componentLink : "",
        points: typeof doComponent.points === "number" ? doComponent.points : 0,
      };
    }

    const updated = await LessonContent.findOneAndUpdate(
      { curriculum, subject, topic, level }, // ✅ include curriculum
      {
        curriculum,
        subject,
        topic,
        level,
        start,
        knowQuestions: sanitizedKnowQuestions,
        doComponent: sanitizedDoComponent,
        watchContent: sanitizedWatchContent,
        reflectPrompt: sanitizedReflectPrompt,
        quiz: sanitizedQuiz,
      },
      { new: true, upsert: true }
    );

    res.status(200).json(updated);
  } catch (err) {
    console.error("Save error:", err);
    res.status(500).json({ error: "Failed to save lesson content" });
  }
};

export const getLessonContent = async (req, res) => {
  try {
    const { curriculum, subject, topic, level } = req.query;

    if (!curriculum || !subject || !level) {
      return res.status(400).json({
        error: "Missing required query parameters: curriculum, subject, and level are required.",
      });
    }

    const query = {
      curriculum: curriculum.toString(),
      subject: subject.toString(),
      level: Number(level),
    };

    if (topic) query.topic = topic.toString();

    const lesson = await LessonContent.findOne(query);

    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found with the provided parameters." });
    }

    res.status(200).json(lesson);
  } catch (error) {
    console.error("Error fetching lesson content:", error);
    res.status(500).json({ error: "Server error while fetching lesson content." });
  }
};


export const getAllLessonContent = async (req, res) => {
  try {
    const all = await LessonContent.find();
    res.status(200).json(all);
  } catch (err) {
    console.error("Get all error:", err);
    res.status(500).json({ error: "Failed to fetch lesson contents" });
  }
};

export const deleteLessonContent = async (req, res) => {
  const { curriculum, subject, topic, level } = req.query;
  try {
    const deleted = await LessonContent.findOneAndDelete({
      curriculum,
      subject,
      topic,
      level: Number(level),
    });

    if (!deleted) return res.status(404).json({ error: "Lesson not found" });
    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete lesson" });
  }
};
