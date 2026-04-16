const TITLE_LIMIT = 80;

function normalizeTitle(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ");
}

function validateTitle(value) {
  const title = normalizeTitle(value);

  if (!title) {
    return {
      isValid: false,
      message: "Enter a task before adding it.",
    };
  }

  if (title.length > TITLE_LIMIT) {
    return {
      isValid: false,
      message: `Keep the task under ${TITLE_LIMIT} characters.`,
    };
  }

  return {
    isValid: true,
    value: title,
  };
}

module.exports = {
  TITLE_LIMIT,
  validateTitle,
};

