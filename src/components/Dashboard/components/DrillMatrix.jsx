import {
    Autocomplete,
    Box,
    Checkbox,
    CircularProgress,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    TextField,
} from '@mui/material';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import React, { useEffect, useState } from 'react';
import { percentage, summaryStats } from '../../../utils/stats';
import { amber, indigo, grey } from '@mui/material/colors';

export default function DrillMatrix() {
    const [data, setData] = useState();
    const [players, setPlayers] = useState();
    const [groups, setGroups] = useState();
    const [player, setPlayer] = useState();
    const [metrics, setMetrics] = useState();
    const [metric, setMetric] = useState('');
    const [aggregates, setAggregates] = useState();
    const [stats, setStats] = useState();
    const [gradient, setGradient] = useState();
    const [orderBy, setOrderBy] = useState(1);
    const [order, setOrder] = useState('desc');

    const SortArrow = ({ colIndex }) => (
        <TableSortLabel
            active={orderBy === colIndex}
            direction={orderBy === colIndex ? order : 'asc'}
            onClick={() => {
                setOrder(
                    orderBy === colIndex && order === 'asc' ? 'desc' : 'asc'
                );
                setOrderBy(colIndex);
            }}
        ></TableSortLabel>
    );
    const Indicator = ({ metric, value, ...other }) => {
        return (
            <TableCell
                sx={{
                    background: gradient,
                    padding: 0,
                    position: 'relative',
                }}
            >
                <Box
                    sx={{
                        backgroundColor: indigo[600],
                        color: 'white',
                        width: `${percentage(
                            value,
                            0,
                            (10 / 9) * stats?.max
                        )}%`,
                        height: '30px',
                        lineHeight: '30px',
                        borderRadius: '0 4px 4px 0',
                        textAlign: 'right',
                        paddingRight: '8px',
                    }}
                    className="mono"
                >
                    {value.toFixed(2)}
                </Box>
            </TableCell>
        );
    };

    const updateStatsAndGradients = (data, players, metric) => {
        const aggregates = players.reduce((map, id) => {
            Object.entries(data[id].phases).forEach(
                ([drillName, { count, avgs }]) => {
                    if (!map[drillName]) {
                        map[drillName] = {
                            counts: [count],
                            avgs,
                        };
                    } else {
                        map[drillName].counts.push(count);
                        Object.keys(map[drillName].avgs).forEach((key) => {
                            map[drillName].avgs[key] += avgs[key];
                        });
                    }
                }
            );
            return map;
        }, {});
        Object.values(aggregates).forEach((phaseData) => {
            Object.keys(phaseData.avgs).forEach((key) => {
                phaseData.avgs[key] /= phaseData.counts.length;
            });
            phaseData.count = phaseData.counts.reduce(
                (acc, curr) => acc + curr
            );
        });
        setAggregates(aggregates);
        const stats = summaryStats(
            Object.values(aggregates).map((phaseData) => phaseData.avgs[metric])
        );
        setStats(stats);
        const max = (10 / 9) * stats.max;
        const breakpoints = [
            0,
            percentage(stats.q1, 0, max),
            percentage(stats.med, 0, max),
            percentage(stats.q3, 0, max),
            100,
        ];
        setGradient(
            `linear-gradient(90deg, ${breakpoints
                .slice(1)
                .map(
                    (percentage, i) =>
                        `${amber[i * 200 + 100]} ${breakpoints[i]}%, ${
                            amber[i * 200 + 100]
                        } ${percentage}%`
                )
                .join(', ')})`
        );
    };

    useEffect(() => {
        fetch('http://localhost:8080/drills-by-player')
            .then((response) => response.json())
            .then((data) => {
                if (!data.size) return;
                const players = Object.keys(data)
                    .sort(
                        (a, b) =>
                            -data[a].info.group.localeCompare(
                                data[b].info.group
                            ) || data[a].info.number - data[b].info.number
                    )
                    .map((id) => parseInt(id));
                setPlayers(players);
                setGroups(
                    players.reduce((groups, id) => {
                        const { group } = data[id].info;
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
                    Object.values(Object.values(data)[0].phases)[0].avgs
                );
                setMetrics(metrics);
                setMetric(metrics[0]);
                setData(data);
                updateStatsAndGradients(data, [players[0]], metrics[0]);
            });
    }, []);

    const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
    const checkedIcon = <CheckBoxIcon fontSize="small" />;

    return (
        <>
            {aggregates ? (
                <>
                    <Grid container spacing={2} sx={{ mb: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <Autocomplete
                                multiple
                                limitTags={3}
                                value={player}
                                onChange={(_, newPlayers) => {
                                    setPlayer(newPlayers);
                                    updateStatsAndGradients(
                                        data,
                                        newPlayers,
                                        metric
                                    );
                                }}
                                options={players}
                                groupBy={(id) => data[id].info.group}
                                getOptionLabel={(id) => {
                                    const { info } = data[id];
                                    return `#${info.number} ${info.firstName} ${info.lastName}`;
                                }}
                                renderOption={(props, option, { selected }) => {
                                    const { info } = data[option];
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
                                    <TextField
                                        {...params}
                                        label="Select a player"
                                    />
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
                                                checked={groups[
                                                    params.group
                                                ].every((id) =>
                                                    player.includes(id)
                                                )}
                                                onChange={(event) => {
                                                    const newPlayer = event
                                                        .target.checked
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
                                                                      params
                                                                          .group
                                                                  ].includes(id)
                                                          );
                                                    setPlayer(newPlayer);
                                                    updateStatsAndGradients(
                                                        data,
                                                        newPlayer,
                                                        metric
                                                    );
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
                                    updateStatsAndGradients(
                                        data,
                                        players,
                                        newMetric
                                    );
                                }}
                                options={metrics}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Select a metric"
                                    />
                                )}
                                disableClearable
                            />
                        </Grid>
                    </Grid>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell
                                        sx={{
                                            width: '30%',
                                            minWidth: '200px',
                                        }}
                                    >
                                        Drill
                                        <SortArrow colIndex={0} />
                                    </TableCell>
                                    <TableCell>
                                        {metric}
                                        <SortArrow colIndex={1} />
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {Object.entries(aggregates)
                                    .sort(
                                        (a, b) =>
                                            (order === 'asc' ? 1 : -1) *
                                            (orderBy === 0
                                                ? a[0].localeCompare(b[0])
                                                : a[orderBy].avgs[metric] -
                                                  b[orderBy].avgs[metric])
                                    )
                                    .map(([drillName, { count, avgs }]) => (
                                        <TableRow>
                                            <TableCell>
                                                {drillName}{' '}
                                                <span className="mono">
                                                    ({count})
                                                </span>
                                            </TableCell>
                                            <Indicator
                                                metric={metric}
                                                value={avgs[metric]}
                                            />
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            ) : (
                <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress />
                </Box>
            )}
        </>
    );
}
