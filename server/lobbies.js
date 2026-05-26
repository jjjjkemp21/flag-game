// Shared in-memory lobby store. The multiplayer router owns the lifecycle
// (create / join / progress / leave / cleanup), but the spectator router needs
// to *read* lobby state to surface a friend's live match to a watcher — so the
// Map lives here, not inside the router module.

const lobbies = new Map(); // code -> lobby

// Find the lobby a given user is currently a member of, if any. Used by the
// spectator endpoint to resolve a target's active match without the spectator
// needing to know the lobby code. Returns the lobby object, not a view.
function findLobbyByMemberId(userId) {
    for (const lobby of lobbies.values()) {
        if (lobby.members && lobby.members[userId]) return lobby;
    }
    return null;
}

module.exports = { lobbies, findLobbyByMemberId };
