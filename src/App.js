import './App.css';
import React from "react"
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import LeaderboardGamewardWls from './LeaderboardGameward-wls';
import LeaderboardGamewardFortniteApi from './LeaderboardGameward-fortniteapi.io';
import LeaderboardGamewardAll from './LeaderboardGamewardAll';
import LeaderboardGamewardAllWls from './LeaderboardGamewardAllWls';
import LeaderboardGamewardV2 from './LeaderboardGameward-wlsV2';





function App() {
  return (
    <Router>
      <Routes >
        <Route path="/gameward_overlay" element={<LeaderboardGamewardWls />} />
        <Route path="/gameward_overlay_fortniteapi" element={<LeaderboardGamewardFortniteApi />} />
        <Route path="/overlay_classement_joueurs" element={<LeaderboardGamewardAll />} />
        <Route path="/overlay_classement_joueurs_v2" element={<LeaderboardGamewardV2 />} />
        <Route path="/overlay_recap_classement" element={<LeaderboardGamewardAllWls />} />

      </Routes >
    </Router>
  );
}


export default App;
