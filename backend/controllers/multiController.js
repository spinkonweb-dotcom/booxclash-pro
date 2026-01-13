import MultiGame from '../models/MultiGame.js';

export async function getRooms(req, res) {
    try {
        const rooms = await MultiGame.find().select('roomId players');
        res.status(200).json({ success: true, count: rooms.length, data: rooms });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
}