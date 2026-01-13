import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// A cleaner, more focused schema for your User model (Parents, Admins, etc.)
const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true 
    },
    email: {
      type: String,
      required: true,
      unique: true, // Every parent/admin must have a unique email
      lowercase: true,
    },
    phone: {
      type: String,
      // You might want to make this unique and sparse if you require it
    },
    password: { 
      type: String, 
      required: true 
    },
    role: {
      type: String,
      required: true,
      enum: ["parent", "admin", "superadmin"],
      default: "parent",
    },
    isApproved: {
      type: Boolean,
      // Only admins need approval. Parents are approved by default.
      default: function() {
        return this.role !== 'admin';
      }
    },
    profilePic: { 
      type: String, 
      default: "" 
    },
    subscription: {
      plan: {
        type: String,
        enum: ['none', 'one_child', 'family', 'school'],
        default: 'none',
      },
      status: {
        type: String,
        enum: ['active', 'inactive', 'pending', 'cancelled'],
        default: 'inactive',
      },
      stripeCustomerId: { type: String }, // For integrating with payment systems
      endDate: { type: Date },
    },
  },
  { timestamps: true }
);

// --- METHODS ---
// Hash password before saving a new user
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to compare entered password with the hashed password in the database
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// This is the standard way to create and export a Mongoose model
const User = mongoose.model("User", userSchema);

export default User;
