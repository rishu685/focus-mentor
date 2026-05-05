// Use frontend API routes instead of direct backend calls
const API_BASE_URL = '';

export const apiClient = {
  async getCuratedResources(userId: string) {
    const url = `/api/curate-resources/${userId}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch resources');
    }
    return response.json();
  },

  async createCuratedResources(userId: string, subject: string) {
    const response = await fetch(`/api/curate-resources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, subject }),
    });
    
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('JSON parsing error in curateResources:', jsonError);
      data = { 
        success: false, 
        error: 'Invalid response format',
        message: 'Failed to parse response from server'
      };
    }
    
    if (!response.ok) {
      // If it's a RESOURCE_EXISTS error, return it directly
      if (data.error === 'RESOURCE_EXISTS') {
        return data;
      }
      // For other errors, throw them
      throw {
        status: response.status,
        error: data.error,
        message: data.message,
        response: { data }
      };
    }
    
    return data;
  },

  async getStudyPlan(userId: string, forceRefresh = false) {
    const timestamp = Date.now();
    const randomParam = Math.random();
    const url = `/api/study-plan/${userId}?t=${timestamp}&r=${randomParam}&nocache=true`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'If-None-Match': '*',
      'If-Modified-Since': 'Thu, 01 Jan 1970 00:00:00 GMT'
    };
    
    if (forceRefresh) {
      // Add more aggressive headers for force refresh
      Object.assign(headers, {
        'X-Requested-With': 'XMLHttpRequest',
        'X-Force-Refresh': 'true',
        'X-Cache-Bust': timestamp.toString()
      });
    }
    
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error('Failed to fetch study plan');
    }
    return response.json();
  },

  async createStudyPlan(userId: string, subject: string, examDate: string) {
    const response = await fetch(`${API_BASE_URL}/generate-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, subject, examDate }),
    });
    
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('JSON parsing error in createStudyPlan:', jsonError);
      data = { 
        success: false, 
        error: 'Invalid response format',
        message: 'Failed to parse response from server'
      };
    }
    
    if (!response.ok) {
      // If it's a PLAN_EXISTS error, return it directly
      if (data.error === 'PLAN_EXISTS') {
        return data;
      }
      // For other errors, throw them
      throw {
        status: response.status,
        error: data.error,
        message: data.message,
        response: { data }
      };
    }
    
    return data;
  },

  async deleteStudyPlan(planId: string) {
    const timestamp = Date.now();
    const response = await fetch(`/api/study-plan/${planId}?t=${timestamp}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('JSON parsing error in getStudyPlans:', jsonError);
      data = { 
        success: false, 
        error: 'Invalid response format',
        message: 'Failed to parse response from server'
      };
    }
    
    if (!response.ok) {
      throw {
        status: response.status,
        error: data.error,
        message: data.message || 'Failed to delete plan',
        response: { data }
      };
    }
    
    return data;
  },

  async deleteCuratedResources(resourceId: string) {
    const response = await fetch(`/api/resources/${resourceId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('JSON parsing error in deleteCuratedResources:', jsonError);
        data = { 
          success: false, 
          error: 'Invalid response format',
          message: 'Failed to parse response from server'
        };
      }
      throw {
        status: response.status,
        error: data.error,
        message: data.message || 'Failed to delete resources',
        response: { data }
      };
    }
    return response.json();
  },

  // Meeting Rooms API
  async createMeetingRoom(data: Record<string, unknown>) {
    const response = await fetch(`${API_BASE_URL}/meeting-rooms/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create meeting room');
    }
    return response.json();
  },

  async joinMeetingRoom(data: Record<string, unknown>) {
    const response = await fetch(`${API_BASE_URL}/meeting-rooms/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to join meeting room');
    }
    return response.json();
  },

  async getMeetingRoom(roomId: string) {
    const response = await fetch(`${API_BASE_URL}/meeting-rooms/${roomId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch meeting room');
    }
    return response.json();
  },

  async getUserMeetingRooms(userId: string) {
    const response = await fetch(`${API_BASE_URL}/meeting-rooms/user/${userId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user meeting rooms');
    }
    return response.json();
  },

  async leaveMeetingRoom(roomId: string, participantId: string) {
    const response = await fetch(`${API_BASE_URL}/meeting-rooms/leave`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roomId, participantId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to leave meeting room');
    }
    return response.json();
  },

  async endMeetingRoom(roomId: string, participantId: string) {
    const response = await fetch(`${API_BASE_URL}/meeting-rooms/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roomId, participantId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to end meeting room');
    }
    return response.json();
  },

  async generateMeetingSummary(roomId: string, transcript?: string, additionalNotes?: string) {
    const response = await fetch(`${API_BASE_URL}/meeting-rooms/summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roomId, transcript, additionalNotes }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate meeting summary');
    }
    return response.json();
  },

  async sendChatMessage(roomId: string, message: string, participantId: string, participantName: string) {
    const response = await fetch(`${API_BASE_URL}/meeting-rooms/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roomId, message, participantId, participantName }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send chat message');
    }
    return response.json();
  }
}; 
