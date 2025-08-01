import './LeaderboardGameward-wls.css';
import React, { useState, useEffect } from "react";
import { useLocation } from 'react-router-dom';
import noeImage from './noe.png';
import iceeImage from './icee.png';
import laynImage from './layn.png';

function LeaderboardGameward() {
    const leaderboard_id = new URLSearchParams(useLocation().search).get('id');
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
        }
    ];

    const [playersData, setPlayersData] = useState([null, null, null]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadPlayersData = async () => {
            try {
                const firstResponse = await fetch(`https://api.wls.gg/v5/leaderboards/${leaderboard_id}?page=0`);
                const firstData = await firstResponse.json();
                
                const totalPages = firstData.total_pages || 1;
                
                const promises = [];
                for (let page = 0; page < totalPages; page++) {
                    promises.push(
                        fetch(`https://api.wls.gg/v5/leaderboards/${leaderboard_id}?page=${page}`)
                            .then(response => response.json())
                    );
                }
                
                const allPagesData = await Promise.all(promises);
                const foundPlayers = [null, null, null];
                
                playerConfigs.forEach((config, index) => {
                    if (config.wls_player_name) {
                        allPagesData.forEach(data => {
                            for (let team in data.teams) {
                                const sessions = Object.values(data.teams[team].sessions);
                                const gamesCount = sessions.length;
                                const members = Object.values(data.teams[team].members);
                                
                                const playerInTeam = members.find(member => 
                                    member.name.toLowerCase().includes(config.wls_player_name.toLowerCase()) ||
                                    (member.ingame_name && member.ingame_name.toLowerCase().includes(config.wls_player_name.toLowerCase()))
                                );
                                
                                if (playerInTeam && !foundPlayers[index]) {
                                    foundPlayers[index] = {
                                        playerName: config.display_player_name,
                                        rank: data.teams[team].place,
                                        points: data.teams[team].points,
                                        games: gamesCount
                                    };
                                }
                            }
                        });
                    }
                });
                
                setPlayersData(foundPlayers);
                setError(null);
            } catch (error) {
                console.error('Error loading players data:', error);
                setError('Erreur lors du chargement des données');
            }
        };
        
        if (leaderboard_id) {
            loadPlayersData();
            const interval = setInterval(loadPlayersData, 15000);
            return () => clearInterval(interval);
        } else {
            setError('ID du leaderboard manquant');
        }
    }, [leaderboard_id]);


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
                                <div className='stat_label'>GAMES</div>
                                <div className='stat_value'>
                                    {playerData ? playerData.games : '-'}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
     );
}

export default LeaderboardGameward;