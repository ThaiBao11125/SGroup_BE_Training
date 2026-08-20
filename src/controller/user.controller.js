import * as userService from "../services/users.service.js";

export const getAllUser = async (req, res) => {
  try {
    const users = await userService.getAllUser();

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to read users data" });
  }
};

export const getUserById = async (req, res) => {
  const userId = req.params.id;

  try {
    const users = await userService.getAllUser();
    const user = users.find((u) => u.id === parseInt(userId));

    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to read users data" });
  }
};

export const addUser = async (req, res) => {
  try {
    const newUser = await userService.addUser(req.body);
    res.status(201).json({
      message: "User added successfully",
      user: newUser,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to add user" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const updatedUser = await userService.updateUser(req.params.id, req.body);

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    res.status(500).json({ err: "Failed to update user" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const userIndex = req.params.id;

    const deletedUser = await userService.deleteUser(userIndex);

    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "User deleted successfully",
      user: deletedUser,
    });
  } catch (err) {
    res.status(500).json({ err: "Failed to delete user" });
  }
};
