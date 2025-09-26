require("dotenv").config();
const express = require("express");
const Person = require("./models/person");
const morgan = require("morgan");

const app = express();
const errorHandler = (error, request, response, next) => {
  console.error(error.message);
  if (error.name === "CastError") {
    return response.status(400).send({ error: "Malformatted id" });
  }
  next(error);
};
app.use(express.static("dist"));
app.use(express.json());

let persons = [];

morgan.token("body", (request) => {
  return JSON.stringify(request.body);
});
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms :body")
);

//app info

app.get("/info", (request, response) => {
  const now = new Date();
  Person.countDocuments({})
    .then((count) => {
      response.send(`<div>
    <p>Phonebook has info for ${count} people</p>
    <p>${now}
    </div>`);
    })
    .catch((error) => {
      response.status(500).send({ error: "Failed to fetch data" });
    });
});

//get all persons
app.get("/api/persons", (request, response) => {
  Person.find({}).then((persons) => {
    response.json(persons);
  });
});

//get person by id
app.get("/api/persons/:id", (request, response, next) => {
  Person.findById(request.params.id)
    .then((person) => {
      if (person) {
        response.json(person);
      } else {
        response.status(404).end();
      }
    })
    .catch((error) => next(error));
});

//delete person by id
app.delete("/api/persons/:id", (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then((result) => {
      if (!result) {
        return response.status(404).json({ error: "person not found" });
      }
      response.status(204).end();
    })
    .catch((error) => {
      next(error);
    });
});

//create a person
app.post("/api/persons", (request, response) => {
  const body = request.body;

  if (!body.name || !body.number) {
    return response
      .status(400)
      .json({
        error: "name or number is missing",
      })
      .end();
  }

  Person.exists({ name: new RegExp("^" + body.name + "$", "i") })
    .then((nameExists) => {
      if (nameExists) {
        return response
          .status(400)
          .json({
            error: "name must be unique",
          })
          .end();
      }

      const person = new Person({
        name: body.name,
        number: body.number,
      });
      person
        .save()
        .then((savedPerson) => {
          response.json(savedPerson);
        })
        .catch((error) => next(error));
      console.log("person saved");
    })
    .catch((error) => next(error));
});

app.put("/api/persons/:id", (request, response, next) => {
  const { name, number } = request.body;

  Person.findByIdAndUpdate(request.params.id).then((person) => {
    if (!person) {
      response.status(400).end();
    }
    person.number = number;
    person
      .save()
      .then((updatedPerson) => {
        response.json(updatedPerson);
      })
      .catch((error) => next(error));
  });
});

//unknown request
const unknownEndpoint = (request, response) => {
  return response.status(404).send({ error: "unknown endpoint" });
};

app.use(unknownEndpoint);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
