import {
    BrowserRouter,
    Routes,
    Route,
    Link
} from "react-router-dom";

import ConnectWallet
    from "./components/ConnectWallet";

import BlockchainStatus
    from "./components/BlockchainStatus";

import CandidateList
    from "./components/CandidateList";

import Voter from "./pages/Voter";
import Admin from "./pages/Admin";


function Home() {
    return (
        <div>

            <h1>
                Blockchain Voting System
            </h1>

            <nav>
                <Link to="/vote">Voter Panel</Link>
                {" | "}
                <Link to="/admin">Admin Panel</Link>
            </nav>

            <ConnectWallet />

            <BlockchainStatus />

            <CandidateList />

        </div>
    );
}


function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/vote" element={<Voter />} />
                <Route path="/admin" element={<Admin />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;