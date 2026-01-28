import './LeaderboardGameward-wlsV2.css';
import React, { useState, useEffect, useRef } from "react";
import { useLocation } from 'react-router-dom';

import indicateurIceeCup from './indicateur_pov_corps_icee_cup.png';
import indicateurVoxeCup from './indicateur_pov_corps_voxe_cup.png';
import indicateurTylioCup from './indicateur_pov_corps_tylio_cup.png';
import indicateurBaxoCup from './indicateur_pov_corps_baxo_cup.png';
import indicateurNociffCup from './indicateur_pov_corps_nociff_cup.png';

import IconIcee from './IconIcee.png';
import IconBaxo from './IconBaxo.png';

import IconTylio from './IconTylio.png';
import IconVoxe from './IconVoxe.png';

const formatNumber = (num) => {
    if (num === null || num === undefined || num === '-') return num;
    const numValue = typeof num === 'string' ? parseInt(num, 10) : num;
    if (isNaN(numValue)) return num;
    if (numValue >= 10000) {
        return numValue.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1\u2009');
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

function PlayerCanvas({ baseImage, playerData, gamesTarget }) {
    const canvasRef = useRef(null);
    const imageRef = useRef(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const prevRankRef = useRef(null);
    const [rankColor, setRankColor] = useState('#ffffff');
    const rankColorTimeoutRef = useRef(null);

    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            imageRef.current = img;
            setImageLoaded(true);
        };
        img.src = baseImage;
    }, [baseImage]);

    useEffect(() => {
        if (playerData?.rank !== undefined && playerData?.rank !== null) {
            const currentRank = playerData.rank;
            const prevRank = prevRankRef.current;

            if (prevRank !== null && prevRank !== currentRank) {
                if (rankColorTimeoutRef.current) {
                    clearTimeout(rankColorTimeoutRef.current);
                }

                if (currentRank < prevRank) {
                    setRankColor('#00ff00');
                } else if (currentRank > prevRank) {
                    setRankColor('#ff0000');
                }

                rankColorTimeoutRef.current = setTimeout(() => {
                    setRankColor('#ffffff');
                }, 2000);
            }

            prevRankRef.current = currentRank;
        }

        return () => {
            if (rankColorTimeoutRef.current) {
                clearTimeout(rankColorTimeoutRef.current);
            }
        };
    }, [playerData?.rank]);

    useEffect(() => {
        if (!imageLoaded || !canvasRef.current || !imageRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = imageRef.current;

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 48px Roboto, Arial, sans-serif';

        const topX = img.width * 0.597;
        const pointsX = img.width * 0.74;
        const gameX = img.width * 0.895;
        const statsY = img.height * 0.82;

        ctx.fillStyle = rankColor;
        ctx.fillText(playerData?.rank ? formatNumber(playerData.rank) : '-', topX, statsY);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(playerData?.points !== undefined ? formatNumber(playerData.points) : '-', pointsX, statsY);

        const gamesValue = playerData?.games !== undefined ? String(playerData.games) : '-';

        if (playerData?.games >= 1 && gamesTarget) {
            const currentText = gamesValue;
            const slashText = '/';
            const targetText = String(gamesTarget);

            const currentWidth = ctx.measureText(currentText).width;
            const slashWidth = ctx.measureText(slashText).width;
            const targetWidth = ctx.measureText(targetText).width;
            const totalWidth = currentWidth + slashWidth + targetWidth;

            const startX = gameX - totalWidth / 2;

            ctx.textAlign = 'left';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(currentText, startX, statsY);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.fillText(slashText, startX + currentWidth, statsY);
            ctx.fillText(targetText, startX + currentWidth + slashWidth, statsY);

            ctx.textAlign = 'center';
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.fillText(gamesValue, gameX, statsY);
        }

    }, [imageLoaded, playerData, gamesTarget, rankColor]);

    return (
        <canvas
            ref={canvasRef}
            className="player_canvas_v2"
        />
    );
}

function LeaderboardGamewardV2() {
    const location = useLocation();

    const parseIdAndTarget = (raw) => {
        if (!raw) return { id: null, target: null };
        const [idPart, targetPart] = String(raw).split('/');
        const target = targetPart && /^\d+$/.test(targetPart) ? parseInt(targetPart, 10) : null;
        return { id: idPart, target };
    };

    const searchParams = new URLSearchParams(location.search);
    const rawId = searchParams.get('id');
    const rawId2 = searchParams.get('id2');

    let refreshInterval = 10000;
    const explicitRefresh = searchParams.get('refresh') || searchParams.get('duration');
    if (explicitRefresh && /^\d+$/.test(explicitRefresh)) {
        refreshInterval = parseInt(explicitRefresh, 10) * 1000;
    } else {
        for (const key of searchParams.keys()) {
            if (/^\d+$/.test(key) && searchParams.get(key) === '') {
                refreshInterval = parseInt(key, 10) * 1000;
                break;
            }
        }
    }

    const { id: leaderboardIdCore, target: targetFromId } = parseIdAndTarget(rawId);
    const { id: leaderboardId2Core, target: targetFromId2 } = parseIdAndTarget(rawId2);
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];
    const targetFromPath = lastSegment && /^\d+$/.test(lastSegment) ? parseInt(lastSegment, 10) : null;

    const gamesTarget = targetFromId ?? targetFromId2 ?? targetFromPath ?? null;

    const playerConfigs = [
        {
            ingame_id: "70a8b05d217d47a381e9137b9a0dce51",
            display_player_name: "Icee",
            indicateur_image: indicateurIceeCup,
            icon: IconIcee
        },
        {
            ingame_id: "48a10d6404c649198c8cf382f12253bc",
            display_player_name: "Voxe",
            indicateur_image: indicateurVoxeCup,
            icon: IconVoxe
        },
        {
            ingame_id: "d038d3b7a13d4323b2ebca05644d9124",
            display_player_name: "Tylio",
            indicateur_image: indicateurTylioCup,
            icon: IconTylio
        },
        {
            ingame_id: "84867c4ef9674c9b838b0c9c815a58fc",
            display_player_name: "Baxo",
            indicateur_image: indicateurBaxoCup,
            icon: IconBaxo
        },
        {
            ingame_id: "e8e6c5346fe646ba8fa5dc37002eb22d",
            display_player_name: "NociFf",
            indicateur_image: indicateurNociffCup,
            icon: null
        },
        {
            ingame_id: "",
            display_player_name: "PlayerEU",
            indicateur_image: null,
            icon: null
        }
    ];

    const [playersData, setPlayersData] = useState(new Array(playerConfigs.length).fill(null));
    const [error, setError] = useState(null);
    const errorCountRef = useRef(0);
    const lastSuccessRef = useRef(Date.now());
    const lastValidDataRef = useRef({ players: new Array(playerConfigs.length).fill(null) });
    const retryTimeoutRef = useRef(null);

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
                                    const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : 25000;
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

                const isCumulativeMode = !!leaderboardId2Core;
                const allPagesData1 = await loadLeaderboardData(leaderboardIdCore, !isCumulativeMode);
                let allPagesData2 = [];

                if (leaderboardId2Core) {
                    allPagesData2 = await loadLeaderboardData(leaderboardId2Core, false);
                }

                const foundPlayers = new Array(playerConfigs.length).fill(null);

                playerConfigs.forEach((config, index) => {
                    if (config.ingame_id && config.ingame_id.trim() !== '') {
                        let playerData1 = null;
                        let playerData2 = null;

                        allPagesData1.forEach(data => {
                            for (let team in data.teams) {
                                const sessions = data.teams[team].sessions;
                                const gamesCount = Object.keys(sessions).length;
                                const members = Object.values(data.teams[team].members);

                                const playerInTeam = members.find(member =>
                                    member.ingame_id === config.ingame_id
                                );

                                if (playerInTeam && !playerData1) {
                                    playerData1 = {
                                        rank: data.teams[team].place,
                                        points: data.teams[team].points,
                                        games: gamesCount
                                    };
                                }
                            }
                        });

                        if (leaderboardId2Core) {
                            allPagesData2.forEach(data => {
                                for (let team in data.teams) {
                                    const sessions = data.teams[team].sessions;
                                    const gamesCount = Object.keys(sessions).length;
                                    const members = Object.values(data.teams[team].members);

                                    const playerInTeam = members.find(member =>
                                        member.ingame_id === config.ingame_id
                                    );

                                    if (playerInTeam && !playerData2) {
                                        playerData2 = {
                                            rank: data.teams[team].place,
                                            points: data.teams[team].points,
                                            games: gamesCount
                                        };
                                    }
                                }
                            });
                        }

                        if (playerData1 || playerData2) {
                            if (leaderboardId2Core) {
                                const data1 = playerData1 || { rank: 999, points: 0, games: 0 };
                                const data2 = playerData2 || { rank: 999, points: 0, games: 0 };

                                foundPlayers[index] = {
                                    playerName: config.display_player_name,
                                    rank: null,
                                    points: data1.points + data2.points,
                                    games: data1.games + data2.games,
                                    bestIndividualRank: Math.min(data1.rank, data2.rank)
                                };
                            } else {
                                foundPlayers[index] = {
                                    playerName: config.display_player_name,
                                    rank: playerData1.rank,
                                    points: playerData1.points,
                                    games: playerData1.games
                                };
                            }
                        }
                    }
                });

                if (leaderboardId2Core) {
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

                            if (leaderboardId2Core) {
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
                                    member.ingame_id === config.ingame_id
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

                lastValidDataRef.current = { players: [...foundPlayers] };
                setPlayersData(foundPlayers);

                setError(null);
                errorCountRef.current = 0;
                lastSuccessRef.current = Date.now();
            } catch (error) {
                errorCountRef.current += 1;
                setError(null);
                if (retryTimeoutRef.current) {
                    clearTimeout(retryTimeoutRef.current);
                }
                retryTimeoutRef.current = setTimeout(() => {
                    loadPlayersData();
                }, refreshInterval);
            }
        };

        if (leaderboardIdCore) {
            loadPlayersData();
            const interval = setInterval(loadPlayersData, refreshInterval);
            return () => {
                clearInterval(interval);
                if (retryTimeoutRef.current) {
                    clearTimeout(retryTimeoutRef.current);
                }
            };
        } else {
            setError('Overlay');
        }
    }, [leaderboardIdCore, leaderboardId2Core, gamesTarget, refreshInterval]);

    if (error) {
        return (
            <div className='gameward_overlay_v2'>
                <div className='error_container_v2'>
                    <div className='error_text_v2'>{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className='gameward_overlay_v2'>
            {playerConfigs.map((config, index) => {
                const playerData = playersData[index];

                if (!config.indicateur_image) {
                    return (
                        <div key={index} className='player_card_v2'>
                        </div>
                    );
                }

                return (
                    <div key={index} className='player_card_v2'>
                        <PlayerCanvas
                            baseImage={config.indicateur_image}
                            playerData={playerData}
                            gamesTarget={gamesTarget}
                        />
                    </div>
                );
            })}
        </div>
    );
}

export default LeaderboardGamewardV2;
