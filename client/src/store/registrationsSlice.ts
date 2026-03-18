import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api, parseApiError } from "@/lib/api";
import type { Registration } from "@/types";

interface RegistrationsState {
  items: Registration[];
  loading: boolean;
  error: string | null;
}

const initialState: RegistrationsState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchMyRegistrations = createAsyncThunk(
  "registrations/fetchMine",
  async (_, { rejectWithValue }) => {
    try {
      return await api.get<Registration[]>("/registrations/my");
    } catch (err: any) {
      return rejectWithValue(parseApiError(err));
    }
  }
);

export const registerForEvent = createAsyncThunk(
  "registrations/register",
  async (eventId: string, { rejectWithValue }) => {
    try {
      return await api.post<Registration>("/registrations", { eventId });
    } catch (err: any) {
      return rejectWithValue(parseApiError(err));
    }
  }
);

export const cancelRegistration = createAsyncThunk(
  "registrations/cancel",
  async (registrationId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/registrations/${registrationId}`);
      return registrationId;
    } catch (err: any) {
      return rejectWithValue(parseApiError(err));
    }
  }
);

const registrationsSlice = createSlice({
  name: "registrations",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyRegistrations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyRegistrations.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchMyRegistrations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(registerForEvent.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(cancelRegistration.fulfilled, (state, action) => {
        state.items = state.items.filter((r) => r.id !== action.payload);
      });
  },
});

export default registrationsSlice.reducer;
