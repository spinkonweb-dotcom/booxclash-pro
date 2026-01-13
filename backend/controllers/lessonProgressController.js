
import mongoose from "mongoose";
import LessonProgress from "../models/LessonProgress.js"; // Assuming your model is in models folder

// Helper function to extract user ID from token
const getUserIdFromToken = (req) => {
  // Assuming your auth middleware adds user to req
  return req.user?.id || req.user?._id;
};

// Helper function to validate session ownership
const validateSessionOwnership = async (sessionId, userId) => {
  const session = await LessonProgress.findById(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  if (session.userId.toString() !== userId.toString()) {
    throw new Error('Unauthorized access to session');
  }
  return session;
};

// ================================
// START LESSON PROGRESS TRACKING
// ================================
export const startLessonProgress = async (req, res) => {
  try {
    const { lessonId, startedAt } = req.body;
    const userId = getUserIdFromToken(req);

    // Validate required fields
    if (!lessonId) {
      return res.status(400).json({ 
        error: 'Missing required field: lessonId' 
      });
    }

    if (!userId) {
      return res.status(401).json({ 
        error: 'User authentication required' 
      });
    }

    // Check if user has an incomplete session for this lesson
    const existingSession = await LessonProgress.findOne({
      userId: userId,
      lessonId: lessonId,
      completedAt: { $exists: false }
    });

    let lessonProgress;

    if (existingSession) {
      // Resume existing session
      lessonProgress = existingSession;
      console.log(`Resuming existing session for user ${userId}, lesson ${lessonId}`);
    } else {
      // Create new session
      lessonProgress = new LessonProgress({
        userId: userId,
        lessonId: lessonId,
        totalTimeSpent: 0,
        activities: [],
        startedAt: startedAt || new Date()
      });

      await lessonProgress.save();
      console.log(`Started new lesson session for user ${userId}, lesson ${lessonId}`);
    }

    res.status(200).json({ 
      sessionId: lessonProgress._id,
      message: existingSession ? 'Resumed existing session' : 'Started new session',
      lessonId: lessonProgress.lessonId
    });

  } catch (error) {
    console.error('Error starting lesson progress:', error);
    res.status(500).json({ 
      error: 'Failed to start lesson progress',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ================================
// UPDATE ACTIVITY PROGRESS
// ================================
export const updateActivityProgress = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { activityName, timeSpent, correctAnswers, wrongAnswers, accuracy } = req.body;
    const userId = getUserIdFromToken(req);

    // Validate required fields
    if (!activityName || timeSpent === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: activityName and timeSpent' 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ 
        error: 'Invalid session ID format' 
      });
    }

    // Find and validate session ownership
    const lessonProgress = await validateSessionOwnership(sessionId, userId);

    // Find existing activity or create new one
    const existingActivityIndex = lessonProgress.activities.findIndex(
      activity => activity.activityName === activityName
    );

    const newCorrectAnswers = correctAnswers || 0;
    const newWrongAnswers = wrongAnswers || 0;
    const newTimeSpent = timeSpent || 0;

    if (existingActivityIndex >= 0) {
      // Update existing activity
      const existingActivity = lessonProgress.activities[existingActivityIndex];
      
      existingActivity.timeSpent += newTimeSpent;
      existingActivity.correctAnswers += newCorrectAnswers;
      existingActivity.wrongAnswers += newWrongAnswers;
      
      // Recalculate accuracy
      const totalAnswers = existingActivity.correctAnswers + existingActivity.wrongAnswers;
      existingActivity.accuracy = totalAnswers > 0 
        ? Math.round((existingActivity.correctAnswers / totalAnswers) * 100) 
        : 0;
        
      console.log(`Updated activity ${activityName} for session ${sessionId}`);
    } else {
      // Create new activity
      const totalAnswers = newCorrectAnswers + newWrongAnswers;
      const calculatedAccuracy = accuracy !== undefined 
        ? accuracy 
        : (totalAnswers > 0 ? Math.round((newCorrectAnswers / totalAnswers) * 100) : 0);

      lessonProgress.activities.push({
        activityName,
        timeSpent: newTimeSpent,
        correctAnswers: newCorrectAnswers,
        wrongAnswers: newWrongAnswers,
        accuracy: calculatedAccuracy
      });

      console.log(`Created new activity ${activityName} for session ${sessionId}`);
    }

    // Update total time spent
    lessonProgress.totalTimeSpent += newTimeSpent;
    lessonProgress.lastUpdatedAt = new Date();

    await lessonProgress.save();

    res.status(200).json({ 
      success: true,
      message: 'Activity progress updated successfully',
      totalTimeSpent: lessonProgress.totalTimeSpent,
      activitiesCount: lessonProgress.activities.length
    });

  } catch (error) {
    console.error('Error updating activity progress:', error);
    
    if (error.message === 'Session not found') {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (error.message === 'Unauthorized access to session') {
      return res.status(403).json({ error: 'Unauthorized access to session' });
    }

    res.status(500).json({ 
      error: 'Failed to update activity progress',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ================================
// COMPLETE LESSON PROGRESS
// ================================
export const completeLessonProgress = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { totalTimeSpent, finalAccuracy, completedAt } = req.body;
    const userId = getUserIdFromToken(req);

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ 
        error: 'Invalid session ID format' 
      });
    }

    // Find and validate session ownership
    const lessonProgress = await validateSessionOwnership(sessionId, userId);

    // Check if already completed
    if (lessonProgress.completedAt) {
      return res.status(400).json({ 
        error: 'Lesson already completed',
        completedAt: lessonProgress.completedAt
      });
    }

    // Update final metrics
    if (totalTimeSpent !== undefined) {
      lessonProgress.totalTimeSpent = Math.max(lessonProgress.totalTimeSpent, totalTimeSpent);
    }

    lessonProgress.completedAt = completedAt || new Date();

    // Calculate overall lesson statistics
    const totalCorrectAnswers = lessonProgress.activities.reduce((sum, activity) => sum + activity.correctAnswers, 0);
    const totalWrongAnswers = lessonProgress.activities.reduce((sum, activity) => sum + activity.wrongAnswers, 0);
    const totalAnswers = totalCorrectAnswers + totalWrongAnswers;
    
    const calculatedAccuracy = totalAnswers > 0 
      ? Math.round((totalCorrectAnswers / totalAnswers) * 100) 
      : 0;

    // Store final accuracy (use provided value or calculated)
    lessonProgress.finalAccuracy = finalAccuracy !== undefined ? finalAccuracy : calculatedAccuracy;

    await lessonProgress.save();

    console.log(`Completed lesson session ${sessionId} for user ${userId}`);

    res.status(200).json({ 
      success: true,
      message: 'Lesson completed successfully',
      completionData: {
        sessionId: lessonProgress._id,
        lessonId: lessonProgress.lessonId,
        totalTimeSpent: lessonProgress.totalTimeSpent,
        finalAccuracy: lessonProgress.finalAccuracy,
        totalActivities: lessonProgress.activities.length,
        totalAnswers: totalAnswers,
        correctAnswers: totalCorrectAnswers,
        wrongAnswers: totalWrongAnswers,
        completedAt: lessonProgress.completedAt
      }
    });

  } catch (error) {
    console.error('Error completing lesson progress:', error);
    
    if (error.message === 'Session not found') {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (error.message === 'Unauthorized access to session') {
      return res.status(403).json({ error: 'Unauthorized access to session' });
    }

    res.status(500).json({ 
      error: 'Failed to complete lesson progress',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ================================
// SYNC OFFLINE PROGRESS (BATCH)
// ================================
export const syncOfflineProgress = async (req, res) => {
  try {
    const { offlineData } = req.body; // Array of offline progress items
    const userId = getUserIdFromToken(req);

    if (!Array.isArray(offlineData) || offlineData.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid offline data format' 
      });
    }

    const syncResults = {
      successful: 0,
      failed: 0,
      errors: []
    };

    // Process each offline item
    for (const item of offlineData) {
      try {
        const { endpoint, options, timestamp } = item;
        
        // Reconstruct the API call based on endpoint
        if (endpoint.includes('/start')) {
          const body = JSON.parse(options.body);
          await startLessonProgress({ body, user: { id: userId } }, { status: () => ({ json: () => {} }) });
          syncResults.successful++;
        } else if (endpoint.includes('/activity')) {
          const sessionId = endpoint.split('/')[3];
          const body = JSON.parse(options.body);
          await updateActivityProgress({ params: { sessionId }, body, user: { id: userId } }, { status: () => ({ json: () => {} }) });
          syncResults.successful++;
        } else if (endpoint.includes('/complete')) {
          const sessionId = endpoint.split('/')[3];
          const body = JSON.parse(options.body);
          await completeLessonProgress({ params: { sessionId }, body, user: { id: userId } }, { status: () => ({ json: () => {} }) });
          syncResults.successful++;
        }
      } catch (error) {
        syncResults.failed++;
        syncResults.errors.push({
          item: item.endpoint,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Offline data sync completed',
      results: syncResults
    });

  } catch (error) {
    console.error('Error syncing offline progress:', error);
    res.status(500).json({ 
      error: 'Failed to sync offline progress',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ================================
// GET USER LESSON ANALYTICS
// ================================
export const getUserLessonAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = getUserIdFromToken(req);

    // Users can only access their own analytics (unless admin)
    if (userId !== requestingUserId && !req.user?.isAdmin) {
      return res.status(403).json({ 
        error: 'Unauthorized access to user analytics' 
      });
    }

    const analytics = await LessonProgress.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId),
          completedAt: { $exists: true } // Only completed lessons
        } 
      },
      {
        $group: {
          _id: null,
          totalLessonsCompleted: { $sum: 1 },
          totalTimeSpent: { $sum: "$totalTimeSpent" },
          averageAccuracy: { $avg: "$finalAccuracy" },
          totalActivities: { $sum: { $size: "$activities" } },
          lessons: { $push: {
            lessonId: "$lessonId",
            completedAt: "$completedAt",
            timeSpent: "$totalTimeSpent",
            accuracy: "$finalAccuracy",
            activitiesCount: { $size: "$activities" }
          }}
        }
      },
      {
        $project: {
          _id: 0,
          totalLessonsCompleted: 1,
          totalTimeSpent: 1,
          averageAccuracy: { $round: ["$averageAccuracy", 1] },
          totalActivities: 1,
          averageTimePerLesson: { 
            $round: [{ $divide: ["$totalTimeSpent", "$totalLessonsCompleted"] }, 0] 
          },
          lessons: 1
        }
      }
    ]);

    const result = analytics[0] || {
      totalLessonsCompleted: 0,
      totalTimeSpent: 0,
      averageAccuracy: 0,
      totalActivities: 0,
      averageTimePerLesson: 0,
      lessons: []
    };

    res.status(200).json({
      success: true,
      userId: userId,
      analytics: result
    });

  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user analytics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ================================
// GET LESSON SESSION DETAILS
// ================================
export const getLessonSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = getUserIdFromToken(req);

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ 
        error: 'Invalid session ID format' 
      });
    }

    const session = await validateSessionOwnership(sessionId, userId);

    res.status(200).json({
      success: true,
      session: {
        sessionId: session._id,
        lessonId: session.lessonId,
        userId: session.userId,
        totalTimeSpent: session.totalTimeSpent,
        activities: session.activities,
        completedAt: session.completedAt,
        startedAt: session.startedAt,
        lastUpdatedAt: session.lastUpdatedAt
      }
    });

  } catch (error) {
    console.error('Error fetching lesson session:', error);
    
    if (error.message === 'Session not found') {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (error.message === 'Unauthorized access to session') {
      return res.status(403).json({ error: 'Unauthorized access to session' });
    }

    res.status(500).json({ 
      error: 'Failed to fetch lesson session',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
