function components(array) {
  const N = array.length;
  var results = [];

  for (var i=0; i<N; i++) {
    if (array[i]) {
      for (var j=i+1; j<N; j++) {
        if (array[j]) {
          if (j>=N-1) {
            results.push([i, j-i+1]);
            i = j+1;
            break;
          } else continue;
        } else {
          results.push([i, j-i]);
          i = j+1;
          break;
        }
      }
    }
  }

  return results;
}

// console.log(components([1, 1, 1, 0, 0, 0])); // 0, 3
// console.log(components([1, 1, 1])); // 0, 3
// console.log(components([0, 0, 0, 1, 1, 1, 0, 0, 0])); // 3, 3
// console.log(components([0, 0, 0, 1, 1, 1]));
console.log(components([0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0])); // [3, 3], [8, 3]
