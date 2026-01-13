import Child from "../models/Child.js";
import User from "../models/User.js"; 
import { sendEmail, sendSms } from "../utils/notifications-services.js";

const formatPhoneNumberE164 = (phoneNumber) => {
  if (!phoneNumber) return null;
  if (phoneNumber.startsWith('+260')) {
    return phoneNumber;
  }
  if (phoneNumber.startsWith('0')) {
    return `+260${phoneNumber.substring(1)}`;
  }
  if (phoneNumber.length === 9) {
    return `+260${phoneNumber}`;
  }
  return null;
};

// ✅ UPDATED: Accepts country, curriculum, and subject on creation
export const createChild = async (req, res) => {
  try {
    // Destructure all fields including the new ones
    const { parentId, childName, childGrade, avatarUrl, country, curriculum, subject } = req.body;

    // Validate required fields (added country)
    if (!parentId || !childName || !childGrade || !country) {
      return res.status(400).json({ message: "Missing required fields (Name, Grade, or Country)" });
    }

    const parent = await User.findById(parentId);
    if (!parent) {
      return res.status(404).json({ message: "Parent account not found." });
    }

    // Construct the data object
    const newChildData = { 
        parentId, 
        childName, 
        childGrade, 
        avatarUrl,
        country,     // Save Country
        curriculum,  // Save Curriculum
        subject      // Save Subject
    };

    // Check parent subscription status
    if (parent.subscription.status === 'active') {
      newChildData.isPremium = true;
      newChildData.progressStatus = 'premium';
    }

    const newChild = await Child.create(newChildData);
    
    return res.status(201).json({ 
        success: true, 
        message: "Child profile created successfully", 
        child: newChild 
    });

  } catch (error) {
    console.error("Error creating child:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// --- Function to upgrade a SINGLE child to premium ---
export const upgradeChildToPremium = async (req, res) => {
  try {
    const { id } = req.params; 

    const updatedChild = await Child.findByIdAndUpdate(
      id,
      { 
        isPremium: true,
        progressStatus: 'premium'
      },
      { new: true } 
    );

    if (!updatedChild) {
      return res.status(404).json({ message: "Child not found" });
    }

    return res.status(200).json({
      success: true,
      message: `${updatedChild.childName} has been upgraded to premium.`,
      child: updatedChild,
    });

  } catch (error) {
    console.error("Error upgrading child:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ UPDATED: Allows updating Country as well
export const updateChildDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { curriculum, subject, country } = req.body;

    const updateData = {};
    if (curriculum) updateData.curriculum = curriculum;
    if (subject) updateData.subject = subject;
    if (country) updateData.country = country; // Allow updating country

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No update data provided" });
    }

    const updatedChild = await Child.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedChild) {
      return res.status(404).json({ message: "Child not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Child details updated successfully",
      child: updatedChild,
    });
  } catch (error) {
    console.error("Error updating child details:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// --- Function to save progress ---
export const updateChildProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { points, streak, completedLesson } = req.body;

    if (points === undefined || streak === undefined || !completedLesson || !completedLesson.id) {
        return res.status(400).json({ message: "Missing required progress fields" });
    }
    
    const lessonToSave = {
        lessonId: completedLesson.id,
        title: completedLesson.title,
        type: completedLesson.type,
    };

    const updateData = {
        points: points,
        streak: streak,
        $push: { lessonsCompleted: lessonToSave },
    };

    const updatedChild = await Child.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
    );

    if (!updatedChild) {
        return res.status(404).json({ message: "Child not found" });
    }

    return res.status(200).json({
        success: true,
        message: "Progress saved successfully",
        child: updatedChild,
    });

  } catch (error) {
    console.error("Error updating child progress:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Optional: handle avatar uploads
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    return res.status(200).json({ url: fileUrl });
  } catch (error) {
    console.error("Avatar upload error:", error);
    res.status(500).json({ message: "Failed to upload avatar" });
  }
};

export const getChildrenForParent = async (req, res) => {
  try {
    const parentId = req.user.id;
    const children = await Child.find({ parentId: parentId });

    if (!children) {
      return res.status(404).json({ message: "No children found for this parent." });
    }

    return res.status(200).json({
      success: true,
      children: children,
    });
  } catch (error) {
    console.error("Error fetching children for parent:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// --- Function to send real notifications ---
export const requestUpgradeNotification = async (req, res) => {
    try {
        const { id } = req.params; // Child's ID

        const child = await Child.findByIdAndUpdate(
            id, 
            { progressStatus: 'needs_upgrade' }, 
            { new: true }
        );
        if (!child) {
            return res.status(404).json({ message: "Child not found" });
        }

        const parent = await User.findById(child.parentId);
        if (!parent) {
            return res.status(404).json({ message: "Parent account not found" });
        }

        const emailSubject = `Action Required: Upgrade ${child.childName}'s Booxclash Account`;
        const emailBody = `
Hi ${parent.name},

Great news! ${child.childName} has completed all the free lessons and is ready to continue their learning adventure.

To unlock all lessons, please upgrade to premium for only K95 per month.

--- Mobile Money Payment Instructions ---
1. Amount: K95
2. Pay to Number: 0967001972 or 0978933791
3. Account Name: Booxclash Learn LTD
4. IMPORTANT: After paying, please forward the confirmation message to the same number you paid to.

We will activate the account as soon as we confirm the payment.

Thank you,
The Booxclash Team
        `;
        await sendEmail(parent.email, emailSubject, emailBody.trim());

        if (parent.phone) {
            const formattedPhoneNumber = formatPhoneNumberE164(parent.phone);
            
            if (formattedPhoneNumber) {
                const smsBody = `Hi ${parent.name}, ${child.childName} has completed the free lessons on Booxclash! To upgrade for K95/month, please check your email for mobile money instructions.`;
                await sendSms(formattedPhoneNumber, smsBody);
            } else {
                console.error(`Could not format invalid phone number: ${parent.phone}`);
            }
        }

        return res.status(200).json({
            success: true,
            message: "Upgrade notification processed successfully.",
        });

    } catch (error) {
        console.error("Error processing upgrade request:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getChildById = async (req, res) => {
  try {
    const childId = req.params.id;
    const parentId = req.user.id; 

    const child = await Child.findById(childId);

    if (!child) {
      return res.status(404).json({ message: "Child not found." });
    }

    if (child.parentId.toString() !== parentId) {
      return res.status(403).json({ message: "Forbidden: You are not authorized to view this profile." });
    }

    res.status(200).json({ success: true, child: child });
  } catch (error) {
    console.error("Error fetching child by ID:", error);
    res.status(500).json({ message: "Server error" });
  }
};