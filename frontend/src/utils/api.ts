const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function registerUser(data: {
    name: string;
    email: string;
    password: string;
    walletAddress?: string;
}) {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Registration failed.");
    }

    return result;
}

export async function loginUser(data: {
    email: string;
    password: string;
}) {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Login failed.");
    }

    return result;
}

export async function getProtectedData() {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/protected`, {
        headers: {
            Authorization: `Bearer ${token || ""}`,
        },
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Request failed.");
    }

    return result;
}

export async function testAdminAccess() {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/admin/test`, {
        headers: {
            Authorization: `Bearer ${token || ""}`,
        },
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Admin access denied.");
    }

    return result;
}
