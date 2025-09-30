import './LeaderboardGameward-fortniteapi.io.css';
import React, { useState, useEffect, useRef } from "react";
import { useLocation } from 'react-router-dom';
import iceeImage from './icee.png';
import tylioImage from './tylio.png';
import voxeImage from './voxe.png';

const extractGameData = (sessionHistory) => {
    if (!sessionHistory || sessionHistory.length === 0) return [];
    
    return sessionHistory.map((session, index) => {
        const placement = session.trackedStats?.PLACEMENT_STAT_INDEX || '-';
        const kills = session.trackedStats?.TEAM_ELIMS_STAT_INDEX || 0;
        
        return {
            gameNumber: index + 1,
            placement: placement,
            kills: kills
        };
    });
};

function PlayerGameSlideshow({ sessionData, playerName, isCumulativeMode, playerData }) {
    const [currentGameIndex, setCurrentGameIndex] = useState(0);
    const [fadeClass, setFadeClass] = useState('fade-in');
    const [isVisible, setIsVisible] = useState(false);
    const [containerVisible, setContainerVisible] = useState(false);
    
    const gameData = sessionData ? extractGameData(sessionData) : [];
    
    useEffect(() => {
        if (gameData.length >= 2) {
            const displayDuration = gameData.length * 5000;
            const cycleDuration = 4 * 60 * 1000; 
            
            const visibilityInterval = setInterval(() => {
                setCurrentGameIndex(0);
                setContainerVisible(true);
                setTimeout(() => {
                    setIsVisible(true);
                }, 300);

                setTimeout(() => {
                    setIsVisible(false);
                    setTimeout(() => {
                        setContainerVisible(false);
                    }, 400);
                }, displayDuration);
            }, cycleDuration);
            
            return () => clearInterval(visibilityInterval);
        }
    }, [gameData.length]);
    
    useEffect(() => {
        setCurrentGameIndex(0);
    }, [gameData.length]);
    
    useEffect(() => {
        if (gameData.length > 1 && isVisible) {
            const interval = setInterval(() => {
                setFadeClass('fade-out');
                setTimeout(() => {
                    setCurrentGameIndex(prev => (prev + 1) % gameData.length);
                    setFadeClass('fade-in');
                }, 300);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [gameData.length, isVisible]);
    
    if (!gameData || gameData.length < 2 || !containerVisible || !playerData) {
        return null;
    }
    
    const currentGame = gameData[currentGameIndex];
    
    if (!currentGame) {
        return null;
    }
    
    return (
        <div className={`game_display_container ${containerVisible ? 'visible' : ''}`}>
            <div className={`game_text ${fadeClass}`}>
                Game {currentGame.gameNumber} : Top {currentGame.placement}, {currentGame.kills} kills
            </div>
        </div>
    );
}

function LeaderboardGamewardFortniteApi() {
    const urlParams = new URLSearchParams(useLocation().search);
    const eventId = urlParams.get('eventId');
    const eventId2 = urlParams.get('eventId2');
    const API_KEY = process.env.REACT_APP_FORTNITE_API_KEY;
    
    const isCumulativeMode = eventId2 !== null;
    
 const playerConfigs = [
        {
            epic_id: "70a8b05d217d47a381e9137b9a0dce51",
            display_player_name: "Icee",
            avatar_image: iceeImage
        },
        {
            epic_id: "", 
            display_player_name: ""
        },
        {
            epic_id: "", 
            display_player_name: ""
        },
        {
            epic_id: "d038d3b7a13d4323b2ebca05644d9124",
            display_player_name: "Tylio",
            avatar_image: tylioImage
        },
        {
            epic_id: "48a10d6404c649198c8cf382f12253bc",
            display_player_name: "Voxe",
            avatar_image: voxeImage
        },
        {
            epic_id: "84867c4ef9674c9b838b0c9c815a58fc",
            display_player_name: "Baxo",
        }
    ];

    const [playersData, setPlayersData] = useState([null, null, null, null, null, null]);
    const [playersSessionData, setPlayersSessionData] = useState([null, null, null, null, null, null]);
    const [error, setError] = useState(null);
    const previousDataRef = useRef([null, null, null, null, null, null]);
    
    const hasDataChanged = (newData, oldData, index) => {
        if (!newData && !oldData) return false;
        if (!newData || !oldData) return true;
        return newData.rank !== oldData.rank || 
               newData.points !== oldData.points || 
               newData.games !== oldData.games;
    };
    
    const updatePlayerDataIfChanged = (newPlayerData, index) => {
        if (hasDataChanged(newPlayerData, previousDataRef.current[index], index)) {
            setPlayersData(prevData => {
                const updatedData = [...prevData];
                updatedData[index] = newPlayerData;
                return updatedData;
            });
            previousDataRef.current[index] = newPlayerData;
        } else {
        }
    };

    useEffect(() => {
        const loadPlayersData = async () => {
            try {
                const validPlayerConfigs = playerConfigs.filter(config => config.epic_id && config.epic_id.trim() !== "");
                
                const foundPlayers = new Array(playerConfigs.length).fill(null);
                
                if (isCumulativeMode) {
                    const day1Url = `https://fortniteapi.io/v1/events/window?windowId=${eventId}`;
                    const day2Url = `https://fortniteapi.io/v1/events/window?windowId=${eventId2}`;
                
                const fetchEventData = async (url) => {
                    const allResults = [];
                    let page = 0;
                    let totalPages = 1;
                    
                    while (page < totalPages) {
                        const response = await fetch(`${url}&page=${page}`, {
                            headers: {
                                'Authorization': API_KEY
                            }
                        });
                        
                        if (!response.ok) {
                            throw new Error(`Erreur API: ${response.status}`);
                        }
                        
                        const data = await response.json();
                        const results = data.session?.results || [];
                        allResults.push(...results);
                        
                        if (data.totalPages !== undefined) {
                            totalPages = data.totalPages;
                        }
                        
                        page++;
                    }
                    
                    return allResults;
                };
                
                    const day1Results = await fetchEventData(day1Url);
                    const day2Results = await fetchEventData(day2Url);
                    const teamCumulativeData = new Map();
                
                 const calculateTeamStats = (sessionHistory) => {
                     if (!sessionHistory || sessionHistory.length === 0) {
                         return { wins: 0, totalPoints: 0, avgPoints: 0, games: 0 };
                     }
                     
                     const wins = sessionHistory.filter(session => session.placement === 1).length;
                     const totalPoints = sessionHistory.reduce((sum, session) => sum + (session.pointsEarned || 0), 0);
                     const games = sessionHistory.length;
                     const avgPoints = games > 0 ? totalPoints / games : 0;
                     
                     return { wins, totalPoints, avgPoints, games };
                 };
                 
                 day1Results.forEach(team => {
                     const teamId = team.teamId;
                     const day1Stats = calculateTeamStats(team.sessionHistory);
                     teamCumulativeData.set(teamId, {
                         ...team,
                         day1Points: team.pointsEarned,
                         day2Points: 0,
                         day1Games: day1Stats.games,
                         day2Games: 0,
                         day1Wins: day1Stats.wins,
                         day2Wins: 0,
                         cumulativePoints: team.pointsEarned,
                         cumulativeGames: day1Stats.games,
                         cumulativeWins: day1Stats.wins,
                         day1SessionHistory: team.sessionHistory || [],
                         day2SessionHistory: []
                     });
                 });
                 
                 day2Results.forEach(team => {
                     const teamId = team.teamId;
                     const day2Stats = calculateTeamStats(team.sessionHistory);
                     if (teamCumulativeData.has(teamId)) {
                         const existing = teamCumulativeData.get(teamId);
                         existing.day2Points = team.pointsEarned;
                         existing.day2Games = day2Stats.games;
                         existing.day2Wins = day2Stats.wins;
                         existing.cumulativePoints = existing.day1Points + team.pointsEarned;
                         existing.cumulativeGames = existing.day1Games + day2Stats.games;
                         existing.cumulativeWins = existing.day1Wins + day2Stats.wins;
                         existing.pointsEarned = existing.cumulativePoints;
                         existing.day2SessionHistory = team.sessionHistory || [];
                         existing.sessionHistory = [...existing.day1SessionHistory, ...existing.day2SessionHistory];
                     } else {
                         teamCumulativeData.set(teamId, {
                             ...team,
                             day1Points: 0,
                             day2Points: team.pointsEarned,
                             day1Games: 0,
                             day2Games: day2Stats.games,
                             day1Wins: 0,
                             day2Wins: day2Stats.wins,
                             cumulativePoints: team.pointsEarned,
                             cumulativeGames: day2Stats.games,
                             cumulativeWins: day2Stats.wins,
                             day1SessionHistory: [],
                             day2SessionHistory: team.sessionHistory || [],
                             sessionHistory: team.sessionHistory || []
                         });
                     }
                 });
                 
                 teamCumulativeData.forEach((team, teamId) => {
                     const allSessions = [...team.day1SessionHistory, ...team.day2SessionHistory];
                     const totalSessionPoints = allSessions.reduce((sum, session) => sum + (session.pointsEarned || 0), 0);
                     team.cumulativeAvgPoints = team.cumulativeGames > 0 ? totalSessionPoints / team.cumulativeGames : 0;
                 });
                
                const cumulativeResults = Array.from(teamCumulativeData.values())
                    .sort((a, b) => {
                        if (b.cumulativePoints !== a.cumulativePoints) {
                            return b.cumulativePoints - a.cumulativePoints;
                        }
                        if (b.cumulativeWins !== a.cumulativeWins) {
                            return b.cumulativeWins - a.cumulativeWins;
                        }
                        return b.cumulativeAvgPoints - a.cumulativeAvgPoints;
                    })
                    .map((team, index) => ({
                        ...team,
                        rank: index + 1,
                        pointsEarned: team.cumulativePoints
                    }));
                
                    let playersFound = 0;
                    
                    if (cumulativeResults && cumulativeResults.length > 0) {
                        for (let i = 0; i < playerConfigs.length; i++) {
                            if (foundPlayers[i] === null) {
                                const config = playerConfigs[i];
                                if (!config.epic_id || config.epic_id.trim() === "") {
                                    continue;
                                }
                                const teamData = cumulativeResults.find(team => 
                                    team.teamAccountIds && team.teamAccountIds.includes(config.epic_id)
                                );
                                
                                if (teamData) {
                                     const newPlayerData = {
                                         playerName: config.display_player_name,
                                         rank: teamData.rank,
                                         points: teamData.pointsEarned,
                                         games: teamData.cumulativeGames || 0
                                     };
                                    foundPlayers[i] = newPlayerData;
                                    playersFound++;
                                    
                                    updatePlayerDataIfChanged(newPlayerData, i);
                                    
                                    setPlayersSessionData(prevData => {
                                        const updatedData = [...prevData];
                                        const sessionHistory = teamData.sessionHistory || [];
                                        updatedData[i] = sessionHistory;
                                        return updatedData;
                                    });
                                }
                            }
                        }
                    }
                } else {
                    const searchAllPages = async () => {
                        let page = 0;
                        let totalPages = 1;
                        let playersFound = 0;
                        
                        while (page < totalPages && playersFound < validPlayerConfigs.length) {
                            try {
                                const response = await fetch(`https://fortniteapi.io/v1/events/window?windowId=${eventId}&page=${page}`, {
                                    headers: {
                                        'Authorization': API_KEY
                                    }
                                });
                                
                                if (response.ok) {
                                    const data = await response.json();
                                    
                                    if (data.result && data.session && data.session.results && data.session.results.length > 0) {
                                        if (data.totalPages !== undefined) {
                                            totalPages = data.totalPages;
                                        }
                                        
                                        for (let i = 0; i < playerConfigs.length; i++) {
                                            if (foundPlayers[i] === null) {
                                                const config = playerConfigs[i];
                                                if (!config.epic_id || config.epic_id.trim() === "") {
                                                    continue;
                                                }
                                                const teamData = data.session.results.find(team => 
                                                    team.teamAccountIds && team.teamAccountIds.includes(config.epic_id)
                                                );
                                                
                                                if (teamData) {
                                                    const newPlayerData = {
                                                        playerName: config.display_player_name,
                                                        rank: teamData.rank,
                                                        points: teamData.pointsEarned,
                                                        games: teamData.sessionHistory ? teamData.sessionHistory.length : 0
                                                    };
                                                    foundPlayers[i] = newPlayerData;
                                                    playersFound++;
                                                    
                                                    updatePlayerDataIfChanged(newPlayerData, i);
                                                    
                                                    setPlayersSessionData(prevData => {
                                                        const updatedData = [...prevData];
                                                        updatedData[i] = teamData.sessionHistory || [];
                                                        return updatedData;
                                                    });
                                                    
                                                    if (playersFound >= validPlayerConfigs.length) {
                                                        return;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                } else {
                                }
                            } catch (pageError) {
                            }
                            
                            page++;
                        }
                    };
                    
                    await searchAllPages();
                }
                
                foundPlayers.forEach((player, index) => {
                    if (player) {
                        if (hasDataChanged(player, previousDataRef.current[index], index)) {
                            updatePlayerDataIfChanged(player, index);
                        }
                    } else {
                        if (previousDataRef.current[index] !== null) {
                        }
                    }
                });
                setError(null);
            } catch (error) {
                setError('Erreur lors du chargement des données: ' + error.message);
            }
        };
        
        if (eventId) {
            if (isCumulativeMode && !eventId2) {
                setError('Pour le mode cumulatif, les deux eventIds sont requis (eventId et eventId2)');
                return;
            }
            loadPlayersData();
            const interval = setInterval(loadPlayersData, 30000); 
            return () => clearInterval(interval);
        } else {
            setError('ID de l\'événement manquant');
        }
    }, [eventId, eventId2, isCumulativeMode]);

    if (error) {
        return (
            <div className='gameward_overlay'>
                <div className='error_container'>
                    <div className='error_text'>{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className='gameward_overlay'>
            {playersData.map((playerData, index) => {
                const config = playerConfigs[index];
                if (!config.display_player_name || config.display_player_name.trim() === "") {
                    return null;
                }
                
                return (
                    <div key={index} className='player_stats_container'>
                        <div className='player_top_section'>
                            <div className='player_header'>
                                <img 
                                    src={config.avatar_image} 
                                    alt="Avatar" 
                                    className='player_avatar' 
                                />
                                <div className='player_name'>
                                    {playerData ? playerData.playerName : config.display_player_name}
                                </div>
                            </div>
                            
                            <div className='stats_display'>
                                <div className='stat_column'>
                                    <div className='stat_label'>TOP</div>
                                    <div className='stat_value'>
                                        {playerData ? playerData.rank : '-'}
                                    </div>
                                </div>
                                
                                <div className='stat_column'>
                                    <div className='stat_label'>POINTS</div>
                                    <div className='stat_value'>
                                        {playerData ? playerData.points : '-'}
                                    </div>
                                </div>
                                
                                <div className='stat_column'>
                                    <div className='stat_label'>{playerData && playerData.games > 1 ? 'GAMES' : 'GAME'}</div>
                                    <div className='stat_value'>
                                        {playerData ? playerData.games : '-'}
                                    </div>
                                </div>
                            </div>
                            
                        </div>
                        
                        <PlayerGameSlideshow 
                            sessionData={playersSessionData[index]} 
                            playerName={config.display_player_name}
                            isCumulativeMode={isCumulativeMode}
                            playerData={playerData}
                        />
                    </div>
                );
            })}
        </div>
     );
}

export default LeaderboardGamewardFortniteApi;