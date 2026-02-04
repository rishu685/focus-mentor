"use client"

import { useState, useEffect, useCallback } from "react";
import StudyPlanForm from '@/components/StudyPlanForm';
import { StoredPlan } from "@/components/study-plan/StoredPlan";
import { Separator } from "@/components/ui/separator";
import type { StudyPlan } from "@/components/study-plan/StoredPlan";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { PaginationNav } from "@/components/ui/pagination-nav";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const ITEMS_PER_PAGE = 5;

export default function StudyPlanPage() {
  const { data: session } = useSession();
  const [storedPlans, setStoredPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const fetchPlans = useCallback(async (force = false) => {
    if (!session?.user?.id) return;
    try {
      setLoading(true);
      console.log('Fetching plans for user:', session.user.id, 'force:', force);
      
      // Clear state first if force refresh
      if (force) {
        setStoredPlans([]);
        
        // Clear all browser caches
        if ('caches' in window) {
          await caches.keys().then(cacheNames => {
            return Promise.all(
              cacheNames.map(cacheName => caches.delete(cacheName))
            );
          });
        }
      }
      
      const data = await apiClient.getStudyPlan(session.user.id, force);
      console.log('Fetched plans data:', data);
      console.log('Data type:', typeof data, 'Is array:', Array.isArray(data));
      
      if (data.error) {
        console.error("API returned error:", data.error);
        toast({
          variant: "error",
          title: "Error",
          description: "Failed to fetch study plans. Please try again."
        });
        setStoredPlans([]);
        return;
      }
      
      // Handle multiple response formats
      let plansArray = [];
      if (data.plans && Array.isArray(data.plans)) {
        plansArray = data.plans;
      } else if (data.success && data.plans) {
        plansArray = Array.isArray(data.plans) ? data.plans : [];
      } else if (Array.isArray(data)) {
        plansArray = data;
      } else if (data && typeof data === 'object' && data.plan) {
        // Single plan response
        plansArray = [data.plan];
      }
      
      console.log('Processed plans array:', plansArray, 'Length:', plansArray.length);
      
      if (plansArray.length > 0) {
        // Sort plans by _id as a fallback for creation time
        const sortedPlans = plansArray.sort((a: StudyPlan, b: StudyPlan) => 
          b._id.localeCompare(a._id)
        );
        console.log('Setting plans in state:', sortedPlans.length, 'plans');
        console.log('Plan IDs:', sortedPlans.map(p => p._id));
        console.log('Plan subjects:', sortedPlans.map(p => p.overview?.subject));
        setStoredPlans(sortedPlans);
      } else {
        console.log('No plans found, setting empty array');
        setStoredPlans([]);
      }
    } catch (error) {
      console.error("Error fetching stored plans:", error);
      toast({
        variant: "error",
        title: "Error",
        description: "Failed to fetch study plans. Please try again."
      });
      setStoredPlans([]);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, toast]);

  useEffect(() => {
    fetchPlans(false);
  }, [fetchPlans]);

  const handlePlanGenerated = () => {
    // Force refresh the plans list after a short delay
    setTimeout(() => {
      fetchPlans(true);
    }, 500);
  };

  const handlePlanDelete = async (planId: string) => {
    console.log('Deleting plan with ID:', planId);
    
    // Prevent multiple simultaneous deletions
    if (storedPlans.find(plan => plan._id === planId)?.isDeleting) {
      return;
    }
    
    try {
      // Immediately mark as deleting and remove from local state for instant feedback
      setStoredPlans(prev => prev.filter(plan => plan._id !== planId));
      
      const response = await apiClient.deleteStudyPlan(planId);
      console.log('Delete response:', response);
      
      if (response.success) {
        toast({
          variant: "success", 
          title: "Success",
          description: response.message || "Study plan deleted successfully."
        });
        
        // Force clear all caches and reload page
        console.log('Force clearing all caches and reloading');
        
        // Clear browser cache
        if ('caches' in window) {
          caches.keys().then(cacheNames => {
            cacheNames.forEach(cacheName => {
              caches.delete(cacheName);
            });
          });
        }
        
        // Force page reload to ensure fresh data
        setTimeout(() => {
          window.location.reload();
        }, 500);
        
      } else {
        throw new Error(response.message || 'Failed to delete plan');
      }
    } catch (error: unknown) {
      console.error("Error deleting plan:", error);
      toast({
        variant: "error",
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to delete study plan. Please try again."
      });
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(storedPlans.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPlans = storedPlans.slice(startIndex, endIndex);

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 sm:mb-0">Study Plan Generator</h1>
        <div className="flex items-center gap-4">
          <span className="text-xs sm:text-sm text-gray-600">Create and manage your study plans</span>
        </div>
      </div>
      
      <div className="w-full max-w-full sm:max-w-10xl">
        <StudyPlanForm onPlanGenerated={handlePlanGenerated} />
      </div>

      {/* Stored Plans Section */}
      <div id="stored-plans" className="mt-8 sm:mt-12">
        <Separator className="my-6 sm:my-8" />
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Your Study Plans</h2>
        
        {/* Force refresh button for debugging/fixing display issues */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {storedPlans.length > 0 
              ? `Found ${storedPlans.length} study plan${storedPlans.length === 1 ? '' : 's'}` 
              : 'No study plans found'
            }
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPlans(true)}
            disabled={loading}
            className="text-xs"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
            Refresh Plans
          </Button>
        </div>
        
        {loading ? (
          <div className="space-y-4 sm:space-y-6">
            <Skeleton className="h-[150px] sm:h-[200px] w-full" />
            <Skeleton className="h-[150px] sm:h-[200px] w-full" />
          </div>
        ) : storedPlans.length > 0 ? (
          <>
            <div className="space-y-4 sm:space-y-6">
              {currentPlans.map((plan) => (
                <StoredPlan
                  key={plan._id}
                  plan={plan}
                  onDelete={handlePlanDelete}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <PaginationNav
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>You haven&apos;t created any study plans yet.</p>
            <p className="mt-2">Use the form above to create your first study plan!</p>
          </div>
        )}
      </div>
    </div>
  );
}