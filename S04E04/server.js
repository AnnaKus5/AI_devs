import express from 'express';
import PilotServices from './PilotServices.js';

const app = express();
const PORT = 3000;

app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

const pilotServices = new PilotServices()

app.get('/', (req, res) => {
    res.send('Hello, world!');
});

app.post('/', async (req, res) => {
    try {
        console.log("Received request:", req.body);
        const instructions = req.body.instruction;
        const response = await pilotServices.runPilot(instructions);
        res.json(response);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
