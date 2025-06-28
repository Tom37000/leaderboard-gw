import './App.css';
import React, {useState, useEffect} from "react"
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

function Row({rank, teamname, points, elims, avg_place, wins, positionChange, showPositionIndicators, animationEnabled, hasPositionChanged, order}) {
    const renderPositionChange = () => {
        if (!showPositionIndicators) {
            return null;
        }
        
        const getIndicatorStyle = (type, value) => {
            const textLength = String(value).length;
            let baseWidth, fontSize, padding;
            if (textLength === 1) {
                baseWidth = 20;
                fontSize = 11;
                padding = '2px 6px';
            } else if (textLength === 2) {
                baseWidth = 26;
                fontSize = 10;
                padding = '2px 5px';
            } else if (textLength === 3) {
                baseWidth = 32;
                fontSize = 9;
                padding = '2px 4px';
            } else {
                baseWidth = 38;
                fontSize = 8;
                padding = '2px 3px';
            }
            
            const baseStyle = {
                padding: padding,
                borderRadius: '3px',
                fontSize: `${fontSize}px`,
                fontWeight: 'bold',
                border: '1px solid',
                minWidth: `${baseWidth}px`,
                textAlign: 'center',
                display: 'inline-block',
                marginLeft: '5px'
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
                    borderColor: '#4CAF50'
                };
            } else {
                return {
                    ...baseStyle,
                    backgroundColor: '#f44336',
                    color: '#fff',
                    borderColor: '#f44336'
                };
            }
        };

        if (positionChange === 0) {
            return <span className="position_change neutral" style={getIndicatorStyle('neutral', '=')}>=</span>;
        }
        if (positionChange > 0) {
            return <span className="position_change positive" style={getIndicatorStyle('positive', `+${positionChange}`)}>+{positionChange}</span>;
        } else {
            return <span className="position_change negative" style={getIndicatorStyle('negative', positionChange)}>{positionChange}</span>;
        }
    };

    const getAnimationStyle = () => {
        if (!animationEnabled || positionChange === 0) return {};
        
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

    return (
        <div className='row_container' style={{ 
            '--animation-order': order,
            opacity: (animationEnabled && hasPositionChanged) ? 0 : 1,
            animation: (animationEnabled && hasPositionChanged) ? 'fadeIn 0.5s forwards' : 'none',
            animationDelay: (animationEnabled && hasPositionChanged) ? `calc(var(--animation-order) * 0.1s)` : '0s',
            ...getAnimationStyle()
        }}>
            <div className='name_container'>
                <div className='rank_container' style={{fontFamily: rank < 4 ? 'OmnesBlack' : 'OmnesSemiBold'}}>
                    {rank}
                    {renderPositionChange()}
                </div>
                <div className='team_name' style={{fontFamily: rank < 4 ? 'OmnesBlack' : 'OmnesSemiBold'}}>{teamname}</div>
            </div>
            <div className='info_box' style={{fontFamily: rank < 4 ? 'OmnesBlack' : 'OmnesSemiBold'}}>{avg_place.toFixed(2)}</div>  
            <div className='info_box' style={{fontFamily: rank < 4 ? 'OmnesBlack' : 'OmnesSemiBold'}}>{elims}</div>  
            <div className='info_box' style={{fontFamily: rank < 4 ? 'OmnesBlack' : 'OmnesSemiBold'}}>{wins}</div>  
            <div className='info_box' style={{fontFamily: rank < 4 ? 'OmnesBlack' : 'OmnesSemiBold'}}>{points}</div>  
        </div>
    )
}

function LeaderboardWolt() {

    const leaderboard_id = new URLSearchParams(useLocation().search).get('id');

    const [leaderboard, setLeaderboard] = useState(null)
    const [page, setPage] = useState([0, 10])
    const [previousPositions, setPreviousPositions] = useState({})
    const [showPositionIndicators, setShowPositionIndicators] = useState(false)
    const [animationEnabled, setAnimationEnabled] = useState(false)

    const loadLeaderboard = async () => {
        try {
            const response = await fetch("https://api.wls.gg/v5/leaderboards/"+leaderboard_id)
            const data = await response.json()
            
            let leaderboard_list = []
            for (let team in data.teams){
                leaderboard_list.push({
                    teamname: Object.values(data.teams[team].members).map(member => member.name).join(' - '),
                    elims: Object.values(data.teams[team].sessions).map(session => session.kills).reduce((acc, curr) => acc + curr, 0),
                    avg_place: Object.values(data.teams[team].sessions).map(session => session.place).reduce((acc, curr, _, arr) => acc + curr / arr.length, 0),
                    wins: Object.values(data.teams[team].sessions).map(session => session.place).reduce((acc, curr) => acc + (curr === 1 ? 1 : 0), 0),
                    place: data.teams[team].place,
                    points: data.teams[team].points
                })
            }
            
            // Gestion des changements de position
            const storageKey = `leaderboard_positions_wolt_${leaderboard_id}`
            const storedPositions = JSON.parse(localStorage.getItem(storageKey) || '{}')
            const indicatorsStorageKey = `position_indicators_wolt_${leaderboard_id}`
            const storedIndicators = JSON.parse(localStorage.getItem(indicatorsStorageKey) || '{}')
            const lastChangeTimeKey = `last_change_time_wolt_${leaderboard_id}`
            const storedLastChangeTime = localStorage.getItem(lastChangeTimeKey)
            
            let hasChanges = false
            const newIndicators = {}
            const changedTeams = new Set()
            
            const now = Date.now()
            const shouldClearOldIndicators = storedLastChangeTime && (now - parseInt(storedLastChangeTime)) > 120000
            
            if (shouldClearOldIndicators) {
                localStorage.removeItem(indicatorsStorageKey)
                localStorage.removeItem(lastChangeTimeKey)
            }
            
            leaderboard_list.forEach(team => {
                const previousPosition = storedPositions[team.teamname]
                let positionChange = 0
                
                if (previousPosition !== undefined && previousPosition !== team.place) {
                    positionChange = previousPosition - team.place
                    if (positionChange !== 0) {
                        hasChanges = true
                        newIndicators[team.teamname] = positionChange
                        changedTeams.add(team.teamname)
                    }
                } else if (!shouldClearOldIndicators && storedIndicators[team.teamname] !== undefined) {
                    positionChange = storedIndicators[team.teamname]
                    if (positionChange !== 0) {
                        newIndicators[team.teamname] = positionChange
                    }
                }
            })
            
            const updatedLeaderboardData = leaderboard_list.map(team => {
                return {
                    ...team,
                    positionChange: newIndicators[team.teamname] || 0,
                    hasPositionChanged: changedTeams.has(team.teamname)
                }
            })
            
            // Sauvegarde des positions actuelles
            const currentPositions = {}
            leaderboard_list.forEach(team => {
                currentPositions[team.teamname] = team.place
            })
            localStorage.setItem(storageKey, JSON.stringify(currentPositions))
            localStorage.setItem(indicatorsStorageKey, JSON.stringify(newIndicators))
            
            const shouldShowIndicators = hasChanges || Object.keys(newIndicators).length > 0
            setShowPositionIndicators(shouldShowIndicators)
            
            if (hasChanges) {
                const now = Date.now()
                localStorage.setItem(lastChangeTimeKey, now.toString())
                
                if (changedTeams.size > 0) {
                    setAnimationEnabled(true)
                    
                    setTimeout(() => {
                        setAnimationEnabled(false)
                    }, 3000)
                }
            }
            
            console.log(data)
            setLeaderboard(updatedLeaderboardData)
        } catch (error) {
            console.error('Erreur lors du chargement du leaderboard:', error)
        }
    }

    useEffect(() => {
        loadLeaderboard()
        
        const interval = setInterval(loadLeaderboard, 30000)
        
        return () => clearInterval(interval)
    }, [leaderboard_id])

    function nextPage(){
        setPage(page.map(num => num + 10))
    }

    function previousPage(){
        setPage(page.map(num => num - 10 ))
    }
    
    return (
        <div className='leaderboard_container'>
            <div className='leaderboard_table'>
                <div className='header_container'>
                    <div className='name_header'>
                        <div onClick={previousPage} style={{marginLeft: "13px"}}>RANK</div>
                        <div>TEAM</div>
                    </div>
                    <div className='info_header'>AVG PLACE</div>
                    <div className='info_header'>ELIMS</div>
                    <div className='info_header'>WINS</div>
                    <div onClick={nextPage} className='info_header'>POINTS</div>
                </div>
                {leaderboard ? leaderboard.slice(page[0],page[1]).map((data, index) => {
                    const positionChange = Math.abs(data.positionChange || 0)
                    let animationOrder
                    
                    if (positionChange >= 500) {
                        animationOrder = 1
                    } else if (positionChange >= 100) {
                        animationOrder = 2
                    } else if (positionChange >= 50) {
                        animationOrder = 3
                    } else if (positionChange >= 10) {
                        animationOrder = 4
                    } else if (positionChange > 0) {
                        animationOrder = 5
                    } else {
                        animationOrder = index + 6
                    }
                    
                    return (
                        <Row 
                            key={`${index}`}
                            rank={data.place} 
                            teamname={data.teamname} 
                            points={data.points} 
                            elims={data.elims} 
                            wins={data.wins} 
                            avg_place={data.avg_place}
                            positionChange={data.positionChange || 0}
                            showPositionIndicators={showPositionIndicators}
                            animationEnabled={animationEnabled}
                            hasPositionChanged={data.hasPositionChanged || false}
                            order={animationOrder}
                        />
                    )
                }) : ''}
            </div>
            <div className='wolt_character'></div>
        </div>
    )
}

export default LeaderboardWolt