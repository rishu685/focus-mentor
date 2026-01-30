"use client"
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StudyPlanDisplay from './StudyPlanDisplay';
import { Loader2, BookOpen, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { StudyPlan } from "@/components/study-plan/StoredPlan";
import { useSession } from 'next-auth/react';
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface StudyPlanFormProps {
  onPlanGenerated: (plan: Partial<StudyPlan>) => void;
}

export default function StudyPlanForm({ onPlanGenerated }: StudyPlanFormProps) {
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState<Date>();
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [syllabusStatus, setSyllabusStatus] = useState<{ available: boolean; university?: string; course?: string }>({ available: false });
  const { toast } = useToast();
  const { data: session } = useSession();
  const [error, setError] = useState<string | null>(null);

  // Check for active syllabus
  useEffect(() => {
    const checkSyllabus = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/syllabus/active/${session.user.id}`);
        if (response.ok) {
          const syllabus = await response.json();
          setSyllabusStatus({ 
            available: true, 
            university: syllabus.university, 
            course: syllabus.course 
          });
        } else {
          setSyllabusStatus({ available: false });
        }
      } catch (error) {
        console.error('Error checking syllabus:', error);
        setSyllabusStatus({ available: false });
      }
    };
    
    checkSyllabus();
  }, [session?.user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPlan(null); // Reset plan when submitting new one
    
    if (!session?.user?.id) {
      toast({
        variant: "error",
        title: "Authentication Required", 
        description: "You must be logged in to generate a study plan",
      });
      return;
    }

    if (!subject.trim()) {
      setError("Please enter a subject");
      return;
    }
    
    if (!date) {
      setError("Please select an exam date");
      return;
    }

    setIsLoading(true);

    try {
      console.log('Submitting study plan request:', {
        userId: session.user.id,
        subject: subject.trim(),
        examDate: date.toISOString().split('T')[0]
      });

      // Use enhanced study plan generation
      const response = await fetch('/api/study-plan/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          subject: subject.trim(),
          examDate: date.toISOString().split('T')[0],
          prioritizeSyllabus: syllabusStatus.available
        })
      });

      const result = await response.json();
      console.log('Study plan response:', result);

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to generate plan');
      }

      if (result.success && result.plan) {
        setPlan(result.plan);
        setSubject('');
        setDate(undefined);
        toast({
          variant: "success",
          title: "Plan Generated",
          description: result.message || "Study plan generated successfully",
        });
        
        // Call onPlanGenerated after a short delay to ensure proper state updates
        setTimeout(() => {
          onPlanGenerated(result.plan);
        }, 100);
      } else {
        throw new Error(result.error || 'Failed to generate plan');
      }
    } catch (err: unknown) {
      console.error('Error creating plan:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create study plan';
      setError(errorMessage);
      toast({
        variant: "error",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#F2EDE0] p-4 sm:p-6 border-2 border-b-4 border-r-4 border-black rounded-xl">
      <div className="max-w-6xl mx-auto">
        {/* Syllabus Status Alert */}
        {!syllabusStatus.available && (
          <Alert className="mb-4 border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>Upload your syllabus to get study plans tailored to your university curriculum</span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => window.location.href = '/syllabus'}
                  className="ml-2"
                >
                  Upload Syllabus
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {syllabusStatus.available && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <BookOpen className="h-4 w-4" />
            <AlertDescription>
              Study plans will be customized for <strong>{syllabusStatus.university} {syllabusStatus.course}</strong> curriculum
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">`;
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 space-y-2">
              <Input
                type="text"
                placeholder="Enter your study topic..."
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setError(null);
                }}
                className={cn(
                  "bg-white border-2 border-black text-gray-900 placeholder-gray-500 text-base sm:text-lg p-6 rounded-xl h-auto",
                  error && "border-red-500 focus-visible:ring-red-500"
                )}
              />
              {error && (
                <p className="text-sm text-red-500 mt-1">{error}</p>
              )}
            </div>
            <div className="flex-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full h-full justify-start text-left font-normal bg-white border-2 border-black text-base sm:text-lg p-6 rounded-xl",
                      !date && "text-gray-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-5 w-5" />
                    {date ? format(date, "PPP") : <span>dd-mm-yyyy</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex justify-center w-full">
            <Button 
              type="submit" 
              className="w-full sm:w-auto flex justify-center items-center text-base sm:text-lg py-6 px-8 rounded-xl" 
              disabled={isLoading || !subject.trim() || !date}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 sm:h-5 w-4 sm:w-5 animate-spin" /> : null}
              {isLoading ? 'Generating Your Plan...' : 'Create Study Plan'}
            </Button>
          </div>
        </form>

        {plan && (
          <div className="mt-6 sm:mt-8 bg-white rounded-xl border-2 border-black p-6">
            <h3 className="text-xl font-semibold mb-4">Generated Study Plan</h3>
            <StudyPlanDisplay plan={plan} />
          </div>
        )}
      </div>
    </div>
  );
}