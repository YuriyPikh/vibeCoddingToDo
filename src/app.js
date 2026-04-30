const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const { env } = require("./config/env");
const { createTodoController } = require("./controllers/todoController");
const { createRoutes } = require("./routes");
const { TodoService } = require("./services/todoService");

function createApp(options = {}) {
  const app = express();
  const nodeEnv = options.nodeEnv || env.nodeEnv;
  const todoService =
    options.todoService ||
    new TodoService({
      filePath: options.todoFilePath || env.todosFile,
    });
  const todoController = createTodoController({ todoService });

  app.disable("x-powered-by");
  app.set("view engine", "ejs");
  app.set("views", path.join(env.rootDir, "views"));

  app.use(helmet());
  app.use(morgan(nodeEnv === "production" ? "combined" : "dev"));
  app.use(express.urlencoded({ extended: false }));
  app.use(express.static(path.join(env.rootDir, "public")));

  app.use(createRoutes({ todoController }));

  app.use((req, res) => {
    renderShell(res, 404, "That page does not exist.");
  });

  app.use((error, req, res, _next) => {
    console.error(error);
    renderShell(res, 500, "Something went wrong while loading the app.");
  });

  return app;
}

function renderShell(res, statusCode, errorMessage) {
  const model = {
    page: {
      todos: [],
      buildType: env.buildType,
      assetPaths: env.assetPaths,
      stats: {
        total: 0,
        remaining: 0,
        completed: 0,
      },
      titleLimit: 80,
      draftTitle: "",
      errorMessage,
    },
  };

  res.status(statusCode).render("index", model, (error, html) => {
    if (error) {
      console.error(error);
      res
        .status(statusCode)
        .type("text/plain; charset=utf-8")
        .send(errorMessage);
      return;
    }

    res.send(html);
  });
}

const app = createApp();

module.exports = app;
module.exports.app = app;
module.exports.createApp = createApp;
