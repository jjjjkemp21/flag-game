// Shared in-memory lobby store. The multiplayer router owns the lifecycle
// (create / join / progress / leave / cleanup), but the spectator router needs
// to *read* lobby state to surface a friend's live match to a watcher — so the
// Map lives here, not inside the router module.

const lobbies = new Map(); // code -> lobby

module.exports = { lobbies };
