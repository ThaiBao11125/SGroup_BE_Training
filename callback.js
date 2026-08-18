let array = [1, 2, 3, 4, 5];

Array.prototype.forEach2 = function(callback) {
    for (let i = 0; i < this.length; i++) {
        callback(this[i]);
    }
}

array.forEach((element) => {
    console.log(element);
});

array.forEach2((element) => {
    console.log(element);
});