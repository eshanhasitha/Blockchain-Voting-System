import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

function Register() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        walletAddress: "",
    });

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        try {
            setLoading(true);
            setError("");
            setMessage("");

            await api.post("/auth/register", form);

            setMessage("Registration successful! Redirecting...");

            setTimeout(() => {
                navigate("/login");
            }, 1500);
        } catch (err: any) {
            setError(err.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-6">

            <div className="w-full max-w-md">

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">Create Account</h1>
                    <p className="text-gray-500">Register to participate in elections</p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="bg-gray-900/50 border border-gray-800 p-8 rounded-2xl"
                >

                    {message && (
                        <div className="bg-green-950/50 border border-green-800/50 text-green-400 p-3 rounded-xl mb-6 text-sm">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-950/50 border border-red-800/50 text-red-400 p-3 rounded-xl mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">Full Name</label>
                        <input
                            name="name"
                            placeholder="John Doe"
                            value={form.name}
                            onChange={handleChange}
                            required
                            className="w-full p-3 bg-gray-800/50 border border-gray-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">Email</label>
                        <input
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={handleChange}
                            required
                            className="w-full p-3 bg-gray-800/50 border border-gray-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">Password</label>
                        <input
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={handleChange}
                            required
                            className="w-full p-3 bg-gray-800/50 border border-gray-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">MetaMask Wallet Address</label>
                        <input
                            name="walletAddress"
                            placeholder="0x..."
                            value={form.walletAddress}
                            onChange={handleChange}
                            className="w-full p-3 bg-gray-800/50 border border-gray-700 rounded-xl text-sm font-mono focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 p-3 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-blue-600/20"
                    >
                        {loading ? "Creating account..." : "Create Account"}
                    </button>

                    <p className="text-center text-gray-500 text-sm mt-6">
                        Already have an account?{" "}
                        <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
                            Sign in
                        </Link>
                    </p>

                </form>

            </div>
        </div>
    );
}

export default Register;