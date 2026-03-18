import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api, setToken, clearToken, parseApiError, uploadFile } from "@/lib/api";
import type { User, AuthResponse } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem("token"),
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const data = await api.post<AuthResponse>("/auth/login", credentials);
      setToken(data.token);
      return data;
    } catch (err: any) {
      return rejectWithValue(parseApiError(err));
    }
  }
);

export const registerStudent = createAsyncThunk(
  "auth/registerStudent",
  async (
    payload: { name: string; email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const data = await api.post<AuthResponse>("/auth/register/student", payload);
      setToken(data.token);
      return data;
    } catch (err: any) {
      return rejectWithValue(parseApiError(err));
    }
  }
);

export const registerOrganizer = createAsyncThunk(
  "auth/registerOrganizer",
  async (
    payload: { name: string; email: string; password: string; organizationName: string },
    { rejectWithValue }
  ) => {
    try {
      const data = await api.post<AuthResponse>("/auth/register/organizer", payload);
      setToken(data.token);
      return data;
    } catch (err: any) {
      return rejectWithValue(parseApiError(err));
    }
  }
);

export const registerStaff = createAsyncThunk(
  "auth/registerStaff",
  async (
    payload: { name: string; email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const data = await api.post<AuthResponse>("/auth/register/staff", payload);
      setToken(data.token);
      return data;
    } catch (err: any) {
      return rejectWithValue(parseApiError(err));
    }
  }
);

export const fetchMe = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      return await api.get<User>("/auth/me");
    } catch (err: any) {
      return rejectWithValue(parseApiError(err));
    }
  }
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (
    payload: { name?: string; email?: string; avatarUrl?: string },
    { rejectWithValue }
  ) => {
    try {
      return await api.put<User>("/auth/me", payload);
    } catch (err: any) {
      return rejectWithValue(parseApiError(err));
    }
  }
);

export const uploadAvatar = createAsyncThunk(
  "auth/uploadAvatar",
  async (file: File, { rejectWithValue }) => {
    try {
      const result = await uploadFile("/upload/avatar", file);
      return result.avatarUrl as string;
    } catch (err: any) {
      return rejectWithValue(parseApiError(err));
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.error = null;
      clearToken();
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(registerStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerStudent.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(registerStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(registerOrganizer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerOrganizer.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(registerOrganizer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(registerStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerStaff.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(registerStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMe.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        clearToken();
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        if (state.user) state.user.avatarUrl = action.payload;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
