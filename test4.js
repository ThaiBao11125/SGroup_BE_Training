const user = {
  name: "John Doe",
  age: 30,
  email: "john.doe@exampole.com",
  address: {
    street: "123 Main St",
    city: "Anytown",
    state: "CA",
    zip: "12345"
  },
  gender: "male",
  school: "ABC University",
}

const addressOfUser = {
  addess: {
    street: "123 Main St",
    city: "Anytown",
    ...hehe
  }
} = user;

console.log(addressOfUser);