"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { FileText, University, Calendar, CheckCircle, Trash2, Eye, BookOpen, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Syllabus {
  _id: string;
  university: string;
  course: string;
  semester?: string;
  year?: string;
  originalName: string;
  subjects: Array<{
    name: string;
    topics: string[];
    weightage?: string;
    description?: string;
  }>;
  aiAnalysis: {
    overview: string;
    keyTopics: string[];
    difficulty: string;
    recommendations: string[];
    estimatedHours: number;
  };
  isActive: boolean;
  createdAt: string;
}

interface SyllabusManagerProps {
  userId: string;
  onSyllabusChange?: () => void;
}

export default function SyllabusManager({ userId, onSyllabusChange }: SyllabusManagerProps) {
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSyllabus, setSelectedSyllabus] = useState<Syllabus | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSyllabi = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`/api/syllabus/user/${userId}`);
      const result = await response.json();
      
      if (response.ok && Array.isArray(result)) {
        setSyllabi(result);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch syllabi');
        setSyllabi([]);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Fetch error:', err);
      setSyllabi([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSyllabi();
  }, [fetchSyllabi]);

  const activateSyllabus = async (syllabusId: string) => {
    try {
      const response = await fetch(`/api/syllabus/${syllabusId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        await fetchSyllabi();
        if (onSyllabusChange) onSyllabusChange();
        setError(null);
      } else {
        setError(result.error || 'Failed to activate syllabus');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Activate error:', err);
    }
  };

  const deleteSyllabus = async (syllabusId: string) => {
    if (!confirm('Are you sure you want to delete this syllabus?')) return;
    
    setDeletingId(syllabusId);
    try {
      const response = await fetch(`/api/syllabus/${syllabusId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // Immediately update UI by removing the deleted syllabus
        setSyllabi(prev => prev.filter(s => s._id !== syllabusId));
        if (onSyllabusChange) onSyllabusChange();
        setError(null);
      } else {
        setError(result.error || 'Failed to delete syllabus');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {syllabi.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Syllabi Found</h3>
            <p className="text-gray-600 mb-4">
              Upload your university syllabus to get started with personalized study plans
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {syllabi.map((syllabus) => (
            <Card key={syllabus._id} className={`transition-all ${syllabus.isActive ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <University className="w-5 h-5" />
                      {syllabus.university}
                      {syllabus.isActive && (
                        <Badge className="bg-blue-100 text-blue-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {syllabus.course}
                        </span>
                        {syllabus.semester && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {syllabus.semester}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {syllabus.aiAnalysis?.estimatedHours || 0}h
                        </span>
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSyllabus(selectedSyllabus?._id === syllabus._id ? null : syllabus)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {!syllabus.isActive && (
                      <Button
                        size="sm"
                        onClick={() => activateSyllabus(syllabus._id)}
                      >
                        Activate
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deletingId === syllabus._id}
                      onClick={() => deleteSyllabus(syllabus._id)}
                    >
                      {deletingId === syllabus._id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {selectedSyllabus?._id === syllabus._id && (
                <CardContent className="border-t">
                  <div className="space-y-4">
                    {/* Course Overview */}
                    <div>
                      <h4 className="font-semibold mb-2">Course Overview</h4>
                      <p className="text-sm text-gray-600">{syllabus.aiAnalysis?.overview}</p>
                    </div>

                    {/* Difficulty & Key Topics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Difficulty Level</h4>
                        <Badge className={getDifficultyColor(syllabus.aiAnalysis?.difficulty || 'intermediate')}>
                          {syllabus.aiAnalysis?.difficulty || 'Intermediate'}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Key Topics</h4>
                        <div className="flex flex-wrap gap-1">
                          {syllabus.aiAnalysis?.keyTopics?.slice(0, 4).map((topic, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                          {syllabus.aiAnalysis?.keyTopics?.length > 4 && (
                            <Badge variant="secondary" className="text-xs">
                              +{syllabus.aiAnalysis.keyTopics.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Subjects */}
                    <div>
                      <h4 className="font-semibold mb-2">Subjects ({syllabus.subjects?.length || 0})</h4>
                      <div className="grid gap-2">
                        {syllabus.subjects?.slice(0, 3).map((subject, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-start">
                              <h5 className="font-medium">{subject.name}</h5>
                              {subject.weightage && (
                                <Badge variant="outline">{subject.weightage}</Badge>
                              )}
                            </div>
                            {subject.description && (
                              <p className="text-sm text-gray-600 mt-1">{subject.description}</p>
                            )}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {subject.topics?.slice(0, 3).map((topic, topicIndex) => (
                                <Badge key={topicIndex} variant="secondary" className="text-xs">
                                  {topic}
                                </Badge>
                              ))}
                              {subject.topics?.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{subject.topics.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                        {syllabus.subjects?.length > 3 && (
                          <div className="text-center p-2">
                            <Badge variant="outline">+{syllabus.subjects.length - 3} more subjects</Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Recommendations */}
                    {syllabus.aiAnalysis?.recommendations?.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Study Recommendations</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {syllabus.aiAnalysis.recommendations.slice(0, 3).map((rec, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}