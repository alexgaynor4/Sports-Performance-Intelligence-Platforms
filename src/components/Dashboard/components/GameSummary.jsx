import {
    Autocomplete,
    Box,
    CircularProgress,
    Grid,
    TextField,
    Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, Colors, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut, Pie } from 'react-chartjs-2';

ChartJS.register(Colors, Title, Tooltip, Legend);

export default function GameSummary() {
    const [data, setData] = useState();
    const [playerData, setPlayerData] = useState();
    const [players, setPlayers] = useState();
    const [player, setPlayer] = useState();
    const [_, setGroups] = useState();
    const [date] = useState('2024-03-02');

    useEffect(() => {
        fetch('http://localhost:8080/game-stats-by-date')
            .then((response) => response.json())
            .then((response) => {
                const playerData = response.players;
                const players = Object.keys(playerData)
                    .sort(
                        (a, b) =>
                            -playerData[a].info.group.localeCompare(
                                playerData[b].info.group
                            ) ||
                            playerData[a].info.number -
                                playerData[b].info.number
                    )
                    .map((id) => parseInt(id));
                setPlayerData(playerData);
                setPlayers(players);
                setGroups(
                    players.reduce((groups, id) => {
                        const { group } = playerData[id].info;
                        if (!groups[group]) {
                            groups[group] = [id];
                        } else {
                            groups[group].push(id);
                        }
                        return groups;
                    }, {})
                );
                setPlayer([players[0]]);
                setData(response.data);
                console.log(response.data);
            });
    }, []);

    const body = () => (
        <>
            <Grid container spacing={2} sx={{ mb: 1 }}>
                <Grid item xs={12} sm={6}>
                    <Autocomplete
                        value={player}
                        onChange={(_, newPlayer) => {
                            setPlayer(newPlayer);
                        }}
                        options={players}
                        groupBy={(id) => playerData[id].info.group}
                        getOptionLabel={(id) => {
                            const { info } = playerData[id];
                            return `#${info.number} ${info.firstName} ${info.lastName}`;
                        }}
                        renderInput={(params) => (
                            <TextField {...params} label="Select a player" />
                        )}
                        renderGroup={(params) => (
                            <li key={params.key}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '4px 8px',
                                        backgroundColor:
                                            params.group === 'Guards'
                                                ? 'primary.main'
                                                : 'secondary.main',
                                        color: 'white',
                                        textTransform: 'uppercase',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {params.group}
                                </Box>
                                <ul style={{ padding: 0 }}>
                                    {params.children}
                                </ul>
                            </li>
                        )}
                    />
                </Grid>
                {/* <Grid item xs={12} sm={6}>
                    <Autocomplete
                        value={metric}
                        onChange={(_, newMetric) => {
                            setMetric(newMetric);
                        }}
                        options={metrics}
                        renderInput={(params) => (
                            <TextField {...params} label="Select a metric" />
                        )}
                        disableClearable
                    />
                </Grid> */}
            </Grid>
            <Typography
                variant="h5"
                component="h2"
                align="center"
                sx={{ my: 2 }}
            >
                Game Report for {playerData[player].info.firstName}{' '}
                {playerData[player].info.lastName} on {date}
            </Typography>
            {data[date][player] !== undefined && (
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Box
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            maxHeight={400}
                        >
                            <Typography variant="h6" component="h3">
                                Game Load
                            </Typography>
                            <Doughnut
                                options={{
                                    responsive: true,
                                    rotation: -90,
                                    circumference: 180,
                                }}
                                data={{
                                    labels: [
                                        'Acceleration Load',
                                        'Mechanical Load',
                                        'Physio Load',
                                    ],
                                    datasets: [
                                        {
                                            label: 'Game Load',
                                            data: data[date][player][
                                                'Game Load'
                                            ],
                                        },
                                    ],
                                }}
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={6}>
                        <Box
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                        >
                            <Typography variant="h6" component="h3">
                                Minutes
                            </Typography>
                            <Typography variant="h2" component="span">
                                0:00
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={6}>
                        <Box
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                        >
                            <Typography variant="h6" component="h3">
                                Workload Zones
                            </Typography>
                            <Bar
                                options={{
                                    plugins: {
                                        legend: {
                                            display: false,
                                        },
                                    },
                                }}
                                data={{
                                    labels: [
                                        'Very Low',
                                        'Low',
                                        'Typical',
                                        'High',
                                        'Very High',
                                    ],
                                    datasets: [
                                        {
                                            data: data[date][player][
                                                'Workload Zones'
                                            ],
                                        },
                                    ],
                                }}
                            />
                        </Box>
                    </Grid>
                    <Grid container item xs={6} spacing={2}>
                        <Grid item xs={12}>
                            <Box
                                display="flex"
                                flexDirection="column"
                                alignItems="center"
                            >
                                <Typography variant="h6" component="h3">
                                    Max. Jump Height (ft)
                                </Typography>
                                <Typography variant="h2" component="span">
                                    {data[date][player][
                                        'Max. Jump Height'
                                    ].toFixed(2)}
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <Box
                                display="flex"
                                flexDirection="column"
                                alignItems="center"
                            >
                                <Typography variant="h6" component="h3">
                                    Max. Speed (mph)
                                </Typography>
                                <Typography variant="h2" component="span">
                                    {data[date][player]['Max. Speed'].toFixed(
                                        2
                                    )}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                    <Grid container item xs={6}>
                        <Grid item xs={12}>
                            <Box
                                display="flex"
                                flexDirection="column"
                                alignItems="center"
                            >
                                <Typography variant="h6" component="h3">
                                    Intensity
                                </Typography>
                                <Pie
                                    data={{
                                        labels: [
                                            'Low',
                                            'Medium',
                                            'High',
                                            'Very High',
                                        ],
                                        datasets: [
                                            {
                                                label: 'Intensity',
                                                data: data[date][player][
                                                    'Intensity Categories'
                                                ],
                                            },
                                        ],
                                    }}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </Grid>
            )}
        </>
    );

    return (
        <>
            {data ? (
                body()
            ) : (
                <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress />
                </Box>
            )}
        </>
    );
}
