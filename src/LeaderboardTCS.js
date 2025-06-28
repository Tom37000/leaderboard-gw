import './App.css';
import React, {useState, useEffect} from "react"
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
            <div className='rank_container'>
                {rank}
                {renderPositionChange()}
            </div>
            <div className='name_container'>{teamname}</div>
            <div className='info_box'>{avg_place.toFixed(2)}</div>  
            <div className='info_box'>{elims}</div>  
            <div className='info_box'>{wins}</div>  
            <div className='info_box'>{points}</div>  
        </div>
    )
}

function LeaderboardTCS() {

    const leaderboard_id = new URLSearchParams(useLocation().search).get('id');

    const [leaderboard, setLeaderboard] = useState(null)
    const [page, setPage] = useState([0, 8])
    const [previousPositions, setPreviousPositions] = useState({})
    const [showPositionIndicators, setShowPositionIndicators] = useState(false)
    const [animationEnabled, setAnimationEnabled] = useState(false)

    const loadLeaderboard = async () => {
        try {
            const response = await fetch("https://api.wls.gg/v5/leaderboards/"+leaderboard_id);
            const data = await response.json();
            
            let leaderboard_list = []
            for (let team in data.teams){
                leaderboard_list.push({
                    teamname: Object.values(data.teams[team].members).map(member => member.name).sort().join(' - '),
                    elims: Object.values(data.teams[team].sessions).map(session => session.kills).reduce((acc, curr) => acc + curr, 0),
                    avg_place: Object.values(data.teams[team].sessions).map(session => session.place).reduce((acc, curr, _, arr) => acc + curr / arr.length, 0),
                    wins: Object.values(data.teams[team].sessions).map(session => session.place).reduce((acc, curr) => acc + (curr === 1 ? 1 : 0), 0),
                    place: data.teams[team].place,
                    points: data.teams[team].points
                })
            }
            
            // Get previous positions from localStorage
            const storedPositions = JSON.parse(localStorage.getItem(`leaderboard_positions_${leaderboard_id}`) || '{}');
            const storedIndicators = JSON.parse(localStorage.getItem(`leaderboard_indicators_${leaderboard_id}`) || 'false');
            
            // Calculate position changes
            const currentPositions = {};
            let hasAnyChange = false;
            
            leaderboard_list.forEach(team => {
                const teamKey = team.teamname;
                currentPositions[teamKey] = team.place;
                
                if (storedPositions[teamKey] !== undefined) {
                    const positionChange = storedPositions[teamKey] - team.place;
                    team.positionChange = positionChange;
                    team.hasPositionChanged = positionChange !== 0;
                    
                    if (positionChange !== 0) {
                        hasAnyChange = true;
                    }
                } else {
                    team.positionChange = 0;
                    team.hasPositionChanged = false;
                }
            });
            
            // Update state
            setLeaderboard(leaderboard_list);
            setPreviousPositions(currentPositions);
            
            if (hasAnyChange) {
                setShowPositionIndicators(true);
                setAnimationEnabled(true);
                
                // Hide indicators and disable animation after 3 seconds
                setTimeout(() => {
                    setAnimationEnabled(false);
                }, 3000);
            } else if (storedIndicators) {
                setShowPositionIndicators(true);
            }
            
            // Save current positions and indicators to localStorage
            localStorage.setItem(`leaderboard_positions_${leaderboard_id}`, JSON.stringify(currentPositions));
            localStorage.setItem(`leaderboard_indicators_${leaderboard_id}`, JSON.stringify(showPositionIndicators || hasAnyChange));
            
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        }
    };

    useEffect(() => {
        loadLeaderboard();
        const interval = setInterval(loadLeaderboard, 30000);
        return () => clearInterval(interval);
    }, [leaderboard_id]);

    function nextPage(){
        setPage(page.map(num => num + 8))
    }

    function previousPage(){
        setPage(page.map(num => num - 8 ))
    }
    
    return (
        <div className='tcs'> 
            <div className='leaderboard_container'>
                <div className='leaderboard_table'>
                    <div className='header_container'>
                        <div className='rank_header' onClick={previousPage} >RANK</div>
                        <div className='name_header'>TEAM</div>
                        <div style={{fontSize: '13px'}} className='info_header'>AVG PLACE</div>
                        <div className='info_header'>ELIMS</div>
                        <div className='info_header'>WINS</div>
                        <div onClick={nextPage} className='info_header'>POINTS</div>
                    </div>
                    {leaderboard ? leaderboard.slice(page[0],page[1]).map(data => {
                        const order = Math.abs(data.positionChange || 0) >= 500 ? 1 :
                                     Math.abs(data.positionChange || 0) >= 100 ? 2 :
                                     Math.abs(data.positionChange || 0) >= 50 ? 3 :
                                     Math.abs(data.positionChange || 0) >= 10 ? 4 :
                                     Math.abs(data.positionChange || 0) > 0 ? 5 : 6;
                        
                        return <Row 
                            key={data.teamname}
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
                            order={order}
                        />;
                    }) : ''}
                </div>
            </div>
        </div>

    )
}

export default LeaderboardTCS