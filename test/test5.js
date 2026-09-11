function getUser() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        id: 1,
        name: 'John'
      });
    }, 2000);
  });
}

// async function main() {
//   const user = getUser();

//   console.log(user);
// }

async function main() {
  const user = await getUser();

  console.log(user);
}

main();