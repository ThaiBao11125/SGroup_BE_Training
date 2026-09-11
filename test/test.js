



const 

const user = jsonData.users;

function getUserById(id) {
  return userr.find((user) => user.id === id);
}

function createUserFinder(users) {
  return function (id) {
    return users.find((user) => user.id === id);
  }}; 

const findUserById = createUserFinder(users);

const user1 = findUserById(1);
const user2 = findUserById(2);
const user3 = findUserById(3);

console.log(user1);
console.log(user2);
console.log(user3);
