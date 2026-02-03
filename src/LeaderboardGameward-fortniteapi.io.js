import './LeaderboardGameward-fortniteapi.io.css';
import React, { useState, useEffect, useRef } from "react";
import { useLocation } from 'react-router-dom';

import indicateurIceeCup from './indicateur_pov_corps_icee_cup.png';
import indicateurVoxeCup from './indicateur_pov_corps_voxe_cup.png';
import indicateurTylioCup from './indicateur_pov_corps_tylio_cup.png';
import indicateurBaxoCup from './indicateur_pov_corps_baxo_cup.png';
import indicateurNociffCup from './indicateur_pov_corps_nociff_cup.png';
import indicateurKombekCup from './indicateur_pov_corps_kombek_cup.png';

const formatNumber = (num) => {
    if (num === null || num === undefined || num === '-') return num;
    const numValue = typeof num === 'string' ? parseInt(num, 10) : num;
    if (isNaN(numValue)) return num;
    if (numValue >= 10000) {
        return numValue.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1\u2009');
    }
    return numValue.toString();
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
        ctx.font = 'bold 55px Roboto, Arial, sans-serif';

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
            const spacing = 6;
            const totalWidth = currentWidth + spacing + slashWidth + spacing + targetWidth;

            const startX = gameX - totalWidth / 2;

            ctx.textAlign = 'left';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(currentText, startX, statsY);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.fillText(slashText, startX + currentWidth + spacing, statsY);
            ctx.fillText(targetText, startX + currentWidth + spacing + slashWidth + spacing, statsY);

            ctx.textAlign = 'center';
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.fillText(gamesValue, gameX, statsY);
        }

    }, [imageLoaded, playerData, gamesTarget, rankColor]);

    return (
        <canvas
            ref={canvasRef}
            className="player_canvas_fortnite"
        />
    );
}

function LeaderboardGamewardFortniteApi() {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    const parseIdAndTarget = (raw) => {
        if (!raw) return { id: null, target: null };
        const [idPart, targetPart] = String(raw).split('/');
        const target = targetPart && /^\d+$/.test(targetPart) ? parseInt(targetPart, 10) : null;
        return { id: idPart, target };
    };

    const { id: eventId, target: targetFromId } = parseIdAndTarget(searchParams.get('eventId'));
    const { id: eventId2, target: targetFromId2 } = parseIdAndTarget(searchParams.get('eventId2'));
    const API_KEY = process.env.REACT_APP_FORTNITE_API_KEY;

    const targetParam = searchParams.get('target');
    const gamesTarget = targetFromId ?? targetFromId2 ?? (targetParam && /^\d+$/.test(targetParam) ? parseInt(targetParam, 10) : null);

    const isCumulativeMode = eventId2 !== null;

    const playerConfigs = [
        {
            epic_id: "70a8b05d217d47a381e9137b9a0dce51",
            display_player_name: "Icee",
            indicateur_image: indicateurIceeCup
        },
        {
            epic_id: "e8e6c5346fe646ba8fa5dc37002eb22d",
            display_player_name: "NociFf",
            indicateur_image: indicateurNociffCup
        },
        {
            epic_id: "2a208e4f0ad94df495aaf82bf74beda9",
            display_player_name: "Kombek",
            indicateur_image: indicateurKombekCup
        },
        {
            epic_id: "d038d3b7a13d4323b2ebca05644d9124",
            display_player_name: "Tylio",
            indicateur_image: indicateurTylioCup
        },
        {
            epic_id: "48a10d6404c649198c8cf382f12253bc",
            display_player_name: "Voxe",
            indicateur_image: indicateurVoxeCup
        },
        {
            epic_id: "84867c4ef9674c9b838b0c9c815a58fc",
            display_player_name: "Baxo",
            indicateur_image: indicateurBaxoCup
        }
    ];

    const [playersData, setPlayersData] = useState(new Array(playerConfigs.length).fill(null));
    const [error, setError] = useState(null);

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

                    teamCumulativeData.forEach((team) => {
                        const allSessions = [...team.day1SessionHistory, ...team.day2SessionHistory];
                        const totalSessionPoints = allSessions.reduce((sum, session) => sum + (session.pointsEarned || 0), 0);
                        team.cumulativeAvgPoints = team.cumulativeGames > 0 ? totalSessionPoints / team.cumulativeGames : 0;
                    });

                    const cumulativeResults = Array.from(teamCumulativeData.values())
                        .sort((a, b) => {
                            if (b.cumulativePoints !== a.cumulativePoints) return b.cumulativePoints - a.cumulativePoints;
                            if (b.cumulativeWins !== a.cumulativeWins) return b.cumulativeWins - a.cumulativeWins;
                            return b.cumulativeAvgPoints - a.cumulativeAvgPoints;
                        })
                        .map((team, index) => ({
                            ...team,
                            rank: index + 1,
                            pointsEarned: team.cumulativePoints
                        }));

                    for (let i = 0; i < playerConfigs.length; i++) {
                        const config = playerConfigs[i];
                        if (!config.epic_id || config.epic_id.trim() === "") continue;

                        const teamData = cumulativeResults.find(team =>
                            team.teamAccountIds && team.teamAccountIds.includes(config.epic_id)
                        );

                        if (teamData) {
                            foundPlayers[i] = {
                                playerName: config.display_player_name,
                                rank: teamData.rank,
                                points: teamData.pointsEarned,
                                games: teamData.cumulativeGames || 0
                            };
                        }
                    }
                } else {
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
                                            if (!config.epic_id || config.epic_id.trim() === "") continue;

                                            const teamData = data.session.results.find(team =>
                                                team.teamAccountIds && team.teamAccountIds.includes(config.epic_id)
                                            );

                                            if (teamData) {
                                                foundPlayers[i] = {
                                                    playerName: config.display_player_name,
                                                    rank: teamData.rank,
                                                    points: teamData.pointsEarned,
                                                    games: teamData.sessionHistory ? teamData.sessionHistory.length : 0
                                                };
                                                playersFound++;

                                                if (playersFound >= validPlayerConfigs.length) break;
                                            }
                                        }
                                    }
                                }
                            }
                        } catch (pageError) {}

                        page++;
                    }
                }

                setPlayersData(foundPlayers);
                setError(null);
            } catch (error) {
                setError('Erreur lors du chargement des données: ' + error.message);
            }
        };

        if (eventId) {
            loadPlayersData();
            const interval = setInterval(loadPlayersData, 20000);
            return () => clearInterval(interval);
        } else {
            setError('Overlay');
        }
    }, [eventId, eventId2, isCumulativeMode]);

    if (error) {
        return (
            <div className='gameward_overlay_fortnite'>
                <div className='error_container_fortnite'>
                    <div className='error_text_fortnite'>{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className='gameward_overlay_fortnite'>
            {playerConfigs.map((config, index) => {
                const playerData = playersData[index];

                if (!config.indicateur_image) {
                    return (
                        <div key={index} className='player_card_fortnite'>
                        </div>
                    );
                }

                return (
                    <div key={index} className='player_card_fortnite'>
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

export default LeaderboardGamewardFortniteApi;
