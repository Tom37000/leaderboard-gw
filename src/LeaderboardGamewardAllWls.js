import './LeaderboardGamewardAllWls.css';
import React, { useState, useEffect, useRef } from "react";
import { useLocation } from 'react-router-dom';
import iceeImage from './icee.png';
import tylioImage from './tylio.png';
import voxeImage from './voxe.png';
import BaxoImage from './baxo.png';
import avatarPersonne from './avatar-personne.png';
import IconNociff from './Nociff.png';
import IconKombek from './Kombek.png';


const formatNumber = (num) => {
    if (num === null || num === undefined || num === '-') return num;
    const numValue = typeof num === 'string' ? parseInt(num, 10) : num;
    if (isNaN(numValue)) return num;
    if (numValue >= 10000) {
        return numValue.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1 ');
    }
    return numValue.toString();
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

function LeaderboardGamewardAllWls() {
    const urlParams = new URLSearchParams(useLocation().search);
    const leaderboard_id = urlParams.get('id');
    const leaderboard_id2 = urlParams.get('id2');

    const isCumulativeMode = leaderboard_id2 !== null;

    const playerConfigs = [
        {
            ingame_id: "70a8b05d217d47a381e9137b9a0dce51",
            display_player_name: "Icee",
            avatar_image: iceeImage
        },
        {
            ingame_id: "48a10d6404c649198c8cf382f12253bc",
            display_player_name: "Voxe",
            avatar_image: voxeImage
        },
        {
            ingame_id: "d038d3b7a13d4323b2ebca05644d9124",
            display_player_name: "Tylio",
            avatar_image: tylioImage
        },
        {
            ingame_id: "84867c4ef9674c9b838b0c9c815a58fc",
            display_player_name: "Baxo",
            avatar_image: BaxoImage
        },
        {
            ingame_id: "e8e6c5346fe646ba8fa5dc37002eb22d",
            display_player_name: "Nociff",
            avatar_image: IconNociff
        },
        {
            ingame_id: "2a208e4f0ad94df495aaf82bf74beda9",
            display_player_name: "Kombek",
            avatar_image: IconKombek
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
                const fetchWithRetry = async (url, maxRetries = 3, timeout = 20000) => {
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
                                if (response.status === 429) {
                                    const retryAfter = response.headers.get('Retry-After');
                                    const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : 30000;
                                    console.warn(`Rate limit atteint, attente de ${delay}ms avant nouvelle tentative...`);
                                    await new Promise(resolve => setTimeout(resolve, delay));
                                    continue;
                                }
                                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                            }

                            return await response.json();
                        } catch (error) {
                            if (attempt === maxRetries) {
                                throw new Error(`Échec après ${maxRetries} tentatives: ${error.message}`);
                            }

                            const delay = Math.min(2000 * Math.pow(2, attempt - 1), 30000);
                            console.warn(`Tentative ${attempt}/${maxRetries} échouée, nouvelle tentative dans ${delay}ms...`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                        }
                    }
                };

                const validIngameIds = playerConfigs
                    .filter(config => config.ingame_id && config.ingame_id.trim() !== '')
                    .map(config => config.ingame_id);
                const ingameIdsParam = validIngameIds.length > 0 ? `ingame_id=${validIngameIds.join(',')}` : '';
                const loadLeaderboardData = async (leaderboardId, useFilter = true) => {
                    const url = (useFilter && ingameIdsParam)
                        ? `https://api.wls.gg/v5/leaderboards/${leaderboardId}?${ingameIdsParam}`
                        : `https://api.wls.gg/v5/leaderboards/${leaderboardId}?page=0`;
                    const firstData = await fetchWithRetry(url);
                    if (useFilter && ingameIdsParam) {
                        return [firstData];
                    }

                    const totalPages = firstData.total_pages || 1;

                    const results = [firstData];
                    for (let page = 1; page < totalPages; page++) {
                        await new Promise(resolve => setTimeout(resolve, 200));
                        const pageData = await fetchWithRetry(`https://api.wls.gg/v5/leaderboards/${leaderboardId}?page=${page}`);
                        results.push(pageData);
                    }

                    return results;
                };

                const foundPlayers = new Array(playerConfigs.length).fill(null);

                if (isCumulativeMode) {
                    const allPagesData1 = await loadLeaderboardData(leaderboard_id, false);
                    const allPagesData2 = await loadLeaderboardData(leaderboard_id2, false);

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

                    playerConfigs.forEach((config, index) => {
                        if (config.ingame_id && config.ingame_id.trim() !== '') {
                            const playerTeam = globalTeamRanking.find(team =>
                                team.members.some(member =>
                                    member.ingame_id === config.ingame_id
                                )
                            );

                            if (playerTeam) {
                                const newPlayerData = {
                                    playerName: config.display_player_name,
                                    rank: playerTeam.globalRank,
                                    points: playerTeam.totalPoints,
                                    games: Object.keys(playerTeam.sessions).length
                                };
                                foundPlayers[index] = newPlayerData;
                                updatePlayerDataIfChanged(newPlayerData, index);
                            }
                        }
                    });
                } else {
                    const allPagesData = await loadLeaderboardData(leaderboard_id);

                    playerConfigs.forEach((config, index) => {
                        if (config.ingame_id && config.ingame_id.trim() !== '') {
                            let playerData = null;

                            allPagesData.forEach(data => {
                                for (let team in data.teams) {
                                    const sessions = Object.values(data.teams[team].sessions);
                                    const gamesCount = sessions.length;
                                    const members = Object.values(data.teams[team].members);

                                    const playerInTeam = members.find(member =>
                                        member.ingame_id === config.ingame_id
                                    );

                                    if (playerInTeam && !playerData) {
                                        playerData = {
                                            rank: data.teams[team].place,
                                            points: data.teams[team].points,
                                            games: gamesCount
                                        };
                                    }
                                }
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
                errorCountRef.current += 1;
                if (lastValidDataRef.current.some(data => data !== null)) {
                } else {
                }
                setError(null);
                if (retryTimeoutRef.current) {
                    clearTimeout(retryTimeoutRef.current);
                }
                retryTimeoutRef.current = setTimeout(() => {
                    loadPlayersData();
                }, 10000);
            }
        };

        if (leaderboard_id) {
            if (isCumulativeMode && !leaderboard_id2) {
                setError('Pour le mode cumulatif, les deux IDs de leaderboard sont requis (id et id2)');
                return;
            }
            loadPlayersData();
            const interval = setInterval(loadPlayersData, 10000);
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
        .filter(player => player.config.display_player_name && player.config.display_player_name.trim() !== '')
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

            {!error && (
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
                            const isKombek = player.config.display_player_name === "Kombek";
                            const avatarClass = `summary-avatar-simple${isKombek ? ' avatar-kombek' : ''}`;
                            return (
                                <div key={player.index} className={`summary-player-simple ${rankClass}`}>
                                    <div className="player-rank-simple">
                                        {formatNumber(player.rank)}
                                    </div>
                                    <img
                                        src={player.config.avatar_image}
                                        alt="Avatar"
                                        className={avatarClass}
                                    />
                                    <div className='player-name-simple'>
                                        {player.playerName}
                                    </div>
                                    <div className='player-points-simple'>
                                        {formatNumber(player.points)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default LeaderboardGamewardAllWls;