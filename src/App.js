import './App.css';
import React from "react"
import { HashRouter as Router, Route, Routes  } from 'react-router-dom';
import LeaderboardGamewardWls from './LeaderboardGameward-wls';
import LeaderboardGamewardFortniteApi from './LeaderboardGameward-fortniteapi.io';





function App() {
    return (
      <Router>
        <Routes >
          <Route path="/gameward_overlay" element={<LeaderboardGamewardWls />} />
          <Route path="/gameward_overlay_fortniteapi" element={<LeaderboardGamewardFortniteApi />} />


        </Routes >
      </Router>
    );
  }


export default App;
