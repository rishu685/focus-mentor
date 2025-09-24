import express from 'express';
import MeetingRoom from '../models/meetingRoom.js';
import { generateMeetingSummary } from '../services/aiService.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all meeting rooms
router.get('/', async (req, res) => {
  try {
    const { status, userId, limit = 20, page = 1 } = req.query;
    
    // Build query filter
    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.createdBy = userId;
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get meeting rooms with pagination
    const meetingRooms = await MeetingRoom.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('participants.userId', 'name email')
      .select('-password'); // Exclude password field for security
    
    // Get total count for pagination
    const total = await MeetingRoom.countDocuments(filter);
    
    res.json({
      success: true,
      data: meetingRooms,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching meeting rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meeting rooms',
      error: error.message
    });
  }
});

// Create a new meeting room
router.post('/create', async (req, res) => {
  try {
    const {
      title,
      description,
      scheduledAt,
      maxParticipants = 10,
      settings = {},
      isPrivate = false,
      password,
      createdBy
    } = req.body;

    // Validate required fields
    if (!title || !createdBy) {
      return res.status(400).json({
        success: false,
        message: 'Title and createdBy are required'
      });
    }

    // Create new meeting room
    const meetingRoom = new MeetingRoom({
      title,
      description,
      createdBy,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      maxParticipants,
      settings: {
        allowChat: settings.allowChat !== undefined ? settings.allowChat : true,
        allowScreenShare: settings.allowScreenShare !== undefined ? settings.allowScreenShare : true,
        recordMeeting: settings.recordMeeting !== undefined ? settings.recordMeeting : false,
        requireApproval: settings.requireApproval !== undefined ? settings.requireApproval : false
      },
      isPrivate,
      password: isPrivate ? password : undefined,
      participants: [{
        userId: createdBy,
        name: req.body.hostName || 'Host',
        role: 'host',
        joinedAt: new Date(),
        isAudioEnabled: true,
        isVideoEnabled: true,
        isScreenSharing: false
      }]
    });

    const savedRoom = await meetingRoom.save();

    res.status(201).json({
      success: true,
      data: savedRoom,
      roomUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/meeting/${savedRoom.roomId}`,
      message: 'Meeting room created successfully'
    });

  } catch (error) {
    console.error('Error creating meeting room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create meeting room',
      error: error.message
    });
  }
});

// Join a meeting room
router.post('/join', async (req, res) => {
  try {
    const { roomId, participantName, password, userId } = req.body;

    if (!roomId || !participantName) {
      return res.status(400).json({
        success: false,
        message: 'Room ID and participant name are required'
      });
    }

    const room = await MeetingRoom.findByRoomId(roomId);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Meeting room not found'
      });
    }

    // Check if room is ended
    if (room.status === 'ended') {
      return res.status(400).json({
        success: false,
        message: 'This meeting has ended'
      });
    }

    // Check password for private rooms
    if (room.isPrivate && room.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password for private room'
      });
    }

    // Check room capacity
    const activeParticipants = room.participants.filter(p => !p.leftAt);
    if (activeParticipants.length >= room.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Meeting room is full'
      });
    }

    // Check if participant already joined
    const existingParticipant = room.participants.find(p => 
      (userId && p.userId === userId) || 
      (!userId && p.name === participantName && !p.leftAt)
    );

    if (existingParticipant && !existingParticipant.leftAt) {
      return res.status(400).json({
        success: false,
        message: 'You are already in this meeting'
      });
    }

    // Add participant to room
    const newParticipant = {
      userId: userId || undefined,
      name: participantName,
      joinedAt: new Date(),
      role: 'participant',
      isAudioEnabled: true,
      isVideoEnabled: true,
      isScreenSharing: false
    };

    room.participants.push(newParticipant);
    
    // Update room status to active if first participant joins
    if (room.status === 'scheduled') {
      room.status = 'active';
    }

    await room.save();

    res.status(200).json({
      success: true,
      data: room,
      participantId: newParticipant.userId || participantName,
      message: 'Successfully joined the meeting'
    });

  } catch (error) {
    console.error('Error joining meeting room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join meeting room',
      error: error.message
    });
  }
});

// Get meeting room details
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const room = await MeetingRoom.findByRoomId(roomId);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Meeting room not found'
      });
    }

    // Remove sensitive information
    const roomData = room.toObject();
    if (roomData.isPrivate) {
      delete roomData.password;
    }

    res.status(200).json({
      success: true,
      data: roomData
    });

  } catch (error) {
    console.error('Error fetching meeting room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meeting room',
      error: error.message
    });
  }
});

// Leave meeting room
router.post('/leave', async (req, res) => {
  try {
    const { roomId, participantId } = req.body;

    if (!roomId || !participantId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID and participant ID are required'
      });
    }

    const room = await MeetingRoom.findByRoomId(roomId);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Meeting room not found'
      });
    }

    // Find and update participant
    const participant = room.participants.find(p => 
      p.userId === participantId || p.name === participantId
    );

    if (participant && !participant.leftAt) {
      participant.leftAt = new Date();
      await room.save();
    }

    res.status(200).json({
      success: true,
      message: 'Successfully left the meeting'
    });

  } catch (error) {
    console.error('Error leaving meeting room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave meeting room',
      error: error.message
    });
  }
});

// Add chat message
router.post('/chat', async (req, res) => {
  try {
    const { roomId, message, participantId, participantName } = req.body;

    if (!roomId || !message || !participantId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID, message, and participant ID are required'
      });
    }

    const room = await MeetingRoom.findByRoomId(roomId);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Meeting room not found'
      });
    }

    if (!room.settings.allowChat) {
      return res.status(403).json({
        success: false,
        message: 'Chat is disabled for this meeting'
      });
    }

    const chatMessage = {
      id: uuidv4(),
      participantId,
      participantName: participantName || 'Unknown',
      message,
      timestamp: new Date(),
      type: 'text'
    };

    room.chatMessages.push(chatMessage);
    await room.save();

    res.status(200).json({
      success: true,
      data: chatMessage,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Error sending chat message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});

// End meeting room
router.post('/end', async (req, res) => {
  try {
    const { roomId, participantId } = req.body;

    if (!roomId || !participantId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID and participant ID are required'
      });
    }

    const room = await MeetingRoom.findByRoomId(roomId);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Meeting room not found'
      });
    }

    // Check if participant is host
    const participant = room.participants.find(p => 
      (p.userId === participantId || p.name === participantId) && p.role === 'host'
    );

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'Only the host can end the meeting'
      });
    }

    // End the meeting
    room.status = 'ended';
    room.endedAt = new Date();

    // Mark all active participants as left
    room.participants.forEach(p => {
      if (!p.leftAt) {
        p.leftAt = new Date();
      }
    });

    await room.save();

    res.status(200).json({
      success: true,
      message: 'Meeting ended successfully'
    });

  } catch (error) {
    console.error('Error ending meeting room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end meeting room',
      error: error.message
    });
  }
});

// Generate AI meeting summary
router.post('/summary', async (req, res) => {
  try {
    const { roomId, transcript, additionalNotes } = req.body;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }

    const room = await MeetingRoom.findByRoomId(roomId);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Meeting room not found'
      });
    }

    if (room.status !== 'ended') {
      return res.status(400).json({
        success: false,
        message: 'Can only generate summary for ended meetings'
      });
    }

    // Calculate meeting duration
    const duration = room.endedAt && room.createdAt ? 
      Math.round((room.endedAt - room.createdAt) / (1000 * 60)) : 0;

    // Prepare content for AI analysis
    const chatContent = room.chatMessages
      .map(msg => `${msg.participantName}: ${msg.message}`)
      .join('\n');

    const contentForAnalysis = `
    Meeting: ${room.title}
    Duration: ${duration} minutes
    Participants: ${room.participants.map(p => p.name).join(', ')}
    
    Chat Messages:
    ${chatContent}
    
    ${transcript ? `Transcript:\n${transcript}` : ''}
    
    ${additionalNotes ? `Additional Notes:\n${additionalNotes}` : ''}
    `;

    // Generate AI summary
    const summary = await generateMeetingSummary(contentForAnalysis);

    const meetingSummary = {
      generatedAt: new Date(),
      duration,
      participantCount: room.participants.length,
      keyPoints: summary.keyPoints || [],
      actionItems: summary.actionItems || [],
      decisions: summary.decisions || [],
      nextSteps: summary.nextSteps || [],
      topics: summary.topics || [],
      fullSummary: summary.fullSummary || '',
      transcript: transcript || '',
      aiInsights: summary.insights || ''
    };

    room.meetingSummary = meetingSummary;
    await room.save();

    res.status(200).json({
      success: true,
      data: meetingSummary,
      message: 'Meeting summary generated successfully'
    });

  } catch (error) {
    console.error('Error generating meeting summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate meeting summary',
      error: error.message
    });
  }
});

// Get user's meeting rooms
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    const query = {
      $or: [
        { createdBy: userId },
        { 'participants.userId': userId }
      ]
    };

    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const rooms = await MeetingRoom.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MeetingRoom.countDocuments(query);

    res.status(200).json({
      success: true,
      data: rooms,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching user meeting rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meeting rooms',
      error: error.message
    });
  }
});

export default router;