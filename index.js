require("dotenv").config();
const express = require("express");
const Person = require("./models/person");
const morgan = require("morgan");

const app = express();
app.use(express.json());
app.use(express.static("dist"));
let persons = [];

morgan.token("body", (request) => {
  return JSON.stringify(request.body);
});
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms :body")
);

app.get("/info", (request, response) => {
  const now = new Date();
  response.send(`<div>
    <p>Phonebook has info for ${persons.length} people</p>
    <p>${now}
    </div>`);
});
//get all persons
app.get("/api/persons", (request, response) => {
  Person.find({}).then((persons) => {
    console.log("response form here");
    response.json(persons);
  });
});
//get person by id
app.get("/api/persons/:id", (request, response) => {
  Person.findById(request.params.id).then((person) => {
    response.json(person);
  });
});

// //delete person by id
// app.delete("/api/persons/:id", (request, response) => {
//   const id = request.params.id;
//   persons = persons.filter((p) => p.id !== id);
//   response.status(204).end();
// });

//create a person
app.post("/api/persons", (request, response) => {
  const body = request.body;
  const nameChecker = persons.some(
    (p) => p.name.toLowerCase() === body.name.toLowerCase()
  );
  if (!body.name || !body.number) {
    return response.status(400).json({
      error: "name or number is missing",
    });
  }
  if (nameChecker) {
    return response.status(400).json({
      error: "name must be unique",
    });
  }

  const person = new Person({
    name: body.name,
    number: body.number,
  });
  person.save().then((savedPerson) => {
    response.json(savedPerson);
  });
  console.log("person saved");
});

const unknownEndpoint = (request, response) => {
  return response.status(404).send({ error: "unknown endpoint" });
};

app.use(unknownEndpoint);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
