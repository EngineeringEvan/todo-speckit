import db from "../models/index.js";
import logger from "../config/logger.js";
import {
  getAccessibleListOrNull,
  getAccessibleTodoOrNull,
} from "../authorization/authorization.js";
import { normalizeDueDateInput } from "../utils/dueDate.js";

const MAX_TITLE_LENGTH = 255;

const parseId = (value) => parseInt(value, 10);

const validateTitle = (title) => {
  if (!title?.trim()) {
    return "Todo title is required.";
  }
  if (title.trim().length > MAX_TITLE_LENGTH) {
    return "Todo title must be 255 characters or fewer.";
  }
  return null;
};

const exports = {};

exports.findAll = async (req, res) => {
  try {
    const listId = parseId(req.params.listId);
    if (Number.isNaN(listId)) {
      return res.status(400).send({ message: "Invalid list id." });
    }

    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    const todos = await db.todo.findAll({
      where: { listId, userId: req.user.id },
      order: [
        ["completed", "ASC"],
        ["createdAt", "ASC"],
      ],
    });

    return res.send(todos);
  } catch (err) {
    logger.error(`Todo findAll failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch todos." });
  }
};

exports.create = async (req, res) => {
  try {
    const listId = parseId(req.params.listId);
    if (Number.isNaN(listId)) {
      return res.status(400).send({ message: "Invalid list id." });
    }

    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    const titleError = validateTitle(req.body?.title);
    if (titleError) {
      return res.status(400).send({ message: titleError });
    }

    const dueDateResult = normalizeDueDateInput(req.body?.dueDate);
    if (dueDateResult.error) {
      return res.status(400).send({ message: dueDateResult.error });
    }

    const todo = await db.todo.create({
      title: req.body.title.trim(),
      completed: false,
      dueDate: dueDateResult.omitted ? null : dueDateResult.value,
      listId: list.id,
      userId: req.user.id,
    });

    return res.status(201).send(todo);
  } catch (err) {
    logger.error(`Todo create failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to create todo." });
  }
};

exports.update = async (req, res) => {
  try {
    const todoId = parseId(req.params.id);
    if (Number.isNaN(todoId)) {
      return res.status(400).send({ message: "Invalid todo id." });
    }

    const todo = await getAccessibleTodoOrNull(req, todoId);
    if (!todo) {
      return res.status(404).send({ message: `Todo with id=${todoId} not found.` });
    }

    if (req.body.title !== undefined) {
      const titleError = validateTitle(req.body.title);
      if (titleError) {
        return res.status(400).send({ message: titleError });
      }
      todo.title = req.body.title.trim();
    }

    if (req.body.completed !== undefined) {
      todo.completed = !!req.body.completed;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "dueDate")) {
      const dueDateResult = normalizeDueDateInput(req.body.dueDate);
      if (dueDateResult.error) {
        return res.status(400).send({ message: dueDateResult.error });
      }
      todo.dueDate = dueDateResult.value;
    }

    await todo.save();
    return res.send(todo);
  } catch (err) {
    logger.error(`Todo update failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to update todo." });
  }
};

exports.remove = async (req, res) => {
  try {
    const todoId = parseId(req.params.id);
    if (Number.isNaN(todoId)) {
      return res.status(400).send({ message: "Invalid todo id." });
    }

    const todo = await getAccessibleTodoOrNull(req, todoId);
    if (!todo) {
      return res.status(404).send({ message: `Todo with id=${todoId} not found.` });
    }

    await todo.destroy();
    return res.send({ message: "Todo deleted successfully." });
  } catch (err) {
    logger.error(`Todo remove failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to delete todo." });
  }
};

export default exports;
