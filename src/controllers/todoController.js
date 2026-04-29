const { TITLE_LIMIT, validateTitle } = require("../validation/todoValidation");
const { env } = require("../config/env");

function createTodoController({ todoService }) {
  async function renderIndex(res, state = {}) {
    const dashboard = await todoService.getDashboard();

    res.render("index", {
      page: {
        titleLimit: TITLE_LIMIT,
        buildType: env.buildType,
        assetPaths: env.assetPaths,
        errorMessage: "",
        draftTitle: "",
        ...state,
        ...dashboard,
      },
    });
  }

  return {
    home: async (req, res, next) => {
      try {
        await renderIndex(res);
      } catch (error) {
        next(error);
      }
    },

    create: async (req, res, next) => {
      const validation = validateTitle(req.body.title);

      if (!validation.isValid) {
        try {
          res.status(400);
          await renderIndex(res, {
            errorMessage: validation.message,
            draftTitle: typeof req.body.title === "string" ? req.body.title : "",
          });
        } catch (error) {
          next(error);
        }

        return;
      }

      try {
        await todoService.create(validation.value);
        res.redirect("/");
      } catch (error) {
        next(error);
      }
    },

    toggle: async (req, res, next) => {
      try {
        const todo = await todoService.toggle(req.params.id);

        if (!todo) {
          res.sendStatus(404);
          return;
        }

        res.redirect("/");
      } catch (error) {
        next(error);
      }
    },

    remove: async (req, res, next) => {
      try {
        await todoService.remove(req.params.id);
        res.redirect("/");
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = {
  createTodoController,
};
