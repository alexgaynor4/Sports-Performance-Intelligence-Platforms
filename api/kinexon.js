const { USERNAME, PASSWORD, API_KEY } = require('./credentials');

const dateFormatter = Intl.DateTimeFormat('sv-SE');

const statistics = async (
    keyword,
    startDate = '2023-03-08',
    endDate = dateFormatter.format(new Date())
) => {
    const response = await fetch(
        `https://georgia-tech-mccamish.access.kinexon.com/public/v1/statistics/players/in-team-3/${keyword}?apiKey=${API_KEY}&min=${startDate}&max=${endDate}&fields=`,
        {
            method: 'GET',
            headers: {
                Authorization:
                    'Basic ' +
                    Buffer.from(USERNAME + ':' + PASSWORD).toString('base64'),
            },
        }
    );
    return await response.json();
};

const phases = (startDate, endDate) => statistics('phases', startDate, endDate);

const sessions = (startDate, endDate) =>
    statistics('sessions', startDate, endDate);

module.exports = { phases, sessions };
