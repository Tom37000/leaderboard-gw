import './App.css';
import React from "react"
import { HashRouter as Router, Route, Routes  } from 'react-router-dom';
import LeaderboardGamewardWls from './LeaderboardGameward-wls';
import LeaderboardGamewardFortniteApi from './LeaderboardGameward-fortniteapi.io';
import LeaderboardGamewardAll from './LeaderboardGamewardAll';
import LeaderboardGamewardAllWls from './LeaderboardGamewardAllWls';





function App() {
    return (
      <Router>
        <Routes >
          <Route path="/gameward_overlay" element={<LeaderboardGamewardWls />} />
          <Route path="/gameward_overlay_fortniteapi" element={<LeaderboardGamewardFortniteApi />} />
          <Route path="/overlay_classement" element={<LeaderboardGamewardAll />} />
          <Route path="/overlay_classement_wls" element={<LeaderboardGamewardAllWls />} />


        </Routes >
      </Router>
    );
  }


export default App;
