import { create } from 'zustand';
import {
    CreateSupportTicketBody,
    CreateSupportTicketReplyBody,
    SupportTicket,
    SupportTicketStatistics,
    SupportTicketsIndexParams,
    addSupportTicketReply,
    createSupportTicket,
    formatApiError,
    getSupportTicketById,
    getSupportTicketStatistics,
    getSupportTickets
} from '../utils/api';

interface SupportState {
  // Tickets list
  tickets: SupportTicket[];
  ticketsLoading: boolean;
  ticketsError: string | null;
  ticketsPagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    has_more_pages: boolean;
  } | null;
  
  // Current ticket details
  currentTicket: SupportTicket | null;
  currentTicketLoading: boolean;
  currentTicketError: string | null;
  
  // Statistics
  statistics: SupportTicketStatistics | null;
  statisticsLoading: boolean;
  statisticsError: string | null;
  
  // Filters
  filters: SupportTicketsIndexParams;
  
  // Actions
  fetchTickets: (params?: SupportTicketsIndexParams, append?: boolean) => Promise<void>;
  createTicket: (payload: CreateSupportTicketBody) => Promise<SupportTicket | null>;
  fetchTicketById: (ticketId: string | number) => Promise<void>;
  addReply: (ticketId: string | number, payload: CreateSupportTicketReplyBody) => Promise<void>;
  fetchStatistics: () => Promise<void>;
  setFilters: (filters: SupportTicketsIndexParams) => void;
  clearCurrentTicket: () => void;
  clearError: () => void;
}

export const useSupportStore = create<SupportState>((set, get) => ({
  // Initial state
  tickets: [],
  ticketsLoading: false,
  ticketsError: null,
  ticketsPagination: null,
  
  currentTicket: null,
  currentTicketLoading: false,
  currentTicketError: null,
  
  statistics: null,
  statisticsLoading: false,
  statisticsError: null,
  
  filters: {
    page: 1,
    per_page: 15,
  },
  
  // Actions
  fetchTickets: async (params = {}, append = false) => {
    const currentState = get();
    const mergedParams = { ...currentState.filters, ...params };
    
    set({ 
      ticketsLoading: true, 
      ticketsError: null,
      filters: mergedParams
    });
    
    try {
      const response = await getSupportTickets(mergedParams);
      
      if (response.success && response.data) {
        const newTickets = response.data.tickets || [];
        const pagination = response.data.pagination;
        
        set({
          tickets: append ? [...currentState.tickets, ...newTickets] : newTickets,
          ticketsPagination: pagination,
          ticketsLoading: false,
        });
      } else {
        set({
          ticketsError: 'Failed to fetch tickets',
          ticketsLoading: false,
        });
      }
    } catch (error) {
      set({
        ticketsError: formatApiError(error),
        ticketsLoading: false,
      });
    }
  },
  
  createTicket: async (payload: CreateSupportTicketBody) => {
    set({ ticketsError: null });
    
    try {
      const response = await createSupportTicket(payload);
      
      if (response.success && response.data) {
        const newTicket = response.data;
        const currentState = get();
        
        // Add the new ticket to the beginning of the list
        set({
          tickets: [newTicket, ...currentState.tickets],
        });
        
        return newTicket;
      } else {
        set({ ticketsError: 'Failed to create ticket' });
        return null;
      }
    } catch (error) {
      set({ ticketsError: formatApiError(error) });
      return null;
    }
  },
  
  fetchTicketById: async (ticketId: string | number) => {
    set({ 
      currentTicketLoading: true, 
      currentTicketError: null 
    });
    
    try {
      const response = await getSupportTicketById(ticketId);
      
      if (response.success && response.data) {
        set({
          currentTicket: response.data,
          currentTicketLoading: false,
        });
      } else {
        set({
          currentTicketError: 'Failed to fetch ticket details',
          currentTicketLoading: false,
        });
      }
    } catch (error) {
      set({
        currentTicketError: formatApiError(error),
        currentTicketLoading: false,
      });
    }
  },
  
  addReply: async (ticketId: string | number, payload: CreateSupportTicketReplyBody) => {
    set({ currentTicketError: null });
    
    try {
      const response = await addSupportTicketReply(ticketId, payload);
      
      if (response.success && response.data) {
        const newReply = response.data;
        const currentState = get();
        
        if (currentState.currentTicket) {
          // Add the new reply to the current ticket
          set({
            currentTicket: {
              ...currentState.currentTicket,
              replies: [...(currentState.currentTicket.replies || []), newReply],
            },
          });
        }
        
        // Also update the ticket in the tickets list if it exists
        set({
          tickets: currentState.tickets.map(ticket => 
            ticket.id === Number(ticketId)
              ? {
                  ...ticket,
                  replies: [...(ticket.replies || []), newReply],
                  updated_at: new Date().toISOString(),
                }
              : ticket
          ),
        });
      } else {
        set({ currentTicketError: 'Failed to add reply' });
      }
    } catch (error) {
      set({ currentTicketError: formatApiError(error) });
    }
  },
  
  fetchStatistics: async () => {
    set({ 
      statisticsLoading: true, 
      statisticsError: null 
    });
    
    try {
      const response = await getSupportTicketStatistics();
      
      if (response.success && response.data) {
        set({
          statistics: response.data,
          statisticsLoading: false,
        });
      } else {
        set({
          statisticsError: 'Failed to fetch statistics',
          statisticsLoading: false,
        });
      }
    } catch (error) {
      set({
        statisticsError: formatApiError(error),
        statisticsLoading: false,
      });
    }
  },
  
  setFilters: (filters: SupportTicketsIndexParams) => {
    set({ filters: { ...get().filters, ...filters } });
  },
  
  clearCurrentTicket: () => {
    set({ 
      currentTicket: null, 
      currentTicketError: null 
    });
  },
  
  clearError: () => {
    set({ 
      ticketsError: null, 
      currentTicketError: null, 
      statisticsError: null 
    });
  },
}));

