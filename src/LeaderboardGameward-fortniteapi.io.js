import './LeaderboardGameward-fortniteapi.io.css';
import React, { useState, useEffect, useRef } from "react";
import { useLocation } from 'react-router-dom';
import noeImage from './noe.png';
import iceeImage from './icee.png';
import laynImage from './layn.png';

function LeaderboardGamewardFortniteApi() {
    const eventId = new URLSearchParams(useLocation().search).get('eventId');
    const API_KEY = process.env.REACT_APP_FORTNITE_API_KEY;
    
    const playerConfigs = [
        {
            epic_id: "70a8b05d217d47a381e9137b9a0dce51",
            display_player_name: "Icee",
            avatar_image: iceeImage
        },
        {
            epic_id: "31d45164d7cc4c96bef16da56c2b5f8c", 
            display_player_name: "Noé", 
            avatar_image: noeImage
        },
        {
            epic_id: "3ed9da5cff0948c98196c803412d6321", 
            display_player_name: "Layn", 
            avatar_image: laynImage
        }
    ];

    const [playersData, setPlayersData] = useState([null, null, null]);
    const [error, setError] = useState(null);
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
            console.log(`Données mises à jour pour ${newPlayerData.playerName}:`, newPlayerData);
        } else {
            console.log(`Aucun changement pour ${newPlayerData.playerName}`);
        }
    };

    useEffect(() => {
        const loadPlayersData = async () => {
            console.log('Chargement des données pour eventId:', eventId);
            console.log('Configuration des joueurs:', playerConfigs);
            try {
                const foundPlayers = new Array(playerConfigs.length).fill(null);
                

                const searchAllPages = async () => {
                    let page = 0;
                    let totalPages = 1;
                    let playersFound = 0;
                    
                    while (page < totalPages && playersFound < playerConfigs.length) {
                        try {
                            const response = await fetch(`https://fortniteapi.io/v1/events/window?windowId=${eventId}&page=${page}`, {
                                headers: {
                                    'Authorization': API_KEY
                                }
                            });
                            
                            if (response.ok) {
                                const data = await response.json();
                                console.log(`Réponse API page ${page}:`, data);
                                
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
                                                console.log(`Joueur ${config.display_player_name} trouvé à la page ${page}, rang ${teamData.rank}`);
                                                

                                                updatePlayerDataIfChanged(newPlayerData, i);
                                                

                                                if (playersFound >= playerConfigs.length) {
                                                    console.log('Tous les joueurs trouvés, arrêt de la recherche.');
                                                    return;
                                                }
                                            }
                                        }
                                    }
                                }
                            } else {
                                console.error(`Erreur API page ${page}:`, response.status);
                            }
                        } catch (pageError) {
                            console.error(`Erreur lors du chargement de la page ${page}:`, pageError);
                        }
                        
                        page++;
                    }
                    
                    console.log(`Recherche terminée. ${playersFound}/${playerConfigs.length} joueurs trouvés après ${page} pages.`);
                };
                
                await searchAllPages();
                

                foundPlayers.forEach((player, index) => {
                    if (player) {

                        if (hasDataChanged(player, previousDataRef.current[index], index)) {
                            updatePlayerDataIfChanged(player, index);
                        }
                    } else {

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
            loadPlayersData();
            const interval = setInterval(loadPlayersData, 60000); 
            return () => clearInterval(interval);
        } else {
            setError('ID de l\'événement manquant');
        }
    }, [eventId]);




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
                        <div className='player_name_linear'>
                            {playerData ? playerData.playerName : config.display_player_name}
                        </div>
                        
                        <div className='stats_display_linear'>
                            <div className='stat_item'>
                                <span className='stat_label'>TOP</span>
                                <span className='stat_value'>
                                    {playerData ? playerData.rank : '-'}
                                </span>
                            </div>
                            
                            <div className='stat_item'>
                                <span className='stat_label'>POINTS</span>
                                <span className='stat_value'>
                                    {playerData ? playerData.points : '-'}
                                </span>
                            </div>
                            
                            <div className='stat_item'>
                                <span className='stat_label'>GAMES</span>
                                <span className='stat_value'>
                                    {playerData ? playerData.games : '-'}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
     );
}

export default LeaderboardGamewardFortniteApi;
