const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
    playerMatchId: dbObject.player_match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

//Returns a list of all the players in the player table
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT
      *
    FROM
      player_details;`;
  const playersArray = await database.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertDbObjectToResponseObject(eachPlayer)
    )
  );
});

//Returns a specific player based on the player ID
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT 
      * 
    FROM 
      player_details 
    WHERE 
      player_id = ${playerId};`;
  const player = await database.get(getPlayerQuery);
  response.send(convertDbObjectToResponseObject(player));
});

//Updates the details of a specific player based on the player ID
app.put("/players/:playerId/", async (request, response) => {
  const { playerName } = request.body;
  const { playerId } = request.params;
  const updatePlayerQuery = `
  UPDATE
    player_details
  SET
    player_name = '${playerName}'
  WHERE
    player_id = ${playerId};`;

  await database.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//Returns the match details of a specific match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT 
      * 
    FROM 
      match_details 
    WHERE 
      match_id = ${matchId};`;
  const match = await database.get(getMatchQuery);
  response.send(convertDbObjectToResponseObject(match));
});

//Returns a list of all the matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchDetailsQuery = `
  SELECT matchId, match, year 
  FROM match_details NATURAL JOIN player_match_scores
  WHERE player_id = ${playerId};`;
  const matches = await db.all(getPlayerMatchDetailsQuery);
  response.send(matches);
});

//Returns a list of players of a specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersDetailsQuery = `
  SELECT playerId, playerName 
  FROM player_details NATURAL JOIN player_match_scores
  WHERE match_id = ${matchId};`;
  const players = await db.all(getMatchPlayersDetailsQuery);
  response.send(players);
});

//Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStatsQuery = `
    SELECT playerId, playerName, SUM(score), SUM(fours), 
    SUM(sixes)
    FROM player_details NATURAL JOIN player_match_scores
    WHERE player_id = ${playerId};`;
  const stats = await db.get(getStatsQuery);
  console.log(stats);
  response.send({
    totalScore: stats["SUM(score)"],
    totalFours: stats["SUM(fours)"],
    totalSixes: stats["SUM(sixes)"],
  });
});

module.exports = app;
