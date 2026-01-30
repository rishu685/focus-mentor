"use client";

import React from 'react';
import { University, Brain, BookOpen, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SyllabusUpload from '@/components/syllabus/SyllabusUpload';
import SyllabusManager from '@/components/syllabus/SyllabusManager';

export default function SyllabusPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect to signin if not authenticated
  if (status === 'loading') {
    return <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (status === 'unauthenticated') {
    router.push('/signin');
    return null;
  }

  const userId = session?.user?.id || '';

  if (!userId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to access syllabus features</p>
          <p className="text-sm text-gray-500">
            Session status: {status}<br/>
            User ID: {session?.user?.id || 'undefined'}<br/>
            User email: {session?.user?.email || 'undefined'}
          </p>
        </div>
      </div>
    );
  }

  const handleUploadSuccess = () => {
    // Refresh the syllabus manager when a new syllabus is uploaded
    window.location.reload(); // Simple refresh - could be improved with state management
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
          <University className="w-8 h-8 text-blue-600" />
          University Syllabus Management
        </h1>
        <p className="text-lg text-gray-600">
          Upload your university syllabus to get AI-powered study plans and resources tailored to your specific curriculum
        </p>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="w-5 h-5 text-blue-600" />
              Smart AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Our AI analyzes your syllabus to understand course structure, key topics, and difficulty levels
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="w-5 h-5 text-green-600" />
              Personalized Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Get study materials and resources specifically curated for your university and course requirements
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-purple-600" />
              Targeted Study Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Create study plans aligned with your curriculum topics, weightage, and university standards
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Upload New Syllabus</h2>
            <p className="text-gray-600">
              Upload your course syllabus to enable university-specific AI assistance
            </p>
          </div>
          <SyllabusUpload 
            userId={userId}
            onUploadSuccess={handleUploadSuccess}
          />
        </div>

        {/* Management Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Your Syllabi</h2>
            <p className="text-gray-600">
              View and manage your uploaded syllabi. Set one as active to personalize your study experience.
            </p>
          </div>
          <SyllabusManager 
            userId={userId}
            onSyllabusChange={() => {
              // Handle syllabus changes if needed
              console.log('Syllabus changed');
            }}
          />
        </div>
      </div>

      {/* How it Works */}
      <div className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle>How University Syllabus Integration Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3">
                  1
                </div>
                <h4 className="font-semibold mb-2">Upload</h4>
                <p className="text-sm text-gray-600">
                  Upload your university syllabus in PDF or text format
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3">
                  2
                </div>
                <h4 className="font-semibold mb-2">Analyze</h4>
                <p className="text-sm text-gray-600">
                  AI extracts subjects, topics, weightage, and course structure
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3">
                  3
                </div>
                <h4 className="font-semibold mb-2">Activate</h4>
                <p className="text-sm text-gray-600">
                  Set as active to enable university-specific AI assistance
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3">
                  4
                </div>
                <h4 className="font-semibold mb-2">Study</h4>
                <p className="text-sm text-gray-600">
                  Get personalized study plans and resources aligned with your curriculum
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Pro Tip</h4>
              <p className="text-blue-700 text-sm">
                When you have an active syllabus, your AI Study Buddy will provide more targeted responses, 
                and the Resource Curator will prioritize materials from your university and course curriculum.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}