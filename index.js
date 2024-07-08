const pg = require("pg");
const express = require("express");

const client = new pg.Client(
  process.env.DATABASE_URL ||
    "postgres://postgres:yourpassword@localhost/Acme_Ice_Cream_Flavors_db"
);
const app = express();

const init = async () => {
  await client.connect();
  console.log("connected to database");

  let SQL = `
    DROP TABLE IF EXISTS flavors;
    CREATE TABLE flavors (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now(),
      ranking INTEGER DEFAULT 3 NOT NULL,
      txt VARCHAR(255) NOT NULL
    );
  `;
  await client.query(SQL);
  console.log("tables created");

  SQL = `
    INSERT INTO flavors (txt, ranking) VALUES ('Chocolate', 5);
    INSERT INTO flavors (txt, ranking) VALUES ('Dulce De Leche', 4);
    INSERT INTO flavors (txt, ranking) VALUES ('Cookie Dough', 2);
  `;
  await client.query(SQL);
  console.log("data seeded");
};

init();

app.use(express.json());
app.use(require("morgan")("dev"));

app.post("/api/flavors", async (req, res, next) => {
  try {
    const SQL = `INSERT INTO flavors (txt, ranking) VALUES ($1, $2) RETURNING *`;
    const values = [req.body.txt, req.body.ranking];
    const response = await client.query(SQL, values);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.get("/api/flavors", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM flavors ORDER BY created_at DESC`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

app.put("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `
      UPDATE flavors
      SET txt=$1, ranking=$2, updated_at=now()
      WHERE id=$3 RETURNING *
    `;
    const values = [req.body.txt, req.body.ranking, req.params.id];
    const response = await client.query(SQL, values);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `DELETE FROM flavors WHERE id=$1`;
    const values = [req.params.id];
    await client.query(SQL, values);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`listening on port ${port}`));
