import './App.css';
import React from "react"
import { HashRouter as Router, Route, Routes  } from 'react-router-dom';
import LeaderboardWolt from './LeaderboardWolt';
import LeaderboardReddyshRoyale from './LeaderboardReddyshRoyale'
import LeaderboardStizoCup from './LeaderboardStizoCup'
import LeaderboardTCS from './LeaderboardTCS';
import Leaderboard2R from './Leaderboard2R';
import TwitchPolls from './TwitchPolls';



function App() {
    return (
      <Router>
        <Routes >
          <Route path="/wolt_leaderboard" element={<LeaderboardWolt />} />
          <Route path="/reddysh_royale_leaderboard" element={<LeaderboardReddyshRoyale />} />
          <Route path="/solary_leaderboard" element={<LeaderboardStizoCup />} />
          <Route path="/twitch_polls" element={<TwitchPolls />} />
          <Route path="/carry_ton_noob_leaderboard" element={<LeaderboardTCS />} />
          <Route path="/solary1_leaderboard" element={<Leaderboard2R />} />
        </Routes >
      </Router>
    );
  }


export default App;
