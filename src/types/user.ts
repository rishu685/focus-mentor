export interface DailyTask {
  day: string;
  tasks: string[];
  duration: string;
}

export interface WeeklyPlan {
  week: string;
  goals: string[];
  dailyTasks: DailyTask[];
}

export interface StudyPlan {
  subject: string;
  duration: string;
  examDate: Date;
  weeklyPlans: WeeklyPlan[];
  recommendations: string[];
  createdAt: Date;
}

export interface Resource {
  title: string;
  description?: string;
  type: string;
  link: string;
  addedAt: Date;
}

export interface SyllabusSubject {
  name: string;
  topics: string[];
  weightage?: string;
  description?: string;
}

export interface SyllabusAnalysis {
  overview: string;
  keyTopics: string[];
  difficulty: string;
  recommendations: string[];
  estimatedHours: number;
}

export interface Syllabus {
  _id: string;
  userId: string;
  university: string;
  course: string;
  semester?: string;
  year?: string;
  fileName: string;
  originalName: string;
  filePath: string;
  extractedText: string;
  subjects: SyllabusSubject[];
  aiAnalysis: SyllabusAnalysis;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  subjects: string[];
  savedPlans: StudyPlan[];
  savedResources: Resource[];
  profile: {
    avatar?: string;
    bio?: string;
    timezone?: string;
    university?: string;
    course?: string;
    currentSyllabus?: string;
    preferences: {
      emailNotifications: boolean;
      studyReminders: boolean;
    };
  };
  stats: {
    totalStudyHours: number;
    completedTasks: number;
    currentStreak: number;
    lastStudyDate?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
} 