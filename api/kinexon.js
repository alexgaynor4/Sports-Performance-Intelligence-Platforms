const { USERNAME, PASSWORD, API_KEY } = require('./credentials');

const dateFormatter = Intl.DateTimeFormat('sv-SE')

const phases = async (startDate = '2021-09-01', endDate = dateFormatter.format(new Date())) => {
    const response = await fetch(
        `https://georgia-tech-mccamish.access.kinexon.com/public/v1/statistics/players/in-team-3/phases?apiKey=${API_KEY}&min=${startDate}%2000%3A00%3A00&max=${endDate}%2023%3A59%3A59&fields=`,
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

module.exports = { phases };
