import './LeaderboardGamewardAllWls.css';
import React, { useState, useEffect, useRef } from "react";
import { useLocation } from 'react-router-dom';
import noeImage from './noe.png';
import iceeImage from './icee.png';
import laynImage from './layn.png';
import avatarPersonne from './avatar-personne.png';

function LeaderboardGamewardAllWls() {
    const urlParams = new URLSearchParams(useLocation().search);
    const leaderboard_id = urlParams.get('id');
    const leaderboard_id2 = urlParams.get('id2');
    
    const isCumulativeMode = leaderboard_id2 !== null;
    
    const playerConfigs = [
        {
            wls_player_name: "Iceee",
            display_player_name: "Icee",
            avatar_image: iceeImage
        },
        {
            wls_player_name: "Noefn10", 
            display_player_name: "Noé", 
            avatar_image: noeImage
        },
        {
            wls_player_name: "Layn92", 
            display_player_name: "Layn", 
            avatar_image: laynImage
        },
        {
            wls_player_name: "Voxe", 
            display_player_name: "Voxe", 
            avatar_image: avatarPersonne
        },
        {
            wls_player_name: "tylio7", 
            display_player_name: "Tylio", 
            avatar_image: avatarPersonne
        },
        {
            wls_player_name: "BaxoTv", 
            display_player_name: "Baxo", 
            avatar_image: avatarPersonne
        }
    ];

    const [playersData, setPlayersData] = useState(new Array(playerConfigs.length).fill(null));
    const [error, setError] = useState(null);
    const previousDataRef = useRef(new Array(playerConfigs.length).fill(null));
    const errorCountRef = useRef(0);
    const lastSuccessRef = useRef(Date.now());
    const lastValidDataRef = useRef(new Array(playerConfigs.length).fill(null));
    const retryTimeoutRef = useRef(null);
    
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
                const fetchWithRetry = async (url, maxRetries = 3, timeout = 10000) => {
                    for (let attempt = 1; attempt <= maxRetries; attempt++) {
                        try {
                            const controller = new AbortController();
                            const timeoutId = setTimeout(() => controller.abort(), timeout);
                            
                            const response = await fetch(url, {
                                signal: controller.signal,
                                headers: {
                                    'Accept': 'application/json',
                                    'Content-Type': 'application/json'
                                }
                            });
                            
                            clearTimeout(timeoutId);
                            
                            if (!response.ok) {
                                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                            }
                            
                            return await response.json();
                        } catch (error) {
                            if (attempt === maxRetries) {
                                throw new Error(`Échec après ${maxRetries} tentatives: ${error.message}`);
                            }
                            
                            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                            await new Promise(resolve => setTimeout(resolve, delay));
                        }
                    }
                };
                
                const loadLeaderboardData = async (leaderboardId) => {
                    const firstData = await fetchWithRetry(`https://api.wls.gg/v5/leaderboards/${leaderboardId}?page=0`);
                    
                    const totalPages = firstData.total_pages || 1;
                    
                    const promises = [];
                    for (let page = 0; page < totalPages; page++) {
                        promises.push(
                            fetchWithRetry(`https://api.wls.gg/v5/leaderboards/${leaderboardId}?page=${page}`)
                        );
                    }
                    
                    return await Promise.all(promises);
                };
                
                const foundPlayers = new Array(playerConfigs.length).fill(null);
                
                if (isCumulativeMode) {
                    const allPagesData1 = await loadLeaderboardData(leaderboard_id);
                    const allPagesData2 = await loadLeaderboardData(leaderboard_id2);
                    
                    const playerCumulativeData = new Map();
                    
                    allPagesData1.forEach(data => {
                        data.teams.forEach(team => {
                            const sessions = Object.values(team.sessions);
                            const gamesCount = sessions.length;
                            const members = Object.values(team.members);
                            
                            members.forEach(member => {
                                const playerKey = member.name.toLowerCase();
                                if (!playerCumulativeData.has(playerKey)) {
                                    playerCumulativeData.set(playerKey, {
                                        rank1: team.place,
                                        points1: team.points,
                                        games1: gamesCount,
                                        rank2: 999,
                                        points2: 0,
                                        games2: 0,
                                        member: member
                                    });
                                }
                            });
                        });
                    });
                    
                    allPagesData2.forEach(data => {
                        data.teams.forEach(team => {
                            const sessions = Object.values(team.sessions);
                            const gamesCount = sessions.length;
                            const members = Object.values(team.members);
                            
                            members.forEach(member => {
                                const playerKey = member.name.toLowerCase();
                                if (playerCumulativeData.has(playerKey)) {
                                    const existing = playerCumulativeData.get(playerKey);
                                    existing.rank2 = team.place;
                                    existing.points2 = team.points;
                                    existing.games2 = gamesCount;
                                } else {
                                    playerCumulativeData.set(playerKey, {
                                        rank1: 999,
                                        points1: 0,
                                        games1: 0,
                                        rank2: team.place,
                                        points2: team.points,
                                        games2: gamesCount,
                                        member: member
                                    });
                                }
                            });
                        });
                    });
                    
                    const cumulativeResults = Array.from(playerCumulativeData.entries())
                        .map(([playerKey, data]) => ({
                            playerKey,
                            member: data.member,
                            bestRank: Math.min(data.rank1, data.rank2),
                            totalPoints: data.points1 + data.points2,
                            totalGames: data.games1 + data.games2
                        }))
                        .sort((a, b) => {
                            if (b.totalPoints !== a.totalPoints) {
                                return b.totalPoints - a.totalPoints;
                            }
                            return a.bestRank - b.bestRank;
                        })
                        .map((player, index) => ({
                            ...player,
                            rank: index + 1
                        }));
                    
                    playerConfigs.forEach((config, index) => {
                        if (config.wls_player_name) {
                            const playerResult = cumulativeResults.find(result => 
                                result.member.name.toLowerCase().includes(config.wls_player_name.toLowerCase()) ||
                                (result.member.ingame_name && result.member.ingame_name.toLowerCase().includes(config.wls_player_name.toLowerCase()))
                            );
                            
                            if (playerResult) {
                                const newPlayerData = {
                                    playerName: config.display_player_name,
                                    rank: playerResult.rank,
                                    points: playerResult.totalPoints,
                                    games: playerResult.totalGames
                                };
                                foundPlayers[index] = newPlayerData;
                                updatePlayerDataIfChanged(newPlayerData, index);
                            }
                        }
                    });
                } else {
                    const allPagesData = await loadLeaderboardData(leaderboard_id);
                    
                    playerConfigs.forEach((config, index) => {
                        if (config.wls_player_name) {
                            let playerData = null;
                        
                            allPagesData.forEach(data => {
                                data.teams.forEach(team => {
                                    const sessions = Object.values(team.sessions);
                                    const gamesCount = sessions.length;
                                    const members = Object.values(team.members);
                                    
                                    const playerInTeam = members.find(member => 
                                        member.name.toLowerCase().includes(config.wls_player_name.toLowerCase()) ||
                                        (member.ingame_name && member.ingame_name.toLowerCase().includes(config.wls_player_name.toLowerCase()))
                                    );
                                    
                                    if (playerInTeam && !playerData) {
                                        playerData = {
                                            rank: team.place,
                                            points: team.points,
                                            games: gamesCount
                                        };
                                    }
                                });
                            });
                            
                            if (playerData) {
                                const newPlayerData = {
                                    playerName: config.display_player_name,
                                    rank: playerData.rank,
                                    points: playerData.points,
                                    games: playerData.games
                                };
                                foundPlayers[index] = newPlayerData;
                                updatePlayerDataIfChanged(newPlayerData, index);
                            }
                        }
                    });
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
                lastValidDataRef.current = [...foundPlayers];
                setError(null);
                errorCountRef.current = 0;
                lastSuccessRef.current = Date.now();
            } catch (error) {
                console.error('Error loading players data:', error);
                errorCountRef.current += 1;
                if (lastValidDataRef.current.some(data => data !== null)) {
                    console.warn(`Utilisation des dernières données sauvegardées (erreur ${errorCountRef.current}):`, error.message);
                } else {
                    console.warn(`Aucune donnée sauvegardée disponible (erreur ${errorCountRef.current}):`, error.message);
                }
                setError(null);
                if (retryTimeoutRef.current) {
                    clearTimeout(retryTimeoutRef.current);
                }
                retryTimeoutRef.current = setTimeout(() => {
                    console.log(`Nouvelle tentative de récupération des données (tentative ${errorCountRef.current + 1})`);
                    loadPlayersData();
                }, 120000);
            }
        };
        
        if (leaderboard_id) {
            if (isCumulativeMode && !leaderboard_id2) {
                setError('Pour le mode cumulatif, les deux IDs de leaderboard sont requis (id et id2)');
                return;
            }
            loadPlayersData();
            const interval = setInterval(loadPlayersData, 45000); 
            return () => {
                clearInterval(interval);
                if (retryTimeoutRef.current) {
                    clearTimeout(retryTimeoutRef.current);
                }
            };
        } else {
            setError('ID du leaderboard manquant');
        }
    }, [leaderboard_id, leaderboard_id2, isCumulativeMode]);

    if (error) {
        return (
            <div className='summary-overlay'>
                <div className='summary-error'>{error}</div>
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

export default LeaderboardGamewardAllWls;