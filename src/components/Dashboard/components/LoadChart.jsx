import {
    Autocomplete,
    Box,
    Checkbox,
    CircularProgress,
    Grid,
    TableSortLabel,
    TextField,
} from '@mui/material';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import React, { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { amber, indigo, grey } from '@mui/material/colors';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export const options = {
    plugins: {
        title: {
            display: true,
            text: 'Load Chart',
        },
    },
    responsive: true,
    scales: {
        x: {
            stacked: true,
        },
        y: {
            stacked: true,
        },
    },
};

export default function LoadChart() {
    const [data, setData] = useState();
    const [playerData, setPlayerData] = useState();
    const [players, setPlayers] = useState();
    const [groups, setGroups] = useState();
    const [player, setPlayer] = useState();
    const [metrics, setMetrics] = useState();
    const [metric, setMetric] = useState('');
    const [orderBy, setOrderBy] = useState(1);
    const [order, setOrder] = useState('desc');

    useEffect(() => {
        fetch('http://localhost:8080/drills-by-date')
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
                setPlayers(players);
                setPlayerData(playerData);
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
                const metrics = Object.keys(
                    Object.values(Object.values(response.data)[0])[0]
                );
                setMetrics(metrics);
                setMetric(metrics[0]);
                setData(response.data);
            });
    }, []);

    const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
    const checkedIcon = <CheckBoxIcon fontSize="small" />;

    const config = () => {
        return {
            labels: Object.keys(data),
            datasets: [
                {
                    label: metric,
                    data: Object.values(data).map((stats) => {
                        let value = 0;
                        for (const id in stats) {
                            if (player.includes(parseInt(id))) {
                                value += stats[id][metric];
                            }
                        }
                        return value;
                    }),
                    backgroundColor: 'rgba(0, 48, 87, 0.75)',
                    borderColor: 'rgba(0, 48, 87, 1)',
                },
            ],
        };
    };

    const body = () => (
        <>
            <Grid container spacing={2} sx={{ mb: 1 }}>
                <Grid item xs={12} sm={6}>
                    <Autocomplete
                        multiple
                        limitTags={3}
                        value={player}
                        onChange={(_, newPlayers) => {
                            setPlayer(newPlayers);
                        }}
                        options={players}
                        groupBy={(id) => playerData[id].info.group}
                        getOptionLabel={(id) => {
                            const { info } = playerData[id];
                            return `#${info.number} ${info.firstName} ${info.lastName}`;
                        }}
                        renderOption={(props, option, { selected }) => {
                            const { info } = playerData[option];
                            return (
                                <li {...props}>
                                    <Checkbox
                                        icon={icon}
                                        checkedIcon={checkedIcon}
                                        style={{ marginRight: 8 }}
                                        checked={selected}
                                    />
                                    {`#${info.number} ${info.firstName} ${info.lastName}`}
                                </li>
                            );
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
                                    <Checkbox
                                        icon={icon}
                                        checkedIcon={checkedIcon}
                                        style={{
                                            margin: '0 8px',
                                            color: 'white',
                                        }}
                                        checked={groups[params.group].every(
                                            (id) => player.includes(id)
                                        )}
                                        onChange={(event) => {
                                            const newPlayer = event.target
                                                .checked
                                                ? [
                                                      ...player,
                                                      ...groups[
                                                          params.group
                                                      ].filter(
                                                          (id) =>
                                                              !player.includes(
                                                                  id
                                                              )
                                                      ),
                                                  ]
                                                : player.filter(
                                                      (id) =>
                                                          !groups[
                                                              params.group
                                                          ].includes(id)
                                                  );
                                            setPlayer(newPlayer);
                                        }}
                                    />
                                    {params.group}
                                </Box>
                                <ul style={{ padding: 0 }}>
                                    {params.children}
                                </ul>
                            </li>
                        )}
                        disableCloseOnSelect
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
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
                </Grid>
            </Grid>
            <Bar options={options} data={config()} />
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
