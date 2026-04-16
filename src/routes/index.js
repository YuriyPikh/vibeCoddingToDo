const express = require("express");

function createRoutes({ todoController }) {
  const router = express.Router();

  router.get("/", todoController.home);
  router.post("/todos", todoController.create);
  router.post("/todos/:id/toggle", todoController.toggle);
  router.post("/todos/:id/delete", todoController.remove);

  return router;
}

module.exports = {
  createRoutes,
};

