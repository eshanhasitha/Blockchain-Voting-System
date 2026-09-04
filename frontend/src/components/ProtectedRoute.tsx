import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
    children: ReactNode;
    role?: "admin" | "voter";
}

export default function ProtectedRoute({ children, role }: ProtectedRouteProps) {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
        return <Navigate to="/login" replace />;
    }

    try {
        const user = JSON.parse(userData);
        if (role && user.role !== role) {
            return <Navigate to={user.role === "admin" ? "/admin" : "/voter"} replace />;
        }
    } catch {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}
