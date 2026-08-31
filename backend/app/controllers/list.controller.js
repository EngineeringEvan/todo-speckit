import db from "../models/index.js";
import logger from "../config/logger.js";
import { getAccessibleListOrNull } from "../authorization/authorization.js";

const MAX_NAME_LENGTH = 100;

const exports = {};

const validateName = (name) => {
  if (!name?.trim()) {
    return "List name is required.";
  }
  if (name.trim().length > MAX_NAME_LENGTH) {
    return "List name must be 100 characters or fewer.";
  }
  return null;
};

exports.findAll = async (req, res) => {
  try {
    const lists = await db.list.findAll({
      where: { userId: req.user.id },
      order: [["name", "ASC"]],
    });

    return res.send(lists);
  } catch (err) {
    logger.error(`List findAll failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch lists." });
  }
};

exports.create = async (req, res) => {
  try {
    const nameError = validateName(req.body?.name);
    if (nameError) {
      return res.status(400).send({ message: nameError });
    }

    const list = await db.list.create({
      name: req.body.name.trim(),
      userId: req.user.id,
    });

    return res.status(201).send(list);
  } catch (err) {
    logger.error(`List create failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to create list." });
  }
};

exports.update = async (req, res) => {
  try {
    const listId = parseInt(req.params.listId, 10);
    if (Number.isNaN(listId)) {
      return res.status(400).send({ message: "Invalid list id." });
    }

    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    const nameError = validateName(req.body?.name);
    if (nameError) {
      return res.status(400).send({ message: nameError });
    }

    list.name = req.body.name.trim();
    await list.save();

    return res.send(list);
  } catch (err) {
    logger.error(`List update failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to update list." });
  }
};

exports.remove = async (req, res) => {
  try {
    const listId = parseInt(req.params.listId, 10);
    if (Number.isNaN(listId)) {
      return res.status(400).send({ message: "Invalid list id." });
    }

    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    await list.destroy();

    return res.send({ message: "List deleted successfully." });
  } catch (err) {
    logger.error(`List remove failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to delete list." });
  }
};

export default exports;
