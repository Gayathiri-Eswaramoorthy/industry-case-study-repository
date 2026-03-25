import axiosInstance from "./axiosInstance";
import { jwtDecode } from "jwt-decode";

export const loginUser = async (email, password) => {
  try {
    const response = await axiosInstance.post("/auth/login", {
      email,
      password,
    });

    const token =
      typeof response.data === "string" ? response.data : response.data?.token;

    let user =
      typeof response.data === "object" && response.data !== null
        ? response.data.user || null
        : null;

    if (token && (!user || !user.id)) {
      try {
        const decoded = jwtDecode(token);
        user = {
          id: decoded.id ?? decoded.userId ?? decoded.sub_id ?? null,
          email: decoded.sub ?? "",
          role: decoded.role ?? "STUDENT",
          status: "APPROVED",
        };
        if (!user.id) {
          const allClaims = Object.keys(decoded);
          console.warn("JWT claims available:", allClaims, decoded);
        }
      } catch {
        user = null;
      }
    }

    if (user) {
      user = {
        ...user,
        status: user.status ?? "APPROVED",
      };
    }

    return { token, user };
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

// Get list of approved faculty for student signup dropdown
export const getApprovedFaculty = async () => {
  const response = await axiosInstance.get("/users", {
    params: { role: "FACULTY" },
    skipAuth: true,
  });
  const users = response.data?.data?.content ?? [];
  return users
    .filter((u) => Number.isFinite(Number(u?.id)) && (u?.name || u?.fullName))
    .map((u) => ({
      id: Number(u.id),
      fullName: u.name ?? u.fullName,
    }));
};

export const registerStudent = async (data) => {
  // data: { fullName, email, password, requestedFacultyId }
  const response = await axiosInstance.post("/auth/register", {
    fullName: data.fullName,
    email: data.email,
    password: data.password,
    role: "STUDENT",
    requestedFacultyId: data.requestedFacultyId,
  });
  return response.data;
};

export const registerFaculty = async (data) => {
  // data: { fullName, email, password, department, specialization }
  const response = await axiosInstance.post("/auth/register", {
    fullName: data.fullName,
    email: data.email,
    password: data.password,
    role: "FACULTY",
    department: data.department,
    specialization: data.specialization,
  });
  return response.data;
};

export const checkRegistrationStatus = async (email) => {
  const response = await axiosInstance.get("/auth/registration-status", {
    params: { email },
  });
  return response.data;
};
