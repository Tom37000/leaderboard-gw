import './LeaderboardGameward-wls.css';
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import noeImage from './noe.png';
import iceeImage from './icee.png';
import laynImage from './layn.png';
import avatarPersonne from './avatar-personne.png';

const extractGameData = (sessions) => {
    if (!sessions || Object.keys(sessions).length === 0) return [];
    
    console.log(`extractGameData - Traitement de ${Object.keys(sessions).length} sessions:`, sessions);
    
    return Object.values(sessions).map((session, index) => {
        const placement = session.place || '-';
        const kills = session.kills || 0;
        
        return {
            gameNumber: index + 1,
            placement: placement,
            kills: kills
        };
    });
};

const calculateTeamStats = (sessions) => {
    if (!sessions || Object.keys(sessions).length === 0) {
        return { 
            victoryCount: 0, 
            avgElims: 0, 
            avgPlacement: 0 
        };
    }
    
    const games = Object.values(sessions);
    const totalGames = games.length;
    const victoryCount = games.filter(game => game.place === 1).length;
    const totalKills = games.reduce((sum, game) => sum + (game.kills || 0), 0);
    const avgElims = totalGames > 0 ? totalKills / totalGames : 0;
    const totalPlacement = games.reduce((sum, game) => {
        const place = typeof game.place === 'string' ? parseInt(game.place, 10) : game.place;
        return sum + (isNaN(place) ? 100 : place);
    }, 0);
    const avgPlacement = totalGames > 0 ? totalPlacement / totalGames : 100;
    
    return {
        victoryCount,
        avgElims,
        avgPlacement
    };
};

function PlayerGameSlideshow({ sessionData, playerName, playerData }) {
    const [currentGameIndex, setCurrentGameIndex] = useState(0);
    const [fadeClass, setFadeClass] = useState('fade-in');
    const [isVisible, setIsVisible] = useState(false);
    const [containerVisible, setContainerVisible] = useState(false);
    
    const gameData = sessionData ? extractGameData(sessionData) : [];
    
    if (gameData.length > 0) {
        console.log(`${playerName} - Nombre total de games: ${gameData.length}`);
        console.log(`${playerName} - Détail des games:`, gameData.map(g => `Game ${g.gameNumber}: Top ${g.placement}, ${g.kills} kills`));
    }
    
    useEffect(() => {
        if (gameData.length >= 2) {
            const displayDuration = gameData.length * 5000;
            const cycleDuration = 4 * 60 * 1000; 
            
            console.log(` [${playerName}] Slideshow configuré: ${gameData.length} games, cycle de ${cycleDuration/1000}s, affichage de ${displayDuration/1000}s`);
            
            const visibilityInterval = setInterval(() => {
                console.log(`🔄 [${playerName}] Début du cycle slideshow - ${new Date().toLocaleTimeString()}`);
                setCurrentGameIndex(0);
                setContainerVisible(true);
                setTimeout(() => {
                    setIsVisible(true);
                    console.log(` [${playerName}] Slideshow visible - Game 1/${gameData.length}`);
                }, 300);

                setTimeout(() => {
                    console.log(` [${playerName}] Fin du cycle slideshow - ${new Date().toLocaleTimeString()}`);
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
                    setCurrentGameIndex(prev => {
                        const nextIndex = (prev + 1) % gameData.length;
                        const currentGame = gameData[nextIndex];
                        console.log(` [${playerName}] Affichage Game ${nextIndex + 1}/${gameData.length}: Top ${currentGame.placement}, ${currentGame.kills} kills - ${new Date().toLocaleTimeString()}`);
                        return nextIndex;
                    });
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
        console.error(`${playerName} - currentGame est undefined pour index ${currentGameIndex}, gameData.length: ${gameData.length}`);
        return null;
    }
    
    console.log(`${playerName} - Affichage game ${currentGameIndex + 1}/${gameData.length}: Game ${currentGame.gameNumber}`);
    
    return (
        <div className={`game_display_container ${containerVisible ? 'visible' : ''}`}>
            <div className={`game_text ${fadeClass}`}>
                Game {currentGame.gameNumber} : Top {currentGame.placement}, {currentGame.kills} kills
            </div>
        </div>
    );
}

function LeaderboardGameward() {
    const leaderboard_id = new URLSearchParams(useLocation().search).get('id');
    const leaderboard_id2 = new URLSearchParams(useLocation().search).get('id2');
    const navigate = useNavigate();
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
    const [playersSessionData, setPlayersSessionData] = useState(new Array(playerConfigs.length).fill(null));
    const [error, setError] = useState(null);
    const errorCountRef = useRef(0);
    const lastSuccessRef = useRef(Date.now());
    const lastValidDataRef = useRef({ players: new Array(playerConfigs.length).fill(null), sessions: new Array(playerConfigs.length).fill(null) });
    const retryTimeoutRef = useRef(null);

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
                const allPagesData1 = await loadLeaderboardData(leaderboard_id);
                let allPagesData2 = [];
                
                if (leaderboard_id2) {
                    allPagesData2 = await loadLeaderboardData(leaderboard_id2);
                }
                
                const foundPlayers = new Array(playerConfigs.length).fill(null);
                const foundPlayersSessions = new Array(playerConfigs.length).fill(null);
                
                playerConfigs.forEach((config, index) => {
                    if (config.wls_player_name) {
                        let playerData1 = null;
                        let playerData2 = null;
                        let sessions1 = null;
                        let sessions2 = null;
                    
                        allPagesData1.forEach(data => {
                            for (let team in data.teams) {
                                const sessions = data.teams[team].sessions;
                                const gamesCount = Object.keys(sessions).length;
                                const members = Object.values(data.teams[team].members);
                                
                                const playerInTeam = members.find(member => 
                                    member.name.toLowerCase().includes(config.wls_player_name.toLowerCase()) ||
                                    (member.ingame_name && member.ingame_name.toLowerCase().includes(config.wls_player_name.toLowerCase()))
                                );
                                
                                if (playerInTeam && !playerData1) {
                                    playerData1 = {
                                        rank: data.teams[team].place,
                                        points: data.teams[team].points,
                                        games: gamesCount
                                    };
                                    sessions1 = sessions;
                                }
                            }
                        });
                        
                        if (leaderboard_id2) {
                            allPagesData2.forEach(data => {
                                for (let team in data.teams) {
                                    const sessions = data.teams[team].sessions;
                                    const gamesCount = Object.keys(sessions).length;
                                    const members = Object.values(data.teams[team].members);
                                    
                                    const playerInTeam = members.find(member => 
                                        member.name.toLowerCase().includes(config.wls_player_name.toLowerCase()) ||
                                        (member.ingame_name && member.ingame_name.toLowerCase().includes(config.wls_player_name.toLowerCase()))
                                    );
                                    
                                    if (playerInTeam && !playerData2) {
                                        playerData2 = {
                                            rank: data.teams[team].place,
                                            points: data.teams[team].points,
                                            games: gamesCount
                                        };
                                        sessions2 = sessions;
                                    }
                                }
                            });
                        }
                        if (playerData1 || playerData2) {
                            if (leaderboard_id2) {
                                const data1 = playerData1 || { rank: 999, points: 0, games: 0 };
                                const data2 = playerData2 || { rank: 999, points: 0, games: 0 };
                                
                                foundPlayers[index] = {
                                    playerName: config.display_player_name,
                                    rank: null, 
                                    points: data1.points + data2.points,
                                    games: data1.games + data2.games,
                                    bestIndividualRank: Math.min(data1.rank, data2.rank)
                                };
                                const combinedSessions = {};
                                if (sessions1) Object.assign(combinedSessions, sessions1);
                                if (sessions2) Object.assign(combinedSessions, sessions2);
                                foundPlayersSessions[index] = combinedSessions;
                            } else {
                                foundPlayers[index] = {
                                    playerName: config.display_player_name,
                                    rank: playerData1.rank,
                                    points: playerData1.points,
                                    games: playerData1.games
                                };
                                foundPlayersSessions[index] = sessions1;
                            }
                        }
                    }
                });
                if (leaderboard_id2) {
                    const allTeamsMap = new Map();
                    allPagesData1.forEach(data => {
                        for (let teamId in data.teams) {
                            const teamData = data.teams[teamId];
                            const members = Object.values(teamData.members);
                            const memberNames = members.map(m => m.name.toLowerCase()).sort();
                            const teamKey = memberNames.join('|');
                            
                            allTeamsMap.set(teamKey, {
                                members: members,
                                points1: teamData.points,
                                points2: 0,
                                rank1: teamData.place,
                                rank2: 999,
                                teamKey: teamKey
                            });
                        }
                    });
                    allPagesData2.forEach(data => {
                        for (let teamId in data.teams) {
                            const teamData = data.teams[teamId];
                            const members = Object.values(teamData.members);
                            const memberNames = members.map(m => m.name.toLowerCase()).sort();
                            const teamKey = memberNames.join('|');
                            
                            if (allTeamsMap.has(teamKey)) {
                                const existing = allTeamsMap.get(teamKey);
                                existing.points2 = teamData.points;
                                existing.rank2 = teamData.place;
                            } else {
                                allTeamsMap.set(teamKey, {
                                    members: members,
                                    points1: 0,
                                    points2: teamData.points,
                                    rank1: 999,
                                    rank2: teamData.place,
                                    teamKey: teamKey
                                });
                            }
                        }
                    });
                    const globalTeamRanking = Array.from(allTeamsMap.entries())
                        .map(([teamKey, data]) => {
                            const combinedSessions = {};
                            allPagesData1.forEach(pageData => {
                                for (let teamId in pageData.teams) {
                                    const teamData = pageData.teams[teamId];
                                    const members = Object.values(teamData.members);
                                    const memberNames = members.map(m => m.name.toLowerCase()).sort();
                                    const currentTeamKey = memberNames.join('|');
                                    
                                    if (currentTeamKey === teamKey) {
                                        Object.assign(combinedSessions, teamData.sessions || {});
                                    }
                                }
                            });
                            if (leaderboard_id2) {
                                allPagesData2.forEach(pageData => {
                                    for (let teamId in pageData.teams) {
                                        const teamData = pageData.teams[teamId];
                                        const members = Object.values(teamData.members);
                                        const memberNames = members.map(m => m.name.toLowerCase()).sort();
                                        const currentTeamKey = memberNames.join('|');
                                        
                                        if (currentTeamKey === teamKey) {
                                            Object.assign(combinedSessions, teamData.sessions || {});
                                        }
                                    }
                                });
                            }
                            const stats = calculateTeamStats(combinedSessions);
                            
                            return {
                                teamKey,
                                members: data.members,
                                totalPoints: data.points1 + data.points2,
                                bestRank: Math.min(data.rank1, data.rank2),
                                victoryCount: stats.victoryCount,
                                avgElims: stats.avgElims,
                                avgPlacement: stats.avgPlacement,
                                sessions: combinedSessions
                            };
                        })
                        .sort((a, b) => {
                            if (b.totalPoints !== a.totalPoints) {
                                return b.totalPoints - a.totalPoints; 
                            }
                            if (b.victoryCount !== a.victoryCount) {
                                return b.victoryCount - a.victoryCount;
                            }
                            if (b.avgElims !== a.avgElims) {
                                return b.avgElims - a.avgElims;
                            }
                            if (a.avgPlacement !== b.avgPlacement) {
                                return a.avgPlacement - b.avgPlacement;
                            }
                            return a.bestRank - b.bestRank;
                        })
                        .map((team, index) => ({
                            ...team,
                            globalRank: index + 1
                        }));
                    
                    foundPlayers.forEach((player, index) => {
                        if (player !== null) {
                            const config = playerConfigs[index];
                            const playerTeam = globalTeamRanking.find(team => 
                                team.members.some(member => 
                                    member.name.toLowerCase().includes(config.wls_player_name.toLowerCase()) ||
                                    (member.ingame_name && member.ingame_name.toLowerCase().includes(config.wls_player_name.toLowerCase()))
                                )
                            );
                            
                            if (playerTeam) {
                                player.rank = playerTeam.globalRank;
                            } else {
                                player.rank = player.bestIndividualRank;
                            }
                        }
                    });
                }
                
                lastValidDataRef.current = { players: [...foundPlayers], sessions: [...foundPlayersSessions] };
                setPlayersData(foundPlayers);
                setPlayersSessionData(foundPlayersSessions);
                setError(null);
                errorCountRef.current = 0;
                lastSuccessRef.current = Date.now();
            } catch (error) {
                console.error('Error loading players data:', error);
                errorCountRef.current += 1;
                if (lastValidDataRef.current.players.some(data => data !== null)) {
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
            loadPlayersData();
            const interval = setInterval(loadPlayersData, 120000);
            return () => {
                clearInterval(interval);
                if (retryTimeoutRef.current) {
                    clearTimeout(retryTimeoutRef.current);
                }
            };
        } else {
            setError('ID du leaderboard manquant');
        }
    }, [leaderboard_id, leaderboard_id2]);


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
                            playerName={playerData ? playerData.playerName : config.display_player_name}
                            playerData={playerData}
                        />
                    </div>
                 );
            })}
        </div>
     );
}

export default LeaderboardGameward;