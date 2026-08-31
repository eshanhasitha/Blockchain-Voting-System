import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();

        try {
            setLoading(true);
            setError("");

            const response = await api.post("/auth/login", {
                email,
                password,
            });

            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));

            if (response.data.user.role === "admin") {
                navigate("/admin");
            } else {
                navigate("/");
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-6">

            <div className="w-full max-w-md">

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
                    <p className="text-gray-500">Sign in to your account</p>
                </div>

                <form
                    onSubmit={handleLogin}
                    className="bg-gray-900/50 border border-gray-800 p-8 rounded-2xl"
                >

                    {error && (
                        <div className="bg-red-950/50 border border-red-800/50 text-red-400 p-3 rounded-xl mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">Email</label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full p-3 bg-gray-800/50 border border-gray-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full p-3 bg-gray-800/50 border border-gray-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 p-3 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-blue-600/20"
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>

                    <p className="text-center text-gray-500 text-sm mt-6">
                        Don't have an account?{" "}
                        <Link to="/register" className="text-blue-400 hover:text-blue-300 transition-colors">
                            Register
                        </Link>
                    </p>

                </form>

            </div>
        </div>
    );
}

export default Login;