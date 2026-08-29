import ConnectWallet
  from "./components/ConnectWallet";

import BlockchainStatus
  from "./components/BlockchainStatus";

import CandidateList
  from "./components/CandidateList";


function App() {

  return (
    <div>

      <h1>
        Blockchain Voting System
      </h1>

      <ConnectWallet />

      <BlockchainStatus />

      <CandidateList />

    </div>
  );
}

export default App;