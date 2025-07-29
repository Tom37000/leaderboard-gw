import './App.css';
import React from "react"
import { HashRouter as Router, Route, Routes  } from 'react-router-dom';
import LeaderboardGameward from './LeaderboardGameward';



function App() {
    return (
      <Router>
        <Routes >
          <Route path="/gameward_overlay" element={<LeaderboardGameward />} />
        </Routes >
      </Router>
    );
  }


export default App;
