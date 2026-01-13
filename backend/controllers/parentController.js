import User from "../models/User.js";
import Child from "../models/Child.js";
import mongoose from "mongoose";

// GET all parents with their child data
export const getAllParents = async (req, res) => {
    try {
        const parents = await User.aggregate([
            { $match: { role: 'parent' } },
            {
                $lookup: {
                    from: 'children',
                    localField: '_id',
                    foreignField: 'parentId',
                    as: 'children'
                }
            },
            {
                $addFields: {
                    childCount: { $size: '$children' }
                }
            },
            {
                $project: {
                    password: 0,
                    'children.lessonsCompleted': 0,
                    'children.updatedAt': 0,
                    'children.createdAt': 0,
                    'children.parentId': 0,
                }
            }
        ]);
        res.status(200).json(parents);
    } catch (error) {
        console.error("Failed to fetch parents:", error);
        res.status(500).json({ error: "Server error while fetching parents." });
    }
};


// --- NEW: Function to Delete a Parent and their Children ---
export const deleteParent = async (req, res) => {
    try {
        const parentId = req.params.id;

        const parent = await User.findById(parentId);
        if (!parent) {
            return res.status(404).json({ error: "Parent not found." });
        }

        await Child.deleteMany({ parentId: parentId });
        await User.findByIdAndDelete(parentId);

        res.status(200).json({ success: true, message: "Parent and all associated children have been deleted." });
    } catch (error) {
        console.error("Failed to delete parent:", error);
        res.status(500).json({ error: "Server error while deleting parent." });
    }
};


// Helper function to get a single parent's full data (used after update)
const getFullParentDataById = async (id) => {
    const parentId = new mongoose.Types.ObjectId(id);
    const parentData = await User.aggregate([
        { $match: { _id: parentId } },
        { $lookup: { from: 'children', localField: '_id', foreignField: 'parentId', as: 'children' } },
        { $addFields: { childCount: { $size: '$children' } } },
        { $project: { password: 0, 'children.lessonsCompleted': 0, 'children.updatedAt': 0, } }
    ]);
    const parent = parentData[0];
    if (parent) {
        parent.needsUpgrade = parent.children.some((child) => child.progressStatus === 'needs_upgrade');
    }
    return parent;
};

