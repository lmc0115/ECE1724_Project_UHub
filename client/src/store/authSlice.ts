import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api, setToken, clearToken, parseApiError, uploadFile } from "@/lib/api";
import type { User, AuthResponse } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  registrationSuccess: boolean;
  needsVerification: boolean;
  verifyEmail: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem("token"),
  loading: false,
  error: null,
  registrationSuccess: false,
  needsVerification: false,
  verifyEmail: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const data = await api.post<AuthResponse>("/auth/login", credentials);
      setToken(data.token);
      return data;
    } catch (err: any) {
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.needsVerification) {
          return rejectWithValue({ needsVerification: true, verifyEmail: parsed.verifyEmail, message: parsed.error });
        }
        return rejectWithValue(parsed.error || parsed.message || "An error occurred");
      } catch {
        return rejectWithValue(err.message || "An error occurred");
      }
    }
  }
);

interface RegisterResponse {
  message: string;
  emailSent: boolean;
}

export const registerStudent = createAsyncThunk(
  "auth/registerStudent",
  async (
    payload: { name: string; email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      return await api.post<RegisterResponse>("/auth/register/student", payload);
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
      return await api.post<RegisterResponse>("/auth/register/organizer", payload);
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
      return await api.post<RegisterResponse>("/auth/register/staff", payload);
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
      state.registrationSuccess = false;
      state.needsVerification = false;
      state.verifyEmail = null;
      clearToken();
    },
    clearError(state) {
      state.error = null;
      state.needsVerification = false;
      state.verifyEmail = null;
    },
    clearRegistrationSuccess(state) {
      state.registrationSuccess = false;
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
        const payload = action.payload as any;
        if (payload?.needsVerification) {
          state.needsVerification = true;
          state.verifyEmail = payload.verifyEmail ?? null;
          state.error = payload.message ?? "Please verify your email before logging in.";
        } else {
          state.error = typeof payload === "string" ? payload : "An error occurred";
        }
      })
      .addCase(registerStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.registrationSuccess = false;
      })
      .addCase(registerStudent.fulfilled, (state) => {
        state.loading = false;
        state.registrationSuccess = true;
      })
      .addCase(registerStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(registerOrganizer.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.registrationSuccess = false;
      })
      .addCase(registerOrganizer.fulfilled, (state) => {
        state.loading = false;
        state.registrationSuccess = true;
      })
      .addCase(registerOrganizer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(registerStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.registrationSuccess = false;
      })
      .addCase(registerStaff.fulfilled, (state) => {
        state.loading = false;
        state.registrationSuccess = true;
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

export const { logout, clearError, clearRegistrationSuccess } = authSlice.actions;
export default authSlice.reducer;
