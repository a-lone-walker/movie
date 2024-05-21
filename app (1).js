let express = require("express");
let sqlite3 = require("sqlite3");
let { open } = require("sqlite");
let path = require("path");
let app = express();
app.use(express.json());

let dbPath = path.join(__dirname, "moviesData.db");

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};
let db = null;

const connectDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error ${error.message}`);
    process.exit(1);
  }
};

connectDbAndServer();

//API 1: sending all movie names
app.get("/movies/", async (request, response) => {
  let query = `
    SELECT movie_name
    FROM movie`;
  let dbResponse = await db.all(query);
  response.send(
    dbResponse.map((eachObject) => {
      return convertDbObjectToResponseObject(eachObject);
    })
  );
});

//API 2: create a movie
app.post("/movies/", async (request, response) => {
  try {
    let dbRequest = request.body;
    const { directorId, movieName, leadActor } = dbRequest;
    const query = `
    INSERT INTO
    movie(director_id, movie_name, lead_actor)
    VALUES (${directorId}, ${movieName}, ${leadActor})`;
    const dbResponse = await db.run(query);
    let movieId = dbResponse.lastID;
    response.send("Movie Successfully Added");
  } catch (error) {
    console.log(`API 2 : ${error.me}`);
  }
});

//API 3: return a movie based on ID
app.get("/movies/:movieId/", async (request, response) => {
  try {
    let { movieId } = request.params;
    let query = `
    SELECT *
    FROM movie
    WHERE movie_id = ${movieId}`;
    let dbResponse = await db.get(query);
    response.send(dbResponse);
  } catch (error) {
    console.log(`API 3 ${error}`);
  }
});

//API 4: update a movie
app.put("/movies/:movieId/", async (request, response) => {
  let { movieId } = request.params;
  let dbRequest = request.body;
  const { directorId, movieName, leadActor } = dbRequest;
  let query = `
    UPDATE movie
    SET director_id = ${directorId}, movie_name = ${movieName}, lead_actor = ${leadActor}
    WHERE movie_id = ${movieId}`;
  await db.run(query);
  response.send("Movie Details Updated");
});

//API 5: delete
app.delete("/movies/:movieId/", async (request, response) => {
  let { movieId } = request.params;
  let query = `
    DELETE FROM movie
    WHERE movie_id = ${movieId}`;
  db.run(query);
  response.send("Movie Removed");
});

const convertDbForDirectors = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};

//API 6: get all directors
app.get("/directors/", async (request, response) => {
  let query = `
    SELECT * 
    FROM director`;
  let dbResponse = await db.all(query);
  response.send(
    dbResponse.map((eachObject) => {
      return convertDbForDirectors(eachObject);
    })
  );
});

//API 7: movies directed by a specific director
app.get("/directors/:directorId/movies/", async (request, response) => {
  let { directorId } = request.params;
  let query = `
    SELECT movie_name
    FROM movie
    WHERE director_id = ${directorId}`;
  let dbResponse = await db.all(query);
  response.send(
    dbResponse.map((eachObject) => {
      return convertDbObjectToResponseObject(eachObject);
    })
  );
});

module.exports = app;
