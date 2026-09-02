import { useState, useEffect } from "react";
import {
    BrowserRouter,
    Routes,
    Route,
    Link,
    useLocation,
    useNavigate,
} from "react-router-dom";

import Voter from "./pages/Voter";
import Admin from "./pages/Admin";
import Results from "./pages/Results";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NetworkAlert from "./components/NetworkAlert";

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
        >
            {children}
        </Link>
    );
}

function AppLayout() {
    const navigate = useNavigate();
    const [user, setUser] = useState<{ name: string; role: string; email: string } | null>(null);

    const checkUser = () => {
        try {
            const stored = localStorage.getItem("user");
            if (stored) {
                setUser(JSON.parse(stored));
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        }
    };

    useEffect(() => {
        checkUser();

        // Listen for storage events (e.g. login in another tab or state change)
        window.addEventListener("storage", checkUser);
        return () => window.removeEventListener("storage", checkUser);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        navigate("/login");
    };

    return (
        <>
            <NetworkAlert />
            <nav className="bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/50 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">

                    <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg no-underline">
                        <span className="text-2xl">🗳️</span>
                        <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            BlockVote
                        </span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <NavLink to="/">Vote</NavLink>
                        <NavLink to="/admin">Admin</NavLink>
                        <NavLink to="/results">Results</NavLink>

                        {user ? (
                            <div className="flex items-center gap-3 ml-2 pl-3 border-l border-gray-800">
                                <div className="text-right text-xs hidden sm:block">
                                    <div className="text-gray-300 font-semibold">{user.name}</div>
                                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono uppercase ${
                                        user.role === "admin"
                                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                            : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                    }`}>
                                        {user.role}
                                    </span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="text-xs text-gray-400 hover:text-red-400 bg-gray-900 hover:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-800 transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <>
                                <NavLink to="/login">Login</NavLink>
                                <NavLink to="/register">Register</NavLink>
                            </>
                        )}
                    </div>

                </div>
            </nav>

            <Routes>
                <Route path="/" element={<Voter />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/results" element={<Results />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
            </Routes>
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AppLayout />
        </BrowserRouter>
    );
}

export default App;