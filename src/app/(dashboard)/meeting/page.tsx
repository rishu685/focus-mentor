'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, CheckCircle, Video, Users } from 'lucide-react';

export default function MeetingPage() {
  const [roomTitle, setRoomTitle] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const generateCode = async () => {
    if (!roomTitle.trim()) {
      alert('Please enter a meeting title first');
      return;
    }

    setIsCreating(true);
    
    try {
      // Create meeting room via frontend API
      const response = await fetch('/api/meeting-rooms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: roomTitle,
          description: `Meeting room for ${roomTitle}`,
          createdBy: 'user123', // In a real app, this would come from authentication
          hostName: 'Host',
          maxParticipants: 10,
          settings: {
            allowChat: true,
            allowScreenShare: true,
            recordMeeting: false,
            requireApproval: false
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setRoomCode(data.data.roomId);
        setShowCode(true);
        setCopied(false);
      } else {
        alert(`Error creating meeting: ${data.message}`);
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      alert('Failed to create meeting. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const joinMeeting = () => {
    if (roomCode) {
      window.location.href = `/meeting/${roomCode}`;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center flex items-center justify-center gap-2">
        <Video className="h-8 w-8 text-blue-600" />
        Meeting Rooms
      </h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Create Meeting Section */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Create New Meeting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="room-title">Meeting Title</Label>
              <Input
                id="room-title"
                placeholder="Enter meeting title"
                value={roomTitle}
                onChange={(e) => setRoomTitle(e.target.value)}
                className="text-lg"
              />
            </div>

            <Button 
              onClick={generateCode} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-3"
              disabled={!roomTitle.trim() || isCreating}
            >
              {isCreating ? 'Creating Meeting...' : 'Create Meeting'}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Code Section */}
        <Card className={`w-full transition-all duration-300 ${showCode ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className={`h-5 w-5 ${showCode ? 'text-green-600' : 'text-gray-400'}`} />
              Meeting Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showCode ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">No meeting created yet</p>
                <p className="text-sm text-gray-400">Create a meeting to get your room code</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-semibold text-green-800 mb-2 text-lg">🎉 Meeting Ready!</h3>
                  <p className="text-sm text-gray-700 mb-3">
                    <strong>&ldquo;{roomTitle}&rdquo;</strong>
                  </p>
                </div>
                
                {/* Large Room Code Display */}
                <div className="bg-white border-2 border-green-300 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Room Code:</p>
                  <div className="font-mono text-3xl font-bold text-green-700 tracking-wider mb-2">
                    {roomCode}
                  </div>
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    size="sm"
                    className="text-green-700 border-green-300 hover:bg-green-100"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy Code
                      </>
                    )}
                  </Button>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={joinMeeting}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Start Meeting
                  </Button>
                  <p className="text-xs text-center text-gray-600">
                    Share the room code with participants to invite them
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Join Meeting Section */}
      <Card className="w-full mt-6">
        <CardHeader>
          <CardTitle>Join Existing Meeting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter room code (e.g., ABC123XY)"
              className="flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const code = (e.target as HTMLInputElement).value.trim().toUpperCase();
                  if (code) {
                    window.location.href = `/meeting/${code}`;
                  }
                }
              }}
            />
            <Button 
              onClick={() => {
                const input = document.querySelector('input[placeholder*="Enter room code"]') as HTMLInputElement;
                const code = input?.value.trim().toUpperCase();
                if (code) {
                  window.location.href = `/meeting/${code}`;
                } else {
                  alert('Please enter a room code');
                }
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Join
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}