import './App.css';
import React, { useState, useEffect } from "react";
import { useLocation } from 'react-router-dom';
import './App.css';

function Row({ rank, teamname, points, elims, avg_place, wins, games, order, showGamesColumn, onClick, positionChange, showPositionIndicators }) {
    const renderPositionChange = () => {
        if (!showPositionIndicators) {
            return null;
        }
        
        const getIndicatorStyle = (type) => {
            const baseStyle = {
                padding: '1px 4px',
                borderRadius: '3px',
                fontSize: '9px',
                fontWeight: 'bold',
                border: '1px solid',
                minWidth: '16px',
                textAlign: 'center',
                display: 'inline-block'
            };

            if (type === 'neutral') {
                return {
                    ...baseStyle,
                    backgroundColor: '#666',
                    color: '#fff',
                    borderColor: '#666'
                };
            } else if (type === 'positive') {
                return {
                    ...baseStyle,
                    backgroundColor: '#4CAF50',
                    color: '#fff',
                    borderColor: '#4CAF50',
                    animation: 'indicatorPulse 1s ease-in-out 3'
                };
            } else {
                return {
                    ...baseStyle,
                    backgroundColor: '#f44336',
                    color: '#fff',
                    borderColor: '#f44336',
                    animation: 'indicatorPulse 1s ease-in-out 3'
                };
            }
        };

        if (positionChange === 0) {
            return <span className='position_change neutral' style={getIndicatorStyle('neutral')}>=</span>;
        }
        if (positionChange > 0) {
            return <span className='position_change positive' style={getIndicatorStyle('positive')}>+{positionChange}</span>;
        } else {
            return <span className='position_change negative' style={getIndicatorStyle('negative')}>{positionChange}</span>;
        }
    };

    const getAnimationStyle = () => {
        if (positionChange === 0) return {};
        
        const rowHeight = 60;
        const realDistance = Math.abs(positionChange) * rowHeight;
        
        const baseSpeed = 120; 
        const minDuration = 0.6; 
        const maxDuration = 2.5; 
        
        let calculatedDuration = realDistance / baseSpeed;
        calculatedDuration = Math.max(minDuration, Math.min(maxDuration, calculatedDuration));
        
        const fromPosition = positionChange > 0 ? realDistance : -realDistance;
        
        return {
            '--slide-from': `${fromPosition}px`,
            '--slide-to': '0px',
            animation: `slideFromTo ${calculatedDuration}s cubic-bezier(0.1, 0, 0.9, 1)`
        };
    };

    const getRowClasses = () => {
        let classes = 'row_container';
        if (Math.abs(positionChange) >= 3) {
            if (positionChange > 0) {
                classes += ' big_move_up';
            } else {
                classes += ' big_move_down';
            }
        }
        return classes;
    };

    return (
        <div className={getRowClasses()} style={{ 
            '--animation-order': order,
            opacity: 1,
            animation: 'none',
            ...getAnimationStyle()
        }}>
            <div className='rank_container'>
                {rank}
                {renderPositionChange()}
            </div>
            <div className='name_container' style={{ cursor: 'pointer' }} onClick={onClick}>{teamname}</div>
            <div className='info_box'>{avg_place.toFixed(2)}</div>
            <div className='info_box'>{elims}</div>
            <div className='info_box'>{wins}</div>
            <div className='info_box'>{points}</div>
            {showGamesColumn && <div className='info_box'>{games}</div>}
        </div>
    );
}

function LeaderboardReddyshRoyale() {
    const leaderboard_id = new URLSearchParams(useLocation().search).get('id');

    const [leaderboard, setLeaderboard] = useState(null);
    const [apiPage, setApiPage] = useState(0); 
    const [localPage, setLocalPage] = useState(0); 
    const [totalApiPages, setTotalApiPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState(""); 
    const [showSearch, setShowSearch] = useState(false); 

    const [showGamesColumn, setShowGamesColumn] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [teamDetails, setTeamDetails] = useState({});
    const [previousPositions, setPreviousPositions] = useState({});
    const [lastChangeTime, setLastChangeTime] = useState(Date.now());
    const [showPositionIndicators, setShowPositionIndicators] = useState(false);
    const [hasRefreshedOnce, setHasRefreshedOnce] = useState(false);

    useEffect(() => {
        const loadAllPages = async () => {
            try {
                const firstResponse = await fetch(`https://api.wls.gg/v5/leaderboards/${leaderboard_id}?page=0`);
                const firstData = await firstResponse.json();
                
                let allLeaderboardData = [];
                let allDetails = {};
                let hasMultipleGames = false;
                
                const totalPages = firstData.total_pages || 1;
                setTotalApiPages(totalPages);
                
                const promises = [];
                for (let page = 0; page < totalPages; page++) {
                    promises.push(
                        fetch(`https://api.wls.gg/v5/leaderboards/${leaderboard_id}?page=${page}`)
                            .then(response => response.json())
                    );
                }
                
                const allPagesData = await Promise.all(promises);
                
                allPagesData.forEach(data => {
                    for (let team in data.teams) {
                        const sessionKeys = Object.keys(data.teams[team].sessions).sort((a, b) => parseInt(a) - parseInt(b));
                        const sessions = sessionKeys.map(key => data.teams[team].sessions[key]);
                        const gamesCount = sessions.length;
                        const members = Object.values(data.teams[team].members);
                        members.sort((a, b) => a.id.localeCompare(b.id));
                        const teamname = members.map(member => member.name).join(' - ');
                        
                        if (gamesCount > 1) {
                            hasMultipleGames = true;
                        }

                        allDetails[teamname] = {
                            members: members,
                            sessions: sessions,
                            teamData: data.teams[team]
                        };
                        
                        allLeaderboardData.push({
                            teamname: teamname,
                            elims: sessions.map(session => session.kills).reduce((acc, curr) => acc + curr, 0),
                            avg_place: sessions.map(session => session.place).reduce((acc, curr, _, arr) => acc + curr / arr.length, 0),
                            wins: sessions.map(session => session.place).reduce((acc, curr) => acc + (curr === 1 ? 1 : 0), 0),
                            games: gamesCount,
                            place: data.teams[team].place,
                            points: data.teams[team].points
                        });
                    }
                });
                allLeaderboardData.sort((a, b) => {
                    if (a.place !== b.place) {
                        return a.place - b.place;
                    }
                    return b.points - a.points;
                });
                
                const storageKey = `leaderboard_positions_${leaderboard_id}`;
                const previousPositions = JSON.parse(localStorage.getItem(storageKey) || '{}');
                const lastChangeTimeKey = `last_change_time_${leaderboard_id}`;
                const storedLastChangeTime = localStorage.getItem(lastChangeTimeKey);
                
                let hasChanges = false;
                const updatedLeaderboardData = allLeaderboardData.map(team => {
                    const previousPosition = previousPositions[team.teamname];
                    let positionChange = 0;
                    
                    if (previousPosition !== undefined) {
                        positionChange = previousPosition - team.place; 
                        if (positionChange !== 0) {
                            hasChanges = true;
                        }
                    }
                    
                    return {
                        ...team,
                        positionChange
                    };
                });
            
                const currentPositions = {};
                allLeaderboardData.forEach(team => {
                    currentPositions[team.teamname] = team.place;
                });
                localStorage.setItem(storageKey, JSON.stringify(currentPositions));
                
                const now = Date.now();
                if (hasRefreshedOnce) {
                    if (hasChanges) {
                        setLastChangeTime(now);
                        localStorage.setItem(lastChangeTimeKey, now.toString());
                        setShowPositionIndicators(true);
                    } else if (storedLastChangeTime) {
                        const timeSinceLastChange = now - parseInt(storedLastChangeTime);
                        const fiveMinutes = 5 * 60 * 1000; 
                        
                        if (timeSinceLastChange > fiveMinutes) {
                            setShowPositionIndicators(false);
                        }
                    }
                } else {
                    setHasRefreshedOnce(true);
                    setShowPositionIndicators(false);
                    if (!storedLastChangeTime) {
                        setLastChangeTime(now);
                        localStorage.setItem(lastChangeTimeKey, now.toString());
                    }
                }
                
                setShowGamesColumn(hasMultipleGames);
                setLeaderboard(updatedLeaderboardData);
                setTeamDetails(allDetails);
            } catch (error) {
                console.error('Error loading leaderboard data:', error);
            }
        };
        
        loadAllPages();
        
        const interval = setInterval(loadAllPages, 30000);
        
        return () => clearInterval(interval);
    }, [leaderboard_id]);

    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key === 'F1') { 
                event.preventDefault();
                setShowSearch(prev => !prev); 
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    useEffect(() => {
        setLocalPage(0);
    }, [searchQuery]);

    const handleTeamClick = (teamname) => {
        setSelectedTeam(teamname);
    };

    const closeModal = () => {
        setSelectedTeam(null);
    };

    function nextPage() {
        const filteredLeaderboard = leaderboard
            ? leaderboard.filter(team => {
                // Search by team name
                if (team.teamname.toLowerCase().includes(searchQuery.toLowerCase())) {
                    return true;
                }
                // Search by ingame_name of team members
                if (teamDetails[team.teamname] && teamDetails[team.teamname].members) {
                    return teamDetails[team.teamname].members.some(member => 
                        member.ingame_name && member.ingame_name.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                }
                return false;
            })
            : [];
        const maxPages = Math.ceil(filteredLeaderboard.length / 10) - 1;
        
        if (localPage < maxPages) {
            setLocalPage(localPage + 1);
        }
    }

    function previousPage() {
        if (localPage > 0) {
            setLocalPage(localPage - 1);
        }
    }

    const filteredLeaderboard = leaderboard
        ? leaderboard.filter(team => {
            // Search by team name
            if (team.teamname.toLowerCase().includes(searchQuery.toLowerCase())) {
                return true;
            }
            // Search by ingame_name of team members
            if (teamDetails[team.teamname] && teamDetails[team.teamname].members) {
                return teamDetails[team.teamname].members.some(member => 
                    member.ingame_name && member.ingame_name.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }
            return false;
        })
        : [];
    const startIndex = localPage * 10;
    const endIndex = startIndex + 10;
    const displayedLeaderboard = filteredLeaderboard.slice(startIndex, endIndex);

    return (
        <div className='summer2r_cup'>

            {showSearch && (
                <div className='search_container'>
                    <input
                        type="text"
                        placeholder="Rechercher une équipe"
                        className="search_input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            )}
            
            <div className='leaderboard_container'>
                <div className='leaderboard_table'>
                    <div className='header_container'>
                        <div className='rank_header' onClick={previousPage}>PLACE</div>
                        <div className='name_header'>ÉQUIPE</div>
                        <div className='info_header' style={{ fontSize: '12px' }}>AVG PLACE</div>
                        <div className='info_header'>ELIMS</div>
                        <div className='info_header'>WINS</div>
                        <div className='info_header'>POINTS</div>
                        {showGamesColumn && <div onClick={nextPage} className='info_header'>GAMES</div>}
                    </div>
                    {displayedLeaderboard.map((data, index) =>
                        <Row
                            key={`${apiPage}-${localPage}-${index}`}
                            rank={data.place}
                            teamname={data.teamname}
                            points={data.points}
                            elims={data.elims}
                            wins={data.wins}
                            games={data.games}
                            avg_place={data.avg_place}
                            order={index + 1}
                            showGamesColumn={showGamesColumn}
                            onClick={() => handleTeamClick(data.teamname)}
                            positionChange={data.positionChange || 0}
                            showPositionIndicators={showPositionIndicators}
                        />
                    )}
                </div>

            </div>

            {selectedTeam && teamDetails[selectedTeam] && (
                <div className='modal_overlay' onClick={closeModal}>
                    <div className='modal_content' onClick={(e) => e.stopPropagation()}>
                        <div className='modal_header'>
                            <h2>Stats détaillées - {selectedTeam}</h2>
                            <button className='close_button' onClick={closeModal}>×</button>
                        </div>
                        <div className='modal_body'>
                            <div className='team_summary'>
                                <h3>Résumé de l'équipe :</h3>
                                <div className='stats_grid'>
                                    <div className='stat_item'>
                                        <span className='stat_label'>Classement:</span>
                                        <span className='stat_value'>#{teamDetails[selectedTeam].teamData.place}</span>
                                    </div>
                                    <div className='stat_item'>
                                        <span className='stat_label'>Points totaux:</span>
                                        <span className='stat_value'>{teamDetails[selectedTeam].teamData.points}</span>
                                    </div>
                                    <div className='stat_item'>
                                        <span className='stat_label'>Parties jouées :</span>
                                        <span className='stat_value'>{teamDetails[selectedTeam].sessions.length}</span>
                                    </div>
                                    <div className='stat_item'>
                                        <span className='stat_label'>Victoires:</span>
                                        <span className='stat_value'>{teamDetails[selectedTeam].sessions.filter(s => s.place === 1).length}</span>
                                    </div>
                                    <div className='stat_item'>
                                        <span className='stat_label'>Top 3:</span>
                                        <span className='stat_value'>{teamDetails[selectedTeam].sessions.filter(s => s.place <= 3).length}</span>
                                    </div>
                                    <div className='stat_item'>
                                        <span className='stat_label'>Élims totales:</span>
                                        <span className='stat_value'>{teamDetails[selectedTeam].sessions.reduce((acc, s) => acc + s.kills, 0)}</span>
                                    </div>
                                    <div className='stat_item'>
                                        <span className='stat_label'>Place moyenne:</span>
                                        <span className='stat_value'>{(teamDetails[selectedTeam].sessions.reduce((acc, s) => acc + s.place, 0) / teamDetails[selectedTeam].sessions.length).toFixed(2)}</span>
                                    </div>
                                    <div className='stat_item'>
                                        <span className='stat_label'>Élims/partie:</span>
                                        <span className='stat_value'>{(teamDetails[selectedTeam].sessions.reduce((acc, s) => acc + s.kills, 0) / teamDetails[selectedTeam].sessions.length).toFixed(2)}</span>
                                    </div>
                                    <div className='stat_item'>
                                        <span className='stat_label'>Meilleure place:</span>
                                        <span className='stat_value'>{Math.min(...teamDetails[selectedTeam].sessions.map(s => s.place))}</span>
                                    </div>
                                    <div className='stat_item'>
                                        <span className='stat_label'>Pire place:</span>
                                        <span className='stat_value'>{Math.max(...teamDetails[selectedTeam].sessions.map(s => s.place))}</span>
                                    </div>
                                    <div className='stat_item'>
                                        <span className='stat_label'>Max élims/partie:</span>
                                        <span className='stat_value'>{Math.max(...teamDetails[selectedTeam].sessions.map(s => s.kills))}</span>
                                    </div>

                                </div>
                            </div>
                            
                            <div className='members_section'>
                                <h3>Membre(s) de l'équipe :</h3>
                                <div className='members_grid'>
                                    {teamDetails[selectedTeam].members.map((member, index) => (
                                        <div key={index} className='member_card'>
                                            <strong>{member.name}</strong>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className='sessions_section'>
                                <h3>Historique détaillé des games :</h3>
                                <div className='sessions_table'>
                                    <div className='session_header'>
                                        <div>Game</div>
                                        <div>Place</div>
                                        <div>Éliminations</div>
                                    </div>
                                    {teamDetails[selectedTeam].sessions.map((session, index) => (
                                        <div key={index} className='session_row'>
                                            <div className='session_highlight'>{index + 1}</div>
                                            <div className={`place_${session.place <= 3 ? 'top' : session.place <= 10 ? 'good' : 'normal'}`}>{session.place}</div>
                                            <div className='session_highlight'>{session.kills}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default LeaderboardReddyshRoyale;