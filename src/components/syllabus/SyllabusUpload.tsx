"use client";

import React, { useState } from 'react';
import { Upload, FileText, University, BookOpen, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SyllabusUploadProps {
  userId: string;
  onUploadSuccess?: (syllabus: unknown) => void;
}

export default function SyllabusUpload({ userId, onUploadSuccess }: SyllabusUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [university, setUniversity] = useState('');
  const [course, setCourse] = useState('');
  const [semester, setSemester] = useState('');
  const [year, setYear] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [generatingResources, setGeneratingResources] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf' || selectedFile.type === 'text/plain') {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a PDF or text file');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !university || !course) {
      setError('Please fill in all required fields and select a file');
      return;
    }

    if (!userId || userId.trim() === '') {
      setError('Please log in to upload a syllabus');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('syllabusFile', file);
    formData.append('userId', userId);
    formData.append('university', university);
    formData.append('course', course);
    formData.append('semester', semester);
    formData.append('year', year);

    try {
      const response = await fetch('/api/syllabus/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setFile(null);
        setUniversity('');
        setCourse('');
        setSemester('');
        setYear('');
        
        // Automatically generate resources for the uploaded syllabus course
        if (course.trim()) {
          setGeneratingResources(true);
          try {
            const resourceResponse = await fetch('/api/resources/curate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                subject: course,
                userId: userId,
                difficulty: 'intermediate',
                type: 'mixed',
                prioritizeSyllabus: true
              }),
            });
            
            if (resourceResponse.ok) {
              console.log('Resources generated automatically for uploaded syllabus');
            }
          } catch (resourceError) {
            console.log('Could not auto-generate resources, but syllabus uploaded successfully');
          } finally {
            setGeneratingResources(false);
          }
        }
        
        if (onUploadSuccess) {
          onUploadSuccess(result);
        }
        // Reset success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          setError('Unable to connect to server. Please check your internet connection and try again.');
        } else if (err.message.includes('HTTP error! status: 500')) {
          setError('Server error occurred. Please try again later.');
        } else if (err.message.includes('HTTP error! status: 400')) {
          setError('Invalid request. Please check your file and try again.');
        } else {
          setError(err.message || 'An error occurred while uploading. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.type === 'application/pdf' || droppedFile.type === 'text/plain') {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Please select a PDF or text file');
      }
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <University className="w-5 h-5" />
          Upload University Syllabus
        </CardTitle>
        <CardDescription>
          Upload your university syllabus to get personalized study plans and resources tailored to your curriculum
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Syllabus uploaded and analyzed successfully! Your AI study buddy is now aware of your curriculum.
            </AlertDescription>
          </Alert>
        )}

        {generatingResources && (
          <Alert className="border-blue-200 bg-blue-50">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <AlertDescription className="text-blue-800 ml-2">
              Generating study resources for {course}... This may take a few moments.
            </AlertDescription>
          </Alert>
        )}

        {/* University Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="university">University *</Label>
            <Input
              id="university"
              placeholder="e.g., Stanford University"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="course">Course *</Label>
            <Input
              id="course"
              placeholder="e.g., Computer Science"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="semester">Semester (Optional)</Label>
            <Input
              id="semester"
              placeholder="e.g., Fall 2024"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Year (Optional)</Label>
            <Input
              id="year"
              placeholder="e.g., 2024"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
        </div>

        {/* File Upload Area */}
        <div className="space-y-4">
          <Label>Syllabus File *</Label>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-12 h-12 text-green-600" />
                <div className="font-medium text-green-800">{file.name}</div>
                <div className="text-sm text-green-600">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <Upload className="w-12 h-12 text-gray-400" />
                <div>
                  <div className="font-medium">Drop your syllabus here</div>
                  <div className="text-sm text-gray-500">or click to browse</div>
                </div>
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <Label
                  htmlFor="file-upload"
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Select File
                </Label>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-500">
            Supported formats: PDF, TXT (max 10MB)
          </div>
        </div>

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!file || !university || !course || uploading || generatingResources}
          className="w-full"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Analyzing Syllabus...
            </>
          ) : generatingResources ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating Resources...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload & Analyze Syllabus
            </>
          )}
        </Button>

        <div className="text-xs text-gray-500">
          * Required fields. The AI will analyze your syllabus and extract key topics to personalize your study experience.
        </div>
      </CardContent>
    </Card>
  );
}