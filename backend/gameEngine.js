import Question from './models/Questions.js';

export async function handleHostJoinRoom(io, socket, data, rooms, participantsCountMap, roomCurriculumMap) {
    const { roomId, maxPlayers, name, country, profilePic, curriculum } = data;
    socket.join(roomId);

    participantsCountMap.set(roomId, maxPlayers);
    const standardizedCurriculum = curriculum?.toLowerCase() || null;
    roomCurriculumMap.set(roomId, standardizedCurriculum);

    if (!rooms.has(roomId)) rooms.set(roomId, []);
    const players = rooms.get(roomId);
    const hostPlayer = {
        id: socket.id,
        name,
        country,
        profilePic,
        isHost: true,
        curriculum: standardizedCurriculum,
    };

    const index = players.findIndex(p => p.id === socket.id);
    if (index === -1) players.unshift(hostPlayer);
    else players[index] = hostPlayer;

    io.to(socket.id).emit('hostIsPlayer');
    io.to(roomId).emit('playerListUpdate', {
        players,
        joinedCount: players.length,
        maxPlayers,
    });

    console.log(`🛠️ Host ${name} created room ${roomId}`);
}

export function handleJoinRoom(io, socket, data, rooms, participantsCountMap) {
    const { roomId, name, country, profilePic } = data;
    socket.join(roomId);

    if (!rooms.has(roomId)) rooms.set(roomId, []);
    const players = rooms.get(roomId);
    const maxPlayers = participantsCountMap.get(roomId) || 4;

    const alreadyJoined = players.some(p => p.id === socket.id || p.name === name);
    if (alreadyJoined) return io.to(socket.id).emit('alreadyJoined');
    if (players.length >= maxPlayers) return io.to(socket.id).emit('roomFull');

    const newPlayer = {
        id: socket.id,
        name,
        country,
        profilePic,
        isHost: false,
    };

    players.push(newPlayer);
    io.to(socket.id).emit('playerWaiting');
    io.to(roomId).emit('playerListUpdate', {
        players,
        joinedCount: players.length,
        maxPlayers,
    });

    if (players.length === maxPlayers) {
        io.to(roomId).emit('roomIsNowFull');
        console.log(`🚫 Room ${roomId} is now full`);
    }
}

export function handleStartGame(io, socket, { roomId }, rooms, participantsCountMap, roomCurriculumMap) {
    const players = rooms.get(roomId) || [];
    const maxPlayers = participantsCountMap.get(roomId) || 4;
    const curriculum = roomCurriculumMap.get(roomId) || "n/a";

    const host = players.find(p => p.isHost);
    const hostName = host?.name || "Host";
    const hostCountry = host?.country || "Unknown";

    io.to(roomId).emit('gameStarting', {
        roomId,
        hostName,
        hostCountry,
        curriculum,
        hostIsPlayer: !!host,
        players,
        maxPlayers,
    });

    console.log(`🕹️ Game started in room ${roomId}`);
}

export async function handleStartKnockoutRound(io, socket, { roomId, subject, topic, level }, rooms, roomCurriculumMap) {
    const players = rooms.get(roomId) || [];
    const curriculum = roomCurriculumMap.get(roomId) || null;

    try {
        const questions = await loadFilteredQuestions(subject, topic, level, curriculum);

        const pairs = [];
        for (let i = 0; i < players.length; i += 2) {
            pairs.push([players[i], players[i + 1] || null]);
        }

        io.to(roomId).emit('knockoutRoundStarted', {
            roomId,
            pairs,
            questions,
            timer: 30,
        });

        console.log(`🏆 Knockout round started with ${pairs.length} pairs`);
    } catch (err) {
        console.error(`[Error] Failed to start knockout round:`, err);
        io.to(socket.id).emit('errorStartingKnockout', { message: 'Failed to start round' });
    }
}

async function loadFilteredQuestions(subject, topic, level, curriculum) {
    const query = { subject, topic, level };
    const standardized = curriculum?.toLowerCase();

    if (standardized === "local" || standardized === "cambridge") {
        query.curriculum = standardized.charAt(0).toUpperCase() + standardized.slice(1);
    }

    const questions = await Question.find(query).limit(3);
    return questions;
}

export function handleMessage(io, { roomId, message }) {
    io.to(roomId).emit('newMessage', message);
}

export function handleDisconnect(io, socket, rooms, participantsCountMap, roomCurriculumMap) {
    console.log(`❌ Disconnected: ${socket.id}`);

    for (const [roomId, players] of rooms.entries()) {
        const updatedPlayers = players.filter(p => p.id !== socket.id);
        if (updatedPlayers.length !== players.length) {
            rooms.set(roomId, updatedPlayers);
            io.to(roomId).emit('playerListUpdate', {
                players: updatedPlayers,
                joinedCount: updatedPlayers.length,
                maxPlayers: participantsCountMap.get(roomId) || 4,
            });
            console.log(`♻️ Updated players in room ${roomId}`);
        }

        if (updatedPlayers.length === 0) {
            rooms.delete(roomId);
            participantsCountMap.delete(roomId);
            roomCurriculumMap.delete(roomId);
            console.log(`🧹 Room ${roomId} deleted`);
        }
    }
}
