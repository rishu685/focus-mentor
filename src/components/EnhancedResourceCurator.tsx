"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, BookOpen, ExternalLink, University, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSession } from 'next-auth/react';

interface Resource {
  title: string;
  description: string;
  url: string;
  format: string;
  benefits: string[];
  relevanceScore?: number;
  syllabusAlignment?: string;
}

interface SyllabusContext {
  university: string;
  course: string;
  used: boolean;
}

export default function EnhancedResourceCurator() {
  const [subject, setSubject] = useState("");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [type, setType] = useState("mixed");
  const [loading, setLoading] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [syllabusContext, setSyllabusContext] = useState<SyllabusContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { data: session } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!subject.trim()) {
      setError("Please enter a subject");
      return;
    }

    if (!session?.user?.id) {
      setError("Please sign in to curate resources");
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/resources/curate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: subject.trim(),
          userId: session.user.id,
          difficulty,
          type,
          prioritizeSyllabus: true
        }),
      });

      const result = await response.json();

      if (result.success) {
        setResources(result.resources || []);
        setSyllabusContext(result.syllabusContext);
        setSubject("");
        
        toast({
          title: "Success",
          description: result.message || "Resources curated successfully",
        });
      } else {
        setError(result.error || 'Failed to curate resources');
      }
    } catch (err) {
      console.error('Resource curation error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Smart Resource Curator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Enter subject or topic..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="text-lg"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty Level</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Resource Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="mixed">Mixed Resources</option>
                  <option value="video">Videos</option>
                  <option value="article">Articles</option>
                  <option value="tutorial">Tutorials</option>
                  <option value="practice">Practice Materials</option>
                </select>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              disabled={loading || !subject.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Curating Resources...
                </>
              ) : (
                'Curate Resources'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {syllabusContext && (
        <Alert className="border-blue-200 bg-blue-50">
          <University className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            {syllabusContext.used ? (
              <>
                <CheckCircle className="w-4 h-4 inline mr-1 text-green-600" />
                Resources customized for your <strong>{syllabusContext.university} {syllabusContext.course}</strong> curriculum
              </>
            ) : (
              'Upload your syllabus to get university-specific resources tailored to your curriculum'
            )}
          </AlertDescription>
        </Alert>
      )}

      {resources.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Curated Resources</h3>
          <div className="grid gap-4">
            {resources.map((resource, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-2">{resource.title}</h4>
                      <p className="text-gray-600 mb-3">{resource.description}</p>
                      
                      {resource.syllabusAlignment && (
                        <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded">
                          <p className="text-sm text-green-800">
                            <strong>Curriculum Alignment:</strong> {resource.syllabusAlignment}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="secondary">{resource.format}</Badge>
                        {resource.relevanceScore && resource.relevanceScore > 0.8 && (
                          <Badge variant="default">Highly Relevant</Badge>
                        )}
                        {syllabusContext?.used && (
                          <Badge variant="outline" className="text-blue-600 border-blue-600">
                            Curriculum-Matched
                          </Badge>
                        )}
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Benefits:</p>
                        <ul className="text-sm text-gray-600">
                          {resource.benefits.slice(0, 3).map((benefit, i) => (
                            <li key={i} className="flex items-center gap-1">
                              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(resource.url, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}