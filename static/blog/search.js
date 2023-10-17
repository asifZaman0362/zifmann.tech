function debounce(func, timeout = 300){
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

function getSearchResults(query) {
  fetch(`http://localhost:8000/search?term=${query}`)
    .then(res => res.text()
      .then(res => { document.querySelector("#search-results").innerHTML = res; })
      .catch(err => console.error(err)))
    .catch(err => console.error(err));
}

function search(target) {
  console.debug(target.value);
  debounce(getSearchResults)(target.value);
}
