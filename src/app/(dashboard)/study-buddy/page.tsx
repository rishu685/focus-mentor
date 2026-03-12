'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Brain, BookOpen, Target, Send, RotateCcw, Copy, ThumbsUp } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface StudyContext {
  currentSubject: string;
  studyGoals: string[];
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  currentTopic: string;
  difficultyLevel: number;
  timeAvailable: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  messageType: 'question' | 'explanation' | 'encouragement' | 'quiz' | 'suggestion';
  attachments?: unknown[];
}

export default function StudyBuddyPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [studyContext, setStudyContext] = useState<StudyContext | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [buddyPersonality, setBuddyPersonality] = useState<'encouraging' | 'challenging' | 'patient' | 'analytical'>('encouraging');
  const [conversationStarted, setConversationStarted] = useState(false);
  const [syllabusInfo, setSyllabusInfo] = useState<{ university?: string; course?: string; available: boolean }>({ available: false });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check for active syllabus on component mount
  useEffect(() => {
    const checkSyllabus = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/syllabus/active/${session.user.id || session.user.email}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.university) {
            setSyllabusInfo({ 
              university: data.university, 
              course: data.course, 
              available: true 
            });
          } else {
            setSyllabusInfo({ available: false });
          }
        } else {
          setSyllabusInfo({ available: false });
        }
      } catch (error) {
        console.error('Error checking syllabus:', error);
        setSyllabusInfo({ available: false });
      }
    };
    
    checkSyllabus();
  }, [session]);

  const initializeStudyBuddy = useCallback(async () => {
    const welcomeMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Hi ${session?.user?.name || 'there'}! 👋 I'm your AI Study Buddy 🤖📚 

I'm here to help you learn more effectively and make studying more engaging! Here's what I can do for you:

• 📖 **Answer questions** about any subject
• 🧠 **Explain complex concepts** in simple terms  
• 📝 **Create quizzes** to test your knowledge
• 💡 **Provide study tips** and strategies
• 🎯 **Help you stay motivated** and focused

What subject would you like to study today?`,
      timestamp: new Date(),
      messageType: 'encouragement'
    };
    
    setMessages([welcomeMessage]);
    
    // Set up personalized context based on user's study history
    await setupPersonalizedContext();
  }, [session?.user?.name]);

  useEffect(() => {
    // Initialize with welcome message
    if (!conversationStarted) {
      initializeStudyBuddy();
      setConversationStarted(true);
    }
  }, [conversationStarted, initializeStudyBuddy]);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    console.log('🚀 Starting sendMessage function');
    console.log('📝 Input message:', inputMessage);
    console.log('👤 User session:', session?.user);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
      messageType: 'question'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      console.log('📡 Making API call to /api/study-buddy...');
      
      const requestBody = {
        message: inputMessage,
        userId: session?.user?.id || 'anonymous',
        prioritizeSyllabus: syllabusInfo.available,
        context: studyContext,
        personality: buddyPersonality,
        chatHistory: messages.slice(-10), // Last 10 messages for context
        userName: session?.user?.name || 'Student'
      };
      
      console.log('📦 Request body:', requestBody);

      // Force local API call to avoid any redirect issues
      const isLocalDevelopment = window.location.hostname === 'localhost';
      const apiUrl = isLocalDevelopment 
        ? `${window.location.origin}/api/study-buddy`
        : '/api/study-buddy';
      
      console.log('🎯 API URL:', apiUrl);
      console.log('🌍 Current hostname:', window.location.hostname);

      // Get AI response using enhanced study buddy with syllabus context
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('📊 Response status:', response.status);
      console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.error('❌ Response not ok:', response.status, response.statusText);
        throw new Error(`Failed to get AI response: ${response.status} ${response.statusText}`);
      }

      console.log('🔍 Parsing response JSON...');
      const aiResponse = await response.json();
      console.log('✅ AI Response received:', aiResponse);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse.response || aiResponse.content,
        timestamp: new Date(),
        messageType: aiResponse.messageType || 'explanation'
      };

      console.log('💬 Assistant message to add:', assistantMessage);
      setMessages(prev => [...prev, assistantMessage]);

      // Show syllabus context if available
      if (aiResponse.syllabusUsed) {
        console.log('Response used syllabus context:', aiResponse.context);
      }

      // Update study context based on conversation
      if (aiResponse.updatedContext) {
        setStudyContext(aiResponse.updatedContext);
      }

      console.log('✅ Message sent successfully!');

    } catch (error) {
      console.error('❌ Error in sendMessage:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment!",
        timestamp: new Date(),
        messageType: 'explanation'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      console.log('🏁 sendMessage function completed');
    }
  };

  const setupPersonalizedContext = async () => {
    try {
      // Fetch user's study patterns and preferences
      const response = await fetch('/api/user/study-context');
      if (response.ok) {
        const context = await response.json();
        setStudyContext(context);
      }
    } catch (error) {
      console.error('Error setting up context:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setConversationStarted(false);
  };

  const handleQuickAction = (action: string) => {
    setInputMessage(action);
    inputRef.current?.focus();
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
          <MessageCircle className="w-8 h-8 text-blue-500" />
          AI Study Buddy
        </h1>
        <p className="text-gray-600">
          Your intelligent study companion powered by advanced AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-500" />
                  Chat with AI Study Buddy
                </CardTitle>
                
                <div className="flex items-center gap-2">
                  {/* Personality Selector */}
                  <select 
                    value={buddyPersonality}
                    onChange={(e) => setBuddyPersonality(e.target.value as 'encouraging' | 'challenging' | 'patient' | 'analytical')}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="encouraging">🌟 Encouraging</option>
                    <option value="challenging">💪 Challenging</option>
                    <option value="patient">😊 Patient</option>
                    <option value="analytical">🔬 Analytical</option>
                  </select>
                  
                  <Button variant="outline" size="sm" onClick={clearChat}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Study Context Display */}
              {studyContext && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary">📚 {studyContext.currentSubject}</Badge>
                  <Badge variant="secondary">🎯 {studyContext.currentTopic}</Badge>
                  <Badge variant="secondary">⏱️ {studyContext.timeAvailable}min</Badge>
                </div>
              )}
            </CardHeader>

            <CardContent className="flex-1 flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className="flex items-start gap-3 max-w-[80%]">
                      {message.role === 'assistant' && (
                        <Avatar className="w-8 h-8 mt-1">
                          <AvatarFallback className="bg-blue-500 text-white text-xs">
                            🤖
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={`rounded-lg px-4 py-3 ${
                        message.role === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : getMessageStyleByType(message.messageType)
                      }`}>
                        <div className="whitespace-pre-wrap text-sm">
                          {message.content}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs opacity-75">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                          {message.role === 'assistant' && (
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                                onClick={() => copyMessage(message.content)}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                              >
                                <ThumbsUp className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {message.role === 'user' && (
                        <Avatar className="w-8 h-8 mt-1">
                          <AvatarImage src={session?.user?.image || undefined} />
                          <AvatarFallback className="bg-blue-500 text-white text-xs">
                            {session?.user?.name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-8 h-8 mt-1">
                        <AvatarFallback className="bg-blue-500 text-white text-xs">
                          🤖
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-gray-200 px-4 py-3 rounded-lg">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="space-y-3">
                {/* Quick Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleQuickAction("Can you quiz me on this topic?")}
                    className="text-xs"
                  >
                    📝 Quiz Me
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleQuickAction("I&apos;m feeling stuck, can you help?")}
                    className="text-xs"
                  >
                    😕 I&apos;m Stuck
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleQuickAction("Explain this concept in simpler terms")}
                    className="text-xs"
                  >
                    🧠 Simplify
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleQuickAction("Give me practice problems")}
                    className="text-xs"
                  >
                    💪 Practice
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about your studies..."
                    className="flex-1"
                    disabled={isTyping}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isTyping}
                    className="px-6"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Syllabus Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                Syllabus Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {syllabusInfo.available ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Active Syllabus</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>{syllabusInfo.university}</strong><br />
                    {syllabusInfo.course}
                  </div>
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    🎯 Responses are personalized to your curriculum
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-orange-600">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm font-medium">No Syllabus</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Upload your syllabus to get personalized study assistance aligned with your university curriculum
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.location.href = '/syllabus'}
                  >
                    Upload Syllabus
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Study Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-green-500" />
                Study Session
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Session Time:</span>
                  <span className="font-medium">00:15:32</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Questions Asked:</span>
                  <span className="font-medium">{messages.filter(m => m.role === 'user').length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Topics Covered:</span>
                  <span className="font-medium">3</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Syllabus Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                Syllabus Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-800">University Context Active</span>
                  </div>
                  <p className="text-xs text-blue-600">
                    Upload your syllabus to get personalized study assistance aligned with your university curriculum
                  </p>
                </div>
                <div className="text-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.location.href = '/syllabus'}
                  >
                    Upload Syllabus
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>          {/* AI Capabilities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                AI Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Subject Explanations</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Practice Questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Study Strategies</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Motivation & Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Concept Simplification</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Exam Preparation</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-orange-500" />
                Study Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <p>💡 Be specific with your questions</p>
                <p>📚 Ask for examples and practice problems</p>
                <p>🔄 Request different explanations if confused</p>
                <p>🎯 Set clear learning goals</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function getMessageStyleByType(type: string): string {
  switch (type) {
    case 'encouragement': return 'bg-green-50 text-green-800 border border-green-200';
    case 'quiz': return 'bg-yellow-50 text-yellow-800 border border-yellow-200';
    case 'explanation': return 'bg-blue-50 text-blue-800 border border-blue-200';
    case 'suggestion': return 'bg-purple-50 text-purple-800 border border-purple-200';
    default: return 'bg-gray-50 text-gray-800 border border-gray-200';
  }
}
