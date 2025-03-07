import './App.css';
import React, {useState, useEffect} from "react"
import { useLocation } from 'react-router-dom';

function Row({rank, teamname, points, elims, avg_place, wins, order}) {
    return (
        <div className='row_container' style={{ '--animation-order': order }}>
            <div className='rank_container'>{rank}</div>
            <div className='name_container'>{teamname}</div>
            <div className='info_box'>{avg_place.toFixed(2)}</div>  
            <div className='info_box'>{elims}</div>  
            <div className='info_box'>{wins}</div>  
            <div className='info_box'>{points}</div>  
        </div>
    )
}

function LeaderboardReddyshRoyale() {

    const leaderboard_id = new URLSearchParams(useLocation().search).get('id');

    const [leaderboard, setLeaderboard] = useState(null)
    const [page, setPage] = useState([0, 8]) // Changer le nombres d'équipes par page
    const [teamsPerPage, setTeamsPerPage] = useState(8) // Changer le nombres d'équipes par page

    useEffect(() => {
        fetch("https://api.wls.gg/v5/leaderboards/"+leaderboard_id)
        .then(response => {return response.json()})
        .then(data => {
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
            console.log(data)
            setLeaderboard(leaderboard_list)
        })
    }, [leaderboard_id])

    function nextPage(){
        setPage([page[0] + teamsPerPage, page[1] + teamsPerPage])
    }

    function previousPage(){
        setPage([page[0] - teamsPerPage, page[1] - teamsPerPage])
    }

    return (
        <div className='stizo_cup'> 
            <div className='leaderboard_container'>
                <div className='leaderboard_table'>
                    <div className='header_container'>
                        <div className='rank_header' onClick={previousPage} >PLACE</div>
                        <div className='name_header'>ÉQUIPE</div>
                        <div className='info_header' style={{fontSize: '12px'}}>AVG PLACE</div>
                        <div className='info_header'>ELIMS</div>
                        <div className='info_header'>WINS</div>
                        <div onClick={nextPage} className='info_header'>POINTS</div>
                    </div>
                    {leaderboard ? leaderboard.slice(page[0],page[1]).map((data, index) => 
                        <Row 
                            key={`${page[0]}-${index}`}
                            rank={data.place} 
                            teamname={data.teamname} 
                            points={data.points} 
                            elims={data.elims} 
                            wins={data.wins} 
                            avg_place={data.avg_place}
                            order={index + 1} 
                        />
                    ) : ''}
                </div>
            </div>
        </div>
    )
}

export default LeaderboardReddyshRoyale