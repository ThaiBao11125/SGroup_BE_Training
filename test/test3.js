const user = {
  name: "John Doe",
  getName: function() {
    return this.name;
  }
}

console.log(user.getName()); 

const getName = user.getName();
console.log(getName);