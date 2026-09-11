function createMinLengthValidator(minLength) {
  return function(value) {
    return value.length >= minLength;
  };
}

const validateUsername = createMinLengthValidator(5);
const validatePassword = createMinLengthValidator(8);

console.log(validateUsername("user"));
console.log(validateUsername("username"));
console.log(validatePassword("pass"));
console.log(validatePassword("password123"));