'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function MeetingPage() {
  const [roomTitle, setRoomTitle] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [showCode, setShowCode] = useState(false);

  const generateCode = () => {
    if (!roomTitle.trim()) {
      alert('Please enter a meeting title first');
      return;
    }

    // Generate simple 8-character code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    setRoomCode(code);
    setShowCode(true);
    
    // Copy to clipboard
    navigator.clipboard.writeText(code);
    alert(`Meeting code generated: ${code}\nCopied to clipboard!`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Meeting Rooms</h1>
      
      <Card className="w-full">
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
              className="text-lg"
            />
          </div>

          <Button 
            onClick={generateCode} 
            className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-3"
            disabled={!roomTitle.trim()}
          >
            Generate Meeting Code
          </Button>
          
          {showCode && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">🎉 Meeting Created!</h3>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Title:</strong> {roomTitle}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Room Code:</strong> 
                <span className="font-mono bg-white px-2 py-1 rounded ml-2 text-lg">
                  {roomCode}
                </span>
              </p>
              <p className="text-xs text-gray-600">
                Share this code with participants to join the meeting
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}