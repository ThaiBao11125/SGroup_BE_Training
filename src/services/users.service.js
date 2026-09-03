import { readData } from "../repository/readData.js";
import { writeData } from "../repository/writeData.js";
import { NotFoundError } from "../core/error.response.js";

export const getAllUser = async () => {
  const data = await readData();
  return data.users;
};

export const getUserById = async (userId) => {
  const data = await readData();
  const user = data.users.find((u) => u.id === parseInt(userId));
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return user;
};

export const addUser = async (userData) => {
  const data = await readData();
  const newUser = {
    ...userData,
    id: data.users.length > 0 ? Math.max(...data.users.map((u) => u.id)) + 1 : 1,
  };
  data.users.push(newUser);
  await writeData(data);
  return newUser;
};

export const updateUser = async (userId, updatedData) => {
  const data = await readData();
  const userIndex = data.users.findIndex((u) => u.id === parseInt(userId));
  if (userIndex === -1) {
    throw new NotFoundError("User not found");
  }
  data.users[userIndex] = { ...data.users[userIndex], ...updatedData };
  await writeData(data);
  return data.users[userIndex];
};

export const deleteUser = async (userId) => {
  const data = await readData();
  const userIndex = data.users.findIndex((u) => u.id === parseInt(userId));
  if (userIndex === -1) {
    throw new NotFoundError("User not found");
  }

  const deletedUser = data.users[userIndex];
  data.users.splice(userIndex, 1);
  await writeData(data);
  return deletedUser;
};
