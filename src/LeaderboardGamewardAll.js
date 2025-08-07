import './LeaderboardGamewardAll.css';
import React, { useState, useEffect, useRef } from "react";
import { useLocation } from 'react-router-dom';
import noeImage from './noe.png';
import iceeImage from './icee.png';
import laynImage from './layn.png';

function LeaderboardGamewardAll() {
    const urlParams = new URLSearchParams(useLocation().search);
    const eventId = urlParams.get('eventId');
    const eventId2 = urlParams.get('eventId2');
    const API_KEY = process.env.REACT_APP_FORTNITE_API_KEY;
    
    const isCumulativeMode = eventId2 !== null;
    
    const playerConfigs = [
        {
            epic_id: "70a8b05d217d47a381e9137b9a0dce51",
            display_player_name: "ICEE",
            avatar_image: iceeImage
        },
        {
            epic_id: "31d45164d7cc4c96bef16da56c2b5f8c", 
            display_player_name: "NOÉ", 
            avatar_image: noeImage
        },
        {
            epic_id: "3ed9da5cff0948c98196c803412d6321", 
            display_player_name: "LAYN", 
            avatar_image: laynImage
        }
    ];

    const [playersData, setPlayersData] = useState([null, null, null]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const previousDataRef = useRef([null, null, null]);
    
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
        }
    };

    useEffect(() => {
        const loadPlayersData = async () => {
            try {
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
                                day2SessionHistory: team.sessionHistory || []
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
                    
                    for (let i = 0; i < playerConfigs.length; i++) {
                        const config = playerConfigs[i];
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
                            updatePlayerDataIfChanged(newPlayerData, i);
                        }
                    }
                } else {
                    const searchAllPages = async () => {
                        let page = 0;
                        let totalPages = 1;
                        let playersFound = 0;
                        
                        while (page < totalPages && playersFound < playerConfigs.length) {
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
                                                
                                                if (playersFound >= playerConfigs.length) {
                                                    return;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            page++;
                        }
                    };
                    
                    await searchAllPages();
                }
                
                foundPlayers.forEach((player, index) => {
                    if (!player) {
                        const emptyPlayerData = {
                            playerName: playerConfigs[index].display_player_name,
                            rank: '-',
                            points: '-',
                            games: '-'
                        };
                        if (hasDataChanged(emptyPlayerData, previousDataRef.current[index], index)) {
                            updatePlayerDataIfChanged(emptyPlayerData, index);
                        }
                    }
                });
                
                setError(null);
            } catch (error) {
                console.error('Error loading players data:', error);
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
            <div className='summary_overlay'>
                <div className='summary_error'>{error}</div>
            </div>
        );
    }


    const sortedPlayers = playersData
        .map((playerData, index) => ({ ...playerData, config: playerConfigs[index], index }))
        .filter(player => player.rank !== '-')
        .sort((a, b) => {
            if (a.rank === '-') return 1;
            if (b.rank === '-') return -1;
            return a.rank - b.rank;
        });

    return (
        <div className='summary-overlay'>
            <div className='summary-title'>
                CLASSEMENT
            </div>
            
            {error && (
                <div className='summary-error'>
                    {error}
                </div>
            )}
            
            {!error && sortedPlayers.length > 0 && (
                <div className='summary-content'>
                    <div className='summary-header'>
                        <div className='header-rank'>Top</div>
                        <div className='header-spacer'></div>
                        <div className='header-players'>Joueurs</div>
                        <div className='header-points'>PTS</div>
                    </div>
                    <div className='summary-players'>
                        {sortedPlayers.map((player, displayIndex) => {
                            const rankClass = `rank-${displayIndex + 1}`;
                            return (
                                <div key={player.index} className={`summary-player-simple ${rankClass}`}>
                                    <div className="player-rank-simple">
                                        {player.rank}
                                    </div>
                                    <img 
                                        src={player.config.avatar_image} 
                                        alt="Avatar" 
                                        className='summary-avatar-simple' 
                                    />
                                    <div className='player-name-simple'>
                                        {player.playerName}
                                    </div>
                                    <div className='player-points-simple'>
                                        {player.points}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            
            {!error && sortedPlayers.length === 0 && (
                <div className='summary-error'>
                    Aucune donnée disponible
                </div>
            )}
        </div>
    );
}

export default LeaderboardGamewardAll;