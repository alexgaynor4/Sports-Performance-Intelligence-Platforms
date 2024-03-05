const express = require('express');
const app = express();
const cors = require('cors');
const { phases, sessions } = require('./kinexon');

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
                    map[METRIC_LABELS[i]] = value;
                    return map;
                }, {});
            });
        });
    });
    res.json({ players, data: sessionsByDate });
});

app.listen(8080, () => console.log('API is running on http://localhost:8080'));
