import * as userRepository from "../repository/user.repository.js";
import { NotFoundError } from "../core/error.response.js";

export const getAllUser = async () => {
  return await userRepository.findAll();
};

export const getUserById = async (userId) => {
  const user = await userRepository.findById(parseInt(userId));
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return user;
};

export const addUser = async (userData) => {
  return await userRepository.create(userData);
};

export const updateUser = async (userId, updatedData) => {
  const user = await userRepository.update(parseInt(userId), updatedData);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return user;
};

export const deleteUser = async (userId) => {
  const user = await userRepository.deleteById(parseInt(userId));
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return user;
};

