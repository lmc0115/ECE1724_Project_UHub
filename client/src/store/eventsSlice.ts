import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api, parseApiError } from "@/lib/api";
import type { Event } from "@/types";

interface EventsState {
  items: Event[];
  myItems: Event[];
  current: Event | null;
  loading: boolean;
  error: string | null;
}

const initialState: EventsState = {
  items: [],
  myItems: [],
  current: null,
  loading: false,
  error: null,
};

export const fetchEvents = createAsyncThunk(
  "events/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await api.get<Event[]>("/events");
    } catch (err: any) {
      return rejectWithValue(parseApiError(err));
    }
  }
);

export const fetchMyEvents = createAsyncThunk(
  "events/fetchMine",
  async (_, { rejectWithValue }) => {
    try {
      return await api.get<Event[]>("/events/my");
    } catch (err: any) {
      return rejectWithValue(parseApiError(err));
    }
  }
);

export const createEvent = createAsyncThunk(
  "events/create",
  async (payload: Partial<Event>, { rejectWithValue }) => {
    try {
      return await api.post<Event>("/events", payload);
    } catch (err: any) {
      return rejectWithValue(parseApiError(err));
    }
  }
);

export const updateEvent = createAsyncThunk(
  "events/update",
  async ({ id, ...data }: Partial<Event> & { id: string }, { rejectWithValue }) => {
    try {
      return await api.put<Event>(`/events/${id}`, data);
    } catch (err: any) {
      return rejectWithValue(parseApiError(err));
    }
  }
);

export const deleteEvent = createAsyncThunk(
  "events/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/events/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(parseApiError(err));
    }
  }
);

export const fetchEventById = createAsyncThunk(
  "events/fetchById",
  async (id: string, { rejectWithValue }) => {
    try {
      return await api.get<Event>(`/events/${id}`);
    } catch (err: any) {
      return rejectWithValue(parseApiError(err));
    }
  }
);

const eventsSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
    clearCurrentEvent(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchEventById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEventById.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMyEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.myItems = action.payload;
      })
      .addCase(fetchMyEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.myItems.unshift(action.payload);
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        const idx = state.myItems.findIndex((e) => e.id === action.payload.id);
        if (idx !== -1) state.myItems[idx] = action.payload;
        if (state.current?.id === action.payload.id) state.current = action.payload;
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.myItems = state.myItems.filter((e) => e.id !== action.payload);
      });
  },
});

export const { clearCurrentEvent } = eventsSlice.actions;
export default eventsSlice.reducer;
