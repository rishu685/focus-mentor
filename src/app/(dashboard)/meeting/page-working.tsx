'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function MeetingPage() {
  const [roomId, setRoomId] = useState('');
  const [roomTitle, setRoomTitle] = useState('');

  const createRoom = () => {
    // For now, just show an alert
    alert(`Creating meeting room: ${roomTitle || 'Untitled Meeting'}`);
  };

  const joinRoom = () => {
    if (roomId.trim()) {
      alert(`Joining room: ${roomId}`);
    } else {
      alert('Please enter a room ID');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Meeting Rooms</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Create Meeting Card */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Meeting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="room-title">Meeting Title</Label>
              <Input
                id="room-title"
                placeholder="Enter meeting title"
                value={roomTitle}
                onChange={(e) => setRoomTitle(e.target.value)}
              />
            </div>
            <Button onClick={createRoom} className="w-full">
              Create Meeting Room
            </Button>
          </CardContent>
        </Card>

        {/* Join Meeting Card */}
        <Card>
          <CardHeader>
            <CardTitle>Join Meeting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="room-id">Room ID</Label>
              <Input
                id="room-id"
                placeholder="Enter room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              />
            </div>
            <Button onClick={joinRoom} className="w-full">
              Join Meeting
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Features Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2">
              <li>✅ Create and join meeting rooms</li>
              <li>🔄 Video conferencing with WebRTC</li>
              <li>🔄 Real-time chat messaging</li>
              <li>🔄 Screen sharing capabilities</li>
              <li>🔄 AI-powered meeting summaries</li>
              <li>🔄 Meeting history and recordings</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}