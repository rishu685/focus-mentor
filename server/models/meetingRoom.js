import mongoose, { Schema } from 'mongoose';

// Participant Sub-schema
const ParticipantSchema = new Schema({
  userId: { type: String, required: false },
  name: { type: String, required: true },
  email: { type: String, required: false },
  joinedAt: { type: Date, default: Date.now },
  leftAt: { type: Date },
  role: { 
    type: String, 
    enum: ['host', 'moderator', 'participant'], 
    default: 'participant' 
  },
  isAudioEnabled: { type: Boolean, default: true },
  isVideoEnabled: { type: Boolean, default: true },
  isScreenSharing: { type: Boolean, default: false }
});

// Chat Message Sub-schema
const ChatMessageSchema = new Schema({
  id: { type: String, required: true },
  participantId: { type: String, required: true },
  participantName: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  type: { type: String, enum: ['text', 'file', 'system'], default: 'text' }
});

// Meeting Summary Sub-schema
const MeetingSummarySchema = new Schema({
  generatedAt: { type: Date, default: Date.now },
  duration: { type: Number, required: true }, // in minutes
  participantCount: { type: Number, required: true },
  keyPoints: [{ type: String }],
  actionItems: [{ type: String }],
  decisions: [{ type: String }],
  nextSteps: [{ type: String }],
  topics: [{ type: String }],
  fullSummary: { type: String, required: true },
  transcript: { type: String },
  aiInsights: { type: String, required: true }
});

// Main Meeting Room Schema
const MeetingRoomSchema = new Schema({
  roomId: { 
    type: String, 
    unique: true
  },
  title: { type: String, required: true },
  description: { type: String },
  createdBy: { type: String, required: true }, // User ID
  createdAt: { type: Date, default: Date.now },
  scheduledAt: { type: Date },
  endedAt: { type: Date },
  status: { 
    type: String, 
    enum: ['scheduled', 'active', 'ended'], 
    default: 'scheduled' 
  },
  participants: [ParticipantSchema],
  maxParticipants: { type: Number, default: 10 },
  settings: {
    allowChat: { type: Boolean, default: true },
    allowScreenShare: { type: Boolean, default: true },
    recordMeeting: { type: Boolean, default: false },
    requireApproval: { type: Boolean, default: false }
  },
  meetingSummary: MeetingSummarySchema,
  chatMessages: [ChatMessageSchema],
  isPrivate: { type: Boolean, default: false },
  password: { type: String }
});

// Indexes for better performance
MeetingRoomSchema.index({ roomId: 1 });
MeetingRoomSchema.index({ createdBy: 1 });
MeetingRoomSchema.index({ status: 1 });
MeetingRoomSchema.index({ createdAt: -1 });

// Methods
MeetingRoomSchema.methods.addParticipant = function(participant) {
  this.participants.push(participant);
  return this.save();
};

MeetingRoomSchema.methods.removeParticipant = function(participantId) {
  const participant = this.participants.find(p => p.userId === participantId || p.name === participantId);
  if (participant) {
    participant.leftAt = new Date();
  }
  return this.save();
};

MeetingRoomSchema.methods.addChatMessage = function(message) {
  this.chatMessages.push(message);
  return this.save();
};

MeetingRoomSchema.methods.updateStatus = function(status) {
  this.status = status;
  if (status === 'ended') {
    this.endedAt = new Date();
  }
  return this.save();
};

// Static methods
MeetingRoomSchema.statics.findByRoomId = function(roomId) {
  return this.findOne({ roomId });
};

MeetingRoomSchema.statics.findActiveRooms = function() {
  return this.find({ status: 'active' });
};

MeetingRoomSchema.statics.findUserRooms = function(userId) {
  return this.find({ 
    $or: [
      { createdBy: userId },
      { 'participants.userId': userId }
    ]
  }).sort({ createdAt: -1 });
};

// Generate unique room ID before saving
MeetingRoomSchema.pre('save', function(next) {
  if (this.isNew && !this.roomId) {
    this.roomId = generateRoomId();
  }
  next();
});

function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default mongoose.model('MeetingRoom', MeetingRoomSchema);