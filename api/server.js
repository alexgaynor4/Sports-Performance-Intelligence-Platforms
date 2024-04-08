const express = require('express');
const app = express();
const cors = require('cors');
const { phases, sessions } = require('./kinexon');

app.set('json spaces', 2);

app.use(cors());
app.use('/login', (req, res) => {
    res.send({
        token: 'test123',
    });
});

const METRIC_LABELS = [
    'Distance',
    'Acceleration Load',
    'Mechanical Load',
    'Physio Load',
    'Time',
    'Distance / min.',
    'Acceleration Load / min.',
    'Mechanical Load / min.',
    'Physio Load / min.',
];

const GAME_STAT_LABELS = [
    'Game Load',
    'Max. Jump Height',
    'Max. Speed',
    'Workload Zones',
    'Intensity Categories',
];

const normalizePhase = (phase) => {
    const dist = phase.distance_total / 1609;
    const time = phase.time_on_playing_field / 60;
    return [
        dist,
        phase.accel_load_accum,
        phase.mechanical_load,
        phase.physio_load,
        time,
        dist / time,
        phase.accel_load_accum / time,
        phase.mechanical_load / time,
        phase.physio_load / time,
    ];
};

const normalizePhaseCumulativeOnly = (phase) => {
    const dist = phase.distance_total / 1609;
    return [
        dist,
        phase.accel_load_accum,
        phase.mechanical_load,
        phase.physio_load,
    ];
};

const normalizeGameSession = (phase) => {
    return [
        [phase.accel_load_accum, phase.mechanical_load, phase.physio_load],
        (phase.jump_height_max ?? 0) * 39.37,
        (phase.speed_max ?? 0) * 2.237,
        [
            phase.distance_speed_category1,
            phase.distance_speed_category2,
            phase.distance_speed_category3,
            phase.distance_speed_category4,
            phase.distance_speed_category5,
            phase.distance_speed_category6,
        ].map((val) => (val ?? 0) * 3.281),
        [
            phase.load_acceleration_load_category1 ?? 0,
            phase.load_acceleration_load_category2 ?? 0,
            phase.load_acceleration_load_category3 ?? 0,
            phase.load_acceleration_load_category4 ?? 0,
        ],
    ];
};

app.use('/drills-by-player', async (req, res) => {
    const { start, end } = req.query;
    const phaseList = await phases(start, end);
    const phasesByPlayer = phaseList.reduce((map, phase) => {
        if (
            phase.type === 'Drill' &&
            phase.time_on_playing_field &&
            phase.description
        ) {
            const id = phase.player_id;
            let phaseMap;
            if (!map[id]) {
                phaseMap = {};
                const group = JSON.parse(phase.group_names)[
                    Object.values(JSON.parse(phase.group_assignment)).findIndex(
                        (assignment) =>
                            assignment.some(({ player_id }) => id === player_id)
                    )
                ];
                map[id] = {
                    info: {
                        firstName: phase.first_name,
                        lastName: phase.last_name,
                        number: phase.number,
                        group,
                    },
                    phases: phaseMap,
                };
            } else {
                phaseMap = map[id].phases;
            }
            const normalizedPhase = normalizePhase(phase);
            if (!phaseMap[phase.description]) {
                phaseMap[phase.description] = [normalizedPhase];
            } else {
                phaseMap[phase.description].push(normalizedPhase);
            }
        }
        return map;
    }, {});
    Object.keys(phasesByPlayer).forEach((id) => {
        const phaseMap = phasesByPlayer[id].phases;
        Object.keys(phaseMap).forEach((description) => {
            const count = phaseMap[description].length;
            const avgs = phaseMap[description].reduce((acc, metrics) => {
                metrics.forEach((metric, i) => {
                    acc[i] += metric;
                });
                return acc;
            });
            phaseMap[description] = {
                count: phaseMap[description].length,
                avgs: METRIC_LABELS.reduce((data, label, i) => {
                    data[label] = avgs[i] / count;
                    return data;
                }, {}),
            };
        });
    });
    res.json(phasesByPlayer);
});

app.use('/metrics-by-date', async (req, res) => {
    const { start, end } = req.query;
    const sessionList = await sessions(start, end);
    const players = {};
    const sessionsByDate = sessionList.reduce((map, session) => {
        const id = session.player_id;
        if (!players[id]) {
            const group = JSON.parse(session.group_names)[
                Object.values(JSON.parse(session.group_assignment)).findIndex(
                    (assignment) =>
                        assignment.some(({ player_id }) => id === player_id)
                )
            ];
            players[id] = {
                info: {
                    firstName: session.first_name,
                    lastName: session.last_name,
                    number: session.number,
                    group,
                },
            };
        }
        const date = session.start_session.slice(0, 10);
        const type = ['Game', 'Match', 'Shootaround'].includes(session.type)
            ? 'Game'
            : 'Practice';
        let cumulativeMetrics;
        if (!map[date]) {
            cumulativeMetrics = [0, 0, 0, 0];
            map[date] = { [type]: { [id]: cumulativeMetrics } };
        } else {
            if (!map[date][type]) {
                map[date][type] = {};
            }
            const playerMap = map[date][type];
            if (!playerMap[id]) {
                cumulativeMetrics = [0, 0, 0, 0];
                playerMap[id] = cumulativeMetrics;
            } else {
                cumulativeMetrics = playerMap[id];
            }
        }
        const normalizedSession = normalizePhaseCumulativeOnly(session);
        normalizedSession.forEach((value, i) => {
            cumulativeMetrics[i] += value;
        });
        return map;
    }, {});
    Object.keys(sessionsByDate).forEach((date) => {
        Object.values(sessionsByDate[date]).forEach((playerMap) => {
            Object.keys(playerMap).forEach((id) => {
                playerMap[id] = playerMap[id].reduce((map, value, i) => {
                    map[GAME_STAT_LABELS[i]] = value;
                    return map;
                }, {});
            });
        });
    });
    res.json({ players, data: sessionsByDate });
});

app.use('/game-stats-by-date', async (req, res) => {
    const { start, end } = req.query;
    const sessionList = await sessions(start, end);
    const players = {};
    const sessionsByDate = sessionList.reduce((map, session) => {
        const id = session.player_id;
        if (!players[id]) {
            const group = JSON.parse(session.group_names)[
                Object.values(JSON.parse(session.group_assignment)).findIndex(
                    (assignment) =>
                        assignment.some(({ player_id }) => id === player_id)
                )
            ];
            players[id] = {
                info: {
                    firstName: session.first_name,
                    lastName: session.last_name,
                    number: session.number,
                    group,
                },
            };
        }
        const date = session.start_session.slice(0, 10);
        if (!['Game', 'Match'].includes(session.type)) {
            return map;
        }
        const normalizedSession = normalizeGameSession(session);
        if (!map[date]) {
            map[date] = {};
        }
        map[date][id] = normalizedSession;
        return map;
    }, {});
    Object.keys(sessionsByDate).forEach((date) => {
        const playerMap = sessionsByDate[date];
        Object.keys(playerMap).forEach((id) => {
            playerMap[id] = playerMap[id].reduce((map, value, i) => {
                map[GAME_STAT_LABELS[i]] = value;
                return map;
            }, {});
        });
    });
    res.json({ players, data: sessionsByDate });
});

app.listen(8080, () => console.log('API is running on http://localhost:8080'));
