'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Camera, CameraOff, Mic, MicOff, PhoneOff, MessageSquare, Share2 } from 'lucide-react';

interface Participant {
  userId: string;
  name: string;
  role: 'host' | 'participant';
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  joinedAt: string;
}

interface MeetingRoom {
  _id: string;
  roomId: string;
  title: string;
  description?: string;
  createdBy: string;
  status: 'scheduled' | 'active' | 'ended';
  participants: Participant[];
  maxParticipants: number;
  settings: {
    allowChat: boolean;
    allowScreenShare: boolean;
    recordMeeting: boolean;
    requireApproval: boolean;
  };
  chatMessages: ChatMessage[];
  createdAt: string;
}

interface ChatMessage {
  userId: string;
  name: string;
  message: string;
  timestamp: string;
}

export default function MeetingRoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  
  const [meetingRoom, setMeetingRoom] = useState<MeetingRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [participantName, setParticipantName] = useState('');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);

  const [meetingStartTime, setMeetingStartTime] = useState<Date | null>(null);
  const [meetingTranscript, setMeetingTranscript] = useState<string>('');

  useEffect(() => {
    if (roomId) {
      fetchMeetingRoom();
    }
    return () => {
      // Cleanup media stream when component unmounts
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [roomId]);

  // Request camera and microphone permissions
  const requestMediaPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setLocalStream(stream);
      
      // Set up video element
      if (videoRef) {
        videoRef.srcObject = stream;
      }
      
      return true;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      
      // Try audio only if video fails
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        });
        setLocalStream(audioStream);
        return true;
      } catch (audioErr) {
        console.error('Error accessing audio:', audioErr);
        setError('Unable to access camera or microphone. Please check permissions.');
        return false;
      }
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const fetchMeetingRoom = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/meeting-rooms/${roomId}`);
      const data = await response.json();
      
      if (data.success) {
        setMeetingRoom(data.data);
        setChatMessages(data.data.chatMessages || []);
      } else {
        setError(data.message || 'Failed to fetch meeting room');
      }
    } catch (err) {
      setError('Failed to connect to meeting room');
      console.error('Error fetching meeting room:', err);
    } finally {
      setLoading(false);
    }
  };

  const joinMeeting = async () => {
    if (!participantName.trim()) {
      setError('Please enter your name to join the meeting');
      return;
    }

    // Request media permissions first
    const mediaGranted = await requestMediaPermissions();
    if (!mediaGranted) {
      const proceed = confirm('Camera/microphone access failed. Join with audio/video disabled?');
      if (!proceed) return;
    }

    try {
      const response = await fetch('http://localhost:8000/meeting-rooms/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          participantName: participantName.trim(),
          userId: `user_${Date.now()}` // Generate a temporary user ID
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setHasJoined(true);
        setMeetingRoom(data.data);
        setMeetingStartTime(new Date());
        setError('');
        
        // Start meeting transcript
        setMeetingTranscript(`Meeting "${data.data.title}" started at ${new Date().toLocaleString()}\nParticipant ${participantName} joined.\n\n`);
      } else {
        setError(data.message || 'Failed to join meeting');
      }
    } catch (err) {
      setError('Failed to join meeting');
      console.error('Error joining meeting:', err);
    }
  };

  const leaveMeeting = async () => {
    try {
      const response = await fetch('http://localhost:8000/meeting-rooms/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          participantId: `user_${Date.now()}`
        }),
      });

      if (response.ok) {
        setHasJoined(false);
        setParticipantName('');
        fetchMeetingRoom(); // Refresh the room data
      }
    } catch (err) {
      console.error('Error leaving meeting:', err);
    }
  };

  const sendChatMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await fetch('http://localhost:8000/meeting-rooms/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          senderId: `user_${Date.now()}`,
          senderName: participantName,
          message: newMessage.trim()
        }),
      });

      const data = await response.json();
      if (data.success) {
        setChatMessages(data.data.chatMessages);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const copyMeetingLink = () => {
    const meetingUrl = `${window.location.origin}/meeting/${roomId}`;
    navigator.clipboard.writeText(meetingUrl);
    alert('Meeting link copied to clipboard!');
  };

  // Generate AI Meeting Summary
  const generateMeetingSummary = async () => {
    if (!meetingRoom || !meetingStartTime) {
      alert('No meeting data available for summary');
      return;
    }

    const meetingDuration = Math.round((new Date().getTime() - meetingStartTime.getTime()) / 60000); // in minutes
    
    try {
      const summaryData = {
        roomId: meetingRoom.roomId,
        title: meetingRoom.title,
        duration: meetingDuration,
        participantCount: meetingRoom.participants.length,
        participants: meetingRoom.participants.map(p => p.name),
        chatMessages: chatMessages,
        transcript: meetingTranscript + `\nMeeting ended at ${new Date().toLocaleString()}`,
        endedAt: new Date().toISOString()
      };

      const response = await fetch('http://localhost:8000/meeting-rooms/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(summaryData),
      });

      const data = await response.json();
      
      if (data.success) {
        // Display the AI summary
        const summary = data.summary;
        const summaryText = `
📋 AI Meeting Summary for "${meetingRoom.title}"

⏱️ Duration: ${meetingDuration} minutes
👥 Participants: ${meetingRoom.participants.length} (${meetingRoom.participants.map(p => p.name).join(', ')})

🎯 Key Points:
${summary.keyPoints?.map((point: string) => '• ' + point).join('\n') || 'No key points identified'}

📝 Action Items:
${summary.actionItems?.map((item: string) => '• ' + item).join('\n') || 'No action items identified'}

🔍 AI Insights:
${summary.aiInsights || 'Meeting completed successfully'}

💬 Chat Messages: ${chatMessages.length} messages exchanged
        `;
        
        alert(summaryText);
        
        // Copy summary to clipboard
        navigator.clipboard.writeText(summaryText);
        
      } else {
        alert('Failed to generate meeting summary: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error generating summary:', err);
      alert('Failed to generate meeting summary. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading meeting room...</p>
        </div>
      </div>
    );
  }

  if (error && !meetingRoom) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Meeting Room Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              onClick={fetchMeetingRoom} 
              className="w-full mt-4"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasJoined && meetingRoom) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{meetingRoom.title}</CardTitle>
            <CardDescription>
              {meetingRoom.description && (
                <p className="mb-2">{meetingRoom.description}</p>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Badge variant={meetingRoom.status === 'active' ? 'default' : 'secondary'}>
                  {meetingRoom.status}
                </Badge>
                <span>{meetingRoom.participants.length}/{meetingRoom.maxParticipants} participants</span>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="participantName">Your Name</Label>
              <Input
                id="participantName"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Enter your name"
                onKeyPress={(e) => e.key === 'Enter' && joinMeeting()}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={joinMeeting} 
                className="flex-1"
                disabled={!participantName.trim()}
              >
                Join Meeting
              </Button>
              <Button
                variant="outline"
                onClick={copyMeetingLink}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            {meetingRoom.participants.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Participants in meeting:</h4>
                <div className="space-y-1">
                  {meetingRoom.participants.map((participant, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>{participant.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span>{participant.name}</span>
                      {participant.role === 'host' && (
                        <Badge variant="outline" className="text-xs">Host</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Meeting Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-semibold">{meetingRoom?.title}</h1>
          <p className="text-sm text-gray-400">Room ID: {roomId}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={meetingRoom?.status === 'active' ? 'default' : 'secondary'}>
            {meetingRoom?.status}
          </Badge>
          <Button variant="outline" size="sm" onClick={copyMeetingLink}>
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
          <Button variant="destructive" onClick={leaveMeeting}>
            <PhoneOff className="h-4 w-4 mr-1" />
            Leave
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Main Video Area */}
        <div className="flex-1 flex flex-col">
          {/* Video Grid */}
          <div className="flex-1 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
              {meetingRoom?.participants.map((participant, index) => (
                <div key={index} className="bg-gray-700 rounded-lg relative flex items-center justify-center">
                  <div className="text-center">
                    <Avatar className="h-16 w-16 mx-auto mb-2">
                      <AvatarFallback className="text-2xl">
                        {participant.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-medium">{participant.name}</p>
                    <div className="flex justify-center gap-1 mt-1">
                      {participant.isAudioEnabled ? (
                        <Mic className="h-4 w-4 text-green-400" />
                      ) : (
                        <MicOff className="h-4 w-4 text-red-400" />
                      )}
                      {participant.isVideoEnabled ? (
                        <Camera className="h-4 w-4 text-green-400" />
                      ) : (
                        <CameraOff className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Meeting Controls */}
          <div className="bg-gray-800 p-4">
            <div className="flex justify-center gap-3 mb-3">
              <Button
                variant={isAudioEnabled ? "default" : "secondary"}
                size="lg"
                onClick={toggleAudio}
                title={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
              >
                {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>
              <Button
                variant={isVideoEnabled ? "default" : "secondary"}
                size="lg"
                onClick={toggleVideo}
                title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
              >
                {isVideoEnabled ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={copyMeetingLink}
                title="Share meeting link"
              >
                <Share2 className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowChat(!showChat)}
                title="Toggle chat"
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
            </div>
            
            {/* AI Summary and Leave Meeting */}
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={generateMeetingSummary}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                title="Generate AI meeting summary"
              >
                🤖 Generate AI Summary
              </Button>
              <Button 
                variant="destructive" 
                onClick={leaveMeeting}
                title="Leave meeting"
              >
                <PhoneOff className="h-4 w-4 mr-1" />
                Leave Meeting
              </Button>
            </div>
            
            {/* Local Video Preview */}
            {localStream && (
              <div className="mt-4 flex justify-center">
                <div className="relative">
                  <video
                    ref={(ref) => {
                      setVideoRef(ref);
                      if (ref && localStream) {
                        ref.srcObject = localStream;
                      }
                    }}
                    autoPlay
                    muted
                    playsInline
                    className="w-32 h-24 bg-gray-700 rounded-lg"
                    style={{ transform: 'scaleX(-1)' }} // Mirror effect
                  />
                  <div className="absolute bottom-1 left-1 text-xs text-white bg-black bg-opacity-50 px-1 rounded">
                    You
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat
              </h3>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {chatMessages.map((msg, index) => (
                <div key={index} className="text-sm">
                  <div className="font-medium text-blue-300">{msg.name}</div>
                  <div className="text-gray-300">{msg.message}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="bg-gray-700 border-gray-600"
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                />
                <Button onClick={sendChatMessage} disabled={!newMessage.trim()}>
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}