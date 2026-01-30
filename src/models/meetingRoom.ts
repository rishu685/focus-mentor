import mongoose, { Document } from 'mongoose';

// Meeting Room TypeScript Interface
export interface IMeetingRoom extends Document {
  _id: mongoose.Types.ObjectId;
  roomId: string;
  title: string;
  description?: string;
  createdBy: string; // User ID
  createdAt: Date;
  scheduledAt?: Date;
  endedAt?: Date;
  status: 'scheduled' | 'active' | 'ended';
  participants: IParticipant[];
  maxParticipants: number;
  settings: {
    allowChat: boolean;
    allowScreenShare: boolean;
    recordMeeting: boolean;
    requireApproval: boolean;
  };
  meetingSummary?: IMeetingSummary;
  chatMessages: IChatMessage[];
  isPrivate: boolean;
  password?: string;
}

// Participant Interface
export interface IParticipant {
  userId?: string; // Registered user ID (optional for guests)
  name: string;
  email?: string;
  joinedAt: Date;
  leftAt?: Date;
  role: 'host' | 'moderator' | 'participant';
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
}

// Chat Message Interface
export interface IChatMessage {
  id: string;
  participantId: string;
  participantName: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'file' | 'system';
}

// Meeting Summary Interface
export interface IMeetingSummary {
  generatedAt: Date;
  duration: number; // in minutes
  participantCount: number;
  keyPoints: string[];
  actionItems: string[];
  decisions: string[];
  nextSteps: string[];
  topics: string[];
  fullSummary: string;
  transcript?: string;
  aiInsights: string;
}

// Frontend Types for API responses
export interface CreateRoomRequest {
  title: string;
  description?: string;
  scheduledAt?: string;
  maxParticipants?: number;
  settings?: {
    allowChat?: boolean;
    allowScreenShare?: boolean;
    recordMeeting?: boolean;
    requireApproval?: boolean;
  };
  isPrivate?: boolean;
  password?: string;
}

export interface JoinRoomRequest {
  roomId: string;
  participantName: string;
  password?: string;
}

export interface SendMessageRequest {
  roomId: string;
  message: string;
  participantId: string;
}

export interface GenerateSummaryRequest {
  roomId: string;
  transcript: string;
  chatMessages: IChatMessage[];
}

export interface RoomResponse {
  success: boolean;
  data?: IMeetingRoom;
  message?: string;
  roomUrl?: string;
}

export interface ParticipantUpdate {
  participantId: string;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
  screenSharing?: boolean;
}

// WebRTC Signaling Types
export interface SignalData {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join' | 'leave' | 'participant-update';
  roomId: string;
  participantId: string;
  data?: unknown;
  targetParticipantId?: string;
}

export interface WebRTCConfig {
  iceServers: {
    urls: string[];
    username?: string;
    credential?: string;
  }[];
}